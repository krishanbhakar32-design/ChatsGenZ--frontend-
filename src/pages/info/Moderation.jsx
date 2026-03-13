import PageLayout from '../../components/PageLayout.jsx'

const STAFF_ROLES = [
  {
    key: 'moderator',
    label: 'Moderator',
    color: '#00AAFF',
    icon: '/icons/ranks/moderator.svg',
    scope: 'Platform-wide',
    desc: 'Moderators are trusted community members appointed by the Admins. They are the first line of defence against rule-breaking, spam, and harmful behaviour across all public chat rooms.',
    powers: [
      'Mute users temporarily',
      'Kick users from rooms',
      'Delete inappropriate messages',
      'Issue warnings',
      'Monitor multiple rooms simultaneously',
      'Escalate serious violations to Admins',
    ],
    badge: 'MOD',
  },
  {
    key: 'admin',
    label: 'Admin',
    color: '#FF4444',
    icon: '/icons/ranks/admin.svg',
    scope: 'Platform-wide',
    desc: 'Admins have elevated authority over the entire platform. They manage moderators, handle ban appeals, oversee room management, and ensure the platform operates in line with community guidelines.',
    powers: [
      'All Moderator powers',
      'Permanently ban users',
      'Assign and remove Moderator rank',
      'Create and manage global announcements',
      'Configure room settings and permissions',
      'Review and resolve ban appeals',
      'Manage the gift and reward systems',
    ],
    badge: 'ADMIN',
  },
  {
    key: 'superadmin',
    label: 'Super Admin',
    color: '#FF00FF',
    icon: '/icons/ranks/superadmin.svg',
    scope: 'Platform-wide',
    desc: 'Super Admins are senior platform operators with near-complete control over the system. They oversee Admins, handle escalated issues, and manage critical platform decisions.',
    powers: [
      'All Admin powers',
      'Assign and remove Admin rank',
      'Access platform analytics and reports',
      'Manage user data and accounts',
      'Override any moderation decision',
      'Configure platform-level settings',
    ],
    badge: 'SUPER',
  },
]

const ROOM_ROLES = [
  {
    key: 'room_mod',
    label: 'Room Moderator',
    color: '#00AAFF',
    icon: '/icons/ranks/room_mod.svg',
    scope: 'Room-specific',
    desc: 'Appointed by the Room Owner or Room Admin. Manages day-to-day activity inside one specific room.',
    powers: ['Mute users in their room', 'Kick users from their room', 'Delete messages in their room', 'Enforce room-specific rules'],
  },
  {
    key: 'room_admin',
    label: 'Room Admin',
    color: '#FF4444',
    icon: '/icons/ranks/room_admin.svg',
    scope: 'Room-specific',
    desc: 'Senior staff within a specific room. Has more authority than a Room Moderator and can manage Room Moderators.',
    powers: ['All Room Moderator powers', 'Appoint and remove Room Moderators', 'Configure room-level settings', 'Pin announcements in the room'],
  },
  {
    key: 'room_owner',
    label: 'Room Owner',
    color: '#FFD700',
    icon: '/icons/ranks/room_owner.svg',
    scope: 'Room-specific',
    desc: 'The owner of a specific chat room. Has complete authority over that room including all staff appointments.',
    powers: ['All Room Admin powers', 'Appoint and remove Room Admins', 'Change room name, icon, and description', 'Set room access level (public, VIP, adult)', 'Delete the room'],
  },
]

function RoleCard({ role }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: `1.5px solid ${role.color}22`,
      borderLeft: `4px solid ${role.color}`,
      padding: '24px 22px',
      boxShadow: '0 1px 6px rgba(60,64,67,0.07)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: `${role.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${role.color}33`,
        }}>
          <img src={role.icon} alt={role.label} style={{ width: 26, height: 26 }} onError={e => { e.target.style.display = 'none' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: role.color, fontFamily: "'Outfit', sans-serif" }}>
              {role.label}
            </span>
            <span style={{ fontSize: '0.7rem', background: `${role.color}15`, color: role.color, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
              {role.scope}
            </span>
          </div>
        </div>
      </div>
      <p style={{ fontSize: '0.875rem', color: '#5f6368', lineHeight: 1.65, marginBottom: 16 }}>{role.desc}</p>
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3c4043', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Permissions</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {role.powers.map((p, i) => (
            <li key={i} style={{ fontSize: '0.85rem', color: '#3c4043', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: role.color, fontWeight: 700, flexShrink: 0 }}>+</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function Moderation() {
  return (
    <PageLayout seo={{
      title: "Moderation and Staff Roles — ChatsGenZ",
      description: "Learn how ChatsGenZ is moderated. Understand the roles of Moderators, Admins, Super Admins, and Room Staff. Safe, active, 24/7 moderated chat rooms worldwide.",
      keywords: "chatsgenz moderation, chat moderator, chat admin, room staff, safe chat platform, chat rules enforcement",
      canonical: "/moderation",
    }}>
      <div className="page-container">
        <h1 className="page-title">Moderation and Staff Roles</h1>
        <p className="page-subtitle">How we keep ChatsGenZ safe, friendly, and welcoming for everyone.</p>

        <div style={{ background: '#e8f0fe', border: '1px solid #c5d8fd', borderRadius: 12, padding: '16px 20px', marginBottom: 40, fontSize: '0.875rem', color: '#1a56c4', lineHeight: 1.65 }}>
          ChatsGenZ operates a multi-tier moderation system. Platform-level staff (Moderators, Admins, Super Admins) manage the entire platform, while Room-level staff manage individual chat rooms. Staff badges are always visible in chat so you can easily identify who to reach for help.
        </div>

        {/* Platform Staff */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#202124', marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>
          Platform Staff
        </h2>
        <p style={{ color: '#5f6368', fontSize: '0.875rem', marginBottom: 20 }}>
          These roles have authority across the entire platform. All appointments are made by site ownership.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 52 }}>
          {STAFF_ROLES.map(r => <RoleCard key={r.key} role={r} />)}
        </div>

        {/* Room Staff */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#202124', marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>
          Room-Level Staff
        </h2>
        <p style={{ color: '#5f6368', fontSize: '0.875rem', marginBottom: 20 }}>
          These roles are specific to individual chat rooms and are appointed by Room Owners or Admins.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 }}>
          {ROOM_ROLES.map(r => <RoleCard key={r.key} role={r} />)}
        </div>

        {/* Report section */}
        <div style={{ background: '#fef7e0', border: '1px solid #fdd663', borderRadius: 12, padding: '20px 22px' }}>
          <h3 style={{ fontWeight: 800, color: '#b06000', marginBottom: 10, fontFamily: "'Outfit', sans-serif" }}>
            Report a Problem
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#7a4500', lineHeight: 1.65 }}>
            If you witness rule-breaking behaviour, spam, harassment, or any content that violates our Chat Rules, please use the in-app report button or contact our team directly. All reports are reviewed by our moderation team. Do not try to handle violations yourself — always report to staff.
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
