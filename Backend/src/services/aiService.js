import { geminiModel, embeddingModel } from '../config/gemini.js'

export async function processWithAI(text, title) {
  const prompt = `
You are an AI knowledge organizer. Analyze this content and respond ONLY with valid JSON.

Title: ${title}
Content: ${text.slice(0, 4000)}

Return this exact JSON structure:
{
  "summary": "2-3 sentence summary",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "one of: Technology, Science, Business, Health, Education, Entertainment, Politics, Other",
  "keyTopics": ["topic1", "topic2", "topic3"]
}
`
  const result = await geminiModel.generateContent(prompt)
  const responseText = result.response.text()

  // Clean and parse JSON
  const cleaned = responseText.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

export async function generateEmbedding(text) {
  const result = await embeddingModel.embedContent(text.slice(0, 2000))
  return result.embedding.values
}

export async function chatWithVault(query, context) {
  const prompt = `
You are NeuroVault AI, a personal knowledge assistant.
The user has these saved items relevant to their query:

${context}

User query: ${query}

Answer helpfully based on their saved knowledge. Be concise and insightful.
`
  const result = await geminiModel.generateContent(prompt)
  return result.response.text()
}