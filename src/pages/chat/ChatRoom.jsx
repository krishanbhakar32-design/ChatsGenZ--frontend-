import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useToast } from '../../components/Toast.jsx'
import { Sounds } from '../../utils/sounds.js'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

const RANKS = {
  guest:      { label:'Guest',      color:'#888888', icon:'guest.svg',       level:1  },
  user:       { label:'User',       color:'#aaaaaa', icon:'user.svg',        level:2  },
  vipfemale:  { label:'VIP Female', color:'#FF4488', icon:'vip_female.svg',  level:3  },
  vipmale:    { label:'VIP Male',   color:'#4488FF', icon:'vip_male.svg',    level:4  },
  butterfly:  { label:'Butterfly',  color:'#FF66AA', icon:'butterfly.svg',   level:5  },
  ninja:      { label:'Ninja',      color:'#777777', icon:'ninja.svg',       level:6  },
  fairy:      { label:'Fairy',      color:'#FF88CC', icon:'fairy.svg',       level:7  },
  legend:     { label:'Legend',     color:'#FF8800', icon:'legend.png',      level:8  },
  bot:        { label:'Bot',        color:'#00cc88', icon:'bot.svg',         level:9  },
  premium:    { label:'Premium',    color:'#aa44ff', icon:'premium.svg',     level:10 },
  moderator:  { label:'Moderator',  color:'#00AAFF', icon:'mod.svg',         level:11 },
  admin:      { label:'Admin',      color:'#FF4444', icon:'admin.svg',       level:12 },
  superadmin: { label:'Superadmin', color:'#FF00FF', icon:'super_admin.svg', level:13 },
  owner:      { label:'Owner',      color:'#FFD700', icon:'owner.svg',       level:14 },
}
const STATUSES = [
  {id:'online',    label:'Online',    color:'#22c55e'},
  {id:'away',      label:'Away',      color:'#f59e0b'},
  {id:'busy',      label:'Busy',      color:'#ef4444'},
  {id:'invisible', label:'Invisible', color:'#9ca3af'},
]
const GBR = (g,r) => r==='bot'?'transparent':({male:'#03add8',female:'#ff99ff',couple:'#9c6fde',other:'#cccccc'}[g]||'#cccccc')
const R   = r => RANKS[r] || RANKS.guest
const RL  = r => RANKS[r]?.level || 0

// ── ICON helper - use SVG from public folder with fi fallback ──
function UIIcon({name, size=18, fallback, style={}}) {
  const [err,setErr]=useState(false)
  if(!err) return <img src={`/default_images/icons/${name}.svg`} alt="" style={{width:size,height:size,objectFit:'contain',flexShrink:0,...style}} onError={()=>setErr(true)}/>
  return <i className={`fi ${fallback||'fi-sr-info'}`} style={{fontSize:size-2,...style}}/>
}

function RIcon({rank,size=16}) {
  const ri = R(rank)
  return <img src={`/icons/ranks/${ri.icon}`} alt="" style={{width:size,height:size,objectFit:'contain',background:'transparent',flexShrink:0,display:'inline-block'}} onError={e=>e.target.style.display='none'}/>
}

// ── System message config (from adultchat pattern) ──
const SYS_CFG = {
  join:    { icon:'👋', color:'#22c55e', bg:'#f0fdf4', border:'#86efac' },
  leave:   { icon:'🚪', color:'#6b7280', bg:'#f9fafb', border:'#e4e6ea' },
  kick:    { icon:'👢', color:'#f59e0b', bg:'#fffbeb', border:'#fde68a' },
  mute:    { icon:'🔇', color:'#f59e0b', bg:'#fffbeb', border:'#fde68a' },
  ban:     { icon:'🚫', color:'#ef4444', bg:'#fef2f2', border:'#fecaca' },
  mod:     { icon:'🛡️', color:'#6366f1', bg:'#eef2ff', border:'#c7d2fe' },
  dice:    { icon:'🎲', color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe' },
  gift:    { icon:'🎁', color:'#ec4899', bg:'#fdf4ff', border:'#f0abfc' },
  system:  { icon:'📢', color:'#1a73e8', bg:'#eff6ff', border:'#bfdbfe' },
}

// ── GIF PICKER ──
function GifPicker({onSelect,onClose}) {
  const [q,setQ]=useState('')
  const [gifs,setGifs]=useState([])
  const [loading,setLoading]=useState(false)
  const timer=useRef(null)
  const token=localStorage.getItem('cgz_token')

  useEffect(()=>{
    // Load trending on open
    setLoading(true)
    fetch(`${API}/api/giphy?limit=12`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(d=>setGifs(d.gifs||[])).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  useEffect(()=>{
    clearTimeout(timer.current)
    if(!q.trim()) return
    setLoading(true)
    timer.current=setTimeout(()=>{
      fetch(`${API}/api/giphy?q=${encodeURIComponent(q)}&limit=12`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>setGifs(d.gifs||[])).catch(()=>{}).finally(()=>setLoading(false))
    },400)
    return()=>clearTimeout(timer.current)
  },[q])

  return(
    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:'calc(100% + 6px)',left:0,right:0,background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,.15)',zIndex:50,maxHeight:'min(250px,55vw)',minHeight:180,display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        <span style={{fontWeight:700,fontSize:'0.82rem',color:'#374151'}}>🎞 GIF</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:14,padding:0}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      <div style={{padding:'6px 8px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search GIFs..."
          style={{width:'100%',padding:'6px 10px',border:'1.5px solid #e4e6ea',borderRadius:20,fontSize:'0.8rem',outline:'none',boxSizing:'border-box'}}
          onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:5,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:3}}>
        {loading&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:12,color:'#9ca3af',fontSize:'0.78rem'}}>Loading...</div>}
        {!loading&&gifs.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:12,color:'#9ca3af',fontSize:'0.78rem'}}>No GIFs found</div>}
        {gifs.map((g,i)=>(
          <img key={i} src={g.preview||g.url} alt="" onClick={()=>onSelect(g.url)}
            style={{width:'100%',aspectRatio:'1',objectFit:'cover',borderRadius:6,cursor:'pointer',border:'2px solid transparent'}}
            onMouseEnter={e=>e.target.style.borderColor='#1a73e8'} onMouseLeave={e=>e.target.style.borderColor='transparent'}/>
        ))}
      </div>
    </div>
  )
}

// ── YOUTUBE PANEL ──
function YTPanel({onClose,onSend}) {
  const [tab,setTab]=useState('link')
  const [link,setLink]=useState('')
  const [preview,setPreview]=useState(null)

  function getVideoId(url) {
    const m=(url||'').match(/(?:youtu\.be\/|v=|embed\/)([\\w-]{11})/)
    return m?m[1]:null
  }
  useEffect(()=>{
    const id=getVideoId(link)
    setPreview(id?{id,thumb:`https://img.youtube.com/vi/${id}/mqdefault.jpg`}:null)
  },[link])

  return(
    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:'calc(100% + 6px)',left:0,right:0,maxWidth:'min(100%,320px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,.15)',zIndex:50}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',borderBottom:'1px solid #f3f4f6'}}>
        <span style={{fontWeight:700,fontSize:'0.82rem',color:'#ef4444'}}>▶ YouTube</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:14,padding:0}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      <div style={{padding:10,display:'flex',flexDirection:'column',gap:8}}>
        <input autoFocus value={link} onChange={e=>setLink(e.target.value)} placeholder="Paste YouTube link..."
          style={{width:'100%',padding:'8px 12px',border:'1.5px solid #e4e6ea',borderRadius:9,fontSize:'0.85rem',outline:'none',boxSizing:'border-box'}}
          onFocus={e=>e.target.style.borderColor='#ef4444'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
        {preview&&(
          <div style={{borderRadius:9,overflow:'hidden',border:'1px solid #e4e6ea'}}>
            <img src={preview.thumb} alt="" style={{width:'100%',display:'block'}}/>
            <button onClick={()=>onSend(`https://www.youtube.com/watch?v=${preview.id}`)}
              style={{width:'100%',padding:'9px',background:'linear-gradient(135deg,#ef4444,#dc2626)',border:'none',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.84rem'}}>
              ▶ Share in Chat
            </button>
          </div>
        )}
        {link&&!preview&&<p style={{textAlign:'center',color:'#9ca3af',fontSize:'0.78rem',margin:0}}>Invalid YouTube link</p>}
      </div>
    </div>
  )
}

// ── EMOTICON PICKER — uses actual PNG files from /icons/emoticon/ ──
const EMOT_FILES = ['amazing','angel','angry','anxious','bad','bigsmile','blink','cool','crisped','cry','cry2','dead','desperate','devil','doubt','feelgood','funny','good','happy','happy3']
const EMOJI_FALLBACK = ['😀','😂','🥰','😍','😎','🥳','😭','😡','🤔','😴','👋','👍','👎','❤️','🔥','✨','🎉','💯','🙏','💪']

function EmoticonPicker({onSelect,onClose}) {
  const [useImg,setUseImg]=useState(true)
  return(
    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:'calc(100% + 6px)',left:0,background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,padding:8,boxShadow:'0 4px 20px rgba(0,0,0,.15)',zIndex:50,width:260}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
        <span style={{fontWeight:700,fontSize:'0.8rem',color:'#374151'}}>Emoticons</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:14,padding:0}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:2}}>
        {EMOT_FILES.map((name,i)=>(
          <button key={i} onClick={()=>onSelect(`:${name}:`)}
            style={{background:'none',border:'none',cursor:'pointer',padding:'3px',borderRadius:6,lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center'}}
            onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <img src={`/icons/emoticon/${name}.png`} alt={name} style={{width:24,height:24,objectFit:'contain'}}
              onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='block'}}/>
            <span style={{display:'none',fontSize:18}}>{EMOJI_FALLBACK[i]||'😊'}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── INLINE YOUTUBE MESSAGE ──
function YTMessage({url}) {
  const [expanded,setExpanded]=useState(false)
  const [closed,setClosed]=useState(false)
  const id=(url||'').match(/(?:v=|youtu\.be\/)([\\w-]{11})/)?.[1]
  if(closed||!id) return null
  if(!expanded) return(
    <div style={{display:'flex',alignItems:'center',gap:8,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'5px 8px',maxWidth:220}}>
      <img src={`https://img.youtube.com/vi/${id}/default.jpg`} alt="" style={{width:48,height:32,objectFit:'cover',borderRadius:5,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:'0.68rem',color:'#ef4444',fontWeight:700}}>▶ YouTube</div>
      </div>
      <div style={{display:'flex',gap:3,flexShrink:0}}>
        <button onClick={()=>setExpanded(true)} style={{background:'#ef4444',border:'none',color:'#fff',borderRadius:6,padding:'2px 7px',cursor:'pointer',fontSize:'0.68rem',fontWeight:700}}>Play</button>
        <button onClick={()=>setClosed(true)} style={{background:'#f3f4f6',border:'none',color:'#9ca3af',borderRadius:6,padding:'2px 5px',cursor:'pointer',fontSize:10}}>✕</button>
      </div>
    </div>
  )
  return(
    <div style={{position:'relative',maxWidth:'min(100%,260px)',width:'min(260px,55vw)',borderRadius:9,overflow:'hidden',border:'1px solid #e4e6ea'}}>
      <div style={{position:'absolute',top:4,right:4,zIndex:5,display:'flex',gap:3}}>
        <button onClick={()=>setExpanded(false)} style={{background:'rgba(0,0,0,.7)',border:'none',color:'#fff',borderRadius:'50%',width:20,height:20,cursor:'pointer',fontSize:9,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
        <button onClick={()=>setClosed(true)} style={{background:'rgba(0,0,0,.7)',border:'none',color:'#fff',borderRadius:'50%',width:20,height:20,cursor:'pointer',fontSize:9,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
      </div>
      <iframe width="100%" height="158" src={`https://www.youtube.com/embed/${id}?autoplay=1`}
        title="YouTube" frameBorder="0" allow="autoplay;encrypted-media" allowFullScreen style={{display:'block',height:'min(158px,35vw)'}}/>
    </div>
  )
}

// ── SPIN WHEEL ──
function SpinWheelGame({socket,myGold,onClose}) {
  const [spinning,setSpinning]=useState(false)
  const [rotation,setRotation]=useState(0)
  const [result,setResult]=useState(null)
  const [bet,setBet]=useState(10)
  const [notification,setNotification]=useState(null)

  // Segments with multipliers
  const SEGS=[
    {label:'2×',  mult:2,   color:'#1a73e8'},{label:'0×',  mult:0,   color:'#ef4444'},
    {label:'1.5×',mult:1.5, color:'#059669'},{label:'💀',  mult:0,   color:'#6b7280'},
    {label:'3×',  mult:3,   color:'#f59e0b'},{label:'0×',  mult:0,   color:'#ef4444'},
    {label:'1.5×',mult:1.5, color:'#059669'},{label:'💀',  mult:0,   color:'#6b7280'},
  ]
  const n=SEGS.length, sa=360/n, cx=100, cy=100, r=88

  const BET_STEPS=[2,5,10,20,50,100,200,500]
  function incBet(){const i=BET_STEPS.findIndex(v=>v>=bet);setBet(BET_STEPS[Math.min(i+1,BET_STEPS.length-1)])}
  function decBet(){const i=BET_STEPS.findLastIndex(v=>v<bet);setBet(i>=0?BET_STEPS[i]:BET_STEPS[0])}

  function spin() {
    if(spinning||bet<2) return
    setSpinning(true); setResult(null); setNotification(null)
    const idx=Math.floor(Math.random()*n)
    const target=5*360+(n-idx)*sa+sa/2
    setRotation(prev=>prev+target)
    setTimeout(()=>{
      const seg=SEGS[idx]
      const winAmt=Math.floor(bet*seg.mult)
      const profit=winAmt-bet
      setSpinning(false); setResult({...seg,bet,winAmt,profit})
      // Top floating notification
      setNotification({
        text: seg.mult>0
          ? `🎡 You won ${winAmt} Gold! (+${profit})`
          : `🎡 Better luck next time! (-${bet})`,
        win: seg.mult>0
      })
      setTimeout(()=>setNotification(null),3500)
      socket?.emit('spinWheel',{})
    },3200)
  }

  return(
    <>
      {/* Top floating notification */}
      {notification&&(
        <div style={{position:'fixed',top:60,left:'50%',transform:'translateX(-50%)',zIndex:9999,
          background:notification.win?'#dcfce7':'#fee2e2',
          border:`1px solid ${notification.win?'#86efac':'#fecaca'}`,
          color:notification.win?'#15803d':'#dc2626',
          padding:'10px 20px',borderRadius:30,fontWeight:700,fontSize:'0.9rem',
          boxShadow:'0 4px 20px rgba(0,0,0,.2)',fontFamily:'Outfit,sans-serif',
          animation:'slideDown .3s ease-out',whiteSpace:'nowrap'}}>
          {notification.text}
        </div>
      )}
      <div onClick={e=>e.stopPropagation()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1005,padding:16}}>
        <div style={{background:'#fff',borderRadius:18,padding:'16px 14px',maxWidth:240,width:'100%',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.95rem',color:'#111827'}}>🎡 Spin Wheel</span>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:15}}><i className="fi fi-sr-cross-small"/></button>
          </div>
          {/* Wheel */}
          <div style={{position:'relative',width:200,height:200,margin:'0 auto 10px'}}>
            <div style={{position:'absolute',top:-8,left:'50%',transform:'translateX(-50%)',width:0,height:0,borderLeft:'8px solid transparent',borderRight:'8px solid transparent',borderTop:'16px solid #ef4444',zIndex:10}}/>
            <svg width={200} height={200} style={{transition:spinning?'transform 3.2s cubic-bezier(0.17,0.67,0.12,0.99)':'',transform:`rotate(${rotation}deg)`,transformOrigin:'center'}}>
              {SEGS.map((seg,i)=>{
                const s=(i*sa-90)*Math.PI/180, e=((i+1)*sa-90)*Math.PI/180
                const x1=cx+r*Math.cos(s),y1=cy+r*Math.sin(s),x2=cx+r*Math.cos(e),y2=cy+r*Math.sin(e)
                const m=((i+0.5)*sa-90)*Math.PI/180,tx=cx+(r*.66)*Math.cos(m),ty=cy+(r*.66)*Math.sin(m)
                return(
                  <g key={i}>
                    <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`} fill={seg.color} stroke="#fff" strokeWidth={2}/>
                    <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={10} fontWeight={700}>{seg.label}</text>
                  </g>
                )
              })}
              <circle cx={cx} cy={cy} r={14} fill="#fff" stroke="#e4e6ea" strokeWidth={2}/>
            </svg>
          </div>
          {/* Bet payout preview */}
          <div style={{background:'#f9fafb',borderRadius:8,padding:'6px 10px',marginBottom:8,fontSize:'0.75rem',color:'#374151',display:'flex',justifyContent:'space-around'}}>
            <span>Cost: <strong style={{color:'#ef4444'}}>{bet}G</strong></span>
            <span>3×: <strong style={{color:'#f59e0b'}}>{bet*3}G</strong></span>
            <span>2×: <strong style={{color:'#1a73e8'}}>{bet*2}G</strong></span>
            <span>1.5×: <strong style={{color:'#059669'}}>{Math.floor(bet*1.5)}G</strong></span>
          </div>
          {/* Bet field */}
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10,justifyContent:'center'}}>
            <button onClick={decBet} style={{width:28,height:28,borderRadius:'50%',border:'1.5px solid #e4e6ea',background:'#f9fafb',cursor:'pointer',fontWeight:700,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',color:'#374151'}}>−</button>
            <div style={{background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:8,padding:'4px 16px',fontWeight:800,fontSize:'0.95rem',color:'#111827',minWidth:60,textAlign:'center'}}>{bet} Gold</div>
            <button onClick={incBet} style={{width:28,height:28,borderRadius:'50%',border:'1.5px solid #1a73e8',background:'#e8f0fe',cursor:'pointer',fontWeight:700,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',color:'#1a73e8'}}>+</button>
          </div>
          <button onClick={spin} disabled={spinning||bet>=(myGold||9999)}
            style={{width:'100%',padding:'10px',borderRadius:10,border:'none',background:spinning?'#f3f4f6':'linear-gradient(135deg,#f59e0b,#d97706)',color:spinning?'#9ca3af':'#fff',fontWeight:800,cursor:spinning?'not-allowed':'pointer',fontSize:'0.88rem',fontFamily:'Outfit,sans-serif'}}>
            {spinning?'Spinning...':'🎡 Spin!'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// MINI CARD
// ─────────────────────────────────────────────────────────────
// MINI CARD
// ─────────────────────────────────────────────────────────────
function MiniCard({user,myLevel,pos,onClose,onFull,onGift,socket,roomId}) {
  if (!user) return null
  const ri=R(user.rank), bdr=GBR(user.gender,user.rank)
  const canMod=myLevel>=11&&RL(user.rank)<myLevel
  const canBan=myLevel>=12&&RL(user.rank)<myLevel
  const token=localStorage.getItem('cgz_token')
  const x=Math.min(pos.x,window.innerWidth-225), y=Math.min(pos.y,window.innerHeight-320)
  return (
    <div style={{position:'fixed',zIndex:9999,top:y,left:x,background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,width:218,boxShadow:'0 8px 28px rgba(0,0,0,.15)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <div style={{height:36,background:`linear-gradient(135deg,${ri.color}33,#e8f0fe)`}}/>
      <div style={{display:'flex',alignItems:'flex-end',gap:8,padding:'0 12px',marginTop:-18,marginBottom:8}}>
        <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:38,height:38,borderRadius:'50%',border:`2px solid ${bdr}`,objectFit:'cover',background:'#fff',flexShrink:0}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        <div style={{paddingBottom:2,minWidth:0}}>
          <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.875rem',color:user.nameColor||'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.username}</div>
          <div style={{display:'flex',alignItems:'center',gap:4}}><RIcon rank={user.rank} size={12}/><span style={{fontSize:'0.68rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
        </div>
      </div>
      <div style={{padding:'0 8px 8px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
        {[
          {icon:'fi-ss-user',label:'Profile',onClick:onFull},
          {icon:'fi-sr-comments',label:'PM'},
          {icon:'fi-sr-phone-call',label:'Call',onClick:()=>{socket?.emit('callUser',{toUserId:user._id||user.userId,callType:'video',callId:`c_${Date.now()}`});onClose()}},
          {icon:'fi-sr-gift',label:'Gift',color:'#7c3aed',onClick:()=>{onGift(user);onClose()}},
          myLevel>=2&&{icon:'fi-sr-user-add',label:'Friend',color:'#059669',onClick:()=>{fetch(`${API}/api/users/friend/${user._id||user.userId}`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{});onClose()}},
          myLevel>=2&&{icon:'fi-sr-user-block',label:'Ignore',color:'#6b7280'},
          canMod&&{icon:'fi-sr-volume-mute',label:'Mute',color:'#f59e0b',onClick:()=>socket?.emit('muteUser',{targetUserId:user._id||user.userId,roomId,minutes:5})},
          canMod&&{icon:'fi-sr-user-slash',label:'Kick',color:'#ef4444',onClick:()=>{socket?.emit('kickUser',{targetUserId:user._id||user.userId,roomId});onClose()}},
          canBan&&{icon:'fi-sr-ban',label:'Ban',color:'#dc2626',onClick:()=>{socket?.emit('banUser',{targetUserId:user._id||user.userId,roomId});onClose()}},
          {icon:'fi-sr-flag',label:'Report',color:'#ef4444'},
        ].filter(Boolean).map((b,i)=>(
          <button key={i} onClick={b.onClick} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 7px',background:'#f9fafb',border:'1px solid #e4e6ea',borderRadius:7,cursor:'pointer',fontSize:'0.72rem',fontWeight:600,color:b.color||'#374151',transition:'all .12s'}} onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}} onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e4e6ea'}}>
            <i className={`fi ${b.icon}`} style={{fontSize:11}}/>{b.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PROFILE MODAL
// ─────────────────────────────────────────────────────────────
function ProfileModal({user,myLevel,socket,roomId,onClose,onGift}) {
  if (!user) return null
  const ri=R(user.rank), bdr=GBR(user.gender,user.rank)
  const canMod=myLevel>=11&&RL(user.rank)<myLevel
  const canBan=myLevel>=12&&RL(user.rank)<myLevel
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.45)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:18,maxWidth:340,width:'100%',overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,.18)'}}>
        <div style={{height:88,background:`linear-gradient(135deg,${ri.color}44,#e8f0fe)`,position:'relative'}}>
          <button onClick={onClose} style={{position:'absolute',top:10,right:10,background:'rgba(255,255,255,.8)',border:'none',width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
          {user.countryCode&&user.countryCode!=='ZZ'&&<img src={`/icons/flags/${user.countryCode.toUpperCase()}.png`} alt="" style={{position:'absolute',bottom:10,right:12,width:22,height:14,borderRadius:2}} onError={e=>e.target.style.display='none'}/>}
        </div>
        <div style={{display:'flex',justifyContent:'center',marginTop:-36}}>
          <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:72,height:72,borderRadius:'50%',border:`3px solid ${bdr}`,objectFit:'cover',background:'#fff'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        </div>
        <div style={{padding:'10px 18px 18px',textAlign:'center'}}>
          <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1.05rem',color:user.nameColor||'#111827'}}>{user.username}</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,margin:'4px 0 12px'}}><RIcon rank={user.rank} size={14}/><span style={{fontSize:'0.75rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
          {user.mood&&<p style={{fontSize:'0.8rem',color:'#6b7280',marginBottom:8,fontStyle:'italic'}}>"{user.mood}"</p>}
          {user.about&&<p style={{fontSize:'0.8rem',color:'#6b7280',marginBottom:12,lineHeight:1.5}}>{user.about}</p>}
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:14}}>
            {[{l:'Level',v:user.level||1,c:'#1a73e8'},{l:'Gold',v:user.gold||0,c:'#d97706'},{l:'Msgs',v:user.totalMessages||0,c:'#7c3aed'}].map(s=>(
              <div key={s.l} style={{textAlign:'center',background:'#f9fafb',borderRadius:8,padding:'5px 12px'}}>
                <div style={{fontSize:'0.62rem',color:'#9ca3af'}}>{s.l}</div>
                <div style={{fontSize:'0.9rem',fontWeight:800,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center'}}>
            {[
              {icon:'fi-sr-comments',label:'Private'},
              {icon:'fi-sr-phone-call',label:'Call',onClick:()=>{socket?.emit('callUser',{toUserId:user._id||user.userId,callType:'video',callId:`c_${Date.now()}`});onClose()}},
              {icon:'fi-sr-gift',label:'Gift',color:'#7c3aed',onClick:()=>{onGift(user);onClose()}},
              {icon:'fi-sr-user-add',label:'Friend',color:'#059669'},
              {icon:'fi-sr-flag',label:'Report',color:'#ef4444'},
              canMod&&{icon:'fi-sr-volume-mute',label:'Mute',color:'#f59e0b',onClick:()=>socket?.emit('muteUser',{targetUserId:user._id||user.userId,roomId,minutes:5})},
              canMod&&{icon:'fi-sr-user-slash',label:'Kick',color:'#ef4444',onClick:()=>{socket?.emit('kickUser',{targetUserId:user._id||user.userId,roomId});onClose()}},
              canBan&&{icon:'fi-sr-ban',label:'Ban',color:'#dc2626'},
            ].filter(Boolean).map((b,i)=>(
              <button key={i} onClick={b.onClick} style={{display:'flex',alignItems:'center',gap:4,padding:'7px 10px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:8,cursor:'pointer',fontSize:'0.78rem',fontWeight:600,color:b.color||'#374151',transition:'all .12s'}} onMouseEnter={e=>{e.currentTarget.style.background='#f0f7ff';e.currentTarget.style.borderColor=b.color||'#1a73e8'}} onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e4e6ea'}}>
                <i className={`fi ${b.icon}`} style={{fontSize:12}}/>{b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MESSAGE — system messages styled like adultchat
// ─────────────────────────────────────────────────────────────
function Msg({msg,onMiniCard,onMention,myId,myLevel,socket,roomId}) {
  const isSystem = msg.type==='system'||msg.type==='join'||msg.type==='leave'||msg.type==='kick'||msg.type==='mute'||msg.type==='ban'||msg.type==='mod'||msg.type==='dice'
  if (isSystem) {
    const cfg = SYS_CFG[msg.type] || SYS_CFG.system
    return (
      <div style={{textAlign:'center',padding:'2px 12px',margin:'1px 0'}}>
        <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'#f3f4f6',padding:'2px 12px',borderRadius:20,fontSize:'0.72rem',color:cfg.color,fontWeight:600}}>
          <span style={{fontSize:'0.85rem'}}>{cfg.icon}</span>
          <span style={{color:'#374151'}}>{msg.content}</span>
        </span>
      </div>
    )
  }
  const ri=R(msg.sender?.rank), bdr=GBR(msg.sender?.gender,msg.sender?.rank)
  const col=msg.sender?.nameColor||ri.color
  const ts=new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  const isMine=(msg.sender?._id===myId||msg.sender?.userId===myId)
  const canDel=isMine||myLevel>=11

  const renderContent=(text)=>{
    if(!text) return null
    return text.split(/(@\w+)/g).map((p,i)=>
      p.startsWith('@')
        ? <span key={i} style={{color:'#1a73e8',fontWeight:700,background:'#e8f0fe',padding:'0 3px',borderRadius:4}}>{p}</span>
        : p
    )
  }

  return (
    <div style={{display:'flex',gap:8,padding:'2px 10px',alignItems:'flex-start',transition:'background .1s'}}
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
          <span style={{fontSize:'0.63rem',color:'#9ca3af'}}>{ts}</span>
          {canDel&&<button onClick={()=>socket?.emit('deleteMessage',{messageId:msg._id,roomId})} style={{background:'none',border:'none',cursor:'pointer',color:'#d1d5db',fontSize:10,padding:0,marginLeft:2,display:'none'}} className="del-btn"><i className="fi fi-sr-trash"/></button>}
        </div>
        <div className="msg-bubble" style={{fontSize:'0.875rem',lineHeight:1.4,color:'#111827',wordBreak:'break-word'}}>
          {msg.type==='gift'   ?<span>🎁 {msg.content}</span>
          :msg.type==='image'  ?<img src={msg.content} alt="" style={{maxWidth:'min(200px,60vw)',borderRadius:8,display:'block'}}/>
          :msg.type==='gif'    ?<img src={msg.content} alt="GIF" style={{maxWidth:'min(200px,60vw)',borderRadius:8,display:'block'}}/>
          :msg.type==='youtube'?<YTMessage url={msg.content}/>
          :renderContent(msg.content)}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// USER ITEM
// ─────────────────────────────────────────────────────────────
function UserItem({u,onClick}) {
  const ri=R(u.rank), col=u.nameColor||ri.color
  return (
    <div onClick={()=>onClick(u)} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 10px',cursor:'pointer',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <div style={{position:'relative',flexShrink:0}}>
        <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${GBR(u.gender,u.rank)}`,display:'block'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        <span style={{position:'absolute',bottom:0,right:0,width:6,height:6,background:'#22c55e',borderRadius:'50%',border:'1.5px solid #fff'}}/>
      </div>
      <span style={{flex:1,fontSize:'0.8rem',fontWeight:700,color:col,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username}</span>
      <RIcon rank={u.rank} size={14}/>
      {u.countryCode&&u.countryCode!=='ZZ'&&<img src={`/icons/flags/${u.countryCode.toUpperCase()}.png`} alt="" style={{width:15,height:10,flexShrink:0,borderRadius:1}} onError={e=>e.target.style.display='none'}/>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RIGHT SIDEBAR
// ─────────────────────────────────────────────────────────────
function RightSidebar({users,myLevel,onUserClick,onClose}) {
  const [tab,setTab]=useState('users')
  const [search,setSearch]=useState('')
  const [rankF,setRankF]=useState('all')

  const sorted=[...users].sort((a,b)=>{const d=RL(b.rank)-RL(a.rank);return d!==0?d:(a.username||'').localeCompare(b.username||'')})
  const staff=sorted.filter(u=>RL(u.rank)>=11)
  const base=tab==='staff'?staff:sorted
  const filtered=base.filter(u=>{
    if(tab==='search') return (!search||u.username.toLowerCase().includes(search.toLowerCase()))&&(rankF==='all'||u.rank===rankF)
    return true
  })

  const TABS=[
    {id:'users', icon:'fi-sr-users',        title:'Users'},
    {id:'staff', icon:'fi-sr-shield-check', title:'Staff'},
    {id:'search',icon:'fi-sr-search',       title:'Search'},
  ]

  return (
    <div style={{width:200,borderLeft:'1px solid #e4e6ea',background:'#fff',display:'flex',flexDirection:'column',flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',borderBottom:'1px solid #e4e6ea',flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} title={t.title}
            style={{flex:1,padding:'9px 2px',border:'none',background:'none',cursor:'pointer',borderBottom:`2px solid ${tab===t.id?'#1a73e8':'transparent'}`,color:tab===t.id?'#1a73e8':'#9ca3af',fontSize:14,transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className={`fi ${t.icon}`}/>
          </button>
        ))}
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:'4px 7px',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      {tab==='search'&&(
        <div style={{padding:'6px 8px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Username..."
            style={{width:'100%',padding:'5px 9px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:7,fontSize:'0.78rem',outline:'none',boxSizing:'border-box',color:'#111827',marginBottom:5,fontFamily:'Nunito,sans-serif'}}
            onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
          <select value={rankF} onChange={e=>setRankF(e.target.value)} style={{width:'100%',padding:'4px',background:'#f9fafb',border:'1px solid #e4e6ea',borderRadius:6,fontSize:'0.73rem',outline:'none',color:'#374151'}}>
            <option value="all">All Ranks</option>
            {Object.entries(RANKS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      )}
      <div style={{padding:'4px 10px 2px',fontSize:'0.62rem',fontWeight:700,color:'#9ca3af',letterSpacing:'1px',textTransform:'uppercase',flexShrink:0}}>
        {tab==='staff'?'Staff':'Online'} · {filtered.length}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {filtered.length===0
          ? <p style={{textAlign:'center',color:'#9ca3af',fontSize:'0.76rem',padding:'14px 10px'}}>{tab==='staff'?'No staff online':tab==='search'?'No results':'No users'}</p>
          : filtered.map((u,i)=><UserItem key={u.userId||u._id||i} u={u} onClick={onUserClick}/>)
        }
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LEFT SIDEBAR — icon strip + label (like adultchat)
// ─────────────────────────────────────────────────────────────
function LeftSidebar({room,nav,socket,roomId,onClose}) {
  const [panel,setPanel]=useState(null)
  // Icons match adultchat: fa-rss for wall, fa-newspaper for news, fa-comments for forum
  const ITEMS=[
    {id:'rooms',       icon:'fi-sr-house-chimney',  label:'Room List',    color:'#1a73e8'},
    {id:'wall',        icon:'fi-sr-rss',             label:'Friends Wall', color:'#7c3aed'},
    {id:'news',        icon:'fi-sr-newspaper',       label:'News',         color:'#059669'},
    {id:'forum',       icon:'fi-sr-comments-alt',    label:'Forum',        color:'#f59e0b'},
    {id:'games',       icon:'fi-sr-dice',            label:'Games',        color:'#ec4899'},
    {id:'leaderboard', icon:'fi-sr-medal',           label:'Leaderboards', color:'#d97706'},
    {id:'username',    icon:'fi-sr-user-pen',        label:'Username',     color:'#6366f1'},
    {id:'contact',     icon:'fi-sr-envelope',        label:'Contact',      color:'#14b8a6'},
    {id:'premium',     icon:'fi-sr-diamond',         label:'Premium',      color:'#f59e0b'},
  ]

  return (
    <div style={{display:'flex',height:'100%',flexShrink:0}}>
      {/* Icon strip with labels - like adultchat left menu */}
      <div style={{width:56,background:'#f8f9fa',borderRight:'1px solid #e4e6ea',display:'flex',flexDirection:'column',alignItems:'center',padding:'6px 0',gap:1,overflowY:'auto'}}>
        {/* Room icon at top */}
        <div style={{padding:'4px 0 8px',borderBottom:'1px solid #2d3148',width:'100%',textAlign:'center',marginBottom:4}}>
          <img src={room?.icon||'/default_images/rooms/default_room.png'} alt="" style={{width:28,height:28,borderRadius:7,objectFit:'cover',margin:'0 auto',display:'block'}} onError={e=>e.target.style.display='none'}/>
          <div style={{fontSize:'0.5rem',color:'#9ca3af',fontWeight:600,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',padding:'0 2px'}}>{room?.name||'Room'}</div>
        </div>
        {ITEMS.map(item=>(
          <button key={item.id} title={item.label} onClick={()=>setPanel(p=>p===item.id?null:item.id)}
            style={{width:'100%',padding:'7px 2px 5px',border:'none',background:panel===item.id?`${item.color}15`:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,color:panel===item.id?item.color:'#6b7280',transition:'all .12s',borderLeft:panel===item.id?`2px solid ${item.color}`:'2px solid transparent'}}
            onMouseEnter={e=>{if(panel!==item.id){e.currentTarget.style.background=`${item.color}10`;e.currentTarget.style.color=item.color}}}
            onMouseLeave={e=>{if(panel!==item.id){e.currentTarget.style.background='none';e.currentTarget.style.color='#8892b0'}}}>
            <i className={`fi ${item.icon}`} style={{fontSize:16}}/>
            <span style={{fontSize:'0.48rem',fontWeight:700,letterSpacing:'0.2px',textAlign:'center',lineHeight:1.2,maxWidth:48,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      {panel&&(
        <div style={{width:240,background:'#fff',borderRight:'1px solid #e4e6ea',display:'flex',flexDirection:'column',boxShadow:'2px 0 8px rgba(0,0,0,.07)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderBottom:'1px solid #e4e6ea',flexShrink:0}}>
            <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:'#111827'}}>{ITEMS.find(i=>i.id===panel)?.label}</span>
            <button onClick={()=>setPanel(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
          </div>
          {panel==='rooms'      &&<RoomListPanel nav={nav}/>}
          {panel==='games'      &&<GamesPanel socket={socket} roomId={roomId} myGold={0}/>}
          {panel==='leaderboard'&&<LeaderboardPanel/>}
          {panel==='username'   &&<UsernamePanel/>}
          {panel==='news'       &&<SimplePanel icon="📰" msg="No announcements yet."/>}
          {panel==='wall'       &&<SimplePanel icon="📝" msg="Wall posts coming soon!"/>}
          {panel==='forum'      &&<SimplePanel icon="💬" msg="Forum coming soon!"/>}
          {panel==='contact'    &&<ContactPanel/>}
          {panel==='premium'    &&<PremiumPanel/>}
        </div>
      )}
    </div>
  )
}

function SimplePanel({icon,msg}) {
  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center',color:'#9ca3af'}}>
      <div style={{fontSize:32,marginBottom:8}}>{icon}</div>
      <div style={{fontSize:'0.8rem'}}>{msg}</div>
    </div>
  )
}

function ContactPanel() {
  const [sent,setSent]=useState(false), [msg,setMsg]=useState(''), [sub,setSub]=useState('')
  const token=localStorage.getItem('cgz_token')
  async function submit(e) {
    e.preventDefault()
    if(!msg.trim()) return
    await fetch(`${API}/api/contact`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({subject:sub||'Support',message:msg})}).catch(()=>{})
    setSent(true)
  }
  if(sent) return <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center'}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div style={{fontWeight:700,color:'#059669'}}>Message Sent!</div></div>
  return(
    <div style={{flex:1,padding:12,display:'flex',flexDirection:'column',gap:8}}>
      <input value={sub} onChange={e=>setSub(e.target.value)} placeholder="Subject..."
        style={{padding:'8px 12px',border:'1.5px solid #e4e6ea',borderRadius:8,fontSize:'0.84rem',outline:'none'}}/>
      <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Your message..." rows={5}
        style={{padding:'8px 12px',border:'1.5px solid #e4e6ea',borderRadius:8,fontSize:'0.84rem',outline:'none',resize:'none'}}/>
      <button onClick={submit} style={{padding:'10px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#14b8a6,#0d9488)',color:'#fff',fontWeight:700,cursor:'pointer'}}>Send</button>
    </div>
  )
}

function PremiumPanel() {
  return(
    <div style={{flex:1,padding:12,overflowY:'auto'}}>
      <div style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',borderRadius:12,padding:14,marginBottom:12,textAlign:'center',color:'#fff'}}>
        <div style={{fontSize:28,marginBottom:4}}>💎</div>
        <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1rem'}}>Go Premium</div>
      </div>
      {[{d:7,p:199,b:'Weekly'},{d:30,p:599,b:'Monthly'},{d:90,p:1499,b:'3 Months'},{d:365,p:4999,b:'1 Year',best:true}].map(plan=>(
        <div key={plan.d} style={{background:plan.best?'#fef3c7':'#f9fafb',border:`1.5px solid ${plan.best?'#f59e0b':'#e4e6ea'}`,borderRadius:9,padding:'10px 12px',marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700,fontSize:'0.88rem',color:'#111827'}}>{plan.b}{plan.best?' ⭐':''}</div>
              <div style={{fontSize:'0.73rem',color:'#9ca3af'}}>{plan.d} days</div>
            </div>
            <div style={{fontWeight:800,color:'#d97706',fontSize:'0.95rem'}}>{plan.p} 🪙</div>
          </div>
          <button style={{width:'100%',marginTop:7,padding:'7px',borderRadius:7,border:'none',background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.82rem'}}>Buy with Gold</button>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ROOM LIST PANEL
// ─────────────────────────────────────────────────────────────
function RoomListPanel({nav}) {
  const [rooms,setRooms]=useState([]), [load,setLoad]=useState(true)
  useEffect(()=>{
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/rooms`,{headers:{Authorization:`Bearer ${t}`}}).then(r=>r.json()).then(d=>setRooms(d.rooms||[])).catch(()=>{}).finally(()=>setLoad(false))
  },[])
  if(load) return <div style={{textAlign:'center',padding:20}}><div style={{width:22,height:22,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>
  return (
    <div style={{flex:1,overflowY:'auto'}}>
      {rooms.map(r=>(
        <div key={r._id} onClick={()=>nav(`/chat/${r._id}`)} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid #f3f4f6',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <img src={r.icon||'/default_images/rooms/default_room.png'} alt="" style={{width:30,height:30,borderRadius:7,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'0.82rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</div>
            <div style={{fontSize:'0.68rem',color:'#22c55e',fontWeight:600}}>{r.currentUsers||0} online</div>
          </div>
          <i className="fi fi-sr-angle-right" style={{fontSize:10,color:'#9ca3af',flexShrink:0}}/>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// GAMES PANEL — with SpinWheel
// ─────────────────────────────────────────────────────────────
// ── KENO GAME ──
function KenoGame({socket,onClose}) {
  const [selected,setSel]=useState([])
  const [bet,setBet]=useState(2)
  const [result,setResult]=useState(null)
  const [waiting,setWait]=useState(false)
  const NUMS=Array.from({length:40},(_,i)=>i+1)

  const BET_STEPS=[2,4,5,10,20,50,100]
  function incBet(){const i=BET_STEPS.findIndex(v=>v>bet);setBet(i>=0?BET_STEPS[i]:BET_STEPS[BET_STEPS.length-1])}
  function decBet(){const i=BET_STEPS.findLastIndex(v=>v<bet);setBet(i>=0?BET_STEPS[i]:BET_STEPS[0])}

  function toggleNum(n) {
    if(waiting) return
    setSel(p=>p.includes(n)?p.filter(x=>x!==n):p.length<10?[...p,n]:p)
    setResult(null)
  }

  function play() {
    if(selected.length<2||waiting) return
    setWait(true)
    socket?.emit('playKeno',{roomId:'',picks:selected,bet})
    // Simulate result for UI (backend sends actual result)
    setTimeout(()=>{
      const drawn=Array.from({length:20},()=>Math.floor(Math.random()*40)+1)
      const hits=selected.filter(n=>drawn.includes(n))
      setResult({drawn,hits})
      setWait(false)
    },1500)
  }

  return(
    <div onClick={e=>e.stopPropagation()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1005,padding:12}}>
      <div style={{background:'#fff',borderRadius:16,padding:'14px',maxWidth:320,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <span style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.95rem',color:'#111827'}}>🎯 Keno</span>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:15}}><i className="fi fi-sr-cross-small"/></button>
        </div>
        <div style={{fontSize:'0.72rem',color:'#9ca3af',marginBottom:6,textAlign:'center'}}>
          Pick 2-10 numbers · {selected.length} selected
        </div>
        {/* Number grid - 8 cols x 5 rows = 40 numbers */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:3,marginBottom:10}}>
          {NUMS.map(n=>{
            const isSel=selected.includes(n)
            const isHit=result&&result.drawn.includes(n)
            const isMatch=result&&result.hits.includes(n)
            let bg='#f9fafb',color='#374151',border='#e4e6ea'
            if(isMatch){bg='#22c55e';color='#fff';border='#22c55e'}
            else if(isHit&&result){bg='#dbeafe';color='#1d4ed8';border='#93c5fd'}
            else if(isSel){bg='#1a73e8';color='#fff';border='#1a73e8'}
            return(
              <button key={n} onClick={()=>toggleNum(n)}
                style={{height:28,borderRadius:6,border:`1.5px solid ${border}`,background:bg,cursor:'pointer',fontSize:'0.7rem',fontWeight:700,color,transition:'all .1s'}}>
                {n}
              </button>
            )
          })}
        </div>
        {/* Bet field */}
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10,justifyContent:'center'}}>
          <button onClick={decBet} style={{width:26,height:26,borderRadius:'50%',border:'1.5px solid #e4e6ea',background:'#f9fafb',cursor:'pointer',fontWeight:700,fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',color:'#374151'}}>−</button>
          <div style={{background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:7,padding:'3px 14px',fontWeight:800,fontSize:'0.88rem',color:'#111827',minWidth:56,textAlign:'center'}}>{bet}G</div>
          <button onClick={incBet} style={{width:26,height:26,borderRadius:'50%',border:'1.5px solid #1a73e8',background:'#e8f0fe',cursor:'pointer',fontWeight:700,fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',color:'#1a73e8'}}>+</button>
          <span style={{fontSize:'0.7rem',color:'#9ca3af'}}>min 2</span>
        </div>
        {result&&(
          <div style={{background:result.hits.length>0?'#d1fae5':'#fee2e2',borderRadius:8,padding:'6px 10px',marginBottom:8,textAlign:'center',fontSize:'0.8rem',fontWeight:700,color:result.hits.length>0?'#065f46':'#dc2626'}}>
            {result.hits.length>0?`🎉 ${result.hits.length} hits! +${result.hits.length*bet}G`:'😅 No hits this time!'}
          </div>
        )}
        <button onClick={play} disabled={selected.length<2||waiting}
          style={{width:'100%',padding:'9px',borderRadius:9,border:'none',background:selected.length<2||waiting?'#f3f4f6':'linear-gradient(135deg,#1a73e8,#1464cc)',color:selected.length<2||waiting?'#9ca3af':'#fff',fontWeight:700,cursor:selected.length<2||waiting?'not-allowed':'pointer',fontSize:'0.86rem',fontFamily:'Outfit,sans-serif'}}>
          {waiting?'Drawing...':selected.length<2?'Select 2+ numbers':`Play (${bet}G)`}
        </button>
      </div>
    </div>
  )
}

function GamesPanel({socket,roomId,myGold}) {
  const [showSpin,setShowSpin]=useState(false)
  const [showKeno,setShowKeno]=useState(false)
  const [showDice,setShowDice]=useState(false)
  const [diceVal,setDiceVal]=useState(null)

  function rollDice() {
    socket?.emit('rollDice',{roomId,bet:10})
    setDiceVal(Math.floor(Math.random()*6)+1)
    setShowDice(true)
  }

  const GAMES=[
    {id:'dice', icon:'fi-sr-dice',  label:'🎲 Dice',       desc:'Roll to win gold',  color:'#7c3aed', action:rollDice},
    {id:'spin', icon:'fi-sr-wheel', label:'🎡 Spin Wheel', desc:'Spin to multiply!', color:'#f59e0b', action:()=>setShowSpin(true)},
    {id:'keno', icon:'fi-sr-grid',  label:'🎯 Keno',       desc:'Pick 2-10 numbers', color:'#1a73e8', action:()=>setShowKeno(true)},
  ]
  return (
    <div style={{padding:10,flex:1,overflowY:'auto'}}>
      {GAMES.map(g=>(
        <button key={g.id} onClick={g.action}
          style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'11px 12px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:10,cursor:'pointer',marginBottom:8,textAlign:'left',transition:'all .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.background=`${g.color}12`;e.currentTarget.style.borderColor=g.color}}
          onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e4e6ea'}}>
          <div style={{width:36,height:36,borderRadius:9,background:`${g.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
            <i className={`fi ${g.icon}`} style={{color:g.color}}/>
          </div>
          <div>
            <div style={{fontSize:'0.86rem',fontWeight:700,color:'#111827'}}>{g.label}</div>
            <div style={{fontSize:'0.72rem',color:'#9ca3af'}}>{g.desc}</div>
          </div>
        </button>
      ))}
      {showDice&&diceVal&&<DiceRoll value={diceVal} onDone={()=>{setShowDice(false);setDiceVal(null)}}/>}
      {showSpin&&<SpinWheelGame socket={socket} myGold={myGold||0} onClose={()=>setShowSpin(false)}/>}
      {showKeno&&<KenoGame socket={socket} onClose={()=>setShowKeno(false)}/>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LEADERBOARD — with proper icons from public folder
// ─────────────────────────────────────────────────────────────
function LeaderboardPanel() {
  const [data,setData]=useState([]), [type,setType]=useState('xp'), [load,setLoad]=useState(false)
  useEffect(()=>{
    setLoad(true)
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/leaderboard/${type}`,{headers:{Authorization:`Bearer ${t}`}})
      .then(r=>r.json()).then(d=>setData(d.users||[])).catch(()=>{}).finally(()=>setLoad(false))
  },[type])

  const TABS=[
    {id:'xp',    label:'Top XP',    icon:'xp.svg',    color:'#7c3aed'},
    {id:'level', label:'Top Level', icon:'level.svg',  color:'#1a73e8'},
    {id:'gold',  label:'Top Gold',  icon:'gold.svg',   color:'#d97706'},
    {id:'gifts', label:'Top Gifts', icon:'gift.svg',   color:'#ec4899'},
  ]

  const getVal=(u)=>{
    if(type==='xp')    return u.xp||0
    if(type==='level') return `Lv.${u.level||1}`
    if(type==='gold')  return u.gold||0
    if(type==='gifts') return u.totalGiftsReceived||0
    return 0
  }
  const MEDAL=['🥇','🥈','🥉']

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Tab buttons with SVG icons */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,padding:'8px 8px 4px',flexShrink:0}}>
        {TABS.map(tp=>(
          <button key={tp.id} onClick={()=>setType(tp.id)}
            style={{display:'flex',alignItems:'center',gap:5,padding:'6px 8px',borderRadius:8,border:`1.5px solid ${type===tp.id?tp.color:'#e4e6ea'}`,background:type===tp.id?`${tp.color}15`:'none',cursor:'pointer',transition:'all .15s'}}>
            <img src={`/default_images/icons/${tp.icon}`} alt="" style={{width:16,height:16,objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
            <span style={{fontSize:'0.7rem',fontWeight:700,color:type===tp.id?tp.color:'#6b7280'}}>{tp.label}</span>
          </button>
        ))}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load?<div style={{textAlign:'center',padding:16}}><div style={{width:20,height:20,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>
        :data.length===0?<div style={{textAlign:'center',padding:20,color:'#9ca3af',fontSize:'0.8rem'}}>No data</div>
        :data.map((u,i)=>(
          <div key={u._id||i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderBottom:'1px solid #f3f4f6'}}>
            <span style={{fontSize:'0.9rem',width:22,flexShrink:0,textAlign:'center'}}>{i<3?MEDAL[i]:`${i+1}`}</span>
            <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:26,height:26,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`1.5px solid ${GBR(u.gender,u.rank)}`}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.8rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username}</div>
              <div style={{display:'flex',alignItems:'center',gap:3}}><RIcon rank={u.rank} size={10}/><span style={{fontSize:'0.65rem',color:R(u.rank).color}}>{R(u.rank).label}</span></div>
            </div>
            <span style={{fontSize:'0.82rem',fontWeight:800,color:TABS.find(t=>t.id===type)?.color||'#1a73e8',flexShrink:0}}>{getVal(u)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// USERNAME PANEL
// ─────────────────────────────────────────────────────────────
function UsernamePanel() {
  const [val,setVal]=useState(''), [msg,setMsg]=useState('')
  async function change() {
    const t=localStorage.getItem('cgz_token')
    const r=await fetch(`${API}/api/users/change-username`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify({newUsername:val})})
    const d=await r.json()
    setMsg(r.ok?'✅ Username changed!':d.error||'Failed')
  }
  return (
    <div style={{padding:14,flex:1}}>
      <div style={{background:'#fef3c7',border:'1px solid #fde68a',borderRadius:8,padding:'9px 12px',marginBottom:12,fontSize:'0.78rem',color:'#92400e'}}>
        Username change costs <strong>500 Gold</strong>
      </div>
      {msg&&<div style={{background:msg.startsWith('✅')?'#d1fae5':'#fee2e2',borderRadius:7,padding:'7px 10px',fontSize:'0.78rem',color:msg.startsWith('✅')?'#065f46':'#dc2626',marginBottom:10}}>{msg}</div>}
      <input value={val} onChange={e=>setVal(e.target.value)} placeholder="New username..."
        style={{width:'100%',padding:'9px 12px',border:'1.5px solid #e4e6ea',borderRadius:8,fontSize:'0.875rem',outline:'none',boxSizing:'border-box',color:'#111827',background:'#f9fafb',marginBottom:8,fontFamily:'Nunito,sans-serif'}}
        onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
      <button onClick={change} style={{width:'100%',padding:'10px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.875rem',fontFamily:'Outfit,sans-serif'}}>
        Change Username
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RADIO PANEL
// ─────────────────────────────────────────────────────────────
function RadioPanel({onClose}) {
  const [all,setAll]=useState([]), [cat,setCat]=useState(null), [cur,setCur]=useState(null), [playing,setPlay]=useState(false)
  const audioRef=useRef(null)
  const CATS=[
    {id:'Hollywood',label:'🎬 Hollywood',langs:['English']},
    {id:'Bollywood',label:'🎭 Bollywood',langs:['Hindi']},
    {id:'Punjabi',  label:'🥁 Punjabi',  langs:['Punjabi']},
    {id:'South',    label:'🎶 South',    langs:['Tamil','Telugu','Kannada','Malayalam']},
    {id:'Bengali',  label:'🎵 Bengali',  langs:['Bengali']},
    {id:'More',     label:'🌐 More',     langs:['Marathi','Hindi/Sanskrit','Instrumental']},
  ]
  useEffect(()=>{
    fetch(`${API}/api/radio`).then(r=>r.json()).then(d=>setAll(d.stations||[])).catch(()=>{})
    return()=>audioRef.current?.pause()
  },[])
  function play(s) {
    if(cur?.id===s.id&&playing){audioRef.current?.pause();setPlay(false);return}
    setCur(s)
    if(audioRef.current){audioRef.current.src=s.streamUrl;audioRef.current.play().then(()=>setPlay(true)).catch(()=>setPlay(false))}
  }
  const catStations=cat?all.filter(s=>CATS.find(c=>c.id===cat)?.langs.includes(s.language)):[]
  return (
    <div style={{position:'absolute',bottom:'100%',left:0,right:0,background:'#fff',border:'1px solid #e4e6ea',borderRadius:'10px 10px 0 0',boxShadow:'0 -4px 20px rgba(0,0,0,.12)',maxHeight:'50vh',display:'flex',flexDirection:'column',zIndex:100}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 13px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          {cat&&<button onClick={()=>setCat(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#1a73e8',fontSize:13,padding:'0 4px 0 0'}}><i className="fi fi-sr-arrow-left"/></button>}
          <i className="fi fi-sr-radio" style={{color:'#1a73e8',fontSize:14}}/>
          <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.88rem',color:'#111827'}}>{playing&&cur?`🎵 ${cur.name}`:cat?CATS.find(c=>c.id===cat)?.label:'Radio'}</span>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {playing&&<button onClick={()=>{audioRef.current?.pause();setPlay(false)}} style={{background:'#fee2e2',border:'none',color:'#dc2626',padding:'2px 8px',borderRadius:20,cursor:'pointer',fontSize:'0.73rem',fontWeight:600}}>⏸</button>}
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:14}}><i className="fi fi-sr-cross-small"/></button>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'5px'}}>
        {!cat?(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:5,padding:'3px'}}>
            {CATS.map(c=>{
              const cnt=all.filter(s=>c.langs.includes(s.language)).length
              return(
                <button key={c.id} onClick={()=>setCat(c.id)}
                  style={{padding:'10px 6px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:9,cursor:'pointer',textAlign:'center',transition:'all .15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e4e6ea'}}>
                  <div style={{fontSize:'1.1rem',marginBottom:3}}>{c.label.split(' ')[0]}</div>
                  <div style={{fontSize:'0.7rem',fontWeight:700,color:'#374151'}}>{c.label.split(' ').slice(1).join(' ')}</div>
                  <div style={{fontSize:'0.62rem',color:'#9ca3af'}}>{cnt} stations</div>
                </button>
              )
            })}
          </div>
        ):catStations.map(s=>(
          <button key={s.id} onClick={()=>play(s)}
            style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:'7px 9px',background:cur?.id===s.id?'#e8f0fe':'none',border:`1px solid ${cur?.id===s.id?'#1a73e8':'transparent'}`,borderRadius:7,cursor:'pointer',marginBottom:2,textAlign:'left'}}>
            <div style={{width:28,height:28,background:'#f3f4f6',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:13}}>{cur?.id===s.id&&playing?'🎵':s.flag||'📻'}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.8rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
              <div style={{fontSize:'0.67rem',color:'#9ca3af'}}>{s.genre}</div>
            </div>
            {cur?.id===s.id&&playing&&<span style={{fontSize:'0.62rem',color:'#1a73e8',fontWeight:700,flexShrink:0}}>▶</span>}
          </button>
        ))}
      </div>
      <audio ref={audioRef} style={{display:'none'}}/>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FRIEND REQUESTS PANEL
// ─────────────────────────────────────────────────────────────
function FriendReqPanel({onClose,onCount}) {
  const [reqs,setReqs]=useState([]), [load,setLoad]=useState(true)
  const token=localStorage.getItem('cgz_token')

  function load_reqs() {
    fetch(`${API}/api/users/me/friends`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json())
      .then(d=>{
        const pending=(d.requests||[]).filter(r=>r.status==='pending')
        setReqs(pending)
        onCount(pending.length)
      }).catch(()=>{}).finally(()=>setLoad(false))
  }

  useEffect(()=>{ load_reqs() },[])

  async function accept(userId) {
    await fetch(`${API}/api/users/friend/${userId}/accept`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    load_reqs()
  }
  async function decline(userId) {
    await fetch(`${API}/api/users/friend/${userId}/decline`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    load_reqs()
  }

  return (
    <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:14,width:'min(300px,92vw)',maxHeight:380,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.14)',zIndex:999}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 13px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.88rem',color:'#111827'}}>Friend Requests</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load&&<div style={{textAlign:'center',padding:20}}><div style={{width:20,height:20,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
        {!load&&reqs.length===0&&(
          <div style={{textAlign:'center',padding:'28px 16px',color:'#9ca3af'}}>
            <i className="fi fi-sr-user-add" style={{fontSize:26,display:'block',marginBottom:8,opacity:0.3}}/>
            <p style={{fontSize:'0.84rem',fontWeight:600,margin:0}}>No pending requests</p>
          </div>
        )}
        {reqs.map(req=>(
          <div key={req._id||req.from?._id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 13px',borderBottom:'1px solid #f9fafb'}}>
            <img src={req.from?.avatar||'/default_images/avatar/default_guest.png'} alt=""
              style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`1.5px solid ${GBR(req.from?.gender,req.from?.rank)}`}}
              onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.84rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{req.from?.username}</div>
              <div style={{display:'flex',alignItems:'center',gap:3}}>
                <RIcon rank={req.from?.rank} size={10}/>
                <span style={{fontSize:'0.68rem',color:R(req.from?.rank).color}}>{R(req.from?.rank).label}</span>
              </div>
            </div>
            <div style={{display:'flex',gap:5,flexShrink:0}}>
              <button onClick={()=>accept(req.from?._id)}
                style={{padding:'5px 10px',borderRadius:7,border:'none',background:'#22c55e',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.75rem'}}>
                ✓ Accept
              </button>
              <button onClick={()=>decline(req.from?._id)}
                style={{padding:'5px 8px',borderRadius:7,border:'1.5px solid #e4e6ea',background:'#f9fafb',color:'#6b7280',fontWeight:600,cursor:'pointer',fontSize:'0.75rem'}}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS PANEL
// ─────────────────────────────────────────────────────────────
function NotifPanel({onClose,onCount}) {
  const [list,setList]=useState([]), [load,setLoad]=useState(true)
  const token=localStorage.getItem('cgz_token')
  useEffect(()=>{
    fetch(`${API}/api/notifications`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{setList(d.notifications||[]);onCount(d.unreadCount||0)}).catch(()=>{}).finally(()=>setLoad(false))
  },[])
  async function markAll(){
    await fetch(`${API}/api/notifications/read-all`,{method:'PUT',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    setList(p=>p.map(n=>({...n,isRead:true}))); onCount(0)
  }
  const unread=list.filter(n=>!n.isRead).length
  return (
    <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:14,width:'min(310px,92vw)',maxHeight:400,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.14)',zIndex:999}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 13px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.88rem',color:'#111827'}}>Notifications</span>
          {unread>0&&<span style={{background:'#ef4444',color:'#fff',fontSize:'0.63rem',fontWeight:700,padding:'1px 6px',borderRadius:10}}>{unread}</span>}
        </div>
        <div style={{display:'flex',gap:5,alignItems:'center'}}>
          {unread>0&&<button onClick={markAll} style={{background:'none',border:'none',cursor:'pointer',color:'#1a73e8',fontSize:'0.73rem',fontWeight:600}}>Mark all</button>}
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load&&<div style={{textAlign:'center',padding:20}}><div style={{width:20,height:20,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
        {!load&&list.length===0&&<div style={{textAlign:'center',padding:'28px 16px',color:'#9ca3af'}}><i className="fi fi-sr-bell" style={{fontSize:28,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.84rem',fontWeight:600,margin:0}}>No notifications</p></div>}
        {list.map(n=>(
          <div key={n._id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 13px',borderBottom:'1px solid #f9fafb',background:n.isRead?'transparent':'#f0f7ff'}}>
            <div style={{width:30,height:30,borderRadius:8,background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>
              <img src={`/default_images/notification/${n.type||'default'}.svg`} alt="" style={{width:20,height:20,objectFit:'contain'}} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='block'}}/>
              <span style={{display:'none'}}>{({gift:'🎁',friend:'👥',like:'❤️',badge:'🏅',levelup:'⬆️',call:'📞'}[n.type])||'🔔'}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.8rem',fontWeight:n.isRead?600:700,color:'#111827'}}>{n.title}</div>
              {n.message&&<div style={{fontSize:'0.73rem',color:'#6b7280',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.message}</div>}
              <div style={{fontSize:'0.65rem',color:'#9ca3af',marginTop:2}}>{new Date(n.createdAt).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
            {!n.isRead&&<span style={{width:7,height:7,background:'#1a73e8',borderRadius:'50%',flexShrink:0,marginTop:4}}/>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DM PANEL
// ─────────────────────────────────────────────────────────────
function DMPanel({me,socket,onClose,onCount}) {
  const [convos,setConvos]=useState([]), [active,setActive]=useState(null), [msgs,setMsgs]=useState([]), [input,setInput]=useState(''), [load,setLoad]=useState(true)
  const bottomRef=useRef(null)
  const token=localStorage.getItem('cgz_token')

  useEffect(()=>{
    fetch(`${API}/api/messages/private/conversations`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setConvos(d.conversations||[])).catch(()=>{}).finally(()=>setLoad(false))
    if(!socket) return
    const fn=(m)=>{ if(active&&(m.from===active.userId||m.to===active.userId)) setMsgs(p=>[...p,m]); loadConvos() }
    socket.on('privateMessage',fn); socket.on('privateMessageSent',fn)
    return()=>{ socket.off('privateMessage',fn); socket.off('privateMessageSent',fn) }
  },[socket,active])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  function loadConvos() {
    fetch(`${API}/api/messages/private/conversations`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setConvos(d.conversations||[])).catch(()=>{})
  }

  async function openConvo(u) { setActive(u); setMsgs([]); fetch(`${API}/api/messages/private/${u.userId||u._id}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setMsgs(d.messages||[])).catch(()=>{}) }

  function sendDM(e) { e.preventDefault(); if(!input.trim()||!active||!socket) return; socket.emit('privateMessage',{toUserId:active.userId||active._id,content:input.trim(),type:'text'}); setInput('') }

  return (
    <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:14,width:'min(330px,94vw)',height:440,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.14)',zIndex:999,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 13px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        {active?(
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={()=>setActive(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#1a73e8',fontSize:13}}><i className="fi fi-sr-arrow-left"/></button>
            <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.86rem',color:'#111827'}}>{active.username}</span>
          </div>
        ):<span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.88rem',color:'#111827'}}>💬 Messages</span>}
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      {!active?(
        <div style={{flex:1,overflowY:'auto'}}>
          {load&&<div style={{textAlign:'center',padding:18}}><div style={{width:20,height:20,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
          {!load&&convos.length===0&&<div style={{textAlign:'center',padding:'28px 16px',color:'#9ca3af'}}><i className="fi fi-sr-envelope" style={{fontSize:26,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.84rem',fontWeight:600,margin:0}}>No messages</p></div>}
          {convos.map(c=>(
            <div key={c.userId} onClick={()=>openConvo(c)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 13px',borderBottom:'1px solid #f9fafb',cursor:'pointer',background:c.unread>0?'#f0f7ff':'transparent',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background=c.unread>0?'#f0f7ff':'transparent'}>
              <img src={c.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:34,height:34,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`1.5px solid ${GBR(c.gender,c.rank)}`}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.82rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.username}</div>
                <div style={{fontSize:'0.72rem',color:'#9ca3af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.lastMessage||'...'}</div>
              </div>
              {c.unread>0&&<span style={{background:'#1a73e8',color:'#fff',fontSize:'0.62rem',fontWeight:700,padding:'1px 6px',borderRadius:10,flexShrink:0}}>{c.unread}</span>}
            </div>
          ))}
        </div>
      ):(
        <>
          <div style={{flex:1,overflowY:'auto',padding:'6px 0'}}>
            {msgs.map((m,i)=>{
              const mine=(m.from===me?._id||m.sender?._id===me?._id)
              return(
                <div key={m._id||i} style={{display:'flex',justifyContent:mine?'flex-end':'flex-start',padding:'2px 10px'}}>
                  <div style={{background:mine?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6',color:mine?'#fff':'#111827',padding:'7px 11px',borderRadius:mine?'12px 3px 12px 12px':'3px 12px 12px 12px',fontSize:'0.84rem',maxWidth:'75%',wordBreak:'break-word'}}>{m.content}</div>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </div>
          <form onSubmit={sendDM} style={{display:'flex',gap:7,padding:'7px 10px',borderTop:'1px solid #e4e6ea',flexShrink:0}}>
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Send a message..."
              style={{flex:1,padding:'7px 11px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:20,fontSize:'0.84rem',outline:'none',color:'#111827',fontFamily:'Nunito,sans-serif'}}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
            <button type="submit" disabled={!input.trim()} style={{width:32,height:32,borderRadius:'50%',border:'none',background:input.trim()?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6',color:input.trim()?'#fff':'#9ca3af',cursor:input.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>
              <i className="fi fi-sr-paper-plane"/>
            </button>
          </form>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// GIFT PANEL
// ─────────────────────────────────────────────────────────────
function GiftPanel({targetUser,myGold,onClose,onSent,socket,roomId}) {
  const [gifts,setGifts]=useState([]), [cat,setCat]=useState('all'), [sel,setSel]=useState(null)
  const token=localStorage.getItem('cgz_token')
  useEffect(()=>{ fetch(`${API}/api/gifts`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setGifts(d.gifts||[])).catch(()=>{}) },[])
  const cats=['all',...new Set(gifts.map(g=>g.category))]
  const filtered=cat==='all'?gifts:gifts.filter(g=>g.category===cat)
  function send() { if(!sel) return; socket?.emit('sendGift',{toUserId:targetUser._id||targetUser.userId,giftId:sel._id,roomId}); onSent?.() }
  const canAfford=sel&&myGold>=sel.price
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1001,background:'rgba(0,0,0,.45)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:12}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,maxWidth:380,width:'100%',overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,.18)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderBottom:'1px solid #f3f4f6'}}>
          <div>
            <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.92rem',color:'#111827'}}>🎁 Send Gift{targetUser?` to ${targetUser.username}`:''}</div>
            <div style={{fontSize:'0.72rem',color:'#d97706',marginTop:2}}>Your balance: {myGold||0} Gold</div>
          </div>
          <button onClick={onClose} style={{background:'#f3f4f6',border:'none',width:28,height:28,borderRadius:7,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#6b7280',fontSize:12}}><i className="fi fi-sr-cross-small"/></button>
        </div>
        <div style={{display:'flex',gap:4,padding:'7px 12px',overflowX:'auto',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:'3px 11px',borderRadius:20,border:`1.5px solid ${cat===c?'#7c3aed':'#e4e6ea'}`,background:cat===c?'#ede9fe':'none',cursor:'pointer',fontSize:'0.72rem',fontWeight:700,color:cat===c?'#7c3aed':'#6b7280',whiteSpace:'nowrap',flexShrink:0}}>
              {c.charAt(0).toUpperCase()+c.slice(1)}
            </button>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,padding:'10px 12px',maxHeight:200,overflowY:'auto'}}>
          {filtered.map(g=>(
            <div key={g._id} onClick={()=>setSel(g)} style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'7px 5px',borderRadius:9,border:`2px solid ${sel?._id===g._id?'#7c3aed':'#e4e6ea'}`,cursor:'pointer',background:sel?._id===g._id?'#ede9fe':'#f9fafb',transition:'all .15s'}} onMouseEnter={e=>{if(sel?._id!==g._id){e.currentTarget.style.borderColor='#c4b5fd'}}} onMouseLeave={e=>{if(sel?._id!==g._id){e.currentTarget.style.borderColor='#e4e6ea'}}}>
              <img src={g.icon} alt={g.name} style={{width:34,height:34,objectFit:'contain',marginBottom:3}} onError={e=>e.target.style.display='none'}/>
              <span style={{fontSize:'0.62rem',fontWeight:700,color:'#374151',textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',width:'100%'}}>{g.name}</span>
              <span style={{fontSize:'0.62rem',fontWeight:700,color:'#d97706'}}>{g.price}🪙</span>
            </div>
          ))}
          {filtered.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:'18px',color:'#9ca3af',fontSize:'0.78rem'}}>No gifts</div>}
        </div>
        <div style={{padding:'9px 12px 13px',borderTop:'1px solid #f3f4f6'}}>
          <button onClick={send} disabled={!sel||!canAfford} style={{width:'100%',padding:'10px',borderRadius:9,border:'none',background:sel&&canAfford?'linear-gradient(135deg,#7c3aed,#5b21b6)':'#f3f4f6',color:sel&&canAfford?'#fff':'#9ca3af',fontWeight:800,cursor:sel&&canAfford?'pointer':'not-allowed',fontSize:'0.84rem',fontFamily:'Outfit,sans-serif'}}>
            {sel?`Send ${sel.name} (${sel.price}G)`:'Select a gift'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// AVATAR DROPDOWN
// ─────────────────────────────────────────────────────────────
function AvatarDropdown({me,status,setStatus,onLeave,socket}) {
  const [open,setOpen]=useState(false)
  const ref=useRef(null), nav=useNavigate()
  useEffect(()=>{
    const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)}
    if(open) document.addEventListener('mousedown',fn)
    return()=>document.removeEventListener('mousedown',fn)
  },[open])
  const ri=R(me?.rank), border=GBR(me?.gender,me?.rank)
  const curSt=STATUSES.find(s=>s.id===status)||STATUSES[0]
  const isStaff=['moderator','admin','superadmin','owner'].includes(me?.rank)
  return (
    <div ref={ref} style={{position:'relative',flexShrink:0}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 3px',display:'flex',alignItems:'center'}}>
        <div style={{position:'relative'}}>
          <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',border:`2px solid ${border}`,display:'block'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
          <span style={{position:'absolute',bottom:0,right:0,width:7,height:7,background:curSt.color,borderRadius:'50%',border:'1.5px solid #fff'}}/>
        </div>
      </button>
      {open&&(
        <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:13,minWidth:210,boxShadow:'0 6px 24px rgba(0,0,0,.13)',zIndex:999,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:'11px 12px 8px',borderBottom:'1px solid #f3f4f6'}}>
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:7}}>
              <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:38,height:38,borderRadius:'50%',border:`2.5px solid ${border}`,objectFit:'cover',flexShrink:0}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
              <div style={{minWidth:0}}>
                <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.88rem',color:me?.nameColor||'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{me?.username}</div>
                <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}><RIcon rank={me?.rank} size={11}/><span style={{fontSize:'0.68rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
              </div>
            </div>
            {!me?.isGuest&&<div style={{display:'flex',gap:10}}>
              <div style={{display:'flex',alignItems:'center',gap:3}}><UIIcon name="gold" size={13}/>  <span style={{fontSize:'0.7rem',fontWeight:700,color:'#d97706'}}>{me?.gold||0}</span></div>
              <div style={{display:'flex',alignItems:'center',gap:3}}><UIIcon name="level" size={13}/><span style={{fontSize:'0.7rem',fontWeight:700,color:'#1a73e8'}}>Lv.{me?.level||1}</span></div>
              <div style={{display:'flex',alignItems:'center',gap:3}}><UIIcon name="xp" size={13}/>   <span style={{fontSize:'0.7rem',fontWeight:700,color:'#7c3aed'}}>{me?.xp||0}XP</span></div>
            </div>}
          </div>
          <div style={{padding:'5px 7px',borderBottom:'1px solid #f3f4f6'}}>
            <div style={{display:'flex',gap:3}}>
              {STATUSES.map(s=>(
                <button key={s.id} onClick={()=>{setStatus(s.id);socket?.emit('updateStatus',{status:s.id})}} title={s.label}
                  style={{flex:1,padding:'4px 2px',borderRadius:6,border:`1.5px solid ${status===s.id?s.color:'#e4e6ea'}`,background:status===s.id?s.color+'18':'none',cursor:'pointer',fontSize:'0.6rem',fontWeight:700,color:status===s.id?s.color:'#6b7280'}}>
                  {s.label.slice(0,3)}
                </button>
              ))}
            </div>
          </div>
          <div style={{padding:'4px'}}>
            {[
              {icon:'fi-ss-user',       label:'My Profile'},
              {icon:'fi-sr-pencil',     label:'Edit Profile'},
              {icon:'fi-sr-wallet',     label:'Wallet'},
              {icon:'fi-sr-layer-group',label:'Level Info'},
              isStaff&&{icon:'fi-sr-shield-check',label:'Mod Panel',   color:'#6366f1'},
              isStaff&&{icon:'fi-sr-dashboard',   label:'Admin Panel', color:'#ef4444',onClick:()=>{setOpen(false);window.location.href='/admin'}},
              me?.rank==='owner'&&{icon:'fi-sr-settings',label:'Site Settings',color:'#f59e0b'},
              me?.rank==='owner'&&{icon:'fi-sr-cog',     label:'Room Settings', color:'#7c3aed'},
              me?.rank==='owner'&&{icon:'fi-sr-user-crown',label:'Manage Ranks',color:'#d97706'},
            ].filter(Boolean).map((item,i)=>(
              <button key={i} onClick={()=>{item.onClick?.();setOpen(false)}}
                style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'7px 9px',background:'none',border:'none',cursor:'pointer',color:item.color||'#374151',fontSize:'0.82rem',fontWeight:600,borderRadius:7,textAlign:'left'}}
                onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <i className={`fi ${item.icon}`} style={{fontSize:13,width:14,textAlign:'center',flexShrink:0}}/>{item.label}
              </button>
            ))}
            <div style={{borderTop:'1px solid #f3f4f6',margin:'3px 0'}}/>
            <button onClick={onLeave} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'7px 9px',background:'none',border:'none',cursor:'pointer',color:'#374151',fontSize:'0.82rem',fontWeight:600,borderRadius:7,textAlign:'left'}} onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='none'}><i className="fi fi-sr-arrow-left" style={{fontSize:12,width:14,textAlign:'center',flexShrink:0}}/>Leave Room</button>
            <button onClick={()=>{const t=localStorage.getItem('cgz_token');if(t)fetch(`${API}/api/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${t}`}}).catch(()=>{});localStorage.removeItem('cgz_token');nav('/login')}}
              style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'7px 9px',background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:'0.82rem',fontWeight:600,borderRadius:7,textAlign:'left'}} onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'} onMouseLeave={e=>e.currentTarget.style.background='none'}><i className="fi fi-sr-user-logout" style={{fontSize:12,width:14,textAlign:'center',flexShrink:0}}/>Logout</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HEADER BUTTON
// ─────────────────────────────────────────────────────────────
function HBtn({icon,img,title,badge,active,onClick}) {
  return (
    <button onClick={onClick} title={title}
      style={{position:'relative',background:active?'#e8f0fe':'none',border:'none',cursor:'pointer',color:active?'#1a73e8':'#6b7280',width:34,height:34,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,transition:'all .15s',flexShrink:0}}
      onMouseEnter={e=>{e.currentTarget.style.background='#f3f4f6'}}
      onMouseLeave={e=>{e.currentTarget.style.background=active?'#e8f0fe':'none'}}>
      {img
        ? <img src={img} alt={title} style={{width:19,height:19,objectFit:'contain',filter:active?'none':'grayscale(20%)',opacity:active?1:0.75}} onError={e=>e.target.style.display='none'}/>
        : <i className={`fi ${icon}`}/>
      }
      {badge>0&&<span style={{position:'absolute',top:4,right:4,minWidth:7,height:7,background:'#ef4444',borderRadius:'50%',border:'1.5px solid #fff'}}/>}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────
function Footer({showRadio,setShowRadio,showRight,setRight,notif}) {
  return (
    <div style={{background:'#fff',borderTop:'1px solid #e4e6ea',padding:'4px 10px',display:'flex',alignItems:'center',gap:4,flexShrink:0,position:'relative'}}>
      <FBtn icon="fi-sr-radio" active={showRadio} onClick={()=>setShowRadio(s=>!s)} title="Radio"/>
      <div style={{flex:1}}/>
      <FBtn icon="fi-sr-list" active={showRight} onClick={()=>setRight(s=>!s)} title="User List" badge={notif.friends}/>
    </div>
  )
}
function FBtn({icon,active,onClick,title,badge}) {
  return (
    <button onClick={onClick} title={title} style={{position:'relative',background:active?'#e8f0fe':'none',border:'none',cursor:'pointer',color:active?'#1a73e8':'#9ca3af',width:34,height:32,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,transition:'all .15s'}}>
      <i className={`fi ${icon}`}/>
      {badge>0&&<span style={{position:'absolute',top:4,right:4,width:7,height:7,background:'#ef4444',borderRadius:'50%',border:'1.5px solid #fff'}}/>}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN CHATROOM
// ─────────────────────────────────────────────────────────────
export default function ChatRoom() {
  const {roomId}=useParams(), nav=useNavigate(), toast=useToast()
  const token=localStorage.getItem('cgz_token')

  const [me,        setMe]       =useState(null)
  const [room,      setRoom]     =useState(null)
  const [messages,  setMsgs]     =useState([])
  const [users,     setUsers]    =useState([])
  const [input,     setInput]    =useState('')
  const [typers,    setTypers]   =useState([])
  const [showRight, setRight]    =useState(false)  // mobile-first: hidden by default
  const [showLeft,  setLeft]     =useState(false)
  const [showRadio, setRadio]    =useState(false)
  const [showNotif, setShowNotif]=useState(false)
  const [showDM,    setShowDM]   =useState(false)
  const [showFriends,setShowFriends]=useState(false)
  const [showPlus,  setShowPlus] =useState(false)
  const [showGif,   setShowGif]  =useState(false)
  const [showYT,    setShowYT]   =useState(false)
  const [showEmoji, setShowEmoji]=useState(false)
  const [profUser,  setProf]     =useState(null)
  const [miniCard,  setMini]     =useState(null)
  const [giftTarget,setGiftTgt]  =useState(null)
  const [loading,   setLoad]     =useState(true)
  const [roomErr,   setErr]      =useState('')
  const [connected, setConn]     =useState(false)
  const [status,    setStatus]   =useState('online')
  const [notif,     setNotif]    =useState({dm:0,friends:0,notif:0,reports:0})

  const sockRef=useRef(null), bottomRef=useRef(null), inputRef=useRef(null)
  const typingTimer=useRef(null), isTypingRef=useRef(false)

  useEffect(()=>{
    if(!token){nav('/login');return}
    loadRoom()
    return()=>sockRef.current?.disconnect()
  },[roomId])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  async function loadRoom() {
    setLoad(true); setErr('')
    try {
      const [mr,rr]=await Promise.all([
        fetch(`${API}/api/auth/me`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/rooms/${roomId}`,{headers:{Authorization:`Bearer ${token}`}}),
      ])
      if(mr.status===401){localStorage.removeItem('cgz_token');nav('/login');return}
      const md=await mr.json()
      if(md.user){if(md.freshToken)localStorage.setItem('cgz_token',md.freshToken);setMe(md.user)}
      const rd=await rr.json()
      if(!rr.ok){setErr(rd.error||'Room not found');setLoad(false);return}
      setRoom(rd.room)
      fetch(`${API}/api/rooms/${roomId}/messages?limit=50`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.messages)setMsgs(d.messages)}).catch(()=>{})
    } catch{setErr('Connection failed.')}
    setLoad(false)
    connectSocket()
  }

  function connectSocket() {
    sockRef.current?.disconnect()
    const s=io(API,{auth:{token},transports:['websocket','polling']})
    s.on('connect',        ()=>{setConn(true);s.emit('joinRoom',{roomId})})
    s.on('disconnect',     ()=>setConn(false))
    s.on('messageHistory', ms=>setMsgs(ms||[]))
    s.on('newMessage',     m=>{setMsgs(p=>[...p,m]);Sounds.newMessage()})
    s.on('roomUsers',      l=>setUsers(l||[]))
    s.on('userJoined',     u=>{setUsers(p=>p.find(x=>x.userId===u.userId)?p:[...p,u]);setMsgs(p=>[...p,{_id:Date.now(),type:'join',content:`${u.username} joined the room`,createdAt:new Date()}]);Sounds.join()})
    s.on('userLeft',       u=>{setUsers(p=>p.filter(x=>x.userId!==u.userId));setMsgs(p=>[...p,{_id:Date.now()+'l',type:'leave',content:`${u.username} left the room`,createdAt:new Date()}])})
    s.on('systemMessage',  m=>setMsgs(p=>[...p,{_id:Date.now()+'s',type:m.type||'system',content:m.text,createdAt:new Date()}]))
    s.on('messageDeleted', ({messageId})=>setMsgs(p=>p.filter(m=>m._id!==messageId)))
    s.on('typing',         ({username,isTyping:t})=>setTypers(p=>t?[...new Set([...p,username])]:p.filter(n=>n!==username)))
    s.on('youAreKicked',   ({reason})=>{Sounds.mute();toast?.show(reason||'You were kicked','error',5000);setTimeout(()=>nav('/chat'),2000)})
    s.on('accessDenied',   ({msg})=>{toast?.show(msg||'Access denied','error',5000);setTimeout(()=>nav('/chat'),2000)})
    s.on('youAreMuted',    ({minutes})=>{Sounds.mute();toast?.show(`🔇 Muted for ${minutes} minutes`,'warn',6000)})
    s.on('levelUp',        ({level,gold})=>{Sounds.levelUp();toast?.show(`🎉 Level ${level}! +${gold} Gold`,'success',5000)})
    s.on('giftReceived',   ({gift,from})=>{Sounds.gift();toast?.show(`🎁 ${from} sent you ${gift.name}!`,'gift',5000)})
    s.on('diceResult',     ({roll,won,payout})=>toast?.show(`🎲 Rolled ${roll}! ${won?`Won ${payout} Gold 🎉`:'Better luck next time!'}`,'info',4000))
    s.on('spinResult',     ({prize})=>toast?.show(`🎡 Spin: ${prize||0} Gold!`,'success',4000))
    s.on('goldUpdated',    ({gold})=>setMe(p=>p?{...p,gold}:p))
    s.on('error',          e=>console.error('Socket:',e))
    s.on('roomPasswordRequired', ({roomId:rid,roomName})=>{
      const pw=window.prompt(`🔒 "${roomName}" requires a password:`)
      if(pw) s.emit('joinRoom',{roomId:rid,enteredPassword:pw})
      else nav('/chat')
    })
    sockRef.current=s
  }

  function handleTyping(e) {
    setInput(e.target.value)
    if(!isTypingRef.current){isTypingRef.current=true;sockRef.current?.emit('typing',{roomId,isTyping:true})}
    clearTimeout(typingTimer.current)
    typingTimer.current=setTimeout(()=>{isTypingRef.current=false;sockRef.current?.emit('typing',{roomId,isTyping:false})},2000)
  }

  function send(e) {
    e.preventDefault()
    const t=input.trim()
    if(!t||!sockRef.current||!connected) return
    sockRef.current.emit('sendMessage',{roomId,content:t,type:'text'})
    setInput('')
    isTypingRef.current=false; sockRef.current?.emit('typing',{roomId,isTyping:false})
    inputRef.current?.focus()
  }

  function leave(){sockRef.current?.disconnect();nav('/chat')}

  const handleMention=useCallback((username)=>{setInput(p=>username+' '+p);inputRef.current?.focus()},[])
  const handleMiniCard=useCallback((user,pos)=>{setMini({user,pos});setProf(null)},[])
  const myLevel=RANKS[me?.rank]?.level||1
  const isStaff=myLevel>=11
  const closeAll=useCallback(()=>{setMini(null);setShowNotif(false);setShowDM(false);setShowFriends(false);setShowPlus(false);setShowEmoji(false);setShowGif(false);setShowYT(false)},[])

  if(!loading&&roomErr) return (
    <div style={{minHeight:'100dvh',background:'#f8f9fa',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:16}}>
      <div style={{fontSize:40}}>⚠️</div><p style={{color:'#374151',fontWeight:600,textAlign:'center'}}>{roomErr}</p>
      <button onClick={()=>nav('/chat')} style={{padding:'10px 22px',borderRadius:9,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer'}}>← Back to Lobby</button>
    </div>
  )
  if(loading) return (
    <div style={{minHeight:'100dvh',background:'#f8f9fa',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}><div style={{width:32,height:32,border:'3px solid #e4e6ea',borderTop:'3px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 10px'}}/><p style={{color:'#9ca3af',fontSize:'0.9rem'}}>Joining room...</p></div>
    </div>
  )

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'#fff',overflow:'hidden'}} onClick={closeAll}>

      {/* ── HEADER ── */}
      <div style={{height:46,background:'#fff',borderBottom:'1px solid #e4e6ea',display:'flex',alignItems:'center',padding:'0 6px',gap:3,flexShrink:0,boxShadow:'0 1px 3px rgba(0,0,0,.05)'}}>
        {/* Hamburger */}
        <button onClick={e=>{e.stopPropagation();setLeft(s=>!s)}} title="Menu"
          style={{background:showLeft?'#e8f0fe':'none',border:'none',cursor:'pointer',color:showLeft?'#1a73e8':'#6b7280',width:34,height:34,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
          <i className="fi fi-sr-bars-sort"/>
        </button>

        {/* Webcam button */}
        <HBtn img="/default_images/icons/webcam.svg" title="Webcam" active={false} onClick={e=>e.stopPropagation()}/>

        {/* Room name - center */}
        <div style={{flex:1,textAlign:'center',minWidth:0}}>
          <div style={{fontSize:'0.84rem',fontWeight:800,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'Outfit,sans-serif'}}>{room?.name||'Chat Room'}</div>
          <div style={{fontSize:'0.62rem',color:connected?'#22c55e':'#9ca3af'}}>{connected?`● ${users.length} online`:'Connecting...'}</div>
        </div>

        {/* Right icons - using SVGs from public folder */}
        <div style={{position:'relative'}}>
          <HBtn img="/default_images/icons/comment.svg" title="Messages" badge={notif.dm} active={showDM} onClick={e=>{e.stopPropagation();setShowDM(p=>!p);setShowNotif(false)}}/>
          {showDM&&<DMPanel me={me} socket={sockRef.current} onClose={()=>setShowDM(false)} onCount={n=>setNotif(p=>({...p,dm:n}))}/>}
        </div>

        <div style={{position:'relative'}}>
          <HBtn icon="fi-sr-user-add" title="Friend Requests" badge={notif.friends} active={showFriends} onClick={e=>{e.stopPropagation();setShowFriends(p=>!p);setShowDM(false);setShowNotif(false)}}/>
          {showFriends&&<FriendReqPanel onClose={()=>setShowFriends(false)} onCount={n=>setNotif(p=>({...p,friends:n}))}/>}
        </div>

        <div style={{position:'relative'}}>
          <HBtn img="/default_images/icons/congratulation.svg" title="Notifications" badge={notif.notif} active={showNotif} onClick={e=>{e.stopPropagation();setShowNotif(p=>!p);setShowDM(false)}}/>
          {showNotif&&<NotifPanel onClose={()=>setShowNotif(false)} onCount={n=>setNotif(p=>({...p,notif:n}))}/>}
        </div>

        {isStaff&&<HBtn img="/default_images/icons/warning.svg" title="Reports" badge={notif.reports}/>}

        <AvatarDropdown me={me} status={status} setStatus={setStatus} onLeave={leave} socket={sockRef.current}/>
      </div>

      {/* ── BODY ── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {showLeft&&<LeftSidebar room={room} nav={nav} socket={sockRef.current} roomId={roomId} onClose={()=>setLeft(false)}/>}

        {/* MESSAGES */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
          {room?.topic&&<div style={{background:'#f8f9fa',borderBottom:'1px solid #e4e6ea',padding:'4px 12px',fontSize:'0.76rem',color:'#374151',flexShrink:0}}><i className="fi fi-sr-info" style={{marginRight:5,color:'#1a73e8'}}/>{room.topic}</div>}

          <div style={{flex:1,overflowY:'auto',padding:'6px 0'}}>
            {messages.map((m,i)=>(
              <Msg key={m._id||i} msg={m} myId={me?._id} myLevel={myLevel}
                onMiniCard={handleMiniCard} onMention={handleMention}
                socket={sockRef.current} roomId={roomId}/>
            ))}
            {typers.filter(t=>t!==me?.username).length>0&&(
              <div style={{padding:'2px 12px 4px',display:'flex',alignItems:'center',gap:7}}>
                <div style={{display:'flex',gap:3}}>
                  {[0,1,2].map(i=><span key={i} style={{width:4,height:4,background:'#9ca3af',borderRadius:'50%',display:'inline-block',animation:`typingDot .8s ease-in-out ${i*0.2}s infinite`}}/>)}
                </div>
                <span style={{fontSize:'0.7rem',color:'#9ca3af',fontStyle:'italic'}}>{typers.filter(t=>t!==me?.username).join(', ')} typing...</span>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* ── INPUT BAR ── */}
          <div style={{borderTop:'1px solid #e4e6ea',padding:'5px 8px',background:'#fff',flexShrink:0,position:'relative'}}>
            {/* + popup */}
            {showPlus&&(
              <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:'calc(100% + 5px)',left:6,background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,padding:8,display:'flex',gap:7,boxShadow:'0 4px 20px rgba(0,0,0,.14)',zIndex:50}}>
                {[
                  {icon:'/default_images/icons/upload.svg', fallback:'fi-sr-picture', label:'Image',  action:()=>{document.getElementById('cgz-img-input').click();setShowPlus(false)}},
                  {icon:'/default_images/icons/giphy.svg',  fallback:'fi-sr-gif',     label:'GIF',    action:()=>{setShowGif(p=>!p);setShowPlus(false)}},
                  {icon:'/default_images/icons/youtube.svg',fallback:'fi-br-youtube', label:'YouTube',action:()=>{setShowYT(p=>!p);setShowPlus(false)}},
                  {icon:null, emoji:'🎲', label:'Dice', action:()=>{sockRef.current?.emit('rollDice',{roomId,bet:10});setShowPlus(false)}},
                ].map((b,i)=>(
                  <button key={i} onClick={b.action} title={b.label}
                    style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'8px 9px',background:'#f9fafb',border:'1px solid #e4e6ea',borderRadius:9,cursor:'pointer',minWidth:46}}>
                    {b.emoji
                      ? <span style={{fontSize:20}}>{b.emoji}</span>
                      : <img src={b.icon} alt={b.label} style={{width:22,height:22,objectFit:'contain'}} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='block'}}/> }
                    {b.icon&&<i className={b.fallback} style={{display:'none',fontSize:18,color:'#6b7280'}}/>}
                    <span style={{fontSize:'0.6rem',fontWeight:700,color:'#374151'}}>{b.label}</span>
                  </button>
                ))}
              </div>
            )}
            {/* GIF picker */}
            {showGif&&<GifPicker onSelect={url=>{sockRef.current?.emit('sendMessage',{roomId,content:url,type:'gif'});setShowGif(false)}} onClose={()=>setShowGif(false)}/>}
            {/* YouTube panel */}
            {showYT&&<YTPanel onClose={()=>setShowYT(false)} onSend={url=>{sockRef.current?.emit('sendMessage',{roomId,content:url,type:'youtube'});setShowYT(false)}}/>}
            {/* Emoticon picker */}
            {showEmoji&&<EmoticonPicker onSelect={em=>{setInput(p=>p+em);setShowEmoji(false);inputRef.current?.focus()}} onClose={()=>setShowEmoji(false)}/>}

            <input id="cgz-img-input" type="file" accept="image/*" style={{display:'none'}}
              onChange={e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=ev=>{sockRef.current?.emit('sendMessage',{roomId,content:ev.target.result,type:'image'})};rd.readAsDataURL(f);e.target.value=''}}/>

            <form onSubmit={send} style={{display:'flex',alignItems:'center',gap:4}}>
              {/* + button — plain, no color */}
              <button type="button" onClick={e=>{e.stopPropagation();setShowPlus(p=>!p);setShowEmoji(false);setShowGif(false);setShowYT(false)}}
                style={{width:32,height:32,borderRadius:'50%',border:'1.5px solid #e4e6ea',background:showPlus?'#f3f4f6':'#fff',color:'#6b7280',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0,fontWeight:700,lineHeight:1,transition:'all .15s'}}>
                +
              </button>
              {/* Emoticon button — normal, not colorful */}
              <button type="button" onClick={e=>{e.stopPropagation();setShowEmoji(p=>!p);setShowPlus(false)}}
                style={{background:'none',border:'none',cursor:'pointer',color:'#6b7280',fontSize:20,padding:'0 1px',flexShrink:0,display:'flex',alignItems:'center',lineHeight:1,opacity:showEmoji?1:0.7}}>
                <img src="/icons/emoticon/happy.png" alt="" style={{width:22,height:22,objectFit:'contain'}} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='block'}}/>
                <i className="fi fi-rr-smile" style={{display:'none'}}/>
              </button>
              {/* Input */}
              <input ref={inputRef} value={input} onChange={handleTyping}
                placeholder={connected?'Type a message...':'Connecting...'}
                disabled={!connected}
                style={{flex:1,padding:'8px 12px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:22,color:'#111827',fontSize:'0.88rem',outline:'none',transition:'border-color .15s',fontFamily:'Nunito,sans-serif',minWidth:0}}
                onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
              {/* Mic — use UI SVG icon */}
              <button type="button" title="Voice"
                style={{width:32,height:32,borderRadius:'50%',border:'none',background:'#f3f4f6',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,padding:0}}>
                <img src="/default_images/icons/voice.svg" alt="" style={{width:17,height:17,objectFit:'contain'}} onError={e=>{e.target.outerHTML='<i class="fi fi-sr-microphone" style="font-size:15px;color:#6b7280"></i>'}}/>
              </button>
              {/* Send */}
              <button type="submit" disabled={!input.trim()||!connected}
                style={{width:34,height:34,borderRadius:'50%',border:'none',background:input.trim()&&connected?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6',color:input.trim()&&connected?'#fff':'#9ca3af',cursor:input.trim()&&connected?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0,boxShadow:input.trim()&&connected?'0 2px 8px rgba(26,115,232,.35)':'none',transition:'all .15s'}}>
                <i className="fi fi-sr-paper-plane-top"/>
              </button>
            </form>
          </div>
        </div>

        {showRight&&<RightSidebar users={users} myLevel={myLevel} onUserClick={u=>{setProf(u);setMini(null)}} onClose={()=>setRight(false)}/>}
      </div>

      {/* ── FOOTER ── */}
      <div style={{position:'relative'}}>
        {showRadio&&<RadioPanel onClose={()=>setRadio(false)}/>}
        <Footer showRadio={showRadio} setShowRadio={setRadio} showRight={showRight} setRight={setRight} notif={notif}/>
      </div>

      {/* OVERLAYS */}
      {miniCard&&<MiniCard user={miniCard.user} myLevel={myLevel} pos={miniCard.pos} onClose={()=>setMini(null)} onFull={()=>{setProf(miniCard.user);setMini(null)}} onGift={u=>setGiftTgt(u)} socket={sockRef.current} roomId={roomId}/>}
      {profUser&&<ProfileModal user={profUser} myLevel={myLevel} socket={sockRef.current} roomId={roomId} onClose={()=>setProf(null)} onGift={u=>setGiftTgt(u)}/>}
      {giftTarget&&<GiftPanel targetUser={giftTarget} myGold={me?.gold||0} onClose={()=>setGiftTgt(null)} onSent={()=>{setGiftTgt(null);toast?.show('Gift sent! 🎁','gift',3000)}} socket={sockRef.current} roomId={roomId}/>}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes typingDot{0%,80%,100%{transform:scale(.8);opacity:.5}40%{transform:scale(1.1);opacity:1}}
        @keyframes diceShake{0%,100%{transform:translate(-50%,-50%) rotate(0deg)}25%{transform:translate(-48%,-52%) rotate(-8deg)}75%{transform:translate(-52%,-48%) rotate(8deg)}}
        @keyframes diceBounce{0%{transform:translate(-50%,-50%) scale(1.2)}50%{transform:translate(-50%,-55%) scale(0.95)}100%{transform:translate(-50%,-50%) scale(1)}}
        @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .del-btn{display:none!important}
        div:hover > div > .del-btn{display:inline-flex!important}
        *{-webkit-tap-highlight-color:transparent}
        input,textarea,select{font-size:16px!important}
      `}</style>
    </div>
  )
}
