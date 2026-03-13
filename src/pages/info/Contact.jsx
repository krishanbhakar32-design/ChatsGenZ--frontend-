import { useState } from 'react'
import PageLayout from '../../components/PageLayout.jsx'
import { notify } from '../../components/Notification.jsx'

const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'

const INFO = [
  { icon: 'fi fi-sr-clock',     color: '#1a73e8', title: 'Response Time',      text: 'We aim to respond to all messages within 24 to 48 hours on business days.' },
  { icon: 'fi fi-sr-shield',    color: '#ea4335', title: 'Moderation Issues',   text: 'For urgent moderation concerns, use the in-platform report button for the fastest response.' },
  { icon: 'fi fi-sr-scale',     color: '#34a853', title: 'Legal Requests',      text: 'For DMCA, RTI, and legal requests, please specify in the subject line for priority routing.' },
  { icon: 'fi fi-sr-handshake', color: '#fbbc04', title: 'Business Enquiries',  text: 'Interested in advertising, partnerships, or collaboration? Select Business Enquiry in the subject.' },
]

export default function Contact() {
  const [form, setForm]       = useState({ username: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username || !form.email || !form.subject || !form.message) {
      notify('Please fill in all required fields.', 'warning'); return
    }
    setLoading(true)
    try {
      const res  = await fetch(`${API}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess(true)
        setForm({ username: '', email: '', subject: '', message: '' })
        notify('Message sent! We will reply within 24 hours.', 'success', 5000)
      } else {
        notify(data.error || 'Failed to send. Please try again.', 'error')
      }
    } catch {
      notify('Network error. Please check your connection.', 'error')
    } finally { setLoading(false) }
  }

  const inp = { onFocus: e => e.target.style.borderColor = '#1a73e8', onBlur: e => e.target.style.borderColor = '#dadce0' }

  return (
    <PageLayout seo={{
      title: 'Contact Us — ChatsGenZ Support and Feedback',
      description: 'Contact the ChatsGenZ team. Send questions, feedback, bug reports, DMCA requests, or partnership enquiries. ChatsGenZ support responds within 24 to 48 hours.',
      keywords: 'ChatsGenZ contact, ChatsGenZ support, ChatsGenZ help, ChatsGenZ feedback, contact ChatsGenZ team',
      canonical: '/contact',
    }}>
      <div className="page-container">
        <h1 className="page-title">Contact Us</h1>
        <p className="page-subtitle">Questions, feedback, or need help? We would love to hear from you.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 32, alignItems: 'start' }} className="contact-grid">

          {/* FORM */}
          <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 16, padding: 28 }}>
            {success && (
              <div className="info-green" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="fi fi-sr-check-circle" style={{ fontSize: 18 }} />
                Your message has been sent! We will reply within 24 hours.
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="form-label">Name or Username <span style={{ color: '#ea4335' }}>*</span></label>
                <input className="form-input" placeholder="Your name or username" value={form.username} onChange={e => set('username', e.target.value)} required {...inp} />
              </div>
              <div>
                <label className="form-label">Email Address <span style={{ color: '#ea4335' }}>*</span></label>
                <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} required {...inp} />
              </div>
              <div>
                <label className="form-label">Subject <span style={{ color: '#ea4335' }}>*</span></label>
                <select className="form-select" value={form.subject} onChange={e => set('subject', e.target.value)} required {...inp}>
                  <option value="">Select a topic...</option>
                  <option value="General Question">General Question</option>
                  <option value="Technical Issue / Bug Report">Technical Issue / Bug Report</option>
                  <option value="Account Problem">Account Problem</option>
                  <option value="Report a User / Content">Report a User / Content</option>
                  <option value="DMCA / Copyright Request">DMCA / Copyright Request</option>
                  <option value="RTI Request">RTI Request</option>
                  <option value="Business Enquiry">Business Enquiry</option>
                  <option value="Feedback / Suggestion">Feedback / Suggestion</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">Message <span style={{ color: '#ea4335' }}>*</span></label>
                <textarea className="form-textarea" placeholder="Write your message here..." value={form.message} onChange={e => set('message', e.target.value)} required rows={5} {...inp} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: 'center', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Sending...</>
                  : <><i className="fi fi-sr-paper-plane" /> Send Message</>
                }
              </button>
            </form>
          </div>

          {/* INFO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {INFO.map((item, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 12, padding: '18px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, background: item.color + '15', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, fontSize: 18, flexShrink: 0 }}>
                  <i className={item.icon} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#202124', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: '0.83rem', color: '#5f6368', lineHeight: 1.6 }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 680px) { .contact-grid { grid-template-columns: 1fr !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </PageLayout>
  )
}
