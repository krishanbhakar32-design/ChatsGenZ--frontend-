import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout.jsx'

export default function Login() {
  const [tab, setTab] = useState('login') // login | register | guest
  const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

  // LOGIN
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // REGISTER
  const [regForm, setRegForm] = useState({ username: '', email: '', password: '', gender: '' })
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regDone, setRegDone] = useState(false)

  // GUEST
  const [guestForm, setGuestForm] = useState({ username: '', gender: '' })
  const [guestError, setGuestError] = useState('')
  const [guestLoading, setGuestLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoginLoading(true); setLoginError('')
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const d = await res.json()
      if (res.ok && d.token) {
        localStorage.setItem('cgz_token', d.token)
        window.location.href = '/chat'
      } else {
        setLoginError(d.error || 'Invalid credentials. Please try again.')
      }
    } catch { setLoginError('Network error. Please try again.') }
    finally { setLoginLoading(false) }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!regForm.gender) { setRegError('Please select your gender.'); return }
    setRegLoading(true); setRegError('')
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      })
      const d = await res.json()
      if (res.ok && d.success) {
        setRegDone(true)
      } else {
        setRegError(d.error || 'Registration failed. Please try again.')
      }
    } catch { setRegError('Network error. Please try again.') }
    finally { setRegLoading(false) }
  }

  async function handleGuest(e) {
    e.preventDefault()
    if (!guestForm.username.trim()) { setGuestError('Please enter a username.'); return }
    if (!guestForm.gender) { setGuestError('Please select your gender.'); return }
    setGuestLoading(true); setGuestError('')
    try {
      const res = await fetch(`${API}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestForm),
      })
      const d = await res.json()
      if (res.ok && d.token) {
        localStorage.setItem('cgz_token', d.token)
        window.location.href = '/chat'
      } else {
        setGuestError(d.error || 'Failed to enter as guest. Please try again.')
      }
    } catch { setGuestError('Network error. Please try again.') }
    finally { setGuestLoading(false) }
  }

  const inp = {
    style: {
      display:'block', width:'100%', padding:'11px 14px',
      border:'1.5px solid rgba(255,255,255,.2)', borderRadius:9,
      fontSize:'0.9rem', color:'#fff', fontFamily:'inherit',
      outline:'none', boxSizing:'border-box',
      background:'rgba(255,255,255,.08)',
      transition:'border-color .15s',
    },
    onFocus: e => e.target.style.borderColor='rgba(26,115,232,.8)',
    onBlur:  e => e.target.style.borderColor='rgba(255,255,255,.2)',
  }

  const selStyle = {
    ...inp.style,
    appearance:'none', cursor:'pointer', color: '#fff',
  }

  return (
    <PageLayout seo={{
      title: 'Login — ChatsGenZ Free Chat | Join as Guest or Register',
      description: 'Login to ChatsGenZ, join as a guest without registration, or create a free account. Enter free live chat rooms, talk to strangers, video chat, earn ranks and play games on ChatsGenZ.',
      keywords: 'ChatsGenZ login, ChatsGenZ register, ChatsGenZ guest login, join ChatsGenZ free, ChatsGenZ sign in, free chat login no registration',
      canonical: '/login',
    }}>
      {/* HERO with bg */}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#0f1923 0%,#1a2535 60%,#0f1923 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* BG image overlay */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage: 'url(/images/hero-couple.jpg)',
          backgroundSize:'cover', backgroundPosition:'center',
          opacity:0.12, pointerEvents:'none',
        }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 30% 50%,rgba(26,115,232,.12) 0%,transparent 60%)', pointerEvents:'none' }} />

        <div style={{ position:'relative', maxWidth:520, margin:'0 auto', padding:'32px 18px 60px' }}>

          {/* Welcome message */}
          <div style={{ textAlign:'center', marginBottom:32, paddingTop:8 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(26,115,232,.15)', border:'1px solid rgba(26,115,232,.3)', borderRadius:20, padding:'5px 14px', marginBottom:18 }}>
              <span style={{ width:7, height:7, background:'#34a853', borderRadius:'50%', animation:'pulse 1.5s infinite', display:'inline-block' }} />
              <span style={{ fontSize:'0.78rem', fontWeight:600, color:'rgba(255,255,255,.8)' }}>Thousands of people chatting right now</span>
            </div>
            <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.5rem,5vw,2.2rem)', color:'#fff', marginBottom:14, lineHeight:1.25 }}>
              Welcome to <span style={{ background:'linear-gradient(135deg,#1a73e8,#aa44ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>ChatsGenZ</span>
            </h1>
            <p style={{ color:'rgba(255,255,255,.65)', fontSize:'clamp(0.85rem,2.5vw,0.95rem)', lineHeight:1.75, maxWidth:420, margin:'0 auto' }}>
              The next generation free live chat platform where you can talk to strangers, make friends, video chat, earn ranks, send virtual gifts, and play games — all completely free. No registration required to get started. Simply enter a username, pick your gender, and join as a guest right now. Or create a free account to unlock your full profile, friends list, and much more. ChatsGenZ is open 24/7 with active rooms for everyone worldwide.
            </p>
          </div>

          {/* Tab switcher */}
          <div style={{ display:'flex', background:'rgba(255,255,255,.07)', borderRadius:12, padding:4, marginBottom:24, gap:4 }}>
            {[['login','Login'],['guest','Guest Entry'],['register','Register']].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex:1, padding:'10px 6px', borderRadius:9, border:'none', cursor:'pointer',
                background: tab===t ? 'linear-gradient(135deg,#1a73e8,#1557b0)' : 'transparent',
                color: tab===t ? '#fff' : 'rgba(255,255,255,.55)',
                fontWeight:700, fontSize:'0.82rem', fontFamily:'Outfit,sans-serif',
                transition:'all .18s',
                boxShadow: tab===t ? '0 2px 10px rgba(26,115,232,.35)' : 'none',
              }}>{l}</button>
            ))}
          </div>

          {/* LOGIN TAB */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {loginError && <div style={{ background:'rgba(234,67,53,.18)', border:'1px solid rgba(234,67,53,.4)', borderRadius:9, padding:'11px 14px', fontSize:'0.85rem', color:'#ff8a80' }}>{loginError}</div>}
              <div>
                <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,.7)', marginBottom:6 }}>Email Address</label>
                <input type="email" {...inp} placeholder="your@email.com" value={loginForm.email} onChange={e => setLoginForm(f=>({...f,email:e.target.value}))} required />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,.7)', marginBottom:6 }}>Password</label>
                <input type="password" {...inp} placeholder="Your password" value={loginForm.password} onChange={e => setLoginForm(f=>({...f,password:e.target.value}))} required />
              </div>
              <button type="submit" disabled={loginLoading} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px', borderRadius:10, border:'none', background: loginLoading?'#555':'linear-gradient(135deg,#1a73e8,#1557b0)', color:'#fff', fontWeight:800, fontSize:'0.95rem', fontFamily:'Outfit,sans-serif', cursor:loginLoading?'not-allowed':'pointer', boxShadow:'0 3px 14px rgba(26,115,232,.4)', marginTop:4 }}>
                {loginLoading ? <><span style={{ width:15,height:15,border:'2px solid rgba(255,255,255,.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .8s linear infinite',display:'inline-block' }} /> Logging in...</> : <><i className="fi fi-sr-sign-in" /> Login</>}
              </button>
              <div style={{ textAlign:'center', marginTop:4 }}>
                <span style={{ fontSize:'0.84rem', color:'rgba(255,255,255,.5)' }}>New here? </span>
                <button type="button" onClick={()=>setTab('register')} style={{ background:'none',border:'none',color:'#1a73e8',fontWeight:700,fontSize:'0.84rem',cursor:'pointer',padding:0 }}>Register Now</button>
              </div>
            </form>
          )}

          {/* GUEST TAB */}
          {tab === 'guest' && (
            <form onSubmit={handleGuest} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'rgba(251,188,4,.1)', border:'1px solid rgba(251,188,4,.25)', borderRadius:9, padding:'10px 14px', fontSize:'0.82rem', color:'#fbbc04', lineHeight:1.6 }}>
                ⚠️ Guest accounts are temporary. Register for a free account to save your profile, friends, and chat history.
              </div>
              {guestError && <div style={{ background:'rgba(234,67,53,.18)', border:'1px solid rgba(234,67,53,.4)', borderRadius:9, padding:'11px 14px', fontSize:'0.85rem', color:'#ff8a80' }}>{guestError}</div>}
              <div>
                <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,.7)', marginBottom:6 }}>Choose a Username</label>
                <input {...inp} placeholder="Pick any username" value={guestForm.username} onChange={e => setGuestForm(f=>({...f,username:e.target.value}))} required />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,.7)', marginBottom:6 }}>Gender</label>
                <select style={selStyle} value={guestForm.gender} onChange={e => setGuestForm(f=>({...f,gender:e.target.value}))} onFocus={inp.onFocus} onBlur={inp.onBlur} required>
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,.35)', marginTop:5, lineHeight:1.5 }}>⚠️ Gender cannot be changed once selected. Fill carefully.</p>
              </div>
              <button type="submit" disabled={guestLoading} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px', borderRadius:10, border:'none', background: guestLoading?'#555':'rgba(255,255,255,.12)', color:'#fff', fontWeight:800, fontSize:'0.95rem', fontFamily:'Outfit,sans-serif', cursor:guestLoading?'not-allowed':'pointer', border:'1.5px solid rgba(255,255,255,.2)', marginTop:4 }}>
                {guestLoading ? <><span style={{ width:15,height:15,border:'2px solid rgba(255,255,255,.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .8s linear infinite',display:'inline-block' }} /> Entering...</> : <><i className="fi fi-sr-user" /> Enter as Guest</>}
              </button>
              <div style={{ textAlign:'center', marginTop:4 }}>
                <span style={{ fontSize:'0.84rem', color:'rgba(255,255,255,.5)' }}>New here? </span>
                <button type="button" onClick={()=>setTab('register')} style={{ background:'none',border:'none',color:'#1a73e8',fontWeight:700,fontSize:'0.84rem',cursor:'pointer',padding:0 }}>Register Now</button>
              </div>
            </form>
          )}

          {/* REGISTER TAB */}
          {tab === 'register' && (
            regDone ? (
              <div style={{ background:'rgba(52,168,83,.15)', border:'1px solid rgba(52,168,83,.3)', borderRadius:12, padding:'24px 20px', textAlign:'center' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🎉</div>
                <div style={{ fontWeight:800, color:'#fff', fontSize:'1rem', marginBottom:8 }}>Account Created!</div>
                <p style={{ color:'rgba(255,255,255,.65)', fontSize:'0.875rem', lineHeight:1.7 }}>Check your email inbox for a verification link. Once verified, you can login and start chatting!</p>
                <button onClick={()=>{setRegDone(false);setTab('login')}} style={{ marginTop:16, padding:'10px 24px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#1a73e8,#1557b0)', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Go to Login</button>
              </div>
            ) : (
              <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ background:'rgba(26,115,232,.12)', border:'1px solid rgba(26,115,232,.25)', borderRadius:9, padding:'10px 14px', fontSize:'0.82rem', color:'rgba(255,255,255,.7)', lineHeight:1.6 }}>
                  💡 Registration is free. A verification email will be sent to activate your account.
                </div>
                {regError && <div style={{ background:'rgba(234,67,53,.18)', border:'1px solid rgba(234,67,53,.4)', borderRadius:9, padding:'11px 14px', fontSize:'0.85rem', color:'#ff8a80' }}>{regError}</div>}
                <div>
                  <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,.7)', marginBottom:6 }}>Username</label>
                  <input {...inp} placeholder="Choose a username" value={regForm.username} onChange={e => setRegForm(f=>({...f,username:e.target.value}))} required />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,.7)', marginBottom:6 }}>Email Address</label>
                  <input type="email" {...inp} placeholder="your@email.com" value={regForm.email} onChange={e => setRegForm(f=>({...f,email:e.target.value}))} required />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,.7)', marginBottom:6 }}>Password</label>
                  <input type="password" {...inp} placeholder="Create a strong password" value={regForm.password} onChange={e => setRegForm(f=>({...f,password:e.target.value}))} required />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,.7)', marginBottom:6 }}>Gender</label>
                  <select style={selStyle} value={regForm.gender} onChange={e => setRegForm(f=>({...f,gender:e.target.value}))} onFocus={inp.onFocus} onBlur={inp.onBlur} required>
                    <option value="">Select gender...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,.35)', marginTop:5, lineHeight:1.5 }}>⚠️ Gender cannot be changed once set. Please fill carefully — this affects your rank eligibility and profile permanently.</p>
                </div>
                <button type="submit" disabled={regLoading} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px', borderRadius:10, border:'none', background: regLoading?'#555':'linear-gradient(135deg,#34a853,#1e8e3e)', color:'#fff', fontWeight:800, fontSize:'0.95rem', fontFamily:'Outfit,sans-serif', cursor:regLoading?'not-allowed':'pointer', boxShadow:'0 3px 14px rgba(52,168,83,.3)', marginTop:4 }}>
                  {regLoading ? <><span style={{ width:15,height:15,border:'2px solid rgba(255,255,255,.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .8s linear infinite',display:'inline-block' }} /> Creating account...</> : <><i className="fi fi-sr-user-add" /> Create Free Account</>}
                </button>
                <div style={{ textAlign:'center', marginTop:4 }}>
                  <span style={{ fontSize:'0.84rem', color:'rgba(255,255,255,.5)' }}>Already have an account? </span>
                  <button type="button" onClick={()=>setTab('login')} style={{ background:'none',border:'none',color:'#1a73e8',fontWeight:700,fontSize:'0.84rem',cursor:'pointer',padding:0 }}>Login</button>
                </div>
              </form>
            )
          )}

          {/* SEO PARAGRAPH */}
          <div style={{ marginTop:40, borderTop:'1px solid rgba(255,255,255,.08)', paddingTop:28 }}>
            <p style={{ fontSize:'0.84rem', color:'rgba(255,255,255,.38)', lineHeight:1.85 }}>
              ChatsGenZ is a <strong style={{ color:'rgba(255,255,255,.5)' }}>free live chatting site</strong> and <strong style={{ color:'rgba(255,255,255,.5)' }}>stranger chatting site</strong> built for the next generation of online social interaction. Whether you want to join as a guest with no registration, or create a free registered account, ChatsGenZ gives you instant access to hundreds of active public chat rooms around the world. Our platform is home to friendly chatrooms, guest chatrooms, VIP chat, premium chatrooms, public cam chat, video call chat, audio call chat, quiz rooms, dice games, and much more. Every feature is free to use. You can make friends, date, enjoy adult chat in age-verified rooms, and experience the most secured chat environment online. When registering, please note that <strong style={{ color:'rgba(255,255,255,.5)' }}>gender cannot be changed once selected</strong> — it affects your rank eligibility, profile, and chat room experience permanently, so fill your details carefully. ChatsGenZ is the fastest growing new chatting site and we welcome users from every country, language, and background. Join thousands of people who are already chatting right now — completely free, forever.
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </PageLayout>
  )
}
