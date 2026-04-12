// ChatSettings.jsx — ChatsGenZ v5
// Mobile-first compact modals. No backdrop blur. No screen blur.
// No label elements. No borders on inputs. Dropdowns for fonts/sizes.
import { useState, useEffect, useRef } from 'react'
import { useNavigate }                  from 'react-router-dom'
import { API, R, GBR, RANKS, RL }      from './chatConstants.js'
import { THEMES }                       from '../../components/StyleModal.jsx'
import { FBtn }                         from './ChatIcons.jsx'
import { Sounds, getSoundEnabled, toggleSound } from '../../utils/sounds.js'

// ── Color data ────────────────────────────────────────────────
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
  { color:'#ff3333', shadow:'0 0 8px #ff3333,0 0 16px #ff333366' },
  { color:'#ff6633', shadow:'0 0 8px #ff6633,0 0 16px #ff663366' },
  { color:'#ff9933', shadow:'0 0 8px #ff9933,0 0 16px #ff993366' },
  { color:'#ffcc33', shadow:'0 0 8px #ffcc33,0 0 16px #ffcc3366' },
  { color:'#00e639', shadow:'0 0 8px #00e639,0 0 16px #00e63966' },
  { color:'#00e6ac', shadow:'0 0 8px #00e6ac,0 0 16px #00e6ac66' },
  { color:'#00cccc', shadow:'0 0 8px #00cccc,0 0 16px #00cccc66' },
  { color:'#03add8', shadow:'0 0 8px #03add8,0 0 16px #03add866' },
  { color:'#3366ff', shadow:'0 0 8px #3366ff,0 0 16px #3366ff66' },
  { color:'#6633ff', shadow:'0 0 8px #6633ff,0 0 16px #6633ff66' },
  { color:'#9933ff', shadow:'0 0 8px #9933ff,0 0 16px #9933ff66' },
  { color:'#cc33ff', shadow:'0 0 8px #cc33ff,0 0 16px #cc33ff66' },
  { color:'#ff33ff', shadow:'0 0 8px #ff33ff,0 0 16px #ff33ff66' },
  { color:'#ff3399', shadow:'0 0 8px #ff3399,0 0 16px #ff339966' },
  { color:'#f59e0b', shadow:'0 0 8px #f59e0b,0 0 20px #f59e0b66' },
  { color:'#ffffff', shadow:'0 0 8px #ffffff,0 0 16px #ffffff66' },
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
  'linear-gradient(45deg,#43cea2,#185a9d)','linear-gradient(45deg,#da4453,#89216b)',
]
const FONTS = [
  { id:'',      name:'Default' },
  { id:'font1', name:'Kalam' },
  { id:'font2', name:'Signika' },
  { id:'font3', name:'Grandstander' },
  { id:'font4', name:'Comic Neue' },
  { id:'font5', name:'Quicksand' },
  { id:'font6', name:'Orbitron' },
  { id:'font7', name:'Lemonada' },
  { id:'font8', name:'Grenze Gotisch' },
  { id:'font9', name:'Merienda' },
  { id:'font10',name:'Amita' },
  { id:'font11',name:'Averia Libre' },
  { id:'font12',name:'Turret Road' },
  { id:'font13',name:'Sansita' },
  { id:'font14',name:'Comfortaa' },
  { id:'font15',name:'Charm' },
  { id:'font16',name:'Lobster Two' },
  { id:'font17',name:'Pacifico' },
  { id:'font18',name:'Dancing Script' },
  { id:'font19',name:'Righteous' },
  { id:'font20',name:'Fredoka One' },
  { id:'font21',name:'Press Start 2P' },
  { id:'font22',name:'Caveat' },
  { id:'font23',name:'Satisfy' },
  { id:'font24',name:'Indie Flower' },
  { id:'font25',name:'Gloria Hallelujah' },
  { id:'font26',name:'Exo 2' },
  { id:'font27',name:'Rajdhani' },
  { id:'font28',name:'Josefin Sans' },
  { id:'font29',name:'Audiowide' },
  { id:'font30',name:'Nunito' },
]
const FONT_FAMILY_MAP = {
  font1:"'Kalam',cursive",font2:"'Signika',sans-serif",font3:"'Grandstander',cursive",
  font4:"'Comic Neue',cursive",font5:"'Quicksand',sans-serif",font6:"'Orbitron',sans-serif",
  font7:"'Lemonada',cursive",font8:"'Grenze Gotisch',cursive",font9:"'Merienda',cursive",
  font10:"'Amita',cursive",font11:"'Averia Libre',cursive",font12:"'Turret Road',cursive",
  font13:"'Sansita',sans-serif",font14:"'Comfortaa',cursive",font15:"'Charm',cursive",
  font16:"'Lobster Two',cursive",font17:"'Pacifico',cursive",font18:"'Dancing Script',cursive",
  font19:"'Righteous',cursive",font20:"'Fredoka One',cursive",font21:"'Press Start 2P',cursive",
  font22:"'Caveat',cursive",font23:"'Satisfy',cursive",font24:"'Indie Flower',cursive",
  font25:"'Gloria Hallelujah',cursive",font26:"'Exo 2',sans-serif",font27:"'Rajdhani',sans-serif",
  font28:"'Josefin Sans',sans-serif",font29:"'Audiowide',sans-serif",font30:"'Nunito',sans-serif",
}
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
  { key:'notify',     label:'Notification',    file:'/sounds/notify.mp3',        icon:'fa-solid fa-bell' },
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
function getFontFamily(id){ return FONT_FAMILY_MAP[id]||'inherit' }

function getSelStyle(sel) {
  if (!sel) return {}
  if (sel.startsWith('bcolor')) {
    const idx = parseInt(sel.replace('bcolor','')) - 1
    if (SOLID_COLORS[idx]) return { color: SOLID_COLORS[idx] }
  }
  if (sel.startsWith('bgrad')) {
    const idx = parseInt(sel.replace('bgrad','')) - 1
    if (NAME_GRADIENTS[idx]) return { background: NAME_GRADIENTS[idx], WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }
  }
  if (sel.startsWith('bneon')) {
    const idx = parseInt(sel.replace('bneon','')) - 1
    if (NEON_COLORS[idx]) return { color:'#fff', textShadow: NEON_COLORS[idx].shadow }
  }
  return {}
}

// ── Swatch (small color box) ──────────────────────────────────
const SW = { width:26,height:26,borderRadius:5,cursor:'pointer',flexShrink:0,margin:2,display:'inline-flex',alignItems:'center',justifyContent:'center',transition:'transform .1s,border-color .1s' }

function Swatch({ style, selected, onClick }) {
  return (
    <div onClick={onClick}
      style={{ ...SW, ...style, border:`2px solid ${selected?'#fff':'transparent'}`, transform:selected?'scale(1.25)':'scale(1)' }}>
      {selected && <i className="fa-solid fa-check" style={{ fontSize:8,color:'#fff',textShadow:'0 1px 2px rgba(0,0,0,0.8)' }} />}
    </div>
  )
}

// ── Compact modal wrapper ─────────────────────────────────────
// Mobile-first: max 340px wide, compact padding, no label elements
function CModal({ children, maxW=340 }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:10,pointerEvents:'none' }}>
      <div onClick={e=>e.stopPropagation()}
        style={{ background:'#13151f',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,width:'100%',maxWidth:maxW,maxHeight:'88vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,0.85)',overflow:'hidden',pointerEvents:'all' }}>
        {children}
      </div>
    </div>
  )
}

function COverlay({ onClose }) {
  return <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,0.6)' }} />
}

function CHead({ title, icon, onClose, accent='#03add8' }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:8,padding:'11px 13px',borderBottom:'1px solid rgba(255,255,255,0.05)',flexShrink:0,background:'#0e1018' }}>
      <span style={{ width:30,height:30,borderRadius:8,background:`${accent}20`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        <i className={icon} style={{ fontSize:13,color:accent }} />
      </span>
      <span style={{ fontWeight:800,fontSize:'0.88rem',color:'#f1f5f9',flex:1 }}>{title}</span>
      <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)',border:'none',borderRadius:7,color:'#777',cursor:'pointer',width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12 }}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  )
}

function CFoot({ onClose, onSave, saving, accent='#03add8' }) {
  return (
    <div style={{ display:'flex',gap:8,padding:'10px 13px',borderTop:'1px solid rgba(255,255,255,0.05)',flexShrink:0,background:'#0e1018' }}>
      <button onClick={onClose} style={{ flex:1,padding:'9px',borderRadius:8,border:'none',background:'rgba(255,255,255,0.06)',color:'#9ca3af',fontWeight:700,fontSize:'0.8rem',cursor:'pointer',fontFamily:'inherit' }}>
        Cancel
      </button>
      <button onClick={onSave} disabled={saving}
        style={{ flex:2,padding:'9px',borderRadius:8,border:'none',background:saving?'#333':`linear-gradient(135deg,${accent},${accent}99)`,color:'#fff',fontWeight:800,fontSize:'0.8rem',cursor:saving?'not-allowed':'pointer',fontFamily:'inherit',boxShadow:saving?'none':`0 3px 12px ${accent}44` }}>
        {saving ? '💾 Saving...' : '💾 Save'}
      </button>
    </div>
  )
}

function CTabs({ tab, setTab, tabs }) {
  return (
    <div style={{ display:'flex',gap:4,marginBottom:10 }}>
      {tabs.map(([id,label]) => (
        <button key={id} onClick={()=>setTab(id)}
          style={{ flex:1,padding:'6px 4px',borderRadius:7,border:`1.5px solid ${tab===id?'#3b82f6':'rgba(255,255,255,0.05)'}`,background:tab===id?'rgba(59,130,246,0.12)':'rgba(255,255,255,0.02)',color:tab===id?'#60a5fa':'#555',fontWeight:700,fontSize:'0.7rem',cursor:'pointer',fontFamily:'inherit' }}>
          {label}
        </button>
      ))}
    </div>
  )
}

// ── MODAL 1 — USERNAME STYLE ──────────────────────────────────
function UsernameStyleModal({ me, onSave, onClose, accent='#03add8' }) {
  const [tab,setTab]   = useState('solid')
  const [sel,setSel]   = useState(me?.nameColor||'')
  const [font,setFont] = useState(me?.nameFont||'')
  const [saving,setSaving] = useState(false)
  const previewStyle = getSelStyle(sel)
  const fontFamily = getFontFamily(font)

  async function handleSave(){
    setSaving(true)
    await onSave([{field:'nameColor',value:sel||'user'},{field:'nameFont',value:font}])
    setSaving(false); onClose()
  }

  return (
    <>
      <COverlay onClose={onClose} />
      <CModal>
        <CHead title="Username Style" icon="fa-solid fa-signature" onClose={onClose} accent={accent} />
        <div style={{ flex:1,overflowY:'auto',padding:13 }}>
          {/* Preview */}
          <div style={{ background:'rgba(0,0,0,0.35)',borderRadius:10,padding:'11px 13px',marginBottom:12,textAlign:'center' }}>
            <div style={{ fontSize:'0.6rem',color:'#555',marginBottom:6,textTransform:'uppercase',letterSpacing:1,fontWeight:700 }}>Preview</div>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
              <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
                style={{ width:28,height:28,borderRadius:'50%',objectFit:'cover',border:`2px solid ${accent}` }}
                onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
              <span style={{ fontSize:'1rem',fontWeight:800,fontFamily,...previewStyle }}>{me?.username||'YourName'}</span>
            </div>
          </div>
          {/* Color */}
          <div style={{ fontSize:'0.65rem',color:'#555',marginBottom:7,fontWeight:700,textTransform:'uppercase',letterSpacing:1 }}>Name Color</div>
          <CTabs tab={tab} setTab={setTab} tabs={[['solid','🎨 Solid'],['gradient','🌈 Gradient'],['neon','✨ Neon']]} />
          <div style={{ maxHeight:160,overflowY:'auto',marginBottom:12,display:'flex',flexWrap:'wrap' }}>
            {/* Default/clear */}
            {tab==='solid' && (
              <Swatch style={{ background:'rgba(255,255,255,0.08)' }} selected={sel===''} onClick={()=>setSel('')} />
            )}
            {tab==='solid' && SOLID_COLORS.map((c,i)=>(
              <Swatch key={i} style={{ background:c }} selected={sel===`bcolor${i+1}`} onClick={()=>setSel(`bcolor${i+1}`)} />
            ))}
            {tab==='gradient' && NAME_GRADIENTS.map((g,i)=>(
              <Swatch key={i} style={{ background:g }} selected={sel===`bgrad${i+1}`} onClick={()=>setSel(`bgrad${i+1}`)} />
            ))}
            {tab==='neon' && NEON_COLORS.map((n,i)=>(
              <Swatch key={i} style={{ background:n.color,boxShadow:`0 0 6px ${n.color}` }} selected={sel===`bneon${i+1}`} onClick={()=>setSel(`bneon${i+1}`)} />
            ))}
          </div>
          {/* Font — dropdown */}
          <div style={{ fontSize:'0.65rem',color:'#555',marginBottom:6,fontWeight:700,textTransform:'uppercase',letterSpacing:1 }}>Font</div>
          <select value={font} onChange={e=>setFont(e.target.value)}
            style={{ width:'100%',background:'#0d1020',borderRadius:8,padding:'8px 10px',color:'#f1f5f9',fontSize:'0.82rem',cursor:'pointer',fontFamily:getFontFamily(font),outline:'none',appearance:'auto',border:'none' }}>
            {FONTS.map(f=><option key={f.id} value={f.id} style={{ fontFamily:'inherit' }}>{f.name}</option>)}
          </select>
        </div>
        <CFoot onClose={onClose} onSave={handleSave} saving={saving} accent={accent} />
      </CModal>
    </>
  )
}

// ── MODAL 2 — TEXT STYLE ─────────────────────────────────────
function TextStyleModal({ me, onSave, onClose, accent='#03add8' }) {
  const [tab,setTab]       = useState('solid')
  const [colorSel,setColor]= useState(me?.msgFontColor||'')
  const [font,setFont]     = useState(me?.msgFontStyle||'')
  const [fontSize,setSize] = useState(me?.msgFontSize||16)
  const [saving,setSaving] = useState(false)
  const fontFamily = getFontFamily(font)
  const colorStyle = getSelStyle(colorSel)
  const previewTextStyle = colorSel ? colorStyle : { color:'#f1f5f9' }

  async function handleSave(){
    setSaving(true)
    await onSave([{field:'msgFontStyle',value:font},{field:'msgFontSize',value:fontSize},{field:'msgFontColor',value:colorSel}])
    setSaving(false); onClose()
  }

  return (
    <>
      <COverlay onClose={onClose} />
      <CModal>
        <CHead title="Text Style" icon="fa-solid fa-font" onClose={onClose} accent={accent} />
        <div style={{ flex:1,overflowY:'auto',padding:13 }}>
          {/* Preview */}
          <div style={{ background:'rgba(0,0,0,0.35)',borderRadius:10,padding:'11px 13px',marginBottom:12 }}>
            <div style={{ fontSize:'0.6rem',color:'#555',marginBottom:6,textTransform:'uppercase',letterSpacing:1,fontWeight:700 }}>Preview</div>
            <div style={{ padding:'8px 11px',borderRadius:'3px 10px 10px 10px',background:'rgba(255,255,255,0.06)',display:'inline-block' }}>
              <span style={{ fontFamily,fontSize:`${fontSize}px`,lineHeight:1.5,...previewTextStyle }}>Your chat message ✨</span>
            </div>
          </div>
          {/* Color */}
          <div style={{ fontSize:'0.65rem',color:'#555',marginBottom:7,fontWeight:700,textTransform:'uppercase',letterSpacing:1 }}>Text Color</div>
          <CTabs tab={tab} setTab={setTab} tabs={[['solid','🎨 Solid'],['gradient','🌈 Gradient'],['neon','✨ Neon']]} />
          <div style={{ maxHeight:140,overflowY:'auto',marginBottom:12,display:'flex',flexWrap:'wrap' }}>
            <Swatch style={{ background:'rgba(255,255,255,0.08)' }} selected={colorSel===''} onClick={()=>setColor('')} />
            {tab==='solid' && SOLID_COLORS.map((c,i)=>(
              <Swatch key={i} style={{ background:c }} selected={colorSel===`bcolor${i+1}`} onClick={()=>setColor(`bcolor${i+1}`)} />
            ))}
            {tab==='gradient' && NAME_GRADIENTS.map((g,i)=>(
              <Swatch key={i} style={{ background:g }} selected={colorSel===`bgrad${i+1}`} onClick={()=>setColor(`bgrad${i+1}`)} />
            ))}
            {tab==='neon' && NEON_COLORS.map((n,i)=>(
              <Swatch key={i} style={{ background:n.color,boxShadow:`0 0 6px ${n.color}` }} selected={colorSel===`bneon${i+1}`} onClick={()=>setColor(`bneon${i+1}`)} />
            ))}
          </div>
          {/* Font size — dropdown */}
          <div style={{ fontSize:'0.65rem',color:'#555',marginBottom:6,fontWeight:700,textTransform:'uppercase',letterSpacing:1 }}>Font Size</div>
          <select value={fontSize} onChange={e=>setSize(+e.target.value)}
            style={{ width:'100%',background:'#0d1020',borderRadius:8,padding:'8px 10px',color:'#f1f5f9',fontSize:'0.82rem',cursor:'pointer',outline:'none',appearance:'auto',border:'none',marginBottom:10 }}>
            {[13,14,15,16,17,18,19,20,22,24,26,28,30].map(s=><option key={s} value={s}>{s}px</option>)}
          </select>
          {/* Font */}
          <div style={{ fontSize:'0.65rem',color:'#555',marginBottom:6,fontWeight:700,textTransform:'uppercase',letterSpacing:1 }}>Font</div>
          <select value={font} onChange={e=>setFont(e.target.value)}
            style={{ width:'100%',background:'#0d1020',borderRadius:8,padding:'8px 10px',color:'#f1f5f9',fontSize:'0.82rem',cursor:'pointer',fontFamily:getFontFamily(font),outline:'none',appearance:'auto',border:'none' }}>
            {FONTS.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <CFoot onClose={onClose} onSave={handleSave} saving={saving} accent={accent} />
      </CModal>
    </>
  )
}

// ── MODAL 3 — MESSAGE BUBBLE ──────────────────────────────────
function BubbleModal({ me, onSave, onClose, accent='#03add8' }) {
  const [tab,setTab]   = useState('solid')
  const [sel,setSel]   = useState(me?.bubbleColor||'')
  const [saving,setSaving] = useState(false)
  const fontFamily = getFontFamily(me?.msgFontStyle||'')
  const fontSize   = me?.msgFontSize||16

  const bubbleStyle = (()=>{
    if(!sel) return { background:'rgba(255,255,255,0.1)' }
    if(sel.startsWith('bubcolor')){ const idx=parseInt(sel.replace('bubcolor',''))-1; if(SOLID_COLORS[idx]) return { background:SOLID_COLORS[idx] } }
    if(sel.startsWith('bubgrad')){ const idx=parseInt(sel.replace('bubgrad',''))-1; if(BUBBLE_GRADIENTS[idx]) return { background:BUBBLE_GRADIENTS[idx] } }
    if(sel.startsWith('bubneon')){ const idx=parseInt(sel.replace('bubneon',''))-1; if(BUBBLE_GRADIENTS[idx]) return { background:BUBBLE_GRADIENTS[idx],boxShadow:`0 0 12px rgba(255,255,255,0.2)` } }
    return {}
  })()

  async function handleSave(){
    setSaving(true)
    await onSave([{field:'bubbleColor',value:sel}])
    setSaving(false); onClose()
  }

  return (
    <>
      <COverlay onClose={onClose} />
      <CModal>
        <CHead title="Message Bubble" icon="fa-solid fa-comment" onClose={onClose} accent={accent} />
        <div style={{ flex:1,overflowY:'auto',padding:13 }}>
          {/* Preview */}
          <div style={{ background:'rgba(0,0,0,0.35)',borderRadius:10,padding:'11px 13px',marginBottom:12 }}>
            <div style={{ fontSize:'0.6rem',color:'#555',marginBottom:8,textTransform:'uppercase',letterSpacing:1,fontWeight:700 }}>Preview</div>
            <div style={{ display:'flex',gap:8,alignItems:'flex-end',marginBottom:7 }}>
              <div style={{ width:24,height:24,borderRadius:'50%',background:'#2a2d3e',flexShrink:0 }} />
              <div style={{ padding:'7px 11px',borderRadius:'3px 10px 10px 10px',background:'rgba(255,255,255,0.07)' }}>
                <span style={{ fontFamily,fontSize:`${fontSize}px`,color:'#ccc' }}>Hey there! 👋</span>
              </div>
            </div>
            <div style={{ display:'flex',gap:8,alignItems:'flex-end',justifyContent:'flex-end' }}>
              <div style={{ padding:'7px 11px',borderRadius:'10px 3px 10px 10px',...bubbleStyle }}>
                <span style={{ fontFamily,fontSize:`${fontSize}px`,color:'#fff' }}>Your bubble! ✨</span>
              </div>
              <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
                style={{ width:24,height:24,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`2px solid ${accent}` }}
                onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
            </div>
          </div>
          <CTabs tab={tab} setTab={setTab} tabs={[['solid','🎨 Solid'],['gradient','🌈 Gradient'],['neon','✨ Neon']]} />
          <div style={{ maxHeight:180,overflowY:'auto',display:'flex',flexWrap:'wrap' }}>
            <Swatch style={{ background:'rgba(255,255,255,0.08)' }} selected={sel===''} onClick={()=>setSel('')} />
            {tab==='solid' && SOLID_COLORS.map((c,i)=>(
              <Swatch key={i} style={{ background:c }} selected={sel===`bubcolor${i+1}`} onClick={()=>setSel(`bubcolor${i+1}`)} />
            ))}
            {tab==='gradient' && BUBBLE_GRADIENTS.map((g,i)=>(
              <Swatch key={i} style={{ background:g }} selected={sel===`bubgrad${i+1}`} onClick={()=>setSel(`bubgrad${i+1}`)} />
            ))}
            {tab==='neon' && BUBBLE_GRADIENTS.map((g,i)=>(
              <Swatch key={i} style={{ background:g,boxShadow:'0 0 6px rgba(255,255,255,0.25)' }} selected={sel===`bubneon${i+1}`} onClick={()=>setSel(`bubneon${i+1}`)} />
            ))}
          </div>
        </div>
        <CFoot onClose={onClose} onSave={handleSave} saving={saving} accent={accent} />
      </CModal>
    </>
  )
}

// ── MODAL 4 — SOUNDS ─────────────────────────────────────────
function SoundsModal({ onClose, accent='#03add8' }) {
  const [prefs,setPrefs]     = useState(getSoundPrefs)
  const [master,setMaster]   = useState(getSoundEnabled)

  function toggleMaster(){
    const next = toggleSound()
    setMaster(next)
  }

  function toggle(key){
    const cur = prefs[key]!==false
    setSoundPref(key,!cur)
    setPrefs(p=>({...p,[key]:!cur}))
  }
  function testSound(file){
    if(!master) return
    try{ const a=new Audio(file);a.volume=0.5;a.play().catch(()=>{}) }catch{}
  }

  return (
    <>
      <COverlay onClose={onClose} />
      <CModal>
        <CHead title="Sounds" icon="fa-solid fa-volume-high" onClose={onClose} accent={accent} />
        <div style={{ flex:1,overflowY:'auto' }}>

          {/* ── MASTER TOGGLE ── */}
          <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 13px',borderBottom:'2px solid rgba(255,255,255,0.07)',background:'rgba(0,0,0,0.2)' }}>
            <span style={{ width:32,height:32,borderRadius:9,background:master?`${accent}22`:'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background .2s' }}>
              <i className={master?'fa-solid fa-volume-high':'fa-solid fa-volume-xmark'} style={{ fontSize:14,color:master?accent:'#555' }} />
            </span>
            <div style={{ flex:1 }}>
              <span style={{ fontSize:'0.85rem',color:master?'#f1f5f9':'#555',fontWeight:800 }}>All Sounds</span>
              <div style={{ fontSize:'0.62rem',color:'#444',marginTop:1 }}>{master?'Master sound is ON':'Master sound is OFF — all sounds muted'}</div>
            </div>
            <button onClick={toggleMaster}
              style={{ width:46,height:24,borderRadius:12,border:'none',cursor:'pointer',background:master?accent:'rgba(255,255,255,0.1)',position:'relative',transition:'background .2s',flexShrink:0,boxShadow:master?`0 0 8px ${accent}66`:'none' }}>
              <span style={{ position:'absolute',top:3,left:master?'calc(100% - 20px)':'3px',width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,0.4)' }} />
            </button>
          </div>

          {/* ── PER-SOUND LIST ── */}
          {SOUND_KEYS.map((sk,i)=>{
            const isOn = master && prefs[sk.key]!==false
            const canToggle = master  // can only toggle individual sounds if master is on
            return (
              <div key={sk.key} style={{ display:'flex',alignItems:'center',gap:10,padding:'11px 13px',borderBottom:i<SOUND_KEYS.length-1?'1px solid rgba(255,255,255,0.04)':'none',opacity:master?1:0.4,transition:'opacity .2s' }}>
                <span style={{ width:30,height:30,borderRadius:8,background:`${accent}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <i className={sk.icon} style={{ fontSize:13,color:isOn?accent:'#444' }} />
                </span>
                <span style={{ flex:1,fontSize:'0.82rem',color:isOn?'#f1f5f9':'#555',fontWeight:600 }}>{sk.label}</span>
                <button onClick={()=>isOn&&testSound(sk.file)} disabled={!isOn} title="Test"
                  style={{ width:26,height:26,borderRadius:6,border:'none',cursor:isOn?'pointer':'not-allowed',background:'rgba(255,255,255,0.05)',color:isOn?accent:'#333',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,flexShrink:0 }}>
                  <i className="fa-solid fa-play" />
                </button>
                <button onClick={()=>canToggle&&toggle(sk.key)} disabled={!master}
                  style={{ width:40,height:22,borderRadius:11,border:'none',cursor:canToggle?'pointer':'not-allowed',background:(master&&prefs[sk.key]!==false)?accent:'rgba(255,255,255,0.08)',position:'relative',transition:'background .2s',flexShrink:0 }}>
                  <span style={{ position:'absolute',top:2,left:(master&&prefs[sk.key]!==false)?'calc(100% - 19px)':'2px',width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,0.4)' }} />
                </button>
              </div>
            )
          })}
        </div>
        <div style={{ padding:'9px 13px',borderTop:'1px solid rgba(255,255,255,0.04)',background:'#0e1018' }}>
          <p style={{ fontSize:'0.66rem',color:'#444',textAlign:'center',margin:0 }}>Changes save automatically. Master off = all sounds silent.</p>
        </div>
      </CModal>
    </>
  )
}

// ── MODAL 5 — THEMES ─────────────────────────────────────────
function ThemesModal({ me, onSave, onClose, accent='#03add8' }) {
  const [selTheme,setSel] = useState(me?.chatTheme||'Dark')
  const [themeLimit,setLimit] = useState(-1)
  const [saving,setSaving] = useState(false)

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
      <COverlay onClose={onClose} />
      <CModal maxW={380}>
        <CHead title="Chat Theme" icon="fa-solid fa-palette" onClose={onClose} accent={accent} />
        <div style={{ flex:1,overflowY:'auto',padding:12 }}>
          {/* Preview of selected */}
          <div style={{ borderRadius:12,overflow:'hidden',marginBottom:12,border:`2px solid ${accent}44` }}>
            <div style={{ background:tObj.bg_header,padding:'9px 12px',display:'flex',alignItems:'center',gap:7 }}>
              <div style={{ width:8,height:8,borderRadius:'50%',background:'#ff5f5f' }} />
              <div style={{ width:8,height:8,borderRadius:'50%',background:'#ffbe2e' }} />
              <div style={{ width:8,height:8,borderRadius:'50%',background:'#2aca44' }} />
              <span style={{ color:tObj.text,fontWeight:700,fontSize:'0.78rem',marginLeft:4 }}>#{tObj.name}</span>
            </div>
            <div style={{ background:tObj.bg_chat!=='transparent'?tObj.bg_chat:'#111',padding:'10px',minHeight:60 }}>
              <div style={{ display:'flex',gap:7,alignItems:'flex-end',marginBottom:6 }}>
                <div style={{ width:22,height:22,borderRadius:'50%',background:tObj.accent,flexShrink:0 }} />
                <div style={{ background:tObj.bg_log,padding:'5px 9px',borderRadius:'2px 9px 9px 9px' }}>
                  <span style={{ color:tObj.text,fontSize:'0.75rem' }}>Hello! 🎉</span>
                </div>
              </div>
              <div style={{ display:'flex',gap:7,alignItems:'flex-end',justifyContent:'flex-end' }}>
                <div style={{ background:tObj.accent,padding:'5px 9px',borderRadius:'9px 2px 9px 9px' }}>
                  <span style={{ color:'#fff',fontSize:'0.75rem' }}>Looks 🔥</span>
                </div>
                <div style={{ width:22,height:22,borderRadius:'50%',background:tObj.default_color,flexShrink:0 }} />
              </div>
            </div>
          </div>
          {/* Theme grid — 3 columns */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7 }}>
            {THEMES.map((t,idx)=>{
              const allowed=canUse(idx), isSel=selTheme===t.id
              return (
                <div key={t.id} onClick={()=>allowed&&setSel(t.id)}
                  style={{ borderRadius:9,overflow:'hidden',cursor:allowed?'pointer':'not-allowed',border:`2px solid ${isSel?accent:'rgba(255,255,255,0.05)'}`,opacity:allowed?1:0.4,transition:'border-color .15s,transform .1s',transform:isSel?'scale(1.03)':'scale(1)',position:'relative' }}>
                  <div style={{ height:38,background:tObj.id===t.id?tObj.bg_header:t.bg_header,display:'flex',alignItems:'center',justifyContent:'center',gap:3 }}>
                    <div style={{ width:14,height:14,borderRadius:'50%',background:t.bg_log,border:`1.5px solid ${t.accent}` }} />
                    {t.bg_image && <div style={{ width:6,height:6,borderRadius:2,background:t.accent,opacity:0.7 }} />}
                  </div>
                  <div style={{ background:'#0a0c14',padding:'4px 5px',textAlign:'center' }}>
                    <span style={{ fontSize:'0.58rem',fontWeight:700,color:isSel?accent:'#777',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.name}</span>
                  </div>
                  {isSel && <div style={{ position:'absolute',top:3,right:3,width:14,height:14,borderRadius:'50%',background:accent,display:'flex',alignItems:'center',justifyContent:'center' }}><i className="fa-solid fa-check" style={{ fontSize:7,color:'#fff' }} /></div>}
                  {!allowed && <div style={{ position:'absolute',top:2,left:2,background:'#f59e0b',borderRadius:3,padding:'0 4px',fontSize:'0.5rem',fontWeight:800,color:'#000' }}>VIP</div>}
                </div>
              )
            })}
          </div>
        </div>
        <CFoot onClose={onClose} onSave={handleSave} saving={saving} accent={accent} />
      </CModal>
    </>
  )
}

// ── MODAL 6 — CUSTOM CSS ─────────────────────────────────────
// Custom CSS applies user-level personalisation (stored server side)
// Example use: override font sizes, add animations, custom colors
function CustomCSSModal({ me, onSave, onClose, accent='#03add8' }) {
  const [css, setCss] = useState(me?.customCss || '')
  const [saving, setSaving] = useState(false)

  const EXAMPLES = [
    { label: 'Bigger text', code: '.chat-msg { font-size: 18px !important; }' },
    { label: 'Bold names', code: '.chat-name { font-weight: 900 !important; }' },
    { label: 'Round bubbles', code: '.chat-bubble { border-radius: 20px !important; }' },
    { label: 'Hide timestamps', code: '.chat-ts { display: none !important; }' },
  ]

  async function handleSave() {
    setSaving(true)
    await onSave([{ field: 'customCss', value: css }])
    // Inject CSS into current page
    let el = document.getElementById('cgz-user-custom-css')
    if (!el) { el = document.createElement('style'); el.id = 'cgz-user-custom-css'; document.head.appendChild(el) }
    el.textContent = css
    setSaving(false)
    onClose()
  }

  return (
    <>
      <COverlay onClose={onClose} />
      <CModal maxW={420}>
        <CHead title="Custom CSS" icon="fa-solid fa-code" onClose={onClose} accent={accent} />
        <div style={{ flex:1, overflowY:'auto', padding:13 }}>
          <div style={{ fontSize:'0.65rem', color:'#555', marginBottom:8, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>
            Your CSS
          </div>
          <textarea
            value={css}
            onChange={e => setCss(e.target.value)}
            placeholder={'/* Add your custom CSS here */\n.chat-msg { font-size: 16px; }\n.chat-name { font-weight: 900; }'}
            rows={10}
            style={{ width:'100%', padding:'10px', background:'#0a0c14', border:'1.5px solid rgba(255,255,255,0.07)',
              borderRadius:9, color:'#e0e0ff', fontSize:'0.78rem', fontFamily:"'Courier New',monospace",
              lineHeight:1.6, resize:'vertical', outline:'none', boxSizing:'border-box',
              minHeight:180 }}
            onFocus={e => e.target.style.borderColor = accent}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
          />
          <div style={{ fontSize:'0.62rem', color:'#444', marginTop:6, marginBottom:10 }}>
            ⚠️ Custom CSS applies to your view only. Affects all chat elements.
          </div>
          <div style={{ fontSize:'0.65rem', color:'#555', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
            Quick Examples
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setCss(p => p ? p + '\n' + ex.code : ex.code)}
                style={{ padding:'4px 10px', borderRadius:20, border:`1px solid rgba(255,255,255,0.08)`,
                  background:'rgba(255,255,255,0.04)', color:'#888', fontSize:'0.68rem', cursor:'pointer',
                  fontFamily:'inherit', transition:'all .12s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}55`; e.currentTarget.style.color = accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#888' }}>
                + {ex.label}
              </button>
            ))}
            {css && (
              <button onClick={() => setCss('')}
                style={{ padding:'4px 10px', borderRadius:20, border:'1px solid rgba(239,68,68,0.3)',
                  background:'rgba(239,68,68,0.08)', color:'#ef4444', fontSize:'0.68rem', cursor:'pointer', fontFamily:'inherit' }}>
                Clear All
              </button>
            )}
          </div>
        </div>
        <CFoot onClose={onClose} onSave={handleSave} saving={saving} accent={accent} />
      </CModal>
    </>
  )
}

// ── CHAT OPTIONS SUBMENU ──────────────────────────────────────
function ChatOptionsSubmenu({ me, tObj, onClose, onSaved }) {
  const [modal,setModal] = useState(null)
  const acc = tObj?.accent||'#03add8'
  const bg  = tObj?.bg_chat||'#151515'
  const hdr = tObj?.bg_header||'#111'
  const txt = tObj?.text||'#fff'
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
    {id:'textStyle',    label:'Text Style',    icon:'fa-solid fa-font',        desc:'Text color & size'},
    {id:'bubble',       label:'Message Bubble',icon:'fa-solid fa-comment',     desc:'Bubble color & style'},
    {id:'sounds',       label:'Sounds',        icon:'fa-solid fa-volume-high', desc:'Notification sounds'},
    {id:'theme',        label:'Theme',         icon:'fa-solid fa-palette',     desc:'Chat room theme'},
    {id:'customCss',    label:'Custom CSS',    icon:'fa-solid fa-code',        desc:'Personalise with CSS'},
  ]

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9997,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:12 }}>
        <div onClick={e=>e.stopPropagation()}
          style={{ background:hdr,borderRadius:14,width:'min(320px,94vw)',maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 12px 48px rgba(0,0,0,0.7)',overflow:'hidden' }}>
          <div style={{ display:'flex',alignItems:'center',gap:9,padding:'11px 13px',borderBottom:'1px solid rgba(255,255,255,0.05)',flexShrink:0 }}>
            <span style={{ fontWeight:800,fontSize:'0.88rem',color:txt,flex:1 }}>Chat Options</span>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)',border:'none',borderRadius:7,color:'#777',cursor:'pointer',width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}><i className="fa-solid fa-xmark" /></button>
          </div>
          <div style={{ overflowY:'auto',flex:1 }}>
            {ITEMS.map((item,i)=>(
              <button key={item.id} onClick={()=>setModal(item.id)}
                style={{ display:'flex',alignItems:'center',gap:10,width:'100%',padding:'11px 13px',background:'none',border:'none',cursor:'pointer',textAlign:'left',borderTop:i>0?'1px solid rgba(255,255,255,0.04)':'none',transition:'background .1s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <span style={{ width:30,height:30,borderRadius:8,background:`${acc}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <i className={item.icon} style={{ fontSize:13,color:acc }} />
                </span>
                <div style={{ flex:1 }}>
                  <div style={{ color:txt,fontWeight:700,fontSize:'0.82rem' }}>{item.label}</div>
                  <div style={{ color:'#555',fontSize:'0.66rem',marginTop:2 }}>{item.desc}</div>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ fontSize:10,color:'#444' }} />
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
      {modal==='customCss'     && <CustomCSSModal     me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
    </>
  )
}

// ── WALLET MODAL ──────────────────────────────────────────────
function WalletModal({ me, tObj, onClose }) {
  const [tab,setTab]=useState('gold')
  const acc=tObj?.accent||'#03add8', hdr=tObj?.bg_header||'#111', bg=tObj?.bg_chat||'#151515', txt=tObj?.text||'#fff'
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:12 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:hdr,borderRadius:14,width:'min(320px,92vw)',boxShadow:'0 12px 48px rgba(0,0,0,0.7)',overflow:'hidden' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 13px',borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:7 }}><i className="fa-solid fa-wallet" style={{ color:acc,fontSize:15 }} /><span style={{ fontWeight:700,fontSize:'0.9rem',color:txt }}>Wallet</span></div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)',border:'none',borderRadius:7,color:'#777',cursor:'pointer',width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div style={{ display:'flex',background:bg }}>
          {[{id:'gold',label:'Gold',icon:'fa-solid fa-coins',color:'#f59e0b'},{id:'ruby',label:'Rubies',icon:'fa-solid fa-gem',color:'#ef4444'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,padding:'10px 0',border:'none',cursor:'pointer',background:'none',color:tab===t.id?t.color:'#555',fontWeight:700,fontSize:'0.78rem',borderBottom:tab===t.id?`2px solid ${t.color}`:'2px solid transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
              <i className={t.icon} style={{ fontSize:18 }} />{t.label}
            </button>
          ))}
        </div>
        <div style={{ padding:'20px 18px',textAlign:'center',background:bg }}>
          {tab==='gold'
            ?<><img src="/default_images/icons/gold.svg" alt="gold" style={{ width:44,height:44,marginBottom:6 }} onError={e=>{e.target.style.display='none'}}/><div style={{ fontSize:'2rem',fontWeight:900,color:'#f59e0b' }}>{(me?.gold||0).toLocaleString()}</div><div style={{ fontSize:'0.75rem',color:'#666',marginTop:3 }}>Gold Coins</div></>
            :<><img src="/default_images/icons/ruby.svg" alt="ruby" style={{ width:44,height:44,marginBottom:6 }} onError={e=>{e.target.style.display='none'}}/><div style={{ fontSize:'2rem',fontWeight:900,color:'#ef4444' }}>{(me?.ruby||0).toLocaleString()}</div><div style={{ fontSize:'0.75rem',color:'#666',marginTop:3 }}>Rubies</div></>
          }
        </div>
      </div>
    </div>
  )
}

// ── LEVEL PANEL ───────────────────────────────────────────────
function LevelPanel({ me, tObj, onClose }) {
  const acc=tObj?.accent||'#03add8', bg=tObj?.bg_chat||'#151515', hdr=tObj?.bg_header||'#111', txt=tObj?.text||'#fff'
  const xp=me?.xp||0, level=me?.level||1, xpNext=xpForLevel(level), xpPrev=xpForLevel(level-1)||0
  const pct=Math.min(100,Math.round(((xp-xpPrev)/(xpNext-xpPrev))*100))||0
  const ri=R(me?.rank)
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:12 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:hdr,borderRadius:14,width:'min(320px,92vw)',boxShadow:'0 12px 48px rgba(0,0,0,0.7)',overflow:'hidden' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 13px',borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:7 }}><i className="fa-solid fa-chart-line" style={{ color:acc,fontSize:15 }} /><span style={{ fontWeight:700,fontSize:'0.9rem',color:txt }}>Level & XP</span></div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)',border:'none',borderRadius:7,color:'#777',cursor:'pointer',width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div style={{ padding:'16px',background:bg }}>
          <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:16 }}>
            <div style={{ width:52,height:52,borderRadius:'50%',background:`radial-gradient(circle at 35% 35%,${acc}40,${acc}10)`,border:`2px solid ${acc}55`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <span style={{ fontSize:'1.4rem',fontWeight:900,color:acc }}>Lv</span>
            </div>
            <div><div style={{ fontSize:'2.2rem',fontWeight:900,color:txt,lineHeight:1 }}>{level}</div><div style={{ fontSize:'0.7rem',color:'#666',marginTop:2 }}>{ri.label}</div></div>
            <div style={{ marginLeft:'auto',textAlign:'right' }}><div style={{ fontSize:'0.68rem',color:'#666' }}>Total XP</div><div style={{ fontSize:'1rem',fontWeight:700,color:acc }}>{xp.toLocaleString()}</div></div>
          </div>
          <div style={{ marginBottom:4,display:'flex',justifyContent:'space-between' }}>
            <span style={{ fontSize:'0.68rem',color:'#666' }}>Level {level+1}</span>
            <span style={{ fontSize:'0.68rem',fontWeight:700,color:acc }}>{pct}%</span>
          </div>
          <div style={{ height:7,borderRadius:99,background:'rgba(255,255,255,0.07)',overflow:'hidden' }}>
            <div style={{ height:'100%',width:`${pct}%`,borderRadius:99,background:`linear-gradient(90deg,${acc}88,${acc})`,transition:'width .5s ease' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MENU ROW ──────────────────────────────────────────────────
function MenuRow({ icon, iconColor, label, chevron, onClick, danger, acc, txt }) {
  const [hov,setHov]=useState(false)
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'flex',alignItems:'center',gap:9,width:'100%',padding:'8px 12px',background:hov?'rgba(255,255,255,0.04)':'none',border:'none',cursor:'pointer',textAlign:'left',color:danger?'#ef4444':(txt||'#ddd'),fontSize:'0.8rem',fontWeight:600,transition:'background .1s' }}>
      <span style={{ width:26,height:26,borderRadius:6,flexShrink:0,background:danger?'rgba(239,68,68,0.1)':`${iconColor||acc||'#03add8'}15`,display:'flex',alignItems:'center',justifyContent:'center' }}>
        <i className={icon} style={{ fontSize:12,color:danger?'#ef4444':(iconColor||acc||'#03add8') }} />
      </span>
      <span style={{ flex:1 }}>{label}</span>
      {chevron&&<i className="fa-solid fa-chevron-right" style={{ fontSize:9,color:'#444' }} />}
    </button>
  )
}

// ── AVATAR DROPDOWN ───────────────────────────────────────────
function AvatarDropdown({ me, status, setStatus, onLeave, socket, onOpenSettings, onOpenProfile, tObj, room }) {
  const [open,setOpen]                    = useState(false)
  const [showWallet,setShowWallet]        = useState(false)
  const [showLevel,setShowLevel]          = useState(false)
  const [showChatOpts,setShowChatOpts]    = useState(false)
  const [showStatusMenu,setShowStatusMenu]= useState(false)
  const ref = useRef(null)
  const nav = useNavigate()

  const acc=tObj?.accent||'#03add8', hdr=tObj?.bg_header||'#111', bg=tObj?.bg_chat||'#151515', txt=tObj?.text||'#fff'
  const ri=R(me?.rank), myLevel=RL(me?.rank)
  const isAdmin=myLevel>=12
  const isRoomOwnerOrMod=myLevel>=11||(room?.owner&&String(room.owner)===String(me?._id))

  useEffect(()=>{
    function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false)}
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h)
  },[])

  function logout(){localStorage.removeItem('cgz_token');nav('/login')}
  const Divider=()=><div style={{ height:1,background:'rgba(255,255,255,0.04)',margin:'3px 0' }} />

  return (
    <>
      <div ref={ref} style={{ position:'relative',flexShrink:0 }}>
        <button onClick={e=>{e.stopPropagation();setOpen(p=>!p)}}
          style={{ background:'none',border:'none',cursor:'pointer',padding:3,borderRadius:7,display:'flex',alignItems:'center',gap:4,position:'relative' }}>
          <div style={{ position:'relative' }}>
            <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
              style={{ width:30,height:30,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${GBR(me?.gender,me?.rank)}`,display:'block' }}
              onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
            <img src={`/default_images/status/${status==='online'?'active':status==='invisible'?'invisible':status==='busy'?'busy':'away'}.svg`} alt={status}
              style={{ position:'absolute',bottom:-1,right:-1,width:11,height:11 }}
              onError={e=>{ e.target.style.display='none'; const s=document.createElement('span'); s.style.cssText=`position:absolute;bottom:0;right:0;width:9px;height:9px;border-radius:50%;background:${STATUS_COLOR[status]||'#22c55e'};border:1.5px solid ${hdr}`; e.target.parentNode?.appendChild(s) }}
            />
          </div>
        </button>

        {open&&(
          <div onClick={e=>e.stopPropagation()}
            style={{ position:'absolute',top:'calc(100% + 6px)',right:0,background:hdr,borderRadius:13,minWidth:240,boxShadow:'0 10px 40px rgba(0,0,0,0.65)',zIndex:500,overflow:'hidden' }}>

            {/* ── CodyChat-style user header ── */}
            <div style={{ padding:'12px 12px 10px',borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display:'flex',alignItems:'flex-start',gap:9 }}>
                {/* Avatar with status dot */}
                <div style={{ position:'relative',flexShrink:0 }}>
                  <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
                    style={{ width:44,height:44,borderRadius:'50%',objectFit:'cover',border:`2px solid ${GBR(me?.gender,me?.rank)}` }}
                    onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}} />
                  {/* Status picker button */}
                  <button onClick={()=>setShowStatusMenu(p=>!p)}
                    title="Change status"
                    style={{ position:'absolute',bottom:-1,right:-1,width:16,height:16,borderRadius:'50%',background:STATUS_COLOR[status]||'#22c55e',border:`2px solid ${hdr}`,cursor:'pointer',padding:0 }} />
                </div>

                {/* Name, rank, level, mood */}
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:1,flexWrap:'wrap' }}>
                    <span style={{ fontSize:'0.88rem',fontWeight:800,color:txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:110 }}>{me?.username}</span>
                    <img src={`/icons/ranks/${ri.icon}`} alt={ri.label} title={ri.label}
                      style={{ width:15,height:15,objectFit:'contain',flexShrink:0 }}
                      onError={e=>e.target.style.display='none'} />
                    {/* Level badge */}
                    <span style={{ background:`${acc}22`,color:acc,fontSize:'0.55rem',fontWeight:800,padding:'1px 5px',borderRadius:5,flexShrink:0,border:`1px solid ${acc}44` }}>
                      Lv {me?.level||1}
                    </span>
                  </div>
                  {/* Rank label */}
                  <div style={{ fontSize:'0.63rem',color:ri.color||'#888',fontWeight:700,marginBottom:2 }}>{ri.label}</div>
                  {/* Mood under name */}
                  {me?.mood && (
                    <div style={{ fontSize:'0.64rem',color:'#777',fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                      "{me.mood}"
                    </div>
                  )}
                  {/* Mini stats: gold + ruby */}
                  <div style={{ display:'flex',gap:6,marginTop:3 }}>
                    <span style={{ fontSize:'0.62rem',color:'#f59e0b',fontWeight:700,display:'flex',alignItems:'center',gap:2 }}>
                      <img src="/default_images/icons/gold.svg" alt="" style={{ width:12,height:12 }} onError={e=>e.target.style.display='none'}/> {(me?.gold||0).toLocaleString()}
                    </span>
                    <span style={{ fontSize:'0.62rem',color:'#ef4444',fontWeight:700,display:'flex',alignItems:'center',gap:2 }}>
                      <img src="/default_images/icons/ruby.svg" alt="" style={{ width:12,height:12 }} onError={e=>e.target.style.display='none'}/> {(me?.ruby||0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Edit profile quick link */}
                <button onClick={()=>{onOpenProfile?.();setOpen(false)}}
                  title="Edit Profile"
                  style={{ width:24,height:24,borderRadius:6,background:'rgba(255,255,255,0.07)',border:'none',cursor:'pointer',color:'#888',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0 }}>
                  <i className="fa-regular fa-pen-to-square" />
                </button>
              </div>

              {/* Status submenu */}
              {showStatusMenu&&(
                <div style={{ marginTop:8,background:bg,borderRadius:9,padding:4,boxShadow:'0 4px 16px rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.06)' }}>
                  {STATUS_OPTS.map(s=>(
                    <button key={s.id} onClick={()=>{setStatus(s.id);socket?.emit('setStatus',{status:s.id});setShowStatusMenu(false)}}
                      style={{ display:'flex',alignItems:'center',gap:8,width:'100%',padding:'7px 10px',borderRadius:6,border:'none',cursor:'pointer',background:status===s.id?`${acc}1a`:'none',color:status===s.id?txt:'#888',fontSize:'0.76rem',fontWeight:status===s.id?700:500 }}>
                      <img
                        src={`/default_images/status/${s.id==='online'?'active':s.id==='invisible'?'invisible':s.id==='busy'?'busy':'away'}.svg`}
                        alt={s.label}
                        style={{ width:14,height:14,flexShrink:0 }}
                        onError={e=>{ e.target.style.display='none'; const dot=document.createElement('span'); dot.style.cssText=`width:9px;height:9px;border-radius:50%;background:${s.color};display:inline-block`; e.target.parentNode?.insertBefore(dot,e.target.nextSibling) }}
                      />
                      {s.label}
                      {status===s.id&&<i className="fa-solid fa-check" style={{ fontSize:8,color:acc,marginLeft:'auto' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Menu items */}
            <MenuRow icon="fa-solid fa-wallet" iconColor="#f59e0b"
              label={<span style={{ display:'flex',alignItems:'center',gap:4,flex:1 }}>Wallet</span>}
              onClick={()=>{setShowWallet(true);setOpen(false)}} acc={acc} txt={txt} />
            <MenuRow icon="fa-solid fa-chart-line" iconColor="#818cf8"
              label={<span style={{ display:'flex',alignItems:'center',gap:4,flex:1 }}>Level<span style={{ marginLeft:'auto',fontSize:'0.7rem',color:'#818cf8',fontWeight:800 }}>Lv {me?.level||1}</span></span>}
              onClick={()=>{setShowLevel(true);setOpen(false)}} acc={acc} txt={txt} />
            <MenuRow icon="fa-solid fa-sliders" label="Chat Options" chevron onClick={()=>{setShowChatOpts(true);setOpen(false)}} acc={acc} txt={txt} />
            {isAdmin&&<MenuRow icon="fa-solid fa-gauge" iconColor="#FF4444" label="Admin Panel" onClick={()=>{window.open('/admin','_blank','noopener,noreferrer');setOpen(false)}} acc={acc} txt={txt} />}
            {isRoomOwnerOrMod&&<MenuRow icon="fa-solid fa-gear" iconColor="#f59e0b" label="Room Settings" chevron onClick={()=>setOpen(false)} acc={acc} txt={txt} />}
            <Divider />
            <MenuRow icon="fa-solid fa-arrow-right-from-bracket" label="Leave Room" danger onClick={()=>{onLeave?.();setOpen(false)}} acc={acc} txt={txt} />
            <MenuRow icon="fa-solid fa-power-off" label="Logout" danger onClick={()=>{setOpen(false);logout()}} acc={acc} txt={txt} />
          </div>
        )}
      </div>
      {showWallet   && <WalletModal        me={me} tObj={tObj} onClose={()=>setShowWallet(false)} />}
      {showLevel    && <LevelPanel         me={me} tObj={tObj} onClose={()=>setShowLevel(false)} />}
      {showChatOpts && <ChatOptionsSubmenu me={me} tObj={tObj} onClose={()=>setShowChatOpts(false)} onSaved={()=>{}} inline={true} />}
    </>
  )
}

// ── CHAT SETTINGS OVERLAY ────────────────────────────────────
function ChatSettingsOverlay({ me, onClose, onSaved }) {
  const [modal,setModal] = useState(null)
  const acc = me?.chatTheme ? (require('../../components/StyleModal').THEMES.find(t=>t.id===me.chatTheme)?.accent || '#03add8') : '#03add8'
  const token = localStorage.getItem('cgz_token')
  async function saveStyle(fields){
    const body={}; fields.forEach(({field,value})=>{body[field]=value})
    try{
      const r=await fetch(`${API}/api/users/me/style`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)})
      const d=await r.json(); if(r.ok) onSaved?.(d.user)
    }catch{}
  }
  const TABS=[
    {id:'usernameStyle',label:'Name',    icon:'fa-solid fa-signature'},
    {id:'textStyle',    label:'Text',    icon:'fa-solid fa-font'},
    {id:'bubble',       label:'Bubble',  icon:'fa-solid fa-comment'},
    {id:'sounds',       label:'Sounds',  icon:'fa-solid fa-volume-high'},
    {id:'theme',        label:'Theme',   icon:'fa-solid fa-palette'},

  ]
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:55 }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:'#191921',borderRadius:13,width:'min(440px,96vw)',maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 8px 40px rgba(0,0,0,0.7)' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderBottom:'1px solid rgba(255,255,255,0.05)',background:'#111',borderRadius:'13px 13px 0 0',flexShrink:0 }}>
            <span style={{ fontSize:'0.9rem',fontWeight:700,color:'#fff' }}>⚙️ Chat Settings</span>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)',border:'none',borderRadius:7,color:'#777',cursor:'pointer',width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}><i className="fa-solid fa-xmark" /></button>
          </div>
          {/* Tab icons row */}
          <div style={{ display:'flex',borderBottom:'1px solid rgba(255,255,255,0.05)',flexShrink:0,background:'#111' }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setModal(prev=>prev===t.id?null:t.id)}
                style={{ flex:1,padding:'9px 0',border:'none',cursor:'pointer',fontSize:'0.66rem',fontWeight:600,background:'none',color:modal===t.id?acc:'rgba(255,255,255,0.3)',borderBottom:modal===t.id?`2px solid ${acc}`:'2px solid transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:3,transition:'color .12s' }}>
                <i className={t.icon} style={{ fontSize:15 }} />{t.label}
              </button>
            ))}
          </div>
          {/* Empty state when nothing selected */}
          {!modal && (
            <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,gap:12 }}>
              <i className="fa-solid fa-sliders" style={{ fontSize:32,color:'rgba(255,255,255,0.12)' }} />
              <p style={{ color:'#555',fontSize:'0.82rem',textAlign:'center' }}>Pick a category above to customise your chat experience.</p>
              <div style={{ display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginTop:4 }}>
                {TABS.map(t=>(
                  <button key={t.id} onClick={()=>setModal(t.id)}
                    style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:20,border:`1px solid rgba(255,255,255,0.08)`,background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.55)',fontSize:'0.75rem',fontWeight:600,cursor:'pointer' }}>
                    <i className={t.icon} style={{ color:acc,fontSize:12 }} />{t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {modal==='usernameStyle' && <UsernameStyleModal me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
      {modal==='textStyle'     && <TextStyleModal     me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
      {modal==='bubble'        && <BubbleModal        me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
      {modal==='sounds'        && <SoundsModal        accent={acc}          onClose={()=>setModal(null)} />}
      {modal==='theme'         && <ThemesModal        me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
      {modal==='customCss'     && <CustomCSSModal     me={me} accent={acc} onSave={saveStyle} onClose={()=>setModal(null)} />}
    </>
  )
}

// ── FOOTER ────────────────────────────────────────────────────
function Footer({ showRadio, setShowRadio, showRight, setRight, notif, tObj, minimized = [], onMaximize }) {
  const thHeader=tObj?.bg_header||'#111', thBorder=tObj?.default_color||'#222'
  const acc=tObj?.accent||'#03add8', txt=tObj?.text||'#fff'
  const [soundOn, setSoundOn] = useState(getSoundEnabled)

  function handleSoundToggle() {
    const next = toggleSound()
    setSoundOn(next)
  }

  return (
    <div style={{ background:thHeader,borderTop:`1px solid ${thBorder}22`,padding:'3px 8px',display:'flex',alignItems:'center',gap:2,flexShrink:0,position:'relative',minHeight:44 }}>
      {/* Leftmost: Radio icon — opens radio modal above footer */}
      <FBtn faIcon="fa-solid fa-radio" active={showRadio} onClick={()=>setShowRadio(s=>!s)} title="Radio" tObj={tObj} />

      {/* Sound toggle */}
      <button
        onClick={handleSoundToggle}
        title={soundOn ? 'Sounds ON – click to mute' : 'Sounds OFF – click to unmute'}
        style={{ width:32,height:32,borderRadius:8,border:`1px solid ${soundOn?acc+'44':'rgba(255,255,255,0.08)'}`,background:soundOn?`${acc}15`:'rgba(255,255,255,0.04)',color:soundOn?acc:'#555',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0,transition:'all .15s' }}>
        <i className={soundOn ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark'} />
      </button>

      {/* Minimized windows area — DM / YouTube / Spotify bubbles */}
      <div style={{ flex:1, display:'flex', alignItems:'center', gap:4, overflow:'hidden', padding:'0 4px' }}>
        {(minimized||[]).map((item,i) => (
          <button key={i} onClick={() => onMaximize?.(item)}
            title={`Open ${item.label || item.type}`}
            style={{ display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:20,border:`1px solid ${acc}33`,background:`${acc}11`,color:acc,cursor:'pointer',fontSize:'0.68rem',fontWeight:600,flexShrink:0,maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
            <i className={item.type==='dm'?'fa-solid fa-envelope':item.type==='youtube'?'fa-brands fa-youtube':item.type==='spotify'?'fa-brands fa-spotify':'fa-solid fa-window-restore'} style={{fontSize:10}}/>
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:60}}>{item.label || item.type}</span>
          </button>
        ))}
      </div>

      {/* Buy Premium icon — rightmost before user list */}
      <button
        onClick={() => {/* open premium modal via event */document.dispatchEvent(new CustomEvent('cgz:openPremium'))}}
        title="Buy Premium"
        style={{ width:32,height:32,borderRadius:8,border:'1px solid rgba(245,158,11,0.3)',background:'rgba(245,158,11,0.08)',color:'#f59e0b',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0,transition:'all .15s' }}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(245,158,11,0.18)';e.currentTarget.style.borderColor='rgba(245,158,11,0.6)'}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(245,158,11,0.08)';e.currentTarget.style.borderColor='rgba(245,158,11,0.3)'}}>
        <i className="fa-solid fa-crown" />
      </button>

      <FBtn faIcon="fa-solid fa-users" active={showRight} onClick={()=>setRight(s=>!s)} title="Online Users" badge={notif?.online||0} tObj={tObj} />
    </div>
  )
}

export { ChatSettingsOverlay, AvatarDropdown, Footer }
export { UsernameStyleModal, TextStyleModal, BubbleModal, SoundsModal, ThemesModal, CustomCSSModal }
