import * as THREE from 'three'
import { rng } from '../art/rng'

const canvas = (w, h = w) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

const texture = (c, srgb) => {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}

/*
 * Curtain-wall facade: 16 bays × 16 floors per tile, with stone slab bands, bronze mullions and
 * randomly lit interiors. Returns colour, emissive and roughness/metalness (G/B) maps.
 * ExtrudeGeometry side UVs are in metres, so `repeat` maps one tile to bay × floor metres.
 */
export function facadeMaps({ bay, floor, seed = 3 }) {
  const N = 16
  const S = 64
  const [cc, c] = canvas(N * S)
  const [ec, e] = canvas(N * S)
  const [mc, m] = canvas(N * S)
  const r = rng(seed)
  const slab = 10
  e.fillStyle = '#000'
  e.fillRect(0, 0, N * S, N * S)
  for (let fy = 0; fy < N; fy++) {
    for (let bx = 0; bx < N; bx++) {
      const x = bx * S
      const y = fy * S
      // glass, a little lighter towards the top of each pane like a sky reflection
      const g = c.createLinearGradient(0, y + slab, 0, y + S)
      g.addColorStop(0, '#41606a')
      g.addColorStop(1, '#1d3036')
      c.fillStyle = g
      c.fillRect(x, y, S, S)
      m.fillStyle = 'rgb(0, 26, 230)'
      m.fillRect(x, y, S, S)
      // interior light
      const k = r()
      if (k < 0.42) {
        const warm = k < 0.36
        const a = 0.35 + r() * 0.65
        const ig = e.createLinearGradient(0, y + slab, 0, y + S)
        ig.addColorStop(0, warm ? `rgba(255, 196, 120, ${a * 0.55})` : `rgba(190, 215, 255, ${a * 0.35})`)
        ig.addColorStop(1, warm ? `rgba(255, 214, 150, ${a})` : `rgba(200, 225, 255, ${a * 0.6})`)
        e.fillStyle = ig
        const w = r() < 0.3 ? S * 2 : S
        e.fillRect(x + 3, y + slab, w - 6, S - slab)
        c.fillStyle = warm ? 'rgba(120, 90, 60, 0.35)' : 'rgba(80, 95, 120, 0.3)'
        c.fillRect(x + 3, y + slab, w - 6, S - slab)
      }
    }
    // slab band at the top of each canvas row (the floor line once mapped onto the wall)
    c.fillStyle = '#ddd4c4'
    c.fillRect(0, fy * S, N * S, slab)
    m.fillStyle = 'rgb(0, 210, 0)'
    m.fillRect(0, fy * S, N * S, slab)
    e.fillStyle = '#000'
    e.fillRect(0, fy * S, N * S, slab)
  }
  // mullions and a transom
  for (let bx = 0; bx <= N; bx++) {
    c.fillStyle = '#5e4d36'
    c.fillRect(bx * S - 2, 0, 4, N * S)
    m.fillStyle = 'rgb(0, 90, 255)'
    m.fillRect(bx * S - 2, 0, 4, N * S)
    e.fillStyle = '#000'
    e.fillRect(bx * S - 2, 0, 4, N * S)
  }
  for (let fy = 0; fy < N; fy++) {
    c.fillStyle = 'rgba(94, 77, 54, 0.8)'
    c.fillRect(0, fy * S + slab + 34, N * S, 2)
  }
  const maps = { map: texture(cc, true), emissiveMap: texture(ec, true), roughnessMap: texture(mc), metalnessMap: null }
  maps.metalnessMap = maps.roughnessMap
  const repeat = [1 / (N * bay), 1 / (N * floor)]
  for (const t of [maps.map, maps.emissiveMap, maps.roughnessMap]) {
    t.repeat.set(...repeat)
    t.offset.set(0, -repeat[1])
  }
  return maps
}

// Podium: parking levels behind planted stone bands.
export function podiumMap({ floor }) {
  const [cc, c] = canvas(256, 256)
  c.fillStyle = '#1f2b27'
  c.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 4; i++) {
    const y = i * 64
    c.fillStyle = '#cfc6b6'
    c.fillRect(0, y, 256, 14)
    c.fillStyle = '#3f6a45'
    c.fillRect(0, y + 14, 256, 7)
    c.fillStyle = '#2f5537'
    for (let x = 0; x < 256; x += 9) c.fillRect(x, y + 21, 5, 4 + ((x * 7) % 11))
  }
  const t = texture(cc, true)
  t.repeat.set(1 / 24, 1 / (4 * floor))
  t.offset.set(0, -1 / (4 * floor))
  return t
}

// A plain daylight sky, used for reflections until the HDRI has loaded. It is built the HDRI's way
// (y up, sun where the HDRI's sun is) so the same environment rotation suits both.
export function skyEnvironment(renderer, sunDir) {
  const scene = new THREE.Scene()
  const geo = new THREE.SphereGeometry(10, 48, 24)
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { uSun: { value: sunDir.clone().normalize() } },
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uSun;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 zenith = vec3(0.32, 0.55, 0.82);
        vec3 horizon = vec3(0.9, 0.92, 0.9);
        vec3 ground = vec3(0.3, 0.36, 0.28);
        vec3 col = h > 0.0 ? mix(horizon, zenith, pow(h, 0.5)) : mix(horizon * 0.6, ground, pow(-h, 0.35));
        float s = max(dot(d, uSun), 0.0);
        col += vec3(1.0, 0.92, 0.8) * (pow(s, 600.0) * 12.0 + pow(s, 16.0) * 0.4);
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
  scene.add(new THREE.Mesh(geo, mat))
  const pmrem = new THREE.PMREMGenerator(renderer)
  const target = pmrem.fromScene(scene, 0, 0.1, 100)
  pmrem.dispose()
  geo.dispose()
  mat.dispose()
  return target
}
