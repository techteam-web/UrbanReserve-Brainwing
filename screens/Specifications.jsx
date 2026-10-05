import { useRef } from 'react'
import { useIntro, useTone } from '../hooks/useIntro'
import { SPECS, SPEC_IMAGE } from '../data/content'
import { Bullets } from '../components/ui'
import Botanical from '../art/Botanical'
import Terrain from '../art/Terrain'

export default function Specifications() {
  const root = useRef(null)
  useTone(['dark', 'light'])
  useIntro(root)

  return (
    <section ref={root} className="screen grid bg-paper text-forest-900 lg:grid-cols-[0.8fr_1.2fr]">
      <div data-mask className="relative hidden overflow-hidden bg-forest-900 lg:block">
        <img src={SPEC_IMAGE} alt="Urban Reserve at dusk" className="absolute inset-0 h-full w-full object-cover object-[50%_35%]" />
        <div className="absolute inset-0 bg-linear-to-b from-forest-950/45 via-transparent to-forest-950/55" />
        <Terrain side="left" seed={91} amp={60} className="absolute inset-y-0 right-0 h-full w-[2.6vw] text-paper" />
      </div>

      <div className="relative min-h-0 overflow-hidden">
        <Botanical kind="fern" seed={17} depth={14} className="bottom-[6vh] right-0 w-[16vw] -scale-x-100 text-forest-700/12" />
        <div className="safe flex h-full flex-col justify-center-safe pane lg:pl-[3.5vw]">
          <p data-in className="eyebrow text-ember">Specifications</p>
          <h2 data-in className="display mt-[1.5vh] text-[clamp(1.9rem,5.2vh,3.9rem)] text-forest-800">Technical amenities</h2>
          <div className="mt-[3.5vh] columns-1 gap-[3vw] md:columns-2">
            {SPECS.map((s) => (
              <div key={s.title} data-in className="mb-[3vh] break-inside-avoid border-t border-forest-900/15 pt-[1.6vh]">
                <h3 className="font-display text-[clamp(1.15rem,2.6vh,1.6rem)] text-ember-deep">{s.title}</h3>
                <Bullets items={s.items} className="mt-[1vh] text-[clamp(0.8rem,1.7vh,0.95rem)] text-ink/80" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
