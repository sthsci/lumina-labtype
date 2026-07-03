import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// GitHub Pages serves project sites from https://<user>.github.io/<repo>/.
// The base path must match the repo name (or "/" for a user/custom-domain site).
// Override at build time with:  VITE_BASE=/my-repo/ npm run build
const base = process.env.VITE_BASE ?? '/academic_personality/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          d3: ['d3-scale', 'd3-interpolate'],
          motion: ['framer-motion'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
