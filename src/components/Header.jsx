import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/about',          label: 'About' },
  { to: '/chat-directory', label: 'Chat Rooms' },
  { to: '/ranks',          label: 'Ranks' },
  { to: '/blog',           label: 'Blog' },
  { to: '/help',           label: 'Help' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const loc = useLocation()

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: 'linear-gradient(135deg, #0f1923 0%, #1a2a3a 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 20px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(26,115,232,0.5)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
              <circle cx="8"  cy="11" r="1.5" fill="#1a73e8"/>
              <circle cx="12" cy="11" r="1.5" fill="#1a73e8"/>
              <circle cx="16" cy="11" r="1.5" fill="#1a73e8"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.3px' }}>
            Chats<span style={{ color: '#4da3ff' }}>GenZ</span>
          </span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="hdr-desktop-nav">
          {NAV.map(l => (
            <Link key={l.to} to={l.to} style={{
              padding: '6px 14px', borderRadius: 8,
              fontSize: '0.875rem', fontWeight: 500,
              color: loc.pathname === l.to ? '#4da3ff' : 'rgba(255,255,255,0.78)',
              background: loc.pathname === l.to ? 'rgba(77,163,255,0.12)' : 'transparent',
              transition: 'all 0.2s', textDecoration: 'none',
            }}>
              {l.label}
            </Link>
          ))}
          <Link to="/login" style={{
            marginLeft: 8, padding: '8px 20px', borderRadius: 8,
            background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
            color: '#fff', fontWeight: 700, fontSize: '0.875rem',
            boxShadow: '0 2px 10px rgba(26,115,232,0.45)',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Start Chatting Free
          </Link>
        </nav>

        <button onClick={() => setOpen(o => !o)} aria-label="Toggle menu" className="hdr-mobile-btn"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#fff', display: 'none' }}>
          {open
            ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
      </div>

      {open && (
        <div style={{ background: '#0f1923', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 20px 16px' }}>
          {NAV.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} style={{
              display: 'block', padding: '10px 0',
              color: loc.pathname === l.to ? '#4da3ff' : 'rgba(255,255,255,0.8)',
              fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              {l.label}
            </Link>
          ))}
          <Link to="/login" onClick={() => setOpen(false)} style={{
            display: 'block', marginTop: 12, padding: '11px 0', textAlign: 'center',
            background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
            color: '#fff', fontWeight: 700, borderRadius: 8, textDecoration: 'none',
          }}>
            Start Chatting Free
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hdr-desktop-nav { display: none !important; }
          .hdr-mobile-btn  { display: block !important; }
        }
      `}</style>
    </header>
  )
}
