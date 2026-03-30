import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { API_URL } from '../constants.js'

const API = API_URL

const RANKS = {
  guest:      { label:'Guest',      color:'#888888', level:1  },
  user:       { label:'User',       color:'#aaaaaa', level:2  },
  vipfemale:  { label:'VIP Female', color:'#FF4488', level:3  },
  vipmale:    { label:'VIP Male',   color:'#4488FF', level:4  },
  butterfly:  { label:'Butterfly',  color:'#FF66AA', level:5  },
  ninja:      { label:'Ninja',      color:'#777777', level:6  },
  fairy:      { label:'Fairy',      color:'#FF88CC', level:7  },
  legend:     { label:'Legend',     color:'#FF8800', level:8  },
  bot:        { label:'Bot',        color:'#00cc88', level:9  },
  premium:    { label:'Premium',    color:'#aa44ff', level:10 },
  moderator:  { label:'Moderator',  color:'#00AAFF', level:11 },
  admin:      { label:'Admin',      color:'#FF4444', level:12 },
  superadmin: { label:'Superadmin', color:'#FF00FF', level:13 },
  owner:      { label:'Owner',      color:'#FFD700', level:14 },
}

function Avatar({ src, username, size = 80 }) {
  const [err, setErr] = useState(false)
  return (
    <img
      src={err ? '/default_images/avatar/default_avatar.png' : (src || '/default_images/avatar/default_avatar.png')}
      alt={username}
      onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e4e6ea' }}
    />
  )
}

function StatBox({ label, value }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 16px', background: '#f8f9fa', borderRadius: 10 }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a73e8', fontFamily: 'Outfit,sans-serif' }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function Profile() {
  const { username } = useParams()
  const nav = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!username) return
    setLoading(true)
    setError('')
    const token = localStorage.getItem('cgz_token')
    fetch(`${API}/api/users/profile/${username}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(d => {
        if (d.user) setProfile(d.user)
        else setError(d.error || 'User not found')
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e4e6ea', borderTop: '3px solid #1a73e8', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#f8f9fa', padding: 16 }}>
      <div style={{ fontSize: 40 }}>😕</div>
      <p style={{ color: '#374151', fontWeight: 600 }}>{error}</p>
      <button onClick={() => nav(-1)} style={{ padding: '10px 22px', borderRadius: 9, border: 'none', background: '#1a73e8', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Go Back</button>
    </div>
  )

  const rank = RANKS[profile?.rank] || RANKS.guest

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'Nunito, sans-serif' }}>
      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e4e6ea', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 20, display: 'flex', alignItems: 'center' }}>
          <i className="fi fi-sr-angle-left" />
        </button>
        <span style={{ fontWeight: 700, color: '#111827', fontFamily: 'Outfit,sans-serif' }}>Profile</span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
        {/* Profile card */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.07)', overflow: 'hidden', marginBottom: 16 }}>
          {/* Banner */}
          <div style={{ height: 80, background: 'linear-gradient(135deg, #1a73e8, #7c3aed)' }} />
          {/* Avatar + info */}
          <div style={{ padding: '0 20px 20px', position: 'relative' }}>
            <div style={{ marginTop: -40, marginBottom: 12 }}>
              <Avatar src={profile?.avatar} username={profile?.username} size={80} />
            </div>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.25rem', color: '#111827' }}>
              {profile?.username}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: rank.color, background: rank.color + '18', padding: '2px 8px', borderRadius: 20 }}>
                {rank.label}
              </span>
              {profile?.isVerified && (
                <span style={{ fontSize: '0.78rem', color: '#1a73e8' }}>✓ Verified</span>
              )}
            </div>
            {profile?.bio && (
              <p style={{ marginTop: 10, fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.07)', padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, color: '#111827', marginBottom: 12, fontFamily: 'Outfit,sans-serif' }}>Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <StatBox label="Gold" value={profile?.gold ?? 0} />
            <StatBox label="XP" value={profile?.xp ?? 0} />
            <StatBox label="Messages" value={profile?.messageCount ?? 0} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/chat" style={{ flex: 1, display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10, background: '#1a73e8', color: '#fff', fontWeight: 700, textDecoration: 'none', fontFamily: 'Outfit,sans-serif' }}>
            💬 Go to Chat
          </Link>
        </div>
      </div>
    </div>
  )
}
