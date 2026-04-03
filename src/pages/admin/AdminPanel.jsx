/**
 * AdminPanel.jsx — ChatsGenZ Admin Panel
 * Mobile-first • Opens in new tab • Real-time via Socket.io
 * Font Awesome icons + /dashboard.png from public folder
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import Permissions, { PERMISSIONS_CSS } from './Permissions.jsx';
import { PremiumSection, RevenueSection, ThemePermissionsSection, EXTRA_SECTIONS_CSS } from './PremiumRevenue.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => localStorage.getItem('token');

const api = async (path, opts = {}) => {
  const r = await fetch(`${API}/api/admin${path}`, {
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || 'Request failed');
  }
  return r.json();
};

// ── Helpers ────────────────────────────────────────────────────
const toast = (msg, type = 'success') => {
  const el = document.createElement('div');
  el.className = `ap-toast ap-toast--${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
};

const RANK_COLORS = {
  guest: '#888', user: '#aaa', vipfemale: '#FF4488', vipmale: '#4488FF',
  butterfly: '#FF66AA', ninja: '#777', fairy: '#FF88CC', legend: '#FF8800',
  bot: '#00cc88', premium: '#aa44ff', moderator: '#00AAFF', admin: '#FF4444',
  superadmin: '#FF00FF', owner: '#FFD700',
};
const rankColor = r => RANK_COLORS[r] || '#aaa';

const RANK_ICONS = {
  guest:'guest.svg', user:'user.svg', vipfemale:'vip_female.svg', vipmale:'vip_male.svg',
  butterfly:'butterfly.svg', ninja:'ninja.svg', fairy:'fairy.svg', legend:'legend.png',
  bot:'bot.svg', premium:'premium.svg', moderator:'mod.svg', admin:'admin.svg',
  superadmin:'super_admin.svg', owner:'owner.svg',
};
const rankIcon = r => RANK_ICONS[r] ? `/icons/ranks/${RANK_ICONS[r]}` : null;

const RANKS = ['guest','user','vipfemale','vipmale','butterfly','ninja','fairy','legend','bot','premium','moderator','admin','superadmin','owner'];

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="ap-stat-card" style={{ '--card-accent': color }}>
      <div className="ap-stat-icon"><i className={`fa-solid ${icon}`} style={{ color }} /></div>
      <div className="ap-stat-body">
        <div className="ap-stat-value">{value ?? '—'}</div>
        <div className="ap-stat-label">{label}</div>
        {sub && <div className="ap-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────────
function Confirm({ msg, onYes, onNo }) {
  return (
    <div className="ap-overlay" onClick={onNo}>
      <div className="ap-dialog" onClick={e => e.stopPropagation()}>
        <p>{msg}</p>
        <div className="ap-dialog-actions">
          <button className="ap-btn ap-btn--danger" onClick={onYes}>Confirm</button>
          <button className="ap-btn ap-btn--ghost" onClick={onNo}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SECTIONS
// ══════════════════════════════════════════════════════════════

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard({ socket }) {
  const [stats, setStats] = useState(null);
  const load = useCallback(() => api('/stats').then(setStats).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!socket) return;
    socket.on('userJoined', load);
    socket.on('userLeft', load);
    return () => { socket.off('userJoined', load); socket.off('userLeft', load); };
  }, [socket, load]);

  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><img src="/dashboard.png" alt="" className="ap-icon-img" /> Dashboard</h2>
      <div className="ap-stats-grid">
        <StatCard icon="fa-users" label="Total Users" value={stats?.users} color="#3b82f6" sub={`+${stats?.newToday ?? 0} today`} />
        <StatCard icon="fa-circle-dot" label="Online Now" value={stats?.online} color="#22c55e" />
        <StatCard icon="fa-door-open" label="Active Rooms" value={stats?.rooms} color="#8b5cf6" />
        <StatCard icon="fa-message" label="Messages" value={stats?.messages?.toLocaleString()} color="#06b6d4" />
        <StatCard icon="fa-flag" label="Pending Reports" value={stats?.reports} color="#f59e0b" />
        <StatCard icon="fa-gift" label="Gift Transactions" value={stats?.gifts} color="#ec4899" />
        <StatCard icon="fa-ban" label="Banned Users" value={stats?.bannedUsers} color="#ef4444" />
        <StatCard icon="fa-user-plus" label="New Today" value={stats?.newToday} color="#10b981" />
      </div>

      <h3 className="ap-subsection-title"><i className="fa-solid fa-venus-mars" /> Gender Breakdown</h3>
      <div className="ap-stats-grid ap-stats-grid--4">
        <StatCard icon="fa-mars" label="Male" value={stats?.genderMale} color="#4488FF" />
        <StatCard icon="fa-venus" label="Female" value={stats?.genderFemale} color="#FF4488" />
        <StatCard icon="fa-genderless" label="Others" value={stats?.genderOther} color="#8b5cf6" />
        <StatCard icon="fa-heart" label="Couple" value={stats?.genderCouple} color="#ec4899" />
      </div>

      <div className="ap-refresh-row">
        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={load}><i className="fa-solid fa-rotate" /> Refresh</button>
      </div>
    </div>
  );
}

// ── Users ──────────────────────────────────────────────────────
function Users() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [bannedFilter, setBannedFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const searchRef = useRef();

  const load = useCallback(() => {
    const p = new URLSearchParams({ page, limit: 30, search, rank: rankFilter, banned: bannedFilter });
    api(`/users?${p}`).then(d => { setUsers(d.users); setTotal(d.total); setPages(d.pages); }).catch(() => {});
  }, [page, search, rankFilter, bannedFilter]);

  useEffect(() => { load(); }, [load]);

  const action = async (url, method, body, msg) => {
    try { await api(url, { method, body: JSON.stringify(body) }); toast(msg); load(); if (selected) setSelected(null); }
    catch (e) { toast(e.message, 'error'); }
  };

  const UserDetail = ({ u }) => {
    const [rank, setRank] = useState(u.rank);
    const [goldAmt, setGoldAmt] = useState('');
    const [muteMin, setMuteMin] = useState(30);
    const [banReason, setBanReason] = useState('');

    return (
      <div className="ap-overlay" onClick={() => setSelected(null)}>
        <div className="ap-drawer" onClick={e => e.stopPropagation()}>
          <div className="ap-drawer-header">
            <img src={u.avatar || '/default_images/avatar/default_avatar.png'} className="ap-user-avatar" alt="" />
            <div>
              <div className="ap-user-name" style={{ color: rankColor(u.rank) }}>{u.username}</div>
              <div className="ap-user-meta">{u.email}</div>
              <div className="ap-badge" style={{ background: rankColor(u.rank) }}>{u.rank}</div>
            </div>
            <button className="ap-close-btn" onClick={() => setSelected(null)}><i className="fa-solid fa-xmark" /></button>
          </div>

          <div className="ap-drawer-body">
            <div className="ap-detail-grid">
              <div className="ap-detail-item"><span>Gold</span><strong>{u.gold}</strong></div>
              <div className="ap-detail-item"><span>Ruby</span><strong>{u.ruby}</strong></div>
              <div className="ap-detail-item"><span>Level</span><strong>{u.level}</strong></div>
              <div className="ap-detail-item"><span>XP</span><strong>{u.xp}</strong></div>
              <div className="ap-detail-item"><span>Gender</span><strong>{u.gender}</strong></div>
              <div className="ap-detail-item"><span>Country</span><strong>{u.countryCode || '—'}</strong></div>
              <div className="ap-detail-item"><span>Banned</span><strong style={{ color: u.isBanned ? '#ef4444' : '#22c55e' }}>{u.isBanned ? 'Yes' : 'No'}</strong></div>
              <div className="ap-detail-item"><span>Online</span><strong style={{ color: u.isOnline ? '#22c55e' : '#888' }}>{u.isOnline ? 'Yes' : 'No'}</strong></div>
            </div>

            <div className="ap-action-group">
              <label className="ap-label">Change Rank</label>
              <div className="ap-row">
                <select className="ap-select" value={rank} onChange={e => setRank(e.target.value)}>
                  {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button className="ap-btn ap-btn--primary ap-btn--sm" onClick={() => action(`/users/${u._id}/rank`, 'PUT', { rank }, 'Rank updated')}>Set</button>
              </div>
            </div>

            <div className="ap-action-group">
              <label className="ap-label">Gold Management</label>
              <div className="ap-row">
                <input className="ap-input" type="number" placeholder="Amount" value={goldAmt} onChange={e => setGoldAmt(e.target.value)} />
                <button className="ap-btn ap-btn--sm ap-btn--success" onClick={() => action(`/users/${u._id}/gold`, 'PUT', { amount: goldAmt, action: 'add' }, 'Gold added')}>+Add</button>
                <button className="ap-btn ap-btn--sm ap-btn--danger" onClick={() => action(`/users/${u._id}/gold`, 'PUT', { amount: goldAmt, action: 'remove' }, 'Gold removed')}>−Remove</button>
              </div>
            </div>

            <div className="ap-action-group">
              <label className="ap-label">Mute User</label>
              <div className="ap-row">
                <input className="ap-input" type="number" placeholder="Minutes" value={muteMin} onChange={e => setMuteMin(e.target.value)} />
                {u.isMuted
                  ? <button className="ap-btn ap-btn--sm ap-btn--success" onClick={() => action(`/users/${u._id}/unmute`, 'PUT', {}, 'Unmuted')}>Unmute</button>
                  : <button className="ap-btn ap-btn--sm ap-btn--warning" onClick={() => action(`/users/${u._id}/mute`, 'PUT', { minutes: muteMin }, `Muted ${muteMin}min`)}>Mute</button>
                }
              </div>
            </div>

            <div className="ap-action-group">
              <label className="ap-label">Ban User</label>
              <div className="ap-row">
                <input className="ap-input" placeholder="Reason" value={banReason} onChange={e => setBanReason(e.target.value)} />
                {u.isBanned
                  ? <button className="ap-btn ap-btn--sm ap-btn--success" onClick={() => action(`/users/${u._id}/unban`, 'PUT', {}, 'Unbanned')}>Unban</button>
                  : <button className="ap-btn ap-btn--sm ap-btn--danger" onClick={() => setConfirm({ msg: `Ban ${u.username}?`, cb: () => action(`/users/${u._id}/ban`, 'PUT', { reason: banReason || 'Rule violation' }, 'Banned') })}>Ban</button>
                }
              </div>
            </div>

            <div className="ap-action-row">
              <button className="ap-btn ap-btn--sm ap-btn--ghost" onClick={() => action(`/users/${u._id}/kick`, 'POST', { reason: 'Kicked by admin' }, 'Kicked')}>
                <i className="fa-solid fa-person-walking-arrow-right" /> Kick
              </button>
              <button className="ap-btn ap-btn--sm ap-btn--ghost" onClick={() => action(`/users/${u._id}/warn`, 'POST', { message: 'Warning from admin' }, 'Warned')}>
                <i className="fa-solid fa-triangle-exclamation" /> Warn
              </button>
              <button className="ap-btn ap-btn--sm ap-btn--ghost" onClick={() => action(`/users/${u._id}/ghost`, 'PUT', {}, 'Ghost toggled')}>
                <i className="fa-solid fa-ghost" /> {u.isGhosted ? 'Unghost' : 'Ghost'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-users" /> Users <span className="ap-badge ap-badge--count">{total}</span></h2>

      <div className="ap-filter-bar">
        <input ref={searchRef} className="ap-input ap-input--search" placeholder="Search username / email…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className="ap-select" value={rankFilter} onChange={e => { setRankFilter(e.target.value); setPage(1); }}>
          <option value="">All Ranks</option>
          {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="ap-select" value={bannedFilter} onChange={e => { setBannedFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="true">Banned</option>
        </select>
      </div>

      <div className="ap-table-wrap">
        <table className="ap-table">
          <thead><tr><th>User</th><th>Rank</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className={u.isBanned ? 'ap-row--banned' : ''}>
                <td>
                  <div className="ap-user-cell">
                    <img src={u.avatar || '/default_images/avatar/default_avatar.png'} className="ap-table-avatar" alt="" />
                    <div>
                      <div className="ap-user-cell-name">{u.username}</div>
                      <div className="ap-user-cell-email">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className="ap-rank-tag" style={{ color: rankColor(u.rank), borderColor: rankColor(u.rank) + '44' }}>{u.rank}</span></td>
                <td>
                  <span className={`ap-status-dot ap-status-dot--${u.isOnline ? 'online' : 'offline'}`} />
                  {u.isBanned && <span className="ap-badge ap-badge--danger">Banned</span>}
                  {u.isMuted && <span className="ap-badge ap-badge--warn">Muted</span>}
                </td>
                <td><button className="ap-btn ap-btn--xs ap-btn--ghost" onClick={() => setSelected(u)}><i className="fa-solid fa-pen-to-square" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ap-pagination">
        <button className="ap-btn ap-btn--xs ap-btn--ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><i className="fa-solid fa-chevron-left" /></button>
        <span>Page {page} / {pages}</span>
        <button className="ap-btn ap-btn--xs ap-btn--ghost" disabled={page >= pages} onClick={() => setPage(p => p + 1)}><i className="fa-solid fa-chevron-right" /></button>
      </div>

      {selected && <UserDetail u={selected} />}
      {confirm && <Confirm msg={confirm.msg} onYes={() => { confirm.cb(); setConfirm(null); }} onNo={() => setConfirm(null)} />}
    </div>
  );
}

// ── Rooms ──────────────────────────────────────────────────────
function Rooms({ socket }) {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', isPrivate: false, isActive: true });
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => api('/rooms').then(d => setRooms(d.rooms)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!socket) return;
    socket.on('roomCreated', load); socket.on('roomDeleted', load); socket.on('roomUpdated', load);
    return () => { socket.off('roomCreated', load); socket.off('roomDeleted', load); socket.off('roomUpdated', load); };
  }, [socket, load]);

  const save = async () => {
    try {
      if (editing) { await api(`/rooms/${editing}`, { method: 'PUT', body: JSON.stringify(form) }); toast('Room updated'); }
      else { await api('/rooms', { method: 'POST', body: JSON.stringify(form) }); toast('Room created'); }
      setForm({ name: '', description: '', isPrivate: false, isActive: true }); setEditing(null); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const del = async id => {
    try { await api(`/rooms/${id}`, { method: 'DELETE' }); toast('Room deleted'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const clearMsgs = async id => {
    try { await api(`/rooms/${id}/messages`, { method: 'DELETE' }); toast('Messages cleared'); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-door-open" /> Rooms</h2>

      <div className="ap-card">
        <h3 className="ap-card-title">{editing ? 'Edit Room' : 'Create Room'}</h3>
        <div className="ap-form-grid">
          <input className="ap-input" placeholder="Room Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className="ap-input" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <label className="ap-checkbox"><input type="checkbox" checked={form.isPrivate} onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))} /> Private</label>
          <label className="ap-checkbox"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
        </div>
        <div className="ap-action-row">
          <button className="ap-btn ap-btn--primary" onClick={save}><i className="fa-solid fa-floppy-disk" /> {editing ? 'Update' : 'Create'}</button>
          {editing && <button className="ap-btn ap-btn--ghost" onClick={() => { setEditing(null); setForm({ name: '', description: '', isPrivate: false, isActive: true }); }}>Cancel</button>}
        </div>
      </div>

      <div className="ap-list">
        {rooms.map(r => (
          <div key={r._id} className="ap-list-item">
            <div className="ap-list-info">
              <strong>{r.name}</strong>
              <span className="ap-muted">{r.description}</span>
              <div>
                {r.isPrivate && <span className="ap-badge ap-badge--warn">Private</span>}
                {!r.isActive && <span className="ap-badge ap-badge--danger">Inactive</span>}
              </div>
            </div>
            <div className="ap-list-actions">
              <button className="ap-btn ap-btn--xs ap-btn--ghost" onClick={() => { setEditing(r._id); setForm({ name: r.name, description: r.description || '', isPrivate: r.isPrivate, isActive: r.isActive }); }}><i className="fa-solid fa-pen" /></button>
              <button className="ap-btn ap-btn--xs ap-btn--warn" onClick={() => setConfirm({ msg: `Clear all messages in ${r.name}?`, cb: () => clearMsgs(r._id) })}><i className="fa-solid fa-broom" /></button>
              <button className="ap-btn ap-btn--xs ap-btn--danger" onClick={() => setConfirm({ msg: `Delete room ${r.name}?`, cb: () => del(r._id) })}><i className="fa-solid fa-trash" /></button>
            </div>
          </div>
        ))}
      </div>
      {confirm && <Confirm msg={confirm.msg} onYes={() => { confirm.cb(); setConfirm(null); }} onNo={() => setConfirm(null)} />}
    </div>
  );
}

// ── Reports ────────────────────────────────────────────────────
const REPORT_TYPE_ICONS = { message:'fa-comment-slash', user:'fa-user-slash', room:'fa-door-closed', other:'fa-circle-exclamation' };
const REPORT_TYPE_COLORS = { message:'#f59e0b', user:'#ef4444', room:'#8b5cf6', other:'#6b7280' };
const STATUS_META = {
  pending:   { color:'#f59e0b', icon:'fa-clock',         label:'Pending'   },
  resolved:  { color:'#22c55e', icon:'fa-circle-check',  label:'Resolved'  },
  dismissed: { color:'#6b7280', icon:'fa-ban',           label:'Dismissed' },
  actioned:  { color:'#3b82f6', icon:'fa-gavel',         label:'Actioned'  },
};

function ReportCard({ r, onAction, onExpand, expanded }) {
  const sm = STATUS_META[r.status] || STATUS_META.pending;
  const typeIcon  = REPORT_TYPE_ICONS[r.type]  || 'fa-flag';
  const typeColor = REPORT_TYPE_COLORS[r.type] || '#6b7280';
  const isPending = r.status === 'pending';

  // Prefer populated fields, fall back to embedded strings
  const reportedName   = r.reportedUser?.username  || r.reportedUsername  || '—';
  const reportedAvatar = r.reportedUser?.avatar     || r.reportedAvatar    || null;
  const reportedRank   = r.reportedUser?.rank       || r.reportedRank      || '';
  const reporterName   = r.reportedBy?.username     || r.reporter?.username || r.reporterUsername || '—';
  const reporterAvatar = r.reportedBy?.avatar       || r.reporter?.avatar   || null;

  return (
    <div className={`rpt-card ${isPending ? 'rpt-card--pending' : 'rpt-card--done'}`}>
      {/* Top row */}
      <div className="rpt-card-header" onClick={() => onExpand(r._id)}>
        {/* Type badge */}
        <span className="rpt-type-badge" style={{ background: typeColor + '22', color: typeColor, border: `1px solid ${typeColor}44` }}>
          <i className={`fa-solid ${typeIcon}`} /> {r.type || 'report'}
        </span>

        {/* Reported user */}
        <div className="rpt-user-pill">
          {reportedAvatar
            ? <img src={reportedAvatar} alt="" className="rpt-mini-avatar" onError={e => { e.target.style.display = 'none'; }} />
            : <i className="fa-solid fa-user-circle rpt-avatar-icon" />
          }
          <span className="rpt-username" style={{ color: rankColor(reportedRank) }}>
            {reportedName}
          </span>
          {reportedRank && (
            <img src={rankIcon(reportedRank)} alt="" className="rpt-rank-icon"
              onError={e => { e.target.style.display = 'none'; }} />
          )}
        </div>

        {/* Status chip */}
        <span className="rpt-status-chip" style={{ color: sm.color, background: sm.color + '18', border: `1px solid ${sm.color}33` }}>
          <i className={`fa-solid ${sm.icon}`} /> {sm.label}
        </span>

        {/* Date */}
        <span className="rpt-date">
          <i className="fa-regular fa-clock" /> {new Date(r.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
        </span>

        <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'} rpt-chevron`} />
      </div>

      {/* Expandable body */}
      {expanded && (
        <div className="rpt-card-body">
          {/* Reporter row */}
          <div className="rpt-detail-row">
            <span className="rpt-detail-label"><i className="fa-solid fa-user" /> Reported by</span>
            <div className="rpt-user-pill rpt-user-pill--sm">
              {reporterAvatar
                ? <img src={reporterAvatar} alt="" className="rpt-mini-avatar" onError={e => { e.target.style.display='none'; }} />
                : <i className="fa-solid fa-user-circle rpt-avatar-icon rpt-avatar-icon--sm" />
              }
              <span>{reporterName}</span>
            </div>
          </div>

          {/* Reason */}
          <div className="rpt-detail-row">
            <span className="rpt-detail-label"><i className="fa-solid fa-triangle-exclamation" /> Reason</span>
            <span className="rpt-detail-val">{r.reasonLabel || r.reason || '—'}</span>
          </div>

          {/* Details / extra info */}
          {r.details && (
            <div className="rpt-detail-row">
              <span className="rpt-detail-label"><i className="fa-solid fa-align-left" /> Details</span>
              <span className="rpt-detail-val rpt-detail-val--desc">{r.details}</span>
            </div>
          )}

          {/* Reported message content */}
          {r.messageContent && (
            <div className="rpt-msg-box">
              <span className="rpt-msg-box-label"><i className="fa-solid fa-comment" /> Reported Message</span>
              <blockquote className="rpt-msg-quote">{r.messageContent}</blockquote>
            </div>
          )}

          {/* Room context */}
          {r.roomName && (
            <div className="rpt-detail-row">
              <span className="rpt-detail-label"><i className="fa-solid fa-door-open" /> Room</span>
              <span className="rpt-detail-val">{r.roomName}</span>
            </div>
          )}

          {/* Resolution info (action taken) */}
          {!isPending && (
            <div className="rpt-resolution-bar" style={{ borderColor: sm.color + '44', background: sm.color + '0d' }}>
              <i className={`fa-solid ${sm.icon}`} style={{ color: sm.color }} />
              <span style={{ color: sm.color, fontWeight: 700 }}>Action taken: {sm.label}</span>
              {r.resolvedAt && (
                <span className="rpt-res-date">
                  {new Date(r.resolvedAt).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          {isPending && (
            <div className="rpt-action-bar">
              <button className="ap-btn ap-btn--success ap-btn--sm" onClick={() => onAction(r._id, 'resolve')}>
                <i className="fa-solid fa-circle-check" /> Resolve
              </button>
              <button className="ap-btn ap-btn--primary ap-btn--sm" onClick={() => onAction(r._id, 'action')}>
                <i className="fa-solid fa-gavel" /> Mark Actioned
              </button>
              <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => onAction(r._id, 'dismiss')}>
                <i className="fa-solid fa-ban" /> Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Reports() {
  const [pending,  setPending]  = useState([]);
  const [actioned, setActioned] = useState([]);
  const [pTotal,   setPTotal]   = useState(0);
  const [aTotal,   setATotal]   = useState(0);
  const [pPage,    setPPage]    = useState(1);
  const [aPage,    setAPage]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search,   setSearch]   = useState('');
  const LIMIT = 20;

  const loadBoth = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        api(`/reports?status=pending&page=${pPage}&limit=${LIMIT}`),
        api(`/reports?status=all&page=${aPage}&limit=${LIMIT}`),
      ]);
      setPending(pRes.reports  || []);
      setPTotal(pRes.total     || 0);
      // "actioned" = everything except pending
      const done = (aRes.reports || []).filter(r => r.status !== 'pending');
      setActioned(done);
      setATotal(aRes.total - (pRes.total || 0));
    } catch { toast('Failed to load reports', 'error'); }
    finally { setLoading(false); }
  }, [pPage, aPage]);

  useEffect(() => { loadBoth(); }, [loadBoth]);

  const handleAction = async (id, act) => {
    try {
      await api(`/reports/${id}/${act}`, { method: 'PUT' });
      toast(`Report ${act === 'action' ? 'marked as actioned' : act + 'd'}!`);
      loadBoth();
      setExpanded(null);
    } catch (e) { toast(e.message, 'error'); }
  };

  const toggleExpand = id => setExpanded(p => p === id ? null : id);

  // Client-side type filter + search
  const applyFilters = list => {
    let out = list;
    if (typeFilter !== 'all') out = out.filter(r => r.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(r =>
        (r.reportedUser?.username || r.reportedUsername || '').toLowerCase().includes(q) ||
        (r.reportedBy?.username   || r.reporterUsername || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q) ||
        (r.details || '').toLowerCase().includes(q) ||
        (r.messageContent || '').toLowerCase().includes(q)
      );
    }
    return out;
  };

  const filteredPending  = applyFilters(pending);
  const filteredActioned = applyFilters(actioned);

  const TypeFilter = () => (
    <div className="rpt-type-filters">
      {['all','message','user','room','other'].map(t => (
        <button key={t} className={`ap-tab-btn ${typeFilter === t ? 'ap-tab-btn--active' : ''}`}
          onClick={() => setTypeFilter(t)} style={{ textTransform:'capitalize' }}>
          {t !== 'all' && <i className={`fa-solid ${REPORT_TYPE_ICONS[t]}`} style={{ color: REPORT_TYPE_COLORS[t], marginRight:4 }} />}
          {t}
        </button>
      ))}
    </div>
  );

  if (loading) return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-flag" /> Reports</h2>
      <div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div>
    </div>
  );

  return (
    <div className="ap-section rpt-root">
      {/* Header */}
      <div className="rpt-header">
        <h2 className="ap-section-title" style={{ marginBottom:0 }}>
          <i className="fa-solid fa-flag" /> Reports
        </h2>
        <div className="rpt-summary-chips">
          <span className="rpt-chip rpt-chip--pending">
            <i className="fa-solid fa-clock" /> {pTotal} Pending
          </span>
          <span className="rpt-chip rpt-chip--done">
            <i className="fa-solid fa-circle-check" /> {aTotal} Actioned
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="rpt-search-bar">
        <i className="fa-solid fa-search rpt-search-icon" />
        <input
          className="ap-input"
          placeholder="Search by username, reason, message content…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 34 }}
        />
        {search && (
          <button className="rpt-clear-btn" onClick={() => setSearch('')}>
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>

      <TypeFilter />

      {/* ══ CATEGORY 1 — PENDING (Action Not Taken) ══ */}
      <div className="rpt-section-heading rpt-section-heading--pending">
        <i className="fa-solid fa-clock" />
        <span>Pending Reports</span>
        <span className="rpt-count-badge rpt-count-badge--pending">{filteredPending.length}</span>
        <span className="rpt-section-sub">— Action not taken yet</span>
        <button className="ap-btn ap-btn--xs ap-btn--ghost" style={{ marginLeft:'auto' }} onClick={loadBoth}>
          <i className="fa-solid fa-rotate" /> Refresh
        </button>
      </div>

      <div className="rpt-list">
        {filteredPending.length === 0
          ? <div className="ap-empty"><i className="fa-solid fa-circle-check" style={{ color:'#22c55e', marginRight:8 }} />No pending reports{search || typeFilter !== 'all' ? ' matching filters' : ''}!</div>
          : filteredPending.map(r => (
              <ReportCard key={r._id} r={r} onAction={handleAction} onExpand={toggleExpand} expanded={expanded === r._id} />
            ))
        }
        {/* Pagination for pending */}
        {pTotal > LIMIT && (
          <div className="ap-pagination">
            <button className="ap-btn ap-btn--xs ap-btn--ghost" disabled={pPage <= 1} onClick={() => setPPage(p => p - 1)}>
              <i className="fa-solid fa-chevron-left" />
            </button>
            <span>Page {pPage} of {Math.ceil(pTotal / LIMIT)}</span>
            <button className="ap-btn ap-btn--xs ap-btn--ghost" disabled={pPage >= Math.ceil(pTotal / LIMIT)} onClick={() => setPPage(p => p + 1)}>
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        )}
      </div>

      {/* ══ CATEGORY 2 — ACTIONED / RESOLVED / DISMISSED ══ */}
      <div className="rpt-section-heading rpt-section-heading--done" style={{ marginTop:28 }}>
        <i className="fa-solid fa-gavel" />
        <span>Action Taken</span>
        <span className="rpt-count-badge rpt-count-badge--done">{filteredActioned.length}</span>
        <span className="rpt-section-sub">— Resolved, Actioned or Dismissed</span>
        {/* Sub-status legend */}
        <div className="rpt-status-legend">
          {['resolved','actioned','dismissed'].map(s => (
            <span key={s} className="rpt-legend-chip" style={{ color: STATUS_META[s].color }}>
              <i className={`fa-solid ${STATUS_META[s].icon}`} /> {STATUS_META[s].label}
            </span>
          ))}
        </div>
      </div>

      <div className="rpt-list">
        {filteredActioned.length === 0
          ? <div className="ap-empty">No actioned reports{search || typeFilter !== 'all' ? ' matching filters' : ''}</div>
          : filteredActioned.map(r => (
              <ReportCard key={r._id} r={r} onAction={handleAction} onExpand={toggleExpand} expanded={expanded === r._id} />
            ))
        }
        {aTotal > LIMIT && (
          <div className="ap-pagination">
            <button className="ap-btn ap-btn--xs ap-btn--ghost" disabled={aPage <= 1} onClick={() => setAPage(p => p - 1)}>
              <i className="fa-solid fa-chevron-left" />
            </button>
            <span>Page {aPage}</span>
            <button className="ap-btn ap-btn--xs ap-btn--ghost" onClick={() => setAPage(p => p + 1)}>
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Gifts ──────────────────────────────────────────────────────
// All public/gifts/*.svg available as preset icons
const PUBLIC_GIFTS = [
  'clover','clown','coffee','cool','crown','cure','diamond','energy','fishbone','flowers',
  'gift','goldpot','hot','icecream','karma','kiss','like','love','lovepotion','loverepair',
  'medal','money','pizza','poison','power','ring','rose','smile','star','teddy','trophy','voodoo'
];

const GIFT_RANK_LIST = [
  { id:'guest',      label:'Guest',       color:'#888888' },
  { id:'user',       label:'User',        color:'#aaaaaa' },
  { id:'vipfemale',  label:'VIP Female',  color:'#FF4488' },
  { id:'vipmale',    label:'VIP Male',    color:'#4488FF' },
  { id:'butterfly',  label:'Butterfly',   color:'#FF66AA' },
  { id:'ninja',      label:'Ninja',       color:'#777777' },
  { id:'fairy',      label:'Fairy',       color:'#FF88CC' },
  { id:'legend',     label:'Legend',      color:'#FF8800' },
  { id:'bot',        label:'Bot',         color:'#00cc88' },
  { id:'premium',    label:'Premium',     color:'#aa44ff' },
  { id:'moderator',  label:'Moderator',   color:'#00AAFF' },
  { id:'admin',      label:'Admin',       color:'#FF4444' },
  { id:'superadmin', label:'Super Admin', color:'#FF00FF' },
  { id:'owner',      label:'Owner',       color:'#FFD700' },
];

const BLANK_GIFT_FORM = {
  name:'', icon:'', price:10, rubyPrice:0,
  category:'general', minRank:'guest',
  isPremiumOnly:false, isActive:true, description:''
};

function GiftIconPicker({ value, onChange }) {
  const [tab, setTab] = useState('public');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file); // reuse existing upload endpoint
      const r = await fetch(`${API}/api/upload/gift-icon`, {
        method:'POST',
        headers:{ Authorization:`Bearer ${token()}` },
        body: fd,
      });
      if (r.ok) {
        const d = await r.json();
        onChange(d.url || d.icon);
        toast('Icon uploaded!');
      } else {
        // fallback: use imgbb-style direct upload or local blob preview
        const reader = new FileReader();
        reader.onload = ev => { onChange(ev.target.result); toast('Image loaded (preview only — save to persist)'); };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = ev => { onChange(ev.target.result); };
      reader.readAsDataURL(file);
      toast('Using local preview', 'error');
    } finally { setUploading(false); if(fileRef.current) fileRef.current.value=''; }
  };

  return (
    <div className="gift-icon-picker">
      <div className="gift-picker-tabs">
        <button className={`gift-picker-tab ${tab==='public'?'active':''}`} onClick={()=>setTab('public')}>
          <i className="fa-solid fa-images" /> Library ({PUBLIC_GIFTS.length})
        </button>
        <button className={`gift-picker-tab ${tab==='url'?'active':''}`} onClick={()=>setTab('url')}>
          <i className="fa-solid fa-link" /> URL / Emoji
        </button>
        <button className={`gift-picker-tab ${tab==='upload'?'active':''}`} onClick={()=>setTab('upload')}>
          <i className="fa-solid fa-upload" /> Upload
        </button>
      </div>

      {tab === 'public' && (
        <div className="gift-public-grid">
          {PUBLIC_GIFTS.map(g => {
            const src = `/gifts/${g}.svg`;
            const selected = value === src;
            return (
              <div key={g} className={`gift-public-item ${selected?'selected':''}`}
                onClick={()=>onChange(src)} title={g}>
                <img src={src} alt={g} onError={e=>{e.target.style.opacity='.3';}} />
                <span>{g}</span>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'url' && (
        <div style={{display:'flex',gap:10,alignItems:'center',marginTop:8,flexWrap:'wrap'}}>
          <input className="ap-input" style={{flex:1,minWidth:200}}
            placeholder="https://… or paste emoji 🎁"
            value={value} onChange={e=>onChange(e.target.value)} />
          {value && (
            <div className="gift-preview-thumb">
              {(value.startsWith('http')||value.startsWith('/')||value.startsWith('data:'))
                ? <img src={value} alt="preview" />
                : <span style={{fontSize:28}}>{value}</span>}
            </div>
          )}
        </div>
      )}

      {tab === 'upload' && (
        <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:10}}>
          <input type="file" ref={fileRef} accept="image/*,.svg" style={{display:'none'}} onChange={handleUpload} />
          <button className="ap-btn ap-btn--ghost" onClick={()=>fileRef.current?.click()} disabled={uploading}>
            {uploading
              ? <><i className="fa-solid fa-spinner fa-spin" /> Uploading…</>
              : <><i className="fa-solid fa-upload" /> Choose Image or SVG</>}
          </button>
          {value && (value.startsWith('http')||value.startsWith('/')||value.startsWith('data:')) && (
            <div className="gift-preview-thumb">
              <img src={value} alt="preview" />
              <span style={{fontSize:11,color:'#6b7280',marginLeft:8}}>Current icon</span>
            </div>
          )}
          <div style={{fontSize:11,color:'#6b7280'}}>
            <i className="fa-solid fa-circle-info" /> SVG, PNG, JPG, GIF supported.
            Files are uploaded via the server upload endpoint.
          </div>
        </div>
      )}
    </div>
  );
}

function Gifts() {
  const [gifts, setGifts]           = useState([]);
  const [filterCat, setFilterCat]   = useState('all');
  const [filterRank, setFilterRank] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [modalOpen, setModalOpen]   = useState(false);
  const [form, setForm]             = useState(BLANK_GIFT_FORM);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);
  const [confirm, setConfirm]       = useState(null);

  const load = useCallback(() =>
    api('/gifts').then(d => setGifts(d.gifts || [])).catch(() => {}),
  []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(BLANK_GIFT_FORM); setEditing(null); setModalOpen(true); };
  const openEdit = (g) => {
    setForm({
      name: g.name, icon: g.icon||'', price: g.price||10,
      rubyPrice: g.rubyPrice||0, category: g.category||'general',
      minRank: g.minRank||'guest', isPremiumOnly: g.isPremiumOnly||false,
      isActive: g.isActive!==false, description: g.description||''
    });
    setEditing(g._id);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast('Gift name is required', 'error');
    if (!form.icon.trim()) return toast('Gift icon is required', 'error');
    setSaving(true);
    try {
      if (editing) {
        await api(`/gifts/${editing}`, { method:'PUT', body:JSON.stringify(form) });
        toast('✅ Gift updated!');
      } else {
        await api('/gifts', { method:'POST', body:JSON.stringify(form) });
        toast('✅ Gift created!');
      }
      setModalOpen(false); setEditing(null); setForm(BLANK_GIFT_FORM); load();
    } catch(e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    try { await api(`/gifts/${id}`, { method:'DELETE' }); toast('Gift deleted'); load(); }
    catch(e) { toast(e.message, 'error'); }
  };

  // Derived: unique categories
  const allCats = ['general', ...new Set(gifts.map(g=>g.category).filter(c=>c&&c!=='general'))];

  const filtered = gifts.filter(g => {
    if (filterCat !== 'all' && g.category !== filterCat) return false;
    if (filterRank !== 'all' && (g.minRank||'guest') !== filterRank) return false;
    if (filterActive === 'active' && !g.isActive) return false;
    if (filterActive === 'inactive' && g.isActive) return false;
    return true;
  });

  const rankStyle = (rank) => {
    const r = GIFT_RANK_LIST.find(x=>x.id===rank);
    if (!r) return {};
    return { color:r.color, border:`1px solid ${r.color}44`, background:`${r.color}18` };
  };

  const renderIcon = (icon) => {
    if (!icon) return <span style={{fontSize:28}}>🎁</span>;
    if (icon.startsWith('http')||icon.startsWith('/')||icon.startsWith('data:'))
      return <img src={icon} alt="" style={{width:40,height:40,objectFit:'contain'}} />;
    return <span style={{fontSize:28}}>{icon}</span>;
  };

  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-gift" /> Gifts Management</h2>

      {/* Toolbar */}
      <div className="ap-filter-bar" style={{flexWrap:'wrap',gap:8,marginBottom:14}}>
        <button className="ap-btn ap-btn--primary" onClick={openCreate}>
          <i className="fa-solid fa-plus" /> Add Gift
        </button>
        <select className="ap-select" style={{minWidth:130}} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {allCats.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select className="ap-select" style={{minWidth:140}} value={filterRank} onChange={e=>setFilterRank(e.target.value)}>
          <option value="all">All Ranks</option>
          {GIFT_RANK_LIST.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <select className="ap-select" style={{minWidth:110}} value={filterActive} onChange={e=>setFilterActive(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span style={{fontSize:12,color:'#6b7280',marginLeft:'auto',alignSelf:'center'}}>
          {filtered.length} / {gifts.length} gifts
        </span>
      </div>

      {/* Gift Grid */}
      <div className="ap-gift-grid-v2">
        {filtered.length === 0 && (
          <div style={{gridColumn:'1/-1',padding:48,textAlign:'center',color:'#6b7280'}}>
            <i className="fa-solid fa-gift" style={{fontSize:36,display:'block',marginBottom:12}} />
            No gifts found. Click <strong>Add Gift</strong> to create one.
          </div>
        )}
        {filtered.map(g => {
          const rData = GIFT_RANK_LIST.find(x=>x.id===(g.minRank||'guest'));
          return (
            <div key={g._id} className={`ap-gift-card-v2 ${!g.isActive?'ap-gift-card-v2--inactive':''}`}>
              <div className="ap-gift-card-icon">{renderIcon(g.icon)}</div>
              <div className="ap-gift-card-name">{g.name}</div>
              <div className="ap-gift-card-meta">
                <span className="ap-gift-price-badge"><i className="fa-solid fa-coins" /> {g.price}</span>
                {(g.rubyPrice||0) > 0 && (
                  <span className="ap-gift-ruby-badge"><i className="fa-solid fa-gem" /> {g.rubyPrice}</span>
                )}
              </div>
              <div className="ap-gift-card-cat"><i className="fa-solid fa-tag" /> {g.category||'general'}</div>
              <div className="ap-gift-rank-badge" style={rankStyle(g.minRank||'guest')}>
                <i className="fa-solid fa-shield-halved" /> {rData?.label||'Guest'}+
              </div>
              {g.isPremiumOnly && (
                <div className="ap-gift-prem-flag"><i className="fa-solid fa-star" /> Premium Only</div>
              )}
              {!g.isActive && <div className="ap-gift-inactive-flag">Inactive</div>}
              <div className="ap-gift-card-actions">
                <button className="ap-btn ap-btn--xs ap-btn--ghost" title="Edit" onClick={()=>openEdit(g)}>
                  <i className="fa-solid fa-pen" />
                </button>
                <button className="ap-btn ap-btn--xs ap-btn--danger" title="Delete"
                  onClick={()=>setConfirm({msg:`Delete "${g.name}"?`, cb:()=>del(g._id)})}>
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="ap-overlay" onClick={()=>setModalOpen(false)}>
          <div className="ap-gift-modal" onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div className="ap-gift-modal-hdr">
              <i className="fa-solid fa-gift" style={{color:'#f59e0b'}} />
              <span>{editing ? 'Edit Gift' : 'Create New Gift'}</span>
              <button className="ap-close-btn" style={{marginLeft:'auto'}} onClick={()=>setModalOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Body */}
            <div className="ap-gift-modal-body">
              {/* Icon picker */}
              <div className="ap-fslabel"><i className="fa-solid fa-image" /> Gift Icon</div>
              <GiftIconPicker value={form.icon} onChange={v=>setForm(f=>({...f,icon:v}))} />

              {/* Basic fields */}
              <div className="ap-form-grid" style={{marginTop:16}}>
                <div>
                  <label className="ap-label">Gift Name *</label>
                  <input className="ap-input" placeholder="e.g. Golden Rose"
                    value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
                </div>
                <div>
                  <label className="ap-label">Category</label>
                  <input className="ap-input" list="gift-cats"
                    placeholder="e.g. flowers, love, special"
                    value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} />
                  <datalist id="gift-cats">
                    {allCats.map(c=><option key={c} value={c}/>)}
                    <option value="love"/><option value="flowers"/><option value="special"/>
                    <option value="seasonal"/><option value="rare"/>
                  </datalist>
                </div>
                <div>
                  <label className="ap-label"><i className="fa-solid fa-coins" style={{color:'#f59e0b'}} /> Gold Price</label>
                  <input className="ap-input" type="number" min="0"
                    value={form.price} onChange={e=>setForm(f=>({...f,price:+e.target.value}))} />
                </div>
                <div>
                  <label className="ap-label"><i className="fa-solid fa-gem" style={{color:'#e11d48'}} /> Ruby Price (0 = N/A)</label>
                  <input className="ap-input" type="number" min="0"
                    value={form.rubyPrice} onChange={e=>setForm(f=>({...f,rubyPrice:+e.target.value}))} />
                </div>
              </div>

              <div style={{marginTop:10}}>
                <label className="ap-label">Description (optional)</label>
                <input className="ap-input" placeholder="Short description of this gift"
                  value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
              </div>

              {/* Rank Permission */}
              <div className="ap-fslabel" style={{marginTop:16}}>
                <i className="fa-solid fa-shield-halved" /> Rank Permission — Minimum rank to see &amp; send this gift
              </div>
              <div className="gift-rank-chips">
                {GIFT_RANK_LIST.map(r => (
                  <button key={r.id}
                    className={`gift-rank-chip ${form.minRank===r.id?'selected':''}`}
                    style={form.minRank===r.id
                      ? {border:`2px solid ${r.color}`,background:`${r.color}22`,color:r.color}
                      : {}}
                    onClick={()=>setForm(f=>({...f,minRank:r.id}))}>
                    <img src={`/icons/ranks/${RANK_ICONS[r.id]||r.id+'.svg'}`} alt=""
                      style={{width:14,height:14,objectFit:'contain'}}
                      onError={e=>{e.target.style.display='none';}} />
                    {r.label}
                  </button>
                ))}
              </div>
              {(() => {
                const r = GIFT_RANK_LIST.find(x=>x.id===form.minRank);
                return (
                  <div style={{fontSize:11,color:'#6b7280',marginTop:6,padding:'6px 10px',background:'#131624',borderRadius:7,display:'flex',alignItems:'center',gap:6}}>
                    <i className="fa-solid fa-circle-info" style={{color:'#3b82f6'}} />
                    Users below <strong style={{color:r?.color||'#aaa',marginLeft:3,marginRight:3}}>{r?.label||'Guest'}</strong> rank will not see this gift.
                  </div>
                );
              })()}

              {/* Flags */}
              <div style={{display:'flex',gap:20,marginTop:14,flexWrap:'wrap'}}>
                <label className="ap-checkbox">
                  <input type="checkbox" checked={form.isPremiumOnly}
                    onChange={e=>setForm(f=>({...f,isPremiumOnly:e.target.checked}))} />
                  <i className="fa-solid fa-star" style={{color:'#aa44ff',margin:'0 4px'}} />
                  Premium Only
                </label>
                <label className="ap-checkbox">
                  <input type="checkbox" checked={form.isActive}
                    onChange={e=>setForm(f=>({...f,isActive:e.target.checked}))} />
                  <i className="fa-solid fa-circle-check" style={{color:'#22c55e',margin:'0 4px'}} />
                  Active
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="ap-gift-modal-ftr">
              <button className="ap-btn ap-btn--ghost" onClick={()=>setModalOpen(false)}>Cancel</button>
              <button className="ap-btn ap-btn--primary" onClick={save} disabled={saving}>
                {saving
                  ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</>
                  : <><i className="fa-solid fa-floppy-disk" /> {editing?'Update Gift':'Create Gift'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && <Confirm msg={confirm.msg} onYes={()=>{confirm.cb();setConfirm(null);}} onNo={()=>setConfirm(null)} />}
    </div>
  );
}

// ── Badges ─────────────────────────────────────────────────────
function Badges() {
  const [badges, setBadges] = useState([]);
  const [form, setForm] = useState({ name: '', icon: '', description: '' });
  const [confirm, setConfirm] = useState(null);
  const load = useCallback(() => api('/badges').then(d => setBadges(d.badges)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    try { await api('/badges', { method: 'POST', body: JSON.stringify(form) }); toast('Badge created'); setForm({ name: '', icon: '', description: '' }); load(); }
    catch (e) { toast(e.message, 'error'); }
  };
  const del = async id => {
    try { await api(`/badges/${id}`, { method: 'DELETE' }); toast('Badge deleted'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-award" /> Badges</h2>
      <div className="ap-card">
        <div className="ap-form-grid">
          <input className="ap-input" placeholder="Badge Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className="ap-input" placeholder="Icon URL or emoji" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
          <input className="ap-input" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <button className="ap-btn ap-btn--primary" onClick={save}><i className="fa-solid fa-plus" /> Create</button>
      </div>
      <div className="ap-list">
        {badges.map(b => (
          <div key={b._id} className="ap-list-item">
            <div className="ap-list-info"><strong>{b.name}</strong><span className="ap-muted">{b.description}</span></div>
            <button className="ap-btn ap-btn--xs ap-btn--danger" onClick={() => setConfirm({ msg: `Delete badge ${b.name}?`, cb: () => del(b._id) })}><i className="fa-solid fa-trash" /></button>
          </div>
        ))}
      </div>
      {confirm && <Confirm msg={confirm.msg} onYes={() => { confirm.cb(); setConfirm(null); }} onNo={() => setConfirm(null)} />}
    </div>
  );
}

function WordFilters() {
  const [tab, setTab] = useState('word'); // 'word' | 'email' | 'username'

  // ── Word filter state ─────────────────────────────────────────
  const [filters, setFilters] = useState([]);
  const [word, setWord] = useState('');
  const [repl, setRepl] = useState('***');
  const [filterAction, setFilterAction] = useState('replace');
  const [duration, setDuration] = useState(0);
  const [editingFilter, setEditingFilter] = useState(null);
  const [editForm, setEditForm] = useState({});

  // ── Email filter state ────────────────────────────────────────
  const [emailFilters, setEmailFilters] = useState([]);
  const [emailPattern, setEmailPattern] = useState('');
  const [emailAction, setEmailAction] = useState('block');
  const [emailReason, setEmailReason] = useState('');

  // ── Username filter state ─────────────────────────────────────
  const [unameFilters, setUnameFilters] = useState([]);
  const [unamePattern, setUnamePattern] = useState('');
  const [unameAction, setUnameAction] = useState('block');
  const [unameReason, setUnameReason] = useState('');

  const [confirm, setConfirm] = useState(null);

  const loadWords  = useCallback(() => api('/filters').then(d => setFilters(d.filters)).catch(() => {}), []);
  const loadEmails = useCallback(() => api('/email-filters').then(d => setEmailFilters(d.filters)).catch(() => {}), []);
  const loadUnames = useCallback(() => api('/username-filters').then(d => setUnameFilters(d.filters)).catch(() => {}), []);

  useEffect(() => { loadWords(); loadEmails(); loadUnames(); }, [loadWords, loadEmails, loadUnames]);

  const addWord = async () => {
    if (!word.trim()) return;
    try {
      await api('/filters', { method: 'POST', body: JSON.stringify({ word, replacement: repl, action: filterAction, duration: +duration }) });
      toast('Filter added'); setWord(''); setRepl('***'); setFilterAction('replace'); setDuration(0); loadWords();
    } catch (e) { toast(e.message, 'error'); }
  };

  const saveWordEdit = async () => {
    try {
      await api(`/filters/${editingFilter}`, { method: 'PUT', body: JSON.stringify(editForm) });
      toast('Filter updated'); setEditingFilter(null); setEditForm({}); loadWords();
    } catch (e) { toast(e.message, 'error'); }
  };

  const delWord  = async id => { try { await api(`/filters/${id}`, { method: 'DELETE' }); toast('Filter removed'); loadWords(); } catch(e) { toast(e.message,'error'); } };
  const addEmail = async () => {
    if (!emailPattern.trim()) return;
    try { await api('/email-filters', { method:'POST', body: JSON.stringify({ pattern: emailPattern, action: emailAction, reason: emailReason }) }); toast('Email filter added'); setEmailPattern(''); setEmailReason(''); loadEmails(); }
    catch(e) { toast(e.message,'error'); }
  };
  const delEmail = async id => { try { await api(`/email-filters/${id}`, { method:'DELETE' }); toast('Email filter removed'); loadEmails(); } catch(e) { toast(e.message,'error'); } };
  const addUname = async () => {
    if (!unamePattern.trim()) return;
    try { await api('/username-filters', { method:'POST', body: JSON.stringify({ pattern: unamePattern, action: unameAction, reason: unameReason }) }); toast('Username filter added'); setUnamePattern(''); setUnameReason(''); loadUnames(); }
    catch(e) { toast(e.message,'error'); }
  };
  const delUname = async id => { try { await api(`/username-filters/${id}`, { method:'DELETE' }); toast('Username filter removed'); loadUnames(); } catch(e) { toast(e.message,'error'); } };

  const ACTION_COLORS = { replace:'#3b82f6', block:'#ef4444', warn:'#f59e0b', mute:'#8b5cf6', kick:'#f97316', ban:'#dc2626' };
  const ACTION_ICONS  = { replace:'fa-repeat', block:'fa-ban', warn:'fa-triangle-exclamation', mute:'fa-microphone-slash', kick:'fa-person-walking-arrow-right', ban:'fa-hammer' };

  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-filter" /> Filters
        <span className="ap-badge ap-badge--count">{filters.length + emailFilters.length + unameFilters.length}</span>
      </h2>

      {/* Tab switcher */}
      <div className="ap-tabs" style={{ marginBottom: 16 }}>
        {[
          { id:'word',     label:`Word Filters (${filters.length})`,     icon:'fa-comment-slash' },
          { id:'email',    label:`Email Filters (${emailFilters.length})`, icon:'fa-envelope-open' },
          { id:'username', label:`Username Filters (${unameFilters.length})`, icon:'fa-user-slash' },
        ].map(t => (
          <button key={t.id} className={`ap-tab-btn ${tab === t.id ? 'ap-tab-btn--active' : ''}`} onClick={() => setTab(t.id)}>
            <i className={`fa-solid ${t.icon}`} style={{ marginRight: 5 }} />{t.label}
          </button>
        ))}
      </div>

      {/* ── WORD FILTERS ───────────────────────────── */}
      {tab === 'word' && (<>
        <div className="ap-card">
          <h3 className="ap-card-title" style={{ marginBottom: 12 }}>Add Word Filter</h3>
          <div className="ap-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <div>
              <label className="ap-label">Word / Pattern</label>
              <input className="ap-input" placeholder="bad_word or /regex/" value={word} onChange={e => setWord(e.target.value)} onKeyDown={e => e.key==='Enter' && addWord()} />
            </div>
            <div>
              <label className="ap-label">Action</label>
              <select className="ap-select" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                <option value="replace">Replace</option>
                <option value="block">Block Message</option>
                <option value="warn">Warn User</option>
                <option value="mute">Auto-Mute</option>
                <option value="kick">Auto-Kick</option>
                <option value="ban">Auto-Ban</option>
              </select>
            </div>
            {filterAction === 'replace' && (
              <div>
                <label className="ap-label">Replace With</label>
                <input className="ap-input" placeholder="***" value={repl} onChange={e => setRepl(e.target.value)} />
              </div>
            )}
            {(filterAction === 'mute' || filterAction === 'ban') && (
              <div>
                <label className="ap-label">Duration (min, 0=perm)</label>
                <input className="ap-input" type="number" min="0" placeholder="0 = permanent" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
            )}
            {filterAction !== 'replace' && filterAction !== 'mute' && filterAction !== 'ban' && <div />}
            <div style={{ display:'flex', gap:6, alignItems:'flex-end' }}>
              <button className="ap-btn ap-btn--primary" onClick={addWord} style={{ whiteSpace:'nowrap' }}>
                <i className="fa-solid fa-plus" /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Filter list */}
        <div className="ap-list">
          {!filters.length && <div className="ap-empty">No word filters yet</div>}
          {filters.map(f => (
            <div key={f._id} className="ap-list-item" style={{ alignItems: 'flex-start' }}>
              {editingFilter === f._id ? (
                <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:8, alignItems:'end' }}>
                  <div>
                    <label className="ap-label">Word</label>
                    <input className="ap-input" value={editForm.word||''} onChange={e => setEditForm(p=>({...p, word:e.target.value}))} />
                  </div>
                  <div>
                    <label className="ap-label">Action</label>
                    <select className="ap-select" value={editForm.action||'replace'} onChange={e => setEditForm(p=>({...p, action:e.target.value}))}>
                      <option value="replace">Replace</option>
                      <option value="block">Block</option>
                      <option value="warn">Warn</option>
                      <option value="mute">Mute</option>
                      <option value="kick">Kick</option>
                      <option value="ban">Ban</option>
                    </select>
                  </div>
                  {(editForm.action==='replace') && <div><label className="ap-label">Replace With</label><input className="ap-input" value={editForm.replacement||''} onChange={e => setEditForm(p=>({...p, replacement:e.target.value}))} /></div>}
                  {(editForm.action==='mute'||editForm.action==='ban') && <div><label className="ap-label">Duration (min)</label><input className="ap-input" type="number" value={editForm.duration||0} onChange={e => setEditForm(p=>({...p, duration:+e.target.value}))} /></div>}
                  {editForm.action!=='replace' && editForm.action!=='mute' && editForm.action!=='ban' && <div/>}
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="ap-btn ap-btn--success ap-btn--sm" onClick={saveWordEdit}><i className="fa-solid fa-check" /></button>
                    <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => { setEditingFilter(null); setEditForm({}); }}><i className="fa-solid fa-xmark" /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="ap-list-info" style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <strong style={{ color:'#ef4444', fontFamily:'monospace', fontSize:14 }}>{f.word}</strong>
                      <span className="ap-badge" style={{ background: ACTION_COLORS[f.action]+'22', color: ACTION_COLORS[f.action], border:`1px solid ${ACTION_COLORS[f.action]}44`, fontSize:10 }}>
                        <i className={`fa-solid ${ACTION_ICONS[f.action]}`} style={{ marginRight:3 }} />{f.action?.toUpperCase()}
                      </span>
                      {f.action === 'replace' && <span className="ap-muted" style={{ fontSize:12 }}>→ <code style={{ background:'#1e2436', padding:'1px 5px', borderRadius:3 }}>{f.replacement}</code></span>}
                      {(f.action==='mute'||f.action==='ban') && f.duration > 0 && (
                        <span style={{ fontSize:11, color:'#f59e0b', display:'flex', alignItems:'center', gap:3 }}>
                          <i className="fa-solid fa-clock" /> {f.duration >= 60 ? `${Math.floor(f.duration/60)}h ${f.duration%60>0?f.duration%60+'m':''}` : `${f.duration}m`}
                        </span>
                      )}
                      {(f.action==='mute'||f.action==='ban') && (!f.duration || f.duration===0) && (
                        <span style={{ fontSize:11, color:'#ef4444' }}><i className="fa-solid fa-infinity" /> Permanent</span>
                      )}
                      {f.isRegex && <span style={{ fontSize:10, background:'#8b5cf622', color:'#8b5cf6', border:'1px solid #8b5cf644', borderRadius:4, padding:'1px 5px' }}>REGEX</span>}
                    </div>
                    <span className="ap-muted" style={{ fontSize:11 }}>{new Date(f.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="ap-btn ap-btn--xs ap-btn--ghost" onClick={() => { setEditingFilter(f._id); setEditForm({ word:f.word, action:f.action, replacement:f.replacement, duration:f.duration||0 }); }}>
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button className="ap-btn ap-btn--xs ap-btn--danger" onClick={() => setConfirm({ msg:`Remove filter "${f.word}"?`, cb: () => delWord(f._id) })}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </>)}

      {/* ── EMAIL FILTERS ──────────────────────────── */}
      {tab === 'email' && (<>
        <div className="ap-card">
          <h3 className="ap-card-title" style={{ marginBottom:12 }}>Block Email Patterns</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 140px 1fr auto', gap:8, alignItems:'end' }}>
            <div><label className="ap-label">Email / Domain Pattern</label><input className="ap-input" placeholder="@tempmail.com or user@spam.com" value={emailPattern} onChange={e => setEmailPattern(e.target.value)} /></div>
            <div><label className="ap-label">Action</label><select className="ap-select" value={emailAction} onChange={e => setEmailAction(e.target.value)}><option value="block">Block</option><option value="warn">Warn</option></select></div>
            <div><label className="ap-label">Reason (optional)</label><input className="ap-input" placeholder="Disposable email service" value={emailReason} onChange={e => setEmailReason(e.target.value)} /></div>
            <div style={{ paddingTop:20 }}><button className="ap-btn ap-btn--primary" onClick={addEmail}><i className="fa-solid fa-plus" /> Add</button></div>
          </div>
        </div>
        <div className="ap-list">
          {!emailFilters.length && <div className="ap-empty">No email filters</div>}
          {emailFilters.map(f => (
            <div key={f._id} className="ap-list-item">
              <div className="ap-list-info" style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <strong style={{ color:'#f59e0b', fontFamily:'monospace', fontSize:13 }}>{f.pattern}</strong>
                  <span className="ap-badge" style={{ background: f.action==='block'?'#ef444422':'#f59e0b22', color: f.action==='block'?'#ef4444':'#f59e0b', border:`1px solid ${f.action==='block'?'#ef444444':'#f59e0b44'}`, fontSize:10 }}>
                    {f.action?.toUpperCase()}
                  </span>
                  {f.isRegex && <span style={{ fontSize:10, background:'#8b5cf622', color:'#8b5cf6', border:'1px solid #8b5cf644', borderRadius:4, padding:'1px 5px' }}>REGEX</span>}
                  {f.reason && <span className="ap-muted" style={{ fontSize:11 }}>— {f.reason}</span>}
                </div>
                <span className="ap-muted" style={{ fontSize:11 }}>{new Date(f.createdAt).toLocaleString()}</span>
              </div>
              <button className="ap-btn ap-btn--xs ap-btn--danger" onClick={() => setConfirm({ msg:`Remove email filter "${f.pattern}"?`, cb: () => delEmail(f._id) })}><i className="fa-solid fa-trash" /></button>
            </div>
          ))}
        </div>
      </>)}

      {/* ── USERNAME FILTERS ───────────────────────── */}
      {tab === 'username' && (<>
        <div className="ap-card">
          <h3 className="ap-card-title" style={{ marginBottom:12 }}>Block Username Patterns</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 140px 1fr auto', gap:8, alignItems:'end' }}>
            <div><label className="ap-label">Username / Pattern</label><input className="ap-input" placeholder="admin, /^mod.*/i, etc." value={unamePattern} onChange={e => setUnamePattern(e.target.value)} /></div>
            <div><label className="ap-label">Action</label><select className="ap-select" value={unameAction} onChange={e => setUnameAction(e.target.value)}><option value="block">Block</option><option value="warn">Warn</option></select></div>
            <div><label className="ap-label">Reason (optional)</label><input className="ap-input" placeholder="Reserved name" value={unameReason} onChange={e => setUnameReason(e.target.value)} /></div>
            <div style={{ paddingTop:20 }}><button className="ap-btn ap-btn--primary" onClick={addUname}><i className="fa-solid fa-plus" /> Add</button></div>
          </div>
        </div>
        <div className="ap-list">
          {!unameFilters.length && <div className="ap-empty">No username filters</div>}
          {unameFilters.map(f => (
            <div key={f._id} className="ap-list-item">
              <div className="ap-list-info" style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <strong style={{ color:'#ec4899', fontFamily:'monospace', fontSize:13 }}>{f.pattern}</strong>
                  <span className="ap-badge" style={{ background: f.action==='block'?'#ef444422':'#f59e0b22', color: f.action==='block'?'#ef4444':'#f59e0b', border:`1px solid ${f.action==='block'?'#ef444444':'#f59e0b44'}`, fontSize:10 }}>
                    {f.action?.toUpperCase()}
                  </span>
                  {f.isRegex && <span style={{ fontSize:10, background:'#8b5cf622', color:'#8b5cf6', border:'1px solid #8b5cf644', borderRadius:4, padding:'1px 5px' }}>REGEX</span>}
                  {f.reason && <span className="ap-muted" style={{ fontSize:11 }}>— {f.reason}</span>}
                </div>
                <span className="ap-muted" style={{ fontSize:11 }}>{new Date(f.createdAt).toLocaleString()}</span>
              </div>
              <button className="ap-btn ap-btn--xs ap-btn--danger" onClick={() => setConfirm({ msg:`Remove username filter "${f.pattern}"?`, cb: () => delUname(f._id) })}><i className="fa-solid fa-trash" /></button>
            </div>
          ))}
        </div>
      </>)}

      {confirm && <Confirm msg={confirm.msg} onYes={() => { confirm.cb(); setConfirm(null); }} onNo={() => setConfirm(null)} />}
    </div>
  );
}

// ── Active Rooms ───────────────────────────────────────────────
function ActiveRooms({ socket }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const [selected, setSelected] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(() => {
    api('/active-rooms').then(d => { setRooms(d.rooms || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 10000); // auto-refresh every 10s
    return () => clearInterval(intervalRef.current);
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on('roomUpdated', refresh); socket.on('roomCreated', refresh); socket.on('roomDeleted', refresh);
    socket.on('roomUserCount', refresh); socket.on('userJoined', refresh); socket.on('userLeft', refresh);
    return () => { socket.off('roomUpdated', refresh); socket.off('roomCreated', refresh); socket.off('roomDeleted', refresh); socket.off('roomUserCount', refresh); socket.off('userJoined', refresh); socket.off('userLeft', refresh); };
  }, [socket, load]);

  const doRename = async (roomId) => {
    if (!renameVal.trim()) return;
    try {
      await api(`/rooms/${roomId}/rename`, { method: 'PATCH', body: JSON.stringify({ name: renameVal.trim() }) });
      toast('Room renamed!'); setRenaming(null); setRenameVal(''); load();
    } catch(e) { toast(e.message, 'error'); }
  };

  const totalUsers = rooms.reduce((s, r) => s + (r.currentUsers || 0), 0);

  return (
    <div className="ap-section">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:16 }}>
        <h2 className="ap-section-title" style={{ margin:0 }}>
          <i className="fa-solid fa-tower-broadcast" style={{ color:'#22c55e' }} /> Active Rooms
          <span className="ap-badge ap-badge--count" style={{ marginLeft:8 }}>{rooms.length}</span>
        </h2>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#22c55e' }}><i className="fa-solid fa-users" /> {totalUsers} online</span>
          <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={load}><i className="fa-solid fa-rotate" /> Refresh</button>
        </div>
      </div>

      {loading && <div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:12 }}>
        {rooms.map(r => (
          <div key={r._id} className="ap-card" style={{ padding:0, overflow:'hidden', cursor:'pointer', border: selected===r._id ? '1px solid #3b82f6' : '1px solid #1e2436' }} onClick={() => setSelected(selected===r._id ? null : r._id)}>
            {/* Room header */}
            <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10, background:'#0d1020', borderBottom:'1px solid #1e2436' }}>
              <img src={r.icon || '/default_images/rooms/default_room.png'} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:'cover', background:'#1e2436' }} onError={e => { e.target.src='/default_images/rooms/default_room.png'; }} />
              <div style={{ flex:1, minWidth:0 }}>
                {renaming === r._id ? (
                  <div style={{ display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
                    <input className="ap-input" style={{ fontSize:13, padding:'4px 8px', height:28 }} value={renameVal} onChange={e => setRenameVal(e.target.value)} onKeyDown={e => { if(e.key==='Enter') doRename(r._id); if(e.key==='Escape') { setRenaming(null); setRenameVal(''); } }} autoFocus />
                    <button className="ap-btn ap-btn--success ap-btn--xs" onClick={() => doRename(r._id)}><i className="fa-solid fa-check" /></button>
                    <button className="ap-btn ap-btn--ghost ap-btn--xs" onClick={() => { setRenaming(null); setRenameVal(''); }}><i className="fa-solid fa-xmark" /></button>
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontWeight:700, fontSize:14, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</span>
                    <button className="ap-btn ap-btn--xs ap-btn--ghost" style={{ padding:'1px 5px', fontSize:10 }}
                      onClick={e => { e.stopPropagation(); setRenaming(r._id); setRenameVal(r.name); }}>
                      <i className="fa-solid fa-pen" />
                    </button>
                  </div>
                )}
                <div style={{ fontSize:11, color:'#6b7280', marginTop:1 }}>{r.slug ? `/${r.slug}` : r._id}</div>
              </div>
              {/* Live user count badge */}
              <div style={{ textAlign:'center', minWidth:48 }}>
                <div style={{ fontSize:22, fontWeight:800, color: r.currentUsers > 0 ? '#22c55e' : '#374151', lineHeight:1 }}>{r.currentUsers || 0}</div>
                <div style={{ fontSize:9, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.5 }}>online</div>
              </div>
            </div>

            {/* Room meta */}
            <div style={{ padding:'8px 14px', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              {r.type && <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'#1e2436', color:'#6b7280', border:'1px solid #2a3249' }}>{r.type}</span>}
              {r.isPinned && <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'#f59e0b22', color:'#f59e0b' }}><i className="fa-solid fa-thumbtack" /> Pinned</span>}
              <span style={{ fontSize:10, color:'#6b7280', marginLeft:'auto' }}>{r.totalMessages || 0} msgs</span>
            </div>

            {/* Expanded: user list */}
            {selected === r._id && r.users && r.users.length > 0 && (
              <div style={{ borderTop:'1px solid #1e2436', padding:'8px 14px', maxHeight:200, overflowY:'auto' }}>
                <div style={{ fontSize:11, color:'#6b7280', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Users in room</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {r.users.map(u => (
                    <div key={u.userId} style={{ display:'flex', alignItems:'center', gap:5, background:'#0d1020', borderRadius:20, padding:'3px 10px 3px 4px', border:'1px solid #1e2436' }}>
                      <div style={{ width:18, height:18, borderRadius:'50%', background: rankColor(u.rank)+'22', border:`1px solid ${rankColor(u.rank)}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:rankColor(u.rank) }}>
                        {u.username?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize:11, color:rankColor(u.rank) }}>{u.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selected === r._id && (!r.users || r.users.length === 0) && (
              <div style={{ borderTop:'1px solid #1e2436', padding:'8px 14px' }}>
                <span style={{ fontSize:12, color:'#6b7280' }}>No users currently in this room</span>
              </div>
            )}
          </div>
        ))}
        {!loading && !rooms.length && <div className="ap-empty" style={{ gridColumn:'1/-1' }}>No active rooms found</div>}
      </div>
    </div>
  );
}

// ── Action Logs ────────────────────────────────────────────────
function ActionLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit:50, action: actionFilter, staff: staffSearch, target: targetSearch });
    api(`/action-logs?${p}`).then(d => { setLogs(d.logs||[]); setTotal(d.total||0); setPages(d.pages||1); }).catch(() => {}).finally(() => setLoading(false));
  }, [page, actionFilter, staffSearch, targetSearch]);

  useEffect(() => { load(); }, [load]);

  const clearAll = async () => {
    try { await api('/action-logs', { method:'DELETE' }); toast('Logs cleared'); load(); } catch(e) { toast(e.message,'error'); }
  };

  const ACTION_META = {
    ban:            { color:'#ef4444', icon:'fa-hammer',                    label:'Ban'           },
    unban:          { color:'#22c55e', icon:'fa-circle-check',              label:'Unban'         },
    mute:           { color:'#8b5cf6', icon:'fa-microphone-slash',          label:'Mute'          },
    unmute:         { color:'#22c55e', icon:'fa-microphone',                label:'Unmute'        },
    kick:           { color:'#f97316', icon:'fa-person-walking-arrow-right',label:'Kick'          },
    warn:           { color:'#f59e0b', icon:'fa-triangle-exclamation',      label:'Warn'          },
    ghost:          { color:'#6b7280', icon:'fa-ghost',                     label:'Ghost'         },
    unghost:        { color:'#22c55e', icon:'fa-ghost',                     label:'Unghost'       },
    rank_change:    { color:'#3b82f6', icon:'fa-star',                      label:'Rank Change'   },
    username_change:{ color:'#ec4899', icon:'fa-id-card',                   label:'Username Edit' },
    profile_edit:   { color:'#06b6d4', icon:'fa-pen-to-square',             label:'Profile Edit'  },
    replace:        { color:'#3b82f6', icon:'fa-repeat',                    label:'Replace'       },
    block:          { color:'#ef4444', icon:'fa-ban',                       label:'Block'         },
    ip_ban:         { color:'#dc2626', icon:'fa-shield-halved',             label:'IP Ban'        },
    ip_unban:       { color:'#22c55e', icon:'fa-shield',                    label:'IP Unban'      },
    room_kick:      { color:'#f97316', icon:'fa-door-open',                 label:'Room Kick'     },
    room_mute:      { color:'#8b5cf6', icon:'fa-volume-xmark',              label:'Room Mute'     },
    room_ban:       { color:'#ef4444', icon:'fa-door-closed',               label:'Room Ban'      },
    delete_message: { color:'#6b7280', icon:'fa-trash',                     label:'Del Message'   },
    clear_room:     { color:'#ef4444', icon:'fa-broom',                     label:'Clear Room'    },
  };

  const ALL_ACTIONS = Object.keys(ACTION_META);

  const formatDuration = (dur, unit) => {
    if (!dur || dur === 0) return 'Permanent';
    if (unit === 'permanent') return 'Permanent';
    if (dur >= 1440) return `${Math.floor(dur/1440)}d ${dur%1440>0?Math.floor((dur%1440)/60)+'h':''}`.trim();
    if (dur >= 60)   return `${Math.floor(dur/60)}h ${dur%60>0?dur%60+'m':''}`.trim();
    return `${dur}m`;
  };

  return (
    <div className="ap-section">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:16 }}>
        <h2 className="ap-section-title" style={{ margin:0 }}>
          <i className="fa-solid fa-shield-halved" style={{ color:'#f59e0b' }} /> Action Logs
          <span className="ap-badge ap-badge--count" style={{ marginLeft:8 }}>{total}</span>
        </h2>
        <button className="ap-btn ap-btn--danger ap-btn--sm" onClick={() => setConfirm({ msg:'Clear ALL action logs? This cannot be undone.', cb: clearAll })}>
          <i className="fa-solid fa-trash" /> Clear All
        </button>
      </div>

      {/* Filters */}
      <div className="ap-card" style={{ marginBottom:12, padding:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 200px', gap:8 }}>
          <div>
            <label className="ap-label">Staff Name</label>
            <input className="ap-input" placeholder="Search staff…" value={staffSearch} onChange={e => { setStaffSearch(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="ap-label">Target User</label>
            <input className="ap-input" placeholder="Search target…" value={targetSearch} onChange={e => { setTargetSearch(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="ap-label">Action Type</label>
            <select className="ap-select" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
              <option value="">All Actions</option>
              {ALL_ACTIONS.map(a => <option key={a} value={a}>{ACTION_META[a]?.label || a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div>}

      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {!loading && !logs.length && <div className="ap-empty">No action logs found</div>}
        {logs.map(l => {
          const meta = ACTION_META[l.action] || { color:'#6b7280', icon:'fa-circle-info', label: l.action };
          const hasDuration = (l.action==='mute'||l.action==='ban') && l.duration !== undefined;
          return (
            <div key={l._id} style={{ background:'#0d1020', border:`1px solid ${meta.color}22`, borderLeft:`3px solid ${meta.color}`, borderRadius:8, padding:'10px 14px', display:'flex', gap:12, alignItems:'flex-start' }}>
              {/* Action badge */}
              <div style={{ minWidth:28, height:28, borderRadius:6, background:meta.color+'22', display:'flex', alignItems:'center', justifyContent:'center', marginTop:1 }}>
                <i className={`fa-solid ${meta.icon}`} style={{ color:meta.color, fontSize:12 }} />
              </div>

              {/* Content */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                  {/* Action label */}
                  <span style={{ fontWeight:700, fontSize:12, color:meta.color, textTransform:'uppercase', letterSpacing:0.5 }}>
                    {meta.label}
                  </span>

                  {/* Duration badge */}
                  {hasDuration && (
                    <span style={{ fontSize:10, background:'#f59e0b22', color:'#f59e0b', border:'1px solid #f59e0b44', borderRadius:4, padding:'1px 6px', display:'flex', alignItems:'center', gap:3 }}>
                      <i className="fa-solid fa-clock" /> {formatDuration(l.duration, l.durationUnit)}
                    </span>
                  )}

                  {/* Room context */}
                  {l.roomName && (
                    <span style={{ fontSize:10, background:'#3b82f622', color:'#3b82f6', border:'1px solid #3b82f644', borderRadius:4, padding:'1px 6px' }}>
                      <i className="fa-solid fa-door-open" /> {l.roomName}
                    </span>
                  )}
                </div>

                {/* Staff → Target */}
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', fontSize:13 }}>
                  {/* Staff */}
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ width:16, height:16, borderRadius:'50%', background: rankColor(l.staffRank)+'22', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:8, color:rankColor(l.staffRank), fontWeight:700 }}>
                      {l.staffName?.[0]?.toUpperCase()}
                    </span>
                    <span style={{ fontWeight:600, color: rankColor(l.staffRank) }}>{l.staffName || '—'}</span>
                    <span className="ap-badge" style={{ fontSize:9, background: rankColor(l.staffRank)+'18', color: rankColor(l.staffRank), border:`1px solid ${rankColor(l.staffRank)}33` }}>{l.staffRank}</span>
                  </span>

                  {/* Arrow */}
                  {l.targetName && <i className="fa-solid fa-arrow-right" style={{ color:'#374151', fontSize:10 }} />}

                  {/* Target */}
                  {l.targetName && (
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <span style={{ width:16, height:16, borderRadius:'50%', background: rankColor(l.targetRank)+'22', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:8, color:rankColor(l.targetRank), fontWeight:700 }}>
                        {l.targetName?.[0]?.toUpperCase()}
                      </span>
                      <span style={{ fontWeight:600, color: rankColor(l.targetRank) }}>{l.targetName}</span>
                      {l.targetRank && <span className="ap-badge" style={{ fontSize:9, background: rankColor(l.targetRank)+'18', color: rankColor(l.targetRank), border:`1px solid ${rankColor(l.targetRank)}33` }}>{l.targetRank}</span>}
                    </span>
                  )}
                </div>

                {/* Reason */}
                {l.reason && <div style={{ fontSize:11, color:'#6b7280', marginTop:3, fontStyle:'italic' }}>"{l.reason}"</div>}

                {/* Extra data (rank change, room rename) */}
                {l.extra && l.extra.type === 'room_rename' && (
                  <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>
                    <span style={{ color:'#ef4444' }}>{l.extra.oldName}</span> <i className="fa-solid fa-arrow-right" style={{ fontSize:9 }} /> <span style={{ color:'#22c55e' }}>{l.extra.newName}</span>
                  </div>
                )}
                {l.action === 'rank_change' && l.extra?.newRank && (
                  <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>
                    New rank: <span style={{ color: rankColor(l.extra.newRank), fontWeight:600 }}>{l.extra.newRank}</span>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div style={{ fontSize:10, color:'#4b5563', whiteSpace:'nowrap', textAlign:'right', lineHeight:1.4 }}>
                <div>{new Date(l.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</div>
                <div style={{ marginTop:1 }}>{new Date(l.createdAt).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="ap-pagination">
          <button className="ap-btn ap-btn--xs ap-btn--ghost" disabled={page<=1} onClick={() => setPage(p=>p-1)}><i className="fa-solid fa-chevron-left" /></button>
          <span>Page {page} / {pages}</span>
          <button className="ap-btn ap-btn--xs ap-btn--ghost" disabled={page>=pages} onClick={() => setPage(p=>p+1)}><i className="fa-solid fa-chevron-right" /></button>
        </div>
      )}

      {confirm && <Confirm msg={confirm.msg} onYes={() => { confirm.cb(); setConfirm(null); }} onNo={() => setConfirm(null)} />}
    </div>
  );
}

// ── IP Bans ────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════
// MEMBERS TAB — Full CodyChat-style with search, rank, gender,
// action fields, and complete profile drawer
// ══════════════════════════════════════════════════════════════

function Members() {
  const [users, setUsers] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [pages, setPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [rankFilter, setRankFilter] = React.useState('');
  const [genderFilter, setGenderFilter] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('');
  const [selected, setSelected] = React.useState(null);
  const [confirm, setConfirm] = React.useState(null);
  const searchRef = React.useRef();

  const load = React.useCallback(() => {
    const p = new URLSearchParams({ page, limit: 30, search, rank: rankFilter, gender: genderFilter });
    if (actionFilter === 'banned') p.set('banned', 'true');
    else if (actionFilter === 'muted') p.set('muted', 'true');
    else if (actionFilter === 'ghosted') p.set('ghosted', 'true');
    api(`/users?${p}`).then(d => { setUsers(d.users); setTotal(d.total); setPages(d.pages); }).catch(() => {});
  }, [page, search, rankFilter, genderFilter, actionFilter]);

  React.useEffect(() => { load(); }, [load]);

  const action = async (url, method, body, msg) => {
    try {
      await api(url, { method, body: JSON.stringify(body) });
      toast(msg);
      load();
      if (selected) setSelected(s => ({ ...s, ...body }));
    } catch (e) { toast(e.message, 'error'); }
  };

  const genderIcon = g => {
    if (g === 'male') return 'fa-mars';
    if (g === 'female') return 'fa-venus';
    if (g === 'couple') return 'fa-heart';
    return 'fa-genderless';
  };
  const genderColor = g => {
    if (g === 'male') return '#4488FF';
    if (g === 'female') return '#FF4488';
    if (g === 'couple') return '#FF88CC';
    return '#888';
  };

  // ── PROFILE DRAWER ─────────────────────────────────────────
  const MemberProfile = ({ u, onClose }) => {
    const [tab, setTab] = React.useState('bio');
    const [editField, setEditField] = React.useState(null);
    const [editVal, setEditVal] = React.useState('');
    const [newRank, setNewRank] = React.useState(u.rank);
    const [newGender, setNewGender] = React.useState(u.gender || 'other');
    const [muteMin, setMuteMin] = React.useState(30);
    const [banReason, setBanReason] = React.useState('');
    const [ipDetails, setIpDetails] = React.useState(null);
    const [sameIpUsers, setSameIpUsers] = React.useState([]);
    const [oldNames, setOldNames] = React.useState([]);
    const [loadingIp, setLoadingIp] = React.useState(false);

    React.useEffect(() => {
      // Load same-IP accounts
      if (u.ipAddress) {
        api(`/users?ipAddress=${u.ipAddress}&limit=10`)
          .then(d => setSameIpUsers((d.users || []).filter(x => x._id !== u._id)))
          .catch(() => {});
      }
      // Load old usernames
      api(`/users/${u._id}/name-history`)
        .then(d => setOldNames(d.names || []))
        .catch(() => {});
    }, [u._id, u.ipAddress]);

    const doEdit = async (field, val, msg) => {
      await action(`/users/${u._id}/${field}`, 'PUT', { [field]: val }, msg);
      setEditField(null);
    };

    const fetchIpDetails = async () => {
      if (!u.ipAddress) return;
      setLoadingIp(true);
      try {
        const d = await api(`/users/${u._id}/ip-lookup`);
        setIpDetails(d);
      } catch { setIpDetails({ error: 'Could not fetch IP details' }); }
      finally { setLoadingIp(false); }
    };

    const TABS = [
      { id: 'bio',     label: 'Bio',     icon: 'fa-user' },
      { id: 'about',   label: 'About',   icon: 'fa-align-left' },
      { id: 'actions', label: 'Actions', icon: 'fa-bolt' },
      { id: 'edit',    label: 'Edit',    icon: 'fa-pen-to-square' },
      { id: 'lookup',  label: 'Lookup',  icon: 'fa-magnifying-glass' },
    ];

    return (
      <div className="ap-overlay" onClick={onClose}>
        <div className="mem-drawer" onClick={e => e.stopPropagation()}>

          {/* ── Cover / Header ── */}
          <div className="mem-cover" style={u.coverImage ? { backgroundImage: `url(${u.coverImage})` } : {}}>
            <div className="mem-cover-overlay" />
            <button className="ap-close-btn mem-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
          </div>

          {/* ── Avatar + Name strip ── */}
          <div className="mem-identity">
            <div className="mem-avatar-wrap">
              <img src={u.avatar || '/default_images/avatar/default_avatar.png'} className="mem-avatar" alt="" />
              <span className={`mem-online-dot ${u.isOnline ? 'mem-online-dot--on' : 'mem-online-dot--off'}`} title={u.isOnline ? 'Online' : 'Offline'} />
            </div>
            <div className="mem-namebox">
              <div className="mem-username" style={{ color: rankColor(u.rank) }}>
                {rankIcon(u.rank) && <img src={rankIcon(u.rank)} className="mem-rank-icon" alt="" onError={e => e.target.style.display='none'} />}
                {u.username}
              </div>
              {u.mood && <div className="mem-mood">"{u.mood}"</div>}
              <div className="mem-badges-row">
                <span className="mem-badge" style={{ background: rankColor(u.rank) + '22', color: rankColor(u.rank), border: `1px solid ${rankColor(u.rank)}44` }}>
                  {u.rank}
                </span>
                <span className="mem-badge" style={{ background: genderColor(u.gender) + '22', color: genderColor(u.gender) }}>
                  <i className={`fa-solid ${genderIcon(u.gender)}`} /> {u.gender || 'other'}
                </span>
                {u.isBanned && <span className="mem-badge mem-badge--danger"><i className="fa-solid fa-ban" /> Banned</span>}
                {u.isMuted  && <span className="mem-badge mem-badge--warn"><i className="fa-solid fa-microphone-slash" /> Muted</span>}
                {u.isGhosted && <span className="mem-badge mem-badge--ghost"><i className="fa-solid fa-ghost" /> Ghosted</span>}
              </div>
            </div>
          </div>

          {/* ── Tab Nav ── */}
          <div className="mem-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`mem-tab ${tab === t.id ? 'mem-tab--active' : ''}`} onClick={() => setTab(t.id)}>
                <i className={`fa-solid ${t.icon}`} /> {t.label}
              </button>
            ))}
          </div>

          <div className="mem-body">

            {/* ════ BIO TAB ════ */}
            {tab === 'bio' && (
              <div className="mem-section">
                {[
                  { icon: 'fa-envelope',      label: 'Email',       val: u.email },
                  { icon: 'fa-id-badge',       label: 'User ID',     val: u._id },
                  { icon: 'fa-venus-mars',     label: 'Gender',      val: u.gender || 'other', color: genderColor(u.gender) },
                  { icon: 'fa-cake-candles',   label: 'Age / DOB',   val: u.dob ? new Date(u.dob).toLocaleDateString() : '—' },
                  { icon: 'fa-globe',          label: 'Country',     val: u.country || '—' },
                  { icon: 'fa-language',       label: 'Language',    val: u.language || '—' },
                  { icon: 'fa-house',          label: 'Current Room',val: u.currentRoom || '—' },
                  { icon: 'fa-calendar-plus',  label: 'Joined',      val: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—' },
                  { icon: 'fa-clock-rotate-left', label: 'Last Seen',val: u.lastSeen ? new Date(u.lastSeen).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—' },
                ].map(row => (
                  <div className="mem-info-row" key={row.label}>
                    <span className="mem-info-label"><i className={`fa-solid ${row.icon}`} /> {row.label}</span>
                    <span className="mem-info-val" style={row.color ? { color: row.color } : {}}>{row.val}</span>
                  </div>
                ))}

                {/* Currency */}
                <div className="mem-divider">Currency &amp; XP</div>
                <div className="mem-grid4">
                  <div className="mem-stat-box"><i className="fa-solid fa-coins" style={{ color:'#f59e0b' }} /><strong>{u.gold ?? 0}</strong><span>Gold</span></div>
                  <div className="mem-stat-box"><i className="fa-solid fa-gem" style={{ color:'#e879f9' }} /><strong>{u.ruby ?? 0}</strong><span>Ruby</span></div>
                  <div className="mem-stat-box"><i className="fa-solid fa-star" style={{ color:'#3b82f6' }} /><strong>{u.xp ?? 0}</strong><span>XP</span></div>
                  <div className="mem-stat-box"><i className="fa-solid fa-trophy" style={{ color:'#22c55e' }} /><strong>{u.level ?? 1}</strong><span>Level</span></div>
                </div>

                {/* Verification */}
                <div className="mem-divider">Verification</div>
                <div className="mem-check-row">
                  <span className={`mem-check ${u.emailVerified ? 'mem-check--yes' : 'mem-check--no'}`}><i className={`fa-solid ${u.emailVerified ? 'fa-circle-check' : 'fa-circle-xmark'}`} /> Email Verified</span>
                  <span className={`mem-check ${u.isVerifiedAccount ? 'mem-check--yes' : 'mem-check--no'}`}><i className={`fa-solid ${u.isVerifiedAccount ? 'fa-circle-check' : 'fa-circle-xmark'}`} /> Verified Account</span>
                  <span className={`mem-check ${u.ageVerified ? 'mem-check--yes' : 'mem-check--no'}`}><i className={`fa-solid ${u.ageVerified ? 'fa-circle-check' : 'fa-circle-xmark'}`} /> Age Verified</span>
                </div>
              </div>
            )}

            {/* ════ ABOUT TAB ════ */}
            {tab === 'about' && (
              <div className="mem-section">
                <div className="mem-about-box">
                  {u.about ? <p style={{ lineHeight: 1.7, color: '#c1cde0' }}>{u.about}</p> : <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No about text.</p>}
                </div>

                <div className="mem-divider">Style Settings</div>
                {[
                  { icon: 'fa-palette',       label: 'Name Color',    val: u.nameColor || '—' },
                  { icon: 'fa-font',           label: 'Name Font',     val: u.nameFont  || 'Default' },
                  { icon: 'fa-comment',        label: 'Bubble Color',  val: u.bubbleColor || '—' },
                  { icon: 'fa-text-height',    label: 'Font Size',     val: u.msgFontSize ? `${u.msgFontSize}px` : '14px' },
                  { icon: 'fa-moon',           label: 'Chat Theme',    val: u.chatTheme || 'Dark' },
                  { icon: 'fa-lightbulb',      label: 'Name Glow',     val: u.nameGlow ? 'Enabled' : 'Disabled' },
                ].map(row => (
                  <div className="mem-info-row" key={row.label}>
                    <span className="mem-info-label"><i className={`fa-solid ${row.icon}`} /> {row.label}</span>
                    <span className="mem-info-val">{row.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ════ ACTIONS TAB ════ */}
            {tab === 'actions' && (
              <div className="mem-section">

                <div className="mem-divider">User Actions</div>
                <div className="mem-action-grid">
                  {/* MUTE */}
                  <div className="mem-action-card">
                    <div className="mem-action-title"><i className="fa-solid fa-microphone-slash" style={{ color:'#f59e0b' }} /> Mute</div>
                    <div className="mem-action-row">
                      <input className="ap-input ap-input--sm" type="number" placeholder="Minutes" value={muteMin} onChange={e => setMuteMin(e.target.value)} style={{ width: 80 }} />
                      {u.isMuted
                        ? <button className="ap-btn ap-btn--sm ap-btn--success" onClick={() => action(`/users/${u._id}/unmute`, 'PUT', { isMuted: false }, 'Unmuted ✓')}><i className="fa-solid fa-microphone" /> Unmute</button>
                        : <button className="ap-btn ap-btn--sm ap-btn--warning" onClick={() => action(`/users/${u._id}/mute`, 'PUT', { minutes: muteMin }, `Muted ${muteMin}min ✓`)}><i className="fa-solid fa-microphone-slash" /> Mute</button>
                      }
                    </div>
                  </div>

                  {/* KICK */}
                  <div className="mem-action-card">
                    <div className="mem-action-title"><i className="fa-solid fa-person-walking-arrow-right" style={{ color:'#f97316' }} /> Kick</div>
                    <button className="ap-btn ap-btn--sm ap-btn--warn" onClick={() => setConfirm({ msg: `Kick ${u.username}?`, cb: () => action(`/users/${u._id}/kick`, 'POST', { reason: 'Kicked by admin' }, 'Kicked ✓') })}>
                      <i className="fa-solid fa-person-walking-arrow-right" /> Kick User
                    </button>
                  </div>

                  {/* GHOST */}
                  <div className="mem-action-card">
                    <div className="mem-action-title"><i className="fa-solid fa-ghost" style={{ color:'#a78bfa' }} /> Ghost</div>
                    <button className={`ap-btn ap-btn--sm ${u.isGhosted ? 'ap-btn--success' : 'ap-btn--ghost'}`} onClick={() => action(`/users/${u._id}/ghost`, 'PUT', { isGhosted: !u.isGhosted }, u.isGhosted ? 'Unghosted ✓' : 'Ghosted ✓')}>
                      <i className={`fa-solid ${u.isGhosted ? 'fa-eye' : 'fa-ghost'}`} /> {u.isGhosted ? 'Unghost' : 'Ghost'}
                    </button>
                  </div>

                  {/* BAN */}
                  <div className="mem-action-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="mem-action-title"><i className="fa-solid fa-ban" style={{ color:'#ef4444' }} /> Ban / Unban</div>
                    <div className="mem-action-row">
                      <input className="ap-input" placeholder="Ban reason…" value={banReason} onChange={e => setBanReason(e.target.value)} />
                      {u.isBanned
                        ? <button className="ap-btn ap-btn--sm ap-btn--success" onClick={() => action(`/users/${u._id}/unban`, 'PUT', { isBanned: false }, 'Unbanned ✓')}><i className="fa-solid fa-circle-check" /> Unban</button>
                        : <button className="ap-btn ap-btn--sm ap-btn--danger" onClick={() => setConfirm({ msg: `Ban ${u.username}?`, cb: () => action(`/users/${u._id}/ban`, 'PUT', { reason: banReason || 'Rule violation' }, 'Banned ✓') })}><i className="fa-solid fa-ban" /> Ban</button>
                      }
                    </div>
                    {u.isBanned && u.banReason && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#ef4444' }}><i className="fa-solid fa-circle-info" /> Reason: {u.banReason}</div>
                    )}
                  </div>
                </div>

                <div className="mem-divider">Room Actions</div>
                <div className="mem-action-grid">
                  <div className="mem-action-card">
                    <div className="mem-action-title"><i className="fa-solid fa-volume-xmark" style={{ color:'#f59e0b' }} /> Room Mute</div>
                    <button className="ap-btn ap-btn--sm ap-btn--warning" onClick={() => action(`/users/${u._id}/room-mute`, 'POST', {}, 'Room muted ✓')}>
                      <i className="fa-solid fa-volume-xmark" /> Room Mute
                    </button>
                  </div>
                  <div className="mem-action-card">
                    <div className="mem-action-title"><i className="fa-solid fa-right-from-bracket" style={{ color:'#f97316' }} /> Room Kick</div>
                    <button className="ap-btn ap-btn--sm ap-btn--warn" onClick={() => action(`/users/${u._id}/room-kick`, 'POST', {}, 'Room kicked ✓')}>
                      <i className="fa-solid fa-right-from-bracket" /> Room Kick
                    </button>
                  </div>
                  <div className="mem-action-card">
                    <div className="mem-action-title"><i className="fa-solid fa-shield-halved" style={{ color:'#ef4444' }} /> Room Ban</div>
                    <button className="ap-btn ap-btn--sm ap-btn--danger" onClick={() => setConfirm({ msg: `Room ban ${u.username}?`, cb: () => action(`/users/${u._id}/room-ban`, 'POST', {}, 'Room banned ✓') })}>
                      <i className="fa-solid fa-shield-halved" /> Room Ban
                    </button>
                  </div>
                </div>

                <div className="mem-divider">Moderation Log</div>
                <div className="mem-info-row">
                  <span className="mem-info-label"><i className="fa-solid fa-triangle-exclamation" /> Warnings</span>
                  <span className="mem-info-val" style={{ color: u.warnings > 0 ? '#f59e0b' : '#22c55e' }}>{u.warnings ?? 0}</span>
                </div>
                {u.warningLog && u.warningLog.length > 0 && u.warningLog.slice(-3).map((w, i) => (
                  <div key={i} className="mem-warn-entry">
                    <i className="fa-solid fa-exclamation-circle" style={{ color:'#f59e0b' }} /> {w.reason || 'No reason'} <span style={{ color:'#6b7280', fontSize:11 }}>· {w.date ? new Date(w.date).toLocaleDateString() : ''}</span>
                  </div>
                ))}
                <button className="ap-btn ap-btn--sm ap-btn--ghost" style={{ marginTop: 8 }} onClick={() => action(`/users/${u._id}/warn`, 'POST', { message: 'Admin warning' }, 'Warning issued ✓')}>
                  <i className="fa-solid fa-triangle-exclamation" /> Issue Warning
                </button>
              </div>
            )}

            {/* ════ EDIT TAB ════ */}
            {tab === 'edit' && (
              <div className="mem-section">

                {/* Change Rank */}
                <div className="mem-edit-block">
                  <div className="mem-edit-label"><i className="fa-solid fa-star" /> Change Rank</div>
                  <div className="mem-action-row">
                    <select className="ap-select" value={newRank} onChange={e => setNewRank(e.target.value)}>
                      {RANKS.map(r => <option key={r} value={r} style={{ color: rankColor(r) }}>{r}</option>)}
                    </select>
                    <button className="ap-btn ap-btn--sm ap-btn--primary" onClick={() => action(`/users/${u._id}/rank`, 'PUT', { rank: newRank }, 'Rank updated ✓')}>
                      <i className="fa-solid fa-check" /> Set Rank
                    </button>
                  </div>
                </div>

                {/* Change Gender */}
                <div className="mem-edit-block">
                  <div className="mem-edit-label"><i className="fa-solid fa-venus-mars" /> Change Gender</div>
                  <div className="mem-action-row">
                    <select className="ap-select" value={newGender} onChange={e => setNewGender(e.target.value)}>
                      {['male','female','other','couple'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <button className="ap-btn ap-btn--sm ap-btn--primary" onClick={() => action(`/users/${u._id}/gender`, 'PUT', { gender: newGender }, 'Gender updated ✓')}>
                      <i className="fa-solid fa-check" /> Set
                    </button>
                  </div>
                </div>

                {/* Inline edit fields */}
                {[
                  { key: 'username',  icon: 'fa-user',        label: 'Username',    cur: u.username,       type: 'text',     api: 'username' },
                  { key: 'email',     icon: 'fa-envelope',    label: 'Email',       cur: u.email,          type: 'email',    api: 'email' },
                  { key: 'password',  icon: 'fa-key',         label: 'Password',    cur: '',               type: 'password', api: 'password', placeholder: 'New password…' },
                  { key: 'mood',      icon: 'fa-face-smile',  label: 'Mood/Status', cur: u.mood || '',     type: 'text',     api: 'mood' },
                  { key: 'about',     icon: 'fa-align-left',  label: 'About',       cur: u.about || '',    type: 'textarea', api: 'about' },
                ].map(f => (
                  <div className="mem-edit-block" key={f.key}>
                    <div className="mem-edit-label"><i className={`fa-solid ${f.icon}`} /> {f.label}</div>
                    {editField === f.key ? (
                      <div className="mem-action-row">
                        {f.type === 'textarea'
                          ? <textarea className="ap-textarea" rows={3} value={editVal} onChange={e => setEditVal(e.target.value)} style={{ flex:1 }} />
                          : <input className="ap-input" type={f.type} value={editVal} onChange={e => setEditVal(e.target.value)} style={{ flex:1 }} />
                        }
                        <button className="ap-btn ap-btn--sm ap-btn--success" onClick={() => doEdit(f.api, editVal, `${f.label} updated ✓`)}><i className="fa-solid fa-check" /></button>
                        <button className="ap-btn ap-btn--sm ap-btn--ghost" onClick={() => setEditField(null)}><i className="fa-solid fa-xmark" /></button>
                      </div>
                    ) : (
                      <div className="mem-action-row">
                        <span className="mem-edit-cur">{f.type === 'password' ? '••••••••' : (f.cur || <em style={{ color:'#6b7280' }}>empty</em>)}</span>
                        <button className="ap-btn ap-btn--xs ap-btn--ghost" onClick={() => { setEditField(f.key); setEditVal(f.cur); }}>
                          <i className="fa-solid fa-pen" /> Edit
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Avatar & Cover */}
                <div className="mem-divider">Media</div>
                <div className="mem-action-grid">
                  <div className="mem-action-card">
                    <div className="mem-action-title"><i className="fa-solid fa-camera" /> Avatar</div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                      <img src={u.avatar || '/default_images/avatar/default_avatar.png'} style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', border:'2px solid #1e2436' }} alt="" />
                      <button className="ap-btn ap-btn--xs ap-btn--danger" onClick={() => setConfirm({ msg: `Remove avatar of ${u.username}?`, cb: () => action(`/users/${u._id}/avatar`, 'DELETE', {}, 'Avatar removed ✓') })}>
                        <i className="fa-solid fa-trash" /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="mem-action-card">
                    <div className="mem-action-title"><i className="fa-solid fa-image" /> Cover / BG</div>
                    <button className="ap-btn ap-btn--xs ap-btn--danger" onClick={() => setConfirm({ msg: `Remove cover of ${u.username}?`, cb: () => action(`/users/${u._id}/cover`, 'DELETE', {}, 'Cover removed ✓') })}>
                      <i className="fa-solid fa-trash" /> Remove Cover
                    </button>
                  </div>
                </div>

                {/* Gold management */}
                <div className="mem-divider">Gold / Currency</div>
                <div className="mem-edit-block">
                  <div className="mem-edit-label"><i className="fa-solid fa-coins" /> Gold (Current: {u.gold ?? 0})</div>
                  <div className="mem-action-row">
                    <input className="ap-input" type="number" placeholder="Amount" id={`gold-amt-${u._id}`} style={{ width:100 }} />
                    <button className="ap-btn ap-btn--sm ap-btn--success" onClick={() => {
                      const amt = document.getElementById(`gold-amt-${u._id}`)?.value;
                      action(`/users/${u._id}/gold`, 'PUT', { amount: amt, action: 'add' }, 'Gold added ✓');
                    }}><i className="fa-solid fa-plus" /> Add</button>
                    <button className="ap-btn ap-btn--sm ap-btn--danger" onClick={() => {
                      const amt = document.getElementById(`gold-amt-${u._id}`)?.value;
                      action(`/users/${u._id}/gold`, 'PUT', { amount: amt, action: 'remove' }, 'Gold removed ✓');
                    }}><i className="fa-solid fa-minus" /> Remove</button>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="mem-divider" style={{ color:'#ef4444', borderColor:'#ef444433' }}>Danger Zone</div>
                <button className="ap-btn ap-btn--danger" style={{ width:'100%' }} onClick={() => setConfirm({ msg: `Permanently delete ${u.username}? This cannot be undone!`, cb: () => { action(`/users/${u._id}`, 'DELETE', {}, 'Account deleted'); onClose(); } })}>
                  <i className="fa-solid fa-trash" /> Delete Account
                </button>
              </div>
            )}

            {/* ════ LOOKUP TAB ════ */}
            {tab === 'lookup' && (
              <div className="mem-section">
                <div className="mem-divider">IP Address</div>
                <div className="mem-action-row" style={{ marginBottom: 8 }}>
                  <span className="mem-ip-tag"><i className="fa-solid fa-network-wired" /> {u.ipAddress || 'Unknown'}</span>
                  <button className="ap-btn ap-btn--sm ap-btn--ghost" onClick={fetchIpDetails} disabled={loadingIp}>
                    {loadingIp ? <><i className="fa-solid fa-spinner fa-spin" /> Scanning…</> : <><i className="fa-solid fa-magnifying-glass" /> Scan IP</>}
                  </button>
                </div>
                {ipDetails && (
                  <div className="mem-ip-card">
                    {ipDetails.error
                      ? <span style={{ color:'#ef4444' }}>{ipDetails.error}</span>
                      : [
                          ['Country', ipDetails.country || ipDetails.country_name],
                          ['City', ipDetails.city],
                          ['Region', ipDetails.region || ipDetails.regionName],
                          ['ISP', ipDetails.isp || ipDetails.org],
                          ['Timezone', ipDetails.timezone],
                          ['Proxy', ipDetails.proxy ? 'Yes' : 'No'],
                        ].filter(([, v]) => v).map(([k, v]) => (
                          <div className="mem-info-row" key={k}>
                            <span className="mem-info-label">{k}</span>
                            <span className="mem-info-val">{v}</span>
                          </div>
                        ))
                    }
                  </div>
                )}

                <div className="mem-divider">Other Accounts — Same IP</div>
                {sameIpUsers.length === 0
                  ? <div className="ap-empty" style={{ padding:'12px 0' }}><i className="fa-solid fa-circle-check" style={{ color:'#22c55e' }} /> No other accounts found</div>
                  : sameIpUsers.map(su => (
                    <div key={su._id} className="mem-same-ip-row" onClick={() => setSelected(su)}>
                      <img src={su.avatar || '/default_images/avatar/default_avatar.png'} className="mem-mini-av" alt="" />
                      <span style={{ color: rankColor(su.rank), fontWeight:600 }}>{su.username}</span>
                      <span className="mem-badge" style={{ color: rankColor(su.rank), borderColor: rankColor(su.rank)+'44' }}>{su.rank}</span>
                      {su.isBanned && <span className="mem-badge mem-badge--danger">Banned</span>}
                      <span className={`ap-status-dot ap-status-dot--${su.isOnline ? 'online' : 'offline'}`} style={{ marginLeft:'auto' }} />
                    </div>
                  ))
                }

                <div className="mem-divider">Old Usernames</div>
                {oldNames.length === 0
                  ? <div className="ap-empty" style={{ padding:'12px 0' }}><i className="fa-solid fa-user" style={{ color:'#6b7280' }} /> No name history</div>
                  : oldNames.map((n, i) => (
                    <div key={i} className="mem-oldname-pill"><i className="fa-solid fa-clock-rotate-left" style={{ color:'#6b7280', fontSize:11 }} /> {n}</div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── TABLE ──────────────────────────────────────────────────
  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-users" /> Members <span className="ap-badge ap-badge--count">{total}</span></h2>

      {/* Filter Bar */}
      <div className="ap-filter-bar">
        <div className="mem-search-wrap">
          <i className="fa-solid fa-magnifying-glass mem-search-icon" />
          <input
            ref={searchRef}
            className="ap-input"
            placeholder="Search username / email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 32 }}
          />
          {search && (
            <button className="mem-search-clear" onClick={() => { setSearch(''); setPage(1); }}>
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        <select className="ap-select" value={rankFilter} onChange={e => { setRankFilter(e.target.value); setPage(1); }}>
          <option value="">All Ranks</option>
          {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select className="ap-select" value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setPage(1); }}>
          <option value="">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="couple">Couple</option>
        </select>

        <select className="ap-select" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="banned">Banned</option>
          <option value="muted">Muted</option>
          <option value="ghosted">Ghosted</option>
        </select>

        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={load}><i className="fa-solid fa-rotate" /></button>
      </div>

      {/* Table */}
      <div className="ap-table-wrap">
        <table className="ap-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Rank</th>
              <th>Gender</th>
              <th>Status</th>
              <th>Action</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className={u.isBanned ? 'ap-row--banned' : ''}>
                <td>
                  <div className="ap-user-cell">
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <img src={u.avatar || '/default_images/avatar/default_avatar.png'} className="ap-table-avatar" alt="" />
                      <span className={`mem-tbl-dot ${u.isOnline ? 'mem-tbl-dot--on' : 'mem-tbl-dot--off'}`} />
                    </div>
                    <div>
                      <div className="ap-user-cell-name" style={{ color: rankColor(u.rank) }}>
                        {rankIcon(u.rank) && <img src={rankIcon(u.rank)} style={{ width:13, height:13, objectFit:'contain', marginRight:4, verticalAlign:'middle' }} alt="" onError={e => e.target.style.display='none'} />}
                        {u.username}
                      </div>
                      <div className="ap-user-cell-email">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="ap-rank-tag" style={{ color: rankColor(u.rank), borderColor: rankColor(u.rank) + '44' }}>{u.rank}</span>
                </td>
                <td>
                  <span style={{ color: genderColor(u.gender), fontSize: 13 }}>
                    <i className={`fa-solid ${genderIcon(u.gender)}`} /> {u.gender || '—'}
                  </span>
                </td>
                <td>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
                    <span className={`ap-status-dot ap-status-dot--${u.isOnline ? 'online' : 'offline'}`} title={u.isOnline ? 'Online' : 'Offline'} />
                    {u.isBanned  && <span className="ap-badge ap-badge--danger"><i className="fa-solid fa-ban" /></span>}
                    {u.isMuted   && <span className="ap-badge ap-badge--warn"><i className="fa-solid fa-microphone-slash" /></span>}
                    {u.isGhosted && <span className="mem-badge mem-badge--ghost" style={{ fontSize:10 }}><i className="fa-solid fa-ghost" /></span>}
                  </div>
                </td>
                <td>
                  <div style={{ display:'flex', gap:4 }}>
                    <button className="ap-btn ap-btn--xs ap-btn--warning" title="Mute" onClick={() => action(`/users/${u._id}/mute`, 'PUT', { minutes: 30 }, 'Muted 30min ✓')}>
                      <i className="fa-solid fa-microphone-slash" />
                    </button>
                    <button className="ap-btn ap-btn--xs ap-btn--warn" title="Kick" onClick={() => action(`/users/${u._id}/kick`, 'POST', { reason: 'Kicked' }, 'Kicked ✓')}>
                      <i className="fa-solid fa-person-walking-arrow-right" />
                    </button>
                    <button className="ap-btn ap-btn--xs ap-btn--ghost" title={u.isGhosted ? 'Unghost' : 'Ghost'} onClick={() => action(`/users/${u._id}/ghost`, 'PUT', { isGhosted: !u.isGhosted }, u.isGhosted ? 'Unghosted ✓' : 'Ghosted ✓')}>
                      <i className="fa-solid fa-ghost" />
                    </button>
                    {u.isBanned
                      ? <button className="ap-btn ap-btn--xs ap-btn--success" title="Unban" onClick={() => action(`/users/${u._id}/unban`, 'PUT', { isBanned: false }, 'Unbanned ✓')}>
                          <i className="fa-solid fa-circle-check" />
                        </button>
                      : <button className="ap-btn ap-btn--xs ap-btn--danger" title="Ban" onClick={() => setConfirm({ msg: `Ban ${u.username}?`, cb: () => action(`/users/${u._id}/ban`, 'PUT', { reason: 'Rule violation' }, 'Banned ✓') })}>
                          <i className="fa-solid fa-ban" />
                        </button>
                    }
                  </div>
                </td>
                <td>
                  <button className="ap-btn ap-btn--xs ap-btn--primary" onClick={() => setSelected(u)} title="Full Profile">
                    <i className="fa-solid fa-id-card" />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:24, color:'#4b5563' }}>No members found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="ap-pagination">
        <button className="ap-btn ap-btn--xs ap-btn--ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><i className="fa-solid fa-chevron-left" /></button>
        <span>Page {page} / {pages} &nbsp;·&nbsp; {total} members</span>
        <button className="ap-btn ap-btn--xs ap-btn--ghost" disabled={page >= pages} onClick={() => setPage(p => p + 1)}><i className="fa-solid fa-chevron-right" /></button>
      </div>

      {selected && <MemberProfile u={selected} onClose={() => setSelected(null)} />}
      {confirm && <Confirm msg={confirm.msg} onYes={() => { confirm.cb(); setConfirm(null); }} onNo={() => setConfirm(null)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// IP BANS — with full banned user profile cards
// ══════════════════════════════════════════════════════════════
function IpBans() {
  const [bans, setBans] = React.useState([]);
  const [ip, setIp] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [expandedBan, setExpandedBan] = React.useState(null);
  const [confirm, setConfirm] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const d = await api('/ip-bans');
      // Enrich with user details for each ban
      const enriched = await Promise.all((d.bans || []).map(async ban => {
        try {
          const ud = await api(`/users?ipAddress=${ban.ip}&limit=5`);
          return { ...ban, accounts: ud.users || [] };
        } catch {
          return { ...ban, accounts: [] };
        }
      }));
      setBans(enriched);
    } catch { toast('Failed to load IP bans', 'error'); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!ip.trim()) return;
    try { await api('/ip-bans', { method: 'POST', body: JSON.stringify({ ip, reason }) }); toast('IP banned ✓'); setIp(''); setReason(''); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const del = async id => {
    try { await api(`/ip-bans/${id}`, { method: 'DELETE' }); toast('IP ban removed ✓'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const filtered = bans.filter(b =>
    !search.trim() ||
    b.ip.includes(search) ||
    (b.reason || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.accounts || []).some(u => u.username?.toLowerCase().includes(search.toLowerCase()))
  );

  const genderIcon = g => g === 'male' ? 'fa-mars' : g === 'female' ? 'fa-venus' : g === 'couple' ? 'fa-heart' : 'fa-genderless';
  const genderColor = g => g === 'male' ? '#4488FF' : g === 'female' ? '#FF4488' : g === 'couple' ? '#FF88CC' : '#888';

  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-shield-halved" /> IP Bans <span className="ap-badge ap-badge--danger ap-badge--count">{bans.length}</span></h2>

      {/* Add Ban Form */}
      <div className="ap-card">
        <h3 className="ap-card-title"><i className="fa-solid fa-plus" /> Ban New IP</h3>
        <div className="ap-row" style={{ flexWrap:'wrap' }}>
          <input className="ap-input" placeholder="IP Address (e.g. 192.168.1.1)" value={ip} onChange={e => setIp(e.target.value)} style={{ flex: '1 1 180px' }} />
          <input className="ap-input" placeholder="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} style={{ flex: '2 1 200px' }} />
          <button className="ap-btn ap-btn--danger" onClick={add}><i className="fa-solid fa-shield-halved" /> Ban IP</button>
        </div>
      </div>

      {/* Search */}
      <div className="mem-search-wrap" style={{ marginBottom: 12 }}>
        <i className="fa-solid fa-magnifying-glass mem-search-icon" />
        <input className="ap-input" placeholder="Search IP, reason, or username…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
        {search && <button className="mem-search-clear" onClick={() => setSearch('')}><i className="fa-solid fa-xmark" /></button>}
      </div>

      {loading ? (
        <div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="ap-empty"><i className="fa-solid fa-circle-check" style={{ color:'#22c55e', marginRight:8 }} />No IP bans{search ? ' matching search' : ''}</div>
      ) : (
        <div className="ipban-list">
          {filtered.map(b => (
            <div key={b._id} className={`ipban-card ${expandedBan === b._id ? 'ipban-card--open' : ''}`}>

              {/* Header row */}
              <div className="ipban-header" onClick={() => setExpandedBan(p => p === b._id ? null : b._id)}>
                <div className="ipban-ip-badge">
                  <i className="fa-solid fa-network-wired" />
                  <strong>{b.ip}</strong>
                </div>

                <div className="ipban-meta">
                  {b.reason && <span className="ipban-reason"><i className="fa-solid fa-circle-info" /> {b.reason}</span>}
                  <span className="ipban-date"><i className="fa-regular fa-clock" /> {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</span>
                  {b.accounts?.length > 0 && (
                    <span className="ipban-acct-count"><i className="fa-solid fa-users" /> {b.accounts.length} account{b.accounts.length !== 1 ? 's' : ''}</span>
                  )}
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
                  <button className="ap-btn ap-btn--xs ap-btn--danger" onClick={e => { e.stopPropagation(); setConfirm({ msg: `Unban IP ${b.ip}?`, cb: () => del(b._id) }); }}>
                    <i className="fa-solid fa-trash" /> Remove
                  </button>
                  <i className={`fa-solid fa-chevron-${expandedBan === b._id ? 'up' : 'down'}`} style={{ color:'#6b7280', fontSize:12 }} />
                </div>
              </div>

              {/* Expanded — Linked accounts with full profile */}
              {expandedBan === b._id && (
                <div className="ipban-body">
                  <div className="ipban-section-title"><i className="fa-solid fa-users" /> Accounts Linked to This IP</div>

                  {b.accounts?.length === 0 ? (
                    <div className="ap-empty" style={{ padding:'12px 0' }}><i className="fa-solid fa-user-slash" style={{ color:'#6b7280' }} /> No registered accounts found for this IP</div>
                  ) : (
                    b.accounts.map(u => (
                      <div key={u._id} className="ipban-user-card">
                        {/* User Header */}
                        <div className="ipban-user-header">
                          <div style={{ position:'relative', flexShrink:0 }}>
                            <img src={u.avatar || '/default_images/avatar/default_avatar.png'} className="ipban-avatar" alt="" />
                            <span className={`mem-tbl-dot ${u.isOnline ? 'mem-tbl-dot--on' : 'mem-tbl-dot--off'}`} />
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div className="ipban-uname" style={{ color: rankColor(u.rank) }}>
                              {rankIcon(u.rank) && <img src={rankIcon(u.rank)} style={{ width:14, height:14, objectFit:'contain', marginRight:4, verticalAlign:'middle' }} alt="" onError={e => e.target.style.display='none'} />}
                              {u.username}
                            </div>
                            <div style={{ fontSize:11, color:'#6b7280', marginTop:1 }}>{u.email}</div>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                            <div style={{ display:'flex', gap:4 }}>
                              <span className="ap-rank-tag" style={{ color: rankColor(u.rank), borderColor: rankColor(u.rank)+'44', fontSize:10 }}>{u.rank}</span>
                              <span style={{ fontSize:11, color: genderColor(u.gender) }}><i className={`fa-solid ${genderIcon(u.gender)}`} /></span>
                            </div>
                            <div style={{ display:'flex', gap:3 }}>
                              {u.isBanned  && <span className="mem-badge mem-badge--danger" style={{ fontSize:9 }}><i className="fa-solid fa-ban" /> Banned</span>}
                              {u.isMuted   && <span className="mem-badge mem-badge--warn" style={{ fontSize:9 }}><i className="fa-solid fa-microphone-slash" /> Muted</span>}
                              {u.isGhosted && <span className="mem-badge mem-badge--ghost" style={{ fontSize:9 }}><i className="fa-solid fa-ghost" /> Ghosted</span>}
                            </div>
                          </div>
                        </div>

                        {/* Profile Details Grid */}
                        <div className="ipban-detail-grid">
                          <div className="ipban-detail-item"><i className="fa-solid fa-id-badge" /><span>ID</span><strong style={{ fontSize:10, wordBreak:'break-all' }}>{u._id}</strong></div>
                          <div className="ipban-detail-item"><i className="fa-solid fa-coins" style={{ color:'#f59e0b' }} /><span>Gold</span><strong>{u.gold ?? 0}</strong></div>
                          <div className="ipban-detail-item"><i className="fa-solid fa-gem" style={{ color:'#e879f9' }} /><span>Ruby</span><strong>{u.ruby ?? 0}</strong></div>
                          <div className="ipban-detail-item"><i className="fa-solid fa-trophy" style={{ color:'#22c55e' }} /><span>Level</span><strong>{u.level ?? 1}</strong></div>
                          <div className="ipban-detail-item"><i className="fa-solid fa-globe" /><span>Country</span><strong>{u.country || '—'}</strong></div>
                          <div className="ipban-detail-item"><i className="fa-solid fa-calendar-plus" /><span>Joined</span><strong>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</strong></div>
                          <div className="ipban-detail-item"><i className="fa-solid fa-clock-rotate-left" /><span>Last Seen</span><strong>{u.lastSeen ? new Date(u.lastSeen).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</strong></div>
                          <div className="ipban-detail-item"><i className="fa-solid fa-triangle-exclamation" style={{ color:'#f59e0b' }} /><span>Warnings</span><strong style={{ color: u.warnings > 0 ? '#f59e0b' : '#22c55e' }}>{u.warnings ?? 0}</strong></div>
                          <div className="ipban-detail-item"><i className="fa-solid fa-circle-check" style={{ color: u.emailVerified ? '#22c55e' : '#ef4444' }} /><span>Email Verified</span><strong style={{ color: u.emailVerified ? '#22c55e' : '#ef4444' }}>{u.emailVerified ? 'Yes' : 'No'}</strong></div>
                          <div className="ipban-detail-item"><i className="fa-solid fa-star" style={{ color:'#3b82f6' }} /><span>XP</span><strong>{u.xp ?? 0}</strong></div>
                        </div>

                        {/* About / Mood */}
                        {(u.about || u.mood) && (
                          <div className="ipban-about-row">
                            {u.mood && <span className="ipban-mood"><i className="fa-solid fa-face-smile" /> {u.mood}</span>}
                            {u.about && <span className="ipban-about"><i className="fa-solid fa-align-left" /> {u.about.slice(0, 80)}{u.about.length > 80 ? '…' : ''}</span>}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {confirm && <Confirm msg={confirm.msg} onYes={() => { confirm.cb(); setConfirm(null); }} onNo={() => setConfirm(null)} />}
    </div>
  );
}

  useEffect(() => { load(); }, [load]);
  const post = async () => {
    if (!title.trim() || !content.trim()) return;
    try { await api('/news', { method: 'POST', body: JSON.stringify({ title, content }) }); toast('News posted'); setTitle(''); setContent(''); load(); }
    catch (e) { toast(e.message, 'error'); }
  };
  const del = async id => {
    try { await api(`/news/${id}`, { method: 'DELETE' }); toast('Deleted'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-newspaper" /> News</h2>
      <div className="ap-card">
        <input className="ap-input" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="ap-textarea" placeholder="Content…" value={content} onChange={e => setContent(e.target.value)} rows={4} />
        <button className="ap-btn ap-btn--primary" onClick={post}><i className="fa-solid fa-paper-plane" /> Post</button>
      </div>
      <div className="ap-list">
        {news.map(n => (
          <div key={n._id} className="ap-list-item">
            <div className="ap-list-info"><strong>{n.title}</strong><span className="ap-muted">{n.author?.username} · {new Date(n.createdAt).toLocaleDateString()}</span></div>
            <button className="ap-btn ap-btn--xs ap-btn--danger" onClick={() => setConfirm({ msg: `Delete "${n.title}"?`, cb: () => del(n._id) })}><i className="fa-solid fa-trash" /></button>
          </div>
        ))}
        {!news.length && <div className="ap-empty">No news posted</div>}
      </div>
      {confirm && <Confirm msg={confirm.msg} onYes={() => { confirm.cb(); setConfirm(null); }} onNo={() => setConfirm(null)} />}
    </div>
  );
}

// ── Broadcast ──────────────────────────────────────────────────
function Broadcast() {
  const [msg, setMsg] = useState('');
  const [type, setType] = useState('info');
  const send = async () => {
    if (!msg.trim()) return;
    try { await api('/broadcast', { method: 'POST', body: JSON.stringify({ message: msg, type }) }); toast('Broadcast sent!'); setMsg(''); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-bullhorn" /> Broadcast</h2>
      <div className="ap-card">
        <textarea className="ap-textarea" placeholder="Message to broadcast to all users…" value={msg} onChange={e => setMsg(e.target.value)} rows={4} />
        <div className="ap-row">
          <select className="ap-select" value={type} onChange={e => setType(e.target.value)}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
            <option value="danger">Danger</option>
          </select>
          <button className="ap-btn ap-btn--primary" onClick={send}><i className="fa-solid fa-paper-plane" /> Send Broadcast</button>
        </div>
      </div>

      <div className="ap-card" style={{ marginTop: 16 }}>
        <h3 className="ap-card-title">System Actions</h3>
        <div className="ap-action-row">
          <button className="ap-btn ap-btn--warn" onClick={() => api('/system/reload', { method: 'POST', body: JSON.stringify({ reason: 'Admin triggered reload' }) }).then(() => toast('Reload sent')).catch(e => toast(e.message, 'error'))}>
            <i className="fa-solid fa-rotate" /> Force Reload All
          </button>
          <button className="ap-btn ap-btn--ghost" onClick={() => api('/system/announce', { method: 'POST', body: JSON.stringify({ message: 'Site maintenance in 5 minutes.', level: 'warning' }) }).then(() => toast('Announcement sent')).catch(e => toast(e.message, 'error'))}>
            <i className="fa-solid fa-triangle-exclamation" /> Maintenance Announce
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Staff Notes ────────────────────────────────────────────────
function StaffNotes() {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [confirm, setConfirm] = useState(null);
  const load = useCallback(() => api('/notes').then(d => setNotes(d.notes)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const add = async () => {
    if (!content.trim()) return;
    try { await api('/notes', { method: 'POST', body: JSON.stringify({ content, category }) }); toast('Note saved'); setContent(''); load(); }
    catch (e) { toast(e.message, 'error'); }
  };
  const del = async id => {
    try { await api(`/notes/${id}`, { method: 'DELETE' }); toast('Deleted'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const CAT_COLORS = { general: '#3b82f6', warning: '#f59e0b', important: '#ef4444', info: '#06b6d4' };

  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-sticky-note" /> Staff Notes</h2>
      <div className="ap-card">
        <textarea className="ap-textarea" placeholder="Write a note for the team…" value={content} onChange={e => setContent(e.target.value)} rows={3} />
        <div className="ap-row">
          <select className="ap-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="general">General</option>
            <option value="warning">Warning</option>
            <option value="important">Important</option>
            <option value="info">Info</option>
          </select>
          <button className="ap-btn ap-btn--primary" onClick={add}><i className="fa-solid fa-plus" /> Add</button>
        </div>
      </div>
      <div className="ap-list">
        {notes.map(n => (
          <div key={n._id} className="ap-list-item" style={{ borderLeft: `3px solid ${CAT_COLORS[n.category] || '#3b82f6'}` }}>
            <div className="ap-list-info">
              <span className="ap-badge" style={{ background: CAT_COLORS[n.category] + '33', color: CAT_COLORS[n.category], border: `1px solid ${CAT_COLORS[n.category]}44` }}>{n.category}</span>
              <p style={{ margin: '4px 0', fontSize: 14 }}>{n.content}</p>
              <span className="ap-muted">{n.author?.username} · {new Date(n.createdAt).toLocaleDateString()}</span>
            </div>
            <button className="ap-btn ap-btn--xs ap-btn--danger" onClick={() => setConfirm({ msg: 'Delete this note?', cb: () => del(n._id) })}><i className="fa-solid fa-trash" /></button>
          </div>
        ))}
        {!notes.length && <div className="ap-empty">No notes yet</div>}
      </div>
      {confirm && <Confirm msg={confirm.msg} onYes={() => { confirm.cb(); setConfirm(null); }} onNo={() => setConfirm(null)} />}
    </div>
  );
}

// ── Chat Logs ──────────────────────────────────────────────────
function ChatLogs() {
  const [logs,    setLogs]    = useState([]);
  const [rooms,   setRooms]   = useState([]);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [roomId,  setRoomId]  = useState('');
  const [type,    setType]    = useState('');
  const [search,  setSearch]  = useState('');
  const [expanded,setExpanded]= useState({});

  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (roomId) params.set('roomId', roomId);
      if (type)   params.set('type',   type);
      if (search) params.set('search', search);
      const d = await api(`/logs?${params}`);
      setLogs(d.logs || []);
      setTotal(d.total || 0);
      setPages(d.pages || 1);
    } catch(e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [page, roomId, type, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api('/chat-logs/rooms').then(d => setRooms(d.rooms || [])).catch(() => {});
  }, []);

  const reset = () => { setPage(1); setRoomId(''); setType(''); setSearch(''); };

  const toggleExpand = id => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const API_URL = typeof window !== 'undefined'
    ? (window.__VITE_API_URL__ || import.meta?.env?.VITE_API_URL || 'http://localhost:5000')
    : 'http://localhost:5000';

  const typeIcon = t => {
    const icons = { text:'fa-message', image:'fa-image', gif:'fa-film', voice:'fa-microphone',
                    system:'fa-circle-info', gift:'fa-gift', whisper:'fa-user-secret', drawing:'fa-pen-nib', youtube:'fa-youtube' };
    return icons[t] || 'fa-message';
  };
  const typeColor = t => {
    const colors = { text:'#94a3b8', image:'#3b82f6', gif:'#ec4899', voice:'#8b5cf6',
                     system:'#f59e0b', gift:'#22c55e', whisper:'#6366f1', drawing:'#f97316', youtube:'#ef4444' };
    return colors[t] || '#94a3b8';
  };

  return (
    <div className="ap-section">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
        <h2 className="ap-section-title" style={{ marginBottom:0 }}>
          <i className="fa-solid fa-scroll" style={{ color:'#3b82f6' }} /> Chat Logs
          <span style={{ fontSize:12, color:'#6b7280', fontWeight:400, marginLeft:8 }}>{total.toLocaleString()} messages</span>
        </h2>
        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={load} disabled={loading}>
          <i className={`fa-solid fa-refresh ${loading?'fa-spin':''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="ap-filter-bar" style={{ flexWrap:'wrap', gap:8, marginBottom:14 }}>
        <div style={{ position:'relative', flex:'1 1 200px', minWidth:160 }}>
          <i className="fa-solid fa-search" style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#6b7280',fontSize:12,pointerEvents:'none' }} />
          <input className="ap-input" style={{ paddingLeft:32 }} placeholder="Search messages…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            onKeyDown={e => e.key === 'Enter' && load()} />
        </div>
        <select className="ap-input" style={{ flex:'0 0 160px' }} value={roomId} onChange={e => { setRoomId(e.target.value); setPage(1); }}>
          <option value="">All Rooms</option>
          {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>
        <select className="ap-input" style={{ flex:'0 0 140px' }} value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {['text','image','gif','voice','system','gift','whisper','drawing','youtube'].map(t =>
            <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
          )}
        </select>
        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={reset}>Reset</button>
      </div>

      {loading ? (
        <div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div>
      ) : logs.length === 0 ? (
        <div className="ap-empty">No messages found</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {logs.map(l => {
            const isDeleted  = l.isDeleted;
            const isSystem   = l.type === 'system';
            const isImage    = l.type === 'image';
            const isExpanded = expanded[l._id];
            const senderColor = rankColor(l.sender?.rank);

            return (
              <div key={l._id} style={{
                background: isDeleted ? '#1a0808' : isSystem ? '#0d1a0d' : '#0d1020',
                border: `1px solid ${isDeleted ? '#ef444430' : isSystem ? '#22c55e25' : '#1e2436'}`,
                borderLeft: `3px solid ${typeColor(l.type)}`,
                borderRadius: 8, padding:'10px 12px',
                opacity: isDeleted ? 0.75 : 1
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  {/* Avatar */}
                  <img
                    src={l.sender?.avatar || '/default_images/avatar/default_avatar.png'}
                    style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:`2px solid ${senderColor}44` }}
                    alt=""
                    onError={e => e.target.src='/default_images/avatar/default_avatar.png'}
                  />

                  {/* Main content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    {/* Header row */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ color: senderColor, fontWeight:700, fontSize:13 }}>
                        {l.sender?.username || '[Deleted User]'}
                        {l.sender?.isBot && <span style={{ fontSize:10, background:'#00cc8822', color:'#00cc88', border:'1px solid #00cc8844', borderRadius:10, padding:'1px 6px', marginLeft:5 }}>BOT</span>}
                      </span>
                      <span style={{ fontSize:10, background:`${senderColor}18`, color:senderColor, border:`1px solid ${senderColor}44`, borderRadius:10, padding:'1px 6px', textTransform:'uppercase', letterSpacing:0.5 }}>
                        {l.sender?.rank || '?'}
                      </span>
                      {l.roomId?.name && (
                        <span style={{ fontSize:11, color:'#6b7280' }}>
                          <i className="fa-solid fa-door-open" style={{ marginRight:3 }} />{l.roomId.name}
                        </span>
                      )}
                      {/* Type badge */}
                      <span style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
                        <i className={`fa-solid ${typeIcon(l.type)}`} style={{ color: typeColor(l.type), fontSize:11 }} />
                        <span style={{ fontSize:10, color: typeColor(l.type) }}>{l.type}</span>
                      </span>
                      {/* Deleted badge */}
                      {isDeleted && (
                        <span style={{ background:'#ef444422', color:'#ef4444', border:'1px solid #ef444444', borderRadius:10, padding:'1px 8px', fontSize:11, fontWeight:700 }}>
                          🗑 DELETED {l.deletedBy ? `by ${l.deletedBy.username}` : ''}
                        </span>
                      )}
                    </div>

                    {/* Message content */}
                    {isImage ? (
                      <div>
                        <img
                          src={l.content}
                          alt="chat image"
                          style={{
                            maxWidth: isExpanded ? '100%' : 180,
                            maxHeight: isExpanded ? 500 : 120,
                            borderRadius: 8, objectFit:'cover', cursor:'pointer',
                            border:'1px solid #1e2436', display:'block', marginTop:4
                          }}
                          onClick={() => toggleExpand(l._id)}
                          onError={e => { e.target.style.display='none'; }}
                        />
                        {l.imageCaption && <div style={{ fontSize:12, color:'#94a3b8', marginTop:3 }}>{l.imageCaption}</div>}
                        <button onClick={() => toggleExpand(l._id)} className="ap-btn ap-btn--xs ap-btn--ghost" style={{ marginTop:4 }}>
                          {isExpanded ? 'Collapse' : 'Expand image'}
                        </button>
                      </div>
                    ) : l.type === 'voice' ? (
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                        <i className="fa-solid fa-microphone" style={{ color:'#8b5cf6' }} />
                        <audio controls src={l.audioUrl} style={{ height:28, maxWidth:260 }} />
                        {l.duration > 0 && <span style={{ fontSize:11, color:'#6b7280' }}>{l.duration}s</span>}
                      </div>
                    ) : l.type === 'youtube' ? (
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                        <i className="fa-brands fa-youtube" style={{ color:'#ef4444' }} />
                        {l.youtubeMeta?.thumbnail && <img src={l.youtubeMeta.thumbnail} style={{ width:60, height:36, borderRadius:4, objectFit:'cover' }} alt="" />}
                        <a href={l.youtubeUrl} target="_blank" rel="noreferrer" style={{ color:'#ef4444', fontSize:12 }}>{l.youtubeMeta?.title || l.youtubeUrl}</a>
                      </div>
                    ) : l.type === 'gift' ? (
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                        <i className="fa-solid fa-gift" style={{ color:'#22c55e' }} />
                        <span style={{ fontSize:13, color:'#22c55e' }}>{l.content}</span>
                      </div>
                    ) : (
                      <div style={{
                        fontSize:13, color: isDeleted ? '#6b7280' : '#d1d5db',
                        wordBreak:'break-word', marginTop:2,
                        fontStyle: isDeleted ? 'italic' : 'normal'
                      }}>
                        {l.content || <span style={{ color:'#4b5563' }}>[empty]</span>}
                      </div>
                    )}

                    {/* Footer: time + reply info */}
                    <div style={{ display:'flex', gap:12, marginTop:5, fontSize:11, color:'#4b5563', flexWrap:'wrap' }}>
                      <span><i className="fa-solid fa-clock" style={{ marginRight:3 }} />{new Date(l.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                      {l.replyTo && <span><i className="fa-solid fa-reply" style={{ marginRight:3 }} />Reply to message</span>}
                      {l.isPinned && <span style={{ color:'#f59e0b' }}><i className="fa-solid fa-thumbtack" style={{ marginRight:3 }} />Pinned</span>}
                      {l.isGuest && <span style={{ color:'#6b7280' }}>Guest message</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="ap-pagination" style={{ marginTop:16 }}>
        <button className="ap-btn ap-btn--xs ap-btn--ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <span style={{ fontSize:13 }}>Page {page} of {pages}</span>
        <button className="ap-btn ap-btn--xs ap-btn--ghost" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
          <i className="fa-solid fa-chevron-right" />
        </button>
      </div>
      <div style={{ marginTop:6, fontSize:12, color:'#6b7280', textAlign:'center' }}>
        {total.toLocaleString()} total messages · Page {page}/{pages}
      </div>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────
function Settings() {
  const [settings, setSettings] = useState(null);
  const [tab, setTab] = useState('general');
  const load = useCallback(() => api('/settings').then(d => setSettings(d.settings)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const save = async (section, data) => {
    try { await api(`/settings/${section}`, { method: 'PUT', body: JSON.stringify(data) }); toast('Settings saved!'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  if (!settings) return <div className="ap-section"><div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div></div>;

  const Toggle = ({ label, field }) => (
    <label className="ap-toggle-row">
      <span>{label}</span>
      <input type="checkbox" className="ap-toggle" checked={!!settings[field]}
        onChange={e => { const s = { ...settings, [field]: e.target.checked }; setSettings(s); save(tab, { [field]: e.target.checked }); }} />
    </label>
  );

  const Input = ({ label, field, type = 'text' }) => (
    <div className="ap-setting-row">
      <label className="ap-label">{label}</label>
      <input className="ap-input" type={type} value={settings[field] ?? ''} onChange={e => setSettings(s => ({ ...s, [field]: e.target.value }))}
        onBlur={() => save(tab, { [field]: settings[field] })} />
    </div>
  );

  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-gear" /> Settings</h2>
      <div className="ap-tabs">
        {['general','features','chat','wallet','games'].map(t => (
          <button key={t} className={`ap-tab-btn ${tab === t ? 'ap-tab-btn--active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="ap-card">
          <Input label="Site Name" field="siteName" />
          <Input label="Site Description" field="siteDescription" />
          <Toggle label="Maintenance Mode" field="maintenanceMode" />
          <Input label="Maintenance Message" field="maintenanceMsg" />
          <Toggle label="Allow Guests" field="allowGuests" />
          <Toggle label="Allow Registration" field="allowRegistration" />
          <Toggle label="Require Email Verify" field="requireEmailVerify" />
        </div>
      )}
      {tab === 'features' && (
        <div className="ap-card">
          <Toggle label="Gifts Enabled" field="giftEnabled" />
          <Toggle label="Video Calls" field="videoCallEnabled" />
          <Toggle label="Audio Calls" field="audioCallEnabled" />
          <Toggle label="Group Calls" field="groupCallEnabled" />
          <Toggle label="Webcam Enabled" field="webcamEnabled" />
          <Toggle label="Radio Enabled" field="radioEnabled" />
          <Toggle label="Bot Enabled" field="botEnabled" />
          <Toggle label="Giphy Enabled" field="giphyEnabled" />
          <Toggle label="Wall Enabled" field="wallEnabled" />
          <Toggle label="Leaderboard" field="levelEnabled" />
        </div>
      )}
      {tab === 'chat' && (
        <div className="ap-card">
          <Input label="Max Message Length" field="maxMessageLength" type="number" />
          <Input label="Chat Cooldown (sec)" field="chatCooldownSec" type="number" />
          <Input label="Flood Limit" field="floodLimit" type="number" />
          <Toggle label="Rate Limiting" field="rateLimitEnabled" />
          <Toggle label="Auto Delete Messages" field="autoDeleteMessages" />
          <Input label="Auto Delete After (days)" field="autoDeleteDays" type="number" />
        </div>
      )}
      {tab === 'wallet' && (
        <div className="ap-card">
          <Toggle label="Gold Enabled" field="goldEnabled" />
          <Input label="Gold Per Message" field="goldPerMessage" type="number" />
          <Input label="Gold Login Bonus" field="goldLoginBonus" type="number" />
          <Toggle label="Ruby Enabled" field="rubyEnabled" />
          <Toggle label="Wallet Share" field="walletShareEnabled" />
        </div>
      )}
      {tab === 'games' && (
        <div className="ap-card">
          <Toggle label="Dice Game" field="diceEnabled" />
          <Input label="Dice Bet Amount" field="diceBet" type="number" />
          <Input label="Dice Multiplier" field="diceMultiplier" type="number" />
          <Toggle label="Keno Game" field="kenoEnabled" />
          <Input label="Keno Min Bet" field="kenoMinBet" type="number" />
          <Input label="Keno Max Bet" field="kenoMaxBet" type="number" />
          <Toggle label="Spin Wheel" field="spinEnabled" />
          <Input label="Spin Cooldown (hours)" field="spinCooldownHours" type="number" />
        </div>
      )}
    </div>
  );
}

// ── Rank icon map (matches /public/icons/ranks/) ───────────────


// All fonts available (from backend DEFAULT_SETTINGS.fonts)
const ALL_FONTS = [
  { id:'',      name:'Default (System)' },
  { id:'font1', name:'Kalam',            family:"'Kalam', cursive" },
  { id:'font2', name:'Signika',          family:"'Signika', sans-serif" },
  { id:'font3', name:'Grandstander',     family:"'Grandstander', cursive" },
  { id:'font4', name:'Comic Neue',       family:"'Comic Neue', cursive" },
  { id:'font5', name:'Quicksand',        family:"'Quicksand', sans-serif" },
  { id:'font6', name:'Orbitron',         family:"'Orbitron', sans-serif" },
  { id:'font7', name:'Lemonada',         family:"'Lemonada', cursive" },
  { id:'font8', name:'Grenze Gotisch',   family:"'Grenze Gotisch', cursive" },
  { id:'font9', name:'Merienda',         family:"'Merienda', cursive" },
  { id:'font10',name:'Amita',            family:"'Amita', cursive" },
  { id:'font11',name:'Averia Libre',     family:"'Averia Libre', cursive" },
  { id:'font12',name:'Turret Road',      family:"'Turret Road', cursive" },
  { id:'font13',name:'Sansita',          family:"'Sansita', sans-serif" },
  { id:'font14',name:'Comfortaa',        family:"'Comfortaa', cursive" },
  { id:'font15',name:'Charm',            family:"'Charm', cursive" },
  { id:'font16',name:'Lobster Two',      family:"'Lobster Two', cursive" },
  { id:'font17',name:'Pacifico',         family:"'Pacifico', cursive" },
  { id:'font18',name:'Dancing Script',   family:"'Dancing Script', cursive" },
  { id:'font19',name:'Righteous',        family:"'Righteous', cursive" },
  { id:'font20',name:'Fredoka One',      family:"'Fredoka One', cursive" },
  { id:'font21',name:'Press Start 2P',   family:"'Press Start 2P', cursive" },
  { id:'font22',name:'Caveat',           family:"'Caveat', cursive" },
  { id:'font23',name:'Satisfy',          family:"'Satisfy', cursive" },
  { id:'font24',name:'Indie Flower',     family:"'Indie Flower', cursive" },
  { id:'font25',name:'Gloria Hallelujah',family:"'Gloria Hallelujah', cursive" },
  { id:'font26',name:'Exo 2',            family:"'Exo 2', sans-serif" },
  { id:'font27',name:'Rajdhani',         family:"'Rajdhani', sans-serif" },
  { id:'font28',name:'Josefin Sans',     family:"'Josefin Sans', sans-serif" },
  { id:'font29',name:'Audiowide',        family:"'Audiowide', sans-serif" },
  { id:'font30',name:'Nunito',           family:"'Nunito', sans-serif" },
];
const fontFamily = id => ALL_FONTS.find(f => f.id === id)?.family || 'inherit';

// ── Appearance (Rank Styles) ───────────────────────────────────
function Appearance() {
  const [rankStyles, setRankStyles] = useState(null);
  const [editRank, setEditRank] = useState('user');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => api('/rank-styles').then(d => setRankStyles(d.rankStyles)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await api(`/rank-styles/${editRank}`, { method: 'PUT', body: JSON.stringify(rankStyles[editRank]) });
      toast(`${editRank} style saved!`);
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    try { await api(`/rank-styles/${editRank}/reset`, { method: 'POST' }); toast('Reset to default'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const set = (key, val) => setRankStyles(s => ({ ...s, [editRank]: { ...s[editRank], [key]: val } }));
  const setBubble = (key, val) => setRankStyles(s => ({ ...s, [editRank]: { ...s[editRank], bubble: { ...s[editRank].bubble, [key]: val } } }));

  if (!rankStyles) return <div className="ap-section"><div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div></div>;

  const rs = rankStyles[editRank] || {};
  const bubble = rs.bubble || {};
  const previewFont = fontFamily(rs.nameFont);

  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-palette" /> Appearance — Rank Styles</h2>

      {/* Rank selector with icons */}
      <div className="ap-filter-bar" style={{ gap: 6 }}>
        {RANKS.map(r => {
          const icon = rankIcon(r);
          return (
            <button key={r} className={`ap-rank-chip ${editRank === r ? 'active' : ''}`}
              style={{ color: rankColor(r), borderColor: rankColor(r) + '66', display:'flex', alignItems:'center', gap:5 }}
              onClick={() => setEditRank(r)}>
              {icon && <img src={icon} alt="" style={{ width:16,height:16,objectFit:'contain' }} onError={e=>{e.target.style.display='none';}} />}
              {r}
            </button>
          );
        })}
      </div>

      <div className="ap-card">
        {/* Header: rank identity */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, padding:'10px 12px', background:'#131624', borderRadius:8 }}>
          {rankIcon(editRank) && <img src={rankIcon(editRank)} alt="" style={{ width:36,height:36,objectFit:'contain' }} onError={e=>{e.target.style.display='none';}} />}
          <div>
            <div style={{ fontWeight:800, fontSize:17, color: rankColor(editRank) }}>{editRank}</div>
            <div style={{ fontSize:11, color:'#6b7280' }}>Editing rank style</div>
          </div>
        </div>

        {/* ── USERNAME STYLE ── */}
        <div className="ap-subsection-title"><i className="fa-solid fa-signature" /> Username Style</div>
        <div className="ap-form-grid">
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-droplet" /> Name Color</label>
            <div className="ap-row">
              <input type="color" className="ap-color-picker" value={rs.color || '#aaaaaa'} onChange={e => set('color', e.target.value)} />
              <span style={{ fontSize:12, color: rs.color || '#aaa', fontWeight:700 }}>{rs.color || '#aaaaaa'}</span>
            </div>
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-swatchbook" /> Gradient (CSS)</label>
            <input className="ap-input" placeholder="e.g. linear-gradient(90deg, #f00, #00f)" value={rs.nameGradient || ''} onChange={e => set('nameGradient', e.target.value)} />
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-lightbulb" /> Neon / Text Shadow</label>
            <input className="ap-input" placeholder="e.g. 0 0 8px #FF00FF" value={rs.nameTextShadow || ''} onChange={e => set('nameTextShadow', e.target.value)} />
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-bold" /> Font Weight</label>
            <select className="ap-select" value={rs.nameFontWeight || 'normal'} onChange={e => set('nameFontWeight', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="600">Semi-Bold (600)</option>
              <option value="bold">Bold (700)</option>
              <option value="800">Extra-Bold (800)</option>
              <option value="900">Black (900)</option>
            </select>
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-italic" /> Font Style</label>
            <select className="ap-select" value={rs.nameFontStyle || 'normal'} onChange={e => set('nameFontStyle', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
            </select>
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-font" /> Username Font</label>
            <select className="ap-select" value={rs.nameFont || ''} onChange={e => set('nameFont', e.target.value)}>
              {ALL_FONTS.map(f => <option key={f.id} value={f.id} style={{ fontFamily: f.family }}>{f.name}</option>)}
            </select>
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-text-height" /> Username Font Size (px)</label>
            <input className="ap-input" type="number" min={10} max={32} value={rs.nameFontSize || 14} onChange={e => set('nameFontSize', +e.target.value)} />
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-strikethrough" /> Decoration</label>
            <select className="ap-select" value={rs.nameDecoration || 'none'} onChange={e => set('nameDecoration', e.target.value)}>
              <option value="none">None</option>
              <option value="underline">Underline</option>
              <option value="overline">Overline</option>
              <option value="line-through">Strikethrough</option>
            </select>
          </div>
        </div>

        {/* ── BUBBLE STYLE ── */}
        <div className="ap-subsection-title" style={{ marginTop:20 }}><i className="fa-solid fa-comment" /> Message Bubble Style</div>
        <div className="ap-form-grid">
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-fill-drip" /> Background Color</label>
            <div className="ap-row">
              <input type="color" className="ap-color-picker" value={(bubble.bg || '#1a1a2e').slice(0,7)} onChange={e => setBubble('bg', e.target.value)} />
              <span style={{ fontSize:12 }}>{bubble.bg || '#1a1a2e'}</span>
            </div>
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-circle-half-stroke" /> Gradient Override (CSS)</label>
            <input className="ap-input" placeholder="e.g. linear-gradient(135deg,#1a1a2e,#2a0f3a)" value={bubble.gradient || ''} onChange={e => setBubble('gradient', e.target.value)} />
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-border-style" /> Border Color</label>
            <div className="ap-row">
              <input type="color" className="ap-color-picker" value={(bubble.borderColor || '#333333').replace(/[a-f0-9]{2}$/i,'ff').slice(0,7)} onChange={e => setBubble('borderColor', e.target.value)} />
              <span style={{ fontSize:12 }}>{bubble.borderColor || '#333333'}</span>
            </div>
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-border-top-left" /> Border Radius (px)</label>
            <input className="ap-input" type="number" min={0} max={30} value={bubble.borderRadius ?? 10} onChange={e => setBubble('borderRadius', +e.target.value)} />
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-border-none" /> Border Width (px)</label>
            <input className="ap-input" type="number" min={0} max={5} value={bubble.borderWidth ?? 1} onChange={e => setBubble('borderWidth', +e.target.value)} />
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-layer-group" /> Box Shadow</label>
            <input className="ap-input" placeholder="e.g. 0 0 10px #FF448844" value={bubble.boxShadow || ''} onChange={e => setBubble('boxShadow', e.target.value)} />
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-paint-brush" /> Message Text Color</label>
            <div className="ap-row">
              <input type="color" className="ap-color-picker" value={(bubble.textColor || '#cccccc').slice(0,7)} onChange={e => setBubble('textColor', e.target.value)} />
              <span style={{ fontSize:12 }}>{bubble.textColor || '#cccccc'}</span>
            </div>
          </div>
          <div className="ap-setting-row">
            <label className="ap-label"><i className="fa-solid fa-text-height" /> Message Font Size (px)</label>
            <input className="ap-input" type="number" min={10} max={24} value={bubble.fontSize ?? 14} onChange={e => setBubble('fontSize', +e.target.value)} />
          </div>
        </div>

        {/* ── ALLOWED FONTS ── */}
        <div className="ap-subsection-title" style={{ marginTop:20 }}><i className="fa-solid fa-font" /> Allowed Chat Fonts for This Rank</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:8 }}>
          {ALL_FONTS.filter(f => f.id).map(f => {
            const allowed = (rs.allowedFonts || []).includes(f.id);
            return (
              <label key={f.id} className="ap-checkbox" style={{ padding:'8px 10px', background: allowed ? '#1a2a3a' : '#131624', border:`1px solid ${allowed ? '#3b82f6' : '#1e2436'}`, borderRadius:8, cursor:'pointer' }}>
                <input type="checkbox" checked={allowed} onChange={e => {
                  const cur = rs.allowedFonts || [];
                  set('allowedFonts', e.target.checked ? [...cur, f.id] : cur.filter(x => x !== f.id));
                }} style={{ accentColor:'#3b82f6' }} />
                <span style={{ fontFamily: f.family, fontSize:13 }}>{f.name}</span>
              </label>
            );
          })}
        </div>

        {/* ── LIVE PREVIEW ── */}
        <div className="ap-subsection-title" style={{ marginTop:24 }}><i className="fa-solid fa-eye" /> Live Preview</div>
        <div style={{
          background: bubble.gradient || bubble.bg || '#1a1a2e',
          border: `${bubble.borderWidth ?? 1}px solid ${bubble.borderColor || '#333'}`,
          borderRadius: bubble.borderRadius ?? 10,
          boxShadow: bubble.boxShadow || 'none',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          {rankIcon(editRank) && <img src={rankIcon(editRank)} alt="" style={{ width:24,height:24,objectFit:'contain',marginTop:2,flexShrink:0 }} onError={e=>{e.target.style.display='none';}} />}
          <div>
            <span style={{
              color: rs.color || '#aaa',
              fontWeight: rs.nameFontWeight || 'normal',
              fontStyle: rs.nameFontStyle || 'normal',
              textShadow: rs.nameTextShadow || 'none',
              fontFamily: previewFont,
              fontSize: (rs.nameFontSize || 14),
              textDecoration: rs.nameDecoration || 'none',
              background: rs.nameGradient || undefined,
              WebkitBackgroundClip: rs.nameGradient ? 'text' : undefined,
              WebkitTextFillColor: rs.nameGradient ? 'transparent' : undefined,
            }}>
              {editRank}
            </span>
            <span style={{ color: bubble.textColor || '#ccc', fontSize: bubble.fontSize || 14, marginLeft:8 }}>
              Hello, this is a preview message!
            </span>
          </div>
        </div>

        <div className="ap-action-row" style={{ marginTop: 20 }}>
          <button className="ap-btn ap-btn--primary" onClick={save} disabled={saving}>
            {saving ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</> : <><i className="fa-solid fa-floppy-disk" /> Save {editRank} Style</>}
          </button>
          <button className="ap-btn ap-btn--ghost" onClick={reset}><i className="fa-solid fa-rotate-left" /> Reset to Default</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN ADMIN PANEL
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// ADDONS & WALLET
// ══════════════════════════════════════════════════════════════

const ADDON_SYSTEM_RANKS = [
  { id: 'guest',      label: 'Guest',       icon: '/icons/ranks/guest.svg',       color: '#888888' },
  { id: 'user',       label: 'User',         icon: '/icons/ranks/user.svg',        color: '#aaaaaa' },
  { id: 'vipfemale',  label: 'VIP Female',   icon: '/icons/ranks/vip_female.svg',  color: '#FF4488' },
  { id: 'vipmale',    label: 'VIP Male',     icon: '/icons/ranks/vip_male.svg',    color: '#4488FF' },
  { id: 'butterfly',  label: 'Butterfly',    icon: '/icons/ranks/butterfly.svg',   color: '#FF66AA' },
  { id: 'ninja',      label: 'Ninja',        icon: '/icons/ranks/ninja.svg',       color: '#777777' },
  { id: 'fairy',      label: 'Fairy',        icon: '/icons/ranks/fairy.svg',       color: '#FF88CC' },
  { id: 'legend',     label: 'Legend',       icon: '/icons/ranks/legend.png',      color: '#FF8800' },
  { id: 'bot',        label: 'Bot',          icon: '/icons/ranks/bot.svg',         color: '#00cc88' },
  { id: 'premium',    label: 'Premium',      icon: '/icons/ranks/premium.svg',     color: '#aa44ff' },
  { id: 'moderator',  label: 'Moderator',    icon: '/icons/ranks/mod.svg',         color: '#00AAFF' },
  { id: 'admin',      label: 'Admin',        icon: '/icons/ranks/admin.svg',       color: '#FF4444' },
  { id: 'superadmin', label: 'Super Admin',  icon: '/icons/ranks/super_admin.svg', color: '#FF00FF' },
  { id: 'owner',      label: 'Owner',        icon: '/icons/ranks/owner.svg',       color: '#FFD700' },
  { id: 'nobody',     label: 'Nobody',       icon: null,                           color: '#444444' },
];

const ADDON_ROOM_RANKS = [
  { id: 'user',       label: 'User',       color: '#aaaaaa' },
  { id: 'room_mod',   label: 'Room Mod',   color: '#00AAFF' },
  { id: 'room_admin', label: 'Room Admin', color: '#FF4444' },
  { id: 'room_owner', label: 'Room Owner', color: '#FFD700' },
];

// ── Addon primitive form components ──────────────────────────

function AdToggle({ label, desc, field, settings, onChange }) {
  return (
    <div className="ad-field-row">
      <div className="ad-field-meta">
        <span className="ad-field-label">{label}</span>
        {desc && <span className="ad-field-desc">{desc}</span>}
      </div>
      <label className="ad-switch">
        <input type="checkbox" checked={!!settings[field]} onChange={e => onChange(field, e.target.checked)} />
        <span className="ad-switch-track" />
      </label>
    </div>
  );
}

function AdNumber({ label, desc, field, settings, onChange, min, max, unit }) {
  return (
    <div className="ad-field-row">
      <div className="ad-field-meta">
        <span className="ad-field-label">{label}</span>
        {desc && <span className="ad-field-desc">{desc}</span>}
      </div>
      <div className="ad-num-wrap">
        <input className="ad-num-input" type="number" min={min} max={max}
          value={settings[field] ?? ''} onChange={e => onChange(field, e.target.value)} />
        {unit && <span className="ad-num-unit">{unit}</span>}
      </div>
    </div>
  );
}

function AdText({ label, desc, field, settings, onChange, placeholder }) {
  return (
    <div className="ad-field-row">
      <div className="ad-field-meta">
        <span className="ad-field-label">{label}</span>
        {desc && <span className="ad-field-desc">{desc}</span>}
      </div>
      <input className="ad-text-input" type="text" placeholder={placeholder || ''}
        value={settings[field] ?? ''} onChange={e => onChange(field, e.target.value)} />
    </div>
  );
}

function AdRankSelect({ label, desc, field, settings, onChange, ranks }) {
  const rankList = ranks || ADDON_SYSTEM_RANKS;
  const val = settings[field] || rankList[0]?.id;
  const cur = rankList.find(r => r.id === val) || rankList[0];
  return (
    <div className="ad-field-row">
      <div className="ad-field-meta">
        <span className="ad-field-label">{label}</span>
        {desc && <span className="ad-field-desc">{desc}</span>}
      </div>
      <div className="ad-rank-sel-wrap">
        <div className="ad-rank-sel-preview" style={{ color: cur?.color }}>
          {cur?.icon
            ? <img src={cur.icon} alt="" className="ad-rank-icon" onError={e => { e.target.style.display = 'none'; }} />
            : <span className="ad-rank-dot" style={{ background: cur?.color }} />
          }
          <span>{cur?.label}</span>
        </div>
        <select className="ad-rank-sel-native" value={val} onChange={e => onChange(field, e.target.value)}>
          {rankList.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <i className="fa-solid fa-chevron-down ad-rank-sel-caret" />
      </div>
    </div>
  );
}

function AdPerRankTable({ label, desc, fieldPrefix, settings, onChange, unit, ranks }) {
  const rankList = (ranks || ADDON_SYSTEM_RANKS).filter(r => r.id !== 'nobody');
  return (
    <div className="ad-perrank-block">
      <div className="ad-perrank-header">
        <span className="ad-field-label">{label}</span>
        {desc && <span className="ad-field-desc" style={{ marginTop: 2 }}>{desc}</span>}
      </div>
      <div className="ad-perrank-grid">
        {rankList.map(rank => {
          const key = `${fieldPrefix}_${rank.id}`;
          return (
            <div key={rank.id} className="ad-perrank-row">
              <div className="ad-perrank-rank" style={{ color: rank.color }}>
                {rank.icon
                  ? <img src={rank.icon} alt="" className="ad-rank-icon" onError={e => { e.target.style.display = 'none'; }} />
                  : <span className="ad-rank-dot" style={{ background: rank.color }} />
                }
                <span>{rank.label}</span>
              </div>
              <div className="ad-num-wrap">
                <input className="ad-num-input ad-num-input--sm" type="number" min="0"
                  value={settings[key] ?? 0} onChange={e => onChange(key, Number(e.target.value))} />
                {unit && <span className="ad-num-unit">{unit}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdCard({ title, icon, color, badge, children }) {
  return (
    <div className="ad-card">
      <div className="ad-card-header">
        <div className="ad-card-title-wrap">
          <span className="ad-card-icon-wrap" style={{ background: color + '22', color }}>
            <i className={`fa-solid ${icon}`} />
          </span>
          <span className="ad-card-title">{title}</span>
        </div>
        {badge && <span className="ad-badge" style={{ background: color + '22', color }}>{badge}</span>}
      </div>
      <div className="ad-card-body">{children}</div>
    </div>
  );
}

function AdSectionLabel({ icon, children }) {
  return <div className="ad-section-label"><i className={`fa-solid ${icon}`} /> {children}</div>;
}
function AdDivider() { return <div className="ad-divider" />; }

// ── BOTS SECTION ──────────────────────────────────────────────
function BotsSection() {
  const [bots,      setBots]      = useState([]);
  const [rooms,     setRooms]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [tab,       setTab]       = useState('list');
  const [editBot,   setEditBot]   = useState(null);   // bot being edited
  const [schedBot,  setSchedBot]  = useState(null);   // bot whose schedules we're managing
  const [sendBot,   setSendBot]   = useState(null);   // bot to manual-send

  // Create form
  const [form, setForm]   = useState({ username:'', about:'', gender:'other', avatar:'/default_images/avatar/bot.png', nameColor:'' });
  const [saving, setSaving] = useState(false);

  // Schedule form
  const [schedForm, setSchedForm] = useState({ roomId:'', messages:[''], intervalMin:30 });

  // Manual send form
  const [sendForm, setSendForm] = useState({ roomId:'', content:'' });

  const API_BASE = (typeof import !== 'undefined' && import.meta?.env?.VITE_API_URL) || 'http://localhost:5000';
  const tok = () => localStorage.getItem('token');

  const apiBot = async (path, opts = {}) => {
    const r = await fetch(`${API_BASE}/api/admin/bots${path}`, {
      headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json', ...opts.headers },
      ...opts
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Request failed'); }
    return r.json();
  };

  const loadBots = async () => {
    setLoading(true);
    try {
      const d = await apiBot('/');
      setBots(d.bots || []);
    } catch(e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const loadRooms = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/chat-logs/rooms`, {
        headers: { Authorization: `Bearer ${tok()}` }
      });
      const d = await r.json();
      setRooms(d.rooms || []);
    } catch {}
  };

  useEffect(() => { loadBots(); loadRooms(); }, []);

  const createBot = async () => {
    if (!form.username.trim()) return toast('Username required', 'error');
    setSaving(true);
    try {
      await apiBot('/', { method:'POST', body: JSON.stringify(form) });
      toast(`Bot "${form.username}" created!`);
      setForm({ username:'', about:'', gender:'other', avatar:'/default_images/avatar/bot.png', nameColor:'' });
      setTab('list');
      loadBots();
    } catch(e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const updateBot = async () => {
    if (!editBot) return;
    setSaving(true);
    try {
      await apiBot(`/${editBot._id}`, { method:'PUT', body: JSON.stringify(editBot) });
      toast('Bot updated!');
      setEditBot(null);
      loadBots();
    } catch(e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const deleteBot = async (bot) => {
    if (!confirm(`Delete bot "${bot.username}"? This cannot be undone.`)) return;
    try {
      await apiBot(`/${bot._id}`, { method:'DELETE' });
      toast(`Bot deleted`);
      loadBots();
    } catch(e) { toast(e.message, 'error'); }
  };

  const sendManual = async () => {
    if (!sendBot || !sendForm.roomId || !sendForm.content.trim()) return toast('Room and message required', 'error');
    try {
      await apiBot(`/${sendBot._id}/send`, { method:'POST', body: JSON.stringify(sendForm) });
      toast('Message sent!');
      setSendForm(s => ({ ...s, content:'' }));
    } catch(e) { toast(e.message, 'error'); }
  };

  const createSchedule = async () => {
    if (!schedBot) return;
    const msgs = schedForm.messages.filter(m => m.trim());
    if (!msgs.length) return toast('At least 1 message required', 'error');
    try {
      await apiBot(`/${schedBot._id}/schedules`, { method:'POST', body: JSON.stringify({ ...schedForm, messages: msgs }) });
      toast('Schedule created!');
      setSchedForm({ roomId:'', messages:[''], intervalMin:30 });
      loadBots();
    } catch(e) { toast(e.message, 'error'); }
  };

  const deleteSchedule = async (schedId) => {
    try {
      await apiBot(`/schedules/${schedId}`, { method:'DELETE' });
      toast('Schedule deleted');
      loadBots();
    } catch(e) { toast(e.message, 'error'); }
  };

  const toggleSchedule = async (sched) => {
    try {
      await apiBot(`/schedules/${sched._id}`, { method:'PUT', body: JSON.stringify({ isActive: !sched.isActive }) });
      toast(sched.isActive ? 'Schedule paused' : 'Schedule activated');
      loadBots();
    } catch(e) { toast(e.message, 'error'); }
  };

  const TABS = [
    { id:'list',   icon:'fa-robot',      label:'Bots List' },
    { id:'create', icon:'fa-plus-circle', label:'Create Bot' },
  ];

  const schedBotFull = schedBot ? bots.find(b => b._id === schedBot._id) : null;

  return (
    <div className="ap-section">
      <h2 className="ap-section-title">
        <i className="fa-solid fa-robot" style={{ color:'#00cc88' }} /> Bot Manager
      </h2>

      <div className="ap-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`ap-tab-btn ${tab===t.id?'ap-tab-btn--active':''}`}
            onClick={() => setTab(t.id)}>
            <i className={`fa-solid ${t.icon}`} style={{ marginRight:5 }} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Bot List ── */}
      {tab === 'list' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={loadBots} disabled={loading}>
              <i className={`fa-solid fa-refresh ${loading?'fa-spin':''}`} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div>
          ) : bots.length === 0 ? (
            <div className="ap-empty">
              <i className="fa-solid fa-robot" style={{ fontSize:36, display:'block', marginBottom:10, color:'#1e2436' }} />
              No bots yet — create one!
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {bots.map(bot => (
                <div key={bot._id} style={{
                  background:'#0d1020', border:'1px solid #1e2436',
                  borderLeft:'4px solid #00cc88', borderRadius:10, padding:'14px 16px'
                }}>
                  {editBot?._id === bot._id ? (
                    /* Inline edit form */
                    <div>
                      <div style={{ fontWeight:700, color:'#00cc88', marginBottom:12 }}>
                        <i className="fa-solid fa-pencil" style={{ marginRight:6 }} />Editing: {bot.username}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10, marginBottom:12 }}>
                        <div className="ap-setting-row">
                          <span className="ap-label">Username</span>
                          <input className="ap-input" value={editBot.username || ''}
                            onChange={e => setEditBot(b => ({ ...b, username: e.target.value }))} />
                        </div>
                        <div className="ap-setting-row">
                          <span className="ap-label">About</span>
                          <input className="ap-input" value={editBot.about || ''}
                            onChange={e => setEditBot(b => ({ ...b, about: e.target.value }))} />
                        </div>
                        <div className="ap-setting-row">
                          <span className="ap-label">Avatar URL</span>
                          <input className="ap-input" value={editBot.avatar || ''}
                            onChange={e => setEditBot(b => ({ ...b, avatar: e.target.value }))} />
                        </div>
                        <div className="ap-setting-row">
                          <span className="ap-label">Gender</span>
                          <select className="ap-input" value={editBot.gender || 'other'}
                            onChange={e => setEditBot(b => ({ ...b, gender: e.target.value }))}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="ap-setting-row">
                          <span className="ap-label">Name Color (hex)</span>
                          <input className="ap-input" value={editBot.nameColor || ''}
                            placeholder="#00cc88" onChange={e => setEditBot(b => ({ ...b, nameColor: e.target.value }))} />
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="ap-btn ap-btn--primary ap-btn--sm" onClick={updateBot} disabled={saving}>
                          {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-save" /> Save</>}
                        </button>
                        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setEditBot(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* Bot card */
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                        <img src={bot.avatar || '/default_images/avatar/bot.png'}
                          style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', border:'2px solid #00cc88' }}
                          alt="" onError={e => e.target.src='/default_images/avatar/default_avatar.png'} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:15, color:'#00cc88' }}>
                            {bot.username}
                            <span style={{ fontSize:11, background:'#00cc8822', color:'#00cc88', border:'1px solid #00cc8844', borderRadius:10, padding:'1px 8px', marginLeft:8 }}>BOT</span>
                          </div>
                          {bot.about && <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{bot.about}</div>}
                          <div style={{ fontSize:11, color:'#4b5563', marginTop:2 }}>
                            Created {new Date(bot.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                          </div>
                        </div>
                        {/* Schedules count badge */}
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:20, fontWeight:900, color: bot.schedules?.length ? '#00cc88' : '#4b5563' }}>
                            {bot.schedules?.length || 0}
                          </div>
                          <div style={{ fontSize:10, color:'#6b7280' }}>schedules</div>
                        </div>
                      </div>

                      {/* Schedules mini list */}
                      {bot.schedules?.length > 0 && (
                        <div style={{ marginBottom:10 }}>
                          {bot.schedules.map(s => (
                            <div key={s._id} style={{
                              display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
                              background:'#131624', borderRadius:6, padding:'6px 10px', marginBottom:4,
                              border:`1px solid ${s.isActive ? '#00cc8830' : '#33333360'}`
                            }}>
                              <i className={`fa-solid fa-circle`} style={{ fontSize:8, color: s.isActive ? '#00cc88' : '#4b5563' }} />
                              <span style={{ fontSize:12, color:'#94a3b8', flex:1 }}>
                                Every {s.intervalMin}m · {s.messages?.length} msg{s.messages?.length!==1?'s':''}
                                {s.roomId ? ` · 1 room` : ' · All rooms'}
                              </span>
                              <span style={{ fontSize:11, color:'#6b7280', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                "{s.messages?.[0]}"
                              </span>
                              <button className={`ap-btn ap-btn--xs ${s.isActive?'ap-btn--ghost':'ap-btn--success'}`}
                                onClick={() => toggleSchedule(s)}>
                                {s.isActive ? 'Pause' : 'Resume'}
                              </button>
                              <button className="ap-btn ap-btn--xs ap-btn--danger" onClick={() => deleteSchedule(s._id)}>
                                <i className="fa-solid fa-trash" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <button className="ap-btn ap-btn--primary ap-btn--xs" onClick={() => setEditBot({ ...bot })}>
                          <i className="fa-solid fa-pencil" /> Edit
                        </button>
                        <button className="ap-btn ap-btn--success ap-btn--xs" onClick={() => { setSchedBot(bot); setSchedForm({ roomId:'', messages:[''], intervalMin:30 }); }}>
                          <i className="fa-solid fa-clock" /> Add Schedule
                        </button>
                        <button className="ap-btn ap-btn--ghost ap-btn--xs" onClick={() => { setSendBot(bot); setSendForm({ roomId:'', content:'' }); }}>
                          <i className="fa-solid fa-paper-plane" /> Send Now
                        </button>
                        <button className="ap-btn ap-btn--danger ap-btn--xs" onClick={() => deleteBot(bot)}>
                          <i className="fa-solid fa-trash" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Schedule Modal */}
          {schedBot && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}
              onClick={e => { if(e.target===e.currentTarget) setSchedBot(null); }}>
              <div style={{ background:'#0d1020', border:'1px solid #1e2436', borderRadius:14, padding:24, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:16, color:'#00cc88' }}>
                  <i className="fa-solid fa-clock" style={{ marginRight:8 }} />Schedule for {schedBot.username}
                </div>

                <div className="ap-setting-row" style={{ marginBottom:12 }}>
                  <span className="ap-label">Room (leave blank = all active rooms)</span>
                  <select className="ap-input" value={schedForm.roomId}
                    onChange={e => setSchedForm(s => ({ ...s, roomId: e.target.value }))}>
                    <option value="">All Rooms</option>
                    {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>

                <div className="ap-setting-row" style={{ marginBottom:12 }}>
                  <span className="ap-label">Interval (minutes)</span>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
                    {[5,10,15,30,60,120].map(m => (
                      <button key={m} onClick={() => setSchedForm(s => ({ ...s, intervalMin:m }))}
                        className={`ap-btn ap-btn--xs ${schedForm.intervalMin===m?'ap-btn--primary':'ap-btn--ghost'}`}>
                        {m}m
                      </button>
                    ))}
                  </div>
                  <input type="number" className="ap-input" min={1} value={schedForm.intervalMin}
                    onChange={e => setSchedForm(s => ({ ...s, intervalMin: +e.target.value }))}
                    style={{ width:100 }} />
                </div>

                <div style={{ marginBottom:12 }}>
                  <span className="ap-label" style={{ display:'block', marginBottom:6 }}>Messages (bot rotates randomly)</span>
                  {schedForm.messages.map((msg, i) => (
                    <div key={i} style={{ display:'flex', gap:6, marginBottom:6 }}>
                      <input className="ap-input" style={{ flex:1 }} placeholder={`Message ${i+1}…`}
                        value={msg} onChange={e => setSchedForm(s => ({ ...s, messages: s.messages.map((m,j) => j===i ? e.target.value : m) }))} />
                      {schedForm.messages.length > 1 && (
                        <button className="ap-btn ap-btn--danger ap-btn--xs"
                          onClick={() => setSchedForm(s => ({ ...s, messages: s.messages.filter((_,j) => j!==i) }))}>
                          <i className="fa-solid fa-minus" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button className="ap-btn ap-btn--ghost ap-btn--xs" style={{ marginTop:4 }}
                    onClick={() => setSchedForm(s => ({ ...s, messages: [...s.messages, ''] }))}>
                    <i className="fa-solid fa-plus" /> Add Message
                  </button>
                </div>

                <div style={{ display:'flex', gap:8 }}>
                  <button className="ap-btn ap-btn--success" onClick={createSchedule}>
                    <i className="fa-solid fa-clock" /> Create Schedule
                  </button>
                  <button className="ap-btn ap-btn--ghost" onClick={() => setSchedBot(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Send Modal */}
          {sendBot && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}
              onClick={e => { if(e.target===e.currentTarget) setSendBot(null); }}>
              <div style={{ background:'#0d1020', border:'1px solid #1e2436', borderRadius:14, padding:24, width:'100%', maxWidth:420 }}>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:16, color:'#00cc88' }}>
                  <i className="fa-solid fa-paper-plane" style={{ marginRight:8 }} />Send as {sendBot.username}
                </div>
                <div className="ap-setting-row" style={{ marginBottom:12 }}>
                  <span className="ap-label">Room</span>
                  <select className="ap-input" value={sendForm.roomId}
                    onChange={e => setSendForm(s => ({ ...s, roomId: e.target.value }))}>
                    <option value="">Select room…</option>
                    {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="ap-setting-row" style={{ marginBottom:16 }}>
                  <span className="ap-label">Message</span>
                  <textarea className="ap-input" rows={3} placeholder="Type message…"
                    value={sendForm.content} onChange={e => setSendForm(s => ({ ...s, content: e.target.value }))}
                    style={{ resize:'vertical' }} />
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="ap-btn ap-btn--primary" onClick={sendManual}>
                    <i className="fa-solid fa-paper-plane" /> Send
                  </button>
                  <button className="ap-btn ap-btn--ghost" onClick={() => setSendBot(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create Bot Tab ── */}
      {tab === 'create' && (
        <div>
          <div className="ap-card" style={{ maxWidth:520 }}>
            <div className="ap-card-title"><i className="fa-solid fa-robot" style={{ marginRight:6 }} />New Bot</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
              <div className="ap-setting-row">
                <span className="ap-label">Username *</span>
                <input className="ap-input" placeholder="e.g. GreetBot, NewsBot…"
                  value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div className="ap-setting-row">
                <span className="ap-label">About</span>
                <input className="ap-input" placeholder="Bot description…"
                  value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))} />
              </div>
              <div className="ap-setting-row">
                <span className="ap-label">Avatar URL</span>
                <input className="ap-input" placeholder="/default_images/avatar/bot.png"
                  value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} />
              </div>
              <div className="ap-setting-row">
                <span className="ap-label">Gender</span>
                <select className="ap-input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="ap-setting-row">
                <span className="ap-label">Name Color (hex)</span>
                <input className="ap-input" placeholder="#00cc88"
                  value={form.nameColor} onChange={e => setForm(f => ({ ...f, nameColor: e.target.value }))} />
              </div>
            </div>

            {/* Preview */}
            {form.username && (
              <div style={{ marginTop:14, padding:'10px 14px', background:'#131624', borderRadius:8, border:'1px solid #1e2436' }}>
                <div style={{ fontSize:11, color:'#6b7280', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>Preview</div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <img src={form.avatar} style={{ width:38, height:38, borderRadius:'50%', objectFit:'cover', border:'2px solid #00cc88' }}
                    alt="" onError={e => e.target.src='/default_images/avatar/default_avatar.png'} />
                  <div>
                    <span style={{ fontWeight:700, color: form.nameColor || '#00cc88', fontSize:14 }}>{form.username}</span>
                    <span style={{ fontSize:10, background:'#00cc8822', color:'#00cc88', border:'1px solid #00cc8844', borderRadius:10, padding:'1px 7px', marginLeft:6 }}>BOT</span>
                    {form.about && <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{form.about}</div>}
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop:16 }}>
              <button className="ap-btn ap-btn--success" onClick={createBot} disabled={saving || !form.username.trim()}>
                {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-robot" /> Create Bot</>}
              </button>
            </div>

            <div className="ap-card" style={{ marginTop:16, padding:'12px 14px', background:'#131624' }}>
              <div className="ap-card-title" style={{ fontSize:12 }}>How Bots Work</div>
              <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.7 }}>
                • Bot rank is automatically set — shows green "BOT" badge in chat<br/>
                • Add <strong>schedules</strong> to make bots auto-send messages at intervals<br/>
                • Use <strong>Send Now</strong> to manually send a one-time message<br/>
                • Scheduler runs every 60 seconds and checks due messages<br/>
                • If no room is set in schedule, bot sends to all active rooms
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Per-addon panels ──────────────────────────────────────────

function QuizBotPanel({ settings, onChange }) {
  const playRanks = ADDON_SYSTEM_RANKS.filter(r => r.id !== 'nobody');
  return (
    <AdCard title="QuizBot" icon="fa-brain" color="#8b5cf6" badge="Addon">
      <AdToggle label="Enable QuizBot" desc="Master toggle — shows QuizBot in chat rooms" field="quizbot_enabled" settings={settings} onChange={onChange} />
      <AdDivider />
      <AdSectionLabel icon="fa-door-open">Room Configuration</AdSectionLabel>
      <AdText label="Allowed Rooms" desc="Comma-separated room IDs where QuizBot appears (blank = all rooms)" field="quizbot_rooms" settings={settings} onChange={onChange} placeholder="room1,room2 or blank for all" />
      <AdDivider />
      <AdSectionLabel icon="fa-star">Points & Scoring</AdSectionLabel>
      <AdNumber label="Points Per Correct Answer" desc="Gold coins awarded per correct answer" field="quizbot_points_per_question" settings={settings} onChange={onChange} min={0} unit="pts" />
      <AdNumber label="Streak Bonus (3-in-a-row)" desc="Extra bonus when a user answers 3 in a row correctly" field="quizbot_streak_bonus" settings={settings} onChange={onChange} min={0} unit="pts" />
      <AdNumber label="Question Timer" desc="Seconds given to answer each question" field="quizbot_timer_sec" settings={settings} onChange={onChange} min={5} max={120} unit="sec" />
      <AdNumber label="Questions Per Round" desc="How many questions per quiz round" field="quizbot_questions_per_round" settings={settings} onChange={onChange} min={1} max={50} />
      <AdNumber label="Cooldown Between Rounds" desc="Minutes before a new quiz round can start" field="quizbot_cooldown_min" settings={settings} onChange={onChange} min={0} unit="min" />
      <AdDivider />
      <AdSectionLabel icon="fa-shield-halved">Permissions</AdSectionLabel>
      <AdToggle label="Count Bot Ranks in Leaderboard" desc="Whether bot-rank users' quiz scores appear in leaderboard" field="quizbot_count_bots" settings={settings} onChange={onChange} />
      <AdRankSelect label="Min Rank to Play" desc="Minimum rank required to participate in quizzes" field="quizbot_min_rank" settings={settings} onChange={onChange} ranks={playRanks} />
      <AdRankSelect label="Min Rank to Start Quiz" desc="Who can manually trigger a new quiz round" field="quizbot_start_rank" settings={settings} onChange={onChange} ranks={playRanks} />
    </AdCard>
  );
}

function DicePanel({ settings, onChange }) {
  const playRanks = ADDON_SYSTEM_RANKS.filter(r => r.id !== 'nobody');
  return (
    <AdCard title="Dice Game" icon="fa-dice" color="#f59e0b" badge="Addon">
      <AdToggle label="Enable Dice" desc="Master toggle for the dice gambling game" field="dice_enabled" settings={settings} onChange={onChange} />
      <AdDivider />
      <AdSectionLabel icon="fa-door-open">Room Configuration</AdSectionLabel>
      <AdText label="Allowed Rooms" desc="Comma-separated room IDs where dice is enabled (blank = all)" field="dice_rooms" settings={settings} onChange={onChange} placeholder="room1,room2 or blank for all" />
      <AdDivider />
      <AdSectionLabel icon="fa-coins">Bet & Payout</AdSectionLabel>
      <AdToggle label="Fixed Bet Mode" desc="Force all players to bet the same fixed amount" field="dice_fixed_bet" settings={settings} onChange={onChange} />
      <AdNumber label="Fixed Bet Amount" desc="Gold coins required per bet in fixed mode" field="dice_bet_amount" settings={settings} onChange={onChange} min={1} unit="gold" />
      <AdNumber label="Min Bet" desc="Minimum bet when not in fixed mode" field="dice_min_bet" settings={settings} onChange={onChange} min={1} unit="gold" />
      <AdNumber label="Max Bet" desc="Maximum bet when not in fixed mode" field="dice_max_bet" settings={settings} onChange={onChange} min={1} unit="gold" />
      <AdNumber label="Win Multiplier" desc="Payout multiplier for a winning bet (e.g. 2 = double)" field="dice_multiplier" settings={settings} onChange={onChange} min={1} unit="×" />
      <AdNumber label="House Edge %" desc="Percentage the house keeps from every bet" field="dice_house_edge" settings={settings} onChange={onChange} min={0} max={50} unit="%" />
      <AdDivider />
      <AdSectionLabel icon="fa-shield-halved">Permissions</AdSectionLabel>
      <AdRankSelect label="Min Rank to Play" desc="Minimum rank required to play dice" field="dice_min_rank" settings={settings} onChange={onChange} ranks={playRanks} />
      <AdRankSelect label="Min Rank to Start Round" desc="Who can manually start a dice round in a room" field="dice_start_rank" settings={settings} onChange={onChange} ranks={ADDON_ROOM_RANKS} />
      <AdToggle label="Allow Guests to Watch" desc="Let guest-rank users watch but not bet" field="dice_allow_guests" settings={settings} onChange={onChange} />
    </AdCard>
  );
}

function KenoPanel({ settings, onChange }) {
  const playRanks = ADDON_SYSTEM_RANKS.filter(r => r.id !== 'nobody');
  return (
    <AdCard title="Keno Game" icon="fa-grip-dots" color="#06b6d4" badge="Addon">
      <AdToggle label="Enable Keno" desc="Master toggle for the Keno number game" field="keno_enabled" settings={settings} onChange={onChange} />
      <AdDivider />
      <AdSectionLabel icon="fa-door-open">Room Configuration</AdSectionLabel>
      <AdText label="Allowed Rooms" desc="Comma-separated room IDs where Keno is enabled (blank = all)" field="keno_rooms" settings={settings} onChange={onChange} placeholder="room1,room2 or blank for all" />
      <AdDivider />
      <AdSectionLabel icon="fa-coins">Bet & Payouts</AdSectionLabel>
      <AdNumber label="Min Bet" desc="Minimum bet to enter a Keno round" field="keno_min_bet" settings={settings} onChange={onChange} min={1} unit="gold" />
      <AdNumber label="Max Bet" desc="Maximum bet per round" field="keno_max_bet" settings={settings} onChange={onChange} min={1} unit="gold" />
      <AdNumber label="Numbers to Pick" desc="How many numbers a player picks per round (1–15)" field="keno_pick_count" settings={settings} onChange={onChange} min={1} max={15} />
      <AdNumber label="Numbers Drawn" desc="How many numbers are drawn each round" field="keno_draw_count" settings={settings} onChange={onChange} min={1} max={40} />
      <AdNumber label="Jackpot Multiplier" desc="Payout multiplier when all picks match" field="keno_jackpot_multiplier" settings={settings} onChange={onChange} min={2} unit="×" />
      <AdNumber label="Round Duration" desc="Seconds per Keno round before the draw" field="keno_round_duration" settings={settings} onChange={onChange} min={10} unit="sec" />
      <AdDivider />
      <AdSectionLabel icon="fa-shield-halved">Permissions</AdSectionLabel>
      <AdRankSelect label="Min Rank to Play" desc="Minimum rank required to join a Keno round" field="keno_min_rank" settings={settings} onChange={onChange} ranks={playRanks} />
    </AdCard>
  );
}

function GroqBotPanel({ settings, onChange }) {
  const playRanks = ADDON_SYSTEM_RANKS.filter(r => r.id !== 'nobody');
  return (
    <AdCard title="Groq AI Bot" icon="fa-robot" color="#22c55e" badge="Addon">
      <AdToggle label="Enable Groq Bot" desc="Master toggle — allows users to chat with the Groq AI assistant" field="groq_enabled" settings={settings} onChange={onChange} />
      <AdDivider />
      <AdSectionLabel icon="fa-key">API Configuration</AdSectionLabel>
      <AdText label="Groq API Key" desc="Your Groq API key (stored securely, never shown to users)" field="groq_api_key" settings={settings} onChange={onChange} placeholder="gsk_..." />
      <AdText label="Model" desc="Groq model to use (e.g. llama3-8b-8192, mixtral-8x7b-32768)" field="groq_model" settings={settings} onChange={onChange} placeholder="llama3-8b-8192" />
      <AdNumber label="Max Tokens Per Reply" desc="Maximum tokens in each Groq response" field="groq_max_tokens" settings={settings} onChange={onChange} min={50} max={4096} unit="tok" />
      <AdDivider />
      <AdSectionLabel icon="fa-comment-dots">Behavior</AdSectionLabel>
      <AdText label="Bot Trigger Prefix" desc="Prefix users type to invoke Groq (e.g. !ai or @groq)" field="groq_prefix" settings={settings} onChange={onChange} placeholder="!ai" />
      <AdNumber label="Cooldown Per User" desc="Seconds a user must wait between Groq queries" field="groq_cooldown_sec" settings={settings} onChange={onChange} min={0} unit="sec" />
      <AdNumber label="Max Queries Per Hour" desc="Rate limit — queries a single user can send per hour" field="groq_hourly_limit" settings={settings} onChange={onChange} min={0} unit="req/hr" />
      <AdDivider />
      <AdSectionLabel icon="fa-shield-halved">Permissions</AdSectionLabel>
      <AdRankSelect label="Min Rank to Use Groq" desc="Minimum rank required to send queries to Groq Bot" field="groq_min_rank" settings={settings} onChange={onChange} ranks={playRanks} />
      <AdRankSelect label="Unlimited Rate Rank" desc="Ranks at or above this bypass the hourly rate limit" field="groq_unlimited_rank" settings={settings} onChange={onChange} ranks={ADDON_SYSTEM_RANKS} />
      <AdToggle label="Allow in Private Messages" desc="Let users query Groq Bot inside private chat" field="groq_allow_pm" settings={settings} onChange={onChange} />
      <AdToggle label="Log Queries to Admin" desc="Store all Groq queries visible in Chat Logs" field="groq_log_queries" settings={settings} onChange={onChange} />
    </AdCard>
  );
}

function WebcamPanel({ settings, onChange }) {
  const playRanks = ADDON_SYSTEM_RANKS.filter(r => r.id !== 'nobody');
  const broadcastRanks = ADDON_SYSTEM_RANKS.filter(r => r.id !== 'nobody' && r.id !== 'bot');
  return (
    <AdCard title="Webcam" icon="fa-camera" color="#ec4899" badge="Addon">
      <AdToggle label="Enable Webcam" desc="Master toggle for webcam streaming in chat rooms" field="webcam_enabled" settings={settings} onChange={onChange} />
      <AdDivider />
      <AdSectionLabel icon="fa-coins">Gold Deduction Per Minute (Host by Rank)</AdSectionLabel>
      <AdPerRankTable
        label="Gold Cost by Rank"
        desc="Gold deducted from the broadcaster per minute while on webcam, based on their rank"
        fieldPrefix="webcam_gold_cost"
        settings={settings}
        onChange={onChange}
        unit="gold/min"
        ranks={broadcastRanks}
      />
      <AdDivider />
      <AdSectionLabel icon="fa-gear">Webcam Options</AdSectionLabel>
      <AdNumber label="Max Simultaneous Webcams" desc="How many users can broadcast webcam at once per room" field="webcam_max_per_room" settings={settings} onChange={onChange} min={1} max={50} />
      <AdNumber label="Max Viewers Per Webcam" desc="Maximum viewers per broadcaster (0 = unlimited)" field="webcam_max_viewers" settings={settings} onChange={onChange} min={0} />
      <AdToggle label="Host Approval Required" desc="Room host must approve each webcam request" field="webcam_approval_required" settings={settings} onChange={onChange} />
      <AdToggle label="Allow Webcam Recording" desc="Let users record webcam streams" field="webcam_allow_recording" settings={settings} onChange={onChange} />
      <AdToggle label="Blur Background Option" desc="Show background blur option to broadcasters" field="webcam_blur_bg" settings={settings} onChange={onChange} />
      <AdDivider />
      <AdSectionLabel icon="fa-shield-halved">Permissions</AdSectionLabel>
      <AdRankSelect label="Min Rank to Broadcast" desc="Minimum rank required to go on webcam as host" field="webcam_broadcast_rank" settings={settings} onChange={onChange} ranks={playRanks} />
      <AdRankSelect label="Min Rank to View" desc="Minimum rank required to view a webcam stream" field="webcam_view_rank" settings={settings} onChange={onChange} ranks={ADDON_SYSTEM_RANKS} />
      <AdToggle label="Free for Staff" desc="Staff ranks (Mod, Admin, SuperAdmin, Owner) are never charged gold" field="webcam_free_for_staff" settings={settings} onChange={onChange} />
    </AdCard>
  );
}

function SpotifyPanel({ settings, onChange }) {
  const playRanks = ADDON_SYSTEM_RANKS.filter(r => r.id !== 'nobody');
  return (
    <AdCard title="Spotify" icon="fa-music" color="#1DB954" badge="Addon">
      <AdToggle label="Enable Spotify" desc="Master toggle — enables Spotify now-playing widget in rooms" field="spotify_enabled" settings={settings} onChange={onChange} />
      <AdDivider />
      <AdSectionLabel icon="fa-key">API Configuration</AdSectionLabel>
      <AdText label="Spotify Client ID" desc="Your Spotify Developer App client ID" field="spotify_client_id" settings={settings} onChange={onChange} placeholder="Spotify Client ID" />
      <AdText label="Spotify Client Secret" desc="Your Spotify Developer App client secret" field="spotify_client_secret" settings={settings} onChange={onChange} placeholder="Spotify Client Secret" />
      <AdText label="Redirect URI" desc="OAuth redirect URI registered in your Spotify app" field="spotify_redirect_uri" settings={settings} onChange={onChange} placeholder="https://yourdomain.com/spotify/callback" />
      <AdDivider />
      <AdSectionLabel icon="fa-sliders">Behavior</AdSectionLabel>
      <AdToggle label="Show in All Rooms" desc="Display Spotify widget globally, or restrict to specific rooms" field="spotify_all_rooms" settings={settings} onChange={onChange} />
      <AdText label="Allowed Rooms" desc="Comma-separated room IDs if not showing globally (blank = all)" field="spotify_rooms" settings={settings} onChange={onChange} placeholder="room1,room2 or blank for all" />
      <AdToggle label="Show Song to All Users" desc="Let everyone in the room see the current song" field="spotify_show_song" settings={settings} onChange={onChange} />
      <AdToggle label="Allow User Linking" desc="Let users link their own Spotify accounts" field="spotify_user_link" settings={settings} onChange={onChange} />
      <AdDivider />
      <AdSectionLabel icon="fa-shield-halved">Permissions</AdSectionLabel>
      <AdRankSelect label="Min Rank to Share Music" desc="Minimum rank to share a Spotify track to the room" field="spotify_share_rank" settings={settings} onChange={onChange} ranks={playRanks} />
      <AdRankSelect label="Min Rank to Control Playlist" desc="Who can add/remove songs from the shared room playlist" field="spotify_control_rank" settings={settings} onChange={onChange} ranks={ADDON_ROOM_RANKS} />
    </AdCard>
  );
}

function GiphyPanel({ settings, onChange }) {
  const playRanks = ADDON_SYSTEM_RANKS.filter(r => r.id !== 'nobody');
  return (
    <AdCard title="Giphy" icon="fa-image-portrait" color="#ff6d6d" badge="Addon">
      <AdToggle label="Enable Giphy" desc="Master toggle — allow users to send GIFs in chat" field="giphy_enabled" settings={settings} onChange={onChange} />
      <AdDivider />
      <AdSectionLabel icon="fa-key">API Configuration</AdSectionLabel>
      <AdText label="Giphy API Key" desc="Your Giphy developer API key" field="giphy_api_key" settings={settings} onChange={onChange} placeholder="Giphy API Key" />
      <AdDivider />
      <AdSectionLabel icon="fa-sliders">Behavior</AdSectionLabel>
      <AdNumber label="GIF Cooldown (per user)" desc="Seconds a user must wait before sending another GIF" field="giphy_cooldown_sec" settings={settings} onChange={onChange} min={0} unit="sec" />
      <AdNumber label="Max GIFs Per Hour" desc="Rate limit per user per hour (0 = unlimited)" field="giphy_hourly_limit" settings={settings} onChange={onChange} min={0} unit="GIFs/hr" />
      <AdToggle label="Show Trending GIFs" desc="Show trending GIFs tab in the GIF picker" field="giphy_show_trending" settings={settings} onChange={onChange} />
      <AdToggle label="Safe Search Only" desc="Restrict Giphy results to SFW content only" field="giphy_safe_search" settings={settings} onChange={onChange} />
      <AdNumber label="Max GIF Size" desc="Maximum allowed GIF size in MB" field="giphy_max_size_mb" settings={settings} onChange={onChange} min={1} max={50} unit="MB" />
      <AdDivider />
      <AdSectionLabel icon="fa-shield-halved">Permissions</AdSectionLabel>
      <AdRankSelect label="Min Rank to Send GIFs" desc="Minimum rank required to send GIFs in chat" field="giphy_min_rank" settings={settings} onChange={onChange} ranks={playRanks} />
      <AdToggle label="Allow in Private Messages" desc="Let users send GIFs in private/whisper chats" field="giphy_allow_pm" settings={settings} onChange={onChange} />
    </AdCard>
  );
}

function YouTubePanel({ settings, onChange }) {
  const playRanks = ADDON_SYSTEM_RANKS.filter(r => r.id !== 'nobody');
  return (
    <AdCard title="YouTube Player" icon="fa-youtube" color="#FF0000" badge="Addon">
      <AdToggle label="Enable YouTube Player" desc="Master toggle — allow YouTube videos to be played in rooms" field="youtube_enabled" settings={settings} onChange={onChange} />
      <AdDivider />
      <AdSectionLabel icon="fa-key">API Configuration</AdSectionLabel>
      <AdText label="YouTube Data API Key" desc="Your Google YouTube Data API v3 key" field="youtube_api_key" settings={settings} onChange={onChange} placeholder="AIza..." />
      <AdDivider />
      <AdSectionLabel icon="fa-sliders">Player Behavior</AdSectionLabel>
      <AdToggle label="Sync Playback for All Viewers" desc="All room users watch the same video at the same timestamp" field="youtube_sync" settings={settings} onChange={onChange} />
      <AdToggle label="Allow User Search" desc="Let users search YouTube from inside the room player" field="youtube_allow_search" settings={settings} onChange={onChange} />
      <AdToggle label="Allow Queue" desc="Let users add to the room video queue" field="youtube_allow_queue" settings={settings} onChange={onChange} />
      <AdNumber label="Max Queue Length" desc="Maximum videos in the room queue at once" field="youtube_max_queue" settings={settings} onChange={onChange} min={1} max={100} />
      <AdNumber label="Max Video Duration" desc="Maximum video duration in minutes (0 = unlimited)" field="youtube_max_duration_min" settings={settings} onChange={onChange} min={0} unit="min" />
      <AdToggle label="Autoplay Next" desc="Automatically play the next queued video when current ends" field="youtube_autoplay" settings={settings} onChange={onChange} />
      <AdText label="Allowed Rooms" desc="Comma-separated room IDs where YouTube is enabled (blank = all)" field="youtube_rooms" settings={settings} onChange={onChange} placeholder="room1,room2 or blank for all" />
      <AdDivider />
      <AdSectionLabel icon="fa-shield-halved">Permissions</AdSectionLabel>
      <AdRankSelect label="Min Rank to Add Video" desc="Minimum rank to add a video to the room queue" field="youtube_add_rank" settings={settings} onChange={onChange} ranks={playRanks} />
      <AdRankSelect label="Min Rank to Control Playback" desc="Who can play/pause/skip the current video" field="youtube_control_rank" settings={settings} onChange={onChange} ranks={ADDON_ROOM_RANKS} />
      <AdToggle label="Allow Guests to Watch" desc="Let guest-rank users view the player (but not control)" field="youtube_guest_view" settings={settings} onChange={onChange} />
    </AdCard>
  );
}

function GoldWalletPanel({ settings, onChange }) {
  const playRanks = ADDON_SYSTEM_RANKS.filter(r => r.id !== 'nobody');
  const earnRanks = ADDON_SYSTEM_RANKS.filter(r => r.id !== 'nobody' && r.id !== 'bot');
  return (
    <AdCard title="Gold Coins" icon="fa-coins" color="#FFD700" badge="Currency">
      <AdToggle label="Gold Enabled" desc="Master toggle — enable the gold coin wallet system" field="goldEnabled" settings={settings} onChange={onChange} />
      <AdDivider />
      <AdSectionLabel icon="fa-gift">Earning</AdSectionLabel>
      <AdNumber label="Gold Per Message" desc="Gold coins earned each time a user sends a chat message" field="goldPerMessage" settings={settings} onChange={onChange} min={0} unit="gold" />
      <AdNumber label="Login Bonus" desc="Gold given when a user logs in for the day" field="goldLoginBonus" settings={settings} onChange={onChange} min={0} unit="gold" />
      <AdNumber label="Daily Spin Reward" desc="Gold from the daily spin wheel bonus" field="goldSpinReward" settings={settings} onChange={onChange} min={0} unit="gold" />
      <AdDivider />
      <AdSectionLabel icon="fa-clock">Per-Minute Earning by Rank (Online)</AdSectionLabel>
      <AdPerRankTable
        label="Gold Per Minute"
        desc="Passive gold coins earned per minute while a user is online, set per rank — set 0 to disable for a rank"
        fieldPrefix="gold_per_min"
        settings={settings}
        onChange={onChange}
        unit="gold/min"
        ranks={earnRanks}
      />
      <AdDivider />
      <AdSectionLabel icon="fa-sliders">Limits & Transfers</AdSectionLabel>
      <AdNumber label="Max Gold Balance" desc="Maximum gold a single user can hold (0 = unlimited)" field="goldMaxBalance" settings={settings} onChange={onChange} min={0} unit="gold" />
      <AdToggle label="Wallet Transfers Enabled" desc="Allow users to send gold to other users" field="walletShareEnabled" settings={settings} onChange={onChange} />
      <AdNumber label="Min Transfer Amount" desc="Minimum gold amount per transfer" field="goldTransferMin" settings={settings} onChange={onChange} min={1} unit="gold" />
      <AdNumber label="Transfer Fee %" desc="Percentage fee on gold transfers (0 = free)" field="goldTransferFee" settings={settings} onChange={onChange} min={0} max={50} unit="%" />
      <AdDivider />
      <AdSectionLabel icon="fa-shield-halved">Permissions (synced with Permissions table)</AdSectionLabel>
      <AdRankSelect label="Min Rank to Earn Gold" desc="Minimum rank to passively earn gold coins" field="gold_earn_min_rank" settings={settings} onChange={onChange} ranks={ADDON_SYSTEM_RANKS} />
      <AdRankSelect label="Min Rank to Transfer Gold" desc="Minimum rank allowed to send gold to others" field="gold_transfer_min_rank" settings={settings} onChange={onChange} ranks={playRanks} />
    </AdCard>
  );
}

function RubyWalletPanel({ settings, onChange }) {
  const playRanks = ADDON_SYSTEM_RANKS.filter(r => r.id !== 'nobody');
  const earnRanks = ADDON_SYSTEM_RANKS.filter(r => r.id !== 'nobody' && r.id !== 'bot' && r.id !== 'guest');
  return (
    <AdCard title="Ruby Gems" icon="fa-gem" color="#e11d48" badge="Premium Currency">
      <AdToggle label="Ruby Enabled" desc="Master toggle — enable the ruby gem premium currency system" field="rubyEnabled" settings={settings} onChange={onChange} />
      <AdDivider />
      <AdSectionLabel icon="fa-gift">Earning</AdSectionLabel>
      <AdNumber label="Ruby Per Message" desc="Ruby earned per chat message (usually 0 for rarity)" field="rubyPerMessage" settings={settings} onChange={onChange} min={0} unit="ruby" />
      <AdNumber label="Login Bonus" desc="Ruby given when user logs in for the day" field="rubyLoginBonus" settings={settings} onChange={onChange} min={0} unit="ruby" />
      <AdDivider />
      <AdSectionLabel icon="fa-clock">Per-Minute Earning by Rank (Online)</AdSectionLabel>
      <AdPerRankTable
        label="Ruby Per Minute"
        desc="Passive ruby earned per minute while online, per rank — set 0 for ranks that should not earn ruby (guests excluded)"
        fieldPrefix="ruby_per_min"
        settings={settings}
        onChange={onChange}
        unit="ruby/min"
        ranks={earnRanks}
      />
      <AdDivider />
      <AdSectionLabel icon="fa-sliders">Limits & Transfers</AdSectionLabel>
      <AdNumber label="Max Ruby Balance" desc="Maximum ruby a single user can hold (0 = unlimited)" field="rubyMaxBalance" settings={settings} onChange={onChange} min={0} unit="ruby" />
      <AdToggle label="Ruby Transfers Enabled" desc="Allow users to send ruby gems to other users" field="rubyShareEnabled" settings={settings} onChange={onChange} />
      <AdNumber label="Min Ruby Transfer" desc="Minimum ruby gems per transfer" field="rubyTransferMin" settings={settings} onChange={onChange} min={1} unit="ruby" />
      <AdDivider />
      <AdSectionLabel icon="fa-shield-halved">Permissions (synced with Permissions table)</AdSectionLabel>
      <AdRankSelect label="Min Rank to Earn Ruby" desc="Minimum rank to earn ruby passively" field="ruby_earn_min_rank" settings={settings} onChange={onChange} ranks={playRanks} />
      <AdRankSelect label="Min Rank to Transfer Ruby" desc="Minimum rank allowed to send ruby gems to others" field="ruby_transfer_min_rank" settings={settings} onChange={onChange} ranks={playRanks} />
    </AdCard>
  );
}

// ── Main AddonsWallet component ───────────────────────────────

const ADDON_TABS = [
  { id: 'quizbot',  label: 'QuizBot',    icon: 'fa-brain',          color: '#8b5cf6', group: 'addons' },
  { id: 'dice',     label: 'Dice',       icon: 'fa-dice',           color: '#f59e0b', group: 'addons' },
  { id: 'keno',     label: 'Keno',       icon: 'fa-grip-dots',      color: '#06b6d4', group: 'addons' },
  { id: 'groqbot',  label: 'Groq Bot',   icon: 'fa-robot',          color: '#22c55e', group: 'addons' },
  { id: 'webcam',   label: 'Webcam',     icon: 'fa-camera',         color: '#ec4899', group: 'addons' },
  { id: 'spotify',  label: 'Spotify',    icon: 'fa-music',          color: '#1DB954', group: 'addons' },
  { id: 'giphy',    label: 'Giphy',      icon: 'fa-image-portrait', color: '#ff6d6d', group: 'addons' },
  { id: 'youtube',  label: 'YouTube',    icon: 'fa-youtube',        color: '#FF0000', group: 'addons' },
  { id: 'gold',     label: 'Gold Coins', icon: 'fa-coins',          color: '#FFD700', group: 'wallet' },
  { id: 'ruby',     label: 'Ruby Gems',  icon: 'fa-gem',            color: '#e11d48', group: 'wallet' },
];

function AddonsWallet() {
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('quizbot');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() =>
    api('/settings').then(d => setSettings(d.settings)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const handleChange = (key, val) => setSettings(s => {
    const next = { ...s, [key]: val };
    // Keep wallet permission fields in sync
    if (key === 'gold_earn_min_rank') { next.minRankWallet = val; next.allow_wallet = val; }
    if (key === 'minRankWallet')      { next.allow_wallet = val; next.gold_earn_min_rank = val; }
    return next;
  });

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const section = (activeTab === 'gold' || activeTab === 'ruby') ? 'wallet' : `addons`;
      await api(`/settings/${section}`, { method: 'PUT', body: JSON.stringify(settings) });
      const tab = ADDON_TABS.find(t => t.id === activeTab);
      toast(`${tab?.label} settings saved!`);
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const active = ADDON_TABS.find(t => t.id === activeTab);
  const addonTabs = ADDON_TABS.filter(t => t.group === 'addons');
  const walletTabs = ADDON_TABS.filter(t => t.group === 'wallet');

  const renderPanel = () => {
    if (!settings) return <div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div>;
    switch (activeTab) {
      case 'quizbot': return <QuizBotPanel settings={settings} onChange={handleChange} />;
      case 'dice':    return <DicePanel    settings={settings} onChange={handleChange} />;
      case 'keno':    return <KenoPanel    settings={settings} onChange={handleChange} />;
      case 'groqbot': return <GroqBotPanel settings={settings} onChange={handleChange} />;
      case 'webcam':  return <WebcamPanel  settings={settings} onChange={handleChange} />;
      case 'spotify': return <SpotifyPanel settings={settings} onChange={handleChange} />;
      case 'giphy':   return <GiphyPanel   settings={settings} onChange={handleChange} />;
      case 'youtube': return <YouTubePanel settings={settings} onChange={handleChange} />;
      case 'gold':    return <GoldWalletPanel settings={settings} onChange={handleChange} />;
      case 'ruby':    return <RubyWalletPanel settings={settings} onChange={handleChange} />;
      default:        return null;
    }
  };

  return (
    <div className="ap-section">
      <h2 className="ap-section-title"><i className="fa-solid fa-puzzle-piece" /> Addons &amp; Wallet</h2>

      {/* Group labels + tab strips */}
      <div className="ad-tab-group-label">
        <i className="fa-solid fa-puzzle-piece" style={{ color: '#8b5cf6' }} /> Modules
      </div>
      <div className="ad-addon-tabs">
        {addonTabs.map(tab => (
          <button key={tab.id}
            className={`ad-addon-tab ${activeTab === tab.id ? 'ad-addon-tab--active' : ''}`}
            style={activeTab === tab.id ? { borderColor: tab.color, color: tab.color, background: tab.color + '18' } : {}}
            onClick={() => setActiveTab(tab.id)}>
            <i className={`fa-solid ${tab.icon}`} style={activeTab === tab.id ? { color: tab.color } : {}} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="ad-tab-group-label" style={{ marginTop: 10 }}>
        <i className="fa-solid fa-wallet" style={{ color: '#FFD700' }} /> Wallet
      </div>
      <div className="ad-addon-tabs" style={{ marginBottom: 20 }}>
        {walletTabs.map(tab => (
          <button key={tab.id}
            className={`ad-addon-tab ${activeTab === tab.id ? 'ad-addon-tab--active' : ''}`}
            style={activeTab === tab.id ? { borderColor: tab.color, color: tab.color, background: tab.color + '18' } : {}}
            onClick={() => setActiveTab(tab.id)}>
            <i className={`fa-solid ${tab.icon}`} style={activeTab === tab.id ? { color: tab.color } : {}} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="ad-content">{renderPanel()}</div>

      {/* Save bar */}
      {settings && (
        <div className="ad-save-bar">
          <button className="ad-save-btn" onClick={handleSave} disabled={saving}>
            {saving
              ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</>
              : <><i className="fa-solid fa-floppy-disk" /> Save {active?.label} Settings</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

const ADDONS_CSS = `
  .ad-tab-group-label {
    font-size: 11px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase;
    color: #475569; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
  }
  .ad-addon-tabs { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 6px; }
  .ad-addon-tab {
    display: flex; align-items: center; gap: 7px;
    padding: 7px 14px; border-radius: 20px;
    border: 1.5px solid #2a3050; background: transparent;
    color: #94a3b8; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all .15s;
  }
  .ad-addon-tab:hover { border-color: #3b4468; color: #f1f5f9; background: #1e2436; }
  .ad-addon-tab--active { font-weight: 600; }
  .ad-addon-tab i { font-size: 12px; }
  .ad-card { background: #111827; border: 1px solid #1e2a40; border-radius: 10px; overflow: hidden; margin-bottom: 4px; }
  .ad-card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; border-bottom: 1px solid #1e2a40; background: #0f1624;
  }
  .ad-card-title-wrap { display: flex; align-items: center; gap: 9px; }
  .ad-card-icon-wrap { width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 13px; }
  .ad-card-title { font-size: 14.5px; font-weight: 600; color: #f1f5f9; }
  .ad-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 8px; }
  .ad-card-body {}
  .ad-field-row {
    display: flex; align-items: center; justify-content: space-between; gap: 14px;
    padding: 11px 16px; border-bottom: 1px solid #131d2e; min-height: 54px;
  }
  .ad-field-row:last-child { border-bottom: none; }
  .ad-field-meta { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .ad-field-label { font-size: 13px; font-weight: 500; color: #e2e8f0; }
  .ad-field-desc  { font-size: 11px; color: #64748b; line-height: 1.35; }
  .ad-switch { position: relative; display: inline-block; width: 38px; height: 21px; flex-shrink: 0; cursor: pointer; }
  .ad-switch input { opacity: 0; width: 0; height: 0; }
  .ad-switch-track { position: absolute; inset: 0; background: #1e2a40; border: 1.5px solid #2a3a55; border-radius: 11px; transition: .2s; }
  .ad-switch-track::after { content: ''; position: absolute; left: 3px; top: 50%; transform: translateY(-50%); width: 13px; height: 13px; border-radius: 50%; background: #4b5563; transition: .2s; }
  .ad-switch input:checked + .ad-switch-track { background: #1e3a5f; border-color: #3b82f6; }
  .ad-switch input:checked + .ad-switch-track::after { left: 18px; background: #3b82f6; }
  .ad-num-wrap { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
  .ad-num-input { width: 72px; background: #0f1624; border: 1px solid #1e2a40; border-radius: 6px; color: #f1f5f9; font-size: 12px; padding: 5px 8px; outline: none; text-align: right; }
  .ad-num-input--sm { width: 58px; }
  .ad-num-input:focus { border-color: #3b82f6; }
  .ad-num-unit { font-size: 10.5px; color: #475569; flex-shrink: 0; }
  .ad-text-input { width: 200px; background: #0f1624; border: 1px solid #1e2a40; border-radius: 6px; color: #f1f5f9; font-size: 12px; padding: 5px 9px; outline: none; }
  .ad-text-input:focus { border-color: #3b82f6; }
  .ad-rank-sel-wrap { position: relative; display: flex; align-items: center; min-width: 140px; flex-shrink: 0; }
  .ad-rank-sel-preview { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 500; padding: 5px 26px 5px 9px; background: #0f1624; border: 1px solid #1e2a40; border-radius: 6px; pointer-events: none; flex: 1; }
  .ad-rank-icon { width: 15px; height: 15px; object-fit: contain; }
  .ad-rank-dot  { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .ad-rank-sel-native { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; }
  .ad-rank-sel-caret { position: absolute; right: 8px; font-size: 9px; color: #475569; pointer-events: none; }
  .ad-perrank-block { padding: 4px 16px 16px; }
  .ad-perrank-header { margin-bottom: 10px; display: flex; flex-direction: column; gap: 3px; }
  .ad-perrank-grid { display: flex; flex-direction: column; gap: 4px; }
  .ad-perrank-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; background: #0f1624; border: 1px solid #131d2e; border-radius: 7px; }
  .ad-perrank-rank { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 500; }
  .ad-section-label { padding: 9px 16px 5px; font-size: 10.5px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: #334155; }
  .ad-divider { height: 1px; background: #131d2e; }
  .ad-content { margin-bottom: 20px; }
  .ad-save-bar { display: flex; justify-content: flex-end; padding: 8px 0 0; }
  .ad-save-btn { display: flex; align-items: center; gap: 7px; padding: 9px 22px; background: #1d4ed8; border: none; border-radius: 8px; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s; }
  .ad-save-btn:hover { background: #2563eb; }
  .ad-save-btn:disabled { background: #1e2a40; color: #475569; cursor: not-allowed; }
  @media (max-width: 560px) {
    .ad-text-input { width: 130px; }
    .ad-rank-sel-wrap { min-width: 110px; }
    .ad-addon-tab span { display: none; }
    .ad-addon-tab { padding: 7px 10px; }
  }
`;

const SECTIONS = [
  { id: 'dashboard',        label: 'Dashboard',         icon: null, img: '/dashboard.png' },
  { id: 'active_rooms',     label: 'Active Rooms',      icon: 'fa-tower-broadcast' },
  { id: 'members',          label: 'Members',           icon: 'fa-users' },
  { id: 'rooms',            label: 'Rooms',             icon: 'fa-door-open' },
  { id: 'reports',          label: 'Reports',           icon: 'fa-flag' },
  { id: 'gifts',            label: 'Gifts',             icon: 'fa-gift' },
  { id: 'badges',           label: 'Badges',            icon: 'fa-award' },
  { id: 'filters',          label: 'Filters',           icon: 'fa-filter' },
  { id: 'ipbans',           label: 'IP Bans',           icon: 'fa-shield-halved' },
  { id: 'news',             label: 'News',              icon: 'fa-newspaper' },
  { id: 'broadcast',        label: 'Broadcast',         icon: 'fa-bullhorn' },
  { id: 'permissions',      label: 'Permissions',       icon: 'fa-shield-halved' },
  { id: 'themes_by_rank',   label: 'Theme Permissions', icon: 'fa-palette' },
  { id: 'premium',          label: 'Premium',           icon: 'fa-crown' },
  { id: 'revenue',          label: 'Revenue',           icon: 'fa-chart-line' },
  { id: 'bots',             label: 'Bots',              icon: 'fa-robot' },
  { id: 'appearance',       label: 'Appearance',        icon: 'fa-wand-magic-sparkles' },
  { id: 'notes',            label: 'Staff Notes',       icon: 'fa-sticky-note' },
  { id: 'action_logs',      label: 'Action Logs',       icon: 'fa-shield-halved' },
  { id: 'logs',             label: 'Chat Logs',         icon: 'fa-scroll' },
  { id: 'addons',           label: 'Addons & Wallet',   icon: 'fa-puzzle-piece' },
  { id: 'settings',         label: 'Settings',          icon: 'fa-gear' },
];

export default function AdminPanel() {
  const [active, setActive]     = useState('dashboard');
  const [sideOpen, setSideOpen] = useState(false);
  const [socket, setSocket]     = useState(null);
  const [connected, setConnected] = useState(false);
  const [userRank, setUserRank]   = useState('');

  // Open in new tab logic — called from ChatRoom
  // This component IS the new-tab page rendered at /admin route

  useEffect(() => {
    const s = io(API, { auth: { token: token() }, transports: ['websocket'] });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    setSocket(s);
    return () => s.disconnect();
  }, []);

  // Fetch current user rank for owner-only gating
  useEffect(() => {
    fetch(`${API}/api/users/me`, {
      headers: { Authorization: `Bearer ${token()}` }
    }).then(r => r.json()).then(d => setUserRank(d?.user?.rank || d?.rank || '')).catch(() => {});
  }, []);

  const navigate = (id) => { setActive(id); setSideOpen(false); };

  const renderSection = () => {
    switch (active) {
      case 'dashboard':       return <Dashboard socket={socket} />;
      case 'active_rooms':    return <ActiveRooms socket={socket} />;
      case 'members':         return <Members />;
      case 'rooms':           return <Rooms socket={socket} />;
      case 'reports':         return <Reports />;
      case 'gifts':           return <Gifts />;
      case 'badges':          return <Badges />;
      case 'filters':         return <WordFilters />;
      case 'ipbans':          return <IpBans />;
      case 'news':            return <News />;
      case 'broadcast':       return <Broadcast />;
      case 'permissions':     return <Permissions />;
      case 'themes_by_rank':  return <ThemePermissionsSection />;
      case 'premium':         return <PremiumSection />;
      case 'revenue':         return <RevenueSection userRank={userRank} />;
      case 'bots':            return <BotsSection />;
      case 'appearance':      return <Appearance />;
      case 'notes':           return <StaffNotes />;
      case 'action_logs':     return <ActionLogs />;
      case 'logs':            return <ChatLogs />;
      case 'addons':          return <AddonsWallet />;
      case 'settings':        return <Settings />;
      default:                return null;
    }
  };

  return (
    <>
      {/* Font Awesome */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      <style>{AP_CSS + PERMISSIONS_CSS + MEMBERS_CSS + ADDONS_CSS + EXTRA_SECTIONS_CSS}</style>

      <div className="ap-root">
        {/* Sidebar overlay for mobile */}
        {sideOpen && <div className="ap-side-overlay" onClick={() => setSideOpen(false)} />}

        {/* Sidebar */}
        <aside className={`ap-sidebar ${sideOpen ? 'ap-sidebar--open' : ''}`}>
          <div className="ap-sidebar-header">
            <img src="/dashboard.png" alt="Admin" className="ap-sidebar-logo" onError={e => e.target.style.display='none'} />
            <span className="ap-sidebar-title">Admin Panel</span>
            <button className="ap-close-btn ap-sidebar-close" onClick={() => setSideOpen(false)}><i className="fa-solid fa-xmark" /></button>
          </div>

          <nav className="ap-nav">
            {SECTIONS.filter(s => s.id !== 'revenue' || userRank === 'owner').map(s => (
              <button key={s.id} className={`ap-nav-item ${active === s.id ? 'ap-nav-item--active' : ''}`} onClick={() => navigate(s.id)}>
                {s.img
                  ? <img src={s.img} className="ap-icon-img" alt="" onError={e => e.target.style.display='none'} />
                  : <i className={`fa-solid ${s.icon}`} style={
                      s.id === 'active_rooms' ? { color: '#22c55e' } :
                      s.id === 'action_logs'  ? { color: '#f59e0b' } :
                      s.id === 'filters'      ? { color: '#3b82f6' } : {}
                    } />
                }
                <span>{s.label}</span>
              </button>
            ))}
          </nav>

          <div className="ap-sidebar-footer">
            <span className={`ap-status-dot ap-status-dot--${connected ? 'online' : 'offline'}`} />
            <span className="ap-muted" style={{ fontSize: 11 }}>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </aside>

        {/* Main */}
        <div className="ap-main">
          {/* Top bar */}
          <header className="ap-topbar">
            <button className="ap-hamburger" onClick={() => setSideOpen(true)}><i className="fa-solid fa-bars" /></button>
            <div className="ap-topbar-title">
              {SECTIONS.find(s => s.id === active)?.img
                ? <img src={SECTIONS.find(s => s.id === active).img} className="ap-icon-img" alt="" />
                : <i className={`fa-solid ${SECTIONS.find(s => s.id === active)?.icon}`} />
              }
              {SECTIONS.find(s => s.id === active)?.label}
            </div>
            <div className="ap-topbar-right">
              <span className={`ap-status-dot ap-status-dot--${connected ? 'online' : 'offline'}`} title={connected ? 'Live' : 'Offline'} />
            </div>
          </header>

          <main className="ap-content">{renderSection()}</main>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// CSS
// ══════════════════════════════════════════════════════════════
const AP_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ap-root {
    display: flex;
    height: 100vh;
    background: #0a0c16;
    color: #f1f5f9;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    overflow: hidden;
  }

  /* ── Sidebar ── */
  .ap-sidebar {
    width: 220px;
    min-width: 220px;
    background: #0d1020;
    border-right: 1px solid #1e2436;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    transition: transform .25s ease;
    z-index: 200;
  }
  .ap-sidebar-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 14px;
    border-bottom: 1px solid #1e2436;
  }
  .ap-sidebar-logo { width: 26px; height: 26px; object-fit: contain; }
  .ap-sidebar-title { font-weight: 700; font-size: 15px; color: #f1f5f9; flex: 1; }
  .ap-sidebar-close { display: none; }
  .ap-sidebar-footer { padding: 12px 14px; display: flex; align-items: center; gap: 6px; border-top: 1px solid #1e2436; margin-top: auto; }

  .ap-nav { display: flex; flex-direction: column; padding: 8px 0; flex: 1; }
  .ap-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 14px; background: none; border: none; color: #94a3b8;
    cursor: pointer; transition: background .15s, color .15s;
    font-size: 13px; text-align: left; width: 100%;
  }
  .ap-nav-item:hover { background: #131624; color: #f1f5f9; }
  .ap-nav-item--active { background: #1a1f35; color: #3b82f6 !important; border-left: 3px solid #3b82f6; }
  .ap-nav-item i, .ap-nav-item .ap-icon-img { width: 16px; text-align: center; flex-shrink: 0; }

  /* ── Main ── */
  .ap-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .ap-topbar {
    display: flex; align-items: center; gap: 12px;
    padding: 0 16px; height: 52px;
    background: #0d1020; border-bottom: 1px solid #1e2436;
    flex-shrink: 0;
  }
  .ap-hamburger { display: none; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; }
  .ap-topbar-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; flex: 1; }
  .ap-topbar-right { display: flex; align-items: center; gap: 8px; }

  .ap-content { flex: 1; overflow-y: auto; padding: 16px; }

  /* ── Sections ── */
  .ap-section { max-width: 960px; margin: 0 auto; }
  .ap-section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .ap-subsection-title { font-size: 14px; font-weight: 600; margin: 20px 0 10px; color: #94a3b8; display: flex; align-items: center; gap: 6px; }
  .ap-icon-img { width: 18px; height: 18px; object-fit: contain; vertical-align: middle; }

  /* ── Stat Cards ── */
  .ap-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px; margin-bottom: 8px;
  }
  .ap-stats-grid--4 { grid-template-columns: repeat(4, 1fr); }
  .ap-stat-card {
    background: #0d1020;
    border: 1px solid #1e2436;
    border-left: 3px solid var(--card-accent, #3b82f6);
    border-radius: 10px; padding: 14px;
    display: flex; align-items: center; gap: 12px;
  }
  .ap-stat-icon { font-size: 20px; }
  .ap-stat-value { font-size: 22px; font-weight: 800; line-height: 1; }
  .ap-stat-label { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .ap-stat-sub { font-size: 11px; color: #22c55e; margin-top: 1px; }

  /* ── Cards ── */
  .ap-card { background: #0d1020; border: 1px solid #1e2436; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .ap-card-title { font-size: 13px; font-weight: 600; color: #94a3b8; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .5px; }

  /* ── Inputs ── */
  .ap-input {
    background: #131624; border: 1px solid #1e2436; color: #f1f5f9;
    border-radius: 7px; padding: 8px 10px; font-size: 13px; outline: none;
    width: 100%; transition: border-color .15s;
  }
  .ap-input:focus { border-color: #3b82f6; }
  .ap-input--search { flex: 1; }
  .ap-input--sm { width: 120px; }
  .ap-textarea { background: #131624; border: 1px solid #1e2436; color: #f1f5f9; border-radius: 7px; padding: 8px 10px; font-size: 13px; outline: none; width: 100%; resize: vertical; }
  .ap-textarea:focus { border-color: #3b82f6; }
  .ap-select { background: #131624; border: 1px solid #1e2436; color: #f1f5f9; border-radius: 7px; padding: 8px 10px; font-size: 13px; outline: none; cursor: pointer; }
  .ap-color-picker { width: 36px; height: 28px; border: none; background: none; cursor: pointer; padding: 0; }

  /* ── Buttons ── */
  .ap-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 8px 14px; border-radius: 7px; font-size: 13px; font-weight: 600;
    border: none; cursor: pointer; transition: opacity .15s, transform .1s; white-space: nowrap;
  }
  .ap-btn:hover { opacity: .85; }
  .ap-btn:active { transform: scale(.97); }
  .ap-btn--primary { background: #3b82f6; color: #fff; }
  .ap-btn--danger { background: #ef4444; color: #fff; }
  .ap-btn--success { background: #22c55e; color: #fff; }
  .ap-btn--warn, .ap-btn--warning { background: #f59e0b; color: #000; }
  .ap-btn--ghost { background: #1e2436; color: #94a3b8; }
  .ap-btn--sm { padding: 6px 10px; font-size: 12px; }
  .ap-btn--xs { padding: 4px 8px; font-size: 11px; }
  .ap-btn:disabled { opacity: .4; cursor: not-allowed; }

  /* ── Layout helpers ── */
  .ap-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .ap-filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .ap-action-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .ap-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
  .ap-setting-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
  .ap-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; }
  .ap-muted { font-size: 12px; color: #6b7280; }
  .ap-empty { text-align: center; color: #4b5563; padding: 24px; font-size: 13px; }
  .ap-loading { display: flex; justify-content: center; padding: 40px; font-size: 24px; color: #3b82f6; }
  .ap-refresh-row { display: flex; justify-content: flex-end; margin-top: 8px; }
  .ap-checkbox { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; }

  /* ── Toggle ── */
  .ap-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e2436; cursor: pointer; }
  .ap-toggle { width: 36px; height: 20px; cursor: pointer; }

  /* ── Table ── */
  .ap-table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid #1e2436; }
  .ap-table { width: 100%; border-collapse: collapse; }
  .ap-table th { background: #131624; padding: 10px 12px; font-size: 11px; text-align: left; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #1e2436; }
  .ap-table td { padding: 10px 12px; border-bottom: 1px solid #0f1120; font-size: 13px; }
  .ap-table tr:hover td { background: #0f1120; }
  .ap-table--sm td, .ap-table--sm th { padding: 6px 10px; font-size: 12px; }
  .ap-row--banned td { opacity: .6; }
  .ap-table-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
  .ap-user-cell { display: flex; align-items: center; gap: 8px; }
  .ap-user-cell-name { font-weight: 600; font-size: 13px; }
  .ap-user-cell-email { font-size: 11px; color: #6b7280; }

  /* ── Badges / Tags ── */
  .ap-badge { display: inline-block; padding: 2px 7px; border-radius: 20px; font-size: 10px; font-weight: 600; background: #1e2436; color: #94a3b8; }
  .ap-badge--danger { background: #ef444422; color: #ef4444; }
  .ap-badge--warn { background: #f59e0b22; color: #f59e0b; }
  .ap-badge--count { background: #3b82f622; color: #3b82f6; margin-left: 8px; font-size: 12px; }
  .ap-rank-tag { display: inline-block; padding: 2px 7px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid transparent; background: transparent; }

  /* ── Status dot ── */
  .ap-status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
  .ap-status-dot--online { background: #22c55e; }
  .ap-status-dot--offline { background: #4b5563; }

  /* ── Pagination ── */
  .ap-pagination { display: flex; align-items: center; gap: 10px; justify-content: center; padding: 12px 0; font-size: 13px; color: #94a3b8; }

  /* ── Tabs ── */
  .ap-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 14px; border-bottom: 1px solid #1e2436; padding-bottom: 4px; }
  .ap-tab-btn { background: none; border: 1px solid transparent; border-radius: 6px; color: #6b7280; padding: 5px 12px; font-size: 12px; cursor: pointer; transition: all .15s; text-transform: capitalize; }
  .ap-tab-btn:hover { color: #f1f5f9; background: #131624; }
  .ap-tab-btn--active { background: #3b82f622; border-color: #3b82f644; color: #3b82f6; }

  /* ── List ── */
  .ap-list { display: flex; flex-direction: column; gap: 0; border: 1px solid #1e2436; border-radius: 10px; overflow: hidden; }
  .ap-list-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 14px; border-bottom: 1px solid #0f1120; background: #0d1020; }
  .ap-list-item:hover { background: #131624; }
  .ap-list-item:last-child { border-bottom: none; }
  .ap-list-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .ap-list-actions { display: flex; gap: 6px; flex-shrink: 0; }

  /* ── Gift Grid v2 ── */
  .ap-gift-grid-v2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 12px; }
  .ap-gift-card-v2 { background: #0d1020; border: 1px solid #1e2436; border-radius: 12px; padding: 14px 10px 10px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 5px; position: relative; transition: border-color .15s; }
  .ap-gift-card-v2:hover { border-color: #3b82f644; }
  .ap-gift-card-v2--inactive { opacity: .5; }
  .ap-gift-card-icon { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
  .ap-gift-card-icon img { width: 44px; height: 44px; object-fit: contain; }
  .ap-gift-card-name { font-size: 12px; font-weight: 700; color: #f1f5f9; line-height: 1.2; word-break: break-word; }
  .ap-gift-card-meta { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
  .ap-gift-price-badge { font-size: 10px; font-weight: 700; color: #f59e0b; background: #f59e0b18; border: 1px solid #f59e0b33; border-radius: 20px; padding: 2px 7px; }
  .ap-gift-ruby-badge  { font-size: 10px; font-weight: 700; color: #e11d48; background: #e11d4818; border: 1px solid #e11d4833; border-radius: 20px; padding: 2px 7px; }
  .ap-gift-card-cat { font-size: 10px; color: #6b7280; }
  .ap-gift-rank-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
  .ap-gift-prem-flag { font-size: 10px; color: #aa44ff; font-weight: 700; }
  .ap-gift-inactive-flag { font-size: 9px; color: #ef4444; background: #ef444422; padding: 1px 6px; border-radius: 10px; font-weight: 700; }
  .ap-gift-card-actions { display: flex; gap: 5px; margin-top: 6px; }

  /* Gift Modal */
  .ap-gift-modal { background: #0d1020; border: 1px solid #1e2436; border-radius: 16px; width: min(640px, 96vw); max-height: 90vh; display: flex; flex-direction: column; margin: auto; }
  .ap-gift-modal-hdr { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid #1e2436; font-weight: 700; font-size: 15px; }
  .ap-gift-modal-body { flex: 1; overflow-y: auto; padding: 18px; }
  .ap-gift-modal-ftr { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 18px; border-top: 1px solid #1e2436; }
  .ap-fslabel { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }

  /* Gift Icon Picker */
  .gift-icon-picker { background: #131624; border: 1px solid #1e2436; border-radius: 10px; padding: 12px; }
  .gift-picker-tabs { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; }
  .gift-picker-tab { padding: 6px 12px; border-radius: 7px; border: 1px solid #1e2436; background: #0d1020; color: #6b7280; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all .15s; }
  .gift-picker-tab:hover, .gift-picker-tab.active { background: #1e3a5f; border-color: #3b82f6; color: #3b82f6; }
  .gift-public-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(62px, 1fr)); gap: 5px; max-height: 220px; overflow-y: auto; padding-right: 2px; }
  .gift-public-item { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 4px; border-radius: 8px; border: 2px solid transparent; cursor: pointer; background: #0d1020; transition: all .12s; }
  .gift-public-item:hover { border-color: #3b82f644; background: #131624; }
  .gift-public-item.selected { border-color: #3b82f6; background: #1e3a5f44; }
  .gift-public-item img { width: 30px; height: 30px; object-fit: contain; }
  .gift-public-item span { font-size: 9px; color: #6b7280; text-align: center; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
  .gift-preview-thumb { display: flex; align-items: center; gap: 8px; }
  .gift-preview-thumb img { width: 44px; height: 44px; object-fit: contain; border-radius: 8px; border: 1px solid #1e2436; }

  /* Rank permission chips in gift modal */
  .gift-rank-chips { display: flex; flex-wrap: wrap; gap: 5px; }
  .gift-rank-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; border: 1px solid #1e2436; background: #0d1020; color: #94a3b8; font-size: 11px; font-weight: 600; cursor: pointer; transition: all .12s; }
  .gift-rank-chip:hover { background: #131624; }
  .gift-rank-chip.selected { font-weight: 700; }

  /* ── Drawer (User Detail) ── */
  .ap-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 400; display: flex; align-items: flex-end; justify-content: flex-end; }
  .ap-drawer { width: min(420px, 100vw); height: 100vh; overflow-y: auto; background: #0d1020; border-left: 1px solid #1e2436; display: flex; flex-direction: column; }
  .ap-drawer-header { display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid #1e2436; background: #131624; }
  .ap-drawer-body { padding: 16px; flex: 1; overflow-y: auto; }
  .ap-user-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #1e2436; }
  .ap-user-name { font-weight: 700; font-size: 15px; }
  .ap-user-meta { font-size: 11px; color: #6b7280; }
  .ap-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
  .ap-detail-item { background: #131624; border-radius: 7px; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; }
  .ap-detail-item span { font-size: 10px; color: #6b7280; text-transform: uppercase; }
  .ap-detail-item strong { font-size: 14px; }
  .ap-action-group { margin-bottom: 14px; }
  .ap-close-btn { background: none; border: none; color: #6b7280; cursor: pointer; font-size: 16px; margin-left: auto; }

  /* ── Dialog ── */
  .ap-dialog { background: #0d1020; border: 1px solid #1e2436; border-radius: 12px; padding: 20px; max-width: 340px; width: 90%; margin: auto; text-align: center; }
  .ap-dialog p { margin-bottom: 16px; font-size: 14px; }
  .ap-dialog-actions { display: flex; gap: 10px; justify-content: center; }

  /* ── Appearance ── */
  .ap-rank-chip { background: none; border: 1px solid #1e2436; border-radius: 20px; padding: 4px 10px; font-size: 11px; cursor: pointer; transition: all .15s; }
  .ap-rank-chip:hover, .ap-rank-chip.active { background: #1e2436; }
  .ap-preview-bubble { min-height: 44px; display: flex; align-items: center; }

  /* ── Toast ── */
  .ap-toast {
    position: fixed; bottom: 20px; right: 20px; z-index: 9999;
    padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
    animation: apSlideUp .3s ease forwards;
    background: #0d1020; border: 1px solid #1e2436; color: #f1f5f9;
  }
  .ap-toast--success { border-color: #22c55e44; color: #22c55e; }
  .ap-toast--error { border-color: #ef444444; color: #ef4444; }
  @keyframes apSlideUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }

  /* ══ MOBILE ══ */
  @media (max-width: 768px) {
    .ap-sidebar {
      position: fixed; top: 0; left: 0; height: 100vh;
      transform: translateX(-100%); box-shadow: 4px 0 20px rgba(0,0,0,.5);
    }
    .ap-sidebar--open { transform: translateX(0); }
    .ap-sidebar-close { display: block; }
    .ap-side-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 199; }
    .ap-hamburger { display: block; }
    .ap-stats-grid--4 { grid-template-columns: repeat(2, 1fr); }
    .ap-form-grid { grid-template-columns: 1fr; }
    .ap-drawer { width: 100vw; }
  }
  @media (max-width: 480px) {
    .ap-stats-grid { grid-template-columns: 1fr 1fr; }
    .ap-content { padding: 12px; }
  }

  /* ── Reports ── */
  .rpt-root { max-width: 960px; margin: 0 auto; }
  .rpt-header { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:14px; }
  .rpt-summary-chips { display:flex; gap:8px; }
  .rpt-chip { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:20px; font-size:12px; font-weight:700; }
  .rpt-chip--pending { background:#f59e0b18; color:#f59e0b; border:1px solid #f59e0b44; }
  .rpt-chip--done    { background:#22c55e18; color:#22c55e; border:1px solid #22c55e44; }
  .rpt-search-bar { position:relative; margin-bottom:10px; }
  .rpt-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#6b7280; font-size:13px; pointer-events:none; }
  .rpt-clear-btn { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:#6b7280; cursor:pointer; font-size:13px; }
  .rpt-type-filters { display:flex; gap:4px; flex-wrap:wrap; margin-bottom:16px; }
  .rpt-section-heading { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:10px 14px; border-radius:10px; margin-bottom:8px; font-size:14px; font-weight:700; }
  .rpt-section-heading--pending { background:#f59e0b0d; border:1px solid #f59e0b33; color:#f59e0b; }
  .rpt-section-heading--done    { background:#22c55e0d; border:1px solid #22c55e33; color:#22c55e; }
  .rpt-section-sub { font-size:11px; font-weight:400; opacity:.7; }
  .rpt-count-badge { display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:22px; border-radius:11px; font-size:11px; font-weight:800; padding:0 6px; }
  .rpt-count-badge--pending { background:#f59e0b33; color:#f59e0b; }
  .rpt-count-badge--done    { background:#22c55e33; color:#22c55e; }
  .rpt-status-legend { display:flex; gap:10px; margin-left:auto; flex-wrap:wrap; }
  .rpt-legend-chip { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; }
  .rpt-list { display:flex; flex-direction:column; gap:6px; }
  .rpt-card { border-radius:10px; overflow:hidden; transition:box-shadow .15s; }
  .rpt-card--pending { border:1px solid #f59e0b33; background:#0d1020; }
  .rpt-card--pending:hover { box-shadow:0 0 0 1px #f59e0b55; }
  .rpt-card--done    { border:1px solid #1e2436; background:#0b0e1c; }
  .rpt-card--done:hover { box-shadow:0 0 0 1px #3b82f644; }
  .rpt-card-header { display:flex; align-items:center; gap:10px; padding:10px 14px; cursor:pointer; flex-wrap:wrap; background:rgba(255,255,255,.015); transition:background .12s; }
  .rpt-card-header:hover { background:rgba(255,255,255,.03); }
  .rpt-type-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:20px; font-size:11px; font-weight:700; flex-shrink:0; }
  .rpt-user-pill  { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; }
  .rpt-user-pill--sm { font-size:11px; }
  .rpt-mini-avatar { width:22px; height:22px; border-radius:50%; object-fit:cover; border:1px solid #2a3350; }
  .rpt-avatar-icon { font-size:20px; color:#4b5563; }
  .rpt-avatar-icon--sm { font-size:16px; }
  .rpt-rank-icon { width:16px; height:16px; object-fit:contain; }
  .rpt-username { max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .rpt-status-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:20px; font-size:11px; font-weight:700; flex-shrink:0; }
  .rpt-date { font-size:11px; color:#6b7280; white-space:nowrap; margin-left:auto; }
  .rpt-chevron { font-size:11px; color:#6b7280; flex-shrink:0; }
  .rpt-card-body { padding:12px 14px 14px; border-top:1px solid #1e2436; display:flex; flex-direction:column; gap:10px; }
  .rpt-detail-row { display:flex; align-items:flex-start; gap:10px; font-size:12px; }
  .rpt-detail-label { min-width:120px; color:#6b7280; font-weight:600; display:flex; align-items:center; gap:5px; flex-shrink:0; }
  .rpt-detail-val { color:#c1cde0; }
  .rpt-detail-val--desc { color:#94a3b8; white-space:pre-wrap; line-height:1.5; }
  .rpt-msg-box { background:#131624; border:1px solid #1e2436; border-left:3px solid #f59e0b; border-radius:7px; padding:10px 12px; }
  .rpt-msg-box-label { font-size:10px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:.5px; display:block; margin-bottom:6px; }
  .rpt-msg-quote { margin:0; font-size:13px; color:#e2e8f0; font-style:italic; line-height:1.5; }
  .rpt-resolution-bar { display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:7px; border:1px solid; font-size:12px; flex-wrap:wrap; }
  .rpt-res-date { margin-left:auto; font-size:11px; opacity:.7; }
  .rpt-action-bar { display:flex; gap:8px; flex-wrap:wrap; padding-top:4px; }
  @media (max-width:600px) {
    .rpt-card-header { gap:6px; }
    .rpt-date { width:100%; margin-left:0; }
    .rpt-detail-row { flex-direction:column; gap:3px; }
    .rpt-detail-label { min-width:auto; }
  }
`;

const MEMBERS_CSS = `
  /* ── Member Drawer ── */
  .mem-drawer {
    width: min(480px, 100vw); height: 100vh; overflow-y: auto;
    background: #0d1020; border-left: 1px solid #1e2436;
    display: flex; flex-direction: column;
  }
  .mem-cover {
    height: 110px; background: linear-gradient(135deg, #1a1f35, #0d1020);
    background-size: cover; background-position: center;
    position: relative; flex-shrink: 0;
  }
  .mem-cover-overlay { position:absolute; inset:0; background:rgba(0,0,0,.45); }
  .mem-close { position:absolute; top:10px; right:10px; z-index:2; background:rgba(0,0,0,.5); border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:14px; color:#f1f5f9; }

  .mem-identity { display:flex; align-items:flex-end; gap:14px; padding:0 16px 12px; border-bottom:1px solid #1e2436; margin-top:-30px; position:relative; }
  .mem-avatar-wrap { position:relative; flex-shrink:0; }
  .mem-avatar { width:72px; height:72px; border-radius:50%; object-fit:cover; border:3px solid #0d1020; box-shadow:0 0 0 2px #1e2436; }
  .mem-online-dot { position:absolute; bottom:4px; right:4px; width:14px; height:14px; border-radius:50%; border:2px solid #0d1020; }
  .mem-online-dot--on  { background:#22c55e; }
  .mem-online-dot--off { background:#4b5563; }
  .mem-namebox { flex:1; padding-top:34px; min-width:0; }
  .mem-username { font-size:17px; font-weight:800; display:flex; align-items:center; gap:6px; }
  .mem-rank-icon { width:18px; height:18px; object-fit:contain; }
  .mem-mood { font-size:12px; color:#6b7280; font-style:italic; margin-top:2px; }
  .mem-badges-row { display:flex; gap:5px; flex-wrap:wrap; margin-top:6px; }
  .mem-badge { display:inline-flex; align-items:center; gap:3px; padding:2px 7px; border-radius:20px; font-size:10px; font-weight:700; border:1px solid transparent; }
  .mem-badge--danger { background:#ef444422; color:#ef4444; border-color:#ef444444; }
  .mem-badge--warn   { background:#f59e0b22; color:#f59e0b; border-color:#f59e0b44; }
  .mem-badge--ghost  { background:#a78bfa22; color:#a78bfa; border-color:#a78bfa44; }

  .mem-tabs { display:flex; overflow-x:auto; gap:0; border-bottom:1px solid #1e2436; flex-shrink:0; }
  .mem-tab {
    flex:1; min-width:70px; padding:10px 4px; background:none; border:none; color:#6b7280;
    cursor:pointer; font-size:11px; font-weight:600; display:flex; flex-direction:column; align-items:center; gap:3px;
    transition:all .15s; white-space:nowrap; border-bottom:2px solid transparent;
  }
  .mem-tab i { font-size:14px; }
  .mem-tab:hover { color:#f1f5f9; background:#131624; }
  .mem-tab--active { color:#3b82f6; border-bottom-color:#3b82f6; background:#131624; }

  .mem-body { flex:1; overflow-y:auto; padding:16px; }
  .mem-section { display:flex; flex-direction:column; gap:2px; }

  .mem-info-row { display:flex; align-items:center; justify-content:space-between; padding:9px 0; border-bottom:1px solid #131624; gap:10px; }
  .mem-info-label { font-size:12px; color:#6b7280; font-weight:600; display:flex; align-items:center; gap:6px; flex-shrink:0; min-width:120px; }
  .mem-info-val { font-size:13px; color:#c1cde0; text-align:right; word-break:break-all; }

  .mem-divider { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.8px; color:#4b5563; padding:12px 0 6px; border-bottom:1px solid #1e2436; margin-bottom:4px; }
  .mem-grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:10px 0; }
  .mem-stat-box { background:#131624; border:1px solid #1e2436; border-radius:8px; padding:10px 6px; display:flex; flex-direction:column; align-items:center; gap:3px; text-align:center; }
  .mem-stat-box i { font-size:16px; }
  .mem-stat-box strong { font-size:15px; font-weight:800; }
  .mem-stat-box span { font-size:10px; color:#6b7280; }

  .mem-check-row { display:flex; gap:8px; flex-wrap:wrap; margin:8px 0; }
  .mem-check { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:600; }
  .mem-check--yes { background:#22c55e18; color:#22c55e; border:1px solid #22c55e33; }
  .mem-check--no  { background:#ef444418; color:#ef4444; border:1px solid #ef444433; }

  .mem-about-box { background:#131624; border:1px solid #1e2436; border-radius:8px; padding:12px; margin-bottom:12px; min-height:60px; }

  .mem-action-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin:10px 0; }
  .mem-action-card { background:#131624; border:1px solid #1e2436; border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:8px; }
  .mem-action-title { font-size:11px; font-weight:700; color:#94a3b8; display:flex; align-items:center; gap:6px; }
  .mem-action-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .mem-warn-entry { font-size:12px; color:#94a3b8; padding:4px 0; display:flex; align-items:center; gap:6px; }

  .mem-edit-block { margin-bottom:12px; }
  .mem-edit-label { font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px; display:flex; align-items:center; gap:5px; }
  .mem-edit-cur { font-size:13px; color:#c1cde0; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  .mem-ip-tag { font-family:monospace; font-size:14px; font-weight:700; color:#60a5fa; background:#1e3a5f22; border:1px solid #3b82f644; border-radius:6px; padding:4px 10px; letter-spacing:.5px; }
  .mem-ip-card { background:#131624; border:1px solid #1e2436; border-radius:8px; padding:10px; margin:8px 0; }
  .mem-same-ip-row { display:flex; align-items:center; gap:10px; padding:8px 10px; background:#131624; border:1px solid #1e2436; border-radius:8px; margin-bottom:4px; cursor:pointer; transition:background .12s; }
  .mem-same-ip-row:hover { background:#1a1f35; }
  .mem-mini-av { width:28px; height:28px; border-radius:50%; object-fit:cover; flex-shrink:0; }
  .mem-oldname-pill { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; background:#131624; border:1px solid #1e2436; border-radius:20px; font-size:12px; margin:3px 3px 3px 0; }

  /* ── Member Table dots ── */
  .mem-search-wrap { position:relative; flex:1; min-width:180px; }
  .mem-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#6b7280; font-size:12px; pointer-events:none; }
  .mem-search-clear { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:#6b7280; cursor:pointer; }
  .mem-tbl-dot { position:absolute; bottom:1px; right:1px; width:9px; height:9px; border-radius:50%; border:2px solid #0d1020; }
  .mem-tbl-dot--on  { background:#22c55e; }
  .mem-tbl-dot--off { background:#4b5563; }

  /* ── IP Bans ── */
  .ipban-list { display:flex; flex-direction:column; gap:8px; }
  .ipban-card { border:1px solid #1e2436; border-radius:10px; overflow:hidden; transition:box-shadow .15s; background:#0d1020; }
  .ipban-card--open { border-color:#3b82f644; box-shadow:0 0 0 1px #3b82f622; }
  .ipban-header { display:flex; align-items:center; gap:10px; padding:12px 14px; cursor:pointer; flex-wrap:wrap; background:rgba(255,255,255,.015); transition:background .12s; }
  .ipban-header:hover { background:rgba(255,255,255,.03); }
  .ipban-ip-badge { display:flex; align-items:center; gap:7px; font-family:monospace; font-size:14px; font-weight:800; color:#60a5fa; background:#1e3a5f22; border:1px solid #3b82f644; border-radius:6px; padding:5px 12px; flex-shrink:0; }
  .ipban-meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap; flex:1; min-width:0; }
  .ipban-reason { font-size:12px; color:#94a3b8; display:flex; align-items:center; gap:5px; }
  .ipban-date { font-size:11px; color:#6b7280; display:flex; align-items:center; gap:4px; white-space:nowrap; }
  .ipban-acct-count { font-size:11px; color:#3b82f6; background:#3b82f618; border:1px solid #3b82f633; border-radius:20px; padding:2px 8px; display:flex; align-items:center; gap:4px; }
  .ipban-body { border-top:1px solid #1e2436; padding:14px; background:#080a15; display:flex; flex-direction:column; gap:10px; }
  .ipban-section-title { font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:.6px; display:flex; align-items:center; gap:6px; margin-bottom:6px; }
  .ipban-user-card { background:#0d1020; border:1px solid #1e2436; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:10px; }
  .ipban-user-header { display:flex; align-items:center; gap:10px; }
  .ipban-avatar { width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid #1e2436; flex-shrink:0; }
  .ipban-uname { font-size:14px; font-weight:700; display:flex; align-items:center; }
  .ipban-detail-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:6px; }
  .ipban-detail-item { background:#131624; border:1px solid #1e2436; border-radius:7px; padding:7px 9px; display:flex; flex-direction:column; gap:2px; }
  .ipban-detail-item i { font-size:11px; color:#6b7280; }
  .ipban-detail-item span { font-size:10px; color:#6b7280; text-transform:uppercase; }
  .ipban-detail-item strong { font-size:12px; word-break:break-all; }
  .ipban-about-row { display:flex; flex-direction:column; gap:4px; padding:8px 10px; background:#131624; border-radius:7px; border:1px solid #1e2436; }
  .ipban-mood { font-size:12px; color:#a78bfa; font-style:italic; display:flex; align-items:center; gap:5px; }
  .ipban-about { font-size:12px; color:#94a3b8; display:flex; align-items:flex-start; gap:5px; }

  @media (max-width: 480px) {
    .mem-grid4 { grid-template-columns: repeat(2, 1fr); }
    .mem-action-grid { grid-template-columns: 1fr; }
    .ipban-detail-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;
