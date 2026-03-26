import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'
const DEFAULT_AVATAR = '/default_images/avatar/default_guest.png'

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
const RANK_LIST = Object.entries(RANKS)
const R   = r => RANKS[r] || RANKS.guest
const RL  = r => RANKS[r]?.level || 0
const GBR = (g,r) => r==='bot'?'#cccccc':({male:'#03add8',female:'#ff99ff',couple:'#9c6fde',other:'#cccccc'}[g]||'#cccccc')

const ROOM_TYPES = {
  public:  { label:'Public',   color:'#1a73e8', bg:'#e8f0fe', icon:'fi-sr-globe'       },
  private: { label:'Private',  color:'#dc2626', bg:'#fef2f2', icon:'fi-sr-lock'        },
  member:  { label:'Members',  color:'#059669', bg:'#f0fdf4', icon:'fi-sr-user-check'  },
  staff:   { label:'Staff',    color:'#d97706', bg:'#fffbeb', icon:'fi-sr-shield-check'},
  admin:   { label:'Admin',    color:'#7c3aed', bg:'#f5f3ff', icon:'fi-sr-dashboard'   },
}

// ── TOAST ──────────────────────────────────────────────────────
function TopToast({ toasts }) {
  return (
    <div style={{ position:'fixed',top:12,left:'50%',transform:'translateX(-50%)',zIndex:9999,display:'flex',flexDirection:'column',gap:6,alignItems:'center',pointerEvents:'none' }}>
      {toasts.map(t=>(
        <div key={t.id} style={{ background:t.type==='error'?'#fef2f2':t.type==='success'?'#f0fdf4':'#eff6ff', border:`1px solid ${t.type==='error'?'#fecaca':t.type==='success'?'#86efac':'#bfdbfe'}`, color:t.type==='error'?'#dc2626':t.type==='success'?'#15803d':'#1d4ed8', padding:'10px 20px',borderRadius:30,fontWeight:700,fontSize:'0.875rem',boxShadow:'0 4px 20px rgba(0,0,0,.18)',animation:'toastIn .25s ease-out',whiteSpace:'nowrap',maxWidth:'90vw',overflow:'hidden',textOverflow:'ellipsis' }}>
          {t.type==='error'?'❌':t.type==='success'?'✅':'ℹ️'} {t.msg}
        </div>
      ))}
    </div>
  )
}
function useToastTop() {
  const [toasts,setToasts]=useState([])
  const show=useCallback((msg,type='info',duration=3500)=>{
    const id=Date.now()+Math.random()
    setToasts(p=>[...p,{id,msg,type}])
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),duration)
  },[])
  return{toasts,show}
}

// ── RANK ICON ──────────────────────────────────────────────────
function RIcon({rank,size=14}){
  const ri=R(rank)
  return <img src={`/icons/ranks/${ri.icon}`} alt="" style={{width:size,height:size,objectFit:'contain',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
}

// ── TOGGLE SWITCH ─────────────────────────────────────────────
function Toggle({value,onChange}){
  return(
    <div onClick={()=>onChange(!value)} style={{width:44,height:24,borderRadius:99,background:value?'#1a73e8':'#d1d5db',position:'relative',cursor:'pointer',transition:'background .2s',flexShrink:0}}>
      <div style={{position:'absolute',top:3,left:value?21:3,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
    </div>
  )
}

// ── ADMIN BUTTON ──────────────────────────────────────────────
function AdminBtn({icon,bg,title,onClick}){
  return(
    <button onClick={onClick} title={title} style={{width:26,height:26,borderRadius:'50%',border:'none',background:bg,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,boxShadow:'0 2px 6px rgba(0,0,0,.3)',flexShrink:0}}>
      <i className={`fi ${icon}`}/>
    </button>
  )
}

// ── PASSWORD MODAL ────────────────────────────────────────────
function PassModal({room,onClose,onEnter}){
  const[val,setVal]=useState('');const[err,setErr]=useState('')
  function tryEnter(){
    if(!val.trim()){setErr('Please enter the password.');return}
    onEnter(val.trim())
  }
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1500,background:'rgba(0,0,0,.5)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:18,padding:'28px 24px',maxWidth:320,width:'100%',boxShadow:'0 24px 64px rgba(0,0,0,.22)',textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:12}}>🔒</div>
        <h3 style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1rem',color:'#111827',marginBottom:6}}>{room.name}</h3>
        <p style={{fontSize:'0.82rem',color:'#6b7280',marginBottom:16}}>This room is password protected.</p>
        {err&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'8px 12px',fontSize:'0.8rem',color:'#dc2626',marginBottom:12}}>{err}</div>}
        <input value={val} onChange={e=>{setVal(e.target.value);setErr('')}} onKeyDown={e=>e.key==='Enter'&&tryEnter()} placeholder="Enter room password" type="password" autoFocus
          style={{width:'100%',padding:'10px 13px',border:'1.5px solid #e4e6ea',borderRadius:9,fontSize:'0.875rem',outline:'none',marginBottom:12,boxSizing:'border-box',textAlign:'center',letterSpacing:4}}/>
        <button onClick={tryEnter} style={{width:'100%',padding:'11px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#1a73e8,#1464cc)',color:'#fff',fontWeight:800,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>
          Enter Room
        </button>
      </div>
    </div>
  )
}

// ── ROOM MODAL ────────────────────────────────────────────────
function RoomModal({editRoom,onClose,onSave,showToast}){
  const token=localStorage.getItem('cgz_token')
  const[saving,setSaving]=useState(false)
  const[prev,setPrev]=useState(editRoom?.icon||'')
  const[file,setFile]=useState(null)
  const[activeTab,setActiveTab]=useState('basic')
  const[form,setForm]=useState({
    name:        editRoom?.name        || '',
    description: editRoom?.description || '',
    type:        editRoom?.type        || 'public',
    minRank:     editRoom?.minRank     || 'guest',
    password:    editRoom?.password    || '',
    topic:       editRoom?.topic       || '',
    isPinned:    editRoom?.isPinned    || false,
    maxUsers:    editRoom?.maxUsers    || 500,
    permissions: {
      allowGuests:   editRoom?.permissions?.allowGuests   ?? true,
      sendMessages:  editRoom?.permissions?.sendMessages  || 'guest',
      sendImages:    editRoom?.permissions?.sendImages    || 'user',
      sendGifs:      editRoom?.permissions?.sendGifs      || 'user',
      sendGifts:     editRoom?.permissions?.sendGifts     || 'user',
      useCam:        editRoom?.permissions?.useCam        || 'user',
      makeCalls:     editRoom?.permissions?.makeCalls     || 'user',
      slowMode:      editRoom?.permissions?.slowMode      || 0,
    }
  })
  const set=(k,v)=>setForm(p=>({...p,[k]:v}))
  const setPerm=(k,v)=>setForm(p=>({...p,permissions:{...p.permissions,[k]:v}}))

  async function submit(e){
    e.preventDefault()
    if(!form.name.trim()){showToast('Room name required','error');return}
    setSaving(true)
    try{
      let iconUrl=editRoom?.icon||'/default_images/rooms/default_room.png'
      if(file){
        const fd=new FormData();fd.append('icon',file)
        const ur=await fetch(`${API}/api/upload/room-icon`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd})
        const ud=await ur.json()
        if(ur.ok&&ud.url) iconUrl=ud.url
      }
      const r=await fetch(editRoom?`${API}/api/rooms/${editRoom._id}`:`${API}/api/rooms`,{
        method:editRoom?'PUT':'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({...form,icon:iconUrl})
      })
      const d=await r.json()
      if(!r.ok){showToast(d.error||'Failed to save room','error');setSaving(false);return}
      showToast(editRoom?'Room updated!':'Room created!','success')
      onSave(d.room)
    }catch{showToast('Network error','error')}
    setSaving(false)
  }

  const inp={width:'100%',padding:'9px 12px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:9,fontSize:'0.875rem',outline:'none',color:'#111827',boxSizing:'border-box',fontFamily:'Nunito,sans-serif',transition:'border-color .15s'}
  const onF=e=>e.target.style.borderColor='#1a73e8'
  const onB=e=>e.target.style.borderColor='#e4e6ea'
  const lab={display:'block',fontSize:'0.78rem',fontWeight:700,color:'#374151',marginBottom:5}

  const TABS=[
    {id:'basic',  label:'Basic',       icon:'fi-sr-info'},
    {id:'access', label:'Access',      icon:'fi-sr-shield-check'},
    {id:'perms',  label:'Permissions', icon:'fi-sr-settings'},
  ]

  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.55)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:12}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:18,maxWidth:480,width:'100%',maxHeight:'95dvh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,.22)'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px 12px',borderBottom:'1px solid #f0f2f5',position:'sticky',top:0,background:'#fff',zIndex:5}}>
          <h2 style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1rem',color:'#111827',margin:0,display:'flex',alignItems:'center',gap:8}}>
            <i className={`fi fi-sr-${editRoom?'pencil':'plus-small'}`} style={{color:'#1a73e8'}}/>
            {editRoom?'Edit Room':'Add Room'}
          </h2>
          <button onClick={onClose} style={{background:'#f3f4f6',border:'none',width:30,height:30,borderRadius:8,cursor:'pointer',color:'#6b7280',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>
            <i className="fi fi-sr-cross-small"/>
          </button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid #f0f2f5'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{flex:1,padding:'10px 4px',border:'none',background:'none',cursor:'pointer',borderBottom:`2px solid ${activeTab===t.id?'#1a73e8':'transparent'}`,color:activeTab===t.id?'#1a73e8':'#9ca3af',fontSize:'0.82rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:5,transition:'all .15s'}}>
              <i className={`fi ${t.icon}`} style={{fontSize:13}}/>{t.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{padding:'16px 18px 20px',display:'flex',flexDirection:'column',gap:13}}>

          {/* ── BASIC TAB ── */}
          {activeTab==='basic'&&(
            <>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:60,height:60,borderRadius:12,overflow:'hidden',background:'#f3f4f6',flexShrink:0,border:'1.5px solid #e4e6ea'}}>
                  <img src={prev||'/default_images/rooms/default_room.png'} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.src='/default_images/rooms/default_room.png'}}/>
                </div>
                <label style={{flex:1,padding:'9px 12px',background:'#f0f7ff',border:'1.5px dashed #1a73e8',borderRadius:9,cursor:'pointer',fontSize:'0.8rem',color:'#1a73e8',fontWeight:700,textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  <i className="fi fi-sr-upload"/>Upload Icon
                  <input type="file" accept=".png,.jpg,.jpeg" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f){setFile(f);setPrev(URL.createObjectURL(f))}}}/>
                </label>
              </div>
              <div>
                <label style={lab}>Room Name *</label>
                <input style={inp} placeholder="e.g. Global Chat" value={form.name} onChange={e=>set('name',e.target.value)} onFocus={onF} onBlur={onB}/>
              </div>
              <div>
                <label style={lab}>Description</label>
                <textarea style={{...inp,resize:'vertical',minHeight:65,lineHeight:1.5}} placeholder="What's this room about?" value={form.description} onChange={e=>set('description',e.target.value)} onFocus={onF} onBlur={onB}/>
              </div>
              <div>
                <label style={lab}>Topic / Welcome Message</label>
                <input style={inp} placeholder="Current topic shown at top of chat..." value={form.topic} onChange={e=>set('topic',e.target.value)} onFocus={onF} onBlur={onB}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <label style={lab}>Max Users</label>
                  <input type="number" style={inp} min={2} max={1000} value={form.maxUsers} onChange={e=>set('maxUsers',parseInt(e.target.value)||500)} onFocus={onF} onBlur={onB}/>
                </div>
                <div>
                  <label style={lab}>Password <span style={{fontWeight:400,color:'#9ca3af'}}>(optional)</span></label>
                  <input style={inp} placeholder="Leave empty for no lock" value={form.password} onChange={e=>set('password',e.target.value)} onFocus={onF} onBlur={onB}/>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 13px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:9}}>
                <div style={{display:'flex',alignItems:'center',gap:9}}>
                  <i className="fi fi-sr-thumbtack" style={{color:'#f59e0b',fontSize:16}}/>
                  <div>
                    <div style={{fontSize:'0.84rem',fontWeight:700,color:'#374151'}}>Pin Room</div>
                    <div style={{fontSize:'0.7rem',color:'#9ca3af'}}>Show in Featured section</div>
                  </div>
                </div>
                <Toggle value={form.isPinned} onChange={v=>set('isPinned',v)}/>
              </div>
            </>
          )}

          {/* ── ACCESS TAB ── */}
          {activeTab==='access'&&(
            <>
              <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:10,padding:'10px 13px',fontSize:'0.8rem',color:'#1d4ed8'}}>
                Set room type and minimum rank required to enter. Users below this rank will be blocked.
              </div>
              <div>
                <label style={lab}>Room Type</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:7}}>
                  {Object.entries(ROOM_TYPES).map(([k,v])=>(
                    <button key={k} type="button" onClick={()=>set('type',k)}
                      style={{padding:'10px 6px',borderRadius:9,border:`2px solid ${form.type===k?v.color:'#e4e6ea'}`,background:form.type===k?v.bg:'#f9fafb',cursor:'pointer',transition:'all .15s',textAlign:'center'}}>
                      <i className={`fi ${v.icon}`} style={{fontSize:16,color:form.type===k?v.color:'#9ca3af',display:'block',marginBottom:4}}/>
                      <span style={{fontSize:'0.72rem',fontWeight:700,color:form.type===k?v.color:'#6b7280'}}>{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lab}>Minimum Rank to Enter</label>
                <p style={{fontSize:'0.72rem',color:'#9ca3af',marginBottom:8}}>Only users with this rank or higher can enter</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                  {RANK_LIST.map(([k,v])=>(
                    <button key={k} type="button" onClick={()=>set('minRank',k)}
                      style={{padding:'8px 4px',borderRadius:8,border:`2px solid ${form.minRank===k?v.color:'#e4e6ea'}`,background:form.minRank===k?v.color+'18':'#f9fafb',cursor:'pointer',transition:'all .12s',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                      <img src={`/icons/ranks/${v.icon}`} alt="" style={{width:22,height:22,objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
                      <span style={{fontSize:'0.6rem',fontWeight:700,color:form.minRank===k?v.color:'#6b7280',lineHeight:1.2,textAlign:'center'}}>{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 13px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:9}}>
                <div>
                  <div style={{fontSize:'0.84rem',fontWeight:700,color:'#374151'}}>Allow Guests</div>
                  <div style={{fontSize:'0.7rem',color:'#9ca3af'}}>Let unregistered users view chat</div>
                </div>
                <Toggle value={form.permissions.allowGuests} onChange={v=>setPerm('allowGuests',v)}/>
              </div>
            </>
          )}

          {/* ── PERMISSIONS TAB ── */}
          {activeTab==='perms'&&(
            <>
              <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:10,padding:'10px 13px',fontSize:'0.8rem',color:'#1d4ed8'}}>
                Set minimum rank required for each action in this room.
              </div>
              {[
                {key:'sendMessages',label:'Send Messages',   icon:'fi-sr-comment'},
                {key:'sendImages',  label:'Send Images',     icon:'fi-sr-picture'},
                {key:'sendGifs',    label:'Send GIFs',       icon:'fi-sr-gif'},
                {key:'sendGifts',   label:'Send Gifts',      icon:'fi-sr-gift'},
                {key:'useCam',      label:'Use Webcam',      icon:'fi-sr-video-camera'},
                {key:'makeCalls',   label:'Make Calls',      icon:'fi-sr-phone-call'},
              ].map(item=>(
                <div key={item.key} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'#f9fafb',border:'1px solid #e4e6ea',borderRadius:9}}>
                  <i className={`fi ${item.icon}`} style={{color:'#6b7280',fontSize:15,width:18,textAlign:'center',flexShrink:0}}/>
                  <span style={{flex:1,fontSize:'0.84rem',fontWeight:600,color:'#374151'}}>{item.label}</span>
                  <select value={form.permissions[item.key]} onChange={e=>setPerm(item.key,e.target.value)}
                    style={{padding:'5px 8px',border:'1.5px solid #e4e6ea',borderRadius:7,fontSize:'0.78rem',outline:'none',color:'#374151',background:'#fff',cursor:'pointer'}}>
                    {RANK_LIST.map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              ))}
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'#f9fafb',border:'1px solid #e4e6ea',borderRadius:9}}>
                <i className="fi fi-sr-clock" style={{color:'#6b7280',fontSize:15,width:18,textAlign:'center',flexShrink:0}}/>
                <span style={{flex:1,fontSize:'0.84rem',fontWeight:600,color:'#374151'}}>Slow Mode (seconds)</span>
                <input type="number" min={0} max={300} value={form.permissions.slowMode}
                  onChange={e=>setPerm('slowMode',parseInt(e.target.value)||0)}
                  style={{width:70,padding:'5px 8px',border:'1.5px solid #e4e6ea',borderRadius:7,fontSize:'0.84rem',outline:'none',textAlign:'center'}}/>
              </div>
            </>
          )}

          {/* Save/Cancel */}
          <div style={{display:'flex',gap:10,marginTop:4,position:'sticky',bottom:0,background:'#fff',paddingTop:8}}>
            <button type="button" onClick={onClose} style={{flex:1,padding:'11px',borderRadius:10,border:'1.5px solid #e4e6ea',background:'none',color:'#6b7280',fontWeight:700,cursor:'pointer',fontSize:'0.875rem'}}>Cancel</button>
            <button type="submit" disabled={saving} style={{flex:2,padding:'11px',borderRadius:10,border:'none',background:saving?'#9ca3af':'linear-gradient(135deg,#1a73e8,#1464cc)',color:'#fff',fontWeight:800,cursor:saving?'not-allowed':'pointer',fontSize:'0.875rem',fontFamily:'Outfit,sans-serif'}}>
              {saving?'Saving...':(editRoom?'Save Changes':'Create Room')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── ROOM CARD ─────────────────────────────────────────────────
function RoomCard({room,myLevel,onClick,onEdit,onDelete,onPin}){
  const[hov,setHov]=useState(false)
  const typeInfo=ROOM_TYPES[room.type]||ROOM_TYPES.public
  const canAdmin=myLevel>=12
  const minRankInfo=R(room.minRank)
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:'#fff',border:`1.5px solid ${hov?'#1a73e8':'#e4e6ea'}`,borderRadius:13,cursor:'pointer',transition:'all .18s',position:'relative',boxShadow:hov?'0 4px 18px rgba(26,115,232,.13)':'0 1px 4px rgba(0,0,0,.05)',transform:hov?'translateY(-2px)':'none'}}>
      {canAdmin&&hov&&(
        <div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:-10,right:-8,display:'flex',gap:4,zIndex:10}}>
          <AdminBtn icon="fi-sr-thumbtack" bg={room.isPinned?'#f59e0b':'#9ca3af'} title={room.isPinned?'Unpin':'Pin'} onClick={()=>onPin(room)}/>
          <AdminBtn icon="fi-sr-pencil"    bg="#1a73e8" title="Edit Room"   onClick={()=>onEdit(room)}/>
          <AdminBtn icon="fi-sr-trash"     bg="#ef4444" title="Delete Room" onClick={()=>onDelete(room)}/>
        </div>
      )}
      <div onClick={()=>onClick(room)} style={{display:'flex',alignItems:'center',padding:'11px 13px',gap:11}}>
        <div style={{width:56,height:56,borderRadius:11,overflow:'hidden',flexShrink:0,background:'#f3f4f6',border:'1px solid #f0f2f5'}}>
          <img src={room.icon||'/default_images/rooms/default_room.png'} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} onError={e=>{e.target.src='/default_images/rooms/default_room.png'}}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
            <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.95rem',color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{room.name}</span>
            {room.isPinned&&<i className="fi fi-sr-thumbtack" style={{fontSize:10,color:'#f59e0b',flexShrink:0}}/>}
            {room.password&&<i className="fi fi-sr-lock" style={{fontSize:10,color:'#9ca3af',flexShrink:0}}/>}
          </div>
          {room.description&&<div style={{fontSize:'0.73rem',color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:6}}>{room.description}</div>}
          <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:4,background:typeInfo.bg,color:typeInfo.color,fontSize:'0.65rem',fontWeight:700,padding:'2px 7px',borderRadius:20}}>
              <i className={`fi ${typeInfo.icon}`} style={{fontSize:9}}/>{typeInfo.label}
            </span>
            {room.minRank&&room.minRank!=='guest'&&(
              <span style={{display:'inline-flex',alignItems:'center',gap:3,background:'#f3f4f6',color:'#374151',fontSize:'0.65rem',fontWeight:700,padding:'2px 7px',borderRadius:20}}>
                <img src={`/icons/ranks/${minRankInfo.icon}`} alt="" style={{width:10,height:10,objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
                {minRankInfo.label}
              </span>
            )}
            <div style={{flex:1}}/>
            <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:'0.78rem',fontWeight:800,color:(room.currentUsers||0)>0?'#22c55e':'#9ca3af'}}>
              <i className="fi fi-sr-user" style={{fontSize:11}}/>{room.currentUsers||0}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── PROFILE DROPDOWN ──────────────────────────────────────────
function ProfileDropdown({user,onClose,onLogout}){
  const nav=useNavigate()
  const ri=R(user?.rank)
  const border=GBR(user?.gender,user?.rank)
  const isAdmin=RL(user?.rank)>=12
  return(
    <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:14,minWidth:210,boxShadow:'0 8px 32px rgba(0,0,0,.14)',zIndex:1000,overflow:'hidden'}}>
      <div style={{padding:'13px 14px 11px',borderBottom:'1px solid #f0f2f5'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <img src={user?.avatar||DEFAULT_AVATAR} alt="" style={{width:42,height:42,borderRadius:'50%',objectFit:'cover',border:`2.5px solid ${border}`,flexShrink:0}} onError={e=>{e.target.src=DEFAULT_AVATAR}}/>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.92rem',color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.username}</div>
            <div style={{display:'flex',alignItems:'center',gap:5,marginTop:3}}>
              <RIcon rank={user?.rank} size={12}/>
              <span style={{fontSize:'0.7rem',color:ri.color,fontWeight:700}}>{ri.label}</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{padding:'4px'}}>
        {[
          {icon:'fi-ss-user',label:'My Profile',onClick:()=>{onClose();nav(`/profile/${user?.username}`)}},
          isAdmin&&{icon:'fi-sr-dashboard',label:'Admin Panel',color:'#ef4444',onClick:()=>{onClose();window.location.href='/admin'}},
        ].filter(Boolean).map((item,i)=>(
          <button key={i} onClick={item.onClick}
            style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:'9px 11px',background:'none',border:'none',cursor:'pointer',color:item.color||'#374151',fontSize:'0.84rem',fontWeight:600,borderRadius:8,textAlign:'left'}}
            onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <i className={`fi ${item.icon}`} style={{fontSize:14,width:18,textAlign:'center',flexShrink:0}}/>{item.label}
          </button>
        ))}
        <div style={{height:1,background:'#f0f2f5',margin:'3px 2px'}}/>
        <button onClick={()=>{onClose();onLogout()}}
          style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:'9px 11px',background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:'0.84rem',fontWeight:600,borderRadius:8,textAlign:'left'}}
          onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
          <i className="fi fi-sr-user-logout" style={{fontSize:14,width:18,textAlign:'center',flexShrink:0}}/>Logout
        </button>
      </div>
    </div>
  )
}

// ── MAIN LOBBY ────────────────────────────────────────────────
export default function ChatLobby(){
  const[user,setUser]     =useState(null)
  const[rooms,setRooms]   =useState([])
  const[load,setLoad]     =useState(true)
  const[error,setError]   =useState('')
  const[search,setSearch] =useState('')
  const[passRoom,setPassRoom]=useState(null)
  const[dropOpen,setDrop] =useState(false)
  const[showModal,setModal]=useState(false)
  const[editRoom,setEditRoom]=useState(null)

  const dropRef=useRef(null)
  const nav=useNavigate()
  const token=localStorage.getItem('cgz_token')
  const{toasts,show:showToast}=useToastTop()
  const myLevel=RL(user?.rank)
  const canAdmin=myLevel>=12

  useEffect(()=>{
    if(!token){nav('/login');return}
    init()
    const t=setInterval(fetchRooms,20000)
    return()=>clearInterval(t)
  },[])

  useEffect(()=>{
    const fn=e=>{if(dropRef.current&&!dropRef.current.contains(e.target))setDrop(false)}
    if(dropOpen) document.addEventListener('mousedown',fn)
    return()=>document.removeEventListener('mousedown',fn)
  },[dropOpen])

  async function init(){
    try{
      const r=await fetch(`${API}/api/auth/me`,{headers:{Authorization:`Bearer ${token}`}})
      const d=await r.json()
      if(r.ok&&d.user){if(d.freshToken)localStorage.setItem('cgz_token',d.freshToken);setUser(d.user)}
      else if(r.status===401){localStorage.removeItem('cgz_token');nav('/login');return}
    }catch{}
    fetchRooms()
  }

  async function fetchRooms(){
    const tk=localStorage.getItem('cgz_token')
    if(!tk) return
    try{
      const r=await fetch(`${API}/api/rooms`,{headers:{Authorization:`Bearer ${tk}`}})
      const d=await r.json()
      if(!r.ok){
        if(r.status===401){localStorage.removeItem('cgz_token');nav('/login')}
        else setError(d.error||'Failed to load rooms')
        return
      }
      const list=d.rooms||[]
      try{
        const cr=await fetch(`${API}/api/rooms/live-counts`)
        if(cr.ok){const cd=await cr.json();if(cd.counts)list.forEach(room=>{room.currentUsers=cd.counts[room._id]||0})}
      }catch{}
      setRooms(list);setError('')
    }catch{setError('Network error - check your connection')}
    finally{setLoad(false)}
  }

  function logout(){
    if(token) fetch(`${API}/api/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    localStorage.removeItem('cgz_token');nav('/login')
  }

  function join(room){
    const typeMinLevel={staff:11,admin:12}
    const typeMin=typeMinLevel[room.type]
    if(typeMin&&myLevel<typeMin){
      const needed=Object.entries(RANKS).find(([,v])=>v.level===typeMin)?.[1]?.label||'Staff'
      showToast(`This room requires ${needed} rank or higher`,'error',4000);return
    }
    const roomMinLevel=RL(room.minRank)
    if(roomMinLevel>1&&myLevel<roomMinLevel){
      showToast(`You need ${R(room.minRank).label} rank or higher to enter this room`,'error',4000);return
    }
    if(user?.isGuest&&room.type==='private'){
      showToast('Guests cannot enter private rooms. Please register.','error',4000);return
    }
    if(room.password) setPassRoom(room)
    // Use slug if available, fallback to _id
    else nav(`/chat/${room.slug||room._id}`)
  }

  function enterPassRoom(password){
    nav(`/chat/${passRoom.slug||passRoom._id}`,{state:{enteredPassword:password}})
    setPassRoom(null)
  }

  async function handlePin(room){
    try{
      const r=await fetch(`${API}/api/rooms/${room._id}/pin`,{method:'PUT',headers:{Authorization:`Bearer ${token}`}})
      if(r.ok){const d=await r.json();showToast(d.message||'Done','success',2000);fetchRooms()}
      else showToast('Failed to pin room','error')
    }catch{showToast('Network error','error')}
  }

  async function handleDelete(room){
    if(!window.confirm(`Delete "${room.name}"? This cannot be undone.`)) return
    try{
      const r=await fetch(`${API}/api/rooms/${room._id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}})
      if(r.ok){setRooms(p=>p.filter(x=>x._id!==room._id));showToast('Room deleted','success')}
      else showToast('Failed to delete room','error')
    }catch{showToast('Network error','error')}
  }

  function handleSave(saved){
    if(!saved){fetchRooms();setModal(false);setEditRoom(null);return}
    setRooms(p=>{
      const idx=p.findIndex(r=>r._id===saved._id)
      if(idx>=0){const n=[...p];n[idx]={...saved,currentUsers:p[idx].currentUsers||0};return n}
      return[saved,...p]
    })
    setModal(false);setEditRoom(null)
    setTimeout(fetchRooms,800)
  }

  const ri=R(user?.rank)
  const border=GBR(user?.gender,user?.rank)

  // Filter rooms by search only (no type filter bar)
  let filtered=rooms.filter(r=>{
    if(!search) return true
    return r.name.toLowerCase().includes(search.toLowerCase())||(r.description||'').toLowerCase().includes(search.toLowerCase())
  })
  const pinned=filtered.filter(r=>r.isPinned)
  const regular=filtered.filter(r=>!r.isPinned)

  return(
    <div style={{minHeight:'100dvh',background:'#f0f2f5'}}>
      <TopToast toasts={toasts}/>

      {/* HEADER */}
      <header style={{background:'#fff',borderBottom:'1px solid #e4e6ea',height:52,display:'flex',alignItems:'center',padding:'0 16px',position:'sticky',top:0,zIndex:900,boxShadow:'0 1px 4px rgba(0,0,0,.07)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <img src="/favicon/favicon-192.png" alt="" style={{width:28,height:28,borderRadius:7}} onError={e=>e.target.style.display='none'}/>
          <span style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1.1rem',letterSpacing:'-0.3px'}}>
            <span style={{color:'#111827'}}>Chats</span><span style={{color:'#1a73e8'}}>GenZ</span>
          </span>
        </div>
        <div style={{flex:1}}/>
        <div ref={dropRef} style={{position:'relative'}}>
          <button onClick={()=>setDrop(o=>!o)} style={{background:'none',border:'none',cursor:'pointer',padding:2,borderRadius:'50%',display:'flex'}}>
            <div style={{position:'relative'}}>
              <img src={user?.avatar||DEFAULT_AVATAR} alt="" style={{width:34,height:34,borderRadius:'50%',objectFit:'cover',border:`2.5px solid ${border}`,display:'block'}} onError={e=>{e.target.src=DEFAULT_AVATAR}}/>
              <span style={{position:'absolute',bottom:0,right:0,width:8,height:8,background:'#22c55e',borderRadius:'50%',border:'2px solid #fff'}}/>
            </div>
          </button>
          {dropOpen&&<ProfileDropdown user={user} onClose={()=>setDrop(false)} onLogout={logout}/>}
        </div>
      </header>

      {/* SEARCH + ADD — NO TYPE FILTER BAR */}
      <div style={{background:'#fff',borderBottom:'1px solid #e4e6ea',padding:'10px 16px'}}>
        <div style={{maxWidth:860,margin:'0 auto',display:'flex',gap:8,alignItems:'center'}}>
          <div style={{flex:1,position:'relative'}}>
            <i className="fi fi-sr-search" style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:13,pointerEvents:'none'}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search rooms..."
              style={{width:'100%',padding:'8px 12px 8px 34px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:10,color:'#111827',fontSize:'0.875rem',outline:'none',boxSizing:'border-box',fontFamily:'Nunito,sans-serif'}}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
          </div>
          {canAdmin&&(
            <button onClick={()=>{setEditRoom(null);setModal(true)}}
              style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'linear-gradient(135deg,#1a73e8,#1464cc)',color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:'0.84rem',flexShrink:0,boxShadow:'0 2px 8px rgba(26,115,232,.3)',whiteSpace:'nowrap'}}>
              <i className="fi fi-sr-plus-small" style={{fontSize:14}}/><span>Add Room</span>
            </button>
          )}
        </div>
      </div>

      {/* ROOM LIST */}
      <div style={{maxWidth:860,margin:'0 auto',padding:'16px 16px 60px'}}>
        {load&&(
          <div style={{textAlign:'center',padding:'80px 0'}}>
            <div style={{width:34,height:34,border:'3px solid #e4e6ea',borderTop:'3px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 12px'}}/>
            <p style={{color:'#9ca3af',fontWeight:600,fontSize:'0.875rem'}}>Loading rooms...</p>
          </div>
        )}
        {error&&!load&&(
          <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'12px 16px',color:'#dc2626',fontSize:'0.875rem',textAlign:'center',marginBottom:16}}>
            {error} <button onClick={fetchRooms} style={{background:'none',border:'none',color:'#1a73e8',fontWeight:700,cursor:'pointer',marginLeft:6}}>Retry</button>
          </div>
        )}
        {!load&&!error&&(
          <>
            {pinned.length>0&&(
              <section style={{marginBottom:24}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                  <i className="fi fi-sr-thumbtack" style={{fontSize:12,color:'#f59e0b'}}/>
                  <span style={{fontSize:'0.7rem',fontWeight:800,color:'#f59e0b',letterSpacing:'1.5px',textTransform:'uppercase'}}>Featured</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:7}}>
                  {pinned.map(r=><RoomCard key={r._id} room={r} myLevel={myLevel} onClick={join} onEdit={r=>{setEditRoom(r);setModal(false)}} onDelete={handleDelete} onPin={handlePin}/>)}
                </div>
              </section>
            )}
            {regular.length===0&&pinned.length===0?(
              <div style={{textAlign:'center',padding:'60px 20px'}}>
                <i className="fi fi-sr-search" style={{fontSize:38,color:'#d1d5db',display:'block',marginBottom:10}}/>
                <p style={{color:'#9ca3af',fontWeight:700,fontSize:'0.9rem'}}>{search?'No rooms match your search':'No rooms yet'}</p>
                {canAdmin&&!search&&(
                  <button onClick={()=>{setEditRoom(null);setModal(true)}} style={{marginTop:14,padding:'10px 20px',borderRadius:10,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>
                    <i className="fi fi-sr-plus-small" style={{marginRight:6}}/>Create First Room
                  </button>
                )}
              </div>
            ):regular.length>0&&(
              <section>
                {pinned.length>0&&(
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                    <i className="fi fi-sr-apps" style={{fontSize:12,color:'#9ca3af'}}/>
                    <span style={{fontSize:'0.7rem',fontWeight:800,color:'#9ca3af',letterSpacing:'1.5px',textTransform:'uppercase'}}>All Rooms</span>
                  </div>
                )}
                <div style={{display:'flex',flexDirection:'column',gap:7}}>
                  {regular.map(r=><RoomCard key={r._id} room={r} myLevel={myLevel} onClick={join} onEdit={r=>{setEditRoom(r);setModal(false)}} onDelete={handleDelete} onPin={handlePin}/>)}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {passRoom&&<PassModal room={passRoom} onClose={()=>setPassRoom(null)} onEnter={enterPassRoom}/>}
      {(showModal||editRoom)&&<RoomModal editRoom={editRoom||null} onClose={()=>{setModal(false);setEditRoom(null)}} onSave={handleSave} showToast={showToast}/>}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      `}</style>
    </div>
  )
}
