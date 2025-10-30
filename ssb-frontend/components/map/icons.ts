import L from 'leaflet'

function svgCircle(color: string, size = 28) {
  const r = Math.floor(size / 2 - 2)
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
      <circle cx='${size/2}' cy='${size/2}' r='${r}' fill='${color}' stroke='white' stroke-width='2' />
    </svg>
  `)}`
}

  export function createBusIcon(color = '#2563eb', size = 32) {
  return L.icon({
      iconUrl: svgCircle(color, size),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    className: 'ssb-bus-icon',
  })
}

export function createStopIcon(size = 26) {
  return L.icon({
    iconUrl: svgCircle('#10b981', size),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    className: 'ssb-stop-icon',
  })
}

  function svgPin(color: string, width = 28, height = 36) {
    // Simple pin SVG: circle head + pointed tail
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>
        <path d='M ${width / 2} ${height} C ${width / 2} ${height} ${width * 0.95} ${height * 0.55} ${width * 0.95} ${height * 0.35} C ${width * 0.95} ${height * 0.15} ${width * 0.75} 0 ${width / 2} 0 C ${width * 0.25} 0 ${width * 0.05} ${height * 0.15} ${width * 0.05} ${height * 0.35} C ${width * 0.05} ${height * 0.55} ${width / 2} ${height} ${width / 2} ${height} Z' fill='${color}' stroke='white' stroke-width='2' />
        <circle cx='${width / 2}' cy='${height * 0.28}' r='${Math.floor(width * 0.18)}' fill='white' />
      </svg>`
    )}`
  }

  export function createStopPinIcon(color = '#ef4444', width = 28, height = 36) {
    return L.icon({
      iconUrl: svgPin(color, width, height),
      iconSize: [width, height],
      iconAnchor: [width / 2, height],
      popupAnchor: [0, -height + 8],
      className: 'ssb-stop-pin-icon',
    })
  }

  export default { createBusIcon, createStopIcon, createStopPinIcon }
