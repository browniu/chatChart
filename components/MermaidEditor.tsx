import React, { useState, useEffect } from 'react';
import { ChartConfig } from '../types';
import { translations, Language } from '../utils/i18n';
import { Settings2, Code } from 'lucide-react';

interface MermaidEditorProps {
  config: ChartConfig;
  onUpdate: (newConfig: ChartConfig) => void;
  lang: Language;
  isDarkMode: boolean;
}

const MermaidEditor: React.FC<MermaidEditorProps> = ({ config, onUpdate, lang, isDarkMode }) => {
  const t = translations[lang];

  // Initialize state from props. 
  // Note: This component should be keyed by a unique ID in the parent to force re-initialization on new chart load.
  const [title, setTitle] = useState(config.title || '');
  const [description, setDescription] = useState(config.description || '');
  const [code, setCode] = useState(config.mermaidCode || '');

  // Handle local changes and propagate to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdate({
        ...config,
        title,
        description,
        mermaidCode: code
      });
    }, 100); // Small debounce to avoid blocking typing

    return () => clearTimeout(timer);
  }, [title, description, code]);

  return (
    <div className={`flex flex-col h-full overflow-hidden ${isDarkMode ? 'bg-[#0d1117]' : 'bg-gray-50'}`}>
      
      {/* Configuration Section */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-orange-600 dark:text-orange-400">
          <Settings2 size={16} />
          <span>{t.mermaid.config}</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.mermaid.title}</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-md border text-sm transition-colors focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white dark:bg-[#161b22] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.mermaid.description}</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-md border text-sm resize-none transition-colors focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white dark:bg-[#161b22] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Code Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className={`px-4 py-2 border-b flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'border-gray-800 text-orange-400' : 'border-gray-200 text-orange-600'}`}>
          <Code size={16} />
          <span>{t.mermaid.code}</span>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t.mermaid.codePlaceholder}
          spellCheck={false}
          className={`
            flex-1 w-full p-4 font-mono text-xs sm:text-sm outline-none resize-none leading-relaxed transition-colors
            ${isDarkMode ? 'bg-[#0d1117] text-gray-300' : 'bg-white text-gray-800'}
          `}
        />
      </div>
    </div>
  );
};

export default MermaidEditor;