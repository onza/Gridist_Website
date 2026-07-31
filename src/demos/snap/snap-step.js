import { easeInOutSine, lerp, quadBezier } from '../math.js'
import { applyRect } from '../layout/rects.js'

export const SNAP_STEP_DRAG_END = 0.58
export const SNAP_STEP_SNAP_END = 0.72

export const playSnapStep = ({
  durationMs,
  holdAfterMs = 0,
  shouldCancel,
  window: windowEl,
  cursor,
  ghost,
  startRect,
  endRect,
  cursorPath,
  session,
  onPrepare,
  onSnapPhaseStart,
  onDragTick,
  onSnapTick,
  onHoldTick,
  onEnd,
  scheduleFrame = requestAnimationFrame,
}) => {
  applyRect(windowEl, startRect)
  onPrepare?.()
  session.beginDrag()

  let snapFromRect = null
  let snapPrepared = false

  return new Promise((resolve) => {
    const start = performance.now()

    const tick = (now) => {
      if (shouldCancel()) {
        session.resetDrag(endRect)
        applyRect(ghost, endRect, 0)
        onEnd?.()
        return resolve()
      }

      const t = Math.min(1, (now - start) / durationMs)
      let ghostOpacity = 0

      if (t < SNAP_STEP_DRAG_END) {
        const e = easeInOutSine(t / SNAP_STEP_DRAG_END)
        const cursorTop = quadBezier(
          cursorPath.grip.top,
          cursorPath.ctrl.top,
          cursorPath.zone.top,
          e,
        )
        const cursorLeft = quadBezier(
          cursorPath.grip.left,
          cursorPath.ctrl.left,
          cursorPath.zone.left,
          e,
        )

        session.applyAtCursor(cursorTop, cursorLeft)
        cursor.style.top = `${cursorTop}%`
        cursor.style.left = `${cursorLeft}%`
        cursor.style.opacity = '1'

        if (onDragTick?.(cursorTop, cursorLeft)) ghostOpacity = 1
      } else if (t < SNAP_STEP_SNAP_END) {
        if (!snapPrepared) {
          snapFromRect = session.endDragToInset()
          snapPrepared = true
          onSnapPhaseStart?.()
        }

        const e = easeInOutSine(
          (t - SNAP_STEP_DRAG_END) / (SNAP_STEP_SNAP_END - SNAP_STEP_DRAG_END),
        )
        onSnapTick?.(e)

        const from = snapFromRect ?? startRect
        applyRect(windowEl, {
          top: lerp(from.top, endRect.top, e),
          left: lerp(from.left, endRect.left, e),
          width: lerp(from.width, endRect.width, e),
          height: lerp(from.height, endRect.height, e),
        })

        cursor.style.top = `${cursorPath.zone.top}%`
        cursor.style.left = `${cursorPath.zone.left}%`
        cursor.style.opacity = String(1 - e)
        ghostOpacity = 1 - e
      } else {
        onHoldTick?.()
        applyRect(windowEl, endRect)
        cursor.style.opacity = '0'
        ghostOpacity = 0
      }

      applyRect(ghost, endRect, ghostOpacity)

      if (t < 1) {
        scheduleFrame(tick)
      } else {
        session.resetDrag(endRect)
        applyRect(ghost, endRect, 0)
        onEnd?.()
        if (holdAfterMs > 0) {
          window.setTimeout(() => {
            if (!shouldCancel()) resolve()
          }, holdAfterMs)
        } else {
          resolve()
        }
      }
    }

    scheduleFrame(tick)
  })
}
