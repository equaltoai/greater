import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  
  server: {
    port: 4321,
    fs: {
      strict: false,
    },
  },
  
  optimizeDeps: {
    include: [
      'svelte',
      'nanostores',
      '@nanostores/persistent',
      '@equaltoai/greater-components/fediverse',
      '@equaltoai/greater-components/primitives',
      '@equaltoai/greater-components/adapters',
      '@apollo/client',
      'graphql',
    ],
  },
  
  ssr: {
    noExternal: ['@equaltoai/greater-components'],
  },
});
