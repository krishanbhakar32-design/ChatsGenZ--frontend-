import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import ScrollToTop from './components/ScrollToTop.jsx'
import { ToastProvider } from './components/Toast.jsx'

const Home          = lazy(() => import('./pages/Home.jsx'))
const Login         = lazy(() => import('./pages/Login.jsx'))
const VerifyEmail   = lazy(() => import('./pages/VerifyEmail.jsx'))
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'))
const ChatLobby     = lazy(() => import('./pages/chat/ChatLobby.jsx'))
const ChatRoom      = lazy(() => import('./pages/chat/ChatRoom.jsx'))
const NotFound      = lazy(() => import('./pages/NotFound.jsx'))
const Kicked        = lazy(() => import('./pages/Kicked.jsx'))
const Profile       = lazy(() => import('./pages/Profile.jsx'))
const AdminPanel    = lazy(() => import('./pages/AdminPanel.jsx'))
const About         = lazy(() => import('./pages/info/About.jsx'))
const Blog          = lazy(() => import('./pages/info/Blog.jsx'))
const ChatDirectory = lazy(() => import('./pages/info/ChatDirectory.jsx'))
const Community     = lazy(() => import('./pages/info/Community.jsx'))
const Contact       = lazy(() => import('./pages/info/Contact.jsx'))
const Disclaimer    = lazy(() => import('./pages/info/Disclaimer.jsx'))
const FAQ           = lazy(() => import('./pages/info/FAQ.jsx'))
const Forum         = lazy(() => import('./pages/info/Forum.jsx'))
const Help          = lazy(() => import('./pages/info/Help.jsx'))
const Moderation    = lazy(() => import('./pages/info/Moderation.jsx'))
const Ranks         = lazy(() => import('./pages/info/Ranks.jsx'))
const RTI           = lazy(() => import('./pages/info/RTI.jsx'))
const Sitemap       = lazy(() => import('./pages/info/Sitemap.jsx'))
const ChatRules     = lazy(() => import('./pages/legal/ChatRules.jsx'))
const CookiePolicy  = lazy(() => import('./pages/legal/CookiePolicy.jsx'))
const DMCA          = lazy(() => import('./pages/legal/DMCA.jsx'))
const LegalTerms    = lazy(() => import('./pages/legal/LegalTerms.jsx'))
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy.jsx'))
const SafetyTerms   = lazy(() => import('./pages/legal/SafetyTerms.jsx'))
const Terms         = lazy(() => import('./pages/legal/Terms.jsx'))

function Loader() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8f9fa'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:42,height:42,border:'4px solid #e8eaed',borderTop:'4px solid #1a73e8',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 12px'}}/>
        <div style={{fontSize:'0.85rem',color:'#9ca3af',fontFamily:'Nunito,sans-serif'}}>Loading ChatsGenZ...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/verify-email"   element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/chat"           element={<ChatLobby />} />
          <Route path="/chat/:roomId"   element={<ChatRoom />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/admin"          element={<AdminPanel />} />
          <Route path="/about"          element={<About />} />
          <Route path="/blog"           element={<Blog />} />
          <Route path="/chat-directory" element={<ChatDirectory />} />
          <Route path="/community"      element={<Community />} />
          <Route path="/contact"        element={<Contact />} />
          <Route path="/disclaimer"     element={<Disclaimer />} />
          <Route path="/faq"            element={<FAQ />} />
          <Route path="/forum"          element={<Forum />} />
          <Route path="/help"           element={<Help />} />
          <Route path="/moderation"     element={<Moderation />} />
          <Route path="/ranks"          element={<Ranks />} />
          <Route path="/rti"            element={<RTI />} />
          <Route path="/sitemap"        element={<Sitemap />} />
          <Route path="/chat-rules"     element={<ChatRules />} />
          <Route path="/cookie-policy"  element={<CookiePolicy />} />
          <Route path="/dmca"           element={<DMCA />} />
          <Route path="/legal"          element={<LegalTerms />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/safety"         element={<SafetyTerms />} />
          <Route path="/terms"          element={<Terms />} />
          <Route path="/kicked"         element={<Kicked />} />
          <Route path="*"               element={<NotFound />} />
        </Routes>
      </Suspense>
    </ToastProvider>
  )
}
