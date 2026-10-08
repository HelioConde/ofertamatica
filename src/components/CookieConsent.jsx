import { useEffect, useRef, useState } from 'react'
import '../styles/consent.css'

const empty = { analytics: false, ads: false, personalized: false }
const current = () => window.ofertaConsent?.getState() || {
  hasChoice: false, cmpKnown: false, cmpApplies: false, choice: null,
  analyticsEnabled: false, adsEnabled: false, personalizationEnabled: false
}

export default function CookieConsent() {
  const [status, setStatus] = useState(current)
  const [ready, setReady] = useState(false)
  const [settings, setSettings] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [draft, setDraft] = useState(empty)
  const dialogRef = useRef(null)

  useEffect(() => {
    const sync = () => {
      const next = current()
      setStatus(next)
      if (next.cmpApplies) setSettings(false)
    }
    const openExternal = () => {
      const now = current()
      if (now.cmpApplies) window.ofertaConsent?.showGoogleChoices()
      else {
        setDraft({ ...empty, ...(now.choice || {}) })
        setSettings(true)
      }
    }
    window.addEventListener('oferta-consent-change', sync)
    window.addEventListener('oferta-open-consent', openExternal)
    const timer = window.setTimeout(() => setReady(true), 850)
    sync()
    return () => {
      window.removeEventListener('oferta-consent-change', sync)
      window.removeEventListener('oferta-open-consent', openExternal)
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!settings) return undefined
    const previousFocus = document.activeElement
    dialogRef.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') { setSettings(false); return }
      if (event.key !== 'Tab') return
      const targets = [...(dialogRef.current?.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled)') || [])]
      if (!targets.length) return
      if (event.shiftKey && document.activeElement === targets[0]) { event.preventDefault(); targets.at(-1).focus() }
      else if (!event.shiftKey && document.activeElement === targets.at(-1)) { event.preventDefault(); targets[0].focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [settings])

  const save = (value) => {
    window.ofertaConsent?.saveChoice(value)
    setSettings(false)
    setMinimized(false)
    setStatus(current())
  }
  const open = () => window.dispatchEvent(new Event('oferta-open-consent'))
  // Minimizar não registra consentimento. A escolha continua pendente
  // e o visitante pode restaurar o aviso pelo atalho persistente.
  const restore = () => {
    if (!status.hasChoice && !status.cmpApplies) setMinimized(false)
    else open()
  }
  const banner = ready && !minimized && !status.hasChoice && !status.cmpApplies && !settings

  return (
    <>
      {/* Após uma escolha, nenhum botão fica flutuando sobre o editor.
          Se o aviso foi apenas minimizado, mantemos o atalho: minimizar não é consentir. */}
      {ready && minimized && !status.hasChoice && !status.cmpApplies && !settings ? (
        <button type="button" className="cookie-entry" onClick={restore}
          aria-label={minimized && !status.hasChoice && !status.cmpApplies
            ? 'Reabrir aviso de cookies sem registrar escolha'
            : 'Abrir preferências de privacidade e cookies'}>
          <span aria-hidden="true">◉</span> {minimized && !status.hasChoice && !status.cmpApplies ? 'Escolher cookies' : 'Privacidade'}
        </button>
      ) : null}

      {banner ? (
        <section className="cookie-banner" aria-label="Preferências de privacidade" role="region">
          <div className="cookie-banner-intro">
            <span className="cookie-symbol" aria-hidden="true">✦</span>
            <div className="cookie-banner-content">
              <div className="cookie-banner-heading">
                <h2>Privacidade e cookies</h2>
                <button type="button" className="cookie-minimize" onClick={() => setMinimized(true)}
                  aria-label="Minimizar aviso de cookies sem registrar uma escolha" title="Minimizar aviso">−</button>
              </div>
              <p>Usamos armazenamento essencial para seus cartazes. Com sua permissão, usamos dados para estatísticas e anúncios. Você pode mudar sua escolha quando quiser.</p>
              <a href="/privacidade/">Política de Privacidade</a>
            </div>
          </div>
          <div className="cookie-banner-actions">
            <button type="button" className="cookie-action cookie-neutral" onClick={() => save(empty)}>Rejeitar opcionais</button>
            <button type="button" className="cookie-action cookie-secondary" onClick={open}>Personalizar</button>
            <button type="button" className="cookie-action cookie-primary" onClick={() => save({ analytics: true, ads: true, personalized: true })}>Aceitar todos</button>
          </div>
        </section>
      ) : null}

      {settings && !status.cmpApplies ? (
        <div className="cookie-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettings(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="cookie-title" aria-describedby="cookie-explanation"
            tabIndex={-1} ref={dialogRef} className="cookie-dialog">
            <div className="cookie-dialog-top">
              <div><span className="cookie-eyebrow">OFERTAMÁTICA</span><h2 id="cookie-title">Suas preferências de dados</h2></div>
              <button type="button" className="cookie-close" aria-label="Fechar preferências" onClick={() => setSettings(false)}>×</button>
            </div>
            <p id="cookie-explanation">Escolha as finalidades opcionais. Os recursos de criação e impressão continuam funcionando mesmo se você rejeitar tudo.</p>
            <div className="cookie-options">
              <div className="cookie-option">
                <div><strong>Essenciais</strong><p>Salvam rascunhos, formatos, personalizações e sua escolha neste navegador.</p></div>
                <span className="cookie-always">Sempre ativos</span>
              </div>
              <label className="cookie-option">
                <div><strong>Estatísticas</strong><p>Google Analytics para compreender o uso e melhorar a experiência.</p></div>
                <input type="checkbox" checked={draft.analytics} onChange={(event) => setDraft((d) => ({ ...d, analytics: event.target.checked }))} />
              </label>
              <label className="cookie-option">
                <div><strong>Anúncios</strong><p>Google AdSense para ajudar a manter a ferramenta gratuita.</p></div>
                <input type="checkbox" checked={draft.ads} onChange={(event) => setDraft((d) => ({ ...d, ads: event.target.checked, personalized: event.target.checked ? d.personalized : false }))} />
              </label>
              <label className={'cookie-option ' + (!draft.ads ? 'is-disabled' : '')}>
                <div><strong>Personalização de anúncios</strong><p>Permite usar dados para publicidade mais relevante, quando disponível.</p></div>
                <input type="checkbox" disabled={!draft.ads} checked={draft.ads && draft.personalized} onChange={(event) => setDraft((d) => ({ ...d, personalized: event.target.checked }))} />
              </label>
            </div>
            <p className="cookie-retention">A escolha dura até 180 dias no dispositivo. Você pode alterá-la ou revogá-la quando quiser. <a href="/privacidade/">Saiba mais</a>.</p>
            <div className="cookie-dialog-actions">
              <button type="button" className="cookie-action cookie-neutral" onClick={() => save(empty)}>Rejeitar todos</button>
              <button type="button" className="cookie-action cookie-primary" onClick={() => save(draft)}>Salvar escolhas</button>
            </div>
            {status.hasChoice ? <button type="button" className="cookie-revoke" onClick={() => save(empty)}>Revogar meu consentimento para dados opcionais</button> : null}
          </section>
        </div>
      ) : null}
    </>
  )
}
