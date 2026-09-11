import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  /* the preview tool hands out a port when 5173 is taken by another project */
  server: { port: Number(process.env.PORT) || 5173, open: false },
  build: {
    // frames + clips are referenced by path from public/, never inlined
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        web: resolve(import.meta.dirname, 'tvorba-webovych-stranek/index.html'),
        app: resolve(import.meta.dirname, 'webove-aplikace/index.html'),
        ai: resolve(import.meta.dirname, 'ai-automatizace/index.html'),
        edu: resolve(import.meta.dirname, 'ai-skoleni/index.html'),
        blog: resolve(import.meta.dirname, 'blog/index.html'),
        faq: resolve(import.meta.dirname, 'faq/index.html'),
        reference: resolve(import.meta.dirname, 'reference/index.html'),
      },
    },
  },
});
