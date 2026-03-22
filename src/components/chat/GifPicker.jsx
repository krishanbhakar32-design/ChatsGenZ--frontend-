/**
 * GifPicker.jsx
 * Fetches trending/search GIFs from backend → /api/giphy
 */
import { useState, useEffect } from 'react'
const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

export default function GifPicker({ onSelect, onClose }) {
  const [q,       setQ]       = useState('')
  const [gifs,    setGifs]    = useState([])
  const [trending,setTrending]= useState([])
  const [load,    setLoad]    = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('cgz_token')
    fetch(`${API}/api/giphy/trending?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setTrending(d.gifs || []))
      .catch(() => {})
  }, [])

  async function search(e) {
    e.preventDefault()
    if (!q.trim()) return
    setLoad(true)
    const token = localStorage.getItem('cgz_token')
    fetch(`${API}/api/giphy/search?q=${encodeURIComponent(q)}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setGifs(d.gifs || []))
      .catch(() => {})
      .finally(() => setLoad(false))
  }

  const display = gifs.length > 0 ? gifs : trending

  return (
    <div style={{
      position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
      background: '#fff', border: '1px solid #e4e6ea', borderRadius: 12,
      width: 320, maxHeight: 380, display: 'flex', flexDirection: 'column',
      boxShadow: '0 -4px 20px rgba(0,0,0,.12)', zIndex: 200,
    }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
        <form onSubmit={search} style={{ display: 'flex', gap: 6 }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search GIFs..."
            style={{ flex: 1, padding: '6px 10px', border: '1.5px solid #e4e6ea', borderRadius: 20, fontSize: '0.8rem', outline: 'none', fontFamily: 'Nunito,sans-serif', color: '#111827' }}
            onFocus={e => (e.target.style.borderColor = '#1a73e8')}
            onBlur={e => (e.target.style.borderColor = '#e4e6ea')}
          />
          <button type="submit" style={{ padding: '6px 12px', borderRadius: 20, border: 'none', background: '#1a73e8', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Go</button>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: '0 4px' }}>
            <i className="fi fi-sr-cross-small" />
          </button>
        </form>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 8 }}>
        {load && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20 }}>
            <div style={{ width: 22, height: 22, border: '2px solid #e4e6ea', borderTop: '2px solid #1a73e8', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} />
          </div>
        )}
        {!load && display.map(g => (
          <img
            key={g.id}
            src={g.preview || g.url}
            alt={g.title}
            onClick={() => onSelect(g.url || g.original)}
            style={{ width: '100%', borderRadius: 7, cursor: 'pointer', aspectRatio: '1', objectFit: 'cover', transition: 'transform .12s' }}
            onMouseEnter={e => (e.target.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.target.style.transform = 'scale(1)')}
          />
        ))}
        {!load && display.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: '0.8rem' }}>No GIFs found</div>
        )}
      </div>
      <div style={{ padding: '4px 8px', fontSize: '0.6rem', color: '#9ca3af', textAlign: 'right', flexShrink: 0 }}>Powered by GIPHY</div>
    </div>
  )
}
