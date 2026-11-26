import { lazy, Suspense, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap, useGSAP, reduced } from '../gsap/gsapConfig'
import { useIntro } from '../hooks/useIntro'
import { useScrub } from '../hooks/useScrub'
import { useNav } from '../app/nav'
import { facingOf, FLOOR_PLANS, floorName, MOST_COMPARED, TOWERS, unitOf, viewFloor } from '../data/content'
import { finder } from '../data/finder'
import { BUILDING } from '../data/residences'
import { SCENES } from '../data/scenes'
import { Icon, Segmented, Swap } from '../components/ui'
import ZoomPan from '../components/ZoomPan'
import Botanical from '../art/Botanical'
import ModeSwitch from './ModeSwitch'

const PanoramaViewer = lazy(() => import('../components/PanoramaViewer'))

const PLAN_MODES = [
  { id: 'floor', label: 'Floor plan' },
  { id: 'unit', label: 'Unit plan' },
]
// Both towers, as pills: only the one on offer can be picked.
const towerPills = (on) => TOWERS.map((t) => (t.id === on ? t : { ...t, disabled: true, title: `${t.label} is not on offer` }))

// a floor's box on the picture, [left, top, right, bottom]
function boxOf(points) {
  const n = points.split(/[\s,]+/).map(Number)
  const xs = n.filter((_, i) => i % 2 === 0)
  const ys = n.filter((_, i) => i % 2 === 1)
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}

/**
 * The tower, large, cut from the picture of both: every floor of homes traced on it, the open one lit.
 * A floor lights under the pointer and its number stands large in the sky beside it (as the Rustomjee
 * app's has it); a click opens it, and from the keyboard the arrows go up and down. The picture is cut
 * to the frame's shape: the tower from its crown to its podium, with the sky to its left (the other
 * tower stands just to its right, and stays out).
 */
function TowerPicker({ tower, floor, onPick, onBack, className = '' }) {
  const frame = useRef(null)
  const [hover, setHover] = useState(null)
  // the viewBox, and the frame's size in pixels
  const [cut, setCut] = useState(null)
  const boxes = useMemo(() => new Map(tower.floors.map((f) => [f.n, boxOf(f.points)])), [tower])
  const [L, T, R, B] = useMemo(() => [...boxes.values()].reduce((a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]), [boxes])

  useLayoutEffect(() => {
    const fit = () => {
      const { width: cw, height: ch } = frame.current.getBoundingClientRect()
      if (!cw || !ch) return
      const side = 110
      let y = T - 430
      let h = B + 260 - y
      let w = (h * cw) / ch
      const least = R - L + 2 * side
      let x
      if (w >= least) x = R + side - w
      else {
        // a frame narrower than the tower's shape keeps the tower whole, with sky above and ground below
        w = least
        x = L - side
        const tall = (w * ch) / cw
        y -= (tall - h) / 2
        h = tall
      }
      setCut({ x, y, w, h, cw, ch })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(frame.current)
    return () => ro.disconnect()
  }, [L, T, R, B])

  // a finger run down the tower shows each floor's number as it passes, and opens the one let go on
  // (landscape, where the tower stands beside the plan; upright, the page scrolls past it and a tap
  // picks)
  const scrub = useScrub({
    onOver: setHover,
    onPick: (n) => {
      setHover(null)
      if (n !== floor.n) onPick(n)
    },
  })
  const index = tower.floors.indexOf(floor)
  const onKey = (e) => {
    const to = {
      ArrowUp: index + 1,
      ArrowRight: index + 1,
      ArrowDown: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tower.floors.length - 1,
    }[e.key]
    if (to === undefined) return
    e.preventDefault()
    const next = tower.floors[Math.min(tower.floors.length - 1, Math.max(0, to))]
    if (next !== floor) onPick(next.n)
  }

  // the number of the floor under the pointer, or of the open one, in the sky left of the tower,
  // as large as that strip of sky allows
  const shown = hover ?? floor.n
  const [, top, , bottom] = boxes.get(shown)
  const sky = cut ? ((L - cut.x) / cut.w) * cut.cw : 0
  const size = cut ? Math.min(sky * 0.5, cut.ch * 0.11) : 0
  const [suffix] = floorName(shown).match(/[a-z]+/)

  return (
    <div ref={frame} className={`relative overflow-hidden rounded-[1.25rem] bg-forest-950 shadow-[0_40px_80px_-44px_rgb(20_52_41/0.75)] ring-1 ring-forest-900/10 ${className}`}>
      {cut && (
        <svg
          viewBox={`${cut.x} ${cut.y} ${cut.w} ${cut.h}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 size-full rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-lit landscape:touch-none"
          role="slider"
          tabIndex={0}
          aria-label={`Floor of ${tower.label}`}
          aria-valuemin={tower.floors[0].n}
          aria-valuemax={tower.floors.at(-1).n}
          aria-valuenow={floor.n}
          aria-valuetext={floorName(floor.n)}
          onKeyDown={onKey}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(null)}
          {...scrub}
        >
          <image href={BUILDING.image} width={BUILDING.width} height={BUILDING.height} preserveAspectRatio="none" />
          {tower.floors.map((f) => {
            const on = f === floor
            const lit = f.n === hover && !on
            return (
              <polygon
                key={f.n}
                points={f.points}
                data-floor={f.n}
                vectorEffect="non-scaling-stroke"
                onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(f.n)}
                onClick={() => !on && onPick(f.n)}
                className={`transition-[fill,stroke] duration-300 ${on ? 'fill-ember/85 stroke-white stroke-[1.5]' : lit ? 'cursor-pointer fill-ivory/45 stroke-gold-lit stroke-[1.5]' : 'cursor-pointer fill-transparent stroke-transparent'}`}
              />
            )
          })}
        </svg>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-forest-950/55 to-transparent" />
      {cut && sky > 56 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center text-ivory [text-shadow:0_2px_20px_rgb(0_0_0/0.5)]"
          style={{
            left: sky / 2,
            top: `${(((top + bottom) / 2 - cut.y) / cut.h) * 100}%`,
          }}
        >
          <span className="block font-display leading-[0.85] font-light transition-colors duration-300" style={{ fontSize: size }}>
            {shown}
            <span className="align-top text-[0.32em]">{suffix}</span>
          </span>
          <span className="label mt-1 block text-[max(0.55rem,8.5px)] text-gold-lit">{hover && hover !== floor.n ? 'Open' : 'Floor'}</span>
        </div>
      )}

      <button
        onClick={onBack}
        className="label absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-ivory/15 bg-forest-950/60 px-3 py-2 text-[max(0.55rem,8.5px)] text-ivory backdrop-blur-md transition-colors duration-300 hover:border-gold/60 hover:text-gold-lit"
      >
        <span aria-hidden="true">←</span>
        Towers
      </button>
    </div>
  )
}

function Step({ up = false, disabled, onClick }) {
  const label = up ? 'The floor above' : 'The floor below'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-full border border-forest-900/20 transition-colors [@media(max-height:32rem)]:size-8 duration-300 hover:border-forest-900 hover:bg-forest-900 hover:text-ivory active:scale-95 disabled:pointer-events-none disabled:opacity-30"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
      </svg>
    </button>
  )
}

// The home picked on the plan: what it is, its own plan (which opens large in the plan's place) and
// rooms, and the ways on from it, the view from it and a comparison.
function FlatPanel({ tower, floor, flat, mode, onClose, onView, onMode }) {
  const { go } = useNav()
  const unit = unitOf(flat)
  const view = viewFloor(tower.id, floor.n)
  // this home goes into the unit finder's tray, for the visitor to pick the homes to set beside it
  const toCompare = () => {
    finder.picked = [...new Set([unit.id, ...finder.picked])].slice(0, MOST_COMPARED)
    go('residences', '?units')
  }

  return (
    // on a short screen the drawing gives way first, then the room list down to a few rows, and past
    // that the panel scrolls, so its buttons are always reachable
    <div
      role="region"
      aria-label={`${unit.label}, ${unit.type}`}
      className="flex h-full flex-col overflow-y-auto rounded-[1.25rem] bg-white p-[clamp(1rem,2.2vh,1.5rem)] shadow-[0_40px_80px_-40px_rgb(20_52_41/0.55)] ring-1 ring-forest-900/10 [scrollbar-width:none]"
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p className="label text-[max(0.58rem,9px)] text-ink/60">
            {tower.label} · {floorName(floor.n)}
          </p>
          <h3 className="display mt-1.5 text-[clamp(1.6rem,4vh,2.6rem)] text-ember-deep">{unit.label}</h3>
          <p className="label mt-1 text-[max(0.6rem,9px)] text-forest-800">{unit.type}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          title="Close"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-forest-900/15 transition-colors duration-300 hover:border-forest-900/45"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <button
        onClick={() => onMode('unit')}
        aria-label={`${unit.label}: open the unit plan large`}
        title="Open the unit plan"
        className="group mt-[1.6vh] shrink-0 [@media(max-height:32rem)]:hidden overflow-hidden rounded-[0.9rem] bg-paper/60 p-2 ring-1 ring-forest-900/10"
      >
        <img
          src={unit.plan}
          alt={`${unit.label} floor plan`}
          draggable="false"
          className="max-h-[22vh] min-h-16 w-full object-contain transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03]"
        />
      </button>

      {/* a short screen (a phone on its side) has no room for the drawing, nor for the switch over the
          plan, so the switch is here */}
      <Segmented items={PLAN_MODES} value={mode} onChange={onMode} size="sm" className="mt-3 hidden shrink-0 [@media(max-height:32rem)]:grid" />

      {/* a 3 BHK has more rooms than fit, and touch screens show no scrollbar */}
      <div tabIndex={0} role="region" aria-label="Room sizes" className="more-below paper-scrollbar mt-[1.6vh] min-h-[5.5rem] flex-1 overflow-y-auto pr-2">
        <dl className="text-[clamp(0.78rem,1.55vh,0.92rem)]">
          {unit.rooms.map(([name, size]) => (
            <div key={name} className="flex justify-between gap-3 border-t border-forest-900/10 py-[0.55vh] first:border-t-0">
              <dt className="text-ink/70">{name}</dt>
              <dd className="whitespace-pre-line text-right">{size}</dd>
            </div>
          ))}
        </dl>
      </div>

      <button onClick={onView} className="btn btn-solid mt-[1.6vh] w-full shrink-0 whitespace-nowrap sideways:px-3 sideways:tracking-[0.12em]">
        <Icon name="turn" className="size-4" />
        View from this home
      </button>
      {view.id !== floor.n && (
        <p className="mt-1.5 shrink-0 text-center [@media(max-height:32rem)]:hidden text-[max(0.68rem,10px)] text-ink/55">
          Seen from the {floorName(view.id).toLowerCase()}, the nearest with a 360° view
        </p>
      )}
      <button onClick={toCompare} className="btn mt-2 w-full shrink-0 text-forest-900">
        <Icon name="compare" className="size-4" />
        Compare
      </button>
    </div>
  )
}

/**
 * The view from a home, over the floor's plan rather than off to the Views section: the 360° view from
 * the nearest floor that has one, turned the way the home looks out. The × (or Esc) closes it, back to
 * the plan as it was.
 */
function HomeView({ tower, floor, flat, onClose }) {
  const root = useRef(null)
  const closer = useRef(null)
  const unit = unitOf(flat)
  const view = viewFloor(tower.id, floor.n)
  const [facing] = useState(() => facingOf(flat))
  const close = useEffectEvent(() => onClose())

  useGSAP(
    () => {
      if (reduced()) return
      gsap.fromTo(
        root.current,
        { clipPath: 'inset(8% 8% 8% 8% round 1.5rem)', autoAlpha: 0 },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0rem)',
          autoAlpha: 1,
          duration: 0.9,
          ease: 'expo.out',
        },
      )
      gsap.from('[data-view-in]', {
        y: 16,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.06,
        delay: 0.3,
      })
    },
    { scope: root },
  )

  // Esc closes the view (and only the view); the focus starts on the × and goes back after
  useEffect(() => {
    const back = document.activeElement
    closer.current?.focus()
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopImmediatePropagation()
      close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      back?.focus?.()
    }
  }, [])

  return (
    <div ref={root} role="dialog" aria-modal="true" aria-label={`The view from ${unit.label}`} className="absolute inset-0 z-50 bg-forest-950 text-ivory">
      <Suspense fallback={null}>
        <PanoramaViewer scenes={SCENES} active={view.key} autorotate={false} mouseViewMode="drag" facing={facing} />
      </Suspense>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[22vh] bg-linear-to-b from-forest-950/65 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[30vh] bg-linear-to-t from-forest-950/80 to-transparent" />

      <button
        ref={closer}
        onClick={onClose}
        aria-label="Close the view"
        title="Close the view"
        className="absolute right-(--gutter) top-[calc((var(--chrome-top)-2.75rem)/2)] z-10 grid size-11 place-items-center rounded-full border border-ivory/20 bg-forest-950/70 text-ivory shadow-[0_12px_30px_-12px_rgb(0_0_0/0.7)] backdrop-blur-xl transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-forest-950 active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <div className="pointer-events-none absolute bottom-[calc(var(--chrome-bot)+var(--watermark-h)+0.75rem)] left-(--gutter) max-w-[min(30rem,calc(100%-2*var(--gutter)))] [text-shadow:0_1px_14px_rgb(0_0_0/0.5)]">
        <p data-view-in className="label text-[max(0.6rem,9px)] text-gold-lit">
          {tower.label} · {floorName(floor.n)} · {unit.type}
        </p>
        <h2 data-view-in className="display mt-2 text-[clamp(1.8rem,5vh,3.4rem)] font-light">
          The view from {unit.label}
        </h2>
        <p data-view-in className="mt-2 text-[clamp(0.78rem,1.6vh,0.95rem)] text-ivory/75">
          {view.id !== floor.n ? `Seen from the ${floorName(view.id).toLowerCase()}, the nearest with a 360° view. ` : ''}
          <span className="pointer-coarse:hidden">Drag to look around.</span>
          <span className="hidden pointer-coarse:inline">Swipe to look around.</span>
        </p>
      </div>
    </div>
  )
}

/**
 * Visual Selection's second step, as the Rustomjee app lays its floors out: the tower large on the
 * left, to hover and pick any floor from; the floor's plan large beside it, its six homes outlined. A
 * home opens its details in a panel (beside the plan on a wide screen, a sheet over it on a tall one),
 * its own plan can take the floor plan's place, and the view from it opens over the page and closes
 * back to it.
 */
export default function FloorPlan({ at }) {
  const root = useRef(null)
  const { go } = useNav()
  const [hover, setHover] = useState(null)
  const [mode, setMode] = useState('floor')
  const [viewing, setViewing] = useState(false)
  useIntro(root)

  const { tower, floor, flat } = at
  const plan = FLOOR_PLANS.find((p) => p.id === tower.id)
  const lit = plan.flats.find((f) => f.id === hover)
  // the floors next to this one in the tower, as traced
  const index = tower.floors.indexOf(floor)
  const [below, above] = [tower.floors[index - 1], tower.floors[index + 1]]
  // a choice replaces the address, so a reload comes back to it
  const show = (n, home = flat) => go('residences', `?tower=${tower.id}&floor=${n}${home ? `&flat=${home.id}` : ''}`, { replace: true })
  const toTowers = () => go('residences')

  // the panel keeps the home it showed while it slides away
  const [panelFlat, setPanelFlat] = useState(flat)
  if (flat && flat !== panelFlat) setPanelFlat(flat)
  // a home's own plan shows only while a home is picked
  const unit = flat && unitOf(flat)
  const showing = unit ? mode : 'floor'

  // Esc closes the panel before it would leave the page (the view, open over it, closes first)
  useEffect(() => {
    if (!flat || viewing) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      go('residences', `?tower=${tower.id}&floor=${floor.n}`, {
        replace: true,
      })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [flat, viewing, tower.id, floor.n, go])

  const [number, word] = floorName(floor.n).split(' ')

  return (
    <section ref={root} className="screen bg-paper text-forest-900 [--panel-w:clamp(19rem,24vw,27rem)] [--tower-w:clamp(10rem,23vw,27rem)] sideways:[--panel-w:clamp(15rem,34vw,19rem)]">
      <Botanical kind="fern" seed={12} depth={14} className="bottom-(--chrome-bot) left-0 w-[12vw] text-forest-700/12" />

      <div className="safe pane h-full">
        {/* landscape (a phone on its side too): the tower down the left, the plan beside it; upright,
            the tower and its pills above the plan */}
        <div className="grid min-h-full grid-rows-[auto_auto_minmax(20rem,1fr)] gap-[2vh] landscape:h-full landscape:grid-cols-[var(--tower-w)_minmax(0,1fr)] landscape:grid-rows-[auto_minmax(0,1fr)] landscape:gap-x-[2vw]">
          {/* the two ways in, at the top, just under the sound switch */}
          <div data-in className="w-[min(100%,22rem)] landscape:w-full">
            <ModeSwitch />
          </div>

          {/* the tower to pick floors from: large down the left of a wide screen; on a tall one, beside
              the tower pills */}
          <div className="flex min-h-0 gap-4 landscape:col-start-1 landscape:row-start-2">
            <div data-fade className="h-[clamp(11rem,28vh,21rem)] w-[clamp(7.5rem,30vw,13rem)] shrink-0 landscape:h-full landscape:w-full">
              <TowerPicker tower={tower} floor={floor} onPick={(n) => show(n)} onBack={toTowers} className="size-full" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-end gap-3 landscape:hidden">
              <p className="copy text-ink/70">Six homes on every floor, around a central lobby with six lifts.</p>
              <Segmented items={towerPills(tower.id)} value={tower.id} onChange={() => {}} size="sm" className="w-[min(100%,15rem)]" />
            </div>
          </div>

          {/* the plan, large; on a wide screen it draws back to make room for the panel, and its foot
              keeps the zoom buttons clear of the watermark */}
          <div className="relative mb-[calc(var(--watermark-h)+0.75rem)] min-h-0 landscape:col-start-2 landscape:row-span-2 landscape:row-start-1">
            <div
              data-fade
              className={`absolute inset-y-0 left-0 right-0 flex flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[0_40px_80px_-48px_rgb(20_52_41/0.55)] ring-1 ring-forest-900/10 transition-[right] duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${flat ? 'landscape:right-[calc(var(--panel-w)+2vw)]' : ''}`}
            >
              <header className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-[clamp(1rem,1.8vw,1.75rem)] pt-[clamp(0.6rem,2vh,1.4rem)]">
                <div className="flex min-w-0 items-center gap-[clamp(0.75rem,1.2vw,1.25rem)]">
                  <div className="min-w-0">
                    <p className="label truncate text-[max(0.58rem,9px)] text-ink/55 [@media(max-height:32rem)]:hidden">
                      {tower.label} · {lit ? `Flat ${lit.id} · ${lit.type}` : unit ? `${unit.label} · ${unit.type}` : 'Tap a home for its details'}
                    </p>
                    <Swap id={floor.n}>
                      <h2 data-swap className="display mt-1 whitespace-nowrap text-[clamp(1.35rem,4.4vh,3.1rem)] text-forest-800">
                        {number} {word}
                      </h2>
                    </Swap>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Step up disabled={!above} onClick={() => show(above.n)} />
                    <Step disabled={!below} onClick={() => show(below.n)} />
                  </div>
                </div>
                {unit && <Segmented items={PLAN_MODES} value={showing} onChange={setMode} size="sm" className="w-[min(100%,15rem)] [@media(max-height:32rem)]:hidden" />}
              </header>

              <div className="relative mt-1 min-h-0 flex-1">
                <Swap id={showing === 'unit' ? unit.id : plan.id} className="absolute inset-0">
                  <div data-swap className="absolute inset-0">
                    {showing === 'unit' ? (
                      <ZoomPan key={unit.id} src={unit.plan} alt={`${unit.label}, ${unit.type}, floor plan`} aspect={unit.aspect} className="absolute inset-0" />
                    ) : (
                      <ZoomPan key={plan.id} src={plan.plan} alt={`${plan.label} typical floor plan`} aspect={plan.aspect} className="absolute inset-0">
                        {/* the homes, traced on the plan: brighter under the pointer, and each opens its details */}
                        <svg viewBox={plan.viewBox} className="absolute inset-0 size-full" role="group" aria-label={`Homes on the ${floorName(floor.n).toLowerCase()}`}>
                          {plan.flats.map((f) => {
                            const on = flat?.id === f.id
                            const pick = () => show(floor.n, on ? null : f)
                            return (
                              <polygon
                                key={f.id}
                                points={f.shape}
                                role="button"
                                tabIndex={0}
                                aria-pressed={on}
                                aria-label={`Flat ${f.id}, ${f.type}`}
                                onClick={pick}
                                onKeyDown={(e) => {
                                  if (e.key !== 'Enter' && e.key !== ' ') return
                                  e.preventDefault()
                                  pick()
                                }}
                                onPointerEnter={() => setHover(f.id)}
                                onPointerLeave={() => setHover(null)}
                                onFocus={() => setHover(f.id)}
                                onBlur={() => setHover(null)}
                                vectorEffect="non-scaling-stroke"
                                className={`cursor-pointer stroke-2 outline-none transition-[fill,stroke] duration-300 ${
                                  on
                                    ? 'fill-ember-deep/60 stroke-ember-deep'
                                    : 'fill-ember/20 stroke-ember/65 hover:fill-ember/50 hover:stroke-ember-deep focus-visible:fill-ember/50 focus-visible:stroke-ember-deep'
                                }`}
                              />
                            )
                          })}
                        </svg>
                      </ZoomPan>
                    )}
                  </div>
                </Swap>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* landscape: the towers as pills at the foot, centred under the tower's picture, beside the dock
          and as tall as it */}
      <div className="absolute bottom-(--dock-lift) left-(--gutter) z-10 hidden w-(--tower-w) justify-center landscape:flex">
        <div data-in>
          <Segmented
            items={towerPills(tower.id)}
            value={tower.id}
            onChange={() => {}}
            tone="dark"
            size="sm"
            className="h-[calc(var(--dock-item)+0.5rem+2px)] w-[clamp(9rem,14vw,16rem)] border border-ivory/10 bg-forest-950/80! shadow-[0_24px_60px_-24px_rgb(0_0_0/0.8)] backdrop-blur-xl"
          />
        </div>
      </div>

      {/* the home's panel: beside the plan on a landscape screen, a sheet above the dock on a tall one */}
      <div
        inert={!flat}
        className={`absolute inset-x-(--gutter) bottom-[calc(var(--chrome-bot)+var(--watermark-h)+0.75rem)] z-20 h-[min(44rem,64vh)] max-h-[calc(100%-var(--chrome-top)-var(--chrome-bot)-var(--watermark-h)-0.75rem)] transition-[translate,opacity] duration-700 ease-[cubic-bezier(.16,1,.3,1)] landscape:left-auto landscape:top-(--chrome-top) landscape:h-auto landscape:max-h-none landscape:w-(--panel-w) ${
          flat ? '' : 'pointer-events-none translate-y-8 opacity-0 landscape:translate-x-8 landscape:translate-y-0'
        }`}
      >
        {panelFlat && <FlatPanel tower={tower} floor={floor} flat={panelFlat} mode={showing} onClose={() => show(floor.n, null)} onView={() => setViewing(true)} onMode={setMode} />}
      </div>

      {viewing && flat && <HomeView tower={tower} floor={floor} flat={flat} onClose={() => setViewing(false)} />}
    </section>
  )
}
