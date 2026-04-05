import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { Brain, Mail, Lock, ArrowRight, Database, Zap, Shield } from 'lucide-react'
import styles from './Login.module.css'

const FEATURES = [
  {
    icon: Database,
    label: 'Persistent knowledge vault',
    desc: 'Every article, note, and video you save — always there, always searchable.',
  },
  {
    icon: Zap,
    label: 'AI-powered retrieval',
    desc: 'Ask questions in plain English. Get answers from your own saved content.',
  },
  {
    icon: Shield,
    label: 'Private by default',
    desc: 'Your vault is yours alone. End-to-end secure, zero tracking.',
  },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { setEmail(''); setPassword('') }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else navigate('/dashboard')
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  return (
    <div className={styles.container}>
      {/* ── LEFT PANEL ── */}
      <div className={styles.left}>
        <div className={styles.grain} />
        <div className={styles.dividerLine} />

        <div className={styles.leftInner}>
          {/* Logo */}
          <motion.div
            className={styles.logo}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.logoMark}>
              <Brain size={22} />
            </div>
            <div>
              <div className={styles.logoName}>NeuroVault</div>
              <div className={styles.logoTagline}>Your second brain, supercharged.</div>
            </div>
          </motion.div>

          {/* Hero */}
          <div className={styles.hero}>
            <motion.div
              className={styles.eyebrow}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className={styles.eyebrowDash} />
              <span className={styles.eyebrowText}>Welcome back</span>
            </motion.div>

            <motion.h1
              className={styles.headline}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              Pick up right<br />where you{' '}
              <em>left off.</em>
            </motion.h1>

            <motion.p
              className={styles.subtext}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              Your conversations, saved content, and workspace are exactly as you left them. Sign in and keep exploring.
            </motion.p>

            <motion.div
              className={styles.features}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.28 }}
            >
              {FEATURES.map(({ icon: Icon, label, desc }, i) => (
                <motion.div
                  key={label}
                  className={styles.featureItem}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className={styles.featureIconWrap}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <div className={styles.featureLabel}>{label}</div>
                    <div className={styles.featureDesc}>{desc}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <div className={styles.leftFooter}>
            <span>© 2025 NeuroVault</span>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className={styles.right}>
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.cardEyebrow}>
            <span className={styles.cardEyebrowDash} />
            <span className={styles.cardEyebrowText}>Welcome back</span>
          </div>

          <h2 className={styles.cardTitle}>Sign in</h2>
          <p className={styles.cardSubtitle}>Access your vault and keep building.</p>

          {/* Google */}
          <button className={styles.googleBtn} onClick={handleGoogleLogin} disabled={googleLoading}>
            <svg width="16" height="16" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H1.88v2.08A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.51 10.53A4.8 4.8 0 0 1 4.26 9c0-.53.09-1.04.25-1.53V5.39H1.88A8 8 0 0 0 .98 9c0 1.29.31 2.51.9 3.61l2.63-2.08z"/>
              <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.1 4.39l2.63 2.08c.63-1.89 2.39-3.29 4.47-3.29z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <div className={styles.divider}><span>or</span></div>

          {/* Form */}
          <form onSubmit={handleLogin} className={styles.form} autoComplete="off">
            <input type="text" style={{ display: 'none' }} />
            <input type="password" style={{ display: 'none' }} />

            <div className={styles.field}>
              <label>Email address</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><Mail size={15} /></span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Password</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><Lock size={15} /></span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p
                className={styles.error}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              className={styles.btn}
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
              {!loading && <ArrowRight size={16} className={styles.btnArrow} />}
            </motion.button>
          </form>

          <p className={styles.link}>
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}