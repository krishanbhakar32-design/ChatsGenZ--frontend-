// ============================================================
// ChatIcons.jsx — Shared icon components for ChatRoom
// ============================================================
import { useState } from 'react'
import { RANKS, R } from './chatConstants.js'

// SVG icon from /public/default_images/icons/ with flaticon fallback
export function UIIcon({ name, size = 18, fallback, style = {} }) {
  const [err, setErr] = useState(false)
  if (!err) return (
    <img
      src={`/default_images/icons/${name}.svg`}
      alt=""
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, ...style }}
      onError={() => setErr(true)}
    />
  )
  return <i className={`fi ${fallback || 'fi-sr-info'}`} style={{ fontSize: size - 2, ...style }} />
}

// Rank icon from /public/icons/ranks/
export function RIcon({ rank, size = 'md' }) {
  const ri = R(rank)
  const px = typeof size === 'number' ? size :
    (size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'lg' ? 20 : size === 'xl' ? 26 : 16)
  return (
    <img
      src={`/icons/ranks/${ri.icon}`}
      alt={ri.label || rank}
      title={ri.label || rank}
      style={{ width: px, height: px, objectFit: 'contain', flexShrink: 0, background: 'transparent', display: 'inline-block', verticalAlign: 'middle' }}
      onError={e => e.target.style.display = 'none'}
    />
  )
}

// Header icon button — supports SVG img or flaticon class
export function HBtn({ icon, img, title, badge, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        position: 'relative', background: active ? 'rgba(26,115,232,.15)' : 'none',
        border: 'none', cursor: 'pointer', color: active ? '#1a73e8' : '#9ca3af',
        width: 34, height: 34, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0, transition: 'all .15s',
      }}
    >
      {img
        ? <img src={img} alt={title || ''} style={{ width: 18, height: 18, objectFit: 'contain', opacity: active ? 1 : 0.7 }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling?.style && (e.target.nextSibling.style.display = 'block') }} />
        : <i className={`fi ${icon}`} />
      }
      {img && icon && <i className={`fi ${icon}`} style={{ display: 'none' }} />}
      {!!badge && (
        <span style={{
          position: 'absolute', top: 3, right: 3,
          background: '#ef4444', color: '#fff',
          fontSize: '0.55rem', fontWeight: 700,
          padding: '1px 4px', borderRadius: 10, minWidth: 14, textAlign: 'center',
          lineHeight: 1.4,
        }}>{badge > 99 ? '99+' : badge}</span>
      )}
    </button>
  )
}

// Footer bar button
export function FBtn({ icon, active, onClick, title, badge }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 2, padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer',
        color: active ? '#1a73e8' : '#9ca3af', position: 'relative', borderRadius: 7,
        transition: 'color .15s', minWidth: 44,
      }}
    >
      <i className={`fi ${icon}`} style={{ fontSize: 18 }} />
      {title && <span style={{ fontSize: '0.58rem', fontWeight: 600 }}>{title}</span>}
      {!!badge && (
        <span style={{
          position: 'absolute', top: 2, right: 6,
          background: '#ef4444', color: '#fff',
          fontSize: '0.52rem', fontWeight: 700,
          padding: '1px 4px', borderRadius: 10,
        }}>{badge > 99 ? '99+' : badge}</span>
      )}
    </button>
  )
}
