const react = require('@vitejs/plugin-react');
const path = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  plugins: [react()],
  root: __dirname,
  build: {
    outDir: 'dist'
  },
  server: {
    port: 5174,
    strictPort: true,
    hmr: { overlay: false },
    proxy: {
      '/api': 'http://localhost:3000',
      '/upload': 'http://localhost:3000'
    }
  },
  optimizeDeps: {
    exclude: ['canvas'],
    force: true
  },
  define: {
    global: 'globalThis'
  }
});
