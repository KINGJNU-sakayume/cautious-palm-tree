import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Hoist the mobile service worker out of /mobile/pwa/ to /mobile/ in the
 * build output. Required because GitHub Pages does not allow a
 * Service-Worker-Allowed header, so the SW file must physically sit at the
 * scope root for the /cautious-palm-tree/mobile/ scope to be granted.
 */
function copyServiceWorkerToScopeRoot() {
  return {
    name: 'copy-service-worker-to-scope-root',
    apply: 'build',
    closeBundle() {
      const src = path.resolve(__dirname, 'dist/mobile/pwa/service-worker.js')
      const dest = path.resolve(__dirname, 'dist/mobile/service-worker.js')
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest)
        // eslint-disable-next-line no-console
        console.log('[copy-sw] copied service-worker.js to scope root')
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyServiceWorkerToScopeRoot()],
  base: '/cautious-palm-tree/',
  resolve: {
    alias: {
      '@':        path.resolve(__dirname, './src'),
      '@shared':  path.resolve(__dirname, './shared'),
      '@mobile':  path.resolve(__dirname, './mobile'),
    },
  },
  build: {
    rollupOptions: {
      // Multi-page Vite app:
      //   main    → root device-detection router (no React)
      //   desktop → existing desktop React app (entry: src/main.jsx)
      //   mobile  → new mobile React app (entry: mobile/main.jsx)
      input: {
        main:    path.resolve(__dirname, 'index.html'),
        desktop: path.resolve(__dirname, 'desktop/index.html'),
        mobile:  path.resolve(__dirname, 'mobile/index.html'),
      },
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
