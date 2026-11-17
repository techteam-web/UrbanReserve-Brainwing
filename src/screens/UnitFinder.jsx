import { useEffect, useId, useRef, useState } from 'react'
import { useIntro } from '../hooks/useIntro'
import { useNav } from '../app/nav'
import { decodeImages } from '../app/decode'
import { bedroomsOf, compareQuery, configOf, CONFIGS, FEATURES, hasRoom, MOST_COMPARED, roomsLine, UNITS } from '../data/content'
import { ALL_TOWERS, finder, HOME_FLOORS, homesOf } from '../data/finder'
import { Segmented } from '../components/ui'
import KeyPlan from '../components/KeyPlan'
import { Mark, Pill } from '../components/Pill'
import Botanical from '../art/Botanical'
import ModeSwitch from './ModeSwitch'
import PlanSheet from './PlanSheet'

const DRAWINGS = [
  { id: 'plan', label: 'Unit plan' },
  { id: 'key', label: 'Key plan' },
]
const FLAT_IDS = [1, 2, 3, 4, 5, 6]
const NONE = { configs: [], flats: [], features: [] }

// Whether a home fits the filters: any of the bedroom counts picked, any of the flats picked (a jodi
// fits either of its two), and every feature picked. `skip` leaves one group out, to count its options.
const fits = (u, f, skip) =>
  (skip === 'configs' || !f.configs.length || f.configs.includes(bedroomsOf(u))) &&
  (skip === 'flats' || !f.flats.length || u.flats.some((id) => f.flats.includes(id))) &&
  (skip === 'features' || f.features.every((room) => hasRoom(u, room)))
const flip = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

function Group({ title, note, children }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} data-in className="border-t border-forest-900/10 pt-[1.8vh]">
      <p id={id} className="label text-[max(0.58rem,9px)] text-ink/60">
        {title}
      </p>
      <div className="mt-[1.3vh]">{children}</div>
      {note && <p className="mt-[1vh] text-[max(0.72rem,10.5px)] text-ink/55">{note}</p>}
    </div>
  )
}

// A filter's option, with how many plan types it would show; one that would show none stands back.
function Chip({ on, count, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      aria-label={`${children}, ${count} ${count === 1 ? 'plan type' : 'plan types'}`}
      disabled={!on && !count}
      className={`label flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-[max(0.58rem,9px)] tracking-[0.15em] transition-colors duration-300 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${
        on ? 'border-forest-900 bg-forest-900 text-ivory' : 'border-forest-900/20 bg-white/60 text-forest-900 enabled:hover:border-forest-900/70 enabled:hover:bg-white'
      }`}
    >
      {children}
      <span className={`tabular-nums tracking-normal ${on ? 'text-gold-lit' : 'text-ink/45'}`}>{count}</span>
    </button>
  )
}

function Card({ unit, show, picked, full, onPick, onView }) {
  const joined = unit.flats.length > 1
  return (
    <article
      data-in
      className={`flex w-full flex-col overflow-hidden rounded-[1.1rem] bg-white shadow-[0_26px_50px_-36px_rgb(20_52_41/0.55)] transition-shadow duration-300 ${
        picked ? 'ring-2 ring-ember' : 'ring-1 ring-forest-900/10 hover:ring-forest-900/35'
      }`}
    >
      {/* the badge has a strip of its own at the top and the drawing the room below it, so the badge
          never sits on the drawing (the flats' plans reach right up to their top edge) */}
      <button
        onClick={onView}
        aria-label={`${unit.label}: view the plan`}
        className="group flex aspect-5/4 w-full flex-col overflow-hidden bg-white px-[5%] pb-[4%] pt-2.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ember"
      >
        <span className="label relative z-1 self-start rounded-full bg-paper/95 px-2.5 py-1 text-[max(0.52rem,8.5px)] tracking-[0.14em] text-forest-800 ring-1 ring-forest-900/10">
          {joined ? 'Jodi · two flats' : 'Typical floor'}
        </span>
        <span className="relative mt-[3%] min-h-0 w-full flex-1">
          {show === 'plan' ? (
            <img src={unit.plan} alt="" draggable="false" className="absolute inset-0 size-full object-contain transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03]" />
          ) : (
            <KeyPlan lit={unit.flats} className="absolute inset-[5%] size-[90%]" />
          )}
        </span>
      </button>
      <div className="flex flex-1 flex-col border-t border-forest-900/10 p-[clamp(0.8rem,1.6vh,1.15rem)]">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="display text-[clamp(1.2rem,2.6vh,1.7rem)] text-forest-900">{unit.label}</h3>
          <span className="label shrink-0 text-[max(0.55rem,8.5px)] tracking-[0.14em] text-ember-deep">{configOf(unit).label}</span>
        </div>
        <p className="mt-1 text-[clamp(0.74rem,1.45vh,0.88rem)] leading-snug text-ink/70">{roomsLine(unit)}</p>
        <p className="label mt-1.5 text-[max(0.52rem,8.5px)] tracking-[0.14em] text-ink/45">
          Floors {HOME_FLOORS} · {ALL_TOWERS}
        </p>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-[1.6vh]">
          <Pill
            tone={picked ? 'on' : 'line'}
            onClick={onPick}
            aria-pressed={picked}
            disabled={full && !picked}
            title={full && !picked ? 'Three homes are picked: take one out to add this one' : undefined}
            className="px-2 py-2.5 tracking-[0.14em]"
          >
            <Mark check={picked} className="size-3" />
            {picked ? 'Added' : 'Compare'}
          </Pill>
          <Pill onClick={onView} className="px-2 py-2.5 tracking-[0.14em]">
            View plan
          </Pill>
        </div>
      </div>
    </article>
  )
}

// The homes picked to compare, in three places, and the way on once there are two.
function Tray({ picked, onRemove, onCompare, className = '' }) {
  const units = picked.map((id) => UNITS.find((u) => u.id === id))
  const ready = picked.length >= 2
  return (
    <div role="region" aria-label="Homes to compare" className={`flex items-center gap-2 rounded-full bg-white p-1.5 shadow-[0_24px_50px_-26px_rgb(20_52_41/0.6)] ring-1 ring-forest-900/10 ${className}`}>
      <p className="label hidden shrink-0 pl-3.5 pr-1 text-[max(0.56rem,8.5px)] tracking-[0.15em] text-ink/55 xl:block">Compare</p>
      {/* a phone has no room for the empty places, so it says what they are for */}
      {!picked.length && <p className="label min-w-0 flex-1 truncate pl-3.5 text-[max(0.56rem,8.5px)] tracking-[0.14em] text-ink/55 sm:hidden">Pick homes to compare</p>}
      <ol className={`min-w-0 flex-1 gap-1.5 ${picked.length ? 'flex' : 'hidden sm:flex'}`}>
        {Array.from({ length: MOST_COMPARED }, (_, i) => {
          const u = units[i]
          return u ? (
            <li key={u.id} className="flex min-w-0 flex-1 items-center justify-between gap-1 rounded-full bg-forest-900 py-1 pl-3.5 pr-1 text-ivory">
              <span className="label truncate text-[max(0.55rem,8.5px)] tracking-[0.12em]">{u.label}</span>
              <button onClick={() => onRemove(u.id)} aria-label={`Take ${u.label} out of the comparison`} title="Take out" className="grid size-7 shrink-0 place-items-center rounded-full transition-colors duration-300 hover:bg-ivory/20">
                <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ) : (
            <li key={`slot-${i}`} aria-hidden="true" className="label hidden min-w-0 flex-1 items-center justify-center rounded-full border border-dashed border-forest-900/25 py-2.5 text-[max(0.55rem,8.5px)] tracking-[0.12em] text-ink/40 sm:flex">
              {i + 1}
            </li>
          )
        })}
      </ol>
      <Pill tone="solid" onClick={onCompare} disabled={!ready} className="shrink-0">
        {ready ? `Compare ${picked.length}` : picked.length ? 'Pick one more' : 'Pick 2 or 3'}
        {ready && <span aria-hidden="true">→</span>}
      </Pill>
      <p aria-live="polite" className="sr-only">
        {picked.length} of {MOST_COMPARED} homes picked to compare
      </p>
    </div>
  )
}

/**
 * Unit Comparison's first step: every kind of home, filtered by its bedrooms, its place on the floor
 * and the rooms it has. A card shows a home's plan (or where it sits on the floor), opens the plan
 * large, and puts the home in the tray; with two or three there, they go side by side.
 */
export default function UnitFinder() {
  const root = useRef(null)
  const { go } = useNav()
  const [filters, setFilters] = useState(() => ({ configs: finder.configs, flats: finder.flats, features: finder.features }))
  const [picked, setPicked] = useState(finder.picked)
  const [show, setShow] = useState(finder.show)
  const [open, setOpen] = useState(false)
  const [sheet, setSheet] = useState(null)
  useIntro(root)

  // the plans are a tap away, and what was set here stays for coming back
  useEffect(() => {
    decodeImages(UNITS.map((u) => u.plan))
  }, [])
  useEffect(() => {
    Object.assign(finder, filters, { picked, show })
  }, [filters, picked, show])

  const results = UNITS.filter((u) => fits(u, filters))
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: flip(f[key], value) }))
  const count = (skip, test) => UNITS.filter((u) => fits(u, filters, skip) && test(u)).length
  const active = filters.configs.length + filters.flats.length + filters.features.length
  const full = picked.length >= MOST_COMPARED
  const pick = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < MOST_COMPARED ? [...p, id] : p))
  const compare = () => go('residences', compareQuery(homesOf(picked)))
  const dimFlats = FLAT_IDS.filter((id) => !count('flats', (u) => u.flats.includes(id)))
  const sheetUnit = UNITS.find((u) => u.id === sheet)

  return (
    <section ref={root} className="screen bg-paper text-forest-900">
      <Botanical kind="fern" seed={21} depth={14} className="bottom-(--chrome-bot) left-0 w-[10vw] text-forest-700/10" />

      <div className="safe pane h-full">
        {/* stacked, the foot leaves room to scroll the last cards above the tray; wide, above the watermark */}
        <div className="grid min-h-full gap-[2.6vh] pb-[calc(var(--watermark-h)+6rem)] lg:h-full lg:grid-cols-[minmax(16rem,22%)_minmax(0,1fr)] lg:gap-x-[2.5vw] lg:pb-[calc(var(--watermark-h)+0.75rem)]">
          <aside className="flex min-h-0 flex-col pt-4 lg:pt-0">
            <div data-in className="max-w-sm">
              <ModeSwitch />
            </div>
            <h2 data-in className="display mt-[2.4vh] text-[clamp(1.9rem,4.6vh,3.4rem)] text-forest-800">
              Find your
              <br />
              residence
            </h2>

            {/* stacked, the filters fold away behind a button */}
            <button
              data-in
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="finder-filters"
              className="label mt-[2.2vh] flex items-center justify-between rounded-full border border-forest-900/25 bg-white/60 px-5 py-3 text-[max(0.6rem,9px)] tracking-[0.18em] lg:hidden"
            >
              <span>Filters{active ? ` · ${active} on` : ''}</span>
              <svg viewBox="0 0 24 24" className={`size-4 transition-transform duration-500 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <div id="finder-filters" className={`paper-scrollbar mt-[2.4vh] min-h-0 flex-1 flex-col gap-[2.2vh] lg:flex lg:overflow-y-auto lg:pr-2 ${open ? 'flex' : 'hidden'}`}>
              <Group title="Bedrooms">
                <div className="flex flex-wrap gap-2">
                  {CONFIGS.map((c) => (
                    <Chip key={c.id} on={filters.configs.includes(c.id)} count={count('configs', (u) => bedroomsOf(u) === c.id)} onClick={() => set('configs', c.id)}>
                      {c.label}
                    </Chip>
                  ))}
                </div>
              </Group>
              <Group
                title="Place on the floor"
                note={filters.flats.length ? `Homes taking up flat ${filters.flats.join(' or ')}` : 'Tap a flat to see the homes there'}
              >
                <KeyPlan lit={filters.flats} dim={dimFlats} onPick={(id) => set('flats', id)} label="Flats on the floor, to filter by" className="h-auto w-full max-w-68" />
              </Group>
              <Group title="Rooms">
                <div className="flex flex-wrap gap-2">
                  {FEATURES.map((ft) => (
                    <Chip key={ft.id} on={filters.features.includes(ft.id)} count={count('features', (u) => fits(u, { ...filters, features: [...new Set([...filters.features, ft.id])] }))} onClick={() => set('features', ft.id)}>
                      {ft.label}
                    </Chip>
                  ))}
                </div>
              </Group>
              {active > 0 && (
                <button onClick={() => setFilters(NONE)} className="label self-start py-1 text-[max(0.6rem,9px)] tracking-[0.18em] text-ember-deep underline-offset-4 transition-colors duration-300 hover:text-forest-900 hover:underline">
                  Clear the filters
                </button>
              )}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col">
            <div data-in className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p aria-live="polite" className="label text-[max(0.58rem,9px)] tracking-[0.18em] text-ink/60">
                <span className="text-forest-900">{results.length}</span>
                {results.length === UNITS.length ? ' plan types' : ` of ${UNITS.length} plan types`} · Floors {HOME_FLOORS} · {ALL_TOWERS}
              </p>
              <Segmented items={DRAWINGS} value={show} onChange={setShow} size="sm" className="w-[min(100%,15rem)]" />
            </div>

            {/* the scroller clips at its edges, so it keeps a hairline of room around the cards for a
                picked card's ring, drawn outside it (the negative margin keeps the cards in line) */}
            <div className="paper-scrollbar mt-[1.8vh] lg:-ml-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pl-1 lg:pr-2 lg:pt-1">
              {results.length ? (
                <ul aria-label="Homes" className="grid grid-cols-1 gap-[clamp(0.75rem,1.6vh,1.25rem)] sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] lg:pb-2">
                  {results.map((u) => (
                    <li key={u.id} className="flex">
                      <Card unit={u} show={show} picked={picked.includes(u.id)} full={full} onPick={() => pick(u.id)} onView={() => setSheet(u.id)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="grid min-h-[40vh] place-items-center rounded-[1.1rem] border border-dashed border-forest-900/20 p-8 text-center lg:h-full">
                  <div>
                    <p className="display text-[clamp(1.3rem,3vh,2rem)] text-forest-800">No home has all of these</p>
                    <Pill onClick={() => setFilters(NONE)} className="mx-auto mt-[2vh]">
                      Clear the filters
                    </Pill>
                  </div>
                </div>
              )}
            </div>

            {/* wide, at the foot of the results; stacked, floating above the dock */}
            <Tray
              picked={picked}
              onRemove={pick}
              onCompare={compare}
              className="absolute inset-x-(--gutter) bottom-[calc(var(--chrome-bot)+var(--watermark-h)+0.75rem)] z-10 lg:static lg:mt-[1.6vh]"
            />
          </div>
        </div>
      </div>

      {sheetUnit && <PlanSheet unit={sheetUnit} picked={picked.includes(sheetUnit.id)} canPick={!full} onPick={() => pick(sheetUnit.id)} onClose={() => setSheet(null)} />}
    </section>
  )
}
