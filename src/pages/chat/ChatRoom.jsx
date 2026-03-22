/**
 * ChatRoom.jsx — Main chat room page
 * Composed of separate components; see src/components/chat/
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useToast } from '../../components/Toast.jsx'
import { Sounds } from '../../utils/sounds.js'
import { RANKS, RL, R, GBR, RIcon } from '../../utils/chatHelpers.js'

import HBtn            from '../../components/chat/HBtn.jsx'
import GifPicker       from '../../components/chat/GifPicker.jsx'
import Message         from '../../components/chat/Message.jsx'
import MiniCard        from '../../components/chat/MiniCard.jsx'
import RightSidebar    from '../../components/chat/RightSidebar.jsx'
import LeftSidebar     from '../../components/chat/LeftSidebar.jsx'
import RadioPanel      from '../../components/chat/RadioPanel.jsx'
import AvatarDropdown  from '../../components/chat/AvatarDropdown.jsx'
import NotifPanel      from '../../components/chat/NotifPanel.jsx'
import FriendPanel     from '../../components/chat/FriendPanel.jsx'
import ChatFooter      from '../../components/chat/ChatFooter.jsx'
import GiftPanel       from '../../components/chat/GiftPanel.jsx'
import CallUI          from '../../components/chat/CallUI.jsx'
import TypingIndicator from '../../components/chat/TypingIndicator.jsx'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

function ProfileModal({ user, onClose }) {
  if (!user) return null
  const ri  = R(user.rank)
  const bdr = GBR(user.gender, user.rank)
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:18, maxWidth:340, width:'100%', padding:'20px', boxShadow:'0 16px 48px rgba(0,0,0,.18)', textAlign:'center' }}>
        <img src={user.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{ width:72, height:72, borderRadius:'50%', border:`3px solid ${bdr}`, objectFit:'cover', margin:'0 auto 10px', display:'block' }} onError={e=>(e.target.src='/default_images/avatar/default_guest.png')}/>
        <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:user.nameColor||'#111827' }}>{user.username}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginTop:4 }}>
          <RIcon rank={user.rank} size={14}/><span style={{ fontSize:'0.75rem', color:ri.color, fontWeight:700 }}>{ri.label}</span>
        </div>
        {user.about&&<p style={{ fontSize:'0.8rem', color:'#6b7280', marginTop:10, lineHeight:1.5 }}>{user.about}</p>}
        <button onClick={onClose} style={{ marginTop:14, padding:'8px 20px', borderRadius:8, border:'none', background:'#f3f4f6', color:'#374151', fontWeight:600, cursor:'pointer' }}>Close</button>
      </div>
    </div>
  )
}

export default function ChatRoom() {
  const { roomId } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const token = localStorage.getItem('cgz_token')

  const [me,          setMe]       = useState(null)
  const [room,        setRoom]     = useState(null)
  const [messages,    setMsgs]     = useState([])
  const [users,       setUsers]    = useState([])
  const [input,       setInput]    = useState('')
  const [typers,      setTypers]   = useState([])
  const [showRight,   setRight]    = useState(true)
  const [showLeft,    setLeft]     = useState(false)
  const [showRadio,   setRadio]    = useState(false)
  const [showNotif,   setShowNotif]= useState(false)
  const [showDM,      setShowDM]   = useState(false)
  const [showFriends, setFriends]  = useState(false)
  const [showGif,     setShowGif]  = useState(false)
  const [profUser,    setProf]     = useState(null)
  const [miniCard,    setMini]     = useState(null)
  const [giftTarget,  setGiftTgt]  = useState(null)
  const [activeCall,  setCall]     = useState(null)
  const [loading,     setLoad]     = useState(true)
  const [roomErr,     setErr]      = useState('')
  const [connected,   setConn]     = useState(false)
  const [status,      setStatus]   = useState('online')
  const [notif,       setNotif]    = useState({ dm:0, friends:0, notif:0 })

  const sockRef     = useRef(null)
  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)
  const typingTimer = useRef(null)
  const isTypingRef = useRef(false)

  useEffect(() => {
    if (!token) { nav('/login'); return }
    init()
    return () => sockRef.current?.disconnect()
  }, [roomId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  async function init() {
    setLoad(true); setErr('')
    try {
      const [mr, rr] = await Promise.all([
        fetch(`${API}/api/auth/me`,         { headers:{ Authorization:`Bearer ${token}` } }),
        fetch(`${API}/api/rooms/${roomId}`,  { headers:{ Authorization:`Bearer ${token}` } }),
      ])
      if (mr.status === 401) { localStorage.removeItem('cgz_token'); nav('/login'); return }
      const md = await mr.json()
      if (md.user) { if (md.freshToken) localStorage.setItem('cgz_token', md.freshToken); setMe(md.user) }
      const rd = await rr.json()
      if (!rr.ok) { setErr(rd.error||'Room not found'); setLoad(false); return }
      setRoom(rd.room)
      fetch(`${API}/api/rooms/${roomId}/messages?limit=50`, { headers:{ Authorization:`Bearer ${token}` } })
        .then(r=>r.json()).then(d=>{ if(d.messages?.length) setMsgs(d.messages) }).catch(()=>{})
    } catch { setErr('Connection failed.') }
    setLoad(false)
    connectSocket()
  }

  function connectSocket() {
    const s = io(API, { auth:{ token }, transports:['websocket','polling'], reconnection:true, reconnectionAttempts:10, reconnectionDelay:1000 })
    s.on('connect',        ()=>{ setConn(true); s.emit('joinRoom',{ roomId }) })
    s.on('disconnect',     ()=>setConn(false))
    s.on('connect_error',  ()=>setConn(false))
    s.on('messageHistory', ms=>{ if(ms?.length) setMsgs(ms) })
    s.on('newMessage',     m=>{ setMsgs(p=>p.find(x=>x._id===m._id)?p:[...p,m]); Sounds.newMessage() })
    s.on('messageDeleted', ({messageId})=>setMsgs(p=>p.filter(m=>m._id!==messageId)))
    s.on('roomUsers',      l=>setUsers(l||[]))
    s.on('userJoined',     u=>setUsers(p=>p.find(x=>x.userId===u.userId)?p:[...p,u]))
    s.on('userLeft',       u=>setUsers(p=>p.filter(x=>x.userId!==u.userId)))
    s.on('systemMessage',  m=>{ if(m.type==='game'||m.type==='mod'||m.type==='mute') setMsgs(p=>[...p,{_id:Date.now()+'sys',type:'system',content:m.text,createdAt:new Date()}]) })
    s.on('typing',         ({username,isTyping:t})=>setTypers(p=>t?[...new Set([...p,username])]:p.filter(n=>n!==username)))
    s.on('youAreKicked',   ({reason})=>{ Sounds.mute(); toast?.show(reason||'You were kicked','error',5000); setTimeout(()=>nav('/chat'),1500) })
    s.on('accessDenied',   ({msg})=>{ toast?.show(msg||'Access denied','error',5000); setTimeout(()=>nav('/chat'),1500) })
    s.on('youAreMuted',    ({minutes})=>{ Sounds.mute(); toast?.show(`🔇 Muted for ${minutes} min`,'warn',6000) })
    s.on('levelUp',        ({level,gold})=>{ Sounds.levelUp(); toast?.show(`🎉 Level ${level}! +${gold} Gold`,'success',5000) })
    s.on('giftReceived',   ({gift,from})=>{ Sounds.gift(); toast?.show(`🎁 ${from} sent you ${gift?.name||'a gift'}!`,'gift',5000) })
    s.on('diceResult',     ({roll,won,payout,bet})=>toast?.show(won?`🎲 Rolled ${roll}! Won ${payout} Gold! 🎉`:`🎲 Rolled ${roll}. Lost ${bet} Gold.`,won?'success':'warn',4000))
    s.on('kenoResult',     ({hits,payout,won,bet})=>toast?.show(won?`🎯 ${hits} hits! Won ${payout} Gold! 🎉`:`🎯 ${hits} hits. Lost ${bet} Gold.`,won?'success':'warn',4000))
    s.on('spinResult',     ({prize})=>toast?.show(prize>0?`🎡 Spin: Won ${prize} Gold! 🎉`:'🎡 No prize this time.','info',4000))
    s.on('mentioned',      ()=>Sounds.mention())
    s.on('incomingCall',   ({callId,callType,fromUser})=>setCall({callId,callType,fromUser,status:'incoming'}))
    s.on('error',          e=>{ if(typeof e==='object') toast?.show(e.msg||'Error','error',3000) })
    sockRef.current = s
  }

  function handleTyping(e) {
    setInput(e.target.value)
    if (!isTypingRef.current) { isTypingRef.current=true; sockRef.current?.emit('typing',{roomId,isTyping:true}) }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(()=>{ isTypingRef.current=false; sockRef.current?.emit('typing',{roomId,isTyping:false}) },2000)
  }

  function send(e) {
    e.preventDefault()
    const t = input.trim()
    if (!t || !sockRef.current?.connected) return
    sockRef.current.emit('sendMessage',{roomId,content:t,type:'text'})
    setInput('')
    isTypingRef.current=false; sockRef.current?.emit('typing',{roomId,isTyping:false})
    inputRef.current?.focus()
  }

  function sendGif(gifUrl) {
    if (!sockRef.current?.connected) return
    sockRef.current.emit('sendMessage',{roomId,content:gifUrl,type:'gif'})
    setShowGif(false)
  }

  function leave() { sockRef.current?.disconnect(); nav('/chat') }

  const handleMention  = useCallback(u=>{ setInput(p=>p+(p?'\n':'')+u+' '); inputRef.current?.focus() },[])
  const handleMiniCard = useCallback((user,pos)=>{ setMini({user,pos}); setProf(null) },[])
  const closeAll       = useCallback(()=>{ setMini(null); setShowNotif(false); setShowDM(false); setShowFriends(false); setShowGif(false) },[])

  const myLevel = RANKS[me?.rank]?.level||1
  const isStaff = myLevel>=11

  if (!loading && roomErr) return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div style={{ fontSize:40 }}>⚠️</div>
      <p style={{ color:'#374151', fontWeight:600 }}>{roomErr}</p>
      <button onClick={()=>nav('/chat')} style={{ padding:'10px 22px', borderRadius:9, border:'none', background:'#1a73e8', color:'#fff', fontWeight:700, cursor:'pointer' }}>← Back to Lobby</button>
    </div>
  )

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:32, height:32, border:'3px solid #e4e6ea', borderTop:'3px solid #1a73e8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 10px' }}/>
        <p style={{ color:'#9ca3af', fontSize:'0.9rem' }}>Joining room...</p>
      </div>
    </div>
  )

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#fff', overflow:'hidden' }} onClick={closeAll}>

      {/* HEADER */}
      <div style={{ height:48, background:'#fff', borderBottom:'1px solid #e4e6ea', display:'flex', alignItems:'center', padding:'0 8px', gap:5, flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
        <button onClick={e=>{e.stopPropagation();setLeft(s=>!s)}} title="Menu"
          style={{ background:showLeft?'#e8f0fe':'none', border:'none', cursor:'pointer', color:showLeft?'#1a73e8':'#6b7280', width:34, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
          <i className="fi fi-sr-bars-sort"/>
        </button>
        <div style={{ flex:1 }}/>

        {/* DM */}
        <div style={{ position:'relative' }}>
          <HBtn icon="fi-sr-envelope" title="Messages" badge={notif.dm} active={showDM}
            onClick={e=>{e.stopPropagation();setShowDM(p=>!p);setShowNotif(false);setShowFriends(false)}}/>
          {showDM&&(
            <div style={{ position:'absolute', right:0, top:'calc(100% + 6px)', background:'#fff', border:'1px solid #e4e6ea', borderRadius:14, width:300, height:380, boxShadow:'0 8px 28px rgba(0,0,0,.14)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', flexDirection:'column', gap:8 }} onClick={e=>e.stopPropagation()}>
              <i className="fi fi-sr-envelope" style={{ fontSize:28, opacity:0.3 }}/>
              <p style={{ fontSize:'0.875rem', fontWeight:600 }}>DM coming soon</p>
            </div>
          )}
        </div>

        {/* Friends */}
        <div style={{ position:'relative' }}>
          <HBtn icon="fi-sr-user-add" title="Friend Requests" badge={notif.friends} active={showFriends}
            onClick={e=>{e.stopPropagation();setShowFriends(p=>!p);setShowNotif(false);setShowDM(false)}}/>
          {showFriends&&<FriendPanel onClose={()=>setShowFriends(false)} onCount={n=>setNotif(p=>({...p,friends:n}))}/>}
        </div>

        {/* Notifications */}
        <div style={{ position:'relative' }}>
          <HBtn icon="fi-sr-bell" title="Notifications" badge={notif.notif} active={showNotif}
            onClick={e=>{e.stopPropagation();setShowNotif(p=>!p);setShowDM(false);setShowFriends(false)}}/>
          {showNotif&&<NotifPanel onClose={()=>setShowNotif(false)} onCount={n=>setNotif(p=>({...p,notif:n}))}/>}
        </div>

        {isStaff&&<HBtn icon="fi-sr-flag" title="Reports"/>}

        <AvatarDropdown me={me} status={status} setStatus={setStatus} onLeave={leave} socket={sockRef.current}/>
      </div>

      {/* BODY */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {showLeft&&<LeftSidebar room={room} socket={sockRef.current} roomId={roomId}/>}

        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {room?.topic&&(
            <div style={{ background:'#f8f9fa', borderBottom:'1px solid #e4e6ea', padding:'5px 14px', fontSize:'0.78rem', color:'#374151', flexShrink:0 }}>
              <i className="fi fi-sr-info" style={{ marginRight:5, color:'#1a73e8' }}/>{room.topic}
            </div>
          )}

          <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
            {messages.map((m,i)=>(
              <Message key={m._id||i} msg={m} myId={me?._id} myLevel={myLevel}
                onMiniCard={handleMiniCard} onMention={handleMention}
                socket={sockRef.current} roomId={roomId}/>
            ))}
            <TypingIndicator typers={typers.filter(t=>t!==me?.username)}/>
            <div ref={bottomRef}/>
          </div>

          {/* INPUT */}
          <div style={{ borderTop:'1px solid #e4e6ea', padding:'7px 10px', background:'#fff', flexShrink:0, position:'relative' }}>
            {showGif&&<GifPicker onSelect={sendGif} onClose={()=>setShowGif(false)}/>}
            <form onSubmit={send} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <button type="button" title="Emoji" style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:20, padding:'0 2px', flexShrink:0, display:'flex', alignItems:'center' }}>
                <i className="fi fi-rr-smile"/>
              </button>
              <button type="button" title="GIF" onClick={e=>{e.stopPropagation();setShowGif(p=>!p)}}
                style={{ background:showGif?'#e8f0fe':'none', border:'1px solid #e4e6ea', cursor:'pointer', color:showGif?'#1a73e8':'#9ca3af', fontSize:'0.7rem', fontWeight:800, padding:'3px 6px', flexShrink:0, borderRadius:5 }}>GIF</button>
              <input ref={inputRef} value={input} onChange={handleTyping}
                placeholder={connected?'Type a message...':'Reconnecting...'}
                disabled={!connected}
                style={{ flex:1, padding:'9px 14px', background:'#f9fafb', border:'1.5px solid #e4e6ea', borderRadius:22, color:'#111827', fontSize:'0.9rem', outline:'none', transition:'border-color .15s', fontFamily:'Nunito,sans-serif' }}
                onFocus={e=>(e.target.style.borderColor='#1a73e8')} onBlur={e=>(e.target.style.borderColor='#e4e6ea')}/>
              <button type="button" title="Gift" onClick={e=>{e.stopPropagation();setGiftTgt({_id:null,username:'Room'})}}
                style={{ background:'none', border:'none', cursor:'pointer', padding:'0 2px', flexShrink:0, display:'flex', alignItems:'center' }}>
                <img src="/default_images/icons/gift.svg" alt="" style={{ width:19, height:19, objectFit:'contain' }} onError={e=>{e.target.outerHTML='<i class="fi fi-sr-gift" style="font-size:17px;color:#9ca3af"></i>'}}/>
              </button>
              <button type="submit" disabled={!input.trim()||!connected}
                style={{ width:36, height:36, borderRadius:'50%', border:'none', background:input.trim()&&connected?'linear-gradient(135deg,#1a73e8,#1464cc)':'#f3f4f6', color:input.trim()&&connected?'#fff':'#9ca3af', cursor:input.trim()&&connected?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                <i className="fi fi-sr-paper-plane"/>
              </button>
            </form>
          </div>
        </div>

        {showRight&&<RightSidebar users={users} myLevel={myLevel} onUserClick={u=>{setProf(u);setMini(null)}} onClose={()=>setRight(false)}/>}
      </div>

      {/* FOOTER */}
      <div style={{ position:'relative' }}>
        {showRadio&&<RadioPanel onClose={()=>setRadio(false)}/>}
        <ChatFooter showRadio={showRadio} setShowRadio={setRadio} showRight={showRight} setRight={setRight} notif={notif}/>
      </div>

      {/* OVERLAYS */}
      {miniCard&&<MiniCard user={miniCard.user} myLevel={myLevel} pos={miniCard.pos} onClose={()=>setMini(null)} onFull={()=>{setProf(miniCard.user);setMini(null)}} onGift={u=>setGiftTgt(u)} socket={sockRef.current} roomId={roomId}/>}
      {profUser&&<ProfileModal user={profUser} onClose={()=>setProf(null)}/>}
      {giftTarget&&<GiftPanel targetUser={giftTarget} myGold={me?.gold||0} onClose={()=>setGiftTgt(null)} onSent={()=>{setGiftTgt(null);toast?.show('Gift sent! 🎁','gift',3000)}} socket={sockRef.current} roomId={roomId}/>}
      {activeCall&&<CallUI call={activeCall} socket={sockRef.current} onEnd={()=>setCall(null)}/>}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
