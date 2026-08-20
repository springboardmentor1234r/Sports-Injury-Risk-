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
          dark: '#0b0f19',
          card: '#131b2e',
          cyan: '#00f2fe',
          teal: '#4facfe',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
          purple: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
