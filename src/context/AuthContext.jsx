import { createContext, useContext, useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('cgz_token')
    if (!token) { setLoading(false); return }

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.user) setUser({ ...d.user, token })
        else { localStorage.removeItem('cgz_token') }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
