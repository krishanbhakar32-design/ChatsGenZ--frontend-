// ============================================================
// ChatMessages.jsx — Message rendering component
// ============================================================
import { useState, useRef } from 'react'
import { API, R, RL, GBR, SYS_CFG, SYSTEM_SENDER, resolveNameColor } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'
import { SpotifyEmbed, isSpotifyUrl } from '../../components/SpotifyPlayer.jsx'

// re-export these for ChatRoom import convenience
export { RIcon }

function Msg({msg,onMiniCard,onMention,onHide,myId,myLevel,socket,roomId}) {
  const isSystem = msg.type==='system'||msg.type==='join'||msg.type==='leave'||msg.type==='kick'||msg.type==='mute'||msg.type==='ban'||msg.type==='mod'||msg.type==='dice'
  if (isSystem) {
    const cfg = SYS_CFG[msg.type] || SYS_CFG.system
    const sysMsgDate = new Date(msg.createdAt)
    const sysNow = new Date()
    const sysIsToday = sysMsgDate.toDateString() === sysNow.toDateString()
    const sysIsYesterday = sysMsgDate.toDateString() === new Date(sysNow - 86400000).toDateString()
    const sysDateLabel = sysIsToday ? 'Today' : sysIsYesterday ? 'Yesterday' : sysMsgDate.toLocaleDateString([],{month:'short',day:'numeric'})
    const sysTimeLabel = sysMsgDate.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
    return (
      <div style={{display:'flex',alignItems:'flex-start',gap:7,padding:'2px 10px 2px 10px',margin:'1px 0',clear:'both'}}>
        {/* System bot avatar */}
        <img
          src={SYSTEM_SENDER.avatar}
          alt="System"
          style={{width:26,height:26,borderRadius:'50%',flexShrink:0,marginTop:1,objectFit:'cover',border:'1.5px solid #e4e6ea',background:'#f3f4f6'}}
          onError={e=>{e.target.src='/default_images/avatar/default_bot.png'}}
        />
        <div style={{flex:1,minWidth:0}}>
          {/* Name row */}
          <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
            <span style={{fontSize:'0.72rem',fontWeight:700,color:'#6b7280',fontFamily:'Outfit,sans-serif'}}>System</span>
            <i className="fi fi-sr-robot" style={{fontSize:'0.6rem',color:'#9ca3af'}}/>
            <span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4}}>
              <span style={{fontSize:'0.6rem',color:'#bbb',whiteSpace:'nowrap'}}>{sysDateLabel}</span>
              <span style={{fontSize:'0.62rem',color:'#9ca3af',whiteSpace:'nowrap'}}>{sysTimeLabel}</span>
            </span>
          </div>
          {/* Single-line bubble */}
          <div style={{
            display:'inline-flex',alignItems:'center',gap:5,
            background:'#f8f9fa',
            borderLeft:`2.5px solid ${cfg.accent}`,
            borderRadius:'0 8px 8px 0',
            padding:'4px 10px',
            maxWidth:'min(92%,480px)',
            overflow:'hidden',
          }}>
            <i className={`fi ${cfg.icon}`} style={{fontSize:'0.65rem',color:cfg.accent,flexShrink:0}}/>
            <span style={{fontSize:'0.78rem',color:'#374151',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{msg.content}</span>
          </div>
        </div>
      </div>
    )
  }
  const ri=R(msg.sender?.rank), bdr=GBR(msg.sender?.gender,msg.sender?.rank)
  const col = resolveNameColor(msg.sender?.nameColor, ri.color)
  const msgDate = new Date(msg.createdAt)
  const now = new Date()
  const isToday = msgDate.toDateString() === now.toDateString()
  const isYesterday = msgDate.toDateString() === new Date(now - 86400000).toDateString()
  const dateLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : msgDate.toLocaleDateString([],{month:'short',day:'numeric'})
  const timeLabel = msgDate.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  const ts = `${dateLabel} ${timeLabel}`
  const isMine=(msg.sender?._id===myId||msg.sender?.userId===myId)

  const renderContent=(text)=>{
    if(!text) return null
    return text.split(/(@\w+)/g).map((p,i)=>
      p.startsWith('@')
        ? <span key={i} style={{color:'#1a73e8',fontWeight:700,background:'#e8f0fe',padding:'0 3px',borderRadius:4}}>{p}</span>
        : p
    )
  }

  const [menuPos,setMenuPos]=useState(null)
  function openMenu(e){
    e.preventDefault(); e.stopPropagation()
    setMenuPos({x:Math.min(e.clientX,window.innerWidth-160),y:Math.min(e.clientY,window.innerHeight-140)})
  }

  return (
    <>
    {menuPos&&(
      <div onClick={()=>setMenuPos(null)} style={{position:'fixed',inset:0,zIndex:8888}}/>
    )}
    {menuPos&&(
      <div style={{position:'fixed',top:menuPos.y,left:menuPos.x,background:'#1e293b',border:'1px solid #334155',borderRadius:10,zIndex:8889,minWidth:170,overflow:'hidden',boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
        {[
          {icon:'fi-sr-reply-all',label:'Quote',sub:'Reply to this post',  onClick:()=>{onMention(`@${msg.sender?.username} "${(msg.content||'').slice(0,50)}" `);setMenuPos(null)}},
          {icon:'fi-sr-eye-crossed',label:'Hide',sub:'Hide from my screen', onClick:()=>{onHide?.(msg._id);setMenuPos(null)}},
          {icon:'fi-sr-flag',label:'Report',sub:'Report this content',color:'#ef4444',onClick:()=>setMenuPos(null)},
        ].map((item,i)=>(
          <button key={i} onClick={item.onClick}
            style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'9px 13px',background:'none',border:'none',cursor:'pointer',textAlign:'left',borderBottom:i<2?'1px solid #334155':'none'}}
            onMouseEnter={e=>e.currentTarget.style.background='#334155'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <i className={`fi ${item.icon}`} style={{fontSize:14,color:item.color||'#60a5fa',width:16,flexShrink:0}}/>
            <div>
              <div style={{fontSize:'0.82rem',fontWeight:700,color:'#f1f5f9'}}>{item.label}</div>
              <div style={{fontSize:'0.68rem',color:'#94a3b8'}}>{item.sub}</div>
            </div>
          </button>
        ))}
      </div>
    )}
    <div style={{display:'flex',gap:8,padding:'2px 10px',alignItems:'flex-start',transition:'background .1s'}}
      onContextMenu={openMenu}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,.02)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <img src={msg.sender?.avatar||'/default_images/avatar/default_guest.png'} alt=""
        onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();onMiniCard(msg.sender,{x:r.left,y:r.bottom+4})}}
        style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${bdr}`,flexShrink:0,cursor:'pointer',marginTop:2}}
        onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
      />
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:1}}>
          <RIcon rank={msg.sender?.rank} size={12}/>
          <span onClick={()=>onMention(msg.sender?.username)} style={{fontSize:'0.82rem',fontWeight:700,color:col,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'} onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>
            {msg.sender?.username}
          </span>
          {/* Timestamp — far right of name row */}
          <span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
            <span style={{fontSize:'0.58rem',color:'#bbb',whiteSpace:'nowrap'}}>{dateLabel}</span>
            <span style={{fontSize:'0.62rem',color:'#9ca3af',whiteSpace:'nowrap'}}>{timeLabel}</span>
          </span>
        </div>
        <div className="msg-bubble" style={{
          fontSize: msg.sender?.msgFontSize ? `${msg.sender.msgFontSize}px` : '0.875rem',
          lineHeight: 1.4,
          color: msg.sender?.msgFontColor || '#111827',
          wordBreak: 'break-word',
          fontFamily: msg.sender?.msgFontStyle
            ? ({'font1':"'Kalam',cursive",'font2':"'Signika',sans-serif",'font3':"'Orbitron',sans-serif",'font4':"'Comic Neue',cursive",'font5':"'Quicksand',sans-serif",'font6':"'Pacifico',cursive",'font7':"'Dancing Script',cursive",'font8':"'Lobster Two',cursive",'font9':"'Caveat',cursive",'font10':"'Rajdhani',sans-serif",'font11':"'Audiowide',sans-serif",'font12':"'Nunito',sans-serif"}[msg.sender.msgFontStyle] || 'inherit')
            : 'inherit',
          fontWeight: msg.sender?.bubbleStyle?.includes('bold') ? 700 : 400,
          fontStyle: msg.sender?.bubbleStyle?.includes('italic') ? 'italic' : 'normal',
          ...(msg.sender?.bubbleColor && msg.sender.bubbleColor.startsWith('bubcolor') ? {
            background: ['#ff3333','#ff6633','#ff9933','#ffcc33','#cccc00','#99cc00','#59b300','#829356','#008000','#00e639','#00e673','#00e6ac','#00cccc','#03add8','#3366ff','#107896','#004d99','#6633ff','#9933ff','#cc33ff','#ff33ff','#ff33cc','#ff3399','#ff3366','#604439','#795548','#a97f70','#bc9b8f','#9E9E9E','#879fab','#698796','#495f69'][parseInt(msg.sender.bubbleColor.replace('bubcolor',''))-1],
            color: msg.sender.msgFontColor || '#fff',
            padding: '6px 10px',
            borderRadius: '3px 10px 10px 10px',
            display: 'inline-block',
          } : msg.sender?.bubbleColor && (msg.sender.bubbleColor.startsWith('bubgrad') || msg.sender.bubbleColor.startsWith('bubneon')) ? {
            background: ['linear-gradient(90deg,#667eea,#764ba2)','linear-gradient(90deg,#f093fb,#f5576c)','linear-gradient(90deg,#4facfe,#00f2fe)','linear-gradient(90deg,#43e97b,#38f9d7)','linear-gradient(90deg,#fa709a,#fee140)','linear-gradient(90deg,#ff9a56,#ff6b9d)','linear-gradient(90deg,#c471f5,#fa71cd)','linear-gradient(90deg,#12c2e9,#c471ed)','linear-gradient(90deg,#f64f59,#c471ed)','linear-gradient(90deg,#24fe41,#fdbb2d)','linear-gradient(45deg,#ff0844,#ffb199)','linear-gradient(45deg,#00d2ff,#3a7bd5)','linear-gradient(45deg,#f953c6,#b91d73)','linear-gradient(45deg,#36d1dc,#5b86e5)','linear-gradient(45deg,#ff9068,#fd746c)','linear-gradient(45deg,#667eea,#764ba2)'][parseInt(msg.sender.bubbleColor.replace(/bubgrad|bubneon/,''))-1] || '',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: '3px 10px 10px 10px',
            display: 'inline-block',
          } : {}),
        }}>
          {msg.type==='gift'   ?<span>🎁 {msg.content}</span>
          :msg.type==='image'  ?<img src={msg.content} alt="" style={{maxWidth:'min(200px,60vw)',borderRadius:8,display:'block'}}/>
          :msg.type==='gif'    ?<img src={msg.content} alt="GIF" style={{maxWidth:'min(200px,60vw)',borderRadius:8,display:'block'}}/>
          :msg.type==='youtube'?<YTMessage url={msg.content}/>
          :msg.type==='spotify'||isSpotifyUrl(msg.content)?<SpotifyEmbed url={msg.content}/>
          :msg.type==='whisper'?<span style={{background:'rgba(99,102,241,.1)',border:'1px solid #6366f1',borderRadius:6,padding:'2px 8px',fontSize:'0.84rem',color:'#818cf8'}}>👁️ <em>{renderContent(msg.content)}</em></span>:renderContent(msg.content)}
        </div>
      </div>
    </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// USER ITEM
// ─────────────────────────────────────────────────────────────

export { Msg }
