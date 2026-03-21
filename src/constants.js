// ============================================================
// ChatsGenZ Frontend Constants
// !! EXACT MATCH with /models/User.js and /middleware/auth.js !!
// If backend changes → update here too
// ============================================================

// ── SITE-WIDE RANKS ────────────────────────────────────────
// key = exact DB value stored in user.rank
// Must match RANKS object in backend/models/User.js
export const RANKS = {
  owner:      { level: 14, label: 'Owner',       icon: 'owner.svg',      color: '#FFD700' },
  superadmin: { level: 13, label: 'Superadmin',  icon: 'super_admin.svg', color: '#FF00FF' },
  admin:      { level: 12, label: 'Admin',        icon: 'admin.svg',      color: '#FF4444' },
  moderator:  { level: 11, label: 'Moderator',   icon: 'mod.svg',  color: '#00AAFF' },
  premium:    { level: 10, label: 'Premium',      icon: 'premium.svg',    color: '#AA44FF' },
  bot:        { level:  9, label: 'Bot',          icon: 'bot.svg',        color: '#888888' },
  legend:     { level:  8, label: 'Legend',       icon: 'legend.svg',     color: '#FF8800' },  // backend says legend.png — we use .svg (same file, rename if needed)
  fairy:      { level:  7, label: 'Fairy',        icon: 'fairy.svg',      color: '#FF88CC' },
  ninja:      { level:  6, label: 'Ninja',        icon: 'ninja.svg',      color: '#444444' },
  butterfly:  { level:  5, label: 'Butterfly',    icon: 'butterfly.svg',  color: '#FF66AA' },
  vipmale:    { level:  4, label: 'VIP Male',     icon: 'vip_male.svg',    color: '#4488FF' },
  vipfemale:  { level:  3, label: 'VIP Female',   icon: 'vip_female.svg',  color: '#FF4488' },
  user:       { level:  2, label: 'User',         icon: 'user.svg',       color: '#CCCCCC' },
  guest:      { level:  1, label: 'Guest',        icon: 'guest.svg',      color: '#888888' },
}

// Sorted array — highest first (for dropdowns, admin panel)
export const RANKS_LIST = Object.entries(RANKS)
  .map(([key, val]) => ({ key, ...val }))
  .sort((a, b) => b.level - a.level)

// ── XP / LEVEL SYSTEM ─────────────────────────────────────
// From server.js line 756: newLevel = Math.floor(xp / 100) + 1
// Every 100 XP = 1 level up
// Level up reward: newLevel * 20 gold
export const XP_PER_LEVEL    = 100
export const GOLD_PER_LEVELUP = (level) => level * 20  // e.g. level 5 = 100 gold

// XP earned per action (from server.js + games.js)
export const XP_GAINS = {
  sendMessage:   1,   // server.js line 225
  dailyBonus:    10,  // games.js line 340
  spinWheel:     5,   // games.js line 294
  diceLose:      1,   // games.js line 31
  diceWin:       5,   // games.js line 31
  wheelWin:      5,   // games.js line 115 (approx)
  quizEasy:      10,  // games.js line 207
  quizMedium:    20,
  quizHard:      40,
  quizWrong:     2,
}

// ── ROOM ROLES (per-room, NOT global rank) ─────────────────
// From models/User.js — stored in RoomStaff collection
export const ROOM_ROLES = {
  0: { label: 'Member',        icon: 'user.svg'      },
  4: { label: 'Room Moderator',icon: 'room_mod.svg'  },
  5: { label: 'Room Admin',    icon: 'room_admin.svg'},
  6: { label: 'Room Owner',    icon: 'room_owner.svg'},
}

// ── RANK HELPERS ───────────────────────────────────────────
export const getRankInfo  = (rankKey) => RANKS[rankKey] || RANKS.guest
export const getRankIcon  = (rankKey) => `/icons/ranks/${RANKS[rankKey]?.icon || 'guest.svg'}`
export const getRankColor = (rankKey) => RANKS[rankKey]?.color || '#888888'
export const getRankLabel = (rankKey) => RANKS[rankKey]?.label || 'Guest'
export const getRankLevel = (rankKey) => RANKS[rankKey]?.level || 1

// Can user do staff actions?
export const isStaff      = (rank) => ['moderator','admin','superadmin','owner'].includes(rank)
export const isAdmin      = (rank) => ['admin','superadmin','owner'].includes(rank)
export const isSuperAdmin = (rank) => ['superadmin','owner'].includes(rank)
export const isOwner      = (rank) => rank === 'owner'
export const isBot        = (rank) => rank === 'bot'
export const isVIP        = (rank) => ['vipmale','vipfemale','butterfly','ninja','fairy','legend','premium','moderator','admin','superadmin','owner'].includes(rank)

// Can rank A moderate rank B? (higher rank can mod lower)
export const canModerate  = (actorRank, targetRank) =>
  (RANKS[actorRank]?.level || 0) > (RANKS[targetRank]?.level || 0)

// ── PREMIUM TYPES ──────────────────────────────────────────
// From User model: premiumType enum
export const PREMIUM_TYPES = ['none', 'silver', 'gold', 'diamond']

// ── STATUS TYPES ──────────────────────────────────────────
// From User model: status enum
export const STATUS_TYPES = {
  online:    { label: 'Online',    icon: 'online.svg',    color: '#34a853' },
  away:      { label: 'Away',      icon: 'away.svg',      color: '#fbbc04' },
  busy:      { label: 'Busy',      icon: 'busy.svg',      color: '#ea4335' },
  invisible: { label: 'Invisible', icon: 'invisible.svg', color: '#999999' },
}

// ── GENDER TYPES ───────────────────────────────────────────
// From User model: gender enum
export const GENDER_TYPES = ['male', 'female', 'other']

// ── API URL ────────────────────────────────────────────────
export const API_URL = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ── AVATAR HELPER ──────────────────────────────────────────
// Backend stores TWO types of avatar values:
// 1. Default: '/default_images/avatar/default_avatar.png'  ← relative, frontend serves it
// 2. Uploaded: 'https://i.ibb.co/...'                      ← full ImgBB URL
// Use this helper everywhere to display avatars correctly:
export const getAvatarUrl = (avatar) => {
  if (!avatar) return '/default_images/avatar/default_avatar.png'
  if (avatar.startsWith('http')) return avatar          // ImgBB full URL
  return avatar                                          // already /default_images/... path
}

export const getGenderAvatar = (gender) => {
  if (gender === 'male')   return '/default_images/avatar/default_male.png'
  if (gender === 'female') return '/default_images/avatar/default_female.png'
  return '/default_images/avatar/default_avatar.png'
}

// ── GIFT ICON HELPER ───────────────────────────────────────
// Backend stores just filename: 'rose.svg'
// Frontend path: /gifts/rose.svg
export const getGiftIcon = (iconFile) => `/gifts/${iconFile}`

// ── BADGE ICON HELPER ──────────────────────────────────────
// Backend stores just filename: 'badge_auth.svg'
// Frontend path: /icons/badges/badge_auth.svg
export const getBadgeIcon = (iconFile) => `/icons/badges/${iconFile}`
