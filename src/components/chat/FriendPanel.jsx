/**
 * FriendPanel.jsx — FINAL FIXED
 * avatar: /default_images/avatar/default_guest.png ✅
 */
import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'
const DEFAULT_AVATAR = '/default_images/avatar/default_guest.png'

export default function FriendPanel({ onClose, onCount }) {
  const [requests, setReqs]    = useState([])
  const [friends,  setFriends] = useState([])
  const [tab,      setTab]     = useState('requests')
  const [load,     setLoad]    = useState(true)
  const token = localStorage.getItem('cgz_token')

  useEffect(() => { loadFriends() }, [])

  async function loadFriends() {
    try {
      const r = await fetch(`${API}/api/users/me/friends`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      setReqs(d.requests || [])
      setFriends(d.friends || [])
      onCount?.(d.requests?.length || 0)
    } catch {} finally { setLoad(false) }
  }

  async function accept(id) {
    await fetch(`${API}/api/users/friend/${id}/accept`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } }).catch(() => {})
    setReqs(p => p.filter(r => (r.from?._id || r.from) !== id))
    loadFriends()
  }

  async function decline(id) {
    await fetch(`${API}/api/users/friend/${id}/decline`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } }).catch(() => {})
    setReqs(p => p.filter(r => (r.from?._id || r.from) !== id))
  }

  const TABS = [
    { id:'requests', label:`Requests${requests.length>0?` (${requests.length})`:''}`  },
    { id:'friends',  label:`Friends (${friends.length})`  },
  ]

  return (
    <div
      style={{ position:'absolute', right:0, top:'calc(100% + 6px)', background:'#fff', border:'1px solid #e4e6ea', borderRadius:14, width:290, maxHeight:400, display:'flex', flexDirection:'column', boxShadow:'0 8px 28px rgba(0,0,0,.14)', zIndex:999 }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
        <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'#111827' }}>Friends</span>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:14 }}>
          <i className="fi fi-sr-cross-small" />
        </button>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:'8px 4px', border:'none', background:'none', cursor:'pointer', borderBottom:`2px solid ${tab===t.id?'#1a73e8':'transparent'}`, color:tab===t.id?'#1a73e8':'#9ca3af', fontSize:'0.78rem', fontWeight:700 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {load && (
          <div style={{ textAlign:'center', padding:20 }}>
            <div style={{ width:22, height:22, border:'2px solid #e4e6ea', borderTop:'2px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }} />
          </div>
        )}

        {!load && tab === 'requests' && (
          requests.length === 0
            ? <div style={{ textAlign:'center', padding:'24px 16px', color:'#9ca3af' }}><p style={{ fontSize:'0.82rem', fontWeight:600 }}>No pending requests</p></div>
            : requests.map(req => {
                const from = req.from
                const fromId = from?._id || from
                const fromUsername = from?.username || 'Unknown'
                const fromAvatar = from?.avatar || DEFAULT_AVATAR
                return (
                  <div key={fromId} style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 14px', borderBottom:'1px solid #f9fafb' }}>
                    <img src={fromAvatar} alt="" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} onError={e => (e.target.src=DEFAULT_AVATAR)} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'0.83rem', fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{fromUsername}</div>
                    </div>
                    <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                      <button onClick={() => accept(fromId)} style={{ background:'#059669', border:'none', color:'#fff', width:26, height:26, borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>
                        <i className="fi fi-sr-check" />
                      </button>
                      <button onClick={() => decline(fromId)} style={{ background:'#f3f4f6', border:'none', color:'#6b7280', width:26, height:26, borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>
                        <i className="fi fi-sr-cross-small" />
                      </button>
                    </div>
                  </div>
                )
              })
        )}

        {!load && tab === 'friends' && (
          friends.length === 0
            ? <div style={{ textAlign:'center', padding:'24px 16px', color:'#9ca3af' }}><p style={{ fontSize:'0.82rem', fontWeight:600 }}>No friends yet</p></div>
            : friends.map(f => (
                <div key={f._id} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 14px', borderBottom:'1px solid #f9fafb' }}>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <img src={f.avatar || DEFAULT_AVATAR} alt="" style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover' }} onError={e => (e.target.src=DEFAULT_AVATAR)} />
                    {f.isOnline && <span style={{ position:'absolute', bottom:0, right:0, width:8, height:8, background:'#22c55e', borderRadius:'50%', border:'1.5px solid #fff' }} />}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.83rem', fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.username}</div>
                    <div style={{ fontSize:'0.7rem', color:f.isOnline?'#22c55e':'#9ca3af' }}>{f.isOnline?'Online':'Offline'}</div>
                  </div>
                </div>
              ))
        )}
      </div>
    </div>
  )
}
