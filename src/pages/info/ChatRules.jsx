import PageLayout from '../../components/PageLayout.jsx'

const RULES = [
  { num: '01', title: "Respect All Users", desc: "Treat every person on ChatsGenZ with basic human respect. Harassment, bullying, name-calling, personal attacks, or any form of abusive behaviour will result in an immediate mute or ban. This applies in all rooms — public, private, and VIP chatrooms.' },
  { num: '02', title: "No Hate Speech", desc: "Content that promotes hatred, discrimination, or violence based on race, religion, gender, sexual orientation, nationality, caste, disability, or any other characteristic is strictly prohibited and will result in a permanent ban.' },
  { num: '03', title: "No Illegal Content", desc: "Sharing, requesting, or promoting any illegal content including but not limited to pirated material, illegal substances, weapons, or financial fraud is absolutely prohibited. Such violations will be reported to relevant authorities.' },
  { num: '04', title: "No Minors in Adult Rooms", desc: "Adult rooms are strictly for users aged 18+. Minors must not access adult content areas. Any user found to be a minor in an adult room will be immediately removed. Adults who knowingly engage with minors in adult spaces will be permanently banned.' },
  { num: '05', title: "No Spam or Flooding", desc: "Do not flood chatrooms with repeated messages, symbols, or links. Do not use bots or automated scripts to post messages. Spam disrupts the experience for all users and will result in muting or removal.' },
  { num: '06', title: "No Sharing Personal Information", desc: "Do not share your own or others\' personal contact information (phone numbers, home addresses, social media handles) in public rooms. Protect yourself and others\' privacy at all times.' },
  { num: '07', title: "No Impersonation", desc: "Impersonating ChatsGenZ staff, moderators, admins, or other users is strictly forbidden. This includes using similar usernames to confuse or deceive other users.' },
  { num: '08', title: "Appropriate Language", desc: "While ChatsGenZ supports adult rooms with mature content, general chatrooms must maintain an appropriate level of language. Excessive profanity or sexually explicit language in non-adult rooms is not permitted.' },
  { num: '09', title: "No Commercial Advertising", desc: "Advertising products, services, other websites, or platforms without express written permission from ChatsGenZ is prohibited. This includes promoting paid services, onlyfans links, referral schemes, and similar content.' },
  { num: '10', title: "Follow Cam Rules", desc: "Cam users must follow all cam-specific rules including no sexual content in non-adult cam rooms, no showing of minors on camera, and no recording of other users\' cam feeds without consent.' },
]

export default function ChatRules() {
  return (
    <PageLayout seo={{
      title: "Chat Rules – ChatsGenZ Community Guidelines",
      description: "ChatsGenZ Chat Rules and community guidelines. Understand the rules that keep our free chatrooms safe, friendly, and enjoyable for everyone.",
      keywords: "chatsgenz chat rules, free chat rules, chatroom guidelines, chat community rules india",
      canonical: "/chat-rules"
    }}>
      <div className="page-container">
        <h1 className="page-title">Chat Rules</h1>
        <p className="page-subtitle">These rules apply to all users in all rooms — read them, know them, follow them</p>

        <div style={{ background: '#fffde7', border: '1px solid #fbbc04', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 28, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p style={{ fontSize: 14, color: '#92400e', margin: 0, fontFamily: 'var(--font-2)' }}>Violation of these rules may result in muting, kicking, temporary banning, or permanent removal from ChatsGenZ depending on severity.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {RULES.map(r => (
            <div key={r.num} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 22px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, lineHeight: 1.3 }}>{r.num}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>{r.title}</div>
                <div style={{ fontSize: 14, color: 'var(--text-2)', fontFamily: 'var(--font-2)', lineHeight: 1.7 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--primary-l)', border: '1px solid #b3d1fc', borderRadius: 'var(--radius)', padding: '16px 20px', marginTop: 28 }}>
          <p style={{ fontSize: 14, color: 'var(--primary-d)', margin: 0, fontFamily: 'var(--font-2)' }}>
            <strong>Remember:</strong> Rules are enforced to ensure ChatsGenZ remains a safe and enjoyable <strong>free chatroom</strong> for everyone. If you see a rule violation, use the report button. Our moderation team reviews all reports promptly. Thank you for helping keep our community great!
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
