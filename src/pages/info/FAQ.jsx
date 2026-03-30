import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout.jsx'

const FAQS = [
  {
    q: 'Is ChatsGenZ completely free to use?',
    a: 'Yes — ChatsGenZ is 100% free. You can join chat rooms, send messages, make friends, use public cam chat, do audio and video calls, play quiz games, earn XP, and level up your rank without paying anything. The only paid option is the Premium rank, which gives extra cosmetic features and access to exclusive rooms. Everything else on the platform is completely free for everyone, forever.',
  },
  {
    q: 'Do I need to register to start chatting?',
    a: 'No. You can join as a guest right now without any registration, email, or phone number. Just pick a username, select your gender, and you are in. If you want to save your profile, build a friends list, earn XP, keep your gold coin balance, and unlock more features over time, you can create a free account — it takes less than a minute.',
  },
  {
    q: 'What is the difference between a guest and a registered user?',
    a: 'Guest users can join public chat rooms and chat freely, but their session is temporary — nothing is saved when they leave. Registered users get a permanent profile, a friends list, private messaging, a gold coin balance that carries over, XP levels, rank eligibility, daily bonuses, and the ability to create their own chat room. Registration is free and highly recommended for a full experience.',
  },
  {
    q: 'Can I change my gender after registering?',
    a: 'No. Gender cannot be changed once your account is created. This is because gender affects your rank eligibility, your profile display, and how the platform assigns you to certain rooms. Female members are eligible for VIP Female, Butterfly, and Fairy ranks. Male members are eligible for VIP Male, Ninja, and Legend ranks. Please select your gender carefully when registering or entering as a guest.',
  },
  {
    q: 'How do I earn gold coins and XP?',
    a: 'You earn XP by sending messages (+1 XP each), claiming your daily login bonus (+10 XP), winning quiz rooms (+10 to +40 XP depending on difficulty), and playing dice or spin wheel games (+1 to +5 XP). Every 100 XP equals 1 level, and levelling up rewards you with gold coins equal to your level multiplied by 20. You can also receive gold coins as virtual gifts from other users.',
  },
  {
    q: 'How do ranks work? How do I get a rank like VIP or Legend?',
    a: 'There are two types of ranks on ChatsGenZ — free ranks and the paid Premium rank. Free ranks like VIP Female, Butterfly, Fairy, VIP Male, Ninja, and Legend are awarded by Room Owners to members they consider active, loyal, and trustworthy. You cannot buy these ranks or earn them through XP — they are given by Room Owners based on your presence and personality in the chat community. The more active and positive you are, the more likely a Room Owner will notice and reward you.',
  },
  {
    q: 'Is there adult content on ChatsGenZ? Can anyone access it?',
    a: 'ChatsGenZ has adult chat rooms that are strictly restricted to users who are 18 years of age or older. Age confirmation is required before entering any adult section of the platform. These rooms are monitored 24/7 by our moderation team and have strict rules. Any minor found in adult rooms is immediately removed and the account is banned. Parents concerned about underage access can contact our moderation team directly.',
  },
  {
    q: 'How do I report a user or content that breaks the rules?',
    a: 'You can report any user or message directly from within the chat. Tap the three-dot menu or long press on any message to find the report option. You can also open a user profile and find the report button there. All reports go directly to our moderation team who review them as a priority. For urgent situations in an active room, you can also contact any available Room Moderator or platform Moderator directly.',
  },
  {
    q: 'What is the cam chat feature and how does it work?',
    a: 'Public cam chat lets you broadcast your webcam live to everyone inside a chat room. Other members can watch your cam without needing to broadcast theirs. To start your cam, click the webcam icon in the chat room toolbar and allow your browser to access your camera. Depending on your rank and the room settings, there may be a small gold coin cost per minute of broadcasting. Room moderators and platform staff have the authority to close any cam session that violates the rules.',
  },
]

function FaqItem({ f, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      background: '#fff', border: '1px solid #e8eaed',
      borderRadius: 12, marginBottom: 10, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start',
          gap: 12, padding: '16px 18px', background: 'none',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
          background: '#e8f0fe', color: '#1a73e8',
          fontWeight: 800, fontSize: '0.8rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Outfit,sans-serif', marginTop: 1,
        }}>Q{index + 1}</span>
        <span style={{
          flex: 1, fontWeight: 700, fontSize: '0.92rem',
          color: '#202124', lineHeight: 1.45, fontFamily: 'Outfit,sans-serif',
        }}>{f.q}</span>
        <i className={`fi fi-sr-angle-${open ? 'up' : 'down'}`}
          style={{ fontSize: 13, color: '#1a73e8', flexShrink: 0, marginTop: 4 }} />
      </button>
      {open && (
        <div style={{
          padding: '0 18px 18px 56px',
          borderTop: '1px solid #f1f3f4', paddingTop: 13,
          fontSize: '0.875rem', color: '#3c4043', lineHeight: 1.8,
        }}>
          {f.a}
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <PageLayout seo={{
      title: 'FAQ — Frequently Asked Questions About ChatsGenZ',
      description: 'Answers to the most common questions about ChatsGenZ free live chat. Learn about guest login, ranks, gold coins, cam chat, adult chat, reporting users, and more on ChatsGenZ.',
      keywords: 'ChatsGenZ FAQ, ChatsGenZ questions, ChatsGenZ how to use, ChatsGenZ ranks explained, ChatsGenZ gold coins, ChatsGenZ cam chat, ChatsGenZ guest login, free chat FAQ',
      canonical: '/faq',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 18px 48px' }}>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.4rem,4vw,1.9rem)', color:'#202124', marginBottom:8 }}>Frequently Asked Questions</h1>
        <p style={{ color:'#5f6368', fontSize:'0.92rem', marginBottom:28, lineHeight:1.65 }}>
          Everything you need to know about ChatsGenZ in one place. Click any question to read the full answer.
        </p>

        <div>
          {FAQS.map((f, i) => <FaqItem key={i} f={f} index={i} />)}
        </div>

        <div style={{
          marginTop: 28, background: '#f8f9fa', border: '1px solid #e8eaed',
          borderRadius: 12, padding: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ fontSize: '0.875rem', color: '#5f6368' }}>
            <strong style={{ color: '#202124' }}>Didn't find your answer?</strong> Visit our Help Center or contact the team directly.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/help" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:8, border:'1.5px solid #dadce0', color:'#5f6368', fontWeight:700, fontSize:'0.84rem', textDecoration:'none' }}>
              <i className="fi fi-sr-interrogation" /> Help Center
            </Link>
            <Link to="/contact" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:8, background:'linear-gradient(135deg,#1a73e8,#1557b0)', color:'#fff', fontWeight:700, fontSize:'0.84rem', textDecoration:'none' }}>
              <i className="fi fi-sr-envelope" /> Contact Us
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
