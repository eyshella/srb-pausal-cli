import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { builtinModules } from 'module';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/index.js',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [
        // Node built-ins
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
        // External dependencies
        'better-sqlite3',
        'commander',
        'axios',
        'react',
        'react/jsx-runtime',
        '@react-pdf/renderer',
      ],
      output: {
        preserveModules: false,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    target: 'node18',
    ssr: true,
  },
  esbuild: {
    jsx: 'automatic',
  },
});

