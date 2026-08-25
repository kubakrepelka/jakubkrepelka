import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  server: { port: 5173, open: false },
  build: {
    // frames + clips are referenced by path from public/, never inlined
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        zamereni: resolve(import.meta.dirname, 'zamereni/index.html'),
        blog: resolve(import.meta.dirname, 'blog/index.html'),
        faq: resolve(import.meta.dirname, 'faq/index.html'),
        reference: resolve(import.meta.dirname, 'reference/index.html'),
      },
    },
  },
});
