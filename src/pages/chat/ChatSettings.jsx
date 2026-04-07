// ============================================================
// ChatSettings.jsx — ChatsGenZ v3 — Full Modal System
// 5 Fully working modals: Username Style, Text Style, Message Bubble, Sounds, Themes
// Mobile-first, real previews, all colors/fonts work
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { useNavigate }                  from 'react-router-dom'
import { API, R, GBR, RANKS, RL }      from './chatConstants.js'
import { THEMES }                       from '../../components/StyleModal.jsx'
import { FBtn }                         from './ChatIcons.jsx'
import { Sounds }                       from '../../utils/sounds.js'

// ── ALL COLOR DATA ────────────────────────────────────────────
const SOLID_COLORS = [
  '#ff3333','#ff6633','#ff9933','#ffcc33','#cccc00','#99cc00','#59b300','#829356',
  '#008000','#00e639','#00e673','#00e6ac','#00cccc','#03add8','#3366ff','#107896',
  '#004d99','#6633ff','#9933ff','#cc33ff','#ff33ff','#ff33cc','#ff3399','#ff3366',
  '#604439','#795548','#a97f70','#bc9b8f','#9E9E9E','#879fab','#698796','#495f69',
]
const NAME_GRADIENTS = [
  'linear-gradient(to right,#40e0d0,#ff8c00,#ff0080)',
  'linear-gradient(to right,#11998e,#38ef7d)',
  'linear-gradient(to right,#fc466b,#3f5efb)',
  'linear-gradient(to right,#00f260,#0575e6)',
  'linear-gradient(to right,#fc4a1a,#f7b733)',
  'linear-gradient(to right,#22c1c3,#fdbb2d)',
  'linear-gradient(to right,#7f00ff,#e100ff)',
  'linear-gradient(to right,#ee0979,#ff6a00)',
  'linear-gradient(to right,#00c3ff,#ffff1c)',
  'linear-gradient(to right,#fc00ff,#00dbde)',
  'linear-gradient(to right,#833ab4,#fd1d1d,#fcb045)',
  'linear-gradient(to right,#bdc3c7,#2c3e50)',
  'linear-gradient(to right,#373B44,#4286f4)',
  'linear-gradient(to right,#FF0099,#493240)',
  'linear-gradient(to right,#f953c6,#b91d73)',
  'linear-gradient(to right,#dd3e54,#6be585)',
  'linear-gradient(to right,#8360c3,#2ebf91)',
  'linear-gradient(to right,#544a7d,#ffd452)',
  'linear-gradient(to right,#009FFF,#ec2F4B)',
  'linear-gradient(to right,#59C173,#a17fe0,#5D26C1)',
  'linear-gradient(to right,#a8c0ff,#3f2b96)',
  'linear-gradient(45deg,#FF0000 0%,#FFA600 50%,#ff0000 100%)',
  'linear-gradient(to right,#108dc7,#ef8e38)',
  'linear-gradient(to right,#FF0099,#0575E6)',
  'linear-gradient(to right,#667db6,#0082c8,#ec38bc,#fdeff9)',
  'linear-gradient(to right,#03001e,#7303c0,#ec38bc,#fdeff9)',
  'linear-gradient(to right,#1a2a6c,#b21f1f,#fdbb2d)',
  'linear-gradient(to right,#3A1C71,#D76D77,#FFAF7B)',
  'linear-gradient(to right,#EB5757,#333)',
  'linear-gradient(to right,#20002c,#cbb4d4)',
  'linear-gradient(to right,#34e89e,#0f3443)',
  'linear-gradient(to right,#a80077,#66ff00)',
]
const NEON_COLORS = [
  { color:'#ff3333', shadow:'0 0 8px #ff3333,0 0 16px #ff333366,0 0 2px #fff' },
  { color:'#ff6633', shadow:'0 0 8px #ff6633,0 0 16px #ff663366,0 0 2px #fff' },
  { color:'#ff9933', shadow:'0 0 8px #ff9933,0 0 16px #ff993366,0 0 2px #fff' },
  { color:'#ffcc33', shadow:'0 0 8px #ffcc33,0 0 16px #ffcc3366,0 0 2px #fff' },
  { color:'#cccc00', shadow:'0 0 8px #cccc00,0 0 16px #cccc0066,0 0 2px #fff' },
  { color:'#99cc00', shadow:'0 0 8px #99cc00,0 0 16px #99cc0066,0 0 2px #fff' },
  { color:'#59b300', shadow:'0 0 8px #59b300,0 0 16px #59b30066,0 0 2px #fff' },
  { color:'#00e639', shadow:'0 0 8px #00e639,0 0 16px #00e63966,0 0 2px #fff' },
  { color:'#00e6ac', shadow:'0 0 8px #00e6ac,0 0 16px #00e6ac66,0 0 2px #fff' },
  { color:'#00cccc', shadow:'0 0 8px #00cccc,0 0 16px #00cccc66,0 0 2px #fff' },
  { color:'#03add8', shadow:'0 0 8px #03add8,0 0 16px #03add866,0 0 2px #fff' },
  { color:'#3366ff', shadow:'0 0 8px #3366ff,0 0 16px #3366ff66,0 0 2px #fff' },
  { color:'#6633ff', shadow:'0 0 8px #6633ff,0 0 16px #6633ff66,0 0 2px #fff' },
  { color:'#9933ff', shadow:'0 0 8px #9933ff,0 0 16px #9933ff66,0 0 2px #fff' },
  { color:'#cc33ff', shadow:'0 0 8px #cc33ff,0 0 16px #cc33ff66,0 0 2px #fff' },
  { color:'#ff33ff', shadow:'0 0 8px #ff33ff,0 0 16px #ff33ff66,0 0 2px #fff' },
  { color:'#ff33cc', shadow:'0 0 8px #ff33cc,0 0 16px #ff33cc66,0 0 2px #fff' },
  { color:'#ff3399', shadow:'0 0 8px #ff3399,0 0 16px #ff339966,0 0 2px #fff' },
  { color:'#ff3366', shadow:'0 0 8px #ff3366,0 0 16px #ff336666,0 0 2px #fff' },
  { color:'#9E9E9E', shadow:'0 0 8px #9E9E9E,0 0 16px #9e9e9e44,0 0 2px #fff' },
  { color:'#879fab', shadow:'0 0 8px #879fab,0 0 16px #879fab44,0 0 2px #fff' },
  { color:'#698796', shadow:'0 0 8px #698796,0 0 16px #69879644,0 0 2px #fff' },
  { color:'#ffffff', shadow:'0 0 8px #ffffff,0 0 16px #ffffff66' },
  { color:'#f59e0b', shadow:'0 0 8px #f59e0b,0 0 20px #f59e0b66,0 0 2px #fff' },
]
const BUBBLE_GRADIENTS = [
  'linear-gradient(90deg,#667eea,#764ba2)','linear-gradient(90deg,#f093fb,#f5576c)',
  'linear-gradient(90deg,#4facfe,#00f2fe)','linear-gradient(90deg,#43e97b,#38f9d7)',
  'linear-gradient(90deg,#fa709a,#fee140)','linear-gradient(90deg,#ff9a56,#ff6b9d)',
  'linear-gradient(90deg,#c471f5,#fa71cd)','linear-gradient(90deg,#12c2e9,#c471ed)',
  'linear-gradient(90deg,#f64f59,#c471ed)','linear-gradient(90deg,#24fe41,#fdbb2d)',
  'linear-gradient(45deg,#ff0844,#ffb199)','linear-gradient(45deg,#00d2ff,#3a7bd5)',
  'linear-gradient(45deg,#f953c6,#b91d73)','linear-gradient(45deg,#36d1dc,#5b86e5)',
  'linear-gradient(45deg,#ff9068,#fd746c)','linear-gradient(45deg,#667eea,#764ba2)',
  'linear-gradient(90deg,#ff5f6d,#ffc371)','linear-gradient(90deg,#11998e,#38ef7d)',
  'linear-gradient(90deg,#ee0979,#ff6a00)','linear-gradient(90deg,#fc5c7d,#6a82fb)',
  'linear-gradient(90deg,#8360c3,#2ebf91)','linear-gradient(90deg,#ff9966,#ff5e62)',
  'linear-gradient(90deg,#56ccf2,#2f80ed)','linear-gradient(90deg,#e96443,#904e95)',
  'linear-gradient(90deg,#f7971e,#ffd200)','linear-gradient(45deg,#00c6ff,#0072ff)',
  'linear-gradient(45deg,#7f00ff,#e100ff)','linear-gradient(45deg,#ff416c,#ff4b2b)',
  'linear-gradient(45deg,#00b09b,#96c93d)','linear-gradient(45deg,#ff6a00,#ee0979)',
  'linear-gradient(45deg,#43cea2,#185a9d)','linear-gradient(45deg,#c33764,#1d2671)',
  'linear-gradient(45deg,#da4453,#89216b)','linear-gradient(45deg,#06beb6,#48b1bf)',
  'linear-gradient(45deg,#f12711,#f5af19)','linear-gradient(90deg,#36d1dc,#ff6b6b)',
]
const BUBBLE_NEONS = BUBBLE_GRADIENTS.map((g, i) => {
  const glows = ['#a18cff','#ffb6ff','#7eefff','#8cffd9','#ffd580','#ffb38c','#e3b0ff','#9fe2ff','#ff99d9','#d2ff9c','#ff7ab3','#66e0ff','#ff88f5','#80e0ff','#ffb199','#a18cff','#ffd1a3','#9ff5f0','#ff85b3','#c9a9ff','#9bf6d5','#ffb199','#9fd4ff','#f7a0c2','#ffe680','#66d6ff','#d780ff','#ff9a80','#a8ff9f','#ff9abb','#7be2ff','#e06699','#ff8ca6','#7dfcff','#ffb866','#9ff5f0']
  return { gradient: g, glow: glows[i] || '#ffffff44' }
})
const FONTS = [
  { id:'',     name:'Default',           family:'inherit' },
  { id:'font1',name:'Kalam',             family:"'Kalam',cursive" },
  { id:'font2',name:'Signika',           family:"'Signika',sans-serif" },
  { id:'font3',name:'Grandstander',      family:"'Grandstander',cursive" },
  { id:'font4',name:'Comic Neue',        family:"'Comic Neue',cursive" },
  { id:'font5',name:'Quicksand',         family:"'Quicksand',sans-serif" },
  { id:'font6',name:'Orbitron',          family:"'Orbitron',sans-serif" },
  { id:'font7',name:'Lemonada',          family:"'Lemonada',cursive" },
  { id:'font8',name:'Grenze Gotisch',    family:"'Grenze Gotisch',cursive" },
  { id:'font9',name:'Merienda',          family:"'Merienda',cursive" },
  { id:'font10',name:'Amita',            family:"'Amita',cursive" },
  { id:'font11',name:'Averia Libre',     family:"'Averia Libre',cursive" },
  { id:'font12',name:'Turret Road',      family:"'Turret Road',cursive" },
  { id:'font13',name:'Sansita',          family:"'Sansita',sans-serif" },
  { id:'font14',name:'Comfortaa',        family:"'Comfortaa',cursive" },
  { id:'font15',name:'Charm',            family:"'Charm',cursive" },
  { id:'font16',name:'Lobster Two',      family:"'Lobster Two',cursive" },
  { id:'font17',name:'Pacifico',         family:"'Pacifico',cursive" },
  { id:'font18',name:'Dancing Script',   family:"'Dancing Script',cursive" },
  { id:'font19',name:'Righteous',        family:"'Righteous',cursive" },
  { id:'font20',name:'Fredoka One',      family:"'Fredoka One',cursive" },
  { id:'font21',name:'Press Start 2P',   family:"'Press Start 2P',cursive" },
  { id:'font22',name:'Caveat',           family:"'Caveat',cursive" },
  { id:'font23',name:'Satisfy',          family:"'Satisfy',cursive" },
  { id:'font24',name:'Indie Flower',     family:"'Indie Flower',cursive" },
  { id:'font25',name:'Gloria Hallelujah',family:"'Gloria Hallelujah',cursive" },
  { id:'font26',name:'Exo 2',            family:"'Exo 2',sans-serif" },
  { id:'font27',name:'Rajdhani',         family:"'Rajdhani',sans-serif" },
  { id:'font28',name:'Josefin Sans',     family:"'Josefin Sans',sans-serif" },
  { id:'font29',name:'Audiowide',        family:"'Audiowide',sans-serif" },
  { id:'font30',name:'Nunito',           family:"'Nunito',sans-serif" },
]
const SOUND_KEYS = [
  { key:'newMessage', label:'New Message',     file:'/sounds/new_messages.mp3', icon:'fa-solid fa-comment' },
  { key:'join',       label:'User Joined',     file:'/sounds/join.mp3',          icon:'fa-solid fa-right-to-bracket' },
  { key:'leave',      label:'User Left',       file:'/sounds/whistle.mp3',       icon:'fa-solid fa-right-from-bracket' },
  { key:'gift',       label:'Gift Received',   file:'/sounds/action.mp3',        icon:'fa-solid fa-gift' },
  { key:'levelUp',    label:'Level Up',        file:'/sounds/levelup.mp3',       icon:'fa-solid fa-star' },
  { key:'mention',    label:'Mention',         file:'/sounds/username.mp3',      icon:'fa-solid fa-at' },
  { key:'privateMsg', label:'Private Message', file:'/sounds/private.mp3',       icon:'fa-solid fa-envelope' },
  { key:'badge',      label:'Badge Earned',    file:'/sounds/badge.mp3',         icon:'fa-solid fa-certificate' },
  { key:'whisper',    label:'Whisper',         file:'/sounds/private.mp3',       icon:'fa-solid fa-hand-lizard' },
  { key:'quote',      label:'Quote Notify',    file:'/sounds/quote.mp3',         icon:'fa-solid fa-quote-left' },
  { key:'notify',     label:'Notification',    file:'/sounds/notify.mp3',        icon:'fa-solid fa-bell' },
  { key:'clear',      label:'Chat Clear',      file:'/sounds/clear.mp3',         icon:'fa-solid fa-broom' },
]
const STATUS_COLOR = { online:'#22c55e', away:'#f59e0b', busy:'#ef4444', invisible:'#9ca3af' }
const STATUS_OPTS  = [
  { id:'online',    label:'Online',    color:'#22c55e' },
  { id:'away',      label:'Away',      color:'#f59e0b' },
  { id:'busy',      label:'Busy',      color:'#ef4444' },
  { id:'invisible', label:'Invisible', color:'#9ca3af' },
]

function getSoundPrefs(){ try{return JSON.parse(localStorage.getItem('cgz_sounds')||'{}')}catch{return{}} }
function setSoundPref(k,v){ const p=getSoundPrefs();p[k]=v;localStorage.setItem('cgz_sounds',JSON.stringify(p)) }
function xpForLevel(lvl){ return Math.floor(100*Math.pow(lvl,1.5)) }

function getSelStyle(sel, solidPfx, gradPfx, neonPfx) {
  if (!sel) return {}
  if (sel.startsWith(solidPfx)) {
    const idx = parseInt(sel.replace(solidPfx,'')) - 1
    if (SOLID_COLORS[idx]) return { color: SOLID_COLORS[idx] }
  }
  if (sel.startsWith(gradPfx)) {
    const idx = parseInt(sel.replace(gradPfx,'')) - 1
    if (NAME_GRADIENTS[idx]) return { background: NAME_GRADIENTS[idx], WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }
  }
  if (sel.startsWith(neonPfx)) {
    const idx = parseInt(sel.replace(neonPfx,'')) - 1
    if (NEON_COLORS[idx]) return { color:'#fff', textShadow: NEON_COLORS[idx].shadow }
  }
  return {}
}

const SW = { width:30,height:30,borderRadius:6,cursor:'pointer',border:'2px solid transparent',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,margin:2,transition:'transform .1s,border-color .1s' }

// ── SHARED UI PIECES ──────────────────────────────────────────
function Overlay({ onClose, zIndex=9998 }) {
  return <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex,background:'rgba(0,0,0,0.72)',backdropFilter:'blur(3px)' }} />
}

function ModalBox({ children, maxW=460 }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:12,pointerEvents:'none' }}>
      <div onClick={e=>e.stopPropagation()}
        style={{ background:'#13151f',border:'1px solid rgba(255,255,255,0.08)',borderRadius:18,width:'100%',maxWidth:maxW,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 80px rgba(0,0,0,0.85)',overflow:'hidden',pointerEvents:'all' }}>
        {children}
      </div>
    </div>
  )
}

function MHeader({ title, icon, onClose, accent='#03add8' }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'14px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)',flexShrink:0,background:'#0e1018' }}>
      <span style={{ width:34,height:34,borderRadius:10,background:`${accent}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        <i className={icon} style={{ fontSize:15,color:accent }} />
      </span>
      <span style={{ fontWeight:800,fontSize:'0.95rem',color:'#f1f5f9',flex:1 }}>{title}</span>
      <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,color:'#888',cursor:'pointer',width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0 }}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  )
}

function MFooter({ onClose, onSave, saving, accent='#03add8' }) {
  return (
    <div style={{ display:'flex',gap:10,padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.06)',flexShrink:0,background:'#0e1018' }}>
      <button onClick={onClose} style={{ flex:1,padding:'10px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#9ca3af',fontWeight:700,fontSize:'0.83rem',cursor:'pointer',fontFamily:'inherit' }}>
        Cancel
      </button>
      <button onClick={onSave} disabled={saving}
        style={{ flex:2,padding:'10px',borderRadius:10,border:'none',background:saving?'#333':`linear-gradient(135deg,${accent},${accent}aa)`,color:'#fff',fontWeight:800,fontSize:'0.83rem',cursor:saving?'not-allowed':'pointer',fontFamily:'inherit',boxShadow:saving?'none':`0 4px 16px ${accent}44` }}>
        {saving ? '💾 Saving...' : '💾 Save'}
      </button>
    </div>
  )
}

function CTabs({ tab, setTab }) {
  return (
    <div style={{ display:'flex',gap:5,marginBottom:12 }}>
      {[['solid','🎨 Solid'],['gradient','🌈 Gradient'],['neon','✨ Neon']].map(([id,label]) => (
        <button key={id} onClick={()=>setTab(id)}
          style={{ flex:1,padding:'7px 4px',borderRadius:8,border:`1.5px solid ${tab===id?'#3b82f6':'rgba(255,255,255,0.06)'}`,background:tab===id?'rgba(59,130,246,0.15)':'rgba(255,255,255,0.03)',color:tab===id?'#60a5fa':'#6b7280',fontWeight:700,fontSize:'0.75rem',cursor:'pointer',transition:'all .15s',fontFamily:'inherit' }}>
          {label}
        </button>
      ))}
    </div>
  )
}

function SolidPal({ sel, onSel, pfx, noDefault }) {
  return (
    <div style={{ display:'flex',flexWrap:'wrap' }}>
      {!noDefault && (
        <div onClick={()=>onSel('')} style={{ ...SW,background:'rgba(255,255,255,0.08)',border:`2px solid ${sel===''?'#3b82f6':'rgba(255,255,255,0.1)'}` }}>
          {sel===''&&<i className="fa-solid fa-check" style={{ fontSize:9,color:'#60a5fa' }} />}
        </div>
      )}
      {SOLID_COLORS.map((c,i)=>(
        <div key={i} onClick={()=>onSel(`${pfx}${i+1}`)}
          style={{ ...SW,background:c,border:`2px solid ${sel===`${pfx}${i+1}`?'#fff':'transparent'}`,transform:sel===`${pfx}${i+1}`?'scale(1.2)':'scale(1)' }}>
          {sel===`${pfx}${i+1}`&&<i className="fa-solid fa-check" style={{ fontSize:9,color:'#fff',textShadow:'0 1px 2px #000' }} />}
        </div>
      ))}
    </div>
  )
}

function GradPal({ sel, onSel, pfx, grads }) {
  return (
    <div style={{ display:'flex',flexWrap:'wrap' }}>
      {grads.map((g,i)=>(
        <div key={i} onClick={()=>onSel(`${pfx}${i+1}`)}
          style={{ ...SW,background:g,border:`2px solid ${sel===`${pfx}${i+1}`?'#fff':'transparent'}`,transform:sel===`${pfx}${i+1}`?'scale(1.2)':'scale(1)' }}>
          {sel===`${pfx}${i+1}`&&<i className="fa-solid fa-check" style={{ fontSize:9,color:'#fff' }} />}
        </div>
      ))}
    </div>
  )
}

function NeonPal({ sel, onSel, pfx, neons, getBg }) {
  return (
    <div style={{ display:'flex',flexWrap:'wrap' }}>
      {neons.map((n,i)=>(
        <div key={i} onClick={()=>onSel(`${pfx}${i+1}`)}
          style={{ ...SW,background:getBg?getBg(n):n.color,boxShadow:`0 0 7px ${n.color||n.glow}`,border:`2px solid ${sel===`${pfx}${i+1}`?'#fff':'rgba(0,0,0,0.2)'}`,transform:sel===`${pfx}${i+1}`?'scale(1.2)':'scale(1)' }}>
          {sel===`${pfx}${i+1}`&&<i className="fa-solid fa-check" style={{ fontSize:9,color:'#fff' }} />}
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MODAL 1 — USERNAME STYLE
// ════════════════════════════════════════════════════════════════
function UsernameStyleModal({ me, onSave, onClose, accent='#03add8' }) {
  const [tab,setTab]       = useState('solid')
  const [sel,setSel]       = useState(me?.nameColor||'')
  const [font,setFont]     = useState(me?.nameFont||'')
  const [saving,setSaving] = useState(false)

  const previewStyle = getSelStyle(sel,'bcolor','bgrad','bneon')
  const fontFamily   = FONTS.find(f=>f.id===font)?.family||'inherit'

  async function handleSave(){
    setSaving(true)
    await onSave([{field:'nameColor',value:sel||'user'},{field:'nameFont',value:font}])
    setSaving(false); onClose()
  }

  return (
    <>
      <Overlay onClose={onClose} />
      <ModalBox>
        <MHeader title="Username Style" icon="fa-solid fa-signature" onClose={onClose} accent={accent} />
        <div style={{ flex:1,overflowY:'auto',padding:16 }}>
          {/* Preview */}
          <div style={{ background:'rgba(0,0,0,0.4)',borderRadius:12,padding:'14px 16px',marginBottom:16,border:'1px solid rgba(255,255,255,0.06)',textAlign:'center' }}>
            <div style={{ fontSize:'0.66rem',color:'#6b7280',marginBottom:8,textTransform:'uppercase',letterSpacing:1,fontWeight:700 }}>Preview</div>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
              <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
                style={{ width:32,height:32,borderRadius:'50%',objectFit:'cover',border:`2px solid ${accent}` }}
                onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
              <span style={{ fontSize:'1.1rem',fontWeight:800,fontFamily,...previewStyle }}>
                {me?.username||'YourName'}
              </span>
            </div>
          </div>
          {/* Color picker */}
          <div style={{ fontSize:'0.7rem',color:'#6b7280',marginBottom:8,fontWeight:700,textTransform:'uppercase',letterSpacing:1 }}>Name Color</div>
          <CTabs tab={tab} setTab={setTab} />
          <div style={{ maxHeight:200,overflowY:'auto',marginBottom:16,padding:'2px 0' }}>
            {tab==='solid'    && <SolidPal sel={sel} onSel={setSel} pfx="bcolor" />}
            {tab==='gradient' && <GradPal  sel={sel} onSel={setSel} pfx="bgrad"  grads={NAME_GRADIENTS} />}
            {tab==='neon'     && <NeonPal  sel={sel} onSel={setSel} pfx="bneon"  neons={NEON_COLORS} getBg={n=>n.color} />}
          </div>
          {/* Font selector */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:14 }}>
            <div style={{ fontSize:'0.7rem',color:'#6b7280',marginBottom:8,fontWeight:700,textTransform:'uppercase',letterSpacing:1 }}>Username Font</div>
            <select value={font} onChange={e=>setFont(e.target.value)}
              style={{ width:'100%',background:'#0d1020',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 12px',color:'#f1f5f9',fontSize:'0.85rem',cursor:'pointer',fontFamily,appearance:'auto' }}>
              {FONTS.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            {font && (
              <div style={{ marginTop:10,padding:'10px',background:'rgba(0,0,0,0.3)',borderRadius:8,textAlign:'center',fontFamily,color:'#f1f5f9',fontSize:'1rem' }}>
                {me?.username||'YourName'} · {FONTS.find(f2=>f2.id===font)?.name}
              </div>
            )}
          </div>
        </div>
        <MFooter onClose={onClose} onSave={handleSave} saving={saving} accent={accent} />
      </ModalBox>
    </>
  )
}

// ════════════════════════════════════════════════════════════════
// MODAL 2 — TEXT STYLE
// ════════════════════════════════════════════════════════════════
function TextStyleModal({ me, onSave, onClose, accent='#03add8' }) {
  const [tab,setTab]       = useState('solid')
  const [colorSel,setColor]= useState(me?.msgFontColor||'')
  const [font,setFont]     = useState(me?.msgFontStyle||'')
  const [fontSize,setSize] = useState(me?.msgFontSize||16)
  const [saving,setSaving] = useState(false)

  const fontFamily  = FONTS.find(f=>f.id===font)?.family||'inherit'
  const colorStyle  = getSelStyle(colorSel,'bcolor','bgrad','bneon')
  const previewTextStyle = colorSel ? colorStyle : { color:'#f1f5f9' }

  async function handleSave(){
    setSaving(true)
    await onSave([{field:'msgFontStyle',value:font},{field:'msgFontSize',value:fontSize},{field:'msgFontColor',value:colorSel}])
    setSaving(false); onClose()
  }

  return (
    <>
      <Overlay onClose={onClose} />
      <ModalBox>
        <MHeader title="Text Style" icon="fa-solid fa-font" onClose={onClose} accent={accent} />
        <div style={{ flex:1,overflowY:'auto',padding:16 }}>
          {/* Preview */}
          <div style={{ background:'rgba(0,0,0,0.4)',borderRadius:12,padding:'14px 16px',marginBottom:16,border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:'0.66rem',color:'#6b7280',marginBottom:8,textTransform:'uppercase',letterSpacing:1,fontWeight:700 }}>Preview</div>
            <div style={{ display:'flex',alignItems:'flex-end',gap:8 }}>
              <div style={{ width:28,height:28,borderRadius:'50%',background:'#2a2d3e',flexShrink:0 }} />
              <div style={{ padding:'8px 12px',borderRadius:'3px 12px 12px 12px',background:'rgba(255,255,255,0.08)',maxWidth:'80%' }}>
                <span style={{ fontFamily,fontSize:`${fontSize}px`,lineHeight:1.5,...previewTextStyle }}>
                  This is how your chat text looks! ✨
                </span>
              </div>
            </div>
          </div>
          {/* Text Color */}
          <div style={{ fontSize:'0.7rem',color:'#6b7280',marginBottom:8,fontWeight:700,textTransform:'uppercase',letterSpacing:1 }}>Text Color</div>
          <CTabs tab={tab} setTab={setTab} />
          <div style={{ maxHeight:180,overflowY:'auto',marginBottom:14 }}>
            {tab==='solid'    && <SolidPal sel={colorSel} onSel={setColor} pfx="bcolor" />}
            {tab==='gradient' && <GradPal  sel={colorSel} onSel={setColor} pfx="bgrad"  grads={NAME_GRADIENTS} />}
            {tab==='neon'     && <NeonPal  sel={colorSel} onSel={setColor} pfx="bneon"  neons={NEON_COLORS} getBg={n=>n.color} />}
          </div>
          {/* Font size */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:14,marginBottom:14 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
              <div style={{ fontSize:'0.7rem',color:'#6b7280',fontWeight:700,textTransform:'uppercase',letterSpacing:1 }}>Font Size</div>
              <span style={{ fontSize:'0.9rem',fontWeight:800,color:accent }}>{fontSize}px</span>
            </div>
            <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
              {[14,15,16,17,18,19,20,22,24,26,28,30].map(s=>(
                <button key={s} onClick={()=>setSize(s)}
                  style={{ padding:'5px 10px',borderRadius:7,border:`1.5px solid ${fontSize===s?accent:'rgba(255,255,255,0.08)'}`,background:fontSize===s?`${accent}22`:'rgba(255,255,255,0.03)',color:fontSize===s?accent:'#9ca3af',fontWeight:700,fontSize:'0.78rem',cursor:'pointer',fontFamily:'inherit' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {/* Font */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:14 }}>
            <div style={{ fontSize:'0.7rem',color:'#6b7280',marginBottom:8,fontWeight:700,textTransform:'uppercase',letterSpacing:1 }}>Message Font</div>
            <select value={font} onChange={e=>setFont(e.target.value)}
              style={{ width:'100%',background:'#0d1020',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 12px',color:'#f1f5f9',fontSize:'0.85rem',cursor:'pointer',appearance:'auto' }}>
              {FONTS.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <MFooter onClose={onClose} onSave={handleSave} saving={saving} accent={accent} />
      </ModalBox>
    </>
  )
}

// ════════════════════════════════════════════════════════════════
// MODAL 3 — MESSAGE BUBBLE
// ════════════════════════════════════════════════════════════════
function BubbleModal({ me, onSave, onClose, accent='#03add8' }) {
  const [tab,setTab]       = useState('solid')
  const [sel,setSel]       = useState(me?.bubbleColor||'')
  const [saving,setSaving] = useState(false)

  // Use user's actual text style for preview
  const fontFamily = FONTS.find(f=>f.id===(me?.msgFontStyle||''))?.family||'inherit'
  const fontSize   = me?.msgFontSize||16

  // Bubble preview style
  const bubbleStyle = (()=>{
    if(!sel) return { background:'rgba(255,255,255,0.1)' }
    if(sel.startsWith('bubcolor')){
      const idx=parseInt(sel.replace('bubcolor',''))-1
      if(SOLID_COLORS[idx]) return { background:SOLID_COLORS[idx] }
    }
    if(sel.startsWith('bubgrad')){
      const idx=parseInt(sel.replace('bubgrad',''))-1
      if(BUBBLE_GRADIENTS[idx]) return { background:BUBBLE_GRADIENTS[idx] }
    }
    if(sel.startsWith('bubneon')){
      const idx=parseInt(sel.replace('bubneon',''))-1
      if(BUBBLE_NEONS[idx]) return { background:BUBBLE_NEONS[idx].gradient, boxShadow:`0 0 12px ${BUBBLE_NEONS[idx].glow}` }
    }
    return {}
  })()

  // User's text color for preview (actual saved color, not "neon on bubble" thing)
  const userTextColor = (()=>{
    const c = me?.msgFontColor||''
    if(!c) return '#fff'
    if(c.startsWith('#')) return c
    if(c.startsWith('bcolor')){
      const idx=parseInt(c.replace('bcolor',''))-1
      return SOLID_COLORS[idx]||'#fff'
    }
    return '#fff'
  })()

  async function handleSave(){
    setSaving(true)
    await onSave([{field:'bubbleColor',value:sel}])
    setSaving(false); onClose()
  }

  return (
    <>
      <Overlay onClose={onClose} />
      <ModalBox>
        <MHeader title="Message Bubble" icon="fa-solid fa-comment" onClose={onClose} accent={accent} />
        <div style={{ flex:1,overflowY:'auto',padding:16 }}>
          {/* Preview — shows user's ACTUAL font */}
          <div style={{ background:'rgba(0,0,0,0.4)',borderRadius:12,padding:'14px 16px',marginBottom:16,border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:'0.66rem',color:'#6b7280',marginBottom:10,textTransform:'uppercase',letterSpacing:1,fontWeight:700 }}>Preview</div>
            <div style={{ display:'flex',alignItems:'flex-end',gap:8,marginBottom:8 }}>
              <div style={{ width:26,height:26,borderRadius:'50%',background:'#2a2d3e',flexShrink:0 }} />
              <div style={{ padding:'8px 12px',borderRadius:'3px 12px 12px 12px',background:'rgba(255,255,255,0.08)',maxWidth:'70%' }}>
                <span style={{ fontFamily,fontSize:`${fontSize}px`,color:'#ccc' }}>Hey there! 👋</span>
              </div>
            </div>
            <div style={{ display:'flex',alignItems:'flex-end',gap:8,justifyContent:'flex-end' }}>
              <div style={{ padding:'8px 12px',borderRadius:'12px 3px 12px 12px',maxWidth:'70%',...bubbleStyle }}>
                <span style={{ fontFamily,fontSize:`${fontSize}px`,color:sel?userTextColor:'#ccc' }}>Your message bubble! ✨</span>
              </div>
              <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
                style={{ width:26,height:26,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`2px solid ${accent}` }}
                onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
            </div>
          </div>
          {/* Tabs */}
          <CTabs tab={tab} setTab={setTab} />
          <div style={{ maxHeight:220,overflowY:'auto' }}>
            {tab==='solid'    && <SolidPal sel={sel} onSel={setSel} pfx="bubcolor" noDefault />}
            {tab==='gradient' && <GradPal  sel={sel} onSel={setSel} pfx="bubgrad"  grads={BUBBLE_GRADIENTS} />}
            {tab==='neon'     && (
              <div style={{ display:'flex',flexWrap:'wrap' }}>
                {BUBBLE_NEONS.map((n,i)=>(
                  <div key={i} onClick={()=>setSel(`bubneon${i+1}`)}
                    style={{ ...SW,background:n.gradient,boxShadow:`0 0 6px ${n.glow}`,border:`2px solid ${sel===`bubneon${i+1}`?'#fff':'transparent'}`,transform:sel===`bubneon${i+1}`?'scale(1.2)':'scale(1)' }}>
                    {sel===`bubneon${i+1}`&&<i className="fa-solid fa-check" style={{ fontSize:9,color:'#fff' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
          {sel && (
            <button onClick={()=>setSel('')}
              style={{ marginTop:12,padding:'7px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#9ca3af',fontSize:'0.78rem',cursor:'pointer',fontFamily:'inherit',fontWeight:600 }}>
              ✕ Clear Bubble Color
            </button>
          )}
        </div>
        <MFooter onClose={onClose} onSave={handleSave} saving={saving} accent={accent} />
      </ModalBox>
    </>
  )
}

// ════════════════════════════════════════════════════════════════
// MODAL 4 — SOUNDS
// ════════════════════════════════════════════════════════════════
function SoundsModal({ onClose, accent='#03add8' }) {
  const [prefs,setPrefs] = useState(getSoundPrefs)

  function toggle(key){
    const cur = prefs[key]!==false
    setSoundPref(key,!cur)
    setPrefs(p=>({...p,[key]:!cur}))
  }

  function testSound(file){
    try{ const a=new Audio(file);a.volume=0.5;a.play().catch(()=>{}) }catch{}
  }

  return (
    <>
      <Overlay onClose={onClose} />
      <ModalBox>
        <MHeader title="Sounds" icon="fa-solid fa-volume-high" onClose={onClose} accent={accent} />
        <div style={{ flex:1,overflowY:'auto',padding:'4px 16px' }}>
          {SOUND_KEYS.map((sk,i)=>{
            const isOn = prefs[sk.key]!==false
            return (
              <div key={sk.key}
                style={{ display:'flex',alignItems:'center',gap:12,padding:'13px 0',borderBottom:i<SOUND_KEYS.length-1?'1px solid rgba(255,255,255,0.05)':'none' }}>
                <span style={{ width:34,height:34,borderRadius:10,background:`${accent}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <i className={sk.icon} style={{ fontSize:14,color:isOn?accent:'#555' }} />
                </span>
                <span style={{ flex:1,fontSize:'0.85rem',color:isOn?'#f1f5f9':'#6b7280',fontWeight:600,transition:'color .15s' }}>{sk.label}</span>
                {/* Test */}
                <button onClick={()=>isOn&&testSound(sk.file)} disabled={!isOn} title="Test"
                  style={{ width:28,height:28,borderRadius:7,border:'none',cursor:isOn?'pointer':'not-allowed',background:'rgba(255,255,255,0.06)',color:isOn?accent:'#444',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0 }}>
                  <i className="fa-solid fa-play" />
                </button>
                {/* Toggle */}
                <button onClick={()=>toggle(sk.key)}
                  style={{ width:44,height:24,borderRadius:12,border:'none',cursor:'pointer',background:isOn?accent:'rgba(255,255,255,0.1)',position:'relative',transition:'background .2s',flexShrink:0 }}>
                  <span style={{ position:'absolute',top:3,left:isOn?'calc(100% - 21px)':'3px',width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,0.4)' }} />
                </button>
              </div>
            )
          })}
        </div>
        <div style={{ padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.06)',background:'#0e1018' }}>
          <p style={{ fontSize:'0.7rem',color:'#6b7280',textAlign:'center',margin:0 }}>Changes save automatically.</p>
        </div>
      </ModalBox>
    </>
  )
}

// ════════════════════════════════════════════════════════════════
// MODAL 5 — THEMES
// ════════════════════════════════════════════════════════════════
function ThemesModal({ me, onSave, onClose, accent='#03add8' }) {
  const [selTheme,setSel]       = useState(me?.chatTheme||'Dark')
  const [themeLimit,setLimit]   = useState(-1)
  const [saving,setSaving]      = useState(false)

  useEffect(()=>{
    fetch(`${API}/api/admin/themes-by-rank`)
      .then(r=>r.json())
      .then(d=>{ const rank=me?.rank||'user';const limit=d?.themesByRank?.[rank];setLimit(limit===undefined?0:limit) })
      .catch(()=>setLimit(99))
  },[me?.rank])

  const canUse = idx => {
    if(themeLimit===-1) return true
    if(themeLimit===0)  return false
    const free=THEMES.slice(0,themeLimit).map(t=>t.id)
    return free.includes(THEMES[idx]?.id)||THEMES[idx]?.id===me?.chatTheme
  }

  const tObj = THEMES.find(t=>t.id===selTheme)||THEMES[0]

  async function handleSave(){
    setSaving(true)
    await onSave([{field:'chatTheme',value:selTheme}])
    setSaving(false); onClose()
  }

  return (
    <>
      <Overlay onClose={onClose} />
      <ModalBox>
        <MHeader title="Chat Themes" icon="fa-solid fa-palette" onClose={onClose} accent={accent} />
        <div style={{ flex:1,overflowY:'auto',padding:16 }}>
          {/* Selected theme big preview */}
          <div style={{ borderRadius:14,overflow:'hidden',marginBottom:16,border:`2px solid ${accent}55` }}>
            <div style={{ background:tObj.bg_header,padding:'11px 14px',display:'flex',alignItems:'center',gap:8 }}>
              <div style={{ width:9,height:9,borderRadius:'50%',background:'#ff5f5f' }} />
              <div style={{ width:9,height:9,borderRadius:'50%',background:'#ffbe2e' }} />
              <div style={{ width:9,height:9,borderRadius:'50%',background:'#2aca44' }} />
              <span style={{ color:tObj.text,fontWeight:700,fontSize:'0.82rem',marginLeft:6 }}>#{tObj.name}</span>
            </div>
            <div style={{ background:tObj.bg_chat!=='transparent'?tObj.bg_chat:'#111',padding:'14px',minHeight:80 }}>
              <div style={{ display:'flex',gap:8,alignItems:'flex-end',marginBottom:8 }}>
                <div style={{ width:28,height:28,borderRadius:'50%',background:tObj.accent,flexShrink:0 }} />
                <div style={{ background:tObj.bg_log,padding:'7px 11px',borderRadius:'3px 11px 11px 11px' }}>
                  <span style={{ color:tObj.text,fontSize:'0.8rem' }}>Hello! Welcome 🎉</span>
                </div>
              </div>
              <div style={{ display:'flex',gap:8,alignItems:'flex-end',justifyContent:'flex-end' }}>
                <div style={{ background:tObj.accent,padding:'7px 11px',borderRadius:'11px 3px 11px 11px' }}>
                  <span style={{ color:'#fff',fontSize:'0.8rem' }}>Looks amazing! 🔥</span>
                </div>
                <div style={{ width:28,height:28,borderRadius:'50%',background:tObj.default_color,flexShrink:0 }} />
              </div>
            </div>
          </div>
          {/* 3-col grid of all 24 themes */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8 }}>
            {THEMES.map((t,idx)=>{
              const allowed=canUse(idx)
              const isSel=selTheme===t.id
              return (
                <div key={t.id} onClick={()=>allowed&&setSel(t.id)}
                  style={{ borderRadius:10,overflow:'hidden',cursor:allowed?'pointer':'not-allowed',border:`2px solid ${isSel?accent:'rgba(255,255,255,0.06)'}`,opacity:allowed?1:0.45,transition:'border-color .15s,transform .1s',transform:isSel?'scale(1.03)':'scale(1)',position:'relative' }}>
                  <div style={{ height:44,background:t.bg_header,display:'flex',alignItems:'center',justifyContent:'center',gap:4 }}>
                    <div style={{ width:18,height:18,borderRadius:'50%',background:t.bg_log,border:`2px solid ${t.accent}` }} />
                    {t.bg_image && <div style={{ width:8,height:8,borderRadius:2,background:t.accent,opacity:0.7 }} />}
                  </div>
                  <div style={{ background:'#0a0c14',padding:'5px 6px',textAlign:'center',borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize:'0.63rem',fontWeight:700,color:isSel?accent:'#888',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.name}</span>
                  </div>
                  {isSel && (
                    <div style={{ position:'absolute',top:4,right:4,width:16,height:16,borderRadius:'50%',background:accent,display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <i className="fa-solid fa-check" style={{ fontSize:8,color:'#fff' }} />
                    </div>
                  )}
                  {!allowed && (
                    <div style={{ position:'absolute',top:3,left:3,background:'#f59e0b',borderRadius:4,padding:'1px 5px',fontSize:'0.55rem',fontWeight:800,color:'#000' }}>VIP</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <MFooter onClose={onClose} onSave={handleSave} saving={saving} accent={accent} />
      </ModalBox>
    </>
  )
}

// ════════════════════════════════════════════════════════════════
// CHAT OPTIONS SUBMENU
// ════════════════════════════════════════════════════════════════
function ChatOptionsSubmenu({ me, tObj, onClose, onSaved }) {
  const [modal,setModal] = useState(null)
  const acc = tObj?.accent||'#03add8'
  const bg  = tObj?.bg_chat||'#151515'
  const hdr = tObj?.bg_header||'#111'
  const txt = tObj?.text||'#fff'
  const brd = tObj?.default_color||'#333'
  const token = localStorage.getItem('cgz_token')

  async function saveStyle(fields){
    const body={}; fields.forEach(({field,value})=>{body[field]=value})
    try{
      const r=await fetch(`${API}/api/users/me/style`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)})
      const d=await r.json(); if(r.ok) onSaved?.(d.user)
    }catch(e){console.error(e)}
  }

  const ITEMS=[
    {id:'usernameStyle',label:'Username Style',icon:'fa-solid fa-signature',  desc:'Name color & font'},
    {id:'textStyle',    label:'Text Style',    icon:'fa-solid fa-font',        desc:'Text color & font size'},
    {id:'bubble',       label:'Message Bubble',icon:'fa-solid fa-comment',     desc:'Bubble color & style'},
    {id:'sounds',       label:'Sounds',        icon:'fa-solid fa-volume-high', desc:'Notification sounds'},
    {id:'theme',        label:'Theme',         icon:'fa-solid fa-palette',     desc:'Chat room theme'},
  ]

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9997,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,backdropFilter:'blur(2px)' }}>
        <div onClick={e=>e.stopPropagation()}
          style={{ background:hdr,border:`1px solid ${brd}44`,borderRadius:16,width:'min(400px,94vw)',maxHeight:'82vh',display:'flex',flexDirection:'column',boxShadow:'0 12px 48px rgba(0,0,0,0.7)',overflow:'hidden' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderBottom:`1px solid ${brd}22`,flexShrink:0 }}>
            <span style={{ fontWeight:800,fontSize:'0.93rem',color:txt,flex:1 }}>Chat Options</span>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,color:'#888',cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div style={{ overflowY:'auto',flex:1 }}>
            {ITEMS.map((item,i)=>(
              <button key={item.id} onClick={()=>setModal(item.id)}
                style={{ display:'flex',alignItems:'center',gap:12,width:'100%',padding:'12px 16px',background:'none',border:'none',cursor:'pointer',textAlign:'left',borderTop:i>0?`1px solid ${brd}18`:'none',transition:'background .1s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <span style={{ width:34,height:34,borderRadius:10,background:`${acc}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <i className={item.icon} style={{ fontSize:14,color:acc }} />
                </span>
                <div style={{ flex:1 }}>
                  <div style={{ color:txt,fontWeight:700,fontSize:'0.85rem' }}>{item.label}</div>
                  <div style={{ color:'#666',fontSize:'0.7rem',marginTop:2 }}>{item.desc}</div>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ fontSize:11,color:'#555' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
      {modal==='usernameStyle' && <UsernameStyleModal me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
      {modal==='textStyle'     && <TextStyleModal     me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
      {modal==='bubble'        && <BubbleModal        me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
      {modal==='sounds'        && <SoundsModal        accent={acc}          onClose={()=>setModal(null)} />}
      {modal==='theme'         && <ThemesModal        me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
    </>
  )
}

// ════════════════════════════════════════════════════════════════
// WALLET MODAL
// ════════════════════════════════════════════════════════════════
function WalletModal({ me, tObj, onClose }) {
  const [tab,setTab]=useState('gold')
  const acc=tObj?.accent||'#03add8', bg=tObj?.bg_chat||'#151515', hdr=tObj?.bg_header||'#111', txt=tObj?.text||'#fff', brd=tObj?.default_color||'#333'
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:hdr,border:`1px solid ${brd}44`,borderRadius:16,width:'min(360px,92vw)',boxShadow:'0 12px 48px rgba(0,0,0,0.7)',overflow:'hidden' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 16px',borderBottom:`1px solid ${brd}33` }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}><i className="fa-solid fa-wallet" style={{ color:acc,fontSize:16 }} /><span style={{ fontWeight:700,fontSize:'0.95rem',color:txt }}>Wallet</span></div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,color:'#888',cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div style={{ display:'flex',borderBottom:`1px solid ${brd}33`,background:bg }}>
          {[{id:'gold',label:'Gold',icon:'fa-solid fa-coins',color:'#f59e0b'},{id:'ruby',label:'Rubies',icon:'fa-solid fa-gem',color:'#ef4444'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,padding:'11px 0',border:'none',cursor:'pointer',background:'none',color:tab===t.id?t.color:'#666',fontWeight:700,fontSize:'0.8rem',borderBottom:tab===t.id?`2px solid ${t.color}`:'2px solid transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
              <i className={t.icon} style={{ fontSize:20 }} />{t.label}
            </button>
          ))}
        </div>
        <div style={{ padding:'24px 20px',textAlign:'center',background:bg }}>
          {tab==='gold'?(<><div style={{ fontSize:52,marginBottom:8 }}>🪙</div><div style={{ fontSize:'2.2rem',fontWeight:900,color:'#f59e0b' }}>{(me?.gold||0).toLocaleString()}</div><div style={{ fontSize:'0.8rem',color:'#888',marginTop:4 }}>Gold Coins</div></>):(<><div style={{ fontSize:52,marginBottom:8 }}>💎</div><div style={{ fontSize:'2.2rem',fontWeight:900,color:'#ef4444' }}>{(me?.ruby||0).toLocaleString()}</div><div style={{ fontSize:'0.8rem',color:'#888',marginTop:4 }}>Rubies</div></>)}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// LEVEL PANEL
// ════════════════════════════════════════════════════════════════
function LevelPanel({ me, tObj, onClose }) {
  const acc=tObj?.accent||'#03add8', bg=tObj?.bg_chat||'#151515', hdr=tObj?.bg_header||'#111', txt=tObj?.text||'#fff', brd=tObj?.default_color||'#333'
  const xp=me?.xp||0, level=me?.level||1, xpNext=xpForLevel(level), xpPrev=xpForLevel(level-1)||0
  const pct=Math.min(100,Math.round(((xp-xpPrev)/(xpNext-xpPrev))*100))||0
  const ri=R(me?.rank)
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:hdr,border:`1px solid ${brd}44`,borderRadius:16,width:'min(360px,92vw)',boxShadow:'0 12px 48px rgba(0,0,0,0.7)',overflow:'hidden' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 16px',borderBottom:`1px solid ${brd}33` }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}><i className="fa-solid fa-chart-line" style={{ color:acc,fontSize:16 }} /><span style={{ fontWeight:700,fontSize:'0.95rem',color:txt }}>Level & XP</span></div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,color:'#888',cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div style={{ padding:'20px 18px',background:bg }}>
          <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:20 }}>
            <div style={{ width:60,height:60,borderRadius:'50%',background:`radial-gradient(circle at 35% 35%,${acc}44,${acc}11)`,border:`2px solid ${acc}66`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <span style={{ fontSize:'1.6rem',fontWeight:900,color:acc }}>Lv</span>
            </div>
            <div><div style={{ fontSize:'2.4rem',fontWeight:900,color:txt,lineHeight:1 }}>{level}</div><div style={{ fontSize:'0.75rem',color:'#888',marginTop:2 }}>{ri.label}</div></div>
            <div style={{ marginLeft:'auto',textAlign:'right' }}><div style={{ fontSize:'0.72rem',color:'#888' }}>Total XP</div><div style={{ fontSize:'1.1rem',fontWeight:700,color:acc }}>{xp.toLocaleString()}</div></div>
          </div>
          <div style={{ marginBottom:4,display:'flex',justifyContent:'space-between' }}>
            <span style={{ fontSize:'0.72rem',color:'#888' }}>Level {level+1}</span>
            <span style={{ fontSize:'0.72rem',fontWeight:700,color:acc }}>{pct}%</span>
          </div>
          <div style={{ height:8,borderRadius:99,background:'rgba(255,255,255,0.08)',overflow:'hidden' }}>
            <div style={{ height:'100%',width:`${pct}%`,borderRadius:99,background:`linear-gradient(90deg,${acc}99,${acc})`,transition:'width .5s ease' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MENU ROW
// ════════════════════════════════════════════════════════════════
function MenuRow({ icon, iconColor, label, chevron, onClick, danger, acc, txt, brd }) {
  const [hov,setHov]=useState(false)
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'flex',alignItems:'center',gap:11,width:'100%',padding:'9px 14px',background:hov?'rgba(255,255,255,0.05)':'none',border:'none',cursor:'pointer',textAlign:'left',color:danger?'#ef4444':(txt||'#ddd'),fontSize:'0.82rem',fontWeight:600,transition:'background .1s' }}>
      <span style={{ width:28,height:28,borderRadius:7,flexShrink:0,background:danger?'rgba(239,68,68,0.12)':`${iconColor||acc||'#03add8'}18`,display:'flex',alignItems:'center',justifyContent:'center' }}>
        <i className={icon} style={{ fontSize:13,color:danger?'#ef4444':(iconColor||acc||'#03add8') }} />
      </span>
      <span style={{ flex:1 }}>{label}</span>
      {chevron&&<i className="fa-solid fa-chevron-right" style={{ fontSize:10,color:'#555' }} />}
    </button>
  )
}

// ════════════════════════════════════════════════════════════════
// AVATAR DROPDOWN
// ════════════════════════════════════════════════════════════════
function AvatarDropdown({ me, status, setStatus, onLeave, socket, onOpenSettings, onOpenProfile, tObj, room }) {
  const [open,setOpen]                   = useState(false)
  const [showWallet,setShowWallet]       = useState(false)
  const [showLevel,setShowLevel]         = useState(false)
  const [showChatOpts,setShowChatOpts]   = useState(false)
  const [showStatusMenu,setShowStatusMenu]= useState(false)
  const ref = useRef(null)
  const nav = useNavigate()

  const acc=tObj?.accent||'#03add8', hdr=tObj?.bg_header||'#111111', bg=tObj?.bg_chat||'#151515', txt=tObj?.text||'#ffffff', brd=tObj?.default_color||'#333333'
  const ri=R(me?.rank), myLevel=RL(me?.rank)
  const isAdmin=myLevel>=12
  const isRoomOwnerOrMod=myLevel>=11||(room?.owner&&String(room.owner)===String(me?._id))

  useEffect(()=>{
    function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false)}
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h)
  },[])

  function logout(){localStorage.removeItem('cgz_token');nav('/login')}
  const Divider=()=><div style={{ height:1,background:`${brd}33`,margin:'4px 0' }} />

  return (
    <>
      <div ref={ref} style={{ position:'relative',flexShrink:0 }}>
        <button onClick={e=>{e.stopPropagation();setOpen(p=>!p)}}
          style={{ background:'none',border:'none',cursor:'pointer',padding:3,borderRadius:8,display:'flex',alignItems:'center',gap:5,position:'relative' }}>
          <div style={{ position:'relative' }}>
            <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
              style={{ width:30,height:30,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${GBR(me?.gender,me?.rank)}`,display:'block' }}
              onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
            <span style={{ position:'absolute',bottom:0,right:0,width:9,height:9,borderRadius:'50%',background:STATUS_COLOR[status]||'#22c55e',border:`1.5px solid ${hdr}` }} />
          </div>
        </button>

        {open&&(
          <div onClick={e=>e.stopPropagation()}
            style={{ position:'absolute',top:'calc(100% + 6px)',right:0,background:hdr,border:`1px solid ${brd}44`,borderRadius:14,minWidth:238,boxShadow:'0 10px 40px rgba(0,0,0,0.65)',zIndex:500,overflow:'hidden' }}>
            <div style={{ padding:'12px 14px 10px',borderBottom:`1px solid ${brd}33`,display:'flex',alignItems:'center',gap:10 }}>
              <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
                style={{ width:42,height:42,borderRadius:'50%',objectFit:'cover',border:`2px solid ${GBR(me?.gender,me?.rank)}`,flexShrink:0 }}
                onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:5,marginBottom:2 }}>
                  <span style={{ fontSize:'0.88rem',fontWeight:800,color:txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:108 }}>{me?.username}</span>
                  <img src={`/icons/ranks/${ri.icon}`} alt={ri.label} title={ri.label}
                    style={{ width:15,height:15,objectFit:'contain',flexShrink:0 }}
                    onError={e=>e.target.style.display='none'} />
                </div>
                <div style={{ fontSize:'0.67rem',color:ri.color||'#888',fontWeight:700 }}>{ri.label}</div>
              </div>
              <div style={{ position:'relative',flexShrink:0 }}>
                <button onClick={()=>setShowStatusMenu(p=>!p)}
                  style={{ background:'rgba(255,255,255,0.06)',border:`1px solid ${brd}33`,borderRadius:8,cursor:'pointer',width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <img src={`/default_images/status/${status||'online'}.svg`} alt={status}
                    style={{ width:16,height:16,objectFit:'contain' }}
                    onError={e=>{e.target.style.display='none'}} />
                </button>
                {showStatusMenu&&(
                  <div style={{ position:'absolute',top:'calc(100% + 4px)',right:0,background:bg,border:`1px solid ${brd}44`,borderRadius:10,padding:4,minWidth:134,boxShadow:'0 6px 20px rgba(0,0,0,0.5)',zIndex:10 }}>
                    {STATUS_OPTS.map(s=>(
                      <button key={s.id} onClick={()=>{setStatus(s.id);socket?.emit('setStatus',{status:s.id});setShowStatusMenu(false)}}
                        style={{ display:'flex',alignItems:'center',gap:7,width:'100%',padding:'7px 10px',borderRadius:7,border:'none',cursor:'pointer',background:status===s.id?`${acc}22`:'none',color:status===s.id?txt:'#888',fontSize:'0.77rem',fontWeight:status===s.id?700:500 }}>
                        <span style={{ width:8,height:8,borderRadius:'50%',background:s.color,flexShrink:0 }} />
                        {s.label}
                        {status===s.id&&<i className="fa-solid fa-check" style={{ fontSize:9,color:acc,marginLeft:'auto' }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <MenuRow icon="fa-regular fa-pen-to-square" label="Edit Profile" onClick={()=>{onOpenProfile?.();setOpen(false)}} acc={acc} txt={txt} brd={brd} />
            <MenuRow icon="fa-solid fa-wallet" iconColor="#f59e0b"
              label={<span style={{ display:'flex',alignItems:'center',gap:4,flex:1 }}>Wallet<span style={{ marginLeft:'auto',display:'flex',gap:6,fontSize:'0.7rem' }}><span style={{ color:'#f59e0b',fontWeight:700 }}>🪙 {(me?.gold||0).toLocaleString()}</span><span style={{ color:'#ef4444',fontWeight:700 }}>💎 {(me?.ruby||0).toLocaleString()}</span></span></span>}
              onClick={()=>{setShowWallet(true);setOpen(false)}} acc={acc} txt={txt} brd={brd} />
            <MenuRow icon="fa-solid fa-chart-line" iconColor="#818cf8"
              label={<span style={{ display:'flex',alignItems:'center',gap:4,flex:1 }}>Level<span style={{ marginLeft:'auto',fontSize:'0.72rem',color:'#818cf8',fontWeight:800 }}>Lv {me?.level||1}</span></span>}
              onClick={()=>{setShowLevel(true);setOpen(false)}} acc={acc} txt={txt} brd={brd} />
            <MenuRow icon="fa-solid fa-sliders" label="Chat Options" chevron onClick={()=>{setShowChatOpts(true);setOpen(false)}} acc={acc} txt={txt} brd={brd} />
            <div style={{ height:8 }} />
            {isAdmin&&<MenuRow icon="fa-solid fa-gauge" iconColor="#FF4444" label="Admin Panel" onClick={()=>{window.open('/admin','_blank','noopener,noreferrer');setOpen(false)}} acc={acc} txt={txt} brd={brd} />}
            {isRoomOwnerOrMod&&<MenuRow icon="fa-solid fa-gear" iconColor="#f59e0b" label="Room Settings" chevron onClick={()=>setOpen(false)} acc={acc} txt={txt} brd={brd} />}
            <Divider />
            <MenuRow icon="fa-solid fa-arrow-right-from-bracket" label="Leave Room" danger onClick={()=>{onLeave?.();setOpen(false)}} acc={acc} txt={txt} brd={brd} />
            <MenuRow icon="fa-solid fa-power-off" label="Logout" danger onClick={()=>{setOpen(false);logout()}} acc={acc} txt={txt} brd={brd} />
          </div>
        )}
      </div>
      {showWallet   && <WalletModal        me={me} tObj={tObj} onClose={()=>setShowWallet(false)} />}
      {showLevel    && <LevelPanel         me={me} tObj={tObj} onClose={()=>setShowLevel(false)} />}
      {showChatOpts && <ChatOptionsSubmenu me={me} tObj={tObj} onClose={()=>setShowChatOpts(false)} onSaved={()=>{}} />}
    </>
  )
}

// ════════════════════════════════════════════════════════════════
// CHAT SETTINGS OVERLAY (left sidebar compat)
// ════════════════════════════════════════════════════════════════
function ChatSettingsOverlay({ me, onClose, onSaved }) {
  const [modal,setModal] = useState(null)
  const acc = '#03add8'
  const token = localStorage.getItem('cgz_token')
  async function saveStyle(fields){
    const body={}; fields.forEach(({field,value})=>{body[field]=value})
    try{
      const r=await fetch(`${API}/api/users/me/style`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)})
      const d=await r.json(); if(r.ok) onSaved?.(d.user)
    }catch{}
  }
  const TABS=[
    {id:'usernameStyle',label:'Name',  icon:'fa-solid fa-signature'},
    {id:'textStyle',    label:'Text',  icon:'fa-solid fa-font'},
    {id:'bubble',       label:'Bubble',icon:'fa-solid fa-comment'},
    {id:'sounds',       label:'Sounds',icon:'fa-solid fa-volume-high'},
    {id:'theme',        label:'Theme', icon:'fa-solid fa-palette'},
  ]
  return (
    <>
      <div style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:60 }}>
        <div style={{ background:'#191919',border:'1px solid rgba(255,255,255,0.05)',borderRadius:14,width:'min(480px,96vw)',maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 8px 40px rgba(0,0,0,0.7)' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.05)',background:'#111',borderRadius:'14px 14px 0 0',flexShrink:0 }}>
            <span style={{ fontSize:'0.95rem',fontWeight:700,color:'#fff' }}>Chat Settings</span>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,color:'#888',cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15 }}><i className="fa-solid fa-xmark" /></button>
          </div>
          <div style={{ display:'flex',borderBottom:'1px solid rgba(255,255,255,0.05)',flexShrink:0,background:'#111' }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setModal(t.id)}
                style={{ flex:1,padding:'10px 0',border:'none',cursor:'pointer',fontSize:'0.7rem',fontWeight:600,background:'none',color:modal===t.id?'#03add8':'rgba(255,255,255,0.35)',borderBottom:modal===t.id?'2px solid #03add8':'2px solid transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                <i className={t.icon} style={{ fontSize:16 }} />{t.label}
              </button>
            ))}
          </div>
          <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
            <p style={{ color:'#666',fontSize:'0.85rem',textAlign:'center' }}>Select a category above.</p>
          </div>
        </div>
      </div>
      {modal==='usernameStyle' && <UsernameStyleModal me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
      {modal==='textStyle'     && <TextStyleModal     me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
      {modal==='bubble'        && <BubbleModal        me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
      {modal==='sounds'        && <SoundsModal        accent={acc}          onClose={()=>setModal(null)} />}
      {modal==='theme'         && <ThemesModal        me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
    </>
  )
}

// ════════════════════════════════════════════════════════════════
// FOOTER
// ════════════════════════════════════════════════════════════════
function Footer({ showRadio, setShowRadio, showRight, setRight, notif, tObj }) {
  const thHeader=tObj?.bg_header||'#111111', thBorder=tObj?.default_color||'#222'
  return (
    <div style={{ background:thHeader,borderTop:`1px solid ${thBorder}33`,padding:'3px 10px',display:'flex',alignItems:'center',gap:2,flexShrink:0,position:'relative',minHeight:44 }}>
      <FBtn faIcon="fa-solid fa-radio" active={showRadio} onClick={()=>setShowRadio(s=>!s)} title="Radio" tObj={tObj} />
      <div style={{ flex:1 }} />
      <FBtn faIcon="fa-solid fa-users" active={showRight} onClick={()=>setRight(s=>!s)} title="Online Users" badge={notif?.friends||0} tObj={tObj} />
    </div>
  )
}

export { ChatSettingsOverlay, AvatarDropdown, Footer }
export { UsernameStyleModal, TextStyleModal, BubbleModal, SoundsModal, ThemesModal }
