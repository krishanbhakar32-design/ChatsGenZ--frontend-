// ============================================================
// constants.js — Global frontend constants
// Single source of truth for ranks, helpers, and API URL.
//
// Consumers:
//   src/pages/admin/AdminPanel.jsx   — RANKS, RANKS_LIST, helpers, API_URL
//   src/pages/Profile.jsx            — API_URL
//   src/pages/Leaderboard.jsx        — API_URL, RANKS
//   src/pages/Gifts.jsx              — API_URL
//   src/utils/chatHelpers.js         — RANKS
//
// NOTE: Chat-room components use src/pages/chat/chatConstants.js
// which defines its own lean copies of API + RANKS for bundle splitting.
// Keep both files in sync if RANKS change.
// ============================================================

// ── API URL ────────────────────────────────────────────────
export const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://chatsgenz-backend-production.up.railway.app'

// ── RANKS ─────────────────────────────────────────────────
// key = exact value stored in user.rank in the DB
// Must stay in sync with backend/models/User.js
export const RANKS = {
  guest:      { level:  1, label: 'Guest',      icon: 'guest.svg',       color: '#888888' },
  user:       { level:  2, label: 'User',        icon: 'user.svg',        color: '#aaaaaa' },
  vipfemale:  { level:  3, label: 'VIP Female',  icon: 'vip_female.svg',  color: '#FF4488' },
  vipmale:    { level:  4, label: 'VIP Male',    icon: 'vip_male.svg',    color: '#4488FF' },
  butterfly:  { level:  5, label: 'Butterfly',   icon: 'butterfly.svg',   color: '#FF66AA' },
  ninja:      { level:  6, label: 'Ninja',       icon: 'ninja.svg',       color: '#777777' },
  fairy:      { level:  7, label: 'Fairy',       icon: 'fairy.svg',       color: '#FF88CC' },
  legend:     { level:  8, label: 'Legend',      icon: 'legend.png',      color: '#FF8800' },
  bot:        { level:  9, label: 'Bot',         icon: 'bot.svg',         color: '#00cc88' },
  premium:    { level: 10, label: 'Premium',     icon: 'premium.svg',     color: '#aa44ff' },
  moderator:  { level: 11, label: 'Moderator',   icon: 'mod.svg',         color: '#00AAFF' },
  admin:      { level: 12, label: 'Admin',       icon: 'admin.svg',       color: '#FF4444' },
  superadmin: { level: 13, label: 'Superadmin',  icon: 'super_admin.svg', color: '#FF00FF' },
  owner:      { level: 14, label: 'Owner',       icon: 'owner.svg',       color: '#FFD700' },
}

// Sorted array highest-first — used by AdminPanel dropdowns
export const RANKS_LIST = Object.entries(RANKS)
  .map(([key, val]) => ({ key, ...val }))
  .sort((a, b) => b.level - a.level)

// ── RANK HELPERS ───────────────────────────────────────────
export const getRankInfo  = (rankKey) => RANKS[rankKey] || RANKS.guest
export const getRankIcon  = (rankKey) => `/icons/ranks/${RANKS[rankKey]?.icon || 'guest.svg'}`
export const getRankColor = (rankKey) => RANKS[rankKey]?.color || '#888888'
export const getRankLabel = (rankKey) => RANKS[rankKey]?.label || 'Guest'
export const getRankLevel = (rankKey) => RANKS[rankKey]?.level || 1

// ── ROLE GUARDS ────────────────────────────────────────────
export const isStaff      = (rank) => ['moderator', 'admin', 'superadmin', 'owner'].includes(rank)
export const isAdmin      = (rank) => ['admin', 'superadmin', 'owner'].includes(rank)
export const isSuperAdmin = (rank) => ['superadmin', 'owner'].includes(rank)
export const isOwner      = (rank) => rank === 'owner'
export const isBot        = (rank) => rank === 'bot'
export const isVIP        = (rank) => [
  'vipmale', 'vipfemale', 'butterfly', 'ninja', 'fairy', 'legend',
  'premium', 'moderator', 'admin', 'superadmin', 'owner',
].includes(rank)

// Can rank A moderate rank B? (higher level = can mod lower)
export const canModerate = (actorRank, targetRank) =>
  (RANKS[actorRank]?.level || 0) > (RANKS[targetRank]?.level || 0)

// ── XP / LEVEL SYSTEM ─────────────────────────────────────
// server.js: newLevel = Math.floor(xp / 100) + 1
export const XP_PER_LEVEL     = 100
export const GOLD_PER_LEVELUP = (level) => level * 20  // e.g. level 5 → 100 gold

export const XP_GAINS = {
  sendMessage: 1,
  dailyBonus:  10,
  spinWheel:   5,
  diceLose:    1,
  diceWin:     5,
  wheelWin:    5,
  quizEasy:    10,
  quizMedium:  20,
  quizHard:    40,
  quizWrong:   2,
}

// ── ROOM ROLES (per-room, not global rank) ─────────────────
export const ROOM_ROLES = {
  0: { label: 'Member',         icon: 'user.svg'       },
  4: { label: 'Room Moderator', icon: 'room_mod.svg'   },
  5: { label: 'Room Admin',     icon: 'room_admin.svg' },
  6: { label: 'Room Owner',     icon: 'room_owner.svg' },
}

// ── PREMIUM TYPES ──────────────────────────────────────────
export const PREMIUM_TYPES = ['none', 'silver', 'gold', 'diamond']

// ── STATUS TYPES ───────────────────────────────────────────
export const STATUS_TYPES = {
  online:    { label: 'Online',    icon: 'online.svg',    color: '#34a853' },
  away:      { label: 'Away',      icon: 'away.svg',      color: '#fbbc04' },
  busy:      { label: 'Busy',      icon: 'busy.svg',      color: '#ea4335' },
  invisible: { label: 'Invisible', icon: 'invisible.svg', color: '#999999' },
}

// ── GENDER TYPES ───────────────────────────────────────────
export const GENDER_TYPES = ['male', 'female', 'other']

// ── AVATAR HELPERS ─────────────────────────────────────────
// Backend stores two avatar formats:
//   1. Relative path: '/default_images/avatar/default_avatar.png'
//   2. Full ImgBB URL: 'https://i.ibb.co/...'
export const getAvatarUrl = (avatar) => {
  if (!avatar) return '/default_images/avatar/default_avatar.png'
  if (avatar.startsWith('http')) return avatar   // ImgBB full URL
  return avatar                                   // relative /default_images/... path
}

export const getGenderAvatar = (gender) => {
  if (gender === 'male')   return '/default_images/avatar/default_male.png'
  if (gender === 'female') return '/default_images/avatar/default_female.png'
  return '/default_images/avatar/default_avatar.png'
}

// ── GIFT / BADGE ICON HELPERS ──────────────────────────────
// Backend stores just the filename, e.g. 'rose.svg'
export const getGiftIcon  = (iconFile) => `/gifts/${iconFile}`
export const getBadgeIcon = (iconFile) => `/icons/badges/${iconFile}`
