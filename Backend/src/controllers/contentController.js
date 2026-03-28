import supabase from '../config/supabase.js'
import contentQueue from '../queues/contentQueue.js'
import { detectContentType } from '../services/scraper.js'

// Save new content — now uses queue!
export async function saveContent(req, res) {
  try {
    const { url, raw_text, type, user_id } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // Insert placeholder immediately
    const { data, error } = await supabase
      .from('content')
      .insert([{
        user_id,
        url: url || null,
        raw_text: raw_text || null,
        title: url ? 'Processing...' : (raw_text?.slice(0, 60) + '...'),
        type: url ? detectContentType(url) : (type || 'note'),
        status: 'pending',
        summary: 'AI is analyzing this content...',
        tags: [],
        category: 'Other'
      }])
      .select()
      .single()

    if (error) throw error

    // Add to BullMQ queue
    const job = await contentQueue.add('process-content', {
      contentId: data.id,
      url: url || null,
      raw_text: raw_text || null,
      title: data.title,
      user_id
    })

    console.log(`📥 Job ${job.id} queued for content ${data.id}`)

    // Return immediately — don't wait for processing!
    res.json({
      success: true,
      content: data,
      jobId: job.id,
      message: 'Content saved! AI is processing in background...'
    })

  } catch (err) {
    console.error('❌ Save error:', err.message)
    res.status(500).json({ error: err.message })
  }
}

// Get all content for user
export async function getContent(req, res) {
  try {
    const { user_id, category, type } = req.query

    if (!user_id) return res.status(400).json({ error: 'user_id required' })

    let query = supabase
      .from('content')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (category) query = query.eq('category', category)
    if (type) query = query.eq('type', type)

    const { data, error } = await query
    if (error) throw error

    res.json({ success: true, content: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get job status
export async function getJobStatus(req, res) {
  try {
    const { jobId } = req.params
    const job = await contentQueue.getJob(jobId)
    if (!job) return res.status(404).json({ error: 'Job not found' })

    const state = await job.getState()
    const progress = job.progress

    res.json({ jobId, state, progress })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Delete content
export async function deleteContent(req, res) {
  try {
    const { id } = req.params
    const { error } = await supabase.from('content').delete().eq('id', id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}