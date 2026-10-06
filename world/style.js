import { plotOutline, siteGeoJSON } from './site'
import { PLACES } from './stops'
import { SUN_AZ, SUN_EL } from './light'

/*
 * A brand-coloured MapLibre style in the spirit of the brochure's location map: forest ground, sage
 * roads, gold arterials and a golden-hour sky. Uses MapTiler when VITE_MAPTILER_KEY is set,
 * otherwise the keyless OpenFreeMap tiles and AWS Terrarium elevation.
 */
const KEY = import.meta.env.VITE_MAPTILER_KEY

const SOURCES = KEY
  ? {
      vector: { type: 'vector', url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${KEY}` },
      dem: { type: 'raster-dem', url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${KEY}`, tileSize: 256 },
      glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${KEY}`,
    }
  : {
      vector: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
      dem: {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 14,
        attribution: '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Mapzen Terrain</a>',
      },
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    }

const C = {
  ground: '#16372a',
  wood: '#18412a',
  park: '#1c4933',
  wetland: '#143a31',
  water: '#16464f',
  waterLine: '#1d5458',
  minor: '#29594a',
  street: '#376e5a',
  major: '#4c8a73',
  gold: '#c9a35a',
  goldDeep: '#ad8743',
  plot: '#3b7551',
  track: '#c97a52',
  drive: '#82978a',
  pond: '#2f7c86',
  route: '#e3742c',
  label: 'rgba(250, 247, 242, 0.74)',
  halo: '#0d231d',
}

const z = (...stops) => ['interpolate', ['exponential', 1.6], ['zoom'], ...stops]
const cls = (...names) => ['match', ['get', 'class'], names, true, false]

function roads() {
  const kinds = [
    { id: 'path', filter: cls('path', 'track'), color: C.minor, width: z(14, 0.3, 18, 1.6), dash: [2, 2], min: 14 },
    { id: 'minor', filter: cls('minor', 'service'), color: C.minor, width: z(12, 0.4, 16, 2.4, 19, 9), min: 12 },
    { id: 'street', filter: cls('tertiary', 'secondary'), color: C.street, width: z(10, 0.6, 15, 3.4, 19, 16) },
    { id: 'primary', filter: cls('primary'), color: C.major, width: z(9, 0.8, 15, 4.6, 19, 22) },
    { id: 'trunk', filter: cls('trunk', 'motorway'), color: C.goldDeep, width: z(8, 1, 15, 6, 19, 28), glow: true },
  ]
  return kinds.flatMap((k) => {
    const base = {
      type: 'line',
      source: 'vector',
      'source-layer': 'transportation',
      minzoom: k.min ?? 0,
      filter: ['all', k.filter, ['!=', ['get', 'brunnel'], 'tunnel']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    }
    const layers = [{ ...base, id: `road-${k.id}`, paint: { 'line-color': k.color, 'line-width': k.width, ...(k.dash && { 'line-dasharray': k.dash }) } }]
    if (k.glow) layers.unshift({ ...base, id: `road-${k.id}-glow`, paint: { 'line-color': C.gold, 'line-width': z(8, 4, 15, 18, 19, 60), 'line-blur': z(8, 4, 15, 14, 19, 40), 'line-opacity': 0.18 } })
    return layers
  })
}

// Road routes from the reserve to each place; World picks which ones show.
export const ROUTE_LAYERS = { all: ['routes-casing', 'routes'], active: ['route-glow', 'route-active-casing', 'route-active'] }

function routes() {
  const features = PLACES.map((p, i) => p.route && { type: 'Feature', properties: { i }, geometry: { type: 'LineString', coordinates: p.route.path } }).filter(Boolean)
  const line = { type: 'line', source: 'routes', layout: { 'line-cap': 'round', 'line-join': 'round' } }
  const none = ['==', ['get', 'i'], -1]
  return {
    source: { type: 'geojson', data: { type: 'FeatureCollection', features }, lineMetrics: true },
    layers: [
      { ...line, id: 'routes-casing', paint: { 'line-color': C.halo, 'line-width': z(11, 2, 14, 4.5, 17, 10), 'line-opacity': 0 } },
      { ...line, id: 'routes', paint: { 'line-color': C.route, 'line-width': z(11, 1, 14, 2.4, 17, 5.5), 'line-opacity': 0 } },
      { ...line, id: 'route-glow', filter: none, paint: { 'line-color': C.route, 'line-width': z(11, 8, 14, 16, 17, 34), 'line-blur': z(11, 6, 14, 12, 17, 24), 'line-opacity': 0.4 } },
      { ...line, id: 'route-active-casing', filter: none, paint: { 'line-color': C.halo, 'line-width': z(11, 3.5, 14, 7.5, 17, 15), 'line-opacity': 0.75 } },
      { ...line, id: 'route-active', filter: none, paint: { 'line-width': z(11, 2, 14, 4.6, 17, 9.5), 'line-gradient': routeReveal(0) } },
    ],
  }
}

// line-gradient that shows the active route from the reserve up to `p` (0..1) of its length
export function routeReveal(p) {
  const on = C.route
  const off = 'rgba(227, 116, 44, 0)'
  if (p >= 1) return ['interpolate', ['linear'], ['line-progress'], 0, on, 1, on]
  if (p <= 0) return ['interpolate', ['linear'], ['line-progress'], 0, off, 1, off]
  return ['interpolate', ['linear'], ['line-progress'], 0, on, Math.max(0, p - 0.002), on, p, off, 1, off]
}

export function mapStyle() {
  // OSM buildings that overlap the plot are hidden so the reserve's own towers stand alone.
  const plot = { type: 'Polygon', coordinates: [plotOutline()] }
  const route = routes()
  return {
    version: 8,
    glyphs: SOURCES.glyphs,
    sources: {
      vector: SOURCES.vector,
      dem: SOURCES.dem,
      // the hillshade's own copy of the elevation, kept coarse: it only shades, and must not hold up loading
      relief: { ...SOURCES.dem, maxzoom: 11 },
      site: { type: 'geojson', data: siteGeoJSON() },
      routes: route.source,
    },
    sky: {
      'sky-color': '#1d5568',
      'horizon-color': '#f4bd86',
      'fog-color': '#b48a63',
      'sky-horizon-blend': 0.75,
      'horizon-fog-blend': 0.85,
      'fog-ground-blend': 0.6,
      'atmosphere-blend': 0,
    },
    light: { anchor: 'map', position: [1.4, SUN_AZ, 90 - SUN_EL], color: '#ffdcb0', intensity: 0.48 },
    terrain: { source: 'dem', exaggeration: 1.35 },
    layers: [
      { id: 'ground', type: 'background', paint: { 'background-color': C.ground } },
      {
        id: 'landcover',
        type: 'fill',
        source: 'vector',
        'source-layer': 'landcover',
        filter: cls('wood', 'grass', 'wetland', 'farmland'),
        paint: { 'fill-color': ['match', ['get', 'class'], 'wood', C.wood, 'wetland', C.wetland, C.park], 'fill-opacity': 0.9 },
      },
      { id: 'park', type: 'fill', source: 'vector', 'source-layer': 'park', paint: { 'fill-color': C.park, 'fill-opacity': 0.75 } },
      {
        id: 'relief',
        type: 'hillshade',
        source: 'relief',
        paint: {
          'hillshade-shadow-color': '#0a1f17',
          'hillshade-highlight-color': '#79a88b',
          'hillshade-accent-color': '#112d23',
          'hillshade-exaggeration': 0.42,
          'hillshade-illumination-direction': SUN_AZ,
        },
      },
      { id: 'water', type: 'fill', source: 'vector', 'source-layer': 'water', paint: { 'fill-color': C.water } },
      { id: 'water-edge', type: 'line', source: 'vector', 'source-layer': 'water', paint: { 'line-color': C.waterLine, 'line-width': z(10, 0.5, 16, 2) } },
      { id: 'waterway', type: 'line', source: 'vector', 'source-layer': 'waterway', paint: { 'line-color': C.waterLine, 'line-width': z(10, 0.6, 16, 3) } },
      ...roads(),
      {
        id: 'rail',
        type: 'line',
        source: 'vector',
        'source-layer': 'transportation',
        filter: cls('rail', 'transit'),
        paint: { 'line-color': '#5f8d7d', 'line-width': z(10, 0.6, 16, 2.2), 'line-dasharray': [3, 2] },
      },
      { id: 'plot', type: 'fill', source: 'site', filter: ['==', ['get', 'kind'], 'plot'], paint: { 'fill-color': C.plot } },
      { id: 'court', type: 'fill', source: 'site', filter: ['==', ['get', 'kind'], 'court'], paint: { 'fill-color': '#5a7064' } },
      { id: 'pond', type: 'fill', source: 'site', filter: ['==', ['get', 'kind'], 'pond'], paint: { 'fill-color': C.pond } },
      {
        id: 'drive',
        type: 'line',
        source: 'site',
        filter: ['==', ['get', 'kind'], 'drive'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': C.drive, 'line-width': z(14, 1, 17, 7, 20, 50) },
      },
      {
        id: 'track',
        type: 'line',
        source: 'site',
        filter: ['==', ['get', 'kind'], 'track'],
        layout: { 'line-join': 'round' },
        paint: { 'line-color': C.track, 'line-width': z(14, 0.6, 17, 3.5, 20, 26) },
      },
      {
        id: 'plot-edge',
        type: 'line',
        source: 'site',
        filter: ['==', ['get', 'kind'], 'plot'],
        layout: { 'line-join': 'round' },
        paint: { 'line-color': C.gold, 'line-width': z(12, 1, 17, 2.5), 'line-opacity': 0.85 },
      },
      ...route.layers,
      {
        id: 'buildings',
        type: 'fill-extrusion',
        source: 'vector',
        'source-layer': 'building',
        minzoom: 13,
        filter: ['>', ['distance', plot], 8],
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, '#275946', 30, '#3a735f', 90, '#508a73'],
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': z(13, 0, 14, 0.94),
          'fill-extrusion-vertical-gradient': true,
        },
      },
      {
        id: 'road-label',
        type: 'symbol',
        source: 'vector',
        'source-layer': 'transportation_name',
        minzoom: 14,
        filter: cls('trunk', 'motorway', 'primary'),
        layout: {
          'symbol-placement': 'line',
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': 10.5,
          'text-letter-spacing': 0.18,
          'text-transform': 'uppercase',
        },
        paint: { 'text-color': 'rgba(230, 201, 131, 0.78)', 'text-halo-color': C.halo, 'text-halo-width': 1.2 },
      },
      {
        id: 'place-label',
        type: 'symbol',
        source: 'vector',
        'source-layer': 'place',
        filter: ['match', ['get', 'class'], ['suburb', 'neighbourhood', 'quarter', 'town', 'village', 'city'], true, false],
        layout: {
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['match', ['get', 'class'], ['city', 'town'], 13, 11],
          'text-letter-spacing': 0.32,
          'text-transform': 'uppercase',
          'text-max-width': 9,
        },
        paint: { 'text-color': C.label, 'text-halo-color': C.halo, 'text-halo-width': 1.4 },
      },
    ],
  }
}
