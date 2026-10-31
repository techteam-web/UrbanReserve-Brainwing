# Urban Reserve

A full-screen, non-scrolling presentation app for Urban Reserve, built from the brochure (`260916_URBAN RESERVE BROCHURE MANUAL V1.pdf`).
It runs as Landing → Menu → one page per section, with a quiet fade between pages, through the colour the next page opens on.

```
npm install
npm run dev
```

## Stack

React 19 + Vite, Tailwind v4 (theme tokens in `src/index.css`), GSAP with `@gsap/react` (DrawSVG, Observer, CustomEase), Marzipano for 360° views, and MapLibre GL with three.js for the Location 3D map.

## Where things live

| Path | What |
| --- | --- |
| `src/data/content.js` | All copy, images, plans, amenities, specs, contact details and panoramas |
| `src/app/` | Routing and transitions (`Navigator.jsx`), the curtain and the chrome. React Router owns the URL; the curtain decides when the screen swaps |
| `src/screens/` | One file per screen |
| `src/art/` | Brand art: vector logo, `Terrain` (the cover's real torn edge), `Botanical`s traced from the brochure, `SunBirds` |
| `src/app/FullscreenGate.jsx` | The full-screen gate. The app only runs in full screen, and the gate returns when you leave it |
| `src/hooks/useIntro.js` | Shared entrance animation: `data-in`, `data-fade` and `data-draw` attributes |
| `src/brand/*.svg` | Logo mark and lockup, extracted as vectors from page 1 of the brochure |
| `src/world/` | The Location 3D map: map style, the reserve in three.js, clouds, camera flights and stops |
| `public/models/` | GLB models: `urban.glb` is the building (made by `npm run building`), the three tree variants line the plot, `bird.glb` is the flock, and the fishing boats and `Yatch1` sail the creek and the sea |
| `public/hdri/` | Lighting for the 3D scene. `meadow_2_1k.exr` is loaded; the 4K original is only the source for it |

## Routes and hosting

Each screen has its own path: `/`, `/menu`, `/overview`, `/residences`, `/amenities`, `/views`, `/location` and `/specifications`. Anything else redirects to `/`.

Because these are real paths, the host must serve `index.html` for every route, or deep links and page reloads will return 404. `npm run dev` and `npm run preview` already do this. Netlify needs `/* /index.html 200` in `public/_redirects`. Vercel needs a rewrite of `/(.*)` to `/index.html`.

## Responsive scaling

Desktop layouts are designed at **1920×1080 (3xl)**. Landscape screens 1024px and wider scale that one canvas: `1rem` = 16px at 1080p, 21.3px at 2560×1440 (4xl) and 32px at 3840×2160 (5xl). Smaller laptops shrink proportionally, down to an 11px floor. Portrait tablets and phones get stacked layouts, where the content pane scrolls under fixed chrome.

## Location 3D map

The Location page is a 3D map of the neighbourhood. It opens in cloud. The view clears over the city, then the camera dives through the high clouds, comes out underneath and settles on the reserve. The page's text and panels come in once the camera is through. The timings live in `ENTRANCE` in `src/world/World.jsx`. Each stop flies the camera to a new view: the reserve itself, the whole neighbourhood, and every place in `LOCATION`. A place's road route from the reserve is drawn out along the streets, with its travel time and distance. On desktop, the neighbourhood's places are picked by kind from a bar along the foot of the screen (Schools, Hospitals, Shopping, Clubs, Connectivity); a kind lights every place of that kind on the map, with their routes, and the card lists them to fly to one. Every button on the page plays a click (`public/audio/Click.mp3`, through `src/app/sound.js`). Visitors can't steer the camera; it orbits slowly, and the cursor leans it a few degrees left and right.

A preloader holds the page until the whole scene is in: the map and terrain for the arrival and the descent, every model, the HDRI lighting and compiled shaders. It shows the progress and what is still loading. A slow connection keeps it waiting for as long as data is still arriving; only 20 s with nothing new lets the page start without the missing part (`src/world/World.jsx`).

The world only starts building once the page transition has finished, so it can't stall the curtain mid-fade. During the transition, MapLibre's workers start up and the slowest map tiles are fetched in advance. Shaders compile in the background where the browser supports it (`KHR_parallel_shader_compile`), and nothing is drawn with a shader that is still compiling. The HDRI and the water's shore field are worked out in web workers. On Windows, Direct3D's shader compiler is slow with long loops, so the cloud shader keeps its noise loops from being unrolled.

- **Map tiles.** It works without a key, using OpenFreeMap vector tiles and AWS Terrarium elevation. For production, add a MapTiler key to `.env` as `VITE_MAPTILER_KEY=...`. The same style then loads MapTiler tiles, terrain and fonts.
- **Positions.** `SITE` and each place's `at` in `src/data/content.js` are Google Maps pins. To move one, right-click the spot on Google Maps, click the coordinates to copy them, and paste them into `gmaps('…')`. The plot centre (`SITE`) is still approximate. `SITE.heading` rotates the ground plan to match the real plot.
- **Routes.** `npm run routes` fetches the driving route to every place from OSRM (OpenStreetMap roads) into `src/data/routes.json`. Re-run it after moving `SITE` or a place; routes made for another `SITE` are not drawn. The page shows the road distance from the route and the brochure's minutes; OSRM's own times assume empty roads, so they are kept in the file but not shown.
- **Water and boats.** `npm run water` saves the creek, the sea and the ponds around the plot (with each one's water type), plus open-water spots for the boats, to `src/data/water.json`. Water mapped twice is dropped, such as a lake drawn over the creek, since it would flicker against the open water around it. The water is a calm, glossy surface that reflects the sky (`src/world/water.js`). The sea and the creeks run from turquoise shallows along the banks to deep blue offshore, in slow light and dark patches. Ponds and salt pans keep an even, darker blue. The colours are `TONES` at the top of that file.
- **Lighting.** `node scripts/hdri.mjs <in.exr> <out.exr>` makes the 1K copy of an HDRI and caps its sun, since a directional light with shadows plays the sun. `src/world/light.js` keeps the HDRI, the shadows, the map's light and the clouds on the same sun.
- **The reserve.** The building is the architects' model. Their Unreal Engine export (351 MB, 5 million triangles, no textures) goes in `models-src/Urban_Building/`, which is kept out of git and out of the build. `npm run building` cuts it down to `public/models/urban.glb` (about 140k triangles, 1.4 MB): it drops the stray trees and the hedge's leaves (the hedge becomes a plain block), groups the materials into a few looks the scene paints (`LOOKS` in `src/world/scene.js`), simplifies, and compresses with meshopt. It also measures the towers, the height and the podium outline into `src/data/building.json`, which places the cameras, hotspots and trees. The plot, drives and ponds are traced from `plan-ground.webp` (`src/world/site.js`). Camera stops, hotspot heights and landmark framing live in `src/world/stops.js`.
- **Birds.** In the neighbourhood views, flocks of blackbirds and a lone soaring eagle (`public/models/blackbirds.gltf`, `eagle.glb`) cross the view slowly in straight lines, from either side (`src/world/birds.js`). They fly low over the city, among the low clouds, on a canvas of their own beneath the cloud layer, drawn with the map's camera. Each pass sizes its birds for their distance, so they look the same in every view. They load after the entrance and set off once the camera has come to rest. Which way each model faces, its size on screen, its height, how long it takes to cross and the pause between passes are in `KINDS`.
- **Clouds** are two decks ray-cast from the map's camera (`src/world/clouds.js`): low cumulus at about 215 m and a high deck at about 4.2 km. Resting views are kept out of both, so the camera only passes through cloud mid-flight. Inside a deck the view whites out, and the wisps stream past from the point the camera is heading for. For the entrance, the high deck is deeper, so the camera spends longer in it.
- Without WebGL, the page falls back to a still image with the same panels.

## Adding 360° views

Put equirectangular (2:1) images in `public/assets/panoramas/` and list them in `PANORAMAS` in `src/data/content.js`:

```js
export const PANORAMAS = [{ id: 'deck', label: 'E-Deck', src: '/assets/panoramas/deck.jpg' }]
```

Until then, the Views page shows an "arriving soon" state.

## Regenerating images from the brochure

The PDF only embeds mockup spreads, so the artwork is cropped from high-resolution page renders, with the book spine removed:

```
mutool draw -o "/tmp/brochure/p%d.png" -r 220 "260916_URBAN RESERVE BROCHURE MANUAL V1.pdf"
node scripts/crop-brochure.mjs /tmp/brochure
```

The botanicals and torn edges are vectorised from the brochure pages:

```
mutool draw -o "/tmp/brochure-hi/p%d.png" -r 400 "260916_URBAN RESERVE BROCHURE MANUAL V1.pdf" 2,4,9,11,27
node scripts/trace-botanicals.mjs /tmp/brochure-hi
node scripts/extract-ridges.mjs /tmp/brochure-hi
```

## Before launch

- Replace the placeholder phone, WhatsApp number and email in `BRAND` (`src/data/content.js`).
- Swap in the original renders and plans when available. The brochure crops are good, but not print-master quality.
