// ============================================================
// ChatSocial.jsx — Friends, Notifications, Direct Messages panels
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { API, R, GBR } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'

function FriendReqPanel({onClose,onCount}) {
  const [reqs,setReqs]=useState([]), [load,setLoad]=useState(true)
  const token=localStorage.getItem('cgz_token')

  function load_reqs() {
    fetch(`${API}/api/users/me/friends`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json())
      .then(d=>{
        const pending=(d.requests||[]).filter(r=>r.status==='pending')
        setReqs(pending)
        onCount(pending.length)
      }).catch(()=>{}).finally(()=>setLoad(false))
  }

  useEffect(()=>{ load_reqs() },[])

  async function accept(userId) {
    await fetch(`${API}/api/users/friend/${userId}/accept`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    load_reqs()
  }
  async function decline(userId) {
    await fetch(`${API}/api/users/friend/${userId}/decline`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    load_reqs()
  }

  return (
    <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:14,width:'min(300px,92vw)',maxHeight:380,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.14)',zIndex:999}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 13px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.88rem',color:'#111827'}}>Friend Requests</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:13}}><i className="fa-solid fa-xmark"/></button>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load&&<div style={{textAlign:'center',padding:20}}><div style={{width:20,height:20,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
        {!load&&reqs.length===0&&(
          <div style={{textAlign:'center',padding:'28px 16px',color:'#9ca3af'}}>
            <i className="fa-solid fa-user-plus" style={{fontSize:26,display:'block',marginBottom:8,opacity:0.3}}/>
            <p style={{fontSize:'0.84rem',fontWeight:600,margin:0}}>No pending requests</p>
          </div>
        )}
        {reqs.map(req=>(
          <div key={req._id||req.from?._id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 13px',borderBottom:'1px solid #f9fafb'}}>
            <img src={req.from?.avatar||'/default_images/avatar/default_guest.png'} alt=""
              style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`1.5px solid ${GBR(req.from?.gender,req.from?.rank)}`}}
              onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.84rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{req.from?.username}</div>
              <div style={{display:'flex',alignItems:'center',gap:3}}>
                <RIcon rank={req.from?.rank} size={10}/>
                <span style={{fontSize:'0.68rem',color:R(req.from?.rank).color}}>{R(req.from?.rank).label}</span>
              </div>
            </div>
            <div style={{display:'flex',gap:5,flexShrink:0}}>
              <button onClick={()=>accept(req.from?._id)}
                style={{padding:'5px 10px',borderRadius:7,border:'none',background:'#22c55e',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.75rem'}}>
                ✓ Accept
              </button>
              <button onClick={()=>decline(req.from?._id)}
                style={{padding:'5px 8px',borderRadius:7,border:'1.5px solid #e4e6ea',background:'#f9fafb',color:'#6b7280',fontWeight:600,cursor:'pointer',fontSize:'0.75rem'}}>
                ✕
              </button>
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
    <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:14,width:'min(310px,92vw)',maxHeight:400,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.14)',zIndex:999}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 13px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.88rem',color:'#111827'}}>Notifications</span>
          {unread>0&&<span style={{background:'#ef4444',color:'#fff',fontSize:'0.63rem',fontWeight:700,padding:'1px 6px',borderRadius:10}}>{unread}</span>}
        </div>
        <div style={{display:'flex',gap:5,alignItems:'center'}}>
          {unread>0&&<button onClick={markAll} style={{background:'none',border:'none',cursor:'pointer',color:'#1a73e8',fontSize:'0.73rem',fontWeight:600}}>Mark all</button>}
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:13}}><i className="fa-solid fa-xmark"/></button>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load&&<div style={{textAlign:'center',padding:20}}><div style={{width:20,height:20,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
        {!load&&list.length===0&&<div style={{textAlign:'center',padding:'28px 16px',color:'#9ca3af'}}><i className="fa-solid fa-bell" style={{fontSize:28,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.84rem',fontWeight:600,margin:0}}>No notifications</p></div>}
        {list.map(n=>(
          <div key={n._id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 13px',borderBottom:'1px solid #f9fafb',background:n.isRead?'transparent':'#f0f7ff'}}>
            <div style={{width:30,height:30,borderRadius:8,background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>
              <img src={`/default_images/notification/${n.type||'default'}.svg`} alt="" style={{width:20,height:20,objectFit:'contain'}} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='block'}}/>
              <span style={{display:'none'}}>{({gift:'🎁',friend:'👥',like:'❤️',badge:'🏅',levelup:'⬆️',call:'📞'}[n.type])||'🔔'}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.8rem',fontWeight:n.isRead?600:700,color:'#111827'}}>{n.title}</div>
              {n.message&&<div style={{fontSize:'0.73rem',color:'#6b7280',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.message}</div>}
              <div style={{fontSize:'0.65rem',color:'#9ca3af',marginTop:2}}>{new Date(n.createdAt).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
            {!n.isRead&&<span style={{width:7,height:7,background:'#1a73e8',borderRadius:'50%',flexShrink:0,marginTop:4}}/>}
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

  async function openConvo(u) { setActive(u); setMsgs([]); fetch(`${API}/api/messages/private/${u.userId||u._id}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setMsgs(d.messages||[])).catch(()=>{}) }

  function sendDM(e) { e.preventDefault(); if(!input.trim()||!active||!socket) return; socket.emit('privateMessage',{toUserId:active.userId||active._id,content:input.trim(),type:'text'}); setInput('') }

  return (
    <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:14,width:'min(330px,94vw)',height:440,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.14)',zIndex:999,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 13px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        {active?(
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={()=>setActive(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#1a73e8',fontSize:13}}><i className="fa-solid fa-arrow-left"/></button>
            <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.86rem',color:'#111827'}}>{active.username}</span>
          </div>
        ):<span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.88rem',color:'#111827'}}>💬 Messages</span>}
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:13}}><i className="fa-solid fa-xmark"/></button>
      </div>
      {!active?(
        <div style={{flex:1,overflowY:'auto'}}>
          {load&&<div style={{textAlign:'center',padding:18}}><div style={{width:20,height:20,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
          {!load&&convos.length===0&&<div style={{textAlign:'center',padding:'28px 16px',color:'#9ca3af'}}><i className="fa-solid fa-envelope" style={{fontSize:26,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.84rem',fontWeight:600,margin:0}}>No messages</p></div>}
          {convos.map(c=>(
            <div key={c.userId} onClick={()=>openConvo(c)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 13px',borderBottom:'1px solid #f9fafb',cursor:'pointer',background:c.unread>0?'#f0f7ff':'transparent',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background=c.unread>0?'#f0f7ff':'transparent'}>
              <img src={c.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:34,height:34,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`1.5px solid ${GBR(c.gender,c.rank)}`}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.82rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.username}</div>
                <div style={{fontSize:'0.72rem',color:'#9ca3af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.lastMessage||'...'}</div>
              </div>
              {c.unread>0&&<span style={{background:'#1a73e8',color:'#fff',fontSize:'0.62rem',fontWeight:700,padding:'1px 6px',borderRadius:10,flexShrink:0}}>{c.unread}</span>}
            </div>
          ))}
        </div>
      ):(
        <>
          <div style={{flex:1,overflowY:'auto',padding:'6px 0'}}>
            {msgs.map((m,i)=>{
              const mine=(m.from===me?._id||m.sender?._id===me?._id)
              return(
                <div key={m._id||i} style={{display:'flex',justifyContent:mine?'flex-end':'flex-start',padding:'2px 10px'}}>
                  <div style={{background:mine?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6',color:mine?'#fff':'#111827',padding:'7px 11px',borderRadius:mine?'12px 3px 12px 12px':'3px 12px 12px 12px',fontSize:'0.84rem',maxWidth:'75%',wordBreak:'break-word'}}>{m.content}</div>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </div>
          <form onSubmit={sendDM} style={{display:'flex',gap:7,padding:'7px 10px',borderTop:'1px solid #e4e6ea',flexShrink:0}}>
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Send a message..."
              style={{flex:1,padding:'7px 11px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:20,fontSize:'0.84rem',outline:'none',color:'#111827',fontFamily:'Nunito,sans-serif'}}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
            <button type="submit" disabled={!input.trim()} style={{width:32,height:32,borderRadius:'50%',border:'none',background:input.trim()?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6',color:input.trim()?'#fff':'#9ca3af',cursor:input.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>
              <i className="fa-solid fa-paper-plane"/>
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

export { FriendReqPanel, NotifPanel, DMPanel }
