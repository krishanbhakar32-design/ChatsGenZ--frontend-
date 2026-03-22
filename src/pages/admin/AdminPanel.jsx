/**
 * AdminPanel.jsx — BRAND NEW
 * Full admin dashboard frontend:
 * - Dashboard stats
 * - Users list: search, ban, unban, mute, rank change, gold grant
 * - Rooms: view, pin, delete, clear messages
 * - Reports list
 * - Gifts management
 * - News/Announcements
 * Only accessible to moderator+ ranks
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RANKS, getRankColor, getRankLabel, getAvatarUrl } from '../constants.js'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ── HELPERS ────────────────────────────────────────────────────
function Stat({ icon, label, value, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e4e6ea', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`fi ${icon}`} style={{ fontSize: 20, color }}/>
      </div>
      <div>
        <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.3rem', color: '#111827' }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  )
}

function Badge({ label, color }) {
  return <span style={{ background: `${color}18`, color, fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{label}</span>
}

// ── DASHBOARD TAB ──────────────────────────────────────────────
function DashboardTab({ token }) {
  const [stats, setStats] = useState(null)
  const [news, setNews]   = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setStats(d)).catch(() => {})
  }, [])

  async function postNews() {
    if (!newMsg.trim()) return
    setPosting(true)
    try {
      await fetch(`${API}/api/admin/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newMsg.trim(), type: 'announcement' })
      })
      setNewMsg('')
    } catch {} finally { setPosting(false) }
  }

  if (!stats) return <Loader/>

  return (
    <div>
      <h2 style={H2}>Dashboard Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
        <Stat icon="fi-sr-users"        label="Total Users"    value={stats.totalUsers}     color="#1a73e8"/>
        <Stat icon="fi-sr-wifi"         label="Online Now"     value={stats.onlineUsers}    color="#22c55e"/>
        <Stat icon="fi-sr-venus-double" label="Female"         value={stats.femaleCount}    color="#ec4899"/>
        <Stat icon="fi-sr-mars-double"  label="Male"           value={stats.maleCount}      color="#3b82f6"/>
        <Stat icon="fi-sr-ban"          label="Banned"         value={stats.bannedUsers}    color="#ef4444"/>
        <Stat icon="fi-sr-house"        label="Active Rooms"   value={stats.totalRooms}     color="#f59e0b"/>
        <Stat icon="fi-sr-comment-alt"  label="Total Messages" value={stats.totalMessages}  color="#8b5cf6"/>
        <Stat icon="fi-sr-gift"         label="Total Gifts"    value={stats.totalGifts}     color="#ec4899"/>
        <Stat icon="fi-sr-coins"        label="Gold in System" value={stats.goldInCirculation} color="#d97706"/>
        <Stat icon="fi-sr-flag"         label="Pending Reports" value={stats.pendingReports} color="#ef4444"/>
      </div>

      {/* Quick announcement */}
      <div style={{ background: '#fff', border: '1px solid #e4e6ea', borderRadius: 12, padding: '16px 18px' }}>
        <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fi fi-sr-megaphone" style={{ color: '#1a73e8' }}/>Post Announcement
        </h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
            placeholder="Broadcast a message to all rooms..."
            style={{ flex: 1, padding: '10px 13px', background: '#f9fafb', border: '1.5px solid #e4e6ea', borderRadius: 9, fontSize: '0.875rem', outline: 'none', color: '#111827', fontFamily: 'Nunito,sans-serif' }}
            onFocus={e => e.target.style.borderColor = '#1a73e8'} onBlur={e => e.target.style.borderColor = '#e4e6ea'}
          />
          <button onClick={postNews} disabled={!newMsg.trim() || posting}
            style={{ padding: '10px 18px', borderRadius: 9, border: 'none', background: newMsg.trim() && !posting ? '#1a73e8' : '#f3f4f6', color: newMsg.trim() && !posting ? '#fff' : '#9ca3af', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
            {posting ? 'Sending...' : 'Broadcast'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── USERS TAB ──────────────────────────────────────────────────
function UsersTab({ token, myRank }) {
  const [users,    setUsers]   = useState([])
  const [search,   setSearch]  = useState('')
  const [rankF,    setRankF]   = useState('all')
  const [page,     setPage]    = useState(1)
  const [total,    setTotal]   = useState(0)
  const [loading,  setLoading] = useState(false)
  const [actionUser, setActionUser] = useState(null)

  const canChangeRank = ['admin', 'superadmin', 'owner'].includes(myRank)

  const load = useCallback(async () => {
    setLoading(true)
    const q = new URLSearchParams({ page, limit: 20, ...(search && { search }), ...(rankF !== 'all' && { rank: rankF }) })
    try {
      const r = await fetch(`${API}/api/admin/users?${q}`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      setUsers(d.users || [])
      setTotal(d.total || 0)
    } catch {} finally { setLoading(false) }
  }, [search, rankF, page, token])

  useEffect(() => { load() }, [load])

  async function banUser(u, ban) {
    await fetch(`${API}/api/admin/users/${u._id}/${ban ? 'ban' : 'unban'}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    load()
  }

  async function muteUser(u, minutes = 60) {
    await fetch(`${API}/api/admin/users/${u._id}/mute`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ minutes })
    }).catch(() => {})
    load()
  }

  async function changeRank(u, rank) {
    await fetch(`${API}/api/admin/users/${u._id}/rank`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rank })
    }).catch(() => {})
    load()
  }

  async function giveGold(u, amount) {
    await fetch(`${API}/api/admin/users/${u._id}/gold`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount })
    }).catch(() => {})
    load()
  }

  return (
    <div>
      <h2 style={H2}>User Management</h2>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search username / email..."
          style={{ flex: 1, minWidth: 180, padding: '9px 13px', background: '#fff', border: '1.5px solid #e4e6ea', borderRadius: 9, fontSize: '0.875rem', outline: 'none', color: '#111827' }}
          onFocus={e => e.target.style.borderColor = '#1a73e8'} onBlur={e => e.target.style.borderColor = '#e4e6ea'}
        />
        <select value={rankF} onChange={e => { setRankF(e.target.value); setPage(1) }}
          style={{ padding: '9px 13px', background: '#fff', border: '1.5px solid #e4e6ea', borderRadius: 9, fontSize: '0.875rem', outline: 'none', color: '#111827', cursor: 'pointer' }}>
          <option value="all">All Ranks</option>
          {Object.entries(RANKS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e4e6ea', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', gap: 8 }}>
          <span>USER</span><span>RANK</span><span>LEVEL</span><span>GOLD</span><span>STATUS</span><span>ACTIONS</span>
        </div>
        {loading ? <Loader/> : users.map(u => (
          <div key={u._id} style={{ padding: '10px 14px', borderBottom: '1px solid #f9fafb', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', gap: 8, alignItems: 'center', transition: 'background .1s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={u.avatar || '/default_images/avatar/default_guest.png'} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.src = '/default_images/avatar/default_guest.png'}/>
              <div>
                <div style={{ fontSize: '0.83rem', fontWeight: 700, color: '#111827' }}>{u.username}</div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{u.email || 'Guest'}</div>
              </div>
            </div>
            <Badge label={getRankLabel(u.rank)} color={getRankColor(u.rank)}/>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>Lv.{u.level || 1}</span>
            <span style={{ fontSize: '0.82rem', color: '#d97706', fontWeight: 700 }}>{u.gold || 0}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {u.isBanned  && <Badge label="Banned"  color="#ef4444"/>}
              {u.isMuted   && <Badge label="Muted"   color="#f59e0b"/>}
              {u.isOnline  && <Badge label="Online"  color="#22c55e"/>}
              {!u.isBanned && !u.isMuted && !u.isOnline && <Badge label="Offline" color="#9ca3af"/>}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {!u.isBanned ? (
                <ABtn label="Ban" color="#ef4444" onClick={() => { if (window.confirm(`Ban ${u.username}?`)) banUser(u, true) }}/>
              ) : (
                <ABtn label="Unban" color="#22c55e" onClick={() => banUser(u, false)}/>
              )}
              {!u.isMuted ? (
                <ABtn label="Mute" color="#f59e0b" onClick={() => muteUser(u, 60)}/>
              ) : (
                <ABtn label="Unmute" color="#22c55e" onClick={() => muteUser(u, 0)}/>
              )}
              <ABtn label="Gold" color="#d97706" onClick={() => {
                const amt = window.prompt(`Give gold to ${u.username} (negative to remove):`, '100')
                if (amt !== null && !isNaN(parseInt(amt))) giveGold(u, parseInt(amt))
              }}/>
              {canChangeRank && (
                <ABtn label="Rank" color="#1a73e8" onClick={() => {
                  const newRank = window.prompt(`Change rank for ${u.username}:\n${Object.keys(RANKS).join(', ')}`, u.rank)
                  if (newRank && RANKS[newRank]) changeRank(u, newRank)
                }}/>
              )}
            </div>
          </div>
        ))}
        {!loading && users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: '#9ca3af', fontSize: '0.875rem' }}>No users found</div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Showing {users.length} of {total}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={PagBtn(page <= 1)}>← Prev</button>
          <span style={{ padding: '6px 12px', fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={users.length < 20} style={PagBtn(users.length < 20)}>Next →</button>
        </div>
      </div>
    </div>
  )
}

// ── ROOMS TAB ──────────────────────────────────────────────────
function RoomsTab({ token }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/admin/rooms`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setRooms(d.rooms || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function deleteRoom(id, name) {
    if (!window.confirm(`Delete room "${name}"?`)) return
    await fetch(`${API}/api/admin/rooms/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    setRooms(p => p.filter(r => r._id !== id))
  }

  async function clearMessages(id, name) {
    if (!window.confirm(`Clear ALL messages in "${name}"?`)) return
    await fetch(`${API}/api/admin/rooms/${id}/messages`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    alert('Messages cleared!')
  }

  return (
    <div>
      <h2 style={H2}>Room Management</h2>
      <div style={{ background: '#fff', border: '1px solid #e4e6ea', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? <Loader/> : rooms.map(r => (
          <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f9fafb' }}>
            <img src={r.icon || '/default_images/rooms/default_room.png'} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display = 'none'}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{r.type} • {r.currentUsers || 0} online • {r.isPinned ? '📌 Pinned' : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <ABtn label="Clear Msgs" color="#f59e0b" onClick={() => clearMessages(r._id, r.name)}/>
              <ABtn label="Delete" color="#ef4444" onClick={() => deleteRoom(r._id, r.name)}/>
            </div>
          </div>
        ))}
        {!loading && rooms.length === 0 && <div style={{ textAlign: 'center', padding: '30px 20px', color: '#9ca3af' }}>No rooms found</div>}
      </div>
    </div>
  )
}

// ── REPORTS TAB ────────────────────────────────────────────────
function ReportsTab({ token }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/admin/reports`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setReports(d.reports || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function resolve(id) {
    await fetch(`${API}/api/admin/reports/${id}/resolve`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    setReports(p => p.filter(r => r._id !== id))
  }

  return (
    <div>
      <h2 style={H2}>Reports <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ef4444' }}>({reports.filter(r => r.status === 'pending').length} pending)</span></h2>
      <div style={{ background: '#fff', border: '1px solid #e4e6ea', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? <Loader/> : reports.map(r => (
          <div key={r._id} style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.83rem', fontWeight: 700, color: '#111827', marginBottom: 3 }}>
                <Badge label={r.type || 'user'} color="#1a73e8"/> &nbsp;
                <span style={{ color: '#374151' }}>{r.reporter?.username || 'Unknown'}</span>
                <span style={{ color: '#9ca3af', fontWeight: 400 }}> reported </span>
                <span style={{ color: '#ef4444' }}>{r.reported?.username || r.reportedUsername || '?'}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#374151' }}><strong>Reason:</strong> {r.reason}</div>
              {r.details && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{r.details}</div>}
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>{new Date(r.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <Badge label={r.status} color={r.status === 'pending' ? '#f59e0b' : '#22c55e'}/>
              {r.status === 'pending' && <ABtn label="Resolve" color="#22c55e" onClick={() => resolve(r._id)}/>}
            </div>
          </div>
        ))}
        {!loading && reports.length === 0 && <div style={{ textAlign: 'center', padding: '30px 20px', color: '#9ca3af' }}>No reports</div>}
      </div>
    </div>
  )
}

// ── GIFTS TAB ──────────────────────────────────────────────────
function GiftsTab({ token }) {
  const [gifts, setGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', price: 10, category: 'general', icon: '' })
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/admin/gifts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setGifts(d.gifts || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function addGift() {
    if (!form.name.trim() || !form.icon.trim()) return
    setAdding(true)
    try {
      const r = await fetch(`${API}/api/admin/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      const d = await r.json()
      if (r.ok) { setGifts(p => [...p, d.gift]); setForm({ name: '', price: 10, category: 'general', icon: '' }); setShowForm(false) }
    } catch {} finally { setAdding(false) }
  }

  async function deleteGift(id) {
    if (!window.confirm('Delete this gift?')) return
    await fetch(`${API}/api/admin/gifts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    setGifts(p => p.filter(g => g._id !== id))
  }

  const inp = { width: '100%', padding: '9px 12px', background: '#f9fafb', border: '1.5px solid #e4e6ea', borderRadius: 8, fontSize: '0.875rem', outline: 'none', color: '#111827', boxSizing: 'border-box', fontFamily: 'Nunito,sans-serif' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ ...H2, margin: 0 }}>Gift Management</h2>
        <button onClick={() => setShowForm(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: 'none', background: '#1a73e8', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.83rem' }}>
          <i className="fi fi-sr-plus-small"/>Add Gift
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e4e6ea', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Rose" style={inp} onFocus={e => e.target.style.borderColor = '#1a73e8'} onBlur={e => e.target.style.borderColor = '#e4e6ea'}/>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Icon file</label>
              <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="rose.svg" style={inp} onFocus={e => e.target.style.borderColor = '#1a73e8'} onBlur={e => e.target.style.borderColor = '#e4e6ea'}/>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Price (Gold)</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: parseInt(e.target.value) }))} style={inp} onFocus={e => e.target.style.borderColor = '#1a73e8'} onBlur={e => e.target.style.borderColor = '#e4e6ea'}/>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Category</label>
              <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="general" style={inp} onFocus={e => e.target.style.borderColor = '#1a73e8'} onBlur={e => e.target.style.borderColor = '#e4e6ea'}/>
            </div>
          </div>
          <button onClick={addGift} disabled={adding} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: '#1a73e8', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
            {adding ? 'Adding...' : 'Add Gift'}
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
        {loading ? <Loader/> : gifts.map(g => (
          <div key={g._id} style={{ background: '#fff', border: '1px solid #e4e6ea', borderRadius: 10, padding: '12px', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => deleteGift(g._id)} style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: 11 }}><i className="fi fi-sr-trash"/></button>
            <img src={`/gift/${g.icon}`} alt={g.name} style={{ width: 40, height: 40, margin: '0 auto 6px', display: 'block' }} onError={e => e.target.style.display = 'none'}/>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>{g.name}</div>
            <div style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 600 }}>{g.price} Gold</div>
            <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{g.category}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SHARED HELPERS ─────────────────────────────────────────────
const H2 = { fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.05rem', color: '#111827', marginBottom: 16 }
function ABtn({ label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${color}22`, background: `${color}12`, color, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'all .12s', flexShrink: 0, whiteSpace: 'nowrap' }}
      onMouseEnter={e => e.currentTarget.style.background = `${color}28`}
      onMouseLeave={e => e.currentTarget.style.background = `${color}12`}
    >{label}</button>
  )
}
function PagBtn(disabled) {
  return { padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e4e6ea', background: disabled ? '#f9fafb' : '#fff', color: disabled ? '#9ca3af' : '#374151', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.82rem' }
}
function Loader() {
  return <div style={{ textAlign: 'center', padding: 28 }}><div style={{ width: 24, height: 24, border: '2px solid #e4e6ea', borderTop: '2px solid #1a73e8', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }}/></div>
}

// ── MAIN ADMIN PANEL ───────────────────────────────────────────
export default function AdminPanel() {
  const nav = useNavigate()
  const [me, setMe]   = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('cgz_token')

  useEffect(() => {
    if (!token) { nav('/login'); return }
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (!d.user) { nav('/login'); return }
        const level = RANKS[d.user.rank]?.level || 0
        if (level < 11) { nav('/chat'); return } // Not even mod
        setMe(d.user)
      })
      .catch(() => nav('/login'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Loader/>
    </div>
  )

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fi-sr-dashboard' },
    { id: 'users',     label: 'Users',     icon: 'fi-sr-users' },
    { id: 'rooms',     label: 'Rooms',     icon: 'fi-sr-house-chimney' },
    { id: 'reports',   label: 'Reports',   icon: 'fi-sr-flag' },
    { id: 'gifts',     label: 'Gifts',     icon: 'fi-sr-gift' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: '#0f1923', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10 }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1e2d3d' }}>
          <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.2rem', color: '#fff' }}>
            Chats<span style={{ color: '#1a73e8' }}>GenZ</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>Admin Panel</div>
        </div>
        {/* Me */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2d3d', display: 'flex', alignItems: 'center', gap: 9 }}>
          <img src={me?.avatar || '/default_images/avatar/default_guest.png'} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} onError={e => e.target.src = '/default_images/avatar/default_guest.png'}/>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{me?.username}</div>
            <div style={{ fontSize: '0.68rem', color: getRankColor(me?.rank) }}>{getRankLabel(me?.rank)}</div>
          </div>
        </div>
        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 9, border: 'none', background: tab === t.id ? 'rgba(26,115,232,.25)' : 'none', cursor: 'pointer', color: tab === t.id ? '#fff' : 'rgba(255,255,255,.6)', fontSize: '0.85rem', fontWeight: tab === t.id ? 700 : 500, textAlign: 'left', marginBottom: 2, transition: 'all .12s' }}
              onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = 'rgba(255,255,255,.06)' }}
              onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = 'none' }}
            >
              <i className={`fi ${t.icon}`} style={{ fontSize: 16, width: 18, textAlign: 'center' }}/>
              {t.label}
            </button>
          ))}
        </nav>
        {/* Back to chat */}
        <div style={{ padding: '12px', borderTop: '1px solid #1e2d3d' }}>
          <button onClick={() => nav('/chat')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,.08)', cursor: 'pointer', color: 'rgba(255,255,255,.7)', fontSize: '0.82rem', fontWeight: 600 }}>
            <i className="fi fi-sr-arrow-left"/>Back to Chat
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 220, padding: '24px', minWidth: 0 }}>
        {tab === 'dashboard' && <DashboardTab token={token}/>}
        {tab === 'users'     && <UsersTab     token={token} myRank={me?.rank}/>}
        {tab === 'rooms'     && <RoomsTab     token={token}/>}
        {tab === 'reports'   && <ReportsTab   token={token}/>}
        {tab === 'gifts'     && <GiftsTab     token={token}/>}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
