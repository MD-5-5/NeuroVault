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
        content: `You are NeuroVault AI, a personal knowledge assistant for the user's saved content library.

You have access to the user's full vault context below. It contains:
1. VAULT OVERVIEW — exact counts of all saved items by type (articles, notes, videos, etc.)
2. RELEVANT ITEMS — items semantically matched to the user's query

${context}

CRITICAL INSTRUCTIONS:
- For quantitative questions (e.g. "how many articles", "how many items", "what types do I have"), use the VAULT OVERVIEW statistics — they are exact and authoritative.
- For content questions (e.g. "what do I know about AI"), use the RELEVANT ITEMS section.
- Always answer directly and confidently using the data provided.
- Be concise, friendly, and insightful. Never say you "don't have access" — you have the data above.
- FORMATTING: Use plain text strictly. DO NOT use markdown symbols like asterisks (**), hashtags (#), or underscores (_).`
      },
      {
        role: 'user',
        content: query
      }
    ]
  })
  return response.choices[0].message.content
}