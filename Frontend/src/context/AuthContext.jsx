import { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function initializeSession() {
      // 1. Sync tokens if passing through URL (extension logic)
      const urlParams = new URLSearchParams(window.location.search)
      const accessToken = urlParams.get('access_token')
      const refreshToken = urlParams.get('refresh_token')

      if (accessToken && refreshToken) {
        // Sanitize URL immediately
        window.history.replaceState({}, document.title, window.location.pathname)
        
        try {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
        } catch (error) {
          console.error("Auth Sync Error:", error)
        }
      }

      // 2. Hydrate session state from Supabase natively
      const { data: { session } } = await supabase.auth.getSession()
      
      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    }

    initializeSession()

    // 3. Listen for future auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = { user, loading, signOut }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
