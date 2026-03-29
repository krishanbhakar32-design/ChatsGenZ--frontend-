import PageLayout from '../../components/PageLayout.jsx'

// Only these ranks shown - as per requirement
// Female ranks: vipfemale, butterfly, fairy
// Male ranks: vipmale, ninja, legend
// Paid rank: premium
const FEMALE_RANKS = [
  {
    key: 'vipfemale', label: 'VIP Female', color: '#FF4488', ext: 'svg',
    desc: 'VIP Female is an exclusive rank for verified female members of ChatsGenZ. To earn this rank, a female member must be an active part of the community and get verified by a Room Owner. Once verified, the Room Owner awards this rank which gives the member a special pink badge, priority cam slots in chat rooms, and a distinctive colour for their username in chat. This is a completely free rank — it is earned through community presence and verification.',
  },
  {
    key: 'butterfly', label: 'Butterfly', color: '#FF66AA', ext: 'svg',
    desc: 'Butterfly is a special female rank on ChatsGenZ awarded to active, helpful, and friendly female members. If you are a regular contributor in chat rooms, always positive, and a good presence in the community, a Room Owner may award you the Butterfly rank. Butterfly members get a unique badge, extended cam time, and a special coloured username in all chat rooms. This rank is free and given purely based on your activity and personality.',
  },
  {
    key: 'fairy', label: 'Fairy', color: '#FF88CC', ext: 'svg',
    desc: 'Fairy is a prestigious female rank on ChatsGenZ given to truly outstanding female members who have made a positive impact in the community. Fairy rank holders are known for being kind, active, and genuinely loved by other members. A Room Owner awards this rank to members who go above and beyond in making chat rooms a better place. Fairy members enjoy a beautiful exclusive badge, a special entrance effect, and a coloured chat name.',
  },
]

const MALE_RANKS = [
  {
    key: 'vipmale', label: 'VIP Male', color: '#4488FF', ext: 'svg',
    desc: 'VIP Male is an exclusive rank for verified male members of ChatsGenZ. Similar to VIP Female, this rank is awarded by Room Owners to active and verified male members. VIP Male members receive a special blue badge, priority cam slots, and a distinctive colour for their username in chat rooms. This is a completely free rank earned through consistent presence and verification by a Room Owner who recognises your contribution to the community.',
  },
  {
    key: 'ninja', label: 'Ninja', color: '#555555', ext: 'svg',
    desc: 'Ninja is a rank awarded to loyal, trusted, and long-standing male members of ChatsGenZ. If you have been a dependable and respected figure in the chat community, a Room Owner may recognise your loyalty by granting you the Ninja rank. Ninja members get a unique dark badge, extended message length, and a coloured chat name. This rank is free and reflects the trust and loyalty you have built within the ChatsGenZ community over time.',
  },
  {
    key: 'legend', label: 'Legend', color: '#FF8800', ext: 'png',
    desc: 'Legend is the highest free rank a male member can achieve on ChatsGenZ. It is an extremely prestigious rank awarded only to the most elite and respected male members by a Room Owner. Becoming a Legend means you are one of the most valued members of the entire platform. Legend members enjoy maximum cam priority, a gold chat name colour, a special entrance effect when entering rooms, and the exclusive Legend badge that is recognised and respected across all of ChatsGenZ.',
  },
]

const PREMIUM = {
  key: 'premium', label: 'Premium', color: '#aa44ff', ext: 'svg',
  desc: 'Premium is the only paid rank on ChatsGenZ. By upgrading to Premium, you unlock a range of exclusive features that are not available to free members. Premium members enjoy an exclusive purple badge, access to Premium-only chat rooms, special cosmetic effects, extended cam time, priority support, the ability to customise their profile further, and more features that are regularly added. Premium is not required to enjoy ChatsGenZ — the platform is free forever — but it enhances your experience significantly for those who choose to upgrade.',
}

function RankCard({ r, femaleLabel }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e8eaed', borderRadius: 14,
      padding: '20px 18px', marginBottom: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <img
          src={`/icons/ranks/${r.key}.${r.ext}`}
          alt={r.label}
          style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
          onError={e => { e.target.style.display = 'none' }}
        />
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: r.color, fontFamily: 'Outfit,sans-serif' }}>{r.label}</div>
          {femaleLabel && <div style={{ fontSize: '0.72rem', color: '#ea4335', fontWeight: 600, marginTop: 1 }}>Female Rank · Free</div>}
        </div>
      </div>
      <p style={{ fontSize: '0.875rem', color: '#5f6368', lineHeight: 1.75, margin: 0 }}>{r.desc}</p>
    </div>
  )
}

export default function Ranks() {
  return (
    <PageLayout seo={{
      title: 'Ranks — ChatsGenZ Rank System Guide',
      description: 'Learn about all ChatsGenZ ranks — VIP Female, Butterfly, Fairy, VIP Male, Ninja, Legend, and Premium. Free and paid ranks explained with details on how to earn them on ChatsGenZ.',
      keywords: 'ChatsGenZ ranks, VIP Female rank, Butterfly rank, Fairy rank, VIP Male rank, Ninja rank, Legend rank, Premium rank ChatsGenZ, how to get rank chatsgenz',
      canonical: '/ranks',
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 18px 48px' }}>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.4rem,4vw,1.9rem)', color:'#202124', marginBottom:8 }}>Ranks on ChatsGenZ</h1>
        <p style={{ color:'#5f6368', fontSize:'0.92rem', marginBottom:32, lineHeight:1.65 }}>
          ChatsGenZ has a unique rank system to recognise active and valued community members. Ranks are awarded by Room Owners — they are a mark of respect, not just a badge. Below are all available ranks and how to earn them.
        </p>

        {/* FEMALE RANKS */}
        <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1rem', color:'#ea4335', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:'1.1rem' }}>👑</span> Female Ranks <span style={{ fontSize:'0.75rem', fontWeight:600, color:'#9aa0a6', marginLeft:4 }}>Free — Awarded by Room Owner</span>
        </h2>
        {FEMALE_RANKS.map(r => <RankCard key={r.key} r={r} femaleLabel />)}

        {/* MALE RANKS */}
        <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1rem', color:'#1a73e8', marginBottom:14, marginTop:8, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:'1.1rem' }}>⚡</span> Male Ranks <span style={{ fontSize:'0.75rem', fontWeight:600, color:'#9aa0a6', marginLeft:4 }}>Free — Awarded by Room Owner</span>
        </h2>
        {MALE_RANKS.map(r => <RankCard key={r.key} r={r} />)}

        {/* PREMIUM */}
        <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1rem', color:'#aa44ff', marginBottom:14, marginTop:8, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:'1.1rem' }}>💎</span> Premium Rank <span style={{ fontSize:'0.75rem', fontWeight:600, color:'#9aa0a6', marginLeft:4 }}>Paid Rank</span>
        </h2>
        <RankCard r={PREMIUM} />

        <div style={{ background:'#f8f9fa', border:'1px solid #e8eaed', borderRadius:10, padding:'13px 16px', fontSize:'0.84rem', color:'#5f6368', lineHeight:1.6 }}>
          <strong style={{ color:'#202124' }}>Note:</strong> All free ranks (VIP Female, Butterfly, Fairy, VIP Male, Ninja, Legend) are awarded solely at the discretion of Room Owners. ChatsGenZ staff do not directly award these ranks. To earn a rank, be active, respectful, and a positive presence in your chat room.
        </div>
      </div>
    </PageLayout>
  )
}
