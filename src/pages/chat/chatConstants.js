// ============================================================
// chatConstants.js — Shared constants and helpers for ChatRoom
// ============================================================

export const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

export const RANKS = {
  guest:      { label:'Guest',      color:'#888888', icon:'guest.svg',       level:1  },
  user:       { label:'User',       color:'#aaaaaa', icon:'user.svg',        level:2  },
  vipfemale:  { label:'VIP Female', color:'#FF4488', icon:'vip_female.svg',  level:3  },
  vipmale:    { label:'VIP Male',   color:'#4488FF', icon:'vip_male.svg',    level:4  },
  butterfly:  { label:'Butterfly',  color:'#FF66AA', icon:'butterfly.svg',   level:5  },
  ninja:      { label:'Ninja',      color:'#777777', icon:'ninja.svg',       level:6  },
  fairy:      { label:'Fairy',      color:'#FF88CC', icon:'fairy.svg',       level:7  },
  legend:     { label:'Legend',     color:'#FF8800', icon:'legend.png',      level:8  },
  bot:        { label:'Bot',        color:'#00cc88', icon:'bot.svg',         level:9  },
  premium:    { label:'Premium',    color:'#aa44ff', icon:'premium.svg',     level:10 },
  moderator:  { label:'Moderator',  color:'#00AAFF', icon:'mod.svg',         level:11 },
  admin:      { label:'Admin',      color:'#FF4444', icon:'admin.svg',       level:12 },
  superadmin: { label:'Superadmin', color:'#FF00FF', icon:'super_admin.svg', level:13 },
  owner:      { label:'Owner',      color:'#FFD700', icon:'owner.svg',       level:14 },
}

export const STATUSES = [
  { id:'online',    label:'Online',    color:'#22c55e' },
  { id:'away',      label:'Away',      color:'#f59e0b' },
  { id:'busy',      label:'Busy',      color:'#ef4444' },
  { id:'invisible', label:'Invisible', color:'#9ca3af' },
]

export const SYS_CFG = {
  join:    { accent:'#22c55e', icon:'fi-sr-enter' },
  leave:   { accent:'#9ca3af', icon:'fi-sr-exit' },
  kick:    { accent:'#f59e0b', icon:'fi-sr-boot-heeled' },
  ban:     { accent:'#ef4444', icon:'fi-sr-ban' },
  mute:    { accent:'#f59e0b', icon:'fi-sr-volume-mute' },
  mod:     { accent:'#6366f1', icon:'fi-sr-shield-check' },
  dice:    { accent:'#7c3aed', icon:'fi-sr-dice' },
  gift:    { accent:'#ec4899', icon:'fi-sr-gift' },
  system:  { accent:'#1a73e8', icon:'fi-sr-info' },
  warning: { accent:'#f59e0b', icon:'fi-sr-triangle-warning' },
  error:   { accent:'#ef4444', icon:'fi-sr-circle-xmark' },
  success: { accent:'#22c55e', icon:'fi-sr-check-circle' },
}

export const SYSTEM_SENDER = {
  username: 'System',
  rank:     'bot',
  avatar:   '/default_images/avatar/default_system.png',
  _id:      'system',
}

export const NAME_HEX = [
  '#ff3333','#ff6633','#ff9933','#ffcc33','#cccc00','#99cc00','#59b300','#829356',
  '#008000','#00e639','#00e673','#00e6ac','#00cccc','#03add8','#3366ff','#107896',
  '#004d99','#6633ff','#9933ff','#cc33ff','#ff33ff','#ff33cc','#ff3399','#ff3366',
  '#604439','#795548','#a97f70','#bc9b8f','#9E9E9E','#879fab','#698796','#495f69',
]

// Gender-based border color for avatars
export const GBR = (g, r) =>
  r === 'bot' ? 'transparent' :
  ({ male:'#03add8', female:'#ff99ff', couple:'#9c6fde', other:'#cccccc' }[g] || '#cccccc')

// Rank helpers
export const R  = r => RANKS[r] || RANKS.guest
export const RL = r => RANKS[r]?.level || 0

export const isStaff = rank => ['moderator','admin','superadmin','owner'].includes(rank)
export const isAdmin = rank => ['admin','superadmin','owner'].includes(rank)

// Resolve stored name-color key → CSS color
export function resolveNameColor(nc, fallback = '') {
  if (!nc) return fallback
  if (nc.startsWith('bcolor')) return NAME_HEX[parseInt(nc.replace('bcolor', '')) - 1] || fallback
  if (nc.startsWith('bgrad') || nc.startsWith('bneon')) return fallback
  if (nc.startsWith('#') || nc.startsWith('rgb')) return nc
  return fallback
}
