import '../../styles/posters.css'
import PosterCard, { PosterBackground } from './PosterCard'
import AppPosterCard from './AppPosterCard'
import { createBackgroundSlots } from '../../poster-engine/backgroundPrinting'

export default function PosterSheet({ format, products, template, layoutPlans, showBackground = false, showLayoutDebug = false, editable = false, onBoxPointerDown, className = '', showBadges = false, startIndex = 0, selectedProductId = null, onSelectProduct, backgroundOnly = false }) {
  const slots = backgroundOnly ? createBackgroundSlots(format) : Array.from({ length: format.postersPerSheet }, (_, index) => products[index] || null)
  const paperStockMode = template.headerFooterStyle === 'preimpresso'

  return (
    <section
      className={`poster-sheet ${format.specialLayout === 'app-offer' ? 'poster-sheet-app' : ''} ${paperStockMode ? 'poster-sheet-paper-stock' : ''} ${backgroundOnly ? 'poster-sheet-background-only' : ''} ${format.backgroundScope === 'sheet' && showBackground ? 'poster-sheet-has-background' : ''} ${className}`.trim()}
      aria-label={`Folha ${format.label}`}
      data-poster-format={format.id}
      style={{
        '--sheet-width': `${format.widthMm}mm`,
        '--sheet-height': `${format.heightMm}mm`,
        '--sheet-columns': format.columns,
        '--sheet-rows': format.rows,
      }}
    >
      {format.backgroundScope === 'sheet' && showBackground && !paperStockMode ? <PosterBackground template={template} widthMm={format.widthMm} heightMm={format.heightMm} className="poster-sheet-background" /> : null}
      {slots.map((product, index) => (
        <div className={`poster-slot ${product ? '' : 'poster-slot-empty'}`} key={product?.id || `empty-${index}`}>
          {product ? format.specialLayout === 'app-offer' ? (
            <AppPosterCard product={product} template={template} backgroundOnly={backgroundOnly} editable={editable} showLayoutDebug={showLayoutDebug} onBoxPointerDown={onBoxPointerDown} badgeLabel={showBadges ? startIndex + index + 1 : null} selected={product.id === selectedProductId} onSelect={onSelectProduct ? () => onSelectProduct(product.id) : undefined} />
          ) : (
            <PosterCard
              product={product}
              backgroundOnly={backgroundOnly}
              format={format}
              template={template}
              layoutPlan={layoutPlans?.[product.id]}
              showBackground={showBackground && !paperStockMode && format.backgroundScope === 'card'}
              showLayoutDebug={showLayoutDebug}
              editable={editable}
              onBoxPointerDown={onBoxPointerDown}
              inverted={format.invertedSlots.includes(index)}
              badgeLabel={showBadges ? startIndex + index + 1 : null}
              selected={product.id === selectedProductId}
              onSelect={onSelectProduct ? () => onSelectProduct(product.id) : undefined}
            />
          ) : null}
        </div>
      ))}
    </section>
  )
}
