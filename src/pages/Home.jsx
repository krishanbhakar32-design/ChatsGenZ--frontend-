import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout.jsx'

export default function Home() {
  return (
    <PageLayout seo={{
      title: 'ChatsGenZ — Free Live Chat Rooms | Talk to Strangers Online',
      description: 'ChatsGenZ is a free live chatting site and stranger chatting site with no registration required. Join free public chat rooms, vip chat, premium chatroom, public cam chat, video call, audio call — make friends, adult chat, secured chat. Next generation chatrooms.',
      keywords: 'ChatsGenZ, live chatting site, stranger chatting site, no registration, vip chat, premium chatroom, free chatting site, public cam chat, video call chat, audio call chat, quiz room, guest chatroom, friendly chatroom, make friends, date, adult chat, secured chat, next generation chatrooms, fastest growing chat, new chatting site',
      canonical: '/',
    }}>
      {/* ── HERO ── */}
      <section style={{ background: '#fff' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '28px 18px 0',
          display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap',
        }}>
          {/* Couple photo */}
          <div className="hero-img-wrap" style={{ width: '100%' }}>
            <img
              src="/images/hero-couple.jpg"
              alt="People chatting on ChatsGenZ free live chat"
              style={{ width: '100%', borderRadius: 12, display: 'block', objectFit: 'cover', maxHeight: 320 }}
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>

          {/* Description */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)', color: '#3c4043', lineHeight: 1.9, margin: 0 }}>
              Welcome to <strong>ChatsGenZ</strong> — the fastest growing <strong>free live chatting site</strong> and <strong>stranger chatting site</strong> where you can connect with people from all around the world without any registration. Whether you're looking for a <strong>friendly chatroom</strong>, a <strong>guest chatroom</strong>, or a <strong>premium chatroom</strong> with <strong>VIP chat</strong> features, ChatsGenZ has it all completely free. Enjoy <strong>public cam chat</strong>, <strong>video call chat</strong>, and <strong>audio call chat</strong> with real people in real time. Our platform offers <strong>quiz rooms</strong>, virtual gifts, and an XP rank system so you can level up as you chat. This is a <strong>secured chat</strong> environment monitored 24/7 by our moderation team. Whether you want to <strong>make friends</strong>, find someone to <strong>date</strong>, or explore our <strong>adult chat</strong> rooms — ChatsGenZ is your home. Join hundreds of <strong>free chat rooms</strong> organised by language, country, interest, and more. No email. No credit card. No registration needed. This is the <strong>next generation chatroom</strong> experience — built for everyone, free forever.
            </p>

            <div style={{ marginTop: 22 }}>
              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 26px', borderRadius: 9,
                background: 'linear-gradient(135deg,#1a73e8,#1557b0)',
                color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                textDecoration: 'none', boxShadow: '0 4px 16px rgba(26,115,232,.35)',
                fontFamily: 'Outfit,sans-serif',
              }}>
                <i className="fi fi-sr-comment-alt" /> Start Chatting Free
              </Link>
            </div>
          </div>
        </div>

        {/* AD BOX 1 */}
        <div style={{ maxWidth: 1100, margin: '24px auto 0', padding: '0 18px' }}>
          <div style={{
            width: '100%', minHeight: 90, background: '#f8f9fa',
            border: '2px dashed #dadce0', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9aa0a6', fontSize: '0.78rem', fontWeight: 500, letterSpacing: 1,
          }}>ADVERTISEMENT</div>
        </div>

        {/* WHY SECTION */}
        <div style={{ maxWidth: 1100, margin: '32px auto 0', padding: '0 18px 36px' }}>
          <h2 style={{
            fontFamily: 'Outfit,sans-serif', fontWeight: 900,
            fontSize: 'clamp(1.1rem, 3vw, 1.45rem)', color: '#202124', marginBottom: 16,
          }}>Why Should You Choose ChatsGenZ?</h2>
          <div style={{ fontSize: 'clamp(0.875rem, 2vw, 0.95rem)', color: '#3c4043', lineHeight: 1.9 }}>
            <p style={{ marginBottom: 14 }}>
              ChatsGenZ is not just another <strong>free chatting site</strong> — it is a fully-featured, <strong>next generation chatroom</strong> platform designed to give you the best online social experience possible. In a world flooded with boring and outdated chat platforms, ChatsGenZ stands out as the <strong>fastest growing new chatting site</strong> trusted by users from over 50 countries worldwide. Whether you are a teenager looking for a <strong>friendly chatroom</strong>, an adult searching for <strong>adult chat</strong> spaces, or simply someone who wants to <strong>make friends</strong> online without spending a single rupee — ChatsGenZ is built exactly for you.
            </p>
            <p style={{ marginBottom: 14 }}>
              One of the biggest reasons people choose ChatsGenZ over other <strong>stranger chatting sites</strong> is that we require <strong>no registration</strong> to get started. You can walk in as a guest, join any public room, and start chatting within seconds. No email verification. No phone number. No credit card. Just click and chat. At the same time, if you do register for a free account, you unlock powerful features like a friends list, private messaging, a personal profile, and our full XP and rank system — where you level up from Guest all the way to Legend just by being active on the platform.
            </p>
            <p style={{ marginBottom: 14 }}>
              ChatsGenZ is home to hundreds of <strong>free chat rooms</strong> organised by language, country, interest, and topic. From Hindi chat to USA chat, from music lovers to sports fans — there is a room for everyone. Our platform also features real-time <strong>public cam chat</strong>, <strong>video call chat</strong>, and <strong>audio call chat</strong> powered by modern WebRTC technology, giving you crystal-clear connections with people around the world. You can also enjoy interactive <strong>quiz rooms</strong>, dice games, and spin-the-wheel rooms where you win gold coins and compete on leaderboards.
            </p>
            <p style={{ marginBottom: 0 }}>
              For those looking for premium experiences, ChatsGenZ offers a <strong>VIP chat</strong> and <strong>premium chatroom</strong> system. VIP members enjoy priority cam slots, extended messaging, special name colours, and exclusive rooms. Our platform is completely <strong>secured chat</strong> — every room is monitored 24/7 by a trained moderation team, and all private messages are encrypted. Whether you want to <strong>date</strong>, <strong>make friends</strong>, or simply pass time in a fun and safe environment, ChatsGenZ is the right place. Join us today — free forever, for everyone.
            </p>
          </div>
        </div>

        {/* AD BOX 2 */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 18px 40px' }}>
          <div style={{
            width: '100%', minHeight: 90, background: '#f8f9fa',
            border: '2px dashed #dadce0', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9aa0a6', fontSize: '0.78rem', fontWeight: 500, letterSpacing: 1,
          }}>ADVERTISEMENT</div>
        </div>
      </section>

      <style>{`
        @media (min-width: 700px) {
          .hero-img-wrap { flex: 0 0 400px !important; width: 400px !important; }
        }
      `}</style>
    </PageLayout>
  )
}
