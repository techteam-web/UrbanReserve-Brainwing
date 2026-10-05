import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useNav } from '../app/nav'
import { setCovered } from '../app/gate'
import { useIntro, useTone } from '../hooks/useIntro'
import { INTERIORS, LOCATION, OVERVIEW, RESIDENCES, SPEC_IMAGE } from '../data/content'
import { Icon, Lightbox, Swap } from '../components/ui'
import Terrain from '../art/Terrain'
import { PLACES, isHood, placeIndex } from '../world/stops'

const World = lazy(() => import('../world/World'))

const HOMES = [
  { id: 'reserve', label: 'The Reserve', note: 'Aerial' },
  ...RESIDENCES.map((r) => ({ id: r.id, label: r.label, note: 'Layout' })),
  { id: 'interiors', label: 'Interiors', note: 'Inside' },
]
const PLANS = RESIDENCES.map((r) => ({ image: r.plan, label: r.title }))
const TYPE = { school: 'School', hospital: 'Hospital', mall: 'Shopping', club: 'Club', road: 'Connectivity' }
const nn = (i) => String(i + 1).padStart(2, '0')

// Phones and portrait tablets stack the page; the map then frames its subject above the sheet.
const STACKED = '(width < 64rem), (orientation: portrait)'
const subscribe = (cb) => {
  const q = window.matchMedia(STACKED)
  q.addEventListener('change', cb)
  return () => q.removeEventListener('change', cb)
}
const STACKED_INSET = { top: 0.18, bottom: 0.5 }

function Row({ on, onClick, tight, children }) {
  return (
    <button
      onClick={onClick}
      aria-current={on || undefined}
      className={`group relative flex w-full items-center gap-4 border-b border-ivory/10 ${tight ? 'py-[0.7vh]' : 'py-[1.05vh]'} text-left transition-colors duration-500 ${on ? 'text-ivory' : 'text-ivory/50 hover:text-ivory/90'}`}
    >
      {children}
      <span
        className={`absolute -left-(--gutter) top-1/2 h-px w-[calc(var(--gutter)-0.75rem)] origin-left -translate-y-1/2 bg-gold transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${on ? 'scale-x-100' : 'scale-x-0'}`}
      />
    </button>
  )
}

function ModeSwitch({ hood, onChange, className = '' }) {
  return (
    <div role="tablist" className={`relative grid grid-cols-2 rounded-full border border-ivory/15 bg-forest-950/40 p-1 backdrop-blur-md ${className}`}>
      <span className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-gold transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${hood ? 'translate-x-full' : ''}`} />
      {[
        ['The Homes', false],
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

function HomesList({ stop, onStop }) {
  return (
    <div>
      {HOMES.map((h, i) => (
        <Row key={h.id} on={stop === h.id} onClick={() => onStop(h.id)}>
          <span className="w-6 shrink-0 font-display text-sm text-gold">{nn(i)}</span>
          <span className="font-display text-[clamp(1.1rem,2.45vh,1.6rem)] uppercase tracking-[0.06em]">{h.label}</span>
          <span className="label ml-auto text-[0.56rem] text-ivory/35">{h.note}</span>
        </Row>
      ))}
    </div>
  )
}

function PlacesList({ stop, onStop }) {
  let k = 0
  return (
    <div>
      <Row tight on={stop === 'neighbourhood'} onClick={() => onStop('neighbourhood')}>
        <span className="grid size-6 shrink-0 place-items-center text-gold">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8.5" strokeDasharray="1.5 2.5" />
          </svg>
        </span>
        <span className="font-display text-[clamp(1.05rem,2.3vh,1.5rem)] uppercase tracking-[0.06em]">Overview</span>
        <span className="label ml-auto text-[0.56rem] text-ivory/35">All places</span>
      </Row>
      {LOCATION.rings.map((ring) => (
        <div key={ring.mins}>
          <p className="mt-[1.1vh] font-display text-[clamp(0.9rem,1.9vh,1.15rem)] italic text-gold-lit">{ring.mins} min</p>
          {ring.places.map((p) => {
            const id = `place-${k++}`
            return (
              <Row key={id} tight on={stop === id} onClick={() => onStop(id)}>
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sand/90 text-white">
                  <Icon name={p.type} className="size-3" />
                </span>
                <span className="truncate text-[clamp(0.82rem,1.65vh,1rem)] tracking-wide">{p.name}</span>
              </Row>
            )
          })}
        </div>
      ))}
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

function Detail({ stop, onStop, onPhoto, onPlan, go }) {
  const plan = RESIDENCES.findIndex((r) => r.id === stop)
  const pi = placeIndex(stop)

  if (plan >= 0) {
    const r = RESIDENCES[plan]
    return (
      <>
        <div data-swap className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-gold-lit">
              {nn(plan + 1)} — {r.label}
            </p>
            <h3 className="display mt-2 text-[clamp(1.35rem,3.1vh,2.1rem)] font-normal">{r.title}</h3>
          </div>
          <span className="shrink-0 rounded-sm bg-ivory p-1.5" title="Key plan: the highlighted wing on the tower">
            <img src={r.key} alt="Key plan" className="w-[clamp(3.2rem,7vh,4.6rem)] mix-blend-multiply" />
          </span>
        </div>
        <button data-swap onClick={() => onPlan(plan)} className="group relative mt-[2vh] block w-full pt-[1.6vh]" aria-label={`Enlarge the ${r.title}`}>
          <Terrain side="top" seed={13 + plan} amp={55} className="absolute inset-x-0 top-0 h-[1.8vh] w-full text-white" />
          <span className="flex h-[clamp(11rem,27vh,19rem)] items-center justify-center bg-white p-[1.4vh]">
            <img src={r.plan} alt={r.title} className="max-h-full max-w-full object-contain transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]" />
          </span>
          <span className="label absolute bottom-2 right-2 rounded-full bg-forest-950/75 px-2.5 py-1 text-[0.52rem] text-ivory opacity-0 transition-opacity duration-500 group-hover:opacity-100">Enlarge</span>
        </button>
        <table data-swap className="mt-[1.8vh] w-full text-[clamp(0.78rem,1.55vh,0.92rem)]">
          <tbody>
            {r.rooms.map(([room, size]) => (
              <tr key={room} className="border-b border-ivory/10">
                <th className="py-[0.62vh] pr-4 text-left font-normal text-ivory/60">{room}</th>
                <td className="py-[0.62vh] text-right font-medium tabular-nums">{size}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div data-swap className="mt-[2.4vh] flex gap-3">
          <button onClick={() => go('enquire')} className="btn btn-solid flex-1">
            Request price
          </button>
          <button onClick={() => onStop('interiors')} className="btn border-ivory/30 px-5! text-ivory">
            Interiors
          </button>
        </div>
      </>
    )
  }

  if (stop === 'interiors') {
    return (
      <>
        <p data-swap className="eyebrow text-gold-lit">05 — Interiors</p>
        <h3 data-swap className="display mt-2 text-[clamp(1.35rem,3.1vh,2.1rem)] font-normal">
          Calm, warm
          <br />
          and full of light
        </h3>
        <p data-swap className="copy mt-[1.6vh] text-ivory/65">Light-filled rooms in warm, natural finishes, framed by the city and the forest beyond.</p>
        <div data-swap className="mt-[2.2vh] grid h-[clamp(12rem,30vh,20rem)] grid-cols-[1.15fr_1fr] grid-rows-2 gap-2">
          {INTERIORS.map((p, i) => (
            <button key={p.image} onClick={() => onPhoto(i)} className={`group relative overflow-hidden ${i === 0 ? 'row-span-2' : ''}`}>
              <img src={p.image} alt={p.label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105" />
              <span className="absolute inset-0 bg-linear-to-t from-forest-950/70 to-transparent" />
              <span className="label absolute bottom-2 left-2.5 text-[0.55rem] text-ivory">{p.label}</span>
            </button>
          ))}
        </div>
        <div data-swap className="mt-[2.4vh]">
          <button onClick={() => go('enquire')} className="btn btn-solid w-full">
            Book a private visit
          </button>
        </div>
      </>
    )
  }

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
        <p data-swap className="label mt-[2.4vh] text-[0.56rem] leading-relaxed text-ivory/45">Pick a place on the map or in the list to fly there.</p>
        <div data-swap className="mt-[2vh]">
          <button onClick={() => onStop('reserve')} className="btn w-full border-gold/60 text-gold-lit">
            Back to the reserve
          </button>
        </div>
      </>
    )
  }

  if (pi >= 0) {
    const p = PLACES[pi]
    const near = PLACES.map((q, i) => ({ ...q, i })).filter((q) => q.mins === p.mins && q.i !== pi)
    return (
      <>
        <div data-swap className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-white">
            <Icon name={p.type} className="size-4.5" />
          </span>
          <p className="eyebrow text-gold-lit">{TYPE[p.type]}</p>
        </div>
        <h3 data-swap className="display mt-[1.8vh] text-[clamp(1.35rem,3.1vh,2.1rem)] font-normal">{p.name}</h3>
        <p data-swap className="mt-[1.6vh] flex items-baseline gap-3">
          <span className="font-display text-[clamp(3rem,8vh,5rem)] italic leading-none text-gold-lit">{p.mins}</span>
          <span className="label text-[0.6rem] text-ivory/60">min from Urban Reserve</span>
        </p>
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
          <button onClick={() => onStop('reserve')} className="btn btn-solid flex-1">
            Back to the reserve
          </button>
          <button onClick={() => onStop('neighbourhood')} className="btn border-ivory/30 px-5! text-ivory">
            All
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <p data-swap className="eyebrow text-gold-lit">01 — The Reserve</p>
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
      <p data-swap className="label mt-[2.6vh] text-[0.56rem] leading-relaxed text-ivory/45">Tap a numbered point on the towers, or choose a home.</p>
      <div data-swap className="mt-[2vh] flex gap-3">
        <button onClick={() => onStop(RESIDENCES[0].id)} className="btn btn-solid flex-1">
          Explore the homes
        </button>
        <button onClick={() => onStop('neighbourhood')} className="btn border-ivory/30 px-5! text-ivory">
          Nearby
        </button>
      </div>
    </>
  )
}

function Compass() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 5.5l2.2 6.5L12 18.5 9.8 12z" fill="currentColor" fillOpacity="0.35" />
    </svg>
  )
}

export default function Residences() {
  const root = useRef(null)
  const { go } = useNav()
  const [stop, setStop] = useState('reserve')
  const [world, setWorld] = useState('loading')
  const [replay, setReplay] = useState(0)
  const [photos, setPhotos] = useState(null)
  const close = useCallback(() => setPhotos(null), [])
  // The entrance waits behind the clouds until the world is ready, then plays with its descent.
  // Declared before useIntro so the cover is in place when the intro timeline is created.
  useLayoutEffect(() => {
    setCovered('world', true)
    const safety = setTimeout(() => setCovered('world', false), 14000)
    return () => {
      clearTimeout(safety)
      setCovered('world', false)
    }
  }, [])
  useEffect(() => {
    if (world !== 'loading') setCovered('world', false)
  }, [world])
  useTone(world === 'loading' ? 'light' : 'dark')
  useIntro(root)

  const stacked = useSyncExternalStore(subscribe, () => window.matchMedia(STACKED).matches)
  const hood = isHood(stop)
  const mode = (h) => setStop(h ? 'neighbourhood' : 'reserve')
  const detail = (
    <Detail
      stop={stop}
      onStop={setStop}
      go={go}
      onPhoto={(i) => setPhotos({ list: INTERIORS, index: i })}
      onPlan={(i) => setPhotos({ list: PLANS, index: i })}
    />
  )

  return (
    <section ref={root} className="screen bg-forest-950 text-ivory">
      {world === 'failed' ? (
        <div className="absolute inset-0">
          <img src={SPEC_IMAGE} alt="" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-forest-950/50" />
        </div>
      ) : (
        <Suspense fallback={null}>
          <World stop={stop} replay={replay} inset={stacked ? STACKED_INSET : null} onStop={setStop} onState={setWorld} />
        </Suspense>
      )}

      {/* legibility scrims over the world */}
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-[1600ms] ${world === 'loading' ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute inset-y-0 left-0 w-[46%] bg-[linear-gradient(90deg,rgb(9_27_21/0.9),rgb(9_27_21/0.62)_45%,transparent)] max-lg:hidden" />
        <div className="absolute inset-y-0 right-0 w-[30%] bg-[linear-gradient(270deg,rgb(9_27_21/0.45),transparent)] max-lg:hidden" />
        <div className="absolute inset-x-0 top-0 h-[20vh] bg-linear-to-b from-forest-950/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[18vh] bg-linear-to-t from-forest-950/80 to-transparent" />
      </div>

      {/* arriving */}
      <div
        className={`pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-1000 ${world === 'loading' ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden={world !== 'loading'}
      >
        <div className="flex flex-col items-center gap-4 text-forest-900">
          <svg viewBox="0 0 50 50" className="size-12 animate-spin [animation-duration:2.4s]" fill="none" aria-hidden="true">
            <circle cx="25" cy="25" r="22" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.2" />
            <path d="M25 3a22 22 0 0 1 22 22" stroke="var(--color-gold-deep)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="label text-[0.62rem]">Rising above the reserve</p>
        </div>
      </div>

      {/* desktop: rail, the world, detail card */}
      <div className="safe pointer-events-none relative hidden h-full grid-cols-[minmax(17rem,24rem)_1fr_minmax(21rem,27rem)] gap-[3vw] lg:grid">
        <div className="flex min-h-0 flex-col justify-center">
          <div className="pointer-events-auto">
            <p data-in className="eyebrow text-gold-lit">Residences</p>
            <h2 data-in className="display mt-[1.8vh] text-[clamp(2rem,5vh,3.8rem)] font-normal">
              Homes designed
              <br />
              to breathe
            </h2>
            <p data-in className={`copy grid text-ivory/70 transition-[grid-template-rows,opacity,margin] duration-700 ${hood ? 'mt-0 grid-rows-[0fr] opacity-0' : 'mt-[2vh] grid-rows-[1fr]'}`}>
              <span className="overflow-hidden">2 & 3 BHK-plus deck apartments with generous planted balconies and mesmerising city vistas.</span>
            </p>
            <div data-in className="mt-[3.2vh]">
              <ModeSwitch hood={hood} onChange={mode} />
            </div>
            <div data-in className="mt-[2vh]">
              <Swap id={hood ? 'hood' : 'homes'}>
                <div data-swap>{hood ? <PlacesList stop={stop} onStop={setStop} /> : <HomesList stop={stop} onStop={setStop} />}</div>
              </Swap>
            </div>
          </div>
        </div>

        <div />

        <div className="flex min-h-0 flex-col justify-center">
          <div
            data-in
            className="pointer-events-auto relative max-h-full overflow-y-auto border border-ivory/10 bg-forest-950/70 p-[clamp(1.25rem,2.8vh,2.1rem)] shadow-[0_50px_90px_-40px_rgb(0_0_0/0.85)] backdrop-blur-xl [scrollbar-width:none]"
          >
            <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/70 to-transparent" />
            <Swap id={stop}>{detail}</Swap>
          </div>
        </div>
      </div>

      {/* desktop hud */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--chrome-bot)+1.2vh)] hidden justify-center lg:flex">
        <div data-in className="pointer-events-auto flex items-center gap-3 rounded-full border border-ivory/10 bg-forest-950/55 py-1.5 pl-5 pr-1.5 backdrop-blur-md">
          <span className="label text-[0.56rem] text-ivory/60">Drag to move · Right-drag to orbit · Scroll to zoom</span>
          <button
            onClick={() => setReplay((n) => n + 1)}
            className="grid size-8 place-items-center rounded-full border border-gold/50 text-gold transition-colors duration-500 hover:bg-gold hover:text-forest-950"
            aria-label="Recentre the view"
            title="Recentre"
          >
            <Compass />
          </button>
        </div>
      </div>

      {/* phones and portrait tablets: title on top, a sheet at the bottom */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-(--gutter) pb-(--chrome-bot) pt-(--chrome-top) lg:hidden">
        <div data-in className="pointer-events-auto">
          <p className="eyebrow text-gold-lit">Residences</p>
          <h2 className="display mt-2 text-[clamp(1.6rem,7vw,2.6rem)] font-normal">Homes designed to breathe</h2>
        </div>
        <div data-in className="pointer-events-auto">
          <ModeSwitch hood={hood} onChange={mode} className="mx-auto max-w-sm" />
          <div className="-mx-(--gutter) mt-3 flex gap-2 overflow-x-auto px-(--gutter) pb-1 [scrollbar-width:none]">
            {(hood ? [{ id: 'neighbourhood', label: 'Overview' }, ...PLACES.map((p, i) => ({ id: `place-${i}`, label: p.name }))] : HOMES).map((h) => (
              <button
                key={h.id}
                onClick={() => setStop(h.id)}
                className={`label shrink-0 rounded-full border px-4 py-2 text-[0.6rem] backdrop-blur-md transition-colors duration-500 ${stop === h.id ? 'border-gold bg-gold text-forest-950' : 'border-ivory/20 bg-forest-950/55 text-ivory/80'}`}
              >
                {h.label}
              </button>
            ))}
          </div>
          <div className="mt-3 max-h-[42vh] overflow-y-auto border border-ivory/10 bg-forest-950/80 p-5 backdrop-blur-xl [scrollbar-width:none]">
            <Swap id={stop}>{detail}</Swap>
          </div>
        </div>
      </div>

      {photos && <Lightbox photos={photos.list} index={photos.index} onClose={close} />}
    </section>
  )
}
