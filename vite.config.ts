import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // CRITICAL: Defines paths as relative ('./') instead of absolute ('/').
  // This fixes the "White Screen" issue when Electron loads files via file:// protocol.
  base: './',
  plugins: [
    react(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
      },
      // Ployfill the Electron and Node.js built-in modules for Renderer process
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer: {},
    }),
  ],
  build: {
    // SECURITY: Disable sourcemaps in production to make reverse engineering harder
    sourcemap: false, 
    outDir: 'dist',
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})