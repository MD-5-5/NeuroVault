import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useContent } from '../../hooks/useContent'
import Sidebar from '../../components/Sidebar/Sidebar'
import ContentCard from '../../components/ContentCard/ContentCard'
import styles from './Dashboard.module.css'

const API = import.meta.env.VITE_BACKEND_URL

export default function Dashboard() {
  const { user } = useAuth()
  const { content, loading, saveContent, deleteContent } = useContent(user?.id)
  const [input, setInput] = useState('')
  const [inputType, setInputType] = useState('url')
  const [saving, setSaving] = useState(false)
  const [chatQuery, setChatQuery] = useState('')
  const [chatAnswer, setChatAnswer] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')

  const categories = ['All', 'Technology', 'Science', 'Business', 'Health', 'Education', 'Entertainment', 'Other']

  const handleSave = async () => {
  if (!input.trim()) return
  if (!user?.id) {
    alert('Please wait, loading user...')
    return
  }
  setSaving(true)
  const payload = inputType === 'url'
    ? { url: input }
    : { raw_text: input, title: 'Personal Note', type: 'note' }
  const result = await saveContent(payload)
  if (result?.error) {
    alert('Error: ' + result.error)
  }
  setInput('')
  setSaving(false)
}

  const handleChat = async () => {
    if (!chatQuery.trim()) return
    setChatLoading(true)
    setChatAnswer('')
    const res = await fetch(`${API}/api/search/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: chatQuery, user_id: user?.id })
    })
    const data = await res.json()
    setChatAnswer(data.answer)
    setChatLoading(false)
  }

  const filteredContent = activeFilter === 'All'
    ? content
    : content.filter(c => c.category === activeFilter)

  const stats = {
    total: content.length,
    articles: content.filter(c => c.type === 'article').length,
    notes: content.filter(c => c.type === 'note').length,
    videos: content.filter(c => c.type === 'youtube').length,
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>
              Good {new Date().getHours() < 12 ? 'morning' : 'evening'}, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className={styles.subheading}>Your knowledge vault has {stats.total} items</p>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {[
            { label: 'Total Items', value: stats.total, icon: '🧠' },
            { label: 'Articles', value: stats.articles, icon: '📄' },
            { label: 'Notes', value: stats.notes, icon: '📝' },
            { label: 'Videos', value: stats.videos, icon: '▶️' },
          ].map(stat => (
            <div key={stat.label} className={styles.statCard}>
              <span className={styles.statIcon}>{stat.icon}</span>
              <div>
                <p className={styles.statValue}>{stat.value}</p>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Capture */}
        <div className={styles.capture}>
          <h2 className={styles.sectionTitle}>➕ Capture Knowledge</h2>
          <div className={styles.captureBox}>
            <div className={styles.typeToggle}>
              <button
                className={inputType === 'url' ? styles.activeToggle : ''}
                onClick={() => setInputType('url')}
              >🔗 URL</button>
              <button
                className={inputType === 'note' ? styles.activeToggle : ''}
                onClick={() => setInputType('note')}
              >📝 Note</button>
            </div>
            <div className={styles.captureInput}>
              {inputType === 'url' ? (
                <input
                  type="url"
                  placeholder="Paste any URL — article, YouTube, tweet..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
              ) : (
                <textarea
                  placeholder="Write or paste any text to save..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  rows={4}
                />
              )}
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saving || !input.trim()}
              >
                {saving ? '🧠 Processing...' : '⚡ Save & Analyze'}
              </button>
            </div>
          </div>
        </div>

        {/* AI Chat */}
        <div className={styles.chat}>
          <h2 className={styles.sectionTitle}>💬 Ask Your Vault</h2>
          <div className={styles.chatBox}>
            <input
              type="text"
              placeholder="Ask anything about your saved knowledge..."
              value={chatQuery}
              onChange={e => setChatQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChat()}
            />
            <button onClick={handleChat} disabled={chatLoading}>
              {chatLoading ? '...' : '→'}
            </button>
          </div>
          {chatAnswer && (
            <div className={styles.chatAnswer}>
              <p className={styles.chatLabel}>🧠 NeuroVault AI</p>
              <p>{chatAnswer}</p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {categories.map(cat => (
            <button
              key={cat}
              className={activeFilter === cat ? styles.activeFilter : styles.filterBtn}
              onClick={() => setActiveFilter(cat)}
            >{cat}</button>
          ))}
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className={styles.loadingText}>Loading your vault...</div>
        ) : filteredContent.length === 0 ? (
          <div className={styles.empty}>
            <p>🧠 Your vault is empty. Start capturing knowledge above!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredContent.map(item => (
              <ContentCard key={item.id} item={item} onDelete={deleteContent} />
            ))}
          </div>
        )}

      </main>
    </div>
  )
}