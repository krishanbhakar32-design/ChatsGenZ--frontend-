import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'

const FEATURES = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: "Guest Chat — No Registration",
    desc: "Join instantly without email or phone. 100% anonymous guest chatroom access. No signup needed, just pick a name and start chatting.",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    title: "HD Video and Audio Calls",
    desc: "Crystal clear free video calls and audio calls powered by WebRTC technology. Free public cam chat with no downloads required.",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
    title: "Live Chatrooms 24/7",
    desc: "Active free chatrooms running around the clock. Always someone online day, night, weekends. Never a quiet room on ChatsGenZ.",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    title: "VIP and Premium Chatrooms",
    desc: "Unlock exclusive VIP chat rooms and premium chatroom access with special rank privileges as you level up your profile.",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: "Safe and Secured Chat",
    desc: "24/7 moderation, spam filters, block and report features. Our secured chat environment keeps every user safe and respected.",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    title: "Quiz Rooms and Games",
    desc: "Play live quiz games, win gold coins, roll dice, spin the wheel, and compete with other chatters in real-time quiz room challenges.",
  },
]

const STATS = [
  { num: '100%', label: 'Free Forever' },
  { num: 'No Reg', label: 'Guest Login' },
  { num: 'HD', label: 'Video Calls' },
  { num: '24/7', label: 'Live Rooms' },
]

export default function Home() {
  return (
    <>
      <SEO
        title="Free Live Chat Rooms | Talk to Strangers Online | No Registration"
        description="ChatsGenZ is a 100% free live chat platform. Join public chat rooms, talk to strangers worldwide, video chat, earn ranks and play games. No registration required."
        keywords="free chat rooms, talk to strangers, live chat, video chat, online chat, no registration chat, free chatting, chat with strangers worldwide"
        canonical="/"
      />
      <Header />

      <main>
        {/* HERO */}
        <section style={{
          background: 'linear-gradient(135deg, #0a1420 0%, #0f2744 50%, #0a1420 100%)',
          padding: '80px 20px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(26,115,232,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(77,163,255,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 780, margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'inline-block', background: 'rgba(26,115,232,0.15)', border: '1px solid rgba(26,115,232,0.3)', borderRadius: 20, padding: '5px 16px', fontSize: '0.8rem', color: '#4da3ff', fontWeight: 600, marginBottom: 24, letterSpacing: '0.04em' }}>
              FREE WORLDWIDE CHAT PLATFORM
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 20, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.5px' }}>
              Chat With Anyone,<br />
              <span style={{ background: 'linear-gradient(90deg, #4da3ff, #1a73e8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Anywhere in the World
              </span>
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.65)', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
              Join free public chat rooms, meet new people worldwide, video chat, earn ranks, send gifts and play games. No registration needed to start.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" style={{
                padding: '14px 32px', borderRadius: 10,
                background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
                color: '#fff', fontWeight: 700, fontSize: '1rem',
                textDecoration: 'none', boxShadow: '0 4px 20px rgba(26,115,232,0.5)',
              }}>
                Start Chatting Free
              </Link>
              <Link to="/chat-directory" style={{
                padding: '14px 32px', borderRadius: 10,
                border: '1.5px solid rgba(255,255,255,0.2)',
                color: '#fff', fontWeight: 600, fontSize: '1rem',
                textDecoration: 'none', background: 'rgba(255,255,255,0.06)',
              }}>
                Browse Chat Rooms
              </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', marginTop: 52, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {STATS.map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4da3ff', fontFamily: "'Outfit', sans-serif" }}>{s.num}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ padding: '72px 20px', background: '#fff' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 800, color: '#202124', fontFamily: "'Outfit', sans-serif", marginBottom: 12 }}>
                Everything You Need to Chat
              </h2>
              <p style={{ color: '#5f6368', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
                Completely free features available to every user — no hidden costs, no subscriptions.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{
                  padding: '28px 24px', borderRadius: 14,
                  border: '1px solid #e8eaed', background: '#fff',
                  boxShadow: '0 1px 6px rgba(60,64,67,0.08)',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,115,232,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(60,64,67,0.08)'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ width: 46, height: 46, background: '#e8f0fe', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: '#1a73e8' }}>
                    <div style={{ width: 22, height: 22 }}>{f.icon}</div>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#202124', marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>{f.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#5f6368', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO TEXT SECTION */}
        <section style={{ padding: '64px 20px', background: '#f8f9fa' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#202124', fontFamily: "'Outfit', sans-serif", marginBottom: 20 }}>
              The World is Waiting — Start a Free Chat Now
            </h2>
            <div style={{ color: '#3c4043', lineHeight: 1.8, fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p>ChatsGenZ is a completely free live chat platform where you can talk to strangers from any country in the world. Whether you want to make new friends, practice a language, find people with similar interests, or simply have a fun conversation, ChatsGenZ has a chat room for you. Our platform is built for everyone — no registration required to get started.</p>
              <p>Our public chat rooms are organized by topics, languages, regions, and interests, making it easy to find conversations you genuinely enjoy. From general chat rooms and language-specific rooms to interest-based communities and regional groups, every user can find their space. You can also join adult chat rooms once age verification is complete.</p>
              <p>ChatsGenZ offers HD video calls, audio calls, public cam chat, a rich gifting system, an XP and rank progression system, quiz room games, dice and spin games, and much more. As you chat, you earn experience points and climb through ranks — from Guest all the way up to Legend, Fairy, Ninja, Butterfly, and beyond. Premium rank users enjoy exclusive privileges and VIP room access.</p>
              <p>Our platform is hosted on high-performance infrastructure and deployed across global regions to ensure fast, stable connections for users in Asia, Europe, the Americas, the Middle East, and beyond. Your safety is our priority — all rooms are actively moderated by our dedicated team, and every user has access to block, report, and privacy controls.</p>
              <p>Join thousands of chatters online right now. It is 100% free, works on any device, and takes less than 10 seconds to start. No email, no phone number, no credit card — just pick a username and dive in.</p>
            </div>
            <div style={{ marginTop: 32 }}>
              <Link to="/login" style={{
                display: 'inline-block', padding: '13px 28px', borderRadius: 9,
                background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                textDecoration: 'none', boxShadow: '0 2px 12px rgba(26,115,232,0.35)',
              }}>
                Join Free Chat Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
