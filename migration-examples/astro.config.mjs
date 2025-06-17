// Astro v5 Configuration Example
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // Explicitly set output format (v5 default is 'hybrid')
  output: 'server',
  
  adapter: cloudflare({
    mode: 'directory',
    // Updated for v12 of the adapter
    platformProxy: {
      enabled: true
    }
  }),
  
  integrations: [
    svelte({
      // Svelte 5 configuration
      compilerOptions: {
        // Enable Svelte 4 compatibility mode initially
        compatibility: {
          componentApi: 4
        }
      }
    }),
    tailwind({
      // TailwindCSS v4 compatible configuration
      applyBaseStyles: false // Handle base styles manually for better control
    })
  ],
  
  vite: {
    // Vite v6 configuration
    optimizeDeps: {
      include: ['svelte', 'nanostores', 'zustand']
    },
    build: {
      target: 'es2022' // Updated for modern browsers
    }
  },
  
  // Security headers for Cloudflare
  security: {
    checkOrigin: true
  }
});