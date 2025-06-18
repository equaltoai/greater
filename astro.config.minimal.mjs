import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// Minimal config for testing
export default defineConfig({
  integrations: [svelte()],
  vite: {
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
  },
});