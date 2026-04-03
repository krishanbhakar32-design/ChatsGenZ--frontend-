// ChatWebcam.jsx — Mobile-first webcam panel (WebRTC)
// Renders as a fixed overlay panel, not an absolute-positioned element.
// Mobile: full-width bottom sheet. Desktop: fixed 480px wide panel top-right of chat.
import { useState, useEffect, useRef } from 'react'
import { API } from './chatConstants.js'

function WebcamPanel({ socket, roomId, me, onClose }) {
  const hostVideoRef = useRef(null), streamRef = useRef(null)
  const peerConns = useRef({})

  const [hosting, setHosting]     = useState(false)
  const [watching, setWatching]   = useState(null)
  const [devices, setDevices]     = useState([])
  const [selCam, setSelCam]       = useState('')
  const [micOn, setMicOn]         = useState(true)
  const [camOn, setCamOn]         = useState(true)
  const [filter, setFilter]       = useState('none')
  const [viewers, setViewers]     = useState([])
  const [liveCams, setLiveCams]   = useState([])
  const [tab, setTab]             = useState('host')
  const watchVideoRef = useRef(null)

  const FILTERS = [
    { id: 'none',                                      label: 'None'  },
    { id: 'grayscale(100%)',                           label: 'B&W'   },
    { id: 'sepia(80%)',                                label: 'Sepia' },
    { id: 'hue-rotate(90deg) saturate(150%)',          label: 'Vivid' },
    { id: 'contrast(130%) brightness(110%)',           label: 'Sharp' },
    { id: 'blur(2px)',                                 label: 'Blur'  },
  ]

  const ICE_CFG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devs => {
      const v = devs.filter(d => d.kind === 'videoinput')
      setDevices(v); if (v[0]) setSelCam(v[0].deviceId)
    }).catch(() => {})
    const tok = localStorage.getItem('cgz_token')
    if (roomId && tok) fetch(`${API}/api/webcam/room/${roomId}`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.json()).then(d => { if (d.sessions) setLiveCams(d.sessions) }).catch(() => {})
    return () => { stop(); stopWatching() }
  }, [])

  useEffect(() => {
    if (!socket) return
    function onViewerJoined({ viewerId, viewerName, viewerSocketId }) {
      setViewers(p => [...p.filter(v => v.viewerId !== viewerId), { viewerId, viewerName }])
      createOffer(viewerSocketId, viewerId)
    }
    function onViewerLeft({ viewerId }) {
      setViewers(p => p.filter(v => v.viewerId !== viewerId))
      peerConns.current[viewerId]?.close(); delete peerConns.current[viewerId]
    }
    function onCamAnswer({ from, answer }) {
      peerConns.current[from]?.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => {})
    }
    function onCamOffer({ from, username: hostName, offer }) {
      if (offer === 'live') {
        setLiveCams(p => { const ex = p.find(c => c.userId === from); if (ex) return p; return [...p, { userId: from, username: hostName }] })
        return
      }
      if (watching?.userId !== from) return
      handleHostOffer(from, offer)
    }
    function onCamIce({ from, candidate }) {
      const pc = peerConns.current[from]
      if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
    }
    function onCamHostLeft({ userId }) {
      setLiveCams(p => p.filter(c => c.userId !== userId))
      if (watching?.userId === userId) { setWatching(null); if (watchVideoRef.current) watchVideoRef.current.srcObject = null }
    }
    function onCamStarted({ userId, username: hostName, sessionId }) {
      setLiveCams(p => { const ex = p.find(c => c.userId === userId); if (ex) return p; return [...p, { userId, username: hostName, sessionId }] })
    }
    function onCamStopped({ userId }) {
      setLiveCams(p => p.filter(c => c.userId !== userId))
      if (watching?.userId === userId) { setWatching(null); if (watchVideoRef.current) watchVideoRef.current.srcObject = null }
    }
    socket.on('camViewerJoined', onViewerJoined)
    socket.on('camViewerLeft',   onViewerLeft)
    socket.on('camAnswer',       onCamAnswer)
    socket.on('camOffer',        onCamOffer)
    socket.on('camIceCandidate', onCamIce)
    socket.on('camHostLeft',     onCamHostLeft)
    socket.on('camStarted',      onCamStarted)
    socket.on('camStopped',      onCamStopped)
    return () => {
      socket.off('camViewerJoined', onViewerJoined); socket.off('camViewerLeft', onViewerLeft)
      socket.off('camAnswer', onCamAnswer);          socket.off('camOffer', onCamOffer)
      socket.off('camIceCandidate', onCamIce);       socket.off('camHostLeft', onCamHostLeft)
      socket.off('camStarted', onCamStarted);        socket.off('camStopped', onCamStopped)
    }
  }, [socket, watching])

  async function createOffer(viewerSocketId, viewerId) {
    const pc = new RTCPeerConnection(ICE_CFG)
    peerConns.current[viewerId] = pc
    streamRef.current?.getTracks().forEach(t => pc.addTrack(t, streamRef.current))
    pc.onicecandidate = ({ candidate }) => { if (candidate) socket?.emit('camIceCandidate', { toSocketId: viewerSocketId, candidate }) }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket?.emit('camAnswer', { toSocketId: viewerSocketId, answer: offer })
  }

  async function handleHostOffer(hostUserId, offer) {
    const old = peerConns.current[hostUserId]; old?.close()
    const pc = new RTCPeerConnection(ICE_CFG)
    peerConns.current[hostUserId] = pc
    pc.ontrack = ({ streams }) => {
      if (watchVideoRef.current && streams[0]) { watchVideoRef.current.srcObject = streams[0]; watchVideoRef.current.play().catch(() => {}) }
    }
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && watching) socket?.emit('camIceCandidate', { toSocketId: watching.socketId || watching.userId, candidate })
    }
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    socket?.emit('camAnswer', { toSocketId: watching?.socketId, answer })
  }

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selCam ? { deviceId: { exact: selCam }, width: { ideal: 640 }, height: { ideal: 480 } } : true,
        audio: true,
      })
      streamRef.current = stream
      if (hostVideoRef.current) { hostVideoRef.current.srcObject = stream; hostVideoRef.current.play().catch(() => {}) }
      setHosting(true)
      socket?.emit('camOffer', { roomId, offer: 'live' })
      const tok = localStorage.getItem('cgz_token')
      fetch(`${API}/api/webcam/start`, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId }) }).catch(() => {})
    } catch (e) { alert('Camera error: ' + e.message) }
  }

  function stop() {
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null
    if (hostVideoRef.current) hostVideoRef.current.srcObject = null
    Object.values(peerConns.current).forEach(pc => pc.close()); peerConns.current = {}
    setHosting(false); setViewers([])
    const tok = localStorage.getItem('cgz_token')
    fetch(`${API}/api/webcam/stop`, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({}) }).catch(() => {})
  }

  function switchCam(deviceId) {
    setSelCam(deviceId)
    if (hosting) {
      const oldTrack = streamRef.current?.getVideoTracks()[0]
      navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false }).then(ns => {
        const newTrack = ns.getVideoTracks()[0]
        Object.values(peerConns.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          if (sender) sender.replaceTrack(newTrack)
        })
        if (oldTrack) { streamRef.current?.removeTrack(oldTrack); oldTrack.stop() }
        streamRef.current?.addTrack(newTrack)
        if (hostVideoRef.current) hostVideoRef.current.srcObject = streamRef.current
      }).catch(() => {})
    }
  }

  function toggleMic() { const t = streamRef.current?.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setMicOn(p => !p) } }
  function toggleCam() { const t = streamRef.current?.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; setCamOn(p => !p) } }
  function watchUser(cam) { setWatching(cam); setTab('watch'); socket?.emit('watchCam', { roomId, hostUserId: cam.userId }) }
  function stopWatching() {
    if (watching) socket?.emit('stopWatchingCam', { hostUserId: watching.userId })
    peerConns.current[watching?.userId]?.close()
    if (watching?.userId) delete peerConns.current[watching.userId]
    setWatching(null)
    if (watchVideoRef.current) watchVideoRef.current.srcObject = null
  }

  const otherCams = liveCams.filter(c => c.userId !== me?._id)
  const isDesktop = window.innerWidth >= 600

  // Control button helper
  const CtrlBtn = ({ title, onClick, icon, img, active, red }) => (
    <button title={title} onClick={onClick} style={{
      width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer',
      background: red ? 'rgba(239,68,68,0.85)' : active === false ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = red ? 'rgba(239,68,68,1)' : 'rgba(255,255,255,0.2)'}
      onMouseLeave={e => e.currentTarget.style.background = red ? 'rgba(239,68,68,0.85)' : active === false ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)'}
    >
      {img
        ? <img src={img} alt="" style={{ width: 16, height: 16, filter: 'invert(1)', opacity: 0.9 }} onError={e => { e.target.outerHTML = `<i class="${icon}" style="font-size:13px;color:#fff"/>` }} />
        : <i className={icon} style={{ fontSize: 14, color: '#fff' }} />}
    </button>
  )

  return (
    <>
      {/* Backdrop on mobile only */}
      {!isDesktop && <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.5)' }} />}

      <div onClick={e => e.stopPropagation()} style={{
        position: 'fixed', zIndex: 801,
        background: '#0f0f1e',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.5)',
        // Mobile: bottom sheet, full width
        ...(isDesktop ? {
          top: 54, right: 0,
          width: 460,
          maxHeight: 'calc(100dvh - 120px)',
          borderRadius: '0 0 0 12px',
          boxShadow: '-4px 4px 32px rgba(0,0,0,0.5)',
        } : {
          bottom: 0, left: 0, right: 0,
          borderRadius: '16px 16px 0 0',
          maxHeight: '80dvh',
        }),
      }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #1e1e38', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/default_images/icons/webcam.svg" alt="" style={{ width: 14, height: 14, filter: 'invert(1)', opacity: 0.7 }} />
            <span style={{ color: '#e0e0f0', fontWeight: 800, fontSize: '0.8rem', fontFamily: 'Nunito,sans-serif', letterSpacing: '.5px' }}>LIVE CAM</span>
            {hosting && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.58rem', fontWeight: 800, padding: '2px 7px', borderRadius: 10, letterSpacing: '.5px', animation: 'camPulse 1.5s ease-in-out infinite' }}>● LIVE</span>}
            {otherCams.length > 0 && <span style={{ background: '#1a73e8', color: '#fff', fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>{otherCams.length} live</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <button onClick={() => setTab('host')} style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: 6, border: 'none', background: tab === 'host' ? '#1a73e8' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'Nunito,sans-serif' }}>My Cam</button>
            {otherCams.length > 0 && <button onClick={() => setTab('watch')} style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: 6, border: 'none', background: tab === 'watch' ? '#1a73e8' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'Nunito,sans-serif' }}>Watch ({otherCams.length})</button>}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }}>✕</button>
          </div>
        </div>

        {/* ── HOST TAB ── */}
        {tab === 'host' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Video area */}
            <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9', maxHeight: isDesktop ? 240 : 220, flexShrink: 0, overflow: 'hidden' }}>
              <video ref={hostVideoRef} autoPlay muted playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter }} />
              {!hosting && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', flexDirection: 'column', gap: 8 }}>
                  <img src="/default_images/icons/webcam.svg" alt="" style={{ width: 36, height: 36, filter: 'invert(1)', opacity: 0.25 }} />
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'Nunito,sans-serif' }}>Camera is off</span>
                </div>
              )}
              {/* Viewer count badge */}
              {hosting && viewers.length > 0 && (
                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '3px 8px', fontSize: '0.68rem', color: '#fff', fontWeight: 700 }}>
                  👥 {viewers.length} watching
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ padding: '8px 10px', display: 'flex', gap: 6, alignItems: 'center', background: '#0d0d1a', flexWrap: 'wrap', flexShrink: 0 }}>
              {/* Camera selector */}
              {devices.length > 1 && (
                <select value={selCam} onChange={e => { setSelCam(e.target.value); switchCam(e.target.value) }}
                  style={{ flex: 1, minWidth: 0, maxWidth: 140, padding: '5px 7px', background: '#1a1a2e', color: '#c0c0e0', border: '1px solid #2d2d44', borderRadius: 6, fontSize: '0.68rem' }}>
                  {devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}
                </select>
              )}

              <CtrlBtn title={micOn ? 'Mute mic' : 'Unmute mic'} onClick={toggleMic}
                img="/default_images/icons/audio.svg" icon="fa-solid fa-microphone-lines" active={micOn ? undefined : false} />
              <CtrlBtn title={camOn ? 'Hide cam' : 'Show cam'} onClick={toggleCam}
                img="/default_images/icons/video.svg" icon="fa-solid fa-video-camera" active={camOn ? undefined : false} />

              {/* Filter */}
              <select value={filter} onChange={e => setFilter(e.target.value)}
                style={{ padding: '5px 6px', background: '#1a1a2e', color: '#c0c0e0', border: '1px solid #2d2d44', borderRadius: 6, fontSize: '0.68rem', maxWidth: 72 }}>
                {FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>

              {!hosting
                ? <button onClick={start} style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'Nunito,sans-serif', boxShadow: '0 2px 8px rgba(34,197,94,.35)' }}>▶ Go Live</button>
                : <button onClick={stop}  style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'Nunito,sans-serif', boxShadow: '0 2px 8px rgba(239,68,68,.35)' }}>■ Stop</button>
              }
            </div>

            {/* Viewers list */}
            {hosting && viewers.length > 0 && (
              <div style={{ padding: '6px 10px', borderTop: '1px solid #1e1e38', background: '#0a0a18', flexShrink: 0 }}>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.5px' }}>Viewers ({viewers.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {viewers.map(v => (
                    <span key={v.viewerId} style={{ fontSize: '0.72rem', color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: 20, fontFamily: 'Nunito,sans-serif' }}>
                      👤 {v.viewerName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── WATCH TAB ── */}
        {tab === 'watch' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {watching ? (
              <>
                <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9', maxHeight: isDesktop ? 240 : 220, flexShrink: 0, overflow: 'hidden' }}>
                  <video ref={watchVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.65)', borderRadius: 8, padding: '3px 9px', fontSize: '0.68rem', color: '#fff', fontWeight: 700 }}>
                    📡 {watching.username}
                  </div>
                </div>
                <div style={{ padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'center', background: '#0d0d1a', flexShrink: 0 }}>
                  <button onClick={stopWatching} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid rgba(239,68,68,.35)', background: 'rgba(239,68,68,.15)', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Nunito,sans-serif' }}>
                    ✕ Leave
                  </button>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'Nunito,sans-serif' }}>Watching {watching.username}</span>
                </div>
              </>
            ) : (
              <div style={{ padding: '14px 12px', flex: 1, overflowY: 'auto' }}>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: 10, fontWeight: 700, fontFamily: 'Nunito,sans-serif', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                  Live cams in this room
                </div>
                {otherCams.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 0', color: 'rgba(255,255,255,0.2)', fontSize: '0.78rem', fontFamily: 'Nunito,sans-serif' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                    No one is live right now
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {otherCams.map(c => (
                      <button key={c.userId} onClick={() => watchUser(c)}
                        style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(26,115,232,.4)', background: 'rgba(26,115,232,.12)', color: '#93c5fd', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito,sans-serif', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,115,232,.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(26,115,232,.12)'}>
                        📡 {c.username}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes camPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </>
  )
}

export { WebcamPanel }
