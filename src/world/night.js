/*
 * Night over the Location map: its colours taken down to moonlight, darker and leaning to blue, while
 * the orange of the reserve's edge, its running track and the drives are left as they are, so they
 * glow; the labels turn light.
 *
 * Moonlight is one colour sum for every colour (r·0.30 + 3, g·0.38 + 8, b·0.52 + 16, out of 255:
 * `moonlit`). The map's flat layers (ground, land, water, roads, relief) are painted into textures
 * draped over the terrain, and MapLibre only repaints those when their tiles or zoom change, never for
 * a paint change: changing their colours meant throwing every draped texture away and painting it
 * again, which could only be done in steps, and the map went dark in jumps while the 3D scene faded
 * smoothly beside it. So their colours never change. Instead a layer of moonlight is laid over them
 * (the `night-tint` custom layer, drawn just after them and before the warm layers, the buildings,
 * the 3D scene and the labels): every pixel under it multiplied and lifted by the same sum, blended
 * from nothing (day) to all of it (night), a little more each frame. As the sum is the same for every
 * colour, and linear, it gives exactly the colours the flat layers would have had painted in
 * moonlight, blends and all. The sky, drawn first, is under it too, so the sky's own colours are set
 * to what comes out right once moonlit. What is drawn after it (the buildings and the labels, which
 * aren't draped, so their paint can change every frame) is moved to its night colours directly.
 *
 * `addNightTint(map, before)` puts the moonlight in; `setMapNight(map, k)` blends day (0) to night (1)
 * and can be called every frame.
 */
const TINT = [0.3, 0.38, 0.52]
const LIFT = [3, 8, 16]

const day = new WeakMap()
const tints = new WeakMap()

function parse(s) {
  if (typeof s !== 'string') return null
  let m = s.match(/^#([0-9a-f]{6})$/i)
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(1)
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/i)
  return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null
}
const rgba = ([r, g, b, a]) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${+a.toFixed(3)})`

// the warm accents (the logo's orange) keep their colour after dark
const warm = ([r, g, b]) => r > 150 && r > g * 1.3 && g > b

// moonlight: darker, and leaning to blue (the bridges, drawn in 3D, use it too)
export function moonlit(s) {
  const c = parse(s)
  if (!c || warm(c)) return s
  const [r, g, b, a] = c
  return rgba([Math.min(255, r * TINT[0] + LIFT[0]), Math.min(255, g * TINT[1] + LIFT[1]), Math.min(255, b * TINT[2] + LIFT[2]), a])
}
const night = (v) => (Array.isArray(v) ? v.map(night) : moonlit(v))

// the blend of a day value and its night one: colours mixed, numbers eased, anything else switched halfway
function blend(d, n, k) {
  if (Array.isArray(d) && Array.isArray(n) && d.length === n.length) return d.map((v, i) => blend(v, n[i], k))
  const a = parse(d)
  const b = parse(n)
  if (a && b) return rgba(a.map((v, i) => v + (b[i] - v) * k))
  if (typeof d === 'number' && typeof n === 'number') return d + (n - d) * k
  return k < 0.5 ? d : n
}

// how much of the moonlight is laid on at k: each channel's multiplier, and its lift (0..255)
const gain = (k) => TINT.map((t) => 1 + (t - 1) * k)
const lift = (k) => LIFT.map((l) => l * k)

const LIGHT_TEXT = 'rgba(232, 238, 242, 0.82)'
// set by hand: the blocks one deep slate-teal (by height they come out a dull maroon under the
// moon), and the labels light
const NIGHT_PAINT = {
  buildings: { 'fill-extrusion-color': '#1c3440' },
  'place-label': { 'text-color': LIGHT_TEXT },
  'road-label': { 'text-color': LIGHT_TEXT },
}

const NIGHT_SKY = {
  'sky-color': '#081521',
  'horizon-color': '#1d3346',
  'fog-color': '#0d1b27',
}
const NIGHT_LIGHT = { color: '#9fb6d2', intensity: 0.22 }

// the flat layers, draped over the terrain: the moonlight takes care of them
const DRAPED = new Set(['background', 'fill', 'line', 'raster', 'hillshade', 'color-relief'])

// The sky's colour at k such that, under the moonlight, it shows the blend of the day's and the night's.
function skyColour(d, n, k) {
  const want = parse(blend(d, n, k))
  if (!want) return blend(d, n, k)
  const [g, l] = [gain(k), lift(k)]
  return rgba([0, 1, 2].map((i) => Math.max(0, Math.min(255, (want[i] - l[i]) / g[i]))).concat(want[3]))
}

const VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }'
const FRAG = 'precision mediump float; uniform vec4 lift; void main() { gl_FragColor = lift; }'

// The moonlight as a MapLibre custom layer: one triangle over the screen, blended as
// out = under · gain + lift (the gain as the blend colour), alpha left as it was.
function tintLayer() {
  const s = { k: 0 }
  let gl, prog, buf, vao, at, uLift
  const compile = (type, src) => {
    const sh = gl.createShader(type)
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    return sh
  }
  const layer = {
    id: 'night-tint',
    type: 'custom',
    renderingMode: '2d',
    onAdd(_, context) {
      gl = context
      prog = gl.createProgram()
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      at = gl.getAttribLocation(prog, 'p')
      uLift = gl.getUniformLocation(prog, 'lift')
      // its own vertex array, so MapLibre's are never touched
      vao = gl.createVertexArray?.() ?? null
      gl.bindVertexArray?.(vao)
      buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(at)
      gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0)
      gl.bindVertexArray?.(null)
    },
    render(context) {
      if (s.k <= 0 || !prog) return
      gl = context
      const [g, l] = [gain(s.k), lift(s.k)]
      gl.useProgram(prog)
      if (vao) gl.bindVertexArray(vao)
      else {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.enableVertexAttribArray(at)
        gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0)
      }
      gl.disable(gl.DEPTH_TEST)
      gl.disable(gl.STENCIL_TEST)
      gl.disable(gl.CULL_FACE)
      gl.colorMask(true, true, true, true)
      gl.enable(gl.BLEND)
      gl.blendEquation(gl.FUNC_ADD)
      gl.blendColor(g[0], g[1], g[2], 1)
      gl.blendFuncSeparate(gl.ONE, gl.CONSTANT_COLOR, gl.ZERO, gl.ONE)
      gl.uniform4f(uLift, l[0] / 255, l[1] / 255, l[2] / 255, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (vao) gl.bindVertexArray(null)
    },
    onRemove() {
      gl?.deleteProgram(prog)
      gl?.deleteBuffer(buf)
      if (vao) gl?.deleteVertexArray(vao)
      prog = null
    },
  }
  return { layer, s }
}

// Lays the moonlight in, under the layer `before` and everything after it.
export function addNightTint(map, before) {
  const t = tintLayer()
  tints.set(map, t.s)
  map.addLayer(t.layer, map.getLayer(before) ? before : undefined)
}

export function setMapNight(map, k) {
  if (!day.has(map)) {
    const style = map.getStyle()
    const layers = style.layers.filter((l) => !DRAPED.has(l.type) && l.type !== 'custom' && !l.id.startsWith('route'))
    day.set(map, { layers: layers.map((l) => ({ id: l.id, paint: { ...l.paint } })), sky: style.sky, light: style.light, fresh: true })
  }
  const saved = day.get(map)
  for (const { id, paint } of saved.layers) {
    for (const [prop, value] of Object.entries(paint)) {
      if (!prop.endsWith('-color')) continue
      if (saved.fresh) map.setPaintProperty(id, `${prop}-transition`, { duration: 0, delay: 0 })
      map.setPaintProperty(id, prop, blend(value, NIGHT_PAINT[id]?.[prop] ?? night(value), k))
    }
  }
  saved.fresh = false
  // the sky and the light take the style's transition (300 ms by default), which would trail the
  // moonlight by a few frames: they are set at once, the style's transition kept for everything else
  const sheet = map.style?.stylesheet
  const was = sheet?.transition
  if (sheet) sheet.transition = { duration: 0, delay: 0 }
  try {
    if (saved.sky) map.setSky(Object.fromEntries(Object.entries(saved.sky).map(([p, v]) => [p, NIGHT_SKY[p] ? skyColour(v, NIGHT_SKY[p], k) : v])))
    if (saved.light) map.setLight({ ...saved.light, color: blend(saved.light.color, NIGHT_LIGHT.color, k), intensity: blend(saved.light.intensity, NIGHT_LIGHT.intensity, k) })
  } finally {
    if (sheet) sheet.transition = was
  }
  const tint = tints.get(map)
  if (tint) tint.k = k
  map.triggerRepaint()
}
