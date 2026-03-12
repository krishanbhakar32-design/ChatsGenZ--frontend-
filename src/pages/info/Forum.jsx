import PageLayout from '../../components/PageLayout.jsx'


export default function Forum() {
  
  
  return (
    <PageLayout seo={{ title: 'Community Forum – ChatsGenZ Discussions', description: 'ChatsGenZ Community Forum — discuss topics, share feedback, report bugs, suggest features, and connect with fellow chatters.', keywords: 'chatsgenz forum, chat community, chatsgenz discussions, chat forum india', canonical: '/forum' }}>
      <div className="page-container">
        <h1 className="page-title">Forum</h1>
        <p className="page-subtitle">Community discussions, suggestions, and conversations</p>
        <div className="prose">
          <p>The <strong>ChatsGenZ Community Forum</strong> is a dedicated space for our users to discuss topics, share feedback, report bugs, suggest new features, and connect with fellow community members outside of the live chatrooms. This is your voice — we listen to every suggestion and use your feedback to improve our <strong>free chat platform</strong>.</p>
          <p>Topics covered in our forum include general chat discussions, feature requests for our <strong>free chatrooms</strong>, safety and moderation discussions, technical support, and regional community boards for <strong>Hindi chat</strong>, Tamil, Telugu, and more.</p>
        </div>
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center', marginTop: 24 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 16 }}>Forum launching soon. Stay tuned!</p>
          <a href="/login" className="btn-primary">Go to Chat Now →</a>
        </div>
      </div>
    </PageLayout>
  )
}
