import PageLayout from '../../components/PageLayout.jsx'
export default function DMCA() {
  return (
    <PageLayout seo={{
      title: 'DMCA Policy — Copyright Infringement | ChatsGenZ',
      description: 'ChatsGenZ DMCA and copyright infringement policy. How to submit a copyright takedown request, our response process, and counter-notice procedures on ChatsGenZ.',
      keywords: 'ChatsGenZ DMCA, copyright takedown ChatsGenZ, ChatsGenZ copyright policy, DMCA notice chat platform',
      canonical: '/dmca',
    }}>
      <div className="page-container">
        <h1 className="page-title">DMCA Policy</h1>
        <p className="page-subtitle">Last updated: January 2025</p>
        <div className="prose">
          <p><strong>ChatsGenZ</strong> respects the intellectual property rights of others and expects all users of our platform to do the same. We comply with the Digital Millennium Copyright Act (DMCA) and respond promptly to valid copyright infringement notices.</p>
          <h2>1. Reporting Copyright Infringement</h2>
          <p>If you believe that content on ChatsGenZ infringes your copyright, please submit a DMCA notice to us via our Contact page with the subject line DMCA / Copyright Request. Your notice must include all of the following:</p>
          <ul>
            <li>Your full legal name and contact information (email address, phone number, and address)</li>
            <li>A description of the copyrighted work you claim has been infringed</li>
            <li>A description of the infringing content and its specific location on ChatsGenZ (URL or screenshot)</li>
            <li>A statement that you have a good faith belief that the use is not authorised by the copyright owner, its agent, or the law</li>
            <li>A statement that the information in your notice is accurate and, under penalty of perjury, that you are the copyright owner or authorised to act on their behalf</li>
            <li>Your physical or electronic signature</li>
          </ul>
          <h2>2. Our Response Process</h2>
          <p>Upon receiving a valid DMCA notice, ChatsGenZ will act expeditiously to remove or disable access to the allegedly infringing content. We will notify the user who posted the content (if identifiable) that their content has been removed due to a copyright claim.</p>
          <h2>3. Counter-Notice Procedure</h2>
          <p>If you believe that your content was removed due to a mistake or misidentification, you may submit a DMCA counter-notice. Your counter-notice must include your full name, contact information, identification of the removed content, a statement under penalty of perjury that you have a good faith belief the removal was a mistake, and your consent to jurisdiction of the applicable federal court.</p>
          <h2>4. Repeat Infringers</h2>
          <p>ChatsGenZ maintains a repeat infringer policy. Users who repeatedly infringe the copyright of others will have their accounts permanently terminated from the platform.</p>
          <h2>5. False Notices</h2>
          <p>Submitting a false or fraudulent DMCA notice may result in legal liability. If you are unsure whether material infringes your copyright, we recommend consulting a legal professional before submitting a notice.</p>
          <p>To submit a DMCA notice, go to our <a href="/contact">Contact page</a> and select DMCA / Copyright Request as the subject.</p>
        </div>
      </div>
    </PageLayout>
  )
}
