import site from './site.js'
import { absUrl } from '../lib/urls.js'
import {
  LOCALES,
  homePath,
  hreflangMap,
  legalNoticePath,
  loadLocale,
  localeHasContent,
  pathFor,
  privacyPath,
} from './locales.js'

const PAGE_KIND = {
  home: { seoKey: 'home', hreflangKind: 'home', indexable: true },
  legal: { seoKey: 'legalNotice', hreflangKind: 'legalnotice', indexable: false },
  privacy: { seoKey: 'privacy', hreflangKind: 'privacypolicy', indexable: false },
}

function seoBlock(meta, locale, kind) {
  const { seoKey, hreflangKind, indexable } = PAGE_KIND[kind]
  return {
    title: locale.seo[seoKey].title,
    description: locale.seo[seoKey].description,
    keywords: locale.seo[seoKey].keywords,
    robots: indexable ? 'index, follow' : 'noindex, follow',
    ogType: 'website',
    ogLocale: meta.ogLocale,
    ogLocaleAlternates: LOCALES.filter(
      (localeItem) => localeItem.id !== meta.id && localeHasContent(localeItem.id),
    ).map((localeItem) => localeItem.ogLocale),
    hreflang: hreflangMap(hreflangKind),
    sitemap: indexable,
    priority: kind === 'home' ? 1 : 0.4,
  }
}

function langLinks(meta, kind) {
  const { hreflangKind } = PAGE_KIND[kind]
  return LOCALES.filter((locale) => locale.id !== meta.id && localeHasContent(locale.id)).map(
    (locale) => ({
      href: pathFor(locale, hreflangKind),
      hreflang: locale.hreflang,
      htmlLang: locale.htmlLang,
      name: locale.name,
    }),
  )
}

function homeJsonLd(meta, locale, permalink) {
  const pageUrl = absUrl(permalink)
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: site.name,
        url: pageUrl,
        description: locale.seo.home.description,
        inLanguage: meta.htmlLang,
        publisher: {
          '@type': 'Person',
          name: site.author,
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: site.name,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'macOS',
        description: locale.seo.home.description,
        url: absUrl('/'),
        image: absUrl(site.ogImage),
        downloadUrl: site.downloadUrl,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
        },
        author: {
          '@type': 'Person',
          name: site.author,
        },
      },
    ],
  })
}

function buildEntry(meta, locale, kind) {
  const permalink =
    kind === 'home' ? homePath(meta) : kind === 'legal' ? legalNoticePath(meta) : privacyPath(meta)

  const entry = {
    permalink,
    locale: meta,
    localeId: meta.id,
    htmlLang: meta.htmlLang,
    paths: {
      home: homePath(meta),
      legalNotice: legalNoticePath(meta),
      privacy: privacyPath(meta),
    },
    showDownloadCta: kind === 'home',
    seo: seoBlock(meta, locale, kind),
    langLinks: langLinks(meta, kind),
    t: locale.strings,
  }

  if (kind === 'home') {
    entry.homeMainHtml = locale.homeMainHtml
    entry.jsonLd = homeJsonLd(meta, locale, permalink)
  } else {
    entry.articleHtml = kind === 'legal' ? locale.legalArticle : locale.privacyArticle
  }

  return entry
}

let cache

export default function () {
  if (cache) return cache

  const home = []
  const legal = []
  const privacy = []

  for (const meta of LOCALES) {
    if (!localeHasContent(meta.id)) continue
    const locale = loadLocale(meta.id)
    home.push(buildEntry(meta, locale, 'home'))
    legal.push(buildEntry(meta, locale, 'legal'))
    privacy.push(buildEntry(meta, locale, 'privacy'))
  }

  cache = { home, legal, privacy }
  return cache
}
