import { Link } from 'react-router-dom'

const COLS = [
  {
    heading: 'ChatsGenZ',
    links: [
      { to: '/about',         label: 'About Us' },
      { to: '/blog',          label: 'Blog' },
      { to: '/forum',         label: 'Forum' },
      { to: '/community',     label: 'Community' },
      { to: '/contact',       label: 'Contact Us' },
    ],
  },
  {
    heading: 'Features',
    links: [
      { to: '/chat-directory', label: 'Chat Rooms' },
      { to: '/ranks',          label: 'Ranks & Levels' },
      { to: '/moderation',     label: 'Moderation' },
      { to: '/help',           label: 'Help Center' },
      { to: '/faq',            label: 'FAQ' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { to: '/privacy-policy', label: 'Privacy Policy' },
      { to: '/terms',          label: 'Terms of Service' },
      { to: '/chat-rules',     label: 'Chat Rules' },
      { to: '/dmca',           label: 'DMCA' },
      { to: '/cookie-policy',  label: 'Cookie Policy' },
      { to: '/safety',         label: 'Safety Terms' },
      { to: '/legal',          label: 'Legal Terms' },
      { to: '/disclaimer',     label: 'Disclaimer' },
      { to: '/rti',            label: 'RTI / Transparency' },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(135deg, #0a1420 0%, #0f1923 60%, #1a2a3a 100%)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      color: 'rgba(255,255,255,0.7)',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 20px 0' }}>
        {/* Top: Brand + Columns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, marginBottom: 40 }}>
          {/* Brand block */}
          <div style={{ flex: '1 1 220px', minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36,
                background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
                borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(26,115,232,0.4)',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
                  <circle cx="8"  cy="11" r="1.5" fill="#1a73e8"/>
                  <circle cx="12" cy="11" r="1.5" fill="#1a73e8"/>
                  <circle cx="16" cy="11" r="1.5" fill="#1a73e8"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff' }}>
                Chats<span style={{ color: '#4da3ff' }}>GenZ</span>
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.5)', marginBottom: 18, maxWidth: 220 }}>
              Free live chat platform for everyone. No registration required. Talk to strangers worldwide.
            </p>
            <Link to="/login" style={{
              display: 'inline-block', padding: '9px 20px', borderRadius: 8,
              background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
              color: '#fff', fontWeight: 700, fontSize: '0.85rem',
              textDecoration: 'none', boxShadow: '0 2px 10px rgba(26,115,232,0.4)',
            }}>
              Start Chatting Free
            </Link>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.heading} style={{ flex: '1 1 140px', minWidth: 130 }}>
              <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                {col.heading}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.links.map(l => (
                  <li key={l.to}>
                    <Link to={l.to} style={{
                      color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem',
                      textDecoration: 'none', transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.target.style.color = '#4da3ff'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '16px 0',
          display: 'flex', flexWrap: 'wrap', gap: 12,
          justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)',
        }}>
          <span>© {new Date().getFullYear()} ChatsGenZ. All rights reserved.</span>
          <span style={{ display: 'flex', gap: 16 }}>
            <Link to="/sitemap" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Sitemap</Link>
            <Link to="/privacy-policy" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Privacy</Link>
            <Link to="/terms" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
