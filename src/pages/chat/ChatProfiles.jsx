// ============================================================
// ChatProfiles.jsx — MiniCard + ProfileModal + SelfProfile + StaffActionModal
// MINICARD:
//   - Appears below/near username, NOT center of screen
//   - Theme-synced (uses tObj from chatroom)
//   - Self: avatar + bg, View Profile + Edit buttons
//   - Others: View Profile, Add Friend, View Cam (if live), Whisper, Actions (red, staff-only)
// ACTIONS MODAL (staff):
//   - Room Level tab: Room Mute, Room Kick, Room Ban (permanent)
//   - Mains tab (admin+): Change Rank, Change Room Rank, Edit Profile, Mute, Kick, Ban, IP Ban
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { API, R, RL, GBR, RANKS, resolveNameColor } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'

// ─── Styles helpers ──────────────────────────────────────────
const S = {
  dark:   { bg: '#1e293b', bg2: '#0f172a', border: '#334155', text: '#f1f5f9', muted: '#64748b', faint: '#94a3b8' },
  inp:    { width:'100%', padding:'9px 12px', background:'#0f172a', border:'1.5px solid #334155',
            borderRadius:9, color:'#f1f5f9', fontSize:'0.82rem', outline:'none', boxSizing:'border-box',
            fontFamily:'Nunito,sans-serif', lineHeight:1.5 },
  label:  { fontSize:'0.7rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.5, marginBottom:5, display:'block' },
  cancel: { flex:1, padding:'10px', borderRadius:9, border:'1.5px solid #334155', background:'transparent',
            color:'#64748b', fontWeight:700, cursor:'pointer', fontSize:'0.82rem' },
  action: (ok) => ({ flex:2, padding:'10px', borderRadius:9, border:'none',
            background: ok ? 'linear-gradient(135deg,#ef4444,#dc2626)' : '#334155',
            color: ok ? '#fff' : '#64748b', fontWeight:800, cursor: ok ? 'pointer' : 'not-allowed',
            fontSize:'0.85rem', fontFamily:'Outfit,sans-serif' }),
}

const MUTE_TIMES = [
  {label:'1 min',val:1},{label:'5 min',val:5},{label:'10 min',val:10},
  {label:'30 min',val:30},{label:'1 hour',val:60},{label:'3 hours',val:180},
  {label:'6 hours',val:360},{label:'12 hours',val:720},{label:'24 hours',val:1440},
]
const KICK_TIMES = [
  {label:'30 min',val:30},{label:'1 hour',val:60},{label:'3 hours',val:180},
  {label:'6 hours',val:360},{label:'12 hours',val:720},{label:'24 hours',val:1440},
  {label:'3 days',val:4320},{label:'7 days',val:10080},
]

const ALL_RANKS = Object.entries(RANKS).map(([k,v])=>({key:k,...v}))
const ROOM_RANKS = ALL_RANKS.filter(r=>r.level<=11)

// ─────────────────────────────────────────────────────────────
// REPORT MODAL
// ─────────────────────────────────────────────────────────────
function ReportModal({ targetUser, onClose }) {
  const REASONS = ['Harassment / Bullying','Spam / Advertising','Inappropriate content',
    'Hate speech / Discrimination','Impersonation','Scam / Fraud','Underage user','Other']
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoad]  = useState(false)

  async function submit() {
    if (!reason) return
    setLoad(true)
    try {
      const token = localStorage.getItem('cgz_token')
      await fetch(`${API}/api/reports`, {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify({ reportedUserId: targetUser._id||targetUser.userId, reason, detail }),
      })
      setSent(true)
    } catch {}
    setLoad(false)
  }

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:2200,background:'rgba(0,0,0,.65)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,maxWidth:360,width:'100%',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
        <div style={{background:'linear-gradient(135deg,#ef4444,#dc2626)',padding:'14px 16px',display:'flex',alignItems:'center',gap:10}}>
          <i className="fa-sharp fa-solid fa-flag" style={{fontSize:18,color:'#fff'}}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.95rem',color:'#fff'}}>Report User</div>
            <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,.8)'}}>{targetUser.username}</div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.2)',border:'none',borderRadius:'50%',width:28,height:28,cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>✕</button>
        </div>
        {sent ? (
          <div style={{padding:28,textAlign:'center'}}>
            <div style={{fontSize:36,marginBottom:10}}>✅</div>
            <div style={{fontWeight:800,color:'#15803d',fontSize:'1rem',fontFamily:'Outfit,sans-serif'}}>Report Submitted</div>
            <button onClick={onClose} style={{marginTop:18,padding:'9px 24px',borderRadius:9,border:'none',background:'#ef4444',color:'#fff',fontWeight:700,cursor:'pointer'}}>Close</button>
          </div>
        ) : (
          <div style={{padding:'14px 16px 18px'}}>
            <div style={{fontSize:'0.72rem',fontWeight:700,color:'#6b7280',marginBottom:8,textTransform:'uppercase',letterSpacing:.5}}>Reason</div>
            <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:12}}>
              {REASONS.map(r=>(
                <label key={r} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 11px',border:`1.5px solid ${reason===r?'#ef4444':'#e4e6ea'}`,borderRadius:9,cursor:'pointer',background:reason===r?'#fef2f2':'#f9fafb'}}>
                  <input type="radio" name="rr" value={r} checked={reason===r} onChange={()=>setReason(r)} style={{accentColor:'#ef4444'}}/>
                  <span style={{fontSize:'0.82rem',fontWeight:600,color:reason===r?'#dc2626':'#374151'}}>{r}</span>
                </label>
              ))}
            </div>
            <textarea value={detail} onChange={e=>setDetail(e.target.value)} rows={2} maxLength={300} placeholder="Details (optional)"
              style={{width:'100%',padding:'8px 11px',border:'1.5px solid #e4e6ea',borderRadius:9,fontSize:'0.82rem',outline:'none',resize:'none',boxSizing:'border-box',fontFamily:'Nunito,sans-serif',color:'#374151',marginBottom:10}}/>
            <button onClick={submit} disabled={!reason||loading}
              style={{width:'100%',padding:'10px',borderRadius:9,border:'none',background:reason?'#ef4444':'#f3f4f6',color:reason?'#fff':'#9ca3af',fontWeight:800,cursor:reason?'pointer':'not-allowed',fontSize:'0.85rem'}}>
              {loading?'Submitting...':'Submit Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SHARE WALLET MODAL
// ─────────────────────────────────────────────────────────────
function ShareWalletModal({ targetUser, myGold, myRuby, onClose, socket }) {
  const [tab, setTab]     = useState('coins')
  const [amount, setAmount] = useState('')
  const [sent, setSent]   = useState(false)
  const [loading, setLoad] = useState(false)
  const tok = localStorage.getItem('cgz_token')

  const COIN_VALUES  = [100,200,300,500,750,1000]
  const RUBY_VALUES  = [1,2,3,5,10,20]

  async function send() {
    const val = parseInt(amount)
    if (!val || val <= 0) return
    if (tab==='coins' && val > myGold) return
    if (tab==='ruby'  && val > myRuby) return
    setLoad(true)
    try {
      await fetch(`${API}/api/users/${targetUser._id||targetUser.userId}/transfer`, {
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},
        body:JSON.stringify({ type: tab, amount: val })
      })
      setSent(true)
    } catch {}
    setLoad(false)
  }

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:2500,background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#1e293b',borderRadius:16,maxWidth:320,width:'100%',overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,.5)',border:'1px solid #334155'}}>
        <div style={{padding:'13px 14px',borderBottom:'1px solid #334155',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <i className="fa-solid fa-wallet" style={{color:'#fbbf24',fontSize:16}}/>
            <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,color:'#f1f5f9',fontSize:'0.9rem'}}>Share Wallet</span>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#64748b',fontSize:14}}>✕</button>
        </div>
        {sent ? (
          <div style={{padding:24,textAlign:'center',color:'#22c55e',fontWeight:700,fontSize:'0.95rem'}}>✅ Sent successfully!</div>
        ) : (
          <div style={{padding:'12px 14px'}}>
            {/* Tabs */}
            <div style={{display:'flex',gap:6,marginBottom:14}}>
              {[{id:'coins',label:'🪙 Coins',bal:myGold},{id:'ruby',label:'💎 Ruby',bal:myRuby}].map(t=>(
                <button key={t.id} onClick={()=>{setTab(t.id);setAmount('')}}
                  style={{flex:1,padding:'7px',borderRadius:8,border:`1.5px solid ${tab===t.id?'#fbbf24':'#334155'}`,background:tab===t.id?'rgba(251,191,36,.1)':'transparent',color:tab===t.id?'#fbbf24':'#64748b',fontWeight:700,cursor:'pointer',fontSize:'0.8rem'}}>
                  {t.label}
                  <div style={{fontSize:'0.6rem',marginTop:2,fontWeight:600}}>Balance: {t.bal||0}</div>
                </button>
              ))}
            </div>
            {/* Amount dropdown */}
            <span style={S.label}>Amount</span>
            <select value={amount} onChange={e=>setAmount(e.target.value)}
              style={{...S.inp,marginBottom:12}}>
              <option value="">Select amount</option>
              {(tab==='coins'?COIN_VALUES:RUBY_VALUES).map(v=>(
                <option key={v} value={v}>{v} {tab==='coins'?'Coins':'Ruby'}</option>
              ))}
            </select>
            {amount && (
              <div style={{background:'rgba(251,191,36,.08)',border:'1px solid rgba(251,191,36,.2)',borderRadius:8,padding:'7px 10px',fontSize:'0.78rem',color:'#fbbf24',marginBottom:12,textAlign:'center',fontWeight:700}}>
                Sending {amount} {tab==='coins'?'coins':'ruby'} to {targetUser.username}
              </div>
            )}
            <div style={{display:'flex',gap:7}}>
              <button onClick={onClose} style={S.cancel}>Cancel</button>
              <button onClick={send} disabled={!amount||loading} style={S.action(!!amount&&!loading)}>
                {loading?'Sending...':'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STAFF ACTION MODAL — Room Level + Mains tabs
// ─────────────────────────────────────────────────────────────
function StaffActionModal({ targetUser, myLevel, myRank, socket, roomId, onClose, onKicked }) {
  const isAdmin      = myLevel >= 12
  const isSuperAdmin = myLevel >= 13
  const isOwner      = myLevel >= 14

  const [tab, setTab]         = useState('room')
  const [done, setDone]       = useState('')
  const [loading, setLoad]    = useState(false)

  // Shared
  const [reason, setReason] = useState('')
  const tid = targetUser._id || targetUser.userId
  const token = localStorage.getItem('cgz_token')
  const ri = R(targetUser.rank)

  // Room tab state
  const [roomAction, setRoomAction]   = useState('mute')  // mute|kick|ban
  const [roomMuteMin, setRoomMuteMin] = useState(5)
  const [roomReason, setRoomReason]   = useState('')

  // Mains tab state
  const [mainsSection, setMainsSection] = useState('mute')
  const [muteMinutes, setMuteMin]     = useState(5)
  const [kickMinutes, setKickMin]     = useState(60)
  const [newRank, setNewRank]         = useState(targetUser.rank||'user')
  const [newRoomRank, setNewRoomRank] = useState(targetUser.roomRank||'user')
  const [epField, setEpField]         = useState('username')
  const [epValue, setEpValue]         = useState('')
  const [epAvatar, setEpAvatar]       = useState(null)

  function apiPost(path, body) {
    return fetch(`${API}${path}`, {
      method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
      body: JSON.stringify(body)
    })
  }
  function apiPatch(path, body) {
    return fetch(`${API}${path}`, {
      method:'PATCH', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
      body: JSON.stringify(body)
    })
  }

  // ── Room tab ──────────────────────────────────────────────
  function doRoomAction() {
    if (!roomReason.trim()) return
    setLoad(true)
    if (roomAction==='mute') {
      socket?.emit('muteUser',{targetUserId:tid,roomId,minutes:roomMuteMin,reason:roomReason})
      setDone(`Room muted for ${roomMuteMin} min.`)
    } else if (roomAction==='kick') {
      socket?.emit('kickUser',{targetUserId:tid,roomId,reason:roomReason})
      setDone('Kicked from this room.')
    } else if (roomAction==='ban') {
      socket?.emit('roomBanUser',{targetUserId:tid,roomId,reason:roomReason})
      apiPost(`/api/admin/users/${tid}/roomban`,{roomId,reason:roomReason}).catch(()=>{})
      setDone('Permanently banned from this room.')
    }
    setLoad(false)
    setTimeout(onClose, 1800)
  }

  // ── Mains: Mute ──────────────────────────────────────────
  function doMute() {
    if (!reason.trim()) return
    setLoad(true)
    socket?.emit('globalMuteUser',{targetUserId:tid,minutes:muteMinutes,reason,mutePrivate:true,mutePublic:true})
    apiPost(`/api/admin/users/${tid}/mute`,{minutes:muteMinutes,reason,mutePrivate:true,mutePublic:true}).catch(()=>{})
    setDone(`Muted globally for ${muteMinutes} min.`)
    setLoad(false)
    setTimeout(onClose, 1800)
  }

  // ── Mains: Kick ──────────────────────────────────────────
  function doKick() {
    if (!reason.trim()) return
    setLoad(true)
    socket?.emit('kickUser',{targetUserId:tid,roomId,reason,kickDurationMinutes:kickMinutes})
    apiPost(`/api/admin/users/${tid}/kick`,{roomId,reason,minutes:kickMinutes}).catch(()=>{})
    onKicked?.()
    setDone(`Kicked for ${kickMinutes} min.`)
    setLoad(false)
    setTimeout(onClose, 1800)
  }

  // ── Mains: Ban ───────────────────────────────────────────
  function doBan() {
    if (!reason.trim()) return
    setLoad(true)
    socket?.emit('banUser',{targetUserId:tid,reason})
    apiPost(`/api/admin/users/${tid}/ban`,{reason}).catch(()=>{})
    setDone('User banned.')
    setLoad(false)
    setTimeout(onClose, 1800)
  }

  // ── Mains: IP Ban ─────────────────────────────────────────
  function doIpBan() {
    if (!reason.trim()) return
    setLoad(true)
    apiPost(`/api/admin/users/${tid}/ipban`,{reason}).catch(()=>{})
    setDone('IP banned.')
    setLoad(false)
    setTimeout(onClose, 1800)
  }

  // ── Mains: Change Rank ────────────────────────────────────
  function doChangeRank() {
    setLoad(true)
    apiPatch(`/api/admin/users/${tid}/rank`,{rank:newRank}).catch(()=>{})
    socket?.emit('updateUserRank',{targetUserId:tid,rank:newRank})
    setDone(`Rank changed to ${newRank}.`)
    setLoad(false)
    setTimeout(onClose, 1800)
  }

  // ── Mains: Change Room Rank ───────────────────────────────
  function doChangeRoomRank() {
    setLoad(true)
    apiPatch(`/api/admin/users/${tid}/roomrank`,{roomId,rank:newRoomRank}).catch(()=>{})
    setDone(`Room rank changed to ${newRoomRank}.`)
    setLoad(false)
    setTimeout(onClose, 1800)
  }

  // ── Mains: Edit Profile ───────────────────────────────────
  async function doEditProfile() {
    setLoad(true)
    if (epAvatar) {
      const fd = new FormData(); fd.append('avatar', epAvatar)
      await fetch(`${API}/api/admin/users/${tid}/avatar`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd}).catch(()=>{})
    } else if (epValue.trim()) {
      await apiPatch(`/api/admin/users/${tid}`,{[epField]:epValue.trim()}).catch(()=>{})
    }
    setDone('Profile updated.')
    setLoad(false)
    setTimeout(onClose, 1800)
  }

  const D = S.dark

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:2200,background:'rgba(0,0,0,.75)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:D.bg,borderRadius:16,maxWidth:440,width:'100%',maxHeight:'88vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(0,0,0,.6)',border:`1px solid ${D.border}`,overflow:'hidden'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderBottom:`1px solid ${D.border}`,flexShrink:0}}>
          <img src={targetUser.avatar||'/default_images/avatar/default_guest.png'} alt=""
            style={{width:40,height:40,borderRadius:'50%',objectFit:'cover',border:`2px solid ${GBR(targetUser.gender,targetUser.rank)}`,flexShrink:0}}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.95rem',color:D.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{targetUser.username}</div>
            <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}>
              <RIcon rank={targetUser.rank} size={12}/>
              <span style={{fontSize:'0.65rem',color:ri.color,fontWeight:700}}>{ri.label}</span>
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:D.muted,fontSize:14,flexShrink:0}}>
            <i className="fa-solid fa-xmark"/>
          </button>
        </div>

        {/* Done flash */}
        {done && <div style={{background:'rgba(34,197,94,.1)',borderBottom:`1px solid rgba(34,197,94,.2)`,padding:'8px 14px',fontSize:'0.8rem',color:'#22c55e',fontWeight:700,flexShrink:0}}>✅ {done}</div>}

        {/* Tab bar */}
        <div style={{display:'flex',borderBottom:`1px solid ${D.border}`,flexShrink:0}}>
          <button onClick={()=>setTab('room')}
            style={{flex:1,padding:'10px',border:'none',background:'none',cursor:'pointer',color:tab==='room'?'#60a5fa':D.muted,borderBottom:`2px solid ${tab==='room'?'#60a5fa':'transparent'}`,fontWeight:700,fontSize:'0.82rem'}}>
            <i className="fa-solid fa-house-chimney-user" style={{marginRight:5}}/>Room Level
          </button>
          {isAdmin && (
            <button onClick={()=>setTab('mains')}
              style={{flex:1,padding:'10px',border:'none',background:'none',cursor:'pointer',color:tab==='mains'?'#f59e0b':D.muted,borderBottom:`2px solid ${tab==='mains'?'#f59e0b':'transparent'}`,fontWeight:700,fontSize:'0.82rem'}}>
              <i className="fa-solid fa-gauge" style={{marginRight:5}}/>Mains
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>

          {/* ── ROOM LEVEL TAB ── */}
          {tab==='room' && (
            <div>
              {/* Action selector */}
              <div style={{display:'flex',gap:6,marginBottom:14}}>
                {[
                  {id:'mute', icon:'fa-solid fa-microphone-slash', label:'Mute', color:'#f59e0b'},
                  {id:'kick', icon:'fa-solid fa-user-slash',        label:'Kick', color:'#ef4444'},
                  {id:'ban',  icon:'fa-solid fa-ban',               label:'Ban',  color:'#dc2626'},
                ].map(a=>(
                  <button key={a.id} onClick={()=>setRoomAction(a.id)}
                    style={{flex:1,padding:'8px 6px',borderRadius:9,border:`1.5px solid ${roomAction===a.id?a.color:D.border}`,background:roomAction===a.id?`rgba(${a.id==='mute'?'245,158,11':'239,68,68'},.12)`:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5,color:roomAction===a.id?a.color:D.muted,fontWeight:700,fontSize:'0.78rem'}}>
                    <i className={a.icon} style={{fontSize:12}}/>{a.label}
                  </button>
                ))}
              </div>

              {/* Time selector for mute */}
              {roomAction==='mute' && (
                <div style={{marginBottom:12}}>
                  <span style={S.label}>Duration</span>
                  <select value={roomMuteMin} onChange={e=>setRoomMuteMin(+e.target.value)} style={S.inp}>
                    {MUTE_TIMES.map(t=><option key={t.val} value={t.val}>{t.label}</option>)}
                  </select>
                </div>
              )}

              {/* Reason */}
              <div style={{marginBottom:12}}>
                <span style={S.label}>Reason {roomAction==='ban'?'(permanent ban)':''}</span>
                <input value={roomReason} onChange={e=>setRoomReason(e.target.value)}
                  placeholder={`Reason for ${roomAction}...`} style={{...S.inp}}/>
              </div>

              <div style={{display:'flex',gap:8}}>
                <button onClick={onClose} style={S.cancel}>Cancel</button>
                <button onClick={doRoomAction} disabled={!roomReason.trim()||loading}
                  style={S.action(!!roomReason.trim()&&!loading)}>
                  {loading?'Processing...':'Take Action'}
                </button>
              </div>
            </div>
          )}

          {/* ── MAINS TAB ── */}
          {tab==='mains' && isAdmin && (
            <div>
              {/* Section tabs */}
              <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:14}}>
                {[
                  {id:'rank',      icon:'fa-solid fa-star',          label:'Rank'},
                  {id:'roomrank',  icon:'fa-solid fa-house-chimney-user', label:'Room Rank'},
                  {id:'editprofile',icon:'fa-regular fa-pen-to-square',label:'Edit Profile'},
                  {id:'mute',      icon:'fa-solid fa-microphone-slash',label:'Mute'},
                  {id:'kick',      icon:'fa-solid fa-user-slash',     label:'Kick'},
                  {id:'ban',       icon:'fa-solid fa-ban',            label:'Ban'},
                  ...(isSuperAdmin?[{id:'ipban', icon:'fa-solid fa-network-wired', label:'IP Ban'}]:[]),
                ].map(s=>(
                  <button key={s.id} onClick={()=>setMainsSection(s.id)}
                    style={{padding:'5px 10px',borderRadius:7,border:`1.5px solid ${mainsSection===s.id?'#f59e0b':'#334155'}`,background:mainsSection===s.id?'rgba(245,158,11,.12)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',gap:4,color:mainsSection===s.id?'#f59e0b':'#64748b',fontWeight:700,fontSize:'0.72rem'}}>
                    <i className={s.icon} style={{fontSize:10}}/>{s.label}
                  </button>
                ))}
              </div>

              {/* Change Rank */}
              {mainsSection==='rank' && (
                <div>
                  <span style={S.label}>New Rank</span>
                  <select value={newRank} onChange={e=>setNewRank(e.target.value)} style={{...S.inp,marginBottom:14}}>
                    {ALL_RANKS.map(r=><option key={r.key} value={r.key}>{r.label} (Level {r.level})</option>)}
                  </select>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={onClose} style={S.cancel}>Cancel</button>
                    <button onClick={doChangeRank} disabled={loading} style={S.action(!loading)}>Save Rank</button>
                  </div>
                </div>
              )}

              {/* Change Room Rank */}
              {mainsSection==='roomrank' && (
                <div>
                  <span style={S.label}>Room Rank</span>
                  <select value={newRoomRank} onChange={e=>setNewRoomRank(e.target.value)} style={{...S.inp,marginBottom:14}}>
                    {ROOM_RANKS.map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={onClose} style={S.cancel}>Cancel</button>
                    <button onClick={doChangeRoomRank} disabled={loading} style={S.action(!loading)}>Save</button>
                  </div>
                </div>
              )}

              {/* Edit Profile */}
              {mainsSection==='editprofile' && (
                <div>
                  <span style={S.label}>Field to Edit</span>
                  <select value={epField} onChange={e=>{setEpField(e.target.value);setEpValue('');setEpAvatar(null)}} style={{...S.inp,marginBottom:10}}>
                    <option value="username">Username</option>
                    <option value="mood">Mood</option>
                    <option value="about">About</option>
                    <option value="avatar">Avatar (upload)</option>
                  </select>
                  {epField==='avatar' ? (
                    <div style={{marginBottom:14}}>
                      <input type="file" accept="image/*" onChange={e=>setEpAvatar(e.target.files[0]||null)}
                        style={{color:S.dark.text,fontSize:'0.8rem'}}/>
                    </div>
                  ) : (
                    <div style={{marginBottom:14}}>
                      <span style={S.label}>New Value</span>
                      <input value={epValue} onChange={e=>setEpValue(e.target.value)} placeholder={`New ${epField}...`} style={S.inp}/>
                    </div>
                  )}
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={onClose} style={S.cancel}>Cancel</button>
                    <button onClick={doEditProfile} disabled={(!epValue.trim()&&!epAvatar)||loading} style={S.action((!!(epValue.trim()||epAvatar))&&!loading)}>Update</button>
                  </div>
                </div>
              )}

              {/* Mute */}
              {mainsSection==='mute' && (
                <div>
                  <span style={S.label}>Duration (public + private)</span>
                  <select value={muteMinutes} onChange={e=>setMuteMin(+e.target.value)} style={{...S.inp,marginBottom:10}}>
                    {MUTE_TIMES.map(t=><option key={t.val} value={t.val}>{t.label}</option>)}
                  </select>
                  <span style={S.label}>Reason</span>
                  <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for mute..." style={{...S.inp,marginBottom:14}}/>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={onClose} style={S.cancel}>Cancel</button>
                    <button onClick={doMute} disabled={!reason.trim()||loading} style={S.action(!!reason.trim()&&!loading)}>Mute</button>
                  </div>
                </div>
              )}

              {/* Kick */}
              {mainsSection==='kick' && (
                <div>
                  <span style={S.label}>Duration</span>
                  <select value={kickMinutes} onChange={e=>setKickMin(+e.target.value)} style={{...S.inp,marginBottom:10}}>
                    {KICK_TIMES.map(t=><option key={t.val} value={t.val}>{t.label}</option>)}
                  </select>
                  <span style={S.label}>Reason</span>
                  <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for kick..." style={{...S.inp,marginBottom:14}}/>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={onClose} style={S.cancel}>Cancel</button>
                    <button onClick={doKick} disabled={!reason.trim()||loading} style={S.action(!!reason.trim()&&!loading)}>Kick</button>
                  </div>
                </div>
              )}

              {/* Ban */}
              {mainsSection==='ban' && (
                <div>
                  <div style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,padding:'8px 12px',marginBottom:12,fontSize:'0.78rem',color:'#f87171'}}>
                    ⚠️ This will permanently ban the user. Use with caution.
                  </div>
                  <span style={S.label}>Reason</span>
                  <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for ban..." style={{...S.inp,marginBottom:14}}/>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={onClose} style={S.cancel}>Cancel</button>
                    <button onClick={doBan} disabled={!reason.trim()||loading} style={S.action(!!reason.trim()&&!loading)}>Ban Permanently</button>
                  </div>
                </div>
              )}

              {/* IP Ban */}
              {mainsSection==='ipban' && isSuperAdmin && (
                <div>
                  <div style={{background:'rgba(127,29,29,.15)',border:'1px solid rgba(239,68,68,.3)',borderRadius:8,padding:'8px 12px',marginBottom:12,fontSize:'0.78rem',color:'#fca5a5'}}>
                    🔒 IP Ban will block all accounts from this IP address.
                  </div>
                  <span style={S.label}>Reason</span>
                  <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for IP ban..." style={{...S.inp,marginBottom:14}}/>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={onClose} style={S.cancel}>Cancel</button>
                    <button onClick={doIpBan} disabled={!reason.trim()||loading} style={S.action(!!reason.trim()&&!loading)}>IP Ban</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MINI CARD
// Appears near the username/avatar — NOT center screen
// Position: below the element that was clicked (pos.x, pos.y)
// ─────────────────────────────────────────────────────────────
function MiniCard({ user, myId, myLevel, pos, socket, roomId, ignoredUsers, onIgnore, onClose, onFull, onGift, tObj, liveCamUsers, onWhisper }) {
  const [showReport, setShowReport]       = useState(false)
  const [showStaff,  setShowStaff]        = useState(false)
  const [showWallet, setShowWallet]       = useState(false)
  const [showGiftM,  setShowGiftM]        = useState(false)
  const [myGold,     setMyGold]           = useState(0)
  const [myRuby,     setMyRuby]           = useState(0)
  const [ignored,    setIgnored]          = useState(()=>(ignoredUsers||new Set()).has(user._id||user.userId))

  const ri   = R(user.rank)
  const bdr  = GBR(user.gender, user.rank)
  const isMe = user._id===myId || user.userId===myId
  const canAct = myLevel>=11 && RL(user.rank)<myLevel && !isMe
  const uid  = user._id || user.userId
  const token = localStorage.getItem('cgz_token')

  // Check if this user has a live cam
  const isLive = liveCamUsers?.includes(uid) || user.isCamHost

  // Theme from chatroom
  const th = tObj || {}
  const BG     = th.bg_header || '#1e293b'
  const C      = th.text      || '#f1f5f9'
  const ACC    = th.accent    || '#1a73e8'
  const BD     = `${th.default_color||'#334155'}66`

  // Position: anchor below/near the clicked element
  const cardW = 200
  const cardH = isMe ? 160 : 200
  const W = window.innerWidth, H = window.innerHeight
  // Try to place below the click, but keep on screen
  const x = Math.min(Math.max((pos?.x || 80), 4), W - cardW - 4)
  const y = Math.min(Math.max((pos?.y || 80) + 4, 56), H - cardH - 10)

  useEffect(() => {
    if (!isMe && showWallet) {
      fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { setMyGold(d.user?.gold||0); setMyRuby(d.user?.ruby||0) }).catch(() => {})
    }
  }, [showWallet])

  function handleIgnore() {
    if (ignored) return
    setIgnored(true); onIgnore?.(uid); onClose()
  }

  function doAddFriend() {
    fetch(`${API}/api/users/friend/${uid}`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } }).catch(()=>{})
    onClose()
  }

  return (
    <>
      {/* Invisible backdrop to close on outside click */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:8000 }} />

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: y, left: x,
          width: cardW,
          zIndex: 8001,
          background: BG,
          border: `1px solid ${BD}`,
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
          overflow: 'hidden',
        }}
      >
        {/* Banner / avatar */}
        <div style={{ height: 44, position:'relative', background: `linear-gradient(135deg,${ri.color}44,${BG})` }}>
          <button onClick={onClose} style={{ position:'absolute',top:6,right:6,background:'rgba(0,0,0,.35)',border:'none',width:20,height:20,borderRadius:'50%',cursor:'pointer',color:'#fff',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',zIndex:1 }}>✕</button>
        </div>
        <div style={{ padding:'0 10px', marginTop:-22, position:'relative', zIndex:2, display:'flex', alignItems:'flex-end', gap:6, marginBottom:4 }}>
          <img
            src={user.avatar||'/default_images/avatar/default_guest.png'} alt=""
            style={{ width:42,height:42,borderRadius:'50%',border:`2px solid ${bdr}`,objectFit:'cover',background:'#fff',flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,.25)' }}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
          />
        </div>

        {/* Name + rank */}
        <div style={{ padding:'0 10px 6px' }}>
          <div style={{ fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.82rem',color:resolveNameColor(user.nameColor,ri.color)||C,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user.username}</div>
          <div style={{ display:'flex',alignItems:'center',gap:3,marginTop:1 }}>
            <RIcon rank={user.rank} size={10}/>
            <span style={{ fontSize:'0.6rem',color:ri.color,fontWeight:700 }}>{ri.label}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ padding:'0 8px 8px', display:'flex', flexDirection:'column', gap:4 }}>
          {isMe ? (
            <>
              <MCBtn icon="fa-solid fa-circle-user" label="View Profile" color={ACC} onClick={()=>{onFull?.();onClose()}} />
              <MCBtn icon="fa-regular fa-pen-to-square" label="Edit Profile" color="#64748b" onClick={()=>{onFull?.();onClose()}} />
            </>
          ) : (
            <>
              <MCBtn icon="fa-solid fa-circle-user" label="View Profile" color={ACC} onClick={()=>{onFull?.();onClose()}} />
              <MCBtn icon="fa-solid fa-user-plus" label="Add Friend" color="#22c55e" onClick={doAddFriend} />
              {isLive && <MCBtn icon="fa-solid fa-video" label="View Cam" color="#ef4444" onClick={onClose} badge="LIVE" />}
              <MCBtn icon="fa-solid fa-hand-lizard" label="Whisper" color="#7c3aed" onClick={()=>{onWhisper?.({...user,userId:user._id||user.userId});onClose()}} />
              {/* Actions — red, staff only */}
              {canAct && (
                <button
                  onClick={() => setShowStaff(true)}
                  style={{
                    display:'flex', alignItems:'center', gap:6, padding:'6px 8px',
                    background:'rgba(239,68,68,0.1)', border:'1.5px solid rgba(239,68,68,0.3)',
                    borderRadius:7, cursor:'pointer', fontSize:'0.72rem', fontWeight:800,
                    color:'#ef4444', width:'100%', textAlign:'left',
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.2)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.1)'}}
                >
                  <i className="fa-solid fa-user-shield" style={{ fontSize:11 }} />
                  Actions
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showReport && <ReportModal targetUser={user} onClose={()=>setShowReport(false)}/>}
      {showStaff  && <StaffActionModal targetUser={user} myLevel={myLevel} socket={socket} roomId={roomId} onClose={()=>setShowStaff(false)}/>}
      {showWallet && <ShareWalletModal targetUser={user} myGold={myGold} myRuby={myRuby} onClose={()=>setShowWallet(false)} socket={socket}/>}
      {showGiftM  && <GiftModal targetUser={user} onClose={()=>setShowGiftM(false)} onGift={onGift} onClose2={onClose}/>}
    </>
  )
}

// mini card button helper
function MCBtn({ icon, label, color, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:6, padding:'6px 8px',
        background:'rgba(255,255,255,0.05)', border:`1px solid rgba(255,255,255,0.08)`,
        borderRadius:7, cursor:'pointer', fontSize:'0.72rem', fontWeight:700,
        color: color||'#94a3b8', width:'100%', textAlign:'left', transition:'all .12s',
      }}
      onMouseEnter={e=>{e.currentTarget.style.background=`${color}20`;e.currentTarget.style.borderColor=`${color}44`}}
      onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}}
    >
      <i className={icon} style={{ fontSize:11, flexShrink:0 }} />
      <span style={{flex:1}}>{label}</span>
      {badge && <span style={{background:'#ef4444',color:'#fff',fontSize:'0.52rem',fontWeight:800,padding:'1px 5px',borderRadius:6}}>{badge}</span>}
    </button>
  )
}

// small gift forwarder
function GiftModal({ targetUser, onClose, onGift, onClose2 }) {
  useEffect(() => { onGift?.(targetUser); onClose2?.() }, [])
  return null
}

// ─────────────────────────────────────────────────────────────
// SELF PROFILE OVERLAY
// ─────────────────────────────────────────────────────────────
function SelfProfileOverlay({ user, onClose, onUpdated }) {
  const [mood,   setMood]   = useState(user?.mood||'')
  const [about,  setAbout]  = useState(user?.about||'')
  const [saving, setSaving] = useState(false)
  const [ok,     setOk]     = useState('')
  const ri  = R(user?.rank)
  const bdr = GBR(user?.gender, user?.rank)

  async function save(field, value) {
    setSaving(true); setOk('')
    const token = localStorage.getItem('cgz_token')
    try {
      const r = await fetch(`${API}/api/users/me`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({[field]:value})})
      const d = await r.json()
      if (r.ok) { setOk('Saved!'); onUpdated?.(d.user); setTimeout(()=>setOk(''),2000) }
    } catch {}
    setSaving(false)
  }
  async function uploadAvatar(file) {
    setSaving(true)
    const token = localStorage.getItem('cgz_token')
    const fd = new FormData(); fd.append('avatar',file)
    try {
      const r = await fetch(`${API}/api/upload/avatar`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd})
      const d = await r.json()
      if (r.ok&&d.url) { onUpdated?.({...user,avatar:d.url}); setOk('Avatar updated!'); setTimeout(()=>setOk(''),2500) }
    } catch {}
    setSaving(false)
  }

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1200,background:'rgba(0,0,0,.55)',backdropFilter:'blur(5px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:18,maxWidth:360,width:'100%',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.25)',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
        <div style={{height:80,background:`linear-gradient(135deg,${ri.color}66,#e8f0fe)`,position:'relative',flexShrink:0}}>
          <button onClick={onClose} style={{position:'absolute',top:10,right:10,background:'rgba(255,255,255,.85)',border:'none',width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>
            <i className="fa-solid fa-xmark"/>
          </button>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginTop:-40,padding:'0 18px',flexShrink:0}}>
          <label style={{cursor:'pointer',position:'relative'}}>
            <img src={user?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:80,height:80,borderRadius:'50%',border:`3px solid ${bdr}`,objectFit:'cover',background:'#fff'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
            <div style={{position:'absolute',bottom:2,right:2,width:22,height:22,borderRadius:'50%',background:'#1a73e8',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff'}}>
              <i className="fa-solid fa-camera" style={{fontSize:9,color:'#fff'}}/>
            </div>
            <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f)uploadAvatar(f);e.target.value=''}}/>
          </label>
          <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1rem',color:resolveNameColor(user?.nameColor,ri.color)||'#111827',marginTop:8}}>{user?.username}</div>
          <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:4}}><RIcon rank={user?.rank} size={12}/><span style={{fontSize:'0.72rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'10px 18px 18px'}}>
          {ok&&<div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'6px 12px',fontSize:'0.78rem',color:'#15803d',marginBottom:10,textAlign:'center'}}>{ok}</div>}
          <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:14}}>
            {[{l:'Level',v:user?.level||1,c:'#1a73e8'},{l:'Gold',v:user?.gold||0,c:'#d97706'},{l:'Messages',v:user?.totalMessages||0,c:'#7c3aed'}].map(s=>(
              <div key={s.l} style={{textAlign:'center',background:'#f9fafb',borderRadius:8,padding:'5px 10px',flex:1}}>
                <div style={{fontSize:'0.58rem',color:'#9ca3af'}}>{s.l}</div>
                <div style={{fontSize:'0.88rem',fontWeight:800,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>
          <label style={{display:'block',fontSize:'0.72rem',fontWeight:700,color:'#6b7280',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Mood</label>
          <div style={{display:'flex',gap:6,marginBottom:12}}>
            <input value={mood} onChange={e=>setMood(e.target.value)} maxLength={80} placeholder="What's on your mind?"
              style={{flex:1,padding:'8px 12px',border:'1.5px solid #e4e6ea',borderRadius:9,fontSize:'0.85rem',outline:'none',fontFamily:'Nunito,sans-serif',color:'#111827'}}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
            <button onClick={()=>save('mood',mood)} disabled={saving} style={{padding:'8px 12px',borderRadius:9,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.78rem',flexShrink:0}}>Save</button>
          </div>
          <label style={{display:'block',fontSize:'0.72rem',fontWeight:700,color:'#6b7280',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>About Me</label>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <textarea value={about} onChange={e=>setAbout(e.target.value)} maxLength={300} rows={3} placeholder="Tell others about yourself..."
              style={{padding:'8px 12px',border:'1.5px solid #e4e6ea',borderRadius:9,fontSize:'0.85rem',outline:'none',fontFamily:'Nunito,sans-serif',resize:'vertical',color:'#111827',lineHeight:1.5}}
              onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
            <button onClick={()=>save('about',about)} disabled={saving} style={{padding:'8px',borderRadius:9,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.82rem'}}>Save About</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PROFILE MODAL (full view of another user)
// ─────────────────────────────────────────────────────────────
function ProfileModal({ user, myLevel, myId, socket, roomId, onClose, onGift, ignoredUsers, onIgnore, onWhisper }) {
  if (!user) return null
  const ri  = R(user.rank)
  const bdr = GBR(user.gender, user.rank)
  const isMe   = user._id===myId || user.userId===myId
  const canAct = myLevel>=11 && RL(user.rank)<myLevel && !isMe
  const token  = localStorage.getItem('cgz_token')
  const [showReport, setShowReport] = useState(false)
  const [showStaff,  setShowStaff]  = useState(false)
  const [showWallet, setShowWallet] = useState(false)
  const [myGold,     setMyGold]     = useState(0)
  const [myRuby,     setMyRuby]     = useState(0)
  const [ignored,    setIgnored]    = useState(()=>(ignoredUsers||new Set()).has(user._id||user.userId))
  const uid = user._id || user.userId

  useEffect(() => {
    if (showWallet) {
      fetch(`${API}/api/auth/me`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>{setMyGold(d.user?.gold||0);setMyRuby(d.user?.ruby||0)}).catch(()=>{})
    }
  }, [showWallet])

  function handleIgnore() {
    if (ignored) return
    setIgnored(true); onIgnore?.(uid); onClose()
  }

  // Username color: only from nameColor setting, NOT rank color
  const usernameColor = resolveNameColor(user.nameColor, '')

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.45)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
        <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:18,maxWidth:340,width:'100%',overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,.18)',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
          <div style={{height:88,background:`linear-gradient(135deg,${ri.color}44,#e8f0fe)`,position:'relative',flexShrink:0}}>
            <button onClick={onClose} style={{position:'absolute',top:10,right:10,background:'rgba(255,255,255,.8)',border:'none',width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>
              <i className="fa-solid fa-xmark"/>
            </button>
            {user.countryCode&&user.countryCode!=='ZZ'&&<img src={`/icons/flags/${user.countryCode.toUpperCase()}.png`} alt="" style={{position:'absolute',bottom:10,right:12,width:22,height:14,borderRadius:2}} onError={e=>e.target.style.display='none'}/>}
          </div>
          <div style={{display:'flex',justifyContent:'center',marginTop:-36,flexShrink:0}}>
            <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:72,height:72,borderRadius:'50%',border:`3px solid ${bdr}`,objectFit:'cover',background:'#fff'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'10px 18px 18px',textAlign:'center'}}>
            {/* Username: default text color unless user has set nameColor */}
            <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1.05rem',color:usernameColor||'#111827'}}>{user.username}</div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,margin:'4px 0 12px'}}><RIcon rank={user.rank} size={14}/><span style={{fontSize:'0.75rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
            {user.mood&&<p style={{fontSize:'0.8rem',color:'#6b7280',marginBottom:8,fontStyle:'italic'}}>"{user.mood}"</p>}
            {user.about&&<p style={{fontSize:'0.8rem',color:'#6b7280',marginBottom:12,lineHeight:1.5,textAlign:'left'}}>{user.about}</p>}
            <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:14}}>
              {[{l:'Level',v:user.level||1,c:'#1a73e8'},{l:'Gold',v:user.gold||0,c:'#d97706'},{l:'Msgs',v:user.totalMessages||0,c:'#7c3aed'}].map(s=>(
                <div key={s.l} style={{textAlign:'center',background:'#f9fafb',borderRadius:8,padding:'5px 12px'}}>
                  <div style={{fontSize:'0.62rem',color:'#9ca3af'}}>{s.l}</div>
                  <div style={{fontSize:'0.9rem',fontWeight:800,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
            {!isMe && (
              <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center'}}>
                {[
                  {icon:'fa-solid fa-hand-lizard',   label:'Whisper',  color:'#7c3aed', fn:()=>{onWhisper?.({...user,userId:user._id||user.userId});onClose()}},
                  {icon:'fa-solid fa-gift',          label:'Gift',    color:'#ec4899', fn:()=>{onGift?.(user);onClose()}},
                  {icon:'fa-solid fa-user-plus',     label:'Friend',  color:'#22c55e', fn:()=>{fetch(`${API}/api/users/friend/${uid}`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{});onClose()}},
                  {icon:'fa-solid fa-wallet',        label:'Wallet',  color:'#fbbf24', fn:()=>setShowWallet(true)},
                  {icon:'fa-solid fa-user-slash',    label:ignored?'✓ Ignored':'Ignore', color:'#6b7280', fn:handleIgnore, dim:ignored},
                  {icon:'fa-sharp fa-solid fa-flag', label:'Report',  color:'#ef4444', fn:()=>setShowReport(true)},
                  ...(canAct ? [{icon:'fa-solid fa-user-shield',label:'Actions',color:'#f59e0b',fn:()=>setShowStaff(true)}] : []),
                ].map((b,i)=>(
                  <button key={i} onClick={b.fn}
                    style={{display:'flex',alignItems:'center',gap:5,padding:'7px 10px',background:'#f9fafb',border:`1.5px solid #e4e6ea`,borderRadius:8,cursor:b.dim?'not-allowed':'pointer',fontSize:'0.78rem',fontWeight:600,color:b.color||'#374151',transition:'all .12s',opacity:b.dim?.5:1}}
                    onMouseEnter={e=>{if(!b.dim){e.currentTarget.style.background=`${b.color}15`;e.currentTarget.style.borderColor=b.color}}}
                    onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e4e6ea'}}>
                    <i className={b.icon} style={{fontSize:12}}/>{b.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {showReport && <ReportModal targetUser={user} onClose={()=>setShowReport(false)}/>}
      {showStaff  && <StaffActionModal targetUser={user} myLevel={myLevel} socket={socket} roomId={roomId} onClose={()=>setShowStaff(false)}/>}
      {showWallet && <ShareWalletModal targetUser={user} myGold={myGold} myRuby={myRuby} onClose={()=>setShowWallet(false)} socket={socket}/>}
    </>
  )
}

export { MiniCard, SelfProfileOverlay, ProfileModal, ReportModal, StaffActionModal }
