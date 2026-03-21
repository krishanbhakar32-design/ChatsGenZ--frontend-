import { useState, useEffect } from 'react'
const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'
const GBR = (g,r)=>r==='bot'?'transparent':({male:'#03add8',female:'#ff99ff',couple:'#9c6fde',other:'#cccccc'}[g]||'#cccccc')

export default function FriendRequestsPanel({ onClose, onCountChange }) {
  const [requests, setRequests] = useState([])
  const [friends,  setFriends]  = useState([])
  const [tab,      setTab]      = useState('requests')
  const [load,     setLoad]     = useState(true)
  const token = localStorage.getItem('cgz_token')

  useEffect(()=>{ loadFriends() },[])

  async function loadFriends() {
    try {
      const r = await fetch(`${API}/api/users/me/friends`,{headers:{Authorization:`Bearer ${token}`}})
      const d = await r.json()
      setRequests(d.requests||[])
      setFriends(d.friends||[])
      onCountChange?.(d.requests?.length||0)
    } catch {} finally { setLoad(false) }
  }

  async function accept(userId) {
    await fetch(`${API}/api/users/friend/${userId}/accept`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    setRequests(p=>p.filter(r=>r.from._id!==userId))
    loadFriends()
  }
  async function decline(userId) {
    await fetch(`${API}/api/users/friend/${userId}/decline`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})
    setRequests(p=>p.filter(r=>r.from._id!==userId))
  }

  return (
    <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#fff',border:'1px solid #e4e6ea',borderRadius:14,width:300,maxHeight:420,display:'flex',flexDirection:'column',boxShadow:'0 8px 28px rgba(0,0,0,.14)',zIndex:999}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:'#111827'}}>
          <i className="fi fi-sr-user-add" style={{marginRight:7,color:'#059669'}}/>Friends
        </span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:14}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        {[{id:'requests',label:`Requests${requests.length>0?` (${requests.length})`:''}`},{id:'friends',label:`Friends (${friends.length})`}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:'8px 4px',border:'none',background:'none',cursor:'pointer',borderBottom:`2px solid ${tab===t.id?'#1a73e8':'transparent'}`,color:tab===t.id?'#1a73e8':'#9ca3af',fontSize:'0.78rem',fontWeight:700,transition:'all .15s'}}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load&&<div style={{textAlign:'center',padding:20}}><div style={{width:22,height:22,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>}

        {/* Friend requests */}
        {!load&&tab==='requests'&&(
          requests.length===0
            ? <div style={{textAlign:'center',padding:'24px 16px',color:'#9ca3af'}}><i className="fi fi-sr-user-add" style={{fontSize:28,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.82rem',fontWeight:600}}>No pending requests</p></div>
            : requests.map(req=>(
              <div key={req.from._id} style={{display:'flex',alignItems:'center',gap:9,padding:'10px 14px',borderBottom:'1px solid #f9fafb'}}>
                <img src={req.from.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`1.5px solid ${GBR(req.from.gender,req.from.rank)}`}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'0.83rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{req.from.username}</div>
                  <div style={{fontSize:'0.7rem',color:'#9ca3af'}}>Wants to be friends</div>
                </div>
                <div style={{display:'flex',gap:4,flexShrink:0}}>
                  <button onClick={()=>accept(req.from._id)} style={{background:'#059669',border:'none',color:'#fff',width:26,height:26,borderRadius:7,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>
                    <i className="fi fi-sr-check"/>
                  </button>
                  <button onClick={()=>decline(req.from._id)} style={{background:'#f3f4f6',border:'none',color:'#6b7280',width:26,height:26,borderRadius:7,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>
                    <i className="fi fi-sr-cross-small"/>
                  </button>
                </div>
              </div>
            ))
        )}

        {/* Friends list */}
        {!load&&tab==='friends'&&(
          friends.length===0
            ? <div style={{textAlign:'center',padding:'24px 16px',color:'#9ca3af'}}><i className="fi fi-sr-users" style={{fontSize:28,display:'block',marginBottom:8,opacity:0.3}}/><p style={{fontSize:'0.82rem',fontWeight:600}}>No friends yet</p></div>
            : friends.map(f=>(
              <div key={f._id} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 14px',borderBottom:'1px solid #f9fafb'}}>
                <div style={{position:'relative',flexShrink:0}}>
                  <img src={f.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:34,height:34,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${GBR(f.gender,f.rank)}`}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
                  {f.isOnline&&<span style={{position:'absolute',bottom:0,right:0,width:8,height:8,background:'#22c55e',borderRadius:'50%',border:'1.5px solid #fff'}}/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'0.83rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.username}</div>
                  <div style={{fontSize:'0.7rem',color:f.isOnline?'#22c55e':'#9ca3af'}}>{f.isOnline?'Online':'Offline'}</div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
