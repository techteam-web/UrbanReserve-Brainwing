import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { gsap, reduced } from '../gsap/gsapConfig'
import { tear } from '../art/edges'
import { SECTIONS, ENQUIRE } from '../data/content'

const ITEMS = [{ id: 'home', short: 'Home' }, ...SECTIONS, ENQUIRE]
const N = ITEMS.length
const MARGIN = 0.07
const xOf = (i) => MARGIN + (i * (1 - 2 * MARGIN)) / (N - 1)
const nearest = (u) => Math.max(0, Math.min(N - 1, Math.round(((u - MARGIN) / (1 - 2 * MARGIN)) * (N - 1))))

// The crest is the brochure cover's torn edge (the same source as the full-screen gate), in a 1000×100 box,
// kept between y 6 and 42 so labels always sit clear below it.
const RAW = tear(29, 60)
const LO = Math.min(...RAW.map((p) => p[1]))
const HI = Math.max(...RAW.map((p) => p[1]))
const PTS = RAW.map(([t, y]) => [t, 6 + ((y - LO) / (HI - LO || 1)) * 36])
const STEP = PTS[1][0] - PTS[0][0]
const yAt = (u) => {
  const x = (u * 1000) / STEP
  const i = Math.min(PTS.length - 2, Math.max(0, Math.floor(x)))
  return PTS[i][1] + (PTS[i + 1][1] - PTS[i][1]) * (x - i)
}
const LINE = 'M' + PTS.map(([t, y]) => `${t} ${y.toFixed(2)}`).join('L')
const FILL = `M0 100L${LINE.slice(1)}L1000 100Z`

/**
 * Section navigation as a horizon: the brochure's torn ridge runs along the bottom, each section is a
 * marker on the crest, and a sun sits over the current one. Changing section glides the sun along the
 * ridge and lights the path behind it; the sun can also be dragged and dropped on another section.
 */
export default function Horizon({ route, go }) {
  const bar = useRef(null)
  const sun = useRef(null)
  const done = useRef(null)
  const pos = useRef({ u: xOf(Math.max(0, ITEMS.findIndex((s) => s.id === route))) })
  const drag = useRef(null)
  const [hover, setHover] = useState(null)

  const apply = useCallback(() => {
    const { u } = pos.current
    if (sun.current) {
      sun.current.style.left = `${u * 100}%`
      sun.current.style.top = `${yAt(u)}%`
    }
    done.current?.setAttribute('width', (u * 1000).toFixed(1))
  }, [])

  useLayoutEffect(() => {
    const i = ITEMS.findIndex((s) => s.id === route)
    if (i < 0) return
    gsap.killTweensOf(pos.current)
    if (reduced()) {
      pos.current.u = xOf(i)
      apply()
      return
    }
    gsap.to(pos.current, { u: xOf(i), duration: 1.1, ease: 'expo.inOut', onUpdate: apply })
    apply()
  }, [route, apply])

  const at = (e) => {
    const r = bar.current.getBoundingClientRect()
    return Math.min(xOf(N - 1), Math.max(xOf(0), (e.clientX - r.left) / r.width))
  }

  const onDown = (e) => {
    gsap.killTweensOf(pos.current)
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, moved: 0 }
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    d.moved = Math.max(d.moved, Math.abs(e.clientX - d.x))
    pos.current.u = at(e)
    apply()
    setHover(nearest(pos.current.u))
  }
  const onUp = () => {
    if (!drag.current) return
    drag.current = null
    setHover(null)
    const k = nearest(pos.current.u)
    if (ITEMS[k].id !== route) go(ITEMS[k].id)
    else gsap.to(pos.current, { u: xOf(k), duration: 0.6, ease: 'expo.out', onUpdate: apply })
  }

  const lit = hover ?? ITEMS.findIndex((s) => s.id === route)

  return (
    <nav ref={bar} aria-label="Sections" className="horizon-in pointer-events-auto absolute inset-x-0 bottom-0 h-[calc(var(--chrome-bot)+1.75rem)] select-none">
      <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="horizon-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#143429" stopOpacity="0.94" />
            <stop offset="1" stopColor="#0d231d" stopOpacity="0.98" />
          </linearGradient>
          <clipPath id="horizon-done">
            <rect ref={done} x="0" y="-20" height="140" width="0" />
          </clipPath>
        </defs>
        <path d={FILL} fill="url(#horizon-fill)" />
        <path d={LINE} fill="none" stroke="#faf7f2" strokeOpacity="0.22" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <path d={LINE} fill="none" stroke="#e6c983" strokeWidth="2" vectorEffect="non-scaling-stroke" clipPath="url(#horizon-done)" />
      </svg>

      {ITEMS.map((s, i) => {
        const u = xOf(i)
        const on = i === lit
        const cta = s.id === 'enquire'
        return (
          <button
            key={s.id}
            onClick={() => go(s.id)}
            aria-current={s.id === route ? 'page' : undefined}
            className="group absolute bottom-0 flex -translate-x-1/2 flex-col items-center outline-none"
            style={{ left: `${u * 100}%`, top: `calc(${yAt(u)}% - 0.35rem)`, width: `${(1 - 2 * MARGIN) / (N - 1) * 100}%` }}
          >
            <span className={`size-[0.7rem] rounded-full border-2 transition-all duration-500 ${on ? 'scale-0 border-gold-lit' : cta ? 'border-ember bg-forest-950 group-hover:bg-ember' : 'border-ivory/45 bg-forest-950 group-hover:border-gold-lit'}`} />
            <span
              className={`mt-[clamp(0.35rem,1vh,0.6rem)] whitespace-nowrap text-[max(0.6rem,9px)] font-medium uppercase tracking-[0.22em] transition-colors duration-500 group-focus-visible:underline ${
                on ? 'text-gold-lit' : cta ? 'text-ember max-sm:hidden' : 'text-ivory/55 group-hover:text-ivory max-sm:hidden'
              }`}
            >
              {s.short}
            </span>
          </button>
        )
      })}

      <button
        ref={sun}
        type="button"
        aria-label="Drag the sun to another section"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="absolute z-10 grid size-12 -translate-x-1/2 -translate-y-[62%] cursor-grab touch-none place-items-center active:cursor-grabbing"
      >
        <span className="sun absolute size-[1.6rem] rounded-full" />
      </button>
    </nav>
  )
}
