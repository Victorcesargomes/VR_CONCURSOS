/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef3f9',
          100: '#d6e1ee',
          200: '#aec2dc',
          300: '#7e9cc4',
          400: '#4d74a6',
          500: '#2a528a',
          600: '#113d70',
          700: '#002B5C',
          800: '#00224a',
          900: '#001a39',
          950: '#000f24',
        },
        accent: {
          50: '#e6f8f4',
          100: '#c2ecdf',
          200: '#89d9c4',
          300: '#4cc3a6',
          400: '#1bb18e',
          500: '#00A67D',
          600: '#008866',
          700: '#006b51',
          800: '#00503d',
          900: '#003b2e',
          950: '#001f17',
        },
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 43, 92, 0.08)',
        'card': '0 4px 16px -4px rgba(0, 43, 92, 0.12)',
        'card-hover': '0 18px 36px -12px rgba(0, 43, 92, 0.24)',
        'glow-primary': '0 8px 24px -6px rgba(0, 43, 92, 0.45)',
        'glow-accent': '0 8px 24px -6px rgba(0, 166, 125, 0.50)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pop': 'pop 0.3s ease-out',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
