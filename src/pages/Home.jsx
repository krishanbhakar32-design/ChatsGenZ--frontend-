import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function Home() {
  return (
    <>
      <Helmet>
        <title>ChatsGenZ — Free Live Chat Rooms | Talk to Strangers Online</title>
        <meta name="description" content="ChatsGenZ is a free live chatting site and stranger chatting site with no registration required. Join free public chat rooms, vip chat, premium chatroom, public cam chat, video call, audio call chat, quiz room, guest chatroom, friendly chatroom — make friends, date, adult chat, secured chat. Next generation chatrooms. Fastest growing new chatting site." />
        <meta name="keywords" content="ChatsGenZ, live chatting site, stranger chatting site, no registration, vip chat, premium chatroom, free chatting site, public cam chat, video call chat, audio call chat, quiz room, guest chatroom, friendly chatroom, make friends, date, adult chat, secured chat, next generation chatrooms, fastest growing chat, new chatting site" />
      </Helmet>

      {/* ── HERO: photo left, description right (mobile: stacked) ── */}
      <section style={{ background: '#fff' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '32px 20px 0',
          display: 'flex', gap: 36, alignItems: 'flex-start', flexWrap: 'wrap',
        }}>
          {/* Couple photo */}
          <div style={{ flex: '0 0 auto', width: '100%', maxWidth: 420 }} className="hero-img-wrap">
            <img
              src="/images/hero-couple.jpg"
              alt="People chatting on ChatsGenZ"
              style={{ width: '100%', borderRadius: 14, display: 'block', objectFit: 'cover', maxHeight: 340 }}
              onError={e => {
                e.target.style.background = 'linear-gradient(135deg,#e8f0fe,#f3e8ff)'
                e.target.style.minHeight = '200px'
                e.target.alt = ''
              }}
            />
          </div>

          {/* Description - no heading, just paragraph with keywords */}
          <div style={{ flex: 1, minWidth: 260, paddingTop: 8 }}>
            <p style={{
              fontSize: 'clamp(0.95rem, 2.2vw, 1.05rem)',
              color: '#3c4043', lineHeight: 1.85,
              margin: 0,
            }}>
              Welcome to <strong>ChatsGenZ</strong> — the fastest growing <strong>free live chatting site</strong> and <strong>stranger chatting site</strong> where you can connect with people from all around the world without any registration. Whether you're looking for a <strong>friendly chatroom</strong>, a <strong>guest chatroom</strong>, or a <strong>premium chatroom</strong> with <strong>VIP chat</strong> features, ChatsGenZ has it all completely free. Enjoy <strong>public cam chat</strong>, <strong>video call chat</strong>, and <strong>audio call chat</strong> with real people in real time. Our platform offers <strong>quiz rooms</strong>, virtual gifts, and an XP rank system so you can level up as you chat. This is a <strong>secured chat</strong> environment monitored 24/7 by our moderation team. Whether you want to <strong>make friends</strong>, find someone to <strong>date</strong>, or explore our <strong>adult chat</strong> rooms — ChatsGenZ is your home. Join hundreds of <strong>free chat rooms</strong> organised by language, country, interest, and more. No email. No credit card. No registration needed. This is the <strong>next generation chatroom</strong> experience — built for everyone, free forever.
            </p>

            {/* Start Chat Button */}
            <div style={{ marginTop: 24 }}>
              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                padding: '13px 30px', borderRadius: 10,
                background: 'linear-gradient(135deg,#1a73e8,#1557b0)',
                color: '#fff', fontWeight: 800, fontSize: '1rem',
                textDecoration: 'none', boxShadow: '0 4px 18px rgba(26,115,232,.38)',
                fontFamily: 'Outfit, sans-serif',
              }}>
                <i className="fi fi-sr-comment-alt" /> Start Chatting Free
              </Link>
            </div>
          </div>
        </div>

        {/* AD PLACEHOLDER 1 */}
        <div style={{ maxWidth: 1100, margin: '28px auto 0', padding: '0 20px' }}>
          <div style={{
            width: '100%', minHeight: 90, background: '#f1f3f4',
            border: '2px dashed #dadce0', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9aa0a6', fontSize: '0.8rem', fontWeight: 500,
          }}>Advertisement</div>
        </div>

        {/* WHY SECTION */}
        <div style={{ maxWidth: 1100, margin: '36px auto 0', padding: '0 20px 40px' }}>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 900,
            fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', color: '#202124',
            marginBottom: 18,
          }}>Why Should You Choose ChatsGenZ?</h2>

          <div style={{ fontSize: 'clamp(0.9rem, 2vw, 0.975rem)', color: '#3c4043', lineHeight: 1.9 }}>
            <p>
              ChatsGenZ is not just another <strong>free chatting site</strong> — it is a fully-featured, <strong>next generation chatroom</strong> platform designed to give you the best online social experience possible. In a world flooded with boring and outdated chat platforms, ChatsGenZ stands out as the <strong>fastest growing new chatting site</strong> trusted by users from over 50 countries worldwide. Whether you are a teenager looking for a <strong>friendly chatroom</strong>, an adult searching for <strong>adult chat</strong> spaces, or simply someone who wants to <strong>make friends</strong> online without spending a single rupee — ChatsGenZ is built exactly for you.
            </p>
            <p>
              One of the biggest reasons people choose ChatsGenZ over other <strong>stranger chatting sites</strong> is that we require <strong>no registration</strong> to get started. You can walk in as a guest, join any public room, and start chatting within seconds. No email verification. No phone number. No credit card. Just click and chat. At the same time, if you do register for a free account, you unlock powerful features like a friends list, private messaging, a personal profile, and our full <strong>XP and rank system</strong> — where you level up from Guest all the way to Legend just by being active on the platform.
            </p>
            <p>
              ChatsGenZ is home to hundreds of <strong>free chat rooms</strong> organised by language, country, interest, and topic. From Hindi chat to USA chat, from music lovers to sports fans — there is a room for everyone. Our platform also features real-time <strong>public cam chat</strong>, <strong>video call chat</strong>, and <strong>audio call chat</strong> powered by modern WebRTC technology, giving you crystal-clear connections with people around the world. You can also enjoy interactive <strong>quiz rooms</strong>, dice games, and spin-the-wheel rooms where you win gold coins and compete on leaderboards.
            </p>
            <p>
              For those looking for premium experiences, ChatsGenZ offers a <strong>VIP chat</strong> and <strong>premium chatroom</strong> system. VIP members enjoy priority cam slots, extended messaging, special name colours, and exclusive rooms. Our platform is completely <strong>secured chat</strong> — every room is monitored 24/7 by a trained moderation team, and all private messages are encrypted. Whether you want to <strong>date</strong>, <strong>make friends</strong>, or simply pass time in a fun and safe environment, ChatsGenZ is the right place. Join us today — free forever, for everyone.
            </p>
          </div>
        </div>

        {/* AD PLACEHOLDER 2 */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 40px' }}>
          <div style={{
            width: '100%', minHeight: 90, background: '#f1f3f4',
            border: '2px dashed #dadce0', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9aa0a6', fontSize: '0.8rem', fontWeight: 500,
          }}>Advertisement</div>
        </div>
      </section>

      <style>{`
        @media (min-width: 700px) {
          .hero-img-wrap { max-width: 420px !important; width: auto !important; flex: 0 0 420px !important; }
        }
        @media (max-width: 699px) {
          .hero-img-wrap { max-width: 100% !important; }
        }
      `}</style>
    </>
  )
}
