import { useState, useEffect, useCallback } from 'react'

let _add = null
export function notify(msg, type = 'info', ms = 4000) {
  if (_add) _add({ msg, type, ms, id: Date.now() + Math.random() })
}

const CFG = {
  success: { bg: '#ecfdf5', border: '#34a853', text: '#065f46', icon: '#34a853', fi: 'fi-sr-check-circle' },
  error:   { bg: '#fef2f2', border: '#ea4335', text: '#991b1b', icon: '#ea4335', fi: 'fi-sr-cross-circle' },
  warning: { bg: '#fff8e1', border: '#fbbc04', text: '#78350f', icon: '#d97706', fi: 'fi-sr-triangle-warning' },
  info:    { bg: '#eff6ff', border: '#1a73e8', text: '#1e40af', icon: '#1a73e8', fi: 'fi-sr-info'           },
}

function Item({ n, onRemove }) {
  const [vis, setVis] = useState(false)
  const c = CFG[n.type] || CFG.info
  useEffect(() => {
    requestAnimationFrame(() => setVis(true))
    const t = setTimeout(() => { setVis(false); setTimeout(() => onRemove(n.id), 320) }, n.ms)
    return () => clearTimeout(t)
  }, [n.id, n.ms, onRemove])
  return (
    <div
      onClick={() => { setVis(false); setTimeout(() => onRemove(n.id), 320) }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: c.bg, border: `1.5px solid ${c.border}`, borderLeft: `4px solid ${c.border}`,
        borderRadius: 12, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,.12)',
        cursor: 'pointer', maxWidth: 360, width: '100%',
        transition: 'all .32s cubic-bezier(.34,1.56,.64,1)',
        transform: vis ? 'translateX(0) scale(1)' : 'translateX(120%) scale(0.88)',
        opacity: vis ? 1 : 0, fontFamily: 'Outfit, sans-serif',
      }}
    >
      <i className={`fi ${c.fi}`} style={{ color: c.icon, fontSize: 18, flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: '0.875rem', color: c.text, lineHeight: 1.55, flex: 1 }}>{n.msg}</span>
      <span style={{ color: c.icon, opacity: 0.55, fontSize: 18, flexShrink: 0, lineHeight: 1 }}>x</span>
    </div>
  )
}

export default function NotificationContainer() {
  const [list, setList] = useState([])
  const add    = useCallback(n => setList(p => [...p.slice(-4), n]), [])
  const remove = useCallback(id => setList(p => p.filter(n => n.id !== id)), [])
  useEffect(() => { _add = add; return () => { _add = null } }, [add])
  if (!list.length) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column-reverse', gap: 10, pointerEvents: 'none' }}>
      {list.map(n => <div key={n.id} style={{ pointerEvents: 'all' }}><Item n={n} onRemove={remove} /></div>)}
    </div>
  )
}
