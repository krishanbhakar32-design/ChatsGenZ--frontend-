/**
 * Premium.jsx — User-facing Premium purchase page
 * CodyChat VIP logic → Premium: buy with Gold or Ruby,
 * shows plans, features, current status, transaction history.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout.jsx';

const API   = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => localStorage.getItem('token');

const api = async (path, opts = {}) => {
  const r = await fetch(`${API}/api${path}`, {
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Request failed'); }
  return r.json();
};

const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const fmtNum   = n => (n||0).toLocaleString();
const daysLeft = d => d ? Math.max(0, Math.ceil((new Date(d)-Date.now())/86400000)) : 0;

export default function Premium() {
  const navigate = useNavigate();
  const [status, setStatus]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [buying, setBuying]     = useState('');
  const [currency, setCurrency] = useState('gold');
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try { setStatus(await api('/premium/status')); }
    catch { navigate('/login'); }
    finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const purchase = async (planId) => {
    if (!confirm('Are you sure you want to purchase this plan?')) return;
    setBuying(planId);
    try {
      const d = await api(`/premium/purchase/${planId}`, {
        method:'POST', body: JSON.stringify({ currency }),
      });
      showToast(`✅ ${d.message} +${fmtNum(d.goldBonus)} gold bonus!`);
      load();
    } catch(e) { showToast(e.message, 'error'); }
    finally { setBuying(''); }
  };

  const FEATURES = [
    { icon:'🎨', text:'Custom chat themes (unlimited)' },
    { icon:'✨', text:'Name gradients & neon glow effects' },
    { icon:'🔠', text:'Font size up to 28px in messages' },
    { icon:'🖼️', text:'Cover image & personal gallery' },
    { icon:'🎬', text:'Video & ZIP file uploads in chat' },
    { icon:'🔒', text:'Access to premium-only secret content' },
    { icon:'🎁', text:'Exclusive premium-only gifts' },
    { icon:'🪙', text:'Gold bonus added immediately on purchase' },
    { icon:'⭐', text:'Premium rank badge & special icon' },
    { icon:'⚡', text:'Boosted daily gold & ruby rewards' },
  ];

  const planColors = { prem7:'#3b82f6', prem30:'#8b5cf6', prem90:'#aa44ff', prem365:'#FFD700' };

  if (loading) return (
    <PageLayout>
      <div style={{textAlign:'center',padding:80,color:'#6b7280',fontSize:24}}>
        <i className="fa-solid fa-spinner fa-spin" style={{color:'#aa44ff'}} />
      </div>
    </PageLayout>
  );

  const plans = status?.plans || [];
  const isActive = status?.isPremium;
  const dLeft = daysLeft(status?.expiresAt);

  return (
    <PageLayout>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      <style>{PREMIUM_CSS}</style>

      {/* Toast */}
      {toast && (
        <div className={`prem-toast prem-toast--${toast.type}`}>{toast.msg}</div>
      )}

      <div className="prem-root">
        {/* Hero */}
        <div className="prem-hero">
          <div className="prem-hero-glow" />
          <div className="prem-hero-inner">
            <div className="prem-crown-wrap">
              <i className="fa-solid fa-crown prem-crown-icon" />
            </div>
            <h1 className="prem-hero-title">ChatsGenZ Premium</h1>
            <p className="prem-hero-sub">
              Unlock exclusive features, themes, and perks. Join thousands of Premium members.
            </p>

            {/* Current status badge */}
            {isActive ? (
              <div className="prem-status-active">
                <i className="fa-solid fa-crown" />
                Premium Active — <strong>{dLeft} day{dLeft !== 1 ? 's' : ''} remaining</strong>
                <span className="prem-expires-date">Expires {fmtDate(status?.expiresAt)}</span>
              </div>
            ) : (
              <div className="prem-status-inactive">
                <i className="fa-solid fa-lock" /> You are not a Premium member
              </div>
            )}

            {/* Wallet display */}
            <div className="prem-wallet">
              <span className="prem-wallet-item prem-wallet-gold">
                <i className="fa-solid fa-coins" /> {fmtNum(status?.gold)} Gold
              </span>
              <span className="prem-wallet-item prem-wallet-ruby">
                <i className="fa-solid fa-gem" /> {fmtNum(status?.ruby)} Ruby
              </span>
            </div>
          </div>
        </div>

        <div className="prem-body">
          {/* Currency selector */}
          <div className="prem-currency-switch">
            <span className="prem-cs-label">Pay with:</span>
            <button className={`prem-cs-btn ${currency==='gold' ? 'prem-cs-btn--active' : ''}`}
              onClick={() => setCurrency('gold')}>
              <i className="fa-solid fa-coins" /> Gold
            </button>
            <button className={`prem-cs-btn ${currency==='ruby' ? 'prem-cs-btn--active prem-cs-btn--ruby' : ''}`}
              onClick={() => setCurrency('ruby')}>
              <i className="fa-solid fa-gem" /> Ruby
            </button>
          </div>

          {/* Plans grid */}
          <div className="prem-plans-grid">
            {plans.map(plan => {
              const price = currency === 'ruby' ? plan.rubyPrice : plan.goldPrice;
              const canAfford = currency === 'ruby' ? status?.ruby >= plan.rubyPrice : status?.gold >= plan.goldPrice;
              const accentColor = planColors[plan.id] || '#aa44ff';
              const isBest = plan.id === 'prem30';

              return (
                <div key={plan.id} className={`prem-plan-card ${isBest ? 'prem-plan-card--best' : ''}`}
                  style={{'--plan-color': accentColor}}>
                  {isBest && <div className="prem-plan-badge">Most Popular</div>}
                  <div className="prem-plan-header">
                    <div className="prem-plan-label">{plan.label}</div>
                    <div className="prem-plan-days">{plan.days} days</div>
                  </div>
                  <div className="prem-plan-price">
                    <span className="prem-plan-price-num">{fmtNum(price)}</span>
                    <span className="prem-plan-price-cur">
                      {currency === 'ruby' ? '💎 Ruby' : '🪙 Gold'}
                    </span>
                  </div>
                  <div className="prem-plan-bonus">
                    <i className="fa-solid fa-plus-circle" style={{color:'#22c55e'}} />
                    +{fmtNum(plan.goldBonus)} Gold Bonus
                  </div>
                  <button
                    className={`prem-plan-btn ${!canAfford ? 'prem-plan-btn--disabled' : ''}`}
                    onClick={() => canAfford && purchase(plan.id)}
                    disabled={!!buying || !canAfford}
                    title={!canAfford ? `Not enough ${currency}` : ''}
                  >
                    {buying === plan.id
                      ? <i className="fa-solid fa-spinner fa-spin" />
                      : canAfford
                        ? <><i className="fa-solid fa-crown" /> Get Premium</>
                        : <><i className="fa-solid fa-lock" /> Not enough {currency}</>
                    }
                  </button>
                  {isActive && (
                    <div className="prem-plan-extend-note">
                      +{plan.days} days added to your current plan
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Features */}
          <div className="prem-features-section">
            <h2 className="prem-features-title">What you get with Premium</h2>
            <div className="prem-features-grid">
              {FEATURES.map((f,i) => (
                <div key={i} className="prem-feature-card">
                  <span className="prem-feature-icon">{f.icon}</span>
                  <span className="prem-feature-text">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction history */}
          {status?.transactions?.length > 0 && (
            <div className="prem-history-section">
              <h2 className="prem-features-title">Your Purchase History</h2>
              <div className="prem-history-list">
                {status.transactions.map(t => (
                  <div key={t._id} className="prem-history-row">
                    <div className="prem-history-left">
                      <i className="fa-solid fa-crown" style={{color:'#aa44ff'}} />
                      <div>
                        <div className="prem-history-plan">{t.planLabel}</div>
                        <div className="prem-history-date">{fmtDate(t.createdAt)}</div>
                      </div>
                    </div>
                    <div className="prem-history-right">
                      {t.goldSpent > 0 && (
                        <span className="prem-history-spent">-{fmtNum(t.goldSpent)} 🪙</span>
                      )}
                      {t.rubySpent > 0 && (
                        <span className="prem-history-spent prem-history-ruby">-{fmtNum(t.rubySpent)} 💎</span>
                      )}
                      {t.goldBonus > 0 && (
                        <span className="prem-history-bonus">+{fmtNum(t.goldBonus)} 🪙</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          <div className="prem-faq-section">
            <h2 className="prem-features-title">Frequently Asked Questions</h2>
            <div className="prem-faq-list">
              {[
                { q:'What happens when Premium expires?', a:'Your rank returns to your previous level. All chats and content remain saved.' },
                { q:'Can I extend Premium?', a:'Yes! Purchasing while active adds days on top — it never resets your timer.' },
                { q:'Can I pay with Ruby?', a:'Yes! Switch the currency toggle above to Ruby and purchase any plan.' },
                { q:'Is Gold bonus instant?', a:'Yes — gold is added to your wallet immediately upon purchase.' },
                { q:'How do I earn more Gold?', a:'Send messages, send gifts, log in daily for streak bonuses, and spin the wheel.' },
              ].map((faq,i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`prem-faq-item ${open ? 'prem-faq-item--open' : ''}`}>
      <button className="prem-faq-q" onClick={() => setOpen(o => !o)}>
        {q}
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{marginLeft:'auto',fontSize:12,color:'#6b7280'}} />
      </button>
      {open && <div className="prem-faq-a">{a}</div>}
    </div>
  );
}

const PREMIUM_CSS = `
  .prem-root { max-width:900px; margin:0 auto; padding:0 16px 60px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }

  /* Hero */
  .prem-hero { position:relative; overflow:hidden; border-radius:20px; margin-bottom:28px; padding:48px 24px 40px; text-align:center; background:linear-gradient(135deg,#0d0919,#1a0d2e,#0d1020); border:1px solid #aa44ff33; }
  .prem-hero-glow { position:absolute; top:-60px; left:50%; transform:translateX(-50%); width:400px; height:300px; background:radial-gradient(ellipse,#aa44ff22 0%,transparent 70%); pointer-events:none; }
  .prem-hero-inner { position:relative; z-index:1; }
  .prem-crown-wrap { width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg,#aa44ff,#7c3aed); display:inline-flex; align-items:center; justify-content:center; margin-bottom:16px; box-shadow:0 0 30px #aa44ff44; }
  .prem-crown-icon { font-size:32px; color:#fff; }
  .prem-hero-title { font-size:clamp(22px,4vw,36px); font-weight:900; background:linear-gradient(90deg,#aa44ff,#ec4899,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:10px; }
  .prem-hero-sub { color:#94a3b8; font-size:15px; max-width:500px; margin:0 auto 20px; line-height:1.6; }
  .prem-status-active { display:inline-flex; align-items:center; gap:8px; background:#aa44ff22; border:1px solid #aa44ff44; border-radius:30px; padding:10px 20px; color:#aa44ff; font-weight:700; font-size:14px; flex-wrap:wrap; justify-content:center; }
  .prem-expires-date { font-size:11px; color:#94a3b8; font-weight:400; width:100%; text-align:center; margin-top:2px; }
  .prem-status-inactive { display:inline-flex; align-items:center; gap:8px; background:#1e243666; border:1px solid #1e2436; border-radius:30px; padding:10px 20px; color:#6b7280; font-size:14px; }
  .prem-wallet { display:inline-flex; gap:12px; margin-top:16px; flex-wrap:wrap; justify-content:center; }
  .prem-wallet-item { display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:20px; font-size:14px; font-weight:700; border:1px solid transparent; }
  .prem-wallet-gold { background:#f59e0b22; border-color:#f59e0b44; color:#f59e0b; }
  .prem-wallet-ruby { background:#e11d4822; border-color:#e11d4844; color:#e11d48; }

  /* Body */
  .prem-body { display:flex; flex-direction:column; gap:28px; }

  /* Currency switch */
  .prem-currency-switch { display:flex; align-items:center; gap:8px; justify-content:center; flex-wrap:wrap; }
  .prem-cs-label { font-size:13px; color:#94a3b8; }
  .prem-cs-btn { padding:8px 20px; border-radius:20px; border:1px solid #1e2436; background:#131624; color:#94a3b8; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; display:inline-flex; align-items:center; gap:6px; }
  .prem-cs-btn:hover { background:#1e2436; color:#f1f5f9; }
  .prem-cs-btn--active { background:#f59e0b22; border-color:#f59e0b44; color:#f59e0b; }
  .prem-cs-btn--ruby.prem-cs-btn--active { background:#e11d4822; border-color:#e11d4844; color:#e11d48; }

  /* Plans grid */
  .prem-plans-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:14px; }
  .prem-plan-card { background:#0d1020; border:1px solid #1e2436; border-radius:16px; padding:20px 16px; display:flex; flex-direction:column; gap:10px; position:relative; transition:all .2s; cursor:default; border-top:3px solid var(--plan-color,#aa44ff); }
  .prem-plan-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.4); border-color:var(--plan-color,#aa44ff)44; }
  .prem-plan-card--best { background:linear-gradient(135deg,#0d0919,#150d25); border-color:#aa44ff66; box-shadow:0 0 20px #aa44ff22; }
  .prem-plan-badge { position:absolute; top:-13px; left:50%; transform:translateX(-50%); background:linear-gradient(90deg,#aa44ff,#7c3aed); color:#fff; font-size:10px; font-weight:800; padding:3px 12px; border-radius:20px; white-space:nowrap; }
  .prem-plan-header { display:flex; flex-direction:column; gap:2px; }
  .prem-plan-label { font-size:15px; font-weight:800; color:#f1f5f9; }
  .prem-plan-days { font-size:12px; color:#6b7280; }
  .prem-plan-price { display:flex; align-items:baseline; gap:5px; }
  .prem-plan-price-num { font-size:26px; font-weight:900; color:var(--plan-color,#aa44ff); }
  .prem-plan-price-cur { font-size:12px; color:#94a3b8; }
  .prem-plan-bonus { font-size:12px; color:#22c55e; display:flex; align-items:center; gap:5px; }
  .prem-plan-btn { padding:10px 14px; border-radius:10px; border:none; background:var(--plan-color,#aa44ff); color:#fff; font-size:13px; font-weight:700; cursor:pointer; transition:all .15s; display:flex; align-items:center; justify-content:center; gap:6px; margin-top:4px; }
  .prem-plan-btn:hover:not(.prem-plan-btn--disabled) { opacity:.88; transform:scale(.98); }
  .prem-plan-btn--disabled { background:#1e2436; color:#4b5563; cursor:not-allowed; }
  .prem-plan-extend-note { font-size:10px; color:#6b7280; text-align:center; }

  /* Features */
  .prem-features-section,.prem-history-section,.prem-faq-section { background:#0d1020; border:1px solid #1e2436; border-radius:16px; padding:24px; }
  .prem-features-title { font-size:18px; font-weight:800; margin-bottom:16px; color:#f1f5f9; }
  .prem-features-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px; }
  .prem-feature-card { display:flex; align-items:center; gap:10px; padding:10px 12px; background:#131624; border:1px solid #1e2436; border-radius:10px; font-size:13px; color:#c1cde0; transition:border-color .15s; }
  .prem-feature-card:hover { border-color:#aa44ff33; }
  .prem-feature-icon { font-size:20px; flex-shrink:0; }
  .prem-feature-text { line-height:1.4; }

  /* History */
  .prem-history-list { display:flex; flex-direction:column; gap:8px; }
  .prem-history-row { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:#131624; border:1px solid #1e2436; border-radius:10px; flex-wrap:wrap; gap:8px; }
  .prem-history-left { display:flex; align-items:center; gap:10px; }
  .prem-history-plan { font-size:13px; font-weight:700; color:#f1f5f9; }
  .prem-history-date { font-size:11px; color:#6b7280; }
  .prem-history-right { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .prem-history-spent { font-size:13px; font-weight:700; color:#ef4444; }
  .prem-history-ruby  { color:#e11d48; }
  .prem-history-bonus { font-size:13px; font-weight:700; color:#22c55e; }

  /* FAQ */
  .prem-faq-list { display:flex; flex-direction:column; gap:6px; }
  .prem-faq-item { background:#131624; border:1px solid #1e2436; border-radius:10px; overflow:hidden; transition:border-color .15s; }
  .prem-faq-item--open { border-color:#aa44ff33; }
  .prem-faq-q { width:100%; padding:13px 16px; background:none; border:none; color:#f1f5f9; font-size:13px; font-weight:600; cursor:pointer; text-align:left; display:flex; align-items:center; gap:8px; }
  .prem-faq-q:hover { background:#1a1f35; }
  .prem-faq-a { padding:0 16px 13px; font-size:13px; color:#94a3b8; line-height:1.6; }

  /* Toast */
  .prem-toast { position:fixed; bottom:24px; right:24px; z-index:9999; padding:12px 18px; border-radius:10px; font-size:13px; font-weight:700; background:#0d1020; border:1px solid #1e2436; color:#f1f5f9; animation:premSlideUp .3s ease; box-shadow:0 4px 20px rgba(0,0,0,.5); max-width:340px; }
  .prem-toast--success { border-color:#22c55e44; color:#22c55e; }
  .prem-toast--error   { border-color:#ef444444; color:#ef4444; }
  @keyframes premSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  @media (max-width:600px) {
    .prem-plans-grid { grid-template-columns:1fr 1fr; }
    .prem-features-grid { grid-template-columns:1fr; }
    .prem-hero { padding:32px 16px 28px; }
  }
  @media (max-width:380px) {
    .prem-plans-grid { grid-template-columns:1fr; }
  }
`;
