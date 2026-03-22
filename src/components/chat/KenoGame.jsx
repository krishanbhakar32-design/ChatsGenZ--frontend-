/**
 * KenoGame.jsx
 * Socket events: emit playKeno → receive kenoResult
 */
import { useState, useEffect } from 'react'

const MAX_PICKS = 10

export default function KenoGame({ socket, onClose }) {
  const [picks,   setPicks]   = useState(new Set())
  const [bet,     setBet]     = useState(10)
  const [result,  setResult]  = useState(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!socket) return
    const fn = r => { setResult(r); setPlaying(false) }
    socket.on('kenoResult', fn)
    return () => socket.off('kenoResult', fn)
  }, [socket])

  function toggle(n) {
    if (playing) return
    setPicks(p => {
      const s = new Set(p)
      s.has(n) ? s.delete(n) : s.size < MAX_PICKS && s.add(n)
      return s
    })
  }

  function play() {
    if (picks.size === 0 || playing) return
    setPlaying(true)
    setResult(null)
    socket?.emit('playKeno', { picks: Array.from(picks), bet })
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#111827', borderRadius: 18, maxWidth: 460, width: '100%', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #374151' }}>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1rem', color: '#fff' }}>🎯 Keno — Pick up to 10 numbers</span>
          <button onClick={onClose} style={{ background: '#374151', border: 'none', color: '#9ca3af', width: 28, height: 28, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
            <i className="fi fi-sr-cross-small" />
          </button>
        </div>

        <div style={{ padding: 14 }}>
          {/* Grid 1-80 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 4, marginBottom: 12 }}>
            {Array.from({ length: 80 }, (_, i) => i + 1).map(n => {
              const isPicked = picks.has(n)
              const isHit = result?.drawn?.includes(n)
              const isPickedHit = isPicked && isHit
              return (
                <button
                  key={n}
                  onClick={() => toggle(n)}
                  style={{
                    padding: '5px 2px',
                    borderRadius: 5,
                    border: `1.5px solid ${isPicked ? '#f59e0b' : result && isHit ? '#22c55e' : '#374151'}`,
                    background: isPickedHit ? '#22c55e' : isPicked ? '#f59e0b22' : result && isHit ? '#22c55e22' : '#1f2937',
                    color: isPickedHit ? '#fff' : isPicked ? '#f59e0b' : result && isHit ? '#22c55e' : '#9ca3af',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all .12s',
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>

          {/* Bet */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Bet:</span>
            {[5, 10, 25, 50, 100].map(b => (
              <button key={b} onClick={() => setBet(b)} style={{ padding: '4px 10px', borderRadius: 6, border: `1.5px solid ${bet === b ? '#f59e0b' : '#374151'}`, background: bet === b ? '#f59e0b22' : '#1f2937', color: bet === b ? '#f59e0b' : '#9ca3af', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                {b}
              </button>
            ))}
            <span style={{ color: '#6b7280', fontSize: '0.7rem', marginLeft: 'auto' }}>Picked: {picks.size}/{MAX_PICKS}</span>
          </div>

          {/* Result */}
          {result && (
            <div style={{ background: result.won ? '#064e3b' : '#450a0a', border: `1px solid ${result.won ? '#22c55e' : '#ef4444'}`, borderRadius: 9, padding: '10px 14px', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: result.won ? '#22c55e' : '#ef4444' }}>
                {result.won ? `🎉 ${result.hits} hits! Won ${result.payout} Gold!` : `${result.hits} hits. Lost ${result.bet} Gold.`}
              </div>
            </div>
          )}

          <button
            onClick={play}
            disabled={picks.size === 0 || playing}
            style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: picks.size > 0 && !playing ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#374151', color: picks.size > 0 && !playing ? '#fff' : '#6b7280', fontWeight: 800, cursor: picks.size > 0 && !playing ? 'pointer' : 'not-allowed', fontSize: '0.9rem', fontFamily: 'Outfit,sans-serif', transition: 'all .15s' }}
          >
            {playing ? 'Drawing...' : picks.size === 0 ? 'Select numbers to play' : `Play Keno — Bet ${bet} Gold`}
          </button>
        </div>
      </div>
    </div>
  )
}
