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
        // 主题色定义 (多主题支持)
        primary: {
          light: "#3b82f6", // blue-500
          DEFAULT: "#2563eb", // blue-600
          dark: "#1d4ed8", // blue-700
          green: "#22c55e", // emerald-500
          orange: "#f59e42", // orange-400
          purple: "#a78bfa", // violet-400
        },
        secondary: {
          light: "#f472b6", // pink-400
          DEFAULT: "#ec4899", // pink-500
          dark: "#db2777", // pink-600
          teal: "#2dd4bf", // teal-400
          yellow: "#facc15", // yellow-400
        },
        accent: {
          light: "#e5e7eb", // gray-200
          dark: "#374151", // gray-700
          green: "#bbf7d0", // emerald-100
          orange: "#fed7aa", // orange-100
          purple: "#ddd6fe", // violet-100
        },
        background: {
          light: "#ffffff", // white
          dark: "#111827", // gray-900
          green: "#f0fdf4", // emerald-50
          orange: "#fff7ed", // orange-50
          purple: "#f5f3ff", // violet-50
        },
        foreground: {
          light: "#1f2937", // gray-800
          dark: "#f3f4f6", // gray-100
          green: "#166534", // emerald-800
          orange: "#9a3412", // orange-800
          purple: "#6d28d9", // violet-800
        },
        input: {
          light: "#e5e7eb", // gray-200
          dark: "#374151", // gray-700
        }
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