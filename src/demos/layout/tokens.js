const ROOT_FONT_SIZE = 16

export const WIN_INSET = 10
export const WIN_GAP = WIN_INSET

const SNAP_BEZEL_MAX = 75
const SNAP_BEZEL_MIN = 36
const SNAP_BEZEL_GAP = 8
const SNAP_PREVIEW_BUFFER = 4

const pxToRem = (px) => `${Math.round(px) / ROOT_FONT_SIZE}rem`

const cssLengthToPx = (value, rootSize = ROOT_FONT_SIZE) => {
  const trimmed = value.trim()
  if (trimmed.endsWith('rem')) return parseFloat(trimmed) * rootSize
  if (trimmed.endsWith('px')) return parseFloat(trimmed)
  return parseFloat(trimmed) || 0
}

const getVisibleBezelCount = (preview) => {
  const bezels = preview.querySelectorAll('.hero-snap-preview-bezel')
  const visible = [...bezels].filter((el) => !el.hasAttribute('hidden'))
  return visible.length || bezels.length || 1
}

export const syncSnapPreviewSizes = () => {
  document.querySelectorAll('.hero-snap-preview').forEach((preview) => {
    const screens = preview.closest('.mac-screens')
    if (!screens) return

    const count = getVisibleBezelCount(preview)
    const rootSize =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || ROOT_FONT_SIZE
    const inset =
      cssLengthToPx(getComputedStyle(screens).getPropertyValue('--win-inset'), rootSize) ||
      WIN_INSET
    const available = Math.max(
      0,
      screens.getBoundingClientRect().width - inset * 2 - SNAP_PREVIEW_BUFFER,
    )
    const gaps = Math.max(0, count - 1) * SNAP_BEZEL_GAP
    const size = Math.min(
      SNAP_BEZEL_MAX,
      Math.max(SNAP_BEZEL_MIN, Math.floor((available - gaps) / count)),
    )

    preview.style.setProperty('--snap-bezel-size', pxToRem(size))
    preview.style.setProperty('--snap-bezel-gap', pxToRem(SNAP_BEZEL_GAP))
  })
}

export const syncLayoutTokens = () => {
  document
    .querySelectorAll('[data-mac-screens], [data-profile-demo-screens], [data-snap-demo-screens]')
    .forEach((el) => {
      el.style.setProperty('--win-inset', pxToRem(WIN_INSET))
      el.style.setProperty('--win-gap', pxToRem(WIN_GAP))
    })

  syncSnapPreviewSizes()
}
