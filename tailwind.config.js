/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        neutral: {
          DEFAULT: '#F8FAFC',
          50: '#F8FAFC',
        },
        primary: {
          DEFAULT: '#0066FF',
          light: '#3385ff',
          dark: '#0052cc',
        },
        secondary: {
          DEFAULT: '#5B75BA',
        },
        tertiary: {
          DEFAULT: '#CC4204',
        },
        tier: {
          bronze: '#cd7f32',
          silver: '#9ca3af',
          gold: '#f59e0b',
          platinum: '#6366f1',
          diamond: '#06b6d4',
          'red-diamond': '#CC4204',
        },
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'glow-gold': {
          '0%, 100%': { boxShadow: '0 0 4px 1px rgba(245,158,11,0.4)' },
          '50%': { boxShadow: '0 0 10px 3px rgba(245,158,11,0.7)' },
        },
        'glow-diamond': {
          '0%, 100%': { boxShadow: '0 0 6px 2px rgba(6,182,212,0.5)' },
          '50%': { boxShadow: '0 0 14px 5px rgba(6,182,212,0.8)' },
        },
        'glow-red-diamond': {
          '0%, 100%': { boxShadow: '0 0 6px 2px rgba(204,66,4,0.5)' },
          '50%': { boxShadow: '0 0 16px 6px rgba(204,66,4,0.9)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(110%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(110%)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
        'glow-gold': 'glow-gold 2s ease-in-out infinite',
        'glow-diamond': 'glow-diamond 2s ease-in-out infinite',
        'glow-red-diamond': 'glow-red-diamond 1.5s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
        'slide-out-right': 'slide-out-right 0.25s ease-in forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
      },
      fontSize: {
        'type-page':      'var(--type-page)',
        'type-section':   'var(--type-section)',
        'type-card':      'var(--type-card)',
        'type-body':      'var(--type-body)',
        'type-secondary': 'var(--type-secondary)',
        'type-badge':     'var(--type-badge)',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.08)',
        panel: '0 2px 8px 0 rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
