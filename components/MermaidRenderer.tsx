import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  code: string;
  isDarkMode: boolean;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ code, isDarkMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Configure mermaid with the benchmark theme colors to match the app
    mermaid.initialize({
      startOnLoad: false,
      theme: isDarkMode ? 'dark' : 'base',
      themeVariables: {
        primaryColor: '#F97316', // Orange
        primaryTextColor: isDarkMode ? '#F3F4F6' : '#1F2937',
        primaryBorderColor: '#F97316',
        lineColor: '#64748B',
        secondaryColor: '#E2E8F0',
        tertiaryColor: '#F1F5F9',
        fontFamily: 'sans-serif'
      },
      securityLevel: 'loose',
    });
  }, [isDarkMode]);

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current || !code) return;
      
      try {
        setError(null);
        // Generate a unique ID for the diagram
        const id = `mermaid-${Date.now()}`;
        
        // mermaid.render returns an object { svg } in v10+
        const { svg } = await mermaid.render(id, code);
        setSvgContent(svg);
      } catch (err: any) {
        console.error("Mermaid rendering error:", err);
        // Mermaid puts error text in the DOM, but we can capture it here too
        setError("Diagram syntax error. Please try regenerating.");
      }
    };

    renderChart();
  }, [code, isDarkMode]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-auto">
      {error ? (
        <div className="text-red-500 text-sm p-4 border border-red-200 rounded bg-red-50">
          {error}
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="w-full flex justify-center mermaid-output"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
};

export default MermaidRenderer;