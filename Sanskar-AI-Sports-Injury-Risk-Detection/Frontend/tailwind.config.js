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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae2fd',
          300: '#7cc8fc',
          400: '#38a9fa',
          500: '#0e8eed',
          600: '#026fc5',
          700: '#03589f',
          800: '#074b83',
          900: '#0c3f6d',
          950: '#082848',
        },
      },
    },
  },
  plugins: [],
}
