import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173, open: false },
  build: {
    // frames + clips are referenced by path from public/, never inlined
    assetsInlineLimit: 0,
  },
});
