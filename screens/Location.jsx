import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { setCovered } from '../app/gate'
import { playClick, preloadClick } from '../app/sound'
import { useIntro, useTone } from '../hooks/useIntro'
import { LOCATION, OVERVIEW } from '../data/content'
import { Icon, Swap } from '../components/ui'
import { gsap } from '../gsap/gsapConfig'
import { Mark } from '../art/Brand'
import { KINDS, PLACES, isHood, kindIndices, kindOf, placeIndex } from '../world/stops'

const World = lazy(() => import('../world/World'))

// a kind of place, singular, and as a noun for counting ("3 schools")
const TYPE = { school: 'School', hospital: 'Hospital', mall: 'Shopping', club: 'Club', road: 'Connectivity' }
const NOUN = { school: ['school', 'schools'], hospital: ['hospital', 'hospitals'], mall: ['mall', 'malls'], club: ['club', 'clubs'], road: ['connection', 'connections'] }
const kindLabel = (type) => KINDS.find(([t]) => t === type)?.[1] ?? type

// Phones and portrait tablets stack the page; the map then frames its subject above the sheet.
const STACKED = '(width < 64rem), (orientation: portrait)'
const subscribe = (cb) => {
  const q = window.matchMedia(STACKED)
  q.addEventListener('change', cb)
  return () => q.removeEventListener('change', cb)
}
const STACKED_INSET = { top: 0.18, bottom: 0.5 }

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
          className={`label relative z-10 rounded-full px-4 py-2.5 text-[0.62rem] transition-colors duration-500 ${hood === h ? 'text-forest-950' : 'text-ivory/70 hover:text-ivory'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// `lit`: this is the stop on show; `on`: the stop on show is one of this kind's places.
function BarButton({ on, lit, onClick, label, children, ...aria }) {
  return (
    <button
      onClick={onClick}
      {...aria}
      className={`label relative flex min-w-[5.6rem] flex-col items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.56rem] transition-colors duration-500 ${
        lit ? 'bg-gold text-forest-950' : on ? 'bg-ivory/10 text-ivory' : 'text-ivory/65 hover:bg-ivory/5 hover:text-ivory'
      }`}
    >
      <span className={lit ? '' : 'text-gold-lit'}>{children}</span>
      {label}
    </button>
  )
}

/*
 * The neighbourhood's places in a bar along the foot of the screen, by kind (on desktop; the
 * stacked layout keeps its chips). A kind lights every place of that kind on the map, with their
 * routes, and the card lists them; picking one there flies to it. The map keeps the whole width
 * between the rail's title and the card.
 */
function PlacesBar({ show, stop, onStop }) {
  const kind = kindOf(stop)
  const current = PLACES[placeIndex(stop)]?.type
  return (
    <div
      inert={!show}
      className={`absolute bottom-0 left-1/2 z-10 flex h-(--chrome-bot) -translate-x-1/2 items-center transition-[opacity,translate] duration-700 max-lg:hidden ${show ? '' : 'pointer-events-none translate-y-3 opacity-0'}`}
    >
      <nav aria-label="Places nearby" className="flex items-center gap-1 rounded-full border border-ivory/12 bg-forest-950/75 p-1 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.8)] backdrop-blur-xl">
        <BarButton label="Overview" lit={stop === 'neighbourhood'} onClick={() => onStop('neighbourhood')} aria-pressed={stop === 'neighbourhood'}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8.5" strokeDasharray="1.5 2.5" />
          </svg>
        </BarButton>
        {KINDS.map(([type, label]) => (
          <BarButton key={type} label={label} lit={kind === type} on={current === type} onClick={() => onStop(`kind-${type}`)} aria-pressed={kind === type}>
            <Icon name={type} className="size-4" />
          </BarButton>
        ))}
      </nav>
    </div>
  )
}

function Stat({ value, label }) {
  return (
    <div className="border-l border-gold/30 pl-3">
      <p className="font-display text-[clamp(1.5rem,3.4vh,2.3rem)] leading-none text-gold-lit">{value}</p>
      <p className="label mt-1.5 text-[0.56rem] text-ivory/55">{label}</p>
    </div>
  )
}

// The card's contents for the stop on show: the whole neighbourhood, one kind of place, one place,
// or the reserve itself.
function Detail({ stop, onStop }) {
  const kind = kindOf(stop)
  const pi = placeIndex(stop)

  if (stop === 'neighbourhood') {
    return (
      <>
        <p data-swap className="eyebrow text-gold-lit">Location advantage</p>
        <h3 data-swap className="display mt-2 text-[clamp(1.35rem,3.1vh,2.1rem)] font-normal">{LOCATION.heading}</h3>
        <p data-swap className="copy mt-[1.6vh] text-ivory/65">{LOCATION.body}</p>
        <div data-swap className="mt-[2.4vh] grid grid-cols-3 gap-3">
          {LOCATION.rings.map((r) => (
            <Stat key={r.mins} value={r.mins} label={`min · ${r.places.length} ${r.places.length > 1 ? 'places' : 'place'}`} />
          ))}
        </div>
        <p data-swap className="label mt-[2.4vh] text-[0.56rem] leading-relaxed text-ivory/45">Pick a kind of place in the bar below to light them all up, or a place on the map to fly there.</p>
        <div data-swap className="mt-[2vh]">
          <button onClick={() => onStop('reserve')} className="btn w-full border-gold/60 text-gold-lit">
            See the reserve
          </button>
        </div>
      </>
    )
  }

  if (kind) {
    const list = kindIndices(kind).map((i) => ({ ...PLACES[i], i }))
    const far = Math.max(...list.map((p) => p.mins))
    const noun = NOUN[kind]?.[list.length === 1 ? 0 : 1] ?? kindLabel(kind).toLowerCase()
    return (
      <>
        <div data-swap className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-white">
            <Icon name={kind} className="size-4.5" />
          </span>
          <p className="eyebrow text-gold-lit">{kindLabel(kind)}</p>
        </div>
        <h3 data-swap className="display mt-[1.8vh] text-[clamp(1.35rem,3.1vh,2.1rem)] font-normal">
          {list.length} {noun}
          <br />
          within {far} min
        </h3>
        <p data-swap className="label mt-[1.6vh] text-[0.56rem] leading-relaxed text-ivory/45">{list.length > 1 ? 'All of them are lit on the map. Pick one to see the drive there.' : 'Lit on the map. Pick it to see the drive there.'}</p>
        <ul data-swap className="mt-[1.4vh]">
          {list.map((p) => (
            <li key={p.name}>
              <button
                onClick={() => onStop(`place-${p.i}`)}
                className="flex w-full items-center gap-3 border-b border-ivory/10 py-[0.9vh] text-left text-[clamp(0.8rem,1.6vh,0.95rem)] text-ivory/80 transition-colors duration-300 hover:text-ivory"
              >
                <span className="flex-1">{p.name}</span>
                <span className="font-display text-[0.95rem] italic text-gold-lit">{p.mins} min</span>
                {p.route && <span className="w-12 text-right text-[0.68rem] tabular-nums text-ivory/40">{p.route.km} km</span>}
                <span className="text-gold">→</span>
              </button>
            </li>
          ))}
        </ul>
        <div data-swap className="mt-[2.4vh] flex gap-3">
          <button onClick={() => onStop('neighbourhood')} className="btn btn-solid flex-1">
            All places
          </button>
          <button onClick={() => onStop('reserve')} className="btn border-ivory/30 px-5! text-ivory">
            Reserve
          </button>
        </div>
      </>
    )
  }

  if (pi >= 0) {
    const p = PLACES[pi]
    const near = PLACES.map((q, i) => ({ ...q, i })).filter((q) => q.mins === p.mins && q.i !== pi)
    const others = kindIndices(p.type).length > 1
    return (
      <>
        <div data-swap className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-white">
            <Icon name={p.type} className="size-4.5" />
          </span>
          <p className="eyebrow text-gold-lit">{TYPE[p.type]}</p>
        </div>
        <h3 data-swap className="display mt-[1.8vh] text-[clamp(1.35rem,3.1vh,2.1rem)] font-normal">{p.name}</h3>
        <div data-swap className="mt-[1.6vh] flex items-end gap-[1.6vw]">
          <p className="flex items-baseline gap-2.5">
            <span className="font-display text-[clamp(3rem,8vh,5rem)] italic leading-none text-gold-lit">{p.mins}</span>
            <span className="label text-[0.6rem] text-ivory/60">min drive</span>
          </p>
          {p.route && (
            <p className="flex items-baseline gap-2.5 border-l border-ivory/15 pl-[1.6vw]">
              <span className="font-display text-[clamp(2rem,5vh,3.2rem)] leading-none text-ivory">{p.route.km}</span>
              <span className="label text-[0.6rem] text-ivory/60">km by road</span>
            </p>
          )}
        </div>
        {p.route?.via && (
          <p data-swap className="mt-[1.4vh] flex items-center gap-2 text-[clamp(0.78rem,1.55vh,0.92rem)] text-ivory/60">
            <span className="h-0.5 w-5 rounded-full bg-ember" />
            From Urban Reserve via {p.route.via}
          </p>
        )}
        {near.length > 0 && (
          <div data-swap className="mt-[2.4vh]">
            <p className="label text-[0.56rem] text-ivory/45">Also within {p.mins} min</p>
            <ul className="mt-1.5">
              {near.map((q) => (
                <li key={q.name}>
                  <button onClick={() => onStop(`place-${q.i}`)} className="flex w-full items-center gap-3 border-b border-ivory/10 py-[0.8vh] text-left text-[clamp(0.8rem,1.6vh,0.95rem)] text-ivory/75 hover:text-ivory">
                    <Icon name={q.type} className="size-3.5 text-gold" />
                    {q.name}
                    <span className="ml-auto text-gold">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div data-swap className="mt-[2.4vh] flex gap-3">
          {others ? (
            <button onClick={() => onStop(`kind-${p.type}`)} className="btn btn-solid flex-1">
              All {NOUN[p.type]?.[1] ?? kindLabel(p.type).toLowerCase()}
            </button>
          ) : (
            <button onClick={() => onStop('neighbourhood')} className="btn btn-solid flex-1">
              All places
            </button>
          )}
          <button onClick={() => onStop('reserve')} className="btn border-ivory/30 px-5! text-ivory">
            Reserve
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <p data-swap className="eyebrow text-gold-lit">The Reserve</p>
      <h3 data-swap className="display mt-2 text-[clamp(1.35rem,3.1vh,2.1rem)] font-normal">
        Two towers,
        <br />
        one private forest
      </h3>
      <p data-swap className="copy mt-[1.6vh] text-ivory/65">{OVERVIEW.welcome.body}</p>
      <div data-swap className="mt-[2.6vh] grid grid-cols-3 gap-3">
        {OVERVIEW.welcome.stats.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </div>
      <p data-swap className="label mt-[2.6vh] text-[0.56rem] leading-relaxed text-ivory/45">Switch to the neighbourhood to see what is nearby, and how long it takes to get there.</p>
      <div data-swap className="mt-[2vh]">
        <button onClick={() => onStop('neighbourhood')} className="btn btn-solid w-full">
          Explore the neighbourhood
        </button>
      </div>
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
  // the desktop detail card, shown or slid away by the visitor
  const [card, setCard] = useState(true)
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
  // the header reads dark over the preloader and the clouds, light over the map
  useTone(through ? 'dark' : 'light')
  useIntro(root)
  // every button on the page clicks (the map's pins too)
  useEffect(() => {
    preloadClick()
  }, [])
  const click = (e) => e.target.closest?.('button:not(:disabled), [role="button"], a[href]') && playClick()

  const stacked = useSyncExternalStore(subscribe, () => window.matchMedia(STACKED).matches)
  const hood = isHood(stop)
  const mode = (h) => setStop(h ? 'neighbourhood' : 'reserve')
  // the stacked layout's chips: the overview and the kinds; a kind's chip also stands for its places
  const chips = hood ? [{ id: 'neighbourhood', label: 'Overview' }, ...KINDS.map(([type, label]) => ({ id: `kind-${type}`, label }))] : []
  const chipOn = (id) => stop === id || (kindOf(id) != null && kindOf(id) === PLACES[placeIndex(stop)]?.type)
  const detail = <Detail stop={stop} onStop={setStop} />

  return (
    <section ref={root} onClickCapture={click} className="screen bg-forest-950 text-ivory">
      {world === 'failed' ? (
        <div className="absolute inset-0">
          <img src={LOCATION.map} alt="Map of landmarks around Urban Reserve" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-forest-950/50" />
        </div>
      ) : (
        <Suspense fallback={null}>
          <World stop={stop} inset={stacked ? STACKED_INSET : null} hotspots={false} onStop={setStop} onState={setWorld} onProgress={onProgress} />
        </Suspense>
      )}

      {/* legibility scrims over the world */}
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-[1600ms] ${through ? 'opacity-100' : 'opacity-0'}`}>
        {/* narrower over the neighbourhood, where the rail only holds its title */}
        <div
          className={`absolute inset-y-0 left-0 bg-[linear-gradient(90deg,rgb(9_27_21/0.86),rgb(9_27_21/0.56)_45%,transparent)] transition-[width,opacity] duration-700 max-lg:hidden ${hood ? 'w-[32%] opacity-75' : 'w-[46%]'}`}
        />
        <div className={`absolute inset-y-0 right-0 w-[30%] bg-[linear-gradient(270deg,rgb(9_27_21/0.36),transparent)] transition-opacity duration-700 max-lg:hidden ${card ? '' : 'opacity-0'}`} />
        <div className="absolute inset-x-0 top-0 h-[20vh] bg-linear-to-b from-forest-950/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[18vh] bg-linear-to-t from-forest-950/65 to-transparent" />
      </div>

      <Preloader show={world === 'loading'} progress={loading.progress} next={loading.next} />

      {/* desktop: rail, the world, detail card */}
      <div className="safe pointer-events-none relative hidden h-full grid-cols-[minmax(17rem,24rem)_1fr_minmax(21rem,27rem)] gap-[3vw] lg:grid">
        <div className="flex min-h-0 flex-col justify-center">
          <div className="pointer-events-auto absolute bottom-25 max-w-[18vw]">
            <p data-in className="eyebrow text-gold-lit">Location</p>
            <h2 data-in className="display mt-2 text-[clamp(2rem,2vh,3.8rem)] font-normal">
              {LOCATION.heading}
            </h2>
            <p data-in className={`copy grid text-ivory/70 transition-[grid-template-rows,opacity,margin] duration-700 ${hood ? 'mt-0 grid-rows-[0fr] opacity-0' : 'mt-[2vh] grid-rows-[1fr]'}`}>
              <span className="overflow-hidden">Two towers in a private forest, minutes from schools, hospitals, malls and the Western Express Highway.</span>
            </p>
            <div data-in className="mt-[3.2vh]">
              <ModeSwitch hood={hood} onChange={mode} />
            </div>
          </div>
        </div>

        <div />

        <div className="flex min-h-0 flex-col justify-center">
          {/* The card slides off to the right to leave the map clear; its handle stays at the edge.
              (The slide is on a wrapper: the card's own transform belongs to the page's entrance.) */}
          <div className={`relative flex max-h-full min-h-0 flex-col transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${card ? '' : 'translate-x-[calc(100%+var(--gutter))]'}`}>
            <button
              onClick={() => setCard((v) => !v)}
              inert={!through}
              aria-expanded={card}
              aria-controls="location-card"
              aria-label={card ? 'Hide the details' : 'Show the details'}
              title={card ? 'Hide the details' : 'Show the details'}
              className={`pointer-events-auto absolute right-full top-1/2 mr-3 grid h-16 w-9 -translate-y-1/2 place-items-center rounded-full border border-ivory/15 bg-forest-950/75 text-gold-lit shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl transition-[opacity,border-color,color] duration-700 hover:border-gold/60 hover:text-gold ${through ? '' : 'opacity-0'}`}
            >
              <svg viewBox="0 0 24 24" className={`size-4 transition-transform duration-700 ${card ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <div
              id="location-card"
              data-in
              inert={!card}
              className="pointer-events-auto relative min-h-0 overflow-y-auto border border-ivory/10 bg-forest-950/70 p-[clamp(1.25rem,2.8vh,2.1rem)] shadow-[0_50px_90px_-40px_rgb(0_0_0/0.85)] backdrop-blur-xl [scrollbar-width:none]"
            >
              <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/70 to-transparent" />
              <Swap id={stop}>{detail}</Swap>
            </div>
          </div>
        </div>
      </div>

      <PlacesBar show={hood && through} stop={stop} onStop={setStop} />

      {/* phones and portrait tablets: title on top, a sheet at the bottom */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-(--gutter) pb-(--chrome-bot) pt-(--chrome-top) lg:hidden">
        <div data-in className="pointer-events-auto">
          <p className="eyebrow text-gold-lit">Location</p>
          <h2 className="display mt-2 text-[clamp(1.6rem,7vw,2.6rem)] font-normal">{LOCATION.heading}</h2>
        </div>
        <div data-in className="pointer-events-auto">
          <ModeSwitch hood={hood} onChange={mode} className="mx-auto max-w-sm" />
          {chips.length > 0 && (
            <div className="-mx-(--gutter) mt-3 flex gap-2 overflow-x-auto px-(--gutter) pb-1 [scrollbar-width:none]">
              {chips.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setStop(h.id)}
                  aria-pressed={chipOn(h.id)}
                  className={`label shrink-0 rounded-full border px-4 py-2 text-[0.6rem] backdrop-blur-md transition-colors duration-500 ${chipOn(h.id) ? 'border-gold bg-gold text-forest-950' : 'border-ivory/20 bg-forest-950/55 text-ivory/80'}`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 max-h-[42vh] overflow-y-auto border border-ivory/10 bg-forest-950/80 p-5 backdrop-blur-xl [scrollbar-width:none]">
            <Swap id={stop}>{detail}</Swap>
          </div>
        </div>
      </div>
    </section>
  )
}
