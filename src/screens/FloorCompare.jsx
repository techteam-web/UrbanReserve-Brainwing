import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useIntro } from '../hooks/useIntro'
import { useNav } from '../app/nav'
import { decodeImages } from '../app/decode'
import { compareQuery, configOf, facingOf, floorName, floorsOf, ROOM_ORDER, roomsLine, VIEW_LOOK } from '../data/content'
import { areasOf, ROOM_KINDS } from '../data/rooms'
import { finder, keepPicked } from '../data/finder'
import { SCENES } from '../data/scenes'
import { Segmented } from '../components/ui'
import KeyPlan from '../components/KeyPlan'
import { CloseButton, Pill } from '../components/Pill'
import PlanSheet from './PlanSheet'

const PanoramaViewer = lazy(() => import('../components/PanoramaViewer'))

const TABS = [
  { id: 'plan', label: 'Unit plan' },
  { id: 'key', label: 'Key plan & rooms' },
]
const HOW_MANY = ['', '', 'two', 'three']
const COLUMNS = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3' }
// Each view looks the way its home does, tilted a little down (Marzipano's pitch is positive below
// the horizon) so the city below fills most of it, as a picture rather than a panorama: it can't be
// turned (see PanoramaViewer's `still`).
const LOOK = VIEW_LOOK

// The homes' names (all in one tower, so the plan's name is enough)
const namesOf = (homes) => homes.map((h) => h.unit.label)

// The comparison's head: what is set side by side, and the ways on and out.
function Head({ homes, step, children }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-4 lg:pt-0">
      <h2 data-in className="eyebrow leading-relaxed text-ember">
        Compare · {namesOf(homes).join(' · ')}
        {step && ` · ${step}`}
      </h2>
      {/* no wider than the header, so the tabs in it narrow to a phone's width rather than run off it */}
      <div data-in className="flex max-w-full min-w-0 flex-wrap items-center gap-2">
        {children}
      </div>
    </header>
  )
}

// Out of the comparison to the finder, with these homes in its tray.
function useLeave(homes) {
  const { go } = useNav()
  return () => {
    keepPicked(homes)
    go('residences', '?units')
  }
}

// The rooms of the kind picked, lit on a plan: a soft ember fill (one layer, so where boxes overlap it
// doesn't darken) with a fine edge round each, fading in and out
function RoomGlow({ unit, kind }) {
  const areas = areasOf(unit)
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-0 size-full">
      {Object.entries(areas).map(([k, boxes]) => (
        <g key={k} className="transition-opacity duration-500" opacity={k === kind ? 1 : 0}>
          <g opacity="0.32" fill="var(--color-ember)">
            {boxes.map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} />
            ))}
          </g>
          <g fill="none" stroke="var(--color-ember)" strokeWidth="1.6" vectorEffect="non-scaling-stroke">
            {boxes.map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        </g>
      ))}
    </svg>
  )
}

// The kinds of room the homes on show have, to light on all their plans at once ("click on bedroom,
// and the bedrooms of all three light up"); a second tap puts the light out
function RoomPicker({ homes, kind, onPick }) {
  const kinds = ROOM_KINDS.filter((k) => homes.some((h) => areasOf(h.unit)[k.id]))
  return (
    <div data-in role="group" aria-label="Light a kind of room on every plan" className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      <span className="label shrink-0 pr-1 text-[max(0.56rem,8.5px)] tracking-[0.2em] text-ink/55">Show</span>
      {kinds.map((k) => {
        const on = kind === k.id
        return (
          <button
            key={k.id}
            onClick={() => onPick(on ? null : k.id)}
            aria-pressed={on}
            className={`label shrink-0 rounded-full border px-3.5 py-2 text-[max(0.56rem,8.5px)] tracking-[0.14em] transition-colors duration-300 active:scale-95 ${
              on ? 'border-ember bg-ember text-white' : 'border-forest-900/20 bg-white/60 text-forest-900 hover:border-forest-900/60 hover:bg-white'
            }`}
          >
            {k.label}
          </button>
        )
      })}
    </div>
  )
}

function PlanCard({ home, name, kind, onView }) {
  const { unit } = home
  return (
    <article data-in className="flex min-h-0 flex-col lg:row-span-4 lg:grid lg:grid-rows-subgrid">
      <button
        onClick={onView}
        aria-label={`${name}: view the plan`}
        className="group relative min-h-[min(70vw,24rem)] overflow-hidden rounded-[1.25rem] bg-white shadow-[0_30px_60px_-40px_rgb(20_52_41/0.55)] ring-1 ring-forest-900/10 transition-shadow duration-300 outline-none hover:ring-forest-900/35 focus-visible:ring-2 focus-visible:ring-ember lg:min-h-0 lg:flex-1"
      >
        {/* the drawing in a frame of its own shape, so the rooms lit over it sit on their walls */}
        <span className="absolute inset-[5%] @container-size">
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03]"
            style={{ width: `min(100cqw, 100cqh * ${unit.aspect})`, aspectRatio: unit.aspect }}
          >
            <img src={unit.plan} alt={`${unit.label} floor plan`} draggable="false" className="absolute inset-0 size-full" />
            <RoomGlow unit={unit} kind={kind} />
          </span>
        </span>
        {unit.flats.length > 1 && (
          <span className="label absolute left-3 top-3 rounded-full bg-paper/95 px-2.5 py-1 text-[max(0.52rem,8.5px)] tracking-[0.14em] text-forest-800 ring-1 ring-forest-900/10">Jodi · two flats</span>
        )}
      </button>
      <div className="mt-[1.4vh] flex items-baseline justify-between gap-3">
        <h3 className="display text-[clamp(1.35rem,3vh,2.1rem)] text-forest-900">{name}</h3>
        <span className="label shrink-0 text-[max(0.58rem,9px)] tracking-[0.14em] text-ember-deep">{configOf(unit).label}</span>
      </div>
      <p className="mt-1 text-[clamp(0.76rem,1.5vh,0.9rem)] text-ink/70">{roomsLine(unit)}</p>
      <Pill onClick={onView} className="mt-[1.6vh] w-full">
        View plan <span aria-hidden="true">→</span>
      </Pill>
    </article>
  )
}

// Where each home sits on the floor, then their rooms in one table, the rooms that aren't alike in all
// of them marked.
function KeyAndRooms({ homes, names }) {
  const sizes = homes.map((h) => new Map(h.unit.rooms))
  const rooms = ROOM_ORDER.filter((n) => sizes.some((s) => s.has(n)))
  const differs = (n) => new Set(sizes.map((s) => s.get(n))).size > 1
  const same = !rooms.some(differs)
  return (
    <div data-in className="flex min-h-0 flex-1 flex-col">
      <div tabIndex={0} role="region" aria-label="Where each home sits, and its rooms" className="more-below paper-scrollbar min-h-0 overflow-y-auto pr-2 lg:flex-1">
        <table className="w-full table-fixed border-collapse text-[clamp(0.76rem,1.55vh,0.95rem)]">
          <colgroup>
            <col className="w-[clamp(6.5rem,20%,14rem)]" />
            {homes.map((_, i) => (
              <col key={i} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-[1] bg-paper">
            <tr>
              <th scope="col" className="pb-3 text-left align-bottom font-normal">
                <span className="label text-[max(0.56rem,8.5px)] text-ink/55">Room</span>
              </th>
              {homes.map((h, i) => (
                <th key={i} scope="col" className="px-1.5 pb-3 text-left align-bottom font-normal sm:px-3">
                  <span className="label block text-[max(0.55rem,8.5px)] tracking-[0.14em] text-ember-deep">{configOf(h.unit).label}</span>
                  <span className="display mt-1 block text-[clamp(1rem,2.4vh,1.6rem)] text-forest-900">{names[i]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-forest-900/10">
              <th scope="row" className="py-3 pr-2 text-left align-middle font-normal text-ink/70">
                On the floor
              </th>
              {homes.map((h, i) => (
                <td key={i} className="px-1.5 py-3 sm:px-3">
                  <KeyPlan lit={h.unit.flats} label={`${names[i]} on the floor`} className="h-auto w-full max-w-[12rem]" />
                </td>
              ))}
            </tr>
            {rooms.map((n) => (
              <tr key={n} className="border-t border-forest-900/10">
                <th scope="row" className="py-[0.75vh] pr-2 text-left align-top font-normal text-ink/70">
                  <span className="flex items-center gap-2">
                    {differs(n) && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-ember" />}
                    {n}
                    {differs(n) && <span className="sr-only">, differs</span>}
                  </span>
                </th>
                {sizes.map((s, i) => (
                  <td key={i} className={`whitespace-pre-line px-1.5 py-[0.75vh] align-top sm:px-3 ${differs(n) ? 'font-medium text-ember-deep' : ''}`}>
                    {s.get(n) ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-[1.2vh] flex shrink-0 items-center gap-2 text-[clamp(0.74rem,1.45vh,0.88rem)] text-ink/65">
        {!same && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-ember" />}
        {same ? 'The same rooms and sizes: what sets them apart is the view.' : `Differs between the ${HOW_MANY[homes.length]}`}
      </p>
    </div>
  )
}

// The second step: the homes' plans side by side, or where each sits on the floor with their rooms.
export function ComparePlans({ homes }) {
  const root = useRef(null)
  const { go } = useNav()
  const [tab, setTab] = useState(finder.tab)
  const [sheet, setSheet] = useState(null)
  const [kind, setKind] = useState(null)
  const leave = useLeave(homes)
  const names = namesOf(homes)
  const plans = homes.map((h) => h.unit.plan).join()
  useIntro(root)
  useEffect(() => {
    finder.tab = tab
  }, [tab])
  useEffect(() => {
    decodeImages(plans.split(','))
  }, [plans])

  return (
    <section ref={root} className="screen bg-paper text-forest-900">
      <div className="safe pane h-full">
        {/* the padding keeps the foot of the content clear of the watermark */}
        <div className="flex min-h-full flex-col gap-[2.6vh] pb-[calc(var(--watermark-h)+1rem)] lg:h-full">
          <Head homes={homes}>
            <Segmented items={TABS} value={tab} onChange={setTab} size="sm" className="w-96 max-w-full *:tracking-[0.12em]" />
            <Pill tone="solid" onClick={() => go('residences', compareQuery(homes, true))}>
              Compare views <span aria-hidden="true">→</span>
            </Pill>
            <CloseButton onClick={leave} label="Back to the unit finder" />
          </Head>

          {tab === 'plan' ? (
            <>
              <RoomPicker homes={homes} kind={kind} onPick={setKind} />
              <div className={`grid gap-[clamp(1.4rem,2.2vw,2.75rem)] lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)_auto_auto_auto] lg:gap-y-0 ${COLUMNS[homes.length]}`}>
                {homes.map((h, i) => (
                  <PlanCard key={i} home={h} name={names[i]} kind={kind} onView={() => setSheet(h.unit)} />
                ))}
              </div>
            </>
          ) : (
            <KeyAndRooms homes={homes} names={names} />
          )}
        </div>
      </div>

      {sheet && <PlanSheet unit={sheet} onClose={() => setSheet(null)} />}
    </section>
  )
}

// The third step: from each home, the one way it looks out, at the height of a floor picked for all of
// them, as still pictures side by side, all in the tower on offer.
export function CompareViews({ homes }) {
  const root = useRef(null)
  const { go } = useNav()
  const leave = useLeave(homes)
  const names = namesOf(homes)
  const floorId = homes[0].floor.id
  useIntro(root)

  // the way each home looks out holds while the screen is up (it is set anew for other homes, see
  // Residences); a floor changes only the picture it looks at
  const [looks] = useState(() => homes.map((h) => ({ ...facingOf(h.unit), ...LOOK })))
  const show = (next) => go('residences', compareQuery(next, true), { replace: true })
  const atFloor = (towerId, n) => floorsOf(towerId).find((f) => f.id === n) ?? floorsOf(towerId)[0]
  const pickFloor = (n) => show(homes.map((h) => ({ ...h, floor: atFloor(h.tower.id, n) })))

  return (
    <section ref={root} className="screen bg-paper text-forest-900">
      <div className="safe pane h-full">
        <div className="flex min-h-full flex-col gap-[2.2vh] pb-[calc(var(--watermark-h)+1rem)] lg:h-full">
          <Head homes={homes} step="Views">
            <Pill onClick={() => go('residences', compareQuery(homes))}>
              <span aria-hidden="true">←</span> Unit plans
            </Pill>
            <CloseButton onClick={leave} label="Back to the unit finder" />
          </Head>

          <div data-in role="group" aria-label="The height of the views" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="label text-[max(0.58rem,9px)] tracking-[0.2em] text-ink/60">At the height of floor</p>
            <div className="flex flex-wrap gap-1.5">
              {floorsOf(homes[0].tower.id).map((f) => {
                const on = f.id === floorId
                return (
                  <button
                    key={f.id}
                    onClick={() => pickFloor(f.id)}
                    aria-pressed={on}
                    aria-label={floorName(f.id)}
                    className={`label grid size-[clamp(2.6rem,5.2vh,3.2rem)] place-items-center rounded-full border text-[max(0.64rem,9.5px)] tracking-[0.06em] transition-colors duration-300 active:scale-95 ${
                      on ? 'border-ember bg-ember text-white' : 'border-forest-900/20 bg-white/60 text-forest-900 hover:border-forest-900/70 hover:bg-white'
                    }`}
                  >
                    {f.id}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={`grid gap-[clamp(1.4rem,1.8vw,2.25rem)] lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-y-0 ${COLUMNS[homes.length]}`}>
            {homes.map((h, i) => (
              <figure key={i} data-in className="flex min-h-0 flex-col lg:row-span-2 lg:grid lg:grid-rows-subgrid">
                <div
                  role="img"
                  aria-label={`The outlook of ${names[i]} from ${h.tower.label}, at the height of the ${floorName(h.floor.id).toLowerCase()}`}
                  className="relative h-[min(64vh,34rem)] overflow-hidden rounded-[1.1rem] bg-forest-900 ring-1 ring-forest-900/10 select-none lg:h-auto lg:min-h-0 lg:flex-1"
                >
                  <Suspense fallback={null}>
                    <PanoramaViewer still scenes={SCENES} active={h.floor.key} autorotate={false} facing={looks[i]} />
                  </Suspense>
                </div>
                <figcaption className="mt-[1.3vh]">
                  <p className="flex items-baseline gap-2.5">
                    <span className="display text-[clamp(1.25rem,2.7vh,1.9rem)] text-forest-900">{h.unit.label}</span>
                    <span className="label text-[max(0.56rem,8.5px)] tracking-[0.14em] text-ember-deep">{configOf(h.unit).label}</span>
                  </p>
                  <p className="label mt-1.5 text-[max(0.55rem,8.5px)] tracking-[0.14em] text-ink/55">
                    From {h.tower.label} · {h.floor.height} m up, the {floorName(h.floor.id).toLowerCase()}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>

          <p data-in className="max-w-5xl text-[max(0.72rem,10.5px)] leading-relaxed text-ink/55">
            Drone photographs taken where each tower stands, at the height of the chosen floor, and turned the way each home looks out. They show its outlook, not the exact view from inside the
            home.
          </p>
        </div>
      </div>
    </section>
  )
}
