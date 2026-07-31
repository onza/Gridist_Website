import { easeInOutSine, lerp } from '../math.js'
import { hiddenWindow } from '../layout/rects.js'

export const captureWindowRects = (keys, getElement) => {
  const rects = {}
  for (const key of keys) {
    const el = getElement(key)
    if (!el) continue
    rects[key] = {
      top: el.offsetTop,
      left: el.offsetLeft,
      width: el.offsetWidth,
      height: el.offsetHeight,
      opacity: getComputedStyle(el).opacity,
    }
  }
  return rects
}

export const applyWindowLayouts = (keys, layouts, getElement, apply, opts) => {
  for (const key of keys) {
    const el = getElement(key)
    const rect = layouts[key] ?? hiddenWindow
    if (!el) continue

    if (opts?.disableTransition) el.style.transition = 'none'
    apply(el, rect)
    if (opts?.disableTransition) {
      void el.offsetWidth
      el.style.transition = ''
    }
  }
}

export const morphWindows = ({
  keys,
  getElement,
  from,
  to,
  durationMs,
  apply,
  shouldCancel,
  onRaf,
}) => {
  const start = performance.now()

  return new Promise((resolve) => {
    const tick = (now) => {
      if (shouldCancel?.()) return resolve()

      const t = Math.min(1, (now - start) / durationMs)
      const e = easeInOutSine(t)

      for (const key of keys) {
        const el = getElement(key)
        const a = from[key] ?? hiddenWindow
        const b = to[key] ?? hiddenWindow
        if (!el) continue

        const fromOpacity = Number.parseFloat(a.opacity ?? '1')
        const toOpacity = Number.parseFloat(b.opacity ?? '1')

        apply(el, {
          top: lerp(a.top, b.top, e),
          left: lerp(a.left, b.left, e),
          width: lerp(a.width, b.width, e),
          height: lerp(a.height, b.height, e),
          opacity: String(lerp(fromOpacity, toOpacity, e)),
        })
      }

      if (t < 1) {
        const id = requestAnimationFrame(tick)
        onRaf?.(id)
      } else {
        applyWindowLayouts(keys, to, getElement, apply, { disableTransition: true })
        resolve()
      }
    }

    const id = requestAnimationFrame(tick)
    onRaf?.(id)
  })
}
