import { AMENITY_LEVELS, comparison, FLOOR_PLANS, img, LANDING, LOCATION, SPEC_IMAGE, towerFloor, unitOf } from './content.js'
import { BUILDING, pickedFloor } from './residences.js'

// What the page transition (src/app/Navigator.jsx) needs to know of each screen. A value that is a
// function reads the screen's query (the floor a home's view opens on, the step Residences is at).

// The colour each screen opens on, for the page transition to fade through. Location opens on its
// preloader's veil, which is as pale as paper whatever the map beneath it.
const PAPER = 'var(--color-paper)'
const FOREST = 'var(--color-forest-950)'
export const ROUTE_GROUND = {
  landing: FOREST,
  overview: PAPER,
  // the towers and the views are dark, the plans paper
  residences: (search) => {
    const compared = comparison(search)
    if (compared) return compared.views ? FOREST : PAPER
    return pickedFloor(search) ? PAPER : FOREST
  },
  amenities: 'var(--color-forest-900)',
  views: FOREST,
  location: PAPER,
  specifications: PAPER,
}

// Which of a page's screens an address opens, where a page has several (Residences' towers, a
// floor, the comparison of plans and of views): moving between two runs the curtain like a new
// page, while a change within one (a floor, a home, a tower) happens in place. Pages not listed are
// told apart by their colour.
export const ROUTE_STEP = {
  residences: (search) => {
    const compared = comparison(search)
    if (compared) return compared.views ? 'views' : 'plans'
    return pickedFloor(search) ? 'floor' : 'towers'
  },
}

// Images decoded behind the curtain before each screen is revealed.
const I = (...names) => names.map(img)
export const ROUTE_IMAGES = {
  landing: [LANDING.image],
  overview: [...I('forest', 'sapling-hands', 'leaf-texture', 'tower-day', 'tower-dusk', 'lobby', 'sun-felt')],
  residences: (search) => {
    const compared = comparison(search)
    if (compared) return compared.homes.map((h) => (compared.views ? `${h.floor.tiles}/preview.jpg` : h.unit.plan))
    const at = pickedFloor(search)
    if (!at) return [BUILDING.image]
    // a floor's plan, the towers for its key, and the home open on it
    const plans = [FLOOR_PLANS.find((p) => p.id === at.tower.id).plan, BUILDING.image]
    return at.flat ? [...plans, unitOf(at.flat).plan] : plans
  },
  amenities: [AMENITY_LEVELS[0].plan, ...AMENITY_LEVELS[0].photos.map((p) => p.image)],
  views: (search) => [`${towerFloor(search).floor.tiles}/preview.jpg`],
  location: [LOCATION.map],
  specifications: [SPEC_IMAGE],
}
