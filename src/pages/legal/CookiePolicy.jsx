import PageLayout from '../../components/PageLayout.jsx'
export default function CookiePolicy() {
  return (
    <PageLayout seo={{
      title: 'Cookie Policy — ChatsGenZ Use of Cookies',
      description: 'ChatsGenZ Cookie Policy. Learn how ChatsGenZ uses cookies, what types of cookies we use, and how you can manage your cookie preferences on our free chat platform.',
      keywords: 'ChatsGenZ cookie policy, chat site cookies, ChatsGenZ tracking, free chat cookie settings',
      canonical: '/cookie-policy',
    }}>
      <div className="page-container">
        <h1 className="page-title">Cookie Policy</h1>
        <p className="page-subtitle">Last updated: January 2025</p>
        <div className="prose">
          <p>This Cookie Policy explains how <strong>ChatsGenZ</strong> uses cookies and similar technologies when you visit and use our free live chat platform. By using ChatsGenZ, you consent to our use of cookies as described in this policy.</p>
          <h2>1. What Are Cookies?</h2>
          <p>Cookies are small text files that are stored on your device when you visit a website or web application. They help websites remember your preferences, keep you logged in, and understand how you use the platform. Cookies are widely used across the internet and are essential for many modern web features.</p>
          <h2>2. Types of Cookies We Use</h2>
          <h3>Essential Cookies</h3>
          <p>These cookies are required for ChatsGenZ to function correctly. Without them, you cannot log in, stay logged in, or use core features of the platform. These cannot be disabled.</p>
          <ul>
            <li><strong>Session cookie:</strong> Keeps you logged in during your visit to ChatsGenZ</li>
            <li><strong>Authentication token:</strong> Securely identifies your account during your session</li>
            <li><strong>Security cookie:</strong> Helps protect your account from CSRF attacks</li>
          </ul>
          <h3>Preference Cookies</h3>
          <p>These cookies remember your settings and preferences to improve your experience on ChatsGenZ.</p>
          <ul>
            <li><strong>Theme preference:</strong> Remembers your display settings</li>
            <li><strong>Notification settings:</strong> Stores your notification preferences</li>
            <li><strong>Language preference:</strong> Remembers your preferred interface language</li>
          </ul>
          <h3>Analytics Cookies</h3>
          <p>We use anonymous analytics to understand how users navigate ChatsGenZ so we can improve the platform. These cookies do not identify you personally and the data is aggregated.</p>
          <h2>3. What We Do NOT Use</h2>
          <ul>
            <li>Advertising or targeting cookies</li>
            <li>Third-party marketing cookies</li>
            <li>Social media tracking pixels</li>
            <li>Cookies that sell or share your data with advertisers</li>
          </ul>
          <h2>4. Managing Your Cookies</h2>
          <p>You can control and manage cookies through your browser settings. Most browsers allow you to block all cookies, accept only certain types, or delete cookies at any time. Note that disabling essential cookies will prevent you from logging in to ChatsGenZ. For instructions specific to your browser, search for how to manage cookies in your browser name.</p>
          <h2>5. Changes to This Policy</h2>
          <p>We may update this Cookie Policy from time to time. Continued use of ChatsGenZ after any changes constitutes your acceptance of the updated policy.</p>
          <p>Questions? Contact us via our <a href="/contact">Contact page</a>.</p>
        </div>
      </div>
    </PageLayout>
  )
}
