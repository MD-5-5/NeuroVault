import { useAuth } from '../../hooks/useAuth'
import { useContent } from '../../hooks/useContent'
import Sidebar from '../../components/Sidebar/Sidebar'
import ContentCard from '../../components/ContentCard/ContentCard'
import styles from './Vault.module.css'
import { useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL

export default function Vault() {
  const { user } = useAuth()
  const { content, loading, deleteContent } = useContent(user?.id)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchType, setSearchType] = useState('') // 'semantic' or 'keyword'
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

  // Apply type filter on top of search results or full content
  const baseContent = results !== null ? results : content
  const displayContent = activeFilter === 'All'
    ? baseContent
    : baseContent.filter(c => c.type === activeFilter)

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>🗄️ My Vault</h1>
            <p className={styles.subtitle}>
              {content.length} items saved · searchable by meaning
            </p>
          </div>
        </div>

        {/* Search Box */}
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
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
          {search && (
            <button className={styles.clearBtn} onClick={clearSearch}>✕</button>
          )}
          <button
            className={styles.searchBtn}
            onClick={handleSearch}
            disabled={searching || !search.trim()}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Result Info */}
        {results !== null && (
          <div className={styles.resultInfo}>
            <span className={styles.resultBadge}>
              {searchType === 'semantic' ? '🧠 Semantic' : '🔤 Keyword'}
            </span>
            <span>
              {results.length === 0
                ? `No results for "${search}"`
                : `${results.length} result${results.length !== 1 ? 's' : ''} for "${search}"`
              }
            </span>
            <button className={styles.clearLink} onClick={clearSearch}>
              Clear search
            </button>
          </div>
        )}

        {/* Type Filter */}
        <div className={styles.filters}>
          {types.map(type => (
            <button
              key={type}
              className={activeFilter === type ? styles.activeFilter : styles.filterBtn}
              onClick={() => setActiveFilter(type)}
            >
              {type === 'All' ? '📁 All' :
               type === 'article' ? '📄 Articles' :
               type === 'youtube' ? '▶️ Videos' :
               type === 'tweet' ? '🐦 Tweets' :
               type === 'note' ? '📝 Notes' : '🖼️ Images'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.grid}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className={styles.skeleton}>
                <div className={styles.skeletonLine} style={{ width: '40%', height: '12px' }} />
                <div className={styles.skeletonLine} style={{ width: '80%', height: '18px' }} />
                <div className={styles.skeletonLine} style={{ width: '100%', height: '12px' }} />
                <div className={styles.skeletonLine} style={{ width: '90%', height: '12px' }} />
              </div>
            ))}
          </div>
        ) : displayContent.length === 0 ? (
          <div className={styles.empty}>
            {results !== null ? (
              <>
                <p>🔍 No results found for "{search}"</p>
                <p className={styles.emptyHint}>
                  Try different keywords or{' '}
                  <button className={styles.clearLink} onClick={clearSearch}>
                    browse all items
                  </button>
                </p>
              </>
            ) : (
              <>
                <p>🧠 Your vault is empty</p>
                <p className={styles.emptyHint}>Go to Dashboard and start saving links or notes!</p>
              </>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {displayContent.map(item => (
              <ContentCard key={item.id} item={item} onDelete={deleteContent} />
            ))}
          </div>
        )}

      </main>
    </div>
  )
}