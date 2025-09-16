import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react({
      // ensure automatic runtime — no global React required
      jsxRuntime: 'automatic',
      // optional: keep empty to allow future dev transforms
      babel: { plugins: [] },
    }),
  ],
  // Ensure static assets load correctly when embedded under /dashboard
  base: './',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3020',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:3020',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

