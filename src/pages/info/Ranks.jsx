import PageLayout from '../../components/PageLayout.jsx'

const FREE_RANKS = [
  {
    key: 'guest',
    label: 'Guest',
    color: '#888888',
    icon: '/icons/ranks/guest.svg',
    level: 1,
    type: 'free',
    how: 'Default rank for unregistered users',
    perks: ['Access to public chat rooms', 'Can send text messages', 'Limited features'],
  },
  {
    key: 'user',
    label: 'User',
    color: '#CCCCCC',
    icon: '/icons/ranks/user.svg',
    level: 2,
    type: 'free',
    how: 'Register an account',
    perks: ['Full messaging features', 'Send gifts', 'Earn XP and gold', 'Profile customization'],
  },
  {
    key: 'vipfemale',
    label: 'VIP Female',
    color: '#FF4488',
    icon: '/icons/ranks/vipfemale.svg',
    level: 3,
    type: 'free',
    how: 'Awarded by site owners to verified female users',
    perks: ['VIP badge displayed in chat', 'Access to VIP Female rooms', 'Special name color', 'Priority in user lists'],
  },
  {
    key: 'vipmale',
    label: 'VIP Male',
    color: '#4488FF',
    icon: '/icons/ranks/vipmale.svg',
    level: 4,
    type: 'free',
    how: 'Awarded by site owners to verified male users',
    perks: ['VIP badge displayed in chat', 'Access to VIP Male rooms', 'Special name color', 'Priority in user lists'],
  },
  {
    key: 'butterfly',
    label: 'Butterfly',
    color: '#FF66AA',
    icon: '/icons/ranks/butterfly.svg',
    level: 5,
    type: 'free',
    how: 'Selected and awarded by site owners based on activity and community contribution',
    perks: ['Exclusive Butterfly badge', 'Access to special rooms', 'Unique name styling', 'Recognized community member'],
  },
  {
    key: 'ninja',
    label: 'Ninja',
    color: '#444444',
    icon: '/icons/ranks/ninja.svg',
    level: 6,
    type: 'free',
    how: 'Selected and awarded by site owners based on loyalty and platform use',
    perks: ['Exclusive Ninja badge', 'Access to Ninja rooms', 'Special dark name style', 'Elite community status'],
  },
  {
    key: 'fairy',
    label: 'Fairy',
    color: '#FF88CC',
    icon: '/icons/ranks/fairy.svg',
    level: 7,
    type: 'free',
    how: 'Selected and awarded by site owners to active and positive community members',
    perks: ['Exclusive Fairy badge', 'Access to Fairy rooms', 'Pink glowing name', 'High community recognition'],
  },
  {
    key: 'legend',
    label: 'Legend',
    color: '#FF8800',
    icon: '/icons/ranks/legend.png',
    level: 8,
    type: 'free',
    how: 'Selected and awarded by site owners to the most respected long-term community members',
    perks: ['Exclusive Legend badge', 'Access to all Legend rooms', 'Golden name color', 'Highest earnable community rank'],
  },
]

const PAID_RANKS = [
  {
    key: 'premium',
    label: 'Premium',
    color: '#AA44FF',
    icon: '/icons/ranks/premium.svg',
    level: 10,
    type: 'paid',
    how: 'Purchase a Premium subscription from the store',
    perks: ['Purple Premium badge', 'Access to all Premium rooms', 'Exclusive premium emoticons', 'Priority support', 'Extra gold rewards', 'Premium profile frame', 'Send Ruby gifts'],
  },
]

function RankCard({ rank }) {
  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${rank.color}22`,
      borderLeft: `4px solid ${rank.color}`,
      borderRadius: 14,
      padding: '24px 20px',
      display: 'flex',
      gap: 18,
      alignItems: 'flex-start',
      boxShadow: '0 1px 6px rgba(60,64,67,0.07)',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 20px ${rank.color}22`; e.currentTarget.style.transform = 'translateY(-1px)' }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(60,64,67,0.07)'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 12, flexShrink: 0,
        background: `${rank.color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${rank.color}33`,
      }}>
        <img src={rank.icon} alt={rank.label} style={{ width: 30, height: 30 }} onError={e => { e.target.style.display = 'none' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: rank.color, fontFamily: "'Outfit', sans-serif" }}>
            {rank.label}
          </span>
          <span style={{ fontSize: '0.72rem', background: `${rank.color}15`, color: rank.color, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
            Level {rank.level}
          </span>
          {rank.type === 'paid' && (
            <span style={{ fontSize: '0.72rem', background: '#AA44FF15', color: '#AA44FF', padding: '2px 8px', borderRadius: 10, fontWeight: 700, border: '1px solid #AA44FF33' }}>
              PAID
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.82rem', color: '#5f6368', marginBottom: 10, lineHeight: 1.5 }}>
          <strong style={{ color: '#3c4043' }}>How to get it:</strong> {rank.how}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {rank.perks.map((p, i) => (
            <span key={i} style={{
              fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20,
              background: '#f1f3f4', color: '#3c4043', fontWeight: 500,
            }}>{p}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Ranks() {
  return (
    <PageLayout seo={{
      title: "Ranks and Levels — ChatsGenZ Chat Platform",
      description: "Learn about all chat ranks on ChatsGenZ. From Guest to Legend, discover free ranks, the Premium paid rank, and staff ranks. See how to earn and unlock each rank.",
      keywords: "chatsgenz ranks, chat levels, vip rank chat, legend rank, premium rank, chat platform ranks, chatsgenz levels",
      canonical: "/ranks",
    }}>
      <div className="page-container">
        <h1 className="page-title">Ranks and Levels</h1>
        <p className="page-subtitle">Your journey from Guest to Legend — every rank, explained.</p>

        {/* Info banner */}
        <div style={{ background: '#e8f0fe', border: '1px solid #c5d8fd', borderRadius: 12, padding: '16px 20px', marginBottom: 36, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
          <div style={{ fontSize: '0.875rem', color: '#1a56c4', lineHeight: 1.6 }}>
            <strong>Free Ranks</strong> (Guest through Legend) are either default or awarded by site owners. The criteria for VIP, Butterfly, Ninja, Fairy and Legend ranks are reviewed and selected by the platform owners — keep chatting, stay active, and be a positive community member. <strong>Premium</strong> is the only paid rank and can be purchased from the store.
          </div>
        </div>

        {/* Free Ranks */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#202124', marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>
          Free Ranks
        </h2>
        <p style={{ color: '#5f6368', fontSize: '0.875rem', marginBottom: 20 }}>These ranks are completely free. No purchase required.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 48 }}>
          {FREE_RANKS.map(r => <RankCard key={r.key} rank={r} />)}
        </div>

        {/* Bot rank note */}
        <div style={{ background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 12, padding: '16px 20px', marginBottom: 48, fontSize: '0.875rem', color: '#5f6368' }}>
          <strong style={{ color: '#202124' }}>Bot Rank:</strong> Assigned to automated chat bots operated by the platform. Users cannot obtain this rank.
        </div>

        {/* Paid Rank */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#202124', marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>
          Paid Rank
        </h2>
        <p style={{ color: '#5f6368', fontSize: '0.875rem', marginBottom: 20 }}>Unlock exclusive features with a Premium subscription.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 48 }}>
          {PAID_RANKS.map(r => <RankCard key={r.key} rank={r} />)}
        </div>

        {/* XP Info */}
        <div style={{ background: 'linear-gradient(135deg, #f0f7ff, #e8f0fe)', border: '1px solid #c5d8fd', borderRadius: 14, padding: '24px' }}>
          <h3 style={{ fontWeight: 800, color: '#1a56c4', marginBottom: 14, fontFamily: "'Outfit', sans-serif" }}>
            XP and Gold System
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, fontSize: '0.85rem', color: '#3c4043' }}>
            {[
              ['Send a message', '+1 XP'],
              ['Daily login bonus', '+10 XP'],
              ['Easy quiz correct', '+10 XP'],
              ['Medium quiz correct', '+20 XP'],
              ['Hard quiz correct', '+40 XP'],
              ['Dice / Spin game', '+1 to +8 XP'],
              ['Every 100 XP = 1 Level', 'Level reward = Level x 20 Gold'],
            ].map(([action, reward], i) => (
              <div key={i} style={{ background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid #dce8fc', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>{action}</span>
                <strong style={{ color: '#1a73e8', whiteSpace: 'nowrap' }}>{reward}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
