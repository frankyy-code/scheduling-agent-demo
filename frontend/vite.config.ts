import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@mock-data': path.resolve(__dirname, '../mock-data'),
    },
  },
  server: {
    proxy: {
      '/api/compass': {
        target: process.env.VITE_COMPASS_BASE_URL || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/compass/, ''),
      },
    },
  },
})
