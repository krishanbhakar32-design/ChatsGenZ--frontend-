import { useState, useEffect, useRef } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import ScrollToTop from '../components/ScrollToTop.jsx'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// Popup Ad Component - shows from bottom on both mobile and PC
function PopupAd() {
  const [show, setShow] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    // Show popup after 2 seconds
    const timer = setTimeout(() => {
      setShow(true)
    }, 2000)

    // Auto-hide after 15 seconds
    const hideTimer = setTimeout(() => {
      setShow(false)
    }, 17000)

    return () => {
      clearTimeout(timer)
      clearTimeout(hideTimer)
    }
  }, [])

  useEffect(() => {
    if (!show || !ref.current) return
    
    const script = document.createElement('script')
    script.src = 'https://a.magsrv.com/ad-provider.js'
    script.async = true
    script.onload = () => {
      window.AdProvider = window.AdProvider || []
      window.AdProvider.push({ serve: {} })
    }
    document.head.appendChild(script)
  }, [show])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#fff',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
      animation: 'slideUp 0.3s ease-out',
      padding: '12px 16px',
      maxHeight: '40vh',
      overflow: 'hidden'
    }}>
      <button 
        onClick={() => setShow(false)}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: '#ef4444',
          border: 'none',
          color: '#fff',
          width: 28,
          height: 28,
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 'bold',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
      <div ref={ref} style={{ textAlign: 'center' }}>
        <ins className="eas6a97888e31" data-zoneid="5884708"></ins>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// Login/Register Components (keeping existing structure)
function Overlay({ onClose, children }) {
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(8,14,26,.85)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:430,maxHeight:'94vh',overflowY:'auto',boxShadow:'0 28px 72px rgba(0,0,0,.5)' }}>
        {children}
      </div>
    </div>
  )
}

const IS = { display:'block',width:'100%',padding:'11px 14px 11px 40px',border:'1.5px solid #e0e4ea',borderRadius:9,fontSize:'0.875rem',color:'#111827',fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:'#f9fafb',transition:'all .15s' }
const onF = e => { e.target.style.borderColor='#1a73e8'; e.target.style.background='#fff' }
const onB = e => { e.target.style.borderColor='#e0e4ea'; e.target.style.background='#f9fafb' }
const Lbl = ({ c }) => <label style={{ display:'block',fontSize:'0.79rem',fontWeight:700,color:'#6b7280',marginBottom:5 }}>{c}</label>
const Err = ({ m }) => m ? <div style={{ background:'#fef2f2',border:'1px solid #fecaca',borderRadius:9,padding:'10px 14px',fontSize:'0.83rem',color:'#dc2626',marginBottom:12,lineHeight:1.55,display:'flex',alignItems:'flex-start',gap:8 }}><span>⚠️</span><span>{m}</span></div> : null
const Ok  = ({ m }) => m ? <div style={{ background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:9,padding:'10px 14px',fontSize:'0.83rem',color:'#16a34a',marginBottom:12,display:'flex',alignItems:'center',gap:8 }}><span>✅</span><span>{m}</span></div> : null
const Spin = () => <span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block',flexShrink:0 }} />

function FW({ icon, children }) {
  return (
    <div style={{ position:'relative' }}>
      <i className={`fi ${icon}`} style={{ position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:14,pointerEvents:'none',zIndex:1 }} />
      {children}
    </div>
  )
}

function PwdField({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <i className="fi fi-sr-lock" style={{ position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:14,pointerEvents:'none',zIndex:1 }} />
      <input type={show?'text':'password'} value={value} onChange={onChange} placeholder={placeholder} style={{ ...IS, paddingRight:44 }} onFocus={onF} onBlur={onB} required />
      <button type="button" onClick={()=>setShow(s=>!s)} style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:15,display:'flex',alignItems:'center',padding:2 }}>
        <i className={`fi ${show?'fi-sr-eye-crossed':'fi-sr-eye'}`} />
      </button>
    </div>
  )
}

function Head({ bg, icon, title, sub, onClose, onBack }) {
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22 }}>
      <div style={{ display:'flex',alignItems:'center',gap:11 }}>
        {onBack && <button onClick={onBack} style={{ background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:15,padding:'0 6px 0 0',display:'flex',alignItems:'center' }}><i className="fi fi-sr-angle-left" /></button>}
        <div style={{ width:40,height:40,background:bg,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <i className={`fi fi-sr-${icon}`} style={{ color:'#fff',fontSize:17 }} />
        </div>
        <div>
          <div style={{ fontFamily:'Outfit,sans-serif',fontWeight:900,fontSize:'1.05rem',color:'#111827' }}>{title}</div>
          <div style={{ fontSize:'0.72rem',color:'#9ca3af',marginTop:1 }}>{sub}</div>
        </div>
      </div>
      <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:20,padding:4,lineHeight:1,display:'flex',alignItems:'center' }}>
        <i className="fi fi-sr-cross-small" />
      </button>
    </div>
  )
}

function Btn({ loading, text, loadText, bg, color, shadow, onClick, type='submit', disabled }) {
  return (
    <button type={type} onClick={onClick} disabled={loading||disabled} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'13px',borderRadius:10,border:'none',width:'100%',background:(loading||disabled)?'#d1d5db':bg,color:color||'#fff',fontWeight:800,fontSize:'0.9rem',fontFamily:'Outfit,sans-serif',cursor:(loading||disabled)?'not-allowed':'pointer',boxShadow:(loading||disabled)?'none':shadow||'0 3px 14px rgba(26,115,232,.28)',transition:'all .15s',marginTop:6 }}>
      {loading ? <><Spin />{loadText||'Please wait...'}</> : text}
    </button>
  )
}

function OTPStep({ userId, email, username, onClose }) {
  const [otp,setOtp]=useState(''); const [err,setErr]=useState(''); const [ok,setOk]=useState(''); const [load,setLoad]=useState(false); const [rl,setRl]=useState(false)
  async function verify(e){
    e.preventDefault(); if(otp.length!==6) return setErr('OTP must be 6 digits')
    setLoad(true);setErr('');setOk('')
    try{
      const r=await fetch(`${API}/api/auth/verify-email`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,otp})})
      const d=await r.json()
      if(r.ok&&d.success){localStorage.setItem('cgz_token',d.token);window.location.href='/chat'}
      else setErr(d.error||'Invalid OTP')
    }catch{setErr('Network error')}finally{setLoad(false)}
  }
  async function resend(){
    setRl(true);setErr('');setOk('')
    try{
      const r=await fetch(`${API}/api/auth/resend-otp`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId})})
      const d=await r.json()
      if(r.ok)setOk('✅ OTP sent!')
      else setErr(d.error||'Failed to resend')
    }catch{setErr('Network error')}finally{setRl(false);setTimeout(()=>setOk(''),3000)}
  }
  return(<>
    <Head bg="linear-gradient(135deg,#16a34a,#15803d)" icon="shield-check" title="Verify Email" sub={`We sent OTP to ${email}`} onClose={onClose}/>
    <Err m={err}/><Ok m={ok}/>
    <form onSubmit={verify} style={{display:'flex',flexDirection:'column',gap:11}}>
      <div><Lbl c="Enter 6-Digit OTP"/><FW icon="fi-sr-key"><input style={IS} placeholder="000000" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} onFocus={onF} onBlur={onB} maxLength={6} required/></FW></div>
      <Btn loading={load} text={<><i className="fi fi-sr-check-circle"/>Verify & Continue</>} loadText="Verifying..." bg="linear-gradient(135deg,#16a34a,#15803d)" shadow="0 3px 12px rgba(22,163,74,.28)"/>
    </form>
    <p style={{textAlign:'center',fontSize:'0.78rem',color:'#9ca3af',marginTop:12}}>Didn't receive?<button onClick={resend} disabled={rl} style={{background:'none',border:'none',color:'#1a73e8',fontWeight:700,fontSize:'0.78rem',cursor:rl?'not-allowed':'pointer',padding:'0 0 0 4px'}}>{rl?'Sending...':'Resend OTP'}</button></p>
  </>)
}

function LoginModal({ onClose }) {
  const [user,setUser]=useState(''); const [pwd,setPwd]=useState(''); const [err,setErr]=useState(''); const [load,setLoad]=useState(false)
  const [forgot,setForgot]=useState(false); const [email,setEmail]=useState(''); const [ok,setOk]=useState('')
  async function login(e){
    e.preventDefault(); setLoad(true);setErr('')
    try{
      const r=await fetch(`${API}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:user.trim(),password:pwd})})
      const d=await r.json()
      if(r.ok&&d.success){localStorage.setItem('cgz_token',d.token);window.location.href='/chat'}
      else setErr(d.error||'Login failed')
    }catch{setErr('Network error')}finally{setLoad(false)}
  }
  async function sendReset(e){
    e.preventDefault(); setLoad(true);setErr('');setOk('')
    try{
      const r=await fetch(`${API}/api/auth/forgot-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim().toLowerCase()})})
      const d=await r.json()
      if(r.ok)setOk('✅ Reset link sent!')
      else setErr(d.error||'Failed')
    }catch{setErr('Network error')}finally{setLoad(false);setTimeout(()=>setOk(''),4000)}
  }
  if(forgot)return(<Overlay onClose={onClose}><div style={{padding:'24px 22px'}}>
    <Head bg="linear-gradient(135deg,#f59e0b,#d97706)" icon="key" title="Reset Password" sub="Enter your email" onClose={onClose} onBack={()=>setForgot(false)}/>
    <Err m={err}/><Ok m={ok}/>
    <form onSubmit={sendReset} style={{display:'flex',flexDirection:'column',gap:11}}>
      <div><Lbl c="Email"/><FW icon="fi-sr-envelope"><input type="email" style={IS} placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onFocus={onF} onBlur={onB} required/></FW></div>
      <Btn loading={load} text={<><i className="fi fi-sr-paper-plane"/>Send Reset Link</>} loadText="Sending..." bg="linear-gradient(135deg,#f59e0b,#d97706)" shadow="0 3px 12px rgba(245,158,11,.28)"/>
    </form>
  </div></Overlay>)
  return(<Overlay onClose={onClose}><div style={{padding:'24px 22px'}}>
    <Head bg="linear-gradient(135deg,#1a73e8,#1557b0)" icon="sign-in" title="Welcome Back!" sub="Login to ChatsGenZ" onClose={onClose}/>
    <Err m={err}/>
    <form onSubmit={login} style={{display:'flex',flexDirection:'column',gap:11}}>
      <div><Lbl c="Username or Email"/><FW icon="fi-sr-user"><input style={IS} placeholder="Enter username or email" value={user} onChange={e=>setUser(e.target.value)} onFocus={onF} onBlur={onB} required/></FW></div>
      <div><Lbl c="Password"/><PwdField value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Enter password"/></div>
      <Btn loading={load} text="Login" loadText="Logging in..." bg="linear-gradient(135deg,#1a73e8,#1557b0)"/>
    </form>
    <div style={{textAlign:'center',marginTop:16,display:'flex',flexDirection:'column',gap:7}}>
      <button onClick={()=>setForgot(true)} style={{background:'none',border:'none',color:'#1a73e8',fontSize:'0.82rem',fontWeight:700,cursor:'pointer'}}>Forgot Password?</button>
      <button onClick={onClose} style={{background:'none',border:'none',color:'#9ca3af',fontSize:'0.78rem',fontWeight:600,cursor:'pointer'}}>Don't have account? <span style={{color:'#7c3aed',fontWeight:800}}>Register free →</span></button>
    </div>
  </div></Overlay>)
}

function GuestModal({ onClose }) {
  const months=['January','February','March','April','May','June','July','August','September','October','November','December']
  const curYear=new Date().getFullYear(); const years=Array.from({length:82},(_,i)=>curYear-18-i); const days=Array.from({length:31},(_,i)=>i+1)
  const [form,setForm]=useState({username:'',day:'',month:'',year:'',gender:''}); const [err,setErr]=useState(''); const [load,setLoad]=useState(false)
  const ss={...IS,paddingLeft:14,padding:'10px 8px',appearance:'none'}
  async function submit(e){
    e.preventDefault()
    if(!form.gender){setErr('Please select gender');return}
    if(!form.day||!form.month||!form.year){setErr('Enter date of birth');return}
    setLoad(true);setErr('')
    try{
      const dob=`${form.year}-${String(months.indexOf(form.month)+1).padStart(2,'0')}-${String(form.day).padStart(2,'0')}`
      const r=await fetch(`${API}/api/auth/guest-login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:form.username.trim(),dob,gender:form.gender})})
      const d=await r.json()
      if(r.ok&&d.success){localStorage.setItem('cgz_token',d.token);window.location.href='/chat'}
      else setErr(d.error||'Failed')
    }catch{setErr('Network error')}finally{setLoad(false)}
  }
  return(<Overlay onClose={onClose}><div style={{padding:'24px 22px'}}>
    <Head bg="linear-gradient(135deg,#16a34a,#15803d)" icon="bolt" title="Enter as Guest" sub="Start chatting instantly" onClose={onClose}/>
    <Err m={err}/>
    <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:11}}>
      <div><Lbl c="Username"/><FW icon="fi-sr-user"><input style={IS} placeholder="Guest username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} onFocus={onF} onBlur={onB} required/></FW></div>
      <div><Lbl c="Gender"/><FW icon="fi-sr-venus-mars"><select style={{...IS,appearance:'none',cursor:'pointer'}} value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))} onFocus={onF} onBlur={onB} required><option value="">Select gender...</option><option value="male">♂ Male</option><option value="female">♀ Female</option><option value="other">⚧ Other</option><option value="couple">💑 Couple</option></select></FW></div>
      <div><Lbl c={<span>Date of Birth &nbsp;<span style={{color:'#ef4444',fontSize:'0.69rem',fontWeight:700,background:'#fef2f2',padding:'1px 6px',borderRadius:4}}>18+ ONLY</span></span>}/><div style={{display:'grid',gridTemplateColumns:'1fr 2fr 1.5fr',gap:7}}><select style={ss} value={form.day} onChange={e=>setForm(f=>({...f,day:e.target.value}))} onFocus={onF} onBlur={onB} required><option value="">Day</option>{days.map(d=><option key={d}>{d}</option>)}</select><select style={ss} value={form.month} onChange={e=>setForm(f=>({...f,month:e.target.value}))} onFocus={onF} onBlur={onB} required><option value="">Month</option>{months.map(m=><option key={m}>{m}</option>)}</select><select style={ss} value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))} onFocus={onF} onBlur={onB} required><option value="">Year</option>{years.map(y=><option key={y}>{y}</option>)}</select></div></div>
      <Btn loading={load} text={<><i className="fi fi-sr-bolt"/>Enter as Guest</>} loadText="Entering..." bg="linear-gradient(135deg,#16a34a,#15803d)" shadow="0 3px 12px rgba(22,163,74,.28)"/>
    </form>
  </div></Overlay>)
}

function RegisterModal({ onClose }) {
  const months=['January','February','March','April','May','June','July','August','September','October','November','December']
  const curYear=new Date().getFullYear(); const years=Array.from({length:82},(_,i)=>curYear-18-i); const days=Array.from({length:31},(_,i)=>i+1)
  const [step,setStep]=useState('form'); const [otpData,setOtpData]=useState({}); const [form,setForm]=useState({username:'',email:'',password:'',confirm:'',day:'',month:'',year:'',gender:''}); const [err,setErr]=useState(''); const [load,setLoad]=useState(false)
  const ss={...IS,paddingLeft:14,padding:'10px 8px',appearance:'none'}
  async function submit(e){
    e.preventDefault()
    if(!form.gender){setErr('Select gender');return}
    if(!form.day||!form.month||!form.year){setErr('Enter date of birth');return}
    if(form.password!==form.confirm){setErr('Passwords do not match');return}
    if(form.password.length<6){setErr('Password min 6 chars');return}
    setLoad(true);setErr('')
    try{
      const dob=`${form.year}-${String(months.indexOf(form.month)+1).padStart(2,'0')}-${String(form.day).padStart(2,'0')}`
      const r=await fetch(`${API}/api/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:form.username.trim(),email:form.email.trim().toLowerCase(),password:form.password,gender:form.gender,dob})})
      const d=await r.json()
      if(r.ok&&d.success){if(d.needsOTP){setOtpData({userId:d.userId,email:form.email.trim().toLowerCase(),username:d.username});setStep('otp')}else{localStorage.setItem('cgz_token',d.token);window.location.href='/chat'}}
      else setErr(d.error||'Failed')
    }catch{setErr('Network error')}finally{setLoad(false)}
  }
  if(step==='otp')return<Overlay onClose={onClose}><div style={{padding:'24px 22px'}}><OTPStep {...otpData} onClose={onClose}/></div></Overlay>
  return(<Overlay onClose={onClose}><div style={{padding:'24px 22px'}}>
    <Head bg="linear-gradient(135deg,#7c3aed,#6d28d9)" icon="user-add" title="Create Account" sub="Join free forever" onClose={onClose}/>
    <Err m={err}/>
    <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:11}}>
      <div><Lbl c="Username"/><FW icon="fi-sr-user"><input style={IS} placeholder="3-20 chars" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} onFocus={onF} onBlur={onB} required/></FW></div>
      <div><Lbl c="Email"/><FW icon="fi-sr-envelope"><input type="email" style={IS} placeholder="your@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} onFocus={onF} onBlur={onB} required/></FW></div>
      <div><Lbl c="Password"/><PwdField value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Min 6 chars"/></div>
      <div><Lbl c="Confirm"/><PwdField value={form.confirm} onChange={e=>setForm(f=>({...f,confirm:e.target.value}))} placeholder="Repeat password"/></div>
      <div><Lbl c={<span>Date of Birth &nbsp;<span style={{color:'#ef4444',fontSize:'0.69rem',fontWeight:700,background:'#fef2f2',padding:'1px 6px',borderRadius:4}}>18+ ONLY</span></span>}/><div style={{display:'grid',gridTemplateColumns:'1fr 2fr 1.5fr',gap:7}}><select style={ss} value={form.day} onChange={e=>setForm(f=>({...f,day:e.target.value}))} onFocus={onF} onBlur={onB} required><option value="">Day</option>{days.map(d=><option key={d}>{d}</option>)}</select><select style={ss} value={form.month} onChange={e=>setForm(f=>({...f,month:e.target.value}))} onFocus={onF} onBlur={onB} required><option value="">Month</option>{months.map(m=><option key={m}>{m}</option>)}</select><select style={ss} value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))} onFocus={onF} onBlur={onB} required><option value="">Year</option>{years.map(y=><option key={y}>{y}</option>)}</select></div></div>
      <div><Lbl c="Gender"/><FW icon="fi-sr-venus-mars"><select style={{...IS,appearance:'none',cursor:'pointer'}} value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))} onFocus={onF} onBlur={onB} required><option value="">Select...</option><option value="male">♂ Male</option><option value="female">♀ Female</option><option value="other">⚧ Other</option><option value="couple">💑 Couple</option></select></FW></div>
      <Btn loading={load} text={<><i className="fi fi-sr-user-add"/>Create Account</>} loadText="Creating..." bg="linear-gradient(135deg,#7c3aed,#6d28d9)" shadow="0 3px 12px rgba(124,58,237,.28)"/>
    </form>
  </div></Overlay>)
}

export default function Login(){
  const [modal,setModal]=useState(null)
  return(<>
    <ScrollToTop/>
    <Header/>
    
    {/* Popup Ad from bottom */}
    <PopupAd />
    
    <section style={{minHeight:'100dvh',background:'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'80px 20px 40px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 30% 20%,rgba(96,165,250,.15) 0%,transparent 50%),radial-gradient(circle at 70% 80%,rgba(167,139,250,.12) 0%,transparent 50%)',pointerEvents:'none'}}/>
      <div style={{position:'relative',zIndex:1,textAlign:'center',maxWidth:560}}>
        <h1 style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:'clamp(2rem,6vw,3.2rem)',color:'#fff',marginBottom:20,lineHeight:1.2,textShadow:'0 4px 24px rgba(0,0,0,.5)'}}>
          Welcome to{' '}
          <span style={{background:'linear-gradient(135deg,#60a5fa 0%,#c084fc 50%,#f472b6 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>ChatsGenZ</span>
        </h1>
        <p style={{color:'rgba(255,255,255,.78)',fontSize:'clamp(0.9rem,2.5vw,1.05rem)',lineHeight:1.85,maxWidth:420,margin:'0 auto 40px',textShadow:'0 1px 8px rgba(0,0,0,.4)',fontStyle:'italic'}}>
          India's most vibrant free live chat — connect, laugh, flirt, and make friends. 🇮🇳
        </p>
        <div style={{display:'flex',flexDirection:'column',gap:12,maxWidth:300,margin:'0 auto'}}>
          <button onClick={()=>setModal('login')} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'15px 20px',borderRadius:13,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#1a73e8,#1464cc)',color:'#fff',fontWeight:800,fontSize:'1rem',boxShadow:'0 8px 24px rgba(26,115,232,.5)',transition:'all .15s'}}>
            <i className="fi fi-sr-sign-in" style={{fontSize:17}}/> Login to ChatsGenZ
          </button>
          <button onClick={()=>setModal('guest')} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'15px 20px',borderRadius:13,border:'1.5px solid rgba(255,255,255,.3)',cursor:'pointer',background:'rgba(255,255,255,.1)',color:'#fff',fontWeight:700,fontSize:'0.95rem',backdropFilter:'blur(6px)',transition:'all .15s'}}>
            <i className="fi fi-sr-bolt" style={{fontSize:17}}/> Enter as Guest
          </button>
          <button onClick={()=>setModal('register')} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'15px 20px',borderRadius:13,border:'1.5px solid rgba(167,139,250,.5)',cursor:'pointer',background:'rgba(124,58,237,.18)',color:'rgba(255,255,255,.92)',fontWeight:700,fontSize:'0.95rem',transition:'all .15s'}}>
            <i className="fi fi-sr-user-add" style={{fontSize:17}}/> Register Free
          </button>
        </div>
      </div>
    </section>

    <Footer/>
    {modal==='login'&&<LoginModal onClose={()=>setModal(null)}/>}
    {modal==='guest'&&<GuestModal onClose={()=>setModal(null)}/>}
    {modal==='register'&&<RegisterModal onClose={()=>setModal(null)}/>}
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght:900&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </>)
}
