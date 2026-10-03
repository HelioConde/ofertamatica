import { useEffect } from 'react'
import { SITE_URL, SEO_PAGES } from './seoPages'
import './seo.css'

function Brand() {
  return (
    <a className="seo-brand" href="/" aria-label="Ofertamática">
      <span className="seo-brand-mark">✓</span>
      <strong>Ofertamática</strong>
    </a>
  )
}

function setMeta(page) {
  document.title = page.title
  const description = document.querySelector('meta[name="description"]')
  if (description) description.setAttribute('content', page.description)

  const keywords = document.querySelector('meta[name="keywords"]')
  if (keywords) keywords.setAttribute('content', page.keywords)

  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = `${SITE_URL}/${page.slug}/`

  const ogTitle = document.querySelector('meta[property="og:title"]')
  const ogDescription = document.querySelector('meta[property="og:description"]')
  const ogUrl = document.querySelector('meta[property="og:url"]')
  if (ogTitle) ogTitle.setAttribute('content', page.title)
  if (ogDescription) ogDescription.setAttribute('content', page.description)
  if (ogUrl) ogUrl.setAttribute('content', canonical.href)
}

export default function SeoLandingPage({ page }) {
  useEffect(() => {
    setMeta(page)
    window.scrollTo(0, 0)
  }, [page])

  return (
    <div className="seo-page">
      <header className="seo-header">
        <div className="seo-shell seo-nav">
          <Brand />
          <nav aria-label="Navegação">
            <a href="/">Criar cartaz</a>
            <a href="/#formatos">Formatos</a>
            <a href="/#faq">Dúvidas</a>
          </nav>
          <a className="seo-nav-cta" href="/">Criar grátis</a>
        </div>
      </header>

      <main>
        <section className="seo-hero">
          <div className="seo-shell seo-hero-grid">
            <div>
              <span className="seo-eyebrow">{page.eyebrow}</span>
              <h1>{page.h1}</h1>
              <p>{page.intro}</p>
              <div className="seo-hero-actions">
                <a className="seo-primary" href="/">Criar meu cartaz</a>
                <a className="seo-secondary" href="/gerador-de-cartaz-com-ia/">Crie seu cartaz com IA</a>
              </div>
              <div className="seo-trust">
                <span>✓ Online</span><span>✓ Rápido</span><span>✓ Pronto para imprimir</span>
              </div>
            </div>

            <aside className="seo-demo" aria-label="Exemplo de cartaz">
              <span className="seo-demo-label">OFERTA</span>
              <strong>Café tradicional</strong>
              <small>500 g</small>
              <div><sup>R$</sup><b>18,90</b></div>
              <em>Exemplo visual</em>
            </aside>
          </div>
        </section>

        <section className="seo-section">
          <div className="seo-shell">
            <span className="seo-eyebrow">POR QUE USAR</span>
            <h2>Cartazes pensados para a rotina do varejo</h2>
            <div className="seo-benefits">
              {page.benefits.map((benefit, index) => (
                <article key={benefit}><span>0{index + 1}</span><strong>{benefit}</strong></article>
              ))}
            </div>
          </div>
        </section>

        <section className="seo-section seo-how">
          <div className="seo-shell">
            <span className="seo-eyebrow">COMO FUNCIONA</span>
            <h2>Da lista de produtos à impressão</h2>
            <div className="seo-steps">
              <article><b>1</b><h3>Escolha o formato</h3><p>Defina A4, A3 ou a quantidade de cartazes por folha.</p></article>
              <article><b>2</b><h3>Adicione os produtos</h3><p>Cole sua lista, importe um arquivo e revise as informações interpretadas.</p></article>
              <article><b>3</b><h3>Personalize e imprima</h3><p>Ajuste cores, cabeçalhos e estilo, confira a prévia e imprima.</p></article>
            </div>
          </div>
        </section>

        <section className="seo-ai">
          <div className="seo-shell seo-ai-card">
            <div><span className="seo-eyebrow">DIFERENCIAL OFERTAMÁTICA</span><h2>Crie seu cartaz com IA</h2><p>Use tecnologia para acelerar a interpretação dos produtos, a organização das informações e a criação de ofertas em volume.</p></div>
            <a className="seo-primary" href="/">Criar cartaz com IA</a>
          </div>
        </section>

        <section className="seo-section">
          <div className="seo-shell">
            <span className="seo-eyebrow">EXPLORE</span>
            <h2>Mais formas de criar suas ofertas</h2>
            <div className="seo-link-grid">
              {SEO_PAGES.filter((item) => item.slug !== page.slug).slice(0, 6).map((item) => (
                <a key={item.slug} href={`/${item.slug}/`}><strong>{item.h1}</strong><span>Ver página →</span></a>
              ))}
            </div>
          </div>
        </section>

        <section className="seo-final-cta">
          <div className="seo-shell">
            <span className="seo-eyebrow">COMECE AGORA</span>
            <h2>Transforme sua lista de produtos em cartazes de oferta.</h2>
            <p>Escolha o formato, revise as informações e prepare a impressão no Ofertamática.</p>
            <a className="seo-primary" href="/">Criar cartaz grátis</a>
          </div>
        </section>
      </main>

      <footer className="seo-footer"><div className="seo-shell"><Brand /><span>Cartazes de oferta para o varejo.</span></div></footer>
    </div>
  )
}
