import { useEffect, useRef, useState } from 'react'
import '../styles/marketing.css'

const SITE_URL = 'https://ofertamatica.com.br'
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-9514218545388169'
const ADSENSE_SLOTS = {
  'home-content': '3215962830',
  'seo-content': '5483033524',
  'format-grid': '7286894770',
}
// PRODUCT_DECISION_AI_UPCOMING: IA é a próxima implementação; não anunciar como recurso disponível.
// PRODUCT_DECISION_AI_PERMANENT_COPY: manter “Crie seu cartaz com IA” sem rótulos temporários.

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
    title: 'Gerador de cartaz com IA — em breve | Ofertamática',
    description: 'Conheça a próxima implementação do Ofertamática: criação de cartazes de oferta com inteligência artificial para acelerar a rotina do varejo.',
    eyebrow: 'PRÓXIMA IMPLEMENTAÇÃO · IA',
    heading: 'Crie seu cartaz com IA',
    lead: 'Estamos preparando uma experiência em que a inteligência artificial ajudará a interpretar os produtos, organizar as informações e reduzir ajustes manuais.',
    benefits: ['Interpretação inteligente de produtos', 'Menos ajustes manuais', 'Fluxo pensado para acelerar campanhas'],
    comingSoon: true,
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
    q: 'O Ofertamática já cria cartazes com inteligência artificial?',
    a: 'Ainda não. “Crie seu cartaz com IA” é a próxima implementação do Ofertamática. O editor atual já permite criar, personalizar, revisar e imprimir cartazes gratuitamente.'
  },
]


const PUBLIC_PAGES = [
  {
    slug: 'modelos',
    title: 'Modelos de cartaz de oferta | Ofertamática',
    description: 'Conheça modelos e estilos de cartazes de oferta para supermercado, varejo e campanhas promocionais.',
    eyebrow: 'MODELOS',
    heading: 'Modelos para destacar cada tipo de oferta',
    lead: 'Comece com uma identidade visual pronta e ajuste cores, cabeçalho e conteúdo para a campanha da sua loja.',
  },
  {
    slug: 'formatos',
    title: 'Formatos de cartaz A4, A3 e SRA3 | Ofertamática',
    description: 'Veja os formatos disponíveis no Ofertamática para imprimir cartazes de oferta em A4, A3 e SRA3.',
    eyebrow: 'FORMATOS',
    heading: 'Escolha o formato certo para cada espaço da loja',
    lead: 'Use uma folha inteira para maior impacto ou distribua várias ofertas na mesma folha para economizar impressão.',
  },
  {
    slug: 'como-funciona',
    title: 'Como funciona o Ofertamática | Crie e imprima cartazes',
    description: 'Veja como criar cartazes no Ofertamática: escolha o formato, informe os produtos, personalize e revise a impressão.',
    eyebrow: 'COMO FUNCIONA',
    heading: 'Da lista de produtos ao cartaz pronto para imprimir',
    lead: 'O fluxo foi pensado para reduzir trabalho manual e deixar produto, unidade e preço fáceis de revisar.',
  },
  {
    slug: 'guias-para-varejo',
    title: 'Guias para varejo e cartazes de oferta | Ofertamática',
    description: 'Acesse guias práticos para criar cartazes de supermercado, promoções, preços e materiais para impressão.',
    eyebrow: 'GUIAS PARA VAREJO',
    heading: 'Guias práticos para melhorar a comunicação de ofertas',
    lead: 'Encontre conteúdos específicos para supermercado, preço, impressão, campanhas e criação de cartazes.',
  },
]

export function getPublicPage(pathname) {
  const clean = String(pathname || '/').replace(/^\/+|\/+$/g, '')
  return PUBLIC_PAGES.find((page) => page.slug === clean) || null
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
      // O elemento pode já ter sido processado em desenvolvimento/StrictMode.
    }

    const timeout = window.setTimeout(() => {
      const status = syncStatus()
      // Bloqueadores podem impedir completamente o AdSense de definir data-ad-status.
      // Nesse caso recolhemos o espaço para não deixar um cartão vazio.
      if (status !== 'filled') setAdState('hidden')
    }, 8000)

    return () => {
      observer?.disconnect()
      window.clearTimeout(timeout)
    }
  }, [placement, slot])

  if (!slot || adState === 'hidden') return null

  return (
    <div
      className={'oferta-ad-unit ' + (adState === 'pending' ? 'is-pending' : 'is-filled')}
      data-placement={placement}
      aria-label="Publicidade"
    >
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
    <section className={`ai-teaser ${compact ? 'compact' : ''}`} id="ia">
      <div className="ai-teaser-copy">
        <span className="marketing-kicker">PRÓXIMA IMPLEMENTAÇÃO</span>
        <h2>Crie seu cartaz com IA</h2>
        <p>Estamos preparando inteligência artificial para entender sua lista de produtos, organizar as informações e acelerar a criação dos cartazes.</p>
        <div className="ai-feature-row">
          <span>✦ Interpretação inteligente</span>
          <span>✦ Menos ajustes manuais</span>
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

export function PublicPage({ page, onCreate }) {
  const isModels = page.slug === 'modelos'
  const isFormats = page.slug === 'formatos'
  const isHow = page.slug === 'como-funciona'
  const isGuides = page.slug === 'guias-para-varejo'

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
            <strong>✓ Editor direto no navegador</strong>
            <strong>✓ Pré-visualização antes de imprimir</strong>
            <strong>✓ Formatos pensados para o varejo</strong>
          </aside>
        </section>

        {isModels ? (
          <>
            <section className="marketing-section">
              <div className="marketing-heading">
                <span className="marketing-kicker">ESTILOS PRONTOS</span>
                <h2>Comece por um visual e adapte para sua campanha</h2>
                <p>Os modelos servem como ponto de partida. Você pode alterar cores, cabeçalho e conteúdo antes de imprimir.</p>
              </div>
              <div className="marketing-cards">
                <article><b>01</b><strong>Clássico</strong><p>Fundo amarelo, preço em vermelho e leitura rápida para ofertas do dia.</p></article>
                <article><b>02</b><strong>Vermelho</strong><p>Maior impacto para campanhas agressivas, saldões e ofertas relâmpago.</p></article>
                <article><b>03</b><strong>Verde</strong><p>Boa opção para hortifruti, campanhas frescas e comunicação por departamento.</p></article>
                <article><b>04</b><strong>Premium</strong><p>Visual escuro com contraste alto para linhas especiais e campanhas temáticas.</p></article>
              </div>
            </section>
            <AiTeaser onCreate={onCreate} compact />
          </>
        ) : null}

        {isFormats ? (
          <section className="marketing-section">
            <div className="marketing-heading">
              <span className="marketing-kicker">PAPEL E APROVEITAMENTO</span>
              <h2>Formatos disponíveis</h2>
              <p>Escolha pelo tamanho do cartaz, distância de leitura e quantidade de ofertas que deseja imprimir por folha.</p>
            </div>
            <div className="marketing-cards">
              <article><b>A4</b><strong>4 cartazes por folha</strong><p>Para placas menores, gôndolas e impressão econômica em volume.</p></article>
              <article><b>A4</b><strong>2 cartazes por folha</strong><p>Equilíbrio entre destaque do preço e aproveitamento do papel.</p></article>
              <article><b>A4</b><strong>1 cartaz por folha</strong><p>Mais impacto para ofertas principais e comunicação a maior distância.</p></article>
              <article><b>A3</b><strong>Cartaz ampliado</strong><p>Indicado para pontos de maior visibilidade e campanhas de destaque.</p></article>
              <article><b>SRA3</b><strong>Área extra de impressão</strong><p>Opção para fluxos de impressão que utilizam papel SRA3.</p></article>
            </div>
            <div className="seo-hero-actions">
              <button type="button" onClick={onCreate}>Escolher um formato</button>
            </div>
          </section>
        ) : null}

        {isHow ? (
          <section className="marketing-section how-section">
            <div className="marketing-heading">
              <span className="marketing-kicker">PASSO A PASSO</span>
              <h2>Crie, revise e imprima em um único fluxo</h2>
            </div>
            <div className="how-grid">
              <article><span>1</span><div><strong>Escolha o formato</strong><p>Defina papel, orientação e quantidade de cartazes por folha.</p></div></article>
              <article><span>2</span><div><strong>Adicione os produtos</strong><p>Cole sua lista e revise descrição, complemento, unidade e preço.</p></div></article>
              <article><span>3</span><div><strong>Personalize</strong><p>Ajuste modelo, cores, tipografia e cabeçalho da placa.</p></div></article>
              <article><span>4</span><div><strong>Revise e imprima</strong><p>Confira a prévia no tamanho escolhido antes de enviar à impressora.</p></div></article>
            </div>
            <button className="marketing-primary-cta" type="button" onClick={onCreate}>Começar agora</button>
          </section>
        ) : null}

        {isGuides ? (
          <section className="marketing-section seo-guides">
            <div className="marketing-heading">
              <span className="marketing-kicker">CONTEÚDO PARA VAREJO</span>
              <h2>Escolha o guia mais próximo da sua necessidade</h2>
              <p>As páginas abaixo aprofundam tipos de cartaz, formatos, impressão e uso em supermercado.</p>
            </div>
            <div className="seo-link-grid">
              {SEO_PAGES.map((item) => (
                <a key={item.slug} href={'/' + item.slug + '/'}>
                  <span>{item.eyebrow}</span>
                  <strong>{item.heading}</strong>
                  <small>Abrir guia →</small>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <AdUnit placement={'seo-' + page.slug} />

        <section className="marketing-final-cta">
          <div>
            <span className="marketing-kicker">CRIE AGORA</span>
            <h2>Monte seu próximo cartaz no Ofertamática</h2>
            <p>Escolha o formato, adicione os produtos e revise tudo antes de imprimir.</p>
          </div>
          <button type="button" onClick={onCreate}>Criar cartaz grátis</button>
        </section>
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
