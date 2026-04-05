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

    // Fetch vault-level metadata (for quantitative queries) 
    const { data: allContent } = await supabase
      .from('content')
      .select('id, title, type, category, tags, created_at, status')
      .eq('user_id', user_id)
      .eq('status', 'done')
      .order('created_at', { ascending: false })

    const vaultItems = allContent || []
    const typeCounts = vaultItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {})

    const vaultMetadata = [
      `VAULT OVERVIEW:`,
      `- Total saved items: ${vaultItems.length}`,
      ...Object.entries(typeCounts).map(([type, count]) => `- ${type}s: ${count}`),
      `- Most recent save: ${vaultItems[0]?.title || 'none'} (${vaultItems[0]?.created_at?.split('T')[0] || 'n/a'})`,
      `- Categories present: ${[...new Set(vaultItems.map(i => i.category).filter(Boolean))].join(', ') || 'none'}`,
    ].join('\n')

    // Semantic search for relevant items
    const embedding = await generateEmbedding(query)
    const { data: semanticResults } = await supabase.rpc('match_content', {
      query_embedding: JSON.stringify(embedding),
      match_user_id: user_id,
      match_threshold: 0.55,
      match_count: 6
    })

    const semanticContext = semanticResults?.length
      ? semanticResults.map(item =>
          `Title: ${item.title}\nType: ${item.type}\nSummary: ${item.summary}\nTags: ${item.tags?.join(', ')}`
        ).join('\n\n')
      : 'No closely matching items found via semantic search.'

    // Combine both into a rich context
    const fullContext = `${vaultMetadata}\n\nRELEVANT ITEMS:\n${semanticContext}`

    const answer = await chatWithVault(query, fullContext)
    res.json({ success: true, answer, sources: semanticResults || [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Add this new function at the bottom
export async function hybridVaultSearch(req, res) {
  try {
    const { query, user_id, limit = 5 } = req.body

    if (!query || !user_id) {
      return res.status(400).json({ error: 'query and user_id are required' })
    }

    // Generate embedding for the query
    const embedding = await generateEmbedding(query)

    // Search vault semantically
    const { data: vaultResults, error } = await supabase.rpc('match_content', {
      query_embedding: JSON.stringify(embedding),
      match_user_id: user_id,
      match_threshold: 0.55,
      match_count: limit
    })

    if (error) throw error

    // If no semantic results, try keyword fallback
    let results = vaultResults || []
    if (results.length === 0) {
      const { data: keywordResults } = await supabase
        .from('content')
        .select('id, title, summary, type, tags, category, url, created_at')
        .eq('user_id', user_id)
        .eq('status', 'done')
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
        .limit(limit)

      results = keywordResults || []
    }

    // Format for IntelliSeek consumption
    const formatted = results.map(item => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      type: item.type,
      tags: item.tags,
      category: item.category,
      url: item.url,
      saved_at: item.created_at,
      similarity: item.similarity || null
    }))

    res.json({
      success: true,
      query,
      count: formatted.length,
      results: formatted,
      has_results: formatted.length > 0
    })

  } catch (err) {
    console.error(' Vault context error:', err.message)
    res.status(500).json({ error: err.message })
  }
}