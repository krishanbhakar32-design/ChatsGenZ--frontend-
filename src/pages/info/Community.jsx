import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout.jsx'

export default function Community() {
  return (
    <PageLayout seo={{
      title: 'Community Guidelines – ChatsGenZ Values & Culture',
      description: 'ChatsGenZ Community Guidelines. Our values, culture, and the behaviours that make our free chat community great. Be a positive part of ChatsGenZ.',
      keywords: 'chatsgenz community, chat community guidelines, free chat community india, chatsgenz values',
      canonical: '/community'
    }}>
      <div className="page-container">
        <h1 className="page-title">Community Guidelines</h1>
        <p className="page-subtitle">What makes ChatsGenZ a great community — and how you can be a part of it</p>

        <div className="prose">
          <p>ChatsGenZ is more than just a <strong>free chat platform</strong> — it is a living, breathing community of real people who come together to connect, laugh, learn, and support each other. These Community Guidelines describe the culture we are building together and the behaviours that make our chatrooms special.</p>

          <h2>Be Genuine</h2>
          <p>Authenticity is at the heart of great conversations. Be yourself. Share your real opinions, your real humour, your real interests. ChatsGenZ is at its best when people show up as who they truly are rather than performing a character. Genuine connections — even with strangers — are what keep people coming back.</p>

          <h2>Be Curious</h2>
          <p>One of the greatest joys of talking to strangers is discovering perspectives completely different from your own. Approach conversations with curiosity and openness. You might meet someone from a different state, a different country, or a completely different walk of life. These differences are what make ChatsGenZ endlessly interesting.</p>

          <h2>Be Kind</h2>
          <p>A simple rule with a huge impact: treat everyone the way you'd like to be treated. Whether you're in a <strong>general chat</strong>, a <strong>dating room</strong>, a <strong>quiz room</strong>, or any other space on our platform, kindness is always the right choice. A welcoming word to a new user costs nothing and means everything.</p>

          <h2>Help Each Other</h2>
          <p>Our community has users of all experience levels — from first-time chatters to veteran members who have been here since day one. If you see someone who seems confused or needs help navigating the platform, help them out. Share tips, answer questions, and welcome newcomers. A helpful community grows faster and stays stronger.</p>

          <h2>Celebrate Diversity</h2>
          <p>ChatsGenZ welcomes users from across India and the entire world. We have rooms for <strong>Hindi chat</strong>, Tamil, Telugu, Punjabi, and English speakers. We have users from every religion, background, age group (within our age policies), and lifestyle. This diversity is our greatest strength. Celebrate it — don't weaponise it.</p>

          <h2>Contribute Positively</h2>
          <p>Ask yourself: does what you're about to post add something to the conversation? Does it make the room more fun, more interesting, or more welcoming? We encourage you to contribute jokes, knowledge, support, opinions, and energy that improve the experience for everyone around you.</p>

          <h2>Protect Our Community</h2>
          <p>If you see behaviour that violates our <a href="/chat-rules">Chat Rules</a> or makes others uncomfortable, report it. Don't retaliate — report. Our moderation team acts quickly on reports, and by using this tool you are actively protecting the community you are part of. Your reports keep ChatsGenZ great.</p>

          <h2>What We're Building Together</h2>
          <p>We envision ChatsGenZ as the most vibrant, genuine, and welcoming free chat community in India and beyond. A place where you can always find someone interesting to talk to, a room that feels like home, and connections that matter. That vision only happens if each of us commits to these values every time we log in. Thank you for being part of it.</p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/login" className="btn-primary" style={{ fontSize: 16 }}>Join the Community →</Link>
        </div>
      </div>
    </PageLayout>
  )
}
