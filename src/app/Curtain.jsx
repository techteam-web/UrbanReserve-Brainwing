import { forwardRef, useImperativeHandle, useRef } from 'react'
import { gsap, reduced } from '../gsap/gsapConfig'
import Terrain from '../art/Terrain'
import { settled } from './decode'
import { setCovered } from './gate'
import { Mark } from '../art/Brand'

// One torn edge of the curtain: the brochure's tear in forest green over a hairline of gold, so
// the edge catches the light as it crosses the screen.
function Edge({ side, seed }) {
  return (
    <div className="relative h-full w-[10vw] shrink-0">
      <Terrain side={side} seed={seed} amp={60} className={`absolute inset-y-0 h-full w-full text-gold ${side === 'left' ? '-left-[0.3vw]' : 'left-[0.3vw]'}`} />
      <Terrain side={side} seed={seed} amp={60} className="absolute inset-0 h-full w-full text-forest-900" />
    </div>
  )
}

// A single sheet, a screen wide with a torn edge either side, parked just off screen until it sweeps.
const Sheet = forwardRef(function Sheet({ children }, ref) {
  return (
    <div ref={ref} className="pointer-events-none invisible fixed inset-y-0 left-[-10vw] z-[70] flex w-[120vw] will-change-transform" aria-hidden="true">
      <Edge side="left" seed={23} />
      <div className="relative grid flex-1 place-items-center bg-forest-900">{children}</div>
      <Edge side="right" seed={37} />
    </div>
  )
})

// The translate that parks the sheet fully right of (+1) or left of (-1) the viewport, torn edges included.
function parked(el, side) {
  const edge = el.firstChild.getBoundingClientRect().width
  return side * (window.innerWidth + edge + 2)
}

// Mounting the next screen is the one heavy moment of a transition. It happens while the page is
// fully covered, and the reveal only starts once that work and its image decodes are finished,
// so the curtain never jumps to catch up.
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
 * The page transition: one forest-green curtain drawn across the screen. It comes in from one side,
 * covers the page while the next screen mounts, and carries on out the other side to reveal it, so
 * the eye follows a single movement. Going deeper it travels right to left; going back, left to right.
 */
const Curtain = forwardRef(function Curtain(_, ref) {
  const sheet = useRef(null)
  const mark = useRef(null)

  useImperativeHandle(ref, () => ({
    // dir 1 draws right to left (going deeper), -1 left to right (going back)
    // `ready` resolves when the destination's images are decoded; the reveal waits for it
    sweep(dir, onSwap, ready = Promise.resolve()) {
      const el = sheet.current
      gsap.killTweensOf([el, mark.current])
      const tl = gsap.timeline()
      if (reduced()) {
        tl.set(el, { x: 0, autoAlpha: 0 })
          .set(mark.current, { autoAlpha: 0.9 })
          .to(el, { autoAlpha: 1, duration: 0.35, ease: 'none' })
          .add(() => hold(tl, onSwap, ready))
          .to(el, { autoAlpha: 0, duration: 0.45, ease: 'none' })
        return tl
      }
      tl.set(el, { autoAlpha: 1, x: parked(el, dir) })
        .set(mark.current, { autoAlpha: 0 })
        .to(el, { x: 0, duration: 0.7, ease: 'sweepIn' }, 0)
        .to(mark.current, { autoAlpha: 0.9, duration: 0.5, ease: 'power1.out' }, 0.4)
        .add(() => hold(tl, onSwap, ready))
        .to(el, { x: parked(el, -dir), duration: 0.75, ease: 'sweepOut' })
        .set(el, { autoAlpha: 0 })
      return tl
    },
  }))

  return (
    <Sheet ref={sheet}>
      <div ref={mark} className="w-[clamp(3.5rem,8vh,5rem)] text-gold">
        <Mark />
      </div>
    </Sheet>
  )
})

export default Curtain
