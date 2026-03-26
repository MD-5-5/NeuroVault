import express from 'express'
import { semanticSearch, aiChat } from '../controllers/searchController.js'

const router = express.Router()

router.post('/semantic', semanticSearch)
router.post('/chat', aiChat)

export default router