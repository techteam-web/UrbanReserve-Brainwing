import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre parses tiles in a worker; Vite's dependency bundling breaks its self-located worker URL,
// so hand it a worker Vite has bundled (with its shared chunk) itself
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { MAP_STYLE } from './mapStyle'
import ICON_PATHS from './iconPaths'
import markSvg from '../brand/mark.svg?raw'

maplibregl.setWorkerUrl(workerUrl)

// room for the top bar, the horizon nav, pin labels (to the right of each pin) and the route popup (above)
const PAD = { top: 260, bottom: 170, left: 210, right: 220 }

// how each travel mode's route is drawn
const LINE = {
  car: { color: '#e6c983', width: 4.5, dash: null },
  walk: { color: '#faf7f2', width: 4, dash: [0, 2] },
}

const EMPTY = { type: 'FeatureCollection', features: [] }

function boundsOf(points) {
  const b = new maplibregl.LngLatBounds(points[0], points[0])
  points.forEach((p) => b.extend(p))
  return b
}

// the first `k` (0..1) of a polyline, by length, so a route can be drawn growing outwards
function partial(coords, k) {
  const seg = coords.slice(1).map((p, i) => Math.hypot(p[0] - coords[i][0], p[1] - coords[i][1]))
  let left = k * seg.reduce((a, b) => a + b, 0)
  const out = [coords[0]]
  for (let i = 0; i < seg.length; i++) {
    if (left >= seg[i]) {
      out.push(coords[i + 1])
      left -= seg[i]
      continue
    }
    const t = seg[i] ? left / seg[i] : 0
    out.push([coords[i][0] + (coords[i + 1][0] - coords[i][0]) * t, coords[i][1] + (coords[i + 1][1] - coords[i][1]) * t])
    break
  }
  return out
}

function pinEl(place, onPick) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'lm-pin'
  el.setAttribute('aria-label', place.name)
  el.innerHTML = `<span class="lm-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON_PATHS[place.type]}"/></svg></span><span class="lm-name"></span>`
  el.querySelector('.lm-name').textContent = place.name
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    onPick(place.name)
  })
  return el
}

function siteEl() {
  const el = document.createElement('div')
  el.className = 'lm-site'
  el.innerHTML = `<span class="lm-site-ring"></span><span class="lm-site-mark">${markSvg}</span>`
  return el
}

/**
 * The live Location map (MapLibre + OpenFreeMap tiles in the brochure's green style). Landmarks are
 * HTML markers. `route` ({ mode, coords }) is drawn growing out from the site along the roads, and
 * `children` render in a small popup anchored to the active landmark.
 * Calls `onFail` if the map can't load (offline sales office), so the screen can fall back to the
 * illustrated map.
 */
export default function LiveMap({ site, places, active, filter, route, onPick, onFail, children }) {
  const box = useRef(null)
  const map = useRef(null)
  const markers = useRef(new Map())
  const raf = useRef(0)
  const popup = useRef(null)
  const [popupEl] = useState(() => document.createElement('div'))
  const pick = useRef(onPick)
  const fail = useRef(onFail)
  const view = useRef({ active, filter, route })

  // the map's own event handlers read the latest props through these refs
  useLayoutEffect(() => {
    view.current = { active, filter, route }
    pick.current = onPick
    fail.current = onFail
  })

  const frame = (animate = true) => {
    const m = map.current
    if (!m) return
    const { active: a, filter: f, route: r } = view.current
    const place = places.find((p) => p.name === a)
    const shown = places.filter((p) => f === 'all' || p.type === f)
    const pts = place ? [site, place.lngLat, ...(r?.coords ?? [])] : [site, ...shown.map((p) => p.lngLat)]
    m.fitBounds(boundsOf(pts), { padding: PAD, maxZoom: place ? 16 : 14.5, duration: animate ? 1400 : 0, essential: true })
  }

  const draw = () => {
    const m = map.current
    const src = m?.getSource('route')
    if (!src) return
    cancelAnimationFrame(raf.current)
    const r = view.current.route
    if (!r) {
      src.setData(EMPTY)
      return
    }
    const s = LINE[r.mode]
    m.setPaintProperty('route', 'line-color', s.color)
    m.setPaintProperty('route', 'line-width', s.width)
    m.setPaintProperty('route', 'line-dasharray', s.dash ?? [1, 0])
    m.setPaintProperty('route-glow', 'line-color', s.color)
    const t0 = performance.now()
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 1100)
      src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: partial(r.coords, 1 - Math.pow(1 - k, 3)) } })
      if (k < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  const showPopup = () => {
    const m = map.current
    const a = places.find((p) => p.name === view.current.active)
    if (!m || !a) return popup.current?.remove()
    if (!popup.current) {
      popup.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, anchor: 'bottom', offset: 34, maxWidth: 'none', className: 'lm-popup' }).setDOMContent(popupEl)
    }
    popup.current.setLngLat(a.lngLat).addTo(m)
  }

  useEffect(() => {
    if (!navigator.onLine) {
      fail.current?.()
      return
    }
    const m = new maplibregl.Map({
      container: box.current,
      style: MAP_STYLE,
      center: site,
      zoom: 13.5,
      pitch: 30,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      fadeDuration: 0,
    })
    m.touchZoomRotate.disableRotation()
    // bottom corners sit under the horizon nav, so the (required) credit goes top-left
    m.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-left')
    map.current = m

    let loaded = false
    const timer = setTimeout(() => !loaded && fail.current?.(), 10000)
    m.on('error', (e) => {
      if (!loaded && /fetch|network/i.test(e?.error?.message ?? '')) fail.current?.()
    })

    m.on('load', () => {
      loaded = true
      // start the credit collapsed to its (i) button
      box.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
      m.addSource('route', { type: 'geojson', data: EMPTY })
      m.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#e6c983', 'line-width': 14, 'line-opacity': 0.22, 'line-blur': 6 } })
      m.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#e6c983', 'line-width': 4.5 } })
      draw()
      showPopup()
      frame(false)
    })

    new maplibregl.Marker({ element: siteEl(), anchor: 'center' }).setLngLat(site).addTo(m)
    const pins = markers.current
    places.forEach((p) => {
      const mk = new maplibregl.Marker({ element: pinEl(p, (n) => pick.current(n)), anchor: 'left', offset: [-22, 0] }).setLngLat(p.lngLat).addTo(m)
      pins.set(p.name, mk)
    })

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf.current)
      pins.clear()
      popup.current = null
      m.remove()
      map.current = null
    }
    // the map is built once; later prop changes are applied by the effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    markers.current.forEach((mk, name) => {
      const p = places.find((q) => q.name === name)
      const el = mk.getElement()
      el.classList.toggle('is-on', name === active)
      el.classList.toggle('is-off', filter !== 'all' && p.type !== filter)
    })
    if (!map.current?.getSource('route')) return
    showPopup()
    frame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, filter])

  useEffect(() => {
    if (map.current?.getSource('route')) draw()
  }, [route?.coords, route?.mode])

  // MapLibre's stylesheet makes its container position: relative, so it sizes itself inside a positioned frame
  return (
    <div className="absolute inset-0">
      <div ref={box} className="h-full w-full" />
      {createPortal(children, popupEl)}
    </div>
  )
}
