import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  server: {
    port: 5173,
    proxy: {
      '/upload': 'http://localhost:3003',
      '/api': 'http://localhost:3003'
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
