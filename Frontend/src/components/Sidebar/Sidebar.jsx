import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './Sidebar.module.css'

const navItems = [
  { icon: '⚡', label: 'Dashboard', path: '/dashboard' },
  { icon: '🗄️', label: 'My Vault', path: '/vault' },
  { icon: '🕸️', label: 'Knowledge Graph', path: '/graph' },  // ADD THIS
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🧠</span>
        <span className={styles.logoText}>NeuroVault</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.bottom}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className={styles.userDetails}>
            <p className={styles.userName}>
              {user?.user_metadata?.full_name || 'User'}
            </p>
            <p className={styles.userEmail}>{user?.email}</p>
          </div>
        </div>
        <button onClick={signOut} className={styles.signOut}>Sign Out</button>
      </div>
    </aside>
  )
}