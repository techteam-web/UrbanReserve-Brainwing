// Screen intros must start when the visitor can actually see the screen. While anything covers it
// (the fullscreen gate, or the curtain mid-transition) new intro timelines are held and played together.
const doc = document
export const fullscreenSupported = () => Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled)
export const isFullscreen = () => Boolean(doc.fullscreenElement || doc.webkitFullscreenElement)

const covers = new Set(fullscreenSupported() && !isFullscreen() ? ['fullscreen'] : [])
const held = new Set()

export function setCovered(reason, on) {
  if (on) covers.add(reason)
  else covers.delete(reason)
  if (covers.size) return
  held.forEach((tl) => tl.play())
  held.clear()
}

export function holdIntro(tl) {
  if (!covers.size) return tl
  tl.pause()
  held.add(tl)
  return tl
}
