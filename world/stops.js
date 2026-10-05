import { LOCATION, SITE } from '../data/content'
import ROUTES from '../data/routes.json'
import { bearing, distance, rotate, toLngLat, toLocal } from './geo'
import { TOWERS } from './site'

// Road routes are drawn only if they were generated for the current SITE (see scripts/routes.mjs).
const fresh = distance(ROUTES.origin, SITE.at) < 1
if (!fresh && import.meta.env.DEV) console.warn('src/data/routes.json was made for another SITE; run `npm run routes`.')

// Every place with its brochure travel time and, when available, its road route from the reserve.
export const PLACES = LOCATION.rings.flatMap((r) => r.places.map((p) => ({ ...p, mins: r.mins, route: fresh ? (ROUTES.routes[p.name] ?? null) : null })))

// Stops are 'reserve', a residence id, 'interiors', 'neighbourhood' or 'place-<index into PLACES>'.
export const isHood = (stop) => stop === 'neighbourhood' || stop.startsWith('place-')
export const placeIndex = (stop) => (stop.startsWith('place-') ? Number(stop.slice(6)) : -1)

const H = SITE.heading
// plan metres → scene metres (east, north) and → [lng, lat]
export const enu = (x, y) => rotate([x, y], H)
const geo = (x, y) => toLngLat(SITE.at, ...enu(x, y))

// centre of the wing the key plans mark, and its outer corner, in tower metres
const WING = [-9.8, -7.8]
const CORNER = [-17.4, -15.4]
const onTower = (i, [dx, dy]) => [TOWERS[i].at[0] + dx, TOWERS[i].at[1] + dy]

/*
 * Camera stops. `lift` is the orbit centre's height above the ground (m), `orbit` its speed
 * (°/s) once the camera arrives, `spin` extra swing on the way in. Bearings follow the plan.
 */
export const VIEWS = {
  reserve: { center: geo(4, -6), zoom: 17.7, pitch: 63, bearing: H - 32, lift: 34, orbit: 1.2 },
  '2bhk': { center: geo(...onTower(0, WING)), zoom: 18.55, pitch: 72, bearing: H + 36, lift: 46, orbit: 1.6, spin: 40 },
  '3bhk': { center: geo(...onTower(1, WING)), zoom: 18.5, pitch: 67, bearing: H + 12, lift: 50, orbit: 1.6, spin: -50 },
  '3bhk-jodi': { center: geo(...onTower(1, WING)), zoom: 18.3, pitch: 77, bearing: H + 74, lift: 62, orbit: 1.6, spin: 60 },
  interiors: { center: geo(...onTower(0, WING)), zoom: 18.8, pitch: 80, bearing: H + 50, lift: 70, orbit: 1, spin: -40 },
}

// Clickable points on the towers that lead into each residence, as scene metres + height.
export const HOTSPOTS = [
  { id: '2bhk', tower: 0, z: 34 },
  { id: 'interiors', tower: 0, z: 68 },
  { id: '3bhk', tower: 1, z: 38 },
  { id: '3bhk-jodi', tower: 1, z: 70 },
].map((h) => ({ ...h, at: enu(...onTower(h.tower, CORNER)) }))

const bounds = (pts) => {
  const lng = pts.map((p) => p[0])
  const lat = pts.map((p) => p[1])
  return [
    [Math.min(...lng), Math.min(...lat)],
    [Math.max(...lng), Math.max(...lat)],
  ]
}

// The whole drive in view, looking out from the reserve so the destination sits at the top.
export const placeView = (p) => ({ bounds: bounds(p.route?.path ?? [SITE.at, p.at]), pitch: 48, bearing: bearing(SITE.at, p.at), lift: 0, orbit: 0 })

export const neighbourhoodBounds = () => bounds([SITE.at, ...PLACES.map((p) => p.at)])

export const placeLocal = (p) => toLocal(SITE.at, p.at)
