import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  server: {
    port: 5173,
    proxy: {
      // anything hitting /upload (or /api/* later) goes to Express on 4000
      '/upload': 'http://localhost:4000'
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
