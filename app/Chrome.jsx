import { SECTIONS } from '../data/content'
import { Mark } from '../art/Brand'
import { useNav, isPage, SECTION_IDS } from './nav'

// The frame around every section page: the menu, the home mark and, along the foot, where the
// visitor is. Pages are changed from the menu.
export default function Chrome() {
  const { route, go, tone } = useNav()
  if (!isPage(route)) return null

  const i = SECTION_IDS.indexOf(route)
  const left = Array.isArray(tone) ? tone[0] : tone
  const ink = `transition-colors duration-700 ${left === 'light' ? 'text-forest-900' : 'text-ivory'}`

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div className="absolute inset-x-0 top-0 flex h-[var(--chrome-top)] items-center px-[var(--gutter)]">
        <button onClick={() => go('menu')} className={`group pointer-events-auto flex items-center gap-3 py-2 ${ink}`} aria-label="Open menu">
          <span className="flex w-7 flex-col gap-[6px]">
            <span className="h-px w-full bg-current transition-transform duration-500 group-hover:scale-x-75 origin-left" />
            <span className="h-px w-2/3 bg-current transition-transform duration-500 group-hover:scale-x-150 origin-left" />
          </span>
          <span className="label">Menu</span>
        </button>

        <button onClick={() => go('landing')} className="pointer-events-auto absolute left-1/2 w-9 -translate-x-1/2 text-gold transition-transform duration-500 hover:scale-110 md:w-10" aria-label="Home">
          <Mark />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex h-[var(--chrome-bot)] items-center px-[var(--gutter)]">
        <div className={`label flex items-center gap-4 opacity-80 ${ink}`}>
          {i >= 0 && (
            <span className="font-display text-base tracking-normal">
              {String(i + 1).padStart(2, '0')}
              <span className="opacity-50"> / {String(SECTIONS.length).padStart(2, '0')}</span>
            </span>
          )}
          <span className="hidden h-px w-10 bg-current opacity-40 sm:block" />
          <span className="hidden sm:inline">{SECTIONS[i]?.label}</span>
        </div>
      </div>
    </div>
  )
}
