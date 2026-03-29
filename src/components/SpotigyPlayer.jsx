// ============================================================
// SpotifyPlayer.jsx — Spotify music player with search & playlists
// ============================================================
import { useState, useEffect, useRef } from 'react'

const SPOTIFY_API = 'YOUR_BACKEND_URL/api/spotify'

export default function SpotifyPlayer({ show, onClose }) {
  const [tab, setTab] = useState('search') // 'search' | 'trending' | 'playlists'
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [trending, setTrending] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [current, setCurrent] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(70)
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(false)
  const audioRef = useRef(null)

  // Fetch trending on mount
  useEffect(() => {
    if (show && trending.length === 0) fetchTrending()
  }, [show])

  // Fetch playlists
  useEffect(() => {
    if (show && tab === 'playlists' && playlists.length === 0) fetchPlaylists()
  }, [tab, show])

  // Update progress
  useEffect(() => {
    if (!audioRef.current) return
    const audio = audioRef.current
    const update = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    audio.addEventListener('timeupdate', update)
    audio.addEventListener('ended', handleNext)
    return () => {
      audio.removeEventListener('timeupdate', update)
      audio.removeEventListener('ended', handleNext)
    }
  }, [current])

  // Volume control
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100
  }, [volume])

  async function fetchTrending() {
    setLoading(true)
    try {
      const res = await fetch(`${SPOTIFY_API}/trending`)
      const data = await res.json()
      setTrending(data.tracks || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function fetchPlaylists() {
    setLoading(true)
    try {
      const res = await fetch(`${SPOTIFY_API}/playlists`)
      const data = await res.json()
      setPlaylists(data.playlists || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function searchTracks() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${SPOTIFY_API}/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.tracks || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function playTrack(track) {
    setCurrent(track)
    setPlaying(true)
    if (audioRef.current) {
      audioRef.current.src = track.previewUrl || track.url
      audioRef.current.play()
    }
  }

  function togglePlay() {
    if (!audioRef.current || !current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  function handleNext() {
    if (queue.length > 0) {
      const next = queue[0]
      setQueue(queue.slice(1))
      playTrack(next)
    } else {
      setPlaying(false)
    }
  }

  function addToQueue(track) {
    setQueue([...queue, track])
  }

  function seek(e) {
    if (!audioRef.current || !current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = audioRef.current.duration * percent
    setProgress(percent * 100)
  }

  if (!show) return null

  return (
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'linear-gradient(135deg, #1db954 0%, #191414 100%)',width:'90%',maxWidth:900,height:'80vh',borderRadius:16,display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
        
        {/* Header */}
        <div style={{padding:'16px 20px',background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',gap:12}}>
          <i className="fi fi-brands-spotify" style={{fontSize:28,color:'#1db954'}}/>
          <h2 style={{margin:0,color:'#fff',fontSize:20,flex:1}}>Spotify Player</h2>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#fff',fontSize:24,cursor:'pointer'}}>×</button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:8,padding:'12px 20px',background:'rgba(0,0,0,0.2)',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
          <Tab active={tab==='search'} onClick={()=>setTab('search')} icon="fi-sr-search" label="Search"/>
          <Tab active={tab==='trending'} onClick={()=>setTab('trending')} icon="fi-sr-flame" label="Trending"/>
          <Tab active={tab==='playlists'} onClick={()=>setTab('playlists')} icon="fi-sr-list-music" label="Playlists"/>
        </div>

        {/* Search Bar */}
        {tab === 'search' && (
          <div style={{padding:20,background:'rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',gap:8}}>
              <input 
                value={query} 
                onChange={e=>setQuery(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&searchTracks()}
                placeholder="Search songs, artists, albums..."
                style={{flex:1,padding:'10px 16px',borderRadius:24,border:'none',background:'rgba(255,255,255,0.1)',color:'#fff',fontSize:14}}
              />
              <button onClick={searchTracks} style={{padding:'10px 24px',borderRadius:24,border:'none',background:'#1db954',color:'#fff',cursor:'pointer',fontWeight:600}}>
                Search
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{flex:1,overflowY:'auto',padding:20}}>
          {loading ? (
            <div style={{textAlign:'center',padding:40,color:'rgba(255,255,255,0.6)'}}>Loading...</div>
          ) : (
            <>
              {tab === 'search' && results.length > 0 && (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {results.map((t,i) => <TrackCard key={i} track={t} onPlay={()=>playTrack(t)} onQueue={()=>addToQueue(t)} current={current?._id===t._id}/>)}
                </div>
              )}
              {tab === 'trending' && trending.length > 0 && (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {trending.map((t,i) => <TrackCard key={i} track={t} onPlay={()=>playTrack(t)} onQueue={()=>addToQueue(t)} current={current?._id===t._id}/>)}
                </div>
              )}
              {tab === 'playlists' && playlists.length > 0 && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
                  {playlists.map((p,i) => <PlaylistCard key={i} playlist={p}/>)}
                </div>
              )}
              {tab === 'search' && results.length === 0 && !loading && (
                <div style={{textAlign:'center',padding:40,color:'rgba(255,255,255,0.4)'}}>Search for music</div>
              )}
            </>
          )}
        </div>

        {/* Player Controls */}
        {current && (
          <div style={{background:'rgba(0,0,0,0.4)',padding:16,borderTop:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12}}>
              <img src={current.image || '/default_images/music.png'} alt="" style={{width:48,height:48,borderRadius:6,objectFit:'cover'}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:'#fff',fontWeight:600,fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{current.name}</div>
                <div style={{color:'rgba(255,255,255,0.6)',fontSize:12,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{current.artist}</div>
              </div>
              <button onClick={togglePlay} style={{width:40,height:40,borderRadius:'50%',border:'none',background:'#1db954',color:'#fff',cursor:'pointer',fontSize:18}}>
                <i className={`fi ${playing?'fi-sr-pause':'fi-sr-play'}`}/>
              </button>
              <button onClick={handleNext} style={{width:40,height:40,borderRadius:'50%',border:'none',background:'rgba(255,255,255,0.1)',color:'#fff',cursor:'pointer',fontSize:16}}>
                <i className="fi fi-sr-forward"/>
              </button>
              <div style={{display:'flex',alignItems:'center',gap:8,width:120}}>
                <i className="fi fi-sr-volume" style={{fontSize:16,color:'rgba(255,255,255,0.6)'}}/>
                <input type="range" min="0" max="100" value={volume} onChange={e=>setVolume(+e.target.value)} style={{flex:1}}/>
              </div>
            </div>
            <div onClick={seek} style={{height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,cursor:'pointer',position:'relative'}}>
              <div style={{height:'100%',background:'#1db954',borderRadius:2,width:`${progress}%`}}/>
            </div>
          </div>
        )}

        <audio ref={audioRef}/>
      </div>
    </div>
  )
}

function Tab({active,onClick,icon,label}) {
  return (
    <button onClick={onClick} style={{padding:'8px 16px',borderRadius:20,border:'none',background:active?'rgba(255,255,255,0.2)':'transparent',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:13,fontWeight:active?600:400,transition:'all .2s'}}>
      <i className={`fi ${icon}`} style={{fontSize:14}}/>
      {label}
    </button>
  )
}

function TrackCard({track,onPlay,onQueue,current}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:12,borderRadius:8,background:current?'rgba(29,185,84,0.2)':'rgba(255,255,255,0.05)',cursor:'pointer',transition:'all .2s'}}
      onMouseEnter={e=>e.currentTarget.style.background=current?'rgba(29,185,84,0.3)':'rgba(255,255,255,0.1)'}
      onMouseLeave={e=>e.currentTarget.style.background=current?'rgba(29,185,84,0.2)':'rgba(255,255,255,0.05)'}>
      <img src={track.image || '/default_images/music.png'} alt="" style={{width:50,height:50,borderRadius:6,objectFit:'cover'}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:'#fff',fontWeight:500,fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{track.name}</div>
        <div style={{color:'rgba(255,255,255,0.6)',fontSize:12,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{track.artist}</div>
      </div>
      <div style={{color:'rgba(255,255,255,0.5)',fontSize:12,marginRight:12}}>{track.duration || '3:45'}</div>
      <button onClick={onPlay} style={{width:36,height:36,borderRadius:'50%',border:'none',background:'#1db954',color:'#fff',cursor:'pointer',fontSize:14}}>
        <i className="fi fi-sr-play"/>
      </button>
      <button onClick={onQueue} style={{width:36,height:36,borderRadius:'50%',border:'none',background:'rgba(255,255,255,0.1)',color:'#fff',cursor:'pointer',fontSize:14}}>
        <i className="fi fi-sr-add"/>
      </button>
    </div>
  )
}

function PlaylistCard({playlist}) {
  return (
    <div style={{padding:16,borderRadius:12,background:'rgba(255,255,255,0.05)',cursor:'pointer',transition:'all .2s'}}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
      onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
      <img src={playlist.image || '/default_images/playlist.png'} alt="" style={{width:'100%',aspectRatio:'1',borderRadius:8,objectFit:'cover',marginBottom:12}}/>
      <div style={{color:'#fff',fontWeight:600,fontSize:14,marginBottom:4}}>{playlist.name}</div>
      <div style={{color:'rgba(255,255,255,0.6)',fontSize:12}}>{playlist.tracks} tracks</div>
    </div>
  )
}
