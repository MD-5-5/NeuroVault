import styles from './ContentCard.module.css'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Video, Hash, StickyNote, Image as ImageIcon, X, Loader2, AlertCircle, MessageSquareQuote, ArrowRight, MoreHorizontal } from 'lucide-react'

const typeIcons = {
  article: FileText,
  youtube: Video,
  tweet: Hash,
  note: StickyNote,
  image: ImageIcon,
}

export default function ContentCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const TypeIcon = typeIcons[item.type] || FileText
  const isImage = item.type === 'image' && item.metadata?.image

  return (
    <motion.div 
      className={styles.card}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      {isImage && (
        <div className={styles.topImageContainer}>
          <img src={item.metadata.image} alt={item.title || 'Image'} className={styles.topImage} />
          {item.status === 'processed' && (
             <div className={styles.imageOverlayBadge}>EXTRACTED METADATA</div>
          )}
        </div>
      )}

      <div className={styles.cardBody}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.typeIcon}><TypeIcon size={14} /></span>
            <span className={styles.type}>{item.type}</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.dateBadge}>
              SAVED {new Date(item.created_at).toLocaleDateString()}
            </span>
            <button className={styles.delete} onClick={() => onDelete(item.id)}>
              <X size={14} />
            </button>
          </div>
        </div>

        {item.status === 'processing' || item.status === 'pending' ? (
          <div className={styles.processing}>
            <Loader2 size={14} className={styles.spinnerIcon} /> AI is analyzing...
          </div>
        ) : item.status === 'failed' ? (
          <div className={styles.failed}><AlertCircle size={14} /> Processing failed</div>
        ) : null}

        <h3 className={styles.title}>{item.title || 'Untitled'}</h3>
        
        {item.summary && (
          <p  
            className={`${styles.summary} ${expanded ? styles.expanded : ''}`}
            onClick={() => setExpanded(!expanded)}
          >
            {item.summary}
          </p>
        )}

        {item.user_note && (
          <div className={styles.userNote}>
            <MessageSquareQuote size={14} className={styles.noteIcon} /> 
            <span>{item.user_note}</span>
          </div>
        )}

        <div className={styles.tags}>
          {item.tags?.slice(0, 4).map(tag => (
            <span key={tag} className={styles.tag}>#{tag}</span>
          ))}
          {!item.tags?.length && item.category && (
            <span className={styles.tag}>#{item.category.toLowerCase()}</span>
          )}
          {!item.tags?.length && !item.category && (
            <span className={styles.tag}>#uncategorized</span>
          )}
        </div>

        <div className={styles.footer}>
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer" className={styles.bottomAction}>
              READ MORE <ArrowRight size={12} className={styles.arrowIcon} />
            </a>
          ) : (
            <span className={styles.bottomActionStatic}>
              AI ANALYSIS COMPLETE
            </span>
          )}
          <button className={styles.moreOptionsBtn}>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}