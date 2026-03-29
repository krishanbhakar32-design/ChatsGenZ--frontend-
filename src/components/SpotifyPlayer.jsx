// ============================================================
// SpotifyPlayer.jsx — Spotify embed renderer for chat messages
//
// FRONTEND-READY:
//   • Parses open.spotify.com URLs and spotify: URIs
//   • Renders the official Spotify iframe embed widget
//   • No backend required — uses public Spotify embeds
//   • Extend later with Spotify Web API (OAuth) if needed
//
// Exports:
//   SpotifyEmbed   — iframe embed card, used in ChatMessages
//   parseSpotifyUrl — parse URL → { type, id } or null
//   isSpotifyUrl   — boolean quick-check for message renderer
// ============================================================

/**
 * SpotifyEmbed
 * Renders a Spotify embed card inside a chat message bubble.
 *
 * @param {string}  url     — e.g. https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
 * @param {boolean} compact — true → 80px track bar, false → 152px player (default)
 */
export function SpotifyEmbed({ url, compact = false }) {
  const parsed = parseSpotifyUrl(url)
  if (!parsed) return null

  const { type, id } = parsed
  const embedUrl = `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`

  // track  → compact: 80px | full: 152px
  // others (playlist / album / artist) → 352px
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
 * Supported types: track | playlist | album | artist
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
 * Quick boolean check used by ChatMessages to decide
 * whether to render a SpotifyEmbed instead of plain text.
 */
export function isSpotifyUrl(url) {
  return parseSpotifyUrl(url) !== null
}

// Default export kept for any legacy reference
export default SpotifyEmbed
