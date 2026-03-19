import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

const RANK_INFO = {
  guest:      { color:'#888888', label:'Guest',      icon:'guest.svg'      },
  user:       { color:'#aaaaaa', label:'User',        icon:'user.svg'       },
  vipfemale:  { color:'#FF4488', label:'VIP ♀',      icon:'vipfemale.svg'  },
  vipmale:    { color:'#4488FF', label:'VIP ♂',      icon:'vipmale.svg'    },
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

function getRank(rank) {
  return RANK_INFO[rank] || RANK_INFO.guest
}

// ── USER ITEM in right panel ───────────────────────────────
function UserItem({ u, onClick }) {
  const ri = getRank(u.rank)
  return (
    <div
      onClick={() => onClick(u)}
      style={{
        display:'flex', alignItems:'center', gap:9,
        padding:'7px 12px', cursor:'pointer', transition:'background .12s',
      }}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <div style={{ position:'relative', flexShrink:0 }}>
        <img
          src={u.avatar || '/default_images/avatar/default_guest.png'}
          alt=""
          style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', border:`2px solid ${ri.color}` }}
          onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
        />
        <span style={{ position:'absolute', bottom:0, right:0, width:7, height:7, background:'#22c55e', borderRadius:'50%', border:'1.5px solid #111827' }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:12, height:12, objectFit:'contain', flexShrink:0 }} onError={e=>e.target.style.display='none'} />
          <span style={{ fontSize:'0.82rem', fontWeight:700, color:ri.color, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {u.username}
          </span>
        </div>
        <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,.35)' }}>{ri.label}</div>
      </div>
    </div>
  )
}

// ── MESSAGE BUBBLE ─────────────────────────────────────────
function MsgBubble({ msg, myId, onUserClick }) {
  const isMe     = msg.sender?._id === myId || msg.sender?.username === myId
  const isSystem = msg.type === 'system'
  const ri       = getRank(msg.sender?.rank)
  const color    = msg.sender?.nameColor || ri.color

  if (isSystem) {
    return (
      <div style={{ textAlign:'center', padding:'4px 16px' }}>
        <span style={{ fontSize:'0.74rem', color:'rgba(255,255,255,.4)', background:'rgba(255,255,255,.05)', padding:'3px 10px', borderRadius:20 }}>
          {msg.content}
        </span>
      </div>
    )
  }

  return (
    <div style={{
      display:'flex', gap:8, padding:'3px 12px',
      flexDirection: isMe ? 'row-reverse' : 'row',
      alignItems:'flex-end',
    }}>
      {/* Avatar */}
      {!isMe && (
        <img
          src={msg.sender?.avatar || '/default_images/avatar/default_guest.png'}
          onClick={() => onUserClick(msg.sender)}
          style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${ri.color}`, flexShrink:0, cursor:'pointer', marginBottom:2 }}
          onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
        />
      )}

      <div style={{ maxWidth:'72%', display:'flex', flexDirection:'column', alignItems: isMe?'flex-end':'flex-start' }}>
        {/* Sender name + rank icon */}
        {!isMe && (
          <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:3, cursor:'pointer' }} onClick={()=>onUserClick(msg.sender)}>
            <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:11, height:11, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
            <span style={{ fontSize:'0.73rem', fontWeight:700, color }}>
              {msg.sender?.username}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div style={{
          background: isMe ? 'linear-gradient(135deg,#1a73e8,#1464cc)' : 'rgba(255,255,255,.08)',
          color:'#fff', padding:'8px 12px', borderRadius: isMe?'14px 14px 4px 14px':'14px 14px 14px 4px',
          fontSize:'0.875rem', lineHeight:1.5, wordBreak:'break-word',
          maxWidth:'100%',
        }}>
          {msg.type === 'gift'
            ? <span>🎁 {msg.content}</span>
            : msg.type === 'image'
            ? <img src={msg.content} alt="img" style={{ maxWidth:180, borderRadius:8, display:'block' }} />
            : msg.content
          }
        </div>

        {/* Time */}
        <span style={{ fontSize:'0.62rem', color:'rgba(255,255,255,.25)', marginTop:3 }}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
        </span>
      </div>
    </div>
  )
}

// ── USER PROFILE MODAL ─────────────────────────────────────
function ProfileModal({ user, myRank, onClose }) {
  if (!user) return null
  const ri = getRank(user.rank)
  const myLevel = RANK_INFO[myRank]?.level || 1
  const isStaff = myLevel >= 11

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#111827', border:'1px solid #1f2937', borderRadius:16, padding:0, maxWidth:280, width:'100%', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.5)' }}>
        {/* Cover */}
        <div style={{ height:70, background:`linear-gradient(135deg,${ri.color}33,#1a2535)`, position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.4)', border:'none', color:'#fff', width:28, height:28, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
            <i className="fi fi-sr-cross-small" />
          </button>
        </div>

        {/* Avatar */}
        <div style={{ display:'flex', justifyContent:'center', marginTop:-30, marginBottom:8 }}>
          <img
            src={user.avatar || '/default_images/avatar/default_guest.png'}
            style={{ width:60, height:60, borderRadius:'50%', border:`3px solid ${ri.color}`, objectFit:'cover' }}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
          />
        </div>

        <div style={{ padding:'0 18px 18px', textAlign:'center' }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1rem', color:'#fff', marginBottom:4 }}>{user.username}</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:10 }}>
            <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:14, height:14 }} onError={e=>e.target.style.display='none'} />
            <span style={{ fontSize:'0.75rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
          </div>

          {user.about && <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,.5)', marginBottom:12, lineHeight:1.5 }}>{user.about}</p>}

          {/* Stats */}
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:14 }}>
            <div style={{ textAlign:'center', background:'rgba(255,255,255,.05)', borderRadius:8, padding:'6px 12px' }}>
              <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,.4)' }}>Level</div>
              <div style={{ fontSize:'0.9rem', fontWeight:800, color:'#60a5fa' }}>{user.level||1}</div>
            </div>
            <div style={{ textAlign:'center', background:'rgba(255,255,255,.05)', borderRadius:8, padding:'6px 12px' }}>
              <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,.4)' }}>Gold</div>
              <div style={{ fontSize:'0.9rem', fontWeight:800, color:'#fbbf24' }}>{user.gold||0}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:7 }}>
            <button style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid #1f2937', background:'none', color:'rgba(255,255,255,.7)', fontSize:'0.78rem', cursor:'pointer', fontWeight:600 }}>
              <i className="fi fi-sr-envelope" /> PM
            </button>
            <button style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontSize:'0.78rem', cursor:'pointer', fontWeight:700 }}>
              <i className="fi fi-sr-gift" /> Gift
            </button>
            {isStaff && (
              <button style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid rgba(239,68,68,.3)', background:'none', color:'#f87171', fontSize:'0.78rem', cursor:'pointer', fontWeight:600 }}>
                <i className="fi fi-sr-ban" /> Kick
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN CHATROOM ──────────────────────────────────────────
export default function ChatRoom() {
  const { roomId } = useParams()
  const nav        = useNavigate()

  const [me,       setMe]       = useState(null)
  const [room,     setRoom]     = useState(null)
  const [messages, setMessages] = useState([])
  const [users,    setUsers]    = useState([])
  const [input,    setInput]    = useState('')
  const [showRight,setShowRight]= useState(true)
  const [profUser, setProfUser] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [connected,setConnected]= useState(false)

  const socketRef  = useRef(null)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const token      = localStorage.getItem('cgz_token')

  // Load me + room + messages
  useEffect(() => {
    if (!token) { nav('/login'); return }
    initRoom()
    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [roomId])

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  async function initRoom() {
    try {
      // Load current user
      const meRes  = await fetch(`${API}/api/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
      const meData = await meRes.json()
      if (!meRes.ok) { nav('/login'); return }
      setMe(meData.user)

      // Load room info
      const rRes  = await fetch(`${API}/api/rooms/${roomId}`, { headers:{ Authorization:`Bearer ${token}` } })
      const rData = await rRes.json()
      if (!rRes.ok) { nav('/chat'); return }
      setRoom(rData.room)

      // Load messages
      const mRes  = await fetch(`${API}/api/rooms/${roomId}/messages?limit=50`, { headers:{ Authorization:`Bearer ${token}` } })
      const mData = await mRes.json()
      if (mRes.ok) setMessages(mData.messages || [])

    } catch { nav('/chat'); return }
    finally { setLoading(false) }

    // Connect socket
    connectSocket()
  }

  function connectSocket() {
    if (socketRef.current) socketRef.current.disconnect()

    const sock = io(API, {
      auth: { token },
      transports: ['websocket','polling'],
    })

    sock.on('connect', () => {
      setConnected(true)
      sock.emit('joinRoom', { roomId })
    })

    sock.on('disconnect', () => setConnected(false))

    sock.on('newMessage', msg => {
      setMessages(prev => [...prev, msg])
    })

    sock.on('roomUsers', userList => {
      setUsers(userList || [])
    })

    sock.on('userJoined', u => {
      setUsers(prev => {
        if (prev.find(x => x.userId === u.userId)) return prev
        return [...prev, u]
      })
      setMessages(prev => [...prev, { _id: Date.now(), type:'system', content:`${u.username} joined`, createdAt: new Date() }])
    })

    sock.on('userLeft', u => {
      setUsers(prev => prev.filter(x => x.userId !== u.userId))
      setMessages(prev => [...prev, { _id: Date.now()+'l', type:'system', content:`${u.username} left`, createdAt: new Date() }])
    })

    sock.on('messageDeleted', id => {
      setMessages(prev => prev.filter(m => m._id !== id))
    })

    sock.on('error', e => console.error('Socket error:', e))

    socketRef.current = sock
  }

  function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || !socketRef.current || !connected) return
    socketRef.current.emit('sendMessage', { roomId, content: text, type:'text' })
    setInput('')
    inputRef.current?.focus()
  }

  function leaveRoom() {
    if (socketRef.current) socketRef.current.disconnect()
    nav('/chat')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0d1520', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, border:'3px solid #1e2d3d', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ color:'#4b5563', fontSize:'0.875rem' }}>Joining room...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const myRi = getRank(me?.rank)

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#0d1520', overflow:'hidden' }}>

      {/* ── TOP BAR ── */}
      <div style={{
        height:50, background:'#0f1923', borderBottom:'1px solid #1e2d3d',
        display:'flex', alignItems:'center', padding:'0 12px', gap:10, flexShrink:0,
        boxShadow:'0 2px 8px rgba(0,0,0,.3)',
      }}>
        {/* Back to lobby */}
        <button
          onClick={leaveRoom}
          style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.6)', display:'flex', alignItems:'center', gap:6, padding:'6px 8px', borderRadius:7, fontSize:'0.84rem', fontWeight:600, flexShrink:0 }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.07)'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}
        >
          <i className="fi fi-sr-angle-left" style={{ fontSize:14 }} />
          <span className="back-label">Lobby</span>
        </button>

        {/* Room icon + name */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
          <img
            src={room?.icon || '/default_images/rooms/default_room.png'}
            style={{ width:28, height:28, borderRadius:7, objectFit:'cover', flexShrink:0 }}
            onError={e=>e.target.style.display='none'}
          />
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {room?.name || '...'}
            </div>
            {room?.topic && (
              <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,.4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {room.topic}
              </div>
            )}
          </div>
        </div>

        {/* Online count */}
        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
          <span style={{ width:7, height:7, background: connected?'#22c55e':'#ef4444', borderRadius:'50%', display:'inline-block' }} />
          <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,.5)', fontWeight:600 }}>{users.length}</span>
        </div>

        {/* Toggle user list */}
        <button
          onClick={()=>setShowRight(s=>!s)}
          style={{ background: showRight?'rgba(26,115,232,.2)':'none', border:'none', cursor:'pointer', color:showRight?'#60a5fa':'rgba(255,255,255,.5)', width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}
        >
          <i className="fi fi-sr-users" />
        </button>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ── MESSAGES ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ flex:1, overflowY:'auto', padding:'10px 0' }}>
            {messages.map((m, i) => (
              <MsgBubble
                key={m._id || i}
                msg={m}
                myId={me?._id || me?.username}
                onUserClick={setProfUser}
              />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* ── INPUT BAR ── */}
          <div style={{ borderTop:'1px solid #1e2d3d', padding:'8px 10px', background:'#0f1923', flexShrink:0 }}>
            <form onSubmit={sendMessage} style={{ display:'flex', alignItems:'center', gap:8 }}>
              {/* My avatar */}
              <img
                src={me?.avatar || '/default_images/avatar/default_guest.png'}
                style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover', border:`2px solid ${myRi.color}`, flexShrink:0 }}
                onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
              />

              {/* Input */}
              <input
                ref={inputRef}
                value={input}
                onChange={e=>setInput(e.target.value)}
                placeholder={connected ? 'Type a message...' : 'Connecting...'}
                disabled={!connected}
                style={{
                  flex:1, padding:'10px 14px', background:'#1a2535',
                  border:'1px solid #2a3a4d', borderRadius:22,
                  color:'#fff', fontSize:'0.875rem', outline:'none',
                  transition:'border-color .15s',
                }}
                onFocus={e=>e.target.style.borderColor='#1a73e8'}
                onBlur={e=>e.target.style.borderColor='#2a3a4d'}
              />

              {/* Send */}
              <button
                type="submit"
                disabled={!input.trim() || !connected}
                style={{
                  width:38, height:38, borderRadius:'50%', border:'none',
                  background: input.trim()&&connected ? 'linear-gradient(135deg,#1a73e8,#1464cc)' : '#1f2937',
                  color: input.trim()&&connected ? '#fff' : '#4b5563',
                  cursor: input.trim()&&connected ? 'pointer':'not-allowed',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:15, flexShrink:0, transition:'all .15s',
                }}
              >
                <i className="fi fi-sr-paper-plane" />
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT: USER LIST ── */}
        {showRight && (
          <div style={{
            width:220, borderLeft:'1px solid #1e2d3d',
            background:'#0f1923', display:'flex', flexDirection:'column',
            flexShrink:0, overflowY:'auto',
          }} className="right-panel">
            <div style={{ padding:'10px 12px 6px', fontSize:'0.68rem', fontWeight:700, color:'#4b5563', letterSpacing:'1px', textTransform:'uppercase', borderBottom:'1px solid #1e2d3d' }}>
              Online · {users.length}
            </div>
            {users.length === 0 && (
              <p style={{ textAlign:'center', color:'#374151', fontSize:'0.78rem', padding:'24px 12px' }}>No users yet</p>
            )}
            {/* Sort by rank level DESC */}
            {[...users]
              .sort((a,b) => (RANK_INFO[b.rank]?.level||0) - (RANK_INFO[a.rank]?.level||0))
              .map((u,i) => <UserItem key={u.userId||i} u={u} onClick={setProfUser} />)
            }
          </div>
        )}
      </div>

      {/* Profile modal */}
      {profUser && <ProfileModal user={profUser} myRank={me?.rank} onClose={()=>setProfUser(null)} />}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .right-panel { display:flex !important; }
        @media(max-width:600px){
          .right-panel { display:none !important; }
          .back-label { display:none !important; }
        }
      `}</style>
    </div>
  )
}
