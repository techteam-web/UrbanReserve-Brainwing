import { useRef } from 'react'
import { useNav } from '../app/nav'
import { useIntro } from '../hooks/useIntro'
import { LANDING, BRAND } from '../data/content'
import { Mark } from '../art/Brand'
import Botanical from '../art/Botanical'
import Terrain from '../art/Terrain'

export default function Landing() {
  const root = useRef(null)
  const { go } = useNav()

  useIntro(root, (tl) => {
    tl.from('[data-bg]', { scale: 1.22, duration: 3, ease: 'power2.out' }, 0)
      .from('[data-ridge]', { yPercent: 100, duration: 2.2, stagger: 0.14, ease: 'expo.out' }, 0.1)
      .fromTo('[data-mark]', { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1.8, ease: 'expo.inOut' }, 0.2)
      .from('[data-word]', { yPercent: 115, duration: 1.6, stagger: 0.12, ease: 'expo.out' }, 0.55)
  })

  return (
    <section ref={root} className="screen bg-forest-950 text-ivory">
      <img data-bg src={LANDING.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-luminosity" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,transparent_0%,rgb(13_35_29/0.55)_55%,rgb(13_35_29/0.92)_100%)]" />

      <div className="absolute inset-x-0 bottom-0 h-[34vh]">
        <div data-ridge className="drift absolute inset-x-[-4%] bottom-0" style={{ '--d': 6 }}>
          <Terrain side="top" seed={41} amp={55} kind="hills" className="h-[30vh] w-full text-forest-800/60" />
        </div>
        <div data-ridge className="drift absolute inset-x-[-4%] bottom-0" style={{ '--d': 12 }}>
          <Terrain side="top" seed={5} amp={50} kind="hills" className="h-[21vh] w-full text-forest-900/90" />
        </div>
        <div data-ridge className="drift absolute inset-x-[-4%] -bottom-2" style={{ '--d': 20 }}>
          <Terrain side="top" seed={23} amp={45} kind="hills" className="h-[12vh] w-full text-forest-950" />
        </div>
      </div>

      <Botanical kind="fern" seed={4} depth={22} className="bottom-[10vh] left-0 w-[24vw] min-w-40 text-gold/40" />
      <Botanical kind="umbel" seed={8} depth={-16} className="right-0 top-[6vh] w-[14vw] min-w-28 text-gold/35" />
      <Botanical kind="seed" seed={12} depth={30} className="right-[16vw] top-[58vh] w-[clamp(2.5rem,4vw,4.5rem)] rotate-[18deg] text-ivory/35" />
      <Botanical kind="seed" seed={19} depth={-24} className="left-[18vw] top-[18vh] w-[clamp(2rem,3vw,3.5rem)] -rotate-12 text-ivory/25" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pb-[6vh] text-center">
        <div data-mark className="w-[clamp(4.5rem,11vh,7rem)] text-ivory">
          <Mark />
        </div>
        <p data-in className="eyebrow mt-[4vh] text-gold-lit">{LANDING.eyebrow}</p>
        <h1 className="display mt-[2.5vh] font-light text-[clamp(3rem,min(10vw,15vh),9.5rem)] leading-[0.95] tracking-[0.04em]">
          {['Urban', 'Reserve'].map((w) => (
            <span key={w} className="block overflow-hidden pb-[0.06em]">
              <span data-word className="block">{w}</span>
            </span>
          ))}
        </h1>
        <p data-in className="mt-[2.5vh] text-[0.78rem] font-medium uppercase tracking-[0.46em] text-gold">{BRAND.tagline}</p>
        <div data-in className="mt-[5vh]">
          <button onClick={() => go('menu')} className="btn group text-ivory">
            Enter Experience
            <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M4 12h15M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
