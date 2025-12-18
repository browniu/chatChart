import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, CheckCircle } from 'lucide-react';
import { translations, Language } from '../utils/i18n';
import { OPENAI_COMPATIBLE_PLATFORMS, OpenAIPlatformKey } from '../services/openAIStyleService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, lang }) => {
  const t = translations[lang];
  const [baseUrl, setBaseUrl] = useState('');
  const [modelProvider, setModelProvider] = useState<'gemini' | 'zhipu' | 'openai'>('gemini');
  
  // OpenAI 兼容平台的配置
  const [openaiPlatform, setOpenaiPlatform] = useState<OpenAIPlatformKey>('xiaomi');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('');
  const [openaiModel, setOpenaiModel] = useState('');

  // 从 localStorage 加载所有平台的配置
  const loadOpenaiConfigs = () => {
    try {
      const saved = localStorage.getItem('openaiConfigs');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to load openai configs', e);
      return {};
    }
  };

  useEffect(() => {
    if (isOpen) {
      setBaseUrl(localStorage.getItem('customBaseUrl') || '');
      setModelProvider((localStorage.getItem('modelProvider') as 'gemini' | 'zhipu' | 'openai') || 'gemini');
      
      // 加载 OpenAI 兼容平台配置
      const savedPlatform = (localStorage.getItem('openaiPlatform') as OpenAIPlatformKey) || 'xiaomi';
      setOpenaiPlatform(savedPlatform);
      
      // 兼容性迁移：检查旧的配置格式并迁移到新格式
      const oldApiKey = localStorage.getItem('openaiApiKey');
      const oldBaseUrl = localStorage.getItem('openaiBaseUrl');
      const oldModel = localStorage.getItem('openaiModel');
      
      if (oldApiKey || oldBaseUrl || oldModel) {
        // 发现旧格式配置，迁移到新格式
        const configs = loadOpenaiConfigs();
        if (!configs[savedPlatform]) {
          configs[savedPlatform] = {
            apiKey: oldApiKey || '',
            baseUrl: oldBaseUrl || '',
            model: oldModel || ''
          };
          localStorage.setItem('openaiConfigs', JSON.stringify(configs));
          console.log('Migrated old OpenAI config to new format');
        }
        // 清理旧的配置项
        localStorage.removeItem('openaiApiKey');
        localStorage.removeItem('openaiBaseUrl');
        localStorage.removeItem('openaiModel');
      }
      
      // 加载当前平台的配置
      const configs = loadOpenaiConfigs();
      const platformConfig = configs[savedPlatform];
      if (platformConfig) {
        setOpenaiApiKey(platformConfig.apiKey || '');
        setOpenaiBaseUrl(platformConfig.baseUrl || '');
        setOpenaiModel(platformConfig.model || '');
      } else {
        // 使用默认值
        const defaultConfig = OPENAI_COMPATIBLE_PLATFORMS[savedPlatform];
        setOpenaiApiKey('');
        setOpenaiBaseUrl(defaultConfig.defaultBaseUrl);
        setOpenaiModel(defaultConfig.defaultModel);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    if (baseUrl.trim()) {
      localStorage.setItem('customBaseUrl', baseUrl.trim());
    } else {
      localStorage.removeItem('customBaseUrl');
    }
    localStorage.setItem('modelProvider', modelProvider);
    
    // 保存 OpenAI 兼容平台配置
    if (modelProvider === 'openai') {
      localStorage.setItem('openaiPlatform', openaiPlatform);
      
      // 保存当前平台的配置到 openaiConfigs 对象中
      const configs = loadOpenaiConfigs();
      configs[openaiPlatform] = {
        apiKey: openaiApiKey.trim(),
        baseUrl: openaiBaseUrl.trim(),
        model: openaiModel.trim()
      };
      localStorage.setItem('openaiConfigs', JSON.stringify(configs));
    }
    
    onClose();
  };

  const handleClear = () => {
    if (confirm(lang === 'zh' ? '确认清空所有配置？这将删除所有平台的 API 配置。' : 'Clear all configurations? This will delete all platform API configs.')) {
      setBaseUrl('');
      setModelProvider('gemini');
      setOpenaiApiKey('');
      setOpenaiBaseUrl('');
      setOpenaiModel('');
      localStorage.removeItem('customBaseUrl');
      localStorage.setItem('modelProvider', 'gemini');
      localStorage.removeItem('openaiPlatform');
      localStorage.removeItem('openaiConfigs'); // 清空所有平台配置
      onClose();
    }
  };

  // 当切换 OpenAI 平台时，加载对应平台的配置
  const handlePlatformChange = (platform: OpenAIPlatformKey) => {
    setOpenaiPlatform(platform);
    
    // 加载该平台已保存的配置
    const configs = loadOpenaiConfigs();
    const platformConfig = configs[platform];
    
    if (platformConfig) {
      // 如果有保存的配置，使用保存的配置
      setOpenaiApiKey(platformConfig.apiKey || '');
      setOpenaiBaseUrl(platformConfig.baseUrl || '');
      setOpenaiModel(platformConfig.model || '');
    } else {
      // 如果没有保存的配置，使用默认值
      const defaultConfig = OPENAI_COMPATIBLE_PLATFORMS[platform];
      setOpenaiApiKey('');
      setOpenaiBaseUrl(defaultConfig.defaultBaseUrl);
      setOpenaiModel(defaultConfig.defaultModel);
    }
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
        
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.modelProvider}</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setModelProvider('gemini')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  modelProvider === 'gemini'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                    : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-orange-300'
                }`}
              >
                <div className="text-sm font-medium">{t.gemini}</div>
                <div className="text-xs opacity-70 mt-1">Google</div>
              </button>
              <button
                onClick={() => setModelProvider('zhipu')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  modelProvider === 'zhipu'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                    : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-orange-300'
                }`}
              >
                <div className="text-sm font-medium">{t.zhipu}</div>
                <div className="text-xs opacity-70 mt-1">智谱清言</div>
              </button>
              <button
                onClick={() => setModelProvider('openai')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  modelProvider === 'openai'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                    : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-orange-300'
                }`}
              >
                <div className="text-sm font-medium">{t.openaiStyle}</div>
                <div className="text-xs opacity-70 mt-1">OpenAI</div>
              </button>
            </div>
          </div>
          
          {modelProvider === 'gemini' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.baseUrl}</label>
              <input 
                type="text" 
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://generativelanguage.googleapis.com"
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">留空使用默认地址</p>
            </div>
          )}

          {modelProvider === 'openai' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.selectPlatform}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(OPENAI_COMPATIBLE_PLATFORMS) as OpenAIPlatformKey[]).map((key) => {
                    const platform = OPENAI_COMPATIBLE_PLATFORMS[key];
                    const configs = loadOpenaiConfigs();
                    const isConfigured = configs[key] && configs[key].apiKey;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => handlePlatformChange(key)}
                        className={`p-2 rounded-lg border-2 transition-all text-left relative ${
                          openaiPlatform === key
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="text-xs font-medium">
                            {lang === 'zh' ? platform.name : platform.nameEn}
                          </div>
                          {isConfigured && (
                            <CheckCircle 
                              size={14} 
                              className="text-green-500 flex-shrink-0" 
                              title={lang === 'zh' ? '已配置' : 'Configured'}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.apiKeyLabel}</label>
                <input 
                  type="password" 
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 outline-none text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.baseUrlLabel}</label>
                <input 
                  type="text" 
                  value={openaiBaseUrl}
                  onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                  placeholder={OPENAI_COMPATIBLE_PLATFORMS[openaiPlatform].defaultBaseUrl}
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.modelName}</label>
                <input 
                  type="text" 
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  placeholder={OPENAI_COMPATIBLE_PLATFORMS[openaiPlatform].defaultModel}
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                />
              </div>
            </>
          )}
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