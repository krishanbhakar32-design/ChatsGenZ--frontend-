import PageLayout from '../../components/PageLayout.jsx'

export default function LegalTerms() {
  return (
    <PageLayout seo={{
      title: 'Legal Terms – ChatsGenZ Platform Legal Information',
      description: 'ChatsGenZ Legal Terms. Full legal information about our platform operations, intellectual property, disclaimers, and governing jurisdiction.',
      keywords: 'chatsgenz legal terms, chat site legal, free chat platform legal, chatsgenz law',
      canonical: '/legal'
    }}>
      <div className="page-container">
        <h1 className="page-title">Legal Terms</h1>
        <p className="page-subtitle">Important legal information about ChatsGenZ platform</p>
        <div className="prose">
          <h2>Intellectual Property</h2>
          <p>All content on ChatsGenZ that is not user-generated — including our logo, design, code, layout, graphics, and text — is the intellectual property of ChatsGenZ and its operators. You may not reproduce, copy, redistribute, or commercially exploit any proprietary ChatsGenZ content without express written permission. User-generated content remains the intellectual property of the respective users, subject to the licence grant in our Terms of Service.</p>

          <h2>Platform Ownership</h2>
          <p>ChatsGenZ is independently owned and operated. The platform is not affiliated with, endorsed by, or connected to any government body, major technology corporation, or other third-party organisation unless explicitly stated. Our platform is built on open standards and commercially available cloud services.</p>

          <h2>Indemnification</h2>
          <p>You agree to indemnify, defend, and hold harmless ChatsGenZ, its operators, moderators, and affiliates from and against any claims, damages, costs, or expenses arising from your use of our platform, your violation of these legal terms, or your infringement of any rights of a third party.</p>

          <h2>Limitation of Liability</h2>
          <p>ChatsGenZ and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, goodwill, or other intangible losses, resulting from your use of or inability to use our platform. Our total liability to you for any claim arising from use of ChatsGenZ shall not exceed the amount you paid to us in the twelve months preceding the claim (which is zero for free users).</p>

          <h2>Dispute Resolution</h2>
          <p>Any disputes arising from these legal terms or your use of ChatsGenZ shall first be attempted to be resolved through informal negotiation. If informal resolution fails, disputes shall be submitted to binding arbitration under applicable Indian arbitration laws before resorting to litigation. This does not prevent either party from seeking emergency injunctive relief from a court of competent jurisdiction.</p>

          <h2>Severability</h2>
          <p>If any provision of these legal terms is found to be unenforceable or invalid under applicable law, that provision will be modified to the minimum extent necessary to make it enforceable. The remaining provisions will continue in full force and effect.</p>

          <h2>Entire Agreement</h2>
          <p>These Legal Terms, together with our Terms of Service, Privacy Policy, and all other policies published on our website, constitute the entire agreement between you and ChatsGenZ with respect to your use of our platform and supersede all prior agreements, representations, and understandings.</p>

          <h2>Contact</h2>
          <p>For any legal enquiries, please contact us through our <a href="/contact">Contact page</a> with "Legal Enquiry" in the subject line.</p>
        </div>
      </div>
    </PageLayout>
  )
}
