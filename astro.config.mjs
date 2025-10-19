import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  site: import.meta.env.PUBLIC_APP_URL || 'https://localhost:4321',
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
    functionPerRoute: false,
    imageService: 'passthrough',
  }),
  integrations: [svelte()], // sentry() temporarily disabled
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': '/src',
        '@/components': '/src/components',
        '@/layouts': '/src/layouts',
        '@/lib': '/src/lib',
        '@/stores': '/src/lib/stores',
        '@/types': '/src/types',
        '@/utils': '/src/lib/utils',
        '@apollo/client/core': '@apollo/client/core/index.js',
        '@apollo/client/link/subscriptions': '@apollo/client/link/subscriptions/index.js',
      },
    },
    optimizeDeps: {
      exclude: ['@nanostores/persistent'],
    },
    ssr: {
      noExternal: ['@graphql-typed-document-node/core'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['svelte', 'svelte/store', 'zustand', 'nanostores'],
            'mastodon': ['megalodon'],
            'ui': ['focus-trap', 'tippy.js'],
          },
        },
        external: [/^@apollo\/client\/.*/, 'graphql-ws', 'graphql'],
        plugins: [
          process.env.ANALYZE && visualizer({
            open: true,
            filename: 'dist/stats.html',
            gzipSize: true,
            brotliSize: true,
          }),
        ].filter(Boolean),
      },
    },
  },
  security: {
    checkOrigin: true,
  },
  // View transitions are now stable in Astro 5, no longer experimental
  transitions: true,
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'viewport',
  },
});
