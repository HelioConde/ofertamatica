import PriceValue from './PriceValue'

const PRIMARY_POSTER_FONT = '"Burbank Big Cd Bk"'
const ACCENT_POSTER_FONT = 'Impact, "Arial Black", sans-serif'
const ACCENT_PATTERN = /[À-ÖØ-öø-ÿ\u0300-\u036f]/

function fontFamilyForText(text, explicitFont) {
  if (explicitFont) return explicitFont
  const value = String(text || '')
  return ACCENT_PATTERN.test(value) || ACCENT_PATTERN.test(value.normalize('NFD'))
    ? ACCENT_POSTER_FONT
    : PRIMARY_POSTER_FONT
}

const APP_BOXES = [
  ['appTitleBox', 'appTitle', 'title'],
  ['appPriceBox', 'appPrice', 'appPrice'],
  ['appValidityBox', 'appValidity', 'validity'],
  ['appRegularLabelBox', 'appRegularLabel', 'regularLabel'],
  ['appRegularPriceBox', 'appRegularPrice', 'regularPrice'],
]

function styleFor(box, textStyle, text) {
  const alignX = { left: 'flex-start', center: 'center', right: 'flex-end' }[box.alignX] || 'center'
  const alignY = { top: 'flex-start', center: 'center', bottom: 'flex-end' }[box.alignY] || 'center'
  return {
    left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%`,
    '--app-font-min': `${textStyle.fontMin}mm`, '--app-font-max': `${textStyle.fontMax}mm`,
    '--app-scale': textStyle.scale || 1, '--app-align-x': alignX, '--app-align-y': alignY,
    fontFamily: fontFamilyForText(text, textStyle.fontFamily),
  }
}

export default function AppPosterCard({ product, template, editable, showLayoutDebug, onBoxPointerDown, badgeLabel, selected, onSelect }) {
  const paperStockMode = template.headerFooterStyle === 'preimpresso'
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
      {template.storeLogo && !paperStockMode ? <div className="poster-store-logo poster-store-logo-app"><img src={template.storeLogo} alt="" /></div> : null}
      {APP_BOXES.filter(([boxName]) => !paperStockMode || ['appTitleBox', 'appPriceBox'].includes(boxName)).map(([boxName, styleName, valueName]) => {
        const box = template[boxName]
        const textStyle = template.textStyles[styleName]
        return <div key={boxName} className={`poster-app-box poster-app-${styleName} ${showLayoutDebug ? 'poster-layout-box-debug' : ''}`} data-layout-box={boxName} style={styleFor(box, textStyle, values[valueName])} onPointerDown={editable ? (event) => onBoxPointerDown?.(boxName, 'move', event) : undefined}>
          <span>{['appPrice', 'regularPrice'].includes(valueName) ? <PriceValue value={values[valueName]} /> : (values[valueName] || '\u00a0')}</span>
          {showLayoutDebug ? <small>{boxName}</small> : null}
          {editable ? <button type="button" className="poster-resize-handle" aria-label={`Redimensionar ${boxName}`} onPointerDown={(event) => onBoxPointerDown?.(boxName, 'resize', event)} /> : null}
        </div>
      })}
    </article>
  )
}
