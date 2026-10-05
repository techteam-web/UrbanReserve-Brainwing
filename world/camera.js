import { gsap, reduced } from '../gsap/gsapConfig'
import { MercatorCoordinate } from './maplibre'
import { distance, lerp, turn } from './geo'

const inOut = gsap.parseEase('power2.inOut')
const travelEase = gsap.parseEase('power3.inOut')

// How far the cursor leans the camera, in degrees: bearing for left/right, a touch of pitch.
const LOOK = { bearing: 6, pitch: 1.5 }

/*
 * The only camera on the Residences map: visitors don't steer it. Stops fly it (climbing out
 * over long hops, banking through the turn), a slow orbit keeps it alive at rest, and the cursor
 * leans it gently left and right. All of it is composed into one jumpTo per frame.
 */
export function createDirector(map) {
  const cam = {
    center: map.getCenter().toArray(),
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
    roll: map.getRoll(),
    elevation: map.getCenterElevation(),
  }
  const look = { x: 0, y: 0, tx: 0, ty: 0 }
  let flight = null
  let orbit = 0
  let orbitAge = 0
  let last = ''

  const leans = !reduced() && window.matchMedia('(pointer: fine)').matches
  // off until the scene is on show, so the cursor can't hold the map busy while it loads
  let leaning = false
  const onMove = (e) => {
    if (!leaning) return
    look.tx = (e.clientX / window.innerWidth) * 2 - 1
    look.ty = (e.clientY / window.innerHeight) * 2 - 1
  }
  const onLeave = () => {
    look.tx = 0
    look.ty = 0
  }
  if (leans) {
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
  }

  const tick = (time, deltaMs) => {
    const dt = Math.min(0.05, deltaMs / 1000)
    const ease = Math.min(1, dt * 2)
    look.x += (look.tx - look.x) * ease
    look.y += (look.ty - look.y) * ease
    if (orbit && !flight) {
      orbitAge += dt
      const k = Math.min(1, orbitAge / 3) // ease into the orbit
      cam.bearing += orbit * dt * k * k
    }
    apply()
  }

  function apply() {
    const view = {
      center: cam.center,
      zoom: cam.zoom,
      pitch: Math.max(0, Math.min(82, cam.pitch - look.y * LOOK.pitch)),
      bearing: cam.bearing + look.x * LOOK.bearing,
      roll: cam.roll,
      elevation: cam.elevation,
    }
    const key = `${view.center}|${view.zoom.toFixed(5)}|${view.pitch.toFixed(4)}|${view.bearing.toFixed(4)}|${view.roll.toFixed(4)}|${view.elevation.toFixed(2)}`
    if (key === last) return
    last = key
    map.jumpTo(view)
  }
  gsap.ticker.add(tick)

  function fly(to, { duration, hop, spin = 0, onDone } = {}) {
    flight?.kill()
    orbit = 0
    const from = { ...cam }
    const m0 = MercatorCoordinate.fromLngLat(from.center)
    const m1 = MercatorCoordinate.fromLngLat(to.center)
    const dist = distance(from.center, to.center)
    // climb high enough to see both ends of a long hop: above the clouds for cross-town moves
    const apex = Math.min(from.zoom, to.zoom, 15.6 - Math.log2(Math.max(dist, 250) / 500))
    const lift = hop ?? Math.max(dist < 400 ? 0.45 : 0, Math.min(from.zoom, to.zoom) - apex)
    const db = turn(from.bearing, to.bearing) + spin
    const time = duration ?? Math.min(7, Math.max(2.4, 2 + lift * 0.62 + Math.abs(db) / 150))
    const settle = () => {
      flight = null
      orbit = to.orbit ?? 0
      orbitAge = 0
      onDone?.()
    }

    if (reduced()) {
      Object.assign(cam, { center: to.center, zoom: to.zoom, pitch: to.pitch, bearing: to.bearing, roll: 0, elevation: to.elevation ?? 0 })
      settle()
      return
    }

    const s = { t: 0 }
    flight = gsap.to(s, {
      t: 1,
      duration: time,
      ease: 'none',
      onUpdate() {
        const e = inOut(s.t)
        const c = lift > 1 ? travelEase(s.t) : e
        const bump = Math.sin(Math.PI * e)
        cam.center = new MercatorCoordinate(lerp(m0.x, m1.x, c), lerp(m0.y, m1.y, c), 0).toLngLat().toArray()
        cam.zoom = lerp(from.zoom, to.zoom, e) - lift * bump
        cam.pitch = Math.max(0, lerp(from.pitch, to.pitch, e) - Math.min(32, lift * 8) * bump)
        cam.bearing = from.bearing + db * e
        // bank into the turn like a drone would
        cam.roll = lerp(from.roll, 0, e) + Math.sign(db) * Math.min(7, Math.abs(db) / 14) * bump
        cam.elevation = lerp(from.elevation, to.elevation ?? 0, e)
      },
      onComplete: settle,
    })
  }

  // Cuts straight to a view (used to set up the intro before anything is visible).
  function jump(to) {
    flight?.kill()
    flight = null
    orbit = 0
    Object.assign(cam, { center: to.center, zoom: to.zoom, pitch: to.pitch, bearing: to.bearing, roll: 0, elevation: to.elevation ?? 0 })
    apply()
  }

  return {
    fly,
    jump,
    lean(on) {
      leaning = on
      if (!on) onLeave()
    },
    dispose() {
      flight?.kill()
      gsap.ticker.remove(tick)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    },
  }
}
