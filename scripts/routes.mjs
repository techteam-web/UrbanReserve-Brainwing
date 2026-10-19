// Driving routes from the reserve to every place in LOCATION, along OpenStreetMap roads (the same
// roads the Residences map draws), saved to src/data/routes.json. Re-run whenever SITE or a place
// moves:   npm run routes
// Uses the public OSRM demo server, which asks for no more than one request a second.
import { writeFileSync } from 'node:fs'
import { LOCATION, SITE } from '../src/data/content.js'

const OUT = new URL('../src/data/routes.json', import.meta.url)
const round = ([lng, lat]) => [Math.round(lng * 1e6) / 1e6, Math.round(lat * 1e6) / 1e6]
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const routes = {}
for (const { mins, places } of LOCATION.rings) {
  for (const p of places) {
    const url = `https://router.project-osrm.org/route/v1/driving/${SITE.at.join(',')};${p.at.join(',')}?overview=full&geometries=geojson&steps=true`
    const res = await fetch(url, { headers: { 'User-Agent': 'urban-reserve-routes/1.0' } })
    const body = await res.json()
    const r = body.routes?.[0]
    if (body.code !== 'Ok' || !r) throw new Error(`${p.name}: ${body.code} ${body.message ?? ''}`)
    // join the road route to the building and to the pin
    const path = [SITE.at, ...r.geometry.coordinates, p.at].map(round).filter((c, i, a) => !i || c[0] !== a[i - 1][0] || c[1] !== a[i - 1][1])
    routes[p.name] = {
      km: Math.round(r.distance / 100) / 10,
      // free-flowing traffic, so usually well under the real figure; the page shows the brochure's minutes
      freeFlowMins: Math.round(r.duration / 6) / 10,
      via: r.legs[0].summary,
      path,
    }
    console.log(`${p.name.padEnd(30)} ${routes[p.name].km} km  via ${routes[p.name].via}  (brochure: ${mins} min)`)
    await wait(1100)
  }
}

const data = { origin: SITE.at, source: 'OSRM, © OpenStreetMap contributors', generated: new Date().toISOString().slice(0, 10), routes }
writeFileSync(OUT, JSON.stringify(data) + '\n')
console.log(`wrote ${OUT.pathname}`)
