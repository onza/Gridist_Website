import { DEMO_CONFIG } from './demo-config.js'
import { syncLayoutTokens } from './layout/tokens.js'
import { observeInView, isElementInView } from './loop.js'
import { ProfileDemo, queryProfileDemoElements } from './profile-demo.js'
import { SnapDemo, querySnapDemoElements } from './snap-demo.js'

export const initSectionDemos = (hero) => {
  syncLayoutTokens()
  const { loopSnapPlayMs } = DEMO_CONFIG
  const isPaused = () => hero?.isPaused() ?? false

  const schematicSnapRoot = document.querySelector('[data-snap-section-demo]')
  const schematicSnapEls = schematicSnapRoot ? querySnapDemoElements(schematicSnapRoot) : null
  const schematicSnapDemo = schematicSnapEls
    ? new SnapDemo(schematicSnapEls, {
        stepDurationMs: loopSnapPlayMs,
        pauseBetweenMs: 2200,
        holdAfterMs: 1400,
        bothBezelsVisible: true,
      })
    : null

  if (schematicSnapRoot && schematicSnapDemo) {
    observeInView(schematicSnapRoot, {
      canRun: () => !isPaused(),
      onEnter: () => schematicSnapDemo.startLoop(),
      onLeave: () => schematicSnapDemo.stopLoop(),
    })
  }

  const schematicProfileRoot = document.querySelector('[data-profile-section-demo]')
  const schematicProfileEls = schematicProfileRoot
    ? queryProfileDemoElements(schematicProfileRoot)
    : null
  const schematicProfileDemo = schematicProfileEls ? new ProfileDemo(schematicProfileEls) : null

  if (schematicProfileRoot && schematicProfileDemo) {
    observeInView(schematicProfileRoot, {
      canRun: () => !isPaused(),
      onEnter: () => schematicProfileDemo.startLoop(),
      onLeave: () => schematicProfileDemo.stopLoop(),
    })
  }

  window.addEventListener('resize', () => {
    syncLayoutTokens()
    hero?.onResize()

    schematicSnapDemo?.stopLoop()
    if (
      schematicSnapRoot &&
      schematicSnapDemo &&
      !isPaused() &&
      isElementInView(schematicSnapRoot)
    ) {
      schematicSnapDemo.startLoop()
    }

    schematicProfileDemo?.relayout()
    schematicProfileDemo?.stopLoop()
    if (
      schematicProfileRoot &&
      schematicProfileDemo &&
      !isPaused() &&
      isElementInView(schematicProfileRoot)
    ) {
      schematicProfileDemo.startLoop()
    }
  })
}
