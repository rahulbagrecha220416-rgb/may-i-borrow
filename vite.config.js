import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Use relative paths for Capacitor
  plugins: [
    react(), // Add React plugin for proper JSX handling
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit
    rollupOptions: {
      output: {
        // Reverting manualChunks to fix Android White Screen issue
      }
    }
  }
})
