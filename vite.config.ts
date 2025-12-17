import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // 配置代理解决 CORS 问题
        proxy: {
          // 小米 AI 代理
          '/api/xiaomi': {
            target: 'https://api.xiaomimimo.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/xiaomi/, ''),
            secure: true
          },
          // DeepSeek 代理
          '/api/deepseek': {
            target: 'https://api.deepseek.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
            secure: true
          },
          // Moonshot 代理
          '/api/moonshot': {
            target: 'https://api.moonshot.cn',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/moonshot/, ''),
            secure: true
          },
          // 智谱 AI 代理
          '/api/zhipu': {
            target: 'https://open.bigmodel.cn',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/zhipu/, ''),
            secure: true
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.ZP_API_KEY': JSON.stringify(env.ZP_API_KEY),
        'process.env.ZP_API_URL': JSON.stringify(env.ZP_API_URL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
