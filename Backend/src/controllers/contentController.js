import supabase from '../config/supabase.js'
import contentQueue from '../queues/contentQueue.js'
import { detectContentType } from '../services/scraper.js'

// Save new content — now uses queue!
export async function saveContent(req, res) {
  try {
    const { url, raw_text, type, user_id, user_note, image_base64 } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    let finalType = type;
    if (!finalType || finalType === 'url') {
      finalType = url ? detectContentType(url) : 'note';
    }
    let resolvedUrl = url || null
    let metadataStore = {}

    // Handle Image Base64 Buffer Uploads
    if (image_base64 && finalType === 'image') {
      const match = image_base64.match(/^data:image\/(\w+);base64,(.+)$/)
      if (match) {
        const ext = match[1]
        const buffer = Buffer.from(match[2], 'base64')
        const filename = `${user_id}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('vault-images')
          .upload(filename, buffer, { contentType: `image/${ext}` })
        
        if (uploadError) throw uploadError

        const { data: publicData } = supabase.storage.from('vault-images').getPublicUrl(filename)
        resolvedUrl = publicData.publicUrl
        metadataStore = { image: resolvedUrl }
      }
    }

    // Insert placeholder immediately
    const { data, error } = await supabase
      .from('content')
      .insert([{
        user_note: user_note || null,
        user_id,
        url: resolvedUrl,
        raw_text: raw_text || null,
        title: finalType === 'image' ? (user_note ? `${user_note.slice(0, 40)}...` : 'Uploaded Image') : (resolvedUrl ? 'Processing...' : (raw_text?.slice(0, 60) + '...')),
        type: finalType,
        status: 'pending',
        summary: 'AI is analyzing this content...',
        metadata: metadataStore,
        tags: [],
        category: 'Other'
      }])
      .select()
      .single()

    if (error) throw error

    // Add to BullMQ queue
    const job = await contentQueue.add('process-content', {
      contentId: data.id,
      url: resolvedUrl,
      type: finalType,
      raw_text: raw_text || null,
      user_note: user_note || null,
      title: data.title,
      metadata: metadataStore,
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