import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss' // Import tailwind
import autoprefixer from 'autoprefixer' // Import autoprefixer

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {  // Add this css block
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
})