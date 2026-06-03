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
    emptyOutDir: true
  }
})
