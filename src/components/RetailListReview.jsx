import { useId, useMemo, useState } from 'react'
import { inspectRetailList, REVIEW_SAMPLE } from '../seo/retailListReview'
import '../styles/retail-list-review.css'

export default function RetailListReview({ onCreate }) {
  const inputId = useId()
  const [source, setSource] = useState(REVIEW_SAMPLE)
  const [copyStatus, setCopyStatus] = useState('')
  const report = useMemo(() => inspectRetailList(source), [source])

  async function copyList() {
    try {
      await navigator.clipboard.writeText(source)
      setCopyStatus('Lista copiada. Abra o gerador e cole na entrada rápida.')
    } catch {
      setCopyStatus('O navegador não permitiu copiar automaticamente. Selecione a lista e copie manualmente.')
    }
  }

  return (
    <section className="retail-review marketing-section" aria-labelledby={inputId + '-title'}>
      <div className="retail-review-heading">
        <span className="marketing-kicker">CONFERÊNCIA ANTES DE IMPRIMIR</span>
        <h2 id={inputId + '-title'}>Teste a sua lista de produtos antes de criar os cartazes</h2>
        <p>Cole linhas de texto ou células copiadas de uma planilha. A ferramenta usa o mesmo interpretador do editor, sinalizando preços ausentes, unidades indefinidas e possíveis repetições. Tudo é processado neste navegador.</p>
      </div>
      <label className="retail-review-label" htmlFor={inputId + '-input'}>Produtos e preços (um por linha ou colados do Excel)</label>
      <textarea id={inputId + '-input'} spellCheck={false} rows={6} value={source}
        onChange={(event) => { setSource(event.target.value); setCopyStatus('') }}
        aria-describedby={inputId + '-hint'} />
      <p className="retail-review-hint" id={inputId + '-hint'}>Exemplo fictício incluído para demonstração. A análise não consulta o sistema de vendas nem valida preços comerciais.</p>
      {report.error ? <p role="alert" className="retail-review-error">{report.error}</p> : (
        <>
          <div className="retail-review-stats" aria-live="polite" aria-atomic="true">
            <span><strong>{report.total}</strong> produtos reconhecidos</span>
            <span><strong>{report.ready}</strong> sem alertas</span>
            <span><strong>{report.attention}</strong> para revisar</span>
          </div>
          {report.rows.length ? (
            <div className="retail-review-scroll" role="region" aria-label="Resultados da conferência dos produtos" tabIndex={0}>
              <table>
                <thead><tr><th scope="col">Produto</th><th scope="col">Unidade</th><th scope="col">Preço</th><th scope="col">Conferência</th></tr></thead>
                <tbody>{report.rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.name}</th>
                    <td>{row.unit}</td>
                    <td className="retail-review-price">{row.price === '—' ? row.price : 'R$ ' + row.price}</td>
                    <td><span className={row.ready ? 'retail-review-ok' : 'retail-review-attention'}>
                      {row.ready ? 'Sem alertas' : row.issues.join(' · ')}
                    </span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="retail-review-empty">Cole uma lista para ver os produtos interpretados.</p>}
        </>
      )}
      <div className="retail-review-actions">
        <button type="button" disabled={!source.trim()} onClick={copyList}>Copiar lista</button>
        <button type="button" className="retail-review-create" onClick={onCreate}>Abrir gerador de cartazes</button>
      </div>
      {copyStatus ? <p role="status" className="retail-review-copy-status">{copyStatus}</p> : null}
      <p className="retail-review-disclaimer">Esta é uma pré-conferência automática, não uma garantia de interpretação perfeita. Confira descrição, peso, marca e preço de cada placa no editor. Produtos duplicados podem ser intencionais, e a ferramenta não confirma o valor no caixa.</p>
    </section>
  )
}
