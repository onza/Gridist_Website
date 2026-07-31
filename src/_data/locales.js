import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load as loadYaml } from 'js-yaml'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const localesRoot = join(root, 'locales')

export const LOCALES = [
  {
    id: 'de',
    hreflang: 'de',
    htmlLang: 'de',
    prefix: '',
    label: 'DE',
    name: 'Deutsch',
    ogLocale: 'de_DE',
    languageMenuAria: 'Sprache wählen',
  },
  {
    id: 'en',
    hreflang: 'en',
    htmlLang: 'en',
    prefix: 'en',
    label: 'EN',
    name: 'English',
    ogLocale: 'en_US',
    languageMenuAria: 'Choose language',
  },
  {
    id: 'fr',
    hreflang: 'fr',
    htmlLang: 'fr',
    prefix: 'fr',
    label: 'FR',
    name: 'Français',
    ogLocale: 'fr_FR',
    languageMenuAria: 'Choisir la langue',
  },
  {
    id: 'es',
    hreflang: 'es',
    htmlLang: 'es',
    prefix: 'es',
    label: 'ES',
    name: 'Español',
    ogLocale: 'es_ES',
    languageMenuAria: 'Elegir idioma',
  },
  {
    id: 'it',
    hreflang: 'it',
    htmlLang: 'it',
    prefix: 'it',
    label: 'IT',
    name: 'Italiano',
    ogLocale: 'it_IT',
    languageMenuAria: 'Scegli la lingua',
  },
  {
    id: 'ja',
    hreflang: 'ja',
    htmlLang: 'ja',
    prefix: 'ja',
    label: 'JA',
    name: '日本語',
    ogLocale: 'ja_JP',
    languageMenuAria: '言語を選択',
  },
  {
    id: 'pt-br',
    hreflang: 'pt-BR',
    htmlLang: 'pt-BR',
    prefix: 'pt-br',
    label: 'PT',
    name: 'Português (Brasil)',
    ogLocale: 'pt_BR',
    languageMenuAria: 'Escolher idioma',
  },
]

export function localeContentDir(id) {
  return join(localesRoot, id)
}

export function loadSite(id) {
  const path = join(localeContentDir(id), 'site.yaml')
  return loadYaml(readFileSync(path, 'utf8'))
}

export function loadHomeMain(id) {
  return readFileSync(join(localeContentDir(id), 'home-main.html'), 'utf8')
}

export function loadArticle(id, kind) {
  const file = kind === 'legal' ? 'legal.html' : 'privacy.html'
  return readFileSync(join(localeContentDir(id), file), 'utf8')
}

export function localeHasContent(id) {
  return existsSync(join(localeContentDir(id), 'site.yaml'))
}

export function homePath(locale) {
  return locale.prefix ? `/${locale.prefix}/` : '/'
}

export function legalNoticePath(locale) {
  return locale.id === 'de' ? '/impressum/' : `/${locale.prefix}/legalnotice/`
}

export function privacyPath(locale) {
  return locale.id === 'de' ? '/datenschutz/' : `/${locale.prefix}/privacypolicy/`
}

export function pathFor(locale, kind) {
  if (kind === 'home') return homePath(locale)
  if (kind === 'legalnotice') return legalNoticePath(locale)
  return privacyPath(locale)
}

export function hreflangMap(kind) {
  const map = {}
  for (const locale of LOCALES) {
    if (!localeHasContent(locale.id)) continue
    map[locale.hreflang] = pathFor(locale, kind)
  }
  if (kind === 'home' && LOCALES[0]) map['x-default'] = homePath(LOCALES[0])
  return map
}

export function loadLocale(id) {
  const site = loadSite(id)
  return {
    ...site,
    homeMainHtml: loadHomeMain(id),
    legalArticle: loadArticle(id, 'legal'),
    privacyArticle: loadArticle(id, 'privacy'),
  }
}
