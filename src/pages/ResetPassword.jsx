import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import ScrollToTop from '../components/ScrollToTop.jsx'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

export default function ResetPassword() {
  const [params]  = useSearchParams()
  const token     = params.get('token')

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  const inp = { display:'block', width:'100%', padding:'11px 14px', border:'1.5px solid #dadce0', borderRadius:9, fontSize:'0.9rem', color:'#202124', fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:'#fff', transition:'border-color .15s' }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!token)               { setError('Invalid reset link. Please request a new one.'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm)  { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ token, newPassword:password }) })
      const d = await res.json()
      if (res.ok && d.success) setDone(true)
      else setError(d.error || 'Failed to reset. The link may have expired — please request a new one.')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <>
      <ScrollToTop />
      <Header />
      <div style={{ minHeight:'72vh', background:'#f8f9fa', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 18px' }}>
        <div style={{ background:'#fff', border:'1px solid #e8eaed', borderRadius:16, padding:'36px 28px', maxWidth:420, width:'100%', boxShadow:'0 4px 24px rgba(0,0,0,.06)' }}>

          {done ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:14 }}>🎉</div>
              <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.3rem', color:'#202124', marginBottom:10 }}>Password Updated!</h1>
              <p style={{ color:'#5f6368', fontSize:'0.9rem', lineHeight:1.7, marginBottom:24 }}>
                Your password has been reset successfully. You can now login with your new password.
              </p>
              <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:10, background:'linear-gradient(135deg,#1a73e8,#1557b0)', color:'#fff', fontWeight:800, fontSize:'0.95rem', fontFamily:'Outfit,sans-serif', textDecoration:'none', boxShadow:'0 3px 12px rgba(26,115,232,.32)' }}>
                <i className="fi fi-sr-sign-in" /> Login Now
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
                <div style={{ width:40, height:40, background:'linear-gradient(135deg,#1a73e8,#1557b0)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className="fi fi-sr-lock" style={{ color:'#fff', fontSize:18 }} />
                </div>
                <div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.1rem', color:'#202124' }}>Reset Password</div>
                  <div style={{ fontSize:'0.75rem', color:'#80868b' }}>Enter your new password below</div>
                </div>
              </div>

              {!token && (
                <div style={{ background:'#fce8e6', border:'1px solid #f5c6c2', borderRadius:9, padding:'11px 14px', fontSize:'0.85rem', color:'#c62828', marginBottom:18 }}>
                  ⚠️ Invalid or missing reset token. Please use the link from your email or{' '}
                  <Link to="/login" style={{ color:'#c62828', fontWeight:700 }}>request a new one</Link>.
                </div>
              )}

              {error && (
                <div style={{ background:'#fce8e6', border:'1px solid #f5c6c2', borderRadius:9, padding:'11px 14px', fontSize:'0.85rem', color:'#c62828', marginBottom:16 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:15 }}>
                <div>
                  <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'#3c4043', marginBottom:6 }}>New Password *</label>
                  <input type="password" style={inp} placeholder="Minimum 6 characters"
                    value={password} onChange={e=>setPassword(e.target.value)}
                    onFocus={e=>e.target.style.borderColor='#1a73e8'}
                    onBlur={e=>e.target.style.borderColor='#dadce0'}
                    required disabled={!token} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'#3c4043', marginBottom:6 }}>Confirm New Password *</label>
                  <input type="password" style={inp} placeholder="Repeat your new password"
                    value={confirm} onChange={e=>setConfirm(e.target.value)}
                    onFocus={e=>e.target.style.borderColor='#1a73e8'}
                    onBlur={e=>e.target.style.borderColor='#dadce0'}
                    required disabled={!token} />
                </div>
                <button type="submit" disabled={loading||!token} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px', borderRadius:10, border:'none', marginTop:2, background:(loading||!token)?'#9aa0a6':'linear-gradient(135deg,#1a73e8,#1557b0)', color:'#fff', fontWeight:800, fontSize:'0.95rem', fontFamily:'Outfit,sans-serif', cursor:(loading||!token)?'not-allowed':'pointer', boxShadow:'0 3px 12px rgba(26,115,232,.28)' }}>
                  {loading
                    ? <><span style={{ width:15,height:15,border:'2px solid rgba(255,255,255,.4)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .8s linear infinite',display:'inline-block' }} /> Resetting...</>
                    : <><i className="fi fi-sr-lock" /> Reset Password</>}
                </button>
              </form>

              <div style={{ textAlign:'center', marginTop:18 }}>
                <Link to="/login" style={{ fontSize:'0.84rem', color:'#1a73e8', fontWeight:600, textDecoration:'none' }}>← Back to Login</Link>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </>
  )
}
