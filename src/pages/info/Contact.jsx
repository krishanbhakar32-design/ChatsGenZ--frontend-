import { useState } from 'react'
import PageLayout from '../../components/PageLayout.jsx'

export default function Contact() {
  const [form, setForm]       = useState({ username: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); setSent(false) }

  async function handleSubmit(e) {
    e.preventDefault()
    const { username, email, subject, message } = form
    if (!username.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Please fill in all fields.'); return
    }
    setLoading(true); setError('')

    // Use Web3Forms - free, no backend needed, sends to any email
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '00000000-0000-0000-0000-000000000000', // placeholder - replace with real key
          subject: `[ChatsGenZ Contact] ${subject}`,
          from_name: username,
          email: email,
          message: `Name: ${username}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
          replyto: email,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
        setForm({ username: '', email: '', subject: '', message: '' })
      } else {
        // Fallback - try backend
        await tryBackend({ username, email, subject, message })
      }
    } catch {
      await tryBackend({ username, email, subject, message })
    } finally {
      setLoading(false)
    }
  }

  async function tryBackend({ username, email, subject, message }) {
    const API = import.meta.env.VITE_API_URL || 'https://chatsgenz-backend-production.up.railway.app'
    try {
      const res  = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, subject, message }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSent(true)
        setForm({ username: '', email: '', subject: '', message: '' })
      } else {
        setError('Failed to send. Please email us directly at helpchatsgenz@gmail.com')
      }
    } catch {
      setError('Failed to send. Please email us directly at helpchatsgenz@gmail.com')
    }
  }

  const inp = {
    display:'block', width:'100%', padding:'11px 14px',
    border:'1.5px solid #dadce0', borderRadius:9,
    fontSize:'0.9rem', color:'#202124', fontFamily:'inherit',
    outline:'none', boxSizing:'border-box', background:'#fff',
    transition:'border-color .15s',
  }

  return (
    <PageLayout seo={{
      title: 'Contact Us — ChatsGenZ Support',
      description: 'Contact the ChatsGenZ team for help, bug reports, account issues, DMCA requests, or any enquiry. We reply within 24 to 48 hours.',
      keywords: 'ChatsGenZ contact, ChatsGenZ support, contact ChatsGenZ, ChatsGenZ help',
      canonical: '/contact',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px 18px 48px' }}>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(1.4rem,4vw,1.9rem)', color:'#202124', marginBottom:8 }}>Contact Us</h1>
        <p style={{ color:'#5f6368', fontSize:'0.9rem', marginBottom:10, lineHeight:1.7 }}>Have a question or need help? Fill the form below and we'll get back to you within 24–48 hours.</p>
        <p style={{ color:'#5f6368', fontSize:'0.88rem', marginBottom:28, lineHeight:1.7 }}>Contact us for account issues, moderation complaints, DMCA requests, RTI queries, bugs, or business enquiries.</p>

        {sent && (
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'#e6f4ea', border:'1px solid #b7dfbf', borderRadius:10, padding:'14px 18px', marginBottom:24 }}>
            <span style={{ fontSize:20 }}>✅</span>
            <span style={{ fontSize:'0.9rem', color:'#1e4620', fontWeight:600 }}>Message sent! We will reply within 24–48 hours.</span>
          </div>
        )}

        {error && (
          <div style={{ background:'#fce8e6', border:'1px solid #f5c6c2', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:'0.875rem', color:'#c62828' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ display:'block', fontSize:'0.84rem', fontWeight:700, color:'#3c4043', marginBottom:6 }}>Name / Username <span style={{ color:'#ea4335' }}>*</span></label>
            <input style={inp} placeholder="Your name or username" value={form.username}
              onChange={e => set('username', e.target.value)}
              onFocus={e => e.target.style.borderColor='#1a73e8'}
              onBlur={e => e.target.style.borderColor='#dadce0'} required />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.84rem', fontWeight:700, color:'#3c4043', marginBottom:6 }}>Email Address <span style={{ color:'#ea4335' }}>*</span></label>
            <input type="email" style={inp} placeholder="your@email.com" value={form.email}
              onChange={e => set('email', e.target.value)}
              onFocus={e => e.target.style.borderColor='#1a73e8'}
              onBlur={e => e.target.style.borderColor='#dadce0'} required />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.84rem', fontWeight:700, color:'#3c4043', marginBottom:6 }}>Subject <span style={{ color:'#ea4335' }}>*</span></label>
            <select style={{ ...inp, appearance:'none', cursor:'pointer' }} value={form.subject}
              onChange={e => set('subject', e.target.value)}
              onFocus={e => e.target.style.borderColor='#1a73e8'}
              onBlur={e => e.target.style.borderColor='#dadce0'} required>
              <option value="">Select a topic...</option>
              <option>General Question</option>
              <option>Technical Issue / Bug Report</option>
              <option>Account Problem</option>
              <option>Report a User / Content</option>
              <option>DMCA / Copyright Request</option>
              <option>RTI Request</option>
              <option>Business Enquiry</option>
              <option>Feedback / Suggestion</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.84rem', fontWeight:700, color:'#3c4043', marginBottom:6 }}>Message <span style={{ color:'#ea4335' }}>*</span></label>
            <textarea style={{ ...inp, resize:'vertical', minHeight:120 }} placeholder="Write your message..."
              value={form.message} onChange={e => set('message', e.target.value)}
              onFocus={e => e.target.style.borderColor='#1a73e8'}
              onBlur={e => e.target.style.borderColor='#dadce0'} required rows={5} />
          </div>
          <button type="submit" disabled={loading} style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'13px', borderRadius:10, border:'none',
            background: loading ? '#9aa0a6' : 'linear-gradient(135deg,#1a73e8,#1557b0)',
            color:'#fff', fontWeight:800, fontSize:'0.95rem',
            fontFamily:'Outfit,sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 3px 12px rgba(26,115,232,.32)',
          }}>
            {loading
              ? <><span style={{ width:15,height:15,border:'2px solid rgba(255,255,255,.4)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .8s linear infinite',display:'inline-block' }} /> Sending...</>
              : <><i className="fi fi-sr-paper-plane" /> Send Message</>}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </PageLayout>
  )
}
