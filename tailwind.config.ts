import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#E1F5EE',
          100: '#9FE1CB',
          200: '#5DCAA5',
          300: '#2DB88A',
          400: '#1DAB7C',
          500: '#1D9E75',
          600: '#1D9E75',
          700: '#0F6E56',
          800: '#085041',
          900: '#04342C',
        },
      },
    },
  },
  plugins: [],
}

export default config
