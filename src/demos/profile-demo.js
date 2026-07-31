import { WIN_GAP } from './layout/tokens.js'
import { gridMetrics, measureInset } from './layout/grid.js'
import { applyProfileRect, hiddenWindow } from './layout/rects.js'
import { isElementInView } from './loop.js'
import { captureWindowRects, morphWindows } from './profile/morph.js'

const WINDOW_KEYS = ['1', '2', '3', '4']

const DEFAULT_TIMING = {
  morphMs: 700,
  holdDesktopMs: 2800,
  holdLaptopMs: 2800,
  pauseBetweenMs: 1800,
}

export const queryProfileDemoElements = (root) => {
  const screens = root.querySelector('[data-profile-demo-screens]')
  const inset = screens?.querySelector('.monitor-inset')
  const title = root.querySelector('[data-profile-demo-title]')

  const windows = {}
  for (const key of WINDOW_KEYS) {
    const el = root.querySelector(`[data-profile-window="${key}"]`)
    if (!el) return null
    windows[key] = el
  }

  if (!screens || !inset) return null

  return { root, screens, inset, title, windows }
}

export class ProfileDemo {
  constructor(els, timing = {}) {
    this.els = els
    this.timing = { ...DEFAULT_TIMING, ...timing }
    this.running = false
    this.paused = false
    this.loopToken = 0
    this.morphRaf = undefined
    this.setup = 'desktop'
    this.applyLayout('desktop')
  }

  setPaused(paused) {
    this.paused = paused
    if (paused) this.stopLoop()
    else if (isElementInView(this.els.root)) this.startLoop()
  }

  getWindow = (key) => this.els.windows[key] ?? null

  computeWindows(setup) {
    const { w, h } = measureInset(this.els.inset)
    if (w === 0 || h === 0) return {}

    if (setup === 'desktop') {
      const leftW = (w - WIN_GAP) / 2
      const rightLeft = leftW + WIN_GAP
      const rightW = (w - WIN_GAP) / 2
      const { colW, row1H, row2H, row2Top } = gridMetrics(leftW, h, WIN_GAP)

      return {
        1: { left: 0, top: 0, width: colW, height: row1H },
        2: { left: colW + WIN_GAP, top: 0, width: colW, height: row1H },
        3: { left: 0, top: row2Top, width: leftW, height: row2H },
        4: { left: rightLeft, top: 0, width: rightW, height: h },
      }
    }

    const { colW, row1H, row2H, row2Top } = gridMetrics(w, h, WIN_GAP)
    return {
      1: { left: 0, top: 0, width: colW, height: h },
      2: { left: colW + WIN_GAP, top: 0, width: colW, height: row1H },
      3: { left: colW + WIN_GAP, top: row2Top, width: colW, height: row2H },
      4: { ...hiddenWindow },
    }
  }

  setSetupLabel(setup) {
    this.setup = setup
    if (this.els.title) {
      this.els.title.textContent = setup === 'laptop' ? 'MacBook Pro Monitor' : 'Desktop Monitor'
    }
  }

  applyLayout(setup) {
    this.setSetupLabel(setup)
    const rects = this.computeWindows(setup)
    if (Object.keys(rects).length === 0) return

    for (const key of WINDOW_KEYS) {
      applyProfileRect(this.els.windows[key], rects[key] ?? hiddenWindow)
    }
  }

  stopMorph() {
    if (this.morphRaf !== undefined) {
      cancelAnimationFrame(this.morphRaf)
      this.morphRaf = undefined
    }
  }

  morphTo(setup) {
    const from = captureWindowRects(WINDOW_KEYS, this.getWindow)
    this.setSetupLabel(setup)
    const to = this.computeWindows(setup)

    return morphWindows({
      keys: WINDOW_KEYS,
      getElement: this.getWindow,
      from,
      to,
      durationMs: this.timing.morphMs,
      apply: applyProfileRect,
      shouldCancel: () => this.paused,
      onRaf: (id) => {
        this.morphRaf = id
      },
    }).then(() => {
      this.morphRaf = undefined
      this.applyLayout(setup)
    })
  }

  wait(ms, token) {
    return new Promise((resolve) => {
      window.setTimeout(() => {
        if (token === this.loopToken && !this.paused) resolve()
      }, ms)
    })
  }

  stopLoop() {
    this.loopToken++
    this.running = false
    this.stopMorph()
    this.applyLayout('desktop')
  }

  startLoop() {
    if (this.running || this.paused || !isElementInView(this.els.root)) return

    const desktopRects = this.computeWindows('desktop')
    if (Object.keys(desktopRects).length === 0) return

    this.running = true
    this.applyLayout('desktop')
    const token = ++this.loopToken

    ;(async () => {
      await this.wait(400, token)
      if (token !== this.loopToken || this.paused) return

      while (token === this.loopToken && !this.paused) {
        await this.wait(this.timing.holdDesktopMs, token)
        if (token !== this.loopToken || this.paused) break

        await this.morphTo('laptop')
        if (token !== this.loopToken || this.paused) break

        await this.wait(this.timing.holdLaptopMs, token)
        if (token !== this.loopToken || this.paused) break

        await this.morphTo('desktop')
        if (token !== this.loopToken || this.paused) break

        await this.wait(this.timing.pauseBetweenMs, token)
      }
    })().finally(() => {
      if (token === this.loopToken) this.running = false
    })
  }

  relayout() {
    if (this.paused) return
    this.applyLayout(this.setup)
  }
}
