import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout.jsx'

const CATEGORIES = [
  {
    title: 'Desi & South Asian Chat Rooms',
    desc: 'Connect with people from the Indian subcontinent and South Asia. ChatsGenZ has dedicated Desi chat rooms where you can talk in your own language, share culture, discuss Bollywood, cricket, food, and life. Whether you are from India, Pakistan, Bangladesh, Nepal, or Sri Lanka — there is a room waiting for you. Make new Desi friends or find someone special in our warm and active South Asian community.',
    rooms: ['Desi Chat','Desi Girls','Indian Chat','Hindi Chat','Punjabi Chat','Rajasthani Chat','Marathi Chat','Gujarati Chat','Tamil Chat','Telugu Chat','Malayalam Chat','Bengali Chat'],
  },
  {
    title: 'International & Global Chat Rooms',
    desc: 'ChatsGenZ connects people from over 50 countries worldwide. Our international chat rooms let you talk to people from the USA, UK, Europe, Asia, and beyond. Practice a new language, learn about different cultures, make international friends, or simply enjoy a good conversation with someone from the other side of the world. Global chat at its best — completely free.',
    rooms: ['Global Chat','USA Chat','UK Chat','Italy Chat','Germany Chat','France Chat','Europe Chat','China Chat'],
  },
]

const BTN = { display:'inline-flex', alignItems:'center', padding:'7px 16px', borderRadius:8, background:'linear-gradient(135deg,#1a73e8,#1557b0)', color:'#fff', fontWeight:700, fontSize:'0.82rem', textDecoration:'none', marginRight:8, marginBottom:8, boxShadow:'0 2px 8px rgba(26,115,232,.25)' }

export default function ChatDirectory() {
  return (
    <PageLayout seo={{
      title: 'Chat Directory — Browse All Free Chat Rooms on ChatsGenZ',
      description: 'Browse all ChatsGenZ free chat rooms. Desi chat, Indian chat, Hindi chat, USA chat, UK chat, global chat, adult chat, and more. No registration required to join any room.',
      keywords: 'ChatsGenZ chat rooms, free chat rooms, desi chat, Indian chat, Hindi chat, USA chat, UK chat, global chat, stranger chat rooms, chat directory chatsgenz',
      canonical: '/chat-directory',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 48px' }}>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.5rem,4vw,2rem)', color:'#202124', marginBottom:8 }}>Chat Directory</h1>
        <p style={{ color:'#5f6368', fontSize:'0.95rem', marginBottom:36, lineHeight:1.6 }}>
          Browse all available chat rooms on ChatsGenZ. Click any room button to join — no registration required to get started.
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
          {CATEGORIES.map((cat, i) => (
            <div key={i} style={{ background:'#fff', border:'1px solid #e8eaed', borderRadius:14, padding:'24px 22px' }}>
              <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1.05rem', color:'#202124', marginBottom:10 }}>{cat.title}</h2>
              <p style={{ fontSize:'0.9rem', color:'#5f6368', lineHeight:1.75, marginBottom:18 }}>{cat.desc}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:0 }}>
                {cat.rooms.map(room => (
                  <Link key={room} to="/login" style={BTN}>
                    {room} — Try Now
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Adult section */}
          <div style={{ background:'#fff', border:'1.5px solid #fca5a5', borderRadius:14, padding:'24px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ background:'#fce8e6', color:'#ea4335', fontSize:'0.75rem', fontWeight:700, padding:'3px 10px', borderRadius:20 }}>18+ ONLY</span>
              <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1.05rem', color:'#202124', margin:0 }}>Adult Chat Rooms</h2>
            </div>
            <p style={{ fontSize:'0.9rem', color:'#5f6368', lineHeight:1.75, marginBottom:18 }}>
              ChatsGenZ has dedicated adult chat rooms for users who are 18 years of age or older. These rooms are strictly moderated and require age confirmation before entry. Our adult chat rooms offer a safe, respectful environment where adults can connect freely. All adult rooms are monitored 24/7 by our moderation team and have strict rules against illegal content of any kind.
            </p>
            <div style={{ display:'flex', flexWrap:'wrap' }}>
              {['Adult Chat','18+ Chat','Flirt Chat','Couples Chat','Mature Chat'].map(room => (
                <Link key={room} to="/login" style={{ ...BTN, background:'linear-gradient(135deg,#ea4335,#c5221f)', boxShadow:'0 2px 8px rgba(234,67,53,.25)' }}>
                  {room} — Try Now
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
