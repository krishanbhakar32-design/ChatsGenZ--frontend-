import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout.jsx'

const ROOMS = [
  {
    emoji: '🌍',
    title: 'General Chat',
    desc: 'The heart of ChatsGenZ — a lively, mixed community chatroom open to everyone. Talk about anything, meet new people, and enjoy free live chatting with strangers from across India and the world. Perfect for casual conversations, friendly banter, and making new friends online.',
    tags: ['Free', 'Open to All', 'No Registration', '24/7 Active'],
  },
  {
    emoji: '🎬',
    title: 'Bollywood & Movies',
    desc: 'India\'s most passionate movie fans gather here. Discuss the latest Bollywood releases, upcoming films, favourite actors, movie reviews, web series, OTT releases, and everything cinema. A premium chatroom for true movie buffs.',
    tags: ['Bollywood', 'Movies', 'Web Series', 'OTT'],
  },
  {
    emoji: '🎵',
    title: 'Music & Radio',
    desc: 'A dedicated free chatroom for music lovers. Discuss Hindi songs, Punjabi beats, English hits, indie artists, and live radio. Share your favourite tracks, discover new music, and vibe with people who share your taste.',
    tags: ['Music', 'Radio', 'Punjabi', 'Hindi Songs'],
  },
  {
    emoji: '🏏',
    title: 'Sports Room',
    desc: 'Live match discussions, cricket score updates, IPL talk, football analysis, and all sports conversations happen here. The most active chatroom during major matches — join thousands of fans cheering together in real time.',
    tags: ['Cricket', 'IPL', 'Football', 'Sports'],
  },
  {
    emoji: '🧑‍💻',
    title: 'Tech & Gaming',
    desc: 'A space for tech enthusiasts, gamers, coders, and digital creators. Discuss the latest smartphones, PC builds, gaming strategies, apps, AI, crypto, and all things technology. Meet your tribe here.',
    tags: ['Tech', 'Gaming', 'AI', 'Coding'],
  },
  {
    emoji: '❤️',
    title: 'Dating & Romance',
    desc: 'Looking to connect romantically? Our dating chatroom is a safe, moderated space for people seeking genuine romantic connections. Meet interesting singles, enjoy flirty conversations, and maybe find that special someone — all for free.',
    tags: ['Dating', 'Romance', 'Singles', 'Make Friends'],
  },
  {
    emoji: '🔞',
    title: 'Adult Chat (18+)',
    desc: 'A designated adult chatroom strictly for verified users aged 18 and above. Mature conversations in a moderated, secure environment. Age confirmation is required before access. Our secured chat keeps things safe and consensual.',
    tags: ['18+', 'Adults Only', 'Moderated', 'Secured'],
  },
  {
    emoji: '🙏',
    title: 'Regional Chat (Hindi / Desi)',
    desc: 'Yahan aao, Hindi mein baat karo! A warm and welcoming chatroom specifically for Hindi-speaking users and Desi communities worldwide. Chat in your language, share regional jokes, discuss local news, and feel at home.',
    tags: ['Hindi Chat', 'Desi Chat', 'Regional', 'Indian'],
  },
  {
    emoji: '🎮',
    title: 'Quiz Room',
    desc: 'Think you\'re smart? Prove it in our live quiz chatroom! Join real-time quiz contests hosted by GenZBot, answer questions across multiple categories, win gold coins, and climb the leaderboard. India\'s most fun free quiz room!',
    tags: ['Quiz', 'Games', 'Win Gold', 'GenZBot'],
  },
  {
    emoji: '👑',
    title: 'VIP & Premium Lounge',
    desc: 'An exclusive chatroom for VIP, Premium, and high-rank users. Enjoy a quieter, more curated chat experience with the platform\'s most engaged members. Unlock access by earning ranks through active participation and gifting.',
    tags: ['VIP', 'Premium', 'Exclusive', 'High Rank'],
  },
]

export default function ChatDirectory() {
  return (
    <PageLayout seo={{
      title: 'Chat Directory – All Free Chatrooms – ChatsGenZ',
      description: 'Browse all ChatsGenZ free chatrooms. Find the perfect room — general chat, Bollywood, sports, dating, adult chat, Hindi chat, quiz room, VIP lounge and more.',
      keywords: 'free chatrooms india, chat directory, live chat rooms, hindi chat room, dating chat room, adult chat room india, quiz room chat, bollywood chat',
      canonical: '/chat-directory'
    }}>
      <div className="page-container">
        <h1 className="page-title">Chat Directory</h1>
        <p className="page-subtitle">All ChatsGenZ chatrooms in one place — find your room and dive in!</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ROOMS.map(r => (
            <div key={r.title} className="dir-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                  <span style={{ fontSize: 22 }}>{r.emoji}</span>
                  {r.title}
                </h3>
                <Link to="/login" className="dir-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  Try Now
                </Link>
              </div>
              <p>{r.desc}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {r.tags.map(t => (
                  <span key={t} style={{ fontSize: 11, fontWeight: 600, background: 'var(--primary-l)', color: 'var(--primary)', padding: '3px 10px', borderRadius: 20 }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 16, fontFamily: 'var(--font-2)' }}>Ready to join the conversation?</p>
          <Link to="/login" className="btn-primary" style={{ fontSize: 16 }}>
            Enter ChatsGenZ Free →
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}
