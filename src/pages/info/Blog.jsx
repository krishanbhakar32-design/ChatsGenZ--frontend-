import PageLayout from '../../components/PageLayout.jsx'


export default function Blog() {
  
  
  return (
    <PageLayout seo={{ title: 'Blog – ChatsGenZ News, Updates & Chat Tips', description: 'ChatsGenZ official blog. Latest news, platform updates, chat tips, safety guides, and community stories from India's fastest growing free chat site.', keywords: 'chatsgenz blog, chat tips, free chat news, chatsgenz updates', canonical: '/blog' }}>
      <div className="page-container">
        <h1 className="page-title">Blog</h1>
        <p className="page-subtitle">Latest news, updates, and stories from the ChatsGenZ community</p>
        <div className="prose">
          <p>Welcome to the official <strong>ChatsGenZ Blog</strong>. This is where we share platform updates, community highlights, safety tips, new feature announcements, and stories from our rapidly growing community of chatters across India and the world.</p>
          <p>Our blog covers everything from how to get the most out of your <strong>free chatroom</strong> experience, to safety guides for <strong>stranger chatting</strong>, to announcements about new features and exciting events happening on our platform.</p>
        </div>
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center', marginTop: 24 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 16 }}>Blog posts coming soon. Check back shortly!</p>
          <a href="/login" className="btn-primary">Start Chatting While You Wait →</a>
        </div>
      </div>
    </PageLayout>
  )
}
