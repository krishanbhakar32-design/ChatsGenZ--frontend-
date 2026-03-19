import PageLayout from '../../components/PageLayout.jsx'

const ROOM_STAFF = [
  {
    key: 'mod', label: 'Room Moderator', color: '#00bb88', icon: 'moderator',
    desc: 'Room Moderators are appointed by Room Owners to help manage day-to-day activity inside a specific chat room. A Room Moderator is trusted to maintain a positive and safe atmosphere in the room. They are usually long-standing members who know the room rules well and are respected by other members.',
    perms: ['Mute disruptive users inside the room', 'Kick rule-breaking users from the room', 'Delete inappropriate messages', 'Manage webcam sessions in the room', 'Issue temporary room-level bans'],
  },
  {
    key: 'admin_room', label: 'Room Admin', color: '#ff8800', icon: 'admin',
    desc: 'Room Admins are senior room staff with extended control over the chat room. A Room Admin assists the Room Owner in managing the room and has the authority to make bigger decisions like banning users and appointing Room Moderators. Room Admins are highly trusted members of the room community.',
    perms: ['All Room Moderator permissions', 'Issue longer and permanent room bans', 'Appoint and remove Room Moderators', 'Manage room announcements and notices', 'Edit room settings with Owner approval'],
  },
  {
    key: 'owner_room', label: 'Room Owner', color: '#FFD700', icon: 'owner',
    desc: 'The Room Owner has absolute authority over their individual chat room. They are responsible for everything that happens inside the room — from setting rules to managing staff. Room Owners are also the only people who can award special member ranks like VIP Female, Butterfly, Fairy, VIP Male, Ninja, and Legend to deserving members in their room.',
    perms: ['Full control over the chat room', 'Appoint and remove Room Admins and Moderators', 'Award VIP, Butterfly, Fairy, Ninja, Legend ranks', 'Set room rules, restrictions, and entry requirements', 'Transfer room ownership to another user'],
  },
]

const PLATFORM_STAFF = [
  {
    key: 'moderator', label: 'Moderator', color: '#00AAFF', icon: 'moderator',
    desc: 'Platform Moderators are the front-line staff of ChatsGenZ. They monitor all chat rooms across the platform, handle user reports, enforce community rules, and ensure every room remains a safe and respectful place. Moderators are appointed by Admins or higher after a careful review of their activity and trustworthiness on the platform.',
    perms: ['Mute users across the entire platform', 'Kick users from any chat room', 'Issue temporary bans (up to 7 days)', 'Review and take action on user reports', 'Access the moderation dashboard', 'Monitor all rooms for rule violations'],
  },
  {
    key: 'admin', label: 'Admin', color: '#FF4444', icon: 'admin',
    desc: 'Admins are senior platform staff with significantly elevated authority. They handle escalated cases that Moderators cannot resolve, manage the Moderator team, and work closely with Superadmins to maintain the platform. Admins have access to the full Admin Panel and can take serious actions like issuing permanent bans. They are appointed by Superadmins or the Owner.',
    perms: ['All Moderator permissions', 'Issue permanent platform bans', 'Manage and appoint Moderators', 'Resolve escalated reports and appeals', 'Access full admin panel and user management', 'Review and remove harmful content across all rooms'],
  },
  {
    key: 'superadmin', label: 'Superadmin', color: '#FF00FF', icon: 'superadmin',
    desc: 'Superadmins are the highest level of platform staff on ChatsGenZ below the Owner. They have near-complete control over the platform and are responsible for managing the Admin team, configuring platform-wide settings, and making high-level moderation decisions. Superadmins are appointed exclusively by the Owner and are deeply trusted individuals within the ChatsGenZ organisation.',
    perms: ['All Admin permissions', 'Manage and appoint Admins', 'Configure platform-wide settings and features', 'Override any moderation decision', 'Access all reports, financial data, and user analytics', 'Manage platform announcements and updates'],
  },
]

function StaffCard({ r }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e8eaed', borderRadius:14, padding:'20px 18px', marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <img
          src={`/icons/ranks/${r.icon}.svg`}
          alt={r.label}
          style={{ width:34, height:34, objectFit:'contain', flexShrink:0 }}
          onError={e => { e.target.style.display='none' }}
        />
        <span style={{ fontWeight:800, fontSize:'1rem', color:r.color, fontFamily:'Outfit,sans-serif' }}>{r.label}</span>
      </div>
      <p style={{ fontSize:'0.875rem', color:'#3c4043', lineHeight:1.75, marginBottom:14 }}>{r.desc}</p>
      <div style={{ background:'#f8f9fa', borderRadius:9, padding:'12px 14px' }}>
        <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#5f6368', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>Permissions</div>
        <ul style={{ margin:0, padding:0, listStyle:'none' }}>
          {r.perms.map((p,i) => (
            <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:'0.84rem', color:'#3c4043', marginBottom:i<r.perms.length-1?6:0 }}>
              <span style={{ color:'#34a853', marginTop:2, flexShrink:0 }}>✓</span>{p}
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
      title: 'Moderation — ChatsGenZ Staff Roles and Platform Safety',
      description: 'ChatsGenZ moderation structure explained. Room Moderators, Room Admins, Room Owners, platform Moderators, Admins, and Superadmins — all roles and permissions described in detail.',
      keywords: 'ChatsGenZ moderation, ChatsGenZ moderator, ChatsGenZ admin, room moderator chatsgenz, platform staff chatsgenz, ChatsGenZ safety team, chat moderation',
      canonical: '/moderation',
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 18px 48px' }}>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.4rem,4vw,1.9rem)', color:'#202124', marginBottom:8 }}>Moderation</h1>
        <p style={{ color:'#5f6368', fontSize:'0.92rem', marginBottom:32, lineHeight:1.65 }}>
          ChatsGenZ takes safety and community management seriously. We have a two-tier moderation system — Room Staff who manage individual chat rooms, and Platform Staff who manage the entire ChatsGenZ platform. Every staff member is carefully selected and trusted.
        </p>

        {/* ROOM STAFF */}
        <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1rem', color:'#202124', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <span>🏠</span> Room Staff <span style={{ fontSize:'0.75rem', color:'#9aa0a6', fontWeight:600 }}>— manage individual rooms</span>
        </h2>
        {ROOM_STAFF.map(r => <StaffCard key={r.key} r={r} />)}

        {/* PLATFORM STAFF */}
        <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1rem', color:'#202124', marginBottom:14, marginTop:10, display:'flex', alignItems:'center', gap:8 }}>
          <span>🛡️</span> Platform Staff <span style={{ fontSize:'0.75rem', color:'#9aa0a6', fontWeight:600 }}>— manage the entire platform</span>
        </h2>
        {PLATFORM_STAFF.map(r => <StaffCard key={r.key} r={r} />)}

        <div style={{ background:'#f8f9fa', border:'1px solid #e8eaed', borderRadius:10, padding:'13px 16px', fontSize:'0.84rem', color:'#5f6368', lineHeight:1.6, marginTop:8 }}>
          Interested in joining our moderation team? Be an active and respectful member of ChatsGenZ and <a href="/contact" style={{ color:'#1a73e8', fontWeight:600 }}>contact us</a>. We look for people who are genuinely passionate about keeping the community safe and friendly.
        </div>
      </div>
    </PageLayout>
  )
}
