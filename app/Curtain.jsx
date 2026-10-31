import { forwardRef, useImperativeHandle, useRef } from 'react'
import { gsap } from '../gsap/gsapConfig'
import { settled } from './decode'
import { setCovered } from './gate'

// Mounting the next screen is the one heavy moment of a transition. It happens while the page is
// fully covered, and the reveal only starts once that work and its image decodes are finished,
// so the fade never jumps to catch up.
function hold(tl, onSwap, ready) {
  tl.pause()
  setCovered('curtain', true)
  onSwap()
  settled(ready).then(() => {
    setCovered('curtain', false)
    tl.resume()
  })
}

/**
 * The page transition: the screen fades to the colour the next one opens on, and that one fades up
 * out of it. Nothing crosses the screen and two light pages never go dark between them, so moving
 * around stays easy on the eyes. While it shows it also takes any taps meant for the page going away.
 */
const Curtain = forwardRef(function Curtain(_, ref) {
  const sheet = useRef(null)

  useImperativeHandle(ref, () => ({
    // `ground` is the next screen's colour; `ready` resolves when its images are decoded, and the
    // reveal waits for it
    cover(ground, onSwap, ready = Promise.resolve()) {
      const el = sheet.current
      gsap.killTweensOf(el)
      el.style.backgroundColor = ground
      const tl = gsap.timeline()
      tl.to(el, { autoAlpha: 1, duration: 0.3, ease: 'sine.inOut' })
        .add(() => hold(tl, onSwap, ready))
        .to(el, { autoAlpha: 0, duration: 0.4, ease: 'sine.inOut' })
      return tl
    },
  }))

  return <div ref={sheet} className="invisible fixed inset-0 z-70" aria-hidden="true" />
})

export default Curtain
