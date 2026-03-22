/**
 * NotifPanel.jsx
 * Notifications dropdown — fetches from /api/notifications.
 * Mark read via PUT /api/notifications/read-all
 */
import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

const TYPE_EMOJI = { gift: '🎁', friend: '👥', like: '❤️', badge: '🏅', levelup: '⬆️', call: '📞' }

export default function NotifPanel({ onClose, onCount }) {
  const [list, setList] = useState([])
  const [load, setLoad] = useState(true)
  const token = localStorage.getItem('cgz_token')

  useEffect(() => {
    // BUG FIX: original code shadowed window.fetch with a local function of the same name,
    // causing an infinite recursive call. Now named loadNotifs().
    loadNotifs()
  }, [])

  async function loadNotifs() {
    try {
      const r = await window.fetch(`${API}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      setList(d.notifications || [])
      onCount?.(d.unreadCount || 0)
    } catch {}
    finally { setLoad(false) }
  }

  async function markAll() {
    await window.fetch(`${API}/api/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
    setList(p => p.map(n => ({ ...n, isRead: true })))
    onCount?.(0)
  }

  const unread = list.filter(n => !n.isRead).length

  return (
    <div
      style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#fff', border: '1px solid #e4e6ea', borderRadius: 14, width: 310, maxHeight: 420, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 28px rgba(0,0,0,.14)', zIndex: 999 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '0.9rem', color: '#111827' }}>Notifications</span>
          {unread > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{unread}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {unread > 0 && (
            <button onClick={markAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a73e8', fontSize: '0.75rem', fontWeight: 600 }}>
              Mark all read
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14 }}>
            <i className="fi fi-sr-cross-small" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {load && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ width: 22, height: 22, border: '2px solid #e4e6ea', borderTop: '2px solid #1a73e8', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} />
          </div>
        )}
        {!load && list.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9ca3af' }}>
            <i className="fi fi-sr-bell" style={{ fontSize: 32, display: 'block', marginBottom: 8, opacity: 0.3 }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>No notifications</p>
          </div>
        )}
        {list.map(n => (
          <div
            key={n._id}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f9fafb', background: n.isRead ? 'transparent' : '#f0f7ff' }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {TYPE_EMOJI[n.type] || '🔔'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: n.isRead ? 600 : 700, color: '#111827' }}>{n.title}</div>
              {n.message && (
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
              )}
              <div style={{ fontSize: '0.67rem', color: '#9ca3af', marginTop: 3 }}>
                {new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {!n.isRead && (
              <span style={{ width: 8, height: 8, background: '#1a73e8', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
