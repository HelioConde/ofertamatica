import { SEO_FAQS, SEO_PAGES, SEO_TOPIC_GROUPS } from './seoPages'
import './seo.css'

export default function SeoGrowthSections() {
  return (
    <div className="seo-growth-sections">
      <section className="growth-ai" id="modelos">
        <div className="growth-shell growth-ai-grid">
          <div>
            <span className="growth-kicker">DIFERENCIAL OFERTAMÁTICA</span>
            <h2>Crie seu cartaz com IA</h2>
            <p>Transforme listas de produtos em ofertas com menos trabalho manual. O Ofertamática foi pensado para acelerar a criação, organizar informações e manter o padrão visual da loja.</p>
          </div>
          <a href="#formatos">Criar meu cartaz</a>
        </div>
      </section>

      <section className="growth-section" id="como-funciona">
        <div className="growth-shell">
          <span className="growth-kicker">COMO FUNCIONA</span>
          <h2>Da lista à placa pronta para imprimir</h2>
          <div className="growth-steps">
            <article><b>1</b><strong>Escolha o formato</strong><p>A4, A3 e opções com múltiplos cartazes por folha.</p></article>
            <article><b>2</b><strong>Adicione os produtos</strong><p>Cole uma lista ou importe seu arquivo e revise os campos.</p></article>
            <article><b>3</b><strong>Personalize</strong><p>Use cores, estilos e cabeçalhos adequados à campanha.</p></article>
            <article><b>4</b><strong>Revise e imprima</strong><p>Confira a prévia e envie no tamanho físico selecionado.</p></article>
          </div>
        </div>
      </section>

      <section className="growth-section growth-guides" id="guias">
        <div className="growth-shell">
          <span className="growth-kicker">GUIAS E SOLUÇÕES</span>
          <h2>Cartazes para diferentes necessidades do varejo</h2>
          <div className="growth-page-links">
            {SEO_PAGES.map((page) => (
              <a key={page.slug} href={`/${page.slug}/`}><strong>{page.h1}</strong><small>{page.description}</small><span>Ver guia →</span></a>
            ))}
          </div>
          <div className="growth-topic-groups">
            {SEO_TOPIC_GROUPS.map((group) => (
              <article key={group.title}><strong>{group.title}</strong><p>{group.items.join(' · ')}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="growth-section growth-faq" id="faq">
        <div className="growth-shell">
          <span className="growth-kicker">PERGUNTAS FREQUENTES</span>
          <h2>Dúvidas sobre cartazes de oferta</h2>
          <div className="growth-faq-list">
            {SEO_FAQS.map(([question, answer]) => (
              <details key={question}><summary>{question}</summary><p>{answer}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="growth-final">
        <div className="growth-shell growth-final-inner">
          <div><span className="growth-kicker">OFERTAMÁTICA</span><h2>Crie seu cartaz com IA.</h2><p>Mais agilidade para transformar produtos e preços em ofertas prontas para o ponto de venda.</p></div>
          <a href="#formatos">Criar cartaz grátis</a>
        </div>
      </section>
    </div>
  )
}
