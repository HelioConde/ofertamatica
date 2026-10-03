const PRIMARY_POSTER_FONT = '"Burbank Big Cd Bk"'
const ACCENT_POSTER_FONT = 'Impact, "Arial Black", sans-serif'
const ACCENT_PATTERN = /[À-ÖØ-öø-ÿ]/

function hasAccent(text) {
  return ACCENT_PATTERN.test(String(text || ''))
}

function fontFamilyForText(text) {
  return hasAccent(text) ? ACCENT_POSTER_FONT : PRIMARY_POSTER_FONT
}


function boxStyle(box) {
  return { left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%` }
}

function plannedFieldStyle(line, box) {
  return {
    left: `${line.x}%`,
    top: `${line.y}%`,
    width: `${line.width}%`,
    height: `${line.height}%`,
    fontSize: `${line.fontSizeMm}mm`,
    fontWeight: line.style.fontWeight,
    fontFamily: fontFamilyForText(line.text),
    lineHeight: line.style.lineHeight,
    letterSpacing: `${line.style.letterSpacing}mm`,
    textAlign: box.alignX || 'center',
    overflow: 'visible',
    boxSizing: 'border-box',
  }
}

function ContentBox({ plan, box, showDebug, editable, onBoxPointerDown }) {
  return (
    <div className={`poster-layout-box poster-content-box ${showDebug ? 'poster-layout-box-debug' : ''}`} style={boxStyle(box)} data-layout-box="contentBox" onPointerDown={editable ? (event) => onBoxPointerDown?.('contentBox', 'move', event) : undefined}>
      <div className="poster-content-stack">
        {plan.content.lines.map((line) => (
          <div className={`poster-field poster-planned-field poster-field-${line.field}`} key={line.field} style={plannedFieldStyle(line, box)}>{line.text}</div>
        ))}
      </div>
      {showDebug ? <span className="poster-box-label">contentBox</span> : null}
      {editable ? <button type="button" className="poster-resize-handle" aria-label="Redimensionar contentBox" onPointerDown={(event) => onBoxPointerDown?.('contentBox', 'resize', event)} /> : null}
    </div>
  )
}

function numericPrice(value) {
  const raw = String(value || '').trim().replace(/^R\$\s*/i, '').replace(/\s/g, '')
  if (!raw) return 0
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw
  const number = Number(normalized.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(number) ? number : 0
}

function OfferMeta({ product, template }) {
  const mode = template.offerMode || 'standard'
  if (mode === 'standard') return null

  if (mode === 'de-por' && product.regularPrice) {
    const regular = numericPrice(product.regularPrice)
    const offer = numericPrice(product.price)
    const discount = regular > offer && offer > 0
      ? Math.round(((regular - offer) / regular) * 100)
      : 0

    return (
      <div className="poster-offer-meta poster-offer-meta-depor">
        <span>DE <s>R$ {product.regularPrice}</s></span>
        <b>POR</b>
        {discount > 0 && discount < 100 ? <small className="poster-discount-badge">{discount}% OFF</small> : null}
      </div>
    )
  }

  if (mode === 'leve-por' && product.offerQuantity) {
    return (
      <div className="poster-offer-meta poster-offer-meta-bundle">
        <b>LEVE {product.offerQuantity} POR</b>
        {product.eachPrice ? <small>OU R$ {product.eachPrice} CADA</small> : null}
      </div>
    )
  }

  if (mode === 'atacado-varejo' && product.wholesalePrice) {
    return (
      <div className="poster-offer-meta poster-offer-meta-wholesale">
        <span>ATACADO{product.wholesaleQuantity ? ` · A PARTIR DE ${product.wholesaleQuantity} UN.` : ''}</span>
        <b>R$ {product.wholesalePrice}</b>
        <small>VAREJO</small>
      </div>
    )
  }

  if (mode === 'club-app' && product.regularPrice) {
    return (
      <div className="poster-offer-meta poster-offer-meta-club">
        <span>CLUBE / APP</span>
        <b>PREÇO EXCLUSIVO</b>
        <small>Normal R$ {product.regularPrice}</small>
      </div>
    )
  }

  if (mode === 'second-unit' && product.secondUnitPrice) {
    return (
      <div className="poster-offer-meta poster-offer-meta-second-unit">
        <span>2ª UNIDADE</span>
        <b>R$ {product.secondUnitPrice}</b>
        <small>1ª UNIDADE ABAIXO</small>
      </div>
    )
  }

  return null
}

function OfferFooter({ template }) {
  const validity = String(template.validityText || '').trim()
  const limit = String(template.limitText || '').trim()
  if (!validity && !limit) return null

  return (
    <div className="poster-offer-footer">
      {validity ? <span>{validity}</span> : null}
      {limit ? <span>{limit}</span> : null}
    </div>
  )
}

function PriceBox({ plan, box, showDebug, editable, onBoxPointerDown, showCurrency = true }) {
  return (
    <div className={`poster-layout-box poster-price-box ${showDebug ? 'poster-layout-box-debug' : ''}`} style={boxStyle(box)} data-layout-box="priceBox" onPointerDown={editable ? (event) => onBoxPointerDown?.('priceBox', 'move', event) : undefined}>
      <div className="poster-price-content">
        {showCurrency ? <span className="poster-currency-inline">R$</span> : null}
        <div className="poster-field poster-planned-field poster-field-price" style={plannedFieldStyle(plan.price, box)}>{plan.price.text || '\u00a0'}</div>
      </div>
      {showDebug ? <span className="poster-box-label">priceBox</span> : null}
      {editable ? <button type="button" className="poster-resize-handle" aria-label="Redimensionar priceBox" onPointerDown={(event) => onBoxPointerDown?.('priceBox', 'resize', event)} /> : null}
    </div>
  )
}

export function PosterBackground({ template, widthMm, heightMm, className = 'poster-background-layer' }) {
  if (!template.backgroundImage || !template.backgroundVisible) return null
  const aspect = widthMm / heightMm
  const quarterTurn = template.backgroundRotation === 90 || template.backgroundRotation === 270
  const dimensions = quarterTurn ? { width: `${100 / aspect}%`, height: `${100 * aspect}%` } : { width: '100%', height: '100%' }
  return (
    <div className={className} aria-hidden="true">
      <img src={template.backgroundImage} alt="" style={{ ...dimensions, opacity: template.backgroundOpacity, objectFit: template.backgroundFit, objectPosition: `${template.backgroundPositionX} ${template.backgroundPositionY}`, transform: `translate(-50%, -50%) rotate(${template.backgroundRotation}deg)` }} />
    </div>
  )
}

export default function PosterCard({ product, format, template, layoutPlan, inverted = false, showBackground = false, showLayoutDebug = false, editable = false, onBoxPointerDown, badgeLabel, selected = false, onSelect }) {
  const plan = layoutPlan
  return (
    <article className={`poster-card ${inverted ? 'poster-card-inverted' : ''} ${selected ? 'poster-card-selected' : ''}`} data-product-id={product.id} onClick={onSelect}>
      <div className="poster-card-layers">
        {badgeLabel ? <span className="poster-preview-badge">{badgeLabel}</span> : null}
        <div className="ofertamatica-poster-background" aria-hidden="true">
          {template.headerImage ? (
            <div className="ofertamatica-custom-header">
              <img src={template.headerImage} alt="" />
            </div>
          ) : (
            <div className={`ofertamatica-offer-ribbon header-${template.headerStyle || 'band'}`}><b>{template.headerText || 'OFERTA'}</b></div>
          )}
          <div className="ofertamatica-inner-frame" />
          <div className="ofertamatica-poster-signature">OFERTAMÁTICA</div>
        </div>
        {showBackground ? <PosterBackground template={template} widthMm={format.widthMm / format.columns} heightMm={format.heightMm / format.rows} /> : null}
        {showLayoutDebug ? <div className="poster-safe-area" style={{ inset: `${template.safeArea}%` }} aria-hidden="true" /> : null}
        <ContentBox plan={plan} box={template.contentBox} showDebug={showLayoutDebug} editable={editable} onBoxPointerDown={onBoxPointerDown} />
        <OfferMeta product={product} template={template} />
        <PriceBox plan={plan} box={template.priceBox} showDebug={showLayoutDebug} editable={editable} onBoxPointerDown={onBoxPointerDown} showCurrency={template.showCurrency} />
        {template.storeLogo ? <div className="poster-store-logo"><img src={template.storeLogo} alt="" /></div> : null}
        <OfferFooter template={template} />
      </div>
    </article>
  )
}
