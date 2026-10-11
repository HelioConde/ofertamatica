(function () {
  'use strict'
  const $ = (id) => document.getElementById(id)
  const fmt = (n) => Number(n || 0).toLocaleString('pt-BR')
  const names = {
    format_selected: 'Formato selecionado',
    print_started: 'Impressão iniciada',
    pdf_started: 'PDF iniciado',
    background_print_started: 'Fundo para impressão',
    free_editor_print: 'Editor livre: impressão',
    free_editor_pdf: 'Editor livre: PDF',
    gallery_background_print: 'Galeria: impressão de fundos',
    page_view: 'Visualização'
  }
  const clean = (node) => { while (node.firstChild) node.removeChild(node.firstChild) }
  const message = (node, value) => {
    const p = document.createElement('p')
    p.textContent = value
    node.appendChild(p)
  }
  function barList(id, values, key, count) {
    const node = $(id)
    clean(node)
    if (!values.length) { message(node, 'Sem dados para o período selecionado.'); return }
    const max = Math.max(1, ...values.map((v) => Number(v[count] || 0)))
    values.forEach((entry) => {
      const wrap = document.createElement('div')
      const line = document.createElement('div')
      line.className = 'line'
      const name = document.createElement('span')
      name.className = 'name'
      name.textContent = key === 'event' ? (names[entry[key]] || entry[key]) : entry[key]
      const strong = document.createElement('strong')
      strong.textContent = fmt(entry[count])
      line.append(name, strong)
      const meter = document.createElement('div')
      meter.className = 'meter'
      const fill = document.createElement('span')
      fill.style.width = (100 * Number(entry[count] || 0) / max) + '%'
      meter.append(fill)
      wrap.append(line, meter)
      node.append(wrap)
    })
  }
  function drawGraph(days) {
    const root = $('graph')
    clean(root)
    if (!days.some((d) => d.views > 0)) { message(root, 'Ainda não há visitas autorizadas neste período.'); return }
    const max = Math.max(1, ...days.map((d) => d.views))
    days.forEach((day) => {
      const bar = document.createElement('div')
      bar.className = 'bar'
      bar.style.height = Math.max(1, Math.round(day.views * 160 / max)) + 'px'
      bar.title = day.date + ': ' + fmt(day.views) + ' visualizações; ' + fmt(day.search) + ' sessões de busca'
      root.append(bar)
    })
  }
  function drawRecent(rows) {
    const root = $('recent')
    clean(root)
    if (!rows.length) {
      const td = document.createElement('td')
      td.colSpan = 4
      td.textContent = 'Nenhum evento registrado.'
      const tr = document.createElement('tr')
      tr.append(td)
      root.append(tr)
      return
    }
    rows.forEach((entry) => {
      const tr = document.createElement('tr')
      const at = entry.at ? new Date(entry.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'
      ;[at, names[entry.event] || entry.event, entry.path, entry.source].forEach((value) => {
        const td = document.createElement('td')
        td.textContent = value
        tr.append(td)
      })
      root.append(tr)
    })
  }
  async function load(days) {
    $('status').style.display = 'none'
    $('updated').textContent = 'Atualizando…'
    try {
      const response = await fetch('/api/monitoramento-dados.php?dias=' + days, { cache: 'no-store', credentials: 'same-origin' })
      if (!response.ok) throw new Error('O servidor retornou HTTP ' + response.status)
      const data = await response.json()
      $('views').textContent = fmt(data.views)
      $('sessions').textContent = fmt(data.sessions)
      $('search').textContent = fmt(data.searchSessions)
      $('share').textContent = Number(data.searchShare).toLocaleString('pt-BR') + '%'
      $('actionsCount').textContent = fmt(data.actionsCount)
      $('updated').textContent = 'Atualizado ' + new Date(data.updatedAt).toLocaleString('pt-BR')
      drawGraph(data.days || [])
      barList('pages', data.pages || [], 'path', 'views')
      barList('sources', data.sources || [], 'name', 'views')
      barList('actions', data.actions || [], 'event', 'count')
      drawRecent(data.recent || [])
      if (!data.views) {
        $('status').style.display = 'block'
        $('status').textContent = 'Sem registros ainda. Confira se o servidor tem PHP, pode gravar na pasta privada e se os visitantes aceitaram estatísticas.'
      }
    } catch (error) {
      $('status').textContent = 'Não foi possível carregar os registros: ' + error.message
      $('status').style.display = 'block'
      $('updated').textContent = 'Erro ao consultar'
    }
  }
  document.querySelectorAll('[data-days]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-days]').forEach((option) => option.setAttribute('aria-pressed', String(option === button)))
      load(Number(button.dataset.days))
    })
  })
  load(7)
})()
