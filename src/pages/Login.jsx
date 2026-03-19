import { useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import ScrollToTop from '../components/ScrollToTop.jsx'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ─── SHARED UI ────────────────────────────────────────────────
function Overlay({ onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(10,15,25,.75)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:420, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,.4)' }}
      >
        {children}
      </div>
    </div>
  )
}

const IS = {
  display:'block', width:'100%', padding:'11px 14px',
  border:'1.5px solid #e0e3e8', borderRadius:9,
  fontSize:'0.875rem', color:'#202124', fontFamily:'inherit',
  outline:'none', boxSizing:'border-box', background:'#fafbfc',
  transition:'all .15s',
}
const onF = e => { e.target.style.borderColor='#1a73e8'; e.target.style.background='#fff' }
const onB = e => { e.target.style.borderColor='#e0e3e8'; e.target.style.background='#fafbfc' }
const Lbl = ({ c }) => <label style={{ display:'block', fontSize:'0.79rem', fontWeight:700, color:'#5f6368', marginBottom:5, letterSpacing:'.2px' }}>{c}</label>
const ErrBox = ({ m }) => m ? <div style={{ background:'#fef0f0', border:'1px solid #fccfcf', borderRadius:8, padding:'9px 13px', fontSize:'0.83rem', color:'#c62828', marginBottom:12, lineHeight:1.5 }}>{m}</div> : null
const OkBox  = ({ m }) => m ? <div style={{ background:'#f0faf3', border:'1px solid #b7dfbf', borderRadius:8, padding:'9px 13px', fontSize:'0.83rem', color:'#1e7e34', marginBottom:12 }}>{m}</div> : null
const Spin   = () => <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.35)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin .75s linear infinite', display:'inline-block', flexShrink:0 }} />

function MHead({ bg, icon, title, sub, onClose, onBack }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {onBack && (
          <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:'#80868b', fontSize:16, padding:'0 6px 0 0', display:'flex' }}>
            <i className="fi fi-sr-angle-left" />
          </button>
        )}
        <div style={{ width:38, height:38, background:bg, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <i className={`fi fi-sr-${icon}`} style={{ color:'#fff', fontSize:16 }} />
        </div>
        <div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1rem', color:'#202124' }}>{title}</div>
          <div style={{ fontSize:'0.71rem', color:'#9aa0a6', marginTop:1 }}>{sub}</div>
        </div>
      </div>
      <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9aa0a6', fontSize:18, padding:4, lineHeight:1 }}>
        <i className="fi fi-sr-cross-small" />
      </button>
    </div>
  )
}

function PrimaryBtn({ loading, loadingText, children, color, ...props }) {
  return (
    <button {...props} disabled={loading || props.disabled} style={{
      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      padding:'12px', borderRadius:10, border:'none', width:'100%',
      background: (loading || props.disabled) ? '#c8cdd5' : (color || 'linear-gradient(135deg,#1a73e8,#1464cc)'),
      color:'#fff', fontWeight:800, fontSize:'0.9rem',
      fontFamily:'Outfit,sans-serif',
      cursor: (loading || props.disabled) ? 'not-allowed' : 'pointer',
      boxShadow: (loading || props.disabled) ? 'none' : '0 3px 14px rgba(26,115,232,.28)',
      transition:'all .15s', marginTop:4,
      ...props.style,
    }}>
      {loading ? <><Spin /> {loadingText || 'Please wait...'}</> : children}
    </button>
  )
}

// ─── OTP STEP (shared between register and login-verify) ─────
function OTPStep({ userId, email, username, onSuccess, onClose }) {
  const [otp, setOtp]       = useState('')
  const [error, setError]   = useState('')
  const [ok, setOk]         = useState('')
  const [loading, setLoad]  = useState(false)
  const [rl, setRl]         = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (otp.length !== 6) { setError('Enter the full 6-digit code.'); return }
    setLoad(true); setError(''); setOk('')
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId, otp })
      })
      const d = await res.json()
      if (res.ok && d.token) {
        localStorage.setItem('cgz_token', d.token)
        onSuccess ? onSuccess() : (window.location.href = '/chat')
      } else {
        setError(d.error || 'Wrong code. Try again.')
      }
    } catch { setError('Network error. Please try again.') }
    finally { setLoad(false) }
  }

  async function resend() {
    setRl(true); setError(''); setOk('')
    try {
      const res = await fetch(`${API}/api/auth/resend-otp`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId })
      })
      const d = await res.json()
      if (res.ok) setOk('New code sent! Check your email.')
      else setError(d.error || 'Could not resend.')
    } catch { setError('Network error.') }
    finally { setRl(false) }
  }

  return (
    <>
      <MHead bg="linear-gradient(135deg,#1a73e8,#1464cc)" icon="shield-check" title="Verify Your Email" sub={`Code sent to ${email}`} onClose={onClose} />
      <div style={{ textAlign:'center', marginBottom:18 }}>
        <div style={{ fontSize:38, marginBottom:8 }}>📧</div>
        <p style={{ fontSize:'0.875rem', color:'#5f6368', lineHeight:1.7 }}>
          Hi <strong style={{ color:'#202124' }}>{username}</strong>! Enter the <strong>6-digit code</strong> sent to <strong style={{ color:'#1a73e8' }}>{email}</strong>
        </p>
      </div>
      <ErrBox m={error} />
      <OkBox  m={ok} />
      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <Lbl c="6-Digit Code *" />
          <input
            style={{ ...IS, fontSize:'2rem', textAlign:'center', letterSpacing:'14px', fontWeight:900, fontFamily:'monospace', padding:'14px 10px', background:'#fff', borderColor:'#e0e3e8' }}
            placeholder="_ _ _ _ _ _"
            value={otp}
            onChange={e => { setOtp(e.target.value.replace(/\D/g,'').slice(0,6)); setError('') }}
            maxLength={6}
            onFocus={onF} onBlur={onB}
            required autoFocus
          />
        </div>
        <PrimaryBtn loading={loading} loadingText="Verifying...">
          ✅ Verify &amp; Enter ChatsGenZ
        </PrimaryBtn>
      </form>
      <div style={{ textAlign:'center', marginTop:14 }}>
        <span style={{ fontSize:'0.8rem', color:'#9aa0a6' }}>Didn't receive it? </span>
        <button onClick={resend} disabled={rl} style={{ background:'none', border:'none', color:'#1a73e8', fontWeight:700, fontSize:'0.8rem', cursor:rl?'not-allowed':'pointer', padding:0 }}>
          {rl ? 'Sending...' : 'Resend Code'}
        </button>
      </div>
      <p style={{ fontSize:'0.7rem', color:'#c5c9d0', textAlign:'center', marginTop:6 }}>Code expires in 15 minutes</p>
    </>
  )
}

// ─── LOGIN MODAL ──────────────────────────────────────────────
function LoginModal({ onClose }) {
  // step: login | forgot | forgot_sent | otp
  const [step, setStep]     = useState('login')
  const [form, setForm]     = useState({ login:'', password:'' })
  const [fpEmail, setFpEmail] = useState('')
  const [error, setError]   = useState('')
  const [ok, setOk]         = useState('')
  const [loading, setLoad]  = useState(false)
  const [otpData, setOtpData] = useState({ userId:'', email:'', username:'' })

  function reset() { setError(''); setOk('') }

  async function submitLogin(e) {
    e.preventDefault(); setLoad(true); reset()
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ login: form.login, password: form.password })
      })
      const d = await res.json()
      if (res.ok && d.token) {
        localStorage.setItem('cgz_token', d.token)
        window.location.href = '/chat'
      } else if (res.ok && d.needsVerification) {
        // Email not verified — go to OTP step
        setOtpData({ userId: d.userId, email: form.login, username: d.username })
        setStep('otp')
      } else {
        setError(d.error || 'Invalid credentials. Please try again.')
      }
    } catch { setError('Network error. Please try again.') }
    finally { setLoad(false) }
  }

  async function submitForgot(e) {
    e.preventDefault(); setLoad(true); reset()
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: fpEmail })
      })
      const d = await res.json()
      if (res.ok) setStep('forgot_sent')
      else setError(d.error || 'Could not send reset email.')
    } catch { setError('Network error.') }
    finally { setLoad(false) }
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding:'24px 22px' }}>

        {step === 'login' && (
          <>
            <MHead bg="linear-gradient(135deg,#1a73e8,#1464cc)" icon="sign-in" title="Login" sub="Welcome back to ChatsGenZ" onClose={onClose} />
            <ErrBox m={error} />
            <form onSubmit={submitLogin} style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div>
                <Lbl c="Username or Email *" />
                <input style={IS} placeholder="Enter username or email"
                  value={form.login} onChange={e => setForm(f=>({...f,login:e.target.value}))}
                  onFocus={onF} onBlur={onB} required />
              </div>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <Lbl c="Password *" />
                  <button type="button" onClick={()=>{setStep('forgot');reset()}}
                    style={{ background:'none', border:'none', color:'#1a73e8', fontSize:'0.77rem', fontWeight:700, cursor:'pointer', padding:0 }}>
                    Forgot password?
                  </button>
                </div>
                <input type="password" style={IS} placeholder="Your password"
                  value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}
                  onFocus={onF} onBlur={onB} required />
              </div>
              <PrimaryBtn loading={loading} loadingText="Logging in...">
                <i className="fi fi-sr-sign-in" /> Login to ChatsGenZ
              </PrimaryBtn>
            </form>
          </>
        )}

        {step === 'forgot' && (
          <>
            <MHead bg="linear-gradient(135deg,#fbbc04,#f9ab00)" icon="lock" title="Forgot Password" sub="Reset link sent to your email" onClose={onClose} onBack={()=>{setStep('login');reset()}} />
            <p style={{ fontSize:'0.84rem', color:'#5f6368', marginBottom:16, lineHeight:1.65 }}>
              Enter your registered email. We'll send a password reset link immediately.
            </p>
            <ErrBox m={error} />
            <form onSubmit={submitForgot} style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div>
                <Lbl c="Registered Email *" />
                <input type="email" style={IS} placeholder="your@email.com"
                  value={fpEmail} onChange={e=>setFpEmail(e.target.value)}
                  onFocus={onF} onBlur={onB} required autoFocus />
              </div>
              <PrimaryBtn loading={loading} loadingText="Sending..." color="linear-gradient(135deg,#fbbc04,#f9ab00)" style={{ color:'#202124', boxShadow:'0 3px 12px rgba(251,188,4,.3)' }}>
                <i className="fi fi-sr-paper-plane" /> Send Reset Link
              </PrimaryBtn>
            </form>
          </>
        )}

        {step === 'forgot_sent' && (
          <div style={{ textAlign:'center', padding:'8px 0' }}>
            <div style={{ fontSize:50, marginBottom:12 }}>📧</div>
            <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:'#202124', marginBottom:8 }}>Check Your Email</h3>
            <p style={{ fontSize:'0.875rem', color:'#5f6368', lineHeight:1.7, marginBottom:6 }}>
              Reset link sent to <strong style={{ color:'#202124' }}>{fpEmail}</strong>
            </p>
            <p style={{ fontSize:'0.8rem', color:'#9aa0a6', marginBottom:22 }}>Link expires in 1 hour. Check spam folder too.</p>
            <button onClick={()=>{setStep('login');reset();setFpEmail('')}}
              style={{ padding:'10px 24px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', fontSize:'0.875rem' }}>
              Back to Login
            </button>
          </div>
        )}

        {step === 'otp' && (
          <OTPStep {...otpData} onClose={onClose} />
        )}

      </div>
    </Overlay>
  )
}

// ─── GUEST MODAL ──────────────────────────────────────────────
function GuestModal({ onClose }) {
  const [form, setForm]    = useState({ username:'', gender:'' })
  const [error, setError]  = useState('')
  const [loading, setLoad] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!form.gender) { setError('Please select your gender.'); return }
    setLoad(true); setError('')
    try {
      const res = await fetch(`${API}/api/auth/guest`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form)
      })
      const d = await res.json()
      if (res.ok && d.token) {
        localStorage.setItem('cgz_token', d.token)
        window.location.href = '/chat'
      } else {
        setError(d.error || 'Failed to enter as guest.')
      }
    } catch { setError('Network error.') }
    finally { setLoad(false) }
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding:'24px 22px' }}>
        <MHead bg="linear-gradient(135deg,#34a853,#1e8e3e)" icon="user" title="Guest Entry" sub="No registration needed" onClose={onClose} />
        <div style={{ background:'#fffbea', border:'1px solid #fce18a', borderRadius:8, padding:'9px 13px', fontSize:'0.79rem', color:'#7d5e00', marginBottom:13, lineHeight:1.5 }}>
          ⚠️ Guest sessions are temporary. Register free to save your profile.
        </div>
        <ErrBox m={error} />
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <Lbl c="Username *" />
            <input style={IS} placeholder="Pick any username"
              value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}
              onFocus={onF} onBlur={onB} required />
          </div>
          <div>
            <Lbl c="Gender *" />
            <select style={{...IS,appearance:'none',cursor:'pointer'}}
              value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}
              onFocus={onF} onBlur={onB} required>
              <option value="">Select gender...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="couple">Couple</option>
            </select>
            <p style={{ fontSize:'0.71rem', color:'#ea4335', marginTop:4 }}>⚠️ Gender cannot be changed once selected.</p>
          </div>
          <PrimaryBtn loading={loading} loadingText="Entering..." color="linear-gradient(135deg,#34a853,#1e8e3e)" style={{ boxShadow:'0 3px 12px rgba(52,168,83,.28)' }}>
            <i className="fi fi-sr-user" /> Enter as Guest
          </PrimaryBtn>
        </form>
      </div>
    </Overlay>
  )
}

// ─── REGISTER MODAL ───────────────────────────────────────────
function RegisterModal({ onClose }) {
  const [step, setStep]       = useState('form')
  const [otpData, setOtpData] = useState({ userId:'', email:'', username:'' })

  const [form, setForm]    = useState({ username:'', email:'', password:'', confirmPassword:'', dob_day:'', dob_month:'', dob_year:'', gender:'' })
  const [error, setError]  = useState('')
  const [loading, setLoad] = useState(false)

  const months  = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const curYear = new Date().getFullYear()
  const years   = Array.from({length:82}, (_,i) => curYear - 18 - i)
  const days    = Array.from({length:31}, (_,i) => i + 1)
  const ss      = { ...IS, padding:'10px 8px', appearance:'none' }

  async function submit(e) {
    e.preventDefault()
    const { username, email, password, confirmPassword, dob_day, dob_month, dob_year, gender } = form
    if (!gender)                          { setError('Please select your gender.'); return }
    if (!dob_day||!dob_month||!dob_year)  { setError('Please enter your full date of birth.'); return }
    if (password !== confirmPassword)     { setError('Passwords do not match.'); return }
    if (password.length < 6)             { setError('Password must be at least 6 characters.'); return }

    setLoad(true); setError('')
    try {
      const dob = `${dob_year}-${String(months.indexOf(dob_month)+1).padStart(2,'0')}-${String(dob_day).padStart(2,'0')}`
      const res = await fetch(`${API}/api/auth/register`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username, email, password, gender, dob })
      })
      const d = await res.json()
      if (res.ok && d.success) {
        setOtpData({ userId: d.userId, email, username: d.username })
        setStep('otp')
      } else {
        setError(d.error || 'Registration failed. Please try again.')
      }
    } catch { setError('Network error. Please try again.') }
    finally { setLoad(false) }
  }

  if (step === 'otp') {
    return (
      <Overlay onClose={onClose}>
        <div style={{ padding:'24px 22px' }}>
          <OTPStep {...otpData} onClose={onClose} />
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding:'24px 22px' }}>
        <MHead bg="linear-gradient(135deg,#aa44ff,#7b2ff7)" icon="user-add" title="Create Account" sub="Free forever — no credit card" onClose={onClose} />
        <ErrBox m={error} />
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:11 }}>
          <div>
            <Lbl c="Username *" />
            <input style={IS} placeholder="3-20 chars, letters/numbers/underscore"
              value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}
              onFocus={onF} onBlur={onB} required />
          </div>
          <div>
            <Lbl c="Email Address *" />
            <input type="email" style={IS} placeholder="your@email.com"
              value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
              onFocus={onF} onBlur={onB} required />
          </div>
          <div>
            <Lbl c="Password *" />
            <input type="password" style={IS} placeholder="Minimum 6 characters"
              value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
              onFocus={onF} onBlur={onB} required />
          </div>
          <div>
            <Lbl c="Confirm Password *" />
            <input type="password" style={IS} placeholder="Repeat your password"
              value={form.confirmPassword} onChange={e=>setForm(f=>({...f,confirmPassword:e.target.value}))}
              onFocus={onF} onBlur={onB} required />
          </div>
          <div>
            <Lbl c={<span>Date of Birth * <span style={{color:'#ea4335',fontSize:'0.69rem',fontWeight:700}}>18+ only</span></span>} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1.5fr', gap:7 }}>
              <select style={ss} value={form.dob_day}   onChange={e=>setForm(f=>({...f,dob_day:e.target.value}))}   onFocus={onF} onBlur={onB} required>
                <option value="">Day</option>
                {days.map(d=><option key={d}>{d}</option>)}
              </select>
              <select style={ss} value={form.dob_month} onChange={e=>setForm(f=>({...f,dob_month:e.target.value}))} onFocus={onF} onBlur={onB} required>
                <option value="">Month</option>
                {months.map(m=><option key={m}>{m}</option>)}
              </select>
              <select style={ss} value={form.dob_year}  onChange={e=>setForm(f=>({...f,dob_year:e.target.value}))}  onFocus={onF} onBlur={onB} required>
                <option value="">Year</option>
                {years.map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Lbl c="Gender *" />
            <select style={{...IS,appearance:'none',cursor:'pointer'}}
              value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}
              onFocus={onF} onBlur={onB} required>
              <option value="">Select gender...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="couple">Couple</option>
            </select>
            <p style={{ fontSize:'0.71rem', color:'#ea4335', marginTop:4, fontWeight:600 }}>
              ⚠️ Gender cannot be changed after registration.
            </p>
          </div>
          <PrimaryBtn loading={loading} loadingText="Creating account..." color="linear-gradient(135deg,#aa44ff,#7b2ff7)" style={{ boxShadow:'0 3px 12px rgba(170,68,255,.28)' }}>
            <i className="fi fi-sr-user-add" /> Create Free Account
          </PrimaryBtn>
        </form>
      </div>
    </Overlay>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function Login() {
  const [modal, setModal] = useState(null)

  return (
    <>
      <ScrollToTop />
      <Header />

      {/* HERO — dark with bg image */}
      <section style={{ background:'linear-gradient(160deg,#0d1520 0%,#162033 55%,#0d1520 100%)', position:'relative', overflow:'hidden', padding:'52px 20px 56px' }}>
        {/* bg image — opacity 0.15 so buttons and text are clear */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:'url(/images/hero-couple.jpg)',
          backgroundSize:'cover', backgroundPosition:'center top',
          opacity:0.15, pointerEvents:'none',
        }} />
        {/* subtle gradient overlay so text always readable */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(13,21,32,.4) 0%, rgba(13,21,32,.2) 50%, rgba(13,21,32,.6) 100%)', pointerEvents:'none' }} />

        <div style={{ position:'relative', maxWidth:480, margin:'0 auto', textAlign:'center' }}>
          {/* Live badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(26,115,232,.18)', border:'1px solid rgba(26,115,232,.35)', borderRadius:20, padding:'5px 15px', marginBottom:22 }}>
            <span style={{ width:7, height:7, background:'#34a853', borderRadius:'50%', display:'inline-block', animation:'pulse 1.5s infinite' }} />
            <span style={{ fontSize:'0.77rem', fontWeight:600, color:'rgba(255,255,255,.85)' }}>Thousands chatting right now</span>
          </div>

          <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.6rem,5.5vw,2.4rem)', color:'#fff', marginBottom:14, lineHeight:1.18, textShadow:'0 2px 12px rgba(0,0,0,.4)' }}>
            Welcome to{' '}
            <span style={{ background:'linear-gradient(135deg,#4d9fff,#aa44ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              ChatsGenZ
            </span>
          </h1>

          <p style={{ color:'rgba(255,255,255,.72)', fontSize:'clamp(0.875rem,2.5vw,1rem)', lineHeight:1.8, maxWidth:400, margin:'0 auto 36px', textShadow:'0 1px 6px rgba(0,0,0,.3)' }}>
            Next generation free live chat. Talk to strangers, make friends, video chat, earn ranks, send gifts and play games — no registration needed.
          </p>

          {/* 3 BUTTONS */}
          <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:290, margin:'0 auto' }}>
            <button onClick={()=>setModal('login')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 20px', borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#1a73e8,#1464cc)', color:'#fff', fontWeight:800, fontSize:'0.95rem', fontFamily:'Outfit,sans-serif', boxShadow:'0 6px 20px rgba(26,115,232,.45)', transition:'transform .15s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
              <i className="fi fi-sr-sign-in" /> Login
            </button>
            <button onClick={()=>setModal('guest')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 20px', borderRadius:12, border:'1.5px solid rgba(255,255,255,.25)', cursor:'pointer', background:'rgba(255,255,255,.1)', color:'#fff', fontWeight:700, fontSize:'0.9rem', fontFamily:'Outfit,sans-serif', backdropFilter:'blur(4px)' }}>
              <i className="fi fi-sr-user" /> Enter as Guest
            </button>
            <button onClick={()=>setModal('register')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 20px', borderRadius:12, border:'1.5px solid rgba(170,68,255,.4)', cursor:'pointer', background:'rgba(170,68,255,.12)', color:'rgba(255,255,255,.88)', fontWeight:700, fontSize:'0.9rem', fontFamily:'Outfit,sans-serif' }}>
              <i className="fi fi-sr-user-add" /> New Here? Register Free
            </button>
          </div>
        </div>
      </section>

      {/* WHITE SEO SECTION */}
      <section style={{ background:'#fff', padding:'40px 20px 52px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.1rem,3vw,1.4rem)', color:'#202124', marginBottom:20 }}>
            Join ChatsGenZ — Free Live Chat for Everyone
          </h2>
          <div style={{ fontSize:'clamp(0.875rem,2vw,0.95rem)', color:'#3c4043', lineHeight:1.9 }}>
            <p style={{ marginBottom:16 }}>
              ChatsGenZ is a completely free <strong>live chatting site</strong> and <strong>stranger chatting site</strong>. Join as a guest instantly or create a free account to unlock your full profile, friends list, private messaging, gold coins, XP levels, and rank eligibility. Enjoy <strong>public cam chat</strong>, <strong>video call chat</strong>, <strong>audio call chat</strong>, quiz rooms, virtual gifts — all free.
            </p>
            <div style={{ background:'#fffbea', border:'1.5px solid #fce18a', borderRadius:12, padding:'16px 18px', marginBottom:16 }}>
              <div style={{ fontWeight:800, color:'#7d5e00', fontSize:'0.9rem', marginBottom:8 }}>⚠️ Important — Read Before Registering</div>
              <ul style={{ margin:0, paddingLeft:16, color:'#7d5e00', fontSize:'0.85rem', lineHeight:2.1, listStyle:'disc' }}>
                <li><strong>Gender cannot be changed</strong> after registration — affects rank eligibility permanently.</li>
                <li><strong>You must be 18+</strong> to access adult chat rooms.</li>
                <li><strong>A 6-digit OTP</strong> is sent to your email after registration — verify to access ChatsGenZ.</li>
                <li><strong>One account per person.</strong> Multiple accounts to bypass bans = permanent ban on all.</li>
              </ul>
            </div>
            <p>
              ChatsGenZ is the fastest growing <strong>new chatting site</strong> — users from 50+ countries, free forever for everyone.
            </p>
          </div>
        </div>
      </section>

      <Footer />

      {modal === 'login'    && <LoginModal    onClose={()=>setModal(null)} />}
      {modal === 'guest'    && <GuestModal    onClose={()=>setModal(null)} />}
      {modal === 'register' && <RegisterModal onClose={()=>setModal(null)} />}

      <style>{`
        @keyframes spin  { to { transform:rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        select option    { background:#fff; color:#202124; }
      `}</style>
    </>
  )
}
