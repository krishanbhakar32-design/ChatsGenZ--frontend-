// ============================================================
// ChatWhisper.jsx — Whisper/echo private message system
// Connected to ChatRoom like ChatWebcam, ChatSocial etc.
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { API, R, GBR } from './chatConstants.js'

// ─────────────────────────────────────────────────────────────
// WHISPER BOX — compose and send a whisper
// ─────────────────────────────────────────────────────────────
export function WhisperBox({ target, roomId, socket, onClose }) {
  const [text, setText] = useState('')
  const [sent, setSent]  = useState(false)
  const [err,  setErr]   = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function send(e) {
    e.preventDefault()
    if (!text.trim() || !socket) return
    setErr('')
    const toId = String(target?.userId || target?._id || '')
    if (!toId) { setErr('Cannot find user ID'); return }
    socket.emit('sendEcho', { toUserId: toId, content: text.trim(), roomId })
    setSent(true)
    setTimeout(() => { setSent(false); setText(''); onClose() }, 1800)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1500,
        background: 'rgba(0,0,0,.55)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 80px',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1e1b4b', border: '1px solid #4338ca',
          borderRadius: '14px 14px 14px 14px', padding: 16,
          width: 'min(440px,95vw)', boxShadow: '0 8px 40px rgba(79,70,229,.5)',
        }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <img
              src={target?.avatar || '/default_images/avatar/default_guest.png'}
              alt=""
              style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover',
                border:`2px solid ${GBR(target?.gender, target?.rank)}` }}
              onError={e => { e.target.src='/default_images/avatar/default_guest.png' }}
            />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'0.85rem', fontWeight:800, color:'#e0e7ff' }}>
              Whisper to <span style={{ color:'#a78bfa' }}>{target?.username}</span>
            </div>
            <div style={{ fontSize:'0.67rem', color:'#6366f1' }}>
              Private · only they can see this
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontSize:18, lineHeight:1 }}>
            ✕
          </button>
        </div>

        {err && <div style={{ fontSize:'0.75rem', color:'#f87171', marginBottom:8 }}>{err}</div>}

        {sent ? (
          <div style={{ textAlign:'center', padding:'12px', color:'#a78bfa', fontWeight:700, fontSize:'0.9rem' }}>
            ✉️ Whisper sent!
          </div>
        ) : (
          <form onSubmit={send} style={{ display:'flex', gap:8 }}>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Message ${target?.username}...`}
              maxLength={500}
              style={{
                flex:1, padding:'10px 13px',
                background:'#312e81', border:'1.5px solid #4338ca',
                borderRadius:10, color:'#e0e7ff', fontSize:'0.875rem',
                outline:'none', fontFamily:'Nunito,sans-serif',
              }}
              onFocus={e => e.target.style.borderColor='#818cf8'}
              onBlur={e  => e.target.style.borderColor='#4338ca'}
            />
            {/* Send button — NOT eye icon */}
            <button type="submit" disabled={!text.trim()}
              style={{
                padding:'10px 16px', borderRadius:10, border:'none',
                background: text.trim() ? 'linear-gradient(135deg,#6366f1,#4338ca)' : '#374151',
                color:'#fff', fontWeight:700, cursor: text.trim() ? 'pointer' : 'not-allowed',
                display:'flex', alignItems:'center', gap:6, flexShrink:0,
              }}>
              <i className="fa-solid fa-paper-plane-top" style={{ fontSize:14 }}/>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WHISPER MESSAGE — in chat, clickable for reply/report
// ─────────────────────────────────────────────────────────────
export function WhisperMessage({ msg, myId, onWhisperReply }) {
  const [showOpts, setShowOpts] = useState(false)
  const fromUser = msg.from || msg.sender
  const toUser   = msg.to
  const fromName = fromUser?.username || 'Unknown'
  const toName   = toUser?.username || ''
  const isMine   = String(fromUser?._id || fromUser?.userId) === String(myId)

  return (
    <div
      style={{ display:'flex', alignItems:'flex-start', gap:7, padding:'4px 10px', margin:'2px 0', position:'relative' }}
    >
      <img
        src={fromUser?.avatar || '/default_images/avatar/default_guest.png'}
        alt=""
        style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, marginTop:1,
          objectFit:'cover', border:'2px solid #6366f1', background:'#1e1b4b' }}
        onError={e => { e.target.src='/default_images/avatar/default_guest.png' }}
      />
      <div style={{ flex:1, minWidth:0 }}>
        {/* Header row: from → to */}
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
          <span style={{ fontSize:'0.72rem', fontWeight:800, color:'#818cf8' }}>{fromName}</span>
          {toName && <>
            <i className="fa-solid fa-arrow-right" style={{ fontSize:9, color:'#6366f155' }}/>
            <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#a5b4fc' }}>{toName}</span>
          </>}
          <span style={{ fontSize:'0.6rem', fontWeight:600, color:'#6366f1',
            background:'rgba(99,102,241,.15)', border:'1px solid rgba(99,102,241,.3)',
            borderRadius:4, padding:'1px 6px', marginLeft:2 }}>
            whisper
          </span>
          {isMine && <span style={{ marginLeft:'auto', fontSize:'0.58rem', color:'#6366f155' }}>you</span>}
        </div>

        {/* Message bubble — purple gradient, works on all themes */}
        <div
          onClick={() => setShowOpts(p => !p)}
          style={{
            background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
            border: '1px solid rgba(99,102,241,.4)',
            borderRadius: '2px 10px 10px 10px',
            padding: '7px 12px',
            display: 'inline-block',
            maxWidth: 'min(88%, 380px)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(99,102,241,.2)',
          }}>
          <span style={{ fontSize:'0.84rem', color:'#e0e7ff', fontStyle:'italic', lineHeight:1.4 }}>
            {msg.content}
          </span>
        </div>

        {/* Click options: reply + report (only for receiver) */}
        {showOpts && !isMine && (
          <div style={{ display:'flex', gap:6, marginTop:5 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { onWhisperReply?.(fromUser); setShowOpts(false) }}
              style={{ padding:'4px 12px', borderRadius:8, border:'1px solid #6366f1',
                background:'rgba(99,102,241,.15)', color:'#a78bfa',
                cursor:'pointer', fontSize:'0.75rem', fontWeight:700,
                display:'flex', alignItems:'center', gap:4 }}>
              <i className="fa-solid fa-reply-all" style={{ fontSize:10 }}/> Whisper Back
            </button>
            <button
              onClick={() => setShowOpts(false)}
              style={{ padding:'4px 12px', borderRadius:8, border:'1px solid rgba(239,68,68,.4)',
                background:'rgba(239,68,68,.1)', color:'#f87171',
                cursor:'pointer', fontSize:'0.75rem', fontWeight:700,
                display:'flex', alignItems:'center', gap:4 }}>
              <i className="fa-sharp fa-solid fa-flag" style={{ fontSize:10 }}/> Report
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
