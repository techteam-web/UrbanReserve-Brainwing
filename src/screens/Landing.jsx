import { useRef } from 'react'
import { useNav } from '../app/nav'
import { filmRunning } from '../app/opening'
import { useIntro } from '../hooks/useIntro'
import { LANDING, BRAND } from '../data/content'
import { Mark } from '../art/Brand'
import { Icon } from '../components/ui'
import Botanical from '../art/Botanical'

/**
 * Home: the towers rising over the forest, the intro film's last shot, filling the screen behind the
 * name, a way into the tour, and the dock below for the rest. A see-through green shade keeps the
 * words clear: from the left on desktop, from the foot on phones.
 */
export default function Landing() {
  const root = useRef(null)
  const { go } = useNav()
  useIntro(root)

  return (
    <section ref={root} className="screen bg-forest-950 text-ivory">
      {/* after the film the picture is already in place, under the film's last frame, so it has no
          entrance of its own; the film ends a touch closer in (its slow push), and so does this */}
      <div data-fade={filmRunning() ? undefined : true} className="absolute inset-0">
        <img src={LANDING.image} alt="The Urban Reserve towers over the forest" className="home-frame h-full w-full scale-[1.04]" />
        <div className="home-shade absolute inset-0" />
      </div>

      <Botanical kind="fern" seed={4} depth={22} className="-bottom-[9vh] left-0 hidden w-[13vw] text-gold/20 lg:block" />
      <Botanical kind="seed" seed={19} depth={-24} className="left-[44%] top-[16vh] hidden w-[clamp(2rem,3vw,3.5rem)] -rotate-12 text-ivory/20 lg:block" />

      <div className="safe pane relative flex h-full flex-col justify-end-safe pb-[calc(var(--chrome-bot)+1.5rem)] lg:w-[56%] lg:justify-center lg:pb-(--chrome-bot)">
        {/* the intro film's logo lands here, so while it runs the mark stands still for it */}
        <div data-home-mark data-in={filmRunning() ? undefined : true} className="w-[clamp(2.75rem,7vh,4.25rem)] text-gold">
          <Mark />
        </div>
        {/* the small gold lines carry a soft forest glow, for where the light shade leaves them over the sky */}
        <p data-in className="eyebrow mt-[3vh] text-gold-lit [text-shadow:0_1px_2px_rgb(13_35_29/0.9),0_0_14px_rgb(13_35_29/0.8)]">{LANDING.eyebrow}</p>
        <h1 className="display mt-[1.6vh] text-[clamp(3rem,min(13vw,13vh),8.5rem)] leading-[0.92] font-light tracking-[0.03em]">
          <span data-in className="block">Urban</span>
          <span data-in className="block">Reserve</span>
        </h1>
        <p data-in className="mt-[2.2vh] text-[max(0.7rem,9.5px)] font-medium tracking-[0.42em] text-gold uppercase [text-shadow:0_1px_2px_rgb(13_35_29/0.9),0_0_14px_rgb(13_35_29/0.8)]">{BRAND.tagline}</p>
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
