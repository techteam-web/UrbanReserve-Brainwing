import { useRef, useState } from 'react'
import { useIntro, useTone } from '../hooks/useIntro'
import { useNav } from '../app/nav'
import { comparison, FLOOR_PLANS, floorsOf, TOWERS, towerFloor } from '../data/content'
import { Icon, Segmented, Swap } from '../components/ui'
import ZoomPan from '../components/ZoomPan'
import Botanical from '../art/Botanical'
import { ComparePlans, CompareViews } from './FloorCompare'

/**
 * The typical floor of each tower, with its six homes outlined on the plan: tapping one opens the 360°
 * view from it on the chosen floor, facing the way the home looks out.
 */
function TypicalFloor() {
  const root = useRef(null)
  const { shown, go } = useNav()
  // the tower and floor in the address (?tower=towerB&floor=20), else the first tower's starting floor
  const [id, setId] = useState(() => towerFloor(shown.search).tower.id)
  const [floorNo, setFloorNo] = useState(() => parseInt(towerFloor(shown.search).floor.label))
  const [hover, setHover] = useState(null)
  useTone('light')
  useIntro(root)

  const plan = FLOOR_PLANS.find((p) => p.id === id)
  const floors = floorsOf(id)
  const floor = floors.find((f) => f.id === floorNo) ?? floors[0]
  const flat = plan.flats.find((f) => f.id === hover)
  const open = (f) => go('views', `?tower=${id}&floor=${floor.id}&flat=${f.id}`)
  // a choice replaces the address too, so Back from a home's view, or a reload, comes back to it
  const choose = (tower, n) => {
    setId(tower)
    setFloorNo(n)
    go('floorplans', `?tower=${tower}&floor=${n}`, { replace: true })
  }
  // opens on this tower's largest home against a smaller one in the other tower
  const compare = () => go('floorplans', `?compare=${id}.1.${floor.id},${TOWERS.find((t) => t.id !== id).id}.3.${floor.id}`)

  return (
    <section ref={root} className="screen bg-paper text-forest-900">
      <Botanical kind="fern" seed={12} depth={14} className="bottom-(--chrome-bot) left-0 w-[12vw] text-forest-700/12" />

      <div className="safe pane h-full">
        <div className="grid min-h-full grid-rows-[auto_minmax(14rem,1fr)] gap-[3vh] lg:h-full lg:grid-cols-[minmax(16rem,26%)_1fr] lg:grid-rows-none lg:gap-[2.5vw]">
          <div className="flex flex-col justify-center">
            <p data-in className="eyebrow text-ember">Floor Plans</p>
            <h2 data-in className="display mt-[1.5vh] text-[clamp(1.9rem,5vh,3.7rem)] text-forest-800">
              Typical
              <br />
              floor
            </h2>
            <p data-in className="copy mt-[2vh] text-ink/70">Six homes on every floor, around a central lobby with six lifts.</p>
            <div data-in className="mt-[3.5vh]">
              <Segmented items={FLOOR_PLANS} value={id} onChange={(t) => choose(t, floor.id)} />
            </div>
            <div data-in className="mt-[2.5vh]">
              <p className="label text-ink/45">Floor</p>
              <Segmented items={floors} value={floor.id} onChange={(n) => choose(id, n)} size="sm" className="mt-2" />
            </div>
            <p data-in className="label mt-[2.5vh] text-ink/45">{flat ? `Flat ${flat.id} · ${flat.type}` : 'Tap a home to see its view'}</p>
            <button data-in onClick={compare} className="label mt-[2.5vh] flex items-center justify-center gap-2 rounded-full border border-forest-900/20 px-3 py-3 transition-colors hover:border-forest-900/50 active:scale-95">
              <Icon name="compare" className="size-4" /> Compare units
            </button>
          </div>

          {/* the bottom margin keeps the zoom buttons clear of the watermark */}
          <Swap id={id} className="relative mb-[calc(var(--watermark-h)+0.75rem)]">
            <div data-swap className="absolute inset-0">
              <div data-mask className="absolute inset-0">
                <ZoomPan key={plan.id} src={plan.plan} alt={`${plan.label} typical floor plan`} aspect={plan.aspect} className="absolute inset-0 rounded-[1.25rem] bg-white">
                  {/* the homes, traced on the plan: brighter under the pointer, and each opens its view */}
                  <svg viewBox={plan.viewBox} className="absolute inset-0 size-full" role="group" aria-label={`Homes on the ${floor.label.toLowerCase()}`}>
                    {plan.flats.map((f) => (
                      <polygon
                        key={f.id}
                        points={f.shape}
                        role="link"
                        tabIndex={0}
                        aria-label={`Flat ${f.id}, ${f.type}: the view from the ${floor.label.toLowerCase()}`}
                        onClick={() => open(f)}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter' && e.key !== ' ') return
                          e.preventDefault()
                          open(f)
                        }}
                        onPointerEnter={() => setHover(f.id)}
                        onPointerLeave={() => setHover(null)}
                        onFocus={() => setHover(f.id)}
                        onBlur={() => setHover(null)}
                        vectorEffect="non-scaling-stroke"
                        className="cursor-pointer fill-ember/10 stroke-ember/40 stroke-2 outline-none transition-[fill,stroke] duration-300 hover:fill-ember/35 hover:stroke-ember focus-visible:fill-ember/35 focus-visible:stroke-ember"
                      />
                    ))}
                  </svg>
                </ZoomPan>
              </div>
            </div>
          </Swap>
        </div>
      </div>
    </section>
  )
}

// The typical floors, or a comparison of two homes when the address holds one.
export default function FloorPlan() {
  const { shown } = useNav()
  const compared = comparison(shown.search)
  if (!compared) return <TypicalFloor />
  const { homes, views } = compared
  // a different pair of homes starts afresh, on the way each one looks out
  return views ? <CompareViews key={homes.map((h) => `${h.tower.id}.${h.unit.id}`).join()} homes={homes} /> : <ComparePlans homes={homes} />
}
