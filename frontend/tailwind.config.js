/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', hover: '#1d4ed8', light: '#eff6ff' },
        success: { DEFAULT: '#16a34a', light: '#f0fdf4' },
        warning: { DEFAULT: '#d97706', light: '#fffbeb' },
        danger:  { DEFAULT: '#dc2626', light: '#fef2f2' },
      },
    },
  },
  plugins: [],
};
