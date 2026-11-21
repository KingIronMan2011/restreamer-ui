import { vitePages } from '@kingironman2011/vite-pages';
import babel from '@rolldown/plugin-babel';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: process.env.PUBLIC_URL ?? '/',
  plugins: [babel({ plugins: ['macros'] }), react(), vitePages()],
  define: {
    'process.env': {},
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
    },
    watch: {
      usePolling: true,
    },
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    minify: 'esbuild',
    sourcemap: true,
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {},
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    testTimeout: 50_000,
    coverage: {
      provider: 'v8',
    },
  },
});
