import http from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import puppeteer from 'puppeteer-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../dist')
const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
}

const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
]
const executablePath = chromePaths.find(existsSync)
if (!executablePath) {
  console.error('Kein Chrome/Chromium gefunden — a11y-Scan übersprungen.')
  process.exit(1)
}
if (!existsSync(join(root, 'index.html'))) {
  console.error('dist/ fehlt — zuerst npm run build')
  process.exit(1)
}

const server = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || '/').split('?')[0])
  if (url.endsWith('/')) url += 'index.html'
  const file = join(root, url)
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404)
    res.end('Not found')
    return
  }
  res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' })
  res.end(readFileSync(file))
})

await new Promise((r) => server.listen(0, '127.0.0.1', r))
const { port } = server.address()
const base = `http://127.0.0.1:${port}`

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
})

import {
  LOCALES,
  homePath,
  legalNoticePath,
  privacyPath,
  localeHasContent,
} from '../src/_data/locales.js'

const pages = LOCALES.filter((locale) => localeHasContent(locale.id)).flatMap((locale) => [
  homePath(locale),
  legalNoticePath(locale),
  privacyPath(locale),
])
let failed = 0

for (const path of pages) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle0' })
  await page.addScriptTag({ content: axeSource })
  const results = await page.evaluate(async () =>
    window.axe.run({
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
      },
    }),
  )
  console.log(`\n${path}`)
  console.log(
    `  passes=${results.passes.length} violations=${results.violations.length} incomplete=${results.incomplete.length}`,
  )
  for (const v of results.violations) {
    failed += 1
    console.log(`  FAIL [${v.impact}] ${v.id}: ${v.help}`)
    for (const n of v.nodes) console.log(`    - ${n.target.join(' ')}`)
  }
  for (const v of results.incomplete) {
    console.log(`  REVIEW [${v.impact}] ${v.id} (${v.nodes.length})`)
  }
  await page.close()
}

await browser.close()
server.close()
process.exit(failed ? 1 : 0)
