import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'framer-motion'],
    alias: [
      // Milestone 3 internal self-contained alias
      { find: '@m3', replacement: path.resolve(__dirname, 'src/milestone3') },
      // Milestone 4 internal self-contained alias
      { find: '@m4', replacement: path.resolve(__dirname, 'src/milestone4') },
      // Shared API instance
      { find: '@api', replacement: path.resolve(__dirname, 'src/utils/api') },
      // Root components
      { find: '@root', replacement: path.resolve(__dirname, 'src') },
    ]
  }
})
