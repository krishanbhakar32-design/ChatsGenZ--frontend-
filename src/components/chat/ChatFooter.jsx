/**
 * ChatFooter.jsx
 * Bottom bar with Radio toggle and User List toggle.
 */
export default function ChatFooter({ showRadio, setShowRadio, showRight, setRight, notif }) {
  return (
    <div style={{ background: '#fff', borderTop: '1px solid #e4e6ea', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      {/* Radio */}
      <button
        onClick={() => setShowRadio(s => !s)}
        title="Radio"
        style={{ background: showRadio ? '#e8f0fe' : 'none', border: 'none', cursor: 'pointer', color: showRadio ? '#1a73e8' : '#9ca3af', width: 34, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}
      >
        <i className="fi fi-sr-radio" />
      </button>

      <div style={{ flex: 1 }} />

      {/* User list */}
      <button
        onClick={() => setRight(s => !s)}
        title="User List"
        style={{ position: 'relative', background: showRight ? '#e8f0fe' : 'none', border: 'none', cursor: 'pointer', color: showRight ? '#1a73e8' : '#9ca3af', width: 34, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}
      >
        <i className="fi fi-sr-list" />
        {notif.friends > 0 && (
          <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, background: '#ef4444', borderRadius: '50%', border: '1.5px solid #fff' }} />
        )}
      </button>
    </div>
  )
}
