// ============================================================
// ChatSidebars.jsx
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { API, R, RL, GBR, RANKS, isStaff, isAdmin, resolveNameColor } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'
import { GamesPanel } from './ChatGames.jsx'

// ─── Status dot colours ──────────────────────────────────────
const ST_COLOR = { online:'#22c55e', away:'#f59e0b', busy:'#ef4444', invisible:'#9ca3af' }
const ST_ICON  = { online:'fi-sr-circle',away:'fi-sr-clock',busy:'fi-sr-ban',invisible:'fi-sr-eye-crossed' }

// Full font map for username display
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
const SOLID_COLORS=['#ff3333','#ff6633','#ff9933','#ffcc33','#cccc00','#99cc00','#59b300','#829356','#008000','#00e639','#00e673','#00e6ac','#00cccc','#03add8','#3366ff','#107896','#004d99','#6633ff','#9933ff','#cc33ff','#ff33ff','#ff33cc','#ff3399','#ff3366','#604439','#795548','#a97f70','#bc9b8f','#9E9E9E','#879fab','#698796','#495f69']
const BUB_GRADS=['linear-gradient(135deg,#ff0000,#ff6600)','linear-gradient(135deg,#ff6600,#ffcc00)','linear-gradient(135deg,#ffcc00,#00cc00)','linear-gradient(135deg,#00cc00,#00ccff)','linear-gradient(135deg,#00ccff,#0066ff)','linear-gradient(135deg,#0066ff,#9900ff)','linear-gradient(135deg,#9900ff,#ff0099)','linear-gradient(135deg,#ff0099,#ff6600)','linear-gradient(135deg,#e040fb,#3f51b5)','linear-gradient(135deg,#43e97b,#38f9d7)','linear-gradient(135deg,#f093fb,#f5576c)','linear-gradient(135deg,#4facfe,#00f2fe)','linear-gradient(135deg,#fa709a,#fee140)','linear-gradient(135deg,#a18cd1,#fbc2eb)','linear-gradient(135deg,#ffecd2,#fcb69f)','linear-gradient(135deg,#ff9a9e,#fecfef)']

function resolveNameStyle(u) {
  const ri = R(u.rank)
  const base = resolveNameColor(u.nameColor, ri.color)
  const font = u.nameFont ? FONT_MAP[u.nameFont] : undefined
  if (u.nameColor?.startsWith('bgrad')) {
    const idx = parseInt(u.nameColor.replace('bgrad',''))-1
    const grad = BUB_GRADS[idx]
    if (grad) return { background:grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontFamily:font||'inherit' }
  }
  if (u.nameColor?.startsWith('bcolor')) {
    const idx = parseInt(u.nameColor.replace('bcolor',''))-1
    return { color: SOLID_COLORS[idx]||ri.color, fontFamily:font||'inherit' }
  }
  return { color: base||ri.color, fontFamily:font||'inherit' }
}

// ─────────────────────────────────────────────────────────────
// USER ITEM (used in all lists)
// ─────────────────────────────────────────────────────────────
function UserItem({u, onClick, showMood=true, th}) {
  const [hov,setHov]=useState(false)
  const nameStyle = resolveNameStyle(u)
  const status = u.status||'online'
  const thB = th || { bg_header:'#fff', text:'#111827', default_color:'#e4e6ea', accent:'#1a73e8' }

  // Status badge: icon + color per status
  const stColor = ST_COLOR[status]||'#22c55e'
  const stIcon  = ST_ICON[status]||'fi-sr-circle'

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={()=>onClick?.(u)}
      style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',cursor:'pointer',
        background:hov?`${thB.accent||'#1a73e8'}12`:'transparent',transition:'background .12s'}}>
      {/* Avatar + status icon badge */}
      <div style={{position:'relative',flexShrink:0}}>
        <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt=""
          style={{width:30,height:30,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${GBR(u.gender,u.rank)}`,display:'block'}}
          onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        {/* Status badge — icon changes per status */}
        <span style={{
          position:'absolute',bottom:-1,right:-1,width:13,height:13,
          background:stColor,borderRadius:'50%',border:'1.5px solid #fff',
          display:'flex',alignItems:'center',justifyContent:'center',
        }}>
          <i className={`fi ${stIcon}`} style={{fontSize:6,color:'#fff',lineHeight:1}}/>
        </span>
      </div>
      {/* Name + mood */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          {u.isCamHost&&<i className="fi fi-sr-video-camera" style={{fontSize:9,color:'#ef4444',flexShrink:0}}/>}
          <span style={{fontSize:'0.8rem',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:110,...nameStyle}}>
            {u.username}
          </span>
        </div>
        {/* Mood shown below username */}
        {showMood&&u.mood&&(
          <div style={{fontSize:'0.63rem',color:thB.text+'77',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:1,display:'flex',alignItems:'center',gap:3}}>
            <i className="fi fi-sr-face-smile" style={{fontSize:8,flexShrink:0}}/>
            <span>{u.mood}</span>
          </div>
        )}
      </div>
      <RIcon rank={u.rank} size={14}/>
      {u.countryCode&&u.countryCode!=='ZZ'&&(
        <img src={`/icons/flags/${u.countryCode.toUpperCase()}.png`} alt=""
          style={{width:14,height:10,flexShrink:0,borderRadius:1}} onError={e=>e.target.style.display='none'}/>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RIGHT SIDEBAR — full spec implementation
// ─────────────────────────────────────────────────────────────
function RightSidebar({users, myLevel, onUserClick, onWhisper, onClose, tObj}) {
  const [tab,setTab]      = useState('users')
  const [search,setSearch]= useState('')
  const [genderF,setGF]   = useState('all')   // all|male|female
  const [camOnly,setCam]  = useState(false)
  const [friendTab,setFT] = useState('online') // online|offline
  const [staffTab,setST]  = useState('online')
  const [friends,setFriends] = useState([])
  const [staffAll,setStaff]  = useState([])
  const [staffLoading,setStaffLoading] = useState(false)
  const [isMobile,setMob] = useState(window.innerWidth<768)

  const th = tObj||{bg_header:'#fff',bg_log:'#f3f4f6',text:'#111827',accent:'#1a73e8',default_color:'#e4e6ea'}

  useEffect(()=>{
    const fn=()=>setMob(window.innerWidth<768)
    window.addEventListener('resize',fn); return()=>window.removeEventListener('resize',fn)
  },[])

  // Fetch friends list when tab opens
  useEffect(()=>{
    if(tab!=='friends') return
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/users/me/friends`,{headers:{Authorization:`Bearer ${t}`}})
      .then(r=>r.json()).then(d=>setFriends(d.friends||[])).catch(()=>{})
  },[tab])

  // Fetch all staff when tab opens
  useEffect(()=>{
    if(tab!=='staff') return
    setStaffLoading(true)
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/users/staff`,{headers:{Authorization:`Bearer ${t}`}})
      .then(r=>r.json()).then(d=>setStaff(d.staff||[])).catch(()=>{})
      .finally(()=>setStaffLoading(false))
  },[tab])

  // Hide invisible users from userlist
  const visible = users.filter(u=>u.status!=='invisible')

  // Apply gender + cam filters for users tab
  function applyFilters(list) {
    return list.filter(u=>{
      if(genderF!=='all' && u.gender!==genderF) return false
      if(camOnly && !u.isCamHost) return false
      return true
    })
  }

  // Sort by rank desc
  const sorted = [...visible].sort((a,b)=>RL(b.rank)-RL(a.rank)||(a.username||'').localeCompare(b.username||''))

  // Search results — online + offline (fetch separately)
  const [searchResults,setSearchResults] = useState([])
  const [searching,setSearching] = useState(false)
  const searchTimer = useRef(null)
  useEffect(()=>{
    if(tab!=='search'||!search.trim()){setSearchResults([]);return}
    clearTimeout(searchTimer.current)
    searchTimer.current=setTimeout(()=>{
      setSearching(true)
      const t=localStorage.getItem('cgz_token')
      const gq=genderF!=='all'?`&gender=${genderF}`:''
      fetch(`${API}/api/users/search?q=${encodeURIComponent(search)}${gq}&limit=30`,{headers:{Authorization:`Bearer ${t}`}})
        .then(r=>r.json()).then(d=>setSearchResults(d.users||[])).catch(()=>{})
        .finally(()=>setSearching(false))
    },350)
    return()=>clearTimeout(searchTimer.current)
  },[search,genderF,tab])

  const TABS=[
    {id:'users',   icon:'fi-sr-users-alt',    title:'Users'},
    {id:'friends', icon:'fi-sr-user-trust',   title:'Friends'},
    {id:'staff',   icon:'fi-sr-user-shield',  title:'Staff'},
    {id:'search',  icon:'fi-sr-member-search',title:'Search'},
  ]

  function renderList(list, fallback) {
    if(!list.length) return <p style={{textAlign:'center',color:th.text+'55',fontSize:'0.76rem',padding:'16px 10px'}}>{fallback}</p>
    return list.map((u,i)=>(
      <UserItem key={u.userId||u._id||i} u={u} onClick={onUserClick} th={th}/>
    ))
  }

  const onlineF = applyFilters(sorted)
  // Friends split online/offline
  const onlineFriendsIds = new Set(visible.map(u=>String(u._id||u.userId)))
  const friendsOnline  = friends.filter(f=>onlineFriendsIds.has(String(f._id||f.userId)))
  const friendsOffline = friends.filter(f=>!onlineFriendsIds.has(String(f._id||f.userId)))
  // Staff split
  const onlineStaffIds = new Set(visible.filter(u=>RL(u.rank)>=11).map(u=>String(u._id||u.userId)))
  const staffOnline  = staffAll.filter(s=>onlineStaffIds.has(String(s._id||s.userId)))
  const staffOffline = staffAll.filter(s=>!onlineStaffIds.has(String(s._id||s.userId)))

  const sideStyle = {
    position:'fixed', top:50, right:0, bottom:42,
    width:isMobile?'min(240px,85vw)':'210px',
    zIndex:200,
    borderLeft:`1px solid ${th.default_color}44`,
    background:th.bg_header,
    display:'flex', flexDirection:'column', flexShrink:0,
    boxShadow:'-4px 0 20px rgba(0,0,0,.25)',
  }

  return(
    <>
      {isMobile&&<div style={{position:'fixed',inset:0,zIndex:199,background:'rgba(0,0,0,.4)'}} onClick={onClose}/>}
      <div style={sideStyle}>
        {/* Tab bar */}
        <div style={{display:'flex',alignItems:'center',borderBottom:`1px solid ${th.default_color}44`,flexShrink:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} title={t.title}
              style={{flex:1,padding:'9px 2px',border:'none',background:'none',cursor:'pointer',
                borderBottom:`2px solid ${tab===t.id?th.accent:'transparent'}`,
                color:tab===t.id?th.accent:th.text+'77',fontSize:13,transition:'all .15s',
                display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className={`fi ${t.icon}`}/>
            </button>
          ))}
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:th.text+'66',padding:'4px 7px',fontSize:13}}>
            <i className="fi fi-sr-cross-small"/>
          </button>
        </div>

        {/* Filters row — for users tab */}
        {tab==='users'&&(
          <div style={{display:'flex',gap:4,padding:'5px 8px',borderBottom:`1px solid ${th.default_color}22`,flexShrink:0,flexWrap:'wrap'}}>
            {['all','male','female'].map(g=>(
              <button key={g} onClick={()=>setGF(g)}
                style={{padding:'3px 8px',borderRadius:14,border:`1px solid ${genderF===g?th.accent:'#e4e6ea'}`,
                  background:genderF===g?th.accent+'18':'none',cursor:'pointer',
                  fontSize:'0.65rem',fontWeight:700,color:genderF===g?th.accent:th.text+'66',
                  textTransform:'capitalize'}}>
                {g==='male'?'♂ Male':g==='female'?'♀ Female':'All'}
              </button>
            ))}
            <button onClick={()=>setCam(p=>!p)} title="Cam users only"
              style={{padding:'3px 8px',borderRadius:14,border:`1px solid ${camOnly?'#ef4444':'#e4e6ea'}`,
                background:camOnly?'#ef444418':'none',cursor:'pointer',
                fontSize:'0.65rem',fontWeight:700,color:camOnly?'#ef4444':th.text+'66',
                display:'flex',alignItems:'center',gap:3}}>
              <i className="fi fi-sr-video-camera" style={{fontSize:9}}/>Cam
            </button>
          </div>
        )}

        {/* Search bar */}
        {tab==='search'&&(
          <div style={{padding:'7px 8px',borderBottom:`1px solid ${th.default_color}33`,flexShrink:0}}>
            <div style={{position:'relative',marginBottom:5}}>
              <i className="fi fi-sr-search" style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:11,color:th.text+'55',pointerEvents:'none'}}/>
              <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..."
                style={{width:'100%',padding:'6px 8px 6px 25px',background:th.bg_log||'#f3f4f6',
                  border:`1.5px solid ${th.default_color}55`,borderRadius:7,fontSize:'0.78rem',
                  outline:'none',boxSizing:'border-box',color:th.text,fontFamily:'Nunito,sans-serif'}}
                onFocus={e=>e.target.style.borderColor=th.accent} onBlur={e=>e.target.style.borderColor=`${th.default_color}55`}/>
            </div>
            <select value={genderF} onChange={e=>setGF(e.target.value)}
              style={{width:'100%',padding:'5px 7px',background:th.bg_log||'#f3f4f6',
                border:`1px solid ${th.default_color}44`,borderRadius:6,fontSize:'0.73rem',
                outline:'none',color:th.text,cursor:'pointer'}}>
              <option value="all">All Genders</option>
              <option value="male">♂ Male</option>
              <option value="female">♀ Female</option>
              <option value="couple">Couple</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {/* Friends / Staff sub-tabs */}
        {(tab==='friends'||tab==='staff')&&(
          <div style={{display:'flex',borderBottom:`1px solid ${th.default_color}33`,flexShrink:0}}>
            {['online','offline'].map(t=>(
              <button key={t} onClick={()=>tab==='friends'?setFT(t):setST(t)}
                style={{flex:1,padding:'6px 4px',border:'none',background:'none',cursor:'pointer',
                  borderBottom:`2px solid ${(tab==='friends'?friendTab:staffTab)===t?th.accent:'transparent'}`,
                  color:(tab==='friends'?friendTab:staffTab)===t?th.accent:th.text+'55',
                  fontSize:'0.72rem',fontWeight:700,textTransform:'capitalize'}}>
                <i className={`fi ${t==='online'?'fi-sr-circle':'fi-rr-circle'}`} style={{fontSize:8,marginRight:4,color:t==='online'?'#22c55e':'#9ca3af'}}/>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Count label */}
        <div style={{padding:'4px 10px 2px',fontSize:'0.6rem',fontWeight:700,
          color:th.text+'55',letterSpacing:'1px',textTransform:'uppercase',flexShrink:0}}>
          {tab==='users'?`Online · ${onlineF.length}`
          :tab==='friends'?`Friends · ${friendTab==='online'?friendsOnline.length:friendsOffline.length}`
          :tab==='staff'?`Staff · ${staffTab==='online'?`${staffOnline.length} online`:`${staffOffline.length} offline`} · Total ${staffAll.length}`
          :`Results · ${searchResults.length}`}
        </div>

        {/* List */}
        <div style={{flex:1,overflowY:'auto'}}>
          {tab==='users' && renderList(onlineF, 'No users online')}

          {tab==='friends' && (
            friendTab==='online'
              ? renderList(friendsOnline, 'No friends online')
              : renderList(friendsOffline.map(f=>({...f,status:'offline'})), 'No offline friends')
          )}

          {tab==='staff' && (
            staffLoading
              ? <div style={{padding:20,textAlign:'center'}}><div style={{width:20,height:20,border:`2px solid ${th.accent}44`,borderTop:`2px solid ${th.accent}`,borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>
              : staffTab==='online'
                ? renderList(staffOnline, 'No staff online')
                : renderList(staffOffline.map(s=>({...s,status:'offline'})), 'No offline staff')
          )}

          {tab==='search' && (
            !search.trim()
              ? <p style={{textAlign:'center',color:th.text+'44',fontSize:'0.76rem',padding:'16px 10px'}}>Type to search users...</p>
              : searching
              ? <p style={{textAlign:'center',color:th.text+'55',fontSize:'0.76rem',padding:'16px 10px'}}>Searching...</p>
              : renderList(searchResults, 'No results found')
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// LEFT SIDEBAR — full spec with overlay panels
// ─────────────────────────────────────────────────────────────
function LeftSidebar({room, nav, socket, roomId, onClose, me, tObj}) {
  const [open,setOpen]   = useState(null)   // id of open overlay panel
  const [isMobile,setMob]= useState(window.innerWidth<768)
  const th = tObj||{bg_header:'#1a1f2e',bg_chat:'#151520',text:'#e2e8f0',accent:'#1a73e8',default_color:'#2d3555'}

  useEffect(()=>{
    const fn=()=>setMob(window.innerWidth<768)
    window.addEventListener('resize',fn); return()=>window.removeEventListener('resize',fn)
  },[])

  const C  = th.text||'#e2e8f0'
  const BG = th.bg_header||'#1a1f2e'
  const ACC= th.accent||'#1a73e8'
  const BD = `${th.default_color||'#2d3555'}66`
  const PANEL_BG = th.bg_chat||'#0f0f1e'

  // All items always have chevron right — click opens overlay
  const menuItem=(id,icon,label,extra)=>(
    <button key={id} onClick={e=>{e.stopPropagation();setOpen(p=>p===id?null:id)}}
      style={{width:'100%',display:'flex',alignItems:'center',gap:11,padding:'11px 14px',
        border:'none',background:open===id?`${ACC}22`:'none',cursor:'pointer',textAlign:'left',
        borderBottom:`1px solid ${BD}`,transition:'background .12s',
        borderLeft:`3px solid ${open===id?ACC:'transparent'}`}}
      onMouseEnter={e=>{if(open!==id)e.currentTarget.style.background=`${ACC}0d`}}
      onMouseLeave={e=>{if(open!==id)e.currentTarget.style.background='none'}}>
      {extra?.img
        ? <img src={extra.img} alt="" style={{width:18,height:18,objectFit:'contain',flexShrink:0}}/>
        : <i className={`fi ${icon}`} style={{fontSize:16,color:open===id?ACC:C+'99',width:18,textAlign:'center',flexShrink:0}}/>}
      <span style={{flex:1,fontSize:'0.84rem',fontWeight:600,color:open===id?ACC:C}}>{label}</span>
      <i className="fi fi-sr-angle-right" style={{fontSize:11,color:open===id?ACC:C+'44',flexShrink:0,transition:'transform .2s',transform:open===id?'rotate(90deg)':'rotate(0deg)'}}/>
    </button>
  )

  // Inline panel rendered below button (not overlay)
  const inlinePanel=(id,children)=>open===id?(
    <div style={{background:`${PANEL_BG}ee`,borderBottom:`1px solid ${BD}`}}>
      {children}
    </div>
  ):null

  // Sidebar width: on desktop, 260px always (not collapsible icon-only)
  const sidebarWidth = isMobile ? 'min(280px,88vw)' : '260px'

  return(
    <>
      {/* Backdrop */}
      {isMobile && <div style={{position:'fixed',inset:0,zIndex:199,background:'rgba(0,0,0,.55)'}} onClick={onClose}/>}

      <div style={{
        position: isMobile ? 'fixed' : 'relative',
        top: isMobile ? 50 : undefined,
        left: isMobile ? 0 : undefined,
        bottom: isMobile ? 42 : undefined,
        zIndex: isMobile ? 200 : undefined,
        width: sidebarWidth,
        flexShrink: 0,
        display:'flex',flexDirection:'column',
        background:BG,
        boxShadow: isMobile ? '4px 0 24px rgba(0,0,0,.45)' : '2px 0 12px rgba(0,0,0,.25)',
        overflowY:'auto',
        height: isMobile ? undefined : '100%',
      }}>

        {/* Room info at top */}
        <div style={{padding:'14px',borderBottom:`1px solid ${BD}`,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <img src={room?.icon||'/default_images/rooms/default_room.png'} alt=""
              style={{width:38,height:38,borderRadius:10,objectFit:'cover',flexShrink:0,border:`1.5px solid ${ACC}44`}}
              onError={e=>e.target.src='/default_images/rooms/default_room.png'}/>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:C,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{room?.name||'Chat Room'}</div>
              {room?.description&&<div style={{fontSize:'0.67rem',color:C+'66',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:2,lineHeight:1.3}}>{room.description}</div>}
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C+'55',fontSize:17,padding:2,flexShrink:0,display:'flex',alignItems:'center'}}><i className="fi fi-sr-cross-small"/></button>
          </div>
        </div>

        {/* Menu items */}
        <div style={{flex:1,overflowY:'auto'}}>

          {/* Room List */}
          {menuItem('rooms','fi-sr-list','Room List')}
          {inlinePanel('rooms',
            <div style={{maxHeight:340,overflowY:'auto'}}>
              <RoomListPanel nav={nav} onEnter={onClose} tObj={th}/>
            </div>
          )}

          {/* News */}
          {menuItem('news','fi-sr-newspaper','News')}
          {inlinePanel('news',
            <div style={{padding:'12px 14px'}}>
              <p style={{fontSize:'0.8rem',color:C+'66',margin:0}}>No announcements yet.</p>
            </div>
          )}

          {/* Friends Wall */}
          {menuItem('wall','fi-sr-rss','Friend Wall')}
          {inlinePanel('wall',
            <div style={{padding:'12px 14px'}}>
              <p style={{fontSize:'0.8rem',color:C+'66',margin:0}}>Wall posts coming soon!</p>
            </div>
          )}

          {/* Forum */}
          {menuItem('forum','fi-sr-comments-alt','Forum')}
          {inlinePanel('forum',
            <div style={{padding:'12px 14px'}}>
              <p style={{fontSize:'0.8rem',color:C+'66',margin:0}}>Forum coming soon!</p>
            </div>
          )}

          {/* Contact */}
          {menuItem('contact','fi-sr-envelope','Contact Us')}
          {inlinePanel('contact',<ContactPanel th={th}/>)}

          {/* Username Change */}
          {menuItem('username','fi-sr-user-pen','Username Change')}
          {inlinePanel('username',<UsernamePanel th={th}/>)}

          {/* Games */}
          {menuItem('games','fi-sr-dice','Games')}
          {inlinePanel('games',
            <div style={{padding:'10px 10px'}}>
              <GamesPanel socket={socket} roomId={roomId} myGold={me?.gold||0} tObj={th}/>
            </div>
          )}

          {/* Leaderboard */}
          {menuItem('leaderboard','fi-sr-medal','Leaderboard')}
          {inlinePanel('leaderboard',
            <div style={{maxHeight:420,overflowY:'auto'}}>
              <LeaderboardPanel tObj={th}/>
            </div>
          )}

          {/* Buy Premium */}
          {menuItem('premium','fi-sr-diamond','Buy Premium',{img:'/icons/ranks/premium.svg'})}
          {inlinePanel('premium',<PremiumPanel th={th}/>)}

          {/* Store */}
          {menuItem('store','fi-sr-shopping-cart','Store')}
          {inlinePanel('store',
            <div style={{padding:12}}>
              <StorePanel th={th}/>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// STORE PANEL
// ─────────────────────────────────────────────────────────────
function StorePanel({th}) {
  const C = th?.text||'#e2e8f0'
  return(
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {[
        {icon:'fi-sr-coins',label:'Buy Coins',sub:'Get more gold coins',color:'#f59e0b'},
        {icon:'fi-sr-gem',  label:'Buy Ruby',  sub:'Premium currency',  color:'#ef4444'},
      ].map(item=>(
        <button key={item.label}
          style={{display:'flex',alignItems:'center',gap:10,padding:'11px 12px',
            background:item.color+'18',border:`1px solid ${item.color}44`,borderRadius:10,cursor:'pointer',textAlign:'left'}}>
          <i className={`fi ${item.icon}`} style={{fontSize:20,color:item.color,flexShrink:0}}/>
          <div>
            <div style={{fontSize:'0.85rem',fontWeight:700,color:C}}>{item.label}</div>
            <div style={{fontSize:'0.7rem',color:C+'66'}}>{item.sub}</div>
          </div>
          <i className="fi fi-sr-angle-right" style={{marginLeft:'auto',color:C+'44',fontSize:12}}/>
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CONTACT PANEL
// ─────────────────────────────────────────────────────────────
function ContactPanel({th}) {
  const [sent,setSent]=useState(false),[msg,setMsg]=useState(''),[sub,setSub]=useState('')
  const C = th?.text||'#e2e8f0'
  const inp={width:'100%',padding:'8px 12px',background:'rgba(255,255,255,.06)',
    border:'1px solid rgba(255,255,255,.12)',borderRadius:8,fontSize:'0.83rem',
    outline:'none',color:C,boxSizing:'border-box',fontFamily:'Nunito,sans-serif'}
  const token=localStorage.getItem('cgz_token')
  if(sent) return <div style={{padding:16,textAlign:'center',color:'#22c55e',fontWeight:700}}>✅ Message sent!</div>
  return(
    <div style={{padding:12,display:'flex',flexDirection:'column',gap:8}}>
      <input value={sub} onChange={e=>setSub(e.target.value)} placeholder="Subject..." style={inp}/>
      <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Your message..." rows={4}
        style={{...inp,resize:'none',lineHeight:1.5}}/>
      <button onClick={async()=>{
        if(!msg.trim()) return
        await fetch(`${API}/api/contact`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({subject:sub||'Support',message:msg})}).catch(()=>{})
        setSent(true)
      }} style={{padding:'9px',borderRadius:8,border:'none',background:'#14b8a6',color:'#fff',fontWeight:700,cursor:'pointer'}}>
        Send
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// USERNAME PANEL
// ─────────────────────────────────────────────────────────────
function UsernamePanel({th}) {
  const [val,setVal]=useState(''),[msg,setMsg]=useState('')
  const C = th?.text||'#e2e8f0'
  const inp={width:'100%',padding:'9px 12px',background:'rgba(255,255,255,.06)',
    border:'1px solid rgba(255,255,255,.12)',borderRadius:8,fontSize:'0.875rem',
    outline:'none',color:C,boxSizing:'border-box',fontFamily:'Nunito,sans-serif'}
  async function change() {
    const t=localStorage.getItem('cgz_token')
    const r=await fetch(`${API}/api/users/change-username`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify({newUsername:val})})
    const d=await r.json(); setMsg(r.ok?'✅ Changed!':d.error||'Failed')
  }
  return(
    <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:8}}>
      <div style={{background:'rgba(245,158,11,.15)',border:'1px solid rgba(245,158,11,.3)',borderRadius:8,padding:'8px 11px',fontSize:'0.75rem',color:'#f59e0b'}}>
        Username change costs <strong>500 Gold</strong>
      </div>
      {msg&&<div style={{fontSize:'0.78rem',color:msg.startsWith('✅')?'#22c55e':'#ef4444'}}>{msg}</div>}
      <input value={val} onChange={e=>setVal(e.target.value)} placeholder="New username..." style={inp}/>
      <button onClick={change} style={{padding:'9px',borderRadius:8,border:'none',background:'#6366f1',color:'#fff',fontWeight:700,cursor:'pointer'}}>Change</button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PREMIUM PANEL
// ─────────────────────────────────────────────────────────────
function PremiumPanel({th}) {
  const C = th?.text||'#e2e8f0'
  return(
    <div style={{padding:12,display:'flex',flexDirection:'column',gap:8}}>
      <div style={{background:'linear-gradient(135deg,#aa44ff,#6366f1)',borderRadius:12,padding:14,textAlign:'center',color:'#fff',display:'flex',alignItems:'center',gap:10,justifyContent:'center'}}>
        <img src="/icons/ranks/premium.svg" alt="" style={{width:28,height:28,objectFit:'contain'}}/>
        <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1rem'}}>Buy Premium</div>
      </div>
      {[{d:7,p:199,b:'Weekly'},{d:30,p:599,b:'Monthly'},{d:90,p:1499,b:'3 Months'},{d:365,p:4999,b:'1 Year',best:true}].map(plan=>(
        <div key={plan.d} style={{background:plan.best?'rgba(245,158,11,.12)':'rgba(255,255,255,.05)',border:`1.5px solid ${plan.best?'#f59e0b':'rgba(255,255,255,.1)'}`,borderRadius:9,padding:'10px 12px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
            <div>
              <div style={{fontWeight:700,fontSize:'0.88rem',color:C}}>{plan.b}{plan.best?' ⭐':''}</div>
              <div style={{fontSize:'0.7rem',color:C+'66'}}>{plan.d} days</div>
            </div>
            <div style={{fontWeight:800,color:'#f59e0b',fontSize:'0.95rem'}}>{plan.p} 🪙</div>
          </div>
          <button style={{width:'100%',padding:'7px',borderRadius:7,border:'none',background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.82rem'}}>
            Buy with Gold
          </button>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ROOM LIST PANEL
// ─────────────────────────────────────────────────────────────
function RoomListPanel({nav, onEnter, tObj}) {
  const [rooms,setRooms]=useState([]),[load,setLoad]=useState(true)
  const th = tObj||{text:'#e2e8f0',default_color:'#2d3555',accent:'#1a73e8'}
  const C = th.text||'#e2e8f0'

  useEffect(()=>{
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/rooms`,{headers:{Authorization:`Bearer ${t}`}})
      .then(r=>r.json()).then(d=>setRooms(d.rooms||[])).catch(()=>{}).finally(()=>setLoad(false))
  },[])

  if(load) return <div style={{padding:16,textAlign:'center'}}><div style={{width:20,height:20,border:`2px solid ${th.accent}44`,borderTop:`2px solid ${th.accent}`,borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>

  return(
    <div>
      {rooms.map(r=>{
        const mri=R(r.minRank)
        return(
          <div key={r._id} onClick={()=>{nav(`/chat/${r.slug||r._id}`);onEnter?.()}}
            style={{display:'flex',alignItems:'center',gap:9,padding:'9px 13px',cursor:'pointer',borderBottom:`1px solid ${th.default_color}44`,transition:'background .12s'}}
            onMouseEnter={e=>e.currentTarget.style.background=`${th.accent}18`}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{position:'relative',flexShrink:0}}>
              <img src={r.icon||'/default_images/rooms/default_room.png'} alt=""
                style={{width:38,height:38,borderRadius:9,objectFit:'cover',border:`1px solid ${th.default_color}55`,display:'block'}}
                onError={e=>e.target.src='/default_images/rooms/default_room.png'}/>
              {r.isPinned&&<i className="fi fi-sr-thumbtack" style={{position:'absolute',top:-3,right:-3,fontSize:9,color:'#f59e0b'}}/>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                <span style={{fontWeight:700,fontSize:'0.84rem',color:C,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{r.name}</span>
                {r.password&&<i className="fi fi-sr-lock" style={{fontSize:9,color:C+'55',flexShrink:0}}/>}
              </div>
              {r.description&&<div style={{fontSize:'0.65rem',color:C+'55',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.description}</div>}
              <div style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
                <span style={{fontSize:'0.7rem',fontWeight:700,color:(r.currentUsers||0)>0?'#22c55e':C+'44',display:'flex',alignItems:'center',gap:3}}>
                  <i className="fi fi-sr-user" style={{fontSize:9}}/>{r.currentUsers||0}
                </span>
                {r.minRank&&r.minRank!=='guest'&&(
                  <img src={`/icons/ranks/${mri.icon}`} alt={mri.label} title={mri.label+'+'}
                    style={{width:13,height:13,objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LEADERBOARD PANEL
// ─────────────────────────────────────────────────────────────
function LeaderboardPanel({tObj}) {
  const [type,setType]=useState('xp')
  const [period,setPeriod]=useState('all')
  const [data,setData]=useState([])
  const [load,setLoad]=useState(false)
  const th = tObj||{text:'#e2e8f0',accent:'#1a73e8',default_color:'#2d3555'}
  const C = th.text||'#e2e8f0'
  const ACC = th.accent||'#1a73e8'

  useEffect(()=>{
    setLoad(true)
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/leaderboard/${type}?period=${period}`,{headers:{Authorization:`Bearer ${t}`}})
      .then(r=>r.json()).then(d=>setData(d.users||[])).catch(()=>{}).finally(()=>setLoad(false))
  },[type,period])

  const LB_TYPES=[
    {id:'gold',  label:'Top Gold',         icon:'fi-sr-coins'},
    {id:'xp',    label:'Top XP',           icon:'fi-sr-star'},
    {id:'likes', label:'Top Likes',        icon:'fi-sr-heart'},
    {id:'gifts', label:'Top Gifts',        icon:'fi-sr-gift'},
    {id:'quiz',  label:'Top Quiz',         icon:'fi-sr-quiz'},
    {id:'views', label:'Top Profile Views',icon:'fi-sr-eye'},
  ]
  const PERIODS=[{id:'weekly',label:'Weekly'},{id:'monthly',label:'Monthly'},{id:'all',label:'All Time'}]
  const MEDAL=['🥇','🥈','🥉']

  return(
    <div style={{display:'flex',flexDirection:'column'}}>
      {/* Type tabs — scrollable row */}
      <div style={{display:'flex',borderBottom:`1px solid ${th.default_color}44`,overflowX:'auto',flexShrink:0}}>
        {LB_TYPES.map(t=>(
          <button key={t.id} onClick={()=>setType(t.id)}
            style={{display:'flex',alignItems:'center',gap:5,padding:'8px 11px',border:'none',background:'none',cursor:'pointer',
              borderBottom:`2px solid ${type===t.id?ACC:'transparent'}`,
              color:type===t.id?ACC:C+'55',fontSize:'0.68rem',fontWeight:700,whiteSpace:'nowrap',flexShrink:0,transition:'all .15s'}}>
            <i className={`fi ${t.icon}`} style={{fontSize:11}}/>
            {t.label}
          </button>
        ))}
      </div>
      {/* Period tabs */}
      <div style={{display:'flex',borderBottom:`1px solid ${th.default_color}33`,flexShrink:0}}>
        {PERIODS.map(p=>(
          <button key={p.id} onClick={()=>setPeriod(p.id)}
            style={{flex:1,padding:'6px 4px',border:'none',background:'none',cursor:'pointer',
              borderBottom:`2px solid ${period===p.id?ACC:'transparent'}`,
              color:period===p.id?ACC:C+'55',fontSize:'0.68rem',fontWeight:700,transition:'all .15s'}}>
            {p.label}
          </button>
        ))}
      </div>
      {/* List */}
      <div>
        {load
          ? <div style={{padding:14,textAlign:'center'}}><div style={{width:18,height:18,border:`2px solid ${ACC}44`,borderTop:`2px solid ${ACC}`,borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>
          : data.length===0
          ? <p style={{textAlign:'center',color:C+'44',fontSize:'0.76rem',padding:'14px 10px'}}>No data</p>
          : data.map((u,i)=>(
            <div key={u._id||i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',borderBottom:`1px solid ${th.default_color}33`}}>
              <span style={{fontSize:'0.85rem',width:22,flexShrink:0,textAlign:'center'}}>{i<3?MEDAL[i]:i+1}</span>
              <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt=""
                style={{width:24,height:24,borderRadius:'50%',objectFit:'cover',flexShrink:0}}
                onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.78rem',fontWeight:700,color:C,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username}</div>
                <div style={{display:'flex',alignItems:'center',gap:3}}><RIcon rank={u.rank} size={9}/><span style={{fontSize:'0.6rem',color:R(u.rank).color}}>{R(u.rank).label}</span></div>
              </div>
              <span style={{fontSize:'0.8rem',fontWeight:800,color:ACC,flexShrink:0}}>
                {type==='xp'?u.xp||0:type==='gold'?u.gold||0:type==='likes'?u.likes||0:type==='gifts'?u.totalGiftsReceived||0:type==='quiz'?u.quizScore||0:u.profileViews||0}
              </span>
            </div>
          ))
        }
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STYLE PANEL — kept for backward compat (not shown in left sidebar anymore)
// ─────────────────────────────────────────────────────────────
function StylePanelInline({type, onSaved}) { return null }

export { UserItem, RightSidebar, StylePanelInline, LeftSidebar, LeaderboardPanel, UsernamePanel }
