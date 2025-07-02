import { defineConfig } from 'vite';
export default defineConfig({
  root: 'frontend',
  server: {
    port: 5173,
    proxy: {
      '/upload': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
