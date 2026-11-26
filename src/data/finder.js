import { floorsOf, ON_SALE, TOWERS, UNITS } from './content.js'
import { BUILDING } from './residences.js'

/*
 * The unit finder's shared state and helpers (Unit Comparison's way in: filter the homes, pick two or
 * three, set them side by side, then their views). Browser-only, as it reads the towers' tracing.
 */

// The floors with homes, as traced on the towers (the 5th to the 40th), and the tower on offer.
const traced = BUILDING.towers[0]?.floors ?? []
export const HOME_FLOORS = traced.length ? `${traced[0].n}–${traced.at(-1).n}` : '5–40'
export const ALL_TOWERS = TOWERS.find((t) => t.id === ON_SALE).label

// What the finder was left with, so a comparison's × (or the other way in, and back) finds it as it
// was: the bedrooms picked (none for every home), the homes picked to compare, the home on show, and
// the comparison's tab.
export const finder = { configs: [], picked: [], current: null, tab: 'plan' }

// The homes a comparison starts with: each picked plan in the tower on offer, at the height its views
// open on (the export's starting floor).
export function homesOf(ids) {
  const tower = TOWERS.find((t) => t.id === ON_SALE)
  const floors = floorsOf(tower.id)
  const floor = floors.find((f) => f.key === tower.start.key) ?? floors[0]
  return ids.map((id) => ({ tower, unit: UNITS.find((u) => u.id === id), floor }))
}

// Leaving a comparison for the finder puts its homes in the finder's tray.
export const keepPicked = (homes) => {
  finder.picked = [...new Set(homes.map((h) => h.unit.id))]
}
