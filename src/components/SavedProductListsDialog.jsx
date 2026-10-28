import { useEffect, useRef, useState } from 'react'
import {
  deleteNamedList, exportNamedListText, loadSavedLists, MAX_LIST_NAME_LENGTH,
  MAX_SAVED_LISTS, normalizeListName, SAVED_LISTS_KEY, saveNamedList,
  suggestedListFilename,
} from '../utils/savedProductLists'
import '../styles/saved-product-lists.css'

function browserStorage() {
  try { return window.localStorage } catch { return null }
}

export default function SavedProductListsDialog({ open, onClose, sourceText, formatId, onLoad }) {
  const dialogRef = useRef(null)
  const nameRef = useRef(null)
  const [name, setName] = useState('')
  const [lists, setLists] = useState(() => loadSavedLists(browserStorage()))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setLists(loadSavedLists(browserStorage()))
      setError('')
      setMessage('')
      setPending(null)
      dialog.showModal()
      nameRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const sync = (event) => {
      if (event.key === SAVED_LISTS_KEY) setLists(loadSavedLists(browserStorage()))
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  function save() {
    const cleanName = normalizeListName(name)
    const existing = lists.find((item) => item.name.toLocaleLowerCase('pt-BR') === cleanName.toLocaleLowerCase('pt-BR'))
    if (existing && existing.sourceText !== sourceText.trim() &&
      (pending?.type !== 'overwrite' || pending.id !== existing.id)) {
      setPending({ type: 'overwrite', id: existing.id })
      setError('')
      setMessage('Já existe uma lista com esse nome. Clique novamente em “Substituir lista” para confirmar.')
      return
    }
    const result = saveNamedList(browserStorage(), lists, { name, sourceText, formatId })
    if (!result.ok) { setError(result.error); setMessage(''); return }
    setLists(result.lists)
    setName('')
    setPending(null)
    setError('')
    setMessage('Lista salva neste navegador. Baixe o TXT se quiser ter uma cópia fora do dispositivo.')
  }

  function useList(item) {
    if (sourceText.trim() && sourceText.trim() !== item.sourceText &&
      (pending?.type !== 'load' || pending.id !== item.id)) {
      setPending({ type: 'load', id: item.id })
      setError('')
      setMessage('Usar esta lista substituirá o conteúdo atual. Clique novamente para confirmar.')
      return
    }
    onLoad(item.sourceText)
    setPending(null)
    onClose()
  }

  function remove(item) {
    if (pending?.type !== 'delete' || pending.id !== item.id) {
      setPending({ type: 'delete', id: item.id })
      setError('')
      setMessage('Excluir “' + item.name + '”? Clique novamente para confirmar. A exclusão não pode ser desfeita.')
      return
    }
    const result = deleteNamedList(browserStorage(), lists, item.id)
    if (!result.ok) { setError(result.error); return }
    setLists(result.lists)
    setPending(null)
    setError('')
    setMessage('Lista excluída somente deste navegador.')
  }

  function download(item) {
    const text = exportNamedListText(item)
    if (!text) { setError('A lista está vazia e não pode ser exportada.'); return }
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = suggestedListFilename(item.name)
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 500)
    setError('')
    setMessage('Arquivo TXT preparado. Confira os downloads do seu navegador.')
  }

  const cleanName = normalizeListName(name)
  const overwrite = lists.find((item) => item.name.toLocaleLowerCase('pt-BR') === cleanName.toLocaleLowerCase('pt-BR'))

  return (
    <dialog ref={dialogRef} className="saved-lists-dialog" aria-labelledby="saved-lists-title" onClose={onClose}>
      <div className="saved-lists-heading">
        <div>
          <span>NO SEU DISPOSITIVO</span>
          <h2 id="saved-lists-title">Minhas listas de produtos</h2>
          <p>Guarde as listas que usa toda semana sem precisar de login. Os dados permanecem neste navegador.</p>
        </div>
        <button type="button" className="saved-lists-close" aria-label="Fechar Minhas listas" onClick={onClose}>×</button>
      </div>
      <div className="saved-lists-save">
        <label htmlFor="saved-lists-name">Nome da lista</label>
        <div className="saved-lists-save-row">
          <input ref={nameRef} id="saved-lists-name" type="text" maxLength={MAX_LIST_NAME_LENGTH}
            value={name} placeholder="Ex.: Ofertas de sexta-feira"
            onChange={(event) => { setName(event.target.value); setPending(null); setMessage(''); setError('') }}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); save() } }} />
          <button type="button" onClick={save} disabled={!sourceText.trim()}>
            {overwrite && pending?.type === 'overwrite' && pending.id === overwrite.id ? 'Substituir lista' : 'Salvar lista atual'}
          </button>
        </div>
        <small>Salva somente o texto dos produtos; fotos, preços editados separadamente e estilo da placa não são incluídos. Use o rascunho para continuar uma edição completa.</small>
      </div>

      <div className="saved-lists-content">
        <h3>Listas guardadas <span>{lists.length}/{MAX_SAVED_LISTS}</span></h3>
        {lists.length ? (
          <ul className="saved-lists-list">
            {lists.map((item) => (
              <li key={item.id}>
                <div className="saved-list-info">
                  <strong>{item.name}</strong>
                  <small>{item.sourceText.split(/\r?\n/).filter(Boolean).length} linhas · criado no formato {item.formatId || 'A4'} · salvo em {item.savedAt ? new Date(item.savedAt).toLocaleDateString('pt-BR') : 'data desconhecida'}</small>
                </div>
                <div className="saved-list-actions">
                  <button type="button" onClick={() => useList(item)} className="saved-list-use">
                    {pending?.type === 'load' && pending.id === item.id ? 'Confirmar troca' : 'Usar'}
                  </button>
                  <button type="button" onClick={() => download(item)} aria-label={'Baixar TXT da lista ' + item.name}>Baixar TXT</button>
                  <button type="button" onClick={() => remove(item)} className="saved-list-remove" aria-label={'Excluir lista ' + item.name}>
                    {pending?.type === 'delete' && pending.id === item.id ? 'Confirmar exclusão' : 'Excluir'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="saved-lists-empty">Nenhuma lista salva ainda. Cole seus produtos no editor, dê um nome acima e salve.</p>}
      </div>
      {error ? <p className="saved-lists-error" role="alert">{error}</p> : null}
      {message ? <p className="saved-lists-status" role="status">{message}</p> : null}
      <p className="saved-lists-privacy">As listas podem desaparecer se você limpar os dados do navegador ou trocar de aparelho. Para preservar uma lista, use “Baixar TXT”. Depois, importe o arquivo pelo menu de entrada rápida do gerador.</p>
    </dialog>
  )
}
