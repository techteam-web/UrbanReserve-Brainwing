import { useRef } from 'react'

/**
 * A finger run down a tower's floors, as a pointer hovers them: on a touch screen (or a pen) a drag
 * over the floors lights each one it passes (`onOver(n)`, null off them) and letting go on one picks
 * it (`onPick(n)`); letting go off the floors picks nothing. A plain tap is left to the floor's own
 * click. Each floor carries its number as `data-floor`. Spread the handlers on what holds the floors,
 * which takes the drag itself where it should (touch-action: none), not the page.
 */
export function useScrub({ onOver, onPick }) {
  const drag = useRef(null)

  const floorAt = (x, y) => {
    const el = document.elementFromPoint(x, y)?.closest?.('[data-floor]')
    return el ? Number(el.dataset.floor) : null
  }

  return {
    onPointerDown(e) {
      // (a new press also clears a drag whose closing click never came)
      drag.current = e.pointerType === 'mouse' ? null : { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false }
    },
    onPointerMove(e) {
      const d = drag.current
      if (!d || d.id !== e.pointerId) return
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return
      d.moved = true
      onOver(floorAt(e.clientX, e.clientY))
    },
    onPointerUp(e) {
      const d = drag.current
      if (!d || d.id !== e.pointerId) return
      if (d.moved) {
        d.done = true
        const n = floorAt(e.clientX, e.clientY)
        if (n != null) onPick(n)
        else onOver(null)
      }
      drag.current = d.moved ? d : null
    },
    onPointerCancel() {
      drag.current = null
      onOver(null)
    },
    // the click that ends a drag (on the floor it began on) picks nothing more
    onClickCapture(e) {
      if (!drag.current?.done) return
      drag.current = null
      e.stopPropagation()
      e.preventDefault()
    },
  }
}
