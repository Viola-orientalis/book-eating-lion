import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ children }) {
  const { isLoggedIn, loading } = useAuth()

  if (loading) return <p className="text-sm">확인 중...</p>
  if (!isLoggedIn) return <Navigate to="/login" replace />

  return children
}
