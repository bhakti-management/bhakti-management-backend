/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d1dbe7',
          300: '#a8bdd2',
          400: '#799ab7',
          500: '#587c9d',
          600: '#446282',
          700: '#38506b',
          800: '#31445b',
          900: '#2b3a4e',
          950: '#1c2635',
        }
      }
    },
  },
  plugins: [],
}
