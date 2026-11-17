/*
 * Night over the Location map: its colours taken down to moonlight, darker and leaning to blue,
 * while the orange of the reserve's edge and the drives is left as it is, so they glow. Every colour
 * in the style is moved, inside expressions too, so a colour added to style.js later goes dark with
 * the rest; the labels turn light. The day's paint is read from the map the first time.
 *
 * `setMapNight(map, k)` blends day (0) to night (1). MapLibre's own paint transitions can't be used:
 * the flat layers are painted into textures draped over the terrain, and those are only redrawn when
 * their tiles or zoom change, never for a paint change. So the blend is stepped (World calls it a
 * dozen times over the fade) and the draped textures are let go after each step.
 */
const day = new WeakMap()

function parse(s) {
  if (typeof s !== 'string') return null
  let m = s.match(/^#([0-9a-f]{6})$/i)
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(1)
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/i)
  return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null
}
const rgba = ([r, g, b, a]) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${+a.toFixed(3)})`

// the warm accents (the logo's orange) keep their colour after dark
const warm = ([r, g, b]) => r > 150 && r > g * 1.3 && g > b

// moonlight: darker, and leaning to blue
export function moonlit(s) {
  const c = parse(s)
  if (!c || warm(c)) return s
  const [r, g, b, a] = c
  return rgba([Math.min(255, r * 0.3 + 3), Math.min(255, g * 0.38 + 8), Math.min(255, b * 0.52 + 16), a])
}
const night = (v) => (Array.isArray(v) ? v.map(night) : moonlit(v))

// the blend of a day value and its night one: colours mixed, numbers eased, anything else switched halfway
function blend(d, n, k) {
  if (Array.isArray(d) && Array.isArray(n) && d.length === n.length) return d.map((v, i) => blend(v, n[i], k))
  const a = parse(d)
  const b = parse(n)
  if (a && b) return rgba(a.map((v, i) => v + (b[i] - v) * k))
  if (typeof d === 'number' && typeof n === 'number') return d + (n - d) * k
  return k < 0.5 ? d : n
}

const LIGHT_TEXT = 'rgba(232, 238, 242, 0.82)'
// set by hand: the blocks one deep slate-teal (by height they come out a dull maroon under the
// moon), and the labels light
const NIGHT_PAINT = {
  buildings: { 'fill-extrusion-color': '#1c3440' },
  'place-label': { 'text-color': LIGHT_TEXT },
  'road-label': { 'text-color': LIGHT_TEXT },
}

const NIGHT_SKY = {
  'sky-color': '#081521',
  'horizon-color': '#1d3346',
  'fog-color': '#0d1b27',
}
const NIGHT_LIGHT = { color: '#9fb6d2', intensity: 0.22 }

// lets go of the textures draped over the terrain, so they are painted again in the new colours
function redrape(map) {
  try {
    const tiles = map.terrain?.tileManager?.getRenderableTiles?.()
    if (tiles && map.painter) {
      for (const t of tiles) t.releaseRTT?.(map.painter)
      map.triggerRepaint()
      return
    }
  } catch {
    // MapLibre's internals have moved: fall back below
  }
  if (map.getTerrain()) map.setTerrain(map.getTerrain())
}

export function setMapNight(map, k) {
  if (!day.has(map)) {
    const style = map.getStyle()
    day.set(map, { layers: style.layers.map((l) => ({ id: l.id, paint: { ...l.paint } })), sky: style.sky, light: style.light })
  }
  const saved = day.get(map)
  for (const { id, paint } of saved.layers) {
    // the drives keep their colour, and their reveal belongs to World
    if (id.startsWith('route')) continue
    for (const [prop, value] of Object.entries(paint)) {
      if (!prop.endsWith('-color')) continue
      map.setPaintProperty(id, `${prop}-transition`, { duration: 0, delay: 0 })
      map.setPaintProperty(id, prop, blend(value, NIGHT_PAINT[id]?.[prop] ?? night(value), k))
    }
  }
  if (saved.sky) map.setSky(Object.fromEntries(Object.entries(saved.sky).map(([p, v]) => [p, blend(v, NIGHT_SKY[p] ?? v, k)])))
  if (saved.light) map.setLight({ ...saved.light, color: blend(saved.light.color, NIGHT_LIGHT.color, k), intensity: blend(saved.light.intensity, NIGHT_LIGHT.intensity, k) })
  redrape(map)
}
