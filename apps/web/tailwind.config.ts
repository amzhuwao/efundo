import type { Config } from 'tailwindcss';

/** Palette aligned with https://efundoconnect.com/ (--efc-*) */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        efundo: {
          primary: '#1e40af',
          'primary-dark': '#1e3a8a',
          accent: '#1863dc',
          purple: '#7c3aed',
          'purple-dark': '#6d28d9',
          /** Logo wordmark colors */
          red: '#e31e24',
          blue: '#1d22d3',
        },
      },
    },
  },
  plugins: [],
};

export default config;
