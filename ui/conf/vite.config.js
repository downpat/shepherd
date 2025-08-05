import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['ds.local', 'shepherd.local', 'shepherd-dev.local']
  },
  css: {
    postcss: './conf/postcss.config.js'
  }
})
