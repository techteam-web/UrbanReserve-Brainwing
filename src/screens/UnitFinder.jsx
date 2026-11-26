import { useEffect, useRef, useState } from 'react'
import { useIntro } from '../hooks/useIntro'
import { useNav } from '../app/nav'
import { decodeImages } from '../app/decode'
import { bedroomsOf, compareQuery, configOf, CONFIGS, MOST_COMPARED, roomsLine, UNITS } from '../data/content'
import { ALL_TOWERS, finder, HOME_FLOORS, homesOf } from '../data/finder'
import { Swap } from '../components/ui'
import ZoomPan from '../components/ZoomPan'
import KeyPlan from '../components/KeyPlan'
import { Mark, Pill } from '../components/Pill'
import Botanical from '../art/Botanical'
import ModeSwitch from './ModeSwitch'
import PlanSheet from './PlanSheet'

// every kind of home, then each bedroom count
const KINDS = [{ id: 0, label: 'All' }, ...CONFIGS]
// the homes in the order the list shows them: by their bedrooms, fewest first
const ORDERED = CONFIGS.flatMap((c) => UNITS.filter((u) => bedroomsOf(u) === c.id))
const ofKind = (kind) => (kind ? ORDERED.filter((u) => bedroomsOf(u) === kind) : ORDERED)
const two = (n) => String(n).padStart(2, '0')
const where = (u) => (u.flats.length > 1 ? `Flats ${u.flats.join(' + ')}, joined` : `Flat ${u.flats[0]} on every floor`)

// A bedroom count to show the homes of, with how many there are.
function Kind({ on, count, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`label flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[max(0.58rem,9px)] tracking-[0.14em] transition-colors duration-300 active:scale-95 ${
        on ? 'border-forest-900 bg-forest-900 text-ivory' : 'border-forest-900/20 bg-white/60 text-forest-900 hover:border-forest-900/70 hover:bg-white'
      }`}
    >
      {children}
      <span className={`tabular-nums tracking-normal ${on ? 'text-gold-lit' : 'text-ink/45'}`}>{count}</span>
    </button>
  )
}

// The round + / ✓ that puts a home in the comparison or takes it out.
function AddButton({ unit, picked, full, onPick, className = '' }) {
  const label = picked ? `Take ${unit.label} out of the comparison` : full ? 'Three homes are picked: take one out first' : `Add ${unit.label} to compare`
  return (
    <button
      onClick={onPick}
      aria-pressed={picked}
      aria-label={label}
      title={label}
      disabled={full && !picked}
      className={`grid size-9 shrink-0 place-items-center rounded-full border transition-colors duration-300 enabled:active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 ${
        picked ? 'border-ember bg-ember text-white enabled:hover:bg-ember-deep' : 'border-forest-900/20 bg-white text-forest-900 enabled:hover:border-forest-900 enabled:hover:bg-forest-900 enabled:hover:text-ivory'
      } ${className}`}
    >
      <Mark check={picked} className="size-3.5" />
    </button>
  )
}

// A home in the list: its plan, small, its name and size, and the + to compare it.
function Row({ unit, on, picked, full, onShow, onPick }) {
  return (
    <li className="shrink-0">
      <div
        className={`relative flex items-center gap-3 rounded-[0.9rem] p-1.5 pr-2 transition-[background-color,box-shadow] duration-300 ${
          on ? 'bg-white shadow-[0_16px_34px_-24px_rgb(20_52_41/0.6)] ring-1 ring-forest-900/12' : 'hover:bg-white/55'
        }`}
      >
        <span aria-hidden="true" className={`absolute inset-y-3 left-0 w-[3px] rounded-full bg-ember transition-transform duration-500 ${on ? 'scale-y-100' : 'scale-y-0'}`} />
        <button onClick={onShow} aria-current={on || undefined} className="flex min-w-0 flex-1 items-center gap-3 rounded-[0.7rem] text-left outline-none focus-visible:ring-2 focus-visible:ring-ember">
          <span className="grid h-[clamp(2rem,6vh,3.4rem)] w-[clamp(2.8rem,8vh,4.6rem)] shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-forest-900/10">
            <img src={unit.plan} alt="" draggable="false" className="max-h-full max-w-full object-contain p-1" />
          </span>
          <span className="min-w-0">
            <span className={`block truncate font-display text-[clamp(1rem,2.2vh,1.3rem)] uppercase leading-tight tracking-[0.04em] transition-colors duration-300 ${on ? 'text-ember-deep' : 'text-forest-900'}`}>
              {unit.label}
            </span>
            <span className="label mt-0.5 block truncate text-[max(0.52rem,8.5px)] tracking-[0.14em] text-ink/50">{configOf(unit).label}</span>
          </span>
        </button>
        <AddButton unit={unit} picked={picked} full={full} onPick={onPick} />
      </div>
    </li>
  )
}

function Arrow({ back = false, disabled, onClick }) {
  const label = back ? 'The home before' : 'The next home'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-full border border-forest-900/20 bg-white text-forest-900 transition-colors duration-300 hover:border-forest-900 hover:bg-forest-900 hover:text-ivory active:scale-95 disabled:pointer-events-none disabled:opacity-30 [@media(max-height:32rem)]:size-8"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={back ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  )
}

// The homes picked to compare, and the way on once there are two.
function Tray({ picked, onRemove, onCompare, className = '' }) {
  const units = picked.map((id) => UNITS.find((u) => u.id === id))
  const ready = picked.length >= 2
  return (
    <div role="region" aria-label="Homes to compare" className={`rounded-[1.1rem] bg-white p-[clamp(0.4rem,1.4vh,0.9rem)] shadow-[0_24px_50px_-30px_rgb(20_52_41/0.6)] ring-1 ring-forest-900/10 ${className}`}>
      <div className="flex items-center justify-between gap-3 [@media(max-height:32rem)]:hidden">
        <p className="label text-[max(0.56rem,8.5px)] tracking-[0.16em] text-forest-900">Compare</p>
        <p aria-live="polite" className="label text-[max(0.52rem,8.5px)] tracking-[0.14em] text-ink/45">
          {picked.length} of {MOST_COMPARED}
        </p>
      </div>
      {units.length ? (
        <ol className="mt-2 flex flex-wrap gap-1.5 [@media(max-height:32rem)]:hidden">
          {units.map((u) => (
            <li key={u.id} className="flex items-center gap-0.5 rounded-full bg-forest-900 py-0.5 pl-3 pr-0.5 text-ivory">
              <span className="label text-[max(0.52rem,8.5px)] tracking-[0.12em]">{u.label}</span>
              <button onClick={() => onRemove(u.id)} aria-label={`Take ${u.label} out of the comparison`} title="Take out" className="grid size-6 place-items-center rounded-full transition-colors duration-300 hover:bg-ivory/20">
                <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[clamp(0.72rem,1.4vh,0.85rem)] [@media(max-height:32rem)]:hidden leading-snug text-ink/55">
          Tap
          <span className="inline-grid size-5 place-items-center rounded-full border border-forest-900/25">
            <Mark className="size-2.5" />
          </span>
          on two or three homes
        </p>
      )}
      <Pill tone="solid" onClick={onCompare} disabled={!ready} className="mt-2 w-full py-2.5 [@media(max-height:32rem)]:mt-0 [@media(max-height:32rem)]:py-2">
        {ready ? `Compare ${picked.length} homes` : `Compare · ${picked.length} of ${MOST_COMPARED}`}
        {ready && <span aria-hidden="true">→</span>}
      </Pill>
    </div>
  )
}

/**
 * Unit Comparison's first step, laid out as the Rustomjee app lays out its floors: every home in a list
 * down the left (grouped by bedrooms, with a filter for them above), and the one picked large beside
 * it, its plan to zoom into, where it sits on the floor and its rooms. Any home is one tap away, the
 * arrows step through them, and the + on each puts it in the comparison below the list.
 */
export default function UnitFinder() {
  const root = useRef(null)
  const list = useRef(null)
  const { go } = useNav()
  const [kind, setKind] = useState(() => finder.configs[0] ?? 0)
  const [picked, setPicked] = useState(finder.picked)
  const [current, setCurrent] = useState(() => finder.current ?? ORDERED[0].id)
  const [sheet, setSheet] = useState(false)
  useIntro(root)

  const results = ofKind(kind)
  // a filter that leaves the home on show out shows its first home instead
  const unit = results.find((u) => u.id === current) ?? results[0]
  const index = results.indexOf(unit)
  const added = picked.includes(unit.id)
  const full = picked.length >= MOST_COMPARED
  const pick = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < MOST_COMPARED ? [...p, id] : p))
  const compare = () => go('residences', compareQuery(homesOf(picked)))
  const step = (by) => setCurrent(results[index + by].id)
  // with every home listed, they're grouped by their bedrooms
  const groups = CONFIGS.map((c) => [c, results.filter((u) => bedroomsOf(u) === c.id)]).filter(([, homes]) => homes.length)

  // the plans are a tap away, and what was set here stays for coming back
  useEffect(() => {
    decodeImages(UNITS.map((u) => u.plan))
  }, [])
  useEffect(() => {
    Object.assign(finder, { configs: kind ? [kind] : [], picked, current: unit.id })
  }, [kind, picked, unit.id])
  // the home on show stays in sight in the list (scrolling the list only, not the page)
  useEffect(() => {
    const box = list.current
    const row = box?.querySelector('[aria-current]')?.closest('li')
    if (!row) return
    const b = box.getBoundingClientRect()
    const r = row.getBoundingClientRect()
    const dx = r.left < b.left ? r.left - b.left - 12 : r.right > b.right ? r.right - b.right + 12 : 0
    const dy = r.top < b.top ? r.top - b.top - 8 : r.bottom > b.bottom ? r.bottom - b.bottom + 8 : 0
    if (dx || dy) box.scrollBy({ left: dx, top: dy, behavior: 'smooth' })
  }, [unit.id])

  return (
    <section ref={root} className="screen bg-paper text-forest-900 [--list-w:clamp(17rem,24vw,26rem)] sideways:[--list-w:clamp(13rem,32vw,16rem)]">
      <Botanical kind="fern" seed={21} depth={14} className="bottom-(--chrome-bot) left-0 w-[10vw] text-forest-700/10" />

      <div className="safe pane h-full">
        {/* landscape: the list down the left, the home beside it; upright, the list is a strip above it */}
        <div className="flex min-h-full flex-col gap-[clamp(0.8rem,2vh,1.4rem)] landscape:grid landscape:h-full landscape:grid-cols-[var(--list-w)_minmax(0,1fr)] landscape:grid-rows-[auto_minmax(0,1fr)] landscape:gap-x-[2vw]">
          {/* the two ways in, at the top, just under the sound switch */}
          <div data-in className="w-[min(100%,22rem)] landscape:w-full">
            <ModeSwitch />
          </div>

          <aside className="flex min-h-0 flex-col landscape:col-start-1 landscape:row-start-2">
            <div data-in className="[@media(max-height:32rem)]:hidden">
              <p className="label text-[max(0.56rem,8.5px)] tracking-[0.18em] text-ember-deep">
                {ALL_TOWERS} · Floors {HOME_FLOORS}
              </p>
              <h2 className="display mt-1.5 text-[clamp(1.6rem,3.6vh,2.6rem)] text-forest-800">Find your residence</h2>
            </div>

            {/* the bedrooms: one row, which scrolls sideways where it doesn't fit */}
            <div
              data-in
              role="group"
              aria-label="Bedrooms"
              className="-mx-(--gutter) mt-[1.8vh] flex shrink-0 gap-1.5 overflow-x-auto px-(--gutter) pb-1 [scrollbar-width:none] landscape:mx-0 landscape:flex-wrap landscape:overflow-visible landscape:px-0 [@media(max-height:32rem)]:mt-0 [@media(max-height:32rem)]:flex-nowrap [@media(max-height:32rem)]:overflow-x-auto"
            >
              {KINDS.map((k) => (
                <Kind key={k.id} on={kind === k.id} count={ofKind(k.id).length} onClick={() => setKind(k.id)}>
                  {k.label}
                </Kind>
              ))}
            </div>

            {/* every home the filter leaves, grouped by bedrooms; upright, a strip that scrolls sideways */}
            <nav
              ref={list}
              data-in
              aria-label="Homes"
              className="paper-scrollbar -mx-(--gutter) mt-[1.4vh] shrink-0 overflow-x-auto px-(--gutter) pb-1 [scrollbar-width:none] landscape:mx-0 landscape:min-h-0 landscape:flex-1 landscape:shrink landscape:overflow-x-hidden landscape:overflow-y-auto landscape:px-0 landscape:pr-1.5 landscape:[scrollbar-width:thin]"
            >
              <div className="flex gap-4 landscape:block">
                {groups.map(([config, homes]) => (
                  <section key={config.id} aria-label={config.label} className="shrink-0 landscape:mb-[1.4vh]">
                    <p className="label mb-1.5 hidden items-center gap-2 text-[max(0.52rem,8.5px)] tracking-[0.18em] text-ink/45 landscape:flex">
                      {config.label}
                      <span className="h-px flex-1 bg-forest-900/10" />
                      <span className="tabular-nums">{homes.length}</span>
                    </p>
                    <ul className="flex gap-1.5 landscape:block landscape:space-y-1">
                      {homes.map((u) => (
                        <Row key={u.id} unit={u} on={u === unit} picked={picked.includes(u.id)} full={full} onShow={() => setCurrent(u.id)} onPick={() => pick(u.id)} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </nav>

            <Tray picked={picked} onRemove={pick} onCompare={compare} className="mt-[1.4vh] hidden shrink-0 landscape:block" />
          </aside>

          {/* the home on show, large */}
          <div
            data-fade
            className="relative flex min-h-[26rem] landscape:mb-[calc(var(--watermark-h)+0.75rem)] flex-1 flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[0_40px_80px_-48px_rgb(20_52_41/0.55)] ring-1 ring-forest-900/10 landscape:col-start-2 landscape:row-span-2 landscape:row-start-1 landscape:min-h-0"
          >
            <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-[clamp(1rem,1.8vw,1.75rem)] pt-[clamp(0.6rem,2vh,1.4rem)]">
              <Swap id={unit.id} className="min-w-0">
                <p data-swap className="label truncate text-[max(0.58rem,9px)] tracking-[0.16em] text-ember-deep">
                  {configOf(unit).label} · {where(unit)}
                </p>
                <h3 data-swap className="display mt-1 truncate text-[clamp(1.4rem,4.4vh,3.1rem)] text-forest-800">
                  {unit.label}
                </h3>
              </Swap>
              <div className="flex items-center gap-2">
                <p className="label mr-1.5 text-[max(0.58rem,9px)] tracking-[0.18em] text-ink/50">
                  <span className="text-forest-900">{two(index + 1)}</span> / {two(results.length)}
                </p>
                <Arrow back disabled={index <= 0} onClick={() => step(-1)} />
                <Arrow disabled={index >= results.length - 1} onClick={() => step(1)} />
              </div>
            </header>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_clamp(15rem,20vw,23rem)]">
              <div className="relative min-h-[14rem] landscape:min-h-0">
                <ZoomPan key={unit.id} src={unit.plan} alt={`${unit.label}, ${configOf(unit).label}, floor plan`} aspect={unit.aspect} className="absolute inset-0" />
              </div>

              {/* wide screens: where it sits, its rooms and the way to compare it, beside the plan */}
              <div className="hidden min-h-0 flex-col border-l border-forest-900/10 p-[clamp(1rem,2vh,1.5rem)] lg:flex">
                <div className="flex shrink-0 items-center gap-4">
                  <KeyPlan lit={unit.flats} label={`${unit.label} on the floor`} className="h-[clamp(3.5rem,9vh,5.5rem)] w-auto shrink-0" />
                  <p className="text-[clamp(0.78rem,1.5vh,0.92rem)] leading-snug text-ink/70">{roomsLine(unit)}</p>
                </div>
                <div tabIndex={0} role="region" aria-label="Room sizes" className="more-below paper-scrollbar mt-[2vh] min-h-0 flex-1 overflow-y-auto pr-2">
                  <dl className="text-[clamp(0.78rem,1.5vh,0.92rem)]">
                    {unit.rooms.map(([name, size]) => (
                      <div key={name} className="flex justify-between gap-3 border-t border-forest-900/10 py-[0.6vh] first:border-t-0">
                        <dt className="text-ink/70">{name}</dt>
                        <dd className="whitespace-pre-line text-right">{size}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <Pill tone={added ? 'on' : 'line'} onClick={() => pick(unit.id)} disabled={full && !added} aria-pressed={added} className="mt-[2vh] w-full shrink-0">
                  <Mark check={added} />
                  {added ? 'Added to compare' : full ? 'Three already picked' : 'Add to compare'}
                </Pill>
              </div>
            </div>

            {/* smaller screens: its rooms open in a sheet */}
            <div className="flex items-center gap-2 border-t border-forest-900/10 p-2.5 lg:hidden">
              <p className="min-w-0 flex-1 truncate pl-1.5 text-[max(0.72rem,11px)] text-ink/65">{roomsLine(unit)}</p>
              <Pill onClick={() => setSheet(true)} className="px-4 py-2.5">
                Rooms
              </Pill>
              <AddButton unit={unit} picked={added} full={full} onPick={() => pick(unit.id)} className="size-10" />
            </div>
          </div>

          {/* upright, the comparison comes last */}
          <Tray picked={picked} onRemove={pick} onCompare={compare} className="mb-[calc(var(--watermark-h)+0.75rem)] landscape:hidden" />
        </div>
      </div>

      {sheet && <PlanSheet unit={unit} picked={added} canPick={!full} onPick={() => pick(unit.id)} onClose={() => setSheet(false)} />}
    </section>
  )
}
