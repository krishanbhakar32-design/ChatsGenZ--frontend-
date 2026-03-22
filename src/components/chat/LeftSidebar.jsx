/**
 * LeftSidebar.jsx
 * Icon rail + collapsible panel with: Rooms, Store, Leaderboard,
 * Username Change, Premium, Dice, Keno, YouTube.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DiceGame    from './DiceGame.jsx'
import KenoGame    from './KenoGame.jsx'
import YoutubePanel from './YoutubePanel.jsx'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ── Sub-panels ────────────────────────────────────────────────

function RoomListPanel() {
  const [rooms, setRooms] = useState([])
  const [load,  setLoad]  = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    const t = localStorage.getItem('cgz_token')
    fetch(`${API}/api/rooms`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => setRooms(d.rooms || []))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [])

  if (load) return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <div style={{ width: 22, height: 22, border: '2px solid #e4e6ea', borderTop: '2px solid #1a73e8', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} />
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {rooms.map(r => (
        <div
          key={r._id}
          onClick={() => nav(`/chat/${r._id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', transition: 'background .12s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <img
            src={r.icon || '/default_images/rooms/default_room.png'}
            alt=""
            style={{ width: 32, height: 32, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }}
            onError={e => (e.target.style.display = 'none')}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.83rem', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
            {r.description && <div style={{ fontSize: '0.7rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>}
            <div style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 600 }}>{r.currentUsers || 0} online</div>
          </div>
          <i className="fi fi-sr-angle-right" style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }} />
        </div>
      ))}
    </div>
  )
}

function StorePanel() {
  return (
    <div style={{ padding: 10, flex: 1, overflowY: 'auto' }}>
      <div style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'center' }}>
        <img src="/default_images/icons/gold.svg" alt="" style={{ width: 28, height: 28, margin: '0 auto 4px', display: 'block' }} onError={() => {}} />
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Buy Gold Coins</div>
      </div>
      {[{ g: 100, p: '₹10' }, { g: 500, p: '₹45' }, { g: 1000, p: '₹80' }, { g: 5000, p: '₹350' }].map(pack => (
        <button
          key={pack.g}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', background: '#f9fafb', border: '1px solid #e4e6ea', borderRadius: 8, cursor: 'pointer', marginBottom: 6, transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e8f0fe'; e.currentTarget.style.borderColor = '#1a73e8' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e4e6ea' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src="/default_images/icons/gold.svg" alt="" style={{ width: 16, height: 16 }} onError={() => {}} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>{pack.g} Gold</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a73e8' }}>{pack.p}</span>
        </button>
      ))}
    </div>
  )
}

function LeaderboardPanel() {
  const [data, setData] = useState([])
  const [type, setType] = useState('leader_xp')
  const [load, setLoad] = useState(false)

  // Fetch on type change
  useEffect(() => {
    setLoad(true)
    const t = localStorage.getItem('cgz_token')
    fetch(`${API}/api/leaderboard/${type}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => setData(d.users || []))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [type])

  const TYPES = [
    { id: 'leader_xp',    l: 'XP'    },
    { id: 'leader_level', l: 'Level' },
    { id: 'leader_gold',  l: 'Gold'  },
    { id: 'leader_gift',  l: 'Gifts' },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 4, padding: '8px 8px 4px', flexShrink: 0 }}>
        {TYPES.map(tp => (
          <button
            key={tp.id}
            onClick={() => setType(tp.id)}
            style={{ flex: 1, padding: '5px 4px', borderRadius: 6, border: `1.5px solid ${type === tp.id ? '#1a73e8' : '#e4e6ea'}`, background: type === tp.id ? '#e8f0fe' : 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: type === tp.id ? '#1a73e8' : '#6b7280' }}
          >
            {tp.l}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {load
          ? <div style={{ textAlign: 'center', padding: 16 }}><div style={{ width: 20, height: 20, border: '2px solid #e4e6ea', borderTop: '2px solid #1a73e8', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} /></div>
          : data.map((u, i) => (
              <div key={u._id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: i < 3 ? ['#f59e0b', '#9ca3af', '#d97706'][i] : '#9ca3af', width: 18, flexShrink: 0 }}>#{i + 1}</span>
                <img src={u.avatar || '/default_images/avatar/default_guest.png'} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => (e.target.src = '/default_images/avatar/default_guest.png')} />
                <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1a73e8' }}>{u.xp || u.level || u.gold || 0}</span>
              </div>
            ))
        }
      </div>
    </div>
  )
}

function UsernamePanel() {
  const [val, setVal] = useState('')
  const [msg, setMsg] = useState('')

  async function change() {
    const t = localStorage.getItem('cgz_token')
    const r = await fetch(`${API}/api/users/change-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ newUsername: val }),
    })
    const d = await r.json()
    setMsg(r.ok ? '✅ Changed!' : d.error || 'Failed')
  }

  return (
    <div style={{ padding: 14, flex: 1 }}>
      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 9, padding: '10px 12px', marginBottom: 12, fontSize: '0.8rem', color: '#92400e' }}>
        Username change costs <strong>500 Gold</strong>
      </div>
      {msg && (
        <div style={{ background: msg.startsWith('✅') ? '#d1fae5' : '#fee2e2', borderRadius: 7, padding: '7px 10px', fontSize: '0.78rem', color: msg.startsWith('✅') ? '#065f46' : '#dc2626', marginBottom: 10 }}>
          {msg}
        </div>
      )}
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="New username..."
        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6ea', borderRadius: 8, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', color: '#111827', background: '#f9fafb', marginBottom: 8, fontFamily: 'Nunito,sans-serif' }}
        onFocus={e => (e.target.style.borderColor = '#1a73e8')}
        onBlur={e => (e.target.style.borderColor = '#e4e6ea')}
      />
      <button
        onClick={change}
        style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1a73e8,#1464cc)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'Outfit,sans-serif' }}
      >
        Change Username
      </button>
    </div>
  )
}

// ── Main LeftSidebar ─────────────────────────────────────────

const ITEMS = [
  { id: 'rooms',       icon: 'fi-sr-house-chimney', label: 'Room List'        },
  { id: 'dice',        icon: 'fi-sr-dice',          label: 'Dice'             },
  { id: 'keno',        icon: 'fi-sr-grid',          label: 'Keno'             },
  { id: 'store',       icon: 'fi-sr-store-alt',     label: 'Store'            },
  { id: 'leaderboard', icon: 'fi-sr-medal',         label: 'Leaderboard'      },
  { id: 'youtube',     icon: 'fi-br-youtube',       label: 'YouTube'          },
  { id: 'username',    icon: 'fi-sr-edit',          label: 'Change Username'  },
  { id: 'premium',     icon: 'fi-sr-crown',         label: 'Premium'          },
]

export default function LeftSidebar({ room, socket, roomId }) {
  const [panel, setPanel] = useState(null)
  const [showDice, setDice] = useState(false)
  const [showKeno, setKeno] = useState(false)
  const [showYT,   setYT]   = useState(false)

  return (
    <div style={{ display: 'flex', height: '100%', flexShrink: 0 }}>
      {/* Icon rail */}
      <div style={{ width: 48, background: '#f8f9fa', borderRight: '1px solid #e4e6ea', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 2 }}>
        {/* Room icon */}
        <div style={{ padding: '2px 0 6px', borderBottom: '1px solid #e4e6ea', width: '100%', textAlign: 'center', marginBottom: 4 }}>
          <img
            src={room?.icon || '/default_images/rooms/default_room.png'}
            alt=""
            style={{ width: 30, height: 30, borderRadius: 7, objectFit: 'cover', margin: '0 auto' }}
            onError={e => (e.target.style.display = 'none')}
          />
        </div>

        {ITEMS.map(item => (
          <button
            key={item.id}
            title={item.label}
            onClick={() => {
              if (item.id === 'dice')    { setDice(true); return }
              if (item.id === 'keno')    { setKeno(true); return }
              if (item.id === 'youtube') { setYT(true);   return }
              setPanel(p => (p === item.id ? null : item.id))
            }}
            style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: panel === item.id ? '#e8f0fe' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: panel === item.id ? '#1a73e8' : '#6b7280', fontSize: 15, transition: 'all .12s', flexShrink: 0 }}
            onMouseEnter={e => { if (panel !== item.id) { e.currentTarget.style.background = '#e8f0fe'; e.currentTarget.style.color = '#1a73e8' } }}
            onMouseLeave={e => { if (panel !== item.id) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280' } }}
          >
            <i className={`fi ${item.icon}`} />
          </button>
        ))}
      </div>

      {/* Slide-out panel */}
      {panel && (
        <div style={{ width: 240, background: '#fff', borderRight: '1px solid #e4e6ea', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 8px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #e4e6ea', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '0.9rem', color: '#111827' }}>
              {ITEMS.find(i => i.id === panel)?.label}
            </span>
            <button onClick={() => setPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13 }}>
              <i className="fi fi-sr-cross-small" />
            </button>
          </div>

          {panel === 'rooms'       && <RoomListPanel />}
          {panel === 'store'       && <StorePanel />}
          {panel === 'leaderboard' && <LeaderboardPanel />}
          {panel === 'username'    && <UsernamePanel />}
          {panel === 'premium'     && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
              <i className="fi fi-sr-crown" style={{ fontSize: 40, color: '#f59e0b', marginBottom: 10 }} />
              <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, color: '#111827', marginBottom: 8 }}>Go Premium</div>
              <div style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius: 10, padding: 12, color: '#fff', fontWeight: 700 }}>Coming Soon 🚀</div>
            </div>
          )}
        </div>
      )}

      {/* Game modals */}
      {showDice && <DiceGame socket={socket} onClose={() => setDice(false)} />}
      {showKeno && <KenoGame socket={socket} onClose={() => setKeno(false)} />}
      {showYT   && <YoutubePanel socket={socket} roomId={roomId} onClose={() => setYT(false)} />}
    </div>
  )
}
