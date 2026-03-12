import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout.jsx'

const SECTIONS = [
  {
    title: '🏠 Main',
    links: [{ to: '/', label: 'Home — ChatsGenZ Free Chat' }]
  },
  {
    title: '📋 Information',
    links: [
      { to: '/about',          label: 'About Us' },
      { to: '/rti',            label: 'Right to Information (RTI)' },
      { to: '/blog',           label: 'Blog' },
      { to: '/forum',          label: 'Forum' },
      { to: '/disclaimer',     label: 'Disclaimer' },
      { to: '/chat-directory', label: 'Chat Directory' },
      { to: '/ranks',          label: 'Ranks & Levels' },
      { to: '/moderation',     label: 'Moderation Policy' },
      { to: '/community',      label: 'Community Guidelines' },
    ]
  },
  {
    title: '🆘 Support',
    links: [
      { to: '/contact',        label: 'Contact Us' },
      { to: '/help',           label: 'Help Center' },
      { to: '/faq',            label: 'FAQ' },
    ]
  },
  {
    title: '⚖️ Legal',
    links: [
      { to: '/privacy-policy', label: 'Privacy Policy' },
      { to: '/terms',          label: 'Terms of Service' },
      { to: '/dmca',           label: 'DMCA Policy' },
      { to: '/chat-rules',     label: 'Chat Rules' },
      { to: '/legal',          label: 'Legal Terms' },
      { to: '/cookie-policy',  label: 'Cookie Policy' },
      { to: '/safety',         label: 'Safety Terms' },
    ]
  },
]

export default function Sitemap() {
  return (
    <PageLayout seo={{
      title: 'Sitemap – All Pages on ChatsGenZ',
      description: 'ChatsGenZ sitemap — a complete list of all pages on our free live chat platform including all information, legal, and support pages.',
      keywords: 'chatsgenz sitemap, chatsgenz all pages, free chat site map',
      canonical: '/sitemap'
    }}>
      <div className="page-container">
        <h1 className="page-title">Sitemap</h1>
        <p className="page-subtitle">A complete list of all pages on ChatsGenZ</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }} className="sitemap-grid">
          {SECTIONS.map(s => (
            <div key={s.title} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14, color: 'var(--text)' }}>{s.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.links.map(l => (
                  <Link key={l.to} to={l.to} style={{ fontSize: 14, color: 'var(--primary)', fontFamily: 'var(--font-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:600px){ .sitemap-grid { grid-template-columns: 1fr !important; } }`}</style>
    </PageLayout>
  )
}
