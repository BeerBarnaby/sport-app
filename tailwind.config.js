/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#0B2E63', light: '#163E7A', dark: '#071d3e' },
        accent:   { DEFAULT: '#F47C20', dark:  '#d96512' },
        success:  '#16A34A',
        warning:  '#F59E0B',
        danger:   '#DC2626',
        'app-bg': '#F8FAFC',
        border:   '#E5E7EB',
      },
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
      },
      boxShadow: {
        card:       '0 1px 2px rgba(11,46,99,.05), 0 3px 10px rgba(11,46,99,.04)',
        'card-hover': '0 8px 24px rgba(11,46,99,.10)',
        modal:      '0 20px 60px rgba(11,46,99,.18)',
      },
    },
  },
  plugins: [],
};
