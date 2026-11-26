import { bedroomsOf, CONFIGS, FEATURES, floorsOf, hasRoom, ON_SALE, TOWERS, UNITS } from './content.js'
import { BUILDING } from './residences.js'

/*
 * The unit finder's shared state and helpers (Unit Comparison's way in, laid out as Runwal Zenith's
 * "Search by unit": filter the homes, pick two or three, set them side by side, then their views).
 * Browser-only, as it reads the towers' tracing.
 */

// The floors with homes, as traced on the towers (the 5th to the 40th), and the tower on offer.
const traced = BUILDING.towers[0]?.floors ?? []
export const HOME_FLOORS = traced.length ? `${traced[0].n}–${traced.at(-1).n}` : '5–40'
export const FLOOR_RANGE = { min: traced[0]?.n ?? 5, max: traced.at(-1)?.n ?? 40 }
export const ALL_TOWERS = TOWERS.find((t) => t.id === ON_SALE).label

const count = (unit, prefix) => unit.rooms.filter(([name]) => name.startsWith(prefix)).length
export const toiletsOf = (unit) => count(unit, 'Toilet')
export const balconiesOf = (unit) => count(unit, 'Balcony')
export const isJodi = (unit) => unit.flats.length > 1

// How big a home is, for sorting only: its rooms' sizes as the drawings print them, added up. It
// leaves out the passages and walls, so it is no carpet area and is never shown as one.
const feet = (s) => {
  const [, f, i] = s.match(/(\d+)'(\d+)"/)
  return Number(f) + Number(i) / 12
}
const roomArea = (size) =>
  size.split('\n').reduce((sum, part) => {
    const [w, d] = part.match(/\d+'\d+"/g)
    return sum + (/two of/.test(part) ? 2 : 1) * feet(w) * feet(d)
  }, 0)
const SIZE = new Map(UNITS.map((u) => [u.id, u.rooms.reduce((sum, [, size]) => sum + roomArea(size), 0)]))

/*
 * The area the finder's slider narrows by, in sq ft. No RERA carpet areas have been supplied (the
 * brochure's plan pages are still placeholders), so until they are it is the rooms' sizes on each plan
 * added up, and says so. Give every home in UNITS a `carpet` (sq ft) and the slider, the cards and the
 * comparison all turn to the carpet area instead.
 */
export const CARPET = UNITS.every((u) => u.carpet > 0)
export const areaOf = (unit) => Math.round(CARPET ? unit.carpet : SIZE.get(unit.id))
const areas = UNITS.map(areaOf)
export const AREA = {
  label: CARPET ? 'Carpet area' : 'Room area',
  note: CARPET ? 'RERA carpet area' : 'The rooms on the plan, added up: not the carpet area',
  unit: CARPET ? 'sq ft carpet' : 'sq ft of rooms',
  min: Math.floor(Math.min(...areas) / 10) * 10,
  max: Math.ceil(Math.max(...areas) / 10) * 10,
}
export const sqft = (n) => Math.round(n).toLocaleString('en-IN')

/*
 * The filters, each a row of chips (or the key plan's flats). Picking more than one chip in a row widens
 * it (2 or 3 BHK), but the rooms narrow it: a home must have every room picked. A flat on the key plan
 * picks the homes that take it up.
 */
const values = (get) => [...new Set(UNITS.map(get))].sort((a, b) => a - b)
export const FACETS = [
  { key: 'configs', label: 'Configuration', options: CONFIGS, test: (u, v) => bedroomsOf(u) === v },
  {
    key: 'kinds',
    label: 'Home',
    options: [
      { id: 'flat', label: 'Single flat' },
      { id: 'jodi', label: 'Jodi · two joined' },
    ],
    test: (u, v) => isJodi(u) === (v === 'jodi'),
  },
  { key: 'toilets', label: 'Toilets', options: values(toiletsOf).map((n) => ({ id: n, label: `${n} toilets` })), test: (u, v) => toiletsOf(u) === v },
  { key: 'balconies', label: 'Balconies', options: values(balconiesOf).map((n) => ({ id: n, label: `${n} ${n === 1 ? 'balcony' : 'balconies'}` })), test: (u, v) => balconiesOf(u) === v },
  { key: 'features', label: 'Rooms it has', options: FEATURES, test: (u, v) => hasRoom(u, v), every: true },
  { key: 'flats', label: 'Position on the floor', options: [1, 2, 3, 4, 5, 6].map((n) => ({ id: n, label: `Flat ${n}` })), test: (u, v) => u.flats.includes(v) },
]

export const SORTS = [
  { id: 'floor', label: 'Floor order' },
  { id: 'size-desc', label: 'Size · largest first' },
  { id: 'size-asc', label: 'Size · smallest first' },
  { id: 'beds-desc', label: 'Bedrooms · most first' },
  { id: 'beds-asc', label: 'Bedrooms · fewest first' },
]

export const NO_FILTERS = Object.freeze({
  ...Object.fromEntries(FACETS.map((f) => [f.key, []])),
  area: [AREA.min, AREA.max],
  floors: [FLOOR_RANGE.min, FLOOR_RANGE.max],
  sort: 'floor',
})
const narrowed = ([lo, hi], { min, max }) => lo > min || hi < max
export const areaNarrowed = (filters) => narrowed(filters.area, AREA)
export const floorsNarrowed = (filters) => narrowed(filters.floors, FLOOR_RANGE)
// how many filters are on: each chip picked, and each slider moved off its ends
export const filtersOn = (filters) => FACETS.reduce((n, f) => n + filters[f.key].length, 0) + areaNarrowed(filters) + floorsNarrowed(filters)
export const filtering = (filters) => filtersOn(filters) > 0

const inArea = (unit, [lo, hi]) => areaOf(unit) >= lo && areaOf(unit) <= hi
const fits = (unit, filters, skip) =>
  inArea(unit, filters.area) &&
  FACETS.every((f) => {
    const picked = filters[f.key]
    if (f === skip || !picked.length) return true
    return f.every ? picked.every((v) => f.test(unit, v)) : picked.some((v) => f.test(unit, v))
  })

const SORTERS = {
  'size-desc': (a, b) => areaOf(b) - areaOf(a),
  'size-asc': (a, b) => areaOf(a) - areaOf(b),
  'beds-desc': (a, b) => bedroomsOf(b) - bedroomsOf(a) || areaOf(b) - areaOf(a),
  'beds-asc': (a, b) => bedroomsOf(a) - bedroomsOf(b) || areaOf(a) - areaOf(b),
}

// The homes the filters leave, in the order picked (the floor's: flats 1 to 6, then the jodis).
export function filterHomes(filters) {
  const out = UNITS.filter((u) => fits(u, filters))
  const by = SORTERS[filters.sort]
  return by ? [...out].sort(by) : out
}

// How many homes a chip would leave if it were picked as well, so the ones that would leave none can
// say so and stand back.
export function countWith(filters, facet, value) {
  if (facet.every) return UNITS.filter((u) => fits(u, filters) && facet.test(u, value)).length
  return UNITS.filter((u) => fits(u, filters, facet) && facet.test(u, value)).length
}

// What the finder was left with, so a comparison's × (or the other way in, and back) finds it as it
// was: the filters, the homes picked to compare, and the comparison's tab.
export const finder = { filters: NO_FILTERS, picked: [], tab: 'plan' }

// The homes a comparison starts with: each picked plan in the tower on offer. Every home is on each
// floor of homes, so the floors picked in the finder set the height their views are compared from:
// the floor with a 360° view (every fifth has one) nearest the middle of them, kept inside them where
// one is. With every floor picked it is the export's starting floor.
export function homesOf(ids, [lo, hi] = [FLOOR_RANGE.min, FLOOR_RANGE.max]) {
  const tower = TOWERS.find((t) => t.id === ON_SALE)
  const floors = floorsOf(tower.id)
  const all = lo <= FLOOR_RANGE.min && hi >= FLOOR_RANGE.max
  const inside = floors.filter((f) => f.id >= lo && f.id <= hi)
  const mid = (lo + hi) / 2
  const nearest = (list) => list.reduce((a, b) => (Math.abs(b.id - mid) < Math.abs(a.id - mid) ? b : a))
  const floor = (all && floors.find((f) => f.key === tower.start.key)) || nearest(inside.length ? inside : floors)
  return ids.map((id) => ({ tower, unit: UNITS.find((u) => u.id === id), floor }))
}

// Leaving a comparison for the finder puts its homes in the finder's tray.
export const keepPicked = (homes) => {
  finder.picked = [...new Set(homes.map((h) => h.unit.id))]
}
