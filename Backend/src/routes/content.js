import express from 'express'
import { saveContent, getContent, deleteContent, getJobStatus } from '../controllers/contentController.js'

const router = express.Router()

router.post('/', saveContent)
router.get('/', getContent)
router.delete('/:id', deleteContent)
router.get('/job/:jobId', getJobStatus)

export default router