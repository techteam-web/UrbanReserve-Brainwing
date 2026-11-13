import { useEffect, useEffectEvent, useId, useRef } from 'react'
import { gsap, useGSAP, reduced } from '../gsap/gsapConfig'
import { configOf } from '../data/content'
import { ALL_TOWERS, HOME_FLOORS } from '../data/finder'
import ZoomPan from '../components/ZoomPan'
import KeyPlan from '../components/KeyPlan'
import { CloseButton, Mark, Pill } from '../components/Pill'

/**
 * A home's plan, large, over the screen it opens from: the drawing (it zooms with the wheel, a pinch or
 * its buttons), what the home is, where it sits on the floor and its rooms, and, from the finder, a way
 * to add it to the comparison or take it out. Esc, the × or a click outside closes it, Tab stays inside
 * it, and the focus goes back to what opened it.
 */
export default function PlanSheet({ unit, picked = false, canPick = true, onPick, onClose }) {
  const root = useRef(null)
  const box = useRef(null)
  const closer = useRef(null)
  const title = useId()
  const close = useEffectEvent(() => onClose())

  // opacity only (not autoAlpha), as a hidden close button couldn't take the focus as it opens
  useGSAP(
    () => {
      if (reduced()) return
      gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'sine.out' })
      gsap.fromTo(box.current, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' })
    },
    { scope: root },
  )

  useEffect(() => {
    const back = document.activeElement
    closer.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        close()
        return
      }
      if (e.key !== 'Tab') return
      const stops = [...box.current.querySelectorAll('button:not(:disabled), [tabindex="0"]')]
      const [first, last] = [stops[0], stops.at(-1)]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      back?.focus?.()
    }
  }, [])

  const joined = unit.flats.length > 1
  return (
    <div ref={root} className="absolute inset-0 z-40 bg-forest-950/45 backdrop-blur-[3px]" onClick={onClose}>
      {/* between the chrome bars, and above the watermark */}
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-(--gutter) bottom-[calc(var(--chrome-bot)+var(--watermark-h)+0.5rem)] top-(--chrome-top) grid grid-rows-[minmax(12rem,1fr)_auto] overflow-hidden rounded-[1.4rem] bg-paper shadow-[0_50px_120px_-40px_rgb(0_0_0/0.65)] lg:grid-cols-[minmax(0,1fr)_minmax(19rem,27%)] lg:grid-rows-1"
      >
        <div className="relative bg-white">
          <ZoomPan key={unit.id} src={unit.plan} alt={`${unit.label}, ${configOf(unit).label}, floor plan`} aspect={unit.aspect} className="absolute inset-0" />
        </div>

        {/* on a tall screen the details sit below the drawing, and scroll if they must */}
        <div className="flex max-h-[48vh] min-h-0 flex-col overflow-y-auto border-forest-900/10 p-[clamp(1rem,2.4vh,1.75rem)] scrollbar-none max-lg:border-t lg:max-h-none lg:border-l">
          <div className="flex shrink-0 items-start justify-between gap-3">
            <div>
              <p className="label text-[max(0.56rem,8.5px)] tracking-[0.16em] text-ink/55">
                Floors {HOME_FLOORS} · {ALL_TOWERS}
              </p>
              <h3 id={title} className="display mt-1.5 text-[clamp(1.7rem,4.2vh,2.8rem)] text-ember-deep">
                {unit.label}
              </h3>
              <p className="label mt-1 text-[max(0.6rem,9px)] text-forest-800">{configOf(unit).label}</p>
            </div>
            <CloseButton ref={closer} onClick={onClose} label="Close the plan" />
          </div>

          <div className="mt-[2vh] flex shrink-0 items-center gap-4">
            <KeyPlan lit={unit.flats} label={`${unit.label} on the floor`} className="h-[clamp(4.5rem,11vh,7rem)] w-auto shrink-0" />
            <p className="text-[clamp(0.78rem,1.5vh,0.92rem)] leading-snug text-ink/70">
              {joined ? `Flats ${unit.flats.join(' and ')}, joined into one home` : `Flat ${unit.flats[0]} on each typical floor`}
            </p>
          </div>

          {/* the jodis have more rooms than fit, and touch screens show no scrollbar */}
          <div tabIndex={0} role="region" aria-label="Room sizes" className="more-below paper-scrollbar mt-[2vh] min-h-24 flex-1 overflow-y-auto pr-2">
            <dl className="text-[clamp(0.8rem,1.55vh,0.94rem)]">
              {unit.rooms.map(([name, size]) => (
                <div key={name} className="flex justify-between gap-3 border-t border-forest-900/10 py-[0.6vh] first:border-t-0">
                  <dt className="text-ink/70">{name}</dt>
                  <dd className="whitespace-pre-line text-right">{size}</dd>
                </div>
              ))}
            </dl>
          </div>

          {onPick && (
            <Pill tone={picked ? 'on' : 'solid'} onClick={onPick} disabled={!picked && !canPick} aria-pressed={picked} className="mt-[2vh] w-full shrink-0">
              <Mark check={picked} />
              {picked ? 'Added to compare' : canPick ? 'Add to compare' : 'Three already picked'}
            </Pill>
          )}
        </div>
      </div>
    </div>
  )
}
