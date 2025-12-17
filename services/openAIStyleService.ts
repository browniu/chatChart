import { ChartConfig } from "../types";

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

export const generateChartFromPrompt = async (
  prompt: string, 
  language: 'zh' | 'en' = 'zh',
  config: OpenAIStyleConfig
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

  const systemPrompt = `You are a chart configuration generator. Generate a valid JSON configuration based on user requests.

Guidelines:
1. Determine if the user wants a Statistical Chart (numbers, trends) or a Diagram (processes, architectures, relationships).

[IF STATISTICAL CHART]:
- Set 'chartType' to one of: "line", "bar", "area", "pie", or "composed".
- Construct 'data' array with data points. Each data point should be an object with keys like: name, value, sales, profit, count, quarter, month, year, label, etc.
- Construct 'series' array. Each series should have: dataKey (string, required), name (string), color (string, required), type (optional: "monotone", "linear", "step").
- Set 'xAxisKey' to the key used for X-axis labels (e.g., "name", "month").
- Leave 'mermaidCode' empty or undefined.

[IF DIAGRAM/FLOWCHART]:
- Set 'chartType' to "mermaid".
- Generate valid Mermaid.js syntax in 'mermaidCode'.
- Use 'graph TD' (top-down) or 'graph LR' (left-right) as appropriate.
- Use subgraphs for clusters if needed.
- Use professional node labels (e.g., [SFT Model] instead of A).
- Keep styling simple.
- Set 'data' and 'series' to empty arrays or null.
- Leave 'xAxisKey' empty or undefined.

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

  const messages = [
    { 
      role: 'system', 
      content: systemPrompt
    },
    { 
      role: 'user', 
      content: `Generate a chart configuration for: "${prompt}"`
    }
  ];

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

