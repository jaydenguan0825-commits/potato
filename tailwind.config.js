/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./login.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'potato-dark': '#0a0e27',
        'potato-blue': '#141e3c',
        'potato-neon': '#00ff88',
        'potato-yellow': '#ffff00',
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      },
      keyframes: {
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        }
      },
      animation: {
        confetti: 'confetti 3s ease-in forwards',
      }
    },
  },
  plugins: [],
}
