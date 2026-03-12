import PageLayout from '../../components/PageLayout.jsx'

export default function CookiePolicy() {
  return (
    <PageLayout seo={{
      title: 'Cookie Policy – ChatsGenZ Cookie Usage',
      description: 'ChatsGenZ Cookie Policy. Learn about how we use cookies on our free chat platform and how to manage your cookie preferences.',
      keywords: 'chatsgenz cookie policy, chat site cookies, free chat cookies, chatsgenz GDPR cookies',
      canonical: '/cookie-policy'
    }}>
      <div className="page-container">
        <h1 className="page-title">Cookie Policy</h1>
        <p className="page-subtitle">Last updated: January 2025 · How ChatsGenZ uses cookies</p>
        <div className="prose">
          <p>This Cookie Policy explains how <strong>ChatsGenZ</strong> uses cookies and similar tracking technologies when you visit our free live chat platform. By using ChatsGenZ, you consent to the use of cookies as described in this policy.</p>

          <h2>What Are Cookies?</h2>
          <p>Cookies are small text files placed on your device by a website when you visit it. They allow the website to remember your actions and preferences over time, so you don't have to keep re-entering them whenever you come back to the site or browse from one page to another.</p>

          <h2>Cookies We Use</h2>

          <h3>Essential Cookies (Always Active)</h3>
          <p>These cookies are strictly necessary for ChatsGenZ to function. Without them, you cannot log in, stay logged in, or use basic platform features. They cannot be disabled.</p>
          <ul>
            <li><strong>auth_token:</strong> JWT authentication token to keep you logged into your account.</li>
            <li><strong>session_id:</strong> Session identifier for maintaining your active chat session.</li>
          </ul>

          <h3>Preference Cookies</h3>
          <p>These cookies remember your settings and preferences so you don't have to reset them each visit.</p>
          <ul>
            <li><strong>theme_pref:</strong> Your colour theme preference (if applicable).</li>
            <li><strong>notification_settings:</strong> Your notification preferences within the chat platform.</li>
            <li><strong>sound_pref:</strong> Whether you have chat notification sounds enabled or disabled.</li>
          </ul>

          <h3>Analytics Cookies (Optional)</h3>
          <p>These cookies help us understand how users interact with our platform so we can improve it. We use anonymised, aggregated data only — no individual tracking.</p>
          <ul>
            <li>Basic page view tracking for understanding which features are most used.</li>
            <li>Error tracking to identify and fix technical issues faster.</li>
          </ul>

          <h2>What We Do NOT Use</h2>
          <ul>
            <li>We do <strong>not</strong> use advertising cookies or tracking pixels for targeted ads.</li>
            <li>We do <strong>not</strong> sell cookie data to third parties.</li>
            <li>We do <strong>not</strong> use cross-site tracking technologies.</li>
            <li>We do <strong>not</strong> use fingerprinting techniques to track users across sites.</li>
          </ul>

          <h2>How to Manage Cookies</h2>
          <p>You can control cookies through your browser settings. Most browsers allow you to view, delete, and block cookies from specific websites. Please note that disabling essential cookies will prevent you from logging into ChatsGenZ. Instructions for managing cookies are available in your browser's help section.</p>

          <h2>Third-Party Cookies</h2>
          <p>Some third-party services we use, such as our CDN provider and font service (Google Fonts), may set their own cookies. These are governed by the respective third parties' privacy and cookie policies. We recommend reviewing those policies if you have concerns.</p>

          <h2>Changes to This Policy</h2>
          <p>We may update this Cookie Policy from time to time. We will notify registered users of significant changes via email. Continued use of ChatsGenZ after changes are posted constitutes your acceptance of the updated policy.</p>
        </div>
      </div>
    </PageLayout>
  )
}
