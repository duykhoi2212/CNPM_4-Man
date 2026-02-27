/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#14b8a6', // Màu xanh ngọc chủ đạo (Teal-500)
        secondary: '#1f2937', // Màu xám đen (Gray-800)
      }
    },
  },
  plugins: [],
}