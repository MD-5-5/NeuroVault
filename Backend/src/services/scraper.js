import axios from 'axios'
import * as cheerio from 'cheerio'

export async function scrapeURL(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    })
    const $ = cheerio.load(data)

    // Remove unwanted elements
    $('script, style, nav, footer, header, ads').remove()

    const title = $('title').text().trim() ||
                  $('h1').first().text().trim() ||
                  'Untitled'

    const raw_text = $('body').text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000) // limit tokens

    const image = $('meta[property="og:image"]').attr('content') || null

    return { title, raw_text, image, url }
  } catch (err) {
    throw new Error(`Scraping failed: ${err.message}`)
  }
}

export function detectContentType(url) {
  if (!url) return 'note'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'tweet'
  return 'article'
}