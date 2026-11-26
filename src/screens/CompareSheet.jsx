import { useEffect, useEffectEvent, useId, useRef } from 'react'
import { gsap, useGSAP, reduced } from '../gsap/gsapConfig'
import { bedroomsOf, configOf, FEATURES, hasRoom, UNITS } from '../data/content'
import { AREA, areaOf, balconiesOf, isJodi, sqft, toiletsOf } from '../data/finder'
import KeyPlan from '../components/KeyPlan'
import { CloseButton, Pill } from '../components/Pill'

const sizeOf = (unit, room) => unit.rooms.find(([name]) => name === room)?.[1] ?? '—'

// One row a fact, in the order the drawings read; a row whose homes differ is marked.
const ROWS = [
  { label: 'Configuration', get: (u) => configOf(u).label },
  { label: 'Home', get: (u) => (isJodi(u) ? `Flats ${u.flats.join(' + ')}, joined` : `Flat ${u.flats[0]}, every floor`) },
  { label: 'On the floor', get: (u) => u.flats.join('+'), show: (u) => <KeyPlan lit={u.flats} label={`Flat ${u.flats.join(' and ')} on the floor`} className="h-[clamp(2.4rem,6vh,3.6rem)] w-auto" /> },
  { label: AREA.label, get: (u) => `${sqft(areaOf(u))} sq ft` },
  { label: 'Bedrooms', get: (u) => bedroomsOf(u) },
  { label: 'Toilets', get: (u) => `${toiletsOf(u)}${hasRoom(u, 'Powder toilet') ? ' + powder' : ''}` },
  { label: 'Balconies', get: (u) => balconiesOf(u) },
  { label: 'Living & dining', get: (u) => sizeOf(u, 'Living & dining') },
  { label: 'Kitchen', get: (u) => sizeOf(u, 'Kitchen') },
  { label: 'Main bedroom', get: (u) => sizeOf(u, 'Bedroom 1') },
  { label: 'Also has', get: (u) => FEATURES.filter((f) => hasRoom(u, f.id)).map((f) => f.label).join(', ') || '—' },
]

/**
 * The homes picked in the unit finder, side by side over it, as Runwal Zenith compares: each one's plan
 * (which opens it large) and name, then a row a fact, with the rows where they differ marked. From here
 * the comparison goes on to their views. Esc, the × or a click outside closes it (unless a plan is open
 * over it, `paused`), Tab stays inside it, and the focus goes back to what opened it.
 */
export default function CompareSheet({ ids, paused = false, onRemove, onOpen, onViews, onClose }) {
  const root = useRef(null)
  const box = useRef(null)
  const closer = useRef(null)
  const title = useId()
  const units = ids.map((id) => UNITS.find((u) => u.id === id))
  const close = useEffectEvent(() => onClose())
  const held = useEffectEvent(() => paused)

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
      if (held()) return
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

  // taking every home out leaves nothing to compare
  useEffect(() => {
    if (!ids.length) close()
  }, [ids.length])

  const cols = { gridTemplateColumns: `clamp(6.5rem,12vw,10rem) repeat(${Math.max(units.length, 1)}, minmax(11rem, 1fr))` }
  return (
    <div ref={root} className="absolute inset-0 z-30 bg-forest-950/45 backdrop-blur-[3px]" onClick={onClose}>
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-(--gutter) bottom-[calc(var(--chrome-bot)+var(--watermark-h)+0.5rem)] top-(--chrome-top) flex flex-col overflow-hidden rounded-[1.4rem] bg-paper shadow-[0_50px_120px_-40px_rgb(0_0_0/0.65)]"
      >
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-forest-900/10 px-[clamp(1rem,2.2vw,2rem)] py-[clamp(0.7rem,2vh,1.3rem)]">
          <div className="min-w-0">
            <p className="label text-[max(0.56rem,8.5px)] tracking-[0.18em] text-ember-deep">
              Compare · {units.length} {units.length === 1 ? 'home' : 'homes'}
            </p>
            <h3 id={title} className="display mt-1 text-[clamp(1.4rem,3.6vh,2.4rem)] text-forest-800">
              Compare residences
            </h3>
            <p className="mt-0.5 text-[max(0.72rem,10.5px)] text-ink/55 [@media(max-height:32rem)]:hidden">Their plans and rooms side by side; tap a plan to open it large.</p>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="solid" onClick={onViews} disabled={units.length < 2} title={units.length < 2 ? 'Pick two homes or more' : undefined} className="py-2.5">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
                <circle cx="12" cy="12" r="2.6" />
              </svg>
              Compare views
            </Pill>
            <CloseButton ref={closer} onClick={onClose} label="Close the comparison" />
          </div>
        </header>

        <div tabIndex={0} role="region" aria-label="The homes side by side" className="paper-scrollbar min-h-0 flex-1 overflow-auto px-[clamp(1rem,2.2vw,2rem)] pb-[2vh] outline-none">
          <div className="grid min-w-max gap-x-[clamp(0.75rem,1.4vw,1.5rem)] sm:min-w-0" style={cols}>
            {/* the plans, and each home's name */}
            <div className="sticky left-0 z-10 bg-paper" />
            {units.map((u) => (
              <div key={u.id} className="pt-[2vh] pb-[1.4vh]">
                <button onClick={() => onOpen(u)} aria-label={`Open ${u.label}'s plan`} className="group relative block h-[clamp(6rem,22vh,13rem)] w-full short:h-20 overflow-hidden rounded-[0.9rem] bg-white ring-1 ring-forest-900/10 transition-shadow duration-300 hover:shadow-[0_24px_44px_-28px_rgb(20_52_41/0.6)]">
                  <img src={u.plan} alt={`${u.label} floor plan`} draggable="false" className="size-full object-contain p-2.5" />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center bg-forest-950/0 opacity-0 transition-all duration-300 group-hover:bg-forest-950/15 group-hover:opacity-100">
                    <span className="grid size-9 place-items-center rounded-full bg-white text-forest-900 shadow-[0_10px_24px_-10px_rgb(0_0_0/0.5)]">
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                        <circle cx="11" cy="11" r="6.5" />
                        <path d="M20 20l-4.35-4.35M11 8.5v5M8.5 11h5" />
                      </svg>
                    </span>
                  </span>
                </button>
                <div className="mt-[1vh] flex items-start justify-between gap-2">
                  <p className="min-w-0">
                    <span className="display block truncate text-[clamp(1.1rem,2.5vh,1.5rem)] text-forest-900">{u.label}</span>
                    <span className="label mt-0.5 inline-block rounded-full bg-ember/12 px-2 py-0.5 text-[max(0.5rem,8px)] tracking-[0.12em] text-ember-deep">{configOf(u).label}</span>
                  </p>
                  <button onClick={() => onRemove(u.id)} aria-label={`Take ${u.label} out of the comparison`} title="Take out" className="grid size-8 shrink-0 place-items-center rounded-full text-ink/55 transition-colors hover:bg-forest-900/8 hover:text-forest-900">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* a row a fact */}
            {ROWS.map((row, i) => {
              const differs = units.length > 1 && new Set(units.map((u) => String(row.get(u)))).size > 1
              const shade = i % 2 ? 'bg-forest-900/[0.03]' : ''
              return [
                <p key={row.label} className={`label sticky left-0 z-10 flex items-center gap-2 border-t border-forest-900/10 bg-paper py-[1.1vh] pr-2 text-[max(0.52rem,8.5px)] tracking-[0.14em] text-ink/55`}>
                  {row.label}
                  {differs && <span aria-label="differs" className="size-1.5 shrink-0 rounded-full bg-ember" />}
                </p>,
                ...units.map((u) => (
                  <div key={`${row.label}-${u.id}`} className={`flex items-center border-t border-forest-900/10 px-1 py-[1.1vh] text-[clamp(0.8rem,1.55vh,0.95rem)] whitespace-pre-line ${shade} ${differs ? 'text-forest-900' : 'text-ink/70'}`}>
                    {row.show ? row.show(u) : row.get(u)}
                  </div>
                )),
              ]
            })}
          </div>
          <p className="mt-[1.4vh] flex items-center gap-2 text-[max(0.7rem,10.5px)] text-ink/55">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-ember" /> Where the homes differ
          </p>
        </div>
      </div>
    </div>
  )
}
