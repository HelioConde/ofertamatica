/* Ofertamática | Consent Mode v2, Google Privacy & Messaging / IAB TCF.
 * Carregado antes de qualquer tag. Sem consentimento válido, nenhum GTM ou
 * bloco de anúncios é iniciado. A CMP certificada governa o tráfego GDPR.
 */
(function () {
  'use strict'
  var KEY = 'ofertamatica:privacy-consent:v1'
  var VERSION = 1
  var MAX_AGE = 180 * 24 * 60 * 60 * 1000
  var GTM_ID = 'GTM-5RGPM6HD'
  var saved = null
  var gtmStarted = false
  var cmp = { known: false, gdprApplies: null, analytics: false, ads: false, personalized: false }
  var denied = 'denied'
  var granted = 'granted'

  try {
    var raw = JSON.parse(window.localStorage.getItem(KEY) || 'null')
    if (raw && raw.version === VERSION && typeof raw.savedAt === 'number' &&
        raw.savedAt <= Date.now() && Date.now() - raw.savedAt < MAX_AGE &&
        typeof raw.analytics === 'boolean' && typeof raw.ads === 'boolean' &&
        typeof raw.personalized === 'boolean') saved = raw
    else if (raw) window.localStorage.removeItem(KEY)
  } catch (_) { /* Navegação privada pode bloquear o armazenamento. */ }

  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments) }
  // O padrão deve ser negado ANTES de qualquer script do Google.
  window.gtag('consent', 'default', {
    ad_storage: denied,
    analytics_storage: denied,
    ad_user_data: denied,
    ad_personalization: denied,
    personalization_storage: denied,
    functionality_storage: granted,
    security_storage: granted,
    wait_for_update: 500
  })
  window.gtag('set', 'ads_data_redaction', true)
  // API publisher oficial: evitar solicitações até a preferência ficar definida.
  window.adsbygoogle = window.adsbygoogle || []
  window.adsbygoogle.pauseAdRequests = 1
  window.adsbygoogle.requestNonPersonalizedAds = 1

  function getState() {
    var european = cmp.known && cmp.gdprApplies === true
    var localReady = cmp.known && cmp.gdprApplies === false
    return {
      hasChoice: !!saved,
      choice: saved ? { analytics: saved.analytics, ads: saved.ads, personalized: saved.personalized } : null,
      cmpKnown: cmp.known,
      cmpApplies: european,
      analyticsEnabled: european ? cmp.analytics : !!(localReady && saved && saved.analytics),
      adsEnabled: european ? cmp.ads : !!(localReady && saved && saved.ads),
      personalizationEnabled: european ? cmp.personalized : !!(localReady && saved && saved.ads && saved.personalized)
    }
  }

  function announce() {
    window.dispatchEvent(new Event('oferta-consent-change'))
  }

  function startGtm() {
    if (gtmStarted) return
    gtmStarted = true
    // Não envie eventos coletados antes da escolha quando a tag iniciar.
    window.dataLayer = window.dataLayer.filter(function (entry) {
      return !entry || !entry.event || entry.event === 'gtm.js'
    })
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    var script = document.createElement('script')
    script.async = true
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID
    script.setAttribute('data-ofertamatica-gtm', 'true')
    document.head.appendChild(script)
  }

  function apply() {
    var state = getState()
    // Personalização deve ser ajustada antes de liberar as requisições.
    window.adsbygoogle = window.adsbygoogle || []
    window.adsbygoogle.requestNonPersonalizedAds = state.personalizationEnabled ? 0 : 1
    window.adsbygoogle.pauseAdRequests = state.adsEnabled ? 0 : 1
    window.gtag('consent', 'update', {
      ad_storage: state.adsEnabled ? granted : denied,
      analytics_storage: state.analyticsEnabled ? granted : denied,
      ad_user_data: state.personalizationEnabled ? granted : denied,
      ad_personalization: state.personalizationEnabled ? granted : denied,
      personalization_storage: denied,
      functionality_storage: granted,
      security_storage: granted
    })
    if (state.analyticsEnabled) startGtm()
    announce()
  }

  function clearGoogleCookies() {
    var cookies = document.cookie ? document.cookie.split(';') : []
    cookies.forEach(function (value) {
      var name = value.split('=')[0].trim()
      if (!/^(_ga($|_)|_gid$|_gat($|_)|_gcl_|_gac_|__gads$|__gpi$)/.test(name)) return
      ;['/', ''].forEach(function (cookiePath) {
        ;['', '; domain=' + window.location.hostname, '; domain=.' + window.location.hostname].forEach(function (domain) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=' +
            (cookiePath || '/') + domain + '; SameSite=Lax'
        })
      })
    })
  }

  function saveChoice(choices) {
    // O consentimento local NÃO substitui uma CMP certificada no GDPR.
    if (getState().cmpApplies) return
    var before = getState()
    saved = {
      version: VERSION, savedAt: Date.now(),
      analytics: choices.analytics === true,
      ads: choices.ads === true,
      personalized: choices.ads === true && choices.personalized === true
    }
    try { window.localStorage.setItem(KEY, JSON.stringify(saved)) } catch (_) {}
    apply()
    var after = getState()
    if ((before.analyticsEnabled && !after.analyticsEnabled) ||
        (before.adsEnabled && !after.adsEnabled)) {
      clearGoogleCookies()
      // Descarta scripts e iframes de terceiros já iniciados nesta página.
      window.location.reload()
    }
  }

  function revoke() {
    saveChoice({ analytics: false, ads: false, personalized: false })
  }

  function showGoogleChoices() {
    var googlefc = window.googlefc
    if (!getState().cmpApplies || !googlefc || !googlefc.callbackQueue) return false
    googlefc.callbackQueue.push({
      CONSENT_API_READY: function () {
        if (typeof googlefc.showRevocationMessage === 'function') googlefc.showRevocationMessage()
      }
    })
    return true
  }

  window.ofertaConsent = {
    getState: getState,
    saveChoice: saveChoice,
    revoke: revoke,
    showGoogleChoices: showGoogleChoices,
    refresh: apply
  }

  // API oficial Google Privacy & Messaging, sem simular TC strings nem CMP.
  window.googlefc = window.googlefc || {}
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || []
  window.googlefc.callbackQueue.push({
    CONSENT_API_READY: function () {
      if (typeof window.__tcfapi !== 'function') return
      window.__tcfapi('addEventListener', 2.2, function (tcData, success) {
        if (!success || !tcData || typeof tcData.gdprApplies !== 'boolean') return
        cmp.known = true
        cmp.gdprApplies = tcData.gdprApplies
        if (cmp.gdprApplies && tcData.eventStatus !== 'useractioncomplete' && tcData.eventStatus !== 'tcloaded') {
          cmp.analytics = false
          cmp.ads = false
          cmp.personalized = false
        }
        apply()
      })
    },
    CONSENT_MODE_DATA_READY: function () {
      var googlefc = window.googlefc
      if (!googlefc || typeof googlefc.getGoogleConsentModeValues !== 'function') return
      var values = googlefc.getGoogleConsentModeValues()
      if (!values) return
      var allNotApplicable = [
        values.adStoragePurposeConsentStatus,
        values.adUserDataPurposeConsentStatus,
        values.adPersonalizationPurposeConsentStatus,
        values.analyticsStoragePurposeConsentStatus
      ].every(function (value) { return value === 3 })
      if (!cmp.known && allNotApplicable) {
        cmp.known = true
        cmp.gdprApplies = false
      }
      if (cmp.gdprApplies === true) {
        cmp.analytics = values.analyticsStoragePurposeConsentStatus === 1
        cmp.ads = values.adStoragePurposeConsentStatus === 1
        cmp.personalized = cmp.ads && values.adUserDataPurposeConsentStatus === 1 &&
          values.adPersonalizationPurposeConsentStatus === 1
      }
      apply()
    }
  })
  // Falha segura: sem resposta verificável da CMP, nenhum serviço opcional é iniciado.
  apply()
})()
