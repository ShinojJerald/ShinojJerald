import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The repository is github.com/ShinojJerald/ShinojJerald, so GitHub Pages serves it
// as a *project* site at https://shinojjerald.github.io/ShinojJerald/.
// Assets therefore need that sub-path as their base in production builds.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ShinojJerald/' : '/',
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    // The lazily-loaded 3D chunk (three.js + react-three-fiber) is ~250 kB gzipped.
    chunkSizeWarningLimit: 1100,
  },
}));
