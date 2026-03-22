import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

const RANKS = ['guest','user','vipfemale','vipmale','butterfly','ninja','fairy','legend','bot','premium','moderator','admin','superadmin','owner']
const RANK_LEVELS = { guest:1,user:2,vipfemale:3,vipmale:4,butterfly:5,ninja:6,fairy:7,legend:8,bot:9,premium:10,moderator:11,admin:12,superadmin:13,owner:14 }
const RANK_COLORS = { guest:'#888',user:'#aaa',vipfemale:'#FF4488',vipmale:'#4488FF',butterfly:'#FF66AA',ninja:'#777',fairy:'#FF88CC',legend:'#FF8800',bot:'#00cc88',premium:'#aa44ff',moderator:'#00AAFF',admin:'#FF4444',superadmin:'#FF00FF',owner:'#FFD700' }

const t = () => localStorage.getItem('cgz_token')
const api = async (path, opts = {}) => {
  const r = await fetch(`${API}/api/admin${path}`, { headers: { Authorization: `Bearer ${t()}`, 'Content-Type': 'application/json', ...opts.headers }, ...opts })
  return r.json()
}

// ─────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const id = setTimeout(onClose, 3500); return () => clearTimeout(id) }, [])
  const colors = { success: '#22c55e', error: '#ef4444', warn: '#f59e0b', info: '#1a73e8' }
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: colors[type] || '#1a73e8', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 16px rgba(0,0,0,.25)', maxWidth: 340, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>×</button>
    </div>
  )
}

function useToast() {
  const [toasts, setToasts] = useState([])
  const show = (msg, type = 'success') => setToasts(p => [...p, { id: Date.now(), msg, type }])
  const remove = id => setToasts(p => p.filter(t => t.id !== id))
  const ToastContainer = () => (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((t, i) => (
        <div key={t.id} style={{ transform: `translateY(${i * 4}px)` }}>
          <Toast msg={t.msg} type={t.type} onClose={() => remove(t.id)} />
        </div>
      ))}
    </div>
  )
  return { show, ToastContainer }
}

// ─────────────────────────────────────────────────────────────
// CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────
function Confirm({ msg, onYes, onNo }) {
  return (
    <div onClick={onNo} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 360, width: '90%', boxShadow: '0 16px 48px rgba(0,0,0,.25)' }}>
        <p style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 18 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onNo} style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e4e6ea', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={onYes} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL WRAPPER
// ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflow: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: width, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{title}</span>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ padding: '16px 20px' }}>{children}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color = '#1a73e8', sub }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e4e6ea', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827', fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 3, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// INPUT / SELECT helpers
// ─────────────────────────────────────────────────────────────
const Inp = ({ label, ...p }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 5 }}>{label}</label>}
    <input {...p} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6ea', borderRadius: 8, fontSize: '0.875rem', outline: 'none', color: '#111827', background: '#f9fafb', boxSizing: 'border-box', fontFamily: 'Nunito,sans-serif', ...p.style }}
      onFocus={e => e.target.style.borderColor = '#1a73e8'} onBlur={e => e.target.style.borderColor = '#e4e6ea'} />
  </div>
)
const Sel = ({ label, children, ...p }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 5 }}>{label}</label>}
    <select {...p} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6ea', borderRadius: 8, fontSize: '0.875rem', outline: 'none', color: '#111827', background: '#f9fafb', boxSizing: 'border-box', ...p.style }}>{children}</select>
  </div>
)
const Btn = ({ children, color = '#1a73e8', ...p }) => (
  <button {...p} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'Outfit,sans-serif', display: 'inline-flex', alignItems: 'center', gap: 6, ...p.style }}>{children}</button>
)

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState(null)
  useEffect(() => { api('/stats').then(d => setStats(d)) }, [])
  if (!stats) return <div style={{ textAlign: 'center', padding: 40 }}><div style={{ width: 32, height: 32, border: '3px solid #e4e6ea', borderTop: '3px solid #1a73e8', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} /></div>
  const cards = [
    { label: 'Registered Users', value: stats.totalUsers, icon: '👥', color: '#1a73e8' },
    { label: 'Online Now', value: stats.onlineUsers, icon: '🟢', color: '#22c55e' },
    { label: 'Female Users', value: stats.femaleCount, icon: '♀', color: '#FF4488' },
    { label: 'Male Users', value: stats.maleCount, icon: '♂', color: '#4488FF' },
    { label: 'Muted Users', value: stats.mutedUsers, icon: '🔇', color: '#f59e0b' },
    { label: 'Banned Users', value: stats.bannedUsers, icon: '🚫', color: '#ef4444' },
    { label: 'Active Rooms', value: stats.totalRooms, icon: '🏠', color: '#7c3aed' },
    { label: 'Chat Messages', value: stats.totalMessages, icon: '💬', color: '#059669' },
    { label: 'Private Messages', value: stats.totalPrivate, icon: '✉️', color: '#6366f1' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: '🚩', color: '#dc2626', sub: 'Need review' },
    { label: 'New Contacts', value: stats.newContacts, icon: '📧', color: '#0891b2' },
    { label: 'Gift Transactions', value: stats.totalGifts, icon: '🎁', color: '#d97706' },
    { label: 'Gold in Circulation', value: stats.goldInCirculation?.toLocaleString(), icon: '💰', color: '#b45309' },
  ]
  return (
    <div>
      <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.1rem', color: '#111827', marginBottom: 18 }}>Dashboard Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// USERS MANAGEMENT
// ─────────────────────────────────────────────────────────────
function Users({ myRank, toast }) {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [rankF, setRankF] = useState('all')
  const [statusF, setStatusF] = useState('all')
  const [loading, setLoad] = useState(false)
  const [modal, setModal] = useState(null)     // { type, user }
  const [confirm, setConfirm] = useState(null) // { msg, cb }
  const [form, setForm] = useState({})

  const myLevel = RANK_LEVELS[myRank] || 0

  const load = useCallback(async () => {
    setLoad(true)
    try {
      const params = new URLSearchParams({ page, limit: 15, ...(search ? { search } : {}), ...(rankF !== 'all' ? { rank: rankF } : {}), ...(statusF !== 'all' ? { status: statusF } : {}) })
      const d = await api(`/users?${params}`)
      setUsers(d.users || [])
      setTotal(d.total || 0)
    } finally { setLoad(false) }
  }, [page, search, rankF, statusF])

  useEffect(() => { load() }, [load])

  async function act(path, method = 'PUT', body = {}) {
    const d = await api(path, { method, body: JSON.stringify(body) })
    toast.show(d.message || d.error, d.error ? 'error' : 'success')
    if (!d.error) { setModal(null); load() }
    return d
  }

  const openModal = (type, user) => { setModal({ type, user }); setForm({}) }
  const userRow = u => {
    const canAct = myRank === 'owner' || myLevel > (RANK_LEVELS[u.rank] || 0)
    return (
      <tr key={u._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
        <td style={{ padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img src={u.avatar || '/default_images/avatar/default_guest.png'} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${RANK_COLORS[u.rank] || '#aaa'}` }} onError={e => e.target.src = '/default_images/avatar/default_guest.png'} />
            <div>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.875rem' }}>{u.username}</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{u.email}</div>
            </div>
          </div>
        </td>
        <td style={{ padding: '10px 8px' }}>
          <span style={{ background: RANK_COLORS[u.rank] + '20', color: RANK_COLORS[u.rank], padding: '3px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>{u.rank}</span>
        </td>
        <td style={{ padding: '10px 8px', fontSize: '0.8rem', color: '#374151' }}>
          {u.isBanned ? <span style={{ color: '#ef4444', fontWeight: 700 }}>Banned</span>
            : u.isMuted ? <span style={{ color: '#f59e0b', fontWeight: 700 }}>Muted</span>
              : u.isOnline ? <span style={{ color: '#22c55e', fontWeight: 700 }}>Online</span>
                : <span style={{ color: '#9ca3af' }}>Offline</span>}
        </td>
        <td style={{ padding: '10px 8px', fontSize: '0.8rem', color: '#374151' }}>💰{u.gold || 0} | Lv.{u.level || 1}</td>
        <td style={{ padding: '10px 8px', fontSize: '0.75rem', color: '#9ca3af' }}>{u.totalMessages || 0} msgs</td>
        <td style={{ padding: '10px 8px', fontSize: '0.75rem', color: '#9ca3af' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
        <td style={{ padding: '10px 8px' }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button onClick={() => openModal('view', u)} style={actionBtn('#1a73e8')}>View</button>
            {canAct && <button onClick={() => openModal('rank', u)} style={actionBtn('#7c3aed')}>Rank</button>}
            {canAct && <button onClick={() => openModal('gold', u)} style={actionBtn('#d97706')}>Gold</button>}
            {canAct && !u.isMuted && <button onClick={() => openModal('mute', u)} style={actionBtn('#f59e0b')}>Mute</button>}
            {canAct && u.isMuted && <button onClick={() => act(`/users/${u._id}/unmute`)} style={actionBtn('#059669')}>Unmute</button>}
            {canAct && !u.isBanned && <button onClick={() => openModal('ban', u)} style={actionBtn('#ef4444')}>Ban</button>}
            {canAct && u.isBanned && <button onClick={() => act(`/users/${u._id}/unban`)} style={actionBtn('#059669')}>Unban</button>}
            {canAct && <button onClick={() => openModal('warn', u)} style={actionBtn('#6b7280')}>Warn</button>}
            {canAct && <button onClick={() => act(`/users/${u._id}/kick`, 'POST', { reason: 'Kicked by admin' })} style={actionBtn('#374151')}>Kick</button>}
            {myLevel >= 14 && <button onClick={() => setConfirm({ msg: `Delete ${u.username} permanently?`, cb: () => act(`/users/${u._id}`, 'DELETE') })} style={actionBtn('#dc2626')}>Del</button>}
          </div>
        </td>
      </tr>
    )
  }

  const actionBtn = color => ({ padding: '4px 9px', borderRadius: 6, border: 'none', background: color + '15', color, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 })

  return (
    <div>
      {confirm && <Confirm msg={confirm.msg} onYes={() => { confirm.cb(); setConfirm(null) }} onNo={() => setConfirm(null)} />}

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search username/email..." style={{ flex: 1, minWidth: 180, padding: '9px 14px', border: '1.5px solid #e4e6ea', borderRadius: 8, fontSize: '0.875rem', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#1a73e8'} onBlur={e => e.target.style.borderColor = '#e4e6ea'} />
        <select value={rankF} onChange={e => { setRankF(e.target.value); setPage(1) }} style={{ padding: '9px 12px', border: '1.5px solid #e4e6ea', borderRadius: 8, fontSize: '0.875rem', outline: 'none', background: '#f9fafb', cursor: 'pointer' }}>
          <option value="all">All Ranks</option>
          {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1) }} style={{ padding: '9px 12px', border: '1.5px solid #e4e6ea', borderRadius: 8, fontSize: '0.875rem', outline: 'none', background: '#f9fafb', cursor: 'pointer' }}>
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="banned">Banned</option>
          <option value="muted">Muted</option>
        </select>
        <Btn onClick={() => openModal('create', null)} color="#059669">+ Add User</Btn>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e6ea', overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 32 }}><div style={{ width: 28, height: 28, border: '3px solid #e4e6ea', borderTop: '3px solid #1a73e8', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} /></div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead><tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e4e6ea' }}>
              {['User', 'Rank', 'Status', 'Gold/Level', 'Messages', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{users.map(u => userRow(u))}</tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{total} total users</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: 7, border: '1.5px solid #e4e6ea', background: page === 1 ? '#f9fafb' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>←</button>
          <span style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, color: '#1a73e8' }}>{page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total} style={{ padding: '6px 14px', borderRadius: 7, border: '1.5px solid #e4e6ea', background: page * 15 >= total ? '#f9fafb' : '#fff', cursor: page * 15 >= total ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>→</button>
        </div>
      </div>

      {/* MODALS */}
      {modal?.type === 'view' && (
        <Modal title={`User: ${modal.user.username}`} onClose={() => setModal(null)} width={500}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[['ID', modal.user._id], ['Rank', modal.user.rank], ['Gender', modal.user.gender], ['Gold', modal.user.gold], ['XP', modal.user.xp], ['Level', modal.user.level], ['Messages', modal.user.totalMessages], ['Gifts Sent', modal.user.totalGiftsSent], ['Gifts Recv', modal.user.totalGiftsReceived], ['Warnings', modal.user.warnings || 0], ['Is Premium', modal.user.isPremium ? 'Yes' : 'No'], ['Verified', modal.user.emailVerified ? 'Yes' : 'No'], ['Online', modal.user.isOnline ? 'Yes' : 'No'], ['Last Seen', modal.user.lastSeen ? new Date(modal.user.lastSeen).toLocaleString() : 'N/A'], ['Joined', new Date(modal.user.createdAt).toLocaleString()]].map(([k, v]) => (
              <div key={k} style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>{k}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', wordBreak: 'break-all' }}>{String(v)}</div>
              </div>
            ))}
          </div>
          {modal.user.about && <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '10px 12px', fontSize: '0.85rem', color: '#374151' }}>{modal.user.about}</div>}
        </Modal>
      )}

      {modal?.type === 'rank' && (
        <Modal title={`Change Rank: ${modal.user.username}`} onClose={() => setModal(null)}>
          <Sel label="New Rank" value={form.rank || modal.user.rank} onChange={e => setForm({ rank: e.target.value })}>
            {RANKS.filter(r => myRank === 'owner' ? true : (RANK_LEVELS[r] || 0) < myLevel).map(r => <option key={r} value={r}>{r} (Level {RANK_LEVELS[r]})</option>)}
          </Sel>
          <Btn onClick={() => act(`/users/${modal.user._id}/rank`, 'PUT', { rank: form.rank || modal.user.rank })}>Save Rank</Btn>
        </Modal>
      )}

      {modal?.type === 'gold' && (
        <Modal title={`Gold: ${modal.user.username} (Current: ${modal.user.gold})`} onClose={() => setModal(null)}>
          <Sel label="Action" value={form.action || 'add'} onChange={e => setForm(p => ({ ...p, action: e.target.value }))}>
            <option value="add">Add Gold</option>
            <option value="remove">Remove Gold</option>
          </Sel>
          <Inp label="Amount" type="number" value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: parseInt(e.target.value) }))} />
          <Btn onClick={() => act(`/users/${modal.user._id}/gold`, 'PUT', { amount: form.amount, action: form.action || 'add' })}>Apply</Btn>
        </Modal>
      )}

      {modal?.type === 'mute' && (
        <Modal title={`Mute: ${modal.user.username}`} onClose={() => setModal(null)}>
          <Sel label="Duration" value={form.hours || 1} onChange={e => setForm(p => ({ ...p, hours: parseInt(e.target.value) }))}>
            {[1, 2, 3, 6, 12, 24, 48, 72, 168].map(h => <option key={h} value={h}>{h < 24 ? `${h} hour${h > 1 ? 's' : ''}` : `${h / 24} day${h / 24 > 1 ? 's' : ''}`}</option>)}
          </Sel>
          <Inp label="Reason" value={form.reason || ''} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
          <Btn color="#f59e0b" onClick={() => act(`/users/${modal.user._id}/mute`, 'PUT', { hours: form.hours || 1, reason: form.reason || '' })}>Mute User</Btn>
        </Modal>
      )}

      {modal?.type === 'ban' && (
        <Modal title={`Ban: ${modal.user.username}`} onClose={() => setModal(null)}>
          <Inp label="Reason" value={form.reason || ''} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
          <Sel label="Duration" value={form.days || 0} onChange={e => setForm(p => ({ ...p, days: parseInt(e.target.value) }))}>
            <option value={0}>Permanent</option>
            {[1, 3, 7, 14, 30, 90].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
          </Sel>
          <Btn color="#ef4444" onClick={() => act(`/users/${modal.user._id}/ban`, 'PUT', { reason: form.reason, days: form.days || undefined })}>Ban User</Btn>
        </Modal>
      )}

      {modal?.type === 'warn' && (
        <Modal title={`Warn: ${modal.user.username}`} onClose={() => setModal(null)}>
          <Inp label="Reason" value={form.reason || ''} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
          <Btn color="#6b7280" onClick={() => act(`/users/${modal.user._id}/warn`, 'POST', { reason: form.reason })}>Issue Warning</Btn>
        </Modal>
      )}

      {modal?.type === 'create' && (
        <Modal title="Create New User" onClose={() => setModal(null)}>
          <Inp label="Username" value={form.username || ''} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
          <Inp label="Email" type="email" value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <Inp label="Password" type="password" value={form.password || ''} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          <Sel label="Rank" value={form.rank || 'user'} onChange={e => setForm(p => ({ ...p, rank: e.target.value }))}>
            {RANKS.filter(r => myRank === 'owner' ? true : (RANK_LEVELS[r] || 0) < myLevel).map(r => <option key={r} value={r}>{r}</option>)}
          </Sel>
          <Sel label="Gender" value={form.gender || 'other'} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
            <option value="male">Male</option><option value="female">Female</option><option value="couple">Couple</option><option value="other">Other</option>
          </Sel>
          <Btn color="#059669" onClick={() => act('/create-user', 'POST', form)}>Create User</Btn>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ROOMS
// ─────────────────────────────────────────────────────────────
function Rooms({ toast }) {
  const [rooms, setRooms] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [confirm, setConfirm] = useState(null)
  const [search, setSearch] = useState('')

  const load = () => api(`/rooms${search ? `?search=${search}` : ''}`).then(d => setRooms(d.rooms || []))
  useEffect(() => { load() }, [search])

  async function act(path, method = 'PUT', body = {}) {
    const d = await api(path, { method, body: JSON.stringify(body) })
    toast.show(d.message || d.error, d.error ? 'error' : 'success')
    if (!d.error) { setModal(null); load() }
  }

  const ROOM_TYPES = ['public', 'private', 'staff', 'admin', 'member', 'vip']

  return (
    <div>
      {confirm && <Confirm msg={confirm.msg} onYes={() => { confirm.cb(); setConfirm(null) }} onNo={() => setConfirm(null)} />}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms..." style={{ flex: 1, padding: '9px 14px', border: '1.5px solid #e4e6ea', borderRadius: 8, fontSize: '0.875rem', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#1a73e8'} onBlur={e => e.target.style.borderColor = '#e4e6ea'} />
        <Btn color="#059669" onClick={() => { setModal('create'); setForm({ type: 'public', order: 0 }) }}>+ Add Room</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {rooms.map(r => (
          <div key={r._id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e6ea', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
            <div style={{ background: 'linear-gradient(135deg,#e8f0fe,#f0f7ff)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={r.icon || '/default_images/rooms/default_room.png'} style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.src = '/default_images/rooms/default_room.png'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.7rem', color: '#1a73e8', fontWeight: 700, background: '#e8f0fe', padding: '1px 7px', borderRadius: 10 }}>{r.type}</span>
                  <span style={{ fontSize: '0.7rem', color: r.isActive ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{r.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
            <div style={{ padding: '10px 16px', fontSize: '0.8rem', color: '#6b7280' }}>
              {r.description && <p style={{ marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span>👤 {r.owner?.username || 'System'}</span>
                <span>🏷️ Order: {r.order || 0}</span>
              </div>
            </div>
            <div style={{ padding: '8px 16px 14px', display: 'flex', gap: 6 }}>
              <button onClick={() => { setModal('edit'); setForm({ ...r, ownerId: r.owner?._id }) }} style={{ flex: 1, padding: '7px', borderRadius: 7, border: '1.5px solid #1a73e8', background: '#e8f0fe', color: '#1a73e8', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Edit</button>
              <button onClick={() => setConfirm({ msg: `Clear all messages in "${r.name}"?`, cb: () => act(`/rooms/${r._id}/messages`, 'DELETE') })} style={{ flex: 1, padding: '7px', borderRadius: 7, border: '1.5px solid #f59e0b', background: '#fef3c7', color: '#b45309', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Clear Msgs</button>
              <button onClick={() => setConfirm({ msg: `Deactivate "${r.name}"?`, cb: () => act(`/rooms/${r._id}`, 'DELETE') })} style={{ flex: 1, padding: '7px', borderRadius: 7, border: '1.5px solid #ef4444', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Create Room' : `Edit: ${form.name}`} onClose={() => setModal(null)} width={520}>
          <Inp label="Room Name" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Inp label="Description" value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <Inp label="Icon URL" value={form.icon || ''} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} />
          <Inp label="Topic" value={form.topic || ''} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Sel label="Type" value={form.type || 'public'} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Sel>
            <Inp label="Order" type="number" value={form.order || 0} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Sel label="Allow Guests" value={form['permissions.allowGuests'] ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, 'permissions.allowGuests': e.target.value === 'true' }))}>
              <option value="true">Yes</option><option value="false">No</option>
            </Sel>
            <Sel label="Active" value={form.isActive !== false ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}>
              <option value="true">Yes</option><option value="false">No</option>
            </Sel>
          </div>
          <Btn color={modal === 'create' ? '#059669' : '#1a73e8'} onClick={() => modal === 'create' ? act('/rooms', 'POST', form) : act(`/rooms/${form._id}`, 'PUT', form)}>
            {modal === 'create' ? 'Create Room' : 'Save Changes'}
          </Btn>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// GIFTS MANAGEMENT
// ─────────────────────────────────────────────────────────────
function GiftsPanel({ toast }) {
  const [gifts, setGifts] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [confirm, setConfirm] = useState(null)

  const load = () => api('/gifts').then(d => setGifts(d.gifts || []))
  useEffect(() => { load() }, [])

  async function act(path, method, body = {}) {
    const d = await api(path, { method, body: JSON.stringify(body) })
    toast.show(d.message || d.error, d.error ? 'error' : 'success')
    if (!d.error) { setModal(null); load() }
  }

  return (
    <div>
      {confirm && <Confirm msg={confirm.msg} onYes={() => { confirm.cb(); setConfirm(null) }} onNo={() => setConfirm(null)} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Btn color="#059669" onClick={() => { setModal('create'); setForm({ price: 50, category: 'general', isActive: true }) }}>+ Add Gift</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
        {gifts.map(g => (
          <div key={g._id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e6ea', padding: '14px 12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
            <img src={g.icon} style={{ width: 48, height: 48, objectFit: 'contain', margin: '0 auto 8px', display: 'block' }} onError={e => e.target.style.display = 'none'} />
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827', marginBottom: 3 }}>{g.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 700, marginBottom: 3 }}>💰 {g.price}</div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: 10 }}>{g.category}</div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={() => { setModal('edit'); setForm(g) }} style={{ flex: 1, padding: '5px', borderRadius: 6, border: '1px solid #1a73e8', background: '#e8f0fe', color: '#1a73e8', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>Edit</button>
              <button onClick={() => setConfirm({ msg: `Delete gift "${g.name}"?`, cb: () => act(`/gifts/${g._id}`, 'DELETE') })} style={{ flex: 1, padding: '5px', borderRadius: 6, border: '1px solid #ef4444', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>Del</button>
            </div>
          </div>
        ))}
      </div>
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Add Gift' : `Edit: ${form.name}`} onClose={() => setModal(null)}>
          <Inp label="Name" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Inp label="Icon URL (SVG path)" value={form.icon || ''} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} />
          <Inp label="Price (Gold)" type="number" value={form.price || 50} onChange={e => setForm(p => ({ ...p, price: parseInt(e.target.value) }))} />
          <Inp label="Category" value={form.category || 'general'} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
          <Btn color={modal === 'create' ? '#059669' : '#1a73e8'} onClick={() => modal === 'create' ? act('/gifts', 'POST', form) : act(`/gifts/${form._id}`, 'PUT', form)}>
            {modal === 'create' ? 'Create Gift' : 'Save'}
          </Btn>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────
function Reports({ toast }) {
  const [reports, setReports] = useState([])
  const [statusF, setStatusF] = useState('pending')
  const load = () => api(`/reports?status=${statusF}`).then(d => setReports(d.reports || []))
  useEffect(() => { load() }, [statusF])

  async function act(path, method, body = {}) {
    const d = await api(path, { method, body: JSON.stringify(body) })
    toast.show(d.message || d.error, d.error ? 'error' : 'success')
    if (!d.error) load()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['pending', 'resolved', 'dismissed', 'all'].map(s => (
          <button key={s} onClick={() => setStatusF(s)} style={{ padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${statusF === s ? '#1a73e8' : '#e4e6ea'}`, background: statusF === s ? '#e8f0fe' : 'none', color: statusF === s ? '#1a73e8' : '#6b7280', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>{s}</button>
        ))}
      </div>
      {reports.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No reports</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map(r => (
            <div key={r._id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e6ea', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.85rem' }}>🚩 {r.reason || 'Report'}</span>
                    <span style={{ background: r.status === 'pending' ? '#fef3c7' : r.status === 'resolved' ? '#d1fae5' : '#f3f4f6', color: r.status === 'pending' ? '#b45309' : r.status === 'resolved' ? '#065f46' : '#6b7280', padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700 }}>{r.status}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 5 }}>
                    Reporter: <strong>{r.reporter?.username}</strong> → Reported: <strong style={{ color: '#ef4444' }}>{r.reported?.username}</strong>
                  </div>
                  {r.description && <p style={{ fontSize: '0.8rem', color: '#6b7280', background: '#f9fafb', borderRadius: 7, padding: '7px 10px', margin: '6px 0' }}>{r.description}</p>}
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <Btn color="#059669" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => act(`/reports/${r._id}/resolve`, 'PUT')}>Resolve</Btn>
                    <Btn color="#6b7280" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => act(`/reports/${r._id}/dismiss`, 'PUT')}>Dismiss</Btn>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CONTACTS
// ─────────────────────────────────────────────────────────────
function Contacts({ toast }) {
  const [contacts, setContacts] = useState([])
  const [active, setActive] = useState(null)
  const load = () => api('/contacts').then(d => setContacts(d.contacts || []))
  useEffect(() => { load() }, [])

  async function markRead(id) {
    await api(`/contacts/${id}/read`, { method: 'PUT', body: JSON.stringify({}) })
    load()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: active ? '280px 1fr' : '1fr', gap: 16 }}>
      <div>
        {contacts.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No messages</div> : contacts.map(c => (
          <div key={c._id} onClick={() => { setActive(c); if (c.status === 'new') markRead(c._id) }}
            style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e4e6ea', marginBottom: 8, cursor: 'pointer', background: active?._id === c._id ? '#e8f0fe' : c.status === 'new' ? '#f0f7ff' : '#fff', transition: 'all .12s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.85rem' }}>{c.name || 'Anonymous'}</span>
              {c.status === 'new' && <span style={{ width: 8, height: 8, background: '#1a73e8', borderRadius: '50%', display: 'inline-block', marginTop: 4 }} />}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject || c.message?.slice(0, 50)}</div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>{new Date(c.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
      {active && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e4e6ea', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{active.subject || 'No subject'}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>{active.name} · {active.email} · {new Date(active.createdAt).toLocaleString()}</div>
            </div>
            <button onClick={() => setActive(null)} style={{ background: '#f3f4f6', border: 'none', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', fontSize: '0.9rem', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{active.message}</div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FILTERS
// ─────────────────────────────────────────────────────────────
function FiltersPanel({ toast }) {
  const [words, setWords] = useState([])
  const [newWord, setNewWord] = useState('')
  const [tab, setTab] = useState('word')

  const load = () => api('/filters').then(d => setWords(d.words || []))
  useEffect(() => { load() }, [])

  async function addWord() {
    if (!newWord.trim()) return
    const d = await api('/filters', { method: 'POST', body: JSON.stringify({ word: newWord.trim(), type: tab }) })
    toast.show(d.message || d.error, d.error ? 'error' : 'success')
    if (!d.error) { setNewWord(''); setWords(d.words || []); }
  }

  async function removeWord(id) {
    const d = await api(`/filters/${id}`, { method: 'DELETE', body: JSON.stringify({}) })
    toast.show(d.message || d.error, d.error ? 'error' : 'success')
    setWords(d.words || [])
  }

  const filtered = words.filter(w => w.type === tab)

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['word', 'spam', 'username', 'email'].map(tp => (
          <button key={tp} onClick={() => setTab(tp)} style={{ padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${tab === tp ? '#1a73e8' : '#e4e6ea'}`, background: tab === tp ? '#e8f0fe' : 'none', color: tab === tp ? '#1a73e8' : '#6b7280', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', textTransform: 'capitalize' }}>{tp}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input value={newWord} onChange={e => setNewWord(e.target.value)} onKeyDown={e => e.key === 'Enter' && addWord()} placeholder={`Add ${tab} filter...`} style={{ flex: 1, padding: '9px 14px', border: '1.5px solid #e4e6ea', borderRadius: 8, fontSize: '0.875rem', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#1a73e8'} onBlur={e => e.target.style.borderColor = '#e4e6ea'} />
        <Btn color="#059669" onClick={addWord}>+ Add</Btn>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {filtered.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No filters added yet.</p> : filtered.map(w => (
          <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 20, padding: '5px 12px' }}>
            <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.82rem' }}>{w.word}</span>
            <button onClick={() => removeWord(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// IP BANS
// ─────────────────────────────────────────────────────────────
function IpBans({ toast }) {
  const [bans, setBans] = useState([])
  const [ip, setIp] = useState('')
  const [reason, setReason] = useState('')

  const load = () => api('/ip-bans').then(d => setBans(d.bans || []))
  useEffect(() => { load() }, [])

  async function add() {
    if (!ip.trim()) return
    const d = await api('/ip-bans', { method: 'POST', body: JSON.stringify({ ip: ip.trim(), reason }) })
    toast.show(d.message || d.error, d.error ? 'error' : 'success')
    if (!d.error) { setIp(''); setReason(''); setBans(d.bans || []) }
  }

  async function remove(id) {
    const d = await api(`/ip-bans/${id}`, { method: 'DELETE', body: JSON.stringify({}) })
    toast.show(d.message || d.error, d.error ? 'error' : 'success')
    setBans(d.bans || [])
  }

  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e6ea', padding: '16px 18px', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 800, color: '#111827', marginBottom: 14, fontSize: '0.95rem' }}>Ban an IP Address</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 10 }}>
          <Inp label="IP Address" value={ip} onChange={e => setIp(e.target.value)} placeholder="e.g. 192.168.1.1" />
          <Inp label="Reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional reason..." />
        </div>
        <Btn color="#ef4444" onClick={add}>🚫 Ban IP</Btn>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bans.length === 0 ? <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>No IP bans.</p> : bans.map(b => (
          <div key={b.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e6ea', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ef4444', fontSize: '0.9rem', flex: 1 }}>{b.ip}</span>
            <span style={{ color: '#6b7280', fontSize: '0.8rem', flex: 2 }}>{b.reason || '—'}</span>
            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>by {b.bannedBy}</span>
            <button onClick={() => remove(b.id)} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #ef4444', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// BROADCAST
// ─────────────────────────────────────────────────────────────
function BroadcastPanel({ toast }) {
  const [msg, setMsg] = useState('')
  const [type, setType] = useState('announcement')
  const [roomId, setRoomId] = useState('')

  async function send() {
    if (!msg.trim()) return
    const d = await api('/broadcast', { method: 'POST', body: JSON.stringify({ message: msg, type, roomId: roomId || undefined }) })
    toast.show(d.message || d.error, d.error ? 'error' : 'success')
    if (!d.error) setMsg('')
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e4e6ea', padding: 20 }}>
        <h3 style={{ fontWeight: 800, color: '#111827', marginBottom: 16 }}>Send Broadcast Message</h3>
        <Sel label="Type" value={type} onChange={e => setType(e.target.value)}>
          <option value="announcement">📢 Announcement</option>
          <option value="warning">⚠️ Warning</option>
          <option value="maintenance">🔧 Maintenance</option>
          <option value="info">ℹ️ Info</option>
        </Sel>
        <Inp label="Room ID (blank = all users)" value={roomId} onChange={e => setRoomId(e.target.value)} placeholder="Leave blank to broadcast globally" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 5 }}>Message</label>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6ea', borderRadius: 8, fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'Nunito,sans-serif', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = '#1a73e8'} onBlur={e => e.target.style.borderColor = '#e4e6ea'} />
        </div>
        <Btn onClick={send}>📢 Send Broadcast</Btn>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SITE SETTINGS
// ─────────────────────────────────────────────────────────────
function SiteSettings({ toast, myRank }) {
  const [settings, setSettings] = useState(null)
  const [tab, setTab] = useState('main')
  const isOwner = myRank === 'owner'

  useEffect(() => { api('/settings').then(d => setSettings(d.settings)) }, [])

  async function save() {
    const d = await api('/settings', { method: 'PUT', body: JSON.stringify(settings) })
    toast.show(d.message || d.error, d.error ? 'error' : 'success')
  }

  if (!settings) return <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>{isOwner ? 'Loading...' : '⛔ Owner access only'}</div>
  if (!isOwner) return <div style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 40 }}>🔒</div><p style={{ color: '#ef4444', fontWeight: 700, marginTop: 12 }}>Only the Owner can change site settings.</p></div>

  const upd = (k, v) => setSettings(p => ({ ...p, [k]: v }))
  const Toggle = ({ label, k }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{label}</span>
      <button onClick={() => upd(k, !settings[k])} style={{ width: 42, height: 24, borderRadius: 12, border: 'none', background: settings[k] ? '#1a73e8' : '#e4e6ea', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
        <span style={{ position: 'absolute', top: 2, left: settings[k] ? 20 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
      </button>
    </div>
  )

  const tabs = [
    { id: 'main', label: '⚙️ Main' },
    { id: 'registration', label: '👤 Registration' },
    { id: 'chat', label: '💬 Chat' },
    { id: 'security', label: '🔒 Security' },
    { id: 'wallet', label: '💰 Wallet' },
    { id: 'modules', label: '🔌 Modules' },
    { id: 'email', label: '📧 Email' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${tab === t.id ? '#1a73e8' : '#e4e6ea'}`, background: tab === t.id ? '#e8f0fe' : '#fff', color: tab === t.id ? '#1a73e8' : '#6b7280', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>{t.label}</button>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e4e6ea', padding: '18px 22px', maxWidth: 560 }}>
        {tab === 'main' && (
          <>
            <Inp label="Site Name" value={settings.siteName || ''} onChange={e => upd('siteName', e.target.value)} />
            <Inp label="Site Description" value={settings.siteDescription || ''} onChange={e => upd('siteDescription', e.target.value)} />
            <Toggle label="Maintenance Mode" k="maintenanceMode" />
          </>
        )}
        {tab === 'registration' && (
          <>
            <Toggle label="Allow Registration" k="allowRegistration" />
            <Toggle label="Allow Guests" k="allowGuests" />
            <Toggle label="Require Email Verification" k="requireEmailVerify" />
            <Inp label="Minimum Rank for Image Upload" value={settings.minRankForImageUpload || 'user'} onChange={e => upd('minRankForImageUpload', e.target.value)} />
            <Inp label="Minimum Rank for Video Upload" value={settings.minRankForVideoUpload || 'premium'} onChange={e => upd('minRankForVideoUpload', e.target.value)} />
          </>
        )}
        {tab === 'chat' && (
          <>
            <Inp label="Max Message Length" type="number" value={settings.maxMessageLength || 2000} onChange={e => upd('maxMessageLength', parseInt(e.target.value))} />
            <Inp label="Chat Cooldown (seconds)" type="number" value={settings.chatCooldownSec || 1} onChange={e => upd('chatCooldownSec', parseInt(e.target.value))} />
            <Inp label="Spam Message Limit" type="number" value={settings.spamMsgLimit || 5} onChange={e => upd('spamMsgLimit', parseInt(e.target.value))} />
            <Toggle label="Auto-Delete Text Messages" k="autoDeleteMessages" />
            <Inp label="Auto-Delete After (days)" type="number" value={settings.autoDeleteDays || 7} onChange={e => upd('autoDeleteDays', parseInt(e.target.value))} />
            <Toggle label="Guests Can See Messages" k="guestCanSeeMessages" />
            <Toggle label="Guests Can Chat" k="guestCanChat" />
          </>
        )}
        {tab === 'security' && (
          <>
            <Toggle label="Enable CAPTCHA" k="captchaEnabled" />
            <Inp label="Captcha Site Key" value={settings.captchaKey || ''} onChange={e => upd('captchaKey', e.target.value)} />
            <Inp label="Captcha Secret" type="password" value={settings.captchaSecret || ''} onChange={e => upd('captchaSecret', e.target.value)} />
            <Toggle label="Block VPN/Proxy" k="vpnBlockEnabled" />
            <Inp label="VPN Check API Key" value={settings.vpnKey || ''} onChange={e => upd('vpnKey', e.target.value)} />
          </>
        )}
        {tab === 'wallet' && (
          <>
            <Inp label="Gold Per Message" type="number" value={settings.goldPerMessage || 1} onChange={e => upd('goldPerMessage', parseInt(e.target.value))} />
            <Inp label="Gold Daily Login Bonus" type="number" value={settings.goldLoginBonus || 50} onChange={e => upd('goldLoginBonus', parseInt(e.target.value))} />
            <Inp label="Gold Login Streak Bonus" type="number" value={settings.goldLoginStreak || 10} onChange={e => upd('goldLoginStreak', parseInt(e.target.value))} />
            <Inp label="Min Bet" type="number" value={settings.minBet || 1} onChange={e => upd('minBet', parseInt(e.target.value))} />
            <Inp label="Max Bet" type="number" value={settings.maxBet || 1000} onChange={e => upd('maxBet', parseInt(e.target.value))} />
            <Toggle label="Gold Purchase Enabled" k="goldPurchaseEnabled" />
          </>
        )}
        {tab === 'modules' && (
          <>
            <Toggle label="Gifts Module" k="giftEnabled" />
            <Toggle label="Video/Audio Calls" k="callEnabled" />
            <Toggle label="Webcam Broadcast" k="webcamEnabled" />
            <Toggle label="Radio Stations" k="radioEnabled" />
            <Toggle label="AI Bot" k="botEnabled" />
            <Toggle label="Giphy GIFs" k="giphyEnabled" />
          </>
        )}
        {tab === 'email' && (
          <>
            <Inp label="SMTP Host" value={settings.smtpHost || ''} onChange={e => upd('smtpHost', e.target.value)} />
            <Inp label="SMTP Port" type="number" value={settings.smtpPort || 587} onChange={e => upd('smtpPort', parseInt(e.target.value))} />
            <Inp label="SMTP Username" value={settings.smtpUser || ''} onChange={e => upd('smtpUser', e.target.value)} />
            <Inp label="SMTP Password" type="password" value={settings.smtpPass || ''} onChange={e => upd('smtpPass', e.target.value)} />
          </>
        )}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
          <Btn color="#059669" onClick={save}>💾 Save Settings</Btn>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LOGS
// ─────────────────────────────────────────────────────────────
function SystemLogs({ toast }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoad] = useState(false)
  const load = async () => { setLoad(true); try { const d = await api('/logs'); setLogs(d.logs || []) } finally { setLoad(false) } }
  useEffect(() => { load() }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Btn color="#6b7280" onClick={load} style={{ fontSize: '0.8rem' }}>🔄 Refresh</Btn>
      </div>
      <div style={{ background: '#111827', borderRadius: 12, padding: '14px 16px', maxHeight: 500, overflowY: 'auto', fontFamily: 'monospace' }}>
        {loading ? <div style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>Loading...</div> : logs.map((l, i) => (
          <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #1f2937', fontSize: '0.82rem', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ color: '#9ca3af', flexShrink: 0, fontSize: '0.72rem' }}>{new Date(l.createdAt).toLocaleTimeString()}</span>
            <span style={{ color: RANK_COLORS[l.sender?.rank] || '#60a5fa', fontWeight: 700, flexShrink: 0 }}>{l.sender?.username || '?'}</span>
            <span style={{ color: '#e5e7eb', flex: 1, wordBreak: 'break-word' }}>{l.content}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STAFF PAGE
// ─────────────────────────────────────────────────────────────
function StaffPanel() {
  const [staff, setStaff] = useState([])
  useEffect(() => { api('/staff').then(d => setStaff(d.staff || [])) }, [])
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
      {staff.map(s => (
        <div key={s._id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e6ea', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <img src={s.avatar || '/default_images/avatar/default_guest.png'} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${RANK_COLORS[s.rank] || '#aaa'}`, margin: '0 auto 8px', display: 'block' }} onError={e => e.target.src = '/default_images/avatar/default_guest.png'} />
          <div style={{ fontWeight: 800, color: '#111827', fontSize: '0.9rem' }}>{s.username}</div>
          <div style={{ display: 'inline-block', background: RANK_COLORS[s.rank] + '20', color: RANK_COLORS[s.rank], padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, marginTop: 5 }}>{s.rank}</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 6 }}>{s.isOnline ? <span style={{ color: '#22c55e' }}>● Online</span> : 'Offline'}</div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN ADMIN PAGE
// ─────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const nav = useNavigate()
  const [me, setMe] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [loading, setLoad] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const token = localStorage.getItem('cgz_token')
    if (!token) { nav('/login'); return }
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (!d.user) { nav('/login'); return }
        const rank = d.user.rank
        if (!['moderator', 'admin', 'superadmin', 'owner'].includes(rank)) { nav('/chat'); return }
        setMe(d.user)
      })
      .catch(() => nav('/login'))
      .finally(() => setLoad(false))
  }, [])

  const myLevel = RANK_LEVELS[me?.rank] || 0

  const MENU = [
    { id: 'dashboard',  icon: '📊', label: 'Dashboard',    minLevel: 11 },
    { id: 'users',      icon: '👥', label: 'Manage Users', minLevel: 11 },
    { id: 'staff',      icon: '🛡️', label: 'Staff',        minLevel: 11 },
    { id: 'rooms',      icon: '🏠', label: 'Rooms',        minLevel: 12 },
    { id: 'gifts',      icon: '🎁', label: 'Gifts',        minLevel: 12 },
    { id: 'reports',    icon: '🚩', label: 'Reports',      minLevel: 11 },
    { id: 'contacts',   icon: '📧', label: 'Contacts',     minLevel: 11 },
    { id: 'filters',    icon: '🔤', label: 'Word Filter',  minLevel: 11 },
    { id: 'ipbans',     icon: '🚫', label: 'IP Bans',      minLevel: 12 },
    { id: 'broadcast',  icon: '📢', label: 'Broadcast',    minLevel: 12 },
    { id: 'logs',       icon: '📋', label: 'System Logs',  minLevel: 12 },
    { id: 'settings',   icon: '⚙️', label: 'Site Settings',minLevel: 14 },
  ].filter(m => myLevel >= m.minLevel)

  const pageTitle = MENU.find(m => m.id === page)?.label || 'Admin Panel'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e4e6ea', borderTop: '4px solid #1a73e8', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#9ca3af' }}>Loading admin panel...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', fontFamily: 'Nunito,sans-serif' }}>
      <toast.ToastContainer />

      {/* SIDEBAR */}
      <div style={{ width: 220, background: '#1e2030', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.2rem', color: '#fff', letterSpacing: '-0.3px' }}>
            ⚡ ChatsGenZ
          </div>
          <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>Admin Panel</div>
        </div>
        {/* Me */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 9 }}>
          <img src={me?.avatar || '/default_images/avatar/default_guest.png'} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${RANK_COLORS[me?.rank] || '#aaa'}`, flexShrink: 0 }} onError={e => e.target.src = '/default_images/avatar/default_guest.png'} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: '#e5e7eb', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me?.username}</div>
            <div style={{ fontSize: '0.68rem', color: RANK_COLORS[me?.rank] || '#aaa', fontWeight: 700 }}>{me?.rank}</div>
          </div>
        </div>
        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {MENU.map(m => (
            <button key={m.id} onClick={() => setPage(m.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', border: 'none', background: page === m.id ? 'rgba(26,115,232,.25)' : 'none', cursor: 'pointer', color: page === m.id ? '#60a5fa' : '#9ca3af', fontSize: '0.875rem', fontWeight: 700, textAlign: 'left', borderLeft: `3px solid ${page === m.id ? '#1a73e8' : 'transparent'}`, transition: 'all .15s' }}
              onMouseEnter={e => { if (page !== m.id) e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
              onMouseLeave={e => { if (page !== m.id) e.currentTarget.style.background = 'none' }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{m.icon}</span>{m.label}
            </button>
          ))}
        </nav>
        {/* Back to chat */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button onClick={() => nav('/chat')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', border: '1.5px solid rgba(255,255,255,.15)', borderRadius: 8, background: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
            ← Back to Chat
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e4e6ea', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.1rem', color: '#111827', margin: 0 }}>{pageTitle}</h1>
          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>ChatsGenZ Admin · {new Date().toLocaleDateString()}</div>
        </div>
        {/* Page content */}
        <div style={{ padding: '24px' }}>
          {page === 'dashboard' && <Dashboard />}
          {page === 'users'     && <Users myRank={me?.rank} toast={toast} />}
          {page === 'staff'     && <StaffPanel />}
          {page === 'rooms'     && <Rooms toast={toast} />}
          {page === 'gifts'     && <GiftsPanel toast={toast} />}
          {page === 'reports'   && <Reports toast={toast} />}
          {page === 'contacts'  && <Contacts toast={toast} />}
          {page === 'filters'   && <FiltersPanel toast={toast} />}
          {page === 'ipbans'    && <IpBans toast={toast} />}
          {page === 'broadcast' && <BroadcastPanel toast={toast} />}
          {page === 'logs'      && <SystemLogs toast={toast} />}
          {page === 'settings'  && <SiteSettings toast={toast} myRank={me?.rank} />}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
