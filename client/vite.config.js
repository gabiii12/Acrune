import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on your network so phones/other devices can open it
    proxy: { '/api': 'http://localhost:3001' },
  },
})
