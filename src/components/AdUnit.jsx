import { useEffect } from 'react'

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-9514218545388169'
const ADSENSE_SLOT = import.meta.env.VITE_ADSENSE_SLOT || ''

export default function AdUnit({ placement = 'content' }) {
  useEffect(() => {
    if (!ADSENSE_SLOT) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // Auto Ads can still work through the global AdSense script.
    }
  }, [placement])

  return (
    <div className="oferta-ad-unit" data-placement={placement} aria-label="Publicidade">
      <span className="oferta-ad-label">PUBLICIDADE</span>
      {ADSENSE_SLOT ? (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="oferta-ad-fallback" aria-hidden="true" />
      )}
    </div>
  )
}
