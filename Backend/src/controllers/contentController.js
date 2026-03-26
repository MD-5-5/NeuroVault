import supabase from '../config/supabase.js'
import { scrapeURL, detectContentType } from '../services/scraper.js'
import { processWithAI, generateEmbedding } from '../services/aiService.js'

// Save new content
export async function saveContent(req, res) {
  try {
    const { url, raw_text, type, user_id } = req.body

    let contentData = { url, raw_text, type: type || 'note', user_id }

    // If URL provided, scrape it
    if (url) {
      const scraped = await scrapeURL(url)
      contentData.raw_text = scraped.raw_text
      contentData.title = scraped.title
      contentData.type = detectContentType(url)
      contentData.metadata = { image: scraped.image }
    }

    // AI Processing
    const ai = await processWithAI(
      contentData.raw_text,
      contentData.title || 'Untitled'
    )

    contentData.summary = ai.summary
    contentData.tags = ai.tags
    contentData.category = ai.category

    // Generate embedding for semantic search
    const embeddingText = `${contentData.title} ${ai.summary} ${ai.tags.join(' ')}`
    const embedding = await generateEmbedding(embeddingText)
    contentData.embedding = JSON.stringify(embedding)

    // Save to Supabase
    const { data, error } = await supabase
      .from('content')
      .insert([contentData])
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, content: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get all content for user
export async function getContent(req, res) {
  try {
    const { user_id, category, type } = req.query

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