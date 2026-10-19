// Screen intros must start when the visitor can actually see the screen. While anything covers it
// (the fullscreen gate, or the curtain mid-transition) new intro timelines are held and played together.
// An intro can name covers it plays under anyway: the Residences world descends through its clouds
// while the page's own entrance waits behind the 'world' cover.
const doc = document
export const fullscreenSupported = () => Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled)
export const isFullscreen = () => Boolean(doc.fullscreenElement || doc.webkitFullscreenElement)

const covers = new Set(fullscreenSupported() && !isFullscreen() ? ['fullscreen'] : [])
// held timeline → the covers it may play under
const held = new Map()
const open = (under) => [...covers].every((c) => under.includes(c))

export function setCovered(reason, on) {
  if (on) covers.add(reason)
  else covers.delete(reason)
  held.forEach((under, tl) => {
    if (!open(under)) return
    held.delete(tl)
    tl.play()
  })
}

export function holdIntro(tl, under = []) {
  if (open(under)) return tl
  tl.pause()
  held.set(tl, under)
  return tl
}

// Heavy start-up work (the Residences world) waits for a screen transition to finish, so it can't
// stall the curtain mid-sweep. The navigator marks each sweep; with none running this resolves at
// once.
let still = Promise.resolve()
let settle = null

export function setTransition(on) {
  if (on && !settle) still = new Promise((r) => (settle = r))
  if (!on && settle) {
    settle()
    settle = null
  }
}

export async function afterTransition() {
  while (settle) await still
}
