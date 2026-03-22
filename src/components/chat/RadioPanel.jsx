/**
 * RadioPanel.jsx
 * Fetches stations from /api/radio and plays them in an <audio> tag.
 * Categories: Hollywood, Bollywood, Punjabi, South, Bengali, More.
 */
import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

const CATS = [
  { id: 'Hollywood', label: '🎬 Hollywood', langs: ['English'] },
  { id: 'Bollywood', label: '🎭 Bollywood', langs: ['Hindi'] },
  { id: 'Punjabi',   label: '🥁 Punjabi',   langs: ['Punjabi'] },
  { id: 'South',     label: '🎶 South',     langs: ['Tamil', 'Telugu', 'Kannada', 'Malayalam'] },
  { id: 'Bengali',   label: '🎵 Bengali',   langs: ['Bengali'] },
  { id: 'More',      label: '🌐 More',      langs: ['Marathi', 'Hindi/Sanskrit', 'Instrumental'] },
]

export default function RadioPanel({ onClose }) {
  const [all,     setAll]    = useState([])
  const [cat,     setCat]    = useState(null)
  const [cur,     setCur]    = useState(null)
  const [playing, setPlay]   = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/api/radio`)
      .then(r => r.json())
      .then(d => setAll(d.stations || []))
      .catch(() => {})
    return () => {
      try { audioRef.current?.pause() } catch {}
    }
  }, [])

  function play(s) {
    if (cur?.id === s.id && playing) {
      try { audioRef.current?.pause() } catch {}
      setPlay(false)
      return
    }
    setCur(s)
    if (audioRef.current) {
      audioRef.current.src = s.streamUrl
      audioRef.current.load()
      audioRef.current.play().then(() => setPlay(true)).catch(() => setPlay(false))
    }
  }

  const catStations = cat ? all.filter(s => CATS.find(c => c.id === cat)?.langs.includes(s.language)) : []

  return (
    <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e4e6ea', borderRadius: '10px 10px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,.12)', maxHeight: '52vh', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {cat && (
            <button onClick={() => setCat(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a73e8', fontSize: 13, padding: '0 4px 0 0' }}>
              <i className="fi fi-sr-arrow-left" />
            </button>
          )}
          <i className="fi fi-sr-radio" style={{ color: '#1a73e8', fontSize: 15 }} />
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '0.9rem', color: '#111827' }}>
            {playing && cur ? `🎵 ${cur.name}` : cat ? CATS.find(c => c.id === cat)?.label : 'Radio'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {playing && (
            <button
              onClick={() => { try { audioRef.current?.pause() } catch {} setPlay(false) }}
              style={{ background: '#fee2e2', border: 'none', color: '#dc2626', padding: '3px 10px', borderRadius: 20, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
            >
              ⏸ Stop
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>
            <i className="fi fi-sr-cross-small" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {!cat ? (
          /* Category grid */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, padding: '4px' }}>
            {CATS.map(c => {
              const cnt = all.filter(s => c.langs.includes(s.language)).length
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  style={{ padding: '12px 8px', background: '#f9fafb', border: '1.5px solid #e4e6ea', borderRadius: 9, cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e8f0fe'; e.currentTarget.style.borderColor = '#1a73e8' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e4e6ea' }}
                >
                  <div style={{ fontSize: '1.1rem', marginBottom: 3 }}>{c.label.split(' ')[0]}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>{c.label.split(' ').slice(1).join(' ')}</div>
                  <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{cnt} stations</div>
                </button>
              )
            })}
          </div>
        ) : catStations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '0.8rem' }}>No stations found</div>
        ) : (
          catStations.map(s => (
            <button
              key={s.id}
              onClick={() => play(s)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 9px', background: cur?.id === s.id ? '#e8f0fe' : 'none', border: `1px solid ${cur?.id === s.id ? '#1a73e8' : 'transparent'}`, borderRadius: 7, cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}
            >
              <div style={{ width: 30, height: 30, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>
                {cur?.id === s.id && playing ? '🎵' : s.flag || '📻'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                <div style={{ fontSize: '0.69rem', color: '#9ca3af' }}>{s.genre}</div>
              </div>
              {cur?.id === s.id && playing && (
                <span style={{ fontSize: '0.65rem', color: '#1a73e8', fontWeight: 700, flexShrink: 0 }}>▶ LIVE</span>
              )}
            </button>
          ))
        )}
      </div>

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
}
