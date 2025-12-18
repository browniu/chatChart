import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, ChevronRight, X } from 'lucide-react';
import { translations, Language } from '../utils/i18n';

interface HistorySidebarProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  lang: Language;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onSelect, onClear, onDelete, isOpen, lang }) => {
  const t = translations[lang];
  
  if (!isOpen) return null;

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed left-0 top-0 bottom-0 z-20 shadow-xl lg:static lg:shadow-none transition-colors">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Clock size={18} /> {t.history}
        </h2>
        {history.length > 0 && (
          <button 
            onClick={onClear}
            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={12} /> {t.clear}
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {history.length === 0 ? (
          <div className="text-center text-gray-400 mt-10 text-sm whitespace-pre-line">
            {t.noHistory} {'\n'} {t.createFirst}
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id}
              className="relative p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group bg-white dark:bg-gray-900"
              onClick={() => onSelect(item)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(lang === 'zh' ? '确认删除此记录？' : 'Delete this record?')) {
                    onDelete(item.id);
                  }
                }}
                className="absolute top-2 right-2 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                title={lang === 'zh' ? '删除' : 'Delete'}
              >
                <X size={14} />
              </button>
              <div className="flex justify-between items-start mb-1 pr-6">
                 <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">{item.config.chartType}</span>
                 <span className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 font-medium">{item.prompt}</p>
              <div className="mt-2 flex items-center text-xs text-gray-500 gap-1 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                {t.viewChart} <ChevronRight size={12} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;