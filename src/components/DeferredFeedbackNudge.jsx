import { lazy, Suspense, useEffect, useRef, useState } from 'react'

const FeedbackNudge = lazy(() => import('./FeedbackNudge'))
const OPEN_AFTER_MS = 16000
const PRELOAD_AHEAD_MS = 4000

// O convite não participa da primeira pintura nem do bundle crítico.
// O prazo absoluto preserva os 16 segundos mesmo com import() assíncrono.
export default function DeferredFeedbackNudge() {
  const deadline = useRef(Date.now() + OPEN_AFTER_MS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const delay = Math.max(0, deadline.current - Date.now() - PRELOAD_AHEAD_MS)
    const timer = window.setTimeout(() => setLoaded(true), delay)
    return () => window.clearTimeout(timer)
  }, [])

  if (!loaded) return null
  return (
    <Suspense fallback={null}>
      <FeedbackNudge openAt={deadline.current} />
    </Suspense>
  )
}
