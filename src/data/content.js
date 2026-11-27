import TOWER_A from './TowerA_data.js'
import TOWER_B from './TowerB_data.js'
import TOP_CENTER from './TopCenterData.js'

export const img = (n) => `/assets/img/${n}.webp`

export const BRAND = {
  name: 'Urban Reserve',
  tagline: 'Naturally Elevated Living',
  phone: '+91 00000 00000',
  whatsapp: '910000000000',
  email: 'info@urbanreserve.com',
  web: 'www.urbanreserve.com',
}

// The pages, in the dock's order after Home; `icon` names a path in components/iconPaths.js
export const SECTIONS = [
  // the overview, called Features in the dock (the team lead, Nov 2026); its address stays /overview
  { id: 'overview', label: 'Features', icon: 'overview' },
  { id: 'residences', label: 'Residences', icon: 'plan' },
  { id: 'amenities', label: 'Amenities', icon: 'pool' },
  { id: 'views', label: 'Views', icon: 'turn' },
  { id: 'location', label: 'Location', icon: 'pin' },
  { id: 'specifications', label: 'Specifications', icon: 'sheet' },
]

// The intro film (the client's "urban entry video", Nov 2026): a silent web cut of it (H.264, CRF 26,
// 30 fps, no audio track, index first so it streams), 6 s through the forest and out at the towers,
// ending on Home's picture. `turn` is where one shot morphs into the next (seconds, read off its
// frames: the sky shows through the leaves from 3.1 s and the towers stand clear by 3.75 s); the logo
// draws itself over it. `length` is the film's running time, for its slow push in.
export const INTRO = {
  film: '/video/entry.mp4',
  poster: '/video/entry-poster.webp',
  turn: [3.1, 3.75],
  length: 6,
}

// Home's picture is the towers by day, the intro film's last shot (the Residences page starts from it too)
export const LANDING = {
  image: img('building-day'),
  size: [4800, 2700],
  // the open sky in the picture, as fractions of it, where the name settles after its entrance clear
  // of the trees and the towers. The sky on the left, between the big tree and the towers, comes first
  // wherever the name keeps nearly half its size there (the client's choice, Nov 2026); elsewhere it
  // takes the patch that keeps it largest: the strip by the towers, or the top right. `v` is where in
  // the patch it sits, from its top (0) to its foot (1).
  sky: [
    { x0: 0.315, y0: 0.15, x1: 0.56, y1: 0.45, v: 0.45, first: 0.42 },
    // the strip just left of the towers, under the tree's top leaves (the sky left on a tablet held upright)
    { x0: 0.45, y0: 0.18, x1: 0.565, y1: 0.6, v: 0.3 },
    { x0: 0.775, y0: 0.03, x1: 1, y1: 0.6, v: 0.2 },
  ],
}

export const OVERVIEW = {
  breaker: {
    lines: ['Naturally', 'Elevated', 'Living'],
  },
  welcome: {
    title: 'Welcome',
    sub: ['To life beyond', 'the ordinary with'],
    name: 'Urban Reserve',
    // the Location page's words for the reserve; the Overview keeps to its headings
    body: 'Welcome to an unparalleled forest sanctuary where elegant design, immersive landscapes, and the restorative power of nature redefine the future of urban living.',
    image: img('forest'),
    stats: [
      { value: '40', label: 'Storeys' },
      { value: '2', label: 'Towers' },
      { value: '40+', label: 'Amenities' },
      { value: '4', label: 'Level parking' },
    ],
  },
  // The architect, over two pages as Rustomjee's features give theirs. First his message, as
  // Rustomjee's chairman gives his: his portrait (a still from Aludecor's film on KPA's 36 Turner Road,
  // youtube.com/watch?v=ppW5fppGCF8, at 6:00, which names him "Ar. Kaushik Patel, Principal Architect,
  // KPA, Mumbai") beside his message (sent by the client, Nov 2026) in his own words, signed.
  architect: {
    eyebrow: 'Message from our architect',
    name: 'Ar. Kaushik Patel',
    role: 'Principal Architect · KPA, Mumbai',
    image: img('architect-kp'),
    message: [
      'Urban Reserve is designed around a simple idea: a calm home with the city within reach. Mira Road East is at a changing point, and the project is meant to mark it.',
      'Two staggered towers avoid a single block and read as a pair, which creates a new skyline point for the neighbourhood. Close to the ground, we have tried to create a sense of green, so residents come home from the greens and not from the street.',
      'Height gives views and openness. The greens give calm and a sense of belonging. Together they make a home that feels like a reserve within the city.',
    ],
  },
  // Then his vision, laid out as the landscape vision is: a heading, his line, and two short
  // paragraphs drawn from his message, beside the two towers he describes.
  vision: {
    eyebrow: "Architect's Vision",
    title: ['A Reserve', 'within the City'],
    line: 'A calm home, with the city within reach.',
    body: [
      'Two staggered towers read as a pair rather than a single block: a new point on the skyline of Mira Road East.',
      'Close to the ground, green comes first, so residents come home from the greens and not from the street. Height gives views and openness; the greens give calm and a sense of belonging.',
    ],
    image: img('building-dusk'),
  },
  // the client's landscape vision (Nov 2026), in its own words, cut down to two short paragraphs
  landscape: {
    title: ['Landscape', 'Architecture', 'Vision'],
    line: 'A private sanctuary, rooted in nature.',
    body: [
      'Urban Reserve is envisioned as an exclusive residential retreat where the tranquillity of nature meets the comforts of contemporary living: an immersive green sanctuary within the urban setting.',
      'Green corridors, shaded pathways, open spaces and intimate retreats encourage exploration, relaxation and meaningful social interaction, so greenery becomes an integral part of everyday living.',
    ],
    // the sapling held in open hands, cut out of its white ground so it sits on the green
    image: img('sapling-hands'),
    texture: img('leaf-texture'),
  },
  // the client's landscape brief, The Sculpted Forest (Nov 2026), in its own words, laid out as the
  // landscape vision is: a heading, its line, and two short paragraphs (the second, its two levels)
  forest: {
    title: ['The Sculpted', 'Forest'],
    line: 'Where the city slows, nature comes alive.',
    body: [
      'Rooted in woodland: undulating earth mounds, layered tree canopies, immersive green corridors and organic materiality, a curated wilderness of depth, privacy and discovery.',
      'At ground level, the Deep Forest Base: dense plantations, shaded walkways and secluded retreats. Above it, the Elevated Canopy: recreation, wellness pockets and gathering spaces, the heart of community life.',
    ],
    image: img('r-pavilion'),
  },
  building: {
    title: 'Building View',
    // `edges`: the render's own colours down its left and right edges (sampled at EDGE_STOPS % of its
    // height, sky to street), for the panel either side of the tower to carry them out
    views: [
      {
        id: 'day',
        label: 'Day',
        image: img('tower-day'),
        edges: {
          // (lower down, the street's grey rather than the dark parking wall at that very edge)
          left: ['#4382c1', '#689fcd', '#92bade', '#cfd9e4', '#a39d94', '#8d857a', '#76736f'],
          right: ['#5994cb', '#a1c9ed', '#a8cae7', '#e6e8e9', '#908982', '#b7a99e', '#7a7066'],
        },
      },
      {
        id: 'dusk',
        label: 'Dusk',
        // the project's own aerial render at dusk (sent 16 Nov 2026): no sky, ground to its edges, so
        // it stands on a blurred copy of itself rather than on edge colours
        image: img('building-dusk'),
        surround: 'blur',
      },
    ],
  },
  lobby: {
    title: ['An Elevated', 'Welcome'],
    image: img('lobby'),
  },
}

/*
 * The six homes of a typical floor, as outlined in public/floorplans/tower-b/cutouts/typicalB.svg.
 * `shape` is an outline's points in that file's viewBox, which lines up with both towers' plans (their
 * homes are the same; only the lift core is mirrored). `faces` is the way the home looks out, in
 * degrees clockwise from the top of the plan: from the middle of the floor to the middle of the home.
 */
const FLATS = [
  { id: 1, type: '3 BHK', faces: -33, shape: '677.1 375.5 496 375.5 496 282.8 560.1 282.8 560.1 261.6 512 261.6 512 214.7 415.7 214.7 415.7 297.6 229.9 297.6 229.9 0.3 380.1 0.3 380.1 41.4 430.2 41.4 430.2 89.9 475.6 89.9 475.6 40.6 711.2 40.6 711.2 340.3 677.5 340.3 677.1 375.5' },
  { id: 2, type: '3 BHK', faces: 33, shape: '745.2 375.8 926 375.8 926 281.6 863.4 281.6 863.4 261.6 910.4 261.6 910.4 214.3 1008.2 214.3 1008.2 296.9 1192.9 296.9 1192.9 0.3 1042.2 0.3 1042.2 41 991.7 41 991.7 90.3 946.4 90.3 946.4 40.6 711.6 40.6 711.6 340.3 744.8 340.3 745.2 375.8' },
  { id: 3, type: '2 BHK', faces: 97, shape: '1225.5 378.1 1097.1 506.5 1157 566.5 1113.8 609.6 1075.3 571.1 1027.1 619.3 1006.4 598.6 976.5 628.6 1164.1 816.2 1301.1 679.2 1291.4 669.6 1404.1 556.9' },
  { id: 4, type: '2 BHK', faces: 143, shape: '724.6 878.7 816 787.3 837.8 809.1 892.9 753.9 931.3 792.3 956.5 767 918.5 729 966.7 680.7 945.6 659.6 976.1 629.1 1163.6 816.6 1026 954.3 1016.5 944.8 903.5 1057.8 724.6 878.7' },
  { id: 5, type: '2 BHK', faces: -143, shape: '477.3 660.3 457.1 680.5 504.7 728 466 766.6 491.2 791.8 529.5 753.4 585.1 809 606.6 787.5 697.7 878.5 518.9 1057.4 406.4 945 397 954.5 259.3 816.8 446.4 629.7 477.3 660.3' },
  { id: 6, type: '2 BHK', faces: -97, shape: '446.5 629.9 415.7 599.1 395.1 619.7 347.1 571.7 309.2 609.6 266.3 566.7 326.3 506.7 197.3 377.7 17.9 557.1 130.6 669.8 121.2 679.2 258.8 816.8 446.5 629.9' },
]
const FLATS_VIEWBOX = '0 0 1422.72 1089.36'

// The typical floor of each tower; `aspect` is the plan image's width / height.
export const FLOOR_PLANS = [
  { id: 'towerA', label: 'Tower A', plan: '/floorplans/tower-a/typicalA.webp', aspect: 3000 / 2296, viewBox: FLATS_VIEWBOX, flats: FLATS },
  { id: 'towerB', label: 'Tower B', plan: '/floorplans/tower-b/typicalB.webp', aspect: 3000 / 2297, viewBox: FLATS_VIEWBOX, flats: FLATS },
]

/*
 * Which way the top of the floor plans faces in the tower panoramas, in radians, measured the way the
 * headings (headings.json) line the tower scenes up: a scene's yaw plus its heading. Found on the 20th
 * floor of both towers by matching the plot, as the drone saw it straight below, to its outline in
 * src/world/site.js (good to about 5°). A home's view opens at PLAN_UP + its `faces`.
 */
export const PLAN_UP = (177 * Math.PI) / 180

// The way a home looks out, as the panorama viewer's `facing`.
export const facingOf = ({ faces }) => ({ group: 'towers', angle: PLAN_UP + (faces * Math.PI) / 180 })
// How a home's view is framed where it is shown as a still picture (the comparison of views, and
// "View from this home"): a little below the horizon, and wide.
export const VIEW_LOOK = { pitch: 0.2, fov: 1.35 }

// A home's rooms: [name, size], with sizes as its drawing prints them and the largest of a kind first.
const ROOMS_3BHK = [
  ['Foyer', `3'6" × 3'11"`],
  ['Living & dining', `11'0" × 18'6"\n+ 2'11" × 10'10"`],
  ['Kitchen', `12'6" × 7'7"`],
  ['Bedroom 1', `13'0" × 12'0"`],
  ['Bedroom 2', `12'0" × 10'10"`],
  ['Bedroom 3', `10'0" × 12'0"`],
  ['Toilet 1', `4'5" × 8'0"`],
  ['Toilet 2', `4'5" × 7'7"`],
  ['Toilet 3', `4'5" × 7'3"`],
  ['Powder toilet', `4'1" × 4'1"`],
  ['Balcony 1', `13'5" × 3'5"`],
  ['Balcony 2', `11'0" × 4'3"`],
]
// Flats 3 to 6 differ only in the toilet off the larger bedroom.
const rooms2bhk = (toilet) => [
  ['Foyer', `3'5" × 3'3"`],
  ['Living & dining', `10'0" × 15'6"`],
  ['Kitchen', `7'7" × 9'0"`],
  ['Bedroom 1', `11'6" × 11'0"`],
  ['Bedroom 2', `9'6" × 11'6"`],
  ['Toilet 1', toilet],
  ['Toilet 2', `4'5" × 7'7"`],
  ['Balcony 1', `9'0" × 5'4"`],
  ['Dry yard', `7'7" × 3'3"`],
]
const ROOMS_JODI_12 = [
  ['Foyer', `3'6" × 3'11"`],
  ['Living & dining', `22'6" × 18'6"
+ two of 2'11" × 10'10"`],
  ['Study', `12'6" × 7'7"`],
  ['Kitchen', `16'6" × 7'7"`],
  ['Utility', `4'1" × 4'1"`],
  ['Bedroom 1', `17'11" × 15'9"`],
  ['Bedroom 2', `13'0" × 12'0"`],
  ['Bedroom 3', `12'0" × 10'10"`],
  ['Bedroom 4', `10'0" × 12'0"`],
  ['Bedroom 5', `10'0" × 12'0"`],
  ['Dresser', `12'0" × 7'7"`],
  ['Toilet 1', `4'5" × 8'0"`],
  ['Toilet 2', `4'5" × 7'7"`],
  ['Toilet 3', `4'5" × 7'7"`],
  ['Toilet 4', `4'5" × 7'3"`],
  ['Toilet 5', `4'5" × 7'3"`],
  ['Powder toilet', `4'1" × 4'1"`],
  ['Balcony 1', `22'6" × 4'3"`],
  ['Balcony 2', `13'5" × 3'5"`],
  ['Balcony 3', `13'5" × 3'5"`],
]
const ROOMS_JODI_34 = [
  ['Foyer', `7'5" × 3'3"`],
  ['Living & dining', `20'6" × 15'6"`],
  ['Study', `7'7" × 9'0"`],
  ['Kitchen', `7'7" × 9'0"`],
  ['Bedroom 1', `11'6" × 11'0"`],
  ['Bedroom 2', `11'6" × 11'0"`],
  ['Bedroom 3', `9'6" × 11'6"`],
  ['Bedroom 4', `9'6" × 11'6"`],
  ['Toilet 1', `7'1" × 4'9"`],
  ['Toilet 2', `4'7" × 7'9"`],
  ['Toilet 3', `4'5" × 7'7"`],
  ['Toilet 4', `4'5" × 7'7"`],
  ['Balcony 1', `18'6" × 5'4"`],
  ['Balcony 2', `7'7" × 3'3"`],
  ['Dry yard', `7'7" × 3'3"`],
]
// The rooms in the order a comparison lists them, whichever homes it shows.
export const ROOM_ORDER = [
  'Foyer',
  'Living & dining',
  'Study',
  'Kitchen',
  'Utility',
  ...[1, 2, 3, 4, 5].map((n) => `Bedroom ${n}`),
  'Dresser',
  ...[1, 2, 3, 4, 5].map((n) => `Toilet ${n}`),
  'Powder toilet',
  ...[1, 2, 3].map((n) => `Balcony ${n}`),
  'Dry yard',
]

/*
 * The homes that can be compared: each flat, and each jodi, two flats joined into one home. The plans
 * are in public/floorplans/units/ and hold for both towers, whose homes are the same. Flat 2's comes
 * off Tower B's typical floor, as its own drawing was never supplied (tower-b/flat-2.png is a layout
 * marked 3 that isn't on the typical floor). `flats` are the ids in FLATS a home takes up, and a jodi
 * looks out midway between its two.
 */
const unitPlan = (n) => `/floorplans/units/${n}.webp`
export const UNITS = [
  { id: '1', label: 'Flat 1', type: '3 BHK', flats: [1], plan: unitPlan('flat-1'), aspect: 2756 / 2138, rooms: ROOMS_3BHK },
  { id: '2', label: 'Flat 2', type: '3 BHK', flats: [2], plan: unitPlan('flat-2'), aspect: 2286 / 1772, rooms: ROOMS_3BHK },
  { id: '3', label: 'Flat 3', type: '2 BHK', flats: [3], plan: unitPlan('flat-3'), aspect: 2756 / 2156, rooms: rooms2bhk(`4'7" × 7'9"`) },
  { id: '4', label: 'Flat 4', type: '2 BHK', flats: [4], plan: unitPlan('flat-4'), aspect: 2756 / 2156, rooms: rooms2bhk(`7'1" × 4'9"`) },
  { id: '5', label: 'Flat 5', type: '2 BHK', flats: [5], plan: unitPlan('flat-5'), aspect: 2756 / 2156, rooms: rooms2bhk(`7'1" × 4'9"`) },
  { id: '6', label: 'Flat 6', type: '2 BHK', flats: [6], plan: unitPlan('flat-6'), aspect: 2756 / 2156, rooms: rooms2bhk(`4'7" × 7'9"`) },
  { id: '1-2', label: 'Jodi 1 + 2', type: 'Jodi', about: '5 bedrooms + study', flats: [1, 2], plan: unitPlan('jodi-1-2'), aspect: 3604 / 1507, rooms: ROOMS_JODI_12 },
  { id: '3-4', label: 'Jodi 3 + 4', type: 'Jodi', about: '4 bedrooms + study', flats: [3, 4], plan: unitPlan('jodi-3-4'), aspect: 3604 / 1521, rooms: ROOMS_JODI_34 },
  { id: '5-6', label: 'Jodi 5 + 6', type: 'Jodi', about: '4 bedrooms + study', flats: [5, 6], plan: unitPlan('jodi-5-6'), aspect: 3604 / 1521, rooms: ROOMS_JODI_34 },
].map((u) => ({
  about: u.type,
  ...u,
  short: u.id.replace('-', '+'),
  faces: u.flats.reduce((sum, id) => sum + FLATS.find((f) => f.id === id).faces, 0) / u.flats.length,
}))

/*
 * What the unit finder sorts the homes by, all read off their rooms: the bedrooms (a jodi adds a
 * study), the rooms some homes have and others don't, and the flats of the floor a home takes up.
 */
export const bedroomsOf = (unit) => unit.rooms.filter(([name]) => name.startsWith('Bedroom')).length
export const hasRoom = (unit, room) => unit.rooms.some(([name]) => name === room)
export const CONFIGS = [2, 3, 4, 5].map((n) => ({ id: n, label: `${n} BHK${n > 3 ? ' + study' : ''}` }))
export const configOf = (unit) => CONFIGS.find((c) => c.id === bedroomsOf(unit))
export const FEATURES = ['Study', 'Powder toilet', 'Dresser', 'Utility', 'Dry yard'].map((room) => ({ id: room, label: room }))
// "3 bedrooms · 3 toilets + powder · 2 balconies"
export function roomsLine(unit) {
  const count = (prefix) => unit.rooms.filter(([name]) => name.startsWith(prefix)).length
  const many = (n, one, more) => `${n} ${n === 1 ? one : more}`
  const toilets = many(count('Toilet'), 'toilet', 'toilets') + (hasRoom(unit, 'Powder toilet') ? ' + powder' : '')
  return [many(bedroomsOf(unit), 'bedroom', 'bedrooms'), toilets, many(count('Balcony'), 'balcony', 'balconies')].join(' · ')
}

/*
 * Amenities runs as the Rivali Park app's does: one whole render first, with a point on each level
 * (the towers' podium, the forest garden at their foot); a level opens its plan with a point on each
 * place there is a render of; a point opens the renders, one to the screen. `at` is [left, top] in %
 * of the picture.
 */
export const AMENITIES = {
  title: 'Amenities',
}

export const AMENITY_LEVELS = [
  {
    id: 'ground',
    label: 'Ground Level',
    // the client's landscape brief names the two levels (Nov 2026); its words, a sentence each
    heading: 'The Deep Forest Base',
    body: 'An immersive woodland experience through dense plantations, shaded walkways, sensory gardens and secluded retreats, a natural buffer from the city.',
    plan: img('plan-ground'),
    aspect: 1650 / 1222,
    // the landscape renders; `at` is where each stands on the plan, [left, top] in % of the picture,
    // set on the end of its own leader line there
    photos: [
      { image: img('r-pavilion'), label: 'Canopy treehouse pavilion', at: [84.1, 25.1] },
      { image: img('r-art-lawn'), label: 'Understory art trail', at: [76.6, 31.1] },
      { image: img('r-valley-deck'), label: 'Valley walkway', at: [30.4, 70.3] },
      { image: img('r-atrium'), label: 'Biophilic atrium', at: [42.9, 45] },
      // a render with no place marked on the plan comes in the run of pictures only
      { image: img('r-amphitheatre'), label: 'Forest amphitheatre' },
      // the renders sent on 17 Nov 2026 (without watermarks)
      { image: img('r-gate'), label: 'Entrance gate & water feature' },
    ],
    list: [
      'Jogging & walking tracks',
      'Community foraging orchard',
      'Periphery greens',
      'Pet wilderness run',
      'Barefoot sensory trail',
      'Canopy treehouse pavilion',
      'Meditation grotto',
      'Understory art trail',
      'Fern & mist gardens',
      'Valley walkway',
      'Water features & arrival court',
      'Biophilic atrium',
    ],
  },
  {
    id: 'edeck',
    label: 'Podium Level',
    heading: 'The Elevated Canopy',
    body: 'A lighter, more open interpretation of the forest: recreational spaces, canopy-lined pathways, wellness pockets and social gathering areas.',
    plan: img('plan-edeck'),
    aspect: 1618 / 1173,
    photos: [
      { image: img('r-pool'), label: 'Infinity pool & deck', at: [48.1, 23.7] },
      { image: img('r-gym'), label: 'Gymnasium', at: [29.1, 24.8] },
      { image: img('r-games'), label: 'Open game area', at: [63, 48.9] },
      { image: img('r-lounge'), label: 'Open lounge area', at: [74.9, 44] },
      { image: img('r-steam'), label: 'Steam' },
      { image: img('r-pool-deck'), label: 'Pool deck' },
      { image: img('r-kids'), label: 'Children’s play area' },
      { image: img('r-court'), label: 'Pickle-ball court' },
      { image: img('r-podium-view'), label: 'The podium from a home' },
    ],
    list: [
      'Gymnasium',
      'Infinity pool & deck',
      'Banquet space',
      'Theatre',
      'Salon',
      'Open yoga & meditation area',
      "Toddlers' play area",
      'Open café & entrance lobby',
      'Open game area',
      'Open lounge area',
      'Podium landscape',
    ],
  },
  {
    id: 'common',
    label: 'Common',
    heading: 'Every Pursuit, One Canopy',
    body: 'From sport and leisure to health and rejuvenation, the common amenities are curated for every age and every pace of life.',
    photos: [
      { image: img('r-amphitheatre'), label: 'Forest amphitheatre' },
      { image: img('r-pool'), label: 'Swimming pool' },
      { image: img('r-steam'), label: 'Steam' },
      { image: img('r-games'), label: 'Games room' },
      { image: img('r-pool-deck'), label: 'Swimming pool & kids’ pool' },
      { image: img('r-kids'), label: 'Children’s play area' },
      { image: img('r-court'), label: 'Pickle-ball court' },
    ],
    groups: [
      { title: 'Sports & Leisure', items: ['Pickle-ball court', 'Cycling track', 'Pool tables', 'Table tennis', 'Badminton court', 'Skating track', 'Board games', 'Golf simulator'] },
      { title: 'Health & Wellness', items: ['Meditation & yoga zone', 'Walking & jogging track', 'Gymnasium', 'Jacuzzi', 'Steam'] },
      {
        title: 'Entertainment & Rejuvenation',
        items: ['Swimming pool & kids’ pool', 'Banquet hall', 'Mini theatre', 'Forest amphitheatre', 'Games room', 'Children’s play area', 'Party lawn', 'Tea corner', 'Toddlers’ play zone', 'Cafeteria', 'Business centre', 'Maze garden'],
      },
    ],
  },
]

// The Amenities slideshow: every render once, each with its level, the ones sent on 17 Nov 2026
// first (the gate, the pool deck, the children's play area, the court, the podium from a home)
const NEWEST = ['r-gate', 'r-pool-deck', 'r-kids', 'r-court', 'r-podium-view'].map(img)
export const AMENITY_RENDERS = (() => {
  const seen = new Set()
  const all = AMENITY_LEVELS.filter((l) => l.plan)
    .flatMap((l) => l.photos.map((p) => ({ image: p.image, label: p.label, level: l.id, where: l.label, heading: l.heading })))
    .filter((p) => !seen.has(p.image) && seen.add(p.image))
  return [...NEWEST.map((image) => all.find((p) => p.image === image)), ...all.filter((p) => !NEWEST.includes(p.image))]
})()

/*
 * Map positions for the Location 3D map, pasted from Google Maps (checked 5 Oct 2026).
 * To move a pin: right-click the spot on Google Maps, click the coordinates at the top of the menu
 * to copy them, and paste them into gmaps('…'). Google gives "lat, lng"; the map wants [lng, lat],
 * so gmaps() flips them.
 * After moving SITE or any place, re-run `npm run routes` to redraw the roads between them.
 */
const gmaps = (latLng) => latLng.split(',').map(Number).reverse()

// SITE is the project's own Google Maps pin (Urban Reserve, Poonam Gardens, Chandan Shanti, Mira Road
// East), sent by the team on 16 Nov 2026.
// `heading` turns the ground plan (degrees clockwise) to line it up with the real plot.
export const SITE = { name: 'Urban Reserve', at: gmaps('19.2872662, 72.8732289'), heading: -8 }

export const LOCATION = {
  heading: 'Never far from home',
  body: 'Surrounded by everyday conveniences, with easy access to schools, hospitals, malls, dining and entertainment, and seamless connectivity to the city through the Western Express Highway.',
  map: img('location-map'),
  rings: [
    // LR Tiwari Educational Campus
    { mins: 5, places: [{ name: 'Rahul International School', type: 'school', at: gmaps('19.2989303, 72.8778045') }] },
    {
      mins: 10,
      places: [
        // the brochure's "Lifunga Hospital": no such hospital; Thunga Hospital, Mira Bhayander Link Road, is the likely one
        { name: 'Thunga Hospital', type: 'hospital', at: gmaps('19.2923134, 72.8623979') },
        // behind GCC Hotel & Club
        { name: 'GCC International School', type: 'school', at: gmaps('19.2835854, 72.8786167') },
        // the mall inside JP North, Vinay Nagar Road (Google has no separate pin for the mall)
        { name: 'J.P. Mall', type: 'mall', at: gmaps('19.2823669, 72.8872654') },
      ],
    },
    {
      mins: 15,
      places: [
        // Kashimira Junction
        { name: 'Western Express Highway', type: 'road', at: gmaps('19.27266, 72.88303') },
        // the brochure's "Manus Mall"
        { name: 'Maxus Mall', type: 'mall', at: gmaps('19.2960705, 72.8487058') },
        // the brochure's "RBK / Kandivka": RBK School, now Kanakia International School, Beverly Park
        { name: 'RBK / Kanakia Intl. School', type: 'school', at: gmaps('19.2908651, 72.8717633') },
        { name: 'GCC Club', type: 'club', at: gmaps('19.28325, 72.8785271') },
        { name: 'Wockhardt Hospital', type: 'hospital', at: gmaps('19.2842599, 72.8621903') },
      ],
    },
  ],
}

export const SPECS = [
  {
    title: 'At a Glance',
    items: [
      '2BHK & 3BHK-plus deck apartments',
      'Exquisite architecture and design',
      'Vehicle-free recreational space',
      'Mesmerising city vistas',
      '40,000 to 50,000 sq ft of amenities',
      '40+ amenities',
      'Four-level parking facility',
    ],
  },
  {
    title: 'Safe & Secure Environs',
    items: ['Video door-phone with intercom', 'Power back-up for lifts & common areas', 'CCTV surveillance', '24×7 professional security'],
  },
  {
    title: 'Eco-Friendly Systems',
    items: ['Sewage treatment plant', 'Rainwater harvesting', 'Vermiculture pit', 'Solar P.V. panels', 'Organic waste management'],
  },
  { title: 'Automated Homes', items: ['Concealed conduit with PVC-insulated copper wiring'] },
  { title: 'Exquisite Amenities', items: ['Six high-speed elevators per tower', 'EV charging stations'] },
]

export const SPEC_IMAGE = img('tower-dusk')

// Specifications as four pages, the brochure's groups in its order, each with a picture: `groups`
// are SPECS' titles; `fit` places the picture in its frame.
const spec = (title) => SPECS.find((g) => g.title === title)
export const SPEC_PAGES = [
  { id: 'glance', label: 'At a Glance', image: img('building-day'), fit: 'object-[66%_50%]', groups: [spec('At a Glance')] },
  { id: 'safe', label: 'Safe & Secure', image: img('lobby'), fit: 'object-[50%_45%]', groups: [spec('Safe & Secure Environs')] },
  { id: 'eco', label: 'Eco-Friendly', image: img('landscape'), fit: 'object-[50%_60%]', groups: [spec('Eco-Friendly Systems')] },
  { id: 'homes', label: 'Homes & Amenities', image: img('r-atrium'), fit: 'object-[45%_50%]', groups: [spec('Automated Homes'), spec('Exquisite Amenities')] },
]

/*
 * The 360° views from each tower, floor by floor. The data are the Marzipano tool's exports and
 * their tiles sit in public/pano/<tower>/tiles/<scene id>/. A scene's name ("DJI_0016_20th
 * Floor_68.95M") gives the floor and its elevation; floors run from the top down, and `start` is
 * the export's first scene.
 */
const floorOf = (tower) => (scene) => {
  const [, name = scene.name, metres] = scene.name.match(/^DJI_\d+_(.+)_([\d.]+)M$/i) ?? []
  return {
    key: `${tower}/${scene.id}`,
    label: /terrace/i.test(name) ? 'Terrace' : name,
    height: Number(metres) || 0,
    tiles: `/pano/${tower}/tiles/${scene.id}`,
    data: scene,
  }
}
export const TOWERS = [
  ['towerA', 'Tower A', TOWER_A],
  ['towerB', 'Tower B', TOWER_B],
].map(([id, label, data]) => ({
  id,
  label,
  settings: data.settings,
  start: floorOf(id)(data.scenes[0]),
  floors: data.scenes.map(floorOf(id)).sort((a, b) => b.height - a.height),
}))

// The one tower whose homes are on offer (the client sells Tower B alone, Nov 2026): Residences, the
// unit finder and its comparisons keep to it. Tower A stays in the pictures and the Views section.
export const ON_SALE = 'towerB'

// The tower and floor a query asks for (?tower=towerB&floor=23, as a home's view links to them). A
// floor without a view of its own opens on the nearest one with a view, and with no floor asked for
// it is the first tower's starting floor.
export function towerFloor(search) {
  const q = new URLSearchParams(search)
  const tower = TOWERS.find((t) => t.id === q.get('tower')) ?? TOWERS[0]
  const n = Number(q.get('floor'))
  return { tower, floor: tower.floors.find((f) => parseInt(f.label) === n) ?? (n > 0 ? viewFloor(tower.id, n) : tower.start) }
}

// The floors a tower has views from, lowest first (the E-Deck and the terrace aren't typical floors).
export const floorsOf = (towerId) =>
  TOWERS.find((t) => t.id === towerId)
    .floors.filter((f) => /^\d/.test(f.label))
    .map((f) => ({ ...f, id: parseInt(f.label), short: String(parseInt(f.label)) }))
    .reverse()

// A comparison sets two or three homes side by side, all in one tower (never one tower against the
// other). The first one opens on three, one of each kind: Flat 1 (3 BHK), Flat 3 (2 BHK) and Jodi 5 + 6.
export const MOST_COMPARED = 3
const FIRST_COMPARED = ['towerB.1', 'towerB.3', 'towerB.5-6']

// The homes a comparison shows, as an address holds them (?compare=towerA.1.20,towerB.3.20, tower,
// home and floor of each, with &views once it is on their views), or null when it isn't a comparison.
// What is missing or unknown is taken from the first comparison's home in its place, and a single home
// is set against its second. Every home is in the tower on offer.
export function comparison(search) {
  const q = new URLSearchParams(search)
  if (!q.has('compare')) return null
  const asked = q.get('compare').split(',').slice(0, MOST_COMPARED)
  const sides = asked.join('') ? asked : FIRST_COMPARED
  const tower = TOWERS.find((t) => t.id === ON_SALE)
  const floors = floorsOf(tower.id)
  const homes = Array.from({ length: Math.max(2, sides.length) }, (_, i) => {
    const [, unitId, floorNo] = (sides[i] ?? '').split('.')
    const firstUnit = FIRST_COMPARED[i].split('.')[1]
    return {
      tower,
      unit: UNITS.find((u) => u.id === unitId) ?? UNITS.find((u) => u.id === firstUnit),
      floor: floors.find((f) => f.id === Number(floorNo)) ?? floors.find((f) => f.key === tower.start.key) ?? floors[0],
    }
  })
  return { homes, views: q.has('views') }
}

// The unit finder's address (?units): Unit Comparison's first step, before the homes are set side by side.
export const isFinder = (search) => new URLSearchParams(search).has('units')

export const compareQuery = (homes, views = false) => `?compare=${homes.map((h) => `${h.tower.id}.${h.unit.id}.${h.floor.id}`).join(',')}${views ? '&views' : ''}`

// The floor nearest the nth that has a 360° view (every fifth one does), for a home's view and a
// comparison of views.
export const viewFloor = (towerId, n) => floorsOf(towerId).reduce((a, b) => (Math.abs(b.id - n) < Math.abs(a.id - n) ? b : a))

// "23rd Floor", as the views name theirs
export function floorName(n) {
  const teen = n % 100 >= 11 && n % 100 <= 13
  return `${n}${teen ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')} Floor`
}

// The home a single flat makes, with its plan and rooms.
export const unitOf = (flat) => UNITS.find((u) => u.id === String(flat.id))

/*
 * The 360° view from above the middle of the site at three times of day, shot from one spot and
 * lined up alike. Tiles in public/pano/TopCenter/tiles/<scene id>/; a scene's name
 * ("Evening_TOPCenter") gives its time, the times run through the day, and `start` is the export's
 * first scene. `thumb` is the face of the cube its starting view looks towards, whose first level
 * is a single tile.
 */
const DAY = ['day', 'evening', 'night']
const SIDES = ['f', 'r', 'b', 'l']
const timeOf = (scene) => {
  const tiles = `/pano/TopCenter/tiles/${scene.id}`
  const side = SIDES[(((Math.round(scene.initialViewParameters.yaw / (Math.PI / 2)) % 4) + 4) % 4)]
  return { key: `TopCenter/${scene.id}`, label: scene.name.split('_')[0], tiles, thumb: `${tiles}/1/${side}/0/0.jpg`, data: scene }
}
const hour = (t) => DAY.indexOf(t.label.toLowerCase())
export const TOP_VIEW = {
  settings: TOP_CENTER.settings,
  start: timeOf(TOP_CENTER.scenes[0]),
  times: TOP_CENTER.scenes.map(timeOf).sort((a, b) => hour(a) - hour(b)),
}
