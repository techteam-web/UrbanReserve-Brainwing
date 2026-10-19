import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useIntro, useTone } from '../hooks/useIntro'
import { TOWERS } from '../data/content'
import HEADINGS from '../data/headings.json'

const PanoramaViewer = lazy(() => import('../components/PanoramaViewer'))

// each scene with how far it is turned from the others (npm run headings), so the view can keep
// facing the same way across towers and floors
const SCENES = TOWERS.flatMap((t) => t.floors).map((f) => ({ ...f, heading: HEADINGS[f.key] ?? 0 }))
// the floor nearest an elevation, so switching tower keeps the visitor at the same height
const nearest = (floors, height) => floors.reduce((a, b) => (Math.abs(b.height - height) < Math.abs(a.height - height) ? b : a))

function TowerSwitch({ value, onChange }) {
  return (
    <div role="tablist" aria-label="Tower" className="relative grid grid-cols-2 rounded-full border border-ivory/15 bg-forest-950/40 p-1">
      <span className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-gold transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${value === TOWERS[1].id ? 'translate-x-full' : ''}`} />
      {TOWERS.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`label relative z-10 rounded-full px-4 py-2.5 text-[max(0.62rem,9px)] transition-colors duration-500 ${value === t.id ? 'text-forest-950' : 'text-ivory/70 hover:text-ivory'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// The tab that slides the floors away and back; its chevron points the way they will go.
function Handle({ open, onClick, controls, down = false, className = '', ...rest }) {
  return (
    <button
      {...rest}
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={open ? 'Hide the floors' : 'Show the floors'}
      title={open ? 'Hide the floors' : 'Show the floors'}
      className={`pointer-events-auto grid place-items-center rounded-full border border-ivory/15 bg-forest-950/75 text-gold-lit shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl transition-[border-color,color] duration-700 hover:border-gold/60 hover:text-gold ${className}`}
    >
      <svg viewBox="0 0 24 24" className={`size-4 transition-transform duration-700 ${open ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={down ? 'M6 9l6 6 6-6' : 'M15 6l-6 6 6 6'} />
      </svg>
    </button>
  )
}

// Phones: the floors as chips, lowest first, keeping the current one in view.
function FloorChips({ floors, current, onPick }) {
  const strip = useRef(null)
  useEffect(() => {
    const el = strip.current
    const chip = el?.querySelector('[aria-current]')
    if (chip) el.scrollTo({ left: chip.offsetLeft - (el.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' })
  }, [current])
  return (
    <div ref={strip} className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 [scrollbar-width:none]">
      {[...floors].reverse().map((f) => (
        <button
          key={f.key}
          onClick={() => onPick(f.height)}
          aria-current={f.key === current || undefined}
          className={`label shrink-0 rounded-full border px-4 py-2 text-[max(0.6rem,9px)] transition-colors duration-500 ${f.key === current ? 'border-gold bg-gold text-forest-950' : 'border-ivory/20 bg-forest-950/55 text-ivory/80'}`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

export default function Views() {
  const root = useRef(null)
  const [towerId, setTowerId] = useState(TOWERS[0].id)
  const [height, setHeight] = useState(TOWERS[0].start.height)
  const [open, setOpen] = useState(true)
  useTone('dark')
  useIntro(root)

  const tower = TOWERS.find((t) => t.id === towerId)
  const floor = nearest(tower.floors, height)
  const toggle = { open, onClick: () => setOpen((v) => !v) }

  return (
    <section ref={root} className="screen bg-forest-950 text-ivory">
      <div data-mask className="absolute inset-0 bg-forest-900">
        <Suspense fallback={null}>
          <PanoramaViewer scenes={SCENES} active={floor.key} autorotate={tower.settings.autorotateEnabled} mouseViewMode={tower.settings.mouseViewMode} />
        </Suspense>
      </div>

      {/* keeps the chrome legible over bright skies */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[20vh] bg-linear-to-b from-forest-950/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[18vh] bg-linear-to-t from-forest-950/65 to-transparent" />

      {/* desktop: the floors in a rail down the left that slides off the edge, leaving its handle
          (the slide is on a wrapper: the rail's own transform belongs to the page's entrance) */}
      <div className="safe pointer-events-none absolute inset-0 hidden flex-col justify-center lg:flex">
        <div className={`relative flex max-h-full min-h-0 w-[clamp(16rem,18vw,21rem)] flex-col transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${open ? '' : '-translate-x-[calc(100%+var(--gutter))]'}`}>
          <Handle {...toggle} data-in controls="views-rail" className="absolute left-full top-1/2 ml-3 h-16 w-9 -translate-y-1/2" />
          <nav
            id="views-rail"
            data-in
            inert={!open}
            aria-label="Towers and floors"
            className="pointer-events-auto relative min-h-0 overflow-y-auto border border-ivory/10 bg-forest-950/70 p-[clamp(1.1rem,2.4vh,1.8rem)] shadow-[0_50px_90px_-40px_rgb(0_0_0/0.85)] backdrop-blur-xl [scrollbar-width:none]"
          >
            <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/70 to-transparent" />
            <TowerSwitch value={towerId} onChange={setTowerId} />
            <div className="mt-[1.6vh]">
              {tower.floors.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setHeight(f.height)}
                  aria-current={f.key === floor.key || undefined}
                  className={`relative flex w-full items-baseline gap-4 border-b border-ivory/10 py-[1vh] pl-5 text-left transition-colors duration-500 last:border-b-0 ${f.key === floor.key ? 'text-ivory' : 'text-ivory/50 hover:text-ivory/90'}`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-px w-3 origin-left -translate-y-1/2 bg-gold transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${f.key === floor.key ? 'scale-x-100' : 'scale-x-0'}`}
                  />
                  <span className="font-display text-[clamp(1.05rem,2.3vh,1.5rem)] uppercase tracking-[0.06em]">{f.label}</span>
                  <span className="ml-auto font-display text-[0.95rem] italic tabular-nums text-gold-lit">{f.height} m</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* phones and portrait tablets: a sheet above the foot of the screen (clear of the watermark)
          that drops away, leaving its handle */}
      <div data-in className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--chrome-bot)+var(--watermark-h)+0.75rem)] px-(--gutter) lg:hidden">
        <div className={`flex flex-col items-center transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${open ? '' : 'translate-y-[calc(100%-2.75rem)]'}`}>
          <Handle {...toggle} down controls="views-sheet" className="mb-2 h-9 w-16" />
          <nav
            id="views-sheet"
            inert={!open}
            aria-label="Towers and floors"
            className={`pointer-events-auto relative w-full max-w-md border border-ivory/10 bg-forest-950/80 p-3 backdrop-blur-xl transition-opacity duration-700 ${open ? '' : 'opacity-0'}`}
          >
            <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/70 to-transparent" />
            <TowerSwitch value={towerId} onChange={setTowerId} />
            <FloorChips floors={tower.floors} current={floor.key} onPick={setHeight} />
          </nav>
        </div>
      </div>
    </section>
  )
}
