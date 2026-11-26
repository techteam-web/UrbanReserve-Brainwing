import { useRef, useState } from 'react'
import { gsap, useGSAP, reduced } from '../gsap/gsapConfig'
import { useIntro } from '../hooks/useIntro'
import { useDeck } from '../hooks/useDeck'
import { DeckPager } from '../components/Deck'
import { OVERVIEW } from '../data/content'
import { Mark } from '../art/Brand'
import Botanical from '../art/Botanical'
import SunBirds from '../art/SunBirds'
import Terrain from '../art/Terrain'

const EMBOSS = 'text-paper-deep [filter:drop-shadow(1px_1px_0_rgb(255_255_255/0.95))_drop-shadow(-1px_-1px_0.5px_rgb(60_40_20/0.14))]'

function Breaker() {
  const b = OVERVIEW.breaker
  return (
    <div className="absolute inset-0 bg-paper text-forest-900">
      <div className="safe pane relative grid h-full items-center gap-[4vh] [align-content:safe_center] landscape:grid-cols-[1fr_1.05fr] landscape:gap-[4vw]">
        <div>
          <h2 className="display text-[clamp(2.6rem,min(9.5vh,7vw),7.5rem)] text-forest-800">
            {b.lines.map((l) => (
              <span key={l} data-in className="block">{l}</span>
            ))}
          </h2>
        </div>
        <div className="flex justify-center">
          <SunBirds className="w-[min(34vh,70vw)] landscape:w-[min(66vh,40vw)] [@media(max-height:32rem)]:w-[44vh]" />
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

// Three small squares of the palette, as Rustomjee sets beside its architects' pictures.
function Accents({ className = '' }) {
  return (
    <div aria-hidden="true" className={`flex gap-1.5 ${className}`}>
      <span className="size-[clamp(0.9rem,2vh,1.4rem)] bg-forest-700" />
      <span className="size-[clamp(0.9rem,2vh,1.4rem)] bg-ember" />
      <span className="size-[clamp(0.9rem,2vh,1.4rem)] bg-forest-950" />
    </div>
  )
}

// The architect, first page, as Rustomjee introduces theirs: his portrait large down the left, run
// off the edge of the screen; beside it his name and practice, a line of his own in large type, who
// he is to the project, and a project of his practice. Upright, the portrait comes first.
function Architect() {
  const a = OVERVIEW.architect
  return (
    // the portrait keeps its own upright shape: as tall as the room between the bars, as wide as that
    // makes it (up to 42% of the screen)
    <div className="absolute inset-0 bg-paper text-forest-900 [--pw:min(42vw,calc((100dvh-var(--chrome-top)-1vh-var(--chrome-bot))*0.671))]">
      <Botanical kind="fern" seed={11} depth={10} className={`bottom-[4vh] right-0 w-[16vw] -scale-x-100 ${EMBOSS}`} />
      {/* landscape: run off the left edge, between the bars */}
      <figure data-fade className="absolute top-[calc(var(--chrome-top)+1vh)] bottom-(--chrome-bot) left-0 hidden w-(--pw) landscape:block">
        <img src={a.image} alt={`${a.name}, ${a.role}`} className="size-full object-cover object-top" />
        <Accents className="absolute -right-[clamp(0.9rem,2vh,1.4rem)] bottom-[clamp(1rem,3vh,2rem)] flex-col" />
      </figure>

      <div className="safe pane relative flex h-full flex-col justify-center-safe landscape:pl-[calc(var(--pw)+clamp(2.5rem,5vw,6rem))]">
        {/* upright: first, in the flow */}
        <figure data-in className="relative mb-[4vh] aspect-[588/876] h-[36vh] shrink-0 self-start landscape:hidden">
          <img src={a.image} alt="" className="size-full object-cover object-top" />
          <Accents className="absolute -right-[clamp(0.9rem,2vh,1.4rem)] bottom-4 flex-col" />
        </figure>
        <div className="max-w-[42rem]">
          <p data-in className="label text-gold-deep">{a.eyebrow}</p>
          <h2 data-in className="display mt-[1.4vh] text-[clamp(2rem,5.6vh,4.2rem)] leading-[1.02] text-forest-800 [@media(max-height:32rem)]:text-[1.7rem]">
            {a.name}
          </h2>
          <p data-in className="label mt-[1.2vh] text-forest-900/60">{a.role}</p>

          <blockquote data-in className="relative mt-[clamp(1.6rem,3.4vh,2.6rem)] border-t border-forest-900/15 pt-[3vh] [@media(max-height:32rem)]:mt-5 [@media(max-height:32rem)]:pt-3">
            <span aria-hidden="true" className="absolute -top-[0.08em] left-0 -translate-y-1/2 bg-paper pr-3 font-display text-[clamp(2.6rem,6vh,4.4rem)] leading-none text-ember [@media(max-height:32rem)]:text-[2rem]">
              &ldquo;
            </span>
            <p className="display text-[clamp(1.35rem,3.4vh,2.5rem)] leading-[1.15] text-forest-800 [@media(max-height:32rem)]:text-[1.1rem]">{a.quote}</p>
          </blockquote>

          <p data-in className="mt-[2.6vh] text-[clamp(0.82rem,1.75vh,1.05rem)] leading-relaxed text-forest-900/75 [@media(max-height:32rem)]:hidden">
            {a.intro}
          </p>

          {/* a project of his practice */}
          <div data-in className="mt-[3.4vh] [@media(max-height:32rem)]:mt-3 flex items-center gap-[clamp(0.9rem,1.4vw,1.4rem)] bg-white/70 p-[clamp(0.5rem,1vh,0.75rem)] pr-[clamp(0.9rem,1.4vw,1.4rem)] shadow-[0_24px_50px_-36px_rgb(20_52_41/0.7)] ring-1 ring-forest-900/10">
            <img src={a.work.image} alt={`${a.work.name}, by KPA`} className="aspect-[4/3] h-[clamp(4.5rem,12vh,8.5rem)] w-auto shrink-0 object-cover [@media(max-height:32rem)]:h-[3.2rem]" />
            <div className="min-w-0">
              <p className="label text-ember-deep">{a.work.label}</p>
              <p className="display mt-1 text-[clamp(1rem,2.4vh,1.6rem)] leading-tight text-forest-800">{a.work.name}</p>
              <p className="mt-[0.8vh] text-[clamp(0.74rem,1.5vh,0.9rem)] leading-snug text-forest-900/65 [@media(max-height:32rem)]:hidden">{a.work.line}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// The architect, second page: his message whole, in his words, signed, with the four ideas it rests
// on numbered beneath; the two towers he describes run off the right edge (upright, above).
function Vision() {
  const v = OVERVIEW.vision
  const a = OVERVIEW.architect
  return (
    <div className="absolute inset-0 bg-paper text-forest-900">
      {/* landscape: run off the right edge, between the bars (a phone on its side gives the words the room) */}
      <figure data-fade className="absolute top-[calc(var(--chrome-top)+1vh)] right-0 bottom-(--chrome-bot) hidden w-[36vw] landscape:block [@media(max-height:32rem)]:hidden">
        <img src={v.image} alt="The two staggered towers of Urban Reserve over their forest, at dusk" className="size-full object-cover object-[55%_40%]" />
        <Accents className="absolute -left-[clamp(0.9rem,2vh,1.4rem)] bottom-[clamp(1rem,3vh,2rem)] flex-col" />
      </figure>

      <div className="safe pane relative flex h-full flex-col justify-center-safe landscape:pr-[calc(36vw+clamp(2.5rem,5vw,6rem))] [@media(max-height:32rem)]:pr-(--gutter)">
        {/* upright: first, in the flow */}
        <figure data-in className="relative mb-[4vh] h-[28vh] shrink-0 landscape:hidden">
          <img src={v.image} alt="" className="size-full object-cover object-[55%_40%]" />
          <Accents className="absolute -bottom-[clamp(0.9rem,2vh,1.4rem)] left-4" />
        </figure>
        <div className="max-w-[54rem] landscape:mx-auto [@media(max-height:32rem)]:max-w-none">
          <p data-in className="label text-gold-deep">{v.eyebrow}</p>
          <h2 data-in className="display mt-[1.4vh] text-[clamp(1.9rem,5.2vh,4rem)] leading-[1.02] text-forest-800 [@media(max-height:32rem)]:text-[1.6rem]">
            {v.title.map((t) => (
              <span key={t} className="block [@media(max-height:32rem)]:inline [@media(max-height:32rem)]:after:content-['_']">
                {t}
              </span>
            ))}
          </h2>
          <div className="mt-[2.6vh] columns-1 gap-[2.4vw] text-[clamp(0.8rem,1.7vh,1.02rem)] leading-relaxed text-forest-900/80 xl:columns-2 [@media(max-height:32rem)]:columns-2 [@media(max-height:32rem)]:text-[0.78rem] [@media(max-height:32rem)]:leading-snug [&>p]:mb-[1.4vh] [&>p]:break-inside-avoid">
            {v.message.map((m, i) => (
              <p key={m.slice(0, 24)} data-in className={i === 0 ? 'first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-[3.1em] first-letter:leading-[0.8] first-letter:text-ember' : ''}>
                {m}
              </p>
            ))}
          </div>

          <ol className="mt-[2.4vh] grid grid-cols-2 gap-x-[2vw] gap-y-[1.8vh] border-t border-forest-900/15 pt-[2.4vh] lg:grid-cols-4 [@media(max-height:32rem)]:hidden">
            {v.ideas.map((d, i) => (
              <li key={d.title} data-in>
                <span className="font-display text-[clamp(0.95rem,2vh,1.3rem)] text-ember">{String(i + 1).padStart(2, '0')}</span>
                <p className="display mt-[0.6vh] text-[clamp(0.95rem,2.1vh,1.35rem)] leading-tight text-forest-800">{d.title}</p>
                <p className="mt-[0.5vh] text-[clamp(0.72rem,1.45vh,0.88rem)] leading-snug text-forest-900/60">{d.line}</p>
              </li>
            ))}
          </ol>

          <div data-in className="mt-[2.8vh] border-l-2 border-gold pl-4 [@media(max-height:32rem)]:mt-1">
            <p className="display text-[clamp(1.1rem,2.6vh,1.8rem)] leading-tight text-forest-800 [@media(max-height:32rem)]:text-[1rem]">{a.name}</p>
            <p className="label mt-1 text-forest-900/60">{v.sign}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Landscape() {
  const l = OVERVIEW.landscape
  return (
    <div className="absolute inset-0 bg-forest-700 text-ivory">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_55%,#4d8070,transparent_60%),radial-gradient(ellipse_at_92%_100%,#173b30,transparent_50%)]" />
      <img src={l.texture} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-soft-light" />
      <Botanical kind="star" seed={9} depth={12} className="bottom-0 right-[2%] w-[44%] text-forest-400/55" />
      <div className="safe pane relative grid h-full grid-cols-[minmax(0,1fr)] items-center gap-[4vh] [align-content:safe_center] landscape:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] landscape:gap-[4vw] lg:pl-[8vw]">
        <div className="max-w-[38rem]">
          <h2 data-in className="display text-[clamp(1.6rem,min(6vh,8.6vw),4.6rem)] font-normal leading-[1.02]">
            {l.title.map((t) => (
              <span key={t} className="block">{t}</span>
            ))}
          </h2>
          <p data-in className="display mt-[1.6vh] text-[clamp(1.05rem,2.7vh,1.9rem)] text-balance text-gold-lit">{l.line}</p>
          <div className="mt-[3vh] space-y-[1.6vh] text-[clamp(0.82rem,1.75vh,1.05rem)] leading-relaxed text-ivory/80">
            {l.body.map((b) => (
              <p key={b.slice(0, 24)} data-in>{b}</p>
            ))}
          </div>
        </div>
        <img data-in src={l.image} alt="A sapling held in open hands" className="h-[min(22vh,40vw)] w-auto justify-self-center landscape:h-[min(50vh,30vw)] [@media(max-height:32rem)]:hidden" />
      </div>
    </div>
  )
}

// The landscape brief, The Sculpted Forest: the forest deck render across the screen, the name, the
// brief's line and one sentence, its two levels by name with a line each, and its sign-off. A green shade from the left
// (from the foot on a portrait screen) keeps the words clear.
function Forest() {
  const f = OVERVIEW.forest
  return (
    <div className="absolute inset-0 bg-forest-950 text-ivory">
      <img data-kb src={f.image} alt="A timber deck among the trees of the sculpted forest" className="absolute inset-0 h-full w-full object-cover will-change-transform" />
      <div className="absolute inset-0 bg-linear-to-t from-forest-950/95 via-forest-950/60 to-forest-950/10 landscape:bg-linear-to-r landscape:from-forest-950/90 landscape:via-forest-950/55 landscape:to-transparent" />
      <div className="safe pane relative flex h-full flex-col justify-end-safe pb-(--chrome-bot) landscape:max-w-[min(46rem,50%)] landscape:justify-center-safe">
        <h2 data-in className="display text-[clamp(2.4rem,7.5vh,6rem)] font-normal leading-[0.98]">
          {f.title.map((t) => (
            <span key={t} className="block">{t}</span>
          ))}
        </h2>
        <p data-in className="display mt-[1.6vh] text-[clamp(1.05rem,2.7vh,1.9rem)] text-gold-lit">{f.line}</p>
        <p data-in className="mt-[2.4vh] max-w-[34rem] text-[clamp(0.8rem,1.75vh,1rem)] leading-relaxed text-ivory/80 [@media(max-height:32rem)]:hidden">{f.body}</p>
        <dl className="mt-[3.4vh] flex gap-[3vw]">
          {f.levels.map((l) => (
            <div key={l.label} data-in className="max-w-[17rem] border-l border-gold/70 pl-4">
              <dt className="label text-ivory/60">{l.label}</dt>
              <dd className="font-display mt-1 text-[clamp(1.05rem,2.5vh,1.7rem)] leading-tight">{l.name}</dd>
              <dd className="mt-[1vh] text-[clamp(0.75rem,1.55vh,0.92rem)] leading-snug text-ivory/70 [@media(max-height:32rem)]:hidden">{l.about}</dd>
            </div>
          ))}
        </dl>
        <p data-in className="label mt-[3.4vh] text-ivory/70 [@media(max-height:32rem)]:hidden">{f.close}</p>
      </div>
    </div>
  )
}

// where down the render its edge colours were sampled (%), and the gradient they make
const EDGE_STOPS = [3, 20, 40, 60, 75, 85, 95]
const edgeGradient = (colors) => `linear-gradient(180deg, ${colors.map((c, i) => `${c} ${EDGE_STOPS[i]}%`).join(', ')})`

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
    // the render is the subject: 65% of the width beside the title on any landscape screen, below it
    // on a portrait one
    <div ref={ref} className="absolute inset-0 grid grid-rows-[auto_minmax(0,1fr)] bg-forest-900 text-ivory landscape:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] landscape:grid-rows-1">
      <div className="safe relative flex flex-col justify-center portrait:pb-[2vh] landscape:pr-[3vw]">
        <Botanical kind="leaf" seed={3} depth={12} className="bottom-0 left-[3vw] hidden w-[9vw] text-gold/15 lg:block" />
        <h2 data-in className="display mt-[2vh] text-[clamp(2.2rem,7vh,5.2rem)] font-normal">{b.title}</h2>
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
      {/* The renders are tall, so the whole tower stands at full height in the middle of the panel,
          nothing of it cropped, and the render's own sky and street run on out to the panel's edges:
          each side is a gradient of the colours down that edge of the picture, which fades into it. */}
      <div data-fade className="relative overflow-hidden">
        {b.views.map((v) => (
          <div key={v.id} data-view={v.id} className="invisible absolute inset-0">
            {v.surround === 'blur' ? (
              // an aerial is ground right to its edges: a soft, larger copy of it runs on to the panel's edges
              <img src={v.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-75" />
            ) : (
              <>
                <div className="absolute inset-y-0 left-0 w-1/2" style={{ background: edgeGradient(v.edges.left) }} />
                <div className="absolute inset-y-0 right-0 w-1/2" style={{ background: edgeGradient(v.edges.right) }} />
              </>
            )}
            <img
              src={v.image}
              alt={`Urban Reserve tower, ${v.label.toLowerCase()}`}
              className="absolute inset-0 h-full w-full object-contain object-bottom [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]"
            />
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 h-[16vh] bg-linear-to-t from-forest-950/45 to-transparent" />
        <Terrain side="right" seed={19} amp={65} className="absolute inset-y-0 left-0 hidden h-full w-[3vw] text-forest-900 landscape:block" />
      </div>
    </div>
  )
}

// The arrival lobby: the render as large as the screen allows, clear and still (no shade over it, no
// slow zoom), beside a slim panel only as wide as its heading; on a portrait screen the words sit in a
// strip below it. The render is nearly square, so a wide frame trims a little of the ceiling and the
// floor, keeping the chandelier and the lounge.
function Lobby() {
  const l = OVERVIEW.lobby
  return (
    <div className="absolute inset-0 grid grid-rows-[minmax(0,1fr)_auto] bg-sand text-ivory landscape:grid-cols-[minmax(0,1fr)_auto] landscape:grid-rows-1">
      <div data-fade className="relative overflow-hidden">
        <img src={l.image} alt="The arrival lobby" className="absolute inset-0 h-full w-full object-cover object-[50%_45%]" />
      </div>
      <div className="relative">
        <Terrain side="left" seed={51} amp={60} className="absolute inset-y-0 left-[-2.9vw] hidden h-full w-[3vw] text-sand landscape:block" />
        {/* beside the render it grows with the slim panel, kept short enough to stay under the words */}
        <Botanical kind="star" seed={4} depth={14} className="bottom-0 right-[-6vw] w-[30vw] max-w-none text-ivory/20 landscape:w-[min(116%,55vh)]" />
        {/* the strip below the render needs no room for the top bar, nor its fade, but its words stay
            above the watermark, which rides over the slide controls there */}
        <div className="safe pane relative flex h-full flex-col justify-center-safe pt-[4.5vh] portrait:pb-[calc(var(--chrome-bot)+var(--watermark-h)+0.75rem)] portrait:[mask-image:none] landscape:pt-(--chrome-top) landscape:pl-[3vw]">
          <h2 data-in className="display mt-[2vh] text-[clamp(2rem,6vh,4.4rem)] font-normal landscape:text-[clamp(1.75rem,5.2vh,4rem)]">
            {l.title.map((t) => (
              <span key={t} className="block">{t}</span>
            ))}
          </h2>
        </div>
      </div>
    </div>
  )
}

const SLIDES = [
  { id: 'living', label: 'Living', C: Breaker },
  { id: 'welcome', label: 'Welcome', C: Welcome },
  { id: 'architect', label: 'Architect', C: Architect },
  { id: 'vision', label: 'Vision', C: Vision },
  { id: 'landscape', label: 'Landscape', C: Landscape },
  { id: 'forest', label: 'Forest', C: Forest },
  { id: 'building', label: 'Building', C: Building },
  { id: 'lobby', label: 'Lobby', C: Lobby },
]
const PAGER_TONE = ['light', 'dark', 'light', 'light', 'dark', 'dark', 'dark', 'dark']
/**
 * The overview (Features, in the dock) as a run of slides. They can be paged with the controls just above the dock, the
 * arrow keys or a swipe (never the wheel); they only move when asked, and the last leads back round to the first.
 */
export default function Overview() {
  const root = useRef(null)
  useIntro(root)
  const { idx, nav } = useDeck(root, SLIDES.length)

  // the welcome's picture drifts slowly in and out
  useGSAP(
    () => {
      if (!reduced()) gsap.to('[data-kb]', { scale: 1.08, duration: 18, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    },
    { scope: root },
  )

  return (
    // the slides keep their words clear of the controls as well as the dock
    <section ref={root} className="screen bg-forest-950 [--chrome-bot:calc(var(--dock-band)+3.5rem)]">
      {SLIDES.map(({ id, C }, i) => (
        <div key={id} data-slide data-defer={i ? '' : undefined} className="absolute inset-0 overflow-hidden">
          <C />
        </div>
      ))}
      <DeckPager labels={SLIDES.map((s) => s.label)} idx={idx} nav={nav} dark={PAGER_TONE[idx] === 'dark'} label="Features slides" />
    </section>
  )
}
