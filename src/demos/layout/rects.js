export const hiddenWindow = { left: 0, top: 0, width: 0, height: 0, opacity: '0' }

export const applyRect = (el, rect, opacity) => {
  if (!el) return
  el.style.top = `${rect.top}px`
  el.style.left = `${rect.left}px`
  el.style.width = `${rect.width}px`
  el.style.height = `${rect.height}px`
  if (opacity !== undefined) el.style.opacity = String(opacity)
  else if (rect.opacity !== undefined) el.style.opacity = rect.opacity
}

export const applyProfileRect = (el, rect) => {
  applyRect(el, rect)
  el.style.visibility = Number.parseFloat(rect.opacity ?? '1') === 0 ? 'hidden' : 'visible'
}
