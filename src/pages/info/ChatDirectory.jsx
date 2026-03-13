import { useState } from 'react'
import PageLayout from '../../components/PageLayout.jsx'
import { Link } from 'react-router-dom'

const LANGUAGES = [
  { id: 'english', label: 'English', flag: '🇬🇧' },
  { id: 'hindi', label: 'Hindi', flag: '🇮🇳' },
  { id: 'arabic', label: 'Arabic', flag: '🇸🇦' },
  { id: 'spanish', label: 'Spanish', flag: '🇪🇸' },
  { id: 'french', label: 'French', flag: '🇫🇷' },
  { id: 'urdu', label: 'Urdu', flag: '🇵🇰' },
  { id: 'bengali', label: 'Bengali', flag: '🇧🇩' },
  { id: 'portuguese', label: 'Portuguese', flag: '🇧🇷' },
  { id: 'turkish', label: 'Turkish', flag: '🇹🇷' },
  { id: 'indonesian', label: 'Indonesian', flag: '🇮🇩' },
  { id: 'malay', label: 'Malay', flag: '🇲🇾' },
  { id: 'tagalog', label: 'Tagalog', flag: '🇵🇭' },
]

const INTERESTS = [
  { id: 'general', label: 'General Chat', icon: '💬' },
  { id: 'friendship', label: 'Friendship', icon: '🤝' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'movies', label: 'Movies and TV', icon: '🎬' },
  { id: 'tech', label: 'Technology', icon: '💻' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'food', label: 'Food and Cooking', icon: '🍕' },
  { id: 'art', label: 'Art and Creativity', icon: '🎨' },
  { id: 'study', label: 'Study and Learning', icon: '📚' },
  { id: 'dating', label: 'Dating and Love', icon: '💕' },
  { id: 'news', label: 'News and Politics', icon: '📰' },
  { id: 'memes', label: 'Memes and Fun', icon: '😂' },
  { id: 'quiz', label: 'Quiz and Games', icon: '🎯' },
]

const COUNTRIES = [
  { id: 'in', label: 'India', flag: '🇮🇳' },
  { id: 'pk', label: 'Pakistan', flag: '🇵🇰' },
  { id: 'bd', label: 'Bangladesh', flag: '🇧🇩' },
  { id: 'sg', label: 'Singapore', flag: '🇸🇬' },
  { id: 'my', label: 'Malaysia', flag: '🇲🇾' },
  { id: 'ae', label: 'UAE', flag: '🇦🇪' },
  { id: 'sa', label: 'Saudi Arabia', flag: '🇸🇦' },
  { id: 'us', label: 'United States', flag: '🇺🇸' },
  { id: 'gb', label: 'United Kingdom', flag: '🇬🇧' },
  { id: 'ca', label: 'Canada', flag: '🇨🇦' },
  { id: 'au', label: 'Australia', flag: '🇦🇺' },
  { id: 'ph', label: 'Philippines', flag: '🇵🇭' },
  { id: 'ng', label: 'Nigeria', flag: '🇳🇬' },
  { id: 'tr', label: 'Turkey', flag: '🇹🇷' },
  { id: 'eg', label: 'Egypt', flag: '🇪🇬' },
  { id: 'id', label: 'Indonesia', flag: '🇮🇩' },
]

const STATES = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana',
  'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Punjab',
  'Kerala', 'Haryana', 'Madhya Pradesh', 'Bihar', 'Odisha',
]

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur',
  'Lucknow', 'Chandigarh', 'Indore', 'Nagpur', 'Patna',
]

const TABS = [
  { id: 'language', label: 'By Language', icon: '🌐' },
  { id: 'interest', label: 'By Interest', icon: '🎯' },
  { id: 'adult',    label: 'Adult Rooms',  icon: '🔞' },
  { id: 'country',  label: 'By Country',   icon: '🌍' },
  { id: 'state',    label: 'By State',     icon: '📍' },
  { id: 'city',     label: 'By City',      icon: '🏙️' },
]

function FilterBtn({ item, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px', borderRadius: 10,
      border: '1.5px solid #e8eaed', background: '#fff',
      color: '#202124', fontWeight: 500, fontSize: '0.875rem',
      cursor: 'pointer', transition: 'all 0.15s',
      textAlign: 'left', fontFamily: "'Outfit', sans-serif",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a73e8'; e.currentTarget.style.background = '#f0f7ff' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8eaed'; e.currentTarget.style.background = '#fff' }}
    >
      <span style={{ fontSize: '1.1rem' }}>{item.flag || item.icon}</span>
      <span>{item.label}</span>
    </button>
  )
}

export default function ChatDirectory() {
  const [activeTab, setActiveTab] = useState('language')

  const renderContent = () => {
    switch (activeTab) {
      case 'language':
        return (
          <div>
            <p style={{ color: '#5f6368', fontSize: '0.875rem', marginBottom: 20 }}>
              Find chat rooms in your preferred language. Connect with speakers from around the world.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 10 }}>
              {LANGUAGES.map(l => <FilterBtn key={l.id} item={l} onClick={() => {}} />)}
            </div>
          </div>
        )
      case 'interest':
        return (
          <div>
            <p style={{ color: '#5f6368', fontSize: '0.875rem', marginBottom: 20 }}>
              Chat about what you love. Browse rooms organized by topic and interest.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 10 }}>
              {INTERESTS.map(l => <FilterBtn key={l.id} item={l} onClick={() => {}} />)}
            </div>
          </div>
        )
      case 'adult':
        return (
          <div>
            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 10, padding: '14px 18px', marginBottom: 22 }}>
              <p style={{ fontSize: '0.875rem', color: '#7a4500', fontWeight: 600, marginBottom: 4 }}>
                Age Verification Required
              </p>
              <p style={{ fontSize: '0.825rem', color: '#7a4500', lineHeight: 1.6 }}>
                Adult chat rooms are available only to verified users aged 18 and above. You must verify your age through your account settings before accessing these rooms. By entering adult rooms you confirm you are 18+.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 10 }}>
              {['18+ General', 'Flirting', 'Hot Chat', 'Mature Discussions', 'Adult Comedy', 'Relationships'].map(label => (
                <FilterBtn key={label} item={{ label, icon: '🔞' }} onClick={() => {}} />
              ))}
            </div>
          </div>
        )
      case 'country':
        return (
          <div>
            <p style={{ color: '#5f6368', fontSize: '0.875rem', marginBottom: 20 }}>
              Join chat rooms specific to your country. Meet locals and expats from the same nation.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 10 }}>
              {COUNTRIES.map(l => <FilterBtn key={l.id} item={l} onClick={() => {}} />)}
            </div>
          </div>
        )
      case 'state':
        return (
          <div>
            <p style={{ color: '#5f6368', fontSize: '0.875rem', marginBottom: 20 }}>
              Browse rooms for states across India. Conversation in regional languages and local topics.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 10 }}>
              {STATES.map(s => <FilterBtn key={s} item={{ label: s, icon: '📍' }} onClick={() => {}} />)}
            </div>
          </div>
        )
      case 'city':
        return (
          <div>
            <p style={{ color: '#5f6368', fontSize: '0.875rem', marginBottom: 20 }}>
              Find people from your city. Local chat rooms for major cities.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 10 }}>
              {CITIES.map(c => <FilterBtn key={c} item={{ label: c, icon: '🏙️' }} onClick={() => {}} />)}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <PageLayout seo={{
      title: "Chat Directory — Browse Free Chat Rooms | ChatsGenZ",
      description: "Browse all ChatsGenZ chat rooms by language, interest, country, state, and city. Find the perfect room to chat with strangers online for free worldwide.",
      keywords: "chat rooms directory, language chat rooms, interest chat rooms, country chat rooms, free chat online, chatsgenz rooms",
      canonical: "/chat-directory",
    }}>
      <div className="page-container">
        <h1 className="page-title">Chat Directory</h1>
        <p className="page-subtitle">Find your perfect chat room. Browse by language, interest, country, state, or city.</p>

        {/* Tab Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32, padding: '4px 0' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 24,
              border: activeTab === tab.id ? '2px solid #1a73e8' : '1.5px solid #e8eaed',
              background: activeTab === tab.id ? '#e8f0fe' : '#fff',
              color: activeTab === tab.id ? '#1a73e8' : '#5f6368',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.875rem', cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              transition: 'all 0.15s',
            }}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 14, padding: '28px 24px', minHeight: 300 }}>
          {renderContent()}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 32, textAlign: 'center', background: '#f8f9fa', borderRadius: 14, padding: '32px 20px' }}>
          <p style={{ color: '#5f6368', marginBottom: 16, fontSize: '0.95rem' }}>
            Ready to join a room? Login or enter as a guest to start chatting instantly.
          </p>
          <Link to="/login" style={{
            display: 'inline-block', padding: '12px 28px', borderRadius: 9,
            background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
            color: '#fff', fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 2px 12px rgba(26,115,232,0.3)',
          }}>
            Enter Chat Rooms Free
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}
