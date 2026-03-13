import PageLayout from '../../components/PageLayout.jsx'

const PLATFORM_STAFF = [
  {
    key: 'moderator', label: 'Moderator', color: '#00AAFF', level: 11,
    desc: 'Front-line platform moderators. They monitor chat rooms, enforce platform rules, and handle user reports.',
    perms: ['Mute users platform-wide','Kick users from any room','Issue temporary bans (up to 7 days)','Review and action user reports','Access moderation dashboard'],
  },
  {
    key: 'admin', label: 'Admin', color: '#FF4444', level: 12,
    desc: 'Senior staff with elevated privileges. Manage serious violations, permanent bans, and staff coordination.',
    perms: ['All Moderator permissions','Issue permanent bans','Manage Moderator accounts','Resolve escalated reports','Access full admin panel'],
  },
  {
    key: 'superadmin', label: 'Superadmin', color: '#FF00FF', level: 13,
    desc: 'Platform-level administrators with near-full system access. Responsible for platform-wide configuration.',
    perms: ['All Admin permissions','Manage Admin accounts','Platform settings configuration','Override any moderation decision','Access financial and user data reports'],
  },
  {
    key: 'owner', label: 'Owner', color: '#FFD700', level: 14,
    desc: 'Platform founders with absolute authority. Responsible for all final decisions across the platform.',
    perms: ['Full platform control','All system permissions','Final authority on all decisions','Configure platform infrastructure','Cannot be overridden by any other role'],
  },
]

const ROOM_STAFF = [
  {
    role: 'Room Moderator', level: 4, color: '#00bb88',
    desc: 'Appointed by Room Owners or Admins. Keeps individual rooms safe and on-topic.',
    perms: ['Mute users in their room','Kick users from their room','Delete messages in their room','Manage cam sessions'],
  },
  {
    role: 'Room Admin', level: 5, color: '#ff8800',
    desc: 'Senior room staff with extended room management powers.',
    perms: ['All Room Moderator permissions','Ban users from their room','Appoint Room Moderators','Manage room announcements'],
  },
  {
    role: 'Room Owner', level: 6, color: '#FFD700',
    desc: 'The creator or assigned owner of a chat room. Full authority within their room.',
    perms: ['All Room Admin permissions','Award VIP, Butterfly, Ninja, Fairy, Legend ranks','Set room rules and entrance requirements','Transfer room ownership','Set room as private or restricted'],
  },
]

export default function Moderation() {
  return (
    <PageLayout seo={{
      title: 'Moderation — ChatsGenZ Staff Roles and Permissions',
      description: 'Learn about ChatsGenZ moderation structure. Platform staff ranks, room staff roles, and the complete permissions system that keeps ChatsGenZ safe for everyone.',
      keywords: 'ChatsGenZ moderation, chat room moderator, ChatsGenZ staff, platform moderation, chat safety team, ChatsGenZ admin',
      canonical: '/moderation',
    }}>
      <div className="page-container" style={{ maxWidth: 960 }}>
        <h1 className="page-title">Moderation</h1>
        <p className="page-subtitle">ChatsGenZ has a structured two-tier moderation system — Platform Staff who manage the entire platform, and Room Staff who manage individual chat rooms.</p>

        {/* PLATFORM STAFF */}
        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#202124', marginBottom: 18, fontFamily: 'Outfit, sans-serif' }}>Platform Staff</h2>
        <div className="info-blue" style={{ marginBottom: 24 }}>
          Platform Staff have authority across the <strong>entire ChatsGenZ platform</strong>. Their decisions override room-level staff and they are accountable directly to ChatsGenZ management.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18, marginBottom: 48 }}>
          {PLATFORM_STAFF.map((s, i) => (
            <div key={i} style={{ background: '#fff', border: `1.5px solid ${s.color}30`, borderTop: `4px solid ${s.color}`, borderRadius: 14, padding: '20px 18px', boxShadow: '0 1px 4px rgba(60,64,67,.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <img src={`/icons/ranks/${s.key}.svg`} alt={s.label} style={{ width: 30, height: 30 }} onError={e => { e.target.style.display = 'none' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.975rem', color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#80868b' }}>Level {s.level} · Platform Staff</div>
                </div>
              </div>
              <p style={{ fontSize: '0.83rem', color: '#5f6368', lineHeight: 1.6, marginBottom: 12 }}>{s.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {s.perms.map((p, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: '0.82rem', color: '#3c4043' }}>
                    <i className="fi fi-sr-check" style={{ color: s.color, fontSize: 12, flexShrink: 0, marginTop: 2 }} /> {p}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ROOM STAFF */}
        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#202124', marginBottom: 18, fontFamily: 'Outfit, sans-serif' }}>Room Staff</h2>
        <div className="info-yellow" style={{ marginBottom: 24 }}>
          Room Staff have authority <strong>only within their assigned room</strong>. They are appointed by Room Owners and are responsible for day-to-day room management.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18, marginBottom: 44 }}>
          {ROOM_STAFF.map((s, i) => (
            <div key={i} style={{ background: '#fff', border: `1.5px solid ${s.color}30`, borderTop: `4px solid ${s.color}`, borderRadius: 14, padding: '20px 18px', boxShadow: '0 1px 4px rgba(60,64,67,.06)' }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: '0.975rem', color: s.color, fontFamily: 'Outfit, sans-serif', marginBottom: 2 }}>{s.role}</div>
                <div style={{ fontSize: '0.72rem', color: '#80868b' }}>Room Role Level {s.level}</div>
              </div>
              <p style={{ fontSize: '0.83rem', color: '#5f6368', lineHeight: 1.6, marginBottom: 12 }}>{s.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {s.perms.map((p, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: '0.82rem', color: '#3c4043' }}>
                    <i className="fi fi-sr-check" style={{ color: s.color, fontSize: 12, flexShrink: 0, marginTop: 2 }} /> {p}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* APPLY */}
        <div style={{ background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
          <h3 style={{ fontWeight: 800, color: '#202124', marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>Interested in Joining the Moderation Team?</h3>
          <p style={{ color: '#5f6368', fontSize: '0.9rem', marginBottom: 18 }}>We regularly look for experienced, trusted community members to join our moderation team. Contact us to apply.</p>
          <a href="/contact" className="btn-primary" style={{ textDecoration: 'none' }}>
            <i className="fi fi-sr-envelope" /> Apply via Contact Page
          </a>
        </div>
      </div>
    </PageLayout>
  )
}
