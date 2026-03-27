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

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    const res = await fetch(`${API}/api/search/semantic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: search, user_id: user?.id })
    })
    const data = await res.json()
    setResults(data.results || [])
    setSearching(false)
  }

  const displayContent = results !== null ? results : content

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>🗄️ My Vault</h1>
        <p className={styles.subtitle}>All your saved knowledge in one place</p>

        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search your vault semantically..."
            value={search}
            onChange={e => { setSearch(e.target.value); if (!e.target.value) setResults(null) }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={searching}>
            {searching ? '...' : '🔍 Search'}
          </button>
        </div>

        {results !== null && (
          <p className={styles.resultInfo}>
            Found {results.length} results for "{search}"
            <button onClick={() => { setResults(null); setSearch('') }}>Clear</button>
          </p>
        )}

        {loading ? (
          <p className={styles.loading}>Loading vault...</p>
        ) : displayContent.length === 0 ? (
          <div className={styles.empty}>No items found</div>
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