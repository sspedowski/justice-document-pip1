import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend',
  server: {
    port: 5173,
    proxy: {
      '/upload': 'http://localhost:4000',
      '/api': 'http://localhost:4000',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
