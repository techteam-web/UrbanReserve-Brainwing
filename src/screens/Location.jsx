import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap, reduced } from '../gsap/gsapConfig'
import { useIntro, useTone } from '../hooks/useIntro'
import { LOCATION, TRAVEL } from '../data/content'
import ROUTES from '../data/routes.json'
import Botanical from '../art/Botanical'
import { Icon } from '../components/ui'
import ZoomPan, { Pin } from '../components/ZoomPan'

const LiveMap = lazy(() => import('../components/LiveMap'))

// Landmarks with a real route are grouped by their actual drive time; the rest keep the brochure's band.
const band = (min) => Math.max(5, Math.ceil(min / 5) * 5)
const PLACES = LOCATION.rings.flatMap((r) => r.places.map((p) => ({ ...p, mins: p.travel ? band(p.travel.car[0]) : r.mins })))
const BANDS = [...new Set(PLACES.map((p) => p.mins))].sort((a, b) => a - b)

const MODES = { car: { label: 'Car', icon: 'car' }, walk: { label: 'Walk', icon: 'walk' } }

// The ways worth offering for a trip: always by car, and on foot if it's a short walk.
// Rules live in TRAVEL (content.js), which also records why buses aren't offered.
function modesFor(place) {
  if (!place?.travel) return []
  const [car, km] = place.travel.car
  const out = [{ id: 'car', min: car, km }]
  const [walk, walkKm] = place.travel.walk
  if (walk <= TRAVEL.walkMax) out.push({ id: 'walk', min: walk, km: walkKm })
  return out
}

// The little box that pops up over a picked landmark on the live map.
function RouteCard({ place, modes, mode, onMode }) {
  const cur = modes.find((m) => m.id === mode)
  return (
    <div className="w-[min(19rem,70vw)] text-ivory">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold text-forest-950">
          <Icon name={place.type} />
        </span>
        <p className="font-display text-[1.15rem] leading-tight">{place.name}</p>
      </div>
      <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0, 1fr))` }}>
        {modes.map((m) => {
          const on = m.id === mode
          return (
            <button
              key={m.id}
              onClick={() => onMode(m.id)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 outline-none focus-visible:ring-1 focus-visible:ring-gold transition-colors duration-300 active:scale-95 ${on ? 'border-gold bg-gold/15 text-gold-lit' : 'border-ivory/15 text-ivory/75 hover:border-ivory/40'}`}
            >
              <Icon name={MODES[m.id].icon} className="size-5" />
              <span className="font-display text-[1.1rem] leading-none">
                {m.min} min
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em] opacity-75">{MODES[m.id].label}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-2.5 text-[11px] text-ivory/55">
        {cur.km} km {cur.id === 'walk' ? 'on foot' : 'by road'}
        {!modes.some((m) => m.id === 'walk') && ' · too far to walk'}
      </p>
    </div>
  )
}
const PINNED = PLACES.filter((p) => p.lngLat)
const [VW, VH] = [1000, 1000 / LOCATION.aspect]
const H = LOCATION.home

// A dashed line from Urban Reserve to the picked landmark, drawn on the illustrated map.
function Route({ place }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!place || !ref.current || reduced()) return
    gsap.fromTo(ref.current, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, delay: 0.35, ease: 'power2.inOut' })
  }, [place])
  if (!place) return null
  const [x1, y1] = [H[0] * VW, H[1] * VH]
  const [x2, y2] = [place.at[0] * VW, place.at[1] * VH]
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <path ref={ref} d={`M${x1} ${y1}L${x2} ${y2}`} fill="none" stroke="#e6c983" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${x1} ${y1}L${x2} ${y2}`} fill="none" stroke="#0d231d" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" opacity="0.55" />
    </svg>
  )
}

// The brochure's illustrated map: used when the live map can't load (e.g. the sales office is offline).
function IllustratedMap({ place, onPick }) {
  const zp = useRef(null)
  useEffect(() => {
    if (!place) return zp.current?.reset()
    // frame both Urban Reserve and the landmark
    const u = (place.at[0] + H[0]) / 2
    const v = (place.at[1] + H[1]) / 2
    const span = Math.max(Math.abs(place.at[0] - H[0]) * LOCATION.aspect, Math.abs(place.at[1] - H[1]))
    zp.current?.focus(u, v, Math.min(2, Math.max(1.25, 0.5 / span)))
  }, [place])
  return (
    <ZoomPan ref={zp} src={LOCATION.map} alt="Map of landmarks around Urban Reserve" aspect={LOCATION.aspect} tone="dark" className="absolute inset-x-0 bottom-(--chrome-bot) top-2 lg:top-(--chrome-top)">
      <Route place={place} />
      {PLACES.map((p) => (
        <Pin key={p.name} u={p.at[0]} v={p.at[1]} label={p.name} active={place?.name === p.name} onClick={() => onPick(p.name)} tone="gold" quiet />
      ))}
    </ZoomPan>
  )
}

export default function Location() {
  const root = useRef(null)
  const [filter, setFilter] = useState('all')
  const [pick, setPick] = useState(null)
  const [live, setLive] = useState(true)
  const [mode, setMode] = useState(null)
  useTone(['light', 'dark'])
  useIntro(root)

  const place = PLACES.find((p) => p.name === pick) ?? null
  const shown = PLACES.filter((p) => filter === 'all' || p.type === filter)
  const pickable = (p) => !live || Boolean(p.lngLat)

  const choose = (name) => {
    setPick((cur) => (cur === name ? null : name))
    setMode(null)
  }

  // default to walking when it's offered, otherwise the drive
  const modes = modesFor(place)
  const cur = modes.find((m) => m.id === mode) ?? modes.find((m) => m.id === 'walk') ?? modes[0]
  const route = place && cur ? { mode: cur.id, coords: ROUTES[place.name][cur.id === 'walk' ? 'walk' : 'car'] } : null

  const setType = (id) => {
    setFilter(id)
    if (place && id !== 'all' && place.type !== id) setPick(null)
  }

  return (
    <section ref={root} className="screen grid grid-rows-[minmax(0,1.1fr)_minmax(0,1fr)] bg-paper text-forest-900 lg:grid-cols-[1fr_1.05fr] lg:grid-rows-1">
      <div className="relative min-h-0 overflow-hidden">
        <Botanical kind="fern" seed={9} depth={-10} className="bottom-[8vh] left-0 w-[17vw] text-gold-deep/15" />
        <div className="safe pane flex h-full flex-col max-lg:pb-4 lg:pr-[3vw]">
          <p data-in className="eyebrow text-ember">Location Advantage</p>
          <h2 data-in className="display mt-[1.2vh] text-[clamp(1.8rem,4.8vh,3.6rem)] text-forest-800">{LOCATION.heading}</h2>
          <p data-in className="copy mt-[1.2vh] max-w-xl text-ink/70">{LOCATION.body}</p>

          <div data-in className="mt-[2.5vh] flex flex-wrap gap-2">
            {LOCATION.filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setType(f.id)}
                className={`label flex items-center gap-2 rounded-full border px-4 py-2.5 text-[max(0.6rem,9px)] transition-colors duration-300 active:scale-95 ${
                  filter === f.id ? 'border-forest-900 bg-forest-900 text-ivory' : 'border-forest-900/15 hover:border-forest-900/40'
                }`}
              >
                {f.id !== 'all' && <Icon name={f.id} className="size-3.5" />}
                {f.label}
              </button>
            ))}
          </div>

          <div data-in className="relative mt-[2vh] min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none]">
            {BANDS.map((mins) => {
              const list = shown.filter((p) => p.mins === mins)
              if (!list.length) return null
              return (
                <div key={mins} className="mb-[1.5vh]">
                  <p className="flex items-center gap-3 font-display text-[clamp(1.1rem,2.4vh,1.5rem)] italic text-ember">
                    {mins} mins
                    <span className="h-px flex-1 bg-forest-900/10" />
                  </p>
                  <ul className="mt-1 grid gap-1 sm:grid-cols-2">
                    {list.map((p) => {
                      const on = pick === p.name
                      const ok = pickable(p)
                      return (
                        <li key={p.name}>
                          <button
                            onClick={() => ok && choose(p.name)}
                            disabled={!ok}
                            className={`flex w-full items-center gap-3 rounded-xl px-2 py-[0.8vh] text-left text-[clamp(0.8rem,1.6vh,0.95rem)] transition-colors duration-300 ${
                              on ? 'bg-forest-900 text-ivory' : ok ? 'hover:bg-forest-900/5 active:scale-[0.98]' : 'cursor-default opacity-50'
                            }`}
                          >
                            <span className={`grid size-9 shrink-0 place-items-center rounded-full ${on ? 'bg-gold text-forest-950' : 'bg-sand text-white'}`}>
                              <Icon name={p.type} />
                            </span>
                            <span>
                              {p.name}
                              {!ok && <span className="block text-[max(0.62rem,9px)] uppercase tracking-[0.18em] text-ink/60">Location pending</span>}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div data-mask className="relative overflow-hidden bg-[#16463a]">
        {live ? (
          <Suspense fallback={null}>
            <LiveMap site={LOCATION.site} places={PINNED} active={pick} filter={filter} route={route} onPick={choose} onFail={() => setLive(false)}>
              {place && cur && <RouteCard place={place} modes={modes} mode={cur.id} onMode={setMode} />}
            </LiveMap>
          </Suspense>
        ) : (
          <IllustratedMap place={place} onPick={choose} />
        )}
        {place && !live && (
          <div key={place.name} className="card-in absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-3 rounded-full bg-forest-950/90 py-2 pl-2 pr-5 text-ivory shadow-2xl backdrop-blur-md lg:top-(--chrome-top)">
            <span className="grid size-10 place-items-center rounded-full bg-gold text-forest-950">
              <Icon name={place.type} />
            </span>
            <span className="font-display text-[clamp(1rem,2.2vh,1.35rem)] leading-tight">{place.name}</span>
            <span className="label rounded-full bg-ivory/10 px-3 py-1.5 text-[max(0.58rem,9px)] text-gold-lit">{place.mins} min</span>
          </div>
        )}
        {!live && <p className="label pointer-events-none absolute bottom-[calc(var(--chrome-bot)+0.5rem)] left-4 text-[max(0.58rem,9px)] text-ivory/55">Map not to scale</p>}
      </div>
    </section>
  )
}
