/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f5f5ff',
          100: '#e6e6ff',
          200: '#c4c6ff',
          300: '#a3a6ff',
          400: '#7d82ff',
          500: '#4f59ff',
          600: '#3a40d9',
          700: '#2a2fab',
          800: '#1c207a',
          900: '#0e104a',
        },
        night: '#06071a',
        dusk: '#0f1f3d',
        aurora: '#16d9e3',
        sunset: '#ff5d9e',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.35 },
          '50%': { opacity: 0.8 },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
      },
      boxShadow: {
        glass: '0 20px 50px rgba(7, 15, 45, 0.35)',
        card: '0 12px 30px rgba(15, 25, 60, 0.25)',
      },
    },
  },
  plugins: [],
};


