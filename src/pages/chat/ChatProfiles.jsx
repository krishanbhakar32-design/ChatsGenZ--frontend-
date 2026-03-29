// ============================================================
// ChatProfiles.jsx — User profile overlays and mini-cards
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { API, R, RL, GBR, isStaff, isAdmin, resolveNameColor } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'

function MiniCard({user,myLevel,pos,onClose,onFull,onGift,socket,roomId}) {
  if (!user) return null
  const ri=R(user.rank), bdr=GBR(user.gender,user.rank)
  const canMod=myLevel>=11&&RL(user.rank)<myLevel
  const canBan=myLevel>=12&&RL(user.rank)<myLevel
  const token=localStorage.getItem('cgz_token')
  const cardW=224, cardH=340
  const x=Math.min(Math.max(pos.x,4),window.innerWidth-cardW-4)
  const y=Math.min(Math.max(pos.y,4),window.innerHeight-cardH-4)
  const hasBg=!!(user.coverImage||user.profileBackground||user.cardBackground)
  const bannerBg = user.coverImage||user.profileBackground||user.cardBackground
  return (
    <div style={{position:'fixed',zIndex:9999,top:y,left:x,background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,width:cardW,boxShadow:'0 8px 28px rgba(0,0,0,.18)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      {/* Banner */}
      <div style={{height:52,position:'relative',background:hasBg?`url(${bannerBg}) center/cover no-repeat`:`linear-gradient(135deg,${ri.color}55,${ri.color}22,#e8f0fe)`,flexShrink:0}}>
        {hasBg&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.18)'}}/>}
        <button onClick={onClose} style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,.35)',border:'none',width:20,height:20,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,zIndex:1}}>✕</button>
      </div>
      {/* Avatar — below banner, clear of text */}
      <div style={{padding:'0 10px',marginTop:-22,marginBottom:4,position:'relative',zIndex:2,display:'flex',alignItems:'flex-end'}}>
        <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt=""
          style={{width:44,height:44,borderRadius:'50%',border:`2.5px solid ${bdr}`,objectFit:'cover',background:'#fff',flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,.15)'}}
          onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
      </div>
      {/* Username + rank — fully below avatar row */}
      <div style={{padding:'0 10px 6px',minWidth:0}}>
        <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.875rem',color:resolveNameColor(user.nameColor, ri.color),overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:1.25}}>{user.username}</div>
        <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}><RIcon rank={user.rank} size={12}/><span style={{fontSize:'0.65rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
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
          canBan&&{icon:'fi-sr-ban',label:'Ban',color:'#dc2626',onClick:()=>{socket?.emit('banUser',{targetUserId:user._id||user.userId,roomId});onClose()}},
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
// PROFILE MODAL
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// SELF PROFILE OVERLAY — editable, opens as overlay not a page
// ─────────────────────────────────────────────────────────────
function SelfProfileOverlay({user,onClose,onUpdated}) {
  const [mood,setMood]=useState(user?.mood||'')
  const [about,setAbout]=useState(user?.about||'')
  const [saving,setSaving]=useState(false)
  const [ok,setOk]=useState('')
  const ri=R(user?.rank), bdr=GBR(user?.gender,user?.rank)

  async function save(field,value) {
    setSaving(true); setOk('')
    const token=localStorage.getItem('cgz_token')
    try {
      const r=await fetch(`${API}/api/users/me`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({[field]:value})})
      const d=await r.json()
      if(r.ok){setOk('Saved!');onUpdated?.(d.user);setTimeout(()=>setOk(''),2000)}
    } catch(e){}
    setSaving(false)
  }

  async function uploadAvatar(file) {
    setSaving(true)
    const token=localStorage.getItem('cgz_token')
    const fd=new FormData(); fd.append('avatar',file)
    try {
      const r=await fetch(`${API}/api/upload/avatar`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd})
      const d=await r.json()
      if(r.ok&&d.url){onUpdated?.({...user,avatar:d.url});setOk('Avatar updated!');setTimeout(()=>setOk(''),2500)}
    } catch(e){}
    setSaving(false)
  }

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1200,background:'rgba(0,0,0,.55)',backdropFilter:'blur(5px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:18,maxWidth:360,width:'100%',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.25)',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
        {/* Banner */}
        <div style={{height:80,background:`linear-gradient(135deg,${ri.color}66,#e8f0fe)`,position:'relative',flexShrink:0}}>
          <button onClick={onClose} style={{position:'absolute',top:10,right:10,background:'rgba(255,255,255,.85)',border:'none',width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>
            <i className="fi fi-sr-cross-small"/>
          </button>
        </div>
        {/* Avatar + name */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginTop:-40,padding:'0 18px',flexShrink:0}}>
          <label style={{cursor:'pointer',position:'relative'}}>
            <img src={user?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:80,height:80,borderRadius:'50%',border:`3px solid ${bdr}`,objectFit:'cover',background:'#fff'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
            <div style={{position:'absolute',bottom:2,right:2,width:22,height:22,borderRadius:'50%',background:'#1a73e8',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff'}}>
              <i className="fi fi-sr-camera" style={{fontSize:9,color:'#fff'}}/>
            </div>
            <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f)uploadAvatar(f);e.target.value=''}}/>
          </label>
          <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1rem',color:user?.nameColor||'#111827',marginTop:8}}>{user?.username}</div>
          <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:4}}><RIcon rank={user?.rank} size={12}/><span style={{fontSize:'0.72rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
        </div>
        {/* Editable fields */}
        <div style={{flex:1,overflowY:'auto',padding:'10px 18px 18px'}}>
          {ok&&<div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'6px 12px',fontSize:'0.78rem',color:'#15803d',marginBottom:10,textAlign:'center'}}>{ok}</div>}
          {/* Stats */}
          <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:14}}>
            {[{l:'Level',v:user?.level||1,c:'#1a73e8'},{l:'Gold',v:user?.gold||0,c:'#d97706'},{l:'Messages',v:user?.totalMessages||0,c:'#7c3aed'}].map(s=>(
              <div key={s.l} style={{textAlign:'center',background:'#f9fafb',borderRadius:8,padding:'5px 10px',flex:1}}>
                <div style={{fontSize:'0.58rem',color:'#9ca3af'}}>{s.l}</div>
                <div style={{fontSize:'0.88rem',fontWeight:800,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>
          {/* Mood */}
          <label style={{display:'block',fontSize:'0.72rem',fontWeight:700,color:'#6b7280',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Mood / Status</label>
          <div style={{display:'flex',gap:6,marginBottom:12}}>
            <input value={mood} onChange={e=>setMood(e.target.value)} maxLength={80} placeholder="What's on your mind?"
              style={{flex:1,padding:'8px 12px',border:'1.5px solid #e4e6ea',borderRadius:9,fontSize:'0.85rem',outline:'none',fontFamily:'Nunito,sans-serif',color:'#111827'}}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
            <button onClick={()=>save('mood',mood)} disabled={saving}
              style={{padding:'8px 12px',borderRadius:9,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.78rem',flexShrink:0}}>Save</button>
          </div>
          {/* About */}
          <label style={{display:'block',fontSize:'0.72rem',fontWeight:700,color:'#6b7280',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>About Me</label>
          <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:4}}>
            <textarea value={about} onChange={e=>setAbout(e.target.value)} maxLength={300} rows={3} placeholder="Tell others about yourself..."
              style={{padding:'8px 12px',border:'1.5px solid #e4e6ea',borderRadius:9,fontSize:'0.85rem',outline:'none',fontFamily:'Nunito,sans-serif',resize:'vertical',color:'#111827',lineHeight:1.5}}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
            <button onClick={()=>save('about',about)} disabled={saving}
              style={{padding:'8px',borderRadius:9,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.82rem'}}>Save About</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileModal({user,myLevel,socket,roomId,onClose,onGift}) {
  if (!user) return null
  const ri=R(user.rank), bdr=GBR(user.gender,user.rank)
  const canMod=myLevel>=11&&RL(user.rank)<myLevel
  const canBan=myLevel>=12&&RL(user.rank)<myLevel
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.45)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:18,maxWidth:340,width:'100%',overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,.18)'}}>
        <div style={{height:88,background:`linear-gradient(135deg,${ri.color}44,#e8f0fe)`,position:'relative'}}>
          <button onClick={onClose} style={{position:'absolute',top:10,right:10,background:'rgba(255,255,255,.8)',border:'none',width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
          {user.countryCode&&user.countryCode!=='ZZ'&&<img src={`/icons/flags/${user.countryCode.toUpperCase()}.png`} alt="" style={{position:'absolute',bottom:10,right:12,width:22,height:14,borderRadius:2}} onError={e=>e.target.style.display='none'}/>}
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
// MESSAGE — system messages styled like adultchat
// ─────────────────────────────────────────────────────────────

export { MiniCard, SelfProfileOverlay, ProfileModal }
