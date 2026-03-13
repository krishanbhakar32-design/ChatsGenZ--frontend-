import { Link } from 'react-router-dom'

const FOOTER_LINKS = [
  { label: 'Privacy Policy',  to: '/privacy-policy' },
  { label: 'Terms of Service',to: '/terms' },
  { label: 'DMCA',            to: '/dmca' },
  { label: 'Chat Rules',      to: '/chat-rules' },
  { label: 'Legal Terms',     to: '/legal' },
  { label: 'Chat Directory',  to: '/chat-directory' },
  { label: 'Ranks',           to: '/ranks' },
  { label: 'Moderation',      to: '/moderation' },
  { label: 'Contact Us',      to: '/contact' },
  { label: 'Help Center',     to: '/help' },
  { label: 'FAQ',             to: '/faq' },
  { label: 'Sitemap',         to: '/sitemap' },
  { label: 'Cookie Policy',   to: '/cookie-policy' },
  { label: 'Safety Terms',    to: '/safety' },
  { label: 'Community',       to: '/community' },
]

export default function Footer() {
  return (
    <footer style={{ background: '#0f1923', borderTop: '1px solid #1e2d3d', padding: '28px 20px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Logo + tagline */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/favicon/favicon-192.png" alt="ChatsGenZ" style={{ width: 32, height: 32, borderRadius: 7 }}
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
          />
          <span style={{ display:'none', width:32, height:32, background:'linear-gradient(135deg,#1a73e8,#aa44ff)', borderRadius:7, alignItems:'center', justifyContent:'center' }}>
            <i className="fi fi-sr-comment-alt" style={{ color:'#fff', fontSize:14 }} />
          </span>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.1rem', color: '#fff' }}>
            Chats<span style={{ color: '#1a73e8' }}>GenZ</span>
          </span>
        </div>

        {/* All links in one row, wrapping */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 0', alignItems: 'center' }}>
          {FOOTER_LINKS.map((l, i) => (
            <span key={l.to} style={{ display: 'flex', alignItems: 'center' }}>
              <Link to={l.to} style={{
                fontSize: '0.82rem', color: 'rgba(255,255,255,.55)',
                textDecoration: 'none', padding: '3px 10px',
                transition: 'color .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.55)'}
              >{l.label}</Link>
              {i < FOOTER_LINKS.length - 1 && (
                <span style={{ color: 'rgba(255,255,255,.18)', fontSize: '0.75rem' }}>|</span>
              )}
            </span>
          ))}
        </div>

        {/* Copyright */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #1e2d3d', fontSize: '0.78rem', color: 'rgba(255,255,255,.3)', textAlign: 'center' }}>
          © {new Date().getFullYear()} ChatsGenZ. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
