import { useCallback, useEffect, useRef, useState } from 'react'
import { Observer } from 'gsap/Observer'
import { CustomEase } from 'gsap/CustomEase'
import { gsap, useGSAP, reduced } from '../gsap/gsapConfig'
import { useIntro, playIn } from '../hooks/useIntro'
import { useNav } from '../app/nav'
import { decodeImages } from '../app/decode'
import { AMENITIES, AMENITY_LEVELS, AMENITY_RENDERS } from '../data/content'
import { Icon, Segmented } from '../components/ui'

gsap.registerPlugin(Observer)
// the Rivali app's slide ease: quick off the mark, a long soft landing
CustomEase.create('hop', 'M0,0 C0.083,0.294 0.117,0.767 0.413,0.908 0.606,1 0.752,1 1,1')

/*
 * Amenities as the Rivali Park app shows its clubs: the page opens straight onto the renders, one to
 * the screen, the newest first, wiping up from one to the next. The Amenities button by the sound
 * switch opens the levels' plans, a point on each place there is a render of; a point opens the
 * renders on it. Each view is its own address, so Back, a reload and the dock's tab return to it:
 *   /amenities?see=3          the renders, on the fourth
 *   /amenities?level=ground   a level's plan
 * The dock goes out of the way on this page (see Dock).
 */
const LEVELS = AMENITY_LEVELS.filter((l) => l.plan)

function read(search) {
  const q = new URLSearchParams(search)
  const level = LEVELS.find((l) => l.id === q.get('level')) ?? null
  const n = Number(q.get('see'))
  const see = Number.isInteger(n) && AMENITY_RENDERS[n] ? n : 0
  return { level, see }
}
const indexOf = (image) => Math.max(0, AMENITY_RENDERS.findIndex((r) => r.image === image))

// A picture fitting inside its frame in its own shape, so points set in % of the picture stay on
// their spots at any size. Its frame must be a size container.
function Stage({ aspect, className = '', children }) {
  return (
    <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${className}`} style={{ width: `min(100cqw, 100cqh * ${aspect})`, aspectRatio: aspect }}>
      {children}
    </div>
  )
}

const Plus = () => (
  <svg viewBox="0 0 12 12" className="size-[55%]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M6 2.5v7M2.5 6h7" />
  </svg>
)

// An orange point breathing softly: a soft ring swells out of it and fades
function Dot({ className = '' }) {
  return (
    <span className={`relative grid place-items-center ${className}`}>
      <span className="spot-pulse absolute inset-0 rounded-full bg-ember/45" />
      <span className="relative grid size-[62%] place-items-center rounded-full bg-ember text-ivory shadow-[0_2px_8px_rgb(13_35_29/0.45)] ring-2 ring-ivory transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110">
        <Plus />
      </span>
    </span>
  )
}

// A glass pill over a picture
function GlassButton({ className = '', children, ...rest }) {
  return (
    <button
      {...rest}
      className={`label flex h-10 items-center gap-2.5 rounded-full border border-ivory/25 bg-forest-950/50 px-4 text-[max(0.6rem,9px)] tracking-[0.18em] text-ivory backdrop-blur-md transition-colors duration-300 hover:border-ivory/70 hover:bg-forest-950/75 active:scale-95 sm:px-5 ${className}`}
    >
      {children}
    </button>
  )
}

// beside the sound switch, in the top row
const TOP_LEFT = 'absolute left-[calc(var(--gutter)+3.25rem)] top-[calc((var(--chrome-top)-2.5rem)/2)] z-[4]'

/* ---------- the renders ---------- */

const Arrow = ({ flip = false }) => (
  <svg viewBox="0 0 24 24" className={`size-4 ${flip ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
const two = (n) => String(n).padStart(2, '0')
const ROUND = 'grid size-11 place-items-center rounded-full border border-ivory/30 bg-forest-950/40 backdrop-blur-md transition-colors duration-300 hover:border-ivory/70 active:scale-95'

function Slides({ start, onPlans, onShow }) {
  const ref = useRef(null)
  const cur = useRef(start)
  const busy = useRef(false)
  const [idx, setIdx] = useState(start)
  const photos = AMENITY_RENDERS
  const nav = useRef({ next: () => {}, prev: () => {} })

  useGSAP(
    (context, contextSafe) => {
      const slides = gsap.utils.toArray('[data-slide]')
      slides.forEach((s, i) => gsap.set(s, { autoAlpha: i === cur.current ? 1 : 0, zIndex: i === cur.current ? 1 : 0 }))
      const pic = (s) => s.querySelector('[data-pic]')

      const go = contextSafe((n, dir) => {
        if (busy.current || n === cur.current) return
        const from = slides[cur.current]
        const to = slides[n]
        cur.current = n
        setIdx(n)
        onShow(n)
        if (reduced()) {
          gsap.set(from, { autoAlpha: 0, zIndex: 0 })
          gsap.set(to, { autoAlpha: 1, zIndex: 1 })
          return
        }
        busy.current = true
        const full = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
        const foot = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)'
        const tl = gsap.timeline({
          defaults: { duration: 1.5, ease: 'hop' },
          onComplete: () => {
            gsap.set(from, { autoAlpha: 0, zIndex: 0, clearProps: 'clipPath' })
            gsap.set(to, { zIndex: 1, clearProps: 'clipPath' })
            gsap.set([pic(from), pic(to)], { yPercent: 0 })
            busy.current = false
          },
        })
        if (dir > 0) {
          // the next one rises over this one from the foot of the screen
          gsap.set(to, { autoAlpha: 1, zIndex: 2, clipPath: foot })
          gsap.set(from, { zIndex: 1 })
          tl.fromTo(pic(to), { yPercent: 30 }, { yPercent: 0 }, 0)
            .to(pic(from), { yPercent: -30 }, 0)
            .to(to, { clipPath: full }, 0)
        } else {
          // the one before is uncovered as this one sinks away to the foot
          gsap.set(to, { autoAlpha: 1, zIndex: 1 })
          gsap.set(from, { zIndex: 2, clipPath: full })
          tl.fromTo(pic(to), { yPercent: -30 }, { yPercent: 0 }, 0)
            .to(pic(from), { yPercent: 30 }, 0)
            .to(from, { clipPath: foot }, 0)
        }
        // the name trades places as the picture turns over
        tl.fromTo('[data-name]', { y: 0, autoAlpha: 1 }, { y: -18, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 0).fromTo(
          '[data-name]',
          { y: 18, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', immediateRender: false },
          0.5,
        )
      })
      const next = () => go((cur.current + 1) % photos.length, 1)
      const prev = () => go((cur.current - 1 + photos.length) % photos.length, -1)
      nav.current = { next, prev }

      // a turn of the wheel, a swipe or the arrow keys move on, one picture at a time
      let wheelAt = 0
      const el = ref.current
      const onWheel = (e) => {
        const now = performance.now()
        if (Math.abs(e.deltaY) < 8 || now - wheelAt < 900) return
        wheelAt = now
        if (e.deltaY > 0) next()
        else prev()
      }
      el.addEventListener('wheel', onWheel, { passive: true })
      Observer.create({ target: el, type: 'touch', tolerance: 40, onUp: next, onDown: prev, onLeft: next, onRight: prev })
      const onKey = (e) => {
        if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) next()
        else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) prev()
      }
      window.addEventListener('keydown', onKey)
      return () => {
        window.removeEventListener('keydown', onKey)
        el.removeEventListener('wheel', onWheel)
      }
    },
    { scope: ref },
  )

  // the pictures either side of the one on show start on their way
  useEffect(() => {
    decodeImages([1, 2, -1].map((d) => photos[(idx + d + photos.length) % photos.length].image))
  }, [idx, photos])

  const p = photos[idx]
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-forest-950 text-ivory">
      <div data-stage className="absolute inset-0">
        {photos.map((ph, i) => (
          <div key={ph.image} data-slide className="invisible absolute inset-0 overflow-hidden">
            <img data-pic src={ph.image} alt={ph.label} fetchPriority={i === start ? 'high' : 'low'} decoding="async" className="absolute inset-0 size-full object-cover will-change-transform" />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[max(42vh,15rem)] bg-linear-to-t from-forest-950/90 via-forest-950/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-[22vh] bg-linear-to-b from-forest-950/55 to-transparent" />

      <div className={TOP_LEFT}>
        <GlassButton data-in onClick={() => onPlans(p.level)} aria-label="Amenities: the levels' plans">
          <Icon name="pool" className="size-4" />
          <span className="max-sm:sr-only">{AMENITIES.title}</span>
        </GlassButton>
      </div>
      <p data-in className="label absolute right-(--gutter) top-[calc(var(--chrome-top)/2)] z-[4] -translate-y-1/2 text-[max(0.55rem,8.5px)] tracking-[0.2em] text-ivory/70 max-sm:hidden">
        Artist’s impression
      </p>

      <div className="absolute inset-x-(--gutter) bottom-(--chrome-bot) z-[4] mb-[calc(var(--watermark-h)+0.5rem)] flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div data-in className="min-w-0">
          <p data-name className="label text-[max(0.58rem,9px)] tracking-[0.2em] text-ivory/65">
            {p.where} <span className="text-ivory/35">·</span> {p.heading}
          </p>
          <h2 data-name className="display mt-[1vh] text-[clamp(1.7rem,min(6vh,9vw),4.4rem)] font-normal leading-[1.02]">
            {p.label}
          </h2>
        </div>
        <div data-in className="flex items-center gap-4">
          <p className="label tabular-nums text-[max(0.6rem,9px)] tracking-[0.2em]" aria-live="polite">
            {two(idx + 1)} <span className="text-ivory/45">/ {two(photos.length)}</span>
          </p>
          <span className="relative h-0.5 w-[clamp(4rem,9vw,8rem)] bg-ivory/20" aria-hidden="true">
            <span className="absolute inset-y-0 left-0 bg-ember transition-[width] duration-700" style={{ width: `${((idx + 1) / photos.length) * 100}%` }} />
          </span>
          <div className="flex gap-2">
            <button onClick={() => nav.current.prev()} aria-label="The one before" className={ROUND}>
              <Arrow flip />
            </button>
            <button onClick={() => nav.current.next()} aria-label="The next one" className={ROUND}>
              <Arrow />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- the levels' plans ---------- */

// A place on the plan with a render to open; its name shows above it on hover or focus
function Spot({ photo, onOpen }) {
  const [x, y] = photo.at
  return (
    <button
      data-pop
      onClick={onOpen}
      style={{ left: `${x}%`, top: `${y}%` }}
      className="group absolute z-[1] size-[clamp(1.7rem,3.6vh,2.4rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
      aria-label={`See the ${photo.label.toLowerCase()}`}
    >
      <Dot className="size-full" />
      <span className={`label pointer-events-none absolute bottom-full mb-1.5 -translate-y-1 ${x > 72 ? 'right-0' : x < 28 ? 'left-0' : 'left-1/2 -translate-x-1/2'} whitespace-nowrap rounded-full bg-forest-950/85 px-2.5 py-1 text-[max(0.58rem,9px)] text-ivory opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 roomy:pointer-coarse:translate-y-0 roomy:pointer-coarse:opacity-100 lg:pointer-coarse:translate-y-0 lg:pointer-coarse:opacity-100`}>
        {photo.label}
      </span>
    </button>
  )
}

function Plans({ level, onLevel, onBack, onSee }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-paper text-forest-900">
      <div className={TOP_LEFT}>
        <button
          data-in
          onClick={onBack}
          className="label flex h-10 items-center gap-2.5 rounded-full border border-forest-900/25 bg-white/60 px-4 text-[max(0.6rem,9px)] tracking-[0.18em] transition-colors duration-300 hover:border-forest-900 hover:bg-forest-900 hover:text-ivory active:scale-95 sm:px-5"
        >
          <span aria-hidden="true">←</span> <span className="max-sm:sr-only">Renders</span>
        </button>
      </div>

      {/* the level switch and heading along the top, or down the left on a short screen (a phone on its side) */}
      <div className="absolute inset-x-(--gutter) top-(--chrome-top) flex flex-wrap items-center gap-x-6 gap-y-2 [@media(max-height:32rem)]:right-auto [@media(max-height:32rem)]:top-[calc(var(--chrome-top)+0.25rem)] [@media(max-height:32rem)]:w-[11rem] [@media(max-height:32rem)]:flex-col [@media(max-height:32rem)]:items-start [@media(max-height:32rem)]:gap-y-3">
        <div data-in className="w-[13rem] max-w-full">
          <Segmented items={LEVELS.map((l) => ({ id: l.id, label: l.label, short: l.label.replace(/ Level$/, '') }))} value={level.id} onChange={(id) => onLevel(LEVELS.find((l) => l.id === id))} size="sm" />
        </div>
        <p data-in className="flex items-baseline gap-3 [@media(max-height:32rem)]:flex-col [@media(max-height:32rem)]:gap-1">
          <span className="display text-[clamp(1.4rem,3.8vh,2.6rem)] text-forest-800">{level.heading}</span>
          <span className="label text-[max(0.55rem,8.5px)] tracking-[0.2em] text-ink/55 max-md:hidden">Tap a point to see it</span>
        </p>
      </div>
      {/* the plan as large as the space under the heading allows */}
      <div className="absolute inset-x-(--gutter) top-[calc(var(--chrome-top)+clamp(3.4rem,8vh,4.75rem))] bottom-[calc(var(--chrome-bot)+0.5rem)] @container-size max-sm:top-[calc(var(--chrome-top)+6.5rem)] [@media(max-height:32rem)]:bottom-[calc(var(--dock-band)+0.25rem)] [@media(max-height:32rem)]:left-[calc(var(--gutter)+12rem)] [@media(max-height:32rem)]:top-[calc(var(--chrome-top)-0.4rem)]">
        <div data-stage className="absolute inset-0">
          {/* the plan as the brochure prints it, on a card of its own */}
          <Stage aspect={level.aspect} className="rounded-[1.1rem] bg-white shadow-[0_40px_80px_-46px_rgb(20_52_41/0.6)] ring-1 ring-forest-900/10">
            <img src={level.plan} alt={`${level.label} plan`} className="absolute inset-0 size-full rounded-[1.1rem]" />
            {level.photos.map((p) => p.at && <Spot key={p.image} photo={p} onOpen={() => onSee(indexOf(p.image))} />)}
          </Stage>
        </div>
      </div>
    </div>
  )
}

/* ---------- the page ---------- */

// A view's entrance: the picture comes into focus and its points pop up
function enter(el, tl, at = 0) {
  if (!el || reduced()) return
  const stage = el.querySelector('[data-stage]')
  if (stage) tl.fromTo(stage, { autoAlpha: 0, scale: 1.03, filter: 'blur(8px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 1.3, ease: 'power2.out', clearProps: 'filter,transform' }, at)
  const pops = el.querySelectorAll('[data-pop]')
  if (pops.length) tl.fromTo(pops, { scale: 0.55, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, ease: 'power3.out', stagger: 0.06, clearProps: 'transform' }, at + 0.55)
}

export default function Amenities() {
  const root = useRef(null)
  const step = useRef(null)
  const first = useRef(true)
  const leaving = useRef(false)
  const { shown, go } = useNav()
  const { level, see } = read(shown.search)
  // the render the slideshow was on, for coming back to it from the plans
  const lastSee = useRef(see)
  useEffect(() => {
    if (!level) lastSee.current = see
  }, [level, see])
  const key = level ? 'plans' : 'renders'

  useIntro(root, (tl) => enter(step.current, tl))

  // a later view plays its own entrance (the first one's is the page's, above)
  useGSAP(
    () => {
      if (first.current) {
        first.current = false
        return
      }
      leaving.current = false
      const tl = gsap.timeline()
      enter(step.current, tl)
      tl.add(playIn(step.current), 0.2)
    },
    { scope: root, dependencies: [key] },
  )

  // leaving a view: it blurs away, then the address moves on
  const leaveTo = useCallback(
    (search) => {
      if (leaving.current) return
      if (reduced() || !step.current) return go('amenities', search)
      leaving.current = true
      gsap.to(step.current, {
        autoAlpha: 0,
        scale: 1.04,
        filter: 'blur(8px)',
        duration: 0.6,
        ease: 'power2.inOut',
        // the next view is a new element (keyed), so this one's styles go with it
        onComplete: () => go('amenities', search),
      })
    },
    [go],
  )
  const toRenders = useCallback((n) => leaveTo(n ? `?see=${n}` : ''), [leaveTo])

  // Esc goes back from the plans to the renders; from the renders it leaves as on any page
  useEffect(() => {
    if (!level) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopImmediatePropagation()
      toRenders(lastSee.current)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [level, toRenders])

  // the plans start on their way from the renders
  useEffect(() => {
    if (!level) decodeImages(LEVELS.map((l) => l.plan))
  }, [level])

  return (
    <section ref={root} className="screen bg-forest-950">
      <div key={key} ref={step} className="absolute inset-0">
        {level ? (
          <Plans level={level} onLevel={(l) => go('amenities', `?level=${l.id}`, { replace: true })} onBack={() => toRenders(lastSee.current)} onSee={toRenders} />
        ) : (
          <Slides start={see} onPlans={(id) => leaveTo(`?level=${id}`)} onShow={(n) => go('amenities', n ? `?see=${n}` : '', { replace: true })} />
        )}
      </div>
    </section>
  )
}
