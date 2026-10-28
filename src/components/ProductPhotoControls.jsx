import { useRef, useState } from 'react'
import { PHOTO_LAYOUTS, safeProductImageSrc } from '../poster-engine/productPhotoLayout'
import { optimizePosterImage } from '../utils/optimizePosterImage'

export default function ProductPhotoControls({ selectedProduct, photoLayout = 'off', formatId, onLayoutChange, onImageChange }) {
  const fileInput = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const unsupported = formatId === 'A4X8' || formatId === 'A4X2_APP'
  const productName = selectedProduct
    ? [selectedProduct.description, selectedProduct.subdescription].filter(Boolean).join(' ')
    : ''

  async function upload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !selectedProduct || busy) return
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const { dataUrl } = await optimizePosterImage(file, { kind: 'product' })
      onImageChange(selectedProduct.id, dataUrl)
      if (photoLayout === 'off') onLayoutChange('left')
      setNotice('Imagem adicionada ao produto. Confira a prévia antes de imprimir.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a imagem.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="photo-poster-panel" aria-label="Fotos dos produtos">
      <div className="photo-poster-intro">
        <strong>Placas com imagem do produto</strong>
        <p>Selecione um produto, envie uma foto e escolha como ela aparece no cartaz. A imagem fica no seu navegador.</p>
      </div>

      <div className="photo-poster-selected">
        <span>Produto selecionado</span>
        <strong>{productName || 'Gere e selecione um produto'}</strong>
      </div>
      {unsupported ? (
        <p className="photo-poster-warning" role="status">Fotos estão disponíveis nos cartazes A4, A5, A3, SRA3 e A4 divididos em 2 ou 4. Troque o formato para usar fotos.</p>
      ) : null}

      <input type="file" ref={fileInput} hidden accept="image/png,image/jpeg,image/webp" onChange={upload} aria-label="Escolher imagem do produto" />
      {safeProductImageSrc(selectedProduct?.imageDataUrl) ? (
        <div className="photo-poster-uploaded">
          <img src={safeProductImageSrc(selectedProduct.imageDataUrl)} alt={`Imagem do produto ${productName}`} />
          <div>
            <strong>Foto adicionada</strong>
            <span>PNG, JPG ou WebP · processada localmente</span>
            <button type="button" onClick={() => { onImageChange(selectedProduct.id, ''); setNotice('Imagem removida da placa.') }}>Remover foto</button>
          </div>
        </div>
      ) : null}
      <button type="button" className="photo-poster-upload-button" disabled={!selectedProduct || busy || unsupported} onClick={() => fileInput.current?.click()}>
        {busy ? 'Preparando foto…' : selectedProduct?.imageDataUrl ? 'Trocar foto do produto' : 'Adicionar foto do produto'}
      </button>

      <fieldset className="photo-poster-styles" disabled={unsupported}>
        <legend>Estilo do cartaz</legend>
        {Object.entries(PHOTO_LAYOUTS).map(([id, layout]) => (
          <button type="button" key={id} className={'photo-style-option' + (photoLayout === id ? ' active' : '')}
            aria-pressed={photoLayout === id} onClick={() => onLayoutChange(id)}>
            <span className={'photo-style-mini photo-style-mini-' + id} aria-hidden="true">
              <i className="photo-sample-image" /><i className="photo-sample-text" /><i className="photo-sample-price" />
            </span>
            <span>{layout.label}</span>
          </button>
        ))}
      </fieldset>
      <button type="button" className="photo-poster-standard" onClick={() => onLayoutChange('off')} aria-pressed={photoLayout === 'off'}>
        {photoLayout === 'off' ? '✓ Placa tradicional, sem foto' : 'Voltar à placa tradicional'}
      </button>
      <p className="photo-poster-explainer">A posição escolhida vale para todos os produtos com foto. Produtos sem imagem continuam com o layout tradicional. O preço permanece em destaque.</p>
      {error ? <p className="photo-poster-error" role="alert">{error}</p> : null}
      {notice ? <p className="photo-poster-notice" role="status">{notice}</p> : null}
    </section>
  )
}
