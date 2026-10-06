import { gsap, reduced } from '../gsap/gsapConfig'
import { MercatorCoordinate } from './maplibre'
import { distance, lerp, turn } from './geo'

const inOut = gsap.parseEase('power2.inOut')
const travelEase = gsap.parseEase('power3.inOut')
const sineInOut = gsap.parseEase('sine.inOut')
const RAD = Math.PI / 180

// How far the cursor leans the camera, in degrees: bearing for left/right, a touch of pitch.
const LOOK = { bearing: 6, pitch: 1.5 }

/*
 * The camera's height above the middle of the view at zoom 0, in metres: at any zoom it is
 * `heightScale(...) / 2 ** zoom`. MapLibre's field of view is fixed (36.87°), so the camera sits
 * 1.5 viewport heights from the centre and its distance grows with the viewport.
 */
export function heightScale(map, lat, pitch) {
  return (1.5 * map.getContainer().clientHeight * 40075016.686 * Math.cos(lat * RAD) * Math.cos(pitch * RAD)) / 512
}

// Cubic Hermite from y0 to y1 over s in 0..1, leaving with slope m0 and arriving with m1.
function hermite(s, y0, y1, m0, m1) {
  const s2 = s * s
  const s3 = s2 * s
  return (2 * s3 - 3 * s2 + 1) * y0 + (s3 - 2 * s2 + s) * m0 + (3 * s2 - 2 * s3) * y1 + (s3 - s2) * m1
}

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
    const ease = Math.min(1, dt * 3)
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
    // longer for a higher climb, a wider turn and a bigger change of zoom
    const time = duration ?? Math.min(4.5, Math.max(1.6, 1.1 + lift * 0.45 + Math.abs(db) / 200 + Math.abs(to.zoom - from.zoom) * 0.15))
    const settle = settled(to, onDone)

    if (reduced()) {
      place(to)
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

  /*
   * The way in from high over the clouds: already falling as the view comes out of the white (so
   * its start is never seen to ease off a standstill), a dive nose down to `dive.pitch` through
   * the deck at `dive.height` metres, then a settle on `to`. The camera reaches the deck `dive.at`
   * of the way in and takes about `dive.linger` seconds to fall `dive.depth` metres either side of
   * it. Height is eased in log space, apart from the pitch, so the nose can drop without the
   * camera climbing.
   */
  function descend(to, { duration, dive, onDone }) {
    flight?.kill()
    orbit = 0
    const settle = settled(to, onDone)
    if (reduced()) {
      place(to)
      settle()
      return
    }

    const from = { ...cam }
    const m0 = MercatorCoordinate.fromLngLat(from.center)
    const m1 = MercatorCoordinate.fromLngLat(to.center)
    const h0 = heightScale(map, from.center[1], from.pitch) / 2 ** from.zoom
    const h1 = heightScale(map, to.center[1], to.pitch) / 2 ** to.zoom
    const fall = Math.log2(h0 / h1)
    // The share of the fall (in log height) above the deck, and how steeply it falls through it.
    // It sets off at its average pace down to the deck; the limits keep the fall monotonic.
    const { at } = dive
    const e = Math.min(0.9, Math.max(0.05, Math.log2(h0 / dive.height) / fall))
    const band = Math.log2((dive.height + dive.depth) / Math.max(1, dive.height - dive.depth)) / fall
    const slope = Math.min(2.8 * (e / at), 3 * ((1 - e) / (1 - at)), Math.max(e / at, (band * duration) / dive.linger))
    const fallen = (t) => (t < at ? hermite(t / at, 0, e, e, slope * at) : hermite((t - at) / (1 - at), e, 1, slope * (1 - at), 0))
    const pitchAt = (t) => (t < at ? lerp(from.pitch, dive.pitch, sineInOut(t / at)) : lerp(dive.pitch, to.pitch, inOut((t - at) / (1 - at))))
    const tilt = (p) => Math.log2(Math.cos(p * RAD))
    const db = turn(from.bearing, to.bearing)

    const s = { t: 0 }
    flight = gsap.to(s, {
      t: 1,
      duration,
      ease: 'none',
      onUpdate() {
        const f = fallen(s.t)
        const b = inOut(s.t)
        cam.pitch = pitchAt(s.t)
        // the zoom that keeps the camera at this height whatever the pitch
        cam.zoom = from.zoom + tilt(cam.pitch) - tilt(from.pitch) + f * (to.zoom - from.zoom + tilt(from.pitch) - tilt(to.pitch))
        cam.center = new MercatorCoordinate(lerp(m0.x, m1.x, b), lerp(m0.y, m1.y, b), 0).toLngLat().toArray()
        cam.bearing = from.bearing + db * b
        cam.roll = lerp(from.roll, 0, b) + Math.sign(db) * Math.min(7, Math.abs(db) / 14) * Math.sin(Math.PI * b)
        cam.elevation = lerp(from.elevation, to.elevation ?? 0, f)
      },
      onComplete: settle,
    })
  }

  // Cuts straight to a view (used to set up the intro before anything is visible).
  function jump(to) {
    flight?.kill()
    flight = null
    orbit = 0
    place(to)
    apply()
  }

  function place(to) {
    Object.assign(cam, { center: to.center, zoom: to.zoom, pitch: to.pitch, bearing: to.bearing, roll: 0, elevation: to.elevation ?? 0 })
  }

  // Once at `to`: the flight is over and the stop's slow orbit takes over.
  function settled(to, onDone) {
    return () => {
      flight = null
      orbit = to.orbit ?? 0
      orbitAge = 0
      onDone?.()
    }
  }

  return {
    fly,
    descend,
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
