// ============================================================
// ChatSocial.jsx — Friends, Notifications, Direct Messages panels
// UPDATED: DM as bottom popup with minimize, Friend req with Ignore,
//          Notifications with rank icons, all theme synced, mobile first
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { API, R, GBR } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'

function useAnchorStyle(anchorRef, panelWidth) {
  const [style, setStyle] = useState({ position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 })
  useEffect(() => {
    if (!anchorRef?.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    const pw = Math.min(panelWidth, window.innerWidth * 0.94)
    let left = center - pw / 2
    if (left < 6) left = 6
    if (left + pw > window.innerWidth - 6) left = window.innerWidth - pw - 6
    setStyle({ position: 'fixed', top: rect.bottom + 6, left, width: pw, zIndex: 9999 })
  }, [anchorRef, panelWidth])
  return style
}

// ─────────────────────────────────────────────────────────────
// FRIEND REQUEST PANEL — Accept, Decline, Ignore
// ─────────────────────────────────────────────────────────────
function FriendReqPanel({ onClose, onCount, anchorRef, tObj }) {
  const [reqs, setReqs] = useState([]), [load, setLoad] = useState(true)
  const token = localStorage.getItem('cgz_token')
  const anchorStyle = useAnchorStyle(anchorRef, 320)
  const th = { bg: tObj?.bg_header||'#1a1a2e', bg2: tObj?.bg_chat||'#151515', text: tObj?.text||'#fff', accent: tObj?.accent||'#03add8', border: tObj?.default_color||'#222' }

  function load_reqs() {
    fetch(`${API}/api/users/me/friends`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(d=>{ const p=(d.requests||[]).filter(r=>r.status==='pending'); setReqs(p); onCount(p.length) }).catch(()=>{}).finally(()=>setLoad(false))
  }
  useEffect(()=>{ load_reqs() },[])

  async function accept(uid) { await fetch(`${API}/api/users/friend/${uid}/accept`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{}); load_reqs() }
  async function decline(uid) { await fetch(`${API}/api/users/friend/${uid}/decline`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{}); load_reqs() }
  async function ignore(uid) {
    await fetch(`${API}/api/users/friend/${uid}/decline`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    await fetch(`${API}/api/users/ignore/${uid}`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    load_reqs()
  }

  return (
    <div style={{...anchorStyle,background:th.bg,border:`1px solid ${th.border}44`,borderRadius:14,maxHeight:420,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.5)'}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 13px',borderBottom:`1px solid ${th.border}33`,flexShrink:0}}>
        <span style={{fontWeight:800,fontSize:'0.88rem',color:th.text}}><i className="fa-solid fa-user-plus" style={{marginRight:7,color:th.accent}}/>Friend Requests</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:th.text+'66',fontSize:13}}><i className="fa-solid fa-xmark"/></button>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load&&<div style={{textAlign:'center',padding:20}}><div style={{width:20,height:20,border:`2px solid ${th.border}`,borderTop:`2px solid ${th.accent}`,borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
        {!load&&reqs.length===0&&<div style={{textAlign:'center',padding:'28px 16px',color:th.text+'55'}}><i className="fa-solid fa-user-plus" style={{fontSize:26,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.84rem',fontWeight:600,margin:0}}>No pending requests</p></div>}
        {reqs.map(req=>(
          <div key={req._id||req.from?._id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 13px',borderBottom:`1px solid ${th.border}22`}}>
            <img src={req.from?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:38,height:38,borderRadius:'50%',objectFit:'cover',border:`2px solid ${GBR(req.from?.gender,req.from?.rank)}`,flexShrink:0}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}><RIcon rank={req.from?.rank} size={13}/><span style={{fontSize:'0.84rem',fontWeight:700,color:R(req.from?.rank).color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{req.from?.username}</span></div>
              <div style={{fontSize:'0.68rem',color:th.text+'55'}}>{R(req.from?.rank).label}</div>
            </div>
            <div style={{display:'flex',gap:4,flexShrink:0}}>
              <button onClick={()=>accept(req.from?._id)} title="Accept" style={{width:30,height:30,borderRadius:8,border:'none',background:'#22c55e22',color:'#22c55e',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}><i className="fa-solid fa-check"/></button>
              <button onClick={()=>decline(req.from?._id)} title="Decline" style={{width:30,height:30,borderRadius:8,border:`1px solid ${th.border}44`,background:'transparent',color:th.text+'66',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}><i className="fa-solid fa-xmark"/></button>
              <button onClick={()=>ignore(req.from?._id)} title="Ignore/Block" style={{width:30,height:30,borderRadius:8,border:'none',background:'#ef444422',color:'#ef4444',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}><i className="fa-solid fa-ban"/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS PANEL
// ─────────────────────────────────────────────────────────────
function NotifPanel({ onClose, onCount, anchorRef, tObj }) {
  const [list, setList] = useState([]), [load, setLoad] = useState(true)
  const token = localStorage.getItem('cgz_token')
  const anchorStyle = useAnchorStyle(anchorRef, 320)
  const th = { bg: tObj?.bg_header||'#1a1a2e', bg2: tObj?.bg_chat||'#151515', text: tObj?.text||'#fff', accent: tObj?.accent||'#03add8', border: tObj?.default_color||'#222' }

  useEffect(()=>{
    fetch(`${API}/api/notifications`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{setList(d.notifications||[]);onCount(d.unreadCount||0)}).catch(()=>{}).finally(()=>setLoad(false))
  },[])

  async function markAll(){ await fetch(`${API}/api/notifications/read-all`,{method:'PUT',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{}); setList(p=>p.map(n=>({...n,isRead:true}))); onCount(0) }

  const ICONS = { gift:{i:'fa-solid fa-gift',c:'#ec4899'}, friend:{i:'fa-solid fa-user-plus',c:'#22c55e'}, like:{i:'fa-solid fa-heart',c:'#ef4444'}, badge:{i:'fa-solid fa-medal',c:'#f59e0b'}, levelup:{i:'fa-solid fa-arrow-up',c:'#8b5cf6'}, rank:{i:'fa-solid fa-crown',c:'#f59e0b'}, mute:{i:'fa-solid fa-microphone-slash',c:'#ef4444'}, unmute:{i:'fa-solid fa-microphone',c:'#22c55e'}, default:{i:'fa-solid fa-bell',c:th.accent} }
  const unread = list.filter(n=>!n.isRead).length

  return (
    <div style={{...anchorStyle,background:th.bg,border:`1px solid ${th.border}44`,borderRadius:14,maxHeight:420,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.5)'}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 13px',borderBottom:`1px solid ${th.border}33`,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <span style={{fontWeight:800,fontSize:'0.88rem',color:th.text}}><i className="fa-solid fa-bell" style={{marginRight:7,color:th.accent}}/>Notifications</span>
          {unread>0&&<span style={{background:'#ef4444',color:'#fff',fontSize:'0.63rem',fontWeight:700,padding:'1px 6px',borderRadius:10}}>{unread}</span>}
        </div>
        <div style={{display:'flex',gap:5,alignItems:'center'}}>
          {unread>0&&<button onClick={markAll} style={{background:'none',border:'none',cursor:'pointer',color:th.accent,fontSize:'0.73rem',fontWeight:600}}>Mark all</button>}
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:th.text+'66',fontSize:13}}><i className="fa-solid fa-xmark"/></button>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load&&<div style={{textAlign:'center',padding:20}}><div style={{width:20,height:20,border:`2px solid ${th.border}`,borderTop:`2px solid ${th.accent}`,borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
        {!load&&list.length===0&&<div style={{textAlign:'center',padding:'28px 16px',color:th.text+'55'}}><i className="fa-solid fa-bell" style={{fontSize:28,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.84rem',fontWeight:600,margin:0}}>No notifications</p></div>}
        {list.map(n=>{
          const ic=ICONS[n.type]||ICONS.default
          return(
            <div key={n._id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 13px',borderBottom:`1px solid ${th.border}22`,background:n.isRead?'transparent':th.accent+'08'}}>
              <div style={{width:32,height:32,borderRadius:9,background:ic.c+'22',border:`1px solid ${ic.c}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}><i className={ic.i} style={{color:ic.c}}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.8rem',fontWeight:n.isRead?600:700,color:th.text}}>{n.title}</div>
                {n.message&&<div style={{fontSize:'0.73rem',color:th.text+'77',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.message}</div>}
                <div style={{fontSize:'0.65rem',color:th.text+'44',marginTop:2}}>{new Date(n.createdAt).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
              {!n.isRead&&<span style={{width:7,height:7,background:th.accent,borderRadius:'50%',flexShrink:0,marginTop:6}}/>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DM PANEL — with search, delete, mark read
// ─────────────────────────────────────────────────────────────
function DMPanel({ me, socket, onClose, onCount, anchorRef, tObj }) {
  const [convos,setConvos]=useState([]), [active,setActive]=useState(null), [msgs,setMsgs]=useState([]), [input,setInput]=useState(''), [load,setLoad]=useState(true), [search,setSearch]=useState('')
  const bottomRef=useRef(null)
  const token=localStorage.getItem('cgz_token')
  const anchorStyle = useAnchorStyle(anchorRef, 340)
  const th = { bg: tObj?.bg_header||'#1a1a2e', bg2: tObj?.bg_chat||'#0d0d1a', text: tObj?.text||'#fff', accent: tObj?.accent||'#03add8', border: tObj?.default_color||'#222' }

  useEffect(()=>{
    loadConvos()
    if(!socket) return
    const fn=(m)=>{ if(active&&(m.from===active.userId||m.to===active.userId)) setMsgs(p=>[...p,m]); loadConvos() }
    socket.on('privateMessage',fn); socket.on('privateMessageSent',fn)
    return()=>{ socket.off('privateMessage',fn); socket.off('privateMessageSent',fn) }
  },[socket,active])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  function loadConvos() {
    fetch(`${API}/api/messages/private/conversations`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(d=>{ const l=d.conversations||[]; setConvos(l); onCount(l.reduce((s,c)=>s+(c.unread||0),0)) }).catch(()=>{}).finally(()=>setLoad(false))
  }

  async function openConvo(u) { setActive(u); setMsgs([]); fetch(`${API}/api/messages/private/${u.userId||u._id}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setMsgs(d.messages||[])).catch(()=>{}) }
  function sendDM(e) { e.preventDefault(); if(!input.trim()||!active||!socket) return; socket.emit('privateMessage',{toUserId:active.userId||active._id,content:input.trim(),type:'text'}); setInput('') }

  const filtered = convos.filter(c=>!search||c.username?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{...anchorStyle,background:th.bg,border:`1px solid ${th.border}44`,borderRadius:14,height:460,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.6)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 13px',borderBottom:`1px solid ${th.border}33`,flexShrink:0}}>
        {active?(
          <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0}}>
            <button onClick={()=>setActive(null)} style={{background:'none',border:'none',cursor:'pointer',color:th.accent,fontSize:13,padding:0,flexShrink:0}}><i className="fa-solid fa-arrow-left"/></button>
            <img src={active.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:26,height:26,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${GBR(active.gender,active.rank)}`,flexShrink:0}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:3}}><RIcon rank={active.rank} size={12}/><span style={{fontSize:'0.82rem',fontWeight:700,color:R(active.rank).color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{active.username}</span></div>
            </div>
          </div>
        ):<span style={{fontWeight:800,fontSize:'0.88rem',color:th.text}}><i className="fa-solid fa-envelope" style={{marginRight:7,color:th.accent}}/>Messages</span>}
        <div style={{display:'flex',gap:4,flexShrink:0}}>
          {active&&<button onClick={async()=>{ await fetch(`${API}/api/messages/private/${active.userId||active._id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{}); setActive(null); loadConvos() }} title="Delete chat" style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:11,padding:'2px 4px'}}><i className="fa-solid fa-trash"/></button>}
          {!active&&convos.length>0&&<button onClick={async()=>{ await fetch(`${API}/api/messages/private/all`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{}); loadConvos() }} title="Delete all" style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:11}}><i className="fa-solid fa-trash"/></button>}
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:th.text+'66',fontSize:13,padding:'2px 4px'}}><i className="fa-solid fa-xmark"/></button>
        </div>
      </div>

      {!active&&(
        <div style={{padding:'6px 10px',borderBottom:`1px solid ${th.border}22`,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6,background:th.bg2,borderRadius:20,padding:'5px 10px'}}>
            <i className="fa-solid fa-search" style={{fontSize:11,color:th.text+'55'}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'0.78rem',color:th.text,fontFamily:'Nunito,sans-serif'}}/>
          </div>
        </div>
      )}

      {!active?(
        <div style={{flex:1,overflowY:'auto'}}>
          {load&&<div style={{textAlign:'center',padding:18}}><div style={{width:20,height:20,border:`2px solid ${th.border}`,borderTop:`2px solid ${th.accent}`,borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
          {!load&&filtered.length===0&&<div style={{textAlign:'center',padding:'28px 16px',color:th.text+'55'}}><i className="fa-solid fa-envelope" style={{fontSize:26,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.84rem',fontWeight:600,margin:0}}>No messages</p></div>}
          {filtered.map(c=>(
            <div key={c.userId} onClick={()=>openConvo(c)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 13px',borderBottom:`1px solid ${th.border}22`,cursor:'pointer',background:c.unread>0?th.accent+'08':'transparent',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background=th.accent+'10'} onMouseLeave={e=>e.currentTarget.style.background=c.unread>0?th.accent+'08':'transparent'}>
              <img src={c.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`1.5px solid ${GBR(c.gender,c.rank)}`}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:3,marginBottom:1}}><RIcon rank={c.rank} size={11}/><span style={{fontSize:'0.82rem',fontWeight:700,color:R(c.rank).color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.username}</span></div>
                <div style={{fontSize:'0.72rem',color:th.text+'55',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.lastMessage||'...'}</div>
              </div>
              {c.unread>0&&<span style={{background:th.accent,color:'#fff',fontSize:'0.62rem',fontWeight:700,padding:'1px 6px',borderRadius:10,flexShrink:0}}>{c.unread}</span>}
              <button onClick={async e=>{ e.stopPropagation(); await fetch(`${API}/api/messages/private/${c.userId}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{}); loadConvos() }} style={{background:'none',border:'none',cursor:'pointer',color:'#ef444466',fontSize:11,padding:'2px 4px'}} onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#ef444466'}><i className="fa-solid fa-trash"/></button>
            </div>
          ))}
        </div>
      ):(
        <>
          <div style={{flex:1,overflowY:'auto',padding:'6px 0',background:th.bg2}}>
            {msgs.map((m,i)=>{
              const mine=(m.from===me?._id||m.sender?._id===me?._id)
              const ts=m.createdAt?new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):''
              return(
                <div key={m._id||i} style={{display:'flex',justifyContent:mine?'flex-end':'flex-start',padding:'2px 10px',alignItems:'flex-end',gap:6}}>
                  {!mine&&<img src={active.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:22,height:22,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`1.5px solid ${GBR(active.gender,active.rank)}`}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>}
                  <div style={{maxWidth:'72%'}}>
                    <div style={{background:mine?th.accent:th.border+'33',color:mine?'#fff':th.text,padding:'7px 11px',borderRadius:mine?'12px 3px 12px 12px':'3px 12px 12px 12px',fontSize:'0.84rem',wordBreak:'break-word'}}>{m.content}</div>
                    <div style={{fontSize:'0.6rem',color:th.text+'44',marginTop:2,textAlign:mine?'right':'left'}}>{ts}</div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </div>
          <form onSubmit={sendDM} style={{display:'flex',gap:7,padding:'7px 10px',borderTop:`1px solid ${th.border}33`,flexShrink:0,background:th.bg}}>
            <input dir="ltr" value={input} onChange={e=>setInput(e.target.value)} placeholder="Send a message..." style={{flex:1,padding:'7px 11px',background:th.bg2,border:`1px solid ${th.border}44`,borderRadius:20,fontSize:'0.84rem',outline:'none',color:th.text,fontFamily:'Nunito,sans-serif',direction:'ltr',textAlign:'left'}} onFocus={e=>e.target.style.borderColor=th.accent} onBlur={e=>e.target.style.borderColor=th.border+'44'}/>
            <button type="submit" disabled={!input.trim()} style={{width:32,height:32,borderRadius:'50%',border:'none',background:input.trim()?th.accent:th.border+'44',color:input.trim()?'#fff':th.text+'44',cursor:input.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}><i className="fa-solid fa-paper-plane"/></button>
          </form>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FLOAT NOTIFICATION — top-left banner green/red
// ─────────────────────────────────────────────────────────────
function FloatNotif({ notifs, onDismiss }) {
  return (
    <div style={{position:'fixed',top:60,left:10,zIndex:99999,display:'flex',flexDirection:'column',gap:6,maxWidth:'min(320px, calc(100vw - 20px))'}}>
      {notifs.map(n=>(
        <div key={n.id} style={{display:'flex',alignItems:'center',gap:10,background:n.type==='success'?'#16a34a':n.type==='error'?'#dc2626':n.type==='warn'?'#d97706':'#0369a1',color:'#fff',borderRadius:10,padding:'8px 12px',boxShadow:'0 4px 16px rgba(0,0,0,0.4)',fontSize:'0.82rem',fontWeight:600,animation:'slideInLeft .25s ease'}}>
          <i className={n.type==='success'?'fa-solid fa-circle-check':n.type==='error'?'fa-solid fa-circle-xmark':'fa-solid fa-circle-info'} style={{flexShrink:0}}/>
          <span style={{flex:1}}>{n.message}</span>
          <button onClick={()=>onDismiss(n.id)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.7)',fontSize:13,padding:0,flexShrink:0}}>✕</button>
        </div>
      ))}
      <style>{`@keyframes slideInLeft { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// REPORT MODAL
// ─────────────────────────────────────────────────────────────
function ReportModal({ target, roomId, roomName, onClose, onSuccess, tObj }) {
  const [reason,setReason]=useState(''), [other,setOther]=useState(''), [desc,setDesc]=useState(''), [sending,setSending]=useState(false)
  const token=localStorage.getItem('cgz_token')
  const th = { bg: tObj?.bg_header||'#1a1a2e', bg2: tObj?.bg_chat||'#0d0d1a', text: tObj?.text||'#fff', accent: tObj?.accent||'#03add8', border: tObj?.default_color||'#222' }
  const REASONS=['Abusing','Harassing','Spam','Offensive content','Cheating','Impersonation','Other']

  async function submit() {
    if(!reason) return
    setSending(true)
    try {
      await fetch(`${API}/api/reports`,{ method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}, body:JSON.stringify({targetUserId:target?.userId||target?._id,messageId:target?.messageId,roomId,roomName,reason:reason==='Other'?other:reason,description:desc}) })
      onSuccess?.(); onClose()
    } catch{} finally{ setSending(false) }
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:th.bg,border:`1px solid ${th.border}44`,borderRadius:16,width:'100%',maxWidth:400,padding:20,boxShadow:'0 16px 48px rgba(0,0,0,.7)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}><i className="fa-sharp fa-solid fa-flag" style={{color:'#f59e0b',fontSize:16}}/><span style={{fontWeight:800,fontSize:'1rem',color:th.text}}>Report User</span></div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:th.text+'66',fontSize:14}}>✕</button>
        </div>
        {target?.content&&(
          <div style={{background:th.bg2,borderRadius:8,padding:'8px 12px',marginBottom:12,borderLeft:'3px solid #f59e0b'}}>
            <div style={{fontSize:'0.7rem',color:'#f59e0b',fontWeight:700,marginBottom:3}}>Reported message:</div>
            <div style={{fontSize:'0.8rem',color:th.text+'cc'}}>{(target.content||'').slice(0,100)}{target.content?.length>100?'…':''}</div>
            <div style={{fontSize:'0.68rem',color:th.text+'55',marginTop:3}}>by {target.username||'Unknown'} • Room: {roomName||'Current room'}</div>
          </div>
        )}
        <div style={{marginBottom:10}}>
          <select value={reason} onChange={e=>setReason(e.target.value)} style={{width:'100%',padding:'9px 12px',background:th.bg2,border:`1px solid ${th.border}44`,borderRadius:9,color:th.text,fontSize:'0.84rem',outline:'none',cursor:'pointer'}}>
            <option value="">Select reason...</option>
            {REASONS.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {reason==='Other'&&<div style={{marginBottom:10}}><input value={other} onChange={e=>setOther(e.target.value.slice(0,20))} maxLength={20} placeholder="Brief reason (max 20 words)..." style={{width:'100%',padding:'8px 12px',background:th.bg2,border:`1px solid ${th.border}44`,borderRadius:9,color:th.text,fontSize:'0.84rem',outline:'none',boxSizing:'border-box'}}/></div>}
        <div style={{marginBottom:14}}><textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Additional details (optional)..." rows={3} style={{width:'100%',padding:'8px 12px',background:th.bg2,border:`1px solid ${th.border}44`,borderRadius:9,color:th.text,fontSize:'0.84rem',outline:'none',resize:'none',boxSizing:'border-box',fontFamily:'Nunito,sans-serif'}}/></div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={submit} disabled={sending||!reason} style={{flex:1,padding:'10px',borderRadius:10,border:'none',background:reason?'#f59e0b':'#f59e0b44',color:'#fff',fontWeight:700,cursor:reason?'pointer':'not-allowed',fontSize:'0.88rem'}}>{sending?'Submitting...':'Submit Report'}</button>
          <button onClick={onClose} style={{padding:'10px 16px',borderRadius:10,border:`1px solid ${th.border}44`,background:'transparent',color:th.text+'77',cursor:'pointer'}}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// REPORTS PANEL (for staff)
// ─────────────────────────────────────────────────────────────
function ReportsPanel({ onClose, onCount, anchorRef, tObj }) {
  const [list,setList]=useState([]), [load,setLoad]=useState(true), [filter,setFilter]=useState('pending')
  const token=localStorage.getItem('cgz_token')
  const anchorStyle = useAnchorStyle(anchorRef, 360)
  const th = { bg: tObj?.bg_header||'#1a1a2e', bg2: tObj?.bg_chat||'#0d0d1a', text: tObj?.text||'#fff', accent: tObj?.accent||'#03add8', border: tObj?.default_color||'#222' }

  useEffect(()=>{ loadReports() },[filter])

  function loadReports() {
    setLoad(true)
    fetch(`${API}/api/reports?status=${filter}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{ setList(d.reports||[]); onCount(d.pendingCount||0) }).catch(()=>{}).finally(()=>setLoad(false))
  }

  async function resolve(id){ await fetch(`${API}/api/reports/${id}/resolve`,{method:'PUT',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{}); loadReports() }
  async function dismiss(id){ await fetch(`${API}/api/reports/${id}/dismiss`,{method:'PUT',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{}); loadReports() }

  return (
    <div style={{...anchorStyle,background:th.bg,border:`1px solid ${th.border}44`,borderRadius:14,maxHeight:480,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.6)'}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 13px',borderBottom:`1px solid ${th.border}33`,flexShrink:0}}>
        <span style={{fontWeight:800,fontSize:'0.88rem',color:th.text}}><i className="fa-sharp fa-solid fa-flag" style={{marginRight:7,color:'#f59e0b'}}/>Reports</span>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <select value={filter} onChange={e=>setFilter(e.target.value)} style={{padding:'3px 7px',background:th.bg2,border:`1px solid ${th.border}44`,borderRadius:7,color:th.text,fontSize:'0.72rem',outline:'none',cursor:'pointer'}}>
            <option value="pending">Pending</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option>
          </select>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:th.text+'66',fontSize:13}}><i className="fa-solid fa-xmark"/></button>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load&&<div style={{textAlign:'center',padding:20}}><div style={{width:20,height:20,border:`2px solid ${th.border}`,borderTop:`2px solid ${th.accent}`,borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
        {!load&&list.length===0&&<div style={{textAlign:'center',padding:'28px 16px',color:th.text+'55'}}><i className="fa-sharp fa-solid fa-flag" style={{fontSize:26,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.84rem',fontWeight:600,margin:0}}>No {filter} reports</p></div>}
        {list.map(r=>(
          <div key={r._id} style={{padding:'10px 13px',borderBottom:`1px solid ${th.border}22`}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
              <img src={r.reportedUser?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:30,height:30,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${GBR(r.reportedUser?.gender,r.reportedUser?.rank)}`}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:3}}><RIcon rank={r.reportedUser?.rank} size={11}/><span style={{fontSize:'0.82rem',fontWeight:700,color:R(r.reportedUser?.rank).color}}>{r.reportedUser?.username||'Unknown'}</span></div>
                <div style={{fontSize:'0.65rem',color:th.text+'55'}}>From: <span style={{color:th.accent}}>{r.reporter?.username}</span>{r.roomName&&<> • Room: <span style={{color:'#f59e0b'}}>{r.roomName}</span></>}</div>
              </div>
              <span style={{fontSize:'0.65rem',fontWeight:700,padding:'2px 7px',borderRadius:20,background:r.status==='pending'?'#f59e0b22':r.status==='resolved'?'#22c55e22':'#88888822',color:r.status==='pending'?'#f59e0b':r.status==='resolved'?'#22c55e':'#888'}}>{r.status}</span>
            </div>
            <div style={{background:th.bg2,borderRadius:7,padding:'6px 10px',marginBottom:6,fontSize:'0.77rem',color:th.text+'cc'}}><span style={{color:'#f59e0b',fontWeight:700}}>{r.reason}: </span>{r.description||r.reason}</div>
            {r.message?.content&&<div style={{background:'rgba(239,68,68,0.08)',borderRadius:7,padding:'5px 9px',marginBottom:7,fontSize:'0.72rem',color:th.text+'aa',borderLeft:'2px solid #ef4444'}}>"{(r.message.content||'').slice(0,80)}…"</div>}
            {filter==='pending'&&<div style={{display:'flex',gap:6}}>
              <button onClick={()=>resolve(r._id)} style={{flex:1,padding:'5px 8px',borderRadius:7,border:'none',background:'#22c55e22',color:'#22c55e',fontWeight:700,cursor:'pointer',fontSize:'0.73rem'}}><i className="fa-solid fa-check" style={{marginRight:4}}/>Resolve</button>
              <button onClick={()=>dismiss(r._id)} style={{flex:1,padding:'5px 8px',borderRadius:7,border:`1px solid ${th.border}44`,background:'transparent',color:th.text+'66',cursor:'pointer',fontSize:'0.73rem'}}>Dismiss</button>
            </div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export { FriendReqPanel, NotifPanel, DMPanel, FloatNotif, ReportModal, ReportsPanel }
