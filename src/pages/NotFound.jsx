import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'

export default function NotFound() {
  return (
    <>
      <SEO title="404 – Page Not Found" description="This page doesn't exist on ChatsGenZ." />
      <Header />
      <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>404</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '12px 0 8px' }}>Page Not Found</h1>
          <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-2)', fontSize: 14, marginBottom: 24 }}>
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn-primary">Go to Home</Link>
            <Link to="/chat-directory" className="btn-secondary">Browse Chatrooms</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
