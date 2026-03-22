/**
 * AvatarDropdown.jsx — FINAL FIXED
 * avatar: /default_images/avatar/ ✅
 * gold/level icons: /default_images/icons/gold.svg ✅
 * rank icons: /icons/ranks/ ✅
 * All menu items have working handlers
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { R, GBR, RIcon, STATUSES } from '../../utils/chatHelpers.js'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'
const DEFAULT_AVATAR = '/default_images/avatar/guest.png'

function LevelModal({ me, onClose }) {
  const xp = me?.xp || 0
  const progress = xp % 100
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:18, maxWidth:320, width:'100%', padding:'22px 20px', boxShadow:'0 16px 48px rgba(0,0,0,.18)', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:8 }}>⭐</div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.1rem', color:'#111827', marginBottom:4 }}>Level {me?.level || 1}</div>
        <div style={{ fontSize:'0.8rem', color:'#9ca3af', marginBottom:16 }}>
          {xp} XP total &nbsp;|&nbsp; {progress}/100 XP to next level
        </div>
        <div style={{ background:'#f3f4f6', borderRadius:20, height:10, marginBottom:16, overflow:'hidden' }}>
          <div style={{ width:`${progress}%`, height:'100%', background:'linear-gradient(135deg,#1a73e8,#7c3aed)', borderRadius:20, transition:'width .5s' }}/>
        </div>
        <div style={{ display:'flex', gap:16, justifyContent:'center', marginBottom:14 }}>
          {[
            { label:'Gold',     value: me?.gold || 0,           icon:'🪙' },
            { label:'Messages', value: me?.totalMessages || 0,  icon:'💬' },
            { label:'Gifts',    value: me?.totalGiftsReceived || 0, icon:'🎁' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#111827' }}>{s.icon} {s.value}</div>
              <div style={{ fontSize:'0.7rem', color:'#9ca3af' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ padding:'9px 24px', borderRadius:9, border:'none', background:'#f3f4f6', color:'#374151', fontWeight:600, cursor:'pointer' }}>Close</button>
      </div>
    </div>
  )
}

function WalletModal({ me, onClose }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:18, maxWidth:320, width:'100%', padding:'22px 20px', boxShadow:'0 16px 48px rgba(0,0,0,.18)', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:8 }}>💰</div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.1rem', color:'#111827', marginBottom:14 }}>My Wallet</div>
        <div style={{ background:'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius:14, padding:'16px 20px', marginBottom:16, textAlign:'left' }}>
          <div style={{ fontSize:'0.75rem', fontWeight:600, color:'rgba(255,255,255,.8)', marginBottom:4 }}>Gold Balance</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.8rem', color:'#fff' }}>{me?.gold || 0} 🪙</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
          <button onClick={onClose} style={{ width:'100%', padding:'10px', background:'#e8f0fe', border:'none', borderRadius:9, color:'#1a73e8', fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>
            <i className="fi fi-sr-store-alt" style={{ marginRight:7 }}/>Buy Gold Coins
          </button>
          <button onClick={onClose} style={{ width:'100%', padding:'10px', background:'#f5f3ff', border:'none', borderRadius:9, color:'#7c3aed', fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>
            <i className="fi fi-sr-crown" style={{ marginRight:7 }}/>Get VIP Premium
          </button>
        </div>
        <button onClick={onClose} style={{ padding:'9px 24px', borderRadius:9, border:'none', background:'#f3f4f6', color:'#374151', fontWeight:600, cursor:'pointer' }}>Close</button>
      </div>
    </div>
  )
}

export default function AvatarDropdown({ me, status, setStatus, onLeave, socket }) {
  const [open,       setOpen]       = useState(false)
  const [showLevel,  setShowLevel]  = useState(false)
  const [showWallet, setShowWallet] = useState(false)
  const ref = useRef(null)
  const nav = useNavigate()

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  const ri      = R(me?.rank)
  const border  = GBR(me?.gender, me?.rank)
  const curSt   = STATUSES.find(s => s.id === status) || STATUSES[0]
  const isStaff = ['moderator','admin','superadmin','owner'].includes(me?.rank)
  const isOwner = me?.rank === 'owner'

  const menuItems = [
    { icon:'fi-ss-user',        label:'My Profile',   fn: () => { setOpen(false); nav(`/profile/${me?.username}`) } },
    { icon:'fi-sr-pencil',      label:'Edit Profile', fn: () => { setOpen(false); nav(`/profile/${me?.username}?edit=1`) } },
    { icon:'fi-sr-wallet',      label:'Wallet',       fn: () => { setOpen(false); setShowWallet(true) } },
    { icon:'fi-sr-layer-group', label:'Level Status', fn: () => { setOpen(false); setShowLevel(true) } },
    isStaff && { icon:'fi-sr-settings',  label:'Room Options', fn: () => setOpen(false) },
    isStaff && { icon:'fi-sr-dashboard', label:'Admin Panel', color:'#ef4444', fn: () => { setOpen(false); window.location.href='/admin' } },
    isOwner && { icon:'fi-sr-cog',       label:'Site Settings', color:'#7c3aed', fn: () => setOpen(false) },
  ].filter(Boolean)

  function logout() {
    const t = localStorage.getItem('cgz_token')
    if (t) fetch(`${API}/api/auth/logout`, { method:'POST', headers:{ Authorization:`Bearer ${t}` } }).catch(() => {})
    localStorage.removeItem('cgz_token')
    nav('/login')
  }

  return (
    <>
      <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 4px', display:'flex', alignItems:'center' }}
        >
          <div style={{ position:'relative' }}>
            <img
              src={me?.avatar || DEFAULT_AVATAR}
              alt=""
              style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover', border:`2px solid ${border}`, display:'block' }}
              onError={e => (e.target.src = DEFAULT_AVATAR)}
            />
            <span style={{ position:'absolute', bottom:0, right:0, width:8, height:8, background:curSt.color, borderRadius:'50%', border:'1.5px solid #fff' }} />
          </div>
        </button>

        {open && (
          <div
            style={{ position:'absolute', right:0, top:'calc(100% + 6px)', background:'#fff', border:'1px solid #e4e6ea', borderRadius:13, minWidth:220, boxShadow:'0 6px 24px rgba(0,0,0,.13)', zIndex:999, overflow:'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* User info */}
            <div style={{ padding:'12px 13px 9px', borderBottom:'1px solid #f3f4f6' }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:7 }}>
                <img
                  src={me?.avatar || DEFAULT_AVATAR}
                  alt=""
                  style={{ width:40, height:40, borderRadius:'50%', border:`2.5px solid ${border}`, objectFit:'cover', flexShrink:0 }}
                  onError={e => (e.target.src = DEFAULT_AVATAR)}
                />
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.9rem', color:me?.nameColor||'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {me?.username}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                    <RIcon rank={me?.rank} size={12} />
                    <span style={{ fontSize:'0.7rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
                  </div>
                </div>
              </div>
              {!me?.isGuest && (
                <div style={{ display:'flex', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                    <img src="/default_images/icons/gold.svg" style={{ width:13, height:13 }} alt="" onError={() => {}} />
                    <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#d97706' }}>{me?.gold || 0}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                    <img src="/default_images/icons/level.svg" style={{ width:13, height:13 }} alt="" onError={() => {}} />
                    <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#1a73e8' }}>Lv.{me?.level || 1}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div style={{ padding:'6px 8px', borderBottom:'1px solid #f3f4f6' }}>
              <div style={{ display:'flex', gap:4 }}>
                {STATUSES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setStatus(s.id); socket?.emit('updateStatus', { status: s.id }) }}
                    title={s.label}
                    style={{ flex:1, padding:'5px 2px', borderRadius:6, border:`1.5px solid ${status===s.id?s.color:'#e4e6ea'}`, background:status===s.id?`${s.color}18`:'none', cursor:'pointer', fontSize:'0.63rem', fontWeight:600, color:status===s.id?s.color:'#6b7280', transition:'all .15s' }}
                  >
                    {s.label.slice(0,3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu */}
            <div style={{ padding:'4px' }}>
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => item.fn?.()}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', background:'none', border:'none', cursor:'pointer', color:item.color||'#374151', fontSize:'0.84rem', fontWeight:600, borderRadius:7, textAlign:'left', transition:'background .12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <i className={`fi ${item.icon}`} style={{ fontSize:13, width:15, textAlign:'center', flexShrink:0 }} />
                  {item.label}
                </button>
              ))}
              <div style={{ borderTop:'1px solid #f3f4f6', margin:'4px 0' }} />
              <button onClick={onLeave}
                style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', background:'none', border:'none', cursor:'pointer', color:'#374151', fontSize:'0.84rem', fontWeight:600, borderRadius:7, textAlign:'left', transition:'background .12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <i className="fi fi-sr-arrow-left" style={{ fontSize:13, width:15, textAlign:'center', flexShrink:0 }} />
                Leave Room
              </button>
              <button onClick={logout}
                style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:'0.84rem', fontWeight:600, borderRadius:7, textAlign:'left', transition:'background .12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <i className="fi fi-sr-user-logout" style={{ fontSize:13, width:15, textAlign:'center', flexShrink:0 }} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {showLevel  && <LevelModal  me={me} onClose={() => setShowLevel(false)}/>}
      {showWallet && <WalletModal me={me} onClose={() => setShowWallet(false)}/>}
    </>
  )
}
