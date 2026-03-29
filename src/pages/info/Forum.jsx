import PageLayout from '../../components/PageLayout.jsx'
import { Link } from 'react-router-dom'

const CATEGORIES = [
  { icon: 'fi fi-sr-comment-alt', color: '#1a73e8', title: 'General Discussion',     desc: 'Talk about anything and everything with the ChatsGenZ community. Introductions, random topics, and general chat.',  posts: 1240, threads: 312 },
  { icon: 'fi fi-sr-shield',      color: '#ea4335', title: 'Platform Help and Support',desc: 'Need help with a feature, account issue, or technical problem? Get answers from the community and our support team.',    posts: 856,  threads: 198 },
  { icon: 'fi fi-sr-lightbulb',   color: '#fbbc04', title: 'Suggestions and Feedback', desc: 'Have an idea to improve ChatsGenZ? Share feature requests, design ideas, and feedback directly with our development team.', posts: 445,  threads: 134 },
  { icon: 'fi fi-sr-trophy',      color: '#34a853', title: 'Ranks and Rewards',        desc: 'Discuss rank strategies, XP systems, gold coin tips, and everything related to the ChatsGenZ rewards system.',              posts: 672,  threads: 156 },
  { icon: 'fi fi-sr-gavel',       color: '#aa44ff', title: 'Moderation Feedback',      desc: 'Appeals, moderation questions, and platform policy discussions. Reviewed by our admin team regularly.',                      posts: 328,  threads: 87  },
  { icon: 'fi fi-sr-star',        color: '#00aaff', title: 'Events and Announcements', desc: 'Stay up to date with platform events, competitions, new feature launches, and official announcements from ChatsGenZ.',        posts: 210,  threads: 54  },
]

export default function Forum() {
  return (
    <PageLayout seo={{
      title: 'Forum — ChatsGenZ Community Discussion Board',
      description: 'Join the ChatsGenZ community forum. Discuss platform features, get support, share feedback, and connect with other ChatsGenZ users from around the world.',
      keywords: 'ChatsGenZ forum, chat community forum, ChatsGenZ discussion, ChatsGenZ feedback, chat platform forum',
      canonical: '/forum',
    }}>
      <div className="page-container">
        <h1 className="page-title">Community Forum</h1>
        <p className="page-subtitle">The official ChatsGenZ discussion board. Share ideas, get help, and connect with users from around the world.</p>
        <div className="info-blue" style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fi fi-sr-info" style={{ fontSize: 18, flexShrink: 0 }} />
          The forum is coming soon. In the meantime, use our community chat rooms to connect with other ChatsGenZ users in real time.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {CATEGORIES.map((c, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 14, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 18, boxShadow: '0 1px 4px rgba(60,64,67,.06)', cursor: 'pointer', transition: 'box-shadow .2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(60,64,67,.11)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(60,64,67,.06)'}
            >
              <div style={{ width: 48, height: 48, background: c.color + '15', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, fontSize: 22, flexShrink: 0 }}><i className={c.icon} /></div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 800, fontSize: '0.975rem', color: '#202124', marginBottom: 4, fontFamily: 'Outfit, sans-serif' }}>{c.title}</h3>
                <p style={{ fontSize: '0.845rem', color: '#5f6368', lineHeight: 1.55 }}>{c.desc}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#202124' }}>{c.posts.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#80868b' }}>posts</div>
                <div style={{ fontSize: '0.78rem', color: '#5f6368', marginTop: 2 }}>{c.threads} threads</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link to="/contact" className="btn-primary"><i className="fi fi-sr-envelope" /> Contact Us</Link>
        </div>
      </div>
    </PageLayout>
  )
}
