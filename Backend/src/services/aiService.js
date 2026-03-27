import mistral from '../config/mistral.js'

export async function processWithAI(text, title) {
  const response = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      {
        role: 'user',
        content: `You are an AI knowledge organizer. Analyze this content and respond ONLY with valid JSON, no markdown, no backticks.

Title: ${title}
Content: ${text.slice(0, 4000)}

Return this exact JSON:
{
  "summary": "2-3 sentence summary",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "one of: Technology, Science, Business, Health, Education, Entertainment, Politics, Other",
  "keyTopics": ["topic1", "topic2", "topic3"]
}`
      }
    ]
  })

  const raw = response.choices[0].message.content.trim()
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

export async function generateEmbedding(text) {
  const response = await mistral.embeddings.create({
    model: 'mistral-embed',
    inputs: [text.slice(0, 2000)]
  })
  return response.data[0].embedding
}

export async function chatWithVault(query, context) {
  const response = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      {
        role: 'system',
        content: `You are NeuroVault AI, a personal knowledge assistant. 
The user has these saved items relevant to their query:

${context}

Answer helpfully based on their saved knowledge. Be concise and insightful.`
      },
      {
        role: 'user',
        content: query
      }
    ]
  })
  return response.choices[0].message.content
}