/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aashi: {
          pink: '#F7C7DF',
          lavender: '#CDBBFA',
          berry: '#D979AE',
          plum: '#34253F',
          cloud: '#FFFAFD',
          lilac: '#F1EBFC',
          peach: '#FFDCCB',
          dark: '#1e1627',
          card: 'rgba(255, 250, 253, 0.85)',
          'card-dark': 'rgba(52, 37, 63, 0.75)'
        },
        duvora: {
          pink: '#F7C7DF',
          lavender: '#CDBBFA',
          berry: '#D979AE',
          plum: '#34253F',
          cloud: '#FFFAFD',
          lilac: '#F1EBFC',
          peach: '#FFDCCB',
          dark: '#1e1627',
          card: 'rgba(255, 250, 253, 0.85)',
          'card-dark': 'rgba(52, 37, 63, 0.75)'
        }
      },
      fontFamily: {
        heading: ['Fredoka', 'sans-serif'],
        body: ['DM Sans', 'sans-serif']
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(217, 121, 174, 0.15)',
        'glass-hover': '0 12px 40px 0 rgba(217, 121, 174, 0.25)',
        neon: '0 0 15px rgba(217, 121, 174, 0.4)',
        glow: '0 0 25px rgba(205, 187, 250, 0.5)'
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.85, transform: 'scale(1.02)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.15)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.15)' },
          '70%': { transform: 'scale(1)' }
        }
      }
    },
  },
  plugins: [],
}
