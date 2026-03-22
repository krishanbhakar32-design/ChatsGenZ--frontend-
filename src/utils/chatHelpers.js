/**
 * chatHelpers.js
 * Shared utilities for all chat components.
 * Imports RANKS from constants.js so there is ONE source of truth.
 */
import { RANKS } from '../constants.js'

export { RANKS }

// ── STATUS OPTIONS ────────────────────────────────────────────
export const STATUSES = [
  { id: 'online',    label: 'Online',    color: '#22c55e' },
  { id: 'away',      label: 'Away',      color: '#f59e0b' },
  { id: 'busy',      label: 'Busy',      color: '#ef4444' },
  { id: 'invisible', label: 'Invisible', color: '#9ca3af' },
]

// Gender/rank border colour for avatars
export const GBR = (gender, rank) =>
  rank === 'bot'
    ? 'transparent'
    : ({ male: '#03add8', female: '#ff99ff', couple: '#9c6fde', other: '#cccccc' }[gender] || '#cccccc')

// Rank helpers
export const R  = r => RANKS[r] || RANKS.guest
export const RL = r => RANKS[r]?.level || 0

// Rank icon component
export function RIcon({ rank, size = 14 }) {
  const ri = R(rank)
  return (
    <img
      src={`/icons/ranks/${ri.icon}`}
      alt=""
      style={{ width: size, height: size, objectFit: 'contain', background: 'transparent', flexShrink: 0, display: 'inline-block' }}
      onError={e => (e.target.style.display = 'none')}
    />
  )
}
