import { useRef, useState } from 'react'
import { gsap, useGSAP } from '../gsap/gsapConfig'
import { fullscreenSupported, isFullscreen, setCovered } from './gate'
import { filmEnded, filmPlays } from './opening'
import { INTRO } from '../data/content'
import logoSvg from '../brand/logo-main.svg?raw'

const [TURN_FROM, TURN_TO] = INTRO.turn

// the box around a set of elements, as one rect
function bounds(els) {
  const rs = [...els].map((e) => e.getBoundingClientRect())
  const left = Math.min(...rs.map((r) => r.left))
  const top = Math.min(...rs.map((r) => r.top))
  return { left, top, width: Math.max(...rs.map((r) => r.right)) - left, height: Math.max(...rs.map((r) => r.bottom)) - top }
}

/**
 * The intro film, silent. It starts as the app goes full screen, or at once where there is no full
 * screen to enter (phones). Where the forest turns into the towers the screen darkens and softens,
 * and the main logo (src/brand/logo-main.svg) draws itself in gold, its outline from 0 to 100% and
 * then filled, so the turn happens behind it. The film's last shot is Home's picture: when it ends
 * it settles under Home's shade, framed as Home frames it, while the logo's words fall away and its
 * mark flies to Home's mark, shrinking into it, and Home comes up around it as if the film had
 * stopped on it. The logo keeps to the film's own clock, so a stall while it loads holds the logo too.
 */
export default function Intro() {
  const [on, setOn] = useState(filmPlays)
  const done = () => {
    filmEnded()
    setOn(false)
  }
  return on ? <Film onDone={done} /> : null
}

function Film({ onDone }) {
  const root = useRef(null)
  const film = useRef(null)
  const logo = useRef(null)
  const skip = useRef(() => {})
  const [begun, setBegun] = useState(false)

  useGSAP(
    (context, contextSafe) => {
      const v = film.current
      const svg = logo.current.querySelector('svg')
      const parts = svg.querySelectorAll('[data-part]')
      const mark = svg.querySelector('[data-part="mark"]')
      const words = svg.querySelectorAll('[data-part]:not([data-part="mark"])')
      let started = false
      let leaving = false
      // a torn-down film (React's dev double-run) must not send the visitor on
      let live = true

      // the logo is drawn as a fine outline, about a pixel wide whatever its size, before it fills
      const perPixel = svg.viewBox.baseVal.width / svg.getBoundingClientRect().width
      gsap.set(parts, { attr: { stroke: 'currentColor', 'stroke-width': 1.1 * perPixel }, fillOpacity: 0 })

      // positions are seconds into the film
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(v, { scale: 1 }, { scale: 1.04, duration: 4, ease: 'none' }, 0)
        // as the leaves part the forest darkens and softens, so the turn to the towers goes unseen ...
        .to('[data-veil]', { opacity: 0.88, duration: 0.45, ease: 'sine.inOut' }, TURN_FROM - 0.5)
        .fromTo(v, { filter: 'blur(0px)' }, { filter: 'blur(10px)', duration: 0.4, ease: 'sine.inOut' }, TURN_FROM - 0.45)
        // ... while the logo draws itself through it, mark first, then the name and the tagline ...
        .fromTo(parts, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, stagger: { amount: 0.3 }, ease: 'power2.inOut' }, TURN_FROM - 0.45)
        .fromTo(logo.current, { scale: 0.94 }, { scale: 1, duration: 1.6, ease: 'power2.out' }, TURN_FROM - 0.45)
        // ... then the towers come through and the logo fills in gold over them
        .to('[data-veil]', { opacity: 0.3, duration: 0.7, ease: 'sine.inOut' }, TURN_TO)
        .to(v, { filter: 'blur(0px)', duration: 0.5, ease: 'sine.inOut' }, TURN_TO)
        .to(parts, { fillOpacity: 1, duration: 0.6, ease: 'sine.inOut' }, TURN_TO - 0.15)
        .to('[data-glow]', { opacity: 1, duration: 0.7, ease: 'sine.inOut' }, TURN_TO)
        .to(parts, { strokeOpacity: 0, duration: 0.4, ease: 'sine.inOut' }, TURN_TO + 0.25)
      const sync = () => tl.time(Math.min(v.currentTime, tl.duration()))
      gsap.ticker.add(sync)

      // the film fades into Home, whose entrance plays as it goes
      const leave = contextSafe((wait, fade) => {
        if (leaving || !live) return
        leaving = true
        gsap
          .timeline({ delay: wait, onComplete: onDone })
          .call(() => setCovered('intro', false))
          .to(root.current, { autoAlpha: 0, duration: fade, ease: 'sine.inOut' })
      })
      // skipping stops the film at once: still decoding, it can starve the fade on a slow device
      skip.current = () => {
        v.pause()
        leave(0, 0.6)
      }
      const fail = () => leave(0, 0.6)

      // At the end the film settles under Home's shade, the name and tagline fall away, and the mark
      // flies to Home's mark, taking its size and colour. Home then comes up around it, its picture
      // and its own mark already in place underneath, so the hand-over doesn't show.
      const end = contextSafe(() => {
        const home = document.querySelector('[data-home-mark] svg')
        // nowhere on screen to land (a short phone scrolled away from it): a plain fade
        const to = home && bounds(home.querySelectorAll('path'))
        if (!to || to.top < 0 || to.top + to.height > innerHeight) return leave(0.6, 1)
        if (leaving || !live) return
        leaving = true
        gsap.ticker.remove(sync)
        // the logo moves and scales from its top left corner so that its mark covers Home's: the two
        // marks are drawn apart (one traced), so they are matched by their centres and overall size
        const from = mark.getBoundingClientRect()
        const box = logo.current.getBoundingClientRect()
        const k = Math.sqrt((to.width / from.width) * (to.height / from.height))
        const x = to.left + to.width / 2 - (box.left + k * (from.left + from.width / 2 - box.left))
        const y = to.top + to.height / 2 - (box.top + k * (from.top + from.height / 2 - box.top))
        gsap
          .timeline({ onComplete: onDone })
          .to('[data-skip]', { autoAlpha: 0, duration: 0.3, ease: 'sine.inOut' }, 0)
          .to('[data-veil], [data-vignette]', { opacity: 0, duration: 0.9, ease: 'sine.inOut' }, 0)
          .to('[data-shade]', { opacity: 1, duration: 0.9, ease: 'sine.inOut' }, 0)
          .to('[data-glow]', { opacity: 0, duration: 0.6, ease: 'sine.inOut' }, 0)
          .to(words, { fillOpacity: 0, duration: 0.5, ease: 'sine.inOut' }, 0.15)
          .set(logo.current, { transformOrigin: '0 0' }, 0)
          .to(logo.current, { x, y, scale: k, color: getComputedStyle(home).color, duration: 1.2, ease: 'power3.inOut' }, 0.3)
          // its shadow is lost against the shade by now
          .set(logo.current, { filter: 'none' }, 0.9)
          .call(() => setCovered('intro', false), null, 1.5)
          .to(root.current, { autoAlpha: 0, duration: 0.9, ease: 'sine.inOut' }, 1.5)
      })

      const start = contextSafe(() => {
        if (started) return
        started = true
        setBegun(true)
        v.muted = true
        // a phone saving power refuses even silent play: on to Home. A play cut short by a pause
        // (the gate coming back) is no failure.
        v.play().catch((e) => e.name !== 'AbortError' && fail())
        // a film that never arrives doesn't keep the visitor waiting
        gsap.delayedCall(8, () => v.currentTime < 0.05 && fail())
      })

      // it waits behind the full-screen gate, and again if the visitor leaves full screen
      const onScreen = () => {
        if (!isFullscreen()) v.pause()
        else if (!started) start()
        else if (!leaving && !v.ended) v.play().catch(() => {})
      }
      const onKey = (e) => {
        if (!started || leaving || e.key !== 'Escape') return
        e.preventDefault()
        skip.current()
      }

      if (!fullscreenSupported() || isFullscreen()) start()
      document.addEventListener('fullscreenchange', onScreen)
      document.addEventListener('webkitfullscreenchange', onScreen)
      window.addEventListener('keydown', onKey)
      v.addEventListener('ended', end)
      v.addEventListener('error', fail)

      return () => {
        live = false
        gsap.ticker.remove(sync)
        document.removeEventListener('fullscreenchange', onScreen)
        document.removeEventListener('webkitfullscreenchange', onScreen)
        window.removeEventListener('keydown', onKey)
        v.removeEventListener('ended', end)
        v.removeEventListener('error', fail)
        v.pause()
      }
    },
    { scope: root },
  )

  return (
    <section ref={root} aria-label="Intro film" className="fixed inset-0 z-85 overflow-hidden bg-forest-950 text-ivory">
      <video ref={film} src={INTRO.film} poster={INTRO.poster} preload="auto" muted playsInline aria-hidden="true" className="home-frame absolute inset-0 h-full w-full" />
      {/* the film's edges sink a little into the forest; the veil hides its turn; Home's shade comes
          over the last shot */}
      <div data-vignette className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_45%,rgb(13_35_29/0.6)_100%)]" />
      <div data-veil className="absolute inset-0 bg-forest-950 opacity-0" />
      <div data-shade className="home-shade absolute inset-0 opacity-0" />
      {/* a soft shade behind the logo keeps its finer letters clear of the bright sky */}
      <div data-glow className="absolute inset-0 bg-[radial-gradient(ellipse_42%_36%_at_50%_47%,rgb(13_35_29/0.5),transparent)] opacity-0" />

      <div className="absolute inset-0 grid place-items-center px-6 pb-[4vh]">
        <span
          ref={logo}
          data-brand
          role="img"
          aria-label="Urban Reserve, Naturally Elevated Living"
          className="block w-[min(84vw,26rem)] text-gold-lit [filter:drop-shadow(0_6px_30px_rgb(0_0_0/0.45))] lg:w-[min(44vw,62vh)]"
          dangerouslySetInnerHTML={{ __html: logoSvg }}
        />
      </div>

      <div data-skip className={`absolute inset-x-0 bottom-0 flex h-(--dock-band) items-center justify-end px-(--gutter) transition-opacity duration-700 ${begun ? '' : 'pointer-events-none opacity-0'}`}>
        <button
          onClick={() => skip.current()}
          className="label flex items-center gap-2.5 rounded-full border border-ivory/25 bg-forest-950/35 px-4 py-2.5 text-ivory/85 backdrop-blur-md transition-colors duration-300 hover:border-ivory/60 hover:text-ivory"
        >
          Skip intro
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  )
}
