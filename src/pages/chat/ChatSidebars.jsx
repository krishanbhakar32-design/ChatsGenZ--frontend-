// ============================================================
// ChatSidebars.jsx — Left/Right sidebars and their sub-panels
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { API, R, RL, GBR, isStaff, isAdmin } from './chatConstants.js'
import { RIcon, UIIcon } from './ChatIcons.jsx'
import StyleModal, { getNameStyle, getBubbleStyle, FONTS, THEMES } from '../../components/StyleModal.jsx'

function UserItem({u,onClick,onWhisper}) {
  const ri=R(u.rank)
  const col = resolveNameColor(u.nameColor, ri.color)
  const [hov,setHov]=useState(false)
  return (
    <div onClick={e=>{const r=e.currentTarget.getBoundingClientRect();onClick(u,{x:r.left-224,y:r.top})}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'flex',alignItems:'center',gap:7,padding:'6px 10px',cursor:'pointer',transition:'background .12s',position:'relative',background:hov?'rgba(255,255,255,.08)':'transparent'}}>
      <div style={{position:'relative',flexShrink:0}}>
        <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${GBR(u.gender,u.rank)}`,display:'block'}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
        <span style={{position:'absolute',bottom:0,right:0,width:6,height:6,background:'#22c55e',borderRadius:'50%',border:'1.5px solid #fff'}}/>
      </div>
      <span style={{flex:1,fontSize:'0.8rem',fontWeight:700,color:col,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username}</span>
      {/* Rank icon — fixed size, consistent for all ranks */}
      <RIcon rank={u.rank} size={16}/>
      {u.countryCode&&u.countryCode!=='ZZ'&&<img src={`/icons/flags/${u.countryCode.toUpperCase()}.png`} alt="" style={{width:15,height:10,flexShrink:0,borderRadius:1}} onError={e=>e.target.style.display='none'}/>}
      {/* Whisper button — only on hover, uses its own row so it doesn't push icons */}
      {hov&&onWhisper&&(
        <button onClick={e=>{e.stopPropagation();onWhisper(u)}} title="Whisper"
          style={{position:'absolute',inset:0,left:'auto',right:0,width:32,height:'100%',background:'linear-gradient(90deg,transparent,rgba(99,102,241,.15) 40%)',border:'none',borderLeft:'1px solid #6366f133',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',color:'#6366f1'}}>
          👁️
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RIGHT SIDEBAR
// ─────────────────────────────────────────────────────────────
function RightSidebar({users,myLevel,onUserClick,onWhisper,onClose,tObj}) {
  const [tab,setTab]=useState('users')
  const [search,setSearch]=useState('')
  const [rankF,setRankF]=useState('all')
  const th=tObj||{bg_header:'#fff',bg_log:'#f3f4f6',text:'#111827',accent:'#1a73e8',default_color:'#e4e6ea'}

  const [friends,setFriends]=useState([])
  const sorted=[...users].sort((a,b)=>{const d=RL(b.rank)-RL(a.rank);return d!==0?d:(a.username||'').localeCompare(b.username||'')})
  const staff=sorted.filter(u=>RL(u.rank)>=11)
  const base=tab==='staff'?staff:tab==='friends'?friends:sorted
  useEffect(()=>{
    if(tab!=='friends') return
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/users/me/friends`,{headers:{Authorization:`Bearer ${t}`}})
      .then(r=>r.json()).then(d=>setFriends(d.friends||[])).catch(()=>{})
  },[tab])

  const filtered= tab==='friends' ? friends :
    base.filter(u=>{
      if(tab==='search') return (!search||u.username.toLowerCase().includes(search.toLowerCase()))&&(rankF==='all'||u.rank===rankF)
      return true
    })

  const TABS=[
    {id:'users',   icon:'fi-sr-users',        title:'Users'},
    {id:'friends', icon:'fi-sr-user',          title:'Friends'},
    {id:'staff',   icon:'fi-sr-shield-check',  title:'Staff'},
    {id:'search',  icon:'fi-sr-search',        title:'Search'},
  ]

  return (
    <div style={{width:200,borderLeft:`1px solid ${th.default_color}44`,background:th.bg_header,display:'flex',flexDirection:'column',flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',borderBottom:`1px solid ${th.default_color}44`,flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} title={t.title}
            style={{flex:1,padding:'9px 2px',border:'none',background:'none',cursor:'pointer',borderBottom:`2px solid ${tab===t.id?th.accent:'transparent'}`,color:tab===t.id?th.accent:th.text+'88',fontSize:14,transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className={`fi ${t.icon}`}/>
          </button>
        ))}
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:th.text+'88',padding:'4px 7px',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
      </div>
      {tab==='search'&&(
        <div style={{padding:'6px 8px',borderBottom:`1px solid ${th.default_color}33`,flexShrink:0}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Username..."
            style={{width:'100%',padding:'5px 9px',background:th.bg_log||'rgba(255,255,255,.1)',border:`1.5px solid ${th.default_color}44`,borderRadius:7,fontSize:'0.78rem',outline:'none',boxSizing:'border-box',color:th.text,marginBottom:5,fontFamily:'Nunito,sans-serif'}}
            onFocus={e=>e.target.style.borderColor=th.accent} onBlur={e=>e.target.style.borderColor=`${th.default_color}44`}/>
          <select value={rankF} onChange={e=>setRankF(e.target.value)} style={{width:'100%',padding:'4px',background:th.bg_log||'rgba(255,255,255,.1)',border:`1px solid ${th.default_color}44`,borderRadius:6,fontSize:'0.73rem',outline:'none',color:th.text}}>
            <option value="all">All Ranks</option>
            {Object.entries(RANKS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      )}
      <div style={{padding:'4px 10px 2px',fontSize:'0.62rem',fontWeight:700,color:th.text+'66',letterSpacing:'1px',textTransform:'uppercase',flexShrink:0}}>
        {tab==='staff'?'Staff':tab==='friends'?'Friends':tab==='search'?'Results':'Online'} · {filtered.length}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {filtered.length===0
          ? <p style={{textAlign:'center',color:th.text+'66',fontSize:'0.76rem',padding:'14px 10px'}}>{tab==='staff'?'No staff online':tab==='friends'?'No friends online':tab==='search'?'No results':'No users'}</p>
          : filtered.map((u,i)=><UserItem key={u.userId||u._id||i} u={u} onClick={onUserClick} onWhisper={onWhisper}/>)
        }
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LEFT SIDEBAR — icon strip + label (like adultchat)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// STYLE PANEL — Inline version inside left sidebar
// ─────────────────────────────────────────────────────────────

const SOLID_COLORS = [
  '#ff3333','#ff6633','#ff9933','#ffcc33','#cccc00','#99cc00','#59b300','#829356',
  '#008000','#00e639','#00e673','#00e6ac','#00cccc','#03add8','#3366ff','#107896',
  '#004d99','#6633ff','#9933ff','#cc33ff','#ff33ff','#ff33cc','#ff3399','#ff3366',
  '#604439','#795548','#a97f70','#bc9b8f','#9E9E9E','#879fab','#698796','#495f69',
]
const BUB_GRADS = [
  'linear-gradient(90deg,#667eea,#764ba2)','linear-gradient(90deg,#f093fb,#f5576c)',
  'linear-gradient(90deg,#4facfe,#00f2fe)','linear-gradient(90deg,#43e97b,#38f9d7)',
  'linear-gradient(90deg,#fa709a,#fee140)','linear-gradient(90deg,#ff9a56,#ff6b9d)',
  'linear-gradient(90deg,#c471f5,#fa71cd)','linear-gradient(90deg,#12c2e9,#c471ed)',
  'linear-gradient(90deg,#f64f59,#c471ed)','linear-gradient(90deg,#24fe41,#fdbb2d)',
  'linear-gradient(45deg,#ff0844,#ffb199)','linear-gradient(45deg,#00d2ff,#3a7bd5)',
  'linear-gradient(45deg,#f953c6,#b91d73)','linear-gradient(45deg,#36d1dc,#5b86e5)',
  'linear-gradient(45deg,#ff9068,#fd746c)','linear-gradient(45deg,#667eea,#764ba2)',
]
const CHAT_THEMES = [
  {id:'Dark',        name:'Dark',        bg:'#151515', header:'#111', accent:'#03add8'},
  {id:'Arc',         name:'Arc',         bg:'#181a21', header:'linear-gradient(to top,#21252f,#2b3140)', accent:'#5774b7'},
  {id:'Purple',      name:'Purple',      bg:'#29165f', header:'#150442', accent:'#9773fb'},
  {id:'Blue',        name:'Blue',        bg:'#013259', header:'#001e37', accent:'#1e9aff'},
  {id:'Whatsapp',    name:'Whatsapp',    bg:'#0b141a', header:'linear-gradient(#202c33,#0b141a)', accent:'#00a884'},
  {id:'Nord',        name:'Nord',        bg:'#2e3440', header:'linear-gradient(#272833,#30343e)', accent:'#6e89c4'},
  {id:'Obsidian',    name:'Obsidian',    bg:'#0b0d18', header:'linear-gradient(#0d101e,#121425)', accent:'#4a63cf'},
  {id:'Remix',       name:'Remix',       bg:'#0F1221', header:'#011448', accent:'#3b6cff'},
  {id:'Lite',        name:'Lite',        bg:'#fff',    header:'#222', accent:'#03add8'},
  {id:'Dolphin',     name:'Dolphin',     bg:'#fff',    header:'#edf1f4', accent:'#ff5c00'},
  {id:'Halloween',   name:'Halloween',   bg:'#000',    header:'linear-gradient(#000,#672e00)', accent:'#ff7607'},
  {id:'Forest',      name:'Forest',      bg:'#1a1a1a', header:'rgba(17,17,17,.7)', accent:'#eeb266'},
]
const FONT_LIST = [
  {id:'font1',name:'Kalam',f:"'Kalam',cursive"},
  {id:'font2',name:'Signika',f:"'Signika',sans-serif"},
  {id:'font3',name:'Orbitron',f:"'Orbitron',sans-serif"},
  {id:'font4',name:'Comic Neue',f:"'Comic Neue',cursive"},
  {id:'font5',name:'Quicksand',f:"'Quicksand',sans-serif"},
  {id:'font6',name:'Pacifico',f:"'Pacifico',cursive"},
  {id:'font7',name:'Dancing Script',f:"'Dancing Script',cursive"},
  {id:'font8',name:'Lobster Two',f:"'Lobster Two',cursive"},
  {id:'font9',name:'Caveat',f:"'Caveat',cursive"},
  {id:'font10',name:'Rajdhani',f:"'Rajdhani',sans-serif"},
  {id:'font11',name:'Audiowide',f:"'Audiowide',sans-serif"},
  {id:'font12',name:'Nunito',f:"'Nunito',sans-serif"},
]

function StylePanelInline({type,onSaved}) {
  const [tab,setTab]=useState('solid')
  const [sel,setSel]=useState('')
  const [selFont,setSelFont]=useState('')
  const [fontStyle,setFontStyle]=useState('normal')
  const [msgColor,setMsgColor]=useState('#ffffff')
  const [selTheme,setSelTheme]=useState('Dolphin')
  const [saving,setSaving]=useState(false)
  const [ok,setOk]=useState('')

  const SW={width:28,height:28,borderRadius:5,cursor:'pointer',border:'2px solid transparent',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,margin:2,transition:'transform .1s'}

  async function save() {
    setSaving(true); setOk('')
    const token=localStorage.getItem('cgz_token')
    let body={}
    if(type==='nameColor') body={nameColor:sel||'',nameFont:selFont}
    else if(type==='bubbleColor') body={bubbleColor:sel,bubbleStyle:fontStyle,msgFontColor:msgColor,msgFontStyle:selFont}
    else if(type==='theme') body={chatTheme:selTheme}
    try{
      const r=await fetch(`${API}/api/users/me/style`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)})
      const d=await r.json()
      if(r.ok){setOk('Saved!');onSaved&&onSaved(d.user)}
    }catch{}
    setSaving(false)
  }

  return (
    <div style={{flex:1,overflowY:'auto',padding:'10px 8px'}}>
      {ok&&<div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:6,padding:'6px 10px',fontSize:11,color:'#15803d',marginBottom:8,textAlign:'center'}}>✅ {ok}</div>}

      {type==='nameColor'&&(
        <>
          {/* Preview */}
          <div style={{textAlign:'center',marginBottom:10,padding:'8px',background:'#f9fafb',borderRadius:6}}>
            <span style={{fontSize:14,fontWeight:800,fontFamily:FONT_LIST.find(f=>f.id===selFont)?.f||'inherit',
              ...(tab==='solid'&&sel?{color:SOLID_COLORS[parseInt(sel.replace('bcolor',''))-1]}:
                 tab==='gradient'&&sel?{background:BUB_GRADS[parseInt(sel.replace('bgrad',''))-1],WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}:
                 {})}}>
              Preview Name
            </span>
          </div>
          <div style={{display:'flex',gap:4,marginBottom:8}}>
            {['solid','gradient'].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'4px',borderRadius:4,border:`1px solid ${tab===t?'#1a73e8':'#e4e6ea'}`,background:tab===t?'#eff6ff':'none',color:tab===t?'#1a73e8':'#9ca3af',fontSize:10,fontWeight:700,cursor:'pointer',textTransform:'capitalize'}}>{t}</button>
            ))}
          </div>
          {tab==='solid'&&(
            <div style={{display:'flex',flexWrap:'wrap',marginBottom:10}}>
              <div onClick={()=>setSel('')} style={{...SW,background:'#f3f4f6',border:`2px solid ${sel===''?'#1a73e8':'#e4e6ea'}`}}>
                {sel===''&&<span style={{fontSize:10}}>✓</span>}
              </div>
              {SOLID_COLORS.map((c,i)=>(
                <div key={i} onClick={()=>setSel(`bcolor${i+1}`)} style={{...SW,background:c,border:`2px solid ${sel===`bcolor${i+1}`?'#fff':'transparent'}`,transform:sel===`bcolor${i+1}`?'scale(1.2)':'scale(1)'}}>
                  {sel===`bcolor${i+1}`&&<span style={{color:'#fff',fontSize:9}}>✓</span>}
                </div>
              ))}
            </div>
          )}
          {tab==='gradient'&&(
            <div style={{display:'flex',flexWrap:'wrap',marginBottom:10}}>
              {BUB_GRADS.map((g,i)=>(
                <div key={i} onClick={()=>setSel(`bgrad${i+1}`)} style={{...SW,background:g,border:`2px solid ${sel===`bgrad${i+1}`?'#fff':'transparent'}`,transform:sel===`bgrad${i+1}`?'scale(1.2)':'scale(1)'}}>
                  {sel===`bgrad${i+1}`&&<span style={{color:'#fff',fontSize:9}}>✓</span>}
                </div>
              ))}
            </div>
          )}
          <div style={{fontSize:10,fontWeight:700,color:'#6b7280',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Name Font</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginBottom:10}}>
            <div onClick={()=>setSelFont('')} style={{padding:'5px 6px',borderRadius:5,border:`1px solid ${selFont===''?'#1a73e8':'#e4e6ea'}`,background:selFont===''?'#eff6ff':'#f9fafb',cursor:'pointer',fontSize:11,textAlign:'center',color:selFont===''?'#1a73e8':'#374151'}}>Default</div>
            {FONT_LIST.slice(0,5).map(f=>(
              <div key={f.id} onClick={()=>setSelFont(f.id)} style={{padding:'5px 6px',borderRadius:5,border:`1px solid ${selFont===f.id?'#1a73e8':'#e4e6ea'}`,background:selFont===f.id?'#eff6ff':'#f9fafb',cursor:'pointer',fontSize:11,textAlign:'center',fontFamily:f.f,color:selFont===f.id?'#1a73e8':'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
            ))}
          </div>
        </>
      )}

      {type==='bubbleColor'&&(
        <>
          {/* Preview bubble */}
          <div style={{marginBottom:10,padding:'8px',background:'#f9fafb',borderRadius:6}}>
            <div style={{display:'inline-block',padding:'6px 10px',borderRadius:'3px 10px 10px 10px',fontSize:12,
              fontWeight:fontStyle.includes('bold')?700:400,
              fontStyle:fontStyle.includes('italic')?'italic':'normal',
              fontFamily:FONT_LIST.find(f=>f.id===selFont)?.f||'inherit',
              color:msgColor||'#fff',
              ...(tab==='solid'&&sel?{background:SOLID_COLORS[parseInt(sel.replace('bubcolor',''))-1]}:
                 (tab==='gradient'||tab==='neon')&&sel?{background:BUB_GRADS[parseInt(sel.replace(/bubgrad|bubneon/,''))-1]}:
                 {background:'#f3f4f6',color:'#111'})}}>
              Hey! Preview 👋
            </div>
          </div>
          <div style={{display:'flex',gap:4,marginBottom:8}}>
            {['solid','gradient','neon'].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'4px',borderRadius:4,border:`1px solid ${tab===t?'#1a73e8':'#e4e6ea'}`,background:tab===t?'#eff6ff':'none',color:tab===t?'#1a73e8':'#9ca3af',fontSize:10,fontWeight:700,cursor:'pointer',textTransform:'capitalize'}}>{t}</button>
            ))}
          </div>
          <div style={{display:'flex',flexWrap:'wrap',marginBottom:10}}>
            <div onClick={()=>setSel('')} style={{...SW,background:'#f3f4f6',border:`2px solid ${sel===''?'#1a73e8':'#e4e6ea'}`}}>
              {sel===''&&<span style={{fontSize:9}}>def</span>}
            </div>
            {SOLID_COLORS.map((c,i)=>(
              <div key={i} onClick={()=>setSel(`bubcolor${i+1}`)} style={{...SW,background:c,border:`2px solid ${sel===`bubcolor${i+1}`?'#fff':'transparent'}`,transform:sel===`bubcolor${i+1}`?'scale(1.2)':'scale(1)'}}>
                {sel===`bubcolor${i+1}`&&<span style={{color:'#fff',fontSize:9}}>✓</span>}
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#6b7280',marginBottom:4,textTransform:'uppercase'}}>Text Color</div>
              <input type="color" value={msgColor} onChange={e=>setMsgColor(e.target.value)} style={{width:'100%',height:32,borderRadius:5,border:'1px solid #e4e6ea',cursor:'pointer'}}/>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#6b7280',marginBottom:4,textTransform:'uppercase'}}>Style</div>
              <select value={fontStyle} onChange={e=>setFontStyle(e.target.value)} style={{width:'100%',padding:'5px 6px',border:'1px solid #e4e6ea',borderRadius:5,fontSize:11,background:'#f9fafb',outline:'none',cursor:'pointer'}}>
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="italic">Italic</option>
                <option value="bold italic">Bold Italic</option>
              </select>
            </div>
          </div>
          <div style={{fontSize:10,fontWeight:700,color:'#6b7280',marginBottom:5,textTransform:'uppercase'}}>Font</div>
          <select value={selFont} onChange={e=>setSelFont(e.target.value)} style={{width:'100%',padding:'6px 8px',border:'1px solid #e4e6ea',borderRadius:5,fontSize:12,background:'#f9fafb',outline:'none',cursor:'pointer',marginBottom:10}}>
            <option value="">Default Font</option>
            {FONT_LIST.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </>
      )}

      {type==='theme'&&(
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
            {CHAT_THEMES.map(t=>(
              <div key={t.id} onClick={()=>setSelTheme(t.id)} style={{borderRadius:7,overflow:'hidden',border:`2px solid ${selTheme===t.id?'#1a73e8':'#e4e6ea'}`,cursor:'pointer',transform:selTheme===t.id?'scale(1.03)':'scale(1)',transition:'all .15s'}}>
                <div style={{background:t.header,padding:'4px 8px',display:'flex',alignItems:'center',gap:4}}>
                  {selTheme===t.id&&<span style={{fontSize:8,color:t.accent}}>✓</span>}
                  <span style={{fontSize:9,fontWeight:700,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</span>
                </div>
                <div style={{background:t.bg,padding:'4px 8px',height:24}}>
                  <div style={{background:t.accent+'44',borderRadius:3,padding:'2px 6px',display:'inline-block'}}>
                    <span style={{fontSize:8,color:t.accent}}>Hello 👋</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={save} disabled={saving} style={{width:'100%',padding:'9px',borderRadius:7,border:'none',background:saving?'#9ca3af':'#1a73e8',color:'#fff',fontWeight:800,fontSize:12,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit'}}>
        {saving?'Saving…':'💾 Apply Style'}
      </button>
    </div>
  )
}

function LeftSidebar({room,nav,socket,roomId,onClose,me,onStyleSaved}) {
  const [panel,setPanel]=useState(null)
  // Icons match adultchat: fa-rss for wall, fa-newspaper for news, fa-comments for forum
  const ITEMS=[
    {id:'rooms',       icon:'fi-sr-house-chimney',  label:'Room List',    color:'#1a73e8'},
    {id:'wall',        icon:'fi-sr-rss',             label:'Friends Wall', color:'#7c3aed'},
    {id:'news',        icon:'fi-sr-newspaper',       label:'News',         color:'#059669'},
    {id:'forum',       icon:'fi-sr-comments-alt',    label:'Forum',        color:'#f59e0b'},
    {id:'games',       icon:'fi-sr-dice',            label:'Games',        color:'#ec4899'},
    {id:'leaderboard', icon:'fi-sr-medal',           label:'Leaderboards', color:'#d97706'},
    {id:'username',    icon:'fi-sr-user-pen',        label:'Username',     color:'#6366f1'},
    {id:'contact',     icon:'fi-sr-envelope',        label:'Contact',      color:'#14b8a6'},
    {id:'premium',     icon:'fi-sr-diamond', img:'/icons/ranks/premium.svg', label:'Premium', color:'#aa44ff'},
    {id:'namecolor',   icon:'fi-sr-brush',           label:'Name Style',   color:'#ec4899'},
    {id:'bubblesyle',  icon:'fi-sr-comment-alt',     label:'Bubble Style', color:'#8b5cf6'},
    {id:'theme',       icon:'fi-sr-palette',         label:'Theme',        color:'#14b8a6'},
  ]

  return (
    <div style={{display:'flex',height:'100%',flexShrink:0}}>
      {/* Icon strip with labels - like adultchat left menu */}
      <div style={{width:56,background:'#f8f9fa',borderRight:'1px solid #e4e6ea',display:'flex',flexDirection:'column',alignItems:'center',padding:'6px 0',gap:1,overflowY:'auto'}}>
        {/* Room icon at top */}
        <div style={{padding:'4px 0 8px',borderBottom:'1px solid #2d3148',width:'100%',textAlign:'center',marginBottom:4}}>
          <img src={room?.icon||'/default_images/rooms/default_room.png'} alt="" style={{width:28,height:28,borderRadius:7,objectFit:'cover',margin:'0 auto',display:'block'}} onError={e=>e.target.style.display='none'}/>
          <div style={{fontSize:'0.5rem',color:'#9ca3af',fontWeight:600,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',padding:'0 2px'}}>{room?.name||'Room'}</div>
        </div>
        {ITEMS.map(item=>(
          <button key={item.id} title={item.label} onClick={()=>setPanel(p=>p===item.id?null:item.id)}
            style={{width:'100%',padding:'7px 2px 5px',border:'none',background:panel===item.id?`${item.color}15`:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,color:panel===item.id?item.color:'#6b7280',transition:'all .12s',borderLeft:panel===item.id?`2px solid ${item.color}`:'2px solid transparent'}}
            onMouseEnter={e=>{if(panel!==item.id){e.currentTarget.style.background=`${item.color}10`;e.currentTarget.style.color=item.color}}}
            onMouseLeave={e=>{if(panel!==item.id){e.currentTarget.style.background='none';e.currentTarget.style.color='#8892b0'}}}>
            <i className={`fi ${item.icon}`} style={{fontSize:16}}/>
            <span style={{fontSize:'0.48rem',fontWeight:700,letterSpacing:'0.2px',textAlign:'center',lineHeight:1.2,maxWidth:48,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      {panel&&(
        <div style={{width:240,background:'#fff',borderRight:'1px solid #e4e6ea',display:'flex',flexDirection:'column',boxShadow:'2px 0 8px rgba(0,0,0,.07)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderBottom:'1px solid #e4e6ea',flexShrink:0}}>
            <span style={{fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'0.9rem',color:'#111827'}}>{ITEMS.find(i=>i.id===panel)?.label}</span>
            <button onClick={()=>setPanel(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:13}}><i className="fi fi-sr-cross-small"/></button>
          </div>
          {panel==='rooms'      &&<RoomListPanel nav={nav}/>}
          {panel==='games'      &&<GamesPanel socket={socket} roomId={roomId} myGold={me?.gold||0}/>}
          {panel==='leaderboard'&&<LeaderboardPanel/>}
          {panel==='username'   &&<UsernamePanel/>}
          {panel==='news'       &&<SimplePanel icon="📰" msg="No announcements yet."/>}
          {panel==='wall'       &&<SimplePanel icon="📝" msg="Wall posts coming soon!"/>}
          {panel==='forum'      &&<SimplePanel icon="💬" msg="Forum coming soon!"/>}
          {panel==='contact'    &&<ContactPanel/>}
          {panel==='premium'    &&<PremiumPanel/>}
          {(panel==='namecolor'||panel==='bubblesyle'||panel==='theme')&&<StylePanelInline type={panel==='namecolor'?'nameColor':panel==='bubblesyle'?'bubbleColor':'theme'} onSaved={onStyleSaved}/>}
        </div>
      )}
    </div>
  )
}

function SimplePanel({icon,msg}) {
  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center',color:'#9ca3af'}}>
      <div style={{fontSize:32,marginBottom:8}}>{icon}</div>
      <div style={{fontSize:'0.8rem'}}>{msg}</div>
    </div>
  )
}

function ContactPanel() {
  const [sent,setSent]=useState(false), [msg,setMsg]=useState(''), [sub,setSub]=useState('')
  const token=localStorage.getItem('cgz_token')
  async function submit(e) {
    e.preventDefault()
    if(!msg.trim()) return
    await fetch(`${API}/api/contact`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({subject:sub||'Support',message:msg})}).catch(()=>{})
    setSent(true)
  }
  if(sent) return <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center'}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div style={{fontWeight:700,color:'#059669'}}>Message Sent!</div></div>
  return(
    <div style={{flex:1,padding:12,display:'flex',flexDirection:'column',gap:8}}>
      <input value={sub} onChange={e=>setSub(e.target.value)} placeholder="Subject..."
        style={{padding:'8px 12px',border:'1.5px solid #e4e6ea',borderRadius:8,fontSize:'0.84rem',outline:'none'}}/>
      <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Your message..." rows={5}
        style={{padding:'8px 12px',border:'1.5px solid #e4e6ea',borderRadius:8,fontSize:'0.84rem',outline:'none',resize:'none'}}/>
      <button onClick={submit} style={{padding:'10px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#14b8a6,#0d9488)',color:'#fff',fontWeight:700,cursor:'pointer'}}>Send</button>
    </div>
  )
}

function PremiumPanel() {
  return(
    <div style={{flex:1,padding:12,overflowY:'auto'}}>
      <div style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',borderRadius:12,padding:14,marginBottom:12,textAlign:'center',color:'#fff'}}>
        <div style={{fontSize:28,marginBottom:4}}>💎</div>
        <div style={{fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1rem'}}>Go Premium</div>
      </div>
      {[{d:7,p:199,b:'Weekly'},{d:30,p:599,b:'Monthly'},{d:90,p:1499,b:'3 Months'},{d:365,p:4999,b:'1 Year',best:true}].map(plan=>(
        <div key={plan.d} style={{background:plan.best?'#fef3c7':'#f9fafb',border:`1.5px solid ${plan.best?'#f59e0b':'#e4e6ea'}`,borderRadius:9,padding:'10px 12px',marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700,fontSize:'0.88rem',color:'#111827'}}>{plan.b}{plan.best?' ⭐':''}</div>
              <div style={{fontSize:'0.73rem',color:'#9ca3af'}}>{plan.d} days</div>
            </div>
            <div style={{fontWeight:800,color:'#d97706',fontSize:'0.95rem'}}>{plan.p} 🪙</div>
          </div>
          <button style={{width:'100%',marginTop:7,padding:'7px',borderRadius:7,border:'none',background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.82rem'}}>Buy with Gold</button>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ROOM LIST PANEL
// ─────────────────────────────────────────────────────────────
function RoomListPanel({nav}) {
  const [rooms,setRooms]=useState([]), [load,setLoad]=useState(true)
  useEffect(()=>{
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/rooms`,{headers:{Authorization:`Bearer ${t}`}}).then(r=>r.json()).then(d=>setRooms(d.rooms||[])).catch(()=>{}).finally(()=>setLoad(false))
  },[])
  if(load) return <div style={{textAlign:'center',padding:20}}><div style={{width:22,height:22,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>
  return (
    <div style={{flex:1,overflowY:'auto'}}>
      {rooms.map(r=>(
        <div key={r._id} onClick={()=>nav(`/chat/${r._id}`)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',cursor:'pointer',borderBottom:'1px solid #f3f4f6',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <img src={r.icon||'/default_images/rooms/default_room.png'} alt="" style={{width:42,height:42,borderRadius:9,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'0.85rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{r.name}</div>
            <div style={{fontSize:'0.7rem',color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{r.description||''}</div>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <img src={`/default_images/rooms/${r.type||'public'}_room.svg`} alt="" style={{width:13,height:13}} onError={e=>e.target.style.display='none'}/>
              <img src="/default_images/rooms/user_count.svg" alt="" style={{width:12,height:12}} onError={e=>e.target.style.display='none'}/>
              <span style={{fontSize:'0.7rem',fontWeight:600,color:(r.currentUsers||0)>0?'#22c55e':'#9ca3af'}}>{r.currentUsers||0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// GAMES PANEL — with SpinWheel
// ─────────────────────────────────────────────────────────────
// ── KENO GAME ──
// ── DICE ANIMATION COMPONENT ──
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
// ─────────────────────────────────────────────────────────────
function LeaderboardPanel() {
  const [data,setData]=useState([]), [type,setType]=useState('xp'), [period,setPeriod]=useState('all'), [load,setLoad]=useState(false)
  useEffect(()=>{
    setLoad(true)
    const t=localStorage.getItem('cgz_token')
    fetch(`${API}/api/leaderboard/${type}?period=${period}`,{headers:{Authorization:`Bearer ${t}`}})
      .then(r=>r.json()).then(d=>setData(d.users||[])).catch(()=>{}).finally(()=>setLoad(false))
  },[type,period])

  const TABS=[
    {id:'xp',       label:'Top XP',    icon:'xp.svg',    color:'#7c3aed'},
    {id:'level',    label:'Top Level', icon:'level.svg', color:'#1a73e8'},
    {id:'gold',     label:'Top Gold',  icon:'gold.svg',  color:'#d97706'},
    {id:'gifts',    label:'Top Gifts', icon:'gift.svg',  color:'#ec4899'},
    {id:'messages', label:'Top Msgs',  icon:'comment.svg',color:'#059669'},
  ]

  const getVal=(u)=>{
    if(type==='xp')    return u.xp||0
    if(type==='level') return `Lv.${u.level||1}`
    if(type==='gold')  return u.gold||0
    if(type==='gifts') return u.totalGiftsReceived||0
    return 0
  }
  const MEDAL=['🥇','🥈','🥉']

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Tab buttons with SVG icons */}
      {/* Period tabs */}
      <div style={{display:'flex',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
        {['all','weekly','monthly'].map(p=>(
          <button key={p} onClick={()=>setPeriod(p)}
            style={{flex:1,padding:'7px 4px',border:'none',background:'none',cursor:'pointer',borderBottom:`2px solid ${period===p?'#1a73e8':'transparent'}`,color:period===p?'#1a73e8':'#9ca3af',fontSize:'0.72rem',fontWeight:700,transition:'all .15s',textTransform:'capitalize'}}>
            {p==='all'?'All Time':p==='weekly'?'Weekly':'Monthly'}
          </button>
        ))}
      </div>
      {/* Type tabs with icons */}
      <div style={{display:'flex',gap:3,padding:'6px 6px 2px',overflowX:'auto',flexShrink:0}}>
        {TABS.map(tp=>(
          <button key={tp.id} onClick={()=>setType(tp.id)}
            style={{display:'flex',alignItems:'center',gap:4,padding:'5px 8px',borderRadius:20,border:`1.5px solid ${type===tp.id?tp.color:'#e4e6ea'}`,background:type===tp.id?`${tp.color}18`:'none',cursor:'pointer',flexShrink:0,transition:'all .15s'}}>
            <img src={`/default_images/icons/${tp.icon}`} alt="" style={{width:14,height:14,objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
            <span style={{fontSize:'0.68rem',fontWeight:700,color:type===tp.id?tp.color:'#6b7280',whiteSpace:'nowrap'}}>{tp.label}</span>
          </button>
        ))}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {load?<div style={{textAlign:'center',padding:16}}><div style={{width:20,height:20,border:'2px solid #e4e6ea',borderTop:'2px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/></div>
        :data.length===0?<div style={{textAlign:'center',padding:20,color:'#9ca3af',fontSize:'0.8rem'}}>No data</div>
        :data.map((u,i)=>(
          <div key={u._id||i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderBottom:'1px solid #f3f4f6'}}>
            <span style={{fontSize:'0.9rem',width:22,flexShrink:0,textAlign:'center'}}>{i<3?MEDAL[i]:`${i+1}`}</span>
            <img src={u.avatar||'/default_images/avatar/default_guest.png'} alt="" style={{width:26,height:26,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`1.5px solid ${GBR(u.gender,u.rank)}`}} onError={e=>{e.target.src='/default_images/avatar/default_guest.png'}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.8rem',fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username}</div>
              <div style={{display:'flex',alignItems:'center',gap:3}}><RIcon rank={u.rank} size={10}/><span style={{fontSize:'0.65rem',color:R(u.rank).color}}>{R(u.rank).label}</span></div>
            </div>
            <span style={{fontSize:'0.82rem',fontWeight:800,color:TABS.find(t=>t.id===type)?.color||'#1a73e8',flexShrink:0}}>{getVal(u)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// USERNAME PANEL
// ─────────────────────────────────────────────────────────────
function UsernamePanel() {
  const [val,setVal]=useState(''), [msg,setMsg]=useState('')
  async function change() {
    const t=localStorage.getItem('cgz_token')
    const r=await fetch(`${API}/api/users/change-username`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify({newUsername:val})})
    const d=await r.json()
    setMsg(r.ok?'✅ Username changed!':d.error||'Failed')
  }
  return (
    <div style={{padding:14,flex:1}}>
      <div style={{background:'#fef3c7',border:'1px solid #fde68a',borderRadius:8,padding:'9px 12px',marginBottom:12,fontSize:'0.78rem',color:'#92400e'}}>
        Username change costs <strong>500 Gold</strong>
      </div>
      {msg&&<div style={{background:msg.startsWith('✅')?'#d1fae5':'#fee2e2',borderRadius:7,padding:'7px 10px',fontSize:'0.78rem',color:msg.startsWith('✅')?'#065f46':'#dc2626',marginBottom:10}}>{msg}</div>}
      <input value={val} onChange={e=>setVal(e.target.value)} placeholder="New username..."
        style={{width:'100%',padding:'9px 12px',border:'1.5px solid #e4e6ea',borderRadius:8,fontSize:'0.875rem',outline:'none',boxSizing:'border-box',color:'#111827',background:'#f9fafb',marginBottom:8,fontFamily:'Nunito,sans-serif'}}
        onFocus={e=>e.target.style.borderColor='#1a73e8'} onBlur={e=>e.target.style.borderColor='#e4e6ea'}/>
      <button onClick={change} style={{width:'100%',padding:'10px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.875rem',fontFamily:'Outfit,sans-serif'}}>
        Change Username
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RADIO PANEL
// ─────────────────────────────────────────────────────────────

export { UserItem, RightSidebar, StylePanelInline, LeftSidebar, LeaderboardPanel, UsernamePanel }
