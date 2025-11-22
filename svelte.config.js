import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // Static adapter for S3/CloudFront deployment
    adapter: adapter({
      // Output directory for built files
      pages: 'dist',
      assets: 'dist',
      fallback: 'index.html', // SPA fallback
      precompress: false,
      strict: true,
    }),
    
    // Disable prerendering for pure CSR
    prerender: {
      handleHttpError: 'warn',
    },

    alias: {
      '@': 'src',
      '$lib/types': 'src/types',
    },
  },

  compilerOptions: {
    // Enable Svelte 5 runes mode
    runes: true,
  },
};

export default config;
