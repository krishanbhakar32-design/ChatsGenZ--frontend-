export default function TypingIndicator({ typers }) {
  if (!typers || typers.length === 0) return null
  const text = typers.length===1 ? `${typers[0]} is typing...`
    : typers.length===2 ? `${typers[0]} and ${typers[1]} are typing...`
    : `${typers[0]} and ${typers.length-1} others are typing...`
  return (
    <div style={{padding:'2px 14px 6px',display:'flex',alignItems:'center',gap:8}}>
      <div style={{display:'flex',gap:3,alignItems:'center'}}>
        {[0,1,2].map(i=>(
          <span key={i} style={{width:5,height:5,background:'#9ca3af',borderRadius:'50%',display:'inline-block',animation:`typingDot .8s ease-in-out ${i*0.2}s infinite`}}/>
        ))}
      </div>
      <span style={{fontSize:'0.72rem',color:'#9ca3af',fontStyle:'italic'}}>{text}</span>
      <style>{`@keyframes typingDot{0%,80%,100%{transform:scale(0.8);opacity:.5}40%{transform:scale(1.1);opacity:1}}`}</style>
    </div>
  )
}
