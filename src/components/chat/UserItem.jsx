/**
 * UserItem.jsx — FINAL FIXED
 * Flag: /icons/flags/XX.png ✅ (assets exist there)
 * Avatar: /default_images/avatar/ ✅ (backend stores this path)
 */
import { R, RL, GBR, RIcon } from '../../utils/chatHelpers.js'

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
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={u.avatar || '/default_images/avatar/guest.png'}
          alt=""
          style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${GBR(u.gender, u.rank)}`, display: 'block' }}
          onError={e => (e.target.src = '/default_images/avatar/guest.png')}
        />
        <span style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, background: '#22c55e', borderRadius: '50%', border: '1.5px solid #fff' }} />
      </div>

      <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 700, color: col, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {u.username}
      </span>

      <RIcon rank={u.rank} size={13} />

      {/* Flag: /icons/flags/IN.png etc */}
      {u.countryCode && u.countryCode !== 'ZZ' && (
        <img
          src={`/icons/flags/${u.countryCode.toUpperCase()}.png`}
          alt={u.countryCode}
          style={{ width: 16, height: 11, flexShrink: 0, borderRadius: 1, objectFit: 'cover' }}
          onError={e => (e.target.style.display = 'none')}
        />
      )}
    </div>
  )
}
