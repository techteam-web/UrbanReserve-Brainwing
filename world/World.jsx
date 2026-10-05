import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { Map as MapLibre } from './maplibre'
import { gsap, reduced, lite } from '../gsap/gsapConfig'
import { holdIntro } from '../app/gate'
import { RESIDENCES, SITE } from '../data/content'
import { mapStyle } from './style'
import { createReserve, SUN } from './scene'
import { createClouds } from './clouds'
import { createDirector } from './camera'
import { HOTSPOTS, PLACES, VIEWS, isHood, neighbourhoodBounds, placeIndex, placeLocal, placeView } from './stops'
import { TOWER_H } from './site'
import { Anchor, Badge, Hotspot, Pin } from './Markers'

const LABELS = Object.fromEntries([...RESIDENCES.map((r, i) => [r.id, [i + 2, r.label]]), ['interiors', [5, 'Interiors']]])


/**
 * The Residences world: a MapLibre map with the reserve rendered in three.js, clouds over it and
 * labels floating in the scene. `stop` picks the camera view; clicks on the scene call `onStop`.
 * Changing `replay` flies back to the current stop. `inset` ({ top, bottom } as fractions of the
 * height) keeps the subject clear of UI covering the map. `onState` reports 'ready' when the
 * intro starts or 'failed' if WebGL is unavailable.
 */
export default function World({ stop, replay, inset, onStop, onState }) {
  const host = useRef(null)
  const overlay = useRef(null)
  const veil = useRef(null)
  const els = useRef(new Map())
  const anchors = useRef(new Map())
  const live = useRef(null)
  const stopRef = useRef(stop)
  const report = useRef(onState)
  const insetRef = useRef(inset)
  useLayoutEffect(() => {
    report.current = onState
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
        minZoom: 11.5,
        maxZoom: 19.4,
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

    // project the floating labels with the exact camera the scene was drawn with
    let drawn = false
    const onFrame = (pose) => {
      clouds?.draw(pose, SUN)
      if (!drawn) {
        drawn = true
        veil.current?.classList.add('opacity-0')
      }
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

    const reserve = createReserve({ places: PLACES, shadows: !lite(), onFrame })
    const ground = (at = SITE.at) => map.queryTerrainElevation(at) ?? 0

    const placeAnchors = () => {
      HOTSPOTS.forEach((h) => anchors.current.set(`hot-${h.id}`, [h.at[0], h.at[1], h.z]))
      anchors.current.set('badge', [0, 0, TOWER_H + 14])
      PLACES.forEach((p, i) => anchors.current.set(`place-${i}`, [...placeLocal(p), reserve.groundAt(p.at)]))
    }
    placeAnchors()

    function viewFor(id) {
      if (id === 'neighbourhood') {
        const bearing = SITE.heading - 14
        const { width, height } = map.getContainer().getBoundingClientRect()
        // leave room for the rail and the card either side (stacked layouts are padded already)
        const side = width * (insetRef.current ? 0.06 : 0.3)
        const cam = map.cameraForBounds(neighbourhoodBounds(), {
          bearing,
          padding: { top: height * 0.16, bottom: height * 0.12, left: side, right: side },
        })
        const c = cam?.center
        return { center: c ? [c.lng ?? c[0], c.lat ?? c[1]] : SITE.at, zoom: (cam?.zoom ?? 14) - 0.15, pitch: 46, bearing, lift: 0, orbit: 0.7, fitted: true }
      }
      const i = placeIndex(id)
      if (i >= 0) return placeView(PLACES[i])
      return VIEWS[id] ?? VIEWS.reserve
    }

    /*
     * MapLibre's camera distance grows with the viewport's height, so stops are tuned at 1080px
     * and rescaled to keep the same framing (narrow portrait screens back off a little more).
     * A resting camera is then nudged out of the cloud decks so the view never parks in haze.
     */
    function framed(v) {
      const { clientWidth: W, clientHeight: H } = map.getContainer()
      if (v.fitted) return v
      const { top = 0, bottom = 0 } = insetRef.current ?? {}
      let zoom = v.zoom + Math.log2(Math.min((H * (1 - top - bottom)) / 1080, W / 900))
      const k = (1.5 * H * 40075016.686 * Math.cos((v.center[1] * Math.PI) / 180) * Math.cos((v.pitch * Math.PI) / 180)) / 512
      const altAt = (z) => k / 2 ** z + v.lift // above the ground at the stop
      const zoomAt = (alt) => Math.log2(k / Math.max(1, alt - v.lift))
      for (const [lo, hi] of clouds?.bands() ?? []) {
        const alt = altAt(zoom)
        if (alt > lo && alt < hi) zoom = alt - lo < hi - alt ? zoomAt(lo - 1) : zoomAt(hi + 1)
      }
      return { ...v, zoom }
    }

    function goTo(id, opts = {}) {
      const hood = isHood(id)
      const i = placeIndex(id)
      reserve.setHighlight(id in VIEWS && id !== 'reserve')
      reserve.setNeighbourhood(hood)
      reserve.setLandmark(i)
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
      const idle = () => new Promise((r) => map.once('idle', r))
      const wait = (ms) => new Promise((r) => setTimeout(r, ms))

      // load the arrival view under the clouds, then rise above them for the descent
      await Promise.race([Promise.all([reserve.layer.ready, idle()]), wait(9000)])
      if (gone) return
      reserve.settle()
      placeAnchors()
      const first = viewFor(stopRef.current)
      if (!reduced()) {
        map.jumpTo({ center: SITE.at, zoom: 13.2, pitch: 14, bearing: first.bearing - 100, roll: 0, elevation: ground() })
        await Promise.race([idle(), wait(2500)])
        if (gone) return
      }
      report.current?.('ready')
      intro = gsap.timeline()
      intro.to(clouds?.params ?? {}, { mist: 0, duration: reduced() ? 0.01 : 2.8, ease: 'power2.out' }, 0)
      intro.add(
        () => {
          live.current.introduced = true
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
    if (replay && live.current?.introduced) live.current.goTo(stopRef.current)
  }, [replay])

  useEffect(() => {
    live.current?.measure()
  }, [inset])

  const hood = isHood(stop)
  const active = placeIndex(stop)

  return (
    <div className="absolute inset-0">
      {/* MapLibre's own (unlayered) CSS makes its container `position: relative`, so it sits in a sized wrapper */}
      <div ref={host} className="h-full w-full" />
      {/* cloud-coloured until the first frame of real clouds is drawn */}
      <div ref={veil} className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,#f1e9de,#d8d3c9_55%,#aeb3ab)] transition-opacity duration-1000" />
      <div ref={overlay} className="pointer-events-none absolute inset-0 overflow-hidden">
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
            <Pin place={p} active={active === i} onClick={() => onStop(`place-${i}`)} />
          </Anchor>
        ))}
      </div>
    </div>
  )
}
