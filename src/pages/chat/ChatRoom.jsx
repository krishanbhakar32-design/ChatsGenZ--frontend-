import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useToast } from '../../components/Toast.jsx'
import { Sounds } from '../../utils/sounds.js'
import DJPanel, { ThemePicker, ROOM_THEMES } from './DJPanel.jsx'
import RadioPlayer, { RadioMiniBar } from './RadioPlayer.jsx'


// ═══════════════════════════════════════════════════════════════
// PERSISTENT RADIO — audio singleton that survives component
// unmounts and panel minimize so music never stops
// ═══════════════════════════════════════════════════════════════
const _radioAudio = typeof window !== 'undefined' ? new Audio() : null;
let _radioState = { stationId: null, playing: false, volume: 0.8 };
if (_radioAudio) { _radioAudio.preload = 'none'; _radioAudio.crossOrigin = 'anonymous'; }

function getRadioAudio() { return _radioAudio; }
function getRadioState() { return _radioState; }
function setRadioState(patch) { Object.assign(_radioState, patch); }

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
const STATUS_DOT  = { online:'#22c55e', away:'#f59e0b', busy:'#ef4444', invisible:'#9ca3af' }
function moodEmoji(mood) {
  if (!mood) return ''
  const m = mood.toLowerCase()
  if (m.includes('happy')||m.includes('great')||m.includes('good')) return '😊'
  if (m.includes('sad')||m.includes('bad')||m.includes('down')) return '😔'
  if (m.includes('angry')||m.includes('mad')) return '😠'
  if (m.includes('bored')) return '😑'
  if (m.includes('love')||m.includes('heart')) return '❤️'
  if (m.includes('sleep')||m.includes('tired')) return '😴'
  if (m.includes('chill')||m.includes('relax')) return '😎'
  if (m.includes('music')) return '🎵'
  return '💬'
}

// ─────────────────────────────────────────────────────────────
// DARK MODE CONTEXT
// ─────────────────────────────────────────────────────────────
const useDark = () => {
  const [dark, setDark] = useState(() => localStorage.getItem('cgz_dark') === '1')
  const toggle = () => { const n = !dark; setDark(n); localStorage.setItem('cgz_dark', n?'1':'0') }
  return [dark, toggle]
}
const D = (dark, light, d) => dark ? d : light  // theme helper

function RIcon({rank,size=14}) {
  const ri = R(rank)
  return <img src={`/icons/ranks/${ri.icon}`} alt="" style={{width:size,height:size,objectFit:'contain',background:'transparent',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
}

// ─────────────────────────────────────────────────────────────
// EMOJI PICKER (simple inline)
// ─────────────────────────────────────────────────────────────
const EMOJI_LIST = ['😀','😂','😍','🥰','😎','😭','🤣','😅','🤔','😱','🎉','👍','👎','❤️','🔥','💯','😡','🥺','🙏','💀','👀','💪','🌹','🎁','🍕','😴','🤩','😬','🤦','✨']
function EmojiPicker({onPick,dark}) {
  return (
    <div style={{position:'absolute',bottom:'calc(100% + 6px)',left:0,background:dark?'#1e2030':'#fff',border:`1px solid ${dark?'#374151':'#e4e6ea'}`,borderRadius:12,padding:10,display:'flex',flexWrap:'wrap',gap:4,width:230,boxShadow:'0 8px 24px rgba(0,0,0,.16)',zIndex:200}}>
      {EMOJI_LIST.map(e=>(
        <button key={e} onClick={()=>onPick(e)} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,padding:'2px 3px',borderRadius:5,transition:'transform .1s'}} onMouseEnter={ev=>ev.currentTarget.style.transform='scale(1.3)'} onMouseLeave={ev=>ev.currentTarget.style.transform='scale(1)'}>{e}</button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MINI CARD
// ─────────────────────────────────────────────────────────────
function MiniCard({user,myLevel,pos,onClose,onFull,onGift,socket,roomId,dark,onReport}) {
  const _navProf=()=>{if(user?.username){window.location.href=`/profile/${user.username}`}}
  if (!user) return null
  const ri=R(user.rank), bdr=GBR(user.gender,user.rank)
  const canMod=myLevel>=11&&RL(user.rank)<myLevel
  const canBan=myLevel>=12&&RL(user.rank)<myLevel
  const isOwn=myLevel>=14
  const token=localStorage.getItem('cgz_token')
  const x=Math.min(pos.x,window.innerWidth-225), y=Math.min(pos.y,window.innerHeight-340)
  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea', txt=dark?'#e5e7eb':'#111827'
  const API=import.meta.env.VITE_API_URL||'https://chatsgenz-backend-production.up.railway.app'

  function doBan() {
    const reason = window.prompt(`Ban ${user.username}?\nEnter ban reason (leave blank for default):`)
    if (reason === null) return // cancelled
    fetch(`${API}/api/admin/users/${user._id||user.userId}/ban`,{
      method:'PUT', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({reason:reason||'Banned by staff',days:null})
    }).catch(()=>{})
    onClose()
  }

  function doRank() {
    const all=['guest','user','vipfemale','vipmale','butterfly','ninja','fairy','legend','bot','premium','moderator','admin','superadmin','owner']
    const allowed = myLevel>=14 ? all : all.filter(r=>({guest:1,user:2,vipfemale:3,vipmale:4,butterfly:5,ninja:6,fairy:7,legend:8,bot:9,premium:10,moderator:11,admin:12,superadmin:13,owner:14}[r]||0)<myLevel)
    const opts = allowed.map((r,i)=>`${i+1}. ${r}`).join('\n')
    const choice = window.prompt(`Set rank for ${user.username}:\n${opts}\n\nType the rank name:`)
    if (!choice) return
    const rank = choice.trim().toLowerCase()
    if (!all.includes(rank)) return
    fetch(`${API}/api/admin/users/${user._id||user.userId}/rank`,{
      method:'PUT', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({rank})
    }).catch(()=>{})
    onClose()
  }
  function doBlock(uid) {
    if(!uid) return
    const uidStr=uid.toString()
    fetch(`${_API}/api/users/block/${uidStr}`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    const cur=JSON.parse(localStorage.getItem('cgz_blocked_ids')||'[]')
    if(!cur.includes(uidStr)){const next=[...cur,uidStr];localStorage.setItem('cgz_blocked_ids',JSON.stringify(next))}
    onClose()
  }

  return (
    <div style={{position:'fixed',zIndex:9999,top:y,left:x,background:bg,border:`1px solid ${border}`,borderRadius:12,width:218,boxShadow:'0 8px 28px rgba(0,0,0,.25)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <div style={{height:36,background:`linear-gradient(135deg,${ri.color}33,#e8f0fe)`}}/>
      <div style={{display:'flex',alignItems:'flex-end',gap:8,padding:'0 12px',marginTop:-18,marginBottom:8}}>
        <div style={{position:'relative',flexShrink:0}}>
          <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:40,height:40,borderRadius:'50%',border:`2.5px solid ${bdr}`,objectFit:'cover',background:'#fff'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
          <span style={{position:'absolute',bottom:0,right:0,width:10,height:10,background:STATUS_DOT[user.status]||STATUS_DOT.online,borderRadius:'50%',border:`2px solid ${bg}`,display:'block'}}/>
        </div>
        <div style={{paddingBottom:2,minWidth:0,flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.875rem',color:user.nameColor||txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.username}</div>
            {user.countryCode&&user.countryCode!=='ZZ'&&<img src={`/icons/flags/${user.countryCode.toLowerCase()}.png`} alt="" style={{width:16,height:11,borderRadius:2,flexShrink:0}} onError={e=>e.target.style.display='none'}/>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:4}}><RIcon rank={user.rank} size={11}/><span style={{fontSize:'0.68rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
          {user.mood&&<div style={{fontSize:'0.65rem',color:'#9ca3af',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{moodEmoji(user.mood)} {user.mood}</div>}
        </div>
      </div>
      <div style={{padding:'0 8px 8px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
        {[
          {icon:'fi-ss-user',label:'Profile',onClick:()=>{_navProf();onClose()}},
          {icon:'fi-sr-comments',label:'PM'},
          {icon:'fi-sr-phone-call',label:'Call',onClick:()=>{socket?.emit('callUser',{toUserId:user._id||user.userId,callType:'video',callId:`c_${Date.now()}`});onClose()}},
          {icon:'fi-sr-gift',label:'Gift',color:'#7c3aed',onClick:()=>{onGift(user);onClose()}},
          myLevel>=2&&{icon:'fi-sr-user-add',label:'Friend',color:'#059669',onClick:()=>{fetch(`${API}/api/users/friend/${user._id||user.userId}`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{});onClose()}},
          myLevel>=2&&{icon:'fi-sr-user-block',label:'Block',color:'#6b7280',onClick:()=>doBlock(user._id||user.userId)},
          canMod&&{icon:'fi-sr-volume-mute',label:'Mute',color:'#f59e0b',onClick:()=>{socket?.emit('muteUser',{targetUserId:user._id||user.userId,roomId,minutes:30});onClose()}},
          canMod&&{icon:'fi-sr-user-slash',label:'Kick',color:'#ef4444',onClick:()=>{socket?.emit('kickUser',{targetUserId:user._id||user.userId,roomId});onClose()}},
          canBan&&{icon:'fi-sr-ban',label:'Ban',color:'#dc2626',onClick:doBan},
          isOwn&&{icon:'fi-sr-shield-check',label:'Set Rank',color:'#1a73e8',onClick:doRank},
          {icon:'fi-sr-flag',label:'Report',color:'#ef4444',onClick:()=>{onReport&&onReport({sender:user,content:'[User report from mini card]',_id:'user_'+user._id});onClose()}},
        ].filter(Boolean).map((b,i)=>(
          <button key={i} onClick={b.onClick} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 7px',background:dark?'#2a2d3e':'#f9fafb',border:`1px solid ${border}`,borderRadius:7,cursor:'pointer',fontSize:'0.72rem',fontWeight:600,color:b.color||txt,transition:'all .12s'}} onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}} onMouseLeave={e=>{e.currentTarget.style.background=dark?'#2a2d3e':'#f9fafb';e.currentTarget.style.borderColor=border}}>
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
function ProfileModal({user,myLevel,socket,roomId,onClose,onGift,dark,onReport}) {
  if (!user) return null
  const ri=R(user.rank), bdr=GBR(user.gender,user.rank)
  const canMod=myLevel>=11&&RL(user.rank)<myLevel
  const canBan=myLevel>=12&&RL(user.rank)<myLevel
  const isOwn=myLevel>=14
  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea', txt=dark?'#e5e7eb':'#111827'
  const _API=import.meta.env.VITE_API_URL||'https://chatsgenz-backend-production.up.railway.app'
  const _tok=localStorage.getItem('cgz_token')
  function doBan(){const r=window.prompt(`Ban ${user.username}? Enter reason:`);if(r===null)return;fetch(`${_API}/api/admin/users/${user._id||user.userId}/ban`,{method:'PUT',headers:{Authorization:`Bearer ${_tok}`,'Content-Type':'application/json'},body:JSON.stringify({reason:r||'Banned by staff',days:null})}).catch(()=>{});onClose()}
  function doRank(){const all=['guest','user','vipfemale','vipmale','butterfly','ninja','fairy','legend','bot','premium','moderator','admin','superadmin','owner'];const rl={guest:1,user:2,vipfemale:3,vipmale:4,butterfly:5,ninja:6,fairy:7,legend:8,bot:9,premium:10,moderator:11,admin:12,superadmin:13,owner:14};const allowed=myLevel>=14?all:all.filter(r=>(rl[r]||0)<myLevel);const rank=window.prompt(`Set rank for ${user.username}.\nOptions: ${allowed.join(', ')}\nType rank name:`);if(!rank||!all.includes(rank.trim().toLowerCase()))return;fetch(`${_API}/api/admin/users/${user._id||user.userId}/rank`,{method:'PUT',headers:{Authorization:`Bearer ${_tok}`,'Content-Type':'application/json'},body:JSON.stringify({rank:rank.trim().toLowerCase()})}).catch(()=>{});onClose()}
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:bg,borderRadius:18,maxWidth:340,width:'100%',overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,.28)'}}>
        <div style={{height:88,background:`linear-gradient(135deg,${ri.color}44,#e8f0fe)`,position:'relative'}}>
          <button onClick={onClose} style={{position:'absolute',top:10,right:10,background:'rgba(255,255,255,.8)',border:'none',width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
          {user.countryCode&&user.countryCode!=='ZZ'&&<img src={`/icons/flags/${user.countryCode.toLowerCase()}.png`} alt="" style={{position:'absolute',bottom:10,right:12,width:22,height:14,borderRadius:2}} onError={e=>e.target.style.display='none'}/>}
        </div>
        <div style={{display:'flex',justifyContent:'center',marginTop:-36}}>
          <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:72,height:72,borderRadius:'50%',border:`3px solid ${bdr}`,objectFit:'cover',background:'#fff'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        </div>
        <div style={{padding:'10px 18px 18px',textAlign:'center'}}>
          <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1.05rem',color:user.nameColor||txt}}>{user.username}</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,margin:'4px 0 12px'}}><RIcon rank={user.rank} size={14}/><span style={{fontSize:'0.75rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
          {user.mood&&<p style={{fontSize:'0.8rem',color:'#6b7280',marginBottom:8,fontStyle:'italic'}}>"{user.mood}"</p>}
          {user.about&&<p style={{fontSize:'0.8rem',color:'#6b7280',marginBottom:12,lineHeight:1.5}}>{user.about}</p>}
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:14}}>
            {[{l:'Level',v:user.level||1,c:'#1a73e8'},{l:'Gold',v:user.gold||0,c:'#d97706'},{l:'Msgs',v:user.totalMessages||0,c:'#7c3aed'}].map(s=>(
              <div key={s.l} style={{textAlign:'center',background:dark?'#2a2d3e':'#f9fafb',borderRadius:8,padding:'5px 12px'}}>
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
              canMod&&{icon:'fi-sr-volume-mute',label:'Mute',color:'#f59e0b',onClick:()=>{socket?.emit('muteUser',{targetUserId:user._id||user.userId,roomId,minutes:30});onClose()}},
              canMod&&{icon:'fi-sr-user-slash',label:'Kick',color:'#ef4444',onClick:()=>{socket?.emit('kickUser',{targetUserId:user._id||user.userId,roomId});onClose()}},
              canBan&&{icon:'fi-sr-ban',label:'Ban',color:'#dc2626',onClick:doBan},
              isOwn&&{icon:'fi-sr-shield-check',label:'Set Rank',color:'#1a73e8',onClick:doRank},
                            myLevel>=2&&{icon:'fi-sr-user-block',label:'Block',color:'#6b7280',onClick:()=>{const uid=(user._id||user.userId)?.toString();if(!uid)return;fetch(`${_API}/api/users/block/${uid}`,{method:'POST',headers:{Authorization:`Bearer ${_tok}`}}).catch(()=>{});const cur=JSON.parse(localStorage.getItem('cgz_blocked_ids')||'[]');if(!cur.includes(uid)){localStorage.setItem('cgz_blocked_ids',JSON.stringify([...cur,uid]))};onClose()}},
              {icon:'fi-sr-flag',label:'Report',color:'#ef4444',onClick:()=>{onReport&&onReport({sender:user,content:'[User report]',_id:'user_'+(user._id||user.userId)});onClose()}},
            ].filter(Boolean).map((b,i)=>(
              <button key={i} onClick={b.onClick} style={{display:'flex',alignItems:'center',gap:4,padding:'7px 10px',background:dark?'#2a2d3e':'#f9fafb',border:`1.5px solid ${border}`,borderRadius:8,cursor:'pointer',fontSize:'0.78rem',fontWeight:600,color:b.color||txt,transition:'all .12s'}} onMouseEnter={e=>{e.currentTarget.style.background='#f0f7ff';e.currentTarget.style.borderColor=b.color||'#1a73e8'}} onMouseLeave={e=>{e.currentTarget.style.background=dark?'#2a2d3e':'#f9fafb';e.currentTarget.style.borderColor=border}}>
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
// MESSAGE — with reactions, reply preview, pinned indicator
// ─────────────────────────────────────────────────────────────
const QUICK_REACTIONS = ['❤️','😂','😮','😢','😡','👍']

// ─────────────────────────────────────────────────────────────
// REPORT REASONS
// ─────────────────────────────────────────────────────────────
const REPORT_REASONS = [
  { id:'social_media',  label:'Social Media Sharing',  icon:'📢', desc:'Sharing personal social media, phone numbers or links' },
  { id:'underage',      label:'Underage User',          icon:'🔞', desc:'User appears to be under 18 years old' },
  { id:'spamming',      label:'Spamming',               icon:'🚫', desc:'Repeatedly sending the same or similar messages' },
  { id:'abuse',         label:'Abuse / Harassment',     icon:'⚠️', desc:'Verbal abuse, threats or targeted harassment' },
  { id:'incest',        label:'Incest Content',         icon:'🚨', desc:'Content promoting or depicting incestuous material' },
  { id:'childporn',     label:'Child Pornography',      icon:'🚨', desc:'Sexual content involving minors' },
  { id:'pedophile',     label:'Pedophile Behaviour',    icon:'🚨', desc:'Grooming or inappropriate contact with minors' },
  { id:'other',         label:'Other Reason',           icon:'💬', desc:'Something else not listed above' },
]

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// ECHO MODAL — send a hidden wall message; only visible to sender & recipient
// No staff, mod, admin, superadmin, or owner can ever see echo messages
// ─────────────────────────────────────────────────────────────
function EchoModal({ targetUser, roomId, socket, dark, onClose }) {
  const [text, setText] = useState('')
  const [sent, setSent]  = useState(false)
  const bg   = dark ? '#1e2030' : '#fff'
  const txt  = dark ? '#e5e7eb' : '#111827'
  const muted= dark ? '#9ca3af' : '#6b7280'
  const border=dark ? '#374151' : '#e4e6ea'

  function send() {
    if (!text.trim() || text.length > 1000) return
    socket?.emit('sendEcho', { toUserId: targetUser._id || targetUser.userId, content: text.trim(), roomId })
    setSent(true)
    setTimeout(onClose, 1400)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(3px)'}}
      onClick={onClose}>
      <div style={{background:bg,borderRadius:16,padding:'22px 24px',width:360,maxWidth:'94vw',boxShadow:'0 20px 60px rgba(0,0,0,.35)',border:`1.5px solid #7c3aed`,position:'relative'}}
        onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <span style={{fontSize:20}}>👻</span>
          <div>
            <div style={{fontWeight:800,fontSize:'0.95rem',color:'#7c3aed'}}>Echo Message</div>
            <div style={{fontSize:'0.72rem',color:muted}}>
              Only <strong style={{color:'#7c3aed'}}>{targetUser.username}</strong> and you will see this
            </div>
          </div>
          <button onClick={onClose} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:muted,fontSize:18,lineHeight:1}}>×</button>
        </div>

        {/* Privacy notice */}
        <div style={{background:dark?'rgba(124,58,237,.15)':'#f5f3ff',border:'1px solid #7c3aed55',borderRadius:8,padding:'8px 12px',marginBottom:14,fontSize:'0.72rem',color:'#7c3aed',lineHeight:1.5}}>
          🔇 This echo is <strong>completely hidden</strong> from the wall. Staff, mods, admins — nobody can see it. It appears only in your chat as a ghost bubble.
        </div>

        {sent ? (
          <div style={{textAlign:'center',padding:'18px 0'}}>
            <div style={{fontSize:32,marginBottom:6}}>👻</div>
            <div style={{fontWeight:700,color:'#7c3aed',fontSize:'0.9rem'}}>Echo sent!</div>
            <div style={{fontSize:'0.75rem',color:muted,marginTop:4}}>Only {targetUser.username} can hear it…</div>
          </div>
        ) : (
          <>
            <textarea
              value={text}
              onChange={e=>setText(e.target.value)}
              maxLength={1000}
              placeholder={`Whisper something to ${targetUser.username}…`}
              autoFocus
              onKeyDown={e=>{if(e.key==='Enter'&&e.ctrlKey)send()}}
              style={{width:'100%',minHeight:90,borderRadius:9,border:`1.5px solid ${border}`,background:dark?'#111827':'#f9fafb',color:txt,padding:'10px 12px',fontSize:'0.85rem',resize:'vertical',outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}
            />
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4,marginBottom:12}}>
              <span style={{fontSize:'0.68rem',color:muted}}>{text.length}/1000 · Ctrl+Enter to send</span>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={onClose}
                style={{flex:1,padding:'9px',borderRadius:9,border:`1px solid ${border}`,background:'none',color:muted,fontWeight:600,cursor:'pointer',fontSize:'0.83rem'}}>
                Cancel
              </button>
              <button onClick={send} disabled={!text.trim()}
                style={{flex:2,padding:'9px',borderRadius:9,border:'none',background:text.trim()?'#7c3aed':'#c4b5fd',color:'#fff',fontWeight:700,cursor:text.trim()?'pointer':'default',fontSize:'0.85rem',transition:'background .15s'}}>
                👻 Send Echo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// REPORT MODAL  — appears when user clicks Report on a message
// ─────────────────────────────────────────────────────────────
function ReportModal({ msg, dark, onClose }) {
  const [selReason, setSelReason] = useState(null)
  const [details,   setDetails]   = useState('')
  const [sending,   setSending]   = useState(false)
  const [done,      setDone]      = useState(false)

  const bg     = dark?'#1e2030':'#fff'
  const border = dark?'#374151':'#e4e6ea'
  const txt    = dark?'#e5e7eb':'#111827'
  const muted  = dark?'#6b7280':'#9ca3af'
  const cardBg = dark?'#2a2d3e':'#f9fafb'

  async function submitReport() {
    if (!selReason) return
    setSending(true)
    try {
      const token = localStorage.getItem('cgz_token')
      const API   = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'
      const r = await fetch(`${API}/api/messages/${msg._id}/report`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          reason:      selReason.id,
          reasonLabel: selReason.label,
          details:     details.trim(),
        })
      })
      if (r.ok) { setDone(true); setTimeout(onClose, 2200) }
    } catch {}
    setSending(false)
  }

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:bg,borderRadius:18,maxWidth:420,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,.35)',overflow:'hidden'}}>

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#ef4444,#b91c1c)',padding:'16px 20px',display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:22}}>🚨</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:'1rem',color:'#fff'}}>Report Message</div>
            <div style={{fontSize:'0.75rem',color:'rgba(255,255,255,.8)'}}>Help keep the community safe</div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.2)',border:'none',borderRadius:'50%',width:28,height:28,cursor:'pointer',color:'#fff',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}><i className="fi fi-sr-cross-small"/></button>
        </div>

        <div style={{padding:'16px 20px'}}>
          {done ? (
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:48,marginBottom:10}}>✅</div>
              <p style={{fontWeight:800,fontSize:'1rem',color:txt,margin:'0 0 6px'}}>Report Submitted!</p>
              <p style={{fontSize:'0.82rem',color:muted}}>Our staff will review this shortly. Thank you for keeping the chat safe.</p>
            </div>
          ) : (
            <>
              {/* Message snapshot */}
              <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:10,padding:'10px 12px',marginBottom:14}}>
                <div style={{fontSize:'0.7rem',color:muted,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>Reported message</div>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
                  <img src={msg.sender?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:22,height:22,borderRadius:'50%',objectFit:'cover',flexShrink:0}} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
                  <span style={{fontWeight:700,fontSize:'0.8rem',color:txt}}>{msg.sender?.username}</span>
                </div>
                <p style={{margin:0,fontSize:'0.83rem',color:dark?'#d1d5db':'#374151',lineHeight:1.5,wordBreak:'break-word',maxHeight:60,overflow:'hidden',textOverflow:'ellipsis'}}>
                  {msg.content || '[Media message]'}
                </p>
              </div>

              {/* Reason selector */}
              <p style={{fontSize:'0.75rem',fontWeight:700,color:muted,margin:'0 0 8px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Select a reason</p>
              <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:12,maxHeight:260,overflowY:'auto'}}>
                {REPORT_REASONS.map(r=>(
                  <button key={r.id} onClick={()=>setSelReason(r)}
                    style={{textAlign:'left',padding:'9px 12px',borderRadius:10,border:`1.5px solid ${selReason?.id===r.id?'#ef4444':border}`,
                      background:selReason?.id===r.id?(dark?'#3b1515':'#fff5f5'):(dark?'#2a2d3e':'#f9fafb'),
                      cursor:'pointer',transition:'all .12s',display:'flex',alignItems:'center',gap:10}}
                    onMouseEnter={e=>{if(selReason?.id!==r.id){e.currentTarget.style.borderColor='#f87171';e.currentTarget.style.background=dark?'#2d1a1a':'#fff8f8'}}}
                    onMouseLeave={e=>{if(selReason?.id!==r.id){e.currentTarget.style.borderColor=border;e.currentTarget.style.background=dark?'#2a2d3e':'#f9fafb'}}}
                  >
                    <span style={{fontSize:18,flexShrink:0}}>{r.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:'0.83rem',color:selReason?.id===r.id?'#ef4444':txt}}>{r.label}</div>
                      <div style={{fontSize:'0.72rem',color:muted,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.desc}</div>
                    </div>
                    {selReason?.id===r.id&&<i className="fi fi-sr-check" style={{color:'#ef4444',fontSize:13,flexShrink:0}}/>}
                  </button>
                ))}
              </div>

              {/* Optional details */}
              <textarea
                placeholder="Additional details (optional)..."
                value={details} onChange={e=>setDetails(e.target.value)} maxLength={300}
                style={{width:'100%',padding:'8px 12px',background:cardBg,border:`1.5px solid ${border}`,borderRadius:9,color:txt,fontSize:'0.82rem',resize:'none',height:60,outline:'none',boxSizing:'border-box',fontFamily:'Nunito,sans-serif',lineHeight:1.5,marginBottom:12}}
                onFocus={e=>e.target.style.borderColor='#ef4444'} onBlur={e=>e.target.style.borderColor=border}
              />

              {/* Buttons */}
              <div style={{display:'flex',gap:8}}>
                <button onClick={onClose} style={{flex:1,padding:'9px',background:cardBg,border:`1px solid ${border}`,borderRadius:9,color:muted,fontWeight:600,cursor:'pointer',fontSize:'0.83rem'}}>Cancel</button>
                <button onClick={submitReport} disabled={!selReason||sending}
                  style={{flex:2,padding:'9px',background:selReason&&!sending?'linear-gradient(135deg,#ef4444,#b91c1c)':'#9ca3af',border:'none',borderRadius:9,color:'#fff',fontWeight:700,cursor:selReason&&!sending?'pointer':'not-allowed',fontSize:'0.83rem',transition:'all .15s'}}>
                  {sending?'Submitting…':'🚨 Submit Report'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// REPORT PANEL  — staff-only floating panel (mod, admin, superadmin, owner)
// ─────────────────────────────────────────────────────────────
const REASON_COLORS = {
  childporn:'#7f1d1d', pedophile:'#7f1d1d', incest:'#7c2d12',
  abuse:'#92400e', underage:'#78350f', spamming:'#1e3a5f',
  social_media:'#1e3a5f', other:'#374151',
}
const SEVERITY = { childporn:5, pedophile:5, incest:4, abuse:3, underage:4, spamming:1, social_media:1, other:1 }

function ReportPanel({ dark, myLevel, socket, onClose }) {
  const [reports,    setReports]    = useState([])
  const [filter,     setFilter]     = useState('pending')
  const [loading,    setLoading]    = useState(true)
  const [actTarget,  setActTarget]  = useState(null)   // { report, action }
  const [actReason,  setActReason]  = useState('')
  const [actDays,    setActDays]    = useState(1)
  const [actMins,    setActMins]    = useState(60)
  const [actLoading, setActLoading] = useState(false)

  const API   = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'
  const token = localStorage.getItem('cgz_token')
  const bg    = dark?'#1e2030':'#fff'
  const hdr   = dark?'#161824':'#f8f9fa'
  const border= dark?'#374151':'#e4e6ea'
  const txt   = dark?'#e5e7eb':'#111827'
  const muted = dark?'#6b7280':'#9ca3af'
  const card  = dark?'#2a2d3e':'#f9fafb'

  async function load() {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/admin/reports?status=${filter}`, { headers:{ Authorization:`Bearer ${token}` } })
      const d = await r.json()
      setReports(d.reports||[])
    } catch {}
    setLoading(false)
  }

  useEffect(()=>{ load() },[filter])

  async function dismiss(id) {
    await fetch(`${API}/api/admin/reports/${id}/dismiss`, { method:'PUT', headers:{ Authorization:`Bearer ${token}` } })
    setReports(p=>p.filter(r=>r._id!==id))
  }

  async function takeAction() {
    if (!actTarget) return
    setActLoading(true)
    try {
      const body = { action: actTarget.action, reason: actReason||'Action taken from report panel', days: actDays, minutes: actMins }
      const r = await fetch(`${API}/api/admin/reports/${actTarget.report._id}/action`, {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify(body)
      })
      const d = await r.json()
      if (d.success) { setReports(p=>p.filter(x=>x._id!==actTarget.report._id)); setActTarget(null); setActReason('') }
    } catch {}
    setActLoading(false)
  }

  const sorted = [...reports].sort((a,b)=>(SEVERITY[b.reason]||0)-(SEVERITY[a.reason]||0))

  return (
    <div style={{position:'fixed',top:0,right:0,bottom:0,width:420,zIndex:1500,background:bg,borderLeft:`2px solid ${border}`,display:'flex',flexDirection:'column',boxShadow:'-8px 0 32px rgba(0,0,0,.25)'}}>

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#ef4444,#b91c1c)',padding:'12px 16px',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <span style={{fontSize:20}}>🚨</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,color:'#fff',fontSize:'0.95rem'}}>Report Panel</div>
          <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,.8)'}}>Staff Only · Level {myLevel}+</div>
        </div>
        <div style={{background:'rgba(255,255,255,.2)',borderRadius:12,padding:'2px 8px',fontSize:'0.75rem',color:'#fff',fontWeight:700}}>{reports.length}</div>
        <button onClick={onClose} style={{background:'rgba(255,255,255,.2)',border:'none',borderRadius:'50%',width:28,height:28,cursor:'pointer',color:'#fff',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}><i className="fi fi-sr-cross-small"/></button>
      </div>

      {/* Filter tabs */}
      <div style={{display:'flex',borderBottom:`1px solid ${border}`,flexShrink:0,background:hdr}}>
        {['pending','resolved','dismissed','all'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{flex:1,padding:'8px 4px',border:'none',borderBottom:`2px solid ${filter===f?'#ef4444':'transparent'}`,background:'none',color:filter===f?'#ef4444':muted,fontSize:'0.74rem',fontWeight:filter===f?700:500,cursor:'pointer',textTransform:'capitalize',transition:'all .15s'}}>
            {f}
          </button>
        ))}
        <button onClick={load} title="Refresh" style={{padding:'8px 10px',border:'none',background:'none',cursor:'pointer',color:muted,fontSize:14}}>
          <i className="fi fi-sr-refresh"/>
        </button>
      </div>

      {/* Report list */}
      <div style={{flex:1,overflowY:'auto',padding:'8px'}}>
        {loading ? (
          <div style={{textAlign:'center',padding:'40px 0',color:muted,fontSize:'0.85rem'}}>Loading reports…</div>
        ) : sorted.length===0 ? (
          <div style={{textAlign:'center',padding:'40px 0'}}>
            <div style={{fontSize:36,marginBottom:8}}>✅</div>
            <p style={{color:muted,fontSize:'0.85rem',fontWeight:600}}>No {filter} reports</p>
          </div>
        ) : sorted.map(rep=>{
          const sev = SEVERITY[rep.reason]||1
          const sevColor = sev>=5?'#dc2626':sev>=4?'#f97316':sev>=3?'#f59e0b':'#6b7280'
          const rLabel = REPORT_REASONS.find(r=>r.id===rep.reason)?.label || rep.reasonLabel || rep.reason
          const rIcon  = REPORT_REASONS.find(r=>r.id===rep.reason)?.icon || '🚨'
          return (
            <div key={rep._id} style={{background:card,border:`1.5px solid ${sev>=4?sevColor:border}`,borderRadius:12,padding:'12px',marginBottom:8,position:'relative'}}>
              {/* Severity indicator */}
              {sev>=4&&<div style={{position:'absolute',top:8,right:8,background:sevColor,borderRadius:6,padding:'2px 7px',fontSize:'0.65rem',fontWeight:800,color:'#fff'}}>
                {sev>=5?'CRITICAL':'HIGH RISK'}
              </div>}

              {/* Reason badge */}
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <span style={{fontSize:16}}>{rIcon}</span>
                <span style={{fontWeight:800,fontSize:'0.82rem',color:sevColor}}>{rLabel}</span>
                <span style={{fontSize:'0.67rem',color:muted,marginLeft:'auto'}}>{new Date(rep.createdAt).toLocaleString()}</span>
              </div>

              {/* Message snapshot */}
              <div style={{background:dark?'#1e2030':'#fff',border:`1px solid ${border}`,borderRadius:8,padding:'8px 10px',marginBottom:8}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                  <img src={rep.reportedAvatar||rep.reported?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:20,height:20,borderRadius:'50%',objectFit:'cover',flexShrink:0}} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
                  <span style={{fontWeight:700,fontSize:'0.78rem',color:'#ef4444'}}>{rep.reportedUsername||rep.reported?.username||'Unknown'}</span>
                  <span style={{fontSize:'0.68rem',color:muted}}>({rep.reportedRank||rep.reported?.rank||'?'})</span>
                  {rep.roomName&&<span style={{fontSize:'0.65rem',color:'#1a73e8',marginLeft:'auto'}}>#{rep.roomName}</span>}
                </div>
                <p style={{margin:0,fontSize:'0.8rem',color:dark?'#d1d5db':'#374151',lineHeight:1.5,wordBreak:'break-word',maxHeight:64,overflow:'hidden',fontStyle:'italic'}}>
                  "{rep.messageContent || '[No content]'}"
                </p>
              </div>

              {/* Reporter info */}
              <div style={{fontSize:'0.7rem',color:muted,marginBottom:rep.details?6:8}}>
                🧑 Reported by <strong style={{color:txt}}>{rep.reporterUsername||rep.reporter?.username||'?'}</strong>
                {rep.status!=='pending'&&<span style={{marginLeft:8,color:rep.status==='resolved'?'#22c55e':'#9ca3af'}}>· {rep.status}</span>}
              </div>
              {rep.details&&<div style={{fontSize:'0.72rem',color:muted,marginBottom:8,fontStyle:'italic',padding:'4px 8px',background:dark?'#1e2030':'#fff',borderRadius:6,border:`1px solid ${border}`}}>
                📝 {rep.details}
              </div>}

              {/* Action buttons — only for pending reports */}
              {rep.status==='pending'&&(
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  <button onClick={()=>{setActTarget({report:rep,action:'kick'});setActReason('')}}
                    style={{flex:1,minWidth:70,padding:'6px 4px',background:dark?'#2a2d3e':'#fef3c7',border:'1px solid #f59e0b',borderRadius:7,color:'#92400e',fontWeight:700,cursor:'pointer',fontSize:'0.73rem',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                    <i className="fi fi-sr-user-slash" style={{fontSize:11}}/>Kick
                  </button>
                  <button onClick={()=>{setActTarget({report:rep,action:'mute'});setActReason('')}}
                    style={{flex:1,minWidth:70,padding:'6px 4px',background:dark?'#2a2d3e':'#fef9c3',border:'1px solid #ca8a04',borderRadius:7,color:'#713f12',fontWeight:700,cursor:'pointer',fontSize:'0.73rem',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                    <i className="fi fi-sr-volume-mute" style={{fontSize:11}}/>Mute
                  </button>
                  {myLevel>=12&&(
                    <button onClick={()=>{setActTarget({report:rep,action:'ban'});setActReason('')}}
                      style={{flex:1,minWidth:70,padding:'6px 4px',background:dark?'#2a2d3e':'#fee2e2',border:'1px solid #ef4444',borderRadius:7,color:'#991b1b',fontWeight:700,cursor:'pointer',fontSize:'0.73rem',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                      <i className="fi fi-sr-ban" style={{fontSize:11}}/>Ban
                    </button>
                  )}
                  <button onClick={()=>dismiss(rep._id)}
                    style={{flex:1,minWidth:70,padding:'6px 4px',background:dark?'#2a2d3e':'#f3f4f6',border:`1px solid ${border}`,borderRadius:7,color:muted,fontWeight:600,cursor:'pointer',fontSize:'0.73rem',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                    <i className="fi fi-sr-check" style={{fontSize:11}}/>Dismiss
                  </button>
                </div>
              )}
              {rep.status!=='pending'&&rep.actionTaken&&rep.actionTaken!=='none'&&(
                <div style={{fontSize:'0.7rem',padding:'4px 8px',background:dark?'#1e2030':'#f0fdf4',borderRadius:6,border:'1px solid #22c55e',color:'#15803d',fontWeight:600}}>
                  ✅ Action taken: {rep.actionTaken}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action confirmation modal */}
      {actTarget&&(
        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.65)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,zIndex:10}}>
          <div style={{background:bg,borderRadius:14,padding:'20px',width:'100%',maxWidth:340,boxShadow:'0 16px 40px rgba(0,0,0,.4)'}}>
            <div style={{fontWeight:800,fontSize:'0.95rem',color:txt,marginBottom:4}}>
              {actTarget.action==='kick'?'⚡ Kick':actTarget.action==='mute'?'🔇 Mute':'🚫 Ban'} User
            </div>
            <div style={{fontSize:'0.78rem',color:muted,marginBottom:14}}>
              {actTarget.action} <strong style={{color:'#ef4444'}}>{actTarget.report.reportedUsername||'this user'}</strong> for: <em>{REPORT_REASONS.find(r=>r.id===actTarget.report.reason)?.label||actTarget.report.reason}</em>
            </div>

            {actTarget.action==='mute'&&(
              <div style={{marginBottom:10}}>
                <label style={{fontSize:'0.73rem',color:muted,fontWeight:600}}>Mute duration</label>
                <select value={actMins} onChange={e=>setActMins(Number(e.target.value))}
                  style={{width:'100%',padding:'7px',background:card,border:`1px solid ${border}`,borderRadius:7,color:txt,fontSize:'0.82rem',marginTop:4,outline:'none'}}>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={360}>6 hours</option>
                  <option value={1440}>24 hours</option>
                  <option value={4320}>3 days</option>
                </select>
              </div>
            )}
            {actTarget.action==='ban'&&(
              <div style={{marginBottom:10}}>
                <label style={{fontSize:'0.73rem',color:muted,fontWeight:600}}>Ban duration</label>
                <select value={actDays} onChange={e=>setActDays(Number(e.target.value))}
                  style={{width:'100%',padding:'7px',background:card,border:`1px solid ${border}`,borderRadius:7,color:txt,fontSize:'0.82rem',marginTop:4,outline:'none'}}>
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={0}>Permanent</option>
                </select>
              </div>
            )}

            <div style={{marginBottom:14}}>
              <label style={{fontSize:'0.73rem',color:muted,fontWeight:600}}>Reason (shown to user)</label>
              <input value={actReason} onChange={e=>setActReason(e.target.value)} placeholder="e.g. Violating community guidelines..."
                style={{width:'100%',padding:'7px 10px',background:card,border:`1px solid ${border}`,borderRadius:7,color:txt,fontSize:'0.82rem',outline:'none',boxSizing:'border-box',marginTop:4,fontFamily:'Nunito,sans-serif'}}
                onFocus={e=>e.target.style.borderColor='#ef4444'} onBlur={e=>e.target.style.borderColor=border}
              />
            </div>

            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{setActTarget(null);setActReason('')}}
                style={{flex:1,padding:'9px',background:card,border:`1px solid ${border}`,borderRadius:8,color:muted,fontWeight:600,cursor:'pointer',fontSize:'0.83rem'}}>Cancel</button>
              <button onClick={takeAction} disabled={actLoading}
                style={{flex:2,padding:'9px',background:actLoading?'#9ca3af':'linear-gradient(135deg,#ef4444,#b91c1c)',border:'none',borderRadius:8,color:'#fff',fontWeight:700,cursor:actLoading?'not-allowed':'pointer',fontSize:'0.83rem'}}>
                {actLoading?'Processing…':`Confirm ${actTarget.action.charAt(0).toUpperCase()+actTarget.action.slice(1)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const FONT_COLORS = [
  { id:'fc1',  hex:'#ff3333', label:'Red' },
  { id:'fc2',  hex:'#ff6633', label:'Orange Red' },
  { id:'fc3',  hex:'#ff9933', label:'Orange' },
  { id:'fc4',  hex:'#ffcc33', label:'Yellow' },
  { id:'fc5',  hex:'#cccc00', label:'Olive' },
  { id:'fc6',  hex:'#99cc00', label:'Lime' },
  { id:'fc7',  hex:'#59b300', label:'Green' },
  { id:'fc8',  hex:'#008000', label:'Dark Green' },
  { id:'fc9',  hex:'#00e639', label:'Bright Green' },
  { id:'fc10', hex:'#00e6ac', label:'Teal Green' },
  { id:'fc11', hex:'#00cccc', label:'Cyan' },
  { id:'fc12', hex:'#03add8', label:'Sky Blue' },
  { id:'fc13', hex:'#3366ff', label:'Blue' },
  { id:'fc14', hex:'#004d99', label:'Dark Blue' },
  { id:'fc15', hex:'#6633ff', label:'Indigo' },
  { id:'fc16', hex:'#9933ff', label:'Purple' },
  { id:'fc17', hex:'#cc33ff', label:'Violet' },
  { id:'fc18', hex:'#ff33ff', label:'Magenta' },
  { id:'fc19', hex:'#ff33cc', label:'Hot Pink' },
  { id:'fc20', hex:'#ff3399', label:'Pink' },
  { id:'fc21', hex:'#ff3366', label:'Rose' },
  { id:'fc22', hex:'#604439', label:'Brown Dark' },
  { id:'fc23', hex:'#795548', label:'Brown' },
  { id:'fc24', hex:'#a97f70', label:'Brown Light' },
  { id:'fc25', hex:'#9E9E9E', label:'Grey' },
  { id:'fc26', hex:'#879fab', label:'Blue Grey' },
  { id:'fc27', hex:'#698796', label:'Steel' },
  { id:'fc28', hex:'#495f69', label:'Dark Steel' },
  { id:'fc29', hex:'#ffffff', label:'White' },
  { id:'fc30', hex:'#111827', label:'Black' },
  { id:'fc31', hex:'#107896', label:'Teal Blue' },
  { id:'fc32', hex:'#FF8800', label:'Amber' },
]

const FONT_STYLES = [
  { id:'',      label:'Default',       family:'Nunito,sans-serif' },
  { id:'fs1',   label:'Kalam',         family:"'Kalam', cursive" },
  { id:'fs2',   label:'Signika',       family:"'Signika', sans-serif" },
  { id:'fs3',   label:'Grandstander',  family:"'Grandstander', cursive" },
  { id:'fs4',   label:'Comic Neue',    family:"'Comic Neue', cursive" },
  { id:'fs5',   label:'Quicksand',     family:"'Quicksand', sans-serif" },
  { id:'fs6',   label:'Orbitron',      family:"'Orbitron', sans-serif" },
  { id:'fs7',   label:'Lemonada',      family:"'Lemonada', cursive" },
  { id:'fs8',   label:'Grenze Gotisch',family:"'Grenze Gotisch', cursive" },
  { id:'fs9',   label:'Merienda',      family:"'Merienda', cursive" },
  { id:'fs10',  label:'Amita',         family:"'Amita', cursive" },
  { id:'fs11',  label:'Turret Road',   family:"'Turret Road', cursive" },
  { id:'fs12',  label:'Sansita',       family:"'Sansita', sans-serif" },
  { id:'fs13',  label:'Comfortaa',     family:"'Comfortaa', cursive" },
  { id:'fs14',  label:'Lobster Two',   family:"'Lobster Two', cursive" },
]

// Map style id → google font import name
const GFONTS = {
  fs1:'Kalam', fs2:'Signika', fs3:'Grandstander', fs4:'Comic+Neue',
  fs5:'Quicksand', fs6:'Orbitron', fs7:'Lemonada', fs8:'Grenze+Gotisch',
  fs9:'Merienda', fs10:'Amita', fs11:'Turret+Road', fs12:'Sansita',
  fs13:'Comfortaa', fs14:'Lobster+Two',
}

function getFontFamily(styleId) {
  return FONT_STYLES.find(f=>f.id===styleId)?.family || 'Nunito,sans-serif'
}

// ─────────────────────────────────────────────────────────────
// FONT STYLE PICKER  (popup near typing bar)
// ─────────────────────────────────────────────────────────────
function FontStylePicker({ dark, isGuest, isBadgeUser, currentColor, currentStyle, currentSize, onSave, onClose }) {
  const [selColor, setSelColor] = useState(currentColor||'')
  const [selStyle, setSelStyle] = useState(currentStyle||'')
  const [selSize,  setSelSize]  = useState(currentSize||14)

  const bg     = dark?'#1e2030':'#fff'
  const border = dark?'#374151':'#e4e6ea'
  const txt    = dark?'#e5e7eb':'#111827'
  const muted  = dark?'#6b7280':'#9ca3af'

  function handleSave() {
    // Registered users: only save colour; style & size stay default
    // Badge users: save all three
    const styleToSave  = isBadgeUser ? selStyle : ''
    const sizeToSave   = isBadgeUser ? selSize  : 14
    onSave({ msgFontColor: selColor, msgFontStyle: styleToSave, msgFontSize: sizeToSave })
    onClose()
  }
  function handleReset() {
    setSelColor(''); setSelStyle(''); setSelSize(14)
    onSave({ msgFontColor: '', msgFontStyle: '', msgFontSize: 14 })
    onClose()
  }

  // ── GUEST: locked out entirely ─────────────────────────────
  if (isGuest) return (
    <div style={{position:'absolute',bottom:'110%',left:0,zIndex:999,background:bg,border:`1px solid ${border}`,borderRadius:12,padding:'16px',boxShadow:'0 8px 24px rgba(0,0,0,.18)',width:250}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:8}}>🔒</div>
        <p style={{fontSize:'0.88rem',fontWeight:800,color:txt,margin:'0 0 6px'}}>Registered Users Only</p>
        <p style={{fontSize:'0.78rem',color:muted,margin:0,lineHeight:1.5}}>Register or login to customise your chat font colour.</p>
      </div>
      <button onClick={onClose} style={{marginTop:14,width:'100%',padding:'8px',background:'#1a73e8',border:'none',borderRadius:8,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.83rem'}}>OK, Got It</button>
    </div>
  )

  // Preview text
  const previewStyle = {
    fontFamily: isBadgeUser ? getFontFamily(selStyle) : 'Nunito,sans-serif',
    fontSize:   (isBadgeUser ? selSize : 14)+'px',
    color:      selColor || (dark?'#e5e7eb':'#111827'),
    lineHeight: 1.5,
    wordBreak:  'break-word',
  }

  return (
    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:'110%',left:0,zIndex:999,background:bg,border:`1px solid ${border}`,borderRadius:14,padding:'14px 16px',boxShadow:'0 8px 32px rgba(0,0,0,.22)',width:300,maxHeight:'75vh',overflowY:'auto'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <span style={{fontWeight:800,fontSize:'0.9rem',color:txt}}>🎨 Font Colour{isBadgeUser?' & Style':''}</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:muted,fontSize:16,padding:'0 2px'}}><i className="fi fi-sr-cross-small"/></button>
      </div>

      {/* Permission badge */}
      {!isBadgeUser && (
        <div style={{background:dark?'#2a2d3e':'#f0f7ff',border:`1px solid ${dark?'#374151':'#bfdbfe'}`,borderRadius:8,padding:'6px 10px',marginBottom:10,fontSize:'0.74rem',color:dark?'#93c5fd':'#1d4ed8',display:'flex',alignItems:'center',gap:6}}>
          <i className="fi fi-sr-info" style={{fontSize:12,flexShrink:0}}/>
          <span>Colour only. Reach <strong>Butterfly</strong> rank or above to unlock font styles &amp; sizes.</span>
        </div>
      )}

      {/* Live preview */}
      <div style={{background:dark?'#2a2d3e':'#f9fafb',borderRadius:8,padding:'8px 12px',marginBottom:12,border:`1px solid ${border}`}}>
        <span style={previewStyle}>Hello! This is how your text will look.</span>
      </div>

      {/* ── COLOUR PALETTE ── (all users) */}
      <div style={{marginBottom:isBadgeUser?10:12}}>
        <p style={{fontSize:'0.73rem',fontWeight:700,color:muted,margin:'0 0 7px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Colour</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
          {/* Clear / default */}
          <button title="Default (no colour)" onClick={()=>setSelColor('')}
            style={{width:24,height:24,borderRadius:6,border:`2px solid ${selColor===''?'#1a73e8':border}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:muted,flexShrink:0,fontWeight:700}}
          >✕</button>
          {FONT_COLORS.map(c=>(
            <button key={c.id} title={c.label} onClick={()=>setSelColor(c.hex)}
              style={{width:24,height:24,borderRadius:6,border:`2px solid ${selColor===c.hex?'#1a73e8':border}`,background:c.hex,cursor:'pointer',flexShrink:0,transition:'transform .1s',boxShadow:selColor===c.hex?'0 0 0 3px rgba(26,115,232,.3)':'none'}}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.25)'}
              onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
            />
          ))}
        </div>
      </div>

      {/* ── FONT SIZE — badge users only ── */}
      {isBadgeUser && (
        <div style={{marginBottom:10}}>
          <p style={{fontSize:'0.73rem',fontWeight:700,color:muted,margin:'0 0 6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>
            Size: <span style={{color:'#1a73e8',fontWeight:800}}>{selSize}px</span>
            <span style={{fontSize:'0.65rem',color:'#f59e0b',marginLeft:6}}>⭐ Badge perk</span>
          </p>
          <input type="range" min={14} max={28} step={1} value={selSize} onChange={e=>setSelSize(Number(e.target.value))}
            style={{width:'100%',accentColor:'#1a73e8',cursor:'pointer'}}
          />
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.67rem',color:muted,marginTop:2}}>
            <span>14px</span><span>21px</span><span>28px</span>
          </div>
        </div>
      )}

      {/* ── FONT STYLE — badge users only ── */}
      {isBadgeUser && (
        <div style={{marginBottom:12}}>
          <p style={{fontSize:'0.73rem',fontWeight:700,color:muted,margin:'0 0 6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Font Style</p>
          <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:180,overflowY:'auto'}}>
            {FONT_STYLES.map(f=>(
              <button key={f.id} onClick={()=>setSelStyle(f.id)}
                style={{
                  textAlign:'left',padding:'6px 10px',borderRadius:8,
                  border:`1.5px solid ${selStyle===f.id?'#1a73e8':border}`,
                  background:selStyle===f.id?(dark?'#1e3a5f':'#e8f0fe'):(dark?'#2a2d3e':'#f9fafb'),
                  cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',
                  transition:'all .12s',
                }}
                onMouseEnter={e=>{if(selStyle!==f.id){e.currentTarget.style.borderColor='#1a73e8';e.currentTarget.style.background=dark?'#2a3550':'#f0f7ff'}}}
                onMouseLeave={e=>{if(selStyle!==f.id){e.currentTarget.style.borderColor=border;e.currentTarget.style.background=dark?'#2a2d3e':'#f9fafb'}}}
              >
                <span style={{fontFamily:f.family,fontSize:'0.88rem',color:txt}}>{f.label}</span>
                {selStyle===f.id&&<i className="fi fi-sr-check" style={{color:'#1a73e8',fontSize:12}}/>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{display:'flex',gap:8}}>
        <button onClick={handleReset} style={{flex:1,padding:'7px',background:dark?'#2a2d3e':'#f3f4f6',border:`1px solid ${border}`,borderRadius:8,color:muted,fontWeight:600,cursor:'pointer',fontSize:'0.8rem'}}>
          Reset
        </button>
        <button onClick={handleSave} style={{flex:2,padding:'7px',background:'linear-gradient(135deg,#1a73e8,#1464cc)',border:'none',borderRadius:8,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.8rem'}}>
          Apply
        </button>
      </div>
    </div>
  )
}

function Msg({msg,onMiniCard,onMention,myId,myLevel,socket,roomId,dark,onReply,replyUser,onReport,onEcho}) {
  const [showReact,setShowReact]=useState(false)
  const isSystem = msg.type==='system'
  const bg=dark?'rgba(255,255,255,.03)':'rgba(0,0,0,.02)'
  const mutedColor=dark?'#6b7280':'#9ca3af'

  if (isSystem) return (
    <div style={{textAlign:'center',padding:'3px 0'}}>
      <span style={{fontSize:'0.72rem',color:mutedColor,background:dark?'#2a2d3e':'#f3f4f6',padding:'2px 14px',borderRadius:20}}>{msg.content}</span>
    </div>
  )

  // ── ECHO BUBBLE — only visible to the two participants ──────
  if (msg.isEcho) {
    const isMineEcho = (msg.from?._id || msg.from) === myId
    const echoTs = new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
    const fromName = msg.from?.username || '?'
    const fromAvatar = msg.from?.avatar || '/default_images/avatar/default_guest.png'
    return (
      <div style={{display:'flex',gap:8,padding:'3px 12px',alignItems:'flex-start',opacity:0.88}}>
        <img src={fromAvatar} alt="" style={{width:26,height:26,borderRadius:'50%',objectFit:'cover',border:'1.5px solid #7c3aed',flexShrink:0,marginTop:2,filter:'grayscale(20%)'}} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
            <span style={{fontSize:'0.78rem',fontWeight:700,color:'#7c3aed'}}>{fromName}</span>
            <span style={{fontSize:'0.62rem',color:'#7c3aed',opacity:0.7,fontWeight:600,background:dark?'rgba(124,58,237,.15)':'#f5f3ff',padding:'0 5px',borderRadius:6}}>👻 echo</span>
            <span style={{fontSize:'0.62rem',color:mutedColor}}>{echoTs}</span>
          </div>
          <div style={{
            fontSize:'0.84rem',
            color:dark?'#c4b5fd':'#5b21b6',
            lineHeight:1.5,wordBreak:'break-word',
            background:dark?'rgba(124,58,237,.12)':'rgba(124,58,237,.06)',
            border:'1px dashed #7c3aed55',
            borderRadius:8,padding:'5px 10px',
            display:'inline-block',maxWidth:'85%',
            fontStyle:'italic'
          }}>
            {msg.content}
          </div>
        </div>
      </div>
    )
  }

  const ri=R(msg.sender?.rank), bdr=GBR(msg.sender?.gender,msg.sender?.rank)
  const col=msg.sender?.nameColor||ri.color
  const ts=new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  const isMine=(msg.sender?._id===myId||msg.sender?.userId===myId)
  const canDel=isMine||myLevel>=11
  const canPin=myLevel>=11

  // Render content — highlight @mentions and plain name mentions
  const renderContent=(text)=>{
    if(!text) return null
    return text.split(/(@\w+)/g).map((p,i)=>
      p.startsWith('@')
        ? <span key={i} style={{color:'#1a73e8',fontWeight:700,background:'#e8f0fe',padding:'0 3px',borderRadius:4}}>{p}</span>
        : p
    )
  }

  // Group reactions
  const reactionGroups = (msg.reactions||[]).reduce((acc,r)=>{ acc[r.emoji]=(acc[r.emoji]||[]); acc[r.emoji].push(r.user); return acc },{})

  return (
    <div style={{display:'flex',gap:8,padding:'3px 12px',alignItems:'flex-start',transition:'background .1s',position:'relative'}}
      onMouseEnter={e=>{e.currentTarget.style.background=bg;const btn=e.currentTarget.querySelector('.msg-actions');if(btn)btn.style.display='flex'}}
      onMouseLeave={e=>{e.currentTarget.style.background='transparent';setShowReact(false);const btn=e.currentTarget.querySelector('.msg-actions');if(btn)btn.style.display='none'}}
    >
      {msg.isPinned&&<span style={{position:'absolute',right:10,top:4,fontSize:10,color:'#f59e0b'}}>📌</span>}
      <img src={msg.sender?.avatar||'/default_images/avatar/default_guest.png'} alt=""
        onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();onMiniCard(msg.sender,{x:r.left,y:r.bottom+4})}}
        style={{width:30,height:30,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${bdr}`,flexShrink:0,cursor:'pointer',marginTop:2}}
        onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
      />
      <div style={{flex:1,minWidth:0}}>
        {/* Reply preview */}
        {msg.replyTo&&<div style={{background:dark?'#2a2d3e':'#f3f4f6',borderLeft:'3px solid #1a73e8',borderRadius:'0 6px 6px 0',padding:'3px 8px',marginBottom:4,fontSize:'0.72rem',color:mutedColor,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>↩ {msg.replyTo.sender?.username||'?'}: {msg.replyTo.content}</div>}
        <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
          <RIcon rank={msg.sender?.rank} size={11}/>
          <span onClick={()=>onMention(msg.sender?.username)} style={{fontSize:'0.82rem',fontWeight:700,color:col,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'} onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>
            {msg.sender?.username}
          </span>
          <span style={{fontSize:'0.65rem',color:mutedColor}}>{ts}</span>
        </div>
        <div style={{
          fontSize: (msg.sender?.msgFontSize||14)+'px',
          color: msg.sender?.msgFontColor || (dark?'#e5e7eb':'#111827'),
          fontFamily: getFontFamily(msg.sender?.msgFontStyle||''),
          lineHeight:1.5,wordBreak:'break-word',
        }}>
          {msg.type==='voice'   ?<VoiceBubble audioUrl={msg.audioUrl} duration={msg.duration} mine={false} dark={dark}/>
          :msg.type==='gift'    ?<span style={{padding:'4px 8px',display:'block'}}>🎁 {msg.content}</span>
          :msg.type==='youtube' ?<YoutubeBubble url={msg.content} dark={dark}/>
          :msg.type==='image'   ?<ImageBubble src={msg.content} caption={msg.imageCaption} dark={dark} hidden={userPrefs?.hideImagesInChat}/>
          :renderContent(msg.content)}
        </div>
        {/* Reactions row */}
        {Object.keys(reactionGroups).length>0&&(
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:4}}>
            {Object.entries(reactionGroups).map(([emoji,users])=>(
              <button key={emoji} onClick={()=>socket?.emit('reactMessage',{messageId:msg._id,emoji,roomId})}
                style={{display:'flex',alignItems:'center',gap:3,padding:'2px 7px',borderRadius:12,border:`1px solid ${dark?'#374151':'#e4e6ea'}`,background:users.includes(myId)?'#e8f0fe':dark?'#2a2d3e':'#f9fafb',cursor:'pointer',fontSize:'0.75rem',transition:'all .12s'}}>
                <span>{emoji}</span><span style={{color:dark?'#9ca3af':'#6b7280',fontWeight:600}}>{users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons on hover */}
      <div className="msg-actions" style={{display:'none',position:'absolute',right:8,top:0,gap:2,background:dark?'#1e2030':'#fff',border:`1px solid ${dark?'#374151':'#e4e6ea'}`,borderRadius:8,padding:'2px 4px',boxShadow:'0 2px 8px rgba(0,0,0,.1)',alignItems:'center'}}>
        {QUICK_REACTIONS.map(e=>(
          <button key={e} onClick={()=>socket?.emit('reactMessage',{messageId:msg._id,emoji:e,roomId})} style={{background:'none',border:'none',cursor:'pointer',fontSize:14,padding:'1px 2px',borderRadius:4,transition:'transform .1s'}} onMouseEnter={ev=>ev.currentTarget.style.transform='scale(1.3)'} onMouseLeave={ev=>ev.currentTarget.style.transform='scale(1)'}>{e}</button>
        ))}
        <div style={{width:1,background:dark?'#374151':'#e4e6ea',height:16,margin:'0 2px'}}/>
        <button title="Reply" onClick={()=>onReply&&onReply(msg)} style={{background:'none',border:'none',cursor:'pointer',color:'#6b7280',fontSize:12,padding:'1px 4px'}}><i className="fi fi-sr-reply"/></button>
        {canPin&&<button title="Pin" onClick={()=>socket?.emit('pinMessage',{messageId:msg._id,roomId})} style={{background:'none',border:'none',cursor:'pointer',color:'#f59e0b',fontSize:12,padding:'1px 4px'}}><i className="fi fi-sr-thumbtack"/></button>}
        {canDel&&<button title="Delete" onClick={()=>socket?.emit('deleteMessage',{messageId:msg._id,roomId})} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:12,padding:'1px 4px'}}><i className="fi fi-sr-trash"/></button>}
        {!isMine&&<button title="Echo — send a hidden ghost message" onClick={e=>{e.stopPropagation();onEcho&&onEcho(msg.sender)}} style={{background:'none',border:'none',cursor:'pointer',color:'#7c3aed',fontSize:12,padding:'1px 4px'}} onMouseEnter={e=>e.currentTarget.style.color='#5b21b6'} onMouseLeave={e=>e.currentTarget.style.color='#7c3aed'}>👻</button>}
        {!isMine&&<button title="Report message" onClick={e=>{e.stopPropagation();onReport&&onReport(msg)}} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:12,padding:'1px 4px'}} onMouseEnter={e=>e.currentTarget.style.color='#b91c1c'} onMouseLeave={e=>e.currentTarget.style.color='#ef4444'}><i className="fi fi-sr-flag"/></button>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// YOUTUBE BUBBLE — embeds a YouTube video inline
// ─────────────────────────────────────────────────────────────
function YoutubeBubble({url,dark}) {
  const [show,setShow] = useState(false)
  const border = dark?'#374151':'#e4e6ea'
  // Extract YouTube video ID
  function getYtId(u) {
    if(!u) return null
    const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    return m?.[1]||null
  }
  const ytId = getYtId(url)
  if(!ytId) return <a href={url} target="_blank" rel="noopener noreferrer" style={{color:'#1a73e8',fontSize:'0.875rem',wordBreak:'break-all'}}>{url}</a>

  const thumb = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`

  if(show) return (
    <div style={{maxWidth:280,borderRadius:10,overflow:'hidden',border:`1px solid ${border}`}}>
      <iframe
        src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
        width="280" height="158"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen style={{display:'block',border:'none'}}
      />
    </div>
  )

  return (
    <div style={{maxWidth:280,borderRadius:10,overflow:'hidden',border:`1px solid ${border}`,cursor:'pointer',position:'relative'}}
      onClick={()=>setShow(true)}>
      <img src={thumb} alt="YouTube video" style={{width:'100%',display:'block'}}
        onError={e=>{e.target.src='';e.target.style.display='none'}}/>
      {/* Play button overlay */}
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.35)'}}>
        <div style={{width:44,height:44,borderRadius:'50%',background:'#ff0000',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 12px rgba(0,0,0,.5)'}}>
          <span style={{fontSize:18,marginLeft:3,color:'#fff'}}>▶</span>
        </div>
      </div>
      <div style={{padding:'6px 10px',background:dark?'#1e2030':'#f9fafb',borderTop:`1px solid ${border}`}}>
        <div style={{fontSize:'0.72rem',fontWeight:700,color:dark?'#e5e7eb':'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          📺 YouTube Video
        </div>
        <div style={{fontSize:'0.64rem',color:dark?'#6b7280':'#9ca3af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{url}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// YOUTUBE INPUT MODAL — paste a link and send
// ─────────────────────────────────────────────────────────────
function YoutubeModal({onSend,onClose,dark}) {
  const [url,setUrl] = useState('')
  const [err,setErr] = useState('')
  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea', txt=dark?'#e5e7eb':'#111827'

  function submit(e) {
    e.preventDefault()
    const u = url.trim()
    if(!/youtube\.com\/watch|youtu\.be\//.test(u)){ setErr('Please enter a valid YouTube URL'); return }
    onSend(u)
    onClose()
  }
  return (
    <div style={{position:'absolute',bottom:'calc(100% + 8px)',left:0,right:0,background:bg,border:`1px solid ${border}`,borderRadius:12,padding:14,boxShadow:'0 -4px 20px rgba(0,0,0,.15)',zIndex:200}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <span style={{fontWeight:800,fontSize:'0.85rem',color:txt}}>📺 Send YouTube Video</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:16}}>×</button>
      </div>
      <form onSubmit={submit}>
        <input value={url} onChange={e=>{setUrl(e.target.value);setErr('')}}
          placeholder="https://youtube.com/watch?v=..."
          style={{width:'100%',padding:'8px 12px',border:`1.5px solid ${err?'#ef4444':border}`,borderRadius:8,fontSize:'0.83rem',outline:'none',color:txt,background:dark?'#2a2d3e':'#f9fafb',boxSizing:'border-box',marginBottom:6,fontFamily:'Nunito,sans-serif'}}
          onFocus={e=>e.target.style.borderColor='#ff0000'} onBlur={e=>e.target.style.borderColor=err?'#ef4444':border}
        />
        {err && <div style={{color:'#ef4444',fontSize:'0.73rem',marginBottom:6}}>{err}</div>}
        <button type="submit" disabled={!url.trim()}
          style={{width:'100%',padding:'9px',borderRadius:8,border:'none',background:url.trim()?'#ff0000':'#f3f4f6',color:url.trim()?'#fff':'#9ca3af',fontWeight:700,cursor:url.trim()?'pointer':'not-allowed',fontSize:'0.85rem',fontFamily:'Outfit,sans-serif'}}>
          Send Video
        </button>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ATTACH MENU — + button expands to: Font, Mic, Voice, Photo, YouTube
// ─────────────────────────────────────────────────────────────
function AttachMenu({open,onToggle,dark,onFont,onMic,onVoice,onPhoto,onYoutube,connected,msgFontColor}) {
  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea'
  const items = [
    { icon:'fi-sr-bold',       label:'Font & Color',  color:'#7c3aed', onClick:onFont   },
    { icon:'fi-sr-microphone', label:'Record Mic',    color:'#ef4444', onClick:onMic    },
    { icon:'fi-sr-record-vinyl',label:'Voice Note',   color:'#f59e0b', onClick:onVoice  },
    { icon:'fi-sr-picture',    label:'Send Photo',    color:'#10b981', onClick:onPhoto  },
    { icon:'fi-rr-youtube',    label:'YouTube Video', color:'#ff0000', onClick:onYoutube},
  ]
  return (
    <div style={{position:'relative',flexShrink:0}}>
      {/* Expanded items */}
      {open && (
        <div style={{position:'absolute',bottom:'calc(100% + 6px)',left:0,background:bg,border:`1px solid ${border}`,borderRadius:12,padding:'6px 4px',boxShadow:'0 -4px 20px rgba(0,0,0,.14)',display:'flex',flexDirection:'column',gap:2,zIndex:199,minWidth:160}}>
          {items.map((item,i)=>(
            <button key={i} onClick={()=>{item.onClick();onToggle()}}
              style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'none',border:'none',cursor:'pointer',borderRadius:8,width:'100%',textAlign:'left',transition:'background .1s'}}
              onMouseEnter={e=>e.currentTarget.style.background=dark?'#2a2d3e':'#f3f4f6'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}>
              <div style={{width:28,height:28,borderRadius:'50%',background:item.color+'18',border:`1.5px solid ${item.color}44`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <i className={`fi ${item.icon}`} style={{color:item.color,fontSize:13}}/>
              </div>
              <span style={{fontSize:'0.8rem',fontWeight:600,color:dark?'#e5e7eb':'#374151'}}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
      {/* + Button */}
      <button type="button" onClick={onToggle} disabled={!connected}
        style={{width:32,height:32,borderRadius:'50%',border:`1.5px solid ${open?'#1a73e8':dark?'#374151':'#d1d5db'}`,background:open?'#1a73e8':dark?'#2a2d3e':'#f9fafb',color:open?'#fff':dark?'#9ca3af':'#6b7280',cursor:connected?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,transition:'all .2s',flexShrink:0}}>
        <span style={{transition:'transform .2s',display:'block',transform:open?'rotate(45deg)':'none',lineHeight:1}}>+</span>
        {msgFontColor&&!open&&<span style={{position:'absolute',bottom:2,right:2,width:6,height:6,borderRadius:'50%',background:msgFontColor,border:'1px solid #fff',pointerEvents:'none'}}/>}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// INLINE MIC RECORDER — holds the stream open, shows waveform
// Used in both chat and DM input bar
// ─────────────────────────────────────────────────────────────
function InlineMicRecorder({onSend,onCancel,dark}) {
  const [state,setState] = useState('idle') // idle | recording | preview | uploading
  const [secs,setSecs]   = useState(0)
  const [audioUrl,setAudioUrl] = useState(null)
  const [waveform,setWaveform] = useState([])
  const mediaRef  = useRef(null)
  const chunksRef = useRef([])
  const blobRef   = useRef(null)
  const timerRef  = useRef(null)
  const animRef   = useRef(null)
  const analyserRef = useRef(null)
  const dataRef   = useRef(null)
  const bg=dark?'#2a2d3e':'#f0fdf4'

  function startRec() {
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
      // Set up analyser for waveform
      const ctx = new (window.AudioContext||window.webkitAudioContext)()
      const src = ctx.createMediaStreamSource(stream)
      const an  = ctx.createAnalyser()
      an.fftSize = 64
      src.connect(an)
      analyserRef.current = an
      dataRef.current = new Uint8Array(an.frequencyBinCount)

      const mr = new MediaRecorder(stream, {mimeType:'audio/webm'})
      mediaRef.current = mr; chunksRef.current = []
      mr.ondataavailable = e => { if(e.data.size>0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach(t=>t.stop())
        cancelAnimationFrame(animRef.current)
        clearInterval(timerRef.current)
        const blob = new Blob(chunksRef.current,{type:'audio/webm'})
        blobRef.current = blob
        setAudioUrl(URL.createObjectURL(blob))
        setState('preview')
      }
      mr.start()
      setState('recording')
      setSecs(0)
      timerRef.current = setInterval(()=>setSecs(p=>{if(p>=120){mr.stop();return p};return p+1}),1000)

      // Animate waveform
      function drawWave() {
        animRef.current = requestAnimationFrame(drawWave)
        an.getByteFrequencyData(dataRef.current)
        const bars = Array.from(dataRef.current).slice(0,12).map(v=>Math.max(4,v/4))
        setWaveform(bars)
      }
      drawWave()
    }).catch(()=>alert('Microphone access denied'))
  }

  function stopRec() {
    clearInterval(timerRef.current)
    mediaRef.current?.stop()
  }

  async function sendRec() {
    if(!blobRef.current) return
    setState('uploading')
    try {
      const token = localStorage.getItem('cgz_token')
      const fd = new FormData()
      fd.append('audio', blobRef.current, `voice_${Date.now()}.webm`)
      const r = await fetch(`${API}/api/upload/voice`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd})
      const d = await r.json()
      if(d.url) onSend(d.url, secs)
      else throw new Error(d.error||'Upload failed')
    } catch(e) { setState('preview'); alert('Upload failed: '+e.message) }
  }

  function discard() { blobRef.current=null; setAudioUrl(null); setState('idle'); onCancel() }
  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  return (
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',background:bg,borderRadius:20,border:`1.5px solid ${dark?'#374151':'#bbf7d0'}`,width:'100%'}}>
      {state==='idle' && (
        <>
          <button onClick={startRec}
            style={{width:30,height:30,borderRadius:'50%',border:'none',background:'#22c55e',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>
            <i className="fi fi-sr-microphone"/>
          </button>
          <span style={{fontSize:'0.78rem',color:dark?'#9ca3af':'#6b7280',flex:1}}>Tap to start recording</span>
          <button onClick={onCancel} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:14,flexShrink:0}}><i className="fi fi-sr-cross-small"/></button>
        </>
      )}
      {state==='recording' && (
        <>
          <div style={{width:8,height:8,borderRadius:'50%',background:'#ef4444',animation:'pulse 1s ease infinite',flexShrink:0}}/>
          {/* Live waveform bars */}
          <div style={{display:'flex',alignItems:'center',gap:2,flex:1,height:24}}>
            {waveform.map((h,i)=>(
              <div key={i} style={{width:3,height:h+'px',background:'#22c55e',borderRadius:2,transition:'height .05s'}}/>
            ))}
          </div>
          <span style={{fontSize:'0.78rem',fontWeight:700,color:'#ef4444',flexShrink:0}}>{fmt(secs)}</span>
          <button onClick={stopRec} style={{width:28,height:28,borderRadius:'50%',border:'none',background:'#374151',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0}}>
            <i className="fi fi-sr-square"/>
          </button>
        </>
      )}
      {state==='preview' && audioUrl && (
        <>
          <audio src={audioUrl} controls style={{height:28,flex:1,minWidth:0}}/>
          <span style={{fontSize:'0.7rem',color:'#9ca3af',flexShrink:0}}>{fmt(secs)}</span>
          <button onClick={sendRec}
            style={{width:28,height:28,borderRadius:'50%',border:'none',background:'#1a73e8',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>
            <i className="fi fi-sr-paper-plane"/>
          </button>
          <button onClick={discard} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:14,flexShrink:0}}><i className="fi fi-sr-trash"/></button>
        </>
      )}
      {state==='uploading' && <span style={{fontSize:'0.78rem',color:'#9ca3af',flex:1}}>Uploading…</span>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// IMAGE BUBBLE — mountain-placeholder, click-to-reveal
// Synced with hideImagesInChat user preference
// ─────────────────────────────────────────────────────────────
function ImageBubble({src,caption,dark,hidden}) {
  const [revealed,setRevealed] = useState(false)
  const [loaded,setLoaded] = useState(false)
  const [errored,setErrored] = useState(false)
  const border = dark?'#374151':'#e4e6ea'
  const muted  = dark?'#6b7280':'#9ca3af'
  const plateBg= dark?'#2a2d3e':'#d1d5db'
  const mountA = dark?'#374151':'#6b7280'
  const mountB = dark?'#4b5563':'#9ca3af'

  if (hidden && !revealed) return (
    <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 12px',background:dark?'#2a2d3e':'#f3f4f6',borderRadius:10,border:`1px solid ${border}`,cursor:'pointer',maxWidth:220}}
      onClick={()=>setRevealed(true)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <span style={{fontSize:'0.78rem',color:muted,fontWeight:600}}>Image hidden — tap to show</span>
    </div>
  )
  if (errored) return (
    <div style={{padding:'6px 10px',background:dark?'#2a2d3e':'#f3f4f6',borderRadius:8,fontSize:'0.75rem',color:muted}}>
      ⚠️ Image unavailable
    </div>
  )

  return (
    <div style={{display:'inline-block',maxWidth:260,position:'relative'}}>
      {!revealed ? (
        // ── Mountain placeholder (matches screenshot style) ──
        <div onClick={()=>setRevealed(true)} style={{
          width:220,height:140,borderRadius:12,cursor:'pointer',
          background:dark?'linear-gradient(160deg,#3d2a1a,#1e2030)':'linear-gradient(160deg,#c77b4a,#e8956a)',
          border:`1px solid ${border}`,
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          overflow:'hidden',position:'relative',userSelect:'none',
          transition:'filter .15s',
        }}
        onMouseEnter={e=>e.currentTarget.style.filter='brightness(0.88)'}
        onMouseLeave={e=>e.currentTarget.style.filter='none'}>
          {/* Moon */}
          <div style={{position:'absolute',top:14,left:18,width:36,height:36,borderRadius:'50%',background:dark?'#1e2030':'#1a0a00',opacity:0.55}}/>
          {/* Mountains SVG */}
          <svg width="180" height="90" viewBox="0 0 180 90" style={{position:'absolute',bottom:0}}>
            <polygon points="0,90 60,20 120,90" fill={mountA}/>
            <polygon points="70,90 130,28 180,90" fill={mountB}/>
            <polygon points="0,90 40,55 80,90" fill={dark?'#1e2030':'#8b3d1a'} opacity="0.7"/>
          </svg>
          {/* Label */}
          <span style={{
            fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1.1rem',
            color:dark?'#c2410c':'#7f1d1d',letterSpacing:'0.12em',
            position:'relative',zIndex:1,textShadow:'0 1px 3px rgba(0,0,0,.3)',
            marginTop:16,
          }}>IMAGE</span>
          <span style={{fontSize:'0.65rem',color:dark?'#9ca3af':'rgba(127,29,29,.7)',marginTop:4,position:'relative',zIndex:1}}>
            Click to load
          </span>
        </div>
      ) : (
        // ── Revealed image ──
        <div style={{position:'relative'}}>
          {!loaded && !errored && (
            <div style={{width:220,height:140,display:'flex',alignItems:'center',justifyContent:'center',background:dark?'#2a2d3e':'#f3f4f6',borderRadius:12,border:`1px solid ${border}`}}>
              <div style={{width:22,height:22,border:'3px solid #e4e6ea',borderTop:'3px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
            </div>
          )}
          <img src={src} alt={caption||'image'}
            style={{maxWidth:'100%',borderRadius:12,display:'block',cursor:'pointer',border:`1px solid ${border}`,opacity:loaded?1:0,transition:'opacity .3s',minHeight:loaded?'auto':140}}
            onLoad={()=>setLoaded(true)}
            onError={()=>setErrored(true)}
            onClick={()=>window.open(src,'_blank')}
          />
          {loaded && (
            <button onClick={()=>{setRevealed(false);setLoaded(false)}}
              style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,.55)',border:'none',color:'#fff',borderRadius:'50%',width:22,height:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,lineHeight:1}}>×</button>
          )}
        </div>
      )}
      {caption && <p style={{margin:'4px 0 0',fontSize:'0.78rem',color:dark?'#d1d5db':'#374151',lineHeight:1.5,wordBreak:'break-word'}}>{caption}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PINNED MESSAGE BANNER
// ─────────────────────────────────────────────────────────────
function PinnedBanner({msg,dark,onJump}) {
  if (!msg) return null
  return (
    <div style={{background:dark?'#2a2d3e':'#fffbeb',borderBottom:`1px solid ${dark?'#374151':'#fde68a'}`,padding:'5px 14px',display:'flex',alignItems:'center',gap:8,cursor:'pointer',flexShrink:0}} onClick={onJump}>
      <span style={{fontSize:12,color:'#f59e0b'}}>📌</span>
      <span style={{fontSize:'0.75rem',fontWeight:700,color:'#f59e0b',flexShrink:0}}>Pinned:</span>
      <span style={{fontSize:'0.75rem',color:dark?'#9ca3af':'#6b7280',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{msg.sender?.username}: {msg.content}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MESSAGE SEARCH BAR
// ─────────────────────────────────────────────────────────────
function SearchBar({messages,dark,onJump,onClose}) {
  const [q,setQ]=useState('')
  const results=useMemo(()=>q.trim().length>1?messages.filter(m=>m.type!=='system'&&m.content?.toLowerCase().includes(q.toLowerCase())):[],[q,messages])
  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea', txt=dark?'#e5e7eb':'#111827'
  return (
    <div style={{position:'absolute',top:0,left:0,right:0,background:bg,border:`1px solid ${border}`,borderRadius:'0 0 12px 12px',zIndex:50,padding:'8px 12px',boxShadow:'0 4px 16px rgba(0,0,0,.12)'}}>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:q.trim().length>1?8:0}}>
        <i className="fi fi-sr-search" style={{color:'#9ca3af',fontSize:14}}/>
        <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search messages..."
          style={{flex:1,border:'none',outline:'none',background:'transparent',fontSize:'0.875rem',color:txt,fontFamily:'Nunito,sans-serif'}}
        />
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      {results.length>0&&(
        <div style={{maxHeight:180,overflowY:'auto'}}>
          {results.map((m,i)=>(
            <div key={m._id||i} onClick={()=>{onJump(m._id);onClose()}} style={{padding:'5px 8px',borderRadius:7,cursor:'pointer',fontSize:'0.8rem',color:dark?'#9ca3af':'#374151',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background=dark?'#2a2d3e':'#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <span style={{fontWeight:700,color:txt}}>{m.sender?.username}: </span>{m.content}
            </div>
          ))}
        </div>
      )}
      {q.trim().length>1&&results.length===0&&<div style={{fontSize:'0.78rem',color:'#9ca3af',padding:'4px 0'}}>No results found</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// USER ITEM in sidebar
// ─────────────────────────────────────────────────────────────
function UserItem({u,onClick,dark}) {
  const ri=R(u.rank), col=u.nameColor||ri.color
  const hoverBg=dark?'#2a2d3e':'#f3f4f6'
  const statusColor = STATUS_DOT[u.status] || STATUS_DOT.online
  const isMutedActive = u.isMuted && (!u.muteExpiry || new Date(u.muteExpiry) > new Date())
  return (
    <div onClick={()=>onClick(u)} style={{display:'flex',alignItems:'center',gap:7,padding:'5px 10px 5px 8px',cursor:'pointer',transition:'background .12s',borderRadius:6,margin:'1px 4px'}} onMouseEnter={e=>e.currentTarget.style.background=hoverBg} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <div style={{position:'relative',flexShrink:0}}>
        <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:32,height:32,borderRadius:'50%',objectFit:'cover',border:`2px solid ${GBR(u.gender,u.rank)}`,display:'block',boxShadow:`0 0 0 1px ${dark?'#1e2030':'#fff'}`}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        <span style={{position:'absolute',bottom:-1,right:-1,width:9,height:9,background:statusColor,borderRadius:'50%',border:`2px solid ${dark?'#1e2030':'#fff'}`,display:'block'}}/>
        {isMutedActive&&<span title="Muted" style={{position:'absolute',top:-2,left:-2,width:11,height:11,background:'#ef4444',borderRadius:'50%',border:`1.5px solid ${dark?'#1e2030':'#fff'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:6,color:'#fff',lineHeight:1}}>🔇</span>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:3}}>
          <RIcon rank={u.rank} size={11}/>
          <span style={{fontSize:'0.81rem',fontWeight:700,color:col,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username}</span>
          {u.isGuest&&<span style={{fontSize:'0.55rem',background:dark?'#374151':'#f3f4f6',color:'#9ca3af',borderRadius:3,padding:'1px 3px',fontWeight:600,flexShrink:0}}>G</span>}
        </div>
        {u.mood&&<div style={{fontSize:'0.64rem',color:dark?'#6b7280':'#9ca3af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:1}}>{moodEmoji(u.mood)} {u.mood}</div>}
      </div>
      {u.countryCode&&u.countryCode!=='ZZ'&&(
        <img src={`/icons/flags/${u.countryCode.toLowerCase()}.png`} alt="" style={{width:18,height:12,flexShrink:0,borderRadius:2,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FRIENDS LIST PANEL — online friends, requests, remove
// ─────────────────────────────────────────────────────────────
function FriendsList({me,onUserClick,dark}) {
  const [friends,setFriends] = useState([])
  const [requests,setRequests] = useState([])
  const [load,setLoad] = useState(true)
  const [tab,setTab] = useState('online')
  const token = localStorage.getItem('cgz_token')
  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea', muted=dark?'#9ca3af':'#6b7280'
  const txt=dark?'#e5e7eb':'#111827'

  function loadFriends() {
    if(!token) return
    setLoad(true)
    fetch(`${API}/api/users/me/friends`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json())
      .then(d=>{setFriends(d.friends||[]);setRequests(d.requests||[])})
      .catch(()=>{}).finally(()=>setLoad(false))
  }
  useEffect(()=>{ loadFriends() },[])

  function acceptReq(fromId) {
    fetch(`${API}/api/users/friend/${fromId}/accept`,{method:'POST',headers:{Authorization:`Bearer ${token}`}})
      .then(()=>loadFriends()).catch(()=>{})
  }
  function declineReq(fromId) {
    fetch(`${API}/api/users/friend/${fromId}/decline`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}})
      .then(()=>loadFriends()).catch(()=>{})
  }
  function removeFriend(fid) {
    fetch(`${API}/api/users/friend/${fid}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}})
      .then(()=>loadFriends()).catch(()=>{})
  }

  const online  = friends.filter(f=>f.isOnline)
  const offline = friends.filter(f=>!f.isOnline)
  const list    = tab==='online'?online:tab==='offline'?offline:friends

  if(load) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:20,height:20,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
    </div>
  )

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Sub-tabs */}
      <div style={{display:'flex',borderBottom:`1px solid ${border}`,flexShrink:0,gap:0}}>
        {[
          {id:'online', label:`🟢 ${online.length}`},
          {id:'all',    label:`👥 ${friends.length}`},
          {id:'offline',label:'⚫ Offline'},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:'6px 2px',border:'none',background:'none',cursor:'pointer',
              fontSize:'0.67rem',fontWeight:700,
              color:tab===t.id?'#1a73e8':muted,
              borderBottom:`2px solid ${tab===t.id?'#1a73e8':'transparent'}`,
              transition:'all .12s'}}>
            {t.label}
          </button>
        ))}
        <button onClick={loadFriends} title="Refresh"
          style={{background:'none',border:'none',cursor:'pointer',color:muted,padding:'0 8px',fontSize:13,borderBottom:'2px solid transparent'}}>
          ↻
        </button>
      </div>

      {/* Pending requests */}
      {requests.length>0 && (
        <div style={{padding:'6px 8px',background:dark?'rgba(26,115,232,.1)':'#eff6ff',borderBottom:`1px solid ${border}`,flexShrink:0}}>
          <div style={{fontSize:'0.63rem',fontWeight:800,color:'#1a73e8',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>
            {requests.length} Request{requests.length>1?'s':''}
          </div>
          {requests.slice(0,3).map(r=>{
            const fromId = r.from?._id || r.from
            return (
              <div key={fromId} style={{display:'flex',alignItems:'center',gap:5,marginBottom:4}}>
                <img src={r.from?.avatar||'/default_images/avatar/default_guest.png'} alt=""
                  style={{width:24,height:24,borderRadius:'50%',objectFit:'cover',flexShrink:0}}
                  onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
                <span style={{flex:1,fontSize:'0.72rem',fontWeight:600,color:txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {r.from?.username||'?'}
                </span>
                <button onClick={()=>acceptReq(fromId)}
                  style={{padding:'2px 7px',borderRadius:5,border:'none',background:'#22c55e',color:'#fff',fontSize:'0.62rem',fontWeight:700,cursor:'pointer'}}>
                  ✓
                </button>
                <button onClick={()=>declineReq(fromId)}
                  style={{padding:'2px 7px',borderRadius:5,border:'none',background:'#ef4444',color:'#fff',fontSize:'0.62rem',fontWeight:700,cursor:'pointer'}}>
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Friends list */}
      <div style={{flex:1,overflowY:'auto'}}>
        {list.length===0 ? (
          <div style={{textAlign:'center',padding:'20px 12px'}}>
            <div style={{fontSize:28,marginBottom:8}}>👥</div>
            <div style={{fontSize:'0.78rem',color:muted,lineHeight:1.4}}>
              {tab==='online'?'No friends online right now':'No friends yet — add some!'}
            </div>
          </div>
        ) : list.map(f=>{
          const statusColor = STATUS_DOT[f.status] || STATUS_DOT.online
          const ri = R(f.rank)
          return (
            <div key={f._id}
              style={{display:'flex',alignItems:'center',gap:7,padding:'6px 8px 6px 10px',cursor:'pointer',transition:'background .12s',borderRadius:6,margin:'1px 4px',position:'relative'}}
              onClick={()=>onUserClick({...f,userId:f._id})}
              onMouseEnter={e=>{e.currentTarget.style.background=dark?'#2a2d3e':'#f3f4f6';e.currentTarget.querySelector('.rm-btn').style.opacity='1'}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.querySelector('.rm-btn').style.opacity='0'}}>
              {/* Avatar + status */}
              <div style={{position:'relative',flexShrink:0}}>
                <img src={f.avatar||'/default_images/avatar/default_guest.png'} alt=""
                  style={{width:30,height:30,borderRadius:'50%',objectFit:'cover',border:`2px solid ${GBR(f.gender,f.rank)}`,display:'block'}}
                  onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
                <span style={{position:'absolute',bottom:-1,right:-1,width:9,height:9,
                  background:f.isOnline?statusColor:'#9ca3af',
                  borderRadius:'50%',border:`2px solid ${dark?'#1e2030':'#fff'}`}}/>
              </div>
              {/* Name + status text */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:3}}>
                  <RIcon rank={f.rank} size={11}/>
                  <span style={{fontSize:'0.8rem',fontWeight:700,color:f.nameColor||ri.color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {f.username}
                  </span>
                </div>
                <div style={{fontSize:'0.62rem',color:muted,marginTop:1}}>
                  {f.isOnline ? (f.status||'online') : 'offline'}
                </div>
              </div>
              {/* Remove friend (shown on hover) */}
              <button className="rm-btn" onClick={e=>{e.stopPropagation();removeFriend(f._id)}}
                title="Remove friend"
                style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:11,padding:'2px 4px',borderRadius:4,opacity:0,transition:'opacity .15s',flexShrink:0}}>
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RIGHT SIDEBAR
// ─────────────────────────────────────────────────────────────
function RightSidebar({users,myLevel,onUserClick,onClose,dark}) {
  const [tab,setTab]=useState('users')
  const [search,setSearch]=useState('')
  const [rankF,setRankF]=useState('all')
  const [genderF,setGenderF]=useState('all')

  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea', muted=dark?'#9ca3af':'#9ca3af'
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
    {id:'friends',icon:'fi-sr-user-add',   label:'Friends'},
    {id:'search',icon:'fi-sr-search',      label:'Search'},
  ]

  return (
    <div style={{width:210,borderLeft:`1px solid ${border}`,background:bg,display:'flex',flexDirection:'column',flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',borderBottom:`1px solid ${border}`,flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} title={t.label}
            style={{flex:1,padding:'9px 2px',border:'none',background:'none',cursor:'pointer',borderBottom:`2px solid ${tab===t.id?'#1a73e8':'transparent'}`,color:tab===t.id?'#1a73e8':muted,fontSize:14,transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className={`fi ${t.icon}`}/>
          </button>
        ))}
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:muted,padding:'4px 7px',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
      </div>

      {tab==='search'&&(
        <div style={{padding:'7px 8px',borderBottom:`1px solid ${dark?'#374151':'#f3f4f6'}`,flexShrink:0}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Username..."
            style={{width:'100%',padding:'6px 10px',background:dark?'#2a2d3e':'#f9fafb',border:`1.5px solid ${border}`,borderRadius:7,fontSize:'0.8rem',outline:'none',boxSizing:'border-box',color:dark?'#e5e7eb':'#111827',marginBottom:6,fontFamily:'Nunito,sans-serif'}}
            onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor=border}
          />
          <div style={{display:'flex',gap:4}}>
            <select value={genderF} onChange={e=>setGenderF(e.target.value)} style={{flex:1,padding:'5px 4px',background:dark?'#2a2d3e':'#f9fafb',border:`1px solid ${border}`,borderRadius:6,fontSize:'0.73rem',outline:'none',color:dark?'#e5e7eb':'#374151'}}>
              <option value="all">All Gender</option>
              <option value="male">Male</option><option value="female">Female</option>
              <option value="couple">Couple</option><option value="other">Other</option>
            </select>
            <select value={rankF} onChange={e=>setRankF(e.target.value)} style={{flex:1,padding:'5px 4px',background:dark?'#2a2d3e':'#f9fafb',border:`1px solid ${border}`,borderRadius:6,fontSize:'0.73rem',outline:'none',color:dark?'#e5e7eb':'#374151'}}>
              <option value="all">All Ranks</option>
              {Object.entries(RANKS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {tab==='friends'?(<FriendsList me={me} onUserClick={onUserClick} dark={dark}/>):(
      <>
      <div style={{padding:'5px 10px 2px',fontSize:'0.63rem',fontWeight:700,color:muted,letterSpacing:'1px',textTransform:'uppercase',flexShrink:0}}>
        {tab==='staff'?'Staff':'Online'} · {filtered.length}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {filtered.length===0
          ? <p style={{textAlign:'center',color:muted,fontSize:'0.78rem',padding:'16px 10px'}}>
              {tab==='staff'?'No staff online':tab==='search'?'No results':'No users'}
            </p>
          : filtered.map((u,i)=><UserItem key={u.userId||u._id||i} u={u} onClick={onUserClick} dark={dark}/>)
        }
      </div>
      </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LEFT SIDEBAR (opened from header hamburger)
// ─────────────────────────────────────────────────────────────
function LeftSidebar({room,nav,socket,roomId,onClose,dark}) {
  const [panel,setPanel]=useState(null)
  const bg=dark?'#1e2030':'#fff', bg2=dark?'#161824':'#f8f9fa', border=dark?'#374151':'#e4e6ea'
  const ITEMS=[
    {id:'rooms',       icon:'fi-sr-house-chimney',label:'Room List'},
    {id:'games',       icon:'fi-sr-dice',         label:'Games'},
    {id:'store',       icon:'fi-sr-store-alt',    label:'Store'},
    {id:'leaderboard', icon:'fi-sr-medal',        label:'Leaderboard'},
    {id:'username',    icon:'fi-sr-edit',         label:'Change Username'},
    {id:'premium',     icon:'fi-sr-crown',        label:'Buy Premium'},
    {id:'dj',          icon:'fi-sr-headphones',   label:'DJ Room'},
  ]

  return (
    <div style={{display:'flex',height:'100%',flexShrink:0}}>
      <div style={{width:48,background:bg2,borderRight:`1px solid ${border}`,display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 0',gap:2}}>
        <div style={{padding:'2px 0 6px',borderBottom:`1px solid ${border}`,width:'100%',textAlign:'center',marginBottom:4}}>
          <img src={room?.icon||'/default_images/rooms/default_room.png'} alt="" style={{width:30,height:30,borderRadius:7,objectFit:'cover',margin:'0 auto'}} onError={e=>e.target.style.display='none'}/>
        </div>
        {ITEMS.map(item=>(
          <button key={item.id} title={item.label} onClick={()=>setPanel(p=>p===item.id?null:item.id)}
            style={{width:36,height:36,borderRadius:8,border:'none',background:panel===item.id?'#e8f0fe':'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:panel===item.id?'#1a73e8':dark?'#9ca3af':'#6b7280',fontSize:15,transition:'all .12s'}}
            onMouseEnter={e=>{if(panel!==item.id){e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.color='#1a73e8'}}}
            onMouseLeave={e=>{if(panel!==item.id){e.currentTarget.style.background='none';e.currentTarget.style.color=dark?'#9ca3af':'#6b7280'}}}
          ><i className={`fi ${item.icon}`}/></button>
        ))}
      </div>

      {panel&&(
        <div style={{width:240,background:bg,borderRight:`1px solid ${border}`,display:'flex',flexDirection:'column',boxShadow:'2px 0 8px rgba(0,0,0,.06)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderBottom:`1px solid ${border}`,flexShrink:0}}>
            <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:dark?'#e5e7eb':'#111827'}}>{ITEMS.find(i=>i.id===panel)?.label}</span>
            <button onClick={()=>setPanel(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
          </div>
          {panel==='rooms'&&<RoomListPanel nav={nav} dark={dark}/>}
          {panel==='games'&&<GamesPanel socket={socket} roomId={roomId} dark={dark} me={me}/>}
          {panel==='store'&&<StorePanel dark={dark}/>}
          {panel==='leaderboard'&&<LeaderboardPanel dark={dark}/>}
          {panel==='username'&&<UsernamePanel dark={dark}/>}
          {panel==='premium'&&<div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center'}}><i className="fi fi-sr-crown" style={{fontSize:40,color:'#f59e0b',marginBottom:10}}/><div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1rem',color:dark?'#e5e7eb':'#111827',marginBottom:6}}>Go Premium</div><div style={{background:'linear-gradient(135deg,#fbbf24,#f59e0b)',borderRadius:10,padding:12,color:'#fff',fontWeight:700,width:'100%'}}>Coming Soon 🚀</div></div>}
          {panel==='dj'&&<div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}><RadioPlayer dark={dark} onClose={()=>setPanel(null)}/></div>}
        </div>
      )}
    </div>
  )
}

function RoomListPanel({nav,dark}) {
  const [rooms,setRooms]=useState([]), [load,setLoad]=useState(true)
  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#f3f4f6', txt=dark?'#e5e7eb':'#111827'
  useEffect(()=>{
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/rooms`,{headers:{Authorization:`Bearer ${t}`}}).then(r=>r.json()).then(d=>setRooms(d.rooms||[])).catch(()=>{}).finally(()=>setLoad(false))
  },[])
  if(load) return <div style={{textAlign:'center',padding:20}}><div style={{width:22,height:22,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>
  return (
    <div style={{flex:1,overflowY:'auto'}}>
      {rooms.map(r=>(
        <div key={r._id} onClick={()=>nav(`/chat/${r._id}`)} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 12px',cursor:'pointer',borderBottom:`1px solid ${border}`,transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background=dark?'#2a2d3e':'#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <img src={r.icon||'/default_images/rooms/default_room.png'} alt="" style={{width:32,height:32,borderRadius:7,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'0.83rem',fontWeight:700,color:txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</div>
            {r.description&&<div style={{fontSize:'0.7rem',color:'#9ca3af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.description}</div>}
            <div style={{fontSize:'0.68rem',color:'#22c55e',fontWeight:600}}>{r.currentUsers||0} online</div>
          </div>
          <i className="fi fi-sr-angle-right" style={{fontSize:11,color:'#9ca3af',flexShrink:0}}/>
        </div>
      ))}
    </div>
  )
}

// ── DICE SVG (CodyChat-style with pip layout) ──────────────
const DICE_PIPS = {
  1: [[50,50]],
  2: [[28,28],[72,72]],
  3: [[28,28],[50,50],[72,72]],
  4: [[28,28],[72,28],[28,72],[72,72]],
  5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
  6: [[28,24],[72,24],[28,50],[72,50],[28,76],[72,76]],
}

function DiceSVG({value=1,size=96,rolling=false,won=null,dark=false}) {
  const pips = DICE_PIPS[value] || DICE_PIPS[1]
  const isWin  = won === true
  const isLoss = won === false
  const faceColor  = isWin ? '#d1fae5' : isLoss ? '#fee2e2' : dark ? '#1e2030' : '#fff'
  const borderColor= isWin ? '#10b981' : isLoss ? '#ef4444' : '#7c3aed'
  const pipColor   = isWin ? '#065f46' : isLoss ? '#dc2626' : '#7c3aed'
  const glow       = isWin ? '0 0 24px #10b98155' : isLoss ? '0 0 24px #ef444455' : '0 6px 20px rgba(124,58,237,.25)'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      style={{
        borderRadius:16,
        border:`3px solid ${borderColor}`,
        background:faceColor,
        boxShadow:glow,
        transition:'all .35s cubic-bezier(.34,1.56,.64,1)',
        animation: rolling ? 'diceRoll3D 0.15s ease-in-out infinite alternate' : 'none',
        flexShrink:0,
        display:'block',
      }}>
      {/* Rounded rect background */}
      <rect x="2" y="2" width="96" height="96" rx="14" fill={faceColor}/>
      {/* Border inner highlight */}
      <rect x="3" y="3" width="94" height="94" rx="13" fill="none" stroke={borderColor} strokeWidth="2.5" opacity="0.6"/>
      {pips.map(([cx,cy],i)=>(
        <g key={i}>
          <circle cx={cx} cy={cy} r={9.5} fill={pipColor} opacity="0.15"/>
          <circle cx={cx} cy={cy} r={7.5} fill={pipColor}/>
          <circle cx={cx-2} cy={cy-2} r={2.5} fill="#fff" opacity="0.35"/>
        </g>
      ))}
    </svg>
  )
}

// ── KENO NUMBER GRID ──────────────────────────────────────────
function KenoGrid({picks,setPicks,drawn,maxPick=10,dark}) {
  const nums = Array.from({length:80},(_,i)=>i+1)
  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea'
  const toggle = n => {
    if (drawn) return // locked during result
    if (picks.includes(n)) { setPicks(picks.filter(x=>x!==n)); return }
    if (picks.length >= maxPick) return
    setPicks([...picks, n])
  }
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:3}}>
      {nums.map(n=>{
        const isPicked = picks.includes(n)
        const isDrawn  = drawn?.includes(n)
        const isHit    = isPicked && isDrawn
        const isMiss   = isPicked && drawn && !isDrawn
        let bg2 = dark?'#2a2d3e':'#f9fafb'
        let col2 = dark?'#9ca3af':'#6b7280'
        let brd2 = dark?'#374151':'#e4e6ea'
        let bld = 400
        if (isHit)   { bg2='#d1fae5'; col2='#065f46'; brd2='#10b981'; bld=800 }
        else if (isMiss) { bg2='#fee2e2'; col2='#dc2626'; brd2='#ef4444'; bld=800 }
        else if (isDrawn) { bg2=dark?'#1e3a2a':'#ecfdf5'; col2=dark?'#6ee7b7':'#059669'; brd2='#10b98155'; bld=600 }
        else if (isPicked) { bg2='#ede9fe'; col2='#7c3aed'; brd2='#7c3aed'; bld=700 }
        return (
          <button key={n} onClick={()=>toggle(n)}
            style={{
              padding:'5px 2px',borderRadius:5,border:`1.5px solid ${brd2}`,
              background:bg2,color:col2,fontSize:'0.65rem',fontWeight:bld,
              cursor:drawn?'default':'pointer',transition:'all .12s',
              lineHeight:1,
            }}
            onMouseEnter={e=>{if(!drawn&&!isPicked&&picks.length<maxPick)e.currentTarget.style.background=dark?'#374151':'#e8f0fe'}}
            onMouseLeave={e=>{if(!drawn&&!isPicked)e.currentTarget.style.background=dark?'#2a2d3e':'#f9fafb'}}>
            {n}
          </button>
        )
      })}
    </div>
  )
}

function GamesPanel({socket,roomId,dark,me}) {
  const [view,   setView]   = useState('menu')
  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea', txt=dark?'#e5e7eb':'#111827'
  const muted=dark?'#9ca3af':'#6b7280'

  // ── DICE STATE ──────────────────────────────────────────────
  const DICE_BET = 100
  const DICE_MULT = 5.7
  const [rolling, setRolling] = useState(false)
  const [diceVal, setDiceVal] = useState(1)
  const [diceRes, setDiceRes] = useState(null)  // {roll,won,payout,newGold}
  const [diceHistory, setDiceHistory] = useState([])

  useEffect(()=>{
    if(!socket) return
    const onResult = data => {
      let ticks = 0
      const iv = setInterval(()=>{
        setDiceVal(Math.floor(Math.random()*6)+1)
        ticks++
        if(ticks > 14) {
          clearInterval(iv)
          setDiceVal(data.roll)
          setRolling(false)
          setDiceRes(data)
          setDiceHistory(p=>[data,...p].slice(0,8))
        }
      }, 110)
    }
    const onErr = d => { setRolling(false); alert(d.msg||'Dice error') }
    socket.on('diceResult', onResult)
    socket.on('diceError',  onErr)
    return ()=>{ socket.off('diceResult', onResult); socket.off('diceError', onErr) }
  },[socket])

  function rollDice() {
    if(rolling) return
    setRolling(true)
    setDiceRes(null)
    setDiceVal(Math.floor(Math.random()*6)+1)
    socket?.emit('rollDice',{roomId})
  }

  // ── KENO STATE ──────────────────────────────────────────────
  const [kenoBet,    setKenoBet]    = useState(10)
  const [kenoPicks,  setKenoPicks]  = useState([])
  const [kenoRes,    setKenoRes]    = useState(null)
  const [kenoPlaying,setKenoPlaying]= useState(false)
  const [kenoReveal, setKenoReveal] = useState([]) // progressively revealed draw

  useEffect(()=>{
    if(!socket) return
    const onKenoResult = data => {
      setKenoPlaying(false)
      // Reveal drawn numbers one-by-one for animation
      setKenoReveal([])
      const revealInterval = setInterval(()=>{
        setKenoReveal(p=>{
          const next = [...p, data.drawn[p.length]]
          if(next.length >= data.drawn.length) clearInterval(revealInterval)
          return next
        })
      }, 120)
      setTimeout(()=>setKenoRes(data), data.drawn.length * 120 + 200)
    }
    const onKenoErr = d => { setKenoPlaying(false); alert(d.msg||'Keno error') }
    socket.on('kenoResult', onKenoResult)
    socket.on('kenoError',  onKenoErr)
    return ()=>{ socket.off('kenoResult',onKenoResult); socket.off('kenoError',onKenoErr) }
  },[socket])

  function playKeno() {
    if(kenoPlaying || kenoPicks.length < 1) return
    setKenoPlaying(true)
    setKenoRes(null)
    setKenoReveal([])
    socket?.emit('playKeno',{roomId, picks:kenoPicks, bet:kenoBet})
  }

  // ── DICE VIEW ────────────────────────────────────────────────
  if(view==='dice') return (
    <div style={{padding:'12px 10px',flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:12}}>
      <style>{`
        @keyframes diceRoll3D{
          0%{transform:rotate(-12deg) scale(1.08) translateY(-2px)}
          100%{transform:rotate(12deg) scale(0.95) translateY(2px)}
        }
        @keyframes winPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <button onClick={()=>{setView('menu');setDiceRes(null);setRolling(false)}}
        style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',color:muted,fontSize:'0.8rem',fontWeight:700,padding:0,width:'fit-content'}}>
        <i className="fi fi-sr-angle-left" style={{fontSize:11}}/> Back
      </button>

      {/* Header */}
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'1.05rem',fontWeight:900,color:txt,fontFamily:'Outfit,sans-serif'}}>🎲 Dice Roll</div>
        <div style={{fontSize:'0.72rem',color:muted,marginTop:3,lineHeight:1.4}}>
          Fixed bet: <strong style={{color:'#f59e0b'}}>100 coins</strong> · Roll a <strong style={{color:'#7c3aed'}}>6</strong> to win <strong style={{color:'#10b981'}}>570 coins</strong> (5.7×)
        </div>
      </div>

      {/* Gold display */}
      <div style={{display:'flex',justifyContent:'center'}}>
        <div style={{padding:'5px 14px',background:dark?'#2a2d3e':'#fef3c7',borderRadius:20,fontSize:'0.8rem',fontWeight:700,color:'#d97706',border:`1px solid ${dark?'#374151':'#fde68a'}`}}>
          💰 {me?.gold ?? '—'} coins
        </div>
      </div>

      {/* Dice face */}
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:'16px 0',animation:diceRes?.won?'winPulse 0.6s ease':'none'}}>
        <DiceSVG value={diceVal} size={110} rolling={rolling} won={diceRes?diceRes.won:null} dark={dark}/>
      </div>

      {/* Result */}
      {diceRes&&(
        <div style={{
          borderRadius:12,padding:'12px 16px',textAlign:'center',
          background:diceRes.won?'#d1fae5':'#fee2e2',
          border:`2px solid ${diceRes.won?'#10b981':'#ef4444'}`,
          animation:'fadeSlideUp .35s ease'
        }}>
          <div style={{fontWeight:900,fontSize:'1.05rem',color:diceRes.won?'#065f46':'#991b1b',fontFamily:'Outfit,sans-serif'}}>
            {diceRes.won ? `🎉 Rolled 6! +${diceRes.payout} coins!` : `😬 Rolled ${diceRes.roll} — Lost ${DICE_BET} coins`}
          </div>
          <div style={{fontSize:'0.72rem',color:diceRes.won?'#059669':'#dc2626',marginTop:4}}>
            {diceRes.won ? `5.7× multiplier applied` : `Only a 6 wins. Try again!`}
          </div>
          {diceRes.newGold!=null&&<div style={{fontSize:'0.72rem',color:muted,marginTop:4}}>Balance: <strong style={{color:'#f59e0b'}}>{diceRes.newGold}</strong> 💰</div>}
        </div>
      )}

      {/* Roll button */}
      <button onClick={rollDice} disabled={rolling}
        style={{
          width:'100%',padding:'13px',borderRadius:12,border:'none',
          background:rolling?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#6d28d9)',
          color:'#fff',fontWeight:800,fontSize:'0.95rem',cursor:rolling?'wait':'pointer',
          boxShadow:rolling?'none':'0 4px 16px rgba(124,58,237,.4)',
          transition:'all .2s',fontFamily:'Outfit,sans-serif',letterSpacing:'0.02em',
        }}>
        {rolling ? '🎲 Rolling…' : '🎲 Roll for 100 coins'}
      </button>

      <div style={{fontSize:'0.68rem',textAlign:'center',color:muted}}>
        Win odds: 1 in 6 (16.7%) · Payout: 570 coins
      </div>

      {/* Roll history */}
      {diceHistory.length>0&&(
        <div>
          <div style={{fontSize:'0.65rem',fontWeight:700,color:muted,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.08em'}}>Recent Rolls</div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {diceHistory.map((h,i)=>(
              <div key={i} style={{
                display:'flex',alignItems:'center',gap:4,padding:'4px 8px',
                borderRadius:7,border:`1px solid ${h.won?'#10b981':'#ef4444'}`,
                background:h.won?'#d1fae5':'#fee2e2',
                fontSize:'0.72rem',fontWeight:700,color:h.won?'#065f46':'#991b1b'
              }}>
                {['⚀','⚁','⚂','⚃','⚄','⚅'][h.roll-1]} {h.won?`+${h.payout}`:`-${DICE_BET}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // ── KENO VIEW ─────────────────────────────────────────────────
  if(view==='keno') return (
    <div style={{padding:'10px 8px',flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
      <style>{`@keyframes kenoReveal{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

      <button onClick={()=>{setView('menu');setKenoRes(null);setKenoPicks([]);setKenoReveal([])}}
        style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',color:muted,fontSize:'0.8rem',fontWeight:700,padding:0,width:'fit-content'}}>
        <i className="fi fi-sr-angle-left" style={{fontSize:11}}/> Back
      </button>

      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'1rem',fontWeight:900,color:txt,fontFamily:'Outfit,sans-serif'}}>🎰 Keno</div>
        <div style={{fontSize:'0.7rem',color:muted,marginTop:2}}>Pick 1–10 numbers · 10 drawn from 80 · Bet 2–1000 coins</div>
      </div>

      {/* Picks indicator */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',background:dark?'#2a2d3e':'#f0f7ff',borderRadius:8,border:`1px solid ${dark?'#374151':'#bfdbfe'}`}}>
        <span style={{fontSize:'0.75rem',fontWeight:700,color:'#1a73e8'}}>
          {kenoPicks.length}/10 picked
        </span>
        {kenoPicks.length>0&&!kenoPlaying&&!kenoRes&&(
          <button onClick={()=>{setKenoPicks([]);setKenoReveal([])}} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:'0.72rem',fontWeight:700}}>
            Clear ✕
          </button>
        )}
        {kenoRes&&(
          <button onClick={()=>{setKenoRes(null);setKenoPicks([]);setKenoReveal([])}} style={{background:'none',border:'none',cursor:'pointer',color:'#1a73e8',fontSize:'0.72rem',fontWeight:700}}>
            Play Again
          </button>
        )}
      </div>

      {/* Grid */}
      <KenoGrid picks={kenoPicks} setPicks={setKenoPicks} drawn={kenoReveal.length>0?kenoReveal:null} maxPick={10} dark={dark}/>

      {/* Bet slider */}
      {!kenoRes&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
            <label style={{fontSize:'0.72rem',fontWeight:700,color:muted}}>Bet Amount</label>
            <div style={{display:'flex',alignItems:'center',gap:4}}>
              {[2,10,50,100,500].map(v=>(
                <button key={v} onClick={()=>setKenoBet(v)}
                  style={{padding:'2px 6px',borderRadius:5,border:`1px solid ${kenoBet===v?'#1a73e8':border}`,background:kenoBet===v?'#e8f0fe':'none',color:kenoBet===v?'#1a73e8':muted,fontSize:'0.62rem',fontWeight:700,cursor:'pointer'}}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <input type="range" min={2} max={1000} value={kenoBet} onChange={e=>setKenoBet(Number(e.target.value))}
            style={{width:'100%',accentColor:'#1a73e8'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',color:muted}}>
            <span>2 coins</span>
            <strong style={{color:'#1a73e8'}}>{kenoBet} coins</strong>
            <span>1000 coins</span>
          </div>
        </div>
      )}

      {/* Result banner */}
      {kenoRes&&(
        <div style={{
          borderRadius:10,padding:'10px 14px',textAlign:'center',
          background:kenoRes.won?'#d1fae5':'#fee2e2',
          border:`2px solid ${kenoRes.won?'#10b981':'#ef4444'}`,
          animation:'fadeSlideUp .3s ease'
        }}>
          <div style={{fontWeight:900,fontSize:'0.95rem',color:kenoRes.won?'#065f46':'#991b1b',fontFamily:'Outfit,sans-serif'}}>
            {kenoRes.won ? `🎉 ${kenoRes.matches}/${kenoRes.total} hit! +${kenoRes.payout} coins (${kenoRes.multiplier}×)` : `😬 ${kenoRes.matches}/${kenoRes.total} matched — lost ${kenoRes.bet} coins`}
          </div>
          {kenoRes.newGold!=null&&<div style={{fontSize:'0.72rem',color:muted,marginTop:4}}>Balance: <strong style={{color:'#f59e0b'}}>{kenoRes.newGold}</strong> 💰</div>}
        </div>
      )}

      {/* Play button */}
      {!kenoRes&&(
        <button onClick={playKeno} disabled={kenoPlaying||kenoPicks.length<1}
          style={{
            width:'100%',padding:'11px',borderRadius:11,border:'none',
            background:(kenoPlaying||kenoPicks.length<1)?'#93c5fd':'linear-gradient(135deg,#1a73e8,#1464cc)',
            color:'#fff',fontWeight:800,fontSize:'0.9rem',
            cursor:(kenoPlaying||kenoPicks.length<1)?'not-allowed':'pointer',
            boxShadow:(kenoPlaying||kenoPicks.length<1)?'none':'0 4px 14px rgba(26,115,232,.4)',
            transition:'all .2s',fontFamily:'Outfit,sans-serif',
          }}>
          {kenoPlaying ? '🎰 Drawing numbers…' : kenoPicks.length<1 ? 'Pick at least 1 number' : `🎰 Play Keno — ${kenoBet} coins`}
        </button>
      )}
    </div>
  )

  // ── SPIN VIEW ─────────────────────────────────────────────────
  if(view==='spin') return (
    <div style={{padding:12,flex:1,overflowY:'auto'}}>
      <button onClick={()=>setView('menu')} style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',color:muted,fontSize:'0.8rem',fontWeight:700,padding:'0 0 10px',width:'fit-content'}}>
        <i className="fi fi-sr-angle-left" style={{fontSize:11}}/> Back
      </button>
      <div style={{textAlign:'center',marginBottom:12}}>
        <div style={{fontSize:'1rem',fontWeight:900,color:txt,fontFamily:'Outfit,sans-serif'}}>🎡 Daily Spin</div>
        <div style={{fontSize:'0.72rem',color:muted,marginTop:2}}>Free once every 24 hours</div>
      </div>
      <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
        <div style={{width:100,height:100,borderRadius:'50%',border:'4px solid #f59e0b',background:'linear-gradient(135deg,#fbbf24,#f59e0b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,boxShadow:'0 6px 20px rgba(245,158,11,.4)'}}>🎡</div>
      </div>
      <button onClick={()=>socket?.emit('spinWheel',{})}
        style={{width:'100%',padding:'11px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',fontWeight:800,fontSize:'0.9rem',cursor:'pointer',boxShadow:'0 4px 14px rgba(245,158,11,.4)',fontFamily:'Outfit,sans-serif'}}>
        🎡 Spin Now
      </button>
    </div>
  )

  // ── MENU VIEW ─────────────────────────────────────────────────
  return (
    <div style={{padding:10,flex:1,overflowY:'auto'}}>
      <div style={{fontSize:'0.65rem',fontWeight:700,color:muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Choose a Game</div>
      {[
        {id:'dice', emoji:'🎲', label:'Dice Roll', desc:'Bet 100 coins · Roll 6 → 5.7× win', color:'#7c3aed', bg:'#f5f3ff', dbg:'#1e1a2e'},
        {id:'spin', emoji:'🎡', label:'Daily Spin',desc:'Free spin every 24 hours',            color:'#f59e0b', bg:'#fffbeb', dbg:'#1e1c10'},
        {id:'keno', emoji:'🎰', label:'Keno',      desc:'Pick 1–10 numbers · 10 drawn',       color:'#1a73e8', bg:'#eff6ff', dbg:'#0f172a'},
      ].map(g=>(
        <button key={g.id} onClick={()=>setView(g.id)}
          style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'12px 14px',background:dark?g.dbg:g.bg,border:`1.5px solid ${dark?'#374151':'transparent'}`,borderRadius:11,cursor:'pointer',marginBottom:8,textAlign:'left',transition:'all .15s',boxShadow:'0 1px 4px rgba(0,0,0,.07)'}}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 14px rgba(0,0,0,.13)'}}
          onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.07)'}}>
          <span style={{fontSize:26,flexShrink:0}}>{g.emoji}</span>
          <div>
            <div style={{fontSize:'0.88rem',fontWeight:800,color:g.color,fontFamily:'Outfit,sans-serif'}}>{g.label}</div>
            <div style={{fontSize:'0.7rem',color:muted,marginTop:1}}>{g.desc}</div>
          </div>
          <i className="fi fi-sr-angle-right" style={{marginLeft:'auto',color:muted,fontSize:11}}/>
        </button>
      ))}
    </div>
  )
}

function StorePanel({dark}) {
  const bg=dark?'#2a2d3e':'#f9fafb', border=dark?'#374151':'#e4e6ea', txt=dark?'#e5e7eb':'#111827'
  return (
    <div style={{padding:10,flex:1,overflowY:'auto'}}>
      <div style={{background:'linear-gradient(135deg,#fbbf24,#f59e0b)',borderRadius:10,padding:12,marginBottom:10,textAlign:'center'}}>
        <div style={{fontSize:'0.85rem',fontWeight:800,color:'#fff'}}>💰 Buy Gold Coins</div>
      </div>
      {[{g:100,p:'₹10'},{g:500,p:'₹45'},{g:1000,p:'₹80'},{g:5000,p:'₹350'}].map(p=>(
        <button key={p.g} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'10px 12px',background:bg,border:`1px solid ${border}`,borderRadius:8,cursor:'pointer',marginBottom:6,transition:'all .15s'}} onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.borderColor='#1a73e8'}} onMouseLeave={e=>{e.currentTarget.style.background=bg;e.currentTarget.style.borderColor=border}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}><span>💰</span><span style={{fontSize:'0.85rem',fontWeight:700,color:txt}}>{p.g} Gold</span></div>
          <span style={{fontSize:'0.85rem',fontWeight:700,color:'#1a73e8'}}>{p.p}</span>
        </button>
      ))}
    </div>
  )
}

function LeaderboardPanel({dark}) {
  const [data,setData]=useState([]), [type,setType]=useState('leader_xp'), [load,setLoad]=useState(false)
  const border=dark?'#374151':'#e4e6ea', txt=dark?'#e5e7eb':'#111827'
  const STAT_KEY = { leader_xp:'xp', leader_level:'level', leader_gold:'gold', leader_gift:'giftsReceived' }

  function loadData(t) {
    setLoad(true)
    const token=localStorage.getItem('cgz_token')
    fetch(`${API}/api/leaderboard/${t}`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(d=>setData(d.users||[])).catch(()=>{}).finally(()=>setLoad(false))
  }

  useEffect(()=>{ loadData(type) },[type])

  // Auto-refresh every 30s for live feel
  useEffect(()=>{
    const iv = setInterval(()=>loadData(type), 30000)
    return ()=>clearInterval(iv)
  },[type])

  const statKey = STAT_KEY[type] || 'xp'
  const MEDALS = ['🥇','🥈','🥉']
  const LABELS = { leader_xp:'XP', leader_level:'LVL', leader_gold:'💰', leader_gift:'🎁' }

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{display:'flex',gap:4,padding:'8px 8px 4px',flexShrink:0}}>
        {[{id:'leader_xp',l:'XP'},{id:'leader_level',l:'Level'},{id:'leader_gold',l:'Gold'},{id:'leader_gift',l:'Gifts'}].map(tp=>(
          <button key={tp.id} onClick={()=>setType(tp.id)} style={{flex:1,padding:'5px 4px',borderRadius:6,border:`1.5px solid ${type===tp.id?'#1a73e8':border}`,background:type===tp.id?'#e8f0fe':'none',cursor:'pointer',fontSize:'0.72rem',fontWeight:700,color:type===tp.id?'#1a73e8':dark?'#9ca3af':'#6b7280'}}>{tp.l}</button>
        ))}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load
          ? <div style={{textAlign:'center',padding:16}}><div style={{width:20,height:20,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>
          : data.map((u,i)=>(
            <div key={u._id||i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderBottom:`1px solid ${dark?'#374151':'#f3f4f6'}`,background:i===0?dark?'rgba(245,158,11,.1)':'#fffbeb':'transparent'}}>
              <span style={{fontSize:i<3?'1rem':'0.8rem',fontWeight:800,width:22,flexShrink:0,textAlign:'center'}}>{i<3?MEDALS[i]:`${i+1}`}</span>
              <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:26,height:26,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`1.5px solid ${i===0?'#f59e0b':i===1?'#9ca3af':i===2?'#d97706':'transparent'}`}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
              <span style={{flex:1,fontSize:'0.8rem',fontWeight:700,color:txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username}</span>
              <span style={{fontSize:'0.78rem',fontWeight:800,color:'#1a73e8',flexShrink:0}}>{LABELS[type]} {u[statKey]||0}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}

function UsernamePanel({dark}) {
  const [val,setVal]=useState(''), [msg,setMsg]=useState('')
  const border=dark?'#374151':'#e4e6ea', txt=dark?'#e5e7eb':'#111827', bg=dark?'#2a2d3e':'#f9fafb'
  async function change() {
    const t=localStorage.getItem('cgz_token')
    const r=await fetch(`${API}/api/users/change-username`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify({newUsername:val})})
    const d=await r.json()
    setMsg(r.ok?'✅ Username changed!':d.error||'Failed')
  }
  return (
    <div style={{padding:14,flex:1}}>
      <div style={{background:dark?'#2a1a00':'#fef3c7',border:`1px solid ${dark?'#7c3000':'#fde68a'}`,borderRadius:9,padding:'10px 12px',marginBottom:12,fontSize:'0.8rem',color:dark?'#fbbf24':'#92400e'}}>
        Username change costs <strong>500 Gold</strong>
      </div>
      {msg&&<div style={{background:msg.startsWith('✅')?'#d1fae5':'#fee2e2',borderRadius:7,padding:'7px 10px',fontSize:'0.78rem',color:msg.startsWith('✅')?'#065f46':'#dc2626',marginBottom:10}}>{msg}</div>}
      <input value={val} onChange={e=>setVal(e.target.value)} placeholder="New username..."
        style={{width:'100%',padding:'9px 12px',border:`1.5px solid ${border}`,borderRadius:8,fontSize:'0.875rem',outline:'none',boxSizing:'border-box',color:txt,background:bg,marginBottom:8,fontFamily:'Nunito,sans-serif'}}
        onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor=border}
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
function RadioPanel({onClose,dark}) {
  return (
    <div style={{position:'absolute',bottom:'100%',left:0,right:0,background:dark?'#1e2030':'#fff',border:`1px solid ${dark?'#374151':'#e4e6ea'}`,borderRadius:'12px 12px 0 0',boxShadow:'0 -6px 24px rgba(0,0,0,.22)',height:'60vh',display:'flex',flexDirection:'column',zIndex:100}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:`1px solid ${dark?'#374151':'#f3f4f6'}`,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <span style={{fontSize:16}}>📻</span>
          <span style={{fontWeight:800,fontSize:'0.9rem',color:dark?'#e5e7eb':'#111827'}}>Live Radio</span>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:18,lineHeight:1}}>×</button>
      </div>
      <div style={{flex:1,overflow:'hidden'}}>
        <RadioPlayer dark={dark} onClose={onClose}/>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS PANEL
// ─────────────────────────────────────────────────────────────
function NotifPanel({onClose,onCount,dark}) {
  const [list,setList]=useState([]), [load,setLoad]=useState(true)
  const token=localStorage.getItem('cgz_token')
  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea', txt=dark?'#e5e7eb':'#111827'
  useEffect(()=>{
    fetch(`${API}/api/notifications`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{setList(d.notifications||[]);onCount(d.unreadCount||0)}).catch(()=>{}).finally(()=>setLoad(false))
  },[])
  async function markAll(){
    await fetch(`${API}/api/notifications/read-all`,{method:'PUT',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    setList(p=>p.map(n=>({...n,isRead:true}))); onCount(0)
  }
  const unread=list.filter(n=>!n.isRead).length
  return (
    <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:bg,border:`1px solid ${border}`,borderRadius:14,width:310,maxHeight:420,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.18)',zIndex:999}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',borderBottom:`1px solid ${dark?'#374151':'#f3f4f6'}`,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:txt}}>Notifications</span>
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
          <div key={n._id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',borderBottom:`1px solid ${dark?'#2a2d3e':'#f9fafb'}`,background:n.isRead?'transparent':dark?'#1a2340':'#f0f7ff'}}>
            <div style={{width:32,height:32,borderRadius:8,background:dark?'#2a2d3e':'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
              {{gift:'🎁',friend:'👥',like:'❤️',badge:'🏅',levelup:'⬆️',call:'📞',mention:'@'}[n.type]||'🔔'}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.82rem',fontWeight:n.isRead?600:700,color:txt}}>{n.title}</div>
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
// VOICE RECORDER
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// IMAGE PICKER — full-screen overlay: preview + caption + send
// ─────────────────────────────────────────────────────────────
function ImagePicker({ file, dark, onSend, onCancel }) {
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const captionRef = useRef(null)

  useEffect(()=>{
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(()=>{ setTimeout(()=>captionRef.current?.focus(), 100) }, [])

  async function handleSend(e) {
    e?.preventDefault()
    if (!file || uploading) return
    setUploading(true)
    try {
      const token = localStorage.getItem('cgz_token')
      const fd = new FormData()
      fd.append('image', file)
      const r = await fetch(`${API}/api/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      })
      const d = await r.json()
      if (d.url) {
        onSend(d.url, caption.trim())
      } else {
        alert(d.error || 'Image upload failed')
        setUploading(false)
      }
    } catch (err) {
      alert('Upload failed: ' + err.message)
      setUploading(false)
    }
  }

  const bg = dark ? '#161824' : '#fff'
  const border = dark ? '#374151' : '#e4e6ea'
  const txt = dark ? '#e5e7eb' : '#111827'
  const muted = dark ? '#6b7280' : '#9ca3af'

  return (
    <div onClick={onCancel} style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,.75)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:bg,borderRadius:18,maxWidth:480,width:'100%',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.4)'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:`1px solid ${border}`}}>
          <span style={{fontWeight:800,fontSize:'0.95rem',color:txt}}>📷 Send Image</span>
          <button onClick={onCancel} style={{background:'none',border:'none',cursor:'pointer',color:muted,fontSize:18,display:'flex',alignItems:'center'}}><i className="fi fi-sr-cross-small"/></button>
        </div>

        {/* Image preview */}
        <div style={{background:dark?'#0d0f1a':'#f3f4f6',maxHeight:320,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
          {preview && (
            <img src={preview} alt="Preview"
              style={{maxWidth:'100%',maxHeight:320,objectFit:'contain',display:'block'}}
            />
          )}
        </div>

        {/* Caption input + send */}
        <form onSubmit={handleSend} style={{padding:'14px 16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,background:dark?'#2a2d3e':'#f9fafb',border:`1.5px solid ${border}`,borderRadius:12,padding:'6px 6px 6px 14px',transition:'border-color .15s'}}
            onFocusCapture={e=>e.currentTarget.style.borderColor='#1a73e8'}
            onBlurCapture={e=>e.currentTarget.style.borderColor=border}>
            <input
              ref={captionRef}
              value={caption}
              onChange={e=>setCaption(e.target.value.slice(0,300))}
              placeholder="Add a caption... (optional)"
              maxLength={300}
              style={{flex:1,border:'none',background:'transparent',outline:'none',fontSize:'0.9rem',color:txt,fontFamily:'Nunito,sans-serif'}}
              onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()} }}
            />
            <span style={{fontSize:'0.68rem',color:muted,whiteSpace:'nowrap',flexShrink:0}}>{caption.length}/300</span>
            <button type="submit" disabled={uploading}
              style={{width:36,height:36,borderRadius:10,border:'none',background:uploading?'#9ca3af':'linear-gradient(135deg,#1a73e8,#1464cc)',color:'#fff',cursor:uploading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0,transition:'all .15s'}}>
              {uploading
                ? <span style={{width:14,height:14,border:'2px solid rgba(255,255,255,.4)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .7s linear infinite',display:'block'}}/>
                : <i className="fi fi-sr-paper-plane"/>
              }
            </button>
          </div>
          <p style={{margin:'8px 0 0',fontSize:'0.7rem',color:muted,textAlign:'center'}}>
            Press <strong>Enter</strong> or click send · Caption is optional
          </p>
        </form>
      </div>
    </div>
  )
}

function VoiceRecorder({onSend,onCancel,dark}) {
  const [state,setState]=useState('idle')
  const [seconds,setSecs]=useState(0)
  const [audioUrl,setAudioUrl]=useState(null)
  const mediaRef=useRef(null), chunksRef=useRef([]), timerRef=useRef(null), blobRef=useRef(null)
  const bg=dark?'#2a2d3e':'#f3f4f6'

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true})
      const mr = new MediaRecorder(stream,{mimeType:'audio/webm'})
      mediaRef.current=mr; chunksRef.current=[]
      mr.ondataavailable=e=>{if(e.data.size>0)chunksRef.current.push(e.data)}
      mr.onstop=()=>{
        const blob=new Blob(chunksRef.current,{type:'audio/webm'})
        blobRef.current=blob; setAudioUrl(URL.createObjectURL(blob)); setState('recorded')
        stream.getTracks().forEach(t=>t.stop())
      }
      mr.start(); setState('recording'); setSecs(0); clearInterval(timerRef.current)
      timerRef.current=setInterval(()=>setSecs(p=>{if(p>=120){mr.stop();return p}return p+1}),1000)
    } catch{ alert('Microphone access denied') }
  }
  function stopRec(){clearInterval(timerRef.current);mediaRef.current?.stop()}
  async function sendVoice(){
    if(!blobRef.current) return; setState('uploading')
    try{
      const token=localStorage.getItem('cgz_token')
      const fd=new FormData(); fd.append('audio',blobRef.current,`voice_${Date.now()}.webm`)
      const r=await fetch(`${API}/api/upload/voice`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd})
      const d=await r.json()
      if(d.url) onSend(d.url,seconds); else throw new Error(d.error||'Upload failed')
    }catch(e){setState('recorded');alert('Voice upload failed: '+e.message)}
  }
  const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',background:bg,borderRadius:22,border:`1px solid ${dark?'#374151':'#e4e6ea'}`}}>
      {state==='idle'&&<button onClick={startRec} style={{width:32,height:32,borderRadius:'50%',border:'none',background:'#ef4444',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}><i className="fi fi-sr-microphone"/></button>}
      {state==='recording'&&<>
        <div style={{width:8,height:8,background:'#ef4444',borderRadius:'50%',animation:'pulse 1s infinite',flexShrink:0}}/>
        <span style={{fontSize:'0.8rem',fontWeight:700,color:'#ef4444',minWidth:36}}>{fmt(seconds)}</span>
        <button onClick={stopRec} style={{width:28,height:28,borderRadius:'50%',border:'none',background:'#374151',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}><i className="fi fi-sr-square"/></button>
      </>}
      {state==='recorded'&&audioUrl&&<>
        <audio src={audioUrl} controls style={{height:28,maxWidth:140,flexShrink:1}}/>
        <span style={{fontSize:'0.72rem',color:'#9ca3af',flexShrink:0}}>{fmt(seconds)}</span>
        <button onClick={sendVoice} style={{width:28,height:28,borderRadius:'50%',border:'none',background:'#1a73e8',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}><i className="fi fi-sr-paper-plane"/></button>
      </>}
      {state==='uploading'&&<span style={{fontSize:'0.78rem',color:'#9ca3af'}}>Uploading...</span>}
      <button onClick={onCancel} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:14,flexShrink:0,display:'flex',alignItems:'center'}}><i className="fi fi-sr-cross-small"/></button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// VOICE BUBBLE
// ─────────────────────────────────────────────────────────────
function VoiceBubble({audioUrl,duration,mine,dark}) {
  const [playing,setPlaying]=useState(false),[progress,setProgress]=useState(0),[current,setCurrent]=useState(0)
  const audioRef=useRef(null)
  const fmt=s=>s?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`:'0:00'
  function toggle(){const a=audioRef.current;if(!a)return;if(playing)a.pause();else a.play();setPlaying(!playing)}
  function onTimeUpdate(){const a=audioRef.current;if(!a)return;setCurrent(a.currentTime);setProgress(a.duration?a.currentTime/a.duration*100:0)}
  function onEnded(){setPlaying(false);setProgress(0);setCurrent(0)}
  function seek(e){const a=audioRef.current;if(!a||!a.duration)return;const rect=e.currentTarget.getBoundingClientRect();a.currentTime=(e.clientX-rect.left)/rect.width*a.duration}
  const bg=mine?'rgba(255,255,255,.18)':dark?'#374151':'#e4e6ea'
  const fg=mine?'#fff':dark?'#e5e7eb':'#111827'
  const bar=mine?'rgba(255,255,255,.5)':dark?'#4b5563':'#d1d5db'
  const fill=mine?'#fff':'#1a73e8'
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',minWidth:180,maxWidth:240}}>
      <button onClick={toggle} style={{width:32,height:32,borderRadius:'50%',border:'none',background:bg,color:fg,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>
        <i className={`fi fi-sr-${playing?'pause':'play'}`}/>
      </button>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:4}}>
        <div onClick={seek} style={{height:3,background:bar,borderRadius:2,cursor:'pointer',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',left:0,top:0,height:'100%',width:`${progress}%`,background:fill,transition:'width .1s'}}/>
        </div>
        <span style={{fontSize:'0.65rem',color:mine?'rgba(255,255,255,.7)':'#9ca3af'}}>{fmt(current)} / {fmt(duration||0)}</span>
      </div>
      <span>🎤</span>
      <audio ref={audioRef} src={audioUrl} onTimeUpdate={onTimeUpdate} onEnded={onEnded} style={{display:'none'}}/>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DM PANEL — Voice Messages + Read Receipts ✓✓
// ─────────────────────────────────────────────────────────────
function DMPanel({me,socket,onClose,onCount,dark}) {
  const [convos,setConvos]=useState([]),[active,setActive]=useState(null)
  const [msgs,setMsgs]=useState([]),[input,setInput]=useState('')
  const [dmPickedFile,setDMPickedFile]=useState(null)
  const dmImgRef=useRef(null)
  const [load,setLoad]=useState(true),[showVoice,setShowVoice]=useState(false),[dmYtOpen,setDMYtOpen]=useState(false)
  const [lastReadAt,setLastReadAt]=useState(null)
  const bottomRef=useRef(null)
  const token=localStorage.getItem('cgz_token')
  const bg=dark?'#1e2030':'#fff',border=dark?'#374151':'#e4e6ea',txt=dark?'#e5e7eb':'#111827'

  useEffect(()=>{
    fetch(`${API}/api/messages/private/conversations`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{setConvos(d.conversations||[]);onCount(d.conversations?.reduce((s,c)=>s+(c.unread||0),0)||0)}).catch(()=>{}).finally(()=>setLoad(false))
    if(!socket) return
    const onPM=m=>{
      // Filter blocked users in DMs
      const bids=JSON.parse(localStorage.getItem('cgz_blocked_ids')||'[]')
      const senderId=m.from?._id||m.from
      if(senderId&&bids.includes(senderId.toString())) return
      // Sound preference
      const prfs=JSON.parse(localStorage.getItem('cgz_prefs')||'{}')
      if(!prfs.disablePMSound) Sounds.privateMsg()
      if(active&&(m.from===active.userId||m.to===active.userId||m.from?._id===active.userId))setMsgs(p=>[...p,m])
      loadConvos()
    }
    const onRead=({readAt})=>setLastReadAt(readAt)
    socket.on('privateMessage',onPM);socket.on('privateMessageSent',onPM);socket.on('dmMessagesRead',onRead)
    return()=>{socket.off('privateMessage',onPM);socket.off('privateMessageSent',onPM);socket.off('dmMessagesRead',onRead)}
  },[socket,active])

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'})},[msgs])

  function loadConvos(){
    fetch(`${API}/api/messages/private/conversations`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{setConvos(d.conversations||[]);onCount(d.conversations?.reduce((s,c)=>s+(c.unread||0),0)||0)}).catch(()=>{})
  }
  async function openConvo(u){
    setActive(u);setMsgs([]);setShowVoice(false);setLastReadAt(null)
    fetch(`${API}/api/messages/private/${u.userId||u._id}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setMsgs(d.messages||[])).catch(()=>{})
    fetch(`${API}/api/messages/private/read/${u.userId||u._id}`,{method:'PUT',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    socket?.emit('markDMRead',{fromUserId:u.userId||u._id})
  }
  function sendDM(e){
    e.preventDefault()
    if(!input.trim()||!active||!socket) return
    socket.emit('privateMessage',{toUserId:active.userId||active._id,content:input.trim(),type:'text'})
    setInput('')
  }
  async function sendVoiceDM(audioUrl,duration){
    setShowVoice(false)
    if(!active) return
    const d=await fetch(`${API}/api/messages/private/voice`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({toUserId:active.userId||active._id,audioUrl,duration})}).then(r=>r.json()).catch(()=>({}))
    if(d.message){setMsgs(p=>[...p,d.message]);loadConvos()}
  }
  async function sendImageDM(imageUrl, caption){
    setDMPickedFile(null)
    if(!active||!imageUrl) return
    const d=await fetch(`${API}/api/messages/private/image`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({toUserId:active.userId||active._id,imageUrl,imageCaption:caption||''})}).then(r=>r.json()).catch(()=>({}))
    if(d.message){setMsgs(p=>[...p,d.message]);loadConvos()}
  }

  const myMsgs=[...msgs].filter(m=>m.from===me?._id||m.from?._id===me?._id||m.sender?._id===me?._id)
  const lastSent=myMsgs[myMsgs.length-1]
  const lastIsRead=lastSent&&(lastSent.isRead||(lastReadAt&&new Date(lastReadAt)>new Date(lastSent.createdAt)))

  return (
    <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:bg,border:`1px solid ${border}`,borderRadius:14,width:340,height:480,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.2)',zIndex:999,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',borderBottom:`1px solid ${dark?'#374151':'#f3f4f6'}`,flexShrink:0}}>
        {active?(
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={()=>{setActive(null);setShowVoice(false)}} style={{background:'none',border:'none',cursor:'pointer',color:'#1a73e8',fontSize:13}}><i className="fi fi-sr-arrow-left"/></button>
            <img src={active.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:24,height:24,borderRadius:'50%',objectFit:'cover',flexShrink:0}} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
            <div>
              <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.88rem',color:txt}}>{active.username}</span>
              {active.isOnline&&<span style={{display:'block',fontSize:'0.6rem',color:'#22c55e',lineHeight:1}}>● Online</span>}
            </div>
          </div>
        ):<span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:txt}}><i className="fi fi-sr-envelope" style={{marginRight:7,color:'#1a73e8'}}/>Messages</span>}
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:14}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      {!active?(
        <div style={{flex:1,overflowY:'auto'}}>
          {load&&<div style={{textAlign:'center',padding:20}}><div style={{width:22,height:22,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
          {!load&&convos.length===0&&<div style={{textAlign:'center',padding:'32px 16px',color:'#9ca3af'}}><i className="fi fi-sr-envelope" style={{fontSize:28,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.875rem',fontWeight:600}}>No messages yet</p></div>}
          {convos.map(c=>(
            <div key={String(c.userId)} onClick={()=>openConvo(c)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:`1px solid ${dark?'#2a2d3e':'#f9fafb'}`,cursor:'pointer',background:c.unread>0?(dark?'#1a2340':'#f0f7ff'):'transparent',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background=dark?'#2a2d3e':'#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background=c.unread>0?(dark?'#1a2340':'#f0f7ff'):'transparent'}>
              <div style={{position:'relative',flexShrink:0}}>
                <img src={c.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${GBR(c.gender,c.rank)}`}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
                {c.isOnline&&<span style={{position:'absolute',bottom:0,right:0,width:9,height:9,background:'#22c55e',borderRadius:'50%',border:`1.5px solid ${bg}`}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.84rem',fontWeight:700,color:txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.username}</div>
                <div style={{fontSize:'0.74rem',color:'#9ca3af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:3}}>
                  {c.lastType==='voice'&&<span>🎤</span>}
                  {c.lastMessage||'...'}
                </div>
              </div>
              {c.unread>0&&<span style={{background:'#1a73e8',color:'#fff',fontSize:'0.65rem',fontWeight:700,padding:'1px 6px',borderRadius:10,flexShrink:0}}>{c.unread}</span>}
            </div>
          ))}
        </div>
      ):(
        <>
          <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
            {msgs.map((m,i)=>{
              const mine=(m.from===me?._id||m.from?._id===me?._id||m.sender?._id===me?._id)
              const isLastMsg=i===msgs.length-1
              return(
                <div key={m._id||i} style={{display:'flex',flexDirection:'column',alignItems:mine?'flex-end':'flex-start',padding:'2px 12px'}}>
                  <div style={{background:mine?'linear-gradient(135deg,#1a73e8,#1464cc)':dark?'#2a2d3e':'#f3f4f6',color:mine?'#fff':txt,borderRadius:mine?'13px 3px 13px 13px':'3px 13px 13px 13px',fontSize:'0.875rem',maxWidth:'80%',wordBreak:'break-word',overflow:'hidden'}}>
                    {m.type==='voice'
                      ?<VoiceBubble audioUrl={m.audioUrl} duration={m.duration} mine={mine} dark={dark}/>
                      :m.type==='image'
                      ?<ImageBubble src={m.content} caption={m.imageCaption} dark={dark}/>
                      :m.type==='youtube'
                      ?<YoutubeBubble url={m.content} dark={dark}/>
                      :<span style={{padding:'8px 12px',display:'block'}}>{m.content}</span>}
                  </div>
                  {mine&&isLastMsg&&(
                    <span style={{fontSize:'0.62rem',color:lastIsRead?'#1a73e8':'#9ca3af',marginTop:2}}>
                      {lastIsRead?'✓✓ Seen':'✓ Sent'}
                    </span>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </div>
          {dmYtOpen&&(
            <div style={{padding:'6px 10px',borderTop:`1px solid ${border}`,flexShrink:0,position:'relative'}}>
              <YoutubeModal dark={dark}
                onSend={(url)=>{
                  setDMYtOpen(false)
                  if(!active) return
                  const token=localStorage.getItem('cgz_token')
                  fetch(`${API}/api/messages/private/image`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
                    body:JSON.stringify({toUserId:active.userId||active._id,imageUrl:url,imageCaption:'',type:'youtube'})
                  }).then(r=>r.json()).then(d=>{if(d.message){setMsgs(p=>[...p,{...d.message,type:'youtube',content:url}]);loadConvos()}}).catch(()=>{})
                }}
                onClose={()=>setDMYtOpen(false)}
              />
            </div>
          )}
          {showVoice&&(
            <div style={{padding:'6px 10px',borderTop:`1px solid ${border}`,flexShrink:0}}>
              <InlineMicRecorder dark={dark} onSend={sendVoiceDM} onCancel={()=>setShowVoice(false)}/>
            </div>
          )}
          {/* Image picker for DM */}
          {dmPickedFile&&(
            <ImagePicker
              file={dmPickedFile}
              dark={dark}
              onSend={sendImageDM}
              onCancel={()=>setDMPickedFile(null)}
            />
          )}
          {!showVoice&&(
            <form onSubmit={sendDM} style={{display:'flex',gap:6,padding:'8px 10px',borderTop:`1px solid ${border}`,flexShrink:0,alignItems:'center'}}>
              {/* Hidden image input */}
              <input ref={dmImgRef} type="file" accept="image/*" style={{display:'none'}}
                onChange={e=>{if(e.target.files[0]){setDMPickedFile(e.target.files[0]);e.target.value=''}}}
              />
              {/* Image button */}
              <button type="button" title="Send image" onClick={()=>dmImgRef.current?.click()}
                style={{width:30,height:30,borderRadius:'50%',border:'none',background:dark?'#374151':'#f3f4f6',color:'#9ca3af',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0,transition:'all .15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='#e8f0fe';e.currentTarget.style.color='#1a73e8'}}
                onMouseLeave={e=>{e.currentTarget.style.background=dark?'#374151':'#f3f4f6';e.currentTarget.style.color='#9ca3af'}}>
                <i className="fi fi-sr-picture"/>
              </button>
              {/* YouTube in DM */}
              <button type="button" title="Send YouTube video" onClick={()=>setDMYtOpen(p=>!p)}
                style={{width:30,height:30,borderRadius:'50%',border:`1.5px solid ${dmYtOpen?'#ff0000':'transparent'}`,background:dmYtOpen?'#fff1f2':dark?'#374151':'#f3f4f6',color:dmYtOpen?'#ff0000':'#9ca3af',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0,transition:'all .15s'}}>
                <i className="fi fi-rr-youtube"/>
              </button>
              <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Send a message..."
                style={{flex:1,padding:'8px 12px',background:dark?'#2a2d3e':'#f9fafb',border:`1.5px solid ${border}`,borderRadius:20,fontSize:'0.875rem',outline:'none',color:txt,fontFamily:'Nunito,sans-serif'}}
                onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor=border}
              />
              <button type="button" onClick={()=>setShowVoice(v=>!v)} title="Voice / Mic"
                style={{width:30,height:30,borderRadius:'50%',border:`1.5px solid ${showVoice?'#ef4444':dark?'#374151':'#e4e6ea'}`,background:showVoice?'#fef2f2':dark?'#374151':'#f3f4f6',color:showVoice?'#ef4444':'#9ca3af',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0,transition:'all .15s'}}
                onMouseEnter={e=>{if(!showVoice){e.currentTarget.style.background='#fee2e2';e.currentTarget.style.color='#ef4444'}}}
                onMouseLeave={e=>{if(!showVoice){e.currentTarget.style.background=dark?'#374151':'#f3f4f6';e.currentTarget.style.color='#9ca3af'}}}>
                <i className="fi fi-sr-microphone"/>
              </button>
              <button type="submit" disabled={!input.trim()} style={{width:30,height:30,borderRadius:'50%',border:'none',background:input.trim()?'linear-gradient(135deg,#1a73e8,#1464cc)':dark?'#2a2d3e':'#f3f4f6',color:input.trim()?'#fff':'#9ca3af',cursor:input.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>
                <i className="fi fi-sr-paper-plane"/>
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}


// GIFT PANEL
// ─────────────────────────────────────────────────────────────
function GiftPanel({targetUser,myGold,onClose,onSent,socket,roomId,dark}) {
  const [gifts,setGifts]=useState([]), [cat,setCat]=useState('all'), [sel,setSel]=useState(null)
  const token=localStorage.getItem('cgz_token')
  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea', txt=dark?'#e5e7eb':'#111827'
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
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1001,background:'rgba(0,0,0,.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:bg,borderRadius:18,maxWidth:380,width:'100%',overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,.28)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:`1px solid ${dark?'#374151':'#f3f4f6'}`}}>
          <div>
            <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.95rem',color:txt}}><i className="fi fi-sr-gift" style={{marginRight:7,color:'#7c3aed'}}/>Send Gift{targetUser?` to ${targetUser.username}`:''}</div>
            <div style={{fontSize:'0.74rem',color:'#d97706',marginTop:3}}>💰 Your balance: {myGold||0} Gold</div>
          </div>
          <button onClick={onClose} style={{background:dark?'#2a2d3e':'#f3f4f6',border:'none',width:30,height:30,borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#6b7280',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
        </div>
        <div style={{display:'flex',gap:4,padding:'8px 14px',overflowX:'auto',borderBottom:`1px solid ${dark?'#374151':'#f3f4f6'}`,flexShrink:0}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:'4px 12px',borderRadius:20,border:`1.5px solid ${cat===c?'#7c3aed':border}`,background:cat===c?'#ede9fe':'none',cursor:'pointer',fontSize:'0.75rem',fontWeight:700,color:cat===c?'#7c3aed':'#6b7280',whiteSpace:'nowrap',flexShrink:0}}>
              {c.charAt(0).toUpperCase()+c.slice(1)}
            </button>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,padding:'12px 14px',maxHeight:220,overflowY:'auto'}}>
          {filtered.map(g=>(
            <div key={g._id} onClick={()=>setSel(g)} style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 6px',borderRadius:10,border:`2px solid ${sel?._id===g._id?'#7c3aed':border}`,cursor:'pointer',background:sel?._id===g._id?'#ede9fe':dark?'#2a2d3e':'#f9fafb',transition:'all .15s'}}>
              <img src={g.icon} alt={g.name} style={{width:36,height:36,objectFit:'contain',marginBottom:4}} onError={e=>e.target.style.display='none'}/>
              <span style={{fontSize:'0.65rem',fontWeight:700,color:txt,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',width:'100%'}}>{g.name}</span>
              <span style={{fontSize:'0.65rem',fontWeight:700,color:'#d97706'}}>💰{g.price}</span>
            </div>
          ))}
          {filtered.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:'20px',color:'#9ca3af',fontSize:'0.8rem'}}>No gifts available</div>}
        </div>
        <div style={{padding:'10px 14px 14px',borderTop:`1px solid ${dark?'#374151':'#f3f4f6'}`}}>
          <button onClick={send} disabled={!sel||!canAfford} style={{width:'100%',padding:'11px',borderRadius:10,border:'none',background:sel&&canAfford?'linear-gradient(135deg,#7c3aed,#5b21b6)':dark?'#2a2d3e':'#f3f4f6',color:sel&&canAfford?'#fff':'#9ca3af',fontWeight:800,cursor:sel&&canAfford?'pointer':'not-allowed',fontSize:'0.875rem',fontFamily:'Outfit,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
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
function AvatarDropdown({me,status,setStatus,onLeave,socket,dark,toggleDark}) {
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
  const bg=dark?'#1e2030':'#fff', brd=dark?'#374151':'#e4e6ea', txt=dark?'#e5e7eb':'#374151'
  return (
    <div ref={ref} style={{position:'relative',flexShrink:0}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 4px',display:'flex',alignItems:'center'}}>
        <div style={{position:'relative'}}>
          <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:30,height:30,borderRadius:'50%',objectFit:'cover',border:`2px solid ${border}`,display:'block'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
          <span style={{position:'absolute',bottom:0,right:0,width:8,height:8,background:curSt.color,borderRadius:'50%',border:'1.5px solid #fff'}}/>
        </div>
      </button>
      {open&&(
        <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:bg,border:`1px solid ${brd}`,borderRadius:13,minWidth:220,boxShadow:'0 6px 24px rgba(0,0,0,.18)',zIndex:999,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:'12px 13px 9px',borderBottom:`1px solid ${dark?'#374151':'#f3f4f6'}`}}>
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:7}}>
              <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:40,height:40,borderRadius:'50%',border:`2.5px solid ${border}`,objectFit:'cover',flexShrink:0}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
              <div style={{minWidth:0}}>
                <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:me?.nameColor||txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{me?.username}</div>
                <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}><RIcon rank={me?.rank} size={12}/><span style={{fontSize:'0.7rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
              </div>
            </div>
            {!me?.isGuest&&<div style={{display:'flex',gap:10}}>
              <div style={{display:'flex',alignItems:'center',gap:3}}><span>💰</span><span style={{fontSize:'0.72rem',fontWeight:700,color:'#d97706'}}>{me?.gold||0}</span></div>
              <div style={{display:'flex',alignItems:'center',gap:3}}><span>⭐</span><span style={{fontSize:'0.72rem',fontWeight:700,color:'#1a73e8'}}>Lv.{me?.level||1}</span></div>
            </div>}
          </div>
          <div style={{padding:'6px 8px',borderBottom:`1px solid ${dark?'#374151':'#f3f4f6'}`}}>
            <div style={{display:'flex',gap:4}}>
              {STATUSES.map(s=>(
                <button key={s.id} onClick={()=>{setStatus(s.id);socket?.emit('updateStatus',{status:s.id})}} title={s.label}
                  style={{flex:1,padding:'5px 2px',borderRadius:6,border:`1.5px solid ${status===s.id?s.color:brd}`,background:status===s.id?s.color+'18':'none',cursor:'pointer',fontSize:'0.63rem',fontWeight:600,color:status===s.id?s.color:'#6b7280',transition:'all .15s'}}>
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
              {icon:dark?'fi-sr-sun':'fi-sr-moon', label:dark?'Light Mode':'Dark Mode', onClick:()=>{toggleDark();setOpen(false)}},
              isStaff&&{icon:'fi-sr-settings',  label:'Room Options'},
              isStaff&&{icon:'fi-sr-dashboard', label:'Admin Panel',color:'#ef4444',onClick:()=>{setOpen(false);window.location.href='/admin'}},
              isOwner&&{icon:'fi-sr-cog',       label:'Site Settings',color:'#7c3aed'},
            ].filter(Boolean).map((item,i)=>(
              <button key={i} onClick={()=>{item.onClick?.();setOpen(false)}}
                style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'8px 10px',background:'none',border:'none',cursor:'pointer',color:item.color||txt,fontSize:'0.84rem',fontWeight:600,borderRadius:7,textAlign:'left',transition:'background .12s'}}
                onMouseEnter={e=>e.currentTarget.style.background=dark?'#2a2d3e':'#f3f4f6'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}
              ><i className={`fi ${item.icon}`} style={{fontSize:13,width:15,textAlign:'center',flexShrink:0}}/>{item.label}</button>
            ))}
            <div style={{borderTop:`1px solid ${dark?'#374151':'#f3f4f6'}`,margin:'4px 0'}}/>
            <button onClick={onLeave} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'8px 10px',background:'none',border:'none',cursor:'pointer',color:txt,fontSize:'0.84rem',fontWeight:600,borderRadius:7,textAlign:'left',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background=dark?'#2a2d3e':'#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='none'}><i className="fi fi-sr-arrow-left" style={{fontSize:13,width:15,textAlign:'center',flexShrink:0}}/>Leave Room</button>
            <button onClick={()=>{const t=localStorage.getItem('cgz_token');if(t)fetch(`${API}/api/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${t}`}}).catch(()=>{});localStorage.removeItem('cgz_token');nav('/login')}}
              style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'8px 10px',background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:'0.84rem',fontWeight:600,borderRadius:7,textAlign:'left',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background=dark?'#2a2d3e':'#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='none'}><i className="fi fi-sr-user-logout" style={{fontSize:13,width:15,textAlign:'center',flexShrink:0}}/>Logout</button>
            {/* Mood update */}
            <div style={{marginTop:8,padding:'6px 0 0',borderTop:`1px solid ${brd}`}}>
              <div style={{fontSize:'0.65rem',fontWeight:700,color:dark?'#6b7280':'#9ca3af',marginBottom:4,letterSpacing:'0.05em',textTransform:'uppercase'}}>Your Mood</div>
              <MoodInput me={me} socket={socket} dark={dark} brd={brd} bg={bg} txt={txt}/>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MOOD INPUT — inline mood updater inside AvatarDropdown
// ─────────────────────────────────────────────────────────────
function MoodInput({me,socket,dark,brd,bg,txt}) {
  const [mood, setMood] = useState(me?.mood||'')
  const [saved, setSaved] = useState(false)
  const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

  function saveMood() {
    const trimmed = mood.trim().slice(0,100)
    const token = localStorage.getItem('cgz_token')
    // Save via REST
    fetch(`${API}/api/users/mood`, {
      method:'POST',
      headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify({mood: trimmed})
    }).catch(()=>{})
    // Broadcast via socket for real-time room user list update
    socket?.emit('updateMood', {mood: trimmed})
    setSaved(true)
    setTimeout(()=>setSaved(false), 1800)
  }

  return (
    <div style={{display:'flex',gap:5,alignItems:'center'}}>
      <input
        value={mood} onChange={e=>setMood(e.target.value.slice(0,100))}
        onKeyDown={e=>e.key==='Enter'&&saveMood()}
        maxLength={100}
        placeholder="How are you feeling?"
        style={{flex:1,padding:'5px 8px',background:dark?'#2a2d3e':'#f9fafb',border:`1px solid ${brd}`,borderRadius:7,fontSize:'0.73rem',outline:'none',color:txt,fontFamily:'Nunito,sans-serif'}}
        onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor=brd}
      />
      <button onClick={saveMood}
        style={{padding:'5px 8px',borderRadius:7,border:'none',background:saved?'#22c55e':'#1a73e8',color:'#fff',fontSize:'0.7rem',fontWeight:700,cursor:'pointer',flexShrink:0,transition:'background .2s'}}>
        {saved?'✓':'Set'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FOOTER — Radio + User list sidebar toggle + search
// ─────────────────────────────────────────────────────────────
function Footer({showRadio,setShowRadio,showRight,setRight,notif,onSearch,dark}) {
  return (
    <div style={{background:dark?'#1e2030':'#fff',borderTop:`1px solid ${dark?'#374151':'#e4e6ea'}`,padding:'4px 10px',display:'flex',alignItems:'center',gap:4,flexShrink:0,position:'relative'}}>
      <FBtn icon="fi-sr-radio" active={showRadio} onClick={()=>setShowRadio(s=>!s)} title="Radio" dark={dark}/>
      <FBtn icon="fi-sr-search" active={false} onClick={onSearch} title="Search Messages" dark={dark}/>
      <div style={{flex:1}}/>
      <FBtn icon="fi-sr-list" active={showRight} onClick={()=>setRight(s=>!s)} title="User List" badge={notif.friends} dark={dark}/>
    </div>
  )
}
function FBtn({icon,active,onClick,title,badge,dark}) {
  return (
    <button onClick={onClick} title={title} style={{position:'relative',background:active?(dark?'#2a2d3e':'#e8f0fe'):'none',border:'none',cursor:'pointer',color:active?'#1a73e8':dark?'#6b7280':'#9ca3af',width:34,height:32,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,transition:'all .15s'}}>
      <i className={`fi ${icon}`}/>
      {badge>0&&<span style={{position:'absolute',top:4,right:4,width:7,height:7,background:'#ef4444',borderRadius:'50%',border:'1.5px solid #fff'}}/>}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// MENTION AUTOCOMPLETE
// ─────────────────────────────────────────────────────────────
function MentionList({users,query,onSelect,dark}) {
  if(!query) return null
  const matches=users.filter(u=>u.username.toLowerCase().startsWith(query.toLowerCase())).slice(0,6)
  if(!matches.length) return null
  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea', txt=dark?'#e5e7eb':'#111827'
  return (
    <div style={{position:'absolute',bottom:'calc(100% + 4px)',left:8,background:bg,border:`1px solid ${border}`,borderRadius:10,minWidth:160,boxShadow:'0 4px 16px rgba(0,0,0,.15)',overflow:'hidden',zIndex:50}}>
      {matches.map(u=>(
        <div key={u.userId||u._id} onClick={()=>onSelect(u.username)} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',cursor:'pointer',transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background=dark?'#2a2d3e':'#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:22,height:22,borderRadius:'50%',objectFit:'cover',flexShrink:0}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
          <span style={{fontSize:'0.82rem',fontWeight:700,color:txt}}>{u.username}</span>
          <RIcon rank={u.rank} size={11}/>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// REPLY BAR
// ─────────────────────────────────────────────────────────────
function ReplyBar({msg,onCancel,dark}) {
  if(!msg) return null
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'5px 12px',background:dark?'#2a2d3e':'#f0f7ff',borderTop:`1px solid ${dark?'#374151':'#dbeafe'}`,flexShrink:0}}>
      <i className="fi fi-sr-reply" style={{color:'#1a73e8',fontSize:12,flexShrink:0}}/>
      <div style={{flex:1,fontSize:'0.75rem',color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
        <span style={{fontWeight:700,color:'#1a73e8'}}>{msg.sender?.username}</span>: {msg.content}
      </div>
      <button onClick={onCancel} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:13,flexShrink:0}}><i className="fi fi-sr-cross-small"/></button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN CHATROOM
// ─────────────────────────────────────────────────────────────
export default function ChatRoom() {
  const {roomId}=useParams(), nav=useNavigate(), toast=useToast()
  const token=localStorage.getItem('cgz_token')
  const [dark, toggleDark]=useDark()

  const [me,        setMe]       =useState(null)
  const [room,      setRoom]     =useState(null)
  const [messages,  setMsgs]     =useState([])
  const [users,     setUsers]    =useState([])
  const [input,     setInput]    =useState('')
  const [typers,    setTypers]   =useState([])
  const [blockedIds,setBlockedIds]=useState(()=>{ try{return JSON.parse(localStorage.getItem('cgz_blocked_ids')||'[]')}catch{return[]} })
  const [userPrefs, setUserPrefs]=useState(()=>{ try{return JSON.parse(localStorage.getItem('cgz_prefs')||'{}')}catch{return{}} })
  const [showRight, setRight]    =useState(true)
  const [showLeft,  setLeft]     =useState(false)
  const [showRadio, setRadio]    =useState(false)
  const [showNotif, setShowNotif]=useState(false)
  const [showDM,    setShowDM]   =useState(false)
  const [showSearch,setSearch]   =useState(false)
  const [showEmoji, setEmoji]    =useState(false)
  const [showRoomVoice,setRoomVoice]=useState(false)
  const [showRoomMic,  setRoomMic]  =useState(false)   // inline mic recorder in chat
  const [showYtModal,  setYtModal]  =useState(false)   // youtube link input
  const [showAttach,   setAttach]   =useState(false)   // + attach menu open
  const [pickedFile,   setPickedFile]=useState(null)   // image file picked for preview
  const imgFileRef=useRef(null)                        // hidden file input
  const [showDJ,    setShowDJ]   =useState(false)
  const [showTheme, setShowTheme]=useState(false)
  const [showFont,  setShowFont] =useState(false)  // font picker
  const [msgFontColor,setMsgFontColor]=useState(()=>localStorage.getItem('cgz_font_color')||'')
  const [msgFontStyle,setMsgFontStyle]=useState(()=>localStorage.getItem('cgz_font_style')||'')
  const [msgFontSize, setMsgFontSize] =useState(()=>parseInt(localStorage.getItem('cgz_font_size'))||14)
  const [reportMsg,   setReportMsg]   =useState(null)   // message being reported
  const [showReportPanel, setShowReportPanel] = useState(false) // staff report panel
  const [echoTarget,  setEchoTarget]  =useState(null)   // user to echo — {_id, username, avatar}
  const [roomTheme, setRoomTheme]=useState(()=>{ try{ return JSON.parse(localStorage.getItem('cgz_room_theme'))||ROOM_THEMES[0] }catch{ return ROOM_THEMES[0] } })
  const [needPass,  setNeedPass] =useState(false)
  const [passInput, setPassInput]=useState('')
  const [replyMsg,  setReply]    =useState(null)
  const [pinnedMsg, setPinned]   =useState(null)
  const [mentionQ,  setMentionQ] =useState('')
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
  const msgRefs=useRef({})

  // Theme colors
  const bg=dark?'#161824':'#fff', headerBg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea'

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
      if(md.user){
        if(md.freshToken)localStorage.setItem('cgz_token',md.freshToken)
        setMe(md.user)
        if(md.user.username) localStorage.setItem('cgz_my_username', md.user.username)
        // Auto-detect country from IP if not set
        if(!md.user.countryCode) {
          try {
            const geoR = await fetch('https://ipapi.co/json/').catch(()=>null)
            if(geoR?.ok) {
              const geoD = await geoR.json()
              if(geoD.country_code) {
                fetch(`${API}/api/users/update-country`,{
                  method:'POST',
                  headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
                  body:JSON.stringify({countryCode:geoD.country_code,country:geoD.country_name||''})
                }).catch(()=>{})
                setMe(p=>p?{...p,countryCode:geoD.country_code,country:geoD.country_name||''}:p)
                // Also emit via socket so room user list updates instantly
                sockRef.current?.emit('updateCountry',{countryCode:geoD.country_code,country:geoD.country_name||''})
              }
            }
          } catch(_){}
        }
        // Restore font prefs from server (wins over stale localStorage)
        if(md.user.msgFontColor!==undefined){ setMsgFontColor(md.user.msgFontColor||''); localStorage.setItem('cgz_font_color',md.user.msgFontColor||'') }
        if(md.user.msgFontStyle!==undefined){ setMsgFontStyle(md.user.msgFontStyle||''); localStorage.setItem('cgz_font_style',md.user.msgFontStyle||'') }
        if(md.user.msgFontSize!==undefined){  setMsgFontSize(md.user.msgFontSize||14);   localStorage.setItem('cgz_font_size', String(md.user.msgFontSize||14)) }
        // Load preferences and blocked IDs
        if(md.user.blockedUserIds){ setBlockedIds(md.user.blockedUserIds); localStorage.setItem('cgz_blocked_ids',JSON.stringify(md.user.blockedUserIds)) }
        if(md.user.preferences){ setUserPrefs(md.user.preferences); localStorage.setItem('cgz_prefs',JSON.stringify(md.user.preferences)) }
        // Apply theme preference
        if(md.user.preferences?.theme==='dark'){ localStorage.setItem('cgz_dark','1') }
        else if(md.user.preferences?.theme==='light'){ localStorage.setItem('cgz_dark','0') }
      }
      const rd=await rr.json()
      if(!rr.ok){setErr(rd.error||'Room not found');setLoad(false);return}
      setRoom(rd.room)
      // NOTE: DO NOT pre-fetch messages here — socket 'messageHistory' event handles this
      // Pre-fetching causes a race condition where socket overwrites or duplicates messages
    } catch{setErr('Connection failed.')}
    setLoad(false)
    connectSocket()
  }

  function connectSocket() {
    sockRef.current?.disconnect()
    const s=io(API,{auth:{token},transports:['websocket','polling']})
    s.on('connect',       ()=>{setConn(true);s.emit('joinRoom',{roomId})})
    s.on('disconnect',    ()=>setConn(false))
    s.on('messageHistory',ms=>{
      // Filter out messages from blocked users
      const bids=JSON.parse(localStorage.getItem('cgz_blocked_ids')||'[]')
      const filtered=(ms||[]).filter(m=>!bids.includes(m.sender?._id?.toString()))
      setMsgs(filtered)
      const pinned=filtered.findLast?.(m=>m.isPinned)
      if(pinned)setPinned(pinned)
    })
    s.on('newMessage', m=>{
      const bids=JSON.parse(localStorage.getItem('cgz_blocked_ids')||'[]')
      if(bids.includes(m.sender?._id?.toString())) return  // block message from blocked user
      const prfs=JSON.parse(localStorage.getItem('cgz_prefs')||'{}')
      // Hide images if user pref set
      const msg = prfs.hideImagesInChat && m.type==='image' ? {...m,type:'text',content:'[Image hidden]'} : m
      setMsgs(p=>[...p,msg])
      // Sound: check mention first (uses tag sound), then room message sound
      const storedMe = localStorage.getItem('cgz_my_username')
      const isMentioned = storedMe && m.content && m.content.toLowerCase().includes(storedMe.toLowerCase())
      if(isMentioned && !prfs.disableTagSound) { Sounds.mention() }
      else if(!prfs.disableRoomAlert) { Sounds.newMessage() }
      if(m.isPinned)setPinned(m)
    })
    s.on('roomUsers', l=>{
      // Filter blocked users from sidebar (still allow them in room, just hide)
      const bids=JSON.parse(localStorage.getItem('cgz_blocked_ids')||'[]')
      setUsers((l||[]).filter(u=>!bids.includes(u.userId?.toString())))
    })
    s.on('messagePinned', m=>{setPinned(m);setMsgs(p=>p.map(x=>x._id===m._id?{...x,isPinned:true}:x))})
    s.on('messageReaction',({messageId,reactions})=>setMsgs(p=>p.map(m=>m._id===messageId?{...m,reactions}:m)))
    s.on('userJoined', u=>{
      const bids=JSON.parse(localStorage.getItem('cgz_blocked_ids')||'[]')
      if(bids.includes(u.userId?.toString())) return  // silently ignore join from blocked user
      const prfs=JSON.parse(localStorage.getItem('cgz_prefs')||'{}')
      setUsers(p=>p.find(x=>x.userId===u.userId)?p:[...p,u])
      if(!prfs.disableJoinMsg) setMsgs(p=>[...p,{_id:Date.now(),type:'system',content:`${u.username} joined`,createdAt:new Date()}])
      if(!prfs.disableJoinSound) Sounds.join()
    })
    s.on('userLeft', u=>{
      const prfs=JSON.parse(localStorage.getItem('cgz_prefs')||'{}')
      setUsers(p=>p.filter(x=>x.userId!==u.userId))
      if(!prfs.disableJoinMsg) setMsgs(p=>[...p,{_id:Date.now()+'l',type:'system',content:`${u.username} left`,createdAt:new Date()}])
      if(!prfs.disableJoinSound) Sounds.leave()
    })
    s.on('systemMessage', m=>setMsgs(p=>[...p,{_id:Date.now()+'s',type:'system',content:m.text,createdAt:new Date()}]))
    s.on('messageDeleted',({messageId})=>setMsgs(p=>p.filter(m=>m._id!==messageId)))
    // FIX: backend emits 'userTyping', not 'typing' — support both for compatibility
    s.on('userTyping',    ({username,isTyping:t})=>setTypers(p=>t?[...new Set([...p,username])]:p.filter(n=>n!==username)))
    s.on('typing',        ({username,isTyping:t})=>setTypers(p=>t?[...new Set([...p,username])]:p.filter(n=>n!==username)))
    s.on('youAreKicked',  ({reason})=>{Sounds.mute();toast?.show(reason||'You were kicked','error',5000);setTimeout(()=>nav('/chat'),2000)})
    s.on('accessDenied',  ({msg})=>{toast?.show(msg||'Access denied','error',5000);setTimeout(()=>nav('/chat'),2000)})
    s.on('roomPasswordRequired',()=>{setNeedPass(true);setLoad(false)})
    s.on('youAreMuted',   ({minutes})=>{Sounds.mute();toast?.show(`🔇 Muted for ${minutes} minutes`,'warn',6000)})
    s.on('djStarted',     ({hostName})=>toast?.show(`🎧 ${hostName} started DJ mode!`,'info',4000))
    s.on('djStopped',     ({by})=>toast?.show(`🎧 DJ mode stopped by ${by}`,'info',3000))
    s.on('djPlay',        ({track})=>toast?.show(`♫ Now Playing: ${track.title}`,'info',3000))
    s.on('levelUp',       ({level,gold})=>{Sounds.levelUp();toast?.show(`🎉 Level ${level}! +${gold} Gold`,'success',5000)})
    s.on('giftReceived',  ({gift,from})=>{Sounds.gift();toast?.show(`🎁 ${from?.username||from} sent you ${gift.name}!`,'gift',5000)})
    s.on('diceResult',({roll,won,payout,newGold})=>{
      const msg = won ? `🎲 You rolled a 6 and won ${payout} coins! 🎉` : `🎲 Rolled ${roll} — lost 100 coins. Try again!`
      toast?.show(msg, won?'success':'info', 4000)
      if(newGold!=null) setMe(p=>p?{...p,gold:newGold}:p)
    })
    s.on('diceError',({msg})=>toast?.show(msg||'Dice error','error',4000))
    s.on('kenoResult',({won,matches,total,payout,multiplier,newGold,bet})=>{
      const msg = won ? `🎰 Keno: ${matches}/${total} matched — won ${payout} coins! (${multiplier}×) 🎉` : `🎰 Keno: ${matches}/${total} matched — lost ${bet} coins`
      toast?.show(msg, won?'success':'info', 5000)
      if(newGold!=null) setMe(p=>p?{...p,gold:newGold}:p)
    })
    s.on('kenoError',({msg})=>toast?.show(msg||'Keno error','error',4000))
    s.on('spinResult',({prize,newGold})=>{
      toast?.show(`🎡 Spin: +${prize} Gold!`,'success',4000)
      if(newGold!=null) setMe(p=>p?{...p,gold:newGold}:p)
    })
    s.on('goldUpdated',({gold})=>setMe(p=>p?{...p,gold}:p))
    s.on('gamePlayed',({game,player,roll,won,payout})=>{
      // System messages are now sent by the server; this is just for non-dice games
    })
    s.on('userMuted',({userId:uid,minutes,by})=>{
      setUsers(p=>p.map(u=>(u.userId===uid||u._id===uid)?{...u,isMuted:true,muteExpiry:new Date(Date.now()+minutes*60000)}:u))
    })
    s.on('userKicked',({userId:uid,by})=>{
      setUsers(p=>p.filter(u=>u.userId!==uid&&u._id!==uid))
    })
    s.on('userStatusUpdate',({userId:uid,status})=>{
      setUsers(p=>p.map(u=>(u.userId===uid||u._id===uid)?{...u,status}:u))
    })
    s.on('friendRequest',  ({from})=>{
      toast?.show(`${from.username} sent you a friend request!`,'info',5000)
      setNotif(p=>({...p,friends:(p.friends||0)+1}))
    })
    s.on('friendAccepted', ({by})=>{
      toast?.show(`${by.username} accepted your friend request!`,'success',4000)
    })
        s.on('rankUpdated',   ({rank})=>{setMe(p=>p?{...p,rank}:p);toast?.show(`🎖️ Your rank has been updated to ${rank}!`,'success',5000)})
    s.on('siteSettingsUpdated', (settings)=>{
      if(settings.maintenanceMode) toast?.show('Site entering maintenance mode','warn',8000)
    })
    s.on('userRankChanged',({userId:uid,rank})=>{setUsers(p=>p.map(u=>u.userId===uid||u._id===uid?{...u,rank}:u));setMsgs(p=>p.map(m=>m.sender?._id===uid?{...m,sender:{...m.sender,rank}}:m))})
    s.on('error',         e=>console.error('Socket:',e))
    s.on('echoMessage',   m=>setMsgs(p=>[...p,{...m,isEcho:true,_id:m._id||('echo_'+Date.now())}]))
    sockRef.current=s
  }

  function handleTyping(e) {
    const val=e.target.value
    setInput(val)
    // Mention autocomplete: detect @word at end of input
    const match=val.match(/@(\w*)$/)
    setMentionQ(match?match[1]:null)
    if(!isTypingRef.current){isTypingRef.current=true;sockRef.current?.emit('typing',{roomId,isTyping:true})}
    clearTimeout(typingTimer.current)
    typingTimer.current=setTimeout(()=>{isTypingRef.current=false;sockRef.current?.emit('typing',{roomId,isTyping:false})},2000)
  }

  function selectMention(username) {
    setInput(p=>p.replace(/@\w*$/,'@'+username+' '))
    setMentionQ(null)
    inputRef.current?.focus()
  }

  function send(e) {
    e.preventDefault()
    const t=input.trim()
    if(!t||!sockRef.current||!connected) return
    sockRef.current.emit('sendMessage',{roomId,content:t,type:'text',replyTo:replyMsg?._id||null})
    setInput(''); setReply(null); setMentionQ(null)
    isTypingRef.current=false; sockRef.current?.emit('typing',{roomId,isTyping:false})
    inputRef.current?.focus()
  }

  function leave(){sockRef.current?.disconnect();nav('/chat')}

  // Mention: click username → add @username to input
  const handleMention=useCallback((username)=>{
    setInput(p=>p+(p.endsWith(' ')||p===''?'':'  ')+'@'+username+' ')
    inputRef.current?.focus()
  },[])

  const handleMiniCard=useCallback((user,pos)=>{setMini({user,pos});setProf(null)},[])

  function jumpToMsg(id) {
    const el=msgRefs.current[id]
    if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.style.background='rgba(26,115,232,.12)';setTimeout(()=>el.style.background='',1500)}
  }

  const myLevel=RANKS[me?.rank]?.level||1
  const isStaff=myLevel>=11
  const isBadgeUser = myLevel >= 5   // butterfly and above get font-size control

  // Load Google Fonts for selected style
  useEffect(()=>{
    if(!msgFontStyle||!GFONTS[msgFontStyle]) return
    const id='cgz-gfont-'+msgFontStyle
    if(document.getElementById(id)) return
    const link=document.createElement('link')
    link.id=id; link.rel='stylesheet'
    link.href=`https://fonts.googleapis.com/css2?family=${GFONTS[msgFontStyle]}&display=swap`
    document.head.appendChild(link)
  },[msgFontStyle])

  // Pre-load fonts seen in messages
  useEffect(()=>{
    const seen=new Set()
    messages.forEach(m=>{ if(m.sender?.msgFontStyle) seen.add(m.sender.msgFontStyle) })
    seen.forEach(styleId=>{
      if(!styleId||!GFONTS[styleId]) return
      const id='cgz-gfont-'+styleId
      if(document.getElementById(id)) return
      const link=document.createElement('link')
      link.id=id; link.rel='stylesheet'
      link.href=`https://fonts.googleapis.com/css2?family=${GFONTS[styleId]}&display=swap`
      document.head.appendChild(link)
    })
  },[messages])

  async function saveFontPrefs({ msgFontColor: c, msgFontStyle: s, msgFontSize: z }) {
    setMsgFontColor(c); setMsgFontStyle(s); setMsgFontSize(z)
    localStorage.setItem('cgz_font_color', c||'')
    localStorage.setItem('cgz_font_style', s||'')
    localStorage.setItem('cgz_font_size',  String(z||14))
    const token=localStorage.getItem('cgz_token')
    if(!token) return
    try {
      await fetch(`${API}/api/users/me/msgfontstyle`,{
        method:'PUT',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({ msgFontColor:c, msgFontStyle:s, msgFontSize:z })
      })
    } catch{}
  }

  // Poll pending report count for staff badge indicator
  useEffect(()=>{
    if(!isStaff) return
    const token=localStorage.getItem('cgz_token')
    async function fetchReportCount(){
      try {
        const r=await fetch(`${API}/api/admin/reports?status=pending`,{headers:{Authorization:`Bearer ${token}`}})
        const d=await r.json()
        setNotif(p=>({...p, reports:(d.reports||[]).length}))
      } catch{}
    }
    fetchReportCount()
    const iv=setInterval(fetchReportCount, 30000)  // poll every 30s
    return ()=>clearInterval(iv)
  },[isStaff])

  const closeAll=useCallback(()=>{setMini(null);setShowNotif(false);setShowDM(false);setEmoji(false);setShowFont(false)},[])

  if(!loading&&roomErr) return (
    <div style={{minHeight:'100vh',background:dark?'#161824':'#f8f9fa',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
      <div style={{fontSize:40}}>⚠️</div><p style={{color:dark?'#e5e7eb':'#374151',fontWeight:600}}>{roomErr}</p>
      <button onClick={()=>nav('/chat')} style={{padding:'10px 22px',borderRadius:9,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer'}}>← Back to Lobby</button>
    </div>
  )
  if(loading) return (
    <div style={{minHeight:'100vh',background:dark?'#161824':'#f8f9fa',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}><div style={{width:32,height:32,border:'3px solid #e4e6ea',borderTop:'3px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 10px'}}/><p style={{color:'#9ca3af',fontSize:'0.9rem'}}>Joining room...</p></div>
    </div>
  )

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',background:roomTheme?.bg||bg,overflow:'hidden',fontFamily:roomTheme?.font||'Nunito,sans-serif'}} onClick={closeAll}>

      {/* ── HEADER ── */}
      <div style={{height:48,background:headerBg,borderBottom:`1px solid ${border}`,display:'flex',alignItems:'center',padding:'0 8px',gap:5,flexShrink:0,boxShadow:'0 1px 3px rgba(0,0,0,.05)'}}>
        <button onClick={e=>{e.stopPropagation();setLeft(s=>!s)}} title="Menu"
          style={{background:showLeft?(dark?'#2a2d3e':'#e8f0fe'):'none',border:'none',cursor:'pointer',color:showLeft?'#1a73e8':dark?'#9ca3af':'#6b7280',width:34,height:34,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,transition:'all .15s'}}>
          <i className="fi fi-sr-bars-sort"/>
        </button>
        {/* Room name in header */}
        <div style={{flex:1,minWidth:0,textAlign:'center'}}>
          <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.92rem',color:dark?'#e5e7eb':'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>{room?.name}</span>
        </div>
        {/* RIGHT icons */}
        <div style={{position:'relative'}}>
          <HBtn icon="fi-sr-envelope" title="Messages" badge={notif.dm} active={showDM} dark={dark} onClick={e=>{e.stopPropagation();setShowDM(p=>!p);setShowNotif(false)}}/>
          {showDM&&<DMPanel me={me} socket={sockRef.current} onClose={()=>setShowDM(false)} onCount={n=>setNotif(p=>({...p,dm:n}))} dark={dark}/>}
        </div>
        <div style={{position:'relative'}}>
          <HBtn icon="fi-sc-bell-ring" title="Notifications" badge={notif.notif} active={showNotif} dark={dark} onClick={e=>{e.stopPropagation();setShowNotif(p=>!p);setShowDM(false);setShowFriends(false)}}/>
          {showNotif&&<NotifPanel onClose={()=>setShowNotif(false)} onCount={n=>setNotif(p=>({...p,notif:n}))} dark={dark}/>}
          <HBtn icon="fi-sr-user-add" title="Friend Requests" badge={notif.friends} active={showFriends} dark={dark} onClick={e=>{e.stopPropagation();setShowFriends(p=>!p);setShowNotif(false);setShowDM(false)}}/>
          {showFriends&&<FriendRequestsPanel socket={sockRef.current} onClose={()=>setShowFriends(false)} onCountChange={n=>setNotif(p=>({...p,friends:n}))}/>}
        </div>
        {isStaff&&<HBtn icon="fi-sr-flag" title="Reports" badge={notif.reports} active={showReportPanel} dark={dark} onClick={e=>{e.stopPropagation();setShowReportPanel(p=>!p)}}/>}
        <HBtn icon="fi-sr-headphones" title="DJ Room" active={showDJ} dark={dark} onClick={e=>{e.stopPropagation();setShowDJ(p=>!p)}}/>
        <HBtn icon="fi-sr-palette" title="Room Theme" active={showTheme} dark={dark} onClick={e=>{e.stopPropagation();setShowTheme(p=>!p)}}/>
        <AvatarDropdown me={me} status={status} setStatus={setStatus} onLeave={leave} socket={sockRef.current} dark={dark} toggleDark={toggleDark}/>
      </div>

      {/* ── BODY ── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {showLeft&&<LeftSidebar room={room} nav={nav} socket={sockRef.current} roomId={roomId} onClose={()=>setLeft(false)} dark={dark}/>}

        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
          {/* Search overlay */}
          {showSearch&&<SearchBar messages={messages} dark={dark} onJump={id=>{jumpToMsg(id)}} onClose={()=>setSearch(false)}/>}
          {/* Topic bar */}
          {room?.topic&&<div style={{background:dark?'#2a2d3e':'#f8f9fa',borderBottom:`1px solid ${border}`,padding:'5px 14px',fontSize:'0.78rem',color:dark?'#9ca3af':'#374151',flexShrink:0}}><i className="fi fi-sr-info" style={{marginRight:5,color:'#1a73e8'}}/>{room.topic}</div>}
          {/* Pinned message banner */}
          <PinnedBanner msg={pinnedMsg} dark={dark} onJump={()=>pinnedMsg&&jumpToMsg(pinnedMsg._id)}/>
          {/* Messages */}
          <div style={{flex:1,overflowY:'auto',padding:'8px 0',background:roomTheme?.msgBg||'transparent'}}>
            {messages.map((m,i)=>(
              <div key={m._id||i} ref={el=>el&&(msgRefs.current[m._id]=el)}>
                <Msg msg={m} myId={me?._id} myLevel={myLevel}
                  onMiniCard={handleMiniCard} onMention={handleMention}
                  socket={sockRef.current} roomId={roomId} dark={dark}
                  onReply={setReply} onReport={setReportMsg} onEcho={setEchoTarget}
                />
              </div>
            ))}
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

          {/* Reply bar */}
          <ReplyBar msg={replyMsg} onCancel={()=>setReply(null)} dark={dark}/>

          {/* INPUT BAR */}
          <div style={{borderTop:`1px solid ${border}`,padding:'7px 10px',background:headerBg,flexShrink:0,position:'relative'}}>
            {/* Mention autocomplete */}
            <MentionList users={users} query={mentionQ} onSelect={selectMention} dark={dark}/>
            {/* Emoji picker */}
            {showEmoji&&<div style={{position:'absolute',bottom:'100%',left:8}} onClick={e=>e.stopPropagation()}><EmojiPicker dark={dark} onPick={e=>{setInput(p=>p+e);setEmoji(false);inputRef.current?.focus()}}/></div>}
            {/* Font style picker */}
            {showFont&&(
              <FontStylePicker
                dark={dark}
                isGuest={me?.isGuest||!me}
                isBadgeUser={isBadgeUser}
                currentColor={msgFontColor}
                currentStyle={msgFontStyle}
                currentSize={msgFontSize}
                onSave={saveFontPrefs}
                onClose={()=>setShowFont(false)}
              />
            )}

            {/* YouTube link modal */}
            {showYtModal&&(
              <YoutubeModal dark={dark}
                onSend={(url)=>{
                  sockRef.current?.emit('sendMessage',{roomId,content:url,type:'youtube'})
                }}
                onClose={()=>setYtModal(false)}
              />
            )}
            {/* Font style picker */}
            {showFont&&(
              <FontStylePicker
                dark={dark}
                isGuest={me?.isGuest||!me}
                isBadgeUser={isBadgeUser}
                currentColor={msgFontColor}
                currentStyle={msgFontStyle}
                currentSize={msgFontSize}
                onSave={saveFontPrefs}
                onClose={()=>setShowFont(false)}
              />
            )}
            {/* Inline mic recorder */}
            {showRoomMic ? (
              <InlineMicRecorder dark={dark}
                onSend={(audioUrl,duration)=>{
                  setRoomMic(false)
                  sockRef.current?.emit('sendMessage',{roomId,content:'Voice message',type:'voice',audioUrl,duration})
                }}
                onCancel={()=>setRoomMic(false)}
              />
            ) : showRoomVoice ? (
              <VoiceRecorder dark={dark}
                onSend={async(audioUrl,duration)=>{
                  setRoomVoice(false)
                  sockRef.current?.emit('sendMessage',{roomId,content:'Voice message',type:'voice',audioUrl,duration})
                }}
                onCancel={()=>setRoomVoice(false)}
              />
            ) : (
              <form onSubmit={send} style={{display:'flex',alignItems:'center',gap:6}}>
                {/* Emoji */}
                <button type="button" title="Emoji" onClick={e=>{e.stopPropagation();setEmoji(p=>!p);setAttach(false)}} style={{background:showEmoji?(dark?'#2a2d3e':'#e8f0fe'):'none',border:'none',cursor:'pointer',color:showEmoji?'#1a73e8':dark?'#6b7280':'#9ca3af',fontSize:20,padding:'0 2px',flexShrink:0,display:'flex',alignItems:'center',borderRadius:6}}><i className="fi fi-rr-smile"/></button>
                {/* Hidden image file input */}
                <input ref={imgFileRef} type="file" accept="image/*" style={{display:'none'}}
                  onChange={e=>{ if(e.target.files[0]){setPickedFile(e.target.files[0]);e.target.value='';setAttach(false)} }}
                />
                {/* + Attach Menu */}
                <AttachMenu
                  open={showAttach}
                  onToggle={()=>{setAttach(p=>!p);setEmoji(false)}}
                  dark={dark}
                  connected={connected}
                  msgFontColor={msgFontColor}
                  onFont={()=>{setShowFont(p=>!p);setEmoji(false)}}
                  onMic={()=>{setRoomMic(true);setRoomVoice(false)}}
                  onVoice={()=>{setRoomVoice(true);setRoomMic(false)}}
                  onPhoto={()=>imgFileRef.current?.click()}
                  onYoutube={()=>setYtModal(true)}
                />
                {/* Text input — styled with active font prefs */}
                <input ref={inputRef} value={input} onChange={handleTyping}
                  placeholder={connected?'Type a message...':'Connecting...'}
                  disabled={!connected}
                  style={{
                    flex:1,padding:'9px 14px',
                    background:dark?'#2a2d3e':'#f9fafb',
                    border:`1.5px solid ${border}`,borderRadius:22,
                    color: msgFontColor||(dark?'#e5e7eb':'#111827'),
                    fontSize: (msgFontSize||14)+'px',
                    fontFamily: getFontFamily(msgFontStyle||''),
                    outline:'none',transition:'border-color .15s',
                  }}
                  onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor=border}
                />

                {/* Gift */}
                <button type="button" title="Gift" onClick={e=>{e.stopPropagation();setGiftTgt({_id:null,username:'Room'})}}
                  style={{background:'none',border:'none',cursor:'pointer',fontSize:17,padding:'0 2px',flexShrink:0,display:'flex',alignItems:'center',color:dark?'#6b7280':'#9ca3af'}}>
                  <i className="fi fi-sr-gift"/>
                </button>
                {/* Send */}
                <button type="submit" disabled={!input.trim()||!connected}
                  style={{width:36,height:36,borderRadius:'50%',border:'none',background:input.trim()&&connected?'linear-gradient(135deg,#1a73e8,#1464cc)':dark?'#2a2d3e':'#f3f4f6',color:input.trim()&&connected?'#fff':'#9ca3af',cursor:input.trim()&&connected?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0,transition:'all .15s'}}>
                  <i className="fi fi-sr-paper-plane"/>
                </button>
              </form>
            )}
          </div>
        </div>

        {showRight&&<RightSidebar users={users} myLevel={myLevel} onUserClick={u=>{setMini({user:u,pos:{x:window.innerWidth-240,y:80}});setProf(null)}} onClose={()=>setRight(false)} dark={dark}/>}
      </div>

      {/* RADIO MINI BAR — shows when station is playing even if panel closed */}
      <RadioMiniBar dark={dark}/>

      {/* FOOTER */}
      <div style={{position:'relative'}}>
        {showRadio&&<RadioPanel onClose={()=>setRadio(false)} dark={dark}/>}
        <Footer showRadio={showRadio} setShowRadio={setRadio} showRight={showRight} setRight={setRight} notif={notif} onSearch={()=>setSearch(p=>!p)} dark={dark}/>
      </div>

      {/* IMAGE PICKER OVERLAY — full-screen preview + caption + send */}
      {pickedFile&&(
        <ImagePicker
          file={pickedFile}
          dark={dark}
          onSend={(imageUrl, caption)=>{
            setPickedFile(null)
            sockRef.current?.emit('sendMessage',{roomId, content:imageUrl, type:'image', imageCaption:caption||'', replyTo:replyMsg?._id||null})
            setReply(null)
          }}
          onCancel={()=>setPickedFile(null)}
        />
      )}

      {/* OVERLAYS */}
      {miniCard&&<MiniCard user={miniCard.user} myLevel={myLevel} pos={miniCard.pos} onClose={()=>setMini(null)} onFull={()=>{setProf(miniCard.user);setMini(null)}} onGift={u=>setGiftTgt(u)} socket={sockRef.current} roomId={roomId} dark={dark} onReport={setReportMsg}/>}
      {profUser&&<ProfileModal user={profUser} myLevel={myLevel} socket={sockRef.current} roomId={roomId} onClose={()=>setProf(null)} onGift={u=>setGiftTgt(u)} dark={dark} onReport={setReportMsg}/>}
      {giftTarget&&<GiftPanel targetUser={giftTarget} myGold={me?.gold||0} onClose={()=>setGiftTgt(null)} onSent={()=>{setGiftTgt(null);toast?.show('Gift sent! 🎁','gift',3000)}} socket={sockRef.current} roomId={roomId} dark={dark}/>}

      {/* REPORT MODAL — triggered when user clicks 🚨 on a message */}
      {reportMsg&&<ReportModal msg={reportMsg} dark={dark} onClose={()=>setReportMsg(null)}/>}
      {echoTarget&&<EchoModal targetUser={echoTarget} roomId={roomId} socket={sockRef.current} dark={dark} onClose={()=>setEchoTarget(null)}/>}

      {/* REPORT PANEL — staff only, slides in from right */}
      {showReportPanel&&isStaff&&<ReportPanel dark={dark} myLevel={myLevel} socket={sockRef.current} onClose={()=>setShowReportPanel(false)}/>}

      {/* DJ PANEL */}
      {showDJ&&(
        <div onClick={()=>setShowDJ(false)} style={{position:'fixed',inset:0,zIndex:500,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div onClick={e=>e.stopPropagation()}>
            <DJPanel roomId={roomId} me={me} dark={dark} onClose={()=>setShowDJ(false)}/>
          </div>
        </div>
      )}

      {/* THEME PICKER */}
      {showTheme&&(
        <div onClick={()=>setShowTheme(false)} style={{position:'fixed',inset:0,zIndex:500,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{background:dark?'#1e2030':'#fff',border:`1px solid ${dark?'#374151':'#e4e6ea'}`,borderRadius:14,width:280,boxShadow:'0 8px 32px rgba(0,0,0,.2)',overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderBottom:`1px solid ${dark?'#374151':'#e4e6ea'}`}}>
              <span style={{fontWeight:800,fontSize:'0.9rem',color:dark?'#e5e7eb':'#111827'}}>🎨 Room Theme</span>
              <button onClick={()=>setShowTheme(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:16}}>✕</button>
            </div>
            <ThemePicker current={roomTheme} dark={dark} onSelect={t=>{setRoomTheme(t);localStorage.setItem('cgz_room_theme',JSON.stringify(t));setShowTheme(false)}}/>
          </div>
        </div>
      )}

      {/* ROOM PASSWORD MODAL */}
      {needPass&&(
        <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:dark?'#1e2030':'#fff',border:`1px solid ${dark?'#374151':'#e4e6ea'}`,borderRadius:16,maxWidth:340,width:'100%',padding:28,textAlign:'center',boxShadow:'0 16px 48px rgba(0,0,0,.28)'}}>
            <div style={{fontSize:'2.5rem',marginBottom:12}}>🔒</div>
            <h3 style={{margin:'0 0 6px',fontSize:'1.1rem',fontWeight:900,color:dark?'#e5e7eb':'#111827'}}>Password Required</h3>
            <p style={{margin:'0 0 18px',fontSize:'0.85rem',color:'#9ca3af'}}>This room is password-protected.</p>
            <input value={passInput} onChange={e=>setPassInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&passInput.trim()){ setNeedPass(false); sockRef.current?.emit('joinRoom',{roomId,enteredPassword:passInput.trim()}); setPassInput('') } }}
              placeholder="Enter room password..." type="password"
              style={{width:'100%',padding:'10px 14px',border:`1.5px solid ${dark?'#374151':'#e4e6ea'}`,borderRadius:9,fontSize:'0.9rem',outline:'none',background:dark?'#2a2d3e':'#f9fafb',color:dark?'#e5e7eb':'#111827',boxSizing:'border-box',marginBottom:12,fontFamily:'inherit'}}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor=dark?'#374151':'#e4e6ea'}
              autoFocus
            />
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>{setNeedPass(false);nav('/chat')}} style={{flex:1,padding:'10px',borderRadius:9,border:`1px solid ${dark?'#374151':'#e4e6ea'}`,background:'none',color:dark?'#9ca3af':'#6b7280',fontWeight:700,cursor:'pointer'}}>Cancel</button>
              <button onClick={()=>{if(passInput.trim()){setNeedPass(false);sockRef.current?.emit('joinRoom',{roomId,enteredPassword:passInput.trim()});setPassInput('')}}} style={{flex:1,padding:'10px',borderRadius:9,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer'}}>Join Room</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes typingDot{0%,80%,100%{transform:scale(.8);opacity:.5}40%{transform:scale(1.1);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${dark?'#374151':'#e4e6ea'};border-radius:4px}
      `}</style>
    </div>
  )
}

function HBtn({icon,title,badge,active,onClick,dark}) {
  return (
    <button onClick={onClick} title={title}
      style={{position:'relative',background:active?(dark?'#2a2d3e':'#e8f0fe'):'none',border:'none',cursor:'pointer',color:active?'#1a73e8':dark?'#9ca3af':'#9ca3af',width:34,height:34,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,transition:'all .15s',flexShrink:0}}
      onMouseEnter={e=>{e.currentTarget.style.background=dark?'#2a2d3e':'#f3f4f6';e.currentTarget.style.color='#374151'}}
      onMouseLeave={e=>{e.currentTarget.style.background=active?(dark?'#2a2d3e':'#e8f0fe'):'none';e.currentTarget.style.color=active?'#1a73e8':dark?'#9ca3af':'#9ca3af'}}
    >
      <i className={`fi ${icon}`}/>
      {badge>0&&<span style={{position:'absolute',top:5,right:5,width:7,height:7,background:'#ef4444',borderRadius:'50%',border:'1.5px solid #fff'}}/>}
    </button>
  )
}
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
function MiniCard({user,myLevel,pos,onClose,onFull,onGift,socket,roomId,onReport}) {
  if (!user) return null
  const ri=R(user.rank), bdr=GBR(user.gender,user.rank)
  const canMod=myLevel>=11&&RL(user.rank)<myLevel
  const canBan=myLevel>=12&&RL(user.rank)<myLevel
  const isOwn=myLevel>=14
  const token=localStorage.getItem('cgz_token')
  const _API=import.meta.env.VITE_API_URL||'https://chatsgenz-backend-production.up.railway.app'
  const x=Math.min(pos.x,window.innerWidth-225), y=Math.min(pos.y,window.innerHeight-340)
  function doBan(){const r=window.prompt(`Ban ${user.username}? Enter reason:`);if(r===null)return;fetch(`${_API}/api/admin/users/${user._id||user.userId}/ban`,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({reason:r||'Banned by staff',days:null})}).catch(()=>{});onClose()}
  function doRank(){const all=['guest','user','vipfemale','vipmale','butterfly','ninja','fairy','legend','bot','premium','moderator','admin','superadmin','owner'];const rl={guest:1,user:2,vipfemale:3,vipmale:4,butterfly:5,ninja:6,fairy:7,legend:8,bot:9,premium:10,moderator:11,admin:12,superadmin:13,owner:14};const allowed=myLevel>=14?all:all.filter(r=>(rl[r]||0)<myLevel);const rank=window.prompt(`Set rank for ${user.username}.\nOptions: ${allowed.join(', ')}\nType rank name:`);if(!rank||!all.includes(rank.trim().toLowerCase()))return;fetch(`${_API}/api/admin/users/${user._id||user.userId}/rank`,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({rank:rank.trim().toLowerCase()})}).catch(()=>{});onClose()}
  function doBlock(uid) {
    if(!uid) return
    const uidStr=uid.toString()
    fetch(`${_API}/api/users/block/${uidStr}`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    const cur=JSON.parse(localStorage.getItem('cgz_blocked_ids')||'[]')
    if(!cur.includes(uidStr)){const next=[...cur,uidStr];localStorage.setItem('cgz_blocked_ids',JSON.stringify(next))}
    onClose()
  }
  return (
    <div style={{position:'fixed',zIndex:9999,top:y,left:x,background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,width:218,boxShadow:'0 8px 28px rgba(0,0,0,.15)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <div style={{height:36,background:`linear-gradient(135deg,${ri.color}33,#e8f0fe)`}}/>
      <div style={{display:'flex',alignItems:'flex-end',gap:8,padding:'0 12px',marginTop:-18,marginBottom:8}}>
        <div style={{position:'relative',flexShrink:0}}>
          <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:40,height:40,borderRadius:'50%',border:`2.5px solid ${bdr}`,objectFit:'cover',background:'#fff'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
          <span style={{position:'absolute',bottom:0,right:0,width:10,height:10,background:STATUS_DOT[user.status]||STATUS_DOT.online,borderRadius:'50%',border:'2px solid #fff',display:'block'}}/>
        </div>
        <div style={{paddingBottom:2,minWidth:0,flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.875rem',color:user.nameColor||'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.username}</div>
            {user.countryCode&&user.countryCode!=='ZZ'&&<img src={`/icons/flags/${user.countryCode.toLowerCase()}.png`} alt="" style={{width:16,height:11,borderRadius:2,flexShrink:0}} onError={e=>e.target.style.display='none'}/>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:4}}><RIcon rank={user.rank} size={11}/><span style={{fontSize:'0.68rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
          {user.mood&&<div style={{fontSize:'0.65rem',color:'#9ca3af',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{moodEmoji(user.mood)} {user.mood}</div>}
        </div>
      </div>
      <div style={{padding:'0 8px 8px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
        {[
          {icon:'fi-ss-user',label:'Profile',onClick:onFull},
          {icon:'fi-sr-comments',label:'PM'},
          {icon:'fi-sr-phone-call',label:'Call',onClick:()=>{socket?.emit('callUser',{toUserId:user._id||user.userId,callType:'video',callId:`c_${Date.now()}`});onClose()}},
          {icon:'fi-sr-gift',label:'Gift',color:'#7c3aed',onClick:()=>{onGift(user);onClose()}},
          myLevel>=2&&{icon:'fi-sr-user-add',label:'Friend',color:'#059669',onClick:()=>{fetch(`${_API}/api/users/friend/${user._id||user.userId}`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{});onClose()}},
          myLevel>=2&&{icon:'fi-sr-user-block',label:'Block',color:'#6b7280',onClick:()=>doBlock(user._id||user.userId)},
          canMod&&{icon:'fi-sr-volume-mute',label:'Mute',color:'#f59e0b',onClick:()=>{socket?.emit('muteUser',{targetUserId:user._id||user.userId,roomId,minutes:30});onClose()}},
          canMod&&{icon:'fi-sr-user-slash',label:'Kick',color:'#ef4444',onClick:()=>{socket?.emit('kickUser',{targetUserId:user._id||user.userId,roomId});onClose()}},
          canBan&&{icon:'fi-sr-ban',label:'Ban',color:'#dc2626',onClick:doBan},
          isOwn&&{icon:'fi-sr-shield-check',label:'Set Rank',color:'#1a73e8',onClick:doRank},
                        myLevel>=2&&{icon:'fi-sr-user-block',label:'Block',color:'#6b7280',onClick:()=>{const uid=(user._id||user.userId)?.toString();if(!uid)return;fetch(`${_API2}/api/users/block/${uid}`,{method:'POST',headers:{Authorization:`Bearer ${_tok2}`}}).catch(()=>{});const cur=JSON.parse(localStorage.getItem('cgz_blocked_ids')||'[]');if(!cur.includes(uid)){localStorage.setItem('cgz_blocked_ids',JSON.stringify([...cur,uid]))};onClose()}},
              {icon:'fi-sr-flag',label:'Report',color:'#ef4444',onClick:()=>{onReport&&onReport({sender:user,content:'[User report]',_id:'user_'+(user._id||user.userId)});onClose()}},
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
function ProfileModal({user,myLevel,socket,roomId,onClose,onGift,onReport}) {
  if (!user) return null
  const ri=R(user.rank), bdr=GBR(user.gender,user.rank)
  const canMod=myLevel>=11&&RL(user.rank)<myLevel
  const canBan=myLevel>=12&&RL(user.rank)<myLevel
  const isOwn=myLevel>=14
  const _API2=import.meta.env.VITE_API_URL||'https://chatsgenz-backend-production.up.railway.app'
  const _tok2=localStorage.getItem('cgz_token')
  function doBan2(){const r=window.prompt(`Ban ${user.username}? Enter reason:`);if(r===null)return;fetch(`${_API2}/api/admin/users/${user._id||user.userId}/ban`,{method:'PUT',headers:{Authorization:`Bearer ${_tok2}`,'Content-Type':'application/json'},body:JSON.stringify({reason:r||'Banned by staff',days:null})}).catch(()=>{});onClose()}
  function doRank2(){const all=['guest','user','vipfemale','vipmale','butterfly','ninja','fairy','legend','bot','premium','moderator','admin','superadmin','owner'];const rl={guest:1,user:2,vipfemale:3,vipmale:4,butterfly:5,ninja:6,fairy:7,legend:8,bot:9,premium:10,moderator:11,admin:12,superadmin:13,owner:14};const allowed=myLevel>=14?all:all.filter(r=>(rl[r]||0)<myLevel);const rank=window.prompt(`Set rank for ${user.username}.\nOptions: ${allowed.join(', ')}\nType rank name:`);if(!rank||!all.includes(rank.trim().toLowerCase()))return;fetch(`${_API2}/api/admin/users/${user._id||user.userId}/rank`,{method:'PUT',headers:{Authorization:`Bearer ${_tok2}`,'Content-Type':'application/json'},body:JSON.stringify({rank:rank.trim().toLowerCase()})}).catch(()=>{});onClose()}
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
              canMod&&{icon:'fi-sr-volume-mute',label:'Mute',color:'#f59e0b',onClick:()=>{socket?.emit('muteUser',{targetUserId:user._id||user.userId,roomId,minutes:30});onClose()}},
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
  // Echo bubble for second Msg component
  if (msg.isEcho) {
    const echoTs = new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
    const fromName = msg.from?.username || '?'
    const fromAvatar = msg.from?.avatar || '/default_images/avatar/default_guest.png'
    return (
      <div style={{display:'flex',gap:8,padding:'3px 12px',alignItems:'flex-start',opacity:0.88}}>
        <img src={fromAvatar} alt="" style={{width:26,height:26,borderRadius:'50%',objectFit:'cover',border:'1.5px solid #7c3aed',flexShrink:0,marginTop:2}} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
            <span style={{fontSize:'0.78rem',fontWeight:700,color:'#7c3aed'}}>{fromName}</span>
            <span style={{fontSize:'0.62rem',color:'#7c3aed',opacity:0.7,fontWeight:600,background:'#f5f3ff',padding:'0 5px',borderRadius:6}}>👻 echo</span>
            <span style={{fontSize:'0.62rem',color:'#9ca3af'}}>{echoTs}</span>
          </div>
          <div style={{fontSize:'0.84rem',color:'#5b21b6',lineHeight:1.5,wordBreak:'break-word',background:'rgba(124,58,237,.06)',border:'1px dashed #7c3aed55',borderRadius:8,padding:'5px 10px',display:'inline-block',maxWidth:'85%',fontStyle:'italic'}}>
            {msg.content}
          </div>
        </div>
      </div>
    )
  }
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
        <div className="msg-bubble" style={{
          fontSize: (msg.sender?.msgFontSize||14)+'px',
          color: msg.sender?.msgFontColor || '#111827',
          fontFamily: getFontFamily(msg.sender?.msgFontStyle||''),
          lineHeight:1.5, wordBreak:'break-word',
        }}>
          {msg.type==='voice' ?<VoiceBubble audioUrl={msg.audioUrl} duration={msg.duration} mine={false} dark={dark}/>
          :msg.type==='youtube' ?<YoutubeBubble url={msg.content} dark={dark}/>
          :msg.type==='gift'  ?<span style={{padding:'4px 8px',display:'block'}}>🎁 {msg.content}</span>
          :msg.type==='image' ?<ImageBubble src={msg.content} caption={msg.imageCaption} dark={dark} hidden={userPrefs?.hideImagesInChat}/>
          :renderContent(msg.content)}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// USER ITEM in sidebar
// ─────────────────────────────────────────────────────────────
function UserItem({u,onClick,dark}) {
  const ri=R(u.rank), col=u.nameColor||ri.color
  const hoverBg='#f3f4f6'
  const statusColor = STATUS_DOT[u.status] || STATUS_DOT.online
  const isMutedActive = u.isMuted && (!u.muteExpiry || new Date(u.muteExpiry) > new Date())
  return (
    <div onClick={()=>onClick(u)} style={{display:'flex',alignItems:'center',gap:7,padding:'5px 10px 5px 8px',cursor:'pointer',transition:'background .12s',borderRadius:6,margin:'1px 4px'}} onMouseEnter={e=>e.currentTarget.style.background=hoverBg} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <div style={{position:'relative',flexShrink:0}}>
        <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:32,height:32,borderRadius:'50%',objectFit:'cover',border:`2px solid ${GBR(u.gender,u.rank)}`,display:'block',boxShadow:'0 0 0 1px #fff'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        <span style={{position:'absolute',bottom:-1,right:-1,width:9,height:9,background:statusColor,borderRadius:'50%',border:'2px solid #fff',display:'block'}}/>
        {isMutedActive&&<span title="Muted" style={{position:'absolute',top:-2,left:-2,width:11,height:11,background:'#ef4444',borderRadius:'50%',border:'1.5px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:6,color:'#fff',lineHeight:1}}>🔇</span>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:3}}>
          <RIcon rank={u.rank} size={11}/>
          <span style={{fontSize:'0.81rem',fontWeight:700,color:col,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username}</span>
          {u.isGuest&&<span style={{fontSize:'0.55rem',background:'#f3f4f6',color:'#9ca3af',borderRadius:3,padding:'1px 3px',fontWeight:600,flexShrink:0}}>G</span>}
        </div>
        {u.mood&&<div style={{fontSize:'0.64rem',color:'#9ca3af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:1}}>{moodEmoji(u.mood)} {u.mood}</div>}
      </div>
      {u.countryCode&&u.countryCode!=='ZZ'&&(
        <img src={`/icons/flags/${u.countryCode.toLowerCase()}.png`} alt="" style={{width:18,height:12,flexShrink:0,borderRadius:2,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RIGHT SIDEBAR
// ─────────────────────────────────────────────────────────────
function RightSidebar({users,myLevel,onUserClick,onClose,dark}) {
  const [tab,setTab]=useState('users')
  const [search,setSearch]=useState('')
  const [rankF,setRankF]=useState('all')
  const [genderF,setGenderF]=useState('all')
  const bg=dark?'#1e2030':'#fff', border=dark?'#374151':'#e4e6ea', muted=dark?'#9ca3af':'#9ca3af'

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
    {id:'friends',icon:'fi-sr-user-add',   label:'Friends'},
    {id:'search',icon:'fi-sr-search',      label:'Search'},
  ]

  return (
    <div style={{width:210,borderLeft:`1px solid ${border}`,background:bg,display:'flex',flexDirection:'column',flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',borderBottom:`1px solid ${border}`,flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} title={t.label}
            style={{flex:1,padding:'9px 2px',border:'none',background:'none',cursor:'pointer',borderBottom:`2px solid ${tab===t.id?'#1a73e8':'transparent'}`,color:tab===t.id?'#1a73e8':muted,fontSize:14,transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className={`fi ${t.icon}`}/>
          </button>
        ))}
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:muted,padding:'4px 7px',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
      </div>

      {tab==='search'&&(
        <div style={{padding:'7px 8px',borderBottom:`1px solid ${dark?'#374151':'#f3f4f6'}`,flexShrink:0}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Username..."
            style={{width:'100%',padding:'6px 10px',background:dark?'#2a2d3e':'#f9fafb',border:`1.5px solid ${border}`,borderRadius:7,fontSize:'0.8rem',outline:'none',boxSizing:'border-box',color:dark?'#e5e7eb':'#111827',marginBottom:6,fontFamily:'Nunito,sans-serif'}}
            onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor=border}
          />
          <div style={{display:'flex',gap:4}}>
            <select value={genderF} onChange={e=>setGenderF(e.target.value)} style={{flex:1,padding:'5px 4px',background:dark?'#2a2d3e':'#f9fafb',border:`1px solid ${border}`,borderRadius:6,fontSize:'0.73rem',outline:'none',color:dark?'#e5e7eb':'#374151'}}>
              <option value="all">All Gender</option>
              <option value="male">Male</option><option value="female">Female</option>
              <option value="couple">Couple</option><option value="other">Other</option>
            </select>
            <select value={rankF} onChange={e=>setRankF(e.target.value)} style={{flex:1,padding:'5px 4px',background:dark?'#2a2d3e':'#f9fafb',border:`1px solid ${border}`,borderRadius:6,fontSize:'0.73rem',outline:'none',color:dark?'#e5e7eb':'#374151'}}>
              <option value="all">All Ranks</option>
              {Object.entries(RANKS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {tab==='friends'?(<FriendsList me={me} onUserClick={onUserClick} dark={dark}/>):(
      <>
      <div style={{padding:'5px 10px 2px',fontSize:'0.63rem',fontWeight:700,color:muted,letterSpacing:'1px',textTransform:'uppercase',flexShrink:0}}>
        {tab==='staff'?'Staff':'Online'} · {filtered.length}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {filtered.length===0
          ? <p style={{textAlign:'center',color:muted,fontSize:'0.78rem',padding:'16px 10px'}}>
              {tab==='staff'?'No staff online':tab==='search'?'No results':'No users'}
            </p>
          : filtered.map((u,i)=><UserItem key={u.userId||u._id||i} u={u} onClick={onUserClick} dark={dark}/>)
        }
      </div>
      </>
      )}
    </div>
  )
}

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
          {panel==='games'&&<GamesPanel socket={socket} roomId={roomId} me={me}/>}
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

function GamesPanel({socket,roomId,me}) {
  // This is the mobile/secondary instance — same full implementation above
  const [view,setView]=useState('menu')
  const [rolling,setRolling]=useState(false)
  const [diceVal,setDiceVal]=useState(1)
  const [diceRes,setDiceRes]=useState(null)
  const [diceHistory,setDiceHistory]=useState([])
  const [kenoBet,setKenoBet]=useState(10)
  const [kenoPicks,setKenoPicks]=useState([])
  const [kenoRes,setKenoRes]=useState(null)
  const [kenoPlaying,setKenoPlaying]=useState(false)
  const [kenoReveal,setKenoReveal]=useState([])
  const dark=false,bg='#fff',border='#e4e6ea',txt='#111827',muted='#6b7280'
  const DICE_BET=100,DICE_MULT=5.7
  useEffect(()=>{
    if(!socket) return
    const onResult=data=>{
      let ticks=0
      const iv=setInterval(()=>{setDiceVal(Math.floor(Math.random()*6)+1);ticks++;if(ticks>14){clearInterval(iv);setDiceVal(data.roll);setRolling(false);setDiceRes(data);setDiceHistory(p=>[data,...p].slice(0,8))}},110)
    }
    const onErr=d=>{setRolling(false);alert(d.msg||'Dice error')}
    const onKeno=data=>{
      setKenoPlaying(false);setKenoReveal([])
      const iv=setInterval(()=>{setKenoReveal(p=>{const n=[...p,data.drawn[p.length]];if(n.length>=data.drawn.length)clearInterval(iv);return n})},120)
      setTimeout(()=>setKenoRes(data),data.drawn.length*120+200)
    }
    const onKErr=d=>{setKenoPlaying(false);alert(d.msg||'Keno error')}
    socket.on('diceResult',onResult);socket.on('diceError',onErr)
    socket.on('kenoResult',onKeno);socket.on('kenoError',onKErr)
    return ()=>{socket.off('diceResult',onResult);socket.off('diceError',onErr);socket.off('kenoResult',onKeno);socket.off('kenoError',onKErr)}
  },[socket])
  function rollDice(){if(rolling)return;setRolling(true);setDiceRes(null);setDiceVal(Math.floor(Math.random()*6)+1);socket?.emit('rollDice',{roomId})}
  function playKeno(){if(kenoPlaying||kenoPicks.length<1)return;setKenoPlaying(true);setKenoRes(null);setKenoReveal([]);socket?.emit('playKeno',{roomId,picks:kenoPicks,bet:kenoBet})}

  if(view==='dice') return (
    <div style={{padding:'10px 8px',flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
      <style>{`@keyframes diceRoll3D{0%{transform:rotate(-12deg) scale(1.08)}100%{transform:rotate(12deg) scale(0.95)}}`}</style>
      <button onClick={()=>{setView('menu');setDiceRes(null);setRolling(false)}} style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',color:muted,fontSize:'0.8rem',fontWeight:700,padding:0}}><i className="fi fi-sr-angle-left" style={{fontSize:11}}/> Back</button>
      <div style={{textAlign:'center'}}><div style={{fontSize:'1rem',fontWeight:900,color:txt,fontFamily:'Outfit,sans-serif'}}>🎲 Dice Roll</div><div style={{fontSize:'0.7rem',color:muted,marginTop:2}}>Bet 100 coins · Roll 6 to win 570 coins (5.7×)</div></div>
      <div style={{display:'flex',justifyContent:'center',padding:'14px 0',animation:diceRes?.won?'winPulse 0.6s ease':'none'}}><DiceSVG value={diceVal} size={100} rolling={rolling} won={diceRes?diceRes.won:null} dark={false}/></div>
      {diceRes&&(<div style={{borderRadius:10,padding:'10px 14px',textAlign:'center',background:diceRes.won?'#d1fae5':'#fee2e2',border:`2px solid ${diceRes.won?'#10b981':'#ef4444'}`}}><div style={{fontWeight:900,color:diceRes.won?'#065f46':'#991b1b'}}>{diceRes.won?`🎉 Rolled 6! +${diceRes.payout} coins!`:`😬 Rolled ${diceRes.roll} — Lost ${DICE_BET} coins`}</div>{diceRes.newGold!=null&&<div style={{fontSize:'0.72rem',color:muted,marginTop:4}}>Balance: <strong style={{color:'#f59e0b'}}>{diceRes.newGold}</strong> 💰</div>}</div>)}
      <button onClick={rollDice} disabled={rolling} style={{width:'100%',padding:'12px',borderRadius:11,border:'none',background:rolling?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',fontWeight:800,fontSize:'0.9rem',cursor:rolling?'wait':'pointer',boxShadow:rolling?'none':'0 4px 14px rgba(124,58,237,.4)',fontFamily:'Outfit,sans-serif'}}>{rolling?'🎲 Rolling…':'🎲 Roll for 100 coins'}</button>
      {diceHistory.length>0&&<div><div style={{fontSize:'0.65rem',fontWeight:700,color:muted,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.08em'}}>Recent</div><div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{diceHistory.map((h,i)=><div key={i} style={{padding:'3px 7px',borderRadius:6,border:`1px solid ${h.won?'#10b981':'#ef4444'}`,background:h.won?'#d1fae5':'#fee2e2',fontSize:'0.7rem',fontWeight:700,color:h.won?'#065f46':'#991b1b'}}>{['⚀','⚁','⚂','⚃','⚄','⚅'][h.roll-1]} {h.won?`+${h.payout}`:`-${DICE_BET}`}</div>)}</div></div>}
    </div>
  )

  if(view==='keno') return (
    <div style={{padding:'10px 8px',flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
      <button onClick={()=>{setView('menu');setKenoRes(null);setKenoPicks([]);setKenoReveal([])}} style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',color:muted,fontSize:'0.8rem',fontWeight:700,padding:0}}><i className="fi fi-sr-angle-left" style={{fontSize:11}}/> Back</button>
      <div style={{textAlign:'center'}}><div style={{fontSize:'1rem',fontWeight:900,color:txt,fontFamily:'Outfit,sans-serif'}}>🎰 Keno</div><div style={{fontSize:'0.7rem',color:muted,marginTop:2}}>Pick 1–10 · 10 drawn from 80 · Bet 2–1000 coins</div></div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 8px',background:'#f0f7ff',borderRadius:7,border:'1px solid #bfdbfe'}}><span style={{fontSize:'0.73rem',fontWeight:700,color:'#1a73e8'}}>{kenoPicks.length}/10 picked</span>{kenoPicks.length>0&&!kenoPlaying&&!kenoRes&&<button onClick={()=>{setKenoPicks([]);setKenoReveal([])}} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:'0.72rem',fontWeight:700}}>Clear ✕</button>}{kenoRes&&<button onClick={()=>{setKenoRes(null);setKenoPicks([]);setKenoReveal([])}} style={{background:'none',border:'none',cursor:'pointer',color:'#1a73e8',fontSize:'0.72rem',fontWeight:700}}>Play Again</button>}</div>
      <KenoGrid picks={kenoPicks} setPicks={setKenoPicks} drawn={kenoReveal.length>0?kenoReveal:null} maxPick={10} dark={false}/>
      {!kenoRes&&<div><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}><label style={{fontSize:'0.72rem',fontWeight:700,color:muted}}>Bet Amount</label><div style={{display:'flex',gap:3}}>{[2,10,50,100,500].map(v=><button key={v} onClick={()=>setKenoBet(v)} style={{padding:'2px 5px',borderRadius:4,border:`1px solid ${kenoBet===v?'#1a73e8':'#e4e6ea'}`,background:kenoBet===v?'#e8f0fe':'none',color:kenoBet===v?'#1a73e8':'#6b7280',fontSize:'0.62rem',fontWeight:700,cursor:'pointer'}}>{v}</button>)}</div></div><input type="range" min={2} max={1000} value={kenoBet} onChange={e=>setKenoBet(Number(e.target.value))} style={{width:'100%',accentColor:'#1a73e8'}}/><div style={{display:'flex',justifyContent:'space-between',fontSize:'0.67rem',color:muted}}><span>2</span><strong style={{color:'#1a73e8'}}>{kenoBet}</strong><span>1000</span></div></div>}
      {kenoRes&&<div style={{borderRadius:9,padding:'10px 12px',textAlign:'center',background:kenoRes.won?'#d1fae5':'#fee2e2',border:`2px solid ${kenoRes.won?'#10b981':'#ef4444'}`}}><div style={{fontWeight:900,color:kenoRes.won?'#065f46':'#991b1b'}}>{kenoRes.won?`🎉 ${kenoRes.matches}/${kenoRes.total} hit! +${kenoRes.payout} coins`:`😬 ${kenoRes.matches}/${kenoRes.total} — lost ${kenoRes.bet} coins`}</div>{kenoRes.newGold!=null&&<div style={{fontSize:'0.72rem',color:muted,marginTop:3}}>Balance: <strong style={{color:'#f59e0b'}}>{kenoRes.newGold}</strong> 💰</div>}</div>}
      {!kenoRes&&<button onClick={playKeno} disabled={kenoPlaying||kenoPicks.length<1} style={{width:'100%',padding:'11px',borderRadius:10,border:'none',background:(kenoPlaying||kenoPicks.length<1)?'#93c5fd':'linear-gradient(135deg,#1a73e8,#1464cc)',color:'#fff',fontWeight:800,fontSize:'0.88rem',cursor:(kenoPlaying||kenoPicks.length<1)?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif'}}>{kenoPlaying?'🎰 Drawing…':kenoPicks.length<1?'Pick numbers first':`🎰 Play — ${kenoBet} coins`}</button>}
    </div>
  )

  return (
    <div style={{padding:10,flex:1,overflowY:'auto'}}>
      <div style={{fontSize:'0.65rem',fontWeight:700,color:muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Choose a Game</div>
      {[
        {id:'dice',emoji:'🎲',label:'Dice Roll',desc:'Bet 100 · Roll 6 → 5.7× win',color:'#7c3aed',bg:'#f5f3ff'},
        {id:'spin',emoji:'🎡',label:'Daily Spin',desc:'Free spin every 24 hours',color:'#f59e0b',bg:'#fffbeb'},
        {id:'keno',emoji:'🎰',label:'Keno',desc:'Pick 1–10 · 10 drawn from 80',color:'#1a73e8',bg:'#eff6ff'},
      ].map(g=>(
        <button key={g.id} onClick={()=>setView(g.id)} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'11px 13px',background:g.bg,border:'1.5px solid transparent',borderRadius:10,cursor:'pointer',marginBottom:7,textAlign:'left',transition:'all .15s',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,.12)'}} onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'}}>
          <span style={{fontSize:24,flexShrink:0}}>{g.emoji}</span>
          <div><div style={{fontSize:'0.85rem',fontWeight:800,color:g.color,fontFamily:'Outfit,sans-serif'}}>{g.label}</div><div style={{fontSize:'0.7rem',color:muted,marginTop:1}}>{g.desc}</div></div>
          <i className="fi fi-sr-angle-right" style={{marginLeft:'auto',color:muted,fontSize:11}}/>
        </button>
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
  return (
    <div style={{position:'absolute',bottom:'100%',left:0,right:0,background:'#fff',border:'1px solid #e4e6ea',borderRadius:'12px 12px 0 0',boxShadow:'0 -6px 24px rgba(0,0,0,.18)',height:'60vh',display:'flex',flexDirection:'column',zIndex:100}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <span style={{fontSize:16}}>📻</span>
          <span style={{fontWeight:800,fontSize:'0.9rem',color:'#111827'}}>Live Radio</span>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:18,lineHeight:1}}>×</button>
      </div>
      <div style={{flex:1,overflow:'hidden'}}>
        <RadioPlayer dark={false} onClose={onClose}/>
      </div>
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
  const [convos,setConvos]=useState([]), [active,setActive]=useState(null), [msgs,setMsgs]=useState([]), [input,setInput]=useState(''), [load,setLoad]=useState(true)
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
