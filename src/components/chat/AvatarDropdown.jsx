/**
 * AvatarDropdown.jsx
 * User avatar menu in ChatRoom header.
 * Status selector, profile links, logout, leave room.
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { R, GBR, RIcon, STATUSES } from '../../utils/chatHelpers.js'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

export default function AvatarDropdown({ me, status, setStatus, onLeave, socket }) {
  const [open, setOpen] = useState(false)
  const ref  = useRef(null)
  const nav  = useNavigate()

  // Close on outside click
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

  const menuItems = [
    { icon: 'fi-ss-user',      label: 'My Profile' },
    { icon: 'fi-sr-pencil',    label: 'Edit Profile' },
    { icon: 'fi-sr-wallet',    label: 'Wallet' },
    { icon: 'fi-sr-layer-group', label: 'Level Status' },
    isStaff && { icon: 'fi-sr-settings',   label: 'Room Options' },
    isStaff && { icon: 'fi-sr-dashboard',  label: 'Admin Panel', color: '#ef4444', fn: () => { setOpen(false); window.location.href = '/admin' } },
    isOwner && { icon: 'fi-sr-cog',        label: 'Site Settings', color: '#7c3aed' },
  ].filter(Boolean)

  function logout() {
    const t = localStorage.getItem('cgz_token')
    if (t) fetch(`${API}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } }).catch(() => {})
    localStorage.removeItem('cgz_token')
    nav('/login')
  }

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
      >
        <div style={{ position: 'relative' }}>
          <img
            src={me?.avatar || '/default_images/avatar/default_guest.png'}
            alt=""
            style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${border}`, display: 'block' }}
            onError={e => (e.target.src = '/default_images/avatar/default_guest.png')}
          />
          <span style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, background: curSt.color, borderRadius: '50%', border: '1.5px solid #fff' }} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#fff', border: '1px solid #e4e6ea', borderRadius: 13, minWidth: 220, boxShadow: '0 6px 24px rgba(0,0,0,.13)', zIndex: 999, overflow: 'hidden' }}
          onClick={e => e.stopPropagation()}
        >
          {/* User info */}
          <div style={{ padding: '12px 13px 9px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
              <img
                src={me?.avatar || '/default_images/avatar/default_guest.png'}
                alt=""
                style={{ width: 40, height: 40, borderRadius: '50%', border: `2.5px solid ${border}`, objectFit: 'cover', flexShrink: 0 }}
                onError={e => (e.target.src = '/default_images/avatar/default_guest.png')}
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
                  <img src="/default_images/icons/gold.svg" style={{ width: 13, height: 13 }} alt="" onError={() => {}} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d97706' }}>{me?.gold || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <img src="/default_images/icons/level.svg" style={{ width: 13, height: 13 }} alt="" onError={() => {}} />
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
                onClick={() => { item.fn?.(); setOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', color: item.color || '#374151', fontSize: '0.84rem', fontWeight: 600, borderRadius: 7, textAlign: 'left', transition: 'background .12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <i className={`fi ${item.icon}`} style={{ fontSize: 13, width: 15, textAlign: 'center', flexShrink: 0 }} />
                {item.label}
              </button>
            ))}

            <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0' }} />

            {/* Leave room */}
            <button
              onClick={onLeave}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151', fontSize: '0.84rem', fontWeight: 600, borderRadius: 7, textAlign: 'left', transition: 'background .12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <i className="fi fi-sr-arrow-left" style={{ fontSize: 13, width: 15, textAlign: 'center', flexShrink: 0 }} />
              Leave Room
            </button>

            {/* Logout */}
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
  )
}
