import { useEffect, useRef, useState } from 'react'
import {
  PUBLIC_PAGES,
  SEO_FAQS,
  SEO_PAGES,
  SITE_URL,
} from '../seo/seoPages'
import '../styles/marketing.css'

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-9514218545388169'
const ADSENSE_SLOTS = {
  'seo-content': '5483033524',
  'format-grid': '7286894770',
}

const CREATOR_META = {
  title: 'Ofertamática — Cartaz de oferta pronto em 2 cliques',
  description: 'Crie placas de oferta em 2 cliques: escolha o formato, cole sua lista e gere. Grátis, sem cadastro e com personalização opcional para supermercado e varejo.',
  path: '/',
}

const POSTER_STYLE_KEY = 'ofertamatica:poster-style:v1'

const MODEL_PRESETS = [
  { id: 'classic', name: 'Clássico de oferta', category: 'Essenciais', label: 'OFERTA', background: '#f5e66d', price: '#d91b2b', text: '#101010', header: '#e51e31', headerText: '#d91b2b', variant: 'classic', product: 'CAFÉ 500 g', value: '18,90', note: 'Visual varejo com descrição condensada, preço grande e leitura rápida.' },
  { id: 'relampago', name: 'Oferta relâmpago', category: 'Impacto', label: 'OFERTA RELÂMPAGO', background: '#f02b45', price: '#fff200', text: '#ffffff', header: '#b80925', headerText: '#ffffff', variant: 'flash', product: 'REFRIGERANTE 2 L', value: '6,99', note: 'Alto contraste para promoções curtas e chamadas urgentes.' },
  { id: 'super-oferta', name: 'Super oferta', category: 'Impacto', label: 'SUPER OFERTA', background: '#ffea00', price: '#d8001d', text: '#111111', header: '#0c59c7', headerText: '#ffffff', variant: 'super', product: 'ARROZ 5 kg', value: '24,90', note: 'Visual forte para ponta de gôndola e produtos campeões.' },
  { id: 'economia', name: 'Economia de verdade', category: 'Essenciais', label: 'ECONOMIA', background: '#fff5b5', price: '#d71920', text: '#16324a', header: '#16734a', headerText: '#ffffff', variant: 'savings', product: 'FEIJÃO 1 kg', value: '7,49', note: 'Mais sóbrio, ótimo para comunicação recorrente de preço.' },
  { id: 'de-por', name: 'De / Por', category: 'Vendas', label: 'OFERTA', background: '#fff7a8', price: '#d71920', text: '#172033', header: '#e51e31', headerText: '#ffffff', variant: 'depor', product: 'CAFÉ 500 g', value: '18,90', note: 'Preço anterior e preço de oferta sem criar outra placa do zero.' },
  { id: 'segunda-unidade', name: '2ª unidade', category: 'Vendas', label: '2ª UNIDADE', background: '#fff0f5', price: '#d71920', text: '#172033', header: '#7b2cbf', headerText: '#ffffff', variant: 'second-unit', product: 'SHAMPOO 350 ml', value: '14,99', note: 'Mostre o preço da primeira unidade e o valor especial da segunda.' },
  { id: 'hortifruti', name: 'Hortifruti', category: 'Setores', label: 'FRESQUINHOS', background: '#20a464', price: '#fff000', text: '#ffffff', header: '#0b7042', headerText: '#ffffff', variant: 'fresh', product: 'BANANA PRATA kg', value: '4,99', note: 'Verde vivo para feira, frutas, legumes e verduras.' },
  { id: 'acougue', name: 'Açougue', category: 'Setores', label: 'AÇOUGUE', background: '#8f1723', price: '#ffd93b', text: '#ffffff', header: '#5d0b14', headerText: '#ffffff', variant: 'butcher', product: 'CONTRA FILÉ kg', value: '39,90', note: 'Vermelho fechado para carnes, cortes e festival de churrasco.' },
  { id: 'padaria', name: 'Padaria', category: 'Setores', label: 'PADARIA', background: '#f2c06b', price: '#9d1f17', text: '#3d2617', header: '#8f4c24', headerText: '#fff8e7', variant: 'bakery', product: 'PÃO FRANCÊS kg', value: '12,90', note: 'Tons quentes para pães, bolos, cafés e itens frescos.' },
  { id: 'adega', name: 'Adega', category: 'Setores', label: 'ADEGA', background: '#3b183f', price: '#ffd86a', text: '#fff8ed', header: '#6f234d', headerText: '#ffffff', variant: 'wine', product: 'VINHO 750 ml', value: '29,90', note: 'Visual sofisticado para vinhos, destilados e bebidas especiais.' },
  { id: 'farmacia', name: 'Farmácia e cuidados', category: 'Setores', label: 'CUIDADOS', background: '#e8f7ff', price: '#1265b5', text: '#16324a', header: '#1da6a0', headerText: '#ffffff', variant: 'health', product: 'SHAMPOO 350 ml', value: '14,99', note: 'Limpo e claro para higiene, beleza e cuidados pessoais.' },
  { id: 'atacado', name: 'Preço de atacado', category: 'Vendas', label: 'ATACADO', background: '#ff8a00', price: '#7a0012', text: '#211400', header: '#cf2600', headerText: '#ffffff', variant: 'wholesale', product: 'ÓLEO 900 ml', value: '5,79', note: 'Chamativo para volume, caixas e condições especiais.' },
  { id: 'leve-mais', name: 'Leve mais', category: 'Vendas', label: 'LEVE + PAGUE -', background: '#50c878', price: '#102a43', text: '#102a43', header: '#116b45', headerText: '#ffffff', variant: 'combo', product: 'BISCOITO 120 g', value: '3,49', note: 'Ideal para combos, compre 2 leve 3 e ações por quantidade.' },
  { id: 'clube', name: 'Clube de ofertas', category: 'Vendas', label: 'CLUBE DE OFERTAS', background: '#1d63e9', price: '#fff200', text: '#ffffff', header: '#113d9d', headerText: '#ffffff', variant: 'club', product: 'LEITE 1 L', value: '4,39', note: 'Azul moderno para preço de fidelidade e benefícios do clube.' },
  { id: 'app', name: 'Oferta no App', category: 'Vendas', label: 'OFERTA APP', background: '#a71938', price: '#fff200', text: '#ffffff', header: '#691126', headerText: '#ffffff', variant: 'app', product: 'AÇÚCAR 1 kg', value: '3,99', note: 'Destaque para preço exclusivo de aplicativo ou cadastro.' },
  { id: 'fim-de-semana', name: 'Fim de semana', category: 'Campanhas', label: 'SÓ ESTE FIM DE SEMANA', background: '#ffdc35', price: '#d3122a', text: '#202020', header: '#1d63e9', headerText: '#ffffff', variant: 'weekend', product: 'CERVEJA 350 ml', value: '3,29', note: 'Campanha curta com chamada de período em evidência.' },
  { id: 'aniversario', name: 'Aniversário da loja', category: 'Campanhas', label: 'ANIVERSÁRIO', background: '#ffef70', price: '#cc1740', text: '#35204d', header: '#7b2cbf', headerText: '#ffffff', variant: 'party', product: 'BOLO kg', value: '19,90', note: 'Mais festivo para aniversário, inauguração e datas comemorativas.' },
  { id: 'verao', name: 'Verão de ofertas', category: 'Campanhas', label: 'VERÃO DE OFERTAS', background: '#39d5ff', price: '#ff2e63', text: '#063854', header: '#ff8a00', headerText: '#ffffff', variant: 'summer', product: 'PICOLÉ 60 g', value: '2,99', note: 'Cores vivas para verão, bebidas geladas e ações sazonais.' },
  { id: 'black-friday', name: 'Black Friday', category: 'Campanhas', label: 'BLACK FRIDAY', background: '#111111', price: '#ffe000', text: '#ffffff', header: '#2b2b2b', headerText: '#ffe000', variant: 'black', product: 'KIT PROMOCIONAL', value: '49,90', note: 'Preto e amarelo para campanhas agressivas de desconto.' },
  { id: 'queima', name: 'Queima de estoque', category: 'Impacto', label: 'QUEIMA DE ESTOQUE', background: '#ff5a1f', price: '#fff200', text: '#ffffff', header: '#c81e1e', headerText: '#ffffff', variant: 'clearance', product: 'ÚLTIMAS UNIDADES', value: '9,99', note: 'Visual de liquidação para giro rápido e saldo de estoque.' },
  { id: 'premium', name: 'Premium', category: 'Especiais', label: 'DESTAQUE', background: '#141b2d', price: '#ffe000', text: '#ffffff', header: '#1d63e9', headerText: '#ffffff', variant: 'premium', product: 'PRODUTO ESPECIAL', value: '59,90', note: 'Escuro e elegante para itens premium e campanhas especiais.' },
  { id: 'minimal', name: 'Minimalista', category: 'Especiais', label: 'OFERTA', background: '#ffffff', price: '#d61f2c', text: '#1f2937', header: '#1f2937', headerText: '#ffffff', variant: 'minimal', product: 'PRODUTO 500 g', value: '12,90', note: 'Mais limpo para lojas que preferem comunicação discreta.' },
]

const FORMAT_CARDS = [
  { id: 'A4X4', paper: 'A4', title: '4 cartazes por folha', size: '10,5 × 14,9 cm', use: 'Gôndola e leitura próxima', cells: 4 },
  { id: 'A4X2', paper: 'A4', title: '2 cartazes por folha', size: '21 × 14,9 cm', use: 'Balcão e comunicação média', cells: 2 },
  { id: 'A4X2I', paper: 'A4', title: '2 cartazes · invertido', size: '21 × 14,9 cm', use: 'Dobra ou exposição especial', cells: 2, inverted: true },
  { id: 'A4APP', paper: 'A4', title: '2 ofertas de App', size: '14,9 × 21 cm', use: 'Oferta exclusiva de aplicativo', cells: 2, landscape: true },
  { id: 'A4', paper: 'A4', title: '1 cartaz por folha', size: '21 × 29,7 cm', use: 'Vitrine e ponta', cells: 1 },
  { id: 'A5', paper: 'A5', title: '1 cartaz', size: '14,8 × 21 cm', use: 'Gôndola e balcão', cells: 1, compact: true },
  { id: 'A3', paper: 'A3', title: '1 cartaz', size: '29,7 × 42 cm', use: 'Leitura à distância', cells: 1, large: true },
]

function upsertMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function upsertPropertyMeta(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setCanonical(path) {
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  const normalized = path === '/' ? '/' : '/' + String(path).replace(/^\/+|\/+$/g, '') + '/'
  canonical.href = SITE_URL + normalized
  return canonical.href
}

function setStructuredData(id, value) {
  document.getElementById(id)?.remove()
  const node = document.createElement('script')
  node.id = id
  node.type = 'application/ld+json'
  node.textContent = JSON.stringify(value)
  document.head.appendChild(node)
  return () => node.remove()
}

function usePageHead(page, { creator = false } = {}) {
  useEffect(() => {
    const path = page.path || '/' + (page.slug || '')
    const canonical = setCanonical(path)
    document.title = page.title
    upsertMeta('description', page.description)
    upsertMeta('robots', 'index,follow,max-image-preview:large')
    upsertPropertyMeta('og:title', page.title)
    upsertPropertyMeta('og:description', page.description)
    upsertPropertyMeta('og:url', canonical)

    const cleanup = []
    const organization = {
      '@type': 'Organization',
      name: 'Ofertamática',
      url: SITE_URL + '/',
    }
    const publicPageType = page.slug === 'sobre'
      ? 'AboutPage'
      : page.slug === 'fale-conosco'
        ? 'ContactPage'
        : 'WebPage'

    cleanup.push(setStructuredData('ofertamatica-page-schema', creator ? {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Ofertamática',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: SITE_URL + '/',
      description: page.description,
      publisher: organization,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    } : {
      '@context': 'https://schema.org',
      '@type': publicPageType,
      name: page.heading || page.title,
      description: page.description,
      url: canonical,
      dateModified: page.updatedAt ? '2026-10-04' : undefined,
      publisher: organization,
      isPartOf: { '@type': 'WebSite', name: 'Ofertamática', url: SITE_URL + '/', publisher: organization },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ofertamática', item: SITE_URL + '/' },
          { '@type': 'ListItem', position: 2, name: page.heading || page.title, item: canonical },
        ],
      },
    }))

    document.getElementById('ofertamatica-faq-schema')?.remove()

    return () => cleanup.forEach((fn) => fn?.())
  }, [creator, page])

  return null
}

export function CreatorSeoHead() {
  usePageHead(CREATOR_META, { creator: true })
  return null
}

function SeoHead({ page }) {
  usePageHead(page)
  return null
}

export function getPublicPage(pathname) {
  const clean = String(pathname || '/').replace(/^\/+|\/+$/g, '')
  return PUBLIC_PAGES.find((page) => page.slug === clean) || null
}

export function getSeoPage(pathname) {
  const clean = String(pathname || '/').replace(/^\/+|\/+$/g, '')
  return SEO_PAGES.find((page) => page.slug === clean) || null
}

export function AdUnit({ placement = 'content' }) {
  const slot = ADSENSE_SLOTS[placement]
    || (placement.startsWith('seo-') ? ADSENSE_SLOTS['seo-content'] : '')
    || ''
  const isMobileAd = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 700px)').matches
  const mobileAdFormat = isMobileAd ? 'horizontal' : 'auto'
  const adRef = useRef(null)
  const [adState, setAdState] = useState(slot ? 'pending' : 'hidden')

  useEffect(() => {
    if (!slot) {
      setAdState('hidden')
      return undefined
    }

    setAdState('pending')
    const node = adRef.current
    const syncStatus = () => {
      const status = node?.getAttribute('data-ad-status')
      if (status === 'filled') setAdState('filled')
      if (status === 'unfilled') setAdState('hidden')
      return status
    }

    const observer = typeof MutationObserver !== 'undefined' && node
      ? new MutationObserver(syncStatus)
      : null
    observer?.observe(node, { attributes: true, attributeFilter: ['data-ad-status'] })

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // O elemento pode já ter sido processado pelo AdSense em desenvolvimento.
    }

    const timeout = window.setTimeout(() => {
      if (syncStatus() !== 'filled') setAdState('hidden')
    }, 8000)

    return () => {
      observer?.disconnect()
      window.clearTimeout(timeout)
    }
  }, [placement, slot])

  if (!slot || adState === 'hidden') return null

  return (
    <aside className={`oferta-ad-unit ${adState === 'pending' ? 'is-pending' : 'is-filled'}`} data-placement={placement} aria-label="Publicidade" role="complementary">
      <span className="oferta-ad-label">PUBLICIDADE</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={isMobileAd
          ? { display: 'block', width: '100%', height: '100px', maxHeight: '100px' }
          : { display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={mobileAdFormat}
        data-full-width-responsive={isMobileAd ? 'false' : 'true'}
      />
    </aside>
  )
}

function AiTeaser({ onCreate, compact = false }) {
  return (
    <section className={`ai-teaser ${compact ? 'compact' : ''}`}>
      <div className="ai-teaser-copy">
        <span className="marketing-kicker">PRÓXIMA IMPLEMENTAÇÃO</span>
        <h2>Crie seu cartaz com IA</h2>
        <p>Estamos preparando inteligência artificial para interpretar sua lista de produtos, organizar as informações e reduzir ajustes manuais.</p>
        <div className="ai-feature-row">
          <span>✦ Interpretação inteligente</span>
          <span>✦ Revisão antes de aplicar</span>
          <span>✦ Mais velocidade no varejo</span>
        </div>
      </div>
      <div className="ai-teaser-action">
        <span className="coming-soon-pill">EM BREVE</span>
        <button type="button" onClick={onCreate}>Criar cartaz agora</button>
        <small>O editor atual continua grátis.</small>
      </div>
    </section>
  )
}

function FaqSection() {
  return (
    <section className="marketing-section faq-section">
      <div className="marketing-heading">
        <span className="marketing-kicker">DÚVIDAS FREQUENTES</span>
        <h2>Respostas rápidas</h2>
        <p>As dúvidas mais comuns sobre criação, formatos e impressão.</p>
      </div>
      <div className="faq-grid">
        {SEO_FAQS.slice(0, 8).map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer-brand">
        <strong>Ofertamática</strong>
        <span>Da lista de produtos às placas prontas para imprimir.</span>
      </div>
      <nav aria-label="Links institucionais">
        <a href="/">Criar placas</a>
        <a href="/como-funciona/">Como funciona</a>
        <a href="/guias-para-varejo/">Guias</a>
        <a href="/sobre/">Sobre</a>
        <a href="/fale-conosco/">Fale conosco</a>
        <a href="/privacidade/">Privacidade</a>
        <a href="/termos/">Termos</a>
      </nav>
      <small>Grátis · sem cadastro obrigatório para começar</small>
    </footer>
  )
}

function ModelCard({ item, onCreate }) {
  const [priceMajor = item.value, priceDecimal = ''] = String(item.value || '').split(',')

  function useModel() {
    const offerMode = {
      'de-por': 'de-por',
      'leve-mais': 'leve-por',
      atacado: 'atacado-varejo',
      clube: 'club-app',
      app: 'club-app',
      'segunda-unidade': 'second-unit',
    }[item.id] || 'standard'

    try {
      localStorage.setItem(POSTER_STYLE_KEY, JSON.stringify({
        backgroundColor: item.background,
        textColor: item.text,
        priceColor: item.price,
        headerColor: item.header,
        headerTextColor: item.headerText,
        fontFamily: '"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif',
        descriptionFontFamily: 'auto',
        priceFontFamily: '"Futura Price", Impact, "Arial Black", sans-serif',
        headerStyle: item.id === 'classic' ? 'retail' : 'band',
        headerText: item.label,
        headerImage: '',
        showCurrency: true,
        offerMode,
        validityText: '',
        limitText: '',
      }))
    } catch {
      // Mesmo sem armazenamento local, o usuário ainda pode abrir o criador.
    }
    onCreate()
  }

  return (
    <article className="model-showcase-card">
      <div
        className={`model-poster-standard ${item.id === 'classic' ? 'is-retail' : ''}`}
        style={{
          '--poster-background': item.background,
          '--poster-price-color': item.price,
          '--poster-text-color': item.text,
          '--poster-header-color': item.header,
          '--poster-header-text-color': item.headerText,
        }}
        aria-label={`Prévia do modelo ${item.name}`}
      >
        <div className="model-poster-standard-bg" aria-hidden="true">
          <div className="model-poster-standard-header">
            {item.id === 'classic' ? <span className="model-poster-standard-mark" aria-hidden="true"><i /><i /></span> : null}
            <b>{item.label}</b>
          </div>
          <div className="model-poster-standard-frame" />
          <div className="model-poster-standard-signature">OFERTAMÁTICA</div>
        </div>
        <div className="model-poster-standard-product">
          <strong>{item.product}</strong>
        </div>
        <div className="model-poster-standard-price">
          <small>R$</small>
          <b>
            <span>{priceMajor}</span>
            {priceDecimal ? <><i>,</i><em>{priceDecimal}</em></> : null}
          </b>
        </div>
      </div>
      <div className="model-card-copy">
        <span className="model-category">{item.category}</span>
        <strong>{item.name}</strong>
        <p>{item.note}</p>
        <button type="button" onClick={useModel}>Usar este modelo</button>
      </div>
    </article>
  )
}

function FormatDiagram({ item }) {
  return (
    <div className={`format-diagram ${item.landscape ? 'landscape' : ''} ${item.compact ? 'compact' : ''} ${item.large ? 'large' : ''}`} aria-hidden="true">
      {Array.from({ length: item.cells }, (_, index) => (
        <span className={item.inverted && index === 0 ? 'inverted' : ''} key={index}><i>OFERTA</i><b>R$</b></span>
      ))}
    </div>
  )
}

function relatedPages(page) {
  const sameGroup = SEO_PAGES.filter((item) => item.slug !== page.slug && item.group === page.group)
  const others = SEO_PAGES.filter((item) => item.slug !== page.slug && item.group !== page.group)
  return [...sameGroup, ...others].slice(0, 3)
}

export function PublicPage({ page, onCreate }) {
  const isModels = page.slug === 'modelos'
  const isFormats = page.slug === 'formatos'
  const isHow = page.slug === 'como-funciona'
  const isGuides = page.slug === 'guias-para-varejo'
  const isLegal = Boolean(page.legal)
  const isTrust = Boolean(page.trust)
  const isInstitutional = isLegal || isTrust
  const guideGroups = SEO_PAGES.reduce((acc, item) => {
    ;(acc[item.group] ||= []).push(item)
    return acc
  }, {})

  return (
    <>
      <SeoHead page={{ ...page, path: '/' + page.slug }} />
      <main className="seo-landing">
        <section className={'seo-hero ' + (isInstitutional ? 'seo-hero-institutional' : '')}>
          <div>
            <a className="seo-breadcrumb" href="/">Ofertamática <span>›</span> {page.eyebrow}</a>
            <span className="marketing-kicker">{page.eyebrow}</span>
            <h1>{page.heading}</h1>
            <p>{page.lead}</p>
            {!isInstitutional ? (
              <div className="seo-hero-actions">
                <button type="button" onClick={onCreate}>Criar meu cartaz grátis</button>
                <span>Grátis · sem cadastro obrigatório</span>
              </div>
            ) : null}
          </div>
          {!isInstitutional ? (
            <aside className="seo-benefit-card">
              <span>OFERTAMÁTICA</span>
              {page.benefits.map((benefit) => <strong key={benefit}>✓ {benefit}</strong>)}
            </aside>
          ) : null}
        </section>

        {isModels ? (
          <>
            <section className="marketing-section">
              <div className="marketing-heading">
                <span className="marketing-kicker">GALERIA DE MODELOS</span>
                <h2>{MODEL_PRESETS.length} modelos de placas prontos para começar</h2>
                <p>Escolha um estilo por campanha ou setor. Ao clicar em “Usar este modelo”, as cores e o cabeçalho ficam preparados para o criador.</p>
              </div>
              <div className="model-category-strip" aria-label="Tipos de modelos">
                {[...new Set(MODEL_PRESETS.map((item) => item.category))].map((category) => <span key={category}>{category}</span>)}
              </div>
              <div className="model-showcase-grid">
                {MODEL_PRESETS.map((item) => <ModelCard item={item} onCreate={onCreate} key={item.id} />)}
              </div>
            </section>
            <section className="marketing-section">
              <div className="marketing-heading">
                <span className="marketing-kicker">TIPOS DE OFERTA</span>
                <h2>Primeiro a placa fica pronta. Depois você escolhe se quer uma condição especial.</h2>
                <p>O fluxo padrão continua em 2 cliques. De/Por, Leve X por Y, Atacado/Varejo, Clube/App e 2ª unidade entram depois como opções, sem burocracia antes do resultado.</p>
              </div>
              <div className="workflow-grid offer-capability-grid">
                <article><span>✓</span><strong>Padrão</strong><p>Produto, unidade e preço em destaque para a rotina do dia a dia.</p></article>
                <article><span>DE</span><strong>De / Por</strong><p>Mostre preço anterior e oferta; o percentual de desconto é calculado automaticamente.</p></article>
                <article><span>X</span><strong>Leve X por Y</strong><p>Informe a quantidade, o valor do combo e, se quiser, o preço unitário “cada”.</p></article>
                <article><span>2</span><strong>Atacado / Varejo</strong><p>Exiba os dois preços e informe a quantidade mínima exigida para o atacado.</p></article>
                <article><span>★</span><strong>Clube / App</strong><p>Mostre um preço exclusivo e mantenha o preço normal como referência.</p></article>
                <article><span>2ª</span><strong>2ª unidade</strong><p>Comunique um valor especial para a segunda unidade sem criar outro cartaz.</p></article>
              </div>
            </section>
          </>
        ) : null}

        {isFormats ? (
          <section className="marketing-section">
            <div className="marketing-heading">
              <span className="marketing-kicker">TAMANHO FÍSICO</span>
              <h2>Compare papel, divisão e uso recomendado</h2>
              <p>Os diagramas mostram como o papel é aproveitado. A prévia final do editor respeita o tamanho físico selecionado.</p>
            </div>
            <div className="format-showcase-grid">
              {FORMAT_CARDS.map((item) => (
                <article className="format-showcase-card" key={item.id}>
                  <FormatDiagram item={item} />
                  <div>
                    <span>{item.paper}</span>
                    <strong>{item.title}</strong>
                    <small>{item.size}</small>
                    <p>{item.use}</p>
                  </div>
                </article>
              ))}
            </div>
            <button className="marketing-primary-cta" type="button" onClick={onCreate}>Escolher um formato no criador</button>
          </section>
        ) : null}

        {isHow ? (
          <>
            <section className="marketing-section">
              <div className="marketing-heading">
                <span className="marketing-kicker">2 CLIQUES · PLACA PRONTA</span>
                <h2>O resultado vem antes da personalização</h2>
                <p>O fluxo principal foi reduzido ao essencial. Ajustes visuais e condições especiais existem, mas só entram se você quiser.</p>
              </div>
              <div className="workflow-grid">
                <article><span>1</span><strong>Escolha o formato</strong><p>Selecione A4, A5, A3 ou a quantidade de placas por folha.</p></article>
                <article><span>2</span><strong>Cole e gere</strong><p>Cole direto do Excel/ERP, mesmo com cabeçalho, ou importe TXT, CSV, XLS e XLSX.</p></article>
                <article><span>+</span><strong>Personalize se quiser</strong><p>Header, cores, fonte e tipo de oferta ficam disponíveis sem bloquear o resultado.</p></article>
                <article><span>✓</span><strong>Revise e imprima</strong><p>Confira papel, orientação e preços antes de enviar para a impressora.</p></article>
              </div>
            </section>
            <section className="marketing-section compact-info-grid">
              <article><strong>Sem cadastro para começar</strong><p>O usuário entra direto no gerador, sem formulário antes da primeira placa.</p></article>
              <article><strong>Histórico salvo localmente</strong><p>Retome o último trabalho ou reaproveite listas recentes no mesmo dispositivo.</p></article>
              <article><strong>Revisão antes da impressão</strong><p>Preço, quantidade, papel e orientação ficam visíveis antes de imprimir.</p></article>
            </section>
          </>
        ) : null}

        {isGuides ? (
          <section className="marketing-section">
            <div className="marketing-heading">
              <span className="marketing-kicker">CONTEÚDO ORGANIZADO</span>
              <h2>Encontre o guia pela sua necessidade</h2>
              <p>Os guias abaixo têm objetivos diferentes para evitar páginas repetitivas e facilitar a navegação interna.</p>
            </div>
            <div className="guide-groups">
              {Object.entries(guideGroups).map(([group, items]) => (
                <section key={group}>
                  <h3>{group}</h3>
                  <div>
                    {items.map((item) => (
                      <a href={'/' + item.slug + '/'} key={item.slug}>
                        <span>{item.eyebrow}</span>
                        <strong>{item.heading}</strong>
                        <small>Abrir guia →</small>
                      </a>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        ) : null}

        {isGuides ? <FaqSection /> : null}

        {(isLegal || isTrust) ? (
          <>
            {page.updatedAt ? <p className="trust-updated">{page.updatedAt}</p> : null}
            <section className="marketing-section legal-content trust-content">
              {(page.sections || []).map((section) => (
                <article key={section.title}>
                  <h2>{section.title}</h2>
                  <p>{section.text}</p>
                </article>
              ))}
            </section>
            {page.links?.length ? (
              <section className="marketing-section contact-actions" aria-label="Ajuda rápida">
                <div className="marketing-heading">
                  <span className="marketing-kicker">AJUDA RÁPIDA</span>
                  <h2>Encontre a informação que precisa</h2>
                </div>
                <div className="contact-link-grid">
                  {page.links.map((link) => (
                    <a href={link.href} key={link.href}>
                      <strong>{link.label}</strong>
                      <span>{link.note}</span>
                      <b>Abrir →</b>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {(!isLegal && !isTrust) ? <AdUnit placement={'seo-' + page.slug} /> : null}

        <section className="marketing-final-cta">
          <div>
            <span className="marketing-kicker">{isInstitutional ? 'OFERTAMÁTICA' : 'CRIE AGORA'}</span>
            <h2>{isInstitutional ? 'Voltar ao criador' : 'Monte sua próxima placa'}</h2>
            <p>{isInstitutional ? 'Escolha o formato e continue a criação.' : 'Escolha o formato, informe os produtos e revise antes de imprimir.'}</p>
          </div>
          <button type="button" onClick={onCreate}>Criar cartaz grátis</button>
        </section>

        <MarketingFooter />
      </main>
    </>
  )
}

export function SeoLanding({ page, onCreate }) {
  return (
    <>
      <SeoHead page={{ ...page, path: '/' + page.slug }} />
      <main className="seo-landing">
        <section className="seo-hero seo-hero-guide">
          <div>
            <a className="seo-breadcrumb" href="/">Ofertamática <span>›</span> {page.eyebrow}</a>
            <span className="marketing-kicker">{page.eyebrow}</span>
            <h1>{page.heading}</h1>
            <p>{page.lead}</p>
            <div className="seo-hero-actions">
              <button type="button" onClick={onCreate}>Criar cartaz</button>
              <a href="/guias-para-varejo/">Ver todos os guias</a>
            </div>
          </div>
          <aside className="seo-benefit-card">
            {page.benefits.map((benefit) => <strong key={benefit}>✓ {benefit}</strong>)}
          </aside>
        </section>

        <section className="marketing-section practical-section">
          <div className="marketing-heading">
            <span className="marketing-kicker">NA PRÁTICA</span>
            <h2>O que vale observar</h2>
          </div>
          <div className="practical-grid">
            {page.tips.map((tip, index) => (
              <article key={tip}><span>{String(index + 1).padStart(2, '0')}</span><p>{tip}</p></article>
            ))}
          </div>
        </section>

        {page.storeUse?.length ? (
          <section className="marketing-section store-use-section">
            <div className="marketing-heading">
              <span className="marketing-kicker">NA LOJA</span>
              <h2>Como aplicar no dia a dia</h2>
            </div>
            <div className="store-use-grid">
              {page.storeUse.map((item, index) => (
                <article key={item}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <AdUnit placement={'seo-' + page.slug} />

        <section className="related-pages">
          <span className="marketing-kicker">CONTINUE</span>
          <h2>Guias relacionados</h2>
          <div>
            {relatedPages(page).map((item) => (
              <a href={'/' + item.slug + '/'} key={item.slug}>{item.heading}<span>→</span></a>
            ))}
          </div>
        </section>

        <section className="marketing-final-cta compact-final-cta">
          <div>
            <span className="marketing-kicker">PRONTO PARA CRIAR?</span>
            <h2>Abra o criador e monte a placa</h2>
            <p>O resultado pode ser revisado e personalizado antes da impressão.</p>
          </div>
          <button type="button" onClick={onCreate}>Abrir criador</button>
        </section>

        <MarketingFooter />
      </main>
    </>
  )
}
