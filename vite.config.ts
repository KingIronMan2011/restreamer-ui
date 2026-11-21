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
    chunkSizeWarningLimit: 3000,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'router',
              test: /node_modules[\\/](?:react-router|react-router-dom)(?:[\\/]|$)/,
            },
            {
              name: 'react',
              test: /node_modules[\\/](?:react|react-dom|scheduler)(?:[\\/]|$)/,
            },
            { name: 'i18n', test: /node_modules[\\/]@lingui[\\/]/ },
            { name: 'icons', test: /node_modules[\\/]lucide-react[\\/]/ },
            ...[
              'da', 'de', 'el', 'en', 'es', 'fr', 'it', 'ko', 'pl',
              'pt-br', 'ru', 'sl', 'tr', 'uk', 'zh-hans',
            ].map((lang) => ({
              name: `lang-${lang}`,
              test: new RegExp(String.raw`[/\\]src[/\\]locales[/\\]${lang}[/\\]messages\\.js$`),
            })),
          ],
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
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
