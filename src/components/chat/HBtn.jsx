/**
 * HBtn.jsx — Header icon button with optional badge dot
 */
export default function HBtn({ icon, title, badge, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        position: 'relative',
        background: active ? '#e8f0fe' : 'none',
        border: 'none',
        cursor: 'pointer',
        color: active ? '#1a73e8' : '#9ca3af',
        width: 34,
        height: 34,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        transition: 'all .15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#f3f4f6'
        e.currentTarget.style.color = '#374151'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = active ? '#e8f0fe' : 'none'
        e.currentTarget.style.color = active ? '#1a73e8' : '#9ca3af'
      }}
    >
      <i className={`fi ${icon}`} />
      {badge > 0 && (
        <span style={{
          position: 'absolute',
          top: 5,
          right: 5,
          width: 7,
          height: 7,
          background: '#ef4444',
          borderRadius: '50%',
          border: '1.5px solid #fff',
        }} />
      )}
    </button>
  )
}
