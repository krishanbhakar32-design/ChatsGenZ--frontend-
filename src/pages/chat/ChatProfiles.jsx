// ============================================================
// ChatProfiles.jsx
// MiniCard + ProfileModal + StaffActionModal (complete rewrite)
// Global tab (Mains):
//   - Change Rank (all ranks dropdown, save/cancel)
//   - Change Room Rank (room-level staff ranks only)
//   - Edit Profile (avatar, username, mood, about, bg)
//   - Mute (reason + time, applies both public + private chat)
//   - Kick (reason + time, redirects kicked user to /kicked page until time expires)
//   - Ban (reason only — permanent, permission-based)
//   - IP Ban (reason only — permission-based, superadmin+)
// Room tab: Room Mute + Room Kick
// ============================================================
import { useState, useEffect } from 'react'
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

// All ranks for Change Rank dropdown
const ALL_RANKS = Object.entries(RANKS).map(([k,v])=>({key:k,...v}))
// Room-staff ranks only (mod level, not global admin)
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
            <div style={{fontSize:'0.8rem',color:'#6b7280',marginTop:6}}>Our moderation team will review it.</div>
            <button onClick={onClose} style={{marginTop:18,padding:'9px 24px',borderRadius:9,border:'none',background:'#ef4444',color:'#fff',fontWeight:700,cursor:'pointer'}}>Close</button>
          </div>
        ) : (
          <div style={{padding:'14px 16px 18px'}}>
            <div style={{fontSize:'0.72rem',fontWeight:700,color:'#6b7280',marginBottom:8,textTransform:'uppercase',letterSpacing:.5}}>Reason</div>
            <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:12}}>
              {REASONS.map(r=>(
                <label key={r} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 11px',border:`1.5px solid ${reason===r?'#ef4444':'#e4e6ea'}`,borderRadius:9,cursor:'pointer',background:reason===r?'#fef2f2':'#f9fafb',transition:'all .12s'}}>
                  <input type="radio" name="rr" value={r} checked={reason===r} onChange={()=>setReason(r)} style={{accentColor:'#ef4444',flexShrink:0}}/>
                  <span style={{fontSize:'0.82rem',fontWeight:600,color:reason===r?'#dc2626':'#374151'}}>{r}</span>
                </label>
              ))}
            </div>
            <div style={{fontSize:'0.72rem',fontWeight:700,color:'#6b7280',marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Details (optional)</div>
            <textarea value={detail} onChange={e=>setDetail(e.target.value)} rows={2} maxLength={300} placeholder="Describe what happened..."
              style={{width:'100%',padding:'8px 11px',border:'1.5px solid #e4e6ea',borderRadius:9,fontSize:'0.82rem',outline:'none',resize:'none',boxSizing:'border-box',fontFamily:'Nunito,sans-serif',color:'#374151'}}
              onFocus={e=>e.target.style.borderColor='#ef4444'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
            <button onClick={submit} disabled={!reason||loading}
              style={{width:'100%',marginTop:12,padding:'10px',borderRadius:9,border:'none',background:reason?'#ef4444':'#f3f4f6',color:reason?'#fff':'#9ca3af',fontWeight:800,cursor:reason?'pointer':'not-allowed',fontSize:'0.85rem',fontFamily:'Outfit,sans-serif'}}>
              {loading?'Submitting...':'Submit Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STAFF ACTION MODAL — complete redesign
// Tabs: Room Level | Mains (global, admin+)
// ─────────────────────────────────────────────────────────────
function StaffActionModal({ targetUser, myLevel, myRank, socket, roomId, onClose, onKicked }) {
  const isAdmin      = myLevel >= 12   // admin/superadmin/owner → can see Mains tab
  const isSuperAdmin = myLevel >= 13   // superadmin/owner → IP Ban
  const isOwner      = myLevel >= 14   // owner only

  const [tab, setTab]       = useState('room')  // 'room' | 'mains'
  const [section, setSection] = useState('mute') // for mains tab: mute|kick|ban|ipban|rank|roomrank|editprofile
  const [done, setDone]     = useState('')
  const [loading, setLoad]  = useState(false)

  // Shared
  const [reason, setReason] = useState('')
  const tid = targetUser._id || targetUser.userId
  const token = localStorage.getItem('cgz_token')
  const ri = R(targetUser.rank)

  // Mute state
  const [muteMinutes, setMuteMin] = useState(5)
  // Kick state
  const [kickMinutes, setKickMin] = useState(60)
  // Rank change
  const [newRank, setNewRank]     = useState(targetUser.rank||'user')
  const [newRoomRank, setNewRoomRank] = useState(targetUser.roomRank||'user')
  // Edit profile state
  const [epField, setEpField]     = useState('username')
  const [epValue, setEpValue]     = useState('')
  const [epAvatar, setEpAvatar]   = useState(null)
  // Room tab action
  const [roomAction, setRoomAction] = useState('mute')
  const [roomMuteMin, setRoomMuteMin] = useState(5)
  const [roomReason, setRoomReason] = useState('')

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

  // ── Room tab actions ──
  function doRoomAction() {
    if (!roomReason.trim()) return
    setLoad(true)
    if (roomAction==='mute') {
      socket?.emit('muteUser',{targetUserId:tid,roomId,minutes:roomMuteMin,reason:roomReason})
      setDone(`Muted in this room for ${roomMuteMin} min.`)
    } else {
      socket?.emit('kickUser',{targetUserId:tid,roomId,reason:roomReason})
      setDone('Kicked from this room.')
    }
    setLoad(false)
    setTimeout(onClose,1800)
  }

  // ── Mains tab — Mute (public + private) ──
  function doMute() {
    if (!reason.trim()) return
    setLoad(true)
    socket?.emit('globalMuteUser',{targetUserId:tid,minutes:muteMinutes,reason,mutePrivate:true,mutePublic:true})
    apiPost(`/api/admin/users/${tid}/mute`,{minutes:muteMinutes,reason,mutePrivate:true,mutePublic:true}).catch(()=>{})
    setDone(`Muted globally for ${muteMinutes} min (public + private).`)
    setLoad(false)
    setTimeout(onClose,1800)
  }

  // ── Mains tab — Kick (timed, redirect to /kicked) ──
  function doKick() {
    if (!reason.trim()) return
    setLoad(true)
    socket?.emit('kickUser',{targetUserId:tid,roomId,reason,kickDurationMinutes:kickMinutes})
    apiPost(`/api/admin/users/${tid}/kick`,{roomId,reason,minutes:kickMinutes}).catch(()=>{})
    setDone(`Kicked for ${kickMinutes} min. They will be redirected.`)
    setLoad(false)
    onKicked?.(tid, kickMinutes, reason)
    setTimeout(onClose,1500)
  }

  // ── Mains tab — Ban (permanent, reason only) ──
  function doBan() {
    if (!reason.trim()) return
    setLoad(true)
    socket?.emit('banUser',{targetUserId:tid,roomId,reason})
    apiPost(`/api/admin/users/${tid}/ban`,{reason}).catch(()=>{})
    setDone('User permanently banned.')
    setLoad(false)
    setTimeout(onClose,1800)
  }

  // ── Mains tab — IP Ban ──
  function doIpBan() {
    if (!reason.trim()) return
    setLoad(true)
    apiPost(`/api/admin/users/${tid}/ipban`,{reason}).catch(()=>{})
    setDone('IP banned successfully.')
    setLoad(false)
    setTimeout(onClose,1800)
  }

  // ── Change Rank ──
  function doChangeRank() {
    setLoad(true)
    apiPatch(`/api/admin/users/${tid}/rank`,{rank:newRank}).catch(()=>{})
    socket?.emit('changeUserRank',{targetUserId:tid,rank:newRank})
    setDone(`Rank changed to ${RANKS[newRank]?.label||newRank}.`)
    setLoad(false)
    setTimeout(onClose,1500)
  }

  // ── Change Room Rank ──
  function doChangeRoomRank() {
    setLoad(true)
    apiPatch(`/api/admin/rooms/${roomId}/users/${tid}/rank`,{rank:newRoomRank}).catch(()=>{})
    socket?.emit('changeRoomRank',{targetUserId:tid,roomId,rank:newRoomRank})
    setDone(`Room rank set to ${RANKS[newRoomRank]?.label||newRoomRank}.`)
    setLoad(false)
    setTimeout(onClose,1500)
  }

  // ── Edit Profile ──
  async function doEditProfile() {
    setLoad(true)
    try {
      if (epField==='avatar'&&epAvatar) {
        const fd=new FormData(); fd.append('avatar',epAvatar)
        await fetch(`${API}/api/admin/users/${tid}/avatar`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd})
      } else {
        await apiPatch(`/api/admin/users/${tid}/profile`,{[epField]:epValue})
      }
      setDone('Profile updated.')
    } catch { setDone('Failed to update.') }
    setLoad(false)
    setTimeout(onClose,1500)
  }

  const MAINS_SECTIONS = [
    { id:'rank',       label:'Change Rank',       icon:'fa-solid fa-address-card',         color:'#6366f1', show:isAdmin },
    { id:'roomrank',   label:'Room Rank',          icon:'fa-solid fa-house-chimney-user',   color:'#0ea5e9', show:isAdmin },
    { id:'editprofile',label:'Edit Profile',       icon:'fa-solid fa-user-pen',        color:'#10b981', show:isAdmin },
    { id:'mute',       label:'Mute',               icon:'fa-solid fa-microphone-slash',     color:'#f59e0b', show:true },
    { id:'kick',       label:'Kick',               icon:'fa-solid fa-user-slash',     color:'#ef4444', show:true },
    { id:'ban',        label:'Ban',                icon:'fa-solid fa-ban',             color:'#dc2626', show:isAdmin },
    { id:'ipban',      label:'IP Ban',             icon:'fa-solid fa-network-wired',         color:'#7f1d1d', show:isSuperAdmin },
  ].filter(s=>s.show)

  const EP_FIELDS = [
    {id:'username',label:'Username'},{id:'mood',label:'Mood'},{id:'about',label:'About'},
    {id:'avatar',label:'Avatar (upload)'},{id:'profileBackground',label:'Background URL'},
  ]

  const D = S.dark

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:2100,background:'rgba(0,0,0,.7)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:12}}>
      <div onClick={e=>e.stopPropagation()} style={{background:D.bg,border:`1px solid ${D.border}`,borderRadius:18,maxWidth:420,width:'100%',maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 28px 80px rgba(0,0,0,.6)',color:D.text}}>

        {/* Header */}
        <div style={{background:D.bg2,padding:'13px 15px',borderBottom:`1px solid ${D.border}`,display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <img src={targetUser.avatar||'/default_images/avatar/default_guest.png'} alt=""
            style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',border:`2px solid ${ri.color}`,flexShrink:0}}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.93rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{targetUser.username}</div>
            <div style={{display:'flex',alignItems:'center',gap:4,marginTop:1}}><RIcon rank={targetUser.rank} size={10}/><span style={{fontSize:'0.62rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
          </div>
          <div style={{background:'#f59e0b18',border:'1px solid #f59e0b44',borderRadius:7,padding:'3px 8px',fontSize:'0.65rem',fontWeight:800,color:'#f59e0b',flexShrink:0}}>STAFF</div>
          <button onClick={onClose} style={{background:D.border,border:'none',borderRadius:'50%',width:26,height:26,cursor:'pointer',color:D.faint,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>✕</button>
        </div>

        {/* Tab bar */}
        {isAdmin && (
          <div style={{display:'flex',borderBottom:`1px solid ${D.border}`,flexShrink:0}}>
            {[{id:'room',label:'🏠 Room Level'},{id:'mains',label:'🌐 Mains'}].map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id);setDone('')}}
                style={{flex:1,padding:'10px 8px',border:'none',background:'none',cursor:'pointer',
                  borderBottom:`2.5px solid ${tab===t.id?'#f59e0b':'transparent'}`,
                  color:tab===t.id?'#f59e0b':D.muted,fontSize:'0.78rem',fontWeight:700,transition:'all .15s'}}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Done state */}
        {done ? (
          <div style={{padding:28,textAlign:'center',flex:1}}>
            <div style={{fontSize:'1rem',fontWeight:800,color:'#4ade80',fontFamily:'Outfit,sans-serif'}}>✅ {done}</div>
          </div>
        ) : (
          <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:0}}>

            {/* ══ ROOM TAB ══ */}
            {tab==='room' && (
              <div style={{padding:16,display:'flex',flexDirection:'column',gap:12}}>
                {/* Action selector */}
                <div style={{display:'flex',gap:8}}>
                  {[{id:'mute',label:'🔇 Room Mute',color:'#f59e0b'},{id:'kick',label:'🥾 Room Kick',color:'#ef4444'}].map(a=>(
                    <button key={a.id} onClick={()=>setRoomAction(a.id)}
                      style={{flex:1,padding:'10px 8px',border:`2px solid ${roomAction===a.id?a.color:D.border}`,borderRadius:10,background:roomAction===a.id?`${a.color}18`:'transparent',cursor:'pointer',textAlign:'center',transition:'all .15s'}}>
                      <div style={{fontSize:'0.85rem',fontWeight:800,color:roomAction===a.id?a.color:D.faint}}>{a.label}</div>
                    </button>
                  ))}
                </div>

                {/* Duration for room mute */}
                {roomAction==='mute' && (
                  <>
                    <label style={S.label}>Duration</label>
                    <select value={roomMuteMin} onChange={e=>setRoomMuteMin(Number(e.target.value))} style={{...S.inp,cursor:'pointer'}}>
                      {MUTE_TIMES.map(t=><option key={t.val} value={t.val}>{t.label}</option>)}
                    </select>
                  </>
                )}

                <label style={S.label}>Reason (required)</label>
                <textarea value={roomReason} onChange={e=>setRoomReason(e.target.value)} rows={2} maxLength={200}
                  placeholder={roomAction==='mute'?'e.g. Spamming...':'e.g. Breaking rules...'}
                  style={{...S.inp,resize:'none'}}
                  onFocus={e=>e.target.style.borderColor='#f59e0b'} onBlur={e=>e.target.style.borderColor=D.border}/>

                <div style={{display:'flex',gap:8,marginTop:4}}>
                  <button onClick={onClose} style={S.cancel}>Cancel</button>
                  <button onClick={doRoomAction} disabled={loading||!roomReason.trim()}
                    style={{...S.action(!!roomReason.trim()),background:roomReason.trim()?(roomAction==='mute'?'linear-gradient(135deg,#f59e0b,#d97706)':'linear-gradient(135deg,#ef4444,#dc2626)'):'#334155'}}>
                    {loading?'Processing...':'Take Action'}
                  </button>
                </div>
                <div style={{background:D.bg2,borderRadius:8,padding:'7px 11px',fontSize:'0.67rem',color:D.muted,display:'flex',gap:6,alignItems:'flex-start'}}>
                  <i className="fa-solid fa-circle-info" style={{fontSize:10,color:'#60a5fa',flexShrink:0,marginTop:1}}/>
                  Room actions affect <strong style={{color:D.faint}}>only this room</strong>. Mute hides public messages here; kick removes from this room temporarily.
                </div>
              </div>
            )}

            {/* ══ MAINS TAB ══ */}
            {tab==='mains' && (
              <div style={{display:'flex',height:'100%'}}>

                {/* Left sidebar — section picker */}
                <div style={{width:110,borderRight:`1px solid ${D.border}`,display:'flex',flexDirection:'column',flexShrink:0,padding:'8px 0'}}>
                  {MAINS_SECTIONS.map(s=>(
                    <button key={s.id} onClick={()=>{setSection(s.id);setDone('');setReason('')}}
                      style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'10px 6px',border:'none',
                        background:section===s.id?`${s.color}18`:'transparent',cursor:'pointer',
                        borderLeft:`3px solid ${section===s.id?s.color:'transparent'}`,transition:'all .12s'}}>
                      <i className={`${s.icon}`} style={{fontSize:15,color:section===s.id?s.color:D.muted}}/>
                      <span style={{fontSize:'0.6rem',fontWeight:700,color:section===s.id?s.color:D.muted,textAlign:'center',lineHeight:1.2}}>{s.label}</span>
                    </button>
                  ))}
                </div>

                {/* Right content panel */}
                <div style={{flex:1,padding:'14px 14px',overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>

                  {/* ── Change Rank ── */}
                  {section==='rank' && (
                    <>
                      <div style={{fontWeight:800,fontSize:'0.88rem',color:'#6366f1',marginBottom:4}}>Change Global Rank</div>
                      <label style={S.label}>Select Rank</label>
                      <select value={newRank} onChange={e=>setNewRank(e.target.value)} style={{...S.inp,cursor:'pointer'}}>
                        {ALL_RANKS.filter(r=>r.level<myLevel).map(r=>(
                          <option key={r.key} value={r.key}>{r.label}</option>
                        ))}
                      </select>
                      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 11px',background:`${RANKS[newRank]?.color||'#888'}18`,border:`1px solid ${RANKS[newRank]?.color||'#888'}44`,borderRadius:9,marginTop:2}}>
                        <RIcon rank={newRank} size={16}/>
                        <span style={{fontWeight:700,fontSize:'0.85rem',color:RANKS[newRank]?.color||'#888'}}>{RANKS[newRank]?.label||'Unknown'}</span>
                      </div>
                      <div style={{display:'flex',gap:8,marginTop:6}}>
                        <button onClick={()=>setNewRank(targetUser.rank||'user')} style={S.cancel}>Cancel</button>
                        <button onClick={doChangeRank} disabled={loading||newRank===targetUser.rank}
                          style={{...S.action(newRank!==targetUser.rank),background:newRank!==targetUser.rank?'linear-gradient(135deg,#6366f1,#4f46e5)':'#334155'}}>
                          {loading?'Saving...':'Save Rank'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── Change Room Rank ── */}
                  {section==='roomrank' && (
                    <>
                      <div style={{fontWeight:800,fontSize:'0.88rem',color:'#0ea5e9',marginBottom:4}}>Change Room Rank</div>
                      <div style={{fontSize:'0.7rem',color:D.muted,marginBottom:4}}>Sets this user's rank within this room only (up to Moderator).</div>
                      <label style={S.label}>Select Room Rank</label>
                      <select value={newRoomRank} onChange={e=>setNewRoomRank(e.target.value)} style={{...S.inp,cursor:'pointer'}}>
                        {ROOM_RANKS.map(r=>(
                          <option key={r.key} value={r.key}>{r.label}</option>
                        ))}
                      </select>
                      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 11px',background:`${RANKS[newRoomRank]?.color||'#888'}18`,border:`1px solid ${RANKS[newRoomRank]?.color||'#888'}44`,borderRadius:9}}>
                        <RIcon rank={newRoomRank} size={16}/>
                        <span style={{fontWeight:700,fontSize:'0.85rem',color:RANKS[newRoomRank]?.color||'#888'}}>{RANKS[newRoomRank]?.label||'Unknown'}</span>
                      </div>
                      <div style={{display:'flex',gap:8,marginTop:6}}>
                        <button onClick={()=>setNewRoomRank(targetUser.roomRank||'user')} style={S.cancel}>Cancel</button>
                        <button onClick={doChangeRoomRank} disabled={loading}
                          style={{...S.action(true),background:'linear-gradient(135deg,#0ea5e9,#0284c7)'}}>
                          {loading?'Saving...':'Save Room Rank'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── Edit Profile ── */}
                  {section==='editprofile' && (
                    <>
                      <div style={{fontWeight:800,fontSize:'0.88rem',color:'#10b981',marginBottom:4}}>Edit Profile</div>
                      <label style={S.label}>Field to Edit</label>
                      <select value={epField} onChange={e=>{setEpField(e.target.value);setEpValue('');setEpAvatar(null)}} style={{...S.inp,cursor:'pointer',marginBottom:8}}>
                        {EP_FIELDS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
                      </select>
                      {epField==='avatar' ? (
                        <>
                          <label style={S.label}>Upload Avatar</label>
                          <input type="file" accept="image/*" onChange={e=>setEpAvatar(e.target.files[0]||null)}
                            style={{...S.inp,padding:'7px 12px'}}/>
                          {epAvatar && <div style={{fontSize:'0.7rem',color:'#10b981'}}>Selected: {epAvatar.name}</div>}
                        </>
                      ) : (
                        <>
                          <label style={S.label}>{EP_FIELDS.find(f=>f.id===epField)?.label}</label>
                          <input value={epValue} onChange={e=>setEpValue(e.target.value)} maxLength={100}
                            placeholder={`Enter new ${epField}...`}
                            style={{...S.inp}}
                            onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor=D.border}/>
                        </>
                      )}
                      <div style={{display:'flex',gap:8,marginTop:6}}>
                        <button onClick={()=>{setEpValue('');setEpAvatar(null)}} style={S.cancel}>Clear</button>
                        <button onClick={doEditProfile} disabled={loading||(epField!=='avatar'&&!epValue.trim())||(epField==='avatar'&&!epAvatar)}
                          style={{...S.action((epField==='avatar'?!!epAvatar:!!epValue.trim())),background:(epField==='avatar'?!!epAvatar:!!epValue.trim())?'linear-gradient(135deg,#10b981,#059669)':'#334155'}}>
                          {loading?'Saving...':'Save Changes'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── Global Mute ── */}
                  {section==='mute' && (
                    <>
                      <div style={{fontWeight:800,fontSize:'0.88rem',color:'#f59e0b',marginBottom:4}}>Global Mute</div>
                      <div style={{fontSize:'0.7rem',color:D.muted,marginBottom:8,background:'#f59e0b12',border:'1px solid #f59e0b33',borderRadius:8,padding:'6px 10px'}}>
                        Applies to <strong style={{color:'#f59e0b'}}>both public chat and private messages</strong> globally.
                      </div>
                      <label style={S.label}>Duration</label>
                      <select value={muteMinutes} onChange={e=>setMuteMin(Number(e.target.value))} style={{...S.inp,cursor:'pointer',marginBottom:8}}>
                        {MUTE_TIMES.map(t=><option key={t.val} value={t.val}>{t.label}</option>)}
                      </select>
                      <label style={S.label}>Reason (required)</label>
                      <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} maxLength={200}
                        placeholder="e.g. Harassment in DMs..."
                        style={{...S.inp,resize:'none'}}
                        onFocus={e=>e.target.style.borderColor='#f59e0b'} onBlur={e=>e.target.style.borderColor=D.border}/>
                      <div style={{display:'flex',gap:8,marginTop:6}}>
                        <button onClick={onClose} style={S.cancel}>Cancel</button>
                        <button onClick={doMute} disabled={loading||!reason.trim()}
                          style={{...S.action(!!reason.trim()),background:reason.trim()?'linear-gradient(135deg,#f59e0b,#d97706)':'#334155'}}>
                          {loading?'Processing...':'Mute User'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── Kick ── */}
                  {section==='kick' && (
                    <>
                      <div style={{fontWeight:800,fontSize:'0.88rem',color:'#ef4444',marginBottom:4}}>Kick User</div>
                      <div style={{fontSize:'0.7rem',color:D.muted,marginBottom:8,background:'#ef444412',border:'1px solid #ef444433',borderRadius:8,padding:'6px 10px'}}>
                        User is <strong style={{color:'#ef4444'}}>redirected to kicked page</strong> and cannot return until the time expires.
                      </div>
                      <label style={S.label}>Kick Duration</label>
                      <select value={kickMinutes} onChange={e=>setKickMin(Number(e.target.value))} style={{...S.inp,cursor:'pointer',marginBottom:8}}>
                        {KICK_TIMES.map(t=><option key={t.val} value={t.val}>{t.label}</option>)}
                      </select>
                      <label style={S.label}>Reason (required)</label>
                      <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} maxLength={200}
                        placeholder="e.g. Repeated rule violations..."
                        style={{...S.inp,resize:'none'}}
                        onFocus={e=>e.target.style.borderColor='#ef4444'} onBlur={e=>e.target.style.borderColor=D.border}/>
                      <div style={{display:'flex',gap:8,marginTop:6}}>
                        <button onClick={onClose} style={S.cancel}>Cancel</button>
                        <button onClick={doKick} disabled={loading||!reason.trim()}
                          style={S.action(!!reason.trim())}>
                          {loading?'Processing...':'Kick User'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── Ban ── */}
                  {section==='ban' && (
                    <>
                      <div style={{fontWeight:800,fontSize:'0.88rem',color:'#dc2626',marginBottom:4}}>Permanent Ban</div>
                      <div style={{fontSize:'0.7rem',color:D.muted,marginBottom:8,background:'#dc262612',border:'1px solid #dc262633',borderRadius:8,padding:'6px 10px'}}>
                        Permanently bans this user from all rooms. This action is <strong style={{color:'#dc2626'}}>irreversible</strong> without owner intervention.
                      </div>
                      <label style={S.label}>Reason (required)</label>
                      <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} maxLength={300}
                        placeholder="Provide a detailed reason for the ban..."
                        style={{...S.inp,resize:'none'}}
                        onFocus={e=>e.target.style.borderColor='#dc2626'} onBlur={e=>e.target.style.borderColor=D.border}/>
                      <div style={{display:'flex',gap:8,marginTop:6}}>
                        <button onClick={onClose} style={S.cancel}>Cancel</button>
                        <button onClick={doBan} disabled={loading||!reason.trim()}
                          style={{...S.action(!!reason.trim()),background:reason.trim()?'linear-gradient(135deg,#dc2626,#991b1b)':'#334155'}}>
                          {loading?'Processing...':'Ban User'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── IP Ban ── */}
                  {section==='ipban' && (
                    <>
                      <div style={{fontWeight:800,fontSize:'0.88rem',color:'#7f1d1d',marginBottom:4}}>IP Ban</div>
                      <div style={{fontSize:'0.7rem',color:D.muted,marginBottom:8,background:'#7f1d1d18',border:'1px solid #7f1d1d44',borderRadius:8,padding:'6px 10px'}}>
                        Blocks this user's IP address. <strong style={{color:'#fca5a5'}}>Use with caution</strong> — affects all accounts from the same IP.
                      </div>
                      <label style={S.label}>Reason (required)</label>
                      <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} maxLength={300}
                        placeholder="Reason for IP ban (logged permanently)..."
                        style={{...S.inp,resize:'none'}}
                        onFocus={e=>e.target.style.borderColor='#dc2626'} onBlur={e=>e.target.style.borderColor=D.border}/>
                      <div style={{display:'flex',gap:8,marginTop:6}}>
                        <button onClick={onClose} style={S.cancel}>Cancel</button>
                        <button onClick={doIpBan} disabled={loading||!reason.trim()}
                          style={{...S.action(!!reason.trim()),background:reason.trim()?'linear-gradient(135deg,#7f1d1d,#450a0a)':'#334155'}}>
                          {loading?'Processing...':'IP Ban'}
                        </button>
                      </div>
                    </>
                  )}

                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MINI CARD
// ─────────────────────────────────────────────────────────────
function MiniCard({ user, myLevel, myId, pos, onClose, onFull, onGift, socket, roomId, ignoredUsers, onIgnore }) {
  if (!user) return null
  const ri = R(user.rank), bdr = GBR(user.gender, user.rank)
  const isMe = (user._id === myId || user.userId === myId)
  const canAct = myLevel >= 11 && RL(user.rank) < myLevel && !isMe
  const token = localStorage.getItem('cgz_token')
  const [showReport, setShowReport] = useState(false)
  const [showStaff, setShowStaff]   = useState(false)
  const [ignored, setIgnored]       = useState(() => (ignoredUsers||new Set()).has(user._id||user.userId))
  const cardW = 228
  const x = Math.min(Math.max((pos?.x||80), 4), window.innerWidth - cardW - 4)
  const y = Math.min(Math.max((pos?.y||80), 4), window.innerHeight - 340 - 4)
  const hasBg = !!(user.coverImage||user.profileBackground||user.cardBackground)
  const bannerBg = user.coverImage||user.profileBackground||user.cardBackground
  const uid = user._id||user.userId

  function handleIgnore() {
    if (ignored) return
    setIgnored(true); onIgnore?.(uid); onClose()
  }

  const buttons = [
    { icon:'fa-solid fa-circle-user',       label:'Profile',  color:'#1a73e8', show:true,             fn:()=>{onFull?.();onClose()} },
    { icon:'fa-solid fa-comments',   label:'PM',       color:'#7c3aed', show:!isMe,            fn:()=>{} },
    { icon:'fa-solid fa-phone', label:'Call',     color:'#059669', show:!isMe,            fn:()=>{socket?.emit('callUser',{toUserId:uid,callType:'video',callId:`c_${Date.now()}`});onClose()} },
    { icon:'fa-solid fa-gift',       label:'Gift',     color:'#ec4899', show:!isMe,            fn:()=>{onGift?.(user);onClose()} },
    { icon:'fa-solid fa-user-plus',   label:'Friend',   color:'#22c55e', show:!isMe&&myLevel>=2,fn:()=>{fetch(`${API}/api/users/friend/${uid}`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{});onClose()} },
    { icon:'fa-solid fa-user-slash', label:ignored?'✓ Ignored':'Ignore', color:'#6b7280', show:!isMe&&myLevel>=2, fn:handleIgnore, dim:ignored },
    { icon:'fa-sharp fa-solid fa-flag',       label:'Report',   color:'#ef4444', show:!isMe,            fn:()=>setShowReport(true) },
    { icon:'fa-solid fa-user-shield', label:'Actions', color:'#f59e0b', show:canAct,   fn:()=>setShowStaff(true) },
  ].filter(b=>b.show)

  return (
    <>
      <div style={{position:'fixed',zIndex:9999,top:y,left:x,background:'#fff',border:'1px solid #e4e6ea',borderRadius:14,width:cardW,boxShadow:'0 12px 36px rgba(0,0,0,.22)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
        <div style={{height:54,position:'relative',background:hasBg?`url(${bannerBg}) center/cover no-repeat`:`linear-gradient(135deg,${ri.color}55,${ri.color}22,#e8f0fe)`}}>
          {hasBg&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.18)'}}/>}
          <button onClick={onClose} style={{position:'absolute',top:7,right:7,background:'rgba(0,0,0,.35)',border:'none',width:22,height:22,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12,zIndex:1}}>✕</button>
        </div>
        <div style={{padding:'0 10px',marginTop:-22,marginBottom:4,position:'relative',zIndex:2,display:'flex',alignItems:'flex-end'}}>
          <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt=""
            style={{width:44,height:44,borderRadius:'50%',border:`2.5px solid ${bdr}`,objectFit:'cover',background:'#fff',flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,.15)'}}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        </div>
        <div style={{padding:'0 10px 8px'}}>
          <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.88rem',color:resolveNameColor(user.nameColor,ri.color),overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.username}</div>
          <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}><RIcon rank={user.rank} size={11}/><span style={{fontSize:'0.65rem',color:ri.color,fontWeight:700}}>{ri.label}</span></div>
          {user.mood&&<div style={{fontSize:'0.68rem',color:'#6b7280',marginTop:3,fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>"{user.mood}"</div>}
        </div>
        <div style={{padding:'0 8px 10px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
          {buttons.map((b,i)=>(
            <button key={i} onClick={b.fn}
              style={{display:'flex',alignItems:'center',gap:6,padding:'7px 8px',background:'#f9fafb',border:'1px solid #e4e6ea',borderRadius:8,cursor:b.dim?'not-allowed':'pointer',fontSize:'0.72rem',fontWeight:700,color:b.color||'#374151',transition:'all .12s',opacity:b.dim?.5:1}}
              onMouseEnter={e=>{if(!b.dim){e.currentTarget.style.background=`${b.color}15`;e.currentTarget.style.borderColor=b.color}}}
              onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e4e6ea'}}>
              <i className={`${b.icon}`} style={{fontSize:11,flexShrink:0}}/>{b.label}
            </button>
          ))}
        </div>
      </div>
      {showReport&&<ReportModal targetUser={user} onClose={()=>setShowReport(false)}/>}
      {showStaff&&<StaffActionModal targetUser={user} myLevel={myLevel} socket={socket} roomId={roomId} onClose={()=>setShowStaff(false)}/>}
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// SELF PROFILE OVERLAY
// ─────────────────────────────────────────────────────────────
function SelfProfileOverlay({ user, onClose, onUpdated }) {
  const [mood, setMood]     = useState(user?.mood||''  )
  const [about, setAbout]   = useState(user?.about||'')
  const [saving, setSaving] = useState(false)
  const [ok, setOk]         = useState('')
  const ri = R(user?.rank), bdr = GBR(user?.gender, user?.rank)

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
// PROFILE MODAL
// ─────────────────────────────────────────────────────────────
function ProfileModal({ user, myLevel, myId, socket, roomId, onClose, onGift, ignoredUsers, onIgnore }) {
  if (!user) return null
  const ri = R(user.rank), bdr = GBR(user.gender, user.rank)
  const isMe = (user._id===myId||user.userId===myId)
  const canAct = myLevel>=11 && RL(user.rank)<myLevel && !isMe
  const token = localStorage.getItem('cgz_token')
  const [showReport, setShowReport] = useState(false)
  const [showStaff, setShowStaff]   = useState(false)
  const [ignored, setIgnored]       = useState(()=>(ignoredUsers||new Set()).has(user._id||user.userId))
  const uid = user._id||user.userId

  function handleIgnore() {
    if (ignored) return
    setIgnored(true); onIgnore?.(uid); onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.45)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
        <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:18,maxWidth:340,width:'100%',overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,.18)',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
          <div style={{height:88,background:`linear-gradient(135deg,${ri.color}44,#e8f0fe)`,position:'relative',flexShrink:0}}>
            <button onClick={onClose} style={{position:'absolute',top:10,right:10,background:'rgba(255,255,255,.8)',border:'none',width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}><i className="fa-solid fa-xmark"/></button>
            {user.countryCode&&user.countryCode!=='ZZ'&&<img src={`/icons/flags/${user.countryCode.toUpperCase()}.png`} alt="" style={{position:'absolute',bottom:10,right:12,width:22,height:14,borderRadius:2}} onError={e=>e.target.style.display='none'}/>}
          </div>
          <div style={{display:'flex',justifyContent:'center',marginTop:-36,flexShrink:0}}>
            <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:72,height:72,borderRadius:'50%',border:`3px solid ${bdr}`,objectFit:'cover',background:'#fff'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'10px 18px 18px',textAlign:'center'}}>
            <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1.05rem',color:resolveNameColor(user.nameColor,ri.color)||'#111827'}}>{user.username}</div>
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
            <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center'}}>
              {[
                {icon:'fa-solid fa-comments',label:'Private',color:'#7c3aed',show:!isMe,fn:()=>{}},
                {icon:'fa-solid fa-phone',label:'Call',color:'#059669',show:!isMe,fn:()=>{socket?.emit('callUser',{toUserId:uid,callType:'video',callId:`c_${Date.now()}`});onClose()}},
                {icon:'fa-solid fa-gift',label:'Gift',color:'#ec4899',show:!isMe,fn:()=>{onGift(user);onClose()}},
                {icon:'fa-solid fa-user-plus',label:'Friend',color:'#22c55e',show:!isMe&&myLevel>=2,fn:()=>{fetch(`${API}/api/users/friend/${uid}`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{});onClose()}},
                {icon:'fa-solid fa-user-slash',label:ignored?'✓ Ignored':'Ignore',color:'#6b7280',show:!isMe&&myLevel>=2,fn:handleIgnore,dim:ignored},
                {icon:'fa-sharp fa-solid fa-flag',label:'Report',color:'#ef4444',show:!isMe,fn:()=>setShowReport(true)},
                {icon:'fa-solid fa-user-shield',label:'Staff Actions',color:'#f59e0b',show:canAct,fn:()=>setShowStaff(true)},
              ].filter(b=>b.show).map((b,i)=>(
                <button key={i} onClick={b.fn}
                  style={{display:'flex',alignItems:'center',gap:5,padding:'7px 10px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:8,cursor:b.dim?'not-allowed':'pointer',fontSize:'0.78rem',fontWeight:600,color:b.color||'#374151',transition:'all .12s',opacity:b.dim?.5:1}}
                  onMouseEnter={e=>{if(!b.dim){e.currentTarget.style.background=`${b.color}15`;e.currentTarget.style.borderColor=b.color}}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e4e6ea'}}>
                  <i className={`${b.icon}`} style={{fontSize:12}}/>{b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showReport&&<ReportModal targetUser={user} onClose={()=>setShowReport(false)}/>}
      {showStaff&&<StaffActionModal targetUser={user} myLevel={myLevel} socket={socket} roomId={roomId} onClose={()=>setShowStaff(false)}/>}
    </>
  )
}

export { MiniCard, SelfProfileOverlay, ProfileModal, ReportModal, StaffActionModal }
