const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

module.exports = defineConfig({
  plugins: [react()],
  root: __dirname,
  build: {
    outDir: 'dist'
  },
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3000',
      '/upload': 'http://localhost:3000'
    }
  },
  optimizeDeps: {
    exclude: ['canvas']
  },
  define: {
    global: 'globalThis'
  }
});