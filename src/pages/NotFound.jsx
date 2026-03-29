import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
export default function NotFound() {
  return (
    <>
      <SEO title="Page Not Found" description="The page you are looking for does not exist on ChatsGenZ. Return to our free live chat rooms." canonical="/404" />
      <Header />
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#f8f9fa' }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: '5rem', fontWeight: 900, color: '#1a73e8', lineHeight: 1, fontFamily: 'Outfit, sans-serif' }}>404</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#202124', margin: '16px 0 10px' }}>Page Not Found</h1>
          <p style={{ color: '#5f6368', fontSize: '0.925rem', lineHeight: 1.7, marginBottom: 28 }}>The page you are looking for does not exist or has been moved. Go back to ChatsGenZ and find your room.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn-primary"><i className="fi fi-sr-home" /> Go Home</Link>
            <Link to="/chat-directory" className="btn-outline">Browse Chat Rooms</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
