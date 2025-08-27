import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // 前端開發用的埠號（可改可不改，預設也是 5173）
    proxy: {
      '/api': {
        target: 'http://localhost:3999', // ← 你的後端 Express server
        changeOrigin: true,              // 修改 Host header，避免 CORS 問題
      },
    },
  },
})
