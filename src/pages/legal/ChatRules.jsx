import PageLayout from '../../components/PageLayout.jsx'

const RULES = [
  { n: 1,  color: '#ea4335', icon: 'fi fi-sr-shield',       title: 'Respect Every User',             body: 'Treat every person on ChatsGenZ with basic respect regardless of their gender, nationality, religion, age, or background. Bullying, personal attacks, and targeted harassment are zero-tolerance violations that will result in an immediate ban.' },
  { n: 2,  color: '#1a73e8', icon: 'fi fi-sr-ban',           title: 'No Hate Speech or Discrimination',body: 'Hate speech, slurs, racial discrimination, religious intolerance, gender-based harassment, and content that promotes violence against any group are strictly prohibited on ChatsGenZ. This includes both direct messages and public chat rooms.' },
  { n: 3,  color: '#34a853', icon: 'fi fi-sr-user-slash',   title: 'No Impersonation',               body: 'Do not impersonate other users, platform staff, moderators, admins, celebrities, or any real person. Using a name or avatar designed to deceive others into believing you are someone else is a bannable offence.' },
  { n: 4,  color: '#fbbc04', icon: 'fi fi-sr-comment-slash', title: 'No Spamming or Flooding',        body: 'Sending the same message repeatedly, flooding the chat with rapid messages, posting excessive links, or disrupting conversation flow is considered spam. Automated bots sending messages without permission are also strictly prohibited.' },
  { n: 5,  color: '#aa44ff', icon: 'fi fi-sr-lock',         title: 'Protect Personal Information',   body: 'Never share your own or another person\'s private information publicly in chat rooms — including phone numbers, home addresses, school names, workplace details, or financial information. Sharing someone else\'s personal data (doxxing) is a permanent ban offence.' },
  { n: 6,  color: '#00aaff', icon: 'fi fi-sr-exclamation',  title: 'No Illegal Content or Activities',body: 'Content that is illegal under any applicable jurisdiction — including drug promotion, weapon trafficking, fraud, hacking tools, pirated materials, or facilitation of any criminal activity — is strictly forbidden on ChatsGenZ.' },
  { n: 7,  color: '#ff6b35', icon: 'fi fi-sr-child',        title: 'Absolute Minor Protection',      body: 'Any sexual content involving, directed at, or appearing to involve minors is a permanent ban and will be reported to relevant authorities without exception. Adults must not solicit minors for any form of inappropriate communication on ChatsGenZ.' },
  { n: 8,  color: '#0f9d58', icon: 'fi fi-sr-eye',          title: 'Cam and Video Call Standards',   body: 'Public cam broadcasts and video calls must comply with all platform rules. No nudity, sexual content, graphic violence, or disturbing material may be shown on cam. Room moderators may close cam sessions that violate these standards at any time.' },
  { n: 9,  color: '#e91e8c', icon: 'fi fi-sr-megaphone',    title: 'No Advertising or Solicitation', body: 'Advertising third-party websites, products, services, or social media accounts without explicit written permission from ChatsGenZ management is prohibited. This includes posting referral links, promotional codes, or recruitment for other platforms in any chat room.' },
  { n: 10, color: '#6366f1', icon: 'fi fi-sr-gavel',        title: 'Respect Moderator Decisions',    body: 'Platform staff and moderator decisions are final. Do not argue with staff publicly in chat rooms. If you believe a moderation action was unfair, use the official appeal process via our Contact page. Publicly disputing or insulting staff decisions may result in further action.' },
]

export default function ChatRules() {
  return (
    <PageLayout seo={{
      title: 'Chat Rules — ChatsGenZ Platform Rules and Code of Conduct',
      description: 'The official ChatsGenZ chat rules and code of conduct. All users of ChatsGenZ free live chat rooms must follow these 10 core rules for a safe and respectful experience.',
      keywords: 'ChatsGenZ rules, chat room rules, ChatsGenZ code of conduct, chat platform rules, ChatsGenZ moderation rules',
      canonical: '/chat-rules',
    }}>
      <div className="page-container">
        <h1 className="page-title">Chat Rules</h1>
        <p className="page-subtitle">All users of ChatsGenZ must follow these rules at all times. Violations may result in warnings, temporary bans, or permanent removal from the platform.</p>
        <div className="info-yellow" style={{ marginBottom: 32 }}>
          These rules apply to <strong>all users</strong> including guests, registered users, Premium members, and all staff ranks. No exceptions.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {RULES.map((r, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8eaed', borderLeft: `4px solid ${r.color}`, borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(60,64,67,.06)' }}>
              <div style={{ width: 40, height: 40, background: r.color + '15', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.color, fontSize: 19, flexShrink: 0 }}>
                <i className={r.icon} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontWeight: 900, fontSize: '0.72rem', color: '#fff', background: r.color, padding: '2px 8px', borderRadius: 20 }}>RULE {r.n}</span>
                  <h3 style={{ fontWeight: 800, fontSize: '0.975rem', color: '#202124', fontFamily: 'Outfit, sans-serif' }}>{r.title}</h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#5f6368', lineHeight: 1.7 }}>{r.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="info-red" style={{ marginTop: 32 }}>
          <strong>Enforcement:</strong> ChatsGenZ moderation team enforces these rules 24/7. Serious violations result in immediate permanent bans. If you witness a violation, use the in-platform report button or contact us via our Contact page.
        </div>
      </div>
    </PageLayout>
  )
}
