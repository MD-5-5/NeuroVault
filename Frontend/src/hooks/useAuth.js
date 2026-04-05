import { useAuthContext } from '../context/AuthContext'

export function useAuth() {
  const { user, loading, signOut } = useAuthContext()
  return { user, loading, signOut }
}