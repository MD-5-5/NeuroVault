import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import contentRoutes from './routes/content.js'
import searchRoutes from './routes/search.js'
import './workers/contentWorker.js'
dotenv.config()

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/content', contentRoutes)
app.use('/api/search', searchRoutes)

app.get('/health', (req, res) => res.json({ status: 'NeuroVault backend running ✅' }))

app.listen(process.env.PORT || 5000, () => {
  console.log(`🧠 NeuroVault backend running on port ${process.env.PORT}`)
})