import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useIntro, useTone } from '../hooks/useIntro'
import { useNav } from '../app/nav'
import { decodeImages } from '../app/decode'
import { compareQuery, facingOf, FLOOR_PLANS, floorsOf, ROOM_ORDER, TOWERS, UNITS } from '../data/content'
import { SCENES } from '../data/scenes'
import { Segmented, Swap, Toggle } from '../components/ui'
import ZoomPan from '../components/ZoomPan'
import Botanical from '../art/Botanical'

const PanoramaViewer = lazy(() => import('../components/PanoramaViewer'))

const TYPES = [...new Set(UNITS.map((u) => u.type))]

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

// One side of the comparison: the tower and home to show, and that home's plan.
function Side({ home, onChange, className = '' }) {
  const { tower, unit } = home
  return (
    <div className={`flex min-h-0 flex-col gap-[1.5vh] ${className}`}>
      <div data-in className="space-y-[1.2vh]">
        <Segmented items={TOWERS} value={tower.id} onChange={(id) => onChange({ tower: TOWERS.find((t) => t.id === id) })} size="sm" />
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

// The two homes' rooms in one table.
function Rooms({ homes, onViews, className = '' }) {
  const sizes = homes.map((h) => new Map(h.unit.rooms))
  const names = ROOM_ORDER.filter((n) => sizes.some((s) => s.has(n)))
  const differs = (n) => sizes[0].get(n) !== sizes[1].get(n)
  const same = !names.some(differs)
  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      {/* the jodis have more rooms than fit, and touch screens show no scrollbar */}
      <div data-in tabIndex={0} role="region" aria-label="Room sizes" className="more-below min-h-0 overflow-y-auto scrollbar-thin">
        <table className="w-full text-[clamp(0.78rem,1.55vh,0.92rem)]">
          <thead className="sticky top-0 bg-paper">
            <tr className="label text-[max(0.58rem,9px)] tracking-[0.14em] text-ink/70">
              <th className="pb-2 text-left font-medium">Room</th>
              {homes.map((h, i) => (
                <th key={i} className="pb-2 pl-3 text-right align-bottom font-medium">
                  <span className="block">{h.tower.label}</span>
                  <span className="block text-ember-deep">{h.unit.label}</span>
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
                  <td key={i} className={`whitespace-pre-line py-[0.55vh] pl-3 text-right align-top ${differs(n) ? 'font-medium text-ember-deep' : ''}`}>
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
        {same ? 'The same rooms and sizes: what sets them apart is the view.' : 'Differs between the two'}
      </p>
      <button data-in onClick={onViews} className="btn btn-solid mt-[1.4vh] w-full shrink-0">
        Compare views <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

// The first step: two homes picked from either tower, with their plans and rooms side by side.
export function ComparePlans({ homes }) {
  const root = useRef(null)
  const { go } = useNav()
  useTone('light')
  useIntro(root)
  // the other homes are a tap away
  useEffect(() => {
    decodeImages(UNITS.map((u) => u.plan))
  }, [])

  const change = (i, to) => go('floorplans', compareQuery(homes.map((h, k) => (k === i ? { ...h, ...to } : h))), { replace: true })
  const back = () => go('floorplans', `?tower=${homes[0].tower.id}&floor=${homes[0].floor.id}`)

  return (
    <section ref={root} className="screen bg-paper text-forest-900">
      <Botanical kind="fern" seed={21} depth={14} className="bottom-(--chrome-bot) left-0 w-[10vw] text-forest-700/10" />

      <div className="safe pane h-full">
        {/* the padding keeps the foot of the content clear of the watermark and, stacked, of the pane's fade */}
        <div className="grid min-h-full gap-[3vh] pb-[calc(var(--watermark-h)+1rem)] lg:h-full lg:grid-cols-[minmax(16rem,24%)_1fr_1fr] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-[2.5vw] lg:gap-y-[2vh]">
          {/* stacked, the padding brings the way back out of the pane's fade under the menu */}
          <div className="pt-4 lg:pt-0">
            <button data-in onClick={back} className="label flex items-center gap-2 py-2 text-[max(0.62rem,9px)] text-ember-deep transition-colors duration-500 hover:text-forest-900">
              <span aria-hidden="true">←</span>
              Typical floor
            </button>
            <p data-in className="eyebrow mt-[1.5vh] text-ember">Floor Plans</p>
            <h2 data-in className="display mt-[1.2vh] text-[clamp(1.9rem,5vh,3.7rem)] text-forest-800">Compare units</h2>
          </div>

          <Side home={homes[0]} onChange={(to) => change(0, to)} className="lg:col-start-2 lg:row-span-2 lg:row-start-1" />
          <Side home={homes[1]} onChange={(to) => change(1, to)} className="lg:col-start-3 lg:row-span-2 lg:row-start-1" />

          <Rooms homes={homes} onViews={() => go('floorplans', compareQuery(homes, true))} className="lg:col-start-1 lg:row-start-2" />
        </div>
      </div>
    </section>
  )
}

// The second step: the view from each home side by side, each opening the way its home looks out.
export function CompareViews({ homes }) {
  const root = useRef(null)
  const { go } = useNav()
  const first = useRef(null)
  const second = useRef(null)
  const [facing] = useState(() => homes.map((h) => facingOf(h.unit)))
  const [together, setTogether] = useState(true)
  // where each view looks now, and how far apart they stay while they turn together: in direction and
  // tilt as a difference, and in zoom as a ratio, so zooming the wider one doesn't pin the other at its limit
  const looks = useRef(facing.map((f) => ({ angle: f.angle, pitch: 0, fov: 1 })))
  const apart = useRef({ angle: facing[1].angle - facing[0].angle, pitch: 0, fov: 1 })
  const following = useRef(false)
  useTone('dark')
  useIntro(root)

  const onTurn = (i, look) => {
    looks.current[i] = look
    if (!together || following.current) return
    following.current = true
    const { angle, pitch, fov } = apart.current
    const way = i ? -1 : 1
    const other = i ? first : second
    other.current?.turnTo({ angle: look.angle + way * angle, pitch: look.pitch + way * pitch, fov: look.fov * fov ** way })
    following.current = false
  }
  // linking again holds the two as they stand, so neither jumps
  const turnTogether = (on) => {
    const [a, b] = looks.current
    apart.current = { angle: b.angle - a.angle, pitch: b.pitch - a.pitch, fov: b.fov / a.fov }
    setTogether(on)
  }
  const pickFloor = (i, n) => go('floorplans', compareQuery(homes.map((h, k) => (k === i ? { ...h, floor: floorsOf(h.tower.id).find((f) => f.id === n) } : h)), true), { replace: true })

  return (
    <section ref={root} className="screen bg-forest-950 text-ivory">
      <div data-in className="absolute left-(--gutter) top-(--chrome-top) z-10 flex flex-wrap items-center gap-2">
        <button
          onClick={() => go('floorplans', compareQuery(homes))}
          className="label flex items-center gap-2 rounded-full border border-ivory/15 bg-forest-950/70 px-4 py-2.5 text-[max(0.62rem,9px)] text-gold-lit backdrop-blur-xl transition-colors duration-500 hover:text-ivory"
        >
          <span aria-hidden="true">←</span>
          Plans
        </button>
        <Toggle label="Turn together" on={together} onChange={turnTogether} className="bg-forest-950/70 backdrop-blur-xl" />
      </div>

      {/* side by side on any landscape screen, one above the other in portrait */}
      <div className="absolute inset-0 grid grid-rows-2 landscape:grid-cols-2 landscape:grid-rows-1">
        {homes.map((h, i) => (
          <div key={i} className="relative min-h-0 overflow-hidden">
            <div data-fade className="absolute inset-0 bg-forest-900">
              <Suspense fallback={null}>
                {/* each holds still on the way its home looks out, on every floor */}
                <PanoramaViewer
                  ref={i ? second : first}
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

            {/* above the foot of the screen, which the upper view in portrait doesn't reach, and above the
                watermark too, which a wide screen's card is too narrow to meet */}
            <div
              data-in
              className={`absolute inset-x-(--gutter) border border-ivory/10 bg-forest-950/75 p-3 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.85)] backdrop-blur-xl landscape:right-auto landscape:w-[min(26rem,calc(100%-2*var(--gutter)))] lg:p-4 ${
                i ? 'bottom-[calc(var(--chrome-bot)+var(--watermark-h)+0.75rem)] lg:bottom-[calc(var(--chrome-bot)+0.75rem)]' : 'bottom-3 landscape:bottom-[calc(var(--chrome-bot)+0.75rem)]'
              }`}
            >
              <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/70 to-transparent" />
              <p className="flex items-baseline justify-between gap-3">
                <span className="font-display text-[clamp(1.05rem,2.3vh,1.5rem)] uppercase tracking-[0.06em]">
                  {h.tower.label} · {h.unit.label}
                </span>
                <span className="label shrink-0 text-[max(0.6rem,9px)] tracking-[0.14em] text-gold-lit">{h.unit.about}</span>
              </p>
              <Segmented items={floorsOf(h.tower.id)} value={h.floor.id} onChange={(n) => pickFloor(i, n)} tone="dark" size="sm" className="mt-2" />
            </div>
          </div>
        ))}
      </div>

      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gold/50 landscape:inset-x-auto landscape:inset-y-0 landscape:left-1/2 landscape:top-0 landscape:h-full landscape:w-px" />
      {/* keeps the chrome legible over bright skies */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[20vh] bg-linear-to-b from-forest-950/60 to-transparent" />
    </section>
  )
}
