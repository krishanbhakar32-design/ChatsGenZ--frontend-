import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import ScrollToTop from '../../components/ScrollToTop.jsx'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// Room type badge colors
const TYPE_STYLE = {
  public:  { bg:'#e8f0fe', color:'#1a73e8', label:'Public' },
  private: { bg:'#fce8e6', color:'#ea4335', label:'Private' },
  premium: { bg:'#f3e8ff', color:'#7c3aed', label:'Premium' },
  staff:   { bg:'#fef7e0', color:'#92400e', label:'Staff' },
  admin:   { bg:'#fce8e6', color:'#c62828', label:'Admin' },
  member:  { bg:'#e6f4ea', color:'#1e7e34', label:'Members' },
}

function RoomCard({ room, onJoin }) {
  const typeS  = TYPE_STYLE[room.type] || TYPE_STYLE.public
  const online = room.currentUsers || 0
  const max    = room.maxUsers || 500
  const pct    = Math.min((online / max) * 100, 100)

  return (
    <div
      onClick={() => onJoin(room)}
      style={{
        background: '#fff', border: '1px solid #e8eaed', borderRadius: 14,
        overflow: 'hidden', cursor: 'pointer', transition: 'all .18s',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.1)'; e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'; e.currentTarget.style.transform='translateY(0)' }}
    >
      {/* Room image */}
      <div style={{ position:'relative', height:110, background:'linear-gradient(135deg,#e8f0fe,#f3e8ff)', overflow:'hidden' }}>
        <img
          src={room.icon || '/default_images/rooms/default_room.png'}
          alt={room.name}
          style={{ width:'100%', height:'100%', objectFit:'cover' }}
          onError={e => { e.target.style.display='none' }}
        />
        {/* type badge */}
        <span style={{
          position:'absolute', top:8, left:8,
          background: typeS.bg, color: typeS.color,
          fontSize:'0.68rem', fontWeight:700, padding:'2px 8px', borderRadius:20,
        }}>{typeS.label}</span>
        {/* password lock */}
        {room.password && (
          <span style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.5)', color:'#fff', fontSize:12, padding:'2px 7px', borderRadius:20 }}>
            🔒
          </span>
        )}
        {/* online bar */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:'rgba(0,0,0,.15)' }}>
          <div style={{ height:'100%', width:`${pct}%`, background: pct>80?'#ea4335':pct>50?'#fbbc04':'#34a853', transition:'width .3s' }} />
        </div>
      </div>

      {/* Room info */}
      <div style={{ padding:'12px 14px' }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.92rem', color:'#111827', marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {room.isPinned && <span style={{ color:'#f59e0b', marginRight:4 }}>📌</span>}
          {room.name}
        </div>
        {room.description && (
          <p style={{ fontSize:'0.78rem', color:'#6b7280', lineHeight:1.5, marginBottom:8, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {room.description}
          </p>
        )}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.76rem', color:'#6b7280' }}>
            <span style={{ width:7, height:7, background:'#22c55e', borderRadius:'50%', display:'inline-block' }} />
            <span>{online} online</span>
          </div>
          <span style={{ fontSize:'0.72rem', color:'#9ca3af' }}>{room.category}</span>
        </div>
      </div>
    </div>
  )
}

export default function ChatLobby() {
  const [rooms,    setRooms]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const [passModal, setPassModal] = useState(null) // {room}
  const [passVal,  setPassVal]  = useState('')
  const [passErr,  setPassErr]  = useState('')
  const nav = useNavigate()

  // Load rooms
  useEffect(() => {
    loadRooms()
    // Refresh every 30s
    const t = setInterval(loadRooms, 30000)
    return () => clearInterval(t)
  }, [])

  async function loadRooms() {
    const token = localStorage.getItem('cgz_token')
    if (!token) { nav('/login'); return }
    try {
      const res  = await fetch(`${API}/api/rooms`, { headers: { Authorization:`Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setRooms(data.rooms || [])
      else if (res.status === 401) { localStorage.removeItem('cgz_token'); nav('/login') }
      else setError(data.error || 'Failed to load rooms')
    } catch { setError('Network error. Please check your connection.') }
    finally { setLoading(false) }
  }

  function joinRoom(room) {
    if (room.password) {
      setPassModal(room); setPassVal(''); setPassErr('')
    } else {
      nav(`/chat/${room._id}`)
    }
  }

  function submitPassword(e) {
    e.preventDefault()
    if (passVal === passModal.password) {
      nav(`/chat/${passModal._id}`)
    } else {
      setPassErr('Wrong password. Please try again.')
    }
  }

  // Filter rooms
  const categories = ['All', ...new Set(rooms.map(r => r.category).filter(Boolean))]
  const filtered = rooms.filter(r => {
    const matchSearch   = r.name.toLowerCase().includes(search.toLowerCase()) ||
                          r.description?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'All' || r.category === category
    return matchSearch && matchCategory
  })

  const pinned  = filtered.filter(r => r.isPinned)
  const regular = filtered.filter(r => !r.isPinned)

  return (
    <>
      <ScrollToTop />
      <Header />

      <div style={{ minHeight:'80vh', background:'#f8f9fa' }}>
        {/* Top bar */}
        <div style={{ background:'#fff', borderBottom:'1px solid #e8eaed', padding:'16px 20px' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:200, position:'relative' }}>
              <i className="fi fi-sr-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', fontSize:14 }} />
              <input
                style={{ width:'100%', padding:'10px 14px 10px 36px', border:'1.5px solid #e8eaed', borderRadius:10, fontSize:'0.875rem', outline:'none', boxSizing:'border-box', background:'#f9fafb' }}
                placeholder="Search chat rooms..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={e => e.target.style.borderColor='#1a73e8'}
                onBlur={e => e.target.style.borderColor='#e8eaed'}
              />
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  padding:'7px 14px', borderRadius:20, border:'1.5px solid', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', transition:'all .15s',
                  borderColor: category===c ? '#1a73e8' : '#e8eaed',
                  background:  category===c ? '#1a73e8' : '#fff',
                  color:       category===c ? '#fff' : '#6b7280',
                }}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 20px' }}>

          {loading && (
            <div style={{ textAlign:'center', padding:'80px 20px' }}>
              <div style={{ width:40, height:40, border:'3px solid #e8eaed', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 14px' }} />
              <p style={{ color:'#9ca3af', fontSize:'0.9rem' }}>Loading chat rooms...</p>
            </div>
          )}

          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'16px 20px', color:'#dc2626', fontSize:'0.9rem', textAlign:'center', marginBottom:20 }}>
              ⚠️ {error} &nbsp;
              <button onClick={loadRooms} style={{ background:'none', border:'none', color:'#1a73e8', fontWeight:700, cursor:'pointer', fontSize:'0.9rem' }}>Retry</button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Pinned rooms */}
              {pinned.length > 0 && (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                    <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#f59e0b', letterSpacing:'.5px', textTransform:'uppercase' }}>📌 Featured Rooms</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14, marginBottom:28 }}>
                    {pinned.map(r => <RoomCard key={r._id} room={r} onJoin={joinRoom} />)}
                  </div>
                </>
              )}

              {/* All rooms */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#9ca3af', letterSpacing:'.5px', textTransform:'uppercase' }}>
                  {category === 'All' ? 'All Rooms' : category} &nbsp;·&nbsp; {filtered.length} rooms
                </span>
              </div>

              {regular.length === 0 && (
                <div style={{ textAlign:'center', padding:'60px 20px', color:'#9ca3af' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
                  <p style={{ fontSize:'0.95rem', fontWeight:600, color:'#6b7280' }}>No rooms found</p>
                  <p style={{ fontSize:'0.85rem', marginTop:4 }}>Try a different search or category</p>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
                {regular.map(r => <RoomCard key={r._id} room={r} onJoin={joinRoom} />)}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />

      {/* Password Modal */}
      {passModal && (
        <div onClick={()=>setPassModal(null)} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:16, padding:'28px 24px', maxWidth:360, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🔒</div>
              <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:'#111827', marginBottom:4 }}>{passModal.name}</h3>
              <p style={{ fontSize:'0.85rem', color:'#6b7280' }}>This room is password protected</p>
            </div>
            {passErr && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'8px 12px', fontSize:'0.83rem', color:'#dc2626', marginBottom:12 }}>{passErr}</div>}
            <form onSubmit={submitPassword} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <input
                type="password"
                style={{ display:'block', width:'100%', padding:'11px 14px', border:'1.5px solid #e8eaed', borderRadius:9, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }}
                placeholder="Enter room password"
                value={passVal}
                onChange={e=>{setPassVal(e.target.value);setPassErr('')}}
                onFocus={e=>e.target.style.borderColor='#1a73e8'}
                onBlur={e=>e.target.style.borderColor='#e8eaed'}
                autoFocus
              />
              <button type="submit" style={{ padding:'12px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:800, fontSize:'0.9rem', fontFamily:'Outfit,sans-serif', cursor:'pointer' }}>
                Enter Room
              </button>
            </form>
            <button onClick={()=>setPassModal(null)} style={{ display:'block', width:'100%', marginTop:10, padding:'10px', borderRadius:9, border:'1.5px solid #e8eaed', background:'#fff', color:'#6b7280', fontWeight:600, fontSize:'0.875rem', cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
