/**
 * AvatarDropdown.jsx — FIXED
 * Fixes:
 * 1. /default_images/avatar/ → /default_avatar/ (correct public folder)
 * 2. /default_images/icons/gold.svg → /icons/gold.svg
 * 3. /default_images/icons/level.svg → /icons/level.svg
 * 4. Menu items now have working onClick handlers (My Profile, Edit Profile, Wallet, Level Status)
 * 5. Profile nav → /profile/:username (will need ProfilePage to be created)
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { R, GBR, RIcon, STATUSES } from '../../utils/chatHelpers.js'
import { getAvatarUrl } from '../../constants.js'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ── LEVEL STATUS MODAL ─────────────────────────────────────────
// FIX: was in menu but had no implementation
function LevelModal({ me, onClose }) {
  const xpForNext = 100
  const progress = ((me?.xp || 0) % xpForNext) / xpForNext * 100
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:18, maxWidth:320, width:'100%', padding:'22px 20px', boxShadow:'0 16px 48px rgba(0,0,0,.18)', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:8 }}>⭐</div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.1rem', color:'#111827', marginBottom:4 }}>Level {me?.level || 1}</div>
        <div style={{ fontSize:'0.8rem', color:'#9ca3af', marginBottom:16 }}>
          {me?.xp || 0} XP total &nbsp;|&nbsp; {(me?.xp || 0) % xpForNext} / {xpForNext} XP to next level
        </div>
        <div style={{ background:'#f3f4f6', borderRadius:20, height:10, marginBottom:16, overflow:'hidden' }}>
          <div style={{ width:`${progress}%`, height:'100%', background:'linear-gradient(135deg,#1a73e8,#7c3aed)', borderRadius:20, transition:'width .5s' }}/>
        </div>
        <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:14 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#d97706' }}>{me?.gold || 0}</div>
            <div style={{ fontSize:'0.7rem', color:'#9ca3af' }}>Gold</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#1a73e8' }}>{me?.totalMessages || 0}</div>
            <div style={{ fontSize:'0.7rem', color:'#9ca3af' }}>Messages</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#7c3aed' }}>{me?.totalGiftsReceived || 0}</div>
            <div style={{ fontSize:'0.7rem', color:'#9ca3af' }}>Gifts</div>
          </div>
        </div>
        <button onClick={onClose} style={{ padding:'9px 24px', borderRadius:9, border:'none', background:'#f3f4f6', color:'#374151', fontWeight:600, cursor:'pointer' }}>Close</button>
      </div>
    </div>
  )
}

// ── WALLET MODAL ────────────────────────────────────────────────
// FIX: was in menu but had no implementation
function WalletModal({ me, onClose }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:18, maxWidth:320, width:'100%', padding:'22px 20px', boxShadow:'0 16px 48px rgba(0,0,0,.18)', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:8 }}>💰</div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.1rem', color:'#111827', marginBottom:14 }}>My Wallet</div>
        <div style={{ background:'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius:14, padding:'16px 20px', marginBottom:16, textAlign:'left' }}>
          <div style={{ fontSize:'0.75rem', fontWeight:600, color:'rgba(255,255,255,.8)', marginBottom:4 }}>Gold Balance</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.8rem', color:'#fff' }}>{me?.gold || 0} 🪙</div>
        </div>
        <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 16px', marginBottom:16, textAlign:'left' }}>
          <div style={{ fontSize:'0.8rem', color:'#6b7280', marginBottom:8, fontWeight:700 }}>Quick Actions</div>
          <button onClick={onClose} style={{ display:'block', width:'100%', padding:'8px 12px', background:'#e8f0fe', border:'none', borderRadius:8, color:'#1a73e8', fontWeight:700, cursor:'pointer', fontSize:'0.84rem', textAlign:'left', marginBottom:6 }}>
            <i className="fi fi-sr-store-alt" style={{ marginRight:8 }}/>Buy Gold Coins
          </button>
          <button onClick={onClose} style={{ display:'block', width:'100%', padding:'8px 12px', background:'#fdf4ff', border:'none', borderRadius:8, color:'#7c3aed', fontWeight:700, cursor:'pointer', fontSize:'0.84rem', textAlign:'left' }}>
            <i className="fi fi-sr-crown" style={{ marginRight:8 }}/>Get VIP Premium
          </button>
        </div>
        <button onClick={onClose} style={{ padding:'9px 24px', borderRadius:9, border:'none', background:'#f3f4f6', color:'#374151', fontWeight:600, cursor:'pointer' }}>Close</button>
      </div>
    </div>
  )
}

export default function AvatarDropdown({ me, status, setStatus, onLeave, socket }) {
  const [open,      setOpen]      = useState(false)
  const [showLevel, setShowLevel] = useState(false)
  const [showWallet,setShowWallet]= useState(false)
  const ref  = useRef(null)
  const nav  = useNavigate()

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  const ri      = R(me?.rank)
  const border  = GBR(me?.gender, me?.rank)
  const curSt   = STATUSES.find(s => s.id === status) || STATUSES[0]
  const isStaff = ['moderator', 'admin', 'superadmin', 'owner'].includes(me?.rank)
  const isOwner = me?.rank === 'owner'

  // FIX: All menu items now have working fn handlers
  const menuItems = [
    { icon: 'fi-ss-user',        label: 'My Profile',   fn: () => { setOpen(false); nav(`/profile/${me?.username}`) } },
    { icon: 'fi-sr-pencil',      label: 'Edit Profile', fn: () => { setOpen(false); nav(`/profile/${me?.username}?edit=1`) } },
    { icon: 'fi-sr-wallet',      label: 'Wallet',       fn: () => { setOpen(false); setShowWallet(true) } },
    { icon: 'fi-sr-layer-group', label: 'Level Status', fn: () => { setOpen(false); setShowLevel(true) } },
    isStaff && { icon: 'fi-sr-settings',  label: 'Room Options', fn: () => setOpen(false) },
    isStaff && { icon: 'fi-sr-dashboard', label: 'Admin Panel', color: '#ef4444', fn: () => { setOpen(false); window.location.href = '/admin' } },
    isOwner && { icon: 'fi-sr-cog',       label: 'Site Settings', color: '#7c3aed', fn: () => setOpen(false) },
  ].filter(Boolean)

  function logout() {
    const t = localStorage.getItem('cgz_token')
    if (t) fetch(`${API}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } }).catch(() => {})
    localStorage.removeItem('cgz_token')
    nav('/login')
  }

  // FIX: correct avatar path
  const avatarSrc = getAvatarUrl(me?.avatar)

  return (
    <>
      <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
        >
          <div style={{ position: 'relative' }}>
            <img
              src={avatarSrc}
              alt=""
              style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${border}`, display: 'block' }}
              onError={e => (e.target.src = '/default_avatar/other.png')}
            />
            <span style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, background: curSt.color, borderRadius: '50%', border: '1.5px solid #fff' }} />
          </div>
        </button>

        {open && (
          <div
            style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#fff', border: '1px solid #e4e6ea', borderRadius: 13, minWidth: 220, boxShadow: '0 6px 24px rgba(0,0,0,.13)', zIndex: 999, overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* User info */}
            <div style={{ padding: '12px 13px 9px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                <img
                  src={avatarSrc}
                  alt=""
                  style={{ width: 40, height: 40, borderRadius: '50%', border: `2.5px solid ${border}`, objectFit: 'cover', flexShrink: 0 }}
                  onError={e => (e.target.src = '/default_avatar/other.png')}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '0.9rem', color: me?.nameColor || '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {me?.username}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <RIcon rank={me?.rank} size={12} />
                    <span style={{ fontSize: '0.7rem', color: ri.color, fontWeight: 700 }}>{ri.label}</span>
                  </div>
                </div>
              </div>
              {!me?.isGuest && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {/* FIX: was /default_images/icons/gold.svg → /icons/gold.svg */}
                    <img src="/icons/gold.svg" style={{ width: 13, height: 13 }} alt="" onError={() => {}} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d97706' }}>{me?.gold || 0}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {/* FIX: was /default_images/icons/level.svg → /icons/level.svg */}
                    <img src="/icons/level.svg" style={{ width: 13, height: 13 }} alt="" onError={() => {}} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a73e8' }}>Lv.{me?.level || 1}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Status pills */}
            <div style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {STATUSES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setStatus(s.id); socket?.emit('updateStatus', { status: s.id }) }}
                    title={s.label}
                    style={{ flex: 1, padding: '5px 2px', borderRadius: 6, border: `1.5px solid ${status === s.id ? s.color : '#e4e6ea'}`, background: status === s.id ? `${s.color}18` : 'none', cursor: 'pointer', fontSize: '0.63rem', fontWeight: 600, color: status === s.id ? s.color : '#6b7280', transition: 'all .15s' }}
                  >
                    {s.label.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu items */}
            <div style={{ padding: '4px' }}>
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => item.fn?.()}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', color: item.color || '#374151', fontSize: '0.84rem', fontWeight: 600, borderRadius: 7, textAlign: 'left', transition: 'background .12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <i className={`fi ${item.icon}`} style={{ fontSize: 13, width: 15, textAlign: 'center', flexShrink: 0 }} />
                  {item.label}
                </button>
              ))}

              <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0' }} />

              <button
                onClick={onLeave}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151', fontSize: '0.84rem', fontWeight: 600, borderRadius: 7, textAlign: 'left', transition: 'background .12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <i className="fi fi-sr-arrow-left" style={{ fontSize: 13, width: 15, textAlign: 'center', flexShrink: 0 }} />
                Leave Room
              </button>

              <button
                onClick={logout}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.84rem', fontWeight: 600, borderRadius: 7, textAlign: 'left', transition: 'background .12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <i className="fi fi-sr-user-logout" style={{ fontSize: 13, width: 15, textAlign: 'center', flexShrink: 0 }} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FIX: Level Status Modal */}
      {showLevel && <LevelModal me={me} onClose={()=>setShowLevel(false)}/>}
      {/* FIX: Wallet Modal */}
      {showWallet && <WalletModal me={me} onClose={()=>setShowWallet(false)}/>}
    </>
  )
}
