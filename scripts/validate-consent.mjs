import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'

const source = fs.readFileSync('public/consent-bootstrap.js', 'utf8')
function fixture(preference) {
  const store = new Map()
  if (preference) store.set('ofertamatica:privacy-consent:v1', JSON.stringify({ version: 1, savedAt: Date.now(), ...preference }))
  const inserted = []
  let reloaded = 0
  const window = {
    localStorage: { getItem: (k) => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) },
    dataLayer: [],
    location: { hostname: 'ofertamatica.com.br', reload: () => { reloaded += 1 } },
    dispatchEvent: () => {}
  }
  const document = { cookie: '', head: { appendChild: (node) => inserted.push(node) }, createElement: (type) => ({ type, setAttribute: () => {} }) }
  vm.runInNewContext(source, { window, document, Event: class {}, Date, console })
  return { api: window.ofertaConsent, window, inserted, reloads: () => reloaded }
}
const denied = fixture()
assert.equal(denied.api.getState().adsEnabled, false)
assert.equal(denied.api.getState().analyticsEnabled, false)
assert.equal(denied.inserted.length, 0)
assert.equal(denied.window.adsbygoogle.pauseAdRequests, 1, 'AdSense must start paused')
assert.equal(denied.window.dataLayer[0][0], 'consent')
assert.equal(denied.window.dataLayer[0][1], 'default')
assert.equal(denied.window.dataLayer[0][2].ad_storage, 'denied')
denied.api.saveChoice({ analytics: true, ads: true, personalized: true })
assert.equal(denied.api.getState().adsEnabled, false, 'CMP desconhecida: falha segura')
assert.equal(denied.inserted.length, 0)
denied.window.__tcfapi = (_action, _version, cb) => cb({ gdprApplies: false }, true)
denied.window.googlefc.callbackQueue[0].CONSENT_API_READY()
assert.equal(denied.api.getState().adsEnabled, true)
assert.equal(denied.window.adsbygoogle.pauseAdRequests, 0, 'AdSense can resume after validated consent')
assert.equal(denied.api.getState().analyticsEnabled, true)
assert.equal(denied.inserted.length, 1)
denied.api.revoke()
assert.equal(denied.api.getState().adsEnabled, false)
assert.equal(denied.window.adsbygoogle.pauseAdRequests, 1, 'Revocation must pause AdSense again')
assert.equal(denied.api.getState().analyticsEnabled, false)
assert.equal(denied.reloads(), 1)
const european = fixture({ analytics: true, ads: true, personalized: true })
european.window.__tcfapi = (_action, _version, cb) => cb({ gdprApplies: true, eventStatus: 'tcloaded' }, true)
european.window.googlefc.callbackQueue[0].CONSENT_API_READY()
assert.equal(european.api.getState().adsEnabled, false, 'GDPR ignora escolha local anterior')
assert.equal(european.api.getState().cmpApplies, true)
let revocations = 0
european.window.googlefc.showRevocationMessage = () => { revocations++ }
european.api.showGoogleChoices()
assert.equal(revocations, 1)
european.window.googlefc.getGoogleConsentModeValues = () => ({ adStoragePurposeConsentStatus: 1, adUserDataPurposeConsentStatus: 1, adPersonalizationPurposeConsentStatus: 2, analyticsStoragePurposeConsentStatus: 1 })
european.window.googlefc.callbackQueue[0].CONSENT_MODE_DATA_READY()
assert.equal(european.api.getState().adsEnabled, true)
assert.equal(european.api.getState().analyticsEnabled, true)
assert.equal(european.api.getState().personalizationEnabled, false)
console.log('Consentimento: padrão negado, opt-in, GDPR/TCF e revogação passaram.')
