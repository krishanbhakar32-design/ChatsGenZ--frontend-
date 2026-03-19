import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import ScrollToTop from '../components/ScrollToTop.jsx'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

export default function Login() {
  const [tab, setTab] = useState('login')

  const [loginForm, setLoginForm]     = useState({ email: '', password: '' })
  const [loginError, setLoginError]   = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [regForm, setRegForm]     = useState({ username: '', email: '', password: '', gender: '' })
  const [regError, setRegError]   = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regDone, setRegDone]     = useState(false)

  const [guestForm, setGuestForm]     = useState({ username: '', gender: '' })
  const [guestError, setGuestError]   = useState('')
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

  const inputStyle = {
    display: 'block', width: '100%', padding: '11px 14px',
    border: '1.5px solid rgba(255,255,255,.2)', borderRadius: 9,
    fontSize: '0.9rem', color: '#fff', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
    background: 'rgba(255,255,255,.08)', transition: 'border-color .15s',
  }

  const onFocus = e => e.target.style.borderColor = 'rgba(26,115,232,.8)'
  const onBlur  = e => e.target.style.borderColor = 'rgba(255,255,255,.2)'

  return (
    <>
      <ScrollToTop />
      <SEO
        title="Login — ChatsGenZ Free Chat | Guest or Register"
        description="Login to ChatsGenZ, join as a guest without registration, or create a free account. Enter free live chat rooms, talk to strangers, video chat, earn ranks on ChatsGenZ."
        keywords="ChatsGenZ login, ChatsGenZ register, ChatsGenZ guest login, join ChatsGenZ free, ChatsGenZ sign in, free chat login no registration"
        canonical="/login"
      />
      <Header />

      <div style={{
        minHeight: '80vh',
        background: 'linear-gradient(135deg,#0f1923 0%,#1a2535 60%,#0f1923 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* bg overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/hero-couple.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.1, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 30% 50%,rgba(26,115,232,.1) 0%,transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 500, margin: '0 auto', padding: '36px 18px 52px' }}>

          {/* Welcome */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(26,115,232,.15)', border: '1px solid rgba(26,115,232,.3)',
              borderRadius: 20, padding: '5px 14px', marginBottom: 16,
            }}>
              <span style={{ width: 7, height: 7, background: '#34a853', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,.8)' }}>Thousands chatting right now</span>
            </div>
            <h1 style={{
              fontFamily: 'Outfit,sans-serif', fontWeight: 900,
              fontSize: 'clamp(1.4rem,5vw,2rem)', color: '#fff',
              marginBottom: 12, lineHeight: 1.25,
            }}>
              Welcome to{' '}
              <span style={{ background: 'linear-gradient(135deg,#1a73e8,#aa44ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ChatsGenZ
              </span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 'clamp(0.82rem,2.5vw,0.9rem)', lineHeight: 1.75, maxWidth: 400, margin: '0 auto' }}>
              The next generation free live chat platform. Talk to strangers, make friends, video chat, earn ranks, send gifts and play games — all completely free. No registration required to get started. Join as a guest right now or create your free account.
            </p>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,.07)',
            borderRadius: 12, padding: 4, marginBottom: 22, gap: 4,
          }}>
            {[['login','Login'], ['guest','Guest Entry'], ['register','Register']].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '10px 4px', borderRadius: 9,
                border: 'none', cursor: 'pointer',
                background: tab === t ? 'linear-gradient(135deg,#1a73e8,#1557b0)' : 'transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,.5)',
                fontWeight: 700, fontSize: '0.82rem',
                fontFamily: 'Outfit,sans-serif', transition: 'all .18s',
                boxShadow: tab === t ? '0 2px 10px rgba(26,115,232,.35)' : 'none',
              }}>{l}</button>
            ))}
          </div>

          {/* LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loginError && (
                <div style={{ background: 'rgba(234,67,53,.15)', border: '1px solid rgba(234,67,53,.35)', borderRadius: 9, padding: '11px 14px', fontSize: '0.85rem', color: '#ff8a80' }}>
                  {loginError}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,.65)', marginBottom: 6 }}>Email Address</label>
                <input type="email" style={inputStyle} placeholder="your@email.com"
                  value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  onFocus={onFocus} onBlur={onBlur} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,.65)', marginBottom: 6 }}>Password</label>
                <input type="password" style={inputStyle} placeholder="Your password"
                  value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  onFocus={onFocus} onBlur={onBlur} required />
              </div>
              <button type="submit" disabled={loginLoading} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px', borderRadius: 10, border: 'none',
                background: loginLoading ? '#555' : 'linear-gradient(135deg,#1a73e8,#1557b0)',
                color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                fontFamily: 'Outfit,sans-serif', cursor: loginLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 14px rgba(26,115,232,.4)', marginTop: 4,
              }}>
                {loginLoading
                  ? <><span style={{ width:15,height:15,border:'2px solid rgba(255,255,255,.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .8s linear infinite',display:'inline-block' }} /> Logging in...</>
                  : 'Login'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.84rem', color: 'rgba(255,255,255,.45)', marginTop: 4 }}>
                New here?{' '}
                <button type="button" onClick={() => setTab('register')} style={{ background: 'none', border: 'none', color: '#1a73e8', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', padding: 0 }}>
                  Register Now
                </button>
              </p>
            </form>
          )}

          {/* GUEST */}
          {tab === 'guest' && (
            <form onSubmit={handleGuest} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'rgba(251,188,4,.1)', border: '1px solid rgba(251,188,4,.25)', borderRadius: 9, padding: '10px 14px', fontSize: '0.82rem', color: '#fbbc04', lineHeight: 1.6 }}>
                ⚠️ Guest sessions are temporary. Register free to save your profile and history.
              </div>
              {guestError && (
                <div style={{ background: 'rgba(234,67,53,.15)', border: '1px solid rgba(234,67,53,.35)', borderRadius: 9, padding: '11px 14px', fontSize: '0.85rem', color: '#ff8a80' }}>
                  {guestError}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,.65)', marginBottom: 6 }}>Choose a Username</label>
                <input style={inputStyle} placeholder="Pick any username"
                  value={guestForm.username} onChange={e => setGuestForm(f => ({ ...f, username: e.target.value }))}
                  onFocus={onFocus} onBlur={onBlur} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,.65)', marginBottom: 6 }}>Gender</label>
                <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                  value={guestForm.gender} onChange={e => setGuestForm(f => ({ ...f, gender: e.target.value }))}
                  onFocus={onFocus} onBlur={onBlur} required>
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <p style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,.3)', marginTop: 5, lineHeight: 1.5 }}>
                  ⚠️ Gender cannot be changed once selected. Fill carefully.
                </p>
              </div>
              <button type="submit" disabled={guestLoading} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,.2)',
                background: guestLoading ? '#555' : 'rgba(255,255,255,.1)',
                color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                fontFamily: 'Outfit,sans-serif', cursor: guestLoading ? 'not-allowed' : 'pointer', marginTop: 4,
              }}>
                {guestLoading
                  ? <><span style={{ width:15,height:15,border:'2px solid rgba(255,255,255,.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .8s linear infinite',display:'inline-block' }} /> Entering...</>
                  : 'Enter as Guest'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.84rem', color: 'rgba(255,255,255,.45)', marginTop: 4 }}>
                New here?{' '}
                <button type="button" onClick={() => setTab('register')} style={{ background: 'none', border: 'none', color: '#1a73e8', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', padding: 0 }}>
                  Register Now
                </button>
              </p>
            </form>
          )}

          {/* REGISTER */}
          {tab === 'register' && (
            regDone ? (
              <div style={{ background: 'rgba(52,168,83,.12)', border: '1px solid rgba(52,168,83,.3)', borderRadius: 12, padding: '28px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem', marginBottom: 8 }}>Account Created!</div>
                <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                  Check your email for a verification link. Once verified, login and start chatting!
                </p>
                <button onClick={() => { setRegDone(false); setTab('login') }} style={{
                  marginTop: 16, padding: '10px 24px', borderRadius: 9, border: 'none',
                  background: 'linear-gradient(135deg,#1a73e8,#1557b0)',
                  color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit,sans-serif',
                }}>Go to Login</button>
              </div>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {regError && (
                  <div style={{ background: 'rgba(234,67,53,.15)', border: '1px solid rgba(234,67,53,.35)', borderRadius: 9, padding: '11px 14px', fontSize: '0.85rem', color: '#ff8a80' }}>
                    {regError}
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,.65)', marginBottom: 6 }}>Username</label>
                  <input style={inputStyle} placeholder="Choose a username"
                    value={regForm.username} onChange={e => setRegForm(f => ({ ...f, username: e.target.value }))}
                    onFocus={onFocus} onBlur={onBlur} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,.65)', marginBottom: 6 }}>Email Address</label>
                  <input type="email" style={inputStyle} placeholder="your@email.com"
                    value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                    onFocus={onFocus} onBlur={onBlur} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,.65)', marginBottom: 6 }}>Password</label>
                  <input type="password" style={inputStyle} placeholder="Create a strong password"
                    value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                    onFocus={onFocus} onBlur={onBlur} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,.65)', marginBottom: 6 }}>Gender</label>
                  <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                    value={regForm.gender} onChange={e => setRegForm(f => ({ ...f, gender: e.target.value }))}
                    onFocus={onFocus} onBlur={onBlur} required>
                    <option value="">Select gender...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <p style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,.3)', marginTop: 5, lineHeight: 1.5 }}>
                    ⚠️ Gender cannot be changed once set. This affects your rank eligibility permanently.
                  </p>
                </div>
                <button type="submit" disabled={regLoading} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px', borderRadius: 10, border: 'none',
                  background: regLoading ? '#555' : 'linear-gradient(135deg,#34a853,#1e8e3e)',
                  color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                  fontFamily: 'Outfit,sans-serif', cursor: regLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 3px 14px rgba(52,168,83,.3)', marginTop: 4,
                }}>
                  {regLoading
                    ? <><span style={{ width:15,height:15,border:'2px solid rgba(255,255,255,.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .8s linear infinite',display:'inline-block' }} /> Creating account...</>
                    : 'Create Free Account'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.84rem', color: 'rgba(255,255,255,.45)', marginTop: 4 }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('login')} style={{ background: 'none', border: 'none', color: '#1a73e8', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', padding: 0 }}>
                    Login
                  </button>
                </p>
              </form>
            )
          )}

          {/* SEO paragraph */}
          <div style={{ marginTop: 36, borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 24 }}>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,.3)', lineHeight: 1.85 }}>
              ChatsGenZ is a <strong style={{ color: 'rgba(255,255,255,.45)' }}>free live chatting site</strong> and <strong style={{ color: 'rgba(255,255,255,.45)' }}>stranger chatting site</strong> built for the next generation. Join as a guest with no registration, or create a free account for full access to public cam chat, video call chat, audio call chat, quiz rooms, virtual gifts, ranks, and gold coins. When registering, please note that <strong style={{ color: 'rgba(255,255,255,.45)' }}>gender cannot be changed once selected</strong> — it affects your rank eligibility and profile permanently. ChatsGenZ is the fastest growing new chatting site — free forever, for everyone worldwide.
            </p>
          </div>
        </div>
      </div>

      <Footer />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        select option { background: #1a2535; color: #fff; }
      `}</style>
    </>
  )
}
