/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1d4ed8',
          hover: '#1e40af',
        },
        secondary: {
          DEFAULT: '#14b8a6',
          hover: '#0d9488',
        },
        background: '#f8fafc',
        surface: '#ffffff',
      },
    },
  },
  plugins: [],
};
