import { useEffect, useMemo, useRef, useState } from 'react'
import PosterSheet from './posters/PosterSheet'
import { POSTER_MODEL_PRESETS } from '../config/posterModelPresets'
import { getDefaultTemplateForFormat } from '../config/posterTemplates'
import { getPosterFormat, POSTER_FORMAT_OPTIONS } from '../config/posterFormats'
import { FREE_EDITOR_TUTORIAL } from '../seo/seoPages'
import { createPosterLayouts } from '../poster-engine/layoutPlan'
import { createBrowserTextMeasure } from '../utils/posterBrowserMeasure'
import { resolveReadableHeaderTextColor, resolveReadablePriceColor, resolveReadableTextColor } from '../utils/posterColorContrast'
import '../styles/free-editor.css'

const STORAGE_KEY = 'ofertamatica:editor-livre:v1'
const START_MODEL = 'oferta-transparente'
const ALLOWED_FORMATS = ['A4', 'A4X2_CIMA_BAIXO', 'A4X4', 'A4X8', 'A5', 'A3']
const PX_PER_MM = 96 / 25.4
const FONT_CHOICES = [
  { value: 'auto', label: 'Cartazista (padrão)' },
  { value: 'Impact, "Arial Black", sans-serif', label: 'Impact' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
]
const PRICE_FONTS = [
  { value: '"Futura Price", Impact, "Arial Black", sans-serif', label: 'Futura (padrão)' },
  { value: 'Impact, "Arial Black", sans-serif', label: 'Impact' },
  { value: 'Arial, sans-serif', label: 'Arial' },
]
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const money = (value) => String(value || '').replace(/^\s*R\$\s*/i, '').slice(0, 18)
const round = (num) => Math.round(num * 10) / 10
const initial = () => ({
  formatId: 'A4',
  modelId: START_MODEL,
  product: { description: 'ÁGUA MINERAL', subdescription: 'CRYSTAL', complement: 'COM GÁS', unit: '500 ML', price: '1,69' },
  showDescription: true, showPrice: true, showCurrency: true,
  headerText: 'OFERTA', showHeader: true,
  descriptionFont: 'auto', priceFont: PRICE_FONTS[0].value,
  colors: null, boxes: null, extras: [],
})
function restore() {
  const defaults = initial()
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!parsed || typeof parsed !== 'object') return defaults
    return {
      ...defaults,
      ...parsed,
      formatId: ALLOWED_FORMATS.includes(parsed.formatId) ? parsed.formatId : 'A4',
      modelId: POSTER_MODEL_PRESETS.some((x) => x.id === parsed.modelId) ? parsed.modelId : START_MODEL,
      product: { ...defaults.product, ...(parsed.product || {}) },
      boxes: parsed.boxes && typeof parsed.boxes === 'object' ? parsed.boxes : null,
      extras: Array.isArray(parsed.extras) ? parsed.extras.slice(0, 12).filter((x) => x && typeof x.id === 'string') : [],
    }
  } catch { return defaults }
}

function boxWithinBounds(box) {
  const width = round(clamp(Number(box?.width) || 40, 8, 100))
  const height = round(clamp(Number(box?.height) || 20, 6, 100))
  return {
    x: round(clamp(Number(box?.x) || 0, 0, 100 - width)),
    y: round(clamp(Number(box?.y) || 0, 0, 100 - height)),
    width, height, alignX: 'center', alignY: 'center',
    ...(box?.gap !== undefined ? { gap: box.gap } : {}),
  }
}

function FreeBoard({ format, template, products, layouts, extras, selected, onSelect, onStartBoxDrag, onStartExtraDrag }) {
  const host = useRef(null)
  const [scale, setScale] = useState(0.6)
  useEffect(() => {
    const element = host.current
    if (!element) return undefined
    function resize() {
      const rect = element.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const factor = Math.min((rect.width - 18) / (format.widthMm * PX_PER_MM), (rect.height - 18) / (format.heightMm * PX_PER_MM), 1)
      setScale(clamp(factor, 0.05, 1))
    }
    resize()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [format.widthMm, format.heightMm])
  const width = format.widthMm * PX_PER_MM
  const height = format.heightMm * PX_PER_MM
  return (
    <div className="free-board-host" ref={host} data-selected={selected} aria-label="Prévia interativa do cartaz. Arraste as caixas para mover; arraste o círculo no canto para redimensionar.">
      <div className="free-board-outer" style={{ width: width * scale, height: height * scale }}>
        <div className="free-board-scale" style={{ width, height, transform: 'scale(' + scale + ')' }}>
          <PosterSheet
            format={format} products={products} template={template} layoutPlans={layouts}
            showBackground showLayoutDebug editable
            onBoxPointerDown={onStartBoxDrag}
            extraBoxes={extras} selectedExtraId={selected}
            onExtraPointerDown={onStartExtraDrag} onSelectProduct={onSelect}
          />
        </div>
      </div>
    </div>
  )
}

function NumericSetting({ label, value, onChange, min = 0, max = 100 }) {
  return <label className="free-number-setting"><span>{label}</span><input type="number" min={min} max={max} step="0.5" value={value} onChange={(event) => {
    const number = Number(event.target.value)
    if (event.target.value !== '' && Number.isFinite(number)) onChange(number)
  }} /></label>
}

export default function FreePosterEditor() {
  const [state, setState] = useState(restore)
  const [selected, setSelected] = useState('contentBox')
  const [saved, setSaved] = useState(false)
  const [printHint, setPrintHint] = useState('')
  const [guideFocus, setGuideFocus] = useState('')
  const dragCleanup = useRef(null)
  function showGuide() {
    const help = document.getElementById('guia-editor-livre')
    if (help) {
      help.open = true
      help.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }
  function focusGuide(target) {
    setGuideFocus(target)
    window.requestAnimationFrame(() => document.querySelector(`[data-guide-section="${target}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }
  const format = getPosterFormat(state.formatId)
  const model = POSTER_MODEL_PRESETS.find((item) => item.id === state.modelId) || POSTER_MODEL_PRESETS[0]
  const base = getDefaultTemplateForFormat(state.formatId)
  const boxes = {
    contentBox: boxWithinBounds(state.boxes?.contentBox || base.contentBox),
    priceBox: boxWithinBounds(state.boxes?.priceBox || base.priceBox),
  }
  const palette = state.colors || { background: model.background, text: model.text, price: model.price, header: model.headerText }
  const isPreprinted = model.headerFooterStyle === 'preimpresso'
  const title = state.showHeader ? state.headerText : ''
  const measure = useMemo(() => createBrowserTextMeasure(), [])
  const template = useMemo(() => ({
    ...base,
    contentBox: boxes.contentBox,
    priceBox: boxes.priceBox,
    showCurrency: state.showCurrency,
    headerText: title || 'OFERTA',
    headerStyle: state.showHeader ? 'retail' : 'hidden',
    headerFooterStyle: model.headerFooterStyle,
    offerMode: 'standard',
    validityText: '', limitText: '',
    headerImage: '',
    textStyles: {
      ...base.textStyles,
      ...Object.fromEntries(['description', 'subdescription', 'complement', 'unit'].map((field) => [field, {
        ...base.textStyles[field],
        fontFamily: state.descriptionFont === 'auto' ? undefined : state.descriptionFont,
      }])),
      price: { ...base.textStyles.price, fontFamily: state.priceFont },
    },
  }), [base, boxes.contentBox.x, boxes.contentBox.y, boxes.contentBox.width, boxes.contentBox.height,
    boxes.priceBox.x, boxes.priceBox.y, boxes.priceBox.width, boxes.priceBox.height,
    state.showCurrency, state.showHeader, title, state.descriptionFont, state.priceFont, model.headerFooterStyle])
  const products = useMemo(() => Array.from({ length: format.postersPerSheet }, (_, index) => ({
    ...state.product,
    description: state.showDescription ? state.product.description : '',
    subdescription: state.showDescription ? state.product.subdescription : '',
    complement: state.showDescription ? state.product.complement : '',
    unit: state.showDescription ? state.product.unit : '',
    price: state.showPrice ? money(state.product.price) : '',
    id: 'free-editor-product-' + index,
  })), [format.postersPerSheet, state.product, state.showDescription, state.showPrice])
  const layouts = useMemo(() => createPosterLayouts(products, template, format, measure), [products, template, format, measure])
  const extras = (state.extras || []).map((extra) => ({ ...extra, ...boxWithinBounds(extra) }))
  const styleVars = {
    '--poster-background': palette.background,
    '--poster-text-color': resolveReadableTextColor(palette.background, palette.text),
    '--poster-price-color': resolveReadablePriceColor(palette.background, palette.price),
    '--poster-header-color': model.headerFooterStyle === 'header-transparente' ? 'transparent' : model.header,
    '--poster-header-text-color': resolveReadableHeaderTextColor(model.headerFooterStyle === 'header-transparente' ? palette.background : model.header, palette.header),
    '--poster-description-font-family': state.descriptionFont === 'auto' ? '"Burbank Big Cd Bk", Impact, sans-serif' : state.descriptionFont,
    '--poster-price-font-family': state.priceFont,
  }

  useEffect(() => {
    document.title = 'Editor Livre de Cartazes de Oferta | Ofertamática'
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.href = 'https://ofertamatica.com.br/editor-livre/'
  }, [])
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setSaved(true) } catch { setSaved(false) }
  }, [state])
  useEffect(() => () => dragCleanup.current?.(), [])

  function update(field, value) { setState((current) => ({ ...current, [field]: value })) }
  function updateProduct(field, value) {
    setState((current) => ({ ...current, product: { ...current.product, [field]: value } }))
  }
  function updateColor(field, value) {
    setState((current) => ({
      ...current,
      colors: { ...(current.colors || { background: model.background, text: model.text, price: model.price, header: model.headerText }), [field]: value },
    }))
  }
  function selectModel(id) {
    const next = POSTER_MODEL_PRESETS.find((item) => item.id === id)
    if (!next) return
    setState((current) => ({
      ...current, modelId: next.id, colors: null, showHeader: true,
      headerText: next.label || '', boxes: null,
    }))
    setSelected('contentBox')
  }
  function changeFormat(id) {
    if (!ALLOWED_FORMATS.includes(id)) return
    setState((current) => ({ ...current, formatId: id, boxes: null }))
  }
  function changeBox(id, patch) {
    if (id === 'contentBox' || id === 'priceBox') {
      setState((current) => {
        const previous = current.boxes?.[id] || getDefaultTemplateForFormat(current.formatId)[id]
        return { ...current, boxes: { ...current.boxes, [id]: boxWithinBounds({ ...previous, ...patch }) } }
      })
    } else {
      setState((current) => ({ ...current, extras: current.extras.map((x) => x.id === id ? { ...x, ...boxWithinBounds({ ...x, ...patch }) } : x) }))
    }
  }
  function updateExtra(id, patch) {
    setState((current) => ({ ...current, extras: current.extras.map((x) => x.id === id ? { ...x, ...patch } : x) }))
  }
  function addText() {
    if (state.extras.length >= 12) return
    const id = 'extra-' + Date.now().toString(36)
    setState((current) => ({ ...current, extras: [...current.extras, { id, text: 'NOVO TEXTO', x: 18, y: 49, width: 64, height: 12, fontSizeMm: 8, fontFamily: 'Impact, sans-serif', color: '#111111' }] }))
    setSelected(id)
  }
  function beginDrag(id, mode, event) {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    event.preventDefault()
    event.stopPropagation()
    dragCleanup.current?.()
    const card = event.currentTarget.closest('.poster-card')
    if (!card) return
    const rect = card.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    setSelected(id)
    const source = id === 'contentBox' || id === 'priceBox' ? boxes[id] : extras.find((x) => x.id === id)
    if (!source) return
    const startX = event.clientX
    const startY = event.clientY
    const pointerId = event.pointerId
    const move = (e) => {
      if (e.pointerId !== pointerId) return
      e.preventDefault()
      const deltaX = ((e.clientX - startX) / rect.width) * 100
      const deltaY = ((e.clientY - startY) / rect.height) * 100
      changeBox(id, mode === 'move'
        ? { x: round(source.x + deltaX), y: round(source.y + deltaY) }
        : { width: round(source.width + deltaX), height: round(source.height + deltaY) })
    }
    const stop = (e) => {
      if (e.pointerId !== pointerId) return
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      dragCleanup.current = null
    }
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    dragCleanup.current = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }
  async function print(mode) {
    if (isPreprinted && !state.showDescription && !state.showPrice && !extras.length) {
      setPrintHint('Este modelo não possui elementos para imprimir.')
      return
    }
    setPrintHint(mode === 'pdf' ? 'Na janela de impressão, selecione “Salvar como PDF”.' : 'Use escala 100% e ative os gráficos de fundo para conservar as cores.')
    try { await document.fonts?.ready } catch { /* Mantém impressão mesmo com fonte indisponível. */ }
    let page = document.getElementById('ofertamatica-free-page-style')
    if (!page) {
      page = document.createElement('style')
      page.id = 'ofertamatica-free-page-style'
      document.head.appendChild(page)
    }
    page.textContent = '@page { size: ' + format.widthMm + 'mm ' + format.heightMm + 'mm; margin: 0; }'
    document.body.classList.add('free-poster-printing')
    const cleanup = () => {
      document.body.classList.remove('free-poster-printing')
      document.getElementById('ofertamatica-free-page-style')?.remove()
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.requestAnimationFrame(() => {
      try { window.print() } catch { cleanup(); setPrintHint('Não foi possível abrir a impressão neste navegador.') }
    })
  }
  const chosenExtra = extras.find((x) => x.id === selected)
  const chosenBox = selected === 'contentBox' || selected === 'priceBox' ? boxes[selected] : chosenExtra
  return (
    <main className="free-poster-editor" style={styleVars}>
      <header className="free-editor-top">
        <div>
          <span className="free-editor-kicker">PERSONALIZAÇÃO AVANÇADA · GRÁTIS</span>
          <h1>Editor livre de placas</h1>
          <p>Edite seus cartazes como no painel de gestão: mova caixas, ajuste tamanhos, crie textos e imprima.</p>
        </div>
        <div className="free-editor-top-actions">
          <button type="button" className="free-editor-guide-trigger" onClick={showGuide}>? Como usar o editor</button>
          <span aria-live="polite">{saved ? '✓ Projeto salvo neste dispositivo' : 'Projeto em edição'}</span>
          <button type="button" onClick={() => {
            if (!window.confirm('Restaurar o editor livre? Os ajustes deste projeto serão perdidos.')) return
            setState(initial()); setSelected('contentBox')
          }}>Restaurar</button>
          <a href="/">Gerador rápido ↗</a>
        </div>
      </header>
      <div className="free-editor-layout">
        <section className="free-editor-controls" aria-label="Controles do cartaz">
          <details id="guia-editor-livre" className="free-editor-quick-guide" onToggle={(event) => { if (!event.currentTarget.open) setGuideFocus('') }}>
            <summary><span>Como usar o Editor livre?</span><small>Mini tutorial · 4 passos (1 minuto)</small></summary>
            <p className="free-guide-intro">Clique em “Ver controle” para localizar cada parte do editor na própria tela.</p>
            <ol className="free-guide-steps">
              {FREE_EDITOR_TUTORIAL.map((step, index) => (
                <li key={step.title}>
                  <span aria-hidden="true">{index + 1}</span>
                  <div><strong>{step.title}</strong><p>{step.text}</p>
                    <button type="button" aria-label={`Ver controle: ${step.title}`} onClick={() => focusGuide(step.target)}>Ver controle →</button>
                  </div>
                </li>
              ))}
            </ol>
          </details>
          <div className="free-editor-control-heading"><h2>Personalizar cartaz</h2><span>1. Configure</span></div>
          <label className="free-editor-field" data-guide-section="format" data-guide-focused={guideFocus === 'format' ? 'true' : undefined}><span>Formato de impressão</span>
            <select value={state.formatId} onChange={(event) => changeFormat(event.target.value)}>
              {POSTER_FORMAT_OPTIONS.filter((x) => ALLOWED_FORMATS.includes(x.id)).map((x) => <option key={x.id} value={x.id}>{x.shortLabel} · {x.paper}</option>)}
            </select></label>
          <label className="free-editor-field"><span>Modelo visual</span>
            <select value={model.id} onChange={(event) => selectModel(event.target.value)}>
              {POSTER_MODEL_PRESETS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select></label>
          <div className="free-editor-fields-grid" data-guide-section="product" data-guide-focused={guideFocus === 'product' ? 'true' : undefined}>
            <label className="free-editor-field"><span>Nome do produto</span><input value={state.product.description} maxLength="65" onChange={(e) => updateProduct('description', e.target.value.toLocaleUpperCase('pt-BR'))} /></label>
            <label className="free-editor-field"><span>Marca / detalhe</span><input value={state.product.subdescription} maxLength="65" onChange={(e) => updateProduct('subdescription', e.target.value.toLocaleUpperCase('pt-BR'))} /></label>
            <label className="free-editor-field"><span>Complemento</span><input value={state.product.complement} maxLength="65" onChange={(e) => updateProduct('complement', e.target.value.toLocaleUpperCase('pt-BR'))} /></label>
            <label className="free-editor-field"><span>Unidade / volume</span><input value={state.product.unit} maxLength="30" onChange={(e) => updateProduct('unit', e.target.value.toLocaleUpperCase('pt-BR'))} /></label>
          </div>
          <label className="free-editor-field free-editor-price-input"><span>Preço (R$)</span>
            <input inputMode="decimal" value={state.product.price} onChange={(e) => updateProduct('price', money(e.target.value))} placeholder="Ex.: 9,99" /></label>
          <div className="free-editor-checks">
            <label><input type="checkbox" checked={state.showDescription} onChange={(e) => update('showDescription', e.target.checked)} /> Mostrar descrição</label>
            <label><input type="checkbox" checked={state.showPrice} onChange={(e) => update('showPrice', e.target.checked)} /> Mostrar preço</label>
            <label><input type="checkbox" checked={state.showCurrency} onChange={(e) => update('showCurrency', e.target.checked)} /> Mostrar R$</label>
          </div>
          <details className="free-editor-disclosure" open>
            <summary>Cabeçalho e cores</summary>
            <label className="free-editor-field"><span>Texto do cabeçalho</span><input maxLength="28" value={state.headerText} disabled={!state.showHeader} onChange={(e) => update('headerText', e.target.value.toLocaleUpperCase('pt-BR'))} /></label>
            <label className="free-editor-checkbox"><input type="checkbox" checked={state.showHeader} onChange={(e) => update('showHeader', e.target.checked)} /> Exibir cabeçalho</label>
            <div className="free-editor-color-grid">{[
              ['background', 'Fundo'], ['text', 'Texto'], ['price', 'Preço'], ['header', 'Título']
            ].map(([id,label]) => <label key={id}><span>{label}</span><input type="color" value={palette[id]} onChange={(e) => updateColor(id, e.target.value)} /></label>)}</div>
          </details>
          <details className="free-editor-disclosure">
            <summary>Tipografia</summary>
            <label className="free-editor-field"><span>Fonte da descrição</span><select value={state.descriptionFont} onChange={(e) => update('descriptionFont', e.target.value)}>{FONT_CHOICES.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
            <label className="free-editor-field"><span>Fonte do preço</span><select value={state.priceFont} onChange={(e) => update('priceFont', e.target.value)}>{PRICE_FONTS.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
          </details>
          <section className="free-editor-box-control" data-guide-section="boxes" data-guide-focused={guideFocus === 'boxes' ? 'true' : undefined}>
            <div className="free-editor-control-heading"><h3>Caixas e posições</h3><span>2. Arraste</span></div>
            <div className="free-editor-box-tabs">
              <button type="button" className={selected === 'contentBox' ? 'active' : ''} onClick={() => setSelected('contentBox')}>Descrição</button>
              <button type="button" className={selected === 'priceBox' ? 'active' : ''} onClick={() => setSelected('priceBox')}>Preço</button>
              <button type="button" onClick={addText} disabled={extras.length >= 12}>+ Texto</button>
            </div>
            {extras.length ? <div className="free-extra-picker" aria-label="Caixas extras">{extras.map((item, index) => <button key={item.id} type="button" className={selected === item.id ? 'active' : ''} onClick={() => setSelected(item.id)}>Texto {index+1}</button>)}</div> : null}
            {chosenBox ? (
              <>
                <p className="free-editor-help">Arraste a caixa na prévia. Use o círculo no canto inferior direito para redimensionar, ou ajuste os números abaixo.</p>
                <div className="free-editor-number-grid">
                  {[['x','X (%)'],['y','Y (%)'],['width','Largura (%)'],['height','Altura (%)']].map(([field,label])=><NumericSetting key={field} label={label} value={chosenBox[field]} min={field === 'width' ? 8 : field === 'height' ? 6 : 0} onChange={(value)=>changeBox(selected,{[field]:value})}/>)}
                </div>
                {chosenExtra ? (
                  <div className="free-editor-extra-edit">
                    <label className="free-editor-field"><span>Texto adicional</span><textarea rows={2} maxLength={90} value={chosenExtra.text} onChange={(e)=>updateExtra(selected,{text:e.target.value})} /></label>
                    <NumericSetting label="Tamanho da fonte (mm)" value={chosenExtra.fontSizeMm || 8} min={2} max={40} onChange={(v)=>updateExtra(selected,{fontSizeMm:clamp(v,2,40)})}/>
                    <label className="free-editor-field"><span>Fonte</span><select value={chosenExtra.fontFamily || 'Impact, sans-serif'} onChange={(e)=>updateExtra(selected,{fontFamily:e.target.value})}>{FONT_CHOICES.filter(x=>x.value!=='auto').map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
                    <label className="free-editor-color-extra"><span>Cor do texto</span><input type="color" value={chosenExtra.color || '#111111'} onChange={(e)=>updateExtra(selected,{color:e.target.value})}/></label>
                    <button className="free-editor-danger" type="button" onClick={()=>{setState(current=>({...current,extras:current.extras.filter(x=>x.id!==selected)}));setSelected('contentBox')}}>Excluir esta caixa</button>
                  </div>
                ) : <button className="free-editor-small-reset" type="button" onClick={()=>changeBox(selected,getDefaultTemplateForFormat(state.formatId)[selected])}>Restaurar posição desta caixa</button>}
              </>
            ) : null}
          </section>
        </section>
        <section className="free-editor-canvas" aria-label="Área de edição e impressão">
          <div className="free-canvas-heading">
            <div><h2>Prévia editável</h2><span>{format.paperLabel} · {format.postersPerSheet} {format.postersPerSheet === 1 ? 'cartaz' : 'cartazes'} por folha</span></div>
            <span className="free-editor-ready">Visualização em tempo real</span>
          </div>
          <FreeBoard format={format} template={template} products={products} layouts={layouts}
            extras={extras} selected={selected} onSelect={()=>{}}
            onStartBoxDrag={beginDrag} onStartExtraDrag={beginDrag} />
          <div className="free-canvas-bottom" data-guide-section="output" data-guide-focused={guideFocus === 'output' ? 'true' : undefined}>
            <p>O mesmo layout é usado na impressão. Os contornos de edição e os controles de arrastar não aparecem no papel.</p>
            <div className="free-editor-print-buttons">
              <button type="button" onClick={()=>print('pdf')}>Salvar PDF</button>
              <button type="button" className="free-editor-print-main" onClick={()=>print('print')}>Revisar e imprimir</button>
            </div>
            {printHint ? <span role="status" className="free-print-hint">{printHint}</span> : null}
          </div>
        </section>
      </div>
      <div className="free-editor-print-root" aria-hidden="true">
        <PosterSheet format={format} products={products} template={template} layoutPlans={layouts} extraBoxes={extras} showBackground />
      </div>
    </main>
  )
}