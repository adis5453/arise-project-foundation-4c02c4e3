import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { componentTagger } from 'lovable-tagger'

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 5173,
    force: true, // Force dependency re-optimization
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
