import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { translations, Language } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, lang }) => {
  const t = translations[lang];
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem('customApiKey') || '');
      setBaseUrl(localStorage.getItem('customBaseUrl') || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('customApiKey', apiKey.trim());
    } else {
      localStorage.removeItem('customApiKey');
    }

    if (baseUrl.trim()) {
      localStorage.setItem('customBaseUrl', baseUrl.trim());
    } else {
      localStorage.removeItem('customBaseUrl');
    }
    onClose();
  };

  const handleClear = () => {
    setApiKey('');
    setBaseUrl('');
    localStorage.removeItem('customApiKey');
    localStorage.removeItem('customBaseUrl');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t.apiConfig}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.apiKey}</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.baseUrl}</label>
            <input 
              type="text" 
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://generativelanguage.googleapis.com"
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-between bg-gray-50 dark:bg-gray-800/50">
          <button 
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <RotateCcw size={16} /> {t.useDefault}
          </button>
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-600 text-white hover:bg-orange-700 rounded-lg shadow-sm transition-colors"
            >
              <Save size={16} /> {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;