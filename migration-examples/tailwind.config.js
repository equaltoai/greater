// TailwindCSS v4 Configuration Example
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for Greater
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  // v4 uses a different plugin system
  plugins: [],
  // v4 specific options
  future: {
    hoverOnlyWhenSupported: true,
  },
  // Enable all v4 optimizations
  oxide: true
};