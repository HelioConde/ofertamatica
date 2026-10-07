import { useEffect, useMemo, useState } from 'react'
import PosterSheet from '../components/posters/PosterSheet'
import { getPosterFormat } from '../config/posterFormats'
import { getDefaultTemplateForFormat } from '../config/posterTemplates'
import { createPosterLayouts } from '../poster-engine/layoutPlan'
import { createBrowserTextMeasure } from '../utils/posterBrowserMeasure'

const PX_PER_MM = 96 / 25.4

const SAMPLES = [
  { id: 'mamao-formosa-a4', formatId: 'A4', description: 'MAMÃO', subdescription: 'FORMOSA', complement: '', unit: 'KG', price: '4,99' },
  { id: 'abacaxi-peca-a4', formatId: 'A4', description: 'ABACAXI', subdescription: 'PEÇA', complement: '', unit: '', price: '6,99' },
  { id: 'melancia-a4', formatId: 'A4', description: 'MELANCIA', subdescription: '', complement: '', unit: 'KG', price: '2,99' },
  { id: 'uva-vermelha-a5', formatId: 'A5', description: 'UVA', subdescription: 'VERMELHA', complement: 'SEM SEMENTE', unit: '500G', price: '5,99' },
  { id: 'mexerica-murcot-a5', formatId: 'A5', description: 'MEXERICA', subdescription: 'MURCOT', complement: '', unit: 'KG', price: '7,99' },
  { id: 'manga-tommy-a4x4', formatId: 'A4X4', description: 'MANGA', subdescription: 'TOMMY', complement: '', unit: 'KG', price: '4,99' },
  { id: 'banana-prata-a4x2', formatId: 'A4X2_CIMA_BAIXO', description: 'BANANA', subdescription: 'PRATA', complement: '', unit: 'KG', price: '4,99' },
  { id: 'manga-palmer-a3', formatId: 'A3', description: 'MANGA', subdescription: 'PALMER', complement: '', unit: 'KG', price: '3,99' },
]

function Preview({ sample, format, template, layouts }) {
  const naturalWidth = format.widthMm * PX_PER_MM
  const naturalHeight = format.heightMm * PX_PER_MM
  const maxWidth = 320
  const maxHeight = 470
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1)

  return (
    <div className="poster-visual-qa-preview-shell">
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
    const template = getDefaultTemplateForFormat(sample.formatId)
    const layouts = createPosterLayouts([sample], template, format, measure)
    return { sample, format, template, layouts }
  }), [measure])

  return (
    <main className="poster-visual-qa" data-fonts-ready={fontsReady ? 'true' : 'false'}>
      <header className="poster-visual-qa-header">
        <span>QA visual · Ofertamática</span>
        <h1>Comparação automática das placas</h1>
        <p>Referências reais de hortifruti para acompanhar tipografia, acentos, ocupação da descrição e proporção do preço.</p>
      </header>

      <section className="poster-visual-qa-grid">
        {cases.map(({ sample, format, template, layouts }) => (
          <article className="poster-visual-qa-card" data-sample={sample.id} data-format={sample.formatId} key={sample.id}>
            <div className="poster-visual-qa-label">
              <strong>{sample.description} {sample.subdescription}</strong>
              <span>{format.shortLabel || format.label} · R$ {sample.price}</span>
            </div>
            <Preview sample={sample} format={format} template={template} layouts={layouts} />
          </article>
        ))}
      </section>
    </main>
  )
}
