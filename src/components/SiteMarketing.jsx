import { useEffect, useMemo, useRef, useState } from 'react'
import PosterSheet from './posters/PosterSheet'
import { AdUnit } from './AdUnit'
import PaperGuide from './PaperGuide'
import FormatOptionCard from './FormatOptionCard'
import { getPosterFormat, POSTER_FORMAT_OPTIONS } from '../config/posterFormats'
import { getDefaultTemplateForFormat } from '../config/posterTemplates'
import { POSTER_MODEL_PRESETS } from '../config/posterModelPresets'
import { createPosterLayouts } from '../poster-engine/layoutPlan'
import { parseProductList } from '../poster-engine/parseProduct'
import { createBrowserTextMeasure } from '../utils/posterBrowserMeasure'
import { resolveReadableHeaderTextColor, resolveReadablePriceColor, resolveReadableTextColor } from '../utils/posterColorContrast'
import {
  PUBLIC_PAGES,
  SEO_FAQS,
  SEO_PAGES,
  SITE_URL,
} from '../seo/seoPages'
import { searchTopicsFor } from '../seo/searchIntent'
// Estilos editoriais só são necessários nas páginas públicas.
// O gerador de SEO adiciona a mesma folha ao HTML destas rotas para evitar FOUC.
import '../styles/marketing.css'

const CREATOR_META = {
  title: 'Placas para Mercado Online Grátis | Ofertamática',
  description: 'Crie placas para mercado online e cartazes de oferta para supermercado grátis. Importe produtos, escolha A4, A5 ou A3, personalize e imprima sem cadastro.',
  path: '/',
}

const POSTER_STYLE_KEY = 'ofertamatica:poster-style:v1'

const MODEL_PRESETS = POSTER_MODEL_PRESETS

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
    upsertPropertyMeta('og:type', page.paperChoices ? 'article' : 'website')
    upsertMeta('twitter:card', 'summary')
    upsertMeta('twitter:title', page.title)
    upsertMeta('twitter:description', page.description)

    const cleanup = []
    const organization = {
      '@type': 'Organization',
      name: 'Ofertamática',
      url: SITE_URL + '/',
      logo: SITE_URL + '/icons/icon-192.png',
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
    if (!creator && page.paperChoices) {
      cleanup.push(setStructuredData('ofertamatica-article-schema', {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: page.heading,
        description: page.description,
        mainEntityOfPage: canonical,
        inLanguage: 'pt-BR',
        author: organization,
        publisher: organization,
      }))
    } else {
      document.getElementById('ofertamatica-article-schema')?.remove()
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
        <a className="marketing-footer-identity" href="/" aria-label="Ofertamática — página inicial">
          <img className="marketing-footer-icon" src="/icons/icon-192.png?v=20261008b" width="32" height="32" alt="" decoding="async" />
          <strong>Ofertamática</strong>
        </a>
        <span>Da lista de produtos às placas prontas para imprimir.</span>
      </div>
      <nav aria-label="Links institucionais">
        <a href="/">Criar placas</a>
        <a href="/como-funciona/">Como funciona</a>
        <a href="/guias-para-varejo/">Guias</a>
        <a href="/qual-papel-usar-para-cartaz/">Papel para cartazes</a>
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
  const headerFooterStyle = item.headerFooterStyle || 'moldura'
  const offerMode = item.offerMode || 'standard'

  // A galeria deve mostrar exatamente as mesmas cores que o editor aceita.
  // Assim, um modelo nunca muda de aparência depois que o usuário clica em “Usar este modelo”.
  const resolvedTextColor = resolveReadableTextColor(item.background, item.text)
  const resolvedPriceColor = resolveReadablePriceColor(item.background, item.price)
  const resolvedHeaderTextColor = resolveReadableHeaderTextColor(item.header, item.headerText)

  const format = useMemo(() => getPosterFormat('A4'), [])
  const measure = useMemo(() => createBrowserTextMeasure(), [])
  const preview = useMemo(() => {
    const parsed = parseProductList(`${item.product} ${item.value}`)[0] || {
      id: `model-${item.id}`,
      description: item.product,
      subdescription: '',
      complement: '',
      unit: '',
      price: item.value,
    }
    const product = {
      ...parsed,
      id: `model-${item.id}`,
      price: item.value,
      regularPrice: ['de-por', 'clube', 'app'].includes(item.id) ? '24,90' : parsed.regularPrice,
      offerQuantity: item.id === 'leve-mais' ? '3' : parsed.offerQuantity,
      eachPrice: item.id === 'leve-mais' ? item.value : parsed.eachPrice,
      wholesalePrice: item.id === 'atacado' ? '4,99' : parsed.wholesalePrice,
      wholesaleQuantity: item.id === 'atacado' ? '6' : parsed.wholesaleQuantity,
      secondUnitPrice: item.id === 'segunda-unidade' ? '9,99' : parsed.secondUnitPrice,
    }
    const template = {
      ...getDefaultTemplateForFormat('A4'),
      headerStyle: 'retail',
      headerText: item.label,
      headerFooterStyle,
      offerMode,
      validityText: item.validityText || '',
      limitText: '',
      showCurrency: true,
      backgroundImage: '',
      backgroundVisible: false,
    }
    const layouts = createPosterLayouts([product], template, format, measure)
    return { product, template, layouts }
  }, [format, headerFooterStyle, item, measure, offerMode])

  function useModel() {
    try {
      localStorage.setItem(POSTER_STYLE_KEY, JSON.stringify({
        backgroundColor: item.background,
        textColor: resolvedTextColor,
        priceColor: resolvedPriceColor,
        headerColor: item.header,
        headerTextColor: resolvedHeaderTextColor,
        fontFamily: '"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif',
        descriptionFontFamily: 'auto',
        priceFontFamily: '"Futura Price", Impact, "Arial Black", sans-serif',
        headerStyle: 'retail',
        headerText: item.label,
        headerImage: '',
        headerFooterStyle,
        showCurrency: true,
        offerMode,
        validityText: item.validityText || '',
        limitText: '',
      }))
    } catch {
      // Mesmo sem armazenamento local, o usuário ainda pode abrir o criador.
    }
    onCreate()
  }

  const pxPerMm = 96 / 25.4
  const naturalWidth = format.widthMm * pxPerMm
  const naturalHeight = format.heightMm * pxPerMm
  const scale = 0.245

  return (
    <article className="model-showcase-card model-showcase-card-real">
      <div
        className="model-real-poster-shell"
        style={{
          '--poster-background': item.background,
          '--poster-price-color': resolvedPriceColor,
          '--poster-text-color': resolvedTextColor,
          '--poster-header-color': item.header,
          '--poster-header-text-color': resolvedHeaderTextColor,
          '--poster-font-family': '"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif',
          '--poster-description-font-family': '"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif',
          '--poster-price-font-family': '"Futura Price", Impact, "Arial Black", sans-serif',
          height: naturalHeight * scale,
        }}
        aria-label={`Prévia real do modelo ${item.name}`}
      >
        <div
          className="model-real-poster-scale"
          style={{
            width: naturalWidth,
            height: naturalHeight,
            transform: `scale(${scale})`,
          }}
        >
          <PosterSheet
            format={format}
            products={[preview.product]}
            template={preview.template}
            layoutPlans={preview.layouts}
            showBackground
          />
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

function relatedPages(page) {
  const sameGroup = SEO_PAGES.filter((item) => item.slug !== page.slug && item.group === page.group)
  const others = SEO_PAGES.filter((item) => item.slug !== page.slug && item.group !== page.group)
  return [...sameGroup, ...others].slice(0, 3)
}

const HOW_RELATED_GUIDES = [
  {
    name: 'Formato e quantidade por folha',
    title: 'Escolha o tamanho ideal para cada cartaz',
    text: 'Compare oito formatos: A4 com uma ou várias placas, A5 para balcão e A3 para vitrines. Veja o tamanho físico antes de começar.',
    link: '/formatos/',
    linkLabel: 'Comparar formatos',
  },
  {
    name: 'Papel e impressão',
    title: 'Imprima no papel e na escala corretos',
    text: 'Confira o tipo de papel, a gramatura e a orientação da folha. Faça uma prova antes de imprimir várias ofertas.',
    link: '/qual-papel-usar-para-cartaz/',
    linkLabel: 'Ver guia de impressão',
  },
]

function SearchTopicSections({ slug }) {
  const isHow = slug === 'como-funciona'
  const topics = isHow ? [...searchTopicsFor(slug), ...HOW_RELATED_GUIDES] : searchTopicsFor(slug)
  if (!topics.length) return null

  return (
    <section
      className={'marketing-section store-use-section ' + (isHow ? 'how-guide-section' : '')}
      aria-label="Orientações para criar placas e cartazes"
    >
      <div className="marketing-heading">
        <span className="marketing-kicker">{isHow ? 'PRÓXIMOS PASSOS' : 'GUIA DE CRIAÇÃO'}</span>
        <h2>{isHow ? 'Da planilha à impressão, sem complicação' : 'Escolha o tipo de cartaz certo para sua loja'}</h2>
        <p>{isHow ? 'Explore recursos que ajudam a preparar, personalizar e imprimir placas no tamanho certo.' : 'Dicas de criação, formatos e aplicação no dia a dia do varejo.'}</p>
      </div>
      <div className={'store-use-grid' + (topics.length === 1 ? ' store-use-grid-single' : '')}>
        {topics.map((topic, index) => (
          <article className="store-use-topic" key={topic.name}>
            <span className="store-use-topic-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <h3>{topic.title}</h3>
            <p>{topic.text}</p>
            <a href={topic.link}>{topic.linkLabel} <span aria-hidden="true">→</span></a>
          </article>
        ))}
      </div>
    </section>
  )
}

export function PublicPage({ page, onCreate, onChooseFormat }) {
  const [modelQuery, setModelQuery] = useState('')
  const [modelCategory, setModelCategory] = useState('Todos')
  const [modelLimit, setModelLimit] = useState(12)
  const [guideCategory, setGuideCategory] = useState('Todos')
  const [guideQuery, setGuideQuery] = useState('')
  const isModels = page.slug === 'modelos'
  const isFormats = page.slug === 'formatos'
  const isPaperGuide = page.slug === 'qual-papel-usar-para-cartaz'
  const isHow = page.slug === 'como-funciona'
  const isGuides = page.slug === 'guias-para-varejo'
  const isLegal = Boolean(page.legal)
  const isTrust = Boolean(page.trust)
  const isInstitutional = isLegal || isTrust
  const guideGroups = SEO_PAGES.reduce((acc, item) => {
    ;(acc[item.group] ||= []).push(item)
    return acc
  }, {})
  const guideCategoryNames = Object.keys(guideGroups)
  const normalizedGuideQuery = guideQuery.trim().toLocaleLowerCase('pt-BR')
  const visibleGuides = SEO_PAGES.filter((item) => {
    if (guideCategory !== 'Todos' && item.group !== guideCategory) return false
    if (!normalizedGuideQuery) return true
    return [item.heading, item.eyebrow, item.group, item.description, item.lead]
      .join(' ')
      .toLocaleLowerCase('pt-BR')
      .includes(normalizedGuideQuery)
  })
  const modelCategories = ['Todos', ...new Set(MODEL_PRESETS.map((item) => item.category))]
  const normalizedModelQuery = modelQuery.trim().toLocaleLowerCase('pt-BR')
  const filteredModels = MODEL_PRESETS.filter((item) => {
    const matchesCategory = modelCategory === 'Todos' || item.category === modelCategory
    const haystack = [item.name, item.category, item.label, item.product, item.note]
      .join(' ')
      .toLocaleLowerCase('pt-BR')
    const matchesQuery = !normalizedModelQuery || haystack.includes(normalizedModelQuery)
    return matchesCategory && matchesQuery
  })
  const visibleModels = filteredModels.slice(0, modelLimit)

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
              <div className="model-gallery-tools">
                <label className="model-search">
                  <span>Buscar modelo</span>
                  <input
                    type="search"
                    value={modelQuery}
                    placeholder="Ex.: hortifruti, atacado, oferta..."
                    onChange={(event) => {
                      setModelQuery(event.target.value)
                      setModelLimit(12)
                    }}
                  />
                </label>
                <strong>{visibleModels.length} de {filteredModels.length} encontrados · {MODEL_PRESETS.length} no total</strong>
              </div>
              <div className="model-category-strip" aria-label="Filtrar modelos por categoria">
                {modelCategories.map((category) => (
                  <button
                    type="button"
                    className={modelCategory === category ? 'active' : ''}
                    key={category}
                    onClick={() => {
                      setModelCategory(category)
                      setModelLimit(12)
                    }}
                    aria-pressed={modelCategory === category}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="model-showcase-grid">
                {visibleModels.map((item) => <ModelCard item={item} onCreate={onCreate} key={item.id} />)}
              </div>
              {visibleModels.length < filteredModels.length ? (
                <button
                  type="button"
                  className="model-show-more"
                  onClick={() => setModelLimit((value) => Math.min(value + 12, filteredModels.length))}
                >
                  Mostrar mais modelos ({filteredModels.length - visibleModels.length})
                </button>
              ) : null}
              {!filteredModels.length ? (
                <div className="model-empty-state">
                  <strong>Nenhum modelo encontrado</strong>
                  <span>Tente outro termo ou escolha “Todos”.</span>
                  <button type="button" onClick={() => { setModelQuery(''); setModelCategory('Todos'); setModelLimit(12) }}>Limpar filtros</button>
                </div>
              ) : null}
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
                <article><span>⏱</span><strong>Próximo à validade</strong><p>Sinalize produtos que precisam girar mais rápido e use a validade no próprio cartaz.</p></article>
                <article><span>!</span><strong>Últimas unidades</strong><p>Destaque saldo final ou estoque curto sem perder a leitura principal de produto e preço.</p></article>
              </div>
            </section>
          </>
        ) : null}

        {isPaperGuide ? <PaperGuide page={page} /> : null}

        {isFormats ? (
          <section className="marketing-section format-home-refresh format-guide-section">
            <div className="marketing-heading format-guide-heading">
              <span className="marketing-kicker">TAMANHO FÍSICO</span>
              <h2>Compare papel, divisão e uso recomendado</h2>
              <p>Os mesmos cartazes da página inicial: confira quantas placas cabem em cada folha, compare os tamanhos e selecione o formato para criar.</p>
            </div>
            <div className="format-showcase-grid">
              {POSTER_FORMAT_OPTIONS.filter((format) => format.id !== 'SRA3').map((format) => (
                <FormatOptionCard
                  key={format.id}
                  format={format}
                  onSelect={onChooseFormat || onCreate}
                />
              ))}
            </div>
            <div className="paper-guide-inline">
              <strong>Dúvida sobre papel ou gramatura?</strong>
              <p>O formato é uma parte da escolha. Confira também qual papel usar em cada tipo de cartaz e como imprimir no tamanho correto.</p>
              <a href="/qual-papel-usar-para-cartaz/">Qual papel usar para cartazes A4, A5 e A3 →</a>
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
                <article><span>1</span><strong>Escolha o formato</strong><p>Selecione A7, A6, A5, A4, A3 ou a quantidade de placas por folha.</p></article>
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
          <section className="marketing-section retail-guides-section">
            <div className="marketing-heading">
              <span className="marketing-kicker">COMECE POR AQUI</span>
              <h2>Encontre o guia pela sua necessidade</h2>
              <p>Da preparação dos produtos à impressão, escolha o assunto que ajuda sua loja agora.</p>
            </div>

            {page.sections?.length ? (
              <div className="retail-guide-intro-grid" aria-label="Orientações essenciais">
                {page.sections.map((section, index) => {
                  const links = [
                    { href: '/criador-de-cartaz-de-oferta/', label: 'Começar a criar placas' },
                    { href: '/modelos/', label: 'Explorar modelos' },
                    { href: '/qual-papel-usar-para-cartaz/', label: 'Ver papel e impressão' },
                  ]
                  const link = links[index]
                  return (
                    <article className="retail-guide-intro-card" key={section.title}>
                      <span className="retail-guide-step" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                      <h3>{section.title}</h3>
                      <p>{section.text}</p>
                      {link ? <a href={link.href}>{link.label} <span aria-hidden="true">→</span></a> : null}
                    </article>
                  )
                })}
              </div>
            ) : null}

            <a className="paper-guide-featured retail-guide-paper-link" href="/qual-papel-usar-para-cartaz/">
              <span className="retail-guide-paper-icon" aria-hidden="true">▤</span>
              <span className="retail-guide-paper-copy">
                <span>GUIA DE IMPRESSÃO</span>
                <strong>Qual papel usar para cartazes de oferta?</strong>
                <small>Compare A4, A5 e A3, gramaturas, margens e escala de impressão</small>
              </span>
              <b aria-hidden="true">→</b>
            </a>

            <div className="retail-guide-catalog" aria-label="Catálogo de guias para varejo">
              <div className="retail-guide-catalog-heading">
                <div>
                  <span className="marketing-kicker">EXPLORE OS ASSUNTOS</span>
                  <h3>Guias para cada etapa da sua loja</h3>
                  <p>Filtre por departamento ou busque um tema específico.</p>
                </div>
                <label className="retail-guide-search">
                  <span>Buscar guia</span>
                  <input
                    type="search"
                    placeholder="Ex.: açougue, A4, preço..."
                    value={guideQuery}
                    onChange={(event) => setGuideQuery(event.target.value)}
                  />
                </label>
              </div>
              <div className="retail-guide-categories" aria-label="Filtrar guias por assunto">
                {['Todos', ...guideCategoryNames].map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={guideCategory === category ? 'active' : ''}
                    aria-pressed={guideCategory === category}
                    onClick={() => setGuideCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="retail-guide-results" aria-live="polite">
                {visibleGuides.length} de {SEO_PAGES.length} guias
              </div>
              <div className="retail-guide-card-grid">
                {visibleGuides.map((item) => (
                  <a className="retail-guide-catalog-card" href={'/' + item.slug + '/'} key={item.slug}>
                    <span className="retail-guide-card-category">{item.group}</span>
                    <h4>{item.heading}</h4>
                    <p>{item.description}</p>
                    <span className="retail-guide-card-link">Abrir guia <span aria-hidden="true">→</span></span>
                  </a>
                ))}
              </div>
              {!visibleGuides.length ? (
                <div className="retail-guide-empty">
                  <strong>Nenhum guia encontrado.</strong>
                  <p>Tente outro tema ou veja todos os guias disponíveis.</p>
                  <button type="button" onClick={() => { setGuideQuery(''); setGuideCategory('Todos') }}>Mostrar todos os guias</button>
                </div>
              ) : null}
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
                    <a href={link.href} key={link.href} target={link.href.startsWith('https://') ? '_blank' : undefined} rel={link.href.startsWith('https://') ? 'noopener noreferrer' : undefined}>
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

        {!isInstitutional ? <SearchTopicSections slug={page.slug} /> : null}

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

        <SearchTopicSections slug={page.slug} />

        {page.sections?.length ? (
          <section className="marketing-section" aria-label="Orientações específicas">
            <div className="marketing-heading">
              <span className="marketing-kicker">EXEMPLOS E CUIDADOS</span>
              <h2>Como usar estas placas na loja</h2>
            </div>
            <div className="store-use-grid">
              {page.sections.map((section) => (
                <article key={section.title}>
                  <h2>{section.title}</h2>
                  <p>{section.text}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {page.links?.length ? (
          <nav className="related-pages" aria-label="Links úteis para esta página">
            <span className="marketing-kicker">APRENDA MAIS</span>
            <h2>Outros recursos úteis</h2>
            <div>
              {page.links.map((link) => (
                <a href={link.href} key={link.href}>{link.label}<span>→</span></a>
              ))}
            </div>
          </nav>
        ) : null}

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
