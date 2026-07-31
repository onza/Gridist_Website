import { shuffle } from './math.js'
import { measureInset } from './layout/grid.js'
import { syncSnapPreviewSizes } from './layout/tokens.js'
import { applyRect } from './layout/rects.js'
import { isElementInView } from './loop.js'
import { getCursorPoint, measureCursorPath } from './snap/cursor.js'
import { SnapDragSession } from './snap/drag-session.js'
import { playSnapStep } from './snap/snap-step.js'
import { ALL_SNAP_ZONE_KEYS, getZoneEndRect } from './snap/zones.js'

const ZONE_PREVIEW_MODE = {
  tl: 'vertical',
  tr: 'vertical',
  bl: 'vertical',
  br: 'vertical',
  'h-left': 'horizontal',
  'h-right': 'horizontal',
  full: 'full',
  't-left': 'thirds',
  't-right': 'thirds',
}

const DEFAULT_TIMING = {
  stepDurationMs: 1400,
  pauseBetweenMs: 1800,
  holdAfterMs: 1200,
  bothBezelsVisible: true,
}

export const querySnapDemoElements = (root) => {
  const q = (sel) => root.querySelector(sel)

  const screens = q('[data-snap-demo-screens]')
  const inset = screens?.querySelector('.monitor-inset')
  const windowEl = q('[data-snap-window]')
  const cursor = q('.hero-snap-cursor')
  const ghost = q('.hero-snap-ghost')
  const layer = q('[data-snap-layer]')
  const preview = q('.hero-snap-preview')
  const bezelVertical = q('.hero-snap-preview-bezel--vertical')
  const bezelHorizontal = q('.hero-snap-preview-bezel--horizontal')
  const bezelFull = q('.hero-snap-preview-bezel--full')
  const bezelThirds = q('.hero-snap-preview-bezel--thirds')
  const tl = q('.hero-snap-zone-tl')
  const tr = q('.hero-snap-zone-tr')
  const bl = q('.hero-snap-zone-bl')
  const br = q('.hero-snap-zone-br')
  const hLeft = q('.hero-snap-zone-h-left')
  const hRight = q('.hero-snap-zone-h-right')
  const zoneFull = q('.hero-snap-zone-full')
  const tLeft = q('.hero-snap-zone-t-left')
  const tRight = q('.hero-snap-zone-t-right')

  const hasExtendedLayouts = Boolean(bezelFull)

  if (
    !screens ||
    !inset ||
    !windowEl ||
    !cursor ||
    !ghost ||
    !layer ||
    !preview ||
    !bezelVertical ||
    !bezelHorizontal ||
    !tl ||
    !tr ||
    !bl ||
    !br ||
    !hLeft ||
    !hRight ||
    (hasExtendedLayouts && (!bezelThirds || !zoneFull || !tLeft || !tRight))
  ) {
    return null
  }

  return {
    root,
    screens,
    inset,
    window: windowEl,
    cursor,
    ghost,
    layer,
    preview,
    bezelVertical,
    bezelHorizontal,
    bezelFull: bezelFull ?? undefined,
    bezelThirds: bezelThirds ?? undefined,
    zones: {
      tl,
      tr,
      bl,
      br,
      hLeft,
      hRight,
      full: zoneFull ?? undefined,
      tLeft: tLeft ?? undefined,
      tRight: tRight ?? undefined,
    },
  }
}

export class SnapDemo {
  constructor(els, timing = {}) {
    this.els = els
    this.timing = { ...DEFAULT_TIMING, ...timing }
    this.running = false
    this.paused = false
    this.loopToken = 0
    this.rafId = undefined
    this.fullRect = { top: 0, left: 0, width: 0, height: 0 }
    this.cursorGrip = { top: 18, left: 20 }
    this.session = new SnapDragSession(els.window, els.screens, els.inset, () => this.cursorGrip)
  }

  setPaused(paused) {
    this.paused = paused
    if (paused) this.stopLoop()
    else if (isElementInView(this.els.root)) this.startLoop()
  }

  stopLoop() {
    this.loopToken++
    this.running = false
    if (this.computeRects()) this.session.resetDrag(this.fullRect)
    else this.session.resetDrag()
    this.clearZoneActive()
    this.els.ghost.style.removeProperty('opacity')
    this.hideDragPreview()
    this.els.layer.setAttribute('hidden', '')
  }

  startLoop() {
    if (this.running || this.paused || !isElementInView(this.els.root)) return
    this.running = true
    this.els.layer.removeAttribute('hidden')
    this.hideDragPreview()
    const token = ++this.loopToken

    ;(async () => {
      while (token === this.loopToken && !this.paused) {
        if (!this.computeRects()) break
        this.session.resetDrag(this.fullRect)

        for (const zoneKey of shuffle(this.getActiveZoneKeys())) {
          if (token !== this.loopToken || this.paused) break
          await this.playZoneStep(zoneKey, token)
          if (token !== this.loopToken || this.paused) break
          await new Promise((r) => window.setTimeout(r, this.timing.pauseBetweenMs))
        }
      }
    })().finally(() => {
      if (token === this.loopToken) this.running = false
    })
  }

  getActiveZoneKeys() {
    if (!this.els.bezelFull) {
      return ALL_SNAP_ZONE_KEYS.filter(
        (key) => key !== 'full' && key !== 't-left' && key !== 't-right',
      )
    }
    return ALL_SNAP_ZONE_KEYS
  }

  computeRects() {
    const { w, h } = measureInset(this.els.inset)
    if (w === 0 || h === 0) return false
    this.fullRect = { left: 0, top: 0, width: w, height: h }
    return true
  }

  setActivePreview(zoneKey) {
    const mode = ZONE_PREVIEW_MODE[zoneKey]
    const previews = [
      { mode: 'vertical', el: this.els.bezelVertical },
      { mode: 'horizontal', el: this.els.bezelHorizontal },
      { mode: 'full', el: this.els.bezelFull },
      { mode: 'thirds', el: this.els.bezelThirds },
    ]

    if (this.timing.bothBezelsVisible) {
      for (const preview of previews) {
        if (!preview.el) continue
        preview.el.removeAttribute('hidden')
        preview.el.classList.toggle('is-snap-preview-active', preview.mode === mode)
      }
      syncSnapPreviewSizes()
      return
    }

    for (const preview of previews) {
      if (!preview.el) continue
      preview.el.toggleAttribute('hidden', preview.mode !== mode)
      preview.el.classList.remove('is-snap-preview-active')
    }
    syncSnapPreviewSizes()
  }

  clearZoneActive() {
    Object.values(this.els.zones).forEach((zone) => zone?.classList.remove('is-zone-active'))
  }

  showDragPreview() {
    this.els.preview.removeAttribute('hidden')
  }

  hideDragPreview() {
    this.els.preview.setAttribute('hidden', '')
    for (const el of [
      this.els.bezelVertical,
      this.els.bezelHorizontal,
      this.els.bezelFull,
      this.els.bezelThirds,
    ]) {
      el?.classList.remove('is-snap-preview-active')
    }
  }

  highlightTargetZone(zoneEl, cursorTopPct, cursorLeftPct) {
    this.clearZoneActive()
    const point = getCursorPoint(this.els.screens, this.els.cursor, cursorTopPct, cursorLeftPct)
    if (!point) return false

    const zoneRect = zoneEl.getBoundingClientRect()
    const over =
      point.x >= zoneRect.left &&
      point.x <= zoneRect.right &&
      point.y >= zoneRect.top &&
      point.y <= zoneRect.bottom

    if (over) {
      zoneEl.classList.add('is-zone-active')
      return true
    }
    return false
  }

  setCursorPathForZone(zoneEl) {
    const path = measureCursorPath(this.els.screens, this.els.window, zoneEl)
    if (!path) return null
    this.cursorGrip = path.grip
    return path
  }

  prepareDragPreview(zoneKey) {
    this.setActivePreview(zoneKey)
    this.showDragPreview()
  }

  getZoneEl(zoneKey) {
    const { zones } = this.els
    const map = {
      tl: zones.tl,
      tr: zones.tr,
      bl: zones.bl,
      br: zones.br,
      'h-left': zones.hLeft,
      'h-right': zones.hRight,
      full: zones.full,
      't-left': zones.tLeft,
      't-right': zones.tRight,
    }
    const el = map[zoneKey]
    if (!el) throw new Error(`Missing snap zone: ${zoneKey}`)
    return el
  }

  async playZoneStep(zoneKey, loopToken) {
    if (this.paused || loopToken !== this.loopToken || !this.computeRects()) return

    const zoneEl = this.getZoneEl(zoneKey)
    const startRect = this.session.readWindowInsetRect()
    const endRect = getZoneEndRect(this.els.inset, zoneKey)

    this.prepareDragPreview(zoneKey)
    const cursorPath = this.setCursorPathForZone(zoneEl)
    if (!cursorPath) return

    await playSnapStep({
      durationMs: this.timing.stepDurationMs,
      holdAfterMs: this.timing.holdAfterMs,
      shouldCancel: () => this.paused || loopToken !== this.loopToken,
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
      onSnapPhaseStart: () => this.hideDragPreview(),
      onDragTick: (top, left) => this.highlightTargetZone(zoneEl, top, left),
      onSnapTick: () => zoneEl.classList.add('is-zone-active'),
      onHoldTick: () => zoneEl.classList.add('is-zone-active'),
      onEnd: () => this.clearZoneActive(),
      scheduleFrame: (cb) => {
        this.rafId = requestAnimationFrame(cb)
        return this.rafId
      },
    })
  }
}
