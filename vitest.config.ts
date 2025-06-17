import { defineConfig } from 'vitest/config';
import { getViteConfig } from 'astro/config';

export default defineConfig(
  getViteConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        exclude: [
          'node_modules/',
          'dist/',
          '.astro/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData.ts',
          'tests/',
        ],
        thresholds: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      watchExclude: ['**/node_modules/**', '**/dist/**', '**/.astro/**'],
    },
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
  })
);