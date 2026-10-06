import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Map as MapLibre } from './maplibre'
import { gsap, reduced, lite } from '../gsap/gsapConfig'
import { holdIntro } from '../app/gate'
import { RESIDENCES, SITE } from '../data/content'
import { mapStyle, ROUTE_LAYERS, routeReveal } from './style'
import { createReserve } from './scene'
import { createClouds } from './clouds'
import { createDirector } from './camera'
import { SUN } from './light'
import { toLocal } from './geo'
import { HOTSPOTS, PLACES, VIEWS, isHood, neighbourhoodBounds, placeIndex, placeLocal, placeView } from './stops'
import { TOWER_H } from './site'
import { Anchor, Badge, Hotspot, Pin, RouteLabel, Traveller } from './Markers'

const LABELS = Object.fromEntries([...RESIDENCES.map((r, i) => [r.id, [i + 2, r.label]]), ['interiors', [5, 'Interiors']]])

/**
 * The Residences world: a MapLibre map with the reserve rendered in three.js, clouds over it and
 * labels floating in the scene. The camera is never handed to the visitor: `stop` picks the view
 * and clicks on the scene call `onStop`. Places show their road route from the reserve.
 * `inset` ({ top, bottom } as fractions of the height) keeps the subject clear of UI covering the
 * map. Nothing is shown until the whole scene is in: `onProgress(fraction, next)` reports loading
 * (`next` names what is still coming), and `onState` reports 'ready' when everything has loaded
 * and the intro starts, or 'failed' if WebGL is unavailable.
 */
export default function World({ stop, inset, onStop, onState, onProgress }) {
  const host = useRef(null)
  const overlay = useRef(null)
  const veil = useRef(null)
  const els = useRef(new Map())
  const anchors = useRef(new Map())
  const live = useRef(null)
  const stopRef = useRef(stop)
  // labels stay out of sight until the scene is on show
  const [shown, setShown] = useState(false)
  const report = useRef(onState)
  const reportProgress = useRef(onProgress)
  const insetRef = useRef(inset)
  useLayoutEffect(() => {
    report.current = onState
    reportProgress.current = onProgress
    insetRef.current = inset
  })

  const register = useCallback((id, el) => {
    if (el) els.current.set(id, el)
    else els.current.delete(id)
  }, [])

  useEffect(() => {
    let map
    try {
      map = new MapLibre({
        container: host.current,
        style: mapStyle(),
        center: VIEWS.reserve.center,
        zoom: VIEWS.reserve.zoom,
        pitch: VIEWS.reserve.pitch,
        bearing: VIEWS.reserve.bearing,
        interactive: false,
        maxPitch: 82,
        centerClampedToGround: false,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        attributionControl: { compact: true },
        canvasContextAttributes: { antialias: true, powerPreference: 'high-performance' },
      })
    } catch {
      report.current?.('failed')
      return
    }
    let gone = false
    let intro = null

    const cloudCanvas = document.createElement('canvas')
    cloudCanvas.className = 'pointer-events-none absolute inset-0 h-full w-full'
    map.getCanvas().after(cloudCanvas)
    const clouds = createClouds(cloudCanvas, { scale: lite() ? 0.4 : 0.5 })

    let size = [0, 0]
    const measure = () => {
      size = [overlay.current.clientWidth, overlay.current.clientHeight]
      const { top = 0, bottom = 0 } = insetRef.current ?? {}
      map.setPadding({ top: size[1] * top, bottom: size[1] * bottom, left: 0, right: 0 })
    }
    measure()
    map.on('resize', measure)

    // the drive on show: the route in scene metres, with running lengths for the traveller
    const route = { track: null, reveal: { p: 0 }, tween: null }

    // project the floating labels with the exact camera the scene was drawn with
    let drawn = false
    const onFrame = (pose) => {
      clouds?.draw(pose, SUN)
      if (!drawn) {
        drawn = true
        veil.current?.classList.add('opacity-0')
      }
      if (route.track && route.reveal.p >= 1) anchors.current.set('traveller', along(route.track, ((pose.time % 6) / 5) * route.track.len))
      const e = pose.clip.elements
      const [W, H] = size
      for (const [id, el] of els.current) {
        const p = anchors.current.get(id)
        if (!p) continue
        const [x, y, z] = p
        const cw = e[3] * x + e[7] * y + e[11] * z + e[15]
        if (cw <= 0.01) {
          el.style.visibility = 'hidden'
          continue
        }
        const sx = ((e[0] * x + e[4] * y + e[8] * z + e[12]) / cw) * 0.5 + 0.5
        const sy = 0.5 - ((e[1] * x + e[5] * y + e[9] * z + e[13]) / cw) * 0.5
        el.style.visibility = sx < -0.2 || sx > 1.2 || sy < -0.2 || sy > 1.2 ? 'hidden' : 'visible'
        el.style.transform = `translate3d(${(sx * W).toFixed(1)}px, ${(sy * H).toFixed(1)}px, 0)`
      }
      overlay.current?.style.setProperty('--fog', clouds ? clouds.fog(pose.eye).toFixed(3) : 0)
    }

    // Loading, in weighted parts. The intro starts only once every part is in.
    const PARTS = { style: 5, tiles: 25, models: 35, light: 15, sky: 15, warm: 5 }
    const got = {}
    // the last moment anything arrived: a model, the HDRI, a map tile
    let active = performance.now()
    const progress = (part, f = 1) => {
      active = performance.now()
      got[part] = Math.max(got[part] ?? 0, f)
      const sum = Object.entries(PARTS).reduce((s, [k, w]) => s + w * (got[k] ?? 0), 0)
      const next = Object.keys(PARTS).find((k) => (got[k] ?? 0) < 1) ?? 'ready'
      reportProgress.current?.(Math.min(1, sum / 100), next)
    }

    const reserve = createReserve({ places: PLACES, shadows: !lite(), onFrame, onProgress: progress })
    const ground = (at = SITE.at) => map.queryTerrainElevation(at) ?? 0

    const placeAnchors = () => {
      HOTSPOTS.forEach((h) => anchors.current.set(`hot-${h.id}`, [h.at[0], h.at[1], h.z]))
      anchors.current.set('badge', [0, 0, TOWER_H + 14])
      PLACES.forEach((p, i) => anchors.current.set(`place-${i}`, [...placeLocal(p), reserve.groundAt(p.at)]))
    }
    placeAnchors()

    function fit(bounds, bearing, pitch) {
      const { width, height } = map.getContainer().getBoundingClientRect()
      // leave room for the rail and the card either side (stacked layouts are padded already)
      const side = width * (insetRef.current ? 0.06 : 0.3)
      const cam = map.cameraForBounds(bounds, { bearing, padding: { top: height * 0.18, bottom: height * 0.14, left: side, right: side } })
      const c = cam?.center
      // a tilted camera sees more ground than the flat fit assumes; ease back a little
      return { center: c ? [c.lng ?? c[0], c.lat ?? c[1]] : SITE.at, zoom: (cam?.zoom ?? 14) - pitch / 140, pitch, bearing, fitted: true }
    }

    function viewFor(id) {
      if (id === 'neighbourhood') return { ...fit(neighbourhoodBounds(), SITE.heading - 14, 46), lift: 0, orbit: 0 }
      const i = placeIndex(id)
      if (i >= 0) {
        const v = placeView(PLACES[i])
        return { ...v, ...fit(v.bounds, v.bearing, v.pitch) }
      }
      return VIEWS[id] ?? VIEWS.reserve
    }

    /*
     * MapLibre's camera distance grows with the viewport's height, so stops are tuned at 1080px
     * and rescaled to keep the same framing (narrow portrait screens back off a little more).
     * A resting camera is then nudged out of the cloud decks so the view never parks in haze.
     */
    function framed(v) {
      const { clientWidth: W, clientHeight: H } = map.getContainer()
      const { top = 0, bottom = 0 } = insetRef.current ?? {}
      let zoom = v.fitted ? v.zoom : v.zoom + Math.log2(Math.min((H * (1 - top - bottom)) / 1080, W / 900))
      const k = (1.5 * H * 40075016.686 * Math.cos((v.center[1] * Math.PI) / 180) * Math.cos((v.pitch * Math.PI) / 180)) / 512
      const altAt = (z) => k / 2 ** z + v.lift // above the ground at the stop
      const zoomAt = (alt) => Math.log2(k / Math.max(1, alt - v.lift))
      for (const [lo, hi] of clouds?.bands() ?? []) {
        const alt = altAt(zoom)
        if (alt > lo && alt < hi) zoom = alt - lo < hi - alt ? zoomAt(lo - 1) : zoomAt(hi + 1)
      }
      return { ...v, zoom }
    }

    // Shows every road in the neighbourhood overview, or draws the chosen one out from the reserve.
    function showRoutes(hood, i) {
      const all = hood ? (i >= 0 ? 0.25 : 0.85) : 0
      map.setPaintProperty('routes', 'line-opacity', all)
      map.setPaintProperty('routes-casing', 'line-opacity', all * 0.9)
      for (const id of ROUTE_LAYERS.active) map.setFilter(id, ['==', ['get', 'i'], i])
      route.tween?.kill()
      route.reveal.p = 0
      map.setPaintProperty('route-active', 'line-gradient', routeReveal(0))
      const path = PLACES[i]?.route?.path
      route.track = path ? trackOf(path) : null
      anchors.current.delete('traveller')
      if (!route.track) return
      anchors.current.set('route-label', along(route.track, route.track.len * 0.5, 0))
      route.tween = gsap.to(route.reveal, {
        p: 1,
        duration: reduced() ? 0.01 : 2.4,
        delay: reduced() ? 0 : 1.2,
        ease: 'power2.inOut',
        onUpdate: () => map.setPaintProperty('route-active', 'line-gradient', routeReveal(route.reveal.p)),
      })
    }

    // A route in scene metres, sat on the terrain, with running lengths along it.
    function trackOf(path) {
      const pts = path.map((at) => [...toLocal(SITE.at, at), reserve.groundAt(at)])
      const cum = [0]
      for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]))
      return { pts, cum, len: cum.at(-1) }
    }

    function goTo(id, opts = {}) {
      const hood = isHood(id)
      const i = placeIndex(id)
      reserve.setHighlight(id in VIEWS && id !== 'reserve')
      reserve.setBeacon(hood)
      reserve.setLandmark(i)
      showRoutes(hood, i)
      if (clouds) {
        gsap.to(clouds.params.a, { cover: hood ? 0.42 : 0.5, duration: 3, overwrite: true })
        gsap.to(clouds.params.b, { cover: hood ? 0.5 : 0.56, duration: 3, overwrite: true })
      }
      const base = ground(i >= 0 ? PLACES[i].at : SITE.at)
      const v = framed(viewFor(id))
      live.current.director.fly({ ...v, elevation: base + v.lift }, { spin: v.spin ?? 0, ...opts })
    }

    let demDirty = true
    map.on('sourcedata', (e) => e.sourceId === 'dem' && e.isSourceLoaded && (demDirty = true))
    map.on('idle', () => {
      if (!demDirty) return
      demDirty = false
      reserve.settle()
      placeAnchors()
    })

    map.on('load', async () => {
      map.addLayer(reserve.layer, 'road-label')
      // small screens start with the credits folded into their (i) button
      if (insetRef.current) map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
      const director = createDirector(map)
      live.current = { map, director, goTo, measure, introduced: false }
      const wait = (ms) => new Promise((r) => setTimeout(r, ms))
      // Waits are capped by a stall, not a clock: a slow connection keeps loading as long as data
      // is still arriving, and only a dead one (nothing for STALL ms) lets the page start without it.
      const STALL = 20000
      map.on('data', () => (active = performance.now()))
      const until = async (work, cap) => {
        let id
        const stall = new Promise((r) => (id = setInterval(() => (gone || performance.now() - active > STALL) && r(), 500)))
        try {
          await Promise.race([Promise.resolve(work).catch(() => {}), stall, wait(cap)])
        } finally {
          clearInterval(id)
        }
      }
      const frames = (n) => new Promise((r) => (function f(k) { requestAnimationFrame(() => (k ? f(k - 1) : r())) })(n))
      // The map and its terrain have every tile the current view needs (the hillshade may still be
      // filling in). Polled rather than waiting for 'idle', which the 3D layer's continuous repaints
      // can hold off; two frames first so a new view has asked for its tiles.
      const settledView = async () => {
        await frames(2)
        for (let calm = 0; calm < 2 && !gone; ) {
          await wait(200)
          calm = !gone && ['vector', 'dem'].every((id) => map.isSourceLoaded(id)) ? calm + 1 : 0
        }
      }
      progress('style')

      // Everything under the clouds first: the arrival view's map and terrain, every model, and
      // the HDRI lighting. A part that fails (a model that won't download, say) is skipped rather
      // than holding the page.
      const soft = (p) => Promise.resolve(p).catch(() => {})
      const tiles = settledView().then(() => progress('tiles'))
      await until(Promise.all([soft(reserve.layer.ready), soft(reserve.lit), tiles]), 120000)
      if (gone) return
      for (const part of ['tiles', 'models', 'light']) progress(part)
      reserve.settle()
      placeAnchors()
      // then rise above the clouds and load the start of the descent
      const first = viewFor(stopRef.current)
      if (!reduced()) {
        director.jump({ center: SITE.at, zoom: 13.2, pitch: 14, bearing: first.bearing - 100, elevation: ground() })
        await until(settledView(), 60000)
        if (gone) return
      }
      progress('sky')
      // compile every shader and draw a few frames before anything is seen
      await Promise.race([soft(reserve.warm()), wait(4000)])
      if (gone) return
      progress('warm')

      report.current?.('ready')
      intro = gsap.timeline()
      intro.to(clouds?.params ?? {}, { mist: 0, duration: reduced() ? 0.01 : 2.8, ease: 'power2.out' }, 0)
      intro.add(
        () => {
          live.current.introduced = true
          director.lean(true)
          setShown(true)
          goTo(stopRef.current, reduced() ? {} : { duration: 7.2, hop: 0 })
        },
        reduced() ? 0 : 0.3,
      )
      holdIntro(intro)
    })

    map.on('error', (e) => {
      if (String(e.error?.message ?? '').toLowerCase().includes('webgl')) report.current?.('failed')
    })

    return () => {
      gone = true
      intro?.kill()
      route.tween?.kill()
      if (clouds) gsap.killTweensOf([clouds.params, clouds.params.a, clouds.params.b])
      live.current?.director.dispose()
      live.current = null
      map.remove()
      clouds?.dispose()
      cloudCanvas.remove()
    }
  }, [])

  useEffect(() => {
    stopRef.current = stop
    if (live.current?.introduced) live.current.goTo(stop)
  }, [stop])

  useEffect(() => {
    live.current?.measure()
  }, [inset])

  const hood = isHood(stop)
  const active = placeIndex(stop)
  const drive = PLACES[active]

  return (
    <div className="absolute inset-0">
      {/* MapLibre's own (unlayered) CSS makes its container `position: relative`, so it sits in a sized wrapper */}
      <div ref={host} className="h-full w-full" />
      {/* cloud-coloured until the first frame of real clouds is drawn */}
      <div ref={veil} className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,#f1e9de,#d8d3c9_55%,#aeb3ab)] transition-opacity duration-1000" />
      <div ref={overlay} inert={!shown} className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-1000 ${shown ? 'opacity-100' : 'opacity-0'}`}>
        <Anchor id="route-label" register={register} show={Boolean(drive?.route)}>
          {drive?.route && <RouteLabel mins={drive.mins} km={drive.route.km} />}
        </Anchor>
        <Anchor id="traveller" register={register} show={Boolean(drive?.route)}>
          <Traveller />
        </Anchor>
        <Anchor id="badge" register={register} show={hood}>
          <Badge />
        </Anchor>
        {HOTSPOTS.map((h) => (
          <Anchor key={h.id} id={`hot-${h.id}`} register={register} show={!hood && stop !== h.id}>
            <Hotspot index={String(LABELS[h.id][0]).padStart(2, '0')} label={LABELS[h.id][1]} left={h.tower === 0} onClick={() => onStop(h.id)} />
          </Anchor>
        ))}
        {PLACES.map((p, i) => (
          <Anchor key={p.name} id={`place-${i}`} register={register} show={hood}>
            <Pin place={p} active={active === i} dim={active >= 0 && active !== i} onClick={() => onStop(`place-${i}`)} />
          </Anchor>
        ))}
      </div>
    </div>
  )
}

// The point `s` metres along a track, lifted `up` metres off the road.
function along({ pts, cum }, s, up = 2) {
  let k = 1
  while (k < pts.length - 1 && cum[k] < s) k++
  const span = cum[k] - cum[k - 1] || 1
  const t = Math.min(1, Math.max(0, (s - cum[k - 1]) / span))
  const [a, b] = [pts[k - 1], pts[k]]
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t + up]
}
