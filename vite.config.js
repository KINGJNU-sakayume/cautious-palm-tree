import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: '/cautious-palm-tree/', // 👈 이 줄이 반드시 있어야 합니다!
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
