import { defineConfig } from 'vite';

const port = Number(process.env.PORT) || 5173;

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['three'],
  },
  server: {
    host: true,
    port,
    strictPort: false,
  },
  preview: {
    host: true,
    port,
    strictPort: false,
  },
});
