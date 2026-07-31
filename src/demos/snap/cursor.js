export const measureCursorPath = (screens, windowEl, zoneEl) => {
  const screenRect = screens.getBoundingClientRect()
  const winRect = windowEl.getBoundingClientRect()
  const zoneRect = zoneEl.getBoundingClientRect()

  if (screenRect.width === 0) return null

  const grip = {
    top: ((winRect.top + 9 - screenRect.top) / screenRect.height) * 100,
    left: ((winRect.left + winRect.width * 0.1 - screenRect.left) / screenRect.width) * 100,
  }

  const zone = {
    top: ((zoneRect.top + zoneRect.height / 2 - screenRect.top) / screenRect.height) * 100,
    left: ((zoneRect.left + zoneRect.width / 2 - screenRect.left) / screenRect.width) * 100,
  }

  return {
    grip,
    zone,
    ctrl: {
      top: (grip.top + zone.top) / 2 + 6,
      left: (grip.left + zone.left) / 2,
    },
  }
}

export const getCursorPoint = (screens, cursor, cursorTopPct, cursorLeftPct) => {
  if (cursorTopPct !== undefined && cursorLeftPct !== undefined) {
    const bounds = screens.getBoundingClientRect()
    return {
      x: bounds.left + (cursorLeftPct / 100) * bounds.width,
      y: bounds.top + (cursorTopPct / 100) * bounds.height,
    }
  }

  if (!cursor) return null
  const rect = cursor.getBoundingClientRect()
  return { x: rect.left + 2, y: rect.top + 2 }
}

export const highlightZoneAtPoint = (point, zones) => {
  for (const zone of zones) {
    const zoneRect = zone.getBoundingClientRect()
    const over =
      point.x >= zoneRect.left &&
      point.x <= zoneRect.right &&
      point.y >= zoneRect.top &&
      point.y <= zoneRect.bottom

    if (over) {
      zone.classList.add('is-zone-active')
      return zone
    }
  }

  return null
}
