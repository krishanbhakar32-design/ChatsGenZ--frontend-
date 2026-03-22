/**
 * ChatLobby.jsx — FINAL FIXED
 * avatar: /default_images/avatar/default_guest.png ✅
 * rank icons: /icons/ranks/ ✅
 * room icons: /default_images/rooms/ ✅
 * Profile nav: /profile/:username ✅
 * PassModal sends password to ChatRoom via location state ✅
 */
import { useState, useEffect, useRef } from 'react'
import { useToast } from '../../components/Toast.jsx'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'
const DEFAULT_AVATAR = '/default_images/avatar/default_guest.png'

const RANKS = {
  guest:      { label:'Guest',      color:'#888888', icon:'guest.svg',       level:1  },
  user:       { label:'User',       color:'#aaaaaa', icon:'user.svg',        level:2  },
  vipfemale:  { label:'VIP Female', color:'#FF4488', icon:'vip_female.svg',  level:3  },
  vipmale:    { label:'VIP Male',   color:'#4488FF', icon:'vip_male.svg',    level:4  },
  butterfly:  { label:'Butterfly',  color:'#FF66AA', icon:'butterfly.svg',   level:5  },
  ninja:      { label:'Ninja',      color:'#777777', icon:'ninja.svg',       level:6  },
  fairy:      { label:'Fairy',      color:'#FF88CC', icon:'fairy.svg',       level:7  },
  legend:     { label:'Legend',     color:'#FF8800', icon:'legend.png',      level:8  },
  bot:        { label:'Bot',        color:'#00cc88', icon:'bot.svg',         level:9  },
  premium:    { label:'Premium',    color:'#aa44ff', icon:'premium.svg',     level:10 },
  moderator:  { label:'Moderator',  color:'#00AAFF', icon:'mod.svg',         level:11 },
  admin:      { label:'Admin',      color:'#FF4444', icon:'admin.svg',       level:12 },
  superadmin: { label:'Superadmin', color:'#FF00FF', icon:'super_admin.svg', level:13 },
  owner:      { label:'Owner',      color:'#FFD700', icon:'owner.svg',       level:14 },
}
const GBR = (g, r) => r==='bot'?'#cccccc':({male:'#03add8',female:'#ff99ff',couple:'#9c6fde',other:'#cccccc'}[g]||'#cccccc')
const R   = r => RANKS[r] || RANKS.guest
const RL  = r => RANKS[r]?.level || 0

const ROOM_TYPES = {
  public:  { icon:'/default_images/rooms/public_room.svg',  label:'Public',  color:'#1a73e8', fi:'fi-sr-globe'      },
  private: { icon:'/default_images/rooms/locked_room.svg',  label:'Private', color:'#dc2626', fi:'fi-sr-lock'       },
  staff:   { icon:'/default_images/rooms/staff_room.svg',   label:'Staff',   color:'#d97706', fi:'fi-sr-shield'     },
  admin:   { icon:'/default_images/rooms/admin_room.svg',   label:'Admin',   color:'#dc2626', fi:'fi-sr-dashboard'  },
  member:  { icon:'/default_images/rooms/member_room.svg',  label:'Members', color:'#059669', fi:'fi-sr-user-check' },
}

function ProfileDropdown({ user, onClose, onLogout }) {
  const nav = useNavigate()
  const ri = R(user?.rank)
  const border = GBR(user?.gender, user?.rank)
  const isAdmin = RL(user?.rank) >= 12
  return (
    <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'#fff', border:'1px solid #e4e6ea', borderRadius:14, minWidth:210, boxShadow:'0 8px 32px rgba(0,0,0,.14)', zIndex:1000, overflow:'hidden' }}>
      <div style={{ padding:'14px 14px 12px', borderBottom:'1px solid #f0f2f5' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <img src={user?.avatar || DEFAULT_AVATAR} alt=""
            style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', border:`2.5px solid ${border}`, flexShrink:0 }}
            onError={e => { e.target.src=DEFAULT_AVATAR }}
          />
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'0.95rem', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.username}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
              <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:13, height:13 }} onError={e => e.target.style.display='none'} />
              <span style={{ fontSize:'0.72rem', color:ri.color, fontWeight:800 }}>{ri.label}</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding:'5px' }}>
        <DItem icon="fi-ss-user"      label="My Profile" onClick={() => { onClose(); nav(`/profile/${user?.username}`) }} />
        {isAdmin && <DItem icon="fi-sr-dashboard" label="Admin Panel" color="#FF4444" onClick={() => { onClose(); window.location.href='/admin' }} />}
        <div style={{ height:1, background:'#f0f2f5', margin:'3px 2px' }}/>
        <DItem icon="fi-sr-user-logout" label="Logout" danger onClick={() => { onClose(); onLogout() }} />
      </div>
    </div>
  )
}

function DItem({ icon, label, color, danger, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 11px', background:hov?'#f0f2f5':'none', border:'none', cursor:'pointer', color:danger?'#ef4444':color||'#374151', fontSize:'0.84rem', fontWeight:600, borderRadius:8, textAlign:'left', transition:'background .12s' }}>
      <i className={`fi ${icon}`} style={{ fontSize:15, width:18, textAlign:'center', flexShrink:0 }} />
      {label}
    </button>
  )
}

function RoomModal({ editRoom, onClose, onSave }) {
  const token = localStorage.getItem('cgz_token')
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')
  const [prev, setPrev]     = useState(editRoom?.icon || '')
  const [file, setFile]     = useState(null)
  const [form, setForm]     = useState({
    name:        editRoom?.name        || '',
    description: editRoom?.description || '',
    type:        editRoom?.type        || 'public',
    password:    editRoom?.password    || '',
    minRank:     editRoom?.minRank     || 'guest',
    isPinned:    editRoom?.isPinned    || false,
  })
  const set = (k, v) => setForm(p => ({...p, [k]:v}))

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setErr('Room name required'); return }
    setSaving(true); setErr('')
    try {
      let iconUrl = editRoom?.icon || '/default_images/rooms/default_room.png'
      if (file) {
        const fd = new FormData(); fd.append('icon', file)
        const ur = await fetch(`${API}/api/upload/room-icon`, { method:'POST', headers:{ Authorization:`Bearer ${token}` }, body:fd })
        const ud = await ur.json()
        if (ur.ok && ud.url) iconUrl = ud.url
      }
      const r = await fetch(editRoom ? `${API}/api/rooms/${editRoom._id}` : `${API}/api/rooms`, {
        method: editRoom ? 'PUT' : 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ ...form, icon: iconUrl })
      })
      const d = await r.json()
      if (!r.ok) { setErr(d.error || 'Failed'); setSaving(false); return }
      onSave(d.room)
    } catch { setErr('Network error') }
    setSaving(false)
  }

  const inp = { width:'100%', padding:'10px 13px', background:'#f9fafb', border:'1.5px solid #e4e6ea', borderRadius:9, fontSize:'0.875rem', outline:'none', color:'#111827', boxSizing:'border-box', fontFamily:'Nunito,sans-serif', transition:'border-color .15s' }
  const onF = e => e.target.style.borderColor = '#1a73e8'
  const onB = e => e.target.style.borderColor = '#e4e6ea'

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,.5)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:18, maxWidth:460, width:'100%', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,.22)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 16px', borderBottom:'1px solid #f0f2f5' }}>
          <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:'#111827' }}>
            <i className={`fi fi-sr-${editRoom?'pencil':'plus-small'}`} style={{ color:'#1a73e8', marginRight:8 }}/>
            {editRoom ? 'Edit Room' : 'Add Room'}
          </h2>
          <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', width:32, height:32, borderRadius:8, cursor:'pointer', color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>
            <i className="fi fi-sr-cross-small"/>
          </button>
        </div>
        <form onSubmit={submit} style={{ padding:'18px 20px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Room icon */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:64, height:64, borderRadius:12, overflow:'hidden', background:'#f3f4f6', flexShrink:0, border:'1.5px solid #e4e6ea' }}>
              <img src={prev || '/default_images/rooms/default_room.png'} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.src='/default_images/rooms/default_room.png' }}/>
            </div>
            <label style={{ flex:1, padding:'10px 14px', background:'#f0f7ff', border:'1.5px dashed #1a73e8', borderRadius:9, cursor:'pointer', fontSize:'0.82rem', color:'#1a73e8', fontWeight:700, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
              <i className="fi fi-sr-upload"/>Upload Image
              <input type="file" accept=".png,.jpg,.jpeg" style={{ display:'none' }} onChange={e => { const f=e.target.files[0]; if(f){setFile(f);setPrev(URL.createObjectURL(f))} }}/>
            </label>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'#374151', marginBottom:6 }}>Room Name *</label>
            <input style={inp} placeholder="e.g. Global Chat" value={form.name} onChange={e => set('name',e.target.value)} onFocus={onF} onBlur={onB}/>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'#374151', marginBottom:6 }}>Description</label>
            <textarea style={{...inp, resize:'vertical', minHeight:70, lineHeight:1.5}} placeholder="What's this room about?" value={form.description} onChange={e => set('description',e.target.value)} onFocus={onF} onBlur={onB}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'#374151', marginBottom:6 }}>Room Type</label>
              <select style={{...inp, cursor:'pointer'}} value={form.type} onChange={e => set('type',e.target.value)} onFocus={onF} onBlur={onB}>
                <option value="public">🌐 Public</option>
                <option value="private">🔒 Private</option>
                <option value="staff">🛡️ Staff</option>
                <option value="admin">⚙️ Admin</option>
                <option value="member">👥 Members</option>
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'#374151', marginBottom:6 }}>Min Rank</label>
              <select style={{...inp, cursor:'pointer'}} value={form.minRank} onChange={e => set('minRank',e.target.value)} onFocus={onF} onBlur={onB}>
                {Object.entries(RANKS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'#374151', marginBottom:6 }}>Password <span style={{ fontWeight:400, color:'#9ca3af' }}>(optional)</span></label>
            <input style={inp} placeholder="Leave empty for no lock" value={form.password} onChange={e => set('password',e.target.value)} onFocus={onF} onBlur={onB}/>
          </div>
          {/* Pin toggle */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#f9fafb', border:'1.5px solid #e4e6ea', borderRadius:9 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <i className="fi fi-sr-thumbtack" style={{ color:'#f59e0b', fontSize:16 }}/>
              <div>
                <div style={{ fontSize:'0.84rem', fontWeight:700, color:'#374151' }}>Pin Room</div>
                <div style={{ fontSize:'0.72rem', color:'#9ca3af' }}>Show in Featured</div>
              </div>
            </div>
            <button type="button" onClick={() => set('isPinned',!form.isPinned)}
              style={{ width:44, height:24, borderRadius:12, border:'none', background:form.isPinned?'#1a73e8':'#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
              <span style={{ position:'absolute', top:3, left:form.isPinned?22:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.25)' }}/>
            </button>
          </div>
          {err && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'9px 13px', fontSize:'0.8rem', color:'#dc2626' }}>{err}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:10, border:'1.5px solid #e4e6ea', background:'none', color:'#6b7280', fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex:2, padding:'12px', borderRadius:10, border:'none', background:saving?'#9ca3af':'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:800, cursor:saving?'not-allowed':'pointer', fontSize:'0.875rem', fontFamily:'Outfit,sans-serif' }}>
              {saving ? 'Saving...' : editRoom ? 'Save Changes' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RoomCard({ room, myLevel, onClick, onEdit, onDelete, onPin }) {
  const [hov, setHov] = useState(false)
  const typeInfo = ROOM_TYPES[room.type] || ROOM_TYPES.public
  const canAdmin = myLevel >= 12

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'#fff', border:`1.5px solid ${hov?'#1a73e8':'#e4e6ea'}`, borderRadius:12, cursor:'pointer', transition:'all .18s', position:'relative', boxShadow:hov?'0 4px 18px rgba(26,115,232,.13)':'0 1px 4px rgba(0,0,0,.06)', transform:hov?'translateY(-2px)':'none' }}
    >
      {canAdmin && hov && (
        <div onClick={e => e.stopPropagation()} style={{ position:'absolute', top:-10, right:-10, display:'flex', gap:4, zIndex:10 }}>
          <AdminBtn icon="fi-sr-thumbtack" bg={room.isPinned?'#f59e0b':'#9ca3af'} title={room.isPinned?'Unpin':'Pin'}    onClick={() => onPin(room)}   />
          <AdminBtn icon="fi-sr-pencil"    bg="#1a73e8"                            title="Edit Room"                      onClick={() => onEdit(room)}  />
          <AdminBtn icon="fi-sr-trash"     bg="#ef4444"                            title="Delete Room"                    onClick={() => onDelete(room)}/>
        </div>
      )}
      <div onClick={() => onClick(room)} style={{ display:'flex', alignItems:'center', padding:'12px 14px', gap:12 }}>
        <div style={{ width:60, height:60, borderRadius:11, overflow:'hidden', flexShrink:0, background:'#f3f4f6' }}>
          <img src={room.icon || '/default_images/rooms/default_room.png'} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={e => { e.target.src='/default_images/rooms/default_room.png' }}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1rem', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>{room.name}</div>
          <div style={{ fontSize:'0.76rem', color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:7 }}>{room.description || 'No description'}</div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <img src={typeInfo.icon} alt="" style={{ width:16, height:16, objectFit:'contain' }} onError={e => { e.target.style.display='none' }}/>
            <span style={{ fontSize:'0.7rem', color:typeInfo.color, fontWeight:700 }}>{typeInfo.label}</span>
            {room.password && <i className="fi fi-sr-lock" style={{ fontSize:11, color:'#9ca3af' }}/>}
            {room.isPinned && <i className="fi fi-sr-thumbtack" style={{ fontSize:11, color:'#f59e0b' }}/>}
            <div style={{ flex:1 }}/>
            <span style={{ fontSize:'0.85rem', fontWeight:800, color:(room.currentUsers||0)>0?'#22c55e':'#9ca3af' }}>{room.currentUsers||0}</span>
            <img src="/default_images/rooms/user_count.svg" alt="" style={{ width:16, height:16 }} onError={e => { e.target.outerHTML='<i class="fi fi-sr-user" style="font-size:13px;color:#9ca3af"></i>' }}/>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminBtn({ icon, bg, title, onClick }) {
  return (
    <button onClick={onClick} title={title}
      style={{ width:28, height:28, borderRadius:'50%', border:'none', background:bg, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, boxShadow:'0 2px 8px rgba(0,0,0,.25)', flexShrink:0 }}>
      <i className={`fi ${icon}`}/>
    </button>
  )
}

function PassModal({ room, onClose, onEnter }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState('')
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1500, background:'rgba(0,0,0,.5)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:18, padding:'28px 24px', maxWidth:320, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,.22)', textAlign:'center' }}>
        <div style={{ width:56, height:56, background:'#f3f4f6', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
          <i className="fi fi-sr-lock" style={{ fontSize:22, color:'#6b7280' }}/>
        </div>
        <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'#111827', fontSize:'1rem', marginBottom:5 }}>{room.name}</h3>
        <p style={{ fontSize:'0.8rem', color:'#9ca3af', marginBottom:16 }}>Enter room password to continue</p>
        {err && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'8px 12px', fontSize:'0.8rem', color:'#dc2626', marginBottom:12 }}>{err}</div>}
        <form onSubmit={e => { e.preventDefault(); if (val.trim()) onEnter(val.trim()); else setErr('Enter password') }}
          style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <input type="password" autoFocus value={val} onChange={e => { setVal(e.target.value); setErr('') }}
            placeholder="Password"
            style={{ width:'100%', padding:'11px 14px', background:'#f9fafb', border:'1.5px solid #e4e6ea', borderRadius:10, fontSize:'0.875rem', outline:'none', boxSizing:'border-box', color:'#111827', textAlign:'center', letterSpacing:3 }}
            onFocus={e => e.target.style.borderColor='#1a73e8'}
            onBlur={e => e.target.style.borderColor='#e4e6ea'}
          />
          <button type="submit" style={{ padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:800, fontSize:'0.9rem', fontFamily:'Outfit,sans-serif', cursor:'pointer' }}>
            <i className="fi fi-sr-arrow-right" style={{ marginRight:7 }}/>Enter Room
          </button>
          <button type="button" onClick={onClose} style={{ padding:'10px', borderRadius:10, border:'1.5px solid #e4e6ea', background:'none', color:'#6b7280', fontWeight:600, fontSize:'0.84rem', cursor:'pointer' }}>Cancel</button>
        </form>
      </div>
    </div>
  )
}

export default function ChatLobby() {
  const [user,      setUser]     = useState(null)
  const [rooms,     setRooms]    = useState([])
  const [load,      setLoad]     = useState(true)
  const [error,     setError]    = useState('')
  const [search,    setSearch]   = useState('')
  const [passRoom,  setPassRoom] = useState(null)
  const [dropOpen,  setDrop]     = useState(false)
  const [showModal, setModal]    = useState(false)
  const [editRoom,  setEditRoom] = useState(null)
  const dropRef = useRef(null)
  const nav     = useNavigate()
  const toast   = useToast()
  const token   = localStorage.getItem('cgz_token')
  const myLevel = RL(user?.rank)
  const canAdmin = myLevel >= 12

  useEffect(() => {
    if (!token) { nav('/login'); return }
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
    try {
      const r = await fetch(`${API}/api/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
      const d = await r.json()
      if (r.ok && d.user) { if (d.freshToken) localStorage.setItem('cgz_token', d.freshToken); setUser(d.user) }
      else if (r.status === 401) { localStorage.removeItem('cgz_token'); nav('/login'); return }
    } catch {}
    fetchRooms()
  }

  async function fetchRooms() {
    const tk = localStorage.getItem('cgz_token')
    if (!tk) return
    try {
      const r = await fetch(`${API}/api/rooms`, { headers:{ Authorization:`Bearer ${tk}` } })
      const d = await r.json()
      if (!r.ok) { if (r.status===401){ localStorage.removeItem('cgz_token'); nav('/login') } else setError(d.error||'Failed'); return }
      const list = d.rooms || []
      try {
        const cr = await fetch(`${API}/api/rooms/live-counts`)
        if (cr.ok) { const cd = await cr.json(); if (cd.counts) list.forEach(room => { room.currentUsers = cd.counts[room._id] || 0 }) }
      } catch {}
      setRooms(list)
    } catch { setError('Network error') }
    finally { setLoad(false) }
  }

  function logout() {
    if (token) fetch(`${API}/api/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    localStorage.removeItem('cgz_token'); nav('/login')
  }

  function join(room) {
    const typeMin = { staff:11, admin:12, member:2 }
    const minLevel = typeMin[room.type]
    if (minLevel && myLevel < minLevel) { toast?.show(`This room requires ${room.type} rank or higher`,'error',4000); return }
    if (room.password) setPassRoom(room)
    else nav(`/chat/${room._id}`)
  }

  // Pass password via location state to ChatRoom
  function enterPassRoom(password) {
    nav(`/chat/${passRoom._id}`, { state:{ enteredPassword: password } })
    setPassRoom(null)
  }

  async function handlePin(room) {
    try {
      await fetch(`${API}/api/rooms/${room._id}/pin`, { method:'PUT', headers:{ Authorization:`Bearer ${token}` } })
      fetchRooms()
    } catch {}
  }

  async function handleDelete(room) {
    if (!window.confirm(`Delete "${room.name}"?`)) return
    try {
      await fetch(`${API}/api/rooms/${room._id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
      setRooms(p => p.filter(x => x._id !== room._id))
      toast?.show('Room deleted','success')
    } catch {}
  }

  function handleSave(saved) {
    setRooms(p => { const idx=p.findIndex(r=>r._id===saved._id); if(idx>=0){const n=[...p];n[idx]=saved;return n} return [saved,...p] })
    setModal(false); setEditRoom(null)
    setTimeout(fetchRooms, 500)
  }

  const ri     = R(user?.rank)
  const border = GBR(user?.gender, user?.rank)
  const filtered = rooms.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.description||'').toLowerCase().includes(search.toLowerCase()))
  const pinned   = filtered.filter(r => r.isPinned)
  const regular  = filtered.filter(r => !r.isPinned)

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5' }}>
      {/* HEADER */}
      <header style={{ background:'#fff', borderBottom:'1px solid #e4e6ea', height:54, display:'flex', alignItems:'center', padding:'0 20px', position:'sticky', top:0, zIndex:900, boxShadow:'0 1px 4px rgba(0,0,0,.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, flexShrink:0 }}>
          <img src="/favicon/favicon-192.png" alt="" style={{ width:30, height:30, borderRadius:8 }} onError={e => e.target.style.display='none'} />
          <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.15rem', letterSpacing:'-0.3px' }}>
            <span style={{ color:'#111827' }}>Chats</span><span style={{ color:'#1a73e8' }}>GenZ</span>
          </span>
        </div>
        <div style={{ flex:1 }}/>
        <div ref={dropRef} style={{ position:'relative' }}>
          <button onClick={() => setDrop(o=>!o)} style={{ background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:'50%', display:'flex' }}>
            <div style={{ position:'relative' }}>
              <img src={user?.avatar || DEFAULT_AVATAR} alt=""
                style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:`2.5px solid ${border}`, display:'block' }}
                onError={e => { e.target.src=DEFAULT_AVATAR }}
              />
              <span style={{ position:'absolute', bottom:1, right:1, width:9, height:9, background:'#22c55e', borderRadius:'50%', border:'2px solid #fff' }}/>
            </div>
          </button>
          {dropOpen && <ProfileDropdown user={user} onClose={() => setDrop(false)} onLogout={logout}/>}
        </div>
      </header>

      {/* SEARCH + ADD */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e4e6ea', padding:'10px 20px' }}>
        <div style={{ maxWidth:860, margin:'0 auto', display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ flex:1, position:'relative' }}>
            <i className="fi fi-sr-search" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', fontSize:13, pointerEvents:'none' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms..."
              style={{ width:'100%', padding:'9px 14px 9px 38px', background:'#f9fafb', border:'1.5px solid #e4e6ea', borderRadius:10, color:'#111827', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', transition:'border .15s', fontFamily:'Nunito,sans-serif' }}
              onFocus={e => e.target.style.borderColor='#1a73e8'}
              onBlur={e => e.target.style.borderColor='#e4e6ea'}
            />
          </div>
          {canAdmin && (
            <button onClick={() => setModal(true)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'0.84rem', flexShrink:0, boxShadow:'0 2px 8px rgba(26,115,232,.3)' }}>
              <i className="fi fi-sr-plus-small" style={{ fontSize:15 }}/>
              <span className="add-room-txt">Add Room</span>
            </button>
          )}
        </div>
      </div>

      {/* ROOM LIST */}
      <div style={{ maxWidth:860, margin:'0 auto', padding:'18px 20px 52px' }}>
        {load && (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ width:36, height:36, border:'3px solid #e4e6ea', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 14px' }}/>
            <p style={{ color:'#9ca3af', fontWeight:600, fontSize:'0.875rem' }}>Loading rooms...</p>
          </div>
        )}
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', color:'#dc2626', fontSize:'0.875rem', textAlign:'center', marginBottom:16 }}>
            {error} <button onClick={fetchRooms} style={{ background:'none', border:'none', color:'#1a73e8', fontWeight:700, cursor:'pointer', marginLeft:6 }}>Retry</button>
          </div>
        )}
        {!load && !error && (
          <>
            {pinned.length > 0 && (
              <section style={{ marginBottom:28 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                  <i className="fi fi-sr-thumbtack" style={{ fontSize:13, color:'#f59e0b' }}/>
                  <span style={{ fontSize:'0.73rem', fontWeight:800, color:'#f59e0b', letterSpacing:'1.5px', textTransform:'uppercase' }}>Featured</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {pinned.map(r => <RoomCard key={r._id} room={r} myLevel={myLevel} onClick={join} onEdit={setEditRoom} onDelete={handleDelete} onPin={handlePin}/>)}
                </div>
              </section>
            )}
            {regular.length === 0 && pinned.length === 0 ? (
              <div style={{ textAlign:'center', padding:'64px 20px' }}>
                <i className="fi fi-sr-search" style={{ fontSize:40, color:'#d1d5db', display:'block', marginBottom:12 }}/>
                <p style={{ color:'#9ca3af', fontWeight:700, fontSize:'0.95rem' }}>{search?'No rooms match':'No rooms yet'}</p>
                {canAdmin && !search && (
                  <button onClick={() => setModal(true)} style={{ marginTop:14, padding:'10px 20px', borderRadius:10, border:'none', background:'#1a73e8', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
                    <i className="fi fi-sr-plus-small" style={{ marginRight:6 }}/>Create First Room
                  </button>
                )}
              </div>
            ) : regular.length > 0 && (
              <section>
                {pinned.length > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                    <i className="fi fi-sr-apps" style={{ fontSize:13, color:'#9ca3af' }}/>
                    <span style={{ fontSize:'0.73rem', fontWeight:800, color:'#9ca3af', letterSpacing:'1.5px', textTransform:'uppercase' }}>All Rooms</span>
                  </div>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {regular.map(r => <RoomCard key={r._id} room={r} myLevel={myLevel} onClick={join} onEdit={setEditRoom} onDelete={handleDelete} onPin={handlePin}/>)}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {passRoom && <PassModal room={passRoom} onClose={() => setPassRoom(null)} onEnter={enterPassRoom}/>}
      {(showModal || editRoom) && <RoomModal editRoom={editRoom||null} onClose={() => { setModal(false); setEditRoom(null) }} onSave={handleSave}/>}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media(max-width:480px){ .add-room-txt { display:none } }
      `}</style>
    </div>
  )
}
