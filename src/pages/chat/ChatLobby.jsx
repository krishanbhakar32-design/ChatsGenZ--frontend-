import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ── RANK CONFIG ───────────────────────────────────────────────
const RANK_COLOR = {
  guest:      '#888888', user:       '#aaaaaa', vipfemale:  '#FF4488',
  vipmale:    '#4488FF', butterfly:  '#FF66AA', ninja:      '#777777',
  fairy:      '#FF88CC', legend:     '#FF8800', bot:        '#00cc88',
  premium:    '#aa44ff', moderator:  '#00AAFF', admin:      '#FF4444',
  superadmin: '#FF00FF', owner:      '#FFD700',
}
const RANK_LABEL = {
  guest:'Guest', user:'User', vipfemale:'VIP ♀', vipmale:'VIP ♂',
  butterfly:'Butterfly', ninja:'Ninja', fairy:'Fairy', legend:'Legend',
  bot:'Bot', premium:'Premium', moderator:'Moderator', admin:'Admin',
  superadmin:'Superadmin', owner:'Owner',
}

// ── CHAT HEADER ───────────────────────────────────────────────
function ChatHeader({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const rankColor = RANK_COLOR[user?.rank] || '#aaaaaa'
  const rankLabel = RANK_LABEL[user?.rank] || user?.rank || 'Guest'
  const isStaff   = ['moderator','admin','superadmin','owner'].includes(user?.rank)

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 900,
      background: '#0f1923',
      borderBottom: '1px solid #1e2d3d',
      boxShadow: '0 2px 12px rgba(0,0,0,.35)',
      height: 54, display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12,
    }}>
      {/* Logo */}
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
        <img src="/favicon/favicon-192.png" alt="ChatsGenZ"
          style={{ width:30, height:30, borderRadius:7 }}
          onError={e=>e.target.style.display='none'}
        />
        <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:'#fff' }}>
          Chats<span style={{ color:'#1a73e8' }}>GenZ</span>
        </span>
      </Link>

      {/* Spacer */}
      <div style={{ flex:1 }} />

      {/* Right icons */}
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>

        {/* Notifications */}
        <button style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.65)', width:38, height:38, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, position:'relative' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}
        >
          <i className="fi fi-sr-bell" />
        </button>

        {/* Private messages */}
        <button style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.65)', width:38, height:38, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}
        >
          <i className="fi fi-sr-envelope" />
        </button>

        {/* Profile avatar + dropdown */}
        <div style={{ position:'relative' }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:8, padding:'4px 8px', borderRadius:9 }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'}
            onMouseLeave={e=>e.currentTarget.style.background='none'}
          >
            {/* Avatar */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <img
                src={user?.avatar || '/default_images/avatar/default_guest.png'}
                alt={user?.username}
                style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', border:`2px solid ${rankColor}` }}
                onError={e=>{ e.target.src='/default_images/avatar/default_guest.png' }}
              />
              {/* Online dot */}
              <span style={{ position:'absolute', bottom:0, right:0, width:9, height:9, background:'#22c55e', borderRadius:'50%', border:'2px solid #0f1923' }} />
            </div>
            {/* Username + rank — hidden on very small screens */}
            <div style={{ textAlign:'left' }} className="avatar-text">
              <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#fff', lineHeight:1.2, maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.username || 'Guest'}
              </div>
              <div style={{ fontSize:'0.68rem', color:rankColor, fontWeight:700, lineHeight:1 }}>{rankLabel}</div>
            </div>
            <i className={`fi fi-sr-angle-${menuOpen?'up':'down'}`} style={{ fontSize:10, color:'rgba(255,255,255,.5)' }} />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div style={{
              position:'absolute', right:0, top:'calc(100% + 6px)',
              background:'#1a2535', border:'1px solid #2a3a4d',
              borderRadius:12, padding:6, minWidth:180,
              boxShadow:'0 8px 32px rgba(0,0,0,.45)', zIndex:999,
            }}>
              {/* User info at top */}
              <div style={{ padding:'10px 12px 8px', borderBottom:'1px solid #2a3a4d', marginBottom:4 }}>
                <div style={{ fontSize:'0.82rem', fontWeight:800, color:'#fff' }}>{user?.username}</div>
                <div style={{ fontSize:'0.72rem', color:rankColor, fontWeight:700, marginTop:2 }}>{rankLabel}</div>
                {!user?.isGuest && (
                  <div style={{ display:'flex', gap:10, marginTop:6 }}>
                    <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,.5)' }}>
                      💰 <strong style={{ color:'#fbbf24' }}>{user?.gold || 0}</strong> gold
                    </span>
                    <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,.5)' }}>
                      ⭐ Lv.<strong style={{ color:'#60a5fa' }}>{user?.level || 1}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Menu items */}
              {!user?.isGuest && <MenuItem icon="user-circle" label="My Profile" onClick={()=>setMenuOpen(false)} />}
              {isStaff && <MenuItem icon="dashboard" label="Admin Panel" onClick={()=>{setMenuOpen(false); window.location.href='/admin'}} color="#FF4444" />}
              <MenuItem icon="home" label="Home" onClick={()=>{setMenuOpen(false); window.location.href='/'}} />
              <div style={{ borderTop:'1px solid #2a3a4d', marginTop:4, paddingTop:4 }}>
                <MenuItem icon="sign-out" label="Logout" onClick={()=>{setMenuOpen(false); onLogout()}} color="#ef4444" />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 400px) { .avatar-text { display: none !important; } }
      `}</style>
    </header>
  )
}

function MenuItem({ icon, label, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:10, width:'100%',
      padding:'9px 12px', background:'none', border:'none', cursor:'pointer',
      color: color || 'rgba(255,255,255,.8)', fontSize:'0.84rem', fontWeight:600,
      borderRadius:8, textAlign:'left', transition:'all .12s',
    }}
      onMouseEnter={e=>{ e.currentTarget.style.background='rgba(26,115,232,.18)'; e.currentTarget.style.color='#fff' }}
      onMouseLeave={e=>{ e.currentTarget.style.background='none'; e.currentTarget.style.color=color||'rgba(255,255,255,.8)' }}
    >
      <i className={`fi fi-sr-${icon}`} style={{ fontSize:14, width:16, textAlign:'center' }} />
      {label}
    </button>
  )
}

// ── ROOM CARD ─────────────────────────────────────────────────
const TYPE_BADGE = {
  public:  { bg:'rgba(26,115,232,.2)',  color:'#60a5fa',  label:'Public' },
  private: { bg:'rgba(234,67,53,.2)',   color:'#f87171',  label:'Private' },
  premium: { bg:'rgba(170,68,255,.2)',  color:'#c084fc',  label:'Premium' },
  staff:   { bg:'rgba(251,188,4,.2)',   color:'#fbbf24',  label:'Staff' },
  admin:   { bg:'rgba(234,67,53,.2)',   color:'#f87171',  label:'Admin' },
  member:  { bg:'rgba(52,168,83,.2)',   color:'#4ade80',  label:'Members' },
}

function RoomCard({ room, onClick }) {
  const badge   = TYPE_BADGE[room.type] || TYPE_BADGE.public
  const online  = room.currentUsers || 0
  const max     = room.maxUsers || 500
  const pct     = Math.min((online / max) * 100, 100)
  const barColor = pct > 75 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#22c55e'

  return (
    <div
      onClick={() => onClick(room)}
      style={{
        background:'#1a2535', border:'1px solid #2a3a4d',
        borderRadius:12, overflow:'hidden', cursor:'pointer',
        transition:'all .18s',
      }}
      onMouseEnter={e=>{ e.currentTarget.style.border='1px solid #3a5a7d'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.3)' }}
      onMouseLeave={e=>{ e.currentTarget.style.border='1px solid #2a3a4d'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
    >
      {/* Room image */}
      <div style={{ height:90, background:'linear-gradient(135deg,#1a2535,#0f1923)', position:'relative', overflow:'hidden' }}>
        <img
          src={room.icon || '/default_images/rooms/default_room.png'}
          alt={room.name}
          style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.85 }}
          onError={e=>{ e.target.style.display='none' }}
        />
        {/* Overlay */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(15,25,35,.8) 0%, transparent 60%)' }} />

        {/* Badges */}
        <div style={{ position:'absolute', top:7, left:7, display:'flex', gap:5 }}>
          <span style={{ background:badge.bg, color:badge.color, fontSize:'0.65rem', fontWeight:700, padding:'2px 7px', borderRadius:20, backdropFilter:'blur(4px)' }}>
            {badge.label}
          </span>
          {room.isPinned && <span style={{ background:'rgba(245,158,11,.2)', color:'#fbbf24', fontSize:'0.65rem', fontWeight:700, padding:'2px 7px', borderRadius:20 }}>📌</span>}
        </div>
        {room.password && (
          <span style={{ position:'absolute', top:7, right:7, background:'rgba(0,0,0,.5)', color:'#fff', fontSize:'0.65rem', padding:'2px 7px', borderRadius:20 }}>🔒</span>
        )}

        {/* Online bar */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:'rgba(255,255,255,.1)' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:barColor, transition:'width .3s' }} />
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:'10px 12px' }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.88rem', color:'#fff', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {room.name}
        </div>
        {room.description && (
          <p style={{ fontSize:'0.74rem', color:'rgba(255,255,255,.45)', lineHeight:1.45, marginBottom:7, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {room.description}
          </p>
        )}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:6, height:6, background:'#22c55e', borderRadius:'50%', display:'inline-block' }} />
            <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,.5)', fontWeight:600 }}>{online} online</span>
          </div>
          {room.category && <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,.3)' }}>{room.category}</span>}
        </div>
      </div>
    </div>
  )
}

// ── MAIN LOBBY ────────────────────────────────────────────────
export default function ChatLobby() {
  const [user,     setUser]      = useState(null)
  const [rooms,    setRooms]     = useState([])
  const [loading,  setLoading]   = useState(true)
  const [error,    setError]     = useState('')
  const [search,   setSearch]    = useState('')
  const [category, setCategory]  = useState('All')
  const [passModal, setPassModal] = useState(null)
  const [passVal,  setPassVal]   = useState('')
  const [passErr,  setPassErr]   = useState('')
  const nav = useNavigate()

  useEffect(() => {
    init()
    const t = setInterval(fetchRooms, 30000)
    return () => clearInterval(t)
  }, [])

  async function init() {
    const token = localStorage.getItem('cgz_token')
    if (!token) { nav('/login'); return }

    // Load user
    try {
      const res = await fetch(`${API}/api/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
      const d   = await res.json()
      if (res.ok && d.user) setUser({ ...d.user, token })
      else if (res.status === 401) { localStorage.removeItem('cgz_token'); nav('/login'); return }
    } catch {}

    fetchRooms()
  }

  async function fetchRooms() {
    const token = localStorage.getItem('cgz_token')
    if (!token) return
    try {
      const res  = await fetch(`${API}/api/rooms`, { headers:{ Authorization:`Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setRooms(data.rooms || [])
      else if (res.status === 401) { localStorage.removeItem('cgz_token'); nav('/login') }
      else setError(data.error || 'Failed to load rooms')
    } catch { setError('Network error.') }
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

  // Filter
  const categories = ['All', ...new Set(rooms.map(r=>r.category).filter(Boolean))]
  const filtered   = rooms.filter(r => {
    const s = search.toLowerCase()
    const ms = !s || r.name.toLowerCase().includes(s) || (r.description||'').toLowerCase().includes(s)
    const mc = category==='All' || r.category===category
    return ms && mc
  })
  const pinned  = filtered.filter(r => r.isPinned)
  const regular = filtered.filter(r => !r.isPinned)

  return (
    <div style={{ minHeight:'100vh', background:'#0d1520' }}>
      <ChatHeader user={user} onLogout={logout} />

      {/* Filter bar */}
      <div style={{ background:'#111827', borderBottom:'1px solid #1f2937', padding:'12px 16px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {/* Search */}
          <div style={{ flex:1, minWidth:180, position:'relative' }}>
            <i className="fi fi-sr-search" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#4b5563', fontSize:13 }} />
            <input
              style={{ width:'100%', padding:'9px 13px 9px 32px', background:'#1f2937', border:'1px solid #374151', borderRadius:9, color:'#fff', fontSize:'0.84rem', outline:'none', boxSizing:'border-box' }}
              placeholder="Search rooms..."
              value={search}
              onChange={e=>setSearch(e.target.value)}
              onFocus={e=>e.target.style.borderColor='#1a73e8'}
              onBlur={e=>e.target.style.borderColor='#374151'}
            />
          </div>
          {/* Category pills */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {categories.map(c => (
              <button key={c} onClick={()=>setCategory(c)} style={{
                padding:'6px 14px', borderRadius:20, border:'none', fontSize:'0.78rem', fontWeight:700, cursor:'pointer', transition:'all .15s',
                background: category===c ? '#1a73e8' : '#1f2937',
                color:      category===c ? '#fff' : 'rgba(255,255,255,.5)',
              }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rooms */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px 16px 40px' }}>

        {loading && (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ width:40, height:40, border:'3px solid #1f2937', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 14px' }} />
            <p style={{ color:'#4b5563', fontSize:'0.9rem' }}>Loading rooms...</p>
          </div>
        )}

        {error && (
          <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:10, padding:'14px 18px', color:'#f87171', fontSize:'0.875rem', textAlign:'center', marginBottom:20 }}>
            ⚠️ {error} &nbsp;
            <button onClick={fetchRooms} style={{ background:'none', border:'none', color:'#60a5fa', fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Pinned */}
            {pinned.length > 0 && (
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#f59e0b', letterSpacing:'1px', textTransform:'uppercase', marginBottom:12 }}>
                  📌 Featured Rooms
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                  {pinned.map(r => <RoomCard key={r._id} room={r} onClick={joinRoom} />)}
                </div>
              </div>
            )}

            {/* All rooms */}
            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#4b5563', letterSpacing:'1px', textTransform:'uppercase', marginBottom:12 }}>
              {category === 'All' ? 'All Rooms' : category} · {filtered.length} rooms
            </div>

            {regular.length === 0 && !loading && (
              <div style={{ textAlign:'center', padding:'60px 20px', color:'#4b5563' }}>
                <div style={{ fontSize:48, marginBottom:10 }}>🔍</div>
                <p style={{ fontSize:'0.9rem', color:'#6b7280' }}>No rooms found. Try a different search.</p>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
              {regular.map(r => <RoomCard key={r._id} room={r} onClick={joinRoom} />)}
            </div>
          </>
        )}
      </div>

      {/* Password Modal */}
      {passModal && (
        <div onClick={()=>setPassModal(null)} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.7)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#111827', border:'1px solid #1f2937', borderRadius:16, padding:'28px 24px', maxWidth:340, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,.5)' }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🔒</div>
              <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'#fff', fontSize:'1rem', marginBottom:4 }}>{passModal.name}</h3>
              <p style={{ fontSize:'0.83rem', color:'#6b7280' }}>Enter the room password to continue</p>
            </div>
            {passErr && <div style={{ background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.3)', borderRadius:8, padding:'8px 12px', fontSize:'0.82rem', color:'#f87171', marginBottom:12 }}>{passErr}</div>}
            <form onSubmit={submitPass} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <input
                type="password"
                style={{ display:'block', width:'100%', padding:'11px 14px', background:'#1f2937', border:'1px solid #374151', borderRadius:9, color:'#fff', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }}
                placeholder="Room password"
                value={passVal}
                onChange={e=>{setPassVal(e.target.value);setPassErr('')}}
                onFocus={e=>e.target.style.borderColor='#1a73e8'}
                onBlur={e=>e.target.style.borderColor='#374151'}
                autoFocus
              />
              <button type="submit" style={{ padding:'12px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:800, fontSize:'0.9rem', fontFamily:'Outfit,sans-serif', cursor:'pointer' }}>
                Enter Room
              </button>
              <button type="button" onClick={()=>setPassModal(null)} style={{ padding:'10px', borderRadius:9, border:'1px solid #374151', background:'none', color:'#6b7280', fontWeight:600, fontSize:'0.875rem', cursor:'pointer' }}>
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
