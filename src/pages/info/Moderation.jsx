import PageLayout from '../../components/PageLayout.jsx'

export default function Moderation() {
  return (
    <PageLayout seo={{
      title: 'Moderation – How ChatsGenZ Keeps Chat Safe',
      description: 'Learn how ChatsGenZ moderation works. Our dedicated mod team, tools, and procedures that keep our free live chatrooms safe and enjoyable 24/7.',
      keywords: 'chatsgenz moderation, chat mod team, free chat safety moderation, chatsgenz moderators india',
      canonical: '/moderation'
    }}>
      <div className="page-container">
        <h1 className="page-title">Moderation</h1>
        <p className="page-subtitle">How we keep ChatsGenZ safe, fair, and enjoyable for everyone</p>
        <div className="prose">
          <p>At <strong>ChatsGenZ</strong>, moderation is not an afterthought — it is a core part of what makes our platform special. We invest heavily in both automated and human moderation systems to ensure that all of our <strong>free chatrooms</strong> remain safe, respectful, and genuinely fun for every user, every single day.</p>

          <h2>Our Moderation Team</h2>
          <p>ChatsGenZ employs a dedicated team of moderators who are active across our chatrooms around the clock. Our team includes both paid staff members and trusted volunteer moderators selected from our community. All moderators are thoroughly vetted, trained, and held to the highest standards of fairness and professionalism.</p>
          <p>Our moderation hierarchy works as follows: <strong>Moderators</strong> handle day-to-day rule enforcement including muting, kicking, and warning users. <strong>Admins</strong> handle more serious matters including temporary and permanent bans, IP bans, and complex disputes. <strong>Super Admins</strong> and the <strong>Owner</strong> oversee the entire moderation system and handle appeals and policy decisions.</p>

          <h2>Moderation Tools</h2>
          <ul>
            <li><strong>Mute:</strong> Prevents a user from sending messages for a defined period (1 minute to 24 hours).</li>
            <li><strong>Kick:</strong> Removes a user from a specific chatroom. They can rejoin after a cooldown period.</li>
            <li><strong>Temporary Ban:</strong> Restricts account access for a defined period (1 hour to 30 days).</li>
            <li><strong>Permanent Ban:</strong> Complete and irreversible removal from ChatsGenZ.</li>
            <li><strong>IP Ban:</strong> Prevents access from a specific IP address, used for repeat offenders and ban evaders.</li>
            <li><strong>Cam Block:</strong> Permanently removes a user's ability to use the webcam feature for violations during cam sessions.</li>
            <li><strong>Close Cam:</strong> Immediately stops a user's active cam session during a violation.</li>
            <li><strong>Message Deletion:</strong> Remove any harmful or rule-violating messages from chatrooms.</li>
          </ul>

          <h2>Automated Moderation</h2>
          <p>Our platform uses automated spam detection that identifies and mutes users who send messages too rapidly. Our word filters catch common slurs and prohibited content instantly. Our AI-powered systems detect patterns of abusive behaviour and flag accounts for human review. These automated systems work 24/7 without interruption.</p>

          <h2>Reporting System</h2>
          <p>Every user on ChatsGenZ can report any message or any user at any time using the built-in report button. All reports are reviewed by our moderation team within 24 hours. Detailed reports with specific information help us act faster and more accurately. We take all reports seriously, including reports about moderators themselves.</p>

          <h2>Appeals Process</h2>
          <p>If you believe a moderation action against you was incorrect, you may submit an appeal through our <a href="/contact">Contact page</a>. Please include your username, a description of what happened, and why you believe the decision was incorrect. Appeals are reviewed by senior staff within 5 business days. We genuinely want to correct any mistakes and ensure fair treatment for all users.</p>

          <h2>Becoming a Moderator</h2>
          <p>ChatsGenZ periodically recruits volunteer moderators from our active user community. If you are interested in contributing to our moderation team, please reach out through our Contact page. We look for users who are mature, fair-minded, knowledgeable about our platform rules, and consistently active. Volunteer moderators receive the Moderator rank and special privileges as a thank-you for their service.</p>
        </div>
      </div>
    </PageLayout>
  )
}
