import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout.jsx'

export default function Community() {
  return (
    <PageLayout seo={{
      title: 'Community — Join the ChatsGenZ Global Chat Community',
      description: 'Be part of the ChatsGenZ community. Chat worldwide, earn ranks, send virtual gifts, play games, make friends and build real connections on ChatsGenZ free live chat platform.',
      keywords: 'ChatsGenZ community, online chat community, global chat friends, ChatsGenZ ranks, free chat community, live chat platform community',
      canonical: '/community',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 18px 48px' }}>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.4rem,4vw,1.9rem)', color:'#202124', marginBottom:8 }}>Our Community</h1>

        <p style={{ fontSize:'clamp(0.88rem,2vw,0.975rem)', color:'#3c4043', lineHeight:1.85, marginBottom:20 }}>
          ChatsGenZ is more than just a chat platform — it is a living, breathing worldwide community of real people connecting with each other every single day. From the moment you join your first chat room, you become part of something bigger. Our community is built on respect, fun, and genuine human connection. People from over 50 countries are active on ChatsGenZ right now, talking in dozens of languages, making new friends, sharing their lives, and building relationships that often go beyond the screen.
        </p>
        <p style={{ fontSize:'clamp(0.88rem,2vw,0.975rem)', color:'#3c4043', lineHeight:1.85, marginBottom:20 }}>
          What makes ChatsGenZ special is the people. Whether you are a long-time member with a Legend rank or a brand new guest who just walked in — you are welcomed. Our community has a culture of friendliness, curiosity, and good vibes. Room Owners and Moderators work hard to keep every room safe, positive, and enjoyable for all. We have rooms for every interest — music, sports, relationships, regional languages, gaming, and so much more. There is always someone to talk to, something to do, and a room where you belong.
        </p>
        <p style={{ fontSize:'clamp(0.88rem,2vw,0.975rem)', color:'#3c4043', lineHeight:1.85, marginBottom:20 }}>
          The ChatsGenZ community is also built around engagement and rewards. Earn XP just by chatting and level up your rank over time. Send and receive virtual gifts to show appreciation. Compete in Quiz Rooms, play dice games, and climb the leaderboard. Collect gold coins and spend them on platform features. Every interaction you have on ChatsGenZ makes the community stronger and more vibrant. We are growing every day, and we are glad you are here.
        </p>
        <p style={{ fontSize:'clamp(0.88rem,2vw,0.975rem)', color:'#3c4043', lineHeight:1.85, marginBottom:32 }}>
          Above all, ChatsGenZ is a place built on trust and safety. Our dedicated moderation team monitors all rooms around the clock. Our community guidelines ensure that every person — regardless of age, background, language, or gender — can enjoy a safe and respectful environment. If you ever feel uncomfortable, you can block, report, or contact a moderator instantly. This is your community too, and we take that responsibility seriously. Welcome to ChatsGenZ — where the world comes to chat.
        </p>

        {/* 3 buttons - Home, Forum, Chat */}
        <div style={{
          display: 'flex', gap: 14, flexWrap: 'wrap',
          borderTop: '1px solid #e8eaed', paddingTop: 28,
        }}>
          <Link to="/" style={{
            flex: 1, minWidth: 120, textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 18px', borderRadius: 10,
            border: '1.5px solid #dadce0', color: '#5f6368',
            fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
            fontFamily: 'Outfit,sans-serif', transition: 'all .15s',
            background: '#fff',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#1a73e8'; e.currentTarget.style.color='#1a73e8' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#dadce0'; e.currentTarget.style.color='#5f6368' }}
          >
            <i className="fi fi-sr-home" /> Home
          </Link>

          <Link to="/forum" style={{
            flex: 1, minWidth: 120, textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 18px', borderRadius: 10,
            border: '1.5px solid #dadce0', color: '#5f6368',
            fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
            fontFamily: 'Outfit,sans-serif', transition: 'all .15s',
            background: '#fff',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#1a73e8'; e.currentTarget.style.color='#1a73e8' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#dadce0'; e.currentTarget.style.color='#5f6368' }}
          >
            <i className="fi fi-sr-comment-alt" /> Forum
          </Link>

          <Link to="/login" style={{
            flex: 1, minWidth: 120, textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 18px', borderRadius: 10,
            background: 'linear-gradient(135deg,#1a73e8,#1557b0)',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            textDecoration: 'none', fontFamily: 'Outfit,sans-serif',
            boxShadow: '0 3px 12px rgba(26,115,232,.3)',
          }}>
            <i className="fi fi-sr-comment-alt" /> Start Chat
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}
