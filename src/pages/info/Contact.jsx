import { useState } from 'react'
import PageLayout from '../../components/PageLayout.jsx'

const API = 'https://chatsgenz-backend-production.up.railway.app'

export default function Contact() {
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) { setError('Please fill in all required fields.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setSuccess(true)
        setForm({ name: '', email: '', subject: '', message: '' })
      } else {
        setError('Failed to send. Please try again shortly.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally { setLoading(false) }
  }

  return (
    <PageLayout seo={{
      title: "Contact Us – ChatsGenZ Support & Feedback",
      description: "Contact ChatsGenZ team. Send us your questions, feedback, bug reports, DMCA requests, or partnership enquiries. We respond within 24–48 hours.",
      keywords: "chatsgenz contact, chat support, free chat help, chatsgenz feedback, chatsgenz email",
      canonical: "/contact"
    }}>
      <div className="page-container">
        <h1 className="page-title">Contact Us</h1>
        <p className="page-subtitle">Have a question, feedback, or need help? We would love to hear from you!</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }} className="contact-grid">
          {/* FORM */}
          <div>
            <div className={`success-banner ${success ? 'show' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Your message has been sent! We will get back to you within 24–48 hours.
            </div>
            {error && (
              <div style={{ background: '#fce8e6', border: '1px solid #ea4335', borderRadius: 8, padding: '10px 16px', color: '#c5221f', fontSize: 14, marginBottom: 16, fontFamily: 'var(--font-2)' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="form-group">
                <label className="form-label">Your Name *</label>
                <input className="form-input" placeholder="Enter your full name" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-select" value={form.subject} onChange={e => set('subject', e.target.value)}>
                  <option value="">Select a topic...</option>
                  <option value="General Question">General Question</option>
                  <option value="Technical Issue / Bug Report">Technical Issue / Bug Report</option>
                  <option value="Account Problem">Account Problem</option>
                  <option value="Report a User / Content">Report a User / Content</option>
                  <option value="DMCA / Copyright Request">DMCA / Copyright Request</option>
                  <option value="RTI Request">RTI Request</option>
                  <option value="Partnership / Business Enquiry">Partnership / Business Enquiry</option>
                  <option value="Feedback / Suggestion">Feedback / Suggestion</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea className="form-textarea" placeholder="Write your message here..." value={form.message} onChange={e => set('message', e.target.value)} required style={{ minHeight: 140 }} />
              </div>
              <button
                type="submit" className="btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
              >
                {loading
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Sending...</>
                  : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send Message</>
                }
              </button>
            </form>
          </div>

          {/* INFO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '⏱️', title: "Response Time", text: "We aim to respond to all messages within 24–48 hours on business days.' },
              { icon: '🛡️', title: "Moderation Issues", text: "For urgent moderation concerns, use the in-platform report button for the fastest response.' },
              { icon: '⚖️', title: "Legal Requests", text: "For DMCA, RTI, and legal requests, please specify in the subject line for priority routing.' },
              { icon: '🤝', title: "Business Enquiries", text: "Interested in advertising, partnerships, or collaboration? Select "Business Enquiry" in the subject.' },
            ].map(i => (
              <div key={i.title} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', display: 'flex', gap: 14 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{i.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{i.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-2)', lineHeight: 1.6 }}>{i.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) { .contact-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </PageLayout>
  )
}
