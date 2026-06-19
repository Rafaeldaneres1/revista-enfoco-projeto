import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const nonBlockingCssPlugin = () => ({
  name: 'non-blocking-css-links',
  apply: 'build',
  transformIndexHtml(html) {
    return html
      .replace(
        /<link rel="stylesheet" crossorigin href="([^"]+\.css)">/g,
        `<link rel="preload" crossorigin href="$1" as="style"><link rel="stylesheet" crossorigin href="$1" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" crossorigin href="$1"></noscript>`
      )
      .replace(
        /<link rel="stylesheet" href="([^"]+\.css)">/g,
        `<link rel="preload" href="$1" as="style"><link rel="stylesheet" href="$1" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="$1"></noscript>`
      );
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), nonBlockingCssPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://revista-enfoco-api.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://revista-enfoco-api.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
