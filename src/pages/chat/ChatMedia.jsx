// ============================================================
// ChatMedia.jsx — Media input components: Paint, GIF, YouTube, Emotes
// ============================================================
import { useState, useRef, useEffect } from 'react'
import { API } from './chatConstants.js'

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

// Export all components
export { PaintingCanvas, GifPicker, YTPanel, EmoticonPicker, YTMessage }
