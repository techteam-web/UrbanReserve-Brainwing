const img = (n) => `/assets/img/${n}.webp`

export const BRAND = {
  name: 'Urban Reserve',
  tagline: 'Naturally Elevated Living',
  phone: '+91 00000 00000',
  whatsapp: '910000000000',
  email: 'info@urbanreserve.com',
  web: 'www.urbanreserve.com',
}

// `short` labels the dock, `meta` and `blurb` label the home tiles
export const SECTIONS = [
  { id: 'overview', label: 'Overview', short: 'Overview', icon: 'leaf', meta: 'The story', blurb: 'A private forest sanctuary, grown into the city.', preview: img('tower-dusk') },
  { id: 'residences', label: 'Residences', short: 'Homes', icon: 'plan', meta: '3 layouts', blurb: 'Explore every plan, room by room.', preview: img('home-bedroom') },
  { id: 'amenities', label: 'Amenities', short: 'Amenities', icon: 'spark', meta: '40+ amenities', blurb: 'Forest trails, the E-Deck and more.', preview: img('ca-pool') },
  { id: 'views', label: 'Views', short: '360°', icon: 'orbit', meta: '360° tours', blurb: 'Look around the reserve.', preview: img('forest') },
  { id: 'location', label: 'Location', short: 'Location', icon: 'pin', meta: '9 landmarks', blurb: 'Everything within 15 minutes.', preview: img('location-map') },
  { id: 'specifications', label: 'Specifications', short: 'Specs', card: 'Specs', icon: 'shield', meta: '5 systems', blurb: 'Secure, automated, sustainable.', preview: img('tower-day') },
]

export const ENQUIRE = { id: 'enquire', label: 'Enquire', short: 'Enquire', icon: 'chat', meta: 'Site visit', blurb: 'Plans, pricing and a private site visit.', preview: img('lobby') }

export const HOME = {
  lede: 'A private forest sanctuary, grown into the heart of the city.',
  hero: img('renders/towers-sunset'),
  stats: [
    { value: '40+', label: 'Amenities' },
    { value: '2 & 3', label: 'BHK homes' },
    { value: '6', label: 'Lifts per tower' },
  ],
}

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

export const INTERIORS = [
  { image: img('home-bedroom'), label: 'Master bedroom' },
  { image: img('home-living'), label: 'Living & dining' },
  { image: img('home-kitchen'), label: 'Kitchen' },
]

// spots: { name, at: [u, v] on the plan, photo? } — `at` points at the callout already drawn on the plan
export const AMENITY_LEVELS = [
  {
    id: 'ground',
    label: 'Ground Level',
    short: 'Ground',
    heading: 'Beyond the Everyday',
    tagline: 'Nature · Community · Wellbeing',
    body: 'Landscaped trails and open spaces for wellness, recreation and community.',
    plan: img('plan-ground'),
    aspect: 1650 / 1222,
    photos: [
      { image: img('am-jog'), label: 'Jogging track' },
      { image: img('am-yoga'), label: 'Meditation grotto' },
      { image: img('am-kids'), label: 'Children’s play' },
      { image: img('am-family'), label: 'Periphery greens' },
    ],
    spots: [
      { name: 'Jogging & walking tracks', at: [0.284, 0.253], photo: 0 },
      { name: 'Periphery greens', at: [0.466, 0.231], photo: 3 },
      { name: 'Community foraging orchard', at: [0.063, 0.344] },
      { name: 'Pet wilderness run', at: [0.745, 0.258] },
      { name: 'Barefoot sensory trail', at: [0.799, 0.262] },
      { name: 'Canopy treehouse pavilion', at: [0.842, 0.251] },
      { name: 'Meditation grotto', at: [0.816, 0.295], photo: 1 },
      { name: 'Understory art trail', at: [0.766, 0.311] },
      { name: 'Fern garden', at: [0.736, 0.39] },
      { name: 'Biophilic atrium', at: [0.429, 0.403] },
      { name: 'Arrival court', at: [0.394, 0.557] },
      { name: 'Valley walkway', at: [0.304, 0.704] },
      { name: 'Mist garden', at: [0.339, 0.731] },
      { name: 'Water feature', at: [0.461, 0.764] },
    ],
  },
  {
    id: 'edeck',
    label: 'E-Deck',
    heading: 'A Place for Every Moment',
    tagline: 'Move · Connect · Relax',
    body: 'A lifestyle level for every age — stay active, celebrate, play or simply unwind.',
    plan: img('plan-edeck'),
    aspect: 1618 / 1173,
    photos: [
      { image: img('ed-gym'), label: 'Gymnasium' },
      { image: img('ed-spa'), label: 'Spa & salon' },
      { image: img('ed-kids'), label: 'Podium landscape' },
      { image: img('ed-dine'), label: 'Banquet & café' },
    ],
    spots: [
      { name: 'Gymnasium', at: [0.291, 0.248], photo: 0 },
      { name: 'Infinity pool & deck', at: [0.44, 0.204] },
      { name: 'Banquet space', at: [0.775, 0.222], photo: 3 },
      { name: 'Theatre', at: [0.191, 0.364] },
      { name: 'Salon', at: [0.224, 0.425], photo: 1 },
      { name: 'Open yoga & meditation area', at: [0.256, 0.461] },
      { name: "Toddlers' play area", at: [0.338, 0.453] },
      { name: 'Open café & entrance lobby', at: [0.409, 0.355] },
      { name: 'Podium landscape', at: [0.477, 0.463], photo: 2 },
      { name: 'Open game area', at: [0.629, 0.489] },
      { name: 'Open lounge area', at: [0.75, 0.438] },
    ],
  },
  {
    id: 'common',
    label: 'Common',
    heading: 'Every Pursuit, One Canopy',
    tagline: 'Play · Restore · Gather',
    body: 'Sport, leisure, health and rejuvenation — curated for every age and pace of life.',
    photos: [
      { image: img('ca-pool'), label: 'Swimming pool' },
      { image: img('ca-tennis'), label: 'Pickle-ball court' },
      { image: img('ca-cycle'), label: 'Cycling track' },
      { image: img('ca-dog'), label: 'Pet-friendly lawns' },
    ],
    groups: [
      { title: 'Sports & Leisure', icon: 'ball', items: ['Pickle-ball court', 'Cycling track', 'Pool tables', 'Table tennis', 'Badminton court', 'Skating track', 'Board games', 'Golf simulator'] },
      { title: 'Health & Wellness', icon: 'leaf', items: ['Meditation & yoga zone', 'Walking & jogging track', 'Gymnasium', 'Jacuzzi', 'Steam'] },
      {
        title: 'Entertainment & Rejuvenation',
        icon: 'spark',
        items: ['Swimming pool & kids’ pool', 'Banquet hall', 'Mini theatre', 'Forest amphitheatre', 'Games room', 'Children’s play area', 'Party lawn', 'Tea corner', 'Toddlers’ play zone', 'Cafeteria', 'Business centre', 'Maze garden'],
      },
    ],
  },
]

// How visitors can get from the site to a landmark. Car and walk times are real routes from the site
// (Mapbox, typical traffic, fetched 24 Sep 2026) as [minutes, km]; route shapes are in routes.json
// (regenerate with scripts/build-routes.mjs). A mode is offered only when it is sensible for that trip.
// Buses were checked against OpenStreetMap route data (Sep 2026): no bus stops within ~580 m of the site, and
// the only direct service (BEST 706/707/709 LTD to Wockhardt) is slower door to door than driving or walking,
// so buses are not offered. Only car and walking are shown.
export const TRAVEL = {
  walkMax: 15, // walking is offered up to this many minutes
}

// `at` places each landmark's icon on the illustrated map image (0..1, the offline fallback); `home` is Urban
// Reserve on that image. `lngLat` is the real position for the live map; landmarks without one aren't pinned.
export const LOCATION = {
  heading: 'Never far from home',
  body: 'Schools, hospitals, malls and the Western Express Highway — all within fifteen minutes.',
  map: img('location-map'),
  aspect: 1144 / 1484,
  home: [0.476, 0.468],
  // the project site, 19°17'14.5"N 72°52'23.2"E, as [lng, lat]
  site: [72.873111, 19.287361],
  filters: [
    { id: 'all', label: 'All' },
    { id: 'school', label: 'Schools' },
    { id: 'hospital', label: 'Hospitals' },
    { id: 'mall', label: 'Malls' },
    { id: 'road', label: 'Transit' },
    { id: 'club', label: 'Leisure' },
  ],
  rings: [
    { mins: 5, places: [{ name: 'Rahul International School', type: 'school', at: [0.472, 0.889], lngLat: [72.8778, 19.2989], travel: { car: [8, 2.2], walk: [25, 2.1] } }] },
    {
      mins: 10,
      places: [
        { name: 'Lifunga Hospital', type: 'hospital', at: [0.603, 0.778] },
        { name: 'GCC International School', type: 'school', at: [0.693, 0.429], lngLat: [72.8786, 19.2835], travel: { car: [5, 1.1], walk: [12, 1.0] } },
        { name: 'J.P. Mall', type: 'mall', at: [0.829, 0.253] },
      ],
    },
    {
      mins: 15,
      places: [
        { name: 'Western Express Highway', type: 'road', at: [0.21, 0.158], lngLat: [72.8796, 19.27], travel: { car: [12, 4.1], walk: [32, 2.6] } },
        { name: 'Maxus Mall', type: 'mall', at: [0.16, 0.387], lngLat: [72.8487, 19.296], travel: { car: [12, 3.4], walk: [40, 3.3] } },
        { name: 'RBK / Kandivka Intl. School', type: 'school', at: [0.098, 0.692] },
        { name: 'GCC Club', type: 'club', at: [0.794, 0.693], lngLat: [72.8776, 19.2844], travel: { car: [4, 0.9], walk: [10, 0.9] } },
        { name: 'Wockhardt Hospital', type: 'hospital', at: [0.376, 0.712], lngLat: [72.8622, 19.2844], travel: { car: [7, 1.6], walk: [19, 1.5] } },
      ],
    },
  ],
}

export const SPECS = [
  {
    title: 'At a Glance',
    icon: 'building',
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
    icon: 'shield',
    items: ['Video door-phone with intercom', 'Power back-up for lifts & common areas', 'CCTV surveillance', '24×7 professional security'],
  },
  {
    title: 'Eco-Friendly Systems',
    icon: 'leaf',
    items: ['Sewage treatment plant', 'Rainwater harvesting', 'Vermiculture pit', 'Solar P.V. panels', 'Organic waste management'],
  },
  { title: 'Automated Homes', icon: 'bolt', items: ['Concealed conduit with PVC-insulated copper wiring'] },
  { title: 'Exquisite Amenities', icon: 'spark', items: ['Six high-speed elevators per tower', 'EV charging stations'] },
]

export const SPEC_IMAGE = img('tower-dusk')

// Equirectangular (2:1) panoramas: { id, label, src }. Empty until renders arrive.
export const PANORAMAS = []

// Images decoded before each screen is revealed.
const I = (...names) => names.map(img)
export const ROUTE_IMAGES = {
  landing: [LANDING.image],
  home: [HOME.hero],
  overview: [...I('forest', 'plant', 'leaf-texture', 'tower-day', 'tower-dusk', 'lobby', 'sun-felt')],
  residences: [RESIDENCES[0].plan, RESIDENCES[0].key],
  amenities: [AMENITY_LEVELS[0].plan, ...AMENITY_LEVELS[0].photos.map((p) => p.image)],
  views: [],
  location: [LOCATION.map],
  specifications: [SPEC_IMAGE],
  enquire: [],
}

// Everything, warmed in the background once the visitor reaches home so taps feel instant.
export const ALL_IMAGES = [
  ...new Set([
    ...Object.values(ROUTE_IMAGES).flat(),
    ...RESIDENCES.flatMap((r) => [r.plan, r.key]),
    ...INTERIORS.map((p) => p.image),
    ...AMENITY_LEVELS.flatMap((l) => [l.plan, ...l.photos.map((p) => p.image)]).filter(Boolean),
  ]),
]
