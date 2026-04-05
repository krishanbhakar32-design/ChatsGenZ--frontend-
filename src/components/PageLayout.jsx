import SEO from './SEO.jsx'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import ScrollToTop from './ScrollToTop.jsx'

export default function PageLayout({ children, seo = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <ScrollToTop />
      {seo && Object.keys(seo).length > 0 && <SEO {...seo} />}
      {/* Header has position:sticky, top:0 so it stays fixed while scrolling */}
      <Header />
      <main style={{ flex: 1, background: '#fff' }}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
