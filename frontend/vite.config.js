import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/360Presence/frontend/',
  build: {
    outDir: '../docs/frontend',
    emptyOutDir: true,
  },
})