import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  server: {
    port: 5173
  },
  build: {
    target: 'esnext'
  }
})
