import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

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
const R = r => RANKS[r] || RANKS.guest

// ── USER ITEM ─────────────────────────────────────────────────
function UserItem({ u, onClick }) {
  const ri = R(u.rank)
  return (
    <div onClick={()=>onClick(u)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', cursor:'pointer', borderRadius:7, transition:'background .12s' }}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,.04)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <div style={{ position:'relative', flexShrink:0 }}>
        <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover', border:`2px solid ${ri.color}`, display:'block' }} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
        <span style={{ position:'absolute', bottom:0, right:0, width:7, height:7, background:'#22c55e', borderRadius:'50%', border:'1.5px solid #fff' }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:11, height:11, objectFit:'contain', flexShrink:0 }} onError={e=>e.target.style.display='none'} />
          <span style={{ fontSize:'0.8rem', fontWeight:700, color:ri.color, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.username}</span>
        </div>
        <div style={{ fontSize:'0.66rem', color:'#9ca3af' }}>{ri.label}</div>
      </div>
    </div>
  )
}

// ── MESSAGE BUBBLE ────────────────────────────────────────────
function MsgBubble({ msg, myId, onUserClick }) {
  const isMe     = msg.sender?._id === myId || msg.sender?.username === myId
  const isSystem = msg.type === 'system'
  const ri       = R(msg.sender?.rank)
  const nameCol  = msg.sender?.nameColor || ri.color

  if (isSystem) return (
    <div style={{ textAlign:'center', padding:'4px 16px', margin:'2px 0' }}>
      <span style={{ fontSize:'0.72rem', color:'#9ca3af', background:'#f3f4f6', padding:'3px 10px', borderRadius:20 }}>{msg.content}</span>
    </div>
  )

  return (
    <div style={{ display:'flex', gap:8, padding:'3px 10px', flexDirection:isMe?'row-reverse':'row', alignItems:'flex-end' }}>
      {!isMe && (
        <img src={msg.sender?.avatar||'/default_images/avatar/default_guest.png'} onClick={()=>onUserClick(msg.sender)} style={{ width:26, height:26, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${ri.color}`, flexShrink:0, cursor:'pointer', marginBottom:2 }} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
      )}
      <div style={{ maxWidth:'72%', display:'flex', flexDirection:'column', alignItems:isMe?'flex-end':'flex-start' }}>
        {!isMe && (
          <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:3, cursor:'pointer' }} onClick={()=>onUserClick(msg.sender)}>
            <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:10, height:10, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
            <span style={{ fontSize:'0.71rem', fontWeight:700, color:nameCol }}>{msg.sender?.username}</span>
          </div>
        )}
        <div style={{ background:isMe?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6', color:isMe?'#fff':'#111827', padding:'8px 12px', borderRadius:isMe?'14px 14px 4px 14px':'14px 14px 14px 4px', fontSize:'0.875rem', lineHeight:1.5, wordBreak:'break-word' }}>
          {msg.type==='image'
            ? <img src={msg.content} alt="img" style={{ maxWidth:180, borderRadius:8, display:'block' }} />
            : msg.content
          }
        </div>
        <span style={{ fontSize:'0.6rem', color:'#9ca3af', marginTop:2 }}>
          {new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
        </span>
      </div>
    </div>
  )
}

// ── PROFILE MODAL ─────────────────────────────────────────────
function ProfileModal({ user, onClose }) {
  if (!user) return null
  const ri = R(user.rank)
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:16, maxWidth:260, width:'100%', overflow:'hidden', boxShadow:'0 16px 48px rgba(0,0,0,.18)' }}>
        <div style={{ height:60, background:`linear-gradient(135deg,${ri.color}33,#e8f0fe)`, position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', top:8, right:8, background:'rgba(255,255,255,.8)', border:'none', width:26, height:26, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>
            <i className="fi fi-sr-cross-small" />
          </button>
        </div>
        <div style={{ display:'flex', justifyContent:'center', marginTop:-28 }}>
          <img src={user.avatar||'/default_images/avatar/default_guest.png'} style={{ width:56, height:56, borderRadius:'50%', border:`3px solid ${ri.color}`, objectFit:'cover' }} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
        </div>
        <div style={{ padding:'8px 16px 16px', textAlign:'center' }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'0.95rem', color:'#111827', marginBottom:4 }}>{user.username}</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:10 }}>
            <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:13, height:13 }} onError={e=>e.target.style.display='none'} />
            <span style={{ fontSize:'0.72rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
          </div>
          {user.about && <p style={{ fontSize:'0.78rem', color:'#6b7280', marginBottom:10, lineHeight:1.5 }}>{user.about}</p>}
          <div style={{ display:'flex', gap:7, justifyContent:'center', marginBottom:12 }}>
            <div style={{ textAlign:'center', background:'#f9fafb', borderRadius:8, padding:'6px 12px' }}>
              <div style={{ fontSize:'0.65rem', color:'#9ca3af' }}>Level</div>
              <div style={{ fontSize:'0.88rem', fontWeight:800, color:'#1a73e8' }}>{user.level||1}</div>
            </div>
            <div style={{ textAlign:'center', background:'#f9fafb', borderRadius:8, padding:'6px 12px' }}>
              <div style={{ fontSize:'0.65rem', color:'#9ca3af' }}>Gold</div>
              <div style={{ fontSize:'0.88rem', fontWeight:800, color:'#d97706' }}>{user.gold||0}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button style={{ flex:1, padding:'8px', borderRadius:8, border:'1.5px solid #e8eaed', background:'none', color:'#374151', fontSize:'0.76rem', cursor:'pointer', fontWeight:600 }}>
              <i className="fi fi-sr-envelope" /> PM
            </button>
            <button style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontSize:'0.76rem', cursor:'pointer', fontWeight:700 }}>
              <i className="fi fi-sr-gift" /> Gift
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN CHATROOM ─────────────────────────────────────────────
export default function ChatRoom() {
  const { roomId } = useParams()
  const nav        = useNavigate()

  const [me,        setMe]        = useState(null)
  const [room,      setRoom]      = useState(null)
  const [messages,  setMessages]  = useState([])
  const [users,     setUsers]     = useState([])
  const [input,     setInput]     = useState('')
  const [showRight, setShowRight] = useState(true)
  const [profUser,  setProfUser]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [connected, setConnected] = useState(false)
  const [roomErr,   setRoomErr]   = useState('')

  const socketRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('cgz_token')
    if (!token) { nav('/login'); return }
    initRoom(token)
    return () => { if (socketRef.current) socketRef.current.disconnect() }
  }, [roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  async function initRoom(token) {
    setLoading(true); setRoomErr('')
    try {
      // Load me
      const meRes = await fetch(`${API}/api/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
      if (meRes.status === 401) { localStorage.removeItem('cgz_token'); nav('/login'); return }
      const meData = await meRes.json()
      if (meData.user) {
        if (meData.freshToken) localStorage.setItem('cgz_token', meData.freshToken)
        setMe(meData.user)
      }

      // Load room — don't redirect, show error instead
      const rRes  = await fetch(`${API}/api/rooms/${roomId}`, { headers:{ Authorization:`Bearer ${token}` } })
      const rData = await rRes.json()
      if (!rRes.ok) { setRoomErr(rData.error || 'Room not found'); setLoading(false); return }
      setRoom(rData.room)

      // Load messages
      const mRes  = await fetch(`${API}/api/rooms/${roomId}/messages?limit=50`, { headers:{ Authorization:`Bearer ${token}` } })
      const mData = await mRes.json()
      if (mRes.ok) setMessages(mData.messages || [])

    } catch (err) {
      setRoomErr('Failed to load room. Check your connection.')
    }
    setLoading(false)
    connectSocket(token)
  }

  function connectSocket(token) {
    if (socketRef.current) socketRef.current.disconnect()
    const sock = io(API, { auth:{ token }, transports:['websocket','polling'] })

    sock.on('connect',    ()  => { setConnected(true); sock.emit('joinRoom', { roomId }) })
    sock.on('disconnect', ()  => setConnected(false))

    sock.on('messageHistory', msgs => setMessages(msgs || []))
    sock.on('newMessage',     msg  => setMessages(p => [...p, msg]))

    sock.on('roomUsers', list => setUsers(list || []))

    sock.on('userJoined', u => {
      setUsers(p => p.find(x=>x.userId===u.userId) ? p : [...p, u])
      setMessages(p => [...p, { _id:Date.now(), type:'system', content:`${u.username} joined`, createdAt:new Date() }])
    })
    sock.on('userLeft', u => {
      setUsers(p => p.filter(x=>x.userId!==u.userId))
      setMessages(p => [...p, { _id:Date.now()+'l', type:'system', content:`${u.username} left`, createdAt:new Date() }])
    })
    sock.on('systemMessage', msg => {
      setMessages(p => [...p, { _id:Date.now()+'s', type:'system', content:msg.text, createdAt:new Date() }])
    })
    sock.on('messageDeleted', id => setMessages(p => p.filter(m=>m._id!==id)))
    sock.on('error', e => console.error('Socket:', e))

    socketRef.current = sock
  }

  function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || !socketRef.current || !connected) return
    socketRef.current.emit('sendMessage', { roomId, content:text, type:'text' })
    setInput('')
    inputRef.current?.focus()
  }

  function leaveRoom() {
    if (socketRef.current) socketRef.current.disconnect()
    nav('/chat')
  }

  const myRi = R(me?.rank)

  // Error state
  if (!loading && roomErr) return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <i className="fi fi-sr-exclamation" style={{ fontSize:36, color:'#ef4444' }} />
      <p style={{ color:'#374151', fontWeight:600 }}>{roomErr}</p>
      <button onClick={()=>nav('/chat')} style={{ padding:'10px 20px', borderRadius:9, border:'none', background:'#1a73e8', color:'#fff', fontWeight:700, cursor:'pointer' }}>
        ← Back to Lobby
      </button>
    </div>
  )

  // Loading state
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:34, height:34, border:'3px solid #e8eaed', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 10px' }} />
        <p style={{ color:'#9ca3af', fontSize:'0.875rem' }}>Joining room...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#f8f9fa', overflow:'hidden' }}>

      {/* ── TOP BAR ── */}
      <div style={{ height:50, background:'#fff', borderBottom:'1px solid #e8eaed', display:'flex', alignItems:'center', padding:'0 12px', gap:10, flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <button onClick={leaveRoom} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', display:'flex', alignItems:'center', gap:5, padding:'6px 8px', borderRadius:7, fontSize:'0.84rem', fontWeight:600, flexShrink:0 }}
          onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}
        >
          <i className="fi fi-sr-angle-left" style={{ fontSize:13 }} />
          <span className="back-lbl">Lobby</span>
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
          <img src={room?.icon||'/default_images/rooms/default_room.png'} style={{ width:26, height:26, borderRadius:6, objectFit:'cover', flexShrink:0 }} onError={e=>e.target.style.display='none'} />
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.88rem', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{room?.name||'...'}</div>
            {room?.topic && <div style={{ fontSize:'0.67rem', color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{room.topic}</div>}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
          <span style={{ width:7, height:7, background:connected?'#22c55e':'#ef4444', borderRadius:'50%', display:'inline-block' }} />
          <span style={{ fontSize:'0.76rem', color:'#9ca3af', fontWeight:600 }}>{users.length}</span>
        </div>

        <button onClick={()=>setShowRight(s=>!s)} style={{ background:showRight?'#e8f0fe':'none', border:'none', cursor:'pointer', color:showRight?'#1a73e8':'#9ca3af', width:32, height:32, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>
          <i className="fi fi-sr-users" />
        </button>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Messages */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#fff' }}>
          <div style={{ flex:1, overflowY:'auto', padding:'10px 0' }}>
            {messages.map((m,i) => <MsgBubble key={m._id||i} msg={m} myId={me?._id||me?.username} onUserClick={setProfUser} />)}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop:'1px solid #e8eaed', padding:'8px 10px', background:'#fff', flexShrink:0 }}>
            <form onSubmit={sendMessage} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <img src={me?.avatar||'/default_images/avatar/default_guest.png'} style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:`2px solid ${myRi.color}`, flexShrink:0 }} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                placeholder={connected?'Type a message...':'Connecting...'}
                disabled={!connected}
                style={{ flex:1, padding:'9px 14px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:22, color:'#111827', fontSize:'0.875rem', outline:'none', transition:'border-color .15s' }}
                onFocus={e=>e.target.style.borderColor='#1a73e8'}
                onBlur={e=>e.target.style.borderColor='#e8eaed'}
              />
              <button type="submit" disabled={!input.trim()||!connected} style={{ width:36, height:36, borderRadius:'50%', border:'none', background:input.trim()&&connected?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6', color:input.trim()&&connected?'#fff':'#9ca3af', cursor:input.trim()&&connected?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                <i className="fi fi-sr-paper-plane" />
              </button>
            </form>
          </div>
        </div>

        {/* Right panel - users */}
        {showRight && (
          <div style={{ width:200, borderLeft:'1px solid #e8eaed', background:'#fff', display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }} className="right-pnl">
            <div style={{ padding:'8px 10px 5px', fontSize:'0.66rem', fontWeight:700, color:'#9ca3af', letterSpacing:'1px', textTransform:'uppercase', borderBottom:'1px solid #f3f4f6' }}>
              Online · {users.length}
            </div>
            {[...users].sort((a,b)=>(RANKS[b.rank]?.level||0)-(RANKS[a.rank]?.level||0)).map((u,i)=>(
              <UserItem key={u.userId||i} u={u} onClick={setProfUser} />
            ))}
          </div>
        )}
      </div>

      {profUser && <ProfileModal user={profUser} onClose={()=>setProfUser(null)} />}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:600px){.right-pnl{display:none!important}.back-lbl{display:none!important}}
      `}</style>
    </div>
  )
}
