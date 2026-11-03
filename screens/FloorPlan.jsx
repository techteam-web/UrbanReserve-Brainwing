import { useEffect, useRef, useState } from 'react'
import { useIntro } from '../hooks/useIntro'
import { useNav } from '../app/nav'
import { compareQuery, FLOOR_PLANS, floorName, TOWERS, unitOf, viewFloor } from '../data/content'
import { BUILDING } from '../data/residences'
import { Icon, Segmented, Swap } from '../components/ui'
import ZoomPan from '../components/ZoomPan'
import Botanical from '../art/Botanical'
import ModeSwitch from './ModeSwitch'

// Each tower cut close from the picture of both, as a viewBox: its floors, its crown above them and
// a little of the podium below.
const TOWER_CUTS = new Map(
  BUILDING.towers.map(({ id, floors }) => {
    const n = floors.flatMap((f) => f.points.split(/[\s,]+/).map(Number))
    const xs = n.filter((_, i) => i % 2 === 0)
    const ys = n.filter((_, i) => i % 2 === 1)
    const [left, top, right, bottom] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
    return [id, `${left - 120} ${top - 360} ${right - left + 240} ${bottom - top + 520}`]
  }),
)

// Where the floor is: its tower, with the floor lit. It leads back to the towers.
function FloorKey({ tower, floor, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-label="Back to the towers"
      title="Back to the towers"
      className={`group shrink-0 overflow-hidden rounded-[0.9rem] bg-forest-950 shadow-[0_20px_40px_-24px_rgb(20_52_41/0.7)] ${className}`}
    >
      <svg viewBox={TOWER_CUTS.get(tower.id)} preserveAspectRatio="xMidYMid slice" className="block h-full w-auto" aria-hidden="true">
        <image href={BUILDING.image} width={BUILDING.width} height={BUILDING.height} preserveAspectRatio="none" />
        <polygon points={floor.points} vectorEffect="non-scaling-stroke" className="fill-ember/80 stroke-ember-deep stroke-1 transition-[fill] duration-300 group-hover:fill-ember" />
      </svg>
    </button>
  )
}

function Step({ up = false, disabled, onClick }) {
  const label = up ? 'The floor above' : 'The floor below'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-full border border-forest-900/20 transition-colors duration-300 hover:border-forest-900/50 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
      </svg>
    </button>
  )
}

// The home picked on the plan: what it is, its own plan and rooms (as its drawing gives them), and the
// ways on from it, the view from it and a comparison.
function FlatPanel({ tower, floor, flat, onClose }) {
  const { go } = useNav()
  const unit = unitOf(flat)
  const view = viewFloor(tower.id, floor.n)
  const other = TOWERS.find((t) => t.id !== tower.id)
  const toView = () => go('views', `?tower=${tower.id}&floor=${floor.n}&flat=${flat.id}`)
  // against the same home in the other tower: the towers' homes are alike, so what differs is the view
  const toCompare = () =>
    go(
      'residences',
      compareQuery([
        { tower: TOWERS.find((t) => t.id === tower.id), unit, floor: view },
        { tower: other, unit, floor: viewFloor(other.id, floor.n) },
      ]),
    )

  return (
    // on a short screen the drawing gives way first, then the room list down to a few rows, and past
    // that the panel scrolls, so its buttons are always reachable
    <div role="region" aria-label={`${unit.label}, ${unit.type}`} className="flex h-full flex-col overflow-y-auto border border-forest-900/10 bg-paper p-[clamp(1rem,2.2vh,1.5rem)] shadow-[0_40px_80px_-40px_rgb(20_52_41/0.55)] [scrollbar-width:none]">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p className="label text-[max(0.58rem,9px)] text-ink/60">
            {tower.label} · {floorName(floor.n)}
          </p>
          <h3 className="display mt-1.5 text-[clamp(1.6rem,4vh,2.6rem)] text-ember-deep">{unit.label}</h3>
          <p className="label mt-1 text-[max(0.6rem,9px)] text-forest-800">{unit.type}</p>
        </div>
        <button onClick={onClose} aria-label="Close" title="Close" className="grid size-10 shrink-0 place-items-center rounded-full border border-forest-900/15 transition-colors duration-300 hover:border-forest-900/45">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <img src={unit.plan} alt={`${unit.label} floor plan`} draggable="false" className="mt-[1.6vh] max-h-[24vh] min-h-16 w-full rounded-[0.9rem] bg-white object-contain p-2" />

      {/* a 3 BHK has more rooms than fit, and touch screens show no scrollbar */}
      <div tabIndex={0} role="region" aria-label="Room sizes" className="more-below paper-scrollbar mt-[1.6vh] min-h-[5.5rem] flex-1 overflow-y-auto pr-2">
        <dl className="text-[clamp(0.78rem,1.55vh,0.92rem)]">
          {unit.rooms.map(([name, size]) => (
            <div key={name} className="flex justify-between gap-3 border-t border-forest-900/10 py-[0.55vh] first:border-t-0">
              <dt className="text-ink/70">{name}</dt>
              <dd className="whitespace-pre-line text-right">{size}</dd>
            </div>
          ))}
        </dl>
      </div>

      <button onClick={toView} className="btn btn-solid mt-[1.6vh] w-full shrink-0">
        <Icon name="turn" className="size-4" />
        View from this home
      </button>
      {view.id !== floor.n && <p className="mt-1.5 shrink-0 text-center text-[max(0.68rem,10px)] text-ink/55">Seen from the {floorName(view.id).toLowerCase()}, the nearest with a 360° view</p>}
      <button onClick={toCompare} className="btn mt-2 w-full shrink-0 text-forest-900">
        <Icon name="compare" className="size-4" />
        Compare
      </button>
    </div>
  )
}

/**
 * Visual Selection's second step: the plan of the floor picked on the towers, with its six homes
 * outlined. A home opens its details in a panel, beside the plan on a wide screen and as a sheet over
 * it on a tall one; the floor can change a step at a time, and the tower too, without going back.
 */
export default function FloorPlan({ at }) {
  const root = useRef(null)
  const { go } = useNav()
  const [hover, setHover] = useState(null)
  useIntro(root)

  const { tower, floor, flat } = at
  const plan = FLOOR_PLANS.find((p) => p.id === tower.id)
  const lit = plan.flats.find((f) => f.id === hover)
  const [number, word] = floorName(floor.n).split(' ')
  // the floors next to this one in the tower, as traced
  const index = tower.floors.indexOf(floor)
  const [below, above] = [tower.floors[index - 1], tower.floors[index + 1]]
  // a choice replaces the address, so Back from a home's view, or a reload, comes back to it
  const show = (towerId, n, home = flat) => go('residences', `?tower=${towerId}&floor=${n}${home ? `&flat=${home.id}` : ''}`, { replace: true })
  const toTowers = () => go('residences')

  // the panel keeps the home it showed while it slides away
  const [panelFlat, setPanelFlat] = useState(flat)
  if (flat && flat !== panelFlat) setPanelFlat(flat)

  // Esc closes the panel before it would leave the page
  useEffect(() => {
    if (!flat) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      go('residences', `?tower=${tower.id}&floor=${floor.n}`, { replace: true })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [flat, tower.id, floor.n, go])

  return (
    <section ref={root} className="screen bg-paper text-forest-900 [--panel-w:clamp(19rem,24vw,27rem)]">
      <Botanical kind="fern" seed={12} depth={14} className="bottom-(--chrome-bot) left-0 w-[12vw] text-forest-700/12" />

      <div className="safe pane h-full">
        <div className="grid min-h-full grid-rows-[auto_minmax(14rem,1fr)] gap-[3vh] lg:h-full lg:grid-cols-[minmax(16rem,24%)_1fr] lg:grid-rows-none lg:gap-[2.5vw]">
          <div className="flex flex-col justify-center">
            <p data-in className="eyebrow text-ember">Residences</p>
            <div data-in className="mt-[1.6vh] max-w-sm">
              <ModeSwitch />
            </div>
            <button data-in onClick={toTowers} className="label mt-[2.6vh] flex items-center gap-2 self-start py-1 text-[max(0.62rem,9px)] text-ember-deep transition-colors duration-500 hover:text-forest-900">
              <span aria-hidden="true">←</span>
              Both towers
            </button>
            <div data-in className="mt-[1.4vh] flex items-end gap-[clamp(0.9rem,1.4vw,1.5rem)]">
              <FloorKey tower={tower} floor={floor} onClick={toTowers} className="h-[clamp(7rem,22vh,12.5rem)]" />
              <div className="min-w-0 pb-1">
                <Swap id={`${tower.id}.${floor.n}`}>
                  <p data-swap className="label text-ink/60">
                    {tower.label}
                  </p>
                  <h2 data-swap className="display mt-1 text-[clamp(1.9rem,5vh,3.7rem)] text-forest-800">
                    {number}
                    <br />
                    {word}
                  </h2>
                </Swap>
                <div className="mt-[1.4vh] flex gap-2">
                  <Step up disabled={!above} onClick={() => show(tower.id, above.n)} />
                  <Step disabled={!below} onClick={() => show(tower.id, below.n)} />
                </div>
              </div>
            </div>
            <p data-in className="copy mt-[2.4vh] text-ink/70">Six homes on every floor, around a central lobby with six lifts.</p>
            <div data-in className="mt-[2.2vh]">
              <Segmented items={FLOOR_PLANS} value={tower.id} onChange={(id) => show(id, floor.n)} />
            </div>
            <p data-in className="label mt-[2.2vh] text-ink/45">{lit ? `Flat ${lit.id} · ${lit.type}` : 'Tap a home for its details'}</p>
          </div>

          {/* the bottom margin keeps the zoom buttons clear of the watermark; on a wide screen the plan
              draws back to make room for the panel */}
          <div className="relative mb-[calc(var(--watermark-h)+0.75rem)]">
            <Swap
              id={tower.id}
              className={`absolute inset-y-0 left-0 right-0 transition-[right] duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${flat ? 'lg:right-[calc(var(--panel-w)+2vw)]' : ''}`}
            >
              <div data-swap className="absolute inset-0">
                <div data-fade className="absolute inset-0">
                  <ZoomPan key={plan.id} src={plan.plan} alt={`${plan.label} typical floor plan`} aspect={plan.aspect} className="absolute inset-0 rounded-[1.25rem] bg-white">
                    {/* the homes, traced on the plan: brighter under the pointer, and each opens its details */}
                    <svg viewBox={plan.viewBox} className="absolute inset-0 size-full" role="group" aria-label={`Homes on the ${floorName(floor.n).toLowerCase()}`}>
                      {plan.flats.map((f) => {
                        const on = flat?.id === f.id
                        const pick = () => show(tower.id, floor.n, on ? null : f)
                        return (
                          <polygon
                            key={f.id}
                            points={f.shape}
                            role="button"
                            tabIndex={0}
                            aria-pressed={on}
                            aria-label={`Flat ${f.id}, ${f.type}`}
                            onClick={pick}
                            onKeyDown={(e) => {
                              if (e.key !== 'Enter' && e.key !== ' ') return
                              e.preventDefault()
                              pick()
                            }}
                            onPointerEnter={() => setHover(f.id)}
                            onPointerLeave={() => setHover(null)}
                            onFocus={() => setHover(f.id)}
                            onBlur={() => setHover(null)}
                            vectorEffect="non-scaling-stroke"
                            className={`cursor-pointer stroke-2 outline-none transition-[fill,stroke] duration-300 ${
                              on ? 'fill-ember-deep/60 stroke-ember-deep' : 'fill-ember/20 stroke-ember/65 hover:fill-ember/50 hover:stroke-ember-deep focus-visible:fill-ember/50 focus-visible:stroke-ember-deep'
                            }`}
                          />
                        )
                      })}
                    </svg>
                  </ZoomPan>
                </div>
              </div>
            </Swap>
          </div>
        </div>
      </div>

      {/* the home's panel: beside the plan on a wide screen, a sheet above the dock on a tall one */}
      <div
        inert={!flat}
        className={`absolute inset-x-(--gutter) bottom-[calc(var(--chrome-bot)+var(--watermark-h)+0.75rem)] z-10 h-[min(44rem,64vh)] max-h-[calc(100%-var(--chrome-top)-var(--chrome-bot)-var(--watermark-h)-0.75rem)] transition-[translate,opacity] duration-700 ease-[cubic-bezier(.16,1,.3,1)] lg:left-auto lg:top-(--chrome-top) lg:h-auto lg:max-h-none lg:w-(--panel-w) ${
          flat ? '' : 'pointer-events-none translate-y-8 opacity-0 lg:translate-x-8 lg:translate-y-0'
        }`}
      >
        {panelFlat && <FlatPanel tower={tower} floor={floor} flat={panelFlat} onClose={() => show(tower.id, floor.n, null)} />}
      </div>
    </section>
  )
}
