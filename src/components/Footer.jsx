import { Link } from 'react-router-dom'

const FOOTER_LINKS = [
  { to: '/privacy-policy',  label: 'Privacy Policy' },
  { to: '/terms',           label: 'Terms of Service' },
  { to: '/dmca',            label: 'DMCA' },
  { to: '/chat-rules',      label: 'Chat Rules' },
  { to: '/legal',           label: 'Legal Terms' },
  { to: '/chat-directory',  label: 'Chat Directory' },
  { to: '/ranks',           label: 'Ranks' },
  { to: '/moderation',      label: 'Moderation' },
  { to: '/contact',         label: 'Contact Us' },
  { to: '/help',            label: 'Help Center' },
  { to: '/faq',             label: 'FAQ' },
  { to: '/sitemap',         label: 'Sitemap' },
  { to: '/cookie-policy',   label: 'Cookie Policy' },
  { to: '/safety',          label: 'Safety Terms' },
  { to: '/community',       label: 'Community' },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-links">
          {FOOTER_LINKS.map(l => (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ChatsGenZ. All rights reserved.</span>
          <span>Made with ❤️ for the next generation of chatters</span>
        </div>
      </div>
    </footer>
  )
}
