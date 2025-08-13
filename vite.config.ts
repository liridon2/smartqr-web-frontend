import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    assetsDir: 'fe-assets', // <-- damit landen React-Assets in /fe-assets statt /assets
  },
  server: {
    proxy: {
      // Nur Requests, die mit /api beginnen, werden ins Backend proxied
      '/api': {
        target: 'https://app.smart-qr.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // /api/a/... -> /a/...
      },
    },
  },
})
