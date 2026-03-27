import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import styles from './Signup.module.css'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) setError(error.message)
    else {
      setSuccess('Account created! Check your email to confirm.')
      setTimeout(() => navigate('/login'), 3000)
    }
    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.glow} />
      <div className={styles.card}>
        <div className={styles.logo}>🧠</div>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Start building your second brain</p>

        <form onSubmit={handleSignup} className={styles.form}>
          <div className={styles.field}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.link}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}