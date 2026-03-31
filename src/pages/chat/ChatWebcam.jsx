// ============================================================
// ChatWebcam.jsx — Webcam/video streaming panel (WebRTC)
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { API } from './chatConstants.js'

function WebcamPanel({socket,roomId,me,onClose}) {
  const hostVideoRef=useRef(null), streamRef=useRef(null)
  const peerConns=useRef({})  // viewerId/hostId -> RTCPeerConnection

  const [hosting,setHosting]   =useState(false)
  const [watching,setWatching] =useState(null)  // {userId,username,socketId}
  const [devices,setDevices]   =useState([])
  const [selCam,setSelCam]     =useState('')
  const [micOn,setMicOn]       =useState(true)
  const [camOn,setCamOn]       =useState(true)
  const [filter,setFilter]     =useState('none')
  const [viewers,setViewers]   =useState([])   // [{viewerId,viewerName}]
  const [liveCams,setLiveCams] =useState([])   // [{userId,username,sessionId}] from room
  const [showViewers,setShowViewers]=useState(false)
  const [tab,setTab]           =useState('host') // 'host'|'watch'
  const watchVideoRef=useRef(null)

  const FILTERS=[
    {id:'none',   label:'None'},
    {id:'grayscale(100%)', label:'B&W'},
    {id:'sepia(80%)',      label:'Sepia'},
    {id:'hue-rotate(90deg) saturate(150%)', label:'Vivid'},
    {id:'contrast(130%) brightness(110%)',  label:'Sharp'},
    {id:'blur(2px)',       label:'Blur'},
  ]

  const ICE_CFG={iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]}

  useEffect(()=>{
    navigator.mediaDevices?.enumerateDevices().then(devs=>{
      const v=devs.filter(d=>d.kind==='videoinput')
      setDevices(v); if(v[0]) setSelCam(v[0].deviceId)
    }).catch(()=>{})
    // Fetch active cams in this room
    const tok=localStorage.getItem('cgz_token')
    if(roomId&&tok) fetch(`${API}/api/webcam/room/${roomId}`,{headers:{Authorization:`Bearer ${tok}`}})
      .then(r=>r.json()).then(d=>{if(d.sessions) setLiveCams(d.sessions)}).catch(()=>{})
    return()=>{stop();stopWatching()}
  },[])

  // Socket events
  useEffect(()=>{
    if(!socket) return
    // HOST receives: viewer joined → create offer
    function onViewerJoined({viewerId,viewerName,viewerSocketId}){
      setViewers(p=>[...p.filter(v=>v.viewerId!==viewerId),{viewerId,viewerName}])
      createOffer(viewerSocketId,viewerId)
    }
    function onViewerLeft({viewerId,viewerName}){
      setViewers(p=>p.filter(v=>v.viewerId!==viewerId))
      peerConns.current[viewerId]?.close(); delete peerConns.current[viewerId]
    }
    // HOST receives answer from viewer
    function onCamAnswer({from,answer}){
      peerConns.current[from]?.setRemoteDescription(new RTCSessionDescription(answer)).catch(()=>{})
    }
    // VIEWER receives offer from host
    function onCamOffer({from,username:hostName,offer}){
      if(offer==='live'){
        // New host went live — add to liveCams list
        setLiveCams(p=>{const exists=p.find(c=>c.userId===from);if(exists)return p;return[...p,{userId:from,username:hostName}]})
        return
      }
      if(watching?.userId!==from) return
      handleHostOffer(from,offer)
    }
    function onCamIce({from,candidate}){
      const pc=peerConns.current[from]
      if(pc&&candidate) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(()=>{})
    }
    function onCamHostLeft({userId,username:hostName}){
      setLiveCams(p=>p.filter(c=>c.userId!==userId))
      if(watching?.userId===userId){setWatching(null);if(watchVideoRef.current)watchVideoRef.current.srcObject=null}
    }
    function onCamStarted({userId,username:hostName,sessionId}){
      setLiveCams(p=>{const ex=p.find(c=>c.userId===userId);if(ex)return p;return[...p,{userId,username:hostName,sessionId}]})
    }
    function onCamStopped({userId}){
      setLiveCams(p=>p.filter(c=>c.userId!==userId))
      if(watching?.userId===userId){setWatching(null);if(watchVideoRef.current)watchVideoRef.current.srcObject=null}
    }
    socket.on('camViewerJoined',onViewerJoined)
    socket.on('camViewerLeft',  onViewerLeft)
    socket.on('camAnswer',      onCamAnswer)
    socket.on('camOffer',       onCamOffer)
    socket.on('camIceCandidate',onCamIce)
    socket.on('camHostLeft',    onCamHostLeft)
    socket.on('camStarted',     onCamStarted)
    socket.on('camStopped',     onCamStopped)
    return()=>{
      socket.off('camViewerJoined',onViewerJoined); socket.off('camViewerLeft',onViewerLeft)
      socket.off('camAnswer',onCamAnswer);          socket.off('camOffer',onCamOffer)
      socket.off('camIceCandidate',onCamIce);       socket.off('camHostLeft',onCamHostLeft)
      socket.off('camStarted',onCamStarted);        socket.off('camStopped',onCamStopped)
    }
  },[socket,watching])

  // HOST: create RTCPeerConnection and send offer to a viewer
  async function createOffer(viewerSocketId,viewerId){
    const pc=new RTCPeerConnection(ICE_CFG)
    peerConns.current[viewerId]=pc
    streamRef.current?.getTracks().forEach(t=>pc.addTrack(t,streamRef.current))
    pc.onicecandidate=({candidate})=>{
      if(candidate) socket?.emit('camIceCandidate',{toSocketId:viewerSocketId,candidate})
    }
    const offer=await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket?.emit('camAnswer',{toSocketId:viewerSocketId,answer:offer})
  }

  // VIEWER: receive offer from host, send answer
  async function handleHostOffer(hostUserId,offer){
    const old=peerConns.current[hostUserId]; old?.close()
    const pc=new RTCPeerConnection(ICE_CFG)
    peerConns.current[hostUserId]=pc
    pc.ontrack=({streams})=>{
      if(watchVideoRef.current&&streams[0]){
        watchVideoRef.current.srcObject=streams[0]
        watchVideoRef.current.play().catch(()=>{})
      }
    }
    pc.onicecandidate=({candidate})=>{
      if(candidate&&watching){
        const host=watching; socket?.emit('camIceCandidate',{toSocketId:host.socketId||host.userId,candidate})
      }
    }
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer=await pc.createAnswer()
    await pc.setLocalDescription(answer)
    socket?.emit('camAnswer',{toSocketId:watching?.socketId,answer})
  }

  async function start(){
    try{
      const stream=await navigator.mediaDevices.getUserMedia({
        video:selCam?{deviceId:{exact:selCam},width:{ideal:640},height:{ideal:480}}:true,audio:true
      })
      streamRef.current=stream
      if(hostVideoRef.current){hostVideoRef.current.srcObject=stream;hostVideoRef.current.play().catch(()=>{})}
      setHosting(true)
      // Notify room via socket + start session via API
      socket?.emit('camOffer',{roomId,offer:'live'})
      const tok=localStorage.getItem('cgz_token')
      fetch(`${API}/api/webcam/start`,{method:'POST',headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json'},body:JSON.stringify({roomId})}).catch(()=>{})
    }catch(e){alert('Camera error: '+e.message)}
  }

  function stop(){
    streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null
    if(hostVideoRef.current) hostVideoRef.current.srcObject=null
    Object.values(peerConns.current).forEach(pc=>pc.close()); peerConns.current={}
    setHosting(false); setViewers([])
    const tok=localStorage.getItem('cgz_token')
    fetch(`${API}/api/webcam/stop`,{method:'POST',headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json'},body:JSON.stringify({})}).catch(()=>{})
  }

  function switchCam(deviceId){
    setSelCam(deviceId)
    if(hosting){
      const oldTrack=streamRef.current?.getVideoTracks()[0]
      navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:deviceId}},audio:false}).then(ns=>{
        const newTrack=ns.getVideoTracks()[0]
        // Replace track in all peer connections
        Object.values(peerConns.current).forEach(pc=>{
          const sender=pc.getSenders().find(s=>s.track?.kind==='video')
          if(sender) sender.replaceTrack(newTrack)
        })
        // Replace in local stream
        if(oldTrack){streamRef.current?.removeTrack(oldTrack);oldTrack.stop()}
        streamRef.current?.addTrack(newTrack)
        if(hostVideoRef.current) hostVideoRef.current.srcObject=streamRef.current
      }).catch(()=>{})
    }
  }

  function toggleMic(){
    const t=streamRef.current?.getAudioTracks()[0]
    if(t){t.enabled=!t.enabled;setMicOn(p=>!p)}
  }
  function toggleCam(){
    const t=streamRef.current?.getVideoTracks()[0]
    if(t){t.enabled=!t.enabled;setCamOn(p=>!p)}
  }

  function watchUser(cam){
    setWatching(cam); setTab('watch')
    socket?.emit('watchCam',{roomId,hostUserId:cam.userId})
  }
  function stopWatching(){
    if(watching){socket?.emit('stopWatchingCam',{hostUserId:watching.userId})}
    peerConns.current[watching?.userId]?.close()
    if(watching?.userId) delete peerConns.current[watching.userId]
    setWatching(null)
    if(watchVideoRef.current) watchVideoRef.current.srcObject=null
  }

  const IBT=({t,fn,img,fb,active,style:s})=>(
    <button title={t} onClick={fn} style={{width:30,height:30,border:'none',borderRadius:7,background:active===false?'rgba(239,68,68,.9)':'rgba(255,255,255,.12)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,...s}}>
      <img src={img} alt="" style={{width:14,height:14,filter:'invert(1)',opacity:.9}} onError={e=>{e.target.outerHTML=`<i class="${fb}" style="font-size:12px;color:#fff"/>`}}/>
    </button>
  )

  const otherCams=liveCams.filter(c=>c.userId!==me?._id)

  return(
    <div style={{position:'fixed',bottom:50,right:8,zIndex:300,background:'#0f0f1e',border:'1px solid #2d2d44',borderRadius:12,overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,.6)',width:'min(300px,95vw)',maxHeight:'70vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
      {/* Header row */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',borderBottom:'1px solid #1e1e38'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <img src="/default_images/icons/webcam.svg" alt="" style={{width:13,height:13,filter:'invert(1)',opacity:.7}}/>
          <span style={{color:'#e0e0f0',fontWeight:700,fontSize:'0.76rem',letterSpacing:'.5px'}}>LIVE CAM</span>
          {hosting&&<span style={{background:'#ef4444',color:'#fff',fontSize:'0.58rem',fontWeight:800,padding:'1px 6px',borderRadius:10,letterSpacing:'.5px'}}>LIVE</span>}
          {otherCams.length>0&&<span style={{background:'#1a73e8',color:'#fff',fontSize:'0.58rem',fontWeight:700,padding:'1px 6px',borderRadius:10}}>{otherCams.length} live</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {/* Tab buttons */}
          <button onClick={()=>setTab('host')} style={{fontSize:'0.65rem',padding:'2px 8px',borderRadius:5,border:'none',background:tab==='host'?'#1a73e8':'rgba(255,255,255,.1)',color:'#fff',cursor:'pointer',fontWeight:700}}>My Cam</button>
          {otherCams.length>0&&<button onClick={()=>setTab('watch')} style={{fontSize:'0.65rem',padding:'2px 8px',borderRadius:5,border:'none',background:tab==='watch'?'#1a73e8':'rgba(255,255,255,.1)',color:'#fff',cursor:'pointer',fontWeight:700}}>Watch ({otherCams.length})</button>}
          {hosting&&<button onClick={()=>setShowViewers(p=>!p)} style={{fontSize:'0.65rem',padding:'2px 8px',borderRadius:5,border:'none',background:showViewers?'#7c3aed':'rgba(255,255,255,.1)',color:'#fff',cursor:'pointer',fontWeight:700}}>👥 {viewers.length}</button>}
          <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:14,lineHeight:1,padding:'0 2px'}}>✕</button>
        </div>
      </div>

      {/* Body */}
      <div style={{display:'flex',gap:0,overflow:'hidden'}}>
        {/* HOST TAB */}
        {tab==='host'&&(
          <div style={{flex:1,display:'flex',flexDirection:'column'}}>
            <div style={{position:'relative',background:'#000',aspectRatio:'16/9',maxHeight:220,overflow:'hidden'}}>
              <video ref={hostVideoRef} autoPlay muted playsInline
                style={{width:'100%',height:'100%',objectFit:'cover',display:'block',filter}}/>
              {!hosting&&(
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.7)',color:'rgba(255,255,255,.5)',flexDirection:'column',gap:6}}>
                  <img src="/default_images/icons/webcam.svg" alt="" style={{width:32,height:32,filter:'invert(1)',opacity:.3}}/>
                  <span style={{fontSize:'0.72rem'}}>Camera off</span>
                </div>
              )}
              {/* Viewer list overlay */}
              {showViewers&&hosting&&(
                <div style={{position:'absolute',top:0,right:0,bottom:0,width:'min(160px,50%)',background:'rgba(0,0,0,.85)',padding:'8px',overflowY:'auto'}}>
                  <div style={{fontSize:'0.65rem',color:'rgba(255,255,255,.5)',fontWeight:700,marginBottom:6,textTransform:'uppercase',letterSpacing:'.5px'}}>Viewers ({viewers.length})</div>
                  {viewers.length===0&&<div style={{fontSize:'0.68rem',color:'rgba(255,255,255,.3)'}}>No viewers yet</div>}
                  {viewers.map(v=>(
                    <div key={v.viewerId} style={{fontSize:'0.72rem',color:'#e0e0f0',padding:'3px 0',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
                      👤 {v.viewerName}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Controls */}
            <div style={{padding:'6px 8px',display:'flex',gap:5,alignItems:'center',background:'#0d0d1a',flexWrap:'wrap'}}>
              {/* Camera switch */}
              {devices.length>1&&(
                <select value={selCam} onChange={e=>{setSelCam(e.target.value);switchCam(e.target.value)}}
                  style={{flex:1,minWidth:0,maxWidth:130,padding:'4px 6px',background:'#1a1a2e',color:'#c0c0e0',border:'1px solid #2d2d44',borderRadius:6,fontSize:'0.65rem'}}>
                  {devices.map((d,i)=><option key={d.deviceId} value={d.deviceId}>{d.label||`Camera ${i+1}`}</option>)}
                </select>
              )}
              {/* Switch cam single button if only 2 devices */}
              {devices.length===2&&(
                <IBT t="Switch Camera" fn={()=>switchCam(devices.find(d=>d.deviceId!==selCam)?.deviceId||selCam)}
                  img="/default_images/call/switch.svg" fb="fi fi-sr-rotate-right"/>
              )}
              <IBT t={micOn?'Mute mic':'Unmute'} fn={toggleMic} img="/default_images/icons/audio.svg" fb="fi fi-sr-microphone" active={micOn?undefined:false}/>
              <IBT t={camOn?'Hide cam':'Show cam'} fn={toggleCam} img="/default_images/icons/video.svg" fb="fi fi-sr-video-camera" active={camOn?undefined:false}/>
              {/* Filter picker */}
              <select value={filter} onChange={e=>setFilter(e.target.value)}
                style={{padding:'4px 5px',background:'#1a1a2e',color:'#c0c0e0',border:'1px solid #2d2d44',borderRadius:6,fontSize:'0.63rem',maxWidth:70}}>
                {FILTERS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
              {!hosting
                ?<button onClick={start} style={{marginLeft:'auto',padding:'5px 14px',borderRadius:7,border:'none',background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',fontWeight:800,cursor:'pointer',fontSize:'0.75rem',letterSpacing:'.3px'}}>▶ Go Live</button>
                :<button onClick={stop}  style={{marginLeft:'auto',padding:'5px 14px',borderRadius:7,border:'none',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'#fff',fontWeight:800,cursor:'pointer',fontSize:'0.75rem',letterSpacing:'.3px'}}>■ Stop</button>
              }
            </div>
          </div>
        )}

        {/* WATCH TAB */}
        {tab==='watch'&&(
          <div style={{flex:1,display:'flex',flexDirection:'column'}}>
            {watching?(
              <>
                <div style={{position:'relative',background:'#000',aspectRatio:'16/9',maxHeight:220,overflow:'hidden'}}>
                  <video ref={watchVideoRef} autoPlay playsInline
                    style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                  <div style={{position:'absolute',top:6,left:8,background:'rgba(0,0,0,.6)',borderRadius:6,padding:'2px 8px',fontSize:'0.65rem',color:'#fff',fontWeight:700}}>
                    📡 {watching.username}
                  </div>
                </div>
                <div style={{padding:'5px 8px',display:'flex',gap:5,alignItems:'center',background:'#0d0d1a'}}>
                  <button onClick={stopWatching} style={{padding:'4px 12px',borderRadius:6,border:'none',background:'rgba(239,68,68,.2)',color:'#ef4444',fontWeight:700,cursor:'pointer',fontSize:'0.72rem',border:'1px solid rgba(239,68,68,.3)'}}>Leave</button>
                  <span style={{fontSize:'0.68rem',color:'rgba(255,255,255,.4)'}}>Watching {watching.username}</span>
                </div>
              </>
            ):(
              <div style={{padding:'10px 8px'}}>
                <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,.4)',marginBottom:8,fontWeight:600}}>Live cams in this room</div>
                {otherCams.length===0&&(
                  <div style={{textAlign:'center',padding:'16px 0',color:'rgba(255,255,255,.25)',fontSize:'0.72rem'}}>No one is live right now</div>
                )}
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {otherCams.map(c=>(
                    <button key={c.userId} onClick={()=>watchUser(c)}
                      style={{padding:'5px 10px',borderRadius:7,border:'1px solid rgba(26,115,232,.4)',background:'rgba(26,115,232,.12)',color:'#93c5fd',fontSize:'0.72rem',fontWeight:700,cursor:'pointer'}}>
                      📡 {c.username}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}



export { WebcamPanel }
