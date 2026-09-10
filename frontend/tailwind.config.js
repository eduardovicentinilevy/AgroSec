/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Verde profundo de dossel de mata — Amazônia / Mata Atlântica
        canopy: {
          50: '#eefbf3',
          100: '#d6f5e1',
          200: '#aeebc8',
          300: '#7bdaa9',
          400: '#48bf87',
          500: '#26a36c',
          600: '#188257',
          700: '#146848',
          800: '#12533c',
          900: '#0c3527',
          950: '#071f18',
        },
        // Sub-bosque / terra — troncos, húmus
        bark: {
          50: '#f7f4ee',
          100: '#ebe3d3',
          200: '#d6c6a6',
          300: '#bba374',
          400: '#9c7f52',
          500: '#7e6641',
          600: '#655135',
          700: '#4d3d29',
          800: '#382c1e',
          900: '#251d14',
          950: '#17130e',
        },
        // Luz solar filtrada pela copa — dourado de Cerrado
        sun: {
          50: '#fffaeb',
          100: '#fef0c7',
          200: '#fddd8a',
          300: '#fcc548',
          400: '#f9ab1f',
          500: '#e88a0b',
          600: '#c96706',
          700: '#a54909',
          800: '#87390f',
          900: '#6f3010',
        },
        // Terracota seca — Caatinga (usada para severidade alta)
        caatinga: {
          400: '#e07a4f',
          500: '#c9592f',
          600: '#a84324',
        },
        // Águas do Pantanal — informativo / sync
        pantanal: {
          400: '#4fb8c9',
          500: '#2f96a8',
          600: '#227a8c',
        },
      },
      backgroundImage: {
        'forest-radial':
          'radial-gradient(120% 120% at 15% 0%, rgba(72,191,135,0.25) 0%, rgba(7,31,24,0) 55%)',
      },
      boxShadow: {
        canopy: '0 20px 60px -20px rgba(7, 31, 24, 0.45)',
      },
      borderRadius: {
        organic: '42% 58% 63% 37% / 41% 42% 58% 59%',
      },
    },
  },
  plugins: [],
};
