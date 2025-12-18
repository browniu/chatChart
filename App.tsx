import React, { useState, useEffect, useRef } from 'react';
import { generateChartFromPrompt as generateChartFromGemini } from './services/geminiService';
import { generateChartFromPrompt as generateChartFromZhipu } from './services/zhipuService';
import { generateChartFromPrompt as generateChartFromOpenAI, OPENAI_COMPATIBLE_PLATFORMS, OpenAIPlatformKey, GenerationMode } from './services/openAIStyleService';
import { ChartConfig, HistoryItem, ChartType } from './types';
import ChartRenderer from './components/ChartRenderer';
import HistorySidebar from './components/HistorySidebar';
import SettingsModal from './components/SettingsModal';
import MermaidEditor from './components/MermaidEditor';
import HtmlEditor from './components/HtmlEditor';
import CodeEditor from './components/CodeEditor';
import { ToastProvider, useToast } from './components/Toast';
import { translations, Language } from './utils/i18n';
import { 
  Menu, Send, Image as ImageIcon, Download, Copy, Check,
  Loader2, Sparkles, AlertCircle, Sun, Moon, Palette,
  PanelLeftClose, PanelLeftOpen, Settings, Languages,
  Workflow, BarChart3, Code as CodeIcon, X, Upload, PieChart, Maximize2, ZoomIn, ZoomOut, RotateCcw, GripVertical
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';

const INITIAL_PROMPT = "2025年Q1-Q4问题解决率趋势图，曲线在Q3触底后于Q4强劲反弹，突破70%";
const FLOWCHART_PROMPT = "绘制一个机器学习训练流程图：从SFT数据开始，经过SFT模型，进入'Domain Teachers'训练阶段，通过Token级奖励和序列级奖励反馈给模型，形成闭环优化。使用子图区分不同阶段。";
const PIE_PROMPT = "生成一个每日营养均衡分布的饼状图";


const MainContent: React.FC = () => {
  const [prompt, setPrompt] = useState(INITIAL_PROMPT);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [genMode, setGenMode] = useState<GenerationMode>('auto');
  const [loading, setLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ChartConfig | null>(null);

  // unique ID for the current config session to reset editor state
  const [currentId, setCurrentId] = useState<string>(Date.now().toString()); 
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false); 
  const [isSidebarVisible, setSidebarVisible] = useState(true); 
  const [editableCode, setEditableCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<keyof typeof PALETTES>('benchmark');
  const [isPaletteMenuOpen, setPaletteMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [lang, setLang] = useState<Language>('zh');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // In percentage
  const [zoomLevel, setZoomLevel] = useState(1);
  const isResizingWidthRef = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  
  
  const { showToast } = useToast();
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Predefined Palettes
  const PALETTES = {
    benchmark: { name: t.palette.benchmark, colors: ['#F97316', '#64748B', '#94A3B8', '#CBD5E1', '#E2E8F0', '#F1F5F9'] },
    default: { name: t.palette.default, colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"] },
    ocean: { name: t.palette.ocean, colors: ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'] },
    sunset: { name: t.palette.sunset, colors: ['#f97316', '#ef4444', '#e11d48', '#be123c', '#881337'] },
    forest: { name: t.palette.forest, colors: ['#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4'] },
    monochrome: { name: t.palette.monochrome, colors: ['#1f2937', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'] }
  };

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

  // Paste image handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        setSelectedImage(event.target?.result as string);
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Enhanced Detection Logic
  const detectConfig = (raw: string): ChartConfig | null => {
    const trimmed = raw.trim();
    // 1. Valid JSON
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.chartType) return parsed;
    } catch (e) {}
    // 2. Mermaid Detection
    const mermaidKeys = ['graph', 'flowchart', 'sequenceDiagram', 'pie', 'gantt', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gitGraph', 'mindmap', 'timeline'];
    if (mermaidKeys.some(k => trimmed.toLowerCase().startsWith(k))) {
      return { title: "Custom Diagram", chartType: ChartType.Mermaid, mermaidCode: trimmed };
    }
    // 3. HTML Detection
    if (trimmed.startsWith('<') || (trimmed.includes('class=') && trimmed.includes('>'))) {
        return { title: "Custom Component", chartType: ChartType.HTML, htmlCode: trimmed };
    }
    return null;
  };

  // Real-time parsing with debounce
  useEffect(() => {
    if (!editableCode) return;
    const timer = setTimeout(() => {
      const detected = detectConfig(editableCode);
      if (detected) {
        setCurrentConfig(detected);
        setCodeError(null);
      } else {
        setCodeError(t.invalidJson);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [editableCode, t.invalidJson]);

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

  // Horizontal Resize Handlers
  const handleWidthMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingWidthRef.current = true;
    document.addEventListener('mousemove', handleWidthMouseMove);
    document.addEventListener('mouseup', handleWidthMouseUp);
  };

  const handleWidthMouseMove = (e: MouseEvent) => {
    if (isResizingWidthRef.current && splitContainerRef.current) {
      const containerRect = splitContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const newWidthPercent = (relativeX / containerRect.width) * 100;
      setLeftPanelWidth(Math.max(15, Math.min(85, newWidthPercent)));
    }
  };

  const handleWidthMouseUp = () => {
    isResizingWidthRef.current = false;
    document.removeEventListener('mousemove', handleWidthMouseMove);
    document.removeEventListener('mouseup', handleWidthMouseUp);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !selectedImage) return;
    setLoading(true);
    setCodeError(null);
    try {
      // 获取用户选择的模型提供商
      const modelProvider = (localStorage.getItem('modelProvider') || 'gemini') as 'gemini' | 'zhipu' | 'openai';
      const finalPrompt = prompt.trim() || (lang === 'zh' ? "分析这张图片并绘制图表" : "Analyze this image and create a chart");


        // 根据选择调用不同的服务
      let config: ChartConfig;
      
      if (modelProvider === 'zhipu') {
        config = await generateChartFromZhipu(prompt, lang);
      } else if (modelProvider === 'openai') {
        // 获取 OpenAI 兼容平台的配置
        const openaiPlatform = (localStorage.getItem('openaiPlatform') || 'xiaomi') as OpenAIPlatformKey;
        const openaiApiKey = localStorage.getItem('openaiApiKey') || '';
        const openaiBaseUrl = localStorage.getItem('openaiBaseUrl') || OPENAI_COMPATIBLE_PLATFORMS[openaiPlatform].defaultBaseUrl;
        const openaiModel = localStorage.getItem('openaiModel') || OPENAI_COMPATIBLE_PLATFORMS[openaiPlatform].defaultModel;
        
        config = await generateChartFromOpenAI(finalPrompt, genMode, lang, {
          apiKey: openaiApiKey,
          baseUrl: openaiBaseUrl,
          model: openaiModel,
          temperature: 0.3
        }, selectedImage);
      } else {
        config = await generateChartFromGemini(prompt, lang);
      }
      
      const code = JSON.stringify(config, null, 2);
      setEditableCode(code);
      setCurrentConfig(config);
      setCurrentId(Date.now().toString()); // New session
      setSelectedPalette('benchmark');
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        prompt: finalPrompt,
        config: config,
        image: selectedImage || undefined
      };
      setHistory(prev => [newItem, ...prev]);
      showToast(t.toast.genSuccess, 'success');
    } catch (error) {
      console.error(error);
      showToast(t.toast.genFail, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPalette = (paletteKey: keyof typeof PALETTES) => {
    setSelectedPalette(paletteKey);
    setPaletteMenuOpen(false);

    if (!currentConfig || currentConfig.chartType === 'mermaid' || currentConfig.chartType === 'html') return;

    const colors = PALETTES[paletteKey].colors;
    const newConfig = { ...currentConfig };
    if (newConfig.series) {
        newConfig.series = newConfig.series.map((s, idx) => ({
        ...s,
        color: colors[idx % colors.length]
        }));
        setCurrentConfig(newConfig);
        setEditableCode(JSON.stringify(newConfig, null, 2));
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setPrompt(item.prompt);
    const code = JSON.stringify(item.config, null, 2);
    setEditableCode(code);
    setCurrentConfig(item.config);
    setCurrentId(item.id); // Sync ID
    setSelectedImage(item.image || null);
    setSidebarOpen(false);
  };

  const handleClearHistory = () => {
    if(confirm(lang === 'zh' ? "确认清空所有历史记录？" : "Clear all history?")) {
      setHistory([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Callback from Editors
  const handleConfigUpdate = (newConfig: ChartConfig) => {
     setEditableCode(JSON.stringify(newConfig, null, 2));
  };

  const handleDownloadImage = async () => {
    if (!chartContainerRef.current) return;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const svgElement = chartContainerRef.current.querySelector('svg');
      let dataUrl = '';

      if (currentConfig?.chartType === 'mermaid' && svgElement) {
         const serializer = new XMLSerializer();
         const source = serializer.serializeToString(svgElement);
         const svgBlob = new Blob([source], {type:"image/svg+xml;charset=utf-8"});
         const url = URL.createObjectURL(svgBlob);
         
         const img = new Image();
         img.src = url;
         await new Promise((resolve) => (img.onload = resolve));
         const canvas = document.createElement('canvas');
         canvas.width = img.width * 2; 
         canvas.height = img.height * 2;
         const ctx = canvas.getContext('2d');
         if(ctx) {
            ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            dataUrl = canvas.toDataURL("image/png");
         }
         URL.revokeObjectURL(url);
      } else {
         dataUrl = await htmlToImage.toPng(chartContainerRef.current, { 
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', 
            pixelRatio: 2 
        });
      }

      if(dataUrl) {
        const link = document.createElement('a');
        link.download = `chart-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        showToast(t.toast.exportSuccess, 'success');
      } else {
        throw new Error("No image data");
      }
    } catch (error) {
      console.error('Export failed', error);
      showToast(t.toast.exportFail, 'error');
    }
  };

  const handleCopyImage = async () => {
    if (!chartContainerRef.current) return;
    try {
       await new Promise(resolve => setTimeout(resolve, 500));
      const blob = await htmlToImage.toBlob(chartContainerRef.current, {
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          pixelRatio: 2
      });
      
      if (!blob) throw new Error("Failed to generate image blob");

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      setIsCopied(true);
      showToast(t.toast.copySuccess, 'success');
      setTimeout(() => setIsCopied(false), 2000);
      
    } catch (error) {
      console.error('Copy failed', error);
      showToast(t.toast.copyFail, 'error');
    }
  };

  const isMermaid = currentConfig?.chartType === ChartType.Mermaid;
  const isHtml = currentConfig?.chartType === ChartType.HTML;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden transition-colors">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} lang={lang} />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
            lang={lang}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
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
                 {t.appTitle}
               </h1>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
             <button
                onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 font-medium text-sm"
                title="Switch Language"
             >
                <Languages size={18} /> {lang.toUpperCase()}
             </button>

             <div className="relative">
                <button 
                  onClick={() => setPaletteMenuOpen(!isPaletteMenuOpen)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                  title={t.theme}
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
                title={isDarkMode ? t.lightMode : t.darkMode}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             
             <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                title={t.settings}
              >
                <Settings size={20} />
             </button>

            {currentConfig && (
                 <div className="flex gap-1 ml-2">
                    <button 
                      onClick={handleDownloadImage} 
                      title={t.export} 
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                    >
                      <Download size={16} /> <span className="hidden sm:inline">{t.export}</span>
                    </button>
                    <button 
                      onClick={handleCopyImage} 
                      title={t.copy} 
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                    >
                      {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />} 
                      <span className="hidden sm:inline">{isCopied ? t.copied : t.copy}</span>
                    </button>
                 </div>
               )}
          </div>
        </header>

        <div  ref={splitContainerRef} className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
        <div 
            className="flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors overflow-hidden"
            style={{ width: `${leftPanelWidth}%` }}
          >            
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0 transition-colors">
               <div className="flex gap-2 mb-2">
                 <button 
                    onClick={() => setPrompt(INITIAL_PROMPT)}
                    className="text-xs flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors"
                 >
                    <BarChart3 size={12}/> {t.barChart}
                 </button>
                 <button 
                    onClick={() => setPrompt(FLOWCHART_PROMPT)}
                    className="text-xs flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors"
                 >
                    <Workflow size={12}/> {t.flowchart}
                 </button>
                   <button
                       onClick={() => setPrompt(PIE_PROMPT)}
                       className="text-xs flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors"
                   >
                       <PieChart size={12}/> {t.pieChart}
                   </button>
               </div>

               {/* Image Upload Area */}
               <div className="relative mb-2">
                  {selectedImage ? (
                    <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex items-center justify-center group">
                        <img src={selectedImage} alt="Upload" className="max-h-full max-w-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                           <button
                             onClick={() => fileInputRef.current?.click()}
                             className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                             title={t.upload.change}
                           >
                             <Upload size={16} />
                           </button>
                           <button
                             onClick={() => setSelectedImage(null)}
                             className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-sm transition-colors"
                             title={t.upload.remove}
                           >
                             <X size={16} />
                           </button>
                        </div>
                    </div>
                  ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                        <span className="text-gray-400 text-sm flex items-center gap-2">
                            <ImageIcon size={18} /> {t.upload.placeholder}
                        </span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*"
                  />
               </div>

                <div className={'relative'}>
                    {/* Generation Mode Selector */}
                    {/*<div className="absolute top-[-40px] right-0 flex items-center gap-2">*/}
                    {/*    <select*/}
                    {/*        value={genMode}*/}
                    {/*        onChange={(e) => setGenMode(e.target.value as GenerationMode)}*/}
                    {/*        className="text-xs p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-orange-500"*/}
                    {/*    >*/}
                    {/*        <option value="auto">{t.mode.auto}</option>*/}
                    {/*        <option value="standard">{t.mode.standard}</option>*/}
                    {/*        <option value="html">{t.mode.html}</option>*/}
                    {/*    </select>*/}
                    {/*</div>*/}
                </div>

               <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.describePlaceholder}
                  className="w-full h-24 p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 text-sm shadow-sm transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="absolute bottom-3 right-3 p-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors shadow-sm"
                  title={t.generate}
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                </button>
               </div>
            </div>

            <div className={`flex-1 flex flex-col min-h-0 transition-colors ${isDarkMode ? 'bg-[#0d1117]' : 'bg-gray-50'}`}>
               {isMermaid && currentConfig ? (
                  <MermaidEditor 
                    key={currentId} // Reset editor state on new chart
                    config={currentConfig}
                    onUpdate={handleConfigUpdate}
                    lang={lang}
                    isDarkMode={isDarkMode}
                  />
               ) : isHtml && currentConfig ? (
                   <HtmlEditor
                       key={currentId}
                       config={currentConfig}
                       onUpdate={handleConfigUpdate}
                       lang={lang}
                       isDarkMode={isDarkMode}
                   />
               ) : (
                  <>
                    <div className={`
                        px-4 py-2 text-xs font-mono border-b flex justify-between items-center transition-colors
                        ${isDarkMode ? 'bg-[#161b22] text-gray-400 border-gray-800' : 'bg-white text-gray-500 border-gray-200'}
                    `}>
                        <div className="flex items-center gap-2">
                           <CodeIcon size={14} />
                           <span>{t.sourceCode}</span>
                        </div>
                        {codeError ? (
                          <span className="text-red-400 flex items-center gap-1"><AlertCircle size={12}/> {t.invalidJson}</span>
                        ) : (
                          <span className="text-green-600 dark:text-green-500">{t.liveEditing}</span>
                        )}
                    </div>
                    <div className="flex-1 relative">
                       <CodeEditor
                          value={editableCode}
                          onChange={setEditableCode}
                          language="json"
                          isDarkMode={isDarkMode}
                       />
                    </div>
                  </>
               )}
            </div>
          </div>

              {/* Horizontal Resizer */}
              <div 
            onMouseDown={handleWidthMouseDown}
            className="w-1.5 hover:w-2 bg-gray-200 dark:bg-gray-800 hover:bg-orange-400 dark:hover:bg-orange-500 cursor-col-resize transition-all z-20 flex items-center justify-center group"
          >
            <GripVertical size={14} className="text-gray-400 group-hover:text-white" />
          </div>

          <div className="flex-1 bg-slate-100 dark:bg-black relative flex flex-col overflow-hidden transition-colors" style={{ width: `${100 - leftPanelWidth}%` }}>
             
             {/* Zoom Controls */}
             {currentConfig && (
               <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                  <button onClick={() => setZoomLevel(prev => Math.max(0.2, prev - 0.1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-400"><ZoomOut size={16} /></button>
                  <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                  <button onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-400"><ZoomIn size={16} /></button>
                  <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                  <button onClick={() => setZoomLevel(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-400" title={t.reset}><RotateCcw size={16} /></button>
               </div>
             )}
             
             {loading && (
                 <div className="absolute inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-orange-600 dark:text-orange-400 mb-4" size={40} />
                    <p className="text-gray-600 dark:text-gray-300 font-medium animate-pulse">{t.designing}</p>
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
                            scale={zoomLevel}
                        />
                      </div>
                      
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
                    <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">{t.preview}</h3>
                    <p className="max-w-xs mx-auto mt-2 text-gray-500 dark:text-gray-500">{t.previewHint}</p>
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <MainContent />
    </ToastProvider>
  );
};

export default App;
