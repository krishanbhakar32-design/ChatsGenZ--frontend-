import { useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import ScrollToTop from '../components/ScrollToTop.jsx'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ── SHARED ────────────────────────────────────────────────────
function Overlay({ onClose, children }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(8,14,26,.8)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:420, maxHeight:'94vh', overflowY:'auto', boxShadow:'0 28px 72px rgba(0,0,0,.45)' }}>
        {children}
      </div>
    </div>
  )
}

const IS = { display:'block', width:'100%', padding:'11px 14px', border:'1.5px solid #e0e4ea', borderRadius:9, fontSize:'0.875rem', color:'#111827', fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:'#f9fafb', transition:'all .15s' }
const onF = e => { e.target.style.borderColor='#1a73e8'; e.target.style.background='#fff' }
const onB = e => { e.target.style.borderColor='#e0e4ea'; e.target.style.background='#f9fafb' }
const Lbl = ({ c }) => <label style={{ display:'block', fontSize:'0.79rem', fontWeight:700, color:'#6b7280', marginBottom:5 }}>{c}</label>
const Err = ({ m }) => m ? <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, padding:'10px 14px', fontSize:'0.83rem', color:'#dc2626', marginBottom:12, lineHeight:1.55, display:'flex', alignItems:'flex-start', gap:8 }}>
  <span style={{ flexShrink:0, fontSize:14 }}>⚠️</span><span>{m}</span>
</div> : null
const Ok = ({ m }) => m ? <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:9, padding:'10px 14px', fontSize:'0.83rem', color:'#16a34a', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
  <span>✅</span><span>{m}</span>
</div> : null
const Spin = () => <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block', flexShrink:0 }} />

function Head({ bg, icon, title, sub, onClose, onBack }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
      <div style={{ display:'flex', alignItems:'center', gap:11 }}>
        {onBack && <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:15, padding:'0 6px 0 0', display:'flex', alignItems:'center' }}><i className="fi fi-sr-angle-left" /></button>}
        <div style={{ width:40, height:40, background:bg, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <i className={`fi fi-sr-${icon}`} style={{ color:'#fff', fontSize:17 }} />
        </div>
        <div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:'#111827' }}>{title}</div>
          <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:1 }}>{sub}</div>
        </div>
      </div>
      <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:20, padding:4, lineHeight:1, display:'flex', alignItems:'center' }}>
        <i className="fi fi-sr-cross-small" />
      </button>
    </div>
  )
}

function Btn({ loading, text, loadText, bg, color, shadow, onClick, type='submit', disabled }) {
  return (
    <button type={type} onClick={onClick} disabled={loading||disabled} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px', borderRadius:10, border:'none', width:'100%', background:(loading||disabled)?'#d1d5db':bg, color:color||'#fff', fontWeight:800, fontSize:'0.9rem', fontFamily:'Outfit,sans-serif', cursor:(loading||disabled)?'not-allowed':'pointer', boxShadow:(loading||disabled)?'none':shadow||'0 3px 14px rgba(26,115,232,.28)', transition:'all .15s', marginTop:6 }}>
      {loading ? <><Spin />{loadText||'Please wait...'}</> : text}
    </button>
  )
}

// ── OTP STEP (shared) ──────────────────────────────────────────
function OTPStep({ userId, email, username, onClose }) {
  const [otp, setOtp]      = useState('')
  const [err, setErr]      = useState('')
  const [ok, setOk]        = useState('')
  const [load, setLoad]    = useState(false)
  const [rl, setRl]        = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (otp.length !== 6) { setErr('Please enter the full 6-digit code.'); return }
    setLoad(true); setErr(''); setOk('')
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId, otp }) })
      const d = await res.json()
      if (res.ok && d.token) { localStorage.setItem('cgz_token', d.token); window.location.href='/chat' }
      else setErr(d.error || 'Incorrect code. Please try again.')
    } catch { setErr('Network error. Please try again.') }
    finally { setLoad(false) }
  }

  async function resend() {
    setRl(true); setErr(''); setOk('')
    try {
      const res = await fetch(`${API}/api/auth/resend-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId }) })
      const d = await res.json()
      if (res.ok) setOk('New code sent! Check your inbox and spam folder.')
      else setErr(d.error || 'Could not resend.')
    } catch { setErr('Network error.') }
    finally { setRl(false) }
  }

  return (
    <>
      <Head bg="linear-gradient(135deg,#1a73e8,#1464cc)" icon="shield-check" title="Verify Email" sub={`Code sent to ${email}`} onClose={onClose} />
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <div style={{ fontSize:44, marginBottom:10 }}>📧</div>
        <p style={{ fontSize:'0.9rem', color:'#6b7280', lineHeight:1.75 }}>
          Hi <strong style={{ color:'#111827' }}>{username}</strong>! A <strong style={{ color:'#1a73e8' }}>6-digit code</strong> has been sent to <strong style={{ color:'#111827' }}>{email}</strong>. Enter it below.
        </p>
        <p style={{ fontSize:'0.8rem', color:'#9ca3af', marginTop:6 }}>Check your spam/junk folder if not in inbox.</p>
      </div>
      <Err m={err} />
      <Ok  m={ok} />
      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <Lbl c="6-Digit Verification Code" />
          <input
            style={{ ...IS, fontSize:'2.2rem', textAlign:'center', letterSpacing:'16px', fontWeight:900, fontFamily:'monospace', padding:'14px 8px', background:'#fff', borderColor:'#c7d2fe' }}
            placeholder="——————"
            value={otp}
            onChange={e => { setOtp(e.target.value.replace(/\D/g,'').slice(0,6)); setErr('') }}
            maxLength={6} onFocus={onF} onBlur={onB} required autoFocus
          />
        </div>
        <Btn loading={load} text="✅ Verify & Enter ChatsGenZ" loadText="Verifying..." bg="linear-gradient(135deg,#1a73e8,#1464cc)" />
      </form>
      <div style={{ textAlign:'center', marginTop:14, fontSize:'0.82rem', color:'#9ca3af' }}>
        Didn't receive it?{' '}
        <button onClick={resend} disabled={rl} style={{ background:'none', border:'none', color:'#1a73e8', fontWeight:700, fontSize:'0.82rem', cursor:rl?'not-allowed':'pointer', padding:0 }}>
          {rl ? 'Sending...' : 'Resend Code'}
        </button>
      </div>
      <p style={{ fontSize:'0.69rem', color:'#d1d5db', textAlign:'center', marginTop:6 }}>Code expires in 15 minutes</p>
    </>
  )
}

// ── LOGIN MODAL ────────────────────────────────────────────────
function LoginModal({ onClose }) {
  const [step, setStep]       = useState('login')
  const [form, setForm]       = useState({ login:'', password:'' })
  const [fpEmail, setFpEmail] = useState('')
  const [err, setErr]         = useState('')
  const [ok, setOk]           = useState('')
  const [load, setLoad]       = useState(false)
  const [otpData, setOtpData] = useState({})

  const reset = () => { setErr(''); setOk('') }

  async function doLogin(e) {
    e.preventDefault(); setLoad(true); reset()
    try {
      const res = await fetch(`${API}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ login:form.login.trim(), password:form.password }) })
      const d = await res.json()
      if (res.ok && d.token) { localStorage.setItem('cgz_token', d.token); window.location.href='/chat' }
      else if (res.ok && d.needsVerification) { setOtpData({ userId:d.userId, email:form.login.trim(), username:d.username }); setStep('otp') }
      else setErr(d.error || 'Invalid credentials. Please try again.')
    } catch { setErr('Network error. Please check your connection.') }
    finally { setLoad(false) }
  }

  async function doForgot(e) {
    e.preventDefault(); setLoad(true); reset()
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:fpEmail.trim() }) })
      const d = await res.json()
      if (res.ok) setStep('forgot_sent')
      else setErr(d.error || 'Could not send reset email.')
    } catch { setErr('Network error.') }
    finally { setLoad(false) }
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding:'24px 22px' }}>
        {step === 'login' && <>
          <Head bg="linear-gradient(135deg,#1a73e8,#1464cc)" icon="sign-in" title="Login" sub="Welcome back to ChatsGenZ" onClose={onClose} />
          <Err m={err} />
          <form onSubmit={doLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <Lbl c="Username or Email" />
              <input style={IS} placeholder="Enter username or email (not case sensitive)"
                value={form.login} onChange={e=>setForm(f=>({...f,login:e.target.value}))}
                onFocus={onF} onBlur={onB} required />
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                <Lbl c="Password" />
                <button type="button" onClick={()=>{setStep('forgot');reset()}} style={{ background:'none', border:'none', color:'#1a73e8', fontSize:'0.77rem', fontWeight:700, cursor:'pointer', padding:0 }}>
                  Forgot password?
                </button>
              </div>
              <input type="password" style={IS} placeholder="Your password"
                value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                onFocus={onF} onBlur={onB} required />
            </div>
            <Btn loading={load} text={<><i className="fi fi-sr-sign-in" /> Login to ChatsGenZ</>} loadText="Logging in..." bg="linear-gradient(135deg,#1a73e8,#1464cc)" />
          </form>
        </>}

        {step === 'forgot' && <>
          <Head bg="linear-gradient(135deg,#f59e0b,#d97706)" icon="lock" title="Forgot Password" sub="Reset link sent to your email" onClose={onClose} onBack={()=>{setStep('login');reset()}} />
          <p style={{ fontSize:'0.875rem', color:'#6b7280', marginBottom:16, lineHeight:1.65 }}>Enter your registered email. We'll send a password reset link immediately.</p>
          <Err m={err} />
          <form onSubmit={doForgot} style={{ display:'flex', flexDirection:'column', gap:13 }}>
            <div>
              <Lbl c="Registered Email Address" />
              <input type="email" style={IS} placeholder="your@email.com"
                value={fpEmail} onChange={e=>setFpEmail(e.target.value)}
                onFocus={onF} onBlur={onB} required autoFocus />
            </div>
            <Btn loading={load} text={<><i className="fi fi-sr-paper-plane" /> Send Reset Link</>} loadText="Sending..." bg="linear-gradient(135deg,#f59e0b,#d97706)" color="#111827" shadow="0 3px 12px rgba(245,158,11,.3)" />
          </form>
        </>}

        {step === 'forgot_sent' && (
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>📧</div>
            <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.1rem', color:'#111827', marginBottom:8 }}>Check Your Inbox</h3>
            <p style={{ fontSize:'0.875rem', color:'#6b7280', lineHeight:1.7, marginBottom:6 }}>Reset link sent to <strong style={{ color:'#111827' }}>{fpEmail}</strong></p>
            <p style={{ fontSize:'0.8rem', color:'#9ca3af', marginBottom:24 }}>Link expires in 1 hour. Check spam folder too.</p>
            <button onClick={()=>{setStep('login');reset();setFpEmail('')}} style={{ padding:'11px 26px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
              Back to Login
            </button>
          </div>
        )}

        {step === 'otp' && <OTPStep {...otpData} onClose={onClose} />}
      </div>
    </Overlay>
  )
}

// ── GUEST MODAL ────────────────────────────────────────────────
function GuestModal({ onClose }) {
  const [form, setForm]  = useState({ username:'', gender:'' })
  const [err, setErr]    = useState('')
  const [load, setLoad]  = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!form.gender) { setErr('Please select your gender.'); return }
    setLoad(true); setErr('')
    try {
      const res = await fetch(`${API}/api/auth/guest`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      const d = await res.json()
      if (res.ok && d.token) { localStorage.setItem('cgz_token', d.token); window.location.href='/chat' }
      else setErr(d.error || 'Failed to enter. Please try again.')
    } catch { setErr('Network error.') }
    finally { setLoad(false) }
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding:'24px 22px' }}>
        <Head bg="linear-gradient(135deg,#16a34a,#15803d)" icon="user" title="Guest Entry" sub="No registration needed" onClose={onClose} />
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:9, padding:'10px 14px', fontSize:'0.8rem', color:'#92400e', marginBottom:14, lineHeight:1.55 }}>
          ⚠️ Guest sessions are temporary. Register free to save your profile and history.
        </div>
        <Err m={err} />
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <div>
            <Lbl c="Username" />
            <input style={IS} placeholder="2-20 chars, letters/numbers only"
              value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}
              onFocus={onF} onBlur={onB} required />
          </div>
          <div>
            <Lbl c="Gender" />
            <select style={{...IS,appearance:'none',cursor:'pointer'}} value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))} onFocus={onF} onBlur={onB} required>
              <option value="">Select gender...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="couple">Couple</option>
            </select>
            <p style={{ fontSize:'0.71rem', color:'#ef4444', marginTop:4, fontWeight:600 }}>⚠️ Gender cannot be changed once selected.</p>
          </div>
          <Btn loading={load} text={<><i className="fi fi-sr-user" /> Enter as Guest</>} loadText="Entering..." bg="linear-gradient(135deg,#16a34a,#15803d)" shadow="0 3px 12px rgba(22,163,74,.28)" />
        </form>
      </div>
    </Overlay>
  )
}

// ── REGISTER MODAL ─────────────────────────────────────────────
function RegisterModal({ onClose }) {
  const [step, setStep]       = useState('form')
  const [otpData, setOtpData] = useState({})
  const [form, setForm]       = useState({ username:'', email:'', password:'', confirm:'', day:'', month:'', year:'', gender:'' })
  const [err, setErr]         = useState('')
  const [load, setLoad]       = useState(false)

  const months  = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const curYear = new Date().getFullYear()
  const years   = Array.from({length:82},(_,i)=>curYear-18-i)
  const days    = Array.from({length:31},(_,i)=>i+1)
  const ss      = {...IS, padding:'10px 8px', appearance:'none'}

  async function submit(e) {
    e.preventDefault()
    if (!form.gender)                        { setErr('Please select your gender.'); return }
    if (!form.day||!form.month||!form.year)  { setErr('Please enter your full date of birth.'); return }
    if (form.password !== form.confirm)      { setErr('Passwords do not match.'); return }
    if (form.password.length < 6)           { setErr('Password must be at least 6 characters.'); return }
    setLoad(true); setErr('')
    try {
      const dob = `${form.year}-${String(months.indexOf(form.month)+1).padStart(2,'0')}-${String(form.day).padStart(2,'0')}`
      const res = await fetch(`${API}/api/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ username:form.username.trim(), email:form.email.trim().toLowerCase(), password:form.password, gender:form.gender, dob }) })
      const d = await res.json()
      if (res.ok && d.success) {
        if (d.needsOTP) {
          setOtpData({ userId:d.userId, email:form.email.trim().toLowerCase(), username:d.username })
          setStep('otp')
        } else {
          // Verification OFF — direct to chat
          localStorage.setItem('cgz_token', d.token)
          window.location.href = '/chat'
        }
      }
      else setErr(d.error || 'Registration failed. Please try again.')
    } catch { setErr('Network error. Please try again.') }
    finally { setLoad(false) }
  }

  if (step === 'otp') return (
    <Overlay onClose={onClose}>
      <div style={{ padding:'24px 22px' }}>
        <OTPStep {...otpData} onClose={onClose} />
      </div>
    </Overlay>
  )

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding:'24px 22px' }}>
        <Head bg="linear-gradient(135deg,#7c3aed,#6d28d9)" icon="user-add" title="Create Account" sub="Free forever — no credit card" onClose={onClose} />
        <Err m={err} />
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:11 }}>
          <div>
            <Lbl c="Username" />
            <input style={IS} placeholder="3-20 chars, letters/numbers/underscore"
              value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} onFocus={onF} onBlur={onB} required />
          </div>
          <div>
            <Lbl c="Email Address" />
            <input type="email" style={IS} placeholder="your@email.com"
              value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} onFocus={onF} onBlur={onB} required />
          </div>
          <div>
            <Lbl c="Password" />
            <input type="password" style={IS} placeholder="Minimum 6 characters"
              value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} onFocus={onF} onBlur={onB} required />
          </div>
          <div>
            <Lbl c="Confirm Password" />
            <input type="password" style={IS} placeholder="Repeat your password"
              value={form.confirm} onChange={e=>setForm(f=>({...f,confirm:e.target.value}))} onFocus={onF} onBlur={onB} required />
          </div>
          <div>
            <Lbl c={<span>Date of Birth &nbsp;<span style={{color:'#ef4444',fontSize:'0.69rem',fontWeight:700,background:'#fef2f2',padding:'1px 6px',borderRadius:4}}>18+ ONLY</span></span>} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1.5fr', gap:7 }}>
              <select style={ss} value={form.day}   onChange={e=>setForm(f=>({...f,day:e.target.value}))}   onFocus={onF} onBlur={onB} required><option value="">Day</option>{days.map(d=><option key={d}>{d}</option>)}</select>
              <select style={ss} value={form.month} onChange={e=>setForm(f=>({...f,month:e.target.value}))} onFocus={onF} onBlur={onB} required><option value="">Month</option>{months.map(m=><option key={m}>{m}</option>)}</select>
              <select style={ss} value={form.year}  onChange={e=>setForm(f=>({...f,year:e.target.value}))}  onFocus={onF} onBlur={onB} required><option value="">Year</option>{years.map(y=><option key={y}>{y}</option>)}</select>
            </div>
          </div>
          <div>
            <Lbl c="Gender" />
            <select style={{...IS,appearance:'none',cursor:'pointer'}} value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))} onFocus={onF} onBlur={onB} required>
              <option value="">Select gender...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="couple">Couple</option>
            </select>
            {/* IMPORTANT WARNING — highlighted */}
            <div style={{ marginTop:8, background:'#fffbeb', border:'1.5px solid #fbbf24', borderRadius:8, padding:'9px 12px', display:'flex', alignItems:'flex-start', gap:8 }}>
              <span style={{ fontSize:15, flexShrink:0 }}>⚠️</span>
              <p style={{ fontSize:'0.75rem', color:'#92400e', margin:0, lineHeight:1.6, fontWeight:600 }}>
                <strong>Gender cannot be changed after registration.</strong> It permanently affects your rank eligibility, profile, and room access. Please fill carefully.
              </p>
            </div>
          </div>
          <Btn loading={load} text={<><i className="fi fi-sr-user-add" /> Create Free Account</>} loadText="Creating account..." bg="linear-gradient(135deg,#7c3aed,#6d28d9)" shadow="0 3px 12px rgba(124,58,237,.28)" />
        </form>
      </div>
    </Overlay>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────────
export default function Login() {
  const [modal, setModal] = useState(null)

  return (
    <>
      <ScrollToTop />
      <Header />

      {/* DARK HERO — bg pic opacity 0.15 */}
      <section style={{ background:'linear-gradient(160deg,#0d1520 0%,#172035 55%,#0d1520 100%)', position:'relative', overflow:'hidden', padding:'52px 20px 56px' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'url(/images/hero-couple.jpg)', backgroundSize:'cover', backgroundPosition:'center 30%', opacity:0.15, pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(13,21,32,.5) 0%,rgba(13,21,32,.1) 50%,rgba(13,21,32,.65) 100%)', pointerEvents:'none' }} />

        <div style={{ position:'relative', maxWidth:480, margin:'0 auto', textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(26,115,232,.2)', border:'1px solid rgba(26,115,232,.4)', borderRadius:20, padding:'5px 15px', marginBottom:22 }}>
            <span style={{ width:7, height:7, background:'#22c55e', borderRadius:'50%', display:'inline-block', animation:'pulse 1.5s infinite' }} />
            <span style={{ fontSize:'0.77rem', fontWeight:600, color:'rgba(255,255,255,.88)' }}>Thousands chatting right now</span>
          </div>

          <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.7rem,5.5vw,2.5rem)', color:'#fff', marginBottom:14, lineHeight:1.18, textShadow:'0 2px 16px rgba(0,0,0,.5)' }}>
            Welcome to{' '}
            <span style={{ background:'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>ChatsGenZ</span>
          </h1>

          <p style={{ color:'rgba(255,255,255,.75)', fontSize:'clamp(0.875rem,2.5vw,1rem)', lineHeight:1.8, maxWidth:400, margin:'0 auto 36px', textShadow:'0 1px 8px rgba(0,0,0,.4)' }}>
            Next generation free live chat. Talk to strangers, make friends, video chat, earn ranks, send gifts and play games — no registration needed.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:300, margin:'0 auto' }}>
            <button onClick={()=>setModal('login')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 20px', borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:800, fontSize:'0.95rem', fontFamily:'Outfit,sans-serif', boxShadow:'0 6px 22px rgba(26,115,232,.5)', transition:'transform .15s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
              <i className="fi fi-sr-sign-in" style={{ fontSize:16 }} /> Login
            </button>
            <button onClick={()=>setModal('guest')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 20px', borderRadius:12, border:'1.5px solid rgba(255,255,255,.28)', cursor:'pointer', background:'rgba(255,255,255,.1)', color:'#fff', fontWeight:700, fontSize:'0.9rem', fontFamily:'Outfit,sans-serif', backdropFilter:'blur(4px)', transition:'all .15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.18)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}>
              <i className="fi fi-sr-user" style={{ fontSize:16 }} /> Enter as Guest
            </button>
            <button onClick={()=>setModal('register')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 20px', borderRadius:12, border:'1.5px solid rgba(167,139,250,.45)', cursor:'pointer', background:'rgba(124,58,237,.15)', color:'rgba(255,255,255,.9)', fontWeight:700, fontSize:'0.9rem', fontFamily:'Outfit,sans-serif', transition:'all .15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(124,58,237,.28)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(124,58,237,.15)'}>
              <i className="fi fi-sr-user-add" style={{ fontSize:16 }} /> New Here? Register Free
            </button>
          </div>
        </div>
      </section>

      {/* WHITE SEO SECTION */}
      <section style={{ background:'#fff', padding:'44px 20px 56px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.15rem,3vw,1.45rem)', color:'#111827', marginBottom:20 }}>
            Join ChatsGenZ — Free Live Chat for Everyone
          </h2>
          <div style={{ fontSize:'clamp(0.875rem,2vw,0.95rem)', color:'#374151', lineHeight:1.9 }}>
            <p style={{ marginBottom:16 }}>
              ChatsGenZ is a completely free <strong>live chatting site</strong> and <strong>stranger chatting site</strong>. Join as a guest instantly or create a free account to unlock your full profile, friends list, private messaging, gold coins, XP levels, and rank eligibility. Enjoy <strong>public cam chat</strong>, <strong>video call chat</strong>, <strong>audio call chat</strong>, quiz rooms, virtual gifts — all free, forever.
            </p>

            {/* HIGHLIGHTED WARNING BOX */}
            <div style={{ background:'linear-gradient(135deg,#fffbeb,#fef3c7)', border:'2px solid #f59e0b', borderRadius:14, padding:'18px 20px', marginBottom:20, boxShadow:'0 2px 12px rgba(245,158,11,.15)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:32, height:32, background:'#f59e0b', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:16 }}>⚠️</span>
                </div>
                <strong style={{ color:'#78350f', fontSize:'0.95rem', fontFamily:'Outfit,sans-serif', fontWeight:900 }}>
                  Important — Please Read Before Registering
                </strong>
              </div>
              <ul style={{ margin:0, paddingLeft:18, color:'#92400e', fontSize:'0.875rem', lineHeight:2.1 }}>
                <li><strong>Gender cannot be changed after registration</strong> — it affects your rank eligibility, room access, and profile permanently. Choose carefully.</li>
                <li><strong>You must be 18 years or older</strong> to register and access adult chat rooms on ChatsGenZ.</li>
                <li><strong>A 6-digit OTP</strong> is sent to your email after registration — you must verify your email to access ChatsGenZ.</li>
                <li><strong>One account per person.</strong> Multiple accounts to bypass bans will result in permanent bans on all accounts.</li>
                <li><strong>Username must be appropriate.</strong> Offensive, impersonating, or spam usernames will be removed without notice.</li>
              </ul>
            </div>

            <p>
              ChatsGenZ is the fastest growing <strong>new chatting site</strong> with users from 50+ countries. From Hindi chat to USA chat, from <strong>friendly chatrooms</strong> to <strong>adult chat</strong> — join thousands chatting right now. Free forever, for everyone.
            </p>
          </div>
        </div>
      </section>

      <Footer />

      {modal==='login'    && <LoginModal    onClose={()=>setModal(null)} />}
      {modal==='guest'    && <GuestModal    onClose={()=>setModal(null)} />}
      {modal==='register' && <RegisterModal onClose={()=>setModal(null)} />}

      <style>{`
        @keyframes spin  { to { transform:rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        select option    { background:#fff; color:#111827; }
        button:active    { transform:scale(.98) !important; }
      `}</style>
    </>
  )
}
