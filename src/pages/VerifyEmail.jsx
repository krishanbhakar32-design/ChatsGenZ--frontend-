import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import ScrollToTop from '../components/ScrollToTop.jsx'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token')

  const [status, setStatus] = useState('loading') // loading | success | error
  const [msg, setMsg]       = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMsg('No verification token found in the link.'); return }
    fetch(`${API}/api/auth/verify-email?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setStatus('success'); setMsg(d.message || 'Email verified!') }
        else           { setStatus('error');   setMsg(d.error || 'Invalid or expired link.') }
      })
      .catch(() => { setStatus('error'); setMsg('Network error. Please try again.') })
  }, [token])

  return (
    <>
      <ScrollToTop />
      <Header />
      <div style={{ minHeight: '70vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 18px' }}>
        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 16, padding: '40px 32px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>

          {status === 'loading' && (
            <>
              <div style={{ width: 48, height: 48, border: '4px solid #e8eaed', borderTop: '4px solid #1a73e8', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 20px' }} />
              <p style={{ color: '#5f6368', fontSize: '0.95rem' }}>Verifying your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.4rem', color: '#202124', marginBottom: 10 }}>Email Verified!</h1>
              <p style={{ color: '#5f6368', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 28 }}>
                Your ChatsGenZ account is now fully activated. You can now login and start chatting, earning ranks, and enjoying all features.
              </p>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#1a73e8,#1557b0)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', fontFamily: 'Outfit,sans-serif', textDecoration: 'none', boxShadow: '0 3px 14px rgba(26,115,232,.35)' }}>
                <i className="fi fi-sr-sign-in" /> Login Now
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
              <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.4rem', color: '#202124', marginBottom: 10 }}>Verification Failed</h1>
              <p style={{ color: '#5f6368', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 8 }}>{msg}</p>
              <p style={{ color: '#80868b', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 28 }}>
                The link may have expired or already been used. Try logging in — if your account is not verified, you can request a new verification email from inside the app.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 9, background: 'linear-gradient(135deg,#1a73e8,#1557b0)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Outfit,sans-serif', textDecoration: 'none' }}>
                  <i className="fi fi-sr-sign-in" /> Go to Login
                </Link>
                <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 9, border: '1.5px solid #dadce0', color: '#5f6368', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>
                  <i className="fi fi-sr-envelope" /> Contact Support
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}
