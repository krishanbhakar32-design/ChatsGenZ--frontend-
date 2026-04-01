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
        background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(5px)',
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
              <i className="fi fi-sr-paper-plane-top" style={{ fontSize:14 }}/>
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
      style={{ display:'flex', alignItems:'flex-start', gap:7, padding:'3px 14px', margin:'1px 0', position:'relative' }}
      onClick={() => setShowOpts(p => !p)}
    >
      <img
        src={fromUser?.avatar || '/default_images/avatar/default_guest.png'}
        alt=""
        style={{ width:26, height:26, borderRadius:'50%', flexShrink:0, marginTop:1,
          objectFit:'cover', border:'1.5px solid #818cf8', background:'#eef2ff' }}
        onError={e => { e.target.src='/default_images/avatar/default_guest.png' }}
      />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
          <span style={{ fontSize:'0.7rem', fontWeight:800, color:'#6366f1', fontFamily:'Nunito,sans-serif' }}>
            {fromName}
            {toName && <span style={{ color:'#a5b4fc', fontWeight:500 }}> ▸ {toName}</span>}
            <span style={{ marginLeft:6, fontSize:'0.62rem', fontWeight:400, color:'#9ca3af',
              background:'rgba(99,102,241,.12)', borderRadius:4, padding:'1px 6px' }}>
              whisper
            </span>
          </span>
        </div>
        <div style={{ background:'rgba(99,102,241,.1)', border:'1px solid #6366f133', borderRadius:'0 8px 8px 8px',
          padding:'5px 10px', display:'inline-block', maxWidth:'min(88%,400px)', cursor:'pointer' }}>
          <span style={{ fontSize:'0.82rem', color:'#c7d2fe', fontStyle:'italic' }}>{msg.content}</span>
        </div>

        {/* Options on click */}
        {showOpts && (
          <div style={{ display:'flex', gap:6, marginTop:5 }}
            onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { onWhisperReply?.(fromUser); setShowOpts(false) }}
              style={{ padding:'4px 12px', borderRadius:8, border:'1px solid #6366f1',
                background:'#6366f118', color:'#a78bfa', cursor:'pointer', fontSize:'0.75rem', fontWeight:700 }}>
              ↩ Reply
            </button>
            <button
              onClick={() => setShowOpts(false)}
              style={{ padding:'4px 12px', borderRadius:8, border:'1px solid #ef4444',
                background:'#ef444418', color:'#f87171', cursor:'pointer', fontSize:'0.75rem', fontWeight:700 }}>
              ⚑ Report
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
