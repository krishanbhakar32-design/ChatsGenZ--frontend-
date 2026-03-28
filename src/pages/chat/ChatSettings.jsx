// ============================================================
// ChatSettings.jsx — Settings overlay, avatar dropdown, footer bar
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { API, R, STATUSES, isStaff } from './chatConstants.js'
import { THEMES } from '../../components/StyleModal.jsx'
import { RIcon, HBtn, FBtn } from './ChatIcons.jsx'

function ChatSettingsOverlay({me, onClose, onSaved}) {
  const [tab, setTab] = useState('theme')  // 'theme' | 'nameColor' | 'bubble'
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState('')

  // Theme state — default Light
  const [selTheme, setSelTheme] = useState(me?.chatTheme || 'Dolphin')

  // Name color state
  const [nameTab, setNameTab] = useState('solid')
  const [nameSel, setNameSel] = useState(me?.nameColor || '')
  const [nameFont, setNameFont] = useState(me?.nameFont || '')

  // Bubble state
  const [bubTab, setBubTab] = useState('solid')
  const [bubSel, setBubSel] = useState(me?.bubbleColor || '')
  const [bubFont, setBubFont] = useState(me?.msgFontStyle || '')
  const [bubStyle, setBubStyle] = useState(me?.bubbleStyle || 'normal')
  const [msgColor, setMsgColor] = useState(me?.msgFontColor || '#ffffff')

  const SW = {width:26,height:26,borderRadius:5,cursor:'pointer',border:'2px solid transparent',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,margin:2,transition:'transform .1s'}

  async function save() {
    setSaving(true); setOk('')
    const token = localStorage.getItem('cgz_token')
    let body = {}
    if(tab === 'theme')     body = {chatTheme: selTheme}
    if(tab === 'nameColor') body = {nameColor: nameSel, nameFont}
    if(tab === 'bubble')    body = {bubbleColor: bubSel, bubbleStyle: bubStyle, msgFontColor: msgColor, msgFontStyle: bubFont}
    try {
      const r = await fetch(`${API}/api/users/me/style`, {method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(body)})
      const d = await r.json()
      if(r.ok) { setOk('Saved!'); onSaved?.(d.user) }
    } catch(e) {}
    setSaving(false)
    setTimeout(() => setOk(''), 2000)
  }

  const TABS = [
    {id:'theme',     icon:'fi-sr-palette',      label:'Theme'},
    {id:'nameColor', icon:'fi-sr-brush',         label:'Name Color'},
    {id:'bubble',    icon:'fi-sr-comment-alt',   label:'Bubble Style'},
  ]

  return (
    <div onClick={e=>e.stopPropagation()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',backdropFilter:'blur(3px)',zIndex:1200,display:'flex',alignItems:'center',justifyContent:'center',padding:'12px'}}>
      <div style={{background:'#fff',borderRadius:16,width:'min(480px,100%)',maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,.35)',overflow:'hidden'}}>
        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#1a1f2e,#2d3555)',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="fi fi-sr-settings" style={{fontSize:16,color:'#fff'}}/>
            </div>
            <div>
              <div style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.95rem',color:'#fff'}}>Chat Settings</div>
              <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,.5)'}}>Customize your appearance</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.1)',border:'none',borderRadius:8,width:30,height:30,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14}}>
            <i className="fi fi-sr-cross-small"/>
          </button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'2px solid #f3f4f6',background:'#fafafa',flexShrink:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setOk('')}}
              style={{flex:1,padding:'10px 6px',border:'none',background:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,borderBottom:`2px solid ${tab===t.id?'#1a73e8':'transparent'}`,marginBottom:-2,color:tab===t.id?'#1a73e8':'#6b7280',transition:'all .15s'}}>
              <i className={`fi ${t.icon}`} style={{fontSize:15}}/>
              <span style={{fontSize:'0.65rem',fontWeight:700}}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'14px'}}>
          {ok && <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'7px 12px',fontSize:'0.78rem',color:'#15803d',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><i className="fi fi-sr-check-circle" style={{fontSize:14}}/> {ok}</div>}

          {/* ── THEME TAB ── */}
          {tab==='theme' && (
            <>
              <div style={{fontSize:'0.7rem',fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:.5,marginBottom:10}}>Select Theme</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:12}}>
                {THEMES.map(t=>(
                  <div key={t.id} onClick={()=>setSelTheme(t.id)} style={{borderRadius:9,overflow:'hidden',border:`2px solid ${selTheme===t.id?'#1a73e8':'#e4e6ea'}`,cursor:'pointer',transform:selTheme===t.id?'scale(1.03)':'scale(1)',transition:'all .15s',boxShadow:selTheme===t.id?'0 0 0 3px rgba(26,115,232,.15)':'none'}}>
                    {/* Header bar */}
                    <div style={{background:t.bg_header,padding:'5px 8px',display:'flex',alignItems:'center',gap:4,minHeight:26}}>
                      {selTheme===t.id&&<i className="fi fi-sr-check-circle" style={{fontSize:8,color:t.accent||'#fff',flexShrink:0}}/>}
                      <span style={{fontSize:'0.65rem',fontWeight:800,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textShadow:'0 1px 3px rgba(0,0,0,.6)',flex:1}}>{t.name}</span>
                    </div>
                    {/* Chat preview area with bg image support */}
                    <div style={{
                      background:t.bg_image?`url(${t.bg_image})`:t.bg_chat,
                      backgroundSize:'cover',backgroundPosition:'center',
                      padding:'5px 8px',height:40,display:'flex',alignItems:'center',position:'relative',
                    }}>
                      {t.bg_image&&<div style={{position:'absolute',inset:0,background:t.bg_chat&&t.bg_chat!=='transparent'?t.bg_chat+'99':'rgba(0,0,0,.35)'}}/>}
                      <div style={{background:t.bg_log,borderRadius:4,padding:'2px 7px',display:'inline-block',position:'relative',zIndex:1,maxWidth:'90%'}}>
                        <span style={{fontSize:'0.6rem',color:t.text,fontWeight:600,whiteSpace:'nowrap'}}>Hello 👋</span>
                      </div>
                      {/* Accent dot */}
                      <div style={{position:'absolute',right:6,bottom:5,width:14,height:14,borderRadius:'50%',background:t.accent,zIndex:1,boxShadow:`0 0 0 2px ${t.bg_chat||'#000'}44`}}/>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── NAME COLOR TAB ── */}
          {tab==='nameColor' && (
            <>
              <div style={{textAlign:'center',marginBottom:12,padding:'10px',background:'#f9fafb',borderRadius:8,border:'1px solid #f3f4f6'}}>
                <span style={{fontSize:15,fontWeight:800,fontFamily:FONT_LIST.find(f=>f.id===nameFont)?.f||'Outfit,sans-serif',
                  ...(nameTab==='solid'&&nameSel?{color:SOLID_COLORS[parseInt(nameSel.replace('bcolor',''))-1]}:
                     nameTab==='gradient'&&nameSel?{background:BUB_GRADS[parseInt(nameSel.replace('bgrad',''))-1],WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}:
                     {color:'#111827'})}}>
                  {me?.username||'Preview Name'}
                </span>
              </div>
              <div style={{display:'flex',gap:4,marginBottom:10}}>
                {['solid','gradient'].map(t=>(
                  <button key={t} onClick={()=>setNameTab(t)} style={{flex:1,padding:'5px',borderRadius:5,border:`1px solid ${nameTab===t?'#1a73e8':'#e4e6ea'}`,background:nameTab===t?'#eff6ff':'none',color:nameTab===t?'#1a73e8':'#9ca3af',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',textTransform:'capitalize'}}>{t}</button>
                ))}
              </div>
              {nameTab==='solid' && (
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
              {nameTab==='gradient' && (
                <div style={{display:'flex',flexWrap:'wrap',marginBottom:12}}>
                  {BUB_GRADS.map((g,i)=>(
                    <div key={i} onClick={()=>setNameSel(`bgrad${i+1}`)} style={{...SW,background:g,border:`2px solid ${nameSel===`bgrad${i+1}`?'#fff':'transparent'}`,transform:nameSel===`bgrad${i+1}`?'scale(1.25)':'scale(1)'}}>
                      {nameSel===`bgrad${i+1}`&&<i className="fi fi-sr-check" style={{fontSize:8,color:'#fff'}}/>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{fontSize:'0.7rem',fontWeight:700,color:'#9ca3af',marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Name Font</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginBottom:4}}>
                <div onClick={()=>setNameFont('')} style={{padding:'5px 7px',borderRadius:5,border:`1.5px solid ${nameFont===''?'#1a73e8':'#e4e6ea'}`,background:nameFont===''?'#eff6ff':'#f9fafb',cursor:'pointer',fontSize:'0.72rem',textAlign:'center',color:nameFont===''?'#1a73e8':'#374151',fontWeight:600}}>Default</div>
                {FONT_LIST.map(f=>(
                  <div key={f.id} onClick={()=>setNameFont(f.id)} style={{padding:'5px 7px',borderRadius:5,border:`1.5px solid ${nameFont===f.id?'#1a73e8':'#e4e6ea'}`,background:nameFont===f.id?'#eff6ff':'#f9fafb',cursor:'pointer',fontSize:'0.72rem',textAlign:'center',fontFamily:f.f,color:nameFont===f.id?'#1a73e8':'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                ))}
              </div>
            </>
          )}

          {/* ── BUBBLE TAB ── */}
          {tab==='bubble' && (
            <>
              <div style={{marginBottom:12,padding:'10px',background:'#f9fafb',borderRadius:8,border:'1px solid #f3f4f6'}}>
                <div style={{display:'inline-block',padding:'7px 12px',borderRadius:'3px 10px 10px 10px',fontSize:'0.82rem',
                  fontWeight:bubStyle.includes('bold')?700:400,
                  fontStyle:bubStyle.includes('italic')?'italic':'normal',
                  fontFamily:FONT_LIST.find(f=>f.id===bubFont)?.f||'inherit',
                  color:msgColor||'#fff',
                  ...(bubTab==='solid'&&bubSel?{background:SOLID_COLORS[parseInt(bubSel.replace('bubcolor',''))-1]}:
                     (bubTab==='gradient'||bubTab==='neon')&&bubSel?{background:BUB_GRADS[parseInt(bubSel.replace(/bubgrad|bubneon/,''))-1]}:
                     {background:'#374151',color:'#fff'})}}>
                  Hey there! 👋
                </div>
              </div>
              <div style={{display:'flex',gap:4,marginBottom:10}}>
                {['solid','gradient','neon'].map(t=>(
                  <button key={t} onClick={()=>setBubTab(t)} style={{flex:1,padding:'5px',borderRadius:5,border:`1px solid ${bubTab===t?'#1a73e8':'#e4e6ea'}`,background:bubTab===t?'#eff6ff':'none',color:bubTab===t?'#1a73e8':'#9ca3af',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',textTransform:'capitalize'}}>{t}</button>
                ))}
              </div>
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
              <div style={{fontSize:'0.68rem',fontWeight:700,color:'#9ca3af',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Font</div>
              <select value={bubFont} onChange={e=>setBubFont(e.target.value)} style={{width:'100%',padding:'6px 8px',border:'1.5px solid #e4e6ea',borderRadius:6,fontSize:'0.8rem',background:'#f9fafb',outline:'none',cursor:'pointer'}}>
                <option value="">Default Font</option>
                {FONT_LIST.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{borderTop:'1px solid #f3f4f6',padding:'12px 14px',display:'flex',gap:8,flexShrink:0,background:'#fafafa'}}>
          <button onClick={onClose} style={{flex:1,padding:'9px',borderRadius:8,border:'1.5px solid #e4e6ea',background:'#fff',color:'#6b7280',cursor:'pointer',fontSize:'0.82rem',fontWeight:600}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{flex:2,padding:'9px',borderRadius:8,border:'none',background:saving?'#9ca3af':'linear-gradient(135deg,#1a73e8,#0d5bcd)',color:'#fff',cursor:saving?'not-allowed':'pointer',fontSize:'0.82rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <i className={saving?'fi fi-sr-spinner':'fi fi-sr-disk'} style={{fontSize:14}}/> {saving?'Saving…':'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AvatarDropdown({me,status,setStatus,onLeave,socket,onOpenSettings,onOpenProfile}) {
  const [open,setOpen]=useState(false)
  const ref=useRef(null), nav=useNavigate()
  useEffect(()=>{
    const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)}
    if(open) document.addEventListener('mousedown',fn)
    return()=>document.removeEventListener('mousedown',fn)
  },[open])
  const ri=R(me?.rank), border=GBR(me?.gender,me?.rank)
  const curSt=STATUSES.find(s=>s.id===status)||STATUSES[0]
  const isStaff=['moderator','admin','superadmin','owner'].includes(me?.rank)

  const menuItem = (icon, label, color, onClick, danger=false) => (
    <button key={label} onClick={()=>{onClick?.();setOpen(false)}}
      style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 14px',background:'none',border:'none',borderBottom:'1px solid #2d3555',cursor:'pointer',textAlign:'left',transition:'background .12s'}}
      onMouseEnter={e=>e.currentTarget.style.background=danger?'rgba(239,68,68,.12)':'#2d3555'}
      onMouseLeave={e=>e.currentTarget.style.background='none'}>
      <i className={`fi ${icon}`} style={{fontSize:14,color:danger?'#f87171':color,width:18,textAlign:'center',flexShrink:0}}/>
      <span style={{fontSize:'0.84rem',fontWeight:600,color:danger?'#f87171':'#e2e8f0'}}>{label}</span>
    </button>
  )

  return (
    <div ref={ref} style={{position:'relative',flexShrink:0}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 3px',display:'flex',alignItems:'center'}}>
        <div style={{position:'relative'}}>
          <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',border:`2px solid ${border}`,display:'block'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
          <span style={{position:'absolute',bottom:0,right:0,width:7,height:7,background:curSt.color,borderRadius:'50%',border:'1.5px solid #fff'}}/>
        </div>
      </button>
      {open&&(
        <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#1a1f2e',border:'1px solid #2d3555',borderRadius:12,minWidth:240,boxShadow:'0 8px 32px rgba(0,0,0,.5)',zIndex:999,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
          {/* Profile header */}
          <div style={{padding:'14px 14px 12px',borderBottom:'1px solid #2d3555',display:'flex',alignItems:'center',gap:12,position:'relative'}}>
            <img src={me?.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:52,height:52,borderRadius:'50%',objectFit:'cover',border:`2.5px solid ${border}`,flexShrink:0}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                <RIcon rank={me?.rank} size={12}/>
                <span style={{fontSize:'0.65rem',fontWeight:700,color:ri.color}}>{ri.label}</span>
              </div>
              <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'0.95rem',color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{me?.username}</div>
              <div style={{fontSize:'0.68rem',color:'rgba(255,255,255,.4)',marginTop:2}}>{curSt.label}</div>
            </div>
            <div style={{position:'absolute',top:10,right:10,width:30,height:30,borderRadius:'50%',background:'#2d3555',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <RIcon rank={me?.rank} size={18}/>
            </div>
          </div>

          {/* Stats row */}
          {!me?.isGuest&&<div style={{display:'flex',gap:6,padding:'8px 12px',borderBottom:'1px solid #2d3555'}}>
            <div style={{flex:1,background:'#111827',borderRadius:8,padding:'6px 10px',display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:'1rem'}}>🪙</span>
              <div><div style={{fontSize:'0.55rem',color:'#9ca3af',fontWeight:600}}>Gold</div><div style={{fontSize:'0.8rem',fontWeight:800,color:'#fbbf24'}}>{me?.gold||0}</div></div>
            </div>
            <div style={{flex:1,background:'#111827',borderRadius:8,padding:'6px 10px',display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:'1rem'}}>⭐</span>
              <div><div style={{fontSize:'0.55rem',color:'#9ca3af',fontWeight:600}}>Lv {me?.level||1}</div><div style={{fontSize:'0.8rem',fontWeight:800,color:'#a78bfa'}}>{me?.xp||0} XP</div></div>
            </div>
          </div>}

          {/* Menu */}
          <div>
            {menuItem('fi-sr-user','My Profile','#a78bfa',()=>{onOpenProfile?.();setOpen(false)})}
            {menuItem('fi-sr-settings-sliders','Chat Settings','#60a5fa',()=>{onOpenSettings?.();setOpen(false)})}
            {isStaff&&menuItem('fi-sr-dashboard','Admin Panel','#f59e0b',()=>{window.location.href='/admin'})}
          </div>

          {/* Status sub-row */}
          <div style={{padding:'8px 10px',borderTop:'1px solid #2d3555',borderBottom:'1px solid #2d3555',display:'flex',gap:5,flexWrap:'wrap'}}>
            {STATUSES.map(s=>(
              <button key={s.id} onClick={()=>{setStatus(s.id);setOpen(false)}}
                style={{flex:'1 1 auto',minWidth:60,padding:'5px 8px',borderRadius:6,border:`1.5px solid ${status===s.id?s.color:'#2d3555'}`,background:status===s.id?s.color+'22':'none',cursor:'pointer',display:'flex',alignItems:'center',gap:5,justifyContent:'center'}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:s.color,display:'inline-block',flexShrink:0}}/>
                <span style={{fontSize:'0.65rem',fontWeight:700,color:status===s.id?s.color:'#9ca3af'}}>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Leave + Logout */}
          <div>
            {menuItem('fi-sr-sign-out-alt','Leave Room','#60a5fa',()=>onLeave())}
            <button onClick={()=>{const t=localStorage.getItem('cgz_token');if(t)fetch(`${API}/api/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${t}`}}).catch(()=>{});localStorage.removeItem('cgz_token');nav('/login')}}
              style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left',transition:'background .12s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,.12)'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}>
              <i className="fi fi-sr-user-logout" style={{fontSize:14,color:'#f87171',width:18,textAlign:'center',flexShrink:0}}/>
              <span style={{fontSize:'0.84rem',fontWeight:600,color:'#f87171'}}>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HEADER BUTTON
// ─────────────────────────────────────────────────────────────
function HBtn({icon,img,title,badge,active,onClick}) {
  return (
    <button onClick={onClick} title={title}
      style={{position:'relative',background:active?'#e8f0fe':'none',border:'none',cursor:'pointer',color:active?'#1a73e8':'#6b7280',width:38,height:38,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,transition:'all .15s',flexShrink:0}}
      onMouseEnter={e=>{e.currentTarget.style.background='#f3f4f6'}}
      onMouseLeave={e=>{e.currentTarget.style.background=active?'#e8f0fe':'none'}}>
      {img
        ? <img src={img} alt={title} style={{width:22,height:22,objectFit:'contain',filter:active?'none':'grayscale(20%)',opacity:active?1:0.8}} onError={e=>e.target.style.display='none'}/>
        : <i className={`fi ${icon}`}/>
      }
      {badge>0&&<span style={{position:'absolute',top:4,right:4,minWidth:7,height:7,background:'#ef4444',borderRadius:'50%',border:'1.5px solid #fff'}}/>}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────
function Footer({showRadio,setShowRadio,showRight,setRight,notif}) {
  return (
    <div style={{background:'#fff',borderTop:'1px solid #e4e6ea',padding:'4px 10px',display:'flex',alignItems:'center',gap:4,flexShrink:0,position:'relative'}}>
      <FBtn icon="fi-sr-radio" active={showRadio} onClick={()=>setShowRadio(s=>!s)} title="Radio"/>
      <div style={{flex:1}}/>
      <FBtn icon="fi-sr-list" active={showRight} onClick={()=>setRight(s=>!s)} title="User List" badge={notif.friends}/>
    </div>
  )
}
function FBtn({icon,active,onClick,title,badge}) {
  return (
    <button onClick={onClick} title={title} style={{position:'relative',background:active?'#e8f0fe':'none',border:'none',cursor:'pointer',color:active?'#1a73e8':'#9ca3af',width:34,height:32,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,transition:'all .15s'}}>
      <i className={`fi ${icon}`}/>
      {badge>0&&<span style={{position:'absolute',top:4,right:4,width:7,height:7,background:'#ef4444',borderRadius:'50%',border:'1.5px solid #fff'}}/>}
    </button>
  )
}


// ─────────────────────────────────────────────────────────────
// WEBCAM PANEL — inline below header, full WebRTC streaming
// ─────────────────────────────────────────────────────────────

export { ChatSettingsOverlay, AvatarDropdown, Footer }
