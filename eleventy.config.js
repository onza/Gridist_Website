import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite'
import pagesData from './src/_data/pages.js'
import { absUrl } from './src/lib/urls.js'

function writeRobots(outDir) {
  const body = `User-agent: *
Allow: /
Disallow: /assets/

Sitemap: ${absUrl('/sitemap.xml')}
`
  writeFileSync(resolve(outDir, 'robots.txt'), body)
}

function writeSitemap(outDir, homePages) {
  const urls = homePages
    .map((page) => {
      const loc = absUrl(page.permalink)
      const hreflangLinks = Object.entries(page.seo.hreflang)
        .map(
          ([lang, path]) =>
            `    <xhtml:link rel="alternate" hreflang="${lang}" href="${absUrl(path)}" />`,
        )
        .join('\n')
      return `  <url>
    <loc>${loc}</loc>
${hreflangLinks}
    <changefreq>monthly</changefreq>
    <priority>${page.seo.priority ?? 0.8}</priority>
  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
  writeFileSync(resolve(outDir, 'sitemap.xml'), xml)
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ public: '/' })
  eleventyConfig.addPassthroughCopy('LICENSE')

  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: {
      resolve: {
        alias: {
          '/src': resolve('src'),
        },
      },
      plugins: [
        {
          name: 'gridist-scripts-at-body-end',
          transformIndexHtml: {
            order: 'post',
            handler(html) {
              const scripts = []
              const withoutScripts = html.replace(
                /\s*<script type="module"[^>]*><\/script>/g,
                (match) => {
                  scripts.push(match.trim())
                  return ''
                },
              )
              if (!scripts.length) return html
              return withoutScripts.replace('</body>', `\n    ${scripts.join('\n    ')}\n  </body>`)
            },
          },
        },
        {
          name: 'gridist-sitemap',
          closeBundle() {
            const pages = pagesData()
            writeSitemap(resolve('dist'), pages.home)
            writeRobots(resolve('dist'))
          },
        },
      ],
      css: {
        preprocessorOptions: {
          scss: {
            silenceDeprecations: ['legacy-js-api'],
          },
        },
      },
    },
  })

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
      data: '_data',
    },
    templateFormats: ['11ty.js'],
  }
}
