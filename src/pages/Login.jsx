import { useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import ScrollToTop from '../components/ScrollToTop.jsx'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

// ── MODAL OVERLAY ─────────────────────────────────────────────
function Modal({ onClose, children }) {
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'16px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#fff', borderRadius:16, width:'100%', maxWidth:420,
        maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)',
      }}>
        {children}
      </div>
    </div>
  )
}

// ── INPUT STYLE ───────────────────────────────────────────────
const inp = {
  display:'block', width:'100%', padding:'10px 13px',
  border:'1.5px solid #dadce0', borderRadius:8,
  fontSize:'0.875rem', color:'#202124', fontFamily:'inherit',
  outline:'none', boxSizing:'border-box', background:'#fff',
  transition:'border-color .15s',
}
const onF = e => e.target.style.borderColor = '#1a73e8'
const onB = e => e.target.style.borderColor = '#dadce0'

const Label = ({ children }) => (
  <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'#3c4043', marginBottom:5 }}>
    {children}
  </label>
)

const Err = ({ msg }) => msg ? (
  <div style={{ background:'#fce8e6', border:'1px solid #f5c6c2', borderRadius:8, padding:'9px 13px', fontSize:'0.83rem', color:'#c62828', marginBottom:12 }}>
    {msg}
  </div>
) : null

const Spinner = () => (
  <span style={{ width:15, height:15, border:'2px solid rgba(255,255,255,.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }} />
)

// ── LOGIN MODAL ───────────────────────────────────────────────
function LoginModal({ onClose }) {
  const [form, setForm]   = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: form.login, username: form.login, password: form.password }),
      })
      const d = await res.json()
      if (res.ok && d.token) {
        localStorage.setItem('cgz_token', d.token)
        window.location.href = '/chat'
      } else {
        setError(d.error || 'Invalid credentials. Please try again.')
      }
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ padding:'24px 22px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, background:'linear-gradient(135deg,#1a73e8,#1557b0)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="fi fi-sr-sign-in" style={{ color:'#fff', fontSize:16 }} />
            </div>
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:'#202124' }}>Login</div>
              <div style={{ fontSize:'0.75rem', color:'#80868b' }}>Welcome back!</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#80868b', fontSize:20, padding:4 }}>
            <i className="fi fi-sr-cross" />
          </button>
        </div>

        <Err msg={error} />

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <div>
            <Label>Username or Email <span style={{ color:'#ea4335' }}>*</span></Label>
            <input style={inp} placeholder="Enter username or email"
              value={form.login} onChange={e => setForm(f=>({...f,login:e.target.value}))}
              onFocus={onF} onBlur={onB} required />
          </div>
          <div>
            <Label>Password <span style={{ color:'#ea4335' }}>*</span></Label>
            <input type="password" style={inp} placeholder="Your password"
              value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}
              onFocus={onF} onBlur={onB} required />
          </div>
          <button type="submit" disabled={loading} style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'12px', borderRadius:9, border:'none', marginTop:4,
            background: loading?'#9aa0a6':'linear-gradient(135deg,#1a73e8,#1557b0)',
            color:'#fff', fontWeight:800, fontSize:'0.9rem',
            fontFamily:'Outfit,sans-serif', cursor:loading?'not-allowed':'pointer',
            boxShadow:'0 3px 12px rgba(26,115,232,.35)',
          }}>
            {loading ? <><Spinner /> Logging in...</> : 'Login to ChatsGenZ'}
          </button>
        </form>
      </div>
    </Modal>
  )
}

// ── GUEST MODAL ───────────────────────────────────────────────
function GuestModal({ onClose }) {
  const [form, setForm]   = useState({ username: '', gender: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!form.gender) { setError('Please select your gender.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/api/auth/guest`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (res.ok && d.token) {
        localStorage.setItem('cgz_token', d.token)
        window.location.href = '/chat'
      } else {
        setError(d.error || 'Failed to enter as guest.')
      }
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ padding:'24px 22px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, background:'linear-gradient(135deg,#34a853,#1e8e3e)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="fi fi-sr-user" style={{ color:'#fff', fontSize:16 }} />
            </div>
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:'#202124' }}>Guest Entry</div>
              <div style={{ fontSize:'0.75rem', color:'#80868b' }}>No registration needed</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#80868b', fontSize:20, padding:4 }}>
            <i className="fi fi-sr-cross" />
          </button>
        </div>

        <div style={{ background:'#fef7e0', border:'1px solid #fce18a', borderRadius:8, padding:'9px 13px', fontSize:'0.8rem', color:'#7d5e00', marginBottom:13, lineHeight:1.5 }}>
          ⚠️ Guest sessions are temporary. Register free to save your profile.
        </div>

        <Err msg={error} />

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <div>
            <Label>Username <span style={{ color:'#ea4335' }}>*</span></Label>
            <input style={inp} placeholder="Pick any username"
              value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))}
              onFocus={onF} onBlur={onB} required />
          </div>
          <div>
            <Label>Gender <span style={{ color:'#ea4335' }}>*</span></Label>
            <select style={{ ...inp, appearance:'none', cursor:'pointer' }}
              value={form.gender} onChange={e => setForm(f=>({...f,gender:e.target.value}))}
              onFocus={onF} onBlur={onB} required>
              <option value="">Select gender...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="couple">Couple</option>
            </select>
            <p style={{ fontSize:'0.72rem', color:'#ea4335', marginTop:4 }}>⚠️ Gender cannot be changed once selected.</p>
          </div>
          <button type="submit" disabled={loading} style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'12px', borderRadius:9, border:'none', marginTop:4,
            background: loading?'#9aa0a6':'linear-gradient(135deg,#34a853,#1e8e3e)',
            color:'#fff', fontWeight:800, fontSize:'0.9rem',
            fontFamily:'Outfit,sans-serif', cursor:loading?'not-allowed':'pointer',
            boxShadow:'0 3px 12px rgba(52,168,83,.3)',
          }}>
            {loading ? <><Spinner /> Entering...</> : 'Enter as Guest'}
          </button>
        </form>
      </div>
    </Modal>
  )
}

// ── REGISTER MODAL ─────────────────────────────────────────────
function RegisterModal({ onClose }) {
  const [form, setForm] = useState({ username:'', email:'', password:'', confirmPassword:'', dob_day:'', dob_month:'', dob_year:'', gender:'' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)

  const days   = Array.from({length:31}, (_,i) => i+1)
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const currentYear = new Date().getFullYear()
  const years  = Array.from({length:82}, (_,i) => currentYear - 18 - i)

  async function submit(e) {
    e.preventDefault()
    const { username, email, password, confirmPassword, dob_day, dob_month, dob_year, gender } = form
    if (!gender) { setError('Please select your gender.'); return }
    if (!dob_day || !dob_month || !dob_year) { setError('Please enter your full date of birth.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    try {
      const dob = `${dob_year}-${String(months.indexOf(dob_month)+1).padStart(2,'0')}-${String(dob_day).padStart(2,'0')}`
      const res = await fetch(`${API}/api/auth/register`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username, email, password, gender, dob }),
      })
      const d = await res.json()
      if (res.ok && d.success) { setDone(true) }
      else { setError(d.error || 'Registration failed. Please try again.') }
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const ss = { ...inp, padding:'10px 8px' } // small select style

  return (
    <Modal onClose={onClose}>
      <div style={{ padding:'24px 22px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, background:'linear-gradient(135deg,#aa44ff,#7b2ff7)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="fi fi-sr-user-add" style={{ color:'#fff', fontSize:16 }} />
            </div>
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.05rem', color:'#202124' }}>Create Account</div>
              <div style={{ fontSize:'0.75rem', color:'#80868b' }}>Free forever</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#80868b', fontSize:20, padding:4 }}>
            <i className="fi fi-sr-cross" />
          </button>
        </div>

        {done ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🎉</div>
            <div style={{ fontWeight:800, color:'#202124', fontSize:'1rem', marginBottom:8 }}>Account Created!</div>
            <p style={{ color:'#5f6368', fontSize:'0.875rem', lineHeight:1.7 }}>Check your email for a verification link. Once verified, you can login and start chatting!</p>
            <button onClick={onClose} style={{ marginTop:16, padding:'10px 24px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#1a73e8,#1557b0)', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <Err msg={error} />
            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <Label>Username <span style={{ color:'#ea4335' }}>*</span></Label>
                <input style={inp} placeholder="Choose a username"
                  value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))}
                  onFocus={onF} onBlur={onB} required />
              </div>
              <div>
                <Label>Email Address <span style={{ color:'#ea4335' }}>*</span></Label>
                <input type="email" style={inp} placeholder="your@email.com"
                  value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
                  onFocus={onF} onBlur={onB} required />
              </div>
              <div>
                <Label>Password <span style={{ color:'#ea4335' }}>*</span></Label>
                <input type="password" style={inp} placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}
                  onFocus={onF} onBlur={onB} required />
              </div>
              <div>
                <Label>Confirm Password <span style={{ color:'#ea4335' }}>*</span></Label>
                <input type="password" style={inp} placeholder="Repeat your password"
                  value={form.confirmPassword} onChange={e => setForm(f=>({...f,confirmPassword:e.target.value}))}
                  onFocus={onF} onBlur={onB} required />
              </div>
              <div>
                <Label>Date of Birth <span style={{ color:'#ea4335' }}>*</span> <span style={{ fontSize:'0.72rem', color:'#ea4335', fontWeight:600 }}>18+ only</span></Label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1.5fr', gap:8 }}>
                  <select style={{ ...ss, appearance:'none' }}
                    value={form.dob_day} onChange={e => setForm(f=>({...f,dob_day:e.target.value}))}
                    onFocus={onF} onBlur={onB} required>
                    <option value="">Day</option>
                    {days.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <select style={{ ...ss, appearance:'none' }}
                    value={form.dob_month} onChange={e => setForm(f=>({...f,dob_month:e.target.value}))}
                    onFocus={onF} onBlur={onB} required>
                    <option value="">Month</option>
                    {months.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <select style={{ ...ss, appearance:'none' }}
                    value={form.dob_year} onChange={e => setForm(f=>({...f,dob_year:e.target.value}))}
                    onFocus={onF} onBlur={onB} required>
                    <option value="">Year</option>
                    {years.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Gender <span style={{ color:'#ea4335' }}>*</span></Label>
                <select style={{ ...inp, appearance:'none', cursor:'pointer' }}
                  value={form.gender} onChange={e => setForm(f=>({...f,gender:e.target.value}))}
                  onFocus={onF} onBlur={onB} required>
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="couple">Couple</option>
                </select>
                <p style={{ fontSize:'0.72rem', color:'#ea4335', marginTop:4, fontWeight:600 }}>
                  ⚠️ Gender cannot be changed after registration. This affects your rank eligibility permanently.
                </p>
              </div>
              <button type="submit" disabled={loading} style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'12px', borderRadius:9, border:'none', marginTop:4,
                background: loading?'#9aa0a6':'linear-gradient(135deg,#aa44ff,#7b2ff7)',
                color:'#fff', fontWeight:800, fontSize:'0.9rem',
                fontFamily:'Outfit,sans-serif', cursor:loading?'not-allowed':'pointer',
                boxShadow:'0 3px 12px rgba(170,68,255,.3)',
              }}>
                {loading ? <><Spinner /> Creating account...</> : 'Create Free Account'}
              </button>
            </form>
          </>
        )}
      </div>
    </Modal>
  )
}

// ── MAIN LOGIN PAGE ────────────────────────────────────────────
export default function Login() {
  const [modal, setModal] = useState(null) // 'login' | 'guest' | 'register' | null

  return (
    <>
      <ScrollToTop />
      <Header />

      {/* ── DARK HERO SECTION ── */}
      <section style={{
        background: 'linear-gradient(135deg,#0f1923 0%,#1a2535 60%,#0f1923 100%)',
        position: 'relative', overflow: 'hidden', padding: '48px 18px 52px',
      }}>
        {/* bg image */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:'url(/images/hero-couple.jpg)',
          backgroundSize:'cover', backgroundPosition:'center',
          opacity:0.1, pointerEvents:'none',
        }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 30% 50%,rgba(26,115,232,.1) 0%,transparent 60%)', pointerEvents:'none' }} />

        <div style={{ position:'relative', maxWidth:520, margin:'0 auto', textAlign:'center' }}>
          {/* live badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(26,115,232,.15)', border:'1px solid rgba(26,115,232,.3)', borderRadius:20, padding:'5px 14px', marginBottom:20 }}>
            <span style={{ width:7, height:7, background:'#34a853', borderRadius:'50%', display:'inline-block', animation:'pulse 1.5s infinite' }} />
            <span style={{ fontSize:'0.78rem', fontWeight:600, color:'rgba(255,255,255,.8)' }}>Thousands chatting right now</span>
          </div>

          <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.5rem,5vw,2.2rem)', color:'#fff', marginBottom:12, lineHeight:1.2 }}>
            Welcome to{' '}
            <span style={{ background:'linear-gradient(135deg,#1a73e8,#aa44ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              ChatsGenZ
            </span>
          </h1>

          <p style={{ color:'rgba(255,255,255,.6)', fontSize:'clamp(0.85rem,2.5vw,0.95rem)', lineHeight:1.8, maxWidth:420, margin:'0 auto 32px' }}>
            The next generation free live chat platform. Talk to strangers, make friends, video chat, earn ranks, send virtual gifts and play games — completely free. No registration required to start chatting right now.
          </p>

          {/* 3 BUTTONS */}
          <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:320, margin:'0 auto' }}>
            <button onClick={() => setModal('login')} style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              padding:'14px 20px', borderRadius:11, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#1a73e8,#1557b0)',
              color:'#fff', fontWeight:800, fontSize:'0.95rem',
              fontFamily:'Outfit,sans-serif', boxShadow:'0 4px 18px rgba(26,115,232,.4)',
            }}>
              <i className="fi fi-sr-sign-in" /> Login to Your Account
            </button>

            <button onClick={() => setModal('guest')} style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              padding:'14px 20px', borderRadius:11, border:'1.5px solid rgba(255,255,255,.2)', cursor:'pointer',
              background:'rgba(255,255,255,.08)',
              color:'#fff', fontWeight:800, fontSize:'0.95rem',
              fontFamily:'Outfit,sans-serif',
            }}>
              <i className="fi fi-sr-user" /> Enter as Guest
            </button>

            <button onClick={() => setModal('register')} style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              padding:'14px 20px', borderRadius:11, border:'1.5px solid rgba(170,68,255,.4)', cursor:'pointer',
              background:'rgba(170,68,255,.1)',
              color:'rgba(255,255,255,.85)', fontWeight:700, fontSize:'0.9rem',
              fontFamily:'Outfit,sans-serif',
            }}>
              <i className="fi fi-sr-user-add" /> New Here? Register Free
            </button>
          </div>
        </div>
      </section>

      {/* ── WHITE SEO SECTION ── */}
      <section style={{ background:'#fff', padding:'40px 18px 52px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.1rem,3vw,1.4rem)', color:'#202124', marginBottom:20 }}>
            Join ChatsGenZ — Free Live Chat for Everyone
          </h2>
          <div style={{ fontSize:'clamp(0.875rem,2vw,0.95rem)', color:'#3c4043', lineHeight:1.9 }}>
            <p style={{ marginBottom:16 }}>
              ChatsGenZ is a completely free <strong>live chatting site</strong> and <strong>stranger chatting site</strong> designed for the next generation of online social interaction. Whether you want to make new friends, explore <strong>adult chat</strong> rooms, or just have a friendly conversation with someone from the other side of the world — ChatsGenZ is the right place for you. You do not need to register, pay, or share your email to get started. Simply click Guest Entry, choose a username, select your gender, and you are inside a live chat room within seconds.
            </p>
            <p style={{ marginBottom:16 }}>
              For those who want the full experience, creating a free registered account on ChatsGenZ unlocks a permanent profile, a friends list, private messaging, gold coins, daily login bonuses, XP levels, rank eligibility, and much more. Registration takes less than a minute. However, there are some important things to keep in mind when registering on ChatsGenZ.
            </p>

            {/* Caution box */}
            <div style={{ background:'#fef7e0', border:'1.5px solid #fce18a', borderRadius:12, padding:'18px 20px', marginBottom:18 }}>
              <div style={{ fontWeight:800, color:'#7d5e00', fontSize:'0.95rem', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
                ⚠️ Important — Please Read Before Registering
              </div>
              <ul style={{ margin:0, paddingLeft:18, color:'#7d5e00', fontSize:'0.875rem', lineHeight:2 }}>
                <li><strong>Gender cannot be changed after registration.</strong> It affects your rank eligibility, profile display, and room access permanently. Choose carefully.</li>
                <li><strong>You must be 18 years or older</strong> to access adult chat rooms. Age is verified through your Date of Birth at registration.</li>
                <li><strong>Your Date of Birth cannot be changed</strong> once set. Enter it accurately as it determines your access to age-restricted content.</li>
                <li><strong>Username must be unique</strong> and appropriate. Offensive or impersonating usernames will be removed without notice.</li>
                <li><strong>Your email must be valid</strong> — a verification link will be sent. Without verification your account will have limited features.</li>
                <li><strong>One account per person.</strong> Creating multiple accounts to bypass bans is a violation and all accounts will be permanently banned.</li>
              </ul>
            </div>

            <p style={{ marginBottom:16 }}>
              ChatsGenZ has hundreds of active <strong>free chat rooms</strong> organised by language, region, interest, and age group. From Hindi chat to USA chat, from music rooms to sports discussions, from <strong>friendly chatrooms</strong> to <strong>adult chat</strong> — there is a room for everyone. Our platform also offers <strong>public cam chat</strong>, <strong>video call chat</strong>, <strong>audio call chat</strong> powered by WebRTC, quiz rooms where you win gold coins, dice games, spin-the-wheel, virtual gifts, emoticons, stickers, and much more — all completely free.
            </p>
            <p style={{ marginBottom:16 }}>
              The <strong>VIP chat</strong> and <strong>premium chatroom</strong> system on ChatsGenZ rewards active members. Earn XP through every message, level up your rank, and unlock privileges over time. Our platform is a fully <strong>secured chat</strong> environment — monitored 24/7 by a trained moderation team ensuring every room is safe, respectful, and enjoyable for all members. Whether you are here to <strong>make friends</strong>, <strong>date</strong>, or simply explore — ChatsGenZ welcomes you.
            </p>
            <p>
              This is the <strong>fastest growing new chatting site</strong> with users from over 50 countries connecting every single day. Join thousands of people who are already chatting right now — for free, forever.
            </p>
          </div>
        </div>
      </section>

      <Footer />

      {/* MODALS */}
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
