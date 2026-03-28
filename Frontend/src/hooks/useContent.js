import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_BACKEND_URL

export function useContent(userId) {
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef(null)

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
    if (!userId) return
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

  // Fetch when userId becomes available
  useEffect(() => {
    if (userId) fetchContent()
  }, [userId])

  // Smart auto-refresh — only when pending/processing items exist, no flicker
  useEffect(() => {
    const hasProcessing = content.some(
      c => c.status === 'pending' || c.status === 'processing'
    )

    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Only start interval if something is still processing
    if (hasProcessing && userId) {
      intervalRef.current = setInterval(async () => {
        if (!userId) return
        try {
          const params = new URLSearchParams({ user_id: userId })
          const res = await fetch(`${API}/api/content?${params}`)
          const data = await res.json()
          // Only update state if data actually changed — prevents flicker
          setContent(prev => {
            const newContent = data.content || []
            const changed = JSON.stringify(prev) !== JSON.stringify(newContent)
            return changed ? newContent : prev
          })
        } catch (err) {
          console.error(err)
        }
      }, 3000)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [content, userId])

  return { content, loading, saveContent, deleteContent, fetchContent }
}