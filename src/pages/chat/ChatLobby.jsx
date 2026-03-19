import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ── CHAT HEADER ───────────────────────────────────────────────
function ChatHeader({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  const rankInfo  = user?.rankInfo || {}
  const rankColor = rankInfo.color || '#aaaaaa'
  const rankLabel = rankInfo.label || user?.rank || 'Guest'
  const isStaff   = ['moderator','admin','superadmin','owner'].includes(user?.rank)

  return (
    <header style={{
      position:'sticky', top:0, zIndex:900,
      background:'#0f1923', borderBottom:'1px solid #1e2d3d',
      boxShadow:'0 2px 12px rgba(0,0,0,.4)',
      height:54, display:'flex', alignItems:'center', padding:'0 16px', gap:12,
    }}>
      {/* Logo */}
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
        <img src="/favicon/favicon-192.png" alt="ChatsGenZ"
          style={{ width:30, height:30, borderRadius:7 }}
          onError={e => e.target.style.display='none'}
        />
        <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:'#fff' }}>
          Chats<span style={{ color:'#1a73e8' }}>GenZ</span>
        </span>
      </Link>

      <div style={{ flex:1 }} />

      {/* Avatar dropdown */}
      <div ref={ref} style={{ position:'relative' }}>
        <button onClick={() => setOpen(o => !o)} style={{
          background:'none', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', gap:9, padding:'4px 8px', borderRadius:9,
          transition:'background .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.08)'}
          onMouseLeave={e => e.currentTarget.style.background='none'}
        >
          {/* Avatar with rank border */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <img
              src={user?.avatar || '/default_images/avatar/default_guest.png'}
              alt={user?.username || 'User'}
              style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:`2.5px solid ${rankColor}` }}
              onError={e => { e.target.src='/default_images/avatar/default_guest.png' }}
            />
            <span style={{ position:'absolute', bottom:0, right:0, width:9, height:9, background:'#22c55e', borderRadius:'50%', border:'2px solid #0f1923' }} />
          </div>
          {/* Name + rank */}
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:'0.83rem', fontWeight:700, color:'#fff', maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.2 }}>
              {user?.username || 'Guest'}
            </div>
            <div style={{ fontSize:'0.68rem', color:rankColor, fontWeight:700, lineHeight:1 }}>
              {rankLabel}
            </div>
          </div>
          <i className={`fi fi-sr-angle-${open?'up':'down'}`} style={{ fontSize:10, color:'rgba(255,255,255,.4)' }} />
        </button>

        {/* Dropdown */}
        {open && (
          <div style={{
            position:'absolute', right:0, top:'calc(100% + 6px)',
            background:'#1a2535', border:'1px solid #2a3a4d',
            borderRadius:13, padding:6, minWidth:190,
            boxShadow:'0 8px 32px rgba(0,0,0,.5)', zIndex:999,
          }}>
            {/* User card at top */}
            <div style={{ padding:'10px 12px', borderBottom:'1px solid #2a3a4d', marginBottom:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:8 }}>
                <img
                  src={user?.avatar || '/default_images/avatar/default_guest.png'}
                  style={{ width:36, height:36, borderRadius:'50%', border:`2px solid ${rankColor}`, objectFit:'cover' }}
                  onError={e => { e.target.src='/default_images/avatar/default_guest.png' }}
                />
                <div>
                  <div style={{ fontSize:'0.85rem', fontWeight:800, color:'#fff' }}>{user?.username}</div>
                  <div style={{ fontSize:'0.7rem', color:rankColor, fontWeight:700 }}>{rankLabel}</div>
                </div>
              </div>
              {/* Rank icon */}
              {rankInfo.icon && (
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  <img
                    src={`/icons/ranks/${rankInfo.icon}`}
                    alt={rankLabel}
                    style={{ width:18, height:18, objectFit:'contain' }}
                    onError={e => e.target.style.display='none'}
                  />
                  <span style={{ fontSize:'0.72rem', color:rankColor, fontWeight:700 }}>{rankLabel}</span>
                </div>
              )}
              {!user?.isGuest && (
                <div style={{ display:'flex', gap:12 }}>
                  <span style={{ fontSize:'0.71rem', color:'rgba(255,255,255,.5)' }}>
                    💰 <strong style={{ color:'#fbbf24' }}>{user?.gold || 0}</strong>
                  </span>
                  <span style={{ fontSize:'0.71rem', color:'rgba(255,255,255,.5)' }}>
                    ⭐ Lv.<strong style={{ color:'#60a5fa' }}>{user?.level || 1}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Menu items */}
            {!user?.isGuest && <DItem icon="user-circle" label="My Profile" />}
            {isStaff && <DItem icon="dashboard" label="Admin Panel" color="#f87171" onClick={() => window.location.href='/admin'} />}
            <DItem icon="home" label="Home Page" onClick={() => window.location.href='/'} />
            <div style={{ borderTop:'1px solid #2a3a4d', marginTop:4, paddingTop:4 }}>
              <DItem icon="sign-out" label="Logout" color="#f87171" onClick={() => { setOpen(false); onLogout() }} />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function DItem({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:10, width:'100%',
      padding:'9px 12px', background:'none', border:'none', cursor:'pointer',
      color: color || 'rgba(255,255,255,.78)', fontSize:'0.84rem', fontWeight:600,
      borderRadius:8, textAlign:'left', transition:'all .12s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background='rgba(26,115,232,.18)'; e.currentTarget.style.color='#fff' }}
      onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color=color||'rgba(255,255,255,.78)' }}
    >
      <i className={`fi fi-sr-${icon}`} style={{ fontSize:14, width:16, textAlign:'center' }} />
      {label}
    </button>
  )
}

// ── ROOM ROW (list style like codychat) ───────────────────────
function RoomRow({ room, onClick }) {
  const online = room.currentUsers || 0
  const max    = room.maxUsers    || 500
  const pct    = Math.min((online / max) * 100, 100)
  const barClr = pct > 75 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#22c55e'

  const typeBadge = {
    public:  { color:'#60a5fa', label:'Public' },
    private: { color:'#f87171', label:'Private' },
    premium: { color:'#c084fc', label:'Premium' },
    staff:   { color:'#fbbf24', label:'Staff' },
    admin:   { color:'#f87171', label:'Admin' },
    member:  { color:'#4ade80', label:'Members' },
  }[room.type] || { color:'#60a5fa', label:'Public' }

  return (
    <div
      onClick={() => onClick(room)}
      style={{
        display:'flex', alignItems:'center', gap:14,
        padding:'12px 16px', cursor:'pointer',
        borderBottom:'1px solid #1e2d3d',
        transition:'background .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.04)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}
    >
      {/* Room icon */}
      <div style={{ flexShrink:0, width:46, height:46, borderRadius:10, overflow:'hidden', background:'#1a2535', border:'1px solid #2a3a4d' }}>
        <img
          src={room.icon || '/default_images/rooms/default_room.png'}
          alt={room.name}
          style={{ width:'100%', height:'100%', objectFit:'cover' }}
          onError={e => { e.target.style.display='none' }}
        />
      </div>

      {/* Room info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
          {room.isPinned && <span style={{ fontSize:11 }}>📌</span>}
          {room.password && <span style={{ fontSize:11 }}>🔒</span>}
          <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {room.name}
          </span>
          <span style={{ fontSize:'0.68rem', color:typeBadge.color, fontWeight:700, flexShrink:0 }}>
            {typeBadge.label}
          </span>
        </div>
        {room.description && (
          <div style={{ fontSize:'0.77rem', color:'rgba(255,255,255,.4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:5 }}>
            {room.description}
          </div>
        )}
        {/* Online bar */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ flex:1, height:3, background:'rgba(255,255,255,.08)', borderRadius:2 }}>
            <div style={{ height:'100%', width:`${pct}%`, background:barClr, borderRadius:2 }} />
          </div>
          <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,.4)', flexShrink:0 }}>
            {online}/{max}
          </span>
        </div>
      </div>

      {/* Join arrow */}
      <i className="fi fi-sr-angle-right" style={{ color:'rgba(255,255,255,.25)', fontSize:14, flexShrink:0 }} />
    </div>
  )
}

// ── MAIN LOBBY ────────────────────────────────────────────────
export default function ChatLobby() {
  const [user,      setUser]      = useState(null)
  const [rooms,     setRooms]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [search,    setSearch]    = useState('')
  const [passModal, setPassModal] = useState(null)
  const [passVal,   setPassVal]   = useState('')
  const [passErr,   setPassErr]   = useState('')
  const nav = useNavigate()

  useEffect(() => {
    init()
    const t = setInterval(fetchRooms, 30000)
    return () => clearInterval(t)
  }, [])

  async function init() {
    const token = localStorage.getItem('cgz_token')
    if (!token) { nav('/login'); return }

    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await res.json()
      if (res.ok && d.user) {
        setUser({ ...d.user, token })
      } else if (res.status === 401) {
        localStorage.removeItem('cgz_token')
        nav('/login')
        return
      }
    } catch {}

    fetchRooms()
  }

  async function fetchRooms() {
    const token = localStorage.getItem('cgz_token')
    if (!token) return
    try {
      const res  = await fetch(`${API}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setRooms(data.rooms || [])
      else if (res.status === 401) { localStorage.removeItem('cgz_token'); nav('/login') }
      else setError(data.error || 'Failed to load rooms')
    } catch { setError('Network error. Please check connection.') }
    finally { setLoading(false) }
  }

  function logout() {
    const token = localStorage.getItem('cgz_token')
    if (token) fetch(`${API}/api/auth/logout`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } }).catch(()=>{})
    localStorage.removeItem('cgz_token')
    nav('/login')
  }

  function joinRoom(room) {
    if (room.password) { setPassModal(room); setPassVal(''); setPassErr('') }
    else nav(`/chat/${room._id}`)
  }

  function submitPass(e) {
    e.preventDefault()
    if (passVal === passModal.password) nav(`/chat/${passModal._id}`)
    else setPassErr('Wrong password. Please try again.')
  }

  // Filter by search only
  const filtered = rooms.filter(r => {
    if (!search) return true
    const s = search.toLowerCase()
    return r.name.toLowerCase().includes(s) || (r.description||'').toLowerCase().includes(s)
  })

  const pinned  = filtered.filter(r => r.isPinned)
  const regular = filtered.filter(r => !r.isPinned)

  return (
    <div style={{ minHeight:'100vh', background:'#0d1520' }}>
      <ChatHeader user={user} onLogout={logout} />

      {/* Search bar only */}
      <div style={{ background:'#0f1923', borderBottom:'1px solid #1e2d3d', padding:'10px 16px' }}>
        <div style={{ maxWidth:700, margin:'0 auto', position:'relative' }}>
          <i className="fi fi-sr-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#4b5563', fontSize:13 }} />
          <input
            style={{ width:'100%', padding:'9px 14px 9px 34px', background:'#1a2535', border:'1px solid #2a3a4d', borderRadius:9, color:'#fff', fontSize:'0.84rem', outline:'none', boxSizing:'border-box' }}
            placeholder="Search chat rooms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => e.target.style.borderColor='#1a73e8'}
            onBlur={e  => e.target.style.borderColor='#2a3a4d'}
          />
        </div>
      </div>

      {/* Room list */}
      <div style={{ maxWidth:700, margin:'0 auto', padding:'8px 0 40px' }}>

        {loading && (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ width:36, height:36, border:'3px solid #1e2d3d', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }} />
            <p style={{ color:'#4b5563', fontSize:'0.875rem' }}>Loading rooms...</p>
          </div>
        )}

        {error && (
          <div style={{ margin:'16px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:10, padding:'13px 16px', color:'#f87171', fontSize:'0.875rem', textAlign:'center' }}>
            ⚠️ {error} &nbsp;
            <button onClick={fetchRooms} style={{ background:'none', border:'none', color:'#60a5fa', fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Pinned rooms */}
            {pinned.length > 0 && (
              <div>
                <div style={{ padding:'10px 16px 4px', fontSize:'0.7rem', fontWeight:700, color:'#f59e0b', letterSpacing:'1px', textTransform:'uppercase' }}>
                  📌 Featured
                </div>
                {pinned.map(r => <RoomRow key={r._id} room={r} onClick={joinRoom} />)}
                <div style={{ height:8 }} />
              </div>
            )}

            {/* All rooms */}
            <div style={{ padding:'6px 16px 4px', fontSize:'0.7rem', fontWeight:700, color:'#4b5563', letterSpacing:'1px', textTransform:'uppercase' }}>
              All Rooms · {filtered.length}
            </div>

            {regular.length === 0 && !loading && (
              <div style={{ textAlign:'center', padding:'48px 20px', color:'#4b5563' }}>
                <div style={{ fontSize:40, marginBottom:8 }}>🔍</div>
                <p style={{ fontSize:'0.875rem' }}>No rooms found</p>
              </div>
            )}

            {regular.map(r => <RoomRow key={r._id} room={r} onClick={joinRoom} />)}
          </>
        )}
      </div>

      {/* Password Modal */}
      {passModal && (
        <div onClick={() => setPassModal(null)} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.7)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#111827', border:'1px solid #1f2937', borderRadius:16, padding:'26px 22px', maxWidth:320, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,.6)' }}>
            <div style={{ textAlign:'center', marginBottom:18 }}>
              <div style={{ fontSize:34, marginBottom:8 }}>🔒</div>
              <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'#fff', fontSize:'1rem', marginBottom:4 }}>{passModal.name}</h3>
              <p style={{ fontSize:'0.82rem', color:'#6b7280' }}>This room requires a password</p>
            </div>
            {passErr && (
              <div style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.3)', borderRadius:8, padding:'8px 12px', fontSize:'0.81rem', color:'#f87171', marginBottom:12 }}>
                {passErr}
              </div>
            )}
            <form onSubmit={submitPass} style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <input
                type="password"
                style={{ display:'block', width:'100%', padding:'11px 14px', background:'#1f2937', border:'1px solid #374151', borderRadius:9, color:'#fff', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }}
                placeholder="Enter password"
                value={passVal}
                onChange={e => { setPassVal(e.target.value); setPassErr('') }}
                onFocus={e => e.target.style.borderColor='#1a73e8'}
                onBlur={e  => e.target.style.borderColor='#374151'}
                autoFocus
              />
              <button type="submit" style={{ padding:'12px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:800, fontSize:'0.9rem', fontFamily:'Outfit,sans-serif', cursor:'pointer' }}>
                Enter Room
              </button>
              <button type="button" onClick={() => setPassModal(null)} style={{ padding:'10px', borderRadius:9, border:'1px solid #374151', background:'none', color:'#6b7280', fontWeight:600, fontSize:'0.84rem', cursor:'pointer' }}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
