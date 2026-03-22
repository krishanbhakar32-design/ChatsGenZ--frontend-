/**
 * GiftPanel.jsx — FINAL FIXED
 * Gift icons: /gifts/rose.svg ✅ (assets exist at /gifts/)
 * Gold icon: /default_images/icons/gold.svg ✅
 */
import { useState, useEffect } from 'react'
const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

function resolveGiftIcon(iconField) {
  if (!iconField) return null
  if (iconField.startsWith('http')) return iconField
  if (iconField.startsWith('/')) return iconField
  return `/gifts/${iconField}`
}

export default function GiftPanel({ targetUser, myGold, onClose, onSent, socket, roomId }) {
  const [gifts,    setGifts]   = useState([])
  const [cats,     setCats]    = useState([])
  const [cat,      setCat]     = useState('all')
  const [selected, setSelected]= useState(null)
  const [sending,  setSending] = useState(false)
  const [err,      setErr]     = useState('')
  const token = localStorage.getItem('cgz_token')

  useEffect(() => {
    fetch(`${API}/api/gifts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setGifts(d.gifts || [])
        const allCats = ['all', ...new Set((d.gifts || []).map(g => g.category).filter(Boolean))]
        setCats(allCats)
      }).catch(() => {})
  }, [])

  async function sendGift() {
    if (!selected) return
    setSending(true); setErr('')
    try {
      if (socket && roomId) {
        socket.emit('sendGift', {
          toUserId: targetUser._id || targetUser.userId,
          giftId: selected._id,
          roomId
        })
        setSending(false)
        onSent?.()
        return
      }
      const r = await fetch(`${API}/api/gifts/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toUserId: targetUser._id || targetUser.userId, giftId: selected._id, roomId })
      })
      const d = await r.json()
      if (!r.ok) { setErr(d.error || 'Failed to send gift'); setSending(false); return }
      onSent?.()
    } catch { setErr('Network error') }
    setSending(false)
  }

  const filtered  = cat === 'all' ? gifts : gifts.filter(g => g.category === cat)
  const canAfford = selected && myGold >= selected.price

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1001, background:'rgba(0,0,0,.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:18, maxWidth:380, width:'100%', overflow:'hidden', boxShadow:'0 16px 48px rgba(0,0,0,.18)' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid #f3f4f6' }}>
          <div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'0.95rem', color:'#111827' }}>
              <i className="fi fi-sr-gift" style={{ marginRight:7, color:'#7c3aed' }}/>
              Send a Gift{targetUser?.username ? ` to ${targetUser.username}` : ''}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3 }}>
              <img src="/default_images/icons/gold.svg" alt="" style={{ width:13, height:13 }} onError={() => {}} />
              <span style={{ fontSize:'0.74rem', fontWeight:700, color:'#d97706' }}>Balance: {myGold || 0} Gold</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', width:30, height:30, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#6b7280' }}>
            <i className="fi fi-sr-cross-small"/>
          </button>
        </div>

        {/* Category tabs */}
        <div style={{ display:'flex', gap:4, padding:'8px 14px', overflowX:'auto', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ padding:'4px 12px', borderRadius:20, border:`1.5px solid ${cat===c?'#7c3aed':'#e4e6ea'}`, background:cat===c?'#ede9fe':'none', cursor:'pointer', fontSize:'0.75rem', fontWeight:700, color:cat===c?'#7c3aed':'#6b7280', whiteSpace:'nowrap', flexShrink:0, transition:'all .15s' }}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Gift grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, padding:'12px 14px', maxHeight:220, overflowY:'auto' }}>
          {filtered.map(g => (
            <div key={g._id} onClick={() => setSelected(g)}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 6px', borderRadius:10, border:`2px solid ${selected?._id===g._id?'#7c3aed':'#e4e6ea'}`, cursor:'pointer', background:selected?._id===g._id?'#ede9fe':'#f9fafb', transition:'all .15s' }}
              onMouseEnter={e => { if (selected?._id!==g._id) { e.currentTarget.style.borderColor='#c4b5fd'; e.currentTarget.style.background='#f5f3ff' }}}
              onMouseLeave={e => { if (selected?._id!==g._id) { e.currentTarget.style.borderColor='#e4e6ea'; e.currentTarget.style.background='#f9fafb' }}}
            >
              <img src={resolveGiftIcon(g.icon)} alt={g.name} style={{ width:36, height:36, objectFit:'contain', marginBottom:4 }} onError={e => e.target.style.display='none'}/>
              <span style={{ fontSize:'0.65rem', fontWeight:700, color:'#374151', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%' }}>{g.name}</span>
              <div style={{ display:'flex', alignItems:'center', gap:2, marginTop:2 }}>
                <img src="/default_images/icons/gold.svg" alt="" style={{ width:10, height:10 }} onError={() => {}} />
                <span style={{ fontSize:'0.65rem', fontWeight:700, color:'#d97706' }}>{g.price}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'20px', color:'#9ca3af', fontSize:'0.8rem' }}>No gifts available</div>}
        </div>

        {/* Send */}
        <div style={{ padding:'10px 14px 14px', borderTop:'1px solid #f3f4f6' }}>
          {err && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'8px 12px', fontSize:'0.8rem', color:'#dc2626', marginBottom:8 }}>{err}</div>}
          {selected && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f5f3ff', borderRadius:9, marginBottom:10, border:'1px solid #ede9fe' }}>
              <img src={resolveGiftIcon(selected.icon)} alt="" style={{ width:28, height:28, objectFit:'contain' }} onError={e => e.target.style.display='none'}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#7c3aed' }}>{selected.name}</div>
                <div style={{ fontSize:'0.72rem', color:'#9ca3af' }}>{selected.price} Gold</div>
              </div>
              {!canAfford && <span style={{ fontSize:'0.72rem', color:'#ef4444', fontWeight:600 }}>Not enough Gold</span>}
            </div>
          )}
          <button onClick={sendGift} disabled={!selected || !canAfford || sending}
            style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', background:selected&&canAfford&&!sending?'linear-gradient(135deg,#7c3aed,#5b21b6)':'#f3f4f6', color:selected&&canAfford&&!sending?'#fff':'#9ca3af', fontWeight:800, cursor:selected&&canAfford&&!sending?'pointer':'not-allowed', fontSize:'0.875rem', fontFamily:'Outfit,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <i className="fi fi-sr-gift"/>
            {sending ? 'Sending...' : selected ? `Send ${selected.name} — ${selected.price} Gold` : 'Select a gift'}
          </button>
        </div>
      </div>
    </div>
  )
}
