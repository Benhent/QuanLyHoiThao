import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Define the authentication context type
type AuthContextType = {
  isAuthenticated: boolean
  token: string | null
  login: (token: string) => void
  logout: () => void
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null)

// Create the auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'))
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token)
  const navigate = useNavigate()

  // Handle login
  const login = (newToken: string) => {
    localStorage.setItem('auth_token', newToken)
    setToken(newToken)
    setIsAuthenticated(true)
    navigate('/dashboard') // Redirect to dashboard after login
  }

  // Handle logout
  const logout = () => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setIsAuthenticated(false)
    navigate('/sign-in')
  }

  // Check token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (!storedToken) {
      navigate('/sign-in')
    }
  }, [navigate])

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}