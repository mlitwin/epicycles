import { defineConfig } from 'vite'

export default defineConfig({
  base: '/epicycles/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
