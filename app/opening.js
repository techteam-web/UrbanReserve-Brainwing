import { reduced } from '../gsap/gsapConfig'
import { setCovered } from './gate'

// Whether the app opens with the intro film (./Intro.jsx): when it opens on Home (a link straight to
// a page goes straight there), and not for visitors who ask for less motion or less data. It is
// decided once, before any screen builds its entrance, so Home's entrance waits behind the film and
// plays as the film fades.
export const filmPlays = window.location.pathname === '/' && !reduced() && !navigator.connection?.saveData
if (filmPlays) setCovered('intro', true)

let running = filmPlays

// The film's logo comes to rest on Home's mark (`[data-home-mark]`), so while it runs Home shows its
// mark as it stands, without an entrance of its own.
export const filmRunning = () => running
export const filmEnded = () => {
  running = false
}
