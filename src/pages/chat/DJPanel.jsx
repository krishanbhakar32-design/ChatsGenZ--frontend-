import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// Room Themes from CodyChat
export const ROOM_THEMES = [
  { id:'default',    label:'Default',    bg:'#ffffff', msgBg:'#f3f4f6',  accent:'#1a73e8', font:'Nunito,sans-serif' },
  { id:'dark',       label:'Dark',       bg:'#161824', msgBg:'#2a2d3e',  accent:'#60a5fa', font:'Nunito,sans-serif' },
  { id:'lightblue',  label:'Light Blue', bg:'#e8f4fd', msgBg:'#c8e6f9',  accent:'#0284c7', font:'Nunito,sans-serif' },
  { id:'scent',      label:'Scent',      bg:'#fff0f6', msgBg:'#fce7f3',  accent:'#db2777', font:'Georgia,serif'     },
  { id:'remix',      label:'Remix',      bg:'#fafafa', msgBg:'#f0fdf4',  accent:'#16a34a', font:'Roboto,sans-serif' },
  { id:'stpatrick',  label:'St.Patrick', bg:'#f0fdf4', msgBg:'#dcfce7',  accent:'#15803d', font:'Nunito,sans-serif' },
  { id:'sunset',     label:'Sunset',     bg:'#fff7ed', msgBg:'#fed7aa',  accent:'#ea580c', font:'Nunito,sans-serif' },
  { id:'night',      label:'Night',      bg:'#0f172a', msgBg:'#1e293b',  accent:'#818cf8', font:'Nunito,sans-serif' },
]

export function ThemePicker({ current, onSelect, dark }) {
  const bg = dark?'#1e2030':'#fff', border = dark?'#374151':'#e4e6ea'
  return (
    <div style={{ padding:'12px 14px' }}>
      <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9ca3af', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10 }}>Room Theme</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
        {ROOM_THEMES.map(t => (
          <button key={t.id} onClick={() => onSelect(t)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:9, border:`2px solid ${current?.id===t.id?t.accent:border}`, background:current?.id===t.id?t.bg:dark?'#2a2d3e':'#f9fafb', cursor:'pointer', transition:'all .15s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=t.accent}
            onMouseLeave={e=>{ if(current?.id!==t.id) e.currentTarget.style.borderColor=border }}>
            <div style={{ width:22, height:22, borderRadius:5, background:t.bg, border:`2px solid ${t.accent}`, flexShrink:0 }}/>
            <span style={{ fontSize:'0.78rem', fontWeight:700, color:dark?'#e5e7eb':'#374151' }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function DJPanel({ roomId, me, dark, onClose }) {
  const [dj, setDJ] = useState(null)
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [isHost, setIsHost] = useState(false)
  const audioRef = useRef(null)
  const token = localStorage.getItem('cgz_token')

  const api = (path, opts={}) => fetch(`${API}/api/dj/${roomId}${path}`, { headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json', ...opts.headers }, ...opts }).then(r=>r.json())

  const bg = dark?'#1e2030':'#fff', border = dark?'#374151':'#e4e6ea', txt = dark?'#e5e7eb':'#111827', muted = dark?'#6b7280':'#9ca3af'

  useEffect(() => {
    api('').then(d => {
      setDJ(d.dj || {})
      setIsHost(d.dj?.hostId === me?._id)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function startDJ() {
    const d = await api('/start', { method:'POST' })
    if (d.error) return alert(d.error)
    setIsHost(true); reload()
  }
  async function stopDJ() {
    await api('/stop', { method:'POST' })
    setIsHost(false); reload()
  }
  async function addTrack() {
    if (!url.trim()) return
    const d = await api('/playlist', { method:'POST', body:JSON.stringify({ url:url.trim(), title:title||'Unknown', artist }) })
    if (d.error) return alert(d.error)
    setUrl(''); setTitle(''); setArtist(''); reload()
  }
  async function play(idx) { await api(`/play/${idx}`, { method:'POST' }); reload() }
  async function next() { await api('/next', { method:'POST' }); reload() }
  async function removeTrack(id) { await api(`/playlist/${id}`, { method:'DELETE' }); reload() }
  function reload() { api('').then(d => { setDJ(d.dj||{}); setIsHost(d.dj?.hostId===me?._id) }) }

  const BtnS = ({ onClick, color='#1a73e8', children, small }) => (
    <button onClick={onClick} style={{ padding: small?'5px 10px':'8px 14px', borderRadius:7, border:'none', background:color, color:'#fff', fontWeight:700, cursor:'pointer', fontSize: small?'0.75rem':'0.82rem' }}>
      {children}
    </button>
  )

  if (loading) return <div style={{ padding:20, textAlign:'center', color:muted }}>Loading DJ...</div>

  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:14, overflow:'hidden', width:320 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom:`1px solid ${border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>🎧</span>
          <span style={{ fontWeight:800, fontSize:'0.9rem', color:txt }}>DJ Room</span>
          {dj?.isPlaying && <span style={{ fontSize:'0.65rem', background:'#dcfce7', color:'#16a34a', padding:'2px 7px', borderRadius:10, fontWeight:700 }}>● LIVE</span>}
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:muted, fontSize:15 }}>✕</button>
      </div>

      {/* Current playing */}
      {dj?.isPlaying && dj?.playlist?.[dj.currentIdx] && (
        <div style={{ padding:'10px 14px', background:dark?'#2a2d3e':'#f0fdf4', borderBottom:`1px solid ${border}` }}>
          <div style={{ fontSize:'0.68rem', color:'#16a34a', fontWeight:700, marginBottom:3 }}>♫ Now Playing</div>
          <div style={{ fontSize:'0.85rem', fontWeight:700, color:txt, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{dj.playlist[dj.currentIdx].title}</div>
          {dj.playlist[dj.currentIdx].artist && <div style={{ fontSize:'0.72rem', color:muted }}>{dj.playlist[dj.currentIdx].artist}</div>}
          <div style={{ fontSize:'0.68rem', color:muted, marginTop:3 }}>DJ: {dj.hostName}</div>
        </div>
      )}

      {/* DJ Controls */}
      <div style={{ padding:'10px 14px', borderBottom:`1px solid ${border}` }}>
        {!dj?.isPlaying ? (
          <BtnS onClick={startDJ} color="#1a73e8">🎧 Start DJ Mode</BtnS>
        ) : isHost ? (
          <div style={{ display:'flex', gap:8 }}>
            <BtnS small onClick={next} color="#1a73e8">⏭ Next</BtnS>
            <BtnS small onClick={stopDJ} color="#ef4444">⏹ Stop</BtnS>
          </div>
        ) : (
          <div style={{ fontSize:'0.8rem', color:muted }}>🎧 {dj.hostName} is DJing</div>
        )}
      </div>

      {/* Add track (host only) */}
      {isHost && (
        <div style={{ padding:'10px 14px', borderBottom:`1px solid ${border}` }}>
          <div style={{ fontSize:'0.72rem', fontWeight:700, color:muted, marginBottom:8 }}>ADD TRACK</div>
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Stream URL or YouTube URL..."
            style={{ width:'100%', padding:'7px 10px', border:`1px solid ${border}`, borderRadius:7, background:dark?'#2a2d3e':'#f9fafb', color:txt, fontSize:'0.8rem', outline:'none', boxSizing:'border-box', marginBottom:6 }}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title..." style={{ padding:'6px 8px', border:`1px solid ${border}`, borderRadius:6, background:dark?'#2a2d3e':'#f9fafb', color:txt, fontSize:'0.78rem', outline:'none' }}/>
            <input value={artist} onChange={e=>setArtist(e.target.value)} placeholder="Artist..." style={{ padding:'6px 8px', border:`1px solid ${border}`, borderRadius:6, background:dark?'#2a2d3e':'#f9fafb', color:txt, fontSize:'0.78rem', outline:'none' }}/>
          </div>
          <BtnS small onClick={addTrack} color="#1a73e8">+ Add</BtnS>
        </div>
      )}

      {/* Playlist */}
      <div style={{ maxHeight:200, overflowY:'auto' }}>
        {(!dj?.playlist || dj.playlist.length===0) && (
          <div style={{ textAlign:'center', padding:'20px', color:muted, fontSize:'0.8rem' }}>Playlist empty</div>
        )}
        {dj?.playlist?.map((track, i) => (
          <div key={track.id} onClick={()=>isHost&&play(i)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderBottom:`1px solid ${dark?'#2a2d3e':'#f9fafb'}`, background: i===dj.currentIdx?(dark?'#1a2340':'#e8f0fe'):'transparent', cursor:isHost?'pointer':'default' }}>
            <span style={{ fontSize:'0.7rem', color:muted, width:18, flexShrink:0 }}>{i+1}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'0.8rem', fontWeight:700, color:txt, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track.title}</div>
              {track.artist && <div style={{ fontSize:'0.68rem', color:muted }}>{track.artist}</div>}
            </div>
            {i===dj.currentIdx && dj.isPlaying && <span style={{ fontSize:12, color:'#16a34a', flexShrink:0 }}>▶</span>}
            {isHost && <button onClick={e=>{e.stopPropagation();removeTrack(track.id)}} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:12, flexShrink:0 }}>✕</button>}
          </div>
        ))}
      </div>
    </div>
  )
}
