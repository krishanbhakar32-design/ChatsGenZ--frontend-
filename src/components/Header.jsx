import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

// Desktop nav links — only 5
const NAV_LINKS = [
  { label: 'About Us',   to: '/about' },
  { label: 'Blog',       to: '/blog' },
  { label: 'Disclaimer', to: '/disclaimer' },
  { label: 'RTI',        to: '/rti' },
  { label: 'Forum',      to: '/forum' },
]

// Mobile dropdown — same 5
const MOBILE_LINKS = [
  { label: 'About Us',   to: '/about' },
  { label: 'Blog',       to: '/blog' },
  { label: 'Disclaimer', to: '/disclaimer' },
  { label: 'RTI',        to: '/rti' },
  { label: 'Forum',      to: '/forum' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const loc = useLocation()
  const menuRef = useRef(null)

  useEffect(() => { setMenuOpen(false) }, [loc])

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 900,
      background: '#0f1923',
      borderBottom: '1px solid #1e2d3d',
      boxShadow: '0 2px 12px rgba(0,0,0,.3)',
      willChange: 'transform', // prevents sticky from breaking inside flex containers
    }}>

      {/* ── MOBILE HEADER ─────────────────────────────── */}
      <div className="hdr-mobile" style={{
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 54,
      }}>
        {/* Left: favicon */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/favicon/favicon-192.png" alt="ChatsGenZ" style={{ width: 34, height: 34, borderRadius: 8 }}
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <span style={{ display: 'none', width: 34, height: 34, background: 'linear-gradient(135deg,#1a73e8,#aa44ff)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
            <i className="fi fi-sr-comment-alt" style={{ color: '#fff', fontSize: 16 }} />
          </span>
        </Link>

        {/* Center: site name */}
        <Link to="/" style={{ textDecoration: 'none', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.3px' }}>
            Chats<span style={{ color: '#1a73e8' }}>GenZ</span>
          </span>
        </Link>

        {/* Right: hamburger */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <i className={`fi fi-sr-${menuOpen ? 'cross' : 'menu-burger'}`} />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: '#1a2535', border: '1px solid #2a3a4d',
              borderRadius: 12, padding: '8px', minWidth: 200,
              boxShadow: '0 8px 32px rgba(0,0,0,.5)', zIndex: 999,
            }}>
              {MOBILE_LINKS.map(l => (
                <Link key={l.to} to={l.to} style={{
                  display: 'block', padding: '10px 14px',
                  fontSize: '0.875rem', fontWeight: 600,
                  color: loc.pathname === l.to ? '#1a73e8' : 'rgba(255,255,255,.8)',
                  borderRadius: 8, textDecoration: 'none', transition: 'all .12s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,115,232,.15)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = loc.pathname === l.to ? '#1a73e8' : 'rgba(255,255,255,.8)' }}
                >{l.label}</Link>
              ))}
              <div style={{ borderTop: '1px solid #2a3a4d', marginTop: 6, paddingTop: 8 }}>
                <Link to="/login" style={{
                  display: 'block', textAlign: 'center', padding: '10px',
                  background: 'linear-gradient(135deg,#1a73e8,#1557b0)',
                  color: '#fff', borderRadius: 8, fontWeight: 700,
                  fontSize: '0.875rem', textDecoration: 'none',
                }}>Start Chatting Free</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DESKTOP / TABLET HEADER ───────────────────── */}
      <div className="hdr-desktop" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Top row: icon + big site name */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 4 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <img src="/favicon/favicon-192.png" alt="ChatsGenZ" style={{ width: 40, height: 40, borderRadius: 10 }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <span style={{ display: 'none', width: 40, height: 40, background: 'linear-gradient(135deg,#1a73e8,#aa44ff)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
              <i className="fi fi-sr-comment-alt" style={{ color: '#fff', fontSize: 18 }} />
            </span>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.5rem', color: '#fff', letterSpacing: '-0.4px' }}>
              Chats<span style={{ color: '#1a73e8' }}>GenZ</span>
            </span>
          </Link>

          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 22px', borderRadius: 9,
            background: 'linear-gradient(135deg,#1a73e8,#1557b0)',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            textDecoration: 'none', boxShadow: '0 2px 10px rgba(26,115,232,.35)',
            flexShrink: 0,
          }}>
            <i className="fi fi-sr-comment-alt" style={{ fontSize: 14 }} /> Start Chatting
          </Link>
        </div>

        {/* Bottom row: nav links below site name */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 8, borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 6 }}>
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to} style={{
              padding: '5px 14px', borderRadius: 7,
              fontSize: '0.845rem', fontWeight: 600,
              color: loc.pathname === l.to ? '#fff' : 'rgba(255,255,255,.6)',
              background: loc.pathname === l.to ? 'rgba(26,115,232,.22)' : 'transparent',
              textDecoration: 'none', transition: 'all .15s',
            }}
              onMouseEnter={e => { if (loc.pathname !== l.to) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,.07)' } }}
              onMouseLeave={e => { if (loc.pathname !== l.to) { e.currentTarget.style.color = 'rgba(255,255,255,.6)'; e.currentTarget.style.background = 'transparent' } }}
            >{l.label}</Link>
          ))}
          <span style={{ marginLeft: 4, color: 'rgba(255,255,255,.2)', fontSize: '0.8rem' }}>|</span>
          <Link to="/login" style={{
            padding: '5px 14px', borderRadius: 7,
            fontSize: '0.845rem', fontWeight: 600,
            color: 'rgba(255,255,255,.5)', textDecoration: 'none', transition: 'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.5)' }}
          >Login</Link>
        </nav>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .hdr-mobile  { display: flex !important; }
          .hdr-desktop { display: none !important; }
        }
        @media (min-width: 701px) {
          .hdr-mobile  { display: none !important; }
          .hdr-desktop { display: block !important; }
        }
      `}</style>
    </header>
  )
}
