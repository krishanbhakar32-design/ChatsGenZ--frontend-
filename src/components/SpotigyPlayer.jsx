// ============================================================
// SpotifyPlayer.jsx — Spotify message renderer
// Renders a Spotify embed card inside the chat when a user
// shares a Spotify link via the "+" menu → Spotify button.
//
// FRONTEND-READY:
//   • Parses open.spotify.com links for track/playlist/album/artist
//   • Renders the official Spotify iframe embed widget
//   • No backend required — works with public Spotify embeds
//   • Ready to be extended with Spotify Web API (OAuth) later
// ============================================================

/**
 * SpotifyEmbed
 * Renders a Spotify embed inside a chat message bubble.
 *
 * @param {string}  url     — Full Spotify URL, e.g. https://open.spotify.com/track/ID
 * @param {boolean} compact — If true, renders a compact 80px track bar
 */
export function SpotifyEmbed({ url, compact = false }) {
  const parsed = parseSpotifyUrl(url)
  if (!parsed) return null

  const { type, id } = parsed
  const embedUrl = `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`

  // track → compact: 80px | full: 152px   •   playlist/album/artist → 352px
  const height = type === 'track' ? (compact ? 80 : 152) : 352

  return (
    <div style={{
      borderRadius: 12,
      overflow: 'hidden',
      maxWidth: 360,
      margin: '4px 0',
      boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
    }}>
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ display: 'block' }}
        title={`Spotify ${type}`}
      />
    </div>
  )
}

/**
 * parseSpotifyUrl
 * Accepts open.spotify.com URLs and spotify: URIs.
 * Returns { type, id } or null.
 */
export function parseSpotifyUrl(raw) {
  if (!raw || typeof raw !== 'string') return null
  const url = raw.trim()

  // Web URL: https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
  const webMatch = url.match(
    /open\.spotify\.com\/(track|playlist|album|artist)\/([A-Za-z0-9]+)/
  )
  if (webMatch) return { type: webMatch[1], id: webMatch[2] }

  // Spotify URI: spotify:track:4iV5W9uYEdYUVa79Axb7Rh
  const uriMatch = url.match(
    /spotify:(track|playlist|album|artist):([A-Za-z0-9]+)/
  )
  if (uriMatch) return { type: uriMatch[1], id: uriMatch[2] }

  return null
}

/**
 * isSpotifyUrl
 * Quick boolean check — used by the message renderer (ChatMessages.jsx)
 * to detect whether a message content should render as a Spotify embed.
 */
export function isSpotifyUrl(url) {
  return parseSpotifyUrl(url) !== null
}

// Legacy default export — superseded by SpotifyEmbedPanel inline in ChatRoom.jsx
export default function SpotigyPlayer() { return null }
