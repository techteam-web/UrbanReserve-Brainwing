// MapLibre style in the brochure's green "doodle" map look: deep forest land, sage line-work roads,
// muted labels. Vector tiles and fonts come from OpenFreeMap (free, no API key, OpenMapTiles schema).
const C = {
  land: '#16463a',
  park: '#1a5142',
  water: '#0f3a31',
  building: '#1d5243',
  minor: '#2c6a54',
  major: '#468a6d',
  motorway: '#5da383',
  rail: '#3b7a62',
  label: '#cfe3d6',
}

// line width grows with zoom: [z, width] pairs
const w = (...stops) => ['interpolate', ['exponential', 1.5], ['zoom'], ...stops.flat()]

export const MAP_STYLE = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors' },
  },
  layers: [
    { id: 'land', type: 'background', paint: { 'background-color': C.land } },
    { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': C.park } },
    {
      id: 'green',
      type: 'fill',
      source: 'omt',
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood', 'farmland']]],
      paint: { 'fill-color': C.park, 'fill-opacity': 0.8 },
    },
    { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': C.water } },
    { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', paint: { 'line-color': C.water, 'line-width': w([12, 1], [18, 6]) } },
    {
      id: 'building',
      type: 'fill',
      source: 'omt',
      'source-layer': 'building',
      minzoom: 14,
      paint: { 'fill-color': C.building, 'fill-outline-color': C.minor, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0, 15.5, 0.8] },
    },
    {
      id: 'rail',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'rail'],
      paint: { 'line-color': C.rail, 'line-width': w([12, 1], [18, 3]), 'line-dasharray': [3, 2] },
    },
    {
      id: 'road-minor',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.minor, 'line-width': w([13, 0.6], [18, 7]) },
    },
    {
      id: 'road-major',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.major, 'line-width': w([10, 1], [18, 14]) },
    },
    {
      id: 'road-motorway',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.motorway, 'line-width': w([8, 1.5], [18, 20]) },
    },
    {
      id: 'road-label',
      type: 'symbol',
      source: 'omt',
      'source-layer': 'transportation_name',
      minzoom: 13,
      layout: { 'symbol-placement': 'line', 'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']], 'text-font': ['Noto Sans Regular'], 'text-size': 11 },
      paint: { 'text-color': C.label, 'text-opacity': 0.55, 'text-halo-color': C.land, 'text-halo-width': 1.2 },
    },
    {
      id: 'place-label',
      type: 'symbol',
      source: 'omt',
      'source-layer': 'place',
      filter: ['in', ['get', 'class'], ['literal', ['suburb', 'neighbourhood', 'quarter', 'town']]],
      layout: {
        'text-field': ['upcase', ['coalesce', ['get', 'name:en'], ['get', 'name']]],
        'text-font': ['Noto Sans Regular'],
        'text-size': 11,
        'text-letter-spacing': 0.25,
      },
      paint: { 'text-color': C.label, 'text-opacity': 0.4, 'text-halo-color': C.land, 'text-halo-width': 1 },
    },
  ],
}
