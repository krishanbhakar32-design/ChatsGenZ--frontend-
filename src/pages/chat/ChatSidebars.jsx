// ============================================================
// ChatSidebars.jsx — ChatsGenZ v3
// LEFT SIDEBAR: full menu with flyout subpanels (Games, Leaderboard, Store, Premium)
// RIGHT SIDEBAR: user list with tabs
// RTL fix: all inputs use dir="ltr"
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { API, R, RL, GBR, RANKS, isStaff, isAdmin, resolveNameColor } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'
import { GamesPanel } from './ChatGames.jsx'

const ST_COLOR = { online: '#22c55e', away: '#f59e0b', busy: '#ef4444', invisible: '#9ca3af' }

const FONT_MAP = {
  font1:"'Kalam',cursive",font2:"'Signika',sans-serif",font3:"'Orbitron',sans-serif",
  font4:"'Comic Neue',cursive",font5:"'Quicksand',sans-serif",font6:"'Pacifico',cursive",
  font7:"'Dancing Script',cursive",font8:"'Lobster Two',cursive",font9:"'Caveat',cursive",
  font10:"'Rajdhani',sans-serif",font11:"'Audiowide',sans-serif",font12:"'Nunito',sans-serif",
  font13:"'Grandstander',cursive",font14:"'Comic Neue',cursive",font15:"'Lemonada',cursive",
  font16:"'Grenze Gotisch',cursive",font17:"'Merienda',cursive",font18:"'Amita',cursive",
  font19:"'Averia Libre',cursive",font20:"'Turret Road',cursive",font21:"'Sansita',sans-serif",
  font22:"'Comfortaa',cursive",font23:"'Charm',cursive",font24:"'Satisfy',cursive",
}
const SOLID_COLORS = ['#ff3333','#ff6633','#ff9933','#ffcc33','#cccc00','#99cc00','#59b300','#829356','#008000','#00e639','#00e673','#00e6ac','#00cccc','#03add8','#3366ff','#107896','#004d99','#6633ff','#9933ff','#cc33ff','#ff33ff','#ff33cc','#ff3399','#ff3366','#604439','#795548','#a97f70','#bc9b8f','#9E9E9E','#879fab','#698796','#495f69']
const BUB_GRADS = ['linear-gradient(135deg,#ff0000,#ff6600)','linear-gradient(135deg,#ff6600,#ffcc00)','linear-gradient(135deg,#ffcc00,#00cc00)','linear-gradient(135deg,#00cc00,#00ccff)','linear-gradient(135deg,#00ccff,#0066ff)','linear-gradient(135deg,#0066ff,#9900ff)','linear-gradient(135deg,#9900ff,#ff0099)','linear-gradient(135deg,#ff0099,#ff6600)','linear-gradient(135deg,#e040fb,#3f51b5)','linear-gradient(135deg,#43e97b,#38f9d7)','linear-gradient(135deg,#f093fb,#f5576c)','linear-gradient(135deg,#4facfe,#00f2fe)','linear-gradient(135deg,#fa709a,#fee140)','linear-gradient(135deg,#a18cd1,#fbc2eb)','linear-gradient(135deg,#ffecd2,#fcb69f)','linear-gradient(135deg,#ff9a9e,#fecfef)']

function resolveNameStyle(u) {
  const font = u.nameFont ? FONT_MAP[u.nameFont] : undefined
  if (u.nameColor?.startsWith('bgrad')) {
    const idx = parseInt(u.nameColor.replace('bgrad','')) - 1
    const grad = BUB_GRADS[idx]
    if (grad) return { background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontFamily: font || 'inherit' }
  }
  if (u.nameColor?.startsWith('bcolor')) {
    const idx = parseInt(u.nameColor.replace('bcolor','')) - 1
    const c = SOLID_COLORS[idx]
    if (c) return { color: c, fontFamily: font || 'inherit' }
  }
  if (u.nameColor?.startsWith('#') || u.nameColor?.startsWith('rgb')) {
    return { color: u.nameColor, fontFamily: font || 'inherit' }
  }
  return { fontFamily: font || 'inherit' }
}

// ── User list item ────────────────────────────────────────────
function UserItem({ u, onClick, onWhisper, showMood = true, myId }) {
  const [hov, setHov] = useState(false)
  const nameStyle = resolveNameStyle(u)
  const status = u.status || 'online'
  const isMe = String(u._id || u.userId) === String(myId)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', cursor:'pointer',
        background: hov ? 'rgba(255,255,255,0.05)' : 'transparent',
        borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'background .12s', position:'relative' }}>
      <div style={{ position:'relative', flexShrink:0 }} onClick={e => onClick?.(u, e)}>
        <img src={u.avatar || '/default_images/avatar/default_guest.png'} alt=""
          style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${GBR(u.gender, u.rank)}`, display:'block' }}
          onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }} />
        <span style={{ position:'absolute', bottom:0, right:0, width:8, height:8,
          background: ST_COLOR[status]||'#22c55e', borderRadius:'50%', border:'1.5px solid #151515' }} />
      </div>
      <div style={{ flex:1, minWidth:0 }} onClick={e => onClick?.(u, e)}>
        <div style={{ display:'flex', alignItems:'center', gap:3 }}>
          {u.isCamHost && <i className="fa-solid fa-video" style={{ fontSize:9, color:'#ef4444', flexShrink:0 }} />}
          <span style={{ fontSize:'0.8rem', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            maxWidth:110, color:'#ffffff', ...nameStyle }}>{u.username}</span>
        </div>
        {showMood && u.mood && (
          <div style={{ fontSize:'0.65rem', color:'#666666', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>{u.mood}</div>
        )}
      </div>
      <RIcon rank={u.rank} size={14} />
      {u.countryCode && u.countryCode !== 'ZZ' && (
        <img src={`/icons/flags/${u.countryCode.toUpperCase()}.png`} alt="" style={{ width:14, height:10, flexShrink:0, borderRadius:1 }}
          onError={e => e.target.style.display='none'} />
      )}
      {hov && !isMe && onWhisper && (
        <button onClick={e => { e.stopPropagation(); onWhisper({ ...u, userId: u._id || u.userId }) }}
          title="Whisper"
          style={{ position:'absolute', right:6, background:'rgba(124,58,237,0.18)', border:'1px solid rgba(124,58,237,0.4)',
            borderRadius:6, color:'#a78bfa', cursor:'pointer', fontSize:10, padding:'3px 6px', display:'flex', alignItems:'center', gap:3 }}>
          <i className="fa-solid fa-hand-lizard" style={{ fontSize:10 }} />
        </button>
      )}
    </div>
  )
}

// ── RIGHT SIDEBAR ─────────────────────────────────────────────
function RightSidebar({ users, myLevel, myId, onUserClick, onWhisper, onClose, tObj }) {
  const [tab, setTab]       = useState('users')
  const [search, setSearch] = useState('')
  const [genderF, setGF]    = useState('all')
  const [camOnly, setCam]   = useState(false)
  const [friendTab, setFT]  = useState('online')
  const [staffTab, setST]   = useState('online')
  const [friends, setFriends]   = useState([])
  const [staffAll, setStaff]    = useState([])
  const searchTimer = useRef(null)
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (tab !== 'friends') return
    const t = localStorage.getItem('cgz_token')
    fetch(`${API}/api/users/me/friends`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => setFriends(d.friends || [])).catch(() => {})
  }, [tab])

  useEffect(() => {
    if (tab !== 'staff') return
    const t = localStorage.getItem('cgz_token')
    fetch(`${API}/api/users/staff`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => setStaff(d.staff || [])).catch(() => {})
  }, [tab])

  useEffect(() => {
    if (tab !== 'search' || !search.trim()) { setSearchResults([]); return }
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearching(true)
      const t = localStorage.getItem('cgz_token')
      const gq = genderF !== 'all' ? `&gender=${genderF}` : ''
      fetch(`${API}/api/users/search?q=${encodeURIComponent(search)}${gq}&limit=30`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json()).then(d => setSearchResults(d.users || [])).catch(() => {})
        .finally(() => setSearching(false))
    }, 350)
    return () => clearTimeout(searchTimer.current)
  }, [search, genderF, tab])

  const visible = users.filter(u => u.status !== 'invisible')
  const sorted = [...visible].sort((a, b) => RL(b.rank) - RL(a.rank) || (a.username || '').localeCompare(b.username || ''))
  const onlineF = sorted.filter(u => {
    if (genderF !== 'all' && u.gender !== genderF) return false
    if (camOnly && !u.isCamHost) return false
    return true
  })
  const onlineFriendsIds = new Set(visible.map(u => String(u._id || u.userId)))
  const friendsOnline  = friends.filter(f => onlineFriendsIds.has(String(f._id || f.userId)))
  const friendsOffline = friends.filter(f => !onlineFriendsIds.has(String(f._id || f.userId)))
  const staffFromRoom  = sorted.filter(u => RL(u.rank) >= 11)
  const onlineStaffIds = new Set(visible.filter(u => RL(u.rank) >= 11).map(u => String(u._id || u.userId)))
  const staffOnline    = staffAll.filter(s => onlineStaffIds.has(String(s._id || s.userId)))
  const staffOffline   = staffAll.filter(s => !onlineStaffIds.has(String(s._id || s.userId)))

  function renderList(list, fallback) {
    if (!list.length) return <p style={{ textAlign:'center', color:'#666', fontSize:'0.76rem', padding:'16px 10px' }}>{fallback}</p>
    return list.map((u, i) => <UserItem key={u.userId || u._id || i} u={u} onClick={onUserClick} onWhisper={onWhisper} myId={myId} />)
  }

  function SubTab({ label, active, count, onClick }) {
    return (
      <button onClick={onClick} style={{ padding:'4px 12px', borderRadius:20, border:'none', cursor:'pointer',
        fontSize:'0.72rem', fontWeight:600, background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active ? '#ffffff' : '#666', transition:'all .12s' }}>
        {label}{count !== undefined ? ` (${count})` : ''}
      </button>
    )
  }

  const TABS = [
    { id:'users',   icon:'fa-solid fa-users',            title:'Users' },
    { id:'friends', icon:'fa-solid fa-user-group',       title:'Friends' },
    { id:'staff',   icon:'fa-solid fa-user-shield',      title:'Staff' },
    { id:'search',  icon:'fa-solid fa-magnifying-glass', title:'Search' },
  ]

  return (
    <div style={{ width:220, flexShrink:0, display:'flex', flexDirection:'column',
      background:'#080808', borderLeft:'1px solid rgba(255,255,255,0.05)', overflow:'hidden', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'#111111', flexShrink:0 }}>
        <span style={{ fontSize:'0.82rem', fontWeight:700, color:'#ffffff' }}>Users ({visible.length})</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:16, padding:4, borderRadius:5 }}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'#111111', flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} title={t.title}
            style={{ flex:1, padding:'9px 0', border:'none', cursor:'pointer', fontSize:14, background:'none',
              color: tab===t.id ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
              borderBottom: tab===t.id ? '2px solid var(--accent)' : '2px solid transparent',
              transition:'color .12s, border-color .12s' }}>
            <i className={t.icon} />
          </button>
        ))}
      </div>
      {(tab === 'users' || tab === 'search') && (
        <div style={{ padding:'6px 8px', borderBottom:'1px solid rgba(255,255,255,0.03)', flexShrink:0, background:'#111' }}>
          {tab === 'search' && (
            <input dir="ltr" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
              style={{ width:'100%', padding:'6px 10px', background:'#191919', border:'1px solid #222',
                borderRadius:20, color:'#ffffff', fontSize:'0.78rem', direction:'ltr', textAlign:'left',
                outline:'none', boxSizing:'border-box' }} />
          )}
          {tab === 'users' && (
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {['all','male','female'].map(g => (
                <button key={g} onClick={() => setGF(g)}
                  style={{ padding:'2px 10px', borderRadius:20, border:'none', cursor:'pointer', fontSize:'0.7rem', fontWeight:600,
                    background: genderF===g ? 'rgba(3,173,216,0.2)' : 'rgba(255,255,255,0.05)',
                    color: genderF===g ? 'var(--accent)' : '#666' }}>
                  {g.charAt(0).toUpperCase()+g.slice(1)}
                </button>
              ))}
              <button onClick={() => setCam(p => !p)}
                style={{ padding:'2px 10px', borderRadius:20, border:'none', cursor:'pointer', fontSize:'0.7rem', fontWeight:600,
                  background: camOnly ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                  color: camOnly ? '#ef4444' : '#666' }}>📷</button>
            </div>
          )}
        </div>
      )}
      {(tab === 'friends' || tab === 'staff') && (
        <div style={{ display:'flex', gap:4, padding:'6px 8px', background:'#111', borderBottom:'1px solid rgba(255,255,255,0.03)', flexShrink:0 }}>
          <SubTab label="Online"  active={tab==='friends' ? friendTab==='online'  : staffTab==='online'}
            onClick={() => tab==='friends' ? setFT('online') : setST('online')}
            count={tab==='friends' ? friendsOnline.length : (staffOnline.length || staffFromRoom.length)} />
          <SubTab label="Offline" active={tab==='friends' ? friendTab==='offline' : staffTab==='offline'}
            onClick={() => tab==='friends' ? setFT('offline') : setST('offline')}
            count={tab==='friends' ? friendsOffline.length : staffOffline.length} />
        </div>
      )}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
        {tab==='users'   && renderList(onlineF, 'No users online')}
        {tab==='search'  && (searching
          ? <p style={{ textAlign:'center', color:'#666', fontSize:'0.76rem', padding:16 }}>Searching...</p>
          : renderList(searchResults, search ? 'No results found' : 'Type to search'))}
        {tab==='friends' && (friendTab==='online' ? renderList(friendsOnline, 'No friends online') : renderList(friendsOffline, 'No offline friends'))}
        {tab==='staff'   && (staffTab==='online'  ? renderList(staffOnline.length ? staffOnline : staffFromRoom, 'No staff online') : renderList(staffOffline, 'No offline staff'))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FLYOUT SUBPANELS
// ═══════════════════════════════════════════════════════════════

function RoomListPanel({ onClose, nav, tObj }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const { accent, bg, header, text, border } = useTheme(tObj)

  useEffect(() => {
    const t = localStorage.getItem('cgz_token')
    fetch(`${API}/api/rooms?limit=50`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => { setRooms(d.rooms || d || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:bg }}>
      <FlyoutHeader icon="fa-solid fa-list" title="Room List" onClose={onClose} accent={accent} header={header} text={text} border={border} />
      <div style={{ flex:1, overflowY:'auto', padding:'6px 0' }}>
        {loading && <LoadingMsg />}
        {!loading && rooms.length === 0 && <EmptyMsg text="No rooms found" />}
        {rooms.map((room, i) => (
          <RoomListCard key={room._id || i} room={room} accent={accent} text={text} border={border}
            onClick={() => { nav(`/chat/${room.slug || room._id}`); onClose() }} />
        ))}
      </div>
    </div>
  )
}

function RoomListCard({ room, accent, text, border, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer',
        background: hov ? 'rgba(255,255,255,0.05)' : 'transparent',
        borderBottom:`1px solid ${border}22`, transition:'background .12s' }}>
      <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden', flexShrink:0,
        border:`1.5px solid ${hov ? accent : border}33`, transition:'border-color .12s' }}>
        <img src={room.icon || '/default_images/rooms/default_room.png'} alt=""
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
          onError={e => { e.target.src = '/default_images/rooms/default_room.png' }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
          {room.isPinned && <i className="fa-solid fa-thumbtack" style={{ fontSize:9, color:'#f59e0b' }} />}
          {room.password && <i className="fa-solid fa-lock" style={{ fontSize:9, color:'#9ca3af' }} />}
          <span style={{ fontSize:'0.83rem', fontWeight:700, color:text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{room.name}</span>
        </div>
        {room.description && <div style={{ fontSize:'0.68rem', color:'#666', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>{room.description}</div>}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:'0.68rem', fontWeight:700, color:(room.currentUsers||0)>0?'#22c55e':'#555', display:'flex', alignItems:'center', gap:3 }}>
            <i className="fa-solid fa-user" style={{ fontSize:9 }} />{room.currentUsers||0}
          </span>
          {room.category && <span style={{ fontSize:'0.65rem', background:'rgba(3,173,216,0.1)', color:'#03add8', padding:'1px 6px', borderRadius:20, fontWeight:600 }}>{room.category}</span>}
          {room.minRank && room.minRank!=='guest' && <span style={{ fontSize:'0.65rem', background:'rgba(255,255,255,0.06)', color:'#888', padding:'1px 6px', borderRadius:20, fontWeight:600 }}>{room.minRank}</span>}
        </div>
      </div>
    </div>
  )
}

function NewsPanel({ onClose, tObj }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const { accent, bg, header, text, border } = useTheme(tObj)

  useEffect(() => {
    const t = localStorage.getItem('cgz_token')
    fetch(`${API}/api/news`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => { setNews(d.news || d || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:bg }}>
      <FlyoutHeader icon="fa-regular fa-newspaper" title="News & Updates" onClose={onClose} accent={accent} header={header} text={text} border={border} />
      <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
        {loading && <LoadingMsg />}
        {!loading && news.length === 0 && <EmptyMsg text="No news yet" />}
        {news.map((item, i) => (
          <div key={item._id || i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10,
            border:`1px solid ${border}33`, padding:'12px', marginBottom:8 }}>
            <div style={{ fontSize:'0.85rem', fontWeight:700, color:text, marginBottom:5 }}>{item.title}</div>
            <div style={{ fontSize:'0.75rem', color:'#aaa', lineHeight:1.5 }}>{item.content}</div>
            {item.createdAt && <div style={{ fontSize:'0.65rem', color:'#555', marginTop:6 }}>
              <i className="fa-regular fa-clock" style={{ marginRight:4 }} />
              {new Date(item.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
            </div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function FriendWallPanel({ onClose, tObj }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [wallText, setWallText] = useState('')
  const [posting, setPosting] = useState(false)
  const { accent, bg, header, text, border } = useTheme(tObj)

  const load = useCallback(() => {
    const t = localStorage.getItem('cgz_token')
    fetch(`${API}/api/users/me/wall`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => { setPosts(d.posts || d || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function post() {
    if (!wallText.trim()) return
    setPosting(true)
    const t = localStorage.getItem('cgz_token')
    try {
      await fetch(`${API}/api/users/me/wall`, {
        method:'POST', headers:{ Authorization:`Bearer ${t}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ content: wallText.trim() })
      })
      setWallText(''); load()
    } catch {}
    setPosting(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:bg }}>
      <FlyoutHeader icon="fa-solid fa-users" title="Friend Wall" onClose={onClose} accent={accent} header={header} text={text} border={border} />
      <div style={{ padding:'10px 12px', borderBottom:`1px solid ${border}22`, flexShrink:0 }}>
        <textarea dir="ltr" value={wallText} onChange={e => setWallText(e.target.value)}
          placeholder="Write on your wall..." rows={2}
          style={{ width:'100%', padding:'8px 10px', background:'rgba(255,255,255,0.06)',
            border:`1px solid ${border}44`, borderRadius:8, color:text, fontSize:'0.78rem',
            resize:'none', outline:'none', boxSizing:'border-box', direction:'ltr',
            textAlign:'left', fontFamily:'inherit', lineHeight:1.5 }} />
        <button onClick={post} disabled={posting || !wallText.trim()}
          style={{ marginTop:6, padding:'6px 14px', borderRadius:20, border:'none',
            background: wallText.trim() ? accent : 'rgba(255,255,255,0.08)',
            color: wallText.trim() ? '#fff' : '#555', fontSize:'0.75rem', fontWeight:700,
            cursor: wallText.trim() ? 'pointer' : 'not-allowed' }}>
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
        {loading && <LoadingMsg />}
        {!loading && posts.length === 0 && <EmptyMsg text="No posts yet. Write something!" />}
        {posts.map((p, i) => (
          <div key={p._id || i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10,
            border:`1px solid ${border}22`, padding:'10px 12px', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <img src={p.author?.avatar||'/default_images/avatar/default_guest.png'} alt=""
                style={{ width:26, height:26, borderRadius:'50%', objectFit:'cover' }}
                onError={e => { e.target.src='/default_images/avatar/default_guest.png' }} />
              <span style={{ fontSize:'0.78rem', fontWeight:700, color:accent }}>{p.author?.username||'Unknown'}</span>
              {p.createdAt && <span style={{ fontSize:'0.65rem', color:'#555', marginLeft:'auto' }}>
                {new Date(p.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
              </span>}
            </div>
            <div style={{ fontSize:'0.78rem', color:text, lineHeight:1.5 }}>{p.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GamesFlyoutPanel({ onClose, socket, roomId, me, tObj }) {
  const { accent, bg, header, text, border } = useTheme(tObj)
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:bg }}>
      <FlyoutHeader icon="fa-solid fa-gamepad" title="Games" onClose={onClose} accent={accent} header={header} text={text} border={border} />
      <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>
        <GamesPanel socket={socket} roomId={roomId} myGold={me?.gold||0} tObj={tObj} />
      </div>
    </div>
  )
}

const LB_TABS = [
  { key:'gold',   label:'Top Gold',         icon:'fa-solid fa-coins',          color:'#f59e0b', field:'gold' },
  { key:'xp',     label:'Top XP',           icon:'fa-solid fa-bolt',           color:'#8b5cf6', field:'xp' },
  { key:'likes',  label:'Top Likes',        icon:'fa-solid fa-heart',          color:'#ec4899', field:'totalLikes' },
  { key:'gifts',  label:'Top Gifts',        icon:'fa-solid fa-gift',           color:'#22c55e', field:'totalGiftsReceived' },
  { key:'quiz',   label:'Top Quiz',         icon:'fa-solid fa-graduation-cap', color:'#06b6d4', field:'quizScore' },
  { key:'views',  label:'Top Views',        icon:'fa-solid fa-eye',            color:'#f97316', field:'profileViews' },
]
const LB_PERIODS = [
  { key:'all',     label:'All Time' },
  { key:'monthly', label:'Monthly' },
  { key:'weekly',  label:'Weekly' },
]

function LeaderboardPanel({ onClose, tObj }) {
  const [lbTab, setLbTab] = useState('gold')
  const [period, setPrd]  = useState('all')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { accent, bg, header, text, border } = useTheme(tObj)
  const activeTab = LB_TABS.find(t => t.key === lbTab) || LB_TABS[0]

  useEffect(() => {
    setLoading(true)
    const t = localStorage.getItem('cgz_token')
    fetch(`${API}/api/leaderboard?tab=${lbTab}&period=${period}&limit=20`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => { setUsers(d.users || d || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [lbTab, period])

  function fmt(n) { n=n||0; return n>=1000000?(n/1000000).toFixed(1)+'M':n>=1000?(n/1000).toFixed(1)+'K':n }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:bg }}>
      <FlyoutHeader icon="fa-solid fa-trophy" title="Leaderboard" onClose={onClose} accent={'#f59e0b'} header={header} text={text} border={border} />
      {/* category tabs */}
      <div style={{ display:'flex', gap:4, padding:'8px 10px', overflowX:'auto', flexShrink:0,
        borderBottom:`1px solid ${border}22`, background:header, scrollbarWidth:'none' }}>
        {LB_TABS.map(t => (
          <button key={t.key} onClick={() => setLbTab(t.key)}
            style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:20,
              border:`1px solid ${lbTab===t.key ? t.color : border+'44'}`,
              background: lbTab===t.key ? `${t.color}22` : 'transparent',
              color: lbTab===t.key ? t.color : '#666', fontSize:'0.68rem', fontWeight:700,
              cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'all .15s' }}>
            <i className={t.icon} style={{ fontSize:9 }} />{t.label}
          </button>
        ))}
      </div>
      {/* period tabs */}
      <div style={{ display:'flex', gap:4, padding:'6px 10px', flexShrink:0, borderBottom:`1px solid ${border}22` }}>
        {LB_PERIODS.map(p => (
          <button key={p.key} onClick={() => setPrd(p.key)}
            style={{ padding:'4px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:'0.7rem', fontWeight:600,
              background: period===p.key ? `${accent}22` : 'rgba(255,255,255,0.05)',
              color: period===p.key ? accent : '#666', transition:'all .12s' }}>{p.label}</button>
        ))}
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'6px 0' }}>
        {loading && <LoadingMsg />}
        {!loading && users.length===0 && <EmptyMsg text="No data yet" />}
        {users.map((u, i) => (
          <div key={u._id||i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
            borderBottom:`1px solid ${border}11`, transition:'background .1s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <div style={{ width:24, textAlign:'center', flexShrink:0 }}>
              {i===0?<span style={{fontSize:16}}>🥇</span>:i===1?<span style={{fontSize:16}}>🥈</span>:i===2?<span style={{fontSize:16}}>🥉</span>:<span style={{fontSize:'0.75rem',fontWeight:800,color:'#555'}}>#{i+1}</span>}
            </div>
            <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt=""
              style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}
              onError={e => { e.target.src='/default_images/avatar/default_guest.png' }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'0.8rem', fontWeight:700, color:text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.username}</div>
            </div>
            <span style={{ fontSize:'0.82rem', fontWeight:800, color:activeTab.color, flexShrink:0 }}>{fmt(u[activeTab.field])}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PremiumPanel({ onClose, tObj, me }) {
  const [plans, setPlans]   = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoad]  = useState(true)
  const [buying, setBuying] = useState('')
  const [currency, setCur]  = useState('gold')
  const [msg, setMsg]       = useState(null)
  const { accent, bg, header, text, border } = useTheme(tObj)
  const showMsg = (m, type='success') => { setMsg({m, type}); setTimeout(()=>setMsg(null), 3500) }

  useEffect(() => {
    const t = localStorage.getItem('cgz_token')
    fetch(`${API}/api/premium/status`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => { setStatus(d); setPlans(d.plans||[]); setLoad(false) })
      .catch(() => setLoad(false))
  }, [])

  async function purchase(planId) {
    if (!confirm('Purchase this plan?')) return
    setBuying(planId)
    const t = localStorage.getItem('cgz_token')
    try {
      const r = await fetch(`${API}/api/premium/purchase/${planId}`, {
        method:'POST', headers:{ Authorization:`Bearer ${t}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ currency })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error||'Failed')
      showMsg(`✅ ${d.message}`)
    } catch(e) { showMsg(e.message, 'error') }
    setBuying('')
  }

  const PLAN_COLORS = { prem7:'#06b6d4', prem30:'#aa44ff', prem90:'#f59e0b', prem365:'#ef4444' }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:bg }}>
      <FlyoutHeader icon="fa-solid fa-crown" title="Buy Premium" onClose={onClose} accent={'#f59e0b'} header={header} text={text} border={border} />
      {msg && <MsgBanner msg={msg} />}
      {status && (
        <div style={{ padding:'8px 12px', borderBottom:`1px solid ${border}22`, flexShrink:0 }}>
          <div style={{ display:'flex', gap:12, marginBottom:8 }}>
            <span style={{ fontSize:'0.78rem', color:'#f59e0b', fontWeight:700 }}>🪙 {(status.gold||0).toLocaleString()}</span>
            <span style={{ fontSize:'0.78rem', color:'#ef4444', fontWeight:700 }}>💎 {(status.ruby||0).toLocaleString()}</span>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {['gold','ruby'].map(c => (
              <button key={c} onClick={()=>setCur(c)}
                style={{ flex:1, padding:'5px', borderRadius:8,
                  border:`1px solid ${currency===c?(c==='gold'?'#f59e0b':'#ef4444'):border+'44'}`,
                  background: currency===c?(c==='gold'?'rgba(245,158,11,0.15)':'rgba(239,68,68,0.15)'):'transparent',
                  color: currency===c?(c==='gold'?'#f59e0b':'#ef4444'):'#666',
                  fontSize:'0.72rem', fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
                {c==='gold'?'🪙 Gold':'💎 Ruby'}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
        {loading && <LoadingMsg />}
        {plans.map(plan => {
          const price = currency==='ruby' ? plan.rubyPrice : plan.goldPrice
          const canAfford = currency==='ruby' ? (status?.ruby||0)>=plan.rubyPrice : (status?.gold||0)>=plan.goldPrice
          const planColor = PLAN_COLORS[plan.id]||'#aa44ff'
          const isBest = plan.id==='prem30'
          return (
            <div key={plan.id} style={{ background:`${planColor}0d`, borderRadius:12,
              border:`1.5px solid ${isBest?planColor:border+'44'}`, padding:'12px', marginBottom:8, position:'relative' }}>
              {isBest && <div style={{ position:'absolute', top:-8, right:10, background:planColor, color:'#fff',
                fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20 }}>POPULAR</div>}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:'0.88rem', fontWeight:800, color:planColor }}>{plan.label||plan.id}</span>
                <span style={{ fontSize:'0.7rem', color:'#888', background:'rgba(255,255,255,0.06)', padding:'2px 8px', borderRadius:20 }}>{plan.days} days</span>
              </div>
              <div style={{ fontSize:'1.1rem', fontWeight:900, color:text, marginBottom:4 }}>
                {(price||0).toLocaleString()} <span style={{ fontSize:'0.7rem', color:currency==='ruby'?'#ef4444':'#f59e0b', fontWeight:700 }}>{currency==='ruby'?'💎 Ruby':'🪙 Gold'}</span>
              </div>
              {plan.goldBonus>0 && <div style={{ fontSize:'0.7rem', color:'#22c55e', marginBottom:8 }}>+{plan.goldBonus?.toLocaleString()} Gold Bonus</div>}
              <button onClick={() => canAfford && purchase(plan.id)} disabled={!!buying||!canAfford}
                style={{ width:'100%', padding:'8px', borderRadius:8, border:'none',
                  background: canAfford ? planColor : 'rgba(255,255,255,0.06)',
                  color: canAfford ? '#fff' : '#555', fontSize:'0.78rem', fontWeight:700,
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {buying===plan.id ? <><i className="fa-solid fa-spinner fa-spin" /> Processing...</>
                  : canAfford ? <><i className="fa-solid fa-crown" /> Get Premium</>
                  : <><i className="fa-solid fa-lock" /> Not enough {currency}</>}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StorePanel({ onClose, tObj, me }) {
  const [view, setView]       = useState('main')
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState([])
  const [buying, setBuying]   = useState('')
  const [msg, setMsg]         = useState(null)
  const { accent, bg, header, text, border } = useTheme(tObj)
  const showMsg = (m, type='success') => { setMsg({m, type}); setTimeout(()=>setMsg(null), 3500) }

  useEffect(() => {
    if (view==='main') return
    setLoading(true)
    const t = localStorage.getItem('cgz_token')
    const ep = view==='coins' ? '/api/store/gold-packages' : '/api/store/ruby-packages'
    fetch(`${API}${ep}`, { headers:{ Authorization:`Bearer ${t}` } })
      .then(r => r.json()).then(d => { setPackages(d.packages||d||[]); setLoading(false) })
      .catch(() => { setPackages([]); setLoading(false) })
  }, [view])

  async function buyPackage(pkg) {
    if (!confirm(`Buy ${pkg.label||'this package'}?`)) return
    setBuying(pkg.id||pkg._id)
    const t = localStorage.getItem('cgz_token')
    try {
      const r = await fetch(`${API}/api/store/buy`, {
        method:'POST', headers:{ Authorization:`Bearer ${t}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ packageId:pkg.id||pkg._id, type:view })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error||'Failed')
      showMsg(`✅ ${d.message||'Purchase successful!'}`)
    } catch(e) { showMsg(e.message, 'error') }
    setBuying('')
  }

  const isCoins = view==='coins'
  const pkgColor = isCoins ? '#f59e0b' : '#ef4444'

  const titleMap = { main:'Store', coins:'Buy Gold Coins', ruby:'Buy Ruby' }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:bg }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 14px',
        borderBottom:`1px solid ${border}33`, background:header, flexShrink:0 }}>
        {view!=='main' && (
          <button onClick={()=>setView('main')} style={{ background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:14, padding:'0 6px 0 0' }}>
            <i className="fa-solid fa-chevron-left" />
          </button>
        )}
        <i className="fa-solid fa-store" style={{ color:accent, fontSize:14 }} />
        <span style={{ fontSize:'0.88rem', fontWeight:700, color:text, flex:1 }}>{titleMap[view]}</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:16, padding:4 }}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
      {msg && <MsgBanner msg={msg} />}
      {view==='main' && (
        <div style={{ flex:1, padding:'12px', display:'flex', flexDirection:'column', gap:10, overflowY:'auto' }}>
          <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, border:`1px solid ${border}33`, padding:'14px' }}>
            <div style={{ fontSize:'0.68rem', color:'#666', marginBottom:8, textTransform:'uppercase', letterSpacing:1, fontWeight:700 }}>Your Balance</div>
            <div style={{ display:'flex', gap:20 }}>
              <div><div style={{ fontSize:'1.3rem', fontWeight:900, color:'#f59e0b' }}>🪙 {(me?.gold||0).toLocaleString()}</div><div style={{ fontSize:'0.65rem', color:'#666' }}>Gold</div></div>
              <div><div style={{ fontSize:'1.3rem', fontWeight:900, color:'#ef4444' }}>💎 {(me?.ruby||0).toLocaleString()}</div><div style={{ fontSize:'0.65rem', color:'#666' }}>Ruby</div></div>
            </div>
          </div>
          {[
            { id:'coins', emoji:'🪙', label:'Buy Gold Coins', sub:'Use for gifts, games & more', color:'#f59e0b' },
            { id:'ruby',  emoji:'💎', label:'Buy Ruby',        sub:'Premium currency for exclusive items', color:'#ef4444' },
          ].map(btn => (
            <button key={btn.id} onClick={()=>setView(btn.id)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'14px', borderRadius:12,
                border:`1.5px solid ${btn.color}33`, background:`${btn.color}08`,
                cursor:'pointer', textAlign:'left', transition:'all .15s', width:'100%' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=btn.color}
              onMouseLeave={e=>e.currentTarget.style.borderColor=`${btn.color}33`}>
              <div style={{ width:44, height:44, borderRadius:10, background:`${btn.color}15`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{btn.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'0.9rem', fontWeight:800, color:btn.color }}>{btn.label}</div>
                <div style={{ fontSize:'0.72rem', color:'#888' }}>{btn.sub}</div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ color:'#555', fontSize:12 }} />
            </button>
          ))}
        </div>
      )}
      {(view==='coins'||view==='ruby') && (
        <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
          {loading && <LoadingMsg />}
          {!loading && packages.length===0 && <EmptyMsg text="No packages available right now." />}
          {packages.map((pkg, i) => (
            <div key={pkg.id||pkg._id||i}
              style={{ background:`${pkgColor}0d`, borderRadius:12, border:`1.5px solid ${pkgColor}22`,
                padding:'12px', marginBottom:8, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontSize:28, flexShrink:0 }}>{isCoins?'🪙':'💎'}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'0.85rem', fontWeight:800, color:pkgColor }}>{pkg.label||(pkg.amount?.toLocaleString()+(isCoins?' Gold':' Ruby'))}</div>
                {pkg.bonus>0 && <div style={{ fontSize:'0.68rem', color:'#22c55e' }}>+{pkg.bonus?.toLocaleString()} Bonus</div>}
                <div style={{ fontSize:'0.72rem', color:'#888' }}>${pkg.priceUSD||pkg.price||'?'} USD</div>
              </div>
              <button onClick={()=>buyPackage(pkg)} disabled={!!buying}
                style={{ padding:'7px 14px', borderRadius:8, border:'none', background:pkgColor,
                  color:'#fff', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', flexShrink:0, opacity:buying?0.6:1 }}>
                {buying===(pkg.id||pkg._id)?<i className="fa-solid fa-spinner fa-spin"/>:'Buy'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UsernameChangePanel({ onClose, tObj, me, onUpdated }) {
  const [username, setUsername] = useState(me?.username||'')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvail]   = useState(null)
  const checkTimer = useRef(null)
  const { accent, bg, header, text, border } = useTheme(tObj)

  function handleChange(val) {
    setUsername(val); setError(''); setSuccess(''); setAvail(null)
    if (val.length<3 || val===me?.username) return
    clearTimeout(checkTimer.current); setChecking(true)
    checkTimer.current = setTimeout(() => {
      const t = localStorage.getItem('cgz_token')
      fetch(`${API}/api/users/check-username?username=${encodeURIComponent(val)}`, { headers:{ Authorization:`Bearer ${t}` } })
        .then(r=>r.json()).then(d=>{setAvail(d.available);setChecking(false)})
        .catch(()=>setChecking(false))
    }, 500)
  }

  async function save() {
    const val = username.trim()
    if (!val || val===me?.username) return
    if (val.length<3) { setError('Min 3 characters'); return }
    if (val.length>20) { setError('Max 20 characters'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) { setError('Letters, numbers and _ only'); return }
    setLoading(true); setError('')
    const t = localStorage.getItem('cgz_token')
    try {
      const r = await fetch(`${API}/api/users/me/username`, {
        method:'PUT', headers:{ Authorization:`Bearer ${t}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ username:val })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error||'Failed')
      setSuccess('Username updated!'); onUpdated?.({ username:val })
      setTimeout(()=>onClose(), 1800)
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const unchanged = username.trim()===me?.username
  const isValid = username.length>=3 && username.length<=20 && /^[a-zA-Z0-9_]+$/.test(username)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:bg }}>
      <FlyoutHeader icon="fa-solid fa-user-pen" title="Change Username" onClose={onClose} accent={accent} header={header} text={text} border={border} />
      <div style={{ flex:1, padding:'14px', overflow:'auto' }}>
        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, border:`1px solid ${border}33`, padding:'10px 14px', marginBottom:14 }}>
          <div style={{ fontSize:'0.68rem', color:'#666', textTransform:'uppercase', letterSpacing:1, fontWeight:700, marginBottom:3 }}>Current</div>
          <div style={{ fontSize:'0.95rem', fontWeight:800, color:text }}>{me?.username}</div>
        </div>
        <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#888', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>New Username</label>
        <div style={{ position:'relative', marginBottom:5 }}>
          <input dir="ltr" value={username} onChange={e=>handleChange(e.target.value)}
            placeholder="Enter new username" maxLength={20}
            style={{ width:'100%', padding:'10px 38px 10px 12px', background:'rgba(255,255,255,0.07)',
              border:`1.5px solid ${error?'#ef4444':available===true?'#22c55e':available===false?'#ef4444':border+'44'}`,
              borderRadius:10, color:text, fontSize:'0.9rem', outline:'none', boxSizing:'border-box',
              direction:'ltr', textAlign:'left', transition:'border-color .2s' }}
            onFocus={e=>{ if(!error) e.target.style.borderColor=accent }}
            onBlur={e=>{ if(!error) e.target.style.borderColor=`${border}44` }} />
          <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:14 }}>
            {checking && <i className="fa-solid fa-spinner fa-spin" style={{color:'#666'}} />}
            {!checking && available===true && !unchanged && <i className="fa-solid fa-check" style={{color:'#22c55e'}} />}
            {!checking && available===false && <i className="fa-solid fa-xmark" style={{color:'#ef4444'}} />}
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14, fontSize:'0.7rem' }}>
          <span style={{ color: error?'#ef4444':success?'#22c55e':available===true&&!unchanged?'#22c55e':available===false?'#ef4444':'transparent' }}>
            {error||success||(available===true&&!unchanged?'Username available!':(available===false?'Username taken':'‌'))}
          </span>
          <span style={{ color:'#555' }}>{username.length}/20</span>
        </div>
        <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, border:`1px solid ${border}22`, padding:'10px 12px', marginBottom:14 }}>
          <div style={{ fontSize:'0.68rem', color:'#666', marginBottom:5, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>Requirements</div>
          {[
            { ok:username.length>=3,                   label:'3+ characters' },
            { ok:username.length<=20,                  label:'Max 20 characters' },
            { ok:/^[a-zA-Z0-9_]*$/.test(username)||!username, label:'Letters, numbers, _ only' },
            { ok:!unchanged||!username,                label:'Different from current' },
          ].map((r,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:7, fontSize:'0.74rem',
              color:r.ok?'#22c55e':'#555', marginBottom:3 }}>
              <i className={`fa-solid ${r.ok?'fa-check':'fa-circle'}`} style={{ fontSize:9 }} />{r.label}
            </div>
          ))}
        </div>
        <button onClick={save} disabled={loading||!isValid||unchanged||available===false}
          style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', fontWeight:800, fontSize:'0.88rem',
            cursor:(loading||!isValid||unchanged||available===false)?'not-allowed':'pointer',
            background:(!isValid||unchanged||available===false)?'rgba(255,255,255,0.06)':accent,
            color:(!isValid||unchanged||available===false)?'#444':'#fff', transition:'all .2s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          {loading ? <><i className="fa-solid fa-spinner fa-spin"/> Saving...</> : <><i className="fa-solid fa-check"/> Save Username</>}
        </button>
      </div>
    </div>
  )
}

// ── Shared tiny helpers ────────────────────────────────────
function useTheme(tObj) {
  return {
    accent: tObj?.accent || '#03add8',
    bg:     tObj?.bg_sidebar || tObj?.bg_chat || '#080808',
    header: tObj?.bg_header  || '#111111',
    text:   tObj?.text       || '#ffffff',
    border: tObj?.default_color || '#222222',
  }
}

function FlyoutHeader({ icon, title, onClose, accent, header, text, border, onBack }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
      borderBottom:`1px solid ${border}33`, background:header, flexShrink:0 }}>
      {onBack && <button onClick={onBack} style={{ background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:14, padding:'0 6px 0 0', lineHeight:1 }}><i className="fa-solid fa-chevron-left"/></button>}
      <i className={icon} style={{ color:accent, fontSize:14 }} />
      <span style={{ fontSize:'0.88rem', fontWeight:700, color:text, flex:1 }}>{title}</span>
      <button onClick={onClose} style={{ background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:16, padding:4 }}>
        <i className="fa-solid fa-xmark"/>
      </button>
    </div>
  )
}
function LoadingMsg() { return <p style={{ textAlign:'center', color:'#666', padding:20, fontSize:'0.8rem' }}>Loading...</p> }
function EmptyMsg({ text }) { return <p style={{ textAlign:'center', color:'#666', padding:20, fontSize:'0.8rem' }}>{text}</p> }
function MsgBanner({ msg }) {
  return (
    <div style={{ margin:'8px 12px', padding:'8px 12px', borderRadius:8, fontSize:'0.78rem', fontWeight:600,
      background: msg.type==='error'?'rgba(239,68,68,0.15)':'rgba(34,197,94,0.15)',
      color: msg.type==='error'?'#ef4444':'#22c55e',
      border:`1px solid ${msg.type==='error'?'rgba(239,68,68,0.3)':'rgba(34,197,94,0.3)'}` }}>
      {msg.m}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LEFT SIDEBAR — complete redesign
// ═══════════════════════════════════════════════════════════════
function LeftSidebar({ room, nav, socket, roomId, onClose, me, tObj, onStyleSaved, onOpenProfile, onOpenSettings }) {
  const [flyout, setFlyout] = useState(null)
  const { accent, bg, header, text, border } = useTheme(tObj)
  const SIDEBAR_W = 230
  const FLYOUT_W  = 280
  const isMobile  = typeof window !== 'undefined' && window.innerWidth < 768

  function openFlyout(id) { setFlyout(prev => prev===id ? null : id) }
  function closeFlyout() { setFlyout(null) }

  const menuItems = [
    { icon:'fa-solid fa-list',          label:'Room List',       flyoutId:'rooms',       chevron:true },
    { icon:'fa-regular fa-newspaper',   label:'News',            flyoutId:'news',        chevron:true },
    { icon:'fa-solid fa-users',         label:'Friend Wall',     flyoutId:'friendwall',  chevron:true },
    { icon:'fa-solid fa-comments',      label:'Forum',           fn:()=>{ window.open('/forum','_blank') } },
    { icon:'fa-solid fa-envelope',      label:'Contact Us',      fn:()=>{ window.open('/contact','_blank') } },
    { icon:'fa-solid fa-user-pen',      label:'Username Change', flyoutId:'username',    chevron:true },
    { icon:'fa-solid fa-gamepad',       label:'Games',           flyoutId:'games',       chevron:true },
    { icon:'fa-solid fa-trophy',        label:'Leaderboard',     flyoutId:'leaderboard', chevron:true },
    { icon:'fa-solid fa-crown',         label:'Buy Premium',     flyoutId:'premium',     chevron:true, rankIcon:true },
    { icon:'fa-solid fa-store',         label:'Store',           flyoutId:'store',       chevron:true },
  ]

  return (
    <>
      {/* Main sidebar */}
      <div style={{ width:SIDEBAR_W, flexShrink:0, display:'flex', flexDirection:'column',
        background:bg, borderRight:`1px solid ${border}33`, zIndex:50, position:'relative', height:'100%', overflow:'hidden' }}>
        {/* Room header */}
        <div style={{ padding:'12px 14px', borderBottom:`1px solid ${border}33`,
          background:header, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          {room?.image
            ? <img src={room.image} alt="" style={{ width:36, height:36, borderRadius:9, objectFit:'cover', flexShrink:0, border:`1.5px solid ${border}55` }} onError={e=>e.target.style.display='none'} />
            : <div style={{ width:36, height:36, borderRadius:9, background:`${accent}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <i className="fa-solid fa-comments" style={{ color:accent, fontSize:16 }} />
              </div>
          }
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:'0.85rem', fontWeight:800, color:text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {room?.name||'Chat Room'}
            </div>
            <div style={{ fontSize:'0.68rem', color:`${text}55`, marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.3 }}>
              {room?.description || room?.category || ''}
            </div>
          </div>
          <button onClick={()=>{ closeFlyout(); onClose?.() }}
            style={{ background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:16, padding:4, flexShrink:0, borderRadius:5 }}>
            <i className="fa-solid fa-xmark"/>
          </button>
        </div>

        {/* Menu items */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          {menuItems.map((item, i) => {
            const isActive = flyout===item.flyoutId && !!item.flyoutId
            return (
              <div key={i} onClick={()=>{ if(item.fn){item.fn();onClose?.()}else if(item.flyoutId) openFlyout(item.flyoutId) }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', cursor:'pointer',
                  background: isActive ? `${accent}12` : 'transparent',
                  borderBottom:`1px solid ${border}18`, transition:'background .12s',
                  borderLeft: isActive ? `3px solid ${accent}` : '3px solid transparent' }}
                onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
                onMouseLeave={e=>{ e.currentTarget.style.background = isActive ? `${accent}12` : 'transparent' }}>
                <i className={item.icon} style={{ fontSize:15, color: isActive ? accent : `${accent}bb`, width:20, textAlign:'center', flexShrink:0 }} />
                <span style={{ flex:1, fontSize:'0.85rem', fontWeight:600, color: isActive ? text : `${text}cc` }}>{item.label}</span>
                {item.rankIcon && <i className="fa-solid fa-crown" style={{ fontSize:11, color:'#f59e0b', marginRight:4, flexShrink:0 }} />}
                {item.chevron && (
                  <i className={`fa-solid fa-chevron-${isActive ? 'left' : 'right'}`}
                    style={{ fontSize:10, color:'#444', flexShrink:0, transition:'transform .15s' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {room && (
          <div style={{ padding:'8px 14px', borderTop:`1px solid ${border}22`, background:header, flexShrink:0 }}>
            <div style={{ fontSize:'0.68rem', color:'#555', display:'flex', gap:10, flexWrap:'wrap' }}>
              {room.category && <span><i className="fa-solid fa-tag" style={{ marginRight:3, color:`${accent}99` }} />{room.category}</span>}
              {room.language && <span><i className="fa-solid fa-globe" style={{ marginRight:3, color:`${accent}99` }} />{room.language}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Flyout panel */}
      {flyout && (
        <div style={{ width:FLYOUT_W, flexShrink:0, display:'flex', flexDirection:'column',
          background:bg, borderRight:`1px solid ${border}33`, height:'100%',
          position: isMobile ? 'fixed' : 'relative',
          left: isMobile ? SIDEBAR_W : 'auto',
          top: isMobile ? 50 : 'auto',
          bottom: 0,
          zIndex: isMobile ? 310 : 49,
          boxShadow:'4px 0 20px rgba(0,0,0,0.4)', overflow:'hidden' }}>
          {flyout==='rooms'       && <RoomListPanel onClose={closeFlyout} nav={nav} tObj={tObj} />}
          {flyout==='news'        && <NewsPanel onClose={closeFlyout} tObj={tObj} />}
          {flyout==='friendwall'  && <FriendWallPanel onClose={closeFlyout} tObj={tObj} />}
          {flyout==='games'       && <GamesFlyoutPanel onClose={closeFlyout} socket={socket} roomId={roomId} me={me} tObj={tObj} />}
          {flyout==='leaderboard' && <LeaderboardPanel onClose={closeFlyout} tObj={tObj} />}
          {flyout==='premium'     && <PremiumPanel onClose={closeFlyout} tObj={tObj} me={me} />}
          {flyout==='store'       && <StorePanel onClose={closeFlyout} tObj={tObj} me={me} />}
          {flyout==='username'    && <UsernameChangePanel onClose={closeFlyout} tObj={tObj} me={me} onUpdated={u=>{ onStyleSaved?.(u); closeFlyout() }} />}
        </div>
      )}
    </>
  )
}

export { RightSidebar, LeftSidebar }
