/**
 * ChatsGenZ — Admin Panel (Complete)
 * Route: /admin
 * Access: moderator+ only (checked on mount)
 * Matches backend: routes/admin.js, models/User.js, constants.js
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

function RIcon({ rank, size=16 }) {
  return (
    <img
      src={getRankIcon(rank)}
      alt=""
      style={{ width:size, height:size, objectFit:'contain', background:'transparent', flexShrink:0, display:'inline-block' }}
      onError={e => e.target.style.display='none'}
    />
  )
}

function Avatar({ src, size=36, gender }) {
  const fallback = gender==='female'?'/default_images/avatar/default_female.png':'/default_images/avatar/default_male.png'
  return (
    <img
      src={getAvatarUrl(src) || fallback}
      alt=""
      style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', background:'#1e2130', flexShrink:0 }}
      onError={e => { e.target.src = fallback }}
    />
  )
}

function Badge({ color='#1e2130', children, small }) {
  return (
    <span style={{
      background: color+'22', color, border:`1px solid ${color}55`,
      borderRadius:6, padding: small?'2px 7px':'3px 10px',
      fontSize: small?11:12, fontWeight:700, whiteSpace:'nowrap'
    }}>{children}</span>
  )
}

function Btn({ children, variant='primary', size='sm', onClick, disabled, style={} }) {
  const vars = {
    primary:  { bg:'#3b82f6', hover:'#2563eb', text:'#fff' },
    danger:   { bg:'#ef4444', hover:'#dc2626', text:'#fff' },
    success:  { bg:'#22c55e', hover:'#16a34a', text:'#fff' },
    warn:     { bg:'#f59e0b', hover:'#d97706', text:'#fff' },
    ghost:    { bg:'transparent', hover:'#ffffff11', text:'#9ca3af', border:'1px solid #2a2d3e' },
    purple:   { bg:'#8b5cf6', hover:'#7c3aed', text:'#fff' },
  }
  const v = vars[variant] || vars.primary
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: v.bg, color: v.text, border: v.border||'none',
        borderRadius:8, padding: size==='sm'?'6px 13px':'8px 18px',
        fontSize: size==='sm'?12:13, fontWeight:700, cursor:disabled?'not-allowed':'pointer',
        opacity: disabled?0.5:1, transition:'background .15s', ...style
      }}
      onMouseEnter={e => !disabled && (e.target.style.background=v.hover)}
      onMouseLeave={e => !disabled && (e.target.style.background=v.bg)}
    >{children}</button>
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
      <input
        type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        style={{ width:'100%', background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'9px 13px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit' }}
      />
      {hint && <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>{hint}</div>}
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>{label}</div>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'9px 13px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', cursor:'pointer' }}>
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
      <div onClick={() => onChange(!checked)} style={{
        width:44, height:24, borderRadius:99, background: checked?'#3b82f6':'#374151',
        position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0
      }}>
        <div style={{
          position:'absolute', top:3, left: checked?21:3, width:18, height:18,
          borderRadius:'50%', background:'#fff', transition:'left .2s'
        }}/>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color='#3b82f6', sub }) {
  return (
    <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:'18px 20px', flex:'1 1 160px', minWidth:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
        <span style={{ fontSize:12, color:'#6b7280', fontWeight:700, textTransform:'uppercase', letterSpacing:.5 }}>{label}</span>
      </div>
      <div style={{ fontSize:26, fontWeight:900, color:'#f1f5f9' }}>{value?.toLocaleString() ?? '—'}</div>
      {sub && <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>{sub}</div>}
    </div>
  )
}

function SectionHeader({ icon, title, count, right }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
      <span style={{ fontSize:18 }}>{icon}</span>
      <span style={{ fontWeight:800, fontSize:16, color:'#f1f5f9' }}>{title}</span>
      {count !== undefined && <Badge color='#6b7280' small>{count}</Badge>}
      {right && <div style={{ marginLeft:'auto' }}>{right}</div>}
    </div>
  )
}

// ── SECTIONS ───────────────────────────────────────────────────

function DashboardSection({ user }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/stats').then(d => setStats(d)).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  return (
    <div>
      <SectionHeader icon="📊" title="Dashboard" />
      {loading ? <div style={{ color:'#6b7280', textAlign:'center', padding:40 }}>Loading stats…</div> : stats ? (
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
  const [users, setUsers]     = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [pages, setPages]     = useState(1)
  const [search, setSearch]   = useState('')
  const [rankF, setRankF]     = useState('')
  const [bannedF, setBannedF] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [modal, setModal]     = useState(null) // 'view'|'ban'|'mute'|'gold'|'ruby'|'rank'|'profile'|'password'

  const [banReason, setBanReason]   = useState('')
  const [banExpiry, setBanExpiry]   = useState('')
  const [muteMin, setMuteMin]       = useState('30')
  const [muteReason, setMuteReason] = useState('')
  const [goldAmt, setGoldAmt]       = useState('')
  const [goldAct, setGoldAct]       = useState('add')
  const [rubyAmt, setRubyAmt]       = useState('')
  const [rubyAct, setRubyAct]       = useState('add')
  const [newRank, setNewRank]       = useState('')
  const [newPass, setNewPass]       = useState('')
  const [warnMsg, setWarnMsg]       = useState('')

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
            style={{ background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'7px 12px', color:'#f1f5f9', fontSize:12, width:180 }}/>
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
              <tr key={u._id} style={{ borderBottom:'1px solid #131624' }} onMouseEnter={e=>e.currentTarget.style.background='#131624'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'9px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Avatar src={u.avatar} size={32} gender={u.gender}/>
                    <div>
                      <div style={{ fontWeight:700, color:'#f1f5f9' }}>{u.username}</div>
                      <div style={{ fontSize:11, color:'#6b7280', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                    </div>
                    {u.isBanned && <Badge color='#ef4444' small>BANNED</Badge>}
                    {u.isMuted  && <Badge color='#f59e0b' small>MUTED</Badge>}
                    {u.isGhosted && <Badge color='#8b5cf6' small>GHOST</Badge>}
                  </div>
                </td>
                <td style={{ padding:'9px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <RIcon rank={u.rank}/>
                    <span style={{ color: getRankColor(u.rank), fontWeight:700, fontSize:12 }}>{getRankLabel(u.rank)}</span>
                  </div>
                </td>
                <td style={{ padding:'9px 12px', color:'#fbbf24', fontWeight:700 }}>{u.gold?.toLocaleString()??0}</td>
                <td style={{ padding:'9px 12px', color:'#f472b6', fontWeight:700 }}>{u.ruby?.toLocaleString()??0}</td>
                <td style={{ padding:'9px 12px', color:'#a78bfa' }}>{u.xp??0}</td>
                <td style={{ padding:'9px 12px' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background: u.isOnline?'#22c55e':'#4b5563', display:'inline-block' }}/>
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

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:14 }}>
          <Btn variant='ghost' disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</Btn>
          <span style={{ color:'#6b7280', padding:'6px 10px', fontSize:13 }}>Page {page} / {pages}</span>
          <Btn variant='ghost' disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next →</Btn>
        </div>
      )}

      {/* Modals */}
      {modal==='view' && selected && (
        <Modal title={`User: ${selected.username}`} onClose={()=>setModal(null)}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <Avatar src={selected.avatar} size={60} gender={selected.gender}/>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color: getRankColor(selected.rank) }}>{selected.username}</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>{selected.email}</div>
              <div style={{ display:'flex', gap:6, marginTop:4 }}>
                <Badge color={getRankColor(selected.rank)}>{getRankLabel(selected.rank)}</Badge>
                {selected.isBanned && <Badge color='#ef4444'>BANNED</Badge>}
                {selected.isMuted  && <Badge color='#f59e0b'>MUTED</Badge>}
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              ['💰 Gold', selected.gold?.toLocaleString()??0],
              ['💎 Ruby', selected.ruby?.toLocaleString()??0],
              ['⭐ XP', selected.xp??0],
              ['🎮 Level', selected.level??1],
              ['🌍 Country', selected.countryCode||'—'],
              ['👤 Gender', selected.gender||'—'],
              ['📅 Joined', selected.createdAt ? new Date(selected.createdAt).toLocaleDateString():'—'],
              ['🕒 Last Seen', selected.lastSeen ? new Date(selected.lastSeen).toLocaleString():'—'],
            ].map(([k,v])=>(
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
        <Modal title={selected.isBanned ? `Unban ${selected.username}` : `Ban ${selected.username}`} onClose={()=>setModal(null)}>
          {selected.isBanned ? (
            <>
              <div style={{ color:'#9ca3af', marginBottom:16 }}>Remove ban for <strong style={{ color:'#f1f5f9' }}>{selected.username}</strong>?</div>
              <Btn variant='success' onClick={()=>action('/unban')}>✅ Unban User</Btn>
            </>
          ) : (
            <>
              <Input label="Ban Reason" value={banReason} onChange={setBanReason} placeholder="e.g. Spamming, abusive behavior…"/>
              <Input label="Expiry (optional)" value={banExpiry} onChange={setBanExpiry} type="datetime-local" hint="Leave blank for permanent ban"/>
              <Btn variant='danger' disabled={!banReason.trim()} onClick={()=>action('/ban','PUT',{reason:banReason,expiry:banExpiry||null})}>🔨 Ban User</Btn>
            </>
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
            options={RANKS_LIST.filter(r => RL(r.key) < RL(currentUser.rank)).map(r=>({value:r.key,label:r.label}))}/>
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
  const [rooms, setRooms]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null)
  const [sel, setSel]       = useState(null)
  const [form, setForm]     = useState({ name:'', description:'', type:'public', password:'', minRank:'guest', isPinned:false, maxUsers:500, icon:'' })

  const load = () => {
    setLoading(true)
    apiFetch('/rooms').then(d=>setRooms(d.rooms)).catch(e=>showToast(e.message,'error')).finally(()=>setLoading(false))
  }
  useEffect(()=>load(),[])

  const save = async () => {
    try {
      if (sel) {
        await apiFetch(`/rooms/${sel._id}`,'PUT',{ body: JSON.stringify(form) })
      } else {
        await apiFetch('/rooms','POST',{ method:'POST', body: JSON.stringify(form) })
      }
      showToast(sel?'Room updated!':'Room created!','success')
      setModal(null); load()
    } catch(e) { showToast(e.message,'error') }
  }

  const deleteRoom = async (id) => {
    if (!confirm('Delete this room?')) return
    try { await apiFetch(`/rooms/${id}`,{method:'DELETE'}); showToast('Deleted','success'); load() }
    catch(e) { showToast(e.message,'error') }
  }

  const clearMsgs = async (id) => {
    if (!confirm('Clear all messages?')) return
    try { await apiFetch(`/rooms/${id}/messages`,{method:'DELETE'}); showToast('Messages cleared','success') }
    catch(e) { showToast(e.message,'error') }
  }

  return (
    <div>
      <SectionHeader icon="🏠" title="Rooms" count={rooms.length} right={
        isAdmin(currentUser.rank) && <Btn variant='success' onClick={()=>{setSel(null);setForm({name:'',description:'',type:'public',password:'',minRank:'guest',isPinned:false,maxUsers:500,icon:''});setModal('form')}}>+ Create Room</Btn>
      }/>
      <div style={{ display:'grid', gap:10 }}>
        {loading ? <div style={{ color:'#6b7280', padding:40, textAlign:'center' }}>Loading…</div>
        : rooms.map(room => (
          <div key={room._id} style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
            <img src={room.icon||'/default_images/rooms/default_room.png'} alt="" style={{ width:44, height:44, borderRadius:10, objectFit:'cover', background:'#0d1020' }} onError={e=>e.target.src='/default_images/rooms/default_room.png'}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontWeight:800, fontSize:14, color:'#f1f5f9' }}>{room.name}</span>
                {room.isPinned && <Badge color='#f59e0b' small>📌 PINNED</Badge>}
                {!room.isActive && <Badge color='#ef4444' small>INACTIVE</Badge>}
                <Badge color='#6b7280' small>{room.type}</Badge>
              </div>
              <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{room.description || 'No description'}</div>
              <div style={{ fontSize:11, color:'#4b5563', marginTop:2 }}>Max: {room.maxUsers} · Min Rank: {getRankLabel(room.minRank)} · Owner: {room.owner?.username||'—'}</div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {isAdmin(currentUser.rank) && <>
                <Btn variant='primary' size='sm' onClick={()=>{setSel(room);setForm({name:room.name,description:room.description||'',type:room.type,password:room.password||'',minRank:room.minRank||'guest',isPinned:room.isPinned||false,maxUsers:room.maxUsers||500,icon:room.icon||''});setModal('form')}}>✏️</Btn>
                <Btn variant='warn' size='sm' onClick={()=>clearMsgs(room._id)}>🗑 Msgs</Btn>
                <Btn variant='danger' size='sm' onClick={()=>deleteRoom(room._id)}>🗑</Btn>
              </>}
            </div>
          </div>
        ))}
      </div>

      {modal==='form' && (
        <Modal title={sel?'Edit Room':'Create Room'} onClose={()=>setModal(null)}>
          <Input label="Room Name" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Global Chat"/>
          <Input label="Description" value={form.description} onChange={v=>setForm(f=>({...f,description:v}))} placeholder="Room description…"/>
          <Input label="Icon URL (optional)" value={form.icon} onChange={v=>setForm(f=>({...f,icon:v}))} placeholder="https://…"/>
          <Select label="Type" value={form.type} onChange={v=>setForm(f=>({...f,type:v}))} options={[{value:'public',label:'Public'},{value:'private',label:'Private'},{value:'vip',label:'VIP'}]}/>
          <Select label="Min Rank" value={form.minRank} onChange={v=>setForm(f=>({...f,minRank:v}))} options={RANKS_LIST.map(r=>({value:r.key,label:r.label}))}/>
          <Input label="Password (optional)" value={form.password} onChange={v=>setForm(f=>({...f,password:v}))} type="password"/>
          <Input label="Max Users" value={String(form.maxUsers)} onChange={v=>setForm(f=>({...f,maxUsers:+v}))} type="number"/>
          <Toggle label="Pinned Room" checked={form.isPinned} onChange={v=>setForm(f=>({...f,isPinned:v}))}/>
          <div style={{ marginTop:16 }}>
            <Btn variant='success' disabled={!form.name.trim()} onClick={save}>{sel?'💾 Save':'✅ Create'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ReportsSection({ currentUser }) {
  const { showToast } = useToast()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    apiFetch('/reports').then(d=>setReports(d.reports)).catch(e=>showToast(e.message,'error')).finally(()=>setLoading(false))
  }
  useEffect(()=>load(),[])

  const resolve  = async (id) => { try { await apiFetch(`/reports/${id}/resolve`,'PUT',{body:'{}'}); showToast('Resolved','success'); load() } catch(e) { showToast(e.message,'error') } }
  const dismiss  = async (id) => { try { await apiFetch(`/reports/${id}/dismiss`,'PUT',{body:'{}'}); showToast('Dismissed','success'); load() } catch(e) { showToast(e.message,'error') } }

  const STATUS_COLOR = { pending:'#f59e0b', resolved:'#22c55e', dismissed:'#6b7280', actioned:'#ef4444' }

  return (
    <div>
      <SectionHeader icon="🚨" title="Reports" count={reports.filter(r=>r.status==='pending').length}/>
      <div style={{ display:'grid', gap:10 }}>
        {loading ? <div style={{ color:'#6b7280', padding:40, textAlign:'center' }}>Loading…</div>
        : reports.length===0 ? <div style={{ color:'#6b7280', textAlign:'center', padding:40 }}>No reports</div>
        : reports.map(r=>(
          <div key={r._id} style={{ background:'#131624', border:`1px solid ${STATUS_COLOR[r.status]||'#1e2436'}33`, borderRadius:12, padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <Avatar src={r.reporter?.avatar} size={36} gender={r.reporter?.gender}/>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontWeight:700, color:'#f1f5f9' }}>{r.reporter?.username||'Anon'}</span>
                  <span style={{ color:'#6b7280', fontSize:12 }}>reported</span>
                  <span style={{ fontWeight:700, color:'#ef4444' }}>{r.reportedUser?.username||'Unknown'}</span>
                  <Badge color={STATUS_COLOR[r.status]||'#6b7280'} small>{r.status}</Badge>
                </div>
                <div style={{ fontSize:13, color:'#d1d5db', marginTop:4 }}>{r.reason||'No reason'}</div>
                {r.content && <div style={{ fontSize:12, color:'#6b7280', marginTop:2, fontStyle:'italic' }}>"{r.content}"</div>}
                <div style={{ fontSize:11, color:'#4b5563', marginTop:4 }}>{r.createdAt?new Date(r.createdAt).toLocaleString():''}</div>
              </div>
              {r.status==='pending' && (
                <div style={{ display:'flex', gap:6 }}>
                  <Btn variant='success' size='sm' onClick={()=>resolve(r._id)}>✅ Resolve</Btn>
                  <Btn variant='ghost' size='sm' onClick={()=>dismiss(r._id)}>✖ Dismiss</Btn>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GiftsSection({ currentUser }) {
  const { showToast } = useToast()
  const [gifts, setGifts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [sel, setSel]       = useState(null)
  const [form, setForm]     = useState({ name:'', icon:'', price:10, description:'', category:'general', isActive:true })

  const load = () => apiFetch('/gifts').then(d=>setGifts(d.gifts)).catch(e=>showToast(e.message,'error')).finally(()=>setLoading(false))
  useEffect(()=>load(),[])

  const save = async () => {
    try {
      if (sel) await apiFetch(`/gifts/${sel._id}`,{method:'PUT',body:JSON.stringify(form)})
      else await apiFetch('/gifts',{method:'POST',body:JSON.stringify(form)})
      showToast(sel?'Gift updated!':'Gift created!','success')
      setModal(false); load()
    } catch(e) { showToast(e.message,'error') }
  }

  const del = async (id) => {
    if(!confirm('Delete gift?')) return
    try { await apiFetch(`/gifts/${id}`,{method:'DELETE'}); showToast('Deleted','success'); load() } catch(e) { showToast(e.message,'error') }
  }

  return (
    <div>
      <SectionHeader icon="🎁" title="Gift Management" count={gifts.length} right={
        isAdmin(currentUser.rank) && <Btn variant='success' onClick={()=>{setSel(null);setForm({name:'',icon:'',price:10,description:'',category:'general',isActive:true});setModal(true)}}>+ Add Gift</Btn>
      }/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
        {loading ? <div style={{ color:'#6b7280' }}>Loading…</div>
        : gifts.map(g=>(
          <div key={g._id} style={{ background:'#131624', border:`1px solid ${g.isActive?'#1e2436':'#ef444433'}`, borderRadius:12, padding:14, textAlign:'center', position:'relative' }}>
            <img src={getGiftIcon(g.icon)} alt={g.name} style={{ width:60, height:60, objectFit:'contain', margin:'0 auto 8px' }} onError={e=>e.target.style.opacity=.3}/>
            <div style={{ fontWeight:700, fontSize:13, color:'#f1f5f9', marginBottom:4 }}>{g.name}</div>
            <div style={{ fontSize:12, color:'#fbbf24' }}>💰 {g.price}</div>
            {!g.isActive && <Badge color='#ef4444' small>INACTIVE</Badge>}
            {isAdmin(currentUser.rank) && (
              <div style={{ display:'flex', gap:6, marginTop:10, justifyContent:'center' }}>
                <Btn variant='primary' size='sm' onClick={()=>{setSel(g);setForm({name:g.name,icon:g.icon,price:g.price,description:g.description||'',category:g.category||'general',isActive:g.isActive});setModal(true)}}>✏️</Btn>
                <Btn variant='danger' size='sm' onClick={()=>del(g._id)}>🗑</Btn>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={sel?'Edit Gift':'Add Gift'} onClose={()=>setModal(false)}>
          <Input label="Gift Name" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Rose"/>
          <Input label="Icon Filename" value={form.icon} onChange={v=>setForm(f=>({...f,icon:v}))} placeholder="rose.svg" hint="Must exist in /public/gifts/"/>
          {form.icon && <div style={{ textAlign:'center', marginBottom:14 }}><img src={`/gifts/${form.icon}`} style={{ width:60, height:60, objectFit:'contain' }} onError={e=>e.target.style.opacity=.3}/></div>}
          <Input label="Price (Gold)" value={String(form.price)} onChange={v=>setForm(f=>({...f,price:+v}))} type="number"/>
          <Input label="Description" value={form.description} onChange={v=>setForm(f=>({...f,description:v}))} placeholder="Optional description"/>
          <Input label="Category" value={form.category} onChange={v=>setForm(f=>({...f,category:v}))} placeholder="general"/>
          <Toggle label="Active" checked={form.isActive} onChange={v=>setForm(f=>({...f,isActive:v}))}/>
          <div style={{ marginTop:16 }}>
            <Btn variant='success' disabled={!form.name||!form.icon} onClick={save}>{sel?'💾 Save':'✅ Create'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

function BadgesSection({ currentUser }) {
  const { showToast } = useToast()
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title:'', icon:'', description:'', minLevel:1, isAutoAwarded:false })

  const load = () => apiFetch('/badges').then(d=>setBadges(d.badges)).catch(()=>{}).finally(()=>setLoading(false))
  useEffect(()=>load(),[])

  const save = async () => {
    try {
      await apiFetch('/badges',{method:'POST',body:JSON.stringify(form)})
      showToast('Badge created!','success'); setModal(false); load()
    } catch(e) { showToast(e.message,'error') }
  }

  const del = async (id) => {
    if(!confirm('Delete badge?')) return
    try { await apiFetch(`/badges/${id}`,{method:'DELETE'}); showToast('Deleted','success'); load() } catch(e) { showToast(e.message,'error') }
  }

  return (
    <div>
      <SectionHeader icon="🏅" title="Badges" count={badges.length} right={
        isOwner(currentUser.rank) && <Btn variant='success' onClick={()=>{setForm({title:'',icon:'',description:'',minLevel:1,isAutoAwarded:false});setModal(true)}}>+ Add Badge</Btn>
      }/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
        {loading ? <div style={{ color:'#6b7280' }}>Loading…</div>
        : badges.map(b=>(
          <div key={b._id} style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:14, textAlign:'center' }}>
            <img src={getBadgeIcon(b.icon)} alt={b.title} style={{ width:50, height:50, objectFit:'contain', margin:'0 auto 8px' }} onError={e=>e.target.style.opacity=.3}/>
            <div style={{ fontWeight:700, fontSize:13, color:'#f1f5f9' }}>{b.title}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{b.description||'No description'}</div>
            <div style={{ fontSize:11, color:'#a78bfa', marginTop:2 }}>Min Level: {b.minLevel}</div>
            {b.isAutoAwarded && <Badge color='#22c55e' small>AUTO</Badge>}
            {isOwner(currentUser.rank) && (
              <Btn variant='danger' size='sm' style={{ marginTop:10 }} onClick={()=>del(b._id)}>🗑 Delete</Btn>
            )}
          </div>
        ))}
      </div>

      {modal && isOwner(currentUser.rank) && (
        <Modal title="Create Badge" onClose={()=>setModal(false)}>
          <Input label="Badge Title" value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="e.g. Chat Master"/>
          <Input label="Icon Filename" value={form.icon} onChange={v=>setForm(f=>({...f,icon:v}))} placeholder="badge_chat.svg" hint="Must exist in /public/icons/badges/"/>
          {form.icon && <div style={{ textAlign:'center', marginBottom:14 }}><img src={getBadgeIcon(form.icon)} style={{ width:50,height:50,objectFit:'contain' }} onError={e=>e.target.style.opacity=.3}/></div>}
          <Input label="Description" value={form.description} onChange={v=>setForm(f=>({...f,description:v}))}/>
          <Input label="Min Level Required" value={String(form.minLevel)} onChange={v=>setForm(f=>({...f,minLevel:+v}))} type="number"/>
          <Toggle label="Auto Award" checked={form.isAutoAwarded} onChange={v=>setForm(f=>({...f,isAutoAwarded:v}))} hint="Auto-award when user hits min level"/>
          <div style={{ marginTop:16 }}><Btn variant='success' disabled={!form.title||!form.icon} onClick={save}>✅ Create</Btn></div>
        </Modal>
      )}
    </div>
  )
}

function FiltersSection({ currentUser }) {
  const { showToast } = useToast()
  const [words, setWords]   = useState([])
  const [loading, setLoading] = useState(true)
  const [word, setWord]     = useState('')
  const [action, setAction] = useState('replace')
  const [repl, setRepl]     = useState('***')

  const load = () => apiFetch('/filters').then(d=>setWords(d.words)).catch(()=>{}).finally(()=>setLoading(false))
  useEffect(()=>load(),[])

  const add = async () => {
    if(!word.trim()) return
    try { await apiFetch('/filters',{method:'POST',body:JSON.stringify({word,action,replacement:repl})}); showToast('Filter added','success'); setWord(''); load() }
    catch(e) { showToast(e.message,'error') }
  }

  const del = async (id) => {
    try { await apiFetch(`/filters/${id}`,{method:'DELETE'}); showToast('Removed','success'); load() }
    catch(e) { showToast(e.message,'error') }
  }

  return (
    <div>
      <SectionHeader icon="🚫" title="Word Filters" count={words.length}/>
      <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div>
            <div style={{ fontSize:11, color:'#6b7280', marginBottom:4, fontWeight:700 }}>WORD / PHRASE</div>
            <input value={word} onChange={e=>setWord(e.target.value)} placeholder="e.g. badword"
              style={{ background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'8px 12px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', width:180 }}/>
          </div>
          <div>
            <div style={{ fontSize:11, color:'#6b7280', marginBottom:4, fontWeight:700 }}>ACTION</div>
            <select value={action} onChange={e=>setAction(e.target.value)}
              style={{ background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'8px 10px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit' }}>
              <option value="replace">Replace</option>
              <option value="block">Block</option>
              <option value="warn">Warn</option>
            </select>
          </div>
          {action==='replace' && (
            <div>
              <div style={{ fontSize:11, color:'#6b7280', marginBottom:4, fontWeight:700 }}>REPLACEMENT</div>
              <input value={repl} onChange={e=>setRepl(e.target.value)} placeholder="***"
                style={{ background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'8px 12px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', width:100 }}/>
            </div>
          )}
          <Btn variant='success' onClick={add} disabled={!word.trim()}>+ Add Filter</Btn>
        </div>
      </div>

      <div style={{ display:'grid', gap:8 }}>
        {loading ? <div style={{ color:'#6b7280' }}>Loading…</div>
        : words.length===0 ? <div style={{ color:'#6b7280', textAlign:'center', padding:30 }}>No filters set</div>
        : words.map(w=>(
          <div key={w._id} style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <Badge color='#ef4444'>{w.word}</Badge>
            <span style={{ color:'#6b7280', fontSize:12 }}>→</span>
            <Badge color='#f59e0b' small>{w.action}</Badge>
            {w.replacement && <span style={{ color:'#9ca3af', fontSize:12 }}>"{w.replacement}"</span>}
            <div style={{ marginLeft:'auto' }}><Btn variant='danger' size='sm' onClick={()=>del(w._id)}>✖</Btn></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function IpBanSection({ currentUser }) {
  const { showToast } = useToast()
  const [bans, setBans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [ip, setIp]         = useState('')
  const [reason, setReason] = useState('')
  const [expiry, setExpiry] = useState('')

  const load = () => apiFetch('/ip-bans').then(d=>setBans(d.bans)).catch(()=>{}).finally(()=>setLoading(false))
  useEffect(()=>load(),[])

  const add = async () => {
    if(!ip.trim()) return
    try { await apiFetch('/ip-bans',{method:'POST',body:JSON.stringify({ip,reason,expiry:expiry||null})}); showToast('IP Banned','success'); setIp(''); setReason(''); load() }
    catch(e) { showToast(e.message,'error') }
  }

  const del = async (id) => {
    try { await apiFetch(`/ip-bans/${id}`,{method:'DELETE'}); showToast('IP ban removed','success'); load() }
    catch(e) { showToast(e.message,'error') }
  }

  return (
    <div>
      <SectionHeader icon="🛡️" title="IP Bans" count={bans.length}/>
      <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div style={{ flex:1, minWidth:140 }}>
            <div style={{ fontSize:11, color:'#6b7280', marginBottom:4, fontWeight:700 }}>IP ADDRESS</div>
            <input value={ip} onChange={e=>setIp(e.target.value)} placeholder="e.g. 192.168.1.1"
              style={{ width:'100%', background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'8px 12px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit' }}/>
          </div>
          <div style={{ flex:1, minWidth:140 }}>
            <div style={{ fontSize:11, color:'#6b7280', marginBottom:4, fontWeight:700 }}>REASON</div>
            <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Ban reason…"
              style={{ width:'100%', background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'8px 12px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit' }}/>
          </div>
          <div>
            <div style={{ fontSize:11, color:'#6b7280', marginBottom:4, fontWeight:700 }}>EXPIRY</div>
            <input type="datetime-local" value={expiry} onChange={e=>setExpiry(e.target.value)}
              style={{ background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'8px 10px', color:'#f1f5f9', fontSize:12, fontFamily:'inherit' }}/>
          </div>
          <Btn variant='danger' onClick={add} disabled={!ip.trim()}>🚫 Ban IP</Btn>
        </div>
      </div>

      <div style={{ display:'grid', gap:8 }}>
        {loading ? <div style={{ color:'#6b7280' }}>Loading…</div>
        : bans.length===0 ? <div style={{ color:'#6b7280', textAlign:'center', padding:30 }}>No IP bans</div>
        : bans.map(b=>(
          <div key={b._id} style={{ background:'#131624', border:'1px solid #ef444433', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <Badge color='#ef4444'>{b.ip}</Badge>
            <span style={{ flex:1, color:'#9ca3af', fontSize:12 }}>{b.reason||'No reason'}</span>
            {b.expiry && <span style={{ fontSize:11, color:'#6b7280' }}>Expires: {new Date(b.expiry).toLocaleDateString()}</span>}
            <Btn variant='success' size='sm' onClick={()=>del(b._id)}>🔓 Remove</Btn>
          </div>
        ))}
      </div>
    </div>
  )
}

function NewsSection({ currentUser }) {
  const { showToast } = useToast()
  const [news, setNews]     = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle]   = useState('')
  const [content, setContent] = useState('')

  const load = () => apiFetch('/news').then(d=>setNews(d.news)).catch(()=>{}).finally(()=>setLoading(false))
  useEffect(()=>load(),[])

  const post = async () => {
    if(!title.trim()||!content.trim()) return
    try { await apiFetch('/news',{method:'POST',body:JSON.stringify({title,content})}); showToast('Posted!','success'); setTitle(''); setContent(''); load() }
    catch(e) { showToast(e.message,'error') }
  }

  const del = async (id) => {
    try { await apiFetch(`/news/${id}`,{method:'DELETE'}); showToast('Deleted','success'); load() }
    catch(e) { showToast(e.message,'error') }
  }

  return (
    <div>
      <SectionHeader icon="📰" title="News & Announcements" count={news.length}/>
      {isAdmin(currentUser.rank) && (
        <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:16, marginBottom:16 }}>
          <Input label="Title" value={title} onChange={setTitle} placeholder="News title…"/>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>Content</div>
            <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="News content…" rows={4}
              style={{ width:'100%', background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'9px 13px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', resize:'vertical' }}/>
          </div>
          <Btn variant='success' disabled={!title.trim()||!content.trim()} onClick={post}>📰 Post News</Btn>
        </div>
      )}
      <div style={{ display:'grid', gap:10 }}>
        {loading ? <div style={{ color:'#6b7280' }}>Loading…</div>
        : news.length===0 ? <div style={{ color:'#6b7280', textAlign:'center', padding:30 }}>No news posted</div>
        : news.map(n=>(
          <div key={n._id} style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:14, color:'#f1f5f9' }}>{n.title}</div>
                <div style={{ fontSize:13, color:'#9ca3af', marginTop:4 }}>{n.content}</div>
                <div style={{ fontSize:11, color:'#4b5563', marginTop:6 }}>{n.createdAt?new Date(n.createdAt).toLocaleString():''}</div>
              </div>
              {isAdmin(currentUser.rank) && <Btn variant='danger' size='sm' onClick={()=>del(n._id)}>🗑</Btn>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BroadcastSection({ currentUser }) {
  const { showToast } = useToast()
  const [msg, setMsg] = useState('')
  const [type, setType] = useState('system')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if(!msg.trim()) return
    setSending(true)
    try { await apiFetch('/broadcast',{method:'POST',body:JSON.stringify({message:msg,type})}); showToast('Broadcast sent to all users!','success'); setMsg('') }
    catch(e) { showToast(e.message,'error') }
    setSending(false)
  }

  return (
    <div>
      <SectionHeader icon="📢" title="Broadcast Message"/>
      <div style={{ background:'#131624', border:'1px solid #f59e0b33', borderRadius:12, padding:20 }}>
        <div style={{ background:'#451a0333', border:'1px solid #f59e0b33', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#fbbf24' }}>
          ⚠️ This message will be sent to ALL registered users via notification, and shown in all chat rooms.
        </div>
        <Select label="Message Type" value={type} onChange={setType}
          options={[{value:'system',label:'System'},{value:'info',label:'Info'},{value:'warn',label:'Warning'},{value:'announce',label:'Announcement'}]}/>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>Message</div>
          <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Broadcast message…" rows={4}
            style={{ width:'100%', background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'9px 13px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', resize:'vertical' }}/>
        </div>
        <Btn variant='warn' disabled={!msg.trim()||sending} onClick={send}>📢 {sending?'Sending…':'Send Broadcast'}</Btn>
      </div>
    </div>
  )
}

function SettingsSection({ currentUser }) {
  const { showToast } = useToast()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('general')

  useEffect(() => {
    apiFetch('/settings').then(d=>setSettings(d.settings)).catch(e=>showToast(e.message,'error')).finally(()=>setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await apiFetch('/settings',{method:'PUT',body:JSON.stringify(settings)}); showToast('Settings saved!','success') }
    catch(e) { showToast(e.message,'error') }
    setSaving(false)
  }

  const upd = (key, val) => setSettings(s=>({...s,[key]:val}))

  if (loading) return <div style={{ color:'#6b7280', textAlign:'center', padding:40 }}>Loading settings…</div>
  if (!settings) return <div style={{ color:'#ef4444' }}>Failed to load settings</div>

  const tabs = [
    { id:'general', label:'⚙️ General' },
    { id:'modules', label:'🧩 Modules' },
    { id:'wallet',  label:'💰 Wallet' },
    { id:'games',   label:'🎮 Games' },
    { id:'perms',   label:'🔐 Permissions' },
    { id:'staff',   label:'👮 Staff Perms' },
    { id:'email',   label:'📧 Email' },
    { id:'groq',    label:'🤖 AI Bot' },
  ]

  const RANK_OPTS = RANKS_LIST.map(r=>({value:r.key,label:r.label}))

  return (
    <div>
      <SectionHeader icon="⚙️" title="Site Settings" right={
        <Btn variant='success' disabled={saving} onClick={save}>{saving?'Saving…':'💾 Save All'}</Btn>
      }/>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ background: tab===t.id?'#3b82f6':'#131624', border:`1px solid ${tab===t.id?'#3b82f6':'#2a2d3e'}`, borderRadius:8, padding:'7px 14px', color: tab===t.id?'#fff':'#9ca3af', fontWeight:700, fontSize:12, cursor:'pointer' }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background:'#131624', border:'1px solid #1e2436', borderRadius:12, padding:20 }}>
        {tab==='general' && <>
          <Input label="Site Name" value={settings.siteName||''} onChange={v=>upd('siteName',v)}/>
          <Input label="Site Description" value={settings.siteDescription||''} onChange={v=>upd('siteDescription',v)}/>
          <Input label="Max Username Length" value={String(settings.maxUsernameLength||20)} onChange={v=>upd('maxUsernameLength',+v)} type="number"/>
          <Input label="Max Message Length" value={String(settings.maxMessageLength||2000)} onChange={v=>upd('maxMessageLength',+v)} type="number"/>
          <Input label="Max Rooms" value={String(settings.maxRooms||50)} onChange={v=>upd('maxRooms',+v)} type="number"/>
          <Input label="Chat Cooldown (seconds)" value={String(settings.chatCooldownSec||1)} onChange={v=>upd('chatCooldownSec',+v)} type="number"/>
          <Toggle label="Maintenance Mode" checked={!!settings.maintenanceMode} onChange={v=>upd('maintenanceMode',v)} hint="Blocks all users except staff"/>
          {settings.maintenanceMode && <Input label="Maintenance Message" value={settings.maintenanceMsg||''} onChange={v=>upd('maintenanceMsg',v)}/>}
          <Toggle label="Allow Registration" checked={!!settings.allowRegistration} onChange={v=>upd('allowRegistration',v)}/>
          <Toggle label="Allow Guests" checked={!!settings.allowGuests} onChange={v=>upd('allowGuests',v)}/>
          <Toggle label="Require Email Verify" checked={!!settings.requireEmailVerify} onChange={v=>upd('requireEmailVerify',v)}/>
          <Toggle label="CAPTCHA Enabled" checked={!!settings.captchaEnabled} onChange={v=>upd('captchaEnabled',v)}/>
          <Toggle label="VPN Block Enabled" checked={!!settings.vpnBlockEnabled} onChange={v=>upd('vpnBlockEnabled',v)}/>
          <Toggle label="Show Gender" checked={!!settings.useGender} onChange={v=>upd('useGender',v)}/>
          <Toggle label="Show Flag" checked={!!settings.useFlag} onChange={v=>upd('useFlag',v)}/>
          <Toggle label="Gender Color Border" checked={!!settings.useGenderBorder} onChange={v=>upd('useGenderBorder',v)}/>
        </>}

        {tab==='modules' && <>
          {[
            ['giftEnabled','🎁 Gifts'],['callEnabled','📞 Calls'],['videoCallEnabled','📹 Video Calls'],
            ['audioCallEnabled','🎤 Audio Calls'],['groupCallEnabled','👥 Group Calls'],
            ['webcamEnabled','📷 Webcam'],['radioEnabled','📻 Radio'],['botEnabled','🤖 Bot'],
            ['giphyEnabled','🎞 Giphy'],['youtubeEnabled','▶️ YouTube'],['wallEnabled','📋 Wall'],
            ['likeEnabled','❤️ Likes'],['badgeEnabled','🏅 Badges'],['levelEnabled','⭐ Levels'],
            ['walletEnabled','💰 Wallet'],['quizEnabled','❓ Quiz'],['lobbyEnabled','🏠 Lobby'],
          ].map(([k,l])=>(
            <Toggle key={k} label={l} checked={!!settings[k]} onChange={v=>upd(k,v)}/>
          ))}
        </>}

        {tab==='wallet' && <>
          <Toggle label="Gold Enabled" checked={!!settings.goldEnabled} onChange={v=>upd('goldEnabled',v)}/>
          <Input label="Gold Per Message" value={String(settings.goldPerMessage||1)} onChange={v=>upd('goldPerMessage',+v)} type="number"/>
          <Input label="Gold Login Bonus" value={String(settings.goldLoginBonus||50)} onChange={v=>upd('goldLoginBonus',+v)} type="number"/>
          <Input label="Gold Login Streak Bonus" value={String(settings.goldLoginStreak||10)} onChange={v=>upd('goldLoginStreak',+v)} type="number"/>
          <Input label="Gold Delay (minutes)" value={String(settings.goldDelay||1)} onChange={v=>upd('goldDelay',+v)} type="number"/>
          <Toggle label="Ruby Enabled" checked={!!settings.rubyEnabled} onChange={v=>upd('rubyEnabled',v)}/>
          <Input label="Ruby Delay (minutes)" value={String(settings.rubyDelay||60)} onChange={v=>upd('rubyDelay',+v)} type="number"/>
          <Toggle label="Wallet Share Enabled" checked={!!settings.walletShareEnabled} onChange={v=>upd('walletShareEnabled',v)}/>
          <Select label="Min Rank for Wallet" value={settings.minRankWallet||'user'} onChange={v=>upd('minRankWallet',v)} options={RANK_OPTS}/>
        </>}

        {tab==='games' && <>
          <div style={{ fontWeight:800, color:'#f1f5f9', marginBottom:12 }}>🎲 Dice</div>
          <Toggle label="Dice Enabled" checked={!!settings.diceEnabled} onChange={v=>upd('diceEnabled',v)}/>
          <Input label="Min Bet" value={String(settings.diceBet||100)} onChange={v=>upd('diceBet',+v)} type="number"/>
          <Input label="Win Multiplier" value={String(settings.diceMultiplier||5.7)} onChange={v=>upd('diceMultiplier',+v)} type="number"/>
          <Input label="Win Number (1-6)" value={String(settings.diceWinNumber||6)} onChange={v=>upd('diceWinNumber',+v)} type="number"/>
          <div style={{ fontWeight:800, color:'#f1f5f9', margin:'16px 0 12px' }}>🎰 Keno</div>
          <Toggle label="Keno Enabled" checked={!!settings.kenoEnabled} onChange={v=>upd('kenoEnabled',v)}/>
          <Input label="Min Bet" value={String(settings.kenoMinBet||2)} onChange={v=>upd('kenoMinBet',+v)} type="number"/>
          <Input label="Max Bet" value={String(settings.kenoMaxBet||1000)} onChange={v=>upd('kenoMaxBet',+v)} type="number"/>
          <div style={{ fontWeight:800, color:'#f1f5f9', margin:'16px 0 12px' }}>🎡 Spin Wheel</div>
          <Toggle label="Spin Enabled" checked={!!settings.spinEnabled} onChange={v=>upd('spinEnabled',v)}/>
          <Input label="Cooldown (hours)" value={String(settings.spinCooldownHours||24)} onChange={v=>upd('spinCooldownHours',+v)} type="number"/>
        </>}

        {tab==='perms' && <>
          <div style={{ fontSize:12, color:'#6b7280', marginBottom:12 }}>Set minimum rank required for each feature</div>
          {[
            ['allow_main','Send Main Chat'],['allow_private','Send Private Messages'],
            ['allow_avatar','Change Avatar'],['allow_name','Change Display Name'],
            ['allow_cover','Change Cover'],['allow_mood','Set Mood'],
            ['allow_theme','Change Theme'],['allow_cupload','Upload Chat Images'],
            ['allow_video','Upload Video (premium)'],['allow_audio','Send Voice Messages'],
            ['allow_name_color','Name Color'],['allow_name_grad','Name Gradient'],
            ['allow_colors','Bubble Color'],['allow_grad','Bubble Gradient'],
            ['allow_neon','Neon Effects'],['allow_font','Custom Font'],
            ['allow_room','Create Rooms'],['allow_dice','Play Dice'],
            ['allow_keno','Play Keno'],['allow_spin','Spin Wheel'],
            ['allow_vcall','Video Call'],['allow_acall','Audio Call'],
            ['allow_gcall','Group Call'],['allow_webcam','Use Webcam'],
            ['allow_send_gift','Send Gifts'],['allow_report','Report Users'],
            ['allow_history','View Chat History'],['allow_whisper','Whisper'],
          ].map(([k,l])=>(
            <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #1a1d2e' }}>
              <span style={{ fontSize:13, color:'#e2e8f0' }}>{l}</span>
              <select value={settings[k]||'guest'} onChange={e=>upd(k,e.target.value)}
                style={{ background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:6, padding:'4px 8px', color:getRankColor(settings[k]||'guest'), fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                {RANK_OPTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </>}

        {tab==='staff' && <>
          <div style={{ fontSize:12, color:'#6b7280', marginBottom:12 }}>Minimum staff rank required for each moderation action</div>
          {[
            ['can_mute','Mute Users'],['can_warn','Warn Users'],['can_kick','Kick Users'],
            ['can_ghost','Ghost Users'],['can_ban','Ban Users'],['can_delete','Delete Messages'],
            ['can_rank','Change Ranks'],['can_auth','Verify Accounts'],['can_mip','Manage IP Bans'],
            ['can_mroom','Manage Rooms'],['can_modname','Edit Usernames'],['can_modemail','Edit Emails'],
            ['can_modpass','Change Passwords'],
          ].map(([k,l])=>(
            <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #1a1d2e' }}>
              <span style={{ fontSize:13, color:'#e2e8f0' }}>{l}</span>
              <select value={settings[k]||'moderator'} onChange={e=>upd(k,e.target.value)}
                style={{ background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:6, padding:'4px 8px', color:getRankColor(settings[k]||'moderator'), fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                {RANK_OPTS.filter(o=>['moderator','admin','superadmin','owner'].includes(o.value)).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </>}

        {tab==='email' && <>
          <Input label="SMTP Host" value={settings.smtpHost||''} onChange={v=>upd('smtpHost',v)} placeholder="smtp.gmail.com"/>
          <Input label="SMTP Port" value={String(settings.smtpPort||587)} onChange={v=>upd('smtpPort',+v)} type="number"/>
          <Input label="SMTP User" value={settings.smtpUser||''} onChange={v=>upd('smtpUser',v)} placeholder="you@gmail.com"/>
          <Input label="SMTP Password" value={settings.smtpPass||''} onChange={v=>upd('smtpPass',v)} type="password"/>
          <Input label="From Name" value={settings.emailFromName||''} onChange={v=>upd('emailFromName',v)}/>
          <Input label="From Address" value={settings.emailFromAddress||''} onChange={v=>upd('emailFromAddress',v)}/>
        </>}

        {tab==='groq' && <>
          <Toggle label="AI Bot Enabled" checked={!!settings.groqEnabled} onChange={v=>upd('groqEnabled',v)}/>
          <Input label="Trigger Word" value={settings.groqTrigger||'@GenZBot'} onChange={v=>upd('groqTrigger',v)} hint="Users type this to trigger the bot"/>
          <Input label="Bot Model" value={settings.groqModel||'llama3-8b-8192'} onChange={v=>upd('groqModel',v)}/>
          <Input label="Max Tokens" value={String(settings.groqMaxTokens||150)} onChange={v=>upd('groqMaxTokens',+v)} type="number"/>
          <Input label="Cooldown (seconds)" value={String(settings.groqCooldownSec||5)} onChange={v=>upd('groqCooldownSec',+v)} type="number"/>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>System Prompt</div>
            <textarea value={settings.groqSystemPrompt||''} onChange={e=>upd('groqSystemPrompt',e.target.value)} rows={4}
              style={{ width:'100%', background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:8, padding:'9px 13px', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', resize:'vertical' }}/>
          </div>
        </>}
      </div>
    </div>
  )
}

function StaffSection({ currentUser }) {
  const { showToast } = useToast()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/staff').then(d=>setStaff(d.staff)).catch(e=>showToast(e.message,'error')).finally(()=>setLoading(false))
  }, [])

  return (
    <div>
      <SectionHeader icon="👮" title="Staff List" count={staff.length}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
        {loading ? <div style={{ color:'#6b7280' }}>Loading…</div>
        : staff.map(s=>(
          <div key={s._id} style={{ background:'#131624', border:`1px solid ${getRankColor(s.rank)}33`, borderRadius:12, padding:16, textAlign:'center' }}>
            <Avatar src={s.avatar} size={52} gender={s.gender}/>
            <div style={{ marginTop:10, fontWeight:800, fontSize:14, color: getRankColor(s.rank) }}>{s.username}</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginTop:5 }}>
              <RIcon rank={s.rank} size={14}/>
              <span style={{ fontSize:12, color:'#6b7280' }}>{getRankLabel(s.rank)}</span>
            </div>
            <div style={{ fontSize:11, color: s.isOnline?'#22c55e':'#6b7280', marginTop:6 }}>
              {s.isOnline ? '● Online' : `Last seen ${s.lastSeen ? new Date(s.lastSeen).toLocaleDateString() : 'never'}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LogsSection({ currentUser }) {
  const { showToast } = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const load = () => {
    setLoading(true)
    apiFetch(`/logs?page=${page}&limit=50`).then(d=>setLogs(d.logs)).catch(e=>showToast(e.message,'error')).finally(()=>setLoading(false))
  }
  useEffect(()=>load(),[page])

  return (
    <div>
      <SectionHeader icon="📋" title="Chat Logs" right={
        <div style={{ display:'flex', gap:6 }}>
          <Btn variant='ghost' disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</Btn>
          <span style={{ color:'#6b7280', padding:'6px 10px', fontSize:12 }}>Page {page}</span>
          <Btn variant='ghost' onClick={()=>setPage(p=>p+1)}>Next →</Btn>
        </div>
      }/>
      <div style={{ background:'#0d1020', border:'1px solid #1e2436', borderRadius:12, overflow:'auto' }}>
        {loading ? <div style={{ color:'#6b7280', padding:40, textAlign:'center' }}>Loading…</div>
        : logs.length===0 ? <div style={{ color:'#6b7280', padding:40, textAlign:'center' }}>No logs</div>
        : logs.map(m=>(
          <div key={m._id} style={{ display:'flex', gap:10, padding:'9px 14px', borderBottom:'1px solid #131624', alignItems:'flex-start' }}>
            <div style={{ fontSize:11, color:'#4b5563', whiteSpace:'nowrap', paddingTop:2, minWidth:120 }}>
              {m.createdAt?new Date(m.createdAt).toLocaleString():''}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:120 }}>
              <RIcon rank={m.sender?.rank}/>
              <span style={{ fontSize:12, fontWeight:700, color: getRankColor(m.sender?.rank||'guest') }}>{m.sender?.username||'Anon'}</span>
            </div>
            <div style={{ fontSize:13, color:'#d1d5db', flex:1, wordBreak:'break-word' }}>{m.text||'[media]'}</div>
          </div>
        ))}
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

  const canSee = (section) => {
    const adminOnly = ['settings','ip-bans','broadcast','games','gift-txns']
    const ownerOnly = []
    if (ownerOnly.includes(section) && !isOwner(user.rank)) return false
    if (adminOnly.includes(section) && !isAdmin(user.rank)) return false
    return true
  }

  const NAV = [
    { id:'dashboard',  icon:'📊', label:'Dashboard',    always:true },
    { id:'users',      icon:'👥', label:'Users',         always:true },
    { id:'staff',      icon:'👮', label:'Staff',         always:true },
    { id:'rooms',      icon:'🏠', label:'Rooms',         always:true },
    { id:'reports',    icon:'🚨', label:'Reports',       always:true },
    { id:'gifts',      icon:'🎁', label:'Gifts',         admin:true  },
    { id:'badges',     icon:'🏅', label:'Badges',        admin:true  },
    { id:'filters',    icon:'🚫', label:'Word Filters',  always:true },
    { id:'ip-bans',    icon:'🛡️', label:'IP Bans',       admin:true  },
    { id:'news',       icon:'📰', label:'News',          always:true },
    { id:'broadcast',  icon:'📢', label:'Broadcast',     admin:true  },
    { id:'logs',       icon:'📋', label:'Chat Logs',     admin:true  },
    { id:'settings',   icon:'⚙️', label:'Settings',      admin:true  },
  ].filter(n => {
    if (n.always) return true
    if (n.admin && isAdmin(user.rank)) return true
    return false
  })

  const SECTION_MAP = {
    dashboard: <DashboardSection user={user}/>,
    users:     <UsersSection currentUser={user}/>,
    staff:     <StaffSection currentUser={user}/>,
    rooms:     <RoomsSection currentUser={user}/>,
    reports:   <ReportsSection currentUser={user}/>,
    gifts:     <GiftsSection currentUser={user}/>,
    badges:    <BadgesSection currentUser={user}/>,
    filters:   <FiltersSection currentUser={user}/>,
    'ip-bans': <IpBanSection currentUser={user}/>,
    news:      <NewsSection currentUser={user}/>,
    broadcast: <BroadcastSection currentUser={user}/>,
    logs:      <LogsSection currentUser={user}/>,
    settings:  <SettingsSection currentUser={user}/>,
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0a0c16', fontFamily:"'Nunito', sans-serif", color:'#f1f5f9' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 220 : 64, transition:'width .2s',
        background:'#0d1020', borderRight:'1px solid #1e2436',
        display:'flex', flexDirection:'column', flexShrink:0, zIndex:100,
        position:'sticky', top:0, height:'100vh', overflowY:'auto', overflowX:'hidden'
      }}>
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
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setActiveSection(n.id)}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:10,
                padding: sidebarOpen ? '9px 12px' : '9px 0',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                background: activeSection===n.id ? '#1e2a45' : 'transparent',
                border: activeSection===n.id ? '1px solid #2a3d6e' : '1px solid transparent',
                borderRadius:9, color: activeSection===n.id ? '#60a5fa' : '#6b7280',
                fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .15s',
                fontFamily:'inherit', marginBottom:2
              }}>
              <span style={{ fontSize:15, flexShrink:0 }}>{n.icon}</span>
              {sidebarOpen && <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.label}</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding:'12px 8px', borderTop:'1px solid #1e2436' }}>
          <button onClick={()=>navigate('/')}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding: sidebarOpen?'8px 12px':'8px 0',
              justifyContent: sidebarOpen?'flex-start':'center',
              background:'transparent', border:'1px solid transparent', borderRadius:9, color:'#6b7280',
              fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            <Avatar src={user.avatar} size={28} gender={user.gender}/>
            {sidebarOpen && <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: getRankColor(user.rank) }}>{user.username}</span>}
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
      `}</style>
    </div>
  )
}
