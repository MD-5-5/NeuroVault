import { Routes, Route, Navigate } from 'react-router-dom'
import KnowledgeGraph from './pages/KnowledgeGraph/KnowledgeGraph'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import AuthCallback from './pages/AuthCallback/AuthCallback'
import Dashboard from './pages/Dashboard/Dashboard'
import Vault from './pages/Vault/Vault'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading...</div>
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/vault" element={
        <ProtectedRoute><Vault /></ProtectedRoute>
      } />
      <Route path="/graph" element={
      <ProtectedRoute><KnowledgeGraph /></ProtectedRoute>
      } />
    </Routes>
  )
}