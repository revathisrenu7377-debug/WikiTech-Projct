/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f1ff',
          100: '#e0e2fe',
          200: '#c7cbfd',
          300: '#a5abfc',
          400: '#818cfb',
          500: '#667eea',
          600: '#5a6fd6',
          700: '#4c5ac4',
          800: '#3f47a1',
          900: '#363d82',
        },
      },
      animation: {
        'spin-slow': 'spin 1.5s linear infinite',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};