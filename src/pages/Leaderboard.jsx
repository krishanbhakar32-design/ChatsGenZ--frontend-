import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../siteConfig.js'
import { RANKS } from '../constants.js'

const API = API_URL

const TABS = [
  { key: 'xp',       label: '⚡ XP',        color: '#8b5cf6', field: 'xp' },
  { key: 'level',    label: '🏆 Level',     color: '#f59e0b', field: 'level' },
  { key: 'gold',     label: '💰 Gold',      color: '#eab308', field: 'gold' },
  { key: 'gifts',    label: '🎁 Gifts',     color: '#ec4899', field: 'totalGiftsReceived' },
  { key: 'messages', label: '💬 Messages',  color: '#22c55e', field: 'totalMessages' },
]
const PERIODS = [
  { key: 'all',     label: 'All Time' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'weekly',  label: 'Weekly' },
]

function Avatar({ src, username, size = 40 }) {
  const [err, setErr] = useState(false)
  return (
    <img
      src={err ? '/default_images/avatar/default_avatar.png' : (src || '/default_images/avatar/default_avatar.png')}
      alt={username}
      onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  )
}

function RankBadge({ rank }) {
  const info = RANKS[rank] || RANKS.user
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99,
      background: info.color + '22', color: info.color, border: `1px solid ${info.color}44`
    }}>
      {info.label}
    </span>
  )
}

function Medal({ pos }) {
  if (pos === 1) return <span style={{ fontSize: 22 }}>🥇</span>
  if (pos === 2) return <span style={{ fontSize: 22 }}>🥈</span>
  if (pos === 3) return <span style={{ fontSize: 22 }}>🥉</span>
  return <span style={{ width: 28, textAlign: 'center', fontWeight: 800, color: '#9ca3af', fontSize: '0.85rem' }}>#{pos}</span>
}

function StatValue({ tab, user }) {
  const v = user[tab.field] || 0
  const fmt = n => n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n
  return (
    <span style={{ fontWeight: 800, color: tab.color, fontSize: '0.92rem', fontFamily: 'Outfit,sans-serif' }}>
      {fmt(v)}
    </span>
  )
}

export default function Leaderboard() {
  const [tab, setTab] = useState('xp')
  const [period, setPeriod] = useState('all')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState(null)
  const token = localStorage.getItem('cgz_token')
  const activeTab = TABS.find(t => t.key === tab)

  useEffect(() => {
    load()
  }, [tab, period])

  useEffect(() => {
    if (!token) return
    fetch(`${API}/api/leaderboard/rank/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMyRank(d)).catch(() => {})
  }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/leaderboard/${tab}?period=${period}&limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const d = await r.json()
      setUsers(d.users || [])
    } catch { setUsers([]) }
    setLoading(false)
  }

  const top3 = users.slice(0, 3)
  const rest = users.slice(3)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)', fontFamily: 'Nunito,sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/chat" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>←</Link>
        <div>
          <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.15rem', color: '#fff' }}>🏆 Leaderboard</div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Top players ranked by stats</div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 12px' }}>

        {/* My Rank Card */}
        {myRank && (
          <div style={{ background: 'linear-gradient(135deg,#7c3aed22,#1a73e822)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#c4b5fd', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>📊 My Rankings</span>
            {[
              { label: 'XP Rank', val: `#${myRank.xpRank}` },
              { label: 'Gold Rank', val: `#${myRank.goldRank}` },
              { label: 'Msg Rank', val: `#${myRank.msgRank}` },
              { label: 'Level', val: myRank.user?.level },
            ].map(r => (
              <div key={r.label} style={{ textAlign: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', fontFamily: 'Outfit,sans-serif' }}>{r.val}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.62rem' }}>{r.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab selector */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '7px 14px', borderRadius: 99, border: `1.5px solid ${tab === t.key ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: tab === t.key ? t.color + '22' : 'transparent',
                color: tab === t.key ? t.color : '#94a3b8',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', fontFamily: 'Outfit,sans-serif',
                transition: 'all .15s'
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              style={{
                padding: '5px 12px', borderRadius: 99,
                border: `1px solid ${period === p.key ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                background: period === p.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: period === p.key ? '#fff' : '#64748b',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', fontFamily: 'Nunito,sans-serif'
              }}>
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTop: `3px solid ${activeTab?.color}`, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading rankings...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ color: '#64748b' }}>No data yet for this period</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length >= 3 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: 'center', marginBottom: 24, padding: '0 4px' }}>
                {/* 2nd */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '12px 12px 0 0', padding: '16px 8px 12px', border: '1px solid rgba(255,255,255,0.1)', height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Avatar src={top3[1]?.avatar} username={top3[1]?.username} size={36} />
                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{top3[1]?.username}</div>
                    <StatValue tab={activeTab} user={top3[1]} />
                  </div>
                  <div style={{ background: 'linear-gradient(180deg,#c0c0c0,#a0a0a0)', padding: '8px 0', borderRadius: '0 0 8px 8px', textAlign: 'center', fontSize: 20 }}>🥈</div>
                </div>
                {/* 1st */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ background: `linear-gradient(135deg,${activeTab?.color}22,rgba(255,255,255,0.07))`, borderRadius: '12px 12px 0 0', padding: '16px 8px 12px', border: `1px solid ${activeTab?.color}44`, height: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar src={top3[0]?.avatar} username={top3[0]?.username} size={44} />
                      <span style={{ position: 'absolute', top: -8, right: -8, fontSize: 16 }}>👑</span>
                    </div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{top3[0]?.username}</div>
                    <StatValue tab={activeTab} user={top3[0]} />
                  </div>
                  <div style={{ background: `linear-gradient(180deg,${activeTab?.color},${activeTab?.color}aa)`, padding: '8px 0', borderRadius: '0 0 8px 8px', textAlign: 'center', fontSize: 20 }}>🥇</div>
                </div>
                {/* 3rd */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '12px 12px 0 0', padding: '16px 8px 12px', border: '1px solid rgba(255,255,255,0.1)', height: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Avatar src={top3[2]?.avatar} username={top3[2]?.username} size={32} />
                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{top3[2]?.username}</div>
                    <StatValue tab={activeTab} user={top3[2]} />
                  </div>
                  <div style={{ background: 'linear-gradient(180deg,#cd7f32,#a0522d)', padding: '8px 0', borderRadius: '0 0 8px 8px', textAlign: 'center', fontSize: 20 }}>🥉</div>
                </div>
              </div>
            )}

            {/* Rest of list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rest.map((user, i) => (
                <div key={user._id || i} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'background .15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                >
                  <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                    <Medal pos={i + 4} />
                  </div>
                  <Avatar src={user.avatar} username={user.username} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: user.nameColor || '#f1f5f9', fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Outfit,sans-serif' }}>
                      {user.flag && <span style={{ marginRight: 4 }}>{user.flag}</span>}
                      {user.username}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <RankBadge rank={user.rank} />
                      <span style={{ color: '#64748b', fontSize: '0.65rem' }}>Lv.{user.level}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <StatValue tab={activeTab} user={user} />
                    <div style={{ color: '#64748b', fontSize: '0.62rem', marginTop: 1 }}>{activeTab?.label?.split(' ')[1] || activeTab?.key}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
