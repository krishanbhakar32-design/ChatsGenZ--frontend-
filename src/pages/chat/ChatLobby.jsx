import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

const RANK_INFO = {
  guest:      { color:'#888888', label:'Guest',      icon:'guest.svg'      },
  user:       { color:'#aaaaaa', label:'User',        icon:'user.svg'       },
  vipfemale:  { color:'#FF4488', label:'VIP Female',  icon:'vipfemale.svg'  },
  vipmale:    { color:'#4488FF', label:'VIP Male',    icon:'vipmale.svg'    },
  butterfly:  { color:'#FF66AA', label:'Butterfly',   icon:'butterfly.svg'  },
  ninja:      { color:'#777777', label:'Ninja',       icon:'ninja.svg'      },
  fairy:      { color:'#FF88CC', label:'Fairy',       icon:'fairy.svg'      },
  legend:     { color:'#FF8800', label:'Legend',      icon:'legend.png'     },
  bot:        { color:'#00cc88', label:'Bot',         icon:'bot.svg'        },
  premium:    { color:'#aa44ff', label:'Premium',     icon:'premium.svg'    },
  moderator:  { color:'#00AAFF', label:'Moderator',   icon:'moderator.svg'  },
  admin:      { color:'#FF4444', label:'Admin',       icon:'admin.svg'      },
  superadmin: { color:'#FF00FF', label:'Superadmin',  icon:'superadmin.svg' },
  owner:      { color:'#FFD700', label:'Owner',       icon:'owner.svg'      },
}

// ── HEADER ────────────────────────────────────────────────────
function LobbyHeader({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  // Use rankInfo from backend first, fallback to RANK_INFO
  const rank      = user?.rank || 'guest'
  const ri        = user?.rankInfo || RANK_INFO[rank] || RANK_INFO.guest
  const rankColor = ri.color || '#aaaaaa'
  const rankLabel = ri.label || rank
  const rankIcon  = ri.icon  || 'guest.svg'
  const isStaff   = ['moderator','admin','superadmin','owner'].includes(rank)

  return (
    <header style={{
      position:'sticky', top:0, zIndex:900,
      background:'#0f1923', borderBottom:'1px solid #1e2d3d',
      boxShadow:'0 2px 10px rgba(0,0,0,.4)',
      height:52, display:'flex', alignItems:'center',
      padding:'0 14px', gap:10, flexShrink:0,
    }}>
      {/* Logo — clicking stays on lobby, not homepage */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <img src="/favicon/favicon-192.png" alt="ChatsGenZ"
          style={{ width:28, height:28, borderRadius:6 }}
          onError={e => e.target.style.display='none'}
        />
        <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1rem', color:'#fff' }}>
          Chats<span style={{ color:'#1a73e8' }}>GenZ</span>
        </span>
      </div>

      <div style={{ flex:1 }} />

      {/* Avatar + dropdown */}
      <div ref={ref} style={{ position:'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:8, padding:'4px 6px', borderRadius:8, transition:'background .15s' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.07)'}
          onMouseLeave={e => e.currentTarget.style.background='none'}
        >
          {/* Avatar */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <img
              src={user?.avatar || '/default_images/avatar/default_guest.png'}
              alt=""
              style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', border:`2px solid ${rankColor}`, display:'block' }}
              onError={e => { e.target.src='/default_images/avatar/default_guest.png' }}
            />
            <span style={{ position:'absolute', bottom:0, right:0, width:8, height:8, background:'#22c55e', borderRadius:'50%', border:'2px solid #0f1923' }} />
          </div>
          {/* Name + rank — hidden on tiny screens */}
          <div style={{ textAlign:'left', lineHeight:1 }} className="hdr-name">
            <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#fff', maxWidth:85, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.username || 'Guest'}
            </div>
            <div style={{ fontSize:'0.66rem', color:rankColor, fontWeight:700, marginTop:2 }}>
              {rankLabel}
            </div>
          </div>
          <i className={`fi fi-sr-angle-${open?'up':'down'}`} style={{ fontSize:9, color:'rgba(255,255,255,.35)', flexShrink:0 }} />
        </button>

        {/* Dropdown */}
        {open && (
          <div style={{
            position:'absolute', right:0, top:'calc(100% + 5px)',
            background:'#111c2d', border:'1px solid #1e2d3d',
            borderRadius:12, padding:5, minWidth:200,
            boxShadow:'0 8px 28px rgba(0,0,0,.55)', zIndex:999,
          }}>
            {/* User info */}
            <div style={{ padding:'12px 13px', borderBottom:'1px solid #1e2d3d', marginBottom:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <img
                  src={user?.avatar || '/default_images/avatar/default_guest.png'}
                  style={{ width:38, height:38, borderRadius:'50%', border:`2px solid ${rankColor}`, objectFit:'cover', flexShrink:0 }}
                  onError={e => { e.target.src='/default_images/avatar/default_guest.png' }}
                />
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:'0.875rem', fontWeight:800, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.username}</div>
                  {/* Rank with icon */}
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                    <img src={`/icons/ranks/${rankIcon}`} alt="" style={{ width:14, height:14, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
                    <span style={{ fontSize:'0.68rem', color:rankColor, fontWeight:700 }}>{rankLabel}</span>
                  </div>
                </div>
              </div>
              {/* Stats */}
              {!user?.isGuest && (
                <div style={{ display:'flex', gap:12 }}>
                  <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,.45)' }}>💰 <strong style={{ color:'#fbbf24' }}>{user?.gold||0}</strong></span>
                  <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,.45)' }}>⭐ Lv.<strong style={{ color:'#60a5fa' }}>{user?.level||1}</strong></span>
                </div>
              )}
            </div>

            {/* Actions */}
            {!user?.isGuest && (
              <DBtn icon="user-circle" label="My Profile" onClick={()=>setOpen(false)} />
            )}
            {isStaff && (
              <DBtn icon="settings" label="Admin Panel" color="#f87171" onClick={()=>{ setOpen(false); window.location.href='/admin' }} />
            )}
            <div style={{ borderTop:'1px solid #1e2d3d', marginTop:4, paddingTop:4 }}>
              <DBtn icon="sign-out" label="Logout" color="#f87171" onClick={()=>{ setOpen(false); onLogout() }} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:380px){ .hdr-name{ display:none !important; } }
      `}</style>
    </header>
  )
}

function DBtn({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:9, width:'100%',
      padding:'9px 12px', background:'none', border:'none', cursor:'pointer',
      color: color||'rgba(255,255,255,.75)', fontSize:'0.84rem', fontWeight:600,
      borderRadius:7, textAlign:'left', transition:'all .12s',
    }}
      onMouseEnter={e=>{ e.currentTarget.style.background='rgba(26,115,232,.15)'; e.currentTarget.style.color='#fff' }}
      onMouseLeave={e=>{ e.currentTarget.style.background='none'; e.currentTarget.style.color=color||'rgba(255,255,255,.75)' }}
    >
      <i className={`fi fi-sr-${icon}`} style={{ fontSize:14, width:15, textAlign:'center', flexShrink:0 }} />
      {label}
    </button>
  )
}

// ── ROOM ROW ──────────────────────────────────────────────────
function RoomRow({ room, onClick }) {
  const online = room.currentUsers || 0
  const max    = room.maxUsers    || 500
  const pct    = Math.min((online/max)*100, 100)
  const barClr = pct>75?'#ef4444':pct>40?'#f59e0b':'#22c55e'

  // Type icon + color like codychat
  const typeMap = {
    public:  { icon:'fi fi-sr-globe',        color:'#60a5fa',  label:'Public'  },
    private: { icon:'fi fi-sr-lock',          color:'#f87171',  label:'Private' },
    premium: { icon:'fi fi-sr-crown',         color:'#c084fc',  label:'Premium' },
    staff:   { icon:'fi fi-sr-shield',        color:'#fbbf24',  label:'Staff'   },
    admin:   { icon:'fi fi-sr-dashboard',     color:'#f87171',  label:'Admin'   },
    member:  { icon:'fi fi-sr-user-check',    color:'#4ade80',  label:'Members' },
  }
  const t = typeMap[room.type] || typeMap.public

  return (
    <div
      onClick={() => onClick(room)}
      style={{
        display:'flex', alignItems:'center', gap:12,
        padding:'11px 14px', cursor:'pointer',
        borderBottom:'1px solid rgba(255,255,255,.05)',
        transition:'background .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.04)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}
    >
      {/* Icon */}
      <div style={{
        flexShrink:0, width:44, height:44, borderRadius:10,
        overflow:'hidden', background:'#1a2535', border:'1px solid #2a3a4d',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <img
          src={room.icon || '/default_images/rooms/default_room.png'}
          alt={room.name}
          style={{ width:'100%', height:'100%', objectFit:'cover' }}
          onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='<i class="fi fi-sr-comment-alt" style="color:#4b5563;font-size:18px"></i>' }}
        />
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        {/* Row 1: name + type + lock */}
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
          {room.isPinned && <span style={{ fontSize:10 }}>📌</span>}
          <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.875rem', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
            {room.name}
          </span>
          {/* Type badge */}
          <span style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
            <i className={t.icon} style={{ fontSize:11, color:t.color }} />
            <span style={{ fontSize:'0.65rem', color:t.color, fontWeight:700 }}>{t.label}</span>
          </span>
          {room.password && <i className="fi fi-sr-lock" style={{ fontSize:10, color:'#6b7280', flexShrink:0 }} />}
        </div>

        {/* Row 2: description */}
        {room.description && (
          <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,.38)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>
            {room.description}
          </div>
        )}

        {/* Row 3: online count + bar */}
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ width:6, height:6, background:barClr, borderRadius:'50%', display:'inline-block', flexShrink:0 }} />
          <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,.4)', fontWeight:600, flexShrink:0 }}>
            {online} online
          </span>
          <div style={{ flex:1, height:2, background:'rgba(255,255,255,.07)', borderRadius:1 }}>
            <div style={{ height:'100%', width:`${pct}%`, background:barClr, borderRadius:1, transition:'width .4s' }} />
          </div>
          <span style={{ fontSize:'0.66rem', color:'rgba(255,255,255,.25)', flexShrink:0 }}>{max}</span>
        </div>
      </div>

      <i className="fi fi-sr-angle-right" style={{ color:'rgba(255,255,255,.2)', fontSize:13, flexShrink:0 }} />
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────
export default function ChatLobby() {
  const [user,      setUser]     = useState(null)
  const [rooms,     setRooms]    = useState([])
  const [loading,   setLoading]  = useState(true)
  const [error,     setError]    = useState('')
  const [search,    setSearch]   = useState('')
  const [passModal, setPass]     = useState(null)
  const [passVal,   setPassVal]  = useState('')
  const [passErr,   setPassErr]  = useState('')
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
      const res = await fetch(`${API}/api/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
      const d   = await res.json()
      if (res.ok && d.user) setUser({ ...d.user, token })
      else if (res.status===401) { localStorage.removeItem('cgz_token'); nav('/login'); return }
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
      else if (res.status===401) { localStorage.removeItem('cgz_token'); nav('/login') }
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
    if (room.password) { setPass(room); setPassVal(''); setPassErr('') }
    else nav(`/chat/${room._id}`)
  }

  function submitPass(e) {
    e.preventDefault()
    if (passVal === passModal.password) nav(`/chat/${passModal._id}`)
    else setPassErr('Wrong password.')
  }

  const filtered = rooms.filter(r => {
    if (!search) return true
    const s = search.toLowerCase()
    return r.name.toLowerCase().includes(s) || (r.description||'').toLowerCase().includes(s)
  })
  const pinned  = filtered.filter(r => r.isPinned)
  const regular = filtered.filter(r => !r.isPinned)

  return (
    <div style={{ minHeight:'100vh', background:'#0d1520', display:'flex', flexDirection:'column' }}>
      <LobbyHeader user={user} onLogout={logout} />

      {/* Search */}
      <div style={{ background:'#0f1923', borderBottom:'1px solid #1e2d3d', padding:'9px 14px' }}>
        <div style={{ maxWidth:640, margin:'0 auto', position:'relative' }}>
          <i className="fi fi-sr-search" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#4b5563', fontSize:12 }} />
          <input
            style={{ width:'100%', padding:'8px 13px 8px 32px', background:'#1a2535', border:'1px solid #2a3a4d', borderRadius:8, color:'#fff', fontSize:'0.84rem', outline:'none', boxSizing:'border-box' }}
            placeholder="Search rooms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => e.target.style.borderColor='#1a73e8'}
            onBlur={e  => e.target.style.borderColor='#2a3a4d'}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex:1, maxWidth:640, width:'100%', margin:'0 auto' }}>

        {loading && (
          <div style={{ textAlign:'center', padding:'70px 0' }}>
            <div style={{ width:34, height:34, border:'3px solid #1e2d3d', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 10px' }} />
            <p style={{ color:'#4b5563', fontSize:'0.84rem' }}>Loading rooms...</p>
          </div>
        )}

        {error && (
          <div style={{ margin:'14px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:9, padding:'12px 14px', color:'#f87171', fontSize:'0.84rem', textAlign:'center' }}>
            ⚠️ {error} &nbsp;
            <button onClick={fetchRooms} style={{ background:'none', border:'none', color:'#60a5fa', fontWeight:700, cursor:'pointer' }}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {pinned.length > 0 && (
              <>
                <div style={{ padding:'10px 14px 4px', fontSize:'0.68rem', fontWeight:700, color:'#f59e0b', letterSpacing:'1px', textTransform:'uppercase' }}>
                  📌 Featured
                </div>
                {pinned.map(r => <RoomRow key={r._id} room={r} onClick={joinRoom} />)}
                <div style={{ height:8, borderBottom:'2px solid #1e2d3d' }} />
              </>
            )}

            <div style={{ padding:'10px 14px 4px', fontSize:'0.68rem', fontWeight:700, color:'#374151', letterSpacing:'1px', textTransform:'uppercase' }}>
              All Rooms ({filtered.length})
            </div>

            {regular.length === 0 && (
              <div style={{ textAlign:'center', padding:'48px 20px', color:'#4b5563' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🔍</div>
                <p style={{ fontSize:'0.84rem' }}>No rooms found</p>
              </div>
            )}

            {regular.map(r => <RoomRow key={r._id} room={r} onClick={joinRoom} />)}
          </>
        )}
      </div>

      {/* Password modal */}
      {passModal && (
        <div onClick={()=>setPass(null)} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.7)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#111827', border:'1px solid #1f2937', borderRadius:14, padding:'24px 20px', maxWidth:300, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.6)' }}>
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:30, marginBottom:7 }}>🔒</div>
              <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'#fff', fontSize:'0.95rem', marginBottom:3 }}>{passModal.name}</h3>
              <p style={{ fontSize:'0.79rem', color:'#6b7280' }}>Enter room password</p>
            </div>
            {passErr && <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:7, padding:'7px 11px', fontSize:'0.79rem', color:'#f87171', marginBottom:10 }}>{passErr}</div>}
            <form onSubmit={submitPass} style={{ display:'flex', flexDirection:'column', gap:9 }}>
              <input
                type="password"
                style={{ display:'block', width:'100%', padding:'10px 13px', background:'#1f2937', border:'1px solid #374151', borderRadius:8, color:'#fff', fontSize:'0.875rem', outline:'none', boxSizing:'border-box' }}
                placeholder="Password"
                value={passVal}
                onChange={e=>{setPassVal(e.target.value);setPassErr('')}}
                onFocus={e=>e.target.style.borderColor='#1a73e8'}
                onBlur={e=>e.target.style.borderColor='#374151'}
                autoFocus
              />
              <button type="submit" style={{ padding:'11px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:800, fontSize:'0.875rem', fontFamily:'Outfit,sans-serif', cursor:'pointer' }}>
                Enter Room
              </button>
              <button type="button" onClick={()=>setPass(null)} style={{ padding:'9px', borderRadius:8, border:'1px solid #374151', background:'none', color:'#6b7280', fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>
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
