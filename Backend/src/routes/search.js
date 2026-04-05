import express from 'express'
import { semanticSearch, aiChat, hybridVaultSearch } from '../controllers/searchController.js'
import { authMiddleware } from '../middleware/auth.js'
const router = express.Router()

router.post('/semantic', authMiddleware, semanticSearch)
router.post('/chat', authMiddleware, aiChat)
router.post('/vault-context', authMiddleware, hybridVaultSearch)

export default router