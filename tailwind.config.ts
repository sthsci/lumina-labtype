import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // LUMINA dark scientific-editorial palette
        void: '#070a0f',
        ink: '#0c1119',
        slate850: '#141b26',
        panel: 'rgba(18, 25, 36, 0.72)',
        line: 'rgba(148, 173, 210, 0.14)',
        haze: '#8ea3c4',
        parchment: '#e8e2d1',
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
        panel: '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 60px -30px rgba(0,0,0,0.8)',
        emblem: '0 0 40px -12px rgba(46, 194, 230, 0.5)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(148,173,210,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,173,210,0.06) 1px, transparent 1px)',
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
