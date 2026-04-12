// ============================================================
// ChatMessages.jsx — Fixed
// FIX 2: Default Nunito font, transparent bubble default
// FIX 1: System msgs not auto-shown on refresh (dedup logic)
// ============================================================
import { useState } from 'react'
import { API, R, RL, GBR, SYS_CFG, SYSTEM_SENDER, resolveNameColor } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'
import { WhisperMessage } from './ChatWhisper.jsx'
import { SpotifyEmbed, isSpotifyUrl } from '../../components/SpotifyPlayer.jsx'
import { YTMessage, VoiceMessage } from './ChatMedia.jsx'

export { RIcon }

// FIX 2: Default font = Nunito (fallback), others by id
const FONT_MAP = {
  font1:"'Kalam',cursive",        font2:"'Signika',sans-serif",
  font3:"'Orbitron',sans-serif",  font4:"'Comic Neue',cursive",
  font5:"'Quicksand',sans-serif", font6:"'Pacifico',cursive",
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
  // 24-hour time HH:mm
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const time = `${hh}:${mm}`
  const day  = String(d.getDate()).padStart(2, '0')
  const mon  = String(d.getMonth() + 1).padStart(2, '0')
  const yr   = d.getFullYear()
  if (isToday)     return time
  if (isYesterday) return `Yesterday ${time}`
  return `${day}/${mon}/${yr} ${time}`
}

export function QuotedMessage({ replyTo, tObj }) {
  if (!replyTo) return null
  const thText   = tObj?.text   || '#ffffff'
  const thAccent = tObj?.accent || '#03add8'
  const senderName = replyTo.sender?.username || 'Unknown'
  const senderAvatar = replyTo.sender?.avatar || '/default_images/avatar/default_guest.png'
  let preview = ''
  let isImage = false
  if      (replyTo.type === 'image')   { preview = replyTo.content; isImage = true }
  else if (replyTo.type === 'gif')     preview = '🖼️ GIF'
  else if (replyTo.type === 'voice')   preview = '🎤 Voice message'
  else if (replyTo.type === 'youtube') preview = '▶️ YouTube video'
  else preview = replyTo.content || ''

  return (
    <div style={{ display: 'flex', gap: 8, background: thAccent + '15', borderLeft: `3px solid ${thAccent}`, borderRadius: '0 10px 10px 0', padding: '6px 10px', marginBottom: 6, maxWidth: '100%', overflow: 'hidden' }}>
      <img src={senderAvatar} alt=""
        style={{ width:26, height:26, borderRadius:'50%', objectFit:'cover', flexShrink:0, alignSelf:'flex-start', marginTop:2 }}
        onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }} />
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: thAccent, marginBottom: 3 }}>↩ {senderName}</div>
        {isImage
          ? <img src={preview} alt="quoted" style={{ maxWidth:120, maxHeight:80, borderRadius:6, display:'block', objectFit:'cover' }} />
          : <div style={{ fontSize: '0.78rem', color: thText + 'cc', lineHeight:1.45, wordBreak:'break-word', overflowWrap:'break-word' }}>{preview}</div>
        }
      </div>
    </div>
  )
}

// System message types and their styling
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


// ── Image Preview — thumbnail click to reveal full overlay ────
function ImagePreview({ src, isGif }) {
  const [revealed, setRevealed] = useState(false)
  const [fullOpen, setFullOpen] = useState(false)

  if (!revealed) {
    return (
      <div
        onClick={() => setRevealed(true)}
        style={{ width: 160, height: 90, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexDirection: 'column', gap: 4, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(12px) brightness(0.4)', transform: 'scale(1.1)' }} />
        <i className="fa-light fa-image" style={{ fontSize: 28, color: 'rgba(104,55,98,0.9)', position: 'relative', zIndex: 1 }} />
        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, position: 'relative', zIndex: 1 }}>{isGif ? 'Click to show GIF' : 'Click to show image'}</span>
      </div>
    )
  }

  return (
    <>
      <img
        src={src}
        alt={isGif ? 'GIF' : 'Image'}
        onClick={() => setFullOpen(true)}
        style={{ maxWidth: 'min(220px,55vw)', maxHeight: 160, width: 'auto', height: 'auto', borderRadius: 8, display: 'block', cursor: 'zoom-in', objectFit: 'cover' }}
        onError={e => { e.target.style.display = 'none' }}
      />
      {fullOpen && (
        <div onClick={() => setFullOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <button onClick={() => setFullOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 20, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <img src={src} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 10, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }} />
        </div>
      )}
    </>
  )
}

function Msg({ msg, onMiniCard, onMention, onHide, onWhisper, onQuote, onReport, myId, myLevel, socket, roomId, onYTMinimize, onIgnore, tObj }) {
  const thText   = tObj?.text   || '#ffffff'
  const thAccent = tObj?.accent || '#03add8'
  const thBg     = tObj?.bg_chat || '#151515'

  const isSystem = ['system','join','leave','kick','mute','ban','mod','dice','gift','warning','success','error'].includes(msg.type)

  // FIX 9: Whisper renders as inline message bubble
  if (msg.type === 'whisper' || msg.isEcho) {
    return <WhisperMessage msg={msg} myId={myId} onWhisperReply={onWhisper} />
  }

  // ── SYSTEM MESSAGE — CodyChatPHP pill style ──────────────
  if (isSystem) {
    const cfg = SYS_TEXT[msg.type] || SYS_TEXT.system
    const ts = formatTs(msg.createdAt)
    const canDelSys = myLevel >= 11

    function renderSysContent(content) {
      if (!content) return null
      // Bold the username part (before "has/was/joined/left")
      const m = content.match(/^(.+?)\s+(has|was|have|joined|left)\b(.*)$/i)
      if (m) return (
        <>
          <span style={{ fontWeight: 800, color: cfg.color }}>{m[1]}</span>
          <span style={{ color: cfg.color, opacity: 0.85 }}> {m[2]}{m[3]}</span>
        </>
      )
      return <span style={{ color: cfg.color, opacity: 0.9 }}>{content}</span>
    }

    return (
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '2px 10px', margin: '1px 0', position: 'relative' }}
        onMouseEnter={e => { const b = e.currentTarget.querySelector('.sys-del-btn'); if (b) b.style.opacity = '1' }}
        onMouseLeave={e => { const b = e.currentTarget.querySelector('.sys-del-btn'); if (b) b.style.opacity = '0' }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: '3px 10px 3px 6px', maxWidth: 'min(95%,520px)' }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: cfg.color + '22', border: `1px solid ${cfg.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={cfg.icon} style={{ fontSize: 8, color: cfg.color }} />
          </div>
          <span style={{ fontSize: '0.76rem', lineHeight: 1.3, minWidth: 0 }}>{renderSysContent(msg.content)}</span>
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
  const nameFontFamily = nameFontId ? (FONT_MAP[nameFontId] || "'Nunito',sans-serif") : "'Nunito',sans-serif"
  const msgFontFamily  = msgFontId  ? (FONT_MAP[msgFontId]  || "'Nunito',sans-serif") : "'Nunito',sans-serif"
  const nameFontCls = nameFontId && nameFontId.startsWith('font') ? 'bnfont' + nameFontId.replace('font','') : ''
  const msgFontCls  = msgFontId  && msgFontId.startsWith('font')  ? 'bfont'  + msgFontId.replace('font','')  : ''

  // FIX 2: Name color — always resolves to visible color on theme bg
  function nameColorInfo() {
    const nc = msg.sender?.nameColor
    if (!nc || nc === 'user' || nc === 'default') return { cls: '', style: { color: thText } }
    if (nc.startsWith('bcolor') || nc.startsWith('bgrad') || nc.startsWith('bneon')) return { cls: nc, style: {} }
    if (nc.startsWith('#') || nc.startsWith('rgb')) return { cls: '', style: { color: nc } }
    return { cls: '', style: { color: thText } }
  }
  const nameInfo = nameColorInfo()

  // FIX 2: Bubble text color — always readable
  const bubCls = getBubClassName(msg.sender?.bubbleColor)
  const hasBubbleBg = !!bubCls
  function getMsgTextColor() {
    if (msg.sender?.msgFontColor) return msg.sender.msgFontColor
    if (hasBubbleBg) return '#ffffff'
    return thText
  }
  const msgTextColor = getMsgTextColor()

  // Emoticon category prefixes — matches EMOT_CATS in ChatMedia.jsx
  const EMOT_PREFIXES = {
    // food emoticons
    apple:1,babymilk:1,banana:1,beer:1,beers:1,bread:1,burger:1,burritos:1,cake:1,candy:1,
    champain:1,cheeze:1,chocolate:1,cookie:1,corn:1,flower:1,flower2:1,fries:1,greenapple:1,
    honey:1,hotdog:1,lemon:1,lollypop:1,lunchtime:1,meal:1,noodle:1,orange:1,pancake:1,
    pineapple:1,pizza:1,plant:1,popcorn:1,rice:1,spaghetti:1,sunflower:1,taco:1,weat:1,
  }
  const FOOD_EMOTS = new Set(Object.keys(EMOT_PREFIXES))

  function getEmoticonSrc(name) {
    // animal emoticons are unicode codepoints like 1f401
    if (/^1f[0-9a-f]{3}$/i.test(name)) return `/icons/emoticons/sticker_animals/${name}.png`
    if (FOOD_EMOTS.has(name)) return `/icons/emoticons/food/${name}.png`
    return `/icons/emoticons/${name}.png`
  }

  function renderContent(text) {
    if (!text) return null
    // Split on :emoticon_name: and @mentions
    const parts = text.split(/(:[\w]+:|@\w+)/g)
    return parts.map((p, i) => {
      if (p.startsWith('@')) {
        return (
          <span key={i}
            style={{ color: thAccent, fontWeight: 700, background: thAccent + '18', padding: '0 3px', borderRadius: 4, cursor: 'pointer' }}
            onClick={() => onMention?.(p)}>{p}</span>
        )
      }
      if (p.startsWith(':') && p.endsWith(':') && p.length > 2) {
        const name = p.slice(1, -1)
        const src  = getEmoticonSrc(name)
        return (
          <img key={i} src={src} alt={name} title={name}
            style={{ width: 28, height: 28, objectFit: 'contain', verticalAlign: 'middle', margin: '0 1px', display: 'inline-block' }}
            onError={e => {
              // fallback — show the text code if image missing
              e.target.style.display = 'none'
              const span = document.createElement('span')
              span.textContent = p
              span.style.cssText = 'font-size:0.78rem;color:#888;'
              e.target.parentNode?.insertBefore(span, e.target.nextSibling)
            }} />
        )
      }
      return p
    })
  }

  const [menuPos, setMenuPos] = useState(null)
  function handleClick(e) {
    e.stopPropagation()
    if (menuPos) { setMenuPos(null); return }
    setMenuPos({ x: Math.min(e.clientX, window.innerWidth - 185), y: Math.min(e.clientY, window.innerHeight - 210) })
  }

  const senderForWhisper = msg.sender ? { ...msg.sender, userId: msg.sender.userId || msg.sender._id } : null

  return (
    <>
      {menuPos && <div onClick={() => setMenuPos(null)} style={{ position: 'fixed', inset: 0, zIndex: 8888 }} />}
      {menuPos && (
        <div style={{ position: 'fixed', top: menuPos.y, left: menuPos.x, background: '#202020', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, zIndex: 8889, minWidth: 175, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
          {[
            { icon: 'fa-solid fa-reply-all',     label: 'Quote',   color: thAccent,   disabled: false,  fn: () => { onQuote?.(msg); setMenuPos(null) } },
            // FIX 9: Whisper sets inline target, no popup
            { icon: 'fa-solid fa-hand-lizard',   label: 'Whisper', color: '#a78bfa',  disabled: isMine, fn: () => { if (!senderForWhisper || isMine) return; onWhisper?.(senderForWhisper); setMenuPos(null) } },
            { icon: 'fa-solid fa-eye-slash',     label: 'Hide',    color: '#888888',  disabled: false,  fn: () => { onHide?.(msg._id); setMenuPos(null) } },
            { icon: 'fa-sharp fa-solid fa-flag', label: 'Report',  color: '#f59e0b',  disabled: isMine, fn: () => { onReport?.({ ...msg.sender, messageId: msg._id, content: msg.content, username: msg.sender?.username }); setMenuPos(null) } },
            ...(canDel ? [{ icon: 'fa-solid fa-trash', label: 'Delete', color: '#ef4444', disabled: false, fn: () => { socket?.emit('deleteMessage', { messageId: msg._id, roomId }); setMenuPos(null) } }] : []),
          ].map((item, i, arr) => (
            <button key={i} onClick={item.disabled ? undefined : item.fn}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 13px', background: 'none', border: 'none', cursor: item.disabled ? 'not-allowed' : 'pointer', textAlign: 'left', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', opacity: item.disabled ? 0.35 : 1 }}
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
        style={{ display: 'flex', gap: 8, padding: '3px 10px', alignItems: 'flex-start', cursor: 'pointer', transition: 'background .1s', borderRadius: 4, maxWidth: '100%', overflow: 'hidden' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Avatar */}
        <img
          src={msg.sender?.avatar || '/default_images/avatar/default_guest.png'}
          alt=""
          onClick={e => { e.stopPropagation(); onMiniCard?.(msg.sender, { x: Math.min(e.clientX, window.innerWidth - 240), y: Math.min(e.clientY + 8, window.innerHeight - 360) }) }}
          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${bdr}`, flexShrink: 0, cursor: 'pointer', marginTop: 2 }}
          onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }}
        />

        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* Name row — FIX 2: username ALWAYS visible */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            {/* FIX 2: Rank icon at correct size (16px = same as public/icons/ranks SVG natural size) */}
            <RIcon rank={msg.sender?.rank} size={16} />
            <span
              className={[nameInfo.cls, nameFontCls].filter(Boolean).join(' ')}
              style={{
                fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', lineHeight: 1.2,
                ...(nameFontCls ? {} : { fontFamily: nameFontFamily }),
                // FIX 2: if class handles color, no inline color; else always set a visible color
                ...nameInfo.style,
              }}
              onClick={e => { e.stopPropagation(); onMention?.(`@${msg.sender?.username} `) }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              {msg.sender?.username || 'Unknown'}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: (thText || '#fff') + '55', whiteSpace: 'nowrap', flexShrink: 0 }}>{ts}</span>
          </div>

          {/* Bubble — FIX 2: message text ALWAYS visible */}
          <div
            className={[bubCls, msgFontCls].filter(Boolean).join(' ')}
            style={{
              // FIX 2: default font = Nunito (not inherited from global body which might be different)
              fontFamily: msgFontCls ? undefined : msgFontFamily,
              fontSize: msg.sender?.msgFontSize ? `${msg.sender.msgFontSize}px` : '0.875rem',
              lineHeight: 1.55,
              // FIX 2: text color always resolves to readable value
              color: msgTextColor,
              wordBreak: 'break-word', overflowWrap: 'break-word',
              fontWeight: msg.sender?.bubbleStyle?.includes('bold') ? 700 : 400,
              fontStyle: msg.sender?.bubbleStyle?.includes('italic') ? 'italic' : 'normal',
              maxWidth: '100%',
              // Bubble bg: only add padding/radius when a colored class is applied
              ...(hasBubbleBg ? {
                padding: '5px 10px',
                borderRadius: '3px 10px 10px 10px',
                display: 'inline-block',
                textShadow: 'none',
              } : {}),
            }}
          >
            {msg.replyTo && <QuotedMessage replyTo={msg.replyTo} tObj={tObj} />}
            {msg.type === 'gift'
              ? <span>🎁 {msg.content}</span>
              : msg.type === 'image'
              ? <ImagePreview src={msg.content} />
              : msg.type === 'gif'
              ? <ImagePreview src={msg.content} isGif={true} />
              : msg.type === 'voice'
              ? <VoiceMessage src={msg.content} />
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
