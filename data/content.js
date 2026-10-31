import TOWER_A from './TowerA_data.js'
import TOWER_B from './TowerB_data.js'
import TOP_CENTER from './TopCenterData.js'

const img = (n) => `/assets/img/${n}.webp`

export const BRAND = {
  name: 'Urban Reserve',
  tagline: 'Naturally Elevated Living',
  phone: '+91 00000 00000',
  whatsapp: '910000000000',
  email: 'info@urbanreserve.com',
  web: 'www.urbanreserve.com',
}

export const SECTIONS = [
  { id: 'overview', label: 'Overview', blurb: 'A private forest sanctuary, grown into the city.', preview: img('forest') },
  { id: 'residences', label: 'Residences', blurb: '2 & 3 BHK homes with deep, planted balconies.', preview: img('home-bedroom') },
  { id: 'floorplans', label: 'Floor Plans', blurb: 'Explore the layouts of your future home.', preview: img('lobby') },
  { id: 'amenities', label: 'Amenities', blurb: '40+ amenities across forest trails and the E-Deck.', preview: img('ca-pool') },
  { id: 'views', label: 'Views', blurb: 'Look around the reserve in immersive 360°.', preview: img('tower-dusk') },
  { id: 'location', label: 'Location', blurb: 'Schools, hospitals and malls within minutes.', preview: img('location-map') },
  { id: 'specifications', label: 'Specifications', blurb: 'Secure, automated and quietly sustainable.', preview: img('tower-day') },
]

export const LANDING = {
  eyebrow: 'A forest sanctuary in the city',
  image: img('forest-canopy'),
}

export const OVERVIEW = {
  breaker: {
    lines: ['Naturally', 'Elevated', 'Living'],
    body: 'Where elegant design, immersive landscapes and the restorative power of nature redefine the future of urban living.',
  },
  welcome: {
    title: 'Welcome',
    sub: ['To life beyond', 'the ordinary with'],
    name: 'Urban Reserve',
    body: 'Welcome to an unparalleled forest sanctuary where elegant design, immersive landscapes, and the restorative power of nature redefine the future of urban living.',
    image: img('forest'),
    stats: [
      { value: '40+', label: 'Amenities' },
      { value: '4', label: 'Level parking' },
      { value: '6', label: 'Lifts per tower' },
    ],
  },
  architect: {
    title: ['Architect', 'Vision'],
    body: 'Inspired by a forest, the landscape grows naturally through earth mounds, layered planting, and greenery creating a curated wild environment where nature and architecture grow together.',
    image: img('plant'),
  },
  landscape: {
    title: ['Landscape', 'Architecture', 'Vision'],
    body: 'To elevate urban living by cultivating an immersive, private woodland sanctuary that seamlessly blends refined design with a thriving, deeply restorative forest.',
    texture: img('leaf-texture'),
  },
  building: {
    title: 'Building View',
    body: [
      'To create a living environment where architecture and nature exist as one where built forms blend seamlessly with the landscape, creating spaces that feel open, calm, connected, and timeless.',
      'More than buildings surrounded by greenery, Urban Reserve is conceived as an environment where architecture becomes part of the landscape and nature becomes part of everyday life.',
    ],
    views: [
      { id: 'day', label: 'Day', image: img('tower-day') },
      { id: 'dusk', label: 'Dusk', image: img('tower-dusk') },
    ],
  },
  lobby: {
    title: ['An Elevated', 'Welcome'],
    body: 'A refined arrival where thoughtful design, natural light and understated luxury come together setting the tone for life at Urban Reserve.',
    image: img('lobby'),
  },
}

// rooms: [name, size, u, v], where u/v place the room's centre on the plan image (0..1)
export const RESIDENCES = [
  {
    id: '2bhk',
    label: '2 BHK',
    title: '2 BHK Flat Layout',
    plan: img('plan-2bhk'),
    aspect: 1613 / 1340,
    key: img('key-2bhk'),
    rooms: [
      ['Drawing room', "11'0\" × 14'0\"", 0.714, 0.155],
      ['Dining', "10'0\" × 10'0\"", 0.643, 0.447],
      ['Kitchen', "10'0\" × 8'0\"", 0.85, 0.482],
      ['Bedroom 01', "11'0\" × 13'0\"", 0.4, 0.774],
      ['Bedroom 02', "10'6\" × 13'0\"", 0.371, 0.292],
      ['Dress', "4'7\" × 6'0\"", 0.593, 0.868],
      ['Balcony', "6'0\" wide", 0.114, 0.533],
    ],
  },
  {
    id: '3bhk',
    label: '3 BHK',
    title: '3 BHK Flat Layout',
    plan: img('plan-3bhk'),
    aspect: 1613 / 1357,
    key: img('key-3bhk'),
    rooms: [
      ['Drawing room', "11'0\" × 18'0\"", 0.714, 0.17],
      ['Dining', "10'0\" × 10'0\"", 0.65, 0.475],
      ['Kitchen', "10'0\" × 8'0\"", 0.857, 0.51],
      ['Bedroom 01', "11'0\" × 13'0\"", 0.4, 0.764],
      ['Bedroom 02', "10'0\" × 13'0\"", 0.371, 0.297],
      ['Dress', "4'7\" × 6'0\"", 0.6, 0.874],
      ['Balcony', "6'0\" wide", 0.114, 0.526],
    ],
  },
  {
    id: '3bhk-jodi',
    label: '3 BHK Jodi',
    title: '3 BHK Jodi Flat Layout',
    plan: img('plan-3bhk-jodi'),
    aspect: 1613 / 1340,
    key: img('key-3bhk-jodi'),
    rooms: [
      ['Drawing room', "11'0\" × 14'0\"", 0.714, 0.172],
      ['Dining', "10'0\" × 18'0\"", 0.643, 0.482],
      ['Kitchen', "10'0\" × 8'0\"", 0.857, 0.516],
      ['Bedroom 01', "11'0\" × 13'0\"", 0.4, 0.774],
      ['Bedroom 02', "10'6\" × 13'0\"", 0.371, 0.301],
      ['Dress', "4'7\" × 6'0\"", 0.6, 0.886],
      ['Balcony', "6'0\" wide", 0.121, 0.533],
    ],
  },
]

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

export const INTERIORS = [
  { image: img('home-bedroom'), label: 'Master bedroom' },
  { image: img('home-living'), label: 'Living & dining' },
  { image: img('home-kitchen'), label: 'Kitchen' },
]

export const AMENITY_LEVELS = [
  {
    id: 'ground',
    label: 'Ground Level',
    heading: 'Beyond the Everyday',
    tagline: 'Nature · Community · Wellbeing',
    body: 'An active lifestyle zone where landscaped trails and open spaces connect wellness, recreation, leisure and community — a different reason to move, pause, explore or connect.',
    plan: img('plan-ground'),
    photos: [
      { image: img('am-jog'), label: 'Jogging track' },
      { image: img('am-yoga'), label: 'Meditation grotto' },
      { image: img('am-kids'), label: 'Children’s play' },
      { image: img('am-family'), label: 'Periphery greens' },
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
    label: 'E-Deck',
    heading: 'A Place for Every Moment',
    tagline: 'Move · Connect · Relax',
    body: 'A vibrant lifestyle level where wellness, recreation, entertainment and social experiences come together — for residents of all ages to stay active, celebrate, play or simply unwind.',
    plan: img('plan-edeck'),
    photos: [
      { image: img('ed-gym'), label: 'Gymnasium' },
      { image: img('ed-spa'), label: 'Spa & salon' },
      { image: img('ed-kids'), label: 'Podium landscape' },
      { image: img('ed-dine'), label: 'Banquet & café' },
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
    tagline: 'Play · Restore · Gather',
    body: 'From sport and leisure to health and rejuvenation, the common amenities are curated for every age and every pace of life.',
    photos: [
      { image: img('ca-pool'), label: 'Swimming pool' },
      { image: img('ca-tennis'), label: 'Pickle-ball court' },
      { image: img('ca-cycle'), label: 'Cycling track' },
      { image: img('ca-dog'), label: 'Pet-friendly lawns' },
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

/*
 * Map positions for the Location 3D map, pasted from Google Maps (checked 5 Oct 2026).
 * To move a pin: right-click the spot on Google Maps, click the coordinates at the top of the menu
 * to copy them, and paste them into gmaps('…'). Google gives "lat, lng"; the map wants [lng, lat],
 * so gmaps() flips them.
 * After moving SITE or any place, re-run `npm run routes` to redraw the roads between them.
 */
const gmaps = (latLng) => latLng.split(',').map(Number).reverse()

// SITE is still an approximate plot centre: replace it with the plot's own pin.
// `heading` turns the ground plan (degrees clockwise) to line it up with the real plot.
export const SITE = { name: 'Urban Reserve', at: gmaps('19.2752, 72.8712'), heading: -8 }

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
      '40,000 – 50,000 sq ft of amenities',
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

// The tower and floor a query asks for (?tower=towerB&floor=20, as a floor plan's home links to
// them), falling back to the first tower's starting floor.
export function towerFloor(search) {
  const q = new URLSearchParams(search)
  const tower = TOWERS.find((t) => t.id === q.get('tower')) ?? TOWERS[0]
  return { tower, floor: tower.floors.find((f) => parseInt(f.label) === Number(q.get('floor'))) ?? tower.start }
}

// The floors a tower has views from, lowest first (the E-Deck and the terrace aren't typical floors).
export const floorsOf = (towerId) =>
  TOWERS.find((t) => t.id === towerId)
    .floors.filter((f) => /^\d/.test(f.label))
    .map((f) => ({ ...f, id: parseInt(f.label), short: String(parseInt(f.label)) }))
    .reverse()

// The two homes a comparison shows, as an address holds them (?compare=towerA.1.20,towerB.3.20, tower,
// home and floor of each, with &views once it is on their views), or null when it isn't a comparison.
export function comparison(search) {
  const q = new URLSearchParams(search)
  if (!q.has('compare')) return null
  const sides = q.get('compare').split(',')
  const homes = [0, 1].map((i) => {
    const [towerId, unitId, floorNo] = (sides[i] ?? '').split('.')
    const tower = TOWERS.find((t) => t.id === towerId) ?? TOWERS[i]
    const floors = floorsOf(tower.id)
    return {
      tower,
      unit: UNITS.find((u) => u.id === unitId) ?? UNITS[i * 2],
      floor: floors.find((f) => f.id === Number(floorNo)) ?? floors.find((f) => f.key === tower.start.key) ?? floors[0],
    }
  })
  return { homes, views: q.has('views') }
}

export const compareQuery = (homes, views = false) => `?compare=${homes.map((h) => `${h.tower.id}.${h.unit.id}.${h.floor.id}`).join(',')}${views ? '&views' : ''}`

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

// Images decoded behind the curtain before each screen is revealed.
const I = (...names) => names.map(img)
export const ROUTE_IMAGES = {
  landing: [LANDING.image],
  menu: SECTIONS.map((s) => s.preview),
  overview: [...I('forest', 'plant', 'leaf-texture', 'tower-day', 'tower-dusk', 'lobby', 'sun-felt')],
  residences: [RESIDENCES[0].plan, RESIDENCES[0].key],
  floorplans: (search) => {
    const compared = comparison(search)
    if (!compared) return FLOOR_PLANS.map((p) => p.plan)
    return compared.homes.map((h) => (compared.views ? `${h.floor.tiles}/preview.jpg` : h.unit.plan))
  },
  amenities: [AMENITY_LEVELS[0].plan, ...AMENITY_LEVELS[0].photos.map((p) => p.image)],
  views: (search) => [`${towerFloor(search).floor.tiles}/preview.jpg`],
  location: [LOCATION.map],
  specifications: [SPEC_IMAGE],
}
