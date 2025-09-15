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
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});

