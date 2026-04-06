// ============================================================
// ChatSidebars.jsx — CodyChat Dark Theme
// - Left sidebar: dark #080808 bg (--bg-sidebar)
// - Right sidebar: #151515 panel (--bg-chat)
// - All borders, hovers, tab pills match CodyChat Dark.css
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { API, R, RL, GBR, RANKS, isStaff, isAdmin, resolveNameColor } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'
import { GamesPanel } from './ChatGames.jsx'

const ST_COLOR = { online: '#22c55e', away: '#f59e0b', busy: '#ef4444', invisible: '#9ca3af' }
const ST_ICON  = { online: 'fa-solid fa-circle', away: 'fa-regular fa-clock', busy: 'fa-solid fa-ban', invisible: 'fa-solid fa-eye-slash' }

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

// ── User list item — CodyChat .ulist_item style ────────────
function UserItem({ u, onClick, onWhisper, showMood = true, th, myId }) {
  const [hov, setHov] = useState(false)
  const nameStyle = resolveNameStyle(u)
  const status = u.status || 'online'
  const isMe = String(u._id || u.userId) === String(myId)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px', cursor: 'pointer',
        // CodyChat .blisting + .bhover
        background: hov ? 'rgba(255,255,255,0.05)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        transition: 'background .12s', position: 'relative',
      }}
    >
      {/* Avatar + status dot */}
      <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => onClick?.(u, e)}>
        <img
          src={u.avatar || '/default_images/avatar/default_guest.png'}
          alt=""
          style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${GBR(u.gender, u.rank)}`, display: 'block' }}
          onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }}
        />
        <span style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 8, height: 8, background: ST_COLOR[status] || '#22c55e',
          borderRadius: '50%', border: '1.5px solid #151515',
        }} />
      </div>

      {/* Name + mood */}
      <div style={{ flex: 1, minWidth: 0 }} onClick={e => onClick?.(u, e)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {u.isCamHost && <i className="fa-solid fa-video" style={{ fontSize: 9, color: '#ef4444', flexShrink: 0 }} />}
          <span style={{
            fontSize: '0.8rem', fontWeight: 700,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: 110, color: '#ffffff',
            ...nameStyle,
          }}>
            {u.username}
          </span>
        </div>
        {showMood && u.mood && (
          <div style={{ fontSize: '0.65rem', color: '#666666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
            {u.mood}
          </div>
        )}
      </div>

      {/* Rank + flag */}
      <RIcon rank={u.rank} size={14} />
      {u.countryCode && u.countryCode !== 'ZZ' && (
        <img src={`/icons/flags/${u.countryCode.toUpperCase()}.png`} alt="" style={{ width: 14, height: 10, flexShrink: 0, borderRadius: 1 }} onError={e => e.target.style.display = 'none'} />
      )}

      {/* Whisper on hover */}
      {hov && !isMe && onWhisper && (
        <button
          onClick={e => { e.stopPropagation(); onWhisper({ ...u, userId: u._id || u.userId }) }}
          title="Whisper"
          style={{
            position: 'absolute', right: 6,
            background: 'rgba(124,58,237,0.18)',
            border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: 6, color: '#a78bfa',
            cursor: 'pointer', fontSize: 10,
            padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 3,
          }}>
          <i className="fa-solid fa-hand-lizard" style={{ fontSize: 10 }} />
        </button>
      )}
    </div>
  )
}

// ── RIGHT SIDEBAR ──────────────────────────────────────────
function RightSidebar({ users, myLevel, myId, onUserClick, onWhisper, onClose, tObj }) {
  const [tab, setTab]       = useState('users')
  const [search, setSearch] = useState('')
  const [genderF, setGF]    = useState('all')
  const [camOnly, setCam]   = useState(false)
  const [friendTab, setFT]  = useState('online')
  const [staffTab, setST]   = useState('online')
  const [friends, setFriends]   = useState([])
  const [staffAll, setStaff]    = useState([])
  const [isMobile, setMob]  = useState(window.innerWidth < 768)

  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768)
    window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn)
  }, [])

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

  const visible = users.filter(u => u.status !== 'invisible')
  function applyFilters(list) {
    return list.filter(u => {
      if (genderF !== 'all' && u.gender !== genderF) return false
      if (camOnly && !u.isCamHost) return false
      return true
    })
  }
  const sorted = [...visible].sort((a, b) => RL(b.rank) - RL(a.rank) || (a.username || '').localeCompare(b.username || ''))
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef(null)
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

  const TABS = [
    { id: 'users',   icon: 'fa-solid fa-users',              title: 'Users' },
    { id: 'friends', icon: 'fa-solid fa-user-group',         title: 'Friends' },
    { id: 'staff',   icon: 'fa-solid fa-user-shield',        title: 'Staff' },
    { id: 'search',  icon: 'fa-solid fa-magnifying-glass',   title: 'Search' },
  ]

  const onlineFriendsIds = new Set(visible.map(u => String(u._id || u.userId)))
  const friendsOnline  = friends.filter(f => onlineFriendsIds.has(String(f._id || f.userId)))
  const friendsOffline = friends.filter(f => !onlineFriendsIds.has(String(f._id || f.userId)))
  const onlineStaffIds = new Set(visible.filter(u => RL(u.rank) >= 11).map(u => String(u._id || u.userId)))
  const staffOnline  = staffAll.filter(s => onlineStaffIds.has(String(s._id || s.userId)))
  const staffOffline = staffAll.filter(s => !onlineStaffIds.has(String(s._id || s.userId)))
  const staffFromRoom = sorted.filter(u => RL(u.rank) >= 11)
  const onlineF = applyFilters(sorted)

  function renderList(list, fallback) {
    if (!list.length) return <p style={{ textAlign: 'center', color: '#666', fontSize: '0.76rem', padding: '16px 10px' }}>{fallback}</p>
    return list.map((u, i) => (
      <UserItem key={u.userId || u._id || i} u={u} onClick={onUserClick} onWhisper={onWhisper} myId={myId} />
    ))
  }

  // Sub-tab pill — CodyChat style
  function SubTab({ id, label, active, count, onClick }) {
    return (
      <button onClick={onClick} style={{
        padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
        background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active ? '#ffffff' : '#666',
        transition: 'all .12s',
      }}>
        {label}{count !== undefined ? ` (${count})` : ''}
      </button>
    )
  }

  const sideWidth = isMobile ? '100vw' : 220

  return (
    <div style={{
      width: sideWidth, flexShrink: 0, display: 'flex', flexDirection: 'column',
      // CodyChat .bsidebar
      background: '#080808',
      borderLeft: '1px solid rgba(255,255,255,0.05)',
      overflow: 'hidden',
      ...(isMobile ? { position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 300 } : {}),
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: '#111111', flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
          Users ({visible.length})
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 16, padding: 4, borderRadius: 5 }}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {/* Tab bar — CodyChat .bmenu style */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#111111', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} title={t.title}
            style={{
              flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', fontSize: 14,
              background: 'none',
              color: tab === t.id ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'color .12s, border-color .12s',
            }}>
            <i className={t.icon} />
          </button>
        ))}
      </div>

      {/* Filter row (users + search tabs) */}
      {(tab === 'users' || tab === 'search') && (
        <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)', flexShrink: 0, background: '#111' }}>
          {tab === 'search' && (
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              style={{
                width: '100%', padding: '6px 10px',
                background: '#191919', border: '1px solid #222',
                borderRadius: 20, color: '#ffffff', fontSize: '0.78rem',
              }}
            />
          )}
          {tab === 'users' && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['all','male','female'].map(g => (
                <button key={g} onClick={() => setGF(g)} style={{
                  padding: '2px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: '0.7rem', fontWeight: 600,
                  background: genderF === g ? 'rgba(3,173,216,0.2)' : 'rgba(255,255,255,0.05)',
                  color: genderF === g ? 'var(--accent)' : '#666',
                }}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
              <button onClick={() => setCam(p => !p)} style={{
                padding: '2px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: '0.7rem', fontWeight: 600,
                background: camOnly ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                color: camOnly ? '#ef4444' : '#666',
              }}>
                📷
              </button>
            </div>
          )}
        </div>
      )}

      {/* Friends / Staff sub-tabs */}
      {(tab === 'friends' || tab === 'staff') && (
        <div style={{ display: 'flex', gap: 4, padding: '6px 8px', background: '#111', borderBottom: '1px solid rgba(255,255,255,0.03)', flexShrink: 0 }}>
          <SubTab id="online"  label="Online"  active={tab === 'friends' ? friendTab === 'online'  : staffTab === 'online'}
            onClick={() => tab === 'friends' ? setFT('online') : setST('online')}
            count={tab === 'friends' ? friendsOnline.length : (staffOnline.length || staffFromRoom.length)} />
          <SubTab id="offline" label="Offline" active={tab === 'friends' ? friendTab === 'offline' : staffTab === 'offline'}
            onClick={() => tab === 'friends' ? setFT('offline') : setST('offline')}
            count={tab === 'friends' ? friendsOffline.length : staffOffline.length} />
        </div>
      )}

      {/* List area */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {tab === 'users' && renderList(onlineF, 'No users online')}
        {tab === 'search' && (
          searching
            ? <p style={{ textAlign: 'center', color: '#666', fontSize: '0.76rem', padding: 16 }}>Searching...</p>
            : renderList(searchResults, search ? 'No results found' : 'Type to search')
        )}
        {tab === 'friends' && (
          friendTab === 'online'
            ? renderList(friendsOnline, 'No friends online')
            : renderList(friendsOffline, 'No offline friends')
        )}
        {tab === 'staff' && (
          staffTab === 'online'
            ? renderList(staffOnline.length ? staffOnline : staffFromRoom, 'No staff online')
            : renderList(staffOffline, 'No offline staff')
        )}
      </div>
    </div>
  )
}

// ── LEFT SIDEBAR ───────────────────────────────────────────
// Matches CodyChat's left nav drawer: dark sidebar, icon rows
function LeftSidebar({ room, nav, socket, roomId, onClose, me, tObj, onStyleSaved }) {
  const [showGames, setShowGames] = useState(false)

  const menuItems = [
    { icon: 'fa-solid fa-house-chimney-user', label: 'Rooms',       fn: () => nav('/chat') },
    { icon: 'fa-solid fa-address-card',       label: 'My Profile',  fn: () => nav('/profile') },
    { icon: 'fa-sharp fa-solid fa-medal',     label: 'Leaderboard', fn: () => nav('/leaderboard') },
    { icon: 'fa-solid fa-gift',               label: 'Gifts',       fn: () => nav('/gifts') },
    { icon: 'fa-solid fa-store',              label: 'Premium',     fn: () => nav('/premium') },
    { icon: 'fa-solid fa-dice',               label: 'Games',       fn: () => setShowGames(p => !p) },
  ]

  return (
    <div style={{
      width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column',
      // CodyChat .bsidebar
      background: '#080808',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      zIndex: 50, position: 'relative',
    }}>
      {/* Room info header */}
      <div style={{
        padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: '#111111', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        {room?.image && (
          <img src={room.image} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {room?.name || 'Chat Room'}
          </div>
          {room?.category && (
            <div style={{ fontSize: '0.7rem', color: '#666', marginTop: 1 }}>{room.category}</div>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0, borderRadius: 5 }}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {/* Nav items — CodyChat .sub_list_item style */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {menuItems.map((item, i) => (
          <SidebarItem key={i} icon={item.icon} label={item.label} onClick={item.fn} />
        ))}

        {showGames && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 4 }}>
            <GamesPanel socket={socket} roomId={roomId} me={me} tObj={tObj} />
          </div>
        )}
      </div>

      {/* Room stats footer */}
      {room && (
        <div style={{
          padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)',
          background: '#111111', flexShrink: 0,
        }}>
          <div style={{ fontSize: '0.7rem', color: '#666', display: 'flex', gap: 12 }}>
            {room.category && <span><i className="fa-solid fa-tag" style={{ marginRight: 4, color: '#03add8' }} />{room.category}</span>}
            {room.language && <span><i className="fa-solid fa-globe" style={{ marginRight: 4, color: '#03add8' }} />{room.language}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// Sidebar nav row — matches CodyChat .sub_list_item + .blisting + .bhover
function SidebarItem({ icon, label, onClick, active }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px', cursor: 'pointer',
        background: active
          ? 'rgba(3,173,216,0.12)'
          : hov
            ? 'rgba(255,255,255,0.04)'
            : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        transition: 'background .12s',
      }}
    >
      <i className={icon} style={{ fontSize: 16, color: active ? 'var(--accent)' : '#03add8', width: 20, textAlign: 'center', flexShrink: 0 }} />
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: active ? 'var(--accent)' : '#ffffff' }}>{label}</span>
    </div>
  )
}

export { RightSidebar, LeftSidebar }
