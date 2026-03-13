import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout.jsx'

const FEATURES = [
  { icon: 'fi fi-sr-comment-alt', color: '#1a73e8', title: 'Public Chat Rooms',    desc: 'Join hundreds of live public chat rooms by language, interest, region or topic. New rooms being added every week.' },
  { icon: 'fi fi-sr-video-camera',color: '#ea4335', title: 'Video and Audio Calls', desc: 'Crystal-clear WebRTC-powered video calls and audio calls. Start a call with any user directly from their profile.' },
  { icon: 'fi fi-sr-webcam',      color: '#34a853', title: 'Public Cam Chat',       desc: 'Broadcast your webcam to any chat room or watch other users on cam. Full cam controls for moderators.' },
  { icon: 'fi fi-sr-trophy',      color: '#fbbc04', title: 'Ranks and XP System',   desc: 'Earn XP points every time you chat, send gifts, or win games. Level up from Guest all the way to Legend.' },
  { icon: 'fi fi-sr-gift',        color: '#aa44ff', title: 'Virtual Gifts',          desc: 'Send beautiful virtual gifts to other users. Gifts earn the recipient gold coins and show up on their profile.' },
  { icon: 'fi fi-sr-game',        color: '#00aaff', title: 'Games and Quiz Rooms',   desc: 'Win gold coins in Quiz Rooms, roll the dice, or spin the wheel. Compete with other users on the leaderboard.' },
  { icon: 'fi fi-sr-shield',      color: '#ff6b35', title: 'Active Moderation',      desc: 'Our dedicated moderation team keeps every room safe and respectful around the clock, every day of the year.' },
  { icon: 'fi fi-sr-lock',        color: '#0f9d58', title: 'Private Messaging',      desc: 'Send private encrypted messages to any registered user. Stay connected even outside the chat rooms.' },
]

const STATS = [
  { value: '100K+', label: 'Active Users' },
  { value: '500+',  label: 'Chat Rooms' },
  { value: '50+',   label: 'Countries' },
  { value: '24/7',  label: 'Moderation' },
]

export default function Home() {
  return (
    <PageLayout seo={{
      title: 'ChatsGenZ — Free Live Chat Rooms | Talk to Strangers Online',
      description: 'ChatsGenZ is a free live chat platform for everyone worldwide. Join public chat rooms, talk to strangers, video chat, earn ranks, send gifts and play games on ChatsGenZ. No registration required.',
      keywords: 'ChatsGenZ, free chat rooms, talk to strangers, live chat, video chat worldwide, no registration chat, free chatting site, online chat rooms',
      canonical: '/',
    }}>
      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #0f1923 0%, #1a2535 60%, #0f1923 100%)', padding: '80px 20px 90px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(26,115,232,.12) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(170,68,255,.08) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(26,115,232,.15)', border: '1px solid rgba(26,115,232,.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 24 }}>
            <span style={{ width: 7, height: 7, background: '#34a853', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,.85)' }}>Thousands of people chatting right now</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: '#fff', lineHeight: 1.18, marginBottom: 20, letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif' }}>
            Free Live Chat Rooms<br />
            <span style={{ background: 'linear-gradient(135deg,#1a73e8,#aa44ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>for Everyone Worldwide</span>
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.15rem)', color: 'rgba(255,255,255,.65)', lineHeight: 1.75, marginBottom: 36, maxWidth: 580, margin: '0 auto 36px' }}>
            Join <strong style={{ color: '#fff' }}>ChatsGenZ</strong> — the free chat platform where you can talk to strangers, make friends, video chat, earn ranks and play games. No registration required to start.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '14px 30px', borderRadius: 10, background: 'linear-gradient(135deg,#1a73e8,#1557b0)', color: '#fff', fontWeight: 800, fontSize: '1rem', boxShadow: '0 4px 20px rgba(26,115,232,.4)', textDecoration: 'none' }}>
              <i className="fi fi-sr-comment-alt" /> Start Chatting Free
            </Link>
            <Link to="/chat-directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '14px 28px', borderRadius: 10, background: 'rgba(255,255,255,.08)', color: '#fff', fontWeight: 700, fontSize: '1rem', border: '1.5px solid rgba(255,255,255,.15)', textDecoration: 'none' }}>
              <i className="fi fi-sr-search" /> Browse Rooms
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 0, justifyContent: 'center', flexWrap: 'wrap' }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ padding: '0 28px', borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,.12)' : 'none', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.5)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '72px 20px', background: '#f8f9fa' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900, color: '#202124', marginBottom: 12, fontFamily: 'Outfit, sans-serif' }}>Everything You Need in One Free Platform</h2>
            <p style={{ color: '#5f6368', fontSize: '0.975rem', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>ChatsGenZ gives you all the tools to connect, have fun, and build relationships — completely free, forever.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 18 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 14, padding: '24px 20px', boxShadow: '0 1px 4px rgba(60,64,67,.06)', transition: 'box-shadow .2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(60,64,67,.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(60,64,67,.06)'}
              >
                <div style={{ width: 46, height: 46, background: f.color + '15', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, fontSize: 22, marginBottom: 16 }}>
                  <i className={f.icon} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#202124', marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>{f.title}</h3>
                <p style={{ fontSize: '0.845rem', color: '#5f6368', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BOTTOM */}
      <section style={{ padding: '72px 20px', background: 'linear-gradient(135deg,#0f1923,#1a2535)', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900, color: '#fff', marginBottom: 14, fontFamily: 'Outfit, sans-serif' }}>Ready to Start Chatting?</h2>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.975rem', lineHeight: 1.7, marginBottom: 32 }}>Join ChatsGenZ for free today. No email, no credit card, no registration needed to get started.</p>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '14px 32px', borderRadius: 10, background: 'linear-gradient(135deg,#1a73e8,#1557b0)', color: '#fff', fontWeight: 800, fontSize: '1rem', boxShadow: '0 4px 20px rgba(26,115,232,.4)', textDecoration: 'none' }}>
            <i className="fi fi-sr-comment-alt" /> Join ChatsGenZ Free
          </Link>
        </div>
      </section>
    </PageLayout>
  )
}
