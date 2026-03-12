import { useState } from 'react'
import PageLayout from '../../components/PageLayout.jsx'

const FAQS = [
  { q: 'Is ChatsGenZ completely free to use?', a: 'Yes! ChatsGenZ is 100% free to join and use. All core features including joining chatrooms, sending messages, making friends, and audio/video calls are free. Some exclusive rooms and features unlock as you earn ranks and gold coins through regular participation.' },
  { q: 'Do I need to register to start chatting?', a: 'No registration is required! You can join as a guest instantly — just choose a display name and pick a chatroom. If you want extra features like saving your profile, friend lists, custom rank colours, and gold coins, creating a free account takes less than a minute.' },
  { q: 'How do I earn gold coins on ChatsGenZ?', a: 'You earn gold coins by being active on the platform. Ways to earn include: claiming your daily login bonus, levelling up your account, winning quiz contests in the Quiz Room, receiving virtual gifts from other users, and participating in special platform events.' },
  { q: 'How do I start a video call or audio call?', a: 'You can start a private video call or audio call by opening any user\'s profile and clicking the Video Call or Audio Call button. You can also join group calls in rooms that have an active call session. Video and audio calls are powered by WebRTC and are completely free with no downloads required.' },
  { q: 'What is the cam feature and how does it work?', a: 'The public cam chat feature lets users broadcast their webcam to everyone in a chatroom. To start a cam session, click the "Start Cam" button in the room. Depending on your rank, there may be a small gold coin cost per minute to maintain a cam session. Viewers can watch for free. Moderators can close cam sessions that violate rules.' },
  { q: 'How do ranks work? How do I get a higher rank?', a: 'Ranks are earned primarily through XP points, which you gain by sending messages, receiving gifts, and logging in daily. As your XP level increases, you automatically unlock higher ranks. Special ranks like Moderator and Admin are assigned by our team based on trustworthiness and contribution to the community.' },
  { q: 'Can I access adult content on ChatsGenZ?', a: 'Adult chatrooms are available for users who are 18 years of age or older. You must confirm your age before accessing adult sections. We maintain strict moderation in adult rooms. Minors caught accessing adult content will be immediately removed from the platform.' },
  { q: 'How do I report a user or inappropriate content?', a: 'Every message and every user profile on ChatsGenZ has a report button. Simply click the three-dot menu or right-click on a message to find the report option. All reports are reviewed by our moderation team within 24 hours. You can also block any user directly from their profile to prevent further contact.' },
  { q: 'I received a ban. Can I appeal?', a: 'Yes, you can appeal any moderation decision by contacting us through our Contact page. Please include your username and explain what happened. Our moderation team will review your case within 5 business days. Please note that bans for serious violations such as sharing illegal content or targeting minors are not eligible for appeal.' },
  { q: 'How do I change my username or profile details?', a: 'Log in to your account, click your avatar in the top corner, and go to Profile Settings. From there you can change your display name (once every 30 days), upload a new profile photo, update your About Me section, and adjust your privacy settings.' },
  { q: 'Why is my message not sending?', a: 'Common reasons messages fail to send include: you have been muted by a moderator, you are sending messages too quickly (spam filter triggered), you have lost your internet connection, or the room is set to a minimum rank requirement you don\'t yet meet. If none of these apply, please contact our support team.' },
  { q: 'Is my chat data private and secure?', a: 'Private messages are stored encrypted and are only accessible to you and the person you\'re messaging. Public chatroom messages are visible to all room members and are stored temporarily for moderation purposes. We never sell your data and do not use it for advertising. Full details are in our Privacy Policy.' },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="faq-item">
      <div className={`faq-q ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <svg className="faq-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div className={`faq-a ${open ? 'open' : ''}`}>{a}</div>
    </div>
  )
}

export default function FAQ() {
  return (
    <PageLayout seo={{
      title: 'FAQ – Frequently Asked Questions – ChatsGenZ',
      description: 'ChatsGenZ FAQ. Answers to the most common questions about our free live chat platform — registration, video calls, ranks, safety, bans, gold coins and more.',
      keywords: 'chatsgenz FAQ, free chat questions, how to use chatsgenz, chatsgenz guide, chat help india',
      canonical: '/faq'
    }}>
      <div className="page-container">
        <h1 className="page-title">Frequently Asked Questions</h1>
        <p className="page-subtitle">Quick answers to the most common ChatsGenZ questions</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>

        <div style={{ marginTop: 28, textAlign: 'center', padding: '24px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 14, fontFamily: 'var(--font-2)' }}>
            Didn't find your answer? Our support team is here to help.
          </p>
          <a href="/contact" className="btn-primary">Ask a Question →</a>
        </div>
      </div>
    </PageLayout>
  )
}
