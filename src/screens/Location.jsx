import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { setCovered } from '../app/gate'
import { playClick, preloadClick } from '../app/sound'
import { useIntro } from '../hooks/useIntro'
import { LOCATION } from '../data/content'
import { Icon, Swap } from '../components/ui'
import { gsap, reduced } from '../gsap/gsapConfig'
import { Mark } from '../art/Brand'
import { KINDS, PLACES, isHood, kindIndices, kindOf, placeIndex } from '../world/stops'

const World = lazy(() => import('../world/World'))

// a kind of place, singular
const TYPE = { school: 'School', hospital: 'Hospital', mall: 'Shopping', club: 'Club', road: 'Connectivity' }
const kindLabel = (type) => KINDS.find(([t]) => t === type)?.[1] ?? type

// Phones and portrait tablets stack the page; the map then frames its subject above the sheet. A
// phone held sideways (the way it's meant to be held) is too short for that: its controls and sheet
// stand in a column down the left instead, and the map frames its subject in the space to the right.
const STACKED = '(width < 64rem), (orientation: portrait)'
const SIDEWAYS = '(width < 64rem) and (orientation: landscape)'
const watch = (query) => (cb) => {
  const q = window.matchMedia(query)
  q.addEventListener('change', cb)
  return () => q.removeEventListener('change', cb)
}
const onStacked = watch(STACKED)
const onSideways = watch(SIDEWAYS)
const STACKED_INSET = { top: 0.18, bottom: 0.5 }
const SIDEWAYS_INSET = { top: 0.12, bottom: 0.18, left: 0.46 }
const SLATE = { '--color-forest-950': '#18222d', '--color-forest-900': '#1f2b38', '--color-forest-800': '#2a3a4a' }

function ModeSwitch({ hood, onChange, className = '' }) {
  return (
    <div role="tablist" className={`relative grid grid-cols-2 rounded-full border border-ivory/15 bg-forest-950/40 p-1 backdrop-blur-md ${className}`}>
      <span className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-gold transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${hood ? 'translate-x-full' : ''}`} />
      {[
        ['The Reserve', false],
        ['Neighbourhood', true],
      ].map(([label, h]) => (
        <button
          key={label}
          role="tab"
          aria-selected={hood === h}
          onClick={() => onChange(h)}
          className={`label relative z-10 whitespace-nowrap rounded-full px-4 py-2.5 text-[0.62rem] transition-colors duration-500 [@media(max-height:32rem)]:px-2 [@media(max-height:32rem)]:py-2 [@media(max-height:32rem)]:tracking-[0.1em] ${hood === h ? 'text-forest-950' : 'text-ivory/70 hover:text-ivory'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// Day or night over the map (night.js): a sun and a moon, the one on show filled
function DayNight({ night, onChange, className = '' }) {
  const ICONS = {
    day: 'M12 4v1.6M12 18.4V20M4 12h1.6M18.4 12H20M6.3 6.3l1.2 1.2M16.5 16.5l1.2 1.2M6.3 17.7l1.2-1.2M16.5 7.5l1.2-1.2M12 8.6a3.4 3.4 0 100 6.8 3.4 3.4 0 000-6.8z',
    night: 'M19 14.6A7.5 7.5 0 019.4 5a7.5 7.5 0 109.6 9.6z',
  }
  return (
    <div role="group" aria-label="Time of day" className={`relative grid grid-cols-2 rounded-full border border-ivory/15 bg-forest-950/40 p-1 backdrop-blur-md ${className}`}>
      <span className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-gold transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${night ? 'translate-x-full' : ''}`} />
      {[
        ['day', false],
        ['night', true],
      ].map(([id, n]) => (
        <button
          key={id}
          onClick={() => onChange(n)}
          aria-pressed={night === n}
          aria-label={n ? 'Night' : 'Day'}
          title={n ? 'Night' : 'Day'}
          className={`relative z-10 grid size-9 place-items-center rounded-full transition-colors duration-500 ${night === n ? 'text-forest-950' : 'text-ivory/70 hover:text-ivory'}`}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ICONS[id]} />
          </svg>
        </button>
      ))}
    </div>
  )
}

// A kind's button in the bar: its icon over its name, filled from the foot (as the Rustomjee app's
// are) while it is the kind on show, or its places are open above it.
function BarButton({ on, open, onClick, label, children, ...aria }) {
  return (
    <button
      onClick={onClick}
      {...aria}
      className={`group label relative flex min-w-[clamp(3.6rem,7vw,6rem)] flex-col items-center gap-1 overflow-hidden rounded-[0.7rem] px-[clamp(0.35rem,0.9vw,0.9rem)] py-[clamp(0.4rem,1vh,0.6rem)] text-[max(0.5rem,8px)] tracking-[0.08em] text-ivory outline-none transition-colors duration-500 focus-visible:ring-1 focus-visible:ring-gold-lit/70 sm:tracking-[0.12em] [@media(max-height:32rem)]:gap-0.5 [@media(max-height:32rem)]:py-1`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-0 origin-bottom rounded-[inherit] transition-[scale,background-color] duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] ${
          on ? 'scale-y-100 bg-gold' : open ? 'scale-y-100 bg-gold/25' : 'scale-y-0 bg-gold/20 group-hover:scale-y-100'
        }`}
      />
      <span className={`relative transition-colors duration-500 ${on ? 'text-forest-950' : open ? 'text-gold-lit' : 'text-ivory/75 group-hover:text-gold-lit'}`}>{children}</span>
      <span className={`relative whitespace-nowrap transition-colors duration-500 ${on ? 'text-forest-950' : 'text-ivory/70 group-hover:text-ivory'}`}>{label}</span>
    </button>
  )
}

/*
 * The neighbourhood's places as the Rustomjee app's map shows them: a bar of kinds just above the
 * dock. A kind lights every place of that kind on the map, with their drives, and opens its places
 * in a list rising from its button; picking one flies there and brings its card in. The list can be
 * opened again at any time (the kind's button), to pick another, and a tap outside it or Esc puts
 * it away. Overview shows them all.
 */
function PlacesBar({ show, stop, open, onOpen, onStop }) {
  const wrap = useRef(null)
  const list = useRef(null)
  const [left, setLeft] = useState(0)
  const kind = kindOf(stop)
  const pi = placeIndex(stop)
  const shown = kind ?? PLACES[pi]?.type ?? null
  const places = open ? kindIndices(open).map((i) => ({ ...PLACES[i], i })) : []

  // the list stands over its button, kept on the screen
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const w = wrap.current?.getBoundingClientRect()
      const b = wrap.current?.querySelector(`[data-kind="${open}"]`)?.getBoundingClientRect()
      const lw = list.current?.offsetWidth ?? 0
      if (!w || !b) return
      const edge = 8
      const x = b.left + b.width / 2 - lw / 2
      setLeft(Math.min(Math.max(x, edge), window.innerWidth - edge - lw) - w.left)
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

  // it rises in, its places one after another
  useLayoutEffect(() => {
    if (!open || !list.current || reduced()) return
    const tl = gsap.timeline()
    tl.fromTo(list.current, { autoAlpha: 0, y: 14, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.6)' })
    tl.fromTo(list.current.querySelectorAll('li'), { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' }, 0.05)
    return () => tl.kill()
  }, [open])

  // a tap outside the bar, or Esc, puts the list away
  useEffect(() => {
    if (!open) return
    const out = (e) => !wrap.current?.contains(e.target) && onOpen(null)
    const key = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onOpen(null)
      wrap.current?.querySelector(`[data-kind="${open}"]`)?.focus()
    }
    document.addEventListener('pointerdown', out)
    window.addEventListener('keydown', key, true)
    return () => {
      document.removeEventListener('pointerdown', out)
      window.removeEventListener('keydown', key, true)
    }
  }, [open, onOpen])

  const tapKind = (type) => {
    if (open === type) return onOpen(null)
    onOpen(type)
    // the map lights the kind, unless one of its places is already on show
    if (shown !== type) onStop(`kind-${type}`)
  }

  return (
    <div
      ref={wrap}
      inert={!show}
      className={`absolute bottom-[calc(var(--dock-band)+0.25rem)] left-1/2 z-20 -translate-x-1/2 max-[520px]:bottom-[calc(var(--dock-band)+var(--watermark-h)+0.25rem)] transition-[opacity,translate] duration-700 ${show ? '' : 'pointer-events-none translate-y-3 opacity-0'}`}
    >
      {open && (
        <div
          ref={list}
          id="places-list"
          style={{ left }}
          className="absolute bottom-full mb-2 w-max max-w-[calc(100vw-1rem)] rounded-[0.9rem] border border-ivory/12 bg-forest-950/80 p-1.5 text-ivory shadow-[0_30px_70px_-24px_rgb(0_0_0/0.85)] backdrop-blur-xl"
        >
          <p className="label px-3 pb-1 pt-1.5 text-[max(0.5rem,8px)] text-gold-lit/80 [@media(max-height:32rem)]:hidden">{kindLabel(open)}</p>
          <ul role="listbox" aria-label={kindLabel(open)} className="max-h-[min(46vh,22rem)] overflow-y-auto overscroll-contain [scrollbar-width:none] [@media(max-height:32rem)]:max-h-[38vh]">
            {places.map((p) => {
              const on = p.i === pi
              return (
                <li key={p.name}>
                  <button
                    role="option"
                    aria-selected={on}
                    onClick={() => onStop(`place-${p.i}`)}
                    className={`flex w-full items-center gap-[clamp(0.75rem,2vw,2rem)] rounded-[0.6rem] px-3 py-[clamp(0.45rem,1.1vh,0.7rem)] text-left outline-none transition-colors duration-300 focus-visible:ring-1 focus-visible:ring-gold-lit/70 ${on ? 'bg-gold text-forest-950' : 'hover:bg-gold/20'}`}
                  >
                    <span className={`font-display text-[clamp(1rem,2.2vh,1.4rem)] leading-tight ${on ? 'text-forest-950' : 'text-ivory'}`}>{p.name}</span>
                    <span className={`ml-auto whitespace-nowrap font-display text-[clamp(0.85rem,1.8vh,1.05rem)] italic ${on ? 'text-forest-950/80' : 'text-gold-lit'}`}>{p.mins} min</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <nav aria-label="Places nearby" className="flex items-stretch gap-0.5 rounded-[0.95rem] border border-ivory/12 bg-forest-950/70 p-1 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.8)] backdrop-blur-xl sm:gap-1">
        <BarButton label="Overview" on={stop === 'neighbourhood'} onClick={() => (onOpen(null), onStop('neighbourhood'))} aria-pressed={stop === 'neighbourhood'}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8.5" strokeDasharray="1.5 2.5" />
          </svg>
        </BarButton>
        {KINDS.map(([type, label]) => (
          <BarButton
            key={type}
            data-kind={type}
            label={label}
            on={shown === type}
            open={open === type}
            onClick={() => tapKind(type)}
            aria-expanded={open === type}
            aria-controls={open === type ? 'places-list' : undefined}
            aria-haspopup="listbox"
          >
            <Icon name={type} className="size-4" />
          </BarButton>
        ))}
      </nav>
    </div>
  )
}

// The card of the place on show: what it is, how long the drive, how far, and which way. It comes in
// only once a place has been picked.
function PlaceCard({ stop, onClose }) {
  const p = PLACES[placeIndex(stop)]
  if (!p) return null
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div data-swap className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-white [@media(max-height:32rem)]:size-7">
            <Icon name={p.type} className="size-4.5" />
          </span>
          <p className="eyebrow text-gold-lit">{TYPE[p.type]}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close the card"
          title="Close"
          className="-mr-1.5 -mt-1.5 grid size-9 shrink-0 [@media(max-height:32rem)]:size-8 place-items-center rounded-full border border-ivory/15 text-ivory/80 transition-colors duration-300 hover:border-gold hover:text-gold"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <h3 data-swap className="display mt-[1.6vh] text-[clamp(1.35rem,3.1vh,2.1rem)] font-normal [@media(max-height:32rem)]:mt-1.5 [@media(max-height:32rem)]:text-[1.15rem] [@media(max-height:32rem)]:leading-tight">{p.name}</h3>
      <div data-swap className="mt-[1.6vh] flex items-end gap-[clamp(1rem,1.6vw,1.75rem)] [@media(max-height:32rem)]:mt-2">
        <p className="flex items-baseline gap-2.5">
          <span className="font-display text-[clamp(2.6rem,7vh,4.6rem)] italic leading-none text-gold-lit [@media(max-height:32rem)]:text-[2rem]">{p.mins}</span>
          <span className="label text-[0.6rem] text-ivory/60">min drive</span>
        </p>
        {p.route && (
          <p className="flex items-baseline gap-2.5 border-l border-ivory/15 pl-[clamp(1rem,1.6vw,1.75rem)]">
            <span className="font-display text-[clamp(1.8rem,4.6vh,3rem)] leading-none text-ivory [@media(max-height:32rem)]:text-[1.5rem]">{p.route.km}</span>
            <span className="label text-[0.6rem] text-ivory/60">km by road</span>
          </p>
        )}
      </div>
      {p.route?.via && (
        <p data-swap className="mt-[1.4vh] flex items-center gap-2 text-[clamp(0.78rem,1.55vh,0.92rem)] text-ivory/60 [@media(max-height:32rem)]:mt-1.5 [@media(max-height:32rem)]:text-[0.7rem]">
          <span className="h-0.5 w-5 shrink-0 rounded-full bg-ember" />
          From Urban Reserve via {p.route.via}
        </p>
      )}
    </>
  )
}

// What the preloader is waiting on, named after the next loading part World reports.
const LOADING = {
  style: 'Mapping the neighbourhood',
  tiles: 'Mapping the neighbourhood',
  models: 'Planting the forest',
  light: 'Lighting the scene',
  sky: 'Rising above the clouds',
  warm: 'Rising above the clouds',
  ready: 'Arriving',
}

// Holds the page until the whole 3D scene is in: the mark inside a filling gold ring, the
// percentage, and what is still on its way.
function Preloader({ show, progress, next }) {
  const [shown, setShown] = useState(0)
  const value = useRef({ p: 0 })
  useEffect(() => {
    const tween = gsap.to(value.current, { p: progress, duration: 0.8, ease: 'power2.out', onUpdate: () => setShown(value.current.p) })
    return () => tween.kill()
  }, [progress])
  const pct = Math.round(shown * 100)
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 grid place-items-center transition-opacity duration-1000 ${show ? 'opacity-100' : 'opacity-0'}`}
      role="progressbar"
      aria-label="Loading the neighbourhood"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-hidden={!show}
    >
      <div className="flex flex-col items-center text-forest-900">
        <div className="relative grid size-[clamp(6.5rem,15vh,9rem)] place-items-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
            <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1" />
            <circle cx="50" cy="50" r="47" fill="none" stroke="var(--color-gold-deep)" strokeWidth="1.6" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - shown * 100} />
          </svg>
          {/* before anything can be measured (the 3D code itself still downloading), a turning arc */}
          <svg
            viewBox="0 0 100 100"
            className={`absolute inset-0 size-full animate-spin transition-opacity duration-700 [animation-duration:2.6s] ${shown < 0.01 ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden="true"
          >
            <circle cx="50" cy="50" r="47" fill="none" stroke="var(--color-gold-deep)" strokeWidth="1.6" strokeLinecap="round" pathLength="100" strokeDasharray="14 86" />
          </svg>
          <span className="w-[44%] text-gold-deep">
            <Mark />
          </span>
        </div>
        <p className="mt-[3.2vh] font-display text-[clamp(1.8rem,4.4vh,2.8rem)] leading-none tabular-nums">
          {pct}
          <span className="text-[0.55em] text-forest-900/60">%</span>
        </p>
        <p className="label mt-[1.6vh] text-[0.62rem] text-forest-900/75">{LOADING[next] ?? LOADING.style}</p>
      </div>
    </div>
  )
}

/**
 * The Location page: the neighbourhood as a 3D map. It opens on every place around the reserve
 * with its travel time. A kind of place (schools, hospitals, ...) lights all of them up together,
 * with their road routes; one place flies there and shows its drive. The Reserve mode brings the
 * camera back over the towers themselves.
 */
export default function Location() {
  const root = useRef(null)
  const [stop, setStop] = useState('neighbourhood')
  const [world, setWorld] = useState('loading')
  const [loading, setLoading] = useState({ progress: 0, next: 'style' })
  const onProgress = useCallback((progress, next) => setLoading({ progress, next }), [])
  // day, or night over the map (the Day/Night switch beside the mode)
  const [night, setNight] = useState(false)
  // The page's entrance waits while the world loads and the camera comes down through the clouds,
  // and plays once it is through. Declared before useIntro so the cover is in place when the intro
  // timeline is created.
  useLayoutEffect(() => {
    setCovered('world', true)
    // World gives up waiting on a dead network well before this
    const safety = setTimeout(() => setCovered('world', false), 200000)
    return () => {
      clearTimeout(safety)
      setCovered('world', false)
    }
  }, [])
  const through = world === 'ready' || world === 'failed'
  useEffect(() => {
    if (through) setCovered('world', false)
  }, [through])
  useIntro(root)
  // every button on the page clicks (the map's pins too)
  useEffect(() => {
    preloadClick()
  }, [])
  const click = (e) => e.target.closest?.('button:not(:disabled), [role="button"], a[href]') && playClick()

  const stacked = useSyncExternalStore(onStacked, () => window.matchMedia(STACKED).matches)
  const sideways = useSyncExternalStore(onSideways, () => window.matchMedia(SIDEWAYS).matches)
  const hood = isHood(stop)
  // the kind whose places are open in the list over the bar
  const [open, setOpen] = useState(null)
  // a place picked (from the list, or its pin on the map) puts the list away; so does leaving the neighbourhood
  const go = useCallback((next) => {
    setStop(next)
    if (next.startsWith('place-') || !isHood(next)) setOpen(null)
  }, [])
  const mode = (h) => go(h ? 'neighbourhood' : 'reserve')
  // the card comes in only for a place picked
  const picked = placeIndex(stop) >= 0
  const card = <PlaceCard stop={stop} onClose={() => go(`kind-${PLACES[placeIndex(stop)].type}`)} />

  return (
    // over the daylight map the page's dark glass is slate, not forest green, as the Rustomjee app's
    // panels are: its forest tones are remapped for everything inside (the panels, the bar, the pins)
    <section ref={root} onClickCapture={click} style={SLATE} className="screen bg-forest-950 text-ivory [--bar-h:4.25rem] [@media(max-height:32rem)]:[--bar-h:3.4rem]">
      {world === 'failed' ? (
        <div className="absolute inset-0">
          <img src={LOCATION.map} alt="Map of landmarks around Urban Reserve" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-forest-950/50" />
        </div>
      ) : (
        <Suspense fallback={null}>
          <World stop={stop} inset={sideways ? SIDEWAYS_INSET : stacked ? STACKED_INSET : null} night={night} hotspots={false} onStop={go} onState={setWorld} onProgress={onProgress} />
        </Suspense>
      )}

      {/* legibility scrims over the world */}
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-[1600ms] ${through ? 'opacity-100' : 'opacity-0'}`}>
        {/* narrower over the neighbourhood, where the rail only holds its title */}
        <div
          className={`absolute inset-y-0 left-0 bg-[linear-gradient(90deg,rgb(24_34_45/0.62),rgb(24_34_45/0.3)_45%,transparent)] transition-[width,opacity] duration-700 max-lg:hidden ${hood ? 'w-[32%] opacity-75' : 'w-[46%]'}`}
        />
        <div className={`absolute inset-y-0 right-0 w-[30%] bg-[linear-gradient(270deg,rgb(24_34_45/0.22),transparent)] transition-opacity duration-700 max-lg:hidden ${picked ? '' : 'opacity-0'}`} />
        <div className="absolute inset-x-0 top-0 h-[16vh] bg-linear-to-b from-forest-950/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[22vh] bg-linear-to-t from-forest-950/50 to-transparent" />
      </div>

      <Preloader show={world === 'loading'} progress={loading.progress} next={loading.next} />

      {/* desktop: the title and switches down the left, above the bar; the place's card on the right */}
      <div className="safe pointer-events-none relative hidden h-full grid-cols-[minmax(17rem,24rem)_1fr_minmax(21rem,27rem)] gap-[3vw] lg:grid">
        <div className="relative min-h-0">
          <div className="pointer-events-auto absolute bottom-[calc(var(--bar-h)+1.5rem)] max-w-[18vw]">
            <h2 data-in className="display text-[clamp(2rem,2vh,3.8rem)] font-normal">
              {LOCATION.heading}
            </h2>
            <p data-in className={`copy grid text-ivory/70 transition-[grid-template-rows,opacity,margin] duration-700 ${hood ? 'mt-0 grid-rows-[0fr] opacity-0' : 'mt-[2vh] grid-rows-[1fr]'}`}>
              <span className="overflow-hidden">Two towers in a private forest, minutes from schools, hospitals, malls and the Western Express Highway.</span>
            </p>
            <div data-in className="mt-[3.2vh] flex w-max items-center gap-2">
              <ModeSwitch hood={hood} onChange={mode} />
              <DayNight night={night} onChange={setNight} className="shrink-0" />
            </div>
          </div>
        </div>

        <div />

        <div className="flex min-h-0 flex-col justify-center pb-[calc(var(--bar-h)+0.5rem)]">
          {/* (the slide is on a wrapper: the card's own transform belongs to the page's entrance) */}
          <div className={`flex max-h-full min-h-0 flex-col transition-[translate,opacity] duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${picked && through ? '' : 'pointer-events-none translate-x-[calc(100%+var(--gutter))] opacity-0'}`}>
            <div
              data-in
              inert={!picked}
              role="region"
              aria-label="The place picked"
              className="pointer-events-auto relative min-h-0 overflow-y-auto border border-ivory/10 bg-forest-950/70 p-[clamp(1.25rem,2.8vh,2.1rem)] shadow-[0_50px_90px_-40px_rgb(0_0_0/0.85)] backdrop-blur-xl [scrollbar-width:none]"
            >
              <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/70 to-transparent" />
              {picked && <Swap id={stop}>{card}</Swap>}
            </div>
          </div>
        </div>
      </div>

      <PlacesBar show={hood && through} stop={stop} open={open} onOpen={setOpen} onStop={go} />

      {/* phones and portrait tablets: the title and switches on top, the place's card above the bar;
          a phone held sideways: the switches and the card in a column down the left */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-(--gutter) pb-[calc(var(--dock-band)+var(--bar-h)+0.75rem)] pt-(--chrome-top) max-[520px]:pb-[calc(var(--dock-band)+var(--watermark-h)+var(--bar-h)+0.75rem)] lg:hidden landscape:right-auto landscape:w-[46%] landscape:justify-start landscape:pr-0">
        {/* a shade down from the top, so the title reads over the map's own names */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[calc(var(--chrome-top)+7rem)] bg-linear-to-b from-forest-950/80 via-forest-950/45 to-transparent landscape:hidden" />
        <div data-in className="pointer-events-auto relative">
          <h2 className="display text-[clamp(1.6rem,7vw,2.6rem)] font-normal [text-shadow:0_1px_12px_rgb(13_35_29/0.7)] landscape:hidden">{LOCATION.heading}</h2>
          <div className="mt-3 flex max-w-sm items-center gap-2 landscape:mt-0">
            <ModeSwitch hood={hood} onChange={mode} className="flex-1" />
            <DayNight night={night} onChange={setNight} className="shrink-0" />
          </div>
        </div>
        <div
          className={`pointer-events-auto relative mx-auto w-full max-w-md transition-[translate,opacity] duration-500 landscape:mx-0 landscape:mt-2 landscape:flex landscape:min-h-0 landscape:max-w-none landscape:flex-1 landscape:flex-col ${picked && through ? '' : 'pointer-events-none! translate-y-4 opacity-0'}`}
          inert={!picked}
        >
          <div role="region" aria-label="The place picked" className="max-h-[38vh] overflow-y-auto overscroll-contain border border-ivory/10 bg-forest-950/90 p-5 backdrop-blur-xl [scrollbar-width:none] landscape:max-h-full landscape:min-h-0 landscape:p-4 [@media(max-height:32rem)]:p-3">
            {picked && <Swap id={stop}>{card}</Swap>}
          </div>
        </div>
      </div>
    </section>
  )
}
