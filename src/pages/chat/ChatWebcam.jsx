// ============================================================
// ChatWebcam.jsx — Live webcam system
//
// TWO components exported:
//   <LiveCamBar>   — always-visible strip above messages showing who is live
//                    clicking a cam thumbnail opens the full watch modal
//   <WebcamPanel>  — host controls modal (go live, stop, filters, settings)
//
// SIGNALING FLOW (corrected):
//   Host clicks Go Live → emits 'startCam' (server broadcasts 'camStarted')
//                       → also emits room-wide 'camOffer' {offer:'live'} as fallback
//   Viewer clicks Watch → emits 'watchCam'
//   Server → host: 'camViewerJoined' {viewerId, viewerSocketId, ...}
//   Host → viewer: emits 'camOffer' {toSocketId, offer: SDP}   ← key fix
//   Viewer → host: emits 'camAnswer' {toSocketId, answer: SDP}
//   Both sides exchange ICE via 'camIceCandidate' {toSocketId, candidate}
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { API } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'

const FILTERS = [
  { id: 'none',                                           label: 'Normal',  emoji: '🎥' },
  { id: 'grayscale(100%)',                                label: 'B&W',     emoji: '⬛' },
  { id: 'sepia(80%)',                                     label: 'Sepia',   emoji: '🟤' },
  { id: 'hue-rotate(90deg) saturate(150%)',               label: 'Vivid',   emoji: '🌈' },
  { id: 'contrast(140%) brightness(110%)',                label: 'Sharp',   emoji: '🔆' },
  { id: 'blur(1.5px)',                                    label: 'Soft',    emoji: '🌫️' },
  { id: 'hue-rotate(200deg) saturate(180%)',              label: 'Cool',    emoji: '🔵' },
  { id: 'hue-rotate(320deg) saturate(200%)',              label: 'Warm',    emoji: '🔴' },
  { id: 'brightness(1.3) contrast(1.1) saturate(1.3)',    label: 'Bright',  emoji: '✨' },
  { id: 'invert(10%) hue-rotate(180deg)',                 label: 'Dream',   emoji: '💫' },
]

const ICE_CFG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
}

const tok = () => localStorage.getItem('cgz_token')

// ═══════════════════════════════════════════════════════════════
// LiveCamBar — always rendered above messages, shows live users
// ═══════════════════════════════════════════════════════════════
export function LiveCamBar({ socket, roomId, me, liveCams, setLiveCams, onOpenHostPanel }) {
  const [watching,      setWatching]   = useState(null)   // cam object being watched
  const [showWatchModal,setShowWatch]  = useState(false)
  const watchVideoRef   = useRef(null)
  const peerConns       = useRef({})
  const hostSocketIdRef = useRef(null)

  // ── Socket: watch-side events ─────────────────────────────
  useEffect(() => {
    if (!socket) return

    const onCamOffer = ({ from, username: hostName, hostRank, offer, socketId: hostSocketId }) => {
      if (offer === 'live') {
        setLiveCams(p => p.find(c => c.userId === from) ? p : [...p, { userId: from, username: hostName, rank: hostRank || 'user' }])
        return
      }
      if (!watching || watching.userId !== from) return
      hostSocketIdRef.current = hostSocketId
      receiveOffer(from, offer, hostSocketId)
    }

    const onCamIce = ({ from, candidate }) => {
      const pc = peerConns.current[from]
      if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
    }

    const onCamStarted = ({ userId, username, rank }) => {
      setLiveCams(p => p.find(c => c.userId === userId) ? p : [...p, { userId, username, rank: rank || 'user' }])
    }

    const onCamStopped = ({ userId }) => {
      setLiveCams(p => p.filter(c => c.userId !== userId))
      if (watching?.userId === userId) closeWatch()
    }

    const onCamBlocked = () => closeWatch()

    socket.on('camOffer',        onCamOffer)
    socket.on('camIceCandidate', onCamIce)
    socket.on('camStarted',      onCamStarted)
    socket.on('camStopped',      onCamStopped)
    socket.on('camBlocked',      onCamBlocked)

    return () => {
      socket.off('camOffer',        onCamOffer)
      socket.off('camIceCandidate', onCamIce)
      socket.off('camStarted',      onCamStarted)
      socket.off('camStopped',      onCamStopped)
      socket.off('camBlocked',      onCamBlocked)
    }
  }, [socket, watching])

  async function receiveOffer(hostUserId, offer, hostSocketId) {
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
        const target = hostSocketId || hostSocketIdRef.current
        if (target) socket?.emit('camIceCandidate', { toSocketId: target, candidate })
      }
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    const target = hostSocketId || hostSocketIdRef.current
    socket?.emit('camAnswer', { toSocketId: target, answer })
  }

  function openWatch(cam) {
    if (cam.userId === me?._id) {
      onOpenHostPanel()
      return
    }
    closeWatch()
    setWatching(cam)
    setShowWatch(true)
    socket?.emit('watchCam', { roomId, hostUserId: cam.userId })
  }

  function closeWatch() {
    if (watching) socket?.emit('stopWatchingCam', { hostUserId: watching.userId })
    const uid = watching?.userId
    peerConns.current[uid]?.close()
    if (uid) delete peerConns.current[uid]
    hostSocketIdRef.current = null
    setWatching(null)
    setShowWatch(false)
    if (watchVideoRef.current) watchVideoRef.current.srcObject = null
  }

  const otherCams = liveCams.filter(c => c.userId !== me?._id)
  const iAmLive   = liveCams.some(c => c.userId === me?._id)

  if (liveCams.length === 0) return null

  return (
    <>
      {/* ── CAM STRIP ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px',
        background: 'linear-gradient(90deg,#0f0a1a,#120a20)',
        borderBottom: '1px solid rgba(167,139,250,0.2)',
        overflowX: 'auto', flexShrink: 0,
      }}>
        {/* LIVE label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
          fontSize: '0.62rem', fontWeight: 800, color: '#ef4444', letterSpacing: '.5px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'block', animation: 'camPulse 1.5s infinite' }} />
          LIVE
        </div>

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

        {/* Cam thumbnails */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {liveCams.map(cam => (
            <CamThumb
              key={cam.userId}
              cam={cam}
              isMe={cam.userId === me?._id}
              isWatching={watching?.userId === cam.userId}
              onClick={() => openWatch(cam)}
            />
          ))}
        </div>

        {/* Go Live button for self (if not live) */}
        {!iAmLive && (
          <button
            onClick={onOpenHostPanel}
            style={{
              marginLeft: 'auto', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: '#fff', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-circle-play" style={{ fontSize: 11 }} />
            Go Live
          </button>
        )}
      </div>

      {/* ── WATCH MODAL ───────────────────────────────── */}
      {showWatchModal && watching && (
        <WatchModal
          cam={watching}
          videoRef={watchVideoRef}
          onClose={closeWatch}
          socket={socket}
          roomId={roomId}
        />
      )}

      <style>{`@keyframes camPulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </>
  )
}

// ── Cam thumbnail in the strip ────────────────────────────────
function CamThumb({ cam, isMe, isWatching, onClick }) {
  return (
    <button
      onClick={onClick}
      title={isMe ? 'Your live cam' : `Watch ${cam.username}`}
      style={{
        position: 'relative', flexShrink: 0,
        width: 52, height: 39,
        border: `2px solid ${isWatching ? '#a78bfa' : isMe ? '#22c55e' : 'rgba(255,255,255,0.2)'}`,
        borderRadius: 7, overflow: 'hidden', cursor: 'pointer',
        background: '#000',
        boxShadow: isWatching ? '0 0 0 2px rgba(167,139,250,0.4)' : 'none',
        padding: 0, transition: 'all .15s',
      }}
      onMouseEnter={e => { if (!isWatching) e.currentTarget.style.borderColor = '#a78bfa' }}
      onMouseLeave={e => { if (!isWatching) e.currentTarget.style.borderColor = isMe ? '#22c55e' : 'rgba(255,255,255,0.2)' }}
    >
      {/* Placeholder — actual video is in WatchModal */}
      <div style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg,#1a0a2e,#0f0a1a)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      }}>
        <i className="fa-solid fa-video" style={{ fontSize: 11, color: '#a78bfa', opacity: 0.7 }} />
        <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, maxWidth: 44, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
          {cam.username}
        </span>
      </div>

      {/* Live dot */}
      <div style={{
        position: 'absolute', top: 2, left: 2,
        width: 5, height: 5, borderRadius: '50%',
        background: '#ef4444', animation: 'camPulse 1.5s infinite',
      }} />

      {isMe && (
        <div style={{
          position: 'absolute', bottom: 1, right: 2,
          fontSize: '0.42rem', color: '#22c55e', fontWeight: 800, letterSpacing: '.3px',
        }}>YOU</div>
      )}
    </button>
  )
}

// ── Full watch modal ──────────────────────────────────────────
function WatchModal({ cam, videoRef, onClose, socket, roomId }) {
  const [showGift,   setShowGift]   = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [muted,      setMuted]      = useState(false)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.7)' }}
      />

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(480px, 96vw)',
          zIndex: 801,
          background: '#0a0a15',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 20px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(167,139,250,0.2)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0, animation: 'camPulse 1.5s infinite' }} />
          <RIcon rank={cam.rank || 'user'} size={16} />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', flex: 1, fontFamily: 'Outfit,sans-serif' }}>
            {cam.username}
          </span>
          <span style={{
            background: 'rgba(239,68,68,0.2)', color: '#ef4444',
            fontSize: '0.58rem', fontWeight: 800, padding: '2px 8px', borderRadius: 8, letterSpacing: '.5px',
          }}>● LIVE</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer', padding: '0 2px', lineHeight: 1, marginLeft: 4 }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Video */}
        <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />

          {/* Connecting overlay — shown while stream not yet playing */}
          <ConnectingOverlay videoRef={videoRef} />

          {/* Volume button on video */}
          <button
            onClick={() => setMuted(p => !p)}
            style={{
              position: 'absolute', bottom: 10, right: 10,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className={`fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}`} />
          </button>
        </div>

        {/* Footer controls */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          background: 'rgba(0,0,0,0.4)',
        }}>
          {/* Gift */}
          <button
            onClick={() => setShowGift(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 9,
              background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)',
              color: '#ec4899', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-gift" style={{ fontSize: 14 }} />
            Gift
          </button>

          {/* Report */}
          <button
            onClick={() => setShowReport(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 9,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-flag" style={{ fontSize: 13 }} />
            Report
          </button>

          {/* Leave */}
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 9,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-circle-left" style={{ fontSize: 13 }} />
            Leave
          </button>
        </div>
      </div>

      {showGift   && <ViewerGiftModal   hostUser={cam} onClose={() => setShowGift(false)}   socket={socket} roomId={roomId} />}
      {showReport && <ViewerReportModal targetUser={cam} onClose={() => setShowReport(false)} />}
    </>
  )
}

// Shows "Connecting…" until video actually starts playing
function ConnectingOverlay({ videoRef }) {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onPlay = () => setPlaying(true)
    v.addEventListener('playing', onPlay)
    return () => v.removeEventListener('playing', onPlay)
  }, [])

  if (playing) return null
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', gap: 12,
    }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(167,139,250,0.3)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'camSpin .7s linear infinite' }} />
      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Connecting to stream…</span>
      <style>{`@keyframes camSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// WebcamPanel — host controls (go live / manage your own cam)
// ═══════════════════════════════════════════════════════════════
export function WebcamPanel({ socket, roomId, me, onClose, onStarted, onStopped }) {
  const hostVideoRef  = useRef(null)
  const streamRef     = useRef(null)
  const peerConns     = useRef({})

  const [hosting,       setHosting]       = useState(false)
  const [viewers,       setViewers]       = useState([])
  const [blockedCamIds, setBlocked]       = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('cgz_cam_blocked') || '[]')) } catch { return new Set() }
  })
  const [devices,        setDevices]        = useState([])
  const [selCam,         setSelCam]         = useState('')
  const [micOn,          setMicOn]          = useState(true)
  const [camOn,          setCamOn]          = useState(true)
  const [filter,         setFilter]         = useState('none')
  const [showSettings,   setShowSettings]   = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  // Drag
  const panelRef  = useRef(null)
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false })
  const [panelPos, setPanelPos] = useState({ x: null, y: null })

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devs => {
      const v = devs.filter(d => d.kind === 'videoinput')
      setDevices(v)
      if (v[0]) setSelCam(v[0].deviceId)
    }).catch(() => {})
    return () => { if (hosting) doStopHost() }
  }, [])

  // ── Socket: host-side events ──────────────────────────────
  useEffect(() => {
    if (!socket) return

    const onViewerJoined = ({ viewerId, viewerName, viewerRank, viewerSocketId }) => {
      if (blockedCamIds.has(viewerId)) { socket.emit('camBlockViewer', { viewerSocketId }); return }
      setViewers(p => [...p.filter(v => v.viewerId !== viewerId), { viewerId, viewerName, viewerRank: viewerRank || 'user', viewerSocketId }])
      createOffer(viewerSocketId, viewerId)
    }
    const onViewerLeft = ({ viewerId }) => {
      setViewers(p => p.filter(v => v.viewerId !== viewerId))
      peerConns.current[viewerId]?.close()
      delete peerConns.current[viewerId]
    }
    const onCamAnswer = ({ from, answer }) => {
      peerConns.current[from]?.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => {})
    }
    const onCamIce = ({ from, candidate }) => {
      const pc = peerConns.current[from]
      if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
    }

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
  }, [socket, blockedCamIds])

  // ── WebRTC offer to viewer ────────────────────────────────
  async function createOffer(viewerSocketId, viewerId) {
    const pc = new RTCPeerConnection(ICE_CFG)
    peerConns.current[viewerId] = pc
    streamRef.current?.getTracks().forEach(t => pc.addTrack(t, streamRef.current))
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket?.emit('camIceCandidate', { toSocketId: viewerSocketId, candidate })
    }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    // KEY FIX: field must be 'offer', not 'answer'
    socket?.emit('camOffer', { toSocketId: viewerSocketId, offer })
  }

  // ── Start hosting ─────────────────────────────────────────
  async function startHost() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selCam ? { deviceId: { exact: selCam }, width: { ideal: 640 }, height: { ideal: 480 } } : true,
        audio: true,
      })
      streamRef.current = stream
      if (hostVideoRef.current) { hostVideoRef.current.srcObject = stream; hostVideoRef.current.play().catch(() => {}) }
      setHosting(true)
      // Announce to room via both events for compatibility
      socket?.emit('startCam',  { roomId, rank: me?.rank, username: me?.username })
      socket?.emit('camOffer',  { roomId, offer: 'live', rank: me?.rank, username: me?.username })
      fetch(`${API}/api/webcam/start`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId }) }).catch(() => {})
      onStarted?.({ userId: me?._id, username: me?.username, rank: me?.rank })
    } catch (e) { alert('Camera error: ' + e.message) }
  }

  function doStopHost() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (hostVideoRef.current) hostVideoRef.current.srcObject = null
    Object.values(peerConns.current).forEach(pc => pc.close())
    peerConns.current = {}
    setHosting(false)
    setViewers([])
    socket?.emit('camStopped', { roomId })
    socket?.emit('stopCam',    { roomId })
    fetch(`${API}/api/webcam/stop`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId }) }).catch(() => {})
    onStopped?.()
  }

  function toggleMic() { const t = streamRef.current?.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setMicOn(p => !p) } }
  function toggleCam() { const t = streamRef.current?.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; setCamOn(p => !p) } }

  function switchCamera(deviceId) {
    setSelCam(deviceId)
    if (!hosting) return
    navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false }).then(ns => {
      const newTrack = ns.getVideoTracks()[0]
      Object.values(peerConns.current).forEach(pc => { const s = pc.getSenders().find(s => s.track?.kind === 'video'); if (s) s.replaceTrack(newTrack) })
      const old = streamRef.current?.getVideoTracks()[0]
      if (old) { streamRef.current?.removeTrack(old); old.stop() }
      streamRef.current?.addTrack(newTrack)
      if (hostVideoRef.current) hostVideoRef.current.srcObject = streamRef.current
    }).catch(() => {})
  }

  function blockViewer(viewerId, viewerSocketId) {
    const nb = new Set([...blockedCamIds, viewerId])
    setBlocked(nb)
    localStorage.setItem('cgz_cam_blocked', JSON.stringify([...nb]))
    if (viewerSocketId) socket?.emit('camBlockViewer', { viewerSocketId })
    setViewers(p => p.filter(v => v.viewerId !== viewerId))
    peerConns.current[viewerId]?.close()
    delete peerConns.current[viewerId]
  }

  // ── Drag ─────────────────────────────────────────────────
  const onHdrMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    e.preventDefault(); e.stopPropagation()
    const panel = panelRef.current; if (!panel) return
    const rect = panel.getBoundingClientRect()
    dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top, moved: false }
    const onMM = ev => {
      const ds = dragState.current; if (!ds.dragging) return
      const dx = ev.clientX - ds.startX, dy = ev.clientY - ds.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) ds.moved = true
      setPanelPos({ x: Math.max(0, Math.min(ds.origX + dx, window.innerWidth - panel.offsetWidth)), y: Math.max(0, Math.min(ds.origY + dy, window.innerHeight - panel.offsetHeight)) })
    }
    const onMU = () => { dragState.current.dragging = false; document.removeEventListener('mousemove', onMM); document.removeEventListener('mouseup', onMU) }
    document.addEventListener('mousemove', onMM); document.addEventListener('mouseup', onMU)
  }, [])

  function handleBackdropClick() {
    if (dragState.current.moved) { dragState.current.moved = false; return }
    onClose()
  }

  const posStyle = panelPos.x !== null
    ? { position: 'fixed', left: panelPos.x, top: panelPos.y, transform: 'none' }
    : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }

  const BG = '#0a0a15', BG2 = '#070710', C = '#e0e0f0', BD = 'rgba(255,255,255,0.08)'

  const TBtn = ({ on, onIcon, offIcon, onClick, title }) => (
    <button onClick={onClick} title={title}
      style={{ width: 42, height: 42, border: 'none', borderRadius: 10, cursor: 'pointer', background: on ? 'rgba(255,255,255,0.12)' : 'rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <i className={on ? onIcon : offIcon} style={{ fontSize: 15, color: '#fff' }} />
    </button>
  )

  return (
    <>
      <div onClick={handleBackdropClick} style={{ position: 'fixed', inset: 0, zIndex: 810, background: 'rgba(0,0,0,0.5)' }} />

      <div ref={panelRef} onClick={e => e.stopPropagation()}
        style={{ ...posStyle, width: 'min(440px,96vw)', maxHeight: 'calc(100dvh - 60px)', zIndex: 811, background: BG, borderRadius: 16, boxShadow: '0 20px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(167,139,250,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}
      >
        {/* Header */}
        <div onMouseDown={onHdrMouseDown}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${BD}`, flexShrink: 0, background: 'rgba(0,0,0,0.4)', cursor: 'grab', WebkitUserSelect: 'none' }}
        >
          <i className="fa-solid fa-grip-dots-vertical" style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
          <i className="fa-solid fa-video" style={{ fontSize: 13, color: '#a78bfa', flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: C, fontFamily: 'Outfit,sans-serif', flex: 1 }}>
            {hosting ? `${me?.username || 'You'} — LIVE` : 'Your Camera'}
          </span>
          {hosting && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.56rem', fontWeight: 800, padding: '2px 7px', borderRadius: 8, letterSpacing: '.5px', animation: 'camPulse 1.5s infinite' }}>● LIVE</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)', fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="fa-solid fa-eye" style={{ fontSize: 8 }} />{viewers.length}
              </span>
            </span>
          )}
          <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onClose() }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 17, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Viewer list sidebar */}
          {hosting && (
            <div style={{ width: 90, background: BG2, borderRight: `1px solid ${BD}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '6px 7px', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
                <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                  Viewers ({viewers.length})
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {viewers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '14px 6px', color: 'rgba(255,255,255,0.18)', fontSize: '0.62rem' }}>No viewers yet</div>
                ) : viewers.map(v => (
                  <div key={v.viewerId} style={{ display: 'flex', alignItems: 'center', padding: '5px 6px', gap: 3, borderBottom: `1px solid ${BD}` }}>
                    <RIcon rank={v.viewerRank} size={13} />
                    <span style={{ flex: 1, fontSize: '0.62rem', color: C, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{v.viewerName}</span>
                    <button onClick={() => blockViewer(v.viewerId, v.viewerSocketId)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(239,68,68,0.5)', fontSize: 10, flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(239,68,68,0.5)'}>
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
            <div style={{ position: 'relative', background: '#000', aspectRatio: '4/3', flexShrink: 0, overflow: 'hidden', maxHeight: 260 }}>
              <video ref={hostVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter }} />
              {!hosting && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)', flexDirection: 'column', gap: 10 }}>
                  <i className="fa-solid fa-video" style={{ fontSize: 30, color: 'rgba(255,255,255,0.15)' }} />
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>Camera preview</span>
                </div>
              )}
              {!camOn && hosting && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-video-slash" style={{ fontSize: 26, color: 'rgba(255,255,255,0.35)' }} />
                </div>
              )}
              {showFilterMenu && (
                <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(5,5,15,0.97)', borderRadius: 10, padding: '7px 5px', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4, zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {FILTERS.map(f => (
                    <button key={f.id} onClick={() => { setFilter(f.id); setShowFilterMenu(false) }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '5px 3px', borderRadius: 6, border: `1.5px solid ${filter === f.id ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, background: filter === f.id ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', fontSize: '0.55rem', color: filter === f.id ? '#a78bfa' : 'rgba(255,255,255,0.55)', fontWeight: 700 }}>
                      <span style={{ fontSize: 13 }}>{f.emoji}</span>{f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: BG2, borderTop: `1px solid ${BD}`, flexShrink: 0, flexWrap: 'wrap' }}>
              {hosting ? (
                <>
                  <TBtn on={camOn} onIcon="fa-solid fa-video" offIcon="fa-solid fa-video-slash" onClick={toggleCam} title={camOn ? 'Camera off' : 'Camera on'} />
                  <TBtn on={micOn} onIcon="fa-solid fa-microphone-lines" offIcon="fa-solid fa-microphone-slash" onClick={toggleMic} title={micOn ? 'Mute' : 'Unmute'} />
                  <button onClick={() => setShowFilterMenu(p => !p)} title="Filters"
                    style={{ width: 42, height: 42, border: `1.5px solid ${showFilterMenu ? '#a78bfa' : BD}`, borderRadius: 10, cursor: 'pointer', background: showFilterMenu ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 14, color: showFilterMenu ? '#a78bfa' : 'rgba(255,255,255,0.5)' }} />
                  </button>
                  <button onClick={() => setShowSettings(p => !p)} title="Settings"
                    style={{ width: 42, height: 42, border: `1.5px solid ${showSettings ? '#60a5fa' : BD}`, borderRadius: 10, cursor: 'pointer', background: showSettings ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fa-solid fa-gear" style={{ fontSize: 14, color: showSettings ? '#60a5fa' : 'rgba(255,255,255,0.5)' }} />
                  </button>
                  <button onClick={doStopHost}
                    style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.76rem', flexShrink: 0 }}>
                    <i className="fa-solid fa-circle-stop" style={{ marginRight: 5 }} />Stop
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setShowSettings(p => !p)} title="Settings"
                    style={{ width: 42, height: 42, border: `1.5px solid ${showSettings ? '#60a5fa' : BD}`, borderRadius: 10, cursor: 'pointer', background: showSettings ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-gear" style={{ fontSize: 14, color: showSettings ? '#60a5fa' : 'rgba(255,255,255,0.5)' }} />
                  </button>
                  <button onClick={startHost}
                    style={{ marginLeft: 'auto', padding: '8px 20px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem', boxShadow: '0 2px 14px rgba(124,58,237,.4)' }}>
                    <i className="fa-solid fa-circle-play" style={{ marginRight: 6 }} />Go Live
                  </button>
                </>
              )}
            </div>

            {/* Settings */}
            {showSettings && (
              <div style={{ background: 'rgba(0,0,0,0.5)', borderTop: `1px solid ${BD}`, padding: '10px 12px', flexShrink: 0 }}>
                {devices.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Camera</div>
                    <select value={selCam} onChange={e => switchCamera(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', background: '#1a1a2e', color: C, border: `1px solid ${BD}`, borderRadius: 7, fontSize: '0.73rem' }}>
                      {devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Microphone</div>
                <MicDetector />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes camPulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </>
  )
}

// ── Mic level detector ────────────────────────────────────────
function MicDetector() {
  const [level, setLevel] = useState(0)
  const [device, setDevice] = useState('')
  const animRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    let ctx
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        streamRef.current = stream
        const tracks = stream.getAudioTracks()
        if (tracks[0]) setDevice(tracks[0].label || 'Default mic')
        ctx = new (window.AudioContext || window.webkitAudioContext)()
        const src = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser(); analyser.fftSize = 256
        src.connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)
        const tick = () => {
          analyser.getByteFrequencyData(data)
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
      <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{device ? `🎤 ${device.slice(0, 30)}` : 'Detecting mic…'}</div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${level}%`, background: level > 60 ? '#22c55e' : '#60a5fa', borderRadius: 3, transition: 'width .08s' }} />
      </div>
      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>{level > 10 ? '🟢 Voice detected' : '🔇 Silent'}</div>
    </div>
  )
}

// ── Gift modal ────────────────────────────────────────────────
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#12121e', borderRadius: 14, width: 'min(320px,95vw)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem' }}>Gift to {hostUser.username}</span>
          <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>{gold} Gold</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: '10px 12px', maxHeight: 200, overflowY: 'auto' }}>
          {gifts.map(g => {
            const ok = gold >= g.price
            return (
              <div key={g._id} onClick={() => ok && sendGift(g)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '7px 4px', borderRadius: 9, border: `1.5px solid ${ok ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}`, cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : 0.4 }}>
                <img src={`/gifts/${g.icon || g.name?.toLowerCase() + '.svg'}`} alt={g.name} style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => { e.target.src = '/default_images/icons/gift.svg' }} />
                <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.65)', marginTop: 2, textAlign: 'center' }}>{g.name}</span>
                <span style={{ fontSize: '0.58rem', color: '#fbbf24', fontWeight: 700 }}>{g.price}G</span>
              </div>
            )
          })}
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} style={{ padding: '7px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.78rem' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Report modal ──────────────────────────────────────────────
function ViewerReportModal({ targetUser, onClose }) {
  const REASONS = ['Inappropriate content', 'Nudity/Sexual content', 'Harassment', 'Spam', 'Underage', 'Other']
  const [reason, setReason] = useState('')
  const [sent, setSent] = useState(false)
  const t = localStorage.getItem('cgz_token')

  async function submit() {
    if (!reason) return
    try {
      await fetch(`${API}/api/reports`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ reportedUserId: targetUser._id || targetUser.userId, reason, context: 'webcam' }) })
      setSent(true); setTimeout(onClose, 1500)
    } catch {}
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#12121e', borderRadius: 14, width: 'min(300px,95vw)', overflow: 'hidden', border: '1px solid rgba(239,68,68,0.25)' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-flag" style={{ color: '#ef4444', fontSize: 13 }} />
          <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem' }}>Report {targetUser.username}</span>
        </div>
        {sent ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>✅ Report sent!</div>
        ) : (
          <div style={{ padding: '10px 14px' }}>
            {REASONS.map(r => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer', color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>
                <input type="radio" name="camrep" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: '#ef4444' }} />
                {r}
              </label>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
              <button onClick={submit} disabled={!reason} style={{ flex: 2, padding: '8px', borderRadius: 8, border: 'none', background: reason ? '#ef4444' : 'rgba(255,255,255,0.08)', color: reason ? '#fff' : 'rgba(255,255,255,0.25)', fontWeight: 700, cursor: reason ? 'pointer' : 'not-allowed', fontSize: '0.8rem' }}>Report</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

