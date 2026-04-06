// ============================================================
// ChatWhisper.jsx — FIX 9: Whisper is INLINE in chat feed
// - No separate WhisperBox popup — whisper is sent from main input
// - WhisperMessage renders inline with distinct purple bubble
// - Target user and sender both see it in the chat feed
// - Options: WhisperBack (receiver only) + Report
// ============================================================

// ── WHISPER MESSAGE — inline in chat feed ─────────────────
export function WhisperMessage({ msg, myId, onWhisperReply }) {
  const fromUser = msg.from || msg.sender
  const toUser   = msg.to
  const fromName = fromUser?.username || 'Unknown'
  const toName   = toUser?.username || ''
  const isMine   = String(fromUser?._id || fromUser?.userId) === String(myId)

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 7,
      padding: '3px 10px', margin: '1px 0', position: 'relative',
    }}>
      <img
        src={fromUser?.avatar || '/default_images/avatar/default_guest.png'}
        alt=""
        style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2, objectFit: 'cover', border: '2px solid #6366f1' }}
        onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header: from → to + whisper badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#818cf8' }}>{fromName}</span>
          {toName && <>
            <i className="fa-solid fa-arrow-right" style={{ fontSize: 9, color: '#6366f155' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a5b4fc' }}>{toName}</span>
          </>}
          <span style={{
            fontSize: '0.62rem', fontWeight: 700, color: '#818cf8',
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 4, padding: '1px 6px', marginLeft: 2,
          }}>
            <i className="fa-solid fa-hand-lizard" style={{ fontSize: 9, marginRight: 3 }} />whisper
          </span>
          {isMine && <span style={{ marginLeft: 'auto', fontSize: '0.58rem', color: '#6366f155' }}>you</span>}
        </div>

        {/* Bubble — purple gradient, clearly distinct */}
        <div style={{
          background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
          border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: '2px 10px 10px 10px',
          padding: '7px 12px',
          display: 'inline-block',
          maxWidth: 'min(88%, 380px)',
          boxShadow: '0 2px 8px rgba(99,102,241,0.2)',
        }}>
          <span style={{ fontSize: '0.84rem', color: '#e0e7ff', fontStyle: 'italic', lineHeight: 1.4 }}>
            {msg.content}
          </span>
        </div>

        {/* Options: WhisperBack + Report — only for receiver */}
        {!isMine && (
          <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
            <button
              onClick={() => onWhisperReply?.(fromUser)}
              style={{
                padding: '3px 10px', borderRadius: 8,
                border: '1px solid rgba(99,102,241,0.4)',
                background: 'rgba(99,102,241,0.12)', color: '#a78bfa',
                cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
              <i className="fa-solid fa-reply-all" style={{ fontSize: 10 }} /> Whisper Back
            </button>
            <button
              onClick={() => {/* report handler */}}
              style={{
                padding: '3px 10px', borderRadius: 8,
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)', color: '#f87171',
                cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
              <i className="fa-sharp fa-solid fa-flag" style={{ fontSize: 10 }} /> Report
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// WhisperBox is no longer used — whisper is sent from the main input bar
// Kept as empty export to avoid import errors in any legacy references
export function WhisperBox() { return null }
