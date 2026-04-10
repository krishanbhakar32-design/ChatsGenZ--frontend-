// ============================================================
// ChatRoom.jsx — ChatsGenZ v2 — All 9 Issues Fixed
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate }                   from 'react-router-dom'
import { io }                                        from 'socket.io-client'
import { THEMES }                                    from '../../components/StyleModal.jsx'
import { useToast }                                  from '../../components/Toast.jsx'
import { Sounds }                                    from '../../utils/sounds.js'

import { API, RANKS, R, RL, GBR, isStaff, resolveNameColor } from './chatConstants.js'
import { HBtn, FA }                                            from './ChatIcons.jsx'
import { PaintingCanvas, GifPicker, YTPanel, SpotifyPanel, EmoticonPicker } from './ChatMedia.jsx'
import { DiceRoll }                                            from './ChatGames.jsx'
import { MiniCard, SelfProfileOverlay, ProfileModal }         from './ChatProfiles.jsx'
import { Msg }                                                 from './ChatMessages.jsx'
import { RightSidebar, LeftSidebar }                          from './ChatSidebars.jsx'
import { RadioPanel }                                          from './ChatRadio.jsx'
import { FriendReqPanel, NotifPanel, DMPanel }                from './ChatSocial.jsx'
import { GiftPanel }                                           from './ChatGifts.jsx'
import { ChatSettingsOverlay, AvatarDropdown, Footer }         from './ChatSettings.jsx'
import { WebcamPanel, LiveCamBar }                             from './ChatWebcam.jsx'

// ── Theme CSS loader — injects /public/themes/<id>/<id>.css dynamically
const _loadedCSS = new Set()
function loadThemeCss(themeId) {
  if (!themeId || themeId === 'Dark' || _loadedCSS.has(themeId)) return
  _loadedCSS.add(themeId)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `/themes/${encodeURIComponent(themeId)}/${encodeURIComponent(themeId)}.css`
  link.onerror = () => {}
  document.head.appendChild(link)
}

export default function ChatRoom() {
  const { roomSlug } = useParams(), nav = useNavigate(), toast = useToast()
  const token = localStorage.getItem('cgz_token')

  const [me,           setMe]          = useState(null)
  const [room,         setRoom]        = useState(null)
  const roomId = room?._id || roomSlug
  const [messages,     setMsgs]        = useState([])
  const [users,        setUsers]       = useState([])
  const [input,        setInput]       = useState('')
  const [typers,       setTypers]      = useState([])
  const [showRight,    setRight]       = useState(false)
  const [showLeft,     setLeft]        = useState(false)
  const [showRadio,    setRadio]       = useState(false)
  const [showNotif,    setShowNotif]   = useState(false)
  const [showDM,       setShowDM]      = useState(false)
  const [showFriends,  setShowFriends] = useState(false)
  const [showChatSettings, setShowChatSettings] = useState(false)
  const [showPlus,     setShowPlus]    = useState(false)
  const [showPaint,    setShowPaint]   = useState(false)
  const [miniYT,       setMiniYT]      = useState(null)
  const [showCam,      setShowCam]     = useState(false)
  const [liveCams,     setLiveCams]    = useState([])
  const [showDiceAnim, setShowDiceAnim]= useState(false)
  const [diceRollVal,  setDiceRollVal] = useState(null)
  const [quotedMsg,    setQuotedMsg]   = useState(null)
  const [showGif,      setShowGif]     = useState(false)
  const [showYT,       setShowYT]      = useState(false)
  const [showSpotify,  setShowSpotify] = useState(false)
  const [showEmoji,    setShowEmoji]   = useState(false)
  const [profUser,     setProf]        = useState(null)
  const [giftTarget,   setGiftTgt]     = useState(null)
  const [loading,      setLoad]        = useState(true)
  const [roomErr,      setErr]         = useState('')
  const [connected,    setConn]        = useState(false)
  const [onlineCount,  setOnlineCount] = useState(0)
  const [status,       setStatus]      = useState('online')
  const [notif,        setNotif]       = useState({ dm: 0, friends: 0, notif: 0, reports: 0 })
  const [hiddenMsgs,   setHidden]      = useState(new Set())
  const [ignoredUsers, setIgnored]     = useState(() => new Set())
  const [miniCardData, setMiniCardData]= useState(null)
  // FIX 9: Whisper inline — no separate popup, target stored here, send from main input
  const [whisperTarget, setWhisper]   = useState(null)
  const [autoScroll,    setAutoScroll] = useState(false)

  const sockRef = useRef(null), bottomRef = useRef(null), inputRef = useRef(null)
  const dmBtnRef = useRef(null), friendsBtnRef = useRef(null), notifBtnRef = useRef(null), emojiBtnRef = useRef(null)
  const typingTimer = useRef(null), isTypingRef = useRef(false)
  const intentionalLeaveRef = useRef(false)

  // FIX 1: beforeunload — confirm on refresh/close; never auto-send left msg
  useEffect(() => {
    const handleBefore = (e) => {
      if (intentionalLeaveRef.current) return
      e.preventDefault()
      e.returnValue = 'Leave the chat? Your session will end.'
      return e.returnValue
    }
    window.addEventListener('beforeunload', handleBefore)
    return () => window.removeEventListener('beforeunload', handleBefore)
  }, [])

  // Tab switch (visibilitychange) = do nothing, user is still in chat
  // Only actual window/tab close triggers beforeunload

  useEffect(() => {
    if (!token) { nav('/login'); return }
    loadRoom()
    return () => { if (!intentionalLeaveRef.current) sockRef.current?.disconnect() }
  }, [roomSlug])

  useEffect(() => { if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, autoScroll])

  async function loadRoom() {
    setLoad(true); setErr('')
    try {
      const [mr, rr] = await Promise.all([
        fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/rooms/${roomSlug}`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (mr.status === 401) { localStorage.removeItem('cgz_token'); nav('/login'); return }
      const md = await mr.json()
      if (md.user) {
        if (md.freshToken) localStorage.setItem('cgz_token', md.freshToken)
        setMe(md.user)
        // FIX 5: Load theme CSS from /public/themes/
        loadThemeCss(md.user.chatTheme || 'Dark')
        // Inject user's custom CSS if any
        if (md.user.customCss) {
          let el = document.getElementById('cgz-user-custom-css')
          if (!el) { el = document.createElement('style'); el.id = 'cgz-user-custom-css'; document.head.appendChild(el) }
          el.textContent = md.user.customCss
        }
      }
      const rd = await rr.json()
      if (!rr.ok) { setErr(rd.error || 'Room not found'); setLoad(false); return }
      setRoom(rd.room)
      fetch(`${API}/api/rooms/${roomSlug}/messages?limit=50`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d.messages) setMsgs(d.messages) }).catch(() => {})
    } catch { setErr('Connection failed.') }
    setLoad(false)
  }

  useEffect(() => {
    if (!room?._id) return
    connectSocket()
    return () => sockRef.current?.disconnect()
  }, [room?._id])

  // FIX 5: Load theme CSS whenever theme changes
  useEffect(() => { if (me?.chatTheme) loadThemeCss(me.chatTheme) }, [me?.chatTheme])

  function connectSocket() {
    sockRef.current?.disconnect()
    const s = io(API, { auth: { token }, transports: ['websocket', 'polling'] })
    s.on('connect',        () => { setConn(true); s.emit('joinRoom', { roomId }) })
    s.on('disconnect',     () => setConn(false))
    s.on('messageHistory', ms => setMsgs(ms || []))
    s.on('newMessage',     m  => {
      // Suppress join/leave/kick/mute/ban announcements from chat feed — play sounds only
      const suppressTypes = ['join','leave','kick','mute','ban','mod']
      if (suppressTypes.includes(m.type)) {
        if (m.type === 'join')  Sounds.join?.()
        else if (m.type === 'leave') Sounds.leave?.()
        else Sounds.mute?.()
        return // don't add to chat feed
      }
      setMsgs(p => [...p, m])
      Sounds.newMessage()
    })
    s.on('roomUsers',      l  => setUsers(l || []))
    s.on('roomUserCount',  n  => setOnlineCount(n))
    s.on('systemMessage',  m  => {
      // Suppress join/leave announcements — play sounds only, don't add to chat feed
      if (m.type === 'join')  { Sounds.join?.(); return }
      if (m.type === 'leave') { Sounds.leave?.(); return }
      if (m.type === 'kick' || m.type === 'ban' || m.type === 'mute') { Sounds.mute?.(); return }
      const sysId = m._id || ('sys_' + Date.now() + Math.random().toString(36).slice(2, 7))
      setMsgs(p => {
        const last = p[p.length - 1]
        if (last && last.type === m.type && last.content === m.text && (Date.now() - new Date(last.createdAt).getTime()) < 2000) return p
        return [...p, { _id: sysId, type: m.type || 'system', content: m.text, createdAt: new Date() }]
      })
    })
    s.on('messageDeleted',  ({ messageId }) => setMsgs(p => p.filter(m => m._id !== messageId)))
    s.on('typing',          ({ username, isTyping: t }) => setTypers(p => t ? [...new Set([...p, username])] : p.filter(n => n !== username)))
    s.on('youAreKicked',    ({ reason, kickDurationMinutes, isBan }) => { Sounds.mute(); nav('/kicked', { state: { reason: reason || 'Kicked.', isBan: !!isBan, kickDurationMinutes: kickDurationMinutes || 0 } }) })
    s.on('accessDenied',    ({ msg }) => { toast?.show(msg || 'Access denied', 'error', 5000); setTimeout(() => nav('/chat'), 2000) })
    s.on('youAreMuted',     ({ minutes }) => { Sounds.mute(); toast?.show(`🔇 Muted for ${minutes} minutes`, 'warn', 6000) })
    s.on('levelUp',         () => Sounds.levelUp())
    s.on('giftReceived',    () => Sounds.gift?.())
    s.on('diceResult',      ({ roll, won, payout, bet, newGold }) => {
      setDiceRollVal(roll); setShowDiceAnim(true)
      if (newGold !== undefined) setMe(p => p ? { ...p, gold: newGold } : p)
      const txt = won ? `🎲 You rolled ${roll} and WON ${payout} gold! 🎉` : `🎲 You rolled ${roll} and lost ${bet || 100} gold.`
      setMsgs(p => [...p, { _id: Date.now() + 'dr', type: 'dice', content: txt, createdAt: new Date() }])
    })
    s.on('goldUpdated',      ({ gold }) => setMe(p => p ? { ...p, gold } : p))
    s.on('error',            e => console.error('Socket:', e))
    s.on('roomTopic',        ({ topic }) => setRoom(p => p ? { ...p, topic } : p))
    s.on('topicChanged',     ({ topic }) => setRoom(p => p ? { ...p, topic } : p))
    s.on('roomUpdated',      d  => setRoom(p => p ? { ...p, ...d } : p))
    s.on('roomClosed',       ({ message }) => { toast?.show(message || 'Room closed', 'error', 4000); setTimeout(() => nav('/chat'), 2000) })
    s.on('badgeEarned',      () => Sounds.badge?.())
    s.on('messageReaction',  ({ messageId, reactions }) => setMsgs(p => p.map(m => m._id === messageId ? { ...m, reactions } : m)))
    s.on('messagePinned',    ({ messageId }) => setMsgs(p => p.map(m => m._id === messageId ? { ...m, isPinned: true } : m)))
    s.on('userMuted',        ({ by, minutes }) => { /* suppressed from chat feed */ })
    s.on('userKicked',       ({ by }) => { /* suppressed from chat feed */ })
    // ── Admin Broadcast — show as toast only, not in chat feed ──
    s.on('broadcastMessage', ({ message, type }) => {
      toast?.show(`📢 ${message}`, type === 'danger' ? 'error' : type || 'info', 6000)
    })
    // ── Live settings/rank style updates from admin panel ──
    s.on('siteSettingsUpdated', () => {
      if (me?.chatTheme) loadThemeCss(me.chatTheme)
    })
    s.on('rankStyleUpdated', () => {
      if (me?.chatTheme) loadThemeCss(me.chatTheme)
    })
    // ── Live user style update (name color, bubble, theme) ──
    s.on('userStyleUpdated', ({ userId, chatTheme, ...styleUpdates }) => {
      // Update in-room user list so name colors show instantly
      setUsers(prev => prev.map(u =>
        (u._id === userId || u.userId === userId)
          ? { ...u, ...styleUpdates, chatTheme }
          : u
      ))
      // If it's our own update — sync me state + load new theme CSS
      setMe(prev => {
        if (!prev || (String(prev._id) !== String(userId))) return prev
        const updated = { ...prev, ...styleUpdates, chatTheme }
        if (chatTheme && chatTheme !== prev.chatTheme) loadThemeCss(chatTheme)
        // Inject custom CSS if updated
        if (styleUpdates.customCss !== undefined) {
          let el = document.getElementById('cgz-user-custom-css')
          if (!el) { el = document.createElement('style'); el.id = 'cgz-user-custom-css'; document.head.appendChild(el) }
          el.textContent = styleUpdates.customCss || ''
        }
        return updated
      })
    })
    s.on('diceError',        ({ msg }) => toast?.show(`🎲 ${msg}`, 'error', 4000))
    s.on('kenoError',        ({ msg }) => toast?.show(`🎯 ${msg}`, 'error', 4000))
    s.on('onlineCount',      n  => setOnlineCount(n))
    s.on('camStarted',       ({ userId, username, rank }) => setLiveCams(p => p.find(c => c.userId === userId) ? p : [...p, { userId, username, rank: rank || 'user' }]))
    s.on('camStopped',       ({ userId }) => setLiveCams(p => p.filter(c => c.userId !== userId)))
    s.on('camOffer',         ({ from, username, hostRank, offer }) => { if (offer === 'live') setLiveCams(p => p.find(c => c.userId === from) ? p : [...p, { userId: from, username, rank: hostRank || 'user' }]) })
    s.on('privateMessage',   () => { setNotif(p => ({ ...p, dm: p.dm + 1 })); Sounds.privateMsg?.() })
    s.on('pmError',          ({ error }) => toast?.show(error, 'error', 4000))
    // FIX 9: Whisper/echo — appears inline in chat feed, no popup box
    s.on('echoMessage', (payload) => {
      const { from, to, content, _id, createdAt } = payload
      if (from) {
        setMsgs(p => [...p, { _id: _id || (Date.now() + 'e' + Math.random()), type: 'whisper', isEcho: true, content, from, to, sender: from, createdAt: createdAt || new Date() }])
        Sounds.whisper?.()
      }
    })
    s.on('echoError',            ({ error }) => toast?.show(`👁️ ${error}`, 'error', 3000))
    s.on('roomPasswordRequired', ({ roomId: rid, roomName }) => {
      const pw = window.prompt(`🔒 "${roomName}" requires a password:`)
      if (pw) s.emit('joinRoom', { roomId: rid, enteredPassword: pw })
      else nav('/chat')
    })
    sockRef.current = s
  }

  function handleTyping(e) {
    setInput(e.target.value)
    if (!isTypingRef.current) { isTypingRef.current = true; sockRef.current?.emit('typing', { roomId, isTyping: true }) }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => { isTypingRef.current = false; sockRef.current?.emit('typing', { roomId, isTyping: false }) }, 2000)
  }

  function send(e) {
    e.preventDefault()
    const t = input.trim()
    if (!t || !sockRef.current || !connected) return
    // FIX 9: if whisper mode active, send as whisper (inline in feed)
    if (whisperTarget) {
      const toId = String(whisperTarget?.userId || whisperTarget?._id || '')
      if (toId) sockRef.current.emit('sendEcho', { toUserId: toId, content: t, roomId })
      setWhisper(null)
    } else {
      sockRef.current.emit('sendMessage', { roomId, content: t, type: 'text', replyTo: quotedMsg?._id || null })
    }
    setInput(''); setQuotedMsg(null)
    isTypingRef.current = false; sockRef.current?.emit('typing', { roomId, isTyping: false })
    inputRef.current?.focus()
  }

  // FIX 1: Intentional leave only — sets flag so beforeunload skips confirm
  function leave() {
    intentionalLeaveRef.current = true
    sockRef.current?.emit('leaveRoom', { roomId })
    setTimeout(() => { sockRef.current?.disconnect(); nav('/chat') }, 150)
  }

  const handleIgnore   = useCallback((uid) => { setIgnored(p => { const n = new Set(p); n.has(uid) ? n.delete(uid) : n.add(uid); return n }) }, [])
  const handleMention  = useCallback((text) => { setInput(p => text + (p ? ' ' + p : '')); inputRef.current?.focus() }, [])
  const handleHide     = useCallback((id) => { setHidden(p => new Set([...p, id])) }, [])
  const handleMiniCard = useCallback((user, pos) => { setMiniCardData({ user, pos }) }, [])

  const myLevel     = RANKS[me?.rank]?.level || 1
  const isStaffRole = myLevel >= 11

  // FIX 2: Default theme = Dark; all theme values from tObj
  const tObj     = THEMES.find(t => t.id === (me?.chatTheme || 'Dark')) || THEMES[0]
  const thBg     = tObj.bg_chat    || '#151515'
  const thHeader = tObj.bg_header  || '#111111'
  const thText   = tObj.text       || '#ffffff'
  const thAccent = tObj.accent     || '#03add8'
  const thBgImg  = tObj.bg_image   || ''
  const thBorder = tObj.default_color || '#222222'

  const closeAll = useCallback(() => {
    setShowNotif(false); setShowDM(false); setShowFriends(false)
    setShowPlus(false);  setShowEmoji(false); setShowGif(false)
    setShowYT(false);    setShowPaint(false); setShowSpotify(false)
    // Don't close sidebars here — user explicitly opens them
  }, [])

  if (!loading && roomErr) return (
    <div style={{ minHeight: '100dvh', background: '#141414', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <p style={{ color: '#fff', fontWeight: 600, textAlign: 'center' }}>{roomErr}</p>
      <button onClick={() => nav('/chat')} style={{ padding: '10px 22px', borderRadius: 9, border: 'none', background: '#03add8', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>← Back to Lobby</button>
    </div>
  )

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #03add8', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 10px' }} />
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Joining room...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div
      style={{
        // FIX 4: position:fixed prevents iOS mobile bounce + auto-scroll
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        background: thBg,
        overflow: 'hidden',
        maxWidth: '100vw',
      }}
      onClick={closeAll}
    >
      {/* Theme background image */}
      {thBgImg && (
        <div style={{ position: 'fixed', inset: 0, backgroundImage: `url(${thBgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, pointerEvents: 'none', opacity: 0.55 }} />
      )}

      {/* ════ HEADER — sticky (flex item, never scrolls) ════ */}
      <div style={{
        height: 50, flexShrink: 0, zIndex: 100, position: 'relative',
        background: thHeader,
        borderBottom: `1px solid ${thBorder}33`,
        display: 'flex', alignItems: 'center', padding: '0 6px', gap: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
      }}>
        {/* Hamburger — opens LEFT SIDEBAR overlay */}
        <button
          onClick={e => { e.stopPropagation(); setLeft(s => !s) }}
          title="Menu"
          style={{ background: showLeft ? `${thAccent}22` : 'none', border: 'none', cursor: 'pointer', color: showLeft ? thAccent : 'rgba(255,255,255,0.55)', width: 34, height: 34, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, transition: 'all .12s' }}
        ><i className="fa-solid fa-bars" /></button>

        {/* Spacer */}
        <div style={{ flex: 1, minWidth: 0 }} />

        {/* Webcam toggle - uses webcam.svg from public folder */}
        <button
          onClick={e => { e.stopPropagation(); setShowCam(p => !p) }}
          title="Webcam"
          style={{ background: showCam ? `${thAccent}22` : 'none', border: `1px solid ${showCam ? thAccent + '55' : 'transparent'}`, borderRadius: 8, cursor: 'pointer', color: showCam ? thAccent : 'rgba(255,255,255,0.55)', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}
        >
          <img src="/default_images/icons/webcam.svg" alt="Webcam" style={{ width: 18, height: 18, opacity: showCam ? 1 : 0.6, filter: showCam ? `drop-shadow(0 0 4px ${thAccent})` : 'none' }} onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML += '<i class="fa-solid fa-video" style="font-size:15px"></i>' }} />
        </button>

        {/* DM */}
        <div style={{ position: 'relative' }} ref={dmBtnRef}>
          <HBtn faIcon="fa-solid fa-envelope" title="Messages" badge={notif.dm} active={showDM} onClick={e => { e.stopPropagation(); setShowDM(p => !p); setShowNotif(false) }} tObj={tObj} />
          {showDM && <div onClick={e => e.stopPropagation()}><DMPanel me={me} socket={sockRef.current} onClose={() => setShowDM(false)} onCount={n => setNotif(p => ({ ...p, dm: n }))} anchorRef={dmBtnRef} /></div>}
        </div>

        {/* Friends */}
        <div style={{ position: 'relative' }} ref={friendsBtnRef}>
          <HBtn faIcon="fa-solid fa-user-plus" title="Friend Requests" badge={notif.friends} active={showFriends} onClick={e => { e.stopPropagation(); setShowFriends(p => !p); setShowDM(false); setShowNotif(false) }} tObj={tObj} />
          {showFriends && <div onClick={e => e.stopPropagation()}><FriendReqPanel onClose={() => setShowFriends(false)} onCount={n => setNotif(p => ({ ...p, friends: n }))} anchorRef={friendsBtnRef} /></div>}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifBtnRef}>
          <HBtn faIcon="fa-solid fa-bell" title="Notifications" badge={notif.notif} active={showNotif} onClick={e => { e.stopPropagation(); setShowNotif(p => !p); setShowDM(false) }} tObj={tObj} />
          {showNotif && <div onClick={e => e.stopPropagation()}><NotifPanel onClose={() => setShowNotif(false)} onCount={n => setNotif(p => ({ ...p, notif: n }))} anchorRef={notifBtnRef} /></div>}
        </div>

        {isStaffRole && <HBtn faIcon="fa-sharp fa-solid fa-flag" title="Reports" badge={notif.reports} tObj={tObj} />}

        {/* FIX 3: Avatar dropdown — fully coded inside header */}
        <AvatarDropdown
          me={me} status={status} setStatus={setStatus}
          onLeave={leave} socket={sockRef.current}
          onOpenSettings={() => setShowChatSettings(true)}
          onOpenProfile={() => setProf(me)}
          tObj={tObj}
          room={room}
        />
      </div>

      {/* ════ BODY ════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative', zIndex: 1 }}>

        {/* LEFT SIDEBAR — inline flex on desktop (compacts chat), fixed overlay on mobile */}
        {showLeft && (
          <>
            {/* Mobile backdrop */}
            <div
              onClick={() => setLeft(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 299,
                display: window.innerWidth < 768 ? 'block' : 'none' }}
            />
            {/* Sidebar container — relative on desktop so chat area shrinks, fixed on mobile */}
            <div style={{
              position: window.innerWidth < 768 ? 'fixed' : 'relative',
              left: 0,
              top: window.innerWidth < 768 ? 50 : 0,
              bottom: 0,
              zIndex: 300,
              display: 'flex',
              flexShrink: 0,
              height: window.innerWidth < 768 ? 'calc(100% - 50px)' : '100%',
            }}>
              <LeftSidebar
                room={room} nav={nav} socket={sockRef.current} roomId={room?._id || roomSlug}
                onClose={() => setLeft(false)} me={me} tObj={tObj}
                onStyleSaved={updated => { if (updated) { setMe(p => ({ ...p, ...updated })); if (updated.chatTheme) loadThemeCss(updated.chatTheme) } }}
                onOpenProfile={() => { setProf(me); setLeft(false) }}
                onOpenSettings={() => { setShowChatSettings(true); setLeft(false) }}
              />
            </div>
          </>
        )}

        {/* ── MESSAGES COLUMN ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, background: thBg }}>

          {/* Topic bar */}
          {room?.topic && (
            <div style={{ background: thHeader, borderBottom: `1px solid ${thBorder}22`, padding: '6px 12px', fontSize: '0.78rem', color: thText, flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <i className="fa-solid fa-circle-info" style={{ fontSize: 13, color: '#f59e0b', marginTop: 2, flexShrink: 0 }} />
              <span style={{ flex: 1, lineHeight: 1.5 }}>{room.topic}</span>
              <button onClick={() => setRoom(p => p ? { ...p, topic: '' } : p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 13, flexShrink: 0 }}>✕</button>
            </div>
          )}

          {/* FIX 4/7: Webcam panel — inside chat, not new page */}
          {showCam && (
            <WebcamPanel socket={sockRef.current} roomId={roomId} me={me}
              onClose={() => setShowCam(false)}
              onStarted={cam => setLiveCams(p => p.find(c => c.userId === cam.userId) ? p : [...p, cam])}
              onStopped={() => setLiveCams(p => p.filter(c => c.userId !== me?._id))} />
          )}
          <LiveCamBar socket={sockRef.current} roomId={roomId} me={me} liveCams={liveCams} setLiveCams={setLiveCams} onOpenHostPanel={() => setShowCam(true)} />

          {/* Scrollable messages */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 0', minHeight: 0 }}>
            {messages.map((m, i) => {
              // Suppress join/leave/kick/mute/ban/mod from chat display entirely
              if (['join','leave','kick','mute','ban','mod'].includes(m.type)) return null
              const isSys = ['system','dice','gift','warning','success','error'].includes(m.type)
              if (!isSys) {
                if (hiddenMsgs.has(m._id) || m._ignored) return null
                if (ignoredUsers.has(m.sender?._id) || ignoredUsers.has(m.sender?.userId)) return null
              }
              return (
                <Msg
                  key={m._id || i} msg={m} myId={me?._id} myLevel={myLevel} tObj={tObj}
                  onMiniCard={handleMiniCard} onMention={handleMention} onHide={handleHide}
                  onIgnore={handleIgnore}
                  onWhisper={u => { setWhisper(u); inputRef.current?.focus() }}
                  onQuote={msg => { setQuotedMsg(msg); inputRef.current?.focus() }}
                  onYTMinimize={v => setMiniYT(v)}
                  socket={sockRef.current} roomId={roomId}
                />
              )
            })}

            {/* Typing indicator */}
            {typers.filter(t => t !== me?.username).length > 0 && (
              <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: 4, height: 4, background: thAccent, borderRadius: '50%', display: 'inline-block', animation: `typingDot .8s ease-in-out ${i * 0.2}s infinite` }} />)}
                </div>
                <span style={{ fontSize: '0.7rem', color: thText + '88', fontStyle: 'italic' }}>
                  {typers.filter(t => t !== me?.username).join(', ')} typing...
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ════ INPUT BAR ════ */}
          <div style={{ borderTop: `1px solid ${thBorder}22`, padding: '5px 8px', background: thHeader, flexShrink: 0, position: 'relative', zIndex: 10 }}>

            {/* Auto-scroll toggle */}
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom: 3 }}>
              <button
                onClick={() => setAutoScroll(p => !p)}
                title={autoScroll ? 'Auto-scroll ON — click to disable' : 'Auto-scroll OFF — click to enable'}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, border:`1px solid ${autoScroll ? thAccent + '55' : 'rgba(255,255,255,0.1)'}`, background: autoScroll ? thAccent + '18' : 'transparent', color: autoScroll ? thAccent : '#555', fontSize:'0.65rem', fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
                <i className={`fa-solid fa-arrow-down-long`} style={{ fontSize:9 }} />
                {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
              </button>
            </div>

            {/* FIX 9: Whisper mode banner above input */}
            {whisperTarget && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 8, padding: '5px 10px', marginBottom: 5, borderLeft: '3px solid #6366f1' }}>
                <i className="fa-solid fa-hand-lizard" style={{ fontSize: 12, color: '#a78bfa', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#a78bfa' }}>
                    Whispering to <span style={{ color: '#c4b5fd' }}>{whisperTarget.username}</span>
                  </div>
                  <div style={{ fontSize: '0.63rem', color: '#6366f1' }}>Only they can see this</div>
                </div>
                <button onClick={() => setWhisper(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 14, padding: 0 }}>✕</button>
              </div>
            )}

            {/* Quote preview */}
            {quotedMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${thAccent}12`, border: `1px solid ${thAccent}30`, borderRadius: 8, padding: '5px 10px', marginBottom: 5, borderLeft: `3px solid ${thAccent}`, overflow: 'hidden' }}>
                <i className="fa-solid fa-reply-all" style={{ fontSize: 12, color: thAccent, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: thAccent, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Replying to {quotedMsg.sender?.username || 'Unknown'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: thText + '88', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {quotedMsg.type === 'image' ? '📷 Image' : quotedMsg.type === 'gif' ? '🖼️ GIF' : quotedMsg.type === 'voice' ? '🎤 Voice' : quotedMsg.type === 'youtube' ? '▶️ YouTube' : (quotedMsg.content || '').slice(0, 80) + ((quotedMsg.content || '').length > 80 ? '…' : '')}
                  </div>
                </div>
                <button type="button" onClick={() => setQuotedMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 14, padding: '0 2px', flexShrink: 0, lineHeight: 1 }}>✕</button>
              </div>
            )}

            {/* + popup menu */}
            {showPlus && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 'calc(100% + 5px)', left: 6, background: thHeader, borderRadius: 12, padding: 8, display: 'flex', gap: 6, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', zIndex: 200 }}>
                {[
                  { type: 'img',    icon: '/default_images/icons/upload.svg',  fallback: 'fa-solid fa-image',    label: 'Image',   action: () => { document.getElementById('cgz-img-input').click(); setShowPlus(false) } },
                  { type: 'img',    icon: '/default_images/icons/giphy.svg',   fallback: 'fa-solid fa-image',    label: 'GIF',     action: () => { setShowGif(p => !p); setShowPlus(false) } },
                  { type: 'emoji',  emoji: '🎨',                                label: 'Paint',                   action: () => { setShowPaint(true); setShowPlus(false) } },
                  { type: 'img',    icon: '/default_images/icons/youtube.svg', fallback: 'fa-brands fa-youtube', label: 'YouTube', action: () => { setShowYT(p => !p); setShowPlus(false) } },
                  { type: 'spotify',                                             label: 'Spotify',                 action: () => { setShowSpotify(p => !p); setShowPlus(false) }, active: showSpotify },
                  { type: 'emoji',  emoji: '🎲',                                label: 'Dice',                    action: () => {
                    if ((me?.gold || 0) < 100) { toast?.show('🎲 Need 100 gold!', 'error', 3000); setShowPlus(false); return }
                    sockRef.current?.emit('rollDice', { roomId }); setShowPlus(false)
                  }},
                ].map((b, i) => (
                  <button key={i} onClick={b.action} title={b.label}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '7px 8px', background: b.active ? `${thAccent}22` : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 9, cursor: 'pointer', minWidth: 44, transition: 'all .15s' }}>
                    {b.type === 'spotify'
                      ? <svg width="22" height="22" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 1 1-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 0 1 .207.857zm1.223-2.722a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.973-.52.779.779 0 0 1 .52-.972c3.633-1.102 8.147-.568 11.234 1.329a.78.78 0 0 1 .256 1.072zm.105-2.835C14.69 8.95 9.375 8.775 6.297 9.71a.937.937 0 1 1-.543-1.795c3.528-1.068 9.393-.861 13.098 1.332a.937.937 0 0 1-.938 1.62z" /></svg>
                      : b.type === 'emoji'
                        ? <span style={{ fontSize: 20 }}>{b.emoji}</span>
                        : <><img src={b.icon} alt={b.label} style={{ width: 20, height: 20, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} /><i className={b.fallback} style={{ display: 'none', fontSize: 18, color: '#666' }} /></>
                    }
                    <span style={{ fontSize: '0.6rem', fontWeight: 600, color: b.active ? thAccent : '#888' }}>{b.label}</span>
                  </button>
                ))}
              </div>
            )}

            {showGif     && <GifPicker onSelect={url => { sockRef.current?.emit('sendMessage', { roomId, content: url, type: 'gif' }); setShowGif(false) }} onClose={() => setShowGif(false)} />}
            {showYT      && <YTPanel onClose={() => setShowYT(false)} onSend={url => { sockRef.current?.emit('sendMessage', { roomId, content: url, type: 'youtube' }); setShowYT(false) }} />}
            {showSpotify && <SpotifyPanel onClose={() => setShowSpotify(false)} onSend={url => { sockRef.current?.emit('sendMessage', { roomId, content: url, type: 'spotify' }); setShowSpotify(false) }} />}
            {showPaint   && <PaintingCanvas onSend={url => { sockRef.current?.emit('sendMessage', { roomId, content: url, type: 'image' }); setShowPaint(false) }} onClose={() => setShowPaint(false)} />}
            {showEmoji   && <EmoticonPicker anchorRef={emojiBtnRef} tObj={tObj} onSelect={em => { setInput(p => p + em); inputRef.current?.focus() }} onClose={() => setShowEmoji(false)} />}

            <input id="cgz-img-input" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={async e => {
                const f = e.target.files[0]; if (!f) return; e.target.value = ''
                try {
                  const fd = new FormData(); fd.append('image', f)
                  const r = await fetch(`${API}/api/upload/image`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('cgz_token')}` }, body: fd })
                  const d = await r.json()
                  if (r.ok && d.url) sockRef.current?.emit('sendMessage', { roomId, content: d.url, type: 'image' })
                  else toast?.show('Image upload failed', 'error', 3000)
                } catch { toast?.show('Image upload failed', 'error', 3000) }
              }} />

            {/* Input row */}
            <form onSubmit={send} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <button type="button" onClick={e => { e.stopPropagation(); setShowPlus(p => !p); setShowEmoji(false) }}
                style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${thBorder}44`, background: showPlus ? `${thAccent}22` : 'rgba(255,255,255,0.06)', color: showPlus ? thAccent : '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, fontWeight: 700, lineHeight: 1, transition: 'all .15s' }}>+</button>

              <button ref={emojiBtnRef} type="button" onClick={e => { e.stopPropagation(); setShowEmoji(p => !p); setShowPlus(false) }}
                style={{ background: showEmoji ? `${thAccent}22` : 'none', border: `1px solid ${showEmoji ? thAccent + '55' : 'transparent'}`, borderRadius: 8, cursor: 'pointer', color: showEmoji ? thAccent : '#666', fontSize: 20, padding: '3px 4px', flexShrink: 0, display: 'flex', alignItems: 'center', lineHeight: 1, transition: 'all .15s' }}>
                <img src="/icons/emoticons/happy.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
                <i className="fa-regular fa-face-smile" style={{ display: 'none' }} />
              </button>

              <input
                ref={inputRef}
                dir="ltr"
                value={input}
                onChange={handleTyping}
                placeholder={whisperTarget ? `Whisper to ${whisperTarget.username}...` : (connected ? 'Type a message...' : 'Connecting...')}
                disabled={!connected}
                style={{
                  flex: 1, minWidth: 0, padding: '8px 12px',
                  background: whisperTarget ? 'rgba(99,102,241,0.12)' : (thBg || '#151515'),
                  border: `1px solid ${whisperTarget ? 'rgba(99,102,241,0.5)' : (thBorder || '#222')}`,
                  borderRadius: 22, color: thText || '#fff',
                  fontSize: '0.88rem', outline: 'none', transition: 'border-color .15s',
                  fontFamily: "'Nunito', sans-serif",
                  direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext',
                }}
                onFocus={e => e.target.style.borderColor = whisperTarget ? '#818cf8' : (thAccent || '#03add8')}
                onBlur={e  => e.target.style.borderColor = whisperTarget ? 'rgba(99,102,241,0.5)' : (thBorder || '#222')}
              />

              <button type="submit" disabled={!input.trim() || !connected}
                style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: input.trim() && connected ? (whisperTarget ? '#6366f1' : (thAccent || '#03add8')) : 'rgba(255,255,255,0.08)', color: input.trim() && connected ? '#fff' : '#444', cursor: input.trim() && connected ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, boxShadow: input.trim() && connected ? `0 2px 8px ${whisperTarget ? '#6366f1' : thAccent}55` : 'none', transition: 'all .15s' }}>
                <i className={whisperTarget ? 'fa-solid fa-hand-lizard' : 'fa-solid fa-paper-plane'} />
              </button>
            </form>
          </div>
        </div>

        {/* FIX 4/8: RIGHT SIDEBAR — overlay drawer */}
        {showRight && (
          <>
            <div onClick={() => setRight(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 299, display: window.innerWidth < 768 ? 'block' : 'none' }} />
            <div style={{ position: window.innerWidth < 768 ? 'fixed' : 'relative', right: 0, top: window.innerWidth < 768 ? 50 : 0, bottom: 0, zIndex: 300 }}>
              <RightSidebar
                users={users} myId={me?._id} myLevel={myLevel} tObj={tObj}
                onUserClick={(u, e) => {
                  if (u._id === me?._id || u.userId === me?._id) setProf(u)
                  else handleMiniCard(u, { x: Math.min((e?.clientX || 200), window.innerWidth - 225), y: Math.min((e?.clientY || 100), window.innerHeight - 310) })
                }}
                onWhisper={u => { setWhisper(u); inputRef.current?.focus() }}
                onClose={() => setRight(false)}
              />
            </div>
          </>
        )}
      </div>

      {/* ════ FOOTER — sticky (flex item, never scrolls) ════ */}
      <div style={{ flexShrink: 0, zIndex: 200, position: 'relative' }}>
        {showRadio && <div onClick={e => e.stopPropagation()}><RadioPanel onClose={() => setRadio(false)} /></div>}
        {miniYT && (
          <div style={{ position: 'absolute', bottom: '100%', right: 8, background: thHeader, border: `1px solid ${thBorder}33`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 -4px 16px rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', maxWidth: 280 }}>
            <div style={{ width: 36, height: 24, background: '#000', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }} onClick={() => setMiniYT(null)}>
              <img src={`https://img.youtube.com/vi/${miniYT.id}/default.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 700, flex: 1 }}>▶ Playing</span>
            <button onClick={() => setMiniYT(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
          </div>
        )}
        <Footer showRadio={showRadio} setShowRadio={setRadio} showRight={showRight} setRight={setRight} notif={notif} tObj={tObj} />
      </div>

      {/* ════ OVERLAYS — all inside chatroom, no new pages ════ */}
      {showChatSettings && (
        <div onClick={e => e.stopPropagation()}>
          <ChatSettingsOverlay me={me} onClose={() => setShowChatSettings(false)}
            onSaved={updated => { if (updated) { setMe(p => ({ ...p, ...updated })); if (updated.chatTheme) loadThemeCss(updated.chatTheme) } }} />
        </div>
      )}

      {showDiceAnim && diceRollVal && <DiceRoll value={diceRollVal} onDone={() => { setShowDiceAnim(false); setDiceRollVal(null) }} />}

      {profUser && (profUser._id === me?._id
        ? <SelfProfileOverlay user={me} onClose={() => setProf(null)} onUpdated={u => { if (u) setMe(p => ({ ...p, ...u })) }} />
        : <ProfileModal user={profUser} myId={me?._id} myLevel={myLevel} socket={sockRef.current} roomId={roomId}
            onClose={() => setProf(null)} onGift={u => setGiftTgt(u)} ignoredUsers={ignoredUsers}
            onIgnore={handleIgnore} onWhisper={u => { setWhisper(u); setProf(null); inputRef.current?.focus() }} />
      )}

      {miniCardData?.user && (
        <MiniCard
          user={miniCardData.user} myId={me?._id} myLevel={myLevel} pos={miniCardData.pos}
          socket={sockRef.current} roomId={roomId} ignoredUsers={ignoredUsers} onIgnore={handleIgnore}
          onClose={() => setMiniCardData(null)} onFull={() => { setProf(miniCardData.user); setMiniCardData(null) }}
          tObj={tObj} liveCamUsers={users.filter(u => u.isCamHost).map(u => u._id || u.userId)}
          onGift={u => { setGiftTgt(u); setMiniCardData(null) }}
          onWhisper={u => { setWhisper(u); setMiniCardData(null); inputRef.current?.focus() }}
        />
      )}

      {giftTarget && (
        <GiftPanel targetUser={giftTarget} myGold={me?.gold || 0}
          onClose={() => setGiftTgt(null)} onSent={() => setGiftTgt(null)}
          socket={sockRef.current} roomId={roomId}
          onGoldSpent={price => setMe(p => p ? { ...p, gold: Math.max(0, (p.gold || 0) - price) } : p)} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes typingDot { 0%,80%,100%{transform:scale(.8);opacity:.5} 40%{transform:scale(1.1);opacity:1} }
        @keyframes diceShake { 0%,100%{transform:translate(-50%,-50%) rotate(0deg)} 25%{transform:translate(-48%,-52%) rotate(-8deg)} 75%{transform:translate(-52%,-48%) rotate(8deg)} }
        @keyframes diceBounce { 0%{transform:translate(-50%,-50%) scale(1.2)} 50%{transform:translate(-50%,-55%) scale(0.95)} 100%{transform:translate(-50%,-50%) scale(1)} }
        * { -webkit-tap-highlight-color: transparent; }
        input, textarea, select { font-size: 16px !important; }
        body { overflow: hidden !important; }
      `}</style>
    </div>
  )
}
