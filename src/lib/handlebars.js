import Handlebars from 'handlebars'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { absUrl, escapeAttr } from './urls.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const includesDir = join(root, '_includes')

function registerPartials(dir, prefix = '') {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      registerPartials(path, `${prefix}${entry.name}/`)
      continue
    }
    if (!entry.name.endsWith('.hbs')) continue
    const name = `${prefix}${entry.name.replace(/\.hbs$/, '')}`
    Handlebars.registerPartial(name, readFileSync(path, 'utf8'))
  }
}

Handlebars.registerHelper('escapeAttr', (value) => new Handlebars.SafeString(escapeAttr(value)))
Handlebars.registerHelper('absUrl', absUrl)
Handlebars.registerHelper('eq', (a, b) => a === b)

export function renderPage(name, data) {
  // Re-read includes on each render so `eleventy --serve` picks up partial edits
  registerPartials(includesDir)
  const path = join(includesDir, 'pages', `${name}.hbs`)
  return Handlebars.compile(readFileSync(path, 'utf8'))(data)
}
