import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

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
const GBR = (g,r) => r==='bot'?'transparent':({male:'#03add8',female:'#ff99ff',couple:'#9c6fde',other:'#cccccc'}[g]||'#cccccc')
const R   = r => RANKS[r] || RANKS.guest
const RL  = r => RANKS[r]?.level || 0

// ── ICON HELPER — uses uploaded icons where available ─────────
function Icon({ name, size=16, style={} }) {
  const map = {
    'webcam':      '/icons/ui/webcam.png',
    'cam_off':     '/icons/ui/cam_off.png',
    'mic_off':     '/icons/ui/mic_off.png',
    'cam_gift':    '/icons/ui/cam_gift.png',
    'ban_user':    '/icons/ui/ban_user.png',
    'cam_viewers': '/icons/ui/cam_viewers.png',
    'user_logout': '/icons/ui/user_logout.svg',
    'gold':        '/icons/ui/gold.svg',
    'level':       '/icons/ui/level.svg',
    'gift':        '/icons/ui/gift.svg',
  }
  if (map[name]) return <img src={map[name]} alt={name} style={{ width:size, height:size, objectFit:'contain', ...style }} onError={e=>e.target.style.display='none'} />
  return null
}

// ── MINI CARD ─────────────────────────────────────────────────
function MiniCard({ user, myLevel, pos, onClose, onViewFull, socket, roomId }) {
  if (!user) return null
  const ri     = R(user.rank)
  const bdr    = GBR(user.gender, user.rank)
  const canMod = myLevel >= 11 && RL(user.rank) < myLevel
  const canBan = myLevel >= 12 && RL(user.rank) < myLevel
  const isOwn  = myLevel >= 14
  const x = Math.min(pos.x, window.innerWidth - 225)
  const y = Math.min(pos.y, window.innerHeight - 310)

  return (
    <div style={{ position:'fixed', zIndex:9999, top:y, left:x, background:'#fff', border:'1px solid #e8eaed', borderRadius:12, width:215, boxShadow:'0 8px 28px rgba(0,0,0,.14)', overflow:'hidden' }}
      onClick={e=>e.stopPropagation()}
    >
      <div style={{ height:36, background:`linear-gradient(135deg,${ri.color}33,#e8f0fe)` }} />
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, padding:'0 12px', marginTop:-18, marginBottom:6 }}>
        <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt=""
          style={{ width:38, height:38, borderRadius:'50%', border:`2px solid ${bdr}`, objectFit:'cover', background:'#fff', flexShrink:0 }}
          onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
        />
        <div style={{ paddingBottom:4 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.84rem', color:'#111827' }}>{user.username}</div>
          <div style={{ display:'flex', alignItems:'center', gap:3 }}>
            <img src={`/icons/ranks/${ri.icon}`} style={{ width:10, height:10 }} onError={e=>e.target.style.display='none'} alt="" />
            <span style={{ fontSize:'0.65rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
          </div>
        </div>
      </div>
      <div style={{ padding:'6px 8px 8px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
        <MCBtn icon="fi-sr-circle-user" label="Profile"   onClick={onViewFull} />
        <MCBtn icon="fi-sr-comments"   label="PM"         />
        <MCBtn icon="fi-sr-phone-call" label="Call"       />
        <MCBtn icon="fi-sr-gift"       label="Gift"       color="#7c3aed" />
        {myLevel >= 2 && <MCBtn icon="fi-sr-user-add"      label="Friend"  color="#059669" />}
        {myLevel >= 2 && <MCBtn icon="fi-sr-user-block"    label="Ignore"  color="#6b7280" />}
        {canMod && <MCBtn icon="fi-sr-volume-mute" label="Mute"  color="#f59e0b" onClick={()=>socket?.emit('muteUser',{targetUserId:user._id,roomId,minutes:5})} />}
        {canMod && <MCBtn icon="fi-sr-user-slash"  label="Kick"  color="#ef4444" onClick={()=>{socket?.emit('kickUser',{targetUserId:user._id,roomId});onClose()}} />}
        {canBan  && <MCBtn icon="fi-sr-ban"        label="Ban"   color="#dc2626" />}
        {isOwn   && <MCBtn icon="fi-sr-shield-check" label="Rank" color="#1a73e8" />}
        <MCBtn icon="fi-sr-flag" label="Report" color="#ef4444" />
      </div>
    </div>
  )
}
function MCBtn({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 7px', background:'#f9fafb', border:'1px solid #e8eaed', borderRadius:7, cursor:'pointer', fontSize:'0.72rem', fontWeight:600, color:color||'#374151', transition:'all .12s' }}
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
        <div style={{ height:80, background:`linear-gradient(135deg,${ri.color}44,#e8f0fe)`, position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', top:10, right:10, background:'rgba(255,255,255,.8)', border:'none', width:28, height:28, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
            <i className="fi fi-sr-cross-small"/>
          </button>
          {user.countryCode && user.countryCode!=='ZZ' && (
            <img src={`/icons/flags/${user.countryCode.toLowerCase()}.png`} alt="" style={{ position:'absolute', bottom:8, right:12, width:22, height:15, borderRadius:2 }} onError={e=>e.target.style.display='none'} />
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
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, margin:'4px 0 10px' }}>
            <img src={`/icons/ranks/${ri.icon}`} style={{ width:14, height:14 }} onError={e=>e.target.style.display='none'} alt="" />
            <span style={{ fontSize:'0.73rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
          </div>
          {user.mood  && <p style={{ fontSize:'0.77rem', color:'#6b7280', marginBottom:8, fontStyle:'italic' }}>"{user.mood}"</p>}
          {user.about && <p style={{ fontSize:'0.77rem', color:'#6b7280', marginBottom:12, lineHeight:1.5 }}>{user.about}</p>}
          <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:14 }}>
            {[{l:'Level',v:user.level||1,c:'#1a73e8'},{l:'Gold',v:user.gold||0,c:'#d97706'},{l:'Msgs',v:user.totalMessages||0,c:'#7c3aed'},{l:'Gifts',v:user.totalGiftsReceived||0,c:'#ef4444'}].map(s=>(
              <div key={s.l} style={{ textAlign:'center', background:'#f9fafb', borderRadius:8, padding:'5px 10px' }}>
                <div style={{ fontSize:'0.6rem', color:'#9ca3af' }}>{s.l}</div>
                <div style={{ fontSize:'0.88rem', fontWeight:800, color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center' }}>
            <PBtn icon="fi-sr-comments"   label="Private"  />
            <PBtn icon="fi-sr-phone-call" label="Call"     />
            <PBtn icon="fi-sr-gift"       label="Gift"     color="#7c3aed" />
            <PBtn icon="fi-sr-user-add"   label="Friend"   color="#059669" />
            <PBtn icon="fi-sr-user-block" label="Ignore"   color="#6b7280" />
            <PBtn icon="fi-sr-flag"       label="Report"   color="#ef4444" />
            {canMod && <PBtn icon="fi-sr-volume-mute" label="Mute"    color="#f59e0b" onClick={()=>socket?.emit('muteUser',{targetUserId:user._id,roomId,minutes:5})} />}
            {canMod && <PBtn icon="fi-sr-user-slash"  label="Kick"    color="#ef4444" onClick={()=>{socket?.emit('kickUser',{targetUserId:user._id,roomId});onClose()}} />}
            {canBan  && <PBtn icon="fi-sr-ban"        label="Ban"     color="#dc2626" />}
            {canMod  && <PBtn icon="fi-sr-eye-crossed" label="Ghost"  color="#6b7280" />}
            {isOwn   && <PBtn icon="fi-sr-shield-check" label="Set Rank" color="#1a73e8" />}
            {isOwn   && <PBtn icon="fi-sr-pencil" label="Edit User" color="#374151" />}
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
  const isSystem = msg.type==='system'
  const ri  = R(msg.sender?.rank)
  const bdr = GBR(msg.sender?.gender, msg.sender?.rank)
  const col = msg.sender?.nameColor || ri.color
  const ts  = new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})

  if (isSystem) return (
    <div style={{ textAlign:'center', padding:'3px 0' }}>
      <span style={{ fontSize:'0.7rem', color:'#9ca3af', background:'#f3f4f6', padding:'2px 12px', borderRadius:20 }}>{msg.content}</span>
    </div>
  )

  const renderText = (text) => {
    if (!text) return text
    return text.split(/(@\w+)/g).map((p,i)=>
      p.startsWith('@') ? <span key={i} style={{ color:'#1a73e8', fontWeight:700 }}>{p}</span> : p
    )
  }

  return (
    <div style={{ display:'flex', gap:8, padding:'3px 12px', alignItems:'flex-start' }}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,.02)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <img src={msg.sender?.avatar||'/default_images/avatar/default_guest.png'} alt=""
        onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();onMiniCard(msg.sender,{x:r.left,y:r.bottom+4})}}
        style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${bdr}`, flexShrink:0, cursor:'pointer', marginTop:2 }}
        onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
      />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2, flexWrap:'wrap' }}>
          <img src={`/icons/ranks/${ri.icon}`} style={{ width:11, height:11, flexShrink:0 }} onError={e=>e.target.style.display='none'} alt="" />
          <span onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();onMiniCard(msg.sender,{x:r.left,y:r.bottom+4})}}
            style={{ fontSize:'0.79rem', fontWeight:700, color:col, cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'}
            onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}
          >{msg.sender?.username}</span>
          <span style={{ fontSize:'0.63rem', color:'#9ca3af' }}>{ts}</span>
        </div>
        {/* Click bubble to mention */}
        <div onClick={()=>onSetInput(p=>msg.sender?.username+' '+p)}
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
function UserItem({ u, onClick }) {
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
      <span style={{ flex:1, fontSize:'0.79rem', fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.username}</span>
      <img src={`/icons/ranks/${ri.icon}`} style={{ width:13, height:13, flexShrink:0 }} onError={e=>e.target.style.display='none'} alt="" />
      {u.countryCode && u.countryCode!=='ZZ' && (
        <img src={`/icons/flags/${u.countryCode.toLowerCase()}.png`} style={{ width:16, height:11, flexShrink:0, borderRadius:1 }} onError={e=>e.target.style.display='none'} alt="" />
      )}
    </div>
  )
}

// ── RIGHT SIDEBAR ─────────────────────────────────────────────
function RightSidebar({ users, myLevel, tab, setTab, onUserClick, onClose }) {
  const [search, setSearch] = useState('')
  const [rankF,  setRankF]  = useState('all')
  const [genderF,setGenderF]= useState('all')

  const sorted  = [...users].sort((a,b)=>{ const d=(RL(b.rank))-(RL(a.rank)); return d!==0?d:(a.username||'').localeCompare(b.username||'') })
  const staff   = sorted.filter(u=>RL(u.rank)>=11)
  const friends = sorted.filter(u=>u.isFriend)
  const base    = tab==='staff'?staff:tab==='friends'?friends:sorted
  const filtered= base.filter(u=>{
    const ms = !search||u.username.toLowerCase().includes(search.toLowerCase())
    const mr = rankF==='all'||u.rank===rankF
    const mg = genderF==='all'||u.gender===genderF
    return ms&&mr&&mg
  })

  return (
    <div style={{ width:210, borderLeft:'1px solid #e8eaed', background:'#fff', display:'flex', flexDirection:'column', flexShrink:0 }}>
      {/* Close + count */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px 4px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
        <span style={{ fontSize:'0.65rem', fontWeight:700, color:'#9ca3af', letterSpacing:'1px', textTransform:'uppercase' }}>
          {tab==='staff'?'Staff':'Online'} · {filtered.length}
        </span>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:14 }}>
          <i className="fi fi-sr-cross-small"/>
        </button>
      </div>

      {/* Search + filters for search tab */}
      {tab==='search' && (
        <div style={{ padding:'7px 8px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search username..."
            style={{ width:'100%', padding:'6px 10px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:7, fontSize:'0.79rem', outline:'none', boxSizing:'border-box', color:'#111827', marginBottom:6 }}
            onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e8eaed'}
          />
          <div style={{ display:'flex', gap:4 }}>
            <select value={genderF} onChange={e=>setGenderF(e.target.value)}
              style={{ flex:1, padding:'5px 4px', background:'#f9fafb', border:'1px solid #e8eaed', borderRadius:6, fontSize:'0.72rem', outline:'none', color:'#374151', cursor:'pointer' }}>
              <option value="all">All Gender</option>
              <option value="male">Male</option><option value="female">Female</option>
              <option value="couple">Couple</option><option value="other">Other</option>
            </select>
            <select value={rankF} onChange={e=>setRankF(e.target.value)}
              style={{ flex:1, padding:'5px 4px', background:'#f9fafb', border:'1px solid #e8eaed', borderRadius:6, fontSize:'0.72rem', outline:'none', color:'#374151', cursor:'pointer' }}>
              <option value="all">All Ranks</option>
              {Object.entries(RANKS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
      )}

      <div style={{ flex:1, overflowY:'auto' }}>
        {filtered.length===0
          ? <p style={{ textAlign:'center', color:'#9ca3af', fontSize:'0.77rem', padding:'16px 10px' }}>
              {tab==='friends'?'No friends online':tab==='staff'?'No staff':tab==='search'?'No results':'No users'}
            </p>
          : filtered.map((u,i)=><UserItem key={u.userId||u._id||i} u={u} onClick={onUserClick}/>)
        }
      </div>
    </div>
  )
}

// ── LEFT SIDEBAR (with expandable panels) ────────────────────
function LeftSidebar({ room, nav, socket }) {
  const [panel, setPanel] = useState(null)

  const ITEMS = [
    { id:'rooms',       icon:'fi-sr-house-chimney', label:'Room List'      },
    { id:'wall',        icon:'fi-sr-rss',           label:'Wall'           },
    { id:'news',        icon:'fi-sr-newspaper',     label:'News'           },
    { id:'games',       icon:'fi-sr-dice',          label:'Games'          },
    { id:'store',       icon:'fi-sr-store-alt',     label:'Store'          },
    { id:'leaderboard', icon:'fi-sr-medal',         label:'Leaderboard'    },
    { id:'username',    icon:'fi-sr-edit',          label:'Change Username'},
    { id:'contact',     icon:'fi-sr-envelope',      label:'Contact Us', fn:()=>window.open('/contact','_blank') },
    { id:'premium',     icon:'fi-sr-crown',         label:'Buy Premium'    },
  ]

  return (
    <div style={{ display:'flex', height:'100%', flexShrink:0 }}>
      {/* Icon strip */}
      <div style={{ width:48, background:'#f8f9fa', borderRight:'1px solid #e8eaed', display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 0', gap:1, overflowY:'auto' }}>
        {/* Room icon at top */}
        <div style={{ padding:'2px 0 6px', borderBottom:'1px solid #e8eaed', width:'100%', textAlign:'center', marginBottom:4 }}>
          <img src={room?.icon||'/default_images/rooms/default_room.png'} alt=""
            style={{ width:30, height:30, borderRadius:7, objectFit:'cover', margin:'0 auto' }}
            onError={e=>e.target.style.display='none'}
          />
        </div>
        {ITEMS.map(item=>(
          <button key={item.id} title={item.label}
            onClick={()=>item.fn ? item.fn() : setPanel(p=>p===item.id?null:item.id)}
            style={{ width:36, height:36, borderRadius:8, border:'none', background:panel===item.id?'#e8f0fe':'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:panel===item.id?'#1a73e8':'#6b7280', fontSize:15, transition:'all .12s', flexShrink:0 }}
            onMouseEnter={e=>{if(panel!==item.id){e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.color='#1a73e8'}}}
            onMouseLeave={e=>{if(panel!==item.id){e.currentTarget.style.background='none';e.currentTarget.style.color='#6b7280'}}}
          >
            <i className={`fi ${item.icon}`}/>
          </button>
        ))}
      </div>

      {/* Panel */}
      {panel && (
        <div style={{ width:240, background:'#fff', borderRight:'1px solid #e8eaed', display:'flex', flexDirection:'column', boxShadow:'2px 0 8px rgba(0,0,0,.06)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderBottom:'1px solid #e8eaed', flexShrink:0 }}>
            <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.88rem', color:'#111827' }}>
              {ITEMS.find(i=>i.id===panel)?.label}
            </span>
            <button onClick={()=>setPanel(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:13 }}>
              <i className="fi fi-sr-cross-small"/>
            </button>
          </div>

          {panel==='rooms' && <RoomListPanel nav={nav} />}

          {panel==='games' && (
            <div style={{ padding:'10px', flex:1, overflowY:'auto' }}>
              {[
                { id:'dice', icon:'fi-sr-dice',    label:'Dice',  desc:'Roll to win gold',  color:'#7c3aed' },
                { id:'keno', icon:'fi-sr-grid',    label:'Keno',  desc:'Pick your numbers', color:'#1a73e8' },
                { id:'quiz', icon:'fi-sr-quiz',    label:'Quiz',  desc:'Answer & earn XP',  color:'#059669' },
                { id:'spin', icon:'fi-sr-refresh', label:'Spin',  desc:'Daily spin wheel',  color:'#f59e0b' },
              ].map(g=>(
                <button key={g.id} onClick={()=>socket?.emit('rollDice',{roomId:''})}
                  style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 12px', background:'#f9fafb', border:'1.5px solid #e8eaed', borderRadius:9, cursor:'pointer', marginBottom:8, textAlign:'left', transition:'all .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e8eaed'}}
                >
                  <i className={`fi ${g.icon}`} style={{ fontSize:20, color:g.color, flexShrink:0 }}/>
                  <div><div style={{ fontSize:'0.84rem', fontWeight:700, color:'#111827' }}>{g.label}</div><div style={{ fontSize:'0.71rem', color:'#9ca3af' }}>{g.desc}</div></div>
                </button>
              ))}
            </div>
          )}

          {panel==='store' && (
            <div style={{ padding:'10px', flex:1, overflowY:'auto' }}>
              <div style={{ background:'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius:10, padding:'12px', marginBottom:10, textAlign:'center' }}>
                <img src="/icons/ui/gold.svg" style={{ width:28, height:28, margin:'0 auto 4px', display:'block' }} onError={()=>{}} alt="" />
                <div style={{ fontSize:'0.84rem', fontWeight:800, color:'#fff' }}>Buy Gold Coins</div>
              </div>
              {[{g:100,p:'₹10'},{g:500,p:'₹45'},{g:1000,p:'₹80'},{g:5000,p:'₹350'}].map(p=>(
                <button key={p.g} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'10px 12px', background:'#f9fafb', border:'1px solid #e8eaed', borderRadius:8, cursor:'pointer', marginBottom:6, transition:'all .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e8eaed'}}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <img src="/icons/ui/gold.svg" style={{ width:16, height:16 }} onError={()=>{}} alt="" />
                    <span style={{ fontSize:'0.84rem', fontWeight:700, color:'#111827' }}>{p.g} Gold</span>
                  </div>
                  <span style={{ fontSize:'0.84rem', fontWeight:700, color:'#1a73e8' }}>{p.p}</span>
                </button>
              ))}
            </div>
          )}

          {panel==='leaderboard' && (
            <div style={{ padding:'8px', flex:1, overflowY:'auto' }}>
              {[
                { type:'leader_xp',    icon:'fi-sr-star',     label:'XP Leaders'    },
                { type:'leader_level', icon:'fi-sr-layer-group', label:'Top Levels'  },
                { type:'leader_gold',  icon:'fi-sr-coins',    label:'Gold Leaders'  },
                { type:'leader_gift',  icon:'fi-sr-gift',     label:'Gift Leaders'  },
                { type:'leader_like',  icon:'fi-sr-thumbs-up',label:'Like Leaders'  },
              ].map(l=>(
                <button key={l.type} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'10px 12px', background:'#f9fafb', border:'1px solid #e8eaed', borderRadius:8, cursor:'pointer', marginBottom:6, transition:'all .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e8eaed'}}
                >
                  <i className={`fi ${l.icon}`} style={{ fontSize:15, color:'#f59e0b' }}/>
                  <span style={{ fontSize:'0.84rem', fontWeight:600, color:'#111827', flex:1 }}>{l.label}</span>
                  <i className="fi fi-sr-angle-right" style={{ fontSize:11, color:'#9ca3af' }}/>
                </button>
              ))}
            </div>
          )}

          {panel==='username' && (
            <div style={{ padding:'14px', flex:1 }}>
              <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:9, padding:'10px 12px', marginBottom:12, fontSize:'0.79rem', color:'#92400e' }}>
                <img src="/icons/ui/gold.svg" style={{ width:13, height:13, marginRight:4 }} onError={()=>{}} alt="" />
                Username change costs <strong>500 Gold</strong>
              </div>
              <input placeholder="New username..." style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e8eaed', borderRadius:8, fontSize:'0.875rem', outline:'none', boxSizing:'border-box', color:'#111827', background:'#f9fafb', marginBottom:8 }}
                onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e8eaed'}
              />
              <button style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>
                <i className="fi fi-sr-edit" style={{ marginRight:6 }}/>Change Username
              </button>
            </div>
          )}

          {panel==='premium' && (
            <div style={{ padding:'14px', flex:1, textAlign:'center' }}>
              <i className="fi fi-sr-crown" style={{ fontSize:40, color:'#f59e0b', display:'block', marginBottom:10 }}/>
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1rem', color:'#111827', marginBottom:6 }}>Go Premium</div>
              <p style={{ fontSize:'0.82rem', color:'#6b7280', marginBottom:14, lineHeight:1.6 }}>Exclusive rank, custom name color, premium badge and more!</p>
              <div style={{ background:'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius:10, padding:'12px', color:'#fff', fontWeight:700, fontSize:'0.875rem' }}>Coming Soon 🚀</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RoomListPanel({ nav }) {
  const [rooms, setRooms] = useState([])
  const [load,  setLoad]  = useState(true)
  useEffect(()=>{
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/rooms`,{headers:{Authorization:`Bearer ${t}`}}).then(r=>r.json()).then(d=>setRooms(d.rooms||[])).catch(()=>{}).finally(()=>setLoad(false))
  },[])
  if (load) return <div style={{ textAlign:'center', padding:'20px' }}><div style={{ width:24, height:24, border:'2px solid #e8eaed', borderTop:'2px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }}/></div>
  return (
    <div style={{ flex:1, overflowY:'auto' }}>
      {rooms.map(r=>(
        <div key={r._id} onClick={()=>nav(`/chat/${r._id}`)}
          style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', cursor:'pointer', borderBottom:'1px solid #f3f4f6', transition:'background .12s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          <img src={r.icon||'/default_images/rooms/default_room.png'} style={{ width:30, height:30, borderRadius:7, objectFit:'cover', flexShrink:0 }} onError={e=>e.target.style.display='none'} alt="" />
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

  function play(s) {
    if (current?.id===s.id && playing) { audioRef.current?.pause(); setPlaying(false); return }
    setCurrent(s)
    if (audioRef.current) {
      audioRef.current.src=s.streamUrl
      audioRef.current.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false))
    }
  }

  const langs = [...new Set(stations.map(s=>s.language))]

  return (
    <div style={{ position:'absolute', bottom:'100%', left:0, right:0, background:'#fff', border:'1px solid #e8eaed', borderRadius:'10px 10px 0 0', boxShadow:'0 -4px 16px rgba(0,0,0,.1)', maxHeight:'45vh', display:'flex', flexDirection:'column', zIndex:100 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 13px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <i className="fi fi-sr-radio" style={{ color:'#1a73e8', fontSize:15 }}/>
          <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.875rem', color:'#111827' }}>
            {playing&&current ? `🎵 ${current.name}` : 'Radio'}
          </span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {playing && <button onClick={()=>{audioRef.current?.pause();setPlaying(false)}} style={{ background:'#fee2e2', border:'none', color:'#dc2626', padding:'3px 10px', borderRadius:20, cursor:'pointer', fontSize:'0.76rem', fontWeight:600 }}>⏸ Stop</button>}
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:15 }}><i className="fi fi-sr-cross-small"/></button>
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'6px' }}>
        {langs.map(lang=>(
          <div key={lang}>
            <div style={{ fontSize:'0.66rem', fontWeight:700, color:'#9ca3af', letterSpacing:'1px', textTransform:'uppercase', padding:'5px 8px 3px' }}>{lang}</div>
            {stations.filter(s=>s.language===lang).map(s=>(
              <button key={s.id} onClick={()=>play(s)}
                style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'7px 9px', background:current?.id===s.id?'#e8f0fe':'none', border:`1px solid ${current?.id===s.id?'#1a73e8':'transparent'}`, borderRadius:7, cursor:'pointer', marginBottom:2, textAlign:'left' }}
              >
                <div style={{ width:28, height:28, background:'#f3f4f6', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13 }}>
                  {current?.id===s.id&&playing?'🎵':s.flag||'📻'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize:'0.68rem', color:'#9ca3af' }}>{s.genre}</div>
                </div>
                {current?.id===s.id&&playing&&<span style={{ fontSize:'0.65rem', color:'#1a73e8', fontWeight:700, flexShrink:0 }}>▶LIVE</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
      <audio ref={audioRef} style={{ display:'none' }}/>
    </div>
  )
}

// ── AVATAR DROPDOWN ───────────────────────────────────────────
function AvatarDropdown({ me, status, setStatus, onLeave }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const nav = useNavigate()

  useEffect(()=>{
    const fn=e=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false) }
    if(open) document.addEventListener('mousedown',fn)
    return()=>document.removeEventListener('mousedown',fn)
  },[open])

  const ri     = R(me?.rank)
  const border = GBR(me?.gender, me?.rank)
  const curSt  = STATUSES.find(s=>s.id===status)||STATUSES[0]
  const isStaff= ['moderator','admin','superadmin','owner'].includes(me?.rank)
  const isOwner= me?.rank==='owner'

  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 4px', borderRadius:8, display:'flex', alignItems:'center', gap:3 }}>
        <div style={{ position:'relative' }}>
          <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
            style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover', border:`2px solid ${border}`, display:'block' }}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
          />
          <span style={{ position:'absolute', bottom:0, right:0, width:8, height:8, background:curSt.color, borderRadius:'50%', border:'1.5px solid #fff' }}/>
        </div>
        <i className={`fi fi-sr-angle-${open?'up':'down'}`} style={{ fontSize:9, color:'#9ca3af' }}/>
      </button>

      {open && (
        <div style={{ position:'absolute', right:0, top:'calc(100% + 6px)', background:'#fff', border:'1px solid #e8eaed', borderRadius:13, minWidth:220, boxShadow:'0 6px 24px rgba(0,0,0,.13)', zIndex:999, overflow:'hidden' }}>
          {/* User card */}
          <div style={{ padding:'12px 13px 9px', borderBottom:'1px solid #f3f4f6' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:7 }}>
              <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
                style={{ width:40, height:40, borderRadius:'50%', border:`2.5px solid ${border}`, objectFit:'cover', flexShrink:0 }}
                onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
              />
              <div style={{ minWidth:0 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.88rem', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{me?.username}</div>
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                  <img src={`/icons/ranks/${ri.icon}`} style={{ width:12, height:12 }} onError={e=>e.target.style.display='none'} alt="" />
                  <span style={{ fontSize:'0.68rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
                </div>
              </div>
            </div>
            {!me?.isGuest && (
              <div style={{ display:'flex', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <img src="/icons/ui/gold.svg" style={{ width:13, height:13 }} onError={()=>{}} alt="" />
                  <span style={{ fontSize:'0.71rem', fontWeight:700, color:'#d97706' }}>{me?.gold||0}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <img src="/icons/ui/level.svg" style={{ width:13, height:13 }} onError={()=>{}} alt="" />
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
                  style={{ flex:1, padding:'5px 2px', borderRadius:6, border:`1.5px solid ${status===s.id?s.color:'#e8eaed'}`, background:status===s.id?s.color+'18':'none', cursor:'pointer', fontSize:'0.63rem', fontWeight:600, color:status===s.id?s.color:'#6b7280', transition:'all .15s' }}>
                  {s.label.slice(0,3)}
                </button>
              ))}
            </div>
          </div>
          {/* Menu */}
          <div style={{ padding:'4px' }}>
            <DItem icon="fi-ss-user"        label="My Profile"    />
            <DItem icon="fi-sr-pencil"      label="Edit Profile"  />
            <DItem icon="fi-sr-wallet"      label="Wallet"        />
            <DItem icon="fi-sr-layer-group" label="Level Status"  />
            {isStaff && <DItem icon="fi-sr-settings"  label="Room Options"    />}
            {isStaff && <DItem icon="fi-sr-dashboard" label="Admin Panel" color="#ef4444" onClick={()=>{setOpen(false);window.location.href='/admin'}} />}
            {isOwner && <DItem icon="fi-sr-cog" label="Site Settings" color="#6b7280" />}
            <div style={{ borderTop:'1px solid #f3f4f6', margin:'4px 0' }}/>
            <DItem icon="fi-sr-arrow-left"  label="Leave Room"  onClick={onLeave} />
            <DItem icon="fi-sr-user-logout" label="Logout" color="#ef4444" onClick={()=>{
              const t=localStorage.getItem('cgz_token')
              if(t) fetch(`${API}/api/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${t}`}}).catch(()=>{})
              localStorage.removeItem('cgz_token'); nav('/login')
            }} />
          </div>
        </div>
      )}
    </div>
  )
}
function DItem({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', background:'none', border:'none', cursor:'pointer', color:color||'#374151', fontSize:'0.83rem', fontWeight:600, borderRadius:7, textAlign:'left', transition:'background .12s' }}
      onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
      onMouseLeave={e=>e.currentTarget.style.background='none'}
    >
      <i className={`fi ${icon}`} style={{ fontSize:13, width:15, textAlign:'center', flexShrink:0 }}/>{label}
    </button>
  )
}

// ── FOOTER ────────────────────────────────────────────────────
function Footer({ showRadio, setShowRadio, rightTab, setRightTab, showRight, setRight, notif, showLeft, setLeft }) {
  const TABS = [
    { id:'users',   icon:'fi-sr-users',        label:'Users'   },
    { id:'friends', icon:'fi-sr-user',          label:'Friends' },
    { id:'staff',   icon:'fi-sr-shield-check',  label:'Staff'   },
    { id:'search',  icon:'fi-sr-search',        label:'Search'  },
  ]
  return (
    <div style={{ background:'#fff', borderTop:'1px solid #e8eaed', padding:'4px 10px', display:'flex', alignItems:'center', gap:4, flexShrink:0, position:'relative' }}>
      {/* Radio - left */}
      <button onClick={()=>setShowRadio(s=>!s)} title="Radio"
        style={{ background:showRadio?'#e8f0fe':'none', border:'none', cursor:'pointer', color:showRadio?'#1a73e8':'#9ca3af', width:34, height:32, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>
        <i className="fi fi-sr-radio"/>
      </button>

      {/* Left sidebar toggle */}
      <button onClick={()=>setLeft(s=>!s)} title="Menu"
        style={{ background:showLeft?'#e8f0fe':'none', border:'none', cursor:'pointer', color:showLeft?'#1a73e8':'#9ca3af', width:34, height:32, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>
        <i className="fi fi-sr-bars-sort"/>
      </button>

      <div style={{ flex:1 }}/>

      {/* Right sidebar tabs */}
      {TABS.map(t=>(
        <button key={t.id} onClick={()=>{ setRightTab(t.id); setRight(true) }} title={t.label}
          style={{ position:'relative', background:showRight&&rightTab===t.id?'#e8f0fe':'none', border:'none', cursor:'pointer', color:showRight&&rightTab===t.id?'#1a73e8':'#9ca3af', width:34, height:32, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>
          <i className={`fi ${t.icon}`}/>
          {t.id==='friends'&&notif.friends>0 && <span style={{ position:'absolute', top:4, right:4, width:7, height:7, background:'#ef4444', borderRadius:'50%', border:'1.5px solid #fff' }}/>}
          {t.id==='users'&&notif.dm>0 && <span style={{ position:'absolute', top:4, right:4, width:7, height:7, background:'#ef4444', borderRadius:'50%', border:'1.5px solid #fff' }}/>}
        </button>
      ))}
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────
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
    if(!token){ nav('/login'); return }
    loadRoom()
    return ()=>sockRef.current?.disconnect()
  },[roomId])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  // Auto logout check every 5 min
  useEffect(()=>{
    const t=setInterval(async()=>{
      const tk=localStorage.getItem('cgz_token')
      if(!tk){ nav('/login'); return }
      const r=await fetch(`${API}/api/auth/me`,{headers:{Authorization:`Bearer ${tk}`}}).catch(()=>null)
      if(r?.status===401){ localStorage.removeItem('cgz_token'); nav('/login') }
    },5*60*1000)
    return()=>clearInterval(t)
  },[])

  async function loadRoom() {
    setLoad(true); setErr('')
    try {
      const [mr,rr]=await Promise.all([
        fetch(`${API}/api/auth/me`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/rooms/${roomId}`,{headers:{Authorization:`Bearer ${token}`}}),
      ])
      if(mr.status===401){ localStorage.removeItem('cgz_token'); nav('/login'); return }
      const md=await mr.json()
      if(md.user){ if(md.freshToken) localStorage.setItem('cgz_token',md.freshToken); setMe(md.user) }
      const rd=await rr.json()
      if(!rr.ok){ setErr(rd.error||'Room not found'); setLoad(false); return }
      setRoom(rd.room)
      fetch(`${API}/api/rooms/${roomId}/messages?limit=50`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>{ if(d.messages) setMsgs(d.messages) }).catch(()=>{})
    } catch { setErr('Connection failed.') }
    setLoad(false)
    connectSocket()
  }

  function connectSocket() {
    sockRef.current?.disconnect()
    const s=io(API,{auth:{token},transports:['websocket','polling']})
    s.on('connect',        ()=>{ setConn(true); s.emit('joinRoom',{roomId}) })
    s.on('disconnect',     ()=>setConn(false))
    s.on('messageHistory', ms=>setMsgs(ms||[]))
    s.on('newMessage',     m=>setMsgs(p=>[...p,m]))
    s.on('roomUsers',      l=>setUsers(l||[]))
    s.on('userJoined',     u=>{ setUsers(p=>p.find(x=>x.userId===u.userId)?p:[...p,u]); setMsgs(p=>[...p,{_id:Date.now(),type:'system',content:`${u.username} joined`,createdAt:new Date()}]) })
    s.on('userLeft',       u=>{ setUsers(p=>p.filter(x=>x.userId!==u.userId)); setMsgs(p=>[...p,{_id:Date.now()+'l',type:'system',content:`${u.username} left`,createdAt:new Date()}]) })
    s.on('systemMessage',  m=>setMsgs(p=>[...p,{_id:Date.now()+'s',type:'system',content:m.text,createdAt:new Date()}]))
    s.on('messageDeleted', id=>setMsgs(p=>p.filter(m=>m._id!==id)))
    s.on('youAreKicked',   ()=>{ alert('You have been kicked from this room'); nav('/chat') })
    s.on('youAreMuted',    ({minutes})=>alert(`You have been muted for ${minutes} minutes`))
    s.on('error',          e=>console.error('Socket:',e))
    sockRef.current=s
  }

  function send(e) {
    e.preventDefault()
    const t=input.trim()
    if(!t||!sockRef.current||!connected) return
    sockRef.current.emit('sendMessage',{roomId,content:t,type:'text'})
    setInput(''); inputRef.current?.focus()
  }

  function leave() { sockRef.current?.disconnect(); nav('/chat') }

  const myLevel = RANKS[me?.rank]?.level||1
  const myBdr   = GBR(me?.gender,me?.rank)
  const isStaff = myLevel>=11

  const handleMiniCard=useCallback((user,pos)=>{ setMiniCard({user,pos}); setProf(null) },[])

  if(!loading&&roomErr) return (
    <div style={{ minHeight:'100vh',background:'#f8f9fa',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12 }}>
      <div style={{ fontSize:40 }}>⚠️</div>
      <p style={{ color:'#374151',fontWeight:600 }}>{roomErr}</p>
      <button onClick={()=>nav('/chat')} style={{ padding:'10px 22px',borderRadius:9,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer' }}>← Back to Lobby</button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if(loading) return (
    <div style={{ minHeight:'100vh',background:'#f8f9fa',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:32,height:32,border:'3px solid #e8eaed',borderTop:'3px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 10px' }}/>
        <p style={{ color:'#9ca3af',fontSize:'0.875rem' }}>Joining room...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ height:'100dvh',display:'flex',flexDirection:'column',background:'#fff',overflow:'hidden' }} onClick={()=>setMiniCard(null)}>

      {/* ── HEADER ── */}
      <div style={{ height:48,background:'#fff',borderBottom:'1px solid #e8eaed',display:'flex',alignItems:'center',padding:'0 8px',gap:6,flexShrink:0,boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>

        {/* Webcam icon — user uploads to public/icons/ui/webcam.png */}
        <button title="Start Webcam"
          style={{ background:'none',border:'none',cursor:'pointer',width:34,height:34,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background .15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}
        >
          <img src="/icons/ui/webcam.png" alt="Cam" style={{ width:22,height:22,objectFit:'contain' }}
            onError={e=>{ e.target.style.display='none'; e.target.parentNode.innerHTML='<i class="fi fi-sr-video-camera" style="font-size:16px;color:#9ca3af"></i>' }}
          />
        </button>

        <div style={{ flex:1 }}/>

        {/* DM */}
        <HBtn icon="fi-sr-envelope"   title="Private Messages" badge={notif.dm} />
        {/* Friend requests */}
        <HBtn icon="fi-sr-user-add"   title="Friend Requests"  badge={notif.friends} />
        {/* Notifications */}
        <HBtn icon="fi-sc-bell-ring"  title="Notifications"    badge={notif.notif} />
        {/* Reports — staff only */}
        {isStaff && <HBtn icon="fi-sr-flag" title="Reports" badge={notif.reports} />}

        {/* Avatar + dropdown */}
        <AvatarDropdown me={me} status={status} setStatus={setStatus} onLeave={leave} />
      </div>

      {/* ── BODY ── */}
      <div style={{ flex:1,display:'flex',overflow:'hidden',position:'relative' }}>

        {/* LEFT SIDEBAR */}
        {showLeft && (
          <div style={{ display:'flex',height:'100%',flexShrink:0 }}>
            <LeftSidebar room={room} nav={nav} socket={sockRef.current} />
          </div>
        )}

        {/* MESSAGES */}
        <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
          {room?.topic && (
            <div style={{ background:'#f8f9fa',borderBottom:'1px solid #e8eaed',padding:'5px 14px',fontSize:'0.77rem',color:'#374151',flexShrink:0 }}>
              <i className="fi fi-sr-info" style={{ marginRight:5,color:'#1a73e8' }}/>{room.topic}
            </div>
          )}
          <div style={{ flex:1,overflowY:'auto',padding:'8px 0' }}>
            {messages.map((m,i)=>(
              <Msg key={m._id||i} msg={m} myLevel={myLevel} onMiniCard={handleMiniCard} onSetInput={setInput} />
            ))}
            <div ref={bottomRef}/>
          </div>

          {/* INPUT BAR */}
          <div style={{ borderTop:'1px solid #e8eaed',padding:'7px 10px',background:'#fff',flexShrink:0 }}>
            <form onSubmit={send} style={{ display:'flex',alignItems:'center',gap:6 }}>
              <button type="button" title="Emoji" style={{ background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:19,padding:'0 2px',flexShrink:0,display:'flex',alignItems:'center' }}>
                <i className="fi fi-rr-smile"/>
              </button>
              <button type="button" title="Image" style={{ background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:17,padding:'0 2px',flexShrink:0,display:'flex',alignItems:'center' }}>
                <i className="fi fi-sr-picture"/>
              </button>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                placeholder={connected?'Type a message...':'Connecting...'}
                disabled={!connected}
                style={{ flex:1,padding:'9px 14px',background:'#f9fafb',border:'1.5px solid #e8eaed',borderRadius:22,color:'#111827',fontSize:'0.875rem',outline:'none',transition:'border-color .15s' }}
                onFocus={e=>e.target.style.borderColor='#1a73e8'}
                onBlur={e=>e.target.style.borderColor='#e8eaed'}
              />
              <button type="button" title="Gift"
                style={{ background:'none',border:'none',cursor:'pointer',fontSize:17,padding:'0 2px',flexShrink:0,display:'flex',alignItems:'center' }}>
                <img src="/icons/ui/gift.svg" alt="Gift" style={{ width:18,height:18,objectFit:'contain' }} onError={e=>{e.target.style.display='none';e.target.parentNode.innerHTML='<i class="fi fi-sr-gift" style="font-size:17px;color:#9ca3af"></i>'}} />
              </button>
              <button type="submit" disabled={!input.trim()||!connected}
                style={{ width:36,height:36,borderRadius:'50%',border:'none',background:input.trim()&&connected?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6',color:input.trim()&&connected?'#fff':'#9ca3af',cursor:input.trim()&&connected?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0 }}>
                <i className="fi fi-sr-paper-plane"/>
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        {showRight && (
          <RightSidebar
            users={users}
            myLevel={myLevel}
            tab={rightTab}
            setTab={setRightTab}
            onUserClick={u=>{ setProf(u); setMiniCard(null) }}
            onClose={()=>setRight(false)}
          />
        )}
      </div>

      {/* ── FOOTER (PC + mobile same) ── */}
      <div style={{ position:'relative' }}>
        {showRadio && <RadioPlayer onClose={()=>setRadio(false)} />}
        <Footer
          showRadio={showRadio} setShowRadio={setRadio}
          rightTab={rightTab}   setRightTab={setRightTab}
          showRight={showRight} setRight={setRight}
          showLeft={showLeft}   setLeft={setLeft}
          notif={notif}
        />
      </div>

      {/* Mini card */}
      {miniCard && (
        <MiniCard
          user={miniCard.user} myLevel={myLevel} pos={miniCard.pos}
          onClose={()=>setMiniCard(null)}
          onViewFull={()=>{ setProf(miniCard.user); setMiniCard(null) }}
          socket={sockRef.current} roomId={roomId}
        />
      )}

      {/* Full profile */}
      {profUser && (
        <ProfileModal user={profUser} myLevel={myLevel} socket={sockRef.current} roomId={roomId} onClose={()=>setProf(null)} />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function HBtn({ icon, title, badge, onClick }) {
  return (
    <button onClick={onClick} title={title}
      style={{ position:'relative',background:'none',border:'none',cursor:'pointer',color:'#9ca3af',width:34,height:34,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,transition:'all .15s',flexShrink:0 }}
      onMouseEnter={e=>{ e.currentTarget.style.background='#f3f4f6'; e.currentTarget.style.color='#374151' }}
      onMouseLeave={e=>{ e.currentTarget.style.background='none'; e.currentTarget.style.color='#9ca3af' }}
    >
      <i className={`fi ${icon}`}/>
      {badge>0 && <span style={{ position:'absolute',top:5,right:5,width:7,height:7,background:'#ef4444',borderRadius:'50%',border:'1.5px solid #fff' }}/>}
    </button>
  )
}
