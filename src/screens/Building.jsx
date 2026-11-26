import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../gsap/gsapConfig'
import { useIntro } from '../hooks/useIntro'
import { useNav } from '../app/nav'
import { floorName } from '../data/content'
import { BUILDING, SALE_TOWER } from '../data/residences'
import { HOME_FLOORS } from '../data/finder'
import ModeSwitch from './ModeSwitch'

const { width: W, height: H, focus: F } = BUILDING
// any landscape screen, a phone turned sideways included, sets the words beside the towers
const BESIDE = '(orientation: landscape)'
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const pct = (v, of) => `${(v / of) * 100}%`

// a floor's box on the picture, [left, top, right, bottom], to set its name beside it
function boxOf(points) {
  const n = points.split(/[\s,]+/).map(Number)
  const xs = n.filter((_, i) => i % 2 === 0)
  const ys = n.filter((_, i) => i % 2 === 1)
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}
// Only the tower on offer (Tower B, the nearer one) has floors to pick: the other stands in the
// picture and nothing more. Its floors by number.
const TOWER = SALE_TOWER
const FLOORS = new Map((TOWER?.floors ?? []).map((floor) => [floor.n, { floor, box: boxOf(floor.points) }]))
const TOWER_BOX = TOWER && [...FLOORS.values()].reduce((a, { box: b }) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])], [Infinity, Infinity, -Infinity, -Infinity])

// The lit floor's number, large in the sky beside the tower (as the Rustomjee app has it), level with
// the floor.
function FloorMark({ floor, box: [, top, , bottom] }) {
  const [number, word] = floorName(floor.n).split(' ')
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -translate-y-1/2 text-right whitespace-nowrap text-ivory [text-shadow:0_2px_24px_rgb(0_0_0/0.45)]"
      style={{ right: pct(W - TOWER_BOX[0] + 360, W), top: pct((top + bottom) / 2, H) }}
    >
      <span className="block font-display text-[clamp(4.5rem,15vh,10rem)] leading-[0.8] font-light">
        {floor.n}
        <span className="align-top text-[0.3em]">{number.replace(/\d+/, '')}</span>
      </span>
      <span className="label mt-[1.2vh] block text-[max(0.6rem,9px)] text-gold-lit">
        {TOWER.label} · {word}
      </span>
    </div>
  )
}

/**
 * Visual Selection's first step: the two towers in the forest, each floor of homes traced over the
 * picture (see BUILDING). A floor lights under the pointer and opens its plan; from the keyboard the
 * arrows go up and down a tower and across to the other. It is Home's picture under Home's shade,
 * moved and enlarged so the towers fill the room the words leave them, while it still covers the
 * screen.
 */
export default function Building() {
  const root = useRef(null)
  const room = useRef(null)
  const words = useRef(null)
  const head = useRef(null)
  const art = useRef(null)
  const marks = useRef(null)
  const bands = useRef(new Map())
  const { go } = useNav()
  const [lit, setLit] = useState(null)
  // the one floor the keyboard tabs to: the lowest, then the last one focused
  const [current, setCurrent] = useState(() => FLOORS.keys().next().value)

  // the floors light up once, from the foot of the towers to their crowns, to show they can be picked
  // (on copies of them, so a floor lit under the pointer meanwhile keeps its own colour)
  useIntro(root, (tl) => {
    const order = gsap.utils.toArray('[data-sweep]', root.current).sort((a, b) => a.dataset.sweep - b.dataset.sweep)
    tl.fromTo(order, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'sine.inOut', stagger: 0.03, yoyo: true, repeat: 1 }, 0.7)
  })

  // The room for the towers is the screen inside the chrome, less the words. On a landscape screen it
  // is beside them, and the picture also covers the whole screen. On a portrait one it is above them,
  // and the towers come first: the picture keeps to their size, its top at the top, and fades into the
  // ground under the words rather than pushing the lower floors beneath them.
  useLayoutEffect(() => {
    const fit = () => {
      const stage = root.current.getBoundingClientRect()
      const r = room.current.getBoundingClientRect()
      const p = words.current.getBoundingClientRect()
      const beside = matchMedia(BESIDE).matches
      let { left, top, bottom } = r
      if (beside) left = Math.max(left, p.right + 24)
      // upright, the towers also stand below the switch at the top
      else {
        bottom = Math.min(bottom, p.top - 16)
        top = Math.max(top, head.current.getBoundingClientRect().bottom + 12)
      }
      const width = Math.max(r.right - left, 1)
      const height = Math.max(bottom - top, 1)
      const fitted = Math.min(width / F.w, height / F.h)
      const s = beside ? Math.max(fitted, stage.width / W, stage.height / H) : fitted
      // a picture larger than the screen keeps covering it; one narrower stays centred on the towers,
      // and one shorter keeps its top at the top
      const wantX = left - stage.left + width / 2 - (F.x + F.w / 2) * s
      const wantY = top - stage.top + height / 2 - (F.y + F.h / 2) * s
      const x = W * s >= stage.width ? clamp(wantX, stage.width - W * s, 0) : wantX
      // (upright, it may come down to clear the switch, its top fading into the dark)
      const y = H * s >= stage.height ? clamp(wantY, stage.height - H * s, 0) : beside ? Math.min(0, wantY) : wantY
      for (const el of [art.current, marks.current]) {
        el.style.width = `${W * s}px`
        el.style.height = `${H * s}px`
        el.style.translate = `${x}px ${y}px`
      }
      art.current.style.maskImage = art.current.style.webkitMaskImage = beside ? '' : `linear-gradient(to bottom, ${y > 0 ? 'transparent, #000 6%,' : ''} #000 78%, transparent)`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(root.current)
    ro.observe(words.current)
    return () => ro.disconnect()
  }, [])

  const open = (floor) => go('residences', `?tower=${TOWER.id}&floor=${floor.n}`)

  const onKey = (e, n) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open(FLOORS.get(n).floor)
      return
    }
    const to = { ArrowUp: n + 1, ArrowDown: n - 1, Home: TOWER.floors[0].n, End: TOWER.floors.at(-1).n }[e.key]
    if (to === undefined) return
    e.preventDefault()
    bands.current.get(to)?.focus()
  }

  const tag = lit != null && FLOORS.get(lit)

  return (
    <section ref={root} className="screen bg-forest-950 text-ivory">
      <div ref={room} aria-hidden="true" className="pointer-events-none invisible absolute inset-x-(--gutter) top-(--chrome-top) bottom-(--chrome-bot)" />

      <div ref={art} data-fade className="absolute left-0 top-0">
        <img src={BUILDING.image} alt="The two towers of Urban Reserve over the forest" draggable="false" className="absolute inset-0 size-full" />
      </div>
      <div className="home-shade pointer-events-none absolute inset-0" />
      {/* a phone on its side has the words beside the towers too, where Home's shade runs along the foot */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-3/5 bg-linear-to-r from-forest-950/85 via-forest-950/45 to-transparent landscape:block lg:hidden" />
      {/* keeps the chrome legible over the sky */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[18vh] bg-linear-to-b from-forest-950/50 to-transparent" />

      {/* the floors, laid over the picture where it lies */}
      <div ref={marks} className="absolute left-0 top-0">
        {TOWER && (
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" role="group" aria-label={`Floors of homes in ${TOWER.label}, each opening its plan`}>
            <g aria-hidden="true" className="pointer-events-none">
              {TOWER.floors.map((floor) => (
                <polygon key={floor.n} data-sweep={floor.n} points={floor.points} className="fill-ivory/30 opacity-0" />
              ))}
            </g>
            {TOWER.floors.map((floor) => {
              const n = floor.n
              return (
                <polygon
                  key={n}
                  ref={(el) => {
                    bands.current.set(n, el)
                    return () => bands.current.delete(n)
                  }}
                  points={floor.points}
                  role="link"
                  tabIndex={n === current ? 0 : -1}
                  aria-label={`${TOWER.label}, ${floorName(n)}`}
                  onPointerEnter={() => setLit(n)}
                  onPointerLeave={() => setLit((k) => (k === n ? null : k))}
                  onFocus={() => {
                    setLit(n)
                    setCurrent(n)
                  }}
                  onBlur={() => setLit((k) => (k === n ? null : k))}
                  onClick={() => open(floor)}
                  onKeyDown={(e) => onKey(e, n)}
                  vectorEffect="non-scaling-stroke"
                  className={`cursor-pointer outline-none transition-[fill,stroke] duration-300 ${
                    n === lit ? 'fill-ember/45 stroke-gold-lit stroke-2' : 'fill-transparent stroke-transparent stroke-1 pointer-coarse:stroke-ivory/30'
                  }`}
                />
              )
            })}
          </svg>
        )}

        {TOWER && (
          <p
            data-in
            aria-hidden="true"
            className="label pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap text-[max(0.62rem,9px)] text-ivory [text-shadow:0_1px_10px_rgb(0_0_0/0.6)]"
            style={{ left: pct((TOWER_BOX[0] + TOWER_BOX[2]) / 2, W), top: pct(TOWER_BOX[1] - 330, H) }}
          >
            {TOWER.label}
          </p>
        )}
        {tag && <FloorMark {...tag} />}
      </div>

      {/* the two ways in, at the top, just under the sound switch */}
      <div ref={head} data-in className="absolute left-(--gutter) top-(--chrome-top) w-[min(calc(100%-2*var(--gutter)),22rem)]">
        <ModeSwitch tone="dark" />
      </div>

      {/* taps go through the words to any floor beneath them */}
      <div ref={words} className="pointer-events-none absolute inset-x-(--gutter) bottom-[calc(var(--chrome-bot)+1.25rem)] landscape:right-auto landscape:bottom-auto landscape:top-1/2 landscape:w-[clamp(15rem,28vw,31rem)] landscape:-translate-y-1/2">
        <p data-in className="label text-[max(0.62rem,9px)] text-gold-lit">
          {TOWER?.label} · Floors {HOME_FLOORS}
        </p>
        <h2 data-in className="display mt-[2vh] text-[clamp(1.9rem,5vh,3rem)] font-light lg:text-[clamp(2.2rem,6vh,4.4rem)]">
          Pick a
          <br />
          floor
        </h2>
        <p data-in className="label mt-[3vh] flex items-center gap-3 text-[max(0.62rem,9px)] text-gold-lit">
          <span className="h-px w-6 shrink-0 bg-gold/60" />
          <span className="pointer-coarse:hidden">Point at a floor, click to open it</span>
          <span className="hidden pointer-coarse:inline">Tap a floor to open it</span>
        </p>
      </div>
    </section>
  )
}
