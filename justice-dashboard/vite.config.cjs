const react = require('@vitejs/plugin-react');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  root: '..',
  plugins: [react()],
  build: {
    outDir: 'justice-dashboard/dist'
  },
  server: {
    port: 5174
  }
});