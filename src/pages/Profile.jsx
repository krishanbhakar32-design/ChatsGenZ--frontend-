import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

const RANKS = {
  guest:      { label:'Guest',      color:'#888888', level:1  },
  user:       { label:'User',       color:'#aaaaaa', level:2  },
  vipfemale:  { label:'VIP Female', color:'#FF4488', level:3  },
  vipmale:    { label:'VIP Male',   color:'#4488FF', level:4  },
  butterfly:  { label:'Butterfly',  color:'#FF66AA', level:5  },
  ninja:      { label:'Ninja',      color:'#777777', level:6  },
  fairy:      { label:'Fairy',      color:'#FF88CC', level:7  },
  legend:     { label:'Legend',     color:'#FF8800', level:8  },
  bot:        { label:'Bot',        color:'#00cc88', level:9  },
  premium:    { label:'Premium',    color:'#aa44ff', level:10 },
  moderator:  { label:'Moderator',  color:'#00AAFF', level:11 },
  admin:      { label:'Admin',      color:'#FF4444', level:12 },
  superadmin: { label:'Superadmin', color:'#FF00FF', level:13 },
  owner:      { label:'Owner',      color:'#FFD700', level:14 },
}
const GBR = (g,r) => r==='bot'?'transparent':({male:'#03add8',female:'#ff99ff',couple:'#9c6fde',other:'#cccccc'}[g]||'#cccccc')
const RI = r => RANKS[r] || RANKS.user
const tkn = () => localStorage.getItem('cgz_token')
const apiFetch = (url, opts={}) => fetch(`${API}${url}`, { headers:{ Authorization:`Bearer ${tkn()}`, 'Content-Type':'application/json', ...opts.headers }, ...opts }).then(r=>r.json())

// ─── Lightweight Toast ────────────────────────────────────────
function MiniToast({ msg, type, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,3000); return()=>clearTimeout(t) },[])
  return <div style={{ position:'fixed', bottom:24, right:24, background:type==='error'?'#dc2626':type==='success'?'#16a34a':'#1a73e8', color:'#fff', padding:'10px 18px', borderRadius:10, fontWeight:700, fontSize:'0.85rem', zIndex:9999, boxShadow:'0 4px 20px rgba(0,0,0,.25)' }}>{msg}</div>
}

// ─── Wall Post ────────────────────────────────────────────────
function WallPostCard({ post, meId, onDelete, onLike, onReply }) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const ri = RI(post.author?.rank)
  const liked = post.likes?.includes(meId)
  return (
    <div style={{ background:'#fff', border:'1px solid #e4e6ea', borderRadius:12, padding:'14px 16px', marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <img src={post.author?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width:38,height:38,borderRadius:'50%',objectFit:'cover',border:`2px solid ${GBR(post.author?.gender,post.author?.rank)}`,flexShrink:0 }} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
        <div style={{ flex:1 }}>
          <span style={{ fontWeight:800, fontSize:'0.88rem', color:post.author?.nameColor||ri.color }}>{post.author?.username}</span>
          <span style={{ display:'block', fontSize:'0.68rem', color:'#9ca3af' }}>{new Date(post.createdAt).toLocaleString()}</span>
        </div>
        {(post.author?._id===meId||post.profileOf===meId) && (
          <button onClick={()=>onDelete(post._id)} style={{ background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:13 }}>🗑</button>
        )}
      </div>
      <p style={{ fontSize:'0.9rem', color:'#374151', lineHeight:1.6, margin:'0 0 10px', whiteSpace:'pre-wrap' }}>{post.content}</p>
      {post.image && <img src={post.image} alt="" style={{ maxWidth:'100%', borderRadius:8, marginBottom:10 }} onError={e=>e.target.style.display='none'}/>}
      <div style={{ display:'flex', gap:16, alignItems:'center', fontSize:'0.78rem', color:'#6b7280' }}>
        <button onClick={()=>onLike(post._id)} style={{ background:'none',border:'none',cursor:'pointer',color:liked?'#ef4444':'#6b7280',fontSize:'0.78rem',fontWeight:700,display:'flex',alignItems:'center',gap:4 }}>
          {liked?'❤️':'🤍'} {post.likes?.length||0}
        </button>
        <button onClick={()=>setShowReply(p=>!p)} style={{ background:'none',border:'none',cursor:'pointer',color:'#1a73e8',fontWeight:600,fontSize:'0.78rem' }}>
          💬 {post.replies?.length||0} Replies
        </button>
      </div>
      {/* Replies */}
      {post.replies?.length>0 && (
        <div style={{ marginTop:10, paddingLeft:14, borderLeft:'2px solid #e4e6ea' }}>
          {post.replies.map((r,i)=>(
            <div key={r._id||i} style={{ display:'flex',gap:8,alignItems:'flex-start',marginBottom:7 }}>
              <img src={r.user?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width:24,height:24,borderRadius:'50%',objectFit:'cover',flexShrink:0 }} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
              <div style={{ background:'#f3f4f6',borderRadius:8,padding:'5px 10px',flex:1,minWidth:0 }}>
                <span style={{ fontSize:'0.75rem',fontWeight:700,color:'#374151' }}>{r.user?.username}</span>
                <p style={{ fontSize:'0.82rem',color:'#374151',margin:'2px 0 0' }}>{r.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {showReply && (
        <div style={{ display:'flex',gap:8,marginTop:10 }}>
          <input value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Write a reply..."
            style={{ flex:1,padding:'7px 12px',border:'1.5px solid #e4e6ea',borderRadius:20,fontSize:'0.85rem',outline:'none' }}
            onKeyDown={e=>{ if(e.key==='Enter'&&replyText.trim()){onReply(post._id,replyText);setReplyText('');setShowReply(false)} }}
          />
          <button onClick={()=>{if(replyText.trim()){onReply(post._id,replyText);setReplyText('');setShowReply(false)}}}
            style={{ padding:'7px 14px',borderRadius:20,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.8rem' }}>Send</button>
        </div>
      )}
    </div>
  )
}

// ─── Gallery Photo ────────────────────────────────────────────
function GalleryPhoto({ photo, isMe, onDelete, onLike, meId }) {
  const [show, setShow] = useState(false)
  const liked = photo.likes?.includes(meId)
  return (
    <>
      <div style={{ position:'relative', aspectRatio:'1', borderRadius:8, overflow:'hidden', cursor:'pointer', background:'#f3f4f6' }} onClick={()=>setShow(true)}>
        <img src={photo.url} alt={photo.caption||''} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
        <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0)',transition:'background .2s',display:'flex',alignItems:'flex-end',padding:'6px' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,.3)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(0,0,0,0)'}>
        </div>
      </div>
      {show && (
        <div onClick={()=>setShow(false)} style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,.85)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ maxWidth:600,width:'100%',background:'#fff',borderRadius:14,overflow:'hidden' }}>
            <img src={photo.url} alt="" style={{ width:'100%',maxHeight:'70vh',objectFit:'contain',display:'block' }} onError={e=>e.target.style.display='none'}/>
            <div style={{ padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div>
                {photo.caption && <p style={{ fontSize:'0.875rem',color:'#374151',margin:0 }}>{photo.caption}</p>}
                <p style={{ fontSize:'0.7rem',color:'#9ca3af',margin:'4px 0 0' }}>{new Date(photo.createdAt).toLocaleDateString()}</p>
              </div>
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={()=>onLike(photo._id)} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'1.2rem' }}>{liked?'❤️':'🤍'} {photo.likes?.length||0}</button>
                {isMe && <button onClick={()=>{onDelete(photo._id);setShow(false)}} style={{ background:'#fee2e2',border:'none',color:'#dc2626',padding:'6px 12px',borderRadius:7,cursor:'pointer',fontWeight:700,fontSize:'0.8rem' }}>Delete</button>}
                <button onClick={()=>setShow(false)} style={{ background:'#f3f4f6',border:'none',padding:'6px 12px',borderRadius:7,cursor:'pointer',fontSize:'0.8rem' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── VIP Panel ────────────────────────────────────────────────
function VIPPanel({ user, toast, onRefresh }) {
  const [plans, setPlans] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    Promise.all([
      apiFetch('/api/vip/plans'),
      apiFetch('/api/vip/status')
    ]).then(([p,s])=>{ setPlans(p.plans||[]); setStatus(s) })
  },[])

  async function purchase(planId) {
    setLoading(true)
    const d = await apiFetch(`/api/vip/purchase/${planId}`, { method:'POST' })
    setLoading(false)
    if (d.error) toast(d.error,'error')
    else { toast(d.message,'success'); onRefresh(); apiFetch('/api/vip/status').then(s=>setStatus(s)) }
  }

  return (
    <div style={{ padding:20 }}>
      {status?.isPremium && (
        <div style={{ background:'linear-gradient(135deg,#fef3c7,#fde68a)', border:'1px solid #f59e0b', borderRadius:12, padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:'2rem' }}>⭐</span>
          <div>
            <div style={{ fontWeight:800, color:'#92400e', fontSize:'1rem' }}>VIP Active!</div>
            <div style={{ fontSize:'0.8rem', color:'#78350f' }}>{status.daysLeft} days remaining · Expires {new Date(status.expiresAt).toLocaleDateString()}</div>
          </div>
        </div>
      )}
      <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:800, color:'#111827' }}>🌟 Get VIP / Premium</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
        {plans.map(p=>(
          <div key={p.id} style={{ background:'#fff', border:'2px solid #e4e6ea', borderRadius:12, padding:16, textAlign:'center', transition:'all .15s', cursor:'pointer' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#7c3aed';e.currentTarget.style.transform='translateY(-2px)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#e4e6ea';e.currentTarget.style.transform='none'}}>
            <div style={{ fontSize:'1.5rem', marginBottom:8 }}>👑</div>
            <div style={{ fontWeight:800, fontSize:'0.95rem', color:'#111827', marginBottom:4 }}>{p.label}</div>
            <div style={{ fontSize:'0.78rem', color:'#7c3aed', fontWeight:700, marginBottom:4 }}>+{p.gold.toLocaleString()} Gold</div>
            <div style={{ fontSize:'1.1rem', fontWeight:900, color:'#374151', marginBottom:12 }}>₹{p.price}</div>
            <button onClick={()=>purchase(p.id)} disabled={loading}
              style={{ width:'100%', padding:'9px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#7c3aed,#5b21b6)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'0.83rem' }}>
              {loading?'...':'Buy with Gold'}
            </button>
            <div style={{ fontSize:'0.68rem', color:'#9ca3af', marginTop:6 }}>= {p.price} Gold from wallet</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:20, background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, padding:'12px 14px', fontSize:'0.82rem', color:'#166534' }}>
        <strong>VIP Benefits:</strong> Premium rank badge, exclusive name effects, VIP-only rooms, priority support, extra gold earnings, and more!
      </div>
    </div>
  )
}

// ─── Pref Section ────────────────────────────────────────────
function PrefSection({ title, children }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e4e6ea', borderRadius:12, padding:'16px 18px', marginBottom:14 }}>
      <h4 style={{ margin:'0 0 14px', fontSize:'0.88rem', fontWeight:800, color:'#374151' }}>{title}</h4>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{children}</div>
    </div>
  )
}

function PrefToggle({ label, desc, val, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'8px 0', borderBottom:'1px solid #f3f4f6' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#111827' }}>{label}</div>
        {desc && <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:1 }}>{desc}</div>}
      </div>
      <button onClick={()=>onChange(!val)}
        style={{ width:44, height:24, borderRadius:12, border:'none', background:val?'#1a73e8':'#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
        <span style={{ position:'absolute', top:2, left:val?22:2, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
      </button>
    </div>
  )
}

// ─── Main Profile Page ────────────────────────────────────────
export default function Profile() {
  const { username: paramUsername } = useParams()
  const { user: me } = useAuth()
  const nav = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('wall')
  const [wallPosts, setWallPosts] = useState([])
  const [gallery, setGallery] = useState([])
  const [friends, setFriends] = useState([])
  const [friendReqs, setFriendReqs] = useState([])
  const [blocked, setBlocked] = useState([])
  const [newPost, setNewPost] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [toastQ, setToastQ] = useState([])
  const [prefs, setPrefs] = useState({})
  const [savingPrefs, setSavingPrefs] = useState(false)
  const avatarRef = useRef(null)
  const coverRef = useRef(null)
  const galleryRef = useRef(null)

  const toast = (msg, type='success') => setToastQ(p=>[...p, { id:Date.now(), msg, type }])
  const isMe = me?.username?.toLowerCase() === paramUsername?.toLowerCase() || me?._id === profile?._id

  useEffect(()=>{
    loadProfile()
  },[paramUsername])

  async function loadProfile() {
    setLoading(true)
    try {
      const d = await apiFetch(`/api/users/${paramUsername}`)
      if (d.error) { toast(d.error,'error'); nav('/chat'); return }
      setProfile(d.user)
      setEditForm({ about:d.user.about||'', mood:d.user.mood||'', gender:d.user.gender||'other', nameColor:d.user.nameColor||'' })
      // Load own preferences
      if (d.user._id === me?._id || d.user.username?.toLowerCase() === me?.username?.toLowerCase()) {
        const ps = await apiFetch('/api/users/me/settings')
        setPrefs(ps.preferences || {})
      }
    } catch { toast('Failed to load profile','error') }
    setLoading(false)
  }

  useEffect(()=>{
    if (!profile) return
    if (tab==='wall') loadWall()
    if (tab==='gallery') loadGallery()
    if (tab==='friends') loadFriends()
    if (tab==='blocked' && isMe) loadBlocked()
    if (tab==='preferences' && isMe) {
      apiFetch('/api/users/me/settings').then(ps => setPrefs(ps.preferences||{}))
    }
  },[tab, profile?._id])

  const loadWall = async () => {
    const d = await apiFetch(`/api/wall/${profile._id}`)
    setWallPosts(d.posts||[])
  }
  const loadGallery = async () => {
    const d = await apiFetch(`/api/users/${profile._id}/gallery`)
    setGallery(d.gallery||[])
  }
  const loadFriends = async () => {
    if (isMe) {
      const d = await apiFetch('/api/users/me/friends')
      setFriends(d.friends||[])
      setFriendReqs(d.requests||[])
    } else {
      const d = await apiFetch(`/api/users/${profile._id}/gallery`) // just to not error
      // Non-self: show friend count only
    }
  }
  const loadBlocked = async () => {
    const d = await apiFetch('/api/users/me/blocked')
    setBlocked(d.blocked||[])
  }

  async function postOnWall() {
    if (!newPost.trim()) return
    const d = await apiFetch(`/api/wall/${profile._id}`, { method:'POST', body:JSON.stringify({ content:newPost.trim() }) })
    if (d.error) toast(d.error,'error')
    else { toast('Posted!'); setNewPost(''); loadWall() }
  }

  async function deletePost(postId) {
    await apiFetch(`/api/wall/${postId}`, { method:'DELETE' })
    setWallPosts(p=>p.filter(x=>x._id!==postId))
    toast('Post deleted')
  }

  async function likePost(postId) {
    const d = await apiFetch(`/api/wall/${postId}/like`, { method:'POST' })
    setWallPosts(p=>p.map(x=>x._id===postId?{...x, likes:d.liked?[...(x.likes||[]),me._id]:(x.likes||[]).filter(l=>l!==me._id)}:x))
  }

  async function replyPost(postId, content) {
    const d = await apiFetch(`/api/wall/${postId}/reply`, { method:'POST', body:JSON.stringify({ content }) })
    if (d.replies) setWallPosts(p=>p.map(x=>x._id===postId?{...x,replies:d.replies}:x))
  }

  async function deleteGalleryPhoto(photoId) {
    await apiFetch(`/api/users/me/gallery/${photoId}`, { method:'DELETE' })
    setGallery(p=>p.filter(x=>x._id!==photoId))
    toast('Photo deleted')
  }

  async function likeGalleryPhoto(photoId) {
    await apiFetch(`/api/users/${profile._id}/gallery/${photoId}/like`, { method:'POST' })
    loadGallery()
  }

  async function uploadAvatar(file) {
    const fd = new FormData(); fd.append('avatar', file)
    const d = await fetch(`${API}/api/upload/avatar`, { method:'POST', headers:{ Authorization:`Bearer ${tkn()}` }, body:fd }).then(r=>r.json())
    if (d.url) { toast('Avatar updated!'); loadProfile() }
    else toast(d.error||'Upload failed','error')
  }

  async function uploadCover(file) {
    const fd = new FormData(); fd.append('cover', file)
    const d = await fetch(`${API}/api/upload/cover`, { method:'POST', headers:{ Authorization:`Bearer ${tkn()}` }, body:fd }).then(r=>r.json())
    if (d.url) { toast('Cover updated!'); loadProfile() }
    else toast(d.error||'Upload failed','error')
  }

  async function uploadGalleryPhoto(file) {
    const caption = window.prompt('Caption (optional):') || ''
    const fd = new FormData(); fd.append('photo', file)
    const up = await fetch(`${API}/api/upload/gallery`, { method:'POST', headers:{ Authorization:`Bearer ${tkn()}` }, body:fd }).then(r=>r.json())
    if (up.url) {
      await apiFetch('/api/users/me/gallery', { method:'POST', body:JSON.stringify({ url:up.url, caption }) })
      toast('Photo added!'); loadGallery()
    } else toast(up.error||'Upload failed','error')
  }

  async function saveProfile() {
    const d = await apiFetch('/api/users/me/profile', { method:'PUT', body:JSON.stringify(editForm) })
    if (d.error) toast(d.error,'error')
    else { toast('Profile saved!'); setEditMode(false); loadProfile() }
  }

  async function sendFriendRequest() {
    const d = await apiFetch(`/api/users/friend/${profile._id}`, { method:'POST' })
    toast(d.message||d.error, d.error?'error':'success')
  }

  async function acceptFriend(userId) {
    await apiFetch(`/api/users/friend/${userId}/accept`, { method:'POST' })
    toast('Friend added!'); loadFriends()
  }

  async function removeFriend(userId) {
    await apiFetch(`/api/users/friend/${userId}`, { method:'DELETE' })
    toast('Friend removed'); loadFriends()
  }

  async function savePref(key, value) {
    setSavingPrefs(true)
    const newPrefs = { ...prefs, [key]: value }
    setPrefs(newPrefs)
    await apiFetch('/api/users/me/settings', { method:'PUT', body:JSON.stringify({ [key]: value }) })
    setSavingPrefs(false)
  }

  async function blockUser() {
    if (!window.confirm(`Block ${profile.username}?`)) return
    const d = await apiFetch(`/api/users/block/${profile._id}`, { method:'POST' })
    toast(d.message||d.error, d.error?'error':'success')
  }

  async function unblockUser(userId) {
    await apiFetch(`/api/users/block/${userId}`, { method:'DELETE' })
    toast('User unblocked'); loadBlocked()
  }

  async function reportUser() {
    const reason = window.prompt('Reason for report:')
    if (!reason) return
    const d = await apiFetch(`/api/users/${profile._id}/report`, { method:'POST', body:JSON.stringify({ reason }) })
    toast(d.message||d.error, d.error?'error':'success')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f2f5' }}>
      <div style={{ textAlign:'center' }}><div style={{ width:36, height:36, border:'3px solid #e4e6ea', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 10px' }}/><p style={{ color:'#9ca3af' }}>Loading profile...</p></div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!profile) return null
  const ri = RI(profile.rank)
  const isFriend = friends.some(f=>f._id===profile._id||f._id===me?._id)

  const TABS = [
    { id:'wall',        label:'📝 Wall',        show:true },
    { id:'gallery',     label:'🖼️ Gallery',     show:true },
    { id:'friends',     label:'👥 Friends',     show:true },
    { id:'vip',         label:'⭐ VIP',         show:isMe },
    { id:'preferences', label:'⚙️ Preferences', show:isMe },
  ].filter(t=>t.show)

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5', fontFamily:"'Nunito','Outfit',sans-serif" }}>
      {toastQ.map(t=><MiniToast key={t.id} msg={t.msg} type={t.type} onDone={()=>setToastQ(p=>p.filter(x=>x.id!==t.id))}/>)}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Cover */}
      <div style={{ position:'relative', height:220, background:`linear-gradient(135deg,${ri.color}44,#e8f0fe)`, overflow:'hidden' }}>
        {profile.coverImage && <img src={profile.coverImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>}
        {isMe && (
          <button onClick={()=>coverRef.current?.click()} style={{ position:'absolute', bottom:12, right:16, background:'rgba(0,0,0,.55)', border:'none', color:'#fff', padding:'7px 14px', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.8rem', backdropFilter:'blur(4px)' }}>
            📷 Change Cover
          </button>
        )}
        <input ref={coverRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>e.target.files[0]&&uploadCover(e.target.files[0])}/>
        {/* Back button */}
        <button onClick={()=>nav(-1)} style={{ position:'absolute', top:14, left:16, background:'rgba(0,0,0,.45)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:7, cursor:'pointer', fontWeight:700, fontSize:'0.82rem', backdropFilter:'blur(4px)' }}>← Back</button>
      </div>

      {/* Avatar + info */}
      <div style={{ maxWidth:860, margin:'0 auto', padding:'0 20px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:18, marginTop:-56, marginBottom:0, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <img src={profile.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width:100, height:100, borderRadius:'50%', border:`4px solid ${GBR(profile.gender,profile.rank)}`, objectFit:'cover', background:'#fff', display:'block' }} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
            {isMe && (
              <button onClick={()=>avatarRef.current?.click()} style={{ position:'absolute', bottom:2, right:2, width:28, height:28, borderRadius:'50%', background:'#1a73e8', border:'2px solid #fff', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>✏️</button>
            )}
            <input ref={avatarRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>e.target.files[0]&&uploadAvatar(e.target.files[0])}/>
            {profile.isOnline && <span style={{ position:'absolute', bottom:4, left:4, width:14, height:14, background:'#22c55e', borderRadius:'50%', border:'2.5px solid #fff' }}/>}
          </div>
          <div style={{ flex:1, minWidth:0, paddingBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <h1 style={{ margin:0, fontSize:'1.4rem', fontWeight:900, color:profile.nameColor||'#111827', fontFamily:'Outfit,sans-serif' }}>{profile.username}</h1>
              {profile.isPremium && <span style={{ background:'linear-gradient(135deg,#7c3aed,#5b21b6)', color:'#fff', fontSize:'0.65rem', fontWeight:800, padding:'2px 8px', borderRadius:10 }}>⭐ PREMIUM</span>}
              {profile.isVerified && <span style={{ background:'#dbeafe', color:'#1d4ed8', fontSize:'0.65rem', fontWeight:800, padding:'2px 8px', borderRadius:10 }}>✓ Verified</span>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4, flexWrap:'wrap' }}>
              <img src={`/icons/ranks/${ri.icon||'user.svg'}`} alt="" style={{ width:14, height:14 }} onError={e=>e.target.style.display='none'}/>
              <span style={{ fontSize:'0.8rem', fontWeight:700, color:ri.color }}>{ri.label}</span>
              {profile.countryCode && <img src={`/icons/flags/${profile.countryCode.toLowerCase()}.png`} alt="" style={{ width:18, height:12, borderRadius:2 }} onError={e=>e.target.style.display='none'}/>}
              <span style={{ fontSize:'0.8rem', color:'#6b7280' }}>Lv.{profile.level||1}</span>
              <span style={{ fontSize:'0.8rem', color:'#6b7280' }}>💰{profile.gold||0}</span>
            </div>
            {profile.mood && <p style={{ margin:'4px 0 0', fontSize:'0.82rem', color:'#6b7280', fontStyle:'italic' }}>"{profile.mood}"</p>}
          </div>
          {/* Action buttons */}
          {!isMe && me && (
            <div style={{ display:'flex', gap:8, paddingBottom:8, flexWrap:'wrap' }}>
              <button onClick={sendFriendRequest} style={{ padding:'8px 16px', borderRadius:9, border:'none', background:'#1a73e8', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'0.82rem' }}>👥 Add Friend</button>
              <button onClick={()=>nav(`/chat`)} style={{ padding:'8px 16px', borderRadius:9, border:'1.5px solid #e4e6ea', background:'#fff', color:'#374151', fontWeight:700, cursor:'pointer', fontSize:'0.82rem' }}>💬 Message</button>
              <button onClick={reportUser} style={{ padding:'8px 16px', borderRadius:9, border:'1.5px solid #e4e6ea', background:'#fff', color:'#ef4444', fontWeight:700, cursor:'pointer', fontSize:'0.82rem' }}>🚩 Report</button>
              <button onClick={blockUser} style={{ padding:'8px 16px', borderRadius:9, border:'1.5px solid #e4e6ea', background:'#fff', color:'#6b7280', fontWeight:700, cursor:'pointer', fontSize:'0.82rem' }}>🚫 Block</button>
            </div>
          )}
          {isMe && (
            <div style={{ paddingBottom:8 }}>
              <button onClick={()=>setEditMode(p=>!p)} style={{ padding:'8px 16px', borderRadius:9, border:'1.5px solid #e4e6ea', background:'#fff', color:'#374151', fontWeight:700, cursor:'pointer', fontSize:'0.82rem' }}>✏️ {editMode?'Cancel Edit':'Edit Profile'}</button>
            </div>
          )}
        </div>

        {/* Edit form */}
        {editMode && isMe && (
          <div style={{ background:'#fff', border:'1px solid #e4e6ea', borderRadius:14, padding:20, marginTop:16 }}>
            <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:800, color:'#111827', display:'flex', alignItems:'center', gap:8 }}>✏️ Edit Profile</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
              {/* About — full width with 300 char counter */}
              <div style={{ gridColumn:'1/-1' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#9ca3af' }}>About Me</label>
                  <span style={{ fontSize:'0.68rem', color:(editForm.about||'').length>280?'#ef4444':'#9ca3af', fontWeight:600 }}>
                    {(editForm.about||'').length}/300
                  </span>
                </div>
                <textarea value={editForm.about||''} maxLength={300}
                  onChange={e=>setEditForm(p=>({...p,about:e.target.value.slice(0,300)}))} rows={3}
                  placeholder="Tell something about yourself... (max 300 characters)"
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e4e6ea', borderRadius:8, fontSize:'0.875rem', outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', lineHeight:1.6 }}
                  onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}
                />
              </div>
              {/* Mood */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#9ca3af' }}>Mood Status</label>
                  <span style={{ fontSize:'0.68rem', color:(editForm.mood||'').length>90?'#ef4444':'#9ca3af', fontWeight:600 }}>{(editForm.mood||'').length}/100</span>
                </div>
                <input value={editForm.mood||''} maxLength={100}
                  onChange={e=>setEditForm(p=>({...p,mood:e.target.value.slice(0,100)}))}
                  placeholder="How are you feeling today?"
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e4e6ea', borderRadius:8, fontSize:'0.875rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                  onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}
                />
              </div>
              {/* Name Color */}
              <div>
                <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#9ca3af', marginBottom:4 }}>Name Colour</label>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="color" value={editForm.nameColor||'#1a73e8'}
                    onChange={e=>setEditForm(p=>({...p,nameColor:e.target.value}))}
                    style={{ width:40, height:36, border:'1.5px solid #e4e6ea', borderRadius:7, cursor:'pointer', padding:2 }}
                  />
                  <input value={editForm.nameColor||''}
                    onChange={e=>setEditForm(p=>({...p,nameColor:e.target.value}))}
                    placeholder="#FF0000 or leave blank"
                    style={{ flex:1, padding:'9px 12px', border:'1.5px solid #e4e6ea', borderRadius:8, fontSize:'0.875rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                    onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}
                  />
                </div>
              </div>
              {/* Gender */}
              <div>
                <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#9ca3af', marginBottom:4 }}>Gender</label>
                <select value={editForm.gender||'other'} onChange={e=>setEditForm(p=>({...p,gender:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e4e6ea', borderRadius:8, fontSize:'0.875rem', outline:'none', background:'#f9fafb' }}>
                  {['male','female','couple','other'].map(g=><option key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1)}</option>)}
                </select>
              </div>
              {/* Avatar upload inline */}
              <div style={{ gridColumn:'1/-1', display:'flex', gap:12, alignItems:'center', padding:'12px', background:'#f0f7ff', borderRadius:10, border:'1px dashed #93c5fd' }}>
                <img src={profile.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width:52, height:52, borderRadius:'50%', objectFit:'cover', border:'2.5px solid #1a73e8', flexShrink:0 }} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
                <div style={{ flex:1 }}>
                  <p style={{ margin:'0 0 6px', fontWeight:700, fontSize:'0.82rem', color:'#1d4ed8' }}>📷 Profile Picture</p>
                  <p style={{ margin:'0 0 8px', fontSize:'0.72rem', color:'#6b7280' }}>Upload a new profile photo. Recommended: square image, min 200x200px.</p>
                  <button onClick={()=>avatarRef.current?.click()}
                    style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'#1a73e8', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'0.8rem' }}>
                    Choose Photo
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button onClick={saveProfile} style={{ padding:'10px 24px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:800, cursor:'pointer', fontSize:'0.88rem' }}>
                💾 Save Changes
              </button>
              <button onClick={()=>setEditMode(false)} style={{ padding:'10px 20px', borderRadius:9, border:'1.5px solid #e4e6ea', background:'#fff', color:'#374151', fontWeight:700, cursor:'pointer', fontSize:'0.88rem' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display:'flex', gap:20, margin:'16px 0 20px', flexWrap:'wrap' }}>
          {[
            { label:'Messages', value:profile.totalMessages||0 },
            { label:'Friends',  value:profile.friends?.length||0 },
            { label:'Photos',   value:profile.totalPhotos||0 },
            { label:'Gifts Received', value:profile.totalGiftsReceived||0 },
          ].map(s=>(
            <div key={s.label} style={{ textAlign:'center', minWidth:60 }}>
              <div style={{ fontSize:'1.2rem', fontWeight:900, color:'#1a73e8' }}>{s.value.toLocaleString()}</div>
              <div style={{ fontSize:'0.7rem', color:'#9ca3af', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {profile.about && (
          <div style={{ background:'#fff', border:'1px solid #e4e6ea', borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
            <p style={{ margin:0, fontSize:'0.88rem', color:'#374151', lineHeight:1.7 }}>{profile.about}</p>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:2, borderBottom:'2px solid #e4e6ea', marginBottom:20, overflowX:'auto' }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ padding:'10px 18px', border:'none', background:'none', cursor:'pointer', fontWeight:700, fontSize:'0.85rem', color:tab===t.id?'#1a73e8':'#6b7280', borderBottom:`2.5px solid ${tab===t.id?'#1a73e8':'transparent'}`, whiteSpace:'nowrap', transition:'all .15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* WALL TAB */}
        {tab==='wall' && (
          <div>
            {/* New post input */}
            <div style={{ background:'#fff', border:'1px solid #e4e6ea', borderRadius:12, padding:14, marginBottom:16 }}>
              <textarea value={newPost} onChange={e=>setNewPost(e.target.value)} rows={2}
                placeholder={isMe?'What\'s on your mind?':`Write on ${profile.username}'s wall...`}
                style={{ width:'100%', border:'1.5px solid #e4e6ea', borderRadius:8, padding:'9px 12px', fontSize:'0.875rem', resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}
              />
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
                <button onClick={postOnWall} disabled={!newPost.trim()} style={{ padding:'8px 20px', borderRadius:9, border:'none', background:newPost.trim()?'#1a73e8':'#f3f4f6', color:newPost.trim()?'#fff':'#9ca3af', fontWeight:700, cursor:newPost.trim()?'pointer':'not-allowed', fontSize:'0.85rem' }}>Post</button>
              </div>
            </div>
            {wallPosts.length===0 && <div style={{ textAlign:'center', padding:'40px', color:'#9ca3af' }}><div style={{ fontSize:'3rem', marginBottom:8 }}>📝</div>No wall posts yet</div>}
            {wallPosts.map(p=><WallPostCard key={p._id} post={p} meId={me?._id} onDelete={deletePost} onLike={likePost} onReply={replyPost}/>)}
          </div>
        )}

        {/* GALLERY TAB */}
        {tab==='gallery' && (
          <div>
            {isMe && (
              <div style={{ marginBottom:16 }}>
                <button onClick={()=>galleryRef.current?.click()} style={{ padding:'10px 20px', borderRadius:9, border:'1.5px dashed #1a73e8', background:'#f0f7ff', color:'#1a73e8', fontWeight:700, cursor:'pointer', fontSize:'0.85rem' }}>
                  📷 Upload Photo
                </button>
                <input ref={galleryRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>e.target.files[0]&&uploadGalleryPhoto(e.target.files[0])}/>
              </div>
            )}
            {gallery.length===0 && <div style={{ textAlign:'center', padding:'40px', color:'#9ca3af' }}><div style={{ fontSize:'3rem', marginBottom:8 }}>🖼️</div>No photos yet</div>}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10 }}>
              {gallery.map(p=><GalleryPhoto key={p._id} photo={p} isMe={isMe} meId={me?._id} onDelete={deleteGalleryPhoto} onLike={likeGalleryPhoto}/>)}
            </div>
          </div>
        )}

        {/* FRIENDS TAB */}
        {tab==='friends' && (
          <div>
            {/* Friend requests (only for me) */}
            {isMe && friendReqs.length>0 && (
              <div style={{ marginBottom:20 }}>
                <h3 style={{ margin:'0 0 12px', fontSize:'0.9rem', fontWeight:800, color:'#111827' }}>📨 Friend Requests ({friendReqs.length})</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {friendReqs.map(r=>(
                    <div key={r.from?._id} style={{ background:'#fff', border:'1px solid #e4e6ea', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
                      <img src={r.from?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width:40,height:40,borderRadius:'50%',objectFit:'cover' }} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:'0.88rem', color:'#111827' }}>{r.from?.username}</div>
                        <div style={{ fontSize:'0.72rem', color:RI(r.from?.rank).color, fontWeight:600 }}>{RI(r.from?.rank).label}</div>
                      </div>
                      <button onClick={()=>acceptFriend(r.from?._id)} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'#1a73e8', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'0.8rem' }}>Accept</button>
                      <button onClick={()=>apiFetch(`/api/users/friend/${r.from?._id}/decline`,{method:'DELETE'}).then(loadFriends)} style={{ padding:'7px 14px', borderRadius:8, border:'1.5px solid #e4e6ea', background:'#fff', color:'#6b7280', fontWeight:700, cursor:'pointer', fontSize:'0.8rem' }}>Decline</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h3 style={{ margin:'0 0 12px', fontSize:'0.9rem', fontWeight:800, color:'#111827' }}>👥 Friends ({friends.length})</h3>
            {friends.length===0 && <div style={{ textAlign:'center', padding:'40px', color:'#9ca3af' }}><div style={{ fontSize:'3rem', marginBottom:8 }}>👥</div>No friends yet</div>}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
              {friends.map(f=>(
                <div key={f._id} style={{ background:'#fff', border:'1px solid #e4e6ea', borderRadius:12, padding:14, textAlign:'center' }}>
                  <div style={{ position:'relative', width:56, height:56, margin:'0 auto 8px' }}>
                    <img src={f.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover', border:`2.5px solid ${GBR(f.gender,f.rank)}` }} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
                    {f.isOnline && <span style={{ position:'absolute', bottom:1, right:1, width:12, height:12, background:'#22c55e', borderRadius:'50%', border:'2px solid #fff' }}/>}
                  </div>
                  <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#111827', marginBottom:2 }}>{f.username}</div>
                  <div style={{ fontSize:'0.7rem', color:RI(f.rank).color, marginBottom:10, fontWeight:600 }}>{RI(f.rank).label}</div>
                  <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                    <button onClick={()=>nav(`/profile/${f.username}`)} style={{ padding:'5px 10px', borderRadius:7, border:'none', background:'#1a73e8', color:'#fff', cursor:'pointer', fontSize:'0.75rem', fontWeight:700 }}>View</button>
                    {isMe && <button onClick={()=>removeFriend(f._id)} style={{ padding:'5px 10px', borderRadius:7, border:'1.5px solid #e4e6ea', background:'#fff', color:'#ef4444', cursor:'pointer', fontSize:'0.75rem', fontWeight:700 }}>Remove</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIP TAB */}
        {tab==='vip' && isMe && (
          <div style={{ background:'#fff', border:'1px solid #e4e6ea', borderRadius:12, overflow:'hidden' }}>
            <VIPPanel user={profile} toast={toast} onRefresh={loadProfile}/>
          </div>
        )}

        {/* PREFERENCES TAB */}
        {tab==='preferences' && isMe && (
          <div>
            {/* Sound Preferences */}
            <PrefSection title="🔔 Notifications & Sounds">
              <PrefToggle label="Disable Private Messages" desc="No one can send you PMs" val={prefs.disablePM} onChange={v=>savePref('disablePM',v)}/>
              <PrefToggle label="Disable Username Tag Sound" desc="No sound when someone mentions your name" val={prefs.disableTagSound} onChange={v=>savePref('disableTagSound',v)}/>
              <PrefToggle label="Disable PM Sound" desc="No notification sound for private messages" val={prefs.disablePMSound} onChange={v=>savePref('disablePMSound',v)}/>
              <PrefToggle label="Disable Join/Leave Sound" desc="No sound when users join or leave rooms" val={prefs.disableJoinSound} onChange={v=>savePref('disableJoinSound',v)}/>
              <PrefToggle label="Hide Join/Leave Announcements" desc="System messages for joins/leaves won't show" val={prefs.disableJoinMsg} onChange={v=>savePref('disableJoinMsg',v)}/>
              <PrefToggle label="Disable Room Message Alert" desc="No unread badge on room message notifications" val={prefs.disableRoomAlert} onChange={v=>savePref('disableRoomAlert',v)}/>
            </PrefSection>
            {/* Privacy */}
            <PrefSection title="🔒 Privacy & Appearance">
              <PrefToggle label="Hide Images in Chat" desc="Images shared in chat won't be displayed" val={prefs.hideImagesInChat} onChange={v=>savePref('hideImagesInChat',v)}/>
              <PrefToggle label="Private Profile" desc="Only friends can view your profile details" val={prefs.privateProfile} onChange={v=>savePref('privateProfile',v)}/>
              <PrefToggle label="Hide Camera" desc="Don't share your webcam in video rooms" val={prefs.hideCamera} onChange={v=>savePref('hideCamera',v)}/>
            </PrefSection>
            {/* Theme */}
            <PrefSection title="🎨 Theme">
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {[{id:'auto',label:'🌗 Auto',desc:'Follow device'},{id:'light',label:'☀️ Light',desc:'Always light'},{id:'dark',label:'🌙 Dark',desc:'Always dark'}].map(t=>(
                  <button key={t.id} onClick={()=>savePref('theme',t.id)}
                    style={{ padding:'10px 18px', borderRadius:10, border:`2px solid ${(prefs.theme||'auto')===t.id?'#1a73e8':'#e4e6ea'}`, background:(prefs.theme||'auto')===t.id?'#e8f0fe':'#f9fafb', color:(prefs.theme||'auto')===t.id?'#1a73e8':'#374151', cursor:'pointer', fontWeight:700, fontSize:'0.83rem', transition:'all .15s', textAlign:'center', minWidth:90 }}>
                    <div>{t.label}</div>
                    <div style={{ fontSize:'0.67rem', color:'#9ca3af', fontWeight:500, marginTop:2 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </PrefSection>
            {/* Blocked Users */}
            <PrefSection title="🚫 Blocked Users">
              <button onClick={()=>{ setTab('blocked_inner'); loadBlocked() }} style={{ marginBottom:12, padding:'8px 16px', borderRadius:8, border:'1.5px solid #e4e6ea', background:'#fff', color:'#6b7280', fontWeight:700, cursor:'pointer', fontSize:'0.82rem' }}>
                View All Blocked Users ({blocked.length})
              </button>
              {blocked.length===0 ? (
                <div style={{ textAlign:'center', padding:'24px', color:'#9ca3af', background:'#f9fafb', borderRadius:10 }}>
                  <div style={{ fontSize:'2rem', marginBottom:6 }}>✅</div>
                  <p style={{ margin:0, fontSize:'0.82rem', fontWeight:600 }}>No blocked users</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:320, overflowY:'auto' }}>
                  {blocked.map(b=>(
                    <div key={b._id} style={{ background:'#f9fafb', border:'1px solid #e4e6ea', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                      <img src={b.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width:36,height:36,borderRadius:'50%',objectFit:'cover',flexShrink:0 }} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.username}</div>
                        <div style={{ fontSize:'0.7rem', color:RI(b.rank||'user').color, fontWeight:600 }}>{RI(b.rank||'user').label}</div>
                      </div>
                      <button onClick={()=>unblockUser(b._id)}
                        style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #1a73e8', background:'#e8f0fe', color:'#1a73e8', fontWeight:700, cursor:'pointer', fontSize:'0.78rem', whiteSpace:'nowrap' }}>
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </PrefSection>
            {savingPrefs && <div style={{ textAlign:'center', padding:'8px', color:'#1a73e8', fontSize:'0.8rem', fontWeight:600 }}>Saving...</div>}
          </div>
        )}

        <div style={{ height:60 }}/>
      </div>
    </div>
  )
}
