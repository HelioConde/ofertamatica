import { strict as assert } from 'node:assert'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const folder = mkdtempSync(join(tmpdir(), 'ofertamatica-lighthouse-'))
try {
  const report = (url) => ({
    categories: {
      performance: { score: 0.88 },
      accessibility: { score: 1 },
      'best-practices': { score: 1 },
      seo: { score: 1 }
    },
    audits: {
      'unused-javascript': {
        score: 0,
        details: { items: [
          { url, wastedBytes: 4096 },
          { url: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', wastedBytes: 2048 }
        ] }
      },
      'largest-contentful-paint': {numericValue: 3400},
      'cumulative-layout-shift': {numericValue: 0}
    }
  })
  const mobile = join(folder,'mobile.json')
  const desktop = join(folder,'desktop.json')
  writeFileSync(mobile, JSON.stringify(report('https://ofertamatica.com.br/assets/index.js')))
  writeFileSync(desktop, JSON.stringify(report('https://ofertamatica.com.br/assets/index.js')))
  const result = spawnSync(process.execPath, ['scripts/summarize-lighthouse.mjs', mobile, desktop], {
    encoding: 'utf8', maxBuffer: 1024 * 1024
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Desempenho \| 88\/100/)
  assert.match(result.stdout, /Código do próprio site: 4\.0 KiB/)
  assert.match(result.stdout, /Código de terceiros: 2\.0 KiB/)
  console.log('PASS: sumário Lighthouse e separação de terceiros verificados.')
} finally {
  rmSync(folder, {recursive: true, force: true})
}
