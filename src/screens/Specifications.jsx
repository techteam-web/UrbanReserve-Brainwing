import { useRef } from 'react'
import { useIntro, useTone } from '../hooks/useIntro'
import { SPECS, SPEC_IMAGE } from '../data/content'
import { Icon } from '../components/ui'
import Botanical from '../art/Botanical'
import Terrain from '../art/Terrain'

export default function Specifications() {
  const root = useRef(null)
  useTone(['dark', 'light'])
  useIntro(root)

  const [lead, ...rest] = SPECS

  return (
    <section ref={root} className="screen grid bg-paper text-forest-900 lg:grid-cols-[0.7fr_1.3fr]">
      <div data-mask className="relative hidden overflow-hidden bg-forest-900 lg:block">
        <img src={SPEC_IMAGE} alt="Urban Reserve at dusk" className="absolute inset-0 h-full w-full object-cover object-[50%_35%]" />
        <div className="absolute inset-0 bg-linear-to-b from-forest-950/45 via-transparent to-forest-950/55" />
        <Terrain side="left" seed={91} amp={60} className="absolute inset-y-0 right-0 h-full w-[2.6vw] text-paper" />
      </div>

      <div className="relative min-h-0 overflow-hidden">
        <Botanical kind="fern" seed={17} depth={14} className="bottom-[6vh] right-0 w-[16vw] -scale-x-100 text-forest-700/12" />
        <div className="safe pane relative flex h-full flex-col justify-center-safe lg:pl-[3vw]">
          <p data-in className="eyebrow text-ember">Specifications</p>
          <h2 data-in className="display mt-[1.2vh] text-[clamp(1.8rem,4.8vh,3.6rem)] text-forest-800">Technical amenities</h2>

          <div data-in className="mt-[3vh] rounded-[1.25rem] bg-forest-900 p-[clamp(1rem,2.4vh,1.6rem)] text-ivory">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-gold text-forest-950">
                <Icon name={lead.icon} className="size-5" />
              </span>
              <h3 className="font-display text-[clamp(1.15rem,2.6vh,1.6rem)] text-gold-lit">{lead.title}</h3>
            </div>
            <ul className="mt-[1.6vh] flex flex-wrap gap-2">
              {lead.items.map((t) => (
                <li key={t} className="rounded-full border border-ivory/15 px-3.5 py-1.5 text-[clamp(0.75rem,1.55vh,0.9rem)] text-ivory/85">{t}</li>
              ))}
            </ul>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {rest.map((s) => (
              <div key={s.title} data-in className="rounded-[1.25rem] border border-forest-900/10 bg-white/60 p-[clamp(1rem,2.2vh,1.4rem)]">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ember/10 text-ember-deep">
                    <Icon name={s.icon} className="size-5" />
                  </span>
                  <h3 className="font-display text-[clamp(1.05rem,2.3vh,1.4rem)] text-ember-deep">{s.title}</h3>
                </div>
                <ul className="mt-[1.2vh] space-y-[0.6vh] text-[clamp(0.78rem,1.6vh,0.92rem)] text-ink/75">
                  {s.items.map((t) => (
                    <li key={t} className="flex gap-2.5">
                      <span className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-ember" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
