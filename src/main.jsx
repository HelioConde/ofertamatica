import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import SeoLandingPage from './seo/SeoLandingPage'
import SeoGrowthSections from './seo/SeoGrowthSections'
import { SEO_PAGE_BY_PATH } from './seo/seoPages'
import './styles.css'
import './styles/posters.css'

const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
const seoPage = SEO_PAGE_BY_PATH[pathname]

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {seoPage ? (
      <SeoLandingPage page={seoPage} />
    ) : (
      <>
        <App />
        <SeoGrowthSections />
      </>
    )}
  </StrictMode>,
)
