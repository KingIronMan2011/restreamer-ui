import babel from '@rolldown/plugin-babel';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: process.env.PUBLIC_URL ?? '/',
  plugins: [babel({ plugins: ['macros'] }), react()],
  build: {
    outDir: 'build',
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
