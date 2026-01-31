import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { componentTagger } from 'lovable-tagger'

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    // Lovable preview expects the dev server on 8080
    port: 8080,
  },
  plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
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
      'framer-motion',
    ],
  },
}))
