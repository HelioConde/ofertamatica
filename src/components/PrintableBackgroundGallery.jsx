import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PosterSheet from './posters/PosterSheet'
import { POSTER_MODEL_PRESETS } from '../config/posterModelPresets'
import { POSTER_FORMAT_OPTIONS, getPosterFormat } from '../config/posterFormats'
import { getDefaultTemplateForFormat } from '../config/posterTemplates'
import { MAX_BACKGROUND_SHEETS, normalizeBackgroundSheetCount } from '../poster-engine/backgroundPrinting'
import { resolveReadableHeaderTextColor, resolveReadablePriceColor, resolveReadableTextColor } from '../utils/posterColorContrast'
import '../styles/background-gallery.css'

const PRINT_STYLE_ID = 'ofertamatica-model-background-print-style'
const PRINT_CLASS = 'model-background-printing'
const PX_PER_MM = 96 / 25.4
const BACKGROUND_MODELS = POSTER_MODEL_PRESETS.filter((model) => model.headerFooterStyle !== 'preimpresso')
const FORMAT_OPTIONS = POSTER_FORMAT_OPTIONS.filter((format) => format.id !== 'SRA3')

function colorsFor(model) {
  return {
    '--poster-background': model.background,
    '--poster-price-color': resolveReadablePriceColor(model.background, model.price),
    '--poster-text-color': resolveReadableTextColor(model.background, model.text),
    '--poster-header-color': model.header,
    '--poster-header-text-color': resolveReadableHeaderTextColor(model.header, model.headerText),
    '--poster-font-family': '"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif',
    '--poster-description-font-family': '"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif',
    '--poster-price-font-family': '"Futura Price", Impact, "Arial Black", sans-serif',
  }
}

function backgroundTemplate(model, formatId) {
  return {
    ...getDefaultTemplateForFormat(formatId),
    headerStyle: 'retail',
    headerText: model.label || 'OFERTA',
    headerFooterStyle: model.headerFooterStyle || 'moldura',
    offerMode: model.offerMode || 'standard',
    validityText: '',
    limitText: '',
    storeLogo: null,
    headerImage: '',
    backgroundImage: '',
    backgroundVisible: false,
  }
}

function BackgroundPreview({ model, format, template, compact = false }) {
  const width = format.widthMm * PX_PER_MM
  const height = format.heightMm * PX_PER_MM
  const scale = compact ? Math.min(0.14, 112 / width, 158 / height) : Math.min(0.35, 270 / width, 350 / height)
  return (
    <div className={compact ? 'bg-gallery-paper bg-gallery-paper-small' : 'bg-gallery-paper'} style={{ width: width * scale, height: height * scale, ...colorsFor(model) }}>
      <div className="bg-gallery-paper-scale" style={{ width, height, transform: `scale(${scale})` }}>
        <PosterSheet format={format} products={[]} template={template} layoutPlans={{}} backgroundOnly showBackground />
      </div>
    </div>
  )
}

export default function PrintableBackgroundGallery() {
  const [selectedId, setSelectedId] = useState('oferta-transparente')
  const [formatId, setFormatId] = useState('A4')
  const [sheetCount, setSheetCount] = useState(1)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(8)
  const [isPrinting, setIsPrinting] = useState(false)
  const printingRef = useRef(false)
  const selected = BACKGROUND_MODELS.find((item) => item.id === selectedId) || BACKGROUND_MODELS[0]
  const format = getPosterFormat(formatId)
  const template = useMemo(() => backgroundTemplate(selected, formatId), [selected, formatId])
  const colors = useMemo(() => colorsFor(selected), [selected])
  const visible = BACKGROUND_MODELS.filter((model) =>
    [model.name, model.category, model.label, model.note].join(' ').toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))
  )
  const shown = visible.slice(0, limit)

  useEffect(() => {
    return () => {
      document.body.classList.remove(PRINT_CLASS)
      document.getElementById(PRINT_STYLE_ID)?.remove()
    }
  }, [])

  async function openPrintDialog() {
    if (printingRef.current) return
    printingRef.current = true
    setIsPrinting(true)
    let style = document.getElementById(PRINT_STYLE_ID)
    if (!style) {
      style = document.createElement('style')
      style.id = PRINT_STYLE_ID
      document.head.appendChild(style)
    }
    style.textContent = `@page { size: ${format.widthMm}mm ${format.heightMm}mm; margin: 0; }`
    const cleanup = () => {
      document.body.classList.remove(PRINT_CLASS)
      document.getElementById(PRINT_STYLE_ID)?.remove()
      window.removeEventListener('afterprint', cleanup)
      printingRef.current = false
      setIsPrinting(false)
    }
    window.addEventListener('afterprint', cleanup)
    try {
      if (document.fonts?.ready) await document.fonts.ready
      document.body.classList.add(PRINT_CLASS)
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        try { window.print() } catch { cleanup() }
      }))
    } catch {
      cleanup()
    }
  }

  const printRoot = (
    <div className="model-background-print-root" style={colors} aria-hidden="true">
      {Array.from({ length: sheetCount }, (_, index) => (
        <PosterSheet key={index} className="model-background-print-sheet" format={format} products={[]} template={template} layoutPlans={{}} backgroundOnly showBackground />
      ))}
    </div>
  )

  return (
    <section className="marketing-section bg-gallery" aria-labelledby="bg-gallery-title">
      <div className="marketing-heading">
        <span className="marketing-kicker">IMPRESSÃO DE FUNDOS PRONTOS</span>
        <h2 id="bg-gallery-title">Imprima a arte agora, preencha o preço depois</h2>
        <p>Escolha uma das artes, o tamanho do papel e a quantidade de folhas. A impressão sai com cabeçalho e fundo, mas sem descrição, produto ou preço. Não precisa cadastrar produtos.</p>
      </div>
      <div className="bg-gallery-workspace">
        <div className="bg-gallery-selection">
          <label className="bg-gallery-search">
            Buscar arte de fundo
            <input type="search" placeholder="Ex.: oferta, hortifruti, padaria..." value={query} onChange={(event) => { setQuery(event.target.value); setLimit(8) }} />
          </label>
          <div className="bg-gallery-grid" aria-label="Escolha um fundo pronto">
            {shown.map((model) => (
              <button type="button" key={model.id} className={'bg-gallery-card' + (selected.id === model.id ? ' is-selected' : '')} aria-pressed={selected.id === model.id} onClick={() => setSelectedId(model.id)}>
                <BackgroundPreview model={model} format={getPosterFormat('A4')} template={backgroundTemplate(model, 'A4')} compact />
                <strong>{model.name}</strong>
                <small>{model.category}</small>
                <span>{selected.id === model.id ? '✓ Selecionado' : 'Escolher este fundo'}</span>
              </button>
            ))}
          </div>
          {!visible.length ? <p className="bg-gallery-empty">Nenhuma arte encontrada. Tente outra busca.</p> : null}
          {visible.length > shown.length ? <button type="button" className="bg-gallery-more" onClick={() => setLimit((n) => n + 8)}>Ver mais fundos ({visible.length - shown.length})</button> : null}
        </div>
        <div className="bg-gallery-settings">
          <h3>Configurar impressão</h3>
          <p className="bg-gallery-selected-name">Arte escolhida: <strong>{selected.name}</strong></p>
          <div className="bg-gallery-fields">
            <label>
              Tamanho e divisão da folha
              <select value={formatId} onChange={(event) => setFormatId(event.target.value)}>
                {FORMAT_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </label>
            <label>
              Quantidade de folhas
              <input type="number" min="1" max={MAX_BACKGROUND_SHEETS} value={sheetCount} onChange={(event) => setSheetCount(normalizeBackgroundSheetCount(event.target.value))} />
            </label>
          </div>
          <p className="bg-gallery-quantity">{sheetCount} {sheetCount === 1 ? 'folha' : 'folhas'} · {sheetCount * format.postersPerSheet} {sheetCount * format.postersPerSheet === 1 ? 'fundo pronto' : 'fundos prontos'}</p>
          <div className="bg-gallery-preview" role="img" aria-label={`Prévia do fundo ${selected.name} no formato ${format.label}, sem descrição e sem preço`}>
            <BackgroundPreview model={selected} format={format} template={template} />
          </div>
          <div className="bg-gallery-actions">
            <button className="bg-gallery-primary" type="button" onClick={openPrintDialog} disabled={isPrinting}>Imprimir somente fundos</button>
            <button className="bg-gallery-secondary" type="button" onClick={openPrintDialog} disabled={isPrinting}>Salvar fundo em PDF</button>
          </div>
          <p className="bg-gallery-help">Para salvar PDF, escolha “Salvar como PDF” na janela de impressão. Use escala 100%, margens nenhuma, sem cabeçalhos/rodapés e ative “Gráficos de fundo” para manter as cores.</p>
        </div>
      </div>
      {createPortal(printRoot, document.body)}
    </section>
  )
}
