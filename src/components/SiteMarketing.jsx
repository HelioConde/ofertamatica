import { useEffect } from 'react'
import '../styles/marketing.css'

const SITE_URL = 'https://ofertamatica.com.br'
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-9514218545388169'
const ADSENSE_SLOT = import.meta.env.VITE_ADSENSE_SLOT || ''

const SEO_PAGES = [
  {
    slug: 'criador-de-cartaz-de-oferta',
    title: 'Criador de cartaz de oferta grátis | Ofertamática',
    description: 'Crie cartazes de oferta online, escolha o formato, informe seus produtos e prepare a impressão em poucos passos.',
    eyebrow: 'CRIADOR DE CARTAZ DE OFERTA',
    heading: 'Crie cartazes de oferta prontos para imprimir',
    lead: 'Monte placas promocionais para o varejo com um fluxo simples: escolha o formato, cole os produtos, revise os dados e imprima.',
    benefits: ['Formatos A4, A3 e SRA3', 'Vários cartazes por folha', 'Edição de preço, descrição, cores e cabeçalho'],
  },
  {
    slug: 'cartaz-para-supermercado',
    title: 'Cartaz para supermercado: crie e imprima online | Ofertamática',
    description: 'Crie cartazes de preço e promoção para supermercados, mercados, mercearias e atacarejos.',
    eyebrow: 'CARTAZ PARA SUPERMERCADO',
    heading: 'Cartazes de supermercado sem perder tempo formatando',
    lead: 'Organize as ofertas da loja e gere cartazes consistentes para corredores, gôndolas, hortifruti, açougue, padaria e outros setores.',
    benefits: ['Visual de oferta com preço em destaque', 'Modelos adequados ao varejo', 'Fluxo pensado para listas grandes de produtos'],
  },
  {
    slug: 'gerador-de-cartaz-de-promocao',
    title: 'Gerador de cartaz de promoção online | Ofertamática',
    description: 'Gere cartazes promocionais para ofertas do dia, fim de semana, campanhas e ações sazonais.',
    eyebrow: 'GERADOR DE CARTAZ DE PROMOÇÃO',
    heading: 'Transforme sua lista de promoções em cartazes',
    lead: 'Use seus produtos e preços para criar uma comunicação promocional clara, pronta para revisar e imprimir.',
    benefits: ['Criação em lote', 'Cabeçalhos promocionais', 'Formatos para diferentes pontos da loja'],
  },
  {
    slug: 'cartaz-de-preco-online',
    title: 'Cartaz de preço online grátis | Ofertamática',
    description: 'Faça cartazes de preço online com descrição, unidade, gramatura e valor em destaque.',
    eyebrow: 'CARTAZ DE PREÇO ONLINE',
    heading: 'Preço legível e produto fácil de identificar',
    lead: 'Crie cartazes com hierarquia visual para o cliente bater o olho e entender produto, quantidade e preço.',
    benefits: ['Preço com destaque automático', 'Campos editáveis', 'Pré-visualização antes da impressão'],
  },
  {
    slug: 'cartaz-de-oferta-gratis',
    title: 'Fazer cartaz de oferta grátis online | Ofertamática',
    description: 'Crie cartazes de oferta gratuitamente e sem cadastro obrigatório no Ofertamática.',
    eyebrow: 'CARTAZ DE OFERTA GRÁTIS',
    heading: 'Comece seu cartaz de oferta sem cadastro',
    lead: 'Escolha um formato, adicione os produtos e prepare a impressão diretamente pelo navegador.',
    benefits: ['Uso gratuito', 'Sem cadastro obrigatório para começar', 'Editor direto no navegador'],
  },
  {
    slug: 'cartaz-supermercado-online',
    title: 'Cartaz de supermercado online | Ofertamática',
    description: 'Crie cartazes de supermercado online para imprimir e usar nas principais campanhas do varejo.',
    eyebrow: 'CARTAZ DE SUPERMERCADO ONLINE',
    heading: 'Sua comunicação de ofertas em um só lugar',
    lead: 'Monte cartazes para ações semanais, ofertas relâmpago, feira, açougue, bebidas, higiene e muito mais.',
    benefits: ['Criação rápida', 'Padronização visual', 'Modelos reutilizáveis'],
  },
  {
    slug: 'cartaz-de-oferta-para-imprimir',
    title: 'Cartaz de oferta para imprimir em A4 e A3 | Ofertamática',
    description: 'Prepare cartazes de oferta para imprimir com tamanho físico, orientação e divisão por folha.',
    eyebrow: 'CARTAZ PARA IMPRIMIR',
    heading: 'Crie no navegador e imprima no tamanho certo',
    lead: 'O Ofertamática organiza os cartazes por folha e mostra uma revisão antes da impressão.',
    benefits: ['A4 e A3', '1, 2 ou 4 cartazes por folha conforme o modelo', 'Revisão de impressão integrada'],
  },
  {
    slug: 'cartaz-a4',
    title: 'Cartaz A4 de oferta para imprimir | Ofertamática',
    description: 'Crie cartazes A4 de oferta e escolha entre modelos com um, dois ou quatro cartazes por folha.',
    eyebrow: 'CARTAZ A4',
    heading: 'Cartazes A4 para diferentes espaços da loja',
    lead: 'Use uma folha inteira para maior impacto ou divida o A4 para placas menores e econômicas.',
    benefits: ['A4 1 por folha', 'A4 2 por folha', 'A4 4 por folha'],
  },
  {
    slug: 'gerador-de-cartaz-com-ia',
    title: 'Gerador de cartaz com IA | Ofertamática',
    description: 'Crie cartazes de oferta com inteligência artificial para interpretar produtos, organizar informações e acelerar a produção de placas para o varejo.',
    eyebrow: 'INTELIGÊNCIA ARTIFICIAL',
    heading: 'Crie seu cartaz com IA',
    lead: 'Use inteligência artificial para interpretar os produtos, organizar as informações e reduzir ajustes manuais na criação dos cartazes de oferta.',
    benefits: ['Interpretação inteligente de produtos', 'Menos ajustes manuais', 'Fluxo pensado para acelerar campanhas'],
  },
  {
    slug: 'como-fazer-cartaz-de-oferta',
    title: 'Como fazer cartaz de oferta | Guia prático Ofertamática',
    description: 'Aprenda como fazer cartaz de oferta com produto, gramatura e preço bem destacados e crie suas placas online no Ofertamática.',
    eyebrow: 'COMO FAZER CARTAZ DE OFERTA',
    heading: 'Como fazer um cartaz de oferta claro e profissional',
    lead: 'Organize a descrição do produto, destaque preço e unidade, escolha o formato ideal e mantenha um padrão visual entre as ofertas.',
    benefits: ['Descrição curta e reconhecível', 'Preço e unidade com hierarquia clara', 'Formato adequado à distância de leitura'],
  },
]

const EXTRA_TOPICS = {
  commerce: ['mercado', 'atacarejo', 'mercearia', 'hortifruti', 'padaria', 'açougue', 'farmácia', 'loja de bebidas', 'conveniência', 'pet shop', 'papelaria'],
  occasions: ['oferta relâmpago', 'promoção do dia', 'fim de semana', 'ofertas da semana', 'feira do mês', 'Black Friday', 'Natal', 'Páscoa', 'Dia das Mães', 'volta às aulas', 'verão de ofertas'],
  departments: ['bebidas', 'destilados', 'cervejas', 'hortifruti', 'açougue', 'padaria', 'frios e laticínios', 'limpeza', 'higiene e beleza', 'arroz e feijão', 'massas e molhos', 'cafés', 'biscoitos e snacks', 'bomboniere', 'rotisseria'],
}

const FAQS = [
  {
    q: 'O Ofertamática serve para quais tipos de comércio?',
    a: 'O editor pode ser usado por supermercados, mercados, atacarejos, mercearias, hortifrutis, padarias, açougues, farmácias, lojas de bebidas, conveniências, pet shops, papelarias e outros negócios que precisam destacar produtos e preços.',
  },
  {
    q: 'Quais formatos de cartaz posso criar?',
    a: 'Há opções em A4, A3 e SRA3, incluindo layouts com um, dois ou quatro cartazes por folha conforme o formato disponível no editor.',
  },
  {
    q: 'Posso usar o Ofertamática para campanhas sazonais?',
    a: 'Sim. Você pode adaptar cabeçalhos e visual para oferta relâmpago, promoção do dia, fim de semana, feira do mês, Black Friday, Natal, Páscoa, volta às aulas e outras campanhas.',
  },
  {
    q: 'Consigo criar cartazes por departamento?',
    a: 'Sim. O editor funciona para bebidas, hortifruti, açougue, padaria, frios, limpeza, higiene, mercearia, bomboniere, rotisseria e outros departamentos.',
  },
  {
    q: 'Preciso instalar algum programa?',
    a: 'Não. A criação acontece no navegador. Você escolhe o formato, informa os produtos, revisa e segue para a impressão.',
  },
  {
    q: 'Preciso fazer cadastro para começar?',
    a: 'Não. O fluxo atual permite começar gratuitamente e sem cadastro obrigatório.',
  },
  {
    q: 'Como funciona a criação de cartazes com inteligência artificial?',
    a: 'A inteligência artificial ajuda a interpretar produtos, organizar informações e reduzir ajustes manuais para acelerar a criação das ofertas.'
  },
]

const HOME_META = {
  title: 'Ofertamática — Criador grátis de placas e cartazes de oferta',
  description: 'Crie cartazes de oferta grátis para supermercado e varejo. Escolha o formato, informe os produtos, personalize e imprima sem cadastro obrigatório.',
  path: '/',
}

function upsertMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function SeoHead({ page }) {
  useEffect(() => {
    const path = page.path || '/' + page.slug
    document.title = page.title
    upsertMeta('description', page.description)
    upsertMeta('robots', 'index,follow')

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    const canonicalPath = path === '/' ? '/' : path.replace(/\/+$/, '') + '/'
    canonical.setAttribute('href', SITE_URL + canonicalPath)

    const oldSchema = document.getElementById('ofertamatica-faq-schema')
    oldSchema?.remove()
    const schema = document.createElement('script')
    schema.id = 'ofertamatica-faq-schema'
    schema.type = 'application/ld+json'
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    })
    document.head.appendChild(schema)

    return () => schema.remove()
  }, [page])

  return null
}

export function getSeoPage(pathname) {
  const clean = String(pathname || '/').replace(/^\/+|\/+$/g, '')
  return SEO_PAGES.find((page) => page.slug === clean) || null
}

export function AdUnit({ placement = 'content' }) {
  useEffect(() => {
    if (!ADSENSE_SLOT) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // Auto Ads continuam disponíveis pelo script global do AdSense.
    }
  }, [placement])

  return (
    <div className="oferta-ad-unit" data-placement={placement} aria-label="Publicidade">
      <span className="oferta-ad-label">PUBLICIDADE</span>
      {ADSENSE_SLOT ? (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="oferta-ad-fallback" aria-hidden="true" />
      )}
    </div>
  )
}

function AiTeaser({ onCreate, compact = false }) {
  return (
    <section className={`ai-teaser ${compact ? 'compact' : ''}`} id="ia">
      <div className="ai-teaser-copy">
        <span className="marketing-kicker">INTELIGÊNCIA ARTIFICIAL</span>
        <h2>Crie seu cartaz com IA</h2>
        <p>Use inteligência artificial para entender sua lista de produtos, organizar as informações e acelerar a criação dos cartazes.</p>
        <div className="ai-feature-row">
          <span>✦ Interpretação inteligente</span>
          <span>✦ Menos ajustes manuais</span>
          <span>✦ Mais velocidade no varejo</span>
        </div>
      </div>
      <div className="ai-teaser-action">
        <button type="button" onClick={onCreate}>Criar cartaz com IA</button>
        <small>Mais velocidade para a rotina do varejo.</small>
      </div>
    </section>
  )
}

function FaqSection({ onCreate }) {
  return (
    <section className="marketing-section faq-section" id="faq">
      <div className="marketing-heading">
        <span className="marketing-kicker">DÚVIDAS FREQUENTES</span>
        <h2>Cartazes para diferentes rotinas do varejo</h2>
        <p>As principais dúvidas sobre formatos, segmentos, campanhas e impressão.</p>
      </div>

      <div className="faq-grid">
        {FAQS.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>

      <div className="topic-cloud" aria-label="Exemplos de uso">
        {[...EXTRA_TOPICS.commerce, ...EXTRA_TOPICS.occasions, ...EXTRA_TOPICS.departments].map((topic) => (
          <button type="button" key={topic} onClick={onCreate}>{topic}</button>
        ))}
      </div>
    </section>
  )
}

export function HomeMarketing({ onCreate }) {
  return (
    <>
      <SeoHead page={HOME_META} />

      <div className="marketing-shell">
        <AiTeaser onCreate={onCreate} />

        <section className="marketing-section" id="modelos">
          <div className="marketing-heading">
            <span className="marketing-kicker">FEITO PARA O VAREJO</span>
            <h2>Do preço simples à campanha completa</h2>
            <p>Use o mesmo fluxo para criar cartazes de mercado, supermercado, atacarejo, hortifruti, açougue, padaria e outros setores.</p>
          </div>
          <div className="marketing-cards">
            <article><b>01</b><strong>Ofertas do dia</strong><p>Cartazes rápidos para ações que precisam entrar na loja agora.</p></article>
            <article><b>02</b><strong>Campanhas sazonais</strong><p>Black Friday, Natal, Páscoa, aniversário da loja e outras datas.</p></article>
            <article><b>03</b><strong>Departamentos</strong><p>Padaria, açougue, hortifruti, bebidas, limpeza, bomboniere e mais.</p></article>
          </div>
        </section>

        <AdUnit placement="home-content" />

        <section className="marketing-section how-section" id="como-funciona">
          <div className="marketing-heading">
            <span className="marketing-kicker">COMO FUNCIONA</span>
            <h2>Três etapas para sair da lista e chegar à impressão</h2>
          </div>
          <div className="how-grid">
            <article><span>1</span><div><strong>Escolha o formato</strong><p>Defina papel, orientação e quantidade de cartazes por folha.</p></div></article>
            <article><span>2</span><div><strong>Cole seus produtos</strong><p>Revise descrição, gramatura, unidade e preço interpretados pelo editor.</p></div></article>
            <article><span>3</span><div><strong>Personalize e imprima</strong><p>Ajuste cores e cabeçalho, confira a prévia e faça a revisão final.</p></div></article>
          </div>
          <button className="marketing-primary-cta" type="button" onClick={onCreate}>Criar meu cartaz grátis</button>
        </section>

        <section className="marketing-section seo-guides" id="guias">
          <div className="marketing-heading">
            <span className="marketing-kicker">GUIAS E FERRAMENTAS</span>
            <h2>Encontre o caminho certo para sua necessidade</h2>
            <p>Páginas específicas para quem procura criar, imprimir ou organizar cartazes promocionais.</p>
          </div>
          <div className="seo-link-grid">
            {SEO_PAGES.map((page) => (
              <a key={page.slug} href={'/' + page.slug + '/'}>
                <span>{page.eyebrow}</span>
                <strong>{page.heading}</strong>
                <small>Ver página →</small>
              </a>
            ))}
          </div>
        </section>

        <FaqSection onCreate={onCreate} />

        <section className="marketing-final-cta">
          <div>
            <span className="marketing-kicker">COMECE AGORA</span>
            <h2>Crie seus cartazes sem começar do zero</h2>
            <p>Escolha um formato e deixe o Ofertamática organizar sua impressão.</p>
          </div>
          <button type="button" onClick={onCreate}>Criar cartaz grátis</button>
        </section>
      </div>
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

        {page.slug === 'gerador-de-cartaz-com-ia' ? <AiTeaser onCreate={onCreate} compact /> : null}

        <section className="seo-explainer">
          <article>
            <span className="marketing-kicker">PASSO 1</span>
            <h2>Escolha como vai imprimir</h2>
            <p>Selecione o formato que combina com o espaço da loja e com a quantidade de ofertas que você precisa comunicar.</p>
          </article>
          <article>
            <span className="marketing-kicker">PASSO 2</span>
            <h2>Adicione produtos e preços</h2>
            <p>Cole sua lista e revise os campos interpretados antes de gerar as placas.</p>
          </article>
          <article>
            <span className="marketing-kicker">PASSO 3</span>
            <h2>Revise antes de imprimir</h2>
            <p>Confira o resultado visual, personalize o estilo e use a revisão de impressão.</p>
          </article>
        </section>

        <AdUnit placement={'seo-' + page.slug} />

        <FaqSection onCreate={onCreate} />

        <section className="related-pages">
          <span className="marketing-kicker">TAMBÉM PODE AJUDAR</span>
          <h2>Outras formas de usar o Ofertamática</h2>
          <div>
            {SEO_PAGES.filter((item) => item.slug !== page.slug).slice(0, 5).map((item) => (
              <a href={'/' + item.slug + '/'} key={item.slug}>{item.heading}<span>→</span></a>
            ))}
          </div>
        </section>

        <section className="marketing-final-cta">
          <div>
            <span className="marketing-kicker">PRONTO PARA COMEÇAR?</span>
            <h2>Escolha o formato e crie seu primeiro cartaz</h2>
            <p>Você pode começar agora e revisar tudo antes de imprimir.</p>
          </div>
          <button type="button" onClick={onCreate}>Abrir criador de cartazes</button>
        </section>
      </main>
    </>
  )
}
