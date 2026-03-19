import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout.jsx'

const TOPICS = [
  {
    icon: 'fi fi-sr-comment-alt', color: '#1a73e8',
    title: 'Someone is troubling me in chat',
    q: 'What should I do if someone is harassing or disturbing me in a chat room?',
    a: 'If someone is bothering you in a chat room, you have several options. First, you can click on their username and select Block — this will immediately stop them from messaging you privately or interacting with you. You can also click the Report button on their message by tapping the three-dot menu next to it. This sends an alert directly to our moderation team who will review and take action. If the problem continues, leave the room and join a different one. If it is serious harassment, use our Contact page to submit a detailed complaint and our team will investigate and take appropriate action including banning the user.',
  },
  {
    icon: 'fi fi-sr-wifi-slash', color: '#ea4335',
    title: 'Site is loading slowly or not working',
    q: 'The site is slow, freezing, or not loading properly — what should I do?',
    a: 'Start by refreshing the page using the browser refresh button or pressing Ctrl+R (Cmd+R on Mac). If that does not help, clear your browser cache and cookies — go to your browser settings and clear browsing data. Try opening ChatsGenZ in a different browser such as Chrome, Firefox, or Edge. Make sure your internet connection is stable. If you are on mobile, switch between Wi-Fi and mobile data to check which works better. If the site is down completely, wait a few minutes and try again. Planned maintenance is always announced in chat rooms. For persistent issues, contact us through the Contact page with your device and browser details.',
  },
  {
    icon: 'fi fi-sr-video-camera', color: '#34a853',
    title: 'Camera or microphone not working',
    q: 'My webcam or microphone is not working on ChatsGenZ — how do I fix it?',
    a: 'First, make sure your browser has permission to access your camera and microphone. In Chrome, click the padlock icon in the address bar and set Camera and Microphone to Allow. Then refresh the page. On mobile, go to your phone Settings → Apps → your browser → Permissions and enable Camera and Microphone. Make sure no other app is using your camera at the same time — close other video apps like Zoom or WhatsApp. Use a supported browser like Chrome or Firefox for the best experience. If the camera still does not work, try restarting your browser or device. For ongoing issues, contact our support team.',
  },
  {
    icon: 'fi fi-sr-lock', color: '#fbbc04',
    title: 'Forgot password or cannot login',
    q: 'I forgot my password or I am unable to log into my account — what do I do?',
    a: 'On the login page, click the Forgot Password option and enter your registered email address. We will send a password reset link to your email within a few minutes — check your spam or junk folder if you do not see it. Click the link in the email and create a new password. If you did not register with an email and are a guest user, guest accounts are temporary and cannot be recovered — you will need to create a new account. If you registered but no longer have access to your email, contact our support team through the Contact page with your username and we will do our best to help verify your identity.',
  },
  {
    icon: 'fi fi-sr-ban', color: '#aa44ff',
    title: 'I received a ban or mute — what now?',
    q: 'I have been banned or muted. Is it permanent? Can I appeal?',
    a: 'Bans and mutes can be temporary or permanent depending on the severity of the rule violation. If you have been muted in a room, the Room Moderator or Admin has silenced you — this is usually temporary. If you have been platform-banned, you will see a message explaining the reason and duration when you try to log in. You can appeal any ban or mute by going to our Contact page, selecting Account Problem as the subject, and clearly explaining your situation including your username and what happened. Our team reviews all appeals fairly within 5 working days. Note that bans for serious violations such as sharing illegal content will not be overturned.',
  },
  {
    icon: 'fi fi-sr-user-slash', color: '#ff6b35',
    title: 'My account is not working or got deleted',
    q: 'My account is not loading, showing errors, or appears to have been deleted — what can I do?',
    a: 'If your account is not loading, first check your internet connection and try refreshing. If you are getting an error message when logging in, your account may have been suspended — try logging in to see the reason. If your account appears to have been deleted and you did not delete it yourself, it is possible it was removed due to a rule violation or inactivity. For accounts inactive for more than 6 months, we may remove them as part of platform maintenance. If you believe your account was wrongly removed, contact us immediately through the Contact page with your username, registered email, and any details about your account. We will look into it as quickly as possible.',
  },
  {
    icon: 'fi fi-sr-gift', color: '#00aaff',
    title: 'Gold coins or gifts not received',
    q: 'I sent a gift or earned gold coins but they are not showing in my balance — what is wrong?',
    a: 'Gold coin transactions and gifts usually process instantly. If they are not showing, first refresh the page or log out and log back in — this often resolves display issues. Check your notification panel to confirm whether the transaction was completed. If you sent a gift to another user and they did not receive it, ask them to also refresh their page. If your balance seems wrong after a purchase or after receiving a gift from another user, take a screenshot of the discrepancy and contact us through the Contact page. Include your username, the date and time of the transaction, and what you expected to receive so our team can investigate.',
  },
  {
    icon: 'fi fi-sr-interrogation', color: '#ff4488',
    title: 'Other problems or questions',
    q: 'I have a different problem not listed here — where can I get help?',
    a: 'If your issue is not covered here, we are still happy to help. Visit our FAQ page for answers to the most common questions about using ChatsGenZ features. If you cannot find your answer there, go to our Contact page and fill in the form with as much detail as possible about your problem. Include your username, the device and browser you are using, and a clear description of the issue. Our support team replies within 24 to 48 hours on all working days. For urgent moderation issues in a live chat room, you can also use the in-room report button to alert our active moderation team immediately.',
  },
]

function HelpItem({ t }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      background: '#fff', border: '1px solid #e8eaed',
      borderRadius: 12, marginBottom: 12, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: 14, padding: '16px 18px', background: 'none',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: t.color + '15', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: t.color, fontSize: 18,
        }}>
          <i className={t.icon} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#202124', fontFamily: 'Outfit,sans-serif', lineHeight: 1.35 }}>{t.title}</div>
          <div style={{ fontSize: '0.8rem', color: '#80868b', marginTop: 2, lineHeight: 1.4 }}>{t.q}</div>
        </div>
        <i className={`fi fi-sr-angle-${open ? 'up' : 'down'}`} style={{ fontSize: 13, color: '#1a73e8', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          padding: '0 18px 18px 70px',
          fontSize: '0.875rem', color: '#3c4043', lineHeight: 1.8,
          borderTop: '1px solid #f1f3f4',
          paddingTop: 14,
        }}>
          {t.a}
        </div>
      )}
    </div>
  )
}

export default function Help() {
  return (
    <PageLayout seo={{
      title: 'Help Center — ChatsGenZ Support and Guides',
      description: 'ChatsGenZ Help Center. Get answers for harassment in chat, site loading issues, camera not working, forgot password, ban appeals, missing gold coins and all other problems on ChatsGenZ.',
      keywords: 'ChatsGenZ help, ChatsGenZ support, ChatsGenZ help center, ChatsGenZ troubleshooting, chat site help, ChatsGenZ contact support',
      canonical: '/help',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 18px 48px' }}>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.4rem,4vw,1.9rem)', color:'#202124', marginBottom:8 }}>Help Center</h1>
        <p style={{ color:'#5f6368', fontSize:'0.92rem', marginBottom:28, lineHeight:1.65 }}>
          Having trouble? Find step-by-step answers to the most common issues on ChatsGenZ. Click any topic below to see the full answer.
        </p>

        <div>
          {TOPICS.map((t, i) => <HelpItem key={i} t={t} />)}
        </div>

        {/* Contact CTA */}
        <div style={{
          marginTop: 28, background: '#f8f9fa', border: '1px solid #e8eaed',
          borderRadius: 12, padding: '20px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 14,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#202124', fontFamily: 'Outfit,sans-serif', marginBottom: 4 }}>Still need help?</div>
            <div style={{ fontSize: '0.84rem', color: '#5f6368' }}>Our support team replies within 24–48 hours on all working days.</div>
          </div>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 9,
            background: 'linear-gradient(135deg,#1a73e8,#1557b0)',
            color: '#fff', fontWeight: 700, fontSize: '0.875rem',
            textDecoration: 'none', flexShrink: 0,
          }}>
            <i className="fi fi-sr-envelope" /> Contact Us
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}
