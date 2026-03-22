/**
 * LeftSidebar.jsx — FIXED
 * Fixes:
 * 1. /default_images/avatar/ → /default_avatar/
 * 2. /default_images/icons/gold.svg → /icons/gold.svg
 * 3. /default_images/rooms/ paths — these are correct already
 * 4. StorePanel buy buttons now actually show a modal (no payment yet but not dead)
 * 5. Leaderboard types fixed to match backend: xp/level/gold/gifts (not leader_xp etc)
 * 6. Premium panel shows VIP plans from backend
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAvatarUrl } from '../../constants.js'
import DiceGame    from './DiceGame.jsx'
import KenoGame    from './KenoGame.jsx'
import YoutubePanel from './YoutubePanel.jsx'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

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
      {rooms.length === 0 && <div style={{ textAlign:'center', padding:20, color:'#9ca3af', fontSize:'0.8rem' }}>No rooms found</div>}
    </div>
  )
}

// FIX: Store panel — buttons now show a "coming soon" toast instead of doing nothing silently
function StorePanel() {
  const [msg, setMsg] = useState('')

  function handleBuy(pack) {
    setMsg(`Payment gateway coming soon! ${pack.g} Gold for ${pack.p}`)
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div style={{ padding: 10, flex: 1, overflowY: 'auto' }}>
      <div style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'center' }}>
        {/* FIX: /default_images/icons/gold.svg → /icons/gold.svg */}
        <img src="/icons/gold.svg" alt="" style={{ width: 28, height: 28, margin: '0 auto 4px', display: 'block' }} onError={() => {}} />
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Buy Gold Coins</div>
      </div>

      {msg && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem', color: '#92400e', marginBottom: 10 }}>
          {msg}
        </div>
      )}

      {[{ g: 100, p: '₹10' }, { g: 500, p: '₹45' }, { g: 1000, p: '₹80' }, { g: 5000, p: '₹350' }].map(pack => (
        <button
          key={pack.g}
          onClick={() => handleBuy(pack)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', background: '#f9fafb', border: '1px solid #e4e6ea', borderRadius: 8, cursor: 'pointer', marginBottom: 6, transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e8f0fe'; e.currentTarget.style.borderColor = '#1a73e8' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e4e6ea' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src="/icons/gold.svg" alt="" style={{ width: 16, height: 16 }} onError={() => {}} />
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
  // FIX: backend route is /api/leaderboard/:type where type = xp|level|gold|gifts|messages
  const [type, setType] = useState('xp')
  const [load, setLoad] = useState(false)

  useEffect(() => {
    setLoad(true)
    const t = localStorage.getItem('cgz_token')
    fetch(`${API}/api/leaderboard/${type}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => setData(d.users || []))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [type])

  // FIX: types match backend route params
  const TYPES = [
    { id: 'xp',    l: 'XP'    },
    { id: 'level', l: 'Level' },
    { id: 'gold',  l: 'Gold'  },
    { id: 'gifts', l: 'Gifts' },
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
                <img src={getAvatarUrl(u.avatar)} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => (e.target.src = '/default_avatar/other.png')} />
                <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1a73e8' }}>
                  {type==='xp' ? u.xp : type==='level' ? u.level : type==='gold' ? u.gold : u.totalGiftsReceived || 0}
                </span>
              </div>
            ))
        }
        {!load && data.length === 0 && <div style={{ textAlign:'center', padding:20, color:'#9ca3af', fontSize:'0.8rem' }}>No data</div>}
      </div>
    </div>
  )
}

function UsernamePanel() {
  const [val, setVal] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function change() {
    if (!val.trim()) return
    setLoading(true)
    const t = localStorage.getItem('cgz_token')
    const r = await fetch(`${API}/api/users/change-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ newUsername: val }),
    })
    const d = await r.json()
    setMsg(r.ok ? '✅ Username changed!' : d.error || 'Failed')
    setLoading(false)
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
        disabled={loading || !val.trim()}
        style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: loading || !val.trim() ? '#f3f4f6' : 'linear-gradient(135deg,#1a73e8,#1464cc)', color: loading || !val.trim() ? '#9ca3af' : '#fff', fontWeight: 700, cursor: loading || !val.trim() ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'Outfit,sans-serif' }}
      >
        {loading ? 'Changing...' : 'Change Username'}
      </button>
    </div>
  )
}

// FIX: Premium panel now fetches real VIP plans from backend
function PremiumPanel() {
  const [plans, setPlans] = useState([])
  const [vipStatus, setVipStatus] = useState(null)
  const [load, setLoad] = useState(true)
  const [buying, setBuying] = useState(null)
  const [msg, setMsg] = useState('')
  const token = localStorage.getItem('cgz_token')

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/vip/plans`).then(r=>r.json()),
      fetch(`${API}/api/vip/status`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()),
    ]).then(([pData, sData]) => {
      setPlans(pData.plans || [])
      setVipStatus(sData)
    }).catch(()=>{}).finally(()=>setLoad(false))
  }, [])

  async function buyVIP(plan) {
    setBuying(plan.id); setMsg('')
    const r = await fetch(`${API}/api/vip/purchase/${plan.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const d = await r.json()
    setMsg(r.ok ? `✅ VIP activated for ${plan.days} days!` : d.error || 'Failed')
    if (r.ok) {
      setVipStatus({ isPremium: true, daysLeft: plan.days })
    }
    setBuying(null)
  }

  if (load) return <div style={{ textAlign:'center', padding:20 }}><div style={{ width:22,height:22,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto' }}/></div>

  return (
    <div style={{ padding: 12, flex: 1, overflowY: 'auto' }}>
      {vipStatus?.isPremium && (
        <div style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', borderRadius: 10, padding: 12, marginBottom: 12, textAlign:'center', color:'#fff' }}>
          <div style={{ fontSize:'1.2rem', marginBottom:4 }}>👑</div>
          <div style={{ fontWeight:800, fontSize:'0.9rem' }}>VIP Active!</div>
          <div style={{ fontSize:'0.75rem', opacity:0.85 }}>{vipStatus.daysLeft} days remaining</div>
        </div>
      )}
      {msg && (
        <div style={{ background: msg.startsWith('✅')?'#d1fae5':'#fee2e2', borderRadius:8, padding:'8px 12px', fontSize:'0.8rem', color: msg.startsWith('✅')?'#065f46':'#dc2626', marginBottom:12 }}>
          {msg}
        </div>
      )}
      {plans.map(plan => (
        <div key={plan.id} style={{ background:'#f9fafb', border:'1.5px solid #e4e6ea', borderRadius:10, padding:'12px', marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <div style={{ fontWeight:800, color:'#111827', fontSize:'0.88rem' }}>{plan.label}</div>
            <div style={{ fontWeight:700, color:'#7c3aed', fontSize:'0.88rem' }}>{plan.price} Gold</div>
          </div>
          <div style={{ fontSize:'0.75rem', color:'#9ca3af', marginBottom:8 }}>
            +{plan.gold} Gold bonus • {plan.days} days VIP
          </div>
          <button
            onClick={() => buyVIP(plan)}
            disabled={buying === plan.id}
            style={{ width:'100%', padding:'8px', borderRadius:8, border:'none', background: buying===plan.id?'#f3f4f6':'linear-gradient(135deg,#7c3aed,#5b21b6)', color: buying===plan.id?'#9ca3af':'#fff', fontWeight:700, cursor: buying===plan.id?'not-allowed':'pointer', fontSize:'0.82rem' }}
          >
            {buying===plan.id ? 'Processing...' : 'Buy with Gold'}
          </button>
        </div>
      ))}
    </div>
  )
}

const ITEMS = [
  { id: 'rooms',       icon: 'fi-sr-house-chimney', label: 'Room List'       },
  { id: 'dice',        icon: 'fi-sr-dice',          label: 'Dice'            },
  { id: 'keno',        icon: 'fi-sr-grid',          label: 'Keno'            },
  { id: 'store',       icon: 'fi-sr-store-alt',     label: 'Store'           },
  { id: 'leaderboard', icon: 'fi-sr-medal',         label: 'Leaderboard'     },
  { id: 'youtube',     icon: 'fi-br-youtube',       label: 'YouTube'         },
  { id: 'username',    icon: 'fi-sr-edit',          label: 'Change Username' },
  { id: 'premium',     icon: 'fi-sr-crown',         label: 'Premium'         },
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
          {/* FIX: Premium now has real VIP plans */}
          {panel === 'premium'     && <PremiumPanel />}
        </div>
      )}

      {showDice && <DiceGame socket={socket} onClose={() => setDice(false)} />}
      {showKeno && <KenoGame socket={socket} onClose={() => setKeno(false)} />}
      {showYT   && <YoutubePanel socket={socket} roomId={roomId} onClose={() => setYT(false)} />}
    </div>
  )
}
