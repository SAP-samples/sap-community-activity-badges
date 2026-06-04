import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // ui5-* are custom elements, not Vue components
          isCustomElement: (tag) => tag.startsWith('ui5-')
        }
      }
    })
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  base: '/profile/',
  server: {
    port: 5173,
    proxy: {
      '/khoros':                { target: 'http://localhost:4000', changeOrigin: true },
      '/showcaseBadgesGroups':  { target: 'http://localhost:4000', changeOrigin: true },
      '/showcaseSingleBadge':   { target: 'http://localhost:4000', changeOrigin: true },
      '/showcaseBadges':        { target: 'http://localhost:4000', changeOrigin: true }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Default Vite warns at 500 kB. Our main chunk is ~910 kB raw (~220 kB
    // gzipped) and consists almost entirely of @ui5/webcomponents code —
    // Select, TabContainer, Table, Avatar, Dialog, Toast, et al. all in one
    // chunk because they share base classes and tree-shaking can't separate
    // them. Issue #36 measured that the Assets-fetch.js alternative saves
    // only ~4 kB raw, so there's no easy split. Threshold bumped to silence
    // the noise; revisit if a future feature pulls in significantly more
    // weight (e.g. AnalyticalTable, full Fiori page templates, charts).
    chunkSizeWarningLimit: 1000
  }
})
