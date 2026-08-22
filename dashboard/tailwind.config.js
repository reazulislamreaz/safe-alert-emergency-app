/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#DBF5FF',
          100: '#BCD9FF',
          200: '#9BBDFF',
          300: '#7BA1F3',
          400: '#5C85E1',
          500: '#3A67D5',
          600: '#1D49C2',
          700: '#072AA3',
          800: '#010581',
          900: '#04005B',
          950: '#09003B',
        },
        alarm: {
          50: '#FFDACD',
          100: '#FFBEB0',
          200: '#F9D8D',
          300: '#FF7B6B',
          400: '#F75548',
          500: '#EB0909',
          600: '#CF0000',
          700: '#AA0000',
          800: '#810000',
          900: '#550000',
        },
        battletoad: {
          50: '#C3FFD0',
          100: '#A7F8B7',
          200: '#83EB99',
          300: '#5AD77B',
          400: '#18C75B',
          500: '#00AA1D',
          600: '#008A00',
          700: '#006900',
        },
        orangina: {
          50: '#FFF390',
          100: '#FFE06D',
          200: '#FACC16',
          300: '#E1AA00',
          400: '#C98900',
          500: '#B46400',
        },
        elephant: {
          50: '#F5F5F5',
          100: '#E1E1E1',
          200: '#CECECE',
          300: '#BBBBBB',
          400: '#A8A8A7',
          500: '#888887',
          600: '#696968',
          700: '#4B4B4A',
          800: '#30302F',
          900: '#161616',
          950: '#030303',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 1.5s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 25px 8px rgba(235, 9, 9, 0.45)' },
          '50%': { boxShadow: '0 0 50px 18px rgba(235, 9, 9, 0.75)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
