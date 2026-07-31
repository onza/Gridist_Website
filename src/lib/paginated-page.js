import { renderPage } from './handlebars.js'

function applyRelease(html, release) {
  if (!html || !release?.macos?.url) return html

  let out = html.replace(/<a\b([^>]*\bdata-download-link\b[^>]*)>/g, (full, attrs) => {
    const cleaned = attrs
      .replace(/\shref=(['"])[^'"]*\1/i, '')
      .replace(/\starget=(['"])[^'"]*\1/i, '')
      .replace(/\srel=(['"])[^'"]*\1/i, '')
    return `<a href='${release.macos.url}' target='_blank' rel='noopener noreferrer'${cleaned}>`
  })

  if (release.version) {
    out = out.replace(
      /(<span\b[^>]*\bdata-release-version\b[^>]*>)[^<]*(<\/span>)/gi,
      `$1${release.version}$2`,
    )
  }

  return out
}

export function createPaginatedPage(pagesKey, template, { withRelease = false } = {}) {
  const data = {
    pagination: {
      data: `pages.${pagesKey}`,
      size: 1,
      alias: 'page',
    },
    permalink: (pageData) => pageData.page.permalink,
  }

  function render(pageData) {
    const page = { ...pageData.page }
    const release = withRelease ? pageData.release : null

    if (withRelease && release && page.homeMainHtml) {
      page.homeMainHtml = applyRelease(page.homeMainHtml, release)
    }

    return renderPage(template, {
      ...page,
      site: pageData.site,
      ...(release ? { release } : {}),
    })
  }

  return { data, render }
}
