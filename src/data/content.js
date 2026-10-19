import TOWER_A from './TowerA_data.js'
import TOWER_B from './TowerB_data.js'

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
  { id: 'amenities', label: 'Amenities', blurb: '40+ amenities across forest trails and the E-Deck.', preview: img('ca-pool') },
  { id: 'views', label: 'Views', blurb: 'Look around the reserve in immersive 360°.', preview: img('tower-dusk') },
  { id: 'location', label: 'Location', blurb: 'Schools, hospitals and malls within minutes.', preview: img('location-map') },
  { id: 'specifications', label: 'Specifications', blurb: 'Secure, automated and quietly sustainable.', preview: img('tower-day') },
]

export const ENQUIRE_PREVIEW = img('lobby')

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

export const RESIDENCES = [
  {
    id: '2bhk',
    label: '2 BHK',
    title: '2 BHK Flat Layout',
    plan: img('plan-2bhk'),
    key: img('key-2bhk'),
    rooms: [
      ['Drawing room', "11'0\" × 14'0\""],
      ['Dining', "10'0\" × 10'0\""],
      ['Kitchen', "10'0\" × 8'0\""],
      ['Bedroom 01', "11'0\" × 13'0\""],
      ['Bedroom 02', "10'6\" × 13'0\""],
      ['Dress', "4'7\" × 6'0\""],
      ['Balcony', "6'0\" wide"],
    ],
  },
  {
    id: '3bhk',
    label: '3 BHK',
    title: '3 BHK Flat Layout',
    plan: img('plan-3bhk'),
    key: img('key-3bhk'),
    rooms: [
      ['Drawing room', "11'0\" × 18'0\""],
      ['Dining', "10'0\" × 10'0\""],
      ['Kitchen', "10'0\" × 8'0\""],
      ['Bedroom 01', "11'0\" × 13'0\""],
      ['Bedroom 02', "10'0\" × 13'0\""],
      ['Dress', "4'7\" × 6'0\""],
      ['Balcony', "6'0\" wide"],
    ],
  },
  {
    id: '3bhk-jodi',
    label: '3 BHK Jodi',
    title: '3 BHK Jodi Flat Layout',
    plan: img('plan-3bhk-jodi'),
    key: img('key-3bhk-jodi'),
    rooms: [
      ['Drawing room', "11'0\" × 14'0\""],
      ['Dining', "10'0\" × 18'0\""],
      ['Kitchen', "10'0\" × 8'0\""],
      ['Bedroom 01', "11'0\" × 13'0\""],
      ['Bedroom 02', "10'6\" × 13'0\""],
      ['Dress', "4'7\" × 6'0\""],
      ['Balcony', "6'0\" wide"],
    ],
  },
]

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
 * Map positions for the Residences 3D map, pasted from Google Maps (checked 5 Oct 2026).
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

// Images decoded behind the curtain before each screen is revealed.
const I = (...names) => names.map(img)
export const ROUTE_IMAGES = {
  landing: [LANDING.image],
  menu: [...SECTIONS.map((s) => s.preview), ENQUIRE_PREVIEW],
  overview: [...I('forest', 'plant', 'leaf-texture', 'tower-day', 'tower-dusk', 'lobby', 'sun-felt')],
  residences: [RESIDENCES[0].plan, RESIDENCES[0].key],
  amenities: [AMENITY_LEVELS[0].plan, ...AMENITY_LEVELS[0].photos.map((p) => p.image)],
  views: [`${TOWERS[0].start.tiles}/preview.jpg`],
  location: [LOCATION.map],
  specifications: [SPEC_IMAGE],
  enquire: [],
}
