import { gsap, reduced } from '../gsap/gsapConfig'
import { MercatorCoordinate } from './maplibre'
import { distance, lerp, turn } from './geo'

const inOut = gsap.parseEase('power2.inOut')
const travelEase = gsap.parseEase('power3.inOut')

/*
 * Cinematic camera moves for the map. Long hops climb out (through the cloud decks), bank and
 * swing round on the way, then settle into a slow orbit. Any touch, drag or wheel hands the
 * camera straight back to the visitor; the orbit resumes after a quiet spell.
 */
export function createDirector(map) {
  let flight = null
  let orbit = null
  let resume = null
  let view = null

  const stopOrbit = () => {
    if (orbit) gsap.ticker.remove(orbit)
    orbit = null
  }

  function startOrbit(speed) {
    stopOrbit()
    if (!speed || reduced()) return
    let t = 0
    orbit = (time, deltaMs) => {
      const dt = Math.min(0.05, deltaMs / 1000)
      t += dt
      // ease in so the orbit never jerks into motion
      const k = Math.min(1, t / 3)
      map.jumpTo({ bearing: map.getBearing() + speed * dt * k * k })
    }
    gsap.ticker.add(orbit)
  }

  function cancel() {
    flight?.kill()
    flight = null
    stopOrbit()
  }

  function onUser(e) {
    if (!e.originalEvent && e.type !== 'wheel') return
    cancel()
    clearTimeout(resume)
    resume = setTimeout(() => view && startOrbit(view.orbit), 9000)
  }
  const events = ['mousedown', 'touchstart', 'wheel', 'dragstart', 'rotatestart', 'pitchstart']
  events.forEach((ev) => map.on(ev, onUser))

  function fly(to, { duration, hop, spin = 0, onDone } = {}) {
    cancel()
    clearTimeout(resume)
    view = to
    const from = {
      center: map.getCenter().toArray(),
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      roll: map.getRoll?.() ?? 0,
      elevation: map.getCenterElevation(),
    }
    const m0 = MercatorCoordinate.fromLngLat(from.center)
    const m1 = MercatorCoordinate.fromLngLat(to.center)
    const dist = distance(from.center, to.center)
    // climb high enough to see both ends of a long hop: above the clouds for cross-town moves
    const apex = Math.min(from.zoom, to.zoom, 15.6 - Math.log2(Math.max(dist, 250) / 500))
    const lift = hop ?? Math.max(dist < 400 ? 0.45 : 0, Math.min(from.zoom, to.zoom) - apex)
    const db = turn(from.bearing, to.bearing) + spin
    const time = duration ?? Math.min(7, Math.max(2.4, 2 + lift * 0.62 + Math.abs(db) / 150))

    if (reduced()) {
      map.jumpTo({ center: to.center, zoom: to.zoom, pitch: to.pitch, bearing: to.bearing, roll: 0, elevation: to.elevation })
      onDone?.()
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
        map.jumpTo({
          center: new MercatorCoordinate(lerp(m0.x, m1.x, c), lerp(m0.y, m1.y, c), 0).toLngLat(),
          zoom: lerp(from.zoom, to.zoom, e) - lift * bump,
          pitch: Math.max(0, lerp(from.pitch, to.pitch, e) - Math.min(32, lift * 8) * bump),
          bearing: from.bearing + db * e,
          // bank into the turn like a drone would
          roll: lerp(from.roll, 0, e) + Math.sign(db) * Math.min(7, Math.abs(db) / 14) * bump,
          elevation: lerp(from.elevation, to.elevation ?? 0, e),
        })
      },
      onComplete() {
        flight = null
        startOrbit(to.orbit)
        onDone?.()
      },
    })
    return flight
  }

  return {
    fly,
    cancel,
    dispose() {
      cancel()
      clearTimeout(resume)
      events.forEach((ev) => map.off(ev, onUser))
    },
  }
}
