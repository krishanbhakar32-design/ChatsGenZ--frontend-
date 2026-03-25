/**
 * ChatsGenZ — Admin Panel (Merged: ChatsGenZ + CodyChat)
 * Route: /admin
 * Access: moderator+ only
 * New sections from CodyChat: Rank Styles, Theme Colors, Fonts
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../components/Toast.jsx'
import {
  RANKS, RANKS_LIST, isStaff, isAdmin, isSuperAdmin, isOwner,
  getRankColor, getRankLabel, getRankIcon, API_URL,
  getAvatarUrl, getGiftIcon, getBadgeIcon
} from '../../constants.js'

const API = API_URL

// ── helpers ────────────────────────────────────────────────────
const RL = r => RANKS[r]?.level || 0
const authH = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('cgz_token')}` })
const apiFetch = async (path, opts={}) => {
  const r = await fetch(`${API}/api/admin${path}`, { headers: authH(), ...opts })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || 'Error')
  return d
}

// ── Shared UI Components ────────────────────────────────────────
function RIcon({ rank, size=16 }) {
  return (
    <img src={getRankIcon(rank)} alt="" style={{ width:size, height:size, objectFit:'contain', background:'transparent', flexShrink:0, display:'inline-block' }} onError={e => e.target.style.display='none'}/>
  )
}

function Avatar({ src, size=36, gender }) {
  const fallback = gender==='female'?'/default_images/avatar/default_female.png':'/default_images/avatar/default_male.png'
  return (
    <img src={getAvatarUrl(src) || fallback} alt="" style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', background:'#1e2130', flexShrink:0 }} onError={e => { e.target.src = fallback }}/>
  )
}

function BadgePill({ color='#1e2130', children, small }) {
  return (
    <span style={{ background:color+'22', color, border:`1px solid ${color}55`, borderRadius:6, padding:small?'2px 7px':'3px 10px', fontSize:small?11:12, fontWeight:700, whiteSpace:'nowrap' }}>{children}</span>
  )
}

function Btn({ children, variant='primary', size='sm', onClick, disabled, style={} }) {
  const vars = {
    primary:{ bg:'#3b82f6', hover:'#2563eb', text:'#fff' },
    danger: { bg:'#ef4444', hover:'#dc2626', text:'#fff' },
    success:{ bg:'#22c55e', hover:'#16a34a', text:'#fff' },
    warn:   { bg:'#f59e0b', hover:'#d97706', text:'#fff' },
    ghost:  { bg:'transparent', hover:'#ffffff11', text:'#9ca3af', border:'1px solid #2a2d3e' },
    purple: { bg:'#8b5cf6', hover:'#7c3aed', text:'#fff' },
  }
  const v = vars[variant] || vars.primary
  return (
    <button onClick={onClick} disabled={disabled} style={{ background:v.bg, color:v.text, border:v.border||'none', borderRadius:8, padding:size==='sm'?'6px 13px':'8px 18px', fontSize:size==='sm'?12:13, fontWeight:700, cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.5:1, transition:'background .15s', ...style }} onMouseEnter={e => !disabled && (e.target.style.background=v.hover)} onMouseLeave={e => !disabled && (e.target.style.background=v.bg)}>{children}</button>
  )
}

function Modal({ title, onClose, children, width=520 }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'#131624', border:'1px solid #2a2d3e', borderRadius:14, width:'100%', maxWidth:width, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 20px 60px #000a' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #2a2d3e' }}>
          <span style={{ fontWeight:800, fontSize:15, color:'#f1f5f9' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', fontSize:20, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:20 }}>{children}</div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type='text', placeholder='', disabled, hint }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>{label}</div>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ width:'100%', background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'9px 13px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', outline:'none' }}/>
      {hint && <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>{hint}</div>}
    </div>
  )
}

function ColorInput({ label, value, onChange }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>{label}</div>}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <input type="color" value={value} onChange={e=>onChange(e.target.value)}
          style={{ width:40, height:34, border:'2px solid #2a2d3e', borderRadius:6, cursor:'pointer', background:'none', padding:2, flexShrink:0 }}/>
        <input type="text" value={value} onChange={e=>onChange(e.target.value)}
          style={{ flex:1, background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'7px 12px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', outline:'none' }}/>
      </div>
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>{label}</div>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'9px 13px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', cursor:'pointer', outline:'none' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function Toggle({ label, checked, onChange, hint }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #1a1d2e' }}>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{label}</div>
        {hint && <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{hint}</div>}
      </div>
      <div onClick={()=>onChange(!checked)} style={{ width:44, height:24, borderRadius:99, background:checked?'#3b82f6':'#374151', position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0 }}>
        <div style={{ position:'absolute', top:3, left:checked?21:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color='#3b82f6', sub }) {
  return (
    <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:'18px 20px', flex:'1 1 160px', minWidth:0 }}>
      <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:26, fontWeight:900, color }}>{value ?? '—'}</div>
      <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:color+'99', marginTop:4 }}>{sub}</div>}
    </div>
  )
}

function SectionHeader({ icon, title, count, right }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        <h2 style={{ fontSize:20, fontWeight:900, color:'#f1f5f9', margin:0 }}>{title}</h2>
        {count !== undefined && <span style={{ background:'#1e2436', color:'#6b7280', borderRadius:20, padding:'2px 10px', fontSize:12, fontWeight:700 }}>{count}</span>}
      </div>
      {right && <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{right}</div>}
    </div>
  )
}

// ── SECTIONS ───────────────────────────────────────────────────

function DashboardSection({ user }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { apiFetch('/stats').then(d=>setStats(d)).catch(()=>{}).finally(()=>setLoading(false)) }, [])
  return (
    <div>
      <SectionHeader icon="📊" title="Dashboard"/>
      {loading ? <div style={{ color:'#6b7280', textAlign:'center', padding:40 }}>Loading…</div> : stats ? (
        <>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
            <StatCard icon="👥" label="Total Users" value={stats.users} color="#3b82f6" sub={`+${stats.newToday} today`}/>
            <StatCard icon="🟢" label="Online Now" value={stats.online} color="#22c55e"/>
            <StatCard icon="🚫" label="Banned" value={stats.bannedUsers} color="#ef4444"/>
            <StatCard icon="🏠" label="Rooms" value={stats.rooms} color="#8b5cf6"/>
            <StatCard icon="💬" label="Messages" value={stats.messages} color="#f59e0b"/>
            <StatCard icon="🚨" label="Pending Reports" value={stats.reports} color="#ef4444"/>
            <StatCard icon="🎁" label="Gifts Sent" value={stats.gifts} color="#ec4899"/>
          </div>
          <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:'16px 20px' }}>
            <div style={{ fontSize:13, color:'#9ca3af', marginBottom:6 }}>Logged in as</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Avatar src={user.avatar} size={40} gender={user.gender}/>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:getRankColor(user.rank) }}>{user.username}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                  <RIcon rank={user.rank}/>
                  <span style={{ fontSize:12, color:'#6b7280' }}>{getRankLabel(user.rank)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : <div style={{ color:'#ef4444' }}>Failed to load stats</div>}
    </div>
  )
}

function UsersSection({ currentUser }) {
  const { showToast } = useToast()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [rankF, setRankF] = useState('')
  const [bannedF, setBannedF] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(null)
  const [banReason, setBanReason] = useState('')
  const [banExpiry, setBanExpiry] = useState('')
  const [muteMin, setMuteMin] = useState('30')
  const [muteReason, setMuteReason] = useState('')
  const [goldAmt, setGoldAmt] = useState('')
  const [goldAct, setGoldAct] = useState('add')
  const [rubyAmt, setRubyAmt] = useState('')
  const [rubyAct, setRubyAct] = useState('add')
  const [newRank, setNewRank] = useState('')
  const [newPass, setNewPass] = useState('')
  const [warnMsg, setWarnMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit:20, search, rank:rankF, banned:bannedF })
      const d = await apiFetch(`/users?${params}`)
      setUsers(d.users); setTotal(d.total); setPages(d.pages)
    } catch(e) { showToast(e.message,'error') }
    setLoading(false)
  }, [page, search, rankF, bannedF])

  useEffect(() => { load() }, [load])

  const action = async (path, method='PUT', body={}) => {
    try {
      const d = await apiFetch(`/users/${selected._id}${path}`, { method, body: JSON.stringify(body) })
      showToast(d.message || 'Done', 'success')
      setModal(null); load()
    } catch(e) { showToast(e.message,'error') }
  }

  const canAct = (target) => RL(currentUser.rank) > RL(target.rank) || currentUser.rank==='owner'

  return (
    <div>
      <SectionHeader icon="👥" title="Users" count={total} right={
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search username/email…"
            style={{ background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'7px 12px', color:'#f1f5f9', fontSize:12, width:180, outline:'none' }}/>
          <select value={rankF} onChange={e=>{setRankF(e.target.value);setPage(1)}}
            style={{ background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'7px 10px', color:'#f1f5f9', fontSize:12 }}>
            <option value="">All Ranks</option>
            {RANKS_LIST.map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <select value={bannedF} onChange={e=>{setBannedF(e.target.value);setPage(1)}}
            style={{ background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'7px 10px', color:'#f1f5f9', fontSize:12 }}>
            <option value="">All Status</option>
            <option value="true">Banned Only</option>
          </select>
        </div>
      }/>
      <div style={{ background:'#0d1020', border:'1px solid #1e2436', borderRadius:12, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #1e2436' }}>
              {['User','Rank','Gold','Ruby','XP','Status','Joined','Actions'].map(h=>(
                <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:'#6b7280', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:.5, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding:40, textAlign:'center', color:'#6b7280' }}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} style={{ padding:40, textAlign:'center', color:'#6b7280' }}>No users found</td></tr>
            ) : users.map(u => (
              <tr key={u._id} style={{ borderBottom:'1px solid #131624' }}>
                <td style={{ padding:'9px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Avatar src={u.avatar} size={32} gender={u.gender}/>
                    <div>
                      <div style={{ fontWeight:700, color:'#f1f5f9' }}>{u.username}</div>
                      <div style={{ fontSize:11, color:'#6b7280', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                    </div>
                    {u.isBanned && <BadgePill color='#ef4444' small>BANNED</BadgePill>}
                    {u.isMuted && <BadgePill color='#f59e0b' small>MUTED</BadgePill>}
                    {u.isGhosted && <BadgePill color='#8b5cf6' small>GHOST</BadgePill>}
                  </div>
                </td>
                <td style={{ padding:'9px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <RIcon rank={u.rank}/>
                    <span style={{ color:getRankColor(u.rank), fontWeight:700, fontSize:12 }}>{getRankLabel(u.rank)}</span>
                  </div>
                </td>
                <td style={{ padding:'9px 12px', color:'#fbbf24', fontWeight:700 }}>{u.gold?.toLocaleString()??0}</td>
                <td style={{ padding:'9px 12px', color:'#f472b6', fontWeight:700 }}>{u.ruby?.toLocaleString()??0}</td>
                <td style={{ padding:'9px 12px', color:'#a78bfa' }}>{u.xp??0}</td>
                <td style={{ padding:'9px 12px' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:u.isOnline?'#22c55e':'#4b5563', display:'inline-block' }}/>
                </td>
                <td style={{ padding:'9px 12px', color:'#6b7280', fontSize:11, whiteSpace:'nowrap' }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding:'9px 12px' }}>
                  <div style={{ display:'flex', gap:4, flexWrap:'nowrap' }}>
                    <Btn variant='ghost' onClick={()=>{setSelected(u);setModal('view')}}>👁</Btn>
                    {canAct(u) && <>
                      {isAdmin(currentUser.rank) && <Btn variant='warn' onClick={()=>{setSelected(u);setNewRank(u.rank);setModal('rank')}}>🎖</Btn>}
                      {isAdmin(currentUser.rank) && <Btn variant='primary' onClick={()=>{setSelected(u);setGoldAmt('');setModal('gold')}}>💰</Btn>}
                      <Btn variant='warn' onClick={()=>{setSelected(u);setMuteMin('30');setMuteReason('');setModal('mute')}}>🔇</Btn>
                      <Btn variant='warn' onClick={()=>{setSelected(u);setWarnMsg('');setModal('warn')}}>⚠️</Btn>
                      {isAdmin(currentUser.rank) && <Btn variant='danger' onClick={()=>{setSelected(u);setBanReason('');setBanExpiry('');setModal('ban')}}>{u.isBanned?'🔓':'🔨'}</Btn>}
                      {isOwner(currentUser.rank) && <Btn variant='ghost' onClick={()=>{setSelected(u);setNewPass('');setModal('password')}}>🔑</Btn>}
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:14 }}>
          <Btn variant='ghost' disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</Btn>
          <span style={{ color:'#6b7280', padding:'6px 10px', fontSize:13 }}>Page {page} / {pages}</span>
          <Btn variant='ghost' disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next →</Btn>
        </div>
      )}
      {modal==='view' && selected && (
        <Modal title={`User: ${selected.username}`} onClose={()=>setModal(null)}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <Avatar src={selected.avatar} size={60} gender={selected.gender}/>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:getRankColor(selected.rank) }}>{selected.username}</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>{selected.email}</div>
              <div style={{ display:'flex', gap:6, marginTop:4 }}>
                <BadgePill color={getRankColor(selected.rank)}>{getRankLabel(selected.rank)}</BadgePill>
                {selected.isBanned && <BadgePill color='#ef4444'>BANNED</BadgePill>}
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[['💰 Gold',selected.gold?.toLocaleString()??0],['💎 Ruby',selected.ruby?.toLocaleString()??0],['⭐ XP',selected.xp??0],['🎮 Level',selected.level??1],['🌍 Country',selected.countryCode||'—'],['👤 Gender',selected.gender||'—'],['📅 Joined',selected.createdAt?new Date(selected.createdAt).toLocaleDateString():'—'],['🕒 Last Seen',selected.lastSeen?new Date(selected.lastSeen).toLocaleString():'—']].map(([k,v])=>(
              <div key={k} style={{ background:'#0d1020', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontSize:11, color:'#6b7280', marginBottom:2 }}>{k}</div>
                <div style={{ fontWeight:700, color:'#f1f5f9' }}>{v}</div>
              </div>
            ))}
          </div>
          {selected.banReason && (
            <div style={{ background:'#450a0a', border:'1px solid #ef444455', borderRadius:8, padding:'10px 12px', marginTop:12 }}>
              <div style={{ fontSize:11, color:'#ef4444', marginBottom:2 }}>BAN REASON</div>
              <div style={{ fontSize:13, color:'#fca5a5' }}>{selected.banReason}</div>
            </div>
          )}
        </Modal>
      )}
      {modal==='ban' && selected && (
        <Modal title={selected.isBanned?`Unban ${selected.username}`:`Ban ${selected.username}`} onClose={()=>setModal(null)}>
          {selected.isBanned ? (
            <><div style={{ color:'#9ca3af', marginBottom:16 }}>Remove ban for <strong style={{ color:'#f1f5f9' }}>{selected.username}</strong>?</div><Btn variant='success' onClick={()=>action('/unban')}>✅ Unban User</Btn></>
          ) : (
            <><Input label="Ban Reason" value={banReason} onChange={setBanReason} placeholder="e.g. Spamming…"/><Input label="Expiry (optional)" value={banExpiry} onChange={setBanExpiry} type="datetime-local" hint="Leave blank for permanent"/><Btn variant='danger' disabled={!banReason.trim()} onClick={()=>action('/ban','PUT',{reason:banReason,expiry:banExpiry||null})}>🔨 Ban User</Btn></>
          )}
        </Modal>
      )}
      {modal==='mute' && selected && (
        <Modal title={`Mute ${selected.username}`} onClose={()=>setModal(null)}>
          <Input label="Duration (minutes)" value={muteMin} onChange={setMuteMin} type="number" placeholder="30"/>
          <Input label="Reason" value={muteReason} onChange={setMuteReason} placeholder="Mute reason…"/>
          <Btn variant='warn' onClick={()=>action('/mute','PUT',{minutes:+muteMin,reason:muteReason||'Muted by staff'})}>🔇 Mute User</Btn>
        </Modal>
      )}
      {modal==='warn' && selected && (
        <Modal title={`Warn ${selected.username}`} onClose={()=>setModal(null)}>
          <Input label="Warning Message" value={warnMsg} onChange={setWarnMsg} placeholder="Warning message…"/>
          <Btn variant='warn' disabled={!warnMsg.trim()} onClick={()=>action('/warn','POST',{message:warnMsg})}>⚠️ Send Warning</Btn>
        </Modal>
      )}
      {modal==='rank' && selected && isAdmin(currentUser.rank) && (
        <Modal title={`Change Rank: ${selected.username}`} onClose={()=>setModal(null)}>
          <Select label="New Rank" value={newRank} onChange={setNewRank}
            options={RANKS_LIST.filter(r=>RL(r.key)<RL(currentUser.rank)).map(r=>({value:r.key,label:r.label}))}/>
          <Btn variant='primary' disabled={!newRank} onClick={()=>action('/rank','PUT',{rank:newRank})}>🎖 Set Rank</Btn>
        </Modal>
      )}
      {modal==='gold' && selected && (
        <Modal title={`Manage Gold: ${selected.username}`} onClose={()=>setModal(null)}>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {['add','remove','set'].map(a=>(
              <Btn key={a} variant={goldAct===a?'primary':'ghost'} onClick={()=>setGoldAct(a)} style={{ textTransform:'capitalize' }}>{a}</Btn>
            ))}
          </div>
          <Input label="Amount" value={goldAmt} onChange={setGoldAmt} type="number" placeholder="e.g. 500"/>
          <Btn variant='warn' disabled={!goldAmt} onClick={()=>action('/gold','PUT',{amount:+goldAmt,action:goldAct})}>💰 Update Gold</Btn>
        </Modal>
      )}
      {modal==='password' && selected && isOwner(currentUser.rank) && (
        <Modal title={`Reset Password: ${selected.username}`} onClose={()=>setModal(null)}>
          <Input label="New Password (min 6 chars)" value={newPass} onChange={setNewPass} type="password" placeholder="New password…"/>
          <Btn variant='danger' disabled={newPass.length<6} onClick={()=>action('/password','PUT',{password:newPass})}>🔑 Change Password</Btn>
        </Modal>
      )}
    </div>
  )
}

function RoomsSection({ currentUser }) {
  const { showToast } = useToast()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [sel, setSel] = useState(null)
  const [form, setForm] = useState({ name:'', description:'', icon:'/icons/room.svg', isPrivate:false, isActive:true, maxUsers:100, allowedRanks:[] })

  const load = async () => {
    setLoading(true)
    try { const d = await apiFetch('/rooms'); setRooms(d.rooms || []) } catch(e) { showToast(e.message,'error') }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      if (sel) { await apiFetch(`/rooms/${sel._id}`, { method:'PUT', body:JSON.stringify(form) }); showToast('Room updated') }
      else { await apiFetch('/rooms', { method:'POST', body:JSON.stringify(form) }); showToast('Room created') }
      setModal(null); load()
    } catch(e) { showToast(e.message,'error') }
  }

  const del = async (id) => {
    if (!confirm('Delete this room?')) return
    try { await apiFetch(`/rooms/${id}`, { method:'DELETE' }); showToast('Room deleted'); load() } catch(e) { showToast(e.message,'error') }
  }

  const openEdit = (r) => { setSel(r); setForm({ name:r.name, description:r.description||'', icon:r.icon||'/icons/room.svg', isPrivate:r.isPrivate||false, isActive:r.isActive!==false, maxUsers:r.maxUsers||100, allowedRanks:r.allowedRanks||[] }); setModal('form') }
  const openNew = () => { setSel(null); setForm({ name:'', description:'', icon:'/icons/room.svg', isPrivate:false, isActive:true, maxUsers:100, allowedRanks:[] }); setModal('form') }

  return (
    <div>
      <SectionHeader icon="🏠" title="Rooms" count={rooms.length} right={isAdmin(currentUser.rank) && <Btn onClick={openNew}>+ New Room</Btn>}/>
      {loading ? <div style={{ color:'#6b7280', textAlign:'center', padding:40 }}>Loading…</div> : (
        <div style={{ background:'#0d1020', border:'1px solid #1e2436', borderRadius:12, overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr style={{ borderBottom:'1px solid #1e2436' }}>
              {['Room','Type','Max','Status','Actions'].map(h=>(
                <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:'#6b7280', fontWeight:700, fontSize:11, textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rooms.map(r=>(
                <tr key={r._id} style={{ borderBottom:'1px solid #131624' }}>
                  <td style={{ padding:'9px 12px' }}>
                    <div style={{ fontWeight:700, color:'#f1f5f9' }}>{r.name}</div>
                    <div style={{ fontSize:11, color:'#6b7280' }}>{r.description}</div>
                  </td>
                  <td style={{ padding:'9px 12px' }}><BadgePill color={r.isPrivate?'#f59e0b':'#22c55e'}>{r.isPrivate?'Private':'Public'}</BadgePill></td>
                  <td style={{ padding:'9px 12px', color:'#9ca3af' }}>{r.maxUsers||100}</td>
                  <td style={{ padding:'9px 12px' }}><BadgePill color={r.isActive!==false?'#22c55e':'#ef4444'}>{r.isActive!==false?'Active':'Inactive'}</BadgePill></td>
                  <td style={{ padding:'9px 12px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      {isAdmin(currentUser.rank) && <Btn variant='ghost' onClick={()=>openEdit(r)}>✏️</Btn>}
                      {isAdmin(currentUser.rank) && <Btn variant='danger' onClick={()=>del(r._id)}>🗑</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal==='form' && (
        <Modal title={sel?`Edit: ${sel.name}`:'Create Room'} onClose={()=>setModal(null)}>
          <Input label="Name" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="Room name"/>
          <Input label="Description" value={form.description} onChange={v=>setForm(f=>({...f,description:v}))} placeholder="Short description"/>
          <Input label="Icon path" value={form.icon} onChange={v=>setForm(f=>({...f,icon:v}))}/>
          <Input label="Max Users" value={form.maxUsers} onChange={v=>setForm(f=>({...f,maxUsers:+v}))} type="number"/>
          <Toggle label="Private Room" checked={form.isPrivate} onChange={v=>setForm(f=>({...f,isPrivate:v}))} hint="Only allowed ranks can join"/>
          <Toggle label="Active" checked={form.isActive} onChange={v=>setForm(f=>({...f,isActive:v}))}/>
          <div style={{ marginTop:16, display:'flex', gap:8 }}>
            <Btn variant='ghost' onClick={()=>setModal(null)}>Cancel</Btn>
            <Btn onClick={save} disabled={!form.name.trim()}>{sel?'Save Changes':'Create Room'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ReportsSection({ currentUser }) {
  const { showToast } = useToast()
  const [reports, setReports] = useState([])
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { const d = await apiFetch(`/reports?status=${status}&limit=50`); setReports(d.reports||[]) } catch(e) { showToast(e.message,'error') }
    setLoading(false)
  }, [status])

  useEffect(() => { load() }, [load])

  const act = async (id, action) => {
    try { await apiFetch(`/reports/${id}/${action}`, { method:'PUT' }); showToast(`Report ${action}d`); load() } catch(e) { showToast(e.message,'error') }
  }

  return (
    <div>
      <SectionHeader icon="🚨" title="Reports" right={
        <select value={status} onChange={e=>setStatus(e.target.value)}
          style={{ background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'7px 10px', color:'#f1f5f9', fontSize:12 }}>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>
      }/>
      {loading ? <div style={{ color:'#6b7280', textAlign:'center', padding:40 }}>Loading…</div> : reports.length === 0 ? (
        <div style={{ color:'#6b7280', textAlign:'center', padding:40 }}>No reports found</div>
      ) : reports.map(r=>(
        <div key={r._id} style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:10, padding:'14px 16px', marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9' }}>
                <span style={{ color:'#ef4444' }}>{r.reportedBy?.username||'Unknown'}</span> reported <span style={{ color:'#fbbf24' }}>{r.reportedUser?.username||'Unknown'}</span>
              </div>
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{r.reason}</div>
              <div style={{ fontSize:11, color:'#4b5563', marginTop:4 }}>{new Date(r.createdAt).toLocaleString()}</div>
            </div>
            {r.status==='pending' && (
              <div style={{ display:'flex', gap:6 }}>
                <Btn variant='success' onClick={()=>act(r._id,'resolve')}>✅ Resolve</Btn>
                <Btn variant='ghost' onClick={()=>act(r._id,'dismiss')}>Dismiss</Btn>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function GiftsSection({ currentUser }) {
  const { showToast } = useToast()
  const [gifts, setGifts] = useState([])
  const [modal, setModal] = useState(null)
  const [sel, setSel] = useState(null)
  const [form, setForm] = useState({ name:'', icon:'', price:10, category:'common', isActive:true })

  const load = async () => { try { const d = await apiFetch('/gifts'); setGifts(d.gifts||[]) } catch(e) { showToast(e.message,'error') } }
  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      if (sel) await apiFetch(`/gifts/${sel._id}`, { method:'PUT', body:JSON.stringify(form) })
      else await apiFetch('/gifts', { method:'POST', body:JSON.stringify(form) })
      showToast(sel?'Gift updated':'Gift created'); setModal(null); load()
    } catch(e) { showToast(e.message,'error') }
  }

  return (
    <div>
      <SectionHeader icon="🎁" title="Gifts" count={gifts.length} right={<Btn onClick={()=>{setSel(null);setForm({name:'',icon:'',price:10,category:'common',isActive:true});setModal('form')}}>+ New Gift</Btn>}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
        {gifts.map(g=>(
          <div key={g._id} style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:16, textAlign:'center' }}>
            <img src={getGiftIcon(g.icon)} alt="" style={{ width:48, height:48, objectFit:'contain', marginBottom:8 }} onError={e=>e.target.style.display='none'}/>
            <div style={{ fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>{g.name}</div>
            <div style={{ color:'#fbbf24', fontSize:13 }}>💰 {g.price}</div>
            <BadgePill color={g.isActive?'#22c55e':'#ef4444'} small>{g.isActive?'Active':'Disabled'}</BadgePill>
            <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:10 }}>
              <Btn variant='ghost' onClick={()=>{setSel(g);setForm({name:g.name,icon:g.icon,price:g.price,category:g.category||'common',isActive:g.isActive!==false});setModal('form')}}>✏️</Btn>
              <Btn variant='danger' onClick={async()=>{if(confirm('Delete?'))try{await apiFetch(`/gifts/${g._id}`,{method:'DELETE'});load()}catch(e){showToast(e.message,'error')}}}>🗑</Btn>
            </div>
          </div>
        ))}
      </div>
      {modal==='form' && (
        <Modal title={sel?'Edit Gift':'New Gift'} onClose={()=>setModal(null)}>
          <Input label="Name" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Rose"/>
          <Input label="Icon filename" value={form.icon} onChange={v=>setForm(f=>({...f,icon:v}))} placeholder="e.g. rose.svg"/>
          <Input label="Price (gold)" value={form.price} onChange={v=>setForm(f=>({...f,price:+v}))} type="number"/>
          <Input label="Category" value={form.category} onChange={v=>setForm(f=>({...f,category:v}))} placeholder="common, rare, epic…"/>
          <Toggle label="Active" checked={form.isActive} onChange={v=>setForm(f=>({...f,isActive:v}))}/>
          <div style={{ marginTop:16, display:'flex', gap:8 }}>
            <Btn variant='ghost' onClick={()=>setModal(null)}>Cancel</Btn>
            <Btn onClick={save} disabled={!form.name||!form.icon}>{sel?'Save':'Create'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

function BadgesSection({ currentUser }) {
  const { showToast } = useToast()
  const [badges, setBadges] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name:'', icon:'', description:'' })

  const load = async () => { try { const d = await apiFetch('/badges'); setBadges(d.badges||[]) } catch(e) { showToast(e.message,'error') } }
  useEffect(() => { load() }, [])

  return (
    <div>
      <SectionHeader icon="🏅" title="Badges" count={badges.length} right={isOwner(currentUser.rank) && <Btn onClick={()=>setModal(true)}>+ New Badge</Btn>}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
        {badges.map(b=>(
          <div key={b._id} style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:16, textAlign:'center' }}>
            <img src={getBadgeIcon(b.icon)} alt="" style={{ width:48, height:48, objectFit:'contain', marginBottom:8 }} onError={e=>e.target.style.display='none'}/>
            <div style={{ fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>{b.name}</div>
            <div style={{ fontSize:11, color:'#6b7280' }}>{b.description}</div>
            {isOwner(currentUser.rank) && (
              <Btn variant='danger' style={{ marginTop:10 }} onClick={async()=>{if(confirm('Delete badge?'))try{await apiFetch(`/badges/${b._id}`,{method:'DELETE'});load()}catch(e){showToast(e.message,'error')}}}>🗑 Delete</Btn>
            )}
          </div>
        ))}
      </div>
      {modal && (
        <Modal title="New Badge" onClose={()=>setModal(false)}>
          <Input label="Name" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Veteran"/>
          <Input label="Icon filename" value={form.icon} onChange={v=>setForm(f=>({...f,icon:v}))} placeholder="e.g. veteran.svg"/>
          <Input label="Description" value={form.description} onChange={v=>setForm(f=>({...f,description:v}))} placeholder="Badge description"/>
          <div style={{ marginTop:16, display:'flex', gap:8 }}>
            <Btn variant='ghost' onClick={()=>setModal(false)}>Cancel</Btn>
            <Btn onClick={async()=>{try{await apiFetch('/badges',{method:'POST',body:JSON.stringify(form)});showToast('Badge created');setModal(false);load()}catch(e){showToast(e.message,'error')}}} disabled={!form.name||!form.icon}>Create Badge</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

function FiltersSection({ currentUser }) {
  const { showToast } = useToast()
  const [filters, setFilters] = useState([])
  const [word, setWord] = useState('')
  const [replacement, setReplacement] = useState('***')

  const load = async () => { try { const d = await apiFetch('/filters'); setFilters(d.filters||[]) } catch(e) { showToast(e.message,'error') } }
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!word.trim()) return
    try { await apiFetch('/filters', { method:'POST', body:JSON.stringify({ word:word.trim(), replacement }) }); setWord(''); load() } catch(e) { showToast(e.message,'error') }
  }

  return (
    <div>
      <SectionHeader icon="🚫" title="Word Filters" count={filters.length}/>
      <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <input value={word} onChange={e=>setWord(e.target.value)} placeholder="Bad word…" onKeyDown={e=>e.key==='Enter'&&add()}
            style={{ flex:1, minWidth:140, background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'8px 12px', color:'#f1f5f9', fontSize:13, outline:'none' }}/>
          <input value={replacement} onChange={e=>setReplacement(e.target.value)} placeholder="Replacement"
            style={{ width:120, background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'8px 12px', color:'#f1f5f9', fontSize:13, outline:'none' }}/>
          <Btn onClick={add} disabled={!word.trim()}>Add Filter</Btn>
        </div>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {filters.map(f=>(
          <div key={f._id} style={{ background:'#1e2436', border:'1px solid #2a3a4e', borderRadius:8, padding:'6px 12px', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:'#ef4444', fontWeight:700 }}>{f.word}</span>
            <span style={{ color:'#6b7280' }}>→</span>
            <span style={{ color:'#9ca3af' }}>{f.replacement}</span>
            <button onClick={async()=>{try{await apiFetch(`/filters/${f._id}`,{method:'DELETE'});load()}catch(e){showToast(e.message,'error')}}} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:14, lineHeight:1 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function IpBanSection({ currentUser }) {
  const { showToast } = useToast()
  const [bans, setBans] = useState([])
  const [ip, setIp] = useState('')
  const [reason, setReason] = useState('')

  const load = async () => { try { const d = await apiFetch('/ip-bans'); setBans(d.bans||[]) } catch(e) { showToast(e.message,'error') } }
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!ip.trim()) return
    try { await apiFetch('/ip-bans', { method:'POST', body:JSON.stringify({ ip:ip.trim(), reason }) }); setIp(''); setReason(''); load(); showToast('IP banned') } catch(e) { showToast(e.message,'error') }
  }

  return (
    <div>
      <SectionHeader icon="🛡️" title="IP Bans" count={bans.length}/>
      <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <input value={ip} onChange={e=>setIp(e.target.value)} placeholder="IP address…"
            style={{ flex:1, minWidth:140, background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'8px 12px', color:'#f1f5f9', fontSize:13, outline:'none' }}/>
          <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason (optional)"
            style={{ flex:2, minWidth:160, background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'8px 12px', color:'#f1f5f9', fontSize:13, outline:'none' }}/>
          <Btn variant='danger' onClick={add} disabled={!ip.trim()}>🛡 Ban IP</Btn>
        </div>
      </div>
      {bans.map(b=>(
        <div key={b._id} style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:10, padding:'12px 16px', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:'#ef4444', fontWeight:700 }}>{b.ip}</div>
            <div style={{ fontSize:12, color:'#6b7280' }}>{b.reason||'No reason'}</div>
          </div>
          <Btn variant='ghost' onClick={async()=>{try{await apiFetch(`/ip-bans/${b._id}`,{method:'DELETE'});load();showToast('IP unbanned')}catch(e){showToast(e.message,'error')}}}>Remove</Btn>
        </div>
      ))}
    </div>
  )
}

function NewsSection({ currentUser }) {
  const { showToast } = useToast()
  const [news, setNews] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const load = async () => { try { const d = await apiFetch('/news'); setNews(d.news||[]) } catch(e) { showToast(e.message,'error') } }
  useEffect(() => { load() }, [])

  const post = async () => {
    if (!title.trim()||!content.trim()) return
    try { await apiFetch('/news', { method:'POST', body:JSON.stringify({ title, content }) }); setTitle(''); setContent(''); load(); showToast('News posted!') } catch(e) { showToast(e.message,'error') }
  }

  return (
    <div>
      <SectionHeader icon="📰" title="News"/>
      {isAdmin(currentUser.rank) && (
        <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:16, marginBottom:16 }}>
          <Input label="Title" value={title} onChange={setTitle} placeholder="News title…"/>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', marginBottom:5 }}>CONTENT</div>
            <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="News content…" rows={4}
              style={{ width:'100%', background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'9px 13px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', resize:'vertical', outline:'none' }}/>
          </div>
          <Btn onClick={post} disabled={!title.trim()||!content.trim()}>📰 Post News</Btn>
        </div>
      )}
      {news.map(n=>(
        <div key={n._id} style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:'14px 16px', marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontWeight:700, color:'#f1f5f9' }}>{n.title}</div>
              <div style={{ fontSize:12, color:'#9ca3af', margin:'6px 0' }}>{n.content}</div>
              <div style={{ fontSize:11, color:'#4b5563' }}>by {n.author?.username||'Admin'} · {new Date(n.createdAt).toLocaleDateString()}</div>
            </div>
            {isAdmin(currentUser.rank) && (
              <Btn variant='danger' onClick={async()=>{if(confirm('Delete?'))try{await apiFetch(`/news/${n._id}`,{method:'DELETE'});load()}catch(e){showToast(e.message,'error')}}}>🗑</Btn>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function BroadcastSection({ currentUser }) {
  const { showToast } = useToast()
  const [msg, setMsg] = useState('')
  const [type, setType] = useState('info')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!msg.trim()) return
    setSending(true)
    try { await apiFetch('/broadcast', { method:'POST', body:JSON.stringify({ message:msg, type }) }); showToast('Broadcast sent!'); setMsg('') } catch(e) { showToast(e.message,'error') }
    setSending(false)
  }

  return (
    <div>
      <SectionHeader icon="📢" title="Broadcast Message"/>
      <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:20, maxWidth:600 }}>
        <Select label="Type" value={type} onChange={setType} options={[{value:'info',label:'ℹ️ Info'},{value:'warning',label:'⚠️ Warning'},{value:'success',label:'✅ Success'},{value:'error',label:'🚨 Alert'}]}/>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', marginBottom:5 }}>MESSAGE</div>
          <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Message to all connected users…" rows={4}
            style={{ width:'100%', background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'9px 13px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', resize:'vertical', outline:'none' }}/>
        </div>
        <Btn onClick={send} disabled={!msg.trim()||sending}>📢 Send to All</Btn>
        <div style={{ fontSize:12, color:'#6b7280', marginTop:10 }}>⚡ Sent via WebSocket to all currently connected users.</div>
      </div>
    </div>
  )
}

function StaffSection({ currentUser }) {
  const { showToast } = useToast()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/staff').then(d=>setStaff(d.staff||[])).catch(e=>showToast(e.message,'error')).finally(()=>setLoading(false))
  }, [])

  return (
    <div>
      <SectionHeader icon="👮" title="Staff" count={staff.length}/>
      {loading ? <div style={{ color:'#6b7280', textAlign:'center', padding:40 }}>Loading…</div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
          {staff.map(s=>(
            <div key={s._id} style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:16, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ position:'relative' }}>
                <Avatar src={s.avatar} size={44} gender={s.gender}/>
                <div style={{ position:'absolute', bottom:0, right:0, width:12, height:12, borderRadius:'50%', background:s.isOnline?'#22c55e':'#4b5563', border:'2px solid #131624' }}/>
              </div>
              <div>
                <div style={{ fontWeight:700, color:getRankColor(s.rank), fontSize:14 }}>{s.username}</div>
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                  <RIcon rank={s.rank} size={14}/>
                  <span style={{ fontSize:12, color:'#9ca3af' }}>{getRankLabel(s.rank)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LogsSection({ currentUser }) {
  const { showToast } = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try { const d = await apiFetch(`/logs?page=${page}&limit=50`); setLogs(d.logs||[]) } catch(e) { showToast(e.message,'error') }
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <SectionHeader icon="📋" title="Chat Logs"/>
      {loading ? <div style={{ color:'#6b7280', textAlign:'center', padding:40 }}>Loading…</div> : (
        <div style={{ background:'#0d1020', border:'1px solid #1e2436', borderRadius:12, overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr style={{ borderBottom:'1px solid #1e2436' }}>
              {['User','Room','Message','Time'].map(h=>(
                <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:'#6b7280', fontWeight:700, fontSize:11, textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {logs.map(l=>(
                <tr key={l._id} style={{ borderBottom:'1px solid #131624' }}>
                  <td style={{ padding:'8px 12px', color:getRankColor(l.sender?.rank), fontWeight:700, whiteSpace:'nowrap' }}>{l.sender?.username||'—'}</td>
                  <td style={{ padding:'8px 12px', color:'#9ca3af', fontSize:12 }}>{l.room}</td>
                  <td style={{ padding:'8px 12px', color:'#e2e8f0', maxWidth:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.content}</td>
                  <td style={{ padding:'8px 12px', color:'#4b5563', fontSize:11, whiteSpace:'nowrap' }}>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:14 }}>
        <Btn variant='ghost' disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</Btn>
        <span style={{ color:'#6b7280', padding:'6px 10px', fontSize:13 }}>Page {page}</span>
        <Btn variant='ghost' disabled={logs.length<50} onClick={()=>setPage(p=>p+1)}>Next →</Btn>
      </div>
    </div>
  )
}

// ══ RANK STYLES SECTION (CodyChat) ═══════════════════════════════
function RankStylesSection({ currentUser }) {
  const { showToast } = useToast()
  const [styles, setStyles] = useState({})
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState(null)      // rank key being edited
  const [form, setForm] = useState({})
  const [preview, setPreview] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const d = await apiFetch('/rank-styles'); setStyles(d.rankStyles||{}) } catch(e) { showToast(e.message,'error') }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openEdit = (rankKey) => {
    const s = styles[rankKey] || {}
    setSel(rankKey)
    setForm({
      color: s.color || '#aaaaaa',
      nameFont: s.nameFont || '',
      nameFontWeight: s.nameFontWeight || 'normal',
      nameFontStyle: s.nameFontStyle || 'normal',
      nameTextShadow: s.nameTextShadow || 'none',
      bubble: {
        bg: s.bubble?.bg || '#1a1a2e',
        borderColor: s.bubble?.borderColor || '#333333',
        borderRadius: s.bubble?.borderRadius ?? 12,
        borderWidth: s.bubble?.borderWidth ?? 1,
        padding: s.bubble?.padding || '9px 13px',
        boxShadow: s.bubble?.boxShadow || 'none',
        gradient: s.bubble?.gradient || '',
      }
    })
    setPreview(false)
  }

  const save = async () => {
    try {
      await apiFetch(`/rank-styles/${sel}`, { method:'PUT', body:JSON.stringify(form) })
      showToast(`${sel} style saved — synced live`)
      setStyles(prev => ({ ...prev, [sel]: form }))
      setSel(null)
    } catch(e) { showToast(e.message,'error') }
  }

  const reset = async (rankKey) => {
    if (!confirm(`Reset ${rankKey} to default style?`)) return
    try {
      const d = await apiFetch(`/rank-styles/${rankKey}/reset`, { method:'POST' })
      setStyles(prev => ({ ...prev, [rankKey]: d.style }))
      showToast(`${rankKey} reset`)
      if (sel === rankKey) setSel(null)
    } catch(e) { showToast(e.message,'error') }
  }

  const setB = (k, v) => setForm(f => ({ ...f, bubble: { ...f.bubble, [k]: v } }))

  const BubblePreview = () => (
    <div style={{
      background: form.bubble?.gradient || form.bubble?.bg,
      border: `${form.bubble?.borderWidth||1}px solid ${form.bubble?.borderColor}`,
      borderRadius: (form.bubble?.borderRadius||12)+'px',
      padding: form.bubble?.padding || '9px 13px',
      boxShadow: form.bubble?.boxShadow,
      maxWidth: 280, margin: '0 auto',
      fontFamily: form.nameFont ? `'${form.nameFont}', sans-serif` : 'inherit',
    }}>
      <div style={{ fontWeight: form.nameFontWeight, fontStyle: form.nameFontStyle, color: form.color, textShadow: form.nameTextShadow, fontSize:13, marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
        <RIcon rank={sel} size={14}/>
        <span>{RANKS[sel]?.label || sel}</span>
      </div>
      <div style={{ color:'#e2e8f0', fontSize:13 }}>This is a sample message preview!</div>
    </div>
  )

  return (
    <div>
      <SectionHeader icon="🎨" title="Rank Styles" right={
        <div style={{ fontSize:12, color:'#6b7280' }}>Changes sync live to all users</div>
      }/>
      {loading ? <div style={{ color:'#6b7280', textAlign:'center', padding:40 }}>Loading…</div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
          {RANKS_LIST.map(({ key }) => {
            const s = styles[key] || {}
            const bubble = s.bubble || {}
            return (
              <div key={key} style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:16 }}>
                {/* Live preview */}
                <div style={{
                  background: bubble.gradient || bubble.bg || '#1a1a2e',
                  border: `${bubble.borderWidth||1}px solid ${bubble.borderColor||'#333'}`,
                  borderRadius: (bubble.borderRadius||10)+'px',
                  padding: bubble.padding||'8px 12px',
                  boxShadow: bubble.boxShadow||'none',
                  marginBottom:12,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <RIcon rank={key} size={14}/>
                    <span style={{ color: s.color||getRankColor(key), fontWeight:s.nameFontWeight||'normal', fontStyle:s.nameFontStyle||'normal', textShadow:s.nameTextShadow||'none', fontSize:13, fontFamily:s.nameFont?`'${s.nameFont}',sans-serif`:'inherit' }}>
                      {RANKS[key]?.label||key}
                    </span>
                  </div>
                  <div style={{ color:'#9ca3af', fontSize:12 }}>Hello from {RANKS[key]?.label||key}!</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <Btn onClick={()=>openEdit(key)} style={{ flex:1 }}>✏️ Edit</Btn>
                  <Btn variant='ghost' onClick={()=>reset(key)}>↩</Btn>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {sel && (
        <Modal title={`Edit Rank Style — ${RANKS[sel]?.label||sel}`} onClose={()=>setSel(null)} width={600}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <ColorInput label="Name Color" value={form.color} onChange={v=>setForm(f=>({...f,color:v}))}/>
              <Input label="Name Font" value={form.nameFont} onChange={v=>setForm(f=>({...f,nameFont:v}))} placeholder="e.g. Orbitron"/>
              <Select label="Font Weight" value={form.nameFontWeight} onChange={v=>setForm(f=>({...f,nameFontWeight:v}))}
                options={[{value:'normal',label:'Normal'},{value:'500',label:'Medium'},{value:'600',label:'Semi Bold'},{value:'bold',label:'Bold'},{value:'900',label:'Black'}]}/>
              <Select label="Font Style" value={form.nameFontStyle} onChange={v=>setForm(f=>({...f,nameFontStyle:v}))}
                options={[{value:'normal',label:'Normal'},{value:'italic',label:'Italic'}]}/>
              <Input label="Text Shadow" value={form.nameTextShadow} onChange={v=>setForm(f=>({...f,nameTextShadow:v}))} placeholder="0 0 6px #fff"/>
            </div>
            <div>
              <ColorInput label="Bubble Background" value={form.bubble.bg} onChange={v=>setB('bg',v)}/>
              <ColorInput label="Border Color" value={form.bubble.borderColor} onChange={v=>setB('borderColor',v)}/>
              <Input label="Border Radius" value={form.bubble.borderRadius} onChange={v=>setB('borderRadius',+v)} type="number"/>
              <Input label="Border Width" value={form.bubble.borderWidth} onChange={v=>setB('borderWidth',+v)} type="number"/>
              <Input label="Padding" value={form.bubble.padding} onChange={v=>setB('padding',v)} placeholder="9px 13px"/>
            </div>
          </div>
          <Input label="Box Shadow" value={form.bubble.boxShadow} onChange={v=>setB('boxShadow',v)} placeholder="0 0 10px #00000055"/>
          <Input label="Gradient (overrides background)" value={form.bubble.gradient} onChange={v=>setB('gradient',v)} placeholder="linear-gradient(135deg, #1a1a2e, #2d1f5e)"/>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', marginBottom:8, textTransform:'uppercase' }}>Live Preview</div>
            <BubblePreview/>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant='ghost' onClick={()=>setSel(null)}>Cancel</Btn>
            <Btn onClick={save}>💾 Save Style</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ══ THEME COLORS SECTION (CodyChat) ══════════════════════════════
function ThemeSection({ currentUser }) {
  const { showToast } = useToast()
  const [colors, setColors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const d = await apiFetch('/theme'); setColors(d.themeColors||{}) } catch(e) { showToast(e.message,'error') }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try { await apiFetch('/theme', { method:'PUT', body:JSON.stringify(colors) }); showToast('Theme saved — synced live!') } catch(e) { showToast(e.message,'error') }
    setSaving(false)
  }

  const resetTheme = async () => {
    if (!confirm('Reset theme to defaults?')) return
    try { const d = await apiFetch('/theme/reset', { method:'POST' }); setColors(d.themeColors); showToast('Theme reset') } catch(e) { showToast(e.message,'error') }
  }

  const LABELS = {
    primary: 'Primary', secondary: 'Secondary', background: 'Background',
    surface: 'Surface', surfaceLight: 'Surface Light', text: 'Text',
    textMuted: 'Text Muted', accent: 'Accent', success: 'Success',
    warning: 'Warning', danger: 'Danger', border: 'Border',
  }

  return (
    <div>
      <SectionHeader icon="🎨" title="Theme Colors" right={
        <div style={{ display:'flex', gap:8 }}>
          <Btn variant='ghost' onClick={resetTheme}>↩ Reset</Btn>
          <Btn onClick={save} disabled={saving}>{saving?'Saving…':'💾 Save Theme'}</Btn>
        </div>
      }/>
      <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:20, marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16 }}>
          {Object.entries(LABELS).map(([key, label]) => (
            <ColorInput key={key} label={label} value={colors[key]||'#000000'} onChange={v=>setColors(c=>({...c,[key]:v}))}/>
          ))}
        </div>
      </div>
      {/* Live palette preview */}
      <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', marginBottom:12, textTransform:'uppercase' }}>Palette Preview</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {Object.entries(colors).map(([k,v]) => (
            <div key={k} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:44, height:44, borderRadius:8, background:v, border:'2px solid #2a2d3e' }}/>
              <span style={{ fontSize:10, color:'#6b7280' }}>{k}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══ FONTS SECTION (CodyChat) ══════════════════════════════════════
function FontsSection({ currentUser }) {
  const { showToast } = useToast()
  const [fonts, setFonts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const d = await apiFetch('/fonts'); setFonts(d.fonts||[]) } catch(e) { showToast(e.message,'error') }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const toggle = async (font) => {
    try {
      await apiFetch(`/fonts/${font.id}`, { method:'PUT', body:JSON.stringify({ active: !font.active }) })
      setFonts(prev => prev.map(f => f.id===font.id ? {...f, active:!f.active} : f))
      showToast(`${font.name} ${!font.active ? 'enabled' : 'disabled'}`)
    } catch(e) { showToast(e.message,'error') }
  }

  return (
    <div>
      <SectionHeader icon="🖋️" title="Chat Fonts" count={fonts.length} right={
        <div style={{ fontSize:12, color:'#6b7280' }}>{fonts.filter(f=>f.active!==false).length} active</div>
      }/>
      <div style={{ background:'#0d1020', border:'1px solid #1e2436', borderRadius:12, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr style={{ borderBottom:'1px solid #1e2436' }}>
            {['Font','Preview','Category','Active'].map(h=>(
              <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:'#6b7280', fontWeight:700, fontSize:11, textTransform:'uppercase' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding:40, textAlign:'center', color:'#6b7280' }}>Loading…</td></tr>
            ) : fonts.map(f => (
              <tr key={f.id} style={{ borderBottom:'1px solid #131624' }}>
                <td style={{ padding:'10px 12px', fontWeight:700, color:'#f1f5f9' }}>{f.name}</td>
                <td style={{ padding:'10px 12px' }}>
                  <div style={{ fontFamily:f.family, fontSize:f.size||15, color:'#e2e8f0' }}>The quick brown fox</div>
                </td>
                <td style={{ padding:'10px 12px' }}>
                  <BadgePill color='#8b5cf6' small>font</BadgePill>
                </td>
                <td style={{ padding:'10px 12px' }}>
                  <div onClick={()=>toggle(f)} style={{ width:44, height:24, borderRadius:99, background:f.active!==false?'#3b82f6':'#374151', position:'relative', cursor:'pointer', transition:'background .2s' }}>
                    <div style={{ position:'absolute', top:3, left:f.active!==false?21:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SettingsSection({ currentUser }) {
  const { showToast } = useToast()
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('general')

  const load = async () => { try { const d = await apiFetch('/settings'); setSettings(d.settings) } catch(e) { showToast(e.message,'error') } }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try { await apiFetch('/settings', { method:'PUT', body:JSON.stringify(settings) }); showToast('Settings saved!') } catch(e) { showToast(e.message,'error') }
    setSaving(false)
  }

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }))

  if (!settings) return <div style={{ color:'#6b7280', textAlign:'center', padding:40 }}>Loading settings…</div>

  const TABS = [
    { id:'general', label:'General' }, { id:'modules', label:'Modules' },
    { id:'wallet', label:'Wallet' }, { id:'games', label:'Games' },
    { id:'perms', label:'Permissions' }, { id:'staff', label:'Staff Perms' },
    { id:'email', label:'Email' }, { id:'groq', label:'AI Bot' },
  ]

  return (
    <div>
      <SectionHeader icon="⚙️" title="Settings" right={
        <Btn onClick={save} disabled={saving}>{saving?'Saving…':'💾 Save All'}</Btn>
      }/>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ background:tab===t.id?'#3b82f6':'#131624', border:`1px solid ${tab===t.id?'#3b82f6':'#2a2d3e'}`, borderRadius:8, padding:'7px 14px', color:tab===t.id?'#fff':'#9ca3af', fontWeight:700, fontSize:12, cursor:'pointer' }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:20 }}>
        {tab==='general' && <>
          <Input label="Site Name" value={settings.siteName||''} onChange={v=>set('siteName',v)}/>
          <Input label="Site Description" value={settings.siteDescription||''} onChange={v=>set('siteDescription',v)}/>
          <Toggle label="Maintenance Mode" checked={!!settings.maintenanceMode} onChange={v=>set('maintenanceMode',v)} hint="Blocks all non-staff users"/>
          <Input label="Maintenance Message" value={settings.maintenanceMsg||''} onChange={v=>set('maintenanceMsg',v)}/>
          <Toggle label="Allow Registration" checked={!!settings.allowRegistration} onChange={v=>set('allowRegistration',v)}/>
          <Toggle label="Allow Guests" checked={!!settings.allowGuests} onChange={v=>set('allowGuests',v)}/>
          <Toggle label="Require Email Verify" checked={!!settings.requireEmailVerify} onChange={v=>set('requireEmailVerify',v)}/>
          <Input label="Max Username Length" value={settings.maxUsernameLength||20} onChange={v=>set('maxUsernameLength',+v)} type="number"/>
          <Input label="Max Message Length" value={settings.maxMessageLength||2000} onChange={v=>set('maxMessageLength',+v)} type="number"/>
          <Input label="Chat Cooldown (seconds)" value={settings.chatCooldownSec||1} onChange={v=>set('chatCooldownSec',+v)} type="number"/>
        </>}
        {tab==='modules' && <>
          <Toggle label="Gifts" checked={!!settings.giftEnabled} onChange={v=>set('giftEnabled',v)}/>
          <Toggle label="Video Calls" checked={!!settings.videoCallEnabled} onChange={v=>set('videoCallEnabled',v)}/>
          <Toggle label="Audio Calls" checked={!!settings.audioCallEnabled} onChange={v=>set('audioCallEnabled',v)}/>
          <Toggle label="Group Calls" checked={!!settings.groupCallEnabled} onChange={v=>set('groupCallEnabled',v)}/>
          <Toggle label="Webcam" checked={!!settings.webcamEnabled} onChange={v=>set('webcamEnabled',v)}/>
          <Toggle label="Radio" checked={!!settings.radioEnabled} onChange={v=>set('radioEnabled',v)}/>
          <Toggle label="Wall Posts" checked={!!settings.wallEnabled} onChange={v=>set('wallEnabled',v)}/>
          <Toggle label="Giphy GIFs" checked={!!settings.giphyEnabled} onChange={v=>set('giphyEnabled',v)}/>
          <Toggle label="YouTube" checked={!!settings.youtubeEnabled} onChange={v=>set('youtubeEnabled',v)}/>
          <Toggle label="AI Bot" checked={!!settings.botEnabled} onChange={v=>set('botEnabled',v)}/>
          <Toggle label="Leaderboard" checked={!!settings.levelEnabled} onChange={v=>set('levelEnabled',v)}/>
          <Toggle label="Badges" checked={!!settings.badgeEnabled} onChange={v=>set('badgeEnabled',v)}/>
          <Toggle label="Quiz" checked={!!settings.quizEnabled} onChange={v=>set('quizEnabled',v)}/>
        </>}
        {tab==='wallet' && <>
          <Toggle label="Gold Enabled" checked={!!settings.goldEnabled} onChange={v=>set('goldEnabled',v)}/>
          <Input label="Gold per Message" value={settings.goldBase||1} onChange={v=>set('goldBase',+v)} type="number"/>
          <Input label="Login Bonus" value={settings.goldLoginBonus||50} onChange={v=>set('goldLoginBonus',+v)} type="number"/>
          <Input label="Streak Bonus" value={settings.goldLoginStreak||10} onChange={v=>set('goldLoginStreak',+v)} type="number"/>
          <Input label="Gold Earn Delay (min)" value={settings.goldDelay||1} onChange={v=>set('goldDelay',+v)} type="number"/>
          <Toggle label="Ruby Enabled" checked={!!settings.rubyEnabled} onChange={v=>set('rubyEnabled',v)}/>
          <Input label="Ruby Earn Delay (min)" value={settings.rubyDelay||60} onChange={v=>set('rubyDelay',+v)} type="number"/>
        </>}
        {tab==='games' && <>
          <Toggle label="Dice Enabled" checked={!!settings.diceEnabled} onChange={v=>set('diceEnabled',v)}/>
          <Input label="Dice Bet" value={settings.diceBet||100} onChange={v=>set('diceBet',+v)} type="number"/>
          <Input label="Dice Multiplier" value={settings.diceMultiplier||5.7} onChange={v=>set('diceMultiplier',+v)} type="number"/>
          <Toggle label="Keno Enabled" checked={!!settings.kenoEnabled} onChange={v=>set('kenoEnabled',v)}/>
          <Input label="Keno Min Bet" value={settings.kenoMinBet||2} onChange={v=>set('kenoMinBet',+v)} type="number"/>
          <Input label="Keno Max Bet" value={settings.kenoMaxBet||1000} onChange={v=>set('kenoMaxBet',+v)} type="number"/>
          <Toggle label="Spin Wheel Enabled" checked={!!settings.spinEnabled} onChange={v=>set('spinEnabled',v)}/>
          <Input label="Spin Cooldown (hours)" value={settings.spinCooldownHours||24} onChange={v=>set('spinCooldownHours',+v)} type="number"/>
        </>}
        {tab==='perms' && <>
          <div style={{ color:'#9ca3af', fontSize:12, marginBottom:16 }}>Set the minimum rank required to use each feature.</div>
          {[['allow_main','Send Main Chat'],['allow_private','Private Messages'],['allow_room','Create Room'],['allow_webcam','Use Webcam'],['allow_vcall','Video Call'],['allow_acall','Audio Call'],['allow_send_gift','Send Gifts'],['allow_audio','Voice Messages'],['allow_video','Video Upload'],['allow_name_color','Name Color'],['allow_name_grad','Name Gradient'],['allow_font','Chat Font'],['allow_font_size','Large Font Size'],['allow_games','Play Games']].map(([k,label])=>(
            <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #1a1d2e' }}>
              <div style={{ fontSize:13, color:'#e2e8f0' }}>{label}</div>
              <select value={settings[k]||'user'} onChange={e=>set(k,e.target.value)}
                style={{ background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:6, padding:'5px 10px', color:'#f1f5f9', fontSize:12 }}>
                {RANKS_LIST.map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </div>
          ))}
        </>}
        {tab==='staff' && <>
          <div style={{ color:'#9ca3af', fontSize:12, marginBottom:16 }}>Minimum staff rank required for each moderation action.</div>
          {[['can_mute','Mute Users'],['can_warn','Warn Users'],['can_kick','Kick Users'],['can_ghost','Ghost Users'],['can_ban','Ban Users'],['can_delete','Delete Messages'],['can_rank','Change Ranks'],['can_mroom','Manage Rooms'],['can_mip','Manage IP Bans']].map(([k,label])=>(
            <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #1a1d2e' }}>
              <div style={{ fontSize:13, color:'#e2e8f0' }}>{label}</div>
              <select value={settings[k]||'moderator'} onChange={e=>set(k,e.target.value)}
                style={{ background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:6, padding:'5px 10px', color:'#f1f5f9', fontSize:12 }}>
                {['moderator','admin','superadmin','owner'].map(r=><option key={r} value={r}>{RANKS[r]?.label||r}</option>)}
              </select>
            </div>
          ))}
        </>}
        {tab==='email' && <>
          <Input label="SMTP Host" value={settings.smtpHost||''} onChange={v=>set('smtpHost',v)} placeholder="smtp.gmail.com"/>
          <Input label="SMTP Port" value={settings.smtpPort||587} onChange={v=>set('smtpPort',+v)} type="number"/>
          <Input label="SMTP User" value={settings.smtpUser||''} onChange={v=>set('smtpUser',v)} placeholder="you@gmail.com"/>
          <Input label="SMTP Password" value={settings.smtpPass||''} onChange={v=>set('smtpPass',v)} type="password"/>
          <Input label="From Name" value={settings.emailFromName||''} onChange={v=>set('emailFromName',v)}/>
          <Input label="From Address" value={settings.emailFromAddress||''} onChange={v=>set('emailFromAddress',v)}/>
        </>}
        {tab==='groq' && <>
          <Toggle label="AI Bot Enabled" checked={!!settings.groqEnabled} onChange={v=>set('groqEnabled',v)}/>
          <Input label="Groq API Key" value={settings.groqApiKey||''} onChange={v=>set('groqApiKey',v)} placeholder="gsk_…" type="password"/>
          <Input label="Model" value={settings.groqModel||'llama3-8b-8192'} onChange={v=>set('groqModel',v)}/>
          <Input label="Trigger Word" value={settings.groqTrigger||'@GenZBot'} onChange={v=>set('groqTrigger',v)}/>
          <Input label="Max Tokens" value={settings.groqMaxTokens||150} onChange={v=>set('groqMaxTokens',+v)} type="number"/>
          <Input label="Cooldown (sec)" value={settings.groqCooldownSec||5} onChange={v=>set('groqCooldownSec',+v)} type="number"/>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', marginBottom:5, textTransform:'uppercase' }}>System Prompt</div>
            <textarea value={settings.groqSystemPrompt||''} onChange={e=>set('groqSystemPrompt',e.target.value)} rows={4}
              style={{ width:'100%', background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'9px 13px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', resize:'vertical', outline:'none' }}/>
          </div>
        </>}
      </div>
    </div>
  )
}

// ── MAIN ADMIN PANEL ───────────────────────────────────────────
export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate('/login'); return }
      if (!isStaff(user.rank)) { navigate('/'); return }
    }
  }, [user, authLoading, navigate])

  if (authLoading) return (
    <div style={{ minHeight:'100vh', background:'#0a0c16', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid #1e2436', borderTop:'3px solid #3b82f6', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!user || !isStaff(user.rank)) return null

  const NAV = [
    { id:'dashboard',    icon:'📊', label:'Dashboard',      always:true },
    { id:'users',        icon:'👥', label:'Users',           always:true },
    { id:'staff',        icon:'👮', label:'Staff',           always:true },
    { id:'rooms',        icon:'🏠', label:'Rooms',           always:true },
    { id:'reports',      icon:'🚨', label:'Reports',         always:true },
    { id:'gifts',        icon:'🎁', label:'Gifts',           admin:true  },
    { id:'badges',       icon:'🏅', label:'Badges',          admin:true  },
    { id:'filters',      icon:'🚫', label:'Word Filters',    always:true },
    { id:'ip-bans',      icon:'🛡️', label:'IP Bans',         admin:true  },
    { id:'news',         icon:'📰', label:'News',            always:true },
    { id:'broadcast',    icon:'📢', label:'Broadcast',       admin:true  },
    { id:'logs',         icon:'📋', label:'Chat Logs',       admin:true  },
    // CodyChat additions
    { id:'rank-styles',  icon:'🎨', label:'Rank Styles',     admin:true  },
    { id:'theme',        icon:'🖌️', label:'Theme Colors',    owner:true  },
    { id:'fonts',        icon:'🖋️', label:'Chat Fonts',      admin:true  },
    { id:'settings',     icon:'⚙️', label:'Settings',        admin:true  },
  ].filter(n => {
    if (n.always) return true
    if (n.owner && isOwner(user.rank)) return true
    if (n.admin && isAdmin(user.rank)) return true
    return false
  })

  const SECTION_MAP = {
    dashboard:   <DashboardSection user={user}/>,
    users:       <UsersSection currentUser={user}/>,
    staff:       <StaffSection currentUser={user}/>,
    rooms:       <RoomsSection currentUser={user}/>,
    reports:     <ReportsSection currentUser={user}/>,
    gifts:       <GiftsSection currentUser={user}/>,
    badges:      <BadgesSection currentUser={user}/>,
    filters:     <FiltersSection currentUser={user}/>,
    'ip-bans':   <IpBanSection currentUser={user}/>,
    news:        <NewsSection currentUser={user}/>,
    broadcast:   <BroadcastSection currentUser={user}/>,
    logs:        <LogsSection currentUser={user}/>,
    'rank-styles': <RankStylesSection currentUser={user}/>,
    theme:       <ThemeSection currentUser={user}/>,
    fonts:       <FontsSection currentUser={user}/>,
    settings:    <SettingsSection currentUser={user}/>,
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0a0c16', fontFamily:"'Nunito', sans-serif", color:'#f1f5f9' }}>
      {/* Sidebar */}
      <div style={{ width:sidebarOpen?220:64, transition:'width .2s', background:'#0d1020', borderRight:'1px solid #1e2436', display:'flex', flexDirection:'column', flexShrink:0, zIndex:100, position:'sticky', top:0, height:'100vh', overflowY:'auto', overflowX:'hidden' }}>
        {/* Logo */}
        <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid #1e2436', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>⚡</div>
          {sidebarOpen && <div>
            <div style={{ fontWeight:900, fontSize:14, color:'#f1f5f9', letterSpacing:.5 }}>ChatsGenZ</div>
            <div style={{ fontSize:10, color:'#6b7280', fontWeight:600, textTransform:'uppercase' }}>Admin Panel</div>
          </div>}
          <button onClick={()=>setSidebarOpen(o=>!o)} style={{ marginLeft:'auto', background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:16, flexShrink:0 }}>☰</button>
        </div>

        {/* Nav */}
        <nav style={{ padding:'10px 8px', flex:1 }}>
          {/* Group: System */}
          {sidebarOpen && <div style={{ fontSize:10, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:1, padding:'10px 12px 4px' }}>Management</div>}
          {NAV.filter(n=>!['rank-styles','theme','fonts','settings'].includes(n.id)).map(n=>(
            <button key={n.id} onClick={()=>setActiveSection(n.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:sidebarOpen?'9px 12px':'9px 0', justifyContent:sidebarOpen?'flex-start':'center', background:activeSection===n.id?'#1e2a45':'transparent', border:activeSection===n.id?'1px solid #2a3d6e':'1px solid transparent', borderRadius:9, color:activeSection===n.id?'#60a5fa':'#6b7280', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .15s', fontFamily:'inherit', marginBottom:2 }}>
              <span style={{ fontSize:15, flexShrink:0 }}>{n.icon}</span>
              {sidebarOpen && <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.label}</span>}
            </button>
          ))}

          {sidebarOpen && <div style={{ fontSize:10, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:1, padding:'14px 12px 4px' }}>Appearance</div>}
          {NAV.filter(n=>['rank-styles','theme','fonts'].includes(n.id)).map(n=>(
            <button key={n.id} onClick={()=>setActiveSection(n.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:sidebarOpen?'9px 12px':'9px 0', justifyContent:sidebarOpen?'flex-start':'center', background:activeSection===n.id?'#1e2a45':'transparent', border:activeSection===n.id?'1px solid #2a3d6e':'1px solid transparent', borderRadius:9, color:activeSection===n.id?'#60a5fa':'#6b7280', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .15s', fontFamily:'inherit', marginBottom:2 }}>
              <span style={{ fontSize:15, flexShrink:0 }}>{n.icon}</span>
              {sidebarOpen && <span>{n.label}</span>}
            </button>
          ))}

          {NAV.filter(n=>n.id==='settings').map(n=>(
            <button key={n.id} onClick={()=>setActiveSection(n.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:sidebarOpen?'9px 12px':'9px 0', justifyContent:sidebarOpen?'flex-start':'center', background:activeSection===n.id?'#1e2a45':'transparent', border:activeSection===n.id?'1px solid #2a3d6e':'1px solid transparent', borderRadius:9, color:activeSection===n.id?'#60a5fa':'#6b7280', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .15s', fontFamily:'inherit', marginBottom:2, marginTop:8 }}>
              <span style={{ fontSize:15, flexShrink:0 }}>{n.icon}</span>
              {sidebarOpen && <span>{n.label}</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding:'12px 8px', borderTop:'1px solid #1e2436' }}>
          <button onClick={()=>navigate('/')} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:sidebarOpen?'8px 12px':'8px 0', justifyContent:sidebarOpen?'flex-start':'center', background:'transparent', border:'1px solid transparent', borderRadius:9, color:'#6b7280', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            <Avatar src={user.avatar} size={28} gender={user.gender}/>
            {sidebarOpen && <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:getRankColor(user.rank) }}>{user.username}</span>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, minWidth:0, padding:'24px', overflowY:'auto' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          {SECTION_MAP[activeSection] || <div style={{ color:'#6b7280' }}>Section not found</div>}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        * { scrollbar-width: thin; scrollbar-color: #2a2d3e transparent; }
        *::-webkit-scrollbar { width:5px; }
        *::-webkit-scrollbar-thumb { background:#2a2d3e; border-radius:99px; }
        select option { background:#0d1020; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding:0; }
        input[type="color"]::-webkit-color-swatch { border:none; border-radius:4px; }
      `}</style>
    </div>
  )
}
