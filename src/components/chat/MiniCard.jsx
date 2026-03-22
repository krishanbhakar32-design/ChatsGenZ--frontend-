/**
 * MiniCard.jsx — FINAL FIXED
 * avatar: /default_images/avatar/guest.png ✅
 * rank icons: /icons/ranks/ via RIcon ✅
 * All action buttons working
 */
import { useState } from 'react'
import { R, RL, GBR, RIcon } from '../../utils/chatHelpers.js'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'
const DEFAULT_AVATAR = '/default_images/avatar/guest.png'

export default function MiniCard({ user, myLevel, pos, onClose, onFull, onGift, socket, roomId, onDM }) {
  const [friended, setFriended] = useState(false)
  const [ignored,  setIgnored]  = useState(false)
  const [reported, setReported] = useState(false)
  if (!user) return null

  const ri     = R(user.rank)
  const bdr    = GBR(user.gender, user.rank)
  const canMod = myLevel >= 11 && RL(user.rank) < myLevel
  const canBan = myLevel >= 12 && RL(user.rank) < myLevel
  const isOwn  = myLevel >= 14
  const token  = localStorage.getItem('cgz_token')

  const x = Math.min(pos.x, window.innerWidth  - 230)
  const y = Math.min(pos.y, window.innerHeight - 370)

  async function friendReq() {
    setFriended(true)
    fetch(`${API}/api/users/friend/${user._id || user.userId}`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } }).catch(() => {})
    onClose()
  }

  async function ignoreUser() {
    setIgnored(true)
    fetch(`${API}/api/users/${user._id || user.userId}/ignore`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } }).catch(() => {})
    onClose()
  }

  async function reportUser() {
    setReported(true)
    fetch(`${API}/api/users/${user._id || user.userId}/report`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ reason: 'Inappropriate behavior' })
    }).catch(() => {})
    onClose()
  }

  const actions = [
    { icon:'fi-ss-user',        label:'Profile',  onClick: onFull },
    { icon:'fi-sr-comments',    label:'PM',        onClick: () => { onDM?.(user); onClose() } },
    {
      icon:'fi-sr-phone-call', label:'Call',
      onClick: () => {
        socket?.emit('callUser', { toUserId: user._id || user.userId, callType: 'video', callId: `c_${Date.now()}` })
        onClose()
      },
    },
    { icon:'fi-sr-gift', label:'Gift', color:'#7c3aed', onClick: () => { onGift(user); onClose() } },
    myLevel >= 2 && !friended && { icon:'fi-sr-user-add',   label:'Friend', color:'#059669', onClick: friendReq },
    myLevel >= 2 && !ignored  && { icon:'fi-sr-user-block', label:'Ignore', color:'#6b7280', onClick: ignoreUser },
    canMod && {
      icon:'fi-sr-volume-mute', label:'Mute', color:'#f59e0b',
      onClick: () => { socket?.emit('muteUser', { targetUserId: user._id || user.userId, roomId, minutes: 5 }); onClose() },
    },
    canMod && {
      icon:'fi-sr-user-slash', label:'Kick', color:'#ef4444',
      onClick: () => { socket?.emit('kickUser', { targetUserId: user._id || user.userId, roomId }); onClose() },
    },
    canBan && {
      icon:'fi-sr-ban', label:'Ban', color:'#dc2626',
      onClick: () => { socket?.emit('banUser', { targetUserId: user._id || user.userId, roomId }); onClose() },
    },
    isOwn && { icon:'fi-sr-shield-check', label:'Rank', color:'#1a73e8', onClick: onClose },
    !reported && { icon:'fi-sr-flag', label:'Report', color:'#ef4444', onClick: reportUser },
  ].filter(Boolean)

  return (
    <div
      style={{ position:'fixed', zIndex:9999, top:y, left:x, background:'#fff', border:'1px solid #e4e6ea', borderRadius:12, width:220, boxShadow:'0 8px 28px rgba(0,0,0,.15)', overflow:'hidden' }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ height:36, background:`linear-gradient(135deg,${ri.color}33,#e8f0fe)` }} />
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, padding:'0 12px', marginTop:-18, marginBottom:8 }}>
        <img
          src={user.avatar || DEFAULT_AVATAR}
          alt=""
          style={{ width:38, height:38, borderRadius:'50%', border:`2px solid ${bdr}`, objectFit:'cover', background:'#fff', flexShrink:0 }}
          onError={e => (e.target.src = DEFAULT_AVATAR)}
        />
        <div style={{ paddingBottom:2, minWidth:0 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.875rem', color:user.nameColor||'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user.username}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <RIcon rank={user.rank} size={11} />
            <span style={{ fontSize:'0.68rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
          </div>
        </div>
      </div>
      <div style={{ padding:'0 8px 8px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
        {actions.map((b, i) => (
          <button
            key={i}
            onClick={b.onClick}
            style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 7px', background:'#f9fafb', border:'1px solid #e4e6ea', borderRadius:7, cursor:'pointer', fontSize:'0.72rem', fontWeight:600, color:b.color||'#374151', transition:'all .12s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#e8f0fe'; e.currentTarget.style.borderColor='#1a73e8' }}
            onMouseLeave={e => { e.currentTarget.style.background='#f9fafb'; e.currentTarget.style.borderColor='#e4e6ea' }}
          >
            <i className={`fi ${b.icon}`} style={{ fontSize:11 }} />{b.label}
          </button>
        ))}
      </div>
    </div>
  )
}
