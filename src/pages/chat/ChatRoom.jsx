// ============================================================
// ChatRoom.jsx — Main chat room page
// All heavy components are split into separate files:
//   chatConstants.js  — RANKS, API, helpers
//   ChatIcons.jsx     — UIIcon, RIcon, HBtn, FBtn
//   ChatMedia.jsx     — PaintingCanvas, GifPicker, YTPanel, EmoticonPicker, YTMessage
//   ChatGames.jsx     — DiceRoll (+ SpinWheelGame, KenoGame, GamesPanel via LeftSidebar)
//   ChatProfiles.jsx  — MiniCard, SelfProfileOverlay, ProfileModal
//   ChatMessages.jsx  — Msg
//   ChatSidebars.jsx  — RightSidebar, LeftSidebar, LeaderboardPanel, UsernamePanel
//   ChatRadio.jsx     — RadioPanel
//   ChatSocial.jsx    — FriendReqPanel, NotifPanel, DMPanel
//   ChatGifts.jsx     — GiftPanel
//   ChatSettings.jsx  — ChatSettingsOverlay, AvatarDropdown, Footer
//   ChatWebcam.jsx    — WebcamPanel
//   SpotifyPlayer.jsx — SpotifyEmbed, parseSpotifyUrl, isSpotifyUrl
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate }                   from 'react-router-dom'
import { io }                                        from 'socket.io-client'
import { THEMES }                                           from '../../components/StyleModal.jsx'
import { useToast }                                  from '../../components/Toast.jsx'
import { Sounds }                                    from '../../utils/sounds.js'

// ── Shared constants ──────────────────────────────────────────
import { API, RANKS, R, RL, GBR, isStaff, resolveNameColor } from './chatConstants.js'

// ── Icon components ───────────────────────────────────────────
import { HBtn }                                                          from './ChatIcons.jsx'

// ── Feature components ────────────────────────────────────────
import { PaintingCanvas, GifPicker, YTPanel, EmoticonPicker }            from './ChatMedia.jsx'
import { DiceRoll }                                                             from './ChatGames.jsx'
import { MiniCard, SelfProfileOverlay, ProfileModal }                    from './ChatProfiles.jsx'
import { Msg }                                                           from './ChatMessages.jsx'
import { RightSidebar, LeftSidebar }                                     from './ChatSidebars.jsx'
import { RadioPanel }                                                    from './ChatRadio.jsx'
import { FriendReqPanel, NotifPanel, DMPanel }                           from './ChatSocial.jsx'
import { GiftPanel }                                                     from './ChatGifts.jsx'
import { ChatSettingsOverlay, AvatarDropdown, Footer }                   from './ChatSettings.jsx'
import { WebcamPanel }                                                   from './ChatWebcam.jsx'

// ── SpotifyEmbedPanel — frontend-ready Spotify embed picker ───
function SpotifyEmbedPanel({ onClose, onSend }) {
  const [input, setInput] = useState('')
  const [embedId, setEmbedId] = useState(null)
  const [embedType, setEmbedType] = useState(null) // 'track' | 'playlist' | 'album' | 'artist'
  const [error, setError] = useState('')

  function parseSpotifyUrl(raw) {
    try {
      const url = raw.trim()
      // Match: open.spotify.com/track/ID or spotify:track:ID
      const webMatch = url.match(/open\.spotify\.com\/(track|playlist|album|artist)\/([A-Za-z0-9]+)/)
      if (webMatch) return { type: webMatch[1], id: webMatch[2] }
      const uriMatch = url.match(/spotify:(track|playlist|album|artist):([A-Za-z0-9]+)/)
      if (uriMatch) return { type: uriMatch[1], id: uriMatch[2] }
    } catch {}
    return null
  }

  function handlePreview() {
    setError('')
    const parsed = parseSpotifyUrl(input)
    if (!parsed) { setError('Paste a valid Spotify link (song, playlist, album or artist)'); return }
    setEmbedId(parsed.id)
    setEmbedType(parsed.type)
  }

  function handleSend() {
    if (!embedId) return
    onSend(`https://open.spotify.com/${embedType}/${embedId}`)
  }

  const embedUrl = embedId ? `https://open.spotify.com/embed/${embedType}/${embedId}?utm_source=generator&theme=0` : null
  const embedH   = embedType === 'track' ? 152 : 352

  return (
    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:'calc(100% + 6px)',left:0,right:0,margin:'0 0',background:'#121212',border:'1px solid #1DB95455',borderRadius:14,padding:14,boxShadow:'0 8px 32px rgba(0,0,0,.45)',zIndex:60}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 1 1-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 0 1 .207.857zm1.223-2.722a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.973-.52.779.779 0 0 1 .52-.972c3.633-1.102 8.147-.568 11.234 1.329a.78.78 0 0 1 .256 1.072zm.105-2.835C14.69 8.95 9.375 8.775 6.297 9.71a.937.937 0 1 1-.543-1.795c3.528-1.068 9.393-.861 13.098 1.332a.937.937 0 0 1-.938 1.62z"/></svg>
        <span style={{fontWeight:700,fontSize:'0.88rem',color:'#fff',fontFamily:'Nunito,sans-serif'}}>Share Spotify</span>
        <span style={{marginLeft:'auto',fontSize:'0.7rem',color:'#1DB954',fontWeight:600}}>song · playlist · album · artist</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#6b7280',cursor:'pointer',fontSize:16,lineHeight:1,padding:'0 2px'}}>✕</button>
      </div>

      {/* URL input */}
      <div style={{display:'flex',gap:7,marginBottom:10}}>
        <input
          value={input}
          onChange={e=>{setInput(e.target.value);setError('');setEmbedId(null)}}
          onKeyDown={e=>e.key==='Enter'&&handlePreview()}
          placeholder="Paste Spotify link..."
          style={{flex:1,padding:'8px 12px',borderRadius:9,border:`1.5px solid ${error?'#ef4444':'#1DB95455'}`,background:'#1e1e1e',color:'#fff',fontSize:'0.83rem',outline:'none',fontFamily:'Nunito,sans-serif'}}
          onFocus={e=>e.target.style.borderColor='#1DB954'}
          onBlur={e=>e.target.style.borderColor=error?'#ef4444':'#1DB95455'}
          autoFocus
        />
        <button onClick={handlePreview}
          style={{padding:'8px 14px',borderRadius:9,border:'none',background:'#1DB954',color:'#000',fontWeight:700,fontSize:'0.8rem',cursor:'pointer',fontFamily:'Nunito,sans-serif',whiteSpace:'nowrap'}}>
          Preview
        </button>
      </div>

      {error&&<div style={{fontSize:'0.75rem',color:'#f87171',marginBottom:8,paddingLeft:2}}>{error}</div>}

      {/* Embed preview */}
      {embedUrl && (
        <div style={{borderRadius:10,overflow:'hidden',marginBottom:10}}>
          <iframe
            src={embedUrl}
            width="100%"
            height={embedH}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{display:'block',borderRadius:10}}
          />
        </div>
      )}

      {/* Send button */}
      {embedId && (
        <button onClick={handleSend}
          style={{width:'100%',padding:'9px',borderRadius:9,border:'none',background:'linear-gradient(135deg,#1DB954,#17a349)',color:'#000',fontWeight:800,fontSize:'0.85rem',cursor:'pointer',fontFamily:'Nunito,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
          <i className="fi fi-sr-paper-plane-top" style={{fontSize:14}}/>
          Share in chat
        </button>
      )}
    </div>
  )
}

// ── WhisperBox (kept inline — small and tightly coupled) ───────
function WhisperBox({target,roomId,socket,onClose}) {
  const [text,setText]=useState('')
  const [sent,setSent]=useState(false)
  function send(e){
    e.preventDefault()
    if(!text.trim()||!socket) return
    socket.emit('sendEcho',{toUserId:target.userId||target._id,content:text.trim(),roomId})
    setSent(true)
    setTimeout(()=>{setSent(false);setText('');onClose()},2000)
  }
  return(
    <div style={{position:'fixed',inset:0,zIndex:1010,background:'rgba(0,0,0,.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0 0 90px'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#1e1b4b',border:'1px solid #4338ca',borderRadius:14,padding:'14px',width:'min(420px,95vw)',boxShadow:'0 8px 32px rgba(79,70,229,.4)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <span style={{fontSize:'1.1rem'}}>👁️</span>
          <div style={{flex:1}}>
            <div style={{fontSize:'0.82rem',fontWeight:800,color:'#e0e7ff'}}>Whisper to <span style={{color:'#a78bfa'}}>{target.username}</span></div>
            <div style={{fontSize:'0.68rem',color:'#6366f1'}}>Only they can see this · staff cannot read</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#6366f1',cursor:'pointer',fontSize:16}}>✕</button>
        </div>
        {sent?(<div style={{textAlign:'center',padding:'10px',color:'#a78bfa',fontWeight:700,fontSize:'0.9rem'}}>👁️ Whisper sent!</div>):(
          <form onSubmit={send} style={{display:'flex',gap:8}}>
            <input autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder={`Whisper to ${target.username}...`} maxLength={500}
              style={{flex:1,padding:'9px 12px',background:'#312e81',border:'1.5px solid #4338ca',borderRadius:9,color:'#e0e7ff',fontSize:'0.875rem',outline:'none',fontFamily:'Nunito,sans-serif'}}
              onFocus={e=>e.target.style.borderColor='#818cf8'} onBlur={e=>e.target.style.borderColor='#4338ca'}/>
            <button type="submit" disabled={!text.trim()} style={{padding:'9px 14px',borderRadius:9,border:'none',background:text.trim()?'linear-gradient(135deg,#6366f1,#4338ca)':'#374151',color:'#fff',fontWeight:700,cursor:text.trim()?'pointer':'not-allowed'}}>
              👁️
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ChatRoom() {
  const {roomSlug}=useParams(), nav=useNavigate(), toast=useToast()
  const token=localStorage.getItem('cgz_token')

  const [me,        setMe]       =useState(null)
  const [room,      setRoom]     =useState(null)
  // roomId = resolved _id once room loads, fallback slug for API calls
  const roomId = room?._id || roomSlug
  const [messages,  setMsgs]     =useState([])
  const [users,     setUsers]    =useState([])
  const [input,     setInput]    =useState('')
  const [typers,    setTypers]   =useState([])
  const [showRight, setRight]    =useState(false)  // mobile-first: hidden by default
  const [showLeft,  setLeft]     =useState(false)
  const [showRadio, setRadio]    =useState(false)
  const [showNotif, setShowNotif]=useState(false)
  const [showDM,    setShowDM]   =useState(false)
  const [showFriends,setShowFriends]=useState(false)
  const [showChatSettings,setShowChatSettings]=useState(false)
  const [showPlus,  setShowPlus] =useState(false)
  const [showPaint, setShowPaint]=useState(false)
  const [showCam,   setShowCam]  =useState(false)
  const [showDiceAnim,setShowDiceAnim]=useState(false)
  const [diceRollVal, setDiceRollVal] =useState(null)
  const [whisperTarget,setWhisper]=useState(null)
  const [showGif,   setShowGif]  =useState(false)
  const [showYT,      setShowYT]      =useState(false)
  const [showSpotify, setShowSpotify] =useState(false)
  const [showEmoji,   setShowEmoji]   =useState(false)
  const [profUser,  setProf]     =useState(null)
  const [miniCard,  setMini]     =useState(null)
  const [giftTarget,setGiftTgt]  =useState(null)
  const [loading,   setLoad]     =useState(true)
  const [roomErr,   setErr]      =useState('')
  const [connected, setConn]     =useState(false)
  const [onlineCount,setOnlineCount]=useState(0)
  const [status,    setStatus]   =useState('online')
  const [notif,     setNotif]    =useState({dm:0,friends:0,notif:0,reports:0})
  const [hiddenMsgs,setHidden]   =useState(new Set())

  const sockRef=useRef(null), bottomRef=useRef(null), inputRef=useRef(null)
  const typingTimer=useRef(null), isTypingRef=useRef(false)

  useEffect(()=>{
    if(!token){nav('/login');return}
    loadRoom()
    return()=>sockRef.current?.disconnect()
  },[roomSlug])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  async function loadRoom() {
    setLoad(true); setErr('')
    try {
      const [mr,rr]=await Promise.all([
        fetch(`${API}/api/auth/me`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/rooms/${roomSlug}`,{headers:{Authorization:`Bearer ${token}`}}),
      ])
      if(mr.status===401){localStorage.removeItem('cgz_token');nav('/login');return}
      const md=await mr.json()
      if(md.user){if(md.freshToken)localStorage.setItem('cgz_token',md.freshToken);setMe(md.user)}
      const rd=await rr.json()
      if(!rr.ok){setErr(rd.error||'Room not found');setLoad(false);return}
      setRoom(rd.room)
      fetch(`${API}/api/rooms/${roomSlug}/messages?limit=50`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.messages)setMsgs(d.messages)}).catch(()=>{})
    } catch{setErr('Connection failed.')}
    setLoad(false)
  }

  // Connect socket only after room object is available (so roomId = room._id works)
  useEffect(()=>{
    if(!room?._id) return
    connectSocket()
    return()=>sockRef.current?.disconnect()
  },[room?._id])

  function connectSocket() {
    sockRef.current?.disconnect()
    const s=io(API,{auth:{token},transports:['websocket','polling']})
    s.on('connect',        ()=>{setConn(true);s.emit('joinRoom',{roomId})})
    s.on('disconnect',     ()=>setConn(false))
    s.on('messageHistory', ms=>setMsgs(ms||[]))
    s.on('newMessage',     m=>{setMsgs(p=>[...p,m]);Sounds.newMessage()})
    s.on('roomUsers',      l=>{setUsers(l||[])})
    s.on('roomUserCount',  n=>setOnlineCount(n))
    // Backend sends systemMessage for join/leave/kick/mute/ban/dice — NOT userJoined/userLeft
    s.on('systemMessage',  m=>{
      setMsgs(p=>[...p,{_id:Date.now()+'s'+Math.random(),type:m.type||'system',content:m.text,createdAt:new Date()}])
      if(m.type==='join') Sounds.join()
    })
    s.on('messageDeleted', ({messageId})=>setMsgs(p=>p.filter(m=>m._id!==messageId)))
    s.on('typing',         ({username,isTyping:t})=>setTypers(p=>t?[...new Set([...p,username])]:p.filter(n=>n!==username)))
    s.on('youAreKicked',   ({reason})=>{Sounds.mute();toast?.show(reason||'You were kicked','error',5000);setTimeout(()=>nav('/chat'),2000)})
    s.on('accessDenied',   ({msg})=>{toast?.show(msg||'Access denied','error',5000);setTimeout(()=>nav('/chat'),2000)})
    s.on('youAreMuted',    ({minutes})=>{Sounds.mute();toast?.show(`🔇 Muted for ${minutes} minutes`,'warn',6000)})
    s.on('levelUp',        ({level,gold})=>{Sounds.levelUp()})
    s.on('giftReceived',   ({gift,from})=>{Sounds.gift()})
    s.on('diceResult',     ({roll,won,payout,bet,newGold})=>{ setDiceRollVal(roll); setShowDiceAnim(true); if(newGold!==undefined) setMe(p=>p?{...p,gold:newGold}:p); const sysText=won?'🎲 You rolled '+roll+' and WON '+payout+' gold! 🎉':'🎲 You rolled '+roll+' and lost '+(bet||100)+' gold.'; setMsgs(p=>[...p,{_id:Date.now()+'dr',type:'dice',content:sysText,createdAt:new Date()}]); })
    s.on('spinResult',     ({prize})=>{})
    s.on('goldUpdated',    ({gold})=>setMe(p=>p?{...p,gold}:p))
    s.on('error',          e=>console.error('Socket:',e))
    // ── ADDITIONAL EVENTS ──────────────────────────────────
    s.on('roomTopic',      ({topic})=>setRoom(p=>p?{...p,topic}:p))
    s.on('topicChanged',   ({topic})=>setRoom(p=>p?{...p,topic}:p))
    s.on('roomUpdated',    d=>setRoom(p=>p?{...p,...d}:p))
    s.on('roomClosed',     ({message})=>{toast?.show(message||'Room closed','error',4000);setTimeout(()=>nav('/chat'),2000)})
    s.on('badgeEarned',    ({badge})=>{Sounds.badge()})
    s.on('mentioned',      ({by,content})=>{ /* mention notifications disabled */ })
    s.on('messageReaction',({messageId,reactions})=>{setMsgs(p=>p.map(m=>m._id===messageId?{...m,reactions}:m))})
    s.on('messagePinned',  ({messageId})=>{setMsgs(p=>p.map(m=>m._id===messageId?{...m,isPinned:true}:m))})
    s.on('userMuted',      ({userId:uid,minutes,by})=>{setMsgs(p=>[...p,{_id:Date.now()+'mu',type:'mute',content:`${by} muted a user for ${minutes} minutes`,createdAt:new Date()}])})
    s.on('userKicked',     ({userId:uid,by})=>{setMsgs(p=>[...p,{_id:Date.now()+'ki',type:'kick',content:`${by} kicked a user`,createdAt:new Date()}])})
    s.on('diceError',      ({msg})=>toast?.show(`🎲 ${msg}`,'error',4000))
    s.on('kenoError',      ({msg})=>toast?.show(`🎯 ${msg}`,'error',4000))
    s.on('kenoResult',     ({won,payout,matches,total,bet})=>{})
    s.on('gamePlayed',     ({game,player,won})=>{}) // already handled via systemMessage
    s.on('dailyBonusClaimed',({gold,xp})=>{})
    s.on('onlineCount',    n=>setOnlineCount(n))
    s.on('privateMessage', m=>{setNotif(p=>({...p,dm:p.dm+1}));Sounds.privateMsg()})
    s.on('giftSent',       ({gift,to})=>{})
    s.on('pmError',        ({error})=>toast?.show(error,'error',4000))
    s.on('echoMessage',    ({from,content,isEcho,to})=>{
      // Both sender (echo back) and recipient get this event
      // Always show if 'from' is present — creates whisper bubble in chat
      if(from) setMsgs(p=>[...p,{_id:Date.now()+'e',type:'whisper',content,sender:from,createdAt:new Date(),isEcho:true}])
    })
    s.on('echoError',      ({error})=>toast?.show(`👁️ ${error}`,'error',3000))
    s.on('roomPasswordRequired', ({roomId:rid,roomName})=>{
      const pw=window.prompt(`🔒 "${roomName}" requires a password:`)
      if(pw) s.emit('joinRoom',{roomId:rid,enteredPassword:pw})
      else nav('/chat')
    })
    sockRef.current=s
  }

  function handleTyping(e) {
    setInput(e.target.value)
    if(!isTypingRef.current){isTypingRef.current=true;sockRef.current?.emit('typing',{roomId,isTyping:true})}
    clearTimeout(typingTimer.current)
    typingTimer.current=setTimeout(()=>{isTypingRef.current=false;sockRef.current?.emit('typing',{roomId,isTyping:false})},2000)
  }

  function send(e) {
    e.preventDefault()
    const t=input.trim()
    if(!t||!sockRef.current||!connected) return
    sockRef.current.emit('sendMessage',{roomId,content:t,type:'text'})
    setInput('')
    isTypingRef.current=false; sockRef.current?.emit('typing',{roomId,isTyping:false})
    inputRef.current?.focus()
  }

  function leave(){sockRef.current?.disconnect();nav('/chat')}

  const handleMention=useCallback((text)=>{setInput(p=>text+(p?' '+p:''));inputRef.current?.focus()},[])
  const handleHide=useCallback((id)=>{setHidden(p=>new Set([...p,id]))},[])
  const handleMiniCard=useCallback((user,pos)=>{setMini({user,pos});setProf(null)},[])
  const myLevel=RANKS[me?.rank]?.level||1
  const isStaffRole=myLevel>=11

  // ── Active theme object (applied to header/body/input) ──
  const tObj = THEMES.find(t=>t.id===(me?.chatTheme||'Dolphin')) || THEMES.find(t=>t.id==='Dolphin') || THEMES[0]
  // Derived helpers
  const thBg      = tObj.bg_chat    // main chat background
  const thHeader  = tObj.bg_header  // header background
  const thText    = tObj.text       // primary text
  const thAccent  = tObj.accent     // accent / send button
  const thLog     = tObj.bg_log     // message bubble bg
  const thBgImg   = tObj.bg_image   // background image URL (may be empty)
  const thBorder  = tObj.default_color // border / divider color
  const thIsDark  = !['Dolphin','Lite'].includes(tObj.id) // use white/dark text logic
  const closeAll=useCallback(()=>{setMini(null);setShowNotif(false);setShowDM(false);setShowFriends(false);setShowPlus(false);setShowEmoji(false);setShowGif(false);setShowYT(false);setShowPaint(false);setShowSpotify(false)},[])

  if(!loading&&roomErr) return (
    <div style={{minHeight:'100dvh',background:'#f8f9fa',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:16}}>
      <div style={{fontSize:40}}>⚠️</div><p style={{color:'#374151',fontWeight:600,textAlign:'center'}}>{roomErr}</p>
      <button onClick={()=>nav('/chat')} style={{padding:'10px 22px',borderRadius:9,border:'none',background:'#1a73e8',color:'#fff',fontWeight:700,cursor:'pointer'}}>← Back to Lobby</button>
    </div>
  )
  if(loading) return (
    <div style={{minHeight:'100dvh',background:'#f8f9fa',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}><div style={{width:32,height:32,border:'3px solid #e4e6ea',borderTop:'3px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 10px'}}/><p style={{color:'#9ca3af',fontSize:'0.9rem'}}>Joining room...</p></div>
    </div>
  )

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',background:thBg,overflow:'hidden',position:'relative'}} onClick={closeAll}>
      {thBgImg&&<div style={{position:'fixed',inset:0,backgroundImage:`url(${thBgImg})`,backgroundSize:'cover',backgroundPosition:'center',backgroundRepeat:'no-repeat',zIndex:0,pointerEvents:'none',opacity:0.6}}/>}

      {/* ── HEADER ── */}
      <div style={{height:50,background:thHeader,borderBottom:`1px solid ${thBorder}22`,display:'flex',alignItems:'center',padding:'0 8px',gap:2,flexShrink:0,boxShadow:'0 1px 4px rgba(0,0,0,.18)'}}>
        {/* Hamburger */}
        <button onClick={e=>{e.stopPropagation();setLeft(s=>!s)}} title="Menu"
          style={{background:showLeft?thAccent+'33':'none',border:'none',cursor:'pointer',color:showLeft?thAccent:thText,width:34,height:34,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,opacity:0.9}}>
          <i className="fi fi-sr-bars-sort"/>
        </button>

        {/* Webcam button */}
        <HBtn img="/default_images/icons/webcam.svg" title="Webcam" active={showCam} onClick={e=>{e.stopPropagation();setShowCam(p=>!p)}}/>

        {/* Room name - center */}
        <div style={{flex:1,textAlign:'center',minWidth:0}}>
          <div style={{fontSize:'0.84rem',fontWeight:800,color:thText,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'Outfit,sans-serif'}}>{room?.name||'Chat Room'}</div>
          <div style={{fontSize:'0.62rem',color:connected?'#22c55e':thText+'88'}}>{connected?`● ${Math.max(users.length,onlineCount)||users.length} online`:'Connecting...'}</div>
        </div>

        {/* Right icons - using SVGs from public folder */}
        <div style={{position:'relative'}}>
          <HBtn img="/default_images/icons/comment.svg" title="Messages" badge={notif.dm} active={showDM} onClick={e=>{e.stopPropagation();setShowDM(p=>!p);setShowNotif(false)}}/>
          {showDM&&<DMPanel me={me} socket={sockRef.current} onClose={()=>setShowDM(false)} onCount={n=>setNotif(p=>({...p,dm:n}))}/>}
        </div>

        <div style={{position:'relative'}}>
          <HBtn icon="fi-sr-user-add" title="Friend Requests" badge={notif.friends} active={showFriends} onClick={e=>{e.stopPropagation();setShowFriends(p=>!p);setShowDM(false);setShowNotif(false)}}/>
          {showFriends&&<FriendReqPanel onClose={()=>setShowFriends(false)} onCount={n=>setNotif(p=>({...p,friends:n}))}/>}
        </div>

        <div style={{position:'relative'}}>
          <HBtn img="/default_images/icons/congratulation.svg" title="Notifications" badge={notif.notif} active={showNotif} onClick={e=>{e.stopPropagation();setShowNotif(p=>!p);setShowDM(false)}}/>
          {showNotif&&<NotifPanel onClose={()=>setShowNotif(false)} onCount={n=>setNotif(p=>({...p,notif:n}))}/>}
        </div>

        {isStaffRole&&<HBtn img="/default_images/icons/warning.svg" title="Reports" badge={notif.reports}/>}

        <AvatarDropdown me={me} status={status} setStatus={setStatus} onLeave={leave} socket={sockRef.current} onOpenSettings={()=>setShowChatSettings(true)} onOpenProfile={()=>setProf(me)}/>
      </div>

      {/* ── CHAT SETTINGS OVERLAY ── */}
      {showChatSettings&&(
        <ChatSettingsOverlay
          me={me}
          onClose={()=>setShowChatSettings(false)}
          onSaved={(updated)=>{if(updated)setMe(p=>({...p,...updated}))}}
        />
      )}

      {/* ── BODY ── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {showLeft&&<LeftSidebar room={room} nav={nav} socket={sockRef.current} roomId={room?._id||roomSlug} onClose={()=>setLeft(false)} me={me} onStyleSaved={(updated)=>{if(updated)setMe(p=>({...p,...updated}))}}/>}

        {/* MESSAGES */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0,background:thBg}}>
          {room?.topic&&(
            <div style={{background:thHeader,borderBottom:`1px solid ${thBorder}33`,padding:'8px 14px',fontSize:'0.78rem',color:thText,flexShrink:0,display:'flex',alignItems:'flex-start',gap:10}}>
              <i className="fi fi-sr-envelope" style={{fontSize:16,color:'#fbbf24',marginTop:1,flexShrink:0}}/>
              <span style={{flex:1,lineHeight:1.5}}>{room.topic}</span>
              <button onClick={()=>setRoom(p=>p?{...p,topic:''}:p)} style={{background:'none',border:'none',cursor:'pointer',color:'#64748b',fontSize:14,flexShrink:0,padding:0}}>✕</button>
            </div>
          )}

          {showCam&&<WebcamPanel socket={sockRef.current} roomId={roomId} me={me} onClose={()=>setShowCam(false)}/>}
          <div style={{flex:1,overflowY:'auto',padding:'6px 0'}}>
            {messages.map((m,i)=>(
              !hiddenMsgs.has(m._id)&&<Msg key={m._id||i} msg={m} myId={me?._id} myLevel={myLevel}
                onMiniCard={handleMiniCard} onMention={handleMention} onHide={handleHide}
                socket={sockRef.current} roomId={roomId}/>
            ))}
            {typers.filter(t=>t!==me?.username).length>0&&(
              <div style={{padding:'2px 12px 4px',display:'flex',alignItems:'center',gap:7}}>
                <div style={{display:'flex',gap:3}}>
                  {[0,1,2].map(i=><span key={i} style={{width:4,height:4,background:'#9ca3af',borderRadius:'50%',display:'inline-block',animation:`typingDot .8s ease-in-out ${i*0.2}s infinite`}}/>)}
                </div>
                <span style={{fontSize:'0.7rem',color:'#9ca3af',fontStyle:'italic'}}>{typers.filter(t=>t!==me?.username).join(', ')} typing...</span>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* ── INPUT BAR ── */}
          <div style={{borderTop:`1px solid ${thBorder}44`,padding:'5px 8px',background:thHeader,flexShrink:0,position:'relative'}}>
            {/* + popup */}
            {showPlus&&(
              <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:'calc(100% + 5px)',left:6,background:'#fff',border:'1px solid #e4e6ea',borderRadius:12,padding:8,display:'flex',gap:7,boxShadow:'0 4px 20px rgba(0,0,0,.14)',zIndex:50}}>
                {[
                  {type:'img',  icon:'/default_images/icons/upload.svg', fallback:'fi-sr-picture', label:'Image',   action:()=>{document.getElementById('cgz-img-input').click();setShowPlus(false)}},
                  {type:'img',  icon:'/default_images/icons/giphy.svg',  fallback:'fi-sr-gif',     label:'GIF',     action:()=>{setShowGif(p=>!p);setShowPlus(false)}},
                  {type:'emoji',emoji:'🎨',                                                         label:'Paint',   action:()=>{setShowPaint(true);setShowPlus(false)}},
                  {type:'img',  icon:'/default_images/icons/youtube.svg',fallback:'fi-br-youtube', label:'YouTube', action:()=>{setShowYT(p=>!p);setShowPlus(false)}},
                  {type:'spotify',                                                                  label:'Spotify', action:()=>{setShowSpotify(p=>!p);setShowPlus(false)}, active:showSpotify},
                  {type:'emoji',emoji:'🎲',                                                         label:'Dice',    action:()=>{
                    if((me?.gold||0)<100){toast?.show('🎲 Need 100 gold to play dice!','error',3000);setShowPlus(false);return;}
                    sockRef.current?.emit('rollDice',{roomId});setShowPlus(false);
                  }},
                ].map((b,i)=>(
                  <button key={i} onClick={b.action} title={b.label}
                    style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'8px 9px',background:b.active?'#e8fdf0':'#f9fafb',border:`1px solid ${b.active?'#1DB954':'#e4e6ea'}`,borderRadius:9,cursor:'pointer',minWidth:46,transition:'all .15s'}}>
                    {b.type==='spotify'
                      ? <svg width="22" height="22" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 1 1-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 0 1 .207.857zm1.223-2.722a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.973-.52.779.779 0 0 1 .52-.972c3.633-1.102 8.147-.568 11.234 1.329a.78.78 0 0 1 .256 1.072zm.105-2.835C14.69 8.95 9.375 8.775 6.297 9.71a.937.937 0 1 1-.543-1.795c3.528-1.068 9.393-.861 13.098 1.332a.937.937 0 0 1-.938 1.62z"/></svg>
                      : b.type==='emoji'
                      ? <span style={{fontSize:20}}>{b.emoji}</span>
                      : <><img src={b.icon} alt={b.label} style={{width:22,height:22,objectFit:'contain'}} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='block'}}/><i className={b.fallback} style={{display:'none',fontSize:18,color:'#6b7280'}}/></>}
                    <span style={{fontSize:'0.6rem',fontWeight:700,color:b.active?'#1DB954':'#374151'}}>{b.label}</span>
                  </button>
                ))}
              </div>
            )}
            {/* GIF picker */}
            {showGif&&<GifPicker onSelect={url=>{sockRef.current?.emit('sendMessage',{roomId,content:url,type:'gif'});setShowGif(false)}} onClose={()=>setShowGif(false)}/>}
            {/* YouTube panel */}
            {showYT&&<YTPanel onClose={()=>setShowYT(false)} onSend={url=>{sockRef.current?.emit('sendMessage',{roomId,content:url,type:'youtube'});setShowYT(false)}}/>}
            {/* Spotify panel */}
            {showSpotify&&<SpotifyEmbedPanel onClose={()=>setShowSpotify(false)} onSend={url=>{sockRef.current?.emit('sendMessage',{roomId,content:url,type:'spotify'});setShowSpotify(false)}}/>}
            {/* Paint canvas */}
            {showPaint&&<PaintingCanvas onSend={url=>{sockRef.current?.emit('sendMessage',{roomId,content:url,type:'image'});setShowPaint(false)}} onClose={()=>setShowPaint(false)}/>}
            {/* Emoticon picker */}
            {showEmoji&&<EmoticonPicker onSelect={em=>{setInput(p=>p+em);setShowEmoji(false);inputRef.current?.focus()}} onClose={()=>setShowEmoji(false)}/>}

            <input id="cgz-img-input" type="file" accept="image/*" style={{display:'none'}}
              onChange={async e=>{
                const f=e.target.files[0]; if(!f) return
                e.target.value=''
                try {
                  const fd=new FormData(); fd.append('image',f)
                  const r=await fetch(`${API}/api/upload/image`,{method:'POST',headers:{Authorization:`Bearer ${localStorage.getItem('cgz_token')}`},body:fd})
                  const d=await r.json()
                  if(r.ok&&d.url) sockRef.current?.emit('sendMessage',{roomId,content:d.url,type:'image'})
                  else toast?.show('Image upload failed','error',3000)
                } catch{toast?.show('Image upload failed','error',3000)}
              }}/>

            <form onSubmit={send} style={{display:'flex',alignItems:'center',gap:4}}>
              {/* + button — plain, no color */}
              <button type="button" onClick={e=>{e.stopPropagation();setShowPlus(p=>!p);setShowEmoji(false);setShowGif(false);setShowYT(false)}}
                style={{width:32,height:32,borderRadius:'50%',border:'1.5px solid #e4e6ea',background:showPlus?'#f3f4f6':'#fff',color:'#6b7280',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0,fontWeight:700,lineHeight:1,transition:'all .15s'}}>
                +
              </button>
              {/* Emoticon button — normal, not colorful */}
              <button type="button" onClick={e=>{e.stopPropagation();setShowEmoji(p=>!p);setShowPlus(false)}}
                style={{background:'none',border:'none',cursor:'pointer',color:'#6b7280',fontSize:20,padding:'0 1px',flexShrink:0,display:'flex',alignItems:'center',lineHeight:1,opacity:showEmoji?1:0.7}}>
                <img src="/icons/emoticon/happy.png" alt="" style={{width:22,height:22,objectFit:'contain'}} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='block'}}/>
                <i className="fi fi-rr-smile" style={{display:'none'}}/>
              </button>
              {/* Input */}
              <input ref={inputRef} value={input} onChange={handleTyping}
                placeholder={connected?'Type a message...':'Connecting...'}
                disabled={!connected}
                style={{flex:1,padding:'8px 12px',background:thLog||thBg,border:`1.5px solid ${thBorder}55`,borderRadius:22,color:thText,fontSize:'0.88rem',outline:'none',transition:'border-color .15s',fontFamily:'Nunito,sans-serif',minWidth:0}}
                onFocus={e=>e.target.style.borderColor=thAccent} onBlur={e=>e.target.style.borderColor=`${thBorder}55`}/>
              {/* Send */}
              <button type="submit" disabled={!input.trim()||!connected}
                style={{width:34,height:34,borderRadius:'50%',border:'none',background:input.trim()&&connected?thAccent:'#f3f4f6',color:input.trim()&&connected?'#fff':'#9ca3af',cursor:input.trim()&&connected?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0,boxShadow:input.trim()&&connected?`0 2px 8px ${thAccent}55`:'none',transition:'all .15s'}}>
                <i className="fi fi-sr-paper-plane-top"/>
              </button>
            </form>
          </div>
        </div>

        {showRight&&<RightSidebar users={users} myLevel={myLevel} onUserClick={(u,pos)=>{if(pos){handleMiniCard(u,pos)}else{setProf(u);setMini(null)}}} onWhisper={u=>setWhisper(u)} onClose={()=>setRight(false)} tObj={tObj}/>}
      </div>

      {/* ── FOOTER ── */}
      <div style={{position:'relative'}}>
        {showRadio&&<RadioPanel onClose={()=>setRadio(false)}/>}
        <Footer showRadio={showRadio} setShowRadio={setRadio} showRight={showRight} setRight={setRight} notif={notif}/>
      </div>

      {/* OVERLAYS */}
      {showDiceAnim&&diceRollVal&&<DiceRoll value={diceRollVal} onDone={()=>{setShowDiceAnim(false);setDiceRollVal(null)}}/>}
      {miniCard&&<MiniCard user={miniCard.user} myLevel={myLevel} pos={miniCard.pos} onClose={()=>setMini(null)} onFull={()=>{setProf(miniCard.user);setMini(null)}} onGift={u=>setGiftTgt(u)} socket={sockRef.current} roomId={roomId}/>}
      {profUser&&(profUser._id===me?._id
        ? <SelfProfileOverlay user={me} onClose={()=>setProf(null)} onUpdated={u=>{if(u)setMe(p=>({...p,...u}))}}/>
        : <ProfileModal user={profUser} myLevel={myLevel} socket={sockRef.current} roomId={roomId} onClose={()=>setProf(null)} onGift={u=>setGiftTgt(u)}/>
      )}
      {giftTarget&&<GiftPanel targetUser={giftTarget} myGold={me?.gold||0} onClose={()=>setGiftTgt(null)} onSent={()=>{setGiftTgt(null)}} socket={sockRef.current} roomId={roomId}/>}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes typingDot{0%,80%,100%{transform:scale(.8);opacity:.5}40%{transform:scale(1.1);opacity:1}}
        @keyframes diceShake{0%,100%{transform:translate(-50%,-50%) rotate(0deg)}25%{transform:translate(-48%,-52%) rotate(-8deg)}75%{transform:translate(-52%,-48%) rotate(8deg)}}
        @keyframes diceBounce{0%{transform:translate(-50%,-50%) scale(1.2)}50%{transform:translate(-50%,-55%) scale(0.95)}100%{transform:translate(-50%,-50%) scale(1)}}
        @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        *{-webkit-tap-highlight-color:transparent}
        input,textarea,select{font-size:16px!important}
      `}</style>
    </div>
  )
}
