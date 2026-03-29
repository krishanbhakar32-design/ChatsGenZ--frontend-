import PageLayout from '../../components/PageLayout.jsx'

const POSTS = [
  { icon: 'fi fi-sr-shield',       color: '#1a73e8', tag: 'Safety',    date: 'March 2025',    title: 'How to Stay Safe While Chatting Online',          desc: 'Online safety matters for everyone. Learn key practices that protect your personal information on any chat platform, including ChatsGenZ.' },
  { icon: 'fi fi-sr-trophy',       color: '#fbbc04', tag: 'Features',  date: 'February 2025', title: 'The Complete Guide to ChatsGenZ Ranks',            desc: 'From Guest to Legend — everything you need to know about the rank system, how XP works, and how to unlock privileges on ChatsGenZ.' },
  { icon: 'fi fi-sr-users',        color: '#34a853', tag: 'Community', date: 'February 2025', title: 'How to Make Real Friends in Online Chat Rooms',    desc: 'Chat rooms are one of the most underrated places to build real friendships. Proven tips for turning conversations into lasting connections.' },
  { icon: 'fi fi-sr-video-camera', color: '#ea4335', tag: 'Tips',      date: 'January 2025',  title: 'Video Chat Etiquette: What You Need to Know',     desc: 'Video chatting with strangers has its own social norms. Whether you are new to cam chat or a pro, these tips will make every session better.' },
  { icon: 'fi fi-sr-gavel',        color: '#aa44ff', tag: 'Platform',  date: 'January 2025',  title: 'How Chat Room Moderation Works on ChatsGenZ',     desc: 'Ever wondered how rooms stay safe and orderly? We explain exactly how ChatsGenZ moderation works, from filters to our dedicated staff team.' },
  { icon: 'fi fi-sr-game',         color: '#00aaff', tag: 'Games',     date: 'December 2024', title: 'Quiz Rooms: Win Gold Coins and Have Fun',         desc: 'The Quiz Room is one of the most popular features on ChatsGenZ. Learn how to play, what questions appear, and how to maximise coin earnings.' },
]

export default function Blog() {
  return (
    <PageLayout seo={{
      title: 'Blog — ChatsGenZ News, Tips and Platform Updates',
      description: 'The official ChatsGenZ blog. Read the latest news, platform updates, safety guides, chat tips and community stories from the ChatsGenZ team.',
      keywords: 'ChatsGenZ blog, chat tips, online chat guide, ChatsGenZ updates, chat safety tips, ChatsGenZ news',
      canonical: '/blog',
    }}>
      <div className="page-container">
        <h1 className="page-title">ChatsGenZ Blog</h1>
        <p className="page-subtitle">News, tips, guides and updates from the ChatsGenZ team.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(275px, 1fr))', gap: 20 }}>
          {POSTS.map((p, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 14, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 4px rgba(60,64,67,.06)', cursor: 'pointer', transition: 'box-shadow .2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(60,64,67,.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(60,64,67,.06)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, background: p.color + '15', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color, fontSize: 18 }}><i className={p.icon} /></div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#f1f3f4', color: '#5f6368', padding: '3px 10px', borderRadius: 20 }}>{p.tag}</span>
              </div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#202124', lineHeight: 1.45, fontFamily: 'Outfit, sans-serif' }}>{p.title}</h2>
              <p style={{ fontSize: '0.84rem', color: '#5f6368', lineHeight: 1.65, flex: 1 }}>{p.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: '0.75rem', color: '#80868b' }}>{p.date}</span>
                <span style={{ fontSize: '0.78rem', color: '#1a73e8', fontWeight: 600 }}>Read more →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
