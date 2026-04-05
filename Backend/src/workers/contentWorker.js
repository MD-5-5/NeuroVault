import { Worker } from 'bullmq'
import redis from '../config/redis.js'
import supabase from '../config/supabase.js'
import { scrapeURL, detectContentType } from '../services/scraper.js'
import { processWithAI, generateEmbedding } from '../services/aiService.js'

const contentWorker = new Worker('content-processing', async (job) => {
  const { contentId, url, raw_text, title, user_id, type, user_note, metadata } = job.data

  console.log(`🔄 Processing job ${job.id} for content ${contentId}`)

  try {
    // Step 1 — Update status to processing
    await supabase
      .from('content')
      .update({ status: 'processing' })
      .eq('id', contentId)

    await job.updateProgress(10)

    let contentData = { raw_text, title, metadata: metadata || {} }

    // Step 2 — Scrape if URL AND not Image
    if (url && type !== 'image') {
      console.log(`Scraping: ${url}`)
      const scraped = await scrapeURL(url)
      contentData.raw_text = scraped.raw_text
      contentData.title = scraped.title
      contentData.metadata = { image: scraped.image }
    } else if (type === 'image') {
      console.log(` Skipping text-scrape for Image file...`)
      contentData.raw_text = user_note ? `[Image content context provided by user]: ${user_note}` : `[User uploaded an image without a note.]`
      contentData.title = user_note ? `${user_note.slice(0, 40)}...` : 'Image Upload'
    }

    await job.updateProgress(35)

    // Step 3 — AI Processing
    console.log(` Running AI analysis...`)
    const ai = await processWithAI(
      contentData.raw_text,
      contentData.title || 'Untitled'
    )

    await job.updateProgress(65)

    // Step 4 — Generate embedding
    console.log(` Generating embedding...`)
    const embeddingText = `${contentData.title} ${ai.summary} ${ai.tags.join(' ')}`
    const embedding = await generateEmbedding(embeddingText)

    await job.updateProgress(85)

    // Step 5 — Update content in Supabase with all processed data
    const { error } = await supabase
      .from('content')
      .update({
        title: contentData.title,
        raw_text: contentData.raw_text,
        summary: ai.summary,
        tags: ai.tags,
        category: ai.category,
        embedding: JSON.stringify(embedding),
        metadata: contentData.metadata || {},
        status: 'done'
      })
      .eq('id', contentId)

    if (error) throw error

    await job.updateProgress(100)
    console.log(` Content ${contentId} processed successfully`)

    return { success: true, contentId }

  } catch (err) {
    console.error(`Job ${job.id} failed:`, err.message)

    // Mark as failed in DB
    await supabase
      .from('content')
      .update({ status: 'failed' })
      .eq('id', contentId)

    throw err
  }

}, {
  connection: redis,
  concurrency: 3  
})

contentWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})

contentWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`)
})

contentWorker.on('progress', (job, progress) => {
  console.log(`Job ${job.id}: ${progress}% complete`)
})

export default contentWorker