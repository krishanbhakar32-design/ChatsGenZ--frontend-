import { useState, useEffect, useCallback, createContext, useContext } from 'react'

const ToastCtx = createContext(null)

export function useToast() {
  return useContext(ToastCtx)
}

const ICONS = {
  success: 'fi-sr-check-circle',
  error:   'fi-sr-circle-xmark',
  info:    'fi-sc-bell-ring',
  warn:    'fi-sr-triangle-warning',
  gift:    'fi-sr-gift',
  mention: 'fi-sr-at',
  join:    'fi-sr-user-add',
  kick:    'fi-sr-user-slash',
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
            <i className={`fi ${ICONS[t.type]||ICONS.info}`} style={{ fontSize:16, flexShrink:0 }}/>
            <span style={{ flex:1 }}>{t.msg}</span>
            <i className="fi fi-sr-cross-small" style={{ fontSize:12, opacity:0.7, flexShrink:0 }}/>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
