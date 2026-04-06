// ChatMessages.jsx — FIXED v2
// Fixes:
//   - Msg now accepts tObj prop — text/username colors correctly use theme colors
//   - QuotedMessage has overflow:hidden + no horizontal scroll
//   - Username color fallback uses tObj.text instead of empty string
//   - Message text color fallback uses tObj.text
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

const SOLID_COLORS = [
  '#ff3333','#ff6633','#ff9933','#ffcc33','#cccc00','#99cc00','#59b300','#829356',
  '#008000','#00e639','#00e673','#00e6ac','#00cccc','#03add8','#3366ff','#107896',
  '#004d99','#6633ff','#9933ff','#cc33ff','#ff33ff','#ff33cc','#ff3399','#ff3366',
  '#604439','#795548','#a97f70','#bc9b8f','#9E9E9E','#879fab','#698796','#495f69',
]
const BUB_GRADS = [
  'linear-gradient(135deg,#ff0000,#ff6600)','linear-gradient(135deg,#ff6600,#ffcc00)',
  'linear-gradient(135deg,#ffcc00,#00cc00)','linear-gradient(135deg,#00cc00,#00ccff)',
  'linear-gradient(135deg,#00ccff,#0066ff)','linear-gradient(135deg,#0066ff,#9900ff)',
  'linear-gradient(135deg,#9900ff,#ff0099)','linear-gradient(135deg,#ff0099,#ff6600)',
  'linear-gradient(135deg,#e040fb,#3f51b5)','linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#f093fb,#f5576c)','linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#fa709a,#fee140)','linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)','linear-gradient(135deg,#ff9a9e,#fecfef)',
]

// getBubClassName: returns CSS class from public/bubbles.css (bubcolor1-32, bubgrad1-40, bubneon1-40)
function getBubClassName(bubbleColor) {
  if (!bubbleColor) return ''
  if (bubbleColor.startsWith('bubcolor') || bubbleColor.startsWith('bubgrad') || bubbleColor.startsWith('bubneon')) return bubbleColor
  return ''
}
// getBubStyle: only sets text color/shadow since background is handled by CSS class
function getBubStyle(bubbleColor) {
  if (!bubbleColor) return {}
  if (bubbleColor.startsWith('bubcolor') || bubbleColor.startsWith('bubgrad') || bubbleColor.startsWith('bubneon')) return {}
  return {}
}

function formatTs(createdAt) {
  if (!createdAt) return ''
  const d = new Date(createdAt), now = new Date()
  const isToday     = d.toDateString() === now.toDateString()
  const isYesterday = d.toDateString() === new Date(now - 86400000).toDateString()
  const time = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
  if (isToday)     return time
  if (isYesterday) return `Yesterday ${time}`
  return `${d.toLocaleDateString([],{day:'2-digit',month:'2-digit',year:'2-digit'})} ${time}`
}

// QuotedMessage — no horizontal scroll, ellipsis on overflow
export function QuotedMessage({ replyTo, tObj }) {
  if (!replyTo) return null
  const thText = tObj?.text || '#333'
  const senderName = replyTo.sender?.username || 'Unknown'
  let preview = ''
  if      (replyTo.type==='image')   preview = '📷 Image'
  else if (replyTo.type==='gif')     preview = '🖼️ GIF'
  else if (replyTo.type==='voice')   preview = '🎤 Voice message'
  else if (replyTo.type==='youtube') preview = '▶️ YouTube video'
  else preview = (replyTo.content||'').length > 100
    ? (replyTo.content||'').slice(0,100) + '…'
    : (replyTo.content||'')

  return (
    <div style={{
      display:'flex', gap:8,
      background:'rgba(99,102,241,0.10)', borderLeft:'3px solid #6366f1',
      borderRadius:'0 8px 8px 0', padding:'5px 10px', marginBottom:5,
      maxWidth:'100%', overflow:'hidden',   // ← key fix
    }}>
      <div style={{flex:1, minWidth:0, overflow:'hidden'}}>
        <div style={{fontSize:'0.7rem',fontWeight:800,color:'#6366f1',marginBottom:2,fontFamily:'Nunito,sans-serif',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
          ↩ {senderName}
        </div>
        <div style={{fontSize:'0.75rem',color:thText+'99',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'Nunito,sans-serif'}}>
          {preview}
        </div>
      </div>
    </div>
  )
}

// System message type config
const SYS_TEXT = {
  join:    { color:'#22c55e',  bg:'rgba(34,197,94,0.08)',    border:'rgba(34,197,94,0.25)',    icon:'fa-solid fa-right-to-bracket' },
  leave:   { color:'#9ca3af',  bg:'rgba(156,163,175,0.08)',  border:'rgba(156,163,175,0.2)',   icon:'fa-solid fa-right-from-bracket' },
  kick:    { color:'#f59e0b',  bg:'rgba(245,158,11,0.08)',   border:'rgba(245,158,11,0.25)',   icon:'fa-solid fa-user-slash' },
  ban:     { color:'#ef4444',  bg:'rgba(239,68,68,0.08)',    border:'rgba(239,68,68,0.25)',    icon:'fa-solid fa-ban' },
  mute:    { color:'#f59e0b',  bg:'rgba(245,158,11,0.08)',   border:'rgba(245,158,11,0.25)',   icon:'fa-solid fa-microphone-slash' },
  mod:     { color:'#6366f1',  bg:'rgba(99,102,241,0.08)',   border:'rgba(99,102,241,0.25)',   icon:'fa-solid fa-user-shield' },
  dice:    { color:'#7c3aed',  bg:'rgba(124,58,237,0.08)',   border:'rgba(124,58,237,0.2)',    icon:'fa-solid fa-dice' },
  gift:    { color:'#ec4899',  bg:'rgba(236,72,153,0.08)',   border:'rgba(236,72,153,0.2)',    icon:'fa-solid fa-gift' },
  system:  { color:'#1a73e8',  bg:'rgba(26,115,232,0.07)',   border:'rgba(26,115,232,0.2)',    icon:'fa-solid fa-circle-info' },
  warning: { color:'#f59e0b',  bg:'rgba(245,158,11,0.08)',   border:'rgba(245,158,11,0.25)',   icon:'fa-solid fa-triangle-exclamation' },
  error:   { color:'#ef4444',  bg:'rgba(239,68,68,0.08)',    border:'rgba(239,68,68,0.25)',    icon:'fa-solid fa-circle-xmark' },
  success: { color:'#22c55e',  bg:'rgba(34,197,94,0.08)',    border:'rgba(34,197,94,0.25)',    icon:'fa-solid fa-circle-check' },
}

function Msg({ msg, onMiniCard, onMention, onHide, onWhisper, onQuote, myId, myLevel, socket, roomId, onYTMinimize, onIgnore, tObj }) {
  // Theme-aware defaults — fallback to safe values if tObj not yet available
  const thText   = tObj?.text   || '#333333'
  const thAccent = tObj?.accent || '#1a73e8'
  const thBg     = tObj?.bg_chat || '#ffffff'

  const isSystem = ['system','join','leave','kick','mute','ban','mod','dice','gift','warning','success','error'].includes(msg.type)

  // ── WHISPER ──
  if (msg.type === 'whisper' || msg.isEcho) {
    return <WhisperMessage msg={msg} myId={myId} onWhisperReply={onWhisper}/>
  }

  // ── SYSTEM MESSAGE ──
  if (isSystem) {
    const cfg = SYS_TEXT[msg.type] || SYS_TEXT.system
    const ts = formatTs(msg.createdAt)
    const canDelSys = myLevel >= 11

    function renderSysContent(content) {
      if (!content) return null
      const m = content.match(/^(.+?)\s+(has|was|have|joined|left)\b(.*)$/i)
      if (m) {
        return (
          <>
            <span style={{fontWeight:800, color:cfg.color}}>{m[1]}</span>
            <span style={{color:cfg.color, opacity:0.85}}> {m[2]}{m[3]}</span>
          </>
        )
      }
      return <span style={{color:cfg.color, opacity:0.9}}>{content}</span>
    }

    return (
      <div
        style={{display:'flex',alignItems:'center',gap:0,padding:'3px 10px',margin:'1px 0',position:'relative'}}
        onMouseEnter={e => e.currentTarget.querySelector('.sys-del-btn')?.style && (e.currentTarget.querySelector('.sys-del-btn').style.opacity='1')}
        onMouseLeave={e => e.currentTarget.querySelector('.sys-del-btn')?.style && (e.currentTarget.querySelector('.sys-del-btn').style.opacity='0')}
      >
        <div style={{display:'inline-flex',alignItems:'center',gap:6,background:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:20,padding:'3px 10px 3px 4px',maxWidth:'min(95%,520px)',flexShrink:1,minWidth:0}}>
          <div style={{width:20,height:20,borderRadius:'50%',background:cfg.color+'22',border:`1px solid ${cfg.color}44`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <i className={cfg.icon} style={{fontSize:9,color:cfg.color}}/>
          </div>
          <span style={{fontSize:'0.77rem',fontFamily:'Nunito,sans-serif',lineHeight:1.3,minWidth:0}}>
            {renderSysContent(msg.content)}
          </span>
          <span style={{fontSize:'0.58rem',color:'#bbb',whiteSpace:'nowrap',flexShrink:0,marginLeft:4}}>{ts}</span>
        </div>
        {canDelSys && (
          <button className="sys-del-btn"
            onClick={e => { e.stopPropagation(); socket?.emit('deleteMessage',{messageId:msg._id,roomId}) }}
            style={{position:'absolute',right:4,top:'50%',transform:'translateY(-50%)',background:'rgba(239,68,68,.1)',border:'none',borderRadius:5,color:'#ef4444',cursor:'pointer',fontSize:10,padding:'2px 5px',opacity:0,transition:'opacity .15s',whiteSpace:'nowrap'}}>
            <i className="fa-solid fa-trash" style={{fontSize:9}}/>
          </button>
        )}
      </div>
    )
  }

  // ── REGULAR MESSAGE ──
  const ri  = R(msg.sender?.rank)
  const bdr = GBR(msg.sender?.gender, msg.sender?.rank)
  const ts  = formatTs(msg.createdAt)
  const isMine = (msg.sender?._id === myId || msg.sender?.userId === myId)
  const canMod = myLevel >= 11 && RL(msg.sender?.rank) < myLevel
  const canDel = isMine || canMod

  // Fonts via FONT_MAP; CSS classes bnfont1-16 / bfont1-30 also loaded from public/fonts.css
  const nameFontId     = msg.sender?.nameFont || ''
  const msgFontId      = msg.sender?.msgFont  || msg.sender?.msgFontStyle || ''
  const nameFontFamily = nameFontId ? (FONT_MAP[nameFontId] || 'inherit') : 'inherit'
  const msgFontFamily  = msgFontId  ? (FONT_MAP[msgFontId]  || 'inherit') : 'inherit'
  const nameFontCls = nameFontId && nameFontId.startsWith('font') ? 'bnfont' + nameFontId.replace('font','') : ''
  const msgFontCls  = msgFontId  && msgFontId.startsWith('font')  ? 'bfont'  + msgFontId.replace('font','')  : ''

  // Username color — returns {cls, style} using CSS classes from public/colors.css
  function nameColorInfo() {
    const nc = msg.sender?.nameColor
    if (!nc || nc === 'user') return { cls: '', style: {color: thText} }
    // CSS classes: bcolor1-32, bgrad1-40, bneon1-32
    if (nc.startsWith('bcolor') || nc.startsWith('bgrad') || nc.startsWith('bneon')) {
      return { cls: nc, style: {} }
    }
    if (nc.startsWith('#') || nc.startsWith('rgb')) return { cls: '', style: {color:nc} }
    return { cls: '', style: {color:thText} }
  }
  const nameInfo = nameColorInfo()

  function renderContent(text) {
    if (!text) return null
    return text.split(/(@\w+)/g).map((p, i) =>
      p.startsWith('@')
        ? <span key={i} style={{color:thAccent,fontWeight:700,background:`${thAccent}18`,padding:'0 3px',borderRadius:4,cursor:'pointer'}} onClick={() => onMention?.(p)}>{p}</span>
        : p
    )
  }

  const [menuPos, setMenuPos] = useState(null)

  function handleClick(e) {
    e.stopPropagation()
    if (menuPos) { setMenuPos(null); return }
    setMenuPos({x:Math.min(e.clientX, window.innerWidth-185), y:Math.min(e.clientY, window.innerHeight-200)})
  }

  const bubCls   = getBubClassName(msg.sender?.bubbleColor)
  const bubStyle = getBubStyle(msg.sender?.bubbleColor)

  const senderForWhisper = msg.sender ? {
    ...msg.sender,
    userId: msg.sender.userId || msg.sender._id,
    _id: msg.sender._id,
    username: msg.sender.username,
  } : null

  return (
    <>
      {menuPos && (<div onClick={() => setMenuPos(null)} style={{position:'fixed',inset:0,zIndex:8888}}/>)}
      {menuPos && (
        <div style={{position:'fixed',top:menuPos.y,left:menuPos.x,background:'#1e293b',border:'1px solid #334155',borderRadius:10,zIndex:8889,minWidth:175,overflow:'hidden',boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
          {[
            {icon:'fa-solid fa-reply-all',    label:'Quote',   color:'#60a5fa', disabled:false,     fn:() => { onQuote?.(msg); setMenuPos(null) }},
            {icon:'fa-solid fa-hand-lizard',  label:'Whisper', color:'#a78bfa', disabled:isMine,    fn:() => { if (!senderForWhisper||isMine) return; onWhisper?.(senderForWhisper); setMenuPos(null) }},
            {icon:'fa-solid fa-eye-slash',    label:'Hide',    color:'#9ca3af', disabled:false,     fn:() => { onHide?.(msg._id); setMenuPos(null) }},
            {icon:'fa-sharp fa-solid fa-flag',label:'Report',  color:'#ef4444', disabled:false,     fn:() => setMenuPos(null)},
            ...(canDel ? [{icon:'fa-solid fa-trash', label:'Delete', color:'#f87171', disabled:false, fn:() => { socket?.emit('deleteMessage',{messageId:msg._id,roomId}); setMenuPos(null) }}] : []),
          ].map((item, i, arr) => (
            <button key={i} onClick={item.disabled ? undefined : item.fn}
              style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'9px 13px',background:'none',border:'none',cursor:item.disabled?'not-allowed':'pointer',textAlign:'left',borderBottom:i<arr.length-1?'1px solid #334155':'none',opacity:item.disabled?0.35:1}}
              onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background='#334155' }}
              onMouseLeave={e => e.currentTarget.style.background='none'}>
              <i className={item.icon} style={{fontSize:13,color:item.color,width:16,flexShrink:0}}/>
              <span style={{fontSize:'0.83rem',fontWeight:700,color:'#f1f5f9'}}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
      <div
        onClick={handleClick}
        style={{display:'flex',gap:8,padding:'2px 10px',alignItems:'flex-start',cursor:'pointer',transition:'background .1s',borderRadius:4,maxWidth:'100%',overflow:'hidden'}}
        onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,.04)'}
        onMouseLeave={e => e.currentTarget.style.background='transparent'}
      >
        <img
          src={msg.sender?.avatar || '/default_images/avatar/default_guest.png'} alt=""
          onClick={e => { e.stopPropagation(); onMiniCard(msg.sender, {x:Math.min(e.clientX,window.innerWidth-240), y:Math.min(e.clientY+8,window.innerHeight-360)}) }}
          style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${bdr}`,flexShrink:0,cursor:'pointer',marginTop:2}}
          onError={e => { e.target.src='/default_images/avatar/default_guest.png' }}/>
        <div style={{flex:1, minWidth:0, overflow:'hidden'}}>
          {/* Name row */}
          <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:1}}>
            <RIcon rank={msg.sender?.rank} size={12}/>
            <span
              className={[nameInfo.cls, nameFontCls].filter(Boolean).join(' ')}
              style={{fontSize:'0.82rem',fontWeight:700,cursor:'pointer',...(nameFontCls ? {} : {fontFamily:nameFontFamily}), ...nameInfo.style}}
              onClick={e => { e.stopPropagation(); onMention?.(`@${msg.sender?.username} `) }}
              onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration='none'}
            >
              {msg.sender?.username}
            </span>
            <span style={{marginLeft:'auto',fontSize:'0.6rem',color:thText+'66',whiteSpace:'nowrap',flexShrink:0}}>{ts}</span>
          </div>

          {/* Message content */}
          <div
            className={[bubCls, msgFontCls].filter(Boolean).join(' ')}
            style={{
            fontSize: msg.sender?.msgFontSize ? `${msg.sender.msgFontSize}px` : '0.875rem',
            lineHeight: 1.45,
            color: bubCls
              ? (msg.sender?.msgFontColor || '#fff')
              : (msg.sender?.msgFontColor || thText),
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            fontFamily: msgFontFamily,
            fontWeight:  msg.sender?.bubbleStyle?.includes('bold')   ? 700 : 400,
            fontStyle:   msg.sender?.bubbleStyle?.includes('italic')  ? 'italic' : 'normal',
            maxWidth: '100%',
            ...(bubCls ? {padding:'5px 10px', borderRadius:'3px 10px 10px 10px', display:'inline-block'} : {}),
          }}>
            {msg.replyTo && <QuotedMessage replyTo={msg.replyTo} tObj={tObj}/>}
            {msg.type==='gift'
              ? <span>🎁 {msg.content}</span>
              : msg.type==='image'
              ? <img src={msg.content} alt="" style={{maxWidth:'min(200px,60vw)',borderRadius:8,display:'block'}}/>
              : msg.type==='gif'
              ? <img src={msg.content} alt="GIF" style={{maxWidth:'min(200px,60vw)',borderRadius:8,display:'block'}}/>
              : msg.type==='youtube'
              ? <YTMessage url={msg.content} onMinimize={onYTMinimize}/>
              : (msg.type==='spotify' || isSpotifyUrl?.(msg.content))
              ? <SpotifyEmbed url={msg.content}/>
              : renderContent(msg.content)}
          </div>
        </div>
      </div>
    </>
  )
}

export { Msg }
