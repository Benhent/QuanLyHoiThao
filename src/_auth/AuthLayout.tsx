import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/sign-in')
    }
  }, [isAuthenticated, loading, navigate])

  if (loading) {
    return <div>Loading...</div>
  }

  return isAuthenticated ? <>{children}</> : null
}