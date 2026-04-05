import { useAuth } from '../../hooks/useAuth'
import { useContent } from '../../hooks/useContent'
import Sidebar from '../../components/Sidebar/Sidebar'
import ContentCard from '../../components/ContentCard/ContentCard'
import styles from './Vault.module.css'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Brain, Type, Folder, FileText, Video, Hash, StickyNote, Image as ImageIcon, Library } from 'lucide-react'

const API = import.meta.env.VITE_BACKEND_URL

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

export default function Vault() {
  const { user } = useAuth()
  const { content, loading, deleteContent } = useContent(user?.id)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchType, setSearchType] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const types = ['All', 'article', 'youtube', 'tweet', 'note', 'image']

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    setResults(null)
    try {
      const res = await fetch(`${API}/api/search/semantic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: search, user_id: user?.id })
      })
      const data = await res.json()
      setResults(data.results || [])
      setSearchType(data.type || 'semantic')
    } catch (err) {
      console.error(err)
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const clearSearch = () => {
    setResults(null)
    setSearch('')
    setSearchType('')
  }

  const baseContent = results !== null ? results : content
  const displayContent = activeFilter === 'All'
    ? baseContent
    : baseContent.filter(c => c.type === activeFilter)

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={styles.header}
        >
          <div>
            <h1 className={styles.title}><Library size={30} className={styles.titleIcon} /> My Vault</h1>
            <p className={styles.subtitle}>{content.length} items saved · searchable by meaning</p>
          </div>
        </motion.div>

        <motion.div
          className={styles.searchBox}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Search size={17} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search semantically... e.g. 'cricket articles' or 'AI videos'"
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              if (!e.target.value) clearSearch()
            }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={styles.clearBtn}
                onClick={clearSearch}
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
          <button className={styles.searchBtn} onClick={handleSearch} disabled={searching || !search.trim()}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </motion.div>

        {results !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.resultInfo}>
            <span className={styles.resultBadge}>
              {searchType === 'semantic' ? <><Brain size={11} /> Semantic</> : <><Type size={11} /> Keyword</>}
            </span>
            <span>
              {results.length === 0
                ? `No results for "${search}"`
                : `${results.length} result${results.length !== 1 ? 's' : ''} for "${search}"`
              }
            </span>
            <button className={styles.clearLink} onClick={clearSearch}>Clear search</button>
          </motion.div>
        )}

        <motion.div className={styles.filters} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
          {types.map(type => {
            const Icon = type === 'All' ? Folder
              : type === 'article' ? FileText
              : type === 'youtube' ? Video
              : type === 'tweet' ? Hash
              : type === 'note' ? StickyNote : ImageIcon
            return (
              <button
                key={type}
                className={activeFilter === type ? styles.activeFilter : styles.filterBtn}
                onClick={() => setActiveFilter(type)}
              >
                <Icon size={13} />
                {type === 'All' ? 'All'
                  : type === 'article' ? 'Articles'
                  : type === 'youtube' ? 'Videos'
                  : type === 'tweet' ? 'Tweets'
                  : type === 'note' ? 'Notes' : 'Images'}
              </button>
            )
          })}
        </motion.div>

        {loading ? (
          <div className={styles.grid}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className={styles.skeleton}>
                <div className={styles.skeletonLine} style={{ width: '40%', height: '11px' }} />
                <div className={styles.skeletonLine} style={{ width: '80%', height: '17px' }} />
                <div className={styles.skeletonLine} style={{ width: '100%', height: '11px' }} />
                <div className={styles.skeletonLine} style={{ width: '90%', height: '11px' }} />
              </div>
            ))}
          </div>
        ) : displayContent.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.empty}>
            {results !== null ? (
              <>
                <Search size={44} className={styles.emptyIcon} />
                <p>No results found for "{search}"</p>
                <p className={styles.emptyHint}>Try different keywords or <button className={styles.clearLink} onClick={clearSearch}>browse all items</button></p>
              </>
            ) : (
              <>
                <Library size={44} className={styles.emptyIcon} />
                <p>Your vault is empty</p>
                <p className={styles.emptyHint}>Go to Dashboard and start saving links or notes!</p>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div className={styles.grid} variants={containerVariants} initial="hidden" animate="show">
            {displayContent.map(item => (
              <ContentCard key={item.id} item={item} onDelete={deleteContent} />
            ))}
          </motion.div>
        )}

      </main>
    </div>
  )
}
