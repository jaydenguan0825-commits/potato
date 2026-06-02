import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [],
  server: {
    port: 5173
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        login: path.resolve(__dirname, 'login.html'),
      }
    }
  }
})
