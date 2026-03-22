// ============================================================
// ChatsGenZ Frontend Constants — FINAL FIXED
// All paths verified against actual /public folder structure
// !! SYNC with /models/User.js and /middleware/auth.js !!
// ============================================================

// ── SITE-WIDE RANKS ────────────────────────────────────────────
export const RANKS = {
  owner:      { level: 14, label: 'Owner',       icon: 'owner.svg',       color: '#FFD700' },
  superadmin: { level: 13, label: 'Superadmin',  icon: 'super_admin.svg', color: '#FF00FF' },
  admin:      { level: 12, label: 'Admin',        icon: 'admin.svg',       color: '#FF4444' },
  moderator:  { level: 11, label: 'Moderator',   icon: 'mod.svg',         color: '#00AAFF' },
  premium:    { level: 10, label: 'Premium',      icon: 'premium.svg',     color: '#AA44FF' },
  bot:        { level:  9, label: 'Bot',          icon: 'bot.svg',         color: '#888888' },
  legend:     { level:  8, label: 'Legend',       icon: 'legend.png',      color: '#FF8800' },
  fairy:      { level:  7, label: 'Fairy',        icon: 'fairy.svg',       color: '#FF88CC' },
  ninja:      { level:  6, label: 'Ninja',        icon: 'ninja.svg',       color: '#444444' },
  butterfly:  { level:  5, label: 'Butterfly',    icon: 'butterfly.svg',   color: '#FF66AA' },
  vipmale:    { level:  4, label: 'VIP Male',     icon: 'vip_male.svg',    color: '#4488FF' },
  vipfemale:  { level:  3, label: 'VIP Female',   icon: 'vip_female.svg',  color: '#FF4488' },
  user:       { level:  2, label: 'User',         icon: 'user.svg',        color: '#CCCCCC' },
  guest:      { level:  1, label: 'Guest',        icon: 'guest.svg',       color: '#888888' },
}

export const RANKS_LIST = Object.entries(RANKS)
  .map(([key, val]) => ({ key, ...val }))
  .sort((a, b) => b.level - a.level)

// ── XP / LEVEL SYSTEM ──────────────────────────────────────────
export const XP_PER_LEVEL     = 100
export const GOLD_PER_LEVELUP = (level) => level * 20

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

// ── ROOM ROLES ─────────────────────────────────────────────────
export const ROOM_ROLES = {
  0: { label: 'Member',         icon: 'user.svg'       },
  4: { label: 'Room Moderator', icon: 'room_mod.svg'   },
  5: { label: 'Room Admin',     icon: 'room_admin.svg' },
  6: { label: 'Room Owner',     icon: 'room_owner.svg' },
}

// ── RANK HELPERS ───────────────────────────────────────────────
export const getRankInfo  = (rankKey) => RANKS[rankKey] || RANKS.guest
// Uses /icons/ranks/ — assets copied here during deployment
export const getRankIcon  = (rankKey) => `/icons/ranks/${RANKS[rankKey]?.icon || 'guest.svg'}`
export const getRankColor = (rankKey) => RANKS[rankKey]?.color || '#888888'
export const getRankLabel = (rankKey) => RANKS[rankKey]?.label || 'Guest'
export const getRankLevel = (rankKey) => RANKS[rankKey]?.level || 1

export const isStaff      = (rank) => ['moderator','admin','superadmin','owner'].includes(rank)
export const isAdmin      = (rank) => ['admin','superadmin','owner'].includes(rank)
export const isSuperAdmin = (rank) => ['superadmin','owner'].includes(rank)
export const isOwner      = (rank) => rank === 'owner'
export const isBot        = (rank) => rank === 'bot'
export const isVIP        = (rank) => ['vipmale','vipfemale','butterfly','ninja','fairy','legend','premium','moderator','admin','superadmin','owner'].includes(rank)

export const canModerate = (actorRank, targetRank) =>
  (RANKS[actorRank]?.level || 0) > (RANKS[targetRank]?.level || 0)

// ── PREMIUM TYPES ──────────────────────────────────────────────
export const PREMIUM_TYPES = ['none', 'silver', 'gold', 'diamond']

// ── STATUS TYPES ──────────────────────────────────────────────
export const STATUS_TYPES = {
  online:    { label: 'Online',    icon: 'online.svg',    color: '#34a853' },
  away:      { label: 'Away',      icon: 'away.svg',      color: '#fbbc04' },
  busy:      { label: 'Busy',      icon: 'busy.svg',      color: '#ea4335' },
  invisible: { label: 'Invisible', icon: 'invisible.svg', color: '#999999' },
}

// ── GENDER TYPES ───────────────────────────────────────────────
export const GENDER_TYPES = ['male', 'female', 'other']

// ── API URL ────────────────────────────────────────────────────
export const API_URL = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ── AVATAR HELPER ──────────────────────────────────────────────
// Backend stores: /default_images/avatar/default_guest.png
// Public has assets in BOTH:
//   /default_images/avatar/  (for backend-stored paths)
//   /default_avatar/          (direct access)
// Both folders have the same files → both work
export const getAvatarUrl = (avatar) => {
  if (!avatar) return '/default_images/avatar/default_guest.png'
  if (avatar.startsWith('http')) return avatar  // ImgBB CDN URL
  return avatar                                  // already a path like /default_images/avatar/...
}

export const getGenderAvatar = (gender) => {
  if (gender === 'male')   return '/default_images/avatar/default_male.png'
  if (gender === 'female') return '/default_images/avatar/default_female.png'
  if (gender === 'couple') return '/default_images/avatar/default_guest.png'
  return '/default_images/avatar/default_guest.png'
}

// ── GIFT ICON HELPER ───────────────────────────────────────────
// Uses /gifts/ — assets copied here during deployment
export const getGiftIcon = (iconFile) => {
  if (!iconFile) return null
  if (iconFile.startsWith('http')) return iconFile
  if (iconFile.startsWith('/')) return iconFile
  return `/gifts/${iconFile}`
}

// ── BADGE ICON HELPER ──────────────────────────────────────────
// Uses /icons/badges/ — assets copied here during deployment
export const getBadgeIcon = (iconFile) => {
  if (!iconFile) return null
  if (iconFile.startsWith('/')) return iconFile
  return `/icons/badges/${iconFile}`
}

// ── FLAG ICON HELPER ──────────────────────────────────────────
// Uses /icons/flags/ — assets copied here during deployment
export const getFlagUrl = (countryCode) => {
  if (!countryCode || countryCode === 'ZZ') return null
  return `/icons/flags/${countryCode.toUpperCase()}.png`
}
