// ============================================================
// ChatGames.jsx — Game components: SpinWheel, Dice, Keno, GamesPanel
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { API } from './chatConstants.js'

function SpinWheelGame({socket,myGold,onClose}) {
  const [spinning,setSpinning]=useState(false)
  const [rotation,setRotation]=useState(0)
  const [result,setResult]=useState(null)
  const [bet,setBet]=useState(10)
  const [notification,setNotification]=useState(null)

  // Segments with multipliers
  const SEGS=[
    {label:'2×',  mult:2,   color:'#1a73e8'},{label:'0×',  mult:0,   color:'#ef4444'},
    {label:'1.5×',mult:1.5, color:'#059669'},{label:'💀',  mult:0,   color:'#6b7280'},
    {label:'3×',  mult:3,   color:'#f59e0b'},{label:'0×',  mult:0,   color:'#ef4444'},
    {label:'1.5×',mult:1.5, color:'#059669'},{label:'💀',  mult:0,   color:'#6b7280'},
  ]
  const n=SEGS.length, sa=360/n, cx=100, cy=100, r=88

  const BET_STEPS=[2,5,10,20,50,100,200,500]
  function incBet(){const i=BET_STEPS.findIndex(v=>v>=bet);setBet(BET_STEPS[Math.min(i+1,BET_STEPS.length-1)])}
  function decBet(){const i=BET_STEPS.findLastIndex(v=>v<bet);setBet(i>=0?BET_STEPS[i]:BET_STEPS[0])}

  // Listen for backend spin result
  useEffect(()=>{
    if(!socket) return
    const onSpin=({prize,index,newGold})=>{
      // Map backend index to visual segment
      const target=5*360+(n-(index%n))*sa+sa/2
      setRotation(prev=>prev+target)
      setTimeout(()=>{
        setSpinning(false)
        setNotification({text:prize>0?`🎡 You won ${prize} Gold! 🎉`:'🎡 Better luck next time!',win:prize>0})
        setTimeout(()=>setNotification(null),3500)
      },3200)
    }
    const onErr=({msg})=>{setSpinning(false);setNotification({text:`❌ ${msg}`,win:false});setTimeout(()=>setNotification(null),4000)}
    socket.on('spinResult',onSpin); socket.on('error',onErr)
    return()=>{ socket.off('spinResult',onSpin); socket.off('error',onErr) }
  },[socket])

  function spin() {
    if(spinning) return
    setSpinning(true); setNotification(null)
    socket?.emit('spinWheel',{})
    // Visual rotation (actual result comes from backend)
    const randIdx=Math.floor(Math.random()*n)
    const target=5*360+(n-randIdx)*sa+sa/2
    setRotation(prev=>prev+target)
  }

  return(
    <>
      {/* Top floating notification */}
      {notification&&(
        <div style={{position:'fixed',top:60,left:'50%',transform:'translateX(-50%)',zIndex:9999,
          background:notification.win?'#dcfce7':'#fee2e2',
          border:`1px solid ${notification.win?'#86efac':'#fecaca'}`,
          color:notification.win?'#15803d':'#dc2626',
          padding:'10px 20px',borderRadius:30,fontWeight:700,fontSize:'0.9rem',
          boxShadow:'0 4px 20px rgba(0,0,0,.2)',fontFamily:'Outfit,sans-serif',
          animation:'slideDown .3s ease-out',whiteSpace:'nowrap'}}>
          {notification.text}
        </div>
      )}
      <div onClick={e=>e.stopPropagation()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1005,padding:16}}>
        <div style={{background:'#fff',borderRadius:18,padding:'16px 14px',maxWidth:240,width:'100%',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.95rem',color:'#111827'}}>🎡 Spin Wheel</span>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:15}}><i className="fi fi-sr-cross-small"/></button>
          </div>
          {/* Wheel */}
          <div style={{position:'relative',width:200,height:200,margin:'0 auto 10px'}}>
            <div style={{position:'absolute',top:-8,left:'50%',transform:'translateX(-50%)',width:0,height:0,borderLeft:'8px solid transparent',borderRight:'8px solid transparent',borderTop:'16px solid #ef4444',zIndex:10}}/>
            <svg width={200} height={200} style={{transition:spinning?'transform 3.2s cubic-bezier(0.17,0.67,0.12,0.99)':'',transform:`rotate(${rotation}deg)`,transformOrigin:'center'}}>
              {SEGS.map((seg,i)=>{
                const s=(i*sa-90)*Math.PI/180, e=((i+1)*sa-90)*Math.PI/180
                const x1=cx+r*Math.cos(s),y1=cy+r*Math.sin(s),x2=cx+r*Math.cos(e),y2=cy+r*Math.sin(e)
                const m=((i+0.5)*sa-90)*Math.PI/180,tx=cx+(r*.66)*Math.cos(m),ty=cy+(r*.66)*Math.sin(m)
                return(
                  <g key={i}>
                    <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`} fill={seg.color} stroke="#fff" strokeWidth={2}/>
                    <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={10} fontWeight={700}>{seg.label}</text>
                  </g>
                )
              })}
              <circle cx={cx} cy={cy} r={14} fill="#fff" stroke="#e4e6ea" strokeWidth={2}/>
            </svg>
          </div>
          <div style={{background:'#f9fafb',borderRadius:8,padding:'6px 10px',marginBottom:10,fontSize:'0.75rem',color:'#6b7280',textAlign:'center'}}>
            🎡 Free spin once every 24 hours! Prizes: 5 to 500 Gold
          </div>
          <button onClick={spin} disabled={spinning}
            style={{width:'100%',padding:'10px',borderRadius:10,border:'none',background:spinning?'#f3f4f6':'linear-gradient(135deg,#f59e0b,#d97706)',color:spinning?'#9ca3af':'#fff',fontWeight:800,cursor:spinning?'not-allowed':'pointer',fontSize:'0.88rem',fontFamily:'Outfit,sans-serif'}}>
            {spinning?'Spinning...':'🎡 Spin (Free Daily!)'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// MINI CARD
// ─────────────────────────────────────────────────────────────
// MINI CARD
// ─────────────────────────────────────────────────────────────
function DiceRoll({value, onDone}) {
  const [face,setFace]=useState(1), [rolling,setRolling]=useState(true)
  useEffect(()=>{
    let count=0, max=14
    const t=setInterval(()=>{
      setFace(Math.floor(Math.random()*6)+1)
      count++
      if(count>=max){clearInterval(t);setFace(value);setRolling(false);setTimeout(onDone,1800)}
    },120)
    return()=>clearInterval(t)
  },[value])
  const DOTS=[[],[4],[4,6],[4,5,6],[1,4,6,9],[1,4,5,6,9],[1,4,6,7,9,3]]
  const dots=DOTS[face]||[]
  return(
    <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9999,pointerEvents:'none',textAlign:'center'}}>
      <div style={{width:80,height:80,background:'linear-gradient(145deg,#fff,#f0f0f0)',borderRadius:16,border:'2px solid #e4e6ea',boxShadow:'0 8px 32px rgba(0,0,0,.25), inset 0 1px 2px rgba(255,255,255,.8)',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gridTemplateRows:'1fr 1fr 1fr',padding:10,gap:4,animation:rolling?'diceShake .12s infinite':'diceBounce .4s ease-out'}}>
        {[1,2,3,4,5,6,7,8,9].map(p=>(<div key={p} style={{display:'flex',alignItems:'center',justifyContent:'center'}}>{dots.includes(p)&&<div style={{width:12,height:12,background:'#1a1a2e',borderRadius:'50%',boxShadow:'0 1px 2px rgba(0,0,0,.3)'}}/>}</div>))}
      </div>
      {!rolling&&<div style={{marginTop:10,fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1.1rem',color:face===6?'#22c55e':'#374151',textShadow:'0 1px 3px rgba(0,0,0,.2)'}}>{face===6?'🎉 WIN!':'😅 '+face}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WHISPER — Ghost message visible only to sender & target
// ─────────────────────────────────────────────────────────────
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

function KenoGame({socket,roomId,myGold,onClose}) {
  const [sel,setSel]=useState([])
  const [bet,setBet]=useState(10)
  const [result,setResult]=useState(null)
  const [waiting,setWait]=useState(false)
  const [drawn,setDrawn]=useState([])
  const [animIdx,setAnimIdx]=useState(-1)
  const NUMS=Array.from({length:80},(_,i)=>i+1)

  // Bet steps: 2,4,5,10,20,50,100,200,500,1000 - double after 10
  const BET_STEPS=[2,4,5,10,20,50,100,200,500,1000]
  function incBet(){const i=BET_STEPS.findIndex(v=>v>bet);setBet(i>=0?BET_STEPS[i]:BET_STEPS[BET_STEPS.length-1])}
  function decBet(){const i=BET_STEPS.findLastIndex(v=>v<bet);setBet(i>=0?BET_STEPS[i]:BET_STEPS[0])}

  function toggleNum(n) {
    if(waiting||drawn.length>0) return
    setSel(p=>p.includes(n)?p.filter(x=>x!==n):p.length<10?[...p,n]:p)
    setResult(null)
  }

  function clearPicks() {
    if(waiting) return
    setSel([]); setResult(null); setDrawn([]); setAnimIdx(-1)
  }

  useEffect(()=>{
    if(!socket) return
    const onResult=({picks,drawn:d,matches,total,multiplier,bet:b,payout,won,newGold})=>{
      // Animate drawn numbers one by one
      setDrawn(d)
      let i=0
      const interval=setInterval(()=>{
        setAnimIdx(d[i])
        i++
        if(i>=d.length){
          clearInterval(interval)
          setResult({matches,total,multiplier,payout,won,newGold})
          setWait(false)
        }
      },120)
    }
    const onError=({msg})=>{ setWait(false); alert(msg) }
    socket.on('kenoResult',onResult)
    socket.on('kenoError',onError)
    return()=>{ socket.off('kenoResult',onResult); socket.off('kenoError',onError) }
  },[socket])

  function play() {
    if(sel.length<2||waiting) return
    setWait(true); setResult(null); setDrawn([]); setAnimIdx(-1)
    socket?.emit('playKeno',{roomId,picks:sel,bet})
  }

  return(
    <div onClick={e=>e.stopPropagation()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1005,padding:8}}>
      <div style={{background:'#1a1a2e',borderRadius:14,padding:'14px',maxWidth:360,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,.5)',color:'#fff'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1rem'}}>Keno</span>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:18}}>✕</button>
        </div>
        {/* Gold balance */}
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
          <span style={{fontSize:'1.1rem'}}>🪙</span>
          <span style={{fontWeight:800,fontSize:'1rem',color:'#fbbf24'}}>{myGold||0}</span>
          <button style={{marginLeft:'auto',width:24,height:24,borderRadius:'50%',background:'#374151',border:'none',color:'#9ca3af',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>?</button>
        </div>
        {/* Number grid - 10 cols x 8 rows = 80 numbers */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:3,marginBottom:10}}>
          {NUMS.map(n=>{
            const isSel=sel.includes(n)
            const isDrawn=drawn.includes(n)
            const isMatch=isSel&&isDrawn
            const isAnimating=animIdx===n
            let bg='#374151',color='#d1d5db',border='transparent'
            if(isMatch){bg='#22c55e';color='#fff';border='#22c55e'}
            else if(isDrawn&&!isSel){bg='#1e3a5f';color='#60a5fa';border='#3b82f6'}
            else if(isSel){bg='#3b82f6';color='#fff';border='#3b82f6'}
            if(isAnimating&&!isSel){bg='#1d4ed8';color='#fff'}
            return(
              <button key={n} onClick={()=>toggleNum(n)}
                style={{height:26,borderRadius:5,border:`1.5px solid ${border}`,background:bg,cursor:'pointer',fontSize:'0.68rem',fontWeight:700,color,transition:'all .08s',transform:isAnimating?'scale(1.15)':'scale(1)'}}>
                {n}
              </button>
            )
          })}
        </div>
        {/* Bottom: trash + bet - value + draw */}
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={clearPicks} style={{width:36,height:36,borderRadius:8,background:'#ef4444',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>
            🗑️
          </button>
          <div style={{display:'flex',alignItems:'center',gap:6,flex:1,justifyContent:'center'}}>
            <button onClick={decBet} style={{width:28,height:28,borderRadius:6,background:'#374151',border:'none',color:'#fff',cursor:'pointer',fontWeight:700,fontSize:16}}>−</button>
            <div style={{textAlign:'center',minWidth:60}}>
              <div style={{fontSize:'0.65rem',color:'#9ca3af'}}>Bet</div>
              <div style={{fontWeight:800,fontSize:'0.95rem',color:'#fbbf24'}}>{bet}</div>
            </div>
            <button onClick={incBet} style={{width:28,height:28,borderRadius:6,background:'#374151',border:'none',color:'#fff',cursor:'pointer',fontWeight:700,fontSize:16}}>+</button>
          </div>
          <div style={{textAlign:'center',minWidth:60}}>
            <div style={{fontSize:'0.65rem',color:'#9ca3af'}}>Payout</div>
            <div style={{fontWeight:800,fontSize:'0.95rem',color:'#22c55e'}}>{result?result.payout:0}</div>
          </div>
          <button onClick={play} disabled={sel.length<2||waiting}
            style={{padding:'8px 16px',borderRadius:8,border:'none',background:sel.length<2||waiting?'#374151':'#22c55e',color:'#fff',fontWeight:800,cursor:sel.length<2||waiting?'not-allowed':'pointer',fontSize:'0.88rem',fontFamily:'Outfit,sans-serif',flexShrink:0}}>
            {waiting?'...':'Draw'}
          </button>
        </div>
        {result&&(
          <div style={{marginTop:10,padding:'8px 12px',borderRadius:8,background:result.won?'rgba(34,197,94,.2)':'rgba(239,68,68,.15)',border:`1px solid ${result.won?'#22c55e':'#ef4444'}`,textAlign:'center',fontSize:'0.82rem',fontWeight:700,color:result.won?'#22c55e':'#ef4444'}}>
            {result.won?`🎉 ${result.matches}/${result.total} hits · ×${result.multiplier} · +${result.payout}`:`😅 ${result.matches}/${result.total} hits · -${bet}`}
          </div>
        )}
        {/* Pays table */}
        <div style={{marginTop:10,fontSize:'0.65rem',color:'#6b7280',textAlign:'center'}}>Pays table · Select 2-10 numbers · {sel.length} selected</div>
      </div>
    </div>
  )
}

function GamesPanel({socket,roomId,myGold=0}) {
  const [showSpin,setShowSpin]=useState(false)
  const [showKeno,setShowKeno]=useState(false)
  const [showDice,setShowDice]=useState(false)
  const [diceVal,setDiceVal]=useState(null)
  const DICE_BET=100

  // Listen for server result to drive animation
  useEffect(()=>{
    if(!socket) return
    function onDiceResult({roll}){setDiceVal(roll);setShowDice(true)}
    socket.on('diceResult',onDiceResult)
    return()=>socket.off('diceResult',onDiceResult)
  },[socket])

  function rollDice() {
    if(myGold<DICE_BET){alert(`Need ${DICE_BET} gold to play dice! You have ${myGold}.`);return}
    socket?.emit('rollDice',{roomId})
  }

  const GAMES=[
    {id:'dice', icon:'fi-sr-dice',  label:'🎲 Dice',       desc:'Roll to win gold',  color:'#7c3aed', action:rollDice},
    {id:'spin', icon:'fi-sr-wheel', label:'🎡 Spin Wheel', desc:'Spin to multiply!', color:'#f59e0b', action:()=>setShowSpin(true)},
    {id:'keno', icon:'fi-sr-grid',  label:'🎯 Keno',       desc:'Pick 2-10 numbers', color:'#1a73e8', action:()=>setShowKeno(true)},
  ]
  return (
    <div style={{padding:10,flex:1,overflowY:'auto'}}>
      {GAMES.map(g=>(
        <button key={g.id} onClick={g.action}
          style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'11px 12px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:10,cursor:'pointer',marginBottom:8,textAlign:'left',transition:'all .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.background=`${g.color}12`;e.currentTarget.style.borderColor=g.color}}
          onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e4e6ea'}}>
          <div style={{width:36,height:36,borderRadius:9,background:`${g.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
            <i className={`fi ${g.icon}`} style={{color:g.color}}/>
          </div>
          <div>
            <div style={{fontSize:'0.86rem',fontWeight:700,color:'#111827'}}>{g.label}</div>
            <div style={{fontSize:'0.72rem',color:'#9ca3af'}}>{g.desc}</div>
          </div>
        </button>
      ))}
      {showDice&&diceVal&&<DiceRoll value={diceVal} onDone={()=>{setShowDice(false);setDiceVal(null)}}/>}
      {showSpin&&<SpinWheelGame socket={socket} myGold={myGold||0} onClose={()=>setShowSpin(false)}/>}
      {showKeno&&<KenoGame socket={socket} roomId={roomId} myGold={myGold||0} onClose={()=>setShowKeno(false)}/>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LEADERBOARD — with proper icons from public folder

export { SpinWheelGame, DiceRoll, KenoGame, GamesPanel }
