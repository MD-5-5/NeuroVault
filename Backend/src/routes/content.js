import express from 'express'
import { saveContent, getContent, deleteContent } from '../controllers/contentController.js'

const router = express.Router()

router.post('/', saveContent)
router.get('/', getContent)
router.delete('/:id', deleteContent)

export default router