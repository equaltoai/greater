import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
    functionPerRoute: true,
  }),
  integrations: [
    svelte(),
  ],
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
  },
  security: {
    checkOrigin: true,
  },
  // View transitions are now stable in Astro 5, no longer experimental
  transitions: true,
});