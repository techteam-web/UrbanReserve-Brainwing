import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SECTIONS } from '../data/content'
import { Icon } from '../components/ui'
import { idFor, pathFor, useNav } from './nav'
import { playClick, preloadClick } from './sound'

const TABS = [{ id: 'landing', label: 'Home', icon: 'home' }, ...SECTIONS]
const COLS = { gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }

/**
 * The way around the app: a bar along the foot of every screen with Home and each page, labelled on
 * desktops and tablets, icons only on phones. It sits above the page fade, so it never blinks, and lights the
 * tab for the new address at once while the page beneath is still changing. A page's tab returns to
 * the view it was left on (a tower, a floor, a comparison); pressing the tab of the page on show
 * takes it back to its start.
 */
export default function Dock() {
  const { go, searchOf, warm } = useNav()
  const { pathname, search } = useLocation()
  const here = idFor(pathname)
  const at = TABS.findIndex((t) => t.id === here)
  // every tab clicks, like the buttons on the Location page
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

  return (
    <nav
      aria-label="Sections"
      className="dock fixed left-1/2 z-75 w-[min(calc(100vw-1rem),26rem)] -translate-x-1/2 rounded-[1.1rem] border border-ivory/10 bg-forest-950/75 p-1 text-ivory shadow-[0_24px_60px_-24px_rgb(0_0_0/0.8)] backdrop-blur-xl backdrop-saturate-150 roomy:w-[min(calc(100vw-2rem),46rem)] lg:w-auto"
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-gold/45 to-transparent" />
      <div className="relative">
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
                  onPointerEnter={() => warm(t.id)}
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
    </nav>
  )
}
