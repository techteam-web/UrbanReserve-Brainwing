import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../gsap/gsapConfig'
import { useIntro } from '../hooks/useIntro'
import { useNav } from '../app/nav'
import { floorName } from '../data/content'
import { BUILDING } from '../data/residences'
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
// every floor of both towers by `${tower}.${floor}`; `side` is the tower's place, 0 on the left
const FLOORS = new Map(BUILDING.towers.flatMap((tower, side) => tower.floors.map((floor) => [`${tower.id}.${floor.n}`, { tower, side, floor, box: boxOf(floor.points) }])))

// The lit floor's name, on the outer side of its tower.
function FloorTag({ tower, side, floor, box: [left, top, right, bottom] }) {
  const beside = side ? { left: pct(right + 70, W) } : { right: pct(W - left + 70, W) }
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -translate-y-1/2 whitespace-nowrap border border-ivory/15 bg-forest-950/80 px-3.5 py-2 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl"
      style={{ ...beside, top: pct((top + bottom) / 2, H) }}
    >
      <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/70 to-transparent" />
      <span className="label block text-[max(0.58rem,9px)] text-gold-lit">{tower.label}</span>
      <span className="mt-1 block font-display text-[clamp(1.05rem,2.4vh,1.6rem)] leading-none uppercase tracking-[0.06em]">{floorName(floor.n)}</span>
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
  const art = useRef(null)
  const marks = useRef(null)
  const bands = useRef(new Map())
  const { go } = useNav()
  const [lit, setLit] = useState(null)
  // the one floor the keyboard tabs to: the lowest of the first tower, then the last one focused
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
      let { left, bottom } = r
      if (beside) left = Math.max(left, p.right + 24)
      else bottom = Math.min(bottom, p.top - 16)
      const width = Math.max(r.right - left, 1)
      const height = Math.max(bottom - r.top, 1)
      const fitted = Math.min(width / F.w, height / F.h)
      const s = beside ? Math.max(fitted, stage.width / W, stage.height / H) : fitted
      // a picture larger than the screen keeps covering it; one narrower stays centred on the towers,
      // and one shorter keeps its top at the top
      const wantX = left - stage.left + width / 2 - (F.x + F.w / 2) * s
      const wantY = r.top - stage.top + height / 2 - (F.y + F.h / 2) * s
      const x = W * s >= stage.width ? clamp(wantX, stage.width - W * s, 0) : wantX
      const y = H * s >= stage.height ? clamp(wantY, stage.height - H * s, 0) : Math.min(0, wantY)
      for (const el of [art.current, marks.current]) {
        el.style.width = `${W * s}px`
        el.style.height = `${H * s}px`
        el.style.translate = `${x}px ${y}px`
      }
      art.current.style.maskImage = art.current.style.webkitMaskImage = beside ? '' : 'linear-gradient(to bottom, #000 78%, transparent)'
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(root.current)
    ro.observe(words.current)
    return () => ro.disconnect()
  }, [])

  const open = (tower, floor) => go('residences', `?tower=${tower.id}&floor=${floor.n}`)

  const onKey = (e, key) => {
    const { tower, side, floor } = FLOORS.get(key)
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open(tower, floor)
      return
    }
    const to = {
      ArrowUp: [side, floor.n + 1],
      ArrowDown: [side, floor.n - 1],
      ArrowLeft: [side - 1, floor.n],
      ArrowRight: [side + 1, floor.n],
      Home: [side, tower.floors[0].n],
      End: [side, tower.floors.at(-1).n],
    }[e.key]
    if (!to) return
    e.preventDefault()
    const next = BUILDING.towers[clamp(to[0], 0, BUILDING.towers.length - 1)]
    bands.current.get(`${next.id}.${to[1]}`)?.focus()
  }

  const tag = lit && FLOORS.get(lit)

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
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" role="group" aria-label="Floors of homes, each opening its plan">
          <g aria-hidden="true" className="pointer-events-none">
            {BUILDING.towers.flatMap((tower) =>
              tower.floors.map((floor) => <polygon key={`${tower.id}.${floor.n}`} data-sweep={floor.n} points={floor.points} className="fill-gold-deep/55 opacity-0" />),
            )}
          </g>
          {BUILDING.towers.map((tower) => (
            <g key={tower.id} role="group" aria-label={tower.label}>
              {tower.floors.map((floor) => {
                const key = `${tower.id}.${floor.n}`
                return (
                  <polygon
                    key={key}
                    ref={(el) => {
                      bands.current.set(key, el)
                      return () => bands.current.delete(key)
                    }}
                    points={floor.points}
                    role="link"
                    tabIndex={key === current ? 0 : -1}
                    aria-label={`${tower.label}, ${floorName(floor.n)}`}
                    onPointerEnter={() => setLit(key)}
                    onPointerLeave={() => setLit((k) => (k === key ? null : k))}
                    onFocus={() => {
                      setLit(key)
                      setCurrent(key)
                    }}
                    onBlur={() => setLit((k) => (k === key ? null : k))}
                    onClick={() => open(tower, floor)}
                    onKeyDown={(e) => onKey(e, key)}
                    vectorEffect="non-scaling-stroke"
                    className={`cursor-pointer outline-none transition-[fill,stroke] duration-300 ${
                      key === lit ? 'fill-forest-900/55 stroke-gold-lit stroke-2' : 'fill-transparent stroke-transparent stroke-1 pointer-coarse:stroke-ivory/30'
                    }`}
                  />
                )
              })}
            </g>
          ))}
        </svg>

        {BUILDING.towers.map((tower) => {
          const [left, top, right] = FLOORS.get(`${tower.id}.${tower.floors.at(-1).n}`).box
          return (
            <p
              key={tower.id}
              data-in
              aria-hidden="true"
              className="label pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap text-[max(0.62rem,9px)] text-ivory [text-shadow:0_1px_10px_rgb(0_0_0/0.6)]"
              style={{ left: pct((left + right) / 2, W), top: pct(top - 330, H) }}
            >
              {tower.label}
            </p>
          )
        })}
        {tag && <FloorTag {...tag} />}
      </div>

      {/* taps go through the words to any floor beneath them; only the switch takes its own */}
      <div ref={words} className="pointer-events-none absolute inset-x-(--gutter) bottom-[calc(var(--chrome-bot)+1.25rem)] landscape:right-auto landscape:bottom-auto landscape:top-1/2 landscape:w-[clamp(15rem,28vw,31rem)] landscape:-translate-y-1/2">
        <p data-in className="eyebrow text-gold-lit">Residences</p>
        <div data-in className="pointer-events-auto mt-[2vh] max-w-sm">
          <ModeSwitch tone="dark" />
        </div>
        <h2 data-in className="display mt-[3vh] text-[clamp(1.9rem,5vh,3rem)] font-light lg:text-[clamp(2.2rem,6vh,4.4rem)]">
          Find your
          <br />
          residence
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
