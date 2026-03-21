import { useState, useEffect } from 'react'
const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'
const ICONS = { gift:'/default_images/notification/gift.svg', friend:'/default_images/notification/friend.svg', like:'/default_images/notification/like.svg', badge:'/default_images/notification/badge.svg', call:'/default_images/notification/call.svg', default:'/default_images/notification/default.svg' }

export default function NotificationsPanel({ onClose, onCountChange }) {
  const [notifs, setNotifs] = useState([])
  const [load,   setLoad]   = useState(true)
  const token = localStorage.getItem('cgz_token')

  useEffect(()=>{ fetch() },[])

  async function fetch() {
    try {
      const r = await window.fetch(`${API}/api/notifications`,{headers:{Authorization:`Bearer ${token}`}})
      const d = await r.json()
      setNotifs(d.notifications||[])
      onCountChange?.(d.unreadCount||0)
    } catch {} finally { setLoad(false) }
  }

  async function markRead(id) {
    await window.fetch(`${API}/api/notifications/${id}/read`,{method:'PUT',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    setNotifs(p=>p.map(n=>n._id===id?{...n,isRead:true}:n))
  }
  async function markAll() {
    await window.fetch(`${API}/api/notifications/read-all`,{method:'PUT',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    setNotifs(p=>p.map(n=>({...n,isRead:true}))); onCountChange?.(0)
  }
  async function clearAll() {
    await window.fetch(`${API}/api/notifications/clear-all`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    setNotifs([]); onCountChange?.(0)
  }

  const unread = notifs.filter(n=>!n.isRead).length
  return (
    <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:14,width:320,maxHeight:440,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.14)',zIndex:999}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:'#111827'}}>Notifications</span>
          {unread>0&&<span style={{background:'#ef4444',color:'#fff',fontSize:'0.65rem',fontWeight:700,padding:'1px 6px',borderRadius:10}}>{unread}</span>}
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {unread>0&&<button onClick={markAll} style={{background:'none',border:'none',cursor:'pointer',color:'#1a73e8',fontSize:'0.75rem',fontWeight:600}}>Mark all read</button>}
          {notifs.length>0&&<button onClick={clearAll} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:'0.75rem'}}>Clear</button>}
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:14}}><i className="fi fi-sr-cross-small"/></button>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load&&<div style={{textAlign:'center',padding:24}}><div style={{width:24,height:24,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}
        {!load&&notifs.length===0&&<div style={{textAlign:'center',padding:'32px 16px',color:'#9ca3af'}}><i className="fi fi-sc-bell-ring" style={{fontSize:32,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.875rem',fontWeight:600}}>No notifications</p></div>}
        {notifs.map(n=>(
          <div key={n._id} onClick={()=>!n.isRead&&markRead(n._id)}
            style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',borderBottom:'1px solid #f9fafb',background:n.isRead?'transparent':'#f0f7ff',cursor:n.isRead?'default':'pointer'}}
            onMouseEnter={e=>{if(!n.isRead)e.currentTarget.style.background='#e8f0fe'}}
            onMouseLeave={e=>{e.currentTarget.style.background=n.isRead?'transparent':'#f0f7ff'}}
          >
            <img src={ICONS[n.type]||ICONS.default} alt="" style={{width:32,height:32,borderRadius:8,objectFit:'contain',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
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
