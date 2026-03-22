import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import NotificationContainer from './components/Notification.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        {/* BUG FIX: AuthProvider was defined but never wrapped the app */}
        <AuthProvider>
          <App />
          <NotificationContainer />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)
