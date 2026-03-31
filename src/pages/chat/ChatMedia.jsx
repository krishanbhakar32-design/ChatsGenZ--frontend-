// ChatMedia.jsx — Paint, GifPicker, YTPanel, SpotifyPanel, EmoticonPicker, YTMessage
// Mobile-first: bottom-sheet on mobile, fixed popup on desktop (>=600px). No absolute fights.
import { useState, useRef, useEffect } from 'react'
import { API } from './chatConstants.js'

// ─────────────────────────────────────────────────────────────
// SHARED MODAL WRAPPER
// Mobile  → full-width bottom sheet
// Desktop → centered fixed popup, capped at `width`
// ─────────────────────────────────────────────────────────────
function MediaModal({ onClose, children, width = 520 }) {
  const isDesktop = window.innerWidth >= 600
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:900,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(3px)' }} />
      <div onClick={e=>e.stopPropagation()} style={{
        position:'fixed', zIndex:901,
        left:0, right:0, bottom:0,
        maxWidth: isDesktop ? width : '100%',
        margin: '0 auto',
        borderRadius: isDesktop ? 16 : '18px 18px 0 0',
        background:'#fff',
        boxShadow: isDesktop ? '0 8px 40px rgba(0,0,0,0.28)' : '0 -4px 32px rgba(0,0,0,0.22)',
        display:'flex', flexDirection:'column',
        maxHeight: isDesktop ? '82dvh' : '92dvh',
        overflow:'hidden',
        ...(isDesktop ? { bottom:70 } : {}),
      }}>
        {children}
      </div>
    </>
  )
}

function ModalHeader({ icon, title, subtitle, onClose, dark=false }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'13px 14px',
      borderBottom:`1px solid ${dark?'#1e1e38':'#f0f0f0'}`,
      background:dark?'#0f0f1e':'#fafafa', flexShrink:0 }}>
      {icon && <span style={{fontSize:20,flexShrink:0}}>{icon}</span>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:'0.9rem',fontWeight:800,color:dark?'#fff':'#111827',fontFamily:'Nunito,sans-serif',lineHeight:1.2}}>{title}</div>
        {subtitle && <div style={{fontSize:'0.68rem',color:dark?'rgba(255,255,255,0.45)':'#6b7280',marginTop:1}}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:dark?'rgba(255,255,255,0.5)':'#9ca3af',fontSize:22,lineHeight:1,padding:'2px 4px',flexShrink:0}}>✕</button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAINTING CANVAS
// ─────────────────────────────────────────────────────────────
function PaintingCanvas({ onSend, onClose }) {
  const canvasRef=useRef(null)
  const [drawing,setDrawing]=useState(false)
  const [tool,setTool]=useState('pen')
  const [color,setColor]=useState('#000000')
  const [size,setSize]=useState(4)
  const [history,setHistory]=useState([])
  const [histIdx,setHistIdx]=useState(-1)
  const lastPt=useRef(null)

  function getCtx(){return canvasRef.current?.getContext('2d')}
  function saveHistory(){
    const ctx=getCtx();if(!ctx||!canvasRef.current)return
    const snap=ctx.getImageData(0,0,canvasRef.current.width,canvasRef.current.height)
    setHistory(p=>{const n=[...p.slice(0,histIdx+1),snap];setHistIdx(n.length-1);return n})
  }
  function undo(){
    if(histIdx<=0){clearCanvas();return}
    const ctx=getCtx();if(!ctx)return
    ctx.putImageData(history[histIdx-1],0,0);setHistIdx(p=>p-1)
  }
  function clearCanvas(){
    const ctx=getCtx();if(!ctx||!canvasRef.current)return
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
    const ctx=getCtx();if(!ctx)return
    ctx.beginPath();ctx.arc(lastPt.current.x,lastPt.current.y,size/2,0,Math.PI*2)
    ctx.fillStyle=tool==='eraser'?'rgba(0,0,0,0)':color;ctx.fill()
  }
  function draw(e){
    e.preventDefault();if(!drawing||!lastPt.current)return
    const ctx=getCtx();if(!ctx)return
    const p=getPos(e)
    ctx.beginPath();ctx.moveTo(lastPt.current.x,lastPt.current.y);ctx.lineTo(p.x,p.y)
    ctx.lineWidth=size;ctx.lineCap='round';ctx.lineJoin='round'
    if(tool==='eraser'){ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='rgba(0,0,0,1)'}
    else{ctx.globalCompositeOperation='source-over';ctx.strokeStyle=color}
    ctx.stroke();lastPt.current=p
  }
  function endDraw(){setDrawing(false);lastPt.current=null}
  function sendDrawing(){
    const c=canvasRef.current;if(!c)return
    const tmp=document.createElement('canvas');tmp.width=c.width;tmp.height=c.height
    const tctx=tmp.getContext('2d');tctx.fillStyle='#fff';tctx.fillRect(0,0,c.width,c.height);tctx.drawImage(c,0,0)
    const dataUrl=tmp.toDataURL('image/png')
    const token=localStorage.getItem('cgz_token')
    fetch(dataUrl).then(r=>r.blob()).then(blob=>{
      const fd=new FormData();fd.append('image',blob,'drawing.png')
      fetch(`${API}/api/upload/image`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd})
        .then(r=>r.json()).then(d=>{if(d.url)onSend(d.url)}).catch(()=>onClose())
    })
  }

  const COLORS=['#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#84cc16','#a16207','#6b7280','#1e293b','#fbbf24','#34d399']

  return(
    <MediaModal onClose={onClose} width={560}>
      <ModalHeader icon="🎨" title="Paint" subtitle="Draw and send to chat" onClose={onClose}/>
      {/* Toolbar */}
      <div style={{padding:'8px 12px',borderBottom:'1px solid #f0f0f0',display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',background:'#fafafa',flexShrink:0}}>
        <div style={{display:'flex',gap:4,flexWrap:'wrap',flex:1}}>
          {COLORS.map(c=>(
            <div key={c} onClick={()=>{setColor(c);setTool('pen')}} style={{
              width:22,height:22,background:c,borderRadius:5,cursor:'pointer',flexShrink:0,
              border:`2px solid ${color===c&&tool==='pen'?'#1a73e8':'#e4e6ea'}`,
              boxShadow:c==='#ffffff'?'inset 0 0 0 1px #e4e6ea':'none',
              transform:color===c&&tool==='pen'?'scale(1.2)':'scale(1)',transition:'transform 0.1s',
            }}/>
          ))}
          <input type="color" value={color} onChange={e=>{setColor(e.target.value);setTool('pen')}}
            style={{width:22,height:22,padding:0,border:'none',borderRadius:5,cursor:'pointer',flexShrink:0}}/>
        </div>
        <div style={{width:1,height:24,background:'#e4e6ea',flexShrink:0}}/>
        <button onClick={()=>setTool(t=>t==='eraser'?'pen':'eraser')}
          style={{padding:'4px 10px',border:`1.5px solid ${tool==='eraser'?'#f97316':'#e4e6ea'}`,borderRadius:7,
            background:tool==='eraser'?'#fff7ed':'#fff',cursor:'pointer',fontSize:'0.72rem',fontWeight:700,
            color:tool==='eraser'?'#f97316':'#6b7280',whiteSpace:'nowrap'}}>
          {tool==='eraser'?'✏️ Pen':'⬜ Eraser'}
        </button>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{fontSize:'0.68rem',color:'#6b7280',whiteSpace:'nowrap'}}>Size {size}</span>
          <input type="range" min={1} max={24} value={size} onChange={e=>setSize(+e.target.value)} style={{width:60,accentColor:'#1a73e8'}}/>
        </div>
        <button onClick={undo} style={{padding:'4px 10px',border:'1.5px solid #e4e6ea',borderRadius:7,background:'#fff',cursor:'pointer',fontSize:'0.72rem',fontWeight:700,color:'#6b7280'}}>↩ Undo</button>
        <button onClick={clearCanvas} style={{padding:'4px 10px',border:'1.5px solid #e4e6ea',borderRadius:7,background:'#fff',cursor:'pointer',fontSize:'0.72rem',fontWeight:700,color:'#6b7280'}}>🗑 Clear</button>
      </div>
      {/* Canvas */}
      <div style={{flex:1,overflow:'hidden',background:'#fff',minHeight:220}}>
        <canvas ref={canvasRef} width={600} height={420}
          style={{display:'block',width:'100%',height:'100%',cursor:tool==='eraser'?'cell':'crosshair',touchAction:'none'}}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
      </div>
      {/* Footer */}
      <div style={{padding:'10px 12px',borderTop:'1px solid #f0f0f0',background:'#fafafa',flexShrink:0,display:'flex',justifyContent:'flex-end',gap:8}}>
        <button onClick={onClose} style={{padding:'8px 18px',borderRadius:8,border:'1.5px solid #e4e6ea',background:'#fff',cursor:'pointer',fontSize:'0.83rem',fontWeight:600,color:'#6b7280'}}>Cancel</button>
        <button onClick={sendDrawing} style={{padding:'8px 22px',background:'linear-gradient(135deg,#1a73e8,#1557b0)',border:'none',borderRadius:8,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.85rem',boxShadow:'0 2px 8px rgba(26,115,232,.35)'}}>
          📤 Send Drawing
        </button>
      </div>
    </MediaModal>
  )
}

// ─────────────────────────────────────────────────────────────
// GIF PICKER
// ─────────────────────────────────────────────────────────────
function GifPicker({ onSelect, onClose }) {
  const [q,setQ]=useState('')
  const [gifs,setGifs]=useState([])
  const [loading,setLoading]=useState(false)
  const timer=useRef(null)
  const token=localStorage.getItem('cgz_token')

  function fetchGifs(query=''){
    setLoading(true)
    const url=query.trim()
      ?`${API}/api/giphy?q=${encodeURIComponent(query)}&limit=24`
      :`${API}/api/giphy?limit=24`
    fetch(url,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(d=>setGifs(d.gifs||[])).catch(()=>{}).finally(()=>setLoading(false))
  }

  useEffect(()=>{fetchGifs()},[])
  useEffect(()=>{
    clearTimeout(timer.current)
    timer.current=setTimeout(()=>fetchGifs(q),q?400:0)
    return()=>clearTimeout(timer.current)
  },[q])

  return(
    <MediaModal onClose={onClose} width={480}>
      <ModalHeader icon="🎞️" title="GIF" subtitle="Powered by GIPHY" onClose={onClose}/>
      <div style={{padding:'10px 12px',borderBottom:'1px solid #f0f0f0',flexShrink:0}}>
        <div style={{position:'relative'}}>
          <i className="fi fi-sr-search" style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'#9ca3af',pointerEvents:'none'}}/>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search GIFs..."
            style={{width:'100%',padding:'9px 12px 9px 32px',border:'1.5px solid #e4e6ea',borderRadius:22,fontSize:'0.86rem',outline:'none',boxSizing:'border-box',background:'#f9fafb',fontFamily:'Nunito,sans-serif'}}
            onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:8,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:5,minHeight:180}}>
        {loading&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:'32px 0',color:'#9ca3af',fontSize:'0.82rem'}}>
          <div style={{width:24,height:24,border:'2.5px solid #e4e6ea',borderTop:'2.5px solid #1a73e8',borderRadius:'50%',animation:'cgzSpin .7s linear infinite',margin:'0 auto 10px'}}/>
          Loading GIFs...
        </div>}
        {!loading&&gifs.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:'32px 0',color:'#9ca3af',fontSize:'0.82rem'}}>No GIFs found 😕</div>}
        {gifs.map((g,i)=>(
          <div key={i} onClick={()=>onSelect(g.url)}
            style={{borderRadius:8,overflow:'hidden',cursor:'pointer',aspectRatio:'1',background:'#f3f4f6',border:'2px solid transparent',transition:'all .12s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#1a73e8';e.currentTarget.style.transform='scale(1.04)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent';e.currentTarget.style.transform='scale(1)'}}>
            <img src={g.preview||g.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} loading="lazy"/>
          </div>
        ))}
      </div>
      <style>{`@keyframes cgzSpin{to{transform:rotate(360deg)}}`}</style>
    </MediaModal>
  )
}

// ─────────────────────────────────────────────────────────────
// YOUTUBE PANEL
// ─────────────────────────────────────────────────────────────
function YTPanel({ onClose, onSend }) {
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
    <MediaModal onClose={onClose} width={460}>
      <ModalHeader icon="▶️" title="YouTube" subtitle="Paste a link to share a video in chat" onClose={onClose}/>
      <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{position:'relative'}}>
          <i className="fi fi-sr-link" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'#9ca3af',pointerEvents:'none'}}/>
          <input autoFocus value={link} onChange={e=>setLink(e.target.value)} placeholder="Paste YouTube link..."
            style={{width:'100%',padding:'11px 12px 11px 34px',border:'1.5px solid #e4e6ea',borderRadius:10,fontSize:'0.88rem',outline:'none',boxSizing:'border-box',fontFamily:'Nunito,sans-serif'}}
            onFocus={e=>e.target.style.borderColor='#ef4444'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
        </div>
        {link&&!preview&&<p style={{textAlign:'center',color:'#9ca3af',fontSize:'0.78rem',margin:0}}>Paste a valid YouTube link to preview</p>}
        {preview&&(
          <div style={{borderRadius:12,overflow:'hidden',border:'1px solid #e4e6ea',position:'relative',background:'#000'}}>
            <img src={preview.thumb} alt="" style={{width:'100%',display:'block'}}/>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.28)'}}>
              <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(239,68,68,0.92)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(239,68,68,.5)'}}>
                <span style={{color:'#fff',fontSize:24,marginLeft:5}}>▶</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{padding:'0 14px 14px',flexShrink:0,display:'flex',gap:8}}>
        <button onClick={onClose} style={{flex:1,padding:'10px',borderRadius:9,border:'1.5px solid #e4e6ea',background:'#fff',cursor:'pointer',fontSize:'0.85rem',fontWeight:600,color:'#6b7280'}}>Cancel</button>
        <button onClick={()=>preview&&onSend(`https://www.youtube.com/watch?v=${preview.id}`)} disabled={!preview}
          style={{flex:2,padding:'10px',borderRadius:9,border:'none',background:preview?'linear-gradient(135deg,#ef4444,#dc2626)':'#f3f4f6',color:preview?'#fff':'#9ca3af',fontWeight:700,cursor:preview?'pointer':'not-allowed',fontSize:'0.88rem',boxShadow:preview?'0 2px 10px rgba(239,68,68,.3)':'none',transition:'all .15s'}}>
          {preview?'▶ Share in Chat':'Paste a link first'}
        </button>
      </div>
    </MediaModal>
  )
}

// ─────────────────────────────────────────────────────────────
// SPOTIFY PANEL (exported so ChatRoom can use it too)
// ─────────────────────────────────────────────────────────────
function SpotifyPanel({ onClose, onSend }) {
  const [input,setInput]=useState('')
  const [embedId,setEmbedId]=useState(null)
  const [embedType,setEmbedType]=useState(null)
  const [error,setError]=useState('')

  function parseSpotifyUrl(raw){
    try{
      const url=raw.trim()
      const wm=url.match(/open\.spotify\.com\/(track|playlist|album|artist)\/([A-Za-z0-9]+)/)
      if(wm)return{type:wm[1],id:wm[2]}
      const um=url.match(/spotify:(track|playlist|album|artist):([A-Za-z0-9]+)/)
      if(um)return{type:um[1],id:um[2]}
    }catch{}
    return null
  }
  function handlePreview(){
    setError('')
    const p=parseSpotifyUrl(input)
    if(!p){setError('Paste a valid Spotify link (song, playlist, album or artist)');return}
    setEmbedId(p.id);setEmbedType(p.type)
  }
  function handleSend(){if(embedId)onSend(`https://open.spotify.com/${embedType}/${embedId}`)}

  const embedUrl=embedId?`https://open.spotify.com/embed/${embedType}/${embedId}?utm_source=generator&theme=0`:null
  const embedH=embedType==='track'?152:352

  return(
    <MediaModal onClose={onClose} width={480}>
      {/* Spotify dark header */}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'13px 14px',borderBottom:'1px solid #1a1a1a',background:'#121212',flexShrink:0}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#1DB954">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 1 1-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 0 1 .207.857zm1.223-2.722a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.973-.52.779.779 0 0 1 .52-.972c3.633-1.102 8.147-.568 11.234 1.329a.78.78 0 0 1 .256 1.072zm.105-2.835C14.69 8.95 9.375 8.775 6.297 9.71a.937.937 0 1 1-.543-1.795c3.528-1.068 9.393-.861 13.098 1.332a.937.937 0 0 1-.938 1.62z"/>
        </svg>
        <div style={{flex:1}}>
          <div style={{fontSize:'0.9rem',fontWeight:800,color:'#fff',fontFamily:'Nunito,sans-serif'}}>Share Spotify</div>
          <div style={{fontSize:'0.67rem',color:'#1DB954'}}>song · playlist · album · artist</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:22,lineHeight:1,padding:'2px 4px'}}>✕</button>
      </div>
      <div style={{background:'#121212',flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'flex',gap:8}}>
          <input autoFocus value={input} onChange={e=>{setInput(e.target.value);setError('');setEmbedId(null)}}
            onKeyDown={e=>e.key==='Enter'&&handlePreview()} placeholder="Paste Spotify link..."
            style={{flex:1,padding:'10px 13px',borderRadius:9,border:`1.5px solid ${error?'#ef4444':'#1DB95455'}`,background:'#1e1e1e',color:'#fff',fontSize:'0.85rem',outline:'none',fontFamily:'Nunito,sans-serif'}}
            onFocus={e=>e.target.style.borderColor='#1DB954'} onBlur={e=>e.target.style.borderColor=error?'#ef4444':'#1DB95455'}/>
          <button onClick={handlePreview}
            style={{padding:'10px 16px',borderRadius:9,border:'none',background:'#1DB954',color:'#000',fontWeight:700,fontSize:'0.82rem',cursor:'pointer',whiteSpace:'nowrap',fontFamily:'Nunito,sans-serif'}}>
            Preview
          </button>
        </div>
        {error&&<div style={{fontSize:'0.75rem',color:'#f87171',padding:'4px 8px',background:'rgba(239,68,68,.12)',borderRadius:6}}>{error}</div>}
        {embedUrl&&(
          <div style={{borderRadius:10,overflow:'hidden'}}>
            <iframe src={embedUrl} width="100%" height={embedH} frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy" style={{display:'block',borderRadius:10}}/>
          </div>
        )}
        {embedId&&(
          <button onClick={handleSend}
            style={{width:'100%',padding:'11px',borderRadius:9,border:'none',background:'linear-gradient(135deg,#1DB954,#17a349)',color:'#000',fontWeight:800,fontSize:'0.88rem',cursor:'pointer',fontFamily:'Nunito,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            <i className="fi fi-sr-paper-plane-top" style={{fontSize:15}}/> Share in chat
          </button>
        )}
      </div>
    </MediaModal>
  )
}

// ─────────────────────────────────────────────────────────────
// EMOTICON PICKER
// ─────────────────────────────────────────────────────────────
const EMOT_FILES=['amazing','angel','angry','anxious','bad','bigsmile','blink','cool','crisped','cry','cry2','dead','desperate','devil','doubt','feelgood','funny','good','happy','happy3']
const EMOJI_FALLBACK=['😀','😂','🥰','😍','😎','🥳','😭','😡','🤔','😴','👋','👍','👎','❤️','🔥','✨','🎉','💯','🙏','💪']

function EmoticonPicker({ onSelect, onClose }) {
  return(
    <MediaModal onClose={onClose} width={320}>
      <ModalHeader icon="😊" title="Emoticons" onClose={onClose}/>
      <div style={{padding:10,display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:4,overflowY:'auto',maxHeight:280}}>
        {EMOT_FILES.map((name,i)=>(
          <button key={i} onClick={()=>onSelect(`:${name}:`)}
            style={{background:'none',border:'none',cursor:'pointer',padding:'6px',borderRadius:8,lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center',transition:'background .1s'}}
            onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
            onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <img src={`/icons/emoticon/${name}.png`} alt={name} style={{width:32,height:32,objectFit:'contain'}}
              onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='block'}}/>
            <span style={{display:'none',fontSize:24}}>{EMOJI_FALLBACK[i]||'😊'}</span>
          </button>
        ))}
      </div>
    </MediaModal>
  )
}

// ─────────────────────────────────────────────────────────────
// YOUTUBE MESSAGE — inline in chat
// ─────────────────────────────────────────────────────────────
function YTMessage({ url, onMinimize }) {
  const [expanded,setExpanded]=useState(false)
  const [quality,setQuality]=useState('hd720')
  const id=(url||'').match(/(?:v=|youtu\.be\/|embed\/|\?v=)([\w-]{11})/)?.[1]
  if(!id)return null

  const embedUrl=`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&vq=${quality}`

  if(!expanded)return(
    <div onClick={()=>setExpanded(true)}
      style={{display:'inline-flex',alignItems:'center',gap:9,background:'#111',border:'1px solid #2a2a2a',borderRadius:10,padding:'7px 11px',maxWidth:240,cursor:'pointer',transition:'background .15s'}}
      onMouseEnter={e=>e.currentTarget.style.background='#1a1a1a'}
      onMouseLeave={e=>e.currentTarget.style.background='#111'}>
      <div style={{position:'relative',flexShrink:0}}>
        <img src={`https://img.youtube.com/vi/${id}/default.jpg`} alt="" style={{width:54,height:38,objectFit:'cover',borderRadius:6,display:'block'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(239,68,68,.92)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'#fff',fontSize:9,marginLeft:2}}>▶</span>
          </div>
        </div>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:'0.7rem',color:'#ef4444',fontWeight:700,marginBottom:2}}>YouTube</div>
        <div style={{fontSize:'0.65rem',color:'#9ca3af'}}>Tap to play</div>
      </div>
    </div>
  )

  return(
    <div style={{position:'relative',maxWidth:'min(100%,320px)',width:'min(320px,70vw)',borderRadius:10,overflow:'hidden',border:'1px solid #222',background:'#000'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 8px',background:'rgba(0,0,0,0.85)',position:'absolute',top:0,left:0,right:0,zIndex:5}}>
        <span style={{fontSize:'0.6rem',color:'#ef4444',fontWeight:700}}>▶ YouTube</span>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <select value={quality} onChange={e=>setQuality(e.target.value)}
            style={{fontSize:'0.6rem',background:'rgba(0,0,0,.7)',border:'1px solid #444',borderRadius:4,color:'#fff',padding:'1px 3px',cursor:'pointer'}}>
            <option value="hd1080">1080p</option>
            <option value="hd720">720p</option>
            <option value="large">480p</option>
            <option value="medium">360p</option>
            <option value="small">240p</option>
          </select>
          <button onClick={()=>{setExpanded(false);onMinimize?.({id,url})}}
            style={{background:'rgba(0,0,0,.7)',border:'none',color:'#fff',borderRadius:'50%',width:18,height:18,cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
            —
          </button>
        </div>
      </div>
      <iframe width="100%" height="180" src={embedUrl}
        title="YouTube" frameBorder="0" allow="autoplay;encrypted-media;fullscreen" allowFullScreen
        style={{display:'block',height:'min(180px,40vw)',marginTop:0}}/>
    </div>
  )
}

export { PaintingCanvas, GifPicker, YTPanel, SpotifyPanel, EmoticonPicker, YTMessage }
