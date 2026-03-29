import PageLayout from '../../components/PageLayout.jsx'
import { Link } from 'react-router-dom'

const SECTIONS = [
  {
    title: 'Main Pages', icon: 'fi fi-sr-home', color: '#1a73e8',
    links: [
      { label: 'Home',           to: '/',               desc: 'ChatsGenZ main landing page' },
      { label: 'Chat Directory', to: '/chat-directory', desc: 'Browse all available chat rooms' },
      { label: 'Ranks',          to: '/ranks',          desc: 'All platform ranks and XP system' },
      { label: 'Moderation',     to: '/moderation',     desc: 'Platform and room staff structure' },
      { label: 'Community',      to: '/community',      desc: 'Community features and guidelines' },
    ],
  },
  {
    title: 'Information', icon: 'fi fi-sr-info', color: '#34a853',
    links: [
      { label: 'About Us',   to: '/about',     desc: 'Our story, mission, and values' },
      { label: 'Blog',       to: '/blog',      desc: 'News, tips, and platform updates' },
      { label: 'Forum',      to: '/forum',     desc: 'Community discussion board' },
      { label: 'Help Center',to: '/help',      desc: 'Guides and platform support topics' },
      { label: 'FAQ',        to: '/faq',       desc: 'Frequently asked questions' },
      { label: 'Contact Us', to: '/contact',   desc: 'Get in touch with our team' },
      { label: 'RTI',        to: '/rti',       desc: 'Right to information policy' },
    ],
  },
  {
    title: 'Legal', icon: 'fi fi-sr-scale', color: '#aa44ff',
    links: [
      { label: 'Terms of Service', to: '/terms',          desc: 'User agreement for ChatsGenZ' },
      { label: 'Privacy Policy',   to: '/privacy-policy', desc: 'How we handle your data' },
      { label: 'Cookie Policy',    to: '/cookie-policy',  desc: 'Our use of cookies' },
      { label: 'Safety Terms',     to: '/safety',         desc: 'Safety rules and responsibilities' },
      { label: 'Chat Rules',       to: '/chat-rules',     desc: '10 core chat room rules' },
      { label: 'DMCA',             to: '/dmca',           desc: 'Copyright infringement policy' },
      { label: 'Legal Terms',      to: '/legal',          desc: 'Additional legal notices' },
      { label: 'Disclaimer',       to: '/disclaimer',     desc: 'Platform disclaimer notice' },
    ],
  },
]

export default function Sitemap() {
  return (
    <PageLayout seo={{
      title: 'Sitemap — All Pages on ChatsGenZ',
      description: 'The complete ChatsGenZ sitemap. Find every page on the ChatsGenZ free live chat platform including features, legal pages, help, community and more.',
      keywords: 'ChatsGenZ sitemap, all ChatsGenZ pages, ChatsGenZ page list, ChatsGenZ navigation',
      canonical: '/sitemap',
    }}>
      <div className="page-container">
        <h1 className="page-title">Sitemap</h1>
        <p className="page-subtitle">A complete list of all pages on ChatsGenZ.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {SECTIONS.map((sec, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: sec.color + '18', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sec.color, fontSize: 17 }}>
                  <i className={sec.icon} />
                </div>
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#202124', fontFamily: 'Outfit, sans-serif' }}>{sec.title}</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {sec.links.map((l, j) => (
                  <Link key={j} to={l.to} style={{ display: 'flex', flexDirection: 'column', gap: 3, background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: '12px 16px', transition: 'all .15s', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = sec.color; e.currentTarget.style.boxShadow = `0 2px 10px ${sec.color}20` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8eaed'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: sec.color }}>{l.label}</span>
                    <span style={{ fontSize: '0.78rem', color: '#80868b' }}>{l.desc}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
