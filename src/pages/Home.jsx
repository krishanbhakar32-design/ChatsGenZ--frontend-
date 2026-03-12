import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'

const FEATURES = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: 'Guest Chat — No Registration',
    desc: 'Join instantly without email or phone. 100% anonymous guest chatroom access. No signup needed, just pick a name and start chatting!',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    title: 'HD Video & Audio Calls',
    desc: 'Crystal clear free video calls and audio calls powered by WebRTC technology. Free public cam chat with no downloads required.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
    title: 'Live Chatrooms 24/7',
    desc: 'Active free chatrooms running around the clock. Always someone online — day, night, weekends. Never a quiet room on ChatsGenZ.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    title: 'VIP & Premium Chatrooms',
    desc: 'Unlock exclusive VIP chat rooms and premium chatroom access with special rank privileges as you level up your profile.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: 'Safe & Secured Chat',
    desc: '24/7 moderation, spam filters, block and report features. Our secured chat environment keeps every user safe and respected.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    title: 'Quiz Rooms & Games',
    desc: 'Play live quiz games, win gold coins, roll dice, spin the wheel, and compete with other chatters in real-time quiz room challenges.',
  },
]

const STATS = [
  { num: '100%', label: 'Free Forever' },
  { num: 'No Reg',  label: 'Guest Login' },
  { num: 'HD',   label: 'Video Calls' },
  { num: '24/7', label: 'Live Rooms' },
]

export default function Home() {
  return (
    <>
      <SEO
        title="Free Live Chat Rooms | Talk to Strangers Online | No Registration"
        description="ChatsGenZ — India's fastest growing free live chat site. Join free chatrooms, talk to strangers, make friends, video call, audio call without registration. Best free chatting site in India 2024."
        keywords="live chatting site, free chat, stranger chat, no registration chat, indian chatroom, hindi chat, desi chat, free video call, guest chat"
        canonical="/"
      />
      <Header />

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 20px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}
               className="hero-section">
        {/* LEFT — Image */}
        <div className="hero-img-wrap">
          {/* When couple photo is ready, replace this div with:
              <img src="/images/hero-couple.jpg" alt="Chat and make friends on ChatsGenZ" style={...} /> */}
          <div style={{
            width: '100%', height: 420, borderRadius: 20,
            background: 'linear-gradient(135deg, #e8f0fe 0%, #fce4ec 50%, #e8f5e9 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, border: '2px dashed var(--border)', position: 'relative', overflow: 'hidden',
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="1" opacity=".3">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '0 20px' }}>
              Add your couple photo here<br />
              <small>→ Place in <code>public/images/hero-couple.jpg</code></small>
            </p>
          </div>
        </div>

        {/* RIGHT — Text */}
        <div className="hero-text" style={{ animationDelay: '0.1s' }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.2, color: 'var(--text)', marginBottom: 16, letterSpacing: -1 }}>
            India's Best <span style={{ color: 'var(--primary)' }}>Free Chat Rooms</span> — No Registration Needed
          </h1>
          <p style={{ fontFamily: 'var(--font-2)', fontSize: 15, lineHeight: 1.85, color: 'var(--text-2)', marginBottom: 28 }}>
            Welcome to <strong>ChatsGenZ</strong> — the next generation of free online chatting.
            Whether you're looking for a friendly conversation, want to meet strangers from India and worldwide,
            or simply enjoy our <strong>free chatrooms</strong>, we have it all. Enjoy <strong>live chatting</strong>,
            <strong> public cam chat</strong>, <strong>video calls</strong>, <strong>audio calls</strong>, and
            exciting <strong>quiz rooms</strong> — completely free. No registration — just enter as a
            <strong> guest</strong> and start instantly. India's <strong>fastest growing chat site</strong>
            built for the new generation!
          </p>

          <Link to="/login" className="btn-primary" style={{ marginBottom: 32, display: 'inline-flex', fontSize: 16 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Start Chatting Free
          </Link>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {STATS.map(s => (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{s.num}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AD BOX 1 ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto 8px', padding: '0 20px' }}>
        <div className="ad-placeholder" style={{ height: 90 }}>Advertisement</div>
      </div>

      {/* ── WHY CHATSGENZ ── */}
      <section style={{ maxWidth: 1200, margin: '24px auto', padding: '0 20px' }}>
        <h2 className="section-heading">Why You Should Choose ChatsGenZ?</h2>
        <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '28px 32px' }} className="prose">
          <p>In a world full of social media platforms and messaging services, finding a truly <strong>free chatting site</strong> that respects your privacy, offers genuine connections, and delivers real fun is surprisingly difficult. Most platforms require lengthy registrations, charge for features that should be free, or bombard you with intrusive ads. <strong>ChatsGenZ</strong> was built to solve all these problems — offering a complete, feature-rich chat experience at absolutely zero cost.</p>
          <p>At ChatsGenZ, we are proud to be one of the very few <strong>new chatting sites</strong> that combines traditional chatroom culture with modern technology. Our platform supports <strong>live chatting</strong> in real time, meaning every message is delivered instantly. Whether you want a one-on-one <strong>private chat</strong>, a public room discussion, or a lively group conversation with strangers, we have the infrastructure to support it all.</p>
          <p>One of our most loved features is the ability to join as a <strong>guest chatroom</strong> user — no email, no phone number, no personal information required. This makes ChatsGenZ the safest and most accessible <strong>stranger chatting site</strong> available today. You can protect your identity, stay anonymous, and still enjoy full chatting features. For those who prefer a personalised experience, registering unlocks <strong>VIP chat</strong>, <strong>premium chatroom</strong> access, friend lists, gold coins, and exclusive ranks.</p>
          <p>ChatsGenZ takes safety seriously. Our platform features trained moderators available around the clock. Our <strong>secured chat</strong> environment uses advanced filtering to prevent spam and harassment. Every user can report, block, or mute others, giving complete control over your experience. We maintain strict <strong>chat rules</strong> and a zero-tolerance policy for abuse, ensuring both <strong>adult chat</strong> spaces and general rooms remain comfortable for their audiences.</p>
          <p>Beyond text messaging, ChatsGenZ offers <strong>public cam chat</strong>, <strong>video call</strong>, and <strong>audio call</strong> features powered by WebRTC technology for crystal-clear HD communication. Our rooms include special spaces for <strong>quiz room</strong> games, music, Bollywood, sports, and regional communities covering <strong>Hindi chat</strong>, Tamil chat, Telugu chat, Punjabi chat, and many more. Whether you are in India, the USA, UK, or anywhere in the world, there is always a room for you.</p>
          <p>Our unique rank and rewards system sets ChatsGenZ apart from every other <strong>free chat</strong> platform. Users earn XP points, level up, collect gold coins, send and receive virtual gifts, and unlock special ranks including Legend, Fairy, Ninja, Butterfly, and VIP. These features create a gamified social experience that keeps the community active and engaged — making ChatsGenZ one of the most rewarding <strong>friendly chatroom</strong> experiences available anywhere online.</p>
          <p>ChatsGenZ is the <strong>fastest growing chat</strong> platform in India right now, with a rapidly expanding community of genuine users. We continuously add new features, rooms, and events based on user feedback. If you are tired of boring, outdated chat platforms and want something fresh, exciting, and truly free — <strong>ChatsGenZ is your answer</strong>. Join thousands of users who have already made it their favourite place to <strong>make friends</strong>, connect, and enjoy real conversations every single day.</p>
        </div>

        {/* Features Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }} className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="card">
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--primary-l)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12, color: 'var(--primary)',
              }}>
                <svg style={{ width: 22, height: 22 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {f.icon.props.children}
                </svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5, fontFamily: 'var(--font-2)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AD BANNER 2 ── */}
      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 20px' }}>
        <div className="ad-placeholder" style={{ height: 120 }}>Advertisement Banner</div>
      </div>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .hero-section { grid-template-columns: 1fr !important; padding: 24px 16px 20px !important; gap: 24px !important; }
          .hero-img-wrap div { height: 260px !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .hero-section h1 { font-size: 24px !important; }
        }
      `}</style>
    </>
  )
}
