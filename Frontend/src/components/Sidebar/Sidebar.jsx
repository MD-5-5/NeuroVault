import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Library, Network, LogOut, Key, Brain, Menu, X, ChevronRight } from 'lucide-react'
import styles from './Sidebar.module.css'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',       path: '/dashboard' },
  { icon: Library,         label: 'My Vault',        path: '/vault'     },
  { icon: Network,         label: 'Knowledge Graph', path: '/graph'     },
]

/* ── Shared nav link used in both sidebar and drawer ── */
function NavLink({ item, isActive, onClick, collapsed }) {
  const Icon = item.icon
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`${styles.navItem} ${isActive ? styles.active : ''} ${collapsed ? styles.navItemCollapsed : ''}`}
      title={collapsed ? item.label : undefined}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className={styles.activeIndicator}
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <Icon size={18} className={styles.navIcon} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const { user, loading, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = () => setDrawerOpen(false)
  const logoPath = loading ? window.location.pathname : (user ? '/dashboard' : '/home')
  const initials = user?.email?.[0].toUpperCase() ?? '?'
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  const copyId = () => {
    navigator.clipboard.writeText(user?.id || '')
    alert('✅ User ID copied! Paste it in IntelliSeek.')
  }

  return (
    <>
      {/* ─────────────── MOBILE TOP NAVBAR ─────────────── */}
      <header className={styles.topBar}>
        <Link to={logoPath} className={styles.topBarLogo}>
          <div className={styles.logomark}><Brain size={18} /></div>
          <span className={styles.logoText}>NeuroVault</span>
        </Link>
        <div className={styles.topBarRight}>
          <div className={styles.topBarAvatar}>{initials}</div>
          <button className={styles.hamburger} onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* ─────────────── MOBILE OVERLAY ─────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.stopPropagation()
              closeDrawer()
            }}
          />
        )}
      </AnimatePresence>

      {/* ─────────────── MOBILE DRAWER ─────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className={styles.drawer}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 35 }}
          >
            <div className={styles.drawerHeader}>
              <Link to={logoPath} onClick={closeDrawer} className={styles.topBarLogo}>
                <div className={styles.logomark}><Brain size={18} /></div>
                <div className={styles.logoTextContainer}>
                  <span className={styles.logoText}>NeuroVault</span>
                  <span className={styles.logoSubtext}>AI KNOWLEDGE MANAGEMENT</span>
                </div>
              </Link>
              <button className={styles.closeDrawer} onClick={closeDrawer} aria-label="Close menu"><X size={20} /></button>
            </div>

            <nav className={styles.nav}>
              {navItems.map(item => (
                <NavLink key={item.path} item={item} isActive={pathname === item.path} onClick={closeDrawer} />
              ))}
            </nav>

            <div className={styles.bottom}>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>{initials}</div>
                <div className={styles.userDetails}>
                  <p className={styles.userName}>{name}</p>
                  <p className={styles.userEmail}>{user?.email}</p>
                </div>
              </div>
              <button className={styles.userId} onClick={copyId} title="Copy your NeuroVault User ID">
                <Key size={14} /> Copy ID for IntelliSeek
              </button>
              <button onClick={signOut} className={styles.signOut}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────── MOBILE BOTTOM NAVBAR ─────────────── */}
      <nav className={styles.bottomNav}>
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.path
          return (
            <Link key={item.path} to={item.path} className={`${styles.bottomNavItem} ${isActive ? styles.bottomNavActive : ''}`}>
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ─────────────── TABLET SIDEBAR (icon-only, hover-expand) ─────────────── */}
      <aside className={`${styles.sidebar} ${styles.tabletSidebar}`}>
        <Link to={logoPath} className={styles.logo}>
          <div className={styles.logomark}><Brain size={20} color="var(--accent-light)" /></div>
          <div className={styles.logoTextContainer}>
            <span className={styles.logoText}>NeuroVault</span>
            <span className={styles.logoSubtext}>AI KNOWLEDGE MANAGEMENT</span>
          </div>
        </Link>

        <nav className={styles.nav}>
          {navItems.map(item => (
            <NavLink key={item.path} item={item} isActive={pathname === item.path} />
          ))}
        </nav>

        <div className={styles.bottom}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{name}</p>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
          </div>
          <button className={styles.userId} onClick={copyId} title="Copy your NeuroVault User ID">
            <Key size={14} /> <span>Copy ID for IntelliSeek</span>
          </button>
          <button onClick={signOut} className={styles.signOut}>
            <LogOut size={16} /> <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}