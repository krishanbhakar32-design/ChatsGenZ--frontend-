import { useState } from 'react'
import PageLayout from '../../components/PageLayout.jsx'
import { Link } from 'react-router-dom'

const TABS = [
  { key: 'language', label: 'Language', icon: 'fi fi-sr-world' },
  { key: 'interest',  label: 'Interest',  icon: 'fi fi-sr-star' },
  { key: 'country',   label: 'Country',   icon: 'fi fi-sr-flag' },
  { key: 'adult',     label: 'Adult 18+', icon: 'fi fi-sr-lock' },
  { key: 'state',     label: 'State',     icon: 'fi fi-sr-marker' },
  { key: 'city',      label: 'City',      icon: 'fi fi-sr-building' },
]

const DATA = {
  language: [
    'English Chat','Hindi Chat','Spanish Chat','Arabic Chat','French Chat',
    'Portuguese Chat','Russian Chat','German Chat','Bengali Chat','Turkish Chat',
    'Japanese Chat','Korean Chat','Italian Chat','Urdu Chat','Malay Chat',
    'Indonesian Chat','Tagalog Chat','Vietnamese Chat','Thai Chat','Swahili Chat',
  ],
  interest: [
    'Music Chat','Movies and TV Chat','Gaming Chat','Sports Chat','Technology Chat',
    'Art and Design Chat','Fitness Chat','Food and Cooking Chat','Travel Chat','Books Chat',
    'Anime Chat','Photography Chat','Fashion Chat','Business Chat','Science Chat',
    'Politics Chat','Religion Chat','Relationships Chat','Comedy Chat','Crypto Chat',
  ],
  country: [
    'USA Chat','UK Chat','Canada Chat','Australia Chat','Nigeria Chat',
    'Philippines Chat','Pakistan Chat','Bangladesh Chat','Saudi Arabia Chat','UAE Chat',
    'South Africa Chat','Malaysia Chat','Singapore Chat','Ghana Chat','Kenya Chat',
    'Egypt Chat','Brazil Chat','Mexico Chat','Indonesia Chat','Turkey Chat',
  ],
  adult: null,
  state: [
    'California Chat','Texas Chat','New York Chat','Florida Chat','Illinois Chat',
    'Punjab Chat','Maharashtra Chat','Tamil Nadu Chat','Karnataka Chat','Gujarat Chat',
    'Lagos Chat','Kano Chat','Rivers Chat','Oyo Chat','Abuja Chat',
    'London Chat','Manchester Chat','Birmingham Chat','Leeds Chat','Glasgow Chat',
  ],
  city: [
    'New York City Chat','Los Angeles Chat','London Chat','Dubai Chat','Toronto Chat',
    'Sydney Chat','Mumbai Chat','Karachi Chat','Lagos Chat','Nairobi Chat',
    'Singapore Chat','Kuala Lumpur Chat','Cairo Chat','Riyadh Chat','Dhaka Chat',
    'Manila Chat','Jakarta Chat','Istanbul Chat','Berlin Chat','Paris Chat',
  ],
}

export default function ChatDirectory() {
  const [activeTab, setActiveTab] = useState('language')
  const [adultConfirmed, setAdultConfirmed] = useState(false)

  const items = DATA[activeTab]

  return (
    <PageLayout seo={{
      title: 'Chat Directory — Browse All Chat Rooms on ChatsGenZ',
      description: 'Browse all ChatsGenZ chat rooms by language, interest, country, state, city, and more. Find your perfect free chat room on ChatsGenZ — no registration required.',
      keywords: 'ChatsGenZ chat rooms, chat directory, free chat rooms by language, chat rooms by country, ChatsGenZ rooms list',
      canonical: '/chat-directory',
    }}>
      <div className="page-container" style={{ maxWidth: 1000 }}>
        <h1 className="page-title">Chat Directory</h1>
        <p className="page-subtitle">Browse all available chat rooms on ChatsGenZ. Filter by language, interest, country, state, or city.</p>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9,
              fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Outfit, sans-serif',
              background: activeTab === t.key ? 'linear-gradient(135deg,#1a73e8,#1557b0)' : '#fff',
              color: activeTab === t.key ? '#fff' : '#5f6368',
              border: activeTab === t.key ? 'none' : '1.5px solid #dadce0',
              boxShadow: activeTab === t.key ? '0 2px 10px rgba(26,115,232,.28)' : 'none',
              transition: 'all .18s',
            }}>
              <i className={t.icon} style={{ fontSize: 15 }} /> {t.label}
            </button>
          ))}
        </div>

        {/* ADULT WARNING */}
        {activeTab === 'adult' && !adultConfirmed ? (
          <div style={{ background: '#fef2f2', border: '1.5px solid #ea4335', borderRadius: 14, padding: '32px 28px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
            <i className="fi fi-sr-lock" style={{ fontSize: 36, color: '#ea4335', display: 'block', marginBottom: 16 }} />
            <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#202124', marginBottom: 10, fontFamily: 'Outfit, sans-serif' }}>Adult Content — Age Verification Required</h2>
            <p style={{ color: '#5f6368', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 24 }}>
              Adult chat rooms contain content suitable for users who are <strong>18 years of age or older</strong> only. By continuing, you confirm that you are 18+ and agree to our Terms of Service and Safety Terms.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setAdultConfirmed(true)} className="btn-primary" style={{ background: 'linear-gradient(135deg,#ea4335,#c5221f)' }}>
                <i className="fi fi-sr-check" /> I am 18+ — Continue
              </button>
              <button onClick={() => setActiveTab('language')} className="btn-outline">
                Go Back
              </button>
            </div>
          </div>
        ) : activeTab === 'adult' && adultConfirmed ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {['18+ General Chat','Adult Romance Chat','Adult Flirt Chat','Couples Chat','Mature Singles Chat','Adult Comedy Chat'].map((room, i) => (
              <Link to="/login" key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#fff', border: '1.5px solid #fca5a5', borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, color: '#202124', transition: 'all .15s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ea4335'; e.currentTarget.style.background = '#fef2f2' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.background = '#fff' }}
              >
                <i className="fi fi-sr-lock" style={{ color: '#ea4335', fontSize: 15 }} /> {room}
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
            {items && items.map((room, i) => (
              <Link to="/login" key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '13px 15px', background: '#fff', border: '1.5px solid #e8eaed', borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, color: '#202124', transition: 'all .15s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a73e8'; e.currentTarget.style.background = '#f0f5ff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8eaed'; e.currentTarget.style.background = '#fff' }}
              >
                <i className="fi fi-sr-angle-right" style={{ color: '#1a73e8', fontSize: 12, flexShrink: 0 }} /> {room}
              </Link>
            ))}
          </div>
        )}

        <div style={{ marginTop: 40, background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 14, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '0.975rem', color: '#202124', marginBottom: 4, fontFamily: 'Outfit, sans-serif' }}>Want to create your own room?</h3>
            <p style={{ fontSize: '0.85rem', color: '#5f6368' }}>Register for free and create a custom chat room for your language, country, or interest.</p>
          </div>
          <Link to="/login" className="btn-primary"><i className="fi fi-sr-plus" /> Create a Room</Link>
        </div>
      </div>
    </PageLayout>
  )
}
