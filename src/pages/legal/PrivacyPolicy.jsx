import PageLayout from '../../components/PageLayout.jsx'
export default function PrivacyPolicy() {
  return (
    <PageLayout seo={{
      title: 'Privacy Policy — How ChatsGenZ Protects Your Data',
      description: 'ChatsGenZ Privacy Policy. Understand how ChatsGenZ collects, uses, stores and protects your personal data on our free live chat platform. Your privacy matters to us.',
      keywords: 'ChatsGenZ privacy policy, chat site data protection, ChatsGenZ GDPR, free chat privacy, ChatsGenZ user data',
      canonical: '/privacy-policy',
    }}>
      <div className="page-container">
        <h1 className="page-title">Privacy Policy</h1>
        <p className="page-subtitle">Last updated: January 2025 — ChatsGenZ is committed to protecting your privacy.</p>
        <div className="prose">
          <p>At <strong>ChatsGenZ</strong>, your privacy is important to us. This Privacy Policy explains what data we collect when you use our free live chat platform, how we use it, and the choices you have. By using ChatsGenZ, you agree to the practices described in this policy.</p>
          <h2>1. Information We Collect</h2>
          <h3>Information You Provide</h3>
          <ul>
            <li><strong>Account details:</strong> Username, email address (optional), password (stored encrypted), gender, age group, and optional profile information.</li>
            <li><strong>Profile content:</strong> Profile photo, about me text, and any other information you choose to add to your public profile.</li>
            <li><strong>Messages:</strong> Private messages you send and receive, and your activity in public chat rooms.</li>
            <li><strong>Contact form submissions:</strong> Any messages sent through our Contact page.</li>
          </ul>
          <h3>Information Collected Automatically</h3>
          <ul>
            <li><strong>Usage data:</strong> Pages visited, features used, time spent, and interaction patterns within ChatsGenZ.</li>
            <li><strong>Device data:</strong> Browser type, operating system, screen resolution, and general device information.</li>
            <li><strong>IP address:</strong> Used for security, fraud prevention, and approximate geo-location purposes only.</li>
            <li><strong>Cookies:</strong> Session cookies for login and preference cookies. See our Cookie Policy for full details.</li>
          </ul>
          <h2>2. How We Use Your Data</h2>
          <ul>
            <li>To operate and provide the ChatsGenZ live chat platform and all its features</li>
            <li>To verify your account and keep your login session active</li>
            <li>To personalise your experience and remember your preferences</li>
            <li>To calculate XP, gold coins, rank progression, and leaderboard positions</li>
            <li>To enforce our platform rules, detect abuse, and protect other users</li>
            <li>To respond to support requests submitted via our Contact page</li>
            <li>To send important platform notifications (you can opt out of non-essential ones)</li>
          </ul>
          <h2>3. Data Sharing</h2>
          <p>We never sell your personal data to third parties. We do not allow advertisers to target you based on your ChatsGenZ data. We may share data only in the following limited circumstances:</p>
          <ul>
            <li><strong>Service providers:</strong> Trusted infrastructure providers (e.g. hosting, CDN) who process data only on our instructions under strict data processing agreements.</li>
            <li><strong>Legal obligations:</strong> Where required by law, court order, or to protect the safety of users from serious harm.</li>
          </ul>
          <h2>4. Data Retention</h2>
          <p>We retain your account data for as long as your account remains active. If you delete your account, your personal data is removed within 30 days. Public chat room messages may be retained for up to 90 days for moderation purposes, then permanently deleted. Private messages are retained only for as long as necessary for delivery.</p>
          <h2>5. Your Rights</h2>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal data ChatsGenZ holds about you.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
            <li><strong>Deletion:</strong> Request deletion of your account and personal data.</li>
            <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
            <li><strong>Objection:</strong> Object to certain types of data processing where applicable law permits.</li>
          </ul>
          <p>To exercise any of these rights, contact us via our Contact page with the subject line Privacy Request.</p>
          <h2>6. Cookies</h2>
          <p>ChatsGenZ uses cookies to manage login sessions and save your preferences. We do not use advertising or tracking cookies. For full details, see our Cookie Policy.</p>
          <h2>7. Security</h2>
          <p>We implement industry-standard security measures including HTTPS encryption for all data in transit, encrypted password storage, and regular security audits. Despite best efforts, no online platform can guarantee absolute security.</p>
          <h2>8. Children</h2>
          <p>ChatsGenZ is not intended for users under 13 years of age. We do not knowingly collect personal data from children. If you believe a child has provided us data, please contact us immediately and we will delete it promptly.</p>
          <h2>9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify registered users of significant changes by displaying a notice within the platform. Your continued use of ChatsGenZ after changes constitutes acceptance of the updated policy.</p>
          <p>Questions? Contact us via our <a href="/contact">Contact page</a>.</p>
        </div>
      </div>
    </PageLayout>
  )
}
