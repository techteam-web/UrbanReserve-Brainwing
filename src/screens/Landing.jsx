import { useRef } from 'react'
import { gsap, useGSAP, reduced } from '../gsap/gsapConfig'
import { filmRunning } from '../app/opening'
import { useIntro } from '../hooks/useIntro'
import { LANDING, BRAND } from '../data/content'
import { Mark } from '../art/Brand'
import Botanical from '../art/Botanical'

// how the picture is framed: .home-frame's object-position, and the img's scale-[1.04]
const FRAME = { x: 0.72, y: 0.4, zoom: 1.04 }
// when the name settles (s into the entrance, once its words are up) and how long it takes to get there
const SETTLE = { at: 1.9, duration: 1.6 }
// smaller than this, and the name stays in the middle (a phone held upright, where the towers and the
// trees fill the screen and no sky is left big enough for it)
const SMALLEST = 0.4
// out in the sky its shade narrows a little and lightens, so it doesn't spill over the towers
const POOL_OUT = { scaleX: 0.72, opacity: 0.75 }
// staying in the middle
const STAY = { lockup: { x: 0, y: 0, scale: 1 }, line: { scale: 1 }, pool: { scaleX: 1, opacity: 1 } }

/*
 * Where the name settles: in the patch of open sky (LANDING.sky) that comes first, where it fits there
 * at half its size, or else the one that keeps it largest, as the picture is cropped for this screen
 * and inside the screen's margins. Returns the move from where it stands in the middle, its corner
 * held at the top left.
 */
function settleAt(screen, pane, lockup) {
  const W = screen.clientWidth
  const H = screen.clientHeight
  const [iw, ih] = LANDING.size
  const s = Math.max(W / iw, H / ih)
  const [dw, dh] = [iw * s, ih * s]
  const at = (fx, fy) => [W / 2 + ((W - dw) * FRAME.x + fx * dw - W / 2) * FRAME.zoom, H / 2 + ((H - dh) * FRAME.y + fy * dh - H / 2) * FRAME.zoom]
  const pad = getComputedStyle(pane)
  const box = pane.getBoundingClientRect()
  const from = screen.getBoundingClientRect()
  const left = box.left - from.left + lockup.offsetLeft
  const top = box.top - from.top + lockup.offsetTop
  const [w, h] = [lockup.offsetWidth, lockup.offsetHeight]
  // a little air between it and the trees or towers at the patch's edge
  const air = Math.min(W, H) * 0.03
  const spots = LANDING.sky.flatMap((sky) => {
    const [x0, y0] = at(sky.x0, sky.y0)
    const [x1, y1] = at(sky.x1, sky.y1)
    const l = Math.max(x0 + air, parseFloat(pad.paddingLeft))
    const r = Math.min(x1 - air, W - parseFloat(pad.paddingRight))
    const t = Math.max(y0 + air, parseFloat(pad.paddingTop))
    const b = Math.min(y1 - air, H - parseFloat(pad.paddingBottom))
    if (r <= l || b <= t) return []
    const k = Math.min(1, (r - l) / w, (b - t) / h)
    return [{ k, first: sky.first && k >= sky.first, x: l + (r - l - w * k) / 2, y: t + (b - t - h * k) * sky.v }]
  })
  const best = spots.find((p) => p.first) ?? spots.reduce((a, p) => (p.k > a.k ? p : a), { k: 0 })
  if (best.k < SMALLEST) return STAY
  // the small line shrinks less than the name, so it stays readable, up to the name's width
  const line = Math.max(1, Math.min(1 / best.k, w / lockup.querySelector('[data-line]').offsetWidth))
  return { lockup: { x: best.x - left, y: best.y - top, scale: best.k }, line: { scale: line }, pool: POOL_OUT }
}

/**
 * Home: the towers rising over the forest, the intro film's last shot, filling the screen behind the
 * name, and the dock below for the way around. The mark, the name and the line come up together in the
 * middle of the screen (where the film's logo lands), then glide away into the open sky, clear of the
 * trees and the towers, taking their soft green shade with them.
 */
export default function Landing() {
  const root = useRef(null)
  const pane = useRef(null)
  const lockup = useRef(null)
  const pool = useRef(null)
  const line = useRef(null)

  // where it settles, worked out when it sets off (and again after a resize), and whether it has
  const state = useRef({ spot: null, settled: false })
  const where = () => settleAt(root.current, pane.current, lockup.current)

  useIntro(root, (tl) => {
    const get = () => (state.current.spot ??= where())
    const go = { duration: SETTLE.duration, ease: 'power3.inOut' }
    gsap.set(lockup.current, { transformOrigin: '0 0' })
    gsap.set(line.current, { transformOrigin: '50% 0' })
    tl.to(lockup.current, { ...go, x: () => get().lockup.x, y: () => get().lockup.y, scale: () => get().lockup.scale, onComplete: () => (state.current.settled = true) }, SETTLE.at)
    tl.to(line.current, { ...go, scale: () => get().line.scale }, SETTLE.at)
    tl.to(pool.current, { ...go, scaleX: () => get().pool.scaleX, opacity: () => get().pool.opacity }, SETTLE.at)
  })

  // with less motion asked for it is simply there; and wherever it has settled, it keeps to its sky as
  // the screen changes size or turns
  useGSAP(
    () => {
      const place = () => {
        const to = where()
        gsap.set(lockup.current, { transformOrigin: '0 0', ...to.lockup })
        gsap.set(line.current, { transformOrigin: '50% 0', ...to.line })
        gsap.set(pool.current, to.pool)
      }
      if (reduced()) {
        place()
        state.current.settled = true
      }
      const onResize = () => {
        state.current.spot = null
        if (state.current.settled) place()
      }
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    },
    { scope: root },
  )

  return (
    <section ref={root} className="screen bg-forest-950 text-ivory">
      {/* after the film the picture is already in place, under the film's last frame, so it has no
          entrance of its own; the film ends a touch closer in (its slow push), and so does this */}
      <div data-fade={filmRunning() ? undefined : true} className="absolute inset-0">
        <img src={LANDING.image} alt="The Urban Reserve towers over the forest" className="home-frame h-full w-full scale-[1.04]" />
        <div className="home-shade absolute inset-0" />
      </div>

      <Botanical kind="fern" seed={4} depth={22} className="-bottom-[9vh] left-0 hidden w-[13vw] text-gold/20 lg:block" />
      <Botanical kind="seed" seed={19} depth={-24} className="left-[44%] top-[16vh] hidden w-[clamp(2rem,3vw,3.5rem)] -rotate-12 text-ivory/20 lg:block" />

      <div ref={pane} className="safe pane relative flex h-full flex-col items-center justify-center-safe pb-(--chrome-bot) text-center">
        <div ref={lockup} className="relative isolate flex flex-col items-center">
          {/* a soft pool of forest shade under the words, which goes where they go */}
          <div ref={pool} aria-hidden="true" className="home-pool pointer-events-none absolute -inset-x-full inset-y-[-45%] -z-10" />
          {/* the intro film's logo lands here, so while it runs the mark stands still for it */}
          <div data-home-mark data-in={filmRunning() ? undefined : true} className="w-[clamp(2.75rem,7vh,4.25rem)] text-gold">
            <Mark />
          </div>
          {/* just the mark, the name and the tagline: the small white line carries a soft forest glow,
              for where the shade leaves it over the sky */}
          <h1 className="display mt-[3vh] text-[clamp(3rem,min(13vw,13vh),8.5rem)] leading-[0.92] font-light tracking-[0.03em]">
            <span data-in className="block">Urban</span>
            <span data-in className="block">Reserve</span>
          </h1>
          {/* its wide tracking also trails the last letter, so the line is drawn back by as much to centre */}
          <p ref={line} data-line data-in className="mt-[2.2vh] mr-[-0.42em] text-[max(0.7rem,9.5px)] font-medium tracking-[0.42em] text-ivory/90 uppercase [text-shadow:0_1px_2px_rgb(13_35_29/0.9),0_0_14px_rgb(13_35_29/0.8)]">{BRAND.tagline}</p>
        </div>
      </div>
    </section>
  )
}
