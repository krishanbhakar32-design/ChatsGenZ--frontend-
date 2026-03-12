import PageLayout from '../../components/PageLayout.jsx'

export default function PrivacyPolicy() {
  return (
    <PageLayout seo={{
      title: 'Privacy Policy – How ChatsGenZ Protects Your Data',
      description: 'ChatsGenZ Privacy Policy — understand how we collect, use, and protect your personal data on our free live chat platform. We value your privacy.',
      keywords: 'chatsgenz privacy policy, chat site privacy, free chat data protection, chatsgenz GDPR',
      canonical: '/privacy-policy'
    }}>
      <div className="page-container">
        <h1 className="page-title">Privacy Policy</h1>
        <p className="page-subtitle">Last updated: January 2025 · ChatsGenZ is committed to protecting your privacy</p>
        <div className="prose">
          <p>At <strong>ChatsGenZ</strong>, we take your privacy seriously. This Privacy Policy explains what information we collect when you use our free live chat platform, how we use it, and the choices you have regarding your information. By using ChatsGenZ, you agree to the collection and use of information described in this policy.</p>

          <h2>1. Information We Collect</h2>
          <h3>Information You Provide</h3>
          <ul>
            <li><strong>Account details:</strong> Username, email address, password (stored encrypted), gender, age group, and profile information you choose to add.</li>
            <li><strong>Guest users:</strong> If you use our platform as a guest, we do not require any personal information. You simply choose a display name.</li>
            <li><strong>Profile content:</strong> Profile photo, cover image, "About Me" text, and any gallery images you upload voluntarily.</li>
            <li><strong>Chat messages:</strong> Messages sent in public chatrooms are stored for moderation purposes. Private messages are stored encrypted and accessible only to the conversation participants.</li>
          </ul>
          <h3>Automatically Collected Information</h3>
          <ul>
            <li><strong>IP Address:</strong> We collect your IP address for security, fraud prevention, and to enforce bans where necessary.</li>
            <li><strong>Device information:</strong> Browser type, operating system, and device type for compatibility and analytics.</li>
            <li><strong>Usage data:</strong> Pages visited, rooms joined, features used, and time spent on our platform.</li>
            <li><strong>Cookies:</strong> Session cookies for login persistence and preference cookies for your settings.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To provide, maintain, and improve our <strong>free chat</strong> platform services.</li>
            <li>To authenticate your identity and keep your account secure.</li>
            <li>To enforce our Chat Rules, Terms of Service, and community guidelines.</li>
            <li>To send service-related emails such as email verification and password reset.</li>
            <li>To detect and prevent spam, abuse, and fraud on our platform.</li>
            <li>To analyse platform usage and improve user experience.</li>
            <li>To respond to your support requests and contact form submissions.</li>
          </ul>

          <h2>3. How We Share Your Information</h2>
          <p>We <strong>do not sell</strong> your personal data to third parties. We do not share your information with advertisers. Your information may be shared in these limited circumstances:</p>
          <ul>
            <li><strong>Service providers:</strong> Cloud hosting (Railway), database services (MongoDB Atlas), image storage (ImgBB, Cloudinary), and email services (Brevo) that help operate our platform.</li>
            <li><strong>Legal requirements:</strong> If required by law, court order, or government authority, we may disclose information as legally obligated.</li>
            <li><strong>Safety:</strong> If we believe disclosure is necessary to prevent imminent harm to any person.</li>
          </ul>

          <h2>4. Data Retention</h2>
          <p>We retain your account data for as long as your account is active. Public chatroom messages are stored for up to 30 days. Private messages are retained until either party deletes them. Stories expire automatically after 24 hours. You may request deletion of your account and associated data at any time through our Contact page.</p>

          <h2>5. Your Rights</h2>
          <ul>
            <li><strong>Access:</strong> You can view and download your profile data from your account settings at any time.</li>
            <li><strong>Correction:</strong> You can update your profile information at any time.</li>
            <li><strong>Deletion:</strong> You can request deletion of your account and data by contacting us.</li>
            <li><strong>Portability:</strong> You can request a copy of your data in a portable format.</li>
            <li><strong>Opt-out:</strong> You can opt out of non-essential communications at any time.</li>
          </ul>

          <h2>6. Cookies</h2>
          <p>ChatsGenZ uses essential session cookies to keep you logged in and preference cookies to remember your settings. We do not use tracking cookies for advertising purposes. For full details, see our <a href="/cookie-policy">Cookie Policy</a>.</p>

          <h2>7. Children's Privacy</h2>
          <p>ChatsGenZ is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover we have collected such information, we will delete it immediately. If you believe a child under 13 is using our platform, please contact us immediately.</p>

          <h2>8. Security</h2>
          <p>We implement industry-standard security measures including encrypted password storage (bcrypt), HTTPS encryption for all data transmission, JWT-based authentication, rate limiting to prevent attacks, and IP monitoring for suspicious activity. However, no system is 100% secure and we cannot guarantee absolute security.</p>

          <h2>9. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or want to exercise any of your rights, please contact us through our <a href="/contact">Contact page</a>. We will respond within 30 days.</p>
        </div>
      </div>
    </PageLayout>
  )
}
