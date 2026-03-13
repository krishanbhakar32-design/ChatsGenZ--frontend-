import { Link } from 'react-router-dom'

const COLS = [
  {
    title: 'Platform',
    links: [
      { label: 'Chat Directory', to: '/chat-directory' },
      { label: 'Ranks',          to: '/ranks' },
      { label: 'Moderation',     to: '/moderation' },
      { label: 'Community',      to: '/community' },
      { label: 'Blog',           to: '/blog' },
      { label: 'Forum',          to: '/forum' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', to: '/help' },
      { label: 'FAQ',         to: '/faq' },
      { label: 'Contact Us',  to: '/contact' },
      { label: 'Chat Rules',  to: '/chat-rules' },
      { label: 'Sitemap',     to: '/sitemap' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Privacy Policy',   to: '/privacy-policy' },
      { label: 'Cookie Policy',    to: '/cookie-policy' },
      { label: 'Safety Terms',     to: '/safety' },
      { label: 'DMCA',             to: '/dmca' },
      { label: 'Disclaimer',       to: '/disclaimer' },
      { label: 'Legal Terms',      to: '/legal' },
      { label: 'RTI',              to: '/rti' },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{ background: '#0f1923', color: 'rgba(255,255,255,.65)', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 20px 32px', display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 40 }} className="footer-grid">

        {/* Brand */}
        <div>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#1a73e8,#aa44ff)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fi fi-sr-comment-alt" style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#fff', letterSpacing: '-0.3px' }}>
              Chats<span style={{ color: '#1a73e8' }}>GenZ</span>
            </span>
          </Link>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.75, maxWidth: 260, marginBottom: 20 }}>
            A free live chat platform for everyone worldwide. Talk to strangers, join public rooms, video chat, earn ranks and play games on ChatsGenZ.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, background: 'linear-gradient(135deg,#1a73e8,#1557b0)', color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>
              <i className="fi fi-sr-comment-alt" /> Start Chatting
            </Link>
          </div>
        </div>

        {/* Link Columns */}
        {COLS.map(col => (
          <div key={col.title}>
            <h4 style={{ fontWeight: 800, fontSize: '0.82rem', color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>{col.title}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {col.links.map(l => (
                <Link key={l.to} to={l.to} style={{ fontSize: '0.845rem', color: 'rgba(255,255,255,.55)', transition: 'color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.55)'}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: '20px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: '0.8rem' }}>
            &copy; {new Date().getFullYear()} <strong style={{ color: '#fff' }}>ChatsGenZ</strong>. All rights reserved. Free live chat for everyone worldwide.
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link to="/terms" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.45)', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.45)'}
            >Terms</Link>
            <Link to="/privacy-policy" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.45)', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.45)'}
            >Privacy</Link>
            <Link to="/contact" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.45)', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.45)'}
            >Contact</Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 500px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  )
}
