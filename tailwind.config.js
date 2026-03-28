/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#faf9f6',
          card: '#ffffff',
          border: '#e2ddd4',
          teal: '#0d7377',
          'teal-dark': '#0a5c5f',
          navy: '#1b2d4f',
          'navy-dark': '#243a5e',
          gold: '#c9933a',
          'gold-bg': '#fdf6e9',
          green: '#1a7a3a',
          'green-bg': '#edf7f0',
          red: '#c0392b',
          'red-bg': '#fdf0ee',
          blue: '#2563eb',
          'blue-bg': '#eff4ff',
          muted: '#f3f1ec',
          text: '#1a1714',
          'text-secondary': '#6b6560',
          'text-muted': '#9a948d',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
      borderRadius: {
        'card': '14px',
        'btn': '10px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.3s ease',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'none' },
        },
      },
    },
  },
  plugins: [],
}
