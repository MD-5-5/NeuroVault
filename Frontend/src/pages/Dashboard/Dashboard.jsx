import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useContent } from '../../hooks/useContent'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, FileText, StickyNote, Video, Link2, Zap, Plus, Loader2, Image as ImageIcon, Sparkles, Network, Search } from 'lucide-react'
import Sidebar from '../../components/Sidebar/Sidebar'
import ContentCard from '../../components/ContentCard/ContentCard'
import styles from './Dashboard.module.css'

const API = import.meta.env.VITE_BACKEND_URL

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

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
  const [userNote, setUserNote] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const categories = ['All', 'Technology', 'Science', 'Business', 'Health', 'Education', 'Entertainment', 'Other']

  const handleSave = async () => {
    if (inputType !== 'image' && !input.trim()) return
    if (inputType === 'image' && !imageFile) return
    if (!user?.id) { alert('Please wait, loading user...'); return }

    setSaving(true)
    let payload = { type: inputType, user_note: userNote }

    if (inputType === 'url') {
      payload.url = input
    } else if (inputType === 'note') {
      payload.raw_text = input
      payload.title = 'Personal Note'
    } else if (inputType === 'image') {
      const reader = new FileReader()
      const base64Promise = new Promise((resolve) => { reader.onload = () => resolve(reader.result) })
      reader.readAsDataURL(imageFile)
      payload.image_base64 = await base64Promise
    }

    const result = await saveContent(payload)
    if (result?.error) alert('Error: ' + result.error)

    setInput('')
    setUserNote('')
    setImageFile(null)
    setImagePreview(null)
    setSaving(false)
  }

  const handleChat = async (e) => {
    if (e) e.preventDefault()
    if (!chatQuery.trim() || chatLoading) return
    
    setChatLoading(true)
    setChatAnswer('')
    
    try {
      const res = await fetch(`${API}/api/search/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: chatQuery, user_id: user?.id })
      })
      const data = await res.json()
      if (data.success) {
        setChatAnswer(data.answer)
      } else {
        setChatAnswer("I'm sorry, I encountered an error processing your query.")
      }
    } catch (err) {
      setChatAnswer("Connection error. Please try again.")
    } finally {
      setChatLoading(false)
    }
  }

  const filteredContent = activeFilter === 'All' ? content : content.filter(c => c.category === activeFilter)

  const stats = {
    total: content.length,
    articles: content.filter(c => c.type === 'article').length,
    notes: content.filter(c => c.type === 'note').length,
    videos: content.filter(c => c.type === 'youtube').length,
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={styles.header}
        >
          <div>
            <h1 className={styles.greeting}>
              {greeting}, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}
            </h1>
            <p className={styles.subheading}>Your neural synthesis is complete for the day.</p>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          className={styles.stats}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          {[
            { label: 'Total Items', value: stats.total, icon: Brain },
            { label: 'Articles', value: stats.articles, icon: FileText },
            { label: 'Notes', value: stats.notes, icon: StickyNote },
            { label: 'Videos', value: stats.videos, icon: Video },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                className={styles.statCard}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <div className={styles.statIconWrapper}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className={styles.statValue}>{stat.value}</p>
                  <p className={styles.statLabel}>{stat.label}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* ── Capture + Chat ── */}
        <motion.div
          className={styles.contentRow}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          {/* Capture */}
          <div className={styles.capture}>
            <p className={styles.sectionTitle}><Plus size={13} /> Capture Knowledge</p>
            <div className={styles.box}>
              <div className={styles.typeToggle}>
                <button className={inputType === 'url' ? styles.activeToggle : ''} onClick={() => setInputType('url')}>
                  <Link2 size={13} /> URL
                </button>
                <button className={inputType === 'note' ? styles.activeToggle : ''} onClick={() => setInputType('note')}>
                  <StickyNote size={13} /> Note
                </button>
                <button className={inputType === 'image' ? styles.activeToggle : ''} onClick={() => setInputType('image')}>
                  <ImageIcon size={13} /> Image
                </button>
              </div>

              <div className={styles.captureInput}>
                {inputType === 'url' ? (
                  <input
                    type="url"
                    placeholder="Paste source URL (YouTube, Article, PDF)..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                  />
                ) : inputType === 'note' ? (
                  <textarea
                    placeholder="Jot down a quick note or key insight..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    rows={4}
                  />
                ) : (
                  <div className={styles.imageUploadArea}>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.fileInput}
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          setImageFile(file)
                          const reader = new FileReader()
                          reader.onload = (ev) => setImagePreview(ev.target.result)
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    {imagePreview && (
                      <div className={styles.imagePreviewWrapper}>
                        <img src={imagePreview} className={styles.imagePreview} alt="Upload preview" />
                      </div>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {(inputType === 'url' || inputType === 'image') && (
                    <motion.textarea
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      placeholder={inputType === 'image' ? "Add context or a note for this image..." : "Add a personal note... (optional)"}
                      value={userNote}
                      onChange={e => setUserNote(e.target.value)}
                      rows={2}
                      className={styles.noteInput}
                    />
                  )}
                </AnimatePresence>

                <button
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={saving || (inputType !== 'image' && !input.trim()) || (inputType === 'image' && !imageFile)}
                >
                  {saving
                    ? <><Loader2 size={15} className={styles.spin} /> Processing...</>
                    : <><Zap size={15} /> Save &amp; Analyze</>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className={styles.chat}>
            <div className={styles.sectionTitle}>
              <Network size={14} />
              <span>Ask Your Vault</span>
            </div>
            <div className={styles.box}>
              <form onSubmit={handleChat} className={styles.chatBoxInner}>
                <input
                  type="text"
                  placeholder="Ask your knowledge base..."
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  disabled={chatLoading}
                />
                <button type="submit" className={styles.chatBtn} disabled={chatLoading || !chatQuery.trim()}>
                  <Search size={18} />
                </button>
              </form>

              {chatAnswer && (
                <motion.div
                  className={styles.chatAnswer}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className={styles.chatLabel}>
                    <Brain size={14} />
                    <span>NeuroVault AI</span>
                  </p>
                  <p>{chatAnswer.replace(/\*\*|_|#/g, '')}</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Filters ── */}
        <motion.div className={styles.filters} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={activeFilter === cat ? styles.activeFilter : styles.filterBtn}
              onClick={() => setActiveFilter(cat)}
            >{cat}</button>
          ))}
        </motion.div>

        {/* ── Content ── */}
        {loading ? (
          <div className={styles.loadingText}>
            <Loader2 size={20} className={styles.spin} /> Loading your vault...
          </div>
        ) : filteredContent.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.empty}>
            <Brain size={44} className={styles.emptyIcon} />
            <p>Your vault is empty. Start capturing knowledge above!</p>
          </motion.div>
        ) : (
          <motion.div className={styles.grid} variants={containerVariants} initial="hidden" animate="show">
            {filteredContent.map(item => (
              <ContentCard key={item.id} item={item} onDelete={deleteContent} />
            ))}
          </motion.div>
        )}

      </main>
    </div>
  )
}