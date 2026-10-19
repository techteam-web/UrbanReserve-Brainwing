// How far each tower panorama is turned from the others, so the Views screen keeps facing the same
// way when the visitor changes tower or floor. A drone panorama's yaw 0 is wherever the drone
// happened to point, but the city sits at the same bearings in all of them: each panorama is
// unrolled into a strip around the horizon and the vertical edges in it (buildings, towers, hills)
// are matched between two panoramas to find the turn between them. A tower's floors were shot
// straight above one another, so everything in them lines up; between the two towers only the far
// skyline does, so those are matched in a narrow band about the horizon.
// Saved to src/data/headings.json: radians per scene, Tower A's first scene at 0.   npm run headings
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { TOWERS } from '../src/data/content.js'

const OUT = new URL('../src/data/headings.json', import.meta.url)
const W = 3600 // strip columns, 0.1° each
// the strip's elevations in degrees, inside the four side faces all the way round
const TOP = 10
const BOTTOM = -35
const ROWS = (TOP - BOTTOM) * 10
const FLOORS_BAND = [-35, 10]
const TOWERS_BAND = [-6, 6]
// matches that disagree with the rest by more than this (degrees) are left out
const TOLERANCE = 2

const RAD = Math.PI / 180
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))
const SIDES = [
  ['f', 0],
  ['r', Math.PI / 2],
  ['b', Math.PI],
  ['l', -Math.PI / 2],
]

// One cube face in grey, from the level whose faces are about 1024px across.
async function face(floor, f) {
  const { levels } = floor.data
  const found = levels.findIndex((l) => !l.fallbackOnly && l.size >= 1024)
  const z = found >= 0 ? found : levels.length - 1
  const { size, tileSize } = levels[z]
  const px = new Float32Array(size * size)
  const n = Math.ceil(size / tileSize)
  for (let ty = 0; ty < n; ty++) {
    for (let tx = 0; tx < n; tx++) {
      const file = fileURLToPath(new URL(`../public${floor.tiles}/${z}/${f}/${ty}/${tx}.jpg`, import.meta.url))
      const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true })
      for (let j = 0; j < info.height; j++) {
        for (let i = 0; i < info.width; i++) px[(ty * tileSize + j) * size + tx * tileSize + i] = data[(j * info.width + i) * info.channels]
      }
    }
  }
  return { size, px }
}

function sample({ size, px }, x, y) {
  const x0 = Math.min(size - 2, Math.max(0, Math.floor(x)))
  const y0 = Math.min(size - 2, Math.max(0, Math.floor(y)))
  const fx = Math.min(1, Math.max(0, x - x0))
  const fy = Math.min(1, Math.max(0, y - y0))
  const i = y0 * size + x0
  return (px[i] * (1 - fx) + px[i + 1] * fx) * (1 - fy) + (px[i + size] * (1 - fx) + px[i + size + 1] * fx) * fy
}

// The panorama unrolled around the horizon: column c looks along yaw −180° + 0.1° × (c + ½), row r
// at elevation TOP − 0.1° × (r + ½). Marzipano's side faces are seen from inside, yaw turning right.
async function strip(floor) {
  const faces = Object.fromEntries(await Promise.all(SIDES.map(async ([f]) => [f, await face(floor, f)])))
  const out = new Float32Array(W * ROWS)
  for (let c = 0; c < W; c++) {
    const yaw = ((c + 0.5) / W) * 2 * Math.PI - Math.PI
    const [f, along] = SIDES.map(([s, at]) => [s, wrap(yaw - at)]).find(([, a]) => Math.abs(a) <= Math.PI / 4 + 1e-9)
    const x = ((1 + Math.tan(along)) / 2) * faces[f].size - 0.5
    for (let r = 0; r < ROWS; r++) {
      const y = ((1 - Math.tan((TOP - (r + 0.5) / 10) * RAD) / Math.cos(along)) / 2) * faces[f].size - 0.5
      out[r * W + c] = sample(faces[f], x, y)
    }
  }
  return out
}

// How much vertical edge each column holds within a band of elevations, less its surroundings
// (±2.5°) and scaled to unit variance: the fingerprint that is matched.
function profile(s, [from, to]) {
  const edge = new Float64Array(W)
  for (let c = 0; c < W; c++) {
    const l = (c + W - 1) % W
    const r = (c + 1) % W
    for (let row = (TOP - to) * 10; row < (TOP - from) * 10; row++) edge[c] += Math.abs(s[row * W + r] - s[row * W + l])
  }
  const k = 25
  const out = new Float64Array(W)
  for (let c = 0; c < W; c++) {
    let around = 0
    for (let d = -k; d <= k; d++) around += edge[(c + d + W) % W]
    out[c] = edge[c] - around / (2 * k + 1)
  }
  const mean = out.reduce((a, v) => a + v, 0) / W
  const sd = Math.sqrt(out.reduce((a, v) => a + (v - mean) ** 2, 0) / W) || 1
  return out.map((v) => (v - mean) / sd)
}

// The turn δ that best fits b(yaw) ≈ a(yaw + δ), i.e. heading(b) − heading(a), with the match's
// correlation and how far it stands above the best match more than 3° away.
function turn(a, b) {
  const twice = new Float64Array(2 * W)
  twice.set(a)
  twice.set(a, W)
  const score = new Float64Array(W)
  for (let d = 0; d < W; d++) {
    let s = 0
    for (let c = 0; c < W; c++) s += twice[c + d] * b[c]
    score[d] = s / W
  }
  let at = 0
  for (let d = 1; d < W; d++) if (score[d] > score[at]) at = d
  let rival = -Infinity
  for (let d = 0; d < W; d++) if (Math.min(Math.abs(d - at), W - Math.abs(d - at)) > 30) rival = Math.max(rival, score[d])
  const [l, m, r] = [score[(at + W - 1) % W], score[at], score[(at + 1) % W]]
  const bend = l - 2 * m + r
  const frac = bend ? (l - r) / (2 * bend) : 0
  return { delta: wrap(((at + frac) / W) * 2 * Math.PI), peak: m, lead: m / rival }
}

const floors = TOWERS.flatMap((t) => t.floors.map((f) => ({ ...f, tower: t.label })))
const name = (key) => {
  const f = floors.find((x) => x.key === key)
  return `${f.tower} ${f.label}`
}
const strips = new Map()
for (const f of floors) {
  process.stdout.write(`unrolling ${name(f.key)}\n`)
  strips.set(f.key, await strip(f))
}
const prints = new Map()
const print = (key, band) => {
  const id = `${key} ${band}`
  if (!prints.has(id)) prints.set(id, profile(strips.get(key), band))
  return prints.get(id)
}

// every pair of floors within a tower, and each floor against the same floor of the other tower
const pairs = []
for (const t of TOWERS) t.floors.forEach((a, i) => t.floors.slice(i + 1).forEach((b) => pairs.push([a, b, FLOORS_BAND])))
for (const a of TOWERS[0].floors) {
  const b = TOWERS[1].floors.find((f) => f.height === a.height)
  if (b) pairs.push([a, b, TOWERS_BAND])
}
const edges = pairs.map(([a, b, band]) => {
  const m = turn(print(a.key, band), print(b.key, band))
  return { from: a.key, to: b.key, ...m, weight: Math.max(0.001, m.peak * Math.min(m.lead - 1, 2)), across: band === TOWERS_BAND }
})

// Headings that agree best with all the turns, each weighted by how clear its match was, with Tower
// A's first scene held at 0: grown out along the clearest matches, then settled.
const ROOT = TOWERS[0].start.key
function solve(use) {
  const heading = new Map([[ROOT, 0]])
  while (heading.size < floors.length) {
    const next = use.filter((e) => heading.has(e.from) !== heading.has(e.to)).sort((x, y) => y.weight - x.weight)[0]
    if (!next) throw new Error('some panoramas match none of the others')
    if (heading.has(next.from)) heading.set(next.to, heading.get(next.from) + next.delta)
    else heading.set(next.from, heading.get(next.to) - next.delta)
  }
  for (let round = 0; round < 200; round++) {
    for (const f of floors) {
      if (f.key === ROOT) continue
      let sin = 0
      let cos = 0
      for (const e of use) {
        const v = e.to === f.key ? heading.get(e.from) + e.delta : e.from === f.key ? heading.get(e.to) - e.delta : null
        if (v === null) continue
        sin += e.weight * Math.sin(v)
        cos += e.weight * Math.cos(v)
      }
      heading.set(f.key, Math.atan2(sin, cos))
    }
  }
  return heading
}
const miss = (heading, e) => wrap(heading.get(e.to) - heading.get(e.from) - e.delta) / RAD
let heading = solve(edges)
const kept = edges.filter((e) => Math.abs(miss(heading, e)) <= TOLERANCE)
heading = solve(kept)

const deg = (v) => `${(v / RAD).toFixed(2)}°`.padStart(8)
console.log('\nbetween the towers, floor by floor (measured turn, and how far it is from the solution):')
for (const e of edges.filter((x) => x.across)) {
  console.log(`  ${name(e.from).padEnd(22)} → ${name(e.to).padEnd(22)} ${deg(e.delta)}  off ${miss(heading, e).toFixed(2).padStart(6)}°  clarity ${e.lead.toFixed(2)}${kept.includes(e) ? '' : '  (left out)'}`)
}
const within = edges.filter((x) => !x.across)
const worst = Math.max(...within.filter((e) => kept.includes(e)).map((e) => Math.abs(miss(heading, e))))
console.log(`within the towers: ${within.filter((e) => kept.includes(e)).length} of ${within.length} matches kept, the worst ${worst.toFixed(2)}° from the solution`)
console.log('\nheadings:')
for (const f of floors) console.log(`  ${name(f.key).padEnd(22)} ${deg(heading.get(f.key))}`)

writeFileSync(OUT, JSON.stringify(Object.fromEntries(floors.map((f) => [f.key, Number(heading.get(f.key).toFixed(5))])), null, 2) + '\n')
console.log(`\nsaved ${fileURLToPath(OUT)}`)
