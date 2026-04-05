// ============================================================
// ChatWebcam.jsx — CodyChat-style webcam panel
// HOST VIEW:
//   - Small box below camera icon (not full screen)
//   - Header: username left, close (X) right
//   - Camera screen with filter applied
//   - Below screen: Camera toggle, Mic toggle (single button each)
//   - Left side: Viewer list with rank icon, cam-block per viewer
//   - Settings icon: camera change + mic detect + filter icon (8-10 filters)
// VIEWER VIEW:
//   - Same header
//   - Footer: Mic on/off, Camera on/off, Gift, Report
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { API, R, GBR, RL } from './chatConstants.js'
import { RIcon } from './ChatIcons.jsx'

// 10 CSS filters
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

function WebcamPanel({ socket, roomId, me, onClose }) {
  const hostVideoRef  = useRef(null)
  const watchVideoRef = useRef(null)
  const streamRef     = useRef(null)
  const peerConns     = useRef({})

  const [hosting,      setHosting]   = useState(false)
  const [watching,     setWatching]  = useState(null)   // { userId, username, socketId }
  const [liveCams,     setLiveCams]  = useState([])
  const [viewers,      setViewers]   = useState([])     // host sees these
  const [blockedCamIds, setBlocked]  = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('cgz_cam_blocked') || '[]')) } catch { return new Set() }
  })

  const [devices,  setDevices]  = useState([])
  const [selCam,   setSelCam]   = useState('')
  const [micOn,    setMicOn]    = useState(true)
  const [camOn,    setCamOn]    = useState(true)
  const [filter,   setFilter]   = useState('none')
  const [showSettings, setShowSettings] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [viewerMicOn, setViewerMicOn] = useState(true)
  const [viewerCamOn, setViewerCamOn] = useState(false) // viewers don't cam by default

  const tok = () => localStorage.getItem('cgz_token')

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devs => {
      const v = devs.filter(d => d.kind === 'videoinput')
      setDevices(v)
      if (v[0]) setSelCam(v[0].deviceId)
    }).catch(() => {})

    // Fetch live cams in this room
    if (roomId) {
      fetch(`${API}/api/webcam/room/${roomId}`, { headers: { Authorization: `Bearer ${tok()}` } })
        .then(r => r.json()).then(d => { if (d.sessions) setLiveCams(d.sessions) }).catch(() => {})
    }
    return () => { stopHost(); stopWatching() }
  }, [])

  // ── Socket events ─────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    const onViewerJoined = ({ viewerId, viewerName, viewerRank, viewerSocketId }) => {
      if (blockedCamIds.has(viewerId)) {
        // Reject blocked viewer
        socket.emit('camBlockViewer', { viewerSocketId })
        return
      }
      setViewers(p => [...p.filter(v => v.viewerId !== viewerId),
        { viewerId, viewerName, viewerRank: viewerRank || 'user', viewerSocketId }])
      createHostOffer(viewerSocketId, viewerId)
    }
    const onViewerLeft = ({ viewerId }) => {
      setViewers(p => p.filter(v => v.viewerId !== viewerId))
      peerConns.current[viewerId]?.close()
      delete peerConns.current[viewerId]
    }
    const onCamAnswer = ({ from, answer }) => {
      peerConns.current[from]?.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => {})
    }
    const onCamOffer = ({ from, username: hostName, hostRank, offer, socketId: hostSocketId }) => {
      if (offer === 'live') {
        setLiveCams(p => {
          if (p.find(c => c.userId === from)) return p
          return [...p, { userId: from, username: hostName, rank: hostRank || 'user' }]
        })
        return
      }
      if (watching?.userId !== from) return
      handleViewerReceiveOffer(from, offer, hostSocketId)
    }
    const onCamIce = ({ from, candidate }) => {
      const pc = peerConns.current[from]
      if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
    }
    const onCamStarted = ({ userId, username: hostName, rank }) => {
      setLiveCams(p => {
        if (p.find(c => c.userId === userId)) return p
        return [...p, { userId, username: hostName, rank: rank || 'user' }]
      })
    }
    const onCamStopped = ({ userId }) => {
      setLiveCams(p => p.filter(c => c.userId !== userId))
      if (watching?.userId === userId) {
        setWatching(null)
        if (watchVideoRef.current) watchVideoRef.current.srcObject = null
      }
    }

    socket.on('camViewerJoined', onViewerJoined)
    socket.on('camViewerLeft',   onViewerLeft)
    socket.on('camAnswer',       onCamAnswer)
    socket.on('camOffer',        onCamOffer)
    socket.on('camIceCandidate', onCamIce)
    socket.on('camStarted',      onCamStarted)
    socket.on('camStopped',      onCamStopped)

    return () => {
      socket.off('camViewerJoined', onViewerJoined)
      socket.off('camViewerLeft',   onViewerLeft)
      socket.off('camAnswer',       onCamAnswer)
      socket.off('camOffer',        onCamOffer)
      socket.off('camIceCandidate', onCamIce)
      socket.off('camStarted',      onCamStarted)
      socket.off('camStopped',      onCamStopped)
    }
  }, [socket, watching, blockedCamIds])

  // ── Host: create offer for each viewer ────────────────────
  async function createHostOffer(viewerSocketId, viewerId) {
    const pc = new RTCPeerConnection(ICE_CFG)
    peerConns.current[viewerId] = pc
    streamRef.current?.getTracks().forEach(t => pc.addTrack(t, streamRef.current))
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket?.emit('camIceCandidate', { toSocketId: viewerSocketId, candidate })
    }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket?.emit('camOffer', { toSocketId: viewerSocketId, answer: offer })
  }

  // ── Viewer: receive host offer ────────────────────────────
  async function handleViewerReceiveOffer(hostUserId, offer, hostSocketId) {
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
      if (candidate && watching) socket?.emit('camIceCandidate', { toSocketId: hostSocketId || watching.socketId, candidate })
    }
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    socket?.emit('camAnswer', { toSocketId: hostSocketId || watching?.socketId, answer })
  }

  // ── Start hosting ─────────────────────────────────────────
  async function startHost() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selCam ? { deviceId: { exact: selCam }, width: { ideal: 640 }, height: { ideal: 480 } } : true,
        audio: true,
      })
      streamRef.current = stream
      if (hostVideoRef.current) {
        hostVideoRef.current.srcObject = stream
        hostVideoRef.current.play().catch(() => {})
      }
      setHosting(true)
      socket?.emit('camOffer', { roomId, offer: 'live', rank: me?.rank })
      fetch(`${API}/api/webcam/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      }).catch(() => {})
    } catch (e) {
      alert('Camera error: ' + e.message)
    }
  }

  // ── Stop hosting ─────────────────────────────────────────
  function stopHost() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (hostVideoRef.current) hostVideoRef.current.srcObject = null
    Object.values(peerConns.current).forEach(pc => pc.close())
    peerConns.current = {}
    setHosting(false)
    setViewers([])
    socket?.emit('camStopped', { roomId })
    fetch(`${API}/api/webcam/stop`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId })
    }).catch(() => {})
  }

  // ── Stop watching ─────────────────────────────────────────
  function stopWatching() {
    if (watching) socket?.emit('stopWatchingCam', { hostUserId: watching.userId })
    peerConns.current[watching?.userId]?.close()
    if (watching?.userId) delete peerConns.current[watching.userId]
    setWatching(null)
    if (watchVideoRef.current) watchVideoRef.current.srcObject = null
  }

  // ── Watch a host ─────────────────────────────────────────
  function watchHost(cam) {
    setWatching(cam)
    socket?.emit('watchCam', { roomId, hostUserId: cam.userId })
  }

  // ── Toggle mic/cam (host) ─────────────────────────────────
  function toggleMic() {
    const t = streamRef.current?.getAudioTracks()[0]
    if (t) { t.enabled = !t.enabled; setMicOn(p => !p) }
  }
  function toggleCam() {
    const t = streamRef.current?.getVideoTracks()[0]
    if (t) { t.enabled = !t.enabled; setCamOn(p => !p) }
  }

  // ── Switch camera device ──────────────────────────────────
  function switchCamera(deviceId) {
    setSelCam(deviceId)
    if (!hosting) return
    navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false })
      .then(ns => {
        const newTrack = ns.getVideoTracks()[0]
        Object.values(peerConns.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          if (sender) sender.replaceTrack(newTrack)
        })
        const oldTrack = streamRef.current?.getVideoTracks()[0]
        if (oldTrack) { streamRef.current?.removeTrack(oldTrack); oldTrack.stop() }
        streamRef.current?.addTrack(newTrack)
        if (hostVideoRef.current) hostVideoRef.current.srcObject = streamRef.current
      }).catch(() => {})
  }

  // ── Block viewer from cam ─────────────────────────────────
  function blockViewer(viewerId, viewerSocketId) {
    const newBlocked = new Set([...blockedCamIds, viewerId])
    setBlocked(newBlocked)
    localStorage.setItem('cgz_cam_blocked', JSON.stringify([...newBlocked]))
    // Kick them from the stream
    if (viewerSocketId) socket?.emit('camBlockViewer', { viewerSocketId })
    setViewers(p => p.filter(v => v.viewerId !== viewerId))
    peerConns.current[viewerId]?.close()
    delete peerConns.current[viewerId]
  }

  const otherCams = liveCams.filter(c => c.userId !== me?._id)

  // ── Theme colors from chat (neutral dark) ─────────────────
  const BG  = '#0f0f1e'
  const BG2 = '#0a0a15'
  const C   = '#e0e0f0'
  const BD  = 'rgba(255,255,255,0.1)'

  // ── Toggle button ─────────────────────────────────────────
  const TBtn = ({ on, onIcon, offIcon, onClick, title }) => (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 44, height: 44, border: 'none', borderRadius: 10, cursor: 'pointer',
        background: on ? 'rgba(255,255,255,0.15)' : 'rgba(239,68,68,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all .15s', flexDirection: 'column', gap: 2,
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <i className={on ? onIcon : offIcon} style={{ fontSize: 16, color: '#fff' }} />
    </button>
  )

  // ── RENDER ────────────────────────────────────────────────
  // Panel: small fixed box, appears below the webcam button, not fullscreen
  return (
    <>
      {/* Backdrop — click to close */}
      <div
        onClick={e => { e.stopPropagation(); onClose() }}
        style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.45)' }}
      />

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(460px, 96vw)',
          maxHeight: 'calc(100dvh - 80px)',
          zIndex: 701,
          background: BG,
          borderRadius: 14,
          boxShadow: '0 8px 48px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── HEADER ───────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '8px 10px',
          borderBottom: `1px solid ${BD}`, flexShrink: 0, gap: 8,
          background: 'rgba(0,0,0,0.3)',
        }}>
          {/* Username / status left */}
          <i className="fa-solid fa-video" style={{ fontSize: 13, color: '#a78bfa', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: C, fontFamily: 'Outfit,sans-serif', flex: 1 }}>
            {watching
              ? `Watching ${watching.username}`
              : hosting
                ? `${me?.username || 'You'} — LIVE`
                : 'Webcam'
            }
          </span>
          {hosting && (
            <span style={{
              background: '#ef4444', color: '#fff', fontSize: '0.58rem', fontWeight: 800,
              padding: '2px 7px', borderRadius: 10, letterSpacing: '.5px',
              animation: 'camPulse 1.5s ease-in-out infinite', flexShrink: 0,
            }}>● LIVE</span>
          )}
          {/* Close — rightmost */}
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* ── MAIN CONTENT ─────────────────────────────── */}
        {/* If watching someone */}
        {watching ? (
          <ViewerView
            watching={watching}
            watchVideoRef={watchVideoRef}
            viewerMicOn={viewerMicOn}
            viewerCamOn={viewerCamOn}
            setViewerMicOn={setViewerMicOn}
            setViewerCamOn={setViewerCamOn}
            stopWatching={stopWatching}
            socket={socket}
            roomId={roomId}
            hostUser={watching}
            TBtn={TBtn}
            BG={BG} BG2={BG2} C={C} BD={BD}
          />
        ) : (
          <>
            {/* ── HOST VIEW ── */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

              {/* LEFT: Viewer list (only when hosting) */}
              {hosting && (
                <div style={{
                  width: 100, background: BG2, borderRight: `1px solid ${BD}`,
                  display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
                }}>
                  <div style={{ padding: '6px 8px', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                      Viewers ({viewers.length})
                    </span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                    {viewers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 6px', color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem' }}>
                        No viewers
                      </div>
                    ) : viewers.map(v => (
                      <div key={v.viewerId} style={{ display: 'flex', alignItems: 'center', padding: '5px 7px', gap: 4, borderBottom: `1px solid ${BD}` }}>
                        {/* Rank icon */}
                        <RIcon rank={v.viewerRank} size={14} />
                        <span style={{ flex: 1, fontSize: '0.65rem', color: C, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                          {v.viewerName}
                        </span>
                        {/* Block from cam */}
                        <button
                          title="Block from cam"
                          onClick={() => blockViewer(v.viewerId, v.viewerSocketId)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(239,68,68,0.6)', fontSize: 11, flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(239,68,68,0.6)'}
                        >
                          <i className="fa-solid fa-user-slash" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CENTER: Camera view + controls */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

                {/* Camera screen */}
                <div style={{ position: 'relative', background: '#000', aspectRatio: '4/3', flexShrink: 0, overflow: 'hidden', maxHeight: 280 }}>
                  <video
                    ref={hostVideoRef}
                    autoPlay muted playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter }}
                  />
                  {!hosting && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', flexDirection: 'column', gap: 10 }}>
                      <i className="fa-solid fa-video" style={{ fontSize: 32, color: 'rgba(255,255,255,0.2)' }} />
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'Nunito,sans-serif' }}>Camera off</span>
                    </div>
                  )}
                  {!camOn && hosting && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-video-slash" style={{ fontSize: 28, color: 'rgba(255,255,255,0.4)' }} />
                    </div>
                  )}

                  {/* Filter picker dropdown overlay */}
                  {showFilterMenu && (
                    <div style={{
                      position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(10,10,20,0.95)', borderRadius: 10, padding: '8px 6px',
                      display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5, zIndex: 10,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      {FILTERS.map(f => (
                        <button
                          key={f.id}
                          onClick={() => { setFilter(f.id); setShowFilterMenu(false) }}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                            padding: '5px 3px', borderRadius: 6, border: `1.5px solid ${filter === f.id ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
                            background: filter === f.id ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
                            cursor: 'pointer', fontSize: '0.58rem', color: filter === f.id ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ fontSize: 14 }}>{f.emoji}</span>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Controls row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px',
                  background: BG2, borderTop: `1px solid ${BD}`, flexShrink: 0, flexWrap: 'wrap',
                }}>

                  {hosting ? (
                    <>
                      {/* Cam toggle */}
                      <TBtn on={camOn} onIcon="fa-solid fa-video" offIcon="fa-solid fa-video-slash" onClick={toggleCam} title={camOn ? 'Camera off' : 'Camera on'} />
                      {/* Mic toggle */}
                      <TBtn on={micOn} onIcon="fa-solid fa-microphone-lines" offIcon="fa-solid fa-microphone-slash" onClick={toggleMic} title={micOn ? 'Mute mic' : 'Unmute mic'} />
                      {/* Filter icon */}
                      <button
                        title="Filters"
                        onClick={() => setShowFilterMenu(p => !p)}
                        style={{
                          width: 44, height: 44, border: `1.5px solid ${showFilterMenu ? '#a78bfa' : BD}`,
                          borderRadius: 10, cursor: 'pointer',
                          background: showFilterMenu ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >
                        <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 15, color: showFilterMenu ? '#a78bfa' : 'rgba(255,255,255,0.6)' }} />
                      </button>
                      {/* Settings icon */}
                      <button
                        title="Settings"
                        onClick={() => setShowSettings(p => !p)}
                        style={{
                          width: 44, height: 44, border: `1.5px solid ${showSettings ? '#60a5fa' : BD}`,
                          borderRadius: 10, cursor: 'pointer',
                          background: showSettings ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >
                        <i className="fa-solid fa-gear" style={{ fontSize: 15, color: showSettings ? '#60a5fa' : 'rgba(255,255,255,0.6)' }} />
                      </button>
                      {/* Stop button */}
                      <button
                        onClick={stopHost}
                        style={{
                          marginLeft: 'auto', padding: '8px 16px', borderRadius: 9, border: 'none',
                          background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff',
                          fontWeight: 800, cursor: 'pointer', fontSize: '0.78rem', flexShrink: 0,
                        }}
                      >
                        <i className="fa-solid fa-circle-stop" style={{ marginRight: 5 }} />
                        Stop
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Settings gear before going live */}
                      <button
                        title="Settings"
                        onClick={() => setShowSettings(p => !p)}
                        style={{
                          width: 44, height: 44, border: `1.5px solid ${showSettings ? '#60a5fa' : BD}`,
                          borderRadius: 10, cursor: 'pointer',
                          background: showSettings ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <i className="fa-solid fa-gear" style={{ fontSize: 15, color: showSettings ? '#60a5fa' : 'rgba(255,255,255,0.6)' }} />
                      </button>
                      {/* Go live */}
                      <button
                        onClick={startHost}
                        style={{
                          marginLeft: 'auto', padding: '8px 20px', borderRadius: 9, border: 'none',
                          background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',
                          fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem',
                          boxShadow: '0 2px 12px rgba(34,197,94,.35)',
                        }}
                      >
                        <i className="fa-solid fa-circle-play" style={{ marginRight: 6 }} />
                        Go Live
                      </button>
                    </>
                  )}
                </div>

                {/* Settings panel */}
                {showSettings && (
                  <div style={{ background: 'rgba(0,0,0,0.4)', borderTop: `1px solid ${BD}`, padding: '10px 12px', flexShrink: 0 }}>
                    {devices.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>
                          Camera
                        </div>
                        <select
                          value={selCam}
                          onChange={e => switchCamera(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', background: '#1a1a2e', color: C, border: `1px solid ${BD}`, borderRadius: 7, fontSize: '0.75rem' }}
                        >
                          {devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}
                        </select>
                      </div>
                    )}
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>
                      Mic / Audio
                    </div>
                    <MicDetector />
                  </div>
                )}

                {/* Live cams list (when not hosting and not watching) */}
                {!hosting && (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                      Live in this room ({otherCams.length})
                    </div>
                    {otherCams.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
                        <i className="fa-solid fa-video" style={{ fontSize: 24, display: 'block', marginBottom: 8 }} />
                        No one is live
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {otherCams.map(cam => (
                          <button
                            key={cam.userId}
                            onClick={() => watchHost(cam)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 9, cursor: 'pointer', textAlign: 'left', transition: 'all .12s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,115,232,0.15)'; e.currentTarget.style.borderColor = 'rgba(26,115,232,0.4)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                          >
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0, animation: 'camPulse 1.5s infinite' }} />
                            <RIcon rank={cam.rank || 'user'} size={15} />
                            <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 700, color: C, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {cam.username}
                            </span>
                            <i className="fa-solid fa-eye" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes camPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </>
  )
}

// ── Viewer view ───────────────────────────────────────────────
function ViewerView({ watching, watchVideoRef, viewerMicOn, viewerCamOn, setViewerMicOn, setViewerCamOn, stopWatching, socket, roomId, hostUser, TBtn, BG, BG2, C, BD }) {
  const [showGift, setShowGift]     = useState(false)
  const [showReport, setShowReport] = useState(false)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Watch video */}
      <div style={{ position: 'relative', background: '#000', aspectRatio: '4/3', flexShrink: 0, overflow: 'hidden', maxHeight: 280 }}>
        <video ref={watchVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.65)', borderRadius: 8, padding: '3px 9px', fontSize: '0.68rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'camPulse 1.5s infinite' }} />
          {watching.username}
        </div>
      </div>
      {/* Footer controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: BG2, borderTop: `1px solid ${BD}`, flexShrink: 0 }}>
        {/* Mic toggle */}
        <TBtn on={viewerMicOn} onIcon="fa-solid fa-microphone-lines" offIcon="fa-solid fa-microphone-slash" onClick={() => setViewerMicOn(p => !p)} title="Mic" />
        {/* Cam toggle */}
        <TBtn on={viewerCamOn} onIcon="fa-solid fa-video" offIcon="fa-solid fa-video-slash" onClick={() => setViewerCamOn(p => !p)} title="Camera" />
        {/* Gift */}
        <button
          onClick={() => setShowGift(true)}
          title="Send Gift"
          style={{ width: 44, height: 44, border: `1.5px solid ${BD}`, borderRadius: 10, cursor: 'pointer', background: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <i className="fa-solid fa-gift" style={{ fontSize: 16, color: '#ec4899' }} />
        </button>
        {/* Report */}
        <button
          onClick={() => setShowReport(true)}
          title="Report"
          style={{ width: 44, height: 44, border: `1.5px solid ${BD}`, borderRadius: 10, cursor: 'pointer', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <i className="fa-sharp fa-solid fa-flag" style={{ fontSize: 15, color: '#ef4444' }} />
        </button>
        {/* Leave */}
        <button
          onClick={stopWatching}
          style={{
            marginLeft: 'auto', padding: '8px 14px', borderRadius: 9,
            background: 'rgba(239,68,68,0.2)', color: '#ef4444',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0,
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <i className="fa-solid fa-circle-left" style={{ marginRight: 5 }} />
          Leave
        </button>
      </div>

      {showGift && <ViewerGiftModal hostUser={watching} onClose={() => setShowGift(false)} socket={socket} roomId={roomId} />}
      {showReport && <ViewerReportModal targetUser={watching} onClose={() => setShowReport(false)} />}
    </div>
  )
}

// ── Mic detector widget ───────────────────────────────────────
function MicDetector() {
  const [level, setLevel] = useState(0)
  const [device, setDevice] = useState('')
  const animRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    let ctx, analyser, source, stream
    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        streamRef.current = stream
        const tracks = stream.getAudioTracks()
        if (tracks[0]) setDevice(tracks[0].label || 'Default microphone')
        ctx = new (window.AudioContext || window.webkitAudioContext)()
        source = ctx.createMediaStreamSource(stream)
        analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        analyserRef.current = analyser
        const data = new Uint8Array(analyser.frequencyBinCount)
        function tick() {
          analyser.getByteFrequencyData(data)
          const avg = data.reduce((a, b) => a + b, 0) / data.length
          setLevel(Math.min(100, Math.round(avg * 2)))
          animRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch {}
    }
    init()
    return () => {
      cancelAnimationFrame(animRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      ctx?.close()
    }
  }, [])

  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>
        {device ? `🎤 ${device.slice(0, 32)}` : 'Detecting microphone...'}
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${level}%`, background: level > 60 ? '#22c55e' : '#60a5fa', borderRadius: 3, transition: 'width .1s' }} />
      </div>
      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
        {level > 10 ? '🟢 Voice detected' : '🔇 No voice detected'}
      </div>
    </div>
  )
}

// ── Simple gift modal for viewer ──────────────────────────────
function ViewerGiftModal({ hostUser, onClose, socket, roomId }) {
  const [gifts, setGifts] = useState([])
  const [sending, setSending] = useState(null)
  const [gold, setGold] = useState(0)
  const tok = localStorage.getItem('cgz_token')

  useEffect(() => {
    fetch(`${API}/api/gifts`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.json()).then(d => setGifts(d.gifts || [])).catch(() => {})
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.json()).then(d => setGold(d.user?.gold || 0)).catch(() => {})
  }, [])

  function sendGift(g) {
    if (sending || gold < g.price) return
    setSending(g._id)
    setGold(p => p - g.price)
    socket?.emit('sendGift', { toUserId: hostUser._id || hostUser.userId, giftId: g._id, roomId })
    setTimeout(() => { setSending(null); onClose() }, 1200)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a2e', borderRadius: 14, width: 'min(320px,95vw)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, color: '#fff', fontSize: '0.88rem' }}>Gift to {hostUser.username}</span>
          <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>{gold} Gold</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: '10px 12px', maxHeight: 200, overflowY: 'auto' }}>
          {gifts.map(g => {
            const canAfford = gold >= g.price
            return (
              <div key={g._id} onClick={() => canAfford && sendGift(g)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '7px 4px',
                borderRadius: 9, border: `1.5px solid ${canAfford ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                cursor: canAfford ? 'pointer' : 'not-allowed', background: 'rgba(255,255,255,0.04)',
                opacity: canAfford ? 1 : 0.4, transition: 'all .12s',
              }}>
                <img src={`/gifts/${g.icon || g.name?.toLowerCase() + '.svg'}`} alt={g.name}
                  style={{ width: 30, height: 30, objectFit: 'contain' }}
                  onError={e => { e.target.src = '/default_images/icons/gift.svg' }} />
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', marginTop: 3, textAlign: 'center' }}>{g.name}</span>
                <span style={{ fontSize: '0.6rem', color: '#fbbf24', fontWeight: 700 }}>{g.price}G</span>
              </div>
            )
          })}
        </div>
        <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center' }}>
          <button onClick={onClose} style={{ padding: '7px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.78rem' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Simple report modal for viewer ───────────────────────────
function ViewerReportModal({ targetUser, onClose }) {
  const REASONS = ['Inappropriate content', 'Nudity/Sexual content', 'Harassment', 'Spam', 'Underage', 'Other']
  const [reason, setReason] = useState('')
  const [sent, setSent] = useState(false)
  const tok = localStorage.getItem('cgz_token')

  async function submit() {
    if (!reason) return
    try {
      await fetch(`${API}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ reportedUserId: targetUser._id || targetUser.userId, reason, context: 'webcam' })
      })
      setSent(true)
      setTimeout(onClose, 1500)
    } catch {}
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a2e', borderRadius: 14, width: 'min(300px,95vw)', overflow: 'hidden', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-sharp fa-solid fa-flag" style={{ color: '#ef4444', fontSize: 14 }} />
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, color: '#fff', fontSize: '0.85rem' }}>Report {targetUser.username}</span>
        </div>
        {sent ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>✅ Report sent!</div>
        ) : (
          <div style={{ padding: '10px 12px' }}>
            {REASONS.map(r => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                <input type="radio" name="camreport" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: '#ef4444' }} />
                {r}
              </label>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.78rem' }}>Cancel</button>
              <button onClick={submit} disabled={!reason} style={{ flex: 2, padding: '8px', borderRadius: 8, border: 'none', background: reason ? '#ef4444' : 'rgba(255,255,255,0.1)', color: reason ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: 700, cursor: reason ? 'pointer' : 'not-allowed', fontSize: '0.82rem' }}>Report</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { WebcamPanel }
