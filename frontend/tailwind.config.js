/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // or 'media' if you prefer OS-level settings
  theme: {
    extend: {
      colors: {
        // 主题色定义 (示例)
        primary: {
          light: "#3b82f6", // blue-500
          DEFAULT: "#2563eb", // blue-600
          dark: "#1d4ed8", // blue-700
        },
        secondary: {
          light: "#f472b6", // pink-400
          DEFAULT: "#ec4899", // pink-500
          dark: "#db2777", // pink-600
        },
        // 背景色
        background: {
          light: "#ffffff", // white
          dark: "#111827", // gray-900
        },
        // 文本颜色
        foreground: {
          light: "#1f2937", // gray-800
          dark: "#f3f4f6", // gray-100
        },
        // 强调色/边框色
        accent: {
          light: "#e5e7eb", // gray-200
          dark: "#374151", // gray-700
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};