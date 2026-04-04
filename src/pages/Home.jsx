import { Link, useNavigate } from 'react-router-dom'
import { SITE_NAME, SITE_SLOGAN, AD_BANNER_ZONE, AD_BANNER_CLASS, AD_VAST_ZONE_1, AD_VAST_ZONE_2, AD_IFRAME_SRC } from '../siteConfig'
import { useEffect, useRef, useState } from 'react'
import PageLayout from '../components/PageLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// Iframe Ad Component for Profitable CPM
function IframePromoAd() {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
      borderRadius: 16,
      padding: 20,
      margin: '24px 0',
      boxShadow: '0 8px 24px rgba(196, 69, 105, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'absolute',
        top: -20,
        right: -20,
        width: 150,
        height: 150,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        filter: 'blur(40px)'
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <img 
            src="https://i.imgur.com/QXzKwPJ.jpg" 
            alt="Join Now" 
            style={{ 
              width: 120, 
              height: 120, 
              borderRadius: 12, 
              objectFit: 'cover',
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
            onError={e => e.target.src = '/default_images/promo.png'}
          />
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ 
              color: '#fff', 
              fontSize: 20, 
              fontWeight: 800, 
              margin: '0 0 8px 0',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              💕 Meet Hot Singles Near You!
            </h3>
            <p style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: 14, 
              margin: '0 0 12px 0',
              lineHeight: 1.5
            }}>
              Join thousands chatting live. Real people, real connections. 18+ only.
            </p>
            <iframe 
              src={AD_IFRAME_SRC}
              style={{ 
                width: '100%',
                height: 50,
                border: 'none',
                borderRadius: 8,
                background: '#fff'
              }}
              scrolling="no"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// VAST Video Ad Component
function VastVideoAd({ zoneId }) {
  const [videoUrl, setVideoUrl] = useState(null)
  const [show, setShow] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    const vastUrl = `https://s.magsrv.com/v1/vast.php?idzone=${zoneId}`
    
    fetch(vastUrl)
      .then(res => res.text())
      .then(vastXml => {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(vastXml, 'text/xml')
        const mediaFile = xmlDoc.querySelector('MediaFile')
        
        if (mediaFile) {
          const url = mediaFile.textContent.trim()
          setVideoUrl(url)
          setShow(true)
        }
      })
      .catch(() => {})
  }, [zoneId])

  if (!show || !videoUrl) return null

  return (
    <div style={{ 
      background: '#000',
      borderRadius: 12,
      overflow: 'hidden',
      margin: '20px 0',
      position: 'relative'
    }}>
      <video 
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted
        playsInline
        controls
        style={{
          width: '100%',
          maxHeight: 400,
          objectFit: 'contain'
        }}
      />
      <button 
        onClick={() => setShow(false)}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(0,0,0,0.7)',
          border: 'none',
          color: '#fff',
          width: 32,
          height: 32,
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: 18,
          fontWeight: 'bold'
        }}
      >
        ×
      </button>
    </div>
  )
}

// Banner Ad Component
let magScriptLoaded = false
function loadMagScript(cb) {
  if (magScriptLoaded) { cb(); return }
  const s = document.createElement('script')
  s.src = 'https://a.magsrv.com/ad-provider.js'
  s.async = true
  s.onload = () => { magScriptLoaded = true; cb() }
  document.head.appendChild(s)
}

function BannerAd({ zoneId, className }) {
  const ref = useRef(null)
  
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => {
      if (cancelled || !ref.current) return
      loadMagScript(() => {
        if (cancelled) return
        window.AdProvider = window.AdProvider || []
        window.AdProvider.push({ serve: {} })
      })
    }, 800)
    return () => { cancelled = true; clearTimeout(t) }
  }, [zoneId])
  
  return (
    <div ref={ref} style={{ textAlign: 'center', margin: '16px 0' }}>
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
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 18px 0', display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* Left: Paragraph Content */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="hero-img-wrap" style={{ width: '100%', marginBottom: 20 }}>
              <img src="/images/hero-couple.jpg" alt="People chatting on ChatsGenZ"
                style={{ width: '100%', borderRadius: 12, display: 'block', objectFit: 'cover', maxHeight: 320 }}
                onError={e => { e.target.style.display = 'none' }} />
            </div>

            <p style={{ fontSize: 'clamp(0.9rem,2vw,1rem)', color: '#3c4043', lineHeight: 1.9, marginBottom: 20 }}>
              Welcome to <strong>ChatsGenZ</strong> — the fastest growing <strong>free live chatting site</strong> where you can connect with people from all over the world without registration. Join <strong>free chat rooms</strong>, enjoy <strong>video call chat</strong> and <strong>audio call chat</strong>, send virtual gifts, and level up with our XP rank system.
            </p>

            {/* VAST Video Ad between paragraphs */}
            <VastVideoAd zoneId={AD_VAST_ZONE_1} />

            <p style={{ fontSize: 'clamp(0.9rem,2vw,1rem)', color: '#3c4043', lineHeight: 1.9, marginBottom: 20 }}>
              ChatsGenZ is not just another chat website — it is a fully-featured, <strong>next-generation live chatting platform</strong> trusted by users from over 50 countries. Whether you're looking for a <strong>free chat room</strong>, a <strong>stranger chatting site</strong>, or a community of like-minded people, ChatsGenZ has everything you need. This is a <strong>secured chat</strong> environment monitored 24/7.
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
                <i className="fa-solid fa-comment-alt" /> Start Chatting Free
              </Link>
            </div>

            {/* Iframe Promo Ad below Start Chatting button */}
            <IframePromoAd />
          </div>

          {/* Right: Banner Ad */}
          <div style={{ width: 300, flexShrink: 0 }}>
            <BannerAd zoneId={AD_BANNER_ZONE} className={AD_BANNER_CLASS} />
          </div>
        </div>

        {/* Why Choose Section */}
        <div style={{ maxWidth: 1100, margin: '32px auto 0', padding: '0 18px 32px' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: 'clamp(1.1rem,3vw,1.45rem)', color: '#202124', marginBottom: 18 }}>
            Why Choose ChatsGenZ?
          </h2>
          <div style={{ fontSize: 'clamp(0.875rem,2vw,0.95rem)', color: '#3c4043', lineHeight: 1.95 }}>
            <p style={{ marginBottom: 14 }}>
              Our platform offers <strong>hundreds of public chat rooms</strong> organized by language, country, topic, and interest. Whether you want to chat in Hindi, English, Punjabi, or any other language, you'll find the right room within seconds. With our <strong>live chatting site</strong>, the conversation never stops — rooms are active 24/7 with real users from around the globe.
            </p>
            <p style={{ marginBottom: 14 }}>
              ChatsGenZ takes <strong>video call chat</strong> and <strong>audio call chat</strong> seriously. Built on WebRTC technology, our calls are crystal-clear, peer-to-peer, and completely free. You can make one-on-one video calls, group audio calls, or go on <strong>public webcam</strong> for everyone in the room to watch — all within the same chatroom interface.
            </p>
            <p style={{ marginBottom: 14 }}>
              Our unique <strong>XP rank system</strong> keeps things exciting. Start as a Guest and rank up through User, VIP, Butterfly, Ninja, Fairy, Legend, Premium, and more. Earn <strong>gold coins</strong>, play <strong>dice games</strong>, spin the <strong>prize wheel</strong>, and compete on the global <strong>leaderboard</strong>.
            </p>
            <p style={{ marginBottom: 0 }}>
              Safety is our top priority. ChatsGenZ is moderated 24/7 by trained staff. Our <strong>secured chat</strong> environment uses IP ban protection, word filters, spam detection, and reporting. Join millions on the world's most exciting <strong>free live chat rooms</strong> today.
            </p>
          </div>
        </div>

        {/* Footer VAST Video Ad */}
        <div style={{ maxWidth: 1100, margin: '0 auto 32px', padding: '0 18px' }}>
          <VastVideoAd zoneId={AD_VAST_ZONE_2} />
        </div>
      </section>

      <style>{`
        @media(min-width:700px){
          .hero-img-wrap{flex:0 0 400px!important;width:400px!important}
        }
        @media(max-width:900px){
          .hero-img-wrap{width:100%!important}
        }
      `}</style>
    </PageLayout>
  )
}
