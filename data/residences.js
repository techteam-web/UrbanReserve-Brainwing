import BUILDING_FLOORS from './building-floors.svg?raw'
import { FLOOR_PLANS, LANDING, TOWERS } from './content.js'

/*
 * The towers as they stand in the forest, for Residences' Visual Selection. The picture is Home's,
 * public/assets/img/building-day.webp, a web copy of the 10667 × 6000 render
 * (public/urban_reserve_day..webp, not in git). src/data/building-floors.svg traces each floor of homes
 * over the render at full size: <g id="tower_1"> for Tower A (the nearer one, on the left) and
 * <g id="tower_2"> for Tower B, each holding a <polygon id="floor_N"> per floor, numbered from the
 * bottom. They are the 36 floors of homes, the 5th to the 40th, above the four parking levels and the
 * E-Deck. The file is read as the browser reads any SVG, so a re-export's extra layers, nested groups
 * or wrapped lines don't matter; one without the two towers leaves Residences without floors, and
 * says so in the console, rather than stopping the app. `focus` is the part of the picture to keep in
 * view, both towers from their crowns to the podium, in the render's pixels.
 *
 * This module imports the SVG as Vite does (?raw), so it stays out of content.js, which the scripts
 * in scripts/ load in plain Node.
 */
const FIRST_HOME_FLOOR = 5
const svg = new DOMParser().parseFromString(BUILDING_FLOORS, 'image/svg+xml').documentElement
const [, , width, height] = (svg.getAttribute('viewBox') ?? `0 0 ${svg.getAttribute('width')} ${svg.getAttribute('height')}`).split(/[\s,]+/).map(Number)
const numberIn = (id) => parseInt(id.match(/\d+/)?.[0])

export const BUILDING = {
  image: LANDING.image,
  width,
  height,
  focus: { x: 6000, y: 600, w: 2250, h: 3750 },
  towers: TOWERS.flatMap((tower, i) => {
    const group = svg.querySelector(`g[id="tower_${i + 1}"]`)
    const floors = [...(group?.querySelectorAll('polygon[id^="floor_"]') ?? [])]
      .map((p) => ({ n: numberIn(p.id) + FIRST_HOME_FLOOR - 1, points: (p.getAttribute('points') ?? '').trim().replace(/\s+/g, ' ') }))
      .filter((f) => f.n >= FIRST_HOME_FLOOR && f.points)
      .sort((a, b) => a.n - b.n)
    return floors.length ? [{ id: tower.id, label: tower.label, floors }] : []
  }),
}
if (BUILDING.towers.length !== TOWERS.length || !(width > 0 && height > 0))
  console.error('src/data/building-floors.svg: expected a viewBox and <g id="tower_1"> and <g id="tower_2">, each of <polygon id="floor_N">')
for (const { label, floors } of BUILDING.towers)
  if (floors.some((f, i) => f.n !== floors[0].n + i)) console.warn(`src/data/building-floors.svg: ${label} skips or repeats a floor`)

// The floor a visual selection has open (?tower=towerA&floor=23, with &flat=3 once a home on it is
// picked), or null while it shows the towers.
export function pickedFloor(search) {
  const q = new URLSearchParams(search)
  const tower = BUILDING.towers.find((t) => t.id === q.get('tower'))
  const floor = tower?.floors.find((f) => f.n === Number(q.get('floor')))
  if (!floor) return null
  const flats = FLOOR_PLANS.find((p) => p.id === tower.id).flats
  return { tower, floor, flat: flats.find((f) => f.id === Number(q.get('flat'))) ?? null }
}
