/**
 * RightSidebar.jsx
 * Shows Online / Staff / Search tabs with user list.
 */
import { useState } from 'react'
import { RANKS, RL } from '../../utils/chatHelpers.js'
import UserItem from './UserItem.jsx'

export default function RightSidebar({ users, myLevel, onUserClick, onClose }) {
  const [tab,     setTab]    = useState('users')
  const [search,  setSearch] = useState('')
  const [rankF,   setRankF]  = useState('all')
  const [genderF, setGenderF]= useState('all')

  const sorted = [...users].sort((a, b) => {
    const d = RL(b.rank) - RL(a.rank)
    return d || (a.username || '').localeCompare(b.username || '')
  })
  const staff   = sorted.filter(u => RL(u.rank) >= 11)
  const base    = tab === 'staff' ? staff : sorted
  const filtered = base.filter(u => {
    if (tab === 'search') {
      return (
        (!search || u.username.toLowerCase().includes(search.toLowerCase())) &&
        (rankF   === 'all' || u.rank   === rankF) &&
        (genderF === 'all' || u.gender === genderF)
      )
    }
    return true
  })

  const TABS = [
    { id: 'users',  icon: 'fi-sr-users',        label: 'Users'  },
    { id: 'staff',  icon: 'fi-sr-shield-check',  label: 'Staff'  },
    { id: 'search', icon: 'fi-sr-search',        label: 'Search' },
  ]

  return (
    <div style={{ width: 210, borderLeft: '1px solid #e4e6ea', background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e4e6ea', flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            title={t.label}
            style={{ flex: 1, padding: '9px 2px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: `2px solid ${tab === t.id ? '#1a73e8' : 'transparent'}`, color: tab === t.id ? '#1a73e8' : '#9ca3af', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
          >
            <i className={`fi ${t.icon}`} />
          </button>
        ))}
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px 7px', fontSize: 13 }}
        >
          <i className="fi fi-sr-cross-small" />
        </button>
      </div>

      {/* Search filters */}
      {tab === 'search' && (
        <div style={{ padding: '7px 8px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Username..."
            style={{ width: '100%', padding: '6px 10px', background: '#f9fafb', border: '1.5px solid #e4e6ea', borderRadius: 7, fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box', color: '#111827', marginBottom: 6, fontFamily: 'Nunito,sans-serif' }}
            onFocus={e => (e.target.style.borderColor = '#1a73e8')}
            onBlur={e => (e.target.style.borderColor = '#e4e6ea')}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            <select
              value={genderF}
              onChange={e => setGenderF(e.target.value)}
              style={{ flex: 1, padding: '5px 4px', background: '#f9fafb', border: '1px solid #e4e6ea', borderRadius: 6, fontSize: '0.73rem', outline: 'none', color: '#374151' }}
            >
              <option value="all">All Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="couple">Couple</option>
              <option value="other">Other</option>
            </select>
            <select
              value={rankF}
              onChange={e => setRankF(e.target.value)}
              style={{ flex: 1, padding: '5px 4px', background: '#f9fafb', border: '1px solid #e4e6ea', borderRadius: 6, fontSize: '0.73rem', outline: 'none', color: '#374151' }}
            >
              <option value="all">All Ranks</option>
              {Object.entries(RANKS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Count label */}
      <div style={{ padding: '5px 10px 2px', fontSize: '0.63rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '1px', textTransform: 'uppercase', flexShrink: 0 }}>
        {tab === 'staff' ? 'Staff' : 'Online'} · {filtered.length}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0
          ? <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.78rem', padding: '16px 10px' }}>
              {tab === 'staff' ? 'No staff' : tab === 'search' ? 'No results' : 'No users'}
            </p>
          : filtered.map((u, i) => (
              <UserItem key={u.userId || u._id || i} u={u} onClick={onUserClick} />
            ))
        }
      </div>
    </div>
  )
}
