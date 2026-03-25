import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('cgz_token')
    if (!token) { setLoading(false); return }
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const d = await res.json()
        if (d.user) {
          setUser({ ...d.user, token })
          // Extend session — keep token fresh
          return
        }
      }
      // Token invalid — clear it
      localStorage.removeItem('cgz_token')
      setUser(null)
    } catch {
      // Network error — keep token, try next time
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMe()

    // Auto-refresh user data every 5 minutes (keeps session alive)
    const interval = setInterval(fetchMe, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchMe])

  // Auto-login: when user visits site with existing token, redirect to /chat
  // This is handled by individual pages checking auth state

  function logout() {
    const token = localStorage.getItem('cgz_token')
    if (token) {
      fetch(`${API}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {})
    }
    localStorage.removeItem('cgz_token')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
