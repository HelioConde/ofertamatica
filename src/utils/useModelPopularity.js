import { useEffect, useState } from 'react'
import { readPersonalModelCounts, sanitizeModelCounts } from './modelPopularity'

let cachedGlobal = {}
let cacheExpires = 0
let pending = null

async function fetchPopularity() {
  if (Date.now() < cacheExpires) return cachedGlobal
  if (pending) return pending
  pending = fetch('/api/modelos-populares.php', { credentials: 'omit', cache: 'default' })
    .then(async (response) => {
      if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) return {}
      const data = await response.json()
      return sanitizeModelCounts(data?.counts)
    })
    .catch(() => ({}))
    .then((counts) => {
      cachedGlobal = counts
      cacheExpires = Date.now() + 15 * 60 * 1000
      return counts
    })
    .finally(() => { pending = null })
  return pending
}

export function useModelPopularity() {
  const [personalCounts, setPersonalCounts] = useState(readPersonalModelCounts)
  const [globalCounts, setGlobalCounts] = useState(() => Date.now() < cacheExpires ? cachedGlobal : {})

  useEffect(() => {
    let mounted = true
    fetchPopularity().then((counts) => { if (mounted) setGlobalCounts(counts) })
    const update = () => setPersonalCounts(readPersonalModelCounts())
    window.addEventListener('ofertamatica-model-usage', update)
    window.addEventListener('storage', update)
    return () => {
      mounted = false
      window.removeEventListener('ofertamatica-model-usage', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return { personalCounts, globalCounts }
}
