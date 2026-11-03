import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useGSAP } from '../gsap/gsapConfig'
import { playIn, useIntro } from '../hooks/useIntro'
import { useNav } from '../app/nav'
import { decodeImages } from '../app/decode'
import { compareQuery, facingOf, FLOOR_PLANS, floorsOf, MOST_COMPARED, ROOM_ORDER, TOWERS, UNITS } from '../data/content'
import { SCENES } from '../data/scenes'
import { Segmented, Swap, Toggle } from '../components/ui'
import ZoomPan from '../components/ZoomPan'
import Botanical from '../art/Botanical'
import ModeSwitch from './ModeSwitch'

const PanoramaViewer = lazy(() => import('../components/PanoramaViewer'))

const TYPES = [...new Set(UNITS.map((u) => u.type))]
const HOW_MANY = ['', '', 'two', 'three']

// The home a comparison takes on next: a kind it doesn't show yet (or else a home it doesn't), in the
// tower it shows fewer of, on the floor of its first home.
function nextHome(homes) {
  const unit = UNITS.find((u) => !homes.some((h) => h.unit.type === u.type)) ?? UNITS.find((u) => !homes.some((h) => h.unit.id === u.id)) ?? UNITS[0]
  const shown = (t) => homes.filter((h) => h.tower.id === t.id).length
  const tower = TOWERS.reduce((a, b) => (shown(b) < shown(a) ? b : a))
  const floors = floorsOf(tower.id)
  return { tower, unit, floor: floors.find((f) => f.id === homes[0].floor.id) ?? floors[0] }
}

// The homes by type, for one side of the comparison.
function UnitPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {TYPES.map((type) => (
        <div key={type}>
          <p className="label text-[max(0.58rem,9px)] text-ink/70">{type}</p>
          <div className="mt-1 flex gap-1">
            {UNITS.filter((u) => u.type === type).map((u) => (
              <button
                key={u.id}
                onClick={() => onChange(u)}
                aria-pressed={u.id === value}
                aria-label={`${u.label}, ${u.about}`}
                className={`label h-10 min-w-10 rounded-full border px-2 text-[max(0.62rem,9px)] tracking-[0.1em] transition-colors duration-300 active:scale-95 ${
                  u.id === value ? 'border-forest-900 bg-forest-900 text-ivory' : 'border-forest-900/20 bg-white/50 hover:border-forest-900/50'
                }`}
              >
                {u.short}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Where a home sits on the floor: all six flats, with its own filled in.
function KeyPlan({ tower, unit, className = '' }) {
  const { viewBox, flats } = FLOOR_PLANS.find((p) => p.id === tower.id)
  return (
    <svg viewBox={viewBox} role="img" aria-label={`Where ${unit.label} sits on the floor of ${tower.label}`} className={className}>
      {flats.map((f) => (
        <polygon
          key={f.id}
          points={f.shape}
          vectorEffect="non-scaling-stroke"
          className={`stroke-1 transition-colors duration-500 ${unit.flats.includes(f.id) ? 'fill-ember stroke-ember-deep' : 'fill-forest-900/10 stroke-forest-900/30'}`}
        />
      ))}
    </svg>
  )
}

// One home in the comparison: the tower and home to show, and that home's plan. `onRemove` takes it out
// (there for each while there are more than two), and `appear` plays its entrance, for a home added
// once the screen is up.
function Side({ home, onChange, onRemove, appear = false, className = '' }) {
  const root = useRef(null)
  const { tower, unit } = home
  useGSAP(
    () => {
      if (appear) playIn(root.current)
    },
    { scope: root },
  )
  return (
    <div ref={root} className={`flex min-h-0 flex-col gap-[1.5vh] ${className}`}>
      <div data-in className="space-y-[1.2vh]">
        <div className="flex items-center gap-2">
          <Segmented items={TOWERS} value={tower.id} onChange={(id) => onChange({ tower: TOWERS.find((t) => t.id === id) })} size="sm" className="min-w-0 flex-1" />
          {onRemove && (
            <button
              onClick={onRemove}
              aria-label={`Take ${tower.label}, ${unit.label} out of the comparison`}
              title="Take out of the comparison"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-forest-900/20 transition-colors duration-300 hover:border-forest-900 hover:bg-forest-900 hover:text-ivory active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
        <UnitPicker value={unit.id} onChange={(u) => onChange({ unit: u })} />
      </div>

      {/* stacked, the frame is a plan's height plus room below it for the zoom buttons, but never taller
          than the screen, as a swipe on a plan zooms it and there must be page left to scroll by */}
      <Swap id={unit.id} className="relative min-h-[min((100vw-2*var(--gutter))/1.29+7rem,100vh-var(--chrome-top)-var(--chrome-bot)-3rem)] flex-1 lg:min-h-0">
        <div data-swap className="absolute inset-0">
          <div data-fade className="absolute inset-0">
            <ZoomPan key={unit.id} src={unit.plan} alt={`${unit.label}, ${unit.about}, floor plan`} aspect={unit.aspect} controlsRow className="absolute inset-0 rounded-[1.25rem] bg-white" />
          </div>
        </div>
      </Swap>

      <div data-in className="flex items-center justify-between gap-4">
        <div>
          <p className="label text-ink/70">{tower.label}</p>
          <h3 className="display mt-1 text-[clamp(1.3rem,3vh,2rem)] text-ember-deep">{unit.label}</h3>
          <p className="mt-0.5 text-[clamp(0.78rem,1.6vh,0.95rem)] text-ink/70">{unit.about}</p>
        </div>
        <KeyPlan tower={tower} unit={unit} className="h-[clamp(3.5rem,9vh,5.5rem)] shrink-0" />
      </div>
    </div>
  )
}

// The homes' rooms in one table, with the rooms that aren't alike in all of them marked.
function Rooms({ homes, onViews, className = '' }) {
  const sizes = homes.map((h) => new Map(h.unit.rooms))
  const names = ROOM_ORDER.filter((n) => sizes.some((s) => s.has(n)))
  const differs = (n) => new Set(sizes.map((s) => s.get(n))).size > 1
  const same = !names.some(differs)
  // three homes share a narrow column, so their names break only where they read well: "Tower A",
  // "Flat 1" and "5 + 6" hold together
  const pad = homes.length > 2 ? 'pl-2' : 'pl-3'
  const keep = (name) => name.replace(/ \+ /g, ' + ').replace(/ (?=\S+$)/, ' ')
  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      {/* the jodis have more rooms than fit, and touch screens show no scrollbar */}
      <div data-in tabIndex={0} role="region" aria-label="Room sizes" className="more-below paper-scrollbar min-h-0 overflow-y-auto pr-2">
        <table className="w-full text-[clamp(0.78rem,1.55vh,0.92rem)]">
          <thead className="sticky top-0 bg-paper">
            <tr className="label text-[max(0.58rem,9px)] tracking-[0.14em] text-ink/70">
              <th className="pb-2 text-left font-medium">Room</th>
              {homes.map((h, i) => (
                <th key={i} className={`pb-2 text-right align-bottom font-medium ${pad}`}>
                  <span className="block">{keep(h.tower.label)}</span>
                  <span className="block text-ember-deep">{keep(h.unit.label)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {names.map((n) => (
              <tr key={n} className="border-t border-forest-900/10">
                <th className="py-[0.55vh] pr-2 text-left align-top font-normal text-ink/70">
                  <span className="flex items-center gap-2">
                    {differs(n) && <span className="size-1.5 shrink-0 rounded-full bg-ember" />}
                    {n}
                  </span>
                </th>
                {sizes.map((s, i) => (
                  <td key={i} className={`whitespace-pre-line py-[0.55vh] text-right align-top ${pad} ${differs(n) ? 'font-medium text-ember-deep' : ''}`}>
                    {s.get(n) ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p data-in className="mt-[1vh] flex shrink-0 items-center gap-2 text-[clamp(0.75rem,1.5vh,0.88rem)] text-ink/70">
        {!same && <span className="size-1.5 shrink-0 rounded-full bg-ember" />}
        {same ? 'The same rooms and sizes: what sets them apart is the view.' : `Differs between the ${HOW_MANY[homes.length]}`}
      </p>
      <button data-in onClick={onViews} className="btn btn-solid mt-[1.4vh] w-full shrink-0">
        Compare views <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

// On a wide screen, a column for the words and the rooms, then one for each home.
const PLANS_GRID = {
  2: 'lg:grid-cols-[minmax(16rem,24%)_1fr_1fr] lg:gap-x-[2.5vw]',
  3: 'lg:grid-cols-[minmax(16rem,24%)_1fr_1fr_1fr] lg:gap-x-[2vw]',
}
const PLANS_COLUMN = ['lg:col-start-2', 'lg:col-start-3', 'lg:col-start-4']

// The first step: two or three homes picked from either tower, with their plans side by side and their
// rooms in one table. A home can be added up to three, and taken out down to two.
export function ComparePlans({ homes }) {
  const root = useRef(null)
  const { go } = useNav()
  // the home the visitor added last, which plays its entrance as it comes in
  const [added, setAdded] = useState(-1)
  useIntro(root)
  // the other homes are a tap away
  useEffect(() => {
    decodeImages(UNITS.map((u) => u.plan))
  }, [])

  // a choice replaces the address, so Back leaves the comparison rather than undoing it a step at a time
  const show = (next) => go('residences', compareQuery(next), { replace: true })
  const change = (i, to) => show(homes.map((h, k) => (k === i ? { ...h, ...to } : h)))
  const add = () => {
    setAdded(homes.length)
    show([...homes, nextHome(homes)])
  }

  return (
    <section ref={root} className="screen bg-paper text-forest-900">
      <Botanical kind="fern" seed={21} depth={14} className="bottom-(--chrome-bot) left-0 w-[10vw] text-forest-700/10" />

      <div className="safe pane h-full">
        {/* the padding keeps the foot of the content clear of the watermark and, stacked, of the pane's fade */}
        <div className={`grid min-h-full gap-[3vh] pb-[calc(var(--watermark-h)+1rem)] lg:h-full lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-y-[2vh] ${PLANS_GRID[homes.length]}`}>
          {/* stacked, the padding brings the switch out of the pane's fade under the chrome */}
          <div className="pt-4 lg:pt-0">
            <p data-in className="eyebrow text-ember">Residences</p>
            <div data-in className="mt-[1.6vh] max-w-sm">
              <ModeSwitch />
            </div>
            <h2 data-in className="display mt-[2.4vh] text-[clamp(1.9rem,5vh,3.7rem)] text-forest-800">Compare units</h2>
            {homes.length < MOST_COMPARED && (
              <button
                data-in
                onClick={add}
                className="label mt-[2vh] flex w-fit items-center gap-3 rounded-full border border-forest-900/25 py-1.5 pl-1.5 pr-5 text-[max(0.62rem,9px)] text-forest-900 transition-colors duration-300 hover:border-forest-900 hover:bg-forest-900 hover:text-ivory active:scale-95"
              >
                <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-ember text-white">
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                Add a home
              </button>
            )}
          </div>

          {homes.map((h, i) => (
            <Side
              key={i}
              home={h}
              onChange={(to) => change(i, to)}
              onRemove={homes.length > 2 ? () => show(homes.filter((_, k) => k !== i)) : null}
              appear={i === added}
              className={`${PLANS_COLUMN[i]} lg:row-span-2 lg:row-start-1`}
            />
          ))}

          <Rooms homes={homes} onViews={() => go('residences', compareQuery(homes, true))} className="lg:col-start-1 lg:row-start-2" />
        </div>
      </div>
    </section>
  )
}

// The views side by side on any landscape screen, one above another in portrait. Three in portrait,
// the top and bottom views are taller by the chrome over them, so each shows as much of itself.
const VIEWS_GRID = {
  2: 'grid-rows-2 landscape:grid-cols-2 landscape:grid-rows-1',
  3: 'grid-rows-[calc(var(--chrome-top)+(100%-var(--chrome-top)-var(--chrome-bot))/3)_1fr_calc(var(--chrome-bot)+(100%-var(--chrome-top)-var(--chrome-bot))/3)] landscape:grid-cols-3 landscape:grid-rows-1',
}
// Each home's card on its view. Three side by side, a card is spared a little (less padding, a smaller
// name) and on a small screen takes more of its view's width, so all the floors fit: its margin,
// --card-x, is the gutter only on a wide screen (a variable, as Tailwind writes landscape: after lg:).
// It sits above the foot of the screen, which the upper views in portrait don't reach, and above the
// watermark where a card can meet it: the last view's, and with three side by side all three, so they
// line up.
const CARD_BOX = {
  2: 'inset-x-(--gutter) p-3 landscape:right-auto landscape:w-[min(26rem,calc(100%-2*var(--gutter)))] lg:p-4',
  3: 'inset-x-(--gutter) p-2.5 [--card-x:0.75rem] landscape:left-(--card-x) landscape:right-auto landscape:w-[min(26rem,calc(100%-2*var(--card-x)))] lg:p-3 lg:[--card-x:var(--gutter)]',
}
const CARD_AT = {
  2: ['bottom-3 landscape:bottom-[calc(var(--chrome-bot)+0.75rem)]', 'bottom-[calc(var(--chrome-bot)+var(--watermark-h)+0.75rem)] lg:bottom-[calc(var(--chrome-bot)+0.75rem)]'],
  3: [
    'bottom-3 landscape:bottom-[calc(var(--chrome-bot)+var(--watermark-h)+0.75rem)]',
    'bottom-3 landscape:bottom-[calc(var(--chrome-bot)+var(--watermark-h)+0.75rem)]',
    'bottom-[calc(var(--chrome-bot)+var(--watermark-h)+0.75rem)]',
  ],
}

// The second step: the view from each home side by side, each opening the way its home looks out.
export function CompareViews({ homes }) {
  const root = useRef(null)
  const { go } = useNav()
  const viewers = useRef([])
  const [facing] = useState(() => homes.map((h) => facingOf(h.unit)))
  const [together, setTogether] = useState(true)
  // where each view looks now, and how far each stays from the first while they turn together: in
  // direction and tilt as a difference, and in zoom as a ratio, so zooming the wider one doesn't pin
  // another at its limit
  const looks = useRef(facing.map((f) => ({ angle: f.angle, pitch: 0, fov: 1 })))
  const apart = useRef(facing.map((f) => ({ angle: f.angle - facing[0].angle, pitch: 0, fov: 1 })))
  const following = useRef(false)
  const many = homes.length > 2
  useIntro(root)

  const onTurn = (i, look) => {
    looks.current[i] = look
    if (!together || following.current) return
    following.current = true
    // where the first view would look, kept as far from this one as it was, and the others from there
    const at = apart.current[i]
    const first = { angle: look.angle - at.angle, pitch: look.pitch - at.pitch, fov: look.fov / at.fov }
    apart.current.forEach(({ angle, pitch, fov }, k) => {
      if (k !== i) viewers.current[k]?.turnTo({ angle: first.angle + angle, pitch: first.pitch + pitch, fov: first.fov * fov })
    })
    following.current = false
  }
  // linking again holds the views as they stand, so none of them jumps
  const turnTogether = (on) => {
    const [first] = looks.current
    apart.current = looks.current.map((l) => ({ angle: l.angle - first.angle, pitch: l.pitch - first.pitch, fov: l.fov / first.fov }))
    setTogether(on)
  }
  const pickFloor = (i, n) => go('residences', compareQuery(homes.map((h, k) => (k === i ? { ...h, floor: floorsOf(h.tower.id).find((f) => f.id === n) } : h)), true), { replace: true })

  return (
    <section ref={root} className="screen bg-forest-950 text-ivory">
      <div data-in className="absolute left-(--gutter) top-(--chrome-top) z-10 flex flex-wrap items-center gap-2">
        <button
          onClick={() => go('residences', compareQuery(homes))}
          className="label flex items-center gap-2 rounded-full border border-ivory/15 bg-forest-950/70 px-4 py-2.5 text-[max(0.62rem,9px)] text-gold-lit backdrop-blur-xl transition-colors duration-500 hover:text-ivory"
        >
          <span aria-hidden="true">←</span>
          Plans
        </button>
        <Toggle label="Turn together" on={together} onChange={turnTogether} className="bg-forest-950/70 backdrop-blur-xl" />
      </div>

      <div className={`absolute inset-0 grid ${VIEWS_GRID[homes.length]}`}>
        {homes.map((h, i) => (
          <div key={i} className="relative min-h-0 overflow-hidden">
            <div data-fade className="absolute inset-0 bg-forest-900">
              <Suspense fallback={null}>
                {/* each holds still on the way its home looks out, on every floor */}
                <PanoramaViewer
                  ref={(viewer) => {
                    viewers.current[i] = viewer
                  }}
                  scenes={SCENES}
                  active={h.floor.key}
                  autorotate={false}
                  mouseViewMode={h.tower.settings.mouseViewMode}
                  facing={facing[i]}
                  onTurn={(look) => onTurn(i, look)}
                />
              </Suspense>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-linear-to-t from-forest-950/70 to-transparent" />
            {/* the line between this view and the one before it */}
            {i > 0 && <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold/50 landscape:inset-x-auto landscape:inset-y-0 landscape:left-0 landscape:h-full landscape:w-px" />}

            <div data-in className={`absolute border border-ivory/10 bg-forest-950/75 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.85)] backdrop-blur-xl ${CARD_BOX[homes.length]} ${CARD_AT[homes.length][i]}`}>
              <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/70 to-transparent" />
              {/* three to a screen, the kind of home stands in for its longer description, and a small
                  landscape screen leaves it out */}
              <p className="flex items-baseline justify-between gap-3">
                <span className={`font-display uppercase tracking-[0.06em] ${many ? 'text-[clamp(0.85rem,2vh,1.3rem)]' : 'text-[clamp(1.05rem,2.3vh,1.5rem)]'}`}>
                  {h.tower.label} · {h.unit.label}
                </span>
                <span className={`label shrink-0 text-[max(0.6rem,9px)] tracking-[0.14em] text-gold-lit ${many ? 'hidden portrait:inline lg:inline' : ''}`}>{many ? h.unit.type : h.unit.about}</span>
              </p>
              <Segmented
                items={floorsOf(h.tower.id)}
                value={h.floor.id}
                onChange={(n) => pickFloor(i, n)}
                tone="dark"
                size="sm"
                className={`mt-2 ${many ? '*:tracking-[0.12em]' : ''}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* keeps the chrome legible over bright skies */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[20vh] bg-linear-to-b from-forest-950/60 to-transparent" />
    </section>
  )
}
