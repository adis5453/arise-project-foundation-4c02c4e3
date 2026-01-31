import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { healthRouter } from './routes/health'
import { errorHandler } from './middleware/errorHandler'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(morgan('combined'))

  app.use('/api/health', healthRouter)

  app.use(errorHandler)
  return app
}
