import { useEffect, useRef, useState } from 'react'
import {
  PUBLIC_PAGES,
  SEO_FAQS,
  SEO_PAGES,
  SEO_TOPIC_GROUPS,
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
  { id: 'classic', name: 'Clássico de oferta', category: 'Essenciais', label: 'OFERTA', background: '#fff200', price: '#e60025', text: '#101010', header: '#e51e31', headerText: '#ffffff', variant: 'classic', product: 'CAFÉ 500 g', value: '18,90', note: 'Amarelo e vermelho com leitura rápida para qualquer setor.' },
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
  { id: 'SRA3', paper: 'SRA3', title: '1 cartaz', size: '32 × 45 cm', use: 'Impressão ampliada', cells: 1, large: true },
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
    cleanup.push(setStructuredData('ofertamatica-page-schema', creator ? {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Ofertamática',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: SITE_URL + '/',
      description: page.description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    } : {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page.heading || page.title,
      description: page.description,
      url: canonical,
      isPartOf: { '@type': 'WebSite', name: 'Ofertamática', url: SITE_URL + '/' },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ofertamática', item: SITE_URL + '/' },
          { '@type': 'ListItem', position: 2, name: page.heading || page.title, item: canonical },
        ],
      },
    }))

    if (!creator && page.kind === 'seo') {
      cleanup.push(setStructuredData('ofertamatica-faq-schema', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: SEO_FAQS.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }))
    } else {
      document.getElementById('ofertamatica-faq-schema')?.remove()
    }

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
    <div className={`oferta-ad-unit ${adState === 'pending' ? 'is-pending' : 'is-filled'}`} data-placement={placement} aria-label="Publicidade">
      <span className="oferta-ad-label">PUBLICIDADE</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
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

function FaqSection({ onCreate }) {
  return (
    <section className="marketing-section faq-section">
      <div className="marketing-heading">
        <span className="marketing-kicker">DÚVIDAS FREQUENTES</span>
        <h2>Antes de criar seu cartaz</h2>
        <p>Formatos, impressão, cadastro e próximos recursos do Ofertamática.</p>
      </div>
      <div className="faq-grid">
        {SEO_FAQS.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
      <div className="topic-groups">
        {SEO_TOPIC_GROUPS.map((group) => (
          <div key={group.title}>
            <strong>{group.title}</strong>
            <div className="topic-cloud">
              {group.items.map((topic) => <button type="button" key={topic} onClick={onCreate}>{topic}</button>)}
            </div>
          </div>
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
        <a href="/privacidade/">Privacidade</a>
        <a href="/termos/">Termos</a>
      </nav>
      <small>Grátis · sem cadastro obrigatório para começar</small>
    </footer>
  )
}

function ModelCard({ item, onCreate }) {
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
        headerStyle: 'band',
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
        className="model-poster-standard"
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
            <span className="model-poster-standard-mark">✓</span>
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
          <b>{item.value}</b>
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
  return [...sameGroup, ...others].slice(0, 5)
}

export function PublicPage({ page, onCreate }) {
  const isModels = page.slug === 'modelos'
  const isFormats = page.slug === 'formatos'
  const isHow = page.slug === 'como-funciona'
  const isGuides = page.slug === 'guias-para-varejo'
  const isLegal = Boolean(page.legal)
  const guideGroups = SEO_PAGES.reduce((acc, item) => {
    ;(acc[item.group] ||= []).push(item)
    return acc
  }, {})

  return (
    <>
      <SeoHead page={{ ...page, path: '/' + page.slug }} />
      <main className="seo-landing">
        <section className="seo-hero">
          <div>
            <a className="seo-breadcrumb" href="/">Ofertamática <span>›</span> {page.eyebrow}</a>
            <span className="marketing-kicker">{page.eyebrow}</span>
            <h1>{page.heading}</h1>
            <p>{page.lead}</p>
            <div className="seo-hero-actions">
              <button type="button" onClick={onCreate}>Criar meu cartaz grátis</button>
              <span>Grátis · sem cadastro obrigatório</span>
            </div>
          </div>
          <aside className="seo-benefit-card">
            <span>OFERTAMÁTICA</span>
            {page.benefits.map((benefit) => <strong key={benefit}>✓ {benefit}</strong>)}
          </aside>
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
                <article><span>DE</span><strong>De / Por</strong><p>Mostre o preço anterior e o novo preço de oferta sem reconstruir a placa.</p></article>
                <article><span>X</span><strong>Leve X por Y</strong><p>Informe a quantidade e use o preço principal como valor do combo.</p></article>
                <article><span>2</span><strong>Atacado / Varejo</strong><p>Exiba preço de atacado junto do preço de varejo na mesma comunicação.</p></article>
                <article><span>★</span><strong>Clube / App</strong><p>Mostre um preço exclusivo e mantenha o preço normal como referência.</p></article>
                <article><span>2ª</span><strong>2ª unidade</strong><p>Comunique um valor especial para a segunda unidade sem criar outro cartaz.</p></article>
              </div>
            </section>
            <AiTeaser onCreate={onCreate} compact />
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
                <article><span>1</span><strong>Escolha o formato</strong><p>Selecione A4, A5, A3, SRA3 ou a quantidade de placas por folha.</p></article>
                <article><span>2</span><strong>Cole e gere</strong><p>Cole sua lista ou importe Excel, CSV ou TXT e gere várias placas de uma vez.</p></article>
                <article><span>+</span><strong>Personalize se quiser</strong><p>Header, cores, fonte e tipo de oferta ficam disponíveis sem bloquear o resultado.</p></article>
                <article><span>✓</span><strong>Revise e imprima</strong><p>Confira papel, orientação e preços antes de enviar para a impressora.</p></article>
              </div>
            </section>
            <section className="marketing-section compact-info-grid">
              <article><strong>Sem cadastro para começar</strong><p>O usuário entra direto no gerador, sem formulário antes da primeira placa.</p></article>
              <article><strong>Trabalho salvo localmente</strong><p>O último trabalho pode ser retomado no mesmo dispositivo.</p></article>
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

        {isLegal ? (
          <section className="marketing-section legal-content">
            {(page.sections || []).map((section) => (
              <article key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
              </article>
            ))}
          </section>
        ) : null}

        {!isLegal ? <AdUnit placement={'seo-' + page.slug} /> : null}

        <section className="marketing-final-cta">
          <div>
            <span className="marketing-kicker">{isLegal ? 'OFERTAMÁTICA' : 'CRIE AGORA'}</span>
            <h2>{isLegal ? 'Criar placas continua a um clique' : 'Volte ao criador e monte sua próxima placa'}</h2>
            <p>{isLegal ? 'A página inicial abre direto no seletor de formatos, sem landing intermediária.' : 'A página inicial do Ofertamática abre diretamente no seletor de formatos.'}</p>
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
        <section className="seo-hero">
          <div>
            <a className="seo-breadcrumb" href="/">Ofertamática <span>›</span> {page.eyebrow}</a>
            <span className="marketing-kicker">{page.eyebrow}</span>
            <h1>{page.heading}</h1>
            <p>{page.lead}</p>
            <div className="seo-hero-actions">
              <button type="button" onClick={onCreate}>Criar meu cartaz grátis</button>
              <span>Grátis · sem cadastro obrigatório</span>
            </div>
          </div>
          <aside className="seo-benefit-card">
            <span>OFERTAMÁTICA</span>
            {page.benefits.map((benefit) => <strong key={benefit}>✓ {benefit}</strong>)}
          </aside>
        </section>

        {page.comingSoon ? <AiTeaser onCreate={onCreate} compact /> : null}

        <section className="marketing-section practical-section">
          <div className="marketing-heading">
            <span className="marketing-kicker">NA PRÁTICA</span>
            <h2>Pontos que fazem diferença nesse tipo de cartaz</h2>
          </div>
          <div className="practical-grid">
            {page.tips.map((tip, index) => (
              <article key={tip}><span>{String(index + 1).padStart(2, '0')}</span><p>{tip}</p></article>
            ))}
          </div>
        </section>

        <section className="seo-explainer">
          <article><span className="marketing-kicker">FORMATO</span><h2>Escolha pelo local de exposição</h2><p>O tamanho do papel e a quantidade por folha mudam a distância de leitura e o aproveitamento da impressão.</p></article>
          <article><span className="marketing-kicker">CONTEÚDO</span><h2>Revise produto, unidade e preço</h2><p>Os campos continuam editáveis para que você corrija qualquer interpretação antes de gerar as placas.</p></article>
          <article><span className="marketing-kicker">IMPRESSÃO</span><h2>Confira antes de enviar</h2><p>A revisão final mostra o formato físico e orientações importantes para a janela de impressão.</p></article>
        </section>

        {page.storeUse?.length ? (
          <section className="marketing-section store-use-section">
            <div className="marketing-heading">
              <span className="marketing-kicker">ROTINA REAL DE LOJA</span>
              <h2>Feito para criar várias placas sem reconstruir o trabalho</h2>
              <p>O objetivo é reduzir etapas repetitivas e manter preço, produto e leitura como prioridade.</p>
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

        <FaqSection onCreate={onCreate} />

        <section className="related-pages">
          <span className="marketing-kicker">TAMBÉM PODE AJUDAR</span>
          <h2>Conteúdos relacionados</h2>
          <div>
            {relatedPages(page).map((item) => (
              <a href={'/' + item.slug + '/'} key={item.slug}>{item.heading}<span>→</span></a>
            ))}
          </div>
        </section>

        <section className="marketing-final-cta">
          <div>
            <span className="marketing-kicker">PRONTO PARA COMEÇAR?</span>
            <h2>2 cliques para ter a primeira placa pronta</h2>
            <p>Escolha o formato, cole a lista e gere. Personalize apenas se precisar.</p>
          </div>
          <button type="button" onClick={onCreate}>Abrir criador de cartazes</button>
        </section>

        <MarketingFooter />
      </main>
    </>
  )
}
