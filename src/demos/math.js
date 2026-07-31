export const lerp = (a, b, t) => a + (b - a) * t

export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2

export const quadBezier = (p0, p1, p2, t) => {
  const u = 1 - t
  return u * u * p0 + 2 * u * t * p1 + t * t * p2
}

export const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms))

export const shuffle = (items) => {
  const list = [...items]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}
