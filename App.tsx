import React, { useState, useEffect, useRef } from 'react';
import { generateChartFromPrompt } from './services/geminiService';
import { ChartConfig, HistoryItem } from './types';
import ChartRenderer from './components/ChartRenderer';
import HistorySidebar from './components/HistorySidebar';
import { 
  Menu, Send, Image as ImageIcon, FileJson, 
  Loader2, Sparkles, AlertCircle, Sun, Moon, GripHorizontal
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';

const INITIAL_PROMPT = "2025年Q1-Q4问题解决率趋势图，曲线在Q3触底后于Q4强劲反弹，突破70%";

const App: React.FC = () => {
  const [prompt, setPrompt] = useState(INITIAL_PROMPT);
  const [loading, setLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ChartConfig | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [editableCode, setEditableCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Resizable Chart Height State
  const [chartHeight, setChartHeight] = useState(500);
  const isResizingRef = useRef(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Apply Theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('chartHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history
  useEffect(() => {
    localStorage.setItem('chartHistory', JSON.stringify(history));
  }, [history]);

  // Real-time parsing with debounce
  useEffect(() => {
    if (!editableCode) return;

    const timer = setTimeout(() => {
      try {
        const parsed = JSON.parse(editableCode);
        if (parsed && typeof parsed === 'object') {
           if(parsed.chartType && Array.isArray(parsed.data)) {
             setCurrentConfig(parsed);
             setCodeError(null);
           }
        }
      } catch (e: any) {
        setCodeError(e.message);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [editableCode]);

  // Resize Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizingRef.current) {
        // Simple height calculation, usually relative to the chart container top would be better but simple dy works for now if we track offset
        // Better approach: Calculate new height based on mouse Y position
        // Since the chart is in a scrollable container, we can't just use pageY directly without offset context.
        // However, movementY works for relative changes.
        setChartHeight(prev => Math.max(300, Math.min(1200, prev + e.movementY)));
    }
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };


  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setCodeError(null);
    try {
      const config = await generateChartFromPrompt(prompt);
      const code = JSON.stringify(config, null, 2);
      setEditableCode(code);
      setCurrentConfig(config);
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        prompt: prompt,
        config: config
      };
      setHistory(prev => [newItem, ...prev]);
    } catch (error) {
      console.error(error);
      alert("Failed to generate chart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setPrompt(item.prompt);
    const code = JSON.stringify(item.config, null, 2);
    setEditableCode(code);
    setCurrentConfig(item.config);
    setSidebarOpen(false);
  };

  const handleClearHistory = () => {
    if(confirm("Clear all history?")) {
      setHistory([]);
    }
  };

  const handleDownloadImage = async () => {
    if (!chartContainerRef.current) return;
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await htmlToImage.toPng(chartContainerRef.current, { 
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', 
          pixelRatio: 2 
      });
      const link = document.createElement('a');
      link.download = `chart-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('oops, something went wrong!', error);
      alert("Could not download image");
    }
  };

  const handleDownloadSVG = () => {
    if (!chartContainerRef.current) return;
    const svg = chartContainerRef.current.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `chart-${Date.now()}.svg`;
      link.href = url;
      link.click();
    } else {
        alert("SVG Element not found");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden transition-colors">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 transition-transform duration-300 ease-in-out
        fixed lg:static z-20 h-full flex-shrink-0
      `}>
        <HistorySidebar 
          isOpen={true} 
          history={history} 
          onSelect={handleHistorySelect}
          onClear={handleClearHistory}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center shadow-sm z-10 flex-shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
               <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/30">
                  <Sparkles size={20} fill="white" />
               </div>
               <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                 ChartGen AI
               </h1>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
             <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors mr-2"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

            {currentConfig && (
                 <div className="flex gap-1">
                    <button onClick={handleDownloadImage} title="Download PNG" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-gray-200 dark:border-gray-700">
                      <ImageIcon size={16} /> <span className="hidden sm:inline">PNG</span>
                    </button>
                    <button onClick={handleDownloadSVG} title="Download SVG" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-gray-200 dark:border-gray-700">
                      <FileJson size={16} /> <span className="hidden sm:inline">SVG</span>
                    </button>
                 </div>
               )}
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Panel: Input & Source (40%) */}
          <div className="w-full lg:w-[40%] flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors">
            
            {/* Input Area */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0 transition-colors">
               <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your chart..."
                  className="w-full h-24 p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 text-sm shadow-sm transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors shadow-sm"
                  title="Generate"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                </button>
               </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e] dark:bg-[#0d1117] transition-colors">
               <div className="bg-[#2d2d2d] dark:bg-[#161b22] px-4 py-2 text-xs font-mono text-gray-400 border-b border-[#3e3e3e] dark:border-gray-800 flex justify-between items-center transition-colors">
                  <span>SOURCE CODE (JSON)</span>
                  {codeError ? (
                    <span className="text-red-400 flex items-center gap-1"><AlertCircle size={12}/> Invalid JSON</span>
                  ) : (
                    <span className="text-green-500">Live Editing</span>
                  )}
               </div>
               <textarea 
                  className="flex-1 w-full bg-[#1e1e1e] dark:bg-[#0d1117] text-blue-300 font-mono text-xs sm:text-sm p-4 outline-none resize-none leading-relaxed transition-colors"
                  value={editableCode}
                  onChange={(e) => setEditableCode(e.target.value)}
                  spellCheck={false}
                  placeholder="// Chart configuration will appear here..."
                />
            </div>
          </div>

          {/* Right Panel: Preview (60%) */}
          <div className="w-full lg:w-[60%] bg-slate-100 dark:bg-black relative flex flex-col overflow-hidden transition-colors">
             
             {loading && (
                 <div className="absolute inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mb-4" size={40} />
                    <p className="text-gray-600 dark:text-gray-300 font-medium animate-pulse">Designing Chart...</p>
                 </div>
             )}

             <div className="flex-1 p-4 lg:p-8 overflow-y-auto flex flex-col items-center min-h-0">
                {currentConfig ? (
                  <div 
                    className="w-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-75 relative group"
                    style={{ height: chartHeight }}
                  >
                      <div className="p-6 text-center border-b border-gray-50 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{currentConfig.title}</h2>
                        {currentConfig.description && (
                          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-2xl mx-auto">{currentConfig.description}</p>
                        )}
                      </div>
                      <div className="flex-1 w-full min-h-0 p-4 bg-white dark:bg-gray-800 transition-colors" id="chart-capture-target">
                         <ChartRenderer config={currentConfig} chartRef={chartContainerRef} isDarkMode={isDarkMode} />
                      </div>
                      
                      {/* Resize Handle */}
                      <div 
                        onMouseDown={handleMouseDown}
                        className="absolute bottom-0 left-0 right-0 h-4 cursor-row-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-opacity"
                        title="Drag to resize height"
                      >
                         <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                      </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 dark:text-gray-600 mt-20">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
                      <Sparkles size={40} className="text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">Chart Preview</h3>
                    <p className="max-w-xs mx-auto mt-2 text-gray-500 dark:text-gray-500">Generated visualizations will appear here automatically.</p>
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;