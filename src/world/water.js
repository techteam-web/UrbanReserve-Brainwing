import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import WATER from '../data/water.json'
import { SITE } from '../data/content'
import { toLocal } from './geo'
import { shoreDistances } from './shore'

// Lowest water level (m above sea level); each water body sits just above its own shoreline.
const LEVEL = 0.6

// Which kinds of water are open (OpenMapTiles classes, see scripts/water.mjs): the sea and the
// creeks run from turquoise shallows to deep blue, while lakes, ponds and salt pans keep an even blue.
const ROUGH = { ocean: 1, river: 0.85 }
const STILL = 0.12

// The distance to the shore is mapped `half` metres either side of the reserve on a `size`² grid,
// out to `range` metres: shallows and surf along the banks, deep water beyond.
const SHORE = { half: 9000, size: 1024, range: 400 }

// The water's colours: deep water and the shallows.
const TONES = { deep: '#082b47', shallow: '#2b97b8' }

/*
 * The sea, the creeks and the ponds around the reserve as one calm, glossy surface (polygons from
 * scripts/water.mjs) reflecting the sky. Its colour runs from turquoise shallows along the banks
 * to deep blue offshore, in slow light and dark patches; ponds and salt pans keep an even,
 * darker blue.
 */
export function createWater() {
  // one geometry, remembering which vertices belong to which water body and how rough it runs
  const bodies = []
  const outlines = []
  let start = 0
  const parts = WATER.polygons.map((rings, i) => {
    const local = rings.map((ring) => ring.map((p) => toLocal(SITE.at, p)))
    outlines.push(local)
    const [outer, ...holes] = local.map((ring) => ring.map((p) => new THREE.Vector2(...p)))
    const shape = new THREE.Shape(outer)
    shape.holes = holes.map((h) => new THREE.Path(h))
    const g = new THREE.ShapeGeometry(shape)
    const count = g.attributes.position.count
    g.setAttribute('aRough', new THREE.Float32BufferAttribute(new Float32Array(count).fill(ROUGH[WATER.kinds?.[i]] ?? STILL), 1))
    const shore = rings[0].filter((_, i, a) => i % Math.max(1, Math.floor(a.length / 6)) === 0).slice(0, 6)
    bodies.push({ start, count, shore })
    start += count
    return g
  })

  const uniforms = {
    uTime: { value: 0 },
    // open water everywhere until the shore field has been worked out
    uShore: { value: fieldTexture(new Uint8Array([255]), 1) },
    uShoreBox: { value: new THREE.Vector3(-SHORE.half, -SHORE.half, 2 * SHORE.half) },
    uShoreRange: { value: SHORE.range },
    uDeep: { value: new THREE.Color(TONES.deep) },
    uShallow: { value: new THREE.Color(TONES.shallow) },
  }
  const material = new THREE.MeshPhysicalMaterial({
    roughness: 0.18,
    metalness: 0,
    ior: 1.333,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1,
  })
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aRough;\nvarying vec2 vSea;\nvarying float vRough;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSea = position.xy;\nvRough = aRough;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${SEA}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${SEA_COLOUR}`)
  }

  const charted = shoreField(outlines).then((texture) => {
    uniforms.uShore.value.dispose()
    uniforms.uShore.value = texture
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
    // the shore field is in
    ready: charted,
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
      uniforms.uTime.value = t
    },
  }
}

// The shore field as a texture.
function fieldTexture(data, size) {
  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.UnsignedByteType)
  texture.magFilter = texture.minFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

// The distance to the nearest shore around the reserve (see shore.js), worked out in a worker so
// it never stalls the page, or here where a worker can't be had. Beyond it is open water.
function shoreField(outlines) {
  const here = () => fieldTexture(shoreDistances(outlines, SHORE), SHORE.size)
  return new Promise((resolve) => {
    let worker
    try {
      worker = new Worker(new URL('./shore.worker.js', import.meta.url), { type: 'module' })
    } catch {
      resolve(here())
      return
    }
    worker.onmessage = ({ data }) => {
      worker.terminate()
      resolve(fieldTexture(data, SHORE.size))
    }
    worker.onerror = () => {
      worker.terminate()
      resolve(here())
    }
    worker.postMessage({ outlines, grid: SHORE })
  })
}

// Declarations for the water shader: its colours, a noise for its slow patches, and the shore field.
const SEA = /* glsl */ `
uniform float uTime;
uniform sampler2D uShore;
uniform vec3 uShoreBox;   // west, south, size (m)
uniform float uShoreRange;
uniform vec3 uDeep;
uniform vec3 uShallow;
varying vec2 vSea;        // scene metres, east and north
varying float vRough;     // 1 for the open sea and creeks, low for still water

float seaHash(ivec2 i) {
  uvec2 q = uvec2(i + 1048576);
  uint h = (q.x * 1597334677u) ^ (q.y * 3812015801u);
  h ^= h >> 15u;
  h *= 2246822519u;
  h ^= h >> 13u;
  return float(h) * (1.0 / 4294967296.0);
}

float seaNoise(vec2 p) {
  vec2 c = floor(p);
  ivec2 i = ivec2(c);
  vec2 f = p - c;
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(seaHash(i), seaHash(i + ivec2(1, 0)), u.x), mix(seaHash(i + ivec2(0, 1)), seaHash(i + ivec2(1, 1)), u.x), u.y);
}
`

// The water's colour (its surface stays flat and calm): turquoise shallows to deep blue offshore,
// in slow light and dark patches; still water an even, darker blue.
const SEA_COLOUR = /* glsl */ `
vec2 fieldUv = (vSea - uShoreBox.xy) / uShoreBox.z;
float inField = step(0.0, fieldUv.x) * step(0.0, fieldUv.y) * step(fieldUv.x, 1.0) * step(fieldUv.y, 1.0);
float shore = mix(uShoreRange, texture2D(uShore, clamp(fieldUv, 0.0, 1.0)).r * uShoreRange, inField);
float open = smoothstep(0.3, 0.7, vRough);
float deep = smoothstep(15.0, 260.0, shore);
float patches = seaNoise(vSea / 480.0 + uTime * 0.003);
float tone = clamp(deep * 0.85 + (patches - 0.5) * 0.4 + 0.08, 0.0, 1.0);
diffuseColor.rgb = mix(uShallow, uDeep, mix(0.72, tone, open));
`

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
