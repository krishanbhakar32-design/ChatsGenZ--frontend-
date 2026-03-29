import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import PageLayout from '../components/PageLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { VastVideoAd, DesiChatCTA } from '../components/PromoComponents.jsx'

/* ─── Anti-bot MagSrv Ad Loader ─────────────────────────────────────────── */
let magScriptLoaded = false
function loadMagScript(cb) {
  if (magScriptLoaded) { cb(); return }
  const isBotLike = (
    navigator.webdriver ||
    !navigator.languages?.length ||
    window.outerWidth === 0 ||
    /HeadlessChrome|PhantomJS|Selenium/.test(navigator.userAgent)
  )
  if (isBotLike) return
  const s = document.createElement('script')
  s.src = 'https://a.magsrv.com/ad-provider.js'
  s.async = true
  s.onload = () => { magScriptLoaded = true; cb() }
  document.head.appendChild(s)
}

function MagAd({ zoneId, className, style = {} }) {
  const ref = useRef(null)
  useEffect(() => {
    let cancelled = false
    const delay = 600 + Math.random() * 400
    const t = setTimeout(() => {
      if (cancelled || !ref.current) return
      loadMagScript(() => {
        if (cancelled) return
        window.AdProvider = window.AdProvider || []
        window.AdProvider.push({ serve: {} })
      })
    }, delay)
    return () => { cancelled = true; clearTimeout(t) }
  }, [zoneId])
  return (
    <div ref={ref} style={{ textAlign: 'center', margin: '0 auto', ...style }}>
      <ins className={className} data-zoneid={zoneId} style={{ display: 'block' }}></ins>
    </div>
  )
}

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
        {/* Hero section */}
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
            {/* Ad zone 5884716 — below Start Chatting Now button */}
            <div style={{ marginTop: 18 }}>
              <MagAd zoneId="5884716" className="eas6a97888e20" />
            </div>
            {/* Desi Chat CTA */}
            <DesiChatCTA variant="hero" />
          </div>
        </div>

        {/* VAST Video Ad — full-width below hero */}
        <div style={{ maxWidth: 1100, margin: '28px auto 0', padding: '0 18px' }}>
          <VastVideoAd />
        </div>

        {/* Why Choose ChatsGenZ — 450 words with keywords */}
        <div style={{ maxWidth: 1100, margin: '32px auto 0', padding: '0 18px 32px' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: 'clamp(1.1rem,3vw,1.45rem)', color: '#202124', marginBottom: 18 }}>
            Why Choose ChatsGenZ?
          </h2>
          <div style={{ fontSize: 'clamp(0.875rem,2vw,0.95rem)', color: '#3c4043', lineHeight: 1.95 }}>
            <p style={{ marginBottom: 14 }}>
              <strong>ChatsGenZ</strong> is not just another chat website — it is a fully-featured, <strong>next-generation live chatting platform</strong> trusted by users from over 50 countries. Whether you're looking for a <strong>free chat room</strong>, a <strong>stranger chatting site</strong>, or a community of like-minded people, ChatsGenZ has everything you need in one place. Best of all, <strong>no registration is required</strong> — you can jump in instantly as a guest or create a free account to unlock advanced features.
            </p>
            <p style={{ marginBottom: 14 }}>
              Our platform offers <strong>hundreds of public chat rooms</strong> organized by language, country, topic, and interest. Whether you want to chat in Hindi, English, Punjabi, or any other language, you'll find the right room within seconds. With our <strong>live chatting site</strong>, the conversation never stops — rooms are active 24/7 with real users from around the globe.
            </p>
            <p style={{ marginBottom: 14 }}>
              ChatsGenZ takes <strong>video call chat</strong> and <strong>audio call chat</strong> seriously. Built on WebRTC technology, our calls are crystal-clear, peer-to-peer, and completely free. You can make one-on-one video calls, group audio calls, or go on <strong>public webcam</strong> for everyone in the room to watch — all within the same chatroom interface, no third-party apps needed.
            </p>
            <p style={{ marginBottom: 14 }}>
              Our unique <strong>XP rank system</strong> keeps things exciting. Start as a Guest and rank up through User, VIP, Butterfly, Ninja, Fairy, Legend, Premium, and more — each rank unlocking new colors, badges, and chat privileges. Earn <strong>gold coins</strong> with every message you send, claim daily login bonuses, play <strong>dice games</strong>, spin the <strong>prize wheel</strong>, and compete on the global <strong>leaderboard</strong>.
            </p>
            <p style={{ marginBottom: 14 }}>
              Send over 30 animated <strong>virtual gifts</strong> — roses, crowns, diamonds, and more — to your favorite chatters. Gifts are powered by the in-app gold wallet system. Premium members get exclusive rank badges, name colors, gradient bubbles, neon text effects, and custom chat themes from our library of <strong>24 beautiful themes</strong>.
            </p>
            <p style={{ marginBottom: 0 }}>
              Safety is our top priority. ChatsGenZ is moderated 24/7 by trained staff. Our <strong>secured chat</strong> environment uses IP ban protection, word filters, spam detection, and a comprehensive reporting system. Your data is never sold. Whether you're on mobile or desktop, ChatsGenZ offers a smooth, <strong>mobile-first experience</strong> — so you can chat, call, and connect anytime, anywhere. Join millions of users on the world's most exciting <strong>free live chat rooms</strong> today.
            </p>
          </div>
        </div>
      </section>

      <style>{`@media(min-width:700px){.hero-img-wrap{flex:0 0 400px!important;width:400px!important}}`}</style>
    </PageLayout>
  )
}
