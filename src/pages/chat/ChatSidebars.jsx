// ============================================================
// ChatSidebars.jsx — ChatsGenZ v4
// LEFT SIDEBAR: full menu with flyout subpanels overlaying chatroom
// RIGHT SIDEBAR: user list with tabs
// CHANGES v4:
//  - Left sidebar flyouts open AS OVERLAY on chatroom (not push-aside)
//  - Right sidebar: staff tab shows total (online+offline) with breakdown
//  - Right sidebar: friends tab same — all shown, online/offline breakdown
//  - UserList: filter = icon only (no text "filter" button)
//  - UserList: mood shown under username
//  - UserList: status icons shown; invisible users hidden from list
//  - Search: gender dropdown, rank dropdown, activity dropdown
//  - Username change costs 500 gold coins (shown in UI)
//  - Leaderboard has sub-menu (top XP, gold, gifts, likes, profile views)
//  - Room list styled like lobby cards
//  - System messages suppressed (no join/leave/announce in feed)
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
// Shows: avatar + status dot, cam icon, username (styled), rank icon, mood, country flag
// On hover: whisper button appears on right
function UserItem({ u, onClick, onWhisper, showMood = true, myId }) {
  const [hov, setHov] = useState(false)
  const nameStyle = resolveNameStyle(u)
  const status = u.status || 'online'
  const isMe = String(u._id || u.userId) === String(myId)
  const statusColor = ST_COLOR[status] || '#22c55e'

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', cursor:'pointer',
        background: hov ? 'rgba(255,255,255,0.05)' : 'transparent',
        borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'background .12s', position:'relative' }}>

      {/* Avatar + status dot */}
      <div style={{ position:'relative', flexShrink:0 }} onClick={e => onClick?.(u, e)}>
        <img src={u.avatar || '/default_images/avatar/default_guest.png'} alt=""
          style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:`2px solid ${GBR(u.gender, u.rank)}`, display:'block' }}
          onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }} />
        <span style={{ position:'absolute', bottom:0, right:0, width:9, height:9,
          background: statusColor, borderRadius:'50%', border:'2px solid #111', flexShrink:0 }} />
      </div>

      {/* Name + mood + rank */}
      <div style={{ flex:1, minWidth:0 }} onClick={e => onClick?.(u, e)}>
        {/* Row 1: cam icon + username + rank icon */}
        <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:1 }}>
          {u.isCamHost && (
            <img src="/default_images/icons/webcam.svg" alt="cam"
              style={{ width:10, height:10, flexShrink:0, opacity:0.9 }}
              onError={e => { e.target.style.display='none' }} />
          )}
          <span style={{ fontSize:'0.8rem', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            maxWidth:100, color:'#ffffff', ...nameStyle }}>{u.username}</span>
          <RIcon rank={u.rank} size={13} />
        </div>

        {/* Row 2: mood (italic, muted) */}
        {showMood && u.mood && (
          <div style={{ fontSize:'0.62rem', color:'#666', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontStyle:'italic', lineHeight:1.2 }}>
            "{u.mood}"
          </div>
        )}

        {/* Row 3: status text + country flag */}
        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:1 }}>
          {status !== 'online' && (
            <span style={{ fontSize:'0.55rem', fontWeight:700, color: statusColor, textTransform:'uppercase', letterSpacing:0.5 }}>
              {status}
            </span>
          )}
          {u.countryCode && u.countryCode !== 'ZZ' && (
            <img src={`/icons/flags/${u.countryCode.toUpperCase()}.png`} alt=""
              style={{ width:13, height:9, flexShrink:0, borderRadius:1 }}
              onError={e => e.target.style.display='none'} />
          )}
        </div>
      </div>

      {/* Whisper button on hover */}
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
  const acc = tObj?.accent||'#03add8'
  const bg  = tObj?.bg_chat||'#080808'
  const hdr = tObj?.bg_header||'#111111'
  const txt = tObj?.text||'#fff'
  const brd = tObj?.default_color||'#222'
  const [tab, setTab]       = useState('users')
  const [search, setSearch] = useState('')
  const [genderF, setGF]    = useState('all')
  const [rankF, setRF]      = useState('all')
  const [activityF, setAF]  = useState('newest')
  const [camOnly, setCam]   = useState(false)
  const [friendTab, setFT]  = useState('all')
  const [staffTab, setST]   = useState('all')
  const [friends, setFriends]   = useState([])
  const [staffAll, setStaff]    = useState([])
  const searchTimer = useRef(null)
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

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
      const rq = rankF !== 'all' ? `&rank=${rankF}` : ''
      const aq = activityF !== 'newest' ? `&sort=${activityF}` : ''
      fetch(`${API}/api/users/search?q=${encodeURIComponent(search)}${gq}${rq}${aq}&limit=30`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json()).then(d => setSearchResults(d.users || [])).catch(() => {})
        .finally(() => setSearching(false))
    }, 350)
    return () => clearTimeout(searchTimer.current)
  }, [search, genderF, rankF, activityF, tab])

  // Filter out invisible users from lists
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
  const onlineStaffIds = new Set(visible.filter(u => RL(u.rank) >= 11).map(u => String(u._id || u.userId)))
  const staffOnline    = staffAll.filter(s => onlineStaffIds.has(String(s._id || s.userId)))
  const staffOffline   = staffAll.filter(s => !onlineStaffIds.has(String(s._id || s.userId)))
  const staffFromRoom  = sorted.filter(u => RL(u.rank) >= 11)

  function renderList(list, fallback) {
    if (!list.length) return <p style={{ textAlign:'center', color:'#666', fontSize:'0.76rem', padding:'16px 10px' }}>{fallback}</p>
    return list.map((u, i) => <UserItem key={u.userId || u._id || i} u={u} onClick={onUserClick} onWhisper={onWhisper} myId={myId} />)
  }

  // Staff: show all (online + offline) with section dividers
  function renderStaffAll() {
    const onlineList = staffOnline.length ? staffOnline : staffFromRoom
    const offlineList = staffOffline
    if (!onlineList.length && !offlineList.length) return <p style={{ textAlign:'center', color:'#666', fontSize:'0.76rem', padding:'16px 10px' }}>No staff found</p>
    return (
      <>
        {onlineList.length > 0 && (
          <>
            <div style={{ padding:'4px 10px', fontSize:'0.65rem', fontWeight:700, color:'#22c55e', textTransform:'uppercase', letterSpacing:1, background:'rgba(34,197,94,0.07)', borderBottom:'1px solid rgba(34,197,94,0.1)' }}>
              🟢 Online ({onlineList.length})
            </div>
            {onlineList.map((u, i) => <UserItem key={u.userId || u._id || 'so'+i} u={u} onClick={onUserClick} onWhisper={onWhisper} myId={myId} />)}
          </>
        )}
        {offlineList.length > 0 && (
          <>
            <div style={{ padding:'4px 10px', fontSize:'0.65rem', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:1, background:'rgba(136,136,136,0.07)', borderBottom:'1px solid rgba(136,136,136,0.1)' }}>
              ⚫ Offline ({offlineList.length})
            </div>
            {offlineList.map((u, i) => <UserItem key={u.userId || u._id || 'sf'+i} u={{...u, status:'offline'}} onClick={onUserClick} onWhisper={onWhisper} myId={myId} />)}
          </>
        )}
      </>
    )
  }

  // Friends: show all with section dividers
  function renderFriendsAll() {
    if (!friends.length) return <p style={{ textAlign:'center', color:'#666', fontSize:'0.76rem', padding:'16px 10px' }}>No friends yet</p>
    return (
      <>
        {friendsOnline.length > 0 && (
          <>
            <div style={{ padding:'4px 10px', fontSize:'0.65rem', fontWeight:700, color:'#22c55e', textTransform:'uppercase', letterSpacing:1, background:'rgba(34,197,94,0.07)', borderBottom:'1px solid rgba(34,197,94,0.1)' }}>
              🟢 Online ({friendsOnline.length})
            </div>
            {friendsOnline.map((u, i) => <UserItem key={u.userId || u._id || 'fo'+i} u={u} onClick={onUserClick} onWhisper={onWhisper} myId={myId} />)}
          </>
        )}
        {friendsOffline.length > 0 && (
          <>
            <div style={{ padding:'4px 10px', fontSize:'0.65rem', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:1, background:'rgba(136,136,136,0.07)', borderBottom:'1px solid rgba(136,136,136,0.1)' }}>
              ⚫ Offline ({friendsOffline.length})
            </div>
            {friendsOffline.map((u, i) => <UserItem key={u.userId || u._id || 'ff'+i} u={{...u, status:'offline'}} onClick={onUserClick} onWhisper={onWhisper} myId={myId} />)}
          </>
        )}
      </>
    )
  }

  const TABS = [
    { id:'users',   icon:'fa-solid fa-users',            title:'Users' },
    { id:'friends', icon:'fa-solid fa-user-group',       title:'Friends' },
    { id:'staff',   icon:'fa-solid fa-user-shield',      title:'Staff' },
    { id:'search',  icon:'fa-solid fa-magnifying-glass', title:'Search' },
  ]

  const RANK_OPTIONS = [
    { value:'all', label:'All Ranks' },
    ...Object.entries(RANKS || {}).map(([k,v]) => ({ value:k, label:v.label || k }))
  ]

  const totalFriends = friends.length
  const totalStaff = (staffOnline.length || staffFromRoom.length) + staffOffline.length

  return (
    <div style={{ width:220, flexShrink:0, display:'flex', flexDirection:'column',
      background:bg, borderLeft:`1px solid ${brd}22`, overflow:'hidden', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 12px', borderBottom:`1px solid ${brd}18`, background:hdr, flexShrink:0 }}>
        <span style={{ fontSize:'0.82rem', fontWeight:700, color:txt }}>
          {tab === 'users'   && `Users (${visible.length})`}
          {tab === 'friends' && `Friends (${totalFriends})`}
          {tab === 'staff'   && `Staff (${totalStaff})`}
          {tab === 'search'  && 'Search'}
        </span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:16, padding:4, borderRadius:5 }}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
      <div style={{ display:'flex', borderBottom:`1px solid ${brd}18`, background:hdr, flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} title={t.title}
            style={{ flex:1, padding:'9px 0', border:'none', cursor:'pointer', fontSize:14, background:'none',
              color: tab===t.id ? acc : 'rgba(255,255,255,0.35)',
              borderBottom: tab===t.id ? `2px solid ${acc}` : '2px solid transparent',
              transition:'color .12s, border-color .12s' }}>
            <i className={t.icon} />
          </button>
        ))}
      </div>

      {/* Users tab filter bar — icon only filter button */}
      {tab === 'users' && (
        <div style={{ padding:'5px 8px', borderBottom:`1px solid ${brd}18`, flexShrink:0, background:hdr }}>
          <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap' }}>
            {['all','male','female'].map(g => (
              <button key={g} onClick={() => setGF(g)}
                style={{ padding:'2px 8px', borderRadius:20, border:'none', cursor:'pointer', fontSize:'0.68rem', fontWeight:600,
                  background: genderF===g ? `${acc}22` : 'rgba(255,255,255,0.05)',
                  color: genderF===g ? acc : '#666' }}>
                {g === 'all' ? 'All' : g === 'male' ? '♂' : '♀'}
              </button>
            ))}
            <button onClick={() => setCam(p => !p)}
              style={{ padding:'2px 8px', borderRadius:20, border:'none', cursor:'pointer', fontSize:'0.7rem', fontWeight:600,
                background: camOnly ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                color: camOnly ? '#ef4444' : '#666' }}>📷</button>
            <button onClick={() => setShowFilters(p => !p)} title="Filter"
              style={{ marginLeft:'auto', padding:'3px 6px', borderRadius:6, border:'none', cursor:'pointer', fontSize:13,
                background: showFilters ? `${acc}22` : 'rgba(255,255,255,0.05)',
                color: showFilters ? acc : '#666' }}>
              <i className="fa-solid fa-sliders" />
            </button>
          </div>
        </div>
      )}

      {/* Search tab */}
      {tab === 'search' && (
        <div style={{ padding:'6px 8px', borderBottom:`1px solid ${brd}18`, flexShrink:0, background:hdr }}>
          <input dir="ltr" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            style={{ width:'100%', padding:'6px 10px', background:`${bg}`,
              borderRadius:20, color:txt, fontSize:'0.78rem', direction:'ltr', textAlign:'left',
              outline:'none', boxSizing:'border-box', marginBottom:6, border:'none' }} />
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            <select value={genderF} onChange={e => setGF(e.target.value)}
              style={{ flex:1, padding:'4px 6px', borderRadius:6, border:'none', background:bg,
                color:txt, fontSize:'0.7rem', outline:'none', cursor:'pointer' }}>
              <option value="all">All Genders</option>
              <option value="male">Male ♂</option>
              <option value="female">Female ♀</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
            <select value={rankF} onChange={e => setRF(e.target.value)}
              style={{ flex:1, padding:'4px 6px', borderRadius:6, border:'none', background:bg,
                color:txt, fontSize:'0.7rem', outline:'none', cursor:'pointer' }}>
              {RANK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={activityF} onChange={e => setAF(e.target.value)}
              style={{ flex:1, padding:'4px 6px', borderRadius:6, border:'none', background:bg,
                color:txt, fontSize:'0.7rem', outline:'none', cursor:'pointer' }}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="last_active">Last Active</option>
              <option value="staff">Staff First</option>
            </select>
          </div>
        </div>
      )}

      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
        {tab==='users'   && renderList(onlineF, 'No users online')}
        {tab==='search'  && (searching
          ? <p style={{ textAlign:'center', color:'#666', fontSize:'0.76rem', padding:16 }}>Searching...</p>
          : renderList(searchResults, search ? 'No results found' : 'Type to search'))}
        {tab==='friends' && renderFriendsAll()}
        {tab==='staff'   && renderStaffAll()}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FLYOUT SUBPANELS
// ═══════════════════════════════════════════════════════════════

// Room list styled like ChatLobby cards
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
      <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
        {loading && <LoadingMsg />}
        {!loading && rooms.length === 0 && <EmptyMsg text="No rooms found" />}
        {rooms.map((room, i) => (
          <LobbyRoomCard key={room._id || i} room={room} accent={accent} text={text} border={border} bg={bg}
            onClick={() => { nav(`/chat/${room.slug || room._id}`); onClose() }} />
        ))}
      </div>
    </div>
  )
}

// Lobby-style room card (matches ChatLobby RoomCard style)
function LobbyRoomCard({ room, accent, text, border, bg, onClick }) {
  const [hov, setHov] = useState(false)
  const ROOM_TYPE_COLORS = {
    public:  { color:'#22c55e', bg:'rgba(34,197,94,0.12)',  icon:'fa-solid fa-globe',      label:'Public' },
    private: { color:'#f59e0b', bg:'rgba(245,158,11,0.12)', icon:'fa-solid fa-lock',       label:'Private' },
    vip:     { color:'#a78bfa', bg:'rgba(167,139,250,0.12)',icon:'fa-solid fa-crown',      label:'VIP' },
    staff:   { color:'#ef4444', bg:'rgba(239,68,68,0.12)',  icon:'fa-solid fa-user-shield',label:'Staff' },
  }
  const typeInfo = ROOM_TYPE_COLORS[room.type] || ROOM_TYPE_COLORS.public
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{ background: hov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
        border:`1.5px solid ${hov ? accent : border+'33'}`,
        borderRadius:12, cursor:'pointer', transition:'all .18s', marginBottom:8,
        boxShadow: hov ? `0 4px 18px ${accent}22` : '0 1px 4px rgba(0,0,0,.2)',
        transform: hov ? 'translateY(-1px)' : 'none' }}>
      <div style={{ display:'flex', alignItems:'center', padding:'10px 12px', gap:10 }}>
        <div style={{ width:50, height:50, borderRadius:10, overflow:'hidden', flexShrink:0,
          border:`1.5px solid ${hov ? accent : border+'44'}`, transition:'border-color .15s' }}>
          <img src={room.icon || '/default_images/rooms/default_room.png'} alt=""
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
            onError={e => { e.target.src = '/default_images/rooms/default_room.png' }} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
            {room.isPinned && <i className="fa-solid fa-thumbtack" style={{ fontSize:9, color:'#f59e0b', flexShrink:0 }} />}
            {room.password && <i className="fa-solid fa-lock" style={{ fontSize:9, color:'#9ca3af', flexShrink:0 }} />}
            <span style={{ fontSize:'0.88rem', fontWeight:800, color:text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{room.name}</span>
          </div>
          {room.description && <div style={{ fontSize:'0.7rem', color:'#888', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>{room.description}</div>}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:typeInfo.bg, color:typeInfo.color, fontSize:'0.62rem', fontWeight:700, padding:'2px 6px', borderRadius:20 }}>
              <i className={typeInfo.icon} style={{ fontSize:8 }} />{typeInfo.label}
            </span>
            {room.category && <span style={{ fontSize:'0.62rem', background:'rgba(3,173,216,0.1)', color:'#03add8', padding:'2px 6px', borderRadius:20, fontWeight:600 }}>{room.category}</span>}
            <div style={{ flex:1 }} />
            <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:'0.75rem', fontWeight:800, color:(room.currentUsers||0)>0?'#22c55e':'#555' }}>
              <i className="fa-solid fa-user" style={{ fontSize:10 }} />{room.currentUsers||0}
            </span>
          </div>
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

// ── LEADERBOARD with sub-menu ─────────────────────────────────
const LB_TABS = [
  { key:'xp',     label:'XP',     icon:'fa-solid fa-bolt',        color:'#8b5cf6', field:'xp',                 img:'/default_images/menu/top_xp.svg' },
  { key:'level',  label:'Level',  icon:'fa-solid fa-layer-group', color:'#6366f1', field:'level',              img:'/default_images/menu/top_level.svg' },
  { key:'gold',   label:'Gold',   icon:'fa-solid fa-coins',       color:'#f59e0b', field:'gold',               img:'/default_images/menu/top_gold.svg' },
  { key:'gifts',  label:'Gifts',  icon:'fa-solid fa-gift',        color:'#22c55e', field:'totalGiftsReceived', img:'/default_images/menu/top_gift.svg' },
  { key:'likes',  label:'Likes',  icon:'fa-solid fa-heart',       color:'#ec4899', field:'totalLikes',         img:'/default_images/menu/top_like.svg' },
]
const LB_PERIODS = [
  { key:'all',     label:'All Time' },
  { key:'monthly', label:'Monthly' },
  { key:'weekly',  label:'Weekly' },
]

function LeaderboardPanel({ onClose, tObj }) {
  const [lbTab, setLbTab] = useState('xp')
  const [period, setPrd]  = useState('all')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { accent, bg, header, text, border } = useTheme(tObj)
  const activeTab = LB_TABS.find(t => t.key === lbTab) || LB_TABS[0]

  useEffect(() => {
    setLoading(true)
    const t = localStorage.getItem('cgz_token')
    fetch(`${API}/api/leaderboard/${lbTab}?period=${period}&limit=20`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => { setUsers(d.users || d || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [lbTab, period])

  function fmt(n) { n=n||0; return n>=1000000?(n/1000000).toFixed(1)+'M':n>=1000?(n/1000).toFixed(1)+'K':n }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:bg }}>
      <FlyoutHeader icon="fa-solid fa-trophy" title="Leaderboard" onClose={onClose} accent={'#f59e0b'} header={header} text={text} border={border} />
      {/* Sub-menu tabs — match CodyChat PHP leaderboard_menu */}
      <div style={{ overflowX:'auto', scrollbarWidth:'none', flexShrink:0, borderBottom:`1px solid ${border}22`, background:header }}>
        <div style={{ display:'flex', gap:2, padding:'6px 8px', minWidth:'max-content' }}>
          {LB_TABS.map(t => (
            <button key={t.key} onClick={() => setLbTab(t.key)}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'5px 10px', borderRadius:10,
                border:`1px solid ${lbTab===t.key ? t.color : border+'44'}`,
                background: lbTab===t.key ? `${t.color}22` : 'transparent',
                color: lbTab===t.key ? t.color : '#666', fontSize:'0.6rem', fontWeight:700,
                cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'all .15s', minWidth:44 }}>
              {t.img
                ? <img src={t.img} alt={t.label} style={{ width:20, height:20, objectFit:'contain' }}
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }} />
                : null}
              <i className={t.icon} style={{ fontSize:13, display: t.img ? 'none' : 'block' }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Period sub-menu */}
      <div style={{ display:'flex', gap:3, padding:'5px 8px', flexShrink:0, borderBottom:`1px solid ${border}22` }}>
        {LB_PERIODS.map(p => (
          <button key={p.key} onClick={() => setPrd(p.key)}
            style={{ padding:'3px 10px', borderRadius:20, border:'none', cursor:'pointer', fontSize:'0.68rem', fontWeight:600,
              background: period===p.key ? `${activeTab.color}22` : 'rgba(255,255,255,0.05)',
              color: period===p.key ? activeTab.color : '#666', transition:'all .12s' }}>{p.label}</button>
        ))}
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'4px 0' }}>
        {loading && <LoadingMsg />}
        {!loading && users.length===0 && <EmptyMsg text="No data yet" />}
        {users.map((u, i) => (
          <div key={u._id||i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px',
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

// Username Change — costs 500 gold coins
function UsernameChangePanel({ onClose, tObj, me, onUpdated }) {
  const [username, setUsername] = useState(me?.username||'')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvail]   = useState(null)
  const checkTimer = useRef(null)
  const { accent, bg, header, text, border } = useTheme(tObj)
  const COST = 500

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
    if ((me?.gold||0) < COST) { setError(`You need ${COST} gold coins to change your username`); return }
    setLoading(true); setError('')
    const t = localStorage.getItem('cgz_token')
    try {
      const r = await fetch(`${API}/api/users/me/username`, {
        method:'PUT', headers:{ Authorization:`Bearer ${t}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ username:val })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error||'Failed')
      setSuccess('Username updated! 500 gold deducted.'); onUpdated?.({ username:val })
      setTimeout(()=>onClose(), 1800)
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const unchanged = username.trim()===me?.username
  const isValid = username.length>=3 && username.length<=20 && /^[a-zA-Z0-9_]+$/.test(username)
  const canAfford = (me?.gold||0) >= COST

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:bg }}>
      <FlyoutHeader icon="fa-solid fa-user-pen" title="Change Username" onClose={onClose} accent={accent} header={header} text={text} border={border} />
      <div style={{ flex:1, padding:'14px', overflow:'auto' }}>
        {/* Cost banner */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
          <i className="fa-solid fa-coins" style={{ color:'#f59e0b', fontSize:16 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'0.82rem', fontWeight:800, color:'#f59e0b' }}>Costs 500 Gold Coins</div>
            <div style={{ fontSize:'0.7rem', color:'#888' }}>Your balance: 🪙 {(me?.gold||0).toLocaleString()}</div>
          </div>
          {!canAfford && <span style={{ fontSize:'0.7rem', color:'#ef4444', fontWeight:700 }}>Insufficient</span>}
        </div>

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
            { ok:canAfford,                            label:`500 Gold (you have ${(me?.gold||0).toLocaleString()})` },
          ].map((r,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:7, fontSize:'0.74rem',
              color:r.ok?'#22c55e':'#555', marginBottom:3 }}>
              <i className={`fa-solid ${r.ok?'fa-check':'fa-circle'}`} style={{ fontSize:9 }} />{r.label}
            </div>
          ))}
        </div>
        <button onClick={save} disabled={loading||!isValid||unchanged||available===false||!canAfford}
          style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', fontWeight:800, fontSize:'0.88rem',
            cursor:(loading||!isValid||unchanged||available===false||!canAfford)?'not-allowed':'pointer',
            background:(!isValid||unchanged||available===false||!canAfford)?'rgba(255,255,255,0.06)':accent,
            color:(!isValid||unchanged||available===false||!canAfford)?'#444':'#fff', transition:'all .2s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          {loading ? <><i className="fa-solid fa-spinner fa-spin"/> Saving...</> : <><i className="fa-solid fa-coins" style={{color:'#f59e0b'}}/> Spend 500 Gold & Save</>}
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
// LEFT SIDEBAR — flyout opens as overlay over chatroom
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// LEFT SIDEBAR — CodyChat PHP style, mobile-first
// Mobile: narrow 52px icon strip + full-width flyout overlay
// Desktop: 230px full sidebar + 300px flyout overlay
// ═══════════════════════════════════════════════════════════════
function LeftSidebar({ room, nav, socket, roomId, onClose, me, tObj, onStyleSaved, onOpenProfile, onOpenSettings }) {
  const [flyout, setFlyout] = useState(null)
  const { accent, bg, header, text, border } = useTheme(tObj)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const ICON_W   = 52   // narrow icon strip on mobile
  const SIDEBAR_W = isMobile ? ICON_W : 230
  const FLYOUT_W  = isMobile ? window.innerWidth - ICON_W : 300

  function openFlyout(id) { setFlyout(prev => prev===id ? null : id) }
  function closeFlyout() { setFlyout(null) }

  const menuItems = [
    { icon:'fa-solid fa-house-user',    label:'Room List',       flyoutId:'rooms',       title:'Room List' },
    { icon:'fa-solid fa-newspaper',     label:'News',            flyoutId:'news',        title:'News' },
    { icon:'fa-solid fa-rss',           label:'Friend Wall',     flyoutId:'friendwall',  title:'Friend Wall' },
    { icon:'fa-solid fa-dice',          label:'Games',           flyoutId:'games',       title:'Games' },
    { icon:'fa-solid fa-store',         label:'Store',           flyoutId:'store',       title:'Store' },
    { icon:'fa-solid fa-medal',         label:'Leaderboard',     flyoutId:'leaderboard', title:'Leaderboard' },
    { icon:'fa-solid fa-crown',         label:'Buy Premium',     flyoutId:'premium',     title:'Premium', gold:true },
    { icon:'fa-solid fa-user-pen',      label:'Username Change', flyoutId:'username',    title:'Change Username', badge:'500' },
    { icon:'fa-solid fa-life-ring',     label:'Help',            fn:()=>{ window.open('/help','_blank') }, title:'Help' },
    { icon:'fa-solid fa-envelope',      label:'Contact Us',      fn:()=>{ window.open('/contact','_blank') }, title:'Contact' },
  ]

  // Call action buttons (audio/video/group calls)
  const callActions = [
    {
      icon: 'fa-solid fa-phone',
      label: 'Audio Call',
      color: '#22c55e',
      title: 'Start Audio Call',
      fn: () => { socket?.emit('requestAudioCall', { roomId }); toast?.('📞 Starting audio call...') }
    },
    {
      icon: 'fa-solid fa-video',
      label: 'Video Call',
      color: '#3b82f6',
      title: 'Start Video Call',
      fn: () => { socket?.emit('requestVideoCall', { roomId }); toast?.('🎥 Starting video call...') }
    },
    {
      icon: 'fa-solid fa-users',
      label: 'Group Call',
      color: '#8b5cf6',
      title: 'Start Group Call',
      fn: () => { socket?.emit('requestGroupCall', { roomId }); toast?.('👥 Starting group call...') }
    },
  ]

  function toast(msg) {
    try {
      const el = document.createElement('div')
      el.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:8px 16px;borderRadius:20px;fontSize:0.8rem;zIndex:9999;pointerEvents:none;fontWeight:600'
      el.textContent = msg
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 3000)
    } catch {}
  }

  return (
    <>
      {/* ── Icon strip (always visible when sidebar is open) ── */}
      <div style={{
        width: SIDEBAR_W, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: bg, borderRight: `1px solid ${border}33`,
        zIndex: 50, position: 'relative', height: '100%', overflow: 'hidden',
      }}>
        {/* Top: room thumb + close */}
        <div style={{
          padding: isMobile ? '10px 0' : '12px 14px',
          borderBottom: `1px solid ${border}33`, background: header,
          display: 'flex', alignItems: 'center',
          justifyContent: isMobile ? 'center' : 'flex-start',
          gap: 10, flexShrink: 0,
        }}>
          {isMobile ? (
            <button onClick={() => { closeFlyout(); onClose?.() }}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 18, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-xmark" />
            </button>
          ) : (
            <>
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
              <button onClick={() => { closeFlyout(); onClose?.() }}
                style={{ background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:16, padding:4, flexShrink:0, borderRadius:5 }}>
                <i className="fa-solid fa-xmark"/>
              </button>
            </>
          )}
        </div>

        {/* Menu items */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          {menuItems.map((item, i) => {
            const isActive = flyout === item.flyoutId && !!item.flyoutId
            return (
              <div key={i}
                title={item.title}
                onClick={() => { if(item.fn){ item.fn(); onClose?.() } else if(item.flyoutId) openFlyout(item.flyoutId) }}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: isMobile ? 0 : 10,
                  padding: isMobile ? '13px 0' : '11px 14px',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  cursor: 'pointer',
                  background: isActive ? `${accent}18` : 'transparent',
                  borderBottom: `1px solid ${border}18`,
                  borderLeft: isActive ? `3px solid ${accent}` : '3px solid transparent',
                  transition: 'background .12s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if(!isActive) e.currentTarget.style.background='rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.background = isActive ? `${accent}18` : 'transparent' }}>
                <i className={item.icon} style={{ fontSize: isMobile ? 18 : 15, color: isActive ? accent : `${accent}cc`, width: isMobile ? 'auto' : 20, textAlign:'center', flexShrink:0 }} />
                {!isMobile && (
                  <>
                    <span style={{ flex:1, fontSize:'0.85rem', fontWeight:600, color: isActive ? text : `${text}cc` }}>{item.label}</span>
                    {item.badge && (
                      <span style={{ fontSize:'0.6rem', fontWeight:800, color:'#f59e0b', background:'rgba(245,158,11,0.12)', padding:'1px 5px', borderRadius:10, flexShrink:0 }}>
                        🪙{item.badge}
                      </span>
                    )}
                    {item.gold && <i className="fa-solid fa-crown" style={{ fontSize:11, color:'#f59e0b', marginRight:4, flexShrink:0 }} />}
                    {item.flyoutId && (
                      <i className={`fa-solid fa-chevron-${isActive ? 'down' : 'right'}`}
                        style={{ fontSize:10, color:'#444', flexShrink:0 }} />
                    )}
                  </>
                )}
                {/* Mobile: badge dot */}
                {isMobile && item.badge && (
                  <span style={{ position:'absolute', top:7, right:7, width:8, height:8, background:'#f59e0b', borderRadius:'50%' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Footer info (desktop only) */}
        {!isMobile && room && (
          <div style={{ padding:'8px 14px', borderTop:`1px solid ${border}22`, background:header, flexShrink:0 }}>
            <div style={{ fontSize:'0.68rem', color:'#555', display:'flex', gap:10, flexWrap:'wrap' }}>
              {room.category && <span><i className="fa-solid fa-tag" style={{ marginRight:3, color:`${accent}99` }} />{room.category}</span>}
              {room.language && <span><i className="fa-solid fa-globe" style={{ marginRight:3, color:`${accent}99` }} />{room.language}</span>}
            </div>
          </div>
        )}

        {/* ── Call Action Buttons ── */}
        <div style={{
          padding: isMobile ? '8px 6px' : '8px 10px',
          borderTop: `1px solid ${border}22`,
          background: header,
          flexShrink: 0,
          display: 'flex',
          gap: 5,
          justifyContent: isMobile ? 'center' : 'stretch',
        }}>
          {callActions.map((ca, i) => (
            <button key={i} onClick={ca.fn} title={ca.title}
              style={{
                flex: isMobile ? '0 0 auto' : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: isMobile ? 0 : 5,
                padding: isMobile ? '7px 10px' : '7px 6px',
                border: `1px solid ${ca.color}33`,
                borderRadius: 9,
                background: `${ca.color}14`,
                color: ca.color,
                cursor: 'pointer',
                fontSize: isMobile ? 15 : 12,
                fontWeight: 700,
                transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${ca.color}28`; e.currentTarget.style.borderColor = `${ca.color}66` }}
              onMouseLeave={e => { e.currentTarget.style.background = `${ca.color}14`; e.currentTarget.style.borderColor = `${ca.color}33` }}
            >
              <i className={ca.icon} />
              {!isMobile && <span style={{ fontSize:'0.65rem' }}>{ca.label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Flyout panel — overlay on chatroom ── */}
      {flyout && (
        <>
          {/* Click-away backdrop — behind flyout, in front of chat */}
          <div onClick={closeFlyout}
            style={{ position:'fixed', inset:0, zIndex:290, background:'rgba(0,0,0,0.45)' }} />
          <div style={{
            position: 'fixed',
            left: SIDEBAR_W,
            top: 50,
            bottom: 0,
            width: FLYOUT_W,
            zIndex: 295,
            display: 'flex',
            flexDirection: 'column',
            background: bg,
            borderRight: `1px solid ${border}33`,
            boxShadow: '8px 0 28px rgba(0,0,0,0.6)',
            overflow: 'hidden',
          }}>
            {flyout==='rooms'       && <RoomListPanel    onClose={closeFlyout} nav={nav} tObj={tObj} />}
            {flyout==='news'        && <NewsPanel        onClose={closeFlyout} tObj={tObj} />}
            {flyout==='friendwall'  && <FriendWallPanel  onClose={closeFlyout} tObj={tObj} />}
            {flyout==='games'       && <GamesFlyoutPanel onClose={closeFlyout} socket={socket} roomId={roomId} me={me} tObj={tObj} />}
            {flyout==='leaderboard' && <LeaderboardPanel onClose={closeFlyout} tObj={tObj} />}
            {flyout==='premium'     && <PremiumPanel     onClose={closeFlyout} tObj={tObj} me={me} />}
            {flyout==='store'       && <StorePanel       onClose={closeFlyout} tObj={tObj} me={me} />}
            {flyout==='username'    && <UsernameChangePanel onClose={closeFlyout} tObj={tObj} me={me} onUpdated={u=>{ onStyleSaved?.(u); closeFlyout() }} />}
          </div>
        </>
      )}
    </>
  )
}

export { RightSidebar, LeftSidebar }
