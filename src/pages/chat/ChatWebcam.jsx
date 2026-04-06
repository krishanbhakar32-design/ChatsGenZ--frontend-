// ============================================================
// ChatWebcam.jsx — Full-featured Live Webcam System
//
// HOST PANEL (WebcamPanel):
//   - Draggable/movable to any corner
//   - Header: rank icon + host name (left) | close button (right)
//   - High-quality video preview with CSS filters
//   - Footer: Mic toggle | Cam toggle | Settings (dropdown with:
//       camera change, cam privacy by rank, lock cam with pwd,
//       blocked viewers list) | Viewer list icon (dropdown with
//       viewers: dp+username+rank+color+block btn+timestamp)
//   - Go Live / Stop Live button
//
// VIEWER MODAL (WatchModal):
//   - Draggable to any corner
//   - Header: rank icon + host name (left) | minimize btn | close btn (right)
//   - Minimize: collapses to avatar bubble in footer, cam stays connected
//   - Footer: Mic toggle | Gift button | Report button
//
// SIGNALING: same as before (camOffer/camAnswer/camIceCandidate)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { API } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'
import { RANKS, RL, resolveNameColor } from './chatConstants.js'

// ── ICE config ────────────────────────────────────────────────
const ICE_CFG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
}

// ── Camera filters ─────────────────────────────────────────────
const FILTERS = [
  { id: 'none',                                             label: 'Normal',  emoji: '🎥' },
  { id: 'grayscale(100%)',                                  label: 'B&W',     emoji: '⬛' },
  { id: 'sepia(80%)',                                       label: 'Sepia',   emoji: '🟤' },
  { id: 'hue-rotate(90deg) saturate(150%)',                 label: 'Vivid',   emoji: '🌈' },
  { id: 'contrast(140%) brightness(110%)',                  label: 'Sharp',   emoji: '🔆' },
  { id: 'blur(1.5px)',                                      label: 'Soft',    emoji: '🌫️' },
  { id: 'hue-rotate(200deg) saturate(180%)',                label: 'Cool',    emoji: '🔵' },
  { id: 'hue-rotate(320deg) saturate(200%)',                label: 'Warm',    emoji: '🔴' },
  { id: 'brightness(1.3) contrast(1.1) saturate(1.3)',      label: 'Bright',  emoji: '✨' },
  { id: 'invert(10%) hue-rotate(180deg)',                   label: 'Dream',   emoji: '💫' },
]

const tok = () => localStorage.getItem('cgz_token')
const BG = '#0a0a15', BG2 = '#07070f', BD = 'rgba(255,255,255,0.08)', C = '#e0e0f0'

// ─────────────────────────────────────────────────────────────
// useDraggable — returns ref + pos + mousedown handler
// ─────────────────────────────────────────────────────────────
function useDraggable(defaultPos = null) {
  const elRef   = useRef(null)
  const drag    = useRef({ on: false, sx: 0, sy: 0, ox: 0, oy: 0, moved: false })
  const [pos, setPos] = useState(defaultPos)

  const onHeaderMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    e.preventDefault(); e.stopPropagation()
    const el = elRef.current; if (!el) return
    const r = el.getBoundingClientRect()
    drag.current = { on: true, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, moved: false }
    const mm = ev => {
      if (!drag.current.on) return
      const dx = ev.clientX - drag.current.sx, dy = ev.clientY - drag.current.sy
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.current.moved = true
      setPos({
        x: Math.max(0, Math.min(drag.current.ox + dx, window.innerWidth  - el.offsetWidth)),
        y: Math.max(0, Math.min(drag.current.oy + dy, window.innerHeight - el.offsetHeight)),
      })
    }
    const mu = () => { drag.current.on = false; document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu) }
    document.addEventListener('mousemove', mm)
    document.addEventListener('mouseup',   mu)
  }, [])

  const posStyle = pos
    ? { position: 'fixed', left: pos.x, top: pos.y, transform: 'none' }
    : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }

  const wasMoved = () => {
    if (drag.current.moved) { drag.current.moved = false; return true }
    return false
  }

  return { elRef, posStyle, onHeaderMouseDown, wasMoved }
}

// ═══════════════════════════════════════════════════════════════
// LiveCamBar — horizontal strip above messages
// ═══════════════════════════════════════════════════════════════
export function LiveCamBar({ socket, roomId, me, liveCams, setLiveCams, onOpenHostPanel, users = [] }) {
  const [watching,       setWatching]    = useState(null)
  const [showWatchModal, setShowWatch]   = useState(false)
  const watchVideoRef  = useRef(null)
  const peerConns      = useRef({})
  const hostSockRef    = useRef(null)

  // socket listeners (viewer side)
  useEffect(() => {
    if (!socket) return
    const onOffer  = ({ from, username: hn, hostRank, offer, socketId: hs }) => {
      if (offer === 'live') {
        setLiveCams(p => p.find(c => c.userId === from) ? p : [...p, { userId: from, username: hn, rank: hostRank || 'user' }])
        return
      }
      if (!watching || watching.userId !== from) return
      hostSockRef.current = hs
      receiveOffer(from, offer, hs)
    }
    const onIce     = ({ from, candidate }) => { const pc = peerConns.current[from]; if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {}) }
    const onStarted = ({ userId, username, rank }) => setLiveCams(p => p.find(c => c.userId === userId) ? p : [...p, { userId, username, rank: rank || 'user' }])
    const onStopped = ({ userId }) => { setLiveCams(p => p.filter(c => c.userId !== userId)); if (watching?.userId === userId) closeWatch() }
    const onBlocked = () => closeWatch()

    socket.on('camOffer',        onOffer)
    socket.on('camIceCandidate', onIce)
    socket.on('camStarted',      onStarted)
    socket.on('camStopped',      onStopped)
    socket.on('camBlocked',      onBlocked)
    return () => {
      socket.off('camOffer',        onOffer)
      socket.off('camIceCandidate', onIce)
      socket.off('camStarted',      onStarted)
      socket.off('camStopped',      onStopped)
      socket.off('camBlocked',      onBlocked)
    }
  }, [socket, watching])

  async function receiveOffer(hostUserId, offer, hs) {
    peerConns.current[hostUserId]?.close()
    const pc = new RTCPeerConnection(ICE_CFG)
    peerConns.current[hostUserId] = pc
    pc.ontrack = ({ streams }) => {
      if (watchVideoRef.current && streams[0]) {
        watchVideoRef.current.srcObject = streams[0]
        watchVideoRef.current.play().catch(() => {})
      }
    }
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        const t = hs || hostSockRef.current
        if (t) socket?.emit('camIceCandidate', { toSocketId: t, candidate })
      }
    }
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    socket?.emit('camAnswer', { toSocketId: hs || hostSockRef.current, answer })
  }

  function openWatch(cam) {
    if (cam.userId === me?._id) { onOpenHostPanel(); return }
    closeWatch()
    setWatching(cam)
    setShowWatch(true)
    socket?.emit('watchCam', { roomId, hostUserId: cam.userId })
  }

  function closeWatch() {
    if (watching) socket?.emit('stopWatchingCam', { hostUserId: watching.userId })
    peerConns.current[watching?.userId]?.close()
    if (watching?.userId) delete peerConns.current[watching.userId]
    hostSockRef.current = null
    setWatching(null); setShowWatch(false)
    if (watchVideoRef.current) watchVideoRef.current.srcObject = null
  }

  if (liveCams.length === 0) return null

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'linear-gradient(90deg,#0f0a1a,#120a20)', borderBottom: '1px solid rgba(167,139,250,0.2)', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'thin' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, fontSize: '0.62rem', fontWeight: 800, color: '#ef4444', letterSpacing: '.5px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'block', animation: 'cgzPulse 1.5s infinite' }} />
          LIVE
        </div>
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {liveCams.map(cam => {
            const u = users.find(u => (u._id || u.userId) === cam.userId)
            return (
              <CamThumb key={cam.userId} cam={cam} user={u} isMe={cam.userId === me?._id} isWatching={watching?.userId === cam.userId} onClick={() => openWatch(cam)} />
            )
          })}
        </div>
        {!liveCams.some(c => c.userId === me?._id) && (
          <button onClick={onOpenHostPanel} style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}>
            <i className="fa-solid fa-circle-play" style={{ fontSize: 11 }} />Go Live
          </button>
        )}
      </div>

      {showWatchModal && watching && (
        <WatchModal cam={watching} videoRef={watchVideoRef} onClose={closeWatch} socket={socket} roomId={roomId} me={me} />
      )}

      <CGZStyles />
    </>
  )
}

function CamThumb({ cam, user, isMe, isWatching, onClick }) {
  const avatarUrl = user?.avatar ? user.avatar : '/default_images/avatar/default_avatar.png'
  return (
    <button onClick={onClick} title={isMe ? 'Your live cam' : `Watch ${cam.username}`}
      style={{ position: 'relative', flexShrink: 0, width: 54, height: 40, border: `2px solid ${isWatching ? '#a78bfa' : isMe ? '#22c55e' : 'rgba(255,255,255,0.2)'}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: '#000', padding: 0, transition: 'all .15s' }}
      onMouseEnter={e => { if (!isWatching) e.currentTarget.style.borderColor = '#a78bfa' }}
      onMouseLeave={e => { if (!isWatching) e.currentTarget.style.borderColor = isMe ? '#22c55e' : 'rgba(255,255,255,0.2)' }}
    >
      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1a0a2e,#0f0a1a)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <img src={avatarUrl} alt={cam.username} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.src = '/default_images/avatar/default_avatar.png' }} />
        <span style={{ fontSize: '0.46rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, maxWidth: 48, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{cam.username}</span>
      </div>
      <span style={{ position: 'absolute', top: 2, left: 2, width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'cgzPulse 1.5s infinite' }} />
      {isMe && <span style={{ position: 'absolute', bottom: 1, right: 2, fontSize: '0.42rem', color: '#22c55e', fontWeight: 800 }}>YOU</span>}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// WatchModal — viewer's draggable cam window
// ═══════════════════════════════════════════════════════════════
function WatchModal({ cam, videoRef, onClose, socket, roomId, me }) {
  const [muted,       setMuted]     = useState(false)
  const [minimized,   setMinimized] = useState(false)
  const [showGift,    setShowGift]  = useState(false)
  const [showReport,  setShowReport]= useState(false)

  const { elRef, posStyle, onHeaderMouseDown, wasMoved } = useDraggable()

  const avatarUrl = cam.avatar || '/default_images/avatar/default_avatar.png'

  if (minimized) {
    return (
      <>
        {/* Minimized avatar bubble in footer area */}
        <div style={{ position: 'fixed', bottom: 70, left: 16, zIndex: 820, cursor: 'pointer' }}
          onClick={() => setMinimized(false)}
          title={`${cam.username} — click to restore`}
        >
          <div style={{ position: 'relative', width: 52, height: 52 }}>
            <img src={avatarUrl} alt={cam.username} style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid #a78bfa', objectFit: 'cover', boxShadow: '0 4px 20px rgba(0,0,0,0.7)' }} onError={e => { e.target.src = '/default_images/avatar/default_avatar.png' }} />
            <span style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#ef4444', border: '2px solid #0a0a15', animation: 'cgzPulse 1.5s infinite' }} />
            <span style={{ position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.7)', padding: '1px 5px', borderRadius: 4 }}>{cam.username}</span>
          </div>
        </div>
        <CGZStyles />
      </>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={() => { if (!wasMoved()) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 818, background: 'rgba(0,0,0,0.6)' }} />

      <div ref={elRef} onClick={e => e.stopPropagation()}
        style={{ ...posStyle, width: 'min(480px, 96vw)', zIndex: 819, background: BG, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(167,139,250,0.2)', display: 'flex', flexDirection: 'column', userSelect: 'none' }}
      >
        {/* Header — draggable */}
        <div onMouseDown={onHeaderMouseDown}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'rgba(0,0,0,0.5)', borderBottom: `1px solid ${BD}`, cursor: 'grab', flexShrink: 0 }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'cgzPulse 1.5s infinite', flexShrink: 0 }} />
          <RIcon rank={cam.rank || 'user'} size={16} />
          <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 800, color: '#fff', fontFamily: 'Outfit,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cam.username}
          </span>
          <span style={{ background: 'rgba(239,68,68,0.18)', color: '#ef4444', fontSize: '0.56rem', fontWeight: 800, padding: '2px 8px', borderRadius: 8, letterSpacing: '.5px', flexShrink: 0 }}>● LIVE</span>

          {/* Minimize */}
          <button onMouseDown={e => e.stopPropagation()} onClick={() => setMinimized(true)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 15, cursor: 'pointer', padding: '0 3px', lineHeight: 1, flexShrink: 0, marginLeft: 4 }}
            title="Minimize"
          >
            <i className="fa-solid fa-window-minimize" />
          </button>

          {/* Close */}
          <button onMouseDown={e => e.stopPropagation()} onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 17, cursor: 'pointer', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
            title="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Video */}
        <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9', overflow: 'hidden' }}>
          <video ref={videoRef} autoPlay playsInline muted={muted}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <ConnectingOverlay videoRef={videoRef} />

          {/* Volume */}
          <button onClick={() => setMuted(p => !p)}
            style={{ position: 'absolute', bottom: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className={`fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}`} />
          </button>
        </div>

        {/* Footer — viewer controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(0,0,0,0.4)', borderTop: `1px solid ${BD}` }}>
          {/* Mic toggle */}
          <button onClick={() => setMuted(p => !p)} title={muted ? 'Unmute' : 'Mute'}
            style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${BD}`, background: muted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)', color: muted ? '#ef4444' : 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <i className={`fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}`} />
          </button>

          {/* Gift */}
          <button onClick={() => setShowGift(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: 'rgba(236,72,153,0.13)', border: '1px solid rgba(236,72,153,0.28)', color: '#ec4899', fontWeight: 700, fontSize: '0.77rem', cursor: 'pointer' }}
          >
            <img src="/default_images/icons/gift.svg" alt="Gift" style={{ width: 15, height: 15 }} onError={e => { e.target.style.display='none' }} />
            Gift
          </button>

          {/* Report */}
          <button onClick={() => setShowReport(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.22)', color: '#ef4444', fontWeight: 700, fontSize: '0.77rem', cursor: 'pointer' }}
          >
            <i className="fa-solid fa-flag" style={{ fontSize: 12 }} />
            Report
          </button>

          {/* Leave */}
          <button onClick={onClose}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 15px', borderRadius: 9, background: 'rgba(255,255,255,0.07)', border: `1px solid ${BD}`, color: 'rgba(255,255,255,0.65)', fontWeight: 700, fontSize: '0.77rem', cursor: 'pointer' }}
          >
            <i className="fa-solid fa-circle-left" style={{ fontSize: 12 }} />
            Leave
          </button>
        </div>
      </div>

      {showGift   && <ViewerGiftModal   hostUser={cam} onClose={() => setShowGift(false)}   socket={socket} roomId={roomId} />}
      {showReport && <ViewerReportModal targetUser={cam} onClose={() => setShowReport(false)} socket={socket} roomId={roomId} />}

      <CGZStyles />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// WebcamPanel — host's draggable live control panel
// ═══════════════════════════════════════════════════════════════
export function WebcamPanel({ socket, roomId, me, onClose, onStarted, onStopped, users = [] }) {
  const hostVideoRef = useRef(null)
  const streamRef    = useRef(null)
  const peerConns    = useRef({})

  const [hosting,        setHosting]       = useState(false)
  const [viewers,        setViewers]       = useState([])
  const [devices,        setDevices]       = useState([])
  const [selCam,         setSelCam]        = useState('')
  const [micOn,          setMicOn]         = useState(true)
  const [camOn,          setCamOn]         = useState(true)
  const [filter,         setFilter]        = useState('none')
  const [showSettings,   setShowSettings]  = useState(false)
  const [showFilterMenu, setFilterMenu]    = useState(false)
  const [showViewerList, setViewerList]    = useState(false)
  const [settingsTab,    setSettingsTab]   = useState('camera') // camera | privacy | lock | blocked
  const [privacyRank,    setPrivacyRank]   = useState('guest')  // min rank to view
  const [lockPwd,        setLockPwd]       = useState('')
  const [lockInput,      setLockInput]     = useState('')
  const [camLocked,      setCamLocked]     = useState(false)
  const [blockedList,    setBlockedList]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('cgz_cam_blocked') || '[]') } catch { return [] }
  })
  const [confirmBlock,   setConfirmBlock]  = useState(null) // viewer obj to confirm block
  const [lockError,      setLockError]     = useState('')

  const { elRef, posStyle, onHeaderMouseDown, wasMoved } = useDraggable()

  const RANKS_LIST = Object.entries(RANKS).filter(([k]) => !['bot'].includes(k))

  // enumerate devices
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devs => {
      const v = devs.filter(d => d.kind === 'videoinput')
      setDevices(v)
      if (v[0]) setSelCam(v[0].deviceId)
    }).catch(() => {})
    return () => { if (hosting) stopHost() }
  }, [])

  // socket events (host side)
  useEffect(() => {
    if (!socket) return
    const onViewerJoined = ({ viewerId, viewerName, viewerRank, viewerSocketId }) => {
      const bl = JSON.parse(localStorage.getItem('cgz_cam_blocked') || '[]')
      if (bl.includes(viewerId)) { socket.emit('camBlockViewer', { viewerSocketId }); return }

      // privacy rank check
      const minLevel = RL(privacyRank)
      if (RL(viewerRank || 'guest') < minLevel) { socket.emit('camBlockViewer', { viewerSocketId }); return }

      setViewers(p => [...p.filter(v => v.viewerId !== viewerId), {
        viewerId, viewerName, viewerRank: viewerRank || 'user', viewerSocketId,
        joinedAt: new Date(),
      }])
      createOffer(viewerSocketId, viewerId)
    }
    const onViewerLeft  = ({ viewerId }) => {
      setViewers(p => p.filter(v => v.viewerId !== viewerId))
      peerConns.current[viewerId]?.close()
      delete peerConns.current[viewerId]
    }
    const onCamAnswer   = ({ from, answer }) => { peerConns.current[from]?.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => {}) }
    const onCamIce      = ({ from, candidate }) => { const pc = peerConns.current[from]; if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {}) }

    socket.on('camViewerJoined', onViewerJoined)
    socket.on('camViewerLeft',   onViewerLeft)
    socket.on('camAnswer',       onCamAnswer)
    socket.on('camIceCandidate', onCamIce)
    return () => {
      socket.off('camViewerJoined', onViewerJoined)
      socket.off('camViewerLeft',   onViewerLeft)
      socket.off('camAnswer',       onCamAnswer)
      socket.off('camIceCandidate', onCamIce)
    }
  }, [socket, privacyRank])

  async function createOffer(viewerSocketId, viewerId) {
    const pc = new RTCPeerConnection(ICE_CFG)
    peerConns.current[viewerId] = pc
    streamRef.current?.getTracks().forEach(t => pc.addTrack(t, streamRef.current))
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket?.emit('camIceCandidate', { toSocketId: viewerSocketId, candidate })
    }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket?.emit('camOffer', { toSocketId: viewerSocketId, offer })
  }

  async function startHost() {
    // if locked, don't start — lock means viewers need pwd but host still goes live
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selCam ? { deviceId: { exact: selCam }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })
      streamRef.current = stream
      if (hostVideoRef.current) { hostVideoRef.current.srcObject = stream; hostVideoRef.current.play().catch(() => {}) }
      setHosting(true)
      socket?.emit('startCam',  { roomId, rank: me?.rank, username: me?.username })
      socket?.emit('camOffer',  { roomId, offer: 'live', rank: me?.rank, username: me?.username })
      fetch(`${API}/api/webcam/start`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId }) }).catch(() => {})
      onStarted?.({ userId: me?._id, username: me?.username, rank: me?.rank })
    } catch (e) { alert('Camera error: ' + e.message) }
  }

  function stopHost() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (hostVideoRef.current) hostVideoRef.current.srcObject = null
    Object.values(peerConns.current).forEach(pc => pc.close())
    peerConns.current = {}
    setHosting(false); setViewers([])
    socket?.emit('camStopped', { roomId })
    socket?.emit('stopCam',    { roomId })
    fetch(`${API}/api/webcam/stop`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId }) }).catch(() => {})
    onStopped?.()
  }

  function toggleMic() {
    const t = streamRef.current?.getAudioTracks()[0]
    if (t) { t.enabled = !t.enabled; setMicOn(p => !p) }
  }
  function toggleCam() {
    const t = streamRef.current?.getVideoTracks()[0]
    if (t) { t.enabled = !t.enabled; setCamOn(p => !p) }
  }

  function switchCamera(deviceId) {
    setSelCam(deviceId)
    if (!hosting) return
    navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }).then(ns => {
      const newTrack = ns.getVideoTracks()[0]
      Object.values(peerConns.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender) sender.replaceTrack(newTrack)
      })
      const old = streamRef.current?.getVideoTracks()[0]
      if (old) { streamRef.current.removeTrack(old); old.stop() }
      streamRef.current?.addTrack(newTrack)
      if (hostVideoRef.current) hostVideoRef.current.srcObject = streamRef.current
    }).catch(() => {})
  }

  function blockViewer(v) {
    setConfirmBlock(v)
  }

  function confirmBlockViewer() {
    if (!confirmBlock) return
    const v = confirmBlock
    const nb = [...new Set([...blockedList, v.viewerId])]
    setBlockedList(nb)
    localStorage.setItem('cgz_cam_blocked', JSON.stringify(nb))
    if (v.viewerSocketId) socket?.emit('camBlockViewer', { viewerSocketId: v.viewerSocketId })
    setViewers(p => p.filter(x => x.viewerId !== v.viewerId))
    peerConns.current[v.viewerId]?.close()
    delete peerConns.current[v.viewerId]
    setConfirmBlock(null)
  }

  function unblockUser(userId) {
    const nb = blockedList.filter(id => id !== userId)
    setBlockedList(nb)
    localStorage.setItem('cgz_cam_blocked', JSON.stringify(nb))
  }

  function saveLock() {
    if (lockInput.length < 6) { setLockError('Min 6 characters required'); return }
    setLockPwd(lockInput); setCamLocked(true); setLockError('')
    socket?.emit('camSetLock', { roomId, locked: true })
  }

  function removeLock() {
    setLockPwd(''); setCamLocked(false); setLockInput('')
    socket?.emit('camSetLock', { roomId, locked: false })
  }

  // viewer list lookup with full user info from room users
  const enrichedViewers = viewers.map(v => {
    const u = users.find(u => (u._id || u.userId) === v.viewerId) || {}
    return { ...v, avatar: u.avatar, nameColor: resolveNameColor(u.nameColor) }
  })

  // blocked list with user info
  const enrichedBlocked = blockedList.map(id => {
    const u = users.find(u => (u._id || u.userId) === id) || {}
    return { id, username: u.username || 'Unknown', rank: u.rank || 'user', avatar: u.avatar }
  })

  const TBtn = ({ on, onIcon, offIcon, onClick, title, danger }) => (
    <button onClick={onClick} title={title}
      style={{ width: 40, height: 40, border: 'none', borderRadius: 10, cursor: 'pointer', background: on ? 'rgba(255,255,255,0.1)' : danger ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <i className={on ? onIcon : offIcon} style={{ fontSize: 14, color: '#fff' }} />
    </button>
  )

  return (
    <>
      <div onClick={() => { if (!wasMoved()) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 810, background: 'rgba(0,0,0,0.5)' }} />

      <div ref={elRef} onClick={e => e.stopPropagation()}
        style={{ ...posStyle, width: 'min(460px, 96vw)', maxHeight: 'calc(100dvh - 40px)', zIndex: 811, background: BG, borderRadius: 16, boxShadow: '0 20px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(167,139,250,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}
      >
        {/* ── HEADER ── */}
        <div onMouseDown={onHeaderMouseDown}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${BD}`, flexShrink: 0, background: 'rgba(0,0,0,0.4)', cursor: 'grab' }}
        >
          <i className="fa-solid fa-grip-dots-vertical" style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
          <RIcon rank={me?.rank || 'user'} size={16} />
          <span style={{ flex: 1, fontSize: '0.83rem', fontWeight: 800, color: C, fontFamily: 'Outfit,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {me?.username || 'You'}{hosting ? ' — LIVE' : ' — Camera'}
          </span>
          {hosting && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.55rem', fontWeight: 800, padding: '2px 7px', borderRadius: 8, animation: 'cgzPulse 1.5s infinite' }}>● LIVE</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="fa-solid fa-eye" style={{ fontSize: 8 }} />{viewers.length}
              </span>
            </span>
          )}
          <button onMouseDown={e => e.stopPropagation()} onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 17, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Viewer list sidebar (when hosting) */}
          {hosting && (
            <div style={{ width: 96, background: BG2, borderRight: `1px solid ${BD}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '6px 8px', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
                <span style={{ fontSize: '0.57rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                  Viewers ({viewers.length})
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
                {viewers.length === 0 ? (
                  <div style={{ padding: '14px 6px', textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: '0.6rem' }}>No viewers yet</div>
                ) : enrichedViewers.map(v => (
                  <div key={v.viewerId} style={{ display: 'flex', alignItems: 'center', padding: '5px 6px', gap: 4, borderBottom: `1px solid ${BD}` }}>
                    <img src={v.avatar || '/default_images/avatar/default_avatar.png'} alt={v.viewerName} style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.src = '/default_images/avatar/default_avatar.png' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <RIcon rank={v.viewerRank} size={10} />
                        <span style={{ fontSize: '0.6rem', color: v.nameColor || C, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.viewerName}</span>
                      </div>
                      <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.25)' }}>
                        {v.joinedAt ? new Date(v.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <button onClick={() => blockViewer(v)} title="Block from cam"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(239,68,68,0.4)', fontSize: 10, flexShrink: 0, lineHeight: 1 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(239,68,68,0.4)'}
                    >
                      <i className="fa-solid fa-user-slash" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Camera + controls */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Camera preview */}
            <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9', flexShrink: 0, overflow: 'hidden', maxHeight: 240 }}>
              <video ref={hostVideoRef} autoPlay muted playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter }} />
              {!hosting && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)', flexDirection: 'column', gap: 10 }}>
                  <i className="fa-solid fa-video" style={{ fontSize: 28, color: 'rgba(255,255,255,0.12)' }} />
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>Camera preview</span>
                </div>
              )}
              {!camOn && hosting && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-video-slash" style={{ fontSize: 26, color: 'rgba(255,255,255,0.3)' }} />
                </div>
              )}
              {/* Filter overlay menu */}
              {showFilterMenu && (
                <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(5,5,15,0.97)', borderRadius: 10, padding: '7px 5px', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4, zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {FILTERS.map(f => (
                    <button key={f.id} onClick={() => { setFilter(f.id); setFilterMenu(false) }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '5px 3px', borderRadius: 6, border: `1.5px solid ${filter === f.id ? '#a78bfa' : 'rgba(255,255,255,0.07)'}`, background: filter === f.id ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', fontSize: '0.54rem', color: filter === f.id ? '#a78bfa' : 'rgba(255,255,255,0.5)', fontWeight: 700 }}
                    >
                      <span style={{ fontSize: 12 }}>{f.emoji}</span>{f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── FOOTER CONTROLS ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: BG2, borderTop: `1px solid ${BD}`, flexShrink: 0, position: 'relative' }}>
              {hosting ? (
                <>
                  {/* Mic */}
                  <TBtn on={micOn} onIcon="fa-solid fa-microphone-lines" offIcon="fa-solid fa-microphone-slash" onClick={toggleMic} title={micOn ? 'Mute mic' : 'Unmute mic'} />
                  {/* Cam */}
                  <TBtn on={camOn} onIcon="fa-solid fa-video" offIcon="fa-solid fa-video-slash" onClick={toggleCam} title={camOn ? 'Turn off cam' : 'Turn on cam'} />
                  {/* Filters */}
                  <button onClick={() => { setFilterMenu(p => !p); setShowSettings(false) }} title="Filters"
                    style={{ width: 40, height: 40, border: `1.5px solid ${showFilterMenu ? '#a78bfa' : BD}`, borderRadius: 10, cursor: 'pointer', background: showFilterMenu ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 13, color: showFilterMenu ? '#a78bfa' : 'rgba(255,255,255,0.45)' }} />
                  </button>
                  {/* Settings dropdown trigger */}
                  <button onClick={() => { setShowSettings(p => !p); setFilterMenu(false) }} title="Settings"
                    style={{ width: 40, height: 40, border: `1.5px solid ${showSettings ? '#60a5fa' : BD}`, borderRadius: 10, cursor: 'pointer', background: showSettings ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                    <i className="fa-solid fa-gear" style={{ fontSize: 13, color: showSettings ? '#60a5fa' : 'rgba(255,255,255,0.45)' }} />
                  </button>
                  {/* Viewer list icon */}
                  <button onClick={() => { setViewerList(p => !p); setShowSettings(false); setFilterMenu(false) }} title="Viewer list"
                    style={{ width: 40, height: 40, border: `1.5px solid ${showViewerList ? '#22c55e' : BD}`, borderRadius: 10, cursor: 'pointer', background: showViewerList ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                    <i className="fa-solid fa-users" style={{ fontSize: 13, color: showViewerList ? '#22c55e' : 'rgba(255,255,255,0.45)' }} />
                    {viewers.length > 0 && (
                      <span style={{ position: 'absolute', top: -4, right: -4, background: '#22c55e', color: '#000', fontSize: '0.52rem', fontWeight: 800, padding: '1px 4px', borderRadius: 8, minWidth: 14, textAlign: 'center' }}>{viewers.length}</span>
                    )}
                  </button>

                  <button onClick={stopHost}
                    style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.74rem', flexShrink: 0 }}>
                    <i className="fa-solid fa-circle-stop" style={{ marginRight: 5 }} />Stop
                  </button>
                </>
              ) : (
                <>
                  {/* Settings before going live */}
                  <button onClick={() => setShowSettings(p => !p)} title="Settings"
                    style={{ width: 40, height: 40, border: `1.5px solid ${showSettings ? '#60a5fa' : BD}`, borderRadius: 10, cursor: 'pointer', background: showSettings ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-gear" style={{ fontSize: 13, color: showSettings ? '#60a5fa' : 'rgba(255,255,255,0.45)' }} />
                  </button>
                  <button onClick={startHost}
                    style={{ marginLeft: 'auto', padding: '8px 20px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem', boxShadow: '0 2px 14px rgba(124,58,237,.4)' }}>
                    <i className="fa-solid fa-circle-play" style={{ marginRight: 6 }} />Go Live
                  </button>
                </>
              )}
            </div>

            {/* ── SETTINGS DROPDOWN ── */}
            {showSettings && (
              <div style={{ background: 'rgba(5,5,12,0.97)', borderTop: `1px solid ${BD}`, flexShrink: 0, overflow: 'hidden' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${BD}` }}>
                  {[
                    { id: 'camera',  icon: 'fa-solid fa-video',         label: 'Camera' },
                    { id: 'privacy', icon: 'fa-solid fa-eye',            label: 'Privacy' },
                    { id: 'lock',    icon: 'fa-solid fa-lock',           label: 'Lock' },
                    { id: 'blocked', icon: 'fa-solid fa-user-slash',     label: 'Blocked' },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setSettingsTab(tab.id)}
                      style={{ flex: 1, padding: '7px 4px', border: 'none', background: settingsTab === tab.id ? 'rgba(96,165,250,0.12)' : 'none', color: settingsTab === tab.id ? '#60a5fa' : 'rgba(255,255,255,0.35)', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderBottom: settingsTab === tab.id ? '2px solid #60a5fa' : '2px solid transparent', transition: 'all .12s' }}>
                      <i className={tab.icon} style={{ fontSize: 11 }} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ padding: '10px 12px', maxHeight: 160, overflowY: 'auto', scrollbarWidth: 'thin' }}>
                  {/* Camera tab */}
                  {settingsTab === 'camera' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Select Camera</div>
                        {devices.length > 0 ? (
                          <select value={selCam} onChange={e => switchCamera(e.target.value)}
                            style={{ width: '100%', padding: '6px 8px', background: '#1a1a2e', color: C, border: `1px solid ${BD}`, borderRadius: 7, fontSize: '0.73rem' }}>
                            {devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}
                          </select>
                        ) : (
                          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>No cameras found</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Microphone Level</div>
                        <MicDetector />
                      </div>
                    </div>
                  )}

                  {/* Privacy tab */}
                  {settingsTab === 'privacy' && (
                    <div>
                      <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                        Who can watch your cam? Only users with selected rank and above.
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {RANKS_LIST.map(([key, r]) => (
                          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px', borderRadius: 6, background: privacyRank === key ? 'rgba(96,165,250,0.1)' : 'none', border: `1px solid ${privacyRank === key ? 'rgba(96,165,250,0.3)' : 'transparent'}` }}>
                            <input type="radio" name="camPrivacy" value={key} checked={privacyRank === key} onChange={() => setPrivacyRank(key)} style={{ accentColor: '#60a5fa' }} />
                            <RIcon rank={key} size={14} />
                            <span style={{ fontSize: '0.72rem', color: r.color, fontWeight: 600 }}>{r.label}+</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lock tab */}
                  {settingsTab === 'lock' && (
                    <div>
                      <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                        {camLocked ? '🔒 Cam is locked. Viewers need password to join.' : 'Set a password to lock your cam.'}
                      </div>
                      {!camLocked ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <input
                            type="password"
                            value={lockInput}
                            onChange={e => { setLockInput(e.target.value); setLockError('') }}
                            placeholder="Min 6 characters"
                            maxLength={20}
                            style={{ padding: '7px 10px', background: '#1a1a2e', color: C, border: `1px solid ${lockError ? '#ef4444' : BD}`, borderRadius: 7, fontSize: '0.75rem', outline: 'none' }}
                          />
                          {lockError && <span style={{ fontSize: '0.65rem', color: '#ef4444' }}>{lockError}</span>}
                          <button onClick={saveLock}
                            style={{ padding: '7px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>
                            <i className="fa-solid fa-lock" style={{ marginRight: 5 }} />Lock Cam
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, fontSize: '0.72rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="fa-solid fa-lock" />
                            Cam is locked (pwd set)
                          </div>
                          <button onClick={removeLock}
                            style={{ padding: '7px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>
                            <i className="fa-solid fa-lock-open" style={{ marginRight: 5 }} />Remove Lock
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Blocked tab */}
                  {settingsTab === 'blocked' && (
                    <div>
                      {enrichedBlocked.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '12px 0', color: 'rgba(255,255,255,0.2)', fontSize: '0.68rem' }}>No blocked viewers</div>
                      ) : enrichedBlocked.map(u => (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${BD}` }}>
                          <img src={u.avatar || '/default_images/avatar/default_avatar.png'} alt={u.username} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.src = '/default_images/avatar/default_avatar.png' }} />
                          <RIcon rank={u.rank} size={12} />
                          <span style={{ flex: 1, fontSize: '0.72rem', color: C }}>{u.username}</span>
                          <button onClick={() => unblockUser(u.id)}
                            style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer' }}>
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── VIEWER LIST DROPDOWN ── */}
            {showViewerList && (
              <div style={{ background: 'rgba(5,5,12,0.97)', borderTop: `1px solid ${BD}`, flexShrink: 0, maxHeight: 200, overflowY: 'auto', scrollbarWidth: 'thin' }}>
                <div style={{ padding: '7px 12px', borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    Viewers ({viewers.length})
                  </span>
                  <button onClick={() => setViewerList(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13 }}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
                {viewers.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.68rem' }}>No viewers currently watching</div>
                ) : enrichedViewers.map(v => (
                  <div key={v.viewerId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: `1px solid ${BD}` }}>
                    <img src={v.avatar || '/default_images/avatar/default_avatar.png'} alt={v.viewerName} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.src = '/default_images/avatar/default_avatar.png' }} />
                    <RIcon rank={v.viewerRank} size={14} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.75rem', color: v.nameColor || C, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.viewerName}</div>
                      <div style={{ fontSize: '0.57rem', color: 'rgba(255,255,255,0.25)' }}>
                        {v.joinedAt ? `Watching since ${new Date(v.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Watching'}
                      </div>
                    </div>
                    <button onClick={() => blockViewer(v)} title="Block from cam"
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    >
                      <i className="fa-solid fa-user-slash" style={{ marginRight: 4 }} />Block
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block confirmation popup */}
      {confirmBlock && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 820, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#12121e', borderRadius: 14, width: 'min(300px,92vw)', padding: '18px', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <i className="fa-solid fa-user-slash" style={{ color: '#ef4444', fontSize: 18 }} />
              <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>Block Viewer</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginBottom: 16, lineHeight: 1.5 }}>
              Block <strong style={{ color: '#fff' }}>{confirmBlock.viewerName}</strong> from your cam? They will be disconnected immediately.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmBlock(null)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${BD}`, background: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.78rem' }}>Cancel</button>
              <button onClick={confirmBlockViewer} style={{ flex: 2, padding: '8px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>
                <i className="fa-solid fa-user-slash" style={{ marginRight: 5 }} />Block
              </button>
            </div>
          </div>
        </div>
      )}

      <CGZStyles />
    </>
  )
}

// ── Connecting overlay ─────────────────────────────────────────
function ConnectingOverlay({ videoRef }) {
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const v = videoRef.current; if (!v) return
    const onPlay = () => setPlaying(true)
    v.addEventListener('playing', onPlay)
    return () => v.removeEventListener('playing', onPlay)
  }, [])
  if (playing) return null
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.88)', gap: 12 }}>
      <div style={{ width: 30, height: 30, border: '3px solid rgba(167,139,250,0.25)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'cgzSpin .7s linear infinite' }} />
      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Connecting to stream…</span>
    </div>
  )
}

// ── Mic level detector ─────────────────────────────────────────
function MicDetector() {
  const [level, setLevel] = useState(0)
  const [device, setDevice] = useState('')
  const animRef   = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    let ctx
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        streamRef.current = stream
        const tr = stream.getAudioTracks()
        if (tr[0]) setDevice(tr[0].label || 'Default mic')
        ctx = new (window.AudioContext || window.webkitAudioContext)()
        const src = ctx.createMediaStreamSource(stream)
        const an = ctx.createAnalyser(); an.fftSize = 256
        src.connect(an)
        const data = new Uint8Array(an.frequencyBinCount)
        const tick = () => {
          an.getByteFrequencyData(data)
          setLevel(Math.min(100, Math.round(data.reduce((a, b) => a + b, 0) / data.length * 2)))
          animRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch {}
    }
    init()
    return () => { cancelAnimationFrame(animRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); ctx?.close() }
  }, [])

  return (
    <div>
      <div style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>🎤 {device ? device.slice(0, 28) : 'Detecting…'}</div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${level}%`, background: level > 60 ? '#22c55e' : '#60a5fa', borderRadius: 3, transition: 'width .08s' }} />
      </div>
      <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>{level > 10 ? '🟢 Voice detected' : '🔇 Silent'}</div>
    </div>
  )
}

// ── Gift modal ─────────────────────────────────────────────────
function ViewerGiftModal({ hostUser, onClose, socket, roomId }) {
  const [gifts, setGifts] = useState([])
  const [gold, setGold] = useState(0)
  const [sending, setSending] = useState(null)
  const t = localStorage.getItem('cgz_token')

  useEffect(() => {
    fetch(`${API}/api/gifts`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(d => setGifts(d.gifts || [])).catch(() => {})
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(d => setGold(d.user?.gold || 0)).catch(() => {})
  }, [])

  function sendGift(g) {
    if (sending || gold < g.price) return
    setSending(g._id); setGold(p => p - g.price)
    socket?.emit('sendGift', { toUserId: hostUser._id || hostUser.userId, giftId: g._id, roomId })
    setTimeout(() => { setSending(null); onClose() }, 1200)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#12121e', borderRadius: 14, width: 'min(320px,95vw)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem' }}>Gift to {hostUser.username}</span>
          <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>{gold} 🪙</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: '10px 12px', maxHeight: 210, overflowY: 'auto' }}>
          {gifts.map(g => {
            const ok = gold >= g.price
            return (
              <div key={g._id} onClick={() => ok && sendGift(g)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '7px 4px', borderRadius: 9, border: `1.5px solid ${sending === g._id ? '#ec4899' : ok ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}`, cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : 0.38, transition: 'all .12s', background: sending === g._id ? 'rgba(236,72,153,0.15)' : 'none' }}
                onMouseEnter={e => { if (ok) e.currentTarget.style.borderColor = '#ec4899' }}
                onMouseLeave={e => { if (ok && sending !== g._id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
              >
                <img src={`/gifts/${g.icon || g.name?.toLowerCase() + '.svg'}`} alt={g.name} style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => { e.target.src = '/default_images/icons/gift.svg' }} />
                <span style={{ fontSize: '0.57rem', color: 'rgba(255,255,255,0.6)', marginTop: 2, textAlign: 'center', maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                <span style={{ fontSize: '0.58rem', color: '#fbbf24', fontWeight: 700 }}>{g.price}G</span>
              </div>
            )
          })}
          {gifts.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem' }}>Loading gifts…</div>
          )}
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} style={{ padding: '7px 22px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'rgba(255,255,255,0.38)', cursor: 'pointer', fontSize: '0.78rem' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Report modal ───────────────────────────────────────────────
function ViewerReportModal({ targetUser, onClose, socket, roomId }) {
  const REASONS = ['Inappropriate content', 'Nudity / Sexual content', 'Harassment', 'Spam', 'Underage', 'Hate speech', 'Other']
  const [reason, setReason] = useState('')
  const [note,   setNote]   = useState('')
  const [sent,   setSent]   = useState(false)
  const t = localStorage.getItem('cgz_token')

  async function submit() {
    if (!reason) return
    try {
      // Request cam recording evidence via socket
      socket?.emit('camReportEvidence', { hostUserId: targetUser._id || targetUser.userId, roomId })

      await fetch(`${API}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          reportedUserId: targetUser._id || targetUser.userId,
          reason,
          notes: note,
          context: 'webcam',
          roomId,
        }),
      })
      setSent(true)
      setTimeout(onClose, 1800)
    } catch {}
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#12121e', borderRadius: 14, width: 'min(310px,95vw)', overflow: 'hidden', border: '1px solid rgba(239,68,68,0.25)' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-flag" style={{ color: '#ef4444', fontSize: 13 }} />
          <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.86rem' }}>Report {targetUser.username}</span>
        </div>
        {sent ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
            <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.88rem' }}>Report submitted!</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', marginTop: 4 }}>Admins will review the evidence.</div>
          </div>
        ) : (
          <div style={{ padding: '10px 14px' }}>
            <div style={{ marginBottom: 8 }}>
              {REASONS.map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer', color: reason === r ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: '0.77rem' }}>
                  <input type="radio" name="camrep" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: '#ef4444' }} />
                  {r}
                </label>
              ))}
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Additional notes (optional)"
              rows={2}
              style={{ width: '100%', padding: '6px 8px', background: '#1a1a2e', color: C, border: `1px solid ${BD}`, borderRadius: 7, fontSize: '0.72rem', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginBottom: 8, marginTop: 3 }}>
              📹 Cam stream recording will be submitted as evidence.
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${BD}`, background: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
              <button onClick={submit} disabled={!reason}
                style={{ flex: 2, padding: '8px', borderRadius: 8, border: 'none', background: reason ? '#ef4444' : 'rgba(255,255,255,0.07)', color: reason ? '#fff' : 'rgba(255,255,255,0.2)', fontWeight: 800, cursor: reason ? 'pointer' : 'not-allowed', fontSize: '0.8rem' }}>
                Submit Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared CSS keyframes ───────────────────────────────────────
function CGZStyles() {
  return (
    <style>{`
      @keyframes cgzPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      @keyframes cgzSpin  { to{transform:rotate(360deg)} }
    `}</style>
  )
}
