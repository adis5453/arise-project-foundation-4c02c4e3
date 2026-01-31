import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['chart.js/auto'],
    include: [
      'chart.js',
      'chartjs-adapter-dayjs-4',
      'react-chartjs-2',
      '@mui/material',
      '@mui/icons-material',
      'framer-motion'
    ]
  },
  server: {
    // Lovable preview expects the dev server on 8080
    port: 8080,
  },
})
