\// ChatMedia.jsx — ChatsGenZ v5
// NO backdrop blur/darken. All panels open above input bar (and the + window).
// Spotify: full iframe embed (plays full song). YouTube: iframe embed directly.
// EmoticonPicker: reads from /icons/emoticons with category tabs.
import { useState, useRef, useEffect } from 'react'
import { API } from './chatConstants.js'

// ─── SHARED: floating panel anchored just above the input bar ───
function FloatPanel({ onClose, children, width = 500, dark = false }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: 54,
        left: '50%',
        transform: 'translateX(-50%)',
        width: `min(${width}px, 98vw)`,
        maxHeight: '72dvh',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        background: dark ? '#111118' : '#fff',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.55)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

function PanelHeader({ icon, title, subtitle, onClose, dark = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px',
      borderBottom: `1px solid ${dark ? '#1e1e38' : '#f0f0f0'}`,
      background: dark ? '#0d0d1a' : '#fafafa',
      flexShrink: 0,
    }}>
      {icon && <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: dark ? '#fff' : '#111', lineHeight: 1.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.66rem', color: dark ? 'rgba(255,255,255,0.4)' : '#6b7280', marginTop: 1 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? 'rgba(255,255,255,0.45)' : '#9ca3af', fontSize: 20, lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}>✕</button>
    </div>
  )
}

// ─── PAINTING CANVAS ──────────────────────────────────────────
function PaintingCanvas({ onSend, onClose }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#000000')
  const [size, setSize] = useState(4)
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const lastPt = useRef(null)

  function getCtx() { return canvasRef.current?.getContext('2d') }
  function saveHistory() {
    const ctx = getCtx(); if (!ctx || !canvasRef.current) return
    const snap = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
    setHistory(p => { const n = [...p.slice(0, histIdx + 1), snap]; setHistIdx(n.length - 1); return n })
  }
  function undo() {
    if (histIdx <= 0) { clearCanvas(); return }
    const ctx = getCtx(); if (!ctx) return
    ctx.putImageData(history[histIdx - 1], 0, 0); setHistIdx(p => p - 1)
  }
  function clearCanvas() {
    const ctx = getCtx(); if (!ctx || !canvasRef.current) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setHistory([]); setHistIdx(-1)
  }
  function getPos(e) {
    const r = canvasRef.current.getBoundingClientRect()
    const t = e.touches?.[0] || e
    return { x: (t.clientX - r.left) * (canvasRef.current.width / r.width), y: (t.clientY - r.top) * (canvasRef.current.height / r.height) }
  }
  function startDraw(e) {
    e.preventDefault(); setDrawing(true); lastPt.current = getPos(e)
    saveHistory()
    const ctx = getCtx(); if (!ctx) return
    ctx.beginPath(); ctx.arc(lastPt.current.x, lastPt.current.y, size / 2, 0, Math.PI * 2)
    ctx.fillStyle = tool === 'eraser' ? 'rgba(0,0,0,0)' : color; ctx.fill()
  }
  function draw(e) {
    e.preventDefault(); if (!drawing || !lastPt.current) return
    const ctx = getCtx(); if (!ctx) return
    const p = getPos(e)
    ctx.beginPath(); ctx.moveTo(lastPt.current.x, lastPt.current.y); ctx.lineTo(p.x, p.y)
    ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    if (tool === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.strokeStyle = 'rgba(0,0,0,1)' }
    else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = color }
    ctx.stroke(); lastPt.current = p
  }
  function endDraw() { setDrawing(false); lastPt.current = null }
  function sendDrawing() {
    const c = canvasRef.current; if (!c) return
    const tmp = document.createElement('canvas'); tmp.width = c.width; tmp.height = c.height
    const tctx = tmp.getContext('2d'); tctx.fillStyle = '#fff'; tctx.fillRect(0, 0, c.width, c.height); tctx.drawImage(c, 0, 0)
    const dataUrl = tmp.toDataURL('image/png')
    const token = localStorage.getItem('cgz_token')
    fetch(dataUrl).then(r => r.blob()).then(blob => {
      const fd = new FormData(); fd.append('image', blob, 'drawing.png')
      fetch(`${API}/api/upload/image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
        .then(r => r.json()).then(d => { if (d.url) onSend(d.url) }).catch(() => onClose())
    })
  }

  const COLORS = ['#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#84cc16','#a16207','#6b7280','#1e293b','#fbbf24','#34d399']

  return (
    <FloatPanel onClose={onClose} width={560}>
      <PanelHeader icon="🎨" title="Paint" subtitle="Draw and send to chat" onClose={onClose} />
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', background: '#fafafa', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
          {COLORS.map(c => (
            <div key={c} onClick={() => { setColor(c); setTool('pen') }} style={{ width: 22, height: 22, background: c, borderRadius: 5, cursor: 'pointer', flexShrink: 0, border: `2px solid ${color === c && tool === 'pen' ? '#1a73e8' : '#e4e6ea'}`, boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #e4e6ea' : 'none', transform: color === c && tool === 'pen' ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.1s' }} />
          ))}
          <input type="color" value={color} onChange={e => { setColor(e.target.value); setTool('pen') }} style={{ width: 22, height: 22, padding: 0, border: 'none', borderRadius: 5, cursor: 'pointer', flexShrink: 0 }} />
        </div>
        <div style={{ width: 1, height: 24, background: '#e4e6ea', flexShrink: 0 }} />
        <button onClick={() => setTool(t => t === 'eraser' ? 'pen' : 'eraser')} style={{ padding: '4px 10px', border: `1.5px solid ${tool === 'eraser' ? '#f97316' : '#e4e6ea'}`, borderRadius: 7, background: tool === 'eraser' ? '#fff7ed' : '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: tool === 'eraser' ? '#f97316' : '#6b7280', whiteSpace: 'nowrap' }}>
          {tool === 'eraser' ? '✏️ Pen' : '⬜ Eraser'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.68rem', color: '#6b7280', whiteSpace: 'nowrap' }}>Size {size}</span>
          <input type="range" min={1} max={24} value={size} onChange={e => setSize(+e.target.value)} style={{ width: 60, accentColor: '#1a73e8' }} />
        </div>
        <button onClick={undo} style={{ padding: '4px 10px', border: '1.5px solid #e4e6ea', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280' }}>↩ Undo</button>
        <button onClick={clearCanvas} style={{ padding: '4px 10px', border: '1.5px solid #e4e6ea', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280' }}>🗑 Clear</button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', background: '#fff', minHeight: 200 }}>
        <canvas ref={canvasRef} width={600} height={400}
          style={{ display: 'block', width: '100%', height: '100%', cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
      </div>
      <div style={{ padding: '10px 12px', borderTop: '1px solid #f0f0f0', background: '#fafafa', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e4e6ea', background: '#fff', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600, color: '#6b7280' }}>Cancel</button>
        <button onClick={sendDrawing} style={{ padding: '8px 22px', background: 'linear-gradient(135deg,#1a73e8,#1557b0)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>📤 Send Drawing</button>
      </div>
    </FloatPanel>
  )
}

// ─── GIF PICKER ───────────────────────────────────────────────
function GifPicker({ onSelect, onClose }) {
  const [q, setQ] = useState('')
  const [gifs, setGifs] = useState([])
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)
  const token = localStorage.getItem('cgz_token')

  function fetchGifs(query = '') {
    setLoading(true)
    const url = query.trim() ? `${API}/api/giphy?q=${encodeURIComponent(query)}&limit=24` : `${API}/api/giphy?limit=24`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setGifs(d.gifs || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchGifs() }, [])
  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fetchGifs(q), q ? 400 : 0)
    return () => clearTimeout(timer.current)
  }, [q])

  return (
    <FloatPanel onClose={onClose} width={480}>
      <PanelHeader icon="🎞️" title="GIF" subtitle="Powered by GIPHY" onClose={onClose} />
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af', pointerEvents: 'none' }} />
          <input dir="ltr" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search GIFs..."
            style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1.5px solid #e4e6ea', borderRadius: 22, fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box', background: '#f9fafb', fontFamily: 'Nunito,sans-serif', direction: 'ltr', textAlign: 'left' }}
            onFocus={e => e.target.style.borderColor = '#1a73e8'} onBlur={e => e.target.style.borderColor = '#e4e6ea'} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, minHeight: 150 }}>
        {loading && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: '0.82rem' }}>
          <div style={{ width: 24, height: 24, border: '2.5px solid #e4e6ea', borderTop: '2.5px solid #1a73e8', borderRadius: '50%', animation: 'cgzSpin .7s linear infinite', margin: '0 auto 10px' }} />Loading GIFs...
        </div>}
        {!loading && gifs.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: '0.82rem' }}>No GIFs found 😕</div>}
        {gifs.map((g, i) => (
          <div key={i} onClick={() => onSelect(g.url)}
            style={{ borderRadius: 8, overflow: 'hidden', cursor: 'pointer', aspectRatio: '1', background: '#f3f4f6', border: '2px solid transparent', transition: 'all .12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a73e8'; e.currentTarget.style.transform = 'scale(1.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}>
            <img src={g.preview || g.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
          </div>
        ))}
      </div>
      <style>{`@keyframes cgzSpin{to{transform:rotate(360deg)}}`}</style>
    </FloatPanel>
  )
}

// ─── YOUTUBE PANEL ────────────────────────────────────────────
function YTPanel({ onClose, onSend }) {
  const [link, setLink] = useState('')
  const [videoId, setVideoId] = useState(null)

  function getVideoId(url) {
    const m = (url || '').match(/(?:youtu\.be\/|v=|embed\/|\?v=)([\w-]{11})/)
    return m ? m[1] : null
  }
  useEffect(() => { setVideoId(getVideoId(link) || null) }, [link])

  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : null

  return (
    <FloatPanel onClose={onClose} width={480} dark>
      <PanelHeader icon="▶️" title="YouTube" subtitle="Paste a link to share a video" onClose={onClose} dark />
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto', background: '#111118' }}>
        <div style={{ position: 'relative' }}>
          <i className="fa-solid fa-link" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af', pointerEvents: 'none' }} />
          <input dir="ltr" autoFocus value={link} onChange={e => setLink(e.target.value)} placeholder="Paste YouTube link..."
            style={{ width: '100%', padding: '11px 12px 11px 34px', border: '1.5px solid #2a2a3a', borderRadius: 10, fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Nunito,sans-serif', direction: 'ltr', textAlign: 'left', background: '#1a1a2e', color: '#fff' }}
            onFocus={e => e.target.style.borderColor = '#ef4444'} onBlur={e => e.target.style.borderColor = '#2a2a3a'} />
        </div>
        {link && !videoId && <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.78rem', margin: 0 }}>Paste a valid YouTube link to preview</p>}
        {embedUrl && (
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #2a2a3a' }}>
            <iframe width="100%" height="220" src={embedUrl} title="YouTube Preview" frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
              style={{ display: 'block' }} />
          </div>
        )}
      </div>
      <div style={{ padding: '0 14px 14px', flexShrink: 0, display: 'flex', gap: 8, background: '#111118' }}>
        <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1.5px solid #2a2a3a', background: '#1a1a2e', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#9ca3af' }}>Cancel</button>
        <button onClick={() => videoId && onSend(`https://www.youtube.com/watch?v=${videoId}`)} disabled={!videoId}
          style={{ flex: 2, padding: '10px', borderRadius: 9, border: 'none', background: videoId ? 'linear-gradient(135deg,#ef4444,#dc2626)' : '#1a1a2e', color: videoId ? '#fff' : '#555', fontWeight: 700, cursor: videoId ? 'pointer' : 'not-allowed', fontSize: '0.88rem', transition: 'all .15s' }}>
          {videoId ? '▶ Share in Chat' : 'Paste a link first'}
        </button>
      </div>
    </FloatPanel>
  )
}

// ─── SPOTIFY PANEL ────────────────────────────────────────────
function SpotifyPanel({ onClose, onSend }) {
  const [input, setInput] = useState('')
  const [embedId, setEmbedId] = useState(null)
  const [embedType, setEmbedType] = useState(null)
  const [error, setError] = useState('')

  function parseSpotifyUrl(raw) {
    try {
      const url = raw.trim()
      const wm = url.match(/open\.spotify\.com\/(track|playlist|album|artist)\/([A-Za-z0-9]+)/)
      if (wm) return { type: wm[1], id: wm[2] }
      const um = url.match(/spotify:(track|playlist|album|artist):([A-Za-z0-9]+)/)
      if (um) return { type: um[1], id: um[2] }
    } catch {}
    return null
  }
  function handlePreview() {
    setError('')
    const p = parseSpotifyUrl(input)
    if (!p) { setError('Paste a valid Spotify link (song, playlist, album or artist)'); return }
    setEmbedId(p.id); setEmbedType(p.type)
  }
  function handleSend() { if (embedId) onSend(`https://open.spotify.com/${embedType}/${embedId}`) }

  const embedUrl = embedId ? `https://open.spotify.com/embed/${embedType}/${embedId}?utm_source=generator&theme=0` : null
  const embedH = embedType === 'track' ? 152 : 352

  return (
    <FloatPanel onClose={onClose} width={480} dark>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid #1a1a2e', background: '#0d1a0e', flexShrink: 0 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#1DB954">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 1 1-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 0 1 .207.857zm1.223-2.722a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.973-.52.779.779 0 0 1 .52-.972c3.633-1.102 8.147-.568 11.234 1.329a.78.78 0 0 1 .256 1.072zm.105-2.835C14.69 8.95 9.375 8.775 6.297 9.71a.937.937 0 1 1-.543-1.795c3.528-1.068 9.393-.861 13.098 1.332a.937.937 0 0 1-.938 1.62z"/>
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>Share Spotify</div>
          <div style={{ fontSize: '0.67rem', color: '#1DB954' }}>song · playlist · album · artist</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: 20, lineHeight: 1, padding: '2px 4px' }}>✕</button>
      </div>
      <div style={{ background: '#111118', flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input dir="ltr" autoFocus value={input} onChange={e => { setInput(e.target.value); setError(''); setEmbedId(null) }}
            onKeyDown={e => e.key === 'Enter' && handlePreview()} placeholder="Paste Spotify link..."
            style={{ flex: 1, padding: '10px 13px', borderRadius: 9, border: `1.5px solid ${error ? '#ef4444' : '#1DB95455'}`, background: '#1e1e1e', color: '#fff', fontSize: '0.85rem', outline: 'none', fontFamily: 'Nunito,sans-serif', direction: 'ltr', textAlign: 'left' }}
            onFocus={e => e.target.style.borderColor = '#1DB954'} onBlur={e => e.target.style.borderColor = error ? '#ef4444' : '#1DB95455'} />
          <button onClick={handlePreview} style={{ padding: '10px 16px', borderRadius: 9, border: 'none', background: '#1DB954', color: '#000', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Preview</button>
        </div>
        {error && <div style={{ fontSize: '0.75rem', color: '#f87171', padding: '4px 8px', background: 'rgba(239,68,68,.12)', borderRadius: 6 }}>{error}</div>}
        {embedUrl && (
          <div style={{ borderRadius: 10, overflow: 'hidden' }}>
            <iframe src={embedUrl} width="100%" height={embedH} frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy" style={{ display: 'block', borderRadius: 10 }} />
          </div>
        )}
        {embedId && (
          <button onClick={handleSend} style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#1DB954,#17a349)', color: '#000', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <i className="fa-solid fa-paper-plane" style={{ fontSize: 15 }} /> Share in chat
          </button>
        )}
      </div>
    </FloatPanel>
  )
}

// ─── EMOTICON PICKER ─────────────────────────────────────────
const EMOT_BASE = [
  'amazing','angel','angry','anxious','bad','bigsmile','blink','cool','crisped','cry','cry2',
  'dead','desperate','devil','doubt','feelgood','funny','good','happy','happy3','hee','heu',
  'hilarious','hmm','hono','hoo','hooo','idontcare','indiferent','kiss','kiss2','kiss3','kiss4',
  'med','medsmile','muted','nana','neutral','noooo','nosebleed','omg','omgomg','pokerface',
  'reverse','sad','sad2','scared','sick2','sleep','smile','smileface','smileteeth','sweat',
  'tongue','tongue2','tongue3','toro','totalangry','totallove','verysad','whaaa','whocare','wot',
]
const EMOT_FOOD = [
  'apple','babymilk','banana','beer','beers','bread','burger','burritos','cake','candy',
  'champain','cheeze','chocolate','cookie','corn','flower','flower2','fries','greenapple',
  'honey','hotdog','lemon','lollypop','lunchtime','meal','noodle','orange','pancake',
  'pineapple','pizza','plant','popcorn','rice','spaghetti','sunflower','taco','weat',
]
const EMOT_ANIMALS = [
  '1f401','1f402','1f403','1f404','1f405','1f406','1f407','1f408','1f409','1f410',
  '1f411','1f412','1f413','1f414','1f415','1f416','1f417','1f418','1f419','1f420',
  '1f421','1f422','1f423','1f424','1f425','1f426','1f427','1f428','1f429','1f430',
  '1f431','1f432','1f433','1f434','1f435','1f436','1f437','1f438','1f439',
  '1f981','1f982','1f983','1f984','1f985','1f986','1f987','1f988','1f989','1f98a',
  '1f98b','1f98c','1f98d','1f98e','1f98f','1f990','1f991',
]
const EMOT_CATS = [
  { id: 'base',    label: 'Faces',   icon: '/icons/emoticon_icon/base_emo.png',        items: EMOT_BASE,    prefix: '/icons/emoticons/',                   suffix: '.png' },
  { id: 'food',    label: 'Food',    icon: '/icons/emoticon_icon/food.png',            items: EMOT_FOOD,    prefix: '/icons/emoticons/food/',              suffix: '.png' },
  { id: 'animals', label: 'Animals', icon: '/icons/emoticon_icon/sticker_animals.png', items: EMOT_ANIMALS, prefix: '/icons/emoticons/sticker_animals/',   suffix: '.png' },
]

// EmoticonPicker — anchors above the emoji button, theme-synced, NOT center-screen
function EmoticonPicker({ onSelect, onClose, anchorRef, tObj }) {
  const [tab, setTab] = useState('base')
  const [pos, setPos] = useState(null)
  const cat = EMOT_CATS.find(c => c.id === tab) || EMOT_CATS[0]

  // Theme colors
  const thBg     = tObj?.bg_header  || '#111111'
  const thBg2    = tObj?.bg_chat    || '#151515'
  const thText   = tObj?.text       || '#ffffff'
  const thAccent = tObj?.accent     || '#03add8'
  const thBorder = tObj?.default_color || '#222222'

  useEffect(() => {
    if (anchorRef?.current) {
      const r = anchorRef.current.getBoundingClientRect()
      // Position the modal just above the anchor button, left-aligned
      const modalW = 300
      let left = r.left
      // clamp to viewport
      if (left + modalW > window.innerWidth - 8) left = window.innerWidth - modalW - 8
      if (left < 8) left = 8
      const bottom = window.innerHeight - r.top + 6
      setPos({ left, bottom })
    } else {
      // fallback: bottom-left of screen
      setPos({ left: 8, bottom: 60 })
    }
  }, [anchorRef])

  if (!pos) return null

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: pos.left,
        bottom: pos.bottom,
        width: 300,
        maxHeight: 340,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 14,
        background: thBg,
        border: `1px solid ${thBorder}44`,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.7)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px', borderBottom: `1px solid ${thBorder}33`,
        background: thBg, flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: thText }}>😊 Emoticons</span>
        <button onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 16, lineHeight: 1, padding: '2px 5px' }}>✕</button>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${thBorder}33`, background: thBg, flexShrink: 0 }}>
        {EMOT_CATS.map(c => (
          <button key={c.id} onClick={() => setTab(c.id)}
            style={{
              flex: 1, padding: '7px 4px', border: 'none',
              borderBottom: `2px solid ${tab === c.id ? thAccent : 'transparent'}`,
              background: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              opacity: tab === c.id ? 1 : 0.5, transition: 'opacity .15s',
            }}>
            <img src={c.icon} alt={c.label}
              style={{ width: 22, height: 22, objectFit: 'contain' }}
              onError={e => e.target.style.display = 'none'} />
            <span style={{ fontSize: '0.58rem', fontWeight: 700, color: tab === c.id ? thAccent : thText + '88' }}>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Emoticon grid */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: 6,
        display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3,
        background: thBg2,
      }}>
        {cat.items.map((name, i) => (
          <button key={i} onClick={() => { onSelect(`:${name}:`); onClose?.() }} title={name}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', borderRadius: 7, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = `${thAccent}22`}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <img src={`${cat.prefix}${name}${cat.suffix}`} alt={name}
              style={{ width: 28, height: 28, objectFit: 'contain' }}
              onError={e => { e.target.style.opacity = '0.25' }} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── YOUTUBE MESSAGE — inline in chat ────────────────────────
function YTMessage({ url, onMinimize }) {
  const [expanded, setExpanded] = useState(false)
  const id = (url || '').match(/(?:v=|youtu\.be\/|embed\/|\?v=)([\w-]{11})/)?.[1]
  if (!id) return null

  const embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`

  if (!expanded) return (
    <div onClick={() => setExpanded(true)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: '#111', border: '1px solid #2a2a2a', borderRadius: 10, padding: '7px 11px', maxWidth: 240, cursor: 'pointer', transition: 'background .15s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
      onMouseLeave={e => e.currentTarget.style.background = '#111'}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img src={`https://img.youtube.com/vi/${id}/default.jpg`} alt="" style={{ width: 54, height: 38, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 9, marginLeft: 2 }}>▶</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, marginBottom: 2 }}>YouTube</div>
        <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Tap to play</div>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'relative', maxWidth: 'min(100%,320px)', width: 'min(320px,70vw)', borderRadius: 10, overflow: 'hidden', border: '1px solid #222', background: '#000' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(0,0,0,0.85)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 }}>
        <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 700 }}>▶ YouTube</span>
        <button onClick={() => { setExpanded(false); onMinimize?.({ id, url }) }}
          style={{ background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>—</button>
      </div>
      <iframe width="100%" height="180" src={embedUrl} title="YouTube" frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
        style={{ display: 'block', height: 'min(180px,40vw)', marginTop: 0 }} />
    </div>
  )
}

export { PaintingCanvas, GifPicker, YTPanel, SpotifyPanel, EmoticonPicker, YTMessage }
