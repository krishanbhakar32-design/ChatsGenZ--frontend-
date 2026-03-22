/**
 * YoutubePanel.jsx
 * Socket events: emit playYoutube / stopYoutube
 *               receive youtubeStarted / youtubeStopped
 */
import { useState, useEffect } from 'react'

export default function YoutubePanel({ socket, roomId, onClose }) {
  const [url,     setUrl]     = useState('')
  const [current, setCurrent] = useState(null)

  useEffect(() => {
    if (!socket) return
    socket.on('youtubeStarted', ({ videoId, title, startedBy }) => setCurrent({ videoId, title, startedBy }))
    socket.on('youtubeStopped', () => setCurrent(null))
    return () => {
      socket.off('youtubeStarted')
      socket.off('youtubeStopped')
    }
  }, [socket])

  function extractId(u) {
    const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return m ? m[1] : null
  }

  function play() {
    const id = extractId(url)
    if (!id) return alert('Invalid YouTube URL')
    socket?.emit('playYoutube', { roomId, videoId: id, title: url })
    onClose()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#111827', borderRadius: 18, maxWidth: 380, width: '100%', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #374151' }}>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fi fi-br-youtube" style={{ color: '#ef4444' }} /> YouTube for Room
          </span>
          <button onClick={onClose} style={{ background: '#374151', border: 'none', color: '#9ca3af', width: 28, height: 28, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
            <i className="fi fi-sr-cross-small" />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {/* Currently playing */}
          {current && (
            <div style={{ background: '#1f2937', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
              <iframe
                width="100%"
                height="180"
                src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1`}
                frameBorder="0"
                allow="autoplay;encrypted-media"
                allowFullScreen
                style={{ display: 'block' }}
                title="YouTube player"
              />
              <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Playing for room</span>
                <button
                  onClick={() => socket?.emit('stopYoutube', { roomId })}
                  style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  Stop
                </button>
              </div>
            </div>
          )}

          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Paste YouTube URL..."
            style={{ width: '100%', padding: '10px 14px', background: '#1f2937', border: '1.5px solid #374151', borderRadius: 9, color: '#fff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Nunito,sans-serif', marginBottom: 10 }}
            onFocus={e => (e.target.style.borderColor = '#ef4444')}
            onBlur={e => (e.target.style.borderColor = '#374151')}
          />
          <button
            onClick={play}
            style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'Outfit,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <i className="fi fi-br-youtube" /> Play for Room
          </button>
        </div>
      </div>
    </div>
  )
}
