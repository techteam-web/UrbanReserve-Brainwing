import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'

/*
 * Birds over the neighbourhood: flocks of blackbirds and, now and then, a lone eagle, flying low
 * over the city among the low clouds, each in a slow straight line across the view from one side
 * to the other. They get their own small scene on a canvas between the map and the cloud layer
 * (so the low clouds drift over them), drawn with the map's own camera. Their models load once the
 * page is in, and their shaders compile in the background before the first one flies.
 *
 * A pass runs at a set height over the ground, from just outside one edge of the frame to the
 * other. Seen from this high up, real birds would be specks too small to see, so each pass sizes
 * its birds for the distance they fly at, to a set size on screen: the same birds in every view.
 */

// What flies: its model, which way it faces (radians about the vertical, so it flies head
// first), whether it soars (gliding between wingbeats), how many wingspans wide its model is
// (a flock's is a formation of five), one bird's wingspan on screen (px), how high it flies
// over the ground (m), how long it takes to cross the frame (s), the band of the frame it crosses
// (NDC y, -1 bottom to 1 top), its wingbeat (times the clip's own pace), how many formations fly
// together and the pause between passes (s).
const KINDS = {
  flock: { url: '/models/blackbirds.gltf', facing: -Math.PI / 2, wide: 4.4, px: 11, height: [150, 280], cross: [26, 32], band: [-0.45, 0.25], flap: [1.6, 2], copies: 3, gap: [4, 9] },
  eagle: { url: '/models/eagle.glb', facing: Math.PI / 2, soars: true, wide: 1, px: 42, height: [220, 380], cross: [36, 46], band: [-0.4, 0.3], flap: [0.75, 0.75], copies: 1, gap: [8, 15] },
}

const random = (a, b) => a + Math.random() * (b - a)

export function createBirds(canvas, { sun }) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.setClearColor(0x000000, 0)
  // the canvas's size, kept by an observer (reading it every frame would force a layout)
  let box = [canvas.clientWidth, canvas.clientHeight]
  const watch = new ResizeObserver(([e]) => (box = [e.contentRect.width, e.contentRect.height]))
  watch.observe(canvas)

  const scene = new THREE.Scene()
  // the map's light: the sky's soft fill and the low golden sun
  const hemi = new THREE.HemisphereLight('#e6eef5', '#4a5e48', 1.1)
  hemi.position.set(0, 0, 1)
  const light = new THREE.DirectionalLight('#ffe2bc', 2.4)
  light.position.set(...sun)
  scene.add(hemi, light, light.target)

  const flyers = { flock: [], eagle: [] }
  const passes = []
  const next = { flock: Infinity, eagle: Infinity }
  let status = 'idle'
  let active = false
  let drawn = false
  let compiling = null
  let last = null
  const ray = new THREE.Vector3()

  // A model stood z-up (the map's frame) facing +x, one bird's wingspan to a unit (each pass then
  // scales it to metres), with its wingbeat clip playing. A bird that `soars` also gets the moment
  // of its wingbeat with the wings flattest, to hold while it glides.
  function prepare(gltf, { facing, wide, soars }) {
    const root = cloneSkinned(gltf.scene)
    root.rotation.x = Math.PI / 2
    const holder = new THREE.Group()
    holder.rotation.z = facing
    holder.add(root)
    const body = new THREE.Group()
    body.add(holder)
    const mixer = new THREE.AnimationMixer(root)
    const action = gltf.animations[0] ? mixer.clipAction(gltf.animations[0]) : null
    action?.play()
    // measured as it flies, since the clip moves (and for the eagle scales) the bones
    const measure = (t) => {
      mixer.setTime(t)
      body.updateMatrixWorld(true)
      return new THREE.Box3().setFromObject(holder, true).getSize(new THREE.Vector3())
    }
    let glide = null
    let size = measure(0)
    if (soars && action) {
      const { duration } = action.getClip()
      for (let t = 0; t < duration; t += duration / 12) {
        const s = measure(t)
        if (s.z / s.y < size.z / size.y || glide === null) [glide, size] = [t, s]
      }
    }
    mixer.setTime(0)
    holder.scale.setScalar(wide / Math.max(1e-6, size.y))
    root.traverse((o) => {
      if (!o.isMesh) return
      // skinned birds flap beyond their resting bounds
      o.frustumCulled = false
      o.castShadow = false
    })
    body.visible = false
    return { body, mixer, action, glide, mode: 'flap', until: 0, offset: new THREE.Vector3(), pace: 1, phase: 0 }
  }

  // A soaring bird beats its wings a few times, then holds them out and glides; it waits for the
  // wingbeat to come round to the glide pose so the change never jumps.
  function soar(f, time, flap) {
    if (f.glide === null || !f.action) return
    if (f.mode === 'flap' && time > f.until) f.mode = 'easing'
    if (f.mode === 'easing' && Math.abs(f.action.time - f.glide) < 0.07) {
      f.action.timeScale = 0
      f.mode = 'glide'
      f.until = time + random(1.8, 3.2)
    }
    if (f.mode === 'glide' && time > f.until) {
      f.action.timeScale = flap
      f.mode = 'flap'
      f.until = time + random(0.9, 1.6)
    }
  }

  async function load() {
    if (status !== 'idle') return
    status = 'loading'
    try {
      const loader = new GLTFLoader()
      const models = await Promise.all(['flock', 'eagle'].map((k) => loader.loadAsync(KINDS[k].url)))
      if (status === 'gone') return
      ;['flock', 'eagle'].forEach((kind, i) => {
        for (let c = 0; c < KINDS[kind].copies; c++) {
          const f = prepare(models[i], KINDS[kind])
          flyers[kind].push(f)
          scene.add(f.body)
        }
      })
      status = 'compiling'
    } catch (e) {
      console.warn('birds:', e)
      status = 'failed'
    }
  }

  /*
   * The map's camera with near and far planes of its own, for birds anywhere from close by to the
   * far side of the frame. The map's projection carries its metre scale k (its w is -k z), so only
   * the depth terms change.
   */
  const view = new THREE.PerspectiveCamera()
  view.matrixAutoUpdate = false
  view.matrixWorldAutoUpdate = false
  function follow(camera) {
    view.matrixWorld.copy(camera.matrixWorld)
    view.matrixWorldInverse.copy(camera.matrixWorldInverse)
    view.position.copy(camera.position)
    const m = view.projectionMatrix.copy(camera.projectionMatrix).elements
    const k = -m[11]
    const [near, far] = [1, 80000]
    m[10] = (-k * (far + near)) / (far - near)
    m[14] = (-2 * k * far * near) / (far - near)
    view.projectionMatrixInverse.copy(view.projectionMatrix).invert()
    return view
  }

  // Metres per pixel of the frame at `distance` metres from the camera (tan of half the field of
  // view is |w / y| of the projection).
  function perPixel(distance) {
    const m = view.projectionMatrix.elements
    return (2 * Math.abs(m[11] / m[5]) * distance) / Math.max(1, box[1])
  }

  // Where the ray through (x, y) of the frame (NDC) meets the level `height` metres up, if it does.
  function onLevel(camera, x, y, height) {
    ray.set(x, y, 0.5).unproject(camera).sub(camera.position).normalize()
    if (ray.z > -0.02) return null
    return camera.position.clone().addScaledVector(ray, (height - camera.position.z) / ray.z)
  }

  // Starts a pass across the frame from a random side, low over the ground, in the kind's band.
  function launch(kind, camera, time) {
    const spec = KINDS[kind]
    const birds = flyers[kind].filter((f) => !f.body.visible)
    if (birds.length < spec.copies) return false
    const side = Math.random() < 0.5 ? -1 : 1
    const height = random(...spec.height)
    const y0 = random(...spec.band)
    const y1 = Math.min(spec.band[1], Math.max(spec.band[0], y0 + random(-0.15, 0.15)))
    const from = onLevel(camera, -1.25 * side, y0, height)
    const to = onLevel(camera, 1.25 * side, y1, height)
    if (!from || !to) return false
    const dir = to.clone().sub(from).normalize()
    const length = from.distanceTo(to)
    // sized for its distance, to look the same from any view
    const span = spec.px * perPixel(camera.position.distanceTo(from.clone().lerp(to, 0.5)))
    const width = span * spec.wide
    let trail = 0
    birds.forEach((f, i) => {
      // the flock spreads out a little: each formation trails the one before and drifts off the line
      if (i) trail += random(0.8, 1.5) * width
      f.offset.set(-trail, i ? random(-0.8, 0.8) * width : 0, i ? random(-0.3, 0.3) * width : 0)
      f.body.scale.setScalar(span)
      f.pace = 1 + random(-0.03, 0.03)
      f.phase = random(0, 10)
      f.flap = random(...spec.flap)
      f.action?.setEffectiveTimeScale(f.flap)
      f.mode = 'flap'
      f.until = time + random(0.6, 1.4)
      f.mixer.setTime(f.phase)
      f.body.visible = true
    })
    const speed = length / random(...spec.cross)
    passes.push({ kind, birds, from, dir, length, span, speed, start: time, duration: (length + trail + width) / speed, bend: kind === 'eagle' ? random(-0.06, 0.06) * length : 0 })
    return true
  }

  const side = new THREE.Vector3()
  const along = new THREE.Vector3()

  // Moves every bird along its pass; a pass that has crossed the frame ends.
  function fly(time, dt) {
    for (let p = passes.length - 1; p >= 0; p--) {
      const pass = passes[p]
      const spec = KINDS[pass.kind]
      const age = time - pass.start
      side.set(-pass.dir.y, pass.dir.x, 0)
      for (const f of pass.birds) {
        // offsets are in the pass's own frame: along it, across it, up
        along.copy(pass.dir).multiplyScalar(f.offset.x).addScaledVector(side, f.offset.y)
        const s = age * pass.speed * f.pace
        const u = Math.min(1, Math.max(0, s / pass.length))
        // The eagle sweeps a shallow arc, turning with it and banking into it (most at the middle,
        // where it turns hardest, up to about 17 degrees); the small birds bound up and down.
        const arc = pass.bend * Math.sin(Math.PI * u)
        const slope = (pass.bend * Math.PI * Math.cos(Math.PI * u)) / pass.length
        const bank = (0.3 * pass.bend * Math.sin(Math.PI * u)) / (0.06 * pass.length)
        const bob = (pass.kind === 'flock' ? Math.sin(time * 2.2 + f.phase) * 0.12 : Math.sin(time * 0.6 + f.phase) * 0.2) * pass.span
        f.body.position.copy(pass.from).addScaledVector(pass.dir, s).addScaledVector(side, arc).add(along)
        f.body.position.z += f.offset.z + bob
        f.body.rotation.set(0, 0, Math.atan2(pass.dir.y, pass.dir.x) + Math.atan(slope))
        f.body.rotateX(bank)
        soar(f, time, f.flap)
        f.mixer.update(dt)
      }
      if (age > pass.duration) {
        pass.birds.forEach((f) => (f.body.visible = false))
        passes.splice(p, 1)
        next[pass.kind] = active ? time + random(...spec.gap) : Infinity
      }
    }
  }

  return {
    load,
    // Birds set off while `on` (the neighbourhood, its camera at rest); passes under way finish.
    setActive(on) {
      if (on === active) return
      active = on
      const now = performance.now() / 1000
      next.flock = on ? Math.min(next.flock, now + 1.2) : Infinity
      next.eagle = on ? Math.min(next.eagle, now + 4.5) : Infinity
    },
    // Each frame, with the map's camera.
    draw(pose) {
      const camera = follow(pose.camera)
      const now = performance.now() / 1000
      const dt = last === null ? 0 : Math.min(0.05, now - last)
      last = now
      if (status === 'compiling' && !compiling) {
        // every program at once, in the background where the browser can, and the textures up
        compiling = renderer.compileAsync(scene, camera).then(() => {
          scene.traverse((o) => [o.material].flat().forEach((m) => m && Object.values(m).forEach((v) => v?.isTexture && renderer.initTexture(v))))
          if (status === 'compiling') status = 'ready'
        })
      }
      if (status !== 'ready') return
      if (active) for (const kind of ['flock', 'eagle']) if (now >= next[kind] && launch(kind, camera, now)) next[kind] = Infinity
      fly(now, dt)
      if (!passes.length) {
        if (drawn) renderer.clear()
        drawn = false
        return
      }
      const [w, h] = box.map((v) => Math.max(1, Math.round(v)))
      const size = renderer.getSize(new THREE.Vector2())
      if (size.x !== w || size.y !== h) renderer.setSize(w, h, false)
      renderer.render(scene, camera)
      drawn = true
    },
    dispose() {
      status = 'gone'
      watch.disconnect()
      scene.traverse((o) => {
        o.geometry?.dispose()
        ;[o.material].flat().forEach((m) => {
          if (!m) return
          Object.values(m).forEach((v) => v?.isTexture && v.dispose())
          m.dispose()
        })
      })
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
