/**
 * PremiumSection.jsx  — drop-in AdminPanel section components
 * Exports: PremiumSection, RevenueSection, ThemePermissionsSection
 * Import into AdminPanel.jsx and add to SECTIONS + renderSection()
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';

// FIX: trim trailing slash; fall back safely if env var is missing
const API   = (import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app').replace(/\/$/, '');
// FIX: never returns null — always returns empty string so "Bearer null" is never sent
const token = () => localStorage.getItem('cgz_token') || '';

// FIX: unified api helper with network error handling and auth guard
const api = async (path, opts = {}) => {
  const tok = token();
  if (!tok) throw new Error('Not authenticated — please log in.');
  // Detect absolute /api/... paths (premium + revenue endpoints) vs admin-relative paths
  const base = path.startsWith('/api') ? API : `${API}/api/admin`;
  let r;
  try {
    r = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', ...opts.headers },
      ...opts,
    });
  } catch {
    throw new Error('Network error — cannot reach server.');
  }
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || `Request failed (${r.status})`);
  }
  return r.json();
};

const toast = (msg, type = 'success') => {
  const el = document.createElement('div');
  el.className = `ap-toast ap-toast--${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
};

const RANK_COLORS = {
  guest:'#888', user:'#aaa', vipfemale:'#FF4488', vipmale:'#4488FF',
  butterfly:'#FF66AA', ninja:'#777', fairy:'#FF88CC', legend:'#FF8800',
  bot:'#00cc88', premium:'#aa44ff', moderator:'#00AAFF', admin:'#FF4444',
  superadmin:'#FF00FF', owner:'#FFD700',
};

const ALL_RANKS = ['guest','user','vipfemale','vipmale','butterfly','ninja','fairy',
                   'legend','bot','premium','moderator','admin','superadmin','owner'];

const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const fmtNum   = n => (n||0).toLocaleString();
const daysLeft = d => d ? Math.max(0, Math.ceil((new Date(d)-Date.now())/86400000)) : 0;

// ══════════════════════════════════════════════════════════════
// THEME PERMISSIONS SECTION
// ══════════════════════════════════════════════════════════════
export function ThemePermissionsSection() {
  const [perms, setPerms]     = useState({});
  const [saving, setSaving]   = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await api('/themes-by-rank'); setPerms(d.themesByRank || {}); }
    catch(e) { toast(e.message,'error'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (rank, val) => {
    setSaving(rank);
    try {
      await api(`/themes-by-rank/${rank}`, {
        method: 'PATCH', body: JSON.stringify({ count: val }),
      });
      setPerms(p => ({ ...p, [rank]: val }));
      toast(`${rank} → ${val === -1 ? 'unlimited' : val === 0 ? 'blocked' : val + ' themes'}`);
    } catch(e) { toast(e.message,'error'); }
    finally { setSaving(''); }
  };

  const saveAll = async () => {
    setSaving('all');
    try {
      await api('/themes-by-rank', { method: 'PUT', body: JSON.stringify({ themesByRank: perms }) });
      toast('All theme permissions saved!');
    } catch(e) { toast(e.message,'error'); }
    finally { setSaving(''); }
  };

  const rankLabel = r => r.charAt(0).toUpperCase() + r.slice(1).replace(/([A-Z])/g,' $1');
  const countLabel = v => v === -1 ? '♾ Unlimited' : v === 0 ? '⛔ Blocked' : `${v} theme${v===1?'':'s'}`;

  if (loading) return <div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div>;

  return (
    <div className="ap-section">
      <h2 className="ap-section-title">
        <i className="fa-solid fa-palette" style={{color:'#8b5cf6'}} />
        Theme Permissions
      </h2>
      <p className="ap-muted" style={{marginBottom:18}}>
        Control how many custom themes each rank can use. <strong>-1 = unlimited</strong>, <strong>0 = blocked</strong>, <strong>N = number of themes</strong>.
      </p>

      <div className="ap-card" style={{padding:0,overflow:'hidden'}}>
        <table className="ap-table" style={{marginBottom:0}}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Themes Allowed</th>
              <th>Quick Set</th>
              <th style={{width:80}}>Save</th>
            </tr>
          </thead>
          <tbody>
            {ALL_RANKS.map(rank => {
              const val = perms[rank] ?? 0;
              return (
                <tr key={rank}>
                  <td>
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:6,
                      color: RANK_COLORS[rank] || '#aaa', fontWeight:700
                    }}>
                      <span style={{
                        width:10, height:10, borderRadius:'50%',
                        background: RANK_COLORS[rank] || '#aaa', flexShrink:0
                      }}/>
                      {rankLabel(rank)}
                    </span>
                  </td>
                  <td>
                    <input
                      type="number" min="-1" max="999"
                      value={val}
                      onChange={e => setPerms(p => ({...p, [rank]: +e.target.value}))}
                      className="ap-input ap-input--sm"
                      style={{width:80}}
                    />
                    <span className="ap-muted" style={{marginLeft:8, fontSize:11}}>
                      {countLabel(val)}
                    </span>
                  </td>
                  <td>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {[0,1,3,5,10,-1].map(v => (
                        <button key={v}
                          onClick={() => setPerms(p => ({...p, [rank]: v}))}
                          className={`ap-btn ap-btn--xs ${val===v ? 'ap-btn--primary' : 'ap-btn--ghost'}`}
                        >
                          {v === -1 ? '∞' : v}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button
                      className="ap-btn ap-btn--primary ap-btn--sm"
                      onClick={() => save(rank, perms[rank] ?? 0)}
                      disabled={saving === rank}
                    >
                      {saving === rank ? <i className="fa-solid fa-spinner fa-spin" /> : 'Save'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{marginTop:14,display:'flex',justifyContent:'flex-end'}}>
        <button className="ap-btn ap-btn--success" onClick={saveAll} disabled={saving==='all'}>
          {saving==='all' ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-save" /> Save All Permissions</>}
        </button>
      </div>

      {/* Legend */}
      <div className="ap-card" style={{marginTop:16,padding:'12px 16px'}}>
        <div className="ap-card-title">How it works</div>
        <div style={{display:'flex',gap:16,flexWrap:'wrap',fontSize:13}}>
          <span>⛔ <strong>0</strong> — Rank cannot use custom themes at all</span>
          <span>🎨 <strong>1–N</strong> — Can use up to N themes</span>
          <span>♾ <strong>-1</strong> — Unlimited themes (all premium+ ranks)</span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PREMIUM SECTION — Full CodyChat-style VIP Management
// ══════════════════════════════════════════════════════════════
export function PremiumSection() {
  const [tab, setTab]             = useState('settings');  // settings | members | transactions | manage
  const [settings, setSettings]   = useState(null);
  const [members, setMembers]     = useState([]);
  const [txs, setTxs]             = useState([]);
  const [txTotal, setTxTotal]     = useState(0);
  const [txPage, setTxPage]       = useState(1);
  const [search, setSearch]       = useState('');
  const [memSearch, setMemSearch] = useState('');
  const [loading, setLoading]     = useState(false);
  const [grantUser, setGrantUser] = useState('');
  const [grantDays, setGrantDays] = useState(30);
  const [saving, setSaving]       = useState(false);
  const [plans, setPlans]         = useState([]);

  // Load settings + plans
  const loadSettings = useCallback(async () => {
    try {
      const d = await api('/premium-plans');
      setSettings(d);
      setPlans(d.premiumPlans || []);
    } catch(e) { toast(e.message,'error'); }
  }, []);

  // Load active premium members
  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api(`/api/premium/active-members?search=${encodeURIComponent(memSearch)}`);
      setMembers(d.members || []);
    } catch(e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  }, [memSearch]);

  // Load transactions
  const loadTxs = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api(`/api/premium/transactions?page=${txPage}&limit=30&search=${encodeURIComponent(search)}`);
      setTxs(d.transactions || []);
      setTxTotal(d.total || 0);
    } catch(e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  }, [txPage, search]);

  useEffect(() => { loadSettings(); }, [loadSettings]);
  useEffect(() => { if (tab === 'members') loadMembers(); }, [tab, loadMembers]);
  useEffect(() => { if (tab === 'transactions') loadTxs(); }, [tab, loadTxs]);

  const savePlans = async () => {
    setSaving(true);
    try {
      await api('/premium-plans', {
        method:'PUT',
        body: JSON.stringify({ premiumEnabled: settings?.premiumEnabled, premiumPlans: plans }),
      });
      toast('Premium plans saved!');
      loadSettings();
    } catch(e) { toast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const grantPremium = async () => {
    if (!grantUser.trim()) return toast('Enter username','error');
    setSaving(true);
    try {
      // Resolve username → id first
      const userData = await api(`/users?search=${encodeURIComponent(grantUser)}&limit=1`);
      const u = userData.users?.[0];
      if (!u) return toast('User not found','error');
      await api(`/api/premium/grant/${u._id}`, {
        method:'POST', body: JSON.stringify({ days: +grantDays }),
      });
      toast(`Premium granted to ${u.username} for ${grantDays} days!`);
      setGrantUser('');
      if (tab === 'members') loadMembers();
    } catch(e) { toast(e.message,'error'); }
    finally { setSaving(false); }
  };

  // FIX: replaced native confirm() (blocks thread, bad UX) with a state flag
  const [revokeTarget, setRevokeTarget] = React.useState(null);

  const revoke = async (userId, username) => {
    // Trigger confirm dialog (handled in JSX below)
    setRevokeTarget({ userId, username });
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    const { userId, username } = revokeTarget;
    setRevokeTarget(null);
    try {
      await api(`/api/premium/revoke/${userId}`, { method:'DELETE' });
      toast(`Revoked from ${username}`);
      loadMembers();
    } catch(e) { toast(e.message,'error'); }
  };

  const TABS = [
    { id:'settings',     icon:'fa-gear',       label:'Settings'     },
    { id:'members',      icon:'fa-crown',      label:'Members'      },
    { id:'transactions', icon:'fa-receipt',    label:'Transactions' },
    { id:'manage',       icon:'fa-user-plus',  label:'Manage'       },
  ];

  const methodBadge = m => {
    const map = { gold:'#f59e0b', ruby:'#e11d48', admin_grant:'#3b82f6', promo:'#22c55e' };
    return <span style={{background:`${map[m]||'#888'}22`,color:map[m]||'#888',border:`1px solid ${map[m]||'#888'}44`,borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700}}>{m}</span>;
  };

  return (
    <div className="ap-section">
      <h2 className="ap-section-title">
        <i className="fa-solid fa-crown" style={{color:'#aa44ff'}} />
        Premium
        {settings?.premiumEnabled === false && (
          <span style={{fontSize:11,background:'#ef444422',color:'#ef4444',border:'1px solid #ef444444',borderRadius:20,padding:'2px 8px',marginLeft:8}}>DISABLED</span>
        )}
      </h2>

      {/* Tab Bar */}
      <div className="ap-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`ap-tab-btn ${tab===t.id?'ap-tab-btn--active':''}`}
            onClick={() => setTab(t.id)}>
            <i className={`fa-solid ${t.icon}`} style={{marginRight:5}} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Settings Tab ── */}
      {tab === 'settings' && (
        <div>
          {/* Master toggle */}
          <div className="ap-card" style={{marginBottom:14}}>
            <div className="ap-card-title">Premium System</div>
            <label className="ap-toggle-row" style={{cursor:'pointer'}}>
              <span>Enable Premium Purchases</span>
              <input type="checkbox" className="ap-toggle"
                checked={settings?.premiumEnabled !== false}
                onChange={e => setSettings(s => ({...s, premiumEnabled: e.target.checked}))}
              />
            </label>
          </div>

          {/* Plans editor */}
          <div className="ap-card">
            <div className="ap-card-title">Premium Plans</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {plans.map((plan, i) => (
                <div key={plan.id} style={{
                  background:'#131624', border:'1px solid #1e2436', borderRadius:10,
                  padding:'14px 16px'
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <span style={{fontWeight:700,color:'#aa44ff',fontSize:14}}>{plan.label}</span>
                    <span className="ap-badge">{plan.days} days</span>
                  </div>
                  <div className="ap-form-grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))'}}>
                    <div className="ap-setting-row">
                      <span className="ap-label">Plan Label</span>
                      <input className="ap-input" value={plan.label}
                        onChange={e => setPlans(p => p.map((x,j) => j===i ? {...x,label:e.target.value} : x))} />
                    </div>
                    <div className="ap-setting-row">
                      <span className="ap-label">Days</span>
                      <input type="number" className="ap-input" value={plan.days}
                        onChange={e => setPlans(p => p.map((x,j) => j===i ? {...x,days:+e.target.value} : x))} />
                    </div>
                    <div className="ap-setting-row">
                      <span className="ap-label">Gold Price</span>
                      <input type="number" className="ap-input" value={plan.goldPrice}
                        onChange={e => setPlans(p => p.map((x,j) => j===i ? {...x,goldPrice:+e.target.value} : x))} />
                    </div>
                    <div className="ap-setting-row">
                      <span className="ap-label">Ruby Price</span>
                      <input type="number" className="ap-input" value={plan.rubyPrice}
                        onChange={e => setPlans(p => p.map((x,j) => j===i ? {...x,rubyPrice:+e.target.value} : x))} />
                    </div>
                    <div className="ap-setting-row">
                      <span className="ap-label">Gold Bonus (on purchase)</span>
                      <input type="number" className="ap-input" value={plan.goldBonus}
                        onChange={e => setPlans(p => p.map((x,j) => j===i ? {...x,goldBonus:+e.target.value} : x))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:16,display:'flex',justifyContent:'flex-end'}}>
              <button className="ap-btn ap-btn--primary" onClick={savePlans} disabled={saving}>
                {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-save" /> Save Plans</>}
              </button>
            </div>
          </div>

          {/* Features list */}
          <div className="ap-card" style={{marginTop:14}}>
            <div className="ap-card-title">Premium Features (shown to users)</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:8}}>
              {[
                {icon:'fa-palette',text:'Custom chat themes'},
                {icon:'fa-font',text:'Name gradients & neon effects'},
                {icon:'fa-text-height',text:'Font size up to 28px'},
                {icon:'fa-image',text:'Cover image & gallery uploads'},
                {icon:'fa-video',text:'Video & ZIP uploads'},
                {icon:'fa-lock',text:'Access to secret content'},
                {icon:'fa-gift',text:'Premium-only gifts'},
                {icon:'fa-coins',text:'Gold bonus on purchase'},
                {icon:'fa-star',text:'Premium rank badge & icon'},
                {icon:'fa-bolt',text:'Boosted daily gold rewards'},
              ].map((f,i) => (
                <div key={i} style={{
                  display:'flex',alignItems:'center',gap:8,padding:'8px 12px',
                  background:'#131624',borderRadius:8,border:'1px solid #1e2436',fontSize:13
                }}>
                  <i className={`fa-solid ${f.icon}`} style={{color:'#aa44ff',width:16}} />
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Members Tab ── */}
      {tab === 'members' && (
        <div>
          <div className="ap-filter-bar">
            <div style={{position:'relative',flex:1,minWidth:180}}>
              <i className="fa-solid fa-search" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#6b7280',fontSize:12,pointerEvents:'none'}} />
              <input className="ap-input" style={{paddingLeft:32}} placeholder="Search username…"
                value={memSearch} onChange={e => setMemSearch(e.target.value)}
                onKeyDown={e => e.key==='Enter' && loadMembers()} />
            </div>
            <button className="ap-btn ap-btn--ghost" onClick={loadMembers}>
              <i className="fa-solid fa-refresh" />
            </button>
          </div>

          {loading ? (
            <div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div>
          ) : members.length === 0 ? (
            <div className="ap-empty">No active premium members</div>
          ) : (
            <div className="ap-table-wrap">
              <table className="ap-table">
                <thead>
                  <tr><th>User</th><th>Rank</th><th>Expires</th><th>Days Left</th><th>Gold</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m._id}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <img src={m.avatar||'/default_images/avatar/default_avatar.png'} style={{width:28,height:28,borderRadius:'50%',objectFit:'cover'}} alt="" />
                          <span style={{fontWeight:600}}>{m.username}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{color:RANK_COLORS[m.rank]||'#aaa',fontWeight:700,fontSize:12}}>
                          {m.rank}
                        </span>
                      </td>
                      <td style={{fontSize:12}}>{fmtDate(m.premiumUntil)}</td>
                      <td>
                        <span style={{
                          background:'#aa44ff22',color:'#aa44ff',
                          border:'1px solid #aa44ff44',borderRadius:20,
                          padding:'2px 8px',fontSize:12,fontWeight:700
                        }}>
                          {daysLeft(m.premiumUntil)}d
                        </span>
                      </td>
                      <td style={{color:'#f59e0b',fontSize:12}}>{fmtNum(m.gold)} 🪙</td>
                      <td>
                        <button className="ap-btn ap-btn--danger ap-btn--xs" onClick={() => revoke(m._id, m.username)}>
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{marginTop:8,color:'#6b7280',fontSize:12}}>
            {members.length} active premium member{members.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* ── Transactions Tab ── */}
      {tab === 'transactions' && (
        <div>
          <div className="ap-filter-bar">
            <div style={{position:'relative',flex:1,minWidth:200}}>
              <i className="fa-solid fa-search" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#6b7280',fontSize:12,pointerEvents:'none'}} />
              <input className="ap-input" style={{paddingLeft:32}} placeholder="Search username…"
                value={search} onChange={e => { setSearch(e.target.value); setTxPage(1); }}
                onKeyDown={e => e.key==='Enter' && loadTxs()} />
            </div>
            <button className="ap-btn ap-btn--ghost" onClick={loadTxs}>
              <i className="fa-solid fa-refresh" />
            </button>
          </div>

          {loading ? (
            <div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div>
          ) : txs.length === 0 ? (
            <div className="ap-empty">No transactions found</div>
          ) : (
            <div className="ap-table-wrap">
              <table className="ap-table ap-table--sm">
                <thead>
                  <tr><th>User</th><th>Plan</th><th>Method</th><th>Gold Spent</th><th>Ruby Spent</th><th>Bonus</th><th>Expires</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {txs.map(t => (
                    <tr key={t._id}>
                      <td style={{fontWeight:600}}>{t.username||'—'}</td>
                      <td style={{fontSize:12,color:'#aa44ff'}}>{t.planLabel}</td>
                      <td>{methodBadge(t.method)}</td>
                      <td style={{color:'#f59e0b'}}>{t.goldSpent ? `${fmtNum(t.goldSpent)} 🪙` : '—'}</td>
                      <td style={{color:'#e11d48'}}>{t.rubySpent ? `${fmtNum(t.rubySpent)} 💎` : '—'}</td>
                      <td style={{color:'#22c55e'}}>+{fmtNum(t.goldBonus)} 🪙</td>
                      <td style={{fontSize:12}}>{fmtDate(t.expiresAt)}</td>
                      <td style={{fontSize:11,color:'#6b7280'}}>{fmtDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {txTotal > 30 && (
            <div className="ap-pagination">
              <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setTxPage(p=>Math.max(1,p-1))} disabled={txPage===1}>‹</button>
              <span>Page {txPage} of {Math.ceil(txTotal/30)}</span>
              <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setTxPage(p=>p+1)} disabled={txPage>=Math.ceil(txTotal/30)}>›</button>
            </div>
          )}
          <div style={{marginTop:4,color:'#6b7280',fontSize:12}}>Total: {fmtNum(txTotal)} transactions</div>
        </div>
      )}

      {/* ── Manage Tab — Manual Grant ── */}
      {tab === 'manage' && (
        <div>
          <div className="ap-card" style={{maxWidth:480}}>
            <div className="ap-card-title"><i className="fa-solid fa-user-plus" style={{marginRight:6}} />Grant Premium</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div className="ap-setting-row">
                <span className="ap-label">Username</span>
                <input className="ap-input" placeholder="Enter exact username…"
                  value={grantUser} onChange={e => setGrantUser(e.target.value)} />
              </div>
              <div className="ap-setting-row">
                <span className="ap-label">Days</span>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:6}}>
                  {[7,14,30,60,90,180,365].map(d => (
                    <button key={d} onClick={() => setGrantDays(d)}
                      className={`ap-btn ap-btn--xs ${grantDays===d?'ap-btn--primary':'ap-btn--ghost'}`}>
                      {d}d
                    </button>
                  ))}
                </div>
                <input type="number" className="ap-input" value={grantDays}
                  onChange={e => setGrantDays(+e.target.value)} style={{width:100}} />
              </div>
              <button className="ap-btn ap-btn--success" onClick={grantPremium} disabled={saving}>
                {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-crown" /> Grant {grantDays} Days Premium</>}
              </button>
            </div>
          </div>

          <div className="ap-card" style={{maxWidth:480,marginTop:14}}>
            <div className="ap-card-title"><i className="fa-solid fa-ban" style={{marginRight:6,color:'#ef4444'}} />Revoke Premium</div>
            <p className="ap-muted" style={{marginBottom:10}}>
              Go to the <strong>Members</strong> tab and click "Revoke" on any active premium user.
            </p>
            <button className="ap-btn ap-btn--ghost" onClick={() => setTab('members')}>
              <i className="fa-solid fa-arrow-right" /> Go to Members
            </button>
          </div>
        </div>
      )}

      {/* FIX: Revoke confirm dialog — replaces native confirm() call */}
      {revokeTarget && (
        <div className="ap-overlay" onClick={() => setRevokeTarget(null)}>
          <div className="ap-dialog" onClick={e => e.stopPropagation()}>
            <p>Revoke premium from <strong>{revokeTarget.username}</strong>?</p>
            <div className="ap-dialog-actions">
              <button className="ap-btn ap-btn--danger" onClick={confirmRevoke}>Confirm</button>
              <button className="ap-btn ap-btn--ghost" onClick={() => setRevokeTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// REVENUE SECTION — Owner only
// ══════════════════════════════════════════════════════════════
export function RevenueSection({ userRank }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [adDays, setAdDays]     = useState(30);
  const [adData, setAdData]     = useState(null);
  const [tab, setTab]           = useState('overview');

  // FIX: ALL hooks must be called before any conditional return (Rules of Hooks).
  // The original code had `if (userRank !== 'owner') return (...)` BEFORE useCallback/useEffect,
  // which caused React to crash with "rendered more hooks than previous render".
  // Solution: call all hooks unconditionally, gate the early-return in JSX below.

  const loadSummary = useCallback(async () => {
    if (userRank !== 'owner') return;   // safe inside callback — not a hook call
    setLoading(true);
    try { const d = await api('/api/revenue/summary'); setData(d); }
    catch(e) { toast(e.message,'error'); }
    finally  { setLoading(false); }
  }, [userRank]);

  const loadAds = useCallback(async () => {
    if (userRank !== 'owner') return;
    try { const d = await api(`/api/revenue/ads?days=${adDays}`); setAdData(d); }
    catch(e) { toast(e.message,'error'); }
  }, [adDays, userRank]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  // FIX: removed setTimeout(loadAds, 50) — useEffect dependency on adDays handles re-fetch correctly
  useEffect(() => { if (tab === 'ads') loadAds(); }, [tab, loadAds]);

  // Guard: render lock-screen AFTER hooks (JSX return, not early return before hooks)
  if (userRank !== 'owner') {
    return (
      <div className="ap-section">
        <div style={{textAlign:'center',padding:60,color:'#4b5563'}}>
          <i className="fa-solid fa-lock" style={{fontSize:48,marginBottom:16,display:'block'}} />
          <p style={{fontSize:16,fontWeight:700}}>Owner Only</p>
          <p style={{fontSize:13}}>Revenue dashboard is restricted to the site owner.</p>
        </div>
      </div>
    );
  }

  const TABS = [
    {id:'overview', icon:'fa-chart-line',  label:'Overview'},
    {id:'premium',  icon:'fa-crown',       label:'Premium Revenue'},
    {id:'ads',      icon:'fa-rectangle-ad',label:'Ad Revenue'},
  ];

  const BigStat = ({label, value, sub, color, icon}) => (
    <div style={{
      background:'#0d1020', border:`1px solid ${color}33`,
      borderLeft:`4px solid ${color}`, borderRadius:12,
      padding:'16px 18px', display:'flex', alignItems:'center', gap:14
    }}>
      <i className={`fa-solid ${icon}`} style={{fontSize:24,color}} />
      <div>
        <div style={{fontSize:26,fontWeight:900,color,lineHeight:1}}>{value}</div>
        <div style={{fontSize:11,color:'#6b7280',marginTop:3}}>{label}</div>
        {sub && <div style={{fontSize:12,color:'#22c55e',marginTop:1}}>{sub}</div>}
      </div>
    </div>
  );

  if (loading) return (
    <div className="ap-section">
      <div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div>
    </div>
  );

  return (
    <div className="ap-section">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <h2 className="ap-section-title" style={{marginBottom:0}}>
          <i className="fa-solid fa-chart-line" style={{color:'#22c55e'}} />
          Revenue Dashboard
          <span style={{
            fontSize:11,background:'#FFD70022',color:'#FFD700',
            border:'1px solid #FFD70044',borderRadius:20,padding:'2px 10px',marginLeft:8,fontWeight:700
          }}>Owner Only</span>
        </h2>
        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={loadSummary}>
          <i className="fa-solid fa-refresh" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="ap-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`ap-tab-btn ${tab===t.id?'ap-tab-btn--active':''}`}
            onClick={() => setTab(t.id)}>
            <i className={`fa-solid ${t.icon}`} style={{marginRight:5}} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === 'overview' && data && (() => {
        const premiumCount      = data.premium?.total        || 0;
        const premiumActive     = data.premium?.activeNow    || 0;
        const premiumToday      = data.premium?.today        || 0;
        const premiumMonth      = data.premium?.thisMonth    || 0;
        const premiumGoldTotal  = data.premium?.goldTotal    || 0;
        const premiumGoldToday  = data.premium?.goldToday    || 0;
        const premiumGoldMonth  = data.premium?.goldMonth    || 0;
        const adRevToday        = (data.ads?.today?.revenue  || 0) / 100;
        const adRevMonth        = (data.ads?.thisMonth?.revenue || 0) / 100;
        const adRevAll          = (data.ads?.allTime?.revenue || 0) / 100;
        const adImpToday        = data.ads?.today?.impressions  || 0;
        const adImpMonth        = data.ads?.thisMonth?.impressions || 0;
        const adClicksToday     = data.ads?.today?.clicks    || 0;

        return (
        <div>
          {/* ── Combined Revenue Banner ── */}
          <div style={{
            background:'linear-gradient(135deg,#0d1a0d,#1a0d2a)',
            border:'1px solid #22c55e44', borderRadius:14,
            padding:'18px 22px', marginBottom:20,
            display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16
          }}>
            <div>
              <div style={{fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Total Revenue (All Time)</div>
              <div style={{display:'flex',alignItems:'baseline',gap:10,flexWrap:'wrap'}}>
                <span style={{fontSize:32,fontWeight:900,color:'#22c55e'}}>${adRevAll.toFixed(2)}</span>
                <span style={{fontSize:14,color:'#6b7280'}}>ads</span>
                <span style={{fontSize:22,color:'#4b5563',margin:'0 4px'}}>+</span>
                <span style={{fontSize:32,fontWeight:900,color:'#aa44ff'}}>{fmtNum(premiumGoldTotal)}</span>
                <span style={{fontSize:14,color:'#6b7280'}}>gold (premium)</span>
              </div>
              <div style={{fontSize:12,color:'#4b5563',marginTop:4}}>
                {fmtNum(premiumCount)} premium sold · {fmtNum(premiumActive)} active now
              </div>
            </div>
            <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
              <div style={{textAlign:'center',padding:'10px 16px',background:'#0d1020',borderRadius:10,border:'1px solid #aa44ff33'}}>
                <div style={{fontSize:22,fontWeight:900,color:'#aa44ff'}}>{fmtNum(premiumToday)}</div>
                <div style={{fontSize:11,color:'#6b7280'}}>Premium Today</div>
              </div>
              <div style={{textAlign:'center',padding:'10px 16px',background:'#0d1020',borderRadius:10,border:'1px solid #f59e0b33'}}>
                <div style={{fontSize:22,fontWeight:900,color:'#f59e0b'}}>${adRevToday.toFixed(2)}</div>
                <div style={{fontSize:11,color:'#6b7280'}}>Ad Rev Today</div>
              </div>
              <div style={{textAlign:'center',padding:'10px 16px',background:'#0d1020',borderRadius:10,border:'1px solid #3b82f633'}}>
                <div style={{fontSize:22,fontWeight:900,color:'#3b82f6'}}>{fmtNum(premiumMonth)}</div>
                <div style={{fontSize:11,color:'#6b7280'}}>Premium This Month</div>
              </div>
              <div style={{textAlign:'center',padding:'10px 16px',background:'#0d1020',borderRadius:10,border:'1px solid #ec489933'}}>
                <div style={{fontSize:22,fontWeight:900,color:'#ec4899'}}>${adRevMonth.toFixed(2)}</div>
                <div style={{fontSize:11,color:'#6b7280'}}>Ad Rev This Month</div>
              </div>
            </div>
          </div>

          {/* Key stats grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:12,marginBottom:20}}>
            <BigStat label="Active Premium Now"    value={fmtNum(premiumActive)}                     color="#aa44ff" icon="fa-crown"         />
            <BigStat label="Premium Today"         value={fmtNum(premiumToday)}                      color="#aa44ff" icon="fa-star"          sub={`+${fmtNum(premiumGoldToday)} gold`} />
            <BigStat label="Premium This Month"    value={fmtNum(premiumMonth)}                      color="#3b82f6" icon="fa-calendar"      sub={`+${fmtNum(premiumGoldMonth)} gold`} />
            <BigStat label="Total Premium Sold"    value={fmtNum(premiumCount)}                      color="#22c55e" icon="fa-receipt"       sub={`${fmtNum(premiumGoldTotal)} gold total`} />
            <BigStat label="Ad Impressions Today"  value={fmtNum(adImpToday)}                        color="#f59e0b" icon="fa-eye"           />
            <BigStat label="Ad Clicks Today"       value={fmtNum(adClicksToday)}                     color="#f59e0b" icon="fa-arrow-pointer" sub={adImpToday ? `${((adClicksToday/adImpToday)*100).toFixed(1)}% CTR` : ''} />
            <BigStat label="Ad Revenue Today"      value={`$${adRevToday.toFixed(2)}`}               color="#f59e0b" icon="fa-dollar-sign"   />
            <BigStat label="Ad Revenue This Month" value={`$${adRevMonth.toFixed(2)}`}               color="#ec4899" icon="fa-rectangle-ad"  />
            <BigStat label="Total Members"         value={fmtNum(data.users?.total)}                 color="#60a5fa" icon="fa-users"         sub={`+${fmtNum(data.users?.newToday)} today`} />
            <BigStat label="Guest Users"           value={fmtNum(data.users?.guests)}                color="#6b7280" icon="fa-user-secret"   />
          </div>

          {/* Plan breakdown */}
          {data.premium?.planBreakdown?.length > 0 && (
            <div className="ap-card" style={{marginBottom:16}}>
              <div className="ap-card-title">Plan Popularity</div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                {data.premium.planBreakdown.map(p => (
                  <div key={p._id} style={{
                    background:'#131624',border:'1px solid #1e2436',borderRadius:10,
                    padding:'12px 16px',minWidth:130
                  }}>
                    <div style={{color:'#aa44ff',fontWeight:700,fontSize:13}}>{p.label||p._id}</div>
                    <div style={{fontSize:24,fontWeight:900,marginTop:4}}>{fmtNum(p.count)}</div>
                    <div style={{fontSize:11,color:'#6b7280'}}>sold · {fmtNum(p.goldTotal)} gold</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last 7 days chart */}
          {data.premium?.last7Chart?.length > 0 && (
            <div className="ap-card">
              <div className="ap-card-title">Last 7 Days — Premium Purchases</div>
              <div style={{display:'flex',alignItems:'flex-end',gap:4,height:80}}>
                {data.premium.last7Chart.map(d => {
                  const max = Math.max(...data.premium.last7Chart.map(x=>x.count),1);
                  const h = Math.max(8,(d.count/max)*72);
                  return (
                    <div key={d._id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                      <span style={{fontSize:10,color:'#aa44ff',fontWeight:700}}>{d.count}</span>
                      <div style={{
                        width:'100%',height:h,background:'linear-gradient(to top,#aa44ff,#7c3aed)',
                        borderRadius:'4px 4px 0 0',transition:'height .3s'
                      }}/>
                      <span style={{fontSize:9,color:'#6b7280',whiteSpace:'nowrap'}}>
                        {d._id ? new Date(d._id).toLocaleDateString('en',{month:'short',day:'numeric'}) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* ── Premium Revenue Tab ── */}
      {tab === 'premium' && data && (
        <div>
          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12,marginBottom:16}}>
            <BigStat label="Active Now"    value={fmtNum(data.premium?.activeNow)}   color="#aa44ff" icon="fa-crown"    />
            <BigStat label="Today"         value={fmtNum(data.premium?.today)}       color="#aa44ff" icon="fa-star"     />
            <BigStat label="This Month"    value={fmtNum(data.premium?.thisMonth)}   color="#3b82f6" icon="fa-calendar" />
            <BigStat label="Last 30 Days"  value={fmtNum(data.premium?.last30Days)}  color="#22c55e" icon="fa-clock"    />
            <BigStat label="All Time"      value={fmtNum(data.premium?.total)}       color="#f59e0b" icon="fa-infinity" />
            <BigStat label="Gold Earned"   value={`${fmtNum(data.premium?.goldTotal)} 🪙`} color="#f59e0b" icon="fa-coins" />
          </div>

          {/* Recent transactions */}
          <div className="ap-card">
            <div className="ap-card-title">Recent Premium Transactions</div>
            {(data.premium?.recentTransactions||[]).length === 0 ? (
              <div className="ap-empty">No transactions yet</div>
            ) : (
              <div className="ap-table-wrap">
                <table className="ap-table ap-table--sm">
                  <thead>
                    <tr><th>User</th><th>Plan</th><th>Method</th><th>Gold</th><th>Ruby</th><th>Bonus</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {(data.premium.recentTransactions||[]).map(t => (
                      <tr key={t._id}>
                        <td style={{fontWeight:600}}>{t.username||'—'}</td>
                        <td style={{fontSize:12,color:'#aa44ff'}}>{t.planLabel}</td>
                        <td><span style={{
                          background:'#3b82f622',color:'#3b82f6',
                          border:'1px solid #3b82f644',borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700
                        }}>{t.method}</span></td>
                        <td style={{color:'#f59e0b'}}>{t.goldSpent ? `${fmtNum(t.goldSpent)} 🪙` : '—'}</td>
                        <td style={{color:'#e11d48'}}>{t.rubySpent ? `${fmtNum(t.rubySpent)} 💎` : '—'}</td>
                        <td style={{color:'#22c55e'}}>+{fmtNum(t.goldBonus)}</td>
                        <td style={{fontSize:11,color:'#6b7280'}}>{fmtDate(t.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Ads Revenue Tab ── */}
      {tab === 'ads' && (
        <div>
          <div className="ap-filter-bar">
            <span className="ap-muted">Show last</span>
            {[7,14,30,60,90].map(d => (
              // FIX: removed setTimeout(loadAds, 50) — setAdDays triggers useEffect([adDays]) cleanly
              <button key={d} onClick={() => setAdDays(d)}
                className={`ap-btn ap-btn--xs ${adDays===d?'ap-btn--primary':'ap-btn--ghost'}`}>
                {d}d
              </button>
            ))}
          </div>

          {/* Ad summary stats */}
          {data && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12,marginBottom:16}}>
              <BigStat label="Impressions Today"  value={fmtNum(data.ads?.today?.impressions)}  color="#f59e0b" icon="fa-eye"          />
              <BigStat label="Clicks Today"        value={fmtNum(data.ads?.today?.clicks)}       color="#f59e0b" icon="fa-arrow-pointer" />
              <BigStat label="Revenue Today"       value={`$${((data.ads?.today?.revenue||0)/100).toFixed(2)}`}       color="#22c55e" icon="fa-dollar-sign" />
              <BigStat label="Impressions Month"   value={fmtNum(data.ads?.thisMonth?.impressions)} color="#3b82f6" icon="fa-chart-bar" />
              <BigStat label="Revenue Month"       value={`$${((data.ads?.thisMonth?.revenue||0)/100).toFixed(2)}`}   color="#3b82f6" icon="fa-coins"       />
              <BigStat label="All-Time Revenue"    value={`$${((data.ads?.allTime?.revenue||0)/100).toFixed(2)}`}     color="#ec4899" icon="fa-infinity"    />
            </div>
          )}

          {adData?.byUnit?.length > 0 ? (
            <div className="ap-card">
              <div className="ap-card-title">Ad Units Performance</div>
              <div className="ap-table-wrap">
                <table className="ap-table ap-table--sm">
                  <thead>
                    <tr><th>Ad Unit</th><th>Placement</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Revenue</th></tr>
                  </thead>
                  <tbody>
                    {adData.byUnit.map((r,i) => {
                      const ctr = r.impressions ? ((r.clicks/r.impressions)*100).toFixed(1) : '0.0';
                      return (
                        <tr key={i}>
                          <td style={{fontWeight:600}}>{r._id?.adUnit||'—'}</td>
                          <td style={{color:'#94a3b8',fontSize:12}}>{r._id?.placement||'—'}</td>
                          <td>{fmtNum(r.impressions)}</td>
                          <td>{fmtNum(r.clicks)}</td>
                          <td>
                            <span style={{
                              background: +ctr > 2 ? '#22c55e22' : '#6b728022',
                              color:      +ctr > 2 ? '#22c55e'   : '#6b7280',
                              borderRadius:20,padding:'2px 7px',fontSize:11,fontWeight:700
                            }}>{ctr}%</span>
                          </td>
                          <td style={{color:'#22c55e',fontWeight:700}}>
                            ${(r.revenue/100).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="ap-card">
              <div className="ap-card-title">No Ad Data Yet</div>
              <p className="ap-muted">Ad impressions will appear here once users start seeing ads. Log impressions via <code>POST /api/revenue/ads/log</code>.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const EXTRA_SECTIONS_CSS = `
  /* Revenue / Premium extra styles */
  .rev-big-stat { transition: box-shadow .15s; }
  .rev-big-stat:hover { box-shadow: 0 0 0 1px rgba(255,255,255,.08); }
  .prem-plan-card { transition: border-color .15s; }
  .prem-plan-card:hover { border-color: #aa44ff55; }
`;
