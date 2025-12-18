# ChatChart

ChatChart is a powerful web application that transforms natural language descriptions into beautiful, editable data visualizations using Google's Gemini API and Recharts.

[中文文档](#chinese) | [English Documentation](#english)

---

<a name="chinese"></a>
## 🇨🇳 中文文档

### 项目架构
本项目基于现代前端技术栈构建：
*   **核心框架**: React + Vite + TypeScript
*   **UI 组件库**: Tailwind CSS + Lucide React
*   **图表渲染**: Recharts (基于 D3 的 React 图表库)
*   **AI 模型**: Google Gemini API (@google/genai SDK)
*   **图片生成**: html-to-image

### 功能特性
*   💬 **自然语言生成**: 描述你的数据，AI 自动生成图表。
*   🎨 **多主题支持**: 内置 Benchmark (橙灰)、Rainbow、Ocean 等多种配色方案。
*   ✏️ **实时编辑**: 支持直接修改生成的 JSON 源码，图表实时更新。
*   🖼️ **导出与复制**: 支持一键导出 PNG 图片或复制到剪贴板。
*   🌍 **多语言**: 支持中英文界面切换。
*   ⚙️ **自定义 API**: 支持配置自定义 Gemini API Key 和 Base URL (方便国内使用 Proxy)。

### 本地运行
1.  **克隆项目**
    ```bash
    git clone <your-repo-url>
    cd chartgen-ai
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **配置环境变量**
    在根目录创建 `.env` 文件，并添加你的 Gemini API Key：
    ```env
    API_KEY=your_google_gemini_api_key
    ```
    *注意：你也可以直接在网页界面的“设置”中配置 API Key。*

4.  **启动开发服务器**
    ```bash
    npm run dev
    ```

### 模型 API 配置
点击界面右上角的 **设置 (Settings)** 图标，你可以：
*   **API Key**: 输入你自己的 Google Gemini API Key。
*   **Base URL**: 如果你身处国内或需要使用代理，可以在此输入自定义的 Base URL (例如 `https://your-proxy.com`)。
*   这些配置将保存在你的浏览器本地存储 (LocalStorage) 中，优先于环境变量使用。

---

<a name="english"></a>
## 🇺🇸 English Documentation

### Architecture
This project is built with a modern frontend stack:
*   **Core**: React + Vite + TypeScript
*   **UI Styling**: Tailwind CSS + Lucide React
*   **Charts**: Recharts (Redefined Chart Library built with React and D3)
*   **AI Model**: Google Gemini API (@google/genai SDK)
*   **Export**: html-to-image

### Features
*   💬 **Text-to-Chart**: Describe your data, and AI will generate the visualization.
*   🎨 **Themes**: Multiple color schemes including Benchmark (Orange/Grey), Rainbow, Ocean, etc.
*   ✏️ **Live Editing**: Edit the raw JSON configuration and see updates instantly.
*   🖼️ **Export & Copy**: Download as PNG or copy directly to your clipboard.
*   🌍 **i18n**: Switch between English and Chinese interfaces.
*   ⚙️ **Custom API**: Configure your own Gemini API Key and Base URL (useful for proxies).

### Local Development
1.  **Clone the repository**
    ```bash
    git clone <your-repo-url>
    cd chartgen-ai
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory and add your Gemini API Key:
    ```env
    API_KEY=your_google_gemini_api_key
    ```
    *Note: You can also configure the API Key directly in the web UI Settings.*

4.  **Start Server**
    ```bash
    npm run dev
    ```

### Model API Configuration
Click the **Settings** icon in the top right corner to configure:
*   **API Key**: Enter your personal Google Gemini API Key.
*   **Base URL**: If you are using a proxy or a custom endpoint, enter it here (e.g., `https://your-proxy.com`).
*   These settings are stored in your browser's LocalStorage and will override the environment variable defaults.
