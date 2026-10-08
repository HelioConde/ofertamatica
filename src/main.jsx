import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
// O CSS das páginas internas é carregado pelas rotas; manter fora da Home reduz CSS não usado.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => registration.update().catch(() => {}))
      .catch(() => {
        // A instalação continua opcional; falha no service worker não bloqueia o criador.
      })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
