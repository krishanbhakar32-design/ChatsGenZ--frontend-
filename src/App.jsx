import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import ScrollToTop from './components/ScrollToTop.jsx'

// Pages — lazy loaded for performance
const Home          = lazy(() => import('./pages/Home.jsx'))
const About         = lazy(() => import('./pages/info/About.jsx'))
const RTI           = lazy(() => import('./pages/info/RTI.jsx'))
const Blog          = lazy(() => import('./pages/info/Blog.jsx'))
const Forum         = lazy(() => import('./pages/info/Forum.jsx'))
const Disclaimer    = lazy(() => import('./pages/info/Disclaimer.jsx'))
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy.jsx'))
const Terms         = lazy(() => import('./pages/legal/Terms.jsx'))
const DMCA          = lazy(() => import('./pages/legal/DMCA.jsx'))
const ChatRules     = lazy(() => import('./pages/legal/ChatRules.jsx'))
const LegalTerms    = lazy(() => import('./pages/legal/LegalTerms.jsx'))
const CookiePolicy  = lazy(() => import('./pages/legal/CookiePolicy.jsx'))
const SafetyTerms   = lazy(() => import('./pages/legal/SafetyTerms.jsx'))
const ChatDirectory = lazy(() => import('./pages/info/ChatDirectory.jsx'))
const Ranks         = lazy(() => import('./pages/info/Ranks.jsx'))
const Moderation    = lazy(() => import('./pages/info/Moderation.jsx'))
const Contact       = lazy(() => import('./pages/info/Contact.jsx'))
const Help          = lazy(() => import('./pages/info/Help.jsx'))
const FAQ           = lazy(() => import('./pages/info/FAQ.jsx'))
const Sitemap       = lazy(() => import('./pages/info/Sitemap.jsx'))
const Community     = lazy(() => import('./pages/info/Community.jsx'))
const NotFound      = lazy(() => import('./pages/NotFound.jsx'))

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e8f0fe', borderTop: '3px solid #1a73e8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#5f6368', fontSize: 14, fontFamily: 'Outfit, sans-serif' }}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/"                 element={<Home />} />
          <Route path="/about"            element={<About />} />
          <Route path="/rti"              element={<RTI />} />
          <Route path="/blog"             element={<Blog />} />
          <Route path="/forum"            element={<Forum />} />
          <Route path="/disclaimer"       element={<Disclaimer />} />
          <Route path="/privacy-policy"   element={<PrivacyPolicy />} />
          <Route path="/terms"            element={<Terms />} />
          <Route path="/dmca"             element={<DMCA />} />
          <Route path="/chat-rules"       element={<ChatRules />} />
          <Route path="/legal"            element={<LegalTerms />} />
          <Route path="/cookie-policy"    element={<CookiePolicy />} />
          <Route path="/safety"           element={<SafetyTerms />} />
          <Route path="/chat-directory"   element={<ChatDirectory />} />
          <Route path="/ranks"            element={<Ranks />} />
          <Route path="/moderation"       element={<Moderation />} />
          <Route path="/contact"          element={<Contact />} />
          <Route path="/help"             element={<Help />} />
          <Route path="/faq"              element={<FAQ />} />
          <Route path="/sitemap"          element={<Sitemap />} />
          <Route path="/community"        element={<Community />} />
          <Route path="*"                 element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}
