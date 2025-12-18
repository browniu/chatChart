import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ChartConfig } from "../types";
// @ts-ignore - Importing from importmap
import prettier from "prettier";
// @ts-ignore - Importing from importmap
import parserHtml from "prettier/plugins/html";
// @ts-ignore - Importing from importmap
import parserPostcss from "prettier/plugins/postcss"; 

// Define the response schema for strict JSON generation
const chartSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A short, descriptive title for the chart" },
    description: { type: Type.STRING, description: "A brief explanation of the data context" },
    chartType: { 
      type: Type.STRING, 
      enum: ["line", "bar", "area", "pie", "composed", "mermaid", "html"],
      description: "The best type of visualization. Use 'mermaid' for diagrams. Use 'html' ONLY if the request implies a complex layout, infographic, or specific design that standard charts cannot achieve. Use others for statistical data."
    },
    // Mermaid specific
    mermaidCode: {
      type: Type.STRING,
      description: "The Mermaid.js code string. Required if chartType is 'mermaid'. Use 'graph TD' or 'graph LR' for flowcharts."
    },
    // HTML specific
    htmlCode: {
      type: Type.STRING,
      description: "The raw HTML/Tailwind CSS string. Required if chartType is 'html'. Do NOT include <html> or <body> tags, just the inner container content. Use Tailwind classes for styling."
    },
    // Recharts specific (nullable/optional in logic)
    xAxisKey: { type: Type.STRING, description: "The key for X-axis labels (Required for statistical charts)", nullable: true },
    data: {
      type: Type.ARRAY,
      nullable: true,
      description: "Data points (Required for statistical charts)",
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
      description: "Series config (Required for statistical charts)",
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

export type GenerationMode = 'auto' | 'standard' | 'html';

const formatHtmlCode = async (code: string): Promise<string> => {
  try {
    return await prettier.format(code, {
      parser: "html",
      plugins: [parserHtml, parserPostcss],
      printWidth: 80,
      tabWidth: 2,
    });
  } catch (e) {
    console.warn("Prettier formatting failed, returning raw code", e);
    return code;
  }
};

export const generateChartFromPrompt = async (
  prompt: string, 
  imageBase64?: string, 
  mode: GenerationMode = 'auto',
  language: 'zh' | 'en' = 'zh'
): Promise<ChartConfig> => {
  // Check for custom configuration in localStorage
  const customBaseUrl = localStorage.getItem('customBaseUrl');
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

  let modeInstruction = "";
  if (mode === 'standard') {
    modeInstruction = "FORCE Standard Library Usage: You MUST use Recharts (line, bar, pie, etc.) or Mermaid.js. Do NOT generate HTML/CSS.";
  } else if (mode === 'html') {
    modeInstruction = "FORCE HTML Mode: You MUST generate a custom layout using HTML and Tailwind CSS in the 'htmlCode' field. Set chartType to 'html'.";
  } else {
    modeInstruction = "AUTO Mode: Analyze the request (and image if provided). If it's a standard statistical chart or flowchart, use Recharts/Mermaid. If it's a complex infographic, custom dashboard layout, or requires specific visual styling that libraries can't do, use HTML/Tailwind.";
  }

  const systemInstruction = `
    Generate a JSON configuration to render a visualization.
    ${modeInstruction}
    ${langInstruction}
    
    [IF STATISTICAL CHART]:
    - Set 'chartType' to line, bar, area, pie, or composed.
    - Construct 'data' and 'series'.
    
    [IF DIAGRAM/FLOWCHART]:
    - Set 'chartType' to 'mermaid'.
    - Generate valid Mermaid.js syntax in 'mermaidCode'.
    
    [IF HTML/INFOGRAPHIC]:
    - Set 'chartType' to 'html'.
    - Generate a complete, responsive HTML component in 'htmlCode'.
    - Use Tailwind CSS classes for styling.
    - Ensure it looks modern and professional.
    - Do not use external CSS or JS links, use inline styles or Tailwind.
  `;

  const contents: any[] = [];
  
  if (imageBase64) {
    // Determine mime type from base64 header or default to png
    const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/png';
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
    
    contents.push({
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64
      }
    });
    contents.push({ text: `Analyze this image and recreate it as a visualization. Request: "${prompt}"` });
  } else {
    contents.push({ text: `Request: "${prompt}"` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: chartSchema,
      temperature: 0.1, // Lower temperature for more stable JSON
      maxOutputTokens: 8192, // Increase max tokens to prevent truncation of large HTML/JSON
    },
  });

  let text = response.text;
  if (!text) {
    throw new Error("No response from AI");
  }

  // Clean markdown code blocks if present (sometimes model adds them despite JSON mode)
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  try {
    const json = JSON.parse(text) as ChartConfig;
    
    // Auto-format HTML if present
    if (json.chartType === 'html' && json.htmlCode) {
      json.htmlCode = await formatHtmlCode(json.htmlCode);
    }

    return json;
  } catch (e) {
    console.error("Failed to parse AI response:", text.substring(0, 500) + "...");
    throw new Error(`Failed to parse chart configuration from AI. ${e instanceof Error ? e.message : ''}`);
  }
};