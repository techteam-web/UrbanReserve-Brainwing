import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SECTIONS } from '../data/content'
import { Icon } from '../components/ui'
import { idFor, pathFor, useNav } from './nav'
import { playClick, playHover, preloadClick } from './sound'

const TABS = [{ id: 'landing', label: 'Home', icon: 'home' }, ...SECTIONS]
const COLS = { gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }

// whether the visitor has put the dock away, remembered on the device
const KEY = 'urban-reserve.dock'
const putAway = () => {
  try {
    return localStorage.getItem(KEY) === 'hidden'
  } catch {
    // no storage (a private window): it starts out
    return false
  }
}

// only a mouse with no button held ticks: a finger's tap passes over the button too, and has its
// click, and a drag turning a 360° view can sweep across the dock
const tick = (e) => e.pointerType === 'mouse' && !e.buttons && playHover()

function Chevron({ up = false }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
    </svg>
  )
}

/**
 * The way around the app: a bar along the foot of every screen with Home and each page, labelled on
 * desktops and tablets, icons only on phones. It sits above the page fade, so it never blinks, and lights the
 * tab for the new address at once while the page beneath is still changing. A page's tab returns to
 * the view it was left on (a tower, a floor, a comparison); pressing the tab of the page on show
 * takes it back to its start. The chevron at its end puts it away, below the screen, leaving a round
 * button in its place that brings it back.
 */
export default function Dock() {
  const { go, searchOf, warm } = useNav()
  const { pathname, search } = useLocation()
  const here = idFor(pathname)
  const at = TABS.findIndex((t) => t.id === here)
  const [hidden, setHidden] = useState(putAway)
  const hideButton = useRef(null)
  const showButton = useRef(null)
  // every button clicks, like the buttons on the Location page, and ticks as a mouse passes over it
  useEffect(() => {
    preloadClick()
  }, [])

  const open = (e, id) => {
    // a modified click opens the page in a new browser tab
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    playClick()
    if (id !== here) go(id, searchOf(id))
    else if (search) go(id)
  }

  const near = (e, id) => {
    warm(id)
    tick(e)
  }

  // the focus goes along to the button left showing, so the keyboard isn't stranded
  const putDock = (away) => {
    playClick()
    setHidden(away)
    try {
      localStorage.setItem(KEY, away ? 'hidden' : 'shown')
    } catch {
      // remembered for this visit only
    }
    requestAnimationFrame(() => (away ? showButton : hideButton).current?.focus({ preventScroll: true }))
  }

  const slide = 'transition-[translate,opacity] duration-700 ease-[cubic-bezier(.16,1,.3,1)]'
  const away = 'pointer-events-none translate-y-[calc(100%+var(--dock-lift)+1rem)] opacity-0'

  return (
    <>
      <nav
        id="dock"
        aria-label="Sections"
        inert={hidden}
        className={`dock fixed left-1/2 z-75 w-[min(calc(100vw-1rem),26rem)] -translate-x-1/2 rounded-[1.1rem] border border-ivory/10 bg-forest-950/75 p-1 text-ivory shadow-[0_24px_60px_-24px_rgb(0_0_0/0.8)] backdrop-blur-xl backdrop-saturate-150 roomy:w-[min(calc(100vw-2rem),46rem)] lg:w-auto ${slide} ${hidden ? away : ''}`}
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-gold/45 to-transparent" />
        <div className="flex">
          <div className="relative min-w-0 flex-1">
            {at >= 0 && (
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 transition-[translate] duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
                style={{ width: `${100 / TABS.length}%`, translate: `${at * 100}% 0` }}
              >
                <span className="absolute inset-0 rounded-[0.8rem] bg-ivory/[0.08]" />
              </span>
            )}
            <ul className="relative grid" style={COLS}>
              {TABS.map((t) => {
                const on = t.id === here
                return (
                  <li key={t.id}>
                    <a
                      href={pathFor(t.id) + (on ? '' : searchOf(t.id))}
                      onClick={(e) => open(e, t.id)}
                      onPointerEnter={(e) => near(e, t.id)}
                      onFocus={() => warm(t.id)}
                      aria-current={on ? 'page' : undefined}
                      title={t.label}
                      className={`group flex h-(--dock-item) flex-col items-center justify-center gap-[0.4rem] rounded-[0.8rem] outline-none transition-colors duration-300 focus-visible:ring-1 focus-visible:ring-gold-lit/70 lg:w-[7.5rem] ${on ? 'text-gold-lit' : 'text-ivory/60 hover:text-ivory'}`}
                    >
                      <Icon name={t.icon} className="size-[1.3rem] transition-transform duration-300 group-active:scale-90" />
                      <span className="sr-only text-[max(0.6rem,8.5px)] leading-none font-medium tracking-[0.06em] uppercase roomy:not-sr-only lg:not-sr-only">{t.label}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
          <span aria-hidden="true" className="mx-1 my-2.5 w-px shrink-0 bg-ivory/10" />
          <button
            ref={hideButton}
            type="button"
            onClick={() => putDock(true)}
            onPointerEnter={tick}
            aria-controls="dock"
            aria-expanded="true"
            aria-label="Hide the navigation"
            title="Hide the navigation"
            className="grid h-(--dock-item) w-[calc(var(--dock-item)*0.8)] shrink-0 place-items-center rounded-[0.8rem] text-ivory/60 outline-none transition-colors duration-300 hover:text-ivory focus-visible:ring-1 focus-visible:ring-gold-lit/70 active:scale-90"
          >
            <Chevron />
          </button>
        </div>
      </nav>

      <button
        ref={showButton}
        type="button"
        onClick={() => putDock(false)}
        onPointerEnter={tick}
        inert={!hidden}
        aria-controls="dock"
        aria-expanded="false"
        aria-label="Show the navigation"
        title="Show the navigation"
        className={`dock fixed left-1/2 z-75 grid size-[calc(var(--dock-item)+0.5rem+2px)] -translate-x-1/2 place-items-center rounded-full border border-ivory/10 bg-forest-950/75 text-gold-lit shadow-[0_24px_60px_-24px_rgb(0_0_0/0.8)] outline-none backdrop-blur-xl backdrop-saturate-150 hover:text-ivory focus-visible:ring-1 focus-visible:ring-gold-lit/70 ${slide} ${hidden ? '' : away}`}
      >
        <Chevron up />
      </button>
    </>
  )
}
