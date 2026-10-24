import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="text-center text-gray-500 py-20">Loading…</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}
