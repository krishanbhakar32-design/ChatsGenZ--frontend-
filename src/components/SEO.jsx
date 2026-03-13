import { Helmet } from 'react-helmet-async'

const SITE      = 'https://chatsgenz.vercel.app'
const SITE_NAME = 'ChatsGenZ'
const DEF_DESC  = 'ChatsGenZ is a free live chat platform for everyone worldwide. Join public chat rooms, talk to strangers, video chat, earn ranks, send gifts and play games on ChatsGenZ. No registration required.'
const DEF_KW    = 'ChatsGenZ, free chat rooms, talk to strangers, live chat online, video chat, no registration chat, free chatting site, online chat worldwide, stranger chat, global chat rooms'
const DEF_IMG   = `${SITE}/favicon/favicon-512.png`

export default function SEO({ title, description, keywords, canonical, image }) {
  const t   = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Free Live Chat Rooms | Talk to Strangers Online`
  const d   = description || DEF_DESC
  const k   = keywords ? `${keywords}, ${DEF_KW}` : DEF_KW
  const url = canonical ? `${SITE}${canonical}` : SITE
  const img = image || DEF_IMG
  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description"        content={d} />
      <meta name="keywords"           content={k} />
      <meta name="robots"             content="index, follow" />
      <meta name="author"             content={SITE_NAME} />
      <link rel="canonical"           href={url} />
      <meta property="og:type"        content="website" />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:url"         content={url} />
      <meta property="og:title"       content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:image"       content={img} />
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image"       content={img} />
    </Helmet>
  )
}
