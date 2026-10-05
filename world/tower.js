import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { FLOOR_H, FLOORS, PODIUM_H, TOWER_H } from './site'

/*
 * One residential tower: four stepped wings around a core, read off the brochure's key plans.
 * Local metres, z up, origin at the core. The south-west wing is the unit the key plans mark.
 */
const SW_WING = [
  [-3.2, -1],
  [-11, -1],
  [-11, -3.2],
  [-14.5, -3.2],
  [-14.5, -5],
  [-16.4, -5],
  [-16.4, -14.6],
  [-8, -14.6],
  [-8, -13],
  [-5.6, -13],
  [-5.6, -11.2],
  [-3.2, -11.2],
]

// sw, se, nw, ne
export const WINGS = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
].map(([sx, sy]) => SW_WING.map(([x, y]) => [x * sx, y * sy]))

const centroid = (pts) => pts.reduce(([a, b], [x, y]) => [a + x / pts.length, b + y / pts.length], [0, 0])

function grow(pts, d) {
  const [cx, cy] = centroid(pts)
  return pts.map(([x, y]) => {
    const dx = x - cx
    const dy = y - cy
    const l = Math.hypot(dx, dy)
    return [x + (dx / l) * d, y + (dy / l) * d]
  })
}

const shape = (pts) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)))
const extrude = (pts, depth, z = 0) => new THREE.ExtrudeGeometry(shape(pts), { depth, bevelEnabled: false }).translate(0, 0, z)

function ring(pts, outer, inner, depth, z) {
  const s = shape(grow(pts, outer))
  s.holes.push(new THREE.Path(grow(pts, -inner).reverse().map(([x, y]) => new THREE.Vector2(x, y))))
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }).translate(0, 0, z)
}

// Balcony greenery: two outer corners per wing, alternating up the tower (a vertical forest).
export function balconies() {
  const spots = []
  WINGS.forEach((w, wi) => {
    const sx = wi % 2 === 0 ? 1 : -1
    const sy = wi < 2 ? 1 : -1
    const corners = [
      [-16.4 * sx, -9.5 * sy],
      [-11.5 * sx, -14.6 * sy],
    ]
    for (let f = 1; f < FLOORS; f += 2) {
      const k = (f + wi) % 2
      const [cx, cy] = corners[k]
      const out = k === 0 ? [-1.5 * sx, 0] : [0, -1.5 * sy]
      spots.push({ at: [cx + out[0], cy + out[1]], out, z: PODIUM_H + f * FLOOR_H, along: k === 0 ? 'y' : 'x' })
    }
  })
  return spots
}

export function buildTower({ facade, stone, bronze, roof, core }) {
  const tower = new THREE.Group()
  const shadows = (o) => {
    o.castShadow = true
    o.receiveShadow = true
    return o
  }

  // glass wings, full height (their base is hidden inside the podium); groups: 0 caps, 1 walls
  const wings = new THREE.ExtrudeGeometry(WINGS.map(shape), { depth: TOWER_H, bevelEnabled: false })
  tower.add(shadows(new THREE.Mesh(wings, [roof, facade])))

  // glazed core, rising above the roofline
  const corePlan = [
    [-3.6, -4.8],
    [3.6, -4.8],
    [3.6, 4.8],
    [-3.6, 4.8],
  ]
  tower.add(shadows(new THREE.Mesh(extrude(corePlan, TOWER_H + 5), [core, facade])))

  // floor slabs projecting past the glass
  const slab = mergeGeometries(WINGS.map((w) => extrude(grow(w, 0.55), 0.32, -0.16)))
  const slabs = new THREE.InstancedMesh(slab, stone, FLOORS + 1)
  const m = new THREE.Matrix4()
  for (let f = 0; f <= FLOORS; f++) slabs.setMatrixAt(f, m.makeTranslation(0, 0, PODIUM_H + f * FLOOR_H))
  tower.add(shadows(slabs))

  // balcony plates under the planted corners
  const spots = balconies()
  const plate = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.3), stone, spots.length)
  spots.forEach((s, i) => {
    m.compose(new THREE.Vector3(s.at[0], s.at[1], s.z), new THREE.Quaternion(), new THREE.Vector3(s.along === 'x' ? 4.2 : 3.2, s.along === 'x' ? 3.2 : 4.2, 1))
    plate.setMatrixAt(i, m)
  })
  tower.add(shadows(plate))

  // bronze fins framing each wing's outer corners
  const fins = []
  WINGS.forEach((w, wi) => {
    const sx = wi % 2 === 0 ? 1 : -1
    const sy = wi < 2 ? 1 : -1
    for (const [x, y] of [
      [-16.4 * sx, -5 * sy],
      [-8 * sx, -14.6 * sy],
    ]) {
      fins.push(new THREE.BoxGeometry(0.55, 0.55, TOWER_H - PODIUM_H + 2.4).translate(x, y, (TOWER_H + PODIUM_H + 2.4) / 2))
    }
  })
  tower.add(shadows(new THREE.Mesh(mergeGeometries(fins), bronze)))

  // crown: bronze parapets and a pergola over the core
  tower.add(new THREE.Mesh(mergeGeometries(WINGS.map((w) => ring(w, 0.35, 0.5, 1.4, TOWER_H))), bronze))
  const beams = []
  for (let i = -7; i <= 7; i++) beams.push(new THREE.BoxGeometry(0.28, 21, 0.5).translate(i * 1.3, 0, TOWER_H + 4.6))
  beams.push(new THREE.BoxGeometry(19, 0.5, 0.6).translate(0, 10.2, TOWER_H + 4.2), new THREE.BoxGeometry(19, 0.5, 0.6).translate(0, -10.2, TOWER_H + 4.2))
  for (const [x, y] of [
    [-9, -10],
    [9, -10],
    [-9, 10],
    [9, 10],
  ])
    beams.push(new THREE.BoxGeometry(0.4, 0.4, 4.4).translate(x, y, TOWER_H + 2.2))
  tower.add(shadows(new THREE.Mesh(mergeGeometries(beams), bronze)))

  return tower
}

// Glow over the south-west wing's homes, shown while a residence is in focus.
export function buildHighlight() {
  const group = new THREE.Group()
  const height = TOWER_H - PODIUM_H - 0.6
  const geo = extrude(grow(WINGS[0], 0.75), height, PODIUM_H + 0.3)
  const fill = new THREE.MeshBasicMaterial({ color: '#f2c879', transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })
  const edges = new THREE.LineBasicMaterial({ color: '#ffe2a6', transparent: true, opacity: 0.9, depthWrite: false })
  group.add(new THREE.Mesh(geo, fill), new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), edges))
  // a band of light sweeping up the stack
  const band = new THREE.Mesh(extrude(grow(WINGS[0], 0.95), 0.9), new THREE.MeshBasicMaterial({ color: '#ffd58a', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }))
  group.add(band)
  group.userData = { fill, edges, band, height }
  return group
}
