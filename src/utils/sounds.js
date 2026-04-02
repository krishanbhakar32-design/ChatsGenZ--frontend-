const SOUND_FILES = {
  notify:      '/sounds/notify.mp3',
  join:        '/sounds/join.mp3',
  leave:       '/sounds/whistle.mp3',
  private:     '/sounds/private.mp3',
  whisper:     '/sounds/private.mp3',   // whisper uses same as private
  call_in:     '/sounds/call_in.mp3',
  call_out:    '/sounds/call_out.mp3',
  call_end:    '/sounds/call_end.mp3',
  new_message: '/sounds/new_messages.mp3',
  mention:     '/sounds/username.mp3',
  quote:       '/sounds/notify.mp3',    // quote notification
  gift:        '/sounds/action.mp3',
  badge:       '/sounds/badge.mp3',
  levelup:     '/sounds/levelup.mp3',
  mute:        '/sounds/mute.mp3',
}
const cache = {}

function isEnabled() {
  try { return localStorage.getItem('cgz_sound') !== 'false' } catch { return true }
}
export function toggleSound() {
  try {
    const next = !isEnabled()
    localStorage.setItem('cgz_sound', String(next))
    return next
  } catch { return true }
}
export function playSound(name) {
  if (!isEnabled()) return
  const src = SOUND_FILES[name]; if (!src) return
  try {
    if (!cache[name]) { cache[name] = new Audio(src); cache[name].volume = 0.5 }
    cache[name].currentTime = 0
    cache[name].play().catch(()=>{})
  } catch {}
}
export const Sounds = {
  newMessage: ()=>playSound('new_message'),
  join:       ()=>playSound('join'),
  leave:      ()=>playSound('leave'),
  mention:    ()=>playSound('mention'),
  quote:      ()=>playSound('quote'),
  whisper:    ()=>playSound('whisper'),
  privateMsg: ()=>playSound('private'),
  callIn:     ()=>playSound('call_in'),
  callOut:    ()=>playSound('call_out'),
  callEnd:    ()=>playSound('call_end'),
  gift:       ()=>playSound('gift'),
  badge:      ()=>playSound('badge'),
  levelUp:    ()=>playSound('levelup'),
  notify:     ()=>playSound('notify'),
  mute:       ()=>playSound('mute'),
}
