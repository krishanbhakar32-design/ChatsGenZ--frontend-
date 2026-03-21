const SOUND_FILES = {
  notify:      '/sounds/notify.mp3',
  join:        '/sounds/join.mp3',
  leave:       '/sounds/whistle.mp3',
  private:     '/sounds/private.mp3',
  call_in:     '/sounds/call_in.mp3',
  call_out:    '/sounds/call_out.mp3',
  call_end:    '/sounds/call_end.mp3',
  new_message: '/sounds/new_messages.mp3',
  mention:     '/sounds/username.mp3',
  gift:        '/sounds/action.mp3',
  badge:       '/sounds/badge.mp3',
  levelup:     '/sounds/levelup.mp3',
  quote:       '/sounds/quote.mp3',
  mute:        '/sounds/mute.mp3',
}

const cache = {}
let enabled = localStorage.getItem('cgz_sound') !== 'false'

export const isSoundEnabled = () => enabled
export const toggleSound = () => {
  enabled = !enabled
  localStorage.setItem('cgz_sound', String(enabled))
  return enabled
}

export function playSound(name) {
  if (!enabled) return
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
