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
          DEFAULT: '#1B2B5E',
          50: '#E8EAF2',
          100: '#C5CAE0',
          200: '#9DA7CC',
          300: '#7484B8',
          400: '#4D63A4',
          500: '#1B2B5E',
          600: '#172554',
          700: '#111C42',
          800: '#0C1330',
          900: '#070A1F',
        },
        accent: {
          DEFAULT: '#C9A84C',
          50: '#FAF4E3',
          100: '#F3E4B9',
          200: '#ECD48F',
          300: '#E4C465',
          400: '#DDB43B',
          500: '#C9A84C',
          600: '#A88A3E',
          700: '#876C30',
          800: '#664E22',
          900: '#453014',
        },
        background: '#F8F7F4',
        success: '#22C55E',
        occupied: '#94A3B8',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
