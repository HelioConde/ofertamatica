import { useEffect, useRef } from 'react'

// Foco para os diálogos de revisão e prévia: evita que Tab alcance o editor
// por trás do modal e devolve o foco ao controle que o abriu.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function useModalFocus(open, onClose) {
  const modalRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    const modal = modalRef.current
    if (!modal) return undefined
    const previousFocus = document.activeElement
    const candidates = () => [...modal.querySelectorAll(FOCUSABLE)]
      .filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0
        && !element.closest('[hidden], [inert], [aria-hidden="true"]'))

    const focusFrame = window.requestAnimationFrame(() => {
      ;(candidates()[0] || modal).focus({ preventScroll: true })
    })
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab') return
      const elements = candidates()
      if (!elements.length) {
        event.preventDefault()
        modal.focus()
        return
      }
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', onKeyDown, true)
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [open])

  return modalRef
}
