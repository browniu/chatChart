import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ChartConfig } from "../types";

// Define the response schema for strict JSON generation
const chartSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A short, descriptive title for the chart" },
    description: { type: Type.STRING, description: "A brief explanation of the data context" },
    chartType: { 
      type: Type.STRING, 
      enum: ["line", "bar", "area", "pie", "composed", "mermaid"],
      description: "The best type of chart. Use 'mermaid' for flowcharts, diagrams, sequence diagrams, architectures, or process maps. Use others for statistical data."
    },
    // Mermaid specific
    mermaidCode: {
      type: Type.STRING,
      description: "The Mermaid.js code string. ONLY required if chartType is 'mermaid'. Do NOT use markdown code blocks, just the raw string. Use 'graph TD' or 'graph LR' for flowcharts."
    },
    // Recharts specific (nullable/optional in logic)
    xAxisKey: { type: Type.STRING, description: "The key for X-axis labels (Required for statistical charts, empty for mermaid)", nullable: true },
    data: {
      type: Type.ARRAY,
      nullable: true,
      description: "Data points (Required for statistical charts, empty for mermaid)",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quarter: { type: Type.STRING },
          month: { type: Type.STRING },
          year: { type: Type.STRING },
          label: { type: Type.STRING },
          value: { type: Type.NUMBER },
          sales: { type: Type.NUMBER },
          profit: { type: Type.NUMBER },
          count: { type: Type.NUMBER }
        }
      }
    },
    series: {
      type: Type.ARRAY,
      nullable: true,
      description: "Series config (Required for statistical charts, empty for mermaid)",
      items: {
        type: Type.OBJECT,
        properties: {
          dataKey: { type: Type.STRING },
          name: { type: Type.STRING },
          color: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["monotone", "linear", "step"] }
        },
        required: ["dataKey", "color"]
      }
    }
  },
  required: ["title", "chartType"]
};

export const generateChartFromPrompt = async (prompt: string, language: 'zh' | 'en' = 'zh'): Promise<ChartConfig> => {
  // Check for custom configuration in localStorage
  const customBaseUrl = localStorage.getItem('customBaseUrl');
  
  // API key must be obtained exclusively from the environment variable process.env.API_KEY
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing. Please check your settings or environment configuration.");
  }

  const clientOptions: any = { apiKey };
  if (customBaseUrl) {
    clientOptions.baseUrl = customBaseUrl;
  }

  const ai = new GoogleGenAI(clientOptions);

  const langInstruction = language === 'en' 
    ? "YOU MUST USE ENGLISH for all text fields." 
    : "YOU MUST USE CHINESE (Simplified) for all text fields unless explicitly requested otherwise.";

  // We use gemini-2.5-flash for speed and good instruction following for JSON
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Generate a JSON configuration to render a visualization based on this request: "${prompt}".
    
    Guidelines:
    1. Determine if the user wants a Statistical Chart (numbers, trends) or a Diagram (processes, architectures, relationships).
    
    [IF STATISTICAL CHART]:
    - Set 'chartType' to line, bar, area, pie, or composed.
    - Construct 'data' and 'series'.
    - Set 'mermaidCode' to empty string.
    
    [IF DIAGRAM/FLOWCHART]:
    - Set 'chartType' to 'mermaid'.
    - Generate valid Mermaid.js syntax in 'mermaidCode'.
    - Use 'graph TD' (top-down) or 'graph LR' (left-right) as appropriate.
    - Use subgraphs for clusters if needed.
    - Use professional node labels (e.g., [SFT Model] instead of A).
    - Styling: Keep it simple, the app handles colors.
    - Set 'data' and 'series' to empty arrays or null.

    General:
    - Language Rule: ${langInstruction}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: chartSchema,
      temperature: 0.3, // Lower temperature for more stable code generation
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from AI");
  }

  try {
    const json = JSON.parse(text) as ChartConfig;
    return json;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Failed to parse chart configuration from AI.");
  }
};