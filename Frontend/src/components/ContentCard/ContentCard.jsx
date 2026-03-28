import styles from './ContentCard.module.css'
import {useState} from 'react'

const typeIcons = {
  article: '📄',
  youtube: '▶️',
  tweet: '🐦',
  note: '📝',
  image: '🖼️'
}

export default function ContentCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.typeIcon}>{typeIcons[item.type] || '📄'}</span>
        <span className={styles.type}>{item.type}</span>
        <span className={styles.category}>{item.category}</span>
        <button className={styles.delete} onClick={() => onDelete(item.id)}>✕</button>
      </div>
      {item.status === 'processing' || item.status === 'pending' ? (
      <div className={styles.processing}>
      <span className={styles.spinner}>⟳</span> AI is analyzing...
      </div>
      ) : item.status === 'failed' ? (
      <div className={styles.failed}>❌ Processing failed</div>
      ) : null}

      <h3 className={styles.title}>{item.title || 'Untitled'}</h3>
      <p  
        className={`${styles.summary} ${expanded ? styles.expanded : ''}`}
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer' }}
        >{item.summary}</p>
        {item.user_note && (
  <div className={styles.userNote}>
    <span>💭</span> {item.user_note}
      </div>
      )}
        {item.summary?.length > 150 && (
      <button className={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
      {expanded ? 'Show less ↑' : 'Read more ↓'}
      </button>
        )}

      <div className={styles.tags}>
        {item.tags?.slice(0, 4).map(tag => (
          <span key={tag} className={styles.tag}>#{tag}</span>
        ))}
      </div>

      <div className={styles.footer}>
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer" className={styles.link}>
            View Source ↗
          </a>
        )}
        <span className={styles.date}>
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
    
  )
}