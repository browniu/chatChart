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
      enum: ["line", "bar", "area", "pie", "composed"],
      description: "The best type of chart to visualize this data"
    },
    xAxisKey: { type: Type.STRING, description: "The key in the data objects to use for X-axis labels. MUST match a key in the data items." },
    data: {
      type: Type.ARRAY,
      description: "The actual data points for the chart",
      items: {
        type: Type.OBJECT,
        description: "A data point object.",
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
      description: "Configuration for each data series to plot",
      items: {
        type: Type.OBJECT,
        properties: {
          dataKey: { type: Type.STRING, description: "The key in the data object to plot (e.g., 'value', 'sales')" },
          name: { type: Type.STRING, description: "Human readable name for the legend" },
          color: { type: Type.STRING, description: "Hex color code for this series" },
          type: { type: Type.STRING, enum: ["monotone", "linear", "step"], description: "Line interpolation style" }
        },
        required: ["dataKey", "color"]
      }
    }
  },
  required: ["title", "chartType", "xAxisKey", "data", "series"]
};

export const generateChartFromPrompt = async (prompt: string, language: 'zh' | 'en' = 'zh'): Promise<ChartConfig> => {
  // Check for custom configuration in localStorage
  const customApiKey = localStorage.getItem('customApiKey');
  const customBaseUrl = localStorage.getItem('customBaseUrl');
  
  const apiKey = customApiKey || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing. Please check your settings or environment configuration.");
  }

  // Initialize client with optional custom base URL
  // Note: The SDK constructor accepts options which can include baseUrl depending on version,
  // or we rely on the default behavior if not provided.
  // For @google/genai, the options object is the first argument.
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
    contents: `Generate a JSON configuration to render a chart based on this request: "${prompt}".
    
    Guidelines:
    1. Analyze the text to extract data points. infer reasonable numbers if not explicit.
    2. Choose the best chart type (Line, Bar, Area, Pie).
    3. Construct the 'data' array. You MUST use one of these keys for the x-axis label: 'name', 'quarter', 'month', 'year', 'label'.
    4. Set 'xAxisKey' to the EXACT key name you used for the labels in the data objects.
    5. Define 'series' to map data keys (like 'value', 'sales') to visual elements.
    6. Use modern, professional hex colors.
    7. LANGUAGE RULE: ${langInstruction}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: chartSchema,
      temperature: 0.4,
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