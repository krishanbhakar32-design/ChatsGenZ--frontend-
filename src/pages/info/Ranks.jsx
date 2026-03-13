import { Helmet } from 'react-helmet-async'
import PageLayout from '../../components/PageLayout.jsx'

const RANKS = [
  { key:'guest',      label:'Guest',      level:1,  color:'#888888', ext:'svg', type:'Free',   how:'Default rank for all visitors. No registration needed.' },
  { key:'user',       label:'User',       level:2,  color:'#aaaaaa', ext:'svg', type:'Free',   how:'Automatically given on free account registration.' },
  { key:'vipfemale',  label:'VIP Female', level:3,  color:'#FF4488', ext:'svg', type:'Free',   how:'Awarded by Room Owners to verified female members.' },
  { key:'vipmale',    label:'VIP Male',   level:4,  color:'#4488FF', ext:'svg', type:'Free',   how:'Awarded by Room Owners to verified male members.' },
  { key:'butterfly',  label:'Butterfly',  level:5,  color:'#FF66AA', ext:'svg', type:'Free',   how:'Awarded by Room Owners to active contributors.' },
  { key:'ninja',      label:'Ninja',      level:6,  color:'#777777', ext:'svg', type:'Free',   how:'Awarded by Room Owners to loyal trusted members.' },
  { key:'fairy',      label:'Fairy',      level:7,  color:'#FF88CC', ext:'svg', type:'Free',   how:'Awarded by Room Owners to outstanding members.' },
  { key:'legend',     label:'Legend',     level:8,  color:'#FF8800', ext:'png', type:'Free',   how:'Highest free rank. Awarded by Room Owners to elite members.' },
  { key:'bot',        label:'Bot',        level:9,  color:'#00cc88', ext:'svg', type:'System', how:'Reserved for official platform bots only.' },
  { key:'premium',    label:'Premium',    level:10, color:'#aa44ff', ext:'svg', type:'Paid',   how:'Paid rank unlocking exclusive features and cosmetics.' },
  { key:'moderator',  label:'Moderator',  level:11, color:'#00AAFF', ext:'svg', type:'Staff',  how:'Platform moderator. Appointed by Admin or above.' },
  { key:'admin',      label:'Admin',      level:12, color:'FF4444',  ext:'svg', type:'Staff',  how:'Senior staff. Appointed by Superadmin or Owner.' },
  { key:'superadmin', label:'Superadmin', level:13, color:'#FF00FF', ext:'svg', type:'Staff',  how:'Platform administrator. Appointed by Owner only.' },
  { key:'owner',      label:'Owner',      level:14, color:'#FFD700', ext:'svg', type:'Staff',  how:'Platform founder with full authority. Cannot be granted.' },
]

const XP = [
  ['Send a message',         '+1 XP'],
  ['Daily login bonus',      '+10 XP'],
  ['Quiz Room — Easy',       '+10 XP'],
  ['Quiz Room — Medium',     '+20 XP'],
  ['Quiz Room — Hard',       '+40 XP'],
  ['Dice / Spin Wheel win',  '+5 XP'],
  ['Dice / Spin Wheel loss', '+1 XP'],
]

const TYPE_STYLE = {
  Free:   { bg:'#e8f0fe', color:'#1557b0' },
  Paid:   { bg:'#f3e8ff', color:'#7b1fa2' },
  Staff:  { bg:'#fce8e6', color:'#c62828' },
  System: { bg:'#e6f4ea', color:'#2e7d32' },
}

export default function Ranks() {
  return (
    <PageLayout seo={{
      title: 'Ranks — ChatsGenZ Rank System and XP Guide',
      description: 'Complete guide to all ChatsGenZ ranks from Guest to Owner. XP system, gold coin rewards, free ranks, premium rank, and staff ranks explained on ChatsGenZ.',
      keywords: 'ChatsGenZ ranks, ChatsGenZ XP system, chat ranks, ChatsGenZ legend rank, ChatsGenZ premium rank, ChatsGenZ gold coins, rank guide, staff ranks chatsgenz',
      canonical: '/ranks',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 48px' }}>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.5rem,4vw,2rem)', color:'#202124', marginBottom:8 }}>Rank System</h1>
        <p style={{ color:'#5f6368', fontSize:'0.95rem', marginBottom:28, lineHeight:1.6 }}>
          ChatsGenZ has 14 ranks — from Guest all the way to Owner. Chat, play games, and send gifts to earn XP and level up.
        </p>

        {/* XP BOX */}
        <div style={{ background:'#f8f9fa', border:'1px solid #e8eaed', borderRadius:10, padding:'14px 18px', marginBottom:28 }}>
          <p style={{ margin:0, fontSize:'0.875rem', color:'#3c4043', lineHeight:1.8 }}>
            <strong>XP System:</strong> Every <strong>100 XP = 1 Level</strong>. Level-up reward = <strong>Level × 20 Gold Coins</strong>.
            &emsp;
            {XP.map(([a,x],i) => (
              <span key={i} style={{ marginRight:16, whiteSpace:'nowrap' }}>
                <span style={{ color:'#1a73e8', fontWeight:700 }}>{x}</span> — {a}
              </span>
            ))}
          </p>
        </div>

        {/* TABLE */}
        <div style={{ background:'#fff', border:'1px solid #e8eaed', borderRadius:12, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
              <thead>
                <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #e8eaed' }}>
                  <th style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, color:'#202124' }}>Rank</th>
                  <th style={{ padding:'12px 16px', textAlign:'center', fontWeight:700, color:'#202124', width:60 }}>Level</th>
                  <th style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, color:'#202124', width:80 }}>Type</th>
                  <th style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, color:'#202124' }}>How to Get</th>
                </tr>
              </thead>
              <tbody>
                {RANKS.map((r,i) => (
                  <tr key={r.key} style={{ borderBottom:'1px solid #f1f3f4', background: i%2===0?'#fff':'#fafafa' }}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <img
                          src={`/icons/ranks/${r.key}.${r.ext}`}
                          alt={r.label}
                          style={{ width:26, height:26, objectFit:'contain', flexShrink:0 }}
                          onError={e => { e.target.style.display='none' }}
                        />
                        <span style={{ fontWeight:700, color:r.color }}>{r.label}</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px', textAlign:'center', fontWeight:700, color:'#202124' }}>{r.level}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{
                        display:'inline-block', padding:'2px 9px', borderRadius:20,
                        fontSize:'0.75rem', fontWeight:700,
                        background: TYPE_STYLE[r.type].bg,
                        color: TYPE_STYLE[r.type].color,
                      }}>{r.type}</span>
                    </td>
                    <td style={{ padding:'12px 16px', color:'#5f6368', lineHeight:1.5 }}>{r.how}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ marginTop:16, fontSize:'0.82rem', color:'#80868b' }}>
          Room Staff roles (Room Moderator, Room Admin, Room Owner) are separate from platform ranks and are managed by each room's owner.
        </p>
      </div>
    </PageLayout>
  )
}
