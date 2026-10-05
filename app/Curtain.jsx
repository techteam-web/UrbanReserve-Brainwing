import { forwardRef, useImperativeHandle, useRef } from 'react'
import { gsap, reduced } from '../gsap/gsapConfig'
import Terrain from '../art/Terrain'
import { settled } from './decode'
import { setCovered } from './gate'
import { Mark } from '../art/Brand'

const Sheet = forwardRef(function Sheet({ tone, seed, children }, ref) {
  return (
    <div ref={ref} className="pointer-events-none invisible fixed inset-x-0 top-[-14vh] z-[70] will-change-transform" aria-hidden="true">
      <Terrain side="top" seed={seed} amp={70} className={`h-[14vh] w-full ${tone}`} />
      <div className={`relative grid h-[100vh] place-items-center ${tone === 'text-ember' ? 'bg-ember' : 'bg-forest-900'}`}>{children}</div>
      <Terrain side="bottom" seed={seed + 11} amp={70} className={`h-[14vh] w-full ${tone}`} />
    </div>
  )
})

// Distances that park a sheet fully below (+1) or above (-1) the viewport, torn edges included.
function parked(el, side) {
  const edge = el.firstChild.getBoundingClientRect().height
  return side > 0 ? window.innerHeight + edge + 2 : edge - el.offsetHeight - 2
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

const Curtain = forwardRef(function Curtain(_, ref) {
  const ember = useRef(null)
  const forest = useRef(null)
  const mark = useRef(null)

  useImperativeHandle(ref, () => ({
    // dir 1 sweeps upward (going deeper), -1 sweeps downward (going back)
    // `ready` resolves when the destination's images are decoded; the reveal waits for it
    sweep(dir, onSwap, ready = Promise.resolve()) {
      const sheets = [ember.current, forest.current]
      gsap.killTweensOf([...sheets, mark.current])
      const tl = gsap.timeline()
      if (reduced()) {
        tl.set(forest.current, { y: 0, autoAlpha: 0 })
          .to(forest.current, { autoAlpha: 1, duration: 0.35, ease: 'none' })
          .add(() => hold(tl, onSwap, ready))
          .to(forest.current, { autoAlpha: 0, duration: 0.45, ease: 'none' })
        return tl
      }
      const D = 0.7
      tl.set(sheets, { autoAlpha: 1, y: (i, el) => parked(el, dir) })
        .set(mark.current, { autoAlpha: 0, scale: 0.8 })
        .to(ember.current, { y: 0, duration: D, ease: 'sweepIn' }, 0)
        .to(forest.current, { y: 0, duration: D, ease: 'sweepIn' }, 0.1)
        .to(mark.current, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power2.out' }, 0.3)
        .add(() => hold(tl, onSwap, ready))
        .to(forest.current, { y: (i, el) => parked(el, -dir), duration: D, ease: 'sweepOut' })
        .to(ember.current, { y: (i, el) => parked(el, -dir), duration: D, ease: 'sweepOut' }, '<0.1')
        .set(sheets, { autoAlpha: 0 })
      return tl
    },
  }))

  return (
    <>
      <Sheet ref={ember} tone="text-ember" seed={3} />
      <Sheet ref={forest} tone="text-forest-900" seed={17}>
        <div ref={mark} className="w-[clamp(4rem,9vh,6rem)] text-gold">
          <Mark />
        </div>
      </Sheet>
    </>
  )
})

export default Curtain
