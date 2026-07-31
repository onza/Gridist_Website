import site from './site.js'

const MAC_PATTERN = /Gridist-.*\.dmg$/i

function findAsset(assets, pattern) {
  return assets?.find((item) => pattern.test(item.name)) ?? null
}

function macosFromAsset(asset, tag, version, fallback) {
  if (asset) {
    return { url: asset.browser_download_url, name: asset.name }
  }

  const fb = fallback.macos
  if (fb?.url) {
    return { url: fb.url, name: fb.url.split('/').pop() ?? '' }
  }

  const file = `Gridist-${version}.dmg`
  return {
    url: `https://github.com/${site.app.repo}/releases/download/${tag}/${file}`,
    name: file,
  }
}

function fromFallback(fallback) {
  return {
    tag: fallback.tag,
    version: fallback.version,
    macos: macosFromAsset(null, fallback.tag, fallback.version, fallback),
  }
}

export default async function () {
  const tagOverride = process.env.APP_RELEASE_TAG?.trim()
  const { repo, fallback } = site.app

  try {
    const apiUrl = tagOverride
      ? `https://api.github.com/repos/${repo}/releases/tags/${tagOverride}`
      : `https://api.github.com/repos/${repo}/releases/latest`

    const res = await fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'gridist-website-build',
      },
    })

    if (!res.ok) {
      throw new Error(`GitHub API ${res.status} for ${apiUrl}`)
    }

    const data = await res.json()
    const tag = data.tag_name
    const version = tag.replace(/^v/, '')
    const release = {
      tag,
      version,
      macos: macosFromAsset(findAsset(data.assets, MAC_PATTERN), tag, version, fallback),
    }

    console.info(`[release] ${release.tag} → ${release.macos.name}`)
    return release
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[release] ${message} — using fallback (${fallback.tag})`)
    return fromFallback(fallback)
  }
}
