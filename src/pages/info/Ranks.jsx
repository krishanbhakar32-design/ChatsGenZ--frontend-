import PageLayout from '../../components/PageLayout.jsx'
import { RANKS_LIST, ROOM_ROLES } from '../../constants.js'

export default function Ranks() {
  return (
    <PageLayout seo={{
      title: 'Ranks & Levels – ChatsGenZ Rank System Guide',
      description: 'ChatsGenZ complete rank guide. Learn all 14 ranks, how to level up, what perks each rank unlocks.',
      keywords: 'chatsgenz ranks, chat ranks guide, vip rank chat, premium rank chat, chatsgenz levels',
      canonical: '/ranks'
    }}>
      <div className="page-container">
        <h1 className="page-title">Ranks & Levels</h1>
        <p className="page-subtitle">14 site-wide ranks — earn them by levelling up, gifting, and contributing to the community</p>

        <div style={{ background: 'var(--primary-l)', border: '1px solid #b3d1fc', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: 'var(--primary-d)', margin: 0, fontFamily: 'var(--font-2)' }}>
            <strong>XP System:</strong> Every 100 XP = 1 Level Up → Reward = Level × 20 Gold.
            Earn XP: send messages (+1), daily bonus (+10), quiz easy/medium/hard (+10/20/40), dice/spin wins (+5–8).
            <strong> Staff ranks</strong> (Moderator, Admin, Superadmin, Owner) are assigned by management — not earned by XP.
          </p>
        </div>

        <h2 className="section-heading">Site-Wide Ranks</h2>
        <div style={{ overflowX: 'auto', marginBottom: 32 }}>
          <table className="ranks-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>DB Key (exact)</th>
                <th>Display Name</th>
                <th>Level</th>
                <th>Colour</th>
                <th>How to Get</th>
              </tr>
            </thead>
            <tbody>
              {RANKS_LIST.map(r => (
                <tr key={r.key}>
                  <td>
                    <img src={`/icons/ranks/${r.icon}`} width={24} height={24} alt={r.label}
                      onError={e => { e.target.style.display='none' }} style={{ display:'block' }} />
                  </td>
                  <td><code style={{ background:'var(--bg-3)', padding:'2px 6px', borderRadius:4, fontSize:12 }}>{r.key}</code></td>
                  <td><span style={{ fontWeight:700, color:r.color }}>{r.label}</span></td>
                  <td style={{ fontWeight:700 }}>{r.level}</td>
                  <td>
                    <span style={{ width:14, height:14, borderRadius:'50%', background:r.color, display:'inline-block', verticalAlign:'middle', marginRight:6 }} />
                    <code style={{ fontSize:11 }}>{r.color}</code>
                  </td>
                  <td style={{ fontSize:12, color:'var(--text-3)' }}>
                    {r.key==='owner'      && 'Platform owner — full control'}
                    {r.key==='superadmin' && 'Assigned by owner only'}
                    {r.key==='admin'      && 'Staff — assigned by superadmin/owner'}
                    {r.key==='moderator'  && 'Staff — assigned by admin+'}
                    {r.key==='premium'    && 'Assigned by admin or on purchase'}
                    {r.key==='bot'        && 'System bots — GenZBot, SuperBot'}
                    {r.key==='legend'     && 'Earned — high XP level'}
                    {r.key==='fairy'      && 'Earned — XP level'}
                    {r.key==='ninja'      && 'Earned — XP level'}
                    {r.key==='butterfly'  && 'Earned — XP level'}
                    {r.key==='vipmale'    && 'VIP Male — XP or gifted by admin'}
                    {r.key==='vipfemale'  && 'VIP Female — XP or gifted by admin'}
                    {r.key==='user'       && 'Default — all registered users'}
                    {r.key==='guest'      && 'No registration — temporary session'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="section-heading">Room Roles (per-room, not global)</h2>
        <p style={{ fontSize:14, color:'var(--text-2)', marginBottom:12, fontFamily:'var(--font-2)' }}>
          These are stored in the RoomStaff collection. They do NOT change the user's site-wide rank.
        </p>
        <div style={{ overflowX:'auto', marginBottom:24 }}>
          <table className="ranks-table">
            <thead>
              <tr><th>Icon</th><th>ID</th><th>Name</th><th>Icon File</th></tr>
            </thead>
            <tbody>
              {Object.entries(ROOM_ROLES).map(([id, r]) => (
                <tr key={id}>
                  <td>
                    <img src={`/icons/rooms/${r.icon}`} width={24} height={24} alt={r.label}
                      onError={e => { e.target.style.display='none' }} style={{ display:'block' }} />
                  </td>
                  <td><code style={{ background:'var(--bg-3)', padding:'2px 6px', borderRadius:4, fontSize:12 }}>{id}</code></td>
                  <td style={{ fontWeight:700 }}>{r.label}</td>
                  <td><code style={{ fontSize:12 }}>{r.icon}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background:'#fff8e1', border:'1px solid #fbbc04', borderRadius:'var(--radius)', padding:'14px 18px' }}>
          <p style={{ fontSize:13, color:'#92400e', margin:0, fontFamily:'var(--font-2)' }}>
            <strong>Dev Note:</strong> DB key like <code>vipmale</code> / <code>superadmin</code> is the exact string in MongoDB.
            Frontend uses <code>/icons/ranks/[icon]</code>. Backend specifies <code>legend.png</code> — frontend has <code>legend.svg</code> — rename if needed.
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
