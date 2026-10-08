import { useEffect, useRef, useState } from 'react'

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-9514218545388169'
const ADSENSE_SLOTS = {
  'seo-content': '5483033524',
  'format-grid': '7286894770',
}

// O script do AdSense é compartilhado entre os espaços e só é requisitado
// quando um anúncio está perto do viewport. Não alterar payload ou cliques.
let adsenseLoader = null
function loadAdsense() {
  if (adsenseLoader) return adsenseLoader
  adsenseLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-ofertamatica-adsense]')
    if (existing?.dataset.loaded === 'true') {
      resolve()
      return
    }
    const script = existing || document.createElement('script')
    script.addEventListener('load', () => { script.dataset.loaded = 'true'; resolve() }, { once: true })
    script.addEventListener('error', () => { adsenseLoader = null; script.remove(); reject(new Error('AdSense indisponível')) }, { once: true })
    if (!existing) {
      script.async = true
      script.crossOrigin = 'anonymous'
      script.dataset.ofertamaticaAdsense = 'true'
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(ADSENSE_CLIENT)
      document.head.appendChild(script)
    }
  })
  return adsenseLoader
}

export function AdUnit({ placement = 'content' }) {
  const slot = ADSENSE_SLOTS[placement]
    || (placement.startsWith('seo-') ? ADSENSE_SLOTS['seo-content'] : '')
    || ''
  const isMobileAd = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 700px)').matches
  const adRef = useRef(null)
  const outerRef = useRef(null)
  const [adState, setAdState] = useState(slot ? 'pending' : 'hidden')

  useEffect(() => {
    if (!slot) {
      setAdState('hidden')
      return undefined
    }

    const node = adRef.current
    const outer = outerRef.current
    if (!node || !outer) return undefined
    let disposed = false
    let started = false
    let idleHandle = null
    let idleByTimeout = false

    setAdState('pending')
    const syncStatus = () => {
      const status = node.getAttribute('data-ad-status')
      if (status === 'filled') setAdState('filled')
      else if (status === 'unfilled') setAdState('hidden')
    }
    const mutation = new MutationObserver(syncStatus)
    mutation.observe(node, { attributes: true, attributeFilter: ['data-ad-status'] })

    const startAd = () => {
      if (started || disposed) return
      started = true
      // Aguarde tempo ocioso antes de iniciar scripts de terceiros.
      const requestAd = () => {
        if (disposed || node.hasAttribute('data-adsbygoogle-status')) return
        loadAdsense().then(() => {
          if (disposed || !node.isConnected || node.hasAttribute('data-adsbygoogle-status')) return
          try { (window.adsbygoogle = window.adsbygoogle || []).push({}) }
          catch { /* O SDK pode ter processado o bloco em paralelo. */ }
        }).catch(() => {
          if (!disposed) setAdState('hidden')
        })
      }
      if ('requestIdleCallback' in window) {
        idleHandle = window.requestIdleCallback(requestAd, { timeout: 1800 })
      } else {
        idleByTimeout = true
        idleHandle = window.setTimeout(requestAd, 200)
      }
    }

    let intersection = null
    if ('IntersectionObserver' in window) {
      intersection = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          intersection?.disconnect()
          startAd()
        }
      }, { rootMargin: '200px 0px', threshold: 0 })
      intersection.observe(outer)
    } else {
      startAd()
    }

    syncStatus()
    return () => {
      disposed = true
      intersection?.disconnect()
      mutation.disconnect()
      if (idleHandle !== null) {
        if (idleByTimeout) window.clearTimeout(idleHandle)
        else window.cancelIdleCallback?.(idleHandle)
      }
    }
  }, [placement, slot])

  if (!slot || adState === 'hidden') return null

  return (
    <aside ref={outerRef} className={`oferta-ad-unit ${adState === 'pending' ? 'is-pending' : 'is-filled'}`} data-placement={placement} aria-label="Publicidade" role="complementary">
      <span className="oferta-ad-label">PUBLICIDADE</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={isMobileAd
          ? { display: 'block', width: '100%', height: '100px', maxHeight: '100px' }
          : { display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={isMobileAd ? 'horizontal' : 'auto'}
        data-full-width-responsive={isMobileAd ? 'false' : 'true'}
      />
    </aside>
  )
}
