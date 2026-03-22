/**
 * DMPanel.jsx — FINAL FIXED
 * avatar: /default_images/avatar/default_guest.png ✅
 * Uses socket for real-time DMs + REST for history
 */
import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'
const GBR = (g, r) => r === 'bot' ? 'transparent' : ({ male:'#03add8', female:'#ff99ff', couple:'#9c6fde', other:'#cccccc' }[g] || '#cccccc')
const DEFAULT_AVATAR = '/default_images/avatar/default_guest.png'

export default function DMPanel({ me, socket, onClose, onCountChange }) {
  const [convos,   setConvos]  = useState([])
  const [active,   setActive]  = useState(null)
  const [messages, setMsgs]    = useState([])
  const [input,    setInput]   = useState('')
  const [load,     setLoad]    = useState(true)
  const bottomRef = useRef(null)
  const token = localStorage.getItem('cgz_token')

  useEffect(() => { loadConvos() }, [])

  useEffect(() => {
    if (!socket) return
    const handler = (msg) => {
      if (active && (msg.from === active.userId || msg.to === active.userId)) {
        setMsgs(p => [...p, msg])
      }
      loadConvos()
    }
    socket.on('privateMessage',     handler)
    socket.on('privateMessageSent', handler)
    return () => { socket.off('privateMessage', handler); socket.off('privateMessageSent', handler) }
  }, [socket, active])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  async function loadConvos() {
    try {
      const r = await fetch(`${API}/api/messages/private/conversations`, { headers:{ Authorization:`Bearer ${token}` } })
      if (r.ok) {
        const d = await r.json()
        setConvos(d.conversations || [])
        const unread = (d.conversations || []).reduce((s, c) => s + (c.unread || 0), 0)
        onCountChange?.(unread)
      }
    } catch {} finally { setLoad(false) }
  }

  async function openConvo(user) {
    setActive(user); setMsgs([])
    try {
      const r = await fetch(`${API}/api/messages/private/${user.userId || user._id}`, { headers:{ Authorization:`Bearer ${token}` } })
      if (r.ok) { const d = await r.json(); setMsgs(d.messages || []) }
    } catch {}
  }

  function sendDM(e) {
    e.preventDefault()
    if (!input.trim() || !active || !socket) return
    socket.emit('privateMessage', { toUserId: active.userId || active._id, content: input.trim(), type:'text' })
    setInput('')
  }

  return (
    <div style={{ position:'absolute', right:0, top:'calc(100% + 6px)', background:'#fff', border:'1px solid #e4e6ea', borderRadius:14, width:340, height:480, display:'flex', flexDirection:'column', boxShadow:'0 8px 28px rgba(0,0,0,.14)', zIndex:999, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
        {active ? (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={() => setActive(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#1a73e8', fontSize:13, padding:'0 4px 0 0' }}>
              <i className="fi fi-sr-arrow-left"/>
            </button>
            <img src={active.avatar || DEFAULT_AVATAR} alt="" style={{ width:26, height:26, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${GBR(active.gender, active.rank)}` }} onError={e => { e.target.src=DEFAULT_AVATAR }}/>
            <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.88rem', color:'#111827' }}>{active.username}</span>
          </div>
        ) : (
          <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'#111827' }}>
            <i className="fi fi-sr-envelope" style={{ marginRight:7, color:'#1a73e8' }}/>Messages
          </span>
        )}
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:14 }}>
          <i className="fi fi-sr-cross-small"/>
        </button>
      </div>

      {/* Conversations list */}
      {!active && (
        <div style={{ flex:1, overflowY:'auto' }}>
          {load && (
            <div style={{ textAlign:'center', padding:24 }}>
              <div style={{ width:22, height:22, border:'2px solid #e4e6ea', borderTop:'2px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }}/>
            </div>
          )}
          {!load && convos.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 16px', color:'#9ca3af' }}>
              <i className="fi fi-sr-envelope" style={{ fontSize:32, display:'block', marginBottom:8, opacity:0.3 }}/>
              <p style={{ fontSize:'0.875rem', fontWeight:600 }}>No messages yet</p>
            </div>
          )}
          {convos.map(c => (
            <div key={c.userId} onClick={() => openConvo(c)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid #f9fafb', cursor:'pointer', background:c.unread>0?'#f0f7ff':'transparent', transition:'background .12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.background = c.unread>0?'#f0f7ff':'transparent')}
            >
              <div style={{ position:'relative', flexShrink:0 }}>
                <img src={c.avatar || DEFAULT_AVATAR} alt="" style={{ width:38, height:38, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${GBR(c.gender, c.rank)}` }} onError={e => { e.target.src=DEFAULT_AVATAR }}/>
                {c.isOnline && <span style={{ position:'absolute', bottom:0, right:0, width:9, height:9, background:'#22c55e', borderRadius:'50%', border:'1.5px solid #fff' }}/>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'0.84rem', fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.username}</div>
                <div style={{ fontSize:'0.74rem', color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.lastMessage || '...'}</div>
              </div>
              {c.unread > 0 && (
                <span style={{ background:'#1a73e8', color:'#fff', fontSize:'0.65rem', fontWeight:700, padding:'1px 6px', borderRadius:10, flexShrink:0 }}>{c.unread}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chat view */}
      {active && (
        <>
          <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
            {messages.map((m, i) => {
              const isMine = m.from === me?._id || m.from === me?.username || m.from?._id === me?._id
              return (
                <div key={m._id||i} style={{ display:'flex', justifyContent:isMine?'flex-end':'flex-start', padding:'3px 12px' }}>
                  <div style={{ background:isMine?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6', color:isMine?'#fff':'#111827', padding:'8px 12px', borderRadius:isMine?'13px 3px 13px 13px':'3px 13px 13px 13px', fontSize:'0.875rem', maxWidth:'75%', wordBreak:'break-word' }}>
                    {m.type === 'voice'
                      ? <audio controls src={m.audioUrl || m.content} style={{ height:32 }} />
                      : m.content
                    }
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </div>
          <form onSubmit={sendDM} style={{ display:'flex', gap:8, padding:'8px 10px', borderTop:'1px solid #e4e6ea', flexShrink:0 }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Send a message..."
              style={{ flex:1, padding:'8px 12px', background:'#f9fafb', border:'1.5px solid #e4e6ea', borderRadius:20, fontSize:'0.875rem', outline:'none', color:'#111827', fontFamily:'Nunito,sans-serif' }}
              onFocus={e => e.target.style.borderColor='#1a73e8'} onBlur={e => e.target.style.borderColor='#e4e6ea'}
            />
            <button type="submit" disabled={!input.trim()}
              style={{ width:34, height:34, borderRadius:'50%', border:'none', background:input.trim()?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6', color:input.trim()?'#fff':'#9ca3af', cursor:input.trim()?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
              <i className="fi fi-sr-paper-plane"/>
            </button>
          </form>
        </>
      )}
    </div>
  )
}
