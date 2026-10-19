// The Residences map's building, both towers on their podium, cut down for the web from the
// architects' Unreal Engine export (models-src/Urban_Building, 351 MB, 5 million triangles, kept
// out of git and of the build). The export has no textures, and most of its triangles are a
// hedge's leaves and a few stray trees: those go (the hedge becomes a plain block), the rest is
// gathered into a handful of materials the scene paints (src/world/scene.js), welded,
// simplified, stripped of its unused tangents and UVs, quantised and meshopt-compressed.
// Saved y-up in plan metres (x east, −z north), the origin on the ground midway between the
// towers, to public/models/urban.glb; its height, the towers (centre, ends, outline) and the
// podium (outline, deck height) to src/data/building.json.   npm run building
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, join, meshopt, prune, quantize, simplify, transformMesh, weld } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import { BufferAttribute, BufferGeometry } from 'three'
import { mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const SRC = new URL('../models-src/Urban_Building/Urban_build.gltf', import.meta.url)
const OUT = new URL('../public/models/urban.glb', import.meta.url)
const DATA = new URL('../src/data/building.json', import.meta.url)
// simplification stops at this error, as a fraction of each part's size (~0.1% ≈ 15 cm)
const ERROR = 0.001
// edges sharper than this keep a hard edge when the normals are rebuilt
const CREASE = Math.PI / 5

// the export's materials (less their "_Urban_Bld…" suffix) by the look the scene gives them,
// with a base colour (linear) so the file reads on its own too
const COLOURS = { wall: [0.82, 0.78, 0.7], frame: [0.12, 0.1, 0.08], trim: [0.35, 0.35, 0.33], glass: [0.18, 0.24, 0.28], roof: [0.4, 0.36, 0.3], green: [0.15, 0.3, 0.1], paving: [0.5, 0.45, 0.38] }
const LOOKS = {
  wall: ['Material__2147483601', 'Material__2147483604', 'Stucco_F01_50cm', 'MI_Stucco2', 'Material__2147483623', 'Material__2147483605', 'WorldGridMaterial'],
  frame: ['Material__2147483602'],
  trim: ['Material__214021454'],
  glass: ['Material__2147483603', 'Material__2147483606', 'Material__2147483609'],
  roof: ['Material__2147483599'],
  green: ['MI_Artificial_Turf_pgbf21s0_2K'],
  paving: ['MI_Patterned_Concrete_Pavers_uigodfoew_2K'],
}
// the hedge along the podium's south face: 3 million leaf triangles, replaced by its bounding block
const HEDGE = ['Material__1', 'Material__2', 'Material__1_2', 'Material__2_2', 'Material__1_3']
// anything else (stray trees, a far-off strip of ground, slivers) is left out

const base = (name) => name.replace(/_Urban_Bld.*$/, '')
const lookOf = (name) => Object.keys(LOOKS).find((k) => LOOKS[k].includes(base(name)))

await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready])
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
const doc = await io.read(fileURLToPath(SRC))
const root = doc.getRoot()
const buffer = root.listBuffers()[0]
const [mesh] = root.listMeshes()
const looks = Object.fromEntries(Object.keys(LOOKS).map((k) => [k, doc.createMaterial(k).setBaseColorFactor([...COLOURS[k], 1]).setMetallicFactor(0).setRoughnessFactor(0.8)]))

const hedge = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }
for (const prim of mesh.listPrimitives()) {
  const name = prim.getMaterial()?.getName() ?? ''
  if (HEDGE.includes(base(name))) {
    const pos = prim.getAttribute('POSITION')
    pos.getMin([]).forEach((v, i) => (hedge.min[i] = Math.min(hedge.min[i], v)))
    pos.getMax([]).forEach((v, i) => (hedge.max[i] = Math.max(hedge.max[i], v)))
  }
  const look = lookOf(name)
  if (!look) {
    prim.dispose()
    continue
  }
  prim.setMaterial(looks[look])
  for (const unused of ['TANGENT', 'TEXCOORD_0', 'TEXCOORD_1']) prim.setAttribute(unused, null)
}

// the hedge's block: five faces (no underside), each with its own normal
{
  const [x0, y0, z0] = hedge.min
  const [x1, y1, z1] = hedge.max
  const faces = [
    [[1, 0, 0], [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]],
    [[-1, 0, 0], [[x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0]]],
    [[0, 1, 0], [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]]],
    [[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]],
    [[0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]]],
  ]
  const acc = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer)
  mesh.addPrimitive(
    doc
      .createPrimitive()
      .setAttribute('POSITION', acc('VEC3', new Float32Array(faces.flatMap(([, quad]) => quad.flat()))))
      .setAttribute('NORMAL', acc('VEC3', new Float32Array(faces.flatMap(([n]) => [n, n, n, n].flat()))))
      .setIndices(acc('SCALAR', new Uint16Array(faces.flatMap((_, f) => [0, 1, 2, 0, 2, 3].map((i) => f * 4 + i)))))
      .setMaterial(looks.green),
  )
}

// Where things are, in the export's frame: the ground, each tower (the part well above the
// podium, split east and west) with its west and east ends and outline, and the podium's outline
// and deck height.
const points = (look) =>
  mesh
    .listPrimitives()
    .filter((p) => !look || p.getMaterial() === looks[look])
    .map((p) => p.getAttribute('POSITION').getArray())
let ground = Infinity
let top = -Infinity
for (const a of points()) {
  for (let i = 1; i < a.length; i += 3) {
    ground = Math.min(ground, a[i])
    top = Math.max(top, a[i])
  }
}
const solid = ['wall', 'frame', 'trim', 'glass', 'roof', 'green'].flatMap(points)
const each = (fn) => {
  for (const a of solid) for (let i = 0; i < a.length; i += 3) fn(a[i], a[i + 1], a[i + 2])
}
let west = Infinity
let east = -Infinity
each((x, y) => {
  if (y <= ground + 30) return
  west = Math.min(west, x)
  east = Math.max(east, x)
})
const split = (west + east) / 2
const towers = [0, 1].map(() => ({ box: [Infinity, Infinity, -Infinity, -Infinity], west: null, east: null, footprint: new Map() }))
// footprints on a half-metre grid: the podium's, and each tower's
const cell = (x, z) => [`${Math.round(x * 2)},${Math.round(z * 2)}`, [Math.round(x * 2) / 2, Math.round(z * 2) / 2]]
const low = new Map()
each((x, y, z) => {
  if (y < ground + 12) low.set(...cell(x, z))
  if (y <= ground + 30) return
  const t = towers[x < split ? 0 : 1]
  t.box = [Math.min(t.box[0], x), Math.min(t.box[1], z), Math.max(t.box[2], x), Math.max(t.box[3], z)]
  if (!t.west || x < t.west[0]) t.west = [x, z]
  if (!t.east || x > t.east[0]) t.east = [x, z]
  t.footprint.set(...cell(x, z))
})
for (const t of towers) t.at = [(t.box[0] + t.box[2]) / 2, (t.box[1] + t.box[3]) / 2]
const origin = [(towers[0].at[0] + towers[1].at[0]) / 2, ground, (towers[0].at[1] + towers[1].at[1]) / 2]

// convex outline of the podium, its near-straight corners dropped
function hull(pts) {
  const sorted = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list) =>
    list.reduce((h, p) => {
      while (h.length >= 2 && cross(h.at(-2), h.at(-1), p) <= 0) h.pop()
      h.push(p)
      return h
    }, [])
  const ring = [...half(sorted).slice(0, -1), ...half([...sorted].reverse()).slice(0, -1)]
  const bend = (i) => {
    const [a, b, c] = [ring.at(i - 1), ring[i], ring[(i + 1) % ring.length]]
    const ab = Math.atan2(b[1] - a[1], b[0] - a[0])
    const bc = Math.atan2(c[1] - b[1], c[0] - b[0])
    return Math.abs(Math.atan2(Math.sin(bc - ab), Math.cos(bc - ab)))
  }
  return ring.filter((_, i) => bend(i) > 0.05)
}

// the deck: the highest point of the podium, anything lower than 40 m outside the towers (1 m clear)
for (const t of towers) t.outline = hull([...t.footprint.values()])
const inside = ([px, pz], ring, pad) => {
  const turn = Math.sign(ring.reduce((s, [x, z], i) => s + x * ring[(i + 1) % ring.length][1] - ring[(i + 1) % ring.length][0] * z, 0))
  return ring.every(([ax, az], i) => {
    const [bx, bz] = ring[(i + 1) % ring.length]
    return (turn * ((bx - ax) * (pz - az) - (bz - az) * (px - ax))) / Math.hypot(bx - ax, bz - az) >= -pad
  })
}
let deck = 0
each((x, y, z) => {
  if (y > ground + 40 || y - ground <= deck) return
  if (!towers.some((t) => inside([x, z], t.outline, 1))) deck = y - ground
})

// export frame → plan metres (x east, y north)
const plan = ([x, z]) => [+(x - origin[0]).toFixed(1), +(-(z - origin[2])).toFixed(1)]
const building = {
  height: +(top - ground).toFixed(1),
  deck: +deck.toFixed(1),
  towers: towers.map((t) => ({ at: plan(t.at), west: plan(t.west), east: plan(t.east), outline: t.outline.map(plan) })),
  podium: hull([...low.values()]).map(plan),
}

transformMesh(mesh, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -origin[0], -origin[1], -origin[2], 1])
const count = () => mesh.listPrimitives().reduce((n, p) => n + p.getIndices().getCount() / 3, 0)
console.log(`kept ${Math.round(count()).toLocaleString()} triangles in ${mesh.listPrimitives().length} parts`)

// The export gives every face its own normals, so each face stands alone and nothing can be
// simplified: welded on position alone instead, simplified, then given creased normals again.
await doc.transform(prune(), join({ keepNamed: false }))
for (const prim of mesh.listPrimitives()) prim.setAttribute('NORMAL', null)
await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0, error: ERROR }))
for (const prim of mesh.listPrimitives()) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(prim.getAttribute('POSITION').getArray(), 3))
  geometry.setIndex(new BufferAttribute(prim.getIndices().getArray(), 1))
  const creased = mergeVertices(toCreasedNormals(geometry, CREASE))
  const accessor = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer)
  prim.setAttribute('POSITION', accessor('VEC3', creased.attributes.position.array))
  prim.setAttribute('NORMAL', accessor('VEC3', creased.attributes.normal.array))
  prim.setIndices(accessor('SCALAR', creased.index.array))
}
await doc.transform(dedup(), prune(), quantize({ quantizePosition: 14, quantizeNormal: 10 }), meshopt({ encoder: MeshoptEncoder, level: 'high' }))
for (const p of mesh.listPrimitives()) console.log(`  ${p.getMaterial().getName().padEnd(7)} ${Math.round(p.getIndices().getCount() / 3).toLocaleString().padStart(9)} triangles`)
console.log(`simplified to ${Math.round(count()).toLocaleString()} triangles`)

await io.write(fileURLToPath(OUT), doc)
writeFileSync(DATA, JSON.stringify(building, null, 2) + '\n')
console.log('origin (export frame)', origin.map((v) => v.toFixed(2)).join(', '))
console.log('building', JSON.stringify(building))
