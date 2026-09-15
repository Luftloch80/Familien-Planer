import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Mindestunterstützung: Safari auf iPhone ab Version 16
    target: ['safari16', 'ios16'],
  },
})
