import { createBrowserRouter, RouterProvider, Navigate, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import KnowledgeGraph from './pages/KnowledgeGraph/KnowledgeGraph'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login/Login'
import Signup from './pages/SignUp/Signup'
import AuthCallback from './pages/AuthCallback/AuthCallback'
import Dashboard from './pages/Dashboard/Dashboard'
import Vault from './pages/Vault/Vault'
import Landing from './pages/Landing/Landing'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Loading...</div>
  return user ? children : <Navigate to="/home" replace />
}

function SmartRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Loading...</div>
  return <Navigate to={user ? '/dashboard' : '/home'} replace />
}

function ErrorFallback() {
  const error = useRouteError()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <h2>Oops! Something went wrong.</h2>
      <p style={{ color: 'var(--text-muted)' }}>{isRouteErrorResponse(error) ? 'This page could not be found.' : error?.message || 'Unknown error occurred.'}</p>
      <a href="/dashboard" style={{ marginTop: '1rem', color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}>Return to Dashboard</a>
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/',              element: <SmartRedirect />,                                              errorElement: <ErrorFallback /> },
  { path: '/home',          element: <Landing /> },
  { path: '/login',         element: <Login /> },
  { path: '/signup',        element: <Signup /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  { path: '/dashboard',     element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  { path: '/vault',         element: <ProtectedRoute><Vault /></ProtectedRoute> },
  { path: '/graph',         element: <ProtectedRoute><KnowledgeGraph /></ProtectedRoute> },
  { path: '*',              element: <SmartRedirect /> },
])

export default function App() {
  return <RouterProvider router={router} />
}