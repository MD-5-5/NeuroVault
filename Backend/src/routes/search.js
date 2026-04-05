import express from 'express'
import { semanticSearch, aiChat, hybridVaultSearch } from '../controllers/searchController.js'

const router = express.Router()

router.post('/semantic', semanticSearch)
router.post('/chat', aiChat)
router.post('/vault-context', hybridVaultSearch)

export default router