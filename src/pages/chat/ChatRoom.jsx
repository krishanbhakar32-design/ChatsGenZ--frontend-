import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ── CONSTANTS ────────────────────────────────────────────────
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
const GBR = (g, r) => r==='bot'?'transparent':({male:'#03add8',female:'#ff99ff',couple:'#9c6fde',other:'#cccccc'}[g]||'#cccccc')
const R   = r => RANKS[r] || RANKS.guest
const RL  = r => RANKS[r]?.level || 0

// ── PROFILE MINI CARD (hover/click on username) ──────────────
function MiniCard({ user, myLevel, anchorPos, onClose, onOpenFull, socket, roomId }) {
  if (!user) return null
  const ri      = R(user.rank)
  const bdr     = GBR(user.gender, user.rank)
  const canAct  = myLevel >= 11 && RL(user.rank) < myLevel
  const isSelf  = false // handled by caller

  return (
    <div onMouseLeave={onClose} style={{
      position:'fixed', zIndex:9999,
      top: Math.min(anchorPos.y, window.innerHeight - 280),
      left: Math.min(anchorPos.x, window.innerWidth - 220),
      background:'#fff', border:'1px solid #e8eaed',
      borderRadius:12, minWidth:200, boxShadow:'0 8px 28px rgba(0,0,0,.15)',
      overflow:'hidden',
    }}>
      {/* Cover strip with rank color */}
      <div style={{ height:40, background:`linear-gradient(135deg,${ri.color}33,#e8f0fe)` }} />
      <div style={{ display:'flex', alignItems:'flex-end', gap:10, padding:'0 12px', marginTop:-22 }}>
        <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt=""
          style={{ width:44, height:44, borderRadius:'50%', border:`2.5px solid ${bdr}`, objectFit:'cover', background:'#fff' }}
          onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
        />
        <div style={{ paddingBottom:6 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.88rem', color:'#111827' }}>{user.username}</div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:11, height:11 }} onError={e=>e.target.style.display='none'} />
            <span style={{ fontSize:'0.67rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
          </div>
        </div>
      </div>
      {/* Actions */}
      <div style={{ padding:'8px', borderTop:'1px solid #f3f4f6', marginTop:8 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
          <MiniBtn icon="fi-sr-circle-user" label="Profile" onClick={onOpenFull} />
          <MiniBtn icon="fi-sr-comments" label="PM" />
          <MiniBtn icon="fi-sr-phone-call" label="Call" />
          <MiniBtn icon="fi-sr-gift" label="Gift" color="#7c3aed" />
          {myLevel >= 2 && <MiniBtn icon="fi-sr-user-add" label="Add Friend" color="#059669" />}
          {canAct && <MiniBtn icon="fi-sr-volume-mute" label="Mute" color="#f59e0b" onClick={()=>socket?.emit('muteUser',{roomId,userId:user._id,minutes:5})} />}
          {canAct && <MiniBtn icon="fi-sr-user-slash" label="Kick" color="#ef4444" onClick={()=>{socket?.emit('kickUser',{roomId,userId:user._id});onClose()}} />}
          {myLevel >= 12 && RL(user.rank) < myLevel && <MiniBtn icon="fi-sr-ban" label="Ban" color="#dc2626" />}
        </div>
      </div>
    </div>
  )
}
function MiniBtn({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 8px', background:'#f9fafb', border:'1px solid #e8eaed', borderRadius:7, cursor:'pointer', fontSize:'0.74rem', fontWeight:600, color:color||'#374151', transition:'all .12s' }}
      onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}}
      onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e8eaed'}}
    >
      <i className={`fi ${icon}`} style={{ fontSize:12 }} />{label}
    </button>
  )
}

// ── FULL PROFILE MODAL ────────────────────────────────────────
function ProfileModal({ user, myLevel, socket, roomId, onClose }) {
  if (!user) return null
  const ri     = R(user.rank)
  const bdr    = GBR(user.gender, user.rank)
  const canMod = myLevel >= 11 && RL(user.rank) < myLevel
  const canBan = myLevel >= 12 && RL(user.rank) < myLevel
  const isOwner= myLevel >= 14

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:18, maxWidth:320, width:'100%', overflow:'hidden', boxShadow:'0 16px 48px rgba(0,0,0,.18)' }}>
        {/* Cover */}
        <div style={{ height:80, background:`linear-gradient(135deg,${ri.color}44,#e8f0fe)`, position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', top:10, right:10, background:'rgba(255,255,255,.8)', border:'none', width:28, height:28, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
            <i className="fi fi-sr-cross-small"/>
          </button>
          {user.countryCode && user.countryCode!=='ZZ' && (
            <img src={`/icons/flags/${user.countryCode.toLowerCase()}.png`} alt="" style={{ position:'absolute', bottom:8, right:10, width:20, height:14 }} onError={e=>e.target.style.display='none'} />
          )}
        </div>
        {/* Avatar */}
        <div style={{ display:'flex', justifyContent:'center', marginTop:-36 }}>
          <img src={user.avatar||'/default_images/avatar/default_guest.png'}
            style={{ width:72, height:72, borderRadius:'50%', border:`3px solid ${bdr}`, objectFit:'cover', background:'#fff' }}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
          />
        </div>
        <div style={{ padding:'10px 18px 18px', textAlign:'center' }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1rem', color:'#111827' }}>{user.username}</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginTop:4, marginBottom:10 }}>
            <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:14, height:14 }} onError={e=>e.target.style.display='none'} />
            <span style={{ fontSize:'0.73rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
          </div>
          {user.mood && <p style={{ fontSize:'0.78rem', color:'#6b7280', marginBottom:10, fontStyle:'italic' }}>"{user.mood}"</p>}
          {user.about && <p style={{ fontSize:'0.78rem', color:'#6b7280', marginBottom:12, lineHeight:1.5 }}>{user.about}</p>}
          {/* Stats */}
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:14 }}>
            <StatBox label="Level" value={user.level||1} color="#1a73e8" />
            <StatBox label="Gold" value={user.gold||0} color="#d97706" icon="/icons/ui/gold.svg" />
            <StatBox label="Msgs" value={user.totalMessages||0} color="#7c3aed" />
          </div>
          {/* Action buttons — rank-based */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center' }}>
            <PBtn icon="fi-sr-comments" label="Private" />
            <PBtn icon="fi-sr-phone-call" label="Call" />
            <PBtn icon="fi-sr-gift" label="Gift" color="#7c3aed" />
            <PBtn icon="fi-sr-user-add" label="Add Friend" color="#059669" />
            {canMod && <PBtn icon="fi-sr-volume-mute" label="Mute" color="#f59e0b" onClick={()=>socket?.emit('muteUser',{roomId,userId:user._id,minutes:5})} />}
            {canMod && <PBtn icon="fi-sr-user-slash" label="Kick" color="#ef4444" onClick={()=>{socket?.emit('kickUser',{roomId,userId:user._id});onClose()}} />}
            {canBan && <PBtn icon="fi-sr-ban" label="Ban" color="#dc2626" />}
            {isOwner && <PBtn icon="fi-sr-shield-check" label="Set Rank" color="#1a73e8" />}
            {canMod && <PBtn icon="fi-sr-eye-crossed" label="Ghost" color="#6b7280" />}
            <PBtn icon="fi-sr-flag" label="Report" color="#ef4444" />
          </div>
        </div>
      </div>
    </div>
  )
}
function StatBox({ label, value, color, icon }) {
  return (
    <div style={{ textAlign:'center', background:'#f9fafb', borderRadius:8, padding:'6px 12px', minWidth:60 }}>
      <div style={{ fontSize:'0.62rem', color:'#9ca3af' }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:3, justifyContent:'center' }}>
        {icon && <img src={icon} style={{ width:12, height:12 }} onError={e=>e.target.style.display='none'} />}
        <div style={{ fontSize:'0.88rem', fontWeight:800, color }}>{value}</div>
      </div>
    </div>
  )
}
function PBtn({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 10px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:8, cursor:'pointer', fontSize:'0.76rem', fontWeight:600, color:color||'#374151', transition:'all .12s' }}
      onMouseEnter={e=>{e.currentTarget.style.background='#f0f7ff';e.currentTarget.style.borderColor=color||'#1a73e8'}}
      onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e8eaed'}}
    >
      <i className={`fi ${icon}`} style={{ fontSize:12 }}/>{label}
    </button>
  )
}

// ── MESSAGE ───────────────────────────────────────────────────
function Msg({ msg, myId, myLevel, onMiniCard, onMention }) {
  const isSystem = msg.type === 'system'
  const ri       = R(msg.sender?.rank)
  const bdr      = GBR(msg.sender?.gender, msg.sender?.rank)
  const nameCol  = msg.sender?.nameColor || ri.color
  const ts       = new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})

  if (isSystem) return (
    <div style={{ textAlign:'center', padding:'3px 16px' }}>
      <span style={{ fontSize:'0.7rem', color:'#9ca3af', background:'#f3f4f6', padding:'2px 12px', borderRadius:20 }}>{msg.content}</span>
    </div>
  )

  // Parse @mentions
  const renderContent = (text) => {
    if (!text) return text
    const parts = text.split(/(@\w+)/g)
    return parts.map((p, i) => p.startsWith('@')
      ? <span key={i} style={{ color:'#1a73e8', fontWeight:700, cursor:'pointer' }} onClick={()=>onMention(p.slice(1))}>{p}</span>
      : p
    )
  }

  const handleNameClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onMiniCard(msg.sender, { x: rect.left, y: rect.bottom + 4 })
  }

  return (
    <div style={{ display:'flex', gap:8, padding:'3px 12px', alignItems:'flex-start' }}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,.02)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      {/* Avatar */}
      <img src={msg.sender?.avatar||'/default_images/avatar/default_guest.png'} alt=""
        onClick={handleNameClick}
        style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${bdr}`, flexShrink:0, cursor:'pointer', marginTop:2 }}
        onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
      />
      <div style={{ flex:1, minWidth:0 }}>
        {/* Name + rank + time */}
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3, flexWrap:'wrap' }}>
          <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:11, height:11, flexShrink:0 }} onError={e=>e.target.style.display='none'} />
          <span onClick={handleNameClick} style={{ fontSize:'0.79rem', fontWeight:700, color:nameCol, cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'}
            onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}
          >{msg.sender?.username}</span>
          <span style={{ fontSize:'0.63rem', color:'#9ca3af' }}>{ts}</span>
        </div>
        {/* Message bubble */}
        <div style={{ background:'#f3f4f6', color:'#111827', padding:'8px 12px', borderRadius:'4px 14px 14px 14px', fontSize:'0.875rem', lineHeight:1.55, wordBreak:'break-word', display:'inline-block', maxWidth:'85%' }}>
          {msg.type==='gift'  ? <span>🎁 {msg.content}</span>
          : msg.type==='image' ? <img src={msg.content} alt="" style={{ maxWidth:200, borderRadius:8, display:'block' }} />
          : renderContent(msg.content)
          }
        </div>
        {/* Reply/report on hover */}
        <div style={{ marginTop:3, display:'flex', gap:8 }}>
          <button onClick={()=>onMention('@'+msg.sender?.username+' ')} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:'0.68rem', padding:0 }}>
            Reply
          </button>
        </div>
      </div>
    </div>
  )
}

// ── USER ITEM ─────────────────────────────────────────────────
function UserItem({ u, myLevel, onClick }) {
  const ri = R(u.rank)
  return (
    <div onClick={()=>onClick(u)}
      style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 10px', cursor:'pointer', transition:'background .12s' }}
      onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <div style={{ position:'relative', flexShrink:0 }}>
        <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt=""
          style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${GBR(u.gender,u.rank)}` }}
          onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
        />
        <span style={{ position:'absolute', bottom:0, right:0, width:6, height:6, background:'#22c55e', borderRadius:'50%', border:'1.5px solid #fff' }} />
      </div>
      <span style={{ flex:1, fontSize:'0.79rem', fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {u.username}
      </span>
      <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:13, height:13, flexShrink:0 }} onError={e=>e.target.style.display='none'} />
      {u.countryCode && u.countryCode!=='ZZ' && (
        <img src={`/icons/flags/${u.countryCode.toLowerCase()}.png`} alt="" style={{ width:16, height:11, flexShrink:0, borderRadius:1 }} onError={e=>e.target.style.display='none'} />
      )}
    </div>
  )
}

// ── RIGHT SIDEBAR ─────────────────────────────────────────────
function RightSidebar({ users, myLevel, tab, setTab, onUserClick, onClose }) {
  const [search, setSearch] = useState('')
  const sorted = [...users].sort((a,b)=>{
    const d=(RANKS[b.rank]?.level||0)-(RANKS[a.rank]?.level||0)
    return d!==0?d:(a.username||'').localeCompare(b.username||'')
  })
  const staff   = sorted.filter(u=>RL(u.rank)>=11)
  const friends = sorted.filter(u=>u.isFriend)
  const filtered= tab==='staff'?staff:tab==='friends'?friends:sorted.filter(u=>!search||u.username.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ width:210, borderLeft:'1px solid #e8eaed', background:'#fff', display:'flex', flexDirection:'column', flexShrink:0 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', borderBottom:'1px solid #e8eaed', padding:'0 4px' }}>
        {[
          { id:'users',   icon:'fi-sr-users',        label:'Users'   },
          { id:'friends', icon:'fi-sr-user',          label:'Friends' },
          { id:'staff',   icon:'fi-sr-shield-check',  label:'Staff'   },
          { id:'search',  icon:'fi-sr-search',        label:'Search'  },
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} title={t.label}
            style={{ flex:1, padding:'9px 2px', border:'none', background:'none', cursor:'pointer', borderBottom:`2px solid ${tab===t.id?'#1a73e8':'transparent'}`, color:tab===t.id?'#1a73e8':'#9ca3af', fontSize:14, transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className={`fi ${t.icon}`}/>
          </button>
        ))}
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:'4px 6px', fontSize:14 }}>
          <i className="fi fi-sr-cross-small"/>
        </button>
      </div>

      {/* Search input */}
      {tab==='search' && (
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #f3f4f6' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search users..."
            style={{ width:'100%', padding:'7px 10px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:7, fontSize:'0.8rem', outline:'none', boxSizing:'border-box', color:'#111827' }}
            onFocus={e=>e.target.style.borderColor='#1a73e8'}
            onBlur={e=>e.target.style.borderColor='#e8eaed'}
          />
        </div>
      )}

      {/* Count */}
      <div style={{ padding:'5px 10px 2px', fontSize:'0.63rem', fontWeight:700, color:'#9ca3af', letterSpacing:'1px', textTransform:'uppercase' }}>
        {tab==='staff'?'Staff':'Online'} · {filtered.length}
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {filtered.length===0 && (
          <p style={{ textAlign:'center', color:'#9ca3af', fontSize:'0.77rem', padding:'16px 10px' }}>
            {tab==='friends'?'No friends online':tab==='staff'?'No staff online':'No users'}
          </p>
        )}
        {filtered.map((u,i)=><UserItem key={u.userId||i} u={u} myLevel={myLevel} onClick={onUserClick}/>)}
      </div>
    </div>
  )
}

// ── LEFT SIDEBAR ──────────────────────────────────────────────
function LeftSidebar({ room, onClose, nav }) {
  return (
    <div style={{ width:48, background:'#f8f9fa', borderRight:'1px solid #e8eaed', display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 0', gap:2, flexShrink:0 }}>
      {[
        { icon:'fi-sr-house-chimney', title:'Room List',   fn:()=>nav('/chat') },
        { icon:'fi-sr-rss',           title:'Wall/Feed'    },
        { icon:'fi-sr-newspaper',     title:'News'         },
        { icon:'fi-sr-dice',          title:'Games'        },
        { icon:'fi-sr-store-alt',     title:'Store'        },
        { icon:'fi-sr-medal',         title:'Leaderboard'  },
        { icon:'fi-sr-life-ring',     title:'Help'         },
      ].map((item,i)=>(
        <button key={i} title={item.title} onClick={item.fn}
          style={{ width:36, height:36, borderRadius:8, border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', fontSize:16, transition:'all .12s', flexShrink:0 }}
          onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.color='#1a73e8'}}
          onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#6b7280'}}
        >
          <i className={`fi ${item.icon}`}/>
        </button>
      ))}
    </div>
  )
}

// ── INPUT BAR ─────────────────────────────────────────────────
function InputBar({ connected, onSend, inputRef, input, setInput }) {
  return (
    <div style={{ borderTop:'1px solid #e8eaed', padding:'8px 10px', background:'#fff', flexShrink:0 }}>
      <form onSubmit={onSend} style={{ display:'flex', alignItems:'center', gap:6 }}>
        <button type="button" title="Emoji" style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:20, padding:'0 2px', flexShrink:0, display:'flex', alignItems:'center' }}>
          <i className="fi fi-rr-smile"/>
        </button>
        <button type="button" title="Upload Image" style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, padding:'0 2px', flexShrink:0, display:'flex', alignItems:'center' }}>
          <i className="fi fi-sr-picture"/>
        </button>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          placeholder={connected?'Type a message...':'Connecting...'}
          disabled={!connected}
          style={{ flex:1, padding:'9px 14px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:22, color:'#111827', fontSize:'0.875rem', outline:'none', transition:'border-color .15s' }}
          onFocus={e=>e.target.style.borderColor='#1a73e8'}
          onBlur={e=>e.target.style.borderColor='#e8eaed'}
        />
        <button type="button" title="Send Gift" style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, padding:'0 2px', flexShrink:0, display:'flex', alignItems:'center' }}>
          <i className="fi fi-sr-gift"/>
        </button>
        <button type="submit" disabled={!input.trim()||!connected}
          style={{ width:36, height:36, borderRadius:'50%', border:'none', background:input.trim()&&connected?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6', color:input.trim()&&connected?'#fff':'#9ca3af', cursor:input.trim()&&connected?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, transition:'all .15s' }}>
          <i className="fi fi-sr-paper-plane"/>
        </button>
      </form>
    </div>
  )
}

// ── MAIN CHATROOM ─────────────────────────────────────────────
export default function ChatRoom() {
  const { roomId } = useParams()
  const nav        = useNavigate()
  const token      = localStorage.getItem('cgz_token')

  const [me,        setMe]       = useState(null)
  const [room,      setRoom]     = useState(null)
  const [messages,  setMsgs]     = useState([])
  const [users,     setUsers]    = useState([])
  const [input,     setInput]    = useState('')
  const [rightTab,  setRightTab] = useState('users')
  const [showRight, setRight]    = useState(true)
  const [showLeft,  setLeft]     = useState(false)
  const [profUser,  setProf]     = useState(null)
  const [miniCard,  setMiniCard] = useState(null) // {user, pos}
  const [loading,   setLoad]     = useState(true)
  const [roomErr,   setErr]      = useState('')
  const [connected, setConn]     = useState(false)
  const [notifCount, setNotif]   = useState({ dm:0, friends:0, notif:0, reports:0 })

  const sockRef  = useRef(null)
  const bottomRef= useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!token) { nav('/login'); return }
    loadRoom()
    return () => sockRef.current?.disconnect()
  }, [roomId])

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages])

  async function loadRoom() {
    setLoad(true); setErr('')
    try {
      const [mr, rr] = await Promise.all([
        fetch(`${API}/api/auth/me`,         { headers:{Authorization:`Bearer ${token}`} }),
        fetch(`${API}/api/rooms/${roomId}`,  { headers:{Authorization:`Bearer ${token}`} }),
      ])
      if (mr.status===401) { localStorage.removeItem('cgz_token'); nav('/login'); return }
      const md = await mr.json()
      if (md.user) {
        if (md.freshToken) localStorage.setItem('cgz_token', md.freshToken)
        setMe(md.user)
      }
      const rd = await rr.json()
      if (!rr.ok) { setErr(rd.error||'Room not found'); setLoad(false); return }
      setRoom(rd.room)
      fetch(`${API}/api/rooms/${roomId}/messages?limit=50`, { headers:{Authorization:`Bearer ${token}`} })
        .then(r=>r.json()).then(d=>{ if(d.messages) setMsgs(d.messages) }).catch(()=>{})
    } catch { setErr('Connection failed.') }
    setLoad(false)
    connectSocket()
  }

  function connectSocket() {
    sockRef.current?.disconnect()
    const s = io(API, { auth:{token}, transports:['websocket','polling'] })
    s.on('connect',        ()   => { setConn(true); s.emit('joinRoom',{roomId}) })
    s.on('disconnect',     ()   => setConn(false))
    s.on('messageHistory', msgs => setMsgs(msgs||[]))
    s.on('newMessage',     msg  => setMsgs(p=>[...p,msg]))
    s.on('roomUsers',      list => setUsers(list||[]))
    s.on('userJoined',     u    => {
      setUsers(p=>p.find(x=>x.userId===u.userId)?p:[...p,u])
      setMsgs(p=>[...p,{_id:Date.now(),type:'system',content:`${u.username} joined`,createdAt:new Date()}])
    })
    s.on('userLeft', u => {
      setUsers(p=>p.filter(x=>x.userId!==u.userId))
      setMsgs(p=>[...p,{_id:Date.now()+'l',type:'system',content:`${u.username} left`,createdAt:new Date()}])
    })
    s.on('systemMessage', m => setMsgs(p=>[...p,{_id:Date.now()+'s',type:'system',content:m.text,createdAt:new Date()}]))
    s.on('messageDeleted',id => setMsgs(p=>p.filter(m=>m._id!==id)))
    s.on('error', e => console.error('Socket:',e))
    sockRef.current = s
  }

  function send(e) {
    e.preventDefault()
    const t = input.trim()
    if (!t||!sockRef.current||!connected) return
    sockRef.current.emit('sendMessage',{roomId,content:t,type:'text'})
    setInput(''); inputRef.current?.focus()
  }

  function leave() { sockRef.current?.disconnect(); nav('/chat') }

  const myLevel = RANKS[me?.rank]?.level || 1
  const myRi    = R(me?.rank)
  const myBdr   = GBR(me?.gender, me?.rank)
  const isStaff = myLevel >= 11

  const handleMiniCard = (user, pos) => setMiniCard({ user, pos })

  const handleMention = useCallback((name) => {
    setInput(p => p + name + ' ')
    inputRef.current?.focus()
  }, [])

  if (!loading && roomErr) return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div style={{ fontSize:40 }}>⚠️</div>
      <p style={{ color:'#374151', fontWeight:600 }}>{roomErr}</p>
      <button onClick={()=>nav('/chat')} style={{ padding:'10px 22px', borderRadius:9, border:'none', background:'#1a73e8', color:'#fff', fontWeight:700, cursor:'pointer' }}>← Back to Lobby</button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:32, height:32, border:'3px solid #e8eaed', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 10px' }} />
        <p style={{ color:'#9ca3af', fontSize:'0.875rem' }}>Joining room...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#fff', overflow:'hidden' }}>

      {/* ── HEADER (codychat style) ── */}
      <div style={{ height:48, background:'#fff', borderBottom:'1px solid #e8eaed', display:'flex', alignItems:'center', padding:'0 8px', gap:4, flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>

        {/* Left: hamburger (toggle left sidebar) */}
        <HBtn icon="fi-sr-bars-sort" title="Menu" active={showLeft} onClick={()=>setLeft(s=>!s)} badge={0} />

        {/* Logo - hidden on mobile */}
        <div className="desk-logo" style={{ display:'flex', alignItems:'center', gap:6, padding:'0 4px', flexShrink:0 }}>
          <img src="/favicon/favicon-192.png" alt="" style={{ width:22, height:22, borderRadius:5 }} onError={e=>e.target.style.display='none'} />
          <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'0.85rem', color:'#111827' }}>Chats<span style={{ color:'#1a73e8' }}>GenZ</span></span>
        </div>

        <div style={{ flex:1 }} />

        {/* Right: DM, Friends, Notifications, Reports (staff), Avatar */}
        <HBtn icon="fi-sr-envelope"   title="Private Messages" badge={notifCount.dm} />
        <HBtn icon="fi-sr-user-add"   title="Friend Requests"  badge={notifCount.friends} />
        <HBtn icon="fi-sr-bell"       title="Notifications"    badge={notifCount.notif} />
        {isStaff && <HBtn icon="fi-sr-flag" title="Reports" badge={notifCount.reports} />}

        {/* Cam icon (custom uploaded) */}
        <button title="Webcam" style={{ background:'none', border:'none', cursor:'pointer', width:34, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <img src="/icons/ui/webcam.png" alt="Cam" style={{ width:22, height:22, objectFit:'contain' }} onError={e=>{ e.target.style.display='none'; e.target.parentNode.innerHTML='<i class="fi fi-sr-video-camera" style="font-size:16px;color:#9ca3af"></i>' }} />
        </button>

        {/* User list toggle */}
        <HBtn icon="fi-sr-users" title="User List" active={showRight} onClick={()=>setRight(s=>!s)} />

        {/* My avatar */}
        <div style={{ position:'relative', cursor:'pointer', flexShrink:0 }} title="My Profile">
          <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
            style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover', border:`2px solid ${myBdr}`, display:'block' }}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
          />
          <span style={{ position:'absolute', bottom:0, right:0, width:7, height:7, background:'#22c55e', borderRadius:'50%', border:'1.5px solid #fff' }} />
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Left sidebar */}
        {showLeft && <LeftSidebar room={room} nav={nav} onClose={()=>setLeft(false)} />}

        {/* Messages */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }} onClick={()=>setMiniCard(null)}>
            {messages.map((m,i)=>(
              <Msg key={m._id||i} msg={m} myId={me?._id} myLevel={myLevel}
                onMiniCard={handleMiniCard}
                onMention={handleMention}
              />
            ))}
            <div ref={bottomRef}/>
          </div>

          <InputBar connected={connected} onSend={send} inputRef={inputRef} input={input} setInput={setInput} />
        </div>

        {/* Right sidebar */}
        {showRight && (
          <RightSidebar
            users={users}
            myLevel={myLevel}
            tab={rightTab}
            setTab={setRightTab}
            onUserClick={u=>setProf(u)}
            onClose={()=>setRight(false)}
          />
        )}
      </div>

      {/* ── MOBILE FOOTER ── */}
      <div className="mob-footer" style={{ display:'none', background:'#fff', borderTop:'1px solid #e8eaed', padding:'5px 8px', gap:2, justifyContent:'space-around', alignItems:'center' }}>
        <FBtn icon="fi-sr-bars-sort"    active={showLeft}  onClick={()=>setLeft(s=>!s)} />
        <FBtn icon="fi-sr-users"        active={showRight} onClick={()=>setRight(s=>!s)} />
        <FBtn icon="fi-sr-envelope" />
        <FBtn icon="fi-sr-dice" />
        <FBtn icon="fi-sr-sign-out" onClick={leave} />
      </div>

      {/* Mini card on hover */}
      {miniCard && (
        <MiniCard
          user={miniCard.user}
          myLevel={myLevel}
          anchorPos={miniCard.pos}
          onClose={()=>setMiniCard(null)}
          onOpenFull={()=>{ setProf(miniCard.user); setMiniCard(null) }}
          socket={sockRef.current}
          roomId={roomId}
        />
      )}

      {/* Full profile modal */}
      {profUser && (
        <ProfileModal
          user={profUser}
          myLevel={myLevel}
          socket={sockRef.current}
          roomId={roomId}
          onClose={()=>setProf(null)}
        />
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:768px){
          .desk-logo{display:none!important}
        }
        @media(max-width:640px){
          .right-pnl{display:none!important}
          .mob-footer{display:flex!important}
        }
      `}</style>
    </div>
  )
}

// Icon button with optional notification badge
function HBtn({ icon, title, active, onClick, badge }) {
  return (
    <button onClick={onClick} title={title} style={{ position:'relative', background:active?'#e8f0fe':'none', border:'none', cursor:'pointer', color:active?'#1a73e8':'#9ca3af', width:34, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, transition:'all .15s', flexShrink:0 }}
      onMouseEnter={e=>{if(!active){e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.color='#374151'}}}
      onMouseLeave={e=>{if(!active){e.currentTarget.style.background='none';e.currentTarget.style.color='#9ca3af'}}}
    >
      <i className={`fi ${icon}`}/>
      {badge > 0 && (
        <span style={{ position:'absolute', top:4, right:4, width:8, height:8, background:'#ef4444', borderRadius:'50%', border:'1.5px solid #fff' }} />
      )}
    </button>
  )
}
function FBtn({ icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background:active?'#e8f0fe':'none', border:'none', cursor:'pointer', color:active?'#1a73e8':'#9ca3af', width:44, height:38, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
      <i className={`fi ${icon}`}/>
    </button>
  )
}
