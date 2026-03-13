import PageLayout from '../../components/PageLayout.jsx'

const FREE_RANKS = [
  { key: 'guest',     label: 'Guest',      level: 1,  color: '#888888', how: 'Default rank for all visitors — no registration needed',    perks: ['Access to public chat rooms','Basic messaging','View user profiles'] },
  { key: 'user',      label: 'User',       level: 2,  color: '#aaaaaa', how: 'Automatically awarded on free account registration',          perks: ['Friends list','Profile customisation','Private messaging','Daily bonus'] },
  { key: 'vipfemale', label: 'VIP Female', level: 3,  color: '#FF4488', how: 'Awarded by Room Owners to verified female users',             perks: ['VIP Female badge','Priority cam slots','Special colour in chat'] },
  { key: 'vipmale',   label: 'VIP Male',   level: 4,  color: '#4488FF', how: 'Awarded by Room Owners to verified male users',               perks: ['VIP Male badge','Priority cam slots','Special colour in chat'] },
  { key: 'butterfly', label: 'Butterfly',  level: 5,  color: '#FF66AA', how: 'Selected and awarded by Room Owners for active contributors', perks: ['Butterfly badge','Extended cam time','Colour chat name'] },
  { key: 'ninja',     label: 'Ninja',      level: 6,  color: '#555555', how: 'Selected and awarded by Room Owners for loyal members',       perks: ['Ninja badge','Extended message length','Colour chat name'] },
  { key: 'fairy',     label: 'Fairy',      level: 7,  color: '#FF88CC', how: 'Selected and awarded by Room Owners for outstanding members', perks: ['Fairy badge','Special entrance effect','Colour chat name'] },
  { key: 'legend',    label: 'Legend',     level: 8,  color: '#FF8800', how: 'Highest free rank — awarded by Room Owners to elite members', perks: ['Legend badge','Maximum cam priority','Gold chat name colour','Legend entrance effect'] },
]

const STAFF_RANKS = [
  { key: 'moderator',  label: 'Moderator',  level: 11, color: '#00AAFF', how: 'Appointed by Admin or above', perks: ['Mute and kick users globally','Monitor chat room content','Issue temporary bans','Access moderation tools'] },
  { key: 'admin',      label: 'Admin',      level: 12, color: '#FF4444', how: 'Appointed by Superadmin or Owner', perks: ['All Moderator permissions','Permanent ban authority','Manage platform reports','Access admin panel'] },
  { key: 'superadmin', label: 'Superadmin', level: 13, color: '#FF00FF', how: 'Appointed by Owner only', perks: ['All Admin permissions','Manage admin accounts','Platform-wide configuration','Override moderation decisions'] },
  { key: 'owner',      label: 'Owner',      level: 14, color: '#FFD700', how: 'Platform founders only — cannot be granted', perks: ['Full platform control','All permissions across the platform','Configure all platform systems','Final moderation authority'] },
]

const XP_ACTIONS = [
  { action: 'Send a message',          xp: '+1 XP' },
  { action: 'Daily login bonus',       xp: '+10 XP' },
  { action: 'Quiz Room — Easy',        xp: '+10 XP' },
  { action: 'Quiz Room — Medium',      xp: '+20 XP' },
  { action: 'Quiz Room — Hard',        xp: '+40 XP' },
  { action: 'Dice or Spin Wheel win',  xp: '+5 XP' },
  { action: 'Dice or Spin Wheel loss', xp: '+1 XP' },
]

function RankCard({ r, staff }) {
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${r.color}30`, borderTop: `4px solid ${r.color}`, borderRadius: 14, padding: '20px 18px', boxShadow: '0 1px 4px rgba(60,64,67,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <img src={`/icons/ranks/${r.key}.svg`} alt={r.label} style={{ width: 32, height: 32 }} onError={e => { e.target.style.display = 'none' }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: r.color, fontFamily: 'Outfit, sans-serif' }}>{r.label}</div>
          <div style={{ fontSize: '0.75rem', color: '#80868b' }}>Level {r.level} {staff ? '· Staff' : '· Free'}</div>
        </div>
      </div>
      <p style={{ fontSize: '0.82rem', color: '#5f6368', marginBottom: 10, lineHeight: 1.55, fontStyle: 'italic' }}>{r.how}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {r.perks.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.82rem', color: '#3c4043' }}>
            <span style={{ color: r.color, fontSize: 10 }}>●</span> {p}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Ranks() {
  return (
    <PageLayout seo={{
      title: 'Ranks — ChatsGenZ Rank System and XP Guide',
      description: 'Complete guide to all ChatsGenZ ranks. Learn about free ranks from Guest to Legend, the Premium rank, staff ranks, the XP system, and gold coin rewards on ChatsGenZ.',
      keywords: 'ChatsGenZ ranks, ChatsGenZ XP system, chat ranks guide, ChatsGenZ legend rank, ChatsGenZ gold coins, free chat ranks',
      canonical: '/ranks',
    }}>
      <div className="page-container" style={{ maxWidth: 1000 }}>
        <h1 className="page-title">Rank System</h1>
        <p className="page-subtitle">ChatsGenZ has a full rank and XP progression system. Earn ranks by being active, earning gifts, and contributing to the community.</p>

        {/* PREMIUM */}
        <div style={{ background: 'linear-gradient(135deg,#1a0a2e,#2d1458)', border: '2px solid #aa44ff', borderRadius: 16, padding: '24px 24px', marginBottom: 40, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <img src="/icons/ranks/premium.svg" alt="Premium" style={{ width: 56, height: 56 }} onError={e => { e.target.style.display = 'none' }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 900, fontSize: '1.3rem', color: '#aa44ff', fontFamily: 'Outfit, sans-serif' }}>Premium</span>
              <span style={{ background: '#aa44ff', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>PAID</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: 12 }}>
              The only paid rank on ChatsGenZ. Unlock exclusive features, cosmetics, and priority access across the platform.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Purple name colour','Premium badge','Priority cam slot','Exclusive rooms','Extended message length','Custom status'].map((p, i) => (
                <span key={i} style={{ background: 'rgba(170,68,255,.2)', border: '1px solid rgba(170,68,255,.4)', color: '#cc88ff', fontSize: '0.78rem', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* FREE RANKS */}
        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#202124', marginBottom: 18, fontFamily: 'Outfit, sans-serif' }}>Free Ranks — Guest to Legend</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 48 }}>
          {FREE_RANKS.map(r => <RankCard key={r.key} r={r} />)}
        </div>

        {/* XP TABLE */}
        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 16, padding: '24px', marginBottom: 48 }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#202124', marginBottom: 18, fontFamily: 'Outfit, sans-serif' }}>
            <i className="fi fi-sr-star" style={{ color: '#fbbc04', marginRight: 8 }} />
            XP and Gold Coin System
          </h2>
          <div className="info-blue" style={{ marginBottom: 18 }}>
            Every <strong>100 XP = 1 Level</strong>. Each level-up rewards you with <strong>Level × 20 Gold Coins</strong>. For example, reaching Level 5 gives you 100 gold coins.
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '11px 14px', textAlign: 'left', border: '1px solid #e8eaed', fontWeight: 700, color: '#202124' }}>Action</th>
                  <th style={{ padding: '11px 14px', textAlign: 'center', border: '1px solid #e8eaed', fontWeight: 700, color: '#fbbc04' }}>XP Earned</th>
                </tr>
              </thead>
              <tbody>
                {XP_ACTIONS.map((a, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 14px', border: '1px solid #e8eaed', color: '#3c4043' }}>{a.action}</td>
                    <td style={{ padding: '10px 14px', border: '1px solid #e8eaed', textAlign: 'center', fontWeight: 700, color: '#1a73e8' }}>{a.xp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* STAFF RANKS */}
        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#202124', marginBottom: 18, fontFamily: 'Outfit, sans-serif' }}>Platform Staff Ranks</h2>
        <div className="info-yellow" style={{ marginBottom: 20 }}>
          Staff ranks are <strong>appointed only</strong> — they cannot be earned through XP. Apply to become a moderator via our Contact page.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {STAFF_RANKS.map(r => <RankCard key={r.key} r={r} staff />)}
        </div>
      </div>
    </PageLayout>
  )
}
