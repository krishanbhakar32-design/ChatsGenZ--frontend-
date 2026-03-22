import { useState, useEffect, useRef } from 'react'
const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

export default function WebcamPanel({ me, socket, roomId, onClose }) {
  const [hosting,   setHosting]  = useState(false)
  const [viewers,   setViewers]  = useState([])
  const [hosts,     setHosts]    = useState([])
  const [micOn,     setMicOn]    = useState(true)
  const [camOn,     setCamOn]    = useState(true)
  const [watching,  setWatching] = useState(null) // host userId watching
  const localRef  = useRef(null)
  const streamRef = useRef(null)
  const pcsRef    = useRef({}) // peerId -> RTCPeerConnection
  const token = localStorage.getItem('cgz_token')

  useEffect(()=>{
    // Load current cam hosts in room
    fetch(`${API}/api/webcam/room/${roomId}`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(d=>setHosts(d.hosts||[])).catch(()=>{})
    if (!socket) return
    socket.on('camViewerJoined', ({viewerUserId,viewerUsername})=>{
      setViewers(p=>[...p,{userId:viewerUserId,username:viewerUsername}])
    })
    socket.on('camViewerLeft', ({viewerUserId})=>{
      setViewers(p=>p.filter(v=>v.userId!==viewerUserId))
    })
    socket.on('camOffer', async({from,offer})=>{
      const pc = createPC(from)
      await pc.setRemoteDescription(offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('camAnswer',{toUserId:from,answer,roomId})
    })
    socket.on('camAnswer', async({from,answer})=>{
      const pc = pcsRef.current[from]
      if (pc) await pc.setRemoteDescription(answer)
    })
    socket.on('camIceCandidate', async({from,candidate})=>{
      const pc = pcsRef.current[from]
      if (pc) await pc.addIceCandidate(candidate)
    })
    socket.on('camHostLeft', ({userId})=>{
      setHosts(p=>p.filter(h=>h.userId!==userId))
      if (watching===userId) setWatching(null)
    })
    return ()=>{
      socket.off('camViewerJoined'); socket.off('camViewerLeft')
      socket.off('camOffer'); socket.off('camAnswer'); socket.off('camIceCandidate')
      socket.off('camHostLeft')
    }
  },[socket])

  function createPC(peerId) {
    const pc = new RTCPeerConnection({ iceServers:[{urls:'stun:stun.l.google.com:19302'}] })
    pcsRef.current[peerId] = pc
    pc.onicecandidate = e => { if(e.candidate) socket?.emit('camIceCandidate',{toUserId:peerId,candidate:e.candidate,roomId}) }
    pc.ontrack = e => {
      const vid = document.getElementById(`cam_${peerId}`)
      if (vid) vid.srcObject = e.streams[0]
    }
    return pc
  }

  async function startCam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true })
      streamRef.current = stream
      if (localRef.current) localRef.current.srcObject = stream
      setHosting(true)
      socket?.emit('webcamStart', { roomId })
      // Notify backend
      await fetch(`${API}/api/webcam/start`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({roomId})}).catch(()=>{})
    } catch (e) { alert('Cannot access camera: ' + e.message) }
  }

  async function stopCam() {
    streamRef.current?.getTracks().forEach(t=>t.stop())
    streamRef.current = null
    setHosting(false)
    setViewers([])
    socket?.emit('webcamStop', { roomId })
    await fetch(`${API}/api/webcam/stop`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({roomId})}).catch(()=>{})
  }

  function toggleMic() {
    streamRef.current?.getAudioTracks().forEach(t=>t.enabled=!micOn)
    setMicOn(p=>!p)
    socket?.emit('webcamToggleMic',{roomId,muted:micOn})
  }
  function toggleCam() {
    streamRef.current?.getVideoTracks().forEach(t=>t.enabled=!camOn)
    setCamOn(p=>!p)
    socket?.emit('webcamToggleCam',{roomId,disabled:camOn})
  }

  async function watchHost(hostUserId) {
    setWatching(hostUserId)
    const pc = createPC(hostUserId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket?.emit('watchCam',{hostUserId,roomId})
    socket?.emit('camOffer',{toUserId:hostUserId,offer,roomId})
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:1002,background:'rgba(0,0,0,.7)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#111827',borderRadius:18,maxWidth:580,width:'100%',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.5)'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #374151'}}>
          <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.95rem',color:'#fff',display:'flex',alignItems:'center',gap:8}}>
            <i className="fi fi-sr-video-camera" style={{color:'#22c55e'}}/>Webcam
          </span>
          <button onClick={()=>{stopCam();onClose()}} style={{background:'#374151',border:'none',color:'#9ca3af',width:28,height:28,borderRadius:7,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>
            <i className="fi fi-sr-cross-small"/>
          </button>
        </div>

        {/* Cam area */}
        <div style={{padding:16}}>
          {!hosting && hosts.length===0 && (
            <div style={{textAlign:'center',padding:'32px 20px'}}>
              <img src="/icons/ui/webcam.svg" alt="" style={{width:56,height:56,margin:'0 auto 12px',display:'block',opacity:0.5}} onError={e=>e.target.style.display='none'}/>
              <p style={{color:'#9ca3af',fontSize:'0.875rem',marginBottom:14}}>No one is broadcasting yet</p>
              <button onClick={startCam} style={{padding:'10px 24px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.875rem',display:'flex',alignItems:'center',gap:8,margin:'0 auto'}}>
                <i className="fi fi-sr-video-camera"/>Start Broadcasting
              </button>
            </div>
          )}

          {/* Local cam */}
          {hosting && (
            <div style={{marginBottom:12}}>
              <div style={{position:'relative',borderRadius:12,overflow:'hidden',background:'#000',aspectRatio:'16/9'}}>
                <video ref={localRef} autoPlay muted playsInline style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                <div style={{position:'absolute',top:8,left:8,background:'rgba(0,0,0,.6)',padding:'3px 10px',borderRadius:20,fontSize:'0.72rem',color:'#fff',fontWeight:700,display:'flex',alignItems:'center',gap:5}}>
                  <span style={{width:7,height:7,background:'#ef4444',borderRadius:'50%',display:'inline-block',animation:'pulse 1.5s infinite'}}/>LIVE
                </div>
                <div style={{position:'absolute',bottom:8,left:8,background:'rgba(0,0,0,.6)',padding:'3px 10px',borderRadius:20,fontSize:'0.72rem',color:'#fff'}}>
                  {viewers.length} viewers
                </div>
              </div>
              <div style={{display:'flex',gap:8,marginTop:10,justifyContent:'center'}}>
                <CamBtn icon={micOn?"fi-sr-microphone":"fi-sr-microphone-slash"} label={micOn?"Mic On":"Mic Off"} color={micOn?"#22c55e":"#ef4444"} onClick={toggleMic}/>
                <CamBtn icon={camOn?"fi-sr-video-camera":"fi-sr-video-camera-slash"} label={camOn?"Cam On":"Cam Off"} color={camOn?"#22c55e":"#ef4444"} onClick={toggleCam}/>
                <CamBtn icon="fi-sr-stop-circle" label="Stop" color="#ef4444" onClick={stopCam}/>
              </div>
            </div>
          )}

          {/* Other hosts */}
          {hosts.filter(h=>h.userId!==me?._id).length > 0 && (
            <div>
              <div style={{fontSize:'0.72rem',fontWeight:700,color:'#9ca3af',letterSpacing:'1px',textTransform:'uppercase',marginBottom:8}}>Live Now</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {hosts.filter(h=>h.userId!==me?._id).map(h=>(
                  <div key={h.userId} style={{position:'relative',width:140,borderRadius:10,overflow:'hidden',background:'#000',cursor:'pointer'}} onClick={()=>watchHost(h.userId)}>
                    <video id={`cam_${h.userId}`} autoPlay playsInline style={{width:'100%',aspectRatio:'4/3',objectFit:'cover',display:'block'}}/>
                    <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(to top,rgba(0,0,0,.8),transparent)',padding:'8px 8px 6px'}}>
                      <div style={{fontSize:'0.75rem',fontWeight:700,color:'#fff'}}>{h.username}</div>
                    </div>
                    {watching===h.userId&&<div style={{position:'absolute',inset:0,border:'2px solid #22c55e',borderRadius:10}}/>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hosting && hosts.filter(h=>h.userId!==me?._id).length===0 && (
            <button onClick={startCam} style={{display:'block',width:'100%',padding:'10px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.875rem',marginTop:12,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <i className="fi fi-sr-video-camera"/>Start Your Cam
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CamBtn({icon,label,color,onClick}) {
  return (
    <button onClick={onClick} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'8px 14px',background:'#1f2937',border:`1.5px solid ${color}33`,borderRadius:10,cursor:'pointer',color,fontSize:'0.72rem',fontWeight:600,transition:'all .15s'}}
      onMouseEnter={e=>e.currentTarget.style.background='#374151'}
      onMouseLeave={e=>e.currentTarget.style.background='#1f2937'}
    >
      <i className={`fi ${icon}`} style={{fontSize:18}}/>{label}
    </button>
  )
}
