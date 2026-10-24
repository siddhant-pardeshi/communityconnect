import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Relative base so the SPA works on GitHub Pages project sites and any static host.
// @cc/core is aliased to its TypeScript source — no build step for the domain package.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@cc/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
    },
  },
  build: { target: 'es2020' },
})
