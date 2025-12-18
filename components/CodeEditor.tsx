import React from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

// Configure Monaco to load from a reliable CDN if the wrapper's internal loader defaults fail or to match import map style
loader.config({
    paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' }
});

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: 'json' | 'html' | 'javascript' | 'mermaid';
    isDarkMode: boolean;
    readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language, isDarkMode, readOnly = false }) => {
    const handleEditorChange = (value: string | undefined) => {
        onChange(value || '');
    };

    return (
        <div className="w-full h-full overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1e1e]">
            <Editor
                height="100%"
                defaultLanguage={language}
                language={language} // Force update language if prop changes
                value={value}
                theme={isDarkMode ? 'vs-dark' : 'light'}
                onChange={handleEditorChange}
                loading={
                    <div className="flex items-center justify-center h-full text-gray-400 gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-xs">Loading Editor...</span>
                    </div>
                }
                options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    automaticLayout: true,
                    tabSize: 2,
                    readOnly: readOnly,
                    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                    renderLineHighlight: 'all',
                    padding: { top: 16, bottom: 16 },
                }}
            />
        </div>
    );
};

export default CodeEditor;
