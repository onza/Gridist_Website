import { applyRect } from '../layout/rects.js'

export class SnapDragSession {
  constructor(windowEl, screens, inset, getCursorGrip) {
    this.dragGrip = { x: 0, y: 0 }
    this.dragSize = { width: 0, height: 0 }
    this.dragReparented = false
    this.windowEl = windowEl
    this.screens = screens
    this.inset = inset
    this.getCursorGrip = getCursorGrip
  }

  readRectRelativeTo(root) {
    const rootRect = root.getBoundingClientRect()
    const winRect = this.windowEl.getBoundingClientRect()
    return {
      top: winRect.top - rootRect.top,
      left: winRect.left - rootRect.left,
      width: winRect.width,
      height: winRect.height,
    }
  }

  readWindowInsetRect() {
    if (this.dragReparented) return this.readRectRelativeTo(this.inset)
    return {
      top: this.windowEl.offsetTop,
      left: this.windowEl.offsetLeft,
      width: this.windowEl.offsetWidth,
      height: this.windowEl.offsetHeight,
    }
  }

  measureDragGrip() {
    const screensRect = this.screens.getBoundingClientRect()
    const winRect = this.windowEl.getBoundingClientRect()
    const grip = this.getCursorGrip()
    const cursorX = (grip.left / 100) * screensRect.width
    const cursorY = (grip.top / 100) * screensRect.height
    const winX = winRect.left - screensRect.left
    const winY = winRect.top - screensRect.top

    this.dragGrip = { x: cursorX - winX, y: cursorY - winY }
    this.dragSize = { width: winRect.width, height: winRect.height }
  }

  beginDrag() {
    this.measureDragGrip()
    const rect = this.readRectRelativeTo(this.screens)
    applyRect(this.windowEl, rect)
    this.screens.appendChild(this.windowEl)
    this.dragReparented = true
    this.screens.classList.add('is-snap-dragging')
    this.windowEl.classList.add('is-dragging')
  }

  endDragToInset() {
    this.screens.classList.remove('is-snap-dragging')
    this.windowEl.classList.remove('is-dragging')

    const onScreens = this.windowEl.parentElement === this.screens
    if (!this.dragReparented && !onScreens) return this.readRectRelativeTo(this.inset)

    const mailRect = this.windowEl.getBoundingClientRect()
    const insetRect = this.inset.getBoundingClientRect()
    const rect = {
      top: mailRect.top - insetRect.top,
      left: mailRect.left - insetRect.left,
      width: mailRect.width,
      height: mailRect.height,
    }

    this.inset.appendChild(this.windowEl)
    applyRect(this.windowEl, rect)
    this.dragReparented = false
    return rect
  }

  applyAtCursor(cursorTopPct, cursorLeftPct) {
    const screensRect = this.screens.getBoundingClientRect()
    const cursorX = (cursorLeftPct / 100) * screensRect.width
    const cursorY = (cursorTopPct / 100) * screensRect.height

    applyRect(this.windowEl, {
      top: cursorY - this.dragGrip.y,
      left: cursorX - this.dragGrip.x,
      width: this.dragSize.width,
      height: this.dragSize.height,
    })
  }

  resetDrag(layout) {
    const onScreens = this.windowEl.parentElement === this.screens

    if (this.dragReparented || onScreens) {
      const insetRect = layout ?? this.readRectRelativeTo(this.inset)
      this.inset.appendChild(this.windowEl)
      applyRect(this.windowEl, insetRect)
      this.dragReparented = false
    } else if (layout) {
      applyRect(this.windowEl, layout)
    }

    this.screens.classList.remove('is-snap-dragging')
    this.windowEl.classList.remove('is-dragging')
  }
}
