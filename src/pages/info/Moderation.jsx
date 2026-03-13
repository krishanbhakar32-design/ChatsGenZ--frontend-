import PageLayout from '../../components/PageLayout.jsx'

const PLATFORM_STAFF = [
  { key:'moderator',  label:'Moderator',  level:11, color:'#00AAFF',
    desc:'Front-line platform moderator. Monitors chat rooms, enforces rules, handles reports.',
    perms:['Mute users platform-wide','Kick users from any room','Issue temporary bans (up to 7 days)','Review and action user reports','Access moderation dashboard'] },
  { key:'admin',      label:'Admin',      level:12, color:'#FF4444',
    desc:'Senior staff with elevated privileges. Manages serious violations and staff.',
    perms:['All Moderator permissions','Issue permanent bans','Manage Moderator accounts','Resolve escalated reports','Access full admin panel'] },
  { key:'superadmin', label:'Superadmin', level:13, color:'#FF00FF',
    desc:'Platform-level administrator. Responsible for platform-wide configuration.',
    perms:['All Admin permissions','Manage Admin accounts','Platform-wide settings','Override any moderation decision','Access financial and user data reports'] },
  { key:'owner',      label:'Owner',      level:14, color:'#FFD700',
    desc:'Platform founder with absolute authority. Final decision on everything.',
    perms:['Full platform control','All system permissions','Final authority on all decisions','Configure platform infrastructure'] },
]

const ROOM_STAFF = [
  { role:'Room Moderator', level:4, color:'#00bb88',
    desc:'Appointed by Room Owners. Keeps individual rooms safe.',
    perms:['Mute users in their room','Kick users from their room','Delete messages in room','Manage cam sessions'] },
  { role:'Room Admin',     level:5, color:'#ff8800',
    desc:'Senior room staff with extended room management powers.',
    perms:['All Room Moderator permissions','Ban users from their room','Appoint Room Moderators','Manage room announcements'] },
  { role:'Room Owner',     level:6, color:'#FFD700',
    desc:'Creator or assigned owner of a chat room. Full authority in their room.',
    perms:['All Room Admin permissions','Award VIP/Butterfly/Ninja/Fairy/Legend ranks','Set room rules and requirements','Transfer room ownership'] },
]

export default function Moderation() {
  return (
    <PageLayout seo={{
      title: 'Moderation — ChatsGenZ Staff Roles and Permissions',
      description: 'ChatsGenZ moderation structure. Platform staff ranks from Moderator to Owner, room staff roles, and complete permissions system that keeps ChatsGenZ safe.',
      keywords: 'ChatsGenZ moderation, chat moderator, ChatsGenZ staff ranks, ChatsGenZ admin, room moderator, platform staff chatsgenz, chat safety team',
      canonical: '/moderation',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 48px' }}>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.5rem,4vw,2rem)', color:'#202124', marginBottom:8 }}>Moderation</h1>
        <p style={{ color:'#5f6368', fontSize:'0.95rem', marginBottom:32, lineHeight:1.6 }}>
          ChatsGenZ uses a two-tier moderation system — Platform Staff who manage the entire platform, and Room Staff who manage individual chat rooms.
        </p>

        {/* PLATFORM STAFF */}
        <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#202124', marginBottom:14 }}>Platform Staff</h2>
        <div style={{ background:'#fff', border:'1px solid #e8eaed', borderRadius:12, overflow:'hidden', marginBottom:36 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
            <thead>
              <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #e8eaed' }}>
                <th style={{ padding:'11px 16px', textAlign:'left', fontWeight:700, color:'#202124' }}>Rank</th>
                <th style={{ padding:'11px 16px', textAlign:'center', fontWeight:700, color:'#202124', width:60 }}>Level</th>
                <th style={{ padding:'11px 16px', textAlign:'left', fontWeight:700, color:'#202124' }}>Description</th>
                <th style={{ padding:'11px 16px', textAlign:'left', fontWeight:700, color:'#202124' }}>Key Permissions</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORM_STAFF.map((s,i) => (
                <tr key={s.key} style={{ borderBottom:'1px solid #f1f3f4', background:i%2===0?'#fff':'#fafafa', verticalAlign:'top' }}>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <img src={`/icons/ranks/${s.key}.svg`} alt={s.label} style={{ width:24, height:24 }}
                        onError={e => { e.target.style.display='none' }} />
                      <span style={{ fontWeight:700, color:s.color }}>{s.label}</span>
                    </div>
                  </td>
                  <td style={{ padding:'13px 16px', textAlign:'center', fontWeight:700, color:'#202124' }}>{s.level}</td>
                  <td style={{ padding:'13px 16px', color:'#5f6368', lineHeight:1.55, maxWidth:200 }}>{s.desc}</td>
                  <td style={{ padding:'13px 16px' }}>
                    <ul style={{ margin:0, padding:'0 0 0 16px', color:'#5f6368', lineHeight:1.8 }}>
                      {s.perms.map((p,j) => <li key={j} style={{ fontSize:'0.82rem' }}>{p}</li>)}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ROOM STAFF */}
        <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#202124', marginBottom:14 }}>Room Staff</h2>
        <p style={{ fontSize:'0.875rem', color:'#5f6368', marginBottom:14, lineHeight:1.6 }}>Room Staff have authority only within their assigned room. They are appointed by Room Owners.</p>
        <div style={{ background:'#fff', border:'1px solid #e8eaed', borderRadius:12, overflow:'hidden', marginBottom:28 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
            <thead>
              <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #e8eaed' }}>
                <th style={{ padding:'11px 16px', textAlign:'left', fontWeight:700, color:'#202124' }}>Role</th>
                <th style={{ padding:'11px 16px', textAlign:'center', fontWeight:700, color:'#202124', width:60 }}>Level</th>
                <th style={{ padding:'11px 16px', textAlign:'left', fontWeight:700, color:'#202124' }}>Description</th>
                <th style={{ padding:'11px 16px', textAlign:'left', fontWeight:700, color:'#202124' }}>Key Permissions</th>
              </tr>
            </thead>
            <tbody>
              {ROOM_STAFF.map((s,i) => (
                <tr key={s.role} style={{ borderBottom:'1px solid #f1f3f4', background:i%2===0?'#fff':'#fafafa', verticalAlign:'top' }}>
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ fontWeight:700, color:s.color }}>{s.role}</span>
                  </td>
                  <td style={{ padding:'13px 16px', textAlign:'center', fontWeight:700, color:'#202124' }}>{s.level}</td>
                  <td style={{ padding:'13px 16px', color:'#5f6368', lineHeight:1.55, maxWidth:200 }}>{s.desc}</td>
                  <td style={{ padding:'13px 16px' }}>
                    <ul style={{ margin:0, padding:'0 0 0 16px', color:'#5f6368', lineHeight:1.8 }}>
                      {s.perms.map((p,j) => <li key={j} style={{ fontSize:'0.82rem' }}>{p}</li>)}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background:'#f8f9fa', border:'1px solid #e8eaed', borderRadius:10, padding:'14px 18px', fontSize:'0.875rem', color:'#5f6368' }}>
          Interested in joining the moderation team? <a href="/contact" style={{ color:'#1a73e8', fontWeight:600 }}>Contact us</a> — we regularly look for active and trustworthy community members.
        </div>
      </div>
    </PageLayout>
  )
}
