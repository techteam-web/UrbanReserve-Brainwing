import { useRef, useState } from 'react'
import { Observer } from 'gsap/Observer'
import { gsap, useGSAP, reduced } from '../gsap/gsapConfig'
import { useIntro, useTone, playIn } from '../hooks/useIntro'
import { holdIntro } from '../app/gate'
import { OVERVIEW } from '../data/content'
import { Mark } from '../art/Brand'
import Botanical from '../art/Botanical'
import SunBirds from '../art/SunBirds'
import Terrain from '../art/Terrain'

gsap.registerPlugin(Observer)

const EMBOSS = 'text-paper-deep [filter:drop-shadow(1px_1px_0_rgb(255_255_255/0.95))_drop-shadow(-1px_-1px_0.5px_rgb(60_40_20/0.14))]'

function Breaker() {
  const b = OVERVIEW.breaker
  return (
    <div className="absolute inset-0 bg-paper text-forest-900">
      <Botanical kind="seed" seed={2} depth={18} className={`bottom-[8vh] left-[40%] w-[5vw] rotate-12 ${EMBOSS}`} />
      <Botanical kind="seed" seed={7} depth={-14} className={`right-[5vw] top-[13vh] w-[4vw] -rotate-12 ${EMBOSS}`} />
      <Botanical kind="seed" seed={15} depth={26} className={`bottom-[14vh] right-[8vw] w-[3vw] rotate-[28deg] ${EMBOSS}`} />
      <div className="safe pane relative grid h-full items-center gap-[4vh] [align-content:safe_center] lg:grid-cols-[1fr_1.05fr] lg:gap-[4vw]">
        <div>
          <p data-in className="eyebrow text-ember">Overview</p>
          <h2 className="display mt-[2.5vh] text-[clamp(2.6rem,min(9.5vh,7vw),7.5rem)] text-forest-800">
            {b.lines.map((l) => (
              <span key={l} data-in className="block">{l}</span>
            ))}
          </h2>
          <p data-in className="copy mt-[3.5vh] max-w-md text-ink/75">{b.body}</p>
          <p data-in className="label mt-[5vh] hidden text-forest-900/45 md:block">Scroll, swipe, use ← → or the arrows below to explore</p>
        </div>
        <div className="flex justify-center">
          <SunBirds className="w-[min(34vh,70vw)] lg:w-[min(66vh,40vw)]" />
        </div>
      </div>
    </div>
  )
}

function Welcome() {
  const w = OVERVIEW.welcome
  return (
    <div className="absolute inset-0 bg-forest-950 text-ivory">
      <img data-kb src={w.image} alt="" className="absolute inset-0 h-full w-full object-cover will-change-transform" />
      <div className="absolute inset-0 bg-linear-to-r from-forest-950/25 via-forest-950/40 to-forest-950/85" />
      <Botanical kind="monstera" seed={5} depth={-18} className="bottom-0 right-0 w-[15vw] -scale-x-100 text-gold/35" />
      <div className="safe pane relative grid h-full items-center gap-[5vw] [align-content:safe_center] lg:grid-cols-2">
        <div className="hidden justify-center lg:flex">
          <div data-in className="drift w-[min(52vh,28vw)] text-ivory/75" style={{ '--d': 10 }}>
            <Mark />
          </div>
        </div>
        <div>
          <h2 data-in className="display text-[clamp(2.6rem,8vh,6.5rem)] font-normal">{w.title}</h2>
          <p data-in className="display mt-[1vh] text-[clamp(1.05rem,2.8vh,2.1rem)] text-gold-lit">
            {w.sub.map((s) => (
              <span key={s} className="block">{s}</span>
            ))}
          </p>
          <p data-in className="display mt-[1vh] text-[clamp(2rem,6vh,4.8rem)] font-normal">{w.name}</p>
          <p data-in className="copy mt-[3vh] max-w-lg text-ivory/80">{w.body}</p>
          <dl className="mt-[5vh] flex gap-[4vw]">
            {w.stats.map((s) => (
              <div key={s.label} data-in>
                <dt className="font-display text-[clamp(2rem,5vh,3.6rem)] leading-none text-gold-lit">{s.value}</dt>
                <dd className="label mt-2 text-ivory/65">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

function Vision() {
  const { architect: a, landscape: l } = OVERVIEW
  return (
    <div className="absolute inset-0 grid grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
      <div className="relative overflow-hidden bg-paper text-forest-900">
        <Botanical kind="fern" seed={11} depth={10} className={`bottom-[4vh] left-0 w-[24vw] ${EMBOSS}`} />
        <div className="safe pane relative flex h-full flex-col items-center justify-center-safe text-center">
          <h2 data-in className="display text-[clamp(2rem,6.2vh,4.8rem)] text-forest-800">
            {a.title.map((t) => (
              <span key={t} className="block">{t}</span>
            ))}
          </h2>
          <p data-in className="copy mt-[2.5vh] max-w-md text-ink/75">{a.body}</p>
          <img data-in src={a.image} alt="A sapling held in open hands" className="mt-[3vh] hidden h-[34vh] w-auto mix-blend-multiply lg:block" />
        </div>
      </div>

      <div className="relative overflow-hidden bg-ember text-ivory">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_36%,#f39247,transparent_62%),radial-gradient(ellipse_at_82%_92%,#b4470f,transparent_58%)]" />
        <img src={l.texture} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-soft-light" />
        <Botanical kind="umbel" seed={14} depth={-16} className="right-0 top-[12vh] w-[min(34%,32vh)] text-[#fbe1c7]" />
        <Botanical kind="star" seed={9} depth={12} className="bottom-0 left-[4%] w-[66%] text-[#fbe1c7]/90" />
        <div className="safe pane relative flex h-full flex-col justify-center-safe">
          <h2 data-in className="display text-[clamp(1.9rem,5.6vh,4.2rem)] font-normal">
            {l.title.map((t) => (
              <span key={t} className="block">{t}</span>
            ))}
          </h2>
          <p data-in className="copy mt-[3vh] max-w-sm text-ivory/90">{l.body}</p>
        </div>
      </div>

      <Terrain side="left" seed={33} amp={65} className="absolute inset-y-0 left-[calc(50%-2.4vw)] hidden h-full w-[2.5vw] text-ember lg:block" />
    </div>
  )
}

function Building() {
  const b = OVERVIEW.building
  const ref = useRef(null)
  const [view, setView] = useState(b.views[0].id)

  useGSAP(
    () => {
      gsap.utils.toArray('[data-view]').forEach((el) => {
        const on = el.dataset.view === view
        gsap.to(el, { autoAlpha: on ? 1 : 0, duration: reduced() ? 0 : 1.2, ease: 'power2.inOut', overwrite: true })
      })
    },
    { scope: ref, dependencies: [view] },
  )

  return (
    <div ref={ref} className="absolute inset-0 grid grid-rows-[auto_1fr] bg-forest-900 text-ivory lg:grid-cols-[1fr_auto] lg:grid-rows-1">
      <div className="safe relative flex flex-col justify-center lg:pr-[3vw]">
        <Botanical kind="leaf" seed={3} depth={12} className="bottom-0 left-[3vw] hidden w-[9vw] text-gold/15 lg:block" />
        <p data-in className="eyebrow text-gold-lit">The Tower</p>
        <h2 data-in className="display mt-[2vh] text-[clamp(2.2rem,7vh,5.2rem)] font-normal">{b.title}</h2>
        {b.body.map((p) => (
          <p key={p} data-in className="copy mt-[2.5vh] max-w-lg text-ivory/75">{p}</p>
        ))}
        <div data-in className="mt-[4vh] flex gap-2">
          {b.views.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`label rounded-full border px-5 py-2.5 transition-colors duration-500 ${view === v.id ? 'border-gold bg-gold text-forest-950' : 'border-ivory/30 hover:border-ivory/70'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div data-mask className="relative overflow-hidden lg:aspect-[0.62] lg:h-full">
        {b.views.map((v) => (
          <img key={v.id} data-view={v.id} src={v.image} alt={`Urban Reserve tower, ${v.label.toLowerCase()}`} className="invisible absolute inset-0 h-full w-full object-cover object-[50%_90%]" />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-[22vh] bg-linear-to-t from-forest-950/60 to-transparent" />
        <Terrain side="right" seed={19} amp={65} className="absolute inset-y-0 left-0 hidden h-full w-[3vw] text-forest-900 lg:block" />
      </div>
    </div>
  )
}

function Lobby() {
  const l = OVERVIEW.lobby
  return (
    <div className="absolute inset-0 grid grid-rows-[1.2fr_1fr] bg-sand text-ivory lg:grid-cols-[1.55fr_1fr] lg:grid-rows-1">
      <div data-mask className="relative overflow-hidden">
        <img data-kb src={l.image} alt="The arrival lobby" className="absolute inset-0 h-full w-full object-cover will-change-transform" />
        <div className="absolute inset-0 bg-linear-to-b from-forest-950/35 via-transparent to-forest-950/55" />
      </div>
      <div className="relative">
        <Terrain side="left" seed={51} amp={60} className="absolute inset-y-0 -left-[2.9vw] hidden h-full w-[3vw] text-sand lg:block" />
        <Botanical kind="star" seed={4} depth={14} className="bottom-0 -right-[6vw] w-[30vw] max-w-none text-[#e8c29b]" />
        <div className="safe pane relative flex h-full flex-col justify-center-safe lg:pl-[3vw]">
          <p data-in className="eyebrow text-forest-900/70">Arrival</p>
          <h2 data-in className="display mt-[2vh] text-[clamp(2rem,6vh,4.4rem)] font-normal">
            {l.title.map((t) => (
              <span key={t} className="block">{t}</span>
            ))}
          </h2>
          <p data-in className="copy mt-[3vh] max-w-sm text-ivory/90">{l.body}</p>
        </div>
      </div>
    </div>
  )
}

const SLIDES = [
  { id: 'living', label: 'Living', tone: 'light', C: Breaker },
  { id: 'welcome', label: 'Welcome', tone: 'dark', C: Welcome },
  { id: 'vision', label: 'Vision', tone: ['light', 'ember'], C: Vision },
  { id: 'building', label: 'Building', tone: 'dark', C: Building },
  { id: 'lobby', label: 'Lobby', tone: 'dark', C: Lobby },
]
const PAGER_TONE = ['light', 'dark', 'light', 'dark', 'dark']
// How long a slide stays before the next one comes in by itself (seconds, counted from the moment
// it starts to arrive). Choosing a slide by hand starts the wait again.
const DWELL = 8

function Arrow({ flip = false }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-4 ${flip ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

/**
 * The overview as a run of slides. They can be paged with the wheel, a swipe, the arrow keys or the
 * controls along the foot of the screen, and they move on by themselves: the mark for the slide on
 * show fills up with the time left, and the last leads back round to the first.
 */
export default function Overview() {
  const root = useRef(null)
  const pager = useRef(null)
  const cur = useRef(0)
  const until = useRef(0)
  const [idx, setIdx] = useState(0)
  useTone(SLIDES[idx].tone)
  useIntro(root)

  // the slide controls, once the slides are wired up: go(n, dir), next(), prev()
  const nav = useRef({ go: () => {}, next: () => {}, prev: () => {} })

  useGSAP(
    (context, contextSafe) => {
      const slides = gsap.utils.toArray('[data-slide]')
      gsap.set(slides.slice(1), { visibility: 'hidden' })
      if (!reduced()) gsap.to('[data-kb]', { scale: 1.08, duration: 18, ease: 'sine.inOut', yoyo: true, repeat: -1 })

      // The wait before the next slide, shown filling along the active pager mark (--p).
      const dwell = { p: 0 }
      let timer = null
      const arm = (delay = 0) => {
        timer?.kill()
        timer = gsap.fromTo(dwell, { p: 0 }, {
          p: 1,
          duration: DWELL,
          delay,
          ease: 'none',
          onUpdate: () => pager.current?.style.setProperty('--p', dwell.p.toFixed(4)),
          onComplete: () => next(),
        })
        return timer
      }

      const go = contextSafe((n, dir = n > cur.current ? 1 : -1) => {
        const now = performance.now()
        if (now < until.current || n === cur.current || n < 0 || n >= SLIDES.length) return
        const from = slides[cur.current]
        const to = slides[n]
        cur.current = n
        setIdx(n)
        arm()
        if (reduced()) {
          gsap.set(from, { visibility: 'hidden' })
          gsap.set(to, { visibility: 'visible' })
          return
        }
        until.current = now + 1450
        gsap.set(to, { visibility: 'visible', zIndex: 2, xPercent: 0, clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' })
        gsap.set(from, { zIndex: 1 })
        gsap
          .timeline({
            onComplete: () => {
              gsap.set(from, { visibility: 'hidden', xPercent: 0, clearProps: 'zIndex' })
              gsap.set(to, { clearProps: 'clipPath,zIndex' })
            },
          })
          .to(to, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'expo.inOut' }, 0)
          .to(from, { xPercent: -dir * 14, duration: 1.25, ease: 'expo.inOut' }, 0)
        playIn(to, 0.45)
      })
      // the slides run in a ring: the last leads on to the first, and the first back to the last
      const next = () => go((cur.current + 1) % SLIDES.length, 1)
      const prev = () => go((cur.current - 1 + SLIDES.length) % SLIDES.length, -1)
      nav.current = { go, next, prev }
      // the first wait only starts once the screen is actually on show (not behind the full-screen gate)
      holdIntro(arm(1.2))

      Observer.create({
        target: root.current,
        type: 'wheel,touch',
        wheelSpeed: -1,
        tolerance: 40,
        lockAxis: true,
        // wheel pages slides; touch pages only on horizontal swipes so phone panes still scroll
        onUp: (self) => self.event.type === 'wheel' && next(),
        onDown: (self) => self.event.type === 'wheel' && prev(),
        onLeft: (self) => self.event.type !== 'wheel' && next(),
        onRight: (self) => self.event.type !== 'wheel' && prev(),
      })

      const onKey = (e) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') next()
        else if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev()
      }
      window.addEventListener('keydown', onKey)
      return () => {
        window.removeEventListener('keydown', onKey)
        timer?.kill()
      }
    },
    { scope: root },
  )

  const dark = PAGER_TONE[idx] === 'dark'
  const pagerInk = dark ? 'text-ivory' : 'text-forest-900'
  const pagerSkin = dark ? 'border-ivory/15 bg-forest-950/40' : 'border-forest-900/15 bg-white/55'

  return (
    <section ref={root} className="screen bg-forest-950">
      {SLIDES.map(({ id, C }, i) => (
        <div key={id} data-slide data-defer={i ? '' : undefined} className="absolute inset-0 overflow-hidden">
          <C />
        </div>
      ))}

      {/* the slide controls: arrows either side of a mark per slide, the active one filling up with
          the time left before the next slide comes in on its own */}
      <div ref={pager} className={`absolute bottom-0 left-1/2 z-10 flex h-(--chrome-bot) -translate-x-1/2 items-center transition-colors duration-700 ${pagerInk}`}>
        <div role="group" aria-label="Overview slides" className={`flex items-center rounded-full border p-1 backdrop-blur-md transition-colors duration-700 ${pagerSkin}`}>
          <button onClick={() => nav.current.prev()} className="grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-300 hover:bg-current/10" aria-label="Previous slide">
            <Arrow flip />
          </button>
          <div className="flex items-center px-1">
            {SLIDES.map((s, i) => {
              const on = idx === i
              return (
                <button key={s.id} onClick={() => nav.current.go(i)} className="group flex items-center gap-2.5 px-2 py-2.5 sm:px-2.5" aria-label={`Show ${s.label}`} aria-current={on}>
                  <span className={`relative h-[3px] overflow-hidden rounded-full bg-current/25 transition-[width,background-color] duration-700 ${on ? 'w-9' : 'w-3 group-hover:bg-current/50'}`}>
                    {on && <span className="absolute inset-0 origin-left rounded-full bg-current" style={{ transform: 'scaleX(var(--p, 0))' }} />}
                  </span>
                  <span className={`label text-[max(0.58rem,9px)] transition-opacity duration-500 ${on ? '' : 'hidden opacity-60 group-hover:opacity-100 lg:inline'}`}>{s.label}</span>
                </button>
              )
            })}
          </div>
          <button onClick={() => nav.current.next()} className="grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-300 hover:bg-current/10" aria-label="Next slide">
            <Arrow />
          </button>
        </div>
      </div>
    </section>
  )
}
