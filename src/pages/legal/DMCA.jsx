import PageLayout from '../../components/PageLayout.jsx'

export default function DMCA() {
  return (
    <PageLayout seo={{
      title: 'DMCA Policy – Copyright Infringement – ChatsGenZ',
      description: 'ChatsGenZ DMCA Policy. How to submit a copyright infringement notice and our procedure for handling DMCA takedown requests.',
      keywords: 'chatsgenz DMCA, copyright infringement chat, chatsgenz takedown request',
      canonical: '/dmca'
    }}>
      <div className="page-container">
        <h1 className="page-title">DMCA Policy</h1>
        <p className="page-subtitle">Digital Millennium Copyright Act — Copyright Infringement Notice Procedure</p>
        <div className="prose">
          <p><strong>ChatsGenZ</strong> respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). We respond promptly to notices of alleged copyright infringement that comply with the DMCA. If you believe that content on our platform infringes your copyright, please follow the procedure described below.</p>

          <h2>How to Submit a DMCA Takedown Notice</h2>
          <p>To submit a valid DMCA notice, your written claim must include all of the following elements:</p>
          <ul>
            <li>A physical or electronic signature of the copyright owner or a person authorised to act on their behalf.</li>
            <li>A description of the copyrighted work that you claim has been infringed.</li>
            <li>A description of where the allegedly infringing material is located on our platform (specific URL or room name).</li>
            <li>Your contact information including your address, telephone number, and email address.</li>
            <li>A statement that you have a good-faith belief that use of the material is not authorised by the copyright owner, its agent, or the law.</li>
            <li>A statement, made under penalty of perjury, that the information in your notification is accurate and that you are the copyright owner or authorised to act on their behalf.</li>
          </ul>

          <h2>Where to Send Your DMCA Notice</h2>
          <p>Please submit your DMCA notice through our <a href="/contact">Contact page</a> with the subject line "DMCA Takedown Request". We aim to respond to all DMCA notices within 5 business days.</p>

          <h2>Our Response Procedure</h2>
          <p>Upon receiving a valid DMCA notice, ChatsGenZ will promptly investigate the claim and, where appropriate, remove or disable access to the allegedly infringing content. We will notify the user who posted the content of the takedown where possible and provide them with an opportunity to file a counter-notice if they believe the takedown was in error.</p>

          <h2>Counter-Notice Procedure</h2>
          <p>If you believe your content was removed in error, you may file a counter-notice containing the following information: your physical or electronic signature, identification of the removed content, a statement under penalty of perjury that you have a good-faith belief the material was removed by mistake, your contact information, and your consent to the jurisdiction of the courts.</p>

          <h2>Repeat Infringer Policy</h2>
          <p>ChatsGenZ maintains a strict repeat infringer policy. Users who repeatedly infringe copyright will have their accounts permanently terminated. This policy is applied consistently and without exception.</p>

          <h2>False Claims</h2>
          <p>Please note that under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material is infringing may be liable for damages, including costs and attorneys' fees. Ensure all DMCA claims are made in good faith and are accurate.</p>
        </div>
      </div>
    </PageLayout>
  )
}
