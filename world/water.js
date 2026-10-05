import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import WATER from '../data/water.json'
import { SITE } from '../data/content'
import { toLocal } from './geo'

// Lowest water level (m above sea level); each water body sits just above its own shoreline.
const LEVEL = 0.6

/*
 * The creek, the sea and the ponds around the reserve as one rippling surface (polygons from
 * scripts/water.mjs). Two layers of the same normal map drift past each other, one in the base
 * and one in a glossy clearcoat, and the HDRI does the reflections.
 */
export function createWater() {
  let loaded
  const ready = new Promise((r) => (loaded = r))
  const ripples = new THREE.TextureLoader().load('/water_normal.jpg', () => loaded(), undefined, () => loaded())
  ripples.wrapS = ripples.wrapT = THREE.RepeatWrapping
  ripples.anisotropy = 8
  const swell = ripples.clone()
  ripples.repeat.set(1 / 19, 1 / 19)
  swell.repeat.set(1 / 52, 1 / 52)

  const material = new THREE.MeshPhysicalMaterial({
    color: '#1f5d6b',
    roughness: 0.2,
    metalness: 0,
    normalMap: swell,
    normalScale: new THREE.Vector2(0.6, 0.6),
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    clearcoatNormalMap: ripples,
    clearcoatNormalScale: new THREE.Vector2(0.35, 0.35),
    envMapIntensity: 1,
  })

  // one geometry, remembering which vertices belong to which water body
  const bodies = []
  let start = 0
  const parts = WATER.polygons.map((rings) => {
    const [outer, ...holes] = rings.map((ring) => ring.map((p) => new THREE.Vector2(...toLocal(SITE.at, p))))
    const shape = new THREE.Shape(outer)
    shape.holes = holes.map((h) => new THREE.Path(h))
    const g = new THREE.ShapeGeometry(shape)
    const count = g.attributes.position.count
    const shore = rings[0].filter((_, i, a) => i % Math.max(1, Math.floor(a.length / 6)) === 0).slice(0, 6)
    bodies.push({ start, count, shore })
    start += count
    return g
  })
  const mesh = new THREE.Mesh(mergeGeometries(parts), material)
  mesh.renderOrder = -1
  parts.forEach((g) => g.dispose())
  let base = 0

  const inside = ([px, py], ring) => {
    let c = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]
      const [xj, yj] = ring[j]
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c
    }
    return c
  }

  return {
    mesh,
    ready,
    // sets each water body on its shoreline once the terrain under it has loaded
    settle(ground, elevationAt) {
      base = ground
      const pos = mesh.geometry.attributes.position
      for (const b of bodies) {
        const heights = b.shore.map(elevationAt).filter((h) => h != null).sort((p, q) => p - q)
        b.level = Math.max(LEVEL, (heights[Math.floor(heights.length / 2)] ?? 0) + 0.35)
        for (let i = b.start; i < b.start + b.count; i++) pos.setZ(i, b.level - ground)
      }
      pos.needsUpdate = true
      mesh.geometry.computeBoundingSphere()
      mesh.geometry.computeBoundingBox()
    },
    // the water surface height (scene metres) at [lng, lat]
    levelAt(at) {
      const k = WATER.polygons.findIndex((rings) => inside(at, rings[0]))
      return (bodies[k]?.level ?? LEVEL) - base
    },
    update(t) {
      swell.offset.set(t * 0.011, t * 0.006)
      ripples.offset.set(-t * 0.019, t * 0.013)
    },
  }
}

// A foam trail fanning out behind a moving boat.
function wakeTexture() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 512
  const g = c.getContext('2d')
  for (let i = 0; i < 900; i++) {
    const t = Math.random() // 0 at the stern, 1 at the far end
    const spread = 0.08 + t * 0.42
    const side = Math.random() < 0.5 ? -1 : 1
    const edge = Math.random() < 0.7
    const x = 64 + side * (edge ? spread : Math.random() * spread * 0.6) * 128
    const y = t * 512
    g.fillStyle = `rgba(255, 255, 255, ${(1 - t) ** 1.5 * (edge ? 0.5 : 0.25)})`
    g.beginPath()
    g.arc(x, y, 2 + Math.random() * 5 * (1 - t * 0.5), 0, Math.PI * 2)
    g.fill()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// A boat model stood z-up, its hull along +x, sized to `length` metres and sat on the waterline.
export function prepareBoat(gltf, length, { bow = 1, draft = 0.2 } = {}) {
  const holder = new THREE.Group()
  holder.rotation.x = Math.PI / 2
  holder.add(gltf.scene.clone())
  const turn = new THREE.Group()
  turn.add(holder)
  turn.updateMatrixWorld(true)
  let box = new THREE.Box3().setFromObject(turn)
  let size = box.getSize(new THREE.Vector3())
  if (size.y > size.x) {
    turn.rotation.z = Math.PI / 2
    turn.updateMatrixWorld(true)
    box = new THREE.Box3().setFromObject(turn)
    size = box.getSize(new THREE.Vector3())
  }
  if (bow < 0) {
    turn.rotation.z += Math.PI
    turn.updateMatrixWorld(true)
    box = new THREE.Box3().setFromObject(turn)
  }
  const k = length / size.x
  const model = new THREE.Group()
  const c = box.getCenter(new THREE.Vector3())
  turn.position.set(-c.x, -c.y, -box.min.z - size.z * draft)
  model.add(turn)
  model.scale.setScalar(k)
  model.traverse((o) => {
    if (!o.isMesh) return
    o.castShadow = false
    o.receiveShadow = false
  })
  return model
}

/*
 * Fishing boats ride at anchor on the creek and the sea; yachts cruise slow loops with a wake.
 * `models` = { fishing: [Object3D], yacht: [Object3D] } from prepareBoat.
 */
export function createBoats(models) {
  const group = new THREE.Group()
  const wake = wakeTexture()
  const fleet = WATER.boats.map((b, i) => {
    const kind = models[b.kind]
    const boat = kind[i % kind.length].clone()
    const holder = new THREE.Group()
    holder.add(boat)
    const [x, y] = toLocal(SITE.at, b.at)
    const heading = (b.heading * Math.PI) / 180
    const cruise = b.kind === 'yacht'
    if (cruise) {
      const trail = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: wake, transparent: true, depthWrite: false, opacity: 0.85 }))
      // texture top (the stern end) towards the boat, fanning out 140 m behind it along -x
      trail.scale.set(46, 140, 1)
      trail.rotation.z = -Math.PI / 2
      trail.position.set(-88, 0, 0.25)
      holder.add(trail)
    }
    group.add(holder)
    return { holder, at: b.at, x, y, heading, cruise, phase: i * 1.7, radius: 70 + (i % 3) * 20, water: 0 }
  })

  return {
    group,
    // `levelAt([lng, lat])` gives the water surface under each boat
    settle(levelAt) {
      for (const f of fleet) f.water = levelAt(f.at)
    },
    update(t) {
      for (const f of fleet) {
        const bob = Math.sin(t * 1.3 + f.phase) * 0.35
        if (f.cruise) {
          // a slow loop around its spot, bow first
          const a = f.phase + t * (4.5 / f.radius)
          f.holder.position.set(f.x + Math.cos(a) * f.radius, f.y + Math.sin(a) * f.radius, f.water + bob * 0.5)
          f.holder.rotation.set(Math.sin(t * 0.9 + f.phase) * 0.02, 0, a + Math.PI / 2)
        } else {
          f.holder.position.set(f.x, f.y, f.water + bob)
          f.holder.rotation.set(Math.sin(t * 0.8 + f.phase) * 0.045, Math.sin(t * 0.6 + f.phase) * 0.03, f.heading + Math.sin(t * 0.07 + f.phase) * 0.2)
        }
      }
    },
  }
}
