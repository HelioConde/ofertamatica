import { useEffect, useState } from 'react'
import '../styles/feedback-nudge.css'

const DISMISS_KEY = 'ofertamatica:feedback-dismissed-until:v1'
const SEND_ADDRESS = 'atendimento@ofertamatica.com.br'
const OPEN_AFTER_MS = 16000
const DISMISS_DAYS = 14

function safeDismissUntil() {
  try { return Number(window.localStorage.getItem(DISMISS_KEY) || 0) } catch { return 0 }
}
function snooze() {
  try { window.localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 86400000)) } catch { /* armazenamento opcional */ }
}

export default function FeedbackNudge() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [rating, setRating] = useState('')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (safeDismissUntil() > Date.now()) return undefined
    const timer = window.setTimeout(() => setVisible(true), OPEN_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [])

  function dismiss() {
    setVisible(false)
    setExpanded(false)
    snooze()
  }

  function feedbackText() {
    return [
      'Feedback sobre a Ofertamática',
      rating ? 'Avaliação: ' + rating + '/5' : 'Avaliação: não informada',
      'Página: ' + (window.location.pathname || '/'),
      'Mensagem: ' + message.trim(),
    ].join('\n')
  }

  function sendFeedback(event) {
    event.preventDefault()
    if (!message.trim()) return
    // Sem servidor, sem dados do editor/planilha e sem alegar envio automático.
    const subject = encodeURIComponent('Feedback — Ofertamática')
    const body = encodeURIComponent(feedbackText())
    window.location.href = 'mailto:' + SEND_ADDRESS + '?subject=' + subject + '&body=' + body
  }

  async function copyFeedback() {
    try {
      await navigator.clipboard.writeText(feedbackText())
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  if (!visible) return null
  return (
    <aside className={'feedback-nudge' + (expanded ? ' feedback-nudge-open' : '')}
      aria-label="Deixe seu feedback sobre a Ofertamática">
      <div className="feedback-nudge-top">
        <span className="feedback-nudge-symbol" aria-hidden="true">✦</span>
        <div>
          <strong>Deixe seu feedback</strong>
          {!expanded ? <small>Como podemos melhorar as placas?</small> : null}
        </div>
        <button type="button" className="feedback-nudge-close" aria-label="Dispensar convite de feedback por 14 dias" onClick={dismiss}>×</button>
      </div>
      {expanded ? (
        <form onSubmit={sendFeedback} className="feedback-nudge-form">
          <p>Sua opinião ajuda a melhorar os modelos e a impressão. Não inclua dados pessoais ou listas de produtos.</p>
          <fieldset className="feedback-nudge-rating">
            <legend>Como foi sua experiência? (opcional)</legend>
            {['1','2','3','4','5'].map((value) => (
              <label key={value}>
                <input type="radio" name="feedback-rating" value={value} checked={rating === value} onChange={() => setRating(value)} />
                {value}
              </label>
            ))}
          </fieldset>
          <label htmlFor="ofertamatica-feedback-message">O que podemos melhorar?</label>
          <textarea id="ofertamatica-feedback-message" value={message} onChange={(event) => { setMessage(event.target.value); setCopied(false) }}
            rows={3} maxLength={400} required placeholder="Ex.: gostaria de mais modelos para hortifruti..." />
          <div className="feedback-nudge-actions">
            <button type="submit" disabled={!message.trim()}>Abrir meu e-mail</button>
            <button type="button" onClick={copyFeedback} disabled={!message.trim()}>Copiar</button>
          </div>
          <small role="status">{copied ? 'Feedback copiado. Cole em seu e-mail ou mensagem.' : 'O botão abre seu aplicativo de e-mail; nada é enviado automaticamente pelo site.'}</small>
        </form>
      ) : (
        <button type="button" className="feedback-nudge-cta" onClick={() => setExpanded(true)}>Dar minha opinião</button>
      )}
    </aside>
  )
}
