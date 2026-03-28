import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StyleModal, { getNameStyle, getBubbleStyle, FONTS, THEMES } from '../../components/StyleModal.jsx'
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

// ── Shared nameColor resolver: maps stored key (bcolor1, bgrad1…) → CSS hex ──
const NAME_HEX = ['#ff3333','#ff6633','#ff9933','#ffcc33','#cccc00','#99cc00','#59b300','#829356','#008000','#00e639','#00e673','#00e6ac','#00cccc','#03add8','#3366ff','#107896','#004d99','#6633ff','#9933ff','#cc33ff','#ff33ff','#ff33cc','#ff3399','#ff3366','#604439','#795548','#a97f70','#bc9b8f','#9E9E9E','#879fab','#698796','#495f69']
function resolveNameColor(nc, fallback='') {
  if(!nc) return fallback
  if(nc.startsWith('bcolor')) return NAME_HEX[parseInt(nc.replace('bcolor',''))-1] || fallback
  if(nc.startsWith('bgrad') || nc.startsWith('bneon')) return fallback // gradient/neon handled via getNameStyle
  if(nc.startsWith('#') || nc.startsWith('rgb')) return nc // raw hex/rgb stored directly
  return fallback
}

// ── ICON helper - use SVG from public folder with fi fallback ──
function UIIcon({name, size=18, fallback, style={}}) {
  const [err,setErr]=useState(false)
  if(!err) return <img src={`/default_images/icons/${name}.svg`} alt="" style={{width:size,height:size,objectFit:'contain',flexShrink:0,...style}} onError={()=>setErr(true)}/>
  return <i className={`fi ${fallback||'fi-sr-info'}`} style={{fontSize:size-2,...style}}/>
}

function RIcon({rank,size='md'}) {
  const ri = R(rank)
  // Accept numeric px size or named size strings
  const isNum = typeof size === 'number'
  const px = isNum ? size : (size==='xs'?12:size==='sm'?14:size==='lg'?20:size==='xl'?26:16)
  return (
    <img
      src={`/icons/ranks/${ri.icon}`}
      alt={ri.label||rank}
      title={ri.label||rank}
      style={{
        width:px, height:px,
        objectFit:'contain',
        flexShrink:0,
        background:'transparent',
        display:'inline-block',
        verticalAlign:'middle',
      }}
      onError={e=>e.target.style.display='none'}
    />
  )
}

// ── System message config ──
// accent = left-border color  |  icon = flaticon class suffix
const SYS_CFG = {
  join:    { accent:'#22c55e', icon:'fi-sr-enter' },
  leave:   { accent:'#9ca3af', icon:'fi-sr-exit' },
  kick:    { accent:'#f59e0b', icon:'fi-sr-boot-heeled' },
  ban:     { accent:'#ef4444', icon:'fi-sr-ban' },
  mute:    { accent:'#f59e0b', icon:'fi-sr-volume-mute' },
  mod:     { accent:'#6366f1', icon:'fi-sr-shield-check' },
  dice:    { accent:'#7c3aed', icon:'fi-sr-dice' },
  gift:    { accent:'#ec4899', icon:'fi-sr-gift' },
  system:  { accent:'#1a73e8', icon:'fi-sr-info' },
  warning: { accent:'#f59e0b', icon:'fi-sr-triangle-warning' },
  error:   { accent:'#ef4444', icon:'fi-sr-circle-xmark' },
  success: { accent:'#22c55e', icon:'fi-sr-check-circle' },
}

// Virtual "System" bot sender shown in system messages
const SYSTEM_SENDER = {
  username: 'System',
  rank:     'bot',
  avatar:   '/default_images/avatar/default_system.png',
  _id:      'system',
}


// ─────────────────────────────────────────────────────────────
// PAINTING CANVAS (Screenshot 11 style)
// ─────────────────────────────────────────────────────────────
function PaintingCanvas({onSend,onClose}) {
  const canvasRef=useRef(null)
  const [drawing,setDrawing]=useState(false)
  const [tool,setTool]=useState('pen')   // pen | eraser
  const [color,setColor]=useState('#000000')
  const [size,setSize]=useState(3)
  const [history,setHistory]=useState([])
  const [histIdx,setHistIdx]=useState(-1)
  const lastPt=useRef(null)

  function getCtx(){return canvasRef.current?.getContext('2d')}

  function saveHistory(){
    const ctx=getCtx(); if(!ctx||!canvasRef.current) return
    const snap=ctx.getImageData(0,0,canvasRef.current.width,canvasRef.current.height)
    setHistory(p=>{const n=[...p.slice(0,histIdx+1),snap];setHistIdx(n.length-1);return n})
  }

  function undo(){
    if(histIdx<=0){clearCanvas();return}
    const ctx=getCtx(); if(!ctx) return
    ctx.putImageData(history[histIdx-1],0,0)
    setHistIdx(p=>p-1)
  }
  function redo(){
    if(histIdx>=history.length-1) return
    const ctx=getCtx(); if(!ctx) return
    ctx.putImageData(history[histIdx+1],0,0)
    setHistIdx(p=>p+1)
  }
  function clearCanvas(){
    const ctx=getCtx(); if(!ctx||!canvasRef.current) return
    ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height)
    ctx.fillStyle='#fff'
    ctx.fillRect(0,0,canvasRef.current.width,canvasRef.current.height)
    setHistory([]); setHistIdx(-1)
  }

  useEffect(()=>{clearCanvas()},[])

  function getPt(e){
    const r=canvasRef.current.getBoundingClientRect()
    const touch=e.touches?.[0]||e
    return{x:(touch.clientX-r.left)*(canvasRef.current.width/r.width),y:(touch.clientY-r.top)*(canvasRef.current.height/r.height)}
  }

  function startDraw(e){
    e.preventDefault()
    setDrawing(true)
    const pt=getPt(e)
    lastPt.current=pt
    const ctx=getCtx(); if(!ctx) return
    ctx.beginPath(); ctx.arc(pt.x,pt.y,size/2,0,Math.PI*2)
    ctx.fillStyle=tool==='eraser'?'#fff':color
    ctx.fill()
  }
  function draw(e){
    e.preventDefault()
    if(!drawing) return
    const ctx=getCtx(); if(!ctx) return
    const pt=getPt(e)
    ctx.beginPath()
    ctx.moveTo(lastPt.current.x,lastPt.current.y)
    ctx.lineTo(pt.x,pt.y)
    ctx.strokeStyle=tool==='eraser'?'#fff':color
    ctx.lineWidth=size*(tool==='eraser'?4:1)
    ctx.lineCap='round'
    ctx.lineJoin='round'
    ctx.stroke()
    lastPt.current=pt
  }
  function endDraw(e){
    e.preventDefault()
    if(drawing) saveHistory()
    setDrawing(false)
  }

  function sendDrawing(){
    const c=canvasRef.current; if(!c) return
    const dataUrl=c.toDataURL('image/png')
    onSend(dataUrl)
  }

  const COLORS=['#000000','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#ffffff']
  const TOOLS=[
    {id:'pick',  icon:'✛',  title:'Add color',  onClick:()=>{}},
    {id:'pen',   icon:'✏️', title:'Pen',         onClick:()=>setTool('pen')},
    {id:'black', icon:'⬛', title:'Black',        onClick:()=>{setColor('#000');setTool('pen')}},
    {id:'undo',  icon:'↩️', title:'Undo',         onClick:undo},
    {id:'redo',  icon:'↪️', title:'Redo',         onClick:redo},
    {id:'erase', icon:'🧹', title:'Eraser',       onClick:()=>setTool('eraser')},
    {id:'trash', icon:'🗑️', title:'Clear',        onClick:clearCanvas},
  ]

  return(
    <div onClick={e=>e.stopPropagation()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1005,padding:8}}>
      <div style={{background:'#1a1a2e',borderRadius:12,width:'min(520px,97vw)',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.5)'}}>
        {/* Title bar */}
        <div style={{background:'#111827',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px'}}>
          <span style={{color:'#e2e8f0',fontWeight:700,fontSize:'0.85rem'}}>Draw & Send</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#9ca3af',cursor:'pointer',fontSize:18}}>✕</button>
        </div>
        {/* Toolbar */}
        <div style={{display:'flex',gap:4,padding:'7px 10px',background:'#f8f9fa',borderBottom:'1px solid #e4e6ea',alignItems:'center',flexWrap:'wrap'}}>
          {/* Color picker */}
          <label title="Pick color" style={{width:30,height:30,borderRadius:6,border:'2px solid #e4e6ea',overflow:'hidden',cursor:'pointer',flexShrink:0}}>
            <input type="color" value={color} onChange={e=>{setColor(e.target.value);setTool('pen')}} style={{width:'150%',height:'150%',border:'none',cursor:'pointer',transform:'translate(-15%,-15%)'}}/>
          </label>
          {/* Pen */}
          <button onClick={()=>setTool('pen')} title="Pen" style={{width:30,height:30,borderRadius:6,border:`2px solid ${tool==='pen'?'#1a73e8':'#e4e6ea'}`,background:tool==='pen'?'#e8f0fe':'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>✏️</button>
          {/* Black */}
          <button onClick={()=>{setColor('#000');setTool('pen')}} title="Black" style={{width:30,height:30,borderRadius:6,border:'2px solid #e4e6ea',background:'#000',cursor:'pointer',flexShrink:0}}/>
          {/* Undo */}
          <button onClick={undo} title="Undo" style={{width:30,height:30,borderRadius:6,border:'2px solid #e4e6ea',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>↩</button>
          {/* Redo */}
          <button onClick={redo} title="Redo" style={{width:30,height:30,borderRadius:6,border:'2px solid #e4e6ea',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>↪</button>
          {/* Eraser */}
          <button onClick={()=>setTool('eraser')} title="Eraser" style={{width:30,height:30,borderRadius:6,border:`2px solid ${tool==='eraser'?'#1a73e8':'#e4e6ea'}`,background:tool==='eraser'?'#e8f0fe':'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>🧹</button>
          {/* Trash */}
          <button onClick={clearCanvas} title="Clear all" style={{width:30,height:30,borderRadius:6,border:'2px solid #ef4444',background:'#fef2f2',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>🗑️</button>
          {/* Size */}
          <div style={{display:'flex',alignItems:'center',gap:4,marginLeft:'auto'}}>
            <span style={{fontSize:'0.7rem',color:'#6b7280'}}>Size</span>
            <input type="range" min={1} max={20} value={size} onChange={e=>setSize(+e.target.value)} style={{width:60,accentColor:'#1a73e8'}}/>
          </div>
        </div>
        {/* Canvas */}
        <div style={{background:'#fff',margin:0}}>
          <canvas ref={canvasRef} width={520} height={340}
            style={{display:'block',width:'100%',height:'auto',cursor:tool==='eraser'?'cell':'crosshair',touchAction:'none'}}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
        </div>
        {/* Send button */}
        <div style={{background:'#1a1a2e',padding:'10px 12px',display:'flex',alignItems:'center',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:'9px',borderRadius:8,border:'1px solid #374151',background:'none',color:'#9ca3af',cursor:'pointer',fontSize:'0.84rem',fontWeight:600}}>Cancel</button>
          <button onClick={sendDrawing} style={{flex:2,padding:'9px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',color:'#fff',cursor:'pointer',fontSize:'0.84rem',fontWeight:700,fontFamily:'Outfit,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <i className="fi fi-sr-paper-plane"/>Send
          </button>
        </div>
      </div>
    </div>
  )
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
    const m=(url||'').match(/(?:youtu\.be\/|v=|embed\/|\?v=)([\w-]{11})/)
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
            onMouseEnter={e=>e.currentTarget.style.background='#374151'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
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
  const id=(url||'').match(/(?:v=|youtu\.be\/|embed\/|\?v=)([\w-]{11})/)?.[1]
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

  // Listen for backend spin result
  useEffect(()=>{
    if(!socket) return
    const onSpin=({prize,index,newGold})=>{
      // Map backend index to visual segment
      const target=5*360+(n-(index%n))*sa+sa/2
      setRotation(prev=>prev+target)
      setTimeout(()=>{
        setSpinning(false)
        setNotification({text:prize>0?`🎡 You won ${prize} Gold! 🎉`:'🎡 Better luck next time!',win:prize>0})
        setTimeout(()=>setNotification(null),3500)
      },3200)
    }
    const onErr=({msg})=>{setSpinning(false);setNotification({text:`❌ ${msg}`,win:false});setTimeout(()=>setNotification(null),4000)}
    socket.on('spinResult',onSpin); socket.on('error',onErr)
    return()=>{ socket.off('spinResult',onSpin); socket.off('error',onErr) }
  },[socket])

  function spin() {
    if(spinning) return
    setSpinning(true); setNotification(null)
    socket?.emit('spinWheel',{})
    // Visual rotation (actual result comes from backend)
    const randIdx=Math.floor(Math.random()*n)
    const target=5*360+(n-randIdx)*sa+sa/2
    setRotation(prev=>prev+target)
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
          <div style={{background:'#f9fafb',borderRadius:8,padding:'6px 10px',marginBottom:10,fontSize:'0.75rem',color:'#6b7280',textAlign:'center'}}>
            🎡 Free spin once every 24 hours! Prizes: 5 to 500 Gold
          </div>
          <button onClick={spin} disabled={spinning}
            style={{width:'100%',padding:'10px',borderRadius:10,border:'none',background:spinning?'#f3f4f6':'linear-gradient(135deg,#f59e0b,#d97706)',color:spinning?'#9ca3af':'#fff',fontWeight:800,cursor:spinning?'not-allowed':'pointer',fontSize:'0.88rem',fontFamily:'Outfit,sans-serif'}}>
            {spinning?'Spinning...':'🎡 Spin (Free Daily!)'}
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
  const cardW=224, cardH=340
  const x=Math.min(Math.max(pos.x,4),window.innerWidth-cardW-4)
  const y=Math.min(Math.max(pos.y,4),window.innerHeight-cardH-4)
  const hasBg=!!(user.coverImage||user.profileBackground||user.cardBackground)
  const bannerBg = user.coverImage||user.profileBackground||user.cardBackground
  return (
    <div style={{position:'fixed',zIndex:9999,top:y,left:x,background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,width:cardW,boxShadow:'0 8px 28px rgba(0,0,0,.18)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      {/* Banner */}
      <div style={{height:52,position:'relative',background:hasBg?`url(${bannerBg}) center/cover no-repeat`:`linear-gradient(135deg,${ri.color}55,${ri.color}22,#e8f0fe)`,flexShrink:0}}>
        {hasBg&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.18)'}}/>}
        <button onClick={onClose} style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,.35)',border:'none',width:20,height:20,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,zIndex:1}}>✕</button>
      </div>
      {/* Avatar — below banner, clear of text */}
      <div style={{padding:'0 10px',marginTop:-22,marginBottom:4,position:'relative',zIndex:2,display:'flex',alignItems:'flex-end'}}>
        <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt=""
          style={{width:44,height:44,borderRadius:'50%',border:`2.5px solid ${bdr}`,objectFit:'cover',background:'#fff',flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,.15)'}}
          onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
      </div>
      {/* Username + rank — fully below avatar row */}
      <div style={{padding:'0 10px 6px',minWidth:0}}>
        <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.875rem',color:resolveNameColor(user.nameColor, ri.color),overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:1.25}}>{user.username}</div>
        <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}><RIcon rank={user.rank} size={12}/><span style={{fontSize:'0.65rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
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
// ─────────────────────────────────────────────────────────────
// SELF PROFILE OVERLAY — editable, opens as overlay not a page
// ─────────────────────────────────────────────────────────────
function SelfProfileOverlay({user,onClose,onUpdated}) {
  const [mood,setMood]=useState(user?.mood||'')
  const [about,setAbout]=useState(user?.about||'')
  const [saving,setSaving]=useState(false)
  const [ok,setOk]=useState('')
  const ri=R(user?.rank), bdr=GBR(user?.gender,user?.rank)

  async function save(field,value) {
    setSaving(true); setOk('')
    const token=localStorage.getItem('cgz_token')
    try {
      const r=await fetch(`${API}/api/users/me`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({[field]:value})})
      const d=await r.json()
      if(r.ok){setOk('Saved!');onUpdated?.(d.user);setTimeout(()=>setOk(''),2000)}
    } catch(e){}
    setSaving(false)
  }

  async function uploadAvatar(file) {
    setSaving(true)
    const token=localStorage.getItem('cgz_token')
    const fd=new FormData(); fd.append('avatar',file)
    try {
      const r=await fetch(`${API}/api/upload/avatar`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd})
      const d=await r.json()
      if(r.ok&&d.url){onUpdated?.({...user,avatar:d.url});setOk('Avatar updated!');setTimeout(()=>setOk(''),2500)}
    } catch(e){}
    setSaving(false)
  }

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1200,background:'rgba(0,0,0,.55)',backdropFilter:'blur(5px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:18,maxWidth:360,width:'100%',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.25)',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
        {/* Banner */}
        <div style={{height:80,background:`linear-gradient(135deg,${ri.color}66,#e8f0fe)`,position:'relative',flexShrink:0}}>
          <button onClick={onClose} style={{position:'absolute',top:10,right:10,background:'rgba(255,255,255,.85)',border:'none',width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>
            <i className="fi fi-sr-cross-small"/>
          </button>
        </div>
        {/* Avatar + name */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginTop:-40,padding:'0 18px',flexShrink:0}}>
          <label style={{cursor:'pointer',position:'relative'}}>
            <img src={user?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:80,height:80,borderRadius:'50%',border:`3px solid ${bdr}`,objectFit:'cover',background:'#fff'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
            <div style={{position:'absolute',bottom:2,right:2,width:22,height:22,borderRadius:'50%',background:'#1a73e8',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff'}}>
              <i className="fi fi-sr-camera" style={{fontSize:9,color:'#fff'}}/>
            </div>
            <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f)uploadAvatar(f);e.target.value=''}}/>
          </label>
          <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1rem',color:user?.nameColor||'#111827',marginTop:8}}>{user?.username}</div>
          <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:4}}><RIcon rank={user?.rank} size={12}/><span style={{fontSize:'0.72rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
        </div>
        {/* Editable fields */}
        <div style={{flex:1,overflowY:'auto',padding:'10px 18px 18px'}}>
          {ok&&<div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'6px 12px',fontSize:'0.78rem',color:'#15803d',marginBottom:10,textAlign:'center'}}>{ok}</div>}
          {/* Stats */}
          <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:14}}>
            {[{l:'Level',v:user?.level||1,c:'#1a73e8'},{l:'Gold',v:user?.gold||0,c:'#d97706'},{l:'Messages',v:user?.totalMessages||0,c:'#7c3aed'}].map(s=>(
              <div key={s.l} style={{textAlign:'center',background:'#f9fafb',borderRadius:8,padding:'5px 10px',flex:1}}>
                <div style={{fontSize:'0.58rem',color:'#9ca3af'}}>{s.l}</div>
                <div style={{fontSize:'0.88rem',fontWeight:800,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>
          {/* Mood */}
          <label style={{display:'block',fontSize:'0.72rem',fontWeight:700,color:'#6b7280',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Mood / Status</label>
          <div style={{display:'flex',gap:6,marginBottom:12}}>
            <input value={mood} onChange={e=>setMood(e.target.value)} maxLength={80} placeholder="What's on your mind?"
              style={{flex:1,padding:'8px 12px',border:'1.5px solid #e4e6ea',borderRadius:9,fontSize:'0.85rem',outline:'none',fontFamily:'Nunito,sans-serif',color:'#111827'}}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
            <button onClick={()=>save('mood',mood)} disabled={saving}
              style={{padding:'8px 12px',borderRadius:9,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.78rem',flexShrink:0}}>Save</button>
          </div>
          {/* About */}
          <label style={{display:'block',fontSize:'0.72rem',fontWeight:700,color:'#6b7280',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>About Me</label>
          <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:4}}>
            <textarea value={about} onChange={e=>setAbout(e.target.value)} maxLength={300} rows={3} placeholder="Tell others about yourself..."
              style={{padding:'8px 12px',border:'1.5px solid #e4e6ea',borderRadius:9,fontSize:'0.85rem',outline:'none',fontFamily:'Nunito,sans-serif',resize:'vertical',color:'#111827',lineHeight:1.5}}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
            <button onClick={()=>save('about',about)} disabled={saving}
              style={{padding:'8px',borderRadius:9,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.82rem'}}>Save About</button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
function Msg({msg,onMiniCard,onMention,onHide,myId,myLevel,socket,roomId}) {
  const isSystem = msg.type==='system'||msg.type==='join'||msg.type==='leave'||msg.type==='kick'||msg.type==='mute'||msg.type==='ban'||msg.type==='mod'||msg.type==='dice'
  if (isSystem) {
    const cfg = SYS_CFG[msg.type] || SYS_CFG.system
    const ts2 = new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
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
            <span style={{fontSize:'0.6rem',color:'#bbb'}}>{ts2}</span>
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
      {/* Timestamp column — far left, fixed width, always visible */}
      <div style={{width:44,flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',gap:1,paddingTop:3}}>
        <span style={{fontSize:'0.55rem',color:'#bbb',lineHeight:1,whiteSpace:'nowrap'}}>{dateLabel}</span>
        <span style={{fontSize:'0.6rem',color:'#9ca3af',lineHeight:1,whiteSpace:'nowrap'}}>{timeLabel}</span>
      </div>
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
function UserItem({u,onClick,onWhisper}) {
  const ri=R(u.rank)
  const col = resolveNameColor(u.nameColor, ri.color)
  const [hov,setHov]=useState(false)
  return (
    <div onClick={e=>{const r=e.currentTarget.getBoundingClientRect();onClick(u,{x:r.left-224,y:r.top})}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'flex',alignItems:'center',gap:7,padding:'6px 10px',cursor:'pointer',transition:'background .12s',position:'relative',background:hov?'rgba(255,255,255,.08)':'transparent'}}>
      <div style={{position:'relative',flexShrink:0}}>
        <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${GBR(u.gender,u.rank)}`,display:'block'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        <span style={{position:'absolute',bottom:0,right:0,width:6,height:6,background:'#22c55e',borderRadius:'50%',border:'1.5px solid #fff'}}/>
      </div>
      <span style={{flex:1,fontSize:'0.8rem',fontWeight:700,color:col,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username}</span>
      {/* Rank icon — fixed size, consistent for all ranks */}
      <RIcon rank={u.rank} size={16}/>
      {u.countryCode&&u.countryCode!=='ZZ'&&<img src={`/icons/flags/${u.countryCode.toUpperCase()}.png`} alt="" style={{width:15,height:10,flexShrink:0,borderRadius:1}} onError={e=>e.target.style.display='none'}/>}
      {/* Whisper button — only on hover, uses its own row so it doesn't push icons */}
      {hov&&onWhisper&&(
        <button onClick={e=>{e.stopPropagation();onWhisper(u)}} title="Whisper"
          style={{position:'absolute',inset:0,left:'auto',right:0,width:32,height:'100%',background:'linear-gradient(90deg,transparent,rgba(99,102,241,.15) 40%)',border:'none',borderLeft:'1px solid #6366f133',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',color:'#6366f1'}}>
          👁️
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RIGHT SIDEBAR
// ─────────────────────────────────────────────────────────────
function RightSidebar({users,myLevel,onUserClick,onWhisper,onClose,tObj}) {
  const [tab,setTab]=useState('users')
  const [search,setSearch]=useState('')
  const [rankF,setRankF]=useState('all')
  const th=tObj||{bg_header:'#fff',bg_log:'#f3f4f6',text:'#111827',accent:'#1a73e8',default_color:'#e4e6ea'}

  const [friends,setFriends]=useState([])
  const sorted=[...users].sort((a,b)=>{const d=RL(b.rank)-RL(a.rank);return d!==0?d:(a.username||'').localeCompare(b.username||'')})
  const staff=sorted.filter(u=>RL(u.rank)>=11)
  const base=tab==='staff'?staff:tab==='friends'?friends:sorted
  useEffect(()=>{
    if(tab!=='friends') return
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/users/me/friends`,{headers:{Authorization:`Bearer ${t}`}})
      .then(r=>r.json()).then(d=>setFriends(d.friends||[])).catch(()=>{})
  },[tab])

  const filtered= tab==='friends' ? friends :
    base.filter(u=>{
      if(tab==='search') return (!search||u.username.toLowerCase().includes(search.toLowerCase()))&&(rankF==='all'||u.rank===rankF)
      return true
    })

  const TABS=[
    {id:'users',   icon:'fi-sr-users',        title:'Users'},
    {id:'friends', icon:'fi-sr-user',          title:'Friends'},
    {id:'staff',   icon:'fi-sr-shield-check',  title:'Staff'},
    {id:'search',  icon:'fi-sr-search',        title:'Search'},
  ]

  return (
    <div style={{width:200,borderLeft:`1px solid ${th.default_color}44`,background:th.bg_header,display:'flex',flexDirection:'column',flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',borderBottom:`1px solid ${th.default_color}44`,flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} title={t.title}
            style={{flex:1,padding:'9px 2px',border:'none',background:'none',cursor:'pointer',borderBottom:`2px solid ${tab===t.id?th.accent:'transparent'}`,color:tab===t.id?th.accent:th.text+'88',fontSize:14,transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className={`fi ${t.icon}`}/>
          </button>
        ))}
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:th.text+'88',padding:'4px 7px',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      {tab==='search'&&(
        <div style={{padding:'6px 8px',borderBottom:`1px solid ${th.default_color}33`,flexShrink:0}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Username..."
            style={{width:'100%',padding:'5px 9px',background:th.bg_log||'rgba(255,255,255,.1)',border:`1.5px solid ${th.default_color}44`,borderRadius:7,fontSize:'0.78rem',outline:'none',boxSizing:'border-box',color:th.text,marginBottom:5,fontFamily:'Nunito,sans-serif'}}
            onFocus={e=>e.target.style.borderColor=th.accent} onBlur={e=>e.target.style.borderColor=`${th.default_color}44`}/>
          <select value={rankF} onChange={e=>setRankF(e.target.value)} style={{width:'100%',padding:'4px',background:th.bg_log||'rgba(255,255,255,.1)',border:`1px solid ${th.default_color}44`,borderRadius:6,fontSize:'0.73rem',outline:'none',color:th.text}}>
            <option value="all">All Ranks</option>
            {Object.entries(RANKS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      )}
      <div style={{padding:'4px 10px 2px',fontSize:'0.62rem',fontWeight:700,color:th.text+'66',letterSpacing:'1px',textTransform:'uppercase',flexShrink:0}}>
        {tab==='staff'?'Staff':tab==='friends'?'Friends':tab==='search'?'Results':'Online'} · {filtered.length}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {filtered.length===0
          ? <p style={{textAlign:'center',color:th.text+'66',fontSize:'0.76rem',padding:'14px 10px'}}>{tab==='staff'?'No staff online':tab==='friends'?'No friends online':tab==='search'?'No results':'No users'}</p>
          : filtered.map((u,i)=><UserItem key={u.userId||u._id||i} u={u} onClick={onUserClick} onWhisper={onWhisper}/>)
        }
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LEFT SIDEBAR — icon strip + label (like adultchat)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// STYLE PANEL — Inline version inside left sidebar
// ─────────────────────────────────────────────────────────────
const API_S = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

const SOLID_COLORS = [
  '#ff3333','#ff6633','#ff9933','#ffcc33','#cccc00','#99cc00','#59b300','#829356',
  '#008000','#00e639','#00e673','#00e6ac','#00cccc','#03add8','#3366ff','#107896',
  '#004d99','#6633ff','#9933ff','#cc33ff','#ff33ff','#ff33cc','#ff3399','#ff3366',
  '#604439','#795548','#a97f70','#bc9b8f','#9E9E9E','#879fab','#698796','#495f69',
]
const BUB_GRADS = [
  'linear-gradient(90deg,#667eea,#764ba2)','linear-gradient(90deg,#f093fb,#f5576c)',
  'linear-gradient(90deg,#4facfe,#00f2fe)','linear-gradient(90deg,#43e97b,#38f9d7)',
  'linear-gradient(90deg,#fa709a,#fee140)','linear-gradient(90deg,#ff9a56,#ff6b9d)',
  'linear-gradient(90deg,#c471f5,#fa71cd)','linear-gradient(90deg,#12c2e9,#c471ed)',
  'linear-gradient(90deg,#f64f59,#c471ed)','linear-gradient(90deg,#24fe41,#fdbb2d)',
  'linear-gradient(45deg,#ff0844,#ffb199)','linear-gradient(45deg,#00d2ff,#3a7bd5)',
  'linear-gradient(45deg,#f953c6,#b91d73)','linear-gradient(45deg,#36d1dc,#5b86e5)',
  'linear-gradient(45deg,#ff9068,#fd746c)','linear-gradient(45deg,#667eea,#764ba2)',
]
const CHAT_THEMES = [
  {id:'Dark',        name:'Dark',        bg:'#151515', header:'#111', accent:'#03add8'},
  {id:'Arc',         name:'Arc',         bg:'#181a21', header:'linear-gradient(to top,#21252f,#2b3140)', accent:'#5774b7'},
  {id:'Purple',      name:'Purple',      bg:'#29165f', header:'#150442', accent:'#9773fb'},
  {id:'Blue',        name:'Blue',        bg:'#013259', header:'#001e37', accent:'#1e9aff'},
  {id:'Whatsapp',    name:'Whatsapp',    bg:'#0b141a', header:'linear-gradient(#202c33,#0b141a)', accent:'#00a884'},
  {id:'Nord',        name:'Nord',        bg:'#2e3440', header:'linear-gradient(#272833,#30343e)', accent:'#6e89c4'},
  {id:'Obsidian',    name:'Obsidian',    bg:'#0b0d18', header:'linear-gradient(#0d101e,#121425)', accent:'#4a63cf'},
  {id:'Remix',       name:'Remix',       bg:'#0F1221', header:'#011448', accent:'#3b6cff'},
  {id:'Lite',        name:'Lite',        bg:'#fff',    header:'#222', accent:'#03add8'},
  {id:'Dolphin',     name:'Dolphin',     bg:'#fff',    header:'#edf1f4', accent:'#ff5c00'},
  {id:'Halloween',   name:'Halloween',   bg:'#000',    header:'linear-gradient(#000,#672e00)', accent:'#ff7607'},
  {id:'Forest',      name:'Forest',      bg:'#1a1a1a', header:'rgba(17,17,17,.7)', accent:'#eeb266'},
]
const FONT_LIST = [
  {id:'font1',name:'Kalam',f:"'Kalam',cursive"},
  {id:'font2',name:'Signika',f:"'Signika',sans-serif"},
  {id:'font3',name:'Orbitron',f:"'Orbitron',sans-serif"},
  {id:'font4',name:'Comic Neue',f:"'Comic Neue',cursive"},
  {id:'font5',name:'Quicksand',f:"'Quicksand',sans-serif"},
  {id:'font6',name:'Pacifico',f:"'Pacifico',cursive"},
  {id:'font7',name:'Dancing Script',f:"'Dancing Script',cursive"},
  {id:'font8',name:'Lobster Two',f:"'Lobster Two',cursive"},
  {id:'font9',name:'Caveat',f:"'Caveat',cursive"},
  {id:'font10',name:'Rajdhani',f:"'Rajdhani',sans-serif"},
  {id:'font11',name:'Audiowide',f:"'Audiowide',sans-serif"},
  {id:'font12',name:'Nunito',f:"'Nunito',sans-serif"},
]

function StylePanelInline({type,onSaved}) {
  const [tab,setTab]=useState('solid')
  const [sel,setSel]=useState('')
  const [selFont,setSelFont]=useState('')
  const [fontStyle,setFontStyle]=useState('normal')
  const [msgColor,setMsgColor]=useState('#ffffff')
  const [selTheme,setSelTheme]=useState('Dolphin')
  const [saving,setSaving]=useState(false)
  const [ok,setOk]=useState('')

  const SW={width:28,height:28,borderRadius:5,cursor:'pointer',border:'2px solid transparent',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,margin:2,transition:'transform .1s'}

  async function save() {
    setSaving(true); setOk('')
    const token=localStorage.getItem('cgz_token')
    let body={}
    if(type==='nameColor') body={nameColor:sel||'',nameFont:selFont}
    else if(type==='bubbleColor') body={bubbleColor:sel,bubbleStyle:fontStyle,msgFontColor:msgColor,msgFontStyle:selFont}
    else if(type==='theme') body={chatTheme:selTheme}
    try{
      const r=await fetch(`${API_S}/api/users/me/style`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)})
      const d=await r.json()
      if(r.ok){setOk('Saved!');onSaved&&onSaved(d.user)}
    }catch{}
    setSaving(false)
  }

  return (
    <div style={{flex:1,overflowY:'auto',padding:'10px 8px'}}>
      {ok&&<div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:6,padding:'6px 10px',fontSize:11,color:'#15803d',marginBottom:8,textAlign:'center'}}>✅ {ok}</div>}

      {type==='nameColor'&&(
        <>
          {/* Preview */}
          <div style={{textAlign:'center',marginBottom:10,padding:'8px',background:'#f9fafb',borderRadius:6}}>
            <span style={{fontSize:14,fontWeight:800,fontFamily:FONT_LIST.find(f=>f.id===selFont)?.f||'inherit',
              ...(tab==='solid'&&sel?{color:SOLID_COLORS[parseInt(sel.replace('bcolor',''))-1]}:
                 tab==='gradient'&&sel?{background:BUB_GRADS[parseInt(sel.replace('bgrad',''))-1],WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}:
                 {})}}>
              Preview Name
            </span>
          </div>
          <div style={{display:'flex',gap:4,marginBottom:8}}>
            {['solid','gradient'].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'4px',borderRadius:4,border:`1px solid ${tab===t?'#1a73e8':'#e4e6ea'}`,background:tab===t?'#eff6ff':'none',color:tab===t?'#1a73e8':'#9ca3af',fontSize:10,fontWeight:700,cursor:'pointer',textTransform:'capitalize'}}>{t}</button>
            ))}
          </div>
          {tab==='solid'&&(
            <div style={{display:'flex',flexWrap:'wrap',marginBottom:10}}>
              <div onClick={()=>setSel('')} style={{...SW,background:'#f3f4f6',border:`2px solid ${sel===''?'#1a73e8':'#e4e6ea'}`}}>
                {sel===''&&<span style={{fontSize:10}}>✓</span>}
              </div>
              {SOLID_COLORS.map((c,i)=>(
                <div key={i} onClick={()=>setSel(`bcolor${i+1}`)} style={{...SW,background:c,border:`2px solid ${sel===`bcolor${i+1}`?'#fff':'transparent'}`,transform:sel===`bcolor${i+1}`?'scale(1.2)':'scale(1)'}}>
                  {sel===`bcolor${i+1}`&&<span style={{color:'#fff',fontSize:9}}>✓</span>}
                </div>
              ))}
            </div>
          )}
          {tab==='gradient'&&(
            <div style={{display:'flex',flexWrap:'wrap',marginBottom:10}}>
              {BUB_GRADS.map((g,i)=>(
                <div key={i} onClick={()=>setSel(`bgrad${i+1}`)} style={{...SW,background:g,border:`2px solid ${sel===`bgrad${i+1}`?'#fff':'transparent'}`,transform:sel===`bgrad${i+1}`?'scale(1.2)':'scale(1)'}}>
                  {sel===`bgrad${i+1}`&&<span style={{color:'#fff',fontSize:9}}>✓</span>}
                </div>
              ))}
            </div>
          )}
          <div style={{fontSize:10,fontWeight:700,color:'#6b7280',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Name Font</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginBottom:10}}>
            <div onClick={()=>setSelFont('')} style={{padding:'5px 6px',borderRadius:5,border:`1px solid ${selFont===''?'#1a73e8':'#e4e6ea'}`,background:selFont===''?'#eff6ff':'#f9fafb',cursor:'pointer',fontSize:11,textAlign:'center',color:selFont===''?'#1a73e8':'#374151'}}>Default</div>
            {FONT_LIST.slice(0,5).map(f=>(
              <div key={f.id} onClick={()=>setSelFont(f.id)} style={{padding:'5px 6px',borderRadius:5,border:`1px solid ${selFont===f.id?'#1a73e8':'#e4e6ea'}`,background:selFont===f.id?'#eff6ff':'#f9fafb',cursor:'pointer',fontSize:11,textAlign:'center',fontFamily:f.f,color:selFont===f.id?'#1a73e8':'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
            ))}
          </div>
        </>
      )}

      {type==='bubbleColor'&&(
        <>
          {/* Preview bubble */}
          <div style={{marginBottom:10,padding:'8px',background:'#f9fafb',borderRadius:6}}>
            <div style={{display:'inline-block',padding:'6px 10px',borderRadius:'3px 10px 10px 10px',fontSize:12,
              fontWeight:fontStyle.includes('bold')?700:400,
              fontStyle:fontStyle.includes('italic')?'italic':'normal',
              fontFamily:FONT_LIST.find(f=>f.id===selFont)?.f||'inherit',
              color:msgColor||'#fff',
              ...(tab==='solid'&&sel?{background:SOLID_COLORS[parseInt(sel.replace('bubcolor',''))-1]}:
                 (tab==='gradient'||tab==='neon')&&sel?{background:BUB_GRADS[parseInt(sel.replace(/bubgrad|bubneon/,''))-1]}:
                 {background:'#f3f4f6',color:'#111'})}}>
              Hey! Preview 👋
            </div>
          </div>
          <div style={{display:'flex',gap:4,marginBottom:8}}>
            {['solid','gradient','neon'].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'4px',borderRadius:4,border:`1px solid ${tab===t?'#1a73e8':'#e4e6ea'}`,background:tab===t?'#eff6ff':'none',color:tab===t?'#1a73e8':'#9ca3af',fontSize:10,fontWeight:700,cursor:'pointer',textTransform:'capitalize'}}>{t}</button>
            ))}
          </div>
          <div style={{display:'flex',flexWrap:'wrap',marginBottom:10}}>
            <div onClick={()=>setSel('')} style={{...SW,background:'#f3f4f6',border:`2px solid ${sel===''?'#1a73e8':'#e4e6ea'}`}}>
              {sel===''&&<span style={{fontSize:9}}>def</span>}
            </div>
            {SOLID_COLORS.map((c,i)=>(
              <div key={i} onClick={()=>setSel(`bubcolor${i+1}`)} style={{...SW,background:c,border:`2px solid ${sel===`bubcolor${i+1}`?'#fff':'transparent'}`,transform:sel===`bubcolor${i+1}`?'scale(1.2)':'scale(1)'}}>
                {sel===`bubcolor${i+1}`&&<span style={{color:'#fff',fontSize:9}}>✓</span>}
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#6b7280',marginBottom:4,textTransform:'uppercase'}}>Text Color</div>
              <input type="color" value={msgColor} onChange={e=>setMsgColor(e.target.value)} style={{width:'100%',height:32,borderRadius:5,border:'1px solid #e4e6ea',cursor:'pointer'}}/>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#6b7280',marginBottom:4,textTransform:'uppercase'}}>Style</div>
              <select value={fontStyle} onChange={e=>setFontStyle(e.target.value)} style={{width:'100%',padding:'5px 6px',border:'1px solid #e4e6ea',borderRadius:5,fontSize:11,background:'#f9fafb',outline:'none',cursor:'pointer'}}>
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="italic">Italic</option>
                <option value="bold italic">Bold Italic</option>
              </select>
            </div>
          </div>
          <div style={{fontSize:10,fontWeight:700,color:'#6b7280',marginBottom:5,textTransform:'uppercase'}}>Font</div>
          <select value={selFont} onChange={e=>setSelFont(e.target.value)} style={{width:'100%',padding:'6px 8px',border:'1px solid #e4e6ea',borderRadius:5,fontSize:12,background:'#f9fafb',outline:'none',cursor:'pointer',marginBottom:10}}>
            <option value="">Default Font</option>
            {FONT_LIST.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </>
      )}

      {type==='theme'&&(
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
            {CHAT_THEMES.map(t=>(
              <div key={t.id} onClick={()=>setSelTheme(t.id)} style={{borderRadius:7,overflow:'hidden',border:`2px solid ${selTheme===t.id?'#1a73e8':'#e4e6ea'}`,cursor:'pointer',transform:selTheme===t.id?'scale(1.03)':'scale(1)',transition:'all .15s'}}>
                <div style={{background:t.header,padding:'4px 8px',display:'flex',alignItems:'center',gap:4}}>
                  {selTheme===t.id&&<span style={{fontSize:8,color:t.accent}}>✓</span>}
                  <span style={{fontSize:9,fontWeight:700,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</span>
                </div>
                <div style={{background:t.bg,padding:'4px 8px',height:24}}>
                  <div style={{background:t.accent+'44',borderRadius:3,padding:'2px 6px',display:'inline-block'}}>
                    <span style={{fontSize:8,color:t.accent}}>Hello 👋</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={save} disabled={saving} style={{width:'100%',padding:'9px',borderRadius:7,border:'none',background:saving?'#9ca3af':'#1a73e8',color:'#fff',fontWeight:800,fontSize:12,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit'}}>
        {saving?'Saving…':'💾 Apply Style'}
      </button>
    </div>
  )
}

function LeftSidebar({room,nav,socket,roomId,onClose,me,onStyleSaved}) {
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
    {id:'premium',     icon:'fi-sr-diamond', img:'/icons/ranks/premium.svg', label:'Premium', color:'#aa44ff'},
    {id:'namecolor',   icon:'fi-sr-brush',           label:'Name Style',   color:'#ec4899'},
    {id:'bubblesyle',  icon:'fi-sr-comment-alt',     label:'Bubble Style', color:'#8b5cf6'},
    {id:'theme',       icon:'fi-sr-palette',         label:'Theme',        color:'#14b8a6'},
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
          {panel==='games'      &&<GamesPanel socket={socket} roomId={roomId} myGold={me?.gold||0}/>}
          {panel==='leaderboard'&&<LeaderboardPanel/>}
          {panel==='username'   &&<UsernamePanel/>}
          {panel==='news'       &&<SimplePanel icon="📰" msg="No announcements yet."/>}
          {panel==='wall'       &&<SimplePanel icon="📝" msg="Wall posts coming soon!"/>}
          {panel==='forum'      &&<SimplePanel icon="💬" msg="Forum coming soon!"/>}
          {panel==='contact'    &&<ContactPanel/>}
          {panel==='premium'    &&<PremiumPanel/>}
          {(panel==='namecolor'||panel==='bubblesyle'||panel==='theme')&&<StylePanelInline type={panel==='namecolor'?'nameColor':panel==='bubblesyle'?'bubbleColor':'theme'} onSaved={onStyleSaved}/>}
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
        <div key={r._id} onClick={()=>nav(`/chat/${r._id}`)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',cursor:'pointer',borderBottom:'1px solid #f3f4f6',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <img src={r.icon||'/default_images/rooms/default_room.png'} alt="" style={{width:42,height:42,borderRadius:9,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'0.85rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{r.name}</div>
            <div style={{fontSize:'0.7rem',color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{r.description||''}</div>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <img src={`/default_images/rooms/${r.type||'public'}_room.svg`} alt="" style={{width:13,height:13}} onError={e=>e.target.style.display='none'}/>
              <img src="/default_images/rooms/user_count.svg" alt="" style={{width:12,height:12}} onError={e=>e.target.style.display='none'}/>
              <span style={{fontSize:'0.7rem',fontWeight:600,color:(r.currentUsers||0)>0?'#22c55e':'#9ca3af'}}>{r.currentUsers||0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// GAMES PANEL — with SpinWheel
// ─────────────────────────────────────────────────────────────
// ── KENO GAME ──
// ── DICE ANIMATION COMPONENT ──
function DiceRoll({value, onDone}) {
  const [face,setFace]=useState(1), [rolling,setRolling]=useState(true)
  useEffect(()=>{
    let count=0, max=14
    const t=setInterval(()=>{
      setFace(Math.floor(Math.random()*6)+1)
      count++
      if(count>=max){clearInterval(t);setFace(value);setRolling(false);setTimeout(onDone,1800)}
    },120)
    return()=>clearInterval(t)
  },[value])
  const DOTS=[[],[4],[4,6],[4,5,6],[1,4,6,9],[1,4,5,6,9],[1,4,6,7,9,3]]
  const dots=DOTS[face]||[]
  return(
    <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9999,pointerEvents:'none',textAlign:'center'}}>
      <div style={{width:80,height:80,background:'linear-gradient(145deg,#fff,#f0f0f0)',borderRadius:16,border:'2px solid #e4e6ea',boxShadow:'0 8px 32px rgba(0,0,0,.25), inset 0 1px 2px rgba(255,255,255,.8)',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gridTemplateRows:'1fr 1fr 1fr',padding:10,gap:4,animation:rolling?'diceShake .12s infinite':'diceBounce .4s ease-out'}}>
        {[1,2,3,4,5,6,7,8,9].map(p=>(<div key={p} style={{display:'flex',alignItems:'center',justifyContent:'center'}}>{dots.includes(p)&&<div style={{width:12,height:12,background:'#1a1a2e',borderRadius:'50%',boxShadow:'0 1px 2px rgba(0,0,0,.3)'}}/>}</div>))}
      </div>
      {!rolling&&<div style={{marginTop:10,fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1.1rem',color:face===6?'#22c55e':'#374151',textShadow:'0 1px 3px rgba(0,0,0,.2)'}}>{face===6?'🎉 WIN!':'😅 '+face}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WHISPER — Ghost message visible only to sender & target
// ─────────────────────────────────────────────────────────────
function WhisperBox({target,roomId,socket,onClose}) {
  const [text,setText]=useState('')
  const [sent,setSent]=useState(false)
  function send(e){
    e.preventDefault()
    if(!text.trim()||!socket) return
    socket.emit('sendEcho',{toUserId:target.userId||target._id,content:text.trim(),roomId})
    setSent(true)
    setTimeout(()=>{setSent(false);setText('');onClose()},2000)
  }
  return(
    <div style={{position:'fixed',inset:0,zIndex:1010,background:'rgba(0,0,0,.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0 0 90px'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#1e1b4b',border:'1px solid #4338ca',borderRadius:14,padding:'14px',width:'min(420px,95vw)',boxShadow:'0 8px 32px rgba(79,70,229,.4)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <span style={{fontSize:'1.1rem'}}>👁️</span>
          <div style={{flex:1}}>
            <div style={{fontSize:'0.82rem',fontWeight:800,color:'#e0e7ff'}}>Whisper to <span style={{color:'#a78bfa'}}>{target.username}</span></div>
            <div style={{fontSize:'0.68rem',color:'#6366f1'}}>Only they can see this · staff cannot read</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#6366f1',cursor:'pointer',fontSize:16}}>✕</button>
        </div>
        {sent?(<div style={{textAlign:'center',padding:'10px',color:'#a78bfa',fontWeight:700,fontSize:'0.9rem'}}>👁️ Whisper sent!</div>):(
          <form onSubmit={send} style={{display:'flex',gap:8}}>
            <input autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder={`Whisper to ${target.username}...`} maxLength={500}
              style={{flex:1,padding:'9px 12px',background:'#312e81',border:'1.5px solid #4338ca',borderRadius:9,color:'#e0e7ff',fontSize:'0.875rem',outline:'none',fontFamily:'Nunito,sans-serif'}}
              onFocus={e=>e.target.style.borderColor='#818cf8'} onBlur={e=>e.target.style.borderColor='#4338ca'}/>
            <button type="submit" disabled={!text.trim()} style={{padding:'9px 14px',borderRadius:9,border:'none',background:text.trim()?'linear-gradient(135deg,#6366f1,#4338ca)':'#374151',color:'#fff',fontWeight:700,cursor:text.trim()?'pointer':'not-allowed'}}>
              👁️
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function KenoGame({socket,roomId,myGold,onClose}) {
  const [sel,setSel]=useState([])
  const [bet,setBet]=useState(10)
  const [result,setResult]=useState(null)
  const [waiting,setWait]=useState(false)
  const [drawn,setDrawn]=useState([])
  const [animIdx,setAnimIdx]=useState(-1)
  const NUMS=Array.from({length:80},(_,i)=>i+1)

  // Bet steps: 2,4,5,10,20,50,100,200,500,1000 - double after 10
  const BET_STEPS=[2,4,5,10,20,50,100,200,500,1000]
  function incBet(){const i=BET_STEPS.findIndex(v=>v>bet);setBet(i>=0?BET_STEPS[i]:BET_STEPS[BET_STEPS.length-1])}
  function decBet(){const i=BET_STEPS.findLastIndex(v=>v<bet);setBet(i>=0?BET_STEPS[i]:BET_STEPS[0])}

  function toggleNum(n) {
    if(waiting||drawn.length>0) return
    setSel(p=>p.includes(n)?p.filter(x=>x!==n):p.length<10?[...p,n]:p)
    setResult(null)
  }

  function clearPicks() {
    if(waiting) return
    setSel([]); setResult(null); setDrawn([]); setAnimIdx(-1)
  }

  useEffect(()=>{
    if(!socket) return
    const onResult=({picks,drawn:d,matches,total,multiplier,bet:b,payout,won,newGold})=>{
      // Animate drawn numbers one by one
      setDrawn(d)
      let i=0
      const interval=setInterval(()=>{
        setAnimIdx(d[i])
        i++
        if(i>=d.length){
          clearInterval(interval)
          setResult({matches,total,multiplier,payout,won,newGold})
          setWait(false)
        }
      },120)
    }
    const onError=({msg})=>{ setWait(false); alert(msg) }
    socket.on('kenoResult',onResult)
    socket.on('kenoError',onError)
    return()=>{ socket.off('kenoResult',onResult); socket.off('kenoError',onError) }
  },[socket])

  function play() {
    if(sel.length<2||waiting) return
    setWait(true); setResult(null); setDrawn([]); setAnimIdx(-1)
    socket?.emit('playKeno',{roomId,picks:sel,bet})
  }

  return(
    <div onClick={e=>e.stopPropagation()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1005,padding:8}}>
      <div style={{background:'#1a1a2e',borderRadius:14,padding:'14px',maxWidth:360,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,.5)',color:'#fff'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1rem'}}>Keno</span>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:18}}>✕</button>
        </div>
        {/* Gold balance */}
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
          <span style={{fontSize:'1.1rem'}}>🪙</span>
          <span style={{fontWeight:800,fontSize:'1rem',color:'#fbbf24'}}>{myGold||0}</span>
          <button style={{marginLeft:'auto',width:24,height:24,borderRadius:'50%',background:'#374151',border:'none',color:'#9ca3af',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>?</button>
        </div>
        {/* Number grid - 10 cols x 8 rows = 80 numbers */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:3,marginBottom:10}}>
          {NUMS.map(n=>{
            const isSel=sel.includes(n)
            const isDrawn=drawn.includes(n)
            const isMatch=isSel&&isDrawn
            const isAnimating=animIdx===n
            let bg='#374151',color='#d1d5db',border='transparent'
            if(isMatch){bg='#22c55e';color='#fff';border='#22c55e'}
            else if(isDrawn&&!isSel){bg='#1e3a5f';color='#60a5fa';border='#3b82f6'}
            else if(isSel){bg='#3b82f6';color='#fff';border='#3b82f6'}
            if(isAnimating&&!isSel){bg='#1d4ed8';color='#fff'}
            return(
              <button key={n} onClick={()=>toggleNum(n)}
                style={{height:26,borderRadius:5,border:`1.5px solid ${border}`,background:bg,cursor:'pointer',fontSize:'0.68rem',fontWeight:700,color,transition:'all .08s',transform:isAnimating?'scale(1.15)':'scale(1)'}}>
                {n}
              </button>
            )
          })}
        </div>
        {/* Bottom: trash + bet - value + draw */}
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={clearPicks} style={{width:36,height:36,borderRadius:8,background:'#ef4444',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>
            🗑️
          </button>
          <div style={{display:'flex',alignItems:'center',gap:6,flex:1,justifyContent:'center'}}>
            <button onClick={decBet} style={{width:28,height:28,borderRadius:6,background:'#374151',border:'none',color:'#fff',cursor:'pointer',fontWeight:700,fontSize:16}}>−</button>
            <div style={{textAlign:'center',minWidth:60}}>
              <div style={{fontSize:'0.65rem',color:'#9ca3af'}}>Bet</div>
              <div style={{fontWeight:800,fontSize:'0.95rem',color:'#fbbf24'}}>{bet}</div>
            </div>
            <button onClick={incBet} style={{width:28,height:28,borderRadius:6,background:'#374151',border:'none',color:'#fff',cursor:'pointer',fontWeight:700,fontSize:16}}>+</button>
          </div>
          <div style={{textAlign:'center',minWidth:60}}>
            <div style={{fontSize:'0.65rem',color:'#9ca3af'}}>Payout</div>
            <div style={{fontWeight:800,fontSize:'0.95rem',color:'#22c55e'}}>{result?result.payout:0}</div>
          </div>
          <button onClick={play} disabled={sel.length<2||waiting}
            style={{padding:'8px 16px',borderRadius:8,border:'none',background:sel.length<2||waiting?'#374151':'#22c55e',color:'#fff',fontWeight:800,cursor:sel.length<2||waiting?'not-allowed':'pointer',fontSize:'0.88rem',fontFamily:'Outfit,sans-serif',flexShrink:0}}>
            {waiting?'...':'Draw'}
          </button>
        </div>
        {result&&(
          <div style={{marginTop:10,padding:'8px 12px',borderRadius:8,background:result.won?'rgba(34,197,94,.2)':'rgba(239,68,68,.15)',border:`1px solid ${result.won?'#22c55e':'#ef4444'}`,textAlign:'center',fontSize:'0.82rem',fontWeight:700,color:result.won?'#22c55e':'#ef4444'}}>
            {result.won?`🎉 ${result.matches}/${result.total} hits · ×${result.multiplier} · +${result.payout}`:`😅 ${result.matches}/${result.total} hits · -${bet}`}
          </div>
        )}
        {/* Pays table */}
        <div style={{marginTop:10,fontSize:'0.65rem',color:'#6b7280',textAlign:'center'}}>Pays table · Select 2-10 numbers · {sel.length} selected</div>
      </div>
    </div>
  )
}

function GamesPanel({socket,roomId,myGold=0}) {
  const [showSpin,setShowSpin]=useState(false)
  const [showKeno,setShowKeno]=useState(false)
  const [showDice,setShowDice]=useState(false)
  const [diceVal,setDiceVal]=useState(null)
  const DICE_BET=100

  // Listen for server result to drive animation
  useEffect(()=>{
    if(!socket) return
    function onDiceResult({roll}){setDiceVal(roll);setShowDice(true)}
    socket.on('diceResult',onDiceResult)
    return()=>socket.off('diceResult',onDiceResult)
  },[socket])

  function rollDice() {
    if(myGold<DICE_BET){alert(`Need ${DICE_BET} gold to play dice! You have ${myGold}.`);return}
    socket?.emit('rollDice',{roomId})
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
      {showKeno&&<KenoGame socket={socket} roomId={roomId} myGold={myGold||0} onClose={()=>setShowKeno(false)}/>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LEADERBOARD — with proper icons from public folder
// ─────────────────────────────────────────────────────────────
function LeaderboardPanel() {
  const [data,setData]=useState([]), [type,setType]=useState('xp'), [period,setPeriod]=useState('all'), [load,setLoad]=useState(false)
  useEffect(()=>{
    setLoad(true)
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/leaderboard/${type}?period=${period}`,{headers:{Authorization:`Bearer ${t}`}})
      .then(r=>r.json()).then(d=>setData(d.users||[])).catch(()=>{}).finally(()=>setLoad(false))
  },[type,period])

  const TABS=[
    {id:'xp',       label:'Top XP',    icon:'xp.svg',    color:'#7c3aed'},
    {id:'level',    label:'Top Level', icon:'level.svg', color:'#1a73e8'},
    {id:'gold',     label:'Top Gold',  icon:'gold.svg',  color:'#d97706'},
    {id:'gifts',    label:'Top Gifts', icon:'gift.svg',  color:'#ec4899'},
    {id:'messages', label:'Top Msgs',  icon:'comment.svg',color:'#059669'},
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
      {/* Period tabs */}
      <div style={{display:'flex',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        {['all','weekly','monthly'].map(p=>(
          <button key={p} onClick={()=>setPeriod(p)}
            style={{flex:1,padding:'7px 4px',border:'none',background:'none',cursor:'pointer',borderBottom:`2px solid ${period===p?'#1a73e8':'transparent'}`,color:period===p?'#1a73e8':'#9ca3af',fontSize:'0.72rem',fontWeight:700,transition:'all .15s',textTransform:'capitalize'}}>
            {p==='all'?'All Time':p==='weekly'?'Weekly':'Monthly'}
          </button>
        ))}
      </div>
      {/* Type tabs with icons */}
      <div style={{display:'flex',gap:3,padding:'6px 6px 2px',overflowX:'auto',flexShrink:0}}>
        {TABS.map(tp=>(
          <button key={tp.id} onClick={()=>setType(tp.id)}
            style={{display:'flex',alignItems:'center',gap:4,padding:'5px 8px',borderRadius:20,border:`1.5px solid ${type===tp.id?tp.color:'#e4e6ea'}`,background:type===tp.id?`${tp.color}18`:'none',cursor:'pointer',flexShrink:0,transition:'all .15s'}}>
            <img src={`/default_images/icons/${tp.icon}`} alt="" style={{width:14,height:14,objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
            <span style={{fontSize:'0.68rem',fontWeight:700,color:type===tp.id?tp.color:'#6b7280',whiteSpace:'nowrap'}}>{tp.label}</span>
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
    fetch(`${API}/api/radio/stations`).then(r=>r.json()).then(d=>setAll(d.stations||[])).catch(()=>{})
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
// ─────────────────────────────────────────────────────────────
// CHAT SETTINGS OVERLAY — inline inside chatroom
// ─────────────────────────────────────────────────────────────
function ChatSettingsOverlay({me, onClose, onSaved}) {
  const [tab, setTab] = useState('theme')  // 'theme' | 'nameColor' | 'bubble'
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState('')

  // Theme state — default Light
  const [selTheme, setSelTheme] = useState(me?.chatTheme || 'Dolphin')

  // Name color state
  const [nameTab, setNameTab] = useState('solid')
  const [nameSel, setNameSel] = useState(me?.nameColor || '')
  const [nameFont, setNameFont] = useState(me?.nameFont || '')

  // Bubble state
  const [bubTab, setBubTab] = useState('solid')
  const [bubSel, setBubSel] = useState(me?.bubbleColor || '')
  const [bubFont, setBubFont] = useState(me?.msgFontStyle || '')
  const [bubStyle, setBubStyle] = useState(me?.bubbleStyle || 'normal')
  const [msgColor, setMsgColor] = useState(me?.msgFontColor || '#ffffff')

  const SW = {width:26,height:26,borderRadius:5,cursor:'pointer',border:'2px solid transparent',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,margin:2,transition:'transform .1s'}

  async function save() {
    setSaving(true); setOk('')
    const token = localStorage.getItem('cgz_token')
    let body = {}
    if(tab === 'theme')     body = {chatTheme: selTheme}
    if(tab === 'nameColor') body = {nameColor: nameSel, nameFont}
    if(tab === 'bubble')    body = {bubbleColor: bubSel, bubbleStyle: bubStyle, msgFontColor: msgColor, msgFontStyle: bubFont}
    try {
      const r = await fetch(`${API}/api/users/me/style`, {method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(body)})
      const d = await r.json()
      if(r.ok) { setOk('Saved!'); onSaved?.(d.user) }
    } catch(e) {}
    setSaving(false)
    setTimeout(() => setOk(''), 2000)
  }

  const TABS = [
    {id:'theme',     icon:'fi-sr-palette',      label:'Theme'},
    {id:'nameColor', icon:'fi-sr-brush',         label:'Name Color'},
    {id:'bubble',    icon:'fi-sr-comment-alt',   label:'Bubble Style'},
  ]

  return (
    <div onClick={e=>e.stopPropagation()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',backdropFilter:'blur(3px)',zIndex:1200,display:'flex',alignItems:'center',justifyContent:'center',padding:'12px'}}>
      <div style={{background:'#fff',borderRadius:16,width:'min(480px,100%)',maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,.35)',overflow:'hidden'}}>
        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#1a1f2e,#2d3555)',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="fi fi-sr-settings" style={{fontSize:16,color:'#fff'}}/>
            </div>
            <div>
              <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.95rem',color:'#fff'}}>Chat Settings</div>
              <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,.5)'}}>Customize your appearance</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.1)',border:'none',borderRadius:8,width:30,height:30,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14}}>
            <i className="fi fi-sr-cross-small"/>
          </button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'2px solid #f3f4f6',background:'#fafafa',flexShrink:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setOk('')}}
              style={{flex:1,padding:'10px 6px',border:'none',background:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,borderBottom:`2px solid ${tab===t.id?'#1a73e8':'transparent'}`,marginBottom:-2,color:tab===t.id?'#1a73e8':'#6b7280',transition:'all .15s'}}>
              <i className={`fi ${t.icon}`} style={{fontSize:15}}/>
              <span style={{fontSize:'0.65rem',fontWeight:700}}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'14px'}}>
          {ok && <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'7px 12px',fontSize:'0.78rem',color:'#15803d',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><i className="fi fi-sr-check-circle" style={{fontSize:14}}/> {ok}</div>}

          {/* ── THEME TAB ── */}
          {tab==='theme' && (
            <>
              <div style={{fontSize:'0.7rem',fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:.5,marginBottom:10}}>Select Theme</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:12}}>
                {THEMES.map(t=>(
                  <div key={t.id} onClick={()=>setSelTheme(t.id)} style={{borderRadius:9,overflow:'hidden',border:`2px solid ${selTheme===t.id?'#1a73e8':'#e4e6ea'}`,cursor:'pointer',transform:selTheme===t.id?'scale(1.03)':'scale(1)',transition:'all .15s',boxShadow:selTheme===t.id?'0 0 0 3px rgba(26,115,232,.15)':'none'}}>
                    {/* Header bar */}
                    <div style={{background:t.bg_header,padding:'5px 8px',display:'flex',alignItems:'center',gap:4,minHeight:26}}>
                      {selTheme===t.id&&<i className="fi fi-sr-check-circle" style={{fontSize:8,color:t.accent||'#fff',flexShrink:0}}/>}
                      <span style={{fontSize:'0.65rem',fontWeight:800,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textShadow:'0 1px 3px rgba(0,0,0,.6)',flex:1}}>{t.name}</span>
                    </div>
                    {/* Chat preview area with bg image support */}
                    <div style={{
                      background:t.bg_image?`url(${t.bg_image})`:t.bg_chat,
                      backgroundSize:'cover',backgroundPosition:'center',
                      padding:'5px 8px',height:40,display:'flex',alignItems:'center',position:'relative',
                    }}>
                      {t.bg_image&&<div style={{position:'absolute',inset:0,background:t.bg_chat&&t.bg_chat!=='transparent'?t.bg_chat+'99':'rgba(0,0,0,.35)'}}/>}
                      <div style={{background:t.bg_log,borderRadius:4,padding:'2px 7px',display:'inline-block',position:'relative',zIndex:1,maxWidth:'90%'}}>
                        <span style={{fontSize:'0.6rem',color:t.text,fontWeight:600,whiteSpace:'nowrap'}}>Hello 👋</span>
                      </div>
                      {/* Accent dot */}
                      <div style={{position:'absolute',right:6,bottom:5,width:14,height:14,borderRadius:'50%',background:t.accent,zIndex:1,boxShadow:`0 0 0 2px ${t.bg_chat||'#000'}44`}}/>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── NAME COLOR TAB ── */}
          {tab==='nameColor' && (
            <>
              <div style={{textAlign:'center',marginBottom:12,padding:'10px',background:'#f9fafb',borderRadius:8,border:'1px solid #f3f4f6'}}>
                <span style={{fontSize:15,fontWeight:800,fontFamily:FONT_LIST.find(f=>f.id===nameFont)?.f||'Outfit,sans-serif',
                  ...(nameTab==='solid'&&nameSel?{color:SOLID_COLORS[parseInt(nameSel.replace('bcolor',''))-1]}:
                     nameTab==='gradient'&&nameSel?{background:BUB_GRADS[parseInt(nameSel.replace('bgrad',''))-1],WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}:
                     {color:'#111827'})}}>
                  {me?.username||'Preview Name'}
                </span>
              </div>
              <div style={{display:'flex',gap:4,marginBottom:10}}>
                {['solid','gradient'].map(t=>(
                  <button key={t} onClick={()=>setNameTab(t)} style={{flex:1,padding:'5px',borderRadius:5,border:`1px solid ${nameTab===t?'#1a73e8':'#e4e6ea'}`,background:nameTab===t?'#eff6ff':'none',color:nameTab===t?'#1a73e8':'#9ca3af',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',textTransform:'capitalize'}}>{t}</button>
                ))}
              </div>
              {nameTab==='solid' && (
                <div style={{display:'flex',flexWrap:'wrap',marginBottom:12}}>
                  <div onClick={()=>setNameSel('')} style={{...SW,background:'#f3f4f6',border:`2px solid ${nameSel===''?'#1a73e8':'#e4e6ea'}`}}>
                    {nameSel===''&&<i className="fi fi-sr-check" style={{fontSize:9,color:'#1a73e8'}}/>}
                  </div>
                  {SOLID_COLORS.map((c,i)=>(
                    <div key={i} onClick={()=>setNameSel(`bcolor${i+1}`)} style={{...SW,background:c,border:`2px solid ${nameSel===`bcolor${i+1}`?'#fff':'transparent'}`,transform:nameSel===`bcolor${i+1}`?'scale(1.25)':'scale(1)'}}>
                      {nameSel===`bcolor${i+1}`&&<i className="fi fi-sr-check" style={{fontSize:8,color:'#fff'}}/>}
                    </div>
                  ))}
                </div>
              )}
              {nameTab==='gradient' && (
                <div style={{display:'flex',flexWrap:'wrap',marginBottom:12}}>
                  {BUB_GRADS.map((g,i)=>(
                    <div key={i} onClick={()=>setNameSel(`bgrad${i+1}`)} style={{...SW,background:g,border:`2px solid ${nameSel===`bgrad${i+1}`?'#fff':'transparent'}`,transform:nameSel===`bgrad${i+1}`?'scale(1.25)':'scale(1)'}}>
                      {nameSel===`bgrad${i+1}`&&<i className="fi fi-sr-check" style={{fontSize:8,color:'#fff'}}/>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{fontSize:'0.7rem',fontWeight:700,color:'#9ca3af',marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Name Font</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginBottom:4}}>
                <div onClick={()=>setNameFont('')} style={{padding:'5px 7px',borderRadius:5,border:`1.5px solid ${nameFont===''?'#1a73e8':'#e4e6ea'}`,background:nameFont===''?'#eff6ff':'#f9fafb',cursor:'pointer',fontSize:'0.72rem',textAlign:'center',color:nameFont===''?'#1a73e8':'#374151',fontWeight:600}}>Default</div>
                {FONT_LIST.map(f=>(
                  <div key={f.id} onClick={()=>setNameFont(f.id)} style={{padding:'5px 7px',borderRadius:5,border:`1.5px solid ${nameFont===f.id?'#1a73e8':'#e4e6ea'}`,background:nameFont===f.id?'#eff6ff':'#f9fafb',cursor:'pointer',fontSize:'0.72rem',textAlign:'center',fontFamily:f.f,color:nameFont===f.id?'#1a73e8':'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                ))}
              </div>
            </>
          )}

          {/* ── BUBBLE TAB ── */}
          {tab==='bubble' && (
            <>
              <div style={{marginBottom:12,padding:'10px',background:'#f9fafb',borderRadius:8,border:'1px solid #f3f4f6'}}>
                <div style={{display:'inline-block',padding:'7px 12px',borderRadius:'3px 10px 10px 10px',fontSize:'0.82rem',
                  fontWeight:bubStyle.includes('bold')?700:400,
                  fontStyle:bubStyle.includes('italic')?'italic':'normal',
                  fontFamily:FONT_LIST.find(f=>f.id===bubFont)?.f||'inherit',
                  color:msgColor||'#fff',
                  ...(bubTab==='solid'&&bubSel?{background:SOLID_COLORS[parseInt(bubSel.replace('bubcolor',''))-1]}:
                     (bubTab==='gradient'||bubTab==='neon')&&bubSel?{background:BUB_GRADS[parseInt(bubSel.replace(/bubgrad|bubneon/,''))-1]}:
                     {background:'#374151',color:'#fff'})}}>
                  Hey there! 👋
                </div>
              </div>
              <div style={{display:'flex',gap:4,marginBottom:10}}>
                {['solid','gradient','neon'].map(t=>(
                  <button key={t} onClick={()=>setBubTab(t)} style={{flex:1,padding:'5px',borderRadius:5,border:`1px solid ${bubTab===t?'#1a73e8':'#e4e6ea'}`,background:bubTab===t?'#eff6ff':'none',color:bubTab===t?'#1a73e8':'#9ca3af',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',textTransform:'capitalize'}}>{t}</button>
                ))}
              </div>
              <div style={{display:'flex',flexWrap:'wrap',marginBottom:10}}>
                <div onClick={()=>setBubSel('')} style={{...SW,background:'#f3f4f6',border:`2px solid ${bubSel===''?'#1a73e8':'#e4e6ea'}`}}>
                  {bubSel===''&&<span style={{fontSize:8,color:'#6b7280',fontWeight:700}}>def</span>}
                </div>
                {SOLID_COLORS.map((c,i)=>(
                  <div key={i} onClick={()=>setBubSel(`bubcolor${i+1}`)} style={{...SW,background:c,border:`2px solid ${bubSel===`bubcolor${i+1}`?'#fff':'transparent'}`,transform:bubSel===`bubcolor${i+1}`?'scale(1.25)':'scale(1)'}}>
                    {bubSel===`bubcolor${i+1}`&&<i className="fi fi-sr-check" style={{fontSize:8,color:'#fff'}}/>}
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                <div>
                  <div style={{fontSize:'0.68rem',fontWeight:700,color:'#9ca3af',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Text Color</div>
                  <input type="color" value={msgColor} onChange={e=>setMsgColor(e.target.value)} style={{width:'100%',height:32,borderRadius:6,border:'1.5px solid #e4e6ea',cursor:'pointer',padding:2}}/>
                </div>
                <div>
                  <div style={{fontSize:'0.68rem',fontWeight:700,color:'#9ca3af',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Style</div>
                  <select value={bubStyle} onChange={e=>setBubStyle(e.target.value)} style={{width:'100%',padding:'6px 8px',border:'1.5px solid #e4e6ea',borderRadius:6,fontSize:'0.78rem',background:'#f9fafb',outline:'none',cursor:'pointer'}}>
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="italic">Italic</option>
                    <option value="bold italic">Bold Italic</option>
                  </select>
                </div>
              </div>
              <div style={{fontSize:'0.68rem',fontWeight:700,color:'#9ca3af',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Font</div>
              <select value={bubFont} onChange={e=>setBubFont(e.target.value)} style={{width:'100%',padding:'6px 8px',border:'1.5px solid #e4e6ea',borderRadius:6,fontSize:'0.8rem',background:'#f9fafb',outline:'none',cursor:'pointer'}}>
                <option value="">Default Font</option>
                {FONT_LIST.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{borderTop:'1px solid #f3f4f6',padding:'12px 14px',display:'flex',gap:8,flexShrink:0,background:'#fafafa'}}>
          <button onClick={onClose} style={{flex:1,padding:'9px',borderRadius:8,border:'1.5px solid #e4e6ea',background:'#fff',color:'#6b7280',cursor:'pointer',fontSize:'0.82rem',fontWeight:600}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{flex:2,padding:'9px',borderRadius:8,border:'none',background:saving?'#9ca3af':'linear-gradient(135deg,#1a73e8,#0d5bcd)',color:'#fff',cursor:saving?'not-allowed':'pointer',fontSize:'0.82rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <i className={saving?'fi fi-sr-spinner':'fi fi-sr-disk'} style={{fontSize:14}}/> {saving?'Saving…':'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AvatarDropdown({me,status,setStatus,onLeave,socket,onOpenSettings,onOpenProfile}) {
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

  const menuItem = (icon, label, color, onClick, danger=false) => (
    <button key={label} onClick={()=>{onClick?.();setOpen(false)}}
      style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 14px',background:'none',border:'none',borderBottom:'1px solid #2d3555',cursor:'pointer',textAlign:'left',transition:'background .12s'}}
      onMouseEnter={e=>e.currentTarget.style.background=danger?'rgba(239,68,68,.12)':'#2d3555'}
      onMouseLeave={e=>e.currentTarget.style.background='none'}>
      <i className={`fi ${icon}`} style={{fontSize:14,color:danger?'#f87171':color,width:18,textAlign:'center',flexShrink:0}}/>
      <span style={{fontSize:'0.84rem',fontWeight:600,color:danger?'#f87171':'#e2e8f0'}}>{label}</span>
    </button>
  )

  return (
    <div ref={ref} style={{position:'relative',flexShrink:0}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 3px',display:'flex',alignItems:'center'}}>
        <div style={{position:'relative'}}>
          <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',border:`2px solid ${border}`,display:'block'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
          <span style={{position:'absolute',bottom:0,right:0,width:7,height:7,background:curSt.color,borderRadius:'50%',border:'1.5px solid #fff'}}/>
        </div>
      </button>
      {open&&(
        <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#1a1f2e',border:'1px solid #2d3555',borderRadius:12,minWidth:240,boxShadow:'0 8px 32px rgba(0,0,0,.5)',zIndex:999,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
          {/* Profile header */}
          <div style={{padding:'14px 14px 12px',borderBottom:'1px solid #2d3555',display:'flex',alignItems:'center',gap:12,position:'relative'}}>
            <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:52,height:52,borderRadius:'50%',objectFit:'cover',border:`2.5px solid ${border}`,flexShrink:0}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                <RIcon rank={me?.rank} size={12}/>
                <span style={{fontSize:'0.65rem',fontWeight:700,color:ri.color}}>{ri.label}</span>
              </div>
              <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.95rem',color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{me?.username}</div>
              <div style={{fontSize:'0.68rem',color:'rgba(255,255,255,.4)',marginTop:2}}>{curSt.label}</div>
            </div>
            <div style={{position:'absolute',top:10,right:10,width:30,height:30,borderRadius:'50%',background:'#2d3555',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <RIcon rank={me?.rank} size={18}/>
            </div>
          </div>

          {/* Stats row */}
          {!me?.isGuest&&<div style={{display:'flex',gap:6,padding:'8px 12px',borderBottom:'1px solid #2d3555'}}>
            <div style={{flex:1,background:'#111827',borderRadius:8,padding:'6px 10px',display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:'1rem'}}>🪙</span>
              <div><div style={{fontSize:'0.55rem',color:'#9ca3af',fontWeight:600}}>Gold</div><div style={{fontSize:'0.8rem',fontWeight:800,color:'#fbbf24'}}>{me?.gold||0}</div></div>
            </div>
            <div style={{flex:1,background:'#111827',borderRadius:8,padding:'6px 10px',display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:'1rem'}}>⭐</span>
              <div><div style={{fontSize:'0.55rem',color:'#9ca3af',fontWeight:600}}>Lv {me?.level||1}</div><div style={{fontSize:'0.8rem',fontWeight:800,color:'#a78bfa'}}>{me?.xp||0} XP</div></div>
            </div>
          </div>}

          {/* Menu */}
          <div>
            {menuItem('fi-sr-user','My Profile','#a78bfa',()=>{onOpenProfile?.();setOpen(false)})}
            {menuItem('fi-sr-settings-sliders','Chat Settings','#60a5fa',()=>{onOpenSettings?.();setOpen(false)})}
            {isStaff&&menuItem('fi-sr-dashboard','Admin Panel','#f59e0b',()=>{window.location.href='/admin'})}
          </div>

          {/* Status sub-row */}
          <div style={{padding:'8px 10px',borderTop:'1px solid #2d3555',borderBottom:'1px solid #2d3555',display:'flex',gap:5,flexWrap:'wrap'}}>
            {STATUSES.map(s=>(
              <button key={s.id} onClick={()=>{setStatus(s.id);setOpen(false)}}
                style={{flex:'1 1 auto',minWidth:60,padding:'5px 8px',borderRadius:6,border:`1.5px solid ${status===s.id?s.color:'#2d3555'}`,background:status===s.id?s.color+'22':'none',cursor:'pointer',display:'flex',alignItems:'center',gap:5,justifyContent:'center'}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:s.color,display:'inline-block',flexShrink:0}}/>
                <span style={{fontSize:'0.65rem',fontWeight:700,color:status===s.id?s.color:'#9ca3af'}}>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Leave + Logout */}
          <div>
            {menuItem('fi-sr-sign-out-alt','Leave Room','#60a5fa',()=>onLeave())}
            <button onClick={()=>{const t=localStorage.getItem('cgz_token');if(t)fetch(`${API}/api/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${t}`}}).catch(()=>{});localStorage.removeItem('cgz_token');nav('/login')}}
              style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left',transition:'background .12s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,.12)'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}>
              <i className="fi fi-sr-user-logout" style={{fontSize:14,color:'#f87171',width:18,textAlign:'center',flexShrink:0}}/>
              <span style={{fontSize:'0.84rem',fontWeight:600,color:'#f87171'}}>Logout</span>
            </button>
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
      style={{position:'relative',background:active?'#e8f0fe':'none',border:'none',cursor:'pointer',color:active?'#1a73e8':'#6b7280',width:38,height:38,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,transition:'all .15s',flexShrink:0}}
      onMouseEnter={e=>{e.currentTarget.style.background='#f3f4f6'}}
      onMouseLeave={e=>{e.currentTarget.style.background=active?'#e8f0fe':'none'}}>
      {img
        ? <img src={img} alt={title} style={{width:22,height:22,objectFit:'contain',filter:active?'none':'grayscale(20%)',opacity:active?1:0.8}} onError={e=>e.target.style.display='none'}/>
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
// WEBCAM PANEL — inline below header, full WebRTC streaming
// ─────────────────────────────────────────────────────────────
function WebcamPanel({socket,roomId,me,onClose}) {
  const hostVideoRef=useRef(null), streamRef=useRef(null)
  const peerConns=useRef({})  // viewerId/hostId -> RTCPeerConnection

  const [hosting,setHosting]   =useState(false)
  const [watching,setWatching] =useState(null)  // {userId,username,socketId}
  const [devices,setDevices]   =useState([])
  const [selCam,setSelCam]     =useState('')
  const [micOn,setMicOn]       =useState(true)
  const [camOn,setCamOn]       =useState(true)
  const [filter,setFilter]     =useState('none')
  const [viewers,setViewers]   =useState([])   // [{viewerId,viewerName}]
  const [liveCams,setLiveCams] =useState([])   // [{userId,username,sessionId}] from room
  const [showViewers,setShowViewers]=useState(false)
  const [tab,setTab]           =useState('host') // 'host'|'watch'
  const watchVideoRef=useRef(null)

  const FILTERS=[
    {id:'none',   label:'None'},
    {id:'grayscale(100%)', label:'B&W'},
    {id:'sepia(80%)',      label:'Sepia'},
    {id:'hue-rotate(90deg) saturate(150%)', label:'Vivid'},
    {id:'contrast(130%) brightness(110%)',  label:'Sharp'},
    {id:'blur(2px)',       label:'Blur'},
  ]

  const ICE_CFG={iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]}

  useEffect(()=>{
    navigator.mediaDevices?.enumerateDevices().then(devs=>{
      const v=devs.filter(d=>d.kind==='videoinput')
      setDevices(v); if(v[0]) setSelCam(v[0].deviceId)
    }).catch(()=>{})
    // Fetch active cams in this room
    const tok=localStorage.getItem('cgz_token')
    if(roomId&&tok) fetch(`${API}/api/webcam/room/${roomId}`,{headers:{Authorization:`Bearer ${tok}`}})
      .then(r=>r.json()).then(d=>{if(d.sessions) setLiveCams(d.sessions)}).catch(()=>{})
    return()=>{stop();stopWatching()}
  },[])

  // Socket events
  useEffect(()=>{
    if(!socket) return
    // HOST receives: viewer joined → create offer
    function onViewerJoined({viewerId,viewerName,viewerSocketId}){
      setViewers(p=>[...p.filter(v=>v.viewerId!==viewerId),{viewerId,viewerName}])
      createOffer(viewerSocketId,viewerId)
    }
    function onViewerLeft({viewerId,viewerName}){
      setViewers(p=>p.filter(v=>v.viewerId!==viewerId))
      peerConns.current[viewerId]?.close(); delete peerConns.current[viewerId]
    }
    // HOST receives answer from viewer
    function onCamAnswer({from,answer}){
      peerConns.current[from]?.setRemoteDescription(new RTCSessionDescription(answer)).catch(()=>{})
    }
    // VIEWER receives offer from host
    function onCamOffer({from,username:hostName,offer}){
      if(offer==='live'){
        // New host went live — add to liveCams list
        setLiveCams(p=>{const exists=p.find(c=>c.userId===from);if(exists)return p;return[...p,{userId:from,username:hostName}]})
        return
      }
      if(watching?.userId!==from) return
      handleHostOffer(from,offer)
    }
    function onCamIce({from,candidate}){
      const pc=peerConns.current[from]
      if(pc&&candidate) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(()=>{})
    }
    function onCamHostLeft({userId,username:hostName}){
      setLiveCams(p=>p.filter(c=>c.userId!==userId))
      if(watching?.userId===userId){setWatching(null);if(watchVideoRef.current)watchVideoRef.current.srcObject=null}
    }
    function onCamStarted({userId,username:hostName,sessionId}){
      setLiveCams(p=>{const ex=p.find(c=>c.userId===userId);if(ex)return p;return[...p,{userId,username:hostName,sessionId}]})
    }
    function onCamStopped({userId}){
      setLiveCams(p=>p.filter(c=>c.userId!==userId))
      if(watching?.userId===userId){setWatching(null);if(watchVideoRef.current)watchVideoRef.current.srcObject=null}
    }
    socket.on('camViewerJoined',onViewerJoined)
    socket.on('camViewerLeft',  onViewerLeft)
    socket.on('camAnswer',      onCamAnswer)
    socket.on('camOffer',       onCamOffer)
    socket.on('camIceCandidate',onCamIce)
    socket.on('camHostLeft',    onCamHostLeft)
    socket.on('camStarted',     onCamStarted)
    socket.on('camStopped',     onCamStopped)
    return()=>{
      socket.off('camViewerJoined',onViewerJoined); socket.off('camViewerLeft',onViewerLeft)
      socket.off('camAnswer',onCamAnswer);          socket.off('camOffer',onCamOffer)
      socket.off('camIceCandidate',onCamIce);       socket.off('camHostLeft',onCamHostLeft)
      socket.off('camStarted',onCamStarted);        socket.off('camStopped',onCamStopped)
    }
  },[socket,watching])

  // HOST: create RTCPeerConnection and send offer to a viewer
  async function createOffer(viewerSocketId,viewerId){
    const pc=new RTCPeerConnection(ICE_CFG)
    peerConns.current[viewerId]=pc
    streamRef.current?.getTracks().forEach(t=>pc.addTrack(t,streamRef.current))
    pc.onicecandidate=({candidate})=>{
      if(candidate) socket?.emit('camIceCandidate',{toSocketId:viewerSocketId,candidate})
    }
    const offer=await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket?.emit('camAnswer',{toSocketId:viewerSocketId,answer:offer})
  }

  // VIEWER: receive offer from host, send answer
  async function handleHostOffer(hostUserId,offer){
    const old=peerConns.current[hostUserId]; old?.close()
    const pc=new RTCPeerConnection(ICE_CFG)
    peerConns.current[hostUserId]=pc
    pc.ontrack=({streams})=>{
      if(watchVideoRef.current&&streams[0]){
        watchVideoRef.current.srcObject=streams[0]
        watchVideoRef.current.play().catch(()=>{})
      }
    }
    pc.onicecandidate=({candidate})=>{
      if(candidate&&watching){
        const host=watching; socket?.emit('camIceCandidate',{toSocketId:host.socketId||host.userId,candidate})
      }
    }
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer=await pc.createAnswer()
    await pc.setLocalDescription(answer)
    socket?.emit('camAnswer',{toSocketId:watching?.socketId,answer})
  }

  async function start(){
    try{
      const stream=await navigator.mediaDevices.getUserMedia({
        video:selCam?{deviceId:{exact:selCam},width:{ideal:640},height:{ideal:480}}:true,audio:true
      })
      streamRef.current=stream
      if(hostVideoRef.current){hostVideoRef.current.srcObject=stream;hostVideoRef.current.play().catch(()=>{})}
      setHosting(true)
      // Notify room via socket + start session via API
      socket?.emit('camOffer',{roomId,offer:'live'})
      const tok=localStorage.getItem('cgz_token')
      fetch(`${API}/api/webcam/start`,{method:'POST',headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json'},body:JSON.stringify({roomId})}).catch(()=>{})
    }catch(e){alert('Camera error: '+e.message)}
  }

  function stop(){
    streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null
    if(hostVideoRef.current) hostVideoRef.current.srcObject=null
    Object.values(peerConns.current).forEach(pc=>pc.close()); peerConns.current={}
    setHosting(false); setViewers([])
    const tok=localStorage.getItem('cgz_token')
    fetch(`${API}/api/webcam/stop`,{method:'POST',headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json'},body:JSON.stringify({})}).catch(()=>{})
  }

  function switchCam(deviceId){
    setSelCam(deviceId)
    if(hosting){
      const oldTrack=streamRef.current?.getVideoTracks()[0]
      navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:deviceId}},audio:false}).then(ns=>{
        const newTrack=ns.getVideoTracks()[0]
        // Replace track in all peer connections
        Object.values(peerConns.current).forEach(pc=>{
          const sender=pc.getSenders().find(s=>s.track?.kind==='video')
          if(sender) sender.replaceTrack(newTrack)
        })
        // Replace in local stream
        if(oldTrack){streamRef.current?.removeTrack(oldTrack);oldTrack.stop()}
        streamRef.current?.addTrack(newTrack)
        if(hostVideoRef.current) hostVideoRef.current.srcObject=streamRef.current
      }).catch(()=>{})
    }
  }

  function toggleMic(){
    const t=streamRef.current?.getAudioTracks()[0]
    if(t){t.enabled=!t.enabled;setMicOn(p=>!p)}
  }
  function toggleCam(){
    const t=streamRef.current?.getVideoTracks()[0]
    if(t){t.enabled=!t.enabled;setCamOn(p=>!p)}
  }

  function watchUser(cam){
    setWatching(cam); setTab('watch')
    socket?.emit('watchCam',{roomId,hostUserId:cam.userId})
  }
  function stopWatching(){
    if(watching){socket?.emit('stopWatchingCam',{hostUserId:watching.userId})}
    peerConns.current[watching?.userId]?.close()
    if(watching?.userId) delete peerConns.current[watching.userId]
    setWatching(null)
    if(watchVideoRef.current) watchVideoRef.current.srcObject=null
  }

  const IBT=({t,fn,img,fb,active,style:s})=>(
    <button title={t} onClick={fn} style={{width:30,height:30,border:'none',borderRadius:7,background:active===false?'rgba(239,68,68,.9)':'rgba(255,255,255,.12)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,...s}}>
      <img src={img} alt="" style={{width:14,height:14,filter:'invert(1)',opacity:.9}} onError={e=>{e.target.outerHTML=`<i class="${fb}" style="font-size:12px;color:#fff"/>`}}/>
    </button>
  )

  const otherCams=liveCams.filter(c=>c.userId!==me?._id)

  return(
    <div style={{background:'#0f0f1e',borderBottom:'2px solid #2d2d44',flexShrink:0,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      {/* Header row */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',borderBottom:'1px solid #1e1e38'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <img src="/default_images/icons/webcam.svg" alt="" style={{width:13,height:13,filter:'invert(1)',opacity:.7}}/>
          <span style={{color:'#e0e0f0',fontWeight:700,fontSize:'0.76rem',letterSpacing:'.5px'}}>LIVE CAM</span>
          {hosting&&<span style={{background:'#ef4444',color:'#fff',fontSize:'0.58rem',fontWeight:800,padding:'1px 6px',borderRadius:10,letterSpacing:'.5px'}}>LIVE</span>}
          {otherCams.length>0&&<span style={{background:'#1a73e8',color:'#fff',fontSize:'0.58rem',fontWeight:700,padding:'1px 6px',borderRadius:10}}>{otherCams.length} live</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {/* Tab buttons */}
          <button onClick={()=>setTab('host')} style={{fontSize:'0.65rem',padding:'2px 8px',borderRadius:5,border:'none',background:tab==='host'?'#1a73e8':'rgba(255,255,255,.1)',color:'#fff',cursor:'pointer',fontWeight:700}}>My Cam</button>
          {otherCams.length>0&&<button onClick={()=>setTab('watch')} style={{fontSize:'0.65rem',padding:'2px 8px',borderRadius:5,border:'none',background:tab==='watch'?'#1a73e8':'rgba(255,255,255,.1)',color:'#fff',cursor:'pointer',fontWeight:700}}>Watch ({otherCams.length})</button>}
          {hosting&&<button onClick={()=>setShowViewers(p=>!p)} style={{fontSize:'0.65rem',padding:'2px 8px',borderRadius:5,border:'none',background:showViewers?'#7c3aed':'rgba(255,255,255,.1)',color:'#fff',cursor:'pointer',fontWeight:700}}>👥 {viewers.length}</button>}
          <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:14,lineHeight:1,padding:'0 2px'}}>✕</button>
        </div>
      </div>

      {/* Body */}
      <div style={{display:'flex',gap:0,overflow:'hidden'}}>
        {/* HOST TAB */}
        {tab==='host'&&(
          <div style={{flex:1,display:'flex',flexDirection:'column'}}>
            <div style={{position:'relative',background:'#000',aspectRatio:'16/9',maxHeight:220,overflow:'hidden'}}>
              <video ref={hostVideoRef} autoPlay muted playsInline
                style={{width:'100%',height:'100%',objectFit:'cover',display:'block',filter}}/>
              {!hosting&&(
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.7)',color:'rgba(255,255,255,.5)',flexDirection:'column',gap:6}}>
                  <img src="/default_images/icons/webcam.svg" alt="" style={{width:32,height:32,filter:'invert(1)',opacity:.3}}/>
                  <span style={{fontSize:'0.72rem'}}>Camera off</span>
                </div>
              )}
              {/* Viewer list overlay */}
              {showViewers&&hosting&&(
                <div style={{position:'absolute',top:0,right:0,bottom:0,width:'min(160px,50%)',background:'rgba(0,0,0,.85)',padding:'8px',overflowY:'auto'}}>
                  <div style={{fontSize:'0.65rem',color:'rgba(255,255,255,.5)',fontWeight:700,marginBottom:6,textTransform:'uppercase',letterSpacing:'.5px'}}>Viewers ({viewers.length})</div>
                  {viewers.length===0&&<div style={{fontSize:'0.68rem',color:'rgba(255,255,255,.3)'}}>No viewers yet</div>}
                  {viewers.map(v=>(
                    <div key={v.viewerId} style={{fontSize:'0.72rem',color:'#e0e0f0',padding:'3px 0',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
                      👤 {v.viewerName}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Controls */}
            <div style={{padding:'6px 8px',display:'flex',gap:5,alignItems:'center',background:'#0d0d1a',flexWrap:'wrap'}}>
              {/* Camera switch */}
              {devices.length>1&&(
                <select value={selCam} onChange={e=>{setSelCam(e.target.value);switchCam(e.target.value)}}
                  style={{flex:1,minWidth:0,maxWidth:130,padding:'4px 6px',background:'#1a1a2e',color:'#c0c0e0',border:'1px solid #2d2d44',borderRadius:6,fontSize:'0.65rem'}}>
                  {devices.map((d,i)=><option key={d.deviceId} value={d.deviceId}>{d.label||`Camera ${i+1}`}</option>)}
                </select>
              )}
              {/* Switch cam single button if only 2 devices */}
              {devices.length===2&&(
                <IBT t="Switch Camera" fn={()=>switchCam(devices.find(d=>d.deviceId!==selCam)?.deviceId||selCam)}
                  img="/default_images/call/switch.svg" fb="fi fi-sr-rotate-right"/>
              )}
              <IBT t={micOn?'Mute mic':'Unmute'} fn={toggleMic} img="/default_images/icons/audio.svg" fb="fi fi-sr-microphone" active={micOn?undefined:false}/>
              <IBT t={camOn?'Hide cam':'Show cam'} fn={toggleCam} img="/default_images/icons/video.svg" fb="fi fi-sr-video-camera" active={camOn?undefined:false}/>
              {/* Filter picker */}
              <select value={filter} onChange={e=>setFilter(e.target.value)}
                style={{padding:'4px 5px',background:'#1a1a2e',color:'#c0c0e0',border:'1px solid #2d2d44',borderRadius:6,fontSize:'0.63rem',maxWidth:70}}>
                {FILTERS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
              {!hosting
                ?<button onClick={start} style={{marginLeft:'auto',padding:'5px 14px',borderRadius:7,border:'none',background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',fontWeight:800,cursor:'pointer',fontSize:'0.75rem',letterSpacing:'.3px'}}>▶ Go Live</button>
                :<button onClick={stop}  style={{marginLeft:'auto',padding:'5px 14px',borderRadius:7,border:'none',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'#fff',fontWeight:800,cursor:'pointer',fontSize:'0.75rem',letterSpacing:'.3px'}}>■ Stop</button>
              }
            </div>
          </div>
        )}

        {/* WATCH TAB */}
        {tab==='watch'&&(
          <div style={{flex:1,display:'flex',flexDirection:'column'}}>
            {watching?(
              <>
                <div style={{position:'relative',background:'#000',aspectRatio:'16/9',maxHeight:220,overflow:'hidden'}}>
                  <video ref={watchVideoRef} autoPlay playsInline
                    style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                  <div style={{position:'absolute',top:6,left:8,background:'rgba(0,0,0,.6)',borderRadius:6,padding:'2px 8px',fontSize:'0.65rem',color:'#fff',fontWeight:700}}>
                    📡 {watching.username}
                  </div>
                </div>
                <div style={{padding:'5px 8px',display:'flex',gap:5,alignItems:'center',background:'#0d0d1a'}}>
                  <button onClick={stopWatching} style={{padding:'4px 12px',borderRadius:6,border:'none',background:'rgba(239,68,68,.2)',color:'#ef4444',fontWeight:700,cursor:'pointer',fontSize:'0.72rem',border:'1px solid rgba(239,68,68,.3)'}}>Leave</button>
                  <span style={{fontSize:'0.68rem',color:'rgba(255,255,255,.4)'}}>Watching {watching.username}</span>
                </div>
              </>
            ):(
              <div style={{padding:'10px 8px'}}>
                <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,.4)',marginBottom:8,fontWeight:600}}>Live cams in this room</div>
                {otherCams.length===0&&(
                  <div style={{textAlign:'center',padding:'16px 0',color:'rgba(255,255,255,.25)',fontSize:'0.72rem'}}>No one is live right now</div>
                )}
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {otherCams.map(c=>(
                    <button key={c.userId} onClick={()=>watchUser(c)}
                      style={{padding:'5px 10px',borderRadius:7,border:'1px solid rgba(26,115,232,.4)',background:'rgba(26,115,232,.12)',color:'#93c5fd',fontSize:'0.72rem',fontWeight:700,cursor:'pointer'}}>
                      📡 {c.username}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


export default function ChatRoom() {
  const {roomSlug}=useParams(), nav=useNavigate(), toast=useToast()
  const token=localStorage.getItem('cgz_token')

  const [me,        setMe]       =useState(null)
  const [room,      setRoom]     =useState(null)
  // roomId = resolved _id once room loads, fallback slug for API calls
  const roomId = room?._id || roomSlug
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
  const [showChatSettings,setShowChatSettings]=useState(false)
  const [showPlus,  setShowPlus] =useState(false)
  const [showPaint, setShowPaint]=useState(false)
  const [showCam,   setShowCam]  =useState(false)
  const [showDiceAnim,setShowDiceAnim]=useState(false)
  const [diceRollVal, setDiceRollVal] =useState(null)
  const [whisperTarget,setWhisper]=useState(null)
  const [showGif,   setShowGif]  =useState(false)
  const [showYT,    setShowYT]   =useState(false)
  const [showEmoji, setShowEmoji]=useState(false)
  const [profUser,  setProf]     =useState(null)
  const [miniCard,  setMini]     =useState(null)
  const [giftTarget,setGiftTgt]  =useState(null)
  const [loading,   setLoad]     =useState(true)
  const [roomErr,   setErr]      =useState('')
  const [connected, setConn]     =useState(false)
  const [onlineCount,setOnlineCount]=useState(0)
  const [status,    setStatus]   =useState('online')
  const [notif,     setNotif]    =useState({dm:0,friends:0,notif:0,reports:0})
  const [hiddenMsgs,setHidden]   =useState(new Set())

  const sockRef=useRef(null), bottomRef=useRef(null), inputRef=useRef(null)
  const typingTimer=useRef(null), isTypingRef=useRef(false)

  useEffect(()=>{
    if(!token){nav('/login');return}
    loadRoom()
    return()=>sockRef.current?.disconnect()
  },[roomSlug])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  async function loadRoom() {
    setLoad(true); setErr('')
    try {
      const [mr,rr]=await Promise.all([
        fetch(`${API}/api/auth/me`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/rooms/${roomSlug}`,{headers:{Authorization:`Bearer ${token}`}}),
      ])
      if(mr.status===401){localStorage.removeItem('cgz_token');nav('/login');return}
      const md=await mr.json()
      if(md.user){if(md.freshToken)localStorage.setItem('cgz_token',md.freshToken);setMe(md.user)}
      const rd=await rr.json()
      if(!rr.ok){setErr(rd.error||'Room not found');setLoad(false);return}
      setRoom(rd.room)
      fetch(`${API}/api/rooms/${roomSlug}/messages?limit=50`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.messages)setMsgs(d.messages)}).catch(()=>{})
    } catch{setErr('Connection failed.')}
    setLoad(false)
  }

  // Connect socket only after room object is available (so roomId = room._id works)
  useEffect(()=>{
    if(!room?._id) return
    connectSocket()
    return()=>sockRef.current?.disconnect()
  },[room?._id])

  function connectSocket() {
    sockRef.current?.disconnect()
    const s=io(API,{auth:{token},transports:['websocket','polling']})
    s.on('connect',        ()=>{setConn(true);s.emit('joinRoom',{roomId})})
    s.on('disconnect',     ()=>setConn(false))
    s.on('messageHistory', ms=>setMsgs(ms||[]))
    s.on('newMessage',     m=>{setMsgs(p=>[...p,m]);Sounds.newMessage()})
    s.on('roomUsers',      l=>{setUsers(l||[])})
    s.on('roomUserCount',  n=>setOnlineCount(n))
    // Backend sends systemMessage for join/leave/kick/mute/ban/dice — NOT userJoined/userLeft
    s.on('systemMessage',  m=>{
      setMsgs(p=>[...p,{_id:Date.now()+'s'+Math.random(),type:m.type||'system',content:m.text,createdAt:new Date()}])
      if(m.type==='join') Sounds.join()
    })
    s.on('messageDeleted', ({messageId})=>setMsgs(p=>p.filter(m=>m._id!==messageId)))
    s.on('typing',         ({username,isTyping:t})=>setTypers(p=>t?[...new Set([...p,username])]:p.filter(n=>n!==username)))
    s.on('youAreKicked',   ({reason})=>{Sounds.mute();toast?.show(reason||'You were kicked','error',5000);setTimeout(()=>nav('/chat'),2000)})
    s.on('accessDenied',   ({msg})=>{toast?.show(msg||'Access denied','error',5000);setTimeout(()=>nav('/chat'),2000)})
    s.on('youAreMuted',    ({minutes})=>{Sounds.mute();toast?.show(`🔇 Muted for ${minutes} minutes`,'warn',6000)})
    s.on('levelUp',        ({level,gold})=>{Sounds.levelUp()})
    s.on('giftReceived',   ({gift,from})=>{Sounds.gift()})
    s.on('diceResult',     ({roll,won,payout,bet,newGold})=>{ setDiceRollVal(roll); setShowDiceAnim(true); if(newGold!==undefined) setMe(p=>p?{...p,gold:newGold}:p); const sysText=won?'🎲 You rolled '+roll+' and WON '+payout+' gold! 🎉':'🎲 You rolled '+roll+' and lost '+(bet||100)+' gold.'; setMsgs(p=>[...p,{_id:Date.now()+'dr',type:'dice',content:sysText,createdAt:new Date()}]); })
    s.on('spinResult',     ({prize})=>{})
    s.on('goldUpdated',    ({gold})=>setMe(p=>p?{...p,gold}:p))
    s.on('error',          e=>console.error('Socket:',e))
    // ── ADDITIONAL EVENTS ──────────────────────────────────
    s.on('roomTopic',      ({topic})=>setRoom(p=>p?{...p,topic}:p))
    s.on('topicChanged',   ({topic})=>setRoom(p=>p?{...p,topic}:p))
    s.on('roomUpdated',    d=>setRoom(p=>p?{...p,...d}:p))
    s.on('roomClosed',     ({message})=>{toast?.show(message||'Room closed','error',4000);setTimeout(()=>nav('/chat'),2000)})
    s.on('badgeEarned',    ({badge})=>{Sounds.badge()})
    s.on('mentioned',      ({by,content})=>{ /* mention notifications disabled */ })
    s.on('messageReaction',({messageId,reactions})=>{setMsgs(p=>p.map(m=>m._id===messageId?{...m,reactions}:m))})
    s.on('messagePinned',  ({messageId})=>{setMsgs(p=>p.map(m=>m._id===messageId?{...m,isPinned:true}:m))})
    s.on('userMuted',      ({userId:uid,minutes,by})=>{setMsgs(p=>[...p,{_id:Date.now()+'mu',type:'mute',content:`${by} muted a user for ${minutes} minutes`,createdAt:new Date()}])})
    s.on('userKicked',     ({userId:uid,by})=>{setMsgs(p=>[...p,{_id:Date.now()+'ki',type:'kick',content:`${by} kicked a user`,createdAt:new Date()}])})
    s.on('diceError',      ({msg})=>toast?.show(`🎲 ${msg}`,'error',4000))
    s.on('kenoError',      ({msg})=>toast?.show(`🎯 ${msg}`,'error',4000))
    s.on('kenoResult',     ({won,payout,matches,total,bet})=>{})
    s.on('gamePlayed',     ({game,player,won})=>{}) // already handled via systemMessage
    s.on('dailyBonusClaimed',({gold,xp})=>{})
    s.on('onlineCount',    n=>setOnlineCount(n))
    s.on('privateMessage', m=>{setNotif(p=>({...p,dm:p.dm+1}));Sounds.privateMsg()})
    s.on('giftSent',       ({gift,to})=>{})
    s.on('pmError',        ({error})=>toast?.show(error,'error',4000))
    s.on('echoMessage',    ({from,content,isEcho,to})=>{
      // Both sender (echo back) and recipient get this event
      // Always show if 'from' is present — creates whisper bubble in chat
      if(from) setMsgs(p=>[...p,{_id:Date.now()+'e',type:'whisper',content,sender:from,createdAt:new Date(),isEcho:true}])
    })
    s.on('echoError',      ({error})=>toast?.show(`👁️ ${error}`,'error',3000))
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

  const handleMention=useCallback((text)=>{setInput(p=>text+(p?' '+p:''));inputRef.current?.focus()},[])
  const handleHide=useCallback((id)=>{setHidden(p=>new Set([...p,id]))},[])
  const handleMiniCard=useCallback((user,pos)=>{setMini({user,pos});setProf(null)},[])
  const myLevel=RANKS[me?.rank]?.level||1
  const isStaff=myLevel>=11

  // ── Active theme object (applied to header/body/input) ──
  const tObj = THEMES.find(t=>t.id===(me?.chatTheme||'Dolphin')) || THEMES.find(t=>t.id==='Dolphin') || THEMES[0]
  // Derived helpers
  const thBg      = tObj.bg_chat    // main chat background
  const thHeader  = tObj.bg_header  // header background
  const thText    = tObj.text       // primary text
  const thAccent  = tObj.accent     // accent / send button
  const thLog     = tObj.bg_log     // message bubble bg
  const thBgImg   = tObj.bg_image   // background image URL (may be empty)
  const thBorder  = tObj.default_color // border / divider color
  const thIsDark  = !['Dolphin','Lite'].includes(tObj.id) // use white/dark text logic
  const closeAll=useCallback(()=>{setMini(null);setShowNotif(false);setShowDM(false);setShowFriends(false);setShowPlus(false);setShowEmoji(false);setShowGif(false);setShowYT(false);setShowPaint(false)},[])

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
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',background:thBg,overflow:'hidden',position:'relative'}} onClick={closeAll}>
      {thBgImg&&<div style={{position:'fixed',inset:0,backgroundImage:`url(${thBgImg})`,backgroundSize:'cover',backgroundPosition:'center',backgroundRepeat:'no-repeat',zIndex:0,pointerEvents:'none',opacity:0.6}}/>}

      {/* ── HEADER ── */}
      <div style={{height:50,background:thHeader,borderBottom:`1px solid ${thBorder}22`,display:'flex',alignItems:'center',padding:'0 8px',gap:2,flexShrink:0,boxShadow:'0 1px 4px rgba(0,0,0,.18)'}}>
        {/* Hamburger */}
        <button onClick={e=>{e.stopPropagation();setLeft(s=>!s)}} title="Menu"
          style={{background:showLeft?thAccent+'33':'none',border:'none',cursor:'pointer',color:showLeft?thAccent:thText,width:34,height:34,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,opacity:0.9}}>
          <i className="fi fi-sr-bars-sort"/>
        </button>

        {/* Webcam button */}
        <HBtn img="/default_images/icons/webcam.svg" title="Webcam" active={showCam} onClick={e=>{e.stopPropagation();setShowCam(p=>!p)}}/>

        {/* Room name - center */}
        <div style={{flex:1,textAlign:'center',minWidth:0}}>
          <div style={{fontSize:'0.84rem',fontWeight:800,color:thText,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'Outfit,sans-serif'}}>{room?.name||'Chat Room'}</div>
          <div style={{fontSize:'0.62rem',color:connected?'#22c55e':thText+'88'}}>{connected?`● ${Math.max(users.length,onlineCount)||users.length} online`:'Connecting...'}</div>
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

        <AvatarDropdown me={me} status={status} setStatus={setStatus} onLeave={leave} socket={sockRef.current} onOpenSettings={()=>setShowChatSettings(true)} onOpenProfile={()=>setProf(me)}/>
      </div>

      {/* ── CHAT SETTINGS OVERLAY ── */}
      {showChatSettings&&(
        <ChatSettingsOverlay
          me={me}
          onClose={()=>setShowChatSettings(false)}
          onSaved={(updated)=>{if(updated)setMe(p=>({...p,...updated}))}}
        />
      )}

      {/* ── BODY ── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {showLeft&&<LeftSidebar room={room} nav={nav} socket={sockRef.current} roomId={room?._id||roomSlug} onClose={()=>setLeft(false)} me={me} onStyleSaved={(updated)=>{if(updated)setMe(p=>({...p,...updated}))}}/>}

        {/* MESSAGES */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0,background:thBg}}>
          {room?.topic&&(
            <div style={{background:thHeader,borderBottom:`1px solid ${thBorder}33`,padding:'8px 14px',fontSize:'0.78rem',color:thText,flexShrink:0,display:'flex',alignItems:'flex-start',gap:10}}>
              <i className="fi fi-sr-envelope" style={{fontSize:16,color:'#fbbf24',marginTop:1,flexShrink:0}}/>
              <span style={{flex:1,lineHeight:1.5}}>{room.topic}</span>
              <button onClick={()=>setRoom(p=>p?{...p,topic:''}:p)} style={{background:'none',border:'none',cursor:'pointer',color:'#64748b',fontSize:14,flexShrink:0,padding:0}}>✕</button>
            </div>
          )}

          {showCam&&<WebcamPanel socket={sockRef.current} roomId={roomId} me={me} onClose={()=>setShowCam(false)}/>}
          <div style={{flex:1,overflowY:'auto',padding:'6px 0'}}>
            {messages.map((m,i)=>(
              !hiddenMsgs.has(m._id)&&<Msg key={m._id||i} msg={m} myId={me?._id} myLevel={myLevel}
                onMiniCard={handleMiniCard} onMention={handleMention} onHide={handleHide}
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
          <div style={{borderTop:`1px solid ${thBorder}44`,padding:'5px 8px',background:thHeader,flexShrink:0,position:'relative'}}>
            {/* + popup */}
            {showPlus&&(
              <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:'calc(100% + 5px)',left:6,background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,padding:8,display:'flex',gap:7,boxShadow:'0 4px 20px rgba(0,0,0,.14)',zIndex:50}}>
                {[
                  {icon:'/default_images/icons/upload.svg', fallback:'fi-sr-picture', label:'Image',  action:()=>{document.getElementById('cgz-img-input').click();setShowPlus(false)}},
                  {icon:'/default_images/icons/giphy.svg',  fallback:'fi-sr-gif',     label:'GIF',    action:()=>{setShowGif(p=>!p);setShowPlus(false)}},
  {icon:null, emoji:'🎨', label:'Paint',  action:()=>{setShowPaint(true);setShowPlus(false)}},
                  {icon:'/default_images/icons/youtube.svg',fallback:'fi-br-youtube', label:'YouTube',action:()=>{setShowYT(p=>!p);setShowPlus(false)}},
                  {icon:null, emoji:'🎲', label:'Dice', action:()=>{
                    if((me?.gold||0)<100){toast?.show('🎲 Need 100 gold to play dice!','error',3000);setShowPlus(false);return;}
                    sockRef.current?.emit('rollDice',{roomId});setShowPlus(false);
                  }},
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
              onChange={async e=>{
                const f=e.target.files[0]; if(!f) return
                e.target.value=''
                try {
                  const fd=new FormData(); fd.append('image',f)
                  const r=await fetch(`${API}/api/upload/image`,{method:'POST',headers:{Authorization:`Bearer ${localStorage.getItem('cgz_token')}`},body:fd})
                  const d=await r.json()
                  if(r.ok&&d.url) sockRef.current?.emit('sendMessage',{roomId,content:d.url,type:'image'})
                  else toast?.show('Image upload failed','error',3000)
                } catch{toast?.show('Image upload failed','error',3000)}
              }}/>

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
                style={{flex:1,padding:'8px 12px',background:thLog||thBg,border:`1.5px solid ${thBorder}55`,borderRadius:22,color:thText,fontSize:'0.88rem',outline:'none',transition:'border-color .15s',fontFamily:'Nunito,sans-serif',minWidth:0}}
                onFocus={e=>e.target.style.borderColor=thAccent} onBlur={e=>e.target.style.borderColor=`${thBorder}55`}/>
              {/* Mic — use UI SVG icon */}
              <button type="button" title="Voice"
                style={{width:32,height:32,borderRadius:'50%',border:'none',background:'#f3f4f6',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,padding:0}}>
                <img src="/default_images/icons/voice.svg" alt="" style={{width:17,height:17,objectFit:'contain'}} onError={e=>{e.target.outerHTML='<i class="fi fi-sr-microphone" style="font-size:15px;color:#6b7280"></i>'}}/>
              </button>
              {/* Send */}
              <button type="submit" disabled={!input.trim()||!connected}
                style={{width:34,height:34,borderRadius:'50%',border:'none',background:input.trim()&&connected?thAccent:'#f3f4f6',color:input.trim()&&connected?'#fff':'#9ca3af',cursor:input.trim()&&connected?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0,boxShadow:input.trim()&&connected?`0 2px 8px ${thAccent}55`:'none',transition:'all .15s'}}>
                <i className="fi fi-sr-paper-plane-top"/>
              </button>
            </form>
          </div>
        </div>

        {showRight&&<RightSidebar users={users} myLevel={myLevel} onUserClick={(u,pos)=>{if(pos){handleMiniCard(u,pos)}else{setProf(u);setMini(null)}}} onWhisper={u=>setWhisper(u)} onClose={()=>setRight(false)} tObj={tObj}/>}
      </div>

      {/* ── FOOTER ── */}
      <div style={{position:'relative'}}>
        {showRadio&&<RadioPanel onClose={()=>setRadio(false)}/>}
        <Footer showRadio={showRadio} setShowRadio={setRadio} showRight={showRight} setRight={setRight} notif={notif}/>
      </div>

      {/* OVERLAYS */}
      {showDiceAnim&&diceRollVal&&<DiceRoll value={diceRollVal} onDone={()=>{setShowDiceAnim(false);setDiceRollVal(null)}}/>}
      {miniCard&&<MiniCard user={miniCard.user} myLevel={myLevel} pos={miniCard.pos} onClose={()=>setMini(null)} onFull={()=>{setProf(miniCard.user);setMini(null)}} onGift={u=>setGiftTgt(u)} socket={sockRef.current} roomId={roomId}/>}
      {profUser&&(profUser._id===me?._id
        ? <SelfProfileOverlay user={me} onClose={()=>setProf(null)} onUpdated={u=>{if(u)setMe(p=>({...p,...u}))}}/>
        : <ProfileModal user={profUser} myLevel={myLevel} socket={sockRef.current} roomId={roomId} onClose={()=>setProf(null)} onGift={u=>setGiftTgt(u)}/>
      )}
      {giftTarget&&<GiftPanel targetUser={giftTarget} myGold={me?.gold||0} onClose={()=>setGiftTgt(null)} onSent={()=>{setGiftTgt(null)}} socket={sockRef.current} roomId={roomId}/>}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes typingDot{0%,80%,100%{transform:scale(.8);opacity:.5}40%{transform:scale(1.1);opacity:1}}
        @keyframes diceShake{0%,100%{transform:translate(-50%,-50%) rotate(0deg)}25%{transform:translate(-48%,-52%) rotate(-8deg)}75%{transform:translate(-52%,-48%) rotate(8deg)}}
        @keyframes diceBounce{0%{transform:translate(-50%,-50%) scale(1.2)}50%{transform:translate(-50%,-55%) scale(0.95)}100%{transform:translate(-50%,-50%) scale(1)}}
        @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        *{-webkit-tap-highlight-color:transparent}
        input,textarea,select{font-size:16px!important}
      `}</style>
    </div>
  )
}
