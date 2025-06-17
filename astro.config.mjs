import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
    functionPerRoute: true,
  }),
  integrations: [svelte(), sentry()],
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
      },
    },
    optimizeDeps: {
      exclude: ['@nanostores/persistent'],
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