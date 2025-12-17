export enum ChartType {
  Line = 'line',
  Bar = 'bar',
  Area = 'area',
  Pie = 'pie',
  Composed = 'composed',
  Mermaid = 'mermaid'
}

export interface ChartSeries {
  dataKey: string;
  name?: string;
  color?: string;
  type?: 'monotone' | 'linear' | 'step'; // For line/area
}

export interface ChartConfig {
  title: string;
  description?: string;
  chartType: ChartType;
  xAxisKey?: string; // Optional for Mermaid
  data?: Record<string, string | number>[]; // Optional for Mermaid
  series?: ChartSeries[]; // Optional for Mermaid
  mermaidCode?: string; // Specific for Mermaid type
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  config: ChartConfig;
}