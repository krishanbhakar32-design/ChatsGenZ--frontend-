/**
 * Message.jsx — FIXED
 * Fixes:
 * 1. /default_images/avatar/ → /default_avatar/ (getAvatarUrl helper)
 */
import { useState } from 'react'
import { RIcon, R, GBR } from '../../utils/chatHelpers.js'
import { getAvatarUrl } from '../../constants.js'
import MsgMenu from './MsgMenu.jsx'

export default function Message({ msg, onMiniCard, onMention, myId, myLevel, socket, roomId }) {
  const [ctxMenu, setCtxMenu] = useState(null)

  const isSystem = msg.type === 'system' || msg.type === 'game' || msg.type === 'mod'
  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', padding: '3px 0' }}>
        <span style={{ fontSize: '0.72rem', color: '#9ca3af', background: '#f3f4f6', padding: '2px 14px', borderRadius: 20 }}>
          {msg.content}
        </span>
      </div>
    )
  }

  const ri     = R(msg.sender?.rank)
  const bdr    = GBR(msg.sender?.gender, msg.sender?.rank)
  const col    = msg.sender?.nameColor || ri.color
  const ts     = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const isMine = msg.sender?._id === myId || msg.sender?.userId === myId
  const canDel = isMine || myLevel >= 11

  function renderContent(text) {
    if (!text) return null
    return text.split(/(@\w+)/g).map((p, i) =>
      p.startsWith('@')
        ? <span key={i} style={{ color: '#1a73e8', fontWeight: 700, background: '#dbeafe', padding: '1px 6px', borderRadius: 4, fontSize: '0.85em' }}>{p}</span>
        : p
    )
  }

  return (
    <>
      <div
        style={{ display: 'flex', gap: 8, padding: '3px 12px', alignItems: 'flex-start', transition: 'background .1s' }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(0,0,0,.02)'
          const b = e.currentTarget.querySelector('.del-btn')
          if (b && canDel) b.style.display = 'inline-flex'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          const b = e.currentTarget.querySelector('.del-btn')
          if (b) b.style.display = 'none'
        }}
        onContextMenu={e => {
          e.preventDefault()
          setCtxMenu({ x: e.clientX, y: e.clientY })
        }}
      >
        {/* FIX: Avatar path via getAvatarUrl helper */}
        <img
          src={getAvatarUrl(msg.sender?.avatar)}
          alt=""
          onClick={e => {
            e.stopPropagation()
            const r = e.currentTarget.getBoundingClientRect()
            onMiniCard(msg.sender, { x: r.left, y: r.bottom + 4 })
          }}
          style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${bdr}`, flexShrink: 0, cursor: 'pointer', marginTop: 2 }}
          onError={e => (e.target.src = '/default_avatar/other.png')}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <RIcon rank={msg.sender?.rank} size={11} />
            <span
              onClick={() => onMention(msg.sender?.username)}
              style={{ fontSize: '0.82rem', fontWeight: 700, color: col, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              {msg.sender?.username}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{ts}</span>
            <button
              className="del-btn"
              onClick={() => socket?.emit('deleteMessage', { messageId: msg._id, roomId })}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: 11, padding: '0 2px', marginLeft: 2, alignItems: 'center', justifyContent: 'center' }}
            >
              <i className="fi fi-sr-trash" />
            </button>
          </div>

          <div className="msg-bubble">
            {msg.type === 'image' && <img src={msg.content} alt="" style={{ maxWidth: 200, borderRadius: 8, display: 'block' }} />}
            {msg.type === 'gif'   && <img src={msg.content} alt="GIF" style={{ maxWidth: 220, borderRadius: 8, display: 'block' }} />}
            {msg.type === 'gift'  && <span>🎁 {msg.content}</span>}
            {msg.type === 'voice' && (
              <audio controls src={msg.audioUrl || msg.content} style={{ height: 32 }} />
            )}
            {!['image', 'gif', 'gift', 'voice'].includes(msg.type) && renderContent(msg.content)}
          </div>
        </div>
      </div>

      {ctxMenu && (
        <MsgMenu
          msg={msg}
          pos={ctxMenu}
          myId={myId}
          myLevel={myLevel}
          socket={socket}
          roomId={roomId}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  )
}
