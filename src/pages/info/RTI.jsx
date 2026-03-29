import PageLayout from '../../components/PageLayout.jsx'
export default function RTI() {
  return (
    <PageLayout seo={{
      title: 'RTI — Right to Information Policy | ChatsGenZ',
      description: 'ChatsGenZ Right to Information (RTI) policy. Understand how to formally request information about data held by ChatsGenZ, our response process, and applicable procedures.',
      keywords: 'ChatsGenZ RTI, right to information ChatsGenZ, data request ChatsGenZ, ChatsGenZ transparency',
      canonical: '/rti',
    }}>
      <div className="page-container">
        <h1 className="page-title">Right to Information (RTI)</h1>
        <p className="page-subtitle">Last updated: January 2025</p>
        <div className="prose">
          <p><strong>ChatsGenZ</strong> is committed to transparency and respects your right to access information related to our platform and the data we hold. This page outlines our Right to Information (RTI) policy and explains how you can formally request platform-related information.</p>
          <h2>1. What is RTI?</h2>
          <p>The Right to Information (RTI) is a legal and ethical principle that allows individuals to request information from organisations about their operations, data handling practices, and decisions that may affect them. ChatsGenZ honours RTI requests in line with applicable data protection and platform transparency obligations.</p>
          <h2>2. What You Can Request</h2>
          <ul>
            <li>Information about what personal data ChatsGenZ holds about you</li>
            <li>How your data is collected, stored, and used by ChatsGenZ</li>
            <li>Details about any account actions taken against your account (bans, warnings)</li>
            <li>Clarification on platform policies as they apply to your specific situation</li>
            <li>Information about data retention periods for your account data</li>
          </ul>
          <h2>3. What Cannot Be Requested</h2>
          <ul>
            <li>Personal information about other users — this is protected by our Privacy Policy</li>
            <li>Confidential internal platform systems, source code, or infrastructure details</li>
            <li>Information that would compromise platform security or ongoing investigations</li>
            <li>Commercial or financial data about ChatsGenZ operations</li>
          </ul>
          <h2>4. How to Submit an RTI Request</h2>
          <p>To submit an RTI request, please use our Contact page and select the subject line RTI Request. Your request must include your registered username or email address, a clear description of the information you are requesting, and the reason for your request. We process all legitimate RTI requests within 30 days of receipt.</p>
          <h2>5. Our Response Process</h2>
          <p>Once we receive your RTI request, we will acknowledge it within 5 business days. We will then review your request and respond with the relevant information or an explanation if any part of the request cannot be fulfilled. If we need more time to gather the information, we will notify you within the initial 30-day window.</p>
          <h2>6. Data Access Under Privacy Law</h2>
          <p>In addition to RTI, you may have rights under applicable data protection laws to access, correct, or delete your personal data. These rights are separate from RTI and are covered in detail in our Privacy Policy. You can exercise these rights at any time by contacting us.</p>
          <p>To submit an RTI request, visit our <a href="/contact">Contact page</a> and select RTI Request as your subject.</p>
        </div>
      </div>
    </PageLayout>
  )
}
