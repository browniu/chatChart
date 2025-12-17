export enum ChartType {
  Line = 'line',
  Bar = 'bar',
  Area = 'area',
  Pie = 'pie',
  Composed = 'composed'
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
  xAxisKey: string; // The key in data objects to use for X axis labels
  data: Record<string, string | number>[];
  series: ChartSeries[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  config: ChartConfig;
}
