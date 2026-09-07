/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0ff',
          100: '#b3d1ff',
          200: '#80b2ff',
          300: '#4d93ff',
          400: '#1a74ff',
          500: '#002B5C',  // Feza Navy
          600: '#00244A',
          700: '#001C38',
          800: '#001526',
          900: '#000D14',
        },
        secondary: {
          50: '#fff9e6',
          100: '#fff0b3',
          200: '#ffe780',
          300: '#ffde4d',
          400: '#ffd51a',
          500: '#FDB913',  // Feza Gold
          600: '#e5a700',
          700: '#cc9400',
          800: '#b38200',
          900: '#996f00',
        },
        accent: {
          gold: '#FDB913',
          navy: '#002B5C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
