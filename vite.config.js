import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      base: '/cautious-palm-tree/',
      manifest: {
        name: '업적 라이브러리',
        short_name: '업적',
        description: '개인 성취 추적 및 게임화 시스템',
        theme_color: '#0066FF',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/cautious-palm-tree/',
        scope: '/cautious-palm-tree/',
        icons: [
          {
            src: '/cautious-palm-tree/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/cautious-palm-tree/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/cautious-palm-tree/index.html',
        navigateFallbackAllowlist: [/^\/cautious-palm-tree/],
      },
    }),
  ],
  base: '/cautious-palm-tree/', // 👈 이 줄이 반드시 있어야 합니다!
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
