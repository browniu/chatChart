import { ChartConfig } from "../types";

export const generateChartFromPrompt = async (prompt: string, language: 'zh' | 'en' = 'zh'): Promise<ChartConfig> => {
  // 从环境变量读取配置
  const apiKey = process.env.ZP_API_KEY;
  const apiUrl = process.env.ZP_API_URL;

  if (!apiKey) {
    throw new Error("智谱 API Key 缺失。请检查您的环境配置。");
  }

  if (!apiUrl) {
    throw new Error("智谱 API URL 缺失。请检查您的环境配置。");
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
  - For PIE charts: data MUST have 'name' field for labels and 'value' field for values.
- Construct 'series' array. Each series should have: dataKey (string, required), name (string), color (string, required), type (optional: "monotone", "linear", "step").
- Set 'xAxisKey':
  - For PIE charts: set to empty string "" or null (pie charts don't need xAxisKey).
  - For other charts: set to the key used for X-axis labels (e.g., "name", "month").
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
    // 在开发环境下使用代理路径避免 CORS 问题
    let finalApiUrl = apiUrl;
    if (import.meta.env.DEV && apiUrl.includes('bigmodel.cn')) {
      finalApiUrl = apiUrl.replace('https://open.bigmodel.cn', '/api/zhipu');
    }

    const response = await fetch(finalApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: messages,
        temperature: 0.3, // 较低的温度以获得更稳定的代码生成
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('智谱 API 错误:', errorText);
      throw new Error(`API 调用失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // 根据智谱 API 的响应格式提取内容
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("智谱 API 返回了空响应");
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
      throw new Error("无法解析智谱 API 返回的图表配置。");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("调用智谱 API 时发生未知错误");
  }
};

