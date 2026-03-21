import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ── CONSTANTS ────────────────────────────────────────────────
const RANKS = {
  guest:      { label:'Guest',      color:'#888888', icon:'guest.svg',      level:1  },
  user:       { label:'User',       color:'#aaaaaa', icon:'user.svg',       level:2  },
  vipfemale:  { label:'VIP Female', color:'#FF4488', icon:'vipfemale.svg',  level:3  },
  vipmale:    { label:'VIP Male',   color:'#4488FF', icon:'vipmale.svg',    level:4  },
  butterfly:  { label:'Butterfly',  color:'#FF66AA', icon:'butterfly.svg',  level:5  },
  ninja:      { label:'Ninja',      color:'#777777', icon:'ninja.svg',      level:6  },
  fairy:      { label:'Fairy',      color:'#FF88CC', icon:'fairy.svg',      level:7  },
  legend:     { label:'Legend',     color:'#FF8800', icon:'legend.png',     level:8  },
  bot:        { label:'Bot',        color:'#00cc88', icon:'bot.svg',        level:9  },
  premium:    { label:'Premium',    color:'#aa44ff', icon:'premium.svg',    level:10 },
  moderator:  { label:'Moderator',  color:'#00AAFF', icon:'moderator.svg',  level:11 },
  admin:      { label:'Admin',      color:'#FF4444', icon:'admin.svg',      level:12 },
  superadmin: { label:'Superadmin', color:'#FF00FF', icon:'superadmin.svg', level:13 },
  owner:      { label:'Owner',      color:'#FFD700', icon:'owner.svg',      level:14 },
}
const STATUSES = [
  { id:'online',    label:'Online',    color:'#22c55e' },
  { id:'away',      label:'Away',      color:'#f59e0b' },
  { id:'busy',      label:'Busy',      color:'#ef4444' },
  { id:'invisible', label:'Invisible', color:'#9ca3af' },
]
const GENDER_BORDER = { male:'#03add8', female:'#ff99ff', couple:'#9c6fde', other:'#cccccc' }
const GBR = (g,r) => r==='bot'?'transparent':(GENDER_BORDER[g]||'#cccccc')
const R   = r => RANKS[r] || RANKS.guest
const RL  = r => RANKS[r]?.level || 0

// ── MINI PROFILE CARD ─────────────────────────────────────────
function MiniCard({ user, myLevel, pos, onClose, onViewFull, socket, roomId }) {
  if (!user) return null
  const ri     = R(user.rank)
  const bdr    = GBR(user.gender, user.rank)
  const canAct = myLevel >= 11 && RL(user.rank) < myLevel
  const canBan = myLevel >= 12 && RL(user.rank) < myLevel
  const isOwn  = myLevel >= 14

  const x = Math.min(pos.x, window.innerWidth  - 230)
  const y = Math.min(pos.y, window.innerHeight - 300)

  return (
    <div style={{ position:'fixed', zIndex:9999, top:y, left:x, background:'#fff', border:'1px solid #e8eaed', borderRadius:13, width:215, boxShadow:'0 8px 28px rgba(0,0,0,.14)', overflow:'hidden' }}
      onClick={e=>e.stopPropagation()}
    >
      <div style={{ height:38, background:`linear-gradient(135deg,${ri.color}33,#e8f0fe)` }} />
      <div style={{ display:'flex', alignItems:'flex-end', gap:9, padding:'0 12px', marginTop:-20 }}>
        <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt=""
          style={{ width:40, height:40, borderRadius:'50%', border:`2px solid ${bdr}`, objectFit:'cover', background:'#fff', flexShrink:0 }}
          onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
        />
        <div style={{ paddingBottom:6, minWidth:0 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.85rem', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.username}</div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:11, height:11 }} onError={e=>e.target.style.display='none'} />
            <span style={{ fontSize:'0.66rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
          </div>
        </div>
      </div>
      <div style={{ padding:'8px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
          <MCBtn icon="fi-sr-circle-user" label="Profile"    onClick={onViewFull} />
          <MCBtn icon="fi-sr-comments"    label="PM"         />
          <MCBtn icon="fi-sr-phone-call"  label="Call"       />
          <MCBtn icon="fi-sr-gift"        label="Gift"        color="#7c3aed" />
          {myLevel >= 2 && <MCBtn icon="fi-sr-user-add"    label="Friend"   color="#059669" />}
          {myLevel >= 2 && <MCBtn icon="fi-sr-user-block"  label="Ignore"   color="#6b7280" />}
          {canAct && <MCBtn icon="fi-sr-volume-mute" label="Mute 5m"  color="#f59e0b" onClick={()=>socket?.emit('muteUser',{roomId,userId:user._id,minutes:5})} />}
          {canAct && <MCBtn icon="fi-sr-user-slash"  label="Kick"     color="#ef4444" onClick={()=>{socket?.emit('kickUser',{roomId,userId:user._id});onClose()}} />}
          {canBan  && <MCBtn icon="fi-sr-ban"        label="Ban"      color="#dc2626" />}
          {isOwn   && <MCBtn icon="fi-sr-shield-check" label="Set Rank" color="#1a73e8" />}
          <MCBtn icon="fi-sr-flag" label="Report" color="#ef4444" />
        </div>
      </div>
    </div>
  )
}
function MCBtn({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 7px', background:'#f9fafb', border:'1px solid #e8eaed', borderRadius:7, cursor:'pointer', fontSize:'0.73rem', fontWeight:600, color:color||'#374151', transition:'all .12s' }}
      onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}}
      onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e8eaed'}}
    >
      <i className={`fi ${icon}`} style={{ fontSize:11 }}/>{label}
    </button>
  )
}

// ── FULL PROFILE MODAL ────────────────────────────────────────
function ProfileModal({ user, myLevel, socket, roomId, onClose }) {
  if (!user) return null
  const ri     = R(user.rank)
  const bdr    = GBR(user.gender, user.rank)
  const canMod = myLevel >= 11 && RL(user.rank) < myLevel
  const canBan = myLevel >= 12 && RL(user.rank) < myLevel
  const isOwn  = myLevel >= 14

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:18, maxWidth:340, width:'100%', overflow:'hidden', boxShadow:'0 16px 48px rgba(0,0,0,.18)' }}>
        <div style={{ height:88, background:`linear-gradient(135deg,${ri.color}44,#e8f0fe)`, position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', top:10, right:10, background:'rgba(255,255,255,.8)', border:'none', width:28, height:28, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
            <i className="fi fi-sr-cross-small"/>
          </button>
          {user.countryCode && user.countryCode!=='ZZ' && (
            <img src={`/icons/flags/${user.countryCode.toLowerCase()}.png`} alt="" style={{ position:'absolute', bottom:10, right:14, width:22, height:15, borderRadius:2 }} onError={e=>e.target.style.display='none'} />
          )}
        </div>
        <div style={{ display:'flex', justifyContent:'center', marginTop:-36 }}>
          <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt=""
            style={{ width:72, height:72, borderRadius:'50%', border:`3px solid ${bdr}`, objectFit:'cover', background:'#fff' }}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
          />
        </div>
        <div style={{ padding:'10px 18px 18px', textAlign:'center' }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1rem', color:'#111827' }}>{user.username}</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, margin:'5px 0 12px' }}>
            <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:14, height:14 }} onError={e=>e.target.style.display='none'} />
            <span style={{ fontSize:'0.73rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
          </div>
          {user.mood  && <p style={{ fontSize:'0.78rem', color:'#6b7280', marginBottom:8, fontStyle:'italic' }}>"{user.mood}"</p>}
          {user.about && <p style={{ fontSize:'0.78rem', color:'#6b7280', marginBottom:12, lineHeight:1.5 }}>{user.about}</p>}
          {/* Stats */}
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:14 }}>
            {[
              { label:'Level', value:user.level||1,            color:'#1a73e8' },
              { label:'Gold',  value:user.gold||0,             color:'#d97706' },
              { label:'Msgs',  value:user.totalMessages||0,    color:'#7c3aed' },
              { label:'Gifts', value:user.totalGiftsReceived||0, color:'#ef4444' },
            ].map(s=>(
              <div key={s.label} style={{ textAlign:'center', background:'#f9fafb', borderRadius:8, padding:'5px 10px' }}>
                <div style={{ fontSize:'0.6rem', color:'#9ca3af' }}>{s.label}</div>
                <div style={{ fontSize:'0.88rem', fontWeight:800, color:s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          {/* Buttons — rank based */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center' }}>
            <PBtn icon="fi-sr-comments"    label="Private"     />
            <PBtn icon="fi-sr-phone-call"  label="Call"        />
            <PBtn icon="fi-sr-gift"        label="Gift"         color="#7c3aed" />
            <PBtn icon="fi-sr-user-add"    label="Add Friend"  color="#059669" />
            <PBtn icon="fi-sr-user-block"  label="Ignore"      color="#6b7280" />
            <PBtn icon="fi-sr-flag"        label="Report"      color="#ef4444" />
            {canMod && <PBtn icon="fi-sr-volume-mute" label="Mute"     color="#f59e0b" onClick={()=>socket?.emit('muteUser',{roomId,userId:user._id,minutes:5})} />}
            {canMod && <PBtn icon="fi-sr-user-slash"  label="Kick"     color="#ef4444" onClick={()=>{socket?.emit('kickUser',{roomId,userId:user._id});onClose()}} />}
            {canBan  && <PBtn icon="fi-sr-ban"        label="Ban"      color="#dc2626" />}
            {canMod  && <PBtn icon="fi-sr-eye-crossed" label="Ghost"   color="#6b7280" />}
            {canMod  && <PBtn icon="fi-sr-comment-slash" label="Unmute" color="#6b7280" />}
            {isOwn   && <PBtn icon="fi-sr-shield-check" label="Set Rank" color="#1a73e8" />}
            {isOwn   && <PBtn icon="fi-sr-settings"     label="Edit User" color="#374151" />}
          </div>
        </div>
      </div>
    </div>
  )
}
function PBtn({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 10px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:8, cursor:'pointer', fontSize:'0.76rem', fontWeight:600, color:color||'#374151', transition:'all .12s' }}
      onMouseEnter={e=>{e.currentTarget.style.background='#f0f7ff';e.currentTarget.style.borderColor=color||'#1a73e8'}}
      onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e8eaed'}}
    >
      <i className={`fi ${icon}`} style={{ fontSize:12 }}/>{label}
    </button>
  )
}

// ── MESSAGE ───────────────────────────────────────────────────
function Msg({ msg, myLevel, onMiniCard, onSetInput }) {
  const isSystem = msg.type === 'system'
  const ri       = R(msg.sender?.rank)
  const bdr      = GBR(msg.sender?.gender, msg.sender?.rank)
  const nameCol  = msg.sender?.nameColor || ri.color
  const ts       = new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})

  if (isSystem) return (
    <div style={{ textAlign:'center', padding:'3px 16px', margin:'1px 0' }}>
      <span style={{ fontSize:'0.7rem', color:'#9ca3af', background:'#f3f4f6', padding:'2px 12px', borderRadius:20 }}>{msg.content}</span>
    </div>
  )

  // Render @mentions with highlight
  const renderText = (text) => {
    if (!text) return text
    return text.split(/(@\w+)/g).map((p,i)=>
      p.startsWith('@')
        ? <span key={i} style={{ color:'#1a73e8', fontWeight:700 }}>{p}</span>
        : p
    )
  }

  const handleNameClick = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    onMiniCard(msg.sender, { x:rect.left, y:rect.bottom+4 })
  }

  // Click on message to set username in input (mention)
  const handleMsgClick = (e) => {
    e.stopPropagation()
    onSetInput(prev => {
      const mention = msg.sender?.username + ' '
      return prev.includes(mention) ? prev : mention + prev
    })
  }

  return (
    <div style={{ display:'flex', gap:8, padding:'3px 12px', alignItems:'flex-start', transition:'background .1s', cursor:'default' }}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,.02)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <img src={msg.sender?.avatar||'/default_images/avatar/default_guest.png'} alt=""
        onClick={handleNameClick}
        style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${bdr}`, flexShrink:0, cursor:'pointer', marginTop:2 }}
        onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
      />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2, flexWrap:'wrap' }}>
          <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:11, height:11, flexShrink:0 }} onError={e=>e.target.style.display='none'} />
          <span onClick={handleNameClick} style={{ fontSize:'0.79rem', fontWeight:700, color:nameCol, cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'}
            onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}
          >{msg.sender?.username}</span>
          <span style={{ fontSize:'0.63rem', color:'#9ca3af' }}>{ts}</span>
        </div>
        <div onClick={handleMsgClick}
          style={{ background:'#f3f4f6', color:'#111827', padding:'7px 11px', borderRadius:'3px 12px 12px 12px', fontSize:'0.875rem', lineHeight:1.55, wordBreak:'break-word', display:'inline-block', maxWidth:'85%', cursor:'pointer' }}
          title="Click to mention"
        >
          {msg.type==='gift'  ? <span>🎁 {msg.content}</span>
          : msg.type==='image' ? <img src={msg.content} alt="" style={{ maxWidth:200, borderRadius:8, display:'block' }} />
          : renderText(msg.content)}
        </div>
      </div>
    </div>
  )
}

// ── USER ITEM ─────────────────────────────────────────────────
function UserItem({ u, myLevel, onClick }) {
  const ri = R(u.rank)
  return (
    <div onClick={()=>onClick(u)}
      style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 10px', cursor:'pointer', transition:'background .12s' }}
      onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <div style={{ position:'relative', flexShrink:0 }}>
        <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt=""
          style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${GBR(u.gender,u.rank)}`, display:'block' }}
          onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
        />
        <span style={{ position:'absolute', bottom:0, right:0, width:6, height:6, background:'#22c55e', borderRadius:'50%', border:'1.5px solid #fff' }} />
      </div>
      {/* Username */}
      <span style={{ flex:1, fontSize:'0.79rem', fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {u.username}
      </span>
      {/* Rank icon */}
      <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:13, height:13, flexShrink:0 }} onError={e=>e.target.style.display='none'} />
      {/* Flag */}
      {u.countryCode && u.countryCode!=='ZZ' && (
        <img src={`/icons/flags/${u.countryCode.toLowerCase()}.png`} alt="" style={{ width:16, height:11, flexShrink:0, borderRadius:1 }} onError={e=>e.target.style.display='none'} />
      )}
    </div>
  )
}

// ── RIGHT SIDEBAR (full featured) ────────────────────────────
function RightSidebar({ users, myLevel, onUserClick, onClose }) {
  const [tab,    setTab]    = useState('users')
  const [search, setSearch] = useState('')
  const [rankF,  setRankF]  = useState('all')
  const [genderF,setGenderF]= useState('all')

  const sorted = [...users].sort((a,b)=>{
    const d = (RANKS[b.rank]?.level||0)-(RANKS[a.rank]?.level||0)
    return d!==0?d:(a.username||'').localeCompare(b.username||'')
  })
  const staff   = sorted.filter(u=>RL(u.rank)>=11)
  const friends = sorted.filter(u=>u.isFriend)

  const filtered = (tab==='staff'?staff:tab==='friends'?friends:sorted).filter(u=>{
    const ms = !search || u.username.toLowerCase().includes(search.toLowerCase())
    const mr = rankF==='all' || u.rank===rankF
    const mg = genderF==='all' || u.gender===genderF
    return ms && mr && mg
  })

  const TABS = [
    { id:'users',   icon:'fi-sr-users',       label:'Users'   },
    { id:'friends', icon:'fi-sr-user',         label:'Friends' },
    { id:'staff',   icon:'fi-sr-shield-check', label:'Staff'   },
    { id:'search',  icon:'fi-sr-search',       label:'Search'  },
  ]

  return (
    <div style={{ width:210, borderLeft:'1px solid #e8eaed', background:'#fff', display:'flex', flexDirection:'column', flexShrink:0 }}>
      {/* Tab bar */}
      <div style={{ display:'flex', alignItems:'center', borderBottom:'1px solid #e8eaed', flexShrink:0 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} title={t.label}
            style={{ flex:1, padding:'9px 2px', border:'none', background:'none', cursor:'pointer', borderBottom:`2px solid ${tab===t.id?'#1a73e8':'transparent'}`, color:tab===t.id?'#1a73e8':'#9ca3af', fontSize:14, transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className={`fi ${t.icon}`}/>
          </button>
        ))}
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:'4px 6px', fontSize:13 }}>
          <i className="fi fi-sr-cross-small"/>
        </button>
      </div>

      {/* Search + filters */}
      {(tab==='search'||tab==='users') && (
        <div style={{ padding:'7px 8px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
          {tab==='search' && (
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by username..."
              style={{ width:'100%', padding:'6px 10px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:7, fontSize:'0.8rem', outline:'none', boxSizing:'border-box', color:'#111827', marginBottom:6 }}
              onFocus={e=>e.target.style.borderColor='#1a73e8'}
              onBlur={e=>e.target.style.borderColor='#e8eaed'}
            />
          )}
          {tab==='search' && (
            <div style={{ display:'flex', gap:4 }}>
              {/* Gender filter */}
              <select value={genderF} onChange={e=>setGenderF(e.target.value)}
                style={{ flex:1, padding:'5px 6px', background:'#f9fafb', border:'1px solid #e8eaed', borderRadius:6, fontSize:'0.74rem', outline:'none', color:'#374151', cursor:'pointer' }}>
                <option value="all">All Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="couple">Couple</option>
                <option value="other">Other</option>
              </select>
              {/* Rank filter */}
              <select value={rankF} onChange={e=>setRankF(e.target.value)}
                style={{ flex:1, padding:'5px 6px', background:'#f9fafb', border:'1px solid #e8eaed', borderRadius:6, fontSize:'0.74rem', outline:'none', color:'#374151', cursor:'pointer' }}>
                <option value="all">All Ranks</option>
                {Object.entries(RANKS).map(([k,v])=>(
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Count */}
      <div style={{ padding:'5px 10px 2px', fontSize:'0.63rem', fontWeight:700, color:'#9ca3af', letterSpacing:'1px', textTransform:'uppercase', flexShrink:0 }}>
        {tab==='staff'?'Staff':'Online'} · {filtered.length}
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {filtered.length===0 ? (
          <p style={{ textAlign:'center', color:'#9ca3af', fontSize:'0.77rem', padding:'16px 10px' }}>
            {tab==='friends'?'No friends online':tab==='staff'?'No staff online':'No users'}
          </p>
        ) : filtered.map((u,i)=>(
          <UserItem key={u.userId||u._id||i} u={u} myLevel={myLevel} onClick={onUserClick}/>
        ))}
      </div>
    </div>
  )
}

// ── LEFT SIDEBAR (with overlay panels) ───────────────────────
function LeftSidebar({ room, onClose, nav, socket }) {
  const [panel, setPanel] = useState(null) // rooms | games | store | leaderboard

  const ITEMS = [
    { id:'rooms',       icon:'fi-sr-house-chimney', label:'Room List'      },
    { id:'wall',        icon:'fi-sr-rss',           label:'Wall'           },
    { id:'news',        icon:'fi-sr-newspaper',     label:'News'           },
    { id:'games',       icon:'fi-sr-dice',          label:'Games'          },
    { id:'store',       icon:'fi-sr-store-alt',     label:'Store'          },
    { id:'leaderboard', icon:'fi-sr-medal',         label:'Leaderboard'    },
    { id:'username',    icon:'fi-sr-edit',          label:'Change Username'},
    { id:'contact',     icon:'fi-sr-envelope',      label:'Contact Us'     },
    { id:'premium',     icon:'fi-sr-crown',         label:'Buy Premium'    },
  ]

  return (
    <div style={{ display:'flex', flexShrink:0 }}>
      {/* Icon strip */}
      <div style={{ width:48, background:'#f8f9fa', borderRight:'1px solid #e8eaed', display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 0', gap:2 }}>
        {/* Current room info at top */}
        <div style={{ padding:'4px 6px 8px', borderBottom:'1px solid #e8eaed', width:'100%', marginBottom:4 }}>
          <img src={room?.icon||'/default_images/rooms/default_room.png'} alt=""
            style={{ width:32, height:32, borderRadius:8, objectFit:'cover', margin:'0 auto', display:'block' }}
            onError={e=>e.target.style.display='none'}
          />
        </div>
        {ITEMS.map(item=>(
          <button key={item.id} title={item.label}
            onClick={()=>item.id==='contact'?window.open('/contact','_blank'):setPanel(p=>p===item.id?null:item.id)}
            style={{ width:36, height:36, borderRadius:8, border:'none', background:panel===item.id?'#e8f0fe':'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:panel===item.id?'#1a73e8':'#6b7280', fontSize:15, transition:'all .12s', flexShrink:0 }}
            onMouseEnter={e=>{if(panel!==item.id){e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.color='#1a73e8'}}}
            onMouseLeave={e=>{if(panel!==item.id){e.currentTarget.style.background='none';e.currentTarget.style.color='#6b7280'}}}
          >
            <i className={`fi ${item.icon}`}/>
          </button>
        ))}
      </div>

      {/* Overlay panel */}
      {panel && (
        <div style={{ width:240, background:'#fff', borderRight:'1px solid #e8eaed', display:'flex', flexDirection:'column', boxShadow:'2px 0 8px rgba(0,0,0,.06)' }}>
          {/* Panel header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderBottom:'1px solid #e8eaed', flexShrink:0 }}>
            <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.88rem', color:'#111827' }}>
              {ITEMS.find(i=>i.id===panel)?.label}
            </span>
            <button onClick={()=>setPanel(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:13 }}>
              <i className="fi fi-sr-cross-small"/>
            </button>
          </div>

          {/* Room list panel */}
          {panel==='rooms' && <RoomListPanel nav={nav} onClose={()=>setPanel(null)} />}

          {/* Games panel */}
          {panel==='games' && (
            <div style={{ padding:'12px', flex:1, overflowY:'auto' }}>
              {[
                { id:'dice',  icon:'fi-sr-dice',  label:'Dice',       desc:'Roll to win gold' },
                { id:'keno',  icon:'fi-sr-grid',  label:'Keno',       desc:'Pick numbers'     },
                { id:'quiz',  icon:'fi-sr-quiz',  label:'Quiz',       desc:'Answer questions' },
              ].map(g=>(
                <button key={g.id} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 12px', background:'#f9fafb', border:'1px solid #e8eaed', borderRadius:9, cursor:'pointer', marginBottom:8, textAlign:'left', transition:'all .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e8eaed'}}
                >
                  <i className={`fi ${g.icon}`} style={{ fontSize:20, color:'#1a73e8', flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:'0.84rem', fontWeight:700, color:'#111827' }}>{g.label}</div>
                    <div style={{ fontSize:'0.72rem', color:'#9ca3af' }}>{g.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Store panel */}
          {panel==='store' && (
            <div style={{ padding:'12px', flex:1, overflowY:'auto' }}>
              <div style={{ background:'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius:10, padding:'14px', marginBottom:10, textAlign:'center' }}>
                <img src="/icons/ui/gold.svg" alt="" style={{ width:32, height:32, margin:'0 auto 6px', display:'block' }} onError={()=>{}} />
                <div style={{ fontSize:'0.84rem', fontWeight:800, color:'#fff' }}>Buy Gold Coins</div>
                <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,.8)', marginTop:2 }}>Use gold for gifts, games & premium</div>
              </div>
              {[{gold:100,price:'₹10'},{gold:500,price:'₹45'},{gold:1000,price:'₹80'},{gold:5000,price:'₹350'}].map(p=>(
                <button key={p.gold} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'10px 12px', background:'#f9fafb', border:'1px solid #e8eaed', borderRadius:8, cursor:'pointer', marginBottom:6, transition:'all .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e8eaed'}}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <img src="/icons/ui/gold.svg" alt="" style={{ width:16, height:16 }} onError={()=>{}} />
                    <span style={{ fontSize:'0.84rem', fontWeight:700, color:'#111827' }}>{p.gold} Gold</span>
                  </div>
                  <span style={{ fontSize:'0.84rem', fontWeight:700, color:'#1a73e8' }}>{p.price}</span>
                </button>
              ))}
            </div>
          )}

          {/* Leaderboard panel */}
          {panel==='leaderboard' && (
            <div style={{ padding:'8px', flex:1, overflowY:'auto' }}>
              {[
                { icon:'fi-sr-star',   label:'XP Leaders'    },
                { icon:'fi-sr-medal',  label:'Level Leaders' },
                { icon:'fi-sr-coins',  label:'Gold Leaders'  },
                { icon:'fi-sr-gift',   label:'Gift Leaders'  },
                { icon:'fi-sr-thumbs-up', label:'Like Leaders' },
              ].map(l=>(
                <button key={l.label} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'10px 12px', background:'#f9fafb', border:'1px solid #e8eaed', borderRadius:8, cursor:'pointer', marginBottom:6, transition:'all .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e8eaed'}}
                >
                  <i className={`fi ${l.icon}`} style={{ fontSize:15, color:'#f59e0b' }}/>
                  <span style={{ fontSize:'0.84rem', fontWeight:600, color:'#111827' }}>{l.label}</span>
                  <i className="fi fi-sr-angle-right" style={{ fontSize:11, color:'#9ca3af', marginLeft:'auto' }}/>
                </button>
              ))}
            </div>
          )}

          {/* Username change */}
          {panel==='username' && (
            <div style={{ padding:'14px', flex:1 }}>
              <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:9, padding:'10px 12px', marginBottom:12, fontSize:'0.8rem', color:'#92400e' }}>
                ⚠️ Username change costs <strong>500 Gold</strong>
              </div>
              <input placeholder="New username..." style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e8eaed', borderRadius:8, fontSize:'0.875rem', outline:'none', boxSizing:'border-box', color:'#111827', background:'#f9fafb', marginBottom:8 }}
                onFocus={e=>e.target.style.borderColor='#1a73e8'}
                onBlur={e=>e.target.style.borderColor='#e8eaed'}
              />
              <button style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>
                Change Username
              </button>
            </div>
          )}

          {/* Premium */}
          {panel==='premium' && (
            <div style={{ padding:'14px', flex:1, textAlign:'center' }}>
              <i className="fi fi-sr-crown" style={{ fontSize:40, color:'#f59e0b', display:'block', marginBottom:12 }}/>
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1rem', color:'#111827', marginBottom:6 }}>Go Premium</div>
              <p style={{ fontSize:'0.82rem', color:'#6b7280', marginBottom:14, lineHeight:1.6 }}>Get exclusive rank, custom name color, premium badge and more!</p>
              <div style={{ background:'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius:10, padding:'12px', color:'#fff', fontWeight:700, fontSize:'0.875rem', cursor:'pointer' }}>
                Coming Soon 🚀
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Room list inside left sidebar
function RoomListPanel({ nav, onClose }) {
  const [rooms, setRooms] = useState([])
  const [load,  setLoad]  = useState(true)

  useEffect(()=>{
    const token = localStorage.getItem('cgz_token')
    fetch(`${API}/api/rooms`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(d=>setRooms(d.rooms||[])).catch(()=>{}).finally(()=>setLoad(false))
  },[])

  if (load) return <div style={{ textAlign:'center', padding:'20px' }}><div style={{ width:24, height:24, border:'2px solid #e8eaed', borderTop:'2px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }} /></div>

  return (
    <div style={{ flex:1, overflowY:'auto' }}>
      {rooms.map(r=>(
        <div key={r._id} onClick={()=>{ nav(`/chat/${r._id}`); onClose() }}
          style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', cursor:'pointer', borderBottom:'1px solid #f3f4f6', transition:'background .12s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          <img src={r.icon||'/default_images/rooms/default_room.png'} alt="" style={{ width:30, height:30, borderRadius:7, objectFit:'cover', flexShrink:0 }} onError={e=>e.target.style.display='none'} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</div>
            <div style={{ fontSize:'0.69rem', color:'#9ca3af' }}>{r.currentUsers||0} online</div>
          </div>
          <i className="fi fi-sr-angle-right" style={{ fontSize:11, color:'#9ca3af', flexShrink:0 }}/>
        </div>
      ))}
    </div>
  )
}

// ── RADIO PLAYER ──────────────────────────────────────────────
function RadioPlayer({ onClose }) {
  const [stations, setStations] = useState([])
  const [current,  setCurrent]  = useState(null)
  const [playing,  setPlaying]  = useState(false)
  const audioRef = useRef(null)

  useEffect(()=>{
    fetch(`${API}/api/radio`).then(r=>r.json()).then(d=>setStations(d.stations||[])).catch(()=>{})
    return ()=>{ audioRef.current?.pause() }
  },[])

  function play(station) {
    if (current?.id===station.id && playing) {
      audioRef.current?.pause(); setPlaying(false); return
    }
    setCurrent(station)
    if (audioRef.current) {
      audioRef.current.src = station.streamUrl
      audioRef.current.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false))
    }
  }

  const langs = [...new Set(stations.map(s=>s.language))]

  return (
    <div style={{ position:'fixed', bottom:54, left:0, right:0, zIndex:999, background:'#fff', border:'1px solid #e8eaed', borderRadius:'12px 12px 0 0', boxShadow:'0 -4px 20px rgba(0,0,0,.12)', maxHeight:'55vh', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <i className="fi fi-sr-radio" style={{ color:'#1a73e8', fontSize:16 }}/>
          <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'#111827' }}>
            {playing && current ? `🎵 ${current.name}` : 'Radio'}
          </span>
        </div>
        {playing && (
          <button onClick={()=>{audioRef.current?.pause();setPlaying(false)}} style={{ background:'#fee2e2', border:'none', color:'#dc2626', padding:'4px 10px', borderRadius:20, cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
            ⏸ Stop
          </button>
        )}
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:16 }}>
          <i className="fi fi-sr-cross-small"/>
        </button>
      </div>
      {/* Station list */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
        {langs.map(lang=>(
          <div key={lang}>
            <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#9ca3af', letterSpacing:'1px', textTransform:'uppercase', padding:'6px 8px 4px' }}>{lang}</div>
            {stations.filter(s=>s.language===lang).map(s=>(
              <button key={s.id} onClick={()=>play(s)}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'8px 10px', background:current?.id===s.id?'#e8f0fe':'none', border:`1px solid ${current?.id===s.id?'#1a73e8':'transparent'}`, borderRadius:8, cursor:'pointer', marginBottom:3, textAlign:'left', transition:'all .15s' }}
              >
                <div style={{ width:30, height:30, background:'#f3f4f6', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:14 }}>
                  {current?.id===s.id && playing ? '🎵' : s.flag||'📻'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize:'0.69rem', color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.genre}</div>
                </div>
                {current?.id===s.id && playing && (
                  <span style={{ fontSize:10, color:'#1a73e8', fontWeight:700, flexShrink:0 }}>▶ LIVE</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
      <audio ref={audioRef} style={{ display:'none' }} />
    </div>
  )
}

// ── PROFILE DROPDOWN ─────────────────────────────────────────
function AvatarDropdown({ me, status, setStatus, socket, roomId, onLeave }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const nav = useNavigate()

  useEffect(()=>{
    const fn = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  },[open])

  const ri     = R(me?.rank)
  const border = GBR(me?.gender, me?.rank)
  const curSt  = STATUSES.find(s=>s.id===status)||STATUSES[0]
  const isStaff= (me?.rank&&['moderator','admin','superadmin','owner'].includes(me.rank))
  const isOwner= me?.rank==='owner'

  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
        <div style={{ position:'relative' }}>
          <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
            style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover', border:`2px solid ${border}`, display:'block' }}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
          />
          <span style={{ position:'absolute', bottom:0, right:0, width:8, height:8, background:curSt.color, borderRadius:'50%', border:'1.5px solid #fff' }} />
        </div>
      </button>

      {open && (
        <div style={{ position:'absolute', right:0, top:'calc(100% + 6px)', background:'#fff', border:'1px solid #e8eaed', borderRadius:14, minWidth:225, boxShadow:'0 6px 24px rgba(0,0,0,.13)', zIndex:999, overflow:'hidden' }}>
          {/* User card */}
          <div style={{ padding:'12px 13px 10px', borderBottom:'1px solid #f3f4f6' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:8 }}>
              <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
                style={{ width:40, height:40, borderRadius:'50%', border:`2.5px solid ${border}`, objectFit:'cover', flexShrink:0 }}
                onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
              />
              <div style={{ minWidth:0 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.88rem', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{me?.username}</div>
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3 }}>
                  <img src={`/icons/ranks/${ri.icon}`} alt="" style={{ width:13, height:13 }} onError={e=>e.target.style.display='none'} />
                  <span style={{ fontSize:'0.68rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
                </div>
              </div>
              <span style={{ marginLeft:'auto', fontSize:16, flexShrink:0 }}>{curSt.icon||'🟢'}</span>
            </div>
            {/* Gold + Level */}
            {!me?.isGuest && (
              <div style={{ display:'flex', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <img src="/icons/ui/gold.svg" alt="" style={{ width:13, height:13 }} onError={e=>e.target.style.display='none'} />
                  <span style={{ fontSize:'0.71rem', fontWeight:700, color:'#d97706' }}>{me?.gold||0}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <img src="/icons/ui/level.svg" alt="" style={{ width:13, height:13 }} onError={e=>e.target.style.display='none'} />
                  <span style={{ fontSize:'0.71rem', fontWeight:700, color:'#1a73e8' }}>{me?.level||1}</span>
                </div>
              </div>
            )}
          </div>
          {/* Status */}
          <div style={{ padding:'6px 8px', borderBottom:'1px solid #f3f4f6' }}>
            <div style={{ display:'flex', gap:4 }}>
              {STATUSES.map(s=>(
                <button key={s.id} onClick={()=>setStatus(s.id)} title={s.label}
                  style={{ flex:1, padding:'5px 2px', borderRadius:6, border:`1.5px solid ${status===s.id?s.color:'#e8eaed'}`, background:status===s.id?s.color+'15':'none', cursor:'pointer', fontSize:'0.65rem', fontWeight:600, color:status===s.id?s.color:'#6b7280', transition:'all .15s' }}>
                  {s.label.slice(0,3)}
                </button>
              ))}
            </div>
          </div>
          {/* Actions */}
          <div style={{ padding:'4px' }}>
            <DropItem icon="fi-ss-user"        label="My Profile"     onClick={()=>setOpen(false)} />
            <DropItem icon="fi-sr-pencil"      label="Edit Profile"   onClick={()=>setOpen(false)} />
            <DropItem icon="fi-sr-wallet"      label="Wallet"         onClick={()=>setOpen(false)} />
            <DropItem icon="fi-sr-layer-group" label="Level Status"   onClick={()=>setOpen(false)} />
            {isStaff && <DropItem icon="fi-sr-settings"  label="Room Options"  onClick={()=>setOpen(false)} />}
            {isStaff && <DropItem icon="fi-sr-dashboard" label="Admin Panel" color="#ef4444" onClick={()=>{setOpen(false);window.location.href='/admin'}} />}
            {isOwner && <DropItem icon="fi-sr-cog"       label="Site Settings" color="#6b7280" onClick={()=>setOpen(false)} />}
            <div style={{ borderTop:'1px solid #f3f4f6', margin:'4px 0' }} />
            <DropItem icon="fi-sr-arrow-left"  label="Leave Room" color="#374151" onClick={onLeave} />
            <DropItem icon="fi-sr-user-logout" label="Logout"     color="#ef4444" onClick={()=>{
              const token=localStorage.getItem('cgz_token')
              if(token)fetch(`${API}/api/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
              localStorage.removeItem('cgz_token'); nav('/login')
            }} />
          </div>
        </div>
      )}
    </div>
  )
}
function DropItem({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'8px 10px', background:'none', border:'none', cursor:'pointer', color:color||'#374151', fontSize:'0.83rem', fontWeight:600, borderRadius:7, textAlign:'left', transition:'background .12s' }}
      onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
      onMouseLeave={e=>e.currentTarget.style.background='none'}
    >
      <i className={`fi ${icon}`} style={{ fontSize:13, width:15, textAlign:'center', flexShrink:0 }}/>{label}
    </button>
  )
}

// ── FOOTER (shared PC + mobile) ───────────────────────────────
function Footer({ showRadio, setShowRadio, rightTab, setRightTab, showRight, setRight, notif }) {
  const TABS = [
    { id:'users',   icon:'fi-sr-users',       label:'Users'   },
    { id:'friends', icon:'fi-sr-user',         label:'Friends' },
    { id:'staff',   icon:'fi-sr-shield-check', label:'Staff'   },
    { id:'search',  icon:'fi-sr-search',       label:'Search'  },
  ]

  return (
    <div style={{ background:'#fff', borderTop:'1px solid #e8eaed', padding:'5px 10px', display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
      {/* Radio button - left */}
      <button onClick={()=>setShowRadio(s=>!s)} title="Radio"
        style={{ background:showRadio?'#e8f0fe':'none', border:'none', cursor:'pointer', color:showRadio?'#1a73e8':'#9ca3af', width:36, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
        <i className="fi fi-sr-radio"/>
      </button>

      <div style={{ flex:1 }} />

      {/* Right sidebar tabs in footer */}
      <div style={{ display:'flex', gap:2 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{ setRightTab(t.id); setRight(true) }} title={t.label}
            style={{ background:showRight&&rightTab===t.id?'#e8f0fe':'none', border:'none', cursor:'pointer', color:showRight&&rightTab===t.id?'#1a73e8':'#9ca3af', width:36, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, position:'relative' }}>
            <i className={`fi ${t.icon}`}/>
            {t.id==='friends' && notif.friends>0 && <Badge n={notif.friends}/>}
          </button>
        ))}
      </div>
    </div>
  )
}
function Badge({ n }) {
  return <span style={{ position:'absolute', top:4, right:4, width:8, height:8, background:'#ef4444', borderRadius:'50%', border:'1.5px solid #fff' }} />
}

// ── MAIN CHATROOM ─────────────────────────────────────────────
export default function ChatRoom() {
  const { roomId } = useParams()
  const nav        = useNavigate()
  const token      = localStorage.getItem('cgz_token')

  const [me,        setMe]       = useState(null)
  const [room,      setRoom]     = useState(null)
  const [messages,  setMsgs]     = useState([])
  const [users,     setUsers]    = useState([])
  const [input,     setInput]    = useState('')
  const [rightTab,  setRightTab] = useState('users')
  const [showRight, setRight]    = useState(true)
  const [showLeft,  setLeft]     = useState(false)
  const [profUser,  setProf]     = useState(null)
  const [miniCard,  setMiniCard] = useState(null)
  const [loading,   setLoad]     = useState(true)
  const [roomErr,   setErr]      = useState('')
  const [connected, setConn]     = useState(false)
  const [status,    setStatus]   = useState('online')
  const [showRadio, setRadio]    = useState(false)
  const [notif,     setNotif]    = useState({ dm:0, friends:0, notif:0, reports:0 })

  const sockRef  = useRef(null)
  const bottomRef= useRef(null)
  const inputRef = useRef(null)

  useEffect(()=>{
    if (!token) { nav('/login'); return }
    loadRoom()
    return ()=>sockRef.current?.disconnect()
  },[roomId])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  // Auto-logout on token expiry
  useEffect(()=>{
    const check = setInterval(async ()=>{
      const t = localStorage.getItem('cgz_token')
      if (!t) { nav('/login'); return }
      const r = await fetch(`${API}/api/auth/me`,{headers:{Authorization:`Bearer ${t}`}}).catch(()=>null)
      if (r?.status===401) { localStorage.removeItem('cgz_token'); nav('/login') }
    }, 5*60*1000) // check every 5 min
    return ()=>clearInterval(check)
  },[])

  async function loadRoom() {
    setLoad(true); setErr('')
    try {
      const [mr,rr] = await Promise.all([
        fetch(`${API}/api/auth/me`,         {headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/rooms/${roomId}`,  {headers:{Authorization:`Bearer ${token}`}}),
      ])
      if (mr.status===401) { localStorage.removeItem('cgz_token'); nav('/login'); return }
      const md = await mr.json()
      if (md.user) {
        if (md.freshToken) localStorage.setItem('cgz_token', md.freshToken)
        setMe(md.user)
      }
      const rd = await rr.json()
      if (!rr.ok) { setErr(rd.error||'Room not found'); setLoad(false); return }
      setRoom(rd.room)
      fetch(`${API}/api/rooms/${roomId}/messages?limit=50`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>{ if(d.messages) setMsgs(d.messages) }).catch(()=>{})
    } catch { setErr('Connection failed.') }
    setLoad(false)
    connectSocket()
  }

  function connectSocket() {
    sockRef.current?.disconnect()
    const s = io(API,{auth:{token},transports:['websocket','polling']})
    s.on('connect',        ()  =>{ setConn(true); s.emit('joinRoom',{roomId}) })
    s.on('disconnect',     ()  => setConn(false))
    s.on('messageHistory', ms => setMsgs(ms||[]))
    s.on('newMessage',     m  => setMsgs(p=>[...p,m]))
    s.on('roomUsers',      l  => setUsers(l||[]))
    s.on('userJoined',     u  =>{ setUsers(p=>p.find(x=>x.userId===u.userId)?p:[...p,u]); setMsgs(p=>[...p,{_id:Date.now(),type:'system',content:`${u.username} joined`,createdAt:new Date()}]) })
    s.on('userLeft',       u  =>{ setUsers(p=>p.filter(x=>x.userId!==u.userId)); setMsgs(p=>[...p,{_id:Date.now()+'l',type:'system',content:`${u.username} left`,createdAt:new Date()}]) })
    s.on('systemMessage',  m  => setMsgs(p=>[...p,{_id:Date.now()+'s',type:'system',content:m.text,createdAt:new Date()}]))
    s.on('messageDeleted', id => setMsgs(p=>p.filter(m=>m._id!==id)))
    s.on('error', e=>console.error('Socket:',e))
    sockRef.current = s
  }

  function send(e) {
    e.preventDefault()
    const t = input.trim()
    if (!t||!sockRef.current||!connected) return
    sockRef.current.emit('sendMessage',{roomId,content:t,type:'text'})
    setInput(''); inputRef.current?.focus()
  }

  function leave() { sockRef.current?.disconnect(); nav('/chat') }

  const myLevel = RANKS[me?.rank]?.level || 1
  const myRi    = R(me?.rank)
  const myBdr   = GBR(me?.gender, me?.rank)
  const isStaff = myLevel >= 11

  const handleMiniCard = useCallback((user, pos) => {
    setMiniCard({ user, pos })
    setProf(null)
  }, [])

  if (!loading && roomErr) return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div style={{ fontSize:40 }}>⚠️</div>
      <p style={{ color:'#374151', fontWeight:600 }}>{roomErr}</p>
      <button onClick={()=>nav('/chat')} style={{ padding:'10px 22px', borderRadius:9, border:'none', background:'#1a73e8', color:'#fff', fontWeight:700, cursor:'pointer' }}>← Back to Lobby</button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:32, height:32, border:'3px solid #e8eaed', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 10px' }} />
        <p style={{ color:'#9ca3af', fontSize:'0.875rem' }}>Joining room...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#fff', overflow:'hidden' }} onClick={()=>setMiniCard(null)}>

      {/* ── HEADER ── */}
      <div style={{ height:48, background:'#fff', borderBottom:'1px solid #e8eaed', display:'flex', alignItems:'center', padding:'0 8px', gap:6, flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>

        {/* Left: CAM icon (user uploads it) + hamburger */}
        <button onClick={()=>setLeft(s=>!s)} title="Menu"
          style={{ background:showLeft?'#e8f0fe':'none', border:'none', cursor:'pointer', color:showLeft?'#1a73e8':'#6b7280', width:34, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {/* Webcam icon — user will upload to /icons/ui/webcam.png */}
          <img src="/icons/ui/webcam.png" alt="" style={{ width:20, height:20, objectFit:'contain' }}
            onError={e=>{e.target.style.display='none'; e.target.parentNode.innerHTML='<i class="fi fi-sr-video-camera" style="font-size:15px"></i>'}}
          />
        </button>

        <div style={{ flex:1 }} />

        {/* Right icons: DM, Friends, Notifications, Reports, Avatar */}
        <HBtn icon="fi-sr-envelope"  title="Private Messages" badge={notif.dm}      onClick={()=>{}} />
        <HBtn icon="fi-sr-user-add"  title="Friend Requests"  badge={notif.friends} onClick={()=>{}} />
        <HBtn icon="fi-sc-bell-ring" title="Notifications"    badge={notif.notif}   onClick={()=>{}} />
        {isStaff && <HBtn icon="fi-sr-flag" title="Reports" badge={notif.reports} onClick={()=>{}} />}

        {/* Avatar + dropdown */}
        <AvatarDropdown
          me={me}
          status={status}
          setStatus={setStatus}
          socket={sockRef.current}
          roomId={roomId}
          onLeave={leave}
        />
      </div>

      {/* ── BODY ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Left sidebar */}
        {showLeft && <LeftSidebar room={room} nav={nav} onClose={()=>setLeft(false)} socket={sockRef.current} />}

        {/* Messages */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Topic bar */}
          {room?.topic && (
            <div style={{ background:'#f8f9fa', borderBottom:'1px solid #e8eaed', padding:'6px 14px', fontSize:'0.78rem', color:'#374151', flexShrink:0 }}>
              <i className="fi fi-sr-info" style={{ marginRight:6, color:'#1a73e8' }}/>{room.topic}
            </div>
          )}

          {/* Messages area */}
          <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
            {messages.map((m,i)=>(
              <Msg key={m._id||i} msg={m} myLevel={myLevel}
                onMiniCard={handleMiniCard}
                onSetInput={setInput}
              />
            ))}
            <div ref={bottomRef}/>
          </div>

          {/* Input bar */}
          <div style={{ borderTop:'1px solid #e8eaed', padding:'8px 10px', background:'#fff', flexShrink:0 }}>
            <form onSubmit={send} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <button type="button" title="Emoji" style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:20, padding:'0 2px', flexShrink:0, display:'flex', alignItems:'center' }}>
                <i className="fi fi-rr-smile"/>
              </button>
              <button type="button" title="Upload" style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:17, padding:'0 2px', flexShrink:0, display:'flex', alignItems:'center' }}>
                <i className="fi fi-sr-picture"/>
              </button>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                placeholder={connected?'Type a message...':'Connecting...'}
                disabled={!connected}
                style={{ flex:1, padding:'9px 14px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:22, color:'#111827', fontSize:'0.875rem', outline:'none', transition:'border-color .15s' }}
                onFocus={e=>e.target.style.borderColor='#1a73e8'}
                onBlur={e=>e.target.style.borderColor='#e8eaed'}
              />
              <button type="button" title="Gift" style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, padding:'0 2px', flexShrink:0, display:'flex', alignItems:'center' }}>
                <i className="fi fi-sr-gift"/>
              </button>
              <button type="submit" disabled={!input.trim()||!connected}
                style={{ width:36, height:36, borderRadius:'50%', border:'none', background:input.trim()&&connected?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6', color:input.trim()&&connected?'#fff':'#9ca3af', cursor:input.trim()&&connected?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                <i className="fi fi-sr-paper-plane"/>
              </button>
            </form>
          </div>
        </div>

        {/* Right sidebar */}
        {showRight && (
          <RightSidebar
            users={users}
            myLevel={myLevel}
            onUserClick={u=>{ setProf(u); setMiniCard(null) }}
            onClose={()=>setRight(false)}
          />
        )}
      </div>

      {/* ── FOOTER (same for PC and mobile) ── */}
      <Footer
        showRadio={showRadio} setShowRadio={setRadio}
        rightTab={rightTab}   setRightTab={setRightTab}
        showRight={showRight} setRight={setRight}
        notif={notif}
      />

      {/* Radio player */}
      {showRadio && <RadioPlayer onClose={()=>setRadio(false)} />}

      {/* Mini card */}
      {miniCard && (
        <MiniCard
          user={miniCard.user}
          myLevel={myLevel}
          pos={miniCard.pos}
          onClose={()=>setMiniCard(null)}
          onViewFull={()=>{ setProf(miniCard.user); setMiniCard(null) }}
          socket={sockRef.current}
          roomId={roomId}
        />
      )}

      {/* Full profile modal */}
      {profUser && (
        <ProfileModal
          user={profUser}
          myLevel={myLevel}
          socket={sockRef.current}
          roomId={roomId}
          onClose={()=>setProf(null)}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function HBtn({ icon, title, active, onClick, badge }) {
  return (
    <button onClick={onClick} title={title}
      style={{ position:'relative', background:active?'#e8f0fe':'none', border:'none', cursor:'pointer', color:active?'#1a73e8':'#9ca3af', width:34, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, transition:'all .15s', flexShrink:0 }}
      onMouseEnter={e=>{if(!active){e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.color='#374151'}}}
      onMouseLeave={e=>{if(!active){e.currentTarget.style.background='none';e.currentTarget.style.color='#9ca3af'}}}
    >
      <i className={`fi ${icon}`}/>
      {badge>0 && <span style={{ position:'absolute', top:5, right:5, width:7, height:7, background:'#ef4444', borderRadius:'50%', border:'1.5px solid #fff' }}/>}
    </button>
  )
}
