const react = require('@vitejs/plugin-react');
const { defineConfig } = require('vite');
const path = require('path');

module.exports = defineConfig({
  root: path.resolve(__dirname, '..'),
  plugins: [react()],
  build: {
    outDir: 'justice-dashboard/dist'
  },
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});