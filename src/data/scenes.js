import { TOP_VIEW, TOWERS } from './content'
import HEADINGS from './headings.json'

// Each scene with how far it is turned from the others of its group (npm run headings), so a view can
// keep facing the same way across towers and floors, and across the top view's times of day, which
// were shot from one spot facing alike. Apart from content.js because the Node scripts load that, and
// Node can't import JSON this way.
export const SCENES = [
  ...TOWERS.flatMap((t) => t.floors).map((f) => ({ ...f, group: 'towers' })),
  ...TOP_VIEW.times.map((t) => ({ ...t, group: 'top' })),
].map((s) => ({ ...s, heading: HEADINGS[s.key] ?? 0 }))
