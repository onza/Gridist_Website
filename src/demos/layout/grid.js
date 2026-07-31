export const getMonitorInset = (monitor) => monitor?.querySelector('.monitor-inset') ?? null

export const measureInset = (inset) => {
  if (!inset) return { w: 0, h: 0 }
  const rect = inset.getBoundingClientRect()
  return { w: Math.round(rect.width), h: Math.round(rect.height) }
}

export const gridMetrics = (w, h, gap) => {
  const colW = (w - gap) / 2
  const row1H = (h - gap) / 2
  const row2Top = row1H + gap
  const row2H = h - row2Top
  return { colW, row1H, row2H, row2Top }
}
