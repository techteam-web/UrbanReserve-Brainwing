import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SECTIONS } from '../data/content'
import { Icon } from '../components/ui'
import { idFor, pathFor, useNav } from './nav'
import { covered, watchCovers } from './gate'
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

// with a mouse the dock tucks itself away once it has been left alone this long on a screen in view,
// and rises again when the pointer comes down to its place; on touch screens it stays
const REST = 3000
const SLACK = 16

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
 * button in its place that brings it back. With a mouse it also sleeps a few seconds after the
 * pointer leaves its place, leaving a faint handle, and wakes when the pointer or the keyboard comes
 * back to it.
 */
export default function Dock() {
  const { go, searchOf, warm } = useNav()
  const { pathname, search } = useLocation()
  const here = idFor(pathname)
  const at = TABS.findIndex((t) => t.id === here)
  const [hidden, setHidden] = useState(putAway)
  const [asleep, setAsleep] = useState(false)
  const bar = useRef(null)
  const hideButton = useRef(null)
  const showButton = useRef(null)
  // every button clicks, like the buttons on the Location page, and ticks as a mouse passes over it
  useEffect(() => {
    preloadClick()
  }, [])

  useEffect(() => {
    const el = bar.current
    const mouse = matchMedia('(hover: hover) and (pointer: fine)')
    let timer = 0
    let over = false
    let focused = false
    let zone = null
    // its place: its own width and a little, the whole height of the strip it sits in (sliding away
    // moves it down, not across, so the box still gives its width)
    const measure = () => {
      const r = el.getBoundingClientRect()
      const lift = parseFloat(getComputedStyle(el).bottom) || 0
      zone = { left: r.left - SLACK, right: r.right + SLACK, top: innerHeight - r.height - 2 * lift }
    }
    const rest = () => {
      clearTimeout(timer)
      if (mouse.matches && !over && !focused && !covered()) timer = setTimeout(() => setAsleep(true), REST)
    }
    const wake = () => {
      clearTimeout(timer)
      setAsleep(false)
    }
    // a held button is a drag (turning a 360° view), which doesn't call the dock up
    const move = (e) => {
      if (e.pointerType !== 'mouse' || e.buttons) return
      if (!zone) measure()
      const inside = e.clientY >= zone.top && e.clientX >= zone.left && e.clientX <= zone.right
      if (inside === over) return
      over = inside
      if (over) wake()
      else rest()
    }
    // only the keyboard's focus holds it up: a clicked tab keeps the focus after the mouse has gone
    const focusIn = (e) => {
      if (!e.target.matches(':focus-visible')) return
      focused = true
      wake()
    }
    const focusOut = (e) => {
      if (!focused || el.contains(e.relatedTarget)) return
      focused = false
      rest()
    }
    const changed = () => (mouse.matches ? rest() : wake())
    const sized = new ResizeObserver(measure)
    sized.observe(el)
    addEventListener('resize', measure)
    addEventListener('pointermove', move, { passive: true })
    el.addEventListener('focusin', focusIn)
    el.addEventListener('focusout', focusOut)
    mouse.addEventListener('change', changed)
    // the rest counts from when the screen is in view: after the film, the fullscreen gate, a fade
    const unwatch = watchCovers(() => (covered() ? clearTimeout(timer) : rest()))
    rest()
    return () => {
      clearTimeout(timer)
      sized.disconnect()
      removeEventListener('resize', measure)
      removeEventListener('pointermove', move)
      el.removeEventListener('focusin', focusIn)
      el.removeEventListener('focusout', focusOut)
      mouse.removeEventListener('change', changed)
      unwatch()
    }
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
      {/* asleep it stays in the tab order, so the keyboard can still reach it and wake it */}
      <nav
        ref={bar}
        id="dock"
        aria-label="Sections"
        inert={hidden}
        className={`dock fixed left-1/2 z-75 w-[min(calc(100vw-1rem),26rem)] -translate-x-1/2 rounded-[1.1rem] border border-ivory/10 bg-forest-950/75 p-1 text-ivory shadow-[0_24px_60px_-24px_rgb(0_0_0/0.8)] backdrop-blur-xl backdrop-saturate-150 roomy:w-[min(calc(100vw-2rem),46rem)] lg:w-auto ${slide} ${hidden || asleep ? away : ''}`}
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

      {/* while it sleeps, a faint handle marks where it went; light on the dark screens, ringed for the ivory ones */}
      <span
        aria-hidden="true"
        className={`pointer-events-none fixed bottom-3 left-1/2 z-75 h-1 w-10 -translate-x-1/2 rounded-full bg-ivory/45 shadow-[0_0_0_1px_rgb(13_35_29/0.3)] transition-opacity duration-700 ${asleep && !hidden ? 'opacity-100 delay-300' : 'opacity-0'}`}
      />

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
