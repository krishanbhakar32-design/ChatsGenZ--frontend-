import { useNavigate, useLocation } from 'react-router-dom'

export default function Kicked() {
  const nav      = useNavigate()
  const location = useLocation()
  const reason   = location.state?.reason || 'You were kicked from the room.'
  const isBan    = location.state?.isBan  || false

  return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:18, padding:'36px 32px', maxWidth:400, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,.1)' }}>
        <div style={{ width:72, height:72, background: isBan?'#fee2e2':'#fef3c7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:32 }}>
          {isBan ? '🚫' : '👢'}
        </div>
        <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'#111827', fontSize:'1.2rem', marginBottom:8 }}>
          {isBan ? 'You Have Been Banned' : 'You Were Kicked'}
        </h2>
        <p style={{ color:'#6b7280', fontSize:'0.875rem', lineHeight:1.6, marginBottom:20 }}>
          {reason}
        </p>
        {isBan && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, padding:'10px 14px', fontSize:'0.8rem', color:'#dc2626', marginBottom:16, lineHeight:1.5 }}>
            If you believe this is a mistake, please <a href="/contact" style={{ color:'#1a73e8', fontWeight:700 }}>contact support</a>.
          </div>
        )}
        <button onClick={()=>nav('/chat')}
          style={{ padding:'11px 28px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:'Outfit,sans-serif', fontSize:'0.875rem' }}>
          ← Back to Lobby
        </button>
      </div>
    </div>
  )
}
