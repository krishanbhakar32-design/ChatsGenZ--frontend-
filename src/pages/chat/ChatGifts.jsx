// ============================================================
// ChatGifts.jsx — Gift sending panel
// Single click on gift card = immediate send + coin deduction
// ============================================================
import { useState, useEffect } from 'react'
import { API } from './chatConstants.js'

function GiftPanel({targetUser, myGold, onClose, onSent, socket, roomId, onGoldSpent}) {
  const [gifts, setGifts]         = useState([])
  const [cat, setCat]             = useState('all')
  const [sending, setSending]     = useState(null)
  const [lastSent, setLastSent]   = useState(null)
  const [localGold, setLocalGold] = useState(myGold || 0)
  const token = localStorage.getItem('cgz_token')

  useEffect(() => {
    fetch(`${API}/api/gifts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setGifts(d.gifts || [])).catch(() => {})
  }, [])

  useEffect(() => { setLocalGold(myGold || 0) }, [myGold])

  const cats = ['all', ...new Set(gifts.map(g => g.category))]
  const filtered = cat === 'all' ? gifts : gifts.filter(g => g.category === cat)

  function sendGift(g) {
    if (sending) return
    if (localGold < g.price) return
    setSending(g._id)
    setLocalGold(p => p - g.price)
    onGoldSpent?.(g.price)
    socket?.emit('sendGift', { toUserId: targetUser._id || targetUser.userId, giftId: g._id, roomId })
    setLastSent(g)
    setTimeout(() => { setSending(null); onSent?.() }, 1400)
  }

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1001,background:'rgba(0,0,0,.48)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:12}}>
      <div onClick={e => e.stopPropagation()} style={{background:'#fff',borderRadius:16,maxWidth:380,width:'100%',overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,.22)'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderBottom:'1px solid #f3f4f6'}}>
          <div>
            <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.92rem',color:'#111827'}}>
              Gift to {targetUser?.username || '...'}
            </div>
            <div style={{fontSize:'0.72rem',marginTop:2,display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontWeight:800,color:'#d97706'}}>{localGold} Gold</span>
              <span style={{color:'#9ca3af'}}>balance</span>
            </div>
          </div>
          <button onClick={onClose} style={{background:'#f3f4f6',border:'none',width:28,height:28,borderRadius:7,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#6b7280',fontSize:12}}>
            <i className="fi fi-sr-cross-small"/>
          </button>
        </div>

        {/* Sent flash */}
        {lastSent && (
          <div style={{background:'#f0fdf4',borderBottom:'1px solid #bbf7d0',padding:'7px 14px',fontSize:'0.8rem',color:'#15803d',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
            <img src={lastSent.icon} alt="" style={{width:20,height:20,objectFit:'contain'}} onError={e => e.target.style.display='none'}/>
            {lastSent.name} sent to {targetUser?.username}! (-{lastSent.price} Gold)
          </div>
        )}

        {/* Hint */}
        <div style={{padding:'5px 14px 2px',fontSize:'0.67rem',color:'#9ca3af',fontStyle:'italic'}}>
          Tap any gift to send instantly
        </div>

        {/* Category tabs */}
        <div style={{display:'flex',gap:4,padding:'6px 12px',overflowX:'auto',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{padding:'3px 11px',borderRadius:20,border:`1.5px solid ${cat===c?'#7c3aed':'#e4e6ea'}`,background:cat===c?'#ede9fe':'none',cursor:'pointer',fontSize:'0.72rem',fontWeight:700,color:cat===c?'#7c3aed':'#6b7280',whiteSpace:'nowrap',flexShrink:0,transition:'all .12s'}}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Gift grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,padding:'8px 12px 14px',maxHeight:230,overflowY:'auto'}}>
          {filtered.map(g => {
            const canAfford = localGold >= g.price
            const isSending = sending === g._id
            const isAny     = !!sending
            return (
              <div key={g._id}
                onClick={() => !isAny && canAfford && sendGift(g)}
                style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'7px 5px',borderRadius:10,
                  border:`2px solid ${isSending ? '#7c3aed' : canAfford ? '#e4e6ea' : '#f0f0f0'}`,
                  cursor: !isAny && canAfford ? 'pointer' : 'not-allowed',
                  background: isSending ? '#ede9fe' : canAfford ? '#f9fafb' : '#fafafa',
                  transition:'all .12s',
                  opacity: canAfford ? 1 : 0.42,
                  transform: isSending ? 'scale(0.92)' : 'scale(1)',
                }}
                onMouseEnter={e => { if (canAfford && !isAny) { e.currentTarget.style.borderColor='#7c3aed'; e.currentTarget.style.background='#ede9fe' }}}
                onMouseLeave={e => { if (!isSending) { e.currentTarget.style.borderColor=canAfford?'#e4e6ea':'#f0f0f0'; e.currentTarget.style.background=canAfford?'#f9fafb':'#fafafa' }}}>
                <div style={{position:'relative',marginBottom:3}}>
                  <img src={g.icon} alt={g.name} style={{width:34,height:34,objectFit:'contain',display:'block',transition:'transform .15s',transform:isSending?'scale(1.2)':'scale(1)'}} onError={e => e.target.style.display='none'}/>
                  {isSending && (
                    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(237,233,254,.7)',borderRadius:4}}>
                      <div style={{width:14,height:14,border:'2px solid #c4b5fd',borderTop:'2px solid #7c3aed',borderRadius:'50%',animation:'spin .6s linear infinite'}}/>
                    </div>
                  )}
                </div>
                <span style={{fontSize:'0.62rem',fontWeight:700,color:'#374151',textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',width:'100%'}}>{g.name}</span>
                <span style={{fontSize:'0.62rem',fontWeight:700,color:canAfford?'#d97706':'#d1d5db'}}>{g.price} G</span>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{gridColumn:'1/-1',textAlign:'center',padding:'20px',color:'#9ca3af',fontSize:'0.78rem'}}>No gifts available</div>
          )}
        </div>
      </div>
    </div>
  )
}

export { GiftPanel }
