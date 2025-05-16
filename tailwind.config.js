/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/frontend/app/**/*.{js,ts,jsx,tsx}',
    './src/frontend/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0070f3',
          dark: '#0050b3',
          light: '#3291ff',
        },
        secondary: {
          DEFAULT: '#7928ca',
          dark: '#5f1f9e',
          light: '#9c4dff',
        },
      },
    },
  },
  plugins: [],
}; 