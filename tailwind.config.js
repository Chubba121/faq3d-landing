/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F2ECE0',
          deep: '#E7DFCF',
          warm: '#EFE6D4',
        },
        ink: {
          DEFAULT: '#16130F',
          soft: '#3A342B',
          faded: '#6B6255',
        },
        kraft: '#D9C6A0',
        stamp: '#A62E1B',
        brand: {
          DEFAULT: '#0088DD',
          deep: '#006BB0',
        },
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Archivo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        paper: '0 1px 0 rgba(22, 19, 15, 0.06), 0 10px 18px -14px rgba(22, 19, 15, 0.45)',
        frame: '0 24px 40px -30px rgba(22, 19, 15, 0.55)',
        lift: '0 18px 26px -16px rgba(22, 19, 15, 0.45)',
      },
      keyframes: {
        settle: {
          from: { transform: 'translateY(8px) rotate(var(--tilt, 0deg))' },
          to: { transform: 'translateY(0) rotate(var(--tilt, 0deg))' },
        },
      },
      animation: {
        settle: 'settle 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
