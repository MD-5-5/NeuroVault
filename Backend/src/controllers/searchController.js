import supabase from '../config/supabase.js'
import { generateEmbedding, chatWithVault } from '../services/aiService.js'

export async function semanticSearch(req, res) {
  try {
    const { query, user_id } = req.body

    const embedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('match_content', {
      query_embedding: JSON.stringify(embedding),
      match_user_id: user_id,
      match_threshold: 0.75,
      match_count: 10
    })

    if (error) throw error
    res.json({ success: true, results: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function aiChat(req, res) {
  try {
    const { query, user_id } = req.body

    // Get relevant content via semantic search
    const embedding = await generateEmbedding(query)
    const { data } = await supabase.rpc('match_content', {
      query_embedding: JSON.stringify(embedding),
      match_user_id: user_id,
      match_threshold: 0.6, 
      match_count: 5
    })
    if (!data || data.length === 0) {
      return res.json({ 
        success: true, 
        answer: "I couldn't find anything in your vault related to that. Try saving some content about this topic first!",
        sources: []
      })
    }

    const context = data?.map(item =>
      `Title: ${item.title}\nSummary: ${item.summary}\nTags: ${item.tags?.join(', ')}`
    ).join('\n\n') || 'No relevant content found.'

    const answer = await chatWithVault(query, context)
    res.json({ success: true, answer, sources: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}