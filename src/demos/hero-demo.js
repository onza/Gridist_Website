import { DEMO_CONFIG } from './demo-config.js'
import { sleep } from './math.js'
import { getMonitorInset, gridMetrics, measureInset } from './layout/grid.js'
import { applyRect, hiddenWindow } from './layout/rects.js'
import { syncLayoutTokens, WIN_GAP } from './layout/tokens.js'
import {
  applyWindowLayouts as applyMorphLayouts,
  captureWindowRects,
  morphWindows,
} from './profile/morph.js'
import { HeroSnapDemo, queryHeroSnapElements } from './hero-snap-demo.js'

const PROFILE_WINDOWS = ['ide', 'browser', 'slack', 'mail']

const layouts = {
  desktop: {
    title: 'Desktop Monitor',
    screens: 'dual',
  },
  laptop: {
    title: 'MacBook Pro Monitor',
    screens: 'single',
  },
}

export const initHeroDemo = () => {
  const {
    snapEnabled,
    profileEnabled,
    combinedLoop,
    loopMonitorHoldMs,
    loopSnapPlayMs,
    profileMorphMs,
  } = DEMO_CONFIG

  const demoIndicator = document.querySelector('[data-demo-indicator]')
  const macTitle = document.querySelector('[data-mac-title]')
  const heroVisual = document.querySelector('[data-hero-visual]')

  if (!heroVisual) return null

  const heroSnapEls = queryHeroSnapElements(heroVisual)
  const heroSnapDemo = heroSnapEls
    ? new HeroSnapDemo(heroSnapEls, { stepDurationMs: loopSnapPlayMs })
    : null

  let mailDesktopHeight = 'full'
  let currentMode = 'profile'
  let currentSetup = 'desktop'
  let userPaused = false
  let profileMorphRaf
  let combinedLoopToken = 0
  let combinedLoopRunning = false

  const getProfileWindow = (key) => document.querySelector(`[data-window="${key}"]`)

  const computeProfileWindows = (setup) => {
    const primaryInset = getMonitorInset(document.querySelector('.monitor-primary'))
    const secondaryInset = getMonitorInset(document.querySelector('.monitor-secondary'))
    const primary = measureInset(primaryInset)
    if (primary.w === 0 || primary.h === 0) return {}

    const windows = {}

    if (setup === 'desktop') {
      const { colW, row1H, row2H, row2Top } = gridMetrics(primary.w, primary.h, WIN_GAP)

      windows.ide = { left: 0, top: 0, width: colW, height: row1H }
      windows.browser = { left: colW + WIN_GAP, top: 0, width: colW, height: row1H }
      windows.slack = { left: 0, top: row2Top, width: primary.w, height: row2H }

      const secondary = measureInset(secondaryInset)
      const mailW = secondary.w > 0 ? secondary.w : primary.w
      const mailH = secondary.h > 0 ? secondary.h : primary.h
      const mailHeight =
        mailDesktopHeight === 'half-top' ? gridMetrics(mailW, mailH, WIN_GAP).row1H : mailH
      windows.mail = { left: 0, top: 0, width: mailW, height: mailHeight, opacity: '1' }
    } else {
      const { colW } = gridMetrics(primary.w, primary.h, WIN_GAP)
      windows.ide = { left: 0, top: 0, width: colW, height: primary.h }
      windows.browser = { left: colW + WIN_GAP, top: 0, width: colW, height: primary.h }
      windows.slack = { ...hiddenWindow }
      windows.mail = { ...hiddenWindow }
    }

    return windows
  }

  const stopProfileMorph = () => {
    if (profileMorphRaf !== undefined) {
      cancelAnimationFrame(profileMorphRaf)
      profileMorphRaf = undefined
    }
  }

  const startProfileMorph = (from, to, onComplete) => {
    stopProfileMorph()
    morphWindows({
      keys: PROFILE_WINDOWS,
      getElement: getProfileWindow,
      from,
      to,
      durationMs: profileMorphMs,
      apply: (el, rect) => applyRect(el, rect),
      shouldCancel: () => userPaused,
      onRaf: (id) => {
        profileMorphRaf = id
      },
    }).then(() => {
      profileMorphRaf = undefined
      onComplete()
    })
  }

  const applyWindowLayouts = (windowLayouts, disableTransition = false) => {
    applyMorphLayouts(
      PROFILE_WINDOWS,
      windowLayouts,
      getProfileWindow,
      (el, rect) => applyRect(el, rect),
      {
        disableTransition,
      },
    )
  }

  const applyProfileLayout = (setup, opts) => {
    const config = layouts[setup]
    const macScreens = document.querySelector('[data-mac-screens]')
    const secondaryScreen = document.querySelector('.monitor-secondary')

    if (macTitle) {
      macTitle.textContent = config.title
    }

    const fromRects = captureWindowRects(PROFILE_WINDOWS, getProfileWindow)
    const shouldMorph =
      !opts?.instant && PROFILE_WINDOWS.some((key) => (fromRects[key]?.width ?? 0) > 0)

    macScreens?.classList.add('is-layout-switching')
    macScreens?.classList.toggle('is-single', config.screens === 'single')
    secondaryScreen?.classList.toggle('is-hidden', config.screens === 'single')

    syncLayoutTokens()
    void macScreens?.offsetWidth

    const toRects = computeProfileWindows(setup)

    const finishLayout = () => {
      macScreens?.classList.remove('is-layout-switching')
      applyWindowLayouts(toRects, true)
    }

    if (shouldMorph) {
      startProfileMorph(fromRects, toRects, finishLayout)
    } else {
      stopProfileMorph()
      finishLayout()
    }

    currentSetup = setup
  }

  const setDemoMode = (mode, opts) => {
    if (!snapEnabled && mode === 'snap') mode = 'profile'
    if (!profileEnabled && mode === 'profile') mode = 'snap'
    currentMode = mode

    demoIndicator?.querySelectorAll('[data-demo-phase]').forEach((phase) => {
      const active = phase.dataset.demoPhase === mode
      phase.classList.toggle('is-active', active)
    })

    const phaseLabel = mode === 'snap' ? 'Window Snap' : 'Fenster-Gedächtnis'
    demoIndicator?.setAttribute('aria-label', phaseLabel)

    if (macTitle) {
      macTitle.textContent = layouts[currentSetup].title
    }

    if (mode === 'profile') {
      heroSnapDemo?.resetState()
      heroSnapDemo?.setLayerVisible(false)
      applyProfileLayout(currentSetup, opts?.instantLayout ? { instant: true } : undefined)
    } else {
      heroSnapDemo?.setLayerVisible(true)
      if (!opts?.keepLayout) {
        currentSetup = 'desktop'
        applyProfileLayout('desktop')
      }
      heroSnapDemo?.resetState()
    }
  }

  const stopCombinedFeatureLoop = () => {
    combinedLoopToken++
    combinedLoopRunning = false
    mailDesktopHeight = 'full'
    heroSnapDemo?.resetState()
    stopProfileMorph()
  }

  const startCombinedFeatureLoop = () => {
    if (combinedLoopRunning) return
    if (!snapEnabled || !profileEnabled) return

    combinedLoopRunning = true
    const token = ++combinedLoopToken

    ;(async () => {
      await sleep(loopMonitorHoldMs)
      if (token !== combinedLoopToken || userPaused) return

      while (token === combinedLoopToken) {
        if (userPaused) break

        setDemoMode('snap', { keepLayout: true })
        if (mailDesktopHeight === 'full') {
          await heroSnapDemo?.playStep('vertical-half', () => userPaused)
          mailDesktopHeight = 'half-top'
        } else {
          await heroSnapDemo?.playStep('restore-full', () => userPaused)
          mailDesktopHeight = 'full'
        }
        if (token !== combinedLoopToken || userPaused) break

        currentSetup = 'desktop'
        setDemoMode('profile')
        await sleep(loopMonitorHoldMs)
        if (token !== combinedLoopToken || userPaused) break

        currentSetup = 'laptop'
        setDemoMode('profile')
        await sleep(loopMonitorHoldMs)
        if (token !== combinedLoopToken || userPaused) break

        currentSetup = 'desktop'
        applyProfileLayout('desktop')
        await sleep(loopMonitorHoldMs)
        if (token !== combinedLoopToken || userPaused) break
      }
    })().finally(() => {
      combinedLoopRunning = false
    })
  }

  heroVisual.addEventListener('mouseenter', () => {
    userPaused = true
    stopCombinedFeatureLoop()
  })

  heroVisual.addEventListener('mouseleave', () => {
    userPaused = false
    if (combinedLoop) startCombinedFeatureLoop()
  })

  if (!snapEnabled) {
    demoIndicator?.setAttribute('hidden', '')
  } else {
    demoIndicator?.removeAttribute('hidden')
  }

  if (!profileEnabled) {
    demoIndicator?.querySelector('[data-demo-phase="profile"]')?.setAttribute('hidden', '')
  } else {
    demoIndicator?.querySelector('[data-demo-phase="profile"]')?.removeAttribute('hidden')
  }

  currentSetup = 'desktop'
  const startHeroLoop = () => {
    if (combinedLoop && profileEnabled && snapEnabled) {
      setDemoMode('profile', { instantLayout: true })
      syncLayoutTokens()
      startCombinedFeatureLoop()
    }
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(startHeroLoop)
  })

  return {
    isPaused: () => userPaused,
    onResize: () => {
      syncLayoutTokens()
      if (currentMode === 'profile') {
        applyProfileLayout(currentSetup)
      } else {
        applyProfileLayout('desktop', { instant: true })
        heroSnapDemo?.resetState()
      }
    },
  }
}
