import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

const RANKS = {
  guest:      { label:'Guest',      color:'#888888', icon:'guest.svg'      },
  user:       { label:'User',       color:'#aaaaaa', icon:'user.svg'       },
  vipfemale:  { label:'VIP Female', color:'#FF4488', icon:'vipfemale.svg'  },
  vipmale:    { label:'VIP Male',   color:'#4488FF', icon:'vipmale.svg'    },
  butterfly:  { label:'Butterfly',  color:'#FF66AA', icon:'butterfly.svg'  },
  ninja:      { label:'Ninja',      color:'#777777', icon:'ninja.svg'      },
  fairy:      { label:'Fairy',      color:'#FF88CC', icon:'fairy.svg'      },
  legend:     { label:'Legend',     color:'#FF8800', icon:'legend.png'     },
  bot:        { label:'Bot',        color:'#00cc88', icon:'bot.svg'        },
  premium:    { label:'Premium',    color:'#aa44ff', icon:'premium.svg'    },
  moderator:  { label:'Moderator',  color:'#00AAFF', icon:'moderator.svg'  },
  admin:      { label:'Admin',      color:'#FF4444', icon:'admin.svg'      },
  superadmin: { label:'Superadmin', color:'#FF00FF', icon:'superadmin.svg' },
  owner:      { label:'Owner',      color:'#FFD700', icon:'owner.svg'      },
}
const GBR = (g,r) => r==='bot'?'#cccccc':({male:'#03add8',female:'#ff99ff',couple:'#9c6fde',other:'#cccccc'}[g]||'#cccccc')
const R   = r => RANKS[r] || RANKS.guest

const ROOM_TYPE = {
  public:  { icon:'fi-sr-globe',      color:'#1a73e8', bg:'#e8f0fe', label:'Public'   },
  private: { icon:'fi-sr-lock',       color:'#dc2626', bg:'#fee2e2', label:'Private'  },
  premium: { icon:'fi-sr-crown',      color:'#7c3aed', bg:'#ede9fe', label:'Premium'  },
  staff:   { icon:'fi-sr-shield',     color:'#d97706', bg:'#fef3c7', label:'Staff'    },
  admin:   { icon:'fi-sr-dashboard',  color:'#dc2626', bg:'#fee2e2', label:'Admin'    },
  member:  { icon:'fi-sr-user-check', color:'#059669', bg:'#d1fae5', label:'Members'  },
}

// ── STATUS OPTIONS ──────────────────────────────────────────
const STATUSES = [
  { id:'online',    label:'Online',    color:'#22c55e', icon:'🟢' },
  { id:'away',      label:'Away',      color:'#f59e0b', icon:'🟡' },
  { id:'busy',      label:'Busy',      color:'#ef4444', icon:'🔴' },
  { id:'invisible', label:'Invisible', color:'#9ca3af', icon:'⚪' },
]

// ── PROFILE DROPDOWN ─────────────────────────────────────────
function ProfileDropdown({ user, status, setStatus, onLogout, onClose }) {
  const rank    = user?.rank || 'guest'
  const ri      = user?.rankInfo || R(rank)
  const col     = ri.color || '#aaa'
  const icon    = ri.icon  || 'guest.svg'
  const label   = ri.label || rank
  const border  = GBR(user?.gender, rank)
  const isStaff = ['moderator','admin','superadmin','owner'].includes(rank)
  const isOwner = rank === 'owner'
  const nav     = useNavigate()
  const curSt   = STATUSES.find(s=>s.id===status) || STATUSES[0]

  return (
    <div style={{ position:'absolute', right:0, top:'calc(100% + 6px)', background:'#fff', border:'1px solid #e8eaed', borderRadius:14, minWidth:230, boxShadow:'0 6px 24px rgba(0,0,0,.13)', zIndex:999, overflow:'hidden' }}>
      {/* Top card */}
      <div style={{ padding:'14px 14px 10px', borderBottom:'1px solid #f3f4f6' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <img src={user?.avatar||'/default_images/avatar/default_guest.png'} alt=""
            style={{ width:44, height:44, borderRadius:'50%', border:`2.5px solid ${border}`, objectFit:'cover', flexShrink:0 }}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
          />
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.username}</div>
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3 }}>
              <img src={`/icons/ranks/${icon}`} alt="" style={{ width:14, height:14 }} onError={e=>e.target.style.display='none'} />
              <span style={{ fontSize:'0.72rem', color:col, fontWeight:700 }}>{label}</span>
            </div>
          </div>
          {/* Status indicator */}
          <div style={{ marginLeft:'auto', flexShrink:0 }}>
            <span style={{ fontSize:14 }}>{curSt.icon}</span>
          </div>
        </div>
        {/* Gold + Level */}
        {!user?.isGuest && (
          <div style={{ display:'flex', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <img src="/icons/ui/gold.svg" alt="" style={{ width:14, height:14 }} onError={e=>e.target.style.display='none'} />
              <span style={{ fontSize:'0.73rem', fontWeight:700, color:'#d97706' }}>{user?.gold||0}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <img src="/icons/ui/level.svg" alt="" style={{ width:14, height:14 }} onError={e=>e.target.style.display='none'} />
              <span style={{ fontSize:'0.73rem', fontWeight:700, color:'#1a73e8' }}>{user?.level||1}</span>
            </div>
          </div>
        )}
      </div>

      {/* Status selector */}
      <div style={{ padding:'6px 8px', borderBottom:'1px solid #f3f4f6' }}>
        <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', padding:'2px 4px 6px' }}>Status</div>
        <div style={{ display:'flex', gap:4 }}>
          {STATUSES.map(s=>(
            <button key={s.id} onClick={()=>setStatus(s.id)} title={s.label}
              style={{ flex:1, padding:'5px 2px', borderRadius:6, border:`1.5px solid ${status===s.id?s.color:'#e8eaed'}`, background:status===s.id?s.color+'15':'none', cursor:'pointer', fontSize:14, transition:'all .15s' }}>
              {s.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding:'4px' }}>
        <DItem icon="fi-ss-user"         label="My Profile"    onClick={onClose} />
        <DItem icon="fi-sr-pencil"       label="Edit Profile"  onClick={onClose} />
        {!user?.isGuest && <DItem icon="fi-sr-wallet" label="Wallet" onClick={onClose} />}
        {isStaff && <DItem icon="fi-sr-dashboard" label="Admin Panel" color="#ef4444" onClick={()=>{onClose();window.location.href='/admin'}} />}
        {isOwner && <DItem icon="fi-sr-settings" label="Settings" color="#6b7280" onClick={onClose} />}
        <div style={{ borderTop:'1px solid #f3f4f6', margin:'4px 0' }} />
        <DItem icon="fi-sr-user-logout"  label="Logout" color="#ef4444" onClick={onLogout} />
      </div>
    </div>
  )
}

function DItem({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'9px 10px', background:'none', border:'none', cursor:'pointer', color:color||'#374151', fontSize:'0.84rem', fontWeight:600, borderRadius:7, textAlign:'left', transition:'background .12s' }}
      onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
      onMouseLeave={e=>e.currentTarget.style.background='none'}
    >
      <i className={`fi ${icon}`} style={{ fontSize:14, width:16, textAlign:'center', flexShrink:0 }} />{label}
    </button>
  )
}

// ── LOBBY HEADER ─────────────────────────────────────────────
function LobbyHeader({ user, onLogout }) {
  const [open,   setOpen]   = useState(false)
  const [status, setStatus] = useState('online')
  const ref = useRef(null)

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  const rank   = user?.rank || 'guest'
  const ri     = user?.rankInfo || R(rank)
  const col    = ri.color || '#aaa'
  const icon   = ri.icon  || 'guest.svg'
  const label  = ri.label || rank
  const border = GBR(user?.gender, rank)
  const curSt  = STATUSES.find(s=>s.id===status) || STATUSES[0]

  return (
    <header style={{ background:'#fff', borderBottom:'1px solid #e8eaed', height:56, display:'flex', alignItems:'center', padding:'0 18px', gap:12, position:'sticky', top:0, zIndex:900, boxShadow:'0 1px 4px rgba(0,0,0,.07)' }}>
      {/* Site name - left */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <img src="/favicon/favicon-192.png" alt="" style={{ width:28, height:28, borderRadius:7 }} onError={e=>e.target.style.display='none'} />
        <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:'#111827' }}>
          Chats<span style={{ color:'#1a73e8' }}>GenZ</span>
        </span>
      </div>

      <div style={{ flex:1 }} />

      {/* Right - avatar dropdown */}
      <div ref={ref} style={{ position:'relative' }}>
        <button onClick={()=>setOpen(o=>!o)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:9, padding:'5px 9px', borderRadius:10, transition:'background .15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}
        >
          {/* Avatar with gender border + status dot */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <img src={user?.avatar||'/default_images/avatar/default_guest.png'} alt=""
              style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:`2.5px solid ${border}`, display:'block' }}
              onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
            />
            <span style={{ position:'absolute', bottom:0, right:0, width:9, height:9, background:curSt.color, borderRadius:'50%', border:'2px solid #fff' }} />
          </div>
          {/* Name + rank */}
          <div className="hdr-txt">
            <div style={{ fontSize:'0.84rem', fontWeight:700, color:'#111827', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.username||'Guest'}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
              <img src={`/icons/ranks/${icon}`} alt="" style={{ width:13, height:13 }} onError={e=>e.target.style.display='none'} />
              <span style={{ fontSize:'0.67rem', color:col, fontWeight:700 }}>{label}</span>
            </div>
          </div>
          <i className={`fi fi-sr-angle-${open?'up':'down'}`} style={{ fontSize:10, color:'#9ca3af', flexShrink:0 }} />
        </button>

        {open && (
          <ProfileDropdown
            user={user}
            status={status}
            setStatus={setStatus}
            onLogout={onLogout}
            onClose={()=>setOpen(false)}
          />
        )}
      </div>
      <style>{`@media(max-width:400px){.hdr-txt{display:none!important}}`}</style>
    </header>
  )
}

// ── ROOM CARD ─────────────────────────────────────────────────
function RoomCard({ room, onClick }) {
  const online = room.currentUsers || 0
  const max    = room.maxUsers    || 500
  const pct    = Math.min((online/max)*100, 100)
  const barClr = pct>75?'#ef4444':pct>40?'#f59e0b':'#22c55e'
  const t      = ROOM_TYPE[room.type] || ROOM_TYPE.public

  // minRank icon
  const minRankInfo = R(room.minRank || 'guest')

  return (
    <div onClick={()=>onClick(room)}
      style={{ background:'#fff', border:'1px solid #e8eaed', borderRadius:12, cursor:'pointer', transition:'all .18s', overflow:'hidden' }}
      onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'; e.currentTarget.style.borderColor='#1a73e8'; e.currentTarget.style.transform='translateY(-1px)' }}
      onMouseLeave={e=>{ e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='#e8eaed'; e.currentTarget.style.transform='none' }}
    >
      {/* Room image */}
      <div style={{ height:100, background:'linear-gradient(135deg,#e8f0fe,#ede9fe)', position:'relative', overflow:'hidden' }}>
        <img src={room.icon||'/default_images/rooms/default_room.png'} alt=""
          style={{ width:'100%', height:'100%', objectFit:'cover' }}
          onError={e=>e.target.style.display='none'}
        />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,.3) 0%,transparent 60%)' }} />

        {/* Type badge */}
        <div style={{ position:'absolute', top:7, left:7, display:'flex', alignItems:'center', gap:3, background:t.bg, padding:'2px 8px', borderRadius:20 }}>
          <i className={`fi ${t.icon}`} style={{ fontSize:10, color:t.color }} />
          <span style={{ fontSize:'0.62rem', color:t.color, fontWeight:700 }}>{t.label}</span>
        </div>

        {/* Min rank badge */}
        {room.minRank && room.minRank !== 'guest' && (
          <div style={{ position:'absolute', top:7, right:7, display:'flex', alignItems:'center', gap:3, background:'rgba(0,0,0,.5)', padding:'2px 6px', borderRadius:20 }}>
            <img src={`/icons/ranks/${minRankInfo.icon}`} alt="" style={{ width:10, height:10 }} onError={e=>e.target.style.display='none'} />
            <span style={{ fontSize:'0.6rem', color:'#fff', fontWeight:700 }}>+</span>
          </div>
        )}

        {room.isPinned && <span style={{ position:'absolute', bottom:7, left:7, fontSize:12 }}>📌</span>}
        {room.password && <i className="fi fi-sr-lock" style={{ position:'absolute', bottom:7, right:7, fontSize:11, color:'rgba(255,255,255,.9)' }} />}
      </div>

      {/* Info */}
      <div style={{ padding:'10px 12px' }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'#111827', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {room.name}
        </div>
        {room.description && (
          <div style={{ fontSize:'0.74rem', color:'#6b7280', marginBottom:7, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {room.description}
          </div>
        )}
        {/* Online + bar */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:6, height:6, background:barClr, borderRadius:'50%', flexShrink:0, display:'inline-block' }} />
          <span style={{ fontSize:'0.71rem', color:'#6b7280', fontWeight:600 }}>{online} online</span>
          <div style={{ flex:1, height:2, background:'#f3f4f6', borderRadius:1 }}>
            <div style={{ height:'100%', width:`${pct}%`, background:barClr, borderRadius:1 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN LOBBY ─────────────────────────────────────────────────
export default function ChatLobby() {
  const [user,  setUser]  = useState(null)
  const [rooms, setRooms] = useState([])
  const [load,  setLoad]  = useState(true)
  const [error, setError] = useState('')
  const [search,setSearch]= useState('')
  const [pass,  setPass]  = useState(null)
  const [passV, setPassV] = useState('')
  const [passE, setPassE] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    init()
    const t = setInterval(fetchRooms, 20000)
    return () => clearInterval(t)
  }, [])

  async function init() {
    const token = localStorage.getItem('cgz_token')
    if (!token) { nav('/login'); return }
    // Auto-logout if token expired
    try {
      const r = await fetch(`${API}/api/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
      const d = await r.json()
      if (r.ok && d.user) {
        if (d.freshToken) localStorage.setItem('cgz_token', d.freshToken)
        setUser({ ...d.user, token: d.freshToken||token })
      } else if (r.status===401) {
        // Token expired — auto logout
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
      const r = await fetch(`${API}/api/rooms`, { headers:{ Authorization:`Bearer ${token}` } })
      const d = await r.json()
      if (r.ok) {
        const roomList = d.rooms || []
        // Live counts — no auth required
        try {
          const cr = await fetch(`${API}/api/rooms/live-counts`)
          if (cr.ok) {
            const cd = await cr.json()
            if (cd.counts) roomList.forEach(room => { room.currentUsers = cd.counts[room._id] || 0 })
          }
        } catch {}
        setRooms(roomList)
      } else if (r.status===401) { localStorage.removeItem('cgz_token'); nav('/login') }
      else setError(d.error||'Failed to load rooms')
    } catch { setError('Network error.') }
    finally { setLoad(false) }
  }

  function logout() {
    const token = localStorage.getItem('cgz_token')
    if (token) fetch(`${API}/api/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    localStorage.removeItem('cgz_token')
    nav('/login')
  }

  function join(room) {
    if (room.password) { setPass(room); setPassV(''); setPassE('') }
    else nav(`/chat/${room._id}`)
  }

  const filtered = rooms.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.description||'').toLowerCase().includes(search.toLowerCase()))
  const pinned   = filtered.filter(r=>r.isPinned)
  const regular  = filtered.filter(r=>!r.isPinned)

  return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa' }}>
      <LobbyHeader user={user} onLogout={logout} />

      {/* Search */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8eaed', padding:'10px 18px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', position:'relative' }}>
          <i className="fi fi-sr-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', fontSize:13 }} />
          <input
            style={{ width:'100%', padding:'9px 14px 9px 36px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:9, color:'#111827', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', transition:'border .15s' }}
            placeholder="Search rooms..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
            onFocus={e=>e.target.style.borderColor='#1a73e8'}
            onBlur={e=>e.target.style.borderColor='#e8eaed'}
          />
        </div>
      </div>

      {/* Room grid */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'18px 18px 48px' }}>

        {load && (
          <div style={{ textAlign:'center', padding:'70px 0' }}>
            <div style={{ width:34, height:34, border:'3px solid #e8eaed', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }} />
            <p style={{ color:'#9ca3af', fontSize:'0.875rem' }}>Loading rooms...</p>
          </div>
        )}

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', color:'#dc2626', fontSize:'0.875rem', textAlign:'center', marginBottom:16 }}>
            ⚠️ {error}
            <button onClick={fetchRooms} style={{ background:'none', border:'none', color:'#1a73e8', fontWeight:700, cursor:'pointer', marginLeft:8 }}>Retry</button>
          </div>
        )}

        {!load && !error && (
          <>
            {pinned.length > 0 && (
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#f59e0b', letterSpacing:'1px', textTransform:'uppercase', marginBottom:12 }}>📌 Featured</div>
                <div className="room-grid">{pinned.map(r=><RoomCard key={r._id} room={r} onClick={join}/>)}</div>
              </div>
            )}
            {regular.length===0 && pinned.length===0
              ? <div style={{ textAlign:'center', padding:'48px 20px', color:'#9ca3af' }}>
                  <i className="fi fi-sr-search" style={{ fontSize:32, display:'block', marginBottom:8 }} />
                  <p style={{ fontSize:'0.875rem' }}>{search?'No rooms found':'No rooms available'}</p>
                </div>
              : <div className="room-grid">{regular.map(r=><RoomCard key={r._id} room={r} onClick={join}/>)}</div>
            }
          </>
        )}
      </div>

      {/* Password modal */}
      {pass && (
        <div onClick={()=>setPass(null)} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.45)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:14, padding:'24px 20px', maxWidth:300, width:'100%', boxShadow:'0 16px 48px rgba(0,0,0,.18)' }}>
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <i className="fi fi-sr-lock" style={{ fontSize:28, color:'#6b7280', display:'block', marginBottom:7 }} />
              <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'#111827', fontSize:'0.95rem', marginBottom:3 }}>{pass.name}</h3>
              <p style={{ fontSize:'0.79rem', color:'#6b7280' }}>Enter room password</p>
            </div>
            {passE && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7, padding:'7px 11px', fontSize:'0.79rem', color:'#dc2626', marginBottom:10 }}>{passE}</div>}
            <form onSubmit={e=>{e.preventDefault();if(passV===pass.password)nav(`/chat/${pass._id}`);else setPassE('Wrong password.')}} style={{ display:'flex', flexDirection:'column', gap:9 }}>
              <input type="password"
                style={{ display:'block', width:'100%', padding:'10px 13px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:8, color:'#111827', fontSize:'0.875rem', outline:'none', boxSizing:'border-box' }}
                placeholder="Password" value={passV}
                onChange={e=>{setPassV(e.target.value);setPassE('')}}
                onFocus={e=>e.target.style.borderColor='#1a73e8'}
                onBlur={e=>e.target.style.borderColor='#e8eaed'}
                autoFocus
              />
              <button type="submit" style={{ padding:'11px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:800, fontSize:'0.875rem', fontFamily:'Outfit,sans-serif', cursor:'pointer' }}>Enter Room</button>
              <button type="button" onClick={()=>setPass(null)} style={{ padding:'9px', borderRadius:8, border:'1.5px solid #e8eaed', background:'none', color:'#6b7280', fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:400px){.hdr-txt{display:none!important}}
        .room-grid{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:14px;
        }
        @media(max-width:750px){.room-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:480px){.room-grid{grid-template-columns:1fr}}
      `}</style>
    </div>
  )
}
