import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ─── helpers ────────────────────────────────────────────────
const token = () => localStorage.getItem('cgz_token')
const apiFetch = (url, opts = {}) =>
  fetch(`${API}${url}`, {
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  }).then(r => r.json())

const RANKS = ['guest','user','vipfemale','vipmale','butterfly','ninja','fairy','legend','bot','premium','moderator','admin','superadmin','owner']
const RANK_COLORS = { guest:'#888',user:'#aaa',vipfemale:'#FF4488',vipmale:'#4488FF',butterfly:'#FF66AA',ninja:'#777',fairy:'#FF88CC',legend:'#FF8800',bot:'#00cc88',premium:'#aa44ff',moderator:'#00AAFF',admin:'#FF4444',superadmin:'#FF00FF',owner:'#FFD700' }

// ─── Toast ───────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [])
  const bg = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#1a73e8'
  return (
    <div style={{ position:'fixed', bottom:28, right:28, background:bg, color:'#fff', padding:'12px 20px', borderRadius:10, fontWeight:700, fontSize:'0.875rem', zIndex:99999, boxShadow:'0 4px 20px rgba(0,0,0,.3)', animation:'slideUp .25s ease', display:'flex', alignItems:'center', gap:10 }}>
      {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} {msg}
    </div>
  )
}

// ─── Confirm Dialog ──────────────────────────────────────────
function Confirm({ msg, onYes, onNo }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1e2030', border:'1px solid #374151', borderRadius:14, padding:28, maxWidth:340, width:'90%', textAlign:'center' }}>
        <div style={{ fontSize:'2rem', marginBottom:10 }}>⚠️</div>
        <p style={{ color:'#e5e7eb', fontWeight:600, marginBottom:20 }}>{msg}</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={onNo} style={{ padding:'9px 24px', borderRadius:8, border:'1px solid #374151', background:'#2a2d3e', color:'#9ca3af', cursor:'pointer', fontWeight:600 }}>Cancel</button>
          <button onClick={onYes} style={{ padding:'9px 24px', borderRadius:8, border:'none', background:'#dc2626', color:'#fff', cursor:'pointer', fontWeight:700 }}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────
function StatCard({ icon, label, value, color = '#1a73e8' }) {
  return (
    <div style={{ background:'#1e2030', border:'1px solid #374151', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:46, height:46, borderRadius:11, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:'0.72rem', color:'#6b7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.8px' }}>{label}</div>
        <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#e5e7eb', marginTop:1 }}>{value?.toLocaleString?.() ?? value ?? '—'}</div>
      </div>
    </div>
  )
}

// ─── Section Wrapper ─────────────────────────────────────────
function Section({ title, children, action }) {
  return (
    <div style={{ background:'#1e2030', border:'1px solid #374151', borderRadius:12, overflow:'hidden', marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid #374151' }}>
        <h3 style={{ margin:0, fontSize:'0.92rem', fontWeight:800, color:'#e5e7eb' }}>{title}</h3>
        {action}
      </div>
      <div style={{ padding:'16px 18px' }}>{children}</div>
    </div>
  )
}

// ─── Input ───────────────────────────────────────────────────
function Input({ label, value, onChange, type = 'text', placeholder, style = {} }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#9ca3af', marginBottom:5 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'9px 12px', background:'#2a2d3e', border:'1.5px solid #374151', borderRadius:8, color:'#e5e7eb', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit', ...style }}
        onFocus={e => e.target.style.borderColor='#1a73e8'} onBlur={e => e.target.style.borderColor='#374151'}
      />
    </div>
  )
}

function Select({ label, value, onChange, options, style = {} }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#9ca3af', marginBottom:5 }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', padding:'9px 12px', background:'#2a2d3e', border:'1.5px solid #374151', borderRadius:8, color:'#e5e7eb', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit', ...style }}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  )
}

function Btn({ children, onClick, color = '#1a73e8', disabled, small, style = {} }) {
  const s = { padding: small ? '6px 14px' : '10px 20px', borderRadius:8, border:'none', background: disabled ? '#374151' : color, color: disabled ? '#6b7280' : '#fff', fontWeight:700, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: small ? '0.78rem' : '0.875rem', transition:'all .15s', ...style }
  return <button style={s} onClick={disabled ? undefined : onClick}>{children}</button>
}

// ─── Toggle ──────────────────────────────────────────────────
function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #2a2d3e' }}>
      <span style={{ fontSize:'0.84rem', color:'#e5e7eb', fontWeight:600 }}>{label}</span>
      <div onClick={() => onChange(!value)} style={{ width:42, height:24, borderRadius:12, background: value ? '#1a73e8' : '#374151', cursor:'pointer', position:'relative', transition:'background .2s' }}>
        <div style={{ position:'absolute', top:3, left: value ? 21 : 3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════
function Dashboard({ toast }) {
  const [stats, setStats] = useState(null)
  useEffect(() => { apiFetch('/api/admin/stats').then(d => setStats(d)).catch(() => {}) }, [])
  if (!stats) return <div style={{ textAlign:'center', padding:40, color:'#6b7280' }}>Loading stats...</div>
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:20 }}>
        <StatCard icon="👥" label="Registered" value={stats.totalUsers} color="#1a73e8"/>
        <StatCard icon="🟢" label="Online Now" value={stats.onlineUsers} color="#22c55e"/>
        <StatCard icon="♀️" label="Female" value={stats.femaleCount} color="#FF4488"/>
        <StatCard icon="♂️" label="Male" value={stats.maleCount} color="#4488FF"/>
        <StatCard icon="🔇" label="Muted" value={stats.mutedUsers} color="#f59e0b"/>
        <StatCard icon="🚫" label="Banned" value={stats.bannedUsers} color="#ef4444"/>
        <StatCard icon="🏠" label="Rooms" value={stats.totalRooms} color="#7c3aed"/>
        <StatCard icon="💬" label="Chat Logs" value={stats.totalMessages} color="#0ea5e9"/>
        <StatCard icon="📩" label="Private Logs" value={stats.totalPrivate} color="#8b5cf6"/>
        <StatCard icon="⚠️" label="Reports" value={stats.pendingReports} color="#f97316"/>
        <StatCard icon="📧" label="Contacts" value={stats.newContacts} color="#06b6d4"/>
        <StatCard icon="🎁" label="Gift Txns" value={stats.totalGifts} color="#ec4899"/>
        <StatCard icon="💰" label="Gold in Circulation" value={stats.goldInCirculation} color="#d97706"/>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  USER MANAGEMENT
// ════════════════════════════════════════════════════════════
function UserManagement({ toast, confirm, isOwnerOrAdmin, isOwner }) {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [rankFilter, setRankFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('info') // info | actions | messages | logs
  const searchTimer = useRef(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit:20 })
    if (search) params.set('search', search)
    if (rankFilter !== 'all') params.set('rank', rankFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    apiFetch(`/api/admin/users?${params}`).then(d => { setUsers(d.users||[]); setTotal(d.total||0); setPages(d.pages||1) }).finally(() => setLoading(false))
  }, [page, search, rankFilter, statusFilter])

  useEffect(() => { clearTimeout(searchTimer.current); searchTimer.current = setTimeout(load, 400) }, [load])

  // ─ User Actions ─────────────────────────────────────────
  const doAction = async (action, body = {}) => {
    const endpoints = {
      ban:      ['/api/admin/users/'+selected._id+'/ban',    'PUT'],
      unban:    ['/api/admin/users/'+selected._id+'/unban',  'PUT'],
      mute:     ['/api/admin/users/'+selected._id+'/mute',   'PUT'],
      unmute:   ['/api/admin/users/'+selected._id+'/unmute', 'PUT'],
      kick:     ['/api/admin/users/'+selected._id+'/kick',   'POST'],
      ghost:    ['/api/admin/users/'+selected._id+'/ghost',  'PUT'],
      warn:     ['/api/admin/users/'+selected._id+'/warn',   'POST'],
      rank:     ['/api/admin/users/'+selected._id+'/rank',   'PUT'],
      gold:     ['/api/admin/users/'+selected._id+'/gold',   'PUT'],
      premium:  ['/api/admin/users/'+selected._id+'/premium','PUT'],
      verify:   ['/api/admin/users/'+selected._id+'/verify', 'PUT'],
      profile:  ['/api/admin/users/'+selected._id+'/profile','PUT'],
      password: ['/api/admin/users/'+selected._id+'/password','PUT'],
      delete:   ['/api/admin/users/'+selected._id,           'DELETE'],
    }
    const [url, method] = endpoints[action]
    const d = await apiFetch(url, { method, body: JSON.stringify(body) })
    if (d.error) toast(d.error, 'error')
    else { toast(d.message, 'success'); load(); if (action === 'delete') setSelected(null); else setSelected(s => ({...s, ...body})) }
  }

  const [actionForm, setAF] = useState({ muteHours:1, muteReason:'', banReason:'', banDays:0, kickReason:'', rankNew:'user', goldAmount:100, goldAction:'add', premiumDays:30, newPassword:'', about:'', mood:'', nameColor:'', email:'' })

  return (
    <div style={{ display:'flex', gap:16, height:'100%' }}>
      {/* LEFT: user list */}
      <div style={{ width:320, flexShrink:0, background:'#1e2030', border:'1px solid #374151', borderRadius:12, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #374151', flexShrink:0 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search username / email..."
            style={{ width:'100%', padding:'8px 12px', background:'#2a2d3e', border:'1.5px solid #374151', borderRadius:8, color:'#e5e7eb', fontSize:'0.8rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
            onFocus={e => e.target.style.borderColor='#1a73e8'} onBlur={e => e.target.style.borderColor='#374151'}
          />
          <div style={{ display:'flex', gap:6, marginTop:8 }}>
            <select value={rankFilter} onChange={e => setRankFilter(e.target.value)} style={{ flex:1, padding:'6px 8px', background:'#2a2d3e', border:'1px solid #374151', borderRadius:6, color:'#9ca3af', fontSize:'0.73rem', outline:'none' }}>
              <option value="all">All Ranks</option>
              {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ flex:1, padding:'6px 8px', background:'#2a2d3e', border:'1px solid #374151', borderRadius:6, color:'#9ca3af', fontSize:'0.73rem', outline:'none' }}>
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="banned">Banned</option>
              <option value="muted">Muted</option>
            </select>
          </div>
          <div style={{ fontSize:'0.7rem', color:'#6b7280', marginTop:6 }}>{total} users found</div>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading && <div style={{ textAlign:'center', padding:20, color:'#6b7280' }}>Loading...</div>}
          {users.map(u => (
            <div key={u._id} onClick={() => { setSelected(u); setTab('info') }}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderBottom:'1px solid #2a2d3e', cursor:'pointer', background: selected?._id === u._id ? '#2a2d3e' : 'transparent', transition:'background .12s' }}
              onMouseEnter={e => { if (selected?._id !== u._id) e.currentTarget.style.background='#252838' }}
              onMouseLeave={e => { if (selected?._id !== u._id) e.currentTarget.style.background='transparent' }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <img src={u.avatar || '/default_images/avatar/default_guest.png'} alt="" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', border:`2px solid ${RANK_COLORS[u.rank]||'#374151'}` }} onError={e => e.target.src='/default_images/avatar/default_guest.png'}/>
                {u.isOnline && <span style={{ position:'absolute', bottom:0, right:0, width:8, height:8, background:'#22c55e', borderRadius:'50%', border:'1.5px solid #1e2030' }}/>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'0.82rem', fontWeight:700, color: u.isBanned ? '#ef4444' : '#e5e7eb', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.username}</div>
                <div style={{ fontSize:'0.68rem', color: RANK_COLORS[u.rank]||'#6b7280', fontWeight:600 }}>{u.rank}</div>
              </div>
              {u.isBanned && <span style={{ fontSize:'0.63rem', background:'#7f1d1d', color:'#fca5a5', padding:'1px 5px', borderRadius:4, flexShrink:0 }}>BAN</span>}
              {u.isMuted && <span style={{ fontSize:'0.63rem', background:'#78350f', color:'#fcd34d', padding:'1px 5px', borderRadius:4, flexShrink:0 }}>MUT</span>}
            </div>
          ))}
        </div>
        {/* Pagination */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderTop:'1px solid #374151', flexShrink:0 }}>
          <Btn small disabled={page<=1} onClick={() => setPage(p=>p-1)} color="#2a2d3e">‹</Btn>
          <span style={{ fontSize:'0.75rem', color:'#6b7280' }}>Page {page}/{pages}</span>
          <Btn small disabled={page>=pages} onClick={() => setPage(p=>p+1)} color="#2a2d3e">›</Btn>
        </div>
      </div>

      {/* RIGHT: user detail */}
      {selected ? (
        <div style={{ flex:1, background:'#1e2030', border:'1px solid #374151', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          {/* Header */}
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #374151', display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
            <img src={selected.avatar || '/default_images/avatar/default_guest.png'} alt="" style={{ width:50, height:50, borderRadius:'50%', border:`3px solid ${RANK_COLORS[selected.rank]||'#374151'}`, objectFit:'cover' }} onError={e => e.target.src='/default_images/avatar/default_guest.png'}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'1rem', fontWeight:900, color:'#e5e7eb' }}>{selected.username}</div>
              <div style={{ display:'flex', gap:8, marginTop:3, flexWrap:'wrap' }}>
                <span style={{ fontSize:'0.7rem', color: RANK_COLORS[selected.rank]||'#9ca3af', fontWeight:700 }}>{selected.rank}</span>
                <span style={{ fontSize:'0.7rem', color:'#6b7280' }}>{selected.email}</span>
                {selected.isBanned && <span style={{ fontSize:'0.68rem', background:'#7f1d1d', color:'#fca5a5', padding:'1px 6px', borderRadius:4 }}>BANNED</span>}
                {selected.isMuted && <span style={{ fontSize:'0.68rem', background:'#78350f', color:'#fcd34d', padding:'1px 6px', borderRadius:4 }}>MUTED</span>}
                {selected.isPremium && <span style={{ fontSize:'0.68rem', background:'#4c1d95', color:'#c4b5fd', padding:'1px 6px', borderRadius:4 }}>PREMIUM</span>}
                {selected.isVerified && <span style={{ fontSize:'0.68rem', background:'#064e3b', color:'#6ee7b7', padding:'1px 6px', borderRadius:4 }}>✓ VERIFIED</span>}
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ textAlign:'center' }}><div style={{ fontSize:'1.1rem', fontWeight:900, color:'#d97706' }}>{selected.gold||0}</div><div style={{ fontSize:'0.6rem', color:'#6b7280' }}>GOLD</div></div>
              <div style={{ textAlign:'center' }}><div style={{ fontSize:'1.1rem', fontWeight:900, color:'#1a73e8' }}>Lv.{selected.level||1}</div><div style={{ fontSize:'0.6rem', color:'#6b7280' }}>LEVEL</div></div>
              <div style={{ textAlign:'center' }}><div style={{ fontSize:'1.1rem', fontWeight:900, color:'#7c3aed' }}>{selected.totalMessages||0}</div><div style={{ fontSize:'0.6rem', color:'#6b7280' }}>MSGS</div></div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid #374151', flexShrink:0, overflowX:'auto' }}>
            {['info','actions','profile','security','messages','notes'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex:1, padding:'10px 4px', border:'none', background:'none', cursor:'pointer', color: tab===t ? '#1a73e8' : '#6b7280', borderBottom:`2px solid ${tab===t?'#1a73e8':'transparent'}`, fontWeight:700, fontSize:'0.78rem', textTransform:'capitalize', transition:'all .15s', whiteSpace:'nowrap' }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>
            {/* INFO TAB */}
            {tab === 'info' && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                  {[
                    ['User ID', selected._id],
                    ['Gender', selected.gender],
                    ['Country', selected.countryCode||'—'],
                    ['Joined', new Date(selected.createdAt).toLocaleDateString()],
                    ['Last Seen', selected.lastSeen ? new Date(selected.lastSeen).toLocaleString() : '—'],
                    ['Warnings', selected.warnings||0],
                    ['Login Streak', selected.loginStreak||0],
                    ['Total Gifts Sent', selected.totalGiftsSent||0],
                    ['Total Gifts Received', selected.totalGiftsReceived||0],
                    ['XP', selected.xp||0],
                  ].map(([k,v]) => (
                    <div key={k} style={{ background:'#2a2d3e', borderRadius:8, padding:'8px 12px' }}>
                      <div style={{ fontSize:'0.65rem', color:'#6b7280', fontWeight:700, textTransform:'uppercase' }}>{k}</div>
                      <div style={{ fontSize:'0.85rem', fontWeight:600, color:'#e5e7eb', marginTop:2, wordBreak:'break-all' }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
                {selected.about && <div style={{ background:'#2a2d3e', borderRadius:8, padding:'10px 12px', marginBottom:10 }}><div style={{ fontSize:'0.65rem', color:'#6b7280', fontWeight:700 }}>ABOUT</div><div style={{ fontSize:'0.85rem', color:'#e5e7eb', marginTop:4 }}>{selected.about}</div></div>}
                {selected.mood && <div style={{ background:'#2a2d3e', borderRadius:8, padding:'10px 12px' }}><div style={{ fontSize:'0.65rem', color:'#6b7280', fontWeight:700 }}>MOOD</div><div style={{ fontSize:'0.85rem', color:'#e5e7eb', marginTop:4, fontStyle:'italic' }}>"{selected.mood}"</div></div>}
                {selected.banReason && <div style={{ background:'#7f1d1d22', border:'1px solid #7f1d1d', borderRadius:8, padding:'10px 12px', marginTop:10 }}><div style={{ fontSize:'0.65rem', color:'#ef4444', fontWeight:700 }}>BAN REASON</div><div style={{ fontSize:'0.85rem', color:'#fca5a5', marginTop:4 }}>{selected.banReason}</div></div>}
              </div>
            )}

            {/* ACTIONS TAB */}
            {tab === 'actions' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {/* Mute */}
                <Section title="🔇 Mute User">
                  <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                    <Input label="Hours" value={actionForm.muteHours} onChange={v => setAF(p=>({...p,muteHours:v}))} type="number" style={{ width:80 }}/>
                    <Input label="Reason" value={actionForm.muteReason} onChange={v => setAF(p=>({...p,muteReason:v}))} placeholder="Optional"/>
                    <Btn color="#f59e0b" onClick={() => doAction('mute',{hours:actionForm.muteHours,reason:actionForm.muteReason})} style={{marginBottom:12,flexShrink:0}}>Mute</Btn>
                    {selected.isMuted && <Btn color="#374151" onClick={() => doAction('unmute')} style={{marginBottom:12,flexShrink:0}}>Unmute</Btn>}
                  </div>
                </Section>
                {/* Ban */}
                <Section title="🚫 Ban User">
                  <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                    <Input label="Days (0 = permanent)" value={actionForm.banDays} onChange={v => setAF(p=>({...p,banDays:v}))} type="number" style={{ width:100 }}/>
                    <Input label="Reason" value={actionForm.banReason} onChange={v => setAF(p=>({...p,banReason:v}))} placeholder="Reason..."/>
                    <Btn color="#ef4444" onClick={() => confirm('Ban this user?', () => doAction('ban',{reason:actionForm.banReason,days:actionForm.banDays}))} style={{marginBottom:12,flexShrink:0}}>Ban</Btn>
                    {selected.isBanned && <Btn color="#374151" onClick={() => doAction('unban')} style={{marginBottom:12,flexShrink:0}}>Unban</Btn>}
                  </div>
                </Section>
                {/* Kick */}
                <Section title="⚡ Kick User">
                  <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                    <Input label="Reason" value={actionForm.kickReason} onChange={v => setAF(p=>({...p,kickReason:v}))} placeholder="Reason..."/>
                    <Btn color="#f97316" onClick={() => doAction('kick',{reason:actionForm.kickReason})} style={{marginBottom:12,flexShrink:0}}>Kick</Btn>
                  </div>
                </Section>
                {/* Ghost */}
                <Section title="👻 Ghost User">
                  <div style={{ display:'flex', gap:8 }}>
                    <Btn color="#6b7280" onClick={() => doAction('ghost',{ghost:true})}>Ghost</Btn>
                    <Btn color="#374151" onClick={() => doAction('ghost',{ghost:false})}>Unghost</Btn>
                  </div>
                </Section>
                {/* Warn */}
                <Section title="⚠️ Warning">
                  <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                    <Input label="Reason" value={actionForm.muteReason} onChange={v => setAF(p=>({...p,muteReason:v}))} placeholder="Warning reason..."/>
                    <Btn color="#f59e0b" onClick={() => doAction('warn',{reason:actionForm.muteReason})} style={{marginBottom:12,flexShrink:0}}>Warn</Btn>
                  </div>
                </Section>
                {/* Rank — owner/admin only */}
                {isOwnerOrAdmin && (
                  <Section title="🏅 Change Rank">
                    <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                      <Select label="New Rank" value={actionForm.rankNew} onChange={v => setAF(p=>({...p,rankNew:v}))} options={RANKS.map(r=>({value:r,label:r}))} style={{ flex:1 }}/>
                      <Btn color="#1a73e8" onClick={() => doAction('rank',{rank:actionForm.rankNew})} style={{marginBottom:12,flexShrink:0}}>Set Rank</Btn>
                    </div>
                  </Section>
                )}
                {/* Gold — owner/admin only */}
                {isOwnerOrAdmin && (
                  <Section title="💰 Gold Management">
                    <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                      <Input label="Amount" value={actionForm.goldAmount} onChange={v => setAF(p=>({...p,goldAmount:v}))} type="number" style={{ width:100 }}/>
                      <Select label="Action" value={actionForm.goldAction} onChange={v => setAF(p=>({...p,goldAction:v}))} options={[{value:'add',label:'Add Gold'},{value:'remove',label:'Remove Gold'},{value:'set',label:'Set Gold'}]} style={{ flex:1 }}/>
                      <Btn color="#d97706" onClick={() => doAction('gold',{amount:actionForm.goldAmount,action:actionForm.goldAction})} style={{marginBottom:12,flexShrink:0}}>Apply</Btn>
                    </div>
                  </Section>
                )}
                {/* Premium — owner/admin only */}
                {isOwnerOrAdmin && (
                  <Section title="⭐ Premium">
                    <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                      <Input label="Days" value={actionForm.premiumDays} onChange={v => setAF(p=>({...p,premiumDays:v}))} type="number" style={{ width:80 }}/>
                      <Btn color="#7c3aed" onClick={() => doAction('premium',{days:actionForm.premiumDays})} style={{marginBottom:12,flexShrink:0}}>Grant Premium</Btn>
                      {selected.isPremium && <Btn color="#374151" onClick={() => doAction('premium',{remove:true})} style={{marginBottom:12,flexShrink:0}}>Remove</Btn>}
                    </div>
                  </Section>
                )}
                {/* Verify */}
                {isOwnerOrAdmin && (
                  <Section title="✅ Verification">
                    <div style={{ display:'flex', gap:8 }}>
                      <Btn color="#16a34a" onClick={() => doAction('verify',{verified:true})}>Verify User</Btn>
                      {selected.isVerified && <Btn color="#374151" onClick={() => doAction('verify',{verified:false})}>Remove Verify</Btn>}
                    </div>
                  </Section>
                )}
                {/* Delete — owner only */}
                {isOwner && (
                  <Section title="🗑️ Delete Account">
                    <Btn color="#7f1d1d" onClick={() => confirm('Permanently delete this user? This cannot be undone!', () => doAction('delete'))}>Delete Permanently</Btn>
                  </Section>
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {tab === 'profile' && isOwnerOrAdmin && (
              <div>
                <Section title="✏️ Edit Profile">
                  <Input label="Email" value={actionForm.email || selected.email || ''} onChange={v => setAF(p=>({...p,email:v}))}/>
                  <Input label="About" value={actionForm.about || selected.about || ''} onChange={v => setAF(p=>({...p,about:v}))}/>
                  <Input label="Mood" value={actionForm.mood || selected.mood || ''} onChange={v => setAF(p=>({...p,mood:v}))}/>
                  <Input label="Name Color (hex)" value={actionForm.nameColor || selected.nameColor || ''} onChange={v => setAF(p=>({...p,nameColor:v}))} placeholder="#FF0000"/>
                  <Btn color="#1a73e8" onClick={() => doAction('profile',{about:actionForm.about,mood:actionForm.mood,nameColor:actionForm.nameColor,email:actionForm.email})}>Save Profile</Btn>
                </Section>
              </div>
            )}

            {/* SECURITY TAB */}
            {tab === 'security' && (
              <div>
                {isOwner && (
                  <Section title="🔐 Reset Password">
                    <Input label="New Password" value={actionForm.newPassword} onChange={v => setAF(p=>({...p,newPassword:v}))} type="password" placeholder="Min 6 characters"/>
                    <Btn color="#ef4444" onClick={() => confirm('Reset this user\'s password?', () => doAction('password',{password:actionForm.newPassword}))}>Reset Password</Btn>
                  </Section>
                )}
                {isOwnerOrAdmin && (
                  <Section title="📋 Login History (placeholder)">
                    <p style={{ color:'#6b7280', fontSize:'0.82rem' }}>Login history feature — coming soon. Requires server-side logging to be enabled.</p>
                  </Section>
                )}
              </div>
            )}

            {/* MESSAGES TAB */}
            {tab === 'messages' && isOwnerOrAdmin && (
              <UserMessages userId={selected._id} toast={toast}/>
            )}

            {/* NOTES TAB - staff notes visible to mods+ */}
            {tab === 'notes' && (
              <AdminNotesTab userId={selected._id} toast={toast} username={selected.username}/>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#374151', fontSize:'0.9rem', flexDirection:'column', gap:10 }}>
          <div style={{ fontSize:'3rem' }}>👤</div>
          <div style={{ fontWeight:600, color:'#6b7280' }}>Select a user from the list</div>
        </div>
      )}
    </div>
  )
}

function UserMessages({ userId, toast }) {
  const [msgs, setMsgs] = useState([])
  useEffect(() => { apiFetch(`/api/admin/users/${userId}/messages`).then(d => setMsgs(d.messages||[])) }, [userId])
  return (
    <div>
      <div style={{ fontSize:'0.8rem', color:'#6b7280', marginBottom:12 }}>{msgs.length} recent messages</div>
      {msgs.map(m => (
        <div key={m._id} style={{ background:'#2a2d3e', borderRadius:8, padding:'8px 12px', marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontSize:'0.7rem', color:'#6b7280' }}>{m.roomId?.name || 'Room'}</span>
            <span style={{ fontSize:'0.7rem', color:'#6b7280' }}>{new Date(m.createdAt).toLocaleString()}</span>
          </div>
          <div style={{ fontSize:'0.85rem', color:'#e5e7eb' }}>{m.content}</div>
        </div>
      ))}
      {msgs.length === 0 && <p style={{ color:'#6b7280', fontSize:'0.82rem' }}>No messages found.</p>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  ROOM MANAGEMENT
// ════════════════════════════════════════════════════════════
function RoomManagement({ toast, confirm, isOwnerOrAdmin }) {
  const [rooms, setRooms] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ name:'', description:'', type:'public', order:0, icon:'', topic:'', isActive:true, permissions:{allowGuests:true,allowImages:true} })
  const [mode, setMode] = useState('list') // list | create | edit

  const load = () => apiFetch('/api/admin/rooms'+(search?`?search=${search}`:'')).then(d => setRooms(d.rooms||[]))
  useEffect(() => { load() }, [search])

  const save = async () => {
    const d = mode === 'create'
      ? await apiFetch('/api/admin/rooms', { method:'POST', body:JSON.stringify(form) })
      : await apiFetch('/api/admin/rooms/'+selected._id, { method:'PUT', body:JSON.stringify(form) })
    if (d.error) toast(d.error, 'error')
    else { toast(d.message, 'success'); load(); setMode('list') }
  }

  const del = async id => {
    const d = await apiFetch('/api/admin/rooms/'+id, { method:'DELETE' })
    toast(d.message||d.error, d.error?'error':'success'); load()
  }

  const clearMsgs = async id => {
    const d = await apiFetch('/api/admin/rooms/'+id+'/messages', { method:'DELETE' })
    toast(d.message||d.error, d.error?'error':'success')
  }

  const openEdit = r => { setSelected(r); setForm({name:r.name,description:r.description||'',type:r.type||'public',order:r.order||0,icon:r.icon||'',topic:r.topic||'',isActive:r.isActive,permissions:r.permissions||{allowGuests:true,allowImages:true}}); setMode('edit') }

  if (mode === 'create' || mode === 'edit') return (
    <Section title={mode==='create'?'➕ Create New Room':'✏️ Edit Room'} action={<Btn small color="#374151" onClick={()=>setMode('list')}>← Back</Btn>}>
      <div style={{ maxWidth:500 }}>
        <Input label="Room Name" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))}/>
        <Input label="Description" value={form.description} onChange={v=>setForm(p=>({...p,description:v}))}/>
        <Input label="Topic" value={form.topic} onChange={v=>setForm(p=>({...p,topic:v}))}/>
        <Input label="Icon URL" value={form.icon} onChange={v=>setForm(p=>({...p,icon:v}))}/>
        <Select label="Type" value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={['public','member','vip','staff','admin']}/>
        <Input label="Order (lower = first)" value={form.order} onChange={v=>setForm(p=>({...p,order:v}))} type="number"/>
        <Toggle label="Active" value={form.isActive} onChange={v=>setForm(p=>({...p,isActive:v}))}/>
        <Toggle label="Allow Guests" value={form.permissions?.allowGuests} onChange={v=>setForm(p=>({...p,permissions:{...p.permissions,allowGuests:v}}))}/>
        <Toggle label="Allow Image Upload" value={form.permissions?.allowImages} onChange={v=>setForm(p=>({...p,permissions:{...p.permissions,allowImages:v}}))}/>
        <div style={{ display:'flex', gap:8, marginTop:16 }}>
          <Btn onClick={save} color="#1a73e8">{mode==='create'?'Create Room':'Save Changes'}</Btn>
          <Btn onClick={()=>setMode('list')} color="#374151">Cancel</Btn>
        </div>
      </div>
    </Section>
  )

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search rooms..." style={{ flex:1, padding:'9px 12px', background:'#1e2030', border:'1.5px solid #374151', borderRadius:8, color:'#e5e7eb', fontSize:'0.875rem', outline:'none' }}/>
        {isOwnerOrAdmin && <Btn onClick={()=>{setForm({name:'',description:'',type:'public',order:0,icon:'',topic:'',isActive:true,permissions:{allowGuests:true,allowImages:true}});setMode('create')}} color="#1a73e8">+ New Room</Btn>}
      </div>
      <div style={{ display:'grid', gap:10 }}>
        {rooms.map(r => (
          <div key={r._id} style={{ background:'#1e2030', border:'1px solid #374151', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
            <img src={r.icon||'/default_images/rooms/default_room.png'} alt="" style={{ width:40, height:40, borderRadius:8, objectFit:'cover', flexShrink:0 }} onError={e=>e.target.src='/default_images/rooms/default_room.png'}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#e5e7eb', display:'flex', alignItems:'center', gap:8 }}>
                {r.name}
                <span style={{ fontSize:'0.65rem', background:'#1a73e822', color:'#60a5fa', padding:'1px 6px', borderRadius:4 }}>{r.type}</span>
                {!r.isActive && <span style={{ fontSize:'0.65rem', background:'#7f1d1d22', color:'#fca5a5', padding:'1px 6px', borderRadius:4 }}>INACTIVE</span>}
              </div>
              {r.description && <div style={{ fontSize:'0.75rem', color:'#6b7280', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.description}</div>}
              {r.topic && <div style={{ fontSize:'0.72rem', color:'#9ca3af', fontStyle:'italic' }}>📌 {r.topic}</div>}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {isOwnerOrAdmin && <Btn small color="#1a73e8" onClick={()=>openEdit(r)}>Edit</Btn>}
              {isOwnerOrAdmin && <Btn small color="#f59e0b" onClick={()=>confirm('Clear all messages in this room?',()=>clearMsgs(r._id))}>Clear</Btn>}
              {isOwnerOrAdmin && <Btn small color="#ef4444" onClick={()=>confirm('Deactivate this room?',()=>del(r._id))}>Del</Btn>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  GIFT MANAGEMENT
// ════════════════════════════════════════════════════════════
function GiftManagement({ toast, confirm, isOwnerOrAdmin }) {
  const [gifts, setGifts] = useState([])
  const [form, setForm] = useState({ name:'', icon:'', price:10, category:'basic', description:'' })
  const [editing, setEditing] = useState(null)

  const load = () => apiFetch('/api/admin/gifts').then(d => setGifts(d.gifts||[]))
  useEffect(() => { load() }, [])

  const save = async () => {
    const d = editing
      ? await apiFetch('/api/admin/gifts/'+editing._id, { method:'PUT', body:JSON.stringify(form) })
      : await apiFetch('/api/admin/gifts', { method:'POST', body:JSON.stringify(form) })
    if (d.error) toast(d.error, 'error')
    else { toast(d.message, 'success'); load(); setEditing(null); setForm({ name:'', icon:'', price:10, category:'basic', description:'' }) }
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16 }}>
      <div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
          {gifts.map(g => (
            <div key={g._id} style={{ background:'#1e2030', border:`1px solid ${editing?._id===g._id?'#1a73e8':'#374151'}`, borderRadius:10, padding:12, textAlign:'center' }}>
              <img src={g.icon} alt={g.name} style={{ width:48, height:48, objectFit:'contain', margin:'0 auto 8px' }} onError={e=>e.target.style.display='none'}/>
              <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#e5e7eb', marginBottom:4 }}>{g.name}</div>
              <div style={{ fontSize:'0.72rem', color:'#d97706', marginBottom:8 }}>💰 {g.price}</div>
              <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
                <Btn small color="#1a73e8" onClick={()=>{setEditing(g);setForm({name:g.name,icon:g.icon,price:g.price,category:g.category||'basic',description:g.description||''})}}>Edit</Btn>
                <Btn small color="#ef4444" onClick={()=>confirm('Delete this gift?',async()=>{await apiFetch('/api/admin/gifts/'+g._id,{method:'DELETE'});load();toast('Deleted!','success')})}>Del</Btn>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Section title={editing ? '✏️ Edit Gift' : '➕ Add Gift'}>
        <Input label="Name" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))}/>
        <Input label="Icon URL or /gifts/name.svg" value={form.icon} onChange={v=>setForm(p=>({...p,icon:v}))}/>
        <Input label="Price (Gold)" value={form.price} onChange={v=>setForm(p=>({...p,price:Number(v)}))} type="number"/>
        <Select label="Category" value={form.category} onChange={v=>setForm(p=>({...p,category:v}))} options={['basic','premium','love','special','food','animals']}/>
        <div style={{ display:'flex', gap:8 }}>
          <Btn onClick={save} color="#1a73e8">{editing?'Update':'Add Gift'}</Btn>
          {editing && <Btn onClick={()=>{setEditing(null);setForm({name:'',icon:'',price:10,category:'basic',description:''})}} color="#374151">Cancel</Btn>}
        </div>
      </Section>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  REPORTS
// ════════════════════════════════════════════════════════════
function Reports({ toast }) {
  const [reports, setReports] = useState([])
  const [status, setStatus] = useState('pending')

  const load = () => apiFetch(`/api/admin/reports?status=${status}`).then(d => setReports(d.reports||[]))
  useEffect(() => { load() }, [status])

  const action = async (id, type) => {
    const d = await apiFetch(`/api/admin/reports/${id}/${type}`, { method:'PUT' })
    toast(d.message||d.error, d.error?'error':'success'); load()
  }

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['pending','resolved','dismissed','all'].map(s => (
          <button key={s} onClick={()=>setStatus(s)} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:status===s?'#1a73e8':'#2a2d3e', color:status===s?'#fff':'#9ca3af', cursor:'pointer', fontWeight:700, fontSize:'0.8rem', textTransform:'capitalize' }}>{s}</button>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {reports.map(r => (
          <div key={r._id} style={{ background:'#1e2030', border:'1px solid #374151', borderRadius:10, padding:'12px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <img src={r.reporter?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width:28, height:28, borderRadius:'50%' }} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
              <div>
                <span style={{ fontSize:'0.82rem', color:'#9ca3af' }}><span style={{ color:'#e5e7eb', fontWeight:700 }}>{r.reporter?.username||'?'}</span> reported <span style={{ color:'#ef4444', fontWeight:700 }}>{r.reported?.username||'?'}</span></span>
              </div>
              <span style={{ marginLeft:'auto', fontSize:'0.65rem', color:'#6b7280' }}>{new Date(r.createdAt).toLocaleString()}</span>
            </div>
            <div style={{ background:'#2a2d3e', borderRadius:7, padding:'8px 10px', fontSize:'0.82rem', color:'#9ca3af', marginBottom:10 }}><strong style={{ color:'#e5e7eb' }}>{r.type}</strong>: {r.reason}</div>
            {r.status === 'pending' && (
              <div style={{ display:'flex', gap:8 }}>
                <Btn small color="#16a34a" onClick={()=>action(r._id,'resolve')}>✓ Resolve</Btn>
                <Btn small color="#6b7280" onClick={()=>action(r._id,'dismiss')}>Dismiss</Btn>
              </div>
            )}
            {r.status !== 'pending' && <span style={{ fontSize:'0.72rem', color:'#6b7280', fontStyle:'italic', textTransform:'capitalize' }}>Status: {r.status}</span>}
          </div>
        ))}
        {reports.length === 0 && <div style={{ textAlign:'center', padding:'40px', color:'#6b7280' }}>No {status} reports</div>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  CONTACTS
// ════════════════════════════════════════════════════════════
function Contacts({ toast, isOwnerOrAdmin }) {
  const [contacts, setContacts] = useState([])
  const [sel, setSel] = useState(null)
  const load = () => apiFetch('/api/admin/contacts').then(d => setContacts(d.contacts||[]))
  useEffect(() => { load() }, [])

  return (
    <div style={{ display:'flex', gap:16 }}>
      <div style={{ width:280, flexShrink:0, display:'flex', flexDirection:'column', gap:8 }}>
        {contacts.map(c => (
          <div key={c._id} onClick={() => { setSel(c); apiFetch(`/api/admin/contacts/${c._id}/read`,{method:'PUT'}).then(load) }}
            style={{ background:'#1e2030', border:`1px solid ${sel?._id===c._id?'#1a73e8':'#374151'}`, borderRadius:9, padding:'10px 12px', cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
              <span style={{ fontSize:'0.82rem', fontWeight:700, color:'#e5e7eb' }}>{c.name||'Anonymous'}</span>
              {c.status==='new' && <span style={{ width:8, height:8, background:'#1a73e8', borderRadius:'50%', flexShrink:0 }}/>}
            </div>
            <div style={{ fontSize:'0.72rem', color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.subject||c.message||'(no subject)'}</div>
            <div style={{ fontSize:'0.65rem', color:'#374151', marginTop:4 }}>{new Date(c.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
        {contacts.length===0 && <div style={{ textAlign:'center', padding:24, color:'#6b7280' }}>No contacts</div>}
      </div>
      {sel && (
        <div style={{ flex:1, background:'#1e2030', border:'1px solid #374151', borderRadius:12, padding:'18px 20px' }}>
          <h3 style={{ margin:'0 0 4px', color:'#e5e7eb', fontSize:'1rem' }}>{sel.name||'Anonymous'}</h3>
          <div style={{ fontSize:'0.78rem', color:'#6b7280', marginBottom:16 }}>{sel.email} · {new Date(sel.createdAt).toLocaleString()}</div>
          {sel.subject && <div style={{ fontWeight:700, color:'#9ca3af', marginBottom:8 }}>Subject: {sel.subject}</div>}
          <div style={{ background:'#2a2d3e', borderRadius:8, padding:'12px 14px', color:'#e5e7eb', lineHeight:1.7, marginBottom:16 }}>{sel.message}</div>
          {isOwnerOrAdmin && <Btn small color="#ef4444" onClick={async()=>{await apiFetch('/api/admin/contacts/'+sel._id,{method:'DELETE'});setSel(null);load();toast('Deleted!','success')}}>Delete</Btn>}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  WORD FILTER
// ════════════════════════════════════════════════════════════
function WordFilter({ toast }) {
  const [words, setWords] = useState([])
  const [tab, setTab] = useState('word')
  const [input, setInput] = useState('')

  const load = () => apiFetch('/api/admin/filters').then(d => setWords(d.words||[]))
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!input.trim()) return
    const d = await apiFetch('/api/admin/filters', { method:'POST', body:JSON.stringify({ word:input.trim(), type:tab }) })
    toast(d.message||d.error, d.error?'error':'success')
    setInput(''); load()
  }

  const del = async id => {
    await apiFetch('/api/admin/filters/'+id, { method:'DELETE' })
    load()
  }

  const filtered = words.filter(w => w.type === tab)
  const TABS = [{ id:'word', label:'Word Filter' },{ id:'spam', label:'Spam Filter' },{ id:'username', label:'Username Filter' },{ id:'email', label:'Email Filter' }]

  return (
    <div>
      <div style={{ display:'flex', gap:6, marginBottom:16, borderBottom:'1px solid #374151', paddingBottom:12 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:tab===t.id?'#1a73e8':'#2a2d3e', color:tab===t.id?'#fff':'#9ca3af', cursor:'pointer', fontWeight:700, fontSize:'0.8rem' }}>{t.label}</button>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder={`Add to ${tab} filter...`}
          style={{ flex:1, padding:'9px 12px', background:'#2a2d3e', border:'1.5px solid #374151', borderRadius:8, color:'#e5e7eb', fontSize:'0.875rem', outline:'none' }}/>
        <Btn onClick={add} color="#1a73e8">+ Add</Btn>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {filtered.map(w => (
          <div key={w.id} style={{ display:'flex', alignItems:'center', gap:6, background:'#2a2d3e', border:'1px solid #374151', borderRadius:20, padding:'4px 10px 4px 12px' }}>
            <span style={{ fontSize:'0.82rem', color:'#e5e7eb' }}>{w.word}</span>
            <button onClick={()=>del(w.id)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:12, padding:0, display:'flex' }}>✕</button>
          </div>
        ))}
        {filtered.length===0 && <div style={{ color:'#6b7280', fontSize:'0.82rem' }}>No {tab} filters yet.</div>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  IP BANS
// ════════════════════════════════════════════════════════════
function IPBans({ toast, isOwnerOrAdmin }) {
  const [bans, setBans] = useState([])
  const [ip, setIp] = useState('')
  const [reason, setReason] = useState('')

  const load = () => apiFetch('/api/admin/ip-bans').then(d => setBans(d.bans||[]))
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!ip.trim()) return toast('IP required', 'error')
    const d = await apiFetch('/api/admin/ip-bans', { method:'POST', body:JSON.stringify({ ip:ip.trim(), reason }) })
    toast(d.message||d.error, d.error?'error':'success')
    setIp(''); setReason(''); load()
  }

  return (
    <div>
      {isOwnerOrAdmin && (
        <Section title="➕ Ban IP Address">
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <Input label="IP Address" value={ip} onChange={setIp} placeholder="1.2.3.4" style={{ width:180 }}/>
            <Input label="Reason" value={reason} onChange={setReason} placeholder="Optional reason..."/>
            <Btn onClick={add} color="#ef4444" style={{ marginBottom:12, flexShrink:0 }}>Ban IP</Btn>
          </div>
        </Section>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {bans.map(b => (
          <div key={b.id} style={{ background:'#1e2030', border:'1px solid #374151', borderRadius:9, padding:'10px 14px', display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontFamily:'monospace', fontSize:'0.9rem', color:'#ef4444', fontWeight:700 }}>{b.ip}</span>
            <span style={{ flex:1, fontSize:'0.78rem', color:'#6b7280' }}>{b.reason||'No reason'}</span>
            <span style={{ fontSize:'0.68rem', color:'#374151' }}>by {b.bannedBy}</span>
            {isOwnerOrAdmin && <Btn small color="#374151" onClick={async()=>{ await apiFetch('/api/admin/ip-bans/'+b.id,{method:'DELETE'}); load(); toast('IP unbanned!','success') }}>Remove</Btn>}
          </div>
        ))}
        {bans.length===0 && <div style={{ textAlign:'center', padding:24, color:'#6b7280' }}>No IP bans</div>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  BROADCAST
// ════════════════════════════════════════════════════════════
function Broadcast({ toast }) {
  const [msg, setMsg] = useState('')
  const [type, setType] = useState('announcement')

  const send = async () => {
    if (!msg.trim()) return toast('Message required', 'error')
    const d = await apiFetch('/api/admin/broadcast', { method:'POST', body:JSON.stringify({ message:msg.trim(), type }) })
    toast(d.message||d.error, d.error?'error':'success')
    setMsg('')
  }

  return (
    <Section title="📢 Broadcast Message to All Users">
      <Select label="Type" value={type} onChange={setType} options={[{value:'announcement',label:'📣 Announcement'},{value:'warning',label:'⚠️ Warning'},{value:'maintenance',label:'🔧 Maintenance'},{value:'update',label:'🎉 Update'}]}/>
      <div style={{ marginBottom:12 }}>
        <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#9ca3af', marginBottom:5 }}>Message</label>
        <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={4} placeholder="Write your broadcast message here..."
          style={{ width:'100%', padding:'9px 12px', background:'#2a2d3e', border:'1.5px solid #374151', borderRadius:8, color:'#e5e7eb', fontSize:'0.875rem', outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }}
          onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#374151'}
        />
      </div>
      <Btn onClick={send} color="#1a73e8">📢 Send Broadcast</Btn>
    </Section>
  )
}

// ════════════════════════════════════════════════════════════
//  SITE SETTINGS
// ════════════════════════════════════════════════════════════
function SiteSettings({ toast, isOwner }) {
  const [settings, setSettings] = useState(null)
  const [tab, setTab] = useState('main')

  const load = () => apiFetch('/api/admin/settings').then(d => setSettings(d.settings))
  useEffect(() => { load() }, [])

  const save = async () => {
    const d = await apiFetch('/api/admin/settings', { method:'PUT', body:JSON.stringify(settings) })
    toast(d.message||d.error, d.error?'error':'success')
  }

  const set = (k, v) => setSettings(p => ({ ...p, [k]: v }))

  if (!settings) return <div style={{ textAlign:'center', padding:40, color:'#6b7280' }}>Loading settings...</div>
  if (!isOwner) return <div style={{ textAlign:'center', padding:40, color:'#ef4444', fontWeight:700 }}>⛔ Owner access required for Site Settings</div>

  const TABS = [
    { id:'main',     label:'🏠 Main' },
    { id:'chat',     label:'💬 Chat' },
    { id:'security', label:'🛡️ Security' },
    { id:'features', label:'🔌 Features' },
    { id:'limits',   label:'📏 Limits' },
    { id:'wallet',   label:'💰 Wallet' },
    { id:'email',    label:'📧 Email' },
    { id:'calls',    label:'📞 Calls' },
    { id:'badges',   label:'🏅 Badges' },
    { id:'level',    label:'⬆️ Levels' },
  ]

  return (
    <div style={{ display:'flex', gap:16 }}>
      {/* Sidebar nav */}
      <div style={{ width:160, flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:'block', width:'100%', padding:'9px 12px', background:tab===t.id?'#1a73e822':'none', border:tab===t.id?'1px solid #1a73e844':'1px solid transparent', borderRadius:8, color:tab===t.id?'#60a5fa':'#9ca3af', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', textAlign:'left', marginBottom:4, transition:'all .12s' }}>
            {t.label}
          </button>
        ))}
        <Btn onClick={save} color="#16a34a" style={{ width:'100%', marginTop:8 }}>💾 Save All</Btn>
      </div>

      <div style={{ flex:1 }}>
        {tab === 'main' && (
          <Section title="🏠 Main Settings">
            <Input label="Site Name" value={settings.siteName||''} onChange={v=>set('siteName',v)}/>
            <Input label="Site Description" value={settings.siteDescription||''} onChange={v=>set('siteDescription',v)}/>
            <Toggle label="Maintenance Mode" value={!!settings.maintenanceMode} onChange={v=>set('maintenanceMode',v)}/>
            <Toggle label="Allow Guest Access" value={!!settings.allowGuests} onChange={v=>set('allowGuests',v)}/>
            <Toggle label="Allow Registration" value={!!settings.allowRegistration} onChange={v=>set('allowRegistration',v)}/>
            <Toggle label="Require Email Verification" value={!!settings.requireEmailVerify} onChange={v=>set('requireEmailVerify',v)}/>
          </Section>
        )}
        {tab === 'chat' && (
          <Section title="💬 Chat Settings">
            <Input label="Max Message Length" value={settings.maxMessageLength||2000} onChange={v=>set('maxMessageLength',Number(v))} type="number"/>
            <Input label="Chat Cooldown (seconds)" value={settings.chatCooldownSec||1} onChange={v=>set('chatCooldownSec',Number(v))} type="number"/>
            <Input label="Spam Message Limit (per 10s)" value={settings.spamMsgLimit||5} onChange={v=>set('spamMsgLimit',Number(v))} type="number"/>
            <Toggle label="Guest Can Chat" value={!!settings.guestCanChat} onChange={v=>set('guestCanChat',v)}/>
            <Toggle label="Guest Can See Messages" value={!!settings.guestCanSeeMessages} onChange={v=>set('guestCanSeeMessages',v)}/>
            <Toggle label="Auto-Delete Messages" value={!!settings.autoDeleteMessages} onChange={v=>set('autoDeleteMessages',v)}/>
            <Input label="Auto-Delete After (days)" value={settings.autoDeleteDays||7} onChange={v=>set('autoDeleteDays',Number(v))} type="number"/>
          </Section>
        )}
        {tab === 'security' && (
          <Section title="🛡️ Security Settings">
            <Toggle label="Enable Captcha" value={!!settings.captchaEnabled} onChange={v=>set('captchaEnabled',v)}/>
            <Input label="Captcha Site Key" value={settings.captchaKey||''} onChange={v=>set('captchaKey',v)}/>
            <Input label="Captcha Secret Key" value={settings.captchaSecret||''} onChange={v=>set('captchaSecret',v)}/>
            <Toggle label="Block VPN/Proxy" value={!!settings.vpnBlockEnabled} onChange={v=>set('vpnBlockEnabled',v)}/>
            <Input label="ProxyCheck API Key" value={settings.vpnKey||''} onChange={v=>set('vpnKey',v)}/>
          </Section>
        )}
        {tab === 'features' && (
          <Section title="🔌 Feature Toggles">
            <Toggle label="Gift System" value={!!settings.giftEnabled} onChange={v=>set('giftEnabled',v)}/>
            <Toggle label="Video Calls" value={!!settings.callEnabled} onChange={v=>set('callEnabled',v)}/>
            <Toggle label="Webcam Broadcasting" value={!!settings.webcamEnabled} onChange={v=>set('webcamEnabled',v)}/>
            <Toggle label="Radio Player" value={!!settings.radioEnabled} onChange={v=>set('radioEnabled',v)}/>
            <Toggle label="AI Bot" value={!!settings.botEnabled} onChange={v=>set('botEnabled',v)}/>
            <Toggle label="GIPHY Integration" value={!!settings.giphyEnabled} onChange={v=>set('giphyEnabled',v)}/>
            <Toggle label="Gold Purchase" value={!!settings.goldPurchaseEnabled} onChange={v=>set('goldPurchaseEnabled',v)}/>
            <Toggle label="Dice Game" value={!!settings.diceEnabled} onChange={v=>set('diceEnabled',v)}/>
            <Toggle label="Keno Game" value={!!settings.kenoEnabled} onChange={v=>set('kenoEnabled',v)}/>
            <Toggle label="Spin Wheel" value={!!settings.spinEnabled} onChange={v=>set('spinEnabled',v)}/>
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}>
              <label style={{fontSize:'0.78rem',fontWeight:600,color:'#374151',minWidth:130}}>Dice Bet (fixed)</label>
              <input type="number" value={settings.diceBet||100} min={10} max={10000}
                onChange={e=>set('diceBet',parseInt(e.target.value)||100)}
                style={{width:80,padding:'4px 8px',border:'1.5px solid #e4e6ea',borderRadius:6,fontSize:'0.82rem',outline:'none'}}/>
              <span style={{fontSize:'0.72rem',color:'#9ca3af'}}>coins</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}>
              <label style={{fontSize:'0.78rem',fontWeight:600,color:'#374151',minWidth:130}}>Dice Payout Multiplier</label>
              <input type="number" value={settings.diceMultiplier||5.7} min={1.1} max={100} step={0.1}
                onChange={e=>set('diceMultiplier',parseFloat(e.target.value)||5.7)}
                style={{width:80,padding:'4px 8px',border:'1.5px solid #e4e6ea',borderRadius:6,fontSize:'0.82rem',outline:'none'}}/>
              <span style={{fontSize:'0.72rem',color:'#9ca3af'}}>×</span>
            </div>
          </Section>
        )}
        {tab === 'limits' && (
          <Section title="📏 Rank Permissions">
            <Select label="Min Rank for Image Upload" value={settings.minRankForImageUpload||'user'} onChange={v=>set('minRankForImageUpload',v)} options={RANKS}/>
            <Select label="Min Rank for Video Upload" value={settings.minRankForVideoUpload||'premium'} onChange={v=>set('minRankForVideoUpload',v)} options={RANKS}/>
            <Select label="Min Rank for Private Messages" value={settings.minRankForPrivateMsg||'user'} onChange={v=>set('minRankForPrivateMsg',v)} options={RANKS}/>
            <Select label="Min Rank for Calls" value={settings.minRankForCall||'user'} onChange={v=>set('minRankForCall',v)} options={RANKS}/>
          </Section>
        )}
        {tab === 'wallet' && (
          <Section title="💰 Wallet & Gold">
            <Input label="Gold Per Message" value={settings.goldPerMessage||1} onChange={v=>set('goldPerMessage',Number(v))} type="number"/>
            <Input label="Daily Login Bonus (Gold)" value={settings.goldLoginBonus||50} onChange={v=>set('goldLoginBonus',Number(v))} type="number"/>
            <Input label="Streak Bonus Per Day" value={settings.goldLoginStreak||10} onChange={v=>set('goldLoginStreak',Number(v))} type="number"/>
            <Input label="Min Bet (Games)" value={settings.minBet||1} onChange={v=>set('minBet',Number(v))} type="number"/>
            <Input label="Max Bet (Games)" value={settings.maxBet||1000} onChange={v=>set('maxBet',Number(v))} type="number"/>
          </Section>
        )}
        {tab === 'email' && (
          <Section title="📧 SMTP / Email Settings">
            <Input label="SMTP Host" value={settings.smtpHost||''} onChange={v=>set('smtpHost',v)} placeholder="smtp.gmail.com"/>
            <Input label="SMTP Port" value={settings.smtpPort||587} onChange={v=>set('smtpPort',Number(v))} type="number"/>
            <Input label="SMTP Username" value={settings.smtpUser||''} onChange={v=>set('smtpUser',v)}/>
            <Input label="SMTP Password" value={settings.smtpPass||''} onChange={v=>set('smtpPass',v)} type="password"/>
          </Section>
        )}
        {tab === 'calls' && (
          <Section title="📞 Call Settings">
            <Toggle label="Enable Calls" value={!!settings.callEnabled} onChange={v=>set('callEnabled',v)}/>
            <Toggle label="Enable Group Calls" value={!!settings.groupCallEnabled} onChange={v=>set('groupCallEnabled',v)}/>
            <Toggle label="Enable Webcam Broadcasting" value={!!settings.webcamEnabled} onChange={v=>set('webcamEnabled',v)}/>
            <Input label="Max Webcam Viewers" value={settings.maxCamViewers||20} onChange={v=>set('maxCamViewers',Number(v))} type="number"/>
          </Section>
        )}
        {tab === 'badges' && (
          <Section title="🏅 Badge Thresholds">
            <Input label="Chat Badge (messages)" value={settings.badgeChatCount||10} onChange={v=>set('badgeChatCount',Number(v))} type="number"/>
            <Input label="Beat Badge (messages)" value={settings.badgeBeatCount||100} onChange={v=>set('badgeBeatCount',Number(v))} type="number"/>
            <Input label="Gift Badge (gifts sent)" value={settings.badgeGiftCount||10} onChange={v=>set('badgeGiftCount',Number(v))} type="number"/>
            <Input label="Friend Badge (friends)" value={settings.badgeFriendCount||10} onChange={v=>set('badgeFriendCount',Number(v))} type="number"/>
          </Section>
        )}
        {tab === 'level' && (
          <Section title="⬆️ Level System">
            <Toggle label="Enable Level System" value={!!settings.levelEnabled} onChange={v=>set('levelEnabled',v)}/>
            <Input label="XP per Chat Message" value={settings.xpPerChat||1} onChange={v=>set('xpPerChat',Number(v))} type="number"/>
            <Input label="XP per Private Message" value={settings.xpPerPrivate||1} onChange={v=>set('xpPerPrivate',Number(v))} type="number"/>
            <Input label="XP per Gift Sent" value={settings.xpPerGift||5} onChange={v=>set('xpPerGift',Number(v))} type="number"/>
            <Input label="Gold Reward per Level Up" value={settings.goldPerLevel||20} onChange={v=>set('goldPerLevel',Number(v))} type="number"/>
          </Section>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  NEWS / ANNOUNCEMENTS
// ════════════════════════════════════════════════════════════
function NewsSection({ toast, confirm, isOwnerOrAdmin }) {
  const [news, setNews] = useState([])
  const [form, setForm] = useState({ title:'', body:'', type:'news' })
  const [showForm, setShowForm] = useState(false)

  const load = () => apiFetch('/api/admin/news').then(d => setNews(d.news||[]))
  useEffect(() => { load() }, [])

  const create = async () => {
    const d = await apiFetch('/api/admin/news', { method:'POST', body:JSON.stringify(form) })
    if (d.error) toast(d.error,'error')
    else { toast('News created!','success'); setShowForm(false); load() }
  }

  return (
    <div>
      {isOwnerOrAdmin && (
        <div style={{ marginBottom:16 }}>
          {!showForm ? (
            <Btn onClick={()=>setShowForm(true)} color="#1a73e8">+ New Announcement</Btn>
          ) : (
            <Section title="📝 Create Announcement" action={<Btn small color="#374151" onClick={()=>setShowForm(false)}>Cancel</Btn>}>
              <Input label="Title" value={form.title} onChange={v=>setForm(p=>({...p,title:v}))}/>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#9ca3af', marginBottom:5 }}>Body</label>
                <textarea value={form.body} onChange={e=>setForm(p=>({...p,body:e.target.value}))} rows={4}
                  style={{ width:'100%', padding:'9px 12px', background:'#2a2d3e', border:'1.5px solid #374151', borderRadius:8, color:'#e5e7eb', fontSize:'0.875rem', outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }}/>
              </div>
              <Select label="Type" value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={['news','update','maintenance','event']}/>
              <Btn onClick={create} color="#1a73e8">Publish</Btn>
            </Section>
          )}
        </div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {news.map(n => (
          <div key={n._id} style={{ background:'#1e2030', border:'1px solid #374151', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <div style={{ fontSize:'0.92rem', fontWeight:700, color:'#e5e7eb' }}>{n.title}</div>
              {isOwnerOrAdmin && <Btn small color="#ef4444" onClick={()=>confirm('Delete this news?',async()=>{await apiFetch('/api/admin/news/'+n._id,{method:'DELETE'});load();toast('Deleted!','success')})}>Del</Btn>}
            </div>
            <div style={{ fontSize:'0.82rem', color:'#9ca3af', lineHeight:1.6, marginBottom:8 }}>{n.body}</div>
            <div style={{ fontSize:'0.68rem', color:'#6b7280' }}>By {n.author?.username||'Admin'} · {new Date(n.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
        {news.length===0 && <div style={{ textAlign:'center', padding:40, color:'#6b7280' }}>No news yet</div>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  CHAT LOGS
// ════════════════════════════════════════════════════════════
function ChatLogs({ toast }) {
  const [logs, setLogs] = useState([])
  useEffect(() => { apiFetch('/api/admin/logs').then(d => setLogs(d.logs||[])) }, [])
  return (
    <div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {logs.map(m => (
          <div key={m._id} style={{ display:'flex', gap:10, padding:'7px 12px', background:'#1e2030', border:'1px solid #374151', borderRadius:8, alignItems:'flex-start' }}>
            <img src={m.sender?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, marginTop:2 }} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
            <div style={{ flex:1, minWidth:0 }}>
              <span style={{ fontSize:'0.78rem', fontWeight:700, color: RANK_COLORS[m.sender?.rank]||'#9ca3af' }}>{m.sender?.username||'?'}</span>
              <span style={{ fontSize:'0.82rem', color:'#e5e7eb', marginLeft:8, wordBreak:'break-word' }}>{m.content}</span>
            </div>
            <span style={{ fontSize:'0.65rem', color:'#6b7280', flexShrink:0 }}>{new Date(m.createdAt).toLocaleTimeString()}</span>
          </div>
        ))}
        {logs.length===0 && <div style={{ textAlign:'center', padding:40, color:'#6b7280' }}>No logs</div>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  STAFF LIST
// ════════════════════════════════════════════════════════════
function StaffList() {
  const [staff, setStaff] = useState([])
  useEffect(() => { apiFetch('/api/admin/staff').then(d => setStaff(d.staff||[])) }, [])
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
      {staff.map(s => (
        <div key={s._id} style={{ background:'#1e2030', border:'1px solid #374151', borderRadius:12, padding:'16px 14px', textAlign:'center' }}>
          <img src={s.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width:54, height:54, borderRadius:'50%', border:`3px solid ${RANK_COLORS[s.rank]||'#374151'}`, objectFit:'cover', margin:'0 auto 10px' }} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
          <div style={{ fontSize:'0.9rem', fontWeight:800, color:'#e5e7eb' }}>{s.username}</div>
          <div style={{ fontSize:'0.72rem', color: RANK_COLORS[s.rank], fontWeight:700, margin:'4px 0 8px' }}>{s.rank}</div>
          <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
            <div style={{ textAlign:'center' }}><div style={{ fontSize:'0.9rem', fontWeight:700, color:'#1a73e8' }}>Lv.{s.level||1}</div><div style={{ fontSize:'0.6rem', color:'#6b7280' }}>Level</div></div>
            <div style={{ textAlign:'center' }}><div style={{ fontSize:'0.9rem', fontWeight:700, color:'#d97706' }}>{s.gold||0}</div><div style={{ fontSize:'0.6rem', color:'#6b7280' }}>Gold</div></div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:8 }}>
            <span style={{ width:8, height:8, background:s.isOnline?'#22c55e':'#374151', borderRadius:'50%' }}/>
            <span style={{ fontSize:'0.72rem', color:'#6b7280' }}>{s.isOnline?'Online':'Offline'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  GIFT TRANSACTIONS
// ════════════════════════════════════════════════════════════
function GiftTransactions() {
  const [txns, setTxns] = useState([])
  useEffect(() => { apiFetch('/api/admin/gift-transactions').then(d => setTxns(d.transactions||[])) }, [])
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {txns.map(t => (
        <div key={t._id} style={{ background:'#1e2030', border:'1px solid #374151', borderRadius:9, padding:'10px 14px', display:'flex', alignItems:'center', gap:12 }}>
          <img src={t.gift?.icon} alt="" style={{ width:32, height:32, objectFit:'contain' }} onError={e=>e.target.style.display='none'}/>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:'0.82rem', color:'#9ca3af' }}>
              <span style={{ color:'#e5e7eb', fontWeight:700 }}>{t.from?.username||'?'}</span> → <span style={{ color:'#7c3aed', fontWeight:700 }}>{t.to?.username||'?'}</span>: {t.gift?.name||'Gift'}
            </span>
          </div>
          <span style={{ fontSize:'0.75rem', color:'#d97706', fontWeight:700 }}>💰 {t.price}</span>
          <span style={{ fontSize:'0.65rem', color:'#6b7280' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
        </div>
      ))}
      {txns.length===0 && <div style={{ textAlign:'center', padding:40, color:'#6b7280' }}>No transactions</div>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  CREATE USER
// ════════════════════════════════════════════════════════════
function CreateUser({ toast, isOwnerOrAdmin }) {
  const [form, setForm] = useState({ username:'', email:'', password:'', rank:'user', gender:'other' })
  if (!isOwnerOrAdmin) return <div style={{ color:'#ef4444', padding:20 }}>Admin access required.</div>

  const create = async () => {
    const d = await apiFetch('/api/admin/create-user', { method:'POST', body:JSON.stringify(form) })
    if (d.error) toast(d.error,'error')
    else { toast(d.message,'success'); setForm({ username:'', email:'', password:'', rank:'user', gender:'other' }) }
  }

  return (
    <Section title="👤 Create New User Account">
      <div style={{ maxWidth:400 }}>
        <Input label="Username *" value={form.username} onChange={v=>setForm(p=>({...p,username:v}))}/>
        <Input label="Email" value={form.email} onChange={v=>setForm(p=>({...p,email:v}))}/>
        <Input label="Password (default: Password@123)" value={form.password} onChange={v=>setForm(p=>({...p,password:v}))} type="password"/>
        <Select label="Rank" value={form.rank} onChange={v=>setForm(p=>({...p,rank:v}))} options={RANKS.map(r=>({value:r,label:r}))}/>
        <Select label="Gender" value={form.gender} onChange={v=>setForm(p=>({...p,gender:v}))} options={['male','female','couple','other']}/>
        <Btn onClick={create} color="#1a73e8">Create Account</Btn>
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════════════════
//  WALLET TRANSFER
// ════════════════════════════════════════════════════════════
function WalletTransfer({ toast, isOwnerOrAdmin }) {
  const [userId, setUserId] = useState('')
  const [amount, setAmount] = useState(100)
  if (!isOwnerOrAdmin) return <div style={{ color:'#ef4444', padding:20 }}>Admin access required.</div>

  const transfer = async () => {
    if (!userId.trim()) return toast('User ID required','error')
    const d = await apiFetch('/api/admin/wallet-transfer', { method:'POST', body:JSON.stringify({ toId:userId.trim(), amount }) })
    toast(d.message||d.error, d.error?'error':'success')
  }

  return (
    <Section title="💸 Gold Transfer">
      <div style={{ maxWidth:360 }}>
        <Input label="User ID" value={userId} onChange={setUserId} placeholder="MongoDB ObjectId..."/>
        <Input label="Gold Amount" value={amount} onChange={v=>setAmount(Number(v))} type="number"/>
        <Btn onClick={transfer} color="#d97706">Transfer Gold</Btn>
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════════════════
//  BADGES MANAGEMENT
// ════════════════════════════════════════════════════════════
function BadgesManagement({ toast, confirm, isOwner }) {
  const [badges, setBadges] = useState([])
  const [form, setForm] = useState({ name:'', icon:'', description:'', type:'special' })

  const load = () => apiFetch('/api/admin/badges').then(d => setBadges(d.badges||[]))
  useEffect(() => { load() }, [])

  const create = async () => {
    const d = await apiFetch('/api/admin/badges', { method:'POST', body:JSON.stringify(form) })
    if (d.error) toast(d.error,'error')
    else { toast('Badge created!','success'); load(); setForm({ name:'', icon:'', description:'', type:'special' }) }
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
      <div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:10 }}>
          {badges.map(b => (
            <div key={b._id} style={{ background:'#1e2030', border:'1px solid #374151', borderRadius:10, padding:12, textAlign:'center' }}>
              <img src={b.icon} alt={b.name} style={{ width:36, height:36, objectFit:'contain', margin:'0 auto 6px' }} onError={e=>e.target.style.display='none'}/>
              <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#e5e7eb' }}>{b.name}</div>
              {isOwner && <Btn small color="#ef4444" style={{ marginTop:8 }} onClick={()=>confirm('Delete badge?',async()=>{await apiFetch('/api/admin/badges/'+b._id,{method:'DELETE'});load();toast('Deleted!','success')})}>Del</Btn>}
            </div>
          ))}
        </div>
      </div>
      {isOwner && (
        <Section title="➕ Create Badge">
          <Input label="Name" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))}/>
          <Input label="Icon URL" value={form.icon} onChange={v=>setForm(p=>({...p,icon:v}))}/>
          <Input label="Description" value={form.description} onChange={v=>setForm(p=>({...p,description:v}))}/>
          <Select label="Type" value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={['special','chat','gift','level','rank','event']}/>
          <Btn onClick={create} color="#1a73e8">Create Badge</Btn>
        </Section>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  VIP GRANT PANEL
// ════════════════════════════════════════════════════════════
function VIPGrantPanel({ toast, isOwnerOrAdmin }) {
  const [userId, setUserId] = useState('')
  const [days, setDays] = useState(30)
  if (!isOwnerOrAdmin) return <div style={{ color:'#ef4444', padding:20 }}>Admin access required.</div>

  const grant = async () => {
    if (!userId.trim()) return toast('User ID required','error')
    const d = await apiFetch(`/api/vip/grant/${userId.trim()}`, { method:'POST', body:JSON.stringify({ days }) })
    toast(d.message||d.error, d.error?'error':'success')
  }

  return (
    <Section title="⭐ Grant VIP to User">
      <div style={{ maxWidth:400 }}>
        <p style={{ fontSize:'0.82rem', color:'#9ca3af', marginBottom:14 }}>
          Grant VIP/Premium status to a user by their MongoDB User ID. This does not cost gold — admin override.
        </p>
        <Input label="User ID (MongoDB ObjectId)" value={userId} onChange={setUserId} placeholder="6507a1b2c3d4e5f6a7b8c9d0"/>
        <Input label="Days to Grant" value={days} onChange={v=>setDays(Number(v))} type="number"/>
        <Btn onClick={grant} color="#7c3aed">⭐ Grant VIP</Btn>
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════════════════
//  ADMIN NOTES TAB
// ════════════════════════════════════════════════════════════
function AdminNotesTab({ userId, toast, username }) {
  const [notes, setNotes] = useState([])
  const [noteText, setNoteText] = useState('')
  const [severity, setSeverity] = useState('info')

  const load = () => apiFetch(`/api/admin-notes/${userId}`).then(d => setNotes(d.notes||[]))
  useEffect(() => { load() }, [userId])

  const addNote = async () => {
    if (!noteText.trim()) return
    const d = await apiFetch(`/api/admin-notes/${userId}`, { method:'POST', body:JSON.stringify({ note:noteText.trim(), severity }) })
    if (d.error) toast(d.error,'error')
    else { toast('Note added!','success'); setNoteText(''); load() }
  }

  const deleteNote = async (noteId) => {
    await apiFetch(`/api/admin-notes/${noteId}`, { method:'DELETE' })
    load()
  }

  const SEVERITY_COLORS = { info:'#1a73e8', warning:'#f59e0b', critical:'#ef4444' }

  return (
    <div>
      <p style={{ fontSize:'0.78rem', color:'#6b7280', marginBottom:14 }}>
        📋 Private staff notes about <strong style={{ color:'#e5e7eb' }}>{username}</strong>. Visible to moderators+.
      </p>

      {/* Add note */}
      <div style={{ background:'#2a2d3e', border:'1px solid #374151', borderRadius:10, padding:14, marginBottom:16 }}>
        <div style={{ marginBottom:10 }}>
          <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#9ca3af', marginBottom:5 }}>Severity</label>
          <div style={{ display:'flex', gap:8 }}>
            {['info','warning','critical'].map(s => (
              <button key={s} onClick={() => setSeverity(s)}
                style={{ padding:'5px 12px', borderRadius:7, border:`2px solid ${severity===s?SEVERITY_COLORS[s]:'#374151'}`, background:severity===s?SEVERITY_COLORS[s]+'22':'none', color:severity===s?SEVERITY_COLORS[s]:'#6b7280', cursor:'pointer', fontWeight:700, fontSize:'0.75rem', textTransform:'capitalize', transition:'all .15s' }}>
                {s==='info'?'ℹ️':s==='warning'?'⚠️':'🚨'} {s}
              </button>
            ))}
          </div>
        </div>
        <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={3}
          placeholder="Add a staff note about this user..."
          style={{ width:'100%', padding:'9px 12px', background:'#1e2030', border:'1.5px solid #374151', borderRadius:8, color:'#e5e7eb', fontSize:'0.875rem', outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', marginBottom:10 }}
          onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#374151'}
        />
        <Btn onClick={addNote} color="#1a73e8" small>Add Note</Btn>
      </div>

      {/* Notes list */}
      {notes.length === 0 && <div style={{ textAlign:'center', padding:'24px', color:'#6b7280' }}>No notes yet</div>}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {notes.map(n => (
          <div key={n._id} style={{ background:'#2a2d3e', border:`1px solid ${SEVERITY_COLORS[n.severity]||'#374151'}22`, borderLeft:`3px solid ${SEVERITY_COLORS[n.severity]||'#374151'}`, borderRadius:'0 8px 8px 0', padding:'10px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:'0.68rem', fontWeight:700, color:SEVERITY_COLORS[n.severity]||'#9ca3af', textTransform:'uppercase', letterSpacing:'0.8px' }}>
                  {n.severity==='info'?'ℹ️':n.severity==='warning'?'⚠️':'🚨'} {n.severity}
                </span>
                <span style={{ fontSize:'0.68rem', color:'#6b7280' }}>by {n.authorName}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:'0.65rem', color:'#6b7280' }}>{new Date(n.createdAt).toLocaleString()}</span>
                <button onClick={() => deleteNote(n._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:12, padding:0 }}>✕</button>
              </div>
            </div>
            <p style={{ margin:0, fontSize:'0.875rem', color:'#e5e7eb', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{n.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  MAIN ADMIN PANEL
// ════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const { user } = useAuth()
  const nav = useNavigate()

  const [activeSection, setSection] = useState('dashboard')
  const [toastQ, setToastQ] = useState([])
  const [confirmState, setConfirmState] = useState(null)

  const toast = useCallback((msg, type = 'success') => {
    setToastQ(p => [...p, { id: Date.now(), msg, type }])
  }, [])

  const confirm = useCallback((msg, onYes) => {
    setConfirmState({ msg, onYes })
  }, [])

  // Access control — must be admin, superadmin, or owner
  useEffect(() => {
    if (!user) return
    const allowed = ['admin','superadmin','owner']
    if (!allowed.includes(user.rank)) { nav('/chat'); return }
  }, [user])

  if (!user) return null

  const isOwner = user.rank === 'owner'
  const isOwnerOrAdmin = ['owner','admin','superadmin'].includes(user.rank)
  const isMod = ['moderator','admin','superadmin','owner'].includes(user.rank)

  const SECTIONS = [
    { id:'dashboard',      icon:'📊', label:'Dashboard',      access: isMod },
    { id:'users',          icon:'👥', label:'Users',           access: isMod },
    { id:'rooms',          icon:'🏠', label:'Rooms',           access: isMod },
    { id:'staff',          icon:'🛡️', label:'Staff',           access: isMod },
    { id:'reports',        icon:'⚠️', label:'Reports',         access: isMod },
    { id:'contacts',       icon:'📧', label:'Contacts',        access: isMod },
    { id:'chat-logs',      icon:'💬', label:'Chat Logs',       access: isOwnerOrAdmin },
    { id:'broadcast',      icon:'📢', label:'Broadcast',       access: isOwnerOrAdmin },
    { id:'news',           icon:'📰', label:'News',            access: isMod },
    { id:'gifts',          icon:'🎁', label:'Gifts',           access: isOwnerOrAdmin },
    { id:'badges',         icon:'🏅', label:'Badges',          access: isOwnerOrAdmin },
    { id:'word-filter',    icon:'🔤', label:'Word Filter',     access: isMod },
    { id:'ip-bans',        icon:'🌐', label:'IP Bans',         access: isOwnerOrAdmin },
    { id:'gift-txns',      icon:'💸', label:'Gift Txns',       access: isOwnerOrAdmin },
    { id:'wallet',         icon:'💰', label:'Wallet',          access: isOwnerOrAdmin },
    { id:'create-user',    icon:'➕', label:'Create User',     access: isOwnerOrAdmin },
    { id:'vip-grant',      icon:'⭐', label:'VIP Grants',       access: isOwnerOrAdmin },
    { id:'site-settings',  icon:'⚙️', label:'Site Settings',   access: isOwner },
  ].filter(s => s.access)

  const renderSection = () => {
    const p = { toast, confirm, isOwner, isOwnerOrAdmin, isMod }
    switch (activeSection) {
      case 'dashboard':   return <Dashboard {...p}/>
      case 'users':       return <UserManagement {...p}/>
      case 'rooms':       return <RoomManagement {...p}/>
      case 'staff':       return <StaffList/>
      case 'reports':     return <Reports {...p}/>
      case 'contacts':    return <Contacts {...p}/>
      case 'chat-logs':   return <ChatLogs {...p}/>
      case 'broadcast':   return <Broadcast {...p}/>
      case 'news':        return <NewsSection {...p}/>
      case 'gifts':       return <GiftManagement {...p}/>
      case 'badges':      return <BadgesManagement {...p}/>
      case 'word-filter': return <WordFilter {...p}/>
      case 'ip-bans':     return <IPBans {...p}/>
      case 'gift-txns':   return <GiftTransactions/>
      case 'wallet':      return <WalletTransfer {...p}/>
      case 'create-user': return <CreateUser {...p}/>
      case 'vip-grant':   return <VIPGrantPanel {...p}/>
      case 'site-settings': return <SiteSettings {...p}/>
      default: return null
    }
  }

  return (
    <div style={{ height:'100dvh', display:'flex', background:'#161824', color:'#e5e7eb', fontFamily:"'Nunito','Outfit',sans-serif", overflow:'hidden' }}>

      {/* SIDEBAR */}
      <div style={{ width:220, background:'#0f111a', borderRight:'1px solid #1e2030', display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
        {/* Logo */}
        <div style={{ padding:'16px 14px 12px', borderBottom:'1px solid #1e2030' }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:'#60a5fa', letterSpacing:'-0.5px' }}>⚡ Admin Panel</div>
          <div style={{ fontSize:'0.7rem', color:'#374151', marginTop:3 }}>{user.username} <span style={{ color:RANK_COLORS[user.rank] }}>({user.rank})</span></div>
        </div>

        {/* Nav */}
        <div style={{ flex:1, padding:'8px 6px' }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'9px 10px', borderRadius:8, border:'none', cursor:'pointer', background: activeSection===s.id ? '#1a73e822' : 'none', color: activeSection===s.id ? '#60a5fa' : '#6b7280', fontWeight: activeSection===s.id ? 800 : 600, fontSize:'0.82rem', textAlign:'left', transition:'all .12s', marginBottom:2 }}
              onMouseEnter={e => { if(activeSection!==s.id){e.currentTarget.style.background='#1e2030';e.currentTarget.style.color='#9ca3af'} }}
              onMouseLeave={e => { if(activeSection!==s.id){e.currentTarget.style.background='none';e.currentTarget.style.color='#6b7280'} }}
            >
              <span style={{ fontSize:15, width:20, textAlign:'center', flexShrink:0 }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Footer links */}
        <div style={{ padding:'10px 8px', borderTop:'1px solid #1e2030', display:'flex', flexDirection:'column', gap:4 }}>
          <button onClick={() => nav('/chat')} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', borderRadius:7, border:'none', background:'none', color:'#6b7280', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}
            onMouseEnter={e=>e.currentTarget.style.background='#1e2030'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
            💬 Back to Chat
          </button>
          <button onClick={() => { localStorage.removeItem('cgz_token'); nav('/login') }} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', borderRadius:7, border:'none', background:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}
            onMouseEnter={e=>e.currentTarget.style.background='#1e2030'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Top bar */}
        <div style={{ height:48, background:'#0f111a', borderBottom:'1px solid #1e2030', display:'flex', alignItems:'center', padding:'0 20px', gap:12, flexShrink:0 }}>
          <h2 style={{ margin:0, fontSize:'0.95rem', fontWeight:800, color:'#e5e7eb' }}>
            {SECTIONS.find(s=>s.id===activeSection)?.icon} {SECTIONS.find(s=>s.id===activeSection)?.label}
          </h2>
          <div style={{ flex:1 }}/>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:'0.72rem', color:'#374151', fontFamily:'monospace' }}>ChatsGenZ Admin</span>
            <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width:28, height:28, borderRadius:'50%', border:`2px solid ${RANK_COLORS[user.rank]}` }} onError={e=>e.target.src='/default_images/avatar/default_guest.png'}/>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          {renderSection()}
        </div>
      </div>

      {/* Toasts */}
      {toastQ.map(t => <Toast key={t.id} msg={t.msg} type={t.type} onDone={() => setToastQ(p => p.filter(x=>x.id!==t.id))}/>)}

      {/* Confirm */}
      {confirmState && <Confirm msg={confirmState.msg} onYes={() => { confirmState.onYes(); setConfirmState(null) }} onNo={() => setConfirmState(null)}/>}

      <style>{`
        @keyframes slideUp { from { transform:translateY(20px); opacity:0 } to { transform:translateY(0); opacity:1 } }
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:4px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:#2a2d3e; border-radius:4px }
      `}</style>
    </div>
  )
}
