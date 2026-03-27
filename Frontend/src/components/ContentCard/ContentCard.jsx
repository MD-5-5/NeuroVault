import styles from './ContentCard.module.css'

const typeIcons = {
  article: '📄',
  youtube: '▶️',
  tweet: '🐦',
  note: '📝',
  image: '🖼️'
}

export default function ContentCard({ item, onDelete }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.typeIcon}>{typeIcons[item.type] || '📄'}</span>
        <span className={styles.type}>{item.type}</span>
        <span className={styles.category}>{item.category}</span>
        <button className={styles.delete} onClick={() => onDelete(item.id)}>✕</button>
      </div>

      <h3 className={styles.title}>{item.title || 'Untitled'}</h3>
      <p className={styles.summary}>{item.summary}</p>

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