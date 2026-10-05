import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
// the glTF-only Draco decoder, as URLs Vite can serve in dev and fingerprint in the build
import dracoJs from 'three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js?url'
import dracoWasm from 'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url'
import { MercatorCoordinate } from './maplibre'
import { reduced } from '../gsap/gsapConfig'
import { SITE } from '../data/content'
import { forest, PODIUM, PODIUM_H, PONDS, TOWERS, TOWER_H, FLOOR_H } from './site'
import { balconies, buildHighlight, buildTower } from './tower'
import { duskEnvironment, facadeMaps, podiumMap } from './textures'
import { rotate, toLngLat, toLocal } from './geo'

const RAD = Math.PI / 180

// Low golden-hour sun from the west-south-west (matches the map's light).
const SUN_AZ = 250
const SUN_EL = 24
export const SUN = new THREE.Vector3(Math.sin(SUN_AZ * RAD) * Math.cos(SUN_EL * RAD), Math.cos(SUN_AZ * RAD) * Math.cos(SUN_EL * RAD), Math.sin(SUN_EL * RAD))

const loader = (() => {
  let l
  return () => {
    if (l) return l
    const draco = new DRACOLoader().setDecoderPath({ js: dracoJs, wasm: dracoWasm })
    l = new GLTFLoader().setDRACOLoader(draco)
    return l
  }
})()

// Parsed once and reused on later visits; each scene clones what it changes.
let models
const loadModels = () =>
  (models ??= Promise.all(['Tree-Variant-1', 'Tree-Variant-2', 'Tree-Variant-3', 'Tree-v1', 'bird'].map((n) => loader().loadAsync(`/models/${n}.glb`))).catch((e) => {
    models = null
    throw e
  }))

const KEEP = ['position', 'normal', 'uv']

// A GLB as one geometry (z up, base at 0, 1 m tall, centred) plus its material(s).
function unitModel(gltf) {
  gltf.scene.updateMatrixWorld(true)
  let parts = []
  gltf.scene.traverse((o) => o.isMesh && parts.push({ g: o.geometry.clone().applyMatrix4(o.matrixWorld), m: o.material }))
  const box = new THREE.Box3()
  for (const p of parts) {
    p.g.rotateX(Math.PI / 2)
    p.g.computeBoundingBox()
    box.union(p.g.boundingBox)
  }
  const size = box.getSize(new THREE.Vector3())
  const c = box.getCenter(new THREE.Vector3())
  if (parts.some((p) => p.g.index) && !parts.every((p) => p.g.index)) parts = parts.map((p) => ({ ...p, g: p.g.index ? p.g.toNonIndexed() : p.g }))
  for (const { g } of parts) {
    g.translate(-c.x, -c.y, -box.min.z).scale(1 / size.z, 1 / size.z, 1 / size.z)
    Object.keys(g.attributes).forEach((k) => !KEEP.includes(k) && g.deleteAttribute(k))
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
    if (!g.attributes.normal) g.computeVertexNormals()
  }
  const leafy = (src) => {
    const m = src.clone()
    Object.assign(m, { transparent: false, depthWrite: true, alphaTest: 0.5, side: THREE.DoubleSide, alphaToCoverage: true })
    if ('roughness' in m) Object.assign(m, { roughness: 0.88, metalness: 0, envMapIntensity: 0.4 })
    return m
  }
  return parts.length > 1 ? { geometry: mergeGeometries(parts.map((p) => p.g), true), material: parts.map((p) => leafy(p.m)) } : { geometry: parts[0].g, material: leafy(parts[0].m) }
}

function instanced(model, items, castShadow = true) {
  const mesh = new THREE.InstancedMesh(model.geometry, model.material, items.length)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const z = new THREE.Vector3(0, 0, 1)
  items.forEach((t, i) => mesh.setMatrixAt(i, m.compose(new THREE.Vector3(t.at[0], t.at[1], t.z), q.setFromAxisAngle(z, t.rot), new THREE.Vector3(t.h, t.h, t.h))))
  mesh.castShadow = castShadow
  mesh.receiveShadow = true
  mesh.userData.items = items
  return mesh
}

// Tubes keep a radius of at least `uPx` screen pixels however far away they are: each vertex is rebuilt
// from the centre line, pushed out by the larger of the real radius and a distance-scaled one.
const WIDE = `
  uniform float uR; uniform float uPx;
  vec4 widen() {
    vec3 c = position - normal * uR;
    float d = length((modelViewMatrix * vec4(c, 1.0)).xyz);
    vec3 p = c + normal * max(uR, d * uPx * 0.00062);
    return modelViewMatrix * vec4(p, 1.0);
  }`
const BEAM_VERT = `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  ${WIDE}
  void main() {
    vUv = uv;
    vec4 mv = widen();
    vV = -mv.xyz; vN = normalMatrix * normal;
    gl_Position = projectionMatrix * mv;
  }`
const BEAM_FRAG = `
  uniform vec3 uColor; uniform float uOpacity; uniform float uTime;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() {
    float rim = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    float fall = pow(1.0 - vUv.y, 2.2);
    float shimmer = 0.85 + 0.15 * sin(uTime * 1.7 + vUv.y * 40.0);
    gl_FragColor = vec4(uColor, uOpacity * fall * (0.2 + rim * rim) * shimmer);
  }`
const ARC_FRAG = `
  uniform vec3 uColor; uniform float uOpacity; uniform float uTime; uniform float uActive;
  varying vec2 vUv;
  void main() {
    float head = fract(uTime * 0.32);
    float d = vUv.x - head;
    float trail = d < 0.0 ? exp(d * 7.0) : exp(-d * 90.0);
    float ends = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x);
    gl_FragColor = vec4(uColor, uOpacity * ends * (0.34 + 0.2 * uActive + trail * (0.6 + 0.9 * uActive)));
  }`
const ARC_VERT = `varying vec2 vUv; ${WIDE} void main() { vUv = uv; gl_Position = projectionMatrix * widen(); }`

function beam(radius, height, color, opacity, px = 3) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uTime: { value: 0 }, uR: { value: radius }, uPx: { value: px } },
    vertexShader: BEAM_VERT,
    fragmentShader: BEAM_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 40, 1, true).rotateX(Math.PI / 2).translate(0, 0, height / 2), mat)
  mesh.userData.base = opacity
  return mesh
}

/*
 * The reserve as a MapLibre custom layer: three.js draws into the map's own WebGL context using a
 * camera rebuilt from MapLibre's matrices each frame. Scene units are metres, x east, y north,
 * z up, with the origin on the ground at SITE.at.
 */
export function createReserve({ places, shadows = true, onFrame }) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()
  camera.matrixAutoUpdate = false
  camera.matrixWorldAutoUpdate = false
  const enu = new THREE.Matrix4()
  const clip = new THREE.Matrix4()
  const tmp = { P: new THREE.Matrix4(), V: new THREE.Matrix4(), S: new THREE.Matrix4() }
  const pose = { clip, inverse: new THREE.Matrix4(), eye: camera.position, time: 0 }
  const state = { highlight: 0, highlightTarget: 0, landmark: -1, beacon: 0, beaconTarget: 0, arcs: 0, arcsTarget: 0 }
  let map, renderer, ground = 0, last = performance.now(), disposed = false
  const mixers = []
  const flocks = []

  const site = new THREE.Group()
  site.rotation.z = -SITE.heading * RAD
  scene.add(site)

  // light: warm low sun with soft shadows, sky/ground fill
  scene.add(new THREE.HemisphereLight('#bcd6e0', '#22382c', 0.85))
  const sun = new THREE.DirectionalLight('#ffd2a1', 2.6)
  sun.position.copy(SUN).multiplyScalar(700)
  scene.add(sun, sun.target)
  if (shadows) {
    sun.castShadow = true
    Object.assign(sun.shadow.camera, { left: -190, right: 190, top: 190, bottom: -190, near: 50, far: 1600 })
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.5
  }
  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), new THREE.ShadowMaterial({ opacity: 0.5, color: '#06130d' }))
  shadowCatcher.receiveShadow = true
  scene.add(shadowCatcher)

  // fx: a beam of light over the reserve, arcs out to each landmark, a pulse at the chosen one
  const beacon = new THREE.Group()
  beacon.add(beam(5, 900, '#ffd58a', 0.9, 3), beam(16, 700, '#f0b46a', 0.45, 10))
  beacon.visible = false
  scene.add(beacon)

  const arcs = places.map((p) => {
    const [x, y] = toLocal(SITE.at, p.at)
    const len = Math.hypot(x, y)
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, TOWER_H * 0.6), new THREE.Vector3(x / 2, y / 2, Math.max(140, len * 0.17)), new THREE.Vector3(x, y, 2))
    const radius = 1.6
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color('#ffd58a') }, uOpacity: { value: 0 }, uTime: { value: 0 }, uActive: { value: 0 }, uR: { value: radius }, uPx: { value: 1 } },
      vertexShader: ARC_VERT,
      fragmentShader: ARC_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, radius, 8), mat)
    mesh.userData.active = 0
    mesh.visible = false
    scene.add(mesh)
    return mesh
  })

  const pulse = new THREE.Group()
  const ringMat = () => new THREE.MeshBasicMaterial({ color: '#ffd58a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  for (let i = 0; i < 3; i++) pulse.add(new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 96), ringMat()))
  pulse.add(beam(2.2, 160, '#ffd58a', 0.9, 2.5))
  pulse.visible = false
  scene.add(pulse)

  // birds circle the towers in two loose flocks
  function addFlock(gltf, { radius, height, period, dir, scale, phase }) {
    const root = gltf.scene.clone()
    const gold = new THREE.MeshStandardMaterial({ color: '#d8b36c', metalness: 0.65, roughness: 0.35, emissive: '#6b4a14', emissiveIntensity: 0.7, side: THREE.DoubleSide })
    root.traverse((o) => o.isMesh && (o.material = gold))
    root.position.set(-30, 0, 55) // formation centre to the origin
    const holder = new THREE.Group()
    holder.rotation.x = Math.PI / 2 // glTF y-up to z-up; the flock flies along -y
    holder.scale.setScalar(scale)
    holder.add(root)
    const pivot = new THREE.Group()
    pivot.add(holder)
    pivot.userData = { radius, height, period, dir, phase }
    scene.add(pivot)
    const mixer = new THREE.AnimationMixer(root)
    gltf.animations.forEach((clip) => mixer.clipAction(clip).play())
    mixer.setTime(phase * 4)
    mixers.push(mixer)
    flocks.push(pivot)
  }

  function updateFlocks(t) {
    for (const f of flocks) {
      const { radius, height, period, dir, phase } = f.userData
      const a = dir * (t / period) * Math.PI * 2 + phase
      const r = radius * (1 + 0.18 * Math.sin(a * 2 + phase))
      f.position.set(Math.cos(a) * r, Math.sin(a) * r, height + 12 * Math.sin(a * 1.5))
      const heading = Math.atan2(Math.cos(a) * dir, -Math.sin(a) * dir) // tangent direction
      f.rotation.set(0, 0, heading + Math.PI / 2)
    }
  }

  async function build(renderer) {
    const env = duskEnvironment(renderer, SUN)
    scene.environment = env.texture

    const facade = new THREE.MeshStandardMaterial({ ...facadeMaps({ bay: 1.6, floor: FLOOR_H }), color: '#ffffff', metalness: 1, roughness: 1, emissive: '#ffffff', emissiveIntensity: 1.25, envMapIntensity: 1.35 })
    const stone = new THREE.MeshStandardMaterial({ color: '#e6ddce', roughness: 0.75, metalness: 0 })
    const bronze = new THREE.MeshStandardMaterial({ color: '#b48a4f', roughness: 0.32, metalness: 1, envMapIntensity: 1.4 })
    const roof = new THREE.MeshStandardMaterial({ color: '#6b7a6c', roughness: 0.9 })
    const core = new THREE.MeshStandardMaterial({ color: '#cfc5b4', roughness: 0.7 })
    const lawn = new THREE.MeshStandardMaterial({ color: '#4f7f4f', roughness: 0.95 })
    const podiumSide = new THREE.MeshStandardMaterial({ map: podiumMap({ floor: FLOOR_H }), roughness: 0.8 })

    // podium (four parking levels under the E-Deck), sunk a little so terrain never shows under it
    const podiumShape = new THREE.Shape(PODIUM.map(([x, y]) => new THREE.Vector2(x, y)))
    const podium = new THREE.Mesh(new THREE.ExtrudeGeometry(podiumShape, { depth: PODIUM_H + 4, bevelEnabled: false }).translate(0, 0, -4), [lawn, podiumSide])
    podium.castShadow = podium.receiveShadow = true
    site.add(podium)
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(15, 25), new THREE.MeshStandardMaterial({ color: '#d4c6a6', roughness: 0.8 }))
    deck.position.set(0, 3, PODIUM_H + 0.05)
    deck.receiveShadow = true
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 19), new THREE.MeshStandardMaterial({ color: '#2a8f9b', roughness: 0.04, metalness: 0.2, envMapIntensity: 1.6 }))
    pool.position.set(0, 3, PODIUM_H + 0.1)
    site.add(deck, pool)
    for (const p of PONDS) {
      const pond = new THREE.Mesh(new THREE.CircleGeometry(1, 40), pool.material)
      pond.scale.set(p.r[0], p.r[1], 1)
      pond.rotation.z = -p.rot * RAD
      pond.position.set(p.at[0], p.at[1], 0.35)
      site.add(pond)
    }

    state.highlights = []
    const towers = TOWERS.map((t) => {
      const g = buildTower({ facade, stone, bronze, roof, core })
      g.position.set(t.at[0], t.at[1], 0)
      const h = buildHighlight()
      h.visible = false
      g.add(h)
      state.highlights.push(h)
      site.add(g)
      return g
    })

    const gltf = await loadModels()
    if (disposed) return
    const kinds = gltf.slice(0, 3).map(unitModel)
    const trees = forest()
    state.trees = kinds.map((model, k) => {
      const mesh = instanced(model, trees.filter((t) => t.kind === k))
      site.add(mesh)
      return mesh
    })

    // the vertical forest: small trees on the alternating corner balconies
    const shrub = unitModel(gltf[3])
    const spots = balconies()
    for (const tower of towers) {
      tower.add(instanced(shrub, spots.map((s, i) => ({ at: [s.at[0] + s.out[0] * 0.2, s.at[1] + s.out[1] * 0.2], z: s.z + 0.15, h: 2.6 + (i % 3) * 0.5, rot: i * 1.7 })), false))
    }

    addFlock(gltf[4], { radius: 150, height: 120, period: 46, dir: 1, scale: 0.42, phase: 0 })
    addFlock(gltf[4], { radius: 95, height: 72, period: 34, dir: -1, scale: 0.34, phase: 2.1 })
    map?.triggerRepaint()
  }

  // Sits the scene on the terrain once elevation tiles arrive; re-run as finer tiles load.
  function settle() {
    if (!map) return
    const e0 = map.queryTerrainElevation(SITE.at)
    if (e0 == null) return
    ground = e0
    const m = MercatorCoordinate.fromLngLat(SITE.at, ground)
    const s = m.meterInMercatorCoordinateUnits()
    enu.makeTranslation(m.x, m.y, m.z).scale(new THREE.Vector3(s, -s, s))
    const plan = (x, y) => toLngLat(SITE.at, ...rotate([x, y], SITE.heading))
    let top = 0
    for (const mesh of state.trees ?? []) {
      const m4 = new THREE.Matrix4()
      mesh.userData.items.forEach((t, i) => {
        const e = (map.queryTerrainElevation(plan(...t.at)) ?? ground) - ground
        if (t.z === 0) top = Math.max(top, e)
        mesh.setMatrixAt(i, m4.compose(new THREE.Vector3(t.at[0], t.at[1], t.z + (t.z === 0 ? e - 0.3 : 0)), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), t.rot), new THREE.Vector3(t.h, t.h, t.h)))
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    shadowCatcher.position.z = top + 0.3
    const lm = places[state.landmark]
    if (lm) pulse.position.z = (map.queryTerrainElevation(lm.at) ?? ground) - ground + 0.5
  }

  function syncCamera(args) {
    clip.fromArray(args.defaultProjectionData.mainMatrix).multiply(enu)
    const P = tmp.P.fromArray(args.projectionMatrix)
    const V = tmp.V.copy(P).invert().multiply(clip)
    const e = V.elements
    const k = Math.hypot(e[0], e[1], e[2])
    V.premultiply(tmp.S.makeScale(1 / k, 1 / k, 1 / k))
    camera.matrixWorldInverse.copy(V)
    camera.matrixWorld.copy(V).invert()
    camera.position.setFromMatrixPosition(camera.matrixWorld)
    camera.projectionMatrix.copy(P).multiply(tmp.S.makeScale(k, k, k))
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
    pose.inverse.copy(clip).invert()
  }

  const approach = (key, target, dt, rate = 3) => (state[key] += (target - state[key]) * Math.min(1, dt * rate))

  function animate(dt, t) {
    for (const m of mixers) m.update(reduced() ? 0 : dt)
    updateFlocks(t)

    approach('highlight', state.highlightTarget, dt)
    for (const h of state.highlights ?? []) {
      const { fill, edges, band, height } = h.userData
      h.visible = state.highlight > 0.01
      fill.opacity = state.highlight * (0.08 + 0.05 * Math.sin(t * 2.4))
      edges.opacity = state.highlight * 0.95
      band.material.opacity = state.highlight * 0.9
      band.position.z = PODIUM_H + ((t * 0.12) % 1) * height
    }

    approach('beacon', state.beaconTarget, dt, 2)
    beacon.visible = state.beacon > 0.01
    beacon.children.forEach((b) => {
      b.material.uniforms.uOpacity.value = b.userData.base * state.beacon
      b.material.uniforms.uTime.value = t
    })

    approach('arcs', state.arcsTarget, dt, 2)
    arcs.forEach((a, i) => {
      a.userData.active += ((i === state.landmark ? 1 : 0) - a.userData.active) * Math.min(1, dt * 3)
      const u = a.material.uniforms
      u.uOpacity.value = state.arcs * ((state.landmark >= 0 ? 0.22 : 0.6) + a.userData.active * 0.78)
      u.uActive.value = a.userData.active
      u.uPx.value = 1 + a.userData.active * 0.8
      u.uTime.value = t + i * 0.37
      a.visible = u.uOpacity.value > 0.01
    })

    pulse.visible = state.landmark >= 0
    pulse.children.forEach((r, i) => {
      if (r.material.uniforms) {
        r.material.uniforms.uTime.value = t
        return
      }
      const k = (t * 0.45 + i / 3) % 1
      r.scale.setScalar(12 + k * 110)
      r.material.opacity = (1 - k) * 0.8
    })
  }

  const layer = {
    id: 'reserve-3d',
    type: 'custom',
    renderingMode: '3d',
    onAdd(m, gl) {
      map = m
      renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true })
      renderer.autoClear = false
      renderer.toneMapping = THREE.NeutralToneMapping
      renderer.toneMappingExposure = 1.05
      renderer.shadowMap.enabled = shadows
      renderer.shadowMap.type = THREE.PCFShadowMap
      layer.ready = build(renderer)
      settle()
    },
    render(gl, args) {
      if (!renderer) return
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!reduced()) pose.time += dt
      syncCamera(args)
      animate(dt, pose.time)
      renderer.resetState()
      renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
      renderer.render(scene, camera)
      onFrame?.(pose)
      map.triggerRepaint()
    },
    onRemove() {
      disposed = true
      scene.traverse((o) => {
        o.geometry?.dispose()
        ;[o.material].flat().forEach((m) => {
          if (!m) return
          Object.values(m).forEach((v) => v?.isTexture && v.dispose())
          m.dispose()
        })
      })
      scene.environment?.dispose()
      renderer?.dispose()
    },
  }

  return {
    layer,
    settle,
    setHighlight: (on) => (state.highlightTarget = on ? 1 : 0),
    setNeighbourhood: (on) => {
      state.beaconTarget = on ? 1 : 0
      state.arcsTarget = on ? 1 : 0
    },
    setLandmark(i) {
      state.landmark = i
      if (i < 0) return
      const [x, y] = toLocal(SITE.at, places[i].at)
      pulse.position.set(x, y, (map?.queryTerrainElevation(places[i].at) ?? ground) - ground + 0.5)
    },
    groundAt: (at) => (map?.queryTerrainElevation(at) ?? ground) - ground,
  }
}
