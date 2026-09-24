import { useRef } from 'react'
import { useNav } from '../app/nav'
import { useIntro, useTone } from '../hooks/useIntro'
import { HOME, BRAND } from '../data/content'
import { Icon } from '../components/ui'

const rectOf = (el) => {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  const root = useRef(null)
  const { go } = useNav()
  useTone('dark')
  useIntro(root, (tl) => {
    tl.from('[data-tower]', { autoAlpha: 0, scale: 1.08, duration: 2.4, ease: 'power3.out' }, 0)
      .from('[data-word]', { yPercent: 110, duration: 1.3, stagger: 0.1, ease: 'expo.out' }, 0.25)
  })

  const open = (id, origin) => go(id, origin)

  return (
    <section ref={root} className="screen bg-forest-950 text-ivory">
      {/* the render fills the screen, cropped in on the towers when the screen is narrow */}
      <div className="drift absolute inset-0 overflow-hidden" style={{ '--d': -8 }}>
        <img data-tower src={HOME.hero} alt="Urban Reserve towers at sunset" className="h-full w-full object-cover object-[86%_45%] lg:object-[50%_45%]" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[68%] bg-linear-to-r from-forest-950/85 via-forest-950/45 to-transparent lg:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[18vh] bg-linear-to-b from-forest-950/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62vh] bg-linear-to-t from-forest-950 via-forest-950/75 to-transparent lg:h-[30vh] lg:via-forest-950/40" />

      <div className="safe pane relative flex h-full flex-col pb-[max(1.25rem,3.5vh)]">
        <div className="flex flex-1 flex-col justify-end pt-[46vh] lg:w-[50%] lg:justify-center lg:pt-0">
          <p data-in className="eyebrow text-gold-lit">
            {greeting()} — welcome to
          </p>
          <h1 className="display mt-[2.2vh] text-[clamp(3.6rem,min(15vh,10vw),11.5rem)] font-light leading-[0.88] tracking-[0.03em]">
            {BRAND.name.split(' ').map((w) => (
              <span key={w} className="block overflow-hidden pb-[0.05em]">
                <span data-word className="block">
                  {w}
                </span>
              </span>
            ))}
          </h1>
          <p data-in className="mt-[2.8vh] text-[0.8rem] font-medium uppercase tracking-[0.42em] text-gold">{BRAND.tagline}</p>
          <p data-in className="copy mt-[2vh] max-w-md text-ivory/70">{HOME.lede}</p>

          <div data-in className="mt-[4vh] flex flex-wrap items-center gap-3">
            <button onClick={(e) => open('overview', rectOf(e.currentTarget))} className="btn btn-solid !py-4 active:scale-95">
              Start the tour
              <Icon name="arrow" className="size-4" />
            </button>
            <button onClick={(e) => open('enquire', rectOf(e.currentTarget))} className="btn !py-4 text-ivory active:scale-95">
              Book a visit
            </button>
          </div>

          <dl data-in className="mt-[6vh] flex gap-[clamp(1.75rem,3.2vw,3.5rem)] border-t border-ivory/10 pt-[3vh]">
            {HOME.stats.map((st) => (
              <div key={st.label}>
                <dt className="font-display text-[clamp(1.8rem,4.6vh,3.2rem)] leading-none text-gold-lit">{st.value}</dt>
                <dd className="label mt-2 text-[max(0.6rem,9px)] text-ivory/55">{st.label}</dd>
              </div>
            ))}
          </dl>
        </div>

      </div>
    </section>
  )
}
