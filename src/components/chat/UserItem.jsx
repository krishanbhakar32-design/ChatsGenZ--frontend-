/**
 * UserItem.jsx — FIXED
 * Fixes:
 * 1. /default_images/avatar/ → /default_avatar/ (getAvatarUrl helper)
 * 2. /icons/flags/ → /flag/ (correct public folder for country flags)
 */
import { R, RL, GBR, RIcon } from '../../utils/chatHelpers.js'
import { getAvatarUrl } from '../../constants.js'

export default function UserItem({ u, onClick }) {
  const ri  = R(u.rank)
  const col = u.nameColor || ri.color

  return (
    <div
      onClick={() => onClick(u)}
      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', cursor: 'pointer', transition: 'background .12s' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Avatar + online dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={getAvatarUrl(u.avatar)}
          alt=""
          style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${GBR(u.gender, u.rank)}`, display: 'block' }}
          onError={e => (e.target.src = '/default_avatar/other.png')}
        />
        <span style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, background: '#22c55e', borderRadius: '50%', border: '1.5px solid #fff' }} />
      </div>

      <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 700, color: col, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {u.username}
      </span>

      <RIcon rank={u.rank} size={13} />

      {/* FIX: was /icons/flags/ → correct path is /flag/ */}
      {u.countryCode && u.countryCode !== 'ZZ' && (
        <img
          src={`/flag/${u.countryCode.toUpperCase()}.png`}
          alt=""
          style={{ width: 16, height: 11, flexShrink: 0, borderRadius: 1 }}
          onError={e => (e.target.style.display = 'none')}
        />
      )}
    </div>
  )
}
