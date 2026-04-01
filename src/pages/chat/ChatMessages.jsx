// ChatMessages.jsx — Message rendering with:
// - Single click context menu (not double/long-press)
// - Full quote content with proper replyTo bubble UI
// - Timestamp: actual date when not today
// - Font applied from user settings
// - Whisper button in message menu (fixed target ID)
// - Quote sets replyTo state — not just text injection
// - Grenze Gotisch + all 24 fonts mapped
import { useState } from 'react'
import { API, R, RL, GBR, SYS_CFG, SYSTEM_SENDER, resolveNameColor } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'
import { WhisperMessage } from './ChatWhisper.jsx'
import { SpotifyEmbed, isSpotifyUrl } from '../../components/SpotifyPlayer.jsx'
import { YTMessage } from './ChatMedia.jsx'

export { RIcon }

// Full font map — 24 fonts + Grenze Gotisch
const FONT_MAP = {
  font1: "'Kalam',cursive",
  font2: "'Signika',sans-serif",
  font3: "'Orbitron',sans-serif",
  font4: "'Comic Neue',cursive",
  font5: "'Quicksand',sans-serif",
  font6: "'Pacifico',cursive",
  font7: "'Dancing Script',cursive",
  font8: "'Lobster Two',cursive",
  font9: "'Caveat',cursive",
  font10:"'Rajdhani',sans-serif",
  font11:"'Audiowide',sans-serif",
  font12:"'Nunito',sans-serif",
  font13:"'Grandstander',cursive",
  font14:"'Comic Neue',cursive",
  font15:"'Lemonada',cursive",
  font16:"'Grenze Gotisch',cursive",
  font17:"'Merienda',cursive",
  font18:"'Amita',cursive",
  font19:"'Averia Libre',cursive",
  font20:"'Turret Road',cursive",
  font21:"'Sansita',sans-serif",
  font22:"'Comfortaa',cursive",
  font23:"'Charm',cursive",
  font24:"'Satisfy',cursive",
}

const SOLID_COLORS=[
  '#ff3333','#ff6633','#ff9933','#ffcc33','#cccc00','#99cc00','#59b300','#829356',
  '#008000','#00e639','#00e673','#00e6ac','#00cccc','#03add8','#3366ff','#107896',
  '#004d99','#6633ff','#9933ff','#cc33ff','#ff33ff','#ff33cc','#ff3399','#ff3366',
  '#604439','#795548','#a97f70','#bc9b8f','#9E9E9E','#879fab','#698796','#495f69',
]
const BUB_GRADS=[
  'linear-gradient(135deg,#ff0000,#ff6600)','linear-gradient(135deg,#ff6600,#ffcc00)',
  'linear-gradient(135deg,#ffcc00,#00cc00)','linear-gradient(135deg,#00cc00,#00ccff)',
  'linear-gradient(135deg,#00ccff,#0066ff)','linear-gradient(135deg,#0066ff,#9900ff)',
  'linear-gradient(135deg,#9900ff,#ff0099)','linear-gradient(135deg,#ff0099,#ff6600)',
  'linear-gradient(135deg,#e040fb,#3f51b5)','linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#f093fb,#f5576c)','linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#fa709a,#fee140)','linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)','linear-gradient(135deg,#ff9a9e,#fecfef)',
]

function getBubStyle(bubbleColor) {
  if(!bubbleColor) return {}
  if(bubbleColor.startsWith('bubcolor')) {
    const bg = SOLID_COLORS[parseInt(bubbleColor.replace('bubcolor',''))-1]
    return bg ? {background:bg, padding:'6px 10px', borderRadius:'3px 10px 10px 10px', display:'inline-block'} : {}
  }
  if(bubbleColor.startsWith('bubgrad')) {
    const bg = BUB_GRADS[parseInt(bubbleColor.replace('bubgrad',''))-1]
    return bg ? {background:bg, padding:'6px 10px', borderRadius:'3px 10px 10px 10px', display:'inline-block'} : {}
  }
  return {}
}

// Format timestamp: show real date if not today
function formatTs(createdAt) {
  if(!createdAt) return ''
  const d = new Date(createdAt)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isYesterday = d.toDateString() === new Date(now - 86400000).toDateString()
  const time = d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  if(isToday) return time
  if(isYesterday) return `Yesterday ${time}`
  const date = d.toLocaleDateString([],{day:'2-digit',month:'2-digit',year:'2-digit'})
  return `${date} ${time}`
}

// ── QuotedMessage — proper reply/quote bubble shown inside a message ──
export function QuotedMessage({ replyTo }) {
  if (!replyTo) return null
  const senderName = replyTo.sender?.username || 'Unknown'
  let preview = ''
  if (replyTo.type === 'image') preview = '📷 Image'
  else if (replyTo.type === 'gif') preview = '🖼️ GIF'
  else if (replyTo.type === 'voice') preview = '🎤 Voice message'
  else if (replyTo.type === 'youtube') preview = '▶️ YouTube video'
  else preview = (replyTo.content || '').length > 100
    ? (replyTo.content || '').slice(0, 100) + '…'
    : (replyTo.content || '')

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      background: 'rgba(99,102,241,0.10)',
      borderLeft: '3px solid #6366f1',
      borderRadius: '0 8px 8px 0',
      padding: '5px 10px',
      marginBottom: 5,
      maxWidth: '100%',
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6366f1', marginBottom: 2, fontFamily: 'Nunito,sans-serif' }}>
          ↩ {senderName}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Nunito,sans-serif' }}>
          {preview}
        </div>
      </div>
    </div>
  )
}

function Msg({msg, onMiniCard, onMention, onHide, onWhisper, onQuote, myId, myLevel, socket, roomId, onYTMinimize}) {
  const isSystem = ['system','join','leave','kick','mute','ban','mod','dice','gift','warning','success','error'].includes(msg.type)

  // ── SYSTEM MESSAGE ──
  if(isSystem) {
    const cfg = SYS_CFG[msg.type] || SYS_CFG.system
    const ts = formatTs(msg.createdAt)
    const canDelSys = myLevel >= 11
    return(
      <div style={{display:'flex',alignItems:'flex-start',gap:7,padding:'2px 10px',margin:'1px 0',clear:'both',position:'relative'}}
        onMouseEnter={e=>e.currentTarget.querySelector('.sys-del-btn')?.style&&(e.currentTarget.querySelector('.sys-del-btn').style.opacity='1')}
        onMouseLeave={e=>e.currentTarget.querySelector('.sys-del-btn')?.style&&(e.currentTarget.querySelector('.sys-del-btn').style.opacity='0')}>
        {/* Bot rank icon + system avatar */}
        <div style={{position:'relative',flexShrink:0}}>
          <img src={SYSTEM_SENDER.avatar} alt="System"
            style={{width:26,height:26,borderRadius:'50%',flexShrink:0,marginTop:1,objectFit:'cover',border:'1.5px solid #e4e6ea',background:'#f3f4f6'}}
            onError={e=>{e.target.src='/default_images/avatar/default_bot.png'}}/>
          {/* Bot rank icon badge */}
          <img src="/icons/ranks/bot.svg" alt="" style={{position:'absolute',bottom:-2,right:-3,width:11,height:11,objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
            <img src="/icons/ranks/bot.svg" alt="" style={{width:11,height:11,objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
            <span style={{fontSize:'0.72rem',fontWeight:700,color:'#6b7280',fontFamily:'Outfit,sans-serif'}}>System</span>
            <i className={`fi ${cfg.icon}`} style={{fontSize:'0.6rem',color:cfg.accent}}/>
            <span style={{marginLeft:'auto',fontSize:'0.6rem',color:'#bbb',whiteSpace:'nowrap'}}>{ts}</span>
          </div>
          <div style={{display:'inline-flex',alignItems:'center',gap:5,background:'#f8f9fa',borderLeft:`2.5px solid ${cfg.accent}`,borderRadius:'0 8px 8px 0',padding:'4px 10px',maxWidth:'min(92%,480px)'}}>
            <span style={{fontSize:'0.78rem',color:'#374151',fontWeight:500}}>{msg.content}</span>
          </div>
        </div>
        {canDelSys&&(
          <button className="sys-del-btn" onClick={e=>{e.stopPropagation();socket?.emit('deleteMessage',{messageId:msg._id,roomId})}}
            style={{position:'absolute',right:4,top:'50%',transform:'translateY(-50%)',background:'rgba(239,68,68,.1)',border:'none',borderRadius:5,color:'#ef4444',cursor:'pointer',fontSize:10,padding:'2px 5px',opacity:0,transition:'opacity .15s',whiteSpace:'nowrap'}}>
            <i className="fi fi-sr-trash" style={{fontSize:9}}/>
          </button>
        )}
      </div>
    )
  }

  // ── WHISPER/ECHO MESSAGE — styled distinctly, only visible to sender+recipient ──


  const ri = R(msg.sender?.rank)
  const bdr = GBR(msg.sender?.gender, msg.sender?.rank)
  const col = resolveNameColor(msg.sender?.nameColor, ri.color)
  const ts = formatTs(msg.createdAt)
  const isMine = (msg.sender?._id===myId || msg.sender?.userId===myId)
  const canMod = myLevel >= 11 && RL(msg.sender?.rank) < myLevel
  const canDel = isMine || canMod

  const nameFontFamily = msg.sender?.nameFont ? (FONT_MAP[msg.sender.nameFont] || 'inherit') : 'inherit'
  const msgFontFamily = msg.sender?.msgFontStyle ? (FONT_MAP[msg.sender.msgFontStyle] || 'inherit') : 'inherit'

  function renderContent(text) {
    if(!text) return null
    return text.split(/(@\w+)/g).map((p,i) =>
      p.startsWith('@')
        ? <span key={i} style={{color:'#1a73e8',fontWeight:700,background:'rgba(26,115,232,.1)',padding:'0 3px',borderRadius:4,cursor:'pointer'}} onClick={()=>onMention?.(p)}>{p}</span>
        : p
    )
  }

  const [menuPos,setMenuPos]=useState(null)

  function handleClick(e) {
    e.stopPropagation()
    if(menuPos) { setMenuPos(null); return }
    setMenuPos({x:Math.min(e.clientX,window.innerWidth-185),y:Math.min(e.clientY,window.innerHeight-200)})
  }

  const bubStyle = getBubStyle(msg.sender?.bubbleColor)

  // Normalize sender for whisper — backend onlineUsers uses userId as key
  const senderForWhisper = msg.sender ? {
    ...msg.sender,
    userId: msg.sender.userId || msg.sender._id,
    _id: msg.sender._id,
    username: msg.sender.username,
  } : null

  return(
    <>
    {menuPos&&(<div onClick={()=>setMenuPos(null)} style={{position:'fixed',inset:0,zIndex:8888}}/>)}
    {menuPos&&(
      <div style={{position:'fixed',top:menuPos.y,left:menuPos.x,background:'#1e293b',border:'1px solid #334155',borderRadius:10,zIndex:8889,minWidth:175,overflow:'hidden',boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
        {[
          {
            icon:'fi-sr-reply-all',
            label:'Quote',
            color:'#60a5fa',
            disabled: false,
            fn:()=>{
              // Pass full message object so ChatRoom can set replyTo correctly
              onQuote?.(msg)
              setMenuPos(null)
            }
          },
          {
            icon:'fi-sr-comment-user',
            label:'Whisper',
            color:'#a78bfa',
            disabled: isMine,
            fn:()=>{
              if(!senderForWhisper || isMine) return
              onWhisper?.(senderForWhisper)
              setMenuPos(null)
            }
          },
          {icon:'fi-sr-eye-crossed', label:'Hide',   color:'#9ca3af', disabled:false, fn:()=>{onHide?.(msg._id);setMenuPos(null)}},
          {icon:'fi-sr-flag',        label:'Report', color:'#ef4444', disabled:false, fn:()=>setMenuPos(null)},
          ...(canDel?[{icon:'fi-sr-trash', label:'Delete', color:'#f87171', disabled:false, fn:()=>{
            socket?.emit('deleteMessage',{messageId:msg._id,roomId})
            setMenuPos(null)
          }}]:[]),
        ].map((item,i,arr)=>(
          <button key={i} onClick={item.disabled ? undefined : item.fn}
            style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'9px 13px',background:'none',border:'none',
              cursor:item.disabled?'not-allowed':'pointer',textAlign:'left',
              borderBottom:i<arr.length-1?'1px solid #334155':'none',
              opacity:item.disabled?0.35:1,
            }}
            onMouseEnter={e=>{if(!item.disabled)e.currentTarget.style.background='#334155'}}
            onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <i className={`fi ${item.icon}`} style={{fontSize:13,color:item.color,width:16,flexShrink:0}}/>
            <span style={{fontSize:'0.83rem',fontWeight:700,color:'#f1f5f9'}}>{item.label}</span>
          </button>
        ))}
      </div>
    )}
    <div
      onClick={handleClick}
      style={{display:'flex',gap:8,padding:'2px 10px',alignItems:'flex-start',cursor:'pointer',transition:'background .1s',borderRadius:4}}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,.025)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <img src={msg.sender?.avatar||'/default_images/avatar/default_guest.png'} alt=""
        onClick={e=>{e.stopPropagation();onMiniCard(msg.sender,{x:0,y:0})}}
        style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${bdr}`,flexShrink:0,cursor:'pointer',marginTop:2}}
        onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
      <div style={{flex:1,minWidth:0}}>
        {/* Name row */}
        <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:1}}>
          <RIcon rank={msg.sender?.rank} size={12}/>
          <span
            style={{
              fontSize:'0.82rem',fontWeight:700,cursor:'pointer',
              fontFamily: nameFontFamily,
              ...(msg.sender?.nameColor?.startsWith('bcolor')
                ? {color: SOLID_COLORS[parseInt((msg.sender.nameColor||'').replace('bcolor',''))-1] || col}
                : msg.sender?.nameColor?.startsWith('bgrad')
                ? {background: BUB_GRADS[parseInt((msg.sender.nameColor||'').replace('bgrad',''))-1], WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'}
                : {color: col})
            }}
            onClick={e=>{e.stopPropagation();onMention?.(`@${msg.sender?.username} `)}}
            onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'}
            onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}
          >
            {msg.sender?.username}
          </span>
          <span style={{marginLeft:'auto',fontSize:'0.6rem',color:'#bbb',whiteSpace:'nowrap',flexShrink:0}}>{ts}</span>
        </div>

        {/* Message bubble */}
        <div style={{
          fontSize: msg.sender?.msgFontSize ? `${msg.sender.msgFontSize}px` : '0.875rem',
          lineHeight: 1.45,
          color: bubStyle.background ? (msg.sender?.msgFontColor||'#fff') : (msg.sender?.msgFontColor||'#111827'),
          wordBreak:'break-word',
          fontFamily: msgFontFamily,
          fontWeight: msg.sender?.bubbleStyle?.includes('bold') ? 700 : 400,
          fontStyle: msg.sender?.bubbleStyle?.includes('italic') ? 'italic' : 'normal',
          ...bubStyle,
        }}>
          {/* ── QUOTED MESSAGE BUBBLE — proper reply UI ── */}
          {msg.replyTo && <QuotedMessage replyTo={msg.replyTo} />}

          {msg.type==='gift'    ? <span>🎁 {msg.content}</span>
          :msg.type==='image'   ? <img src={msg.content} alt="" style={{maxWidth:'min(200px,60vw)',borderRadius:8,display:'block'}}/>
          :msg.type==='gif'     ? <img src={msg.content} alt="GIF" style={{maxWidth:'min(200px,60vw)',borderRadius:8,display:'block'}}/>
          :msg.type==='youtube' ? <YTMessage url={msg.content} onMinimize={onYTMinimize}/>
          :msg.type==='spotify'||isSpotifyUrl?.(msg.content) ? <SpotifyEmbed url={msg.content}/>
          :renderContent(msg.content)}
        </div>
      </div>
    </div>
    </>
  )
}

export { Msg }
