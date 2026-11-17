import * as THREE from 'three'
import WATER from '../data/water.json'
import { SITE } from '../data/content'
import { toLocal } from './geo'
import { ROAD_LOOKS } from './style'
import { moonlit } from './night'

/*
 * The bridges over the water. The map paints its roads and railways flat on the ground, and the
 * water is drawn in 3D just above it, so where a road crossed a creek it went under the water and
 * the road seemed to stop at the bank. Each bridge that crosses water (scripts/water.mjs) is laid
 * here as a flat deck a little over the water, in the map's own paint: its colour, and its width in
 * screen pixels for the zoom (worked out each frame), dashed as the map dashes the railways.
 * Where its ends run on over land they sink into the ground, under the map's own road.
 */

// how far over the water the decks sit (m)
const LIFT = 1.5
// the world's circumference (m), for MapLibre's metres per pixel (512 px tiles)
const EARTH = 40075016.686

// MapLibre's ['interpolate', ['exponential', 1.6], ['zoom'], …stops]
function widthAt(stops, zoom) {
  if (zoom <= stops[0]) return stops[1]
  for (let i = 2; i < stops.length; i += 2) {
    const [z0, w0, z1, w1] = [stops[i - 2], stops[i - 1], stops[i], stops[i + 1]]
    if (zoom <= z1) return w0 + (w1 - w0) * ((1.6 ** (zoom - z0) - 1) / (1.6 ** (z1 - z0) - 1))
  }
  return stops[stops.length - 1]
}

// sRGB colour values as they are, so the decks match the map's paint exactly (no lighting, no tone mapping)
const rgb = (css) => {
  const c = new THREE.Color()
  c.setStyle(css, THREE.LinearSRGBColorSpace)
  return c
}

const VERTEX = /* glsl */ `
attribute vec2 aSide;
attribute float aDist;
uniform float uHalf;
varying float vDist;
void main() {
  vDist = aDist;
  vec3 p = position + vec3(aSide * uHalf, 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uDash;
uniform float uOn;
varying float vDist;
void main() {
  if (uDash > 0.0 && mod(vDist, uDash) > uOn) discard;
  gl_FragColor = vec4(uColor, 1.0);
}`

// one ribbon per bridge: two vertices a point, either side of the line (mitred at the bends)
function ribbon(points) {
  const pos = []
  const side = []
  const dist = []
  const index = []
  let run = 0
  points.forEach(([x, y, z], i) => {
    const prev = points[i - 1] ?? points[i]
    const next = points[i + 1] ?? points[i]
    if (i) run += Math.hypot(x - prev[0], y - prev[1])
    const n = (a, b) => {
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
      return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]
    }
    const n0 = i ? n(prev, points[i]) : n(points[i], next)
    const n1 = i < points.length - 1 ? n(points[i], next) : n0
    let m = [n0[0] + n1[0], n0[1] + n1[1]]
    const ml = Math.hypot(...m) || 1
    m = [m[0] / ml, m[1] / ml]
    const k = Math.min(2, 1 / Math.max(0.5, m[0] * n0[0] + m[1] * n0[1]))
    for (const s of [1, -1]) {
      pos.push(x, y, z)
      side.push(m[0] * k * s, m[1] * k * s)
      dist.push(run)
    }
    if (i) {
      const a = (i - 1) * 2
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 2))
  g.setAttribute('aDist', new THREE.Float32BufferAttribute(dist, 1))
  g.setIndex(index)
  return g
}

export function createBridges() {
  const group = new THREE.Group()
  // one material a kind of road, shared by its bridges
  const kinds = Object.fromEntries(
    Object.entries(ROAD_LOOKS).map(([id, look]) => [
      id,
      {
        look,
        day: rgb(look.color),
        night: rgb(moonlit(look.color)),
        material: new THREE.ShaderMaterial({
          vertexShader: VERTEX,
          fragmentShader: FRAGMENT,
          uniforms: { uHalf: { value: 0 }, uColor: { value: rgb(look.color) }, uDash: { value: 0 }, uOn: { value: 0 } },
          // over the water, which sits only a metre or two under them
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -4,
        }),
      },
    ]),
  )
  // the major roads over the minor ones where they cross
  const ORDER = ['path', 'minor', 'rail', 'street', 'primary', 'trunk']

  return {
    group,
    // lays each bridge just over the water it crosses, once the water has been set on the terrain
    settle(levelAt) {
      for (const m of [...group.children]) {
        m.geometry.dispose()
        group.remove(m)
      }
      for (const { kind, path } of WATER.bridges ?? []) {
        const k = kinds[kind]
        if (!k) continue
        const deck = Math.max(...path.map(levelAt)) + LIFT
        const mesh = new THREE.Mesh(ribbon(path.map((p) => [...toLocal(SITE.at, p), deck])), k.material)
        mesh.renderOrder = 1 + ORDER.indexOf(kind)
        mesh.frustumCulled = false
        group.add(mesh)
      }
    },
    // each kind's width (and dashes) in metres for the map's zoom, as the map draws its roads
    update(map) {
      const zoom = map.getZoom()
      const mpp = (EARTH * Math.cos((map.getCenter().lat * Math.PI) / 180)) / (512 * 2 ** zoom)
      for (const { look, material } of Object.values(kinds)) {
        const px = zoom < (look.min ?? 0) ? 0 : widthAt(look.width, zoom)
        const w = px * mpp
        material.uniforms.uHalf.value = w / 2
        material.uniforms.uDash.value = look.dash ? (look.dash[0] + look.dash[1]) * w : 0
        material.uniforms.uOn.value = look.dash ? look.dash[0] * w : 0
        material.visible = px > 0
      }
    },
    // how far into the night (0..1): moonlit, as the map's own roads go (night.js)
    setNight(k) {
      for (const { day, night, material } of Object.values(kinds)) material.uniforms.uColor.value.copy(day).lerp(night, k)
    },
  }
}
