import { setWorkerUrl } from 'maplibre-gl'
// MapLibre 6 finds its worker beside its own module, which Vite's dependency bundling moves.
// `?worker&url` bundles the worker (and the code it shares) and hands back where it lives.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

setWorkerUrl(workerUrl)

export { Map, Marker, MercatorCoordinate, prewarm } from 'maplibre-gl'
