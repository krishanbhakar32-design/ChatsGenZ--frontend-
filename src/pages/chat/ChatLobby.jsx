import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ── RANKS ────────────────────────────────────────────────────
const RANKS = {
  guest:      { label:'Guest',      color:'#888888', icon:'guest.svg',      level:1  },
  user:       { label:'User',       color:'#aaaaaa', icon:'user.svg',       level:2  },
  vipfemale:  { label:'VIP Female', color:'#FF4488', icon:'vipfemale.svg',  level:3  },
  vipmale:    { label:'VIP Male',   color:'#4488FF', icon:'vipmale.svg',    level:4  },
  butterfly:  { label:'Butterfly',  color:'#FF66AA', icon:'butterfly.svg',  level:5  },
  ninja:      { label:'Ninja',      color:'#777777', icon:'ninja.svg',      level:6  },
  fairy:      { label:'Fairy',      color:'#FF88CC', icon:'fairy.svg',      level:7  },
  legend:     { label:'Legend',     color:'#FF8800', icon:'legend.png',     level:8  },
  bot:        { label:'Bot',        color:'#00cc88', icon:'bot.svg',        level:9  },
  premium:    { label:'Premium',    color:'#aa44ff', icon:'premium.svg',    level:10 },
  moderator:  { label:'Moderator',  color:'#00AAFF', icon:'moderator.svg',  level:11 },
  admin:      { label:'Admin',      color:'#FF4444', icon:'admin.svg',      level:12 },
  superadmin: { label:'Superadmin', color:'#FF00FF', icon:'superadmin.svg', level:13 },
  owner:      { label:'Owner',      color:'#FFD700', icon:'owner.svg',      level:14 },
}
const GBR = (g,r) => r==='bot'?'#cccccc':({male:'#03add8',female:'#ff99ff',couple:'#9c6fde',other:'#cccccc'}[g]||'#cccccc')
const R = r => RANKS[r] || RANKS.guest
const RL = r => RANKS[r]?.level || 0

// ── ROOM TYPE CONFIG — uses codychat room icons ───────────────
const ROOM_TYPES = {
  public:  { icon:'/default_images/rooms/public_room.svg',  label:'Public',  color:'#1a73e8' },
  private: { icon:'/default_images/rooms/locked_room.svg',  label:'Private', color:'#dc2626' },
  premium: { icon:'/default_images/rooms/vip_room.svg',     label:'VIP',     color:'#7c3aed' },
  staff:   { icon:'/default_images/rooms/staff_room.svg',   label:'Staff',   color:'#d97706' },
  admin:   { icon:'/default_images/rooms/admin_room.svg',   label:'Admin',   color:'#dc2626' },
  member:  { icon:'/default_images/rooms/member_room.svg',  label:'Members', color:'#059669' },
}

// ── PROFILE DROPDOWN ─────────────────────────────────────────
function ProfileDropdown({ user, onClose, onLogout, nav }) {
  const rank   = user?.rank || 'guest'
  const ri     = R(rank)
  const border = GBR(user?.gender, rank)
  const level  = RL(rank)
  const isMod  = level >= 11
  const isAdmin= level >= 12
  const isOwner= level >= 14

  const MenuItem = ({ icon, label, color, onClick, danger }) => (
    <button onClick={()=>{ onClick?.(); onClose() }}
      style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 12px', background:'none', border:'none', cursor:'pointer', color: danger?'#ef4444': color||'#374151', fontSize:'0.84rem', fontWeight:600, borderRadius:7, textAlign:'left', transition:'background .12s' }}
      onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
      onMouseLeave={e=>e.currentTarget.style.background='none'}
    >
      <i className={`fi ${icon}`} style={{ fontSize:15, width:18, textAlign:'center', flexShrink:0, color:'inherit' }} />
      {label}
    </button>
  )

  return (
    <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'#fff', border:'1px solid #e8eaed', borderRadius:14, minWidth:220, boxShadow:'0 8px 32px rgba(0,0,0,.13)', zIndex:1000, overflow:'hidden' }}>
      {/* User card */}
      <div style={{ padding:'14px 14px 12px', background:'linear-gradient(135deg,#f8f9ff,#fff)', borderBottom:'1px solid #f0f0f0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <img src={user?.avatar||'/default_images/avatar/default_guest.png'} alt=""
            style={{ width:46, height:46, borderRadius:'50%', objectFit:'cover', border:`2.5px solid ${border}`, flexShrink:0 }}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
          />
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'0.95rem', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.username}</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
              <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:14, height:14, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
              <span style={{ fontSize:'0.72rem', color:ri.color, fontWeight:800 }}>{ri.label}</span>
            </div>
          </div>
        </div>
        {/* Gold + Level */}
        {!user?.isGuest && (
          <div style={{ display:'flex', gap:14, marginTop:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <img src="/icons/ui/gold.svg" alt="" style={{ width:14, height:14 }} onError={e=>e.target.style.display='none'} />
              <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#d97706' }}>{user?.gold||0} Gold</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <img src="/icons/ui/level.svg" alt="" style={{ width:14, height:14 }} onError={e=>e.target.style.display='none'} />
              <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#1a73e8' }}>Level {user?.level||1}</span>
            </div>
          </div>
        )}
      </div>

      {/* Menu items — rank based */}
      <div style={{ padding:'6px' }}>
        {!user?.isGuest && <MenuItem icon="fi-ss-user"         label="My Profile"     onClick={()=>nav('/profile/'+user?.username)} />}
        {!user?.isGuest && <MenuItem icon="fi-sr-pencil"       label="Edit Profile"   />}
        {!user?.isGuest && <MenuItem icon="fi-sr-wallet"       label="Wallet"         />}
        {isMod  && <MenuItem icon="fi-sr-shield-check"  label="Staff Panel"      color="#00AAFF" />}
        {isAdmin && <MenuItem icon="fi-sr-dashboard"    label="Admin Panel"      color="#FF4444" onClick={()=>nav('/admin')} />}
        {isOwner && <MenuItem icon="fi-sr-settings"     label="Site Settings"    color="#7c3aed" />}
        <div style={{ height:1, background:'#f0f0f0', margin:'4px 2px' }} />
        <MenuItem icon="fi-sr-user-logout" label="Logout" danger onClick={onLogout} />
      </div>
    </div>
  )
}

// ── ADD ROOM MODAL ────────────────────────────────────────────
function AddRoomModal({ onClose, onSave, editRoom }) {
  const [form, setForm] = useState(editRoom || {
    name:'', description:'', type:'public', password:'', minRank:'guest',
    maxUsers:300, isPinned:false, icon:''
  })
  const [iconFile, setIconFile] = useState(null)
  const [iconPreview, setIconPreview] = useState(editRoom?.icon||'')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const token = localStorage.getItem('cgz_token')

  function handleIconChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!['image/png','image/jpeg','image/jpg'].includes(file.type)) { setErr('Only PNG, JPG, JPEG allowed'); return }
    setIconFile(file)
    setIconPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setErr('Room name required'); return }
    setSaving(true); setErr('')
    try {
      let iconUrl = form.icon
      // Upload icon if selected
      if (iconFile) {
        const fd = new FormData(); fd.append('icon', iconFile)
        const ur = await fetch(`${API}/api/upload/room-icon`, { method:'POST', headers:{Authorization:`Bearer ${token}`}, body:fd })
        const ud = await ur.json()
        if (ur.ok) iconUrl = ud.url
      }
      const method = editRoom ? 'PUT' : 'POST'
      const url    = editRoom ? `${API}/api/rooms/${editRoom._id}` : `${API}/api/rooms`
      const r = await fetch(url, {
        method, headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ ...form, icon: iconUrl })
      })
      const d = await r.json()
      if (!r.ok) { setErr(d.error||'Failed'); setSaving(false); return }
      onSave(d.room)
      onClose()
    } catch { setErr('Network error') }
    setSaving(false)
  }

  const F = ({ label, children }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'#374151', marginBottom:5 }}>{label}</label>
      {children}
    </div>
  )
  const inp = { width:'100%', padding:'9px 12px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:8, fontSize:'0.875rem', outline:'none', color:'#111827', boxSizing:'border-box' }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,.45)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:16, maxWidth:440, width:'100%', maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 14px', borderBottom:'1px solid #f0f0f0' }}>
          <div>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:'#111827' }}>
              <i className="fi fi-sr-plus-small" style={{ marginRight:6, color:'#1a73e8' }}/>{editRoom?'Edit':'Add'} Room
            </h2>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8 }}>
            <i className="fi fi-sr-cross-small"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'18px 20px 20px' }}>
          {/* Room Icon */}
          <F label="Room Picture (PNG, JPG, JPEG)">
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:56, height:56, borderRadius:10, background:'#f3f4f6', border:'2px dashed #e8eaed', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                {iconPreview
                  ? <img src={iconPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <i className="fi fi-sr-picture" style={{ fontSize:20, color:'#9ca3af' }}/>
                }
              </div>
              <label style={{ flex:1, padding:'9px 12px', background:'#f9fafb', border:'1.5px dashed #1a73e8', borderRadius:8, cursor:'pointer', fontSize:'0.82rem', color:'#1a73e8', fontWeight:600, textAlign:'center', display:'block' }}>
                <i className="fi fi-sr-upload" style={{ marginRight:6 }}/>Choose Image
                <input type="file" accept=".png,.jpg,.jpeg" style={{ display:'none' }} onChange={handleIconChange} />
              </label>
            </div>
          </F>

          <F label="Room Name *">
            <input style={inp} placeholder="e.g. Global Chat" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e8eaed'} />
          </F>

          <F label="Description">
            <textarea style={{...inp, resize:'vertical', minHeight:72}} placeholder="What's this room about?" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e8eaed'} />
          </F>

          {/* Type + Min Rank row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'#374151', marginBottom:5 }}>Room Type</label>
              <select style={{...inp}} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                {Object.entries(ROOM_TYPES).map(([k,v])=>(
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'#374151', marginBottom:5 }}>Min Rank</label>
              <select style={{...inp}} value={form.minRank} onChange={e=>setForm(p=>({...p,minRank:e.target.value}))}>
                {Object.entries(RANKS).map(([k,v])=>(
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Password */}
          <F label={<span><i className="fi fi-sr-lock" style={{ marginRight:5 }}/>Password (optional)</span>}>
            <input style={inp} type="text" placeholder="Leave empty for no password" value={form.password||''} onChange={e=>setForm(p=>({...p,password:e.target.value}))}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e8eaed'} />
          </F>

          {/* Max Users */}
          <F label="Max Users">
            <input style={inp} type="number" min={10} max={2000} value={form.maxUsers} onChange={e=>setForm(p=>({...p,maxUsers:parseInt(e.target.value)||300}))}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e8eaed'} />
          </F>

          {/* Pin toggle */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'#f9fafb', borderRadius:9, marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <i className="fi fi-sr-thumbtack" style={{ color:'#f59e0b', fontSize:15 }}/>
              <span style={{ fontSize:'0.84rem', fontWeight:600, color:'#374151' }}>Pin this room (Featured)</span>
            </div>
            <button type="button" onClick={()=>setForm(p=>({...p,isPinned:!p.isPinned}))}
              style={{ width:40, height:22, borderRadius:11, border:'none', background:form.isPinned?'#1a73e8':'#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
              <span style={{ position:'absolute', top:2, left:form.isPinned?20:2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
            </button>
          </div>

          {err && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7, padding:'8px 12px', fontSize:'0.8rem', color:'#dc2626', marginBottom:12 }}>{err}</div>}

          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:9, border:'1.5px solid #e8eaed', background:'none', color:'#6b7280', fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>Cancel</button>
            <button type="submit" disabled={saving}
              style={{ flex:2, padding:'11px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:800, cursor:saving?'not-allowed':'pointer', fontSize:'0.875rem', fontFamily:'Outfit,sans-serif', opacity:saving?.7:1 }}>
              <i className={`fi fi-sr-${editRoom?'pencil':'plus-small'}`} style={{ marginRight:6 }}/>
              {saving ? 'Saving...' : editRoom ? 'Save Changes' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── ROOM CARD ─────────────────────────────────────────────────
function RoomCard({ room, myLevel, onClick, onEdit, onDelete, onPin }) {
  const [hovered, setHovered] = useState(false)
  const online   = room.currentUsers || 0
  const typeInfo = ROOM_TYPES[room.type] || ROOM_TYPES.public
  const canManage= myLevel >= 12

  return (
    <div
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{ background:'#fff', border:`1px solid ${hovered?'#1a73e8':'#e8eaed'}`, borderRadius:13, cursor:'pointer', transition:'all .18s', overflow:'visible', position:'relative', boxShadow: hovered?'0 6px 20px rgba(26,115,232,.12)':'none', transform: hovered?'translateY(-2px)':'none' }}
    >
      {/* Admin actions — top right */}
      {canManage && hovered && (
        <div style={{ position:'absolute', top:-8, right:-8, display:'flex', gap:4, zIndex:10 }}>
          <button onClick={e=>{e.stopPropagation();onPin(room)}} title={room.isPinned?'Unpin':'Pin'}
            style={{ width:26, height:26, borderRadius:'50%', border:'none', background:room.isPinned?'#f59e0b':'#6b7280', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, boxShadow:'0 2px 6px rgba(0,0,0,.2)' }}>
            <i className="fi fi-sr-thumbtack"/>
          </button>
          <button onClick={e=>{e.stopPropagation();onEdit(room)}} title="Edit Room"
            style={{ width:26, height:26, borderRadius:'50%', border:'none', background:'#1a73e8', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, boxShadow:'0 2px 6px rgba(0,0,0,.2)' }}>
            <i className="fi fi-sr-pencil"/>
          </button>
          <button onClick={e=>{e.stopPropagation();onDelete(room)}} title="Delete Room"
            style={{ width:26, height:26, borderRadius:'50%', border:'none', background:'#ef4444', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, boxShadow:'0 2px 6px rgba(0,0,0,.2)' }}>
            <i className="fi fi-sr-trash"/>
          </button>
        </div>
      )}

      <div onClick={()=>onClick(room)} style={{ display:'flex', alignItems:'stretch', padding:'12px', gap:12 }}>
        {/* Room picture — LEFT */}
        <div style={{ width:58, height:58, borderRadius:11, overflow:'hidden', flexShrink:0, background:'#f3f4f6', position:'relative' }}>
          <img src={room.icon||'/default_images/rooms/default_room.png'} alt=""
            style={{ width:'100%', height:'100%', objectFit:'cover' }}
            onError={e=>{e.target.src='/default_images/rooms/default_room.png'}}
          />
          {room.isPinned && (
            <div style={{ position:'absolute', top:2, left:2, width:16, height:16, background:'#f59e0b', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="fi fi-sr-thumbtack" style={{ fontSize:8, color:'#fff' }}/>
            </div>
          )}
        </div>

        {/* Info — CENTER */}
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
          {/* Room name — bigger font */}
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'0.98rem', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>
            {room.name}
          </div>
          {/* Description */}
          {room.description && (
            <div style={{ fontSize:'0.76rem', color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.4 }}>
              {room.description}
            </div>
          )}
          {/* Bottom row: type icon + user count */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
            {/* Room type icon */}
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <img src={typeInfo.icon} alt="" style={{ width:14, height:14, objectFit:'contain' }}
                onError={e=>{e.target.style.display='none'}}
              />
              <span style={{ fontSize:'0.69rem', color:typeInfo.color, fontWeight:700 }}>{typeInfo.label}</span>
              {room.password && <i className="fi fi-sr-lock" style={{ fontSize:10, color:'#9ca3af', marginLeft:4 }}/>}
            </div>
            {/* User count — uses user_count.svg from codychat */}
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <img src="/default_images/icons/active.svg" alt="" style={{ width:13, height:13, objectFit:'contain' }}
                onError={e=>{e.target.style.display='none'}}
              />
              <span style={{ fontSize:'0.72rem', color: online>0?'#22c55e':'#9ca3af', fontWeight:700 }}>{online}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN LOBBY ────────────────────────────────────────────────
export default function ChatLobby() {
  const [user,    setUser]    = useState(null)
  const [rooms,   setRooms]   = useState([])
  const [load,    setLoad]    = useState(true)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')
  const [pass,    setPass]    = useState(null)
  const [passV,   setPassV]   = useState('')
  const [passE,   setPassE]   = useState('')
  const [dropOpen,setDrop]    = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editRoom,setEditRoom]= useState(null)
  const dropRef = useRef(null)
  const nav     = useNavigate()
  const token   = localStorage.getItem('cgz_token')

  const myLevel = RANKS[user?.rank]?.level || 0
  const canManage = myLevel >= 12

  useEffect(() => {
    init()
    const t = setInterval(fetchRooms, 20000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const fn = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDrop(false) }
    if (dropOpen) document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [dropOpen])

  async function init() {
    if (!token) { nav('/login'); return }
    try {
      const r = await fetch(`${API}/api/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
      const d = await r.json()
      if (r.ok && d.user) {
        if (d.freshToken) localStorage.setItem('cgz_token', d.freshToken)
        setUser(d.user)
      } else if (r.status===401) { localStorage.removeItem('cgz_token'); nav('/login'); return }
    } catch {}
    fetchRooms()
  }

  async function fetchRooms() {
    if (!localStorage.getItem('cgz_token')) return
    try {
      const r = await fetch(`${API}/api/rooms`, { headers:{ Authorization:`Bearer ${localStorage.getItem('cgz_token')}` } })
      const d = await r.json()
      if (!r.ok) { if(r.status===401){localStorage.removeItem('cgz_token');nav('/login')} else setError(d.error||'Failed'); return }
      const roomList = d.rooms || []
      // Fetch live user counts
      try {
        const cr = await fetch(`${API}/api/rooms/live-counts`)
        if (cr.ok) {
          const cd = await cr.json()
          if (cd.counts) roomList.forEach(room => { room.currentUsers = cd.counts[room._id] || 0 })
        }
      } catch {}
      setRooms(roomList)
    } catch { setError('Network error.') }
    finally { setLoad(false) }
  }

  function logout() {
    if (token) fetch(`${API}/api/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    localStorage.removeItem('cgz_token'); nav('/login')
  }

  function join(room) {
    if (room.password) { setPass(room); setPassV(''); setPassE('') }
    else nav(`/chat/${room._id}`)
  }

  async function handlePin(room) {
    try {
      const r = await fetch(`${API}/api/rooms/${room._id}/pin`, { method:'PUT', headers:{ Authorization:`Bearer ${token}` } })
      if (r.ok) fetchRooms()
    } catch {}
  }

  async function handleDelete(room) {
    if (!confirm(`Delete "${room.name}"?`)) return
    try {
      const r = await fetch(`${API}/api/rooms/${room._id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
      if (r.ok) setRooms(p=>p.filter(x=>x._id!==room._id))
    } catch {}
  }

  function handleSaveRoom(saved) {
    setRooms(p => {
      const idx = p.findIndex(r=>r._id===saved._id)
      if (idx>=0) { const n=[...p]; n[idx]=saved; return n }
      return [saved,...p]
    })
    fetchRooms()
  }

  const filtered = rooms.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.description||'').toLowerCase().includes(search.toLowerCase()))
  const pinned   = filtered.filter(r=>r.isPinned)
  const regular  = filtered.filter(r=>!r.isPinned)

  const ri     = user ? (user.rankInfo || R(user.rank)) : R('guest')
  const border = GBR(user?.gender, user?.rank)

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5', fontFamily:'Nunito,sans-serif' }}>

      {/* ── HEADER ── */}
      <header style={{ background:'#fff', borderBottom:'1px solid #e4e6ea', height:54, display:'flex', alignItems:'center', padding:'0 20px', position:'sticky', top:0, zIndex:900, boxShadow:'0 1px 4px rgba(0,0,0,.08)' }}>
        {/* Site name — LEFT */}
        <div style={{ display:'flex', alignItems:'center', gap:9, flexShrink:0 }}>
          <img src="/favicon/favicon-192.png" alt="" style={{ width:30, height:30, borderRadius:8 }} onError={e=>e.target.style.display='none'} />
          <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.1rem', letterSpacing:'-0.3px' }}>
            <span style={{ color:'#111827' }}>Chats</span><span style={{ color:'#1a73e8' }}>GenZ</span>
          </span>
        </div>

        <div style={{ flex:1 }} />

        {/* Add Room button — admin/owner only */}
        {canManage && (
          <button onClick={()=>setShowAdd(true)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', border:'none', borderRadius:9, cursor:'pointer', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'0.82rem', marginRight:10, flexShrink:0 }}>
            <i className="fi fi-sr-plus-small" style={{ fontSize:14 }}/>Add Room
          </button>
        )}

        {/* Avatar + dropdown — RIGHT */}
        <div ref={dropRef} style={{ position:'relative', flexShrink:0 }}>
          <button onClick={()=>setDrop(o=>!o)}
            style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:8, padding:'4px 8px', borderRadius:10, transition:'background .15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
            onMouseLeave={e=>e.currentTarget.style.background='none'}
          >
            <div style={{ position:'relative' }}>
              <img src={user?.avatar||'/default_images/avatar/default_guest.png'} alt=""
                style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:`2.5px solid ${border}`, display:'block' }}
                onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
              />
              <span style={{ position:'absolute', bottom:0, right:0, width:9, height:9, background:'#22c55e', borderRadius:'50%', border:'2px solid #fff' }} />
            </div>
            <div className="hdr-name">
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.85rem', color:'#111827', maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.username||'...'}</div>
              <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:1 }}>
                <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:11, height:11 }} onError={e=>e.target.style.display='none'} />
                <span style={{ fontSize:'0.64rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
              </div>
            </div>
            <i className={`fi fi-sr-angle-${dropOpen?'up':'down'}`} style={{ fontSize:10, color:'#9ca3af' }}/>
          </button>

          {dropOpen && (
            <ProfileDropdown
              user={user}
              onClose={()=>setDrop(false)}
              onLogout={logout}
              nav={nav}
            />
          )}
        </div>
      </header>

      {/* ── SEARCH ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e4e6ea', padding:'10px 20px' }}>
        <div style={{ maxWidth:860, margin:'0 auto', position:'relative' }}>
          <i className="fi fi-sr-search" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', fontSize:13, pointerEvents:'none' }}/>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search rooms..."
            style={{ width:'100%', padding:'9px 14px 9px 38px', background:'#f9fafb', border:'1.5px solid #e4e6ea', borderRadius:10, color:'#111827', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', transition:'border .15s' }}
            onFocus={e=>e.target.style.borderColor='#1a73e8'}
            onBlur={e=>e.target.style.borderColor='#e4e6ea'}
          />
        </div>
      </div>

      {/* ── ROOMS ── */}
      <div style={{ maxWidth:860, margin:'0 auto', padding:'18px 20px 48px' }}>

        {load && (
          <div style={{ textAlign:'center', padding:'72px 0' }}>
            <div style={{ width:36, height:36, border:'3px solid #e8eaed', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 14px' }}/>
            <p style={{ color:'#9ca3af', fontSize:'0.875rem', fontWeight:600 }}>Loading rooms...</p>
          </div>
        )}

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', color:'#dc2626', fontSize:'0.875rem', textAlign:'center', marginBottom:16 }}>
            <i className="fi fi-sr-triangle-warning" style={{ marginRight:7 }}/>
            {error}
            <button onClick={fetchRooms} style={{ background:'none', border:'none', color:'#1a73e8', fontWeight:700, cursor:'pointer', marginLeft:10 }}>Retry</button>
          </div>
        )}

        {!load && !error && (
          <>
            {/* Pinned */}
            {pinned.length > 0 && (
              <div style={{ marginBottom:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                  <i className="fi fi-sr-thumbtack" style={{ fontSize:13, color:'#f59e0b' }}/>
                  <span style={{ fontSize:'0.72rem', fontWeight:800, color:'#f59e0b', letterSpacing:'1px', textTransform:'uppercase' }}>Featured</span>
                </div>
                <div className="room-grid">
                  {pinned.map(r=>(
                    <RoomCard key={r._id} room={r} myLevel={myLevel} onClick={join}
                      onEdit={r=>setEditRoom(r)} onDelete={handleDelete} onPin={handlePin}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All rooms */}
            {regular.length===0 && pinned.length===0 ? (
              <div style={{ textAlign:'center', padding:'56px 20px' }}>
                <i className="fi fi-sr-search" style={{ fontSize:36, color:'#d1d5db', display:'block', marginBottom:12 }}/>
                <p style={{ color:'#9ca3af', fontWeight:600 }}>{search?'No rooms match your search':'No rooms available yet'}</p>
              </div>
            ) : (
              regular.length > 0 && (
                <>
                  {pinned.length > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                      <i className="fi fi-sr-apps" style={{ fontSize:13, color:'#9ca3af' }}/>
                      <span style={{ fontSize:'0.72rem', fontWeight:800, color:'#9ca3af', letterSpacing:'1px', textTransform:'uppercase' }}>All Rooms</span>
                    </div>
                  )}
                  <div className="room-grid">
                    {regular.map(r=>(
                      <RoomCard key={r._id} room={r} myLevel={myLevel} onClick={join}
                        onEdit={r=>setEditRoom(r)} onDelete={handleDelete} onPin={handlePin}
                      />
                    ))}
                  </div>
                </>
              )
            )}
          </>
        )}
      </div>

      {/* Password modal */}
      {pass && (
        <div onClick={()=>setPass(null)} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.45)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:16, padding:'26px 22px', maxWidth:310, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ textAlign:'center', marginBottom:18 }}>
              <div style={{ width:52, height:52, background:'#f3f4f6', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                <i className="fi fi-sr-lock" style={{ fontSize:22, color:'#6b7280' }}/>
              </div>
              <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'#111827', fontSize:'1rem', marginBottom:4 }}>{pass.name}</h3>
              <p style={{ fontSize:'0.8rem', color:'#6b7280' }}>This room is password protected</p>
            </div>
            {passE && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7, padding:'7px 12px', fontSize:'0.8rem', color:'#dc2626', marginBottom:10 }}>{passE}</div>}
            <form onSubmit={e=>{e.preventDefault();if(passV===pass.password)nav(`/chat/${pass._id}`);else setPassE('Wrong password.')}} style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <input type="password" autoFocus
                style={{ display:'block', width:'100%', padding:'11px 14px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:9, color:'#111827', fontSize:'0.875rem', outline:'none', boxSizing:'border-box' }}
                placeholder="Enter password" value={passV}
                onChange={e=>{setPassV(e.target.value);setPassE('')}}
                onFocus={e=>e.target.style.borderColor='#1a73e8'}
                onBlur={e=>e.target.style.borderColor='#e8eaed'}
              />
              <button type="submit" style={{ padding:'11px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:800, fontSize:'0.875rem', fontFamily:'Outfit,sans-serif', cursor:'pointer' }}>
                <i className="fi fi-sr-arrow-right" style={{ marginRight:6 }}/>Enter Room
              </button>
              <button type="button" onClick={()=>setPass(null)} style={{ padding:'9px', borderRadius:9, border:'1.5px solid #e8eaed', background:'none', color:'#6b7280', fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit room modal */}
      {(showAdd || editRoom) && (
        <AddRoomModal
          editRoom={editRoom}
          onClose={()=>{ setShowAdd(false); setEditRoom(null) }}
          onSave={handleSaveRoom}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media(max-width:380px){ .hdr-name { display:none!important } }
        .room-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
        }
        @media(max-width:580px){ .room-grid { grid-template-columns: 1fr } }
      `}</style>
    </div>
  )
}
