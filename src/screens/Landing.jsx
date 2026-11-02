import { useRef } from 'react'
import { useNav } from '../app/nav'
import { filmRunning } from '../app/opening'
import { useIntro } from '../hooks/useIntro'
import { LANDING, BRAND } from '../data/content'
import { Mark } from '../art/Brand'
import { Icon } from '../components/ui'
import Botanical from '../art/Botanical'

/**
 * Home: the towers at dusk beside the name, a way into the tour, and the dock below for the rest.
 * On desktop the towers stand in a tall panel on the right, fading into the forest ground; on phones
 * they fill the screen and the words sit at the foot over a shade.
 */
export default function Landing() {
  const root = useRef(null)
  const { go } = useNav()
  useIntro(root)

  return (
    <section ref={root} className="screen bg-forest-950 text-ivory">
      <img src={LANDING.texture} alt="" className="absolute inset-y-0 left-0 hidden h-full w-[62%] object-cover opacity-25 mix-blend-luminosity lg:block" />
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_28%_48%,transparent_10%,rgb(13_35_29/0.9)_72%)] lg:block" />

      <div data-fade className="absolute inset-0 lg:left-auto lg:w-[46%]">
        <img src={LANDING.image} alt="The Urban Reserve towers at dusk" className="h-full w-full object-cover object-[50%_30%]" />
        <div className="absolute inset-0 bg-linear-to-t from-forest-950 from-30% via-forest-950/75 via-60% to-forest-950/0 to-90% lg:hidden" />
        <div className="absolute inset-y-0 left-0 hidden w-[30%] bg-linear-to-r from-forest-950 to-forest-950/0 lg:block" />
        <div className="absolute inset-x-0 bottom-0 hidden h-[30%] bg-linear-to-t from-forest-950/80 to-forest-950/0 lg:block" />
      </div>

      <Botanical kind="fern" seed={4} depth={22} className="-bottom-[9vh] left-0 hidden w-[13vw] text-gold/20 lg:block" />
      <Botanical kind="seed" seed={19} depth={-24} className="left-[44%] top-[16vh] hidden w-[clamp(2rem,3vw,3.5rem)] -rotate-12 text-ivory/20 lg:block" />

      <div className="safe pane relative flex h-full flex-col justify-end-safe pb-[calc(var(--chrome-bot)+1.5rem)] lg:w-[56%] lg:justify-center lg:pb-(--chrome-bot)">
        {/* the intro film's logo lands here, so while it runs the mark stands still for it */}
        <div data-home-mark data-in={filmRunning() ? undefined : true} className="w-[clamp(2.75rem,7vh,4.25rem)] text-gold">
          <Mark />
        </div>
        <p data-in className="eyebrow mt-[3vh] text-gold-lit">{LANDING.eyebrow}</p>
        <h1 className="display mt-[1.6vh] text-[clamp(3rem,min(13vw,13vh),8.5rem)] leading-[0.92] font-light tracking-[0.03em]">
          <span data-in className="block">Urban</span>
          <span data-in className="block">Reserve</span>
        </h1>
        <p data-in className="mt-[2.2vh] text-[max(0.7rem,9.5px)] font-medium tracking-[0.42em] text-gold uppercase">{BRAND.tagline}</p>
        <p data-in className="copy mt-[2.4vh] max-w-md text-ivory/75">{LANDING.body}</p>

        <div data-in className="mt-[4vh] flex flex-wrap items-center gap-3">
          <button onClick={() => go('overview')} className="btn btn-solid group">
            Start the tour
            <svg viewBox="0 0 24 24" className="size-4 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12h15M13 6l6 6-6 6" />
            </svg>
          </button>
          <button onClick={() => go('views')} className="btn text-ivory">
            <Icon name="turn" className="size-4" />
            360° Views
          </button>
        </div>

        <dl className="mt-[5.5vh] hidden gap-[clamp(1.5rem,3vw,3.5rem)] sm:flex">
          {LANDING.facts.map((f) => (
            <div key={f.label} data-in className="border-l border-gold/30 pl-4">
              <dt className="font-display text-[clamp(1.6rem,4.2vh,2.9rem)] leading-none text-gold-lit">{f.value}</dt>
              <dd className="label mt-2 text-ivory/60">{f.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
