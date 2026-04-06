// ============================================================
// ChatIcons.jsx — CodyChat Dark Theme
// All buttons use CSS variables for consistent dark theming
// ============================================================
import { useState } from 'react'
import { RANKS, R } from './chatConstants.js'

// ── Rank icon from /public/icons/ranks/ ───────────────────
export function RIcon({ rank, size = 'md' }) {
  const ri = R(rank)
  const px = typeof size === 'number' ? size :
    (size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'lg' ? 20 : size === 'xl' ? 26 : 16)
  return (
    <img
      src={`/icons/ranks/${ri.icon}`}
      alt={ri.label || rank}
      title={ri.label || rank}
      style={{
        width: px, height: px,
        objectFit: 'contain',
        flexShrink: 0,
        background: 'transparent',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
      onError={e => e.target.style.display = 'none'}
    />
  )
}

// ── Header icon button ─────────────────────────────────────
// Matches CodyChat's .bhead icon style: muted default, accent on active
export function HBtn({ icon, faIcon, img, title, badge, active, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        background: active
          ? 'rgba(3,173,216,0.18)'
          : hov
            ? 'rgba(255,255,255,0.06)'
            : 'none',
        border: 'none',
        cursor: 'pointer',
        color: active ? 'var(--accent)' : 'rgba(255,255,255,0.55)',
        width: 34,
        height: 34,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        flexShrink: 0,
        transition: 'background .12s, color .12s',
      }}
    >
      {img
        ? <>
            <img
              src={img}
              alt={title || ''}
              style={{ width: 18, height: 18, objectFit: 'contain', opacity: active ? 1 : 0.65 }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline-block' }}
            />
            {faIcon && <i className={faIcon} style={{ display: 'none' }} />}
          </>
        : faIcon
          ? <i className={faIcon} />
          : icon
            ? <i className={icon} />
            : null
      }
      {!!badge && (
        <span style={{
          position: 'absolute', top: 3, right: 3,
          background: '#ef4444', color: '#fff',
          fontSize: '0.55rem', fontWeight: 700,
          padding: '1px 4px', borderRadius: 10,
          minWidth: 14, textAlign: 'center', lineHeight: 1.4,
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}

// ── Footer bar button ──────────────────────────────────────
// Matches CodyChat .bfoot icon bar: column layout, accent when active
export function FBtn({ icon, faIcon, active, onClick, title, badge, tObj }) {
  const [hov, setHov] = useState(false)
  const accent  = tObj?.accent || 'var(--accent)'
  const inactive = 'rgba(255,255,255,0.45)'

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: '4px 12px',
        background: active
          ? 'rgba(3,173,216,0.12)'
          : hov
            ? 'rgba(255,255,255,0.05)'
            : 'none',
        border: 'none',
        cursor: 'pointer',
        color: active ? accent : inactive,
        position: 'relative',
        borderRadius: 7,
        transition: 'color .12s, background .12s',
        minWidth: 44,
      }}
    >
      <i className={faIcon || icon} style={{ fontSize: 18 }} />
      {title && (
        <span style={{ fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.02em' }}>
          {title}
        </span>
      )}
      {!!badge && (
        <span style={{
          position: 'absolute', top: 2, right: 6,
          background: '#ef4444', color: '#fff',
          fontSize: '0.52rem', fontWeight: 700,
          padding: '1px 4px', borderRadius: 10,
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}

// ── FA Icon constants ──────────────────────────────────────
export const FA = {
  menu:          'fa-solid fa-bars',
  close:         'fa-solid fa-xmark',
  search:        'fa-solid fa-magnifying-glass',
  settings:      'fa-solid fa-gear',
  chatOptions:   'fa-solid fa-user-gear',
  roomList:      'fa-solid fa-house-chimney-user',
  leaveRoom:     'fa-solid fa-circle-left',
  forum:         'fa-sharp fa-solid fa-rss',
  friendsWall:   'fa-solid fa-square-rss',
  news:          'fa-regular fa-newspaper',
  myProfile:     'fa-solid fa-address-card',
  viewProfile:   'fa-solid fa-circle-user',
  editProfile:   'fa-regular fa-pen-to-square',
  usernamestyle: 'fa-solid fa-signature',
  usernameEdit:  'fa-solid fa-user-pen',
  addFriend:     'fa-solid fa-user-plus',
  userList:      'fa-solid fa-users',
  friendsList:   'fa-solid fa-user-group',
  staffList:     'fa-solid fa-user-shield',
  dm:            'fa-solid fa-envelope',
  contactUs:     'fa-solid fa-envelope',
  messageBubble: 'fa-solid fa-comments',
  quote:         'fa-solid fa-reply-all',
  whisper:       'fa-solid fa-hand-lizard',
  mic:           'fa-solid fa-microphone-lines',
  notification:  'fa-solid fa-bell',
  report:        'fa-sharp fa-solid fa-flag',
  leaderboard:   'fa-sharp fa-solid fa-medal',
  trophy:        'fa-solid fa-trophy',
  store:         'fa-solid fa-store',
  wallet:        'fa-solid fa-wallet',
  adminPanel:    'fa-solid fa-gauge',
  logout:        'fa-solid fa-right-from-bracket',
  upload:        'fa-solid fa-upload',
  image:         'fa-solid fa-image',
  youtube:       'fa-brands fa-youtube',
  dice:          'fa-solid fa-dice',
  trash:         'fa-solid fa-trash',
  send:          'fa-solid fa-paper-plane',
  check:         'fa-solid fa-check',
  checkCircle:   'fa-solid fa-circle-check',
  info:          'fa-solid fa-circle-info',
  warning:       'fa-solid fa-triangle-exclamation',
  ban:           'fa-solid fa-ban',
  lock:          'fa-solid fa-lock',
  arrowLeft:     'fa-solid fa-arrow-left',
  arrowRight:    'fa-solid fa-arrow-right',
  angleDown:     'fa-solid fa-angle-down',
  angleRight:    'fa-solid fa-angle-right',
  spin:          'fa-solid fa-circle-notch fa-spin',
  webcam:        'fa-solid fa-video',
  radio:         'fa-solid fa-radio',
  gift:          'fa-solid fa-gift',
  phone:         'fa-solid fa-phone',
  expand:        'fa-solid fa-expand',
  compress:      'fa-solid fa-compress',
  minus:         'fa-solid fa-minus',
  plus:          'fa-solid fa-plus',
  smile:         'fa-regular fa-face-smile',
  paperPlane:    'fa-solid fa-paper-plane',
  bars:          'fa-solid fa-bars',
}
