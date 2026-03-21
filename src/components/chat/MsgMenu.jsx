import { useEffect } from 'react'

export default function MsgMenu({ msg, pos, myLevel, myId, onClose, socket, roomId }) {
  useEffect(()=>{
    const fn = e => { onClose() }
    document.addEventListener('click', fn)
    return ()=>document.removeEventListener('click', fn)
  },[])

  const isMine  = msg.sender?._id === myId
  const canMod  = myLevel >= 11
  const canDelete = isMine || canMod

  const x = Math.min(pos.x, window.innerWidth  - 180)
  const y = Math.min(pos.y, window.innerHeight - 240)

  function quote() {
    const ev = new CustomEvent('cgz:quote', { detail: msg })
    window.dispatchEvent(ev)
    onClose()
  }

  function del() {
    socket?.emit('deleteMessage', { messageId: msg._id, roomId })
    onClose()
  }

  function pin() {
    socket?.emit('pinMessage', { messageId: msg._id, roomId })
    onClose()
  }

  const ITEMS = [
    { icon:'fi-sr-reply',           label:'Reply',        fn: quote },
    { icon:'fi-sr-copy-alt',        label:'Copy',         fn: ()=>{ navigator.clipboard.writeText(msg.content||'').catch(()=>{}); onClose() } },
    canMod && { icon:'fi-sr-thumbtack', label:'Pin Message', fn: pin },
    canDelete && { icon:'fi-sr-trash', label:'Delete',    fn: del,  color:'#ef4444' },
    !isMine && { icon:'fi-sr-flag',  label:'Report',      fn: onClose, color:'#ef4444' },
  ].filter(Boolean)

  return (
    <div style={{position:'fixed',top:y,left:x,zIndex:9998,background:'#fff',border:'1px solid #e4e6ea',borderRadius:10,minWidth:168,boxShadow:'0 6px 20px rgba(0,0,0,.13)',overflow:'hidden'}}
      onClick={e=>e.stopPropagation()}
    >
      {ITEMS.map((item,i)=>(
        <button key={i} onClick={item.fn}
          style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:'9px 13px',background:'none',border:'none',cursor:'pointer',color:item.color||'#374151',fontSize:'0.83rem',fontWeight:600,textAlign:'left',transition:'background .12s',borderBottom:i<ITEMS.length-1?'1px solid #f9fafb':'none'}}
          onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}
        >
          <i className={`fi ${item.icon}`} style={{fontSize:13,width:15,textAlign:'center',flexShrink:0}}/>{item.label}
        </button>
      ))}
    </div>
  )
}
