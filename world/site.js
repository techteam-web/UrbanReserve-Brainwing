import { rng } from '../art/rng'
import { SITE } from '../data/content'
import { rotate, toLngLat } from './geo'

/*
 * The plot, traced from the ground-level plan (plan-ground.webp) at ~0.125 m/px.
 * Plan metres: x east, y north, origin between the towers. SITE.heading turns the whole plan.
 */
export const PLOT = [
  [-83, 22.5],
  [92.5, 33],
  [15.5, -62],
  [-32, -62],
]

export const PODIUM = [
  [-49, 21.5],
  [59.5, 21.5],
  [59.5, 12.5],
  [32, -17.5],
  [-20.5, -17.5],
  [-49, 12.5],
]

export const PODIUM_H = 12.8
export const FLOOR_H = 3.2
export const FLOORS = 24
export const TOWER_H = PODIUM_H + FLOORS * FLOOR_H

export const TOWERS = [
  { id: 'a', at: [-25, 2.5] },
  { id: 'b', at: [24.5, 2.5] },
]

const DRIVE = [
  [-30, -62],
  [-37, -49],
  [-53, -24],
  [-67, 0],
  [-77, 18],
]
const COURT = [
  [-37, -47],
  [-24, -28],
  [6, -25],
  [30, -23],
]
export const PONDS = [
  { at: [-3, -46], r: [9, 4.2], rot: 12 },
  { at: [11, -38], r: [6, 3], rot: -20 },
  { at: [-20, -38], r: [4, 2.4], rot: 30 },
]

const inside = (pt, poly) => {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

function segDist([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}

const lineDist = (pt, line) => Math.min(...line.slice(1).map((b, i) => segDist(pt, line[i], b)))
const edgeDist = (pt, poly) => lineDist(pt, [...poly, poly[0]])

// Convex polygon shrunk by `d` metres (each edge moved inwards, neighbours re-intersected).
export function inset(poly, d) {
  const n = poly.length
  const ccw = poly.reduce((s, [x, y], i) => s + x * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * y, 0) > 0
  const lines = poly.map(([ax, ay], i) => {
    const [bx, by] = poly[(i + 1) % n]
    const len = Math.hypot(bx - ax, by - ay)
    const nx = ((ccw ? -1 : 1) * (by - ay)) / len
    const ny = ((ccw ? 1 : -1) * (bx - ax)) / len
    return [ax + nx * d, ay + ny * d, bx - ax, by - ay]
  })
  return lines.map((l1, i) => {
    const l0 = lines[(i - 1 + n) % n]
    const den = l0[2] * l1[3] - l0[3] * l1[2]
    const t = ((l1[0] - l0[0]) * l1[3] - (l1[1] - l0[1]) * l1[2]) / den
    return [l0[0] + l0[2] * t, l0[1] + l0[3] * t]
  })
}

function scatter(r, count, spacing, accept, bounds, taken = []) {
  const out = []
  const [x0, y0, x1, y1] = bounds
  for (let tries = 0; out.length < count && tries < count * 60; tries++) {
    const p = [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0)]
    if (!accept(p)) continue
    if ([...taken, ...out].some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < spacing)) continue
    out.push(p)
  }
  return out
}

const TOWER_HALF = [17.5, 15.5]
const nearTower = (p, pad) => TOWERS.some(({ at }) => Math.abs(p[0] - at[0]) < TOWER_HALF[0] + pad && Math.abs(p[1] - at[1]) < TOWER_HALF[1] + pad)
const inPond = (p) => PONDS.some(({ at, r }) => Math.hypot((p[0] - at[0]) / (r[0] + 2), (p[1] - at[1]) / (r[1] + 2)) < 1)

// Tree placements: { at, z, h, rot, kind } in plan metres. Deterministic so the forest never reshuffles.
export function forest() {
  const r = rng(41)
  const box = [-85, -64, 95, 35]
  const free = (p) => inside(p, PLOT) && !inside(p, inset(PODIUM, -3)) && lineDist(p, DRIVE) > 4.5 && lineDist(p, COURT) > 5 && !inPond(p)
  const belt = scatter(r, 150, 6.2, (p) => free(p) && edgeDist(p, PLOT) < 13, box)
  const garden = scatter(r, 60, 6.8, (p) => free(p) && p[1] < -19, box, belt)
  const deckArea = inset(PODIUM, 3)
  const deck = scatter(r, 26, 7.5, (p) => inside(p, deckArea) && !nearTower(p, 2.5), box)
  const tree = (z, h0, h1) => (at) => ({ at, z, h: h0 + r() * (h1 - h0), rot: r() * Math.PI * 2, kind: Math.floor(r() * 3) })
  return [...belt.map(tree(0, 10, 17)), ...garden.map(tree(0, 8, 14)), ...deck.map(tree(PODIUM_H, 5, 8))]
}

const geo = (p) => toLngLat(SITE.at, ...rotate(p, SITE.heading))
const ring = (pts) => [...pts.map(geo), geo(pts[0])]
const ellipse = ({ at, r, rot }, n = 28) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const [x, y] = rotate([Math.cos(a) * r[0], Math.sin(a) * r[1]], -rot)
    return [at[0] + x, at[1] + y]
  })

const feature = (kind, type, coordinates) => ({ type: 'Feature', properties: { kind }, geometry: { type, coordinates } })

// The ground plan as GeoJSON, drawn by the map under the 3D scene.
export function siteGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: [
      feature('plot', 'Polygon', [ring(PLOT)]),
      feature('court', 'Polygon', [ring(inset(PODIUM, -4))]),
      ...PONDS.map((p) => feature('pond', 'Polygon', [ring(ellipse(p))])),
      feature('track', 'LineString', ring(inset(PLOT, 5.5))),
      feature('drive', 'LineString', DRIVE.map(geo)),
      feature('drive', 'LineString', COURT.map(geo)),
    ],
  }
}

export const plotOutline = () => ring(PLOT)
