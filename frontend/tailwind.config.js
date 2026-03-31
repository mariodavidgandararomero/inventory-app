/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f5f5f0',
          100: '#e8e8e0',
          200: '#d0d0c5',
          300: '#b0b0a0',
          400: '#888875',
          500: '#666655',
          600: '#504f40',
          700: '#3c3b30',
          800: '#282820',
          900: '#181810',
          950: '#0c0c08',
        },
        sage: {
          50: '#f2f7f4',
          100: '#deeee6',
          200: '#bddccc',
          300: '#90c2a8',
          400: '#5da280',
          500: '#3c8463',
          600: '#2c6a4e',
          700: '#245440',
          800: '#1e4334',
          900: '#19372b',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        coral: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        }
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.05)',
        'panel': '0 0 0 1px rgb(0 0 0 / 0.06), 0 4px 24px rgb(0 0 0 / 0.06)',
      }
    },
  },
  plugins: [],
}
