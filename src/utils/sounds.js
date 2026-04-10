// sounds.js — ChatsGenZ
// Master toggle: cgz_sound (true/false)
// Per-sound prefs: cgz_sounds { key: false } = that sound disabled
// When master is OFF → ALL sounds silent regardless of per-sound setting
// When master is ON  → per-sound prefs respected (default ON for each)

const SOUND_FILES = {
  notify:      '/sounds/notify.mp3',
  join:        '/sounds/join.mp3',
  leave:       '/sounds/whistle.mp3',
  private:     '/sounds/private.mp3',
  whisper:     '/sounds/private.mp3',
  call_in:     '/sounds/call_in.mp3',
  call_out:    '/sounds/call_out.mp3',
  call_end:    '/sounds/call_end.mp3',
  new_message: '/sounds/new_messages.mp3',
  mention:     '/sounds/username.mp3',
  quote:       '/sounds/notify.mp3',
  gift:        '/sounds/action.mp3',
  badge:       '/sounds/badge.mp3',
  levelup:     '/sounds/levelup.mp3',
  mute:        '/sounds/mute.mp3',
}

// Map from internal sound key → SoundsModal pref key
const SOUND_PREF_KEY = {
  new_message: 'newMessage',
  join:        'join',
  leave:       'leave',
  gift:        'gift',
  levelup:     'levelUp',
  mention:     'mention',
  private:     'privateMsg',
  whisper:     'whisper',
  badge:       'badge',
  notify:      'notify',
}

const cache = {}

// ── Global master toggle ──────────────────────────────────────
function isMasterEnabled() {
  try { return localStorage.getItem('cgz_sound') !== 'false' } catch { return true }
}

export function getSoundEnabled() {
  return isMasterEnabled()
}

export function toggleSound() {
  try {
    const next = !isMasterEnabled()
    localStorage.setItem('cgz_sound', String(next))
    return next
  } catch { return true }
}

// ── Per-sound prefs ───────────────────────────────────────────
function getSoundPrefs() {
  try { return JSON.parse(localStorage.getItem('cgz_sounds') || '{}') } catch { return {} }
}

function isSoundKeyEnabled(soundFileKey) {
  const prefKey = SOUND_PREF_KEY[soundFileKey]
  if (!prefKey) return true
  const prefs = getSoundPrefs()
  return prefs[prefKey] !== false
}

// ── Core play ─────────────────────────────────────────────────
export function playSound(name) {
  // 1. Check global master toggle FIRST — if off, nothing plays
  if (!isMasterEnabled()) return
  // 2. Check per-sound preference
  if (!isSoundKeyEnabled(name)) return
  // 3. Play
  const src = SOUND_FILES[name]
  if (!src) return
  try {
    if (!cache[name]) { cache[name] = new Audio(src); cache[name].volume = 0.5 }
    cache[name].currentTime = 0
    cache[name].play().catch(() => {})
  } catch {}
}

// ── Named sound helpers ───────────────────────────────────────
export const Sounds = {
  newMessage: () => playSound('new_message'),
  join:       () => playSound('join'),
  leave:      () => playSound('leave'),
  mention:    () => playSound('mention'),
  quote:      () => playSound('quote'),
  whisper:    () => playSound('whisper'),
  privateMsg: () => playSound('private'),
  callIn:     () => playSound('call_in'),
  callOut:    () => playSound('call_out'),
  callEnd:    () => playSound('call_end'),
  gift:       () => playSound('gift'),
  badge:      () => playSound('badge'),
  levelUp:    () => playSound('levelup'),
  notify:     () => playSound('notify'),
  mute:       () => playSound('mute'),
}
