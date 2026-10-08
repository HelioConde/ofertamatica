import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

// Checagem FTP do diretório usado pela própria action da Locaweb.
// Nunca usar esta etapa para contornar a validação HTTP posterior.
const host = process.env.FTP_HOST
const user = process.env.FTP_USER
const password = process.env.FTP_PASSWORD
if (!host || !user || !password) {
  console.error('Credenciais FTP ausentes no GitHub Actions.')
  process.exit(2)
}
const html = fs.readFileSync('dist/index.html', 'utf8')
const matches = [
  ...html.matchAll(/<script\b[^>]*src=["'](\/assets\/[^"']+\.js)["']/gi),
  ...html.matchAll(/<link\b[^>]*href=["'](\/assets\/[^"']+\.css)["']/gi),
]
const assets = [...new Set(matches.map((match) => path.basename(match[1])))]
if (!assets.some((name) => name.endsWith('.js')) || !assets.some((name) => name.endsWith('.css'))) {
  console.error('Não foi possível identificar JS/CSS do HTML de produção.')
  process.exit(1)
}
for (const name of assets) {
  if (!/^[a-zA-Z0-9_.-]+$/.test(name) || !fs.existsSync(path.join('dist/assets', name))) {
    console.error('Asset local inválido: ' + name)
    process.exit(1)
  }
}
const quote = (value) => '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
function runLftp(commands, label) {
  return new Promise((resolve, reject) => {
    const proc = spawn('lftp', ['-f', '/dev/stdin'], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = '', stderr = ''
    proc.stdout.on('data', (chunk) => { stdout += chunk.toString() })
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString() })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(label + ': código FTP ' + code + '; ' + stderr.slice(-350)))
      resolve({ stdout, stderr })
    })
    proc.stdin.end([
      'set cmd:fail-exit yes',
      'set net:max-retries 2',
      'set net:timeout 20',
      'set ftp:ssl-allow no',
      'open ' + quote(host),
      'user ' + quote(user) + ' ' + quote(password),
      ...commands,
      'bye',
    ].join('\n') + '\n')
  })
}
try {
  // Os arquivos com hash são imutáveis: o mirror não remove uploads antigos.
  // O segundo envio cobre eventuais falhas silenciosas da action FTP.
  await runLftp(['mirror -R --only-missing dist/assets public_html/assets'], 'Envio de correção')
  const { stdout } = await runLftp(['cd public_html/assets', ...assets.map((name) => 'cls -1 ' + quote(name))], 'Listagem FTP')
  const missing = assets.filter((name) => !stdout.split(/\r?\n/).some((line) => line.trim() === name))
  if (missing.length) {
    console.error('Assets ausentes no diretório FTP público: ' + missing.join(', '))
    process.exit(1)
  }
  console.log('FTP OK: ' + assets.length + ' assets JS/CSS confirmados em public_html/assets.')
  console.log('Próxima etapa: verificar se o domínio realmente os entrega como JS/CSS.')
} catch (error) {
  console.error('Falha na auditoria do diretório FTP: ' + error.message)
  process.exitCode = 1
}
