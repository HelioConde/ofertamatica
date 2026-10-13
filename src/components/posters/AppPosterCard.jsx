import PriceValue from './PriceValue'
import { POSTER_DESCRIPTION_FONT } from '../../config/posterTypography.js'

// Evita a antiga troca automática para Impact em MAÇÃ, PÃO e AÇAÍ.
// Respeita fontes personalizadas quando foram escolhidas pelo usuário.
function fontFamilyForText(_text, explicitFont) {
  return explicitFont || POSTER_DESCRIPTION_FONT
}

const APP_BOXES = [
  ['appTitleBox', 'appTitle', 'title'],
  ['appPriceBox', 'appPrice', 'appPrice'],
  ['appValidityBox', 'appValidity', 'validity'],
  ['appRegularLabelBox', 'appRegularLabel', 'regularLabel'],
  ['appRegularPriceBox', 'appRegularPrice', 'regularPrice'],
]

// A medida fisica de cada meio-cartaz e fixa; escala apenas textos longos.
// Os nomes curtos e precos comuns usam o maior corpo disponivel.
function scaleForContent(field, text, scale = 1) {
  const value = String(text || '')
  if (field === 'appTitle') {
    const lines = value.split('\n').filter(Boolean)
    const longest = Math.max(1, ...lines.map((line) => line.trim().length))
    return scale * Math.max(0.46, Math.min(1, 25 / longest, 4 / Math.max(lines.length, 1)))
  }
  if (field === 'appPrice' || field === 'appRegularPrice') {
    const integer = value.replace(/^R\$\s*/i, '').split(/[,.]/)[0].replace(/\D/g, '')
    return scale * Math.max(0.58, Math.min(1, 3.2 / Math.max(integer.length, 1)))
  }
  return scale
}

function styleFor(box, textStyle, text, field) {
  const alignX = { left: 'flex-start', center: 'center', right: 'flex-end' }[box.alignX] || 'center'
  const alignY = { top: 'flex-start', center: 'center', bottom: 'flex-end' }[box.alignY] || 'center'
  return {
    left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%`,
    '--app-font-min': `${textStyle.fontMin}mm`, '--app-font-max': `${textStyle.fontMax}mm`,
    '--app-scale': scaleForContent(field, text, textStyle.scale ?? 1), '--app-align-x': alignX, '--app-align-y': alignY,
    fontFamily: fontFamilyForText(text, textStyle.fontFamily),
  }
}

export default function AppPosterCard({ product, template, editable, showLayoutDebug, onBoxPointerDown, badgeLabel, selected, onSelect, backgroundOnly = false }) {
  const paperStockMode = template.headerFooterStyle === 'preimpresso'
  const noFooterMode = paperStockMode || template.headerFooterStyle === 'header-transparente'
  const headerText = template.headerText || 'OFERTA APP'
  const headerLengthClass = headerText.length > 15 ? 'header-text-xlong' : headerText.length > 10 ? 'header-text-long' : 'header-text-short'
  const values = {
    title: [product.description, product.subdescription, product.complement, product.unit].filter(Boolean).join('\n'),
    appPrice: product.price ? `${template.showCurrency && !template.currencyFromBackground ? 'R$ ' : ''}${product.price}` : '',
    validity: product.validity ? (product.validity.toLocaleUpperCase('pt-BR').startsWith('OFERTA') ? product.validity : `OFERTA VÁLIDA ATÉ ${product.validity}`) : template.appValidityText,
    regularLabel: product.regularLabel || template.appRegularLabel,
    regularPrice: product.regularPrice ? `${template.showCurrency ? 'R$ ' : ''}${product.regularPrice}` : '',
  }
  return (
    <article className={`poster-card poster-app-card ofertamatica-app-card ${paperStockMode ? 'poster-app-card-paper-stock' : ''} ${selected ? 'poster-card-selected' : ''}`} data-product-id={product.id} onClick={onSelect}>
      {badgeLabel ? <span className="poster-preview-badge">{badgeLabel}</span> : null}
      {!paperStockMode ? <div className={`ofertamatica-app-background poster-frame-${template.headerFooterStyle || 'curva-simples'}`} aria-hidden="true">
        {template.headerImage ? (
          <div className="ofertamatica-custom-header ofertamatica-custom-header-app">
            <img src={template.headerImage} alt="" />
          </div>
        ) : (
          <div className={`ofertamatica-app-ribbon header-${template.headerStyle || 'retail'} ${headerLengthClass}`}><span className="ofertamatica-header-mark" aria-hidden="true"><i /><i /></span><b>{headerText}</b></div>
        )}
        <div className="ofertamatica-app-frame" />
        <div className="ofertamatica-footer-decoration" />
        <div className="ofertamatica-app-signature">OFERTAMÁTICA</div>
      </div> : null}
      {template.storeLogo && !noFooterMode ? <div className="poster-store-logo poster-store-logo-app"><img src={template.storeLogo} alt="" /></div> : null}
      {APP_BOXES.filter(([boxName]) => !backgroundOnly && (!noFooterMode || ['appTitleBox', 'appPriceBox'].includes(boxName))).map(([boxName, styleName, valueName]) => {
        const box = template[boxName]
        const textStyle = template.textStyles[styleName]
        return <div key={boxName} className={`poster-app-box poster-app-${styleName} ${showLayoutDebug ? 'poster-layout-box-debug' : ''}`} data-layout-box={boxName} style={styleFor(box, textStyle, values[valueName], styleName)} onPointerDown={editable ? (event) => onBoxPointerDown?.(boxName, 'move', event) : undefined}>
          <span>{['appPrice', 'regularPrice'].includes(valueName) ? <PriceValue value={values[valueName]} /> : (values[valueName] || '\u00a0')}</span>
          {showLayoutDebug ? <small>{boxName}</small> : null}
          {editable ? <button type="button" className="poster-resize-handle" aria-label={`Redimensionar ${boxName}`} onPointerDown={(event) => onBoxPointerDown?.(boxName, 'resize', event)} /> : null}
        </div>
      })}
    </article>
  )
}
