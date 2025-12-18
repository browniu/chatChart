import { ChartConfig } from "../types";

export type GenerationMode = 'auto' | 'standard' | 'html';

/**
 * 通用的 OpenAI API 兼容服务
 * 支持所有使用 OpenAI API 格式的平台（如小米、DeepSeek、Moonshot 等）
 */

export interface OpenAIStyleConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature?: number;
}

/**
 * 预定义的 OpenAI 兼容平台配置
 */
export const OPENAI_COMPATIBLE_PLATFORMS = {
  xiaomi: {
    name: '小米 AI',
    nameEn: 'Xiaomi AI',
    defaultBaseUrl: 'https://api.xiaomimimo.com/v1',
    defaultModel: 'mimo-v2-flash',
    envKeyName: 'XM_API_KEY',
    envUrlName: 'XM_API_URL'
  },
  deepseek: {
    name: 'DeepSeek',
    nameEn: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    envKeyName: 'DS_API_KEY',
    envUrlName: 'DS_API_URL'
  },
  moonshot: {
    name: '月之暗面',
    nameEn: 'Moonshot',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    envKeyName: 'MS_API_KEY',
    envUrlName: 'MS_API_URL'
  },
  custom: {
    name: '自定义 OpenAI',
    nameEn: 'Custom OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    envKeyName: 'CUSTOM_API_KEY',
    envUrlName: 'CUSTOM_API_URL'
  }
} as const;

export type OpenAIPlatformKey = keyof typeof OPENAI_COMPATIBLE_PLATFORMS;

export const generateChartFromPrompt = async (
    prompt: string,
    mode: GenerationMode = 'auto',
    language: 'zh' | 'en' = 'zh',
    config: OpenAIStyleConfig,
    imageBase64?: string,
): Promise<ChartConfig> => {
  const { apiKey, baseUrl, model, temperature = 0.3 } = config;

  if (!apiKey) {
    throw new Error("API Key 缺失。请检查您的环境配置。");
  }

  if (!baseUrl) {
    throw new Error("API Base URL 缺失。请检查您的环境配置。");
  }

  const langInstruction = language === 'en'
      ? "YOU MUST USE ENGLISH for all text fields."
      : "YOU MUST USE CHINESE (Simplified) for all text fields unless explicitly requested otherwise.";

  let modeInstruction = "";
  if (mode === 'standard') {
    modeInstruction = "FORCE Standard Library Usage: You MUST use Recharts (line, bar, pie, etc.) or Mermaid.js. Do NOT generate HTML/CSS.";
  } else if (mode === 'html') {
    modeInstruction = "FORCE HTML Mode: You MUST generate a custom layout using HTML and Tailwind CSS in the 'htmlCode' field. Set chartType to 'html'.";
  } else {
    modeInstruction = "AUTO Mode: Analyze the request (and image if provided). If it's a standard statistical chart or flowchart, use Recharts/Mermaid. If it's a complex infographic, custom dashboard layout, or requires specific visual styling that libraries can't do, use HTML/Tailwind.";
  }

  const systemPrompt = `You are a chart configuration generator. Generate a valid JSON configuration based on user requests.

Guidelines:
${modeInstruction}

[IF STATISTICAL CHART]:
- Set 'chartType' to one of: "line", "bar", "area", "pie", or "composed".
- Construct 'data' array with data points. Each data point should be an object with keys like: name, value, sales, profit, count, quarter, month, year, label, etc.
  - For PIE charts: data MUST have 'name' field for labels and 'value' field for values.
- Construct 'series' array. Each series should have: dataKey (string, required), name (string), color (string, required), type (optional: "monotone", "linear", "step").
- Set 'xAxisKey':
  - For PIE charts: set to empty string "" or null (pie charts don't need xAxisKey).
  - For other charts: set to the key used for X-axis labels (e.g., "name", "month").
- Leave 'mermaidCode' empty or undefined.

[IF DIAGRAM/FLOWCHART]:
- Set 'chartType' to "mermaid".
- Generate valid Mermaid.js syntax in 'mermaidCode' (strictly compliant with Mermaid's official flowchart grammar).
- Use 'graph TD' (top-down) or 'graph LR' (left-right) as appropriate.
- Use subgraphs for clusters if needed; omit if no grouping is required.
- Use professional, semantic node labels (e.g., ["SFT Model"] instead of generic "A"; avoid ambiguous abbreviations where possible).
- Keep styling simple: Only include essential styles (fill, stroke, stroke-width) if needed; avoid complex animations or redundant formatting.
- Enclose ALL node labels in double quotes (format: ["Label Text"]) to prevent parsing errors from special characters (e.g., /, (), &, |).
- For bilingual labels (Chinese + English), separate text with <br> (e.g., ["Data Cleaning<br>数据清洗"]) for readability and valid parsing.
- STRICTLY PROHIBIT: Adding any comments (//, /* */, #, etc.), trailing spaces, or empty lines in the mermaidCode.
- Ensure special characters (/, (), &, :, ;, ?, ! etc.) are contained within quoted node labels—prefer Chinese special characters (e.g., ？ instead of ?) for better compatibility.
- For decision nodes (diamond shape), use the format {"Decision Label<br>English Label"} with double quotes inside curly braces; avoid unescaped special characters here.
- Use branch syntax: -- [Branch Text] --> (e.g., -- Yes -->) instead of -->|[Branch Text]| for universal compatibility across Mermaid renderers.
- Set 'data' and 'series' to empty arrays or null.
- Leave 'xAxisKey' empty or undefined.
- Output ONLY renderable Mermaid code in 'mermaidCode'—no extra explanations, notes, or formatting outside the valid syntax.

[IF HTML/INFOGRAPHIC]:
- Set 'chartType' to 'html'.
- Generate a complete, responsive HTML component in 'htmlCode'.
- Use Tailwind CSS classes for styling.
- Ensure it looks modern and professional.
- Do not use external CSS or JS links, use inline styles or Tailwind.

Response Format:
{
  "title": "A short, descriptive title",
  "description": "A brief explanation of the data context (optional)",
  "chartType": "line" | "bar" | "area" | "pie" | "composed" | "mermaid",
  "xAxisKey": "string (for statistical charts only)",
  "data": [array of data points (for statistical charts only)],
  "series": [array of series config (for statistical charts only)],
  "mermaidCode": "string (for mermaid charts only)"
}

Language Rule: ${langInstruction}

IMPORTANT: Return ONLY valid JSON. Do not include any markdown code blocks, explanations, or other text.`;

  let userContent;
  if (imageBase64) {
    // 多模态内容：图片 + 文本说明
    userContent = [
      // 图片部分（OpenAI 要求 image_url 格式，需保留完整 Base64 前缀）
      {
        type: "image_url",
        image_url: {
          url: imageBase64, // 直接使用原始 Base64（包含 data:mime;base64, 前缀）
          // 可选：添加 detail 参数（low/auto/high，控制图片解析精度）
          detail: "auto"
        }
      },
      // 文本部分：分析需求
      {
        type: "text",
        text: `Analyze this image and recreate it as a visualization. Request: "${prompt}"`
      }
    ];
  } else {
    // 无图片：纯文本内容
    userContent = `Generate a chart configuration for: "${prompt}"`;
  }

  const messages = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: userContent
    }
  ];

  console.log('🚗 提示词', messages);

  try {
    // 构建完整的 API URL
    let apiUrl = baseUrl.endsWith('/chat/completions')
        ? baseUrl
        : `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    // 在开发环境下使用代理路径避免 CORS 问题
    if (import.meta.env.DEV) {
      // 将真实 API URL 转换为代理路径
      if (apiUrl.includes('xiaomimimo.com')) {
        apiUrl = apiUrl.replace('https://api.xiaomimimo.com', '/api/xiaomi');
      } else if (apiUrl.includes('deepseek.com')) {
        apiUrl = apiUrl.replace('https://api.deepseek.com', '/api/deepseek');
      } else if (apiUrl.includes('moonshot.cn')) {
        apiUrl = apiUrl.replace('https://api.moonshot.cn', '/api/moonshot');
      } else if (apiUrl.includes('openai.com')) {
        // OpenAI 官方 API 不需要代理（通常不会有 CORS 问题）
      }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Style API 错误:', errorText);
      throw new Error(`API 调用失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // OpenAI 标准响应格式
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("API 返回了空响应");
    }

    try {
      // 尝试清理可能包含的 markdown 代码块
      let cleanContent = content.trim();

      // 移除可能的 markdown 代码块标记
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const json = JSON.parse(cleanContent) as ChartConfig;

      // 验证返回的配置
      if (!json.title || !json.chartType) {
        throw new Error("返回的配置缺少必需字段 (title 或 chartType)");
      }

      return json;
    } catch (parseError) {
      console.error("解析 AI 响应失败:", content, parseError);
      throw new Error("无法解析 API 返回的图表配置。");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("调用 API 时发生未知错误");
  }
};

