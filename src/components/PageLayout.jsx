import SEO from './SEO.jsx'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import ScrollToTop from './ScrollToTop.jsx'

export default function PageLayout({ children, seo = {} }) {
  return (
    <>
      <ScrollToTop />
      {seo && Object.keys(seo).length > 0 && <SEO {...seo} />}
      <Header />
      <main style={{ minHeight: '60vh', background: '#fff' }}>
        {children}
      </main>
      <Footer />
    </>
  )
}
