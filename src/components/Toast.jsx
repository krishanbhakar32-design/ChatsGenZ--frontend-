import { useState, useEffect, useCallback, createContext, useContext } from 'react'

const ToastCtx = createContext(null)

export function useToast() {
  return useContext(ToastCtx)
}

const ICONS = {
  success: 'fa-solid fa-circle-check',
  error:   'fa-solid fa-circle-xmark',
  info:    'fa-solid fa-bell',
  warn:    'fa-solid fa-triangle-exclamation',
  gift:    'fa-solid fa-gift',
  mention: 'fa-solid fa-at',
  join:    'fa-solid fa-user-plus',
  kick:    'fa-solid fa-user-slash',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((msg, type='info', duration=3500) => {
    const id = Date.now() + Math.random()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration)
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  return (
    <ToastCtx.Provider value={{ show, dismiss }}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}
            onClick={()=>dismiss(t.id)}
            style={{ cursor:'pointer' }}
          >
            <i className={`${ICONS[t.type]||ICONS.info}`} style={{ fontSize:16, flexShrink:0 }}/>
            <span style={{ flex:1 }}>{t.msg}</span>
            <i className="fa-solid fa-xmark" style={{ fontSize:12, opacity:0.7, flexShrink:0 }}/>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
