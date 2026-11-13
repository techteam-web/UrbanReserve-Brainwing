import { floorsOf, TOWERS, UNITS } from './content.js'
import { BUILDING } from './residences.js'

/*
 * The unit finder's shared state and helpers (Unit Comparison's way in: filter the homes, pick two or
 * three, set them side by side, then their views). Browser-only, as it reads the towers' tracing.
 */

// The floors with homes, as traced on the towers (the 5th to the 40th), and the towers that have them.
const traced = BUILDING.towers[0]?.floors ?? []
export const HOME_FLOORS = traced.length ? `${traced[0].n}–${traced.at(-1).n}` : '5–40'
export const ALL_TOWERS = `Towers ${TOWERS.map((t) => t.label.replace(/^Tower /, '')).join(' & ')}`

// What the finder was left with, so a comparison's × (or the other way in, and back) finds it as it
// was: its filters, the homes picked to compare, which drawing the cards show, and the comparison's tab.
export const finder = { configs: [], flats: [], features: [], picked: [], show: 'plan', tab: 'plan' }

// The homes a comparison starts with: each picked plan in the first tower, at the height its views
// open on (the export's starting floor). The plans are alike in both towers; the views step can move
// any of them to the other tower.
export function homesOf(ids) {
  const tower = TOWERS[0]
  const floors = floorsOf(tower.id)
  const floor = floors.find((f) => f.key === tower.start.key) ?? floors[0]
  return ids.map((id) => ({ tower, unit: UNITS.find((u) => u.id === id), floor }))
}

// Leaving a comparison for the finder puts its homes in the finder's tray.
export const keepPicked = (homes) => {
  finder.picked = [...new Set(homes.map((h) => h.unit.id))]
}
