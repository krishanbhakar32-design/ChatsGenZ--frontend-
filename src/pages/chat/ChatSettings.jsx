// ============================================================
// ChatSettings.jsx — ChatsGenZ v2 — Redesigned AvatarDropdown
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { useNavigate }                  from 'react-router-dom'
import { API, R, GBR, RANKS, RL }      from './chatConstants.js'
import { THEMES }                       from '../../components/StyleModal.jsx'
import { FBtn }                         from './ChatIcons.jsx'
import { Sounds }                       from '../../utils/sounds.js'

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
  {id:'',      name:'Default',        f:"'Nunito',sans-serif"},
  {id:'font1', name:'Kalam',          f:"'Kalam',cursive"},
  {id:'font2', name:'Signika',        f:"'Signika',sans-serif"},
  {id:'font3', name:'Grandstander',   f:"'Grandstander',cursive"},
  {id:'font4', name:'Comic Neue',     f:"'Comic Neue',cursive"},
  {id:'font5', name:'Quicksand',      f:"'Quicksand',sans-serif"},
  {id:'font6', name:'Orbitron',       f:"'Orbitron',sans-serif"},
  {id:'font7', name:'Lemonada',       f:"'Lemonada',cursive"},
  {id:'font8', name:'Merienda',       f:"'Merienda',cursive"},
  {id:'font9', name:'Comfortaa',      f:"'Comfortaa',cursive"},
  {id:'font10',name:'Pacifico',       f:"'Pacifico',cursive"},
  {id:'font11',name:'Dancing Script', f:"'Dancing Script',cursive"},
  {id:'font12',name:'Lobster Two',    f:"'Lobster Two',cursive"},
  {id:'font13',name:'Caveat',         f:"'Caveat',cursive"},
  {id:'font14',name:'Satisfy',        f:"'Satisfy',cursive"},
  {id:'font22',name:'Nunito',         f:"'Nunito',sans-serif"},
  {id:'font16',name:'Rajdhani',       f:"'Rajdhani',sans-serif"},
  {id:'font19',name:'Audiowide',      f:"'Audiowide',sans-serif"},
]
const SOUND_KEYS = [
  {key:'newMessage',label:'New Message',     icon:'fa-solid fa-comment'},
  {key:'join',      label:'User Joined',     icon:'fa-solid fa-right-to-bracket'},
  {key:'leave',     label:'User Left',       icon:'fa-solid fa-right-from-bracket'},
  {key:'gift',      label:'Gift Received',   icon:'fa-solid fa-gift'},
  {key:'levelUp',   label:'Level Up',        icon:'fa-solid fa-star'},
  {key:'mention',   label:'Mention',         icon:'fa-solid fa-at'},
  {key:'privateMsg',label:'Private Message', icon:'fa-solid fa-envelope'},
  {key:'badge',     label:'Badge Earned',    icon:'fa-solid fa-certificate'},
  {key:'whisper',   label:'Whisper',         icon:'fa-solid fa-hand-lizard'},
]
const STATUS_COLOR = { online:'#22c55e', away:'#f59e0b', busy:'#ef4444', invisible:'#9ca3af' }
const STATUS_OPTS  = [
  { id:'online',    label:'Online',    color:'#22c55e', icon:'fa-solid fa-circle' },
  { id:'away',      label:'Away',      color:'#f59e0b', icon:'fa-regular fa-clock' },
  { id:'busy',      label:'Busy',      color:'#ef4444', icon:'fa-solid fa-ban' },
  { id:'invisible', label:'Invisible', color:'#9ca3af', icon:'fa-solid fa-eye-slash' },
]

function getSoundPrefs(){try{return JSON.parse(localStorage.getItem('cgz_sounds')||'{}')}catch{return{}}}
function setSoundPref(k,v){const p=getSoundPrefs();p[k]=v;localStorage.setItem('cgz_sounds',JSON.stringify(p))}
function xpForLevel(lvl){return Math.floor(100*Math.pow(lvl,1.5))}

const SW={width:26,height:26,borderRadius:5,cursor:'pointer',border:'2px solid transparent',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,margin:2,transition:'transform .1s'}

// ── SaveBar ────────────────────────────────────────────────
function SaveBar({ok,saving,acc,onSave,onClose}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:8,paddingTop:4}}>
      {ok&&<span style={{fontSize:'0.78rem',color:'#74b20e',fontWeight:700}}>{ok}</span>}
      <div style={{flex:1}}/>
      <button onClick={onClose} style={{padding:'7px 16px',borderRadius:8,border:'none',cursor:'pointer',background:'rgba(255,255,255,0.08)',color:'#888',fontSize:'0.8rem',fontWeight:600}}>Cancel</button>
      <button onClick={onSave} disabled={saving} style={{padding:'7px 18px',borderRadius:8,border:'none',cursor:'pointer',background:acc,color:'#fff',fontSize:'0.8rem',fontWeight:700,opacity:saving?0.6:1}}>{saving?'Saving…':'Save'}</button>
    </div>
  )
}

// ══ WALLET MODAL ══════════════════════════════════════════════════════════
function WalletModal({me,tObj,onClose}){
  const [tab,setTab]=useState('gold')
  const acc=tObj?.accent||'#03add8'
  const bg=tObj?.bg_chat||'#151515'
  const hdr=tObj?.bg_header||'#111'
  const txt=tObj?.text||'#fff'
  const brd=tObj?.default_color||'#333'
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:hdr,border:`1px solid ${brd}44`,borderRadius:16,width:'min(360px,92vw)',boxShadow:'0 12px 48px rgba(0,0,0,0.7)',overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 16px',borderBottom:`1px solid ${brd}33`}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <i className="fa-solid fa-wallet" style={{color:acc,fontSize:16}}/>
            <span style={{fontWeight:700,fontSize:'0.95rem',color:txt}}>Wallet</span>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,color:'#888',cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}><i className="fa-solid fa-xmark"/></button>
        </div>
        <div style={{display:'flex',borderBottom:`1px solid ${brd}33`,background:bg}}>
          {[{id:'gold',label:'Gold Coins',icon:'fa-solid fa-coins',color:'#f59e0b'},{id:'ruby',label:'Rubies',icon:'fa-solid fa-gem',color:'#ef4444'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'11px 0',border:'none',cursor:'pointer',background:'none',color:tab===t.id?t.color:'#666',fontWeight:700,fontSize:'0.8rem',borderBottom:tab===t.id?`2px solid ${t.color}`:'2px solid transparent',transition:'color .15s,border-color .15s',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <i className={t.icon} style={{fontSize:20}}/>{t.label}
            </button>
          ))}
        </div>
        <div style={{padding:'24px 20px',textAlign:'center',background:bg}}>
          {tab==='gold'?(
            <>
              <div style={{fontSize:52,marginBottom:8}}>🪙</div>
              <div style={{fontSize:'2.2rem',fontWeight:900,color:'#f59e0b',letterSpacing:'-1px'}}>{(me?.gold||0).toLocaleString()}</div>
              <div style={{fontSize:'0.8rem',color:'#888',marginTop:4}}>Gold Coins</div>
              <div style={{marginTop:20,padding:'12px 16px',background:'rgba(245,158,11,0.08)',borderRadius:10,border:'1px solid rgba(245,158,11,0.2)'}}>
                <p style={{fontSize:'0.75rem',color:'#f59e0b',margin:0}}>Use gold to send gifts, play games, and unlock special features.</p>
              </div>
            </>
          ):(
            <>
              <div style={{fontSize:52,marginBottom:8}}>💎</div>
              <div style={{fontSize:'2.2rem',fontWeight:900,color:'#ef4444',letterSpacing:'-1px'}}>{(me?.ruby||0).toLocaleString()}</div>
              <div style={{fontSize:'0.8rem',color:'#888',marginTop:4}}>Rubies</div>
              <div style={{marginTop:20,padding:'12px 16px',background:'rgba(239,68,68,0.08)',borderRadius:10,border:'1px solid rgba(239,68,68,0.2)'}}>
                <p style={{fontSize:'0.75rem',color:'#ef4444',margin:0}}>Rubies are premium currency for exclusive items and VIP features.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ══ LEVEL PANEL ═══════════════════════════════════════════════════════════
function LevelPanel({me,tObj,onClose}){
  const acc=tObj?.accent||'#03add8'
  const bg=tObj?.bg_chat||'#151515'
  const hdr=tObj?.bg_header||'#111'
  const txt=tObj?.text||'#fff'
  const brd=tObj?.default_color||'#333'
  const xp=me?.xp||0
  const level=me?.level||1
  const xpNext=xpForLevel(level)
  const xpPrev=xpForLevel(level-1)||0
  const xpInLvl=xp-xpPrev
  const xpNeeded=xpNext-xpPrev
  const pct=Math.min(100,Math.round((xpInLvl/xpNeeded)*100))||0
  const weeklyXp=me?.weeklyXp??Math.floor(xp*0.04)
  const monthlyXp=me?.monthlyXp??Math.floor(xp*0.18)
  const ri=R(me?.rank)
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:hdr,border:`1px solid ${brd}44`,borderRadius:16,width:'min(360px,92vw)',boxShadow:'0 12px 48px rgba(0,0,0,0.7)',overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 16px',borderBottom:`1px solid ${brd}33`}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <i className="fa-solid fa-chart-line" style={{color:acc,fontSize:16}}/>
            <span style={{fontWeight:700,fontSize:'0.95rem',color:txt}}>Level & XP</span>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,color:'#888',cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}><i className="fa-solid fa-xmark"/></button>
        </div>
        <div style={{padding:'20px 18px',background:bg}}>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
            <div style={{width:60,height:60,borderRadius:'50%',background:`radial-gradient(circle at 35% 35%,${acc}44,${acc}11)`,border:`2px solid ${acc}66`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <span style={{fontSize:'1.6rem',fontWeight:900,color:acc}}>Lv</span>
            </div>
            <div>
              <div style={{fontSize:'2.4rem',fontWeight:900,color:txt,lineHeight:1}}>{level}</div>
              <div style={{fontSize:'0.75rem',color:'#888',marginTop:2,display:'flex',alignItems:'center',gap:5}}>
                <img src={`/icons/ranks/${ri.icon}`} alt="" style={{width:14,height:14,objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
                {ri.label}
              </div>
            </div>
            <div style={{marginLeft:'auto',textAlign:'right'}}>
              <div style={{fontSize:'0.72rem',color:'#888'}}>Total XP</div>
              <div style={{fontSize:'1.1rem',fontWeight:700,color:acc}}>{xp.toLocaleString()}</div>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
              <span style={{fontSize:'0.72rem',color:'#888'}}>Progress to Level {level+1}</span>
              <span style={{fontSize:'0.72rem',fontWeight:700,color:acc}}>{pct}%</span>
            </div>
            <div style={{height:8,borderRadius:99,background:'rgba(255,255,255,0.08)',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${pct}%`,borderRadius:99,background:`linear-gradient(90deg,${acc}99,${acc})`,transition:'width .5s ease'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
              <span style={{fontSize:'0.68rem',color:'#555'}}>{xpInLvl.toLocaleString()} XP</span>
              <span style={{fontSize:'0.68rem',color:'#555'}}>{xpNeeded.toLocaleString()} XP needed</span>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
            {[{label:'This Week',val:weeklyXp,icon:'fa-solid fa-calendar-week',color:'#818cf8'},{label:'This Month',val:monthlyXp,icon:'fa-solid fa-calendar-days',color:'#34d399'},{label:'All Time',val:xp,icon:'fa-solid fa-infinity',color:acc}].map(s=>(
              <div key={s.label} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 8px',textAlign:'center'}}>
                <i className={s.icon} style={{fontSize:16,color:s.color,marginBottom:5,display:'block'}}/>
                <div style={{fontSize:'1rem',fontWeight:800,color:s.color}}>{s.val.toLocaleString()}</div>
                <div style={{fontSize:'0.62rem',color:'#666',marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ══ CHAT OPTIONS SUBMENU ══════════════════════════════════════════════════
function ChatOptionsSubmenu({me,tObj,onClose,onSaved}){
  const [page,setPage]=useState('main')
  const acc=tObj?.accent||'#03add8'
  const bg=tObj?.bg_chat||'#151515'
  const hdr=tObj?.bg_header||'#111'
  const txt=tObj?.text||'#fff'
  const brd=tObj?.default_color||'#333'

  const [saving,setSaving]=useState(false)
  const [ok,setOk]=useState('')
  const [nameTab,setNameTab]=useState('solid')
  const [nameSel,setNameSel]=useState(me?.nameColor||'')
  const [nameFont,setNameFont]=useState(me?.nameFont||'')
  const [bubTab,setBubTab]=useState('solid')
  const [bubSel,setBubSel]=useState(me?.bubbleColor||'')
  const [bubFont,setBubFont]=useState(me?.msgFontStyle||'')
  const [bubStyle,setBubStyle]=useState(me?.bubbleStyle||'normal')
  const [msgColor,setMsgColor]=useState(me?.msgFontColor||'#ffffff')
  const [fontSize,setFontSize]=useState(me?.msgFontSize||14)
  const [selTheme,setSelTheme]=useState(me?.chatTheme||'Dark')
  const [themeLimit,setThemeLimit]=useState(-1)
  const [soundPrefs,setSoundPrefsState]=useState(getSoundPrefs)

  useEffect(()=>{
    fetch(`${API}/api/admin/themes-by-rank`)
      .then(r=>r.json())
      .then(d=>{const rank=me?.rank||'user';const limit=d?.themesByRank?.[rank];setThemeLimit(limit===undefined?0:limit)})
      .catch(()=>setThemeLimit(0))
  },[me?.rank])

  const canUseTheme=idx=>{
    if(themeLimit===-1)return true
    if(themeLimit===0) return false
    const free=THEMES.slice(0,themeLimit).map(t=>t.id)
    return free.includes(THEMES[idx]?.id)||THEMES[idx]?.id===me?.chatTheme
  }

  async function save(body){
    setSaving(true);setOk('')
    const token=localStorage.getItem('cgz_token')
    try{
      const r=await fetch(`${API}/api/users/me/style`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)})
      const d=await r.json()
      if(r.ok){setOk('Saved!');onSaved?.(d.user)}
    }catch{}
    setSaving(false)
    setTimeout(()=>setOk(''),2500)
  }

  const PAGE_TITLES={usernameStyle:'Username Style',textStyle:'Text Style',bubble:'Message Bubble',sounds:'Sounds',theme:'Theme'}
  const MAIN_ITEMS=[
    {id:'usernameStyle',label:'Username Style',icon:'fa-solid fa-signature',desc:'Name color & font'},
    {id:'textStyle',label:'Text Style',icon:'fa-solid fa-font',desc:'Message text color & size'},
    {id:'bubble',label:'Message Bubble',icon:'fa-solid fa-comment',desc:'Bubble color & style'},
    {id:'sounds',label:'Sounds',icon:'fa-solid fa-volume-high',desc:'Notification sounds'},
    {id:'theme',label:'Theme',icon:'fa-solid fa-palette',desc:'Chat room theme'},
  ]

  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:9997,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:hdr,border:`1px solid ${brd}44`,borderRadius:16,width:'min(400px,94vw)',maxHeight:'82vh',display:'flex',flexDirection:'column',boxShadow:'0 12px 48px rgba(0,0,0,0.7)',overflow:'hidden'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderBottom:`1px solid ${brd}33`,flexShrink:0}}>
          {page!=='main'&&(
            <button onClick={()=>setPage('main')} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,color:'#888',cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>
              <i className="fa-solid fa-chevron-left"/>
            </button>
          )}
          <span style={{fontWeight:700,fontSize:'0.93rem',color:txt,flex:1}}>{page==='main'?'Chat Options':PAGE_TITLES[page]}</span>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,color:'#888',cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>
            <i className="fa-solid fa-xmark"/>
          </button>
        </div>

        {/* MAIN */}
        {page==='main'&&(
          <div style={{overflowY:'auto',flex:1}}>
            {MAIN_ITEMS.map((item,i)=>(
              <button key={item.id} onClick={()=>setPage(item.id)}
                style={{display:'flex',alignItems:'center',gap:11,width:'100%',padding:'11px 16px',background:'none',border:'none',cursor:'pointer',textAlign:'left',borderTop:i>0?`1px solid ${brd}22`:'none',transition:'background .1s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}
              >
                <span style={{width:32,height:32,borderRadius:8,background:`${acc}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <i className={item.icon} style={{fontSize:14,color:acc}}/>
                </span>
                <div style={{flex:1}}>
                  <div style={{color:txt,fontWeight:700,fontSize:'0.83rem'}}>{item.label}</div>
                  <div style={{color:'#666',fontSize:'0.7rem',marginTop:1}}>{item.desc}</div>
                </div>
                <i className="fa-solid fa-chevron-right" style={{fontSize:11,color:'#555'}}/>
              </button>
            ))}
          </div>
        )}

        {/* USERNAME STYLE */}
        {page==='usernameStyle'&&(
          <div style={{flex:1,overflowY:'auto',padding:'14px 16px',background:bg}}>
            <p style={{fontSize:'0.72rem',color:'#666',marginBottom:8,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>Name Color</p>
            <div style={{display:'flex',gap:6,marginBottom:10}}>
              {['solid','gradient'].map(t=>(<button key={t} onClick={()=>setNameTab(t)} style={{padding:'4px 14px',borderRadius:20,border:'none',cursor:'pointer',fontSize:'0.73rem',fontWeight:700,background:nameTab===t?`${acc}33`:'rgba(255,255,255,0.06)',color:nameTab===t?acc:'#888'}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>))}
            </div>
            <div style={{display:'flex',flexWrap:'wrap',marginBottom:14}}>
              {nameTab==='solid'&&SOLID_COLORS.map((c,i)=>(<div key={i} onClick={()=>setNameSel(`bcolor${i+1}`)} style={{...SW,background:c,border:nameSel===`bcolor${i+1}`?'2px solid #fff':'2px solid transparent'}}>{nameSel===`bcolor${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:'#fff'}}/>}</div>))}
              {nameTab==='gradient'&&BUB_GRADS.map((g,i)=>(<div key={i} onClick={()=>setNameSel(`bgrad${i+1}`)} style={{...SW,background:g,border:nameSel===`bgrad${i+1}`?'2px solid #fff':'2px solid transparent'}}>{nameSel===`bgrad${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:'#fff'}}/>}</div>))}
            </div>
            <p style={{fontSize:'0.72rem',color:'#666',marginBottom:8,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>Name Font</p>
            <select value={nameFont} onChange={e=>setNameFont(e.target.value)} style={{width:'100%',padding:'8px 10px',background:hdr,border:`1px solid ${brd}44`,borderRadius:8,color:txt,fontSize:'0.82rem',marginBottom:16}}>
              {FONT_LIST.map(f=>(<option key={f.id} value={f.id}>{f.name}</option>))}
            </select>
            <SaveBar ok={ok} saving={saving} acc={acc} onSave={()=>save({nameColor:nameSel,nameFont})} onClose={onClose}/>
          </div>
        )}

        {/* TEXT STYLE */}
        {page==='textStyle'&&(
          <div style={{flex:1,overflowY:'auto',padding:'14px 16px',background:bg}}>
            <p style={{fontSize:'0.72rem',color:'#666',marginBottom:8,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>Message Font</p>
            <select value={bubFont} onChange={e=>setBubFont(e.target.value)} style={{width:'100%',padding:'8px 10px',background:hdr,border:`1px solid ${brd}44`,borderRadius:8,color:txt,fontSize:'0.82rem',marginBottom:14}}>
              {FONT_LIST.map(f=>(<option key={f.id} value={f.id}>{f.name}</option>))}
            </select>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <span style={{fontSize:'0.78rem',color:'#888',minWidth:90}}>Font size: {fontSize}px</span>
              <input type="range" min={11} max={22} value={fontSize} onChange={e=>setFontSize(+e.target.value)} style={{flex:1,accentColor:acc}}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <span style={{fontSize:'0.78rem',color:'#888'}}>Text color:</span>
              <input type="color" value={msgColor} onChange={e=>setMsgColor(e.target.value)} style={{width:40,height:30,border:'none',background:'none',cursor:'pointer'}}/>
              <span style={{fontSize:'0.73rem',color:'#555'}}>{msgColor}</span>
            </div>
            <SaveBar ok={ok} saving={saving} acc={acc} onSave={()=>save({msgFontStyle:bubFont,msgFontSize:fontSize,msgFontColor:msgColor})} onClose={onClose}/>
          </div>
        )}

        {/* BUBBLE */}
        {page==='bubble'&&(
          <div style={{flex:1,overflowY:'auto',padding:'14px 16px',background:bg}}>
            <div style={{display:'flex',gap:5,marginBottom:10,flexWrap:'wrap'}}>
              {['solid','gradient','neon','none'].map(t=>(<button key={t} onClick={()=>setBubTab(t)} style={{padding:'4px 12px',borderRadius:20,border:'none',cursor:'pointer',fontSize:'0.72rem',fontWeight:700,background:bubTab===t?`${acc}33`:'rgba(255,255,255,0.06)',color:bubTab===t?acc:'#888'}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>))}
            </div>
            <div style={{display:'flex',flexWrap:'wrap',marginBottom:14}}>
              {bubTab==='solid'&&SOLID_COLORS.map((c,i)=>(<div key={i} onClick={()=>setBubSel(`bubcolor${i+1}`)} style={{...SW,background:c,border:bubSel===`bubcolor${i+1}`?'2px solid #fff':'2px solid transparent'}}>{bubSel===`bubcolor${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:'#fff'}}/>}</div>))}
              {bubTab==='gradient'&&BUB_GRADS.map((g,i)=>(<div key={i} onClick={()=>setBubSel(`bubgrad${i+1}`)} style={{...SW,background:g,border:bubSel===`bubgrad${i+1}`?'2px solid #fff':'2px solid transparent'}}>{bubSel===`bubgrad${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:'#fff'}}/>}</div>))}
              {bubTab==='neon'&&BUB_NEONS.map((n,i)=>(<div key={i} onClick={()=>setBubSel(`bubneon${i+1}`)} style={{...SW,background:n.bg,boxShadow:n.shadow,border:bubSel===`bubneon${i+1}`?`2px solid ${n.border}`:'2px solid transparent'}}>{bubSel===`bubneon${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:n.color}}/>}</div>))}
              {bubTab==='none'&&(<button onClick={()=>setBubSel('')} style={{padding:'6px 16px',borderRadius:20,border:'none',cursor:'pointer',background:'rgba(255,255,255,0.08)',color:'#888',fontSize:'0.78rem'}}>Clear bubble color</button>)}
            </div>
            <SaveBar ok={ok} saving={saving} acc={acc} onSave={()=>save({bubbleColor:bubSel,bubbleStyle:bubStyle})} onClose={onClose}/>
          </div>
        )}

        {/* SOUNDS — fully working with test button */}
        {page==='sounds'&&(
          <div style={{flex:1,overflowY:'auto',padding:'14px 16px',background:bg}}>
            {SOUND_KEYS.map((sk,i)=>(
              <div key={sk.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:i<SOUND_KEYS.length-1?`1px solid ${brd}22`:'none'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{width:30,height:30,borderRadius:8,background:`${acc}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <i className={sk.icon} style={{fontSize:13,color:acc}}/>
                  </span>
                  <span style={{fontSize:'0.82rem',color:txt,fontWeight:600}}>{sk.label}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <button
                    disabled={soundPrefs[sk.key]===false}
                    onClick={()=>{if(soundPrefs[sk.key]!==false)Sounds[sk.key]?.()}}
                    title="Test"
                    style={{width:26,height:26,borderRadius:7,border:'none',cursor:soundPrefs[sk.key]!==false?'pointer':'not-allowed',background:'rgba(255,255,255,0.06)',color:soundPrefs[sk.key]!==false?acc:'#555',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0}}
                  >
                    <i className="fa-solid fa-play"/>
                  </button>
                  <button
                    onClick={()=>{const cur=soundPrefs[sk.key]!==false;setSoundPref(sk.key,!cur);setSoundPrefsState(p=>({...p,[sk.key]:!cur}))}}
                    style={{width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',background:soundPrefs[sk.key]!==false?acc:'#333',position:'relative',transition:'background .2s',flexShrink:0}}
                  >
                    <span style={{position:'absolute',top:3,left:soundPrefs[sk.key]!==false?'calc(100% - 19px)':'3px',width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                  </button>
                </div>
              </div>
            ))}
            <p style={{fontSize:'0.7rem',color:'#555',marginTop:12,textAlign:'center'}}>Changes save automatically.</p>
          </div>
        )}

        {/* THEME */}
        {page==='theme'&&(
          <div style={{flex:1,overflowY:'auto',padding:'14px 16px',background:bg}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
              {THEMES.map((th,idx)=>{
                const allowed=canUseTheme(idx)
                return(
                  <div key={th.id} onClick={()=>allowed&&setSelTheme(th.id)} style={{borderRadius:10,overflow:'hidden',cursor:allowed?'pointer':'not-allowed',border:selTheme===th.id?`2px solid ${acc}`:'2px solid rgba(255,255,255,0.08)',opacity:allowed?1:0.45,transition:'border-color .15s',position:'relative'}}>
                    <div style={{height:40,background:th.bg_header,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <div style={{width:20,height:20,borderRadius:'50%',background:th.bg_log,border:`2px solid ${th.accent}`}}/>
                    </div>
                    <div style={{background:'#111',padding:'4px 6px',textAlign:'center'}}>
                      <span style={{fontSize:'0.65rem',fontWeight:700,color:selTheme===th.id?acc:'#888'}}>{th.name}</span>
                    </div>
                    {!allowed&&<div style={{position:'absolute',top:3,right:3,background:'#f59e0b',borderRadius:4,padding:'1px 5px',fontSize:'0.58rem',fontWeight:700,color:'#000'}}>VIP</div>}
                  </div>
                )
              })}
            </div>
            <SaveBar ok={ok} saving={saving} acc={acc} onSave={()=>save({chatTheme:selTheme})} onClose={onClose}/>
          </div>
        )}

      </div>
    </div>
  )
}

// ══ MENU ROW ══════════════════════════════════════════════════════════════
function MenuRow({icon,iconColor,label,chevron,onClick,danger,acc,txt,brd}){
  const [hov,setHov]=useState(false)
  return(
    <button
      onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{display:'flex',alignItems:'center',gap:11,width:'100%',padding:'9px 14px',background:hov?'rgba(255,255,255,0.05)':'none',border:'none',cursor:'pointer',textAlign:'left',color:danger?'#ef4444':(txt||'#ddd'),fontSize:'0.82rem',fontWeight:600,transition:'background .1s'}}
    >
      <span style={{width:28,height:28,borderRadius:7,flexShrink:0,background:danger?'rgba(239,68,68,0.12)':`${iconColor||acc||'#03add8'}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <i className={icon} style={{fontSize:13,color:danger?'#ef4444':(iconColor||acc||'#03add8')}}/>
      </span>
      <span style={{flex:1}}>{label}</span>
      {chevron&&<i className="fa-solid fa-chevron-right" style={{fontSize:10,color:'#555'}}/>}
    </button>
  )
}

// ══ AVATAR DROPDOWN ═══════════════════════════════════════════════════════
function AvatarDropdown({me,status,setStatus,onLeave,socket,onOpenSettings,onOpenProfile,tObj,room}){
  const [open,setOpen]                   = useState(false)
  const [showWallet,setShowWallet]       = useState(false)
  const [showLevel,setShowLevel]         = useState(false)
  const [showChatOpts,setShowChatOpts]   = useState(false)
  const [showStatusMenu,setShowStatusMenu]= useState(false)
  const ref = useRef(null)
  const nav = useNavigate()

  const acc  = tObj?.accent        || '#03add8'
  const hdr  = tObj?.bg_header     || '#111111'
  const bg   = tObj?.bg_chat       || '#151515'
  const txt  = tObj?.text          || '#ffffff'
  const brd  = tObj?.default_color || '#333333'

  const ri      = R(me?.rank)
  const myLevel = RL(me?.rank)
  const isAdmin          = myLevel >= 12
  const isRoomOwnerOrMod = myLevel >= 11 || (room?.owner && String(room.owner)===String(me?._id))

  useEffect(()=>{
    function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false)}
    document.addEventListener('mousedown',h)
    return()=>document.removeEventListener('mousedown',h)
  },[])

  function logout(){localStorage.removeItem('cgz_token');nav('/login')}

  const Divider=()=><div style={{height:1,background:`${brd}33`,margin:'4px 0'}}/>

  return(
    <>
      {/* Trigger */}
      <div ref={ref} style={{position:'relative',flexShrink:0}}>
        <button onClick={e=>{e.stopPropagation();setOpen(p=>!p)}}
          style={{background:'none',border:'none',cursor:'pointer',padding:3,borderRadius:8,display:'flex',alignItems:'center',gap:5,position:'relative'}}
        >
          <div style={{position:'relative'}}>
            <img
              src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
              style={{width:30,height:30,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${GBR(me?.gender,me?.rank)}`,display:'block'}}
              onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
            />
            <span style={{position:'absolute',bottom:0,right:0,width:9,height:9,borderRadius:'50%',background:STATUS_COLOR[status]||'#22c55e',border:`1.5px solid ${hdr}`}}/>
          </div>
        </button>

        {/* Dropdown */}
        {open&&(
          <div onClick={e=>e.stopPropagation()} style={{
            position:'absolute',top:'calc(100% + 6px)',right:0,
            background:hdr,border:`1px solid ${brd}44`,
            borderRadius:14,minWidth:238,
            boxShadow:'0 10px 40px rgba(0,0,0,0.65)',
            zIndex:500,overflow:'hidden',
          }}>

            {/* ── TOP HEADER ROW ── */}
            <div style={{padding:'12px 14px 10px',borderBottom:`1px solid ${brd}33`,display:'flex',alignItems:'center',gap:10}}>
              {/* Avatar left */}
              <img
                src={me?.avatar||'/default_images/avatar/default_guest.png'} alt=""
                style={{width:42,height:42,borderRadius:'50%',objectFit:'cover',border:`2px solid ${GBR(me?.gender,me?.rank)}`,flexShrink:0}}
                onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}
              />
              {/* Username + Rank center */}
              <div style={{flex:1,minWidth:0}}>
                {/* Username row with rank icon (no bg) */}
                <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                  <span style={{fontSize:'0.88rem',fontWeight:800,color:txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:108}}>
                    {me?.username}
                  </span>
                  {/* Rank icon — transparent bg, no container */}
                  <img
                    src={`/icons/ranks/${ri.icon}`} alt={ri.label} title={ri.label}
                    style={{width:15,height:15,objectFit:'contain',flexShrink:0}}
                    onError={e=>e.target.style.display='none'}
                  />
                </div>
                {/* Rank label below */}
                <div style={{fontSize:'0.67rem',color:ri.color||'#888',fontWeight:700,letterSpacing:'0.03em'}}>{ri.label}</div>
              </div>
              {/* Status icon right — clickable */}
              <div style={{position:'relative',flexShrink:0}}>
                <button onClick={()=>setShowStatusMenu(p=>!p)} title={`Status: ${status}`}
                  style={{background:'rgba(255,255,255,0.06)',border:`1px solid ${brd}33`,borderRadius:8,cursor:'pointer',width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <img
                    src={`/default_images/status/${status||'online'}.svg`} alt={status}
                    style={{width:16,height:16,objectFit:'contain'}}
                    onError={e=>{e.target.style.display='none';const dot=document.createElement('span');dot.style.cssText=`width:10px;height:10px;border-radius:50%;background:${STATUS_COLOR[status]||'#22c55e'};display:inline-block`;e.target.parentNode.appendChild(dot)}}
                  />
                </button>
                {/* Status mini-menu */}
                {showStatusMenu&&(
                  <div style={{position:'absolute',top:'calc(100% + 4px)',right:0,background:bg,border:`1px solid ${brd}44`,borderRadius:10,padding:4,minWidth:134,boxShadow:'0 6px 20px rgba(0,0,0,0.5)',zIndex:10}}>
                    {STATUS_OPTS.map(s=>(
                      <button key={s.id} onClick={()=>{setStatus(s.id);socket?.emit('setStatus',{status:s.id});setShowStatusMenu(false)}}
                        style={{display:'flex',alignItems:'center',gap:7,width:'100%',padding:'7px 10px',borderRadius:7,border:'none',cursor:'pointer',background:status===s.id?`${acc}22`:'none',color:status===s.id?txt:'#888',fontSize:'0.77rem',fontWeight:status===s.id?700:500,transition:'background .1s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                        onMouseLeave={e=>e.currentTarget.style.background=status===s.id?`${acc}22`:'none'}
                      >
                        <img src={`/default_images/status/${s.id}.svg`} alt={s.label} style={{width:13,height:13,objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
                        {s.label}
                        {status===s.id&&<i className="fa-solid fa-check" style={{fontSize:9,color:acc,marginLeft:'auto'}}/>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── MENU ITEMS ── */}

            {/* Edit Profile */}
            <MenuRow icon="fa-regular fa-pen-to-square" label="Edit Profile"
              onClick={()=>{onOpenProfile?.();setOpen(false)}} acc={acc} txt={txt} brd={brd}/>

            {/* Wallet — shows balances inline */}
            <MenuRow
              icon="fa-solid fa-wallet" iconColor="#f59e0b"
              label={
                <span style={{display:'flex',alignItems:'center',gap:4,flex:1}}>
                  Wallet
                  <span style={{marginLeft:'auto',display:'flex',gap:6,fontSize:'0.7rem'}}>
                    <span style={{color:'#f59e0b',fontWeight:700}}>🪙 {(me?.gold||0).toLocaleString()}</span>
                    <span style={{color:'#ef4444',fontWeight:700}}>💎 {(me?.ruby||0).toLocaleString()}</span>
                  </span>
                </span>
              }
              onClick={()=>{setShowWallet(true);setOpen(false)}} acc={acc} txt={txt} brd={brd}
            />

            {/* Level */}
            <MenuRow
              icon="fa-solid fa-chart-line" iconColor="#818cf8"
              label={
                <span style={{display:'flex',alignItems:'center',gap:4,flex:1}}>
                  Level
                  <span style={{marginLeft:'auto',fontSize:'0.72rem',color:'#818cf8',fontWeight:800}}>Lv {me?.level||1}</span>
                </span>
              }
              onClick={()=>{setShowLevel(true);setOpen(false)}} acc={acc} txt={txt} brd={brd}
            />

            {/* Chat Options → chevron */}
            <MenuRow icon="fa-solid fa-sliders" label="Chat Options" chevron
              onClick={()=>{setShowChatOpts(true);setOpen(false)}} acc={acc} txt={txt} brd={brd}/>

            {/* Gap before admin section */}
            <div style={{height:8}}/>

            {/* Admin Panel — admin/superadmin/owner only → new tab */}
            {isAdmin&&(
              <MenuRow icon="fa-solid fa-gauge" iconColor="#FF4444" label="Admin Panel"
                onClick={()=>{window.open('/admin','_blank','noopener,noreferrer');setOpen(false)}} acc={acc} txt={txt} brd={brd}/>
            )}

            {/* Room Settings — room owner or moderator+ → chevron (coding later) */}
            {isRoomOwnerOrMod&&(
              <MenuRow icon="fa-solid fa-gear" iconColor="#f59e0b" label="Room Settings" chevron
                onClick={()=>{setOpen(false)/* room settings coming soon */}} acc={acc} txt={txt} brd={brd}/>
            )}

            <Divider/>

            {/* Leave Room */}
            <MenuRow icon="fa-solid fa-arrow-right-from-bracket" label="Leave Room" danger
              onClick={()=>{onLeave?.();setOpen(false)}} acc={acc} txt={txt} brd={brd}/>

            {/* Logout */}
            <MenuRow icon="fa-solid fa-power-off" label="Logout" danger
              onClick={()=>{setOpen(false);logout()}} acc={acc} txt={txt} brd={brd}/>

          </div>
        )}
      </div>

      {/* Modals */}
      {showWallet   && <WalletModal        me={me} tObj={tObj} onClose={()=>setShowWallet(false)}/>}
      {showLevel    && <LevelPanel         me={me} tObj={tObj} onClose={()=>setShowLevel(false)}/>}
      {showChatOpts && <ChatOptionsSubmenu me={me} tObj={tObj} onClose={()=>setShowChatOpts(false)} onSaved={()=>{}}/>}
    </>
  )
}

// ══ CHAT SETTINGS OVERLAY (kept for left sidebar) ═════════════════════════
function ChatSettingsOverlay({me,onClose,onSaved}){
  const [tab,setTab]=useState('chatOptions')
  const [saving,setSaving]=useState(false)
  const [ok,setOk]=useState('')
  const [selTheme,setSelTheme]=useState(me?.chatTheme||'Dark')
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
  const [themeLimit,setThemeLimit]=useState(-1)

  useEffect(()=>{
    fetch(`${API}/api/admin/themes-by-rank`)
      .then(r=>r.json())
      .then(d=>{const rank=me?.rank||'user';const limit=d?.themesByRank?.[rank];setThemeLimit(limit===undefined?0:limit)})
      .catch(()=>setThemeLimit(0))
  },[me?.rank])

  const canUseTheme=idx=>{
    if(themeLimit===-1)return true
    if(themeLimit===0)return false
    const free=THEMES.slice(0,themeLimit).map(t=>t.id)
    return free.includes(THEMES[idx]?.id)||THEMES[idx]?.id===me?.chatTheme
  }

  async function save(){
    setSaving(true);setOk('')
    const token=localStorage.getItem('cgz_token')
    let body={}
    if(tab==='chatOptions')body={chatTheme:selTheme}
    if(tab==='nameColor')  body={nameColor:nameSel,nameFont}
    if(tab==='textColor')  body={bubbleColor:bubSel,bubbleStyle:bubStyle,msgFontColor:msgColor,msgFontStyle:bubFont,msgFontSize:fontSize}
    if(tab==='sounds'){setSaving(false);return}
    try{
      const r=await fetch(`${API}/api/users/me/style`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)})
      const d=await r.json()
      if(r.ok){setOk('Saved!');onSaved?.(d.user)}
    }catch{}
    setSaving(false)
    setTimeout(()=>setOk(''),2000)
  }

  const STABS=[
    {id:'chatOptions',label:'Theme', icon:'fa-solid fa-palette'},
    {id:'nameColor',  label:'Name',  icon:'fa-solid fa-signature'},
    {id:'textColor',  label:'Bubble',icon:'fa-solid fa-message'},
    {id:'sounds',     label:'Sounds',icon:'fa-solid fa-volume-high'},
  ]

  return(
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:60}}>
      <div style={{background:'#191919',border:'1px solid rgba(255,255,255,0.05)',borderRadius:14,width:'min(480px,96vw)',maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 8px 40px rgba(0,0,0,0.7)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.05)',background:'#111',borderRadius:'14px 14px 0 0',flexShrink:0}}>
          <span style={{fontSize:'0.95rem',fontWeight:700,color:'#fff'}}>Chat Settings</span>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,color:'#888',cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}><i className="fa-solid fa-xmark"/></button>
        </div>
        <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.05)',flexShrink:0,background:'#111'}}>
          {STABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'10px 0',border:'none',cursor:'pointer',fontSize:'0.75rem',fontWeight:600,background:'none',color:tab===t.id?'#03add8':'rgba(255,255,255,0.35)',borderBottom:tab===t.id?'2px solid #03add8':'2px solid transparent',transition:'color .12s,border-color .12s',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}><i className={t.icon} style={{fontSize:16}}/>{t.label}</button>))}
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'16px 18px'}}>
          {tab==='chatOptions'&&(<div><p style={{fontSize:'0.78rem',color:'#666',marginBottom:12}}>Select a chat theme:</p><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>{THEMES.map((th,idx)=>{const allowed=canUseTheme(idx);return(<div key={th.id} onClick={()=>allowed&&setSelTheme(th.id)} style={{borderRadius:10,overflow:'hidden',cursor:allowed?'pointer':'not-allowed',border:selTheme===th.id?'2px solid #03add8':'2px solid rgba(255,255,255,0.08)',opacity:allowed?1:0.45,transition:'border-color .15s',position:'relative'}}><div style={{height:44,background:th.bg_header,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:24,height:24,borderRadius:'50%',background:th.bg_log,border:`2px solid ${th.accent}`}}/></div><div style={{background:'#111',padding:'5px 6px',textAlign:'center'}}><span style={{fontSize:'0.68rem',fontWeight:600,color:selTheme===th.id?'#03add8':'#888'}}>{th.name}</span></div>{!allowed&&<div style={{position:'absolute',top:4,right:4,background:'#f59e0b',borderRadius:4,padding:'1px 5px',fontSize:'0.6rem',fontWeight:700,color:'#000'}}>VIP</div>}</div>)})}</div></div>)}
          {tab==='nameColor'&&(<div><div style={{marginBottom:12,display:'flex',gap:6}}>{['solid','gradient'].map(t=>(<button key={t} onClick={()=>setNameTab(t)} style={{padding:'4px 14px',borderRadius:20,border:'none',cursor:'pointer',fontSize:'0.75rem',fontWeight:600,background:nameTab===t?'rgba(3,173,216,0.2)':'rgba(255,255,255,0.06)',color:nameTab===t?'#03add8':'#888'}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>))}</div><div style={{display:'flex',flexWrap:'wrap',gap:0,marginBottom:14}}>{nameTab==='solid'&&SOLID_COLORS.map((c,i)=>(<div key={i} onClick={()=>setNameSel(`bcolor${i+1}`)} style={{...SW,background:c,border:nameSel===`bcolor${i+1}`?'2px solid #fff':'2px solid transparent'}}>{nameSel===`bcolor${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:'#fff'}}/>}</div>))}{nameTab==='gradient'&&BUB_GRADS.map((g,i)=>(<div key={i} onClick={()=>setNameSel(`bgrad${i+1}`)} style={{...SW,background:g,border:nameSel===`bgrad${i+1}`?'2px solid #fff':'2px solid transparent'}}>{nameSel===`bgrad${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:'#fff'}}/>}</div>))}</div><p style={{fontSize:'0.75rem',color:'#666',marginBottom:8}}>Name font:</p><select value={nameFont} onChange={e=>setNameFont(e.target.value)} style={{width:'100%',padding:'8px 10px',background:'#191919',border:'1px solid #222',borderRadius:8,color:'#fff',fontSize:'0.82rem'}}>{FONT_LIST.map(f=>(<option key={f.id} value={f.id}>{f.name}</option>))}</select></div>)}
          {tab==='textColor'&&(<div><div style={{marginBottom:10,display:'flex',gap:6}}>{['solid','gradient','neon','none'].map(t=>(<button key={t} onClick={()=>setBubTab(t)} style={{padding:'4px 12px',borderRadius:20,border:'none',cursor:'pointer',fontSize:'0.72rem',fontWeight:600,background:bubTab===t?'rgba(3,173,216,0.2)':'rgba(255,255,255,0.06)',color:bubTab===t?'#03add8':'#888'}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>))}</div><div style={{display:'flex',flexWrap:'wrap',marginBottom:14}}>{bubTab==='solid'&&SOLID_COLORS.map((c,i)=>(<div key={i} onClick={()=>setBubSel(`bubcolor${i+1}`)} style={{...SW,background:c,border:bubSel===`bubcolor${i+1}`?'2px solid #fff':'2px solid transparent'}}>{bubSel===`bubcolor${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:'#fff'}}/>}</div>))}{bubTab==='gradient'&&BUB_GRADS.map((g,i)=>(<div key={i} onClick={()=>setBubSel(`bubgrad${i+1}`)} style={{...SW,background:g,border:bubSel===`bubgrad${i+1}`?'2px solid #fff':'2px solid transparent'}}>{bubSel===`bubgrad${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:'#fff'}}/>}</div>))}{bubTab==='neon'&&BUB_NEONS.map((n,i)=>(<div key={i} onClick={()=>setBubSel(`bubneon${i+1}`)} style={{...SW,background:n.bg,boxShadow:n.shadow,border:bubSel===`bubneon${i+1}`?`2px solid ${n.border}`:'2px solid transparent'}}>{bubSel===`bubneon${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:n.color}}/>}</div>))}{bubTab==='none'&&(<button onClick={()=>setBubSel('')} style={{padding:'6px 16px',borderRadius:20,border:'none',cursor:'pointer',background:'rgba(255,255,255,0.08)',color:'#888',fontSize:'0.78rem'}}>Clear bubble color</button>)}</div><p style={{fontSize:'0.75rem',color:'#666',marginBottom:8}}>Message font:</p><select value={bubFont} onChange={e=>setBubFont(e.target.value)} style={{width:'100%',padding:'8px 10px',background:'#191919',border:'1px solid #222',borderRadius:8,color:'#fff',fontSize:'0.82rem',marginBottom:10}}>{FONT_LIST.map(f=>(<option key={f.id} value={f.id}>{f.name}</option>))}</select><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}><span style={{fontSize:'0.78rem',color:'#888',minWidth:80}}>Font size: {fontSize}px</span><input type="range" min={11} max={22} value={fontSize} onChange={e=>setFontSize(+e.target.value)} style={{flex:1,accentColor:'#03add8'}}/></div><div style={{display:'flex',alignItems:'center',gap:10}}><span style={{fontSize:'0.78rem',color:'#888'}}>Text color:</span><input type="color" value={msgColor} onChange={e=>setMsgColor(e.target.value)} style={{width:40,height:30,border:'none',background:'none',cursor:'pointer'}}/><span style={{fontSize:'0.75rem',color:'#666'}}>{msgColor}</span></div></div>)}
          {tab==='sounds'&&(<div>{SOUND_KEYS.map(sk=>(<div key={sk.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}><div style={{display:'flex',alignItems:'center',gap:8}}><i className={sk.icon} style={{fontSize:14,color:'#03add8',width:18,textAlign:'center'}}/><span style={{fontSize:'0.82rem',color:'#fff'}}>{sk.label}</span></div><button onClick={()=>{const cur=soundPrefs[sk.key]!==false;setSoundPref(sk.key,!cur);setSoundPrefs(p=>({...p,[sk.key]:!cur}))}} style={{width:42,height:24,borderRadius:12,border:'none',cursor:'pointer',background:soundPrefs[sk.key]!==false?'#03add8':'#333',position:'relative',transition:'background .2s'}}><span style={{position:'absolute',top:3,left:soundPrefs[sk.key]!==false?'calc(100% - 20px)':'3px',width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/></button></div>))}</div>)}
        </div>
        {tab!=='sounds'&&(<div style={{padding:'12px 18px',borderTop:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:10,flexShrink:0,background:'#111',borderRadius:'0 0 14px 14px'}}>{ok&&<span style={{fontSize:'0.8rem',color:'#74b20e',fontWeight:600}}>{ok}</span>}<div style={{flex:1}}/><button onClick={onClose} style={{padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',background:'rgba(255,255,255,0.08)',color:'#888',fontSize:'0.82rem',fontWeight:600}}>Cancel</button><button onClick={save} disabled={saving} style={{padding:'8px 20px',borderRadius:8,border:'none',cursor:'pointer',background:'#03add8',color:'#fff',fontSize:'0.82rem',fontWeight:700,opacity:saving?0.6:1}}>{saving?'Saving...':'Save'}</button></div>)}
      </div>
    </div>
  )
}

// ══ FOOTER BAR ════════════════════════════════════════════════════════════
function Footer({showRadio,setShowRadio,showRight,setRight,notif,tObj}){
  const thHeader=tObj?.bg_header||'#111111'
  const thBorder=tObj?.default_color||'#222'
  return(
    <div style={{background:thHeader,borderTop:`1px solid ${thBorder}33`,padding:'3px 10px',display:'flex',alignItems:'center',gap:2,flexShrink:0,position:'relative',minHeight:44}}>
      <FBtn faIcon="fa-solid fa-radio" active={showRadio} onClick={()=>setShowRadio(s=>!s)} title="Radio" tObj={tObj}/>
      <div style={{flex:1}}/>
      <FBtn faIcon="fa-solid fa-users" active={showRight} onClick={()=>setRight(s=>!s)} title="Online Users" badge={notif?.friends||0} tObj={tObj}/>
    </div>
  )
}

export { ChatSettingsOverlay, AvatarDropdown, Footer }
