import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: [
      { find: '@api', replacement: path.resolve(__dirname, '../../frontend/src/utils/api.js') },
      { find: '@root', replacement: path.resolve(__dirname, '../../frontend/src') },
      { find: /^.*\/utils\/api$/, replacement: path.resolve(__dirname, '../../frontend/src/utils/api.js') },
      { find: /^.*\/components\/Button$/, replacement: path.resolve(__dirname, '../../frontend/src/components/Button.jsx') },
      { find: /^.*\/components\/Card$/, replacement: path.resolve(__dirname, '../../frontend/src/components/Card.jsx') }
    ]
  },
  server: {
    port: 5175
  }
})
