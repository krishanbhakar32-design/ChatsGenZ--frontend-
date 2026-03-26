/**
 * AdminPanel.jsx — ChatsGenZ
 * UI exactly matches CodyChat admin panel:
 * - Dark sidebar (#080808) with collapsible drop menus
 * - Dark header (#111)
 * - Stats boxes (sp_box style)
 * - Theme accent: #03add8
 * - Font Awesome icon style
 * Route: /admin  (protected: moderator+)
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../components/Toast.jsx'
import {
  RANKS, RANKS_LIST, getRankColor, getRankLabel, getRankIcon,
  API_URL, getAvatarUrl, getGiftIcon, getBadgeIcon, isStaff, isAdmin, isSuperAdmin, isOwner
} from '../../constants.js'

const API = API_URL
const ACCENT = '#03add8'

const RL = r => RANKS[r]?.level || 0
const authH = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('cgz_token')}` })
const apiFetch = async (path, opts = {}) => {
  const r = await fetch(`${API}/api/admin${path}`, { headers: authH(), ...opts })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || 'Error')
  return d
}

// ── SHARED UI ──────────────────────────────────────────────────
function RIcon({ rank, size = 16 }) {
  return <img src={getRankIcon(rank)} alt="" style={{ width: size, height: size, objectFit: 'contain', background: 'transparent', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
}
function Av({ src, size = 36, gender }) {
  const fb = gender === 'female' ? '/default_images/avatar/default_female.png' : '/default_images/avatar/default_male.png'
  return <img src={getAvatarUrl(src) || fb} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', background: '#333', flexShrink: 0 }} onError={e => e.target.src = fb} />
}

// CodyChat-style label
const Lbl = ({ c }) => <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>{c}</p>

// CodyChat-style reg_button / theme_btn
function ThemeBtn({ children, onClick, disabled, variant = 'primary', size = 'sm' }) {
  const bg = variant === 'danger' ? '#e53e3e' : variant === 'success' ? '#38a169' : variant === 'warn' ? '#d69e2e' : variant === 'ghost' ? 'transparent' : ACCENT
  const border = variant === 'ghost' ? `1px solid #444` : 'none'
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: disabled ? '#555' : bg, color: variant === 'ghost' ? '#ccc' : '#fff', border, borderRadius: 5, padding: size === 'sm' ? '5px 12px' : '8px 16px', fontSize: size === 'sm' ? 12 : 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'opacity .15s', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder = '', hint, disabled }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <Lbl c={label} />}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 5, padding: '8px 11px', color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
      {hint && <p style={{ fontSize: 11, color: '#666', marginTop: 3 }}>{hint}</p>}
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <Lbl c={label} />}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 5, padding: '8px 11px', color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function Toggle({ label, checked, onChange, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #222' }}>
      <div>
        <div style={{ fontSize: 13, color: '#e2e8f0' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: '#666', marginTop: 1 }}>{hint}</div>}
      </div>
      <div onClick={() => onChange(!checked)} style={{ width: 42, height: 22, borderRadius: 99, background: checked ? ACCENT : '#444', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0, marginLeft: 12 }}>
        <div style={{ position: 'absolute', top: 2, left: checked ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </div>
    </div>
  )
}

function Modal({ title, onClose, children, width = 500 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, width: '100%', maxWidth: width, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px #000c' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #2a2a2a', background: '#111' }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#f1f5f9' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  )
}

// CodyChat sp_box stat card
function SpBox({ icon, faIcon, label, value, color = ACCENT }) {
  return (
    <div style={{ width: 'calc(50% - 10px)', display: 'block', float: 'left', margin: 5, overflow: 'hidden', borderRadius: 5, background: 'rgba(255,255,255,0.05)' }}>
      <div style={{ width: '100%', display: 'table', tableLayout: 'fixed' }}>
        <div style={{ display: 'table-cell', verticalAlign: 'middle', width: 70, fontSize: 28, textAlign: 'center', padding: '18px 0', background: color, color: '#fff' }}>
          <i className={`fa fa-${faIcon || icon}`} />
        </div>
        <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '0 12px' }}>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{label}</p>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{value ?? '—'}</p>
        </div>
      </div>
    </div>
  )
}

// Section title like CodyChat's elementTitle
function SectionTitle({ title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${ACCENT}` }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{title}</h2>
      {right}
    </div>
  )
}

// ── DASHBOARD ──────────────────────────────────────────────────
function DashboardPage({ user }) {
  const [stats, setStats] = useState(null)
  useEffect(() => { apiFetch('/stats').then(d => setStats(d)).catch(() => {}) }, [])

  return (
    <div>
      <SectionTitle title="Dashboard" />
      {stats ? (
        <div style={{ overflow: 'hidden' }}>
          <SpBox faIcon="users"         label="Registered"   value={stats.users}       color={ACCENT} />
          <SpBox faIcon="toggle-on"     label="Online"       value={stats.online}      color="#22c55e" />
          <SpBox faIcon="female"        label="New Today"    value={stats.newToday}    color="#ec4899" />
          <SpBox faIcon="male"          label="Rooms"        value={stats.rooms}       color="#3b82f6" />
          <SpBox faIcon="microphone-slash" label="Banned"   value={stats.bannedUsers} color="#ef4444" />
          <SpBox faIcon="bolt"          label="Reports"      value={stats.reports}     color="#f59e0b" />
          <SpBox faIcon="comments"      label="Messages"     value={stats.messages}    color="#8b5cf6" />
          <SpBox faIcon="gift"          label="Gifts Sent"   value={stats.gifts}       color="#ec4899" />
          <div style={{ clear: 'both' }} />
        </div>
      ) : <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>Loading stats…</div>}
    </div>
  )
}

// ── MEMBERS ────────────────────────────────────────────────────
function MembersPage({ currentUser }) {
  const { showToast } = useToast()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [rankF, setRankF] = useState('')
  const [loading, setLoading] = useState(false)
  const [sel, setSel] = useState(null)
  const [modal, setModal] = useState(null)

  const [banReason, setBanReason] = useState('')
  const [muteMin, setMuteMin] = useState('30')
  const [muteReason, setMuteReason] = useState('')
  const [goldAmt, setGoldAmt] = useState('')
  const [goldAct, setGoldAct] = useState('add')
  const [newRank, setNewRank] = useState('')
  const [newPass, setNewPass] = useState('')
  const [warnMsg, setWarnMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page, limit: 20, search, rank: rankF })
      const d = await apiFetch(`/users?${p}`)
      setUsers(d.users); setTotal(d.total); setPages(d.pages)
    } catch (e) { showToast(e.message, 'error') }
    setLoading(false)
  }, [page, search, rankF])

  useEffect(() => { load() }, [load])

  const act = async (path, method = 'PUT', body = {}) => {
    try {
      const d = await apiFetch(`/users/${sel._id}${path}`, { method, body: JSON.stringify(body) })
      showToast(d.message || 'Done', 'success'); setModal(null); load()
    } catch (e) { showToast(e.message, 'error') }
  }

  const canAct = t => RL(currentUser.rank) > RL(t.rank) || currentUser.rank === 'owner'
  const RANK_OPTS = RANKS_LIST.map(r => ({ value: r.key, label: r.label }))

  return (
    <div>
      <SectionTitle title="Manage Members" right={
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search username/email…"
            style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 5, padding: '6px 10px', color: '#e2e8f0', fontSize: 12, width: 160, outline: 'none' }} />
          <select value={rankF} onChange={e => { setRankF(e.target.value); setPage(1) }}
            style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 5, padding: '6px 8px', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
            <option value="">All Ranks</option>
            {RANKS_LIST.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
      } />

      <div style={{ background: '#111', borderRadius: 5, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #222' }}>
              {['User', 'Rank', 'Gold', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '9px 10px', textAlign: 'left', color: '#666', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: .5, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#666' }}>Loading…</td></tr>
              : users.length === 0 ? <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#666' }}>No users found</td></tr>
                : users.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #1a1a1a' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#191919'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Av src={u.avatar} size={30} gender={u.gender} />
                        <div>
                          <div style={{ fontWeight: 700, color: getRankColor(u.rank) }}>{u.username}</div>
                          <div style={{ fontSize: 10, color: '#666' }}>{u.email}</div>
                        </div>
                        {u.isBanned && <span style={{ background: '#ef444422', color: '#ef4444', fontSize: 10, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>BANNED</span>}
                        {u.isMuted && <span style={{ background: '#f59e0b22', color: '#f59e0b', fontSize: 10, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>MUTED</span>}
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <RIcon rank={u.rank} size={13} />
                        <span style={{ color: getRankColor(u.rank), fontWeight: 700, fontSize: 11 }}>{getRankLabel(u.rank)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#fbbf24', fontWeight: 700 }}>{u.gold?.toLocaleString() ?? 0}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: u.isOnline ? '#22c55e' : '#555', display: 'inline-block' }} />
                    </td>
                    <td style={{ padding: '8px 10px', color: '#666', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {canAct(u) && <>
                          {isAdmin(currentUser.rank) && <ThemeBtn onClick={() => { setSel(u); setNewRank(u.rank); setModal('rank') }}>🎖</ThemeBtn>}
                          <ThemeBtn onClick={() => { setSel(u); setMuteMin('30'); setMuteReason(''); setModal('mute') }} variant="warn">🔇</ThemeBtn>
                          <ThemeBtn onClick={() => { setSel(u); setWarnMsg(''); setModal('warn') }} variant="warn">⚠️</ThemeBtn>
                          {isAdmin(currentUser.rank) && <ThemeBtn onClick={() => { setSel(u); setBanReason(''); setModal('ban') }} variant="danger">{u.isBanned ? '🔓' : '🔨'}</ThemeBtn>}
                          {isAdmin(currentUser.rank) && <ThemeBtn onClick={() => { setSel(u); setGoldAmt(''); setModal('gold') }}>💰</ThemeBtn>}
                          {isOwner(currentUser.rank) && <ThemeBtn onClick={() => { setSel(u); setNewPass(''); setModal('password') }} variant="ghost">🔑</ThemeBtn>}
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
          <ThemeBtn variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</ThemeBtn>
          <span style={{ color: '#666', padding: '5px 10px', fontSize: 12 }}>Page {page} / {pages}</span>
          <ThemeBtn variant="ghost" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</ThemeBtn>
        </div>
      )}

      {modal === 'ban' && sel && (
        <Modal title={sel.isBanned ? `Unban ${sel.username}` : `Ban ${sel.username}`} onClose={() => setModal(null)}>
          {sel.isBanned
            ? <><div style={{ color: '#9ca3af', marginBottom: 12 }}>Remove ban for <strong style={{ color: '#f1f5f9' }}>{sel.username}</strong>?</div>
              <ThemeBtn variant="success" onClick={() => act('/unban')}>✅ Unban User</ThemeBtn></>
            : <><Input label="Ban Reason" value={banReason} onChange={setBanReason} placeholder="Reason…" />
              <ThemeBtn variant="danger" disabled={!banReason.trim()} onClick={() => act('/ban', 'PUT', { reason: banReason })}>🔨 Ban User</ThemeBtn></>}
        </Modal>
      )}
      {modal === 'mute' && sel && (
        <Modal title={`Mute ${sel.username}`} onClose={() => setModal(null)}>
          <Input label="Duration (minutes)" value={muteMin} onChange={setMuteMin} type="number" placeholder="30" />
          <Input label="Reason" value={muteReason} onChange={setMuteReason} />
          <ThemeBtn variant="warn" onClick={() => act('/mute', 'PUT', { minutes: +muteMin, reason: muteReason || 'Muted' })}>🔇 Mute</ThemeBtn>
        </Modal>
      )}
      {modal === 'warn' && sel && (
        <Modal title={`Warn ${sel.username}`} onClose={() => setModal(null)}>
          <Input label="Warning Message" value={warnMsg} onChange={setWarnMsg} />
          <ThemeBtn variant="warn" disabled={!warnMsg.trim()} onClick={() => act('/warn', 'POST', { message: warnMsg })}>⚠️ Send Warning</ThemeBtn>
        </Modal>
      )}
      {modal === 'rank' && sel && (
        <Modal title={`Change Rank: ${sel.username}`} onClose={() => setModal(null)}>
          <Select label="New Rank" value={newRank} onChange={setNewRank}
            options={RANKS_LIST.filter(r => RL(r.key) < RL(currentUser.rank)).map(r => ({ value: r.key, label: r.label }))} />
          <ThemeBtn onClick={() => act('/rank', 'PUT', { rank: newRank })}>🎖 Set Rank</ThemeBtn>
        </Modal>
      )}
      {modal === 'gold' && sel && (
        <Modal title={`Gold: ${sel.username}`} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {['add', 'remove', 'set'].map(a => (
              <ThemeBtn key={a} variant={goldAct === a ? 'primary' : 'ghost'} onClick={() => setGoldAct(a)}>{a}</ThemeBtn>
            ))}
          </div>
          <Input label="Amount" value={goldAmt} onChange={setGoldAmt} type="number" />
          <ThemeBtn onClick={() => act('/gold', 'PUT', { amount: +goldAmt, action: goldAct })}>💰 Update</ThemeBtn>
        </Modal>
      )}
      {modal === 'password' && sel && (
        <Modal title={`Reset Password: ${sel.username}`} onClose={() => setModal(null)}>
          <Input label="New Password (min 6)" value={newPass} onChange={setNewPass} type="password" />
          <ThemeBtn variant="danger" disabled={newPass.length < 6} onClick={() => act('/password', 'PUT', { password: newPass })}>🔑 Change Password</ThemeBtn>
        </Modal>
      )}
    </div>
  )
}

// ── PERMISSIONS ────────────────────────────────────────────────
function PermissionsPage({ currentUser }) {
  const { showToast } = useToast()
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('member')

  useEffect(() => {
    apiFetch('/settings').then(d => setSettings(d.settings)).catch(e => showToast(e.message, 'error'))
  }, [])

  const upd = (k, v) => setSettings(s => ({ ...s, [k]: v }))

  const save = async () => {
    setSaving(true)
    try { await apiFetch('/settings', { method: 'PUT', body: JSON.stringify(settings) }); showToast('Settings saved!', 'success') }
    catch (e) { showToast(e.message, 'error') }
    setSaving(false)
  }

  const RANK_OPTS = RANKS_LIST.map(r => ({ value: r.key, label: r.label }))

  if (!settings) return <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>Loading…</div>

  const MEMBER_PERMS = [
    ['allow_main', 'Send Main Chat'], ['allow_private', 'Private Messages'], ['allow_avatar', 'Change Avatar'],
    ['allow_name', 'Change Username'], ['allow_cover', 'Change Cover'], ['allow_mood', 'Set Mood'],
    ['allow_theme', 'Change Theme'], ['allow_cupload', 'Upload Chat Images'], ['allow_video', 'Upload Videos'],
    ['allow_audio', 'Voice Messages'], ['allow_name_color', 'Name Color'], ['allow_name_grad', 'Name Gradient'],
    ['allow_name_neon', 'Name Neon'], ['allow_colors', 'Bubble Color'], ['allow_grad', 'Bubble Gradient'],
    ['allow_neon', 'Bubble Neon'], ['allow_font', 'Custom Font'], ['allow_font_size', 'Font Size'],
    ['allow_room', 'Create Rooms'], ['allow_dice', 'Play Dice'], ['allow_keno', 'Play Keno'],
    ['allow_spin', 'Spin Wheel'], ['allow_vcall', 'Video Call'], ['allow_acall', 'Audio Call'],
    ['allow_gcall', 'Group Call'], ['allow_webcam', 'Webcam'], ['allow_send_gift', 'Send Gifts'],
    ['allow_report', 'Report Users'], ['allow_whisper', 'Whisper'],
  ]
  const STAFF_PERMS = [
    ['can_mute', 'Mute Users'], ['can_warn', 'Warn Users'], ['can_kick', 'Kick Users'],
    ['can_ghost', 'Ghost Users'], ['can_ban', 'Ban Users'], ['can_delete', 'Delete Messages'],
    ['can_rank', 'Change Ranks'], ['can_auth', 'Verify Accounts'], ['can_mip', 'IP Bans'],
    ['can_mroom', 'Manage Rooms'], ['can_modname', 'Edit Usernames'], ['can_modemail', 'Edit Emails'],
    ['can_modpass', 'Change Passwords'],
  ]

  return (
    <div>
      <SectionTitle title="Permissions" right={<ThemeBtn onClick={save} disabled={saving}>{saving ? 'Saving…' : '💾 Save All'}</ThemeBtn>} />

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['member', 'Member Permissions'], ['staff', 'Staff Permissions']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '6px 14px', borderRadius: 5, border: `1px solid ${tab === id ? ACCENT : '#333'}`, background: tab === id ? ACCENT + '22' : 'transparent', color: tab === id ? ACCENT : '#666', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: '#111', borderRadius: 5, overflow: 'hidden' }}>
        {(tab === 'member' ? MEMBER_PERMS : STAFF_PERMS).map(([k, l]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid #1a1a1a' }}>
            <span style={{ fontSize: 13, color: '#e2e8f0' }}>{l}</span>
            <select value={settings[k] || 'guest'} onChange={e => upd(k, e.target.value)}
              style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, padding: '3px 7px', color: getRankColor(settings[k] || 'guest'), fontSize: 12, fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
              {RANK_OPTS
                .filter(o => tab === 'staff' ? ['moderator', 'admin', 'superadmin', 'owner'].includes(o.value) : true)
                .map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── REPORTS ────────────────────────────────────────────────────
function ReportsPage() {
  const { showToast } = useToast()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/reports').then(d => setReports(d.reports)).catch(e => showToast(e.message, 'error')).finally(() => setLoading(false))
  }, [])

  const resolve = async id => { try { await apiFetch(`/reports/${id}/resolve`, { method: 'PUT', body: '{}' }); setReports(p => p.map(r => r._id === id ? { ...r, status: 'resolved' } : r)); showToast('Resolved', 'success') } catch (e) { showToast(e.message, 'error') } }
  const dismiss = async id => { try { await apiFetch(`/reports/${id}/dismiss`, { method: 'PUT', body: '{}' }); setReports(p => p.map(r => r._id === id ? { ...r, status: 'dismissed' } : r)); showToast('Dismissed', 'success') } catch (e) { showToast(e.message, 'error') } }

  return (
    <div>
      <SectionTitle title={`Reports (${reports.filter(r => r.status === 'pending').length} pending)`} />
      {loading ? <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>Loading…</div>
        : reports.length === 0 ? <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>No reports</div>
          : reports.map(r => (
            <div key={r._id} style={{ background: '#111', borderRadius: 5, padding: '12px 14px', marginBottom: 8, border: `1px solid ${r.status === 'pending' ? '#f59e0b33' : '#1e1e1e'}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Av src={r.reporter?.avatar} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 13 }}>{r.reporter?.username || 'Anon'}</span>
                    <span style={{ color: '#666', fontSize: 12 }}>reported</span>
                    <span style={{ fontWeight: 700, color: '#ef4444', fontSize: 13 }}>{r.reportedUser?.username || 'Unknown'}</span>
                    <span style={{ background: r.status === 'pending' ? '#f59e0b22' : '#33333344', color: r.status === 'pending' ? '#f59e0b' : '#666', fontSize: 10, padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>{r.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.reason || 'No reason'}</div>
                </div>
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <ThemeBtn variant="success" size="sm" onClick={() => resolve(r._id)}>✅</ThemeBtn>
                    <ThemeBtn variant="ghost" size="sm" onClick={() => dismiss(r._id)}>✖</ThemeBtn>
                  </div>
                )}
              </div>
            </div>
          ))}
    </div>
  )
}

// ── ROOMS PAGE ─────────────────────────────────────────────────
function RoomsPage({ currentUser }) {
  const { showToast } = useToast()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const load = () => apiFetch('/rooms').then(d => setRooms(d.rooms)).catch(e => showToast(e.message, 'error')).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const del = async id => {
    if (!confirm('Delete room?')) return
    try { await apiFetch(`/rooms/${id}`, { method: 'DELETE' }); showToast('Deleted', 'success'); load() } catch (e) { showToast(e.message, 'error') }
  }
  const clear = async id => {
    try { await apiFetch(`/rooms/${id}/messages`, { method: 'DELETE' }); showToast('Messages cleared', 'success') } catch (e) { showToast(e.message, 'error') }
  }

  return (
    <div>
      <SectionTitle title="Manage Rooms" />
      {loading ? <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>Loading…</div>
        : rooms.map(room => (
          <div key={room._id} style={{ background: '#111', borderRadius: 5, padding: '11px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={room.icon || '/default_images/rooms/default_room.png'} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', background: '#1a1a1a' }} onError={e => e.target.src = '/default_images/rooms/default_room.png'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 13 }}>{room.name}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{room.description || 'No description'} · {room.type} · {room.currentUsers || 0} online</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {isAdmin(currentUser.rank) && <ThemeBtn size="sm" variant="warn" onClick={() => clear(room._id)}>🗑 Msgs</ThemeBtn>}
              {isAdmin(currentUser.rank) && <ThemeBtn size="sm" variant="danger" onClick={() => del(room._id)}>🗑 Del</ThemeBtn>}
            </div>
          </div>
        ))}
    </div>
  )
}

// ── SETTINGS ───────────────────────────────────────────────────
function SettingsPage({ currentUser }) {
  const { showToast } = useToast()
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('general')

  useEffect(() => {
    apiFetch('/settings').then(d => setSettings(d.settings)).catch(e => showToast(e.message, 'error'))
  }, [])

  const upd = (k, v) => setSettings(s => ({ ...s, [k]: v }))
  const save = async () => {
    setSaving(true)
    try { await apiFetch('/settings', { method: 'PUT', body: JSON.stringify(settings) }); showToast('Saved!', 'success') }
    catch (e) { showToast(e.message, 'error') }
    setSaving(false)
  }

  if (!settings) return <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>Loading…</div>

  const TABS = [
    ['general', 'General'], ['modules', 'Modules'], ['wallet', 'Wallet'],
    ['games', 'Games'], ['email', 'Email'], ['ai', 'AI Bot'],
  ]

  return (
    <div>
      <SectionTitle title="System Settings" right={<ThemeBtn onClick={save} disabled={saving}>{saving ? 'Saving…' : '💾 Save'}</ThemeBtn>} />
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '5px 12px', borderRadius: 4, border: `1px solid ${tab === id ? ACCENT : '#333'}`, background: tab === id ? ACCENT : 'transparent', color: tab === id ? '#fff' : '#666', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ background: '#111', borderRadius: 5, padding: 16 }}>
        {tab === 'general' && <>
          <Input label="Site Name" value={settings.siteName || ''} onChange={v => upd('siteName', v)} />
          <Input label="Site Description" value={settings.siteDescription || ''} onChange={v => upd('siteDescription', v)} />
          <Input label="Max Message Length" value={String(settings.maxMessageLength || 2000)} onChange={v => upd('maxMessageLength', +v)} type="number" />
          <Input label="Chat Cooldown (sec)" value={String(settings.chatCooldownSec || 1)} onChange={v => upd('chatCooldownSec', +v)} type="number" />
          <Toggle label="Maintenance Mode" checked={!!settings.maintenanceMode} onChange={v => upd('maintenanceMode', v)} hint="Blocks all users except staff" />
          {settings.maintenanceMode && <Input label="Maintenance Message" value={settings.maintenanceMsg || ''} onChange={v => upd('maintenanceMsg', v)} />}
          <Toggle label="Allow Registration" checked={!!settings.allowRegistration} onChange={v => upd('allowRegistration', v)} />
          <Toggle label="Allow Guests" checked={!!settings.allowGuests} onChange={v => upd('allowGuests', v)} />
          <Toggle label="Require Email Verify" checked={!!settings.requireEmailVerify} onChange={v => upd('requireEmailVerify', v)} />
          <Toggle label="Show Gender" checked={!!settings.useGender} onChange={v => upd('useGender', v)} />
          <Toggle label="Gender Color Border" checked={!!settings.useGenderBorder} onChange={v => upd('useGenderBorder', v)} />
        </>}
        {tab === 'modules' && <>
          {[['giftEnabled', '🎁 Gifts'], ['callEnabled', '📞 Calls'], ['videoCallEnabled', '📹 Video Calls'], ['audioCallEnabled', '🎤 Audio Calls'], ['groupCallEnabled', '👥 Group Calls'], ['webcamEnabled', '📷 Webcam'], ['radioEnabled', '📻 Radio'], ['botEnabled', '🤖 Bot'], ['giphyEnabled', '🎞 Giphy'], ['youtubeEnabled', '▶️ YouTube'], ['wallEnabled', '📋 Wall'], ['likeEnabled', '❤️ Likes'], ['badgeEnabled', '🏅 Badges'], ['levelEnabled', '⭐ Levels'], ['walletEnabled', '💰 Wallet'], ['quizEnabled', '❓ Quiz']].map(([k, l]) => (
            <Toggle key={k} label={l} checked={!!settings[k]} onChange={v => upd(k, v)} />
          ))}
        </>}
        {tab === 'wallet' && <>
          <Toggle label="Gold Enabled" checked={!!settings.goldEnabled} onChange={v => upd('goldEnabled', v)} />
          <Input label="Gold Per Message" value={String(settings.goldPerMessage || 1)} onChange={v => upd('goldPerMessage', +v)} type="number" />
          <Input label="Gold Login Bonus" value={String(settings.goldLoginBonus || 50)} onChange={v => upd('goldLoginBonus', +v)} type="number" />
          <Toggle label="Ruby Enabled" checked={!!settings.rubyEnabled} onChange={v => upd('rubyEnabled', v)} />
        </>}
        {tab === 'games' && <>
          <Toggle label="Dice Enabled" checked={!!settings.diceEnabled} onChange={v => upd('diceEnabled', v)} />
          <Input label="Dice Min Bet" value={String(settings.diceBet || 100)} onChange={v => upd('diceBet', +v)} type="number" />
          <Input label="Dice Multiplier" value={String(settings.diceMultiplier || 5.7)} onChange={v => upd('diceMultiplier', +v)} type="number" />
          <Toggle label="Keno Enabled" checked={!!settings.kenoEnabled} onChange={v => upd('kenoEnabled', v)} />
          <Toggle label="Spin Wheel Enabled" checked={!!settings.spinEnabled} onChange={v => upd('spinEnabled', v)} />
          <Input label="Spin Cooldown (hours)" value={String(settings.spinCooldownHours || 24)} onChange={v => upd('spinCooldownHours', +v)} type="number" />
        </>}
        {tab === 'email' && <>
          <Input label="SMTP Host" value={settings.smtpHost || ''} onChange={v => upd('smtpHost', v)} placeholder="smtp.gmail.com" />
          <Input label="SMTP Port" value={String(settings.smtpPort || 587)} onChange={v => upd('smtpPort', +v)} type="number" />
          <Input label="SMTP User" value={settings.smtpUser || ''} onChange={v => upd('smtpUser', v)} />
          <Input label="SMTP Password" value={settings.smtpPass || ''} onChange={v => upd('smtpPass', v)} type="password" />
          <Input label="From Name" value={settings.emailFromName || ''} onChange={v => upd('emailFromName', v)} />
        </>}
        {tab === 'ai' && <>
          <Toggle label="AI Bot Enabled" checked={!!settings.groqEnabled} onChange={v => upd('groqEnabled', v)} />
          <Input label="Trigger Word" value={settings.groqTrigger || '@GenZBot'} onChange={v => upd('groqTrigger', v)} hint="Users type this to trigger the bot" />
          <Input label="Model" value={settings.groqModel || 'llama3-8b-8192'} onChange={v => upd('groqModel', v)} />
          <Input label="Max Tokens" value={String(settings.groqMaxTokens || 150)} onChange={v => upd('groqMaxTokens', +v)} type="number" />
          <Input label="Cooldown (seconds)" value={String(settings.groqCooldownSec || 5)} onChange={v => upd('groqCooldownSec', +v)} type="number" />
          <div style={{ marginBottom: 12 }}>
            <Lbl c="System Prompt" />
            <textarea value={settings.groqSystemPrompt || ''} onChange={e => upd('groqSystemPrompt', e.target.value)} rows={4}
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 5, padding: '8px 11px', color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
          </div>
        </>}
      </div>
    </div>
  )
}

// ── BROADCAST ─────────────────────────────────────────────────
function BroadcastPage() {
  const { showToast } = useToast()
  const [msg, setMsg] = useState('')
  const [type, setType] = useState('system')
  const [sending, setSending] = useState(false)
  const send = async () => {
    if (!msg.trim()) return
    setSending(true)
    try { await apiFetch('/broadcast', { method: 'POST', body: JSON.stringify({ message: msg, type }) }); showToast('Broadcast sent!', 'success'); setMsg('') }
    catch (e) { showToast(e.message, 'error') }
    setSending(false)
  }
  return (
    <div>
      <SectionTitle title="Broadcast Message" />
      <div style={{ background: '#f59e0b22', border: '1px solid #f59e0b44', borderRadius: 5, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#fbbf24' }}>
        ⚠️ This message will be sent to ALL registered users and shown in all chat rooms.
      </div>
      <Select label="Message Type" value={type} onChange={setType}
        options={[{ value: 'system', label: 'System' }, { value: 'info', label: 'Info' }, { value: 'warn', label: 'Warning' }, { value: 'announce', label: 'Announcement' }]} />
      <div style={{ marginBottom: 12 }}>
        <Lbl c="Message" />
        <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} placeholder="Broadcast message…"
          style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 5, padding: '8px 11px', color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
      </div>
      <ThemeBtn variant="warn" disabled={!msg.trim() || sending} onClick={send}>📢 {sending ? 'Sending…' : 'Send Broadcast'}</ThemeBtn>
    </div>
  )
}

// ── WORD FILTERS ──────────────────────────────────────────────
function FiltersPage() {
  const { showToast } = useToast()
  const [words, setWords] = useState([])
  const [word, setWord] = useState('')
  const [action, setAction] = useState('replace')
  const [repl, setRepl] = useState('***')
  const load = () => apiFetch('/filters').then(d => setWords(d.words || [])).catch(() => {})
  useEffect(() => { load() }, [])
  const add = async () => {
    if (!word.trim()) return
    try { await apiFetch('/filters', { method: 'POST', body: JSON.stringify({ word, action, replacement: repl }) }); showToast('Filter added', 'success'); setWord(''); load() }
    catch (e) { showToast(e.message, 'error') }
  }
  const del = async id => {
    try { await apiFetch(`/filters/${id}`, { method: 'DELETE' }); showToast('Removed', 'success'); load() }
    catch (e) { showToast(e.message, 'error') }
  }
  return (
    <div>
      <SectionTitle title="Word Filter" />
      <div style={{ background: '#111', borderRadius: 5, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <Lbl c="Word / Phrase" />
            <input value={word} onChange={e => setWord(e.target.value)} placeholder="e.g. badword"
              style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 5, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, width: 160, outline: 'none' }} />
          </div>
          <div>
            <Lbl c="Action" />
            <select value={action} onChange={e => setAction(e.target.value)}
              style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 5, padding: '7px 9px', color: '#e2e8f0', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
              <option value="replace">Replace</option>
              <option value="block">Block</option>
              <option value="warn">Warn</option>
            </select>
          </div>
          {action === 'replace' && (
            <div>
              <Lbl c="Replace With" />
              <input value={repl} onChange={e => setRepl(e.target.value)} placeholder="***"
                style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 5, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, width: 80, outline: 'none' }} />
            </div>
          )}
          <ThemeBtn onClick={add} disabled={!word.trim()}>+ Add</ThemeBtn>
        </div>
      </div>
      {words.map(w => (
        <div key={w._id} style={{ background: '#111', borderRadius: 5, padding: '9px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#ef444422', color: '#ef4444', fontSize: 12, padding: '2px 8px', borderRadius: 3, fontWeight: 700 }}>{w.word}</span>
          <span style={{ color: '#666', fontSize: 12 }}>→ {w.action}</span>
          {w.replacement && <span style={{ color: '#9ca3af', fontSize: 12 }}>"{w.replacement}"</span>}
          <div style={{ marginLeft: 'auto' }}><ThemeBtn size="sm" variant="danger" onClick={() => del(w._id)}>✖</ThemeBtn></div>
        </div>
      ))}
    </div>
  )
}

// ── IP BANS ────────────────────────────────────────────────────
function IpBansPage() {
  const { showToast } = useToast()
  const [bans, setBans] = useState([])
  const [ip, setIp] = useState('')
  const [reason, setReason] = useState('')
  const load = () => apiFetch('/ip-bans').then(d => setBans(d.bans || [])).catch(() => {})
  useEffect(() => { load() }, [])
  const add = async () => {
    if (!ip.trim()) return
    try { await apiFetch('/ip-bans', { method: 'POST', body: JSON.stringify({ ip, reason }) }); showToast('IP Banned', 'success'); setIp(''); setReason(''); load() }
    catch (e) { showToast(e.message, 'error') }
  }
  const del = async id => {
    try { await apiFetch(`/ip-bans/${id}`, { method: 'DELETE' }); showToast('Removed', 'success'); load() }
    catch (e) { showToast(e.message, 'error') }
  }
  return (
    <div>
      <SectionTitle title="IP Bans" />
      <div style={{ background: '#111', borderRadius: 5, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div><Lbl c="IP Address" /><input value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.1.1" style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 5, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, width: 150, outline: 'none' }} /></div>
          <div><Lbl c="Reason" /><input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason…" style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 5, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, width: 160, outline: 'none' }} /></div>
          <ThemeBtn variant="danger" onClick={add} disabled={!ip.trim()}>🚫 Ban IP</ThemeBtn>
        </div>
      </div>
      {bans.map(b => (
        <div key={b._id} style={{ background: '#111', borderRadius: 5, padding: '9px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#ef444422', color: '#ef4444', fontSize: 12, padding: '2px 8px', borderRadius: 3, fontWeight: 700 }}>{b.ip}</span>
          <span style={{ flex: 1, color: '#666', fontSize: 12 }}>{b.reason || 'No reason'}</span>
          <ThemeBtn size="sm" variant="success" onClick={() => del(b._id)}>🔓</ThemeBtn>
        </div>
      ))}
    </div>
  )
}

// ── CHAT LOGS ─────────────────────────────────────────────────
function LogsPage() {
  const { showToast } = useToast()
  const [logs, setLogs] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const load = () => {
    setLoading(true)
    apiFetch(`/logs?page=${page}&limit=50`).then(d => setLogs(d.logs || [])).catch(e => showToast(e.message, 'error')).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page])
  return (
    <div>
      <SectionTitle title="Chat Logs" right={
        <div style={{ display: 'flex', gap: 5 }}>
          <ThemeBtn variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</ThemeBtn>
          <span style={{ color: '#666', padding: '5px 8px', fontSize: 12 }}>Page {page}</span>
          <ThemeBtn variant="ghost" onClick={() => setPage(p => p + 1)}>Next →</ThemeBtn>
        </div>
      } />
      <div style={{ background: '#111', borderRadius: 5, overflow: 'hidden' }}>
        {loading ? <div style={{ color: '#666', padding: 30, textAlign: 'center' }}>Loading…</div>
          : logs.map(m => (
            <div key={m._id} style={{ display: 'flex', gap: 10, padding: '8px 12px', borderBottom: '1px solid #1a1a1a', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 10, color: '#444', whiteSpace: 'nowrap', paddingTop: 1, minWidth: 110 }}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 110 }}>
                <RIcon rank={m.sender?.rank} size={12} />
                <span style={{ fontSize: 11, fontWeight: 700, color: getRankColor(m.sender?.rank || 'guest') }}>{m.sender?.username || 'Anon'}</span>
              </div>
              <div style={{ fontSize: 12, color: '#d1d5db', flex: 1, wordBreak: 'break-word' }}>{m.text || '[media]'}</div>
            </div>
          ))}
      </div>
    </div>
  )
}

// ── SIDEBAR NAV ────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',  icon: 'tachometer', label: 'Dashboard',   always: true },
  { id: 'members',    icon: 'users',      label: 'Members',      always: true },
  { id: 'rooms',      icon: 'home',       label: 'Rooms',        always: true },
  { id: 'reports',    icon: 'flag',       label: 'Reports',      always: true },
  { id: 'perms',      icon: 'star',       label: 'Permissions',  admin: true },
  { id: 'filters',    icon: 'filter',     label: 'Word Filter',  always: true },
  { id: 'ipbans',     icon: 'ban',        label: 'IP Bans',      admin: true },
  { id: 'broadcast',  icon: 'bullhorn',   label: 'Broadcast',    admin: true },
  { id: 'logs',       icon: 'terminal',   label: 'Chat Logs',    admin: true },
  { id: 'settings',   icon: 'cog',        label: 'Settings',     admin: true },
]

// ── MAIN ADMIN PANEL ───────────────────────────────────────────
export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [active, setActive] = useState('dashboard')
  const [sideOpen, setSideOpen] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate('/login'); return }
      if (!isStaff(user.rank)) { navigate('/'); return }
    }
  }, [user, authLoading, navigate])

  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 34, height: 34, border: '3px solid #222', borderTop: `3px solid ${ACCENT}`, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!user || !isStaff(user.rank)) return null

  const visibleNav = NAV.filter(n => {
    if (n.always) return true
    if (n.admin && isAdmin(user.rank)) return true
    return false
  })

  const PAGES = {
    dashboard: <DashboardPage user={user} />,
    members:   <MembersPage currentUser={user} />,
    rooms:     <RoomsPage currentUser={user} />,
    reports:   <ReportsPage />,
    perms:     <PermissionsPage currentUser={user} />,
    filters:   <FiltersPage />,
    ipbans:    <IpBansPage />,
    broadcast: <BroadcastPage />,
    logs:      <LogsPage />,
    settings:  <SettingsPage currentUser={user} />,
  }

  const SIDE_W = sideOpen ? 240 : 52

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#141414', fontFamily: "'Trebuchet MS', 'Lucida Grande', Arial, sans-serif", color: '#e2e8f0', fontSize: 13 }}>
      {/* ── SIDEBAR (exact CodyChat bsidebar #080808) ── */}
      <div style={{ width: SIDE_W, background: '#080808', position: 'fixed', top: 0, left: 0, height: '100vh', overflowY: 'auto', overflowX: 'hidden', zIndex: 100, transition: 'width .2s', borderRight: '1px solid #1a1a1a', flexShrink: 0 }}>
        {/* Sidebar logo / header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: sideOpen ? '14px 16px' : '14px 10px', borderBottom: '1px solid #1a1a1a', minHeight: 50 }}>
          {sideOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#fff', letterSpacing: .5 }}>Chats<span style={{ color: ACCENT }}>GenZ</span></div>
              <div style={{ fontSize: 10, color: '#444', marginTop: 1 }}>Admin Panel</div>
            </div>
          )}
          <button onClick={() => setSideOpen(o => !o)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16, padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <i className={`fa fa-${sideOpen ? 'angle-left' : 'angle-right'}`} />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '8px 0' }}>
          {visibleNav.map(n => (
            <button key={n.id} onClick={() => setActive(n.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: sideOpen ? '10px 16px' : '10px 0', justifyContent: sideOpen ? 'flex-start' : 'center',
                background: active === n.id ? `${ACCENT}18` : 'transparent',
                borderLeft: active === n.id ? `3px solid ${ACCENT}` : '3px solid transparent',
                border: 'none', color: active === n.id ? ACCENT : '#666',
                fontWeight: active === n.id ? 700 : 400, fontSize: 13, cursor: 'pointer',
                transition: 'all .12s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (active !== n.id) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.color = active !== n.id ? '#aaa' : ACCENT }}
              onMouseLeave={e => { e.currentTarget.style.background = active === n.id ? `${ACCENT}18` : 'transparent'; e.currentTarget.style.color = active === n.id ? ACCENT : '#666' }}>
              <i className={`fa fa-${n.icon}`} style={{ width: 16, textAlign: 'center', flexShrink: 0, fontSize: 14 }} />
              {sideOpen && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.label}</span>}
            </button>
          ))}
        </nav>

        {/* User info at bottom */}
        {sideOpen && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px', borderTop: '1px solid #1a1a1a', background: '#080808' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
              <Av src={user.avatar} size={26} gender={user.gender} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: getRankColor(user.rank), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
                <div style={{ fontSize: 10, color: '#444' }}>{getRankLabel(user.rank)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ marginLeft: SIDE_W, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left .2s' }}>
        {/* Top header (bhead #111) */}
        <header style={{ background: '#111', borderBottom: '1px solid #1a1a1a', height: 50, display: 'flex', alignItems: 'center', padding: '0 20px', position: 'sticky', top: 0, zIndex: 50, gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,.4)' }}>
          <span style={{ color: '#666', fontSize: 12 }}>
            <i className="fa fa-home" style={{ marginRight: 6 }} />
            <span style={{ cursor: 'pointer', color: ACCENT }} onClick={() => navigate('/chat')}>ChatsGenZ</span>
            {' '}<i className="fa fa-angle-right" style={{ margin: '0 6px', fontSize: 10 }} />
            <span style={{ color: '#9ca3af' }}>{visibleNav.find(n => n.id === active)?.label || 'Admin'}</span>
          </span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Av src={user.avatar} size={28} gender={user.gender} />
            <span style={{ fontSize: 12, color: getRankColor(user.rank), fontWeight: 700 }}>{user.username}</span>
            <button onClick={() => navigate('/chat')} style={{ background: ACCENT, border: 'none', borderRadius: 4, padding: '4px 10px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              <i className="fa fa-arrow-left" style={{ marginRight: 5 }} />Chat
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 20, maxWidth: 1100 }}>
          {/* page_element style */}
          <div style={{ background: '#191919', borderRadius: 5, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.4)' }}>
            {PAGES[active] || <div style={{ color: '#666' }}>Section not found</div>}
          </div>
        </main>

        <footer style={{ background: '#111', borderTop: '1px solid #1a1a1a', padding: '10px 20px', fontSize: 11, color: '#444', textAlign: 'center' }}>
          ChatsGenZ Admin Panel © {new Date().getFullYear()}
        </footer>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { scrollbar-width: thin; scrollbar-color: #333 transparent; }
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-thumb { background: #333; border-radius: 99px; }
        select option { background: #1a1a1a; color: #e2e8f0; }
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
      `}</style>
    </div>
  )
}
