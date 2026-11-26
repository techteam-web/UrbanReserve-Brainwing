/*
 * Touch screens: iPads, iPhones, Android and Windows tablets, touch laptops.
 *
 * The app fills the screen and never scrolls as a page, but a finger could still move the page itself:
 * a swipe past the end of a list, a swipe where nothing scrolls, a pinch. On an iPad that is what
 * takes Safari out of full screen (a swipe down, or a pinch in, on a page that doesn't take it), and
 * elsewhere it rubber-bands the screen, zooms it, or reads as pull-to-refresh or back.
 *
 * So a finger only moves what is made to move:
 *   - a pane or list that can still scroll the way the finger goes (the phone layouts, the unit
 *     finder's lists, the chip rows that scroll sideways)
 *   - a slider (input[type=range]) or a text field
 *   - anything that takes its own drags and pinches, marked touch-action: none (a plan that zooms,
 *     a panorama, the map, the tower that a finger runs down to pick a floor)
 * Anything else is held still, and pinching the page itself does nothing. Each gesture is judged once,
 * on its first move, the way the browser itself decides whether a gesture scrolls.
 */
const OWN = 'input[type="range"], input[type="text"], input[type="search"], textarea, [contenteditable="true"]'

// whether something under the finger takes a drag this way (dx, dy: the finger's travel so far)
function takes(target, dx, dy, pinch) {
  const upright = Math.abs(dy) >= Math.abs(dx)
  for (let el = target instanceof Element ? target : target?.parentElement; el && el !== document.documentElement; el = el.parentElement) {
    if (el.matches(OWN)) return true
    const style = getComputedStyle(el)
    if (style.touchAction === 'none') return true
    if (pinch) continue
    if (upright) {
      const scrolls = /auto|scroll/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1
      if (scrolls && (dy > 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1)) return true
    } else {
      const scrolls = /auto|scroll/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 1
      if (scrolls && (dx > 0 ? el.scrollLeft > 0 : el.scrollLeft + el.clientWidth < el.scrollWidth - 1)) return true
    }
  }
  return false
}

let from = null
let verdict = null

function onStart(e) {
  if (e.touches.length === 1) {
    const t = e.touches[0]
    from = { x: t.clientX, y: t.clientY }
  }
  // a second finger makes it a pinch, judged afresh
  verdict = null
}

function onMove(e) {
  if (verdict === null) {
    const pinch = e.touches.length > 1
    const t = e.touches[0]
    const dx = from ? t.clientX - from.x : 0
    const dy = from ? t.clientY - from.y : 0
    verdict = takes(e.target, dx, dy, pinch)
  }
  if (!verdict && e.cancelable) e.preventDefault()
}

function onEnd(e) {
  if (e.touches.length === 0) {
    from = null
    verdict = null
  }
}

// Safari's own pinch, which zooms the page (or, in full screen, leaves it)
const hold = (e) => e.preventDefault()

const opts = { passive: false, capture: true }
document.addEventListener('touchstart', onStart, { passive: true, capture: true })
document.addEventListener('touchmove', onMove, opts)
document.addEventListener('touchend', onEnd, { passive: true, capture: true })
document.addEventListener('touchcancel', onEnd, { passive: true, capture: true })
document.addEventListener('gesturestart', hold, opts)
document.addEventListener('gesturechange', hold, opts)
// (a double tap's zoom is held off in CSS, with touch-action: manipulation, so quick taps stay clicks)
