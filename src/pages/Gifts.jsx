import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../siteConfig.js'

const API = API_URL

function Avatar({ src, username, size = 40 }) {
  const [err, setErr] = useState(false)
  return (
    <img src={err ? '/default_images/avatar/default_avatar.png' : (src || '/default_images/avatar/default_avatar.png')}
      alt={username} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  )
}

function GiftIcon({ icon, size = 44 }) {
  const [err, setErr] = useState(false)
  if (!err) return (
    <img src={`/gifts/${icon}`} alt="" onError={() => setErr(true)}
      style={{ width: size, height: size, objectFit: 'contain' }} />
  )
  return <span style={{ fontSize: size * 0.6 }}>🎁</span>
}

// Floating gift animation
function FloatingGift({ gift, onDone }) {
  return (
    <div style={{
      position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, textAlign: 'center', pointerEvents: 'none',
      animation: 'giftFloat 2.5s ease-out forwards'
    }}>
      <div style={{ fontSize: 64 }}><GiftIcon icon={gift.icon} size={80} /></div>
      <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.1rem', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,.5)', marginTop: 8 }}>
        🎁 {gift.name} Sent!
      </div>
    </div>
  )
}

// User search modal for selecting gift recipient
function UserSearchModal({ onSelect, onClose }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)
  const token = localStorage.getItem('cgz_token')

  useEffect(() => {
    clearTimeout(timer.current)
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    timer.current = setTimeout(() => {
      fetch(`${API}/api/users/search?q=${encodeURIComponent(q)}&limit=8`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(d => setResults(d.users || [])).catch(() => setResults([])).finally(() => setLoading(false))
    }, 350)
    return () => clearTimeout(timer.current)
  }, [q])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
      onClick={onClose}>
      <div style={{ background: '#1e293b', borderRadius: 16, width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, color: '#f1f5f9', fontSize: '1rem' }}>👤 Send Gift To...</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: 12 }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search username..."
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#7c3aed'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {loading && <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: '0.85rem' }}>Searching...</div>}
          {!loading && q && results.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: '0.85rem' }}>No users found</div>}
          {results.map(u => (
            <div key={u._id} onClick={() => onSelect(u)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', transition: 'background .12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Avatar src={u.avatar} username={u.username} size={36} />
              <div>
                <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.88rem' }}>{u.username}</div>
                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{u.rank}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Send Gift confirmation modal
function SendModal({ gift, recipient, myGold, onClose, onSuccess }) {
  const [loading, setSending] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const token = localStorage.getItem('cgz_token')

  async function send() {
    if (!token) { setError('Please login first'); return }
    setSending(true); setError('')
    try {
      const r = await fetch(`${API}/api/gifts/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: recipient._id, giftId: gift._id, message: msg })
      })
      const d = await r.json()
      if (r.ok) { onSuccess(d); onClose() }
      else setError(d.error || 'Failed to send gift')
    } catch { setError('Network error') }
    setSending(false)
  }

  const canAfford = myGold >= gift.price

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
      onClick={onClose}>
      <div style={{ background: '#1e293b', borderRadius: 18, width: '100%', maxWidth: 360, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ background: 'linear-gradient(135deg,#7c3aed22,#ec489922)', padding: '18px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <GiftIcon icon={gift.icon} size={64} />
          <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, color: '#fff', fontSize: '1.1rem', marginTop: 8 }}>{gift.name}</div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 2 }}>{gift.description}</div>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Recipient */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px' }}>
            <Avatar src={recipient.avatar} username={recipient.username} size={32} />
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Sending to</div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.88rem' }}>{recipient.username}</div>
            </div>
          </div>
          {/* Cost */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 14px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Cost</span>
            <span style={{ color: '#eab308', fontWeight: 800, fontFamily: 'Outfit,sans-serif' }}>💰 {gift.price} Gold</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 14px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Your Balance</span>
            <span style={{ color: canAfford ? '#22c55e' : '#ef4444', fontWeight: 800, fontFamily: 'Outfit,sans-serif' }}>💰 {myGold} Gold</span>
          </div>
          {/* Message */}
          <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Add a message... (optional)" rows={2}
            style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', fontSize: '0.85rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#7c3aed'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          {error && <div style={{ background: '#ef444422', border: '1px solid #ef4444', borderRadius: 8, padding: '8px 12px', color: '#ef4444', fontSize: '0.82rem' }}>{error}</div>}
          {!canAfford && <div style={{ background: '#ef444422', border: '1px solid #ef4444', borderRadius: 8, padding: '8px 12px', color: '#ef4444', fontSize: '0.82rem' }}>Not enough gold! You need {gift.price - myGold} more.</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' }}>Cancel</button>
            <button onClick={send} disabled={loading || !canAfford}
              style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: canAfford ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : '#374151', color: canAfford ? '#fff' : '#6b7280', cursor: canAfford ? 'pointer' : 'not-allowed', fontWeight: 800, fontSize: '0.9rem', fontFamily: 'Outfit,sans-serif' }}>
              {loading ? 'Sending...' : '🎁 Send Gift'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Gifts() {
  const nav = useNavigate()
  const [gifts, setGifts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [myGold, setMyGold] = useState(0)
  const [myRuby, setMyRuby] = useState(0)
  const [selectedGift, setSelectedGift] = useState(null)
  const [recipient, setRecipient] = useState(null)
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [pendingGift, setPendingGift] = useState(null)
  const [floatGift, setFloatGift] = useState(null)
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('shop') // shop | history
  const token = localStorage.getItem('cgz_token')

  useEffect(() => {
    loadGifts()
    if (token) loadMe()
    if (token) loadHistory()
  }, [])

  async function loadGifts() {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/gifts`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const d = await r.json()
      setGifts(d.gifts || [])
      const cats = ['all', ...new Set((d.gifts || []).map(g => g.category).filter(Boolean))]
      setCategories(cats)
    } catch { }
    setLoading(false)
  }

  async function loadMe() {
    try {
      const r = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      if (d.user) { setMyGold(d.user.gold || 0); setMyRuby(d.user.ruby || 0) }
    } catch { }
  }

  async function loadHistory() {
    try {
      const r = await fetch(`${API}/api/gifts/history?limit=20`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      setHistory(d.transactions || [])
    } catch { }
  }

  function onGiftClick(gift) {
    if (!token) { nav('/login'); return }
    setPendingGift(gift)
    setShowUserSearch(true)
  }

  function onUserSelected(user) {
    setRecipient(user)
    setSelectedGift(pendingGift)
    setShowUserSearch(false)
  }

  function onGiftSent(data) {
    setMyGold(data.newGold || myGold)
    setFloatGift(selectedGift)
    setTimeout(() => setFloatGift(null), 2500)
    loadHistory()
  }

  const filtered = activeCategory === 'all' ? gifts : gifts.filter(g => g.category === activeCategory)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1a0533 50%,#0f172a 100%)', fontFamily: 'Nunito,sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/chat" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.15rem', color: '#fff' }}>🎁 Gift Shop</div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Send gifts to your friends!</div>
        </div>
        {/* Gold & Ruby balance */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <div style={{ background: '#eab30822', border: '1px solid #eab30844', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14 }}>💰</span>
            <span style={{ color: '#eab308', fontWeight: 800, fontSize: '0.82rem', fontFamily: 'Outfit,sans-serif' }}>{myGold}</span>
          </div>
          {myRuby > 0 && (
            <div style={{ background: '#ef444422', border: '1px solid #ef444444', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 14 }}>💎</span>
              <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.82rem', fontFamily: 'Outfit,sans-serif' }}>{myRuby}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab switch */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        {[{ k: 'shop', l: '🛍️ Shop' }, { k: 'history', l: '📜 History' }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', fontFamily: 'Outfit,sans-serif', color: tab === t.k ? '#ec4899' : '#64748b', borderBottom: `2px solid ${tab === t.k ? '#ec4899' : 'transparent'}`, transition: 'all .15s' }}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 12px' }}>

        {tab === 'shop' && (
          <>
            {/* Category filter */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '6px 14px', borderRadius: 99, border: `1.5px solid ${activeCategory === cat ? '#ec4899' : 'rgba(255,255,255,0.12)'}`,
                    background: activeCategory === cat ? '#ec489922' : 'transparent',
                    color: activeCategory === cat ? '#ec4899' : '#94a3b8',
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap',
                    textTransform: 'capitalize', transition: 'all .15s'
                  }}>
                  {cat === 'all' ? '✨ All' : cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #ec4899', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading gifts...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
                <p style={{ color: '#64748b' }}>No gifts in this category</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {filtered.map(gift => (
                  <div key={gift._id} onClick={() => onGiftClick(gift)}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 14, padding: '14px 10px', textAlign: 'center', cursor: 'pointer',
                      transition: 'all .18s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.borderColor = '#ec489966'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none' }}>
                    <GiftIcon icon={gift.icon} size={48} />
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'Outfit,sans-serif' }}>{gift.name}</div>
                    {gift.description && <div style={{ color: '#64748b', fontSize: '0.65rem', lineHeight: 1.3 }}>{gift.description}</div>}
                    <div style={{ marginTop: 2 }}>
                      {gift.currency === 'ruby' ? (
                        <span style={{ background: '#ef444422', border: '1px solid #ef444444', borderRadius: 99, padding: '3px 10px', color: '#ef4444', fontSize: '0.75rem', fontWeight: 800 }}>💎 {gift.price}</span>
                      ) : (
                        <span style={{ background: '#eab30822', border: '1px solid #eab30844', borderRadius: 99, padding: '3px 10px', color: '#eab308', fontSize: '0.75rem', fontWeight: 800 }}>💰 {gift.price}</span>
                      )}
                    </div>
                    {gift.isPremiumOnly && <span style={{ fontSize: '0.6rem', color: '#a855f7', fontWeight: 700 }}>⭐ Premium Only</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <p style={{ color: '#64748b' }}>No gift history yet</p>
              </div>
            ) : history.map((tx, i) => (
              <div key={tx._id || i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flexShrink: 0 }}><GiftIcon icon={tx.gift?.icon || 'gift.svg'} size={40} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Outfit,sans-serif' }}>{tx.gift?.name || 'Gift'}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: 2 }}>
                    {tx.from?.username === tx.myUsername ? `Sent to ${tx.to?.username}` : `From ${tx.from?.username}`}
                  </div>
                  {tx.message && <div style={{ color: '#64748b', fontSize: '0.68rem', fontStyle: 'italic', marginTop: 2 }}>"{tx.message}"</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: '#eab308', fontWeight: 800, fontSize: '0.82rem', fontFamily: 'Outfit,sans-serif' }}>💰 {tx.price}</div>
                  <div style={{ color: '#475569', fontSize: '0.65rem', marginTop: 2 }}>{new Date(tx.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showUserSearch && <UserSearchModal onSelect={onUserSelected} onClose={() => setShowUserSearch(false)} />}
      {selectedGift && recipient && (
        <SendModal gift={selectedGift} recipient={recipient} myGold={myGold}
          onClose={() => { setSelectedGift(null); setRecipient(null) }}
          onSuccess={onGiftSent} />
      )}
      {floatGift && <FloatingGift gift={floatGift} onDone={() => setFloatGift(null)} />}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes giftFloat{0%{opacity:0;transform:translateX(-50%) scale(0.5) translateY(20px)}20%{opacity:1;transform:translateX(-50%) scale(1.1) translateY(0)}80%{opacity:1;transform:translateX(-50%) scale(1) translateY(-10px)}100%{opacity:0;transform:translateX(-50%) scale(0.9) translateY(-30px)}}
      `}</style>
    </div>
  )
}
