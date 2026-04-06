// ============================================================
// ChatSettings.jsx — CodyChat Dark Theme (Footer + AvatarDropdown)
// - Footer bar: #111 bg, accent icons, dark borders
// - AvatarDropdown: #202020 panel, dark borders, accent colors
// - ChatSettingsOverlay: full dark modal
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
  {id:'',      name:'Default',          f:"'Nunito',sans-serif"},
  {id:'font1', name:'Kalam',            f:"'Kalam',cursive"},
  {id:'font2', name:'Signika',          f:"'Signika',sans-serif"},
  {id:'font3', name:'Grandstander',     f:"'Grandstander',cursive"},
  {id:'font4', name:'Comic Neue',       f:"'Comic Neue',cursive"},
  {id:'font5', name:'Quicksand',        f:"'Quicksand',sans-serif"},
  {id:'font6', name:'Orbitron',         f:"'Orbitron',sans-serif"},
  {id:'font7', name:'Lemonada',         f:"'Lemonada',cursive"},
  {id:'font8', name:'Merienda',         f:"'Merienda',cursive"},
  {id:'font9', name:'Comfortaa',        f:"'Comfortaa',cursive"},
  {id:'font10',name:'Pacifico',         f:"'Pacifico',cursive"},
  {id:'font11',name:'Dancing Script',   f:"'Dancing Script',cursive"},
  {id:'font12',name:'Lobster Two',      f:"'Lobster Two',cursive"},
  {id:'font13',name:'Caveat',           f:"'Caveat',cursive"},
  {id:'font14',name:'Satisfy',          f:"'Satisfy',cursive"},
  {id:'font22',name:'Nunito',           f:"'Nunito',sans-serif"},
  {id:'font16',name:'Rajdhani',         f:"'Rajdhani',sans-serif"},
  {id:'font19',name:'Audiowide',        f:"'Audiowide',sans-serif"},
]
const SOUND_KEYS = [
  {key:'newMessage',label:'New Message',     icon:'/default_images/icons/comment.svg'},
  {key:'join',      label:'User Joined',     icon:'/default_images/icons/active.svg'},
  {key:'gift',      label:'Gift Received',   icon:'/default_images/icons/gift.svg'},
  {key:'levelUp',   label:'Level Up',        icon:'/default_images/icons/level.svg'},
  {key:'mention',   label:'Mention',         icon:'/default_images/icons/note.svg'},
  {key:'privateMsg',label:'Private Message', icon:'/default_images/icons/comment.svg'},
  {key:'badge',     label:'Badge Earned',    icon:'/default_images/icons/badge.svg'},
]
function getSoundPrefs(){try{return JSON.parse(localStorage.getItem('cgz_sounds')||'{}')}catch{return{}}}
function setSoundPref(k,v){const p=getSoundPrefs();p[k]=v;localStorage.setItem('cgz_sounds',JSON.stringify(p))}

// ── Swatch button ──────────────────────────────────────────
const SW = {
  width:26,height:26,borderRadius:5,cursor:'pointer',border:'2px solid transparent',
  display:'inline-flex',alignItems:'center',justifyContent:'center',
  flexShrink:0,margin:2,transition:'transform .1s',
}

// ── Chat Settings Overlay — CodyChat dark modal ────────────
function ChatSettingsOverlay({ me, onClose, onSaved }) {
  const [tab,         setTab]         = useState('chatOptions')
  const [saving,      setSaving]      = useState(false)
  const [ok,          setOk]          = useState('')
  const [selTheme,    setSelTheme]    = useState(me?.chatTheme||'Dark')
  const [nameTab,     setNameTab]     = useState('solid')
  const [nameSel,     setNameSel]     = useState(me?.nameColor||'')
  const [nameFont,    setNameFont]    = useState(me?.nameFont||'')
  const [bubTab,      setBubTab]      = useState('solid')
  const [bubSel,      setBubSel]      = useState(me?.bubbleColor||'')
  const [bubFont,     setBubFont]     = useState(me?.msgFontStyle||'')
  const [bubStyle,    setBubStyle]    = useState(me?.bubbleStyle||'normal')
  const [msgColor,    setMsgColor]    = useState(me?.msgFontColor||'#ffffff')
  const [fontSize,    setFontSize]    = useState(me?.msgFontSize||14)
  const [soundPrefs,  setSoundPrefs]  = useState(getSoundPrefs)
  const [themeLimit,  setThemeLimit]  = useState(-1)

  useEffect(()=>{
    fetch(`${API}/api/admin/themes-by-rank`)
      .then(r=>r.json())
      .then(d=>{const rank=me?.rank||'user';const limit=d?.themesByRank?.[rank];setThemeLimit(limit===undefined?0:limit)})
      .catch(()=>setThemeLimit(0))
  },[me?.rank])

  const canUseTheme=(idx)=>{
    if(themeLimit===-1) return true
    if(themeLimit===0)  return false
    const freeThemes=THEMES.slice(0,themeLimit).map(t=>t.id)
    return freeThemes.includes(THEMES[idx]?.id)||THEMES[idx]?.id===me?.chatTheme
  }

  async function save(){
    setSaving(true);setOk('')
    const token=localStorage.getItem('cgz_token')
    let body={}
    if(tab==='chatOptions') body={chatTheme:selTheme}
    if(tab==='nameColor')   body={nameColor:nameSel,nameFont}
    if(tab==='textColor')   body={bubbleColor:bubSel,bubbleStyle:bubStyle,msgFontColor:msgColor,msgFontStyle:bubFont,msgFontSize:fontSize}
    if(tab==='sounds'){setSaving(false);return}
    try{
      const r=await fetch(`${API}/api/users/me/style`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)})
      const d=await r.json()
      if(r.ok){setOk('Saved!');onSaved?.(d.user)}
    }catch{}
    setSaving(false)
    setTimeout(()=>setOk(''),2000)
  }

  // Tab definitions
  const STABS = [
    {id:'chatOptions',label:'Theme',   icon:'fa-solid fa-palette'},
    {id:'nameColor',  label:'Name',    icon:'fa-solid fa-signature'},
    {id:'textColor',  label:'Bubble',  icon:'fa-solid fa-message'},
    {id:'sounds',     label:'Sounds',  icon:'fa-solid fa-volume-high'},
  ]

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:60}}>
      <div style={{
        background:'#191919', border:'1px solid rgba(255,255,255,0.05)',
        borderRadius:14, width:'min(480px,96vw)',
        maxHeight:'80vh', display:'flex', flexDirection:'column',
        boxShadow:'0 8px 40px rgba(0,0,0,0.7)',
      }}>
        {/* Modal header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.05)',background:'#111',borderRadius:'14px 14px 0 0',flexShrink:0}}>
          <span style={{fontSize:'0.95rem',fontWeight:700,color:'#ffffff'}}>Chat Settings</span>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,color:'#888',cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>
            <i className="fa-solid fa-xmark"/>
          </button>
        </div>

        {/* Tab bar */}
        <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.05)',flexShrink:0,background:'#111'}}>
          {STABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1,padding:'10px 0',border:'none',cursor:'pointer',fontSize:'0.75rem',fontWeight:600,
              background:'none',
              color:tab===t.id?'#03add8':'rgba(255,255,255,0.35)',
              borderBottom:tab===t.id?'2px solid #03add8':'2px solid transparent',
              transition:'color .12s,border-color .12s',display:'flex',flexDirection:'column',alignItems:'center',gap:3,
            }}>
              <i className={t.icon} style={{fontSize:16}}/>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:'auto',padding:'16px 18px'}}>

          {/* THEME TAB */}
          {tab==='chatOptions' && (
            <div>
              <p style={{fontSize:'0.78rem',color:'#666',marginBottom:12}}>Select a chat theme:</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {THEMES.map((th,idx)=>{
                  const allowed=canUseTheme(idx)
                  return (
                    <div key={th.id} onClick={()=>allowed&&setSelTheme(th.id)}
                      style={{
                        borderRadius:10,overflow:'hidden',cursor:allowed?'pointer':'not-allowed',
                        border:selTheme===th.id?'2px solid #03add8':'2px solid rgba(255,255,255,0.08)',
                        opacity:allowed?1:0.45,
                        transition:'border-color .15s',
                        position:'relative',
                      }}>
                      <div style={{height:44,background:th.bg_header,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <div style={{width:24,height:24,borderRadius:'50%',background:th.bg_log,border:`2px solid ${th.accent}`}}/>
                      </div>
                      <div style={{background:'#111',padding:'5px 6px',textAlign:'center'}}>
                        <span style={{fontSize:'0.68rem',fontWeight:600,color:selTheme===th.id?'#03add8':'#888'}}>{th.name}</span>
                      </div>
                      {!allowed&&<div style={{position:'absolute',top:4,right:4,background:'#f59e0b',borderRadius:4,padding:'1px 5px',fontSize:'0.6rem',fontWeight:700,color:'#000'}}>VIP</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* NAME COLOR TAB */}
          {tab==='nameColor' && (
            <div>
              <div style={{marginBottom:12,display:'flex',gap:6}}>
                {['solid','gradient'].map(t=>(
                  <button key={t} onClick={()=>setNameTab(t)} style={{padding:'4px 14px',borderRadius:20,border:'none',cursor:'pointer',fontSize:'0.75rem',fontWeight:600,background:nameTab===t?'rgba(3,173,216,0.2)':'rgba(255,255,255,0.06)',color:nameTab===t?'#03add8':'#888'}}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:0,marginBottom:14}}>
                {nameTab==='solid'&&SOLID_COLORS.map((c,i)=>(
                  <div key={i} onClick={()=>setNameSel(`bcolor${i+1}`)}
                    style={{...SW,background:c,border:nameSel===`bcolor${i+1}`?'2px solid #ffffff':'2px solid transparent'}}>
                    {nameSel===`bcolor${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:'#fff'}}/>}
                  </div>
                ))}
                {nameTab==='gradient'&&BUB_GRADS.map((g,i)=>(
                  <div key={i} onClick={()=>setNameSel(`bgrad${i+1}`)}
                    style={{...SW,background:g,border:nameSel===`bgrad${i+1}`?'2px solid #ffffff':'2px solid transparent'}}>
                    {nameSel===`bgrad${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:'#fff'}}/>}
                  </div>
                ))}
              </div>
              <p style={{fontSize:'0.75rem',color:'#666',marginBottom:8}}>Name font:</p>
              <select value={nameFont} onChange={e=>setNameFont(e.target.value)}
                style={{width:'100%',padding:'8px 10px',background:'#191919',border:'1px solid #222',borderRadius:8,color:'#ffffff',fontSize:'0.82rem'}}>
                {FONT_LIST.map(f=>(
                  <option key={f.id} value={f.id} style={{fontFamily:f.f}}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* BUBBLE TAB */}
          {tab==='textColor' && (
            <div>
              <div style={{marginBottom:10,display:'flex',gap:6}}>
                {['solid','gradient','neon','none'].map(t=>(
                  <button key={t} onClick={()=>setBubTab(t)} style={{padding:'4px 12px',borderRadius:20,border:'none',cursor:'pointer',fontSize:'0.72rem',fontWeight:600,background:bubTab===t?'rgba(3,173,216,0.2)':'rgba(255,255,255,0.06)',color:bubTab===t?'#03add8':'#888'}}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',flexWrap:'wrap',marginBottom:14}}>
                {bubTab==='solid'&&SOLID_COLORS.map((c,i)=>(
                  <div key={i} onClick={()=>setBubSel(`bubcolor${i+1}`)} style={{...SW,background:c,border:bubSel===`bubcolor${i+1}`?'2px solid #fff':'2px solid transparent'}}>
                    {bubSel===`bubcolor${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:'#fff'}}/>}
                  </div>
                ))}
                {bubTab==='gradient'&&BUB_GRADS.map((g,i)=>(
                  <div key={i} onClick={()=>setBubSel(`bubgrad${i+1}`)} style={{...SW,background:g,border:bubSel===`bubgrad${i+1}`?'2px solid #fff':'2px solid transparent'}}>
                    {bubSel===`bubgrad${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:'#fff'}}/>}
                  </div>
                ))}
                {bubTab==='neon'&&BUB_NEONS.map((n,i)=>(
                  <div key={i} onClick={()=>setBubSel(`bubneon${i+1}`)} style={{...SW,background:n.bg,boxShadow:n.shadow,border:bubSel===`bubneon${i+1}`?`2px solid ${n.border}`:'2px solid transparent'}}>
                    {bubSel===`bubneon${i+1}`&&<i className="fa-solid fa-check" style={{fontSize:10,color:n.color}}/>}
                  </div>
                ))}
                {bubTab==='none'&&(
                  <button onClick={()=>setBubSel('')} style={{padding:'6px 16px',borderRadius:20,border:'none',cursor:'pointer',background:'rgba(255,255,255,0.08)',color:'#888',fontSize:'0.78rem'}}>
                    Clear bubble color
                  </button>
                )}
              </div>
              <p style={{fontSize:'0.75rem',color:'#666',marginBottom:8}}>Message font:</p>
              <select value={bubFont} onChange={e=>setBubFont(e.target.value)}
                style={{width:'100%',padding:'8px 10px',background:'#191919',border:'1px solid #222',borderRadius:8,color:'#ffffff',fontSize:'0.82rem',marginBottom:10}}>
                {FONT_LIST.map(f=>(
                  <option key={f.id} value={f.id} style={{fontFamily:f.f}}>{f.name}</option>
                ))}
              </select>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <span style={{fontSize:'0.78rem',color:'#888',minWidth:80}}>Font size: {fontSize}px</span>
                <input type="range" min={11} max={22} value={fontSize} onChange={e=>setFontSize(+e.target.value)}
                  style={{flex:1,accentColor:'#03add8'}}/>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:'0.78rem',color:'#888'}}>Text color:</span>
                <input type="color" value={msgColor} onChange={e=>setMsgColor(e.target.value)}
                  style={{width:40,height:30,border:'none',background:'none',cursor:'pointer'}}/>
                <span style={{fontSize:'0.75rem',color:'#666'}}>{msgColor}</span>
              </div>
            </div>
          )}

          {/* SOUNDS TAB */}
          {tab==='sounds' && (
            <div>
              {SOUND_KEYS.map(sk=>(
                <div key={sk.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <span style={{fontSize:'0.82rem',color:'#ffffff'}}>{sk.label}</span>
                  <button onClick={()=>{
                    const current=soundPrefs[sk.key]!==false
                    setSoundPref(sk.key,!current)
                    setSoundPrefs(p=>({...p,[sk.key]:!current}))
                  }} style={{
                    width:42,height:24,borderRadius:12,border:'none',cursor:'pointer',
                    background:soundPrefs[sk.key]!==false?'#03add8':'#333',
                    position:'relative',transition:'background .2s',
                  }}>
                    <span style={{
                      position:'absolute',top:3,
                      left:soundPrefs[sk.key]!==false?'calc(100% - 20px)':'3px',
                      width:18,height:18,borderRadius:'50%',background:'#fff',
                      transition:'left .2s',
                    }}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {tab!=='sounds' && (
          <div style={{padding:'12px 18px',borderTop:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:10,flexShrink:0,background:'#111',borderRadius:'0 0 14px 14px'}}>
            {ok && <span style={{fontSize:'0.8rem',color:'#74b20e',fontWeight:600}}>{ok}</span>}
            <div style={{flex:1}}/>
            <button onClick={onClose} style={{padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',background:'rgba(255,255,255,0.08)',color:'#888',fontSize:'0.82rem',fontWeight:600}}>
              Cancel
            </button>
            <button onClick={save} disabled={saving} style={{padding:'8px 20px',borderRadius:8,border:'none',cursor:'pointer',background:'#03add8',color:'#fff',fontSize:'0.82rem',fontWeight:700,opacity:saving?0.6:1}}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Avatar Dropdown — FIX 3: fully coded, all options work inside chatroom ──
function AvatarDropdown({ me, status, setStatus, onLeave, socket, onOpenSettings, onOpenProfile, tObj }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const nav = useNavigate()
  const thAccent = tObj?.accent || '#03add8'

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const STATUS_OPTS = [
    { id: 'online',    label: 'Online',    color: '#22c55e', icon: 'fa-solid fa-circle' },
    { id: 'away',      label: 'Away',      color: '#f59e0b', icon: 'fa-regular fa-clock' },
    { id: 'busy',      label: 'Busy',      color: '#ef4444', icon: 'fa-solid fa-ban' },
    { id: 'invisible', label: 'Invisible', color: '#9ca3af', icon: 'fa-solid fa-eye-slash' },
  ]
  const STATUS_COLOR = { online: '#22c55e', away: '#f59e0b', busy: '#ef4444', invisible: '#9ca3af' }

  const ri = R(me?.rank)

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={e => { e.stopPropagation(); setOpen(p => !p) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5, position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={me?.avatar || '/default_images/avatar/default_guest.png'}
            alt=""
            style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${GBR(me?.gender, me?.rank)}`, display: 'block' }}
            onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }}
          />
          {/* Status dot */}
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 8, height: 8, borderRadius: '50%',
            background: STATUS_COLOR[status] || '#22c55e',
            border: '1.5px solid #111',
          }} />
        </div>
      </button>

      {/* Dropdown — CodyChat .back_menu dark */}
      {open && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          background: '#242424', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, minWidth: 210,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 500, overflow: 'hidden',
        }}>
          {/* User info row */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={me?.avatar || '/default_images/avatar/default_guest.png'} alt=""
              style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GBR(me?.gender, me?.rank)}` }}
              onError={e => { e.target.src = '/default_images/avatar/default_guest.png' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me?.username}</div>
              <div style={{ fontSize: '0.7rem', color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RIcon rank={me?.rank} size={12} />
                {ri.label}
              </div>
            </div>
            {/* Gold */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>💰 {me?.gold || 0}</div>
            </div>
          </div>

          {/* Status section */}
          <div style={{ padding: '8px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '0.68rem', color: '#666', padding: '2px 8px 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {STATUS_OPTS.map(s => (
                <button key={s.id} onClick={() => { setStatus(s.id); socket?.emit('setStatus', { status: s.id }); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: status === s.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                    color: status === s.id ? '#ffffff' : '#888',
                    fontSize: '0.78rem', fontWeight: status === s.id ? 700 : 500,
                    transition: 'background .12s',
                  }}>
                  <i className={s.icon} style={{ fontSize: 10, color: s.color }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Menu items */}
          {[
            { icon: 'fa-solid fa-circle-user',         label: 'Profile',       fn: () => { onOpenProfile?.(); setOpen(false) } },
            { icon: 'fa-solid fa-user-gear',           label: 'Chat Settings', fn: () => { onOpenSettings?.(); setOpen(false) } },
            { icon: 'fa-solid fa-gauge',               label: 'Admin Panel',   fn: () => { nav('/admin'); setOpen(false) } },
            { icon: 'fa-solid fa-right-from-bracket',  label: 'Leave Room',    fn: () => { onLeave?.(); setOpen(false) }, color: '#ef4444' },
          ].map((item, i) => (
            <button key={i} onClick={item.fn}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 14px',
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                borderTop: i === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                color: item.color || '#dddddd',
                fontSize: '0.82rem', fontWeight: 600,
                transition: 'background .12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <i className={item.icon} style={{ fontSize: 14, width: 18, textAlign: 'center', color: item.color || '#03add8' }} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── FOOTER BAR — CodyChat .bfoot style ────────────────────
// Dark #111, accent icons, matches CodyChat footer exactly
function Footer({ showRadio, setShowRadio, showRight, setRight, notif, tObj }) {
  const thHeader = tObj?.bg_header || '#111111'
  const thBorder = tObj?.default_color || '#222'
  return (
    <div style={{
      background: thHeader,
      borderTop: `1px solid ${thBorder}33`,
      padding: '3px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      flexShrink: 0,
      position: 'relative',
      minHeight: 44,
    }}>
      <FBtn faIcon="fa-solid fa-radio"  active={showRadio}  onClick={() => setShowRadio(s => !s)} title="Radio"        tObj={tObj} />
      <div style={{ flex: 1 }} />
      {/* Users count badge on the users button */}
      <FBtn faIcon="fa-solid fa-users"  active={showRight}  onClick={() => setRight(s => !s)}     title="Online Users" badge={notif?.friends || 0} tObj={tObj} />
    </div>
  )
}

export { ChatSettingsOverlay, AvatarDropdown, Footer }
