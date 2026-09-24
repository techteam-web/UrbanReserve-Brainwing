// Fetches road-following route shapes from the project site to every pinned landmark and writes them to
// src/data/routes.json, so the Location map can draw real routes without a routing service at runtime.
// Shapes come from the OpenStreetMap routing servers (FOSSGIS). Travel times live in content.js.
//
//   node scripts/build-routes.mjs
import { writeFileSync } from 'node:fs'
import { LOCATION } from '../src/data/content.js'

const PROFILES = { car: 'routed-car', walk: 'routed-foot' }
const round = (n) => Math.round(n * 1e5) / 1e5

async function route(profile, from, to) {
  const url = `https://routing.openstreetmap.de/${profile}/route/v1/driving/${from.join(',')};${to.join(',')}?overview=full&geometries=geojson`
  const res = await fetch(url)
  const json = await res.json()
  if (json.code !== 'Ok') throw new Error(`${profile} ${to}: ${json.code}`)
  // start at the site pin and end at the landmark pin, not at the nearest road
  return [from, ...json.routes[0].geometry.coordinates.map(([x, y]) => [round(x), round(y)]), to]
}

const out = {}
for (const place of LOCATION.rings.flatMap((r) => r.places).filter((p) => p.lngLat)) {
  out[place.name] = {}
  for (const [mode, profile] of Object.entries(PROFILES)) {
    out[place.name][mode] = await route(profile, LOCATION.site, place.lngLat)
    console.log(place.name, mode, out[place.name][mode].length, 'points')
  }
}
writeFileSync(new URL('../src/data/routes.json', import.meta.url), JSON.stringify(out) + '\n')
