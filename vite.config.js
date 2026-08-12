import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  build: {
    target: 'es2020',
    // three is large and stable; splitting it out lets it stay cached across
    // deploys of the game code itself.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
        },
      },
    },
    assetsInlineLimit: 2048,
    chunkSizeWarningLimit: 1200,
  },
});
