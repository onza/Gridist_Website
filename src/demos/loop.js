export const observeInView = (root, options) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (options.canRun && !options.canRun()) return
        if (entry.isIntersecting) options.onEnter()
        else options.onLeave()
      })
    },
    { threshold: options.threshold ?? 0.2 },
  )

  observer.observe(root)
  return () => observer.disconnect()
}

export const isElementInView = (el) => {
  const rect = el.getBoundingClientRect()
  return rect.top < window.innerHeight && rect.bottom > 0
}
