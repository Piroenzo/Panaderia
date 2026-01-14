/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3e2',
          100: '#fde4b8',
          200: '#fbd08a',
          300: '#f9bc5c',
          400: '#f7a83e',
          500: '#f59420',
          600: '#e6851a',
          700: '#d17515',
          800: '#bc6510',
          900: '#9a4d0a',
        },
      },
    },
  },
  plugins: [],
}
