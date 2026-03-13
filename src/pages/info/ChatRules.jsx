import PageLayout from '../../components/PageLayout.jsx'

const RULES = [
  {
    num: '01',
    title: 'Respect Everyone',
    color: '#1a73e8',
    body: 'Treat every user with basic human respect regardless of their nationality, gender, religion, race, age, sexual orientation, or background. Hate speech, slurs, discrimination, and derogatory language are strictly prohibited and will result in an immediate ban.',
  },
  {
    num: '02',
    title: 'No Harassment or Bullying',
    color: '#ea4335',
    body: 'Targeting, threatening, intimidating, or repeatedly harassing another user is not tolerated. This includes sending unsolicited offensive messages, following users across rooms to provoke them, or coordinating group harassment. First offence may result in a temporary ban; repeated offences result in a permanent ban.',
  },
  {
    num: '03',
    title: 'No Spam or Flooding',
    color: '#fbbc04',
    body: 'Do not spam the chat with repetitive messages, random characters, excessive emojis, or unsolicited advertisements. Flooding the chat to disrupt conversations or drawing attention to external websites, products, or services is prohibited.',
  },
  {
    num: '04',
    title: 'No Explicit or Illegal Content',
    color: '#ea4335',
    body: 'Sharing, linking to, or requesting sexually explicit content outside of designated adult rooms is strictly prohibited. Sharing content that depicts or promotes illegal activities, violence, self-harm, or exploitation of any kind is banned on this platform and may be reported to authorities.',
  },
  {
    num: '05',
    title: 'Protect Minors at All Times',
    color: '#ea4335',
    body: 'ChatsGenZ has a zero-tolerance policy for any content, behaviour, or conversation that sexualises, exploits, harms, or endangers minors in any way. Users found violating this rule will be permanently banned and reported to the appropriate law enforcement authorities without exception.',
  },
  {
    num: '06',
    title: 'No Sharing of Personal Information',
    color: '#34a853',
    body: 'For your own safety, avoid sharing your real name, address, phone number, school or workplace, financial details, or any other identifying personal information in public chat rooms. ChatsGenZ is not responsible for any harm resulting from users voluntarily sharing their personal information.',
  },
  {
    num: '07',
    title: 'Use Appropriate Usernames',
    color: '#1a73e8',
    body: 'Your username must not contain offensive words, impersonate staff members or other users, or imitate any brand or public figure. Usernames that are sexual, hateful, or otherwise inappropriate will be removed by staff.',
  },
  {
    num: '08',
    title: 'No Impersonating Staff',
    color: '#ff6d00',
    body: 'Impersonating a Moderator, Admin, Super Admin, Owner, or any platform staff member is a serious offence. If you believe you have encountered a fake staff member, please report them immediately. Genuine staff always have an official badge visible in chat.',
  },
  {
    num: '09',
    title: 'Follow Room-Specific Rules',
    color: '#00897b',
    body: 'Each chat room may have additional rules set by the Room Owner or Admin. These rules are displayed in the room description. Users are expected to read and follow room rules in addition to these global platform rules. Failure to follow room rules may result in removal from that room.',
  },
  {
    num: '10',
    title: 'Respect Moderation Decisions',
    color: '#5c6bc0',
    body: 'If a Moderator or Admin takes action against you (warning, mute, kick, or ban), do not argue or attempt to evade the action by creating new accounts. If you believe an action was unjust, use the official appeal process. Creating multiple accounts to evade a ban will result in all accounts being permanently banned.',
  },
]

export default function ChatRules() {
  return (
    <PageLayout seo={{
      title: "Chat Rules — Community Guidelines | ChatsGenZ",
      description: "Read the official ChatsGenZ chat rules and community guidelines. All users must follow these rules to maintain a safe, respectful, and enjoyable chat environment for everyone.",
      keywords: "chatsgenz rules, chat guidelines, community rules, safe chat rules, chatsgenz terms of use",
      canonical: "/chat-rules",
    }}>
      <div className="page-container">
        <h1 className="page-title">Chat Rules</h1>
        <p className="page-subtitle">These rules apply to all users across every chat room on ChatsGenZ. Please read them carefully.</p>

        <div style={{ background: '#fef3e2', border: '1px solid #f9ab00', borderRadius: 12, padding: '14px 18px', marginBottom: 36, fontSize: '0.875rem', color: '#7a4500', lineHeight: 1.65 }}>
          <strong>Important:</strong> Violating these rules may result in a warning, temporary mute, temporary ban, or a permanent ban depending on the severity of the violation. ChatsGenZ staff have final authority on all moderation decisions. By using this platform you agree to abide by these rules.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {RULES.map(rule => (
            <div key={rule.num} style={{
              background: '#fff', borderRadius: 14,
              border: '1.5px solid #e8eaed',
              borderLeft: `5px solid ${rule.color}`,
              padding: '22px 22px 22px 20px',
              display: 'flex', gap: 18, alignItems: 'flex-start',
              boxShadow: '0 1px 4px rgba(60,64,67,0.07)',
            }}>
              <div style={{
                minWidth: 40, height: 40, borderRadius: 10,
                background: `${rule.color}12`, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 900, color: rule.color,
                fontFamily: "'Outfit', sans-serif", flexShrink: 0,
              }}>
                {rule.num}
              </div>
              <div>
                <h3 style={{ fontSize: '0.975rem', fontWeight: 800, color: '#202124', marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
                  {rule.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#5f6368', lineHeight: 1.7 }}>
                  {rule.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, background: '#e8f0fe', border: '1px solid #c5d8fd', borderRadius: 12, padding: '20px 22px' }}>
          <h3 style={{ fontWeight: 800, color: '#1a56c4', marginBottom: 10, fontFamily: "'Outfit', sans-serif" }}>
            Questions About These Rules?
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#1a56c4', lineHeight: 1.65 }}>
            If you have questions about what is or is not allowed, or you want to report a violation, reach out to our moderation team via the Contact page or use the in-app report button. We review all reports seriously.
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
