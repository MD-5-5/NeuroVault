import express from 'express'
import { saveContent, getContent, deleteContent, getJobStatus } from '../controllers/contentController.js'
import { authMiddleware } from '../middleware/auth.js'
const router = express.Router()

router.post('/', authMiddleware, saveContent)
router.get('/', authMiddleware, getContent)
router.delete('/:id', authMiddleware, deleteContent)
router.get('/job/:jobId', authMiddleware, getJobStatus)

export default router