import { useState, useEffect, useRef } from 'react'
import { Sounds } from '../../utils/sounds.js'

export default function CallUI({ call, socket, onEnd }) {
  // call = { callId, callType, fromUser, toUser, status: 'incoming'|'outgoing'|'active' }
  const [status,    setStatus]  = useState(call.status)
  const [duration,  setDuration]= useState(0)
  const [micOn,     setMicOn]   = useState(true)
  const [camOn,     setCamOn]   = useState(call.callType==='video')
  const localRef  = useRef(null)
  const remoteRef = useRef(null)
  const pcRef     = useRef(null)
  const streamRef = useRef(null)
  const timerRef  = useRef(null)

  useEffect(()=>{
    if(status==='incoming') Sounds.callIn()
    if(status==='outgoing') Sounds.callOut()
    if (!socket) return
    socket.on('callAccepted', async({callId,iceServers,isInitiator})=>{
      if(callId!==call.callId) return
      setStatus('active')
      startTimer()
      await setupWebRTC(iceServers||[{urls:'stun:stun.l.google.com:19302'}], isInitiator)
    })
    socket.on('webrtcOffer',  async({offer})=>{ if(pcRef.current){ await pcRef.current.setRemoteDescription(offer); const ans=await pcRef.current.createAnswer(); await pcRef.current.setLocalDescription(ans); socket.emit('webrtcAnswer',{toUserId:call.fromUser?._id||call.toUser?._id,answer:ans,callId:call.callId}) } })
    socket.on('webrtcAnswer', async({answer})=>{ if(pcRef.current) await pcRef.current.setRemoteDescription(answer) })
    socket.on('webrtcIceCandidate',async({candidate})=>{ if(pcRef.current) await pcRef.current.addIceCandidate(candidate) })
    socket.on('callDeclined', ()=>{ Sounds.callEnd(); endCall() })
    socket.on('callEnded',    ()=>{ Sounds.callEnd(); endCall() })
    return ()=>{
      socket.off('callAccepted'); socket.off('webrtcOffer'); socket.off('webrtcAnswer')
      socket.off('webrtcIceCandidate'); socket.off('callDeclined'); socket.off('callEnded')
      clearInterval(timerRef.current)
    }
  },[socket])

  function startTimer() {
    timerRef.current = setInterval(()=>setDuration(p=>p+1), 1000)
  }

  async function setupWebRTC(iceServers, isInitiator) {
    const pc = new RTCPeerConnection({ iceServers })
    pcRef.current = pc
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: call.callType==='video', audio: true })
      streamRef.current = stream
      stream.getTracks().forEach(t=>pc.addTrack(t,stream))
      if(localRef.current) localRef.current.srcObject = stream
    } catch {}
    pc.ontrack = e => { if(remoteRef.current) remoteRef.current.srcObject = e.streams[0] }
    pc.onicecandidate = e => { if(e.candidate) socket?.emit('webrtcIceCandidate',{toUserId:call.fromUser?._id||call.toUser?._id,candidate:e.candidate,callId:call.callId}) }
    if(isInitiator) {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket?.emit('webrtcOffer',{toUserId:call.fromUser?._id||call.toUser?._id,offer,callId:call.callId})
    }
  }

  function accept() {
    socket?.emit('acceptCall',{toUserId:call.fromUser?._id,callId:call.callId})
    setStatus('active'); startTimer()
  }
  function decline() {
    socket?.emit('declineCall',{toUserId:call.fromUser?._id,callId:call.callId})
    endCall()
  }
  function endCall() {
    socket?.emit('endCall',{toUserId:call.fromUser?._id||call.toUser?._id,callId:call.callId})
    streamRef.current?.getTracks().forEach(t=>t.stop())
    clearInterval(timerRef.current)
    Sounds.callEnd()
    onEnd()
  }
  function toggleMic() { streamRef.current?.getAudioTracks().forEach(t=>t.enabled=!micOn); setMicOn(p=>!p) }
  function toggleCam() { streamRef.current?.getVideoTracks().forEach(t=>t.enabled=!camOn); setCamOn(p=>!p) }

  const other = call.fromUser || call.toUser
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return (
    <div style={{position:'fixed',inset:0,zIndex:1003,background:'rgba(0,0,0,.85)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#111827',borderRadius:20,padding:'24px 28px',maxWidth:340,width:'90%',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,.5)'}}>
        <img src={other?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:72,height:72,borderRadius:'50%',objectFit:'cover',border:'3px solid #374151',margin:'0 auto 12px',display:'block'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1.1rem',color:'#fff',marginBottom:4}}>{other?.username}</div>
        <div style={{fontSize:'0.8rem',color:'#9ca3af',marginBottom:20}}>
          {status==='incoming' ? `Incoming ${call.callType} call...`
          : status==='outgoing' ? `Calling... ${call.callType}`
          : `${call.callType==='video'?'Video':'Voice'} call • ${fmt(duration)}`}
        </div>
        {call.callType==='video' && status==='active' && (
          <div style={{position:'relative',borderRadius:12,overflow:'hidden',background:'#000',aspectRatio:'4/3',marginBottom:16}}>
            <video ref={remoteRef} autoPlay playsInline style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            <video ref={localRef} autoPlay muted playsInline style={{position:'absolute',bottom:8,right:8,width:80,borderRadius:8,border:'2px solid #374151'}}/>
          </div>
        )}
        <div style={{display:'flex',gap:12,justifyContent:'center'}}>
          {status==='incoming' && <>
            <CallBtn icon="fi-sr-phone-call" color="#22c55e" label="Accept" onClick={accept}/>
            <CallBtn icon="fi-sr-phone-slash" color="#ef4444" label="Decline" onClick={decline}/>
          </>}
          {status==='outgoing' && <CallBtn icon="fi-sr-phone-slash" color="#ef4444" label="Cancel" onClick={endCall}/>}
          {status==='active' && <>
            <CallBtn icon={micOn?"fi-sr-microphone":"fi-sr-microphone-slash"} color={micOn?"#374151":"#ef4444"} onClick={toggleMic}/>
            {call.callType==='video'&&<CallBtn icon={camOn?"fi-sr-video-camera":"fi-sr-video-camera-slash"} color={camOn?"#374151":"#ef4444"} onClick={toggleCam}/>}
            <CallBtn icon="fi-sr-phone-slash" color="#ef4444" label="End" onClick={endCall}/>
          </>}
        </div>
      </div>
    </div>
  )
}

function CallBtn({icon,color,label,onClick}) {
  return (
    <button onClick={onClick} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'10px 16px',background:color+'22',border:`2px solid ${color}`,borderRadius:12,cursor:'pointer',color,fontSize:'0.75rem',fontWeight:700,transition:'all .15s'}}
      onMouseEnter={e=>e.currentTarget.style.background=color+'44'}
      onMouseLeave={e=>e.currentTarget.style.background=color+'22'}
    >
      <i className={`fi ${icon}`} style={{fontSize:22}}/>{label}
    </button>
  )
}
