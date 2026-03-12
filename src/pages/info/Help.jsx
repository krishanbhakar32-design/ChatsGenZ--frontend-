import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout.jsx'

const TOPICS = [
  { emoji: '👤', title: 'Account & Login', desc: 'Registering, logging in, guest access, password reset, profile setup', link: '/faq' },
  { emoji: '💬', title: 'Chatrooms & Messaging', desc: 'Joining rooms, sending messages, private chat, reactions, file sharing', link: '/faq' },
  { emoji: '📹', title: 'Video & Audio Calls', desc: 'Starting a call, cam setup, WebRTC troubleshooting, call quality', link: '/faq' },
  { emoji: '🏆', title: 'Ranks & Gold Coins', desc: 'How ranks work, earning XP, spending gold, rank perks, levelling up', link: '/ranks' },
  { emoji: '🛡️', title: 'Safety & Reporting', desc: 'Blocking users, reporting content, understanding bans, staying safe', link: '/safety' },
  { emoji: '⚙️', title: 'Account Settings', desc: 'Changing username, avatar, privacy settings, notifications, password', link: '/faq' },
  { emoji: '📜', title: 'Rules & Policies', desc: 'Chat rules, terms of service, privacy policy, legal information', link: '/chat-rules' },
  { emoji: '✉️', title: 'Contact Support', desc: 'Can\'t find your answer? Reach out to our team directly', link: '/contact' },
]

export default function Help() {
  return (
    <PageLayout seo={{
      title: 'Help Center – ChatsGenZ Support & Guides',
      description: 'ChatsGenZ Help Center. Find answers to common questions, guides for using our free chat platform, and how to contact our support team.',
      keywords: 'chatsgenz help, chat support center, free chat guide, chatsgenz how to, chat help india',
      canonical: '/help'
    }}>
      <div className="page-container">
        <h1 className="page-title">Help Center</h1>
        <p className="page-subtitle">How can we help you today? Browse topics or search for your question</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 32 }} className="help-grid">
          {TOPICS.map(t => (
            <Link key={t.title} to={t.link} style={{ display: 'flex', gap: 14, padding: '18px 20px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', transition: 'all .2s', textDecoration: 'none', color: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>{t.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: 'var(--font-2)', lineHeight: 1.5 }}>{t.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Still need help?</p>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 16, fontFamily: 'var(--font-2)' }}>Our support team responds within 24–48 hours on business days.</p>
          <Link to="/contact" className="btn-primary">Contact Support →</Link>
        </div>
      </div>
      <style>{`@media(max-width:600px){ .help-grid { grid-template-columns: 1fr !important; } }`}</style>
    </PageLayout>
  )
}
