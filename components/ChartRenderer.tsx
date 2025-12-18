import React from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart
} from 'recharts';
import { ChartConfig, ChartType } from '../types';
import MermaidRenderer from './MermaidRenderer';

interface ChartRendererProps {
  config: ChartConfig;
  chartRef?: React.RefObject<HTMLDivElement>;
  isDarkMode: boolean;
  palette?: string[];
  scale?: number;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ config, chartRef, isDarkMode, palette, scale = 1 }) => {
  const { chartType, data, xAxisKey, series, mermaidCode, htmlCode } = config;

  const textColor = isDarkMode ? "#e2e8f0" : "#374151";
  const gridColor = isDarkMode ? "#374151" : "#e5e7eb";
  const tooltipStyle = {
    backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
    borderColor: isDarkMode ? "#374151" : "#e5e7eb",
    color: isDarkMode ? "#f3f4f6" : "#1f2937",
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  };

  // Default colorful palette if none provided
  const defaultPalette = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
  const activePalette = palette && palette.length > 0 ? palette : defaultPalette;

  const wrapContent = (content: React.ReactNode) => (
    <div 
      className="w-full h-full origin-top transition-transform duration-200 ease-out"
      style={{ transform: `scale(${scale})` }}
    >
      {content}
    </div>
  );

  // Render HTML Diagram
  if (chartType === ChartType.HTML) {
    return (
      <div ref={chartRef} className={`w-full h-full min-h-[300px] rounded-lg p-4 transition-colors overflow-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {wrapContent(
        htmlCode ? (
           <div
             className="w-full h-full"
             dangerouslySetInnerHTML={{ __html: htmlCode }}
           />
        ) : (
           <div className="flex items-center justify-center h-full text-gray-500">No HTML code generated.</div>
        ))}
      </div>
    );
  }

  // Render Mermaid Diagram
  if (chartType === ChartType.Mermaid) {
    return (
      <div ref={chartRef} className={`w-full h-full min-h-[300px] rounded-lg p-4 transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
         {
         wrapContent(
          mermaidCode ? (
            <MermaidRenderer code={mermaidCode} isDarkMode={isDarkMode} />
         ) : (
            <div className="flex items-center justify-center h-full text-gray-500">No Mermaid code generated.</div>
         ))}
      </div>
    );
  }

  // Safety check for Recharts
  // 饼状图不需要 xAxisKey，其他图表类型需要
  const needsXAxisKey = chartType !== ChartType.Pie;
  if (!data || !series || (needsXAxisKey && !xAxisKey)) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Incomplete data for chart rendering.
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case ChartType.Line:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
            <XAxis dataKey={xAxisKey} tick={{ fill: textColor }} stroke={gridColor} />
            <YAxis tick={{ fill: textColor }} stroke={gridColor} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: textColor }} />
            {series.map((s) => (
              <Line
                key={s.dataKey}
                type={s.type || "monotone"}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                stroke={s.color || "#8884d8"}
                strokeWidth={3}
                dot={{ r: 4, fill: s.color || "#8884d8" }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case ChartType.Bar:
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
            <XAxis dataKey={xAxisKey} tick={{ fill: textColor }} stroke={gridColor} />
            <YAxis tick={{ fill: textColor }} stroke={gridColor} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: textColor }} />
            {series.map((s) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                fill={s.color || "#8884d8"}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case ChartType.Area:
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
            <XAxis dataKey={xAxisKey} tick={{ fill: textColor }} stroke={gridColor} />
            <YAxis tick={{ fill: textColor }} stroke={gridColor} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: textColor }} />
            {series.map((s) => (
              <Area
                key={s.dataKey}
                type={s.type || "monotone"}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                fill={s.color || "#8884d8"}
                stroke={s.color || "#8884d8"}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        );

      case ChartType.Pie:
        return (
          <PieChart>
             <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: textColor }} />
            {series.map((s, idx) => (
              <Pie
                key={s.dataKey}
                data={data}
                dataKey={s.dataKey}
                nameKey="name" // 饼状图使用 "name" 字段作为标签
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill={s.color || "#8884d8"}
                label
                stroke={isDarkMode ? "#1f2937" : "#fff"}
              >
                 {data.map((entry, index) => {
                   return <Cell key={`cell-${index}`} fill={activePalette[index % activePalette.length]} stroke={isDarkMode ? "#1f2937" : "#fff"} />;
                 })}
              </Pie>
            ))}
          </PieChart>
        );

      default:
        return (
             <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
                <XAxis dataKey={xAxisKey} tick={{ fill: textColor }} stroke={gridColor} />
                <YAxis tick={{ fill: textColor }} stroke={gridColor} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ color: textColor }} />
                {series.map((s) => (
                  <Line
                    key={s.dataKey}
                    type="monotone"
                    dataKey={s.dataKey}
                    name={s.name || s.dataKey}
                    stroke={s.color || "#8884d8"}
                  />
                ))}
            </ComposedChart>
        );
    }
  };

  return (
    <div ref={chartRef} className={`w-full h-full min-h-[300px] rounded-lg p-4 transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {wrapContent(
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    )}
    </div>
  );
};

export default ChartRenderer;
