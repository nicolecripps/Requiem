/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        void: '#0a0a0f',
        surface: '#15131c',
        surface2: '#1f1c2b',
        surface3: '#2a2638',
        hairline: '#2e2a3d',
        ink: '#e8e6f0',
        smoke: '#9b96a8',
        dim: '#6f6a7d',
        lilac: { DEFAULT: '#b9a3e3', dim: '#8b7ab8' }
      },
      keyframes: {
        'moon-pop': {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '60%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      animation: {
        'moon-pop': 'moon-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards'
      }
    }
  },
  plugins: []
}
