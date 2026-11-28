import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP, reduced } from '../gsap/gsapConfig'
import { useIntro } from '../hooks/useIntro'
import { useNav } from '../app/nav'
import { decodeImages } from '../app/decode'
import { compareQuery, configOf, MOST_COMPARED, roomsLine, UNITS } from '../data/content'
import { ALL_TOWERS, AREA, areaOf, countWith, FACETS, filterHomes, filtering, filtersOn, finder, FLOOR_RANGE, homesOf, isJodi, NO_FILTERS, SORTS, sqft } from '../data/finder'
import KeyPlan from '../components/KeyPlan'
import { Mark, Pill } from '../components/Pill'
import Botanical from '../art/Botanical'
import ModeSwitch from './ModeSwitch'
import PlanSheet from './PlanSheet'
import CompareSheet from './CompareSheet'

const where = (u) => (isJodi(u) ? `Flats ${u.flats.join(' + ')}, joined` : `Flat ${u.flats[0]} on every floor`)
const FLATS = FACETS.find((f) => f.key === 'flats')
const CHIPS = FACETS.filter((f) => f !== FLATS)

// A filter's chip, with how many homes it would leave; one that would leave none stands back.
function Chip({ on, count, onClick, children }) {
  const none = !on && count === 0
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      disabled={none}
      title={none ? 'No home fits this with the other filters' : undefined}
      className={`label flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[max(0.54rem,8.5px)] tracking-[0.12em] transition-colors duration-300 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 [@media(max-height:32rem)]:px-2.5 [@media(max-height:32rem)]:py-1 ${
        on ? 'border-forest-900 bg-forest-900 text-ivory' : 'border-forest-900/18 bg-white/70 text-forest-900 enabled:hover:border-forest-900/60 enabled:hover:bg-white'
      }`}
    >
      {children}
      <span className={`tabular-nums tracking-normal ${on ? 'text-gold-lit' : 'text-ink/40'}`}>{count}</span>
    </button>
  )
}

function Facet({ label, children }) {
  return (
    <div role="group" aria-label={label} className="mt-[1.3vh] border-t border-forest-900/10 pt-[1.3vh]">
      <p className="label mb-[0.9vh] text-[max(0.52rem,8.5px)] tracking-[0.18em] text-ink/50">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

/*
 * A two-handled slider for a range (the area, the floors), after Runwal Zenith's: two native sliders
 * stacked over one drawn track, so both handles work by keyboard as well, the one nearer the pointer's
 * end lying on top so neither buries the other at the ends.
 */
function Range({ label, value, min, max, step = 1, format = String, unit, note, onChange }) {
  const [lo, hi] = value
  const pct = (n) => ((n - min) / (max - min)) * 100
  const mid = (min + max) / 2
  return (
    <div role="group" aria-label={label} className="mt-[1.3vh] border-t border-forest-900/10 pt-[1.3vh]">
      <div className="flex items-baseline justify-between gap-2">
        <p className="label text-[max(0.52rem,8.5px)] tracking-[0.18em] text-ink/50">{label}</p>
        <p aria-live="polite" className="text-[max(0.76rem,11px)] tabular-nums text-forest-900">
          {format(lo)} – {format(hi)} <span className="text-ink/45">{unit}</span>
        </p>
      </div>
      <div className="relative mt-1 flex h-6 items-center">
        <div className="absolute inset-x-0 h-[3px] rounded-full bg-forest-900/12" />
        <div className="absolute h-[3px] rounded-full bg-ember" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" className="range-dual" aria-label={`${label}, from`} aria-valuetext={`${format(lo)} ${unit}`} min={min} max={max} step={step} value={lo} onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])} style={{ zIndex: lo > mid ? 4 : 3 }} />
        <input type="range" className="range-dual" aria-label={`${label}, to`} aria-valuetext={`${format(hi)} ${unit}`} min={min} max={max} step={step} value={hi} onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])} style={{ zIndex: hi < mid ? 4 : 3 }} />
      </div>
      {note && <p className="mt-0.5 text-[max(0.66rem,10px)] leading-snug text-ink/50">{note}</p>}
    </div>
  )
}

// The order the homes are listed in, as a small menu beside their count.
function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const current = SORTS.find((s) => s.id === value) ?? SORTS[0]
  useEffect(() => {
    if (!open) return
    const out = (e) => !root.current?.contains(e.target) && setOpen(false)
    const key = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(false)
    }
    document.addEventListener('pointerdown', out)
    window.addEventListener('keydown', key, true)
    return () => {
      document.removeEventListener('pointerdown', out)
      window.removeEventListener('keydown', key, true)
    }
  }, [open])
  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full border bg-white/70 px-3 py-1.5 text-[max(0.7rem,10.5px)] transition-colors duration-300 ${open ? 'border-ember text-forest-900' : 'border-forest-900/18 text-ink/70 hover:text-forest-900'}`}
      >
        <span className="text-ink/45">Sort</span>
        <span className="max-w-36 truncate">{current.label}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true" className={`size-2.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ul
        role="listbox"
        aria-label="Sort the homes"
        className={`absolute right-0 z-30 mt-1.5 w-56 origin-top-right overflow-hidden rounded-xl bg-white py-1 shadow-[0_24px_48px_-20px_rgb(20_52_41/0.5)] ring-1 ring-forest-900/10 transition-[opacity,transform] duration-200 ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none -translate-y-1 scale-[0.98] opacity-0'
        }`}
      >
        {SORTS.map((s) => (
          <li key={s.id}>
            <button
              role="option"
              aria-selected={s.id === value}
              tabIndex={open ? 0 : -1}
              onClick={() => {
                onChange(s.id)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-[max(0.76rem,11px)] transition-colors duration-150 ${s.id === value ? 'bg-forest-900/5 text-forest-900' : 'text-ink/70 hover:bg-forest-900/4 hover:text-forest-900'}`}
            >
              {s.label}
              {s.id === value && <span className="size-1.5 rounded-full bg-ember" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// The homes picked to compare, and the way on once there are two.
function CompareBox({ picked, onRemove, onClear, onCompare, className = '' }) {
  const units = picked.map((id) => UNITS.find((u) => u.id === id))
  return (
    <div role="region" aria-label="Homes to compare" className={`rounded-[1.1rem] bg-ember/[0.07] p-[clamp(0.6rem,1.6vh,1rem)] ring-1 ring-ember/30 short:bg-transparent short:p-0 short:ring-0 ${className}`}>
      <div className="flex items-center justify-between gap-3 short:hidden">
        <p aria-live="polite" className="label text-[max(0.56rem,8.5px)] tracking-[0.16em] text-forest-900">
          Compare <span className="text-ember-deep">({picked.length}/{MOST_COMPARED})</span>
        </p>
        {picked.length > 0 && (
          <button onClick={onClear} className="text-[max(0.68rem,10px)] text-ink/55 underline underline-offset-4 transition-colors hover:text-forest-900">
            Clear
          </button>
        )}
      </div>
      {units.length ? (
        <ul className="mt-[1vh] flex flex-wrap gap-1.5 short:hidden">
          {units.map((u) => (
            <li key={u.id} className="flex items-center gap-0.5 rounded-full bg-white py-0.5 pl-3 pr-0.5 text-forest-900 ring-1 ring-forest-900/15">
              <span className="text-[max(0.7rem,10.5px)]">{u.label}</span>
              <button onClick={() => onRemove(u.id)} aria-label={`Take ${u.label} out of the comparison`} title="Take out" className="grid size-6 place-items-center rounded-full transition-colors duration-300 hover:bg-forest-900/10">
                <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-[0.8vh] text-[max(0.72rem,10.5px)] leading-snug text-ink/55 short:hidden">Tick up to three homes to set them side by side.</p>
      )}
      <Pill tone="solid" onClick={onCompare} disabled={picked.length < 2} className="mt-[1.2vh] w-full py-2.5 short:mt-0 short:py-2">
        {picked.length < 2 ? `Pick ${2 - picked.length} more` : 'Compare now'}
        <span className="hidden short:inline">· {picked.length}/{MOST_COMPARED}</span>
        {picked.length >= 2 && <span aria-hidden="true">→</span>}
      </Pill>
    </div>
  )
}

// A home as a plan card: the tick to compare it, its drawing (which opens it large) and what it is.
function HomeCard({ unit, picked, full, onPick, onOpen }) {
  const label = picked ? `Take ${unit.label} out of the comparison` : full ? 'Three homes are picked: take one out first' : `Add ${unit.label} to compare`
  return (
    <article data-card className={`group relative flex flex-col overflow-hidden rounded-[1.1rem] bg-white ring-1 transition-[box-shadow] duration-300 ${picked ? 'ring-2 ring-ember' : 'ring-forest-900/10 hover:shadow-[0_26px_50px_-30px_rgb(20_52_41/0.55)] hover:ring-forest-900/25'}`}>
      <button
        onClick={onPick}
        aria-pressed={picked}
        aria-label={label}
        title={label}
        disabled={full && !picked}
        className={`absolute left-2.5 top-2.5 z-10 grid size-8 place-items-center rounded-lg border transition-colors duration-300 enabled:active:scale-90 disabled:cursor-not-allowed disabled:opacity-35 ${
          picked ? 'border-ember bg-ember text-white' : 'border-forest-900/25 bg-white/95 text-transparent enabled:hover:border-forest-900 enabled:hover:text-forest-900/40'
        }`}
      >
        <Mark check className="size-4" />
      </button>

      <button onClick={onOpen} aria-label={`Open ${unit.label}'s plan`} className="relative block aspect-[4/3] w-full overflow-hidden bg-white outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ember [@media(max-height:32rem)]:aspect-[16/9]">
        <img src={unit.plan} alt={`${unit.label}, ${configOf(unit).label}, floor plan`} loading="lazy" draggable="false" className="size-full object-contain p-[clamp(0.6rem,1.6vh,1.1rem)] transition-transform duration-500 group-hover:scale-[1.03]" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center bg-forest-950/0 opacity-0 transition-all duration-300 group-hover:bg-forest-950/15 group-hover:opacity-100">
          <span className="grid size-10 place-items-center rounded-full bg-white text-forest-900 shadow-[0_10px_24px_-10px_rgb(0_0_0/0.5)]">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M20 20l-4.35-4.35M11 8.5v5M8.5 11h5" />
            </svg>
          </span>
        </span>
      </button>

      <div className="flex flex-1 items-end justify-between gap-3 border-t border-forest-900/10 px-[clamp(0.75rem,1.2vw,1.1rem)] py-[clamp(0.55rem,1.4vh,0.9rem)]">
        <div className="min-w-0">
          <p className="flex items-baseline gap-2">
            <span className="display truncate text-[clamp(1.05rem,2.4vh,1.45rem)] text-forest-900">{unit.label}</span>
            <span className="label shrink-0 text-[max(0.52rem,8.5px)] tracking-[0.12em] text-ember-deep">{configOf(unit).label}</span>
          </p>
          <p className="mt-0.5 truncate text-[max(0.7rem,10.5px)] text-ink/55">
            <span className="text-forest-900">
              {sqft(areaOf(unit))} {AREA.unit}
            </span>{' '}
            · {roomsLine(unit)}
          </p>
        </div>
        <KeyPlan lit={unit.flats} label={where(unit)} className="h-[clamp(1.8rem,4.4vh,2.6rem)] w-auto shrink-0 [@media(max-height:32rem)]:hidden" />
      </div>
    </article>
  )
}

/**
 * Unit Comparison's first step, as Runwal Zenith's "Search by unit": the filters down the left (with a
 * count and a sort, each chip saying how many homes it leaves, the flats on the key plan, a reset), the
 * homes to compare below them, and every home the filters leave as a plan card beside them. A card's
 * drawing opens it large; its tick puts it in the comparison, which opens over the finder.
 */
export default function UnitFinder() {
  const root = useRef(null)
  const grid = useRef(null)
  const { go } = useNav()
  const [filters, setFilters] = useState(finder.filters)
  const [picked, setPicked] = useState(finder.picked)
  const [sheet, setSheet] = useState(null)
  const [comparing, setComparing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  useIntro(root)

  const results = filterHomes(filters)
  const full = picked.length >= MOST_COMPARED
  const active = filtersOn(filters)
  const [floorLo, floorHi] = filters.floors
  const pick = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < MOST_COMPARED ? [...p, id] : p))
  const toggle = (key, value) => setFilters((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }))
  const reset = () => setFilters((f) => ({ ...NO_FILTERS, sort: f.sort }))
  const shown = results.map((u) => u.id).join()

  // the plans are a tap away, and what was set here stays for coming back
  useEffect(() => {
    decodeImages(UNITS.map((u) => u.plan))
  }, [])
  useEffect(() => {
    Object.assign(finder, { filters, picked })
  }, [filters, picked])

  // a change of filters or order settles the cards in again
  const first = useRef(true)
  useGSAP(
    () => {
      if (first.current) {
        first.current = false
        return
      }
      if (reduced()) return
      gsap.fromTo('[data-card]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.035, ease: 'power3.out', overwrite: true })
    },
    { scope: grid, dependencies: [shown] },
  )

  const filtersPanel = (
    <div className="rounded-[1.1rem] bg-white/70 p-[clamp(0.7rem,1.8vh,1.1rem)] ring-1 ring-forest-900/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="label text-[max(0.56rem,8.5px)] tracking-[0.16em] text-ink/55">
          {results.length} {results.length === 1 ? 'home' : 'homes'}
        </p>
        <SortMenu value={filters.sort} onChange={(sort) => setFilters((f) => ({ ...f, sort }))} />
      </div>
      {CHIPS.map((facet, i) => [
        <Facet key={facet.key} label={facet.label}>
          {facet.options.map((o) => (
            <Chip key={o.id} on={filters[facet.key].includes(o.id)} count={countWith(filters, facet, o.id)} onClick={() => toggle(facet.key, o.id)}>
              {o.label}
            </Chip>
          ))}
        </Facet>,
        // the two sliders come after the bedrooms, as Zenith's area does
        i === 0 && [
          <Range key="area" label={AREA.label} value={filters.area} min={AREA.min} max={AREA.max} step={10} format={sqft} unit="sq ft" note={AREA.note} onChange={(area) => setFilters((f) => ({ ...f, area }))} />,
          <Range
            key="floors"
            label="Floors"
            value={filters.floors}
            min={FLOOR_RANGE.min}
            max={FLOOR_RANGE.max}
            unit=""
            note={`Every home is on each floor from ${FLOOR_RANGE.min} to ${FLOOR_RANGE.max}; the floors set the height their views are compared from.`}
            onChange={(floors) => setFilters((f) => ({ ...f, floors }))}
          />,
        ],
      ])}
      <div className="mt-[1.3vh] border-t border-forest-900/10 pt-[1.3vh]">
        <p className="label mb-[0.9vh] text-[max(0.52rem,8.5px)] tracking-[0.18em] text-ink/50">{FLATS.label}</p>
        <div className="flex items-center gap-3">
          <KeyPlan
            lit={filters.flats}
            dim={FLATS.options.filter((o) => !filters.flats.includes(o.id) && countWith(filters, FLATS, o.id) === 0).map((o) => o.id)}
            onPick={(n) => toggle('flats', n)}
            label="Pick flats on the floor"
            className="h-[clamp(3.6rem,9vh,5.4rem)] w-auto shrink-0"
          />
          <p className="text-[max(0.7rem,10.5px)] leading-snug text-ink/55">Tap a flat to see the homes there: a jodi takes up two.</p>
        </div>
      </div>
      <button onClick={reset} disabled={!filtering(filters)} className="group mt-[1.4vh] flex items-center gap-2 text-[max(0.7rem,10.5px)] text-ink/55 transition-colors duration-300 hover:text-forest-900 disabled:pointer-events-none disabled:opacity-35">
        <span className="inline-block h-px w-4 bg-current transition-all duration-300 group-hover:w-7" />
        Reset filters
      </button>
      <Pill tone="solid" onClick={() => setShowFilters(false)} className="mt-3 hidden w-full py-2.5 short:flex">
        Show {results.length} {results.length === 1 ? 'home' : 'homes'}
      </Pill>
    </div>
  )

  return (
    <section ref={root} className="screen bg-paper text-forest-900 [--side-w:clamp(17rem,25vw,24rem)] sideways:[--side-w:clamp(14rem,34vw,17rem)]">
      <Botanical kind="fern" seed={21} depth={14} className="bottom-(--chrome-bot) left-0 w-[10vw] text-forest-700/10" />

      <div className="safe pane h-full">
        {/* landscape: the filters down the left, the homes beside them; upright, one after the other */}
        <div className="flex min-h-full flex-col gap-[clamp(0.8rem,2vh,1.4rem)] landscape:grid landscape:h-full landscape:grid-cols-[var(--side-w)_minmax(0,1fr)] landscape:grid-rows-[auto_minmax(0,1fr)] landscape:gap-x-[2.4vw]">
          {/* the two ways in, at the top, just under the sound switch (it brings itself in) */}
          <div className="w-[min(100%,22rem)] landscape:w-full">
            <ModeSwitch />
          </div>

          <aside className="flex min-h-0 flex-col gap-[1.4vh] landscape:col-start-1 landscape:row-start-2 landscape:mb-[calc(var(--watermark-h)+0.75rem)]">
            {/* upright, the filters fold away behind a button */}
            <button
              data-in
              onClick={() => setShowFilters((s) => !s)}
              aria-expanded={showFilters}
              className="label hidden shrink-0 items-center justify-between rounded-full border border-forest-900/18 bg-white/70 px-4 py-2.5 text-[max(0.6rem,9px)] tracking-[0.16em] portrait:flex roomy:hidden short:flex short:py-2"
            >
              <span>
                Filters{active > 0 && <span className="ml-2 text-ember-deep">· {active}</span>}
              </span>
              <span className="text-ink/55">
                {results.length} {results.length === 1 ? 'home' : 'homes'} {showFilters ? '▴' : '▾'}
              </span>
            </button>
            {showFilters && <div aria-hidden="true" onClick={() => setShowFilters(false)} className="fixed inset-0 z-10 hidden short:block" />}
            <div
              data-in
              className={`paper-scrollbar min-h-0 landscape:-mr-1.5 landscape:flex-1 landscape:overflow-y-auto landscape:pr-1.5 ${
                showFilters
                  ? 'short:fixed short:bottom-[calc(var(--chrome-bot)+0.5rem)] short:left-(--gutter) short:top-(--chrome-top) short:z-20 short:mr-0 short:w-[min(25rem,62vw)] short:rounded-[1.1rem] short:bg-paper short:pr-0 short:shadow-[0_40px_80px_-30px_rgb(0_0_0/0.55)]'
                  : 'portrait:hidden roomy:block short:hidden'
              }`}
            >
              {filtersPanel}
            </div>
            <CompareBox picked={picked} onRemove={pick} onClear={() => setPicked([])} onCompare={() => setComparing(true)} className="hidden shrink-0 landscape:block" />
          </aside>

          {/* every home the filters leave */}
          <div className="flex min-h-0 flex-col landscape:col-start-2 landscape:row-span-2 landscape:row-start-1">
            <header data-in className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <p className="label flex items-center gap-2 text-[max(0.56rem,8.5px)] tracking-[0.18em] text-ember-deep short:hidden before:h-px before:w-4 before:bg-ember before:content-['']">
                  Search by unit · {ALL_TOWERS} · {floorLo === floorHi ? `Floor ${floorLo}` : `Floors ${floorLo}–${floorHi}`}
                </p>
                <h2 className="display mt-1 text-[clamp(1.7rem,4.6vh,3.1rem)] text-forest-800">
                  {results.length} {results.length === 1 ? 'residence' : 'residences'}
                </h2>
              </div>
              <Pill tone={picked.length >= 2 ? 'solid' : 'line'} onClick={() => setComparing(true)} disabled={picked.length < 2} className="py-2.5">
                Compare {picked.length}/{MOST_COMPARED}
              </Pill>
            </header>

            <div ref={grid} className="paper-scrollbar mt-[1.8vh] min-h-0 flex-1 landscape:-mr-2 landscape:overflow-y-auto landscape:pr-2">
              {results.length ? (
                <div className="grid grid-cols-1 gap-[clamp(0.7rem,1.2vw,1.1rem)] pb-[calc(var(--watermark-h)+0.75rem)] roomy:grid-cols-2 sideways:grid-cols-2 lg:grid-cols-3">
                  {results.map((u) => (
                    <HomeCard key={u.id} unit={u} picked={picked.includes(u.id)} full={full} onPick={() => pick(u.id)} onOpen={() => setSheet(u)} />
                  ))}
                </div>
              ) : (
                <div className="grid min-h-[14rem] place-items-center rounded-[1.1rem] bg-white/60 p-8 text-center ring-1 ring-forest-900/10 landscape:h-[calc(100%-var(--watermark-h)-0.75rem)]">
                  <div>
                    <p className="text-[max(0.85rem,12px)] text-ink/60">No home fits all of these filters.</p>
                    <button onClick={reset} className="mt-2 text-[max(0.8rem,11.5px)] text-forest-900 underline underline-offset-4">
                      Reset filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* upright, the comparison comes last */}
          <CompareBox picked={picked} onRemove={pick} onClear={() => setPicked([])} onCompare={() => setComparing(true)} className="mb-[calc(var(--watermark-h)+0.75rem)] landscape:hidden" />
        </div>
      </div>

      {comparing && (
        <CompareSheet
          ids={picked}
          paused={!!sheet}
          onRemove={pick}
          onOpen={setSheet}
          onViews={() => go('residences', compareQuery(homesOf(picked, filters.floors), true))}
          onClose={() => setComparing(false)}
        />
      )}
      {sheet && <PlanSheet unit={sheet} picked={picked.includes(sheet.id)} canPick={!full} onPick={() => pick(sheet.id)} onClose={() => setSheet(null)} />}
    </section>
  )
}
