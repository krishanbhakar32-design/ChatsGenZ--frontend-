import { Helmet } from 'react-helmet-async'

const SITE = 'https://chatsgenz.vercel.app'
const DEFAULT_KEYWORDS = 'live chatting site, stranger chatting site, no registration chat, vip chat, premium chatroom, free chatting site, public cam chat, video call, audio call, quiz room, guest chatroom, make friends online, date online, adult chat, secured chat, next generation chatrooms, fastest growing chat, hindi chat, desi chat, indian chat, free chat india'

export default function SEO({ title, description, keywords, canonical }) {
  const fullTitle = title ? `${title} | ChatsGenZ` : 'ChatsGenZ – Free Live Chat Rooms | Talk to Strangers Online | No Registration'
  const url = canonical ? `${SITE}${canonical}` : SITE

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || 'ChatsGenZ is India\'s fastest growing free live chat site. Join free chatrooms, talk to strangers, make friends, video call, audio call. No registration needed!'} />
      <meta name="keywords" content={keywords ? `${keywords}, ${DEFAULT_KEYWORDS}` : DEFAULT_KEYWORDS} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || 'Join India\'s fastest growing free chat community. No registration needed.'} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
    </Helmet>
  )
}
