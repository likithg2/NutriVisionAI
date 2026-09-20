/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mint: {
          50:  '#FFF5F0',
          100: '#FFE8DD',
          200: '#FFD0B8',
          300: '#FFB08A',
          400: '#FF8A5C',
          500: '#FF6B4A',
          600: '#FF4D6D',
          700: '#D93A3A',
          800: '#B02E2E',
          900: '#7A1F1F',
        },
        charcoal: {
          900: '#1A1210',
          800: '#241A16',
          700: '#2E221C',
          600: '#3A2E28',
          500: '#4A3E38',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.08)',
        'glass-dark': '0 8px 32px rgba(0,0,0,0.32)',
        'mint-glow': '0 0 24px rgba(255,107,74,0.35)',
        'card-hover': '0 20px 60px rgba(0,0,0,0.14)',
      },
      keyframes: {
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-20px) scale(1.08)' },
          '66%': { transform: 'translate(-20px,10px) scale(0.95)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 20px rgba(255,107,74,0.2)' },
          '50%': { boxShadow: '0 0 32px rgba(255,107,74,0.45)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        blob: 'blob 12s infinite ease-in-out',
        'blob-slow': 'blob 16s 4s infinite ease-in-out',
        shimmer: 'shimmer 1.8s infinite linear',
        'glow-pulse': 'glowPulse 3s infinite ease-in-out',
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
};
