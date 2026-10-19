// Water around the reserve for the Residences 3D map: the creek, the sea and the ponds as polygons
// (from the same OpenMapTiles data the map draws), plus open-water spots where boats can sit.
// Saved to src/data/water.json.   npm run water
import { writeFileSync } from 'node:fs'
import { VectorTile, classifyRings } from '@mapbox/vector-tile'
import { PbfReader } from 'pbf'
import { SITE } from '../src/data/content.js'

// the area the Residences camera can see, around the plot
const BOX = { w: SITE.at[0] - 0.115, e: SITE.at[0] + 0.085, s: SITE.at[1] - 0.06, n: SITE.at[1] + 0.085 }
const Z = 12
const OUT = new URL('../src/data/water.json', import.meta.url)
// boats only go on the sea and the creeks, never on ponds or salt pans
const OPEN = ['ocean', 'river']

const RAD = Math.PI / 180
const lngOf = (x) => (x / 2 ** Z) * 360 - 180
const latOf = (y) => Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** Z))) / RAD
const tileX = (lng) => Math.floor(((lng + 180) / 360) * 2 ** Z)
const tileY = (lat) => Math.floor(((1 - Math.log(Math.tan(lat * RAD) + 1 / Math.cos(lat * RAD)) / Math.PI) / 2) * 2 ** Z)
const metres = ([lng, lat]) => [(lng - SITE.at[0]) * RAD * 6378137 * Math.cos(SITE.at[1] * RAD), (lat - SITE.at[1]) * RAD * 6378137]

// Sutherland–Hodgman against one axis-aligned edge
function clip(ring, axis, limit, keepBelow) {
  const inside = (p) => (keepBelow ? p[axis] <= limit : p[axis] >= limit)
  const out = []
  ring.forEach((p, i) => {
    const q = ring[(i + 1) % ring.length]
    const a = inside(p)
    const b = inside(q)
    if (a) out.push(p)
    if (a !== b) {
      const t = (limit - p[axis]) / (q[axis] - p[axis])
      out.push(axis === 'x' ? { x: limit, y: p.y + (q.y - p.y) * t } : { x: p.x + (q.x - p.x) * t, y: limit })
    }
  })
  return out
}
const clipToTile = (ring, extent) => [['x', 0, false], ['x', extent, true], ['y', 0, false], ['y', extent, true]].reduce((r, [axis, lim, below]) => (r.length ? clip(r, axis, lim, below) : r), ring)

// Douglas–Peucker in metres. A closed ring is opened at its far point first, since a chain that
// starts and ends on the same point has no baseline to measure against.
function simplifyRing(ring, tol) {
  const open = ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring.slice(0, -1) : ring
  if (open.length < 4) return open
  const m = open.map(metres)
  let far = 0
  m.forEach(([x, y], i) => Math.hypot(x - m[0][0], y - m[0][1]) > Math.hypot(m[far][0] - m[0][0], m[far][1] - m[0][1]) && (far = i))
  const a = simplify(open.slice(0, far + 1), tol)
  const b = simplify([...open.slice(far), open[0]], tol)
  return [...a, ...b.slice(1, -1)]
}

function simplify(pts, tol) {
  if (pts.length < 3) return pts
  const m = pts.map(metres)
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    let best = 0
    let at = -1
    const [ax, ay] = m[a]
    const [bx, by] = m[b]
    const len = Math.hypot(bx - ax, by - ay) || 1
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - m[i][1]) - (ax - m[i][0]) * (by - ay)) / len
      if (d > best) {
        best = d
        at = i
      }
    }
    if (best > tol) {
      keep[at] = 1
      stack.push([a, at], [at, b])
    }
  }
  return pts.filter((_, i) => keep[i])
}

const area = (ring) => Math.abs(ring.map(metres).reduce((s, [x, y], i, a) => s + x * a[(i + 1) % a.length][1] - a[(i + 1) % a.length][0] * y, 0) / 2)
const round = ([lng, lat]) => [Math.round(lng * 1e6) / 1e6, Math.round(lat * 1e6) / 1e6]

const tilejson = await (await fetch('https://tiles.openfreemap.org/planet')).json()
const template = tilejson.tiles[0]
const polygons = []
for (let x = tileX(BOX.w); x <= tileX(BOX.e); x++) {
  for (let y = tileY(BOX.n); y <= tileY(BOX.s); y++) {
    const buf = new Uint8Array(await (await fetch(template.replace('{z}', Z).replace('{x}', x).replace('{y}', y))).arrayBuffer())
    const layer = new VectorTile(new PbfReader(buf)).layers.water
    for (let i = 0; i < (layer?.length ?? 0); i++) {
      const f = layer.feature(i)
      if (f.type !== 3 || f.properties.brunnel === 'tunnel') continue
      const rings = f.loadGeometry().map((r) => clipToTile(r, layer.extent)).filter((r) => r.length >= 3)
      if (!rings.length) continue
      for (const poly of classifyRings(rings)) {
        if (!poly.length) continue
        const geo = poly.map((ring) => ring.map((p) => [lngOf(x + p.x / layer.extent), latOf(y + p.y / layer.extent)]))
        if (area(geo[0]) < 800) continue
        const [outer, ...holes] = geo.map((ring) => simplifyRing(ring, 1.5).map(round))
        if (outer.length < 3) continue
        polygons.push({ open: OPEN.includes(f.properties.class), kind: f.properties.class, rings: [outer, ...holes.filter((ring) => ring.length >= 3)] })
      }
    }
  }
}

const insideRing = ([px, py], ring) => {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
const insidePolygon = (p, rings) => insideRing(p, rings[0]) && !rings.slice(1).some((h) => insideRing(p, h))

// Water mapped twice (a lake drawn over the creek, a stretch of creek inside another) fights the
// open water around it for the same pixels and flickers as the camera moves. Anything lying
// mostly inside open water is already covered by it, so it goes.
// (The probes are points inside each polygon: its outline can run along a neighbour's, where
// water cut at a tile edge meets the next tile's.)
const doubled = polygons.filter(({ rings }, i) => {
  const xs = rings[0].map((p) => p[0])
  const ys = rings[0].map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const probes = []
  for (let a = 0.5; a < 8; a++) for (let b = 0.5; b < 8; b++) probes.push([x0 + ((x1 - x0) * a) / 8, y0 + ((y1 - y0) * b) / 8])
  const own = probes.filter((p) => insidePolygon(p, rings))
  const covered = own.filter((p) => polygons.some((q, j) => j !== i && q.open && insidePolygon(p, q.rings)))
  return own.length > 0 && covered.length >= own.length * 0.7
})
for (const p of doubled) polygons.splice(polygons.indexOf(p), 1)

// boats: open water (water all round for ~110 m), spread out by farthest-point sampling
const wet = (p) => polygons.some(({ open, rings }) => open && insidePolygon(p, rings))
const step = 0.0011
const open = []
for (let lat = BOX.s; lat <= BOX.n; lat += step) {
  for (let lng = BOX.w; lng <= BOX.e; lng += step) {
    const around = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
    if (around.every(([a, b]) => wet([lng + a * step, lat + b * step]))) open.push([lng, lat])
  }
}
// favour water a visitor actually sees: most boats on the creek nearest the site, a few further out
const km = ([lng, lat]) => Math.hypot(...metres([lng, lat])) / 1000
let r = 7
const rand = () => ((r = (r * 16807) % 2147483647) - 1) / 2147483646
const spots = []
function spread(pool, count) {
  if (!pool.length) return
  if (!spots.length) spots.push(pool.reduce((a, b) => (km(a) < km(b) ? a : b)))
  for (let n = 0; n < count; n++) {
    let best = null
    let bestD = -1
    for (const p of pool) {
      const d = Math.min(...spots.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1])))
      if (d > bestD) {
        bestD = d
        best = p
      }
    }
    spots.push(best)
  }
}
spread(open.filter((p) => km(p) < 6), 7)
spread(open.filter((p) => km(p) < 10), 4)
const boats = spots.map((at, i) => ({ at: round(at), heading: Math.round(rand() * 360), kind: i % 4 === 3 ? 'yacht' : 'fishing' }))

const pts = polygons.reduce((n, p) => n + p.rings.reduce((m, r) => m + r.length, 0), 0)
// `kinds` is each polygon's OpenMapTiles water class (ocean, river, lake, pond…): the sea and the
// creeks get waves, still water stays calm
const data = { origin: SITE.at, box: BOX, generated: new Date().toISOString().slice(0, 10), polygons: polygons.map((p) => p.rings), kinds: polygons.map((p) => p.kind), boats }
writeFileSync(OUT, JSON.stringify(data) + '\n')
const counts = polygons.reduce((c, p) => ({ ...c, [p.kind]: (c[p.kind] ?? 0) + 1 }), {})
console.log(`${polygons.length} water polygons (${pts} points; ${JSON.stringify(counts)}; ${doubled.length} doubled ones dropped), ${open.length} open-water cells, ${boats.length} boats -> ${OUT.pathname}`)
