import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

const STATIONS = [
  { id:'en_pop',      name:'iLove Radio',    genre:'Pop',          flag:'🎵', lang:'English',      streamUrl:'https://streams.ilovemusic.de/iloveradio1.mp3' },
  { id:'en_dance',    name:'iLove Dance',    genre:'Dance / EDM',  flag:'🎧', lang:'English',      streamUrl:'https://streams.ilovemusic.de/iloveradio2.mp3' },
  { id:'en_hiphop',   name:'Hip Hop Nation', genre:'Hip Hop',      flag:'🎤', lang:'English',      streamUrl:'https://stream.zeno.fm/0r0xa792kwzuv' },
  { id:'en_lofi',     name:'Lofi Chill',     genre:'Lofi / Chill', flag:'☕', lang:'English',      streamUrl:'https://stream.zeno.fm/f3wvbbqmdg8uv' },
  { id:'en_rock',     name:'Classic Rock',   genre:'Rock',         flag:'🎸', lang:'English',      streamUrl:'https://stream.zeno.fm/yn65b325g4zuv' },
  { id:'en_rnb',      name:'R&B Soul',       genre:'R&B / Soul',   flag:'🎙️',lang:'English',      streamUrl:'https://stream.zeno.fm/4d5n4qfyg8zuv' },
  { id:'en_jazz',     name:'Jazz FM',        genre:'Jazz',         flag:'🎷', lang:'English',      streamUrl:'https://stream.zeno.fm/wrb0qnnbwzzuv' },
  { id:'hi_hits',     name:'Bollywood Hits', genre:'Bollywood',    flag:'🇮🇳',lang:'Hindi',        streamUrl:'https://stream.zeno.fm/sbuhf6tmdg8uv' },
  { id:'hi_retro',    name:'Purana Filmi',   genre:'Retro Filmi',  flag:'📻', lang:'Hindi',        streamUrl:'https://stream.zeno.fm/xp5gfqfyg8zuv' },
  { id:'hi_romantic', name:'Dil Ki Awaaz',   genre:'Romantic',     flag:'❤️', lang:'Hindi',        streamUrl:'https://stream.zeno.fm/mvt7gqfyg8zuv' },
  { id:'pb_hits',     name:'Punjabi Beat',   genre:'Bhangra',      flag:'🥁', lang:'Punjabi',      streamUrl:'https://stream.zeno.fm/k5n5bqtmdg8uv' },
  { id:'ambient',     name:'Ambient Space',  genre:'Ambient',      flag:'🌌', lang:'Instrumental', streamUrl:'https://stream.zeno.fm/fbij7b2bg4zuv' },
  { id:'acoustic',    name:'Acoustic Vibes', genre:'Acoustic',     flag:'🪕', lang:'English',      streamUrl:'https://stream.zeno.fm/n5dyb4qyg8zuv' },
  { id:'classical',   name:'Classical FM',   genre:'Classical',    flag:'🎻', lang:'Instrumental', streamUrl:'https://stream.zeno.fm/yoag7bqmdg8uv' },
]

const LANG_COLORS = {
  English:      { bg:'#eff6ff', text:'#1d4ed8', border:'#bfdbfe' },
  Hindi:        { bg:'#fff7ed', text:'#c2410c', border:'#fed7aa' },
  Punjabi:      { bg:'#fdf4ff', text:'#7c3aed', border:'#e9d5ff' },
  Instrumental: { bg:'#f0fdf4', text:'#15803d', border:'#bbf7d0' },
}

// ── MODULE-LEVEL PERSISTENT AUDIO ───────────────────────────
// Single Audio instance shared across all RadioPlayer mounts so
// music continues when the panel is minimised / remounted.
let _audio = null
let _activeStation = null
let _isPlaying = false
let _volume = 0.8
const _listeners = new Set()

function getAudio() {
  if (!_audio && typeof window !== 'undefined') {
    _audio = new Audio()
    _audio.preload  = 'none'
    _audio.crossOrigin = 'anonymous'
    _audio.volume   = _volume
    _audio.addEventListener('playing', () => { _isPlaying = true;  _notify() })
    _audio.addEventListener('pause',   () => { _isPlaying = false; _notify() })
    _audio.addEventListener('ended',   () => { _isPlaying = false; _notify() })
    _audio.addEventListener('error',   () => { _isPlaying = false; _notify() })
    _audio.addEventListener('waiting', () => _notify())
  }
  return _audio
}

function _notify() { _listeners.forEach(fn => fn()) }

function useRadioSync() {
  const [, tick] = useState(0)
  useEffect(() => {
    const fn = () => tick(t => t + 1)
    _listeners.add(fn)
    return () => _listeners.delete(fn)
  }, [])
  return { activeStation: _activeStation, isPlaying: _isPlaying, volume: _volume }
}

function selectStation(station) {
  const audio = getAudio()
  if (!audio) return
  if (_activeStation?.id === station.id) {
    if (_isPlaying) { audio.pause() } else { audio.play().catch(() => {}) }
    return
  }
  _activeStation = station
  _isPlaying = false
  audio.pause()
  audio.src = station.streamUrl
  audio.load()
  audio.play().catch(() => {})
  _notify()
}

function togglePlay() {
  const audio = getAudio()
  if (!audio || !_activeStation) return
  if (_isPlaying) { audio.pause() } else { audio.play().catch(() => {}) }
}

function setVolume(v) {
  _volume = v
  const audio = getAudio()
  if (audio) audio.volume = v
  _notify()
}

// ── MINI PLAYER (always-visible bar when a station is active) ──
export function RadioMiniBar({ dark }) {
  const { activeStation, isPlaying } = useRadioSync()
  if (!activeStation) return null
  const audio = getAudio()
  const waiting = audio ? audio.readyState < 3 && audio.networkState === 2 : false
  const bg = dark ? '#1e2030' : '#1a73e8'
  const txt = '#fff'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px', background:bg, borderTop:'1px solid rgba(255,255,255,.15)', flexShrink:0 }}>
      <span style={{ fontSize:14 }}>{activeStation.flag}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700, color:txt, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {waiting ? '⏳ Connecting…' : isPlaying ? `▶ ${activeStation.name}` : `⏸ ${activeStation.name}`}
        </div>
        <div style={{ fontSize:'0.62rem', color:'rgba(255,255,255,.65)' }}>{activeStation.genre}</div>
      </div>
      <button onClick={togglePlay} style={{ width:28, height:28, borderRadius:'50%', border:'1.5px solid rgba(255,255,255,.4)', background:'rgba(255,255,255,.15)', color:txt, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>
        {waiting ? <span style={{ width:10, height:10, border:'2px solid rgba(255,255,255,.4)', borderTop:'2px solid #fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/> : isPlaying ? '⏸' : '▶'}
      </button>
    </div>
  )
}

// ── FULL RADIO PLAYER UI ─────────────────────────────────────
export default function RadioPlayer({ dark, onClose }) {
  const { activeStation, isPlaying } = useRadioSync()
  const audio = getAudio()
  const waiting = audio ? audio.readyState < 3 && audio.networkState === 2 && !!activeStation : false
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!audio) return
    const onErr = () => setError('Stream unavailable — try another station')
    const onOk  = () => setError(null)
    audio.addEventListener('error',   onErr)
    audio.addEventListener('playing', onOk)
    return () => { audio.removeEventListener('error', onErr); audio.removeEventListener('playing', onOk) }
  }, [])

  const bg = dark ? '#1e2030' : '#fff', bg2 = dark ? '#2a2d3e' : '#f9fafb'
  const border = dark ? '#374151' : '#e4e6ea', txt = dark ? '#e5e7eb' : '#111827'
  const muted = dark ? '#9ca3af' : '#6b7280'
  const LANGS = ['All', ...new Set(STATIONS.map(s => s.lang))]
  const visible = STATIONS.filter(s => {
    const ml = filter === 'All' || s.lang === filter
    const ms = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.genre.toLowerCase().includes(search.toLowerCase())
    return ml && ms
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:bg, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'12px 14px', borderBottom:`1px solid ${border}`, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <span style={{ fontSize:18 }}>📻</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:'0.9rem', color:txt }}>Live Radio</div>
          {activeStation
            ? <div style={{ fontSize:'0.72rem', color:muted }}>{activeStation.flag} {activeStation.name} · {activeStation.genre}</div>
            : <div style={{ fontSize:'0.72rem', color:muted }}>Select a station — music keeps playing when minimised</div>}
        </div>
        {activeStation && (
          <button onClick={togglePlay} style={{ width:34, height:34, borderRadius:'50%', border:'none', background:'#1a73e8', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
            {waiting ? <span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,.3)', borderTop:'2px solid #fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/> : isPlaying ? '⏸' : '▶'}
          </button>
        )}
        {onClose && <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:muted, fontSize:18, lineHeight:1 }}>×</button>}
      </div>

      {/* Now playing */}
      {activeStation && (
        <div style={{ padding:'7px 14px', background:dark?'#111827':'#e8f0fe', borderBottom:`1px solid ${border}`, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <span style={{ fontSize:20 }}>{activeStation.flag}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:'0.8rem', fontWeight:800, color:dark?'#60a5fa':'#1a73e8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {waiting ? '⏳ Connecting…' : isPlaying ? `▶ ${activeStation.name}` : `⏸ ${activeStation.name}`}
            </div>
            <div style={{ fontSize:'0.66rem', color:muted }}>{activeStation.genre} · {activeStation.lang}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ fontSize:11 }}>🔊</span>
            <input type="range" min={0} max={1} step={0.05} value={_volume} onChange={e=>setVolume(parseFloat(e.target.value))}
              style={{ width:65, accentColor:'#1a73e8', cursor:'pointer' }}/>
          </div>
        </div>
      )}

      {error && <div style={{ margin:'6px 12px', padding:'7px 10px', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, fontSize:'0.76rem', color:'#991b1b' }}>⚠️ {error}</div>}

      {/* Search + filter */}
      <div style={{ padding:'7px 10px', borderBottom:`1px solid ${border}`, flexShrink:0 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search stations…"
          style={{ width:'100%', padding:'5px 9px', border:`1px solid ${border}`, borderRadius:7, background:bg2, color:txt, fontSize:'0.8rem', outline:'none', boxSizing:'border-box', marginBottom:6 }}/>
        <div style={{ display:'flex', gap:4, overflowX:'auto', paddingBottom:2 }}>
          {LANGS.map(l => (
            <button key={l} onClick={()=>setFilter(l)}
              style={{ padding:'2px 9px', borderRadius:10, border:`1.5px solid ${filter===l?'#1a73e8':border}`, background:filter===l?'#e8f0fe':'none', color:filter===l?'#1a73e8':muted, fontSize:'0.7rem', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Station list */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {visible.length === 0 && <div style={{ textAlign:'center', padding:20, color:muted, fontSize:'0.8rem' }}>No stations found</div>}
        {visible.map(s => {
          const isActive = activeStation?.id === s.id
          const lc = LANG_COLORS[s.lang] || LANG_COLORS.English
          return (
            <button key={s.id} onClick={()=>{ setError(null); selectStation(s) }}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 14px', background:isActive?(dark?'#1a1a3a':'#e8f0fe'):'none', border:'none', borderBottom:`1px solid ${dark?'#2a2d3e':'#f3f4f6'}`, cursor:'pointer', textAlign:'left', transition:'background .12s' }}
              onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background=dark?'#2a2d3e':'#f9fafb' }}
              onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background='none' }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:isActive?'#1a73e8':'#e4e6ea', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0, boxShadow:isActive?'0 2px 8px rgba(26,115,232,.4)':'none' }}>
                {isActive && waiting ? <span style={{ width:10, height:10, border:'2px solid rgba(255,255,255,.3)', borderTop:'2px solid #fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/> : isActive && isPlaying ? '⏸' : s.flag}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'0.81rem', fontWeight:700, color:isActive?(dark?'#60a5fa':'#1a73e8'):txt, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                <div style={{ fontSize:'0.68rem', color:muted }}>{s.genre}</div>
              </div>
              <span style={{ padding:'2px 6px', borderRadius:7, background:lc.bg, color:lc.text, border:`1px solid ${lc.border}`, fontSize:'0.63rem', fontWeight:700, flexShrink:0 }}>{s.lang}</span>
            </button>
          )
        })}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
