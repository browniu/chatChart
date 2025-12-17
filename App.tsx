import React, { useState, useEffect, useRef } from 'react';
import { generateChartFromPrompt } from './services/geminiService';
import { ChartConfig, HistoryItem } from './types';
import ChartRenderer from './components/ChartRenderer';
import HistorySidebar from './components/HistorySidebar';
import { 
  Menu, Send, Image as ImageIcon,
  Loader2, Sparkles, AlertCircle, Sun, Moon, Palette,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';

const INITIAL_PROMPT = "2025年Q1-Q4问题解决率趋势图，曲线在Q3触底后于Q4强劲反弹，突破70%";

// Predefined Palettes
const PALETTES = {
  benchmark: { name: 'Benchmark', colors: ['#F97316', '#64748B', '#94A3B8', '#CBD5E1', '#E2E8F0', '#F1F5F9'] },
  default: { name: 'Rainbow', colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"] },
  ocean: { name: 'Ocean', colors: ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'] },
  sunset: { name: 'Sunset', colors: ['#f97316', '#ef4444', '#e11d48', '#be123c', '#881337'] },
  forest: { name: 'Forest', colors: ['#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4'] },
  monochrome: { name: 'Mono', colors: ['#1f2937', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'] }
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState(INITIAL_PROMPT);
  const [loading, setLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ChartConfig | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false); // For Mobile Overlay
  const [isSidebarVisible, setSidebarVisible] = useState(true); // For Desktop Collapse
  const [editableCode, setEditableCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<keyof typeof PALETTES>('benchmark');
  const [isPaletteMenuOpen, setPaletteMenuOpen] = useState(false);
  
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
      // Reset palette on new generation to allow AI colors to shine, or keep existing?
      // Let's use benchmark default to match the new theme
      setSelectedPalette('benchmark');
      
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

  const handleApplyPalette = (paletteKey: keyof typeof PALETTES) => {
    setSelectedPalette(paletteKey);
    setPaletteMenuOpen(false);

    if (!currentConfig) return;

    const colors = PALETTES[paletteKey].colors;
    
    // Create a new config object with updated colors
    const newConfig = { ...currentConfig };
    
    // Update series colors
    newConfig.series = newConfig.series.map((s, idx) => ({
      ...s,
      color: colors[idx % colors.length]
    }));

    setCurrentConfig(newConfig);
    setEditableCode(JSON.stringify(newConfig, null, 2));
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
      <div 
        className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 
          ${isSidebarVisible ? 'lg:w-80' : 'lg:w-0'}
          transition-all duration-300 ease-in-out
          fixed lg:static z-20 h-full flex-shrink-0 overflow-hidden
          border-r border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900
        `}
      >
        <div className="w-80 h-full">
           <HistorySidebar 
            isOpen={true} 
            history={history} 
            onSelect={handleHistorySelect}
            onClear={handleClearHistory}
          />
        </div>
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
            <button
               onClick={() => setSidebarVisible(!isSidebarVisible)}
               className="hidden lg:block p-2 text-gray-500 hover:text-orange-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
               title={isSidebarVisible ? "Collapse Sidebar" : "Expand Sidebar"}
            >
               {isSidebarVisible ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>

            <div className="flex items-center gap-2">
               <div className="bg-orange-500 p-2 rounded-lg text-white shadow-lg shadow-orange-500/30">
                  <Sparkles size={20} fill="white" />
               </div>
               <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-600 dark:from-orange-400 dark:to-amber-500">
                 ChartGen AI
               </h1>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
             
             {/* Palette Selector */}
             <div className="relative">
                <button 
                  onClick={() => setPaletteMenuOpen(!isPaletteMenuOpen)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                  title="Change Color Theme"
                >
                  <Palette size={20} />
                  <span className="hidden sm:inline text-sm font-medium">{PALETTES[selectedPalette].name}</span>
                </button>
                
                {isPaletteMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    {Object.entries(PALETTES).map(([key, palette]) => (
                      <button
                        key={key}
                        onClick={() => handleApplyPalette(key as keyof typeof PALETTES)}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                          ${selectedPalette === key ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-gray-700/50' : 'text-gray-700 dark:text-gray-300'}
                        `}
                      >
                         <div className="flex gap-1">
                            {palette.colors.slice(0, 3).map(c => (
                              <div key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                            ))}
                         </div>
                         {palette.name}
                      </button>
                    ))}
                  </div>
                )}
                
                {isPaletteMenuOpen && (
                  <div className="fixed inset-0 z-40" onClick={() => setPaletteMenuOpen(false)} />
                )}
             </div>

             <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

             <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

            {currentConfig && (
                 <div className="flex gap-1 ml-2">
                    <button onClick={handleDownloadImage} title="Download PNG" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors border border-gray-200 dark:border-gray-700">
                      <ImageIcon size={16} /> <span className="hidden sm:inline">PNG</span>
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
                  className="w-full h-24 p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 text-sm shadow-sm transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="absolute bottom-3 right-3 p-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors shadow-sm"
                  title="Generate"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                </button>
               </div>
            </div>

            {/* Code Editor */}
            <div className={`flex-1 flex flex-col min-h-0 transition-colors ${isDarkMode ? 'bg-[#0d1117]' : 'bg-gray-50'}`}>
               <div className={`
                  px-4 py-2 text-xs font-mono border-b flex justify-between items-center transition-colors
                  ${isDarkMode ? 'bg-[#161b22] text-gray-400 border-gray-800' : 'bg-white text-gray-500 border-gray-200'}
               `}>
                  <span>SOURCE CODE (JSON)</span>
                  {codeError ? (
                    <span className="text-red-400 flex items-center gap-1"><AlertCircle size={12}/> Invalid JSON</span>
                  ) : (
                    <span className="text-green-600 dark:text-green-500">Live Editing</span>
                  )}
               </div>
               <textarea 
                  className={`
                    flex-1 w-full font-mono text-xs sm:text-sm p-4 outline-none resize-none leading-relaxed transition-colors
                    ${isDarkMode 
                      ? 'bg-[#0d1117] text-orange-200' 
                      : 'bg-white text-orange-800'}
                  `}
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
                    <Loader2 className="animate-spin text-orange-600 dark:text-orange-400 mb-4" size={40} />
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
                        <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-1">{currentConfig.title}</h2>
                        {currentConfig.description && (
                          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-2xl mx-auto font-sans">{currentConfig.description}</p>
                        )}
                      </div>
                      <div className="flex-1 w-full min-h-0 p-4 bg-white dark:bg-gray-800 transition-colors" id="chart-capture-target">
                         <ChartRenderer 
                            config={currentConfig} 
                            chartRef={chartContainerRef} 
                            isDarkMode={isDarkMode} 
                            palette={PALETTES[selectedPalette].colors}
                        />
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