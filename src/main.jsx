import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
// Carrega os estilos editoriais no HTML inicial, antes da hidratação das rotas.
// Evita a galeria de guias aparecer sem grid em carregamentos diretos.
import './styles/marketing.css'

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
