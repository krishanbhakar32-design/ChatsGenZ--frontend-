// ============================================================
// ChatSettings.jsx — FIXED (white screen cause: missing imports)
// Added: FONT_LIST, SOLID_COLORS, BUB_GRADS, useNavigate
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API, R, GBR, STATUSES } from './chatConstants.js'
import { THEMES } from '../../components/StyleModal.jsx'
import { RIcon, HBtn, FBtn } from './ChatIcons.jsx'
import { Sounds } from '../../utils/sounds.js'

const SOLID_COLORS = [
  '#ff3333','#ff6633','#ff9933','#ffcc33','#cccc00','#99cc00','#59b300','#829356',
  '#008000','#00e639','#00e673','#00e6ac','#00cccc','#03add8','#3366ff','#107896',
  '#004d99','#6633ff','#9933ff','#cc33ff','#ff33ff','#ff33cc','#ff3399','#ff3366',
  '#604439','#795548','#a97f70','#bc9b8f','#9E9E9E','#879fab','#698796','#495f69',
]
const BUB_GRADS = [
  'linear-gradient(135deg,#ff0000,#ff6600)','linear-gradient(135deg,#ff6600,#ffcc00)',
  'linear-gradient(135deg,#ffcc00,#00cc00)','linear-gradient(135deg,#00cc00,#00ccff)',
  'linear-gradient(135deg,#00ccff,#0066ff)','linear-gradient(135deg,#0066ff,#9900ff)',
  'linear-gradient(135deg,#9900ff,#ff0099)','linear-gradient(135deg,#ff0099,#ff6600)',
  'linear-gradient(135deg,#e040fb,#3f51b5)','linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#f093fb,#f5576c)','linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#fa709a,#fee140)','linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)','linear-gradient(135deg,#ff9a9e,#fecfef)',
]
const BUB_NEONS = [
  {bg:'#111',shadow:'0 0 8px #ff3333',border:'#ff3333',color:'#ff3333'},
  {bg:'#111',shadow:'0 0 8px #ff6600',border:'#ff6600',color:'#ff6600'},
  {bg:'#111',shadow:'0 0 8px #ffcc00',border:'#ffcc00',color:'#ffcc00'},
  {bg:'#111',shadow:'0 0 8px #33ff00',border:'#33ff00',color:'#33ff00'},
  {bg:'#111',shadow:'0 0 8px #00ffcc',border:'#00ffcc',color:'#00ffcc'},
  {bg:'#111',shadow:'0 0 8px #00ccff',border:'#00ccff',color:'#00ccff'},
  {bg:'#111',shadow:'0 0 8px #9900ff',border:'#9900ff',color:'#9900ff'},
  {bg:'#111',shadow:'0 0 8px #ff00cc',border:'#ff00cc',color:'#ff00cc'},
]
const FONT_LIST = [
  {id:'font1', name:"Kalam",         f:"'Kalam',cursive"},
  {id:'font2', name:"Signika",        f:"'Signika',sans-serif"},
  {id:'font3', name:"Grandstander",   f:"'Grandstander',cursive"},
  {id:'font4', name:"Comic Neue",     f:"'Comic Neue',cursive"},
  {id:'font5', name:"Quicksand",      f:"'Quicksand',sans-serif"},
  {id:'font6', name:"Orbitron",       f:"'Orbitron',sans-serif"},
  {id:'font7', name:"Lemonada",       f:"'Lemonada',cursive"},
  {id:'font8', name:"Merienda",       f:"'Merienda',cursive"},
  {id:'font9', name:"Comfortaa",      f:"'Comfortaa',cursive"},
  {id:'font10',name:"Pacifico",       f:"'Pacifico',cursive"},
  {id:'font11',name:"Dancing Script", f:"'Dancing Script',cursive"},
  {id:'font12',name:"Lobster Two",    f:"'Lobster Two',cursive"},
  {id:'font13',name:"Caveat",         f:"'Caveat',cursive"},
  {id:'font14',name:"Satisfy",        f:"'Satisfy',cursive"},
  {id:'font15',name:"Indie Flower",   f:"'Indie Flower',cursive"},
  {id:'font16',name:"Rajdhani",       f:"'Rajdhani',sans-serif"},
  {id:'font17',name:"Exo 2",          f:"'Exo 2',sans-serif"},
  {id:'font18',name:"Josefin Sans",   f:"'Josefin Sans',sans-serif"},
  {id:'font19',name:"Audiowide",      f:"'Audiowide',sans-serif"},
  {id:'font20',name:"Righteous",      f:"'Righteous',cursive"},
  {id:'font21',name:"Fredoka One",    f:"'Fredoka One',cursive"},
  {id:'font22',name:"Nunito",         f:"'Nunito',sans-serif"},
  {id:'font23',name:"Turret Road",    f:"'Turret Road',cursive"},
  {id:'font24',name:"Sansita",        f:"'Sansita',sans-serif"},
]
const SOUND_KEYS = [
  {key:'newMessage',label:'New Message',    icon:'/default_images/icons/comment.svg'},
  {key:'join',      label:'User Joined',    icon:'/default_images/icons/active.svg'},
  {key:'gift',      label:'Gift Received',  icon:'/default_images/icons/gift.svg'},
  {key:'levelUp',   label:'Level Up',       icon:'/default_images/icons/level.svg'},
  {key:'mention',   label:'Mention',        icon:'/default_images/icons/note.svg'},
  {key:'privateMsg',label:'Private Message',icon:'/default_images/icons/comment.svg'},
  {key:'badge',     label:'Badge Earned',   icon:'/default_images/icons/badge.svg'},
]
function getSoundPrefs(){try{return JSON.parse(localStorage.getItem('cgz_sounds')||'{}')}catch{return{}}}
function setSoundPref(k,v){const p=getSoundPrefs();p[k]=v;localStorage.setItem('cgz_sounds',JSON.stringify(p))}

const SW={width:26,height:26,borderRadius:5,cursor:'pointer',border:'2px solid transparent',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,margin:2,transition:'transform .1s'}

// ─────────────────────────────────────────────────────────────
// CHAT OPTIONS OVERLAY
// ─────────────────────────────────────────────────────────────
function ChatSettingsOverlay({me,onClose,onSaved}){
  const [tab,setTab]=useState('chatOptions')
  const [saving,setSaving]=useState(false)
  const [ok,setOk]=useState('')
  const [optOpen,setOptOpen]=useState(false)
  const [selTheme,setSelTheme]=useState(me?.chatTheme||'Dolphin')
  const [nameTab,setNameTab]=useState('solid')
  const [nameSel,setNameSel]=useState(me?.nameColor||'')
  const [nameFont,setNameFont]=useState(me?.nameFont||'')
  const [bubTab,setBubTab]=useState('solid')
  const [bubSel,setBubSel]=useState(me?.bubbleColor||'')
  const [bubFont,setBubFont]=useState(me?.msgFontStyle||'')
  const [bubStyle,setBubStyle]=useState(me?.bubbleStyle||'normal')
  const [msgColor,setMsgColor]=useState(me?.msgFontColor||'#ffffff')
  const [fontSize,setFontSize]=useState(me?.msgFontSize||14)
  const [soundPrefs,setSoundPrefs]=useState(getSoundPrefs)

  async function save(){
    setSaving(true);setOk('')
    const token=localStorage.getItem('cgz_token')
    let body={}
    if(tab==='chatOptions') body={chatTheme:selTheme}
    if(tab==='nameColor')   body={nameColor:nameSel,nameFont}
    if(tab==='textColor')   body={bubbleColor:bubSel,bubbleStyle:bubStyle,msgFontColor:msgColor,msgFontStyle:bubFont,msgFontSize:fontSize}
    if(tab==='sounds')      {setSaving(false);return}
    try{
      const r=await fetch(`${API}/api/users/me/style`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)})
      const d=await r.json()
      if(r.ok){setOk('Saved!');onSaved?.(d.user)}
    }catch{}
    setSaving(false)
    setTimeout(()=>setOk(''),2000)
  }

  const previewName=()=>{
    if(nameTab==='solid'&&nameSel)    return{color:SOLID_COLORS[parseInt(nameSel.replace('bcolor',''))-1]}
    if(nameTab==='gradient'&&nameSel) return{background:BUB_GRADS[parseInt(nameSel.replace('bgrad',''))-1],WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}
    return{color:'#111827'}
  }
  const previewBub=()=>{
    if(bubTab==='solid'&&bubSel)    return{background:SOLID_COLORS[parseInt(bubSel.replace('bubcolor',''))-1]}
    if(bubTab==='gradient'&&bubSel) return{background:BUB_GRADS[parseInt(bubSel.replace('bubgrad',''))-1]}
    if(bubTab==='neon'&&bubSel){const n=BUB_NEONS[parseInt(bubSel.replace('bubneon',''))-1];return n?{background:n.bg,boxShadow:n.shadow,border:`1px solid ${n.border}`,color:n.color}:{}}
    return{background:'#374151'}
  }

  const TABS=[
    {id:'chatOptions',icon:'fi-sr-settings-sliders',label:'Chat Options'},
    {id:'nameColor',  icon:'fi-sr-brush',           label:'Username'},
    {id:'textColor',  icon:'fi-sr-comment-alt',     label:'Text Color'},
    {id:'sounds',     icon:'fi-sr-volume',          label:'Sounds'},
  ]
  const OPT_BTNS=[
    {id:'chatOptions',label:'Chat Options',icon:'fi-sr-settings-sliders'},
    {id:'nameColor',  label:'Username Color',icon:'fi-sr-brush'},
    {id:'textColor',  label:'Text Color',icon:'fi-sr-text'},
    {id:'sounds',     label:'Sounds',icon:'fi-sr-volume'},
  ]

  return(
    <div onClick={e=>e.stopPropagation()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',backdropFilter:'blur(3px)',zIndex:1200,display:'flex',alignItems:'center',justifyContent:'center',padding:'12px'}}>
      <div style={{background:'#fff',borderRadius:16,width:'min(480px,100%)',maxHeight:'88vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,.35)',overflow:'hidden'}}>

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#1a1f2e,#2d3555)',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="fi fi-sr-settings" style={{fontSize:16,color:'#fff'}}/>
            </div>
            <div>
              <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.95rem',color:'#fff'}}>Chat Options</div>
              <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,.5)'}}>Customize your chat</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.1)',border:'none',borderRadius:8,width:30,height:30,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14}}>
            <i className="fi fi-sr-cross-small"/>
          </button>
        </div>

        {/* Tab bar */}
        <div style={{display:'flex',borderBottom:'2px solid #f3f4f6',background:'#fafafa',flexShrink:0,overflowX:'auto'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setOk('')}}
              style={{flex:'1 1 auto',minWidth:70,padding:'10px 6px',border:'none',background:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,borderBottom:`2px solid ${tab===t.id?'#1a73e8':'transparent'}`,marginBottom:-2,color:tab===t.id?'#1a73e8':'#6b7280',transition:'all .15s'}}>
              <i className={`fi ${t.icon}`} style={{fontSize:15}}/>
              <span style={{fontSize:'0.58rem',fontWeight:700,whiteSpace:'nowrap'}}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'14px'}}>
          {ok&&<div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'7px 12px',fontSize:'0.78rem',color:'#15803d',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><i className="fi fi-sr-check-circle" style={{fontSize:14}}/> {ok}</div>}

          {/* Chat Options tab */}
          {tab==='chatOptions'&&(
            <>
              <button onClick={()=>setOptOpen(p=>!p)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:optOpen?'10px 10px 0 0':10,cursor:'pointer',marginBottom:0,transition:'all .15s'}}>
                <div style={{display:'flex',alignItems:'center',gap:9}}>
                  <i className="fi fi-sr-settings-sliders" style={{color:'#1a73e8',fontSize:15}}/>
                  <span style={{fontWeight:700,fontSize:'0.85rem',color:'#111827'}}>Chat Options</span>
                </div>
                <i className={`fi fi-sr-angle-${optOpen?'down':'right'}`} style={{color:'#9ca3af',fontSize:13}}/>
              </button>
              {optOpen&&(
                <div style={{background:'#f9fafb',border:'1.5px solid #e4e6ea',borderTop:'none',borderRadius:'0 0 10px 10px',marginBottom:12,overflow:'hidden'}}>
                  {OPT_BTNS.map(b=>(
                    <button key={b.id} onClick={()=>setTab(b.id)}
                      style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'none',border:'none',borderBottom:'1px solid #e4e6ea',cursor:'pointer',textAlign:'left'}}>
                      <i className={`fi ${b.icon}`} style={{fontSize:14,color:'#6b7280',width:18,textAlign:'center'}}/>
                      <span style={{fontSize:'0.83rem',fontWeight:600,color:'#374151'}}>{b.label}</span>
                      <i className="fi fi-sr-angle-right" style={{marginLeft:'auto',color:'#d1d5db',fontSize:11}}/>
                    </button>
                  ))}
                </div>
              )}
              <div style={{fontSize:'0.7rem',fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:.5,marginBottom:10,marginTop:optOpen?0:12}}>Select Theme</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                {THEMES.map(t=>(
                  <div key={t.id} onClick={()=>setSelTheme(t.id)} style={{borderRadius:9,overflow:'hidden',border:`2px solid ${selTheme===t.id?'#1a73e8':'#e4e6ea'}`,cursor:'pointer',transform:selTheme===t.id?'scale(1.03)':'scale(1)',transition:'all .15s',boxShadow:selTheme===t.id?'0 0 0 3px rgba(26,115,232,.15)':'none'}}>
                    <div style={{background:t.bg_header,padding:'5px 8px',display:'flex',alignItems:'center',gap:4,minHeight:26}}>
                      {selTheme===t.id&&<i className="fi fi-sr-check-circle" style={{fontSize:8,color:t.accent||'#fff',flexShrink:0}}/>}
                      <span style={{fontSize:'0.65rem',fontWeight:800,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textShadow:'0 1px 3px rgba(0,0,0,.6)',flex:1}}>{t.name}</span>
                    </div>
                    <div style={{background:t.bg_image?`url(${t.bg_image})`:t.bg_chat,backgroundSize:'cover',backgroundPosition:'center',padding:'5px 8px',height:40,display:'flex',alignItems:'center',position:'relative'}}>
                      {t.bg_image&&<div style={{position:'absolute',inset:0,background:t.bg_chat&&t.bg_chat!=='transparent'?t.bg_chat+'99':'rgba(0,0,0,.35)'}}/>}
                      <div style={{background:t.bg_log,borderRadius:4,padding:'2px 7px',display:'inline-block',position:'relative',zIndex:1,maxWidth:'90%'}}>
                        <span style={{fontSize:'0.6rem',color:t.text,fontWeight:600,whiteSpace:'nowrap'}}>Hello 👋</span>
                      </div>
                      <div style={{position:'absolute',right:6,bottom:5,width:14,height:14,borderRadius:'50%',background:t.accent,zIndex:1}}/>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Username Color tab */}
          {tab==='nameColor'&&(
            <>
              <div style={{textAlign:'center',marginBottom:12,padding:'12px',background:'#f9fafb',borderRadius:8,border:'1px solid #f3f4f6'}}>
                <div style={{fontSize:'0.62rem',color:'#9ca3af',fontWeight:600,marginBottom:4}}>Preview</div>
                <span style={{fontSize:17,fontWeight:800,fontFamily:FONT_LIST.find(f=>f.id===nameFont)?.f||'Outfit,sans-serif',...previewName()}}>{me?.username||'Your Name'}</span>
              </div>
              <div style={{display:'flex',gap:4,marginBottom:10}}>
                {['solid','gradient'].map(t=>(
                  <button key={t} onClick={()=>setNameTab(t)} style={{flex:1,padding:'5px',borderRadius:5,border:`1px solid ${nameTab===t?'#1a73e8':'#e4e6ea'}`,background:nameTab===t?'#eff6ff':'none',color:nameTab===t?'#1a73e8':'#9ca3af',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',textTransform:'capitalize'}}>{t}</button>
                ))}
              </div>
              {nameTab==='solid'&&(
                <div style={{display:'flex',flexWrap:'wrap',marginBottom:12}}>
                  <div onClick={()=>setNameSel('')} style={{...SW,background:'#f3f4f6',border:`2px solid ${nameSel===''?'#1a73e8':'#e4e6ea'}`}}>
                    {nameSel===''&&<i className="fi fi-sr-check" style={{fontSize:9,color:'#1a73e8'}}/>}
                  </div>
                  {SOLID_COLORS.map((c,i)=>(
                    <div key={i} onClick={()=>setNameSel(`bcolor${i+1}`)} style={{...SW,background:c,border:`2px solid ${nameSel===`bcolor${i+1}`?'#fff':'transparent'}`,transform:nameSel===`bcolor${i+1}`?'scale(1.25)':'scale(1)'}}>
                      {nameSel===`bcolor${i+1}`&&<i className="fi fi-sr-check" style={{fontSize:8,color:'#fff'}}/>}
                    </div>
                  ))}
                </div>
              )}
              {nameTab==='gradient'&&(
                <div style={{display:'flex',flexWrap:'wrap',marginBottom:12}}>
                  {BUB_GRADS.map((g,i)=>(
                    <div key={i} onClick={()=>setNameSel(`bgrad${i+1}`)} style={{...SW,background:g,border:`2px solid ${nameSel===`bgrad${i+1}`?'#fff':'transparent'}`,transform:nameSel===`bgrad${i+1}`?'scale(1.25)':'scale(1)'}}>
                      {nameSel===`bgrad${i+1}`&&<i className="fi fi-sr-check" style={{fontSize:8,color:'#fff'}}/>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{fontSize:'0.7rem',fontWeight:700,color:'#9ca3af',marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Username Font</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                <div onClick={()=>setNameFont('')} style={{padding:'6px 7px',borderRadius:5,border:`1.5px solid ${nameFont===''?'#1a73e8':'#e4e6ea'}`,background:nameFont===''?'#eff6ff':'#f9fafb',cursor:'pointer',fontSize:'0.72rem',textAlign:'center',color:nameFont===''?'#1a73e8':'#374151',fontWeight:600}}>Default</div>
                {FONT_LIST.map(f=>(
                  <div key={f.id} onClick={()=>setNameFont(f.id)} style={{padding:'6px 7px',borderRadius:5,border:`1.5px solid ${nameFont===f.id?'#1a73e8':'#e4e6ea'}`,background:nameFont===f.id?'#eff6ff':'#f9fafb',cursor:'pointer',fontSize:'0.73rem',textAlign:'center',fontFamily:f.f,color:nameFont===f.id?'#1a73e8':'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {f.name}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Text Color tab */}
          {tab==='textColor'&&(
            <>
              <div style={{marginBottom:12,padding:'10px',background:'#1a1a2e',borderRadius:8}}>
                <div style={{fontSize:'0.62rem',color:'#9ca3af',marginBottom:6,fontWeight:600}}>Preview</div>
                <div style={{display:'inline-block',padding:'7px 12px',borderRadius:'3px 10px 10px 10px',
                  fontSize:`${Math.max(14,Math.min(28,fontSize))}px`,
                  fontWeight:bubStyle.includes('bold')?700:400,
                  fontStyle:bubStyle.includes('italic')?'italic':'normal',
                  fontFamily:FONT_LIST.find(f=>f.id===bubFont)?.f||'inherit',
                  color:msgColor||'#fff',...previewBub()}}>
                  Hey there! 👋 How are you?
                </div>
              </div>
              <div style={{display:'flex',gap:4,marginBottom:10}}>
                {['solid','gradient','neon'].map(t=>(
                  <button key={t} onClick={()=>setBubTab(t)} style={{flex:1,padding:'5px',borderRadius:5,border:`1px solid ${bubTab===t?'#1a73e8':'#e4e6ea'}`,background:bubTab===t?'#eff6ff':'none',color:bubTab===t?'#1a73e8':'#9ca3af',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',textTransform:'capitalize'}}>{t}</button>
                ))}
              </div>
              {bubTab==='solid'&&(
                <div style={{display:'flex',flexWrap:'wrap',marginBottom:10}}>
                  <div onClick={()=>setBubSel('')} style={{...SW,background:'#f3f4f6',border:`2px solid ${bubSel===''?'#1a73e8':'#e4e6ea'}`}}>
                    {bubSel===''&&<span style={{fontSize:8,color:'#6b7280',fontWeight:700}}>def</span>}
                  </div>
                  {SOLID_COLORS.map((c,i)=>(
                    <div key={i} onClick={()=>setBubSel(`bubcolor${i+1}`)} style={{...SW,background:c,border:`2px solid ${bubSel===`bubcolor${i+1}`?'#fff':'transparent'}`,transform:bubSel===`bubcolor${i+1}`?'scale(1.25)':'scale(1)'}}>
                      {bubSel===`bubcolor${i+1}`&&<i className="fi fi-sr-check" style={{fontSize:8,color:'#fff'}}/>}
                    </div>
                  ))}
                </div>
              )}
              {bubTab==='gradient'&&(
                <div style={{display:'flex',flexWrap:'wrap',marginBottom:10}}>
                  {BUB_GRADS.map((g,i)=>(
                    <div key={i} onClick={()=>setBubSel(`bubgrad${i+1}`)} style={{...SW,background:g,border:`2px solid ${bubSel===`bubgrad${i+1}`?'#fff':'transparent'}`,transform:bubSel===`bubgrad${i+1}`?'scale(1.25)':'scale(1)'}}>
                      {bubSel===`bubgrad${i+1}`&&<i className="fi fi-sr-check" style={{fontSize:8,color:'#fff'}}/>}
                    </div>
                  ))}
                </div>
              )}
              {bubTab==='neon'&&(
                <div style={{display:'flex',flexWrap:'wrap',marginBottom:10,background:'#111',padding:8,borderRadius:8}}>
                  {BUB_NEONS.map((n,i)=>(
                    <div key={i} onClick={()=>setBubSel(`bubneon${i+1}`)} style={{...SW,background:n.bg,boxShadow:bubSel===`bubneon${i+1}`?n.shadow:'none',border:`2px solid ${bubSel===`bubneon${i+1}`?n.border:'#333'}`,transform:bubSel===`bubneon${i+1}`?'scale(1.25)':'scale(1)'}}>
                      <span style={{width:10,height:10,borderRadius:'50%',background:n.border,display:'block'}}/>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                <div>
                  <div style={{fontSize:'0.68rem',fontWeight:700,color:'#9ca3af',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Text Color</div>
                  <input type="color" value={msgColor} onChange={e=>setMsgColor(e.target.value)} style={{width:'100%',height:32,borderRadius:6,border:'1.5px solid #e4e6ea',cursor:'pointer',padding:2}}/>
                </div>
                <div>
                  <div style={{fontSize:'0.68rem',fontWeight:700,color:'#9ca3af',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Style</div>
                  <select value={bubStyle} onChange={e=>setBubStyle(e.target.value)} style={{width:'100%',padding:'6px 8px',border:'1.5px solid #e4e6ea',borderRadius:6,fontSize:'0.78rem',background:'#f9fafb',outline:'none',cursor:'pointer'}}>
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="italic">Italic</option>
                    <option value="bold italic">Bold Italic</option>
                  </select>
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                  <div style={{fontSize:'0.68rem',fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:.5}}>Font Size</div>
                  <span style={{fontSize:'0.75rem',fontWeight:700,color:'#1a73e8'}}>{fontSize}px</span>
                </div>
                <input type="range" min={14} max={28} step={1} value={fontSize} onChange={e=>setFontSize(+e.target.value)} style={{width:'100%',accentColor:'#1a73e8'}}/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.62rem',color:'#9ca3af',marginTop:2}}><span>14px</span><span>28px</span></div>
              </div>
              <div style={{fontSize:'0.68rem',fontWeight:700,color:'#9ca3af',marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Message Font</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                <div onClick={()=>setBubFont('')} style={{padding:'6px 7px',borderRadius:5,border:`1.5px solid ${bubFont===''?'#1a73e8':'#e4e6ea'}`,background:bubFont===''?'#eff6ff':'#f9fafb',cursor:'pointer',fontSize:'0.72rem',textAlign:'center',color:bubFont===''?'#1a73e8':'#374151',fontWeight:600}}>Default</div>
                {FONT_LIST.map(f=>(
                  <div key={f.id} onClick={()=>setBubFont(f.id)} style={{padding:'6px 7px',borderRadius:5,border:`1.5px solid ${bubFont===f.id?'#1a73e8':'#e4e6ea'}`,background:bubFont===f.id?'#eff6ff':'#f9fafb',cursor:'pointer',fontSize:'0.73rem',textAlign:'center',fontFamily:f.f,color:bubFont===f.id?'#1a73e8':'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {f.name}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Sounds tab */}
          {tab==='sounds'&&(
            <>
              <div style={{fontSize:'0.7rem',fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:.5,marginBottom:12}}>Sound Notifications</div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {SOUND_KEYS.map(s=>{
                  const on=soundPrefs[s.key]!==false
                  return(
                    <div key={s.key} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:'#f9fafb',border:'1.5px solid #e4e6ea',borderRadius:10}}>
                      <img src={s.icon} alt="" style={{width:20,height:20,objectFit:'contain',opacity:.7,flexShrink:0}} onError={e=>e.target.style.display='none'}/>
                      <span style={{flex:1,fontSize:'0.82rem',fontWeight:600,color:'#374151'}}>{s.label}</span>
                      <div onClick={()=>{setSoundPref(s.key,!on);setSoundPrefs(getSoundPrefs())}}
                        style={{width:44,height:24,borderRadius:12,background:on?'#1a73e8':'#d1d5db',cursor:'pointer',position:'relative',transition:'background .2s',flexShrink:0}}>
                        <div style={{position:'absolute',top:3,left:on?22:3,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{marginTop:10,fontSize:'0.7rem',color:'#9ca3af',textAlign:'center'}}>Saved locally on your device.</div>
            </>
          )}
        </div>

        {/* Footer */}
        {tab!=='sounds'&&(
          <div style={{borderTop:'1px solid #f3f4f6',padding:'12px 14px',display:'flex',gap:8,flexShrink:0,background:'#fafafa'}}>
            <button onClick={onClose} style={{flex:1,padding:'9px',borderRadius:8,border:'1.5px solid #e4e6ea',background:'#fff',color:'#6b7280',cursor:'pointer',fontSize:'0.82rem',fontWeight:600}}>Cancel</button>
            <button onClick={save} disabled={saving} style={{flex:2,padding:'9px',borderRadius:8,border:'none',background:saving?'#9ca3af':'linear-gradient(135deg,#1a73e8,#0d5bcd)',color:'#fff',cursor:saving?'not-allowed':'pointer',fontSize:'0.82rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <i className={saving?'fi fi-sr-spinner':'fi fi-sr-disk'} style={{fontSize:14}}/> {saving?'Saving…':'Apply'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// AVATAR DROPDOWN
// ─────────────────────────────────────────────────────────────
function AvatarDropdown({me,status,setStatus,onLeave,socket,onOpenSettings,onOpenProfile}){
  const [open,setOpen]=useState(false)
  const ref=useRef(null)
  const nav=useNavigate()

  useEffect(()=>{
    const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)}
    if(open) document.addEventListener('mousedown',fn)
    return()=>document.removeEventListener('mousedown',fn)
  },[open])

  const ri=R(me?.rank)
  const border=GBR(me?.gender,me?.rank)
  const curSt=STATUSES.find(s=>s.id===status)||STATUSES[0]
  const isStaffRole=['moderator','admin','superadmin','owner'].includes(me?.rank)

  return(
    <div ref={ref} style={{position:'relative',flexShrink:0}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 3px',display:'flex',alignItems:'center'}}>
        <div style={{position:'relative'}}>
          <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
            style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',border:`2px solid ${border}`,display:'block'}}
            onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
          <span style={{position:'absolute',bottom:0,right:0,width:7,height:7,background:curSt.color,borderRadius:'50%',border:'1.5px solid #fff'}}/>
        </div>
      </button>
      {open&&(
        <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#1a1f2e',border:'1px solid #2d3555',borderRadius:12,minWidth:240,boxShadow:'0 8px 32px rgba(0,0,0,.5)',zIndex:999,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
          {/* Profile header */}
          <div style={{padding:'14px 14px 12px',borderBottom:'1px solid #2d3555',display:'flex',alignItems:'center',gap:12,position:'relative'}}>
            <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
              style={{width:52,height:52,borderRadius:'50%',objectFit:'cover',border:`2.5px solid ${border}`,flexShrink:0}}
              onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                <RIcon rank={me?.rank} size={12}/>
                <span style={{fontSize:'0.65rem',fontWeight:700,color:ri.color}}>{ri.label}</span>
              </div>
              <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.95rem',color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{me?.username}</div>
              <div style={{fontSize:'0.68rem',color:'rgba(255,255,255,.4)',marginTop:2}}>{curSt.label}</div>
            </div>
            <div style={{position:'absolute',top:10,right:10,width:30,height:30,borderRadius:'50%',background:'#2d3555',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <RIcon rank={me?.rank} size={18}/>
            </div>
          </div>

          {/* Wallet + Level/XP row */}
          {!me?.isGuest&&(
            <div style={{display:'flex',gap:6,padding:'8px 12px',borderBottom:'1px solid #2d3555'}}>
              <div style={{flex:1,background:'#111827',borderRadius:8,padding:'6px 10px',display:'flex',alignItems:'center',gap:6}}>
                <img src="/default_images/icons/gold.svg" alt="" style={{width:18,height:18,objectFit:'contain',flexShrink:0}} onError={e=>{e.target.outerHTML="<span style='font-size:16px'>🪙</span>"}}/>
                <div>
                  <div style={{fontSize:'0.52rem',color:'#9ca3af',fontWeight:700,textTransform:'uppercase',letterSpacing:.3}}>Wallet</div>
                  <div style={{fontSize:'0.8rem',fontWeight:800,color:'#fbbf24'}}>{me?.gold||0} Gold</div>
                </div>
              </div>
              <div style={{flex:1,background:'#111827',borderRadius:8,padding:'6px 10px',display:'flex',alignItems:'center',gap:6}}>
                <div style={{display:'flex',flexDirection:'column',gap:2,alignItems:'center',flexShrink:0}}>
                  <img src="/default_images/icons/level.svg" alt="" style={{width:14,height:14,objectFit:'contain'}} onError={e=>{e.target.outerHTML="<span style='font-size:12px'>🏆</span>"}}/>
                  <img src="/default_images/icons/xp.svg" alt="" style={{width:13,height:13,objectFit:'contain'}} onError={e=>{e.target.outerHTML="<span style='font-size:11px'>⭐</span>"}}/>
                </div>
                <div>
                  <div style={{fontSize:'0.52rem',color:'#9ca3af',fontWeight:700,textTransform:'uppercase',letterSpacing:.3}}>Level {me?.level||1}</div>
                  <div style={{fontSize:'0.8rem',fontWeight:800,color:'#a78bfa'}}>{me?.xp||0} XP</div>
                </div>
              </div>
            </div>
          )}

          {/* Menu */}
          <div>
            {[
              {icon:'fi-sr-user',            label:'My Profile',   color:'#a78bfa',fn:()=>{onOpenProfile?.();setOpen(false)}},
              {icon:'fi-sr-settings-sliders', label:'Chat Options', chevron:true, color:'#60a5fa',fn:()=>{onOpenSettings?.();setOpen(false)}},
              ...(isStaffRole?[{icon:'fi-sr-dashboard',label:'Admin Panel',color:'#f59e0b',fn:()=>{window.location.href='/admin'}}]:[]),
            ].map(item=>(
              <button key={item.label} onClick={item.fn}
                style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 14px',background:'none',border:'none',borderBottom:'1px solid #2d3555',cursor:'pointer',textAlign:'left',transition:'background .12s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#2d3555'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <i className={`fi ${item.icon}`} style={{fontSize:14,color:item.color,width:18,textAlign:'center',flexShrink:0}}/>
                <span style={{fontSize:'0.84rem',fontWeight:600,color:'#e2e8f0',flex:1}}>{item.label}</span>
                {item.chevron&&<i className="fi fi-sr-angle-right" style={{fontSize:11,color:'#6b7280',flexShrink:0}}/>}
              </button>
            ))}
          </div>

          {/* Status */}
          <div style={{padding:'8px 10px',borderTop:'1px solid #2d3555',borderBottom:'1px solid #2d3555',display:'flex',gap:5,flexWrap:'wrap'}}>
            {STATUSES.map(s=>(
              <button key={s.id} onClick={()=>{setStatus(s.id);socket?.emit('updateStatus',{status:s.id});setOpen(false)}}
                style={{flex:'1 1 auto',minWidth:60,padding:'5px 8px',borderRadius:6,border:`1.5px solid ${status===s.id?s.color:'#2d3555'}`,background:status===s.id?s.color+'22':'none',cursor:'pointer',display:'flex',alignItems:'center',gap:5,justifyContent:'center'}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:s.color,display:'inline-block',flexShrink:0}}/>
                <span style={{fontSize:'0.65rem',fontWeight:700,color:status===s.id?s.color:'#9ca3af'}}>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Leave + Logout */}
          <div>
            <button onClick={()=>{onLeave();setOpen(false)}}
              style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 14px',background:'none',border:'none',borderBottom:'1px solid #2d3555',cursor:'pointer',textAlign:'left'}}
              onMouseEnter={e=>e.currentTarget.style.background='#2d3555'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
              <i className="fi fi-sr-sign-out-alt" style={{fontSize:14,color:'#60a5fa',width:18,textAlign:'center'}}/>
              <span style={{fontSize:'0.84rem',fontWeight:600,color:'#e2e8f0'}}>Leave Room</span>
            </button>
            <button onClick={()=>{const t=localStorage.getItem('cgz_token');if(t)fetch(`${API}/api/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${t}`}}).catch(()=>{});localStorage.removeItem('cgz_token');nav('/login')}}
              style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,.12)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
              <i className="fi fi-sr-user-logout" style={{fontSize:14,color:'#f87171',width:18,textAlign:'center'}}/>
              <span style={{fontSize:'0.84rem',fontWeight:600,color:'#f87171'}}>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────
function Footer({showRadio,setShowRadio,showRight,setRight,notif}){
  return(
    <div style={{background:'#fff',borderTop:'1px solid #e4e6ea',padding:'4px 10px',display:'flex',alignItems:'center',gap:4,flexShrink:0,position:'relative'}}>
      <FBtn icon="fi-sr-radio" active={showRadio} onClick={()=>setShowRadio(s=>!s)} title="Radio"/>
      <div style={{flex:1}}/>
      <FBtn icon="fi-sr-list" active={showRight} onClick={()=>setRight(s=>!s)} title="User List" badge={notif.friends}/>
    </div>
  )
}

export {ChatSettingsOverlay, AvatarDropdown, Footer}
