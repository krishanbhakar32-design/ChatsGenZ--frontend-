/**
 * PromoComponents.jsx
 * ─────────────────────────────────────────────────────────────
 * Shared promotional UI used across Home, Login, and ChatRoom.
 *
 * Exports:
 *   <VastVideoAd />   — VAST pre-roll video ad player (homepage only)
 *   <DesiChatCTA />   — Affiliate CTA button (all 3 pages)
 */
import { useEffect, useRef, useState } from 'react'

/* ─── VAST Video Player ──────────────────────────────────────────────────── */
/*
 * Loads the VAST XML, parses the MediaFile URL, plays it inline.
 * - Muted autoplay so it works on mobile without a gesture
 * - User can unmute / skip after 5 s
 * - Never blocks page interaction (positioned inside normal flow)
 */
const VAST_URL_1 = 'https://s.magsrv.com/v1/vast.php?idzone=5885566'  // Login page video
const VAST_URL_2 = 'https://s.magsrv.com/v1/vast.php?idzone=5885250'  // Home page video

export function VastVideoAd({ zone = 2 }) {
  const videoRef   = useRef(null)
  const [src,  setSrc]    = useState(null)
  const [err,  setErr]    = useState(false)
  const [muted, setMuted] = useState(true)
  const [canSkip, setCanSkip] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [clickUrl, setClickUrl]   = useState(null)

  useEffect(() => {
    // bot guard
    if (navigator.webdriver || window.outerWidth === 0) return

    let cancelled = false
    const vastUrl = zone === 1 ? VAST_URL_1 : VAST_URL_2
    const load = async () => {
      try {
        const res  = await fetch(vastUrl)
        const text = await res.text()
        const parser = new DOMParser()
        const doc    = parser.parseFromString(text, 'application/xml')

        // grab first MediaFile
        const media = doc.querySelector('MediaFile')
        if (!media) { setErr(true); return }
        const mediaUrl = media.textContent?.trim()
        if (!mediaUrl || cancelled) return
        setSrc(mediaUrl)

        // grab click-through
        const ct = doc.querySelector('ClickThrough')
        if (ct) setClickUrl(ct.textContent?.trim())
      } catch {
        setErr(true)
      }
    }
    // delay slightly so page content renders first
    const t = setTimeout(load, 1200)
    return () => { cancelled = true; clearTimeout(t) }
  }, [])

  // skip timer
  useEffect(() => {
    if (!src) return
    const t = setTimeout(() => setCanSkip(true), 5000)
    return () => clearTimeout(t)
  }, [src])

  if (err || dismissed || !src) return null

  return (
    <div style={{
      position: 'relative',
      background: '#000',
      borderRadius: 12,
      overflow: 'hidden',
      maxWidth: 560,
      margin: '0 auto 0',
      boxShadow: '0 8px 32px rgba(0,0,0,.22)',
    }}>
      {/* click overlay → ad destination */}
      {clickUrl && (
        <a
          href={clickUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ position:'absolute', inset:0, zIndex:1 }}
          aria-label="Ad"
        />
      )}

      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted={muted}
        playsInline
        loop={false}
        style={{ width:'100%', display:'block', maxHeight:280, objectFit:'cover' }}
        onEnded={() => setDismissed(true)}
      />

      {/* Ad label */}
      <div style={{
        position:'absolute', top:8, left:10, zIndex:3,
        background:'rgba(0,0,0,.55)', borderRadius:4,
        padding:'2px 7px', fontSize:'0.68rem', color:'rgba(255,255,255,.7)',
        fontFamily:'Outfit,sans-serif', letterSpacing:.3, pointerEvents:'none',
      }}>Ad</div>

      {/* Controls row */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:3,
        display:'flex', alignItems:'center', justifyContent:'flex-end', gap:6,
        padding:'6px 10px',
        background:'linear-gradient(transparent,rgba(0,0,0,.6))',
      }}>
        {/* mute toggle */}
        <button
          onClick={e => { e.stopPropagation(); setMuted(m => !m) }}
          style={ctrlBtn}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        {/* skip */}
        <button
          onClick={e => { e.stopPropagation(); setDismissed(true) }}
          disabled={!canSkip}
          style={{
            ...ctrlBtn,
            opacity: canSkip ? 1 : 0.45,
            cursor: canSkip ? 'pointer' : 'not-allowed',
          }}
          title={canSkip ? 'Skip ad' : 'Skip in 5s'}
        >
          {canSkip ? 'Skip ›' : 'Skip in 5s'}
        </button>
      </div>
    </div>
  )
}

const ctrlBtn = {
  background: 'rgba(0,0,0,.55)',
  border: '1px solid rgba(255,255,255,.25)',
  borderRadius: 6,
  color: '#fff',
  fontSize: '0.75rem',
  padding: '3px 9px',
  cursor: 'pointer',
  fontFamily: 'Outfit,sans-serif',
  fontWeight: 700,
  lineHeight: 1.6,
}

/* ─── Desi Chat CTA Button ───────────────────────────────────────────────── */
/*
 * variant:
 *   'hero'    → large, full-width-ish, used in hero sections  (Home / Login)
 *   'compact' → smaller pill, used in the chatroom footer bar
 */
const CTA_URL = 'https://www.profitablecpmratenetwork.com/i9zvju0s?key=a0c9b72757ee0470a77cb3dfb7e652fa'

export function DesiChatCTA({ variant = 'hero' }) {
  const [hover, setHover] = useState(false)

  if (variant === 'compact') {
    return (
      <a
        href={CTA_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 13px',
          borderRadius: 20,
          background: hover
            ? 'linear-gradient(135deg,#ff416c,#c0135a)'
            : 'linear-gradient(135deg,#ff6b6b,#ff416c)',
          color: '#fff',
          fontWeight: 800,
          fontSize: '0.75rem',
          fontFamily: 'Outfit,sans-serif',
          textDecoration: 'none',
          boxShadow: hover
            ? '0 4px 16px rgba(255,65,108,.55)'
            : '0 2px 10px rgba(255,65,108,.35)',
          transition: 'all .18s',
          whiteSpace: 'nowrap',
          letterSpacing: .2,
          transform: hover ? 'translateY(-1px)' : 'none',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13 }}>🎥</span>
        Start Video Chat
      </a>
    )
  }

  /* hero variant */
  return (
    <div style={{ marginTop: 20 }}>
      <a
        href={CTA_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '13px 28px',
          borderRadius: 13,
          background: hover
            ? 'linear-gradient(135deg,#e8004f,#ff416c,#ff9f43)'
            : 'linear-gradient(135deg,#ff416c,#ff9f43)',
          color: '#fff',
          fontWeight: 900,
          fontSize: 'clamp(0.9rem,2.5vw,1rem)',
          fontFamily: 'Outfit,sans-serif',
          textDecoration: 'none',
          boxShadow: hover
            ? '0 8px 28px rgba(255,65,108,.6)'
            : '0 4px 18px rgba(255,65,108,.38)',
          transition: 'all .2s',
          transform: hover ? 'translateY(-2px) scale(1.02)' : 'none',
          border: '1.5px solid rgba(255,255,255,.18)',
          letterSpacing: .2,
          width: '100%',
          maxWidth: 320,
        }}
      >
        {/* pulse dot */}
        <span style={{
          width: 8, height: 8,
          background: '#fff',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'ctaPulse 1.4s infinite',
          flexShrink: 0,
        }} />
        🇮🇳 Join Desi Chat — Free Video Call
        <span style={{ fontSize: 16 }}>→</span>
      </a>
      <div style={{
        marginTop: 6,
        fontSize: '0.72rem',
        color: '#9ca3af',
        textAlign: 'center',
        fontFamily: 'Outfit,sans-serif',
      }}>
        No registration needed · 100% Free
      </div>
      <style>{`
        @keyframes ctaPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.4; transform:scale(1.5); }
        }
      `}</style>
    </div>
  )
}
