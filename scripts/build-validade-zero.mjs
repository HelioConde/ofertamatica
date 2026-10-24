import { existsSync, mkdirSync, rmSync, cpSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

/**
 * O app opera em /validade-zero/, sem iframe e sem depender do GitHub Pages.
 * Vite/Ofertamática compila primeiro; o CRA é copiado para o subdiretório depois.
 * Cada app mantém seu próprio build, React e Service Worker.
 */
const root = process.cwd()
const appDir = path.join(root, 'apps', 'validade-zero')
const sourceIndex = path.join(appDir, 'public', 'index.html')
const target = path.join(root, 'dist', 'validade-zero')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

if (!existsSync(path.join(appDir, 'package-lock.json')) || !existsSync(sourceIndex)) {
  throw new Error('Fonte completa do Validade Zero ausente do monorepo.')
}

if (!existsSync(path.join(appDir, 'node_modules', 'react-scripts', 'bin', 'react-scripts.js'))) {
  console.log('[validade-zero] Instalando dependências isoladas do aplicativo...')
  execFileSync(npm, ['ci', '--no-audit', '--no-fund'], { cwd: appDir, stdio: 'inherit' })
}

console.log('[validade-zero] Compilando React para /validade-zero/...')
execFileSync(npm, ['run', 'build'], {
  cwd: appDir,
  stdio: 'inherit',
  env: { ...process.env, PUBLIC_URL: '/validade-zero', CI: 'true', GENERATE_SOURCEMAP: 'false' },
})

const build = path.join(appDir, 'build')
if (!existsSync(path.join(build, 'index.html')) || !existsSync(path.join(build, 'static'))) {
  throw new Error('CRA não produziu o bundle do Validade Zero.')
}

// Garantia extra contra servir a antiga página SEO nesta rota.
rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })
cpSync(build, target, { recursive: true })

const html = readFileSync(path.join(target, 'index.html'), 'utf8')
if (!html.includes('/validade-zero/static/') || !html.includes('id="root"')) {
  throw new Error('Bundle inválido: assets do Validade Zero não apontam para /validade-zero/.')
}
if (!existsSync(path.join(target, 'push-sw.js'))) {
  throw new Error('O service worker de Push não foi publicado no escopo do Validade Zero.')
}
console.log('[validade-zero] Aplicativo completo em dist/validade-zero/ pronto para a Locaweb.')
