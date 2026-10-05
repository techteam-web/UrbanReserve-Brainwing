import { useRef, useState } from 'react'
import { gsap, useGSAP, reduced } from '../gsap/gsapConfig'
import { useNav } from '../app/nav'
import { useIntro } from '../hooks/useIntro'
import { SECTIONS, ENQUIRE_PREVIEW, BRAND } from '../data/content'
import { Mark } from '../art/Brand'
import Botanical from '../art/Botanical'
import Terrain from '../art/Terrain'

const ITEMS = [...SECTIONS, { id: 'enquire', label: 'Enquire', blurb: 'Plans, pricing and a private site visit.', preview: ENQUIRE_PREVIEW }]

export default function Menu() {
  const root = useRef(null)
  const { go, lastPage } = useNav()
  const [hover, setHover] = useState(() => Math.max(0, ITEMS.findIndex((s) => s.id === lastPage())))

  useIntro(root)

  useGSAP(
    () => {
      const imgs = gsap.utils.toArray('[data-preview]')
      const caps = gsap.utils.toArray('[data-caption]')
      const d = reduced() ? 0 : 1
      imgs.forEach((el, i) => {
        const on = i === hover
        gsap.to(el, { autoAlpha: on ? 1 : 0, scale: on ? 1 : 1.08, duration: on ? 1.1 * d : 0.8 * d, ease: 'power3.out', overwrite: true })
      })
      caps.forEach((el, i) => {
        const on = i === hover
        gsap.to(el, { autoAlpha: on ? 1 : 0, y: on ? 0 : 14, duration: 0.6 * d, delay: on ? 0.15 * d : 0, overwrite: true })
      })
    },
    { scope: root, dependencies: [hover] },
  )

  const close = () => go(lastPage() ?? 'landing')

  return (
    <section ref={root} className="screen bg-paper text-forest-900">
      <div className="relative z-10 flex h-full flex-col px-(--gutter) lg:w-[54%]">
        <header className="flex h-(--chrome-top) shrink-0 items-center justify-between">
          <button onClick={() => go('landing')} className="flex items-center gap-3" aria-label="Home">
            <span className="w-9 text-gold-deep"><Mark /></span>
            <span className="label hidden sm:block">Urban Reserve</span>
          </button>
          <button onClick={close} className="label group flex items-center gap-3 py-2 lg:hidden">
            Close <span className="text-lg leading-none transition-transform duration-500 group-hover:rotate-90">✕</span>
          </button>
        </header>

        <nav className="flex min-h-0 flex-1 flex-col justify-center-safe max-lg:overflow-y-auto">
          {ITEMS.map((s, i) => (
            <div key={s.id} data-in>
              <button
                onClick={() => go(s.id)}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                className={`group flex w-full items-baseline gap-[2vw] border-b border-forest-900/10 py-[1.1vh] text-left transition-colors duration-500 ${hover === i ? 'text-ember-deep' : ''}`}
              >
                <span className="w-8 shrink-0 font-display text-[clamp(0.85rem,1.8vh,1.1rem)] text-gold-deep">{String(i + 1).padStart(2, '0')}</span>
                <span className={`display text-[clamp(1.9rem,min(6.2vh,5vw),4.6rem)] font-normal transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${hover === i ? 'translate-x-4' : ''}`}>
                  {s.label}
                </span>
                <span className={`ml-auto hidden self-center text-xl transition-all duration-500 md:block ${hover === i ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'}`}>→</span>
              </button>
            </div>
          ))}
        </nav>

        <footer data-in className="label flex h-(--chrome-bot) shrink-0 items-center justify-between gap-4 text-forest-900/60">
          <span>{BRAND.tagline}</span>
          <span className="hidden md:inline">Esc to return</span>
        </footer>
      </div>

      <Botanical kind="leaf" seed={6} depth={14} className="bottom-0 left-[39%] hidden w-[9vw] text-forest-700/15 lg:block" />

      <aside data-mask className="absolute inset-y-0 right-0 hidden w-[46%] lg:block">
        <Terrain side="left" seed={29} amp={70} className="absolute inset-y-0 left-0 h-full w-[4.2vw] text-forest-900" />
        <div className="absolute inset-y-0 left-[4.1vw] right-0 overflow-hidden bg-forest-900">
          {ITEMS.map((s) => (
            <img key={s.id} data-preview src={s.preview} alt="" loading="lazy" decoding="async" className="invisible absolute inset-0 h-full w-full object-cover" />
          ))}
          <div className="absolute inset-0 bg-linear-to-t from-forest-950/90 via-forest-950/10 to-forest-950/30" />
          <Botanical kind="umbel" seed={3} depth={-12} className="right-0 top-[9%] w-[30%] text-gold/45" />
          <div className="absolute inset-x-0 bottom-0 p-[3.5vw] text-ivory">
            {ITEMS.map((s, i) => (
              <div key={s.id} data-caption className="invisible absolute bottom-[3.5vw] left-[3.5vw] right-[3.5vw]">
                <p className="eyebrow text-gold-lit">{String(i + 1).padStart(2, '0')} — {s.label}</p>
                <p className="mt-3 max-w-sm font-display text-[clamp(1.4rem,3vh,2.1rem)] leading-tight">{s.blurb}</p>
              </div>
            ))}
          </div>
        </div>
        <button onClick={close} className="label group absolute right-(--gutter) top-0 flex h-(--chrome-top) items-center gap-3 text-ivory">
          Close <span className="text-lg leading-none transition-transform duration-500 group-hover:rotate-90">✕</span>
        </button>
      </aside>
    </section>
  )
}
