/*
 * Volumetric-looking clouds drawn over the map at half resolution. Every pixel casts a ray from
 * the map's real camera (scene metres, z up) against two horizontal cloud decks, so the clouds
 * keep true perspective and parallax, cast shadows on the ground, and white the view out while
 * the camera flies through a deck.
 */
const VERT = `#version 300 es
in vec2 aPos;
out vec2 vNdc;
void main() { vNdc = aPos; gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
in vec2 vNdc;
out vec4 frag;
uniform mat4 uInv;
uniform vec3 uEye;
uniform float uTime;
uniform vec3 uSun;
uniform vec4 uA;      // altitude, half thickness, coverage, feature size (m)
uniform vec4 uB;
uniform float uMist;  // extra cover (intro, loading)
uniform vec3 uHaze;
uniform float uClear; // how far the clouds part in front of the subject
uniform vec3 uFlow;   // where the camera is heading on screen (ndc), and how far it has flown in
uniform int uOne;     // always 1; see fbm

vec3 centre;          // the ray through the middle of the screen

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);
// The loop runs to oct * uOne: a bound the shader compiler can't see through keeps it from
// unrolling every noise loop in the shader, which took it seconds to compile on Windows (Direct3D).
float fbm(vec2 p, int oct) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < oct * uOne; i++) { v += a * noise(p); p = ROT * p * 2.03 + 17.1; a *= 0.5; }
  return v;
}

float density(vec2 p, vec4 L, vec2 wind) {
  vec2 q = (p + wind * uTime) / L.w;
  vec2 w = vec2(fbm(q * 0.6 + 3.1, 3), fbm(q * 0.6 + 8.7, 3));
  float d = fbm(q + (w - 0.5) * 1.1, 5);
  float c = L.z + uMist * 0.6;
  float edge = 0.74 - 0.42 * c;
  return smoothstep(edge, edge + 0.2, d);
}

// One deck along the ray: premultiplied colour, and hit distance in w (or -1).
vec4 deck(vec3 ro, vec3 rd, vec4 L, vec2 wind, out float t) {
  t = -1.0;
  if (abs(rd.z) < 1e-4) return vec4(0.0);
  float tt = (L.x - ro.z) / rd.z;
  if (tt <= 0.0) return vec4(0.0);
  t = tt;
  vec2 p = ro.xy + rd.xy * tt;
  float d = density(p, L, wind);
  // part the deck where the middle of the view passes through it
  float tc = (L.x - ro.z) / centre.z;
  if (tc > 0.0 && uMist < 0.5 && uClear > 0.0) {
    float r = tc * uClear;
    d *= smoothstep(r * 0.3, r, distance(p, ro.xy + centre.xy * tc));
  }
  if (d < 0.003) return vec4(0.0);
  float d2 = density(p + uSun.xy * L.w * 0.12, L, wind);
  float lit = clamp(0.58 + (d - d2) * 1.5, 0.0, 1.0);
  bool above = ro.z > L.x;
  vec3 top = mix(vec3(0.6, 0.62, 0.66), vec3(1.0, 0.92, 0.82), lit);
  vec3 under = mix(vec3(0.3, 0.34, 0.36), vec3(0.86, 0.68, 0.54), lit * 0.75);
  vec3 col = above ? top : under;
  col += vec3(1.0, 0.72, 0.42) * pow(max(dot(rd, uSun), 0.0), 5.0) * (1.0 - d) * 0.9;
  float fade = exp(-tt / 14000.0);
  col = mix(uHaze, col, fade);
  float a = d * 0.94 * mix(0.25, 1.0, fade);
  // clouds seen above the camera are faded while the camera is low among the towers
  if (!above) a *= smoothstep(95.0, 125.0, ro.z);
  return vec4(col * a, a);
}

void main() {
  vec4 a = uInv * vec4(vNdc, -1.0, 1.0);
  vec4 b = uInv * vec4(vNdc, 1.0, 1.0);
  vec3 rd = normalize(b.xyz / b.w - a.xyz / a.w);
  vec3 ro = uEye;
  vec4 ca = uInv * vec4(0.0, 0.0, -1.0, 1.0);
  vec4 cb = uInv * vec4(0.0, 0.0, 1.0, 1.0);
  centre = normalize(cb.xyz / cb.w - ca.xyz / ca.w);

  float tA, tB;
  vec4 A = deck(ro, rd, uA, vec2(7.0, 2.5), tA);
  vec4 B = deck(ro, rd, uB, vec2(12.0, 4.0), tB);
  bool aFirst = tB < 0.0 || (tA > 0.0 && tA < tB);
  vec4 c = aFirst ? A + B * (1.0 - A.a) : B + A * (1.0 - B.a);

  // cloud shadows on the ground under the low deck
  if (rd.z < 0.0) {
    float tg = -ro.z / rd.z;
    vec2 g = ro.xy + rd.xy * tg;
    float s = density(g + uSun.xy / max(uSun.z, 0.2) * uA.x, uA, vec2(7.0, 2.5));
    float sa = s * 0.3 * exp(-tg / 9000.0);
    c += vec4(0.0, 0.0, 0.0, sa) * (1.0 - c.a);
  }

  // inside a deck: the view whites out, broken up so it reads as rushing past cloud
  float inA = (1.0 - smoothstep(0.0, uA.y, abs(ro.z - uA.x))) * min(0.8, uA.z * 1.5);
  float inB = (1.0 - smoothstep(0.0, uB.y, abs(ro.z - uB.x))) * min(1.0, uB.z * 1.9);
  float fog = clamp(max(inA, inB) + uMist, 0.0, 1.0);
  if (fog > 0.001) {
    // Wisps stream out from where the camera is heading: two scales of the same noise grow as it
    // flies in, crossfaded (at constant contrast) so the stream never runs out.
    vec2 q = (vNdc - uFlow.xy) * vec2(1.4, 0.9) * 1.6;
    vec2 drift = vec2(uTime * 0.04, 0.0);
    float f = fract(uFlow.z);
    float n0 = fbm(q * exp2(1.0 - f) + drift, 5) - 0.5;
    float n1 = fbm(q * exp2(2.0 - f) + drift, 5) - 0.5;
    float n = 0.5 + ((1.0 - f) * n0 + f * n1) / sqrt((1.0 - f) * (1.0 - f) + f * f);
    float fa = clamp(fog * (0.55 + 0.75 * n) + fog * fog * 0.4, 0.0, 1.0);
    vec3 fc = mix(vec3(0.78, 0.8, 0.8), vec3(1.0, 0.93, 0.85), n);
    c = vec4(fc * fa, fa) + c * (1.0 - fa);
  }
  frag = c;
}`

function shader(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  return s
}

export function createClouds(canvas, { scale = 0.5 } = {}) {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false })
  if (!gl) return null
  // The shader is big and can take a second or more to compile. Where the browser offers
  // KHR_parallel_shader_compile the driver compiles it off the main thread, and the clouds start
  // drawing once it is done; nothing asks for its status before then, since that would wait.
  const parallel = gl.getExtension('KHR_parallel_shader_compile')
  const prog = gl.createProgram()
  const shaders = [shader(gl, gl.VERTEX_SHADER, VERT), shader(gl, gl.FRAGMENT_SHADER, FRAG)]
  shaders.forEach((s) => gl.attachShader(prog, s))
  gl.linkProgram(prog)
  let status = 'compiling'
  let loc
  let u
  let settle
  // resolves once the shader has compiled (or failed: either way there is nothing to wait for)
  const compiled = new Promise((r) => (settle = r))
  const ready = () => {
    if (status !== 'compiling') return status === 'ready'
    if (parallel && !gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR)) return false
    settle()
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      status = 'failed'
      console.error('clouds:', gl.getProgramInfoLog(prog), ...shaders.map((s) => gl.getShaderInfoLog(s)))
      return false
    }
    status = 'ready'
    loc = gl.getAttribLocation(prog, 'aPos')
    u = Object.fromEntries(['uInv', 'uEye', 'uTime', 'uSun', 'uA', 'uB', 'uMist', 'uHaze', 'uClear', 'uFlow', 'uOne'].map((n) => [n, gl.getUniformLocation(prog, n)]))
    return true
  }
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const inv = new Float32Array(16)

  /*
   * The in-cloud stream: how far the camera has flown into the view (in doublings of the wisps'
   * size, plus a slow drift so cloud never hangs still) and the point on screen it is heading
   * for, eased so turns don't jerk the stream around.
   */
  const flow = { x: 0, y: 0, phase: 0, eye: null, time: 0 }
  function track({ eye, inverse, clip, time }) {
    const dt = Math.min(0.1, Math.max(0, time - flow.time))
    flow.time = time
    flow.phase += dt * 0.12
    const last = flow.eye
    flow.eye = [eye.x, eye.y, eye.z]
    if (!last) return
    const d = [eye.x - last[0], eye.y - last[1], eye.z - last[2]]
    const len = Math.hypot(...d)
    // standing still, or a cut
    if (len < 0.01 || len > 3000) return
    const i = inverse.elements
    const at = (z) => {
      const w = i[11] * z + i[15]
      return [(i[8] * z + i[12]) / w, (i[9] * z + i[13]) / w, (i[10] * z + i[14]) / w]
    }
    const [n, f] = [at(-1), at(1)]
    const view = [f[0] - n[0], f[1] - n[1], f[2] - n[2]]
    const ahead = (d[0] * view[0] + d[1] * view[1] + d[2] * view[2]) / Math.hypot(...view)
    flow.phase += ahead / 500
    // flying backwards, the stream closes in on the point it is leaving
    const s = ((ahead < 0 ? -1 : 1) * 1000) / len
    const p = [eye.x + d[0] * s, eye.y + d[1] * s, eye.z + d[2] * s]
    const c = clip.elements
    const w = c[3] * p[0] + c[7] * p[1] + c[11] * p[2] + c[15]
    if (w <= 0) return
    const clamp = (v) => Math.min(1.5, Math.max(-1.5, v))
    const k = Math.min(1, dt * 4)
    flow.x += (clamp((c[0] * p[0] + c[4] * p[1] + c[8] * p[2] + c[12]) / w) - flow.x) * k
    flow.y += (clamp((c[1] * p[0] + c[5] * p[1] + c[9] * p[2] + c[13]) / w) - flow.y) * k
  }

  // decks: altitude and half-thickness (m), coverage 0..1, feature size (m)
  const params = {
    a: { alt: 215, half: 48, cover: 0.5, size: 260 },
    b: { alt: 4200, half: 380, cover: 0.56, size: 1300 },
    mist: 1,
    clear: 0.45,
    haze: [0.86, 0.62, 0.45],
  }
  const vec = (d) => [d.alt, d.half, d.cover, d.size]

  // the canvas's size on screen, kept up to date by an observer: reading it every frame would force
  // the browser to lay the page out again each time
  let box = [canvas.clientWidth, canvas.clientHeight]
  const watch = new ResizeObserver(([e]) => (box = [e.contentRect.width, e.contentRect.height]))
  watch.observe(canvas)

  function resize() {
    const w = Math.max(1, Math.round(box[0] * scale))
    const h = Math.max(1, Math.round(box[1] * scale))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
  }

  return {
    params,
    compiled,
    // altitude bands (m) a resting camera should stay out of
    bands: () => [params.a, params.b].map((d) => [d.alt - d.half - 30, d.alt + d.half + 30]),
    // how deep in cloud the camera is (0..1), for fading DOM labels with the view
    fog(eye) {
      const into = ({ alt, half, cover }, k) => Math.max(0, 1 - Math.abs(eye.z - alt) / half) * Math.min(1, cover * k)
      return Math.min(1, Math.max(Math.min(0.8, into(params.a, 1.5)), into(params.b, 1.9)) + params.mist)
    },
    // Draws a frame. False while the shader is still compiling (true once it has failed too:
    // there is nothing more to wait for).
    draw(pose, sun) {
      resize()
      track(pose)
      // only its fraction shows, and a small number keeps its precision
      flow.phase -= Math.floor(flow.phase)
      if (!ready()) return status === 'failed'
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(prog)
      pose.inverse.elements.forEach((v, i) => (inv[i] = v))
      gl.uniformMatrix4fv(u.uInv, false, inv)
      gl.uniform3f(u.uEye, pose.eye.x, pose.eye.y, pose.eye.z)
      gl.uniform1f(u.uTime, pose.time)
      gl.uniform3f(u.uSun, ...sun)
      gl.uniform4f(u.uA, ...vec(params.a))
      gl.uniform4f(u.uB, ...vec(params.b))
      gl.uniform1f(u.uMist, params.mist)
      gl.uniform3f(u.uHaze, ...params.haze)
      gl.uniform1f(u.uClear, params.clear)
      gl.uniform3f(u.uFlow, flow.x, flow.y, flow.phase)
      gl.uniform1i(u.uOne, 1)
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      return true
    },
    dispose() {
      watch.disconnect()
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
