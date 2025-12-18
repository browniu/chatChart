export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    appTitle: "ChartGen AI",
    history: "历史记录",
    clear: "清空",
    noHistory: "暂无历史记录",
    createFirst: "创建你的第一个图表！",
    viewChart: "查看图表",
    sourceCode: "源码 (JSON)",
    liveEditing: "实时编辑",
    invalidJson: "JSON 格式错误",
    designing: "正在设计图表...",
    preview: "图表预览",
    previewHint: "生成的图表将自动显示在这里",
    describePlaceholder: "描述你想要的图表...",
    generate: "生成",
    export: "导出",
    copy: "复制",
    copied: "已复制",
    settings: "设置",
    theme: "主题",
    lightMode: "日间模式",
    darkMode: "夜间模式",
    apiConfig: "API 配置",
    apiKey: "API Key",
    baseUrl: "Base URL (选填)",
    save: "保存",
    cancel: "取消",
    useDefault: "使用默认",
    mode: {
      label: "生成模式",
      auto: "自动智能",
      standard: "标准图表库",
      html: "HTML/CSS",
    },
    upload: {
      placeholder: "粘贴图片或点击上传",
      change: "更换图片",
      remove: "移除"
    },
    mermaid: {
      config: "配置信息",
      title: "标题",
      description: "描述",
      code: "Mermaid 流程图代码",
      codePlaceholder: "输入 Mermaid 语法..."
    },
    html: {
      config: "配置信息",
      title: "标题",
      description: "描述",
      codePlaceholder: "<div>...</div>"
    },
    toast: {
      copySuccess: "图片已复制到剪贴板",
      copyFail: "复制失败",
      exportSuccess: "图片导出成功",
      exportFail: "导出失败",
      genSuccess: "生成成功",
      genFail: "生成失败"
    }
  },
  en: {
    appTitle: "ChartGen AI",
    history: "History",
    clear: "Clear",
    noHistory: "No history yet.",
    createFirst: "Create your first chart!",
    viewChart: "View Chart",
    sourceCode: "SOURCE CODE (JSON)",
    liveEditing: "Live Editing",
    invalidJson: "Invalid JSON",
    designing: "Designing Chart...",
    preview: "Chart Preview",
    previewHint: "Generated visualizations will appear here automatically.",
    describePlaceholder: "Describe your chart...",
    generate: "Generate",
    export: "Export",
    copy: "Copy",
    copied: "Copied",
    settings: "Settings",
    theme: "Theme",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    apiConfig: "API Configuration",
    apiKey: "API Key",
    baseUrl: "Base URL (Optional)",
    save: "Save",
    cancel: "Cancel",
    useDefault: "Use Default",
    mode: {
      label: "Mode",
      auto: "Auto Smart",
      standard: "Standard Libs",
      html: "HTML/CSS",
    },
    upload: {
      placeholder: "Paste or Upload Image",
      change: "Change",
      remove: "Remove"
    },
    mermaid: {
      config: "Configuration",
      title: "Title",
      description: "Description",
      code: "Mermaid Code",
      codePlaceholder: "Enter Mermaid syntax..."
    },
    html: {
      config: "Configuration",
      title: "Title",
      description: "Description",
      codePlaceholder: "<div>...</div>"
    },
    toast: {
      copySuccess: "Image copied to clipboard",
      copyFail: "Failed to copy",
      exportSuccess: "Image exported successfully",
      exportFail: "Failed to export",
      genSuccess: "Generated successfully",
      genFail: "Generation failed"
    }
  }
};