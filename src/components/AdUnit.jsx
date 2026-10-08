import { useEffect, useRef, useState } from 'react'

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-9514218545388169'
const ADSENSE_SLOTS = {
  'seo-content': '5483033524',
  'format-grid': '7286894770',
}


export function AdUnit({ placement = 'content' }) {
  const slot = ADSENSE_SLOTS[placement]
    || (placement.startsWith('seo-') ? ADSENSE_SLOTS['seo-content'] : '')
    || ''
  const isMobileAd = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 700px)').matches
  const mobileAdFormat = isMobileAd ? 'horizontal' : 'auto'
  const adRef = useRef(null)
  const [adState, setAdState] = useState(slot ? 'pending' : 'hidden')

  useEffect(() => {
    if (!slot) {
      setAdState('hidden')
      return undefined
    }

    setAdState('pending')
    const node = adRef.current
    const syncStatus = () => {
      const status = node?.getAttribute('data-ad-status')
      if (status === 'filled') setAdState('filled')
      if (status === 'unfilled') setAdState('hidden')
      return status
    }

    const observer = typeof MutationObserver !== 'undefined' && node
      ? new MutationObserver(syncStatus)
      : null
    observer?.observe(node, { attributes: true, attributeFilter: ['data-ad-status'] })

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // O elemento pode já ter sido processado pelo AdSense em desenvolvimento.
    }

    // Não descartar anúncios ainda pendentes por um cronômetro arbitrário.
    // O próprio AdSense sinaliza o preenchimento com data-ad-status.
    syncStatus()
    return () => {
      observer?.disconnect()
    }
  }, [placement, slot])

  if (!slot || adState === 'hidden') return null

  return (
    <aside className={`oferta-ad-unit ${adState === 'pending' ? 'is-pending' : 'is-filled'}`} data-placement={placement} aria-label="Publicidade" role="complementary">
      <span className="oferta-ad-label">PUBLICIDADE</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={isMobileAd
          ? { display: 'block', width: '100%', height: '100px', maxHeight: '100px' }
          : { display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={mobileAdFormat}
        data-full-width-responsive={isMobileAd ? 'false' : 'true'}
      />
    </aside>
  )
}

