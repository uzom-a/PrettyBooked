/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        blush: {
          50:  '#fff0f5',
          100: '#ffe0ec',
          200: '#ffc2d9',
          300: '#ff94bb',
          400: '#ff5c97',
          500: '#f72d77',
          600: '#e0105c',
          700: '#bc0a4b',
          800: '#9c0d42',
          900: '#83103b',
        },
        rose: {
          50:  '#fff5f7',
          100: '#ffe8ed',
          200: '#ffd0da',
          300: '#ffaabb',
          400: '#ff7494',
          500: '#ff4572',
          600: '#ed1a52',
          700: '#c8113f',
          800: '#a8123b',
          900: '#8f1337',
        },
        mauve: {
          100: '#f3e8f7',
          200: '#e4ccf0',
          300: '#cfa5e5',
          400: '#b878d4',
          500: '#a155c0',
          600: '#8840a8',
        },
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
