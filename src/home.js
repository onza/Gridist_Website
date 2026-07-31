import './site.js'
import { initHeroDemo } from './demos/hero-demo.js'
import { initSectionDemos } from './demos/init-section-demos.js'
import { isElementInView } from './demos/loop.js'

const heroDemo = initHeroDemo()
initSectionDemos(heroDemo)

const relayoutDemos = () => {
  heroDemo?.onResize()
}

requestAnimationFrame(() => {
  requestAnimationFrame(relayoutDemos)
})

window.addEventListener('load', relayoutDemos)
document.fonts?.ready.then(relayoutDemos)

const revealEls = document.querySelectorAll(
  '.feature-tile, .how-row, .profile-demo, .snap-demo, .download-action, .install-panel',
)
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        revealObserver.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
)
revealEls.forEach((el) => {
  revealObserver.observe(el)
  if (isElementInView(el)) {
    el.classList.add('is-visible')
    revealObserver.unobserve(el)
  }
})
