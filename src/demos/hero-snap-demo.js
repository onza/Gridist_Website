import { getMonitorInset, gridMetrics, measureInset } from './layout/grid.js'
import { WIN_GAP } from './layout/tokens.js'
import { applyRect } from './layout/rects.js'
import { getCursorPoint, highlightZoneAtPoint, measureCursorPath } from './snap/cursor.js'
import { SnapDragSession } from './snap/drag-session.js'
import { playSnapStep } from './snap/snap-step.js'

export const queryHeroSnapElements = (visual) => {
  const q = (sel) => visual.querySelector(sel)
  const layer = q('[data-snap-layer]')
  const windowEl = document.querySelector('[data-window="mail"]')
  const cursor = q('.hero-snap-cursor')
  const ghost = q('.hero-snap-ghost')
  const screens = document.querySelector('[data-mac-screens]')
  const inset = getMonitorInset(document.querySelector('.monitor-secondary'))
  const tl = q('.hero-snap-zone-tl')
  const tr = q('.hero-snap-zone-tr')
  const hLeft = q('.hero-snap-zone-h-left')
  const hRight = q('.hero-snap-zone-h-right')

  if (
    !layer ||
    !windowEl ||
    !cursor ||
    !ghost ||
    !screens ||
    !inset ||
    !tl ||
    !tr ||
    !hLeft ||
    !hRight
  ) {
    return null
  }

  return {
    visual,
    layer,
    window: windowEl,
    cursor,
    ghost,
    screens,
    inset,
    zones: { tl, tr, hLeft, hRight },
  }
}

export class HeroSnapDemo {
  constructor(els, timing = {}) {
    this.els = els
    this.timing = { stepDurationMs: timing.stepDurationMs ?? 1400 }
    this.cursorGrip = { top: 14, left: 16 }
    this.mailSnapStart = { top: 0, left: 0, width: 0, height: 0 }
    this.mailSnapVerticalEnd = { top: 0, left: 0, width: 0, height: 0 }
    this.session = new SnapDragSession(els.window, els.screens, els.inset, () => this.cursorGrip)
  }

  setLayerVisible(visible) {
    this.els.layer.toggleAttribute('hidden', !visible)
  }

  resetState() {
    this.session.resetDrag()
    this.clearZoneActive()
    this.els.ghost.style.removeProperty('opacity')
  }

  computeMailSnapRects() {
    const { w, h } = measureInset(this.els.inset)
    if (w === 0 || h === 0) return false

    const { row1H } = gridMetrics(w, h, WIN_GAP)
    this.mailSnapStart = { left: 0, top: 0, width: w, height: h }
    this.mailSnapVerticalEnd = { left: 0, top: 0, width: w, height: row1H }
    return true
  }

  getEndRect(variant) {
    return variant === 'vertical-half' ? this.mailSnapVerticalEnd : this.mailSnapStart
  }

  getTargetZones(variant) {
    const { zones } = this.els
    if (variant === 'vertical-half') return [zones.tr, zones.tl]
    return [zones.hRight, zones.hLeft]
  }

  clearZoneActive() {
    Object.values(this.els.zones).forEach((zone) => zone.classList.remove('is-zone-active'))
  }

  highlightZoneUnderCursor(variant, cursorTopPct, cursorLeftPct) {
    this.clearZoneActive()
    const point = getCursorPoint(this.els.screens, this.els.cursor, cursorTopPct, cursorLeftPct)
    if (!point) return null
    return highlightZoneAtPoint(point, this.getTargetZones(variant))
  }

  async playStep(variant, shouldCancel) {
    if (shouldCancel()) return
    if (!this.computeMailSnapRects()) return

    this.resetState()

    const endRect = this.getEndRect(variant)
    const startRect = this.session.readWindowInsetRect()
    const zoneEl = variant === 'vertical-half' ? this.els.zones.tr : this.els.zones.hRight
    const cursorPath = measureCursorPath(this.els.screens, this.els.window, zoneEl)
    if (!cursorPath) return

    this.cursorGrip = cursorPath.grip

    await playSnapStep({
      durationMs: this.timing.stepDurationMs,
      shouldCancel,
      window: this.els.window,
      cursor: this.els.cursor,
      ghost: this.els.ghost,
      startRect,
      endRect,
      cursorPath,
      session: this.session,
      onPrepare: () => {
        applyRect(this.els.ghost, endRect, 0)
        this.clearZoneActive()
      },
      onSnapTick: () => this.clearZoneActive(),
      onHoldTick: () => this.clearZoneActive(),
      onDragTick: (top, left) => Boolean(this.highlightZoneUnderCursor(variant, top, left)),
      onEnd: () => this.clearZoneActive(),
    })
  }
}
