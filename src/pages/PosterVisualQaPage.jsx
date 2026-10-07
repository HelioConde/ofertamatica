import { useEffect, useMemo, useState } from 'react'
import PosterSheet from '../components/posters/PosterSheet'
import { getPosterFormat } from '../config/posterFormats'
import { getDefaultTemplateForFormat } from '../config/posterTemplates'
import { createPosterLayouts } from '../poster-engine/layoutPlan'
import { createBrowserTextMeasure } from '../utils/posterBrowserMeasure'

const PX_PER_MM = 96 / 25.4

const SAMPLES = [
  { id: 'mamao-moldura-a4', formatId: 'A4', description: 'MAMÃO', subdescription: 'FORMOSA', complement: '', unit: 'KG', price: '4,99', headerFooterStyle: 'moldura', headerText: 'OFERTA', headerColor: '#ed1c24', headerTextColor: '#ffffff' },
  { id: 'abacaxi-imperdivel-a4', formatId: 'A4', description: 'ABACAXI', subdescription: 'PEÇA', complement: '', unit: '', price: '6,99', headerFooterStyle: 'imperdivel', headerText: 'OFERTA', headerColor: '#ed1c24', headerTextColor: '#ffffff' },
  { id: 'melancia-promocao-a4', formatId: 'A4', description: 'MELANCIA', subdescription: '', complement: '', unit: 'KG', price: '2,99', headerFooterStyle: 'promocao', headerText: 'PROMOÇÃO', headerColor: '#ef3340', headerTextColor: '#ffffff' },
  { id: 'uva-chevron-a5', formatId: 'A5', description: 'UVA', subdescription: 'VERMELHA', complement: 'SEM SEMENTE', unit: '500G', price: '5,99', headerFooterStyle: 'chevron', headerText: 'OFERTA', headerColor: '#c80016', headerTextColor: '#ffffff' },
  { id: 'mexerica-oval-a5', formatId: 'A5', description: 'MEXERICA', subdescription: 'MURCOT', complement: '', unit: 'KG', price: '7,99', headerFooterStyle: 'oval', headerText: 'OFERTA', headerColor: '#c80016', headerTextColor: '#fff200' },
  { id: 'manga-curva-a4x4', formatId: 'A4X4', description: 'MANGA', subdescription: 'TOMMY', complement: '', unit: 'KG', price: '4,99', headerFooterStyle: 'curva-simples', headerText: 'OFERTA', headerColor: '#ef3340', headerTextColor: '#ffffff' },
  { id: 'banana-ondas-a4x2', formatId: 'A4X2_CIMA_BAIXO', description: 'BANANA', subdescription: 'PRATA', complement: '', unit: 'KG', price: '4,99', headerFooterStyle: 'ondas', headerText: 'OFERTA', headerColor: '#e7192d', headerTextColor: '#fff200' },
  { id: 'manga-divertida-a3', formatId: 'A3', description: 'MANGA', subdescription: 'PALMER', complement: '', unit: 'KG', price: '3,99', headerFooterStyle: 'divertido', headerText: 'OFERTA', headerColor: '#ef3340', headerTextColor: '#ffffff' },
  { id: 'cafe-contorno-a4', formatId: 'A4', description: 'CAFÉ', subdescription: 'TRADICIONAL', complement: '', unit: '500G', price: '18,90', headerFooterStyle: 'minimal', headerText: 'OFERTA', headerColor: '#ef3340', headerTextColor: '#ffffff' },
  { id: 'arroz-rodape-a4', formatId: 'A4', description: 'ARROZ', subdescription: 'TIPO 1', complement: '', unit: '5KG', price: '24,90', headerFooterStyle: 'rodape-forte', headerText: 'SUPER OFERTA', headerColor: '#d4142d', headerTextColor: '#fff200' },
  { id: 'leite-especial-a4', formatId: 'A4', description: 'LEITE', subdescription: 'INTEGRAL', complement: '', unit: '1L', price: '4,99', headerFooterStyle: 'especial', headerText: 'OFERTA', headerColor: '#ed1c24', headerTextColor: '#fff200' },
]

function Preview({ sample, format, template, layouts }) {
  const naturalWidth = format.widthMm * PX_PER_MM
  const naturalHeight = format.heightMm * PX_PER_MM
  const maxWidth = 320
  const maxHeight = 470
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1)

  return (
    <div
      className="poster-visual-qa-preview-shell"
      style={{
        '--poster-header-color': sample.headerColor || '#ed1c24',
        '--poster-header-text-color': sample.headerTextColor || '#ffffff',
      }}
    >
      <div
        className="poster-visual-qa-preview"
        style={{ width: naturalWidth * scale, height: naturalHeight * scale }}
      >
        <div
          className="poster-visual-qa-scale"
          style={{ width: naturalWidth, height: naturalHeight, transform: `scale(${scale})` }}
        >
          <PosterSheet
            format={format}
            products={[sample]}
            template={template}
            layoutPlans={layouts}
            showBackground
          />
        </div>
      </div>
    </div>
  )
}

export default function PosterVisualQaPage() {
  const [fontsReady, setFontsReady] = useState(false)
  const measure = useMemo(() => createBrowserTextMeasure(), [fontsReady])

  useEffect(() => {
    let active = true
    Promise.all([
      document.fonts.load('16px "Burbank Big Cd Bk"'),
      document.fonts.load('16px "Futura Price"'),
    ]).finally(() => {
      if (active) setFontsReady(true)
    })
    return () => { active = false }
  }, [])

  const cases = useMemo(() => SAMPLES.map((sample) => {
    const format = getPosterFormat(sample.formatId)
    const baseTemplate = getDefaultTemplateForFormat(sample.formatId)
    const template = {
      ...baseTemplate,
      headerStyle: 'retail',
      headerFooterStyle: sample.headerFooterStyle,
      headerText: sample.headerText || 'OFERTA',
    }
    const layouts = createPosterLayouts([sample], template, format, measure)
    return { sample, format, template, layouts }
  }), [measure])

  return (
    <main className="poster-visual-qa" data-fonts-ready={fontsReady ? 'true' : 'false'}>
      <header className="poster-visual-qa-header">
        <span>QA visual · Ofertamática</span>
        <h1>Comparação automática das placas</h1>
        <p>Referências reais para acompanhar tipografia, preço e a geometria dos diferentes headers de oferta.</p>
      </header>

      <section className="poster-visual-qa-grid">
        {cases.map(({ sample, format, template, layouts }) => (
          <article className="poster-visual-qa-card" data-sample={sample.id} data-format={sample.formatId} data-frame={sample.headerFooterStyle} key={sample.id}>
            <div className="poster-visual-qa-label">
              <strong>{sample.headerText || 'OFERTA'} · {sample.headerFooterStyle}</strong>
              <span>{sample.description} {sample.subdescription} · {format.shortLabel || format.label} · R$ {sample.price}</span>
            </div>
            <Preview sample={sample} format={format} template={template} layouts={layouts} />
          </article>
        ))}
      </section>
    </main>
  )
}
