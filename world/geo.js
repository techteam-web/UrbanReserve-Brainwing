const R = 6378137
const RAD = Math.PI / 180

// Local east/north metres around `origin` ([lng, lat]); accurate to centimetres over a few km.
export function toLngLat([lng, lat], e, n) {
  return [lng + e / (R * Math.cos(lat * RAD)) / RAD, lat + n / R / RAD]
}

export function toLocal([lng0, lat0], [lng, lat]) {
  return [(lng - lng0) * RAD * R * Math.cos(lat0 * RAD), (lat - lat0) * RAD * R]
}

export const distance = (a, b) => Math.hypot(...toLocal(a, b))

// Compass bearing (degrees clockwise from north) from a to b.
export function bearing(a, b) {
  const [e, n] = toLocal(a, b)
  return (Math.atan2(e, n) / RAD + 360) % 360
}

// Rotates plan coordinates (x east, y north) by `deg` clockwise, matching map bearings.
export function rotate([x, y], deg) {
  const r = -deg * RAD
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]
}

export const lerp = (a, b, t) => a + (b - a) * t

// Shortest signed turn from bearing a to bearing b, in degrees.
export const turn = (a, b) => ((((b - a) % 360) + 540) % 360) - 180
