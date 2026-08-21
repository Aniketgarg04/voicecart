/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#07070d',
          1: '#0e0e18',
          2: '#141422',
          3: '#1c1c2e',
        },
        accent: {
          DEFAULT: '#5b6cf9',
          hover: '#4a5be8',
          dim: 'rgba(91, 108, 249, 0.12)',
          glow: 'rgba(91, 108, 249, 0.25)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          hover: 'rgba(255, 255, 255, 0.1)',
          focus: 'rgba(91, 108, 249, 0.5)',
        },
        ink: {
          primary: '#e8eaf0',
          secondary: '#6b7490',
          muted: '#3a3e5c',
          inverse: '#07070d',
        },
        cat: {
          dairy: '#22d3ee',
          produce: '#4ade80',
          meat: '#fb923c',
          bakery: '#fbbf24',
          beverages: '#60a5fa',
          snacks: '#f472b6',
          frozen: '#a78bfa',
          household: '#94a3b8',
          personal_care: '#e879f9',
          other: '#6b7490',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '1.4'],
        xs: ['12px', '1.5'],
        sm: ['13px', '1.5'],
        base: ['15px', '1.6'],
        lg: ['17px', '1.5'],
        xl: ['20px', '1.4'],
        '2xl': ['24px', '1.3'],
        '3xl': ['30px', '1.2'],
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'pulse-ring-fast': 'pulse-ring 1.2s ease-out infinite',
        'waveform-1': 'waveform 0.8s ease-in-out infinite alternate',
        'waveform-2': 'waveform 0.9s ease-in-out 0.1s infinite alternate',
        'waveform-3': 'waveform 0.7s ease-in-out 0.2s infinite alternate',
        'waveform-4': 'waveform 0.85s ease-in-out 0.05s infinite alternate',
        'waveform-5': 'waveform 0.95s ease-in-out 0.15s infinite alternate',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slide-down 0.25s cubic-bezier(0.4, 0, 1, 1) forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'spin-slow': 'spin 2s linear infinite',
        'item-in': 'item-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        waveform: {
          '0%': { transform: 'scaleY(0.2)' },
          '100%': { transform: 'scaleY(1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'item-in': {
          '0%': { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'inset-border': 'inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'glow-accent': '0 0 24px rgba(91, 108, 249, 0.3)',
        'glow-red': '0 0 24px rgba(239, 68, 68, 0.35)',
        'glow-amber': '0 0 24px rgba(251, 191, 36, 0.3)',
        card: '0 1px 3px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};
