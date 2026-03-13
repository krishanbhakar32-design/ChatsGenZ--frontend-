import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Home',           to: '/' },
  { label: 'Chat Directory', to: '/chat-directory' },
  { label: 'Ranks',          to: '/ranks' },
  { label: 'Community',      to: '/community' },
  { label: 'Help',           to: '/help' },
]

const MORE = [
  { label: 'About Us',    to: '/about' },
  { label: 'Blog',        to: '/blog' },
  { label: 'Forum',       to: '/forum' },
  { label: 'Moderation',  to: '/moderation' },
  { label: 'Contact',     to: '/contact' },
  { label: 'FAQ',         to: '/faq' },
]

export default function Header() {
  const [open,    setOpen]    = useState(false)
  const [more,    setMore]    = useState(false)
  const [scrolled,setScrolled]= useState(false)
  const loc = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => { setOpen(false); setMore(false) }, [loc])

  const isActive = (to) => to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to)

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 900,
      background: '#0f1923',
      borderBottom: scrolled ? '1px solid #1e2d3d' : '1px solid transparent',
      boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,.35)' : 'none',
      transition: 'all .2s',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 62, display: 'flex', alignItems: 'center', gap: 0 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 32, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#1a73e8,#aa44ff)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fi fi-sr-comment-alt" style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#fff', letterSpacing: '-0.3px', fontFamily: 'Outfit, sans-serif' }}>
            Chats<span style={{ color: '#1a73e8' }}>GenZ</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }} className="desktop-nav">
          {NAV.map(n => (
            <Link key={n.to} to={n.to} style={{
              padding: '6px 13px', borderRadius: 8, fontSize: '0.845rem', fontWeight: 600,
              color: isActive(n.to) ? '#fff' : 'rgba(255,255,255,0.65)',
              background: isActive(n.to) ? 'rgba(26,115,232,0.25)' : 'transparent',
              transition: 'all .15s',
            }}
              onMouseEnter={e => { if (!isActive(n.to)) e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { if (!isActive(n.to)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' } }}
            >
              {n.label}
            </Link>
          ))}

          {/* More dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMore(m => !m)}
              style={{ padding: '6px 13px', borderRadius: 8, fontSize: '0.845rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', background: 'transparent', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { if (!more) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' } }}
            >
              More <i className={`fi fi-sr-angle-${more ? 'up' : 'down'}`} style={{ fontSize: 11 }} />
            </button>
            {more && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMore(false)} />
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, background: '#1a2535', border: '1px solid #2a3a4d', borderRadius: 12, padding: '6px', minWidth: 170, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
                  {MORE.map(m => (
                    <Link key={m.to} to={m.to} style={{ display: 'block', padding: '9px 14px', fontSize: '0.84rem', color: 'rgba(255,255,255,.75)', borderRadius: 8, fontWeight: 600, transition: 'all .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,115,232,.2)'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.75)' }}
                    >
                      {m.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </nav>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 }} className="desktop-cta">
          <Link to="/login" style={{ padding: '8px 18px', borderRadius: 8, fontSize: '0.845rem', fontWeight: 700, color: 'rgba(255,255,255,.75)', transition: 'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.75)'}
          >
            Login
          </Link>
          <Link to="/login" style={{ padding: '8px 18px', borderRadius: 8, fontSize: '0.845rem', fontWeight: 700, background: 'linear-gradient(135deg,#1a73e8,#1557b0)', color: '#fff', boxShadow: '0 2px 10px rgba(26,115,232,.35)' }}>
            Start Chatting
          </Link>
        </div>

        {/* Hamburger */}
        <button onClick={() => setOpen(o => !o)} style={{ display: 'none', marginLeft: 'auto', color: '#fff', fontSize: 22 }} className="ham-btn" aria-label="Menu">
          <i className={`fi fi-sr-${open ? 'cross' : 'menu-burger'}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: '#0f1923', borderTop: '1px solid #1e2d3d', padding: '12px 20px 20px' }}>
          {[...NAV, ...MORE].map(n => (
            <Link key={n.to} to={n.to} style={{ display: 'block', padding: '11px 14px', fontSize: '0.9rem', fontWeight: 600, color: isActive(n.to) ? '#1a73e8' : 'rgba(255,255,255,.75)', borderRadius: 9 }}>
              {n.label}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: '11px', borderRadius: 9, border: '1.5px solid rgba(255,255,255,.2)', color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>Login</Link>
            <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: '11px', borderRadius: 9, background: 'linear-gradient(135deg,#1a73e8,#1557b0)', color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>Start Chatting</Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 820px) {
          .desktop-nav { display: none !important; }
          .desktop-cta { display: none !important; }
          .ham-btn     { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
