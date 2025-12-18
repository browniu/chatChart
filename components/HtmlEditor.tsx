import React, { useState, useEffect, useCallback } from 'react';
import { ChartConfig } from '../types';
import { translations, Language } from '../utils/i18n';
import { Settings2, LayoutTemplate, Wand2 } from 'lucide-react';
import CodeEditor from './CodeEditor';
// @ts-ignore
import prettier from "prettier";
// @ts-ignore
import parserHtml from "prettier/plugins/html";
// @ts-ignore
import parserPostcss from "prettier/plugins/postcss";

interface HtmlEditorProps {
    config: ChartConfig;
    onUpdate: (newConfig: ChartConfig) => void;
    lang: Language;
    isDarkMode: boolean;
}

const HtmlEditor: React.FC<HtmlEditorProps> = ({ config, onUpdate, lang, isDarkMode }) => {
    const t = translations[lang];

    const [title, setTitle] = useState(config.title || '');
    const [description, setDescription] = useState(config.description || '');
    const [code, setCode] = useState(config.htmlCode || '');

    useEffect(() => {
        const timer = setTimeout(() => {
            onUpdate({
                ...config,
                title,
                description,
                htmlCode: code
            });
        }, 200);

        return () => clearTimeout(timer);
    }, [title, description, code]);

    const handleFormat = useCallback(async () => {
        try {
            const formatted = await prettier.format(code, {
                parser: "html",
                plugins: [parserHtml, parserPostcss],
                printWidth: 80,
                tabWidth: 2,
            });
            setCode(formatted);
        } catch (e) {
            console.error("Formatting failed", e);
        }
    }, [code]);

    return (
        <div className={`flex flex-col h-full overflow-hidden ${isDarkMode ? 'bg-[#0d1117]' : 'bg-gray-50'}`}>

            {/* Configuration Section */}
            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-orange-600 dark:text-orange-400">
                    <Settings2 size={16} />
                    <span>{t.html.config}</span>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.html.title}</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border text-sm transition-colors focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white dark:bg-[#161b22] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.html.description}</label>
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
                <div className={`px-4 py-2 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                        <LayoutTemplate size={16} />
                        <span>HTML + Tailwind</span>
                    </div>
                    <button
                        onClick={handleFormat}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                        title="Format Code"
                    >
                        <Wand2 size={12} /> Format
                    </button>
                </div>
                <div className="flex-1 relative">
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

export default HtmlEditor;
