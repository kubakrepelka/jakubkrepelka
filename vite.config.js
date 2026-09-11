import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { seoPages } from './src/seo.js';

export default defineConfig({
  /* the preview tool hands out a port when 5173 is taken by another project */
  server: { port: Number(process.env.PORT) || 5173, open: false },
  build: {
    // frames + clips are referenced by path from public/, never inlined
    assetsInlineLimit: 0,
    rollupOptions: {
      input: Object.fromEntries(seoPages.map(page => [page.key, resolve(import.meta.dirname, page.file)])),
    },
  },
});
