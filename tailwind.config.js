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
        navy: {
          DEFAULT: '#0F172A',
          dark: '#0B1220',
        },
        royal: {
          DEFAULT: '#1D4ED8',
          hover: '#1E40AF',
        },
        gold: {
          DEFAULT: '#D4A017',
        },
        background: {
          main: '#F5F7FB',
          alt: '#EEF2F7',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
        },
        status: {
          success: '#059669',
          warning: '#D97706',
          error: '#DC2626',
          pending: '#2563EB',
        },
        surface: '#FFFFFF',
      },
      backdropBlur: {
        glass: '20px',
        'glass-strong': '32px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glass-hover': '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'glass-lg': '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.15), 0 0 60px rgba(59, 130, 246, 0.05)',
        'glow-teal': '0 0 20px rgba(20, 184, 166, 0.15), 0 0 60px rgba(20, 184, 166, 0.05)',
      },
      borderRadius: {
        'glass': '16px',
        'glass-lg': '20px',
        'glass-xl': '24px',
      },
    },
  },
  plugins: [],
};
