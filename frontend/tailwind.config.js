/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#eaf5ef',
          100: '#d0e8dc',
          200: '#a3d1ba',
          300: '#6eb593',
          400: '#3d946d',
          500: '#00522e',
          600: '#00381f', // Deep Background / Text Color (#00381F)
          700: '#002c18',
          800: '#001e10',
          900: '#00120a',
        },
        gold: {
          50: '#fffdf5',
          100: '#fff8e6',
          200: '#feecb8',
          300: '#fcde85',
          400: '#f7cb4b',
          500: '#d9ae29', // Highlight Color (#D9AE29)
          600: '#c89d1f',
          700: '#a17c15',
          800: '#7d6014',
          900: '#5c4611',
        },
        sand: {
          50: '#faf8f4',
          100: '#f5efe5', // Main Background (#F5EFE5)
          200: '#eae0d2',
          300: '#dccfbd',
          400: '#c5b49d',
          500: '#ab957b',
          600: '#937c63',
          700: '#79644f',
          800: '#645343',
          900: '#534539',
        },
        charcoal: {
          50: '#f7f7f7',
          100: '#e9e9e9',
          200: '#d5d5d5',
          300: '#b4b4b4',
          400: '#8a8a8a',
          500: '#636363',
          600: '#4b4b4b',
          700: '#3a3a3a',
          800: '#272727', // Text Color (#272727)
          900: '#1a1a1a',
        },
        terracotta: {
          50: '#fdf6f3',
          100: '#faeae3',
          200: '#f4d3c4',
          300: '#eab29a',
          400: '#dc8768',
          500: '#944426', // Detail Color 1 (#944426)
          600: '#84391e',
          700: '#6e2e17',
          800: '#5c2716',
          900: '#4c2215',
        },
        olive: {
          50: '#f8f8ef',
          100: '#eef0d9',
          200: '#dde1b5',
          300: '#c7cd89',
          400: '#b2b963',
          500: '#9d9d48', // Section Background (#9D9D48)
          600: '#838339',
          700: '#676730',
          800: '#53532a',
          900: '#464626',
        },
        burgundy: {
          50: '#fdf2f3',
          100: '#fbe2e4',
          200: '#f8c9cd',
          300: '#f2a4ac',
          400: '#ea7381',
          500: '#620513', // Detail Color 2 (#620513)
          600: '#540410',
          700: '#45030d',
          800: '#39030b',
          900: '#30020a',
        },
        brandTeal: {
          50: '#eef8f9',
          100: '#d3eeef',
          500: '#0b525b',
          600: '#084047',
          700: '#052c31',
        },
      },
      fontFamily: {
        sans: ['"Neue Montreal"', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"BNCringeSerif"', 'Canela', 'Outfit', 'Georgia', 'serif'],
        serif: ['Canela', '"BNCringeSerif"', 'Georgia', 'serif'],
        header: ['"BNCringeSerif"', 'Canela', 'Georgia', 'serif'],
        accent: ['Canela', '"AMS Aakash"', 'serif'],
        body: ['"Neue Montreal"', 'Plus Jakarta Sans', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 56, 31, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 12px 30px -4px rgba(0, 56, 31, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
        'gold-glow': '0 0 20px rgba(217, 174, 41, 0.25)',
        // Subtle elevations used across cards, pills and toolbars
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-up': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-up': 'scale-up 0.18s ease-out',
      },
    },
  },
  plugins: [],
}
