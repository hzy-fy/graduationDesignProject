/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10B981', // 绿色 (Tailwind emerald-500)
        secondary: '#000000', // 黑色
        background: '#FFFFFF', // 白色
        surface: '#F9FAFB', // 浅灰背景 (Tailwind gray-50)
      },
    },
  },
  plugins: [],
}