import { useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import ScrollToTop from '../components/ScrollToTop.jsx'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

function Modal({ onClose, children }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:420, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.35)' }}>
        {children}
      </div>
    </div>
  )
}

const IS = { display:'block', width:'100%', padding:'10px 13px', border:'1.5px solid #dadce0', borderRadius:8, fontSize:'0.875rem', color:'#202124', fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:'#fff', transition:'border-color .15s' }
const IF = e => e.target.style.borderColor = '#1a73e8'
const IB = e => e.target.style.borderColor = '#dadce0'
const Lbl = ({ c }) => <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'#3c4043', marginBottom:5 }}>{c}</label>
const Err = ({ m }) => m ? <div style={{ background:'#fce8e6', border:'1px solid #f5c6c2', borderRadius:8, padding:'9px 13px', fontSize:'0.83rem', color:'#c62828', marginBottom:12 }}>{m}</div> : null
const Spin = () => <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }} />

const ModalHead = ({ icon, color, title, sub, onClose }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:38, height:38, background:color, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <i className={`fi fi-sr-${icon}`} style={{ color:'#fff', fontSize:16 }} />
      </div>
      <div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:'#202124' }}>{title}</div>
        <div style={{ fontSize:'0.73rem', color:'#80868b' }}>{sub}</div>
      </div>
    </div>
    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#80868b', fontSize:18, padding:4 }}>
      <i className="fi fi-sr-cross" />
    </button>
  </div>
)

// ── LOGIN MODAL ────────────────────────────
function LoginModal({ onClose }) {
  const [form, setForm]     = useState({ login:'', password:'' })
  const [error, setError]   = useState('')
  const [loading, setLoad]  = useState(false)

  async function submit(e) {
    e.preventDefault(); setLoad(true); setError('')
    try {
      const res = await fetch(`${API}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ login: form.login, password: form.password }) })
      const d = await res.json()
      if (res.ok && d.token) { localStorage.setItem('cgz_token', d.token); window.location.href = '/chat' }
      else setError(d.error || 'Invalid credentials.')
    } catch { setError('Network error. Please try again.') }
    finally { setLoad(false) }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ padding:'24px 22px' }}>
        <ModalHead icon="sign-in" color="linear-gradient(135deg,#1a73e8,#1557b0)" title="Login" sub="Welcome back!" onClose={onClose} />
        <Err m={error} />
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <div><Lbl c="Username or Email *" /><input style={IS} placeholder="Enter username or email" value={form.login} onChange={e=>setForm(f=>({...f,login:e.target.value}))} onFocus={IF} onBlur={IB} required /></div>
          <div><Lbl c="Password *" /><input type="password" style={IS} placeholder="Your password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} onFocus={IF} onBlur={IB} required /></div>
          <button type="submit" disabled={loading} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', borderRadius:9, border:'none', marginTop:4, background:loading?'#9aa0a6':'linear-gradient(135deg,#1a73e8,#1557b0)', color:'#fff', fontWeight:800, fontSize:'0.9rem', fontFamily:'Outfit,sans-serif', cursor:loading?'not-allowed':'pointer', boxShadow:'0 3px 12px rgba(26,115,232,.35)' }}>
            {loading ? <><Spin /> Logging in...</> : 'Login to ChatsGenZ'}
          </button>
        </form>
      </div>
    </Modal>
  )
}

// ── GUEST MODAL ────────────────────────────
function GuestModal({ onClose }) {
  const [form, setForm]    = useState({ username:'', gender:'' })
  const [error, setError]  = useState('')
  const [loading, setLoad] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!form.gender) { setError('Please select your gender.'); return }
    setLoad(true); setError('')
    try {
      const res = await fetch(`${API}/api/auth/guest`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const d = await res.json()
      if (res.ok && d.token) { localStorage.setItem('cgz_token', d.token); window.location.href = '/chat' }
      else setError(d.error || 'Failed to enter as guest.')
    } catch { setError('Network error.') }
    finally { setLoad(false) }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ padding:'24px 22px' }}>
        <ModalHead icon="user" color="linear-gradient(135deg,#34a853,#1e8e3e)" title="Guest Entry" sub="No registration needed" onClose={onClose} />
        <div style={{ background:'#fef7e0', border:'1px solid #fce18a', borderRadius:8, padding:'9px 13px', fontSize:'0.79rem', color:'#7d5e00', marginBottom:13, lineHeight:1.5 }}>⚠️ Guest sessions are temporary. Register to save your profile.</div>
        <Err m={error} />
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <div><Lbl c="Username *" /><input style={IS} placeholder="Pick any username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} onFocus={IF} onBlur={IB} required /></div>
          <div>
            <Lbl c="Gender *" />
            <select style={{...IS,appearance:'none',cursor:'pointer'}} value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))} onFocus={IF} onBlur={IB} required>
              <option value="">Select gender...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="couple">Couple</option>
            </select>
            <p style={{ fontSize:'0.71rem', color:'#ea4335', marginTop:4 }}>⚠️ Gender cannot be changed once selected.</p>
          </div>
          <button type="submit" disabled={loading} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', borderRadius:9, border:'none', marginTop:4, background:loading?'#9aa0a6':'linear-gradient(135deg,#34a853,#1e8e3e)', color:'#fff', fontWeight:800, fontSize:'0.9rem', fontFamily:'Outfit,sans-serif', cursor:loading?'not-allowed':'pointer' }}>
            {loading ? <><Spin /> Entering...</> : 'Enter as Guest'}
          </button>
        </form>
      </div>
    </Modal>
  )
}

// ── REGISTER MODAL ─────────────────────────
function RegisterModal({ onClose }) {
  // step: 'form' | 'otp'
  const [step, setStep]   = useState('form')
  const [userId, setUserId] = useState('')
  const [email, setEmail]   = useState('')
  const [uname, setUname]   = useState('')

  const [form, setForm]   = useState({ username:'', email:'', password:'', confirmPassword:'', dob_day:'', dob_month:'', dob_year:'', gender:'' })
  const [error, setError] = useState('')
  const [loading, setLoad]= useState(false)

  const [otp, setOtp]         = useState('')
  const [otpErr, setOtpErr]   = useState('')
  const [otpLoad, setOtpLoad] = useState(false)
  const [resendLoad, setRL]   = useState(false)
  const [resendMsg, setRM]    = useState('')

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const curYear = new Date().getFullYear()
  const years  = Array.from({length:82}, (_,i) => curYear - 18 - i)
  const days   = Array.from({length:31}, (_,i) => i+1)

  async function submitRegister(e) {
    e.preventDefault()
    const { username, email: em, password, confirmPassword, dob_day, dob_month, dob_year, gender } = form
    if (!gender) { setError('Please select your gender.'); return }
    if (!dob_day || !dob_month || !dob_year) { setError('Please enter your full date of birth.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoad(true); setError('')
    try {
      const dob = `${dob_year}-${String(months.indexOf(dob_month)+1).padStart(2,'0')}-${String(dob_day).padStart(2,'0')}`
      const res = await fetch(`${API}/api/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, email: em, password, gender, dob }) })
      const d = await res.json()
      if (res.ok && d.success) {
        setUserId(d.userId); setEmail(em); setUname(d.username)
        setStep('otp')
      } else { setError(d.error || 'Registration failed.') }
    } catch { setError('Network error. Please try again.') }
    finally { setLoad(false) }
  }

  async function submitOTP(e) {
    e.preventDefault()
    if (otp.length !== 6) { setOtpErr('Please enter the 6-digit code.'); return }
    setOtpLoad(true); setOtpErr('')
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId, otp }) })
      const d = await res.json()
      if (res.ok && d.token) { localStorage.setItem('cgz_token', d.token); window.location.href = '/chat' }
      else setOtpErr(d.error || 'Incorrect code. Please try again.')
    } catch { setOtpErr('Network error. Please try again.') }
    finally { setOtpLoad(false) }
  }

  async function resendOTP() {
    setRL(true); setRM(''); setOtpErr('')
    try {
      const res = await fetch(`${API}/api/auth/resend-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId }) })
      const d = await res.json()
      if (res.ok) setRM('New code sent! Check your email.')
      else setOtpErr(d.error || 'Failed to resend.')
    } catch { setOtpErr('Network error.') }
    finally { setRL(false) }
  }

  const ss = { ...IS, padding:'10px 8px' }

  return (
    <Modal onClose={onClose}>
      <div style={{ padding:'24px 22px' }}>
        {step === 'form' ? (
          <>
            <ModalHead icon="user-add" color="linear-gradient(135deg,#aa44ff,#7b2ff7)" title="Create Account" sub="Free forever" onClose={onClose} />
            <Err m={error} />
            <form onSubmit={submitRegister} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div><Lbl c="Username *" /><input style={IS} placeholder="Choose a username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} onFocus={IF} onBlur={IB} required /></div>
              <div><Lbl c="Email Address *" /><input type="email" style={IS} placeholder="your@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} onFocus={IF} onBlur={IB} required /></div>
              <div><Lbl c="Password *" /><input type="password" style={IS} placeholder="Min. 6 characters" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} onFocus={IF} onBlur={IB} required /></div>
              <div><Lbl c="Confirm Password *" /><input type="password" style={IS} placeholder="Repeat password" value={form.confirmPassword} onChange={e=>setForm(f=>({...f,confirmPassword:e.target.value}))} onFocus={IF} onBlur={IB} required /></div>
              <div>
                <Lbl c={<>Date of Birth * <span style={{ color:'#ea4335', fontSize:'0.7rem' }}>18+ only</span></>} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1.4fr', gap:7 }}>
                  <select style={{...ss,appearance:'none'}} value={form.dob_day} onChange={e=>setForm(f=>({...f,dob_day:e.target.value}))} onFocus={IF} onBlur={IB} required><option value="">Day</option>{days.map(d=><option key={d}>{d}</option>)}</select>
                  <select style={{...ss,appearance:'none'}} value={form.dob_month} onChange={e=>setForm(f=>({...f,dob_month:e.target.value}))} onFocus={IF} onBlur={IB} required><option value="">Month</option>{months.map(m=><option key={m}>{m}</option>)}</select>
                  <select style={{...ss,appearance:'none'}} value={form.dob_year} onChange={e=>setForm(f=>({...f,dob_year:e.target.value}))} onFocus={IF} onBlur={IB} required><option value="">Year</option>{years.map(y=><option key={y}>{y}</option>)}</select>
                </div>
              </div>
              <div>
                <Lbl c="Gender *" />
                <select style={{...IS,appearance:'none',cursor:'pointer'}} value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))} onFocus={IF} onBlur={IB} required>
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="couple">Couple</option>
                </select>
                <p style={{ fontSize:'0.71rem', color:'#ea4335', marginTop:4, fontWeight:600 }}>⚠️ Gender cannot be changed after registration.</p>
              </div>
              <button type="submit" disabled={loading} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', borderRadius:9, border:'none', marginTop:4, background:loading?'#9aa0a6':'linear-gradient(135deg,#aa44ff,#7b2ff7)', color:'#fff', fontWeight:800, fontSize:'0.9rem', fontFamily:'Outfit,sans-serif', cursor:loading?'not-allowed':'pointer', boxShadow:'0 3px 12px rgba(170,68,255,.3)' }}>
                {loading ? <><Spin /> Creating account...</> : 'Create Free Account'}
              </button>
            </form>
          </>
        ) : (
          // OTP STEP
          <>
            <ModalHead icon="shield-check" color="linear-gradient(135deg,#1a73e8,#1557b0)" title="Verify Email" sub={`Code sent to ${email}`} onClose={onClose} />
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:42, marginBottom:8 }}>📧</div>
              <p style={{ fontSize:'0.88rem', color:'#5f6368', lineHeight:1.65 }}>
                Hi <strong style={{ color:'#202124' }}>{uname}</strong>! We've sent a <strong>6-digit verification code</strong> to <strong style={{ color:'#1a73e8' }}>{email}</strong>. Enter it below to activate your account.
              </p>
            </div>
            <Err m={otpErr} />
            {resendMsg && <div style={{ background:'#e6f4ea', border:'1px solid #b7dfbf', borderRadius:8, padding:'9px 13px', fontSize:'0.83rem', color:'#1e4620', marginBottom:12 }}>✅ {resendMsg}</div>}
            <form onSubmit={submitOTP} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <Lbl c="6-Digit Verification Code *" />
                <input
                  style={{ ...IS, fontSize:'1.6rem', textAlign:'center', letterSpacing:'10px', fontWeight:800, fontFamily:'monospace', padding:'14px' }}
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  maxLength={6}
                  onFocus={IF} onBlur={IB}
                  required
                />
              </div>
              <button type="submit" disabled={otpLoad} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px', borderRadius:9, border:'none', background:otpLoad?'#9aa0a6':'linear-gradient(135deg,#1a73e8,#1557b0)', color:'#fff', fontWeight:800, fontSize:'0.95rem', fontFamily:'Outfit,sans-serif', cursor:otpLoad?'not-allowed':'pointer', boxShadow:'0 3px 12px rgba(26,115,232,.35)' }}>
                {otpLoad ? <><Spin /> Verifying...</> : '✅ Verify & Enter ChatsGenZ'}
              </button>
            </form>
            <div style={{ textAlign:'center', marginTop:16 }}>
              <span style={{ fontSize:'0.82rem', color:'#80868b' }}>Didn't receive the code? </span>
              <button onClick={resendOTP} disabled={resendLoad} style={{ background:'none', border:'none', color:'#1a73e8', fontWeight:700, fontSize:'0.82rem', cursor:resendLoad?'not-allowed':'pointer', padding:0 }}>
                {resendLoad ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
            <p style={{ fontSize:'0.71rem', color:'#9aa0a6', textAlign:'center', marginTop:8 }}>Code expires in 15 minutes</p>
          </>
        )}
      </div>
    </Modal>
  )
}

// ── MAIN PAGE ──────────────────────────────
export default function Login() {
  const [modal, setModal] = useState(null)

  return (
    <>
      <ScrollToTop />
      <Header />

      {/* DARK HERO */}
      <section style={{ background:'linear-gradient(135deg,#0f1923 0%,#1a2535 60%,#0f1923 100%)', position:'relative', overflow:'hidden', padding:'48px 18px 52px' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'url(/images/hero-couple.jpg)', backgroundSize:'cover', backgroundPosition:'center', opacity:0.1, pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 30% 50%,rgba(26,115,232,.1) 0%,transparent 60%)', pointerEvents:'none' }} />

        <div style={{ position:'relative', maxWidth:500, margin:'0 auto', textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(26,115,232,.15)', border:'1px solid rgba(26,115,232,.3)', borderRadius:20, padding:'5px 14px', marginBottom:20 }}>
            <span style={{ width:7, height:7, background:'#34a853', borderRadius:'50%', display:'inline-block', animation:'pulse 1.5s infinite' }} />
            <span style={{ fontSize:'0.78rem', fontWeight:600, color:'rgba(255,255,255,.8)' }}>Thousands chatting right now</span>
          </div>

          <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.5rem,5vw,2.2rem)', color:'#fff', marginBottom:12, lineHeight:1.2 }}>
            Welcome to{' '}
            <span style={{ background:'linear-gradient(135deg,#1a73e8,#aa44ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>ChatsGenZ</span>
          </h1>

          <p style={{ color:'rgba(255,255,255,.6)', fontSize:'clamp(0.85rem,2.5vw,0.95rem)', lineHeight:1.8, maxWidth:420, margin:'0 auto 32px' }}>
            Next generation free live chat. Talk to strangers, make friends, video chat, earn ranks, send gifts and play games — completely free. No registration needed to get started.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:300, margin:'0 auto' }}>
            <button onClick={() => setModal('login')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 20px', borderRadius:11, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#1a73e8,#1557b0)', color:'#fff', fontWeight:800, fontSize:'0.95rem', fontFamily:'Outfit,sans-serif', boxShadow:'0 4px 18px rgba(26,115,232,.4)' }}>
              <i className="fi fi-sr-sign-in" /> Login to Your Account
            </button>
            <button onClick={() => setModal('guest')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 20px', borderRadius:11, border:'1.5px solid rgba(255,255,255,.2)', cursor:'pointer', background:'rgba(255,255,255,.08)', color:'#fff', fontWeight:800, fontSize:'0.95rem', fontFamily:'Outfit,sans-serif' }}>
              <i className="fi fi-sr-user" /> Enter as Guest
            </button>
            <button onClick={() => setModal('register')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 20px', borderRadius:11, border:'1.5px solid rgba(170,68,255,.4)', cursor:'pointer', background:'rgba(170,68,255,.1)', color:'rgba(255,255,255,.85)', fontWeight:700, fontSize:'0.9rem', fontFamily:'Outfit,sans-serif' }}>
              <i className="fi fi-sr-user-add" /> New Here? Register Free
            </button>
          </div>
        </div>
      </section>

      {/* WHITE SEO SECTION */}
      <section style={{ background:'#fff', padding:'40px 18px 52px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.1rem,3vw,1.4rem)', color:'#202124', marginBottom:20 }}>Join ChatsGenZ — Free Live Chat for Everyone</h2>
          <div style={{ fontSize:'clamp(0.875rem,2vw,0.95rem)', color:'#3c4043', lineHeight:1.9 }}>
            <p style={{ marginBottom:16 }}>ChatsGenZ is a completely free <strong>live chatting site</strong> and <strong>stranger chatting site</strong> designed for the next generation. Whether you want to join as a guest with no registration, or create a free registered account, ChatsGenZ gives you instant access to hundreds of active public chat rooms around the world. Our platform offers <strong>public cam chat</strong>, <strong>video call chat</strong>, <strong>audio call chat</strong>, quiz rooms, virtual gifts, and much more — all completely free.</p>
            <p style={{ marginBottom:16 }}>For those who want the full experience, creating a free registered account unlocks a permanent profile, friends list, private messaging, gold coins, daily bonuses, XP levels, and rank eligibility. Registration takes less than a minute and requires just your email for verification.</p>

            <div style={{ background:'#fef7e0', border:'1.5px solid #fce18a', borderRadius:12, padding:'18px 20px', marginBottom:18 }}>
              <div style={{ fontWeight:800, color:'#7d5e00', fontSize:'0.95rem', marginBottom:10 }}>⚠️ Important — Read Before Registering</div>
              <ul style={{ margin:0, paddingLeft:18, color:'#7d5e00', fontSize:'0.875rem', lineHeight:2.1 }}>
                <li><strong>Gender cannot be changed after registration.</strong> It affects your rank eligibility and profile permanently. Choose carefully.</li>
                <li><strong>You must be 18 years or older</strong> to access adult chat rooms. Age is set at registration and cannot be changed.</li>
                <li><strong>Date of Birth cannot be changed</strong> once set. Enter it accurately.</li>
                <li><strong>A 6-digit OTP will be sent to your email</strong> after registration. You must verify to access ChatsGenZ.</li>
                <li><strong>One account per person.</strong> Multiple accounts to bypass bans will result in permanent bans on all accounts.</li>
                <li><strong>Username must be appropriate.</strong> Offensive or impersonating usernames will be removed without notice.</li>
              </ul>
            </div>

            <p style={{ marginBottom:16 }}>ChatsGenZ has hundreds of <strong>free chat rooms</strong> organised by language, region, interest, and age group. From Hindi chat to USA chat, from music rooms to sports discussions, from <strong>friendly chatrooms</strong> to <strong>adult chat</strong> — there is a room for everyone. Whether you want to <strong>make friends</strong>, find someone to <strong>date</strong>, or just explore — ChatsGenZ is the fastest growing <strong>new chatting site</strong> with users from over 50 countries connecting every single day. Join now — free forever, for everyone.</p>
          </div>
        </div>
      </section>

      <Footer />

      {modal === 'login'    && <LoginModal    onClose={() => setModal(null)} />}
      {modal === 'guest'    && <GuestModal    onClose={() => setModal(null)} />}
      {modal === 'register' && <RegisterModal onClose={() => setModal(null)} />}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        select option { background: #fff; color: #202124; }
      `}</style>
    </>
  )
}
