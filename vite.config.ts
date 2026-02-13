import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import javascriptObfuscator from 'rollup-plugin-javascript-obfuscator';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      // Removed 'renderer: {}' to prevents injection of Node/Electron globals 
      // into the web bundle, enabling the app to run in standard browsers.
    }),
    // EXTREME SECURITY: OBFUSCATION
    // Only enable in production build to allow debugging during dev
    process.env.NODE_ENV === 'production' && javascriptObfuscator({
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 1,
        debugProtection: true,
        debugProtectionInterval: 4000,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        renameGlobals: false,
        rotateStringArray: true,
        selfDefending: true,
        stringArray: true,
        stringArrayEncoding: ['rc4'],
        stringArrayThreshold: 1
    })
  ],
  build: {
    sourcemap: false, // Disable source maps to hide code structure
    outDir: 'dist',
    minify: 'terser', // Force minification
    terserOptions: {
        compress: {
            drop_console: true, // Remove all console.logs
            drop_debugger: true
        }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})