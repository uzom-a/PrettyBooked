import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Sends signed-out visitors to log in, and the wrong kind of account home.
export default function RequireAuth({ role, children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <p className="text-center text-gray-500 py-20">Loading…</p>
  if (!user) return <Navigate to="/login" replace />
  if (role && profile?.role !== role) return <Navigate to="/" replace />
  return children
}
