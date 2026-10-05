import { plotOutline, siteGeoJSON } from './site'

/*
 * A brand-coloured MapLibre style in the spirit of the brochure's location map: deep forest
 * ground, sage roads, gold arterials, a dusk sky. Uses MapTiler when VITE_MAPTILER_KEY is set,
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
  ground: '#10291f',
  wood: '#12301f',
  park: '#153626',
  water: '#0a2226',
  waterLine: '#123a3c',
  minor: '#1f4436',
  street: '#2a5545',
  major: '#3d6e5c',
  gold: '#c9a35a',
  goldDeep: '#9c7a3c',
  plot: '#2d5a3e',
  track: '#c0714a',
  drive: '#6d7f74',
  pond: '#2f7c86',
  label: 'rgba(250, 247, 242, 0.62)',
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
    if (k.glow) layers.unshift({ ...base, id: `road-${k.id}-glow`, paint: { 'line-color': C.gold, 'line-width': z(8, 4, 15, 18, 19, 60), 'line-blur': z(8, 4, 15, 14, 19, 40), 'line-opacity': 0.16 } })
    return layers
  })
}

export function mapStyle() {
  // OSM buildings that overlap the plot are hidden so the reserve's own towers stand alone.
  const plot = { type: 'Polygon', coordinates: [plotOutline()] }
  return {
    version: 8,
    glyphs: SOURCES.glyphs,
    sources: {
      vector: SOURCES.vector,
      dem: SOURCES.dem,
      relief: { ...SOURCES.dem },
      site: { type: 'geojson', data: siteGeoJSON() },
    },
    sky: {
      'sky-color': '#123b4a',
      'horizon-color': '#f0b27a',
      'fog-color': '#a77a55',
      'sky-horizon-blend': 0.75,
      'horizon-fog-blend': 0.85,
      'fog-ground-blend': 0.55,
      'atmosphere-blend': 0,
    },
    light: { anchor: 'map', position: [1.4, 250, 62], color: '#ffd8a8', intensity: 0.42 },
    terrain: { source: 'dem', exaggeration: 1.35 },
    layers: [
      { id: 'ground', type: 'background', paint: { 'background-color': C.ground } },
      {
        id: 'landcover',
        type: 'fill',
        source: 'vector',
        'source-layer': 'landcover',
        filter: cls('wood', 'grass', 'wetland', 'farmland'),
        paint: { 'fill-color': ['match', ['get', 'class'], 'wood', C.wood, 'wetland', '#0f2b24', C.park], 'fill-opacity': 0.9 },
      },
      { id: 'park', type: 'fill', source: 'vector', 'source-layer': 'park', paint: { 'fill-color': C.park, 'fill-opacity': 0.75 } },
      {
        id: 'relief',
        type: 'hillshade',
        source: 'relief',
        paint: {
          'hillshade-shadow-color': '#04110c',
          'hillshade-highlight-color': '#5b8a6e',
          'hillshade-accent-color': '#0b2018',
          'hillshade-exaggeration': 0.45,
          'hillshade-illumination-direction': 250,
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
        paint: { 'line-color': '#4e786a', 'line-width': z(10, 0.6, 16, 2.2), 'line-dasharray': [3, 2] },
      },
      { id: 'plot', type: 'fill', source: 'site', filter: ['==', ['get', 'kind'], 'plot'], paint: { 'fill-color': C.plot } },
      { id: 'court', type: 'fill', source: 'site', filter: ['==', ['get', 'kind'], 'court'], paint: { 'fill-color': '#4a5d52' } },
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
      {
        id: 'buildings',
        type: 'fill-extrusion',
        source: 'vector',
        'source-layer': 'building',
        minzoom: 13,
        filter: ['>', ['distance', plot], 8],
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, '#1d4234', 30, '#2b5546', 90, '#3b6655'],
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
        paint: { 'text-color': 'rgba(230, 201, 131, 0.7)', 'text-halo-color': C.halo, 'text-halo-width': 1.2 },
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
