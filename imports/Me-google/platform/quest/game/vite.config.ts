import { defineConfig } from 'vite';

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
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
});
