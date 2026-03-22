// ============================================================
// ChatsGenZ Frontend Constants — FIXED
// PATH FIXES:
//   getRankIcon:  /icons/ranks/ → /ranks/
//   getBadgeIcon: /icons/badges/ → /badge/
//   getGiftIcon:  /gifts/ → /gift/
//   getAvatarUrl: /default_images/avatar/ → /default_avatar/
//   getGenderAvatar: same fix
// !! EXACT MATCH with /models/User.js and /middleware/auth.js !!
// ============================================================

// ── SITE-WIDE RANKS ────────────────────────────────────────────
export const RANKS = {
  owner:      { level: 14, label: 'Owner',       icon: 'owner.svg',       color: '#FFD700' },
  superadmin: { level: 13, label: 'Superadmin',  icon: 'super_admin.svg', color: '#FF00FF' },
  admin:      { level: 12, label: 'Admin',        icon: 'admin.svg',       color: '#FF4444' },
  moderator:  { level: 11, label: 'Moderator',   icon: 'mod.svg',         color: '#00AAFF' },
  premium:    { level: 10, label: 'Premium',      icon: 'premium.svg',     color: '#AA44FF' },
  bot:        { level:  9, label: 'Bot',          icon: 'bot.svg',         color: '#888888' },
  legend:     { level:  8, label: 'Legend',       icon: 'legend.png',      color: '#FF8800' }, // FIX: file is legend.png not legend.svg
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
export const XP_PER_LEVEL    = 100
export const GOLD_PER_LEVELUP = (level) => level * 20

export const XP_GAINS = {
  sendMessage:   1,
  dailyBonus:    10,
  spinWheel:     5,
  diceLose:      1,
  diceWin:       5,
  wheelWin:      5,
  quizEasy:      10,
  quizMedium:    20,
  quizHard:      40,
  quizWrong:     2,
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
// FIX: was /icons/ranks/ → correct is /ranks/
export const getRankIcon  = (rankKey) => `/ranks/${RANKS[rankKey]?.icon || 'guest.svg'}`
export const getRankColor = (rankKey) => RANKS[rankKey]?.color || '#888888'
export const getRankLabel = (rankKey) => RANKS[rankKey]?.label || 'Guest'
export const getRankLevel = (rankKey) => RANKS[rankKey]?.level || 1

export const isStaff      = (rank) => ['moderator','admin','superadmin','owner'].includes(rank)
export const isAdmin      = (rank) => ['admin','superadmin','owner'].includes(rank)
export const isSuperAdmin = (rank) => ['superadmin','owner'].includes(rank)
export const isOwner      = (rank) => rank === 'owner'
export const isBot        = (rank) => rank === 'bot'
export const isVIP        = (rank) => ['vipmale','vipfemale','butterfly','ninja','fairy','legend','premium','moderator','admin','superadmin','owner'].includes(rank)

export const canModerate  = (actorRank, targetRank) =>
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
// FIX: Backend stores /default_images/avatar/... paths
//      Frontend public folder has these files at /default_avatar/
//      Solution: map the paths correctly
export const getAvatarUrl = (avatar) => {
  if (!avatar) return '/default_avatar/other.png'
  if (avatar.startsWith('http')) return avatar  // ImgBB full URL
  // FIX: remap /default_images/avatar/ → /default_avatar/
  if (avatar.startsWith('/default_images/avatar/')) {
    return avatar.replace('/default_images/avatar/', '/default_avatar/')
  }
  return avatar
}

export const getGenderAvatar = (gender) => {
  // FIX: was /default_images/avatar/ → /default_avatar/
  if (gender === 'male')   return '/default_avatar/male.png'
  if (gender === 'female') return '/default_avatar/female.png'
  return '/default_avatar/other.png'
}

// ── GIFT ICON HELPER ───────────────────────────────────────────
// FIX: was /gifts/ → correct folder is /gift/
export const getGiftIcon = (iconFile) => `/gift/${iconFile}`

// ── BADGE ICON HELPER ──────────────────────────────────────────
// FIX: was /icons/badges/ → correct folder is /badge/
export const getBadgeIcon = (iconFile) => `/badge/${iconFile}`
