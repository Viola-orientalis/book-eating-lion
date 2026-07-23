import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isAdminUser } from '../utils/adminAccess'

export default function RequireAdmin({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <p className="text-sm">확인 중...</p>
  if (!isAdminUser(user)) return <Navigate to="/" replace />

  return children
}
