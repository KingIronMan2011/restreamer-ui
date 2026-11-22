import { vitePages } from '@kingironman2011/vite-pages';
import { lingui } from '@lingui/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: process.env.PUBLIC_URL ?? '/',
  plugins: [
    react(),
    lingui({ macroTransform: true }),
    vitePages(),
    {
      name: 'filter-react-compiler-runtime-directive-warning',
      onLog(_level, log) {
        const sourceId = log.id?.replaceAll('\\', '/');
        if (
          log.code === 'MODULE_LEVEL_DIRECTIVE' &&
          sourceId?.includes('/react-compiler-runtime/dist/index.js')
        ) {
          return false;
        }
      },
    },
  ],
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
    minify: 'oxc',
    sourcemap: true,
    chunkSizeWarningLimit: 3200,
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
              'da',
              'de',
              'el',
              'en',
              'es',
              'fr',
              'it',
              'ko',
              'pl',
              'pt-br',
              'ru',
              'sl',
              'tr',
              'uk',
              'zh-hans',
            ].map((lang) => ({
              name: `lang-${lang}`,
              test: new RegExp(
                String.raw`[/\\]src[/\\]locales[/\\]${lang}[/\\]messages\\.js$`,
              ),
            })),
          ],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/lib/setupTests.ts'],
    testTimeout: 50_000,
    coverage: {
      provider: 'v8',
    },
  },
});
