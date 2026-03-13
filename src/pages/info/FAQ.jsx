import { useState } from 'react'
import PageLayout from '../../components/PageLayout.jsx'

const FAQS = [
  { q: 'Is ChatsGenZ completely free to use?', a: 'Yes! ChatsGenZ is 100% free. All core features including joining chat rooms, messaging, making friends, and audio/video calls are completely free. Some exclusive rooms and cosmetic features unlock as you earn ranks and gold coins through regular participation.' },
  { q: 'Do I need to register to start chatting?', a: 'No registration is required. Join as a guest instantly — just choose a display name and pick a chat room. If you want extra features like saving your profile, friends list, custom rank colours, and gold coins, creating a free account takes less than a minute.' },
  { q: 'How do I earn gold coins on ChatsGenZ?', a: 'You earn gold coins by being active on the platform. Ways to earn include claiming your daily login bonus, levelling up your account XP, winning quiz contests in the Quiz Room, receiving virtual gifts from other users, and participating in special platform events.' },
  { q: 'How do I start a video call or audio call?', a: 'Open any registered user profile and click the Video Call or Audio Call button. You can also join group calls in rooms that have an active call session. All video and audio calls on ChatsGenZ are powered by WebRTC and are completely free with no downloads required.' },
  { q: 'What is the cam feature and how does it work?', a: 'The public cam chat feature lets you broadcast your webcam to everyone in a chat room. Click the Start Cam button in the room toolbar to begin. Viewers can watch for free. Depending on your rank, there may be a small gold coin cost per minute. Moderators can close cam sessions that violate rules.' },
  { q: 'How do ranks work on ChatsGenZ?', a: 'Ranks are earned through XP points, which you gain by sending messages, receiving gifts, and logging in daily. As your XP level increases, you automatically unlock higher free ranks. Special ranks like Moderator and Admin are appointed by our team based on trustworthiness and community contribution.' },
  { q: 'Can I access adult content on ChatsGenZ?', a: 'Adult chat rooms are available only for users who are 18 years of age or older. You must confirm your age before accessing adult sections. We maintain strict moderation in adult rooms. Any minor found accessing adult content will be immediately removed from the platform.' },
  { q: 'How do I report a user or inappropriate content?', a: 'Every message and user profile has a report button. Click the three-dot menu next to any message or right-click on a username to find the report option. All reports are reviewed by our moderation team promptly. You can also block any user directly from their profile to prevent further contact.' },
  { q: 'I received a ban. Can I appeal?', a: 'Yes, you can appeal any moderation decision through our Contact page. Include your username and a clear explanation of what happened. Our team will review your case within 5 business days. Note that bans for serious violations such as sharing illegal content or targeting minors are not eligible for appeal.' },
  { q: 'Why is my message not sending?', a: 'Common reasons include: you have been muted by a moderator, you are sending messages too quickly triggering the spam filter, you have lost your internet connection, or the room has a minimum rank requirement you do not yet meet. If none of these apply, please contact our support team.' },
  { q: 'How do I change my username or profile details?', a: 'Log in, click your avatar in the top corner, and go to Profile Settings. You can change your display name once every 30 days, upload a new profile photo, update your About Me section, and adjust your privacy settings from there.' },
  { q: 'Is my data private and secure on ChatsGenZ?', a: 'Private messages are stored encrypted and accessible only to you and the recipient. Public chat room messages are visible to all room members and stored temporarily for moderation. We never sell your data and never use it for advertising. Full details are in our Privacy Policy.' },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="faq-item" style={{ marginBottom: 10 }}>
      <button className="faq-q" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <i className={`fi fi-sr-angle-${open ? 'up' : 'down'}`} style={{ fontSize: 13, flexShrink: 0, color: '#1a73e8' }} />
      </button>
      {open && <div className="faq-a">{a}</div>}
    </div>
  )
}

export default function FAQ() {
  return (
    <PageLayout seo={{
      title: 'FAQ — Frequently Asked Questions About ChatsGenZ',
      description: 'Answers to the most common questions about ChatsGenZ free live chat platform. Learn about ranks, gold coins, video calls, cam chat, safety, privacy and more on ChatsGenZ.',
      keywords: 'ChatsGenZ FAQ, ChatsGenZ help, chat site questions, ChatsGenZ how to, free chat FAQ, ChatsGenZ support',
      canonical: '/faq',
    }}>
      <div className="page-container">
        <h1 className="page-title">Frequently Asked Questions</h1>
        <p className="page-subtitle">Everything you need to know about using ChatsGenZ. Can not find your answer? Visit our Help Center or Contact Us.</p>
        <div>
          {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </div>
    </PageLayout>
  )
}
