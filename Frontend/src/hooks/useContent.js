import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_BACKEND_URL

export function useContent(userId) {
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchContent = async (filters = {}) => {
    if (!userId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ user_id: userId, ...filters })
      const res = await fetch(`${API}/api/content?${params}`)
      const data = await res.json()
      setContent(data.content || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const saveContent = async (payload) => {
  if (!userId) {
    console.error('No user ID!')
    return
  }
  const res = await fetch(`${API}/api/content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, user_id: userId })
  })
  const data = await res.json()
  if (data.success) fetchContent()
  return data
}

  const deleteContent = async (id) => {
    await fetch(`${API}/api/content/${id}`, { method: 'DELETE' })
    setContent(prev => prev.filter(c => c.id !== id))
  }

  useEffect(() => {
  const hasProcessing = content.some(
    c => c.status === 'pending' || c.status === 'processing'
  )
  if (!hasProcessing) return

  const interval = setInterval(() => {
    fetchContent()
  }, 3000) // check every 3 seconds

  return () => clearInterval(interval)
}, [content])

  return { content, loading, saveContent, deleteContent, fetchContent }
}