import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // LUMINA soft lab-material palette
        void: '#080907',
        ink: '#11120f',
        slate850: '#1a1b18',
        panel: 'rgba(24, 26, 23, 0.74)',
        line: 'rgba(218, 208, 184, 0.16)',
        haze: '#a7b6b0',
        parchment: '#ede7d8',
        lumina: {
          50: '#eafcff',
          100: '#c9f5ff',
          200: '#98ecff',
          300: '#5fdcf7',
          400: '#2ec2e6',
          500: '#12a4cc',
          600: '#0d81a8',
          700: '#116586',
          800: '#16536d',
          900: '#17455c',
        },
        amber: {
          glow: '#f2b64c',
        },
        signal: {
          pos: '#ff8a5c',
          neg: '#4aa9ff',
          neutral: '#7d8aa0',
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
        panel:
          '0 1px 0 rgba(255,255,255,0.08) inset, 0 18px 44px -26px rgba(0,0,0,0.86), 0 36px 90px -58px rgba(242,182,76,0.28)',
        emblem: '0 0 36px -14px rgba(95, 220, 247, 0.55), 0 18px 36px -28px rgba(242, 182, 76, 0.5)',
      },
      backgroundImage: {
        grid:
          'linear-gradient(rgba(237,231,216,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(237,231,216,0.045) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        shimmer: 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
