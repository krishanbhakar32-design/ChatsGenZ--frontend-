// ============================================================
// siteConfig.js — Single source of truth for all site settings
//
// Change values here to rebrand or update the entire site.
// All pages/components import from this file.
// ============================================================

// ── SITE IDENTITY ──────────────────────────────────────────
export const SITE_NAME    = 'ChatsGenZ'
export const SITE_TAGLINE = 'Free Live Chat Rooms | Talk to Strangers Online'
export const SITE_SLOGAN  = 'Connect. Chat. Have Fun — Free & Forever.'

// ── SITE URLs ──────────────────────────────────────────────
export const SITE_URL     = import.meta.env.VITE_SITE_URL     || 'https://chatsgenz.vercel.app'
export const API_URL      = import.meta.env.VITE_API_URL      || 'https://chatsgenz-backend-production.up.railway.app'

// ── CONTACT / SUPPORT ──────────────────────────────────────
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'helpchatsgenz@gmail.com'
export const DMCA_EMAIL    = import.meta.env.VITE_DMCA_EMAIL    || 'helpchatsgenz@gmail.com'
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'helpchatsgenz@gmail.com'

// ── ASSETS ─────────────────────────────────────────────────
export const SITE_LOGO    = '/favicon/favicon-192.png'
export const SITE_LOGO_BIG = '/favicon/favicon-512.png'
export const SITE_FAVICON = '/favicon/favicon-32.png'

// ── SEO DEFAULTS ───────────────────────────────────────────
export const DEFAULT_DESC = `${SITE_NAME} is a free live chat platform for everyone worldwide. Join public chat rooms, talk to strangers, video chat, earn ranks, send gifts and play games on ${SITE_NAME}. No registration required.`
export const DEFAULT_KW   = `${SITE_NAME}, free chat rooms, talk to strangers, live chat online, video chat, no registration chat, free chatting site, online chat worldwide, stranger chat, global chat rooms`
export const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon/favicon-512.png`

// ── SOCIAL LINKS (optional — set to '' to hide) ────────────
export const SOCIAL_TWITTER   = import.meta.env.VITE_SOCIAL_TWITTER   || ''
export const SOCIAL_INSTAGRAM = import.meta.env.VITE_SOCIAL_INSTAGRAM || ''
export const SOCIAL_DISCORD   = import.meta.env.VITE_SOCIAL_DISCORD   || ''

// ── AD ZONES (MagSrv + ProfitableCPM) ─────────────────────
// Set to '' to disable an ad zone
export const AD_BANNER_ZONE        = import.meta.env.VITE_AD_BANNER_ZONE        || '5884718'
export const AD_BANNER_CLASS       = import.meta.env.VITE_AD_BANNER_CLASS       || 'eas6a97888e17'
export const AD_VAST_ZONE_1        = import.meta.env.VITE_AD_VAST_ZONE_1        || '5885566'
export const AD_VAST_ZONE_2        = import.meta.env.VITE_AD_VAST_ZONE_2        || '5885250'
export const AD_IFRAME_SRC         = import.meta.env.VITE_AD_IFRAME_SRC         || 'https://www.profitablecpmratenetwork.com/i9zvju0s?key=a0c9b72757ee0470a77cb3dfb7e652fa'

// ── WEBHOOKS (frontend-facing, e.g. payment callbacks) ─────
// These are handled on the backend via env vars.
// Listed here for documentation purposes only.
// Backend env vars: WEBHOOK_SECRET, PAYMENT_WEBHOOK_URL

// ── MISC ───────────────────────────────────────────────────
export const COPYRIGHT_YEAR = new Date().getFullYear()
export const COPYRIGHT_TEXT = `© ${COPYRIGHT_YEAR} ${SITE_NAME}. All rights reserved.`
