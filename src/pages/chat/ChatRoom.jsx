import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useToast } from '../../components/Toast.jsx'
import { Sounds } from '../../utils/sounds.js'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

const RANKS = {
  guest:      { label:'Guest',      color:'#888888', icon:'guest.svg',       level:1  },
  user:       { label:'User',       color:'#aaaaaa', icon:'user.svg',        level:2  },
  vipfemale:  { label:'VIP Female', color:'#FF4488', icon:'vip_female.svg',  level:3  },
  vipmale:    { label:'VIP Male',   color:'#4488FF', icon:'vip_male.svg',    level:4  },
  butterfly:  { label:'Butterfly',  color:'#FF66AA', icon:'butterfly.svg',   level:5  },
  ninja:      { label:'Ninja',      color:'#777777', icon:'ninja.svg',       level:6  },
  fairy:      { label:'Fairy',      color:'#FF88CC', icon:'fairy.svg',       level:7  },
  legend:     { label:'Legend',     color:'#FF8800', icon:'legend.png',      level:8  },
  bot:        { label:'Bot',        color:'#00cc88', icon:'bot.svg',         level:9  },
  premium:    { label:'Premium',    color:'#aa44ff', icon:'premium.svg',     level:10 },
  moderator:  { label:'Moderator',  color:'#00AAFF', icon:'mod.svg',         level:11 },
  admin:      { label:'Admin',      color:'#FF4444', icon:'admin.svg',       level:12 },
  superadmin: { label:'Superadmin', color:'#FF00FF', icon:'super_admin.svg', level:13 },
  owner:      { label:'Owner',      color:'#FFD700', icon:'owner.svg',       level:14 },
}
const STATUSES = [
  {id:'online',label:'Online',color:'#22c55e'},
  {id:'away',  label:'Away',  color:'#f59e0b'},
  {id:'busy',  label:'Busy',  color:'#ef4444'},
  {id:'invisible',label:'Invisible',color:'#9ca3af'},
]
const GBR = (g,r) => r==='bot'?'transparent':({male:'#03add8',female:'#ff99ff',couple:'#9c6fde',other:'#cccccc'}[g]||'#cccccc')
const R   = r => RANKS[r] || RANKS.guest
const RL  = r => RANKS[r]?.level || 0

function RIcon({rank,size=14}) {
  const ri = R(rank)
  return <img src={`/icons/ranks/${ri.icon}`} alt="" style={{width:size,height:size,objectFit:'contain',background:'transparent',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
}

// ─────────────────────────────────────────────────────────────
// MINI CARD
// ─────────────────────────────────────────────────────────────
function MiniCard({user,myLevel,pos,onClose,onFull,onGift,socket,roomId}) {
  if (!user) return null
  const ri=R(user.rank), bdr=GBR(user.gender,user.rank)
  const canMod=myLevel>=11&&RL(user.rank)<myLevel
  const canBan=myLevel>=12&&RL(user.rank)<myLevel
  const isOwn=myLevel>=14
  const token=localStorage.getItem('cgz_token')
  const x=Math.min(pos.x,window.innerWidth-225), y=Math.min(pos.y,window.innerHeight-320)
  return (
    <div style={{position:'fixed',zIndex:9999,top:y,left:x,background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,width:218,boxShadow:'0 8px 28px rgba(0,0,0,.15)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <div style={{height:36,background:`linear-gradient(135deg,${ri.color}33,#e8f0fe)`}}/>
      <div style={{display:'flex',alignItems:'flex-end',gap:8,padding:'0 12px',marginTop:-18,marginBottom:8}}>
        <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:38,height:38,borderRadius:'50%',border:`2px solid ${bdr}`,objectFit:'cover',background:'#fff',flexShrink:0}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        <div style={{paddingBottom:2,minWidth:0}}>
          <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.875rem',color:user.nameColor||'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.username}</div>
          <div style={{display:'flex',alignItems:'center',gap:4}}><RIcon rank={user.rank} size={11}/><span style={{fontSize:'0.68rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
        </div>
      </div>
      <div style={{padding:'0 8px 8px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
        {[
          {icon:'fi-ss-user',label:'Profile',onClick:onFull},
          {icon:'fi-sr-comments',label:'PM'},
          {icon:'fi-sr-phone-call',label:'Call',onClick:()=>{socket?.emit('callUser',{toUserId:user._id||user.userId,callType:'video',callId:`c_${Date.now()}`});onClose()}},
          {icon:'fi-sr-gift',label:'Gift',color:'#7c3aed',onClick:()=>{onGift(user);onClose()}},
          myLevel>=2&&{icon:'fi-sr-user-add',label:'Friend',color:'#059669',onClick:()=>{fetch(`${API}/api/users/friend/${user._id||user.userId}`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{});onClose()}},
          myLevel>=2&&{icon:'fi-sr-user-block',label:'Ignore',color:'#6b7280'},
          canMod&&{icon:'fi-sr-volume-mute',label:'Mute',color:'#f59e0b',onClick:()=>socket?.emit('muteUser',{targetUserId:user._id||user.userId,roomId,minutes:5})},
          canMod&&{icon:'fi-sr-user-slash',label:'Kick',color:'#ef4444',onClick:()=>{socket?.emit('kickUser',{targetUserId:user._id||user.userId,roomId});onClose()}},
          canBan&&{icon:'fi-sr-ban',label:'Ban',color:'#dc2626'},
          isOwn&&{icon:'fi-sr-shield-check',label:'Rank',color:'#1a73e8'},
          {icon:'fi-sr-flag',label:'Report',color:'#ef4444'},
        ].filter(Boolean).map((b,i)=>(
          <button key={i} onClick={b.onClick} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 7px',background:'#f9fafb',border:'1px solid #e4e6ea',borderRadius:7,cursor:'pointer',fontSize:'0.72rem',fontWeight:600,color:b.color||'#374151',transition:'all .12s'}} onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}} onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e4e6ea'}}>
            <i className={`fi ${b.icon}`} style={{fontSize:11}}/>{b.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FULL PROFILE MODAL
// ─────────────────────────────────────────────────────────────
function ProfileModal({user,myLevel,socket,roomId,onClose,onGift}) {
  if (!user) return null
  const ri=R(user.rank), bdr=GBR(user.gender,user.rank)
  const canMod=myLevel>=11&&RL(user.rank)<myLevel
  const canBan=myLevel>=12&&RL(user.rank)<myLevel
  const isOwn=myLevel>=14
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.45)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:18,maxWidth:340,width:'100%',overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,.18)'}}>
        <div style={{height:88,background:`linear-gradient(135deg,${ri.color}44,#e8f0fe)`,position:'relative'}}>
          <button onClick={onClose} style={{position:'absolute',top:10,right:10,background:'rgba(255,255,255,.8)',border:'none',width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
          {user.countryCode&&user.countryCode!=='ZZ'&&<img src={`/icons/flags/${user.countryCode.toLowerCase()}.png`} alt="" style={{position:'absolute',bottom:10,right:12,width:22,height:14,borderRadius:2}} onError={e=>e.target.style.display='none'}/>}
        </div>
        <div style={{display:'flex',justifyContent:'center',marginTop:-36}}>
          <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:72,height:72,borderRadius:'50%',border:`3px solid ${bdr}`,objectFit:'cover',background:'#fff'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        </div>
        <div style={{padding:'10px 18px 18px',textAlign:'center'}}>
          <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1.05rem',color:user.nameColor||'#111827'}}>{user.username}</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,margin:'4px 0 12px'}}><RIcon rank={user.rank} size={14}/><span style={{fontSize:'0.75rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
          {user.mood&&<p style={{fontSize:'0.8rem',color:'#6b7280',marginBottom:8,fontStyle:'italic'}}>"{user.mood}"</p>}
          {user.about&&<p style={{fontSize:'0.8rem',color:'#6b7280',marginBottom:12,lineHeight:1.5}}>{user.about}</p>}
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:14}}>
            {[{l:'Level',v:user.level||1,c:'#1a73e8'},{l:'Gold',v:user.gold||0,c:'#d97706'},{l:'Msgs',v:user.totalMessages||0,c:'#7c3aed'}].map(s=>(
              <div key={s.l} style={{textAlign:'center',background:'#f9fafb',borderRadius:8,padding:'5px 12px'}}>
                <div style={{fontSize:'0.62rem',color:'#9ca3af'}}>{s.l}</div>
                <div style={{fontSize:'0.9rem',fontWeight:800,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center'}}>
            {[
              {icon:'fi-sr-comments',label:'Private'},
              {icon:'fi-sr-phone-call',label:'Call',onClick:()=>{socket?.emit('callUser',{toUserId:user._id||user.userId,callType:'video',callId:`c_${Date.now()}`});onClose()}},
              {icon:'fi-sr-gift',label:'Gift',color:'#7c3aed',onClick:()=>{onGift(user);onClose()}},
              {icon:'fi-sr-user-add',label:'Friend',color:'#059669'},
              {icon:'fi-sr-flag',label:'Report',color:'#ef4444'},
              canMod&&{icon:'fi-sr-volume-mute',label:'Mute',color:'#f59e0b',onClick:()=>socket?.emit('muteUser',{targetUserId:user._id||user.userId,roomId,minutes:5})},
              canMod&&{icon:'fi-sr-user-slash',label:'Kick',color:'#ef4444',onClick:()=>{socket?.emit('kickUser',{targetUserId:user._id||user.userId,roomId});onClose()}},
              canBan&&{icon:'fi-sr-ban',label:'Ban',color:'#dc2626'},
              isOwn&&{icon:'fi-sr-shield-check',label:'Set Rank',color:'#1a73e8'},
            ].filter(Boolean).map((b,i)=>(
              <button key={i} onClick={b.onClick} style={{display:'flex',alignItems:'center',gap:4,padding:'7px 10px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:8,cursor:'pointer',fontSize:'0.78rem',fontWeight:600,color:b.color||'#374151',transition:'all .12s'}} onMouseEnter={e=>{e.currentTarget.style.background='#f0f7ff';e.currentTarget.style.borderColor=b.color||'#1a73e8'}} onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e4e6ea'}}>
                <i className={`fi ${b.icon}`} style={{fontSize:12}}/>{b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MESSAGE
// ─────────────────────────────────────────────────────────────
function Msg({msg,onMiniCard,onMention,myId,myLevel,socket,roomId}) {
  const isSystem = msg.type==='system'
  if (isSystem) return (
    <div style={{textAlign:'center',padding:'3px 0'}}>
      <span style={{fontSize:'0.72rem',color:'#9ca3af',background:'#f3f4f6',padding:'2px 14px',borderRadius:20}}>{msg.content}</span>
    </div>
  )
  const ri=R(msg.sender?.rank), bdr=GBR(msg.sender?.gender,msg.sender?.rank)
  const col=msg.sender?.nameColor||ri.color
  const ts=new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  const isMine=(msg.sender?._id===myId||msg.sender?.userId===myId)
  const canDel=isMine||myLevel>=11

  // Render content - highlight mentions in blue
  const renderContent=(text)=>{
    if(!text) return null
    return text.split(/(@\w+)/g).map((p,i)=>
      p.startsWith('@')
        ? <span key={i} style={{color:'#1a73e8',fontWeight:700,background:'#e8f0fe',padding:'0 3px',borderRadius:4}}>{p}</span>
        : p
    )
  }

  return (
    <div style={{display:'flex',gap:8,padding:'3px 12px',alignItems:'flex-start',transition:'background .1s'}}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,.02)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <img src={msg.sender?.avatar||'/default_images/avatar/default_guest.png'} alt=""
        onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();onMiniCard(msg.sender,{x:r.left,y:r.bottom+4})}}
        style={{width:30,height:30,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${bdr}`,flexShrink:0,cursor:'pointer',marginTop:2}}
        onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
      />
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
          <RIcon rank={msg.sender?.rank} size={11}/>
          {/* Click username = mention (no @, no floating notif) */}
          <span onClick={()=>onMention(msg.sender?.username)} style={{fontSize:'0.82rem',fontWeight:700,color:col,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'} onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>
            {msg.sender?.username}
          </span>
          <span style={{fontSize:'0.65rem',color:'#9ca3af'}}>{ts}</span>
          {/* Delete button - show on hover for mine or mod */}
          {canDel&&<button onClick={()=>socket?.emit('deleteMessage',{messageId:msg._id,roomId})} style={{background:'none',border:'none',cursor:'pointer',color:'#d1d5db',fontSize:11,padding:0,marginLeft:4,display:'none'}} className="del-btn"><i className="fi fi-sr-trash"/></button>}
        </div>
        <div className="msg-bubble">
          {msg.type==='gift'  ?<span>🎁 {msg.content}</span>
          :msg.type==='image' ?<img src={msg.content} alt="" style={{maxWidth:200,borderRadius:8,display:'block'}}/>
          :renderContent(msg.content)}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// USER ITEM in sidebar
// ─────────────────────────────────────────────────────────────
function UserItem({u,onClick}) {
  const ri=R(u.rank), col=u.nameColor||ri.color
  return (
    <div onClick={()=>onClick(u)} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 10px',cursor:'pointer',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <div style={{position:'relative',flexShrink:0}}>
        <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:30,height:30,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${GBR(u.gender,u.rank)}`,display:'block'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        <span style={{position:'absolute',bottom:0,right:0,width:7,height:7,background:'#22c55e',borderRadius:'50%',border:'1.5px solid #fff'}}/>
      </div>
      <span style={{flex:1,fontSize:'0.82rem',fontWeight:700,color:col,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username}</span>
      <RIcon rank={u.rank} size={13}/>
      {u.countryCode&&u.countryCode!=='ZZ'&&<img src={`/icons/flags/${u.countryCode.toLowerCase()}.png`} alt="" style={{width:16,height:11,flexShrink:0,borderRadius:1}} onError={e=>e.target.style.display='none'}/>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RIGHT SIDEBAR
// ─────────────────────────────────────────────────────────────
function RightSidebar({users,myLevel,onUserClick,onClose}) {
  const [tab,setTab]=useState('users')
  const [search,setSearch]=useState('')
  const [rankF,setRankF]=useState('all')
  const [genderF,setGenderF]=useState('all')

  const sorted=[...users].sort((a,b)=>{const d=RL(b.rank)-RL(a.rank);return d!==0?d:(a.username||'').localeCompare(b.username||'')})
  const staff=sorted.filter(u=>RL(u.rank)>=11)
  const base=tab==='staff'?staff:sorted
  const filtered=base.filter(u=>{
    if(tab==='search'){
      const ms=!search||u.username.toLowerCase().includes(search.toLowerCase())
      const mr=rankF==='all'||u.rank===rankF
      const mg=genderF==='all'||u.gender===genderF
      return ms&&mr&&mg
    }
    return true
  })

  const TABS=[
    {id:'users', icon:'fi-sr-users',       label:'Users'},
    {id:'staff', icon:'fi-sr-shield-check',label:'Staff'},
    {id:'search',icon:'fi-sr-search',      label:'Search'},
  ]

  return (
    <div style={{width:210,borderLeft:'1px solid #e4e6ea',background:'#fff',display:'flex',flexDirection:'column',flexShrink:0}}>
      {/* Tabs + close */}
      <div style={{display:'flex',alignItems:'center',borderBottom:'1px solid #e4e6ea',flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} title={t.label}
            style={{flex:1,padding:'9px 2px',border:'none',background:'none',cursor:'pointer',borderBottom:`2px solid ${tab===t.id?'#1a73e8':'transparent'}`,color:tab===t.id?'#1a73e8':'#9ca3af',fontSize:14,transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className={`fi ${t.icon}`}/>
          </button>
        ))}
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:'4px 7px',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
      </div>

      {/* Search filters */}
      {tab==='search'&&(
        <div style={{padding:'7px 8px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Username..."
            style={{width:'100%',padding:'6px 10px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:7,fontSize:'0.8rem',outline:'none',boxSizing:'border-box',color:'#111827',marginBottom:6,fontFamily:'Nunito,sans-serif'}}
            onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}
          />
          <div style={{display:'flex',gap:4}}>
            <select value={genderF} onChange={e=>setGenderF(e.target.value)} style={{flex:1,padding:'5px 4px',background:'#f9fafb',border:'1px solid #e4e6ea',borderRadius:6,fontSize:'0.73rem',outline:'none',color:'#374151'}}>
              <option value="all">All Gender</option>
              <option value="male">Male</option><option value="female">Female</option>
              <option value="couple">Couple</option><option value="other">Other</option>
            </select>
            <select value={rankF} onChange={e=>setRankF(e.target.value)} style={{flex:1,padding:'5px 4px',background:'#f9fafb',border:'1px solid #e4e6ea',borderRadius:6,fontSize:'0.73rem',outline:'none',color:'#374151'}}>
              <option value="all">All Ranks</option>
              {Object.entries(RANKS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
      )}

      <div style={{padding:'5px 10px 2px',fontSize:'0.63rem',fontWeight:700,color:'#9ca3af',letterSpacing:'1px',textTransform:'uppercase',flexShrink:0}}>
        {tab==='staff'?'Staff':'Online'} · {filtered.length}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {filtered.length===0
          ? <p style={{textAlign:'center',color:'#9ca3af',fontSize:'0.78rem',padding:'16px 10px'}}>
              {tab==='staff'?'No staff online':tab==='search'?'No results':'No users'}
            </p>
          : filtered.map((u,i)=><UserItem key={u.userId||u._id||i} u={u} onClick={onUserClick}/>)
        }
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LEFT SIDEBAR (opened from header hamburger)
// ─────────────────────────────────────────────────────────────
function LeftSidebar({room,nav,socket,roomId,onClose}) {
  const [panel,setPanel]=useState(null)
  const ITEMS=[
    {id:'rooms',       icon:'fi-sr-house-chimney',label:'Room List'},
    {id:'games',       icon:'fi-sr-dice',         label:'Games'},
    {id:'store',       icon:'fi-sr-store-alt',    label:'Store'},
    {id:'leaderboard', icon:'fi-sr-medal',        label:'Leaderboard'},
    {id:'username',    icon:'fi-sr-edit',         label:'Change Username'},
    {id:'premium',     icon:'fi-sr-crown',        label:'Buy Premium'},
  ]

  return (
    <div style={{display:'flex',height:'100%',flexShrink:0}}>
      {/* Icon strip */}
      <div style={{width:48,background:'#f8f9fa',borderRight:'1px solid #e4e6ea',display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 0',gap:2}}>
        <div style={{padding:'2px 0 6px',borderBottom:'1px solid #e4e6ea',width:'100%',textAlign:'center',marginBottom:4}}>
          <img src={room?.icon||'/default_images/rooms/default_room.png'} alt="" style={{width:30,height:30,borderRadius:7,objectFit:'cover',margin:'0 auto'}} onError={e=>e.target.style.display='none'}/>
        </div>
        {ITEMS.map(item=>(
          <button key={item.id} title={item.label} onClick={()=>setPanel(p=>p===item.id?null:item.id)}
            style={{width:36,height:36,borderRadius:8,border:'none',background:panel===item.id?'#e8f0fe':'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:panel===item.id?'#1a73e8':'#6b7280',fontSize:15,transition:'all .12s'}}
            onMouseEnter={e=>{if(panel!==item.id){e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.color='#1a73e8'}}}
            onMouseLeave={e=>{if(panel!==item.id){e.currentTarget.style.background='none';e.currentTarget.style.color='#6b7280'}}}
          ><i className={`fi ${item.icon}`}/></button>
        ))}
      </div>

      {/* Panel content */}
      {panel&&(
        <div style={{width:240,background:'#fff',borderRight:'1px solid #e4e6ea',display:'flex',flexDirection:'column',boxShadow:'2px 0 8px rgba(0,0,0,.06)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderBottom:'1px solid #e4e6ea',flexShrink:0}}>
            <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:'#111827'}}>{ITEMS.find(i=>i.id===panel)?.label}</span>
            <button onClick={()=>setPanel(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
          </div>
          {panel==='rooms'&&<RoomListPanel nav={nav}/>}
          {panel==='games'&&<GamesPanel socket={socket} roomId={roomId}/>}
          {panel==='store'&&<StorePanel/>}
          {panel==='leaderboard'&&<LeaderboardPanel/>}
          {panel==='username'&&<UsernamePanel/>}
          {panel==='premium'&&<div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center'}}><i className="fi fi-sr-crown" style={{fontSize:40,color:'#f59e0b',marginBottom:10}}/><div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1rem',color:'#111827',marginBottom:6}}>Go Premium</div><div style={{background:'linear-gradient(135deg,#fbbf24,#f59e0b)',borderRadius:10,padding:12,color:'#fff',fontWeight:700,width:'100%'}}>Coming Soon 🚀</div></div>}
        </div>
      )}
    </div>
  )
}

function RoomListPanel({nav}) {
  const [rooms,setRooms]=useState([]), [load,setLoad]=useState(true)
  useEffect(()=>{
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/rooms`,{headers:{Authorization:`Bearer ${t}`}}).then(r=>r.json()).then(d=>setRooms(d.rooms||[])).catch(()=>{}).finally(()=>setLoad(false))
  },[])
  if(load) return <div style={{textAlign:'center',padding:20}}><div style={{width:22,height:22,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>
  return (
    <div style={{flex:1,overflowY:'auto'}}>
      {rooms.map(r=>(
        <div key={r._id} onClick={()=>nav(`/chat/${r._id}`)} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid #f3f4f6',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <img src={r.icon||'/default_images/rooms/default_room.png'} alt="" style={{width:32,height:32,borderRadius:7,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'0.83rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</div>
            {r.description&&<div style={{fontSize:'0.7rem',color:'#9ca3af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.description}</div>}
            <div style={{fontSize:'0.68rem',color:'#22c55e',fontWeight:600}}>{r.currentUsers||0} online</div>
          </div>
          <i className="fi fi-sr-angle-right" style={{fontSize:11,color:'#9ca3af',flexShrink:0}}/>
        </div>
      ))}
    </div>
  )
}

function GamesPanel({socket,roomId}) {
  const GAMES=[
    {id:'dice',icon:'fi-sr-dice',   label:'Dice',  desc:'Roll to win gold',  color:'#7c3aed'},
    {id:'keno',icon:'fi-sr-grid',   label:'Keno',  desc:'Pick your numbers', color:'#1a73e8'},
    {id:'quiz',icon:'fi-sr-quiz',   label:'Quiz',  desc:'Answer & earn XP',  color:'#059669'},
    {id:'spin',icon:'fi-sr-refresh',label:'Spin',  desc:'Daily free spin',   color:'#f59e0b'},
  ]
  return (
    <div style={{padding:10,flex:1,overflowY:'auto'}}>
      {GAMES.map(g=>(
        <button key={g.id} onClick={()=>{
          if(g.id==='dice') socket?.emit('rollDice',{roomId,bet:10})
          else if(g.id==='spin') socket?.emit('spinWheel',{})
          else if(g.id==='keno') socket?.emit('playKeno',{roomId,picks:[1,2,3,4,5],bet:10})
        }}
          style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 12px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:9,cursor:'pointer',marginBottom:8,textAlign:'left',transition:'all .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}}
          onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e4e6ea'}}
        ><i className={`fi ${g.icon}`} style={{fontSize:20,color:g.color,flexShrink:0}}/><div><div style={{fontSize:'0.85rem',fontWeight:700,color:'#111827'}}>{g.label}</div><div style={{fontSize:'0.72rem',color:'#9ca3af'}}>{g.desc}</div></div></button>
      ))}
    </div>
  )
}

function StorePanel() {
  return (
    <div style={{padding:10,flex:1,overflowY:'auto'}}>
      <div style={{background:'linear-gradient(135deg,#fbbf24,#f59e0b)',borderRadius:10,padding:12,marginBottom:10,textAlign:'center'}}>
        <img src="/default_images/icons/gold.svg" alt="" style={{width:28,height:28,margin:'0 auto 4px',display:'block'}} onError={()=>{}}/>
        <div style={{fontSize:'0.85rem',fontWeight:800,color:'#fff'}}>Buy Gold Coins</div>
      </div>
      {[{g:100,p:'₹10'},{g:500,p:'₹45'},{g:1000,p:'₹80'},{g:5000,p:'₹350'}].map(p=>(
        <button key={p.g} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'10px 12px',background:'#f9fafb',border:'1px solid #e4e6ea',borderRadius:8,cursor:'pointer',marginBottom:6,transition:'all .15s'}} onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}} onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e4e6ea'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}><img src="/default_images/icons/gold.svg" alt="" style={{width:16,height:16}} onError={()=>{}}/><span style={{fontSize:'0.85rem',fontWeight:700,color:'#111827'}}>{p.g} Gold</span></div>
          <span style={{fontSize:'0.85rem',fontWeight:700,color:'#1a73e8'}}>{p.p}</span>
        </button>
      ))}
    </div>
  )
}

function LeaderboardPanel() {
  const [data,setData]=useState([]), [type,setType]=useState('leader_xp'), [load,setLoad]=useState(false)
  useEffect(()=>{
    setLoad(true)
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/leaderboard/${type}`,{headers:{Authorization:`Bearer ${t}`}}).then(r=>r.json()).then(d=>setData(d.users||[])).catch(()=>{}).finally(()=>setLoad(false))
  },[type])
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{display:'flex',gap:4,padding:'8px 8px 4px',flexShrink:0}}>
        {[{id:'leader_xp',l:'XP'},{id:'leader_level',l:'Level'},{id:'leader_gold',l:'Gold'},{id:'leader_gift',l:'Gifts'}].map(tp=>(
          <button key={tp.id} onClick={()=>setType(tp.id)} style={{flex:1,padding:'5px 4px',borderRadius:6,border:`1.5px solid ${type===tp.id?'#1a73e8':'#e4e6ea'}`,background:type===tp.id?'#e8f0fe':'none',cursor:'pointer',fontSize:'0.72rem',fontWeight:700,color:type===tp.id?'#1a73e8':'#6b7280'}}>{tp.l}</button>
        ))}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load?<div style={{textAlign:'center',padding:16}}><div style={{width:20,height:20,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>
        :data.map((u,i)=>(
          <div key={u._id||i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderBottom:'1px solid #f3f4f6'}}>
            <span style={{fontSize:'0.8rem',fontWeight:800,color:i<3?['#f59e0b','#9ca3af','#d97706'][i]:'#9ca3af',width:18,flexShrink:0}}>#{i+1}</span>
            <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:24,height:24,borderRadius:'50%',objectFit:'cover',flexShrink:0}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
            <span style={{flex:1,fontSize:'0.8rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username}</span>
            <span style={{fontSize:'0.78rem',fontWeight:800,color:'#1a73e8'}}>{u.xp||u.level||u.gold||0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function UsernamePanel() {
  const [val,setVal]=useState(''), [msg,setMsg]=useState('')
  async function change() {
    const t=localStorage.getItem('cgz_token')
    const r=await fetch(`${API}/api/users/change-username`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify({newUsername:val})})
    const d=await r.json()
    setMsg(r.ok?'✅ Username changed!':d.error||'Failed')
  }
  return (
    <div style={{padding:14,flex:1}}>
      <div style={{background:'#fef3c7',border:'1px solid #fde68a',borderRadius:9,padding:'10px 12px',marginBottom:12,fontSize:'0.8rem',color:'#92400e'}}>
        Username change costs <strong>500 Gold</strong>
      </div>
      {msg&&<div style={{background:msg.startsWith('✅')?'#d1fae5':'#fee2e2',borderRadius:7,padding:'7px 10px',fontSize:'0.78rem',color:msg.startsWith('✅')?'#065f46':'#dc2626',marginBottom:10}}>{msg}</div>}
      <input value={val} onChange={e=>setVal(e.target.value)} placeholder="New username..."
        style={{width:'100%',padding:'9px 12px',border:'1.5px solid #e4e6ea',borderRadius:8,fontSize:'0.875rem',outline:'none',boxSizing:'border-box',color:'#111827',background:'#f9fafb',marginBottom:8,fontFamily:'Nunito,sans-serif'}}
        onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}
      />
      <button onClick={change} style={{width:'100%',padding:'10px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#1a73e8,#1464cc)',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.875rem',fontFamily:'Outfit,sans-serif'}}>
        Change Username
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RADIO PANEL
// ─────────────────────────────────────────────────────────────
function RadioPanel({onClose}) {
  const [all,setAll]=useState([])
  const [cat,setCat]=useState(null)
  const [cur,setCur]=useState(null)
  const [playing,setPlay]=useState(false)
  const audioRef=useRef(null)
  const CATS=[
    {id:'Hollywood',label:'🎬 Hollywood',langs:['English']},
    {id:'Bollywood',label:'🎭 Bollywood',langs:['Hindi']},
    {id:'Punjabi',  label:'🥁 Punjabi',  langs:['Punjabi']},
    {id:'South',    label:'🎶 South',    langs:['Tamil','Telugu','Kannada','Malayalam']},
    {id:'Bengali',  label:'🎵 Bengali',  langs:['Bengali']},
    {id:'More',     label:'🌐 More',     langs:['Marathi','Hindi/Sanskrit','Instrumental']},
  ]
  useEffect(()=>{
    fetch(`${API}/api/radio`).then(r=>r.json()).then(d=>setAll(d.stations||[])).catch(()=>{})
    return()=>audioRef.current?.pause()
  },[])
  function play(s) {
    if(cur?.id===s.id&&playing){audioRef.current?.pause();setPlay(false);return}
    setCur(s)
    if(audioRef.current){audioRef.current.src=s.streamUrl;audioRef.current.play().then(()=>setPlay(true)).catch(()=>setPlay(false))}
  }
  const catStations=cat?all.filter(s=>CATS.find(c=>c.id===cat)?.langs.includes(s.language)):[]
  return (
    <div style={{position:'absolute',bottom:'100%',left:0,right:0,background:'#fff',border:'1px solid #e4e6ea',borderRadius:'10px 10px 0 0',boxShadow:'0 -4px 20px rgba(0,0,0,.12)',maxHeight:'50vh',display:'flex',flexDirection:'column',zIndex:100}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 13px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          {cat&&<button onClick={()=>setCat(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#1a73e8',fontSize:13,padding:'0 4px 0 0'}}><i className="fi fi-sr-arrow-left"/></button>}
          <i className="fi fi-sr-radio" style={{color:'#1a73e8',fontSize:15}}/>
          <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:'#111827'}}>{playing&&cur?`🎵 ${cur.name}`:cat?CATS.find(c=>c.id===cat)?.label:'Radio'}</span>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {playing&&<button onClick={()=>{audioRef.current?.pause();setPlay(false)}} style={{background:'#fee2e2',border:'none',color:'#dc2626',padding:'3px 10px',borderRadius:20,cursor:'pointer',fontSize:'0.75rem',fontWeight:600}}>⏸ Stop</button>}
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:16}}><i className="fi fi-sr-cross-small"/></button>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'6px'}}>
        {!cat?(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,padding:'4px'}}>
            {CATS.map(c=>{
              const cnt=all.filter(s=>c.langs.includes(s.language)).length
              return(
                <button key={c.id} onClick={()=>setCat(c.id)}
                  style={{padding:'12px 8px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:9,cursor:'pointer',textAlign:'center',transition:'all .15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e4e6ea'}}
                >
                  <div style={{fontSize:'1.2rem',marginBottom:4}}>{c.label.split(' ')[0]}</div>
                  <div style={{fontSize:'0.75rem',fontWeight:700,color:'#374151'}}>{c.label.split(' ').slice(1).join(' ')}</div>
                  <div style={{fontSize:'0.65rem',color:'#9ca3af'}}>{cnt} stations</div>
                </button>
              )
            })}
          </div>
        ):catStations.map(s=>(
          <button key={s.id} onClick={()=>play(s)}
            style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:'7px 9px',background:cur?.id===s.id?'#e8f0fe':'none',border:`1px solid ${cur?.id===s.id?'#1a73e8':'transparent'}`,borderRadius:7,cursor:'pointer',marginBottom:2,textAlign:'left'}}
          >
            <div style={{width:30,height:30,background:'#f3f4f6',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14}}>{cur?.id===s.id&&playing?'🎵':s.flag||'📻'}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.82rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
              <div style={{fontSize:'0.69rem',color:'#9ca3af'}}>{s.genre}</div>
            </div>
            {cur?.id===s.id&&playing&&<span style={{fontSize:'0.65rem',color:'#1a73e8',fontWeight:700,flexShrink:0}}>▶ LIVE</span>}
          </button>
        ))}
      </div>
      <audio ref={audioRef} style={{display:'none'}}/>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS PANEL
// ─────────────────────────────────────────────────────────────
function NotifPanel({onClose,onCount}) {
  const [list,setList]=useState([]), [load,setLoad]=useState(true)
  const token=localStorage.getItem('cgz_token')
  useEffect(()=>{
    fetch(`${API}/api/notifications`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{setList(d.notifications||[]);onCount(d.unreadCount||0)}).catch(()=>{}).finally(()=>setLoad(false))
  },[])
  async function markAll(){
    await fetch(`${API}/api/notifications/read-all`,{method:'PUT',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    setList(p=>p.map(n=>({...n,isRead:true}))); onCount(0)
  }
  const unread=list.filter(n=>!n.isRead).length
  return (
    <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:14,width:310,maxHeight:420,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.14)',zIndex:999}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:'#111827'}}>Notifications</span>
          {unread>0&&<span style={{background:'#ef4444',color:'#fff',fontSize:'0.65rem',fontWeight:700,padding:'1px 6px',borderRadius:10}}>{unread}</span>}
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {unread>0&&<button onClick={markAll} style={{background:'none',border:'none',cursor:'pointer',color:'#1a73e8',fontSize:'0.75rem',fontWeight:600}}>Mark all read</button>}
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:14}}><i className="fi fi-sr-cross-small"/></button>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load&&<div style={{textAlign:'center',padding:24}}><div style={{width:22,height:22,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
        {!load&&list.length===0&&<div style={{textAlign:'center',padding:'32px 16px',color:'#9ca3af'}}><i className="fi fi-sc-bell-ring" style={{fontSize:32,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.875rem',fontWeight:600}}>No notifications</p></div>}
        {list.map(n=>(
          <div key={n._id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',borderBottom:'1px solid #f9fafb',background:n.isRead?'transparent':'#f0f7ff'}}>
            <div style={{width:32,height:32,borderRadius:8,background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
              {{gift:'🎁',friend:'👥',like:'❤️',badge:'🏅',levelup:'⬆️',call:'📞'}[n.type]||'🔔'}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.82rem',fontWeight:n.isRead?600:700,color:'#111827'}}>{n.title}</div>
              {n.message&&<div style={{fontSize:'0.75rem',color:'#6b7280',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.message}</div>}
              <div style={{fontSize:'0.67rem',color:'#9ca3af',marginTop:3}}>{new Date(n.createdAt).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
            {!n.isRead&&<span style={{width:8,height:8,background:'#1a73e8',borderRadius:'50%',flexShrink:0,marginTop:4}}/>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DM PANEL
// ─────────────────────────────────────────────────────────────
function DMPanel({me,socket,onClose,onCount}) {
  const [convos,setConvos]=useState([]), [active,setActive]=useState(null), [msgs,setMsgs]=useState([]), [input,setInput]=useState([]), [load,setLoad]=useState(true)
  const bottomRef=useRef(null)
  const token=localStorage.getItem('cgz_token')

  useEffect(()=>{
    fetch(`${API}/api/messages/private/conversations`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setConvos(d.conversations||[])).catch(()=>{}).finally(()=>setLoad(false))
    if(!socket) return
    const fn=(m)=>{ if(active&&(m.from===active.userId||m.to===active.userId)) setMsgs(p=>[...p,m]); loadConvos() }
    socket.on('privateMessage',fn); socket.on('privateMessageSent',fn)
    return()=>{ socket.off('privateMessage',fn); socket.off('privateMessageSent',fn) }
  },[socket,active])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  function loadConvos() {
    fetch(`${API}/api/messages/private/conversations`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setConvos(d.conversations||[])).catch(()=>{})
  }

  async function openConvo(u) {
    setActive(u); setMsgs([])
    fetch(`${API}/api/messages/private/${u.userId||u._id}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setMsgs(d.messages||[])).catch(()=>{})
  }

  function sendDM(e) {
    e.preventDefault()
    if(!input.trim()||!active||!socket) return
    socket.emit('privateMessage',{toUserId:active.userId||active._id,content:input.trim(),type:'text'})
    setInput('')
  }

  return (
    <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:14,width:330,height:460,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.14)',zIndex:999,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        {active?(
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={()=>setActive(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#1a73e8',fontSize:13}}><i className="fi fi-sr-arrow-left"/></button>
            <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.88rem',color:'#111827'}}>{active.username}</span>
          </div>
        ):<span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:'#111827'}}><i className="fi fi-sr-envelope" style={{marginRight:7,color:'#1a73e8'}}/>Messages</span>}
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:14}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      {!active?(
        <div style={{flex:1,overflowY:'auto'}}>
          {load&&<div style={{textAlign:'center',padding:20}}><div style={{width:22,height:22,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
          {!load&&convos.length===0&&<div style={{textAlign:'center',padding:'32px 16px',color:'#9ca3af'}}><i className="fi fi-sr-envelope" style={{fontSize:28,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.875rem',fontWeight:600}}>No messages</p></div>}
          {convos.map(c=>(
            <div key={c.userId} onClick={()=>openConvo(c)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:'1px solid #f9fafb',cursor:'pointer',background:c.unread>0?'#f0f7ff':'transparent',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background=c.unread>0?'#f0f7ff':'transparent'}>
              <img src={c.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`1.5px solid ${GBR(c.gender,c.rank)}`}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.84rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.username}</div>
                <div style={{fontSize:'0.74rem',color:'#9ca3af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.lastMessage||'...'}</div>
              </div>
              {c.unread>0&&<span style={{background:'#1a73e8',color:'#fff',fontSize:'0.65rem',fontWeight:700,padding:'1px 6px',borderRadius:10,flexShrink:0}}>{c.unread}</span>}
            </div>
          ))}
        </div>
      ):(
        <>
          <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
            {msgs.map((m,i)=>{
              const mine=(m.from===me?._id||m.sender?._id===me?._id)
              return(
                <div key={m._id||i} style={{display:'flex',justifyContent:mine?'flex-end':'flex-start',padding:'3px 12px'}}>
                  <div style={{background:mine?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6',color:mine?'#fff':'#111827',padding:'8px 12px',borderRadius:mine?'13px 3px 13px 13px':'3px 13px 13px 13px',fontSize:'0.875rem',maxWidth:'75%',wordBreak:'break-word'}}>{m.content}</div>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </div>
          <form onSubmit={sendDM} style={{display:'flex',gap:8,padding:'8px 10px',borderTop:'1px solid #e4e6ea',flexShrink:0}}>
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Send a message..."
              style={{flex:1,padding:'8px 12px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:20,fontSize:'0.875rem',outline:'none',color:'#111827',fontFamily:'Nunito,sans-serif'}}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}
            />
            <button type="submit" disabled={!input.trim()} style={{width:34,height:34,borderRadius:'50%',border:'none',background:input.trim()?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6',color:input.trim()?'#fff':'#9ca3af',cursor:input.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>
              <i className="fi fi-sr-paper-plane"/>
            </button>
          </form>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// GIFT PANEL
// ─────────────────────────────────────────────────────────────
function GiftPanel({targetUser,myGold,onClose,onSent,socket,roomId}) {
  const [gifts,setGifts]=useState([]), [cat,setCat]=useState('all'), [sel,setSel]=useState(null)
  const token=localStorage.getItem('cgz_token')
  useEffect(()=>{
    fetch(`${API}/api/gifts`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setGifts(d.gifts||[])).catch(()=>{})
  },[])
  const cats=['all',...new Set(gifts.map(g=>g.category))]
  const filtered=cat==='all'?gifts:gifts.filter(g=>g.category===cat)
  function send() {
    if(!sel) return
    socket?.emit('sendGift',{toUserId:targetUser._id||targetUser.userId,giftId:sel._id,roomId})
    onSent?.()
  }
  const canAfford=sel&&myGold>=sel.price
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1001,background:'rgba(0,0,0,.45)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:18,maxWidth:380,width:'100%',overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,.18)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'1px solid #f3f4f6'}}>
          <div>
            <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.95rem',color:'#111827'}}><i className="fi fi-sr-gift" style={{marginRight:7,color:'#7c3aed'}}/>Send Gift{targetUser?` to ${targetUser.username}`:''}</div>
            <div style={{fontSize:'0.74rem',color:'#d97706',marginTop:3,display:'flex',alignItems:'center',gap:4}}><img src="/default_images/icons/gold.svg" style={{width:12,height:12}} onError={()=>{}} alt=""/>Your balance: {myGold||0} Gold</div>
          </div>
          <button onClick={onClose} style={{background:'#f3f4f6',border:'none',width:30,height:30,borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#6b7280',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
        </div>
        <div style={{display:'flex',gap:4,padding:'8px 14px',overflowX:'auto',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:'4px 12px',borderRadius:20,border:`1.5px solid ${cat===c?'#7c3aed':'#e4e6ea'}`,background:cat===c?'#ede9fe':'none',cursor:'pointer',fontSize:'0.75rem',fontWeight:700,color:cat===c?'#7c3aed':'#6b7280',whiteSpace:'nowrap',flexShrink:0}}>
              {c.charAt(0).toUpperCase()+c.slice(1)}
            </button>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,padding:'12px 14px',maxHeight:220,overflowY:'auto'}}>
          {filtered.map(g=>(
            <div key={g._id} onClick={()=>setSel(g)} style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 6px',borderRadius:10,border:`2px solid ${sel?._id===g._id?'#7c3aed':'#e4e6ea'}`,cursor:'pointer',background:sel?._id===g._id?'#ede9fe':'#f9fafb',transition:'all .15s'}} onMouseEnter={e=>{if(sel?._id!==g._id){e.currentTarget.style.borderColor='#c4b5fd';e.currentTarget.style.background='#f5f3ff'}}} onMouseLeave={e=>{if(sel?._id!==g._id){e.currentTarget.style.borderColor='#e4e6ea';e.currentTarget.style.background='#f9fafb'}}}>
              <img src={g.icon} alt={g.name} style={{width:36,height:36,objectFit:'contain',marginBottom:4}} onError={e=>e.target.style.display='none'}/>
              <span style={{fontSize:'0.65rem',fontWeight:700,color:'#374151',textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',width:'100%'}}>{g.name}</span>
              <div style={{display:'flex',alignItems:'center',gap:2,marginTop:2}}><img src="/default_images/icons/gold.svg" alt="" style={{width:10,height:10}} onError={()=>{}}/><span style={{fontSize:'0.65rem',fontWeight:700,color:'#d97706'}}>{g.price}</span></div>
            </div>
          ))}
          {filtered.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:'20px',color:'#9ca3af',fontSize:'0.8rem'}}>No gifts available</div>}
        </div>
        <div style={{padding:'10px 14px 14px',borderTop:'1px solid #f3f4f6'}}>
          <button onClick={send} disabled={!sel||!canAfford} style={{width:'100%',padding:'11px',borderRadius:10,border:'none',background:sel&&canAfford?'linear-gradient(135deg,#7c3aed,#5b21b6)':'#f3f4f6',color:sel&&canAfford?'#fff':'#9ca3af',fontWeight:800,cursor:sel&&canAfford?'pointer':'not-allowed',fontSize:'0.875rem',fontFamily:'Outfit,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            <i className="fi fi-sr-gift"/>{sel?`Send ${sel.name} (${sel.price} Gold)`:'Select a gift'}
            {sel&&!canAfford&&<span style={{fontSize:'0.72rem',marginLeft:4}}>— Not enough Gold</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// AVATAR DROPDOWN
// ─────────────────────────────────────────────────────────────
function AvatarDropdown({me,status,setStatus,onLeave,socket}) {
  const [open,setOpen]=useState(false)
  const ref=useRef(null)
  const nav=useNavigate()
  useEffect(()=>{
    const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)}
    if(open) document.addEventListener('mousedown',fn)
    return()=>document.removeEventListener('mousedown',fn)
  },[open])
  const ri=R(me?.rank), border=GBR(me?.gender,me?.rank)
  const curSt=STATUSES.find(s=>s.id===status)||STATUSES[0]
  const isStaff=['moderator','admin','superadmin','owner'].includes(me?.rank)
  const isOwner=me?.rank==='owner'
  return (
    <div ref={ref} style={{position:'relative',flexShrink:0}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 4px',display:'flex',alignItems:'center'}}>
        <div style={{position:'relative'}}>
          <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:30,height:30,borderRadius:'50%',objectFit:'cover',border:`2px solid ${border}`,display:'block'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
          <span style={{position:'absolute',bottom:0,right:0,width:8,height:8,background:curSt.color,borderRadius:'50%',border:'1.5px solid #fff'}}/>
        </div>
      </button>
      {open&&(
        <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:13,minWidth:220,boxShadow:'0 6px 24px rgba(0,0,0,.13)',zIndex:999,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:'12px 13px 9px',borderBottom:'1px solid #f3f4f6'}}>
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:7}}>
              <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:40,height:40,borderRadius:'50%',border:`2.5px solid ${border}`,objectFit:'cover',flexShrink:0}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
              <div style={{minWidth:0}}>
                <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:me?.nameColor||'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{me?.username}</div>
                <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}><RIcon rank={me?.rank} size={12}/><span style={{fontSize:'0.7rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
              </div>
            </div>
            {!me?.isGuest&&<div style={{display:'flex',gap:10}}>
              <div style={{display:'flex',alignItems:'center',gap:3}}><img src="/default_images/icons/gold.svg" style={{width:13,height:13}} onError={()=>{}} alt=""/><span style={{fontSize:'0.72rem',fontWeight:700,color:'#d97706'}}>{me?.gold||0}</span></div>
              <div style={{display:'flex',alignItems:'center',gap:3}}><img src="/default_images/icons/level.svg" style={{width:13,height:13}} onError={()=>{}} alt=""/><span style={{fontSize:'0.72rem',fontWeight:700,color:'#1a73e8'}}>Lv.{me?.level||1}</span></div>
            </div>}
          </div>
          <div style={{padding:'6px 8px',borderBottom:'1px solid #f3f4f6'}}>
            <div style={{display:'flex',gap:4}}>
              {STATUSES.map(s=>(
                <button key={s.id} onClick={()=>{setStatus(s.id);socket?.emit('updateStatus',{status:s.id})}} title={s.label}
                  style={{flex:1,padding:'5px 2px',borderRadius:6,border:`1.5px solid ${status===s.id?s.color:'#e4e6ea'}`,background:status===s.id?s.color+'18':'none',cursor:'pointer',fontSize:'0.63rem',fontWeight:600,color:status===s.id?s.color:'#6b7280',transition:'all .15s'}}>
                  {s.label.slice(0,3)}
                </button>
              ))}
            </div>
          </div>
          <div style={{padding:'4px'}}>
            {[
              {icon:'fi-ss-user',        label:'My Profile'},
              {icon:'fi-sr-pencil',      label:'Edit Profile'},
              {icon:'fi-sr-wallet',      label:'Wallet'},
              {icon:'fi-sr-layer-group', label:'Level Status'},
              isStaff&&{icon:'fi-sr-settings',  label:'Room Options'},
              isStaff&&{icon:'fi-sr-dashboard', label:'Admin Panel',color:'#ef4444',onClick:()=>{setOpen(false);window.location.href='/admin'}},
              isOwner&&{icon:'fi-sr-cog',       label:'Site Settings',color:'#7c3aed'},
            ].filter(Boolean).map((item,i)=>(
              <button key={i} onClick={()=>{item.onClick?.();setOpen(false)}}
                style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'8px 10px',background:'none',border:'none',cursor:'pointer',color:item.color||'#374151',fontSize:'0.84rem',fontWeight:600,borderRadius:7,textAlign:'left',transition:'background .12s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}
              ><i className={`fi ${item.icon}`} style={{fontSize:13,width:15,textAlign:'center',flexShrink:0}}/>{item.label}</button>
            ))}
            <div style={{borderTop:'1px solid #f3f4f6',margin:'4px 0'}}/>
            <button onClick={onLeave} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'8px 10px',background:'none',border:'none',cursor:'pointer',color:'#374151',fontSize:'0.84rem',fontWeight:600,borderRadius:7,textAlign:'left',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='none'}><i className="fi fi-sr-arrow-left" style={{fontSize:13,width:15,textAlign:'center',flexShrink:0}}/>Leave Room</button>
            <button onClick={()=>{const t=localStorage.getItem('cgz_token');if(t)fetch(`${API}/api/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${t}`}}).catch(()=>{});localStorage.removeItem('cgz_token');nav('/login')}}
              style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'8px 10px',background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:'0.84rem',fontWeight:600,borderRadius:7,textAlign:'left',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='none'}><i className="fi fi-sr-user-logout" style={{fontSize:13,width:15,textAlign:'center',flexShrink:0}}/>Logout</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FOOTER — Radio + User list sidebar toggle
// ─────────────────────────────────────────────────────────────
function Footer({showRadio,setShowRadio,showRight,setRight,notif}) {
  return (
    <div style={{background:'#fff',borderTop:'1px solid #e4e6ea',padding:'4px 10px',display:'flex',alignItems:'center',gap:4,flexShrink:0,position:'relative'}}>
      {/* Radio left */}
      <FBtn icon="fi-sr-radio" active={showRadio} onClick={()=>setShowRadio(s=>!s)} title="Radio"/>
      <div style={{flex:1}}/>
      {/* Single user list toggle - menu bar icon */}
      <FBtn icon="fi-sr-list" active={showRight} onClick={()=>setRight(s=>!s)} title="User List" badge={notif.friends}/>
    </div>
  )
}
function FBtn({icon,active,onClick,title,badge}) {
  return (
    <button onClick={onClick} title={title} style={{position:'relative',background:active?'#e8f0fe':'none',border:'none',cursor:'pointer',color:active?'#1a73e8':'#9ca3af',width:34,height:32,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,transition:'all .15s'}}>
      <i className={`fi ${icon}`}/>
      {badge>0&&<span style={{position:'absolute',top:4,right:4,width:7,height:7,background:'#ef4444',borderRadius:'50%',border:'1.5px solid #fff'}}/>}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN CHATROOM
// ─────────────────────────────────────────────────────────────
export default function ChatRoom() {
  const {roomId}=useParams(), nav=useNavigate(), toast=useToast()
  const token=localStorage.getItem('cgz_token')

  const [me,        setMe]       =useState(null)
  const [room,      setRoom]     =useState(null)
  const [messages,  setMsgs]     =useState([])
  const [users,     setUsers]    =useState([])
  const [input,     setInput]    =useState('')
  const [typers,    setTypers]   =useState([])
  const [showRight, setRight]    =useState(true)
  const [showLeft,  setLeft]     =useState(false)
  const [showRadio, setRadio]    =useState(false)
  const [showNotif, setShowNotif]=useState(false)
  const [showDM,    setShowDM]   =useState(false)
  const [profUser,  setProf]     =useState(null)
  const [miniCard,  setMini]     =useState(null)
  const [giftTarget,setGiftTgt]  =useState(null)
  const [loading,   setLoad]     =useState(true)
  const [roomErr,   setErr]      =useState('')
  const [connected, setConn]     =useState(false)
  const [status,    setStatus]   =useState('online')
  const [notif,     setNotif]    =useState({dm:0,friends:0,notif:0,reports:0})

  const sockRef=useRef(null), bottomRef=useRef(null), inputRef=useRef(null)
  const typingTimer=useRef(null), isTypingRef=useRef(false)

  useEffect(()=>{
    if(!token){nav('/login');return}
    loadRoom()
    return()=>sockRef.current?.disconnect()
  },[roomId])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  async function loadRoom() {
    setLoad(true); setErr('')
    try {
      const [mr,rr]=await Promise.all([
        fetch(`${API}/api/auth/me`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/rooms/${roomId}`,{headers:{Authorization:`Bearer ${token}`}}),
      ])
      if(mr.status===401){localStorage.removeItem('cgz_token');nav('/login');return}
      const md=await mr.json()
      if(md.user){if(md.freshToken)localStorage.setItem('cgz_token',md.freshToken);setMe(md.user)}
      const rd=await rr.json()
      if(!rr.ok){setErr(rd.error||'Room not found');setLoad(false);return}
      setRoom(rd.room)
      fetch(`${API}/api/rooms/${roomId}/messages?limit=50`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.messages)setMsgs(d.messages)}).catch(()=>{})
    } catch{setErr('Connection failed.')}
    setLoad(false)
    connectSocket()
  }

  function connectSocket() {
    sockRef.current?.disconnect()
    const s=io(API,{auth:{token},transports:['websocket','polling']})
    s.on('connect',       ()=>{setConn(true);s.emit('joinRoom',{roomId})})
    s.on('disconnect',    ()=>setConn(false))
    s.on('messageHistory',ms=>setMsgs(ms||[]))
    s.on('newMessage',    m=>{setMsgs(p=>[...p,m]);Sounds.newMessage()})
    s.on('roomUsers',     l=>setUsers(l||[]))
    s.on('userJoined',    u=>{setUsers(p=>p.find(x=>x.userId===u.userId)?p:[...p,u]);setMsgs(p=>[...p,{_id:Date.now(),type:'system',content:`${u.username} joined`,createdAt:new Date()}]);Sounds.join()})
    s.on('userLeft',      u=>{setUsers(p=>p.filter(x=>x.userId!==u.userId));setMsgs(p=>[...p,{_id:Date.now()+'l',type:'system',content:`${u.username} left`,createdAt:new Date()}]);Sounds.leave()})
    s.on('systemMessage', m=>setMsgs(p=>[...p,{_id:Date.now()+'s',type:'system',content:m.text,createdAt:new Date()}]))
    s.on('messageDeleted',({messageId})=>setMsgs(p=>p.filter(m=>m._id!==messageId)))
    s.on('typing',        ({username,isTyping:t})=>setTypers(p=>t?[...new Set([...p,username])]:p.filter(n=>n!==username)))
    s.on('youAreKicked',  ({reason})=>{Sounds.mute();toast?.show(reason||'You were kicked','error',5000);setTimeout(()=>nav('/chat'),2000)})
    s.on('accessDenied',  ({msg})=>{toast?.show(msg||'Access denied','error',5000);setTimeout(()=>nav('/chat'),2000)})
    s.on('youAreMuted',   ({minutes})=>{Sounds.mute();toast?.show(`🔇 Muted for ${minutes} minutes`,'warn',6000)})
    s.on('levelUp',       ({level,gold})=>{Sounds.levelUp();toast?.show(`🎉 Level ${level}! +${gold} Gold`,'success',5000)})
    s.on('giftReceived',  ({gift,from})=>{Sounds.gift();toast?.show(`🎁 ${from} sent you ${gift.name}!`,'gift',5000)})
    s.on('diceResult',    ({roll,won,payout})=>toast?.show(`🎲 Rolled ${roll}! ${won?`Won ${payout} Gold! 🎉`:'Better luck next time!'}`,'info',4000))
    s.on('spinResult',    ({prize})=>toast?.show(`🎡 Spin prize: ${prize.label || prize} !`,'success',4000))
    s.on('error',         e=>console.error('Socket:',e))
    s.on('roomPasswordRequired', ({roomId:rid,roomName})=>{
      const pw=window.prompt(`🔒 "${roomName}" requires a password:`)
      if(pw) s.emit('joinRoom',{roomId:rid,enteredPassword:pw})
      else nav('/chat')
    })
    sockRef.current=s
  }

  function handleTyping(e) {
    setInput(e.target.value)
    if(!isTypingRef.current){isTypingRef.current=true;sockRef.current?.emit('typing',{roomId,isTyping:true})}
    clearTimeout(typingTimer.current)
    typingTimer.current=setTimeout(()=>{isTypingRef.current=false;sockRef.current?.emit('typing',{roomId,isTyping:false})},2000)
  }

  function send(e) {
    e.preventDefault()
    const t=input.trim()
    if(!t||!sockRef.current||!connected) return
    sockRef.current.emit('sendMessage',{roomId,content:t,type:'text'})
    setInput('')
    isTypingRef.current=false; sockRef.current?.emit('typing',{roomId,isTyping:false})
    inputRef.current?.focus()
  }

  function leave(){sockRef.current?.disconnect();nav('/chat')}

  // Mention: click username → add to input (no @)
  const handleMention=useCallback((username)=>{
    setInput(p=>username+' '+p)
    inputRef.current?.focus()
  },[])

  const handleMiniCard=useCallback((user,pos)=>{setMini({user,pos});setProf(null)},[])

  const myLevel=RANKS[me?.rank]?.level||1
  const isStaff=myLevel>=11

  // Close all popups on click outside
  const closeAll=useCallback(()=>{setMini(null);setShowNotif(false);setShowDM(false)},[])

  if(!loading&&roomErr) return (
    <div style={{minHeight:'100vh',background:'#f8f9fa',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
      <div style={{fontSize:40}}>⚠️</div><p style={{color:'#374151',fontWeight:600}}>{roomErr}</p>
      <button onClick={()=>nav('/chat')} style={{padding:'10px 22px',borderRadius:9,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer'}}>← Back to Lobby</button>
    </div>
  )
  if(loading) return (
    <div style={{minHeight:'100vh',background:'#f8f9fa',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}><div style={{width:32,height:32,border:'3px solid #e4e6ea',borderTop:'3px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 10px'}}/><p style={{color:'#9ca3af',fontSize:'0.9rem'}}>Joining room...</p></div>
    </div>
  )

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'#fff',overflow:'hidden'}} onClick={closeAll}>

      {/* ── HEADER ── */}
      <div style={{height:48,background:'#fff',borderBottom:'1px solid #e4e6ea',display:'flex',alignItems:'center',padding:'0 8px',gap:5,flexShrink:0,boxShadow:'0 1px 3px rgba(0,0,0,.05)'}}>

        {/* LEFT: hamburger → opens left sidebar */}
        <button onClick={e=>{e.stopPropagation();setLeft(s=>!s)}} title="Menu"
          style={{background:showLeft?'#e8f0fe':'none',border:'none',cursor:'pointer',color:showLeft?'#1a73e8':'#6b7280',width:34,height:34,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,transition:'all .15s'}}>
          <i className="fi fi-sr-bars-sort"/>
        </button>

        <div style={{flex:1}}/>

        {/* RIGHT icons */}
        {/* DM */}
        <div style={{position:'relative'}}>
          <HBtn icon="fi-sr-envelope" title="Messages" badge={notif.dm} active={showDM} onClick={e=>{e.stopPropagation();setShowDM(p=>!p);setShowNotif(false)}}/>
          {showDM&&<DMPanel me={me} socket={sockRef.current} onClose={()=>setShowDM(false)} onCount={n=>setNotif(p=>({...p,dm:n}))}/>}
        </div>

        {/* Notifications bell */}
        <div style={{position:'relative'}}>
          <HBtn icon="fi-sc-bell-ring" title="Notifications" badge={notif.notif} active={showNotif} onClick={e=>{e.stopPropagation();setShowNotif(p=>!p);setShowDM(false)}}/>
          {showNotif&&<NotifPanel onClose={()=>setShowNotif(false)} onCount={n=>setNotif(p=>({...p,notif:n}))}/>}
        </div>

        {/* Reports — staff only */}
        {isStaff&&<HBtn icon="fi-sr-flag" title="Reports" badge={notif.reports}/>}

        {/* Avatar dropdown */}
        <AvatarDropdown me={me} status={status} setStatus={setStatus} onLeave={leave} socket={sockRef.current}/>
      </div>

      {/* ── BODY ── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* LEFT SIDEBAR — opened from header hamburger */}
        {showLeft&&<LeftSidebar room={room} nav={nav} socket={sockRef.current} roomId={roomId} onClose={()=>setLeft(false)}/>}

        {/* MESSAGES */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {room?.topic&&<div style={{background:'#f8f9fa',borderBottom:'1px solid #e4e6ea',padding:'5px 14px',fontSize:'0.78rem',color:'#374151',flexShrink:0}}><i className="fi fi-sr-info" style={{marginRight:5,color:'#1a73e8'}}/>{room.topic}</div>}
          <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
            {messages.map((m,i)=>(
              <Msg key={m._id||i} msg={m} myId={me?._id} myLevel={myLevel}
                onMiniCard={handleMiniCard} onMention={handleMention}
                socket={sockRef.current} roomId={roomId}
              />
            ))}
            {/* Typing indicator */}
            {typers.filter(t=>t!==me?.username).length>0&&(
              <div style={{padding:'2px 14px 6px',display:'flex',alignItems:'center',gap:8}}>
                <div style={{display:'flex',gap:3}}>
                  {[0,1,2].map(i=><span key={i} style={{width:5,height:5,background:'#9ca3af',borderRadius:'50%',display:'inline-block',animation:`typingDot .8s ease-in-out ${i*0.2}s infinite`}}/>)}
                </div>
                <span style={{fontSize:'0.72rem',color:'#9ca3af',fontStyle:'italic'}}>{typers.filter(t=>t!==me?.username).join(', ')} {typers.filter(t=>t!==me?.username).length===1?'is':'are'} typing...</span>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* INPUT BAR */}
          <div style={{borderTop:'1px solid #e4e6ea',padding:'7px 10px',background:'#fff',flexShrink:0}}>
            <form onSubmit={send} style={{display:'flex',alignItems:'center',gap:6}}>
              <button type="button" title="Emoji" style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:20,padding:'0 2px',flexShrink:0,display:'flex',alignItems:'center'}}><i className="fi fi-rr-smile"/></button>
              <button type="button" title="Image" style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:17,padding:'0 2px',flexShrink:0,display:'flex',alignItems:'center'}}><i className="fi fi-sr-picture"/></button>
              <input ref={inputRef} value={input} onChange={handleTyping}
                placeholder={connected?'Type a message...':'Connecting...'}
                disabled={!connected}
                style={{flex:1,padding:'9px 14px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:22,color:'#111827',fontSize:'0.9rem',outline:'none',transition:'border-color .15s',fontFamily:'Nunito,sans-serif'}}
                onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}
              />
              <button type="button" title="Gift" onClick={e=>{e.stopPropagation();setGiftTgt({_id:null,username:'Room'})}}
                style={{background:'none',border:'none',cursor:'pointer',fontSize:17,padding:'0 2px',flexShrink:0,display:'flex',alignItems:'center'}}>
                <img src="/default_images/icons/gift.svg" alt="" style={{width:19,height:19,objectFit:'contain'}} onError={e=>{e.target.outerHTML='<i class="fi fi-sr-gift" style="font-size:17px;color:#9ca3af"></i>'}}/>
              </button>
              <button type="submit" disabled={!input.trim()||!connected}
                style={{width:36,height:36,borderRadius:'50%',border:'none',background:input.trim()&&connected?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6',color:input.trim()&&connected?'#fff':'#9ca3af',cursor:input.trim()&&connected?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0,transition:'all .15s'}}>
                <i className="fi fi-sr-paper-plane"/>
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        {showRight&&<RightSidebar users={users} myLevel={myLevel} onUserClick={u=>{setProf(u);setMini(null)}} onClose={()=>setRight(false)}/>}
      </div>

      {/* FOOTER */}
      <div style={{position:'relative'}}>
        {showRadio&&<RadioPanel onClose={()=>setRadio(false)}/>}
        <Footer showRadio={showRadio} setShowRadio={setRadio} showRight={showRight} setRight={setRight} notif={notif}/>
      </div>

      {/* OVERLAYS */}
      {miniCard&&<MiniCard user={miniCard.user} myLevel={myLevel} pos={miniCard.pos} onClose={()=>setMini(null)} onFull={()=>{setProf(miniCard.user);setMini(null)}} onGift={u=>setGiftTgt(u)} socket={sockRef.current} roomId={roomId}/>}
      {profUser&&<ProfileModal user={profUser} myLevel={myLevel} socket={sockRef.current} roomId={roomId} onClose={()=>setProf(null)} onGift={u=>setGiftTgt(u)}/>}
      {giftTarget&&<GiftPanel targetUser={giftTarget} myGold={me?.gold||0} onClose={()=>setGiftTgt(null)} onSent={()=>{setGiftTgt(null);toast?.show('Gift sent! 🎁','gift',3000)}} socket={sockRef.current} roomId={roomId}/>}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes typingDot{0%,80%,100%{transform:scale(.8);opacity:.5}40%{transform:scale(1.1);opacity:1}}
        .del-btn{display:none!important}
        div:hover > div > .del-btn{display:inline-flex!important}
      `}</style>
    </div>
  )
}

function HBtn({icon,title,badge,active,onClick}) {
  return (
    <button onClick={onClick} title={title}
      style={{position:'relative',background:active?'#e8f0fe':'none',border:'none',cursor:'pointer',color:active?'#1a73e8':'#9ca3af',width:34,height:34,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,transition:'all .15s',flexShrink:0}}
      onMouseEnter={e=>{e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.color='#374151'}}
      onMouseLeave={e=>{e.currentTarget.style.background=active?'#e8f0fe':'none';e.currentTarget.style.color=active?'#1a73e8':'#9ca3af'}}
    >
      <i className={`fi ${icon}`}/>
      {badge>0&&<span style={{position:'absolute',top:5,right:5,width:7,height:7,background:'#ef4444',borderRadius:'50%',border:'1.5px solid #fff'}}/>}
    </button>
  )
}
