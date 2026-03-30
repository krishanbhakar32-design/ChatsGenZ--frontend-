// ChatMedia.jsx — Paint, GifPicker (YouTube-style), YTPanel, Spotify, Emoticons, YTMessage
import { useState, useRef, useEffect } from 'react'
import { API } from './chatConstants.js'

// ─────────────────────────────────────────────────────────────
// PAINTING CANVAS
// ─────────────────────────────────────────────────────────────
function PaintingCanvas({onSend,onClose}) {
  const canvasRef=useRef(null)
  const [drawing,setDrawing]=useState(false)
  const [tool,setTool]=useState('pen')
  const [color,setColor]=useState('#000000')
  const [size,setSize]=useState(3)
  const [history,setHistory]=useState([])
  const [histIdx,setHistIdx]=useState(-1)
  const lastPt=useRef(null)

  function getCtx(){return canvasRef.current?.getContext('2d')}
  function saveHistory(){
    const ctx=getCtx();if(!ctx||!canvasRef.current) return
    const snap=ctx.getImageData(0,0,canvasRef.current.width,canvasRef.current.height)
    setHistory(p=>{const n=[...p.slice(0,histIdx+1),snap];setHistIdx(n.length-1);return n})
  }
  function undo(){
    if(histIdx<=0){clearCanvas();return}
    const ctx=getCtx();if(!ctx) return
    ctx.putImageData(history[histIdx-1],0,0);setHistIdx(p=>p-1)
  }
  function clearCanvas(){
    const ctx=getCtx();if(!ctx||!canvasRef.current) return
    ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height)
    setHistory([]);setHistIdx(-1)
  }
  function getPos(e){
    const r=canvasRef.current.getBoundingClientRect()
    const t=e.touches?.[0]||e
    return{x:(t.clientX-r.left)*(canvasRef.current.width/r.width),y:(t.clientY-r.top)*(canvasRef.current.height/r.height)}
  }
  function startDraw(e){
    e.preventDefault();setDrawing(true);lastPt.current=getPos(e)
    saveHistory()
    const ctx=getCtx();if(!ctx) return
    ctx.beginPath();ctx.arc(lastPt.current.x,lastPt.current.y,size/2,0,Math.PI*2)
    ctx.fillStyle=tool==='eraser'?'rgba(0,0,0,0)':color;ctx.fill()
  }
  function draw(e){
    e.preventDefault();if(!drawing||!lastPt.current) return
    const ctx=getCtx();if(!ctx) return
    const p=getPos(e)
    ctx.beginPath();ctx.moveTo(lastPt.current.x,lastPt.current.y);ctx.lineTo(p.x,p.y)
    ctx.lineWidth=size;ctx.lineCap='round';ctx.lineJoin='round'
    if(tool==='eraser'){ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='rgba(0,0,0,1)'}
    else{ctx.globalCompositeOperation='source-over';ctx.strokeStyle=color}
    ctx.stroke();lastPt.current=p
  }
  function endDraw(){setDrawing(false);lastPt.current=null}
  function sendDrawing(){
    const c=canvasRef.current;if(!c) return
    const tmp=document.createElement('canvas');tmp.width=c.width;tmp.height=c.height
    const tctx=tmp.getContext('2d');tctx.fillStyle='#fff';tctx.fillRect(0,0,c.width,c.height);tctx.drawImage(c,0,0)
    const dataUrl=tmp.toDataURL('image/png')
    const token=localStorage.getItem('cgz_token')
    fetch(dataUrl).then(r=>r.blob()).then(blob=>{
      const fd=new FormData();fd.append('image',blob,'drawing.png')
      fetch(`${API}/api/upload/image`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd})
        .then(r=>r.json()).then(d=>{if(d.url) onSend(d.url)}).catch(()=>onClose())
    })
  }
  const COLORS=['#000','#fff','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#84cc16','#a16207']
  return(
    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:'calc(100% + 6px)',left:0,right:0,background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,.15)',zIndex:50}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',borderBottom:'1px solid #f3f4f6'}}>
        <span style={{fontWeight:700,fontSize:'0.82rem',color:'#374151'}}>🎨 Paint</span>
        <div style={{display:'flex',gap:4}}>
          <button onClick={undo} style={{background:'none',border:'1px solid #e4e6ea',borderRadius:5,padding:'2px 7px',cursor:'pointer',fontSize:'0.72rem',color:'#6b7280'}}>↩</button>
          <button onClick={clearCanvas} style={{background:'none',border:'1px solid #e4e6ea',borderRadius:5,padding:'2px 7px',cursor:'pointer',fontSize:'0.72rem',color:'#6b7280'}}>Clear</button>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:14,padding:0}}><i className="fi fi-sr-cross-small"/></button>
        </div>
      </div>
      <div style={{padding:'6px 8px',borderBottom:'1px solid #f3f4f6',display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
        {COLORS.map(c=>(<div key={c} onClick={()=>{setColor(c);setTool('pen')}} style={{width:18,height:18,background:c,borderRadius:4,cursor:'pointer',border:`2px solid ${color===c&&tool==='pen'?'#1a73e8':'#e4e6ea'}`,flexShrink:0,boxShadow:c==='#fff'?'inset 0 0 0 1px #e4e6ea':'none'}}/>))}
        <input type="color" value={color} onChange={e=>{setColor(e.target.value);setTool('pen')}} style={{width:22,height:22,padding:0,border:'none',borderRadius:4,cursor:'pointer',flexShrink:0}}/>
        <div style={{height:20,width:1,background:'#e4e6ea',margin:'0 2px'}}/>
        <button onClick={()=>setTool(t=>t==='eraser'?'pen':'eraser')} style={{padding:'2px 8px',border:`1px solid ${tool==='eraser'?'#f97316':'#e4e6ea'}`,borderRadius:5,background:tool==='eraser'?'#fff7ed':'none',cursor:'pointer',fontSize:'0.7rem',color:tool==='eraser'?'#f97316':'#6b7280'}}>✏ Eraser</button>
        <input type="range" min={1} max={20} value={size} onChange={e=>setSize(+e.target.value)} style={{width:60,accentColor:'#1a73e8'}}/>
      </div>
      <canvas ref={canvasRef} width={600} height={300}
        style={{display:'block',width:'100%',height:'min(220px,45vw)',cursor:tool==='eraser'?'cell':'crosshair',touchAction:'none',background:'#fff'}}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
      <div style={{padding:'6px 8px',borderTop:'1px solid #f3f4f6',display:'flex',justifyContent:'flex-end'}}>
        <button onClick={sendDrawing} style={{padding:'7px 18px',background:'linear-gradient(135deg,#1a73e8,#1557b0)',border:'none',borderRadius:8,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.82rem'}}>Send Drawing</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// GIF PICKER — YouTube-style layout
// ─────────────────────────────────────────────────────────────
function GifPicker({onSelect,onClose}) {
  const [q,setQ]=useState('')
  const [gifs,setGifs]=useState([])
  const [loading,setLoading]=useState(false)
  const timer=useRef(null)
  const token=localStorage.getItem('cgz_token')

  useEffect(()=>{
    setLoading(true)
    fetch(`${API}/api/giphy?limit=16`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(d=>setGifs(d.gifs||[])).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  useEffect(()=>{
    clearTimeout(timer.current)
    if(!q.trim()){
      setLoading(true)
      fetch(`${API}/api/giphy?limit=16`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>setGifs(d.gifs||[])).catch(()=>{}).finally(()=>setLoading(false))
      return
    }
    setLoading(true)
    timer.current=setTimeout(()=>{
      fetch(`${API}/api/giphy?q=${encodeURIComponent(q)}&limit=16`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>setGifs(d.gifs||[])).catch(()=>{}).finally(()=>setLoading(false))
    },400)
    return()=>clearTimeout(timer.current)
  },[q])

  return(
    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:'calc(100% + 6px)',left:0,right:0,background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,overflow:'hidden',boxShadow:'0 8px 28px rgba(0,0,0,.18)',zIndex:50,display:'flex',flexDirection:'column',maxHeight:'min(340px,70vh)'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',borderBottom:'1px solid #f3f4f6',flexShrink:0,background:'#fafafa'}}>
        <svg width="18" height="18" viewBox="0 0 24 24"><text y="18" fontSize="18">🎞</text></svg>
        <span style={{fontWeight:800,fontSize:'0.9rem',color:'#111827',fontFamily:'Outfit,sans-serif',flex:1}}>GIF</span>
        <span style={{fontSize:'0.65rem',color:'#9ca3af',fontWeight:600}}>Powered by GIPHY</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:16,padding:0,lineHeight:1}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      {/* Search bar */}
      <div style={{padding:'8px 10px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        <div style={{position:'relative'}}>
          <i className="fi fi-sr-search" style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#9ca3af',pointerEvents:'none'}}/>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search GIFs..."
            style={{width:'100%',padding:'7px 10px 7px 28px',border:'1.5px solid #e4e6ea',borderRadius:20,fontSize:'0.83rem',outline:'none',boxSizing:'border-box',background:'#f9fafb'}}
            onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
        </div>
      </div>
      {/* GIF grid */}
      <div style={{flex:1,overflowY:'auto',padding:6,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4}}>
        {loading&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:16,color:'#9ca3af',fontSize:'0.78rem'}}>Loading GIFs...</div>}
        {!loading&&gifs.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:16,color:'#9ca3af',fontSize:'0.78rem'}}>No GIFs found 😕</div>}
        {gifs.map((g,i)=>(
          <div key={i} onClick={()=>onSelect(g.url)} style={{borderRadius:7,overflow:'hidden',cursor:'pointer',aspectRatio:'1',background:'#f3f4f6',border:'2px solid transparent',transition:'all .12s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#1a73e8';e.currentTarget.style.transform='scale(1.04)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent';e.currentTarget.style.transform='scale(1)'}}>
            <img src={g.preview||g.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// YOUTUBE PANEL — link paste + preview
// ─────────────────────────────────────────────────────────────
function YTPanel({onClose,onSend}) {
  const [link,setLink]=useState('')
  const [preview,setPreview]=useState(null)

  function getVideoId(url){
    const m=(url||'').match(/(?:youtu\.be\/|v=|embed\/|\?v=)([\w-]{11})/)
    return m?m[1]:null
  }
  useEffect(()=>{
    const id=getVideoId(link)
    setPreview(id?{id,thumb:`https://img.youtube.com/vi/${id}/mqdefault.jpg`}:null)
  },[link])

  return(
    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:'calc(100% + 6px)',left:0,right:0,background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,overflow:'hidden',boxShadow:'0 8px 28px rgba(0,0,0,.18)',zIndex:50}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',borderBottom:'1px solid #f3f4f6',background:'#fafafa'}}>
        <span style={{fontSize:16}}>▶</span>
        <span style={{fontWeight:800,fontSize:'0.9rem',color:'#ef4444',fontFamily:'Outfit,sans-serif',flex:1}}>YouTube</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:16,padding:0,lineHeight:1}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      {/* Input */}
      <div style={{padding:'10px 12px',display:'flex',flexDirection:'column',gap:8}}>
        <div style={{position:'relative'}}>
          <i className="fi fi-sr-link" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'#9ca3af',pointerEvents:'none'}}/>
          <input autoFocus value={link} onChange={e=>setLink(e.target.value)} placeholder="Paste YouTube link..."
            style={{width:'100%',padding:'9px 12px 9px 30px',border:'1.5px solid #e4e6ea',borderRadius:9,fontSize:'0.85rem',outline:'none',boxSizing:'border-box'}}
            onFocus={e=>e.target.style.borderColor='#ef4444'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
        </div>
        {link&&!preview&&<p style={{textAlign:'center',color:'#9ca3af',fontSize:'0.78rem',margin:0}}>Paste a valid YouTube link</p>}
        {preview&&(
          <div style={{borderRadius:10,overflow:'hidden',border:'1px solid #e4e6ea',position:'relative'}}>
            <img src={preview.thumb} alt="" style={{width:'100%',display:'block'}}/>
            {/* Play button overlay */}
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.25)'}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:'rgba(239,68,68,.9)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{color:'#fff',fontSize:22,marginLeft:4}}>▶</span>
              </div>
            </div>
            <button onClick={()=>onSend(`https://www.youtube.com/watch?v=${preview.id}`)}
              style={{position:'absolute',bottom:8,right:8,padding:'6px 14px',background:'rgba(239,68,68,.92)',border:'none',borderRadius:7,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.8rem',backdropFilter:'blur(4px)'}}>
              Share in Chat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EMOTICON PICKER
// ─────────────────────────────────────────────────────────────
const EMOT_FILES=['amazing','angel','angry','anxious','bad','bigsmile','blink','cool','crisped','cry','cry2','dead','desperate','devil','doubt','feelgood','funny','good','happy','happy3']
const EMOJI_FALLBACK=['😀','😂','🥰','😍','😎','🥳','😭','😡','🤔','😴','👋','👍','👎','❤️','🔥','✨','🎉','💯','🙏','💪']

function EmoticonPicker({onSelect,onClose}) {
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
            <img src={`/icons/emoticon/${name}.png`} alt={name} style={{width:24,height:24,objectFit:'contain'}} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='block'}}/>
            <span style={{display:'none',fontSize:18}}>{EMOJI_FALLBACK[i]||'😊'}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// YOUTUBE MESSAGE — in chat, play button only (no X), minimize to footer
// ─────────────────────────────────────────────────────────────
function YTMessage({url,onMinimize}) {
  const [expanded,setExpanded]=useState(false)
  const [quality,setQuality]=useState('hd720')
  const id=(url||'').match(/(?:v=|youtu\.be\/|embed\/|\?v=)([\w-]{11})/)?.[1]
  if(!id) return null

  const embedUrl=`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&vq=${quality}`

  if(!expanded) return(
    <div onClick={()=>setExpanded(true)}
      style={{display:'inline-flex',alignItems:'center',gap:8,background:'#111',border:'1px solid #333',borderRadius:9,padding:'6px 10px',maxWidth:240,cursor:'pointer',transition:'all .15s'}}
      onMouseEnter={e=>e.currentTarget.style.background='#1a1a1a'}
      onMouseLeave={e=>e.currentTarget.style.background='#111'}>
      {/* Thumbnail */}
      <div style={{position:'relative',flexShrink:0}}>
        <img src={`https://img.youtube.com/vi/${id}/default.jpg`} alt="" style={{width:52,height:36,objectFit:'cover',borderRadius:5,display:'block'}}/>
        {/* Red play button */}
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(239,68,68,.9)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'#fff',fontSize:9,marginLeft:2}}>▶</span>
          </div>
        </div>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:'0.68rem',color:'#ef4444',fontWeight:700,marginBottom:1}}>YouTube</div>
        <div style={{fontSize:'0.65rem',color:'#9ca3af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Click to play</div>
      </div>
    </div>
  )

  return(
    <div style={{position:'relative',maxWidth:'min(100%,280px)',width:'min(280px,60vw)',borderRadius:10,overflow:'hidden',border:'1px solid #222',background:'#000'}}>
      {/* Controls bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 7px',background:'rgba(0,0,0,.7)',position:'absolute',top:0,left:0,right:0,zIndex:5}}>
        <span style={{fontSize:'0.6rem',color:'#ef4444',fontWeight:700}}>▶ YouTube</span>
        <div style={{display:'flex',gap:4}}>
          {/* Quality selector */}
          <select value={quality} onChange={e=>setQuality(e.target.value)}
            style={{fontSize:'0.6rem',background:'rgba(0,0,0,.7)',border:'1px solid #444',borderRadius:4,color:'#fff',padding:'1px 3px',cursor:'pointer'}}>
            <option value="hd1080">1080p</option>
            <option value="hd720">720p</option>
            <option value="large">480p</option>
            <option value="medium">360p</option>
            <option value="small">240p</option>
          </select>
          {/* Minimize button */}
          <button onClick={()=>{setExpanded(false);onMinimize?.({id,url})}}
            style={{background:'rgba(0,0,0,.7)',border:'none',color:'#fff',borderRadius:'50%',width:17,height:17,cursor:'pointer',fontSize:9,display:'flex',alignItems:'center',justifyContent:'center'}}>
            —
          </button>
        </div>
      </div>
      <iframe width="100%" height="160" src={embedUrl}
        title="YouTube" frameBorder="0" allow="autoplay;encrypted-media;fullscreen" allowFullScreen
        style={{display:'block',height:'min(160px,36vw)',marginTop:0}}/>
    </div>
  )
}

export { PaintingCanvas, GifPicker, YTPanel, EmoticonPicker, YTMessage }
