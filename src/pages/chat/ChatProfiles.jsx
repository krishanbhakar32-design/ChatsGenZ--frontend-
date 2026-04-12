// ============================================================
// ChatProfiles.jsx — Full CodyChat-style Profile System
//
// STRUCTURE (matching PHP box/profile.php exactly):
//
// ProfileModal (other user):
//   ┌──────────────────────────────────────────────┐
//   │  Cover BG (gradient or user cover image)     │
//   │  [TopMenu]: level+likes(left) | edit(staff)  │
//   │             | report | actions(☰) | ✕       │
//   │         [Avatar] (center, overlapping cover) │
//   │    [Rank Icon + Name + Mood] (centered)      │
//   ├──────────────────────────────────────────────│
//   │  [Muted / Banned warning bar if applicable]  │
//   ├──────────────────────────────────────────────│
//   │  Tab Menu: Bio | About | Friends | Gifts     │
//   │            | More (staff: Wallet/History/    │
//   │              Note/Whois)                     │
//   ├──────────────────────────────────────────────│
//   │  Tab Content zones:                          │
//   │   Bio: age, gender, country, language,       │
//   │        join date, current room, last seen,   │
//   │        badges                                │
//   │   About: freeform text                       │
//   │   Friends: lazy-loaded grid                  │
//   │   Gifts: lazy-loaded grid                    │
//   │   More: Wallet / History / Note / Whois      │
//   └──────────────────────────────────────────────┘
//
// SelfProfileOverlay (my profile):
//   Same cover layout, but top-menu shows edit-profile btn
//   Body: editable mood/about/avatar, stats
//
// MiniCard (near-username popup):
//   Small card anchored to click pos
//   Self: View Profile | Edit Profile
//   Other: View Profile | Add Friend | View Cam (LIVE badge)
//         | Whisper | Gift | Ignore | Report | Actions (staff)
//
// StaffActionModal:
//   Room Level tab: Mute / Kick / Room Ban
//   Mains tab (admin+): Rank | Room Rank | Edit Profile
//                       | Mute | Kick | Ban | IP Ban
//   admin_user box items: Change Rank, Auth, Name, Color,
//     Mood, Email, About, Password, Verify, Whitelist,
//     Block, Delete
//
// "Actions" (☰) button in profile → opens getActions menu:
//   Whisper | Gift | Wallet share | Ignore | Report
//   + staff: Actions panel
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { API, R, RL, GBR, RANKS, resolveNameColor } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'

// ── Constants ─────────────────────────────────────────────────
const MUTE_TIMES = [
  { label: '1 min', val: 1 }, { label: '5 min', val: 5 }, { label: '10 min', val: 10 },
  { label: '30 min', val: 30 }, { label: '1 hour', val: 60 }, { label: '3 hours', val: 180 },
  { label: '6 hours', val: 360 }, { label: '12 hours', val: 720 }, { label: '24 hours', val: 1440 },
]
const KICK_TIMES = [
  { label: '30 min', val: 30 }, { label: '1 hour', val: 60 }, { label: '3 hours', val: 180 },
  { label: '6 hours', val: 360 }, { label: '12 hours', val: 720 }, { label: '24 hours', val: 1440 },
  { label: '3 days', val: 4320 }, { label: '7 days', val: 10080 },
]
const ALL_RANKS    = Object.entries(RANKS).map(([k, v]) => ({ key: k, ...v }))
const ROOM_RANKS   = ALL_RANKS.filter(r => r.level <= 11)
const COUNTRY_NAMES = { IN: 'India', US: 'United States', GB: 'United Kingdom', PK: 'Pakistan', BD: 'Bangladesh', AE: 'UAE', SA: 'Saudi Arabia', CA: 'Canada', AU: 'Australia', DE: 'Germany', FR: 'France', IT: 'Italy', BR: 'Brazil', MX: 'Mexico', RU: 'Russia', JP: 'Japan', KR: 'South Korea', CN: 'China', EG: 'Egypt', NG: 'Nigeria', ZA: 'South Africa' }
const GENDER_LABELS = { male: 'Male', female: 'Female', couple: 'Couple', other: 'Other / Non-binary' }

const tok = () => localStorage.getItem('cgz_token')

function getZodiac(dob) {
  if (!dob) return '—'
  const d = new Date(dob)
  const m = d.getMonth() + 1, day = d.getDate()
  if ((m===1&&day>=20)||(m===2&&day<=18)) return '♒ Aquarius'
  if ((m===2&&day>=19)||(m===3&&day<=20)) return '♓ Pisces'
  if ((m===3&&day>=21)||(m===4&&day<=19)) return '♈ Aries'
  if ((m===4&&day>=20)||(m===5&&day<=20)) return '♉ Taurus'
  if ((m===5&&day>=21)||(m===6&&day<=20)) return '♊ Gemini'
  if ((m===6&&day>=21)||(m===7&&day<=22)) return '♋ Cancer'
  if ((m===7&&day>=23)||(m===8&&day<=22)) return '♌ Leo'
  if ((m===8&&day>=23)||(m===9&&day<=22)) return '♍ Virgo'
  if ((m===9&&day>=23)||(m===10&&day<=22)) return '♎ Libra'
  if ((m===10&&day>=23)||(m===11&&day<=21)) return '♏ Scorpio'
  if ((m===11&&day>=22)||(m===12&&day<=21)) return '♐ Sagittarius'
  return '♑ Capricorn'
}


function apiPost(path, body) {
  return fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify(body) })
}
function apiPatch(path, body) {
  return fetch(`${API}${path}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify(body) })
}

// ── Shared style tokens (dark, exactly like CodyChat) ──────────
const T = {
  bg:     '#141420',
  bg2:    '#0e0e1a',
  bg3:    '#1a1a2e',
  border: 'rgba(255,255,255,0.08)',
  text:   '#e8e8f0',
  muted:  '#7a7a9a',
  accent: '#1a73e8',
}

// ── Shared sub-components ──────────────────────────────────────
function ProItem({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
      <i className={`fa ${icon}`} style={{ width: 22, fontSize: 13, color: T.muted, flexShrink: 0 }} />
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: T.muted, minWidth: 90, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: T.text, flex: 1, wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: active ? T.text : T.muted, borderBottom: `2px solid ${active ? T.accent : 'transparent'}`, transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {label}
    </button>
  )
}

function ActionBtn({ icon, label, color, onClick, badge, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', width: '100%', border: 'none', borderBottom: `1px solid ${T.border}`, background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'background .12s', opacity: disabled ? 0.45 : 1 }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{ width: 28, height: 28, borderRadius: 7, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={icon} style={{ fontSize: 12, color }} />
      </span>
      <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: T.text }}>{label}</span>
      {badge && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}>{badge}</span>}
      <i className="fa fa-chevron-right" style={{ fontSize: 9, color: T.muted, flexShrink: 0 }} />
    </button>
  )
}

function SInput({ value, onChange, placeholder, rows, style }) {
  return rows ? (
    <textarea dir="ltr" value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ width: '100%', padding: '9px 12px', background: T.bg2, border: `1.5px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: '0.82rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', direction: 'ltr', textAlign: 'left', ...style }}
      onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
  ) : (
    <input dir="ltr" value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: '100%', padding: '9px 12px', background: T.bg2, border: `1.5px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', direction: 'ltr', textAlign: 'left', ...style }}
      onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
  )
}

function SBtn({ children, onClick, disabled, color, style, full }) {
  const bg = color === 'red' ? '#ef4444' : color === 'green' ? '#22c55e' : color === 'amber' ? '#f59e0b' : T.accent
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: disabled ? T.bg3 : bg, color: disabled ? T.muted : '#fff', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.82rem', opacity: disabled ? 0.6 : 1, width: full ? '100%' : undefined, transition: 'opacity .12s', ...style }}>
      {children}
    </button>
  )
}

// ── Badges row ─────────────────────────────────────────────────
function BadgeRow({ user }) {
  const badges = []
  const BADGE_TYPES = [
    { key: 'badge_member',  src: n => `/default_images/badge/badge_member${n}.svg`,   title: 'Member Badge',    hasCount: false },
    { key: 'badge_auth',    src: () => '/default_images/badge/badge_auth.svg',         title: 'Verified',        hasCount: false },
    { key: 'badge_beat',    src: () => '/default_images/badge/badge_beat.svg',         title: 'Beat Badge',      hasCount: true  },
    { key: 'badge_chat',    src: () => '/default_images/badge/badge_chat.svg',         title: 'Chat Badge',      hasCount: true  },
    { key: 'badge_like',    src: () => '/default_images/badge/badge_like.svg',         title: 'Like Badge',      hasCount: true  },
    { key: 'badge_friend',  src: () => '/default_images/badge/badge_friend.svg',       title: 'Friend Badge',    hasCount: true  },
    { key: 'badge_top',     src: () => '/default_images/badge/badge_top.svg',          title: 'Top Badge',       hasCount: true  },
    { key: 'badge_gift',    src: () => '/default_images/badge/badge_gift.svg',         title: 'Gift Badge',      hasCount: true  },
    { key: 'badge_gold',    src: () => '/default_images/badge/badge_gold.svg',         title: 'Gold Badge',      hasCount: true  },
    { key: 'badge_ruby',    src: () => '/default_images/badge/badge_ruby.svg',         title: 'Ruby Badge',      hasCount: true  },
  ]
  for (const b of BADGE_TYPES) {
    const val = user?.[b.key]
    if (!val || val <= 0) continue
    badges.push(
      <div key={b.key} title={b.title}
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 3px 4px 0' }}>
        <img src={b.src(val)} alt={b.title} style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
        {b.hasCount && val > 1 && (
          <img src={`/default_images/badge/numbers/${val > 9 ? '9' : val}.svg`} alt={val} style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12 }} onError={e => e.target.style.display = 'none'} />
        )}
      </div>
    )
  }
  if (!badges.length) return null
  return <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', paddingTop: 8 }}>{badges}</div>
}

// ═══════════════════════════════════════════════════════════════
// REPORT MODAL
// ═══════════════════════════════════════════════════════════════
function ReportModal({ targetUser, onClose }) {
  const REASONS = ['Harassment / Bullying', 'Spam / Advertising', 'Inappropriate content', 'Hate speech / Discrimination', 'Impersonation', 'Scam / Fraud', 'Underage user', 'Other']
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [sent,   setSent]   = useState(false)
  const [loading, setLoad]  = useState(false)

  async function submit() {
    if (!reason) return
    setLoad(true)
    try {
      await fetch(`${API}/api/reports`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify({ reportedUserId: targetUser._id || targetUser.userId, reason, detail }) })
      setSent(true)
    } catch {}
    setLoad(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 3100, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, maxWidth: 360, width: '100%', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', borderBottom: `1px solid ${T.border}` }}>
          <i className="fa fa-flag" style={{ color: '#ef4444', fontSize: 16 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: T.text }}>Report User</div>
            <div style={{ fontSize: '0.68rem', color: T.muted }}>{targetUser.username}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 16 }}><i className="fa fa-times" /></button>
        </div>
        {sent ? (
          <div style={{ padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 800, color: '#22c55e', fontSize: '0.95rem' }}>Report Submitted</div>
            <button onClick={onClose} style={{ marginTop: 16, padding: '8px 22px', borderRadius: 9, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>Close</button>
          </div>
        ) : (
          <div style={{ padding: '12px 14px 16px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>Reason</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {REASONS.map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', border: `1.5px solid ${reason === r ? '#ef4444' : T.border}`, borderRadius: 8, cursor: 'pointer', background: reason === r ? 'rgba(239,68,68,.08)' : T.bg2 }}>
                  <input type="radio" name="rr" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: '#ef4444' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: reason === r ? '#f87171' : T.text }}>{r}</span>
                </label>
              ))}
            </div>
            <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={2} maxLength={300} placeholder="Details (optional)"
              style={{ width: '100%', padding: '8px 11px', border: `1.5px solid ${T.border}`, borderRadius: 9, fontSize: '0.8rem', outline: 'none', resize: 'none', boxSizing: 'border-box', background: T.bg2, color: T.text, marginBottom: 10, fontFamily: 'inherit' }} />
            <button onClick={submit} disabled={!reason || loading}
              style={{ width: '100%', padding: '10px', borderRadius: 9, border: 'none', background: reason ? '#ef4444' : T.bg3, color: reason ? '#fff' : T.muted, fontWeight: 800, cursor: reason ? 'pointer' : 'not-allowed', fontSize: '0.85rem' }}>
              {loading ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SHARE WALLET MODAL
// ═══════════════════════════════════════════════════════════════
function ShareWalletModal({ targetUser, onClose, socket }) {
  const [tab,    setTab]    = useState('coins')
  const [amount, setAmount] = useState('')
  const [myGold, setGold]   = useState(0)
  const [myRuby, setRuby]   = useState(0)
  const [sent,   setSent]   = useState(false)
  const [loading, setLoad]  = useState(false)
  const COIN_VALUES = [100, 200, 300, 500, 750, 1000]
  const RUBY_VALUES = [1, 2, 3, 5, 10, 20]

  useEffect(() => {
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json()).then(d => { setGold(d.user?.gold || 0); setRuby(d.user?.ruby || 0) }).catch(() => {})
  }, [])

  async function send() {
    const val = parseInt(amount)
    if (!val || val <= 0) return
    if (tab === 'coins' && val > myGold) return
    if (tab === 'ruby'  && val > myRuby) return
    setLoad(true)
    try {
      await fetch(`${API}/api/users/${targetUser._id || targetUser.userId}/transfer`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify({ type: tab, amount: val }) })
      setSent(true)
    } catch {}
    setLoad(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 3200, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, maxWidth: 310, width: '100%', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa fa-wallet" style={{ color: '#fbbf24', fontSize: 15 }} />
            <span style={{ fontWeight: 800, color: T.text, fontSize: '0.88rem' }}>Share Wallet</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 14 }}><i className="fa fa-times" /></button>
        </div>
        {sent ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#22c55e', fontWeight: 800, fontSize: '0.92rem' }}>✅ Sent successfully!</div>
        ) : (
          <div style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {[{ id: 'coins', icon: '🪙', label: 'Coins', bal: myGold }, { id: 'ruby', icon: '💎', label: 'Ruby', bal: myRuby }].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setAmount('') }}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: `1.5px solid ${tab === t.id ? '#fbbf24' : T.border}`, background: tab === t.id ? 'rgba(251,191,36,.08)' : T.bg2, color: tab === t.id ? '#fbbf24' : T.muted, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center' }}>
                  {t.icon} {t.label}
                  <div style={{ fontSize: '0.62rem', marginTop: 1 }}>Bal: {t.bal}</div>
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Amount</div>
            <select value={amount} onChange={e => setAmount(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: T.bg2, border: `1.5px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: '0.8rem', marginBottom: 10 }}>
              <option value="">Select amount</option>
              {(tab === 'coins' ? COIN_VALUES : RUBY_VALUES).map(v => <option key={v} value={v}>{v} {tab === 'coins' ? 'Coins' : 'Ruby'}</option>)}
            </select>
            {amount && (
              <div style={{ background: 'rgba(251,191,36,.07)', border: `1px solid rgba(251,191,36,.2)`, borderRadius: 8, padding: '6px 10px', fontSize: '0.76rem', color: '#fbbf24', marginBottom: 10, textAlign: 'center', fontWeight: 700 }}>
                Sending {amount} {tab === 'coins' ? 'coins' : 'ruby'} → {targetUser.username}
              </div>
            )}
            <div style={{ display: 'flex', gap: 7 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'none', color: T.muted, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
              <button onClick={send} disabled={!amount || loading} style={{ flex: 2, padding: '9px', borderRadius: 9, border: 'none', background: amount ? '#fbbf24' : T.bg3, color: amount ? '#111' : T.muted, fontWeight: 800, cursor: amount ? 'pointer' : 'not-allowed', fontSize: '0.82rem' }}>
                {loading ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STAFF ACTION MODAL (actions(☰) → Full panel)
// Tab 1: Room Level — Mute / Kick / Room Ban
// Tab 2: Mains (admin+) — all admin_user.php items
// ═══════════════════════════════════════════════════════════════
function StaffActionModal({ targetUser, myLevel, socket, roomId, onClose, onKicked }) {
  const isAdmin      = myLevel >= 12
  const isSuperAdmin = myLevel >= 13

  const [tab,    setTab]  = useState('room')
  const [done,   setDone] = useState('')
  const [loading, setLoad] = useState(false)

  // room tab
  const [roomAction,   setRoomAction]  = useState('mute')
  const [roomMuteMin,  setRoomMute]    = useState(5)
  const [roomReason,   setRoomReason]  = useState('')

  // mains tab section
  const [section,     setSection]     = useState('rank')
  const [reason,      setReason]      = useState('')
  const [muteMin,     setMuteMin]     = useState(5)
  const [kickMin,     setKickMin]     = useState(60)
  const [newRank,     setNewRank]     = useState(targetUser.rank || 'user')
  const [newRoomRank, setNewRoomRank] = useState(targetUser.roomRank || 'user')
  const [epField,     setEpField]     = useState('username')
  const [epValue,     setEpValue]     = useState('')
  const [epAvatar,    setEpAvatar]    = useState(null)

  const tid = targetUser._id || targetUser.userId
  const ri  = R(targetUser.rank)

  function flash(msg) { setDone(msg); setTimeout(onClose, 1800) }

  // Room actions
  function doRoom() {
    if (!roomReason.trim() && !['unmute','unkick','unban'].includes(roomAction)) return
    setLoad(true)
    if      (roomAction === 'mute')   { socket?.emit('muteUser',      { targetUserId: tid, roomId, minutes: roomMuteMin, reason: roomReason }); flash(`Room muted ${roomMuteMin} min.`) }
    else if (roomAction === 'kick')   { socket?.emit('kickUser',       { targetUserId: tid, roomId, reason: roomReason }); flash('Kicked from room.') }
    else if (roomAction === 'ban')    { socket?.emit('roomBanUser',    { targetUserId: tid, roomId, reason: roomReason }); apiPost(`/api/admin/users/${tid}/roomban`, { roomId, reason: roomReason }).catch(() => {}); flash('Room banned.') }
    else if (roomAction === 'ghost')  { socket?.emit('ghostUser',      { targetUserId: tid, roomId, reason: roomReason }); apiPost(`/api/admin/users/${tid}/ghost`,  { roomId, reason: roomReason }).catch(() => {}); flash('User ghosted.') }
    else if (roomAction === 'unmute') { socket?.emit('unmuteUser',     { targetUserId: tid, roomId }); apiPost(`/api/admin/users/${tid}/unmute`, { roomId }).catch(() => {}); flash('User unmuted.') }
    else if (roomAction === 'unkick') { socket?.emit('unkickUser',     { targetUserId: tid, roomId }); flash('Kick revoked.') }
    else if (roomAction === 'unban')  { socket?.emit('roomUnbanUser',  { targetUserId: tid, roomId }); apiPost(`/api/admin/users/${tid}/roomunban`, { roomId }).catch(() => {}); flash('Room ban removed.') }
    setLoad(false)
  }

  // Mains actions
  function doMute()         { if (!reason.trim()) return; setLoad(true); socket?.emit('globalMuteUser', { targetUserId: tid, minutes: muteMin, reason }); apiPost(`/api/admin/users/${tid}/mute`, { minutes: muteMin, reason }).catch(() => {}); flash(`Muted ${muteMin} min.`); setLoad(false) }
  function doKick()         { if (!reason.trim()) return; setLoad(true); socket?.emit('kickUser', { targetUserId: tid, roomId, reason, kickDurationMinutes: kickMin }); apiPost(`/api/admin/users/${tid}/kick`, { roomId, reason, minutes: kickMin }).catch(() => {}); onKicked?.(); flash(`Kicked ${kickMin} min.`); setLoad(false) }
  function doBan()          { if (!reason.trim()) return; setLoad(true); socket?.emit('banUser', { targetUserId: tid, reason }); apiPost(`/api/admin/users/${tid}/ban`, { reason }).catch(() => {}); flash('Banned.'); setLoad(false) }
  function doIpBan()        { if (!reason.trim()) return; setLoad(true); apiPost(`/api/admin/users/${tid}/ipban`, { reason }).catch(() => {}); flash('IP Banned.'); setLoad(false) }
  function doChangeRank()   { setLoad(true); apiPatch(`/api/admin/users/${tid}/rank`, { rank: newRank }).catch(() => {}); socket?.emit('updateUserRank', { targetUserId: tid, rank: newRank }); flash(`Rank → ${newRank}.`); setLoad(false) }
  function doRoomRank()     { setLoad(true); apiPatch(`/api/admin/users/${tid}/roomrank`, { roomId, rank: newRoomRank }).catch(() => {}); flash(`Room rank → ${newRoomRank}.`); setLoad(false) }
  async function doEditProf() {
    setLoad(true)
    if (epAvatar) { const fd = new FormData(); fd.append('avatar', epAvatar); await fetch(`${API}/api/admin/users/${tid}/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}` }, body: fd }).catch(() => {}) }
    else if (epValue.trim()) { await apiPatch(`/api/admin/users/${tid}`, { [epField]: epValue.trim() }).catch(() => {}) }
    flash('Updated.'); setLoad(false)
  }
  function doBlockFeature()  { setLoad(true); apiPost(`/api/admin/users/${tid}/blockfeature`, {}).catch(() => {}); flash('Feature blocked.'); setLoad(false) }
  function doDeleteAccount() { setLoad(true); apiPost(`/api/admin/users/${tid}/delete`, {}).catch(() => {}); flash('Account deleted.'); setLoad(false) }
  function doVerifyEmail()   { setLoad(true); apiPost(`/api/admin/users/${tid}/verify`, {}).catch(() => {}); flash('Email verified.'); setLoad(false) }
  function doWhitelist()     { setLoad(true); apiPost(`/api/admin/users/${tid}/whitelist`, {}).catch(() => {}); flash('VPN whitelisted.'); setLoad(false) }

  const ROOM_ACTIONS = [
    { id: 'mute',   icon: 'fa-microphone-slash', label: 'Mute',     color: '#f59e0b' },
    { id: 'kick',   icon: 'fa-user-slash',        label: 'Kick',     color: '#ef4444' },
    { id: 'ban',    icon: 'fa-ban',               label: 'Room Ban', color: '#dc2626' },
    { id: 'ghost',  icon: 'fa-ghost',             label: 'Ghost',    color: '#6b7280' },
    { id: 'unmute', icon: 'fa-microphone',        label: 'Unmute',   color: '#22c55e' },
    { id: 'unkick', icon: 'fa-rotate-left',       label: 'Unkick',   color: '#22c55e' },
    { id: 'unban',  icon: 'fa-shield-check',      label: 'Unban',    color: '#22c55e' },
  ]
  const MAIN_SECTIONS = [
    { id: 'rank',        icon: 'fa-star',                label: 'Rank'        },
    { id: 'roomrank',    icon: 'fa-home',                label: 'Room Rank'   },
    { id: 'editprofile', icon: 'fa-edit',                label: 'Edit Profile' },
    { id: 'mute',        icon: 'fa-microphone-slash',    label: 'Mute'        },
    { id: 'kick',        icon: 'fa-user-slash',          label: 'Kick'        },
    { id: 'ban',         icon: 'fa-ban',                 label: 'Ban'         },
    ...(isSuperAdmin ? [{ id: 'ipban', icon: 'fa-network-wired', label: 'IP Ban' }] : []),
    { id: 'verify',      icon: 'fa-check-circle',        label: 'Verify Email' },
    { id: 'whitelist',   icon: 'fa-ghost',               label: 'VPN Whitelist' },
    { id: 'blockfeat',   icon: 'fa-lock',                label: 'Block Feature' },
    { id: 'delete',      icon: 'fa-trash',               label: 'Delete Account', danger: true },
  ]

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16, maxWidth: 440, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <img src={targetUser.avatar || '/default_images/avatar/default_guest.png'} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GBR(targetUser.gender, targetUser.rank)}`, flexShrink: 0 }} onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: '0.92rem', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{targetUser.username}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <RIcon rank={targetUser.rank} size={12} />
              <span style={{ fontSize: '0.64rem', color: ri.color, fontWeight: 700 }}>{ri.label}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 16 }}><i className="fa fa-times" /></button>
        </div>

        {done && <div style={{ background: 'rgba(34,197,94,.08)', borderBottom: `1px solid rgba(34,197,94,.15)`, padding: '7px 14px', fontSize: '0.78rem', color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✅ {done}</div>}

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, flexShrink: 0, background: T.bg2 }}>
          <button onClick={() => setTab('room')} style={{ flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer', color: tab === 'room' ? '#60a5fa' : T.muted, borderBottom: `2px solid ${tab === 'room' ? '#60a5fa' : 'transparent'}`, fontWeight: 700, fontSize: '0.8rem' }}>
            <i className="fa fa-home" style={{ marginRight: 5 }} />Room Level
          </button>
          {isAdmin && (
            <button onClick={() => setTab('mains')} style={{ flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer', color: tab === 'mains' ? '#f59e0b' : T.muted, borderBottom: `2px solid ${tab === 'mains' ? '#f59e0b' : 'transparent'}`, fontWeight: 700, fontSize: '0.8rem' }}>
              <i className="fa fa-gauge" style={{ marginRight: 5 }} />Mains
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', scrollbarWidth: 'thin' }}>

          {/* ── ROOM LEVEL TAB ── */}
          {tab === 'room' && (
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {ROOM_ACTIONS.map(a => (
                  <button key={a.id} onClick={() => setRoomAction(a.id)}
                    style={{ flex: 1, padding: '9px 4px', borderRadius: 9, border: `1.5px solid ${roomAction === a.id ? a.color : T.border}`, background: roomAction === a.id ? `${a.color}18` : T.bg2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: roomAction === a.id ? a.color : T.muted, fontWeight: 700, fontSize: '0.77rem' }}>
                    <i className={`fa ${a.icon}`} style={{ fontSize: 11 }} />{a.label}
                  </button>
                ))}
              </div>
              {roomAction === 'mute' && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Duration</div>
                  <select value={roomMuteMin} onChange={e => setRoomMute(+e.target.value)} style={{ width: '100%', padding: '8px 10px', background: T.bg2, border: `1.5px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: '0.8rem' }}>
                    {MUTE_TIMES.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Reason {roomAction === 'ban' ? '(permanent)' : ''}</div>
                <SInput value={roomReason} onChange={e => setRoomReason(e.target.value)} placeholder={`Reason for ${roomAction}…`} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'none', color: T.muted, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                <SBtn onClick={doRoom} disabled={!roomReason.trim() || loading} color="red" style={{ flex: 2 }}>{loading ? 'Processing…' : 'Take Action'}</SBtn>
              </div>
            </div>
          )}

          {/* ── MAINS TAB ── */}
          {tab === 'mains' && isAdmin && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {MAIN_SECTIONS.map(s => (
                  <button key={s.id} onClick={() => setSection(s.id)}
                    style={{ padding: '5px 9px', borderRadius: 7, border: `1.5px solid ${section === s.id ? (s.danger ? '#ef4444' : '#f59e0b') : T.border}`, background: section === s.id ? `${s.danger ? '#ef4444' : '#f59e0b'}15` : T.bg2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: section === s.id ? (s.danger ? '#ef4444' : '#f59e0b') : T.muted, fontWeight: 700, fontSize: '0.71rem' }}>
                    <i className={`fa ${s.icon}`} style={{ fontSize: 9 }} />{s.label}
                  </button>
                ))}
              </div>

              {section === 'rank' && (
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>New Rank</div>
                  <select value={newRank} onChange={e => setNewRank(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: T.bg2, border: `1.5px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: '0.8rem', marginBottom: 12 }}>
                    {ALL_RANKS.map(r => <option key={r.key} value={r.key}>{r.label} (Level {r.level})</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}><button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'none', color: T.muted, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button><SBtn onClick={doChangeRank} disabled={loading} style={{ flex: 2 }}>Save Rank</SBtn></div>
                </div>
              )}
              {section === 'roomrank' && (
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Room Rank</div>
                  <select value={newRoomRank} onChange={e => setNewRoomRank(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: T.bg2, border: `1.5px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: '0.8rem', marginBottom: 12 }}>
                    {ROOM_RANKS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}><button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'none', color: T.muted, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button><SBtn onClick={doRoomRank} disabled={loading} style={{ flex: 2 }}>Save</SBtn></div>
                </div>
              )}
              {section === 'editprofile' && (
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Field</div>
                  <select value={epField} onChange={e => { setEpField(e.target.value); setEpValue(''); setEpAvatar(null) }} style={{ width: '100%', padding: '8px 10px', background: T.bg2, border: `1.5px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: '0.8rem', marginBottom: 10 }}>
                    <option value="username">Username</option>
                    <option value="mood">Mood</option>
                    <option value="about">About</option>
                    <option value="avatar">Avatar (upload)</option>
                  </select>
                  {epField === 'avatar' ? (
                    <input type="file" accept="image/*" onChange={e => setEpAvatar(e.target.files[0] || null)} style={{ color: T.text, fontSize: '0.8rem', marginBottom: 12 }} />
                  ) : (
                    <div style={{ marginBottom: 12 }}><SInput value={epValue} onChange={e => setEpValue(e.target.value)} placeholder={`New ${epField}…`} /></div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}><button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'none', color: T.muted, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button><SBtn onClick={doEditProf} disabled={(!epValue.trim() && !epAvatar) || loading} style={{ flex: 2 }}>Update</SBtn></div>
                </div>
              )}
              {section === 'mute' && (
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Duration</div>
                  <select value={muteMin} onChange={e => setMuteMin(+e.target.value)} style={{ width: '100%', padding: '8px 10px', background: T.bg2, border: `1.5px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: '0.8rem', marginBottom: 10 }}>
                    {MUTE_TIMES.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
                  </select>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Reason</div>
                  <div style={{ marginBottom: 12 }}><SInput value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for mute…" /></div>
                  <div style={{ display: 'flex', gap: 8 }}><button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'none', color: T.muted, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button><SBtn onClick={doMute} disabled={!reason.trim() || loading} color="amber" style={{ flex: 2 }}>Mute</SBtn></div>
                </div>
              )}
              {section === 'kick' && (
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Duration</div>
                  <select value={kickMin} onChange={e => setKickMin(+e.target.value)} style={{ width: '100%', padding: '8px 10px', background: T.bg2, border: `1.5px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: '0.8rem', marginBottom: 10 }}>
                    {KICK_TIMES.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
                  </select>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Reason</div>
                  <div style={{ marginBottom: 12 }}><SInput value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for kick…" /></div>
                  <div style={{ display: 'flex', gap: 8 }}><button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'none', color: T.muted, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button><SBtn onClick={doKick} disabled={!reason.trim() || loading} color="red" style={{ flex: 2 }}>Kick</SBtn></div>
                </div>
              )}
              {section === 'ban' && (
                <div>
                  <div style={{ background: 'rgba(239,68,68,.07)', border: `1px solid rgba(239,68,68,.2)`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: '0.76rem', color: '#f87171' }}>⚠️ Permanent ban. Cannot be undone unless manually reversed.</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Reason</div>
                  <div style={{ marginBottom: 12 }}><SInput value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for ban…" /></div>
                  <div style={{ display: 'flex', gap: 8 }}><button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'none', color: T.muted, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button><SBtn onClick={doBan} disabled={!reason.trim() || loading} color="red" style={{ flex: 2 }}>Ban Permanently</SBtn></div>
                </div>
              )}
              {section === 'ipban' && isSuperAdmin && (
                <div>
                  <div style={{ background: 'rgba(127,29,29,.12)', border: `1px solid rgba(239,68,68,.3)`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: '0.76rem', color: '#fca5a5' }}>🔒 Blocks all accounts from this IP address.</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Reason</div>
                  <div style={{ marginBottom: 12 }}><SInput value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for IP ban…" /></div>
                  <div style={{ display: 'flex', gap: 8 }}><button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'none', color: T.muted, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button><SBtn onClick={doIpBan} disabled={!reason.trim() || loading} color="red" style={{ flex: 2 }}>IP Ban</SBtn></div>
                </div>
              )}
              {section === 'verify' && <div><p style={{ fontSize: '0.8rem', color: T.muted, marginBottom: 12 }}>Force-verify this user's email address.</p><SBtn onClick={doVerifyEmail} disabled={loading} full color="green">Verify Email</SBtn></div>}
              {section === 'whitelist' && <div><p style={{ fontSize: '0.8rem', color: T.muted, marginBottom: 12 }}>Allow this user to bypass VPN restrictions.</p><SBtn onClick={doWhitelist} disabled={loading} full>Whitelist VPN</SBtn></div>}
              {section === 'blockfeat' && <div><p style={{ fontSize: '0.8rem', color: T.muted, marginBottom: 12 }}>Restrict this user from using certain features.</p><SBtn onClick={doBlockFeature} disabled={loading} full color="amber">Block Feature</SBtn></div>}
              {section === 'delete' && (
                <div>
                  <div style={{ background: 'rgba(127,29,29,.12)', border: `1px solid rgba(239,68,68,.35)`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.78rem', color: '#fca5a5' }}>🗑️ This will permanently delete the account and all its data. This action cannot be undone.</div>
                  <SBtn onClick={doDeleteAccount} disabled={loading} full color="red">Delete Account Permanently</SBtn>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PROFILE MODAL — full view (PHP: box/profile.php)
// ═══════════════════════════════════════════════════════════════
// Status banners for profile modal
function StatusBanners({ isMuted, isBanned, isKicked, isGhosted }) {
  return (
    <>
      {isBanned && (
        <div style={{ margin: '8px 14px', padding: '7px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 9, border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/default_images/icons/banned.svg" alt="banned" style={{ width: 16, height: 16 }} onError={e => { e.target.style.display='none' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ef4444' }}>This user is banned</span>
        </div>
      )}
      {isMuted && !isBanned && (
        <div style={{ margin: '8px 14px', padding: '7px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 9, border: '1px solid rgba(245,158,11,0.35)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/default_images/actions/muted.svg" alt="muted" style={{ width: 16, height: 16 }} onError={e => { e.target.style.display='none' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>This user is muted</span>
        </div>
      )}
      {isKicked && !isBanned && (
        <div style={{ margin: '8px 14px', padding: '7px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 9, border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/default_images/icons/kicked.svg" alt="kicked" style={{ width: 16, height: 16 }} onError={e => { e.target.style.display='none' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f87171' }}>This user is currently kicked</span>
        </div>
      )}
      {isGhosted && (
        <div style={{ margin: '8px 14px', padding: '7px 12px', background: 'rgba(107,114,128,0.1)', borderRadius: 9, border: '1px solid rgba(107,114,128,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/default_images/actions/ghost.svg" alt="ghost" style={{ width: 16, height: 16 }} onError={e => { e.target.style.display='none' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af' }}>This user is ghosted</span>
        </div>
      )}
    </>
  )
}


export function ProfileModal({ user, myLevel, myId, socket, roomId, onClose, onGift, ignoredUsers, onIgnore, onWhisper }) {
  if (!user) return null

  const ri    = R(user.rank)
  const bdr   = GBR(user.gender, user.rank)
  const isMe  = user._id === myId || user.userId === myId
  const isStaff = myLevel >= 11
  const canAct  = isStaff && RL(user.rank) < myLevel && !isMe
  const uid   = user._id || user.userId

  const [tab,        setTab]       = useState('bio')
  const [showAct,    setShowAct]   = useState(false)   // actions (☰) menu
  const [showStaff,  setShowStaff] = useState(false)
  const [showReport, setReport]    = useState(false)
  const [showWallet, setWallet]    = useState(false)
  const [friends,    setFriends]   = useState(null)
  const [gifts,      setGifts]     = useState(null)
  const [ignored,    setIgnored]   = useState(() => (ignoredUsers || new Set()).has(uid))
  const [isMuted,    setIsMuted]   = useState(user.isMuted || false)
  const [isBanned,   setIsBanned]  = useState(user.isBanned || false)
  const [isKicked,   setIsKicked]  = useState(user.isKicked || false)
  const [isGhosted,  setIsGhosted] = useState(user.isGhosted || false)

  const nameColor = resolveNameColor(user.nameColor, '')

  // Lazy-load friends
  useEffect(() => {
    if (tab === 'friends' && friends === null) {
      fetch(`${API}/api/users/${uid}/friends`, { headers: { Authorization: `Bearer ${tok()}` } })
        .then(r => r.json()).then(d => setFriends(d.friends || [])).catch(() => setFriends([]))
    }
  }, [tab])

  // Lazy-load gifts
  useEffect(() => {
    if (tab === 'gifts' && gifts === null) {
      fetch(`${API}/api/users/${uid}/gifts`, { headers: { Authorization: `Bearer ${tok()}` } })
        .then(r => r.json()).then(d => setGifts(d.gifts || [])).catch(() => setGifts([]))
    }
  }, [tab])

  function handleIgnore() {
    if (ignored) return
    setIgnored(true); onIgnore?.(uid); onClose()
  }

  function doAddFriend() {
    fetch(`${API}/api/users/friend/${uid}`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}` } }).catch(() => {})
    onClose()
  }

  // Long date format like CodyChat
  function longDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  function longDateTime(d) {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const TABS = [
    { id: 'bio',     label: 'Bio' },
    ...(user.about ? [{ id: 'about', label: 'About Me' }] : []),
    { id: 'friends', label: 'Friends' },
    { id: 'gifts',   label: 'Gifts'   },
    ...(isStaff ? [{ id: 'more', label: 'More' }] : []),
  ]

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px 16px', overflowY: 'auto' }}>
        <div onClick={e => e.stopPropagation()} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16, width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 20px 64px rgba(0,0,0,.7)', position: 'relative', marginBottom: 20 }}>

          {/* ── COVER + TOP MENU ── */}
          <div style={{ height: 110, position: 'relative', background: user.coverColor ? user.coverColor : `linear-gradient(135deg, ${ri.color}88, #0a0a15 80%)`, overflow: 'hidden', flexShrink: 0 }}>
            {user.coverImage && <img src={user.coverImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />}
            {/* Gradient overlay so text/buttons are readable */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, rgba(0,0,0,.1) 100%)' }} />

            {/* Top menu: left = level+likes, right = edit/report/actions/close */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', padding: '8px 10px', gap: 4, zIndex: 2 }}>
              {/* Level + Likes */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {user.level != null && (
                  <span style={{ background: 'rgba(0,0,0,.5)', color: '#60a5fa', fontSize: '0.65rem', fontWeight: 800, padding: '3px 7px', borderRadius: 8 }}>
                    <i className="fa fa-star" style={{ fontSize: 9, marginRight: 3 }} />Lv.{user.level}
                  </span>
                )}
                {user.totalLikes != null && (
                  <span style={{ background: 'rgba(0,0,0,.5)', color: '#ec4899', fontSize: '0.65rem', fontWeight: 800, padding: '3px 7px', borderRadius: 8 }}>
                    <i className="fa fa-heart" style={{ fontSize: 9, marginRight: 3 }} />{user.totalLikes}
                  </span>
                )}
              </div>
              {/* Edit (staff for other user) */}
              {canAct && (
                <CoverBtn icon="fa-edit" onClick={() => setShowStaff(true)} title="Edit User" />
              )}
              {/* Edit (self) */}
              {isMe && (
                <CoverBtn icon="fa-regular fa-edit" onClick={onClose} title="Edit Profile" />
              )}
              {/* Report (not self, not staff) */}
              {!isMe && !isStaff && (
                <CoverBtn icon="fa-flag" onClick={() => setReport(true)} title="Report" />
              )}
              {/* Actions ☰ (not self) */}
              {!isMe && (
                <CoverBtn icon="fa-bars" onClick={() => setShowAct(p => !p)} title="Actions" active={showAct} />
              )}
              {/* Close */}
              <CoverBtn icon="fa-times" onClick={onClose} title="Close" />
            </div>
          </div>

          {/* ── AVATAR (centered, overlapping cover) ── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: -36, position: 'relative', zIndex: 3 }}>
            <div style={{ position: 'relative' }}>
              <img src={user.avatar || '/default_images/avatar/default_guest.png'} alt=""
                style={{ width: 72, height: 72, borderRadius: '50%', border: `3px solid ${bdr}`, objectFit: 'cover', background: T.bg, boxShadow: '0 4px 16px rgba(0,0,0,.5)' }}
                onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }} />
              {/* Online status dot */}
              <span style={{ position: 'absolute', bottom: 3, right: 3, width: 12, height: 12, borderRadius: '50%', background: user.isOnline ? '#22c55e' : '#9ca3af', border: `2px solid ${T.bg}` }} />
              {/* Note icon */}
              {user.note && (
                <span style={{ position: 'absolute', bottom: 3, left: 3, width: 16, height: 16, borderRadius: '50%', background: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${T.bg}`, cursor: 'pointer' }}>
                  <i className="fa fa-sticky-note" style={{ fontSize: 7, color: '#000' }} />
                </span>
              )}
            </div>
          </div>

          {/* ── Rank icon + Name + Mood ── */}
          <div style={{ textAlign: 'center', padding: '8px 16px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 3 }}>
              <RIcon rank={user.rank} size={16} />
              <span style={{ fontSize: '0.72rem', color: ri.color, fontWeight: 700 }}>{ri.label}</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: '1.05rem', color: nameColor || T.text, fontFamily: 'Outfit, sans-serif', letterSpacing: '-.01em' }}>{user.username}</div>
            {user.mood && <div style={{ fontSize: '0.78rem', color: T.muted, marginTop: 3, fontStyle: 'italic' }}>"{user.mood}"</div>}
          </div>

          {/* ── Muted / Banned bar ── */}
          {isMuted && !isBanned && (
            <div style={{ background: 'rgba(245,158,11,.1)', border: `1px solid rgba(245,158,11,.25)`, margin: '6px 14px', borderRadius: 8, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700 }}>
              <i className="fa fa-exclamation-circle" />User is currently muted
            </div>
          )}
          {isBanned && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: `1px solid rgba(239,68,68,.25)`, margin: '6px 14px', borderRadius: 8, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', color: '#ef4444', fontWeight: 700 }}>
              <i className="fa fa-exclamation-circle" />User is banned
            </div>
          )}

          {/* ── ACTIONS DROPDOWN MENU (☰) ── */}
          {showAct && (
            <div style={{ margin: '6px 12px', background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <ActionBtn icon="fa-solid fa-hand-lizard" label="Whisper" color="#7c3aed" onClick={() => { onWhisper?.({ ...user, userId: uid }); onClose() }} />
              <ActionBtn icon="fa-solid fa-gift" label="Send Gift" color="#ec4899" onClick={() => { onGift?.(user); onClose() }} />
              <ActionBtn icon="fa-solid fa-wallet" label="Share Wallet" color="#fbbf24" onClick={() => { setWallet(true); setShowAct(false) }} />
              <ActionBtn icon="fa-solid fa-user-plus" label="Add Friend" color="#22c55e" onClick={doAddFriend} />
              <ActionBtn icon="fa-solid fa-user-slash" label={ignored ? '✓ Ignored' : 'Ignore'} color="#6b7280" onClick={handleIgnore} disabled={ignored} />
              <ActionBtn icon="fa-solid fa-flag" label="Report" color="#ef4444" onClick={() => { setReport(true); setShowAct(false) }} />
              {canAct && <ActionBtn icon="fa-solid fa-user-shield" label="Staff Actions" color="#f59e0b" onClick={() => { setShowStaff(true); setShowAct(false) }} />}
            </div>
          )}

          {/* ── TAB MENU ── */}
          <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${T.border}`, marginTop: 6, scrollbarWidth: 'none', background: T.bg2 }}>
            {TABS.map(t => <TabBtn key={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />)}
          </div>

          {/* ── TAB CONTENT ── */}
          <div style={{ padding: '14px 18px', minHeight: 140, maxHeight: '50vh', overflowY: 'auto', scrollbarWidth: 'thin' }}>

            {/* Bio tab */}
            {tab === 'bio' && (
              <div>
                {/* Age from DOB */}
                {(user.dob || user.dateOfBirth) && <ProItem icon="fa-calendar" label="Age" value={`${Math.floor((Date.now() - new Date(user.dob || user.dateOfBirth)) / 31557600000)} years`} />}
                {!(user.dob || user.dateOfBirth) && user.age && <ProItem icon="fa-calendar" label="Age" value={`${user.age} years`} />}
                {user.gender   && <ProItem icon="fa-venus-mars"  label="Gender"     value={GENDER_LABELS[user.gender] || user.gender} />}
                {user.country  && <ProItem icon="fa-globe"       label="Country"    value={COUNTRY_NAMES[user.country] || user.country} />}
                {user.language && <ProItem icon="fa-language"    label="Language"   value={user.language} />}
                <ProItem icon="fa-user"        label="Joined"     value={longDate(user.createdAt || user.joinedAt)} />
                {/* Zodiac from DOB */}
                {(user.dob || user.dateOfBirth) && <ProItem icon="fa-star" label="Zodiac" value={getZodiac(user.dob || user.dateOfBirth)} />}
                {user.relationshipStatus && <ProItem icon="fa-heart" label="Relationship" value={user.relationshipStatus} />}
                <ProItem icon="fa-home" label="Current Room" value={user.currentRoom || '—'} />
                {user.lastSeen && <ProItem icon="fa-eye" label="Last Seen" value={new Date(user.lastSeen).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:false })} />}
                <BadgeRow user={user} />
              </div>
            )}

            {/* About tab */}
            {tab === 'about' && user.about && (
              <div style={{ fontSize: '0.84rem', color: T.text, lineHeight: 1.6, wordBreak: 'break-word' }}>{user.about}</div>
            )}

            {/* Friends tab */}
            {tab === 'friends' && (
              <div>
                {friends === null ? (
                  <Spinner />
                ) : friends.length === 0 ? (
                  <EmptyState icon="fa-users" text="No friends to show" />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 8 }}>
                    {friends.map((f, i) => (
                      <div key={i} style={{ textAlign: 'center', cursor: 'pointer' }}>
                        <img src={f.avatar || '/default_images/avatar/default_guest.png'} alt={f.username} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GBR(f.gender, f.rank)}`, display: 'block', margin: '0 auto 3px' }} onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }} />
                        <div style={{ fontSize: '0.65rem', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 66 }}>{f.username}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Gifts tab */}
            {tab === 'gifts' && (
              <div>
                {gifts === null ? (
                  <Spinner />
                ) : gifts.length === 0 ? (
                  <EmptyState icon="fa-gift" text="No gifts yet" />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {gifts.map((g, i) => (
                      <div key={i} style={{ textAlign: 'center', background: T.bg2, borderRadius: 9, padding: '7px 10px', border: `1px solid ${T.border}` }}>
                        <img src={g.icon ? `/gifts/${g.icon}` : '/default_images/icons/gift.svg'} alt={g.name} style={{ width: 32, height: 32, objectFit: 'contain' }} onError={e => { e.target.src = '/default_images/icons/gift.svg' }} />
                        <div style={{ fontSize: '0.6rem', color: T.muted, marginTop: 2 }}>{g.name}</div>
                        {g.count > 1 && <div style={{ fontSize: '0.58rem', color: '#fbbf24', fontWeight: 700 }}>×{g.count}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* More tab (staff only) */}
            {tab === 'more' && isStaff && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: T.bg2, borderRadius: 10, overflow: 'hidden' }}>
                <ActionBtn icon="fa-wallet"       label="Wallet History"  color="#fbbf24" onClick={() => {}} />
                <ActionBtn icon="fa-hourglass"    label="Login History"   color="#60a5fa" onClick={() => {}} />
                <ActionBtn icon="fa-file-text"    label="Staff Note"      color="#a78bfa" onClick={() => {}} />
                <ActionBtn icon="fa-globe"        label="Whois / IP"      color="#22c55e" onClick={() => {}} />
              </div>
            )}
          </div>
        </div>
      </div>

      {showReport && <ReportModal targetUser={user} onClose={() => setReport(false)} />}
      {showStaff  && <StaffActionModal targetUser={user} myLevel={myLevel} socket={socket} roomId={roomId} onClose={() => setShowStaff(false)} />}
      {showWallet && <ShareWalletModal targetUser={user} onClose={() => setWallet(false)} socket={socket} />}
    </>
  )
}

// ── Cover top-right icon button ────────────────────────────────
function CoverBtn({ icon, onClick, title, active }) {
  return (
    <button onClick={onClick} title={title}
      style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: active ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.45)', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',  flexShrink: 0, transition: 'background .12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.22)'}
      onMouseLeave={e => e.currentTarget.style.background = active ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.45)'}
    >
      <i className={`fa ${icon}`} />
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// SELF PROFILE OVERLAY (my own profile)
// ═══════════════════════════════════════════════════════════════
export function SelfProfileOverlay({ user, onClose, onUpdated }) {
  const ri  = R(user?.rank)
  const bdr = GBR(user?.gender, user?.rank)

  const [tab,      setTab]      = useState('bio')
  const [mood,     setMood]     = useState(user?.mood   || '')
  const [about,    setAbout]    = useState(user?.about  || '')
  const [email,    setEmail]    = useState(user?.email  || '')
  const [pw,       setPw]       = useState('')
  const [relStatus,setRel]      = useState(user?.relationshipStatus || '')
  const [friends,  setFriends]  = useState(null)
  const [blocks,   setBlocks]   = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [ok,       setOk]       = useState('')
  const [err,      setErr]       = useState('')
  const [showDelModal, setDel]  = useState(false)
  const [delPw,    setDelPw]    = useState('')
  const [privacy,  setPrivacy]  = useState(user?.privacy || {})
  const [prefs,    setPrefs]    = useState(user?.preferences || {})

  const RELS = ['Single','In a Relationship','Married','Complicated','Divorced','Widowed','Prefer not to say']
  const nameColor = resolveNameColor(user?.nameColor, '')

  async function save(field, value) {
    setSaving(true); setOk(''); setErr('')
    try {
      const r = await fetch(`${API}/api/users/me`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify({ [field]: value }) })
      const d = await r.json()
      if (r.ok) { setOk('Saved!'); onUpdated?.(d.user); setTimeout(() => setOk(''), 2200) }
      else setErr(d.error || 'Failed')
    } catch { setErr('Network error') }
    setSaving(false)
  }

  async function saveMany(obj) {
    setSaving(true); setOk(''); setErr('')
    try {
      const r = await fetch(`${API}/api/users/me`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify(obj) })
      const d = await r.json()
      if (r.ok) { setOk('Saved!'); onUpdated?.(d.user); setTimeout(() => setOk(''), 2200) }
      else setErr(d.error || 'Failed')
    } catch { setErr('Network error') }
    setSaving(false)
  }

  async function uploadAvatar(file) {
    setSaving(true)
    const fd = new FormData(); fd.append('avatar', file)
    try {
      const r = await fetch(`${API}/api/upload/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}` }, body: fd })
      const d = await r.json()
      if (r.ok && d.url) { onUpdated?.({ ...user, avatar: d.url }); setOk('Avatar updated!'); setTimeout(() => setOk(''), 2500) }
    } catch {}
    setSaving(false)
  }

  async function uploadCover(file) {
    setSaving(true)
    const fd = new FormData(); fd.append('cover', file)
    try {
      const r = await fetch(`${API}/api/upload/cover`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}` }, body: fd })
      const d = await r.json()
      if (r.ok && d.url) { onUpdated?.({ ...user, coverImage: d.url }); setOk('Cover updated!'); setTimeout(() => setOk(''), 2500) }
    } catch {}
    setSaving(false)
  }

  async function loadFriends() {
    if (friends !== null) return
    const r = await fetch(`${API}/api/users/me/friends`, { headers: { Authorization: `Bearer ${tok()}` } }).catch(() => null)
    if (r) { const d = await r.json(); setFriends(d.friends || []) }
  }

  async function loadBlocks() {
    if (blocks !== null) return
    const r = await fetch(`${API}/api/users/me/ignored`, { headers: { Authorization: `Bearer ${tok()}` } }).catch(() => null)
    if (r) { const d = await r.json(); setBlocks(d.ignoredUsers || []) }
  }

  async function removeFriend(uid) {
    await fetch(`${API}/api/users/friend/${uid}/remove`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } }).catch(() => {})
    setFriends(p => (p||[]).filter(f => String(f._id) !== String(uid)))
  }

  async function unblock(uid) {
    await fetch(`${API}/api/users/ignore/${uid}`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}` } }).catch(() => {})
    setBlocks(p => (p||[]).filter(b => String(b._id) !== String(uid)))
  }

  async function requestDelete() {
    if (!delPw.trim()) return
    setSaving(true)
    try {
      const r = await fetch(`${API}/api/users/me/request-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify({ password: delPw }) })
      const d = await r.json()
      if (r.ok) { setOk('Account scheduled for deletion in 3 days. Check profile to cancel.'); setDel(false); onUpdated?.({ ...user, pendingDelete: true }) }
      else setErr(d.error || 'Wrong password')
    } catch { setErr('Network error') }
    setSaving(false)
  }

  async function cancelDelete() {
    await fetch(`${API}/api/users/me/cancel-delete`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}` } }).catch(() => {})
    onUpdated?.({ ...user, pendingDelete: false }); setOk('Account deletion cancelled!')
  }

  function togglePrivacy(key) {
    const updated = { ...privacy, [key]: !privacy[key] }
    setPrivacy(updated); saveMany({ privacy: updated })
  }
  function togglePref(key) {
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated); saveMany({ preferences: updated })
  }

  const TABS = [
    { id: 'bio',     label: 'Bio' },
    { id: 'edit',    label: 'Edit' },
    { id: 'friends', label: 'Friends' },
    { id: 'more',    label: 'More' },
  ]

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '28px 12px 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16, width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 20px 64px rgba(0,0,0,.7)', marginBottom: 20 }}>

        {/* Cover */}
        <div style={{ height: 96, position: 'relative', background: `linear-gradient(135deg, ${ri.color}66, #0a0a15 80%)`, overflow: 'hidden' }}>
          {user?.coverImage && <img src={user.coverImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.15) 0%, rgba(0,0,0,.6) 100%)' }} />
          {/* Cover change button */}
          <label style={{ position: 'absolute', bottom: 6, left: 8, cursor: 'pointer', background: 'rgba(0,0,0,.5)', borderRadius: 7, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4, zIndex: 2 }}>
            <i className="fa fa-camera" style={{ fontSize: 10, color: '#fff' }} />
            <span style={{ fontSize: '0.62rem', color: '#fff', fontWeight: 600 }}>Change Cover</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) uploadCover(f); e.target.value = '' }} />
          </label>
          <div style={{ position: 'absolute', top: 7, right: 8, display: 'flex', gap: 4, zIndex: 2 }}>
            <CoverBtn icon="fa-times" onClick={onClose} title="Close" />
          </div>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: -36, position: 'relative', zIndex: 3 }}>
          <label style={{ cursor: 'pointer', position: 'relative', display: 'block' }}>
            <img src={user?.avatar || '/default_images/avatar/default_guest.png'} alt=""
              style={{ width: 72, height: 72, borderRadius: '50%', border: `3px solid ${bdr}`, objectFit: 'cover', background: T.bg, boxShadow: '0 4px 16px rgba(0,0,0,.5)', display: 'block' }}
              onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }} />
            <div style={{ position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${T.bg}` }}>
              <i className="fa fa-camera" style={{ fontSize: 8, color: '#fff' }} />
            </div>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) uploadAvatar(f); e.target.value = '' }} />
          </label>
        </div>

        {/* Name */}
        <div style={{ textAlign: 'center', padding: '6px 16px 2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 1 }}>
            <RIcon rank={user?.rank} size={14} />
            <span style={{ fontSize: '0.65rem', color: ri.color, fontWeight: 700 }}>{ri.label}</span>
          </div>
          <div style={{ fontWeight: 900, fontSize: '1rem', color: nameColor || T.text, fontFamily: 'Outfit, sans-serif' }}>{user?.username}</div>
          {user?.mood && <div style={{ fontSize: '0.75rem', color: T.muted, fontStyle: 'italic' }}>"{user.mood}"</div>}
        </div>

        {/* Pending delete banner */}
        {user?.pendingDelete && (
          <div style={{ margin: '8px 14px', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 9, border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa fa-trash" style={{ color: '#ef4444' }} />
            <div style={{ flex: 1, fontSize: '0.75rem', color: '#ef4444' }}>Account scheduled for deletion.</div>
            <button onClick={cancelDelete} style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: '#22c55e', color: '#fff', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', padding: '8px 14px 0', gap: 6 }}>
          {[
            { l: 'Level', v: user?.level || 1, c: '#60a5fa' },
            { l: 'Gold',  v: (user?.gold  || 0).toLocaleString(), c: '#fbbf24' },
            { l: 'XP',    v: (user?.xp    || 0).toLocaleString(), c: '#a78bfa' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center', background: T.bg2, borderRadius: 8, padding: '5px 10px', border: `1px solid ${T.border}`, flex: 1 }}>
              <div style={{ fontSize: '0.55rem', color: T.muted, textTransform: 'uppercase', letterSpacing: .5 }}>{s.l}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginTop: 10, background: T.bg2, overflowX: 'auto' }}>
          {TABS.map(t => <TabBtn key={t.id} label={t.label} active={tab === t.id} onClick={() => { setTab(t.id); if(t.id==='friends') loadFriends(); if(t.id==='more') { loadFriends(); loadBlocks(); } }} />)}
        </div>

        {/* Content */}
        <div style={{ padding: '12px 16px 18px', maxHeight: '50vh', overflowY: 'auto', scrollbarWidth: 'thin' }}>
          {ok  && <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', color: '#22c55e', marginBottom: 10, textAlign: 'center' }}>{ok}</div>}
          {err && <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', color: '#ef4444', marginBottom: 10, textAlign: 'center' }}>{err}</div>}

          {/* BIO */}
          {tab === 'bio' && (
            <div>
              {(user?.dob||user?.dateOfBirth)&&<ProItem icon="fa-calendar" label="Age" value={`${Math.floor((Date.now()-new Date(user.dob||user.dateOfBirth))/31557600000)} years`}/>}
              {!(user?.dob||user?.dateOfBirth)&&user?.age&&<ProItem icon="fa-calendar" label="Age" value={`${user.age} years`}/>}
              {user?.gender      && <ProItem icon="fa-venus-mars" label="Gender"       value={GENDER_LABELS[user.gender]||user.gender} />}
              {user?.country     && <ProItem icon="fa-globe"      label="Country"      value={COUNTRY_NAMES[user.country]||user.country} />}
              {user?.language    && <ProItem icon="fa-language"   label="Language"     value={user.language} />}
              {user?.relationshipStatus && <ProItem icon="fa-heart" label="Relationship" value={user.relationshipStatus} />}
              <ProItem icon="fa-user"    label="Joined"       value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) : '—'} />
              {(user?.dob||user?.dateOfBirth) && <ProItem icon="fa-star" label="Zodiac" value={getZodiac(user.dob||user.dateOfBirth)} />}
              <BadgeRow user={user} />
            </div>
          )}

          {/* EDIT */}
          {tab === 'edit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Mood */}
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Mood <span style={{ color: '#555' }}>(max 10 words)</span></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <SInput value={mood} onChange={e => { const w=e.target.value.split(' '); if(w.length<=10) setMood(e.target.value) }} placeholder="What's on your mind?" style={{ flex: 1 }} />
                  <button onClick={() => save('mood', mood)} disabled={saving} style={{ padding: '9px 12px', borderRadius: 9, border: 'none', background: T.accent, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', flexShrink: 0 }}>Save</button>
                </div>
              </div>
              {/* Relationship */}
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Relationship Status</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select value={relStatus} onChange={e => setRel(e.target.value)} style={{ flex: 1, padding: '9px 10px', background: T.bg2, border: `1.5px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: '0.82rem', outline: 'none' }}>
                    <option value="">— Select —</option>
                    {RELS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={() => save('relationshipStatus', relStatus)} disabled={saving} style={{ padding: '9px 12px', borderRadius: 9, border: 'none', background: T.accent, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', flexShrink: 0 }}>Save</button>
                </div>
              </div>
              {/* About */}
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>About Me</div>
                <SInput value={about} onChange={e => setAbout(e.target.value)} placeholder="Tell others about yourself…" rows={3} />
                <button onClick={() => save('about', about)} disabled={saving} style={{ marginTop: 6, padding: '8px', borderRadius: 9, border: 'none', background: T.accent, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', width: '100%' }}>Save About</button>
              </div>
              {/* Email */}
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Email</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <SInput value={email} onChange={e => setEmail(e.target.value)} placeholder="New email address" style={{ flex: 1 }} />
                  <button onClick={() => save('email', email)} disabled={saving||!email} style={{ padding: '9px 12px', borderRadius: 9, border: 'none', background: email ? T.accent : T.bg3, color: email ? '#fff' : T.muted, fontWeight: 700, cursor: email ? 'pointer' : 'not-allowed', fontSize: '0.78rem', flexShrink: 0 }}>Save</button>
                </div>
              </div>
              {/* Password */}
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>New Password</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <SInput value={pw} onChange={e => setPw(e.target.value)} placeholder="New password (min 6 chars)" style={{ flex: 1 }} />
                  <button onClick={() => save('password', pw)} disabled={saving||pw.length<6} style={{ padding: '9px 12px', borderRadius: 9, border: 'none', background: pw.length>=6 ? T.accent : T.bg3, color: pw.length>=6 ? '#fff' : T.muted, fontWeight: 700, cursor: pw.length>=6 ? 'pointer' : 'not-allowed', fontSize: '0.78rem', flexShrink: 0 }}>Save</button>
                </div>
              </div>
              {/* Privacy section */}
              <div style={{ background: T.bg2, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: .7, marginBottom: 8 }}>Privacy</div>
                {[
                  { key: 'hideAge',      label: 'Hide Age' },
                  { key: 'hideGender',   label: 'Hide Gender' },
                  { key: 'hideLocation', label: 'Hide Country Flag' },
                  { key: 'hideFriends',  label: 'Hide Friend List' },
                  { key: 'hideGifts',    label: 'Hide Gifts' },
                ].map(p => (
                  <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: '0.78rem', color: T.text }}>{p.label}</span>
                    <button onClick={() => togglePrivacy(p.key)} style={{ width: 40, height: 22, borderRadius: 20, border: 'none', cursor: 'pointer', background: privacy[p.key] ? T.accent : T.bg3, position: 'relative', transition: 'all .2s' }}>
                      <span style={{ position: 'absolute', top: 2, left: privacy[p.key] ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }} />
                    </button>
                  </div>
                ))}
              </div>
              {/* Preferences */}
              <div style={{ background: T.bg2, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: .7, marginBottom: 8 }}>Preferences</div>
                {[
                  { key: 'allowFriendReq', label: 'Allow Friend Requests' },
                  { key: 'allowPrivateMsg', label: 'Allow Private Messages' },
                  { key: 'allowCalls',      label: 'Allow Calls' },
                ].map(p => (
                  <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: '0.78rem', color: T.text }}>{p.label}</span>
                    <button onClick={() => togglePref(p.key)} style={{ width: 40, height: 22, borderRadius: 20, border: 'none', cursor: 'pointer', background: prefs[p.key] !== false ? T.accent : T.bg3, position: 'relative', transition: 'all .2s' }}>
                      <span style={{ position: 'absolute', top: 2, left: prefs[p.key] !== false ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }} />
                    </button>
                  </div>
                ))}
              </div>
              {/* Delete account */}
              <div style={{ marginTop: 4 }}>
                {user?.pendingDelete ? (
                  <button onClick={cancelDelete} style={{ width: '100%', padding: '9px', borderRadius: 9, border: '1px solid #22c55e', background: 'rgba(34,197,94,0.08)', color: '#22c55e', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                    <i className="fa fa-rotate-left" style={{ marginRight: 6 }} />Cancel Account Deletion
                  </button>
                ) : (
                  <button onClick={() => setDel(true)} style={{ width: '100%', padding: '9px', borderRadius: 9, border: '1px solid rgba(239,68,68,.4)', background: 'rgba(239,68,68,.06)', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                    <i className="fa fa-trash" style={{ marginRight: 6 }} />Delete Account
                  </button>
                )}
              </div>
            </div>
          )}

          {/* FRIENDS */}
          {tab === 'friends' && (
            <div>
              {friends === null && <p style={{ textAlign: 'center', color: T.muted, fontSize: '0.78rem' }}>Loading...</p>}
              {friends !== null && friends.length === 0 && <p style={{ textAlign: 'center', color: T.muted, fontSize: '0.78rem', padding: 16 }}>No friends yet</p>}
              {(friends||[]).map(f => (
                <div key={f._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
                  <img src={f.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${GBR(f.gender,f.rank)}` }} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}><RIcon rank={f.rank} size={11} /><span style={{ fontSize: '0.8rem', fontWeight: 700, color: R(f.rank).color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.username}</span></div>
                    <div style={{ fontSize: '0.62rem', color: f.isOnline ? '#22c55e' : T.muted }}>{f.isOnline ? 'Online' : 'Offline'}</div>
                  </div>
                  <button onClick={() => removeFriend(f._id)} style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(239,68,68,.35)', background: 'rgba(239,68,68,.08)', color: '#ef4444', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {/* MORE — manage blocks */}
          {tab === 'more' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: .7, marginBottom: 8 }}>Blocked Users</div>
                {blocks === null && <p style={{ color: T.muted, fontSize: '0.78rem' }}>Loading...</p>}
                {blocks !== null && blocks.length === 0 && <p style={{ color: T.muted, fontSize: '0.78rem' }}>No blocked users</p>}
                {(blocks||[]).map(b => (
                  <div key={b._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                    <img src={b.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
                    <span style={{ flex: 1, fontSize: '0.8rem', color: T.text }}>{b.username}</span>
                    <button onClick={() => unblock(b._id)} style={{ padding: '3px 9px', borderRadius: 7, border: '1px solid rgba(34,197,94,.35)', background: 'rgba(34,197,94,.08)', color: '#22c55e', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>Unblock</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDelModal && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: T.bg, borderRadius: 14, border: '1px solid rgba(239,68,68,.3)', maxWidth: 360, width: '100%', padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ef4444', marginBottom: 10 }}><i className="fa fa-trash" style={{ marginRight: 7 }} />Delete Account</div>
            <p style={{ fontSize: '0.8rem', color: T.muted, marginBottom: 12 }}>Your account will be permanently deleted after 3 days. Enter your password to confirm.</p>
            <SInput value={delPw} onChange={e => setDelPw(e.target.value)} placeholder="Enter your password" style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDel(false)} style={{ flex: 1, padding: '9px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'none', color: T.muted, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={requestDelete} disabled={saving || !delPw.trim()} style={{ flex: 2, padding: '9px', borderRadius: 9, border: 'none', background: delPw.trim() ? '#ef4444' : T.bg3, color: '#fff', fontWeight: 700, cursor: delPw.trim() ? 'pointer' : 'not-allowed' }}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function MiniCard({ user, myId, myLevel, pos, socket, roomId, ignoredUsers, onIgnore, onClose, onFull, onGift, tObj, liveCamUsers, onWhisper, onReport }) {
  const [showStaff, setShowStaff] = useState(false)
  const [ignored,   setIgnored]   = useState(() => (ignoredUsers || new Set()).has(user._id || user.userId))

  const ri    = R(user.rank)
  const bdr   = GBR(user.gender, user.rank)
  const isMe  = user._id === myId || user.userId === myId
  const canAct = myLevel >= 11 && RL(user.rank) < myLevel && !isMe
  const uid   = user._id || user.userId
  const isLive = liveCamUsers?.includes(uid) || user.isCamHost

  // Theme sync
  const BG  = tObj?.bg_header || T.bg
  const ACC = tObj?.accent || T.accent
  const BD  = `${tObj?.default_color || '#334155'}55`

  // Position anchor: near click, keep in viewport
  const CARD_W = 210, CARD_H = isMe ? 160 : 250
  const W = window.innerWidth, H = window.innerHeight
  const cx = Math.min(Math.max((pos?.x || 80), 4), W - CARD_W - 4)
  const cy = Math.min(Math.max((pos?.y || 80) + 4, 56), H - CARD_H - 10)

  function doFriend() {
    fetch(`${API}/api/users/friend/${uid}`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}` } }).catch(() => {})
    onClose()
  }
  function doIgnore() { if (ignored) return; setIgnored(true); onIgnore?.(uid); onClose() }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 8000 }} />
      <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: cy, left: cx, width: CARD_W, zIndex: 8001, background: BG, border: `1px solid ${BD}`, borderRadius: 13, boxShadow: '0 8px 36px rgba(0,0,0,.55)', overflow: 'hidden' }}>

        {/* Mini cover banner */}
        <div style={{ height: 42, background: `linear-gradient(135deg,${ri.color}55,${BG})`, position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 5, right: 6, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,.4)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa fa-times" /></button>
        </div>

        {/* Avatar overlapping */}
        <div style={{ padding: '0 10px', marginTop: -22, display: 'flex', alignItems: 'flex-end', gap: 7, marginBottom: 5, position: 'relative', zIndex: 2 }}>
          <img src={user.avatar || '/default_images/avatar/default_guest.png'} alt=""
            style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${bdr}`, objectFit: 'cover', background: '#fff', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,.3)' }}
            onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }} />
        </div>

        {/* Name + rank */}
        <div style={{ padding: '0 10px 6px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.84rem', color: resolveNameColor(user.nameColor, ri.color) || T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
            <RIcon rank={user.rank} size={11} />
            <span style={{ fontSize: '0.62rem', color: ri.color, fontWeight: 700 }}>{ri.label}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ padding: '0 7px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {isMe ? (
            <>
              <MCBtn icon="fa-solid fa-circle-user"    label="View Profile"  color={ACC} onClick={() => { onFull?.(); onClose() }} />
              <MCBtn icon="fa-regular fa-pen-to-square" label="Edit Profile" color={T.muted} onClick={() => { onFull?.(); onClose() }} />
            </>
          ) : (
            <>
              <MCBtn icon="fa-solid fa-circle-user"  label="View Profile" color={ACC} onClick={() => { onFull?.(); onClose() }} />
              <MCBtn icon="fa-solid fa-user-plus"    label="Add Friend"   color="#22c55e" onClick={doFriend} />
              {isLive && <MCBtn icon="fa-solid fa-video" label="View Cam" color="#ef4444" onClick={onClose} badge="LIVE" />}
              <MCBtn icon="fa-solid fa-hand-lizard"  label="Whisper"      color="#7c3aed" onClick={() => { onWhisper?.({ ...user, userId: uid }); onClose() }} />
              <MCBtn icon="fa-solid fa-gift"         label="Send Gift"    color="#ec4899" onClick={() => { onGift?.(user); onClose() }} />
              <MCBtn icon="fa-solid fa-user-slash"   label={ignored ? '✓ Ignored' : 'Ignore'} color={T.muted} onClick={doIgnore} disabled={ignored} />
              {canAct && (
                <MCBtn icon="fa-solid fa-user-shield" label="Actions" color="#f59e0b" onClick={() => setShowStaff(true)} />
              )}
            </>
          )}
        </div>
      </div>

      {showStaff && <StaffActionModal targetUser={user} myLevel={myLevel} socket={socket} roomId={roomId} onClose={() => setShowStaff(false)} />}
    </>
  )
}

// mini card button
function MCBtn({ icon, label, color, onClick, badge, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.74rem', fontWeight: 600, color: color || T.muted, width: '100%', textAlign: 'left', transition: 'all .12s', opacity: disabled ? 0.45 : 1 }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.borderColor = `${color}40` } }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
    >
      <i className={icon} style={{ fontSize: 11, flexShrink: 0, width: 13, textAlign: 'center' }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.5rem', fontWeight: 800, padding: '1px 5px', borderRadius: 5 }}>{badge}</span>}
    </button>
  )
}

// ── Spinner ────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
      <div style={{ width: 26, height: 26, border: `3px solid ${T.border}`, borderTop: `3px solid ${T.accent}`, borderRadius: '50%', animation: 'cgzSpin .7s linear infinite' }} />
      <style>{`@keyframes cgzSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: T.muted, fontSize: '0.8rem' }}>
      <i className={`fa ${icon}`} style={{ fontSize: 22, opacity: 0.35, display: 'block', marginBottom: 8 }} />{text}
    </div>
  )
}

// named exports for ChatRoom.jsx
export { ReportModal, StaffActionModal }
