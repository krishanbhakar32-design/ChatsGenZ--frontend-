import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function Kicked() {
  const nav      = useNavigate()
  const location = useLocation()
  const reason   = location.state?.reason || 'You were kicked from the room.'
  const isBan    = location.state?.isBan  || false
  const kickMins = location.state?.kickDurationMinutes || 0

  // Countdown in seconds
  const [secsLeft, setSecsLeft] = useState(kickMins * 60)

  useEffect(() => {
    if (!kickMins || isBan) return
    if (secsLeft <= 0) return
    const t = setInterval(() => {
      setSecsLeft(p => {
        if (p <= 1) { clearInterval(t); return 0 }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [kickMins, isBan])

  const canReturn = !isBan && secsLeft <= 0
  const mins = Math.floor(secsLeft / 60)
  const secs = secsLeft % 60
  const countdownStr = secsLeft > 0
    ? (mins > 0 ? `${mins}m ${secs.toString().padStart(2,'0')}s` : `${secs}s`)
    : ''

  return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:18, padding:'36px 32px', maxWidth:420, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,.1)' }}>
        <div style={{ width:76, height:76, background: isBan?'#fee2e2':'#fef3c7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', fontSize:34 }}>
          {isBan ? '🚫' : '👢'}
        </div>

        <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'#111827', fontSize:'1.25rem', marginBottom:8 }}>
          {isBan ? 'You Have Been Banned' : 'You Were Kicked'}
        </h2>

        <p style={{ color:'#6b7280', fontSize:'0.875rem', lineHeight:1.6, marginBottom:16 }}>
          {reason}
        </p>

        {/* Countdown */}
        {!isBan && kickMins > 0 && (
          <div style={{ marginBottom:20 }}>
            {secsLeft > 0 ? (
              <div style={{ background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:12, padding:'14px 20px' }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#92400e', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>
                  You can return in
                </div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'2rem', color:'#d97706', letterSpacing:2 }}>
                  {countdownStr}
                </div>
                <div style={{ fontSize:'0.7rem', color:'#a16207', marginTop:4 }}>
                  Please wait until the timer expires
                </div>
              </div>
            ) : (
              <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:12, padding:'12px 20px', color:'#15803d', fontWeight:700 }}>
                ✅ Your time is up — you may return to the lobby!
              </div>
            )}
          </div>
        )}

        {isBan && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, padding:'10px 14px', fontSize:'0.8rem', color:'#dc2626', marginBottom:16, lineHeight:1.5 }}>
            If you believe this is a mistake, please{' '}
            <a href="/contact" style={{ color:'#1a73e8', fontWeight:700 }}>contact support</a>.
          </div>
        )}

        {!isBan && (
          <button
            onClick={() => { if (canReturn) nav('/chat') }}
            disabled={!canReturn}
            style={{ padding:'11px 28px', borderRadius:10, border:'none',
              background: canReturn ? 'linear-gradient(135deg,#1a73e8,#1464cc)' : '#e5e7eb',
              color: canReturn ? '#fff' : '#9ca3af',
              fontWeight:800, cursor: canReturn ? 'pointer' : 'not-allowed',
              fontFamily:'Outfit,sans-serif', fontSize:'0.875rem', transition:'all .2s' }}>
            {canReturn ? '← Back to Lobby' : `Wait ${countdownStr}`}
          </button>
        )}

        {isBan && (
          <button onClick={() => nav('/')}
            style={{ padding:'11px 28px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6b7280,#4b5563)', color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:'Outfit,sans-serif', fontSize:'0.875rem' }}>
            ← Go to Homepage
          </button>
        )}
      </div>
    </div>
  )
}
