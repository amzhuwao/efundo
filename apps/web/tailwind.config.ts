import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        efundo: {
          primary: '#1e40af',
          'primary-dark': '#1e3a8a',
          accent: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
