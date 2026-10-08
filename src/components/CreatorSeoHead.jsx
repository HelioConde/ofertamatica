import { useEffect } from 'react'

const SITE_URL = 'https://ofertamatica.com.br'
const TITLE = 'Placas para Mercado Online Grátis | Ofertamática'
const DESCRIPTION = 'Crie placas para mercado online e cartazes de oferta para supermercado grátis. Importe produtos, escolha A4, A5 ou A3, personalize e imprima sem cadastro.'

function upsertMeta(selector, attr, value, content) {
  let node = document.querySelector(selector)
  if (!node) {
    node = document.createElement('meta')
    node.setAttribute(attr, value)
    document.head.appendChild(node)
  }
  node.setAttribute('content', content)
}

export default function CreatorSeoHead() {
  useEffect(() => {
    document.title = TITLE
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = SITE_URL + '/'
    upsertMeta('meta[name="description"]', 'name', 'description', DESCRIPTION)
    upsertMeta('meta[name="robots"]', 'name', 'robots', 'index,follow,max-image-preview:large')
    for (const [field, value] of Object.entries({
      'og:title': TITLE,
      'og:description': DESCRIPTION,
      'og:url': SITE_URL + '/',
      'og:type': 'website',
    })) {
      upsertMeta(`meta[property="${field}"]`, 'property', field, value)
    }
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary')
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', TITLE)
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', DESCRIPTION)

    document.getElementById('ofertamatica-article-schema')?.remove()
    document.getElementById('ofertamatica-faq-schema')?.remove()
    document.getElementById('ofertamatica-page-schema')?.remove()
    const schema = document.createElement('script')
    schema.id = 'ofertamatica-page-schema'
    schema.type = 'application/ld+json'
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Ofertamática',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: SITE_URL + '/',
      description: DESCRIPTION,
      publisher: {
        '@type': 'Organization',
        name: 'Ofertamática',
        url: SITE_URL + '/',
        logo: SITE_URL + '/icons/icon-192.png',
      },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    })
    document.head.appendChild(schema)
    return () => schema.remove()
  }, [])
  return null
}
