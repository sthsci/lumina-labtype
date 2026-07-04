import type { Config } from 'tailwindcss';

/**
 * LBTI light editorial theme — "lab notebook" direction.
 *
 * Token names are kept from the earlier dark theme (void/parchment/haze/...)
 * so components did not need a rename sweep; only their VALUES flipped:
 *   void      = warm paper background
 *   parchment = primary ink text
 *   haze      = secondary grey text
 *   panel     = card surface (near-white)
 *   lumina    = teal accent ramp (low numbers dark → readable on paper)
 *   amber     = editorial highlight
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#f4f1e8',
        ink: '#22262c',
        slate850: '#e9e4d8',
        panel: '#fdfcf8',
        line: 'rgba(34, 38, 44, 0.14)',
        haze: '#5f6774',
        parchment: '#23272e',
        lumina: {
          50: '#083344',
          100: '#0b4f63',
          200: '#0d6478',
          300: '#0e7490',
          400: '#0c7f97',
          500: '#2ba3bd',
          600: '#6cc5d6',
          700: '#a5dde8',
          800: '#cdeef4',
          900: '#e6f7fa',
        },
        amber: {
          glow: '#a8650e',
        },
        signal: {
          pos: '#bb4a2a',
          neg: '#2f6fb0',
          neutral: '#8a919c',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          '"Helvetica Neue"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Noto Sans SC"',
          '"Noto Sans TC"',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          '"SF Mono"',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
        display: [
          'Georgia',
          '"Times New Roman"',
          '"Songti SC"',
          '"Noto Serif SC"',
          'serif',
        ],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(34, 38, 44, 0.05), 0 10px 28px -18px rgba(34, 38, 44, 0.18)',
        emblem: '0 12px 30px -14px rgba(34, 38, 44, 0.3)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(34, 38, 44, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 38, 44, 0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
