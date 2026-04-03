/**
 * Permissions.jsx — ChatsGenZ Permission System
 * Exact port of CodyChat's 3-tab permission model:
 *   1. Member Permissions  (allow_*)
 *   2. Staff Permissions   (can_*)
 *   3. Room Staff Permissions (can_r*)
 *
 * Each tab has sub-tabs exactly mirroring CodyChat's setting_limit / setting_staff / setting_rstaff pages.
 * Each dropdown shows only ranks that are valid for that permission category.
 * Rank icons come from /icons/ranks/*.svg  (same public folder already in project).
 * Whisper field added manually.
 * Font Awesome 6 icons throughout.
 *
 * API: GET/PUT /api/admin/settings  (existing ChatsGenZ endpoint, no changes needed on backend)
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => localStorage.getItem('token');

const apiFetch = async (path, opts = {}) => {
  const r = await fetch(`${API}/api/admin${path}`, {
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Request failed'); }
  return r.json();
};

// ─── Rank definitions (mirrors CodyChat function_sranking.php) ────────────────

const SYSTEM_RANKS = [
  { id: 'guest',      label: 'Guest',       icon: '/icons/ranks/guest.svg',       color: '#888888', level: 0  },
  { id: 'user',       label: 'User',         icon: '/icons/ranks/user.svg',        color: '#aaaaaa', level: 1  },
  { id: 'vipfemale',  label: 'VIP Female',   icon: '/icons/ranks/vip_female.svg',  color: '#FF4488', level: 2  },
  { id: 'vipmale',    label: 'VIP Male',     icon: '/icons/ranks/vip_male.svg',    color: '#4488FF', level: 3  },
  { id: 'butterfly',  label: 'Butterfly',    icon: '/icons/ranks/butterfly.svg',   color: '#FF66AA', level: 4  },
  { id: 'ninja',      label: 'Ninja',        icon: '/icons/ranks/ninja.svg',       color: '#777777', level: 5  },
  { id: 'fairy',      label: 'Fairy',        icon: '/icons/ranks/fairy.svg',       color: '#FF88CC', level: 6  },
  { id: 'legend',     label: 'Legend',       icon: '/icons/ranks/legend.png',      color: '#FF8800', level: 7  },
  { id: 'bot',        label: 'Bot',          icon: '/icons/ranks/bot.svg',         color: '#00cc88', level: 8  },
  { id: 'premium',    label: 'Premium',      icon: '/icons/ranks/premium.svg',     color: '#aa44ff', level: 9  },
  { id: 'moderator',  label: 'Moderator',    icon: '/icons/ranks/mod.svg',         color: '#00AAFF', level: 10 },
  { id: 'admin',      label: 'Admin',        icon: '/icons/ranks/admin.svg',       color: '#FF4444', level: 11 },
  { id: 'superadmin', label: 'Super Admin',  icon: '/icons/ranks/super_admin.svg', color: '#FF00FF', level: 12 },
  { id: 'owner',      label: 'Owner',        icon: '/icons/ranks/owner.svg',       color: '#FFD700', level: 13 },
  { id: 'nobody',     label: 'Nobody',       icon: null,                           color: '#444444', level: 99 },
];

const ROOM_RANKS = [
  { id: 'user',       label: 'User',         icon: '/icons/ranks/user.svg',        color: '#aaaaaa' },
  { id: 'room_mod',   label: 'Room Mod',     icon: '/icons/ranks/room_mod.svg',    color: '#00AAFF' },
  { id: 'room_admin', label: 'Room Admin',   icon: '/icons/ranks/room_admin.svg',  color: '#FF4444' },
  { id: 'room_owner', label: 'Room Owner',   icon: '/icons/ranks/room_owner.svg',  color: '#FFD700' },
  { id: 'nobody',     label: 'Nobody',       icon: null,                           color: '#444444' },
];

// Rank filter helpers (mirrors CodyChat's listRank / listRankStaff / listRankSuper etc.)
const RANK_SETS = {
  all:        SYSTEM_RANKS,                                                                   // listRank
  member:     SYSTEM_RANKS.filter(r => r.id !== 'guest' && r.id !== 'nobody'),               // listRankMember
  staff:      SYSTEM_RANKS.filter(r => ['moderator','admin','superadmin','owner'].includes(r.id)), // listRankStaff
  staffExt:   SYSTEM_RANKS.filter(r => ['moderator','admin','superadmin','owner','nobody'].includes(r.id)), // listRankStaffExtend
  super:      SYSTEM_RANKS.filter(r => ['admin','superadmin','owner'].includes(r.id)),        // listRankSuper
  room:       ROOM_RANKS.filter(r => r.id !== 'user'),                                        // listRoomStaffRank
};

// ─── Permission field definitions (exact mirror of CodyChat PHP pages) ─────────

const MEMBER_TABS = [
  {
    id: 'account', label: 'Account', icon: 'fa-user-circle',
    fields: [
      { key: 'allow_avatar',  label: 'Change Avatar',        icon: 'fa-image',         ranks: 'all'    },
      { key: 'allow_name',    label: 'Change Username',       icon: 'fa-signature',     ranks: 'member' },
      { key: 'allow_cover',   label: 'Change Cover Photo',    icon: 'fa-panorama',      ranks: 'all'    },
      { key: 'allow_gcover',  label: 'Change GIF Cover',      icon: 'fa-film',          ranks: 'all'    },
      { key: 'allow_mood',    label: 'Set Mood/Status',       icon: 'fa-face-smile',    ranks: 'all'    },
      { key: 'allow_about',   label: 'Edit About / Bio',      icon: 'fa-pen-to-square', ranks: 'all'    },
    ],
  },
  {
    id: 'upload', label: 'Upload', icon: 'fa-upload',
    fields: [
      { key: 'allow_cupload', label: 'Chat Image Upload',    icon: 'fa-image',         ranks: 'all' },
      { key: 'allow_pupload', label: 'Profile Upload',       icon: 'fa-user-pen',      ranks: 'all' },
      { key: 'allow_wupload', label: 'Wall Image Upload',    icon: 'fa-wall',          ranks: 'all' },
      { key: 'allow_video',   label: 'Video Upload',         icon: 'fa-video',         ranks: 'all' },
      { key: 'allow_audio',   label: 'Audio Upload',         icon: 'fa-music',         ranks: 'all' },
      { key: 'allow_zip',     label: 'ZIP File Upload',      icon: 'fa-file-zipper',   ranks: 'all' },
    ],
  },
  {
    id: 'chat', label: 'Chat', icon: 'fa-comments',
    fields: [
      { key: 'allow_main',    label: 'Send to Main Chat',     icon: 'fa-comments',      ranks: 'all'    },
      { key: 'allow_private', label: 'Private Messages',      icon: 'fa-envelope',      ranks: 'all'    },
      { key: 'allow_whisper', label: 'Whisper Messages',      icon: 'fa-ear-listen',    ranks: 'all'    },
      { key: 'allow_quote',   label: 'Quote Messages',        icon: 'fa-quote-left',    ranks: 'all'    },
      { key: 'allow_pquote',  label: 'Quote Private Msgs',    icon: 'fa-quote-right',   ranks: 'all'    },
      { key: 'allow_direct',  label: 'Direct @ Mentions',     icon: 'fa-at',            ranks: 'all'    },
      { key: 'allow_scontent', label: 'Sensitive Content',    icon: 'fa-triangle-exclamation', ranks: 'all' },
      { key: 'allow_history', label: 'View Chat History',     icon: 'fa-clock-rotate-left', ranks: 'all' },
    ],
  },
  {
    id: 'display', label: 'Display', icon: 'fa-palette',
    fields: [
      { key: 'allow_name_color', label: 'Username Color',        icon: 'fa-droplet',     ranks: 'all' },
      { key: 'allow_name_grad',  label: 'Username Gradient',     icon: 'fa-swatchbook',  ranks: 'all' },
      { key: 'allow_name_neon',  label: 'Username Neon Effect',  icon: 'fa-lightbulb',   ranks: 'all' },
      { key: 'allow_name_font',  label: 'Username Font',         icon: 'fa-font',        ranks: 'all' },
      { key: 'allow_colors',     label: 'Bubble Text Color',     icon: 'fa-fill-drip',   ranks: 'all' },
      { key: 'allow_grad',       label: 'Bubble Gradient',       icon: 'fa-circle-half-stroke', ranks: 'all' },
      { key: 'allow_neon',       label: 'Bubble Neon Effect',    icon: 'fa-wand-magic-sparkles', ranks: 'all' },
      { key: 'allow_font',       label: 'Chat Message Font',     icon: 'fa-text-height',  ranks: 'all' },
      { key: 'allow_font_size',  label: 'Font Size Control',     icon: 'fa-text-height',  ranks: 'all' },
      { key: 'allow_msg_color',  label: 'Message Color',         icon: 'fa-paint-brush',  ranks: 'all' },
    ],
  },
  {
    id: 'other', label: 'Other', icon: 'fa-ellipsis',
    fields: [
      { key: 'allow_vroom',   label: 'View Rooms',              icon: 'fa-door-open',    ranks: 'all'    },
      { key: 'allow_room',    label: 'Create Rooms',            icon: 'fa-plus-square',  ranks: 'member' },
      { key: 'allow_theme',   label: 'Custom User Theme',       icon: 'fa-sun',          ranks: 'all'    },
      { key: 'allow_report',  label: 'Report Users',            icon: 'fa-flag',         ranks: 'all'    },
      { key: 'allow_rnews',   label: 'Read News',               icon: 'fa-newspaper',    ranks: 'all'    },
      { key: 'allow_dice',    label: 'Play Dice',               icon: 'fa-dice',         ranks: 'all'    },
      { key: 'allow_keno',    label: 'Play Keno',               icon: 'fa-grip-dots',    ranks: 'all'    },
      { key: 'allow_spin',    label: 'Spin Wheel',              icon: 'fa-arrows-spin',  ranks: 'all'    },
      { key: 'allow_games',   label: 'Access Games',            icon: 'fa-gamepad',      ranks: 'all'    },
      { key: 'allow_webcam',  label: 'Webcam Access',           icon: 'fa-camera',       ranks: 'all'    },
      { key: 'allow_vcall',   label: 'Video Calls',             icon: 'fa-video',        ranks: 'all'    },
      { key: 'allow_acall',   label: 'Audio Calls',             icon: 'fa-phone',        ranks: 'all'    },
      { key: 'allow_gcall',   label: 'Group Calls',             icon: 'fa-users',        ranks: 'all'    },
      { key: 'allow_wallet',    label: 'Access Wallet',         icon: 'fa-wallet',       ranks: 'all'    },
      { key: 'allow_send_gift', label: 'Send Gifts',            icon: 'fa-gift',         ranks: 'all'    },
      { key: 'allow_recv_gift', label: 'Receive Gifts',         icon: 'fa-box-open',     ranks: 'all'    },
    ],
  },
];

const STAFF_TABS = [
  {
    id: 'action', label: 'Actions', icon: 'fa-gavel',
    fields: [
      { key: 'can_mute',    label: 'Mute Users',           icon: 'fa-microphone-slash',  ranks: 'staff'    },
      { key: 'can_warn',    label: 'Warn Users',           icon: 'fa-triangle-exclamation', ranks: 'staff' },
      { key: 'can_kick',    label: 'Kick Users',           icon: 'fa-person-walking-arrow-right', ranks: 'staff' },
      { key: 'can_ghost',   label: 'Ghost Users',          icon: 'fa-ghost',             ranks: 'staff'    },
      { key: 'can_ban',     label: 'Ban Users',            icon: 'fa-ban',               ranks: 'staff'    },
      { key: 'can_delete',  label: 'Delete Messages',      icon: 'fa-trash',             ranks: 'staff'    },
      { key: 'can_rank',    label: 'Change User Rank',     icon: 'fa-star',              ranks: 'staff'    },
      { key: 'can_raction', label: 'Set Room Owner Rank',  icon: 'fa-crown',             ranks: 'staff'    },
    ],
  },
  {
    id: 'profile', label: 'Profile Actions', icon: 'fa-user-pen',
    fields: [
      { key: 'can_modavat',   label: 'Modify User Avatar',    icon: 'fa-image',           ranks: 'staff' },
      { key: 'can_modcover',  label: 'Modify User Cover',     icon: 'fa-panorama',        ranks: 'staff' },
      { key: 'can_modmood',   label: 'Modify User Mood',      icon: 'fa-face-smile',      ranks: 'staff' },
      { key: 'can_modabout',  label: 'Modify User About',     icon: 'fa-pen-to-square',   ranks: 'staff' },
      { key: 'can_modcolor',  label: 'Modify Username Color', icon: 'fa-droplet',         ranks: 'staff' },
      { key: 'can_modname',   label: 'Modify Username',       icon: 'fa-signature',       ranks: 'staff' },
      { key: 'can_modemail',  label: 'Modify User Email',     icon: 'fa-envelope',        ranks: 'staff' },
      { key: 'can_modpass',   label: 'Reset User Password',   icon: 'fa-key',             ranks: 'staff' },
      { key: 'can_modvpn',    label: 'Toggle VPN Block',      icon: 'fa-shield',          ranks: 'staff' },
      { key: 'can_modblock',  label: 'Manage User Blocks',    icon: 'fa-circle-minus',    ranks: 'staff' },
      { key: 'can_auth',      label: 'Toggle Auth Status',    icon: 'fa-user-check',      ranks: 'staff' },
      { key: 'can_verify',    label: 'Verify Users',          icon: 'fa-badge-check',     ranks: 'staff' },
      { key: 'can_note',      label: 'Add Staff Notes',       icon: 'fa-sticky-note',     ranks: 'staff' },
    ],
  },
  {
    id: 'display_staff', label: 'View Access', icon: 'fa-eye',
    fields: [
      { key: 'can_vghost',   label: 'View Ghost Users',       icon: 'fa-ghost',           ranks: 'staffExt' },
      { key: 'can_vip',      label: 'View User IPs',          icon: 'fa-globe',           ranks: 'staff'    },
      { key: 'can_vemail',   label: 'View User Emails',       icon: 'fa-envelope-open',   ranks: 'staff'    },
      { key: 'can_vname',    label: 'View Real Names',        icon: 'fa-id-card',         ranks: 'staff'    },
      { key: 'can_vhistory', label: 'View Message History',   icon: 'fa-clock-rotate-left', ranks: 'staff'  },
      { key: 'can_vwallet',  label: 'View User Wallet',       icon: 'fa-wallet',          ranks: 'staff'    },
      { key: 'can_vother',   label: 'View Other Sensitive Data', icon: 'fa-database',     ranks: 'staff'    },
    ],
  },
  {
    id: 'system', label: 'System', icon: 'fa-server',
    fields: [
      { key: 'can_news',     label: 'Post News / Announcements', icon: 'fa-newspaper',   ranks: 'super' },
      { key: 'can_mcontact', label: 'Manage Contact Reports',    icon: 'fa-envelope-circle-check', ranks: 'super' },
      { key: 'can_mip',      label: 'Manage IP Bans',            icon: 'fa-ban',         ranks: 'super' },
      { key: 'can_mplay',    label: 'Manage Media Player',       icon: 'fa-play-circle', ranks: 'super' },
      { key: 'can_mlogs',    label: 'View System Logs',          icon: 'fa-scroll',      ranks: 'super' },
      { key: 'can_mroom',    label: 'Manage Rooms (Global)',     icon: 'fa-door-open',   ranks: 'super' },
      { key: 'can_mfilter',  label: 'Manage Word Filters',       icon: 'fa-filter',      ranks: 'super' },
      { key: 'can_maddons',  label: 'Manage Addons',             icon: 'fa-puzzle-piece', ranks: 'super' },
      { key: 'can_dj',       label: 'DJ / Radio Control',        icon: 'fa-music',       ranks: 'super' },
      { key: 'can_cuser',    label: 'Create Users',              icon: 'fa-user-plus',   ranks: 'staff' },
    ],
  },
  {
    id: 'other_staff', label: 'Other', icon: 'fa-ellipsis',
    fields: [
      { key: 'can_inv',    label: 'Send Invitations',       icon: 'fa-paper-plane',  ranks: 'staff' },
      { key: 'can_content', label: 'Manage Site Content',  icon: 'fa-file-pen',     ranks: 'staff' },
      { key: 'can_topic',   label: 'Set Room Topics',       icon: 'fa-bookmark',     ranks: 'staff' },
      { key: 'can_clear',   label: 'Clear Chat History',    icon: 'fa-broom',        ranks: 'staff' },
      { key: 'can_rpass',   label: 'Set Room Password',     icon: 'fa-lock',         ranks: 'staff' },
      { key: 'can_bpriv',   label: 'Block Private Messages', icon: 'fa-comments-slash', ranks: 'staff' },
    ],
  },
];

const ROOM_TABS = [
  {
    id: 'room_action', label: 'Room Actions', icon: 'fa-door-open',
    fields: [
      { key: 'can_rlogs',  label: 'View Room Logs',    icon: 'fa-scroll',  ranks: 'room' },
      { key: 'can_rclear', label: 'Clear Room Chat',   icon: 'fa-broom',   ranks: 'room' },
    ],
    note: 'Room staff ranks: Room Mod, Room Admin, Room Owner',
  },
];

// ─── Sub-component: Rank Dropdown with icon ───────────────────────────────────

function RankSelect({ value, onChange, rankSet }) {
  const ranks = RANK_SETS[rankSet] || RANK_SETS.all;
  const current = ranks.find(r => r.id === value) || ranks[0];

  return (
    <div className="perm-select-wrap">
      <div className="perm-select-preview" style={{ color: current?.color }}>
        {current?.icon
          ? <img src={current.icon} alt="" className="perm-rank-icon" onError={e => { e.target.style.display='none'; }} />
          : <i className="fa-solid fa-circle-xmark" style={{ opacity: 0.4 }} />
        }
        <span>{current?.label}</span>
      </div>
      <select
        className="perm-native-select"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        {ranks.map(r => (
          <option key={r.id} value={r.id}>{r.label}</option>
        ))}
      </select>
      <i className="fa-solid fa-chevron-down perm-select-caret" />
    </div>
  );
}

// ─── Sub-component: Permission Row ────────────────────────────────────────────

function PermRow({ field, value, onChange }) {
  return (
    <div className="perm-row">
      <div className="perm-row-label">
        <i className={`fa-solid ${field.icon} perm-row-icon`} />
        <span>{field.label}</span>
      </div>
      <RankSelect value={value} onChange={onChange} rankSet={field.ranks} />
    </div>
  );
}

// ─── Sub-component: Permission Tab Panel ─────────────────────────────────────

function PermTabPanel({ tabs, settings, onChange, onSave, saving }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);
  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="perm-panel">
      {/* Sub-tabs */}
      <div className="perm-subtabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`perm-subtab ${activeTab === tab.id ? 'perm-subtab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fa-solid ${tab.icon}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="perm-fields-wrap">
        {currentTab?.note && (
          <div className="perm-note">
            <i className="fa-solid fa-circle-info" />
            <span>{currentTab.note}</span>
          </div>
        )}
        <div className="perm-fields">
          {currentTab?.fields.map(field => (
            <PermRow
              key={field.key}
              field={field}
              value={settings[field.key]}
              onChange={val => onChange(field.key, val)}
            />
          ))}
        </div>
        <div className="perm-save-bar">
          <button
            className="perm-save-btn"
            onClick={() => onSave(currentTab)}
            disabled={saving}
          >
            {saving
              ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</>
              : <><i className="fa-solid fa-floppy-disk" /> Save {currentTab?.label} Permissions</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Permissions Component ───────────────────────────────────────────────

export default function Permissions() {
  const [settings, setSettings]   = useState(null);
  const [mainTab,  setMainTab]    = useState('member');
  const [saving,   setSaving]     = useState(false);

  const toast = (msg, type = 'success') => {
    const el = document.createElement('div');
    el.className = `ap-toast ap-toast--${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  };

  const load = useCallback(() =>
    apiFetch('/settings')
      .then(d => setSettings(d.settings))
      .catch(() => toast('Failed to load settings', 'error'))
  , []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (key, val) => {
    setSettings(s => {
      const next = { ...s, [key]: val };
      // Keep allow_wallet and minRankWallet in sync
      if (key === 'allow_wallet') next.minRankWallet = val;
      if (key === 'minRankWallet') next.allow_wallet = val;
      return next;
    });
  };

  const handleSave = async (tab) => {
    if (!settings) return;
    setSaving(true);
    try {
      // Collect only the keys belonging to this tab
      const payload = {};
      (tab?.fields || []).forEach(f => {
        if (settings[f.key] !== undefined) payload[f.key] = settings[f.key];
      });
      // If allow_wallet is in this tab, also sync minRankWallet
      if (payload.allow_wallet !== undefined) payload.minRankWallet = payload.allow_wallet;
      await apiFetch('/settings/permissions', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast(`${tab?.label} permissions saved!`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="ap-section">
        <div className="ap-loading"><i className="fa-solid fa-spinner fa-spin" /></div>
      </div>
    );
  }

  const MAIN_TABS = [
    { id: 'member', label: 'Member Permissions', icon: 'fa-users',       tabs: MEMBER_TABS },
    { id: 'staff',  label: 'Staff Permissions',  icon: 'fa-user-shield', tabs: STAFF_TABS  },
    { id: 'room',   label: 'Room Permissions',   icon: 'fa-door-open',   tabs: ROOM_TABS   },
  ];

  const active = MAIN_TABS.find(t => t.id === mainTab);

  return (
    <div className="ap-section perm-root">
      {/* Section title */}
      <h2 className="ap-section-title">
        <i className="fa-solid fa-shield-halved" /> Permission System
      </h2>

      {/* Rank legend */}
      <div className="perm-legend">
        {SYSTEM_RANKS.filter(r => r.id !== 'nobody').map(r => (
          <div key={r.id} className="perm-legend-item" title={r.label}>
            {r.icon
              ? <img src={r.icon} alt={r.label} className="perm-legend-icon" onError={e => { e.target.style.display='none'; }} />
              : <i className="fa-solid fa-circle" style={{ color: r.color, fontSize: 12 }} />
            }
            <span style={{ color: r.color }}>{r.label}</span>
          </div>
        ))}
      </div>

      {/* Main tabs */}
      <div className="perm-main-tabs">
        {MAIN_TABS.map(t => (
          <button
            key={t.id}
            className={`perm-main-tab ${mainTab === t.id ? 'perm-main-tab--active' : ''}`}
            onClick={() => setMainTab(t.id)}
          >
            <i className={`fa-solid ${t.icon}`} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Active tab panel */}
      {active && (
        <PermTabPanel
          key={active.id}
          tabs={active.tabs}
          settings={settings}
          onChange={handleChange}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {/* Rank style quick-reference */}
      <div className="perm-rank-ref">
        <div className="perm-rank-ref-title">
          <i className="fa-solid fa-circle-info" /> Rank Reference
        </div>
        <div className="perm-rank-ref-grid">
          <div className="perm-rank-ref-group">
            <div className="perm-rank-ref-group-title"><i className="fa-solid fa-users" /> System Ranks (level ↑)</div>
            {SYSTEM_RANKS.filter(r => r.id !== 'nobody').map(r => (
              <div key={r.id} className="perm-rank-ref-row">
                {r.icon
                  ? <img src={r.icon} alt="" className="perm-ref-icon" onError={e => { e.target.style.display='none'; }} />
                  : <span style={{ width: 16 }} />
                }
                <span style={{ color: r.color, fontWeight: 600 }}>{r.label}</span>
                <span className="perm-ref-desc">— min. rank to use this feature</span>
              </div>
            ))}
          </div>
          <div className="perm-rank-ref-group">
            <div className="perm-rank-ref-group-title"><i className="fa-solid fa-door-open" /> Room Ranks</div>
            {ROOM_RANKS.filter(r => r.id !== 'nobody').map(r => (
              <div key={r.id} className="perm-rank-ref-row">
                {r.icon
                  ? <img src={r.icon} alt="" className="perm-ref-icon" onError={e => { e.target.style.display='none'; }} />
                  : <span style={{ width: 16 }} />
                }
                <span style={{ color: r.color, fontWeight: 600 }}>{r.label}</span>
              </div>
            ))}
            <div className="perm-ref-hint">
              <i className="fa-solid fa-lightbulb" />
              <span>Room permission settings only apply to room-level staff actions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

export const PERMISSIONS_CSS = `
/* ═══════════════════════════════════════════════
   PERMISSION SYSTEM STYLES
   ═══════════════════════════════════════════════ */

.perm-root { max-width: 960px; margin: 0 auto; }

/* Rank legend */
.perm-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  padding: 10px 14px;
  background: #0d1020;
  border: 1px solid #1e2436;
  border-radius: 10px;
  margin-bottom: 16px;
}
.perm-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
}
.perm-legend-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

/* Main tabs */
.perm-main-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.perm-main-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 8px;
  border: 1px solid #1e2436;
  background: #0d1020;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
}
.perm-main-tab:hover { background: #131624; color: #f1f5f9; }
.perm-main-tab--active {
  background: #1e3a5f;
  border-color: #3b82f6;
  color: #3b82f6;
}

/* Panel */
.perm-panel {
  background: #0d1020;
  border: 1px solid #1e2436;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

/* Sub-tabs */
.perm-subtabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  border-bottom: 1px solid #1e2436;
  background: #131624;
}
.perm-subtab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-right: 1px solid #1e2436;
  background: transparent;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
}
.perm-subtab:hover { color: #f1f5f9; background: #1e2436; }
.perm-subtab--active {
  color: #3b82f6;
  background: #0d1020;
  border-bottom: 2px solid #3b82f6;
  margin-bottom: -1px;
}

/* Fields */
.perm-fields-wrap { padding: 0 16px 16px; }
.perm-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin: 12px 0 4px;
  background: #1a2a4a;
  border-left: 3px solid #3b82f6;
  border-radius: 6px;
  font-size: 12px;
  color: #93c5fd;
}
.perm-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
  margin-top: 12px;
}
@media (max-width: 640px) {
  .perm-fields { grid-template-columns: 1fr; }
}

/* Permission row */
.perm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #131624;
  border: 1px solid #1e2436;
  transition: border-color .15s;
}
.perm-row:hover { border-color: #3b82f644; }
.perm-row-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #c1cde0;
  flex: 1;
  min-width: 0;
}
.perm-row-icon {
  color: #3b82f6;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
  font-size: 12px;
}

/* Custom rank select */
.perm-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: #0a0c16;
  border: 1px solid #2a3350;
  border-radius: 7px;
  padding: 4px 28px 4px 8px;
  min-width: 148px;
  cursor: pointer;
  transition: border-color .15s;
  flex-shrink: 0;
}
.perm-select-wrap:hover { border-color: #3b82f6; }
.perm-select-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  pointer-events: none;
}
.perm-rank-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}
.perm-native-select {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
}
.perm-select-caret {
  position: absolute;
  right: 8px;
  font-size: 10px;
  color: #6b7280;
  pointer-events: none;
}

/* Save bar */
.perm-save-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.perm-save-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border-radius: 8px;
  border: none;
  background: #3b82f6;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity .15s, transform .1s;
}
.perm-save-btn:hover { opacity: .88; }
.perm-save-btn:active { transform: scale(.97); }
.perm-save-btn:disabled { opacity: .45; cursor: not-allowed; }

/* Rank reference */
.perm-rank-ref {
  background: #0d1020;
  border: 1px solid #1e2436;
  border-radius: 12px;
  padding: 14px 16px;
  margin-top: 6px;
}
.perm-rank-ref-title {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: .5px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.perm-rank-ref-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
@media (max-width: 640px) { .perm-rank-ref-grid { grid-template-columns: 1fr; } }
.perm-rank-ref-group-title {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.perm-rank-ref-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  padding: 3px 0;
}
.perm-ref-icon { width: 16px; height: 16px; object-fit: contain; }
.perm-ref-desc { color: #4b5563; }
.perm-ref-hint {
  margin-top: 10px;
  padding: 8px;
  background: #131624;
  border-radius: 6px;
  font-size: 11px;
  color: #6b7280;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.perm-ref-hint i { color: #f59e0b; margin-top: 1px; flex-shrink: 0; }
`;
