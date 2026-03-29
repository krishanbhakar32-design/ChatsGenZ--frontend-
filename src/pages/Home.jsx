import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import PageLayout from '../components/PageLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Home() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate('/chat', { replace: true })
  }, [user, loading, navigate])

  return (
    <PageLayout seo={{
      title: 'ChatsGenZ — Free Live Chat Rooms | Talk to Strangers Online',
      description: 'ChatsGenZ is a free live chatting site with no registration required. Join free public chat rooms, VIP chat, video call, audio call.',
      keywords: 'ChatsGenZ, live chatting site, stranger chatting site, no registration, vip chat, premium chatroom, free chatting site',
      canonical: '/',
    }}>
      <section style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 18px 0', display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="hero-img-wrap" style={{ width: '100%' }}>
            <img src="/images/hero-couple.jpg" alt="People chatting on ChatsGenZ"
              style={{ width: '100%', borderRadius: 12, display: 'block', objectFit: 'cover', maxHeight: 320 }}
              onError={e => { e.target.style.display = 'none' }} />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <p style={{ fontSize: 'clamp(0.9rem,2vw,1rem)', color: '#3c4043', lineHeight: 1.9, margin: 0 }}>
              Welcome to <strong>ChatsGenZ</strong> — the fastest growing <strong>free live chatting site</strong> where you can connect with people from all over the world without registration. Join <strong>free chat rooms</strong>, enjoy <strong>video call chat</strong> and <strong>audio call chat</strong>, send virtual gifts, and level up with our XP rank system. This is a <strong>secured chat</strong> environment monitored 24/7.
            </p>
            <div style={{ marginTop: 22 }}>
              <Link to={user ? '/chat' : '/login'} style={{
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

            {/* Ad 2 - Below Start Chatting button */}
            <div style={{ marginTop: 24 }}>
              <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"></script>
              <ins className="eas6a97888e17" data-zoneid="5884718" data-keywords="keywords" data-sub="123450000" data-block-ad-types="0" data-ex_av="name"></ins>
              <script dangerouslySetInnerHTML={{ __html: `(AdProvider = window.AdProvider || []).push({"serve": {}});` }} />
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '32px auto 0', padding: '0 18px 36px' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: 'clamp(1.1rem,3vw,1.45rem)', color: '#202124', marginBottom: 16 }}>
            Why Choose ChatsGenZ?
          </h2>
          <div style={{ fontSize: 'clamp(0.875rem,2vw,0.95rem)', color: '#3c4043', lineHeight: 1.9 }}>
            <p style={{ marginBottom: 14 }}>
              ChatsGenZ is not just another <strong>chat site</strong> — it is a fully-featured <strong>next generation chatroom platform</strong> trusted by users from <strong>50+ countries worldwide</strong>. Unlike traditional chat platforms, ChatsGenZ offers <strong>instant access with no registration required</strong>. You can join as a <strong>guest user immediately</strong>, or register for free to unlock advanced features including <strong>friend lists</strong>, <strong>personalized profiles</strong>, and our comprehensive <strong>XP rank system</strong>.
            </p>
            <p style={{ marginBottom: 14 }}>
              Our platform features <strong>hundreds of chat rooms</strong> organized by <strong>language</strong>, <strong>country</strong>, and <strong>special interests</strong>, ensuring you find the perfect community for meaningful conversations. Whether you're looking for casual chat, <strong>language practice</strong>, or making new international friends, ChatsGenZ has a room for you. Experience <strong>real-time webcam chat</strong>, <strong>high-quality video calls</strong>, and <strong>crystal-clear audio calls</strong> powered by advanced <strong>WebRTC technology</strong>.
            </p>
            <p style={{ marginBottom: 14 }}>
              Make your conversations more engaging with our <strong>interactive features</strong>: play <strong>quiz games</strong>, roll <strong>dice</strong>, spin the <strong>wheel of fortune</strong>, and send <strong>virtual gifts</strong> to express yourself. Our <strong>gold coin economy</strong> and <strong>XP progression system</strong> reward active participation, allowing you to <strong>level up your rank</strong>, unlock <strong>VIP features</strong>, and earn <strong>exclusive badges</strong>.
            </p>
            <p style={{ marginBottom: 0 }}>
              Safety is our top priority. Every chat room is <strong>monitored 24/7</strong> by our <strong>trained moderation team</strong>, ensuring a <strong>family-friendly</strong> and <strong>harassment-free environment</strong>. Our advanced <strong>security systems</strong> protect your privacy, while <strong>automated filters</strong> block inappropriate content before it reaches your screen. Join thousands of users who trust ChatsGenZ as their go-to platform for <strong>safe</strong>, <strong>fun</strong>, and <strong>meaningful online connections</strong>.
            </p>
          </div>

          {/* Ad 1 - Footer */}
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"></script>
            <ins className="eas6a97888e17" data-zoneid="5884718" data-keywords="keywords" data-sub="123450000" data-block-ad-types="0" data-ex_av="name"></ins>
            <script dangerouslySetInnerHTML={{ __html: `(AdProvider = window.AdProvider || []).push({"serve": {}});` }} />
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 18px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            {[
              { icon: 'fi-sr-comment-alt', title: 'Live Chat Rooms', desc: 'Hundreds of rooms by language, country & interest' },
              { icon: 'fi-sr-video-camera', title: 'Video & Audio Calls', desc: 'Crystal clear WebRTC powered calls' },
              { icon: 'fi-sr-gift', title: 'Virtual Gifts', desc: 'Send gifts and earn gold coins' },
              { icon: 'fi-sr-dice', title: 'Games & Quiz', desc: 'Dice, spin wheel, and trivia quizzes' },
              { icon: 'fi-sr-shield-check', title: 'Secured Chat', desc: 'Monitored 24/7 by trained moderators' },
              { icon: 'fi-sr-user', title: 'No Registration', desc: 'Join as a guest instantly — no email needed' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'linear-gradient(135deg,#f8f9fa,#e8f0fe)', borderRadius: 12, padding: '20px 18px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,.06)', border: '1px solid #e8eaed' }}>
                <i className={`fi ${f.icon}`} style={{ fontSize: 28, color: '#1a73e8', display: 'block', marginBottom: 10 }} />
                <div style={{ fontWeight: 800, color: '#202124', marginBottom: 6, fontFamily: 'Outfit,sans-serif' }}>{f.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#5f6368', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <style>{`@media(min-width:700px){.hero-img-wrap{flex:0 0 400px!important;width:400px!important}}`}</style>
    </PageLayout>
  )
}
