// ============================================================
// ChatMessages.jsx — Fixed for all themes
// KEY FIXES:
// 1. Username ALWAYS visible — uses tObj.text with guaranteed contrast
// 2. Message text ALWAYS visible — bubbleColor bg uses matching fg
// 3. No styles imported from StyleModal — tObj passed as prop
// 4. System messages: clean left-aligned pill, no avatar
// 5. Font size/family consistent: name 0.82rem, msg 0.875rem baseline
// ============================================================
import { useState } from 'react'
import { API, R, RL, GBR, SYS_CFG, SYSTEM_SENDER, resolveNameColor } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'
import { WhisperMessage } from './ChatWhisper.jsx'
import { SpotifyEmbed, isSpotifyUrl } from '../../components/SpotifyPlayer.jsx'
import { YTMessage } from './ChatMedia.jsx'

export { RIcon }

const FONT_MAP = {
  font1:"'Kalam',cursive",         font2:"'Signika',sans-serif",
  font3:"'Orbitron',sans-serif",   font4:"'Comic Neue',cursive",
  font5:"'Quicksand',sans-serif",  font6:"'Pacifico',cursive",
  font7:"'Dancing Script',cursive",font8:"'Lobster Two',cursive",
  font9:"'Caveat',cursive",        font10:"'Rajdhani',sans-serif",
  font11:"'Audiowide',sans-serif", font12:"'Nunito',sans-serif",
  font13:"'Grandstander',cursive", font14:"'Comic Neue',cursive",
  font15:"'Lemonada',cursive",     font16:"'Grenze Gotisch',cursive",
  font17:"'Merienda',cursive",     font18:"'Amita',cursive",
  font19:"'Averia Libre',cursive", font20:"'Turret Road',cursive",
  font21:"'Sansita',sans-serif",   font22:"'Comfortaa',cursive",
  font23:"'Charm',cursive",        font24:"'Satisfy',cursive",
}

function getBubClassName(bubbleColor) {
  if (!bubbleColor) return ''
  if (bubbleColor.startsWith('bubcolor') || bubbleColor.startsWith('bubgrad') || bubbleColor.startsWith('bubneon')) return bubbleColor
  return ''
}

function formatTs(createdAt) {
  if (!createdAt) return ''
  const d = new Date(createdAt), now = new Date()
  const isToday     = d.toDateString() === now.toDateString()
  const isYesterday = d.toDateString() === new Date(now - 86400000).toDateString()
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (isToday)     return time
  if (isYesterday) return `Yesterday ${time}`
  return `${d.toLocaleDateString([], { day:'2-digit', month:'2-digit', year:'2-digit' })} ${time}`
}

// ── QuotedMessage ─────────────────────────────────────────
export function QuotedMessage({ replyTo, tObj }) {
  if (!replyTo) return null
  const thText = tObj?.text || '#ffffff'
  const thAccent = tObj?.accent || '#03add8'
  const senderName = replyTo.sender?.username || 'Unknown'
  let preview = ''
  if      (replyTo.type === 'image')   preview = '📷 Image'
  else if (replyTo.type === 'gif')     preview = '🖼️ GIF'
  else if (replyTo.type === 'voice')   preview = '🎤 Voice message'
  else if (replyTo.type === 'youtube') preview = '▶️ YouTube video'
  else preview = (replyTo.content || '').length > 100
    ? (replyTo.content || '').slice(0, 100) + '…'
    : (replyTo.content || '')

  return (
    <div style={{
      display: 'flex', gap: 8,
      background: thAccent + '18',
      borderLeft: `3px solid ${thAccent}`,
      borderRadius: '0 8px 8px 0',
      padding: '5px 10px', marginBottom: 5,
      maxWidth: '100%', overflow: 'hidden',
    }}>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: thAccent, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          ↩ {senderName}
        </div>
        <div style={{ fontSize: '0.75rem', color: thText + '88', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {preview}
        </div>
      </div>
    </div>
  )
}

// ── System message config ──────────────────────────────────
const SYS_TEXT = {
  join:    { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',    border: 'rgba(34,197,94,0.20)',    icon: 'fa-solid fa-right-to-bracket' },
  leave:   { color: '#888888', bg: 'rgba(136,136,136,0.06)',  border: 'rgba(136,136,136,0.15)',  icon: 'fa-solid fa-right-from-bracket' },
  kick:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.20)',   icon: 'fa-solid fa-user-slash' },
  ban:     { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.20)',    icon: 'fa-solid fa-ban' },
  mute:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.20)',   icon: 'fa-solid fa-microphone-slash' },
  mod:     { color: '#03add8', bg: 'rgba(3,173,216,0.08)',    border: 'rgba(3,173,216,0.20)',    icon: 'fa-solid fa-user-shield' },
  dice:    { color: '#a78bfa', bg: 'rgba(124,58,237,0.08)',   border: 'rgba(124,58,237,0.18)',   icon: 'fa-solid fa-dice' },
  gift:    { color: '#ec4899', bg: 'rgba(236,72,153,0.08)',   border: 'rgba(236,72,153,0.18)',   icon: 'fa-solid fa-gift' },
  system:  { color: '#03add8', bg: 'rgba(3,173,216,0.06)',    border: 'rgba(3,173,216,0.18)',    icon: 'fa-solid fa-circle-info' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.20)',   icon: 'fa-solid fa-triangle-exclamation' },
  error:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.20)',    icon: 'fa-solid fa-circle-xmark' },
  success: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',    border: 'rgba(34,197,94,0.20)',    icon: 'fa-solid fa-circle-check' },
}

// ── Msg Component ──────────────────────────────────────────
function Msg({ msg, onMiniCard, onMention, onHide, onWhisper, onQuote, myId, myLevel, socket, roomId, onYTMinimize, onIgnore, tObj }) {
  // tObj is ALWAYS the source of truth for theme colors
  const thText   = tObj?.text   || '#ffffff'
  const thAccent = tObj?.accent || '#03add8'
  const thBg     = tObj?.bg_chat || '#151515'
  const thLog    = tObj?.bg_log  || 'rgba(255,255,255,0.04)'

  const isSystem = ['system','join','leave','kick','mute','ban','mod','dice','gift','warning','success','error'].includes(msg.type)

  // ── WHISPER ──
  if (msg.type === 'whisper' || msg.isEcho) {
    return <WhisperMessage msg={msg} myId={myId} onWhisperReply={onWhisper} />
  }

  // ── SYSTEM MESSAGE — clean left-aligned pill, no avatar ──
  if (isSystem) {
    const cfg = SYS_TEXT[msg.type] || SYS_TEXT.system
    const ts = formatTs(msg.createdAt)
    const canDelSys = myLevel >= 11

    function renderSysContent(content) {
      if (!content) return null
      // Bold the username part (first word/name before action verb)
      const m = content.match(/^(.+?)\s+(has|was|have|joined|left)\b(.*)$/i)
      if (m) {
        return (
          <>
            <span style={{ fontWeight: 800, color: cfg.color }}>{m[1]}</span>
            <span style={{ color: cfg.color, opacity: 0.85 }}> {m[2]}{m[3]}</span>
          </>
        )
      }
      return <span style={{ color: cfg.color, opacity: 0.9 }}>{content}</span>
    }

    return (
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '2px 10px', margin: '1px 0', position: 'relative' }}
        onMouseEnter={e => e.currentTarget.querySelector('.sys-del-btn')?.style && (e.currentTarget.querySelector('.sys-del-btn').style.opacity = '1')}
        onMouseLeave={e => e.currentTarget.querySelector('.sys-del-btn')?.style && (e.currentTarget.querySelector('.sys-del-btn').style.opacity = '0')}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          borderRadius: 20, padding: '3px 10px 3px 6px',
          maxWidth: 'min(95%,520px)', flexShrink: 1, minWidth: 0,
        }}>
          {/* Small icon circle */}
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: cfg.color + '22', border: `1px solid ${cfg.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className={cfg.icon} style={{ fontSize: 8, color: cfg.color }} />
          </div>
          <span style={{ fontSize: '0.76rem', lineHeight: 1.3, minWidth: 0 }}>
            {renderSysContent(msg.content)}
          </span>
          <span style={{ fontSize: '0.58rem', color: '#666', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 4 }}>{ts}</span>
        </div>
        {canDelSys && (
          <button className="sys-del-btn"
            onClick={e => { e.stopPropagation(); socket?.emit('deleteMessage', { messageId: msg._id, roomId }) }}
            style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'rgba(239,68,68,.12)', border: 'none', borderRadius: 5, color: '#ef4444', cursor: 'pointer', fontSize: 10, padding: '2px 5px', opacity: 0, transition: 'opacity .15s' }}>
            <i className="fa-solid fa-trash" style={{ fontSize: 9 }} />
          </button>
        )}
      </div>
    )
  }

  // ── REGULAR MESSAGE ──
  const ri  = R(msg.sender?.rank)
  const bdr = GBR(msg.sender?.gender, msg.sender?.rank)
  const ts  = formatTs(msg.createdAt)
  const isMine  = (msg.sender?._id === myId || msg.sender?.userId === myId)
  const canMod  = myLevel >= 11 && RL(msg.sender?.rank) < myLevel
  const canDel  = isMine || canMod

  const nameFontId     = msg.sender?.nameFont || ''
  const msgFontId      = msg.sender?.msgFont  || msg.sender?.msgFontStyle || ''
  const nameFontFamily = nameFontId ? (FONT_MAP[nameFontId] || 'inherit') : 'inherit'
  const msgFontFamily  = msgFontId  ? (FONT_MAP[msgFontId]  || 'inherit') : 'inherit'
  const nameFontCls = nameFontId && nameFontId.startsWith('font') ? 'bnfont' + nameFontId.replace('font','') : ''
  const msgFontCls  = msgFontId  && msgFontId.startsWith('font')  ? 'bfont'  + msgFontId.replace('font','')  : ''

  // ── NAME COLOR — always resolves to visible color ──────────────────────
  // Priority: custom nameColor class → custom hex → theme text color
  function nameColorInfo() {
    const nc = msg.sender?.nameColor
    // no custom → use theme text (guaranteed visible on theme bg)
    if (!nc || nc === 'user' || nc === 'default') return { cls: '', style: { color: thText } }
    // CSS class-based (gradient/neon)
    if (nc.startsWith('bcolor') || nc.startsWith('bgrad') || nc.startsWith('bneon')) {
      return { cls: nc, style: {} }
    }
    // Direct hex/rgb
    if (nc.startsWith('#') || nc.startsWith('rgb')) return { cls: '', style: { color: nc } }
    return { cls: '', style: { color: thText } }
  }
  const nameInfo = nameColorInfo()

  // ── BUBBLE TEXT COLOR — always visible regardless of bubble bg ─────────
  // If bubbleColor class is set (colored bg), use sender's msgFontColor or white
  // If no bubble bg, use theme text color so it's always readable
  const bubCls = getBubClassName(msg.sender?.bubbleColor)
  const hasBubbleBg = !!bubCls

  function getMsgTextColor() {
    if (msg.sender?.msgFontColor) return msg.sender.msgFontColor
    // bubble bg → white text (works on any colored bg)
    if (hasBubbleBg) return '#ffffff'
    // no bubble → theme text (guaranteed contrast on theme bg)
    return thText
  }
  const msgTextColor = getMsgTextColor()

  function renderContent(text) {
    if (!text) return null
    return text.split(/(@\w+)/g).map((p, i) =>
      p.startsWith('@')
        ? <span key={i} style={{ color: thAccent, fontWeight: 700, background: thAccent + '18', padding: '0 3px', borderRadius: 4, cursor: 'pointer' }} onClick={() => onMention?.(p)}>{p}</span>
        : p
    )
  }

  const [menuPos, setMenuPos] = useState(null)

  function handleClick(e) {
    e.stopPropagation()
    if (menuPos) { setMenuPos(null); return }
    setMenuPos({ x: Math.min(e.clientX, window.innerWidth - 185), y: Math.min(e.clientY, window.innerHeight - 210) })
  }

  const senderForWhisper = msg.sender ? {
    ...msg.sender,
    userId: msg.sender.userId || msg.sender._id,
    _id: msg.sender._id,
    username: msg.sender.username,
  } : null

  return (
    <>
      {menuPos && <div onClick={() => setMenuPos(null)} style={{ position: 'fixed', inset: 0, zIndex: 8888 }} />}
      {menuPos && (
        // Context menu
        <div style={{
          position: 'fixed', top: menuPos.y, left: menuPos.x,
          background: '#202020', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, zIndex: 8889, minWidth: 175,
          overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}>
          {[
            { icon: 'fa-solid fa-reply-all',     label: 'Quote',   color: thAccent, disabled: false,  fn: () => { onQuote?.(msg); setMenuPos(null) } },
            { icon: 'fa-solid fa-hand-lizard',   label: 'Whisper', color: '#a78bfa', disabled: isMine, fn: () => { if (!senderForWhisper || isMine) return; onWhisper?.(senderForWhisper); setMenuPos(null) } },
            { icon: 'fa-solid fa-eye-slash',     label: 'Hide',    color: '#888888', disabled: false,  fn: () => { onHide?.(msg._id); setMenuPos(null) } },
            { icon: 'fa-sharp fa-solid fa-flag', label: 'Report',  color: '#f59e0b', disabled: false,  fn: () => setMenuPos(null) },
            ...(canDel ? [{ icon: 'fa-solid fa-trash', label: 'Delete', color: '#ef4444', disabled: false, fn: () => { socket?.emit('deleteMessage', { messageId: msg._id, roomId }); setMenuPos(null) } }] : []),
          ].map((item, i, arr) => (
            <button key={i} onClick={item.disabled ? undefined : item.fn}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 13px',
                background: 'none', border: 'none',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                opacity: item.disabled ? 0.35 : 1,
              }}
              onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <i className={item.icon} style={{ fontSize: 13, color: item.color, width: 16, flexShrink: 0 }} />
              <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#ffffff' }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Message row */}
      <div
        onClick={handleClick}
        style={{
          display: 'flex', gap: 8, padding: '3px 10px',
          alignItems: 'flex-start', cursor: 'pointer',
          transition: 'background .1s', borderRadius: 4,
          maxWidth: '100%', overflow: 'hidden',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Avatar */}
        <img
          src={msg.sender?.avatar || '/default_images/avatar/default_guest.png'}
          alt=""
          onClick={e => { e.stopPropagation(); onMiniCard(msg.sender, { x: Math.min(e.clientX, window.innerWidth - 240), y: Math.min(e.clientY + 8, window.innerHeight - 360) }) }}
          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${bdr}`, flexShrink: 0, cursor: 'pointer', marginTop: 2 }}
          onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }}
        />

        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* Name row — username ALWAYS visible using theme text color as fallback */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <RIcon rank={msg.sender?.rank} size={12} />
            <span
              className={[nameInfo.cls, nameFontCls].filter(Boolean).join(' ')}
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                lineHeight: 1.2,
                // font family: class handles it if nameFontCls set, else inline
                ...(nameFontCls ? {} : { fontFamily: nameFontFamily }),
                // Color: class handles it if cls set, else inline style (always a visible color)
                ...nameInfo.style,
              }}
              onClick={e => { e.stopPropagation(); onMention?.(`@${msg.sender?.username} `) }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              {msg.sender?.username || 'Unknown'}
            </span>
            {/* Timestamp */}
            <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: thText ? thText + '66' : '#555', whiteSpace: 'nowrap', flexShrink: 0 }}>{ts}</span>
          </div>

          {/* Bubble — message text ALWAYS visible */}
          <div
            className={[bubCls, msgFontCls].filter(Boolean).join(' ')}
            style={{
              fontSize: msg.sender?.msgFontSize ? `${msg.sender.msgFontSize}px` : '0.875rem',
              lineHeight: 1.55,
              // text color: always resolved to visible value
              color: msgTextColor,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              // font family
              ...(msgFontCls ? {} : { fontFamily: msgFontFamily }),
              fontWeight: msg.sender?.bubbleStyle?.includes('bold') ? 700 : 400,
              fontStyle: msg.sender?.bubbleStyle?.includes('italic') ? 'italic' : 'normal',
              maxWidth: '100%',
              // bubble bg padding only if colored bubble class is applied
              ...(hasBubbleBg ? {
                padding: '5px 10px',
                borderRadius: '3px 10px 10px 10px',
                display: 'inline-block',
                // ensure text-shadow is not hiding text — reset
                textShadow: 'none',
              } : {}),
            }}
          >
            {msg.replyTo && <QuotedMessage replyTo={msg.replyTo} tObj={tObj} />}
            {msg.type === 'gift'
              ? <span>🎁 {msg.content}</span>
              : msg.type === 'image'
              ? <img src={msg.content} alt="" style={{ maxWidth: 'min(220px,60vw)', borderRadius: 8, display: 'block' }} />
              : msg.type === 'gif'
              ? <img src={msg.content} alt="GIF" style={{ maxWidth: 'min(220px,60vw)', borderRadius: 8, display: 'block' }} />
              : msg.type === 'youtube'
              ? <YTMessage url={msg.content} onMinimize={onYTMinimize} />
              : (msg.type === 'spotify' || isSpotifyUrl?.(msg.content))
              ? <SpotifyEmbed url={msg.content} />
              : renderContent(msg.content)
            }
          </div>
        </div>
      </div>
    </>
  )
}

export { Msg }
