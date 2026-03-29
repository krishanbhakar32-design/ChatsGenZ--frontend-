import PageLayout from '../../components/PageLayout.jsx'
export default function Disclaimer() {
  return (
    <PageLayout seo={{
      title: 'Disclaimer — ChatsGenZ Legal Notice',
      description: 'Read the official ChatsGenZ disclaimer. Important legal notices about the use of ChatsGenZ free live chat platform, user-generated content, and liability limitations.',
      keywords: 'ChatsGenZ disclaimer, chat site legal notice, ChatsGenZ liability, free chat disclaimer',
      canonical: '/disclaimer',
    }}>
      <div className="page-container">
        <h1 className="page-title">Disclaimer</h1>
        <p className="page-subtitle">Last updated: January 2025</p>
        <div className="prose">
          <p>The information and services provided on <strong>ChatsGenZ</strong> are offered on an as-is and as-available basis. By accessing or using any part of this platform, you confirm that you have read, understood, and agreed to this disclaimer in full.</p>
          <h2>1. User-Generated Content</h2>
          <p>ChatsGenZ is a live chat platform enabling real-time communication between users worldwide. All content in chat rooms, profiles, and messages is generated entirely by users and does not represent the views, opinions, or positions of ChatsGenZ, its owners, administrators, or staff. We do not endorse, verify, or take responsibility for any user-generated content.</p>
          <h2>2. No Guarantee of Accuracy</h2>
          <p>While we strive to ensure all platform information is accurate and up to date, we make no warranties or representations of any kind regarding the completeness, accuracy, or reliability of any content on ChatsGenZ. Information may change without prior notice.</p>
          <h2>3. Limitation of Liability</h2>
          <p>To the fullest extent permitted by applicable law, ChatsGenZ shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your access to or use of our platform, including but not limited to loss of data, service interruption, or any other commercial losses.</p>
          <h2>4. Third-Party Links and Services</h2>
          <p>ChatsGenZ may include links to third-party websites or services for convenience only. We have no control over those sites and accept no responsibility for any damage or loss arising from your use of them.</p>
          <h2>5. Service Availability</h2>
          <p>We do not guarantee uninterrupted access to ChatsGenZ. The platform may be unavailable due to maintenance, server issues, or circumstances beyond our control. We are not liable for any loss resulting from downtime or unavailability.</p>
          <h2>6. Changes to This Disclaimer</h2>
          <p>ChatsGenZ reserves the right to update or modify this disclaimer at any time without prior notice. Continued use of the platform after changes constitutes your acceptance. Please review this page periodically.</p>
          <p>Questions? Contact us via our <a href="/contact">Contact page</a>.</p>
        </div>
      </div>
    </PageLayout>
  )
}
