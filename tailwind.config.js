/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'primary': '#e74c3c',
          'primary-hover': '#c0392b',
          'secondary': '#10B981',
          'light': '#F3F4F6',
          'dark': '#1F2937',
          'medium': '#6B7280'
        }
      },
    },
    plugins: [],
  }