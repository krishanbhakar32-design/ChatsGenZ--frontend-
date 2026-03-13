import PageLayout from '../../components/PageLayout.jsx'
import { Link } from 'react-router-dom'

const FEATURES = [
  { icon: 'fi fi-sr-comment-alt', color: '#1a73e8', title: 'Public Chat Rooms',    desc: 'Jump into any active public room and connect with people from all around the world. Language rooms, interest rooms, regional rooms and more.' },
  { icon: 'fi fi-sr-trophy',      color: '#fbbc04', title: 'Ranks and Achievements',desc: 'Earn XP by chatting, playing games and receiving gifts. Level up from Guest to Legend and unlock exclusive privileges as you grow.' },
  { icon: 'fi fi-sr-gift',        color: '#ea4335', title: 'Virtual Gifts',         desc: 'Show appreciation by sending virtual gifts. From roses and stars to premium items — gifting is a core part of the ChatsGenZ culture.' },
  { icon: 'fi fi-sr-game',        color: '#34a853', title: 'Games and Contests',    desc: 'Test your knowledge in Quiz Rooms, roll the dice, spin the wheel and compete with others for gold coins and top leaderboard spots.' },
  { icon: 'fi fi-sr-user-add',    color: '#aa44ff', title: 'Friends and Social',    desc: 'Add users to your friends list, view profiles, send private messages, and build your own social circle inside ChatsGenZ.' },
  { icon: 'fi fi-sr-shield',      color: '#00aaff', title: 'Safe Environment',      desc: 'Our moderation team works around the clock to keep every room safe, welcoming and free from harassment, spam and inappropriate content.' },
]

const GUIDELINES = [
  'Be respectful to all users at all times',
  'No hate speech, slurs or discrimination of any kind',
  'No spamming, flooding or repeating messages',
  'Never share personal contact details publicly',
  'Follow all room-specific rules set by room owners',
  'Report rule violations — do not engage or retaliate',
]

export default function Community() {
  return (
    <PageLayout seo={{
      title: 'Community — Join the ChatsGenZ Global Chat Community',
      description: 'Be part of the ChatsGenZ community. Chat worldwide, earn ranks, send gifts, play games and build friendships on the ChatsGenZ free live chat platform.',
      keywords: 'ChatsGenZ community, online chat community, global chat friends, ChatsGenZ ranks, free chat platform community',
      canonical: '/community',
    }}>
      <div className="page-container">
        <h1 className="page-title">Our Community</h1>
        <p className="page-subtitle">ChatsGenZ is more than a chat platform — it is a worldwide community of real people connecting every single day.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(265px, 1fr))', gap: 18, marginBottom: 44 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 14, padding: '22px 18px', boxShadow: '0 1px 4px rgba(60,64,67,.06)' }}>
              <div style={{ width: 44, height: 44, background: f.color + '15', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, fontSize: 20, marginBottom: 14 }}><i className={f.icon} /></div>
              <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#202124', marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>{f.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#5f6368', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 14, padding: '28px 24px', marginBottom: 40 }}>
          <h2 style={{ fontWeight: 800, color: '#202124', fontSize: '1.1rem', marginBottom: 18, fontFamily: 'Outfit, sans-serif' }}>Community Guidelines</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {GUIDELINES.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 9, padding: '10px 14px', border: '1px solid #e8eaed' }}>
                <i className="fi fi-sr-check-circle" style={{ color: '#34a853', fontSize: 16, flexShrink: 0 }} />
                <span style={{ fontSize: '0.845rem', color: '#3c4043' }}>{g}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link to="/login" className="btn-primary" style={{ fontSize: '1rem', padding: '13px 30px' }}>
            <i className="fi fi-sr-comment-alt" /> Join ChatsGenZ Free
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}
