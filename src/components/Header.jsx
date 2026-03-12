import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const loc = useLocation()

  const navLinks = [
    { to: '/about',      label: 'About Us' },
    { to: '/rti',        label: 'RTI' },
    { to: '/blog',       label: 'Blog' },
    { to: '/forum',      label: 'Forum' },
    { to: '/disclaimer', label: 'Disclaimer' },
  ]

  return (
    <header className="header" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
      <div className="header-inner">
        {/* Logo */}
        <Link to="/" className="logo-wrap" onClick={() => setMobileOpen(false)}>
          <div className="logo-icon">
            {/* Replace with <img src="/logo.svg" alt="ChatsGenZ" /> when logo is ready */}
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
              <circle cx="8"  cy="11" r="1.5" fill="#1a73e8"/>
              <circle cx="12" cy="11" r="1.5" fill="#1a73e8"/>
              <circle cx="16" cy="11" r="1.5" fill="#1a73e8"/>
            </svg>
          </div>
          <span className="logo-name">Chats<span>GenZ</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="header-nav">
          {navLinks.map(l => (
            <Link
              key={l.to} to={l.to}
              style={{ fontWeight: loc.pathname === l.to ? 700 : 500,
                       color: loc.pathname === l.to ? 'var(--primary)' : undefined }}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/login" className="nav-cta">Start Chatting</Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      <nav className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        {navLinks.map(l => (
          <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}>{l.label}</Link>
        ))}
        <Link
          to="/login"
          onClick={() => setMobileOpen(false)}
          style={{ color: 'var(--primary)', fontWeight: 700 }}
        >
          ▶ Start Chatting Free
        </Link>
      </nav>
    </header>
  )
}
