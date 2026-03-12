/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        burg: {
          DEFAULT: '#8B1A1A',
          hover: '#A52020',
          bg: '#FBF4F4',
        },
        navy: '#111111',
        cream: '#F8F7F3',
        off: '#F2F0EC',
        border: '#E3E1DC',
        text: '#1A1A1A',
        muted: '#767676',
        dim: '#AAAAAA',
        green: {
          DEFAULT: '#16543A',
          bg: '#EEF7F0',
        },
        amber: {
          DEFAULT: '#7A5200',
          bg: '#FBF6EA',
        },
        slate: {
          950: '#020617', // Keeping this temporarily in case any residual classes are not migrated immediately
        },
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 12px 36px rgba(0,0,0,0.09)',
        'btn': '0 4px 14px rgba(139, 26, 26, 0.25)',
      }
    },
  },
  plugins: [],
}
