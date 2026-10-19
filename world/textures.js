import * as THREE from 'three'

// A plain daylight sky, for reflections should the HDRI fail to load. It is built the HDRI's way
// (y up, sun where the HDRI's sun is) so the same environment rotation suits both. Prefiltered
// with the scene's own PMREM generator (as is duskSky), whose filter shader is compiled already.
export function skyEnvironment(pmrem, sunDir) {
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
  const target = pmrem.fromScene(scene, 0, 0.1, 100)
  geo.dispose()
  mat.dispose()
  return target
}

// The map's own golden-hour sky (z up, like the scene), for the water to reflect: the HDRI is a
// daylight sky, which would turn the creek blue under an amber horizon.
export function duskSky(pmrem, sunDir) {
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
        float h = d.z;
        vec3 zenith = vec3(0.11, 0.3, 0.38);
        vec3 horizon = vec3(0.96, 0.74, 0.52);
        vec3 ground = vec3(0.07, 0.16, 0.12);
        vec3 col = h > 0.0 ? mix(horizon, zenith, pow(h, 0.45)) : mix(horizon * 0.5, ground, pow(-h, 0.35));
        float s = max(dot(d, uSun), 0.0);
        col += vec3(1.0, 0.75, 0.45) * (pow(s, 600.0) * 14.0 + pow(s, 12.0) * 0.5);
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
  scene.add(new THREE.Mesh(geo, mat))
  const target = pmrem.fromScene(scene, 0, 0.1, 100)
  geo.dispose()
  mat.dispose()
  return target
}

// The sky the building's glass and metal reflect: a clear blue that turns gold at the horizon,
// with the sun's glow and a few faint streaks of cloud, mirrored about the horizon. Seen from up
// here a window faces the lower half of whatever it reflects, so a sky that is sky all round keeps
// every pane bright. Built z-up like duskSky, so it needs no turning.
export function glassSky(pmrem, sunDir) {
  const scene = new THREE.Scene()
  const geo = new THREE.SphereGeometry(10, 64, 32)
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { uSun: { value: sunDir.clone().normalize() } },
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uSun;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
      }
      void main() {
        vec3 d = normalize(vDir);
        float h = abs(d.z);
        vec3 col = mix(vec3(0.75, 0.62, 0.48), vec3(0.1, 0.28, 0.6), pow(h, 0.25));
        // long thin cloud streaks low in the sky, on a plane overhead (so no seam)
        vec2 p = d.xy / (h + 0.2) * vec2(1.2, 4.0);
        float cloud = noise(p) * 0.65 + noise(p * 2.3 + 7.0) * 0.35;
        col = mix(col, vec3(0.85, 0.82, 0.78), smoothstep(0.62, 0.9, cloud) * smoothstep(0.02, 0.12, h) * (1.0 - smoothstep(0.3, 0.6, h)) * 0.35);
        float s = max(dot(vec3(d.xy, h), uSun), 0.0);
        col += vec3(1.0, 0.76, 0.48) * (pow(s, 10.0) * 0.6 + pow(s, 300.0) * 3.0);
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
  scene.add(new THREE.Mesh(geo, mat))
  const target = pmrem.fromScene(scene, 0, 0.1, 100)
  geo.dispose()
  mat.dispose()
  return target
}
