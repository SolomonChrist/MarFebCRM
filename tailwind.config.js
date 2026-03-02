/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode palette
        light: {
          bg: '#FFFFFF',
          surface: '#F9FAFB',
          border: '#E5E7EB',
          text: '#111827',
          textSecondary: '#6B7280',
        },
        // Dark mode palette
        dark: {
          bg: '#0F0F0F',
          surface: '#1A1A1A',
          border: '#2D2D2D',
          text: '#F9FAFB',
          textSecondary: '#9CA3AF',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
