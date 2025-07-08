import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend',
  envPrefix: 'VITE_',
  envDir: '../', // Look for .env files in the parent directory (project root)
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
  },
});
