import React, { useState, useEffect } from 'react';
import { ChartConfig } from '../types';
import { translations, Language } from '../utils/i18n';
import { Settings2, Code } from 'lucide-react';
import CodeEditor from './CodeEditor';

interface MermaidEditorProps {
  config: ChartConfig;
  onUpdate: (newConfig: ChartConfig) => void;
  lang: Language;
  isDarkMode: boolean;
}

const MermaidEditor: React.FC<MermaidEditorProps> = ({ config, onUpdate, lang, isDarkMode }) => {
  const t = translations[lang];

  const [title, setTitle] = useState(config.title || '');
  const [description, setDescription] = useState(config.description || '');
  const [code, setCode] = useState(config.mermaidCode || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdate({
        ...config,
        title,
        description,
        mermaidCode: code
      });
    }, 200);

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
        <div className="flex-1 relative">
          {/* Using HTML mode for mermaid for basic coloring, since mermaid lang isn't default in Monaco basic */}
          <CodeEditor
            value={code}
            onChange={setCode}
            language="html"
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
  );
};

export default MermaidEditor;
