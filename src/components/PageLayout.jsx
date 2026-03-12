import Header from './Header.jsx'
import Footer from './Footer.jsx'
import SEO from './SEO.jsx'

export default function PageLayout({ children, seo = {} }) {
  return (
    <>
      <SEO {...seo} />
      <Header />
      <div className="page-wrapper">
        {children}
      </div>
      <Footer />
    </>
  )
}
