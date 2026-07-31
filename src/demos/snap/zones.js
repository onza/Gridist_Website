import { gridMetrics, measureInset } from '../layout/grid.js'
import { WIN_GAP } from '../layout/tokens.js'

export const ALL_SNAP_ZONE_KEYS = [
  'tl',
  'tr',
  'bl',
  'br',
  'h-left',
  'h-right',
  'full',
  't-left',
  't-right',
]

export const getZoneEndRect = (inset, zoneKey) => {
  const { w, h } = measureInset(inset)
  const { colW, row1H, row2H, row2Top } = gridMetrics(w, h, WIN_GAP)
  const thirdW = (w - 2 * WIN_GAP) / 3

  switch (zoneKey) {
    case 'tl':
      return { left: 0, top: 0, width: colW, height: row1H }
    case 'tr':
      return { left: colW + WIN_GAP, top: 0, width: colW, height: row1H }
    case 'bl':
      return { left: 0, top: row2Top, width: colW, height: row2H }
    case 'br':
      return { left: colW + WIN_GAP, top: row2Top, width: colW, height: row2H }
    case 'h-left':
      return { left: 0, top: 0, width: colW, height: h }
    case 'h-right':
      return { left: colW + WIN_GAP, top: 0, width: colW, height: h }
    case 'full':
      return { left: 0, top: 0, width: w, height: h }
    case 't-left':
      return { left: 0, top: 0, width: thirdW * 2 + WIN_GAP, height: h }
    case 't-right':
      return { left: thirdW * 2 + 2 * WIN_GAP, top: 0, width: thirdW, height: h }
  }
}
