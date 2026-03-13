import PageLayout from '../../components/PageLayout.jsx'
import { Link } from 'react-router-dom'

const TOPICS = [
  { icon: 'fi fi-sr-user', color: '#1a73e8', title: 'Account and Profile',
    items: ['How to register a free account', 'Change your username or password', 'Upload or change your profile photo', 'Adjust privacy and notification settings', 'Delete your account'] },
  { icon: 'fi fi-sr-comment-alt', color: '#34a853', title: 'Chat Rooms',
    items: ['How to join a public chat room', 'How to create your own chat room', 'Setting room rules and entrance requirements', 'Muting, kicking and banning users in your room', 'Room categories and the Chat Directory'] },
  { icon: 'fi fi-sr-video-camera', color: '#ea4335', title: 'Video and Audio Calls',
    items: ['Starting a private video call', 'Starting a private audio call', 'Fixing camera or microphone not working', 'Group call features in chat rooms', 'Ending or rejecting calls'] },
  { icon: 'fi fi-sr-trophy', color: '#fbbc04', title: 'Ranks and Gold Coins',
    items: ['How the XP and rank system works', 'Ways to earn gold coins on ChatsGenZ', 'What gold coins can be used for', 'How to send virtual gifts to other users', 'Understanding Premium rank benefits'] },
  { icon: 'fi fi-sr-shield', color: '#aa44ff', title: 'Safety and Reporting',
    items: ['How to report a user or message', 'How to block another user', 'What happens after you submit a report', 'Appealing a ban or mute decision', 'Keeping yourself safe while chatting'] },
  { icon: 'fi fi-sr-game', color: '#00aaff', title: 'Games and Features',
    items: ['How the Quiz Room works', 'Dice and spin wheel games', 'Daily bonus and how to claim it', 'Using emoticons and stickers in chat', 'Virtual gifts — sending and receiving'] },
]

export default function Help() {
  return (
    <PageLayout seo={{
      title: 'Help Center — ChatsGenZ Support and Guides',
      description: 'The ChatsGenZ Help Center. Find answers on accounts, chat rooms, video calls, ranks, gold coins, safety, games and all platform features on ChatsGenZ.',
      keywords: 'ChatsGenZ help, ChatsGenZ support, chat help center, ChatsGenZ guide, how to use ChatsGenZ',
      canonical: '/help',
    }}>
      <div className="page-container">
        <h1 className="page-title">Help Center</h1>
        <p className="page-subtitle">Find answers to all your questions about using ChatsGenZ. Browse by topic or use our Contact page for personal support.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 18, marginBottom: 44 }}>
          {TOPICS.map((t, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 14, padding: '22px 20px', boxShadow: '0 1px 4px rgba(60,64,67,.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, background: t.color + '15', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.color, fontSize: 20 }}><i className={t.icon} /></div>
                <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#202124', fontFamily: 'Outfit, sans-serif' }}>{t.title}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {t.items.map((item, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: '#1a73e8', cursor: 'pointer' }}>
                    <i className="fi fi-sr-angle-right" style={{ fontSize: 11, color: '#80868b' }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 14, padding: '28px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#202124', marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>Still need help?</h3>
            <p style={{ fontSize: '0.875rem', color: '#5f6368', lineHeight: 1.6 }}>Can not find what you are looking for? Our support team is happy to help you directly.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/faq" className="btn-outline"><i className="fi fi-sr-interrogation" /> View FAQ</Link>
            <Link to="/contact" className="btn-primary"><i className="fi fi-sr-envelope" /> Contact Support</Link>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
