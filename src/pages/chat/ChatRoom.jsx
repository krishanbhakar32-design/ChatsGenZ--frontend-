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
const GENDER_BORDER = {
  male:'#03add8', female:'#ff99ff', couple:'#9c6fde', other:'#cccccc'
}
const R   = r => RANKS[r] || RANKS.guest
const GBR = (gender, rank) => rank==='bot' ? '#cccccc' : (GENDER_BORDER[gender]||'#cccccc')

// ── LEFT SIDEBAR ITEMS ───────────────────────────────────────
const LEFT_ITEMS = [
  { icon:'fi-sr-house-chimney', title:'Room List',    id:'rooms'       },
  { icon:'fi-sr-newspaper',     title:'News',         id:'news'        },
  { icon:'fi-sr-dice',          title:'Games',        id:'games'       },
  { icon:'fi-sr-store-alt',     title:'Store',        id:'store'       },
  { icon:'fi-sr-medal',         title:'Leaderboard',  id:'leaderboard' },
  { icon:'fi-sr-life-ring',     title:'Help',         id:'help'        },
]

// ── USER ITEM (right panel) ──────────────────────────────────
function UserItem({ u, onClick }) {
  const ri  = R(u.rank)
  const bdr = GBR(u.gender, u.rank)
  return (
    <div onClick={()=>onClick(u)} style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 10px', cursor:'pointer', transition:'background .12s' }}
      onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      {/* Avatar */}
      <div style={{ position:'relative', flexShrink:0 }}>
        <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt=""
          style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${bdr}`, display:'block' }}
          onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
        />
        <span style={{ position:'absolute', bottom:0, right:0, width:6, height:6, background:'#22c55e', borderRadius:'50%', border:'1.5px solid #fff' }} />
      </div>
      {/* Username */}
      <span style={{ flex:1, fontSize:'0.8rem', fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {u.username}
      </span>
      {/* Rank icon */}
      <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:14, height:14, objectFit:'contain', flexShrink:0 }} onError={e=>e.target.style.display='none'} />
      {/* Country flag */}
      {u.countryCode && u.countryCode !== 'ZZ' && (
        <img src={`/icons/flags/${u.countryCode?.toLowerCase()}.png`} alt="" style={{ width:16, height:11, flexShrink:0 }} onError={e=>e.target.style.display='none'} />
      )}
    </div>
  )
}

// ── MESSAGE ──────────────────────────────────────────────────
function Message({ msg, myId, onUserClick }) {
  const isSystem = msg.type === 'system'
  const ri       = R(msg.sender?.rank)
  const bdr      = GBR(msg.sender?.gender, msg.sender?.rank)
  const nameCol  = msg.sender?.nameColor || ri.color

  const dt = new Date(msg.createdAt)
  const timeStr = dt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
  const dateStr = dt.toLocaleDateString([], {day:'2-digit', month:'short'})

  if (isSystem) return (
    <div style={{ textAlign:'center', padding:'4px 16px', margin:'2px 0' }}>
      <span style={{ fontSize:'0.71rem', color:'#9ca3af', background:'#f3f4f6', padding:'3px 12px', borderRadius:20 }}>
        {msg.content}
      </span>
    </div>
  )

  // ALL messages left-aligned (codychat style)
  return (
    <div style={{ display:'flex', gap:8, padding:'4px 12px', alignItems:'flex-start' }}>
      {/* Avatar */}
      <img
        src={msg.sender?.avatar||'/default_images/avatar/default_guest.png'}
        onClick={()=>onUserClick(msg.sender)}
        style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${bdr}`, flexShrink:0, cursor:'pointer', marginTop:2 }}
        onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
      />
      <div style={{ flex:1, minWidth:0 }}>
        {/* Name + rank + time */}
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3, flexWrap:'wrap' }}>
          <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:11, height:11, objectFit:'contain', flexShrink:0 }} onError={e=>e.target.style.display='none'} />
          <span
            onClick={()=>onUserClick(msg.sender)}
            style={{ fontSize:'0.78rem', fontWeight:700, color:nameCol, cursor:'pointer' }}
          >
            {msg.sender?.username}
          </span>
          <span style={{ fontSize:'0.65rem', color:'#9ca3af' }}>{dateStr} {timeStr}</span>
        </div>
        {/* Bubble */}
        <div style={{ background:'#f3f4f6', color:'#111827', padding:'8px 12px', borderRadius:'4px 14px 14px 14px', fontSize:'0.875rem', lineHeight:1.55, wordBreak:'break-word', display:'inline-block', maxWidth:'80%' }}>
          {msg.type==='gift'
            ? <span>🎁 {msg.content}</span>
            : msg.type==='image'
            ? <img src={msg.content} alt="img" style={{ maxWidth:200, borderRadius:8, display:'block' }} />
            : msg.content
          }
        </div>
      </div>
    </div>
  )
}

// ── PROFILE MODAL ─────────────────────────────────────────────
function ProfileModal({ user, myRankLevel, onClose, socket, roomId }) {
  if (!user) return null
  const ri  = R(user.rank)
  const bdr = GBR(user.gender, user.rank)
  const canKick = myRankLevel >= 11 && (RANKS[user.rank]?.level||0) < myRankLevel

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,.35)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:16, maxWidth:260, width:'100%', overflow:'hidden', boxShadow:'0 12px 40px rgba(0,0,0,.15)' }}>
        <div style={{ height:56, background:`linear-gradient(135deg,${ri.color}22,#e8f0fe)`, position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', top:8, right:8, background:'rgba(255,255,255,.8)', border:'none', width:24, height:24, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>
            <i className="fi fi-sr-cross-small"/>
          </button>
        </div>
        <div style={{ display:'flex', justifyContent:'center', marginTop:-26 }}>
          <img src={user.avatar||'/default_images/avatar/default_guest.png'}
            style={{ width:52, height:52, borderRadius:'50%', border:`2.5px solid ${bdr}`, objectFit:'cover' }}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
          />
        </div>
        <div style={{ padding:'7px 16px 16px', textAlign:'center' }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'0.95rem', color:'#111827', marginBottom:4 }}>{user.username}</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:10 }}>
            <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:13, height:13 }} onError={e=>e.target.style.display='none'} />
            <span style={{ fontSize:'0.71rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
          </div>
          {user.about && <p style={{ fontSize:'0.77rem', color:'#6b7280', marginBottom:10, lineHeight:1.5 }}>{user.about}</p>}
          <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:12 }}>
            <div style={{ textAlign:'center', background:'#f9fafb', borderRadius:8, padding:'5px 10px' }}>
              <div style={{ fontSize:'0.62rem', color:'#9ca3af' }}>Level</div>
              <div style={{ fontSize:'0.85rem', fontWeight:800, color:'#1a73e8' }}>{user.level||1}</div>
            </div>
            <div style={{ textAlign:'center', background:'#f9fafb', borderRadius:8, padding:'5px 10px' }}>
              <div style={{ fontSize:'0.62rem', color:'#9ca3af' }}>Gold</div>
              <div style={{ fontSize:'0.85rem', fontWeight:800, color:'#d97706' }}>{user.gold||0}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:5 }}>
            <button style={{ flex:1, padding:'7px', borderRadius:7, border:'1.5px solid #e8eaed', background:'none', color:'#374151', fontSize:'0.75rem', cursor:'pointer', fontWeight:600 }}>
              <i className="fi fi-sr-envelope"/> PM
            </button>
            <button style={{ flex:1, padding:'7px', borderRadius:7, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontSize:'0.75rem', cursor:'pointer', fontWeight:700 }}>
              <i className="fi fi-sr-gift"/> Gift
            </button>
            {canKick && (
              <button onClick={()=>{socket?.emit('kickUser',{roomId,userId:user._id});onClose()}} style={{ flex:1, padding:'7px', borderRadius:7, border:'1.5px solid #fecaca', background:'none', color:'#dc2626', fontSize:'0.75rem', cursor:'pointer', fontWeight:600 }}>
                <i className="fi fi-sr-ban"/> Kick
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN CHATROOM ────────────────────────────────────────────
export default function ChatRoom() {
  const { roomId } = useParams()
  const nav        = useNavigate()

  const [me,         setMe]         = useState(null)
  const [room,       setRoom]       = useState(null)
  const [messages,   setMessages]   = useState([])
  const [users,      setUsers]      = useState([])
  const [input,      setInput]      = useState('')
  const [rightTab,   setRightTab]   = useState('users') // users | friends | staff
  const [showRight,  setShowRight]  = useState(true)
  const [showLeft,   setShowLeft]   = useState(false)
  const [profUser,   setProfUser]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [connected,  setConnected]  = useState(false)
  const [roomErr,    setRoomErr]    = useState('')

  const socketRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const token     = localStorage.getItem('cgz_token')

  useEffect(() => {
    if (!token) { nav('/login'); return }
    loadRoom()
    return () => { socketRef.current?.disconnect() }
  }, [roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  async function loadRoom() {
    setLoading(true); setRoomErr('')
    try {
      // Load me + room in parallel for speed
      const [meRes, rRes] = await Promise.all([
        fetch(`${API}/api/auth/me`,       { headers:{ Authorization:`Bearer ${token}` } }),
        fetch(`${API}/api/rooms/${roomId}`, { headers:{ Authorization:`Bearer ${token}` } }),
      ])

      if (meRes.status === 401) { localStorage.removeItem('cgz_token'); nav('/login'); return }
      const meData = await meRes.json()
      if (meData.user) {
        if (meData.freshToken) localStorage.setItem('cgz_token', meData.freshToken)
        setMe(meData.user)
      }

      const rData = await rRes.json()
      if (!rRes.ok) { setRoomErr(rData.error || 'Room not found'); setLoading(false); return }
      setRoom(rData.room)

      // Load messages async (don't block render)
      fetch(`${API}/api/rooms/${roomId}/messages?limit=50`, { headers:{ Authorization:`Bearer ${token}` } })
        .then(r=>r.json()).then(d=>{ if(d.messages) setMessages(d.messages) }).catch(()=>{})

    } catch { setRoomErr('Failed to connect. Check your connection.') }
    setLoading(false)
    connectSocket()
  }

  function connectSocket() {
    socketRef.current?.disconnect()
    const sock = io(API, { auth:{ token }, transports:['websocket','polling'] })
    sock.on('connect',        ()   => { setConnected(true); sock.emit('joinRoom', { roomId }) })
    sock.on('disconnect',     ()   => setConnected(false))
    sock.on('messageHistory', msgs => setMessages(msgs||[]))
    sock.on('newMessage',     msg  => setMessages(p=>[...p, msg]))
    sock.on('roomUsers',      list => setUsers(list||[]))
    sock.on('userJoined',     u    => {
      setUsers(p => p.find(x=>x.userId===u.userId) ? p : [...p, u])
      setMessages(p=>[...p,{_id:Date.now(),type:'system',content:`${u.username} joined`,createdAt:new Date()}])
    })
    sock.on('userLeft', u => {
      setUsers(p=>p.filter(x=>x.userId!==u.userId))
      setMessages(p=>[...p,{_id:Date.now()+'l',type:'system',content:`${u.username} left`,createdAt:new Date()}])
    })
    sock.on('systemMessage', msg => setMessages(p=>[...p,{_id:Date.now()+'s',type:'system',content:msg.text,createdAt:new Date()}]))
    sock.on('messageDeleted',id  => setMessages(p=>p.filter(m=>m._id!==id)))
    sock.on('error', e => console.error('Socket:', e))
    socketRef.current = sock
  }

  function send(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || !socketRef.current || !connected) return
    socketRef.current.emit('sendMessage', { roomId, content:text, type:'text' })
    setInput('')
    inputRef.current?.focus()
  }

  function leave() { socketRef.current?.disconnect(); nav('/chat') }

  const myRankLevel = RANKS[me?.rank]?.level || 1
  const isStaff     = myRankLevel >= 11

  // Sort users: rank DESC then username ASC
  const sortedUsers = [...users].sort((a,b) => {
    const rl = (RANKS[b.rank]?.level||0) - (RANKS[a.rank]?.level||0)
    if (rl !== 0) return rl
    return (a.username||'').localeCompare(b.username||'')
  })

  if (!loading && roomErr) return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div style={{ fontSize:40, color:'#ef4444' }}>⚠️</div>
      <p style={{ color:'#374151', fontWeight:600 }}>{roomErr}</p>
      <button onClick={()=>nav('/chat')} style={{ padding:'10px 22px', borderRadius:9, border:'none', background:'#1a73e8', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
        ← Back to Lobby
      </button>
    </div>
  )

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:32, height:32, border:'3px solid #e8eaed', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 10px' }} />
        <p style={{ color:'#9ca3af', fontSize:'0.875rem' }}>Joining {room?.name||'room'}...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const myRi  = R(me?.rank)
  const myBdr = GBR(me?.gender, me?.rank)

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#fff', overflow:'hidden' }}>

      {/* ── TOP BAR ── */}
      <div style={{ height:48, background:'#fff', borderBottom:'1px solid #e8eaed', display:'flex', alignItems:'center', padding:'0 10px', gap:8, flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
        {/* Hamburger - toggle left sidebar */}
        <button onClick={()=>setShowLeft(s=>!s)} style={{ background:showLeft?'#e8f0fe':'none', border:'none', cursor:'pointer', color:showLeft?'#1a73e8':'#6b7280', width:32, height:32, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>
          <i className="fi fi-sr-bars-sort"/>
        </button>

        {/* Room info */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
          <img src={room?.icon||'/default_images/rooms/default_room.png'} style={{ width:24, height:24, borderRadius:6, objectFit:'cover', flexShrink:0 }} onError={e=>e.target.style.display='none'} />
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.88rem', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {room?.name}
            </div>
          </div>
        </div>

        {/* Right side icons */}
        <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
          {/* Online count */}
          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:'#f3f4f6', borderRadius:20 }}>
            <span style={{ width:6, height:6, background:connected?'#22c55e':'#ef4444', borderRadius:'50%', display:'inline-block' }} />
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#374151' }}>{users.length}</span>
          </div>
          {/* Toggle right panel */}
          <button onClick={()=>setShowRight(s=>!s)} style={{ background:showRight?'#e8f0fe':'none', border:'none', cursor:'pointer', color:showRight?'#1a73e8':'#9ca3af', width:32, height:32, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>
            <i className="fi fi-sr-users"/>
          </button>
          {/* Back to lobby */}
          <button onClick={leave} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', width:32, height:32, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}
            title="Leave room"
          >
            <i className="fi fi-sr-sign-out"/>
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>

        {/* ── LEFT SIDEBAR (icon strip) ── */}
        {showLeft && (
          <div style={{ width:48, background:'#f8f9fa', borderRight:'1px solid #e8eaed', display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 0', gap:2, flexShrink:0 }}>
            {LEFT_ITEMS.map(item => (
              <button key={item.id} title={item.title} style={{ width:36, height:36, borderRadius:8, border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', fontSize:16, transition:'all .12s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.color='#1a73e8'}}
                onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#6b7280'}}
              >
                <i className={`fi ${item.icon}`}/>
              </button>
            ))}
          </div>
        )}

        {/* ── MESSAGES ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#fff' }}>
          <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
            {messages.map((m,i) => (
              <Message key={m._id||i} msg={m} myId={me?._id||me?.username} onUserClick={setProfUser} />
            ))}
            <div ref={bottomRef}/>
          </div>

          {/* ── INPUT BAR ── */}
          <div style={{ borderTop:'1px solid #e8eaed', padding:'8px 10px', background:'#fff', flexShrink:0 }}>
            <form onSubmit={send} style={{ display:'flex', alignItems:'center', gap:7 }}>
              {/* My avatar */}
              <img src={me?.avatar||'/default_images/avatar/default_guest.png'}
                style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${myBdr}`, flexShrink:0 }}
                onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
              />
              {/* Emoji button */}
              <button type="button" title="Emoji" style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, padding:'0 2px', flexShrink:0, display:'flex', alignItems:'center' }}>
                <i className="fi fi-rr-smile"/>
              </button>
              {/* Input */}
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                placeholder={connected?'Type a message...':'Connecting...'}
                disabled={!connected}
                style={{ flex:1, padding:'9px 13px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:22, color:'#111827', fontSize:'0.875rem', outline:'none', transition:'border-color .15s' }}
                onFocus={e=>e.target.style.borderColor='#1a73e8'}
                onBlur={e=>e.target.style.borderColor='#e8eaed'}
              />
              {/* Gift button */}
              <button type="button" title="Send Gift" style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, padding:'0 2px', flexShrink:0, display:'flex', alignItems:'center' }}>
                <i className="fi fi-sr-gift"/>
              </button>
              {/* Send */}
              <button type="submit" disabled={!input.trim()||!connected}
                style={{ width:34, height:34, borderRadius:'50%', border:'none', background:input.trim()&&connected?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6', color:input.trim()&&connected?'#fff':'#9ca3af', cursor:input.trim()&&connected?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                <i className="fi fi-sr-paper-plane"/>
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        {showRight && (
          <div style={{ width:200, borderLeft:'1px solid #e8eaed', background:'#fff', display:'flex', flexDirection:'column', flexShrink:0 }} className="right-pnl">
            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid #e8eaed', padding:'0 4px' }}>
              {[
                { id:'users',  icon:'fi-sr-users',        title:'Users'   },
                { id:'staff',  icon:'fi-sr-shield-check', title:'Staff'   },
                { id:'search', icon:'fi-sr-search',       title:'Search'  },
              ].map(tab => (
                <button key={tab.id} onClick={()=>setRightTab(tab.id)} title={tab.title}
                  style={{ flex:1, padding:'8px 4px', border:'none', background:'none', cursor:'pointer', borderBottom:`2px solid ${rightTab===tab.id?'#1a73e8':'transparent'}`, color:rightTab===tab.id?'#1a73e8':'#9ca3af', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className={`fi ${tab.icon}`}/>
                </button>
              ))}
            </div>

            {/* Users list */}
            <div style={{ flex:1, overflowY:'auto' }}>
              <div style={{ padding:'6px 10px 3px', fontSize:'0.65rem', fontWeight:700, color:'#9ca3af', letterSpacing:'1px', textTransform:'uppercase' }}>
                Online · {users.length}
              </div>
              {sortedUsers.map((u,i) => (
                <UserItem key={u.userId||i} u={u} onClick={setProfUser}/>
              ))}
              {users.length===0 && (
                <p style={{ textAlign:'center', color:'#9ca3af', fontSize:'0.78rem', padding:'20px 10px' }}>No users yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER (mobile) ── */}
      <div className="chat-footer" style={{ display:'none', background:'#fff', borderTop:'1px solid #e8eaed', padding:'6px 12px', gap:4, justifyContent:'space-around', alignItems:'center' }}>
        <button onClick={()=>setShowLeft(s=>!s)} style={{ background:showLeft?'#e8f0fe':'none', border:'none', cursor:'pointer', color:showLeft?'#1a73e8':'#9ca3af', width:40, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>
          <i className="fi fi-sr-bars-sort"/>
        </button>
        <button onClick={()=>setShowRight(s=>!s)} style={{ background:showRight?'#e8f0fe':'none', border:'none', cursor:'pointer', color:showRight?'#1a73e8':'#9ca3af', width:40, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>
          <i className="fi fi-sr-users"/>
        </button>
        <button style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', width:40, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>
          <i className="fi fi-sr-envelope"/>
        </button>
        <button style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', width:40, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>
          <i className="fi fi-sr-dice"/>
        </button>
        <button onClick={leave} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', width:40, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>
          <i className="fi fi-sr-sign-out"/>
        </button>
      </div>

      {profUser && (
        <ProfileModal
          user={profUser}
          myRankLevel={myRankLevel}
          onClose={()=>setProfUser(null)}
          socket={socketRef.current}
          roomId={roomId}
        />
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:640px){
          .right-pnl{display:none!important}
          .chat-footer{display:flex!important}
        }
      `}</style>
    </div>
  )
}
