import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Brain, Search, Globe, Sparkles, Zap, ArrowDown, BookOpen, Database, ArrowRight, LogIn } from 'lucide-react'
import styles from './Landing.module.css'

const flowSteps = [
  { id: 1, icon: Search,   label: 'Your Query',          sub: 'Ask anything naturally',        color: '#818cf8', glow: 'rgba(129,140,248,0.35)' },
  { id: 2, icon: Database, label: 'NeuroVault Memory',   sub: 'Scans your personal vault',     color: '#a78bfa', glow: 'rgba(167,139,250,0.35)' },
  { id: 3, icon: Globe,    label: 'IntelliSeek Web',     sub: 'Searches the live internet',    color: '#60a5fa', glow: 'rgba(96,165,250,0.35)'  },
  { id: 4, icon: Sparkles, label: 'Combined AI Output',  sub: 'Unified intelligent answer',    color: '#34d399', glow: 'rgba(52,211,153,0.35)'  },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

const stepVariants = {
  hidden: { opacity: 0, x: 24, scale: 0.93 },
  show: (i) => ({
    opacity: 1, x: 0, scale: 1,
    transition: { delay: 0.3 + i * 0.14, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
}

const arrowVariants = {
  hidden: { opacity: 0, scaleY: 0 },
  show: (i) => ({
    opacity: 1, scaleY: 1,
    transition: { delay: 0.38 + i * 0.14, duration: 0.3 },
  }),
}

export default function Landing() {
  return (
    <div className={styles.page}>
      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <div className={styles.navLogoIcon}><Brain size={18} /></div>
          <span className={styles.navLogoText}>NeuroVault</span>
        </div>
        <div className={styles.navActions}>
          <Link to="/login" className={styles.navSignIn}>
            <LogIn size={14} /> Sign In
          </Link>
          <Link to="/signup" className={styles.navGetStarted}>
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <motion.main
        className={styles.hero}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* background decorations */}
        <div className={styles.gridBg} aria-hidden="true" />
        <div className={styles.orb1}   aria-hidden="true" />
        <div className={styles.orb2}   aria-hidden="true" />

        <div className={styles.inner}>
          {/* ── LEFT ── */}
          <div className={styles.left}>
            <motion.div variants={fadeUp} className={styles.badge}>
              <Zap size={11} />
              <span>NeuroVault × IntelliSeek</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className={styles.heading}>
              Your Second Brain,<br />
              <span className={styles.gradient}>Supercharged</span>
            </motion.h1>

            <motion.p variants={fadeUp} className={styles.sub}>
              NeuroVault is your <strong>personal AI memory layer</strong> — save articles, videos,
              notes, and images, then let AI index and connect knowledge across everything you've ever saved.
            </motion.p>

            <motion.p variants={fadeUp} className={styles.support}>
              Pair it with{' '}
              <a
                href="https://intelliseek.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className={styles.intelliLink}
              >
                IntelliSeek
              </a>{' '}
              and every search gets enhanced with your vault — personal context meets live web intelligence
              for answers that are truly yours.
            </motion.p>

            <motion.div variants={fadeUp} className={styles.pills}>
              {[
                [Brain,    'Personal Memory'],
                [Search,   'Semantic Search'],
                [BookOpen, 'AI Summaries'],
                [Globe,    'Web Augmented'],
              ].map(([Icon, label]) => (
                <div key={label} className={styles.pill}>
                  <Icon size={13} /><span>{label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className={styles.ctas}>
              <Link to="/signup" className={styles.ctaPrimary}>
                Get Started Free <ArrowRight size={15} />
              </Link>
              <Link to="/login" className={styles.ctaSecondary}>
                <LogIn size={14} /> Sign In
              </Link>
            </motion.div>
          </div>

          {/* ── RIGHT — Flow diagram ── */}
          <motion.div className={styles.right} variants={fadeUp}>
            <p className={styles.flowLabel}>HOW IT WORKS</p>
            <div className={styles.flow}>
              {flowSteps.map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={step.id} className={styles.flowItem}>
                    <motion.div
                      className={styles.step}
                      custom={i}
                      variants={stepVariants}
                      style={{ '--step-color': step.color, '--step-glow': step.glow }}
                      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                    >
                      <span className={styles.stepIcon}><Icon size={18} /></span>
                      <div className={styles.stepText}>
                        <span className={styles.stepLabel}>{step.label}</span>
                        <span className={styles.stepSub}>{step.sub}</span>
                      </div>
                      <span className={styles.stepNum}>{String(i + 1).padStart(2, '0')}</span>
                    </motion.div>
                    {i < flowSteps.length - 1 && (
                      <motion.div className={styles.arrow} custom={i} variants={arrowVariants}>
                        <ArrowDown size={15} />
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  )
}
