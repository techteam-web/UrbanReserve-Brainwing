import { lazy, Suspense, useRef, useState } from 'react'
import { useIntro, useTone } from '../hooks/useIntro'
import { PANORAMAS } from '../data/content'
import Botanical from '../art/Botanical'
import Terrain from '../art/Terrain'

const PanoramaViewer = lazy(() => import('../components/PanoramaViewer'))

function Globe() {
  return (
    <svg viewBox="0 0 120 120" className="w-[clamp(4.5rem,11vh,7rem)] text-gold" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <g data-draw>
        <circle cx="60" cy="60" r="48" />
        <ellipse cx="60" cy="60" rx="20" ry="48" />
        <ellipse cx="60" cy="60" rx="38" ry="48" />
        <path d="M12 60h96M18 36h84M18 84h84" />
        <path d="M34 22c8 4 44 4 52 0M34 98c8-4 44-4 52 0" opacity="0.6" />
      </g>
    </svg>
  )
}

export default function Views() {
  const root = useRef(null)
  const [active, setActive] = useState(PANORAMAS[0]?.id)
  const has = PANORAMAS.length > 0
  useTone('dark')
  useIntro(root)

  return (
    <section ref={root} className="screen bg-forest-950 text-ivory">
      <div className="safe flex h-full flex-col">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p data-in className="eyebrow text-gold-lit">360° Views</p>
            <h2 data-in className="display mt-[1.5vh] text-[clamp(1.9rem,5vh,3.8rem)] font-normal">Step inside the reserve</h2>
          </div>
          {has && (
            <div data-in className="flex flex-wrap gap-2">
              {PANORAMAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActive(p.id)}
                  className={`label rounded-full border px-5 py-2.5 transition-colors duration-500 ${active === p.id ? 'border-gold bg-gold text-forest-950' : 'border-ivory/25 hover:border-ivory/70'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div data-mask className="relative mt-[3.5vh] min-h-0 flex-1 overflow-hidden bg-forest-900">
          {has ? (
            <>
              <Suspense fallback={null}>
                <PanoramaViewer scenes={PANORAMAS} activeId={active} />
              </Suspense>
              <p className="label pointer-events-none absolute bottom-4 left-4 rounded-full bg-forest-950/55 px-4 py-2 backdrop-blur">Drag to look around</p>
            </>
          ) : (
            <div className="relative flex h-full flex-col items-center justify-center gap-[2.2vh] px-6 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgb(63_111_98/0.45),transparent_65%)]" />
              <Botanical kind="fern" seed={30} depth={14} className="bottom-[12%] left-0 w-[18vw] text-gold/20" />
              <Botanical kind="umbel" seed={31} depth={-12} className="right-0 top-[4%] w-[12vw] text-gold/20" />
              <Terrain side="top" seed={77} amp={55} kind="hills" className="absolute inset-x-0 bottom-0 h-[16vh] w-full text-forest-950/60" />
              <div data-in className="relative"><Globe /></div>
              <p data-in className="display relative text-[clamp(1.4rem,3.4vh,2.4rem)] font-normal">360° views arriving soon</p>
              <p data-in className="relative max-w-md text-sm leading-relaxed text-ivory/60">
                Immersive panoramas of the tower, the E-Deck and the forest trails will appear here once the renders are delivered.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
