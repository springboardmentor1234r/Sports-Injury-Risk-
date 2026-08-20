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
    alias: [
      // Milestone 3 frontend path alias
      { find: '@m3', replacement: path.resolve(__dirname, '../../Milestone_3/frontend') },
      // Milestone 4 frontend path alias
      { find: '@m4', replacement: path.resolve(__dirname, '../../Milestone_4/frontend') },
      // Shared API instance — allows M3/M4 service files to use root api.js
      { find: '@api', replacement: path.resolve(__dirname, 'src/utils/api') },
      // Root components — allows M3/M4 pages to use shared Button, Card, etc.
      { find: '@root', replacement: path.resolve(__dirname, 'src') },
    ]
  }
})
